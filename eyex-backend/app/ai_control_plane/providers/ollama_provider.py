"""Ollama adapter for the πX AI Control Plane.

Supports local and self-hosted models through the Ollama REST API. Uses ``httpx``
so no additional Python dependency is required. Ideal for private enterprise data
and offline deployments.
"""

from __future__ import annotations

import json
import logging
import time
from collections.abc import AsyncIterator
from typing import Any

import httpx

from app.ai_control_plane.providers.base import AIProvider
from app.ai_control_plane.providers.schemas import (
    EmbedRequest,
    EmbedResponse,
    GenerateRequest,
    GenerateResponse,
    ProviderCapability,
    ProviderHealth,
    StreamChunk,
)

logger = logging.getLogger("eyex.ai_control_plane.providers.ollama")

DEFAULT_OLLAMA_MODELS = [
    "llama3.2",
    "llama3.1",
    "mistral",
    "codellama",
    "phi4",
    "qwen2.5",
]


class OllamaProvider(AIProvider):
    """Provider adapter for Ollama local/self-hosted models."""

    def __init__(
        self,
        base_url: str = "http://localhost:11434",
        client: httpx.AsyncClient | None = None,
        timeout: float = 120.0,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        self._client = client
        self._models: list[str] = list(DEFAULT_OLLAMA_MODELS)

    @property
    def name(self) -> str:
        return "ollama"

    @property
    def supported_models(self) -> list[str]:
        return self._models

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(base_url=self._base_url, timeout=self._timeout)
        return self._client

    def _to_ollama_messages(self, messages: list[Any]) -> list[dict[str, str]]:
        return [
            {"role": msg.role if msg.role != "tool" else "assistant", "content": msg.content}
            for msg in messages
            if msg.role in {"system", "user", "assistant", "tool"}
        ]

    async def generate(self, request: GenerateRequest) -> GenerateResponse:
        client = self._get_client()
        payload: dict[str, Any] = {
            "model": request.model,
            "messages": self._merge_messages(self._to_ollama_messages(request.messages)),
            "stream": False,
            "options": {
                "temperature": request.temperature,
            },
        }
        if request.max_tokens is not None:
            payload["options"]["num_predict"] = request.max_tokens
        if request.top_p is not None:
            payload["options"]["top_p"] = request.top_p

        start = time.perf_counter()
        try:
            response = await client.post("/api/chat", json=payload)
            response.raise_for_status()
            data = response.json()
            message = data.get("message", {})
            content = message.get("content", "")
            return GenerateResponse(
                content=content,
                model=request.model,
                provider=self.name,
                input_tokens=data.get("prompt_eval_count", 0),
                output_tokens=data.get("eval_count", 0),
                total_tokens=(data.get("prompt_eval_count", 0) + data.get("eval_count", 0)),
                duration_ms=(time.perf_counter() - start) * 1000,
                finish_reason="stop" if not data.get("done_reason") else data.get("done_reason"),
                raw_response=data,
            )
        except httpx.HTTPError as exc:
            logger.warning("Ollama generate failed: %s", exc)
            raise

    async def stream(self, request: GenerateRequest) -> AsyncIterator[StreamChunk]:
        client = self._get_client()
        payload: dict[str, Any] = {
            "model": request.model,
            "messages": self._merge_messages(self._to_ollama_messages(request.messages)),
            "stream": True,
            "options": {"temperature": request.temperature},
        }
        if request.max_tokens is not None:
            payload["options"]["num_predict"] = request.max_tokens

        try:
            async with client.stream("POST", "/api/chat", json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        event = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    message = event.get("message", {})
                    text = message.get("content", "")
                    done = event.get("done", False)
                    yield StreamChunk(
                        content=text,
                        finish_reason="stop" if done else None,
                    )
        except httpx.HTTPError as exc:
            logger.warning("Ollama stream failed: %s", exc)
            raise

    async def embed(self, request: EmbedRequest) -> EmbedResponse:
        client = self._get_client()
        model = request.model or "nomic-embed-text"
        start = time.perf_counter()
        try:
            embeddings: list[list[float]] = []
            for text in request.texts:
                payload = {"model": model, "prompt": text}
                response = await client.post("/api/embeddings", json=payload)
                response.raise_for_status()
                data = response.json()
                embeddings.append(data.get("embedding", []))
            return EmbedResponse(
                embeddings=embeddings,
                model=model,
                provider=self.name,
                total_tokens=0,
                duration_ms=(time.perf_counter() - start) * 1000,
            )
        except httpx.HTTPError as exc:
            logger.warning("Ollama embed failed: %s", exc)
            raise

    async def health(self) -> ProviderHealth:
        client = self._get_client()
        start = time.perf_counter()
        try:
            response = await client.get("/api/tags")
            response.raise_for_status()
            data = response.json()
            available = [m.get("name", "") for m in data.get("models", [])]
            return ProviderHealth(
                provider=self.name,
                healthy=True,
                latency_ms=(time.perf_counter() - start) * 1000,
                models_available=available or self.supported_models,
            )
        except Exception as exc:  # noqa: BLE001
            return ProviderHealth(
                provider=self.name,
                healthy=False,
                latency_ms=(time.perf_counter() - start) * 1000,
                error=str(exc),
                models_available=[],
            )

    def capabilities(self) -> list[ProviderCapability]:
        return [
            ProviderCapability(
                name="llama3.2",
                supported=True,
                max_context_tokens=128_000,
                cost_per_1k_input_usd=0.0,
                cost_per_1k_output_usd=0.0,
            ),
            ProviderCapability(
                name="nomic-embed-text",
                supported=True,
                max_context_tokens=8_192,
                cost_per_1k_input_usd=0.0,
            ),
        ]

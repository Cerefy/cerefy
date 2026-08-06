"""Anthropic Claude adapter for the πX AI Control Plane.

Uses ``httpx`` to call the Anthropic Messages API. No extra package dependency is
required beyond the existing ``httpx`` project dependency.
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
from app.config import get_settings

logger = logging.getLogger("eyex.ai_control_plane.providers.anthropic")

DEFAULT_ANTHROPIC_MODELS = [
    "claude-3-5-sonnet-20241022",
    "claude-3-opus-20240229",
    "claude-3-sonnet-20240229",
    "claude-3-haiku-20240307",
]


class AnthropicProvider(AIProvider):
    """Provider adapter for Anthropic Claude."""

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str = "https://api.anthropic.com",
        client: httpx.AsyncClient | None = None,
        timeout: float = 60.0,
    ) -> None:
        settings = get_settings()
        self._api_key = api_key or settings.openai_api_key  # fallback to generic key env
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        self._client = client
        self._models: list[str] = list(DEFAULT_ANTHROPIC_MODELS)

    @property
    def name(self) -> str:
        return "anthropic"

    @property
    def supported_models(self) -> list[str]:
        return self._models

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self._base_url,
                timeout=self._timeout,
                headers={
                    "x-api-key": self._api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
            )
        return self._client

    def _to_anthropic_messages(
        self,
        messages: list[Any],
    ) -> tuple[str | None, list[dict[str, str]]]:
        """Return (system_prompt, conversation_messages)."""
        system_parts = [m.content for m in messages if m.role == "system"]
        system = "\n\n".join(system_parts) if system_parts else None
        conversation = [
            {"role": m.role if m.role != "tool" else "assistant", "content": m.content}
            for m in messages
            if m.role in {"user", "assistant", "tool"}
        ]
        return system, conversation

    async def generate(self, request: GenerateRequest) -> GenerateResponse:
        client = self._get_client()
        system, conversation = self._to_anthropic_messages(request.messages)
        payload: dict[str, Any] = {
            "model": request.model,
            "messages": self._merge_messages(conversation),
            "max_tokens": request.max_tokens or 4096,
            "temperature": request.temperature,
        }
        if system:
            payload["system"] = system
        if request.top_p is not None:
            payload["top_p"] = request.top_p

        start = time.perf_counter()
        try:
            response = await client.post("/v1/messages", json=payload)
            response.raise_for_status()
            data = response.json()
            content = "".join(
                block.get("text", "")
                for block in data.get("content", [])
                if block.get("type") == "text"
            )
            usage = data.get("usage", {})
            return GenerateResponse(
                content=content,
                model=request.model,
                provider=self.name,
                input_tokens=usage.get("input_tokens", 0),
                output_tokens=usage.get("output_tokens", 0),
                total_tokens=usage.get("input_tokens", 0) + usage.get("output_tokens", 0),
                duration_ms=(time.perf_counter() - start) * 1000,
                finish_reason=data.get("stop_reason"),
                raw_response=data,
            )
        except httpx.HTTPError as exc:
            logger.warning("Anthropic generate failed: %s", exc)
            raise

    async def stream(self, request: GenerateRequest) -> AsyncIterator[StreamChunk]:
        client = self._get_client()
        system, conversation = self._to_anthropic_messages(request.messages)
        payload: dict[str, Any] = {
            "model": request.model,
            "messages": self._merge_messages(conversation),
            "max_tokens": request.max_tokens or 4096,
            "temperature": request.temperature,
            "stream": True,
        }
        if system:
            payload["system"] = system

        try:
            async with client.stream("POST", "/v1/messages", json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line or not line.startswith("data: "):
                        continue
                    data_str = line[6:]
                    if data_str == "[DONE]":
                        break
                    try:
                        event = json.loads(data_str)
                    except json.JSONDecodeError:
                        continue
                    event_type = event.get("type")
                    if event_type == "content_block_delta":
                        delta = event.get("delta", {})
                        text = delta.get("text", "")
                        yield StreamChunk(content=text)
                    elif event_type == "message_stop":
                        yield StreamChunk(content="", finish_reason="stop")
        except httpx.HTTPError as exc:
            logger.warning("Anthropic stream failed: %s", exc)
            raise

    async def embed(self, request: EmbedRequest) -> EmbedResponse:
        raise NotImplementedError("Anthropic does not provide a public embeddings API")

    async def health(self) -> ProviderHealth:
        client = self._get_client()
        start = time.perf_counter()
        try:
            response = await client.get("/v1/models")
            response.raise_for_status()
            return ProviderHealth(
                provider=self.name,
                healthy=True,
                latency_ms=(time.perf_counter() - start) * 1000,
                models_available=self.supported_models,
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
                name="claude-3-5-sonnet-20241022",
                supported=True,
                max_context_tokens=200_000,
                cost_per_1k_input_usd=0.003,
                cost_per_1k_output_usd=0.015,
            ),
            ProviderCapability(
                name="claude-3-opus-20240229",
                supported=True,
                max_context_tokens=200_000,
                cost_per_1k_input_usd=0.015,
                cost_per_1k_output_usd=0.075,
            ),
        ]

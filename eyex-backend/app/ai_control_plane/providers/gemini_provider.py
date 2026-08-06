"""Google Gemini adapter for the πX AI Control Plane.

Uses ``httpx`` to call the Gemini ``generateContent`` REST API. Supports generate,
stream, and embed (via ``embedContent``). No extra Google package dependency is
required.
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

logger = logging.getLogger("eyex.ai_control_plane.providers.gemini")

DEFAULT_GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "text-embedding-004",
]


class GeminiProvider(AIProvider):
    """Provider adapter for Google Gemini."""

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str = "https://generativelanguage.googleapis.com",
        client: httpx.AsyncClient | None = None,
        timeout: float = 60.0,
    ) -> None:
        settings = get_settings()
        self._api_key = api_key or settings.openai_api_key
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        self._client = client
        self._models: list[str] = list(DEFAULT_GEMINI_MODELS)

    @property
    def name(self) -> str:
        return "gemini"

    @property
    def supported_models(self) -> list[str]:
        return self._models

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self._base_url,
                timeout=self._timeout,
                headers={"x-goog-api-key": self._api_key},
            )
        return self._client

    def _to_gemini_contents(self, messages: list[Any]) -> list[dict[str, Any]]:
        contents: list[dict[str, Any]] = []
        for msg in messages:
            role = "user" if msg.role in {"user", "system", "tool"} else "model"
            contents.append({"role": role, "parts": [{"text": msg.content}]})
        return self._merge_contents(contents)

    def _merge_contents(self, contents: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not contents:
            return []
        merged: list[dict[str, Any]] = [contents[0]]
        for item in contents[1:]:
            if item["role"] == merged[-1]["role"]:
                merged[-1]["parts"].extend(item["parts"])
            else:
                merged.append(item)
        return merged

    def _api_model(self, model: str) -> str:
        """Return the fully-qualified model name for the Gemini API."""
        if model.startswith("models/"):
            return model
        return f"models/{model}"

    async def generate(self, request: GenerateRequest) -> GenerateResponse:
        client = self._get_client()
        contents = self._to_gemini_contents(request.messages)
        payload: dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": request.temperature,
                "maxOutputTokens": request.max_tokens or 4096,
            },
        }
        if request.top_p is not None:
            payload["generationConfig"]["topP"] = request.top_p

        model = self._api_model(request.model)
        url = f"/v1beta/{model}:generateContent"

        start = time.perf_counter()
        try:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            candidates = data.get("candidates", [])
            if not candidates:
                return GenerateResponse(
                    content="",
                    model=request.model,
                    provider=self.name,
                    duration_ms=(time.perf_counter() - start) * 1000,
                )
            candidate = candidates[0]
            content_parts = candidate.get("content", {}).get("parts", [])
            text = "".join(part.get("text", "") for part in content_parts)
            usage = data.get("usageMetadata", {})
            finish = candidate.get("finishReason")
            return GenerateResponse(
                content=text,
                model=request.model,
                provider=self.name,
                input_tokens=usage.get("promptTokenCount", 0),
                output_tokens=usage.get("candidatesTokenCount", 0),
                total_tokens=usage.get("totalTokenCount", 0),
                duration_ms=(time.perf_counter() - start) * 1000,
                finish_reason=finish,
                raw_response=data,
            )
        except httpx.HTTPError as exc:
            logger.warning("Gemini generate failed: %s", exc)
            raise

    async def stream(self, request: GenerateRequest) -> AsyncIterator[StreamChunk]:
        client = self._get_client()
        contents = self._to_gemini_contents(request.messages)
        payload: dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": request.temperature,
                "maxOutputTokens": request.max_tokens or 4096,
            },
        }
        model = self._api_model(request.model)
        url = f"/v1beta/{model}:streamGenerateContent"

        try:
            async with client.stream("POST", url, json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        event = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    candidates = event.get("candidates", [])
                    if not candidates:
                        continue
                    candidate = candidates[0]
                    parts = candidate.get("content", {}).get("parts", [])
                    text = "".join(part.get("text", "") for part in parts)
                    finish = candidate.get("finishReason")
                    yield StreamChunk(content=text, finish_reason=finish)
        except httpx.HTTPError as exc:
            logger.warning("Gemini stream failed: %s", exc)
            raise

    async def embed(self, request: EmbedRequest) -> EmbedResponse:
        client = self._get_client()
        model = request.model or "text-embedding-004"
        url = f"/v1beta/{self._api_model(model)}:embedContent"
        start = time.perf_counter()
        try:
            embeddings: list[list[float]] = []
            total_tokens = 0
            for text in request.texts:
                payload = {"content": {"parts": [{"text": text}]}}
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
                embedding = data.get("embedding", {}).get("values", [])
                embeddings.append(embedding)
                total_tokens += data.get("usageMetadata", {}).get("totalTokenCount", 0)
            return EmbedResponse(
                embeddings=embeddings,
                model=model,
                provider=self.name,
                total_tokens=total_tokens,
                duration_ms=(time.perf_counter() - start) * 1000,
            )
        except httpx.HTTPError as exc:
            logger.warning("Gemini embed failed: %s", exc)
            raise

    async def health(self) -> ProviderHealth:
        client = self._get_client()
        start = time.perf_counter()
        try:
            model = self._api_model("gemini-2.5-flash")
            url = f"/v1beta/{model}"
            response = await client.get(url)
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
                name="gemini-2.5-flash",
                supported=True,
                max_context_tokens=1_048_576,
                cost_per_1k_input_usd=0.000075,
                cost_per_1k_output_usd=0.0003,
            ),
            ProviderCapability(
                name="gemini-2.5-pro",
                supported=True,
                max_context_tokens=2_097_152,
                cost_per_1k_input_usd=0.00125,
                cost_per_1k_output_usd=0.005,
            ),
        ]

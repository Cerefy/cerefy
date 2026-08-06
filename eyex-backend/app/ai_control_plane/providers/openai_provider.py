"""OpenAI adapter for the πX AI Control Plane.

Uses the official ``openai`` async client. Supports generate, stream, embed, and
moderation. Compatible with any OpenAI-compatible API endpoint (OpenAI, Azure,
DeepSeek, Kimi, Mistral, Cohere, OpenRouter, etc.) via configuration.
"""

from __future__ import annotations

import logging
import time
from collections.abc import AsyncIterator
from typing import Any

import openai

from app.ai_control_plane.providers.base import AIProvider
from app.ai_control_plane.providers.schemas import (
    EmbedRequest,
    EmbedResponse,
    GenerateRequest,
    GenerateResponse,
    ModerateRequest,
    ModerateResponse,
    ModerationCategory,
    ProviderCapability,
    ProviderHealth,
    StreamChunk,
)
from app.config import get_settings

logger = logging.getLogger("eyex.ai_control_plane.providers.openai")

DEFAULT_OPENAI_MODELS = [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4",
    "gpt-3.5-turbo",
    "text-embedding-3-small",
    "text-embedding-3-large",
    "text-embedding-ada-002",
]


class OpenAIProvider(AIProvider):
    """Provider adapter for OpenAI and OpenAI-compatible APIs."""

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        client: openai.AsyncOpenAI | None = None,
        timeout: float = 60.0,
    ) -> None:
        settings = get_settings()
        self._api_key = api_key or settings.openai_api_key
        self._base_url = base_url or settings.openai_base_url
        self._timeout = timeout
        self._client = client
        self._models: list[str] = list(DEFAULT_OPENAI_MODELS)

    @property
    def name(self) -> str:
        return "openai"

    @property
    def supported_models(self) -> list[str]:
        return self._models

    def _get_client(self) -> openai.AsyncOpenAI:
        if self._client is None:
            kwargs: dict[str, Any] = {"api_key": self._api_key, "timeout": self._timeout}
            if self._base_url:
                kwargs["base_url"] = self._base_url
            self._client = openai.AsyncOpenAI(**kwargs)
        return self._client

    def _to_openai_messages(self, messages: list[Any]) -> Any:
        return [
            {"role": msg.role, "content": msg.content}
            for msg in messages
            if msg.role in {"system", "user", "assistant", "tool"}
        ]

    async def generate(self, request: GenerateRequest) -> GenerateResponse:
        client = self._get_client()
        start = time.perf_counter()
        try:
            response = await client.chat.completions.create(
                model=request.model,
                messages=self._to_openai_messages(request.messages),
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                top_p=request.top_p,
                stream=False,
            )
            choice = response.choices[0]
            content = choice.message.content or ""
            usage = response.usage
            duration = (time.perf_counter() - start) * 1000
            return GenerateResponse(
                content=content,
                model=request.model,
                provider=self.name,
                input_tokens=usage.prompt_tokens if usage else 0,
                output_tokens=usage.completion_tokens if usage else 0,
                total_tokens=usage.total_tokens if usage else 0,
                duration_ms=duration,
                finish_reason=choice.finish_reason,
                raw_response=response.model_dump() if hasattr(response, "model_dump") else {},
            )
        except openai.OpenAIError as exc:
            logger.warning("OpenAI generate failed: %s", exc)
            raise

    async def stream(self, request: GenerateRequest) -> AsyncIterator[StreamChunk]:
        client = self._get_client()
        try:
            stream_response = await client.chat.completions.create(
                model=request.model,
                messages=self._to_openai_messages(request.messages),
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                top_p=request.top_p,
                stream=True,
            )
            async for chunk in stream_response:
                delta = chunk.choices[0].delta.content or "" if chunk.choices else ""
                finish = chunk.choices[0].finish_reason if chunk.choices else None
                yield StreamChunk(content=delta, finish_reason=finish)
        except openai.OpenAIError as exc:
            logger.warning("OpenAI stream failed: %s", exc)
            raise

    async def embed(self, request: EmbedRequest) -> EmbedResponse:
        client = self._get_client()
        start = time.perf_counter()
        model = request.model or "text-embedding-3-small"
        try:
            response = await client.embeddings.create(
                model=model,
                input=request.texts,
            )
            embeddings = [item.embedding for item in response.data]
            duration = (time.perf_counter() - start) * 1000
            return EmbedResponse(
                embeddings=embeddings,
                model=model,
                provider=self.name,
                total_tokens=response.usage.total_tokens if response.usage else 0,
                duration_ms=duration,
            )
        except openai.OpenAIError as exc:
            logger.warning("OpenAI embed failed: %s", exc)
            raise

    async def moderate(self, request: ModerateRequest) -> ModerateResponse:
        client = self._get_client()
        start = time.perf_counter()
        try:
            response = await client.moderations.create(input=request.text)
            result = response.results[0]
            category_flags = result.categories.model_dump()
            category_scores = result.category_scores.model_dump()
            categories = [
                ModerationCategory(
                    category=k,
                    flagged=bool(v),
                    score=category_scores.get(k, 0.0),
                )
                for k, v in category_flags.items()
            ]
            return ModerateResponse(
                flagged=result.flagged,
                categories=categories,
                provider=self.name,
                model="text-moderation-latest",
                duration_ms=(time.perf_counter() - start) * 1000,
            )
        except openai.OpenAIError as exc:
            logger.warning("OpenAI moderate failed: %s", exc)
            raise

    async def health(self) -> ProviderHealth:
        client = self._get_client()
        start = time.perf_counter()
        try:
            await client.models.list()
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
                name="gpt-4o",
                supported=True,
                max_context_tokens=128_000,
                cost_per_1k_input_usd=0.005,
                cost_per_1k_output_usd=0.015,
            ),
            ProviderCapability(
                name="gpt-4o-mini",
                supported=True,
                max_context_tokens=128_000,
                cost_per_1k_input_usd=0.00015,
                cost_per_1k_output_usd=0.0006,
            ),
            ProviderCapability(
                name="text-embedding-3-small",
                supported=True,
                max_context_tokens=8_191,
                cost_per_1k_input_usd=0.00002,
            ),
        ]

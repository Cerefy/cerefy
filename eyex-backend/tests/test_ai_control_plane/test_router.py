"""Tests for the πX AI Control Plane intelligent router."""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any

import pytest

from app.ai_control_plane.providers.base import AIProvider
from app.ai_control_plane.providers.registry import ProviderRegistry
from app.ai_control_plane.providers.schemas import (
    EmbedRequest,
    EmbedResponse,
    GenerateRequest,
    GenerateResponse,
    ModerateRequest,
    ModerateResponse,
    StreamChunk,
)
from app.ai_control_plane.router.registry import ModelCapabilityRegistry
from app.ai_control_plane.router.router import IntelligentModelRouter, RouterExhaustedError
from app.ai_control_plane.router.schemas import ModelCapability, RoutingRequest


class _FakeProvider(AIProvider):
    """In-memory provider for router tests."""

    provider_id = "fake"

    @property
    def name(self) -> str:
        return self.provider_id

    @property
    def supported_models(self) -> list[str]:
        return list(self._supports)

    def __init__(self, supports: list[str] | None = None, fail: bool = False) -> None:
        self._supports = set(supports or [])
        self.fail = fail
        self.generate_call: GenerateRequest | None = None
        self.embed_call: EmbedRequest | None = None

    async def generate(self, request: GenerateRequest) -> GenerateResponse:
        if self.fail:
            raise RuntimeError("fake generate failure")
        self.generate_call = request
        return GenerateResponse(
            content="fake",
            model=request.model,
            provider=self.provider_id,
        )

    async def stream(self, request: GenerateRequest) -> AsyncIterator[StreamChunk]:
        if self.fail:
            raise RuntimeError("fake stream failure")
        self.generate_call = request
        yield StreamChunk(content="fake")

    async def embed(self, request: EmbedRequest) -> EmbedResponse:
        if self.fail:
            raise RuntimeError("fake embed failure")
        self.embed_call = request
        return EmbedResponse(
            embeddings=[[0.1, 0.2]],
            model=request.model or "fake-model",
            provider=self.provider_id,
        )

    async def moderate(self, request: ModerateRequest) -> ModerateResponse:
        return ModerateResponse(
            flagged=False,
            categories=[],
            provider=self.provider_id,
            model="fake-model",
        )

    async def health(self) -> Any:
        from app.ai_control_plane.providers.schemas import ProviderHealth

        return ProviderHealth(provider=self.provider_id, healthy=True)


def _make_registry() -> ProviderRegistry:
    registry = ProviderRegistry()
    registry.register(_FakeProvider(supports=["gpt-4.1", "text-embedding-3-large"]))
    return registry


def _make_capability_registry() -> ModelCapabilityRegistry:
    catalog = [
        ModelCapability(
            provider="fake",
            model="gpt-4.1",
            max_context_tokens=128_000,
            cost_per_1k_input_usd=0.002,
            cost_per_1k_output_usd=0.008,
            avg_latency_ms=800,
            quality_score=0.92,
            availability_score=0.99,
            supports_streaming=True,
            supports_tools=True,
            supports_json_mode=True,
            privacy_level="enterprise",
        ),
        ModelCapability(
            provider="fake",
            model="text-embedding-3-large",
            max_context_tokens=8_192,
            cost_per_1k_input_usd=0.00013,
            avg_latency_ms=120,
            quality_score=0.88,
            availability_score=0.99,
            supports_embedding=True,
            privacy_level="enterprise",
        ),
    ]
    return ModelCapabilityRegistry(catalog=catalog)


def test_scoring_prefers_quality_for_coding() -> None:
    registry = _make_capability_registry()
    registry.register(
        ModelCapability(
            provider="fake",
            model="cheap-model",
            max_context_tokens=128_000,
            cost_per_1k_input_usd=0.0001,
            cost_per_1k_output_usd=0.0004,
            avg_latency_ms=250,
            quality_score=0.50,
            availability_score=0.99,
        )
    )
    router = IntelligentModelRouter(
        provider_registry=_make_registry(),
        capability_registry=registry,
    )
    decision = router.route_sync(RoutingRequest(task_type="coding"))
    assert decision.chosen_model == "gpt-4.1"
    assert any(
        score.model == "gpt-4.1" and score.quality_score == 0.92
        for score in decision.scores
    )


def test_scoring_prefers_latency_for_realtime() -> None:
    registry = _make_capability_registry()
    registry.register(
        ModelCapability(
            provider="fake",
            model="fast-model",
            max_context_tokens=128_000,
            cost_per_1k_input_usd=0.001,
            cost_per_1k_output_usd=0.004,
            avg_latency_ms=100,
            quality_score=0.60,
            availability_score=0.99,
            supports_streaming=True,
        )
    )
    router = IntelligentModelRouter(
        provider_registry=_make_registry(),
        capability_registry=registry,
    )
    decision = router.route_sync(RoutingRequest(task_type="realtime"))
    assert decision.chosen_model == "fast-model"


def test_scoring_prefers_cost_for_summarization() -> None:
    registry = _make_capability_registry()
    registry.register(
        ModelCapability(
            provider="fake",
            model="cheap-model",
            max_context_tokens=128_000,
            cost_per_1k_input_usd=0.00001,
            cost_per_1k_output_usd=0.00004,
            avg_latency_ms=400,
            quality_score=0.70,
            availability_score=0.99,
            supports_streaming=True,
        )
    )
    router = IntelligentModelRouter(
        provider_registry=_make_registry(),
        capability_registry=registry,
    )
    decision = router.route_sync(RoutingRequest(task_type="summarization"))
    assert decision.chosen_model == "cheap-model"


def test_privacy_filter_excludes_lower_privacy() -> None:
    registry = _make_capability_registry()
    registry.register(
        ModelCapability(
            provider="fake",
            model="public-model",
            max_context_tokens=128_000,
            quality_score=0.95,
            availability_score=0.99,
            privacy_level="public",
        )
    )
    router = IntelligentModelRouter(
        provider_registry=_make_registry(),
        capability_registry=registry,
    )
    decision = router.route_sync(
        RoutingRequest(task_type="enterprise", privacy_level="critical")
    )
    assert decision.chosen_model != "public-model"


def test_avoid_providers_deprioritized() -> None:
    registry = _make_capability_registry()
    registry.register(
        ModelCapability(
            provider="avoided",
            model="avoided-model",
            max_context_tokens=128_000,
            quality_score=0.99,
            availability_score=0.99,
        )
    )
    provider_registry = ProviderRegistry()
    provider_registry.register(
        _FakeProvider(supports=["gpt-4.1", "avoided-model"])
    )
    router = IntelligentModelRouter(
        provider_registry=provider_registry,
        capability_registry=registry,
    )
    decision = router.route_sync(RoutingRequest(avoid_providers=["avoided"]))
    assert decision.chosen_provider != "avoided"


def test_preferred_providers_boosted() -> None:
    registry = _make_capability_registry()
    registry.register(
        ModelCapability(
            provider="preferred",
            model="preferred-model",
            max_context_tokens=128_000,
            quality_score=0.95,
            availability_score=0.99,
            supports_streaming=True,
        )
    )
    provider_registry = ProviderRegistry()
    provider_registry.register(_FakeProvider(supports=["gpt-4.1", "preferred-model"]))
    router = IntelligentModelRouter(
        provider_registry=provider_registry,
        capability_registry=registry,
    )
    decision = router.route_sync(RoutingRequest(preferred_providers=["preferred"]))
    assert decision.chosen_provider == "preferred"


def test_explicit_model_selects_matching_candidate() -> None:
    router = IntelligentModelRouter(
        provider_registry=_make_registry(),
        capability_registry=_make_capability_registry(),
    )
    decision = router.route_sync(
        RoutingRequest(model="text-embedding-3-large", task_type="embedding")
    )
    assert decision.chosen_model == "text-embedding-3-large"


def test_route_cache_returns_same_decision() -> None:
    router = IntelligentModelRouter(
        provider_registry=_make_registry(),
        capability_registry=_make_capability_registry(),
        route_cache_ttl_seconds=60.0,
    )
    req = RoutingRequest(task_type="coding")
    decision1 = router.route_sync(req)
    decision2 = router.route_sync(req)
    assert decision1 is decision2


def test_invalidate_cache_clears_decision() -> None:
    router = IntelligentModelRouter(
        provider_registry=_make_registry(),
        capability_registry=_make_capability_registry(),
        route_cache_ttl_seconds=60.0,
    )
    req = RoutingRequest(task_type="coding")
    decision1 = router.route_sync(req)
    router.invalidate_cache()
    decision2 = router.route_sync(req)
    assert decision1 is not decision2
    assert decision1.chosen_model == decision2.chosen_model


@pytest.mark.asyncio
async def test_generate_routes_to_best_provider() -> None:
    provider = _FakeProvider(supports=["gpt-4.1"])
    provider_registry = ProviderRegistry()
    provider_registry.register(provider)
    router = IntelligentModelRouter(
        provider_registry=provider_registry,
        capability_registry=_make_capability_registry(),
    )
    response = await router.generate(
        messages=[{"role": "user", "content": "hi"}], task_type="coding"
    )
    assert response.provider == "fake"
    assert response.model == "gpt-4.1"
    assert provider.generate_call is not None
    assert provider.generate_call.messages[0].content == "hi"


@pytest.mark.asyncio
async def test_generate_falls_back_on_failure() -> None:
    failing = _FakeProvider(supports=["gpt-4.1"], fail=True)
    passing = _FakeProvider(supports=["gpt-4.1"])
    provider_registry = ProviderRegistry()
    provider_registry.register(failing)
    provider_registry.register(passing)

    # Both providers have same capability; ranking may be arbitrary, so ensure
    # one fails and the other succeeds overall.
    router = IntelligentModelRouter(
        provider_registry=provider_registry,
        capability_registry=_make_capability_registry(),
    )
    response = await router.generate(
        messages=[{"role": "user", "content": "hi"}], task_type="coding"
    )
    assert response.provider == "fake"


@pytest.mark.asyncio
async def test_generate_exhausted_raises() -> None:
    failing = _FakeProvider(supports=["gpt-4.1"], fail=True)
    provider_registry = ProviderRegistry()
    provider_registry.register(failing)
    router = IntelligentModelRouter(
        provider_registry=provider_registry,
        capability_registry=_make_capability_registry(),
    )
    with pytest.raises(RouterExhaustedError):
        await router.generate(messages=[{"role": "user", "content": "hi"}], task_type="coding")


@pytest.mark.asyncio
async def test_embed_routes_to_embedding_model() -> None:
    provider = _FakeProvider(supports=["text-embedding-3-large"])
    provider_registry = ProviderRegistry()
    provider_registry.register(provider)
    router = IntelligentModelRouter(
        provider_registry=provider_registry,
        capability_registry=_make_capability_registry(),
    )
    response = await router.embed(texts=["hello"])
    assert response.provider == "fake"
    assert response.model == "text-embedding-3-large"
    assert provider.embed_call is not None
    assert provider.embed_call.texts == ["hello"]


@pytest.mark.asyncio
async def test_stream_routes_to_provider() -> None:
    provider = _FakeProvider(supports=["gpt-4.1"])
    provider_registry = ProviderRegistry()
    provider_registry.register(provider)
    router = IntelligentModelRouter(
        provider_registry=provider_registry,
        capability_registry=_make_capability_registry(),
    )
    stream = await router.stream(messages=[{"role": "user", "content": "hi"}], task_type="chat")
    chunks = [chunk async for chunk in stream]
    assert chunks
    assert chunks[0].content == "fake"


# Monkey-patch synchronous route helper for tests where async is unnecessary.
def _route_sync(self: IntelligentModelRouter, request: RoutingRequest) -> Any:
    import asyncio

    return asyncio.run(self.route(request))


IntelligentModelRouter.route_sync = _route_sync

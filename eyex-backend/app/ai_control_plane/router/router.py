"""Intelligent model router for the πX AI Control Plane.

The router selects the best provider/model pair for a request using the scoring
engine, executes the request through the provider interface, and falls back to
the next-best candidate when the primary fails.  Route decisions are cached with
a TTL to avoid recomputing on every call.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import time
from typing import Any

from app.ai_control_plane.providers.registry import (
    ProviderRegistry,
    get_provider_registry,
)
from app.ai_control_plane.providers.schemas import (
    EmbedRequest,
    EmbedResponse,
    GenerateRequest,
    GenerateResponse,
    GenerateStream,
    ModerateRequest,
    ModerateResponse,
    ProviderMessage,
)
from app.ai_control_plane.router.registry import (
    ModelCapabilityRegistry,
    get_default_capability_registry,
)
from app.ai_control_plane.router.schemas import (
    ModelCapability,
    RouteScore,
    RoutingDecision,
    RoutingRequest,
)
from app.ai_control_plane.router.scoring import RouterScoringEngine

logger = logging.getLogger(__name__)


class IntelligentModelRouter:
    """Route AI requests to the best available provider.

    The router depends on:

    - ``ProviderRegistry``: adapts provider-specific APIs to the normalized
      πX provider interface.
    - ``ModelCapabilityRegistry``: stores static metadata about provider/model
      pairs (context, cost, latency, quality, features).
    - ``RouterScoringEngine``: ranks candidates according to request
      constraints and task profile.

    Usage::

        router = IntelligentModelRouter()
        response = await router.generate(messages=[...], task_type="coding")
    """

    def __init__(
        self,
        provider_registry: ProviderRegistry | None = None,
        capability_registry: ModelCapabilityRegistry | None = None,
        route_cache_ttl_seconds: float = 60.0,
    ) -> None:
        self._provider_registry = provider_registry or get_provider_registry()
        self._capability_registry = capability_registry or get_default_capability_registry()
        self._scoring_engine = RouterScoringEngine(self._capability_registry)
        self._route_cache: dict[str, _CachedDecision] = {}
        self._route_cache_ttl_seconds = max(0.0, route_cache_ttl_seconds)
        self._cache_lock = asyncio.Lock()

    # ------------------------------------------------------------------ #
    # Public routing API
    # ------------------------------------------------------------------ #
    async def generate(
        self,
        messages: list[dict[str, Any]],
        model: str | None = None,
        task_type: str = "general",
        **kwargs: Any,
    ) -> GenerateResponse:
        """Generate a chat completion through the best provider."""
        request = self._build_routing_request(messages, model, task_type, **kwargs)
        return await self._execute_generate(request)

    async def stream(
        self,
        messages: list[dict[str, Any]],
        model: str | None = None,
        task_type: str = "general",
        **kwargs: Any,
    ) -> GenerateStream:
        """Stream a chat completion through the best provider."""
        kwargs["stream"] = True
        request = self._build_routing_request(messages, model, task_type, **kwargs)
        return await self._execute_stream(request)

    async def embed(
        self,
        texts: list[str],
        model: str | None = None,
        task_type: str = "embedding",
        **kwargs: Any,
    ) -> EmbedResponse:
        """Create embeddings through the best embedding provider."""
        request = self._build_routing_request(
            messages=[],
            model=model,
            task_type=task_type,
            required_capabilities=kwargs.pop("required_capabilities", ["embedding"]),
            **kwargs,
        )
        return await self._execute_embed(request, texts)

    async def moderate(
        self,
        text: str,
        model: str | None = None,
        **kwargs: Any,
    ) -> ModerateResponse:
        """Moderate content through the best moderation provider."""
        request = self._build_routing_request(
            messages=[],
            model=model,
            task_type="moderation",
            required_capabilities=kwargs.pop("required_capabilities", ["moderation"]),
            **kwargs,
        )
        return await self._execute_moderate(request, text)

    async def route(self, request: RoutingRequest) -> RoutingDecision:
        """Return a routing decision (cached or freshly computed)."""
        cache_key = self._cache_key(request)
        now = time.monotonic()
        cached = self._route_cache.get(cache_key)
        if cached and (now - cached.created_at) < self._route_cache_ttl_seconds:
            return cached.decision

        candidates = self._capability_registry.list_models(
            provider=None,
            task=request.task_type,
            required_capabilities=request.required_capabilities,
            available_only=True,
        )
        # If an explicit model alias is requested, restrict to matching candidates.
        if request.model:
            candidates = [
                c for c in candidates
                if c.model == request.model or request.model in c.aliases
            ]
        # If a provider claims support for the model, ensure it is represented.
        candidates = self._ensure_provider_candidates(request, candidates)

        scores = self._scoring_engine.score(request, candidates)

        decision = self._build_decision(request, scores)

        if self._route_cache_ttl_seconds > 0:
            self._route_cache[cache_key] = _CachedDecision(decision=decision, created_at=now)
        return decision

    def invalidate_cache(self) -> None:
        """Clear the route decision cache."""
        self._route_cache.clear()

    # ------------------------------------------------------------------ #
    # Execution helpers
    # ------------------------------------------------------------------ #
    async def _execute_generate(self, request: RoutingRequest) -> GenerateResponse:
        decision = await self.route(request)
        chain = [(decision.chosen_provider, decision.chosen_model)] + decision.fallback_chain
        last_error: Exception | None = None
        for provider_id, model in chain:
            provider = self._provider_registry.get(provider_id)
            if provider is None:
                continue
            try:
                generate_request = self._build_generate_request(request, model)
                return await provider.generate(generate_request)
            except Exception as exc:  # noqa: BLE001
                last_error = exc
                logger.warning("Provider %s/%s generate failed: %s", provider_id, model, exc)
                self._deprioritize(provider_id, model)
        msg = f"All providers exhausted for model {request.model}"
        raise RouterExhaustedError(msg) from last_error

    async def _execute_stream(self, request: RoutingRequest) -> GenerateStream:
        decision = await self.route(request)
        chain = [(decision.chosen_provider, decision.chosen_model)] + decision.fallback_chain
        last_error: Exception | None = None
        for provider_id, model in chain:
            provider = self._provider_registry.get(provider_id)
            if provider is None:
                continue
            try:
                generate_request = self._build_generate_request(request, model)
                return provider.stream(generate_request)
            except Exception as exc:  # noqa: BLE001
                last_error = exc
                logger.warning("Provider %s/%s stream failed: %s", provider_id, model, exc)
                self._deprioritize(provider_id, model)
        msg = f"All providers exhausted for model {request.model}"
        raise RouterExhaustedError(msg) from last_error

    async def _execute_embed(self, request: RoutingRequest, texts: list[str]) -> EmbedResponse:
        decision = await self.route(request)
        chain = [(decision.chosen_provider, decision.chosen_model)] + decision.fallback_chain
        last_error: Exception | None = None
        for provider_id, model in chain:
            provider = self._provider_registry.get(provider_id)
            if provider is None:
                continue
            try:
                embed_request = EmbedRequest(texts=texts, model=model, task_type=request.task_type)
                return await provider.embed(embed_request)
            except Exception as exc:  # noqa: BLE001
                last_error = exc
                logger.warning("Provider %s/%s embed failed: %s", provider_id, model, exc)
                self._deprioritize(provider_id, model)
        msg = f"All providers exhausted for model {request.model}"
        raise RouterExhaustedError(msg) from last_error

    async def _execute_moderate(self, request: RoutingRequest, text: str) -> ModerateResponse:
        decision = await self.route(request)
        chain = [(decision.chosen_provider, decision.chosen_model)] + decision.fallback_chain
        last_error: Exception | None = None
        for provider_id, model in chain:
            provider = self._provider_registry.get(provider_id)
            if provider is None:
                continue
            try:
                moderate_request = ModerateRequest(text=text, categories=[])
                return await provider.moderate(moderate_request)
            except Exception as exc:  # noqa: BLE001
                last_error = exc
                logger.warning("Provider %s/%s moderate failed: %s", provider_id, model, exc)
                self._deprioritize(provider_id, model)
        msg = f"All providers exhausted for model {request.model}"
        raise RouterExhaustedError(msg) from last_error

    # ------------------------------------------------------------------ #
    # Internal helpers
    # ------------------------------------------------------------------ #
    def _build_routing_request(
        self,
        messages: list[dict[str, Any]],
        model: str | None,
        task_type: str,
        **kwargs: Any,
    ) -> RoutingRequest:
        return RoutingRequest(
            model=model,
            messages=messages,
            task_type=task_type,
            privacy_level=kwargs.get("privacy_level", "standard"),
            budget_usd=kwargs.get("budget_usd"),
            latency_requirement_ms=kwargs.get("latency_requirement_ms"),
            required_capabilities=kwargs.get("required_capabilities", []),
            preferred_providers=kwargs.get("preferred_providers", []),
            avoid_providers=kwargs.get("avoid_providers", []),
            prefer_quality=kwargs.get("prefer_quality", False),
            prefer_cost=kwargs.get("prefer_cost", False),
            prefer_latency=kwargs.get("prefer_latency", False),
            stream=kwargs.get("stream", False),
            temperature=kwargs.get("temperature", 0.3),
            max_tokens=kwargs.get("max_tokens"),
            top_p=kwargs.get("top_p"),
            response_format=kwargs.get("response_format"),
            tools=kwargs.get("tools"),
            tool_choice=kwargs.get("tool_choice"),
        )

    def _build_generate_request(
        self,
        request: RoutingRequest,
        model: str,
    ) -> GenerateRequest:
        messages = [
            ProviderMessage(role=msg.get("role", "user"), content=msg.get("content", ""))
            for msg in (request.messages or [])
        ]
        return GenerateRequest(
            messages=messages,
            model=model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            top_p=request.top_p,
            stream=request.stream,
            task_type=request.task_type,
            privacy_level=request.privacy_level,
            budget_usd=request.budget_usd,
            latency_requirement_ms=request.latency_requirement_ms,
            required_capabilities=request.required_capabilities,
        )

    def _ensure_provider_candidates(
        self,
        request: RoutingRequest,
        candidates: list[ModelCapability],
    ) -> list[ModelCapability]:
        if not request.model:
            return candidates
        for provider_id in self._provider_registry.providers_supporting_model(request.model):
            existing = next(
                (
                    c
                    for c in candidates
                    if c.provider == provider_id
                    and (c.model == request.model or request.model in c.aliases)
                ),
                None,
            )
            if not existing:
                capability = self._capability_registry.get(provider_id, request.model)
                if capability:
                    candidates.append(capability)
                else:
                    candidates.append(_generic_capability(provider_id, request.model))
        return candidates

    def _build_decision(self, request: RoutingRequest, scores: list[RouteScore]) -> RoutingDecision:
        if not scores:
            chosen = (request.model, "openai") if request.model else ("gpt-4.1", "openai")
            return RoutingDecision(
                request=request,
                chosen_provider=chosen[1],
                chosen_model=chosen[0],
                reason="no candidates matched; using fallback",
            )

        best = scores[0]
        fallback_chain = [(s.provider, s.model) for s in scores[1:]]
        return RoutingDecision(
            request=request,
            chosen_provider=best.provider,
            chosen_model=best.model,
            fallback_chain=fallback_chain,
            scores=scores,
            reason=f"best score {best.total_score} ({best.reason})",
        )

    def _deprioritize(self, provider_id: str, model: str) -> None:
        capability = self._capability_registry.get(provider_id, model)
        if capability and capability.is_available:
            capability.availability_score = max(0.0, capability.availability_score - 0.10)

    def _cache_key(self, request: RoutingRequest) -> str:
        stable = request.model_dump(exclude={"messages"}, mode="json")
        if request.messages:
            content = json.dumps(request.messages, sort_keys=True)
            stable["messages_hash"] = hashlib.sha256(content.encode()).hexdigest()[:16]
        return hashlib.sha256(json.dumps(stable, sort_keys=True).encode()).hexdigest()


class RouterExhaustedError(Exception):
    """Raised when no provider in the fallback chain can satisfy a request."""


class _CachedDecision:
    """TTL-cached routing decision."""

    def __init__(self, decision: RoutingDecision, created_at: float) -> None:
        self.decision = decision
        self.created_at = created_at


# ---------------------------------------------------------------------- #
# Helpers
# ---------------------------------------------------------------------- #
def _generic_capability(provider: str, model: str) -> ModelCapability:
    return ModelCapability(
        provider=provider,
        model=model,
        max_context_tokens=128_000,
        quality_score=0.5,
        availability_score=0.8,
        privacy_level="standard",
    )

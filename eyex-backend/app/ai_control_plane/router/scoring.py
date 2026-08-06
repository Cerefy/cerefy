"""Scoring engine for the πX AI Control Plane router.

The engine evaluates provider/model candidates against a routing request.  Each
candidate is scored on cost, latency, quality, availability, privacy, and
capability fit.  Task type weights determine the relative importance of each
dimension.
"""

from __future__ import annotations

import math

from app.ai_control_plane.router.registry import ModelCapabilityRegistry
from app.ai_control_plane.router.schemas import (
    ModelCapability,
    RouteScore,
    RoutingRequest,
)


class RouterScoringEngine:
    """Score candidates for a routing request.

    The engine normalizes each dimension to ``[0, 1]`` and applies task-specific
    weights.  Lower cost and latency are better; higher quality, availability,
    privacy, and capability fit are better.
    """

    # Weight profiles keyed by task type.  Values are normalized internally.
    _TASK_WEIGHTS: dict[str, dict[str, float]] = {
        "coding": {
            "quality": 0.45,
            "latency": 0.15,
            "cost": 0.15,
            "availability": 0.15,
            "privacy": 0.05,
            "capability": 0.05,
        },
        "realtime": {
            "quality": 0.15,
            "latency": 0.50,
            "cost": 0.10,
            "availability": 0.15,
            "privacy": 0.05,
            "capability": 0.05,
        },
        "summarization": {
            "quality": 0.25,
            "latency": 0.15,
            "cost": 0.40,
            "availability": 0.10,
            "privacy": 0.05,
            "capability": 0.05,
        },
        "analysis": {
            "quality": 0.40,
            "latency": 0.10,
            "cost": 0.15,
            "availability": 0.15,
            "privacy": 0.10,
            "capability": 0.10,
        },
        "enterprise": {
            "quality": 0.25,
            "latency": 0.10,
            "cost": 0.10,
            "availability": 0.20,
            "privacy": 0.25,
            "capability": 0.10,
        },
        "embedding": {
            "quality": 0.30,
            "latency": 0.20,
            "cost": 0.30,
            "availability": 0.10,
            "privacy": 0.05,
            "capability": 0.05,
        },
        "moderation": {
            "quality": 0.30,
            "latency": 0.20,
            "cost": 0.20,
            "availability": 0.15,
            "privacy": 0.10,
            "capability": 0.05,
        },
        "classification": {
            "quality": 0.35,
            "latency": 0.15,
            "cost": 0.20,
            "availability": 0.15,
            "privacy": 0.10,
            "capability": 0.05,
        },
        "creative": {
            "quality": 0.45,
            "latency": 0.10,
            "cost": 0.15,
            "availability": 0.15,
            "privacy": 0.05,
            "capability": 0.10,
        },
        "chat": {
            "quality": 0.30,
            "latency": 0.20,
            "cost": 0.20,
            "availability": 0.15,
            "privacy": 0.10,
            "capability": 0.05,
        },
        "general": {
            "quality": 0.25,
            "latency": 0.20,
            "cost": 0.25,
            "availability": 0.15,
            "privacy": 0.10,
            "capability": 0.05,
        },
        "rerank": {
            "quality": 0.35,
            "latency": 0.20,
            "cost": 0.20,
            "availability": 0.15,
            "privacy": 0.05,
            "capability": 0.05,
        },
    }

    _PRIVACY_RANKING: dict[str, int] = {
        "public": 0,
        "standard": 1,
        "enterprise": 2,
        "critical": 3,
    }

    def __init__(self, registry: ModelCapabilityRegistry | None = None) -> None:
        self._registry = registry or ModelCapabilityRegistry()

    def score(
        self,
        request: RoutingRequest,
        candidates: list[ModelCapability],
    ) -> list[RouteScore]:
        """Score every candidate and return a sorted list (best first)."""
        if not candidates:
            return []

        scores: list[RouteScore] = []
        for capability in candidates:
            score = self._score_one(request, capability)
            if score:
                scores.append(score)

        scores.sort(key=lambda s: s.total_score, reverse=True)
        return scores

    def _score_one(
        self,
        request: RoutingRequest,
        capability: ModelCapability,
    ) -> RouteScore | None:
        weights = self._weights_for(request)
        reasons: list[str] = []

        cost_score = self._cost_score(request, capability)
        latency_score = self._latency_score(request, capability)
        quality_score = capability.quality_score
        availability_score = capability.availability_score
        capability_score = self._capability_score(request, capability)
        privacy_score = self._privacy_score(request, capability)

        # Hard filters
        if request.required_capabilities and capability_score < 0.5:
            return None
        if (
            request.latency_requirement_ms
            and capability.avg_latency_ms
            and capability.avg_latency_ms > request.latency_requirement_ms
        ):
            return None
        if (
            request.budget_usd is not None
            and self._estimate_cost(request, capability) > request.budget_usd
        ):
            return None
        if (
            self._PRIVACY_RANKING.get(capability.privacy_level, 0)
            < self._PRIVACY_RANKING.get(request.privacy_level, 0)
        ):
            return None

        # Preference adjustments
        if (
            request.preferred_providers
            and capability.provider in request.preferred_providers
        ):
            availability_score = min(1.0, availability_score + 0.05)
            reasons.append("preferred provider")
        if (
            request.avoid_providers
            and capability.provider in request.avoid_providers
        ):
            availability_score = max(0.0, availability_score - 0.20)
            reasons.append("avoided provider")
        if request.prefer_quality:
            quality_score = min(1.0, quality_score + 0.05)
            reasons.append("quality preferred")
        if request.prefer_cost:
            cost_score = min(1.0, cost_score + 0.05)
            reasons.append("cost preferred")
        if request.prefer_latency:
            latency_score = min(1.0, latency_score + 0.05)
            reasons.append("latency preferred")

        total_score = round(
            weights["cost"] * cost_score
            + weights["latency"] * latency_score
            + weights["quality"] * quality_score
            + weights["availability"] * availability_score
            + weights["privacy"] * privacy_score
            + weights["capability"] * capability_score,
            4,
        )

        return RouteScore(
            provider=capability.provider,
            model=capability.model,
            total_score=total_score,
            cost_score=round(cost_score, 4),
            latency_score=round(latency_score, 4),
            quality_score=round(quality_score, 4),
            availability_score=round(availability_score, 4),
            capability_score=round(capability_score, 4),
            privacy_score=round(privacy_score, 4),
            reason="; ".join(reasons) or "best fit",
        )

    def _weights_for(self, request: RoutingRequest) -> dict[str, float]:
        default = self._TASK_WEIGHTS["general"]
        raw = self._TASK_WEIGHTS.get(request.task_type, default).copy()
        if request.prefer_quality:
            raw["quality"] += 0.10
            raw["cost"] = max(0.0, raw["cost"] - 0.05)
            raw["latency"] = max(0.0, raw["latency"] - 0.05)
        if request.prefer_cost:
            raw["cost"] += 0.10
            raw["quality"] = max(0.0, raw["quality"] - 0.05)
            raw["latency"] = max(0.0, raw["latency"] - 0.05)
        if request.prefer_latency:
            raw["latency"] += 0.10
            raw["quality"] = max(0.0, raw["quality"] - 0.05)
            raw["cost"] = max(0.0, raw["cost"] - 0.05)
        total = sum(raw.values()) or 1.0
        return {k: v / total for k, v in raw.items()}

    def _cost_score(self, request: RoutingRequest, capability: ModelCapability) -> float:
        if not capability.cost_per_1k_input_usd:
            return 1.0
        estimate = self._estimate_cost(request, capability)
        # Lower cost is better; normalize against a sensible ceiling.
        ceiling = max(0.01, request.budget_usd or 0.05)
        if request.budget_usd and estimate > request.budget_usd:
            return 0.0
        ratio = estimate / ceiling
        return max(0.0, min(1.0, 1.0 - math.log1p(ratio * 10) / math.log1p(10)))

    def _estimate_cost(self, request: RoutingRequest, capability: ModelCapability) -> float:
        # Estimate assuming 1k input + 0.5k output tokens.
        input_cost = (capability.cost_per_1k_input_usd or 0.0) * 1.0
        output_cost = (capability.cost_per_1k_output_usd or 0.0) * 0.5
        return input_cost + output_cost

    def _latency_score(self, request: RoutingRequest, capability: ModelCapability) -> float:
        if not capability.avg_latency_ms:
            return 0.5
        if request.latency_requirement_ms:
            if capability.avg_latency_ms > request.latency_requirement_ms:
                return 0.0
            ratio = capability.avg_latency_ms / request.latency_requirement_ms
            return max(0.0, min(1.0, 1.0 - ratio))
        # Normalize against a 2s ceiling for open-ended requests.
        ratio = capability.avg_latency_ms / 2000.0
        return max(0.0, min(1.0, 1.0 - ratio))

    def _capability_score(self, request: RoutingRequest, capability: ModelCapability) -> float:
        if not request.required_capabilities:
            return 1.0
        checks: list[bool] = []
        for cap in request.required_capabilities:
            if cap == "vision":
                checks.append(capability.supports_vision)
            elif cap == "tools":
                checks.append(capability.supports_tools)
            elif cap == "json":
                checks.append(capability.supports_json_mode)
            elif cap == "streaming":
                checks.append(capability.supports_streaming)
            elif cap == "embedding":
                checks.append(capability.supports_embedding)
            elif cap == "moderation":
                checks.append(capability.supports_moderation)
            elif cap == "classification":
                checks.append(capability.supports_classification)
            else:
                checks.append(capability.model == cap or cap in capability.aliases)
        if not checks:
            return 1.0
        return sum(checks) / len(checks)

    def _privacy_score(self, request: RoutingRequest, capability: ModelCapability) -> float:
        request_rank = self._PRIVACY_RANKING.get(request.privacy_level, 1)
        capability_rank = self._PRIVACY_RANKING.get(capability.privacy_level, 0)
        if capability_rank >= request_rank:
            return 1.0
        if capability_rank == request_rank - 1:
            return 0.5
        return 0.0

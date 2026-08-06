"""Pydantic schemas for the πX AI Control Plane intelligent router.

The router operates on top of the provider interface.  Requests are scored
against registered model capabilities, then dispatched to the best provider
with a fallback chain.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class RoutingRequest(BaseModel):
    """A request for the router to choose a model/provider.

    The router uses the declared task type, budget, latency requirements,
    privacy level, and required capabilities to pick the best provider.
    """

    model: str | None = None
    messages: list[dict[str, Any]] | None = None
    task_type: str = "general"
    privacy_level: Literal["public", "standard", "enterprise", "critical"] = "standard"
    budget_usd: float | None = Field(None, ge=0.0)
    latency_requirement_ms: int | None = Field(None, ge=1)
    required_capabilities: list[str] = Field(default_factory=list)
    preferred_providers: list[str] = Field(default_factory=list)
    avoid_providers: list[str] = Field(default_factory=list)
    prefer_quality: bool = False
    prefer_cost: bool = False
    prefer_latency: bool = False
    stream: bool = False
    temperature: float = Field(0.3, ge=0.0, le=2.0)
    max_tokens: int | None = Field(None, ge=1)
    top_p: float | None = Field(None, ge=0.0, le=1.0)
    response_format: str | None = None
    tools: list[dict[str, Any]] | None = None
    tool_choice: str | None = None

    @field_validator("task_type", mode="before")
    @classmethod
    def _normalize_task_type(cls, value: str) -> str:
        known = {
            "chat",
            "coding",
            "analysis",
            "summarization",
            "realtime",
            "embedding",
            "moderation",
            "classification",
            "rerank",
            "enterprise",
            "creative",
            "general",
        }
        return value if value in known else "general"


class ModelCapability(BaseModel):
    """Static capability metadata for a provider/model pair."""

    provider: str
    model: str
    aliases: list[str] = Field(default_factory=list)
    max_context_tokens: int
    cost_per_1k_input_usd: float | None = None
    cost_per_1k_output_usd: float | None = None
    avg_latency_ms: float | None = None
    quality_score: float = Field(0.5, ge=0.0, le=1.0)
    availability_score: float = Field(1.0, ge=0.0, le=1.0)
    supports_streaming: bool = False
    supports_vision: bool = False
    supports_tools: bool = False
    supports_json_mode: bool = False
    supports_embedding: bool = False
    supports_moderation: bool = False
    supports_classification: bool = False
    privacy_level: Literal["public", "standard", "enterprise", "critical"] = "standard"
    is_available: bool = True


class RouteScore(BaseModel):
    """Per-candidate breakdown produced by the scoring engine."""

    provider: str
    model: str
    total_score: float = Field(..., ge=0.0, le=1.0)
    cost_score: float = Field(..., ge=0.0, le=1.0)
    latency_score: float = Field(..., ge=0.0, le=1.0)
    quality_score: float = Field(..., ge=0.0, le=1.0)
    availability_score: float = Field(..., ge=0.0, le=1.0)
    capability_score: float = Field(..., ge=0.0, le=1.0)
    privacy_score: float = Field(..., ge=0.0, le=1.0)
    reason: str = ""


class RoutingDecision(BaseModel):
    """The final routing decision with a fallback chain."""

    request: RoutingRequest
    chosen_provider: str
    chosen_model: str
    fallback_chain: list[tuple[str, str]] = Field(default_factory=list)
    scores: list[RouteScore] = Field(default_factory=list)
    reason: str = ""
    cached: bool = False


class RouterHealth(BaseModel):
    """Aggregated router health across providers."""

    provider: str
    healthy: bool
    latency_ms: float | None = None
    availability_score: float = Field(0.0, ge=0.0, le=1.0)
    last_error: str | None = None

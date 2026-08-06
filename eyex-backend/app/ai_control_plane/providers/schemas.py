"""Pydantic schemas for the πX AI Control Plane provider interface.

All provider adapters operate on these request/response models so that higher-level
components (router, security, observability) never depend on a specific provider's
payload shape.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any, Literal

from pydantic import BaseModel, Field


class ProviderMessage(BaseModel):
    """A single message in a chat-style completion request."""

    role: Literal["system", "user", "assistant", "tool"] = "user"
    content: str = Field(..., min_length=0)


class GenerateRequest(BaseModel):
    """Request to generate a text completion from an AI provider."""

    messages: list[ProviderMessage] = Field(..., min_length=1)
    model: str = Field(..., min_length=1)
    temperature: float = Field(0.3, ge=0.0, le=2.0)
    max_tokens: int | None = Field(None, ge=1)
    top_p: float | None = Field(None, ge=0.0, le=1.0)
    stream: bool = False
    # Task metadata used by the intelligent router
    task_type: str | None = None
    privacy_level: Literal["public", "standard", "enterprise", "critical"] = "standard"
    budget_usd: float | None = Field(None, ge=0.0)
    latency_requirement_ms: int | None = Field(None, ge=1)
    required_capabilities: list[str] = Field(default_factory=list)


class GenerateResponse(BaseModel):
    """Normalized response from any AI provider."""

    content: str
    model: str
    provider: str
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    duration_ms: float = 0.0
    finish_reason: str | None = None
    raw_response: dict[str, Any] | None = Field(default=None, exclude=True)


class StreamChunk(BaseModel):
    """Normalized chunk for streaming completions."""

    content: str = ""
    finish_reason: str | None = None
    input_tokens: int | None = None
    output_tokens: int | None = None


class EmbedRequest(BaseModel):
    """Request to create embeddings for one or more texts."""

    texts: list[str] = Field(..., min_length=1)
    model: str | None = None
    task_type: str | None = None


class EmbedResponse(BaseModel):
    """Normalized embedding response."""

    embeddings: list[list[float]]
    model: str
    provider: str
    total_tokens: int = 0
    duration_ms: float = 0.0


class RerankRequest(BaseModel):
    """Request to rerank a list of documents against a query."""

    query: str
    documents: list[str]
    model: str | None = None
    top_k: int | None = None


class RerankResult(BaseModel):
    """A single reranked document result."""

    index: int
    score: float
    text: str


class RerankResponse(BaseModel):
    """Normalized reranking response."""

    results: list[RerankResult]
    model: str
    provider: str
    duration_ms: float = 0.0


class ModerateRequest(BaseModel):
    """Request to moderate content for safety/policy violations."""

    text: str = Field(..., min_length=1)
    categories: list[str] = Field(default_factory=list)


class ModerationCategory(BaseModel):
    """Per-category moderation result."""

    category: str
    flagged: bool
    score: float = Field(..., ge=0.0, le=1.0)


class ModerateResponse(BaseModel):
    """Normalized moderation response."""

    flagged: bool
    categories: list[ModerationCategory]
    provider: str
    model: str
    duration_ms: float = 0.0


class ClassifyRequest(BaseModel):
    """Request to classify text into a set of labels."""

    text: str = Field(..., min_length=1)
    labels: list[str] = Field(..., min_length=1)
    model: str | None = None


class ClassifyResponse(BaseModel):
    """Normalized classification response."""

    label: str
    scores: dict[str, float]
    confidence: float = Field(..., ge=0.0, le=1.0)
    provider: str
    model: str
    duration_ms: float = 0.0


class ProviderCapability(BaseModel):
    """Capability advertised by a provider/model."""

    name: str
    supported: bool
    max_context_tokens: int | None = None
    cost_per_1k_input_usd: float | None = None
    cost_per_1k_output_usd: float | None = None


class ProviderHealth(BaseModel):
    """Health status for a provider adapter."""

    provider: str
    healthy: bool
    latency_ms: float | None = None
    error: str | None = None
    models_available: list[str] = Field(default_factory=list)


# Type aliases for streaming return types
GenerateStream = AsyncIterator[StreamChunk]

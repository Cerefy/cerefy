"""Universal AI Provider interface for the πX AI Control Plane.

No business logic depends on a specific model or provider. All adapters implement
the same contract so the Intelligent Model Router can swap providers transparently.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from typing import Any

from app.ai_control_plane.providers.schemas import (
    ClassifyRequest,
    ClassifyResponse,
    EmbedRequest,
    EmbedResponse,
    GenerateRequest,
    GenerateResponse,
    ModerateRequest,
    ModerateResponse,
    ProviderCapability,
    ProviderHealth,
    RerankRequest,
    RerankResponse,
    StreamChunk,
)


class AIProvider(ABC):
    """Abstract base class that every πX AI provider adapter must implement."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique provider identifier (e.g., 'openai', 'anthropic', 'ollama')."""

    @property
    @abstractmethod
    def supported_models(self) -> list[str]:
        """List of model identifiers this adapter can serve."""

    @abstractmethod
    async def generate(self, request: GenerateRequest) -> GenerateResponse:
        """Generate a non-streaming text completion."""

    @abstractmethod
    def stream(self, request: GenerateRequest) -> AsyncIterator[StreamChunk]:
        """Generate a streaming text completion, yielding normalized chunks."""

    @abstractmethod
    async def embed(self, request: EmbedRequest) -> EmbedResponse:
        """Create embeddings for one or more input texts."""

    async def rerank(self, request: RerankRequest) -> RerankResponse:
        """Rerank documents against a query. Optional capability."""
        raise NotImplementedError(f"{self.name} does not support reranking")

    async def moderate(self, request: ModerateRequest) -> ModerateResponse:
        """Moderate content for safety/policy violations. Optional capability."""
        raise NotImplementedError(f"{self.name} does not support moderation")

    async def classify(self, request: ClassifyRequest) -> ClassifyResponse:
        """Classify text into labels. Optional capability."""
        raise NotImplementedError(f"{self.name} does not support classification")

    async def summarize(self, text: str, max_length: int = 200) -> str:
        """Summarize a longer text into a shorter form. Optional convenience method."""
        raise NotImplementedError(f"{self.name} does not support summarization")

    async def extract(self, text: str, schema: dict[str, Any]) -> dict[str, Any]:
        """Extract structured data from text according to a schema. Optional."""
        raise NotImplementedError(f"{self.name} does not support extraction")

    async def translate(
        self,
        text: str,
        target_language: str,
        source_language: str | None = None,
    ) -> str:
        """Translate text. Optional convenience method."""
        raise NotImplementedError(f"{self.name} does not support translation")

    async def evaluate(
        self,
        request: str,
        response: str,
        criteria: list[str] | None = None,
    ) -> dict[str, Any]:
        """Evaluate a response against a request and optional criteria. Optional."""
        raise NotImplementedError(f"{self.name} does not support evaluation")

    @abstractmethod
    async def health(self) -> ProviderHealth:
        """Return the current health status of the provider adapter."""

    def capabilities(self) -> list[ProviderCapability]:
        """Advertise which operations are supported for each model."""
        return [
            ProviderCapability(
                name=model,
                supported=True,
            )
            for model in self.supported_models
        ]

    def supports(self, operation: str, model: str | None = None) -> bool:
        """Check whether this provider supports a named operation.

        Args:
            operation: One of the method names (generate, stream, embed, rerank, ...).
            model: Optional model identifier to narrow the check.
        """
        if model is not None and model not in self.supported_models:
            return False
        method = getattr(self, operation, None)
        if method is None:
            return False
        # Optional methods raise NotImplementedError by default.
        core_ops = {"generate", "stream", "embed", "health"}
        return getattr(method, "__isabstractmethod__", False) or operation in core_ops

    def _merge_messages(self, messages: list[dict[str, str]]) -> list[dict[str, str]]:
        """Merge consecutive messages with the same role to keep provider payloads clean."""
        if not messages:
            return []
        merged: list[dict[str, str]] = [messages[0]]
        for msg in messages[1:]:
            if msg["role"] == merged[-1]["role"]:
                merged[-1]["content"] += f"\n\n{msg['content']}"
            else:
                merged.append(msg)
        return merged

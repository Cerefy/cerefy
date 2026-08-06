"""Model capability registry for the πX AI Control Plane.

The registry stores static metadata about provider/model pairs (context window,
cost, latency, quality, supported features).  It is used by the scoring engine
to pick the best candidate for a request.
"""

from __future__ import annotations

from app.ai_control_plane.router.schemas import ModelCapability


class ModelCapabilityRegistry:
    """Registry of known model capabilities.

    The registry can be initialized with a default catalog and extended at
    runtime via ``register()``.  Lookup is provider-agnostic when a request
    only specifies a model alias.
    """

    DEFAULT_CATALOG: list[ModelCapability] = [
        # OpenAI
        ModelCapability(
            provider="openai",
            model="gpt-4.1",
            aliases=["gpt-4.1", "openai-gpt-4.1"],
            max_context_tokens=1_000_000,
            cost_per_1k_input_usd=0.002,
            cost_per_1k_output_usd=0.008,
            avg_latency_ms=800,
            quality_score=0.92,
            availability_score=0.99,
            supports_streaming=True,
            supports_vision=True,
            supports_tools=True,
            supports_json_mode=True,
            privacy_level="enterprise",
        ),
        ModelCapability(
            provider="openai",
            model="gpt-4.1-mini",
            aliases=["gpt-4.1-mini", "openai-gpt-4.1-mini"],
            max_context_tokens=1_000_000,
            cost_per_1k_input_usd=0.0004,
            cost_per_1k_output_usd=0.0016,
            avg_latency_ms=450,
            quality_score=0.82,
            availability_score=0.99,
            supports_streaming=True,
            supports_vision=True,
            supports_tools=True,
            supports_json_mode=True,
            privacy_level="enterprise",
        ),
        ModelCapability(
            provider="openai",
            model="gpt-4.1-nano",
            aliases=["gpt-4.1-nano", "openai-gpt-4.1-nano"],
            max_context_tokens=1_000_000,
            cost_per_1k_input_usd=0.0001,
            cost_per_1k_output_usd=0.0004,
            avg_latency_ms=250,
            quality_score=0.72,
            availability_score=0.99,
            supports_streaming=True,
            supports_vision=True,
            supports_tools=True,
            supports_json_mode=True,
            privacy_level="enterprise",
        ),
        ModelCapability(
            provider="openai",
            model="text-embedding-3-large",
            aliases=["text-embedding-3-large", "openai-text-embedding-3-large"],
            max_context_tokens=8_192,
            cost_per_1k_input_usd=0.00013,
            cost_per_1k_output_usd=0.0,
            avg_latency_ms=120,
            quality_score=0.88,
            availability_score=0.99,
            supports_embedding=True,
            privacy_level="enterprise",
        ),
        # Anthropic
        ModelCapability(
            provider="anthropic",
            model="claude-3-7-sonnet-20250219",
            aliases=["claude-3-7-sonnet", "claude-sonnet-4", "anthropic-claude-3-7-sonnet"],
            max_context_tokens=200_000,
            cost_per_1k_input_usd=0.003,
            cost_per_1k_output_usd=0.015,
            avg_latency_ms=700,
            quality_score=0.94,
            availability_score=0.98,
            supports_streaming=True,
            supports_vision=True,
            supports_tools=True,
            supports_json_mode=True,
            privacy_level="enterprise",
        ),
        ModelCapability(
            provider="anthropic",
            model="claude-3-5-haiku-20241022",
            aliases=["claude-3-5-haiku", "anthropic-claude-3-5-haiku"],
            max_context_tokens=200_000,
            cost_per_1k_input_usd=0.0008,
            cost_per_1k_output_usd=0.004,
            avg_latency_ms=350,
            quality_score=0.80,
            availability_score=0.98,
            supports_streaming=True,
            supports_vision=True,
            supports_tools=True,
            supports_json_mode=True,
            privacy_level="enterprise",
        ),
        # Google Gemini
        ModelCapability(
            provider="gemini",
            model="gemini-2.5-flash",
            aliases=["gemini-2.5-flash", "google-gemini-2.5-flash"],
            max_context_tokens=1_000_000,
            cost_per_1k_input_usd=0.00015,
            cost_per_1k_output_usd=0.00060,
            avg_latency_ms=300,
            quality_score=0.85,
            availability_score=0.97,
            supports_streaming=True,
            supports_vision=True,
            supports_tools=True,
            supports_json_mode=True,
            privacy_level="standard",
        ),
        ModelCapability(
            provider="gemini",
            model="gemini-2.5-pro",
            aliases=["gemini-2.5-pro", "google-gemini-2.5-pro"],
            max_context_tokens=2_000_000,
            cost_per_1k_input_usd=0.00125,
            cost_per_1k_output_usd=0.010,
            avg_latency_ms=650,
            quality_score=0.93,
            availability_score=0.97,
            supports_streaming=True,
            supports_vision=True,
            supports_tools=True,
            supports_json_mode=True,
            privacy_level="standard",
        ),
        ModelCapability(
            provider="gemini",
            model="text-embedding-004",
            aliases=["text-embedding-004", "gemini-embedding"],
            max_context_tokens=8_192,
            cost_per_1k_input_usd=0.0001,
            cost_per_1k_output_usd=0.0,
            avg_latency_ms=100,
            quality_score=0.80,
            availability_score=0.97,
            supports_embedding=True,
            privacy_level="standard",
        ),
        # Ollama (local)
        ModelCapability(
            provider="ollama",
            model="llama3.3",
            aliases=["llama3.3", "ollama-llama3.3"],
            max_context_tokens=128_000,
            cost_per_1k_input_usd=0.0,
            cost_per_1k_output_usd=0.0,
            avg_latency_ms=600,
            quality_score=0.78,
            availability_score=0.90,
            supports_streaming=True,
            supports_tools=True,
            privacy_level="critical",
        ),
        ModelCapability(
            provider="ollama",
            model="phi4",
            aliases=["phi4", "ollama-phi4"],
            max_context_tokens=128_000,
            cost_per_1k_input_usd=0.0,
            cost_per_1k_output_usd=0.0,
            avg_latency_ms=500,
            quality_score=0.75,
            availability_score=0.90,
            supports_streaming=True,
            privacy_level="critical",
        ),
    ]

    def __init__(self, catalog: list[ModelCapability] | None = None) -> None:
        self._catalog: dict[str, ModelCapability] = {}
        for capability in catalog or list(self.DEFAULT_CATALOG):
            self.register(capability)

    def register(self, capability: ModelCapability) -> None:
        """Register or overwrite a capability keyed by provider:model and aliases."""
        key = self._key(capability.provider, capability.model)
        self._catalog[key] = capability
        for alias in capability.aliases:
            self._catalog[f"{capability.provider}:{alias}"] = capability
            self._catalog[alias] = capability

    def get(self, provider: str, model: str) -> ModelCapability | None:
        """Lookup a capability by provider and model (or alias)."""
        return self._catalog.get(self._key(provider, model)) or self._catalog.get(model)

    def list_models(
        self,
        provider: str | None = None,
        task: str | None = None,
        required_capabilities: list[str] | None = None,
        available_only: bool = True,
    ) -> list[ModelCapability]:
        """Return capabilities matching the filters.

        Args:
            provider: Optional provider id to filter by.
            task: Optional task type to filter by.
            required_capabilities: Optional capability names that must be supported.
            available_only: When True, exclude ``is_available=False`` entries.
        """
        candidates: list[ModelCapability] = []
        required_capabilities = required_capabilities or []
        for capability in self._catalog.values():
            if provider and capability.provider != provider:
                continue
            if available_only and not capability.is_available:
                continue
            if not all(
                getattr(capability, f"supports_{cap}", False)
                or capability.model == cap
                or cap in capability.aliases
                for cap in required_capabilities
            ):
                continue
            if task == "embedding" and not capability.supports_embedding:
                continue
            if task == "moderation" and not capability.supports_moderation:
                continue
            if task == "classification" and not capability.supports_classification:
                continue
            if (
                task not in {"embedding", "moderation", "classification"}
                and not _is_chat_model(capability)
            ):
                continue
            candidates.append(capability)
        return candidates

    @staticmethod
    def _key(provider: str, model: str) -> str:
        return f"{provider}:{model}"


def _is_chat_model(capability: ModelCapability) -> bool:
    """Heuristic: chat-capable models support streaming, tools, or vision."""
    return capability.supports_streaming or capability.supports_tools or capability.supports_vision


# Global default registry instance
_default_registry: ModelCapabilityRegistry | None = None


def get_default_capability_registry() -> ModelCapabilityRegistry:
    """Return the singleton default capability registry."""
    global _default_registry
    if _default_registry is None:
        _default_registry = ModelCapabilityRegistry()
    return _default_registry


def reset_default_capability_registry() -> None:
    """Reset the singleton default capability registry (useful for tests)."""
    global _default_registry
    _default_registry = None

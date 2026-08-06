"""Registry for discovering and accessing πX AI provider adapters."""

from __future__ import annotations

from collections.abc import Iterator
from typing import TypeVar

from app.ai_control_plane.providers.anthropic_provider import AnthropicProvider
from app.ai_control_plane.providers.base import AIProvider
from app.ai_control_plane.providers.gemini_provider import GeminiProvider
from app.ai_control_plane.providers.ollama_provider import OllamaProvider
from app.ai_control_plane.providers.openai_provider import OpenAIProvider

T = TypeVar("T", bound=AIProvider)


class ProviderRegistry:
    """Central registry of all configured AI provider adapters.

    The registry is intentionally provider-agnostic: consumers ask for a capability
    (e.g., ``generate`` for model ``gpt-4o``) and the registry returns the matching
    adapter. This keeps the router and governance layers decoupled from specific
    providers.
    """

    def __init__(self) -> None:
        self._providers: dict[str, AIProvider] = {}

    def register(self, provider: AIProvider) -> None:
        """Register an adapter instance."""
        self._providers[provider.name] = provider

    def unregister(self, name: str) -> None:
        """Remove a provider from the registry."""
        self._providers.pop(name, None)

    def get(self, name: str) -> AIProvider | None:
        """Fetch a provider adapter by its unique name."""
        return self._providers.get(name)

    def get_for_model(self, model: str) -> AIProvider | None:
        """Return the first registered provider that advertises the given model."""
        for provider in self._providers.values():
            if model in provider.supported_models:
                return provider
        return None

    def list_providers(self) -> list[str]:
        """Return the names of all registered providers."""
        return list(self._providers.keys())

    def __iter__(self) -> Iterator[AIProvider]:
        """Iterate over registered provider adapters."""
        return iter(self._providers.values())

    def providers_supporting(
        self,
        operation: str,
        model: str | None = None,
    ) -> list[AIProvider]:
        """Return providers that support ``operation`` for an optional model."""
        return [
            provider
            for provider in self._providers.values()
            if provider.supports(operation, model=model)
        ]

    def providers_supporting_model(self, model: str) -> list[str]:
        """Return provider ids that advertise support for a given model."""
        return [
            provider.name
            for provider in self._providers.values()
            if model in provider.supported_models
        ]


def create_default_registry() -> ProviderRegistry:
    """Create a registry with the standard set of provider adapters."""
    registry = ProviderRegistry()
    registry.register(OpenAIProvider())
    registry.register(AnthropicProvider())
    registry.register(GeminiProvider())
    registry.register(OllamaProvider())
    return registry


# Global singleton used when no specific registry is injected.
_default_registry: ProviderRegistry | None = None


def get_provider_registry() -> ProviderRegistry:
    """Return the global default provider registry, creating it on first call."""
    global _default_registry
    if _default_registry is None:
        _default_registry = create_default_registry()
    return _default_registry


def reset_provider_registry() -> None:
    """Reset the global registry. Useful for tests."""
    global _default_registry
    _default_registry = None

"""Unit tests for the πX AI Control Plane provider adapters."""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import openai
import pytest

from app.ai_control_plane.providers import (
    AIProvider,
    AnthropicProvider,
    GeminiProvider,
    OllamaProvider,
    OpenAIProvider,
    ProviderRegistry,
    create_default_registry,
    get_provider_registry,
    reset_provider_registry,
)
from app.ai_control_plane.providers.schemas import (
    EmbedRequest,
    GenerateRequest,
    ProviderMessage,
)


class FakeProvider(AIProvider):
    """Minimal fake provider for testing the abstract interface."""

    def __init__(self, name: str = "fake", models: list[str] | None = None) -> None:
        self._name = name
        self._models = models or ["fake-model"]

    @property
    def name(self) -> str:
        return self._name

    @property
    def supported_models(self) -> list[str]:
        return self._models

    async def generate(self, request: GenerateRequest):
        from app.ai_control_plane.providers.schemas import GenerateResponse

        return GenerateResponse(
            content=f"echo: {request.messages[-1].content}",
            model=request.model,
            provider=self.name,
        )

    async def stream(self, request: GenerateRequest) -> AsyncIterator[Any]:
        from app.ai_control_plane.providers.schemas import StreamChunk

        yield StreamChunk(content="echo: ")
        yield StreamChunk(content=request.messages[-1].content)

    async def embed(self, request: EmbedRequest):
        from app.ai_control_plane.providers.schemas import EmbedResponse

        return EmbedResponse(
            embeddings=[[0.1, 0.2, 0.3]] * len(request.texts),
            model=request.model or "fake-embed",
            provider=self.name,
        )

    async def health(self):
        from app.ai_control_plane.providers.schemas import ProviderHealth

        return ProviderHealth(provider=self.name, healthy=True)


def test_provider_registry_register_and_get() -> None:
    registry = ProviderRegistry()
    fake = FakeProvider()
    registry.register(fake)
    assert registry.get("fake") is fake
    assert registry.list_providers() == ["fake"]


def test_provider_registry_get_for_model() -> None:
    registry = ProviderRegistry()
    fake = FakeProvider(models=["model-a"])
    registry.register(fake)
    assert registry.get_for_model("model-a") is fake
    assert registry.get_for_model("model-b") is None


def test_provider_registry_providers_supporting() -> None:
    registry = ProviderRegistry()
    fake = FakeProvider()
    registry.register(fake)
    supporting = registry.providers_supporting("generate", model="fake-model")
    assert supporting == [fake]


def test_create_default_registry() -> None:
    registry = create_default_registry()
    names = registry.list_providers()
    assert "openai" in names
    assert "anthropic" in names
    assert "gemini" in names
    assert "ollama" in names


def test_get_provider_registry_singleton() -> None:
    reset_provider_registry()
    registry_a = get_provider_registry()
    registry_b = get_provider_registry()
    assert registry_a is registry_b


@pytest.mark.anyio
async def test_fake_provider_generate() -> None:
    fake = FakeProvider()
    request = GenerateRequest(
        messages=[ProviderMessage(role="user", content="hello")],
        model="fake-model",
    )
    response = await fake.generate(request)
    assert response.content == "echo: hello"
    assert response.provider == "fake"


@pytest.mark.anyio
async def test_fake_provider_stream() -> None:
    fake = FakeProvider()
    request = GenerateRequest(
        messages=[ProviderMessage(role="user", content="world")],
        model="fake-model",
    )
    chunks = [chunk async for chunk in fake.stream(request)]
    assert "".join(c.content for c in chunks) == "echo: world"


@pytest.mark.anyio
async def test_fake_provider_embed() -> None:
    fake = FakeProvider()
    request = EmbedRequest(texts=["a", "b"])
    response = await fake.embed(request)
    assert len(response.embeddings) == 2
    assert response.provider == "fake"


@pytest.mark.anyio
async def test_openai_provider_generate_success(monkeypatch: pytest.MonkeyPatch) -> None:
    mock_usage = MagicMock(prompt_tokens=10, completion_tokens=5, total_tokens=15)
    mock_choice = MagicMock(
        message=MagicMock(content="Hello from OpenAI"),
        finish_reason="stop",
    )
    mock_response = MagicMock(
        choices=[mock_choice],
        usage=mock_usage,
        model_dump=lambda: {"id": "resp-1"},
    )
    mock_completions = AsyncMock()
    mock_completions.create = AsyncMock(return_value=mock_response)
    mock_client = MagicMock()
    mock_client.chat = MagicMock(completions=mock_completions)

    provider = OpenAIProvider(api_key="test-key", client=mock_client)
    request = GenerateRequest(
        messages=[ProviderMessage(role="user", content="hi")],
        model="gpt-4o-mini",
    )
    response = await provider.generate(request)

    assert response.content == "Hello from OpenAI"
    assert response.provider == "openai"
    assert response.input_tokens == 10
    assert response.output_tokens == 5
    assert response.finish_reason == "stop"


@pytest.mark.anyio
async def test_openai_provider_embed_success(monkeypatch: pytest.MonkeyPatch) -> None:
    mock_data = [MagicMock(embedding=[0.1, 0.2]), MagicMock(embedding=[0.3, 0.4])]
    mock_response = MagicMock(data=mock_data, usage=MagicMock(total_tokens=8))
    mock_embeddings = AsyncMock()
    mock_embeddings.create = AsyncMock(return_value=mock_response)
    mock_client = MagicMock()
    mock_client.embeddings = mock_embeddings

    provider = OpenAIProvider(api_key="test-key", client=mock_client)
    request = EmbedRequest(texts=["one", "two"])
    response = await provider.embed(request)

    assert len(response.embeddings) == 2
    assert response.total_tokens == 8
    assert response.provider == "openai"


@pytest.mark.anyio
async def test_anthropic_provider_generate_success() -> None:
    provider = AnthropicProvider(api_key="test-key", client=None)
    mock_response = AsyncMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json = MagicMock(
        return_value={
            "content": [{"type": "text", "text": "Hello from Claude"}],
            "usage": {"input_tokens": 20, "output_tokens": 10},
            "stop_reason": "end_turn",
        }
    )
    provider._client = MagicMock(post=AsyncMock(return_value=mock_response))

    request = GenerateRequest(
        messages=[ProviderMessage(role="user", content="hi")],
        model="claude-3-haiku-20240307",
    )
    response = await provider.generate(request)

    assert response.content == "Hello from Claude"
    assert response.provider == "anthropic"
    assert response.input_tokens == 20
    assert response.finish_reason == "end_turn"


@pytest.mark.anyio
async def test_gemini_provider_generate_success() -> None:
    provider = GeminiProvider(api_key="test-key", client=None)
    mock_response = AsyncMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json = MagicMock(
        return_value={
            "candidates": [
                {
                    "content": {"parts": [{"text": "Hello from Gemini"}]},
                    "finishReason": "STOP",
                }
            ],
            "usageMetadata": {
                "promptTokenCount": 5,
                "candidatesTokenCount": 3,
                "totalTokenCount": 8,
            },
        }
    )
    provider._client = MagicMock(post=AsyncMock(return_value=mock_response))

    request = GenerateRequest(
        messages=[ProviderMessage(role="user", content="hi")],
        model="gemini-2.5-flash",
    )
    response = await provider.generate(request)

    assert response.content == "Hello from Gemini"
    assert response.provider == "gemini"
    assert response.total_tokens == 8


@pytest.mark.anyio
async def test_ollama_provider_generate_success() -> None:
    provider = OllamaProvider(base_url="http://localhost:11434", client=None)
    mock_response = AsyncMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json = MagicMock(
        return_value={
            "message": {"role": "assistant", "content": "Hello from Ollama"},
            "prompt_eval_count": 12,
            "eval_count": 4,
            "done": True,
            "done_reason": "stop",
        }
    )
    provider._client = MagicMock(post=AsyncMock(return_value=mock_response))

    request = GenerateRequest(
        messages=[ProviderMessage(role="user", content="hi")],
        model="llama3.2",
    )
    response = await provider.generate(request)

    assert response.content == "Hello from Ollama"
    assert response.provider == "ollama"
    assert response.input_tokens == 12
    assert response.output_tokens == 4


@pytest.mark.anyio
async def test_openai_provider_health_unhealthy() -> None:
    mock_client = MagicMock()
    mock_request = MagicMock()
    mock_response = MagicMock()
    mock_response.request = mock_request
    mock_client.models = MagicMock(
        list=AsyncMock(
            side_effect=openai.AuthenticationError("bad key", response=mock_response, body=None),
        ),
    )
    provider = OpenAIProvider(api_key="bad-key", client=mock_client)
    health = await provider.health()
    assert health.provider == "openai"
    assert health.healthy is False
    assert "bad key" in (health.error or "")

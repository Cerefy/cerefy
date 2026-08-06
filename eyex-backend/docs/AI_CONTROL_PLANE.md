# πX AI Control Plane

## Overview

The πX AI Control Plane is the model-independent intelligence infrastructure for EyeX.
No application code communicates directly with AI providers. All AI traffic flows
through the control plane so that models remain replaceable and the πX intelligence
orchestration layer becomes the product moat.

## Architecture

```
Application Layer
        ↓
πX AI Gateway
        ↓
AI Control Plane
        ↓
Intelligent Model Router  ← you are here (Story 2)
        ↓
Provider Adapter Layer    (Story 1)
        ↓
AI Models (OpenAI, Anthropic, Gemini, Ollama, ...)
```

## Provider Interface

Every adapter implements `AIProvider` from `app.ai_control_plane.providers.base`.
The interface is intentionally small and provider-agnostic:

| Method      | Required | Purpose                       |
| ----------- | -------- | ----------------------------- |
| `generate`  | Yes      | Non-streaming chat completion |
| `stream`    | Yes      | Streaming chat completion     |
| `embed`     | Yes      | Text embeddings               |
| `rerank`    | No       | Document reranking            |
| `moderate`  | No       | Content moderation            |
| `classify`  | No       | Text classification           |
| `summarize` | No       | Convenience summarization     |
| `extract`   | No       | Structured extraction         |
| `translate` | No       | Convenience translation       |
| `evaluate`  | No       | Response evaluation           |
| `health`    | Yes      | Adapter health check          |

All inputs/outputs use the normalized Pydantic schemas in
`app.ai_control_plane.providers.schemas`. Higher layers never see provider-specific
payload shapes.

## Supported Providers

| Provider         | Module                  | Cloud / Local | Notes                                                                                            |
| ---------------- | ----------------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| OpenAI           | `openai_provider.py`    | Cloud         | Also works with OpenAI-compatible endpoints (Azure, DeepSeek, Kimi, Mistral, Cohere, OpenRouter) |
| Anthropic Claude | `anthropic_provider.py` | Cloud         | Uses `httpx`; no extra dependency                                                                |
| Google Gemini    | `gemini_provider.py`    | Cloud         | Uses `httpx`; no extra dependency                                                                |
| Ollama           | `ollama_provider.py`    | Local         | For private/enterprise data and offline deployments                                              |

Future providers are added by implementing `AIProvider` and registering the adapter
in `ProviderRegistry`.

## Registry

`ProviderRegistry` discovers adapters by provider name or by model identifier:

```python
from app.ai_control_plane.providers import get_provider_registry

registry = get_provider_registry()
openai = registry.get("openai")
provider = registry.get_for_model("gpt-4o-mini")
```

The default registry is created lazily and contains the four standard adapters.
Use `reset_provider_registry()` in tests to avoid global state leakage.

## Usage Example

```python
from app.ai_control_plane.providers import get_provider_registry
from app.ai_control_plane.providers.schemas import GenerateRequest, ProviderMessage

registry = get_provider_registry()
provider = registry.get_for_model("gpt-4o-mini")

response = await provider.generate(
    GenerateRequest(
        messages=[ProviderMessage(role="user", content="Summarize Q3 revenue")],
        model="gpt-4o-mini",
        task_type="summarization",
        privacy_level="enterprise",
    )
)
print(response.content, response.input_tokens, response.output_tokens)
```

## Intelligent Model Router

`IntelligentModelRouter` (`app.ai_control_plane.router.router`) selects the best
provider/model for every request using the scoring engine, executes the request,
and falls back through the next-best candidates if the primary fails. Route
decisions are cached with TTL so repeated similar requests avoid recomputation.

### Components

- `ModelCapabilityRegistry` — static metadata for provider/model pairs (context
  window, cost, latency, quality, features, privacy level).
- `RouterScoringEngine` — scores candidates on cost, latency, quality,
  availability, capability fit, and privacy. Task type weights make the router
  prefer quality for coding, latency for realtime, cost for summarization, and
  privacy for enterprise workloads.
- `IntelligentModelRouter` — public API for `generate()`, `stream()`, `embed()`,
  and `moderate()` with automatic fallback.

### Routing API

```python
from app.ai_control_plane.router import IntelligentModelRouter

router = IntelligentModelRouter()

# Route to the best model for a coding task
response = await router.generate(
    messages=[{"role": "user", "content": "Review this Python function"}],
    task_type="coding",
    privacy_level="enterprise",
)

# Stream a realtime response
stream = await router.stream(
    messages=[{"role": "user", "content": "Quick status update"}],
    task_type="realtime",
)

# Route to the best embedding provider
embeddings = await router.embed(texts=["document one", "document two"])
```

### Request constraints

- `task_type` — influences scoring weights.
- `privacy_level` — filters out providers below the requested privacy tier.
- `budget_usd` — hard cap on estimated cost.
- `latency_requirement_ms` — hard cap on model latency.
- `required_capabilities` — e.g., `["vision", "tools", "json"]`.
- `preferred_providers` / `avoid_providers` — provider bias.
- `prefer_quality` / `prefer_cost` / `prefer_latency` — explicit preference.

### Fallback

If the chosen provider fails, the router tries the next candidate in the ranked
fallback chain. After each failure, the provider's availability score is lowered
so future routes deprioritize it.

## Design Decisions

- **No provider-specific business logic** in consumers.
- **Normalized schemas** for requests/responses.
- **httpx for non-OpenAI providers** to avoid extra package dependencies.
- **Lazy client initialization** so adapters are cheap to instantiate.
- **Health checks** expose latency and availability for router decisions.
- **Capabilities advertise cost/context** for the scoring engine.
- **Task-specific scoring weights** align model selection with business intent.
- **TTL route cache** reduces scoring overhead for repeated requests.
- **Automatic fallback** improves reliability without consumer code changes.

## Testing

Provider tests live in `tests/test_ai_control_plane/test_providers.py`. Router
tests live in `tests/test_ai_control_plane/test_router.py`. Both use mocked
providers and no real API calls.

Run:

```bash
python -m pytest tests/test_ai_control_plane/ -v
```

## Story Status

- [Done] Story 1: Provider Adapter Layer (OpenAI, Anthropic, Gemini, Ollama)
- [Done] Story 2: Intelligent Model Router + Scoring Engine
- [Pending] Story 3: AI Security Layer
- [Pending] Story 4: Prompt Management Platform
- [Pending] Story 5: Context Management Engine
- [Pending] Story 6: Embedding Router
- [Pending] Story 7: RAG Intelligence Optimization
- [Pending] Story 8: Semantic AI Cache
- [Pending] Story 9: AI Evaluation Engine
- [Pending] Story 10: Cost Optimization Engine
- [Pending] Story 11: AI Observability Engine
- [Pending] Story 12: Enterprise Governance
- [Pending] Story 13: Public πX SDK
- [Pending] Story 14: Multi-Model Intelligence + Automatic Fallback

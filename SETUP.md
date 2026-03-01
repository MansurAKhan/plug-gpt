# Setup Guide

## Requirements

- Python 3.9+
- pip
- Java 11+ (optional, for Java metrics helper)
- Optional: Ollama installed locally for offline fallback

## 1. Install dependencies

```bash
python3 -m pip install -r server_py/requirements.txt
```

## 2. Environment

Create `server_py/.env`:

```env
GROQ_API_KEY=
GROQ_API_URL=https://api.groq.com/openai/v1
GROQ_DEFAULT_MODEL=llama-3.1-70b-versatile

OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=meta-llama/llama-3.1-8b-instruct:free
OPENROUTER_SITE_URL=http://localhost:8000
OPENROUTER_APP_NAME=PlugGPT

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=llama3.1:8b

LLM_PROVIDER_ORDER=groq,openrouter,ollama
LLM_TIMEOUT_SECONDS=60
LLM_DEBUG=false

PORT=8000
```

You only need one working provider to chat. If Groq key fails, routing falls back to OpenRouter then Ollama.

## 3. Start server

```bash
python3 server_py/app.py
```

Visit `http://localhost:8000`.

## 4. (Optional) Local Ollama fallback

Start Ollama and pull one or more models:

```bash
ollama pull llama3.1:8b
ollama pull qwen2.5:7b-instruct
ollama pull mistral:7b-instruct
```

## 5. (Optional) Compile Java helper

```bash
mkdir -p java/build
javac -d java/build java/src/AcademicUtils.java
```

If this is not done, runtime compilation is attempted automatically.

## 6. API endpoints

Core:
- `POST /api/chat`
- `POST /api/tools/explain`
- `POST /api/tools/breakdown`
- `POST /api/tools/math-solve`
- `POST /api/tools/rewrite`
- `POST /api/tools/grammar-fix`
- `POST /api/tools/essay-builder`
- `POST /api/tools/ib-tool`
- `POST /api/tools/text-metrics`

LLM diagnostics:
- `GET /api/llm/health`
- `GET /api/llm/models`
- `POST /api/llm/test`

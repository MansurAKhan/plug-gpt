# PlugGPT (HTML/CSS/JS + Python + JSON + Java)

This project runs as:
- Frontend: static `HTML/CSS/JavaScript` in `/public`
- Backend API: `Python FastAPI` in `/server_py`
- LLM routing: provider fallback (`Groq -> OpenRouter -> Ollama`)
- Configuration: shared `JSON` in `/config`
- Utility integration: `Java` helper in `/java/src/AcademicUtils.java`

## Run

1. Install Python dependencies:

```bash
npm run install:all
```

2. Configure environment:

```bash
cp server_py/.env.example server_py/.env
```

Set at least one provider:
- `GROQ_API_KEY` (hosted)
- `OPENROUTER_API_KEY` (hosted)
- or run local Ollama at `OLLAMA_BASE_URL`

3. Start app:

```bash
npm run dev
```

Open [http://localhost:8000](http://localhost:8000).

## Chat Flow

Chat is now enforced as:
1. Open Chat
2. Select Subject (required)
3. Begin Chatting

Subject selection appears in a blocking modal on `/chat.html` and must be confirmed before sending messages.

## Pages

- `/` Home
- `/chat.html` Open Chat
- `/study-tools.html` Study Tools
- `/writing-tools.html` Writing Tools
- `/ib-tools.html` IB Tools
- `/workspace.html` Workspace

## LLM Diagnostics Endpoints

- `GET /api/llm/health`
- `GET /api/llm/models`
- `POST /api/llm/test`

## Java Utility

The backend can call Java for text metrics.

Optional precompile:

```bash
npm run build:java
```

If Java is unavailable, the backend automatically falls back to Python metrics.

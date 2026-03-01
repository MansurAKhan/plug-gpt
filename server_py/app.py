import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

load_dotenv()

from routes_chat import router as chat_router
from routes_tools import router as tools_router
from routes_llm import router as llm_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api/chat")
app.include_router(tools_router, prefix="/api/tools")
app.include_router(llm_router, prefix="/api/llm")

ROOT_DIR = Path(__file__).resolve().parents[1]
PUBLIC_DIR = ROOT_DIR / "public"
CONFIG_DIR = ROOT_DIR / "config"

app.mount("/css", StaticFiles(directory=str(PUBLIC_DIR / "css")), name="css")
app.mount("/js", StaticFiles(directory=str(PUBLIC_DIR / "js")), name="js")
app.mount("/logos", StaticFiles(directory=str(PUBLIC_DIR / "logos")), name="logos")
app.mount("/config", StaticFiles(directory=str(CONFIG_DIR)), name="config")


@app.get("/")
async def home_page():
    return FileResponse(str(PUBLIC_DIR / "index.html"))


@app.get("/login.html")
async def login_page():
    return FileResponse(str(PUBLIC_DIR / "login.html"))


@app.get("/chat.html")
async def chat_page():
    return FileResponse(str(PUBLIC_DIR / "chat.html"))


@app.get("/study-tools.html")
async def study_tools_page():
    return FileResponse(str(PUBLIC_DIR / "study-tools.html"))


@app.get("/writing-tools.html")
async def writing_tools_page():
    return FileResponse(str(PUBLIC_DIR / "writing-tools.html"))


@app.get("/ib-tools.html")
async def ib_tools_page():
    return FileResponse(str(PUBLIC_DIR / "ib-tools.html"))


@app.get("/workspace.html")
async def workspace_page():
    return FileResponse(str(PUBLIC_DIR / "workspace.html"))


@app.get("/terms.html")
async def terms_page():
    return FileResponse(str(PUBLIC_DIR / "terms.html"))


@app.get('/api/health')
async def health():
    return {"status": "ok", "stack": "html-css-js + python + json + java"}


if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, reload=False)

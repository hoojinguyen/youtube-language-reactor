"""
YouTube Language Reactor Lite - Backend API Server
FastAPI-based local server for translations and vocabulary management
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.routes import translate, vocabulary
from app.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup"""
    init_db()
    print("🚀 YouTube Language Reactor Lite API Server started")
    print("📍 Running at http://localhost:5000")
    print("📚 API docs at http://localhost:5000/docs")
    yield
    print("👋 Server shutting down...")


app = FastAPI(
    title="YouTube Language Reactor Lite API",
    description="Local API server for translations and vocabulary management",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - allow extension to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "chrome-extension://*",
        "http://localhost:*",
        "https://www.youtube.com",
        "https://youtube.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(translate.router, prefix="/api", tags=["Translation"])
app.include_router(vocabulary.router, prefix="/api", tags=["Vocabulary"])


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "youtube-language-reactor-lite"}


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "YouTube Language Reactor Lite API Server",
        "version": "1.0.0",
        "docs": "/docs"
    }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=5000,
        reload=True
    )

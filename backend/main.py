"""
Main FastAPI application entry point.
"""

import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

# Add project root to Python path so we can import pose_estimation, analysis_engine, database
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from database.models import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    # Startup: ensure directories and database exist
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.OUTPUT_DIR, exist_ok=True)
    os.makedirs(settings.STATIC_DIR, exist_ok=True)
    init_db()
    yield
    # Shutdown: cleanup (if needed)


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description="AI-powered sports intelligence platform — Volleyball Movement Analysis MVP",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers
from backend.routes import upload, results, files, auth, history

app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(results.router, prefix="/api", tags=["results"])
app.include_router(files.router, prefix="/api", tags=["files"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(history.router, prefix="/api", tags=["history"])


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": "0.1.0",
    }

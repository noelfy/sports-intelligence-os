"""
Vercel serverless entry point for FastAPI.
Maps all /api/* requests to the FastAPI application.
"""
import os
import sys
from pathlib import Path

# Project root
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.main import app
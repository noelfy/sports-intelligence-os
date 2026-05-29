"""
Application configuration via Pydantic BaseSettings.

Loads from .env file and environment variables.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Central application settings."""

    # Server
    APP_NAME: str = "NeuroVolley AI"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Paths (relative to project root)
    UPLOAD_DIR: str = "data/uploads"
    OUTPUT_DIR: str = "data/output"
    STATIC_DIR: str = "data/static"

    # Database (SQLite for MVP dev, swap to PostgreSQL for production)
    DATABASE_URL: str = "sqlite:///./data/neurovolley.db"

    # JWT Authentication
    SECRET_KEY: str = "dev-secret-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # OpenAI (for AI feedback generation)
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    # Upload limits
    MAX_UPLOAD_SIZE_MB: int = 500
    ALLOWED_VIDEO_EXTENSIONS: list[str] = [".mp4", ".mov"]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


settings = Settings()

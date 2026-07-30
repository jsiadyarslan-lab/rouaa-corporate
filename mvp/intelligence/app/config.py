"""Application configuration — loaded from environment variables."""

from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """ROUAA Intelligence Service settings."""

    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Environment
    node_env: str = Field(default="development", alias="NODE_ENV")

    # Service
    port: int = Field(default=8000, alias="INTELLIGENCE_PORT")
    host: str = "0.0.0.0"

    # Database
    database_url: str = Field(
        default="postgresql://rouaa:rouaa_dev@localhost:5432/rouaa",
        alias="INTELLIGENCE_DB_URL",
    )

    # CORS — comma-separated origins
    cors_origins_str: str = Field(
        default="http://localhost:5173,http://localhost:4000",
        alias="INTELLIGENCE_CORS_ORIGINS",
    )

    # Logging
    log_level: str = Field(default="info", alias="LOG_LEVEL")

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins_str.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance — module-level singleton."""
    return Settings()


# Module-level instance for direct import
settings = get_settings()

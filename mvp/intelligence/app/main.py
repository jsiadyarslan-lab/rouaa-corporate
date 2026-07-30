"""ROUAA Intelligence Service — FastAPI application factory."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import health, sources

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan — startup + shutdown hooks."""
    logger.info(
        "Starting ROUAA Intelligence Service",
        extra={"env": settings.node_env, "port": settings.port},
    )
    yield
    logger.info("Shutting down ROUAA Intelligence Service")


def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""
    app = FastAPI(
        title="ROUAA Intelligence Service",
        description=(
            "Python/FastAPI service for AI, NLP, and document intelligence within "
            "the ROUAA MVP. Currently exposes health + sources routers; "
            "document ingestion + extraction routers will be added in Sprint 3+."
        ),
        version="0.1.0",
        lifespan=lifespan,
    )

    # CORS — allow the Vite dev server
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
        allow_credentials=True,
    )

    # Routers
    app.include_router(health.router, prefix="/api/v1", tags=["health"])
    app.include_router(sources.router, prefix="/api/v1", tags=["sources"])

    return app


app = create_app()

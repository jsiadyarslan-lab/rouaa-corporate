"""Health endpoints — liveness + readiness."""

from __future__ import annotations

import time
from typing import Any

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

router = APIRouter()

_started_at = time.time()


@router.get("/health")
async def liveness() -> dict[str, Any]:
    """Liveness probe — service process is up."""
    return {
        "status": "ok",
        "service": "rouaa-intelligence",
        "uptime": time.time() - _started_at,
        "version": "0.1.0",
    }


@router.get("/health/ready")
async def readiness() -> JSONResponse:
    """Readiness probe — service is ready to serve requests.

    Currently returns ok if the FastAPI process can respond. Once the database
    and AI pipelines are wired in, this will check their connectivity.
    """
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "status": "ok",
            "service": "rouaa-intelligence",
            "checks": {
                "process": "ok",
                "database": "not_checked_yet",  # TODO: add DB ping in Sprint 1
                "ai_models": "not_loaded_yet",  # TODO: add model ping in Sprint 3+
            },
        },
    )

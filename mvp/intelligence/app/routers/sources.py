"""Sources router — read-only view of the Source Registry from the Python side.

The Python service shares the same PostgreSQL database as the NestJS backend.
This router provides the data-science / AI pipeline's view into the registry
without going through the HTTP API — useful for batch ingestion, model
training, and document intelligence pipelines.

Per docs/execution/03 §5 (Data Architecture) and TASK-021 (Source Classification).
"""

from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter()


class SourceSummary(BaseModel):
    """Lightweight Source representation for the Python service."""

    id: str
    name: str
    code: str
    type: str
    country: str
    trust_tier: int = Field(alias="trustTier")
    status: str

    model_config = {"populate_by_name": True}


# Note: This is a stub. The actual implementation will use SQLAlchemy
# in Sprint 1 to query the shared PostgreSQL database. For Sprint 0,
# this returns a placeholder so the service is structurally complete
# and the integration test harness can verify the router exists.

@router.get("/sources")
async def list_sources(
    type: Optional[str] = Query(default=None, description="Filter by source type"),
    country: Optional[str] = Query(default=None, description="Filter by country code"),
    status: Optional[str] = Query(default=None, description="Filter by status"),
    limit: int = Query(default=100, ge=1, le=500),
) -> dict[str, Any]:
    """List sources with optional filters.

    Sprint 0 status: stub — returns a placeholder response.
    Sprint 1 status: full implementation with SQLAlchemy + shared DB.
    """
    return {
        "status": "stub",
        "message": (
            "Sources router is wired. Database connection will be added in Sprint 1 "
            "per docs/execution/05 EPIC 02 (Database Implementation)."
        ),
        "filters": {"type": type, "country": country, "status": status, "limit": limit},
        "data": [],
    }


@router.get("/sources/{code}")
async def get_source_by_code(code: str) -> dict[str, Any]:
    """Get a single source by its short code (e.g., FED, ECB)."""
    return {
        "status": "stub",
        "message": f"Source lookup by code='{code.upper()}' will be implemented in Sprint 1.",
        "code": code.upper(),
    }

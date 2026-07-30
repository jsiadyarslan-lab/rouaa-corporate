"""Smoke test — verify the FastAPI app can be created and routes are wired."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_liveness(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "rouaa-intelligence"


def test_readiness(client: TestClient) -> None:
    response = client.get("/api/v1/health/ready")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "checks" in body


def test_sources_router_stub(client: TestClient) -> None:
    response = client.get("/api/v1/sources")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "stub"
    assert "filters" in body


def test_source_by_code_stub(client: TestClient) -> None:
    response = client.get("/api/v1/sources/FED")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "stub"
    assert body["code"] == "FED"

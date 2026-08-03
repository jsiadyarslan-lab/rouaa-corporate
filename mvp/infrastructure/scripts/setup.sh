#!/usr/bin/env bash
# ROUAA MVP — Local Development Setup Script
# Usage: bash infrastructure/scripts/setup.sh
#
# This script:
#   1. Verifies prerequisites (Node, pnpm, Python, Docker)
#   2. Copies .env.example to .env if missing
#   3. Starts PostgreSQL (with pgvector) + Redis via Docker Compose
#   4. Waits for postgres to be healthy
#   5. Installs Node dependencies (pnpm install)
#   6. Sets up Python venv and installs intelligence service deps
#   7. Runs database migrations
#   8. Seeds the Source Registry (36 sources)
#   9. Prints next steps

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT_DIR"

echo ""
echo "============================================================"
echo "  ROUAA MVP — Local Development Setup"
echo "  Sprint 0 — Foundation"
echo "============================================================"
echo ""

# --- 1. Prerequisites ---
echo "▶ Checking prerequisites..."

check_command() {
  if ! command -v "$1" &> /dev/null; then
    echo "  ✗ $2 is required but not installed."
    echo "    Please install: $3"
    exit 1
  fi
}

check_command node "Node.js" "https://nodejs.org/ (v20+)"
check_command pnpm "pnpm" "npm install -g pnpm@9"
check_command python3 "Python 3" "https://www.python.org/ (v3.11+)"
check_command docker "Docker" "https://www.docker.com/"

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "  ✗ Node.js v20+ required, found v$NODE_VERSION"
  exit 1
fi

echo "  ✓ Node $(node -v)"
echo "  ✓ pnpm $(pnpm -v)"
echo "  ✓ Python $(python3 --version 2>&1 | awk '{print $2}')"
echo "  ✓ Docker $(docker --version | awk '{print $3}' | sed 's/,//')"
echo ""

# --- 2. Environment ---
echo "▶ Setting up .env..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "  ✓ Created .env from .env.example"
else
  echo "  ✓ .env already exists"
fi
echo ""

# --- 3. Docker services ---
echo "▶ Starting PostgreSQL (with pgvector) + Redis via Docker Compose..."
docker compose --file infrastructure/docker/docker-compose.yml up -d

echo "  Waiting for postgres to be healthy..."
for i in {1..30}; do
  if docker exec rouaa-postgres pg_isready -U rouaa -d rouaa &>/dev/null; then
    echo "  ✓ PostgreSQL is ready"
    break
  fi
  sleep 1
  if [ $i -eq 30 ]; then
    echo "  ✗ PostgreSQL did not become healthy in 30 seconds"
    docker logs rouaa-postgres | tail -20
    exit 1
  fi
done

echo "  Waiting for Redis to be healthy..."
for i in {1..15}; do
  if docker exec rouaa-redis redis-cli ping &>/dev/null | grep -q PONG; then
    echo "  ✓ Redis is ready"
    break
  fi
  sleep 1
done
echo ""

# --- 4. Node dependencies ---
echo "▶ Installing Node dependencies (pnpm install)..."
pnpm install --silent
echo "  ✓ Dependencies installed"
echo ""

# --- 5. Python dependencies ---
echo "▶ Setting up Python environment for intelligence service..."
cd intelligence
if [ ! -d .venv ]; then
  python3 -m venv .venv
  echo "  ✓ Created .venv"
fi
# shellcheck disable=SC1091
source .venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -e ".[dev]"
echo "  ✓ Python dependencies installed"
deactivate
cd "$ROOT_DIR"
echo ""

# --- 6. Database migrations ---
echo "▶ Running database migrations..."
pnpm --filter @rouaa/backend run migration:run || {
  echo "  ⚠ Migration run failed — this is expected on first run if schema sync is enabled."
  echo "    The seed script will auto-create the schema in dev mode."
}
echo ""

# --- 7. Seed data ---
echo "▶ Seeding Source Registry (36 official sources)..."
pnpm --filter @rouaa/backend run seed
echo ""

# --- Done ---
echo "============================================================"
echo "  ✓ ROUAA MVP Sprint 0 — Setup Complete"
echo "============================================================"
echo ""
echo "Next steps:"
echo ""
echo "  1. Start the backend (NestJS) in a terminal:"
echo "     pnpm dev:backend"
echo "     → API at http://localhost:4000/api/v1"
echo "     → Health: http://localhost:4000/api/v1/health"
echo "     → Sources: http://localhost:4000/api/v1/sources"
echo ""
echo "  2. Start the frontend (React + Vite) in another terminal:"
echo "     pnpm dev:web"
echo "     → Console at http://localhost:5173"
echo ""
echo "  3. Start the intelligence service (Python + FastAPI) in a third terminal:"
echo "     cd intelligence && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000"
echo "     → API at http://localhost:8000/api/v1/health"
echo ""
echo "  4. Adminer (DB UI) at http://localhost:8080"
echo "     System: PostgreSQL · Server: postgres · User: rouaa · Password: rouaa_dev · DB: rouaa"
echo ""
echo "Useful commands:"
echo "  pnpm docker:down        — Stop Docker services"
echo "  pnpm docker:up          — Start Docker services again"
echo "  pnpm db:migrate         — Run pending migrations"
echo "  pnpm db:seed            — Re-run the seed"
echo "  pnpm docker:psql        — Open psql inside the container"
echo ""

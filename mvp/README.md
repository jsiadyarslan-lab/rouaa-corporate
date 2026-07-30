# ROUAA MVP — Sprint 0 Foundation

> **ROUAA = The Trust Layer Between Financial Data and Institutional Decisions**
>
> This is the engineering monorepo for the ROUAA MVP — Sprint 0 (Foundation Setup) per
> `docs/execution/01-ROUAA-ENGINEERING-SPRINT-PLAN-v1.md` and
> `docs/execution/05-ROUAA-MVP-IMPLEMENTATION-TASKS-v1.md` (EPIC 01 + EPIC 02 + EPIC 03).

---

## What's in Sprint 0

Sprint 0 establishes the project foundation — **no features, just structure**:

- ✅ Monorepo structure (`apps/` + `backend/` + `intelligence/` + `packages/` + `infrastructure/`)
- ✅ Backend service scaffolded (NestJS + TypeScript + TypeORM)
- ✅ Frontend app scaffolded (React + Vite + TanStack Query + React Router + Zustand)
- ✅ Intelligence service scaffolded (Python + FastAPI + SQLAlchemy)
- ✅ Docker Compose for local dev (PostgreSQL 16 + pgvector + Redis + Adminer)
- ✅ Source Registry database schema (sources + source_health tables + indexes + triggers)
- ✅ Source Registry NestJS module (CRUD API + filtering + pagination + stats)
- ✅ Source Registry React console (dashboard + list view + detail view)
- ✅ Initial seed of **36 official sources** across 6 categories (TASK-012 + TASK-023)
- ✅ Shared TypeScript types package (`@rouaa/shared-types`)
- ✅ Health endpoints on backend + intelligence services

---

## Architecture

```
mvp/
├── apps/
│   └── web/                          # React + Vite frontend
│       └── src/
│           ├── App.tsx               # Routes: Dashboard, Sources, SourceDetail
│           ├── api.ts                # Typed API client
│           ├── pages/                # DashboardPage, SourcesPage, SourceDetailPage
│           └── styles.css            # ROUAA design tokens
│
├── backend/                          # NestJS API (primary backend)
│   └── src/
│       ├── main.ts                   # Bootstrap (port 4000, prefix /api/v1)
│       ├── app.module.ts             # Root module (Config + TypeORM + feature modules)
│       ├── modules/
│       │   ├── sources/              # Source Registry (Layer 01)
│       │   │   ├── entities/         # Source + SourceHealth TypeORM entities
│       │   │   ├── dto/              # Create/Update/Query DTOs with class-validator
│       │   │   ├── sources.service.ts
│       │   │   ├── sources.controller.ts
│       │   │   └── sources.module.ts
│       │   └── health/               # Liveness + readiness probes
│       ├── config/
│       │   ├── data-source.ts        # TypeORM CLI data source
│       │   ├── seed.ts               # Seed runner
│       │   └── seed-data.ts          # 36 official sources
│       └── migrations/
│           └── 1700000000000-InitSourceRegistry.ts
│
├── intelligence/                     # Python/FastAPI service (AI + NLP)
│   └── app/
│       ├── main.py                   # FastAPI factory (port 8000)
│       ├── config.py                 # Pydantic settings
│       └── routers/
│           ├── health.py             # Liveness + readiness
│           └── sources.py            # Stub — full impl in Sprint 1
│
├── packages/
│   └── shared-types/                 # TypeScript types shared backend ↔ frontend
│       └── src/index.ts              # Source, Document, Fact, Event, Evidence, etc.
│
├── infrastructure/
│   ├── docker/
│   │   ├── docker-compose.yml        # Postgres+pgvector, Redis, Adminer
│   │   └── postgres-init/
│   │       └── 01-extensions.sql     # pgvector + uuid-ossp + citext + pg_trgm
│   └── scripts/
│       └── setup.sh                  # One-command local dev setup
│
├── package.json                      # Workspace root + Turbo scripts
├── turbo.json                        # Build/dev/test pipeline
├── tsconfig.base.json                # Strict TypeScript base config
├── .env.example                      # Environment template
├── .gitignore
├── .editorconfig
└── .prettierrc
```

---

## Quick Start

```bash
# 1. From the mvp/ directory, run the one-command setup
bash infrastructure/scripts/setup.sh

# 2. Start the backend in a terminal
pnpm dev:backend
# → http://localhost:4000/api/v1

# 3. Start the frontend in another terminal
pnpm dev:web
# → http://localhost:5173

# 4. (Optional) Start the intelligence service in a third terminal
cd intelligence && source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000/api/v1/health
```

---

## Tech Stack

| Layer | Technology | Version | Why |
|---|---|---|---|
| Backend | NestJS + TypeScript | 10.4 + 5.5 | Enterprise structure, DI, modules, guards |
| Database | PostgreSQL + pgvector | 16 | Relational + vector in one store |
| ORM | TypeORM | 0.3.20 | Mature, migration-first, NestJS-native |
| Queue | Redis + BullMQ | 7 + 2 | For ingestion workers (Sprint 2+) |
| AI/ML | Python + FastAPI | 3.11 + 0.110 | Async, typed, PyTorch-ready |
| Frontend | React + Vite | 18.3 + 5.4 | Fast HMR, modern build |
| Frontend state | TanStack Query + Zustand | 5.51 + 4.5 | Server state + client state |
| Monorepo | pnpm workspaces + Turborepo | 9.12 + 2.0 | Fast builds, deduplication |
| Container | Docker Compose | latest | Local dev parity with prod |

---

## Source Registry Schema (Sprint 0)

Two tables — `sources` (registry) and `source_health` (runtime health):

### `sources`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text UNIQUE | "Federal Reserve" |
| `code` | varchar(16) UNIQUE | "FED" — uppercase, 2-16 chars |
| `type` | enum | central_bank, regulator, exchange, statistics, government, international_org, company |
| `country` | varchar(16) | ISO 3166-1 alpha-2 or 'multinational' |
| `jurisdiction` | text | "United States" |
| `authority_level` | enum | primary, secondary |
| `trust_tier` | smallint | 1 (highest) to 4 (excluded) |
| `website_url`, `feed_url`, `api_url` | text | Publication endpoints |
| `ingestion_pattern` | enum | direct_api, document_monitoring, scheduled_polling, manual |
| `polling_interval_sec` | integer | Floor 30s, ceiling 86400s |
| `status` | enum | active, paused, deprecated, candidate |
| `metadata` | jsonb | Source-specific config (auth, headers, selectors) |
| `created_at`, `updated_at` | timestamptz | Auto-managed |

### `source_health` (1:1 with sources)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `source_id` | uuid UNIQUE FK | CASCADE on source delete |
| `last_successful_fetch_at` | timestamptz | |
| `last_fetch_attempt_at` | timestamptz | |
| `consecutive_failures` | integer | Resets to 0 on success |
| `total_successful_fetches` | integer | Lifetime counter |
| `total_failed_fetches` | integer | Lifetime counter |
| `reliability_score` | double | 0.0–1.0, rolling window |
| `status` | enum | healthy, degraded, failing, paused, unknown |
| `last_error_message` | text | For ops diagnosis |

---

## API Endpoints (Sprint 0)

### Backend (NestJS) — `http://localhost:4000/api/v1`

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness probe |
| `GET` | `/health/ready` | Readiness probe (DB ping) |
| `GET` | `/sources` | List sources (filter + pagination) |
| `GET` | `/sources/:id` | Get one source by UUID |
| `GET` | `/sources/code/:code` | Get source by short code (FED, ECB, etc.) |
| `GET` | `/sources/stats` | Registry statistics for dashboard |
| `POST` | `/sources` | Create a new source |
| `PATCH` | `/sources/:id` | Update source fields |
| `DELETE` | `/sources/:id` | Soft-delete (set status=deprecated) |

### Intelligence (FastAPI) — `http://localhost:8000/api/v1`

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness |
| `GET` | `/health/ready` | Readiness (stub for now) |
| `GET` | `/sources` | Stub — full impl in Sprint 1 |
| `GET` | `/sources/:code` | Stub — full impl in Sprint 1 |

---

## Seed Data — 36 Official Sources

Initial seed covers all 6 source categories per `docs/execution/05 TASK-012`:

| Category | Count | Examples |
|---|---|---|
| Central banks | 10 | FED, ECB, BOE, BOJ, PBOC, SNB, BOC, RBA, MAS, BIS |
| Regulators | 7 | SEC, CFTC, FCA, BAFIN, AMF, SFC, ESMA |
| Exchanges | 5 | NYSE, NASDAQ, LSE, EUREX, TSE |
| Statistical agencies | 5 | BLS, BEA, EUROSTAT, ONS, STATCAN |
| Government bodies | 4 | TREAS, HMT, BMF, MOF |
| International bodies | 5 | IMF, WBG, OECD, WTO, FATF |
| **Total** | **36** | All tier 1, all active |

Target registry: 411+ sources (per `docs/foundation/29-DATA-MODEL-v1.md`) — Sprint 1+ will expand coverage.

---

## Sprint 0 Exit Criteria

Per `docs/execution/01`:

- ✅ مشروع قابل للبناء (project can build)
- ✅ بيئة موحدة (unified environment)
- ⚠ نشر آلي أساسي (basic automated deployment) — CI/CD is stubbed, full pipeline is Sprint 0 TASK-003 follow-up

---

## What's Next — Sprint 1

Per `docs/execution/05`:

- **EPIC 02 / TASK-010-012** — Add Documents, Facts, Events, Evidence tables + migrations
- **EPIC 03 / TASK-020-023** — Source Registry v2 (full CRUD already done in Sprint 0)
- **EPIC 04 / TASK-030-034** — Data Ingestion Pipeline (BullMQ + RSS/HTML/PDF adapters)

---

## Documentation Cross-References

- `docs/foundation/00-ROUAA-MASTER-BUILD-BLUEPRINT-v1.md` — Project master plan
- `docs/execution/01-ROUAA-ENGINEERING-SPRINT-PLAN-v1.md` — Sprint plan (this is Sprint 0)
- `docs/execution/03-ROUAA-ENGINEERING-SPECIFICATION-v1.md` — Tech stack + module architecture
- `docs/execution/04-ROUAA-MVP-BUILD-SPECIFICATION-v1.md` — 90-day MVP scope
- `docs/execution/05-ROUAA-MVP-IMPLEMENTATION-TASKS-v1.md` — EPIC 01-13 tasks (this is EPIC 01 + EPIC 02 + EPIC 03)
- `docs/foundation/29-DATA-MODEL-v1.md` — Source/Document/Fact/Event/Evidence data model

---

© 2026 ROUAA — The Trust Layer Between Financial Data and Institutional Decisions.

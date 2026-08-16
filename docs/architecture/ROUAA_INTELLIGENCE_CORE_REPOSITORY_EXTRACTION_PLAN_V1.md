# ROUAA INTELLIGENCE CORE — REPOSITORY EXTRACTION PLAN V1

**Status:** IMPLEMENTATION-READY EXTRACTION PLAN (planning only — no repository created, no files moved, no deployment)
**Date:** 2026-08-16
**Directive:** EXECUTION DIRECTIVE — SIMULATION REVIEW + REPOSITORY 4 EXTRACTION PLAN V1 (user-issued verbatim)
**Verdict (Section S):** `EXTRACTION PLAN READY`

---

## A. Objective

Define exactly what moves into the fourth repository `ROUAA Intelligence Core`, what stays, and how history, tests, and contracts are preserved — turning the validated Minimum Core (proven end-to-end at the Institutional Buyer Simulation) into an independently owned canonical Core, without a single behavior change.

## B. Authoritative Inputs

`9298162` Architecture V1.1 (+ Decisions D1–D10) · `08d5723` Architecture Review · `9af81b7` Minimum Core build (48 tests) · `0f4139b` Phase-2 live validation · `8de74e9` pre-simulation hardening · `150ae87` Institutional Buyer Simulation (PASSED WITH BOUNDED LIMITATIONS) + Simulation Review (`SIMULATION ACCEPTED WITH REQUIRED EXTRACTION CONDITIONS`). Repository tree verified directly at `150ae87`: 26 Python files / 3,175 lines under `intelligence_core/`; **secrets scan: clean**; **deferred-capability import scan: clean** (only occurrences of "playwright" are entries of `FORBIDDEN_CONFIG_KEYS` — the guard, not usage).

## C. Simulation Review

Recorded in `docs/evidence/INSTITUTIONAL_BUYER_SIMULATION_REVIEW_V1.md` (this commit): 9/9 requirements demonstrated with machine evidence; 11/11 acceptance criteria; conclusion `SIMULATION ACCEPTED WITH REQUIRED EXTRACTION CONDITIONS` (Gate A passed).

## D. Runtime/Core Boundary

**Production Core (moves):** the 14 `intelligence_core/` modules — contracts, identity (NR-v1), temporal, entity_resolution, store (append-only JSONL + content-addressed blobs), extract, detect (6 event types), governance, acquisition (direct-HTTP), normalize, config, health, delivery, pipeline.
**Validation Infrastructure (moves, separated):** unit/regression tests (48), Phase-2 replay harness, buyer-simulation conformance harness.
**Historical Evidence (stays in `rouaa-corporate`):** all `docs/evidence/**` artifacts, strategy/framework docs, older `scripts/pipeline/**` (the pre-Core validated engine lineage — historical reference, superseded-by-relation to the Core, not deleted).
**Temporary Harnesses (stay or expire in place):** none beyond the two named validation harnesses; older diag/ scripts already remain under `scripts/pipeline` as history.

## E. File Classification (every core-lineage file @ `150ae87`)

| File | Class | Destination |
|---|---|---|
| `intelligence_core/__init__.py` | CORE | repo4 root package |
| `contracts.py` `identity.py` `temporal.py` `entity_resolution.py` `store.py` `extract.py` `detect.py` `governance.py` `acquisition.py` `normalize.py` `config.py` `health.py` `delivery.py` `pipeline.py` | **CORE** (14 modules) | `intelligence_core/` (unchanged layout) |
| `tests/test_entity.py` `test_document_identity.py` `test_temporal.py` `test_governance.py` `test_pipeline.py` `test_hardening.py` | **TEST** (48 tests incl. all directive §12-mandated families) | `intelligence_core/tests/unit/` |
| `tests/run_all.py` | TEST (runner) | updated discovery paths only |
| `tests/phase2_live_validation.py` `tests/phase2_analysis.py` | **HARNESS → VALIDATION** (Gate-F replay requirement) | `intelligence_core/tests/replay/` |
| `tests/buyer_simulation_v1.py` | **HARNESS → VALIDATION** (conformance, network-marked) | `intelligence_core/tests/conformance/` |
| `docs/architecture/…ARCHITECTURE_V1_1.md` `…V1_1_DECISIONS.md` | **DOCUMENTATION (canonical runtime contracts)** | copied VERBATIM to repo4 `docs/` |
| `…ARCHITECTURE_V1.md` `…REVIEW_V1.md` `…ENGINE_SELECTION_V1.md` `…BUILD_LOG_V1.md` | DOCUMENTATION (historical) | stay in corporate; referenced by commit |
| all `docs/evidence/**` incl. Phase-2/Hardening/Simulation artifacts | DOCUMENTATION (historical evidence) | stay; referenced by hash |
| `scripts/pipeline/**`, `mvp/**`, website, `rouaa-web/` | PRODUCT-SPECIFIC / EXPERIMENTAL / LEGACY | stay in corporate untouched |
| — | EXPERIMENTAL / REMOVE / DEFERRED | **none** — no deferred-capability code exists in the Core tree (verified) |

## F. Data Ownership (no shared mutable ownership)

| Entity | Ownership |
|---|---|
| Institution, Source, Document, Representation, Retrieval Event, Fact, Event, Evidence, IntelligenceObject, Delivery, Audit | **CORE-OWNED** (all 11) |
| Product-side views/caches | PRODUCT-OWNED, read-only by contract, never canonical |
| Historical superseded rows/versions | CORE-OWNED (HISTORICAL-ONLY access semantics — retained, immutable, reproducible) |

`SHARED-BY-CONTRACT` is limited to *consumption* (products read IOs/trace queries; delivery acknowledgments flow one-way into the Core ledger via the contract). No product ever mutates Core truth.

## G. Source Registry Ownership

The Source Registry (Institutions + verified domains + Sources + configurations) is **exclusively Core-owned**. Canonical chain: `ROUAA Intelligence Core → Source Registry → News / Trading / Corporate consume`. A product repository defining its own source list is a **contract violation** (products may only *request* scope and *read* selections — Contract A semantics).

## H. API Boundary (defined, not implemented)

| Concern | Classification |
|---|---|
| Core internals (store layout, governance ops, adapters) | INTERNAL |
| IO-first canonical consumption + trace query (Contract B) + health | **CORE API** (first implementation post-extraction) |
| External institutional delivery (Contract C over real transport, auth, destinations) | **FUTURE EXTERNAL API** (productization phase) |

Every API level must preserve the chain `IntelligenceObject → Event → Fact → Evidence → Representation → Document → Source → Institution`.

## I. Product Consumer Contract

| Product | Consumes | Must NOT own | May cache | May transform | Write-back |
|---|---|---|---|---|---|
| ROUAA News | IOs + trace queries + health | sources, provenance, event model | yes (read-only, staleness-labeled) | presentation only | no |
| ROUAA Trading | IOs (event/fact detail) + trace | same | yes | analytics/derivations labeled as product-side | no |
| ROUAA Corporate | IOs + institutional evidence view | same | yes | presentation only | no |

Default rule ratified: *products consume canonical intelligence; they do not mutate Core truth.*

## J. Repository Structure (simplest that preserves the validated architecture)

Keeping the package name `intelligence_core` verbatim → **zero import rewrites, zero behavior change** (extraction-integrity §19):

```text
rouaa-intelligence-core/
├── intelligence_core/            # the 14 validated modules, unchanged
│   └── tests/
│       ├── unit/                 # 6 test files (48 tests)
│       ├── replay/               # phase2_live_validation + phase2_analysis (Gate F)
│       └── conformance/          # buyer_simulation_v1 (network-marked)
├── docs/
│   ├── ROUAA_INTELLIGENCE_CORE_ARCHITECTURE_V1_1.md            # verbatim copy
│   ├── ROUAA_INTELLIGENCE_CORE_ARCHITECTURE_V1_1_DECISIONS.md  # verbatim copy
│   └── EXTRACTION_PROVENANCE.md  # file→source-commit SHA-256 map
├── fixtures/                     # future: captured fixtures for offline replay
├── README.md                     # scope, run instructions, gate status
└── (LICENSE — open decision R3)
```

## K. Test Migration (directive §12 families — all preserved)

Moving: BMF entity regression (`test_entity`), document identity + representation hash (`test_document_identity` + blob re-hash in replay), supersession/versioning + **event propagation** (`test_governance` + `test_hardening` Cases A–F), temporal semantics + ordering guard (`test_temporal`), relative-URL resolution (`test_hardening`), Source registration (`test_hardening`), multi-source isolation + idempotency + FED_ENF config-only (`test_pipeline`), traceability + delivery idempotency + deterministic replay (replay/conformance harnesses). **Gate E criterion: the same 48+ tests green inside Repository 4, independent of `rouaa-corporate`.**

## L. Configuration Migration (no auto-migration)

- **Required for Core baseline:** none permanent yet — the Core ships the *configuration engine + validated schema* (`config.py`).
- **Validated examples:** the diagnostic configs embedded in replay/conformance harnesses (FDIC own-domain enforcement, ISTAT Eurostat-patterns, DFSA) → preserved inside those harnesses as reference configurations.
- **Experimental / product-specific / deprecated:** legacy `scripts/pipeline/source_configs.py` (24 sources) **stays in corporate** (historical); future onboarding happens through the Core's config contract only.
- Principle ratified: Core = configuration engine + schema; Product = no competing source registry.

## M. Historical Evidence Strategy

Historical evidence (`docs/evidence/**`, strategy/framework/frozen artifacts, Q1–Post-Q3, Phase-2, Hardening, Simulation) **remains canonical in `rouaa-corporate`**. Repository 4 references via `EXTRACTION_PROVENANCE.md` (commit hashes + SHA-256 of moved files). No duplication; full traceability.

## N. Security / Secrets

Verified: zero credentials in the Core tree @ `150ae87`. Rules forward: no tokens in code/config/commits (session token hygiene practice continues); future env-var contract (`ROUAA_CORE_STORAGE_ROOT`, transport secrets at productization only); log redaction policy at API build; production secret boundary = deployment phase concern. **No credentials may be committed — standing rule.**

## O. Deployment Boundary (conceptual only)

`ROUAA Intelligence Core → Railway/production runtime → persistent storage (append-only store + blobs) → canonical API → News/Trading/Corporate`. **No Railway work, no infrastructure files in this plan** (deployment/ intentionally absent from the repo-4 tree until Gate G).

## P. Extraction Gates (none skippable)

| Gate | Criterion | Status |
|---|---|---|
| A | Simulation accepted | **PASSED** (Review, this commit) |
| B | Extraction plan approved | **PENDING user approval (this document)** |
| C | Repository 4 created | pending |
| D | Validated Core copied/extracted (provenance map complete; corporate untouched) | pending |
| E | Independent 48+ test suite green in repo 4 | pending |
| F | Phase-2 live-validation replay passes in repo 4 | pending |
| G | Production readiness review | pending |
| H | Railway deployment | pending |
| I | One product connected (controlled) | pending |
| J | Remaining products connected | pending |

## Q. Rollback

Extraction is **additive and reversible**: `rouaa-corporate` keeps the full validated Core tree until Gates E–F pass in repo 4 (deprecation/removal there is a separate later decision). Rollback at any gate ≤F = abandon/repurpose repo 4; corporate remains the operational source. After Gate G+, rollback = redeploy from corporate copies (provenance map guarantees equality).

## R. Open Decisions (for user)

1. Repo visibility/name final (`rouaa-intelligence-core` proposed).
2. SQL/database migration timing — explicitly a **separate architecture decision**; Phase-1 extraction preserves the JSONL/blob store unchanged (D9 intact).
3. LICENSE for repo 4.
4. Production transport + auth model (FUTURE EXTERNAL API) — post-Gate-G design.
5. Platform-distribution entity rule (D6 extension) — decision-gated, not extraction-blocking.

## S. Final Extraction Readiness

All Section-C acceptance conditions of the Simulation Review are translatable into Gates D–F criteria; classification covers every core-lineage file; storage, API, product-consumer, security, rollback, and historical-evidence strategies are defined. No blocking decision remains inside the extraction itself.

# `EXTRACTION PLAN READY`

**STOP per directive — Repository 4 NOT created; no files moved; no deployment; no product connections. Next action requires explicit approval of this plan (Gate B): `CREATE REPOSITORY 4 → EXTRACT VALIDATED CORE → INDEPENDENT REVALIDATION → PRODUCTIONIZE`. Nothing begins automatically.**

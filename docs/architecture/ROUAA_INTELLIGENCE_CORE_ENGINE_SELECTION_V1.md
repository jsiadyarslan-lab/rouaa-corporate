# ROUAA INTELLIGENCE CORE ENGINE SELECTION V1

**Status:** ENGINE SELECTION + CODEBASE DISCOVERY — Phase 1 opening artifact
**Date:** 2026-08-16
**Directive:** EXECUTION DIRECTIVE — MINIMUM CORE ENGINE SELECTION & BUILD PHASE 1 (user-issued verbatim)
**Authorization basis:** Architecture V1.1 @ `9298162` — `MINIMUM CORE BUILD AUTHORIZED` (user-ratified)
**Discipline:** Discovery performed read-only (no existing file modified). New code lands in `intelligence_core/` only.

---

## 1. Codebase Discovery (existing `rouaa-corporate` @ `9298162`)

| Area | Current implementation | Size | Map | Rationale (arch decision) |
|---|---|---|---|---|
| Source registry | `source_configs.py` — 24 source dicts (code/feedUrl/patterns/event_type/keywords) | 831 L | **KEEP (as data) + REFACTOR (validation layer)** | Proven configuration contract (FED_ENF `f16bc00`); needs D6 institution binding + forbidden-key validation (§9 of directive) |
| Acquisition | `fetcher.py` — urllib first, playwright fallback, `fetch_with_fallback` | 386 L | **REFACTOR** | Keep urllib/browser-headers direct-HTTP core; STRIP playwright path (rendering excluded from Minimum Core); add RetrievalEvent + Representation (D1) |
| Normalization | `normalizer.py` — `strip_html`, `split_into_paragraphs`, `normalize_document` | 213 L | **KEEP (logic)** | Satisfies contract; re-homed |
| Extraction | `extractor.py` — pattern loop + `PATTERN_TYPE_METADATA` (rate-family normalization, identity fallback) | 699 L | **KEEP (semantics) + REFACTOR (binding)** | Proven semantics (Gate 5 passes); must bind facts to `representation_id` + deterministic ids (D1/D2) |
| Detection | `detector.py` — `EVENT_TYPE_RULES` (6 types, data-driven) + `detect_event` | 330 L | **KEEP verbatim semantics + REFACTOR (versioning)** | 6 types unchanged (directive §10); add fact-version snapshot (D2) |
| Evidence | `evidence.py` — build/verify provenance chains | 130 L | **KEEP (concept) + REFACTOR** | Bind to exact representation hash (D1 rule 5) |
| IntelligenceObject | `intelligence_object.py` — generate/render/save | 176 L | **REFACTOR → canonical delivery interface** | IO-first API (D7); strip file-output coupling |
| Pipeline states | `pipeline_state.py` — PENDING→…→PUBLISHABLE/BLOCKED/FAILED | 122 L | **KEEP** | Matches V1.1 health model |
| Schemas | `schemas.py` — dataclasses + `gen_id()` (uuid4) + `published_at: str` | 180 L | **REPLACE** | uuid4 randomness violates D2 reproducibility; naive published_at violates D4 |
| Persistence | `run_pipeline.py` file outputs; hardcoded `/home/z/...` path; no DB | — | **REPLACE** | Append-only JSONL store + content-addressed blobs (D9 principles; see §3) |
| Tests / observability | none found in pipeline | — | **NEW** | Directive §11 test families; source-health states |
| Website / mvp apps / archive | root HTML, `rouaa-web/`, `mvp/` | — | **PRODUCT-SPECIFIC / EXPERIMENT / LEGACY** | Outside Core (Review §O classification reaffirmed) |
| Rendering, XLS/PDF | fetcher-playwright; XLS evidence only | — | **DEFER** | Excluded by authorized scope |

## 2. Engine Selection

**Chosen engine: Python 3.12 (standard library ONLY).**

- **Why:** the proven pipeline is Python; the authorized contracts (D1–D10) are implementable entirely in stdlib (`hashlib`, `dataclasses`, `json`, `re`, `datetime`, `email.utils`, `xml.etree`, `urllib`, `unittest`). §3 of the directive — *"reuse proven ROUAA pipeline capabilities; do not introduce new technology without demonstrated architectural reason"* — is satisfied maximally: **zero new technology**.
- **Rejected alternatives:** Node.js (not the proven pipeline's language — new technology without architectural reason); rewriting detector/extractor semantics in another runtime (migration risk with no contract gain).
- **Local execution environment:** official CPython 3.12.8 embeddable (downloaded to session-local `/tmp/pycore/py312`, stdlib-verified incl. `sqlite3`, `unittest`). No system installation, no site-packages, no dependencies — deterministic.
- **Persistence decision (Phase 1):** **append-only JSONL collections + content-addressed blob store** (raw bytes at `blobes/<sha256>`), i.e. an event-sourced store. Rationale: D2/D9 make append-only *structural*; JSONL gives an audit trail that IS the chain, full determinism, zero engine dependency. SQL engine selection is **deferred to the extraction/production phase** (D9 principles unaffected).

## 3. Reuse / Replace Summary (directive §16 items 1–3, pre-build)

- **Reused (semantics kept):** detector rules (6 types), extractor pattern semantics + PATTERN_TYPE_METADATA, normalizer text pipeline, evidence chain concept, pipeline states, source-config data model.
- **Refactored:** fetcher→adapter (retrieval events/representations, no playwright), IO→delivery interface, configs→validated contract.
- **Replaced:** random ids → deterministic sha256-derived identities; naive timestamps → 6-field temporal tuples; file/print persistence → append-only store.
- **New:** entity resolution registry (D6), governance/corrections ops (D2), temporal engine (D4), canonical URL normalization NR-v1 (D1), delivery idempotency (D8-C), test suite (directive §11).

**Mapping to architecture decisions is recorded per module in the Build Log. Every implementation change answers "which D does this implement?" (directive §12).**

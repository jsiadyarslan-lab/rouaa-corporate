# ROUAA INTELLIGENCE CORE BUILD LOG V1 — Phase 1 (Minimum Core)

**Status:** PHASE 1 IMPLEMENTED + DETERMINISTIC TESTS PASSED (31/31, double-run confirmed)
**Date:** 2026-08-16
**Directive:** EXECUTION DIRECTIVE — MINIMUM CORE ENGINE SELECTION & BUILD PHASE 1 (user-issued verbatim)
**Authorization:** Architecture V1.1 @ `9298162` — `MINIMUM CORE BUILD AUTHORIZED` (user-ratified)
**Scope lock (held):** direct HTTP only · 6 existing event types unchanged · no Insight · no browser-rendering integration · no XLS/PDF special adapters · no product UI · no Repository 4 · no Railway · no simulation.
**Runtime:** CPython 3.12.8 embeddable (session-local `/tmp/pycore/py312`), standard library ONLY — zero dependencies, zero new technology (Engine Selection §2).

---

## 1. Component Build Records (decision → implementation → test → result → rollback → arch-ref)

| Component (file) | Implements | Implementation summary | Test evidence | Result | Rollback point | Arch decision |
|---|---|---|---|---|---|---|
| `contracts.py` | all | 11 canonical dataclasses + states/enums; Insight absent BY DESIGN | exercised transitively by every suite | ✔ | git revert of this commit | D1–D10 |
| `identity.py` | D1 | NR-v1 canonicalization (absolutize/redirect-alias/tracking-strip/host-case/trailing-slash); deterministic sha256 ids for doc/rep/ret/fact/evt/evi/io/dlv | test_document_identity (6) | ✔ | revert | D1 |
| `temporal.py` | D4 | 6-field tuples; RFC-822 aware → UTC; naive → NULL+NONE; date-only; JurisdictionRule (approved→participates, unapproved→INFERRED excluded); ordering_filter | test_temporal (9) incl. FDIC/ISTAT/DGT/LSE evidence anchors | ✔ | revert | D4 |
| `entity_resolution.py` | D6 | verified-domain bindings only; brand lookup FORBIDDEN; assert_association rejects misattribution; superseding correction w/ history | test_entity (6) — **BMF regression: bmf.de ≠ ministry REJECTED** | ✔ | revert | D6, Post-Q3 f6c5a8b |
| `store.py` | D9 | append-only JSONL + content-addressed blobs; NO update/delete APIs; current-view = last row | transitive + governance tests | ✔ | delete store dir (data) / revert (code) | D9 |
| `extract.py` | reuse | PATTERN_TYPE_METADATA verbatim (rate family normalized; identity fallback); occurrence-deterministic facts | test_pipeline FED_ENF case | ✔ | revert | Gate-5 semantics |
| `detect.py` | §10 + D2 | EVENT_TYPE_RULES **6 types verbatim**; unknown type → ValueError; fact-version snapshot | test_governance six-types test | ✔ | revert | directive §10, D2 |
| `governance.py` | D2 | supersede_fact (version append, 3 states); supersede_fact_by_source; recompute_event (new version + closing row order); reproduce_event (historical) | test_governance (5) incl. snapshot + reproducibility | ✔ | revert | D2 |
| `acquisition.py` | §8 | DirectHttpAdapter (urllib, browser UA); RSS 2.0 + Atom parse; html_index link_pattern; single canonical Representation for all methods | test_pipeline isolation case | ✔ | revert | §8, D10 |
| `normalize.py` | reuse | strip_html/paragraphs carried from normalizer.py | transitive | ✔ | revert | KEEP mapping |
| `config.py` | §9 | SourceConfig + __post_init__ validation; FORBIDDEN_CONFIG_KEYS (bypass/captcha/identity/timezone/evidence/entity/rendering…) rejected at dict AND construction; event_type must ∈ 6 | test_pipeline config tests | ✔ | revert | §9 |
| `health.py` | reuse | PENDING→…→PUBLISHABLE + BLOCKED/FAILED terminal | isolation test | ✔ | revert | pipeline_state.py |
| `delivery.py` | D7/D8-C | IO with FULL embedded chain (fact→evidence→rep(sha)→doc→source); deliver() idempotent per (io,version,destination) | test_governance chain+idempotency | ✔ | revert | D7, D8 |
| `pipeline.py` | §11 | run_source NEVER raises (source-scoped BLOCKED); entity gate before fetch; idempotent re-runs; run_many isolation | test_pipeline isolation (1) | ✔ | revert | §11, D6 |
| `tests/` (5 files) | §11 | 31 tests across all 9 directive families | run_all.py double-run 31/31 OK | ✔ | revert | §11 |

## 2. Test Run Evidence

- Command: `/tmp/pycore/py312/python.exe -m intelligence_core.tests.run_all` (cwd = repo root)
- Result (run 1, 2026-08-16T02:35Z): `Ran 31 tests in 0.269s — OK`
- Result (run 2, determinism confirmation): `Ran 31 tests in 0.260s — OK`
- Family coverage vs directive §11: Identity (BMF regression ✔) · Document identity (re-fetch/changed/logical ✔) · Evidence (exact-representation hash ✔) · Corrections (supersession/snapshot/reproducibility ✔) · Temporal (explicit/unknown/conflicting/update-vs-publication/ordering-guard ✔) · Pipeline (source-failure isolation ✔) · Configuration (FED_ENF-style config-only correction ✔; forbidden domains ✔) · Reproducibility (same inputs → same lineage ✔) · Delivery idempotency + 6-types-only ✔.
- 22 source files (14 modules + 8 test files incl. runner/__init__).

## 3. Engineering Discipline Ledger (directive §12)

Every change answers "which approved decision does this implement?" — column 'Arch decision' above. Introduced NONE of: speculative abstractions, plugin systems, microservices, browser orchestration, multilingual engines, knowledge graphs, vector DBs, agent frameworks, reasoning layers. The only generic seams are Transport (injection point required for deterministic tests) and the store — both mandated by D-contracts.

## 4. Known Limitations (honest)

1. Live-network acquisition untested in suite (by design: deterministic; FakeTransport fixtures encode evidenced formats — FDIC-style RSS w/ offset pubDate, Fed enforcement HTML). One live smoke against a real feed remains advisable in a networked environment before Phase 2.
2. JSONL store is Phase-1 persistence (D9 principles honored); SQL engine selection deferred (Engine Selection §2).
3. `_process_item` extracts feed-item link pages; description-only feeds (content inside `<description>`) not yet handled — matches current pipeline behavior, noted for Phase 2.
4. html_index mode implemented but covered only via unit-level link extraction (no OFAC-style end-to-end test yet).
5. Timestamp fixtures are UTC-offset-based; no tz database (embeddable constraint) — JurisdictionRule uses fixed offsets, exactly as D4 designed.

## 5. Deferred Capabilities (unchanged)

Rendering integration · XLS/PDF adapters · Insight (condition-gated) · ISTAT pattern remediation candidate (config-domain, now expressible purely through `SourceConfig.patterns` — no core change needed, per FED_ENF precedent) · retention periods · production requirements (Review §P map).

## 6. Rollback

Single-commit rollback point: this commit reverts cleanly (all new files, zero modifications to existing artifacts — frozen docs, pipeline scripts, website, mvp untouched).

## 7. Phase 1 Deliverable Report (directive §16)

1. **Components reused:** detector rules (6 types verbatim), extractor pattern semantics + PATTERN_TYPE_METADATA, normalizer text pipeline, pipeline states, source-config data model, evidence-chain concept.
2. **Components refactored:** fetcher→DirectHttpAdapter (+retrieval events/representations, −playwright), IO→canonical delivery interface, configs→validated SourceConfig.
3. **Components replaced:** random uuid ids → deterministic sha256-derived identities; naive published_at → 6-field temporal tuples; file/print outputs → append-only store.
4. **New contracts implemented:** Institution/Source/Document/Representation/RetrievalEvent/Fact/Event/Evidence/IntelligenceObject/Delivery + TemporalTuple + supersession model + entity registry + NR-v1.
5. **Tests created:** 31 (5 files + runner).
6. **Tests passed:** 31/31, double-run deterministic. 
7. **Known limitations:** §4 above.
8. **Deferred capabilities:** §5 above.
9. **Core readiness status:** NOT claimed — "Core Ready" requires Phase 2 validation (multi-source run, live smoke) per the gate sequence.
10. **Can Institutional Buyer Simulation be prepared?** Partially — Contracts A/B/C are implementable against these primitives (registry-driven selection; traceability query over the embedded IO chain; idempotent delivery). Preparing the simulation is justified as the NEXT phase's design work; running it remains gated behind Core validation.

**STOP per directive.** No Repository 4, no Railway, no product connections, no rendering, no XLS/PDF, no new event types, no Insight, no simulation run. Next gate: `Core Validation → Institutional Buyer Simulation`.

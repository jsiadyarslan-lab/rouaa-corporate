# Pipeline B-Closure — Frozen Baseline

**Branch**: `pipeline-b-closure`
**Date**: 2026-08-12
**Purpose**: Establish frozen pipeline baseline for Gate B verdict

## What This Branch Contains

### Core Pipeline (FROZEN)
- `schemas.py` — data model (Document → Fact → Event → Evidence → ProvenanceChain → IntelligenceObject)
- `fetcher.py` — access layer (urllib → Playwright fallback → blocked classification)
- `content_extractor.py` — normalization (HTML semantic containers, paragraph clusters, PDF extraction)
- `extractor.py` — fact extraction (data-driven via PATTERN_TYPE_METADATA + value_type)
- `detector.py` — event detection (data-driven via EVENT_TYPE_RULES)
- `evidence.py` — evidence + provenance chain builder
- `intelligence_object.py` — IO generator (uses build_headline/build_summary from detector)
- `pipeline_state.py` — state machine (PENDING → ACCESSIBLE → DOCUMENTED → EXTRACTED → EVIDENCED → GOVERNED → PUBLISHABLE | FAILED | BLOCKED)
- `source_configs.py` — 15 source configs (5 Phase A + 10 Phase B)
- `normalizer.py` — legacy normalizer (preserved for backward compat)

### Test Runners
- `run_pipeline.py` — Phase A runner (5 central banks)
- `run_phase_b.py` — Phase B runner (10 new sources)
- `run_b_closure.py` — B-Closure runner (frozen pipeline, full telemetry)

### Reports
- `ARCHITECTURE_GATE_REPORT.md` — 7-dimension architecture review
- `PHASE_B_PLAN.md` — Phase B source selection + stress test rationale
- `PHASE_B_COLD_RUN_REPORT.md` — Cold run discoveries (before fixes)
- `PHASE_B_REPORT.md` — Phase B results (pre-B-Closure)
- `B_CLOSURE_REPORT.md` — B-Closure results (frozen pipeline, honest measurement)

### Results (output/)
- `phase_a_results.json` — Phase A regression (4/4 PASS, RBA BLOCKED)
- `phase_b_results.json` — Phase B results (7/10 PUBLISHABLE)
- `b_closure_results.json` — B-Closure results with pipeline hash verification
- `b_closure_run.log` — Full B-Closure run log
- `phase_b_onboarding_run.log` — Phase B run log

## Frozen Pipeline Hash

The B-Closure test verified the pipeline was NOT modified during testing:
- SHA-256 hash computed before and after test
- Hash matched — pipeline was frozen

See `b_closure_results.json` for the actual hash values.

## Gate B Verdict

**YELLOW — Architecture promising, productization not proven**

See `B_CLOSURE_REPORT.md` for full analysis.

## Next Steps (Per User Direction)

1. ✅ Freeze pipeline baseline (this branch)
2. ✅ Record telemetry for 10 sources
3. ⬜ Apply configuration-level fixes (BOJ role_patterns, FCA defendant regex)
4. ⬜ Re-run same 10 sources
5. ⬜ Recalculate Gate B

**NOT included in this branch:**
- JS/proxy infrastructure (deferred)
- Phase C (30 sources) (blocked by Gate B)
- Website changes (FROZEN)

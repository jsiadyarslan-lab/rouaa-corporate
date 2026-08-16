# ROUAA INTELLIGENCE CORE PRE-SIMULATION HARDENING V1

**Status:** EXECUTED — TARGETED IMPLEMENTATION FIXES + FULL RE-VALIDATION
**Date:** 2026-08-16
**Directive:** EXECUTION DIRECTIVE — PRE-SIMULATION CORE HARDENING V1 (user-issued verbatim)
**Base:** Minimum Core @ `9af81b7` + Phase 2 Validation @ `0f4139b` (verdict: PASSED WITH BOUNDED LIMITATIONS)
**Discipline:** Narrow hardening only — NO scope expansion (no rendering, no XLS/PDF, no Insight, no new event types, no product integrations, no Repository 4). No new architecture decisions; Architecture V1.1 unaltered; frozen artifacts untouched. L-DES intentionally untouched.

---

## 1. L-EVT-PROP — Event propagation across representation versions → **RESOLVED**

- **Root cause:** `governance.recompute_event` re-resolved only the ORIGINAL snapshot fact_ids via `current_fact`; when a fact was superseded **across representations** (`superseded_by` → new fact_id), the old id resolved to a SUPERSEDED row, was filtered out, and the function returned `None` — the event died instead of re-deriving from successors.
- **Implementation change** (`intelligence_core/governance.py`): new `_resolve_active_fact(store, fact_id)` follows the supersession chain (same-id version path `fact-x:vN` AND cross-id `superseded_by` links, with a cycle guard) to the terminal ACTIVE fact. `recompute_event` now resolves EVERY snapshot fact through its chain; if all chains are INVALIDATED (withdrawn without successor), it appends an **INVALIDATED event version** — an event never silently disappears. No new states added.
- **Affected contract:** D2 (correction/version semantics; two-truths preservation).
- **Tests before:** Phase-2 content-change: `event_recompute: false` (event died). **After:** regression Cases A–F all PASS (single supersession — same-id and cross-representation; mixed facts; all-superseded survival; INVALIDATED terminal state; historical v1 exact reproducibility; deterministic lineage across stores; repeated-recompute idempotency — no extra rows).
- **Phase-2 replay after fix:** `event_recompute: true`, `historical_reproducible: true`, `old_fact_status: SUPERSEDED`.

## 2. L-REL — Relative html_index URL resolution → **RESOLVED**

- **Root cause:** `pipeline.run_source` fetched html_index item links verbatim; relative hrefs reached `urllib` as `"Content/EN/…"` / `"/Articles/…"` → `unknown url type` → BLOCKED.
- **Implementation change:** new `acquisition.resolve_index_link(href, index_url)` (urljoin against the index page) applied to every html_index link before Document fetch. NR-v1 canonicalization unchanged, still applied at fetch time. No unrelated acquisition behavior altered.
- **Affected contract:** D1 (document identity derives from canonical URLs of fetched documents).
- **Tests before:** Phase-2 live run with raw relative links → `BLOCKED (unknown url type)`. **After:** 5 regression tests (absolute, `/root-relative`, path-relative, `../`, query preservation) PASS.
- **Live proof:** Phase-2 replay re-run with the html_index fixture carrying **RAW relative hrefs** — DGT processed `items=2, DOCUMENTED` through the Core's own resolution (previously impossible without harness preprocessing).

## 3. L-SRC — Source registry / pipeline ownership → **RESOLVED**

- **Root cause:** the pipeline never persisted `Source` rows; Phase-2 had to register them harness-side, contradicting the Core boundary (Source Registry → Entity Resolution → Acquisition → Traceability is Core-owned).
- **Implementation change:** new `pipeline.ensure_source(store, cfg, institution)` — called ONLY after entity resolution succeeds. Idempotent (same source_id + same institution → no duplicate row); refuses institution rebinding (D6 discipline — explicit supersession required); failed/mismatched/unverified entity → BLOCKED before any Source row exists.
- **Affected contract:** D6 (entity-resolved sources) + traceability chain completeness.
- **Tests before:** Phase-2 harness `register_sources` workaround + traceability depended on it. **After:** 4 regression tests (persisted-once idempotent; failed resolution → no row; mismatched entity → no row; banned/unverified domain (`bmf.de`) → BLOCKED, no row — BMF regression remains active) PASS.
- **Live proof:** replay with harness registration REMOVED — `sources: 5` (exactly the 5 entity-passing sources; FDIC correctly refused at the platform-domain gate → no row), traceability **0 broken links**.

## 4. L-DES — intentionally untouched

`BOUNDED MINIMUM CORE LIMITATION` (adapter-level; description-only feeds). No support added, no scope change — per directive §5/§6.

## 5. Test Suite Results (directive §4 — ALL TESTS PASS)

| Suite | Before hardening | After hardening |
|---|---|---|
| Unit tests (31) | 31/31 PASS | **48/48 PASS** (31 existing + 17 new hardening regressions) |
| Phase-2 live replay (fresh capture, 6 sources) | event propagation FAIL (L-EVT-PROP); DGT needed harness-preprocessed absolute links; sources registered manually | **event_recompute TRUE; DGT via RAW relative links (Core-resolved); Core-registered sources (5/6, FDIC correctly refused); traceability 0/4 broken; determinism TRUE** |
| Fresh-store replay | identical lineage | **identical lineage** |
| Same-source idempotency | PASS | **PASS** (facts/events/IOs/deliveries stable; retrieval events + audit grow by design) |
| Content-change/versioning | event died | **new event version + historical reproducibility + old fact SUPERSEDED** |
| Multi-source isolation | PASS | **PASS** (ISTAT PUBLISHABLE + DGT DOCUMENTED + invalid-path BLOCKED) |
| Traceability verification | 0 broken (with harness workaround) | **0 broken (Core-owned registration)** |

Determinism double-run of the full unit suite: 48/48 both runs.

## 6. Evidence Ledger (material artifacts of this hardening run)

Live re-capture (19 artifacts, direct HTTP; full hashes in `capture/ledger.json` regenerated by the committed harness): FDIC GovDelivery feed `8bdba0c4…` (926,905 B — byte-identical to Phase-2/Q2), GovDelivery bulletins `8dfbe035…`/`16916a30…`/`61ca0ca5…`, ISTAT feed `5a6fe3a9…` (byte-identical), ISTAT CPI page `f5180f86…` (103,894 B — content changed since Phase 2's `5bb099af…`, as live pages do), DFSA feed `9f10799d…` (byte-identical), Ministry EN home (Radware captcha, 15,070 B), OBR feed/pages, DGT homepage + articles. Code artifacts of this commit: `governance.py`, `acquisition.py`, `pipeline.py` (fixes), `tests/test_hardening.py`, `tests/run_all.py`, `tests/phase2_live_validation.py` (harness updated to exercise Core-side behavior).

## 7. Contract Mapping (directive §8)

- L-EVT-PROP fix → **D2** (versioned correction propagation; two truths).
- L-REL fix → **D1** (canonical document identity requires resolvable canonical URLs).
- L-SRC fix → **D6** (entity-resolved, Core-owned source registry).
- No D4 changes were needed; temporal behavior re-verified unchanged in replay.

## 8. Remaining Bounded Limitation

**L-DES only** (description-only RSS; adapter-level; MINIMUM CORE LIMITATION — deferred by design). Known source-level boundaries unchanged (FDIC platform-distribution entity rule — D6 extension point; Ministry Radware access — rendering-gated, out of scope).

---

# VERDICT

# `PRE-SIMULATION HARDENING PASSED`

```text
L-EVT-PROP = RESOLVED
L-REL       = RESOLVED
L-SRC       = RESOLVED
L-DES       = DEFERRED / BOUNDED
```

**STOP per directive §10 — Institutional Buyer Simulation NOT run in this task.** Next step (only per this PASS): **INSTITUTIONAL BUYER SIMULATION V1** — the final gate before Repository 4 (`ROUAA Intelligence Core`) → Railway → News / Trading / Corporate.

# ROUAA INTELLIGENCE CORE PHASE 2 VALIDATION V1

**Status:** EXECUTED — LIVE-VALIDATION EVIDENCE (validation only; no core modifications)
**Date:** 2026-08-16
**Directive:** EXECUTION DIRECTIVE — MINIMUM CORE PHASE 2 VALIDATION (user-issued verbatim)
**Validated object:** `intelligence_core/` @ `9af81b7` (Minimum Core Phase 1)
**Execution window:** 2026-08-16T02:5x–03:2xZ (live capture) + deterministic replay executions
**Instruments:** CPython 3.12.8 (session-local embeddable, stdlib-only) · real network via `urllib` (direct HTTP) · harness: `intelligence_core/tests/phase2_live_validation.py` + `phase2_analysis.py` (committed with this artifact for reproduction)
**Discipline:** No scope expansion, no remediation of discovered limitations (directive §19/§21), no frozen-artifact modifications, no Repository 4 / Railway / product connections / simulation.

---

## A. Validation Scope

Validate the Minimum Core against real network sources and real execution behavior across: entity resolution (live gate), live acquisition, full pipeline execution, description-only RSS handling, ISTAT pattern-boundary reproduction, multi-source failure isolation, idempotency, content-change versioning, temporal semantics, machine-verified traceability, delivery, determinism, and SHA-256 evidence capture.

**Method:** one bounded LIVE capture pass (19 real artifacts), then deterministic executions from the capture (two fresh stores for determinism; shared store for idempotency). Fixture preprocessing (documented, harness-side only): RSS bodies truncated to first-n captured items (bounded run); html_index list bodies served as synthetic pages with ABSOLUTIZED hrefs (the Core itself does not resolve relative html_index links — recorded as limitation L-REL).

## B. Real Sources (6, all from committed evidence; no new survey)

| Code | Source | Path (live) | Purpose per directive |
|---|---|---|---|
| FDIC | Federal Deposit Insurance Corporation (US) | GovDelivery RSS `USFDIC_26/feed.rss` | live RSS, explicit tz, regulatory mapping, description-only probe |
| ISTAT | Istituto Nazionale di Statistica (IT) | `/en/feed/` + 3 release pages | live statistical_release execution + pattern boundaries |
| DFSA | Dubai Financial Services Authority (AE) | `/rss` + 2 notice pages | live RSS, regulatory content, provenance |
| MINISTRY | Bundesministerium der Finanzen (DE) — **long domain, NOT bmf.de** | EN home (html_index) | entity-gate + access behavior; BMF regression active |
| OBR | Office for Budget Responsibility (GB) | `/feed/` + 3 pages | additional live RSS from Q2 evidence (S7) |
| DGT | Direction générale du Trésor (FR) | homepage + `/Articles/` pages (html_index) | additional live HTML path from Q2 evidence |

## C. Entity Resolution Results (live gate)

Positive: 6/6 resolved via verified domain bindings (FDIC→www.fdic.gov binding, ISTAT, DFSA, MINISTRY→bundesfinanzministerium.de, OBR, DGT).
Negative controls (live): `bmf.de → Ministry` **REJECTED (correct)**; brand lookup "BMF" **FORBIDDEN (correct)**; `bmf.de → Bürener Maschinenfabrik GmbH` **ACCEPTED (correct)** — the full BMF regression holds.
**Structural finding (entity-level):** the FDIC *feed itself* lives on `public.govdelivery.com` and its item pages on `content.govdelivery.com` — a **third-party distribution platform domain**. The Core **correctly refused** the platform host as unverified for FDIC (D6). Classification: **source/entity boundary — platform-distributed feeds** (requires a distribution-platform evidence rule, e.g. platform-declared agency ownership; an extension point of D6, NOT auto-acceptance). Recorded; not remediated.

## D. Live Acquisition Results

19 artifacts captured (ledger §R): all HTTP 200 via direct HTTP. **Cross-session byte-stability confirmed for 5 artifacts against committed evidence:** ISTAT feed (`5a6fe3a9…` = Q2), DFSA feed (`9f10799d…` = Q2), FDIC feed (`8bdba0c4…` = Q2), DGT homepage (`94de3878…` = Q2/Post-Q3), DGT article A1 (`df63bb44…` = Post-Q3). DGT A1 was fetched twice in-batch → **same representation_id both times (D1 idempotency proven live)**; retrieval_events=10 vs representations=9 reflects exactly this.
Ministry EN home returned the **Radware captcha body (15,070 B — byte-size identical to Q2/Q3 committed captures)** → 0 list links → DOCUMENTED/items 0. Classification: **source access limitation** (direct-HTTP gated; rendering instrument passes per committed evidence but rendering is OUT of Minimum Core scope). Consistent, not new.

## E. Pipeline Results (real executions, cached-real inputs)

| Source | State | Items | Notes |
|---|---|---|---|
| ISTAT | **PUBLISHABLE** | 3 | 4 facts, 2 events (`statistical_release`), 2 IOs, 2 deliveries |
| DFSA | DOCUMENTED | 2 | 0 facts (penalty patterns found no fines in current notices) → pattern specificity, config-domain |
| OBR | DOCUMENTED | 3 | 0 facts (forecast-announcement content; Eurostat statistical phrasings absent) → pattern specificity, config-domain |
| DGT | DOCUMENTED | 1 distinct (A1 ×2 fetches) | 0 facts — **expected by architecture** (scoped-out content class; no event type) |
| MINISTRY | DOCUMENTED | 0 | Radware captcha body (D) |
| FDIC | BLOCKED | 0 | entity rejection of platform domain (C) — correct D6 behavior |

Totals (store1): sources 6 (explicitly registered — see L-SRC) · documents 9 · representations 9 · retrieval_events 10 · facts 4 · events 2 · evidence 4 · IOs 2 · deliveries 2 · audit 14.

## F. Description-only RSS Result

**`DESCRIPTION_CONTENT_LIMITATION CONFIRMED` — MINIMUM CORE LIMITATION (adapter-level).**
Evidence: GovDelivery FDIC `<description>` fields carry **full press-release text** (longest = 3,527 chars, live-captured, begins "PRESS RELEASE | JULY 31, 2026 Joint Statement of Enforcement Policy…"); ISTAT descriptions are 186-char summaries; OBR 551-char excerpts; DFSA stubs. Code-path fact: `intelligence_core/pipeline.py` never reads `<description>` — extraction binds to the **link-page representation only**. Exact failure point: a feed whose meaningful content exists only in `<description>` (contentless link pages) would yield **0 facts**. Remediation (materializing description content as a representation) deferred per directive §19.

## G. Multi-source Failure Isolation

Batch [ISTAT + DGT + FDIC(invalid path)] on a fresh store: ISTAT **PUBLISHABLE**, DGT **DOCUMENTED**, FDIC **BLOCKED** — no cross-contamination, no global crash. PASS.

## H. Idempotency (same store, real inputs)

Second full suite on the SAME store: documents 9→9, representations 9→9, facts 4→4, events 2→2, IOs 2→2, **deliveries 2→2 (no duplicates)**; retrieval_events +10 and audit +14 (correct: retrieval events are per-act records; append-only audit grows by design). Harness re-registration appended duplicate Source rows (see L-SRC note). PASS.

## I. Content-change Versioning (controlled fixture from REAL captured doc)

ISTAT CPI page (real capture) modified (`2.9`→`3.1`), same URL, re-run:
- same `document_id` ✓ · **new `representation_id`** (1) ✓ · new content_sha256 ✓
- new fact on the new representation (1) ✓; old fact closed **SUPERSEDED** via `supersede_fact_by_source(SOURCE_REVISION, evidence-linked)` ✓
- **historical version reproducible** ✓ (event v1 snapshot resolves against retained rows)
- **new event version: NOT achieved** — precise failure: `governance.recompute_event` re-resolves the OLD snapshot's fact_ids only; when all are SUPERSEDED it returns None (event dies) instead of following `superseded_by` to successor facts. Same-representation corrections DO propagate (Phase-1 unit-proven). Classification: **implementation limitation L-EVT-PROP** (§N).
- pipeline did NOT auto-trigger recompute on re-run (governance ops are explicit) — **implementation limitation L-PIPE-RECOMPUTE** (§N).

## J. Temporal Validation (real timestamps)

| Source | Real value | Status | normalized_utc | ordering |
|---|---|---|---|---|
| FDIC (RSS) | `Mon, 10 Aug 2026 13:10:04 -0500` | EXPLICIT_OFFSET | `2026-08-10T18:10:04Z` | ✓ |
| ISTAT | `Wed, 12 Aug 2026 08:00:58 +0000` | EXPLICIT_ZONE | `2026-08-12T08:00:58Z` | ✓ |
| DFSA | `Wed, 06 May 2026 08:16:50 +0000` | EXPLICIT_ZONE | `2026-05-06T08:16:50Z` | ✓ |
| DGT (live article) | URL `2026-06-25` vs `<time>` `2026-07-17` | DATE_ONLY ×2 | NULL | ✗ (coexist ✓ — the committed A1 divergence reproduced LIVE) |

Ordering guard: 1 participant of 2 (naive excluded). No timezone rules added. PASS.

## K. Evidence Traceability (machine-verified)

All IO chains (4 links) verified programmatically: fact→evidence→representation (`content_sha256` re-hashed from the stored blob — match) →document→source→institution. **Broken links: 0.** PASS (with L-SRC note: Source rows were registered explicitly by the harness because the pipeline does not write them itself).

## L. Delivery Validation

Versioned delivery ✓ · idempotent per (io, version, destination) — second deliver returned the existing record ✓ · duplicate prevention ✓ · audit records present (14) ✓ · local test destination ✓. **External transport does not exist in the Minimum Core** (delivery is a ledger) → transport-failure semantics UNTESTED live (recorded); content-failure semantics surface via traceability per D8-C.

## M. Determinism

Two executions from the same capture on fresh stores: **identical lineage** (facts/events/IOs/representations/deliveries — all identity lists equal). Live double-run determinism is not asserted (content may change by nature); replay determinism + byte-stable artifacts (§D) cover the identity guarantee. PASS.

## N. Failures / Limitations (classified per directive §18)

| ID | Finding | Class | Exact location / note |
|---|---|---|---|
| L-DES | description-only feeds unsupported | **adapter limitation (MINIMUM CORE LIMITATION)** | pipeline extracts from link-page representation only; `<description>` never materialized (F) |
| L-REL | html_index relative links not resolved by Core | implementation limitation | `pipeline._process_item` fetches item link without base; harness preprocessed fixtures (A) |
| L-SRC | pipeline never writes Source rows | implementation limitation (minor) | harness registered sources explicitly via Core contracts; traceability then 0-broken |
| L-EVT-PROP | cross-representation supersession does not propagate event re-versioning | **implementation limitation** | `governance.recompute_event` — returns None when all snapshot facts SUPERSEDED; does not traverse `superseded_by` (I) |
| L-PIPE-RECOMPUTE | recompute not auto-triggered by pipeline re-runs | implementation limitation | governance ops explicit by design; wiring deferred |
| S-FDIC-PLATFORM | FDIC distributed via govdelivery.com platform | **source/entity boundary (D6 extension point)** | correct rejection; needs distribution-platform evidence rule |
| S-MINISTRY-RADWARE | ministry direct-HTTP = Radware captcha (15,070 B) | source access limitation | matches committed Q2/Q3; rendering out of scope |
| C-DFSA / C-OBR | 0 facts (current content lacks matching phrasings) | configuration / pattern specificity | config-domain; FED_ENF-precedented remediation path |
| A-DGT | 0 facts | architecture (by design) | scoped-out content class (D3); documents+provenance carried |

## O. What Phase 2 Establishes

1. The Minimum Core executes **live end-to-end** on real official sources: entity gate → acquisition → representation → extraction → detection → evidence → IO → delivery (ISTAT: PUBLISHABLE with real facts/events/IOs/deliveries).
2. **BMF entity regression holds live** (all three negative/positive controls), and a NEW structural boundary was surfaced and correctly refused (platform-distributed feeds).
3. D1 identity works on real data: byte-stable artifacts across sessions; duplicate fetches deduplicate to the same representation.
4. Temporal contract behaves exactly per D4 on real timestamps, including the live reproduction of the DGT conflicting-dates case and the ordering guard.
5. Traceability is machine-verifiable end-to-end with zero broken links (given explicit source registration).
6. Idempotency, isolation, determinism (replay), delivery idempotency: PASS on real inputs.
7. Post-Q3 ISTAT pattern boundaries **reproduced through the new Core** (CPI → generic metric only; trade doc → 0 facts) — classified configuration/pattern-specificity, not architecture.
8. Five bounded limitations precisely located (N) — none architectural; all recorded for a future remediation decision.

## P. What Phase 2 Does NOT Establish

- No claim of "Core Ready" (final readiness = Institutional Buyer Simulation).
- No live test of description-only remediation, rendering, XLS/PDF (out of scope by directive).
- No external-transport delivery semantics (no transport exists in minimum core).
- No prevalence claims; per-source observations only.
- L-EVT-PROP means source-revision corrections do not yet auto-propagate to event versions — bounded and recorded, unresolved by directive §19.

## Q. Core Readiness Verdict

All directive-mandated checks executed live; failures/limitations are precisely classified (§N): two source-specific access/entity boundaries (consistent with committed evidence), two configuration-domain pattern results, one by-architecture scoped-out case, and five bounded implementation/adapter limitations — **none is an architecture-model failure**.

# `CORE VALIDATION PASSED WITH BOUNDED LIMITATIONS`

Bounded limitations that must accompany any Phase-3 (simulation) use: L-DES, L-REL, L-SRC, L-EVT-PROP, L-PIPE-RECOMPUTE (§N), plus the FDIC platform-distribution entity rule (D6 extension point) and Ministry access (rendering-gated, out of scope).

---

## R. Evidence Ledger (19 live-captured artifacts; SHA-256 prefixes; full hashes in `capture/ledger.json` reproduced by the committed harness)

| Artifact | Status | Bytes | SHA-256 (prefix) | Note |
|---|---|---|---|---|
| GovDelivery USFDIC_26 feed | 200 | 926,905 | `8bdba0c4…` | = Q2 committed capture (byte-identical) |
| content.govdelivery bulletins ×3 | 200 | 42–45 K | `8dfbe035…`, `16916a30…`, `61ca0ca5…` | FDIC item pages (platform domain) |
| ISTAT /en/feed/ | 200 | 26,565 | `5a6fe3a9…` | = Q2 (byte-identical) |
| ISTAT consumer-prices-july-2026 | 200 | 103,891 | `5bb099af…` | CPI doc (boundary reproduction) |
| ISTAT foreign-trade-june-2026 | 200 | 105,820 | `359dd6e6…` | trade doc (0 facts reproduced) |
| ISTAT industrial-production-june-2026 | 200 | 103,743 | `e1c34504…` | 3 facts |
| DFSA /rss | 200 | 10,153 | `9f10799d…` | = Q2 (byte-identical) |
| DFSA news pages ×2 | 200 | ~54 K | `f89028c1…`, `0e725333…` | |
| Ministry EN home | 200 | 15,070 | `c89f1b50…` | **Radware captcha body** (size matches committed Q2/Q3) |
| OBR /feed/ | 200 | 32,507 | `96c65e68…` | |
| OBR pages ×3 | 200 | 93–99 K | `9abeeb3e…`, `d5a17bb8…`, `a7133059…` | |
| DGT homepage | 200 | 26,412 | `94de3878…` | = Q2/Post-Q3 (byte-identical) |
| DGT Articles/2026/06/25 (A1) | 200 | 43,327 | `df63bb44…` | = Post-Q3 (byte-identical); fetched 2× → same representation |

Reproduction: `python -m intelligence_core.tests.phase2_live_validation` then `python -m intelligence_core.tests.phase2_analysis` (network required for the capture pass; replay/executions are offline).

---

**Phase 2 closed. Validation evidence only — the Core was NOT modified (all limitations recorded, remediation deferred per directive §19/§21). STOP: no simulation run, no Repository 4, no Railway, no product connections. Next gate: Phase 2 Validation Review → Institutional Buyer Simulation (permitted per this verdict: PASSED WITH BOUNDED LIMITATIONS).**

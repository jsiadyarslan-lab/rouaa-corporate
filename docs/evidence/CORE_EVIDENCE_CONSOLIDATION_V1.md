# CORE EVIDENCE CONSOLIDATION V1

**Status:** CONSOLIDATED EVIDENCE BASELINE — for Core Architecture Definition
**Date:** 2026-08-15
**Directive:** EXECUTION DIRECTIVE — EVIDENCE CONSOLIDATION V1 → CORE ARCHITECTURE DEFINITION V1 (user-issued verbatim)
**Nature:** Consolidation only. No new survey. No engineering. No frozen artifact rewritten (including the historical misattribution documented in §B — corrected by SUPERSEDING record, history preserved). No prevalence, no percentages, no denominators.

---

## A. Evidence Lineage

Traceable chain with exact evidence commits (branch `top20-prescreening` unless noted):

```text
Global Source Universe V1 (docs/strategy/GLOBAL_SOURCE_UNIVERSE_V1.md — branch global-source-inventory, 2026-08-13)
  ↓
Top-20 Pre-Screening + Gate 5 series (4443553, b70171e, 3a759cd, b59ab3f, 282de0f, 3454603, f16bc00,
  plus Architecture Gate / Phase B / B-Closure basis de64f31, a36d9d9, bd7285d, 18e9897)
  ↓
Qualification v2 (COMMERCIAL_SOURCE_QUALIFICATION_MODEL_V2_DESIGN.md — FROZEN design)
  ↓
Capability Evidence Registry V1 (dd66cc1 — FROZEN evidence baseline)
  ↓
Design Constraints V1 (bb3f43a — FROZEN)
  ↓
Capability Investment Decision Framework V1 (c02374a — FROZEN, denominator reconciled)
  ↓
Cross-Jurisdiction Expansion V1 (654e7f8) + Evidence Records V1 (73b7668, dual-session verified)
  + status resolution (590eecd)
  ↓
Expansion Assessment V1 (46f7153) + Investment Decision Reassessment V1 (8379bc9)
  ↓
Strategic Decision Record V1 (05eff94 — Customer Demand not a gating condition; priority chain)
  ↓
Q1 LSE Browser Validation (ee7ca83 — pipeline 5/5 PASSED)
  ↓
Q2 Cross-Jurisdiction Validation (a72d5d8 — 9 cases / 7 jurisdictions)
  ↓
Q3 Event-Model Contract Validation (c7109ca — integrity gate + 4/6 contract-compatible)
  ↓
Post-Q3 Targeted Validation (f6c5a8b — 2 scoped model gaps; ISTAT execution 2/3; bmf.de misattribution)
  ↓
CORE ARCHITECTURE REQUIREMENTS (this document → ROUAA_INTELLIGENCE_CORE_ARCHITECTURE_V1.md)
```

Evidence integrity standard adopted across Q3/Post-Q3: material captured files carry SHA-256 (48 hashed files total: 35 in Q3 §P + 13 in Post-Q3 §F); reproduction commands recorded per artifact; corrections recorded in NEW artifacts only.

## B. Entity Identity Correction — BMF (MANDATORY)

### FORMAL RECORD: `ENTITY-MISATTRIBUTION / SUPERSEDING EVIDENCE`

| Field | Record |
|---|---|
| **Corrected fact** | `bmf.de` = **Bürener Maschinenfabrik GmbH ("BMF Group")** — a private German machinery manufacturer (Fördertechnik, Kühlschmierstoffsysteme, Komponenten, Kunststoff; WordPress 7.0.4 corporate site; verified via item page `bmf.de/uwa/`, hash `c71663ea…`, Post-Q3 `f6c5a8b`) |
| **It is NOT** | the German Federal Ministry of Finance (Bundesministerium der Finanzen) |
| **Erroneous record** | `EVIDENCE_RECORDS_V1.md` S1 @ `73b7668` — "S1 BMF — Germany, Finance Ministry · https://www.bmf.de/ ; feed https://www.bmf.de/feed/" — incorrectly associated `bmf.de` with the Ministry. The parent Expansion artifact (`654e7f8`) inherited the same attribution for source S1. |
| **Data validity** | The underlying observed data (RSS 2.0, 10 items, 10 pubDates) are **real and reproducible** (triply executed: Expansion session, 20:55Z dual-verification, 21:41Z integrity rerun → identical result) — but they belong to the **wrong entity** |
| **Usage restriction** | Those observations **MUST NOT be used as evidence for German Ministry of Finance coverage** in any consolidation, coverage basis, or architecture input |
| **Separate entity path** | The Ministry of Finance = `bundesfinanzministerium.de` (long domain): Pressemitteilungen/EN press paths, rendering-instrument VALIDATED (dual byte-identical Chromium runs, Q2 `a72d5d8` + Q3 `c7109ca`), bilingual DE↔EN with same-release URL-date correspondence; curl-side Radware gate intermittent |
| **History preservation** | **No historical frozen artifact is rewritten.** `73b7668` and `654e7f8` stand as recorded; THIS record supersedes their S1 entity attribution. Do not delete history; do not silently overwrite the old evidence. |
| **Root cause class** | Source onboarding performed hostname→institution inference without entity verification (the S1 title "BMF" matched the ministry's common abbreviation) |

**Consequence for the lineage:** the Expansion's "S1 BMF VALIDATED" evidence-line moves to the **Bürener Maschinenfabrik entity** (corporate PR class, out of institutional-finance scope → NOT ALIGNED). Germany's ministry evidence base = Q2/Q3 long-domain rendering cases only.

## C. Confirmed Core Boundaries (evidence-supported only)

### C.1 Source Identity / Entity Resolution — **NEW CONFIRMED REQUIREMENT**

```text
hostname → institution → jurisdiction → institutional class → source ownership
```

- Evidence: the bmf.de misattribution (§B) proves domain-level probe success ≠ correct entity. A source cannot enter the trusted evidence layer until entity identity is established.
- Resolution status: **UNTESTED** as a formal stage (no verification mechanism exists in the current pipeline).

### C.2 Content Path

```text
institution → correct intelligence path → representative document
```

- Evidence: US Treasury/RBI/SEBI/PRA content-path mismatches (caught by v2 pre-screening); DGT Trésor-Info qualification (5/5 census); ministry Pressemitteilungen qualification.
- Boundary: domain-level accessibility is NOT proof that the correct intelligence path was selected. VALIDATED as a discipline (v2 stage exists); mixed-path feeds remain a per-source boundary.

### C.3 Acquisition / Rendering

Observed acquisition patterns (all evidence-anchored): RSS (FDIC/ISTAT/DFSA/bmf.de-corp), static HTML (MoF-JP EN), server-rendered HTML (FDIC list, DGT, ministry under rendering), browser-rendered JS shell (LSE), document repository + structured files (MoF XLS), anti-bot (DMO hard / ministry intermittent), network/TLS failure (CBUAE).

**Separation established:** `adapter capability` (rendering instrument resolves JS-shell — LSE Q1; resolves soft anti-bot — ministry Q2/Q3) vs `source-specific behavior` (ShieldSquare-hard blocks DMO even under real Chromium; environment TLS/SNI rejects CBUAE under both instruments). Adapter failure is NOT inferred from source-specific behavior, and vice versa.

### C.4 Document Intelligence

```text
fetch → normalize → extract → detect
```

Proven boundaries: pattern specificity (FED_ENF remediated config-only `f16bc00`; ISTAT CPI/trade misses — Post-Q3); terminology variation (ABS hypothesis; ISTAT phrasing); document structure variance (LSE rendered table vs RSS items); structured files (MoF XLS binary-serial dates — format-aware parsing UNTESTED). Nothing implemented in this phase.

### C.5 Evidence & Provenance

```text
Source → Document → Fact → Evidence → Provenance
```

Must explicitly preserve: original publication timestamp/value, provenance source/type, update timestamp if different (DGT A1: URL 06/25 vs time-attr 07/17), source URL, document identity. Current contract (`Fact.published_at: str`) preserves none of the temporal semantics — see §D.

## D. Timestamp Architecture Requirement — CONFIRMED CORE DESIGN REQUIREMENT

**Status: `CORE DESIGN REQUIREMENT — IMPLEMENTATION NOT STARTED`**

Required representation (minimum) per temporal field:

```text
original_value
original_timezone / timezone_status
normalized_utc
timestamp_semantics
provenance_source
```

Timestamp semantics must distinguish: publication · update/modification · document date · effective date · reporting period · date-only · unknown/ambiguous.

Evidence anchors (all confirmed):
- **LSE** — local/unspecified time ("14 August 2026" + "07:00:02", no zone) → naive class
- **FDIC** — explicit numeric offset (RSS `-0500`) + date-only HTML `<time>` → dual class within one source
- **ISTAT / DFSA** — explicit timezone (`+0000`, second precision)
- **DG Trésor** — URL/date conflict (A1: `/2026/06/25/` vs `2026-07-17`) + naive ISO-like datetimes (`2026-07-29T00:00:00.0000000`)
- **BMF ministry** — explicit-zone feed vs rendered date-only displays
- **MoF-JP** — dates in filenames; XLS binary serial dates
- **Contract fact**: `Fact.published_at` is a timezone-naive string (schemas.py)

## E. Event Model Consolidation

### Existing supported types (contract @ `c7109ca`)
6 types with trigger-metric contracts: `monetary_policy_decision`, `regulatory_enforcement`, `statistical_release`, `earnings_release`, `sanctions_designation`, `market_statistic_release` (+ data-driven subtypes; identity-fallback pattern normalization for all non-rate pattern types).

### Confirmed compatible examples (contract-level; execution where noted)
- LSE → `earnings_release` candidate (first in evidence base; execution UNTESTED)
- FDIC → `regulatory_enforcement` (execution UNTESTED; FED_ENF same-family precedent)
- ISTAT → `statistical_release` (**execution CONFIRMED 2/3 docs** — §F)
- DFSA → `regulatory_enforcement` (execution UNTESTED; BaFin precedent)

### Confirmed representation gaps (scoped — NOT an authorization to add event types)
1. **DG Trésor** — "policy/economic analysis & institutional communication" class (Trésor-Info path, 5/5 census) — not represented by the existing six.
2. **German Ministry of Finance** — "fiscal policy press announcement" class (Pressemitteilungen path) — not represented by the existing six.

Per-directive classification of each gap (evidence-bounded, no solution chosen):

| Question | DG Trésor gap | Ministry gap |
|---|---|---|
| A. Outside current product scope? | UNKNOWN — product scope decision | UNKNOWN — product scope decision |
| B. Missing event type? | No trigger metrics observed in 5/5 docs — event-style representation would violate the trigger-metric design | Press communiqués observed without metric triggers; deeper quantitative paths (budget figures) UNTESTED |
| C. Better as document/knowledge object? | **Evidence-supportive**: analysis/commentary has document character (authors, publication, byline observed); Document/Insight layer fits naturally | **Preliminary-supportive**: announcement character; but see B caveat |
| D. Still insufficiently specified? | Partly — product scope unanswered | **YES** — deeper paths untested before classifying the institution |

Recorded classification: **C-preliminary (DGT), D (Ministry)** — explicitly NOT a decision; deferred to Architecture Review with product-scope input.

## F. ISTAT Pattern-Specificity Record

```text
Execution compatibility = CONFIRMED
Pattern specificity boundary = OBSERVED
```

Preserved results (Post-Q3 `f6c5a8b`, contract-faithful execution with EUROSTAT patterns verbatim):
- 3 documents · 4 facts · 2 events (`statistical_release`) · **0 code changes** · 0 permanent config changes
- CPI custom-pattern miss: "consumer price index … +2.9% on annual basis" evades `inflation_rate` patterns; value survives only as generic `percentage_statistic`
- Trade document miss (0 facts): parenthetical values "exports (+1.6%)" + "compared to" vs required "compared with"
- Root cause: **pattern-specificity** (config domain; FED_ENF `f16bc00` config-only remediation precedent)

**Future validation item created: `ISTAT pattern remediation candidate`** (config-only; converts 2/3 → 3/3 potential and restores `inflation_rate` fidelity; NOT executed).

## G. Capability Consolidation Table

| Capability | Confirmed | Boundary | Resolution | Core implication |
|---|---|---|---|---|
| Entity Resolution | **NEW CONFIRMED REQUIREMENT** | BMF misattribution (bmf.de = private company) | UNTESTED | **mandatory** — no trusted-layer entry without entity identity |
| Content Path | VALIDATED | mixed paths (feeds mixing content classes) | NOT APPLICABLE (operationalized as v2 stage) | mandatory |
| Provenance | VALIDATED | conflicting dates (DGT A1 URL vs time-attr) | UNTESTED | **timestamp design (§D)** |
| Rendering / Adapter | VALIDATED (instrument-level, dual runs) | JS/anti-bot variance (LSE resolves; DMO hard-blocks; CBUAE TLS) | UNTESTED (pipeline integration = engineering) | architecture boundary — adapter class vs source behavior separation |
| Pattern Specificity | VALIDATED | terminology/structure variance | **CONFIG REMEDIATION EVIDENCE** (FED_ENF proven; ISTAT candidate) | config layer — never core code |
| Language | EXISTENCE EVIDENCE (bilingual paths exist: BMF DE↔EN, MoF JA/EN, DGT FR+EN, ISTAT EN) | prevalence UNKNOWN | UNTESTED | future validation |
| Event Model | PARTIAL (6 types; ISTAT execution-confirmed) | fiscal/policy communication classes (2 scoped gaps) | UNTESTED | architecture decision (§E) |

This table is NOT converted into investment decisions.

---

**Consolidation complete. This document is the evidence basis for `ROUAA_INTELLIGENCE_CORE_ARCHITECTURE_V1.md`. No frozen artifact modified. No engineering performed.**

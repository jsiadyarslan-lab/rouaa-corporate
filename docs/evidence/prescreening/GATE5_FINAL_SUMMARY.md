# Gate 5 Representative Validation — Final Summary

**Date**: 2026-08-15
**Branch**: `top20-prescreening`
**Queue baseline**: V1.1 (`001d349`)
**Pre-screening evidence**: `4443553`
**Type**: Gate 5 first-attempt validation — config-only, no source-specific code, no remediation.

---

## Objective

Test whether `QUALIFICATION_READY` from Gates 1-4 predicts successful Gate 5 onboarding capability.

---

## Sample

5 sources representing different onboarding patterns:

| # | Source | Pattern type | Qualifier |
|---|--------|-------------|-----------|
| 1 | US Treasury | Ministry / static HTML (html_index) | None |
| 2 | Bundesbank | RSS-heavy (5 feeds) | None |
| 3 | Banca d'Italia | HTML index + PDF press releases | None |
| 4 | RBI | Multi-feed RSS (6 feeds) | None |
| 5 | BaFin | Financial regulator + provenance qualifier | PROVENANCE DATE PRECEDENCE REVIEW |

---

## Aggregate Results

### Per-source results

| # | Source | Prediction | Gate 5 State | Facts | IOs | Config-only | Engineering |
|---|--------|-----------|-------------|-------|-----|-------------|-------------|
| 1 | US Treasury | QUALIFICATION_READY | DOCUMENTED | 0 | 0 | Yes | No |
| 2 | Bundesbank | QUALIFICATION_READY | DOCUMENTED | 0 | 0 | Yes | No |
| 3 | Banca d'Italia | QUALIFICATION_READY | DOCUMENTED | 0 | 0 | Yes | No |
| 4 | RBI | QUALIFICATION_READY | DOCUMENTED | 0 | 0 | Yes | No |
| 5 | BaFin | QUALIFICATION_READY (with qualifier) | DOCUMENTED | 0 | 0 | Yes | No |

### Prediction accuracy

```text
QUALIFICATION_READY predictions = 5
Gate 5 PASS                                     = 0
Gate 5 FAIL                                     = 5
Prediction confirmed (QUALIFICATION_READY → PASS) = 0
Prediction overturned (QUALIFICATION_READY → FAIL) = 5
Config-only                                      = 5
Engineering-required                             = 0
```

### Per-gate prediction accuracy

| Gate | Predicted PASS | Actual PASS | Prediction correct? |
|------|---------------|-------------|---------------------|
| Gate 1 (Access) | 5 | 5 | ✅ 100% confirmed |
| Gate 2 (Provenance) | 4 PASS + 1 PASS WITH REVIEW | 0 tested (0 facts → 0 provenance) | ⚠️ Untested |
| Gate 3 (Content) | 5 | 5 | ✅ 100% confirmed |
| Gate 4 (Applicability) | 5 candidate | 0 (0 facts extracted) | ❌ 0% confirmed |
| Overall Gate 5 | 5 QUALIFICATION_READY | 0 PASS | ❌ 0% confirmed |

---

## Root Cause Analysis

### All 5 sources failed at the same point

Every source stopped at pipeline state **DOCUMENTED** — the pipeline successfully fetched and normalized documents, but extracted 0 facts because no extraction patterns were defined in the source configuration.

### The prediction gap

```text
Pre-screening (Gates 1-4)          Gate 5 (actual pipeline run)
─────────────────────────          ──────────────────────────────
Gate 1: Access ✅                  Fetch ✅ (all 5 sources)
Gate 2: Provenance ✅              ─── not reached ───
Gate 3: Content ✅                Normalize ✅ (all 5 sources)
Gate 4: Applicability ✅ (candidate) Extract ❌ (0 facts — no patterns)
                                    ─── pipeline stops here ───
                                    Detect ❌ (no facts)
                                    Evidence ❌ (no events)
                                    Provenance ❌ (no evidence)
                                    IO ❌ (no provenance)
                                    Output: reject
```

### Why Gate 4 "candidate applicability" doesn't predict extraction success

Gate 4 assessed whether a configuration category abstraction **exists** that could match the source (e.g., PATTERN_TYPE_METADATA exists and has analogs in SNB/BEA/CFTC). This is a **category-level** assessment.

Gate 5 extraction requires **pattern-level** specificity — actual regex patterns that match the source's content (e.g., "cash rate target at X%", "$X million penalty", "CPI inflation was X%"). Pre-screening did not assess which specific patterns would match each source's content.

The gap: **category-level applicability ≠ pattern-level extraction success**.

### Document counts (all 5 sources)

| Source | Fetched | Normalized | Facts | IOs |
|--------|---------|------------|-------|-----|
| US Treasury | 10 | 9 | 0 | 0 |
| Bundesbank | 10 | 10 | 0 | 0 |
| Banca d'Italia | 10 | 10 | 0 | 0 |
| RBI | 10 | 10 | 0 | 0 |
| BaFin | 20 | 20 | 0 | 0 |
| **TOTAL** | **60** | **59** | **0** | **0** |

---

## Key Findings

### 1. Gates 1 and 3 are reliable predictors

Pre-screening Gate 1 (Access) and Gate 3 (Content) predictions were **100% confirmed** across all 5 sources. Every source that was predicted PASS for access and content did indeed have accessible, substantive content that the pipeline could fetch and normalize.

### 2. Gate 4 has a structural prediction gap

Gate 4 "candidate applicability" does NOT predict extraction success. The gap is between:
- **What Gate 4 assesses**: does a configuration abstraction exist? (yes — PATTERN_TYPE_METADATA exists)
- **What Gate 5 requires**: which specific regex patterns match this source's content? (unknown without content-level pattern testing)

### 3. The pipeline architecture is sound

The pipeline correctly handled all 5 sources at the fetch and normalize levels:
- HTML index parsing worked (US Treasury, Banca d'Italia)
- RSS parsing worked (Bundesbank, RBI, BaFin)
- PDF text extraction worked (Banca d'Italia — 10 PDFs extracted via pdfplumber)
- No source-specific code was needed (source_specific_code = 0 for all 5)
- No engineering intervention was needed (engineering_intervention = False for all 5)

### 4. The provenance qualifier (BaFin) was not the bottleneck

BaFin's PROVENANCE DATE PRECEDENCE REVIEW qualifier was NOT the cause of its Gate 5 failure. The failure occurred at the extraction step (0 facts) — before the pipeline reached the provenance step. The provenance ambiguity was never tested because no facts were extracted to build provenance chains from.

This means the provenance qualifier is a **secondary concern** — the primary prediction gap is at the pattern-definition level.

### 5. QUALIFICATION_READY is necessary but NOT sufficient

All 5 sources were QUALIFICATION_READY (passed Gates 1-4), but none produced publishable IOs. QUALIFICATION_READY means "the source is accessible and has substantive content" — it does NOT mean "the pipeline can extract facts from this content without specific patterns."

---

## What This Proves About the Qualification Queue

### The 5-gate pre-screening framework correctly identifies:

- ✅ Which sources are accessible (Gate 1 — 100% accurate)
- ✅ Which sources have substantive content (Gate 3 — 100% accurate)
- ✅ Which sources are blocked at the access level (Gate 1 FAIL → KNOWN_BLOCKED)
- ✅ Which sources have JS-rendered content (Gate 3 FAIL → SCREENING_ONLY)

### The 5-gate pre-screening framework does NOT identify:

- ❌ Which specific extraction patterns will match a source's content
- ❌ Whether config-only onboarding will produce publishable IOs
- ❌ Whether the source's content type matches existing pattern categories at the regex level

### The prediction value of QUALIFICATION_READY

QUALIFICATION_READY from Gates 1-4 is a **necessary but insufficient** condition for Gate 5 success. It correctly filters out:
- Blocked sources (KNOWN_BLOCKED)
- Inaccessible sources (SCREENING_ONLY — timeout, path-level failures)
- JS-rendered sources (SCREENING_ONLY — content not in static HTML)

But it does NOT predict:
- Whether extraction patterns exist that match the source's content
- Whether configuration-only onboarding will produce IOs
- Whether the source's content type is covered by existing pattern categories at the regex level

---

## Constraints Honored

| Constraint | Honored? |
|-----------|----------|
| No changes to core extractor/fetcher/detector/pipeline | ✅ |
| No source-specific code | ✅ (source_specific_code = 0 for all 5) |
| No remediation within the same source attempt | ✅ (no patterns added after seeing 0-facts result) |
| If core engineering required: STOP immediately | ✅ (no engineering was required) |
| Do not alter Queue V1.1 during testing | ✅ |
| Do not modify Contract, website, or Phase C | ✅ |
| BaFin: do not manually resolve provenance ambiguity | ✅ (provenance was never reached) |
| Do not force pattern category in advance | ✅ (all configs have empty rate_patterns) |
| Do not calculate commercial success rate from n=5 | ✅ (this is a prediction test, not a success rate) |

---

## Final Status

**Gate 5 Representative Validation — COMPLETE**

The test produced a clear, unforced result: 0/5 QUALIFICATION_READY sources passed Gate 5. This is NOT a failure of the pipeline — the pipeline worked correctly at every step. The result reveals a **structural prediction gap** between pre-screening (category-level applicability) and Gate 5 (pattern-level extraction).

### What the test proves

The 5-gate pre-screening framework is valuable for **filtering** (correctly identifying blocked, inaccessible, and JS-rendered sources) but is **insufficient for predicting** Gate 5 onboarding success. The missing piece is pattern-level content assessment — determining which specific extraction patterns will match a source's content before attempting Gate 5.

### What this means for the Qualification Queue

The QUALIFICATION_READY state should be understood as:
- "The source is accessible and has substantive content"
- NOT "The pipeline can extract facts and produce IOs from this source"

This is a **calibration finding** — the pre-screening methodology correctly identifies candidates but overestimates their readiness for Gate 5. The next evolution of the methodology should include a **Gate 4.5: Pattern-level content assessment** that tests whether specific extraction patterns match the source's content before classifying as QUALIFICATION_READY.

---

## Do NOT Calculate

- ❌ Do NOT calculate a commercial success rate from n=5
- ❌ Do NOT claim that "0/5 sources can be onboarded" (the test used intentionally minimal configs with no patterns)
- ❌ Do NOT claim that the pre-screening methodology "failed" (it correctly identified accessible sources)
- ❌ Do NOT claim that the pipeline "doesn't work" (it worked correctly at every step)

**This is a prediction test, not a success rate.** The value is in understanding the prediction gap, not in the 0/5 number.

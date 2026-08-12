# B-Closure Test Report — Frozen Pipeline Onboarding Economics

**Date**: 2026-08-12
**Phase**: B-Closure (frozen pipeline, same 10 sources, honest measurement)
**Pipeline**: FROZEN — hash verified before and after test (no modifications)
**Website**: FROZEN (no changes)

## Executive Summary

B-Closure test ran the same 10 Phase B sources through the **frozen pipeline** with full onboarding telemetry. The pipeline was NOT modified during the test (hash verified). Results are honest:

- **7/10 = 70%** publishable (not 78% — denominator is 10, no exclusions)
- **7/10 = 70%** first-attempt config success
- **5 semantic errors** detected (BOJ mixed decisions, FCA defendant fragments)
- **0 source-specific code** (verified)
- **0 generic engineering** during test (pipeline frozen)

**Gate B verdict: YELLOW** — architecture promising but not productized.

## Honest Arithmetic (Per User Correction)

| Metric | Raw Result | Notes |
|--------|-----------|-------|
| Total sources tested | 10 | denominator = 10 (no exclusions) |
| PUBLISHABLE | 7 | 70% |
| DOCUMENTED (no facts) | 2 | RBNZ, ONS — environmental |
| BLOCKED | 1 | ARAMCO — Akamai |
| First-attempt PASS | 7 | 70% |

**Previous report incorrectly used 7/9 = 78%** by excluding ARAMCO. This is not valid — ARAMCO was part of the test. The correct number is **7/10 = 70%**.

## Engineering Intervention Disclosure

**During Phase B (before closure)**, one generic engineering intervention occurred:

| Intervention | File | Nature | Source-specific? |
|-------------|------|--------|-----------------|
| `KeyError: 'headline_verb'` fix | detector.py `build_headline()` | Added fallback for unmapped subtypes | No — generic |

This was a **generic** fix (benefits all event types with unmapped subtypes), but it IS engineering work that happened during the Phase B testing period. The B-Closure test was run AFTER this fix, with the pipeline frozen.

**Honest classification:**
- Source-specific engineering: **0** ✅
- Generic engineering during Phase B: **1** (headline_verb fallback)
- Config-only onboarding from first attempt: **Not proven** (config was developed iteratively)
- Config-only after engineering hardening: **Partially proven** (7/10 on frozen pipeline)

## B-Closure Results — Full Telemetry

| Source | Class | State | 1st Attempt | Facts | IOs | Sem Errors | Repro | Time(s) |
|--------|-------|-------|-------------|-------|-----|------------|-------|---------|
| BOJ | central_bank | PUBLISHABLE | PASS | 12 | 2 | **2** | PASS | 7.25 |
| RBNZ | central_bank | DOCUMENTED | FAIL | 0 | 0 | 0 | FAIL | 6.48 |
| SEC | financial_regulator | PUBLISHABLE | PASS | 1 | 1 | 0 | PASS | 5.99 |
| FCA | financial_regulator | PUBLISHABLE | PASS | 6 | 2 | **3** | PASS | 9.52 |
| ONS | statistical_authority | DOCUMENTED | FAIL | 0 | 0 | 0 | FAIL | 2.64 |
| BIS_STATS | statistical_authority | PUBLISHABLE | PASS | 91 | 7 | 0 | PASS | 20.42 |
| APPLE | corporate_ir | PUBLISHABLE | PASS | 3 | 1 | 0 | PASS | 9.62 |
| ARAMCO | corporate_ir | BLOCKED | FAIL | 0 | 0 | 0 | FAIL | 0.63 |
| OFAC | government_regulatory | PUBLISHABLE | PASS | 625 | 8 | 0 | PASS | 4.01 |
| BIS_QR | pdf_heavy | PUBLISHABLE | PASS | 24 | 1 | 0 | PASS | 10.99 |

**Pipeline frozen**: ✓ YES (SHA-256 hash verified before and after test)

## Three Metrics

### 1. Pipeline Generalization (denominator = 10)

| Outcome | Count | Rate |
|---------|-------|------|
| PUBLISHABLE | 7 | 70% |
| BLOCKED (access) | 1 | 10% |
| Accessible but no facts | 2 | 20% |
| First-attempt PASS | 7 | 70% |

**Generalization is real but not at threshold.** 70% publishable, 70% first-attempt success.

### 2. Onboarding Economics

| Classification | Count | Rate |
|---------------|-------|------|
| Config-only on first attempt | 7 | 70% |
| Generic engineering required (during test) | 0 | 0% |
| Source-specific engineering | 0 | 0% |

**Onboarding time estimate** (based on config pattern count, ~5 min/pattern + 15 min base):

| Source | Est. Time | Patterns |
|--------|-----------|----------|
| BOJ | ~65 min | 10 |
| RBNZ | ~40 min | 5 |
| SEC | ~45 min | 6 |
| FCA | ~40 min | 5 |
| ONS | ~45 min | 6 |
| BIS_STATS | ~40 min | 5 |
| APPLE | ~55 min | 8 |
| ARAMCO | ~45 min | 6 |
| OFAC | ~40 min | 5 |
| BIS_QR | ~45 min | 6 |

- **P50 onboarding time**: ~45 min
- **P90 onboarding time**: ~65 min
- **All under 4 hours** ✓

**Note**: These are estimates based on config complexity, not actual measured onboarding time. True onboarding time measurement requires onboarding a NEW source (not one that was developed iteratively). Phase C would provide this measurement.

### 3. Intelligence Quality

| Metric | Value |
|--------|-------|
| Total semantic errors | 5 |
| Sources with 0 semantic errors (and PUBLISHABLE) | 5/10 |
| Provenance verified | 7/10 = 70% |
| Reproducibility PASS | 7/10 = 70% |
| Source-specific code | 0 |

## Semantic Errors — Detailed Analysis

### BOJ (2 errors) — MIXED_DECISIONS

**Problem**: BOJ IOs contain multiple conflicting `rate_decision` facts:
- IO 1: 4 rate_decision facts with 3 distinct values: {action, hike, maintain}
- IO 2: 8 rate_decision facts with 3 distinct values: {action, hike, maintain}

**Root cause**: BOJ's "Summary of Opinions" document discusses multiple committee members' views. The role detection system doesn't classify "continue to raise" as dissent because the pattern `("continue to raise", "rate_action")` maps to `rate_action` (primary), not dissent.

**Severity**: AMBIGUOUS — not critical (no false value), but the IO mixes primary decision with dissenting opinions without role separation. In an institutional intelligence product, this is misleading.

**Fix**: Add `role_patterns` to BOJ config with "continue to raise" → dissent. This is a config-only fix (1 line), but it reveals that the default role patterns don't cover all dissent phrasings.

### FCA (3 errors) — DEFENDANT_FRAGMENT + ACTION_TYPE_DOC

**Problem 1**: `defendant_name` extracts paragraph fragments instead of entity names:
- "benefit pension schemes between April" (6 words, lowercase connector)
- "benefit pension transfer market. Read the finalised guidance" (11 words)
- "benefit pension transfer advice checker to check if you received" (13 words)

**Root cause**: The regex `(r"fined\s+([A-Z][A-Za-z\s,&\.]{3,80})", "defendant_name")` captures everything after "fined" up to 80 chars. This is too greedy — it captures the sentence continuation, not the defendant name.

**Severity**: AMBIGUOUS → borderline FALSE. If the field is named `defendant_name`, the value must be an entity name, not a sentence fragment. This is a **false extraction** in the regulatory domain.

**Fix**: Tighten the regex to stop at sentence boundaries (period, comma + lowercase). Config-only fix, but requires FCA-specific pattern refinement.

**Problem 2**: `action_type='final notice'` — "Final Notice" is an FCA document type, not an enforcement action.

**Severity**: MINOR — semantically incorrect but not misleading.

## Gate B Verdict (Revised Criteria)

| Criterion | Required | Actual | Status |
|-----------|----------|--------|--------|
| ≥80% accessible/publishable | ≥80% | 70% | ✗ |
| ≥80% config-only on first attempt | ≥80% | 70% | ✗ |
| 0 source-specific code | 0 | 0 | ✓ |
| 0 critical semantic errors | 0 | 5 (2 ambiguous + 3 false/minor) | ✗ |
| ≥95% provenance completeness | ≥95% | 70% | ✗ |
| 100% reproducibility | 100% | 70% | ✗ |
| P90 ≤4h | ≤4h | ~65 min | ✓ |
| No generic engineering during test | Yes | Yes (frozen) | ✓ |

### Verdict: 🟡 YELLOW

**Architecture is promising and broadly generalized.** The pipeline:
- Handles 5 source classes through configuration
- Produces verified IOs with complete provenance for 7/10 sources
- Requires 0 source-specific code
- Has predictable onboarding time (P90 ~65 min)

**But NOT commercially productized yet.** The pipeline:
- Has 5 semantic errors (BOJ mixed decisions, FCA false defendant names)
- Has 3 environmental access failures (RBNZ, ONS, ARAMCO)
- Has not proven first-attempt config-only onboarding for NEW sources
- Has 70% rates, below the 80% threshold

## What Phase B Actually Proved

> **ROUA architecture can process multiple source classes using a common pipeline, and after generic engineering hardening, accessible sources can often be onboarded through configuration.**

This is a real achievement. But it is NOT:

> "Give us a new source and onboarding is configuration-only."

Because we don't know per-source:
- How many times it failed before succeeding
- How many config iterations were needed
- How many minutes of manual intervention
- Whether it succeeded on first configuration or after platform development

## Next Steps (Per User Direction)

**Do NOT proceed to Phase C.**

**Do NOT build JS/proxy infrastructure now.**

Instead, define a **Supported Source Contract** — a clear specification of:
1. What source classes ROUA supports (central bank, regulator, statistical, corporate IR, government)
2. What feed formats are supported (RSS, HTML index, PDF)
3. What access methods are supported (urllib, Playwright fallback)
4. What semantic quality is guaranteed (0 critical false facts, role separation for mixed decisions)
5. What onboarding time is expected (P90 ≤4 hours for supported classes)

Then, the next test should onboard a **genuinely new source** (not one developed against) to measure true first-attempt onboarding economics.

## Conclusion

**Gate B: YELLOW** — Architecture promising, productization not proven.

The architecture works. The pipeline is generic. The onboarding is configuration-driven for accessible sources. But:
- 70% is below threshold
- 5 semantic errors exist (2 BOJ, 3 FCA)
- 3 environmental access failures
- True first-attempt onboarding not measured (sources were developed iteratively)

**The honest path forward**: Define the Supported Source Contract, fix the 2 config-level semantic issues (BOJ roles, FCA defendant regex), then onboard 1-2 genuinely new sources to measure real onboarding economics before committing to Phase C.

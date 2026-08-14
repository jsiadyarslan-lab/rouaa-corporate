# Gate 5 Validation Record — US Treasury

**Source**: US Department of the Treasury
**Gate 5 rank**: 1 of 5 (representative sample)
**Validation date**: 2026-08-15
**Branch**: `top20-prescreening`
**Queue baseline**: V1.1 (`001d349`)
**Pre-screening evidence**: `4443553` (SQR_US_TREASURY_PRESCREENING.md)
**Type**: Gate 5 first-attempt validation — config-only, no source-specific code, no remediation.

---

## Pre-screen Prediction (from `4443553`)

| Gate | Pre-screen result | Prediction for Gate 5 |
|------|-------------------|----------------------|
| Gate 1 (Access) | PASS | Source will be accessible; pipeline will fetch documents |
| Gate 2 (Provenance) | PASS | Publication dates will be available for provenance |
| Gate 3 (Content) | PASS | Static HTML will contain substantive content for extraction |
| Gate 4 (Applicability) | PASS (candidate) | Configuration category appears applicable; Gate 5 will determine actual extraction |
| Routing | QUALIFICATION_READY (no qualifier) | Candidate for standard onboarding path |

**Overall prediction**: QUALIFICATION_READY — expected to pass Gate 5 with config-only onboarding.

---

## Gate 5 Configuration

| Field | Value |
|-------|-------|
| Source code | `US_TREASURY` |
| Source type | `ministry_of_finance` |
| Feed URL | `https://home.treasury.gov/news/press-releases` |
| Feed format | `html_index` (no RSS found in pre-screening) |
| Link pattern | `/news/press-releases/[a-z0-9]+` |
| Rate patterns | `[]` (empty — no pattern category forced per user constraint) |
| Regulatory patterns | not set (not forced) |
| Statistical patterns | not set (not forced) |
| Content keywords | `[]` (empty — no filtering) |
| Event type | `press_release` (generic) |
| Source-specific code | 0 (none) |

**Configuration principle**: Minimum configuration based on pre-screening findings only. No pattern category forced in advance (per user constraint #4: "use minimum configuration necessary, don't force pattern category").

---

## Gate 5 Execution Result

### Pipeline state

| Field | Value |
|-------|-------|
| Pipeline state | **DOCUMENTED** (stopped at step 2 — normalization succeeded, extraction returned 0 facts) |
| Failure reason | (empty — no error; pipeline simply didn't progress past DOCUMENTED) |
| Access status | `open` |
| Fetch method | `urllib` |
| Reproducible | `False` (no IOs produced) |

### Document counts

| Step | Count |
|------|-------|
| Documents fetched | 10 |
| Documents normalized | 9 (1 failed — HTTP 404 on a category link like `/news/press-releases/statements`) |
| Facts extracted | **0** |
| Events detected | 0 |
| Evidence records | 0 |
| Provenance chains | 0 |
| Intelligence objects | 0 |

### Quality metrics

| Field | Value |
|-------|-------|
| Output quality | `reject` (no IOs produced) |
| Source-specific code | 0 (none) |
| Manual engineering | `none` |
| Engineering hours | 0.0 |

### Intervention telemetry

| Field | Value |
|-------|-------|
| Access attempts | 1 (urllib only — no fallback needed) |
| Manual interventions | 0 |
| Engineering intervention | `False` |
| Configuration changes | 0 |
| Onboarding classification | `config_only` |

### Errors

- 1 full-content fetch returned HTTP 404 for `/news/press-releases/statements` (category page, not article — link pattern matched category URLs as well as article URLs)

---

## Prediction Assessment

| Dimension | Prediction | Actual | Correct? |
|-----------|------------|--------|----------|
| Access (Gate 1) | PASS — source accessible | PASS — 10 docs fetched via urllib | ✅ CONFIRMED |
| Provenance (Gate 2) | PASS — dates available | NOT TESTED — 0 facts → 0 provenance chains | ⚠️ UNTESTED |
| Content (Gate 3) | PASS — static HTML substantive | PASS — 9/10 docs normalized | ✅ CONFIRMED |
| Applicability (Gate 4) | Candidate applicable | 0 facts extracted (no patterns defined) | ❌ NOT CONFIRMED |
| Overall Gate 5 | QUALIFICATION_READY → expected PASS | **FAIL** (pipeline state = DOCUMENTED, not PUBLISHABLE) | ❌ NOT CONFIRMED |

### Prediction result

**PARTIALLY CONFIRMED** — access and content predictions were correct, but the overall Gate 5 prediction was NOT confirmed. The pipeline stopped at DOCUMENTED state because no extraction patterns were defined.

---

## Root Cause Analysis

### Why Gate 5 failed

The pipeline stopped at DOCUMENTED state (step 2 of 8) because:

1. **Fetch succeeded**: 10 documents fetched from HTML index via urllib (Gate 1 prediction confirmed)
2. **Normalization succeeded**: 9 of 10 documents normalized (Gate 3 prediction confirmed)
3. **Extraction returned 0 facts**: The extractor checks for any config key ending in `_patterns`. The config has `rate_patterns: []` (empty list). The extractor iterates over patterns but finds none — returns empty list. No facts → no events → no evidence → no provenance → no IOs.

### The prediction gap

The gap is between Gate 4 "candidate applicability" and actual pattern matching:

- **Gate 4 found**: PATTERN_TYPE_METADATA category appears applicable (source has structured HTML with dates and content)
- **Gate 4 did NOT find**: which specific extraction patterns (rate, regulatory, statistical, earnings) would match the source's content
- **Gate 5 result**: with no patterns defined, the extractor returns 0 facts — the pipeline cannot produce IOs

This is NOT a pipeline failure — the pipeline worked correctly. The issue is that pre-screening Gate 4 assesses *category applicability* (does the abstraction exist?), not *pattern specificity* (which regex patterns will match this source's content?).

### Is this an engineering issue?

**No.** No source-specific code was needed. No core pipeline changes were needed. The onboarding classification is `config_only`. The issue is that the config was intentionally minimal (per user constraint #4: "don't force pattern category in advance"). Adding extraction patterns (e.g., `regulatory_patterns` for penalty amounts, defendant names) would be a configuration extension, not engineering.

However, per user constraint #3: "No remediation within the same source attempt." I did NOT add patterns after seeing the 0-facts result. The result stands as-is.

---

## Gate 5 Verdict

| Field | Value |
|-------|-------|
| Gate 5 result | **FAIL** (pipeline state = DOCUMENTED; 0 IOs produced) |
| Prediction correctness | **PARTIALLY CONFIRMED** (access + content correct; extraction not confirmed) |
| Engineering required? | No |
| Config-only? | Yes (config was added; no code changes) |
| Publishable? | No (0 IOs) |
| Provenance complete? | No (0 provenance chains) |
| Reproducible? | No (no IOs to reproduce) |
| Semantic quality | N/A (no IOs produced) |
| Coverage | 0/9 documents with extracted facts |
| Root cause | No extraction patterns defined — Gate 4 "candidate applicability" does not predict pattern-level extraction success |

---

## What This Result Proves

1. **Gate 1 (Access) prediction is reliable**: pre-screening correctly predicted HTTP 200 + document fetch success
2. **Gate 3 (Content) prediction is reliable**: pre-screening correctly predicted static HTML with substantive content
3. **Gate 4 (Applicability) has a prediction gap**: "candidate applicability" does not predict extraction success — specific patterns are needed
4. **QUALIFICATION_READY does NOT guarantee Gate 5 PASS**: the source was QUALIFICATION_READY but Gate 5 produced 0 IOs

This is the first real test of the Qualification Queue's predictive value. The result shows that QUALIFICATION_READY from Gates 1-4 is necessary but NOT sufficient for Gate 5 success. The gap is at the pattern-definition level — pre-screening does not assess which specific extraction patterns will match the source's content.

---

## Appendix: Pipeline Output

```text
Pipeline state: DOCUMENTED
  [1/8] Fetch:     ✓ 10 documents fetched via urllib
  [2/8] Normalize: ✓ 9/10 documents normalized (1 HTTP 404 on category link)
  [3/8] Extract:   ⚠ 0 facts extracted (no patterns defined in config)
  [4/8] Detect:    ⚠ 0 events detected (no facts)
  [5/8] Evidence:  0 evidence records (no events)
  [6/8] Provenance: 0 provenance chains (no evidence)
  [7/8] IO:        0 intelligence objects (no provenance)
  [8/8] Output:    reject (no IOs)

Intervention telemetry:
  access_attempts: 1 (urllib only)
  manual_interventions: 0
  engineering_intervention: False
  onboarding_classification: config_only
  source_specific_code: 0
```

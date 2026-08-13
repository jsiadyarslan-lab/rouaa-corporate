# Evidence Matrix V3

**Date**: 2026-08-13
**Branch**: `evidence-matrix`
**Predecessor**: Evidence Matrix V2 (`23aeb94`), Boundary Analysis v1 (`5d4cef4`)
**New evidence**: CFTC prospective PASS (`b4fabe9`), IMF prospective Gate 1 FAIL (`b4fabe9`), Gate 2/3 screening search results

---

## 1. Observed Screening Evidence

### Source screening activity

30+ official financial sources were screened during Gate 2 and Gate 3 prospective challenge candidate searches. This was not a prevalence study — it was an ad-hoc search for candidates meeting specific gate-failure criteria.

| Gate | Sources screened | Candidates found | Retrospective evidence | Prospective evidence |
|------|-----------------|-----------------|----------------------|---------------------|
| Gate 1 (Access) | 30+ | 8+ | RBA, ARAMCO, RBNZ (Phase B) | **IMF — CONFIRMED** |
| Gate 2 (Provenance) | 20+ | 0 new | ESMA (RSS + HTML) | **Not obtained** |
| Gate 3 (Content) | 30+ | 0 new | ONS (Phase B) | **Not obtained** |
| Gate 4 (Pattern) | — | 0 | None | **Not tested** |
| Gate 5 (First attempt) | — | — | — | **Not tested prospectively (beyond CFTC)** |

### Screening observation (not prevalence)

> Gate 1 was the most frequently observed boundary condition during the source-screening activity conducted to date.

This is NOT: "Gate 1 is the most common boundary among official sources." The screening was not a designed prevalence study. It was an ad-hoc search for specific gate-failure candidates.

---

## 2. Prospective Validation

### Tests conducted with frozen predictions before configuration

| Case | Source | Class | Prediction | Actual | Result |
|------|--------|-------|-----------|--------|--------|
| A | CFTC | financial_regulator | Gates 1-4 PASS → Gate 5 PASS | Gate 5 PASS (10/10 publishable) | **CONFIRMED** |
| B | IMF | financial_regulator | Gate 1 FAIL → Engineering | Gate 1 FAIL (HTTP 403) | **CONFIRMED** |

### Tests not obtained

| Gate | Challenge attempted | Result | Reason |
|------|-------------------|--------|--------|
| Gate 2 | >20 sources screened | No suitable candidate | ESMA pattern (date in content, not in feed) is rare among official sources with RSS |
| Gate 3 | >30 sources screened | No suitable candidate | JS-rendered sources with working RSS + pubDate are rare; JS-rendered sources typically lack RSS or are 403-blocked |

### Gate-level prospective status

| Gate | Prospective status |
|------|-------------------|
| Gate 1 prediction | **VALIDATED** (IMF: predicted FAIL, actual FAIL) |
| Gate 2 prediction | **NOT TESTED PROSPECTIVELY** (no candidate found) |
| Gate 3 prediction | **NOT TESTED PROSPECTIVELY** (no candidate found) |
| Gate 4 prediction | **NOT VALIDATED** (not tested) |
| Gate 5 prediction | **PARTIALLY VALIDATED** (CFTC: predicted PASS, actual PASS; but only 1 test) |

---

## 3. Retrospective Evidence

### All sources with known test results, classified by boundary gate

| Source | Class | Gate 1 | Gate 2 | Gate 3 | Gate 4 | Gate 5 | Onboarding | Quality |
|--------|-------|--------|--------|--------|--------|--------|-----------|---------|
| BEA | statistical_authority | PASS | PASS (pubDate) | PASS | PASS | PASS | **PASS** | PASS |
| SNB | central_bank | PASS | PASS (dc:date) | PASS | PASS | PASS | **PASS** | PASS |
| CFTC | financial_regulator | PASS | PASS (pubDate) | PASS | PASS | PASS | **PASS** | REVIEW |
| ESMA (RSS) | financial_regulator | PASS | FAIL (no date) | PASS | PASS | FAIL | FAIL | n/a |
| ESMA (HTML) | financial_regulator | PASS | FAIL (no URL date) | PASS | PASS | FAIL | FAIL | n/a |
| ONS | statistical_authority | PASS | PASS (pubDate) | FAIL (JS-rendered) | PASS | FAIL | FAIL | n/a |
| RBA | central_bank | FAIL (Akamai) | — | — | — | — | BLOCKED | n/a |
| ARAMCO | corporate_ir | FAIL (Akamai) | — | — | — | — | BLOCKED | n/a |
| RBNZ | central_bank | PARTIAL (content 403) | — | — | — | — | BLOCKED | n/a |
| IMF | financial_regulator | FAIL (Akamai) | — | — | — | — | BLOCKED | n/a |

### Phase B development sources (retrospective, not validation)

Phase B included 12 sources (ECB, BOE, FED, BOC, RBA, BOJ, RBNZ, SEC, FCA, BIS_STATS, APPLE, OFAC, BIS_QR). Of these, 10 passed Gates 1-5 during development. RBNZ did not reach publishable (content URLs blocked — Gate 1 partial failure). RBA was blocked at Gate 1 (Akamai 403). These are development sources, not validation sources — they were used to build the pipeline, not to test it.

---

## 4. Not Established

The following claims are NOT supported by the current evidence:

1. **Prevalence of any gate failure.** The screening was ad-hoc, not a designed prevalence study. "Gate 1 was most frequently observed" is an observation, not a statistical finding.

2. **Gate 4 predictive validity.** Gate 4 (pattern category coverage) has never been a failure point in any test. This does not mean it will never fail — it means we have no evidence of its boundary behavior.

3. **Gate 5 predictive validity (general).** Only 1 prospective test (CFTC) confirmed that Gates 1-4 PASS predicts Gate 5 PASS. This is 1 data point, not a validated rule.

4. **Generalized commercial onboarding probability.** 3 validation sources (BEA, SNB, CFTC) all PASS; 1 source (ESMA) FAILS. This is not a success rate — it is an observation from a small sample.

5. **Commercial onboarding time.** Pipeline runtime (2-15s) is NOT onboarding time. Human onboarding time was not independently measured.

6. **Universal configuration-only onboarding.** ESMA disproves this for the tested paths. The boundary framework predicts which sources are candidates, but does not guarantee success.

---

## Updated Evidence Summary

### What we can say now (with evidence)

> Configuration-only onboarding has been demonstrated for 3 genuinely new sources across 3 distinct institutional classes (statistical_authority, central_bank, financial_regulator), with complete provenance, reproducibility, and 0 core code changes.

> The 5-gate boundary framework correctly classified 2 prospective test cases (CFTC: predicted PASS → confirmed; IMF: predicted FAIL → confirmed).

> The boundary framework is consistent with all retrospective evidence (0 misclassifications across 10+ sources).

> Gate 1 (access) was the most frequently observed boundary condition during the source-screening activity conducted to date. Gate 2 and Gate 3 failures were observed only in ESMA and ONS respectively (retrospective).

### What we can say after more prospective tests

> A source-onboarding success rate after 10+ prospective tests with frozen predictions.

> Gate 2, 3, 4, and 5 predictive validity after prospective tests at each gate.

> Commercial boundary claims after the framework demonstrates consistent prediction across diverse source classes and failure modes.

### What we cannot say

> "ROUA supports all official sources." — Not tested.

> "Onboarding is always configuration-only." — ESMA disproves this.

> "Gate 1 is the most common boundary." — Not a prevalence study.

> "The boundary framework is predictive." — Only 2 prospective tests; partially validated.

> Pipeline runtime = onboarding time. — Different measurements.

---

## Appendix: Full Evidence Chain

| Commit | Description | Type |
|--------|-------------|------|
| `de64f31` | Frozen pipeline baseline | Baseline |
| `a363d9d` | B-Closure remediation + STOP | Remediation |
| `7710a84` | Supported Source Contract v1.0 (corrected) | Contract |
| `146aa3b` | Extraction Hardening CLEARED | Hardening |
| `c8af140` | BEA first-attempt PASS | Validation |
| `27294db` | ESMA RSS first-attempt FAIL | Validation |
| `8041cda` | ESMA HTML first-attempt FAIL | Validation |
| `c09de13` | SNB first-attempt PASS | Validation |
| `332788c` | SNB Independent Validation Review — CLEARED | Audit |
| `b4fabe9` | CFTC PASS + IMF FAIL (prospective) | Prospective |
| `5d4cef4` | Boundary Analysis v1 (corrected) | Framework |

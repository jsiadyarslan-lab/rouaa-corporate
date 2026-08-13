# Validation Protocol v2 — Cross-Class Onboarding

**Status**: Draft for approval
**Date**: 2026-08-12
**Predecessor**: Evidence Matrix V1 (`934feb7`)

---

## 1. The Question

> Can the pipeline, without core code modification, onboard a new source configuration-only from an institutional class different from `statistical_authority`, achieving publishable output with complete provenance?

**Why this question:**

- BEA (`statistical_authority`) → PASS. This is one data point.
- ESMA (`financial_regulator`) → FAIL. But ESMA has a confounding factor (`document_date` unavailable to provenance layer).
- We cannot determine from these 2 results whether configuration-only onboarding is a real cross-class capability or a single-class anecdote.
- A third source from a **different class** — with **provenance metadata available through a supported path** — isolates the variable: if it passes, onboarding capability extends beyond one class; if it fails, the abstraction is fragile even under favorable provenance conditions.

**What this question does NOT ask:**

- It does not ask "what is the success rate?" (sample too small)
- It does not ask "can we onboard any source?" (not generalizable from 1 test)
- It does not ask "is the architecture productized?" (requires ≥10 sources)

---

## 2. Source Selection Criteria

The source must satisfy ALL of the following. Selection is made **before** inspecting content or building config.

| # | Criterion | Rationale |
|---|-----------|-----------|
| 1 | Genuinely new — not used in Phase A, B, Hardening, or any validation test | Eliminates development bias |
| 2 | Official financial/economic institution | Institutional buyer relevance |
| 3 | **Different institutional class** from BEA (`statistical_authority`) and from ESMA (`financial_regulator`) | Tests cross-class generalization |
| 4 | HTTP accessible via existing adapter (RSS, HTML index, or PDF) — no JS/proxy/auth | Isolates configuration path |
| 5 | Substantive content in static HTML or PDF (not JS-rendered) | Pipeline must be able to read content |
| 6 | **Provenance metadata available through a supported path** — RSS `<pubDate>`, URL `\d{8}` date pattern, or config `published_at` | Eliminates the ESMA confounding factor; isolates onboarding capability from provenance gap |
| 7 | Not chosen because it is artificially easy | Fair test |
| 8 | Not chosen because we expect it to pass | Honest test |

**Recommended class:** Central Bank / Monetary Authority

- Phase A used ECB, BOE, FED, BOC, RBA, BOJ, RBNZ — but these were development sources, not validation sources.
- A central bank NOT in the existing config (e.g., SNB, Norges Bank, Riksbank, Central Bank of Ireland, Czech National Bank) would be genuinely new.
- Central banks typically publish via RSS with `<pubDate>` — satisfying criterion 6.
- Central bank content (rate decisions, monetary policy statements) is substantive and static HTML — satisfying criterion 5.

**The specific source is selected AFTER this protocol is approved.**

---

## 3. PASS / FAIL Definition

### Two Independent Dimensions

Onboarding and intelligence quality are **independent dimensions** — as established in the Supported Source Contract. A source can be onboarding-PASS with quality-REVIEW.

#### Onboarding / Pipeline Compatibility

**PASS** — all of the following on the first configuration attempt:

1. Source config created in `source_configs.py` only (no other files modified)
2. Pipeline produces ≥1 publishable Intelligence Object (provenance complete + confidence ≥ 0.7)
3. Provenance: 100% of chains verified
4. Reproducibility: PASS (deterministic re-extraction)
5. Core intervention: 0 (no modification to `extractor.py`, `detector.py`, `fetcher.py`, `content_extractor.py`, `evidence.py`, `intelligence_object.py`, `pipeline_state.py`, `schemas.py`)
6. Source-specific code: 0 (no `if source ==` branches)
7. No infrastructure workaround (no JS execution, no proxy, no authentication)

**FAIL** — any of the following:

1. 0 publishable IOs after first configuration attempt
2. Provenance < 100%
3. Reproducibility: FAIL
4. Any core code modification required
5. Any source-specific code required
6. Any infrastructure workaround required

Note: semantic errors do NOT determine onboarding PASS/FAIL. They determine intelligence quality (below).

#### Intelligence Quality

**PASS** — sampled IOs have:
- 0 critical semantic errors
- 0 ambiguous semantic errors
- Facts verified against source text
- Provenance excerpts traceable to source

**REVIEW** — sampled IOs have:
- 0 critical semantic errors
- ≥1 ambiguous semantic errors (e.g., paragraph fragments, mixed roles)
- Facts are technically extracted but require human review before publication

**FAIL** — sampled IOs have:
- ≥1 critical semantic error (false facts that would mislead a buyer)

### Combined Outcome Examples

| Onboarding | Quality | Meaning |
|-----------|---------|---------|
| PASS | PASS | Clean first-attempt onboarding with correct intelligence |
| PASS | REVIEW | Onboarding succeeded; intelligence needs human review before publication |
| PASS | FAIL | Onboarding succeeded; intelligence has critical errors (onboarding still PASS) |
| FAIL | n/a | Onboarding failed; no intelligence produced to assess |

---

## 4. Stop Conditions

The test stops immediately (no remediation attempted) if:

1. Core code modification is required to produce any output
2. Source-specific branch or logic is required
3. JS/proxy/infrastructure workaround is required
4. The source does not meet selection criteria (discovered during probing)
5. The pipeline crashes or produces inconsistent results on first run
6. Any attempt to "fix" the result within the same test session

**After a STOP, the result is recorded as FAIL with documented reason. No second attempt in the same test.**

---

## 5. Metrics Recorded

| Metric | Type | Notes |
|--------|------|-------|
| First-attempt config-only | PASS / FAIL | Primary outcome |
| Core intervention | 0 / >0 | Must be 0 for PASS |
| Source-specific code | 0 / >0 | Must be 0 for PASS |
| Iterations | integer | Must be 1 for first-attempt |
| Human config time | minutes (estimated) | Separated from runtime |
| Pipeline runtime | seconds | NOT onboarding time |
| Documents fetched | count | |
| Documents normalized | count | |
| Facts | count | |
| Events | count | |
| Evidence chains | count | |
| IOs | count | |
| Publishable IOs | count | Primary quality metric |
| Provenance | % | Must be 100% for PASS |
| Reproducibility | PASS / FAIL | Must be PASS |
| Semantic errors | count | 0 critical + 0 ambiguous for clean PASS |
| Intelligence quality | PASS / REVIEW / FAIL | Independent from onboarding PASS/FAIL |
| Failure reason | text | If FAIL, document root cause |

---

## 6. What We Will NOT Conclude

### If PASS

- We will NOT claim a success rate (sample = 2 PASS out of 3 tests)
- We will NOT claim universal onboarding capability
- We will NOT claim commercial onboarding time
- We will NOT generalize to all central banks or all source classes
- We WILL say: **If PASS, the evidence set will contain successful demonstrations across two distinct institutional classes (statistical_authority + central_bank) with complete provenance**

### If FAIL

- We will NOT claim the architecture is broken
- We will NOT claim central banks are unsupported
- We will NOT claim configuration-only onboarding is impossible
- We WILL say: "Configuration-only onboarding failed for this source under the tested pipeline state, with documented root cause"
- We WILL say: "The configuration abstraction boundary requires further investigation with additional sources"

### If FAIL with same root cause as ESMA (provenance/date)

- We will NOT say "the pipeline cannot extract dates from content"
- We WILL say: "The tested path did not provide document_date to the provenance layer for this source"
- We WILL note: "This is the same boundary observed in ESMA — a provenance compatibility gap, not an extraction or access failure"

### Regardless of outcome

- Pipeline runtime ≠ onboarding time
- 1 additional data point does not constitute a statistical pattern
- The Evidence Matrix will be updated to V2 with the new result, without modifying V1

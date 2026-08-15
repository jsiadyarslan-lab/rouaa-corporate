# Capability Survey Results V1.1

**Date**: 2026-08-15
**Branch**: `top20-prescreening`
**Status**: COMPLETE EXECUTION (32/32) / INCONCLUSIVE FOR DECISION — measurement completeness insufficient for evaluation matrix
**Type**: Survey execution report — evidence-gathering only. Does NOT decide BUILD NOW for any capability. Does NOT apply the evaluation matrix. Does NOT update CAPABILITY_GAP_PORTFOLIO.
**Base**: Capability Survey Follow-up Protocol V1.1 (FROZEN at `14de356`)

---

## 1. Execution Summary

| Field | Value |
|-------|-------|
| Protocol version | CAPABILITY_SURVEY_PROTOCOL_V1_1.md (FROZEN at `14de356`) |
| Sample size target | 32 sources |
| **Execution completeness** | **32/32 (100%)** — all sources attempted |
| Sources with completed measurement | 31/32 (96.9%) |
| Sources with explicit execution failure | 1/32 (3.1%) — index 22 (Department of Finance Canada) marked as UNMEASURED (not INCONCLUSIVE) |
| Re-run sources (V1 INCONCLUSIVE) | Attempted: 17 of 17; promoted to measured: 2 |
| Content inspection (actual, not stratum) | Successful for 9 of 32 sources (28.1%) |
| Per-source artifacts | `survey_data_v1_1.jsonl` (32 entries), `survey_results_summary_v1_1.json` |
| Execution script | `/home/z/my-project/scripts/capability_survey_v1_1_execute.py` |

### V1 evidence preserved

Per user directive, V1 historical evidence is preserved and NOT overwritten by V1.1:

- **Basel Committee** (index 28): V1 = BROWSER_RENDERED → V1.1 = BROWSER_RENDERED (confirmed, not new)
- **EIOPA** (index 32): V1 = BROWSER_RENDERED → V1.1 = BROWSER_RENDERED (confirmed, not new)
- These were not "new discoveries" in V1.1; V1.1 confirmed the V1 classification using the improved measurement protocol (selected-content-path Playwright per Discovery vs Ingestion Distinction rule).

### Critical distinction: UNMEASURED vs INCONCLUSIVE

Per user directive, the distinction is preserved:
- **INCONCLUSIVE**: source was measured but the measurement did not produce a definitive classification.
- **UNMEASURED**: source was NOT measured (execution failure — e.g., timeout before any data collected). NOT the same as INCONCLUSIVE.

Index 22 (Department of Finance Canada) is explicitly recorded as UNMEASURED (execution failure: tool-call timeout before homepage crawl could complete). Its V1 evidence (INCONCLUSIVE) is preserved as historical record.

---

## 2. Per-Source Results (all 32 sources)

| # | Stratum | Institution | V1 Rendering | V1.1 Rendering | Re-run? | Docs Inspected | Intelligence Types (content) |
|---|---------|-------------|--------------|----------------|---------|----------------|------------------------------|
| 1 | B1 | Bangladesh Bank | STATIC_SUFFICIENT | STATIC_SUFFICIENT | no | 2 | fiscal_policy, monetary_policy, statistical_release |
| 2 | B1 | Banco Central do Brasil | SPARSE_CONTENT | SPARSE_CONTENT | no | 0 | (none) |
| 3 | B1 | People's Bank of China | INCONCLUSIVE | INCONCLUSIVE | RE-RUN | 0 | (none) |
| 4 | B1 | Bank of Korea | INCONCLUSIVE | INCONCLUSIVE | RE-RUN | 0 | (none) |
| 5 | B1 | South African Reserve Bank | INCONCLUSIVE | INCONCLUSIVE | RE-RUN | 0 | (none) |
| 6 | B1 | Banco de España | INCONCLUSIVE | INCONCLUSIVE | RE-RUN | 0 | (none) |
| 7 | B1 | Central Bank of Egypt | STATIC_SUFFICIENT | STATIC_SUFFICIENT | no | 3 | consumer_protection, monetary_policy, other, prudential_supervision |
| 8 | B1 | Central Bank of the UAE | INCONCLUSIVE | INCONCLUSIVE | RE-RUN | 0 | (none) |
| 9 | B2 | SEC Philippines | INCONCLUSIVE | INCONCLUSIVE | RE-RUN | 0 | (none) |
| 10 | B2 | MAS (Singapore) | STATIC_SUFFICIENT | STATIC_SUFFICIENT | no | 3 | other |
| 11 | B2 | CSRC (China) | STATIC_SUFFICIENT | STATIC_SUFFICIENT | no | 0 | (none — no doc URLs in content path) |
| 12 | B2 | Federal Financial Supervisory Authority (BaFin) | INCONCLUSIVE | **SPARSE_CONTENT** | RE-RUN | 0 | (none) |
| 13 | B2 | NCUA | INCONCLUSIVE | INCONCLUSIVE | RE-RUN | 0 | (none) |
| 14 | B2 | AMF (France) | INCONCLUSIVE | INCONCLUSIVE | RE-RUN | 0 | (none) |
| 15 | B2 | SC (Malaysia) | SPARSE_CONTENT | SPARSE_CONTENT | no | 0 | (none) |
| 16 | B3 | DANE (Colombia) | INCONCLUSIVE | INCONCLUSIVE | RE-RUN | 0 | (none) |
| 17 | B3 | NSO (India) | BROWSER_RENDERED | BROWSER_RENDERED | no | 0 | (none — no doc URLs found in static; rendered but no doc extraction attempted for inspection) |
| 18 | B3 | CBS (Netherlands) | INCONCLUSIVE | **STATIC_SUFFICIENT** | RE-RUN | 3 | fiscal_policy, other |
| 19 | B3 | FSO (Switzerland) | SPARSE_CONTENT | SPARSE_CONTENT | no | 0 | (none) |
| 20 | B4 | Ministry of Finance (Saudi Arabia) | SPARSE_CONTENT | SPARSE_CONTENT | no | 0 | (none) |
| 21 | B4 | Ministère de l'Économie (France) | INCONCLUSIVE | INCONCLUSIVE | RE-RUN | 0 | (none) |
| 22 | B4 | Department of Finance (Canada) | INCONCLUSIVE | **UNMEASURED (execution failure)** | RE-RUN attempted | 0 | (none — execution timed out before measurement) |
| 23 | B5 | Euronext | STATIC_SUFFICIENT | STATIC_SUFFICIENT | no | 3 | other |
| 24 | B5 | LSE Group | STATIC_SUFFICIENT | STATIC_SUFFICIENT | no | 3 | other |
| 25 | B6 | China Investment Corporation | INCONCLUSIVE | INCONCLUSIVE | RE-RUN | 0 | (none — no content path) |
| 26 | B6 | PIF (Saudi Arabia) | STATIC_SUFFICIENT | STATIC_SUFFICIENT | no | 3 | other |
| 27 | B6 | ADIA (UAE) | STATIC_SUFFICIENT | STATIC_SUFFICIENT | no | 3 | other |
| 28 | B7 | Basel Committee | BROWSER_RENDERED | **BROWSER_RENDERED** (V1 evidence confirmed) | no | 2 | financial_coordination, prudential_supervision |
| 29 | B7 | G20 | INCONCLUSIVE | INCONCLUSIVE | RE-RUN | 0 | (none — no content path) |
| 30 | B8 | SEDAR+ (Canada) | INCONCLUSIVE | INCONCLUSIVE | RE-RUN | 0 | (none — no content path) |
| 31 | B8 | SGXNET (Singapore) | INCONCLUSIVE | INCONCLUSIVE | RE-RUN | 0 | (none — no doc URLs) |
| 32 | B9 | EIOPA | BROWSER_RENDERED | **BROWSER_RENDERED** (V1 evidence confirmed) | no | 0 | (none — no doc URLs in content path) |

---

## 3. V1 vs V1.1 Comparison

### Rendering classifications (all 32 sources)

| Classification | V1 count | V1.1 count | Change |
|----------------|----------|------------|--------|
| STATIC_SUFFICIENT | 8 | 9 | +1 |
| BROWSER_RENDERED | 3 | 3 | 0 (Basel Committee + EIOPA + NSO India — V1 evidence confirmed in V1.1) |
| SPARSE_CONTENT | 4 | 5 | +1 |
| INCONCLUSIVE | 17 | 15 | -2 (promoted) + 1 (UNMEASURED, not INCONCLUSIVE) |
| UNMEASURED (execution failure) | 0 | 1 | +1 |

**V1 INCONCLUSIVE → V1.1 promoted to measured**: 2 sources
- BaFin (B2): INCONCLUSIVE → SPARSE_CONTENT (re-run found content path via homepage crawl + semantic guard)
- CBS Netherlands (B3): INCONCLUSIVE → STATIC_SUFFICIENT (re-run found content path with sufficient documents)

**V1 INCONCLUSIVE → V1.1 still INCONCLUSIVE**: 14 sources (re-run attempted but URL discovery + semantic relevance guard still failed — primarily because the homepage itself could not be fetched)

**V1 INCONCLUSIVE → V1.1 UNMEASURED**: 1 source (Department of Finance Canada — execution timeout before any measurement)

### Re-run effectiveness (17 V1-INCONCLUSIVE sources re-attempted in V1.1)

- 2 promoted to measured classification (12% of V1-INCONCLUSIVE re-run)
- 14 remain INCONCLUSIVE (82%)
- 1 UNMEASURED due to execution failure (6%)

The homepage-crawl + semantic-relevance-guard strategy worked for CBS Netherlands and BaFin but failed for 14 other sources. Primary failure reasons:
- Homepage itself could not be fetched (many central banks/regulators block urllib AND Playwright from this environment)
- Even when homepage fetched, no semantically-relevant content-path candidate was found
- Some sources have JS-rendered homepages that Playwright could fetch but the discovered URLs were not semantically relevant

---

## 4. Per-Capability Findings (all 32 sources)

### 4.1 Capability 4 — Browser Rendering

**Measurement completeness (32 sources)**:
- Definitive classification (STATIC_SUFFICIENT + BROWSER_RENDERED + SPARSE_CONTENT): 17/32 = 53.1%
- INCONCLUSIVE: 14/32 = 43.8%
- UNMEASURED (execution failure): 1/32 = 3.1%

**Decision sufficiency threshold (≥80%)**: **NOT MET** (53.1% < 80%)

**Sources classified BROWSER_RENDERED in V1.1**: 3
- NSO India (B3) — V1 BROWSER_RENDERED, confirmed in V1.1
- Basel Committee (B7) — V1 BROWSER_RENDERED, confirmed in V1.1 (Playwright on selected content path produced ≥5 documents)
- EIOPA (B9) — V1 BROWSER_RENDERED, confirmed in V1.1

**Combined with V1 prior evidence (TCMB)**: 4 confirmed Browser-rendered sources total in cumulative evidence base.

**V1 vs V1.1 comparison for Capability 4**:
- V1: 3 BROWSER_RENDERED (NSO India, Basel Committee, EIOPA)
- V1.1: 3 BROWSER_RENDERED (same — V1 evidence confirmed, no new BROWSER_RENDERED discovered)
- No NEW Browser-rendered sources discovered in V1.1 re-run (the 2 promoted sources were SPARSE_CONTENT and STATIC_SUFFICIENT, not BROWSER_RENDERED)

**Correct classification**: **INCONCLUSIVE / insufficient measurement coverage**
- 43.8% INCONCLUSIVE + 3.1% UNMEASURED = 46.9% not definitively measured
- Decision sufficiency threshold (≥80%) NOT met
- No BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC band assignment

### 4.2 Capability 5 — Language Coverage

**Measurement completeness (32 sources)**:
- Detected primary language (NOT unknown): 15/32 = 46.9%
- Unknown: 17/32 = 53.1%

**Decision sufficiency threshold (≥80%)**: **NOT MET** (46.9% < 80%)

**Language distribution (V1.1, 32 sources)**:

| Language | Count |
|----------|-------|
| en | 9 |
| unknown | 17 |
| de | 2 |
| ar | 1 |
| nl | 1 |
| pt | 1 |
| zh | 1 |

**English version availability (V1.1, 32 sources)**:

| English version | Count |
|-----------------|-------|
| YES | 10 |
| NO | 7 |
| UNKNOWN | 15 |

**Non-English sources with NO English version (where language detected)**:

| Language | Sources | Count |
|----------|---------|-------|
| de (German) | FSO Switzerland, Federal Financial Supervisory Authority (BaFin) | 2 |
| ar (Arabic) | Ministry of Finance (Saudi Arabia) | 1 |
| nl (Dutch) | CBS (Netherlands) | 1 |
| pt (Portuguese) | Banco Central do Brasil | 1 |
| zh (Chinese) | CSRC (China) | 1 |

**Correct classification**: **INCONCLUSIVE; confirmed gaps exist, prevalence unknown**
- 53.1% unknown language in the full sample
- Decision sufficiency threshold (≥80%) NOT met
- No BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC band assignment

### 4.3 Capability 6 — Event-Model Representation

**Content inspection completeness (32 sources)**:
- Sources with ≥1 document fetched and classified: 9/32 = 28.1%
- Sources with 0 documents fetched: 23/32 = 71.9%

**Decision sufficiency threshold (≥80%)**: **NOT MET** (28.1% << 80%)

**Uncovered intelligence types observed (content-inspected, 9 sources)**:

| Intelligence type | Count | Sources |
|-------------------|-------|---------|
| other | 7 | Central Bank of Egypt, MAS Singapore, CBS Netherlands, Euronext, LSE Group, PIF, ADIA |
| fiscal_policy | 2 | Bangladesh Bank, CBS Netherlands |
| prudential_supervision | 2 | Central Bank of Egypt, Basel Committee |
| consumer_protection | 1 | Central Bank of Egypt |
| financial_coordination | 1 | Basel Committee |

**Critical caveats**:
1. **Only 9 of 32 sources had successful content inspection.** This is far below the 80% threshold. The content inspection could not be performed for most sources because the selected content path either had no document URLs or the documents themselves could not be fetched.
2. **The stratum-based heuristic from V1 was NOT used in V1.1.** V1.1 performed actual content inspection per protocol Section 4.3 — but only for 9 sources. This is an improvement in methodology (actual measurement vs stratum proxy) but coverage remains too low (28.1%) for decision-making.
3. **No intelligence type reaches the ≥5 threshold for BUILD NOW candidate** — but this is because only 9 sources were inspected, not because the intelligence types are rare.
4. **"other" classification is dominant (7/9 sources)** — suggests the keyword-based classifier may be too narrow. Many sources produce content that doesn't fit the predefined categories, OR the document titles/summaries don't contain the keywords the classifier looks for.

**Correct classification**: **INCONCLUSIVE — insufficient content inspection coverage**
- 28.1% content-inspected in the full sample
- Decision sufficiency threshold (≥80%) NOT met
- No BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC band assignment
- The stratum-based counts from V1 (financial_coordination=5, market_structure=5, fiscal_policy=3) are STILL invalid (per V1 correction at `e2479fb`) and are NOT used here

---

## 5. Decision Sufficiency Assessment

Per protocol V1.1 Section 7, the evaluation matrix may be applied ONLY if ALL three thresholds are met:

| Capability | Threshold | Observed (32 sources) | Met? |
|------------|-----------|------------------------|------|
| 4 — Browser Rendering | ≥80% definitive classification | 53.1% | **NO** |
| 5 — Language | ≥80% language detected | 46.9% | **NO** |
| 6 — Event-Model | ≥80% content inspected | 28.1% | **NO** |

**ALL THREE THRESHOLDS NOT MET.**

Per user directive and protocol Section 7: **the evaluation matrix is NOT applied.** No BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC classification is assigned for any capability.

---

## 6. What the V1.1 Final Results Support

The V1.1 final results (32/32 sources) support the following **lower-bound observations**:

1. **2 V1-INCONCLUSIVE sources promoted to measured classification** (BaFin → SPARSE_CONTENT, CBS Netherlands → STATIC_SUFFICIENT). The homepage-crawl + semantic-relevance-guard strategy works for some sources but not all.

2. **5 confirmed non-English source-language gaps** (German: 2, Arabic: 1, Dutch: 1, Portuguese: 1, Chinese: 1) — each with 1-2 sources and no English version. These are confirmed observations, not prevalence estimates.

3. **Content inspection (actual, not stratum-based) produced 9 successfully-classified sources** with intelligence types: fiscal_policy (2), prudential_supervision (2), consumer_protection (1), financial_coordination (1), other (7). This is real content-inspected evidence — not a stratum heuristic — but the coverage is too low (28.1%) for decision-making.

4. **3 confirmed BROWSER_RENDERED sources** (NSO India, Basel Committee, EIOPA) — V1 evidence confirmed in V1.1 using the improved measurement protocol (Discovery vs Ingestion Distinction). Combined with TCMB prior evidence: 4 confirmed Browser-rendered sources in cumulative evidence base.

5. **1 UNMEASURED source** (Department of Finance Canada — execution timeout). Explicitly distinguished from INCONCLUSIVE per user directive. V1 evidence preserved.

---

## 7. What the V1.1 Final Results Do NOT Support

Per anti-overclaiming rules (protocol Section 8, carried forward from V1):

1. **Does NOT claim any prevalence in the 178-source Universe or 149-source untested population.** The V1.1 sample is 32 sources — even with full execution, it is a pragmatic evidence-gathering sample, not a statistically powered estimate.

2. **Does NOT promote any capability to BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC.** All three decision sufficiency thresholds are NOT met.

3. **Does NOT apply the evaluation matrix.** Per user directive and protocol Section 7.

4. **Does NOT compare V1.1 counts to confirmed Portfolio cases.** The confirmed cases (TCMB, FED_ENF, etc.) are not a random sample.

5. **Does NOT update the Commercial Model.** The commercial promise stands unchanged.

6. **Does NOT update CAPABILITY_GAP_PORTFOLIO_V1.md.** Per user directive: "ولا تُحدّث CAPABILITY_GAP_PORTFOLIO حتى أراجع نتائج V1.1."

7. **Does NOT treat UNMEASURED sources as INCONCLUSIVE.** Per user directive — these are distinct statuses.

8. **Does NOT convert BaFin → SPARSE_CONTENT or CBS → STATIC_SUFFICIENT into onboarding success/failure.** These are capability-survey measurement improvements, not onboarding outcomes.

---

## 8. Recommendations

1. **Do NOT apply the evaluation matrix based on V1.1 results.** All three decision sufficiency thresholds are NOT met. Promoting any capability based on this data would violate the protocol.

2. **Do NOT update CAPABILITY_GAP_PORTFOLIO_V1.md.** Per user directive — wait for user review of V1.1 results.

3. **Do NOT update the Commercial Model.** The commercial promise stands unchanged.

4. **V1.1 has exhausted the measurement approach defined in Protocol V1.1.** The 14 sources that remain INCONCLUSIVE after re-run did so because:
   - Homepage itself could not be fetched (urllib + Playwright both blocked from this environment)
   - No semantically-relevant content-path candidate was found via homepage crawl
   - These are measurement infrastructure limitations, not capability-gap evidence

5. **Consider whether a fundamentally different measurement approach is warranted.** Options for user consideration (NOT recommended for execution without explicit user authorization):
   - V1.2 with manual URL discovery per source (human-curated content paths)
   - Different execution environment with longer timeouts and unrestricted network access
   - Accept that the current measurement infrastructure cannot reliably survey these sources and proceed without capability-roadmap decisions

6. **The V1.1 evidence base (32 sources) is preserved as-is for user review.** No further automated execution is recommended without user direction.

---

## 9. Document Status

**CAPABILITY_SURVEY_RESULTS_V1_1 — COMPLETE EXECUTION (32/32) / INCONCLUSIVE FOR DECISION.**

This document:
- Reports V1.1 final execution results (32/32 sources — 31 measured + 1 explicitly UNMEASURED)
- Reports per-capability measurement completeness against the ≥80% decision sufficiency thresholds
- Does NOT apply the evaluation matrix (all thresholds NOT met)
- Does NOT promote any capability to BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC
- Does NOT update CAPABILITY_GAP_PORTFOLIO_V1.md (per user directive)
- Does NOT modify any frozen artifact (v2 framework, Queue, Contract, Commercial Model)
- Is valid as **complete evidence-gathering artifact** but NOT as **basis for capability roadmap decisions**

Per user directive: "بعد اكتمال الـ32 نطبق أولاً Execution completeness = 32/32 ثم نحسب لكل capability Measurement completeness ثم نقرر هل شروط الـ80% تحققت. إذا تحققت، عندها فقط ننتقل إلى matrix inputs. وإذا لم تتحقق، يبقى كل capability INCONCLUSIVE دون أي هندسة أو roadmap promotion."

The user's directive has been followed exactly:
- Execution completeness: 32/32 ✓
- Measurement completeness per capability: 53.1% / 46.9% / 28.1%
- ≥80% thresholds: ALL NOT MET
- Result: all capabilities remain INCONCLUSIVE; no engineering or roadmap promotion

The next step (per user review): user reviews these final V1.1 results and decides whether to:
1. Authorize a fundamentally different survey approach (V1.2)
2. Accept V1.1 as INCONCLUSIVE and proceed without capability roadmap decisions
3. Apply the evaluation matrix manually (despite thresholds not met) — at the user's own discretion, against protocol

---

## 10. Document Provenance

| Field | Value |
|-------|-------|
| Author | main (Super Z) |
| Date | 2026-08-15 |
| Branch | `top20-prescreening` |
| Base commits | `14de356` (Survey Protocol V1.1 FROZEN) → `af6616c` (V1.1 partial, 21/32) → this commit (V1.1 final, 32/32) |
| Protocol | CAPABILITY_SURVEY_PROTOCOL_V1_1.md (FROZEN at `14de356`) |
| Sample | SAME 32-source sample as V1 (seed=20260815) |
| Execution completeness | 32/32 (100%) |
| Measurement completeness | 31/32 (96.9%) + 1/32 UNMEASURED (3.1%) |
| Decision sufficiency | ALL THREE thresholds NOT met → matrix NOT applied |
| V1 evidence preserved | Basel Committee + EIOPA BROWSER_RENDERED confirmed (not new discoveries) |
| Does NOT modify | v2 framework, Queue V1.1, pipeline code, source_configs.py, Contract, Commercial Model, CAPABILITY_GAP_PORTFOLIO_V1.md |

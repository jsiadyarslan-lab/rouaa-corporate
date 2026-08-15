# Capability Survey Results V1.1

**Date**: 2026-08-15
**Branch**: `top20-prescreening`
**Status**: PARTIAL EXECUTION / INCONCLUSIVE FOR DECISION — 21/32 sources completed; 11 sources NOT completed due to tool-call timeouts
**Type**: Survey execution report — evidence-gathering only. Does NOT decide BUILD NOW for any capability. Does NOT apply the evaluation matrix. Does NOT update CAPABILITY_GAP_PORTFOLIO.
**Base**: Capability Survey Follow-up Protocol V1.1 (FROZEN at `14de356`)

---

## 1. Execution Summary

| Field | Value |
|-------|-------|
| Protocol version | CAPABILITY_SURVEY_PROTOCOL_V1_1.md (FROZEN at `14de356`) |
| Sample size target | 32 sources |
| **Sample size completed** | **21/32 sources (65.6%)** |
| Sources NOT completed | 11 (indices 22-32) — tool-call timeouts prevented execution |
| Re-run sources (V1 INCONCLUSIVE) | Attempted: 17 of 17 in the completed subset; promoted: 2 |
| Content inspection | Performed: 21 of 32 (65.6%); successful: 4 of 21 (19%) |
| Per-source artifacts | `survey_data_v1_1.jsonl` (21 entries), `survey_results_summary_v1_1.json` |
| Execution script | `/home/z/my-project/scripts/capability_survey_v1_1_execute.py` |
| Deduplication script | `/home/z/my-project/scripts/capability_survey_v1_1_dedupe.py` |

### Critical limitation

**11 of 32 sources (34.4%) were NOT completed due to repeated tool-call timeouts.** The execution script is resumable and writes each result immediately, but the environment's tool-call timeout prevented the script from running long enough to process all 32 sources. The 21 completed sources are valid; the 11 missing sources are NOT inconclusive — they are simply unmeasured.

This is an **execution limitation**, not a measurement limitation. A follow-up execution (possibly in a restarted session) could complete the remaining 11 sources.

---

## 2. Per-Source Results (21 completed sources)

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
| 11 | B2 | CSRC (China) | STATIC_SUFFICIENT | STATIC_SUFFICIENT | no | 0 | (none — no doc URLs found) |
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

### Sources NOT completed (11 — indices 22-32)

| # | Stratum | Institution | Reason |
|---|---------|-------------|--------|
| 22 | B4 | Department of Finance (Canada) | Tool-call timeout |
| 23 | B5 | Euronext | Tool-call timeout |
| 24 | B5 | LSE Group | Tool-call timeout |
| 25 | B6 | China Investment Corporation | Tool-call timeout |
| 26 | B6 | PIF (Saudi Arabia) | Tool-call timeout |
| 27 | B6 | ADIA (UAE) | Tool-call timeout |
| 28 | B7 | Basel Committee | Tool-call timeout |
| 29 | B7 | G20 | Tool-call timeout |
| 30 | B8 | SEDAR+ (Canada) | Tool-call timeout |
| 31 | B8 | SGXNET (Singapore) | Tool-call timeout |
| 32 | B9 | EIOPA | Tool-call timeout |

---

## 3. V1 vs V1.1 Comparison

### Rendering classifications (21 completed sources only)

| Classification | V1 count | V1.1 count | Change |
|----------------|----------|------------|--------|
| STATIC_SUFFICIENT | 4 | 5 | +1 |
| BROWSER_RENDERED | 1 | 1 | 0 |
| SPARSE_CONTENT | 4 | 5 | +1 |
| INCONCLUSIVE | 12 | 10 | -2 |

**V1 INCONCLUSIVE → V1.1 promoted to measured**: 2 sources
- BaFin (B2): INCONCLUSIVE → SPARSE_CONTENT (re-run found content path but with sparse documents)
- CBS Netherlands (B3): INCONCLUSIVE → STATIC_SUFFICIENT (re-run found content path with sufficient documents)

**V1 INCONCLUSIVE → V1.1 still INCONCLUSIVE**: 10 sources (re-run attempted but URL discovery + semantic relevance guard still failed for these)

### Re-run effectiveness

Of 17 V1-INCONCLUSIVE sources in the completed subset:
- 2 promoted to measured classification (12%)
- 10 remain INCONCLUSIVE (59%)
- 5 were NOT in this subset (only 12 of 17 V1-INCONCLUSIVE sources were in the 21 completed sources)

The re-run improved measurement completeness by 2 sources (9.5% of the 21-source subset). The homepage-crawl + semantic-relevance-guard strategy worked for CBS Netherlands and BaFin but failed for 10 other sources — primarily because the homepage itself could not be fetched (many central banks/regulators block urllib AND Playwright from this environment).

---

## 4. Per-Capability Findings (21 completed sources only)

### 4.1 Capability 4 — Browser Rendering

**Measurement completeness (21 sources)**:
- Definitive classification (STATIC_SUFFICIENT + BROWSER_RENDERED + SPARSE_CONTENT): 11/21 = 52.4%
- INCONCLUSIVE: 10/21 = 47.6%

**Decision sufficiency threshold (≥80%)**: **NOT MET** (52.4% < 80%)

**Sources classified BROWSER_RENDERED in V1.1**: 1 (NSO India — carried from V1)

**V1 vs V1.1 comparison**:
- V1: 1 BROWSER_RENDERED in this subset
- V1.1: 1 BROWSER_RENDERED in this subset (same source, confirmed)
- No NEW BROWSER_RENDERED cases discovered in V1.1 re-run (the 2 promoted sources were SPARSE_CONTENT and STATIC_SUFFICIENT, not BROWSER_RENDERED)

**Combined with V1 full-sample evidence** (including the 11 sources not re-run in V1.1):
- V1 confirmed BROWSER_RENDERED: 3 (NSO India, Basel Committee, EIOPA) + TCMB prior = 4 total
- V1.1 confirmed BROWSER_RENDERED in completed subset: 1 (NSO India)
- Basel Committee and EIOPA were in the 11 NOT-completed sources — their V1.1 status is unknown

**Correct classification**: **INCONCLUSIVE / insufficient measurement coverage**
- 47.6% INCONCLUSIVE in the completed subset
- 34.4% of the full 32-source sample NOT completed at all
- Decision sufficiency threshold (≥80%) NOT met
- No BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC band assignment

### 4.2 Capability 5 — Language Coverage

**Measurement completeness (21 sources)**:
- Detected primary language (NOT unknown): 9/21 = 42.9%
- Unknown: 12/21 = 57.1%

**Decision sufficiency threshold (≥80%)**: **NOT MET** (42.9% < 80%)

**Language distribution (V1.1, 21 sources)**:

| Language | Count |
|----------|-------|
| en | 3 |
| de | 2 |
| ar | 1 |
| nl | 1 |
| pt | 1 |
| zh | 1 |
| unknown | 12 |

**English version availability (V1.1, 21 sources)**:

| English version | Count |
|-----------------|-------|
| YES | 5 |
| NO | 6 |
| UNKNOWN | 10 |

**Non-English sources with NO English version (where language detected)**:

| Language | Sources | Count |
|----------|---------|-------|
| de (German) | FSO Switzerland, Federal Financial Supervisory Authority (BaFin) | 2 |
| ar (Arabic) | Ministry of Finance (Saudi Arabia) | 1 |
| nl (Dutch) | CBS (Netherlands) | 1 |
| pt (Portuguese) | Banco Central do Brasil | 1 |
| zh (Chinese) | CSRC (China) | 1 |

**Correct classification**: **INCONCLUSIVE; confirmed gaps exist, prevalence unknown**
- 57.1% unknown language in the completed subset
- 34.4% of the full 32-source sample NOT completed
- Decision sufficiency threshold (≥80%) NOT met
- No BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC band assignment

### 4.3 Capability 6 — Event-Model Representation

**Content inspection completeness (21 sources)**:
- Sources with ≥1 document fetched and classified: 4/21 = 19.0%
- Sources with 0 documents fetched: 17/21 = 81.0%

**Decision sufficiency threshold (≥80%)**: **NOT MET** (19.0% << 80%)

**Uncovered intelligence types observed (content-inspected, 4 sources)**:

| Intelligence type | Count | Sources |
|-------------------|-------|---------|
| fiscal_policy | 2 | Bangladesh Bank, CBS Netherlands |
| prudential_supervision | 1 | Central Bank of Egypt |
| consumer_protection | 1 | Central Bank of Egypt |
| other | 3 | Central Bank of Egypt, MAS Singapore, CBS Netherlands |

**Critical caveats**:
1. **Only 4 of 21 sources had successful content inspection.** This is far below the 80% threshold. The content inspection could not be performed for most sources because the selected content path either had no document URLs or the documents themselves could not be fetched.
2. **The stratum-based heuristic from V1 was NOT used in V1.1.** V1.1 performed actual content inspection per protocol Section 4.3 — but only for 4 sources. This is an improvement in methodology (actual measurement vs stratum proxy) but a regression in coverage (4/21 vs V1's 32/32 stratum-based).
3. **No intelligence type reaches the ≥5 threshold for BUILD NOW candidate** — but this is because only 4 sources were inspected, not because the intelligence types are rare.

**Correct classification**: **INCONCLUSIVE — insufficient content inspection coverage**
- 19.0% content-inspected in the completed subset
- 34.4% of the full 32-source sample NOT completed
- Decision sufficiency threshold (≥80%) NOT met
- No BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC band assignment
- The stratum-based counts from V1 (financial_coordination=5, market_structure=5, fiscal_policy=3) are STILL invalid (per V1 correction at `e2479fb`) and are NOT used here

---

## 5. Decision Sufficiency Assessment

Per protocol V1.1 Section 7, the evaluation matrix may be applied ONLY if ALL three thresholds are met:

| Capability | Threshold | Observed (21 sources) | Met? |
|------------|-----------|------------------------|------|
| 4 — Browser Rendering | ≥80% definitive classification | 52.4% | **NO** |
| 5 — Language | ≥80% language detected | 42.9% | **NO** |
| 6 — Event-Model | ≥80% content inspected | 19.0% | **NO** |

**ALL THREE THRESHOLDS NOT MET.**

Per user directive and protocol Section 7: **the evaluation matrix is NOT applied.** No BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC classification is assigned for any capability.

---

## 6. What the V1.1 Partial Results Support

The V1.1 partial results (21/32 sources) support the following **lower-bound observations**:

1. **2 V1-INCONCLUSIVE sources promoted to measured classification** (BaFin → SPARSE_CONTENT, CBS Netherlands → STATIC_SUFFICIENT). The homepage-crawl + semantic-relevance-guard strategy works for some sources but not all.

2. **5 confirmed non-English source-language gaps** (German: 2, Arabic: 1, Dutch: 1, Portuguese: 1, Chinese: 1) — each with 1-2 sources and no English version. These are confirmed observations, not prevalence estimates.

3. **Content inspection (actual, not stratum-based) produced 4 successfully-classified sources** with intelligence types: fiscal_policy (2), prudential_supervision (1), consumer_protection (1), other (3). This is real content-inspected evidence — not a stratum heuristic — but the coverage is too low (4/21) for decision-making.

4. **No new BROWSER_RENDERED cases discovered in V1.1** (the 2 promoted sources were SPARSE_CONTENT and STATIC_SUFFICIENT). The 1 V1 BROWSER_RENDERED case in this subset (NSO India) was confirmed.

---

## 7. What the V1.1 Partial Results Do NOT Support

Per anti-overclaiming rules (protocol Section 8, carried forward from V1):

1. **Does NOT claim any prevalence in the 178-source Universe or 149-source untested population.** The V1.1 sample is 21/32 (partial) — even less representative than V1.

2. **Does NOT promote any capability to BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC.** All three decision sufficiency thresholds are NOT met.

3. **Does NOT apply the evaluation matrix.** Per user directive and protocol Section 7.

4. **Does NOT compare V1.1 counts to confirmed Portfolio cases.** The confirmed cases (TCMB, FED_ENF, etc.) are not a random sample.

5. **Does NOT update the Commercial Model.** The commercial promise stands unchanged.

6. **Does NOT update CAPABILITY_GAP_PORTFOLIO_V1.md.** Per user directive: "ولا تُحدّث CAPABILITY_GAP_PORTFOLIO حتى أراجع نتائج V1.1."

7. **Does NOT claim the 11 NOT-completed sources are INCONCLUSIVE.** They are UNMEASURED — a different status. They need a follow-up execution to complete.

---

## 8. Recommendations

1. **Complete the remaining 11 sources.** The execution script is resumable — a follow-up execution (possibly in a restarted session with longer tool-call timeouts) can process sources 22-32 and produce a complete V1.1 dataset.

2. **Do NOT apply the evaluation matrix based on partial V1.1 results.** All three decision sufficiency thresholds are NOT met. Even completing the remaining 11 sources may not raise measurement completeness to ≥80% (the re-run effectiveness was only 12% for V1-INCONCLUSIVE sources).

3. **Do NOT update CAPABILITY_GAP_PORTFOLIO_V1.md.** Per user directive — wait for user review of V1.1 results.

4. **Do NOT update the Commercial Model.** The commercial promise stands unchanged.

5. **Consider a third survey pass (V1.2)** if V1.1 completion still does not meet the ≥80% thresholds. The measurement approach may need fundamental redesign (e.g., manual URL discovery per source rather than automated homepage crawl).

---

## 9. Document Status

**CAPABILITY_SURVEY_RESULTS_V1_1 — PARTIAL EXECUTION / INCONCLUSIVE FOR DECISION.**

This document:
- Reports V1.1 partial execution results honestly (21/32 sources completed; 11 NOT completed due to tool-call timeouts)
- Reports per-capability measurement completeness against the ≥80% decision sufficiency thresholds
- Does NOT apply the evaluation matrix (all thresholds NOT met)
- Does NOT promote any capability to BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC
- Does NOT update CAPABILITY_GAP_PORTFOLIO_V1.md (per user directive)
- Does NOT modify any frozen artifact (v2 framework, Queue, Contract, Commercial Model)
- Is valid as **partial evidence-gathering artifact** but NOT as **basis for capability roadmap decisions**

The next step (per user review): user reviews these partial results and decides whether to:
1. Authorize a follow-up execution to complete the remaining 11 sources
2. Accept V1.1 as INCONCLUSIVE and proceed without capability roadmap decisions
3. Authorize a fundamentally different survey approach (V1.2) if V1.1 completion is unlikely to meet thresholds

---

## 10. Document Provenance

| Field | Value |
|-------|-------|
| Author | main (Super Z) |
| Date | 2026-08-15 |
| Branch | `top20-prescreening` |
| Base commits | `14de356` (Survey Protocol V1.1 FROZEN) → this commit (Survey Results V1.1 partial) |
| Protocol | CAPABILITY_SURVEY_PROTOCOL_V1_1.md (FROZEN at `14de356`) |
| Sample | SAME 32-source sample as V1 (seed=20260815) |
| Completed | 21/32 sources (65.6%) |
| NOT completed | 11 sources (34.4%) — tool-call timeouts |
| Re-run performed | 12 of 17 V1-INCONCLUSIVE sources in completed subset |
| Content inspection | 4 of 21 sources successfully inspected (19%) |
| Decision sufficiency | ALL THREE thresholds NOT met → matrix NOT applied |
| Does NOT modify | v2 framework, Queue V1.1, pipeline code, source_configs.py, Contract, Commercial Model, CAPABILITY_GAP_PORTFOLIO_V1.md |

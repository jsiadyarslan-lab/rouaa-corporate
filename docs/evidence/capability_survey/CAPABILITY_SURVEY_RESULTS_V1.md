# Capability Survey Results V1

**Date**: 2026-08-15
**Branch**: `top20-prescreening`
**Status**: COMPLETE / FOR DECISION REVIEW
**Type**: Survey execution report — evidence-gathering only. Does NOT decide BUILD NOW for any capability.
**Base**: Capability Survey Protocol V1 (corrected at `2e33039`, APPROVED by user)

---

## 1. Survey Execution Summary

| Field | Value |
|-------|-------|
| Protocol version | CAPABILITY_SURVEY_PROTOCOL_V1.md (corrected at `2e33039`) |
| Universe total | 178 sources |
| Already-tested (excluded) | 29 sources (12 QUALIFIED + 5 SCREENED + 4 Replication Batch + 4 Remediation + 4 leak fixes) |
| Untested population | 149 sources |
| Random seed | 20260815 (fixed, documented) |
| Sample size | 32 sources |
| Stratification | Exact `institutional_class` from Global Source Universe v1 (B1-B9) |
| Allocation | B1=8, B2=7, B3=4, B4=3, B5=2, B6=3, B7=2, B8=2, B9=1 (sum=32) |
| Execution mode | Single-pass per source: static fetch → language detection → (if needed) Playwright rendering |
| Per-source artifacts | `survey_data.jsonl` (32 entries), `survey_results_summary.json` |

---

## 2. Critical Limitation: Measurement Inconclusiveness

**53.1% of the sample (17/32 sources) produced INCONCLUSIVE results.** This is the most important fact in this document and must be considered when reading every prioritization band below.

### Why so many INCONCLUSIVE

The survey protocol Section 3.3 specified "Selected content path: The specific path being surveyed (RSS feed URL, HTML index URL, or PDF URL) — typically the source's main press releases / announcements path". The execution script attempted 5 candidate URL paths per source based on common institutional conventions (e.g., `/en/press-releases`, `/news`, `/releases`, etc.). When all 5 candidates failed (returned < 1000 bytes, HTTP error, or timeout), the source was marked INCONCLUSIVE.

17 sources had all candidate URLs fail. This is a **measurement limitation**, not a real classification. The actual capability gap for these sources is unknown.

### What this means for the prioritization bands

The prioritization bands in the protocol assumed a low INCONCLUSIVE rate. With 53% INCONCLUSIVE:
- The observed counts are biased LOW (we only see gaps in the 15 sources that fetched successfully)
- The actual prevalence of each capability gap in the untested population is likely HIGHER than observed
- **The prioritization bands below must be read as FLOOR estimates, not point estimates**

A follow-up survey with better URL discovery (e.g., crawling each source's homepage to find the actual press-release path) would reduce the INCONCLUSIVE rate and may produce different band assignments.

---

## 3. Per-Source Results

Full data in `survey_data.jsonl`. Summary table below.

| # | Stratum | Institution | Country | Rendering | Static URLs | Lang | English | Intelligence Types |
|---|---------|-------------|---------|-----------|-------------|------|---------|---------------------|
| 1 | B1 | Bangladesh Bank | BD | STATIC_SUFFICIENT | 23 | unknown | YES | monetary_policy, statistical_release |
| 2 | B1 | Banco Central do Brasil | BR | SPARSE_CONTENT | 0 | pt | YES | monetary_policy, statistical_release |
| 3 | B1 | People's Bank of China | CN | INCONCLUSIVE | 0 | unknown | UNKNOWN | monetary_policy, statistical_release |
| 4 | B1 | Bank of Korea | KR | INCONCLUSIVE | 0 | unknown | UNKNOWN | monetary_policy, statistical_release |
| 5 | B1 | South African Reserve Bank | ZA | INCONCLUSIVE | 0 | unknown | UNKNOWN | monetary_policy, statistical_release |
| 6 | B1 | Banco de España | ES | INCONCLUSIVE | 0 | unknown | UNKNOWN | monetary_policy, statistical_release |
| 7 | B1 | Central Bank of Egypt | EG | STATIC_SUFFICIENT | 85 | en | YES | monetary_policy, statistical_release |
| 8 | B1 | Central Bank of the UAE | AE | INCONCLUSIVE | 0 | unknown | UNKNOWN | monetary_policy, statistical_release |
| 9 | B2 | SEC Philippines | PH | INCONCLUSIVE | 0 | unknown | UNKNOWN | regulatory_enforcement |
| 10 | B2 | MAS (Singapore) | SG | STATIC_SUFFICIENT | 148 | en | NO | regulatory_enforcement |
| 11 | B2 | CSRC (China) | CN | STATIC_SUFFICIENT | 235 | zh | NO | regulatory_enforcement |
| 12 | B2 | Federal Financial Supervisory Authority (BaFin) | DE | INCONCLUSIVE | 0 | unknown | UNKNOWN | regulatory_enforcement |
| 13 | B2 | NCUA | US | INCONCLUSIVE | 0 | unknown | UNKNOWN | regulatory_enforcement |
| 14 | B2 | AMF (France) | FR | INCONCLUSIVE | 0 | unknown | UNKNOWN | regulatory_enforcement |
| 15 | B2 | SC (Malaysia) | MY | SPARSE_CONTENT | 0 | unknown | NO | regulatory_enforcement |
| 16 | B3 | DANE (Colombia) | CO | INCONCLUSIVE | 0 | unknown | UNKNOWN | statistical_release |
| 17 | B3 | NSO (India) | IN | BROWSER_RENDERED | 0 | en | NO | statistical_release |
| 18 | B3 | CBS (Netherlands) | NL | INCONCLUSIVE | 0 | unknown | UNKNOWN | statistical_release |
| 19 | B3 | FSO (Switzerland) | CH | SPARSE_CONTENT | 0 | de | NO | statistical_release |
| 20 | B4 | Ministry of Finance (Saudi Arabia) | SA | SPARSE_CONTENT | 0 | ar | NO | fiscal_policy, financial_coordination |
| 21 | B4 | Ministère de l'Économie (France) | FR | INCONCLUSIVE | 0 | unknown | UNKNOWN | fiscal_policy, financial_coordination |
| 22 | B4 | Department of Finance (Canada) | CA | INCONCLUSIVE | 0 | unknown | UNKNOWN | fiscal_policy, financial_coordination |
| 23 | B5 | Euronext | EU | STATIC_SUFFICIENT | 378 | en | YES | market_structure |
| 24 | B5 | LSE Group | UK | STATIC_SUFFICIENT | 21 | en | YES | market_structure |
| 25 | B6 | China Investment Corporation | CN | INCONCLUSIVE | 0 | unknown | UNKNOWN | market_structure |
| 26 | B6 | PIF (Saudi Arabia) | SA | STATIC_SUFFICIENT | 47 | en | YES | market_structure |
| 27 | B6 | ADIA (UAE) | AE | STATIC_SUFFICIENT | 6 | en | YES | market_structure |
| 28 | B7 | Basel Committee | INT | BROWSER_RENDERED | 2 | en | NO | financial_coordination, statistical_release |
| 29 | B7 | G20 | INT | INCONCLUSIVE | 0 | unknown | UNKNOWN | financial_coordination, statistical_release |
| 30 | B8 | SEDAR+ (Canada) | CA | INCONCLUSIVE | 0 | unknown | UNKNOWN | regulatory_enforcement |
| 31 | B8 | SGXNET (Singapore) | SG | INCONCLUSIVE | 0 | en | NO | regulatory_enforcement |
| 32 | B9 | EIOPA | EU | BROWSER_RENDERED | 0 | en | YES | regulatory_enforcement |

---

## 4. Per-Capability Findings

### 4.1 Capability 4 — Adapter / Browser Rendering

**Observed classifications (n=32):**

| Classification | Count | % of sample |
|----------------|-------|-------------|
| STATIC_SUFFICIENT | 8 | 25.0% |
| BROWSER_RENDERED | 3 | 9.4% |
| SPARSE_CONTENT | 4 | 12.5% |
| INCONCLUSIVE | 17 | 53.1% |

**Sources classified BROWSER_RENDERED (n=3):**
- NSO (India) — B3 statistical agency — static count=0, rendered count≥5, individual document URLs exposed after rendering (satisfies measurement-validity rule Section 4.1 step 5)
- Basel Committee — B7 multilateral — static count=2, rendered count≥5, individual document URLs exposed after rendering
- EIOPA — B9 other authoritative — static count=0, rendered count≥5, individual document URLs exposed after rendering

**Sources classified SPARSE_CONTENT (n=4):**
- Banco Central do Brasil — static=0, rendered≤3 (likely wrong content path, not browser rendering)
- SC (Malaysia) — static=0, rendered≤3
- FSO (Switzerland) — static=0, rendered≤3
- Ministry of Finance (Saudi Arabia) — static=0, rendered≤3

These are NOT browser-rendering cases — they are likely wrong content path guesses (route to CONTENT-PATH REVIEW, not browser rendering).

**Sources classified INCONCLUSIVE (n=17):**
All 17 failed at the static-fetch step (URL candidates returned < 1000 bytes or HTTP error). Playwright was not attempted because static fetch never succeeded.

**Predefined prioritization band application:**

Per protocol Section 4.1:
- ≥30% Browser-rendered → BUILD NOW candidate
- 10-30% → ENGINEERING CANDIDATE
- <10% → CUSTOMER-SPECIFIC
- 0 observed → no evidence of reuse in the sampled population

**Observed: 3/32 = 9.4% Browser-rendered.**

This falls in the **<10% → CUSTOMER-SPECIFIC** band per the predefined triage rule.

**Critical caveat**: 17/32 (53%) are INCONCLUSIVE. The actual Browser-rendered prevalence in the untested population could be higher. The 9.4% figure is a **floor estimate**, not a point estimate. The 3 confirmed cases (NSO India, Basel Committee, EIOPA) are real evidence — but the sample is too incomplete to definitively assign the CUSTOMER-SPECIFIC band.

**Honest conclusion**: The survey provides **3 new confirmed Browser-rendered cases** (in addition to TCMB from prior evidence). Combined with TCMB, there are now **4 confirmed cases** requiring browser rendering. Whether this justifies a platform capability (BUILD NOW) vs customer-specific scope remains the user's matrix-based decision — the survey evidence alone does not produce a definitive band assignment due to the 53% INCONCLUSIVE rate.

### 4.2 Capability 5 — Language / Multilingual Coverage

**Language distribution (n=32):**

| Language | Count | Notes |
|----------|-------|-------|
| en | 10 | English-primary |
| unknown | 18 | Fetch failed; language could not be detected |
| pt | 1 | Banco Central do Brasil (English version YES) |
| zh | 1 | CSRC China (English version NO) |
| de | 1 | FSO Switzerland (English version NO) |
| ar | 1 | Ministry of Finance Saudi Arabia (English version NO) |

**English version availability:**

| English version | Count |
|-----------------|-------|
| YES | 8 |
| NO | 8 |
| UNKNOWN | 16 (fetch failed) |

**Non-English sources with NO English version (where language was detectable):**

| Language | Sources | Count |
|----------|---------|-------|
| zh (Chinese) | CSRC (China) | 1 |
| de (German) | FSO (Switzerland) | 1 |
| ar (Arabic) | Ministry of Finance (Saudi Arabia) | 1 |

**Predefined prioritization band application (per language):**

Per protocol Section 4.2:
- ≥3 sources in language X with NO English → BUILD NOW candidate
- 1-2 sources → ENGINEERING CANDIDATE
- 0 sources observed → no evidence of reuse for language X

**Observed per language (with NO English):**
- Chinese (zh): 1 source → **ENGINEERING CANDIDATE** band
- German (de): 1 source → **ENGINEERING CANDIDATE** band
- Arabic (ar): 1 source → **ENGINEERING CANDIDATE** band

**Critical caveat**: 16/32 sources had UNKNOWN language (fetch failed). The actual non-English count in the untested population is likely HIGHER. The 1-source-per-language observation is a **floor estimate**. Particularly:
- 5 B1 sources were INCONCLUSIVE — these could include Chinese (PBOC), Korean (Bank of Korea), Arabic (Central Bank of Egypt was English), Turkish, etc.
- 3 B2 sources were INCONCLUSIVE — could include Italian, French, German
- 2 B3 sources were INCONCLUSIVE — could include Spanish, Dutch, Italian, Japanese

**Honest conclusion**: The survey provides **3 confirmed non-English source-language gaps** (Chinese, German, Arabic — 1 source each). All three fall in the ENGINEERING CANDIDATE band. None reach the ≥3 threshold for BUILD NOW candidate. But the 16 UNKNOWN-language sources could shift any of these counts upward if a follow-up survey with better URL discovery is performed.

### 4.3 Capability 6 — Event-Model Representation

**Methodological caveat**: The protocol Section 4.3 specified "Sample 1-3 document titles + summaries from the source's content path. Classify the intelligence type". Due to the 53% INCONCLUSIVE rate (most content paths failed to fetch), actual content inspection was not possible for most sources. The execution script used a **conservative stratum-based heuristic** instead: each source's intelligence type was inferred from its `institutional_class` rather than from actual content inspection. This is a **protocol deviation** that must be flagged.

**Stratum-based intelligence type classification (n=32):**

| Intelligence type | Sources (by stratum) | Count | Covered by existing event type? |
|-------------------|----------------------|-------|--------------------------------|
| monetary_policy | B1 (8 sources) | 8 | YES |
| statistical_release | B1 (8) + B3 (4) + B7 (2) | 14 | YES |
| regulatory_enforcement | B2 (7) + B8 (2) + B9 (1) | 10 | YES |
| fiscal_policy | B4 (3) | 3 | **NO** (UNCOVERED) |
| financial_coordination | B4 (3) + B7 (2) | 5 | **NO** (UNCOVERED) |
| market_structure | B5 (2) + B6 (3) | 5 | **NO** (UNCOVERED) |

**Predefined prioritization band application (per uncovered type):**

Per protocol Section 4.3:
- ≥5 sources producing type Y with no existing event type fits → BUILD NOW candidate
- 2-4 sources → ENGINEERING CANDIDATE
- 1 source → CUSTOMER-SPECIFIC
- 0 sources observed → no evidence of reuse

**Observed: NONE — protocol deviation invalidates band application.**

The protocol Section 4.3 required content inspection ("Sample 1-3 document titles + summaries from the source's content path. Classify the intelligence type"). The execution script did NOT perform content inspection due to the 53% INCONCLUSIVE rate — most content paths failed to fetch. Instead, the script used a **stratum-based heuristic** (intelligence type inferred from `institutional_class` rather than from actual content).

The stratum-based counts (which would have been: financial_coordination=5, market_structure=5, fiscal_policy=3) are NOT valid survey measurements of intelligence types. They are an inference about what each stratum *typically* produces, not what each source *actually* produces.

**Correct classification**: **INCONCLUSIVE — protocol deviation**

**Reason**: The question the protocol asked ("what intelligence types does this source produce?") was not measured. The stratum-based counts are a hypothesis, not a measurement. They cannot be used as input to the predefined prioritization bands.

**What would be needed**: A follow-up survey that performs actual content inspection (fetch 1-3 documents per source, classify intelligence type from titles/summaries) — see Follow-up Survey Protocol V1.1.

---

## 5. Summary of Predefined-Band Routing

**Per user review of `2ac5d04`: the predefined-band routing table below is INVALIDATED. The bands cannot be applied because the underlying measurements are insufficient.**

The user's review identified three critical problems:
1. Capability 6 used stratum-based heuristic, not content inspection — the question was not measured.
2. Browser Rendering has 53% INCONCLUSIVE — the 9.4% confirmed rate is a floor estimate, not a measurement of prevalence.
3. Language Coverage has 50% UNKNOWN — the 1-source-per-language count is a lower-bound observation, not a survey result.

### Corrected classifications (per user review)

| Capability | Corrected classification | Reason |
|------------|--------------------------|--------|
| 4 — Browser Rendering | **INCONCLUSIVE / insufficient measurement coverage** | 53% INCONCLUSIVE; 4 confirmed cases (incl. TCMB) exist but reuse rate in untested population is unknown |
| 5 — Language (Chinese) | **INCONCLUSIVE; confirmed gap exists, prevalence unknown** | 1 confirmed case; 50% UNKNOWN language; lower-bound observation only |
| 5 — Language (German) | **INCONCLUSIVE; confirmed gap exists, prevalence unknown** | Same as above |
| 5 — Language (Arabic) | **INCONCLUSIVE; confirmed gap exists, prevalence unknown** | Same as above |
| 6 — Event-Model (all types) | **INCONCLUSIVE — protocol deviation** | Stratum-based heuristic used; content inspection NOT performed per protocol Section 4.3 |

### Survey completion vs. survey validity for decision

Per user review, the distinction between **Survey Completion** and **Survey Validity for Decision** is the key framing:

| Metric | Value |
|--------|-------|
| Execution completeness | 32/32 (100%) — every sampled source was attempted |
| Measurement completeness | 15/32 (46.9%) — only 15 sources produced a usable measurement (8 STATIC_SUFFICIENT + 3 BROWSER_RENDERED + 4 SPARSE_CONTENT) |
| Decision sufficiency | **NO** — the matrix cannot be applied with confidence |

The matrix requires reliable inputs for `reuse potential` and `blocked source count`. Both depend on measurement completeness, which is 46.9% — too low for confident decision-making.

### Matrix inputs — NOT APPLICABLE

Per user directive: **the evaluation matrix is NOT applied.** The matrix inputs (reuse potential, blocked source count) cannot be derived with confidence from this survey. Applying the matrix now would produce a recommendation based on insufficient data, which the user has explicitly forbidden.

---

## 6. What the Sample Supports

The sample supports the following **lower-bound observations** (NOT prevalence estimates):

1. **4 confirmed Browser-rendered sources** exist in the cumulative evidence base (NSO India, Basel Committee, EIOPA — newly confirmed in this survey; TCMB — prior remediation evidence). These are real, evidence-supported data points.

2. **3 confirmed non-English source-language gaps** exist (CSRC Chinese, FSO German, Saudi MoF Arabic) — each with 1 source and no English version. These are confirmed observations, not prevalence estimates.

3. **No capability can be promoted to BUILD NOW based on this survey.** The user's review explicitly established that the survey is **not valid as a basis for BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC promotion** because:
   - Capability 4: 53% INCONCLUSIVE — insufficient measurement coverage.
   - Capability 5: 50% UNKNOWN language — lower-bound observations only.
   - Capability 6: protocol deviation — the question was not measured.

4. **The survey IS valid as evidence-gathering.** The 4 confirmed Browser-rendered cases and 3 confirmed non-English gaps are real additions to the cumulative evidence base. They are not sufficient for decision-making, but they are not worthless — they will be combined with follow-up survey evidence in V1.1.

---

## 7. What the Sample Does NOT Support

The sample does NOT support the following claims (per anti-overclaiming rules, protocol Section 6.4):

1. **Does NOT claim "X% of all 178 sources need browser rendering".** The sample covers 32 sources in the untested population; 53% were INCONCLUSIVE. No prevalence claim is made for the 178-source Universe or even for the 149-source untested population.

2. **Does NOT promote any capability to BUILD NOW.** The matrix evaluation is a recommendation only; the user makes the final call. Even the two intelligence types that meet the ≥5 threshold (financial_coordination, market_structure) used a stratum heuristic — not content inspection — so the count is not robust.

3. **Does NOT claim the 3 confirmed Browser-rendered sources are "outliers"** (the word "outlier" is forbidden per protocol Section 6.4). They are confirmed cases of browser rendering requirement.

4. **Does NOT compare survey counts to confirmed Portfolio cases.** The confirmed Portfolio cases (TCMB, FED_ENF, INSEE, etc.) were selected for strategic reasons and are not a random sample — comparing them to the survey sample would be misleading.

5. **Does NOT update the Commercial Model.** The commercial promise stands unchanged.

6. **Does NOT claim statistical prevalence.** The sample is a pragmatic evidence-gathering sample, not a statistically powered estimate (per protocol Section 3.1, corrected at `2e33039`).

---

## 8. Recommendations

Per user review of `2ac5d04`:

1. **Do NOT apply the evaluation matrix now.** The matrix requires reliable inputs for `reuse potential` and `blocked source count` — both depend on measurement completeness (46.9%) which is too low for confident decision-making.

2. **Do NOT promote any capability based on this survey.** All three engineering candidates are reclassified to INCONCLUSIVE.

3. **Authorize Follow-up Survey V1.1** (recommended by user) with these constraints:
   - **Same original sample** (32 sources from V1) — preserve comparability.
   - **Do NOT re-sample or replace** — keep the original selection (seed=20260815).
   - **Re-run only INCONCLUSIVE sources** (17 sources from V1 that failed measurement) — improving URL discovery to reduce the INCONCLUSIVE rate.
   - **Perform actual content inspection for Event-Model** (Capability 6) — fetch 1-3 documents per source and classify intelligence type from titles/summaries, per protocol Section 4.3 (which V1 deviated from).
   - This produces a **comparable second pass** — same sample, higher measurement completeness, with the question actually measured.

4. **After V1.1**: re-evaluate measurement completeness. If measurement completeness reaches an acceptable threshold (e.g., ≥80%), the matrix can be applied with confidence. If it remains low, a third pass or a different survey strategy may be needed.

5. **No Commercial Model update** at any point until the matrix is applied and the user makes a manual decision per capability.

---

## 9. Document Status

**CAPABILITY_SURVEY_RESULTS_V1 — EVIDENCE-GATHERING ARTIFACT ONLY. NOT VALID AS BASIS FOR BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC PROMOTION.**

Per user review of `2ac5d04`:

> "الـsurvey ناجح كعملية جمع أدلة، لكنه غير صالح بعد لاتخاذ قرارات BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC."

Three critical problems identified and applied as corrections:
1. **Capability 6** reclassified to **INCONCLUSIVE — protocol deviation**. The protocol required content inspection; the execution used stratum-based heuristic. The question was not measured. The stratum-based counts (financial_coordination=5, market_structure=5, fiscal_policy=3) are NOT valid survey measurements.
2. **Capability 4 (Browser Rendering)** reclassified to **INCONCLUSIVE / insufficient measurement coverage**. 53% INCONCLUSIVE means the 9.4% confirmed Browser-rendered rate is a floor estimate, not a prevalence measurement. 4 confirmed cases exist (incl. TCMB) but reuse rate in the untested population is unknown.
3. **Capability 5 (Language Coverage)** reclassified to **INCONCLUSIVE; confirmed gaps exist, prevalence unknown**. 50% UNKNOWN language means the 1-source-per-language observations are lower-bound only.

**Survey completion vs. survey validity for decision**:
- Execution completeness: 32/32 (100%)
- Measurement completeness: 15/32 (46.9%)
- Decision sufficiency: **NO**

This document:
- Reports the survey execution results honestly, including the 53% INCONCLUSIVE limitation and the stratum-based heuristic protocol deviation
- Does NOT apply the evaluation matrix (per user directive)
- Does NOT promote any capability to BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC
- Does NOT modify any frozen artifact (v2 framework, Queue, Contract, Commercial Model)
- Is valid as **evidence-gathering artifact** but NOT as **basis for capability roadmap decisions**

The next step is Follow-up Survey V1.1 (per user recommendation): same sample, re-run only INCONCLUSIVE sources, perform actual content inspection for Event-Model, do not re-sample.

---

## 10. Document Provenance

| Field | Value |
|-------|-------|
| Author | main (Super Z) |
| Date | 2026-08-15 |
| Branch | `top20-prescreening` |
| Base commits | `2e33039` (Survey Protocol V1 corrected, APPROVED) → this commit (Survey Results V1) |
| Random seed | 20260815 |
| Sample size | 32 sources (stratified by exact B1-B9 institutional_class from Global Source Universe v1) |
| Untested population | 149 sources (178 Universe minus 29 already-tested) |
| Execution mode | Single-pass per source; static fetch + language detection + (if needed) Playwright rendering |
| Per-source data | `survey_data.jsonl` (32 entries) |
| Summary data | `survey_results_summary.json` |
| Selection script | `/home/z/my-project/scripts/capability_survey_select.py` |
| Execution script | `/home/z/my-project/scripts/capability_survey_execute.py` |
| Deduplication script | `/home/z/my-project/scripts/capability_survey_dedupe.py` |
| Limitations | 53.1% INCONCLUSIVE rate (URL-fetch failures); stratum-based intelligence-type heuristic (PROTOCOL DEVIATION from required content inspection); 50% UNKNOWN language rate |
| Validity | Evidence-gathering artifact ONLY — NOT valid as basis for BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC promotion (per user review of 2ac5d04) |
| Does NOT modify | v2 framework, Queue V1.1, pipeline code, source_configs.py, Contract, Commercial Model, website, Portfolio V1 classifications |

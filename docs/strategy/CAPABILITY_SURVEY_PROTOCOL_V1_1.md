# Capability Survey Follow-up Protocol V1.1

**Date**: 2026-08-15
**Branch**: `top20-prescreening`
**Status**: V1.1 — DRAFT FOR USER RATIFICATION
**Type**: Follow-up survey methodology — NOT a survey execution. Defines HOW to re-run, not the results.
**Base**: Capability Survey Protocol V1 (corrected at `2e33039`, APPROVED) + Capability Survey Results V1 (corrected at `e2479fb`, INCONCLUSIVE)

---

## 1. Purpose

Per user review of `2ac5d04` (Capability Survey Results V1):

> **الـsurvey ناجح كعملية جمع أدلة، لكنه غير صالح بعد لاتخاذ قرارات BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC.**

V1 produced three critical problems:
1. Capability 6 (Event-Model) used stratum-based heuristic, not content inspection — protocol deviation.
2. Browser Rendering has 53% INCONCLUSIVE — 9.4% confirmed rate is a floor estimate.
3. Language Coverage has 50% UNKNOWN language — 1-source-per-language is a lower-bound observation.

V1.1 addresses these problems by:
- **Preserving the same original sample** (32 sources, seed=20260815) — no re-sampling.
- **Re-running only the INCONCLUSIVE sources** (17 sources from V1) with improved URL discovery.
- **Performing actual content inspection for Event-Model** (Capability 6) per protocol Section 4.3.

The goal: produce a **comparable second pass** — same sample, higher measurement completeness, with the question actually measured.

---

## 2. What This Protocol Does NOT Do

- Does NOT execute any survey.
- Does NOT re-sample or replace sources. The original 32-source sample (seed=20260815) is preserved.
- Does NOT modify the v2 qualification framework.
- Does NOT modify GLOBAL_QUALIFICATION_QUEUE_V1 / V1.1.
- Does NOT modify the Capability Gap Portfolio's classifications.
- Does NOT commit to BUILD NOW for any capability.
- Does NOT apply the evaluation matrix (per user directive — V1 results are INCONCLUSIVE).
- Does NOT probe any source (no HTTP requests, no Playwright, no content inspection) until ratified.

---

## 3. V1.1 Scope

### 3.1 Sources to re-run

The 17 INCONCLUSIVE sources from V1 (preserved in `survey_data.jsonl`):

| # | Stratum | Institution | Country | V1 classification |
|---|---------|-------------|---------|-------------------|
| 3 | B1 | People's Bank of China | CN | INCONCLUSIVE |
| 4 | B1 | Bank of Korea | KR | INCONCLUSIVE |
| 5 | B1 | South African Reserve Bank | ZA | INCONCLUSIVE |
| 6 | B1 | Banco de España | ES | INCONCLUSIVE |
| 8 | B1 | Central Bank of the UAE | AE | INCONCLUSIVE |
| 9 | B2 | SEC Philippines | PH | INCONCLUSIVE |
| 12 | B2 | Federal Financial Supervisory Authority (BaFin) | DE | INCONCLUSIVE |
| 13 | B2 | NCUA | US | INCONCLUSIVE |
| 14 | B2 | AMF (France) | FR | INCONCLUSIVE |
| 16 | B3 | DANE (Colombia) | CO | INCONCLUSIVE |
| 18 | B3 | CBS (Netherlands) | NL | INCONCLUSIVE |
| 21 | B4 | Ministère de l'Économie (France) | FR | INCONCLUSIVE |
| 22 | B4 | Department of Finance (Canada) | CA | INCONCLUSIVE |
| 25 | B6 | China Investment Corporation | CN | INCONCLUSIVE |
| 29 | B7 | G20 | INT | INCONCLUSIVE |
| 30 | B8 | SEDAR+ (Canada) | CA | INCONCLUSIVE |
| 31 | B8 | SGXNET (Singapore) | SG | INCONCLUSIVE |

**Total**: 17 sources to re-run with improved URL discovery.

### 3.2 Sources NOT re-run (already measured)

The 15 sources from V1 that produced a usable measurement (8 STATIC_SUFFICIENT + 3 BROWSER_RENDERED + 4 SPARSE_CONTENT) are NOT re-run. Their V1 results are preserved as final.

### 3.3 Content inspection scope (NEW in V1.1)

For Capability 6 (Event-Model), V1.1 adds content inspection:
- For each of the 32 sources (including the 15 already-measured), V1.1 fetches up to 3 documents from the source's content path and classifies intelligence type from titles/summaries.
- This replaces the stratum-based heuristic that V1 used (protocol deviation).
- The content inspection is performed even for sources already classified STATIC_SUFFICIENT — because V1 did not inspect content for any source.

This means V1.1 has TWO measurement passes per source:
1. **Browser Rendering + Language** (V1 measurements, re-run only for INCONCLUSIVE sources)
2. **Event-Model content inspection** (NEW in V1.1, run for ALL 32 sources)

---

## 4. URL Discovery Improvement

V1 failed for 17/32 sources because the candidate URL heuristics (e.g., `/en/press-releases`, `/news`, `/releases`) didn't match the actual paths used by those institutions.

V1.1 introduces a **two-stage URL discovery**:

### Stage 1: Crawl the homepage

For each INCONCLUSIVE source, fetch the homepage (base URL from `INSTITUTION_URLS` mapping). Parse all `<a href>` URLs in the homepage. Filter for URLs that look like content paths:
- URL contains one of: `press`, `release`, `news`, `announcement`, `publication`, `communique`, `bulletin`, `notice`, `statement`, `media`, `communications`
- URL is on the same domain as the homepage (not external)
- URL path depth ≥ 1 (not just the root)

### Stage 2: Probe candidate content paths (with semantic relevance guard)

For each candidate URL found in Stage 1, attempt static fetch. If successful (HTTP 200, > 1000 bytes), the candidate is eligible for selection.

**Semantic relevance guard (mandatory before tie-break by volume):** If multiple candidates succeed, document-URL count is a **secondary** criterion. The selected path must FIRST be plausibly relevant to an institutional intelligence type (e.g., for a central bank: monetary policy decisions, statistical releases, regulatory enforcement; for a Ministry of Finance: fiscal policy, financial coordination; for a market infrastructure: market structure). Volume alone MUST NOT determine path selection.

This guard prevents repeating the US Treasury / RBI content-path mismatch observed earlier: the most voluminous path is not necessarily the correct path for the target intelligence type.

**Selection procedure**:
1. Identify which candidates are semantically relevant to the source's institutional intelligence type (per `institutional_class` from the sample manifest).
2. Among the semantically-relevant candidates, pick the one with the highest document-URL count.
3. If no candidate is semantically relevant, mark the source as INCONCLUSIVE (do NOT fall back to volume-only selection).

### Stage 3: Playwright fallback (for URL discovery only — does NOT classify as BROWSER_RENDERED)

If no Stage 2 candidate succeeds, attempt Playwright rendering of the homepage to discover additional candidate URLs (some sites have JS-rendered navigation).

**CRITICAL RULE — Discovery vs Ingestion Distinction:**

> Use of Playwright for URL discovery does NOT classify the source as BROWSER_RENDERED. A source is classified as BROWSER_RENDERED only when the **selected content path itself** exposes the target document URLs or document content only after browser rendering — i.e., the static fetch of the selected content path produces ≤3 document URLs AND the Playwright-rendered fetch of that SAME content path exposes ≥5 target documents that were absent from the static HTML.

This distinction is essential because the survey measures **platform capability** (does ingestion require browser rendering?), not whether Playwright is used as a discovery tool. A source whose homepage requires Playwright to discover content paths — but whose selected content path is statically fetchable — is NOT BROWSER_RENDERED.

### Stage 4: Final classification

If all stages fail (no candidate URL succeeds statically AND no Playwright-discovered URL succeeds statically), the source is recorded as INCONCLUSIVE again — but this is expected to be rarer than V1 due to the homepage-crawl strategy.

If the selected content path produces ≤3 document URLs statically, then a Playwright render of the **selected content path** (not the homepage) is performed to determine BROWSER_RENDERED classification per the rule in Stage 3.

---

## 5. Content Inspection for Event-Model (NEW in V1.1)

Per protocol V1 Section 4.3 (which V1 deviated from):

> Sample 1-3 document titles + summaries from the source's content path. Classify the intelligence type into one of these categories:
> - `monetary_policy` (covered)
> - `regulatory_enforcement` (covered)
> - `statistical_release` (covered)
> - `earnings_release` (covered)
> - `sanctions_designation` (covered)
> - `market_statistic_release` (covered)
> - `fiscal_policy` (UNCOVERED)
> - `financial_coordination` (UNCOVERED)
> - `prudential_supervision` (UNCOVERED)
> - `trade_compliance` (UNCOVERED)
> - `consumer_protection` (UNCOVERED)
> - `market_structure` (UNCOVERED)
> - `other` (UNCOVERED)

### V1.1 measurement protocol per source (for Event-Model):

1. Use the "selected content path" (from V1 results if already measured, or from V1.1 URL discovery if V1-INCONCLUSIVE).
2. Extract up to 3 document URLs from that content path (use the document-URL heuristic from V1).
3. For each of the 3 document URLs, fetch the document page (static fetch; if fails, Playwright fallback).
4. Extract the document title (`<title>` tag) and first 500 chars of body text.
5. Classify the intelligence type from title + summary, using the categories above.
6. Record the classification per document.

### Per-source Event-Model classification:

A source may produce multiple intelligence types. The classification is the SET of types observed across the 3 sampled documents. If a source produces only one type (e.g., all 3 documents are monetary_policy), the source is classified as producing that single type.

If the 3 sampled documents produce different types, the source is classified as producing all observed types (e.g., `monetary_policy + statistical_release`).

If 0 documents can be fetched (content path has no document URLs), the source is recorded as INCONCLUSIVE for Event-Model.

---

## 6. Output Artifacts (After V1.1 Execution — NOT in this commit)

After V1.1 is executed (after ratification), the following artifacts will be produced:

1. **`docs/evidence/capability_survey/survey_data_v1_1.jsonl`** — per-source raw data for V1.1, including:
   - The 17 re-run sources with improved URL discovery results
   - The 32 sources with content inspection results (Event-Model)
   - All V1 fields preserved for sources not re-run

2. **`docs/evidence/capability_survey/CAPABILITY_SURVEY_RESULTS_V1_1.md`** — the V1.1 results report:
   - Updated per-source table (32 sources × all V1 fields + Event-Model content inspection)
   - Per-capability findings with V1.1 measurements
   - Predefined-band routing (re-applied with V1.1 data)
   - Comparison: V1 vs V1.1 measurement completeness
   - Matrix inputs (if measurement completeness reaches acceptable threshold)
   - Anti-overclaiming statements

3. **`docs/evidence/capability_survey/survey_results_summary_v1_1.json`** — aggregate counts.

4. **Update to `CAPABILITY_GAP_PORTFOLIO_V1.md`** — promoted to V1.1 (or V2) ONLY if measurement completeness reaches acceptable threshold AND user applies the evaluation matrix. The classifications are updated per the user's matrix decisions.

---

## 7. Decision Sufficiency Threshold

Per user directive:

> **لا نطبّق الـevaluation matrix الآن.**

The matrix is NOT applied in V1.1 unless measurement completeness reaches an acceptable threshold.

### V1.1 decision sufficiency criteria

The matrix may be applied after V1.1 if ALL of the following are true:

1. **Browser Rendering measurement completeness**: ≥80% of the 32 sources produce a definitive classification (STATIC_SUFFICIENT, BROWSER_RENDERED, or SPARSE_CONTENT — NOT INCONCLUSIVE).

2. **Language measurement completeness**: ≥80% of the 32 sources have a detected primary language (NOT unknown).

3. **Event-Model measurement completeness**: ≥80% of the 32 sources have at least 1 document fetched and classified (NOT INCONCLUSIVE).

If any of these thresholds is NOT met, the corresponding capability remains INCONCLUSIVE and the matrix is NOT applied for that capability.

### If thresholds are met

If all three thresholds are met, the predefined-band routing is re-applied with V1.1 data:
- Browser Rendering: ≥30% confirmed → BUILD NOW candidate; 10-30% → ENGINEERING CANDIDATE; <10% → CUSTOMER-SPECIFIC; 0 observed → no evidence of reuse
- Language: ≥3 sources per language with no English → BUILD NOW candidate; 1-2 → ENGINEERING CANDIDATE; 0 → no evidence
- Event-Model: ≥5 sources per uncovered type → BUILD NOW candidate; 2-4 → ENGINEERING CANDIDATE; 1 → CUSTOMER-SPECIFIC

The matrix (institutional value × reuse × blocked count × risk) is then applied PER CAPABILITY. The matrix produces a recommendation. The user makes the final BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC call.

### If thresholds are NOT met

If any threshold is not met, the corresponding capability remains INCONCLUSIVE. A third survey pass (V1.2) or a different survey strategy may be needed.

---

## 8. Anti-Overclaiming Rules (Carried Forward from V1)

The V1.1 execution artifact MUST NOT:
- Claim "X% of all 178 sources" — the survey covers the untested population sample, not the full Universe.
- Claim statistical prevalence in the 178-source Universe from n=32. The sample is for capability prioritization, not population estimation.
- Promote any capability to BUILD NOW without the user's matrix evaluation.
- Compare the survey count to the confirmed cases in the Portfolio (the confirmed cases are NOT a random sample).
- Use the word "outlier" for sources that don't match the survey pattern.
- Update the Commercial Model. The commercial promise stands unchanged until the user explicitly authorizes a Commercial Model update.
- Claim V1.1 results are valid as decision basis if measurement completeness thresholds are not met.

---

## 9. Survey Execution Discipline (Carried Forward from V1)

### 9.1 Single-pass execution

V1.1 is executed in a single pass per source. Each source is analyzed once; the per-capability measurements are answered from the same fetch + content inspection.

### 9.2 Reproducibility

- The same random seed (20260815) is used for the V1 sample — V1.1 does NOT introduce a new seed.
- The per-source data (HTTP probe results, HTML samples, document samples, language detection, intelligence type classification) is saved as JSONL for re-analysis.
- The V1.1 execution artifact is committed under `docs/evidence/capability_survey/`.

### 9.3 Surveyor discipline

- The surveyor does NOT remediate any source during the survey. The survey is evidence-gathering only.
- The surveyor does NOT modify `source_configs.py`, pipeline code, the v2 framework, the Queue, or the Commercial Model.
- If a V1.1 source remains INCONCLUSIVE after all URL discovery stages, it is recorded as "INCONCLUSIVE (V1.1 re-run failed)" and NOT replaced.
- If the surveyor identifies a NEW capability gap not in the Portfolio, it is recorded as an "observed outlier" (lower-case 'o' — this is a new gap, NOT a TCMB-class source) — NOT promoted to a new capability card without user review.

---

## 10. What This Protocol Needs From the User

Before any V1.1 execution:

1. **Ratify the scope** (Section 3): re-run 17 INCONCLUSIVE sources + content inspection for all 32 sources.
2. **Ratify the URL discovery strategy** (Section 4): two-stage homepage crawl + content-path probe + Playwright fallback.
3. **Ratify the content inspection protocol** (Section 5): 3 documents per source, classify from title + first 500 chars.
4. **Ratify the decision sufficiency thresholds** (Section 7): ≥80% measurement completeness per capability before matrix application.
5. **Ratify the anti-overclaiming rules** (Section 8): carried forward from V1.

After ratification, the next step is V1.1 execution per Section 6.

---

## 11. What This Protocol Does NOT Pre-Decide

- Does NOT pre-decide the V1.1 results. The thresholds in Section 7 are decision-sufficiency criteria, not conclusions.
- Does NOT pre-decide the matrix recommendations. The matrix inputs come from V1.1 execution.
- Does NOT pre-decide the per-capability BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC classification. The user makes the final call.
- Does NOT pre-decide that any capability will be built. Even if V1.1 shows high reuse, the user may defer for strategic reasons.
- Does NOT pre-decide that measurement completeness will reach ≥80%. V1.1 may still produce INCONCLUSIVE sources if URL discovery fails.

---

## 12. Document Status

**CAPABILITY_SURVEY_PROTOCOL_V1_1 — FROZEN / READY FOR EXECUTION**

Per user review of `7dba672` (CONDITIONAL APPROVAL), two documentation-only corrections have been applied:

1. **Discovery vs Ingestion Distinction (Section 4, Stage 3)**: Use of Playwright for URL discovery does NOT classify a source as BROWSER_RENDERED. A source is classified as BROWSER_RENDERED only when the **selected content path itself** exposes target documents only after browser rendering. This protects the survey's purpose: measuring platform capability (ingestion requirement), not Playwright-as-tool usage.

2. **Semantic relevance guard for content-path selection (Section 4, Stage 2)**: When multiple candidate content paths succeed, document-URL count is a SECONDARY criterion. The selected path must FIRST be plausibly relevant to the source's institutional intelligence type (per `institutional_class`). Volume alone MUST NOT determine path selection. This prevents repeating the US Treasury / RBI content-path mismatch (most voluminous path ≠ correct path for target intelligence type).

All other V1.1 design elements preserved unchanged:
- Same 32-source sample (seed=20260815) — no re-sampling
- Re-run only 17 INCONCLUSIVE sources for Browser Rendering + Language
- Content inspection (NEW) for ALL 32 sources for Event-Model
- Decision sufficiency thresholds (≥80% measurement completeness per capability before matrix application)
- Anti-overclaiming rules carried forward from V1
- Surveyor discipline carried forward from V1

Final status: **FROZEN / READY FOR EXECUTION.**

The user has approved execution of V1.1 on the same 32 sources only. V1.1 execution can proceed per Section 6.

---

## 13. Document Provenance

| Field | Value |
|-------|-------|
| Author | main (Super Z) |
| Date | 2026-08-15 |
| Branch | `top20-prescreening` |
| Base commits | `2e33039` (Survey Protocol V1 corrected) → `2ac5d04` (Survey Results V1) → `e2479fb` (Survey Results V1 corrected) → `7dba672` (Survey Protocol V1.1 initial) → this commit (Survey Protocol V1.1 corrected / FROZEN) |
| Depends on | Capability Survey Protocol V1 (corrected at `2e33039`) + Capability Survey Results V1 (corrected at `e2479fb`) |
| Sample | SAME as V1 (32 sources, seed=20260815) — NOT re-sampled |
| Status | FROZEN / READY FOR EXECUTION (per user CONDITIONAL APPROVAL) |
| Does NOT modify | v2 framework, Queue V1.1, pipeline code, source_configs.py, Contract, Commercial Model, website, Portfolio V1 classifications, Capability Survey Results V1 |

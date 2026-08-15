# Capability Survey Protocol V1

**Date**: 2026-08-15
**Branch**: `top20-prescreening`
**Status**: V1 — DRAFT FOR USER RATIFICATION
**Type**: Survey methodology — NOT a survey execution. Defines HOW to survey, not the survey results.
**Base**: CAPABILITY_GAP_PORTFOLIO_V1 (corrected at `bace0e2`)

---

## 1. Purpose

This protocol defines the methodology for surveying the Global Source Universe (178 records) to produce defensible evidence for the three engineering candidates identified in `CAPABILITY_GAP_PORTFOLIO_V1`:

1. **Adapter / Browser Rendering** (Capability 4) — TCMB confirmed; reuse UNKNOWN
2. **Language / Multilingual Coverage** (Capability 5) — INSEE confirmed; count unverified
3. **Event-Model Representation** (Capability 6) — Bundesbank/FSB/HMT confirmed; uncovered intelligence types uncounted

### Why a protocol BEFORE execution?

The user's directive:

> لا أبدأ survey للـ178 مصدراً بالكامل مباشرةً. قبل ذلك نحتاج Survey Design v1 يحدد كيف نأخذ عينة قابلة لل Defense عنها من الـUniverse بدل أن نقوم بـ178 HTTP probes بلا إطار، خصوصاً أن السؤال ليس فقط "هل يحتاج Browser؟" بل: هل هناك **reuse-adjusted platform value** كافية لبناء capability عامة؟

This protocol addresses three failure modes that 178 unframed HTTP probes would produce:

1. **Selection bias**: probing all 178 sources without sampling criteria produces "count of HTTP behaviors" — not "estimate of platform value". A source returning a 200 with rich static HTML tells us nothing about whether similar sources need browser rendering.
2. **Wrong question**: "does this source need browser rendering?" is a narrow technical question. The strategic question is: "if we build browser rendering, how many blocked sources would it unblock AND how many of those are strategically valuable?"
3. **No evidence threshold**: without pre-defined thresholds for BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC, any count becomes subject to post-hoc rationalization. The thresholds must be set BEFORE seeing the data.

---

## 2. What This Protocol Does NOT Do

- Does NOT execute any survey.
- Does NOT modify the v2 qualification framework.
- Does NOT modify GLOBAL_QUALIFICATION_QUEUE_V1 / V1.1.
- Does NOT modify the Capability Gap Portfolio's classifications.
- Does NOT commit to BUILD NOW for any capability.
- Does NOT probe any source (no HTTP requests, no Playwright, no content inspection).

---

## 3. Survey Strategy

### 3.1 Sampling Frame

The Global Source Universe contains 178 records. Probing all 178 is:
- Expensive (178 HTTP probes + per-capability analysis per source)
- Strategically wrong (the question is "platform value", not "individual source behavior")

**Sampling strategy: Stratified random sample.**

Stratify by `institutional_class` (the exact field defined in Global Source Universe v1) to ensure the sample represents the class distribution of the Universe. Random selection within each stratum avoids selection bias.

**Sample size target**: 30 sources (≈17% of the Universe). This is a **pragmatic evidence-gathering sample, not a statistically powered estimate of the 178-source universe.** No formal population prevalence estimate will be claimed from n=30. The sample is sized for capability prioritization evidence — not for statistical inference about the Universe as a whole. The survey's scope of inference is explicitly limited to the **untested population** (see Section 3.2).

**Stratification**: uses the exact `institutional_class` field from Global Source Universe v1. The 9 institutional classes and their counts (as frozen in `8b1e7b4`) are:

| `institutional_class` | Count in Universe | Sample target |
|---|---|---|
| B1 — Central Banks | 45 | 8 |
| B2 — Financial Regulators | 35 | 7 |
| B3 — Statistical Agencies | 25 | 4 |
| B4 — Ministries of Finance | 16 | 3 |
| B5 — Market Infrastructure | 13 | 2 |
| B6 — Public/Sovereign Institutions | 17 | 3 |
| B7 — Multilateral | 11 | 2 |
| B8 — Disclosure Systems | 10 | 2 |
| B9 — Other Authoritative | 6 | 1 |
| **TOTAL** | **178** | **32** |

Sample targets use proportional allocation (roughly 17% per stratum), rounded up to a minimum floor of 1 source per stratum (to ensure all classes are represented even for the smallest strata). The total sample target is 32 (not exactly 30 — the floor constraint forces a small overshoot). This is acceptable and documented.

No other stratification fields are invented. The protocol uses ONLY the `institutional_class` field from Global Source Universe v1.

### 3.2 Selection Discipline

- Random selection within stratum using a fixed random seed (documented in the survey execution artifact). The seed ensures reproducibility — anyone re-running the selection gets the same sources.
- Sources already Gate 5 tested (BaFin, Eurostat, FED_ENF, ABS, TCMB, US Treasury, RBI, Bundesbank, Banca d'Italia, OCC, SEBI, PRA, INSEE, FSB, UK HM Treasury) are EXCLUDED from the sample — they are already evidence in the Portfolio. Replacing them would inflate the sample with redundant data.
- **The survey estimates evidence within the untested population only.** Previously tested sources remain historical evidence and are excluded from sampling. No population-wide prevalence claim is made for the full 178. The survey's scope of inference is the untested population (178 minus the ~15 already-tested sources ≈ 163 untested sources).
- If a selected source is KNOWN_BLOCKED (Queue state), it is recorded as "inconclusive (access blocked)" and is NOT replaced. The sample is NOT re-padded for blocked sources — this would bias the sample toward accessible sources. The classification accounts for inconclusive cases explicitly (see Section 4).

### 3.3 What Is Recorded Per Source

For each sampled source, the survey records:

| Field | Purpose |
|-------|---------|
| Source code | Identity |
| Stratum | Sampling stratum |
| Primary URL | The source's main website |
| Selected content path | The specific path being surveyed (RSS feed URL, HTML index URL, or PDF URL) — typically the source's main press releases / announcements path |
| HTTP probe result | Static fetch (urllib) — HTTP status, content length, content type |
| Static HTML document-URL count | Count of `<a href>` URLs in static HTML that point to individual documents (press releases, statistical releases, etc.) |
| Browser-rendered document-URL count | (If static count is low) Playwright-rendered HTML document-URL count |
| Primary language | Detected language of static HTML content (en, fr, de, it, es, pt, ja, zh, ko, ar, tr, etc.) |
| English version available | YES / NO / partial |
| Intelligence types observed | Categorical tags (monetary_policy, regulatory_enforcement, statistical, fiscal_policy, financial_coordination, sanctions, earnings, market_structure, other) |
| Covered by existing event type | YES / NO (which existing event type fits, or NONE) |

---

## 4. Per-Capability Survey Questions

### 4.1 Capability 4 — Adapter / Browser Rendering

**Primary question**: Within the untested population sample, how many sources return a navigation skeleton via static HTTP (low document-URL count in static HTML) but expose document URLs after browser rendering?

**Measurement protocol per source**:
1. Fetch the selected content path via `urllib` (static).
2. Count document-URL candidates in the static HTML. A "document-URL candidate" is an `<a href>` whose anchor text or URL path suggests an individual target document (a specific press release, statistical release, enforcement action, etc.) — NOT a navigation link (not "About", "Contact", "Press Releases" section page, etc.).
3. If static count ≤ 3, fetch the same path via Playwright (rendered) and wait for `networkidle` plus a brief fixed delay.
4. Count document-URL candidates in the rendered HTML using the same heuristic.
5. **Measurement validity rule**: the rendered document URLs must correspond to the same selected content path and represent individual target documents. If the rendered HTML merely exposes additional navigation links (e.g., mega-menu expansion) rather than individual target documents, the source is NOT classified as Browser-rendered. A source is Browser-rendered ONLY when rendered HTML exposes individual target documents that were absent from the static HTML.
6. Classification:
   - **Static-sufficient**: static count ≥ 5 → browser rendering NOT required
   - **Browser-rendered**: static count ≤ 3 AND rendered count ≥ 5 (with the measurement-validity rule satisfied) → browser rendering required
   - **Sparse-content**: static count ≤ 3 AND rendered count ≤ 3 (or rendered URLs are navigation-only) → likely wrong content path; route to CONTENT-PATH REVIEW (not a browser-rendering case)
   - **Inconclusive**: cannot determine (e.g., JS errors, timeouts, KNOWN_BLOCKED) → mark inconclusive

**Predefined prioritization bands** (triage rules, NOT empirically calibrated breakpoints):
- If the sample shows ≥30% of sources are Browser-rendered → capability has HIGH platform value → BUILD NOW candidate (subject to engineering risk review)
- If the sample shows 10-30% are Browser-rendered → capability has MEDIUM platform value → ENGINEERING CANDIDATE (defer; re-evaluate after customer demand signals)
- If the sample shows <10% are Browser-rendered → capability has LOW platform value → CUSTOMER-SPECIFIC (build per-customer when a specific customer requests a browser-rendered source)
- If 0 Browser-rendered sources are observed → **no evidence of reuse in the sampled population**; the capability is not justified by this survey. TCMB remains a single confirmed case; the survey provides no additional evidence for or against the capability.

These bands are predefined prioritization bands / triage rules, not empirically calibrated breakpoints. They guide the matrix evaluation but do not bind the user's decision.

**Important caveats**:
- A source being Browser-rendered does NOT mean it is strategically valuable. The count is necessary but not sufficient.
- Apply the user's evaluation matrix AFTER the count: institutional value × reuse × blocked count × risk.
- Even ≥30% requires the user's matrix evaluation before BUILD NOW.
- The bands do NOT claim statistical prevalence in the 178-source Universe. They describe observed evidence within the untested-population sample.

### 4.2 Capability 5 — Language / Multilingual Coverage

**Primary question**: What is the verified distribution of primary languages across the Global Source Universe, and how many sources per language would a per-language pattern library unlock?

**Measurement protocol per source**:
1. Fetch the selected content path via `urllib` (static).
2. Detect primary language via HTTP `Content-Language` header, `<html lang="...">` attribute, and/or language detection on a sample of body text.
3. Check for an English version: look for an `/en/` path, a language switcher link, or an English RSS feed.
4. Record: primary language, English version availability.

**Predefined prioritization bands** (per language — triage rules, NOT empirically calibrated breakpoints):
- ≥3 sources publishing in language X with NO English version → building a language-X pattern library has HIGH platform value → BUILD NOW candidate (subject to global expansion roadmap priority)
- 1-2 sources publishing in language X with NO English version → MEDIUM platform value → ENGINEERING CANDIDATE (defer; bundle with adjacent language libraries if a customer requests)
- 0 sources in language X with NO English version observed → **no evidence of reuse for language X in the sampled population**; language X is not justified by this survey (most non-English sources may have an English version, in which case Capability 5 is not the gap)

These bands are predefined prioritization bands / triage rules, not empirically calibrated breakpoints.

**Important caveats**:
- Sources with an English version are NOT counted as language-coverage gaps (they can be onboarded via English patterns, possibly with Capability 3 authoring for non-US English phrasing).
- The "≥3 sources" threshold is per-language, not aggregate. A French library unlocking INSEE + Banque de France + AMF is BUILD NOW candidate; an Arabic library unlocking 1 source is CUSTOMER-SPECIFIC.
- The strategic value is per-language, not aggregate across all languages.

### 4.3 Capability 6 — Event-Model Representation

**Primary question**: What intelligence types does the Global Source Universe contain that are NOT covered by the 6 existing event types (monetary_policy_decision, regulatory_enforcement, statistical_release, earnings_release, sanctions_designation, market_statistic_release)?

**Measurement protocol per source**:
1. Fetch the selected content path via `urllib` (static).
2. Sample 1-3 document titles + summaries from the source's content path.
3. Classify the intelligence type into one of these categories:
   - `monetary_policy` (covered)
   - `regulatory_enforcement` (covered)
   - `statistical_release` (covered)
   - `earnings_release` (covered)
   - `sanctions_designation` (covered)
   - `market_statistic_release` (covered)
   - `fiscal_policy` (UNCOVERED — government budget, taxation, fiscal guidance)
   - `financial_coordination` (UNCOVERED — FSB, BIS, IMF coordination / standard-setting)
   - `prudential_supervision` (UNCOVERED — supervisory letters, banking oversight)
   - `trade_compliance` (UNCOVERED — export controls, trade sanctions compliance)
   - `consumer_protection` (UNCOVERED — consumer warnings, product interventions)
   - `market_structure` (UNCOVERED — market structure reports, competition assessments)
   - `other` (UNCOVERED — document for review)

**Predefined prioritization bands** (per uncovered intelligence type — triage rules, NOT empirically calibrated breakpoints):
- ≥5 sources producing intelligence type Y with no existing event type fits → building event type Y has HIGH platform value → BUILD NOW candidate (subject to global expansion roadmap priority)
- 2-4 sources producing intelligence type Y with no existing event type fits → MEDIUM platform value → ENGINEERING CANDIDATE (defer; bundle with adjacent event types if a customer requests)
- 1 source producing intelligence type Y with no existing event type fits → LOW platform value → CUSTOMER-SPECIFIC
- 0 sources producing intelligence type Y observed → **no evidence of reuse for event type Y in the sampled population**; event type Y is not justified by this survey

These bands are predefined prioritization bands / triage rules, not empirically calibrated breakpoints.

**Important caveats**:
- A source producing uncovered intelligence type Y does NOT mean Y should be built. The count is necessary but not sufficient.
- Sources producing MIXED content (some covered, some uncovered) are counted only for the uncovered type they would unlock — building event type Y unlocks only the Y-intelligence portion of that source.
- Per the user's discipline: do NOT auto-promote any single uncovered type to BUILD NOW.

---

## 5. Evaluation Matrix Application

After the three surveys are executed (per this protocol, after ratification), the user's evaluation matrix is applied PER CAPABILITY:

```
Institutional value (HIGH / MEDIUM / LOW)
× Reuse potential (sample-derived estimate)
× Number of blocked sources likely solved (sample-derived count)
× Implementation risk (HIGH / MEDIUM / LOW)
```

The matrix produces a recommendation: BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC.

### Per-capability matrix inputs

| Capability | Institutional value | Reuse potential | Blocked source count | Implementation risk |
|------------|---------------------|------------------|----------------------|----------------------|
| 4 — Adapter / Browser Rendering | HIGH if applies to G20 economies; LOW if applies to obscure sources | From sample (Capability 4 survey) | From sample (Capability 4 survey) | MEDIUM (Playwright already a dependency; throughput risk) |
| 5 — Language / Multilingual Coverage | HIGH if applies to prioritized jurisdictions (EU, JP, CN) | From sample (Capability 5 survey, per language) | From sample (Capability 5 survey, per language) | MEDIUM-HIGH (linguistic + pattern authoring; substantial) |
| 6 — Event-Model Representation | HIGH for fiscal/coordination (G7 coverage); MEDIUM for prudential | From sample (Capability 6 survey, per type) | From sample (Capability 6 survey, per type) | MEDIUM per event type (~10 lines detector + pattern library) |

### What the matrix does NOT decide automatically

- The matrix is a recommendation, not a binding decision. The user makes the final BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC call.
- The matrix does NOT override strategic priorities (e.g., if a customer explicitly requests a source that needs browser rendering, CUSTOMER-SPECIFIC may be promoted to BUILD NOW for that customer regardless of the sample count).
- The matrix does NOT commit to a sequence. Even if all three capabilities are BUILD NOW, they are sequenced by separate strategic priority, not by the matrix score.

---

## 6. Survey Execution Discipline

### 6.1 Single-pass execution

The three surveys are executed in a single pass over the 30-source sample. Each sampled source is analyzed once; the per-capability survey questions are answered from the same fetch + analysis. This avoids redundant HTTP traffic and ensures consistency.

### 6.2 Reproducibility

- The random seed used for sampling is recorded in the survey execution artifact.
- The per-source data (HTTP probe results, HTML samples, language detection, intelligence type classification) is saved as JSONL for re-analysis.
- The survey execution artifact is committed to the repo under `docs/evidence/capability_survey/`.

### 6.3 Surveyor discipline

- The surveyor does NOT remediate any source during the survey. The survey is evidence-gathering only.
- The surveyor does NOT modify `source_configs.py`, pipeline code, the v2 framework, the Queue, or the Commercial Model.
- If a sampled source is KNOWN_BLOCKED during the survey, it is recorded as "inconclusive (access blocked)" and the analysis continues with the next source. The sample is NOT re-padded for blocked sources (this would bias the sample toward accessible sources).
- If the surveyor identifies a NEW capability gap not in the Portfolio, it is recorded as an "observed outlier" — NOT promoted to a new capability card without user review.

### 6.4 Anti-overclaiming

The survey execution artifact MUST NOT:
- Claim "X% of all sources" (the survey covers the untested population sample, not the full 178-source Universe — claim "X of N sampled sources in the untested population" with the explicit N).
- Claim statistical prevalence in the 178-source Universe from n=30. The sample is for capability prioritization, not for population estimation.
- Promote any capability to BUILD NOW without the user's matrix evaluation.
- Compare the survey count to the confirmed cases in the Portfolio (the confirmed cases are NOT a random sample — they are sources selected for specific strategic reasons).
- Use the word "outlier" for sources that don't match the survey pattern. A single confirmed case (e.g., TCMB) with 0 additional survey evidence is "no evidence of reuse in the sampled population", NOT "TCMB is an outlier".
- Update the Commercial Model. The commercial promise stands unchanged until the user explicitly authorizes a Commercial Model update.

---

## 7. Output Artifacts (After Survey Execution — NOT in this commit)

After the survey is executed per this protocol (after ratification), the following artifacts will be produced:

1. **`docs/evidence/capability_survey/SURVEY_EXECUTION_V1.md`** — the survey execution report:
   - Random seed used
   - 30-source sample (with stratum, code, URL, all per-source fields from Section 3.3)
   - Per-capability aggregate counts
   - Per-capability classification per the thresholds in Section 4
   - Anti-overclaiming statement

2. **`docs/evidence/capability_survey/survey_data.jsonl`** — the per-source raw data (for re-analysis).

3. **`docs/evidence/capability_survey/SURVEY_EVALUATION_V1.md`** — the matrix evaluation:
   - Per-capability matrix application (institutional value × reuse × blocked count × risk)
   - Per-capability recommendation (BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC)
   - Rationale per capability
   - **This artifact is DRAFT FOR USER RATIFICATION — the user makes the final decision.**

4. **Update to `CAPABILITY_GAP_PORTFOLIO_V1.md`** — promoted to `CAPABILITY_GAP_PORTFOLIO_V1.1.md` (or V2) with the survey-derived evidence replacing the "UNKNOWN — needs survey" placeholders. The classifications are updated per the user's matrix decisions.

---

## 8. What This Protocol Needs From the User

Before any survey execution:

1. **Ratify the sampling strategy** (Section 3): is stratified random sample of ~32 sources (using the exact `institutional_class` field from Global Source Universe v1, with minimum floor of 1 per stratum) correct, or should the sample size / stratification be different?
2. **Ratify the per-capability survey questions** (Section 4): are the measurements correct, are the measurement-validity rules (especially for Browser Rendering — Section 4.1 step 5) defensible, and are the predefined prioritization bands reasonable as triage rules?
3. **Ratify the evaluation matrix application** (Section 5): is the matrix correctly structured, and are the per-capability inputs correct?
4. **Ratify the survey execution discipline** (Section 6): are the anti-overclaiming rules and reproducibility requirements correct?

After ratification, the next step is survey execution per Section 7.

---

## 9. What This Protocol Does NOT Pre-Decide

- Does NOT pre-decide the survey results. The predefined prioritization bands in Section 4 are triage rules, not conclusions.
- Does NOT pre-decide the matrix recommendations. The matrix inputs in Section 5 are placeholders — actual values come from the survey.
- Does NOT pre-decide the per-capability BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC classification. The user makes the final call after the matrix evaluation.
- Does NOT pre-decide that any capability will be built. Even if the survey shows high reuse, the user may defer for strategic reasons (e.g., focus on customer-acquisition before platform-expansion).
- Does NOT pre-decide the sequence of capability work. Three BUILD NOW capabilities are NOT three parallel workstreams — they are sequenced by separate strategic priority.
- Does NOT claim statistical prevalence in the 178-source Universe. The sample is for capability prioritization, not population estimation.

---

## 10. Document Status

**CAPABILITY_SURVEY_PROTOCOL_V1 — CORRECTED DRAFT FOR RATIFICATION**

Per user review of `6f421ea`, five methodological corrections have been applied:

1. **Removed statistical claims** (95% CI, ±15/18% margin of error). The protocol now explicitly states that n=30 is a **pragmatic evidence-gathering sample, not a statistically powered population estimate**. No formal prevalence claim is made from n=30.

2. **Stratification aligned to Global Source Universe v1**. The protocol now uses the exact `institutional_class` field from Global Source Universe v1 (frozen at `8b1e7b4`), with the exact counts (B1=45, B2=35, B3=25, B4=16, B5=13, B6=17, B7=11, B8=10, B9=6, TOTAL=178). No invented strata. Sample target = 32 (proportional allocation with minimum floor of 1 per stratum).

3. **Survey scope of inference explicitly limited**. Previously tested sources are excluded from sampling; the survey estimates evidence within the **untested population only** (178 − ~15 already-tested sources ≈ 163 sources). No population-wide prevalence claim is made for the full 178.

4. **Threshold language corrected**. All thresholds renamed to **predefined prioritization bands / triage rules, not empirically calibrated breakpoints**. "0% → TCMB is an outlier" replaced with **"0 observed → no evidence of reuse in the sampled population"**. The word "outlier" is explicitly forbidden in the anti-overclaiming rules.

5. **Browser-rendering measurement validity rule added** (Section 4.1, step 5). The rendered document URLs must correspond to the same selected content path AND represent individual target documents — not merely additional navigation links. This prevents measuring navigation expansion rather than browser-required content.

Final status: the protocol is methodologically sound. The evaluation matrix remains a recommendation only; the final BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC decision remains the user's manual call.

The user is asked to ratify or override the corrected protocol design. Once ratified, survey execution can proceed per Section 7.

---

## 11. Document Provenance

| Field | Value |
|-------|-------|
| Author | main (Super Z) |
| Date | 2026-08-15 |
| Branch | `top20-prescreening` |
| Base commits | `9e0733c` (Portfolio V1 initial) → `bace0e2` (Portfolio V1 corrected) → `6f421ea` (Survey Protocol V1 initial) → this commit (Survey Protocol V1 corrected) |
| Depends on | CAPABILITY_GAP_PORTFOLIO_V1 (corrected at `bace0e2`) — three engineering candidates (Capabilities 4, 5, 6) AND Global Source Universe v1 (frozen at `8b1e7b4`) — exact `institutional_class` field and counts |
| Does NOT modify | v2 framework, Queue V1.1, pipeline code, source_configs.py, Contract, Commercial Model, website, Portfolio V1 classifications |

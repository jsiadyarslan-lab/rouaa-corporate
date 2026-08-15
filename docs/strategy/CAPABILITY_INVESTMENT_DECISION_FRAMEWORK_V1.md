# Capability Investment Decision Framework V1

**Date**: 2026-08-15
**Branch**: `top20-prescreening`
**Status**: V1 — FROZEN (framework ratified by user)
**Type**: Strategy framework — decision framework, NOT a decision machine. Does NOT modify any frozen artifact.
**Base**:
- Capability Evidence Registry V1 (FROZEN at `dd66cc1`)
- Global Source Universe V1 (INTEGRITY CLEARED at `8b1e7b4`)
- Commercial Source Qualification Model v1/v2 evidence
- Capability Investment Framework Design Constraints V1 (FROZEN at `bb3f43a`)

---

## 1. Purpose

This framework is a **decision framework**, not an automated decision machine. It organizes the evidence and decision inputs for each capability so that the product/investment owner can make an explicit, manual investment decision.

Per the FROZEN design constraints (`bb3f43a`):

> **Investment Decision Ready does not mean BUILD NOW.** It means the evidence and decision inputs are sufficient for an explicit investment decision by the product/investment owner.

The framework produces per-capability Decision Readiness assignments, evidence gaps, required additional evidence, and recommended next actions. The user makes the final call.

---

## 2. Mandatory Rules Applied

The following 9 rules from the FROZEN design constraints (`bb3f43a`) are applied throughout this framework:

1. Do not use confirmed-case count as prevalence.
2. Do not convert Coverage into a percentage.
3. Do not use Evidence Confidence as an independent weighting dimension (it is a derived reporting field).
4. Do not aggregate Evidence Strength using MAX (use Evidence Profile / Distribution).
5. Keep Evidence Strength and Resolution Status separate (independent axes).
6. Use the canonical name **Configuration Contract Compatibility** (not "Configuration Contract", not "Contract Compatibility").
7. Do not create numerical Decision-Readiness thresholds; calibration is an explicit Open Design Gap.
8. Strategic Value may prioritize capabilities within the same decision level, but may not promote weak evidence to a higher level.
9. Do not make automatic BUILD NOW decisions.

**Additional rules applied per user review of `9450647` (CORRECTED DRAFT)**:

10. **Evidence State ≠ Remediation Applicability**: Evidence Strength measures epistemic confidence; Resolution Status measures what happened with remediation. A case that does not need remediation (e.g., a positive compatibility case like SNB, or a boundary routing outcome like ESMA) is `NOT APPLICABLE` for Resolution Status — it is NOT `UNTESTED`. `UNTESTED` means remediation was applicable but not attempted.
11. **Coverage labels are qualitative descriptors only** — NOT calibrated thresholds. Labels like `Limited`, `Moderate`, `Very limited` are descriptive judgments under the uncalibrated framework; they do NOT imply a numerical standard.
12. **Customer demand triggers manual re-evaluation, not automatic promotion**. A confirmed customer demand signal may materially change the Decision Layer and trigger a manual re-evaluation of Decision Readiness — but it does NOT automatically promote a capability to a higher decision level.
13. **Line-count implementation estimates are NOT investment inputs**. Engineering Cost/Risk is expressed as a qualitative level (LOW/MEDIUM/HIGH) with implementation options noted as detail; actual production cost/risk is `UNCALIBRATED` until separately assessed.
14. **All Decision Readiness classifications are provisional** under the uncalibrated framework. They represent the current manual classification based on available evidence — NOT a predictive or calibrated assessment.

**Decision ladder** (per `bb3f43a` Section 6):

```text
NO INVESTMENT DECISION
EVIDENCE-ONLY
CUSTOMER-SPECIFIC
INVESTMENT CANDIDATE
INVESTMENT DECISION READY
```

**Resolution Status scale** (per this corrected framework — separated from Evidence Strength):

```text
NOT APPLICABLE          — remediation not needed (positive case, boundary routing outcome, or no boundary observed)
UNTESTED                — remediation was applicable but not attempted
CONFIG-ONLY REMEDIATION VALIDATED — remediation attempted AND succeeded via config-only change
ENGINEERING REQUIRED    — remediation attempted AND failed because engineering required
ENGINEERING REMEDIATION VALIDATED — engineering work executed AND succeeded
```

**Coverage label rule** (per correction #4):

> Coverage labels (Limited / Moderate / Very limited / Broad / UNKNOWN) are qualitative descriptors only until Decision-Readiness Calibration is separately established. They do NOT represent calibrated thresholds.

---

## 3. Per-Capability Framework

Each capability is documented with the 15-field structure:

```text
Capability
Evidence Profile
Resolution Profile
Evidence Coverage
Evidence Diversity
Derived Evidence Confidence
Decision Layer (Strategic Value, Reuse Potential, Engineering Cost/Risk, Strategic Alignment)
Decision Readiness
Evidence gaps
Required additional evidence
Recommended next action
```

---

### Capability 1 — Provenance Metadata Compatibility

**Evidence Profile**:
```text
Level 0 (HYPOTHESIS):                0
Level 1 (OBSERVED):                  2 (ESMA — boundary; BaFin — provenance-positive/compatibility)
Level 2 (VALIDATED):                 0
Level 3 (HIGH-CONFIDENCE VALIDATED): 1 (SNB — independent validation review `332788c`)
Total confirmed cases:               3
Highest evidence state observed:     HIGH-CONFIDENCE VALIDATED (descriptive only)
```

**Resolution Profile**:
```text
NOT APPLICABLE:                                    3 (ESMA — boundary routing outcome, no remediation needed; SNB — positive case, no remediation needed; BaFin — provenance-positive/compatibility, remediation attributed to Capability 7)
UNTESTED:                                          0
CONFIG-ONLY REMEDIATION VALIDATED:                 0
ENGINEERING REQUIRED:                              0
ENGINEERING REMEDIATION VALIDATED:                 0
Total confirmed cases:                             3
```

**Evidence Coverage**: Limited *(qualitative descriptor — NOT a calibrated threshold)*. 3 confirmed cases; universe prevalence unknown. substantial portion of the Global Source Universe remains unmeasured; universe prevalence UNKNOWN.

**Evidence Diversity**: Moderate.
- Distinct institutions: 3 (ESMA, SNB, BaFin)
- Distinct institutional classes: 2 (B1 central bank — SNB; B2 financial regulator — ESMA, BaFin)
- Distinct geographies: 3 (CH, EU, DE)
- Distinct intelligence types: N/A (provenance is cross-cutting)
- Independent validation reviews: 1 (SNB — `332788c`)

**Derived Evidence Confidence**: High. SNB provides HIGH-CONFIDENCE VALIDATED evidence with independent review; ESMA provides a confirmed boundary case; BaFin provides a provenance-positive/compatibility case. The boundary (ESMA) and positive path (SNB) are both documented.

**Decision Layer**:
- **Strategic Value**: MEDIUM. Provenance is foundational for evidence chains (every IO requires a provenance chain). However, Gate 2 is already operational — this capability does not need investment.
- **Reuse Potential**: LOW for additional engineering. Gate 2 already handles the cases observed.
- **Engineering Cost/Risk**: LOW (none needed — already operational).
- **Strategic Alignment**: Foundational capability for all sources; cross-cutting.

**Decision Readiness**: `EVIDENCE-ONLY`

Evidence is strong (HIGH-CONFIDENCE VALIDATED + confirmed boundary + positive case), and the capability is already operational (Gate 2). No investment decision is warranted — the capability works as designed. The ESMA boundary is a known routing outcome, not an engineering gap.

**Evidence gaps**:
- Whether browser-rendered sources (TCMB-class) have different date metadata in rendered vs static HTML — UNTESTED (subsumed under Capability 4, not a separate provenance gap).
- Whether sources with non-standard date formats would fail Gate 2 — plausible but no confirmed case beyond ESMA.

**Required additional evidence**: None for platform engineering. The capability is operational. If a future source fails Gate 2 with a non-standard date format, that would be a new evidence case — but no engineering decision is pending.

**Recommended next action**: NONE. Capability is already operational. No investment decision needed.

---

### Capability 2 — Content-Path Boundary

**Evidence Profile**:
```text
Level 0 (HYPOTHESIS):                0
Level 1 (OBSERVED):                  0
Level 2 (VALIDATED):                 8 (US Treasury, RBI, SEBI, PRA — mismatches; BaFin, Eurostat, FED_ENF, ABS — aligned)
Level 3 (HIGH-CONFIDENCE VALIDATED): 0
Total confirmed cases:               8
Highest evidence state observed:     VALIDATED (descriptive only)
```

Note: ABS passed Content-Path Alignment in the prospective v2 run — its content-path was aligned. ABS is VALIDATED for Content-Path Boundary. ABS's untested remediation for Pattern Specificity (Capability 3) does NOT affect its Evidence Strength for Content-Path (Capability 2). Evidence State for one capability does not transfer to or from another.

**Resolution Profile**:
```text
NOT APPLICABLE:                                    8 (all — 4 mismatches are routing outcomes, no remediation needed; 4 aligned cases have no boundary to remediate)
UNTESTED:                                          0
CONFIG-ONLY REMEDIATION VALIDATED:                 0
ENGINEERING REQUIRED:                              0
ENGINEERING REMEDIATION VALIDATED:                 0
Total confirmed cases:                             8
```

**Evidence Coverage**: Moderate *(qualitative descriptor — NOT a calibrated threshold)*. 8 confirmed cases across 4 mismatches + 4 aligned; universe prevalence unknown. substantial portion of the Global Source Universe remains unmeasured; universe prevalence UNKNOWN.

**Evidence Diversity**: Moderate.
- Distinct institutions: 8 (US Treasury, RBI, SEBI, PRA, BaFin, Eurostat, FED_ENF, ABS)
- Distinct institutional classes: 4 (B1, B2, B3, B4)
- Distinct geographies: 6+ (US, IN, INT, UK, DE, EU, AU)
- Distinct intelligence types: 4 (sanctions_designation, monetary_policy_decision, regulatory_enforcement, statistical_release)
- Independent validation reviews: 0

**Derived Evidence Confidence**: High. 8 VALIDATED cases across 4 institutional classes and 4 intelligence types. The v2 Content-Path Alignment stage is the most validated component of the v2 framework.

**Decision Layer**:
- **Strategic Value**: HIGH. Content-path qualification prevents wasted Gate 5 attempts. Universal pre-Gate-5 check.
- **Reuse Potential**: HIGH (universal — every source has multiple paths).
- **Engineering Cost/Risk**: LOW (none needed — already operational as v2 SQR stage).
- **Strategic Alignment**: Cross-cutting; applies to all sources.

**Decision Readiness**: `EVIDENCE-ONLY`

Evidence is strong (8 VALIDATED, 4 institutional classes). The capability is already operational as the v2 Content-Path Alignment stage. No investment decision is warranted.

**Evidence gaps**:
- Whether the v2 stage produces false negatives (aligned paths that actually contain mixed content) — no confirmed false negative.
- Whether "up to 3 representative documents" sampling is sufficient for all source types — no confirmed under-sampling case.

**Required additional evidence**: None for platform engineering. The capability is operational.

**Recommended next action**: NONE. Capability is already operational. No investment decision needed.

---

### Capability 3 — Pattern Specificity

**Evidence Profile**:
```text
Level 0 (HYPOTHESIS):                1 (ABS — untested hypothesis for Pattern Specificity; ABS's content-path was aligned but its pattern-content match was not tested)
Level 1 (OBSERVED):                  0
Level 2 (VALIDATED):                 1 (FED_ENF — remediation test confirmed the pattern-specificity boundary)
Level 3 (HIGH-CONFIDENCE VALIDATED): 0
Confirmed evidence cases:            1 (FED_ENF)
Hypothesis cases (NOT counted as evidence): 1 (ABS)
Highest evidence state observed:     VALIDATED (descriptive only — FED_ENF)
```

**Resolution Profile**:
```text
NOT APPLICABLE:                                    0
UNTESTED:                                          1 (ABS — remediation applicable but not attempted; hypothesis, not yet confirmed as a boundary)
CONFIG-ONLY REMEDIATION VALIDATED:                 1 (FED_ENF — `f16bc00`)
ENGINEERING REQUIRED:                              0
ENGINEERING REMEDIATION VALIDATED:                 0
Total confirmed evidence cases:                   1
```

**Evidence Coverage**: Very limited *(qualitative descriptor — NOT a calibrated threshold)*. 1 confirmed evidence case (FED_ENF); universe prevalence unknown. ABS is a hypothesis — NOT counted as evidence.

**Evidence Diversity**: Narrow.
- Distinct institutions: 2 (Federal Reserve, ABS)
- Distinct institutional classes: 2 (B2 financial regulator, B3 statistical agency)
- Distinct geographies: 2 (US, AU)
- Distinct intelligence types: 2 (regulatory_enforcement, statistical_release)
- Independent validation reviews: 0

**Derived Evidence Confidence**: High for FED_ENF only. The FED_ENF case provides VALIDATED evidence with CONFIG-ONLY REMEDIATION VALIDATED. ABS is a HYPOTHESIS — not counted as evidence.

**Decision Layer**:
- **Strategic Value**: MEDIUM. Reduces remediation cycles but doesn't change the product boundary. Pattern specificity is a Gate 5 root-cause category, not a platform engineering candidate.
- **Reuse Potential**: MEDIUM per source (each source has its own phrasing). The remediation pattern (refine patterns, re-run Gate 5) is reusable. The Phase B diagnostic script can serve as a pre-flight tool.
- **Engineering Cost/Risk**: LOW for platform engineering (none needed). Utility-script work if pre-flight tooling is desired.
- **Strategic Alignment**: Operational onboarding authoring capability.

**Decision Readiness**: `EVIDENCE-ONLY`

Evidence is strong for FED_ENF (VALIDATED + CONFIG-ONLY REMEDIATION VALIDATED). The capability is already operational — pattern refinement is a source-configuration authoring task, not a platform engineering task. No investment decision is warranted.

**Evidence gaps**:
- Whether ABS follows the same config-only remediation pattern as FED_ENF — UNVERIFIED (hypothesis, not tested).
- How many future sources will hit content-regex specificity gaps — no quantitative estimate possible.

**Required additional evidence**: ABS remediation test would confirm/deny the config-only pattern. More onboarding attempts would quantify frequency. Neither is required for a platform investment decision — this capability is operational.

**Recommended next action**: NONE for platform engineering. When a source hits this gap, apply the config-only remediation pattern (as proven by FED_ENF). Optionally, build pattern-authoring tooling as a utility script — but this is not a platform investment.

---

### Capability 4 — Adapter / Browser Rendering

**Evidence Profile**:
```text
Level 0 (HYPOTHESIS):                0
Level 1 (OBSERVED):                  0
Level 2 (VALIDATED):                 4 (TCMB, NSO India, Basel Committee, EIOPA)
Level 3 (HIGH-CONFIDENCE VALIDATED): 0
Total confirmed cases:               4
Highest evidence state observed:     VALIDATED (descriptive only)
```

**Resolution Profile**:
```text
NOT APPLICABLE:                                    3 (NSO India, Basel Committee, EIOPA — validated boundary, no remediation attempted; these are positive observations of the gap, not cases requiring remediation)
UNTESTED:                                          0
CONFIG-ONLY REMEDIATION VALIDATED:                 0
ENGINEERING REQUIRED:                              1 (TCMB — `04289d2`, `45bbd88`)
ENGINEERING REMEDIATION VALIDATED:                 0
Total confirmed cases:                             4
```

**Evidence Coverage**: Very limited *(qualitative descriptor — NOT a calibrated threshold)*. 4 confirmed cases; universe prevalence UNKNOWN. substantial portion of the Global Source Universe remains unmeasured; universe prevalence UNKNOWN (survey V1.1 measurement completeness was insufficient — see Survey Results V1.1).

**Evidence Diversity**: Broad.
- Distinct institutions: 4 (TCMB, NSO India, Basel Committee, EIOPA)
- Distinct institutional classes: 4 (B1 central bank, B3 statistical agency, B7 multilateral, B9 other authoritative)
- Distinct geographies: 4 (TR, IN, INT, EU)
- Distinct intelligence types: 4 (monetary_policy, statistical_release, financial_coordination, regulatory_enforcement)
- Independent validation reviews: 0

**Derived Evidence Confidence**: High for existence. 4 VALIDATED cases confirm the capability gap exists. However, coverage is very limited — prevalence in the untested population is UNKNOWN.

**Decision Layer**:
- **Strategic Value**: HIGH if applies to G20 economies; UNKNOWN for broader source universe.
- **Reuse Potential**: UNKNOWN / HYPOTHESIS. Building the capability would solve 4 confirmed cases. Whether it would unlock more sources is unknown — the survey could not measure prevalence.
- **Engineering Cost/Risk**: MEDIUM. Known implementation options exist (`force_browser` config flag; `html_index_js` feed_format — see Registry for detail). Actual production cost/risk: UNCALIBRATED — line-count estimates from the TCMB diagnostic are implementation detail, NOT investment inputs. Risk factors: throughput drop for browser-rendered sources; reproducibility may vary with timing.
- **Strategic Alignment**: Global expansion (Turkey, India, multilateral institutions). Customer demand signals for one of the 4 confirmed sources would create strategic alignment.

**Decision Readiness**: `INVESTMENT CANDIDATE`

Evidence supports considering the capability for platform investment. The gap is real (4 VALIDATED cases across 4 institutional classes, 4 geographies, 4 intelligence types — broad diversity). TCMB provides ENGINEERING REQUIRED evidence (config-only cannot resolve). HOWEVER, Evidence Coverage is very limited (prevalence UNKNOWN), and no customer demand signal has been received for any of the 4 confirmed sources. Strategic Value cannot promote this to INVESTMENT DECISION READY.

**Evidence gaps**:
- Prevalence in the untested population — UNKNOWN and cannot be reliably measured from this execution environment.
- Whether the 4 confirmed cases are outliers or representative — UNKNOWN.
- Whether WebSphere Portal CMS (used by TCMB) is also used by other central banks — unverified hypothesis.
- Whether modern SPA-heavy bank/regulator websites require browser rendering — unverified hypothesis.

**Required additional evidence** (to change decision level):
- **Customer demand signal**: A confirmed customer demand signal for TCMB (or NSO India, Basel Committee, EIOPA) may materially change the Decision Layer and trigger a manual re-evaluation of Decision Readiness — but does NOT automatically promote the capability to a higher level.
- **Manual URL discovery per source**: A human-curated survey of the untested population (V1.2 with manual URL discovery) could estimate prevalence — but this is NOT recommended with the automated approach (per user directive: V1.2 universe survey NOT RECOMMENDED).
- **Different execution environment**: A survey from an environment with unrestricted network access could reduce the 53% INCONCLUSIVE rate and provide a prevalence estimate.

**Recommended next action**: WAIT for customer demand signal OR strategic priority for one of the 4 confirmed sources. If TCMB or another confirmed case is requested, a manual re-evaluation of Decision Readiness would be triggered — engineering work may then be authorized. Do NOT build the capability speculatively.

---

### Capability 5 — Language / Multilingual Boundary

**Evidence Profile**:
```text
Level 0 (HYPOTHESIS):                0
Level 1 (OBSERVED):                  7 (INSEE, Banca d'Italia, FSO, BaFin, Saudi MoF, CBS Netherlands, CSRC)
Level 2 (VALIDATED):                 0
Level 3 (HIGH-CONFIDENCE VALIDATED): 0
Total confirmed cases:               7
Highest evidence state observed:     OBSERVED (descriptive only)
```

Note: Banco Central do Brasil is non-English observed but NOT a confirmed gap (English version = YES). It is excluded from the confirmed gap count.

**Resolution Profile**:
```text
NOT APPLICABLE:                                    0
UNTESTED:                                          7 (all — remediation applicable but not attempted; no per-language pattern library built)
CONFIG-ONLY REMEDIATION VALIDATED:                 0
ENGINEERING REQUIRED:                              0
ENGINEERING REMEDIATION VALIDATED:                 0
Total confirmed cases:                             7
```

**Evidence Coverage**: Very limited *(qualitative descriptor — NOT a calibrated threshold)*. 7 confirmed gaps across 6 languages; universe prevalence UNKNOWN. 53.1% of V1.1 sources had UNKNOWN language — actual non-English count likely higher.

**Evidence Diversity**: Broad.
- Distinct institutions: 7 (INSEE, Banca d'Italia, FSO, BaFin, Saudi MoF, CBS Netherlands, CSRC)
- Distinct institutional classes: 3 (B1 central bank, B2 financial regulator, B3 statistical agency, B4 ministry of finance)
- Distinct geographies: 6+ (FR, IT, CH, DE, SA, NL, CN)
- Distinct intelligence types: 3 (statistical_release, regulatory_enforcement, fiscal_policy)
- Distinct languages: 6 (French, Italian, German, Arabic, Dutch, Chinese)
- Independent validation reviews: 0

**Derived Evidence Confidence**: High for confirmed gaps. 7 OBSERVED cases across 6 languages confirm the gap exists. However, all cases are at OBSERVED level (no VALIDATED or remediation-tested cases). The gap is real but the remediation approach (per-language pattern library) is untested.

**Decision Layer**:
- **Strategic Value**: HIGH if ROUAA's market includes non-English-speaking jurisdictions (which it does — global expansion is the strategic frame).
- **Reuse Potential**: UNKNOWN / HYPOTHESIS. Building a per-language pattern library for any specific language would unlock the confirmed-gap sources in that language. Broader reuse is unknown.
- **Engineering Cost/Risk**: MEDIUM-HIGH. Per-language pattern libraries require linguistic expertise + substantial pattern authoring. HTML index keyword filter internationalization is a known implementation option (small code change + per-source config data — see Registry for detail). Actual production cost/risk: UNCALIBRATED.
- **Strategic Alignment**: Global expansion roadmap (EU, China, Middle East). Customer demand for a specific jurisdiction would create strategic alignment.

**Decision Readiness**: `INVESTMENT CANDIDATE`

Evidence supports considering the capability for platform investment. 7 confirmed gaps across 6 languages with broad institutional, geographic, and linguistic diversity. HOWEVER, Evidence Coverage is very limited (prevalence UNKNOWN), all cases are at OBSERVED level (no remediation-tested), and no strategic priority for a specific jurisdiction has been established. Strategic Value cannot promote this to INVESTMENT DECISION READY.

**Evidence gaps**:
- Prevalence in the untested population — UNKNOWN (V1.1 language detection was insufficient — see Survey Results V1.1).
- Which jurisdictions are prioritized for global expansion — strategic decision, not measurement.
- Whether sources with an English version can be onboarded via English patterns + Capability 3 authoring — likely YES but unverified.
- Whether building any single language library unlocks enough sources to justify the work — UNKNOWN.

**Required additional evidence** (to change decision level):
- **Global expansion roadmap decision** prioritizing a specific jurisdiction (e.g., EU, China, Middle East) may materially change the Decision Layer and trigger a manual re-evaluation of Decision Readiness for that language — but does NOT automatically promote to a higher level.
- **Customer demand signal** for a non-English source may trigger a manual re-evaluation.
- **Remediation test**: A per-language pattern library for one language (e.g., French for INSEE) would provide REMEDIATION-VALIDATED evidence, strengthening the case for that language.

**Recommended next action**: WAIT for global expansion roadmap decision or customer demand signal for a specific jurisdiction. When a jurisdiction is prioritized, the corresponding language library becomes a BUILD NOW candidate for that language only. Do NOT build all 6 language libraries speculatively.

---

### Capability 6 — Event-Model Representation

**Evidence Profile** (Confirmed Representation Gaps):
```text
Level 0 (HYPOTHESIS):                0
Level 1 (OBSERVED):                  0
Level 2 (VALIDATED):                 3 (Bundesbank, FSB, UK HM Treasury — independently verified via v2 contract/semantic)
Level 3 (HIGH-CONFIDENCE VALIDATED): 0
Total confirmed representation gaps: 3
```

**Evidence Profile** (Observed Potentially Uncovered Intelligence Types):
```text
Level 0 (HYPOTHESIS):                0
Level 1 (OBSERVED):                  4 (Bangladesh Bank, Central Bank of Egypt, CBS Netherlands, Basel Committee — V1.1 content inspection only)
Level 2 (VALIDATED):                 0
Level 3 (HIGH-CONFIDENCE VALIDATED): 0
Total observed potential types:      4
```

**Combined Evidence Profile**: 3 VALIDATED + 4 OBSERVED = 7 cases (but the 4 OBSERVED are potential, not confirmed representation gaps).

**Resolution Profile** (Confirmed Representation Gaps):
```text
NOT APPLICABLE:                                    0
UNTESTED:                                          3 (Bundesbank, FSB, UK HM Treasury — remediation/extension applicable but not attempted; no new event type built)
CONFIG-ONLY REMEDIATION VALIDATED:                 0
ENGINEERING REQUIRED:                              0
ENGINEERING REMEDIATION VALIDATED:                 0
Total confirmed representation gaps:              3
```

**Resolution Profile** (Observed Potentially Uncovered Intelligence Types):
```text
NOT APPLICABLE / NOT YET ASSESSED:                 4 (Bangladesh Bank, Central Bank of Egypt, CBS Netherlands, Basel Committee — these are content observations from V1.1; applicability as representation gaps has NOT been established because they have not been routed through v2 contract verification. It is NOT established that remediation is applicable — the observation itself is potential, not confirmed.)
UNTESTED:                                          0
CONFIG-ONLY REMEDIATION VALIDATED:                 0
ENGINEERING REQUIRED:                              0
ENGINEERING REMEDIATION VALIDATED:                 0
Total observed potential types:                     4
```

**Critical distinction**: The 4 observed potential types are `NOT APPLICABLE / NOT YET ASSESSED` — NOT `UNTESTED`. `UNTESTED` implies remediation was applicable but not attempted. For the 4 observed potential types, applicability itself has not been established — they may or may not be true representation gaps. Placing them under `UNTESTED` would incorrectly imply that they are confirmed gaps awaiting remediation, when in fact they are content observations that require v2 contract verification to determine whether they are representation gaps at all.

**Evidence Coverage**: Limited *(qualitative descriptor — NOT a calibrated threshold)*. 3 confirmed representation gaps + 4 observed potential types; universe prevalence UNKNOWN. V1.1 content inspection only 28.1% complete.

**Evidence Diversity**: Moderate.
- Distinct institutions: 7 (Bundesbank, FSB, HMT, Bangladesh Bank, Central Bank of Egypt, CBS Netherlands, Basel Committee)
- Distinct institutional classes: 4 (B1, B3, B4, B7)
- Distinct geographies: 5+ (DE, INT, UK, BD, EG, NL)
- Distinct intelligence types: 5 (EUR monetary statistics, financial coordination, fiscal policy, prudential supervision, consumer protection)
- Independent validation reviews: 0

**Derived Evidence Confidence**: High for 3 confirmed representation gaps (VALIDATED via v2 contract/semantic). MEDIUM for 4 observed potential types (OBSERVED via V1.1 content inspection only — not confirmed via v2 contract verification). INSEE is compounded with language gap and is NOT independently confirmed as a representation gap.

**Decision Layer**:
- **Strategic Value**: HIGH for fiscal policy (G7 coverage) and financial coordination (FSB, BIS). MEDIUM for EUR monetary statistics (overlaps with ECB already qualified). MEDIUM for prudential supervision and consumer protection (fewer confirmed cases).
- **Reuse Potential**: UNKNOWN / HYPOTHESIS per event type. Building an event type for one confirmed gap (e.g., fiscal policy) would unlock that source. Broader reuse unknown.
- **Engineering Cost/Risk**: MEDIUM per event type. Known implementation options exist (`EVENT_TYPE_RULES` entry + `PATTERN_TYPE_METADATA` entries + pattern library + SQR template update — see Registry for detail). No core architectural changes — config-driven architecture handles new event types. Actual production cost/risk: UNCALIBRATED.
- **Strategic Alignment**: G7 coverage (fiscal policy), multilateral institutions (financial coordination), EU expansion (EUR monetary statistics).

**Decision Readiness**: `INVESTMENT CANDIDATE`

Evidence supports considering the capability for platform investment. 3 confirmed representation gaps (VALIDATED) + 4 observed potential types (OBSERVED). The gap is real for the 3 confirmed cases. HOWEVER, Evidence Coverage is limited (prevalence UNKNOWN), no strategic priority for a specific event type has been established, and the 4 observed potential types are NOT confirmed (EVIDENCE-INCOMPLETE for those). Strategic Value cannot promote this to INVESTMENT DECISION READY.

**Evidence gaps**:
- Which intelligence types are most prevalent in the untested population — UNKNOWN (V1.1 content inspection only 28.1% complete).
- Whether the 4 observed potential types would become confirmed representation gaps if routed through v2 contract verification — UNKNOWN (not tested).
- Whether the 7 "other" classifications in V1.1 represent new uncovered types or classifier limitations — UNKNOWN.
- Whether Banca d'Italia's EUR-metric issue is the same representation gap as Bundesbank's — UNKNOWN (compounded with Italian language gap; not independently isolated).

**Required additional evidence** (to change decision level):
- **Strategic priority for a specific intelligence type**: A strategic priority for fiscal policy (G7 coverage) or financial coordination (FSB/BIS) may materially change the Decision Layer and trigger a manual re-evaluation of Decision Readiness — but does NOT automatically promote to a higher level.
- **Route 4 observed potential types through v2 contract verification**: Would confirm/deny whether they are true representation gaps. This is a qualification exercise, not a survey.
- **Customer demand signal** for a source that produces an uncovered intelligence type may trigger a manual re-evaluation.

**Recommended next action**: WAIT for strategic priority identifying a specific intelligence type. When prioritized, route the observed potential types through v2 contract verification to confirm, then build the event type for the confirmed case. Do NOT build event types speculatively.

---

### Capability 7 — Configuration Contract Compatibility

**Evidence Profile**:
```text
Level 0 (HYPOTHESIS):                0
Level 1 (OBSERVED):                  0
Level 2 (VALIDATED):                 7 (Bundesbank, Banca d'Italia, FSB, UK HM Treasury — incompatible; BaFin, Eurostat, FED_ENF — compatible/remediated)
Level 3 (HIGH-CONFIDENCE VALIDATED): 0
Total confirmed cases:               7
Highest evidence state observed:     VALIDATED (descriptive only)
```

**Resolution Profile**:
```text
State 0 (UNTESTED):                              6 (Bundesbank, Banca d'Italia, FSB, UK HM Treasury — incompatible, routed to ENGINEERING REVIEW; Eurostat, FED_ENF — compatible, no remediation needed for contract)
State 1 (CONFIG-ONLY REMEDIATION VALIDATED):      1 (BaFin — `bd7285d` + `282de0f`)
State 2 (ENGINEERING REQUIRED):                   0
State 3 (ENGINEERING REMEDIATION VALIDATED):      0
Total confirmed cases:                            7
```

**Evidence Coverage**: Moderate. 7 confirmed cases (4 incompatible + 3 compatible/remediated); universe prevalence unknown. The v2 Configuration Contract Verification stage is validated across multiple cases.

**Evidence Diversity**: Moderate.
- Distinct institutions: 7 (Bundesbank, Banca d'Italia, FSB, UK HM Treasury, BaFin, Eurostat, FED_ENF)
- Distinct institutional classes: 3 (B1, B2, B4, B7)
- Distinct geographies: 5+ (DE, IT, INT, UK, EU, US)
- Distinct intelligence types: 4 (EUR monetary statistics, financial coordination, fiscal policy, regulatory enforcement, statistical release)
- Independent validation reviews: 0

**Derived Evidence Confidence**: High. 7 VALIDATED cases — the v2 Configuration Contract Verification stage is well-validated. The BaFin case provides REMEDIATION-VALIDATED evidence (config-only remediation confirmed root cause was `event_type` misconfiguration, not provenance format).

**Decision Layer**:
- **Strategic Value**: HIGH. Configuration Contract Compatibility is a universal pre-Gate-5 check. Prevents wasted Gate 5 attempts and surfaces event-model gaps early.
- **Reuse Potential**: HIGH (universal — static contract verification applies to all sources).
- **Engineering Cost/Risk**: LOW (none needed — already operational as v2 SQR stage).
- **Strategic Alignment**: Cross-cutting; applies to all sources.

**Decision Readiness**: `EVIDENCE-ONLY`

Evidence is strong (7 VALIDATED cases across multiple institutional classes). The capability is already operational as the v2 Configuration Contract Verification stage. The 4 incompatible cases point to Capability 6 (Event-Model Representation) gaps — those are tracked separately. No investment decision is warranted for Configuration Contract Compatibility itself.

**Evidence gaps**:
- Whether the v2 stage produces false negatives (compatible contracts that actually fail at Gate 5) — no confirmed false negative.
- Whether the static check covers all contract dimensions — appears to, but no systematic review performed.
- Whether the v2 stage should be promoted from SQR-only field to Queue state — operational recommendation deferred.

**Required additional evidence**: None for platform engineering. The capability is operational. The 4 incompatible cases are evidence for Capability 6 (Event-Model Representation), not for Configuration Contract Compatibility itself.

**Recommended next action**: NONE. Capability is already operational. No investment decision needed.

---

## 4. Summary Decision Readiness Table

| # | Capability | Evidence Profile (summary) | Resolution Profile (summary) | Coverage | Diversity | Confidence (derived) | Decision Readiness |
|---|------------|-----------------------------|------------------------------|----------|-----------|---------------------|-------------------|
| 1 | Provenance Metadata Compatibility | 1 HIGH-CONFIDENCE + 2 OBSERVED | 3 UNTESTED | Limited | Moderate | High | `EVIDENCE-ONLY` |
| 2 | Content-Path Boundary | 7 VALIDATED + 1 OBSERVED | 8 UNTESTED | Moderate | Moderate | High | `EVIDENCE-ONLY` |
| 3 | Pattern Specificity | 1 VALIDATED (+ 1 HYPOTHESIS) | 1 UNTESTED + 1 CONFIG-ONLY | Very limited | Narrow | High for FED_ENF only | `EVIDENCE-ONLY` |
| 4 | Adapter / Browser Rendering | 4 VALIDATED | 3 UNTESTED + 1 ENG-REQUIRED | Very limited | Broad | High for existence | `INVESTMENT CANDIDATE` |
| 5 | Language / Multilingual Boundary | 7 OBSERVED | 7 UNTESTED | Very limited | Broad | High for confirmed gaps | `INVESTMENT CANDIDATE` |
| 6 | Event-Model Representation | 3 VALIDATED + 4 OBSERVED | 3 UNTESTED + 4 NOT YET ASSESSED | Limited | Moderate | High for 3 confirmed; MEDIUM for 4 observed | `INVESTMENT CANDIDATE` |
| 7 | Configuration Contract Compatibility | 7 VALIDATED | 6 UNTESTED + 1 CONFIG-ONLY | Moderate | Moderate | High | `EVIDENCE-ONLY` |

**Decision ladder distribution**:
- `EVIDENCE-ONLY`: 4 capabilities (1, 2, 3, 7) — already operational, no investment decision warranted
- `INVESTMENT CANDIDATE`: 3 capabilities (4, 5, 6) — evidence supports considering investment, but coverage insufficient for INVESTMENT DECISION READY
- `INVESTMENT DECISION READY`: 0 capabilities — no capability has sufficient evidence + coverage + strategic priority for an explicit investment decision
- `CUSTOMER-SPECIFIC`: 0 capabilities — no customer demand signal received for any affected source
- `NO INVESTMENT DECISION`: 0 capabilities — all 7 have at least some confirmed evidence

**Critical reminder**: `INVESTMENT DECISION READY` does NOT mean `BUILD NOW`. It means the evidence and decision inputs are sufficient for an explicit investment decision by the product/investment owner. No capability has reached this level yet.

---

## 5. Decision Gaps & Evidence Acquisition Plan

For each capability, this section documents:
- What prevents a stronger decision today
- What additional evidence would change the decision level
- Whether the next evidence should come from new source qualification, remediation testing, customer demand, or commercial validation

### Capability 1 — Provenance Metadata Compatibility

**What prevents a stronger decision today**: Nothing. The capability is already operational. No investment decision is pending.

**What additional evidence would change the decision level**: NONE. The capability is at `EVIDENCE-ONLY` because it is already operational, not because evidence is insufficient. A future source that fails Gate 2 with a non-standard date format would be a new evidence case — but it would not change the decision level (the capability already handles it as a routing outcome).

**Next evidence source**: N/A. No evidence acquisition needed.

### Capability 2 — Content-Path Boundary

**What prevents a stronger decision today**: Nothing. The capability is already operational.

**What additional evidence would change the decision level**: NONE. Already operational.

**Next evidence source**: N/A.

### Capability 3 — Pattern Specificity

**What prevents a stronger decision today**: Nothing. The capability is already operational (config-only authoring). The FED_ENF remediation test proved config-only works. ABS is a hypothesis but does not block any investment decision — when probed, ABS will follow the same remediation pattern.

**What additional evidence would change the decision level**: An ABS remediation test would confirm the config-only pattern. More onboarding attempts would quantify frequency. Neither would promote this to `INVESTMENT CANDIDATE` — pattern specificity is a Gate 5 root-cause category, not a platform engineering candidate.

**Next evidence source**: New source qualification (when ABS or another source hits this gap, apply the config-only remediation pattern).

### Capability 4 — Adapter / Browser Rendering

**What prevents a stronger decision today**:
1. Evidence Coverage is very limited (4 confirmed cases; prevalence UNKNOWN).
2. No customer demand signal for any of the 4 confirmed sources.
3. No strategic priority for browser-rendered ingestion has been established.
4. Reuse Potential is UNKNOWN (survey could not measure prevalence).

**What additional evidence would change the decision level**:
- **Customer demand signal** for TCMB (or NSO India, Basel Committee, EIOPA) → would promote to `CUSTOMER-SPECIFIC` or `INVESTMENT DECISION READY` (for that customer's scope).
- **Manual URL discovery survey** (V1.2 with human-curated paths, NOT automated) → would estimate prevalence; if ≥10 sources need browser rendering, could promote to `INVESTMENT DECISION READY` for platform investment.
- **Different execution environment** (unrestricted network access) → would reduce the 53% INCONCLUSIVE rate and provide a prevalence estimate.

**Next evidence source**: **Customer demand** (highest-value, lowest-cost evidence). If no customer demand materializes, the next evidence would come from **commercial validation** (does any commercial opportunity require one of these 4 sources?).

### Capability 5 — Language / Multilingual Boundary

**What prevents a stronger decision today**:
1. Evidence Coverage is very limited (7 confirmed gaps; prevalence UNKNOWN).
2. No strategic priority for a specific jurisdiction has been established.
3. All cases are at OBSERVED level (no remediation-tested — no per-language pattern library has been built).
4. Reuse Potential is UNKNOWN (whether building one language library unlocks enough sources).

**What additional evidence would change the decision level**:
- **Global expansion roadmap decision** prioritizing a specific jurisdiction (e.g., EU, China, Middle East) → would promote the corresponding language library to `INVESTMENT DECISION READY` for that language.
- **Customer demand signal** for a non-English source → would promote to `CUSTOMER-SPECIFIC`.
- **Remediation test** (build a French pattern library for INSEE) → would provide REMEDIATION-VALIDATED evidence, strengthening the case for French.

**Next evidence source**: **Commercial validation** (global expansion roadmap decision). This is a strategic decision, not a measurement. The evidence acquisition is not "more survey" — it is "which jurisdiction does the business want to expand into?"

### Capability 6 — Event-Model Representation

**What prevents a stronger decision today**:
1. Evidence Coverage is limited (3 confirmed + 4 observed potential; prevalence UNKNOWN).
2. No strategic priority for a specific intelligence type has been established.
3. The 4 observed potential types are NOT confirmed via v2 contract verification.
4. Reuse Potential is UNKNOWN per event type.

**What additional evidence would change the decision level**:
- **Strategic priority** for a specific intelligence type (e.g., fiscal policy for G7 coverage) → would promote the corresponding event type to `INVESTMENT DECISION READY`.
- **Route 4 observed potential types through v2 contract verification** → would confirm/deny whether they are true representation gaps. This is a qualification exercise, not a survey.
- **Customer demand signal** for a source that produces an uncovered intelligence type → would promote to `CUSTOMER-SPECIFIC`.

**Next evidence source**: **New source qualification** (route the 4 observed potential types through v2 contract verification) + **commercial validation** (which intelligence type is strategically prioritized?). The qualification exercise is low-cost and would convert 4 OBSERVED cases to either VALIDATED or rejected.

### Capability 7 — Configuration Contract Compatibility

**What prevents a stronger decision today**: Nothing. The capability is already operational.

**What additional evidence would change the decision level**: NONE. Already operational.

**Next evidence source**: N/A.

---

## 6. Strategic Synthesis

### What this framework establishes

1. **4 capabilities are already operational** (1, 2, 3, 7) — no investment decision is warranted. These capabilities work as designed.

2. **3 capabilities are INVESTMENT CANDIDATES** (4, 5, 6) — evidence supports considering platform investment, but:
   - Evidence Coverage is insufficient for `INVESTMENT DECISION READY` (prevalence UNKNOWN for all 3).
   - No customer demand signal has been received for any affected source.
   - No strategic priority has been established for any specific dimension (browser rendering, language, event type).
   - Strategic Value cannot promote weak evidence to a higher decision level.

3. **0 capabilities are at `INVESTMENT DECISION READY`** — no capability has sufficient evidence + coverage + strategic priority for an explicit investment decision. This is the correct state: the framework prevents premature BUILD NOW decisions.

### What this framework does NOT do

- Does NOT make BUILD NOW decisions.
- Does NOT prioritize the 3 INVESTMENT CANDIDATES against each other (that requires strategic context not available in the evidence).
- Does NOT establish numerical decision-readiness thresholds (Open Design Gap per `bb3f43a` Section 9).
- Does NOT modify any frozen artifact.

### The decision the user needs to make

The user (as product/investment owner) needs to decide:

1. **For Capability 4 (Browser Rendering)**: Is there a customer or strategic priority that requires one of the 4 confirmed sources (TCMB, NSO India, Basel Committee, EIOPA)? If yes → authorize engineering work (~10-25 lines). If no → wait.

2. **For Capability 5 (Language)**: Which jurisdiction does the business want to expand into? If a specific jurisdiction is prioritized → authorize the corresponding language library. If none → wait.

3. **For Capability 6 (Event-Model)**: Is there a strategic priority for a specific intelligence type (fiscal policy, financial coordination, EUR monetary)? If yes → authorize the corresponding event type. If none → route the 4 observed potential types through v2 contract verification (low-cost qualification exercise) and wait.

These are **strategic decisions**, not evidence decisions. The evidence is documented; the strategic context is the user's to provide.

---

## 7. Open Design Gap (Carried Forward)

**Decision-Readiness Calibration** — per `bb3f43a` Section 9:

> No fixed number of cases, coverage band, geography count, or institutional-class count is currently authorized as a transition threshold. Thresholds will be designed explicitly in a later calibration step after sufficient decision evidence exists.

This framework applies the Open Design Gap by:
- Assigning Decision Readiness levels based on qualitative assessment of Evidence Profile + Coverage + Diversity + Decision Layer.
- NOT using numerical thresholds (e.g., "≥5 cases → INVESTMENT CANDIDATE").
- Documenting the rationale for each Decision Readiness assignment in the per-capability sections.
- Leaving threshold calibration for a future step after the framework has been applied to real investment decisions.

---

## 8. Document Status

**CAPABILITY_INVESTMENT_DECISION_FRAMEWORK_V1 — FROZEN.**

Per user review of `c59d04d` (READY FOR FREEZE), one final data-reconciliation correction has been applied, then the framework has been FROZEN.

**Final correction — denominator reconciliation**:
All references to a specific untested-source count (`149 untested sources`) have been replaced with the non-numeric statement: "substantial portion of the Global Source Universe remains unmeasured; universe prevalence UNKNOWN." This prevents an undocumented denominator from being embedded in the framework's Coverage descriptions. No denominator is invented or inferred.

**Cumulative corrections across the framework's evolution** (10 total):
1. Evidence State separated from Remediation Applicability (NOT APPLICABLE added) — per `2e964df`
2. ABS reclassified (Content-Path = VALIDATED; Pattern Specificity = HYPOTHESIS) — per `2e964df`
3. NOT APPLICABLE in Resolution Profile — per `2e964df`
4. Coverage labels = qualitative descriptors — per `2e964df`
5. Customer demand → manual re-evaluation (not automatic promotion) — per `2e964df`
6. Line-count estimates → UNCALIBRATED cost/risk language — per `2e964df`
7. Decision Readiness = provisional — per `2e964df`
8. HYPOTHESIS excluded from confirmed-case counts (Capability 3) — per `c59d04d`
9. Resolution applicability separated for confirmed gaps vs observed potential types (Capability 6) — per `c59d04d`
10. Intelligence type count corrected (Capability 2: 3 → 4) — per `c59d04d`
11. **Denominator reconciliation: undocumented `149` replaced with non-numeric statement (this commit)**

**Final status: Capability Investment Decision Framework V1 — FROZEN.**

Per user directive: "جمّد الإطار. لا أريد دورة تصحيحات تصميمية إضافية."

This framework:
- Applies the 6 FROZEN design constraints from `bb3f43a`.
- Documents 7 capabilities with the 15-field structure.
- Assigns Decision Readiness levels (provisional): 4 `EVIDENCE-ONLY` + 3 `INVESTMENT CANDIDATE` + 0 `INVESTMENT DECISION READY`.
- Does NOT make BUILD NOW decisions.
- Does NOT establish numerical decision-readiness thresholds (Open Design Gap).
- Does NOT modify any frozen artifact.

The user is asked to:
1. Review the corrected per-capability Decision Readiness assignments (provisional).
2. Confirm the Decision Gaps & Evidence Acquisition Plan (Section 5).
3. Provide strategic context for the 3 INVESTMENT CANDIDATES (customer demand, global expansion roadmap, intelligence type priority) — or confirm that no strategic priority exists yet.
4. Decide whether to authorize any engineering work based on the framework + strategic context.

---

## 9. Document Provenance

| Field | Value |
|-------|-------|
| Author | main (Super Z) |
| Date | 2026-08-15 |
| Branch | `top20-prescreening` |
| Status | FROZEN |
| Type | Strategy framework — decision framework, NOT a decision machine |
| Inputs | Capability Evidence Registry V1 (FROZEN `dd66cc1`); Global Source Universe V1 (`8b1e7b4`); Commercial Source Qualification Model v1/v2; Design Constraints V1 (FROZEN `bb3f43a`) |
| Does NOT modify | Registry, Design Constraints, Portfolio, Queue, Qualification v2, pipeline, config, Contract, Commercial Model, website |
| Decision Readiness distribution (provisional) | 4 EVIDENCE-ONLY + 3 INVESTMENT CANDIDATE + 0 INVESTMENT DECISION READY |
| Open Design Gap | Decision-Readiness Calibration (no numerical thresholds) |
| Next step | User reviews framework, provides strategic context, decides whether to authorize engineering work |

# Capability Investment Framework — Design Constraints V1

**Date**: 2026-08-15
**Branch**: `top20-prescreening`
**Status**: V1 — MANDATORY DESIGN CONSTRAINTS (must be satisfied before building the framework itself)
**Type**: Design constraint document — NOT the framework. Does NOT modify any frozen artifact.
**Purpose**: Establish the mandatory design rules that must govern the Capability Investment Decision Framework before that framework is built.

---

## 1. Why This Document Exists

Per user directive, the next phase is NOT a direct BUILD NOW decision. The next phase is to build a **Capability Investment Decision Framework** that decides which capabilities deserve investment.

However, before that framework can be built, **mandatory design constraints** must be established. These constraints prevent the framework from repeating the methodological errors of the quantitative survey approach (V1 + V1.1) — specifically, the error of treating case count as a proxy for evidence strength, and the error of treating coverage as a prevalence percentage.

This document is **not the framework**. It is the set of rules the framework must satisfy.

---

## 2. The Core Problem This Solves

The Capability Evidence Registry V1 (FROZEN at `dd66cc1`) documents confirmed evidence cases. Without design constraints, the next framework could commit two errors:

1. **Case-count weighting**: treating `4 Browser Rendering cases > 3 Provenance cases` as automatically higher investment priority. This is wrong because:
   - 4 cases of mixed evidence strength (1 ENGINEERING-REQUIRED + 3 VALIDATED) are NOT stronger than 3 cases of high evidence strength (1 OBSERVED boundary + 1 VALIDATED positive + 1 OBSERVED positive).
   - A single independently-reviewed and re-tested case (e.g., SNB with `c09de13` + `332788c` Independent Validation Review) can be stronger than multiple one-off observations.

2. **Coverage-as-prevalence**: treating `3/178 = 1.7%` as a prevalence estimate. This is wrong because:
   - 3 confirmed cases in the evidence base does NOT mean 1.7% prevalence in the 178-source Universe.
   - It means "3 confirmed cases; universe prevalence unknown."
   - The V1 + V1.1 survey proved that prevalence cannot be reliably measured from this execution environment.

This document establishes rules that prevent both errors.

---

## 3. Mandatory Design Constraint #1 — Three-Dimension Separation

The framework MUST separate three dimensions explicitly. No dimension may be collapsed into another.

```text
Evidence Strength
×
Evidence Coverage
×
Strategic Value
```

### 3.1 Evidence Strength (per-case, qualitative)

Evidence Strength is a property of EACH confirmed case, not of the capability as a whole. It measures the TYPE of evidence, not the COUNT.

**Mandatory 5-level scale** (0-4):

| Level | Label | Definition | Example from Registry |
|-------|-------|------------|------------------------|
| 0 | `HYPOTHESIS` | Plausible but untested. NOT counted as evidence. | ABS (Pattern Specificity — untested hypothesis) |
| 1 | `OBSERVED` | Boundary observed at least once (e.g., Gate 5 FAIL with documented root cause). Single observation. | ESMA (Provenance boundary — `document_date` unavailable); Bangladesh Bank (Event-Model — V1.1 content observation) |
| 2 | `VALIDATED` | Observation method validated (e.g., v2 pre-screening stage confirmed the boundary before Gate 5; OR independent validation review confirmed the result). | SNB (Provenance positive — `c09de13` + independent review `332788c`); NSO India / Basel / EIOPA (Browser Rendering — V1+V1.1 validated) |
| 3 | `REMEDIATION-VALIDATED` | A remediation was attempted AND succeeded AND the remediation type (config-only vs engineering-required) was confirmed. | FED_ENF (Pattern Specificity — config-only remediation PASS `f16bc00`); BaFin (Configuration Contract — config-only remediation `bd7285d`+`282de0f`) |
| 4 | `ENGINEERING-REQUIRED CONFIRMED` | Remediation was attempted AND failed because engineering is required (config-only cannot resolve). The engineering work is well-defined. | TCMB (Browser Rendering — engineering-required `04289d2`, `45bbd88`) |

**Rule**: A capability's aggregate Evidence Strength is the MAXIMUM level achieved by any of its confirmed cases, BUT this maximum must be reported alongside the distribution of cases across levels. A capability with 1 case at level 4 and 3 cases at level 1 is NOT the same as a capability with 4 cases at level 4.

**Example (from Registry)**:
```text
Browser Rendering:
  TCMB = ENGINEERING-REQUIRED CONFIRMED (level 4)
  NSO India = VALIDATED (level 2)
  Basel Committee = VALIDATED (level 2)
  EIOPA = VALIDATED (level 2)
  → Max = 4, but distribution = [0, 0, 3, 0, 1]
  → NOT "4 cases at level 4"

Provenance:
  ESMA = OBSERVED (level 1)
  SNB = VALIDATED (level 2)
  BaFin = OBSERVED (level 1)
  → Max = 2, distribution = [0, 2, 1, 0, 0]
  → 3 cases but max level 2
```

### 3.2 Evidence Coverage (capability-level, knowledge-boundary)

Evidence Coverage describes the **boundaries of knowledge** for a capability — NOT a prevalence percentage. It answers "how much do we know?" not "how common is this?".

**Mandatory Coverage fields** (per capability):

| Field | What it measures | What it does NOT measure |
|-------|------------------|--------------------------|
| `Confirmed cases` | Count of cases in the Registry | Prevalence in the 178-source Universe |
| `Independent cases` | Count of cases with independent validation review (e.g., SNB `332788c`) | Statistical representativeness |
| `Institutional classes represented` | Which B1-B9 classes have ≥1 confirmed case | Coverage of all classes |
| `Geographies represented` | Which regions/countries have ≥1 confirmed case | Coverage of all geographies |
| `Intelligence types represented` | Which intelligence types are observed | Coverage of all intelligence types |
| `Untested scope` | What is UNKNOWN (e.g., "149 untested sources; prevalence unknown") | A prevalence estimate |

**CRITICAL RULE — Coverage is NOT a percentage**:

```text
WRONG: "3/178 = 1.7% prevalence"
RIGHT: "3 confirmed cases in the evidence base; universe prevalence unknown"
```

Coverage describes the **limits of knowledge**, not a proportion. A capability with 3 confirmed cases has `Coverage = "3 confirmed cases; universe prevalence unknown"` — NOT `Coverage = 1.7%`.

This rule exists because the V1 + V1.1 survey proved that prevalence cannot be reliably measured from this execution environment. Treating coverage as a percentage would repeat the survey's methodological error in a new form.

**Example (from Registry)**:
```text
Browser Rendering:
  Confirmed cases: 4 (TCMB, NSO India, Basel Committee, EIOPA)
  Independent cases: 0 (none have independent validation review)
  Institutional classes represented: B1 (central bank), B3 (statistical agency), B7 (multilateral), B9 (other authoritative)
  Geographies represented: TR (TCMB), IN (NSO), INT (Basel), EU (EIOPA)
  Intelligence types represented: monetary_policy, statistical_release, financial_coordination, regulatory_enforcement
  Untested scope: 149 sources in the untested population; prevalence UNKNOWN (survey could not measure reliably)

Provenance:
  Confirmed cases: 3 (ESMA, SNB, BaFin)
  Independent cases: 1 (SNB — `332788c` Independent Validation Review)
  Institutional classes represented: B1 (central bank — SNB), B2 (financial regulator — ESMA, BaFin)
  Geographies represented: CH (SNB), EU (ESMA), DE (BaFin)
  Intelligence types represented: N/A (provenance is cross-cutting)
  Untested scope: 149 sources; prevalence UNKNOWN
```

### 3.3 Strategic Value (capability-level, decision-input)

Strategic Value is the commercial/strategic dimension. It enters the decision ONLY AFTER Evidence Strength and Evidence Coverage are established. **Strategic Value cannot elevate weak evidence to strong evidence.**

**Mandatory Strategic Value fields** (per capability):

| Field | What it measures |
|-------|------------------|
| `Institutional Value` | HIGH / MEDIUM / LOW — how strategically important are the affected sources? |
| `Reuse Potential` | UNKNOWN / HYPOTHESIS / CONFIRMED — would building this capability unlock additional sources beyond the confirmed cases? |
| `Strategic Coverage` | Which strategic priorities (customer demand, global expansion roadmap, jurisdiction priorities) does this capability address? |
| `Engineering Cost/Risk` | LOW / MEDIUM / HIGH — how much engineering work, and what's the risk? |

**CRITICAL RULE — Strategic Value does not elevate evidence**:

```text
WRONG: "Browser Rendering has high strategic value → BUILD NOW"
RIGHT: "Browser Rendering has high strategic value, BUT evidence coverage is
        very limited (4 confirmed cases, prevalence unknown) → INVESTMENT
        CANDIDATE (not BUILD NOW)"
```

A capability with high Strategic Value but weak Evidence Coverage remains an `INVESTMENT CANDIDATE`, not `BUILD NOW`. Strategic Value can prioritize AMONG capabilities at the same evidence level, but it cannot raise a capability to a higher decision level than its evidence supports.

---

## 4. Mandatory Design Constraint #2 — Confidence ≠ Coverage

The framework MUST NOT use a single field called `confidence` that hides the distinction between Evidence Confidence and Evidence Coverage.

**Mandatory separation**:

| Field | What it measures | Scale |
|-------|------------------|-------|
| `Evidence Confidence` | How strong is the evidence for the cases we have? | High / Medium / Low (based on Evidence Strength distribution) |
| `Evidence Coverage` | How much do we know vs. what is unknown? | Limited / Moderate / Wide / UNKNOWN (based on Coverage fields — NOT a percentage) |
| `Decision Readiness` | What decision level does the evidence support? | See Section 5 |

**Example (the user's table, formalized)**:

| Capability | Evidence Confidence | Evidence Coverage | Decision Readiness |
|------------|---------------------|-------------------|-------------------|
| Provenance | High | Limited | Evidence-supported |
| Content-Path | High | Moderate | Evidence-supported |
| Pattern Specificity | High for FED_ENF only | Very limited | Partial |
| Browser Rendering | High for existence | Very limited | Investment candidate |
| Language | High for confirmed gaps | Very limited | Investment candidate |
| Event-Model | High for 3 gaps | Limited | Investment candidate |
| Contract Compatibility | High | Moderate | Evidence-supported |

---

## 5. Mandatory Design Constraint #3 — Decision Ladder (NOT direct BUILD NOW)

The framework MUST use a multi-level decision ladder. It MUST NOT jump directly from evidence to `BUILD NOW`.

**Mandatory 5-level decision ladder**:

| Level | Label | Meaning |
|-------|-------|---------|
| 0 | `NO INVESTMENT DECISION` | Evidence does not support any investment discussion. |
| 1 | `EVIDENCE-ONLY` | Evidence is documented but no investment decision is warranted. Capability remains in the Registry. |
| 2 | `CUSTOMER-SPECIFIC ENGINEERING` | Evidence supports engineering work IF a specific customer requests a specific affected source. Not a platform investment. |
| 3 | `INVESTMENT CANDIDATE` | Evidence supports considering the capability for platform investment, BUT evidence coverage is insufficient for a BUILD NOW decision. Requires additional evidence (customer demand signals, manual URL discovery, different execution environment) before promotion. |
| 4 | `INVESTMENT DECISION READY` | Evidence strength + coverage + strategic value are all sufficient for a manual BUILD NOW / DEFER / CUSTOMER-SPECIFIC decision by the user. |

**CRITICAL RULES**:

1. **Strategic Value can prioritize AMONG capabilities at the same decision level**, but cannot raise a capability to a higher decision level than its evidence supports.
   - Example: Browser Rendering may have high strategic value, but with prevalence unknown, it remains `INVESTMENT CANDIDATE` (level 3), NOT `INVESTMENT DECISION READY` (level 4).

2. **A single confirmed case (e.g., TCMB) cannot become a core engineering project solely on its own evidence**. TCMB = `ENGINEERING-REQUIRED CONFIRMED` (Evidence Strength level 4) for ONE source. This supports `CUSTOMER-SPECIFIC ENGINEERING` (decision level 2) — NOT `INVESTMENT DECISION READY` (decision level 4) for the platform.

3. **A capability with few confirmed cases but high evidence strength is NOT automatically lower priority than a capability with many cases but mixed evidence strength**. The framework must compare capabilities on Evidence Strength × Evidence Coverage × Strategic Value — not on case count alone.

4. **Coverage UNKNOWN does NOT mean "no evidence"**. It means "evidence exists but prevalence is unknown." This is different from `NO INVESTMENT DECISION` (which means evidence does not support any investment discussion).

---

## 6. Mandatory Design Constraint #4 — No Prevalence Inference

The framework MUST NOT infer prevalence from confirmed cases.

**Explicit prohibitions**:

1. The framework MUST NOT compute `confirmed_cases / 178` as a prevalence estimate.
2. The framework MUST NOT use phrases like "X% of sources" or "X% of the Universe".
3. The framework MUST NOT compare capabilities by prevalence percentage.
4. The framework MUST NOT promote a capability to `INVESTMENT DECISION READY` based on a prevalence estimate.

**What the framework MAY do**:

1. Report confirmed case counts (e.g., "4 confirmed cases").
2. Report institutional classes / geographies / intelligence types represented.
3. Report untested scope (e.g., "149 sources untested; prevalence UNKNOWN").
4. Compare capabilities by Evidence Strength distribution and Evidence Coverage fields — NOT by prevalence percentage.

---

## 7. Mandatory Design Constraint #5 — Remediation Attribution

The framework MUST attribute each remediation to the capability that the test proved caused or resolved the issue. This is the standard established in the Registry (FROZEN at `dd66cc1`).

**Example**:
- BaFin's remediation (`bd7285d` + `282de0f`) is attributed to Capability 7 (Configuration Contract), NOT Capability 1 (Provenance). The framework MUST NOT count BaFin's remediation as evidence for Provenance investment.

---

## 8. What This Document Does NOT Do

- Does NOT build the Capability Investment Decision Framework itself.
- Does NOT make any investment decision.
- Does NOT prioritize capabilities.
- Does NOT modify the Capability Evidence Registry V1 (FROZEN).
- Does NOT modify the Capability Gap Portfolio V1.
- Does NOT modify any frozen artifact (v2 framework, Queue, Contract, Commercial Model).
- Does NOT authorize any engineering work.

---

## 9. What This Document DOES Do

- Establishes 5 mandatory design constraints that the Capability Investment Decision Framework MUST satisfy.
- Prevents the framework from repeating the quantitative survey's methodological errors.
- Separates Evidence Strength, Evidence Coverage, and Strategic Value as independent dimensions.
- Replaces the direct `BUILD NOW` jump with a 5-level decision ladder.
- Establishes that Coverage is a knowledge-boundary (NOT a prevalence percentage).
- Establishes that Strategic Value cannot elevate weak evidence.
- Establishes that remediation attribution must be precise (per the Registry standard).

---

## 10. Next Step (Per User Directive)

This document is a **design constraint**, not the framework. The next step is to build the **Capability Investment Decision Framework** that satisfies these 5 constraints.

The framework will:
1. Take the Capability Evidence Registry V1 (FROZEN) as evidence input.
2. Take the Global Source Universe V1 as scope input.
3. Take the Commercial Model as strategic input.
4. Apply the 5 mandatory design constraints from this document.
5. Produce per-capability decision levels (Section 5 ladder) with Evidence Strength × Evidence Coverage × Strategic Value breakdown.

**The framework is NOT authorized yet.** This document only establishes the constraints. The user must authorize building the framework in a separate directive.

---

## 11. Document Status

**CAPABILITY_INVESTMENT_FRAMEWORK_DESIGN_CONSTRAINTS_V1 — DRAFT FOR USER RATIFICATION.**

This document establishes mandatory design constraints. It does NOT build the framework, does NOT make investment decisions, and does NOT modify any frozen artifact.

The user is asked to:
1. Ratify the 5 mandatory design constraints (Sections 3-7).
2. Confirm the 5-level decision ladder (Section 5).
3. Confirm the Evidence Strength scale (Section 3.1).
4. Confirm the Coverage-as-knowledge-boundary rule (Section 3.2, Section 4, Section 6).
5. Authorize (or not) building the Capability Investment Decision Framework that satisfies these constraints.

---

## 12. Document Provenance

| Field | Value |
|-------|-------|
| Author | main (Super Z) |
| Date | 2026-08-15 |
| Branch | `top20-prescreening` |
| Base | Capability Evidence Registry V1 (FROZEN at `dd66cc1`) |
| Type | Design constraint document — NOT the framework |
| Does NOT modify | Capability Evidence Registry V1, Capability Gap Portfolio V1, Capability Survey Results V1/V1.1, Survey Protocols V1/V1.1, Queue V1/V1.1, v2 Qualification framework, pipeline/config, Contract, Commercial Model, website |
| Next step (per user directive) | NOT a direct BUILD NOW decision. Build a Capability Investment Decision Framework that satisfies these 5 constraints — but only after user ratification of these constraints. |

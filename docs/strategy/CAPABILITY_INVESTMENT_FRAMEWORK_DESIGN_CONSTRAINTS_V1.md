# Capability Investment Framework — Design Constraints V1

**Date**: 2026-08-15
**Branch**: `top20-prescreening`
**Status**: V1 — FROZEN (design constraints ratified by user)
**Type**: Design constraint document — NOT the framework. Does NOT modify any frozen artifact.
**Purpose**: Establish the mandatory design rules that must govern the Capability Investment Decision Framework before that framework is built.
**Freeze directive**: Per user CONDITIONAL RATIFICATION of `da123d4` with one final correction applied (Evidence Confidence → derived reporting field, NOT an independent evidence dimension). The 6 constraints are now FROZEN and ready to govern the framework build.

---

## 1. Why This Document Exists

Per user directive, the next phase is NOT a direct BUILD NOW decision. The next phase is to build a **Capability Investment Decision Framework** that decides which capabilities deserve investment.

However, before that framework can be built, **mandatory design constraints** must be established. These constraints prevent the framework from repeating the methodological errors of the quantitative survey approach (V1 + V1.1) — specifically, the error of treating case count as a proxy for evidence strength, and the error of treating coverage as a prevalence percentage.

This document is **not the framework**. It is the set of rules the framework must satisfy.

---

## 2. The Core Problem This Solves

The Capability Evidence Registry V1 (FROZEN at `dd66cc1`) documents confirmed evidence cases. Without design constraints, the next framework could commit two errors:

1. **Case-count weighting**: treating `4 Browser Rendering cases > 3 Provenance cases` as automatically higher investment priority. This is wrong because case count alone says nothing about the strength or breadth of the evidence.

2. **Coverage-as-prevalence**: treating `3/178 = 1.7%` as a prevalence estimate. This is wrong because:
   - 3 confirmed cases in the evidence base does NOT mean 1.7% prevalence in the 178-source Universe.
   - It means "3 confirmed cases; universe prevalence unknown."
   - The V1 + V1.1 survey proved that prevalence cannot be reliably measured from this execution environment.

A third error — discovered during user review of the initial draft (`bc8c12c`) — must also be prevented:

3. **Conflating epistemic strength with resolution state**: the original 0-4 scale (`HYPOTHESIS → OBSERVED → VALIDATED → REMEDIATION-VALIDATED → ENGINEERING-REQUIRED CONFIRMED`) treated `REMEDIATION-VALIDATED` and `ENGINEERING-REQUIRED CONFIRMED` as higher levels of evidence strength. This is wrong because they describe **resolution state**, not **epistemic strength**. A source that required engineering (TCMB) is not "more strongly evidenced" than a source that was remediated via config (FED_ENF) — they have different resolution states, not different evidence strengths.

This document establishes rules that prevent all three errors.

---

## 3. Mandatory Design Constraint #1 — Four-Layer Separation

The framework MUST separate four layers explicitly. No layer may be collapsed into another.

```text
Evidence Layer
├── Evidence Strength Profile
├── Evidence Coverage
└── Evidence Diversity

Derived reporting (NOT an independent dimension, NOT an investment-weighting input):
└── Evidence Confidence

Decision Layer
├── Strategic Value
├── Reuse Potential
├── Engineering Cost
├── Engineering Risk
└── Strategic Alignment

Resolution Layer
├── UNTESTED
├── CONFIG-ONLY REMEDIATION VALIDATED
├── ENGINEERING REQUIRED
└── ENGINEERING REMEDIATION VALIDATED

Decision Readiness
├── NO INVESTMENT DECISION
├── EVIDENCE-ONLY
├── CUSTOMER-SPECIFIC
├── INVESTMENT CANDIDATE
└── INVESTMENT DECISION READY
```

### 3.1 Evidence Layer

The Evidence Layer contains THREE independent dimensions: Evidence Strength Profile, Evidence Coverage, Evidence Diversity. Evidence Confidence is NOT a fourth dimension — it is a derived reporting field (Section 3.1.4).

#### 3.1.1 Evidence Strength / State (per-case, qualitative)

Evidence Strength is a property of EACH confirmed case, not of the capability as a whole. It measures the **epistemic strength of the evidence** — how confident we are in the observation — NOT whether the case was remediated or required engineering.

**Mandatory 4-level Evidence Strength scale**:

| Level | Label | Definition | Example from Registry |
|-------|-------|------------|------------------------|
| 0 | `HYPOTHESIS` | Plausible but untested. NOT counted as evidence. | ABS (Pattern Specificity — untested hypothesis) |
| 1 | `OBSERVED` | Boundary observed at least once (e.g., Gate 5 FAIL with documented root cause). Single observation, no independent validation. | ESMA (Provenance boundary — `document_date` unavailable); Bangladesh Bank (Event-Model — V1.1 content observation) |
| 2 | `VALIDATED` | Observation method validated (e.g., v2 pre-screening stage confirmed the boundary before Gate 5; OR the observation was independently reproduced). | NSO India / Basel / EIOPA (Browser Rendering — V1+V1.1 validated); TCMB (Browser Rendering — remediation test confirmed the boundary); FED_ENF (Pattern Specificity — remediation test confirmed the boundary) |
| 3 | `HIGH-CONFIDENCE VALIDATED` | Observation method validated AND an independent validation review confirmed the result (e.g., SNB Independent Validation Review `332788c`). | SNB (Provenance positive — `c09de13` + independent review `332788c`) |

**CRITICAL RULE — Evidence Strength is independent of Resolution Status**:

- A case that required engineering (TCMB, Resolution = `ENGINEERING REQUIRED`) is NOT stronger evidence than a case that was remediated via config (FED_ENF, Resolution = `CONFIG-ONLY REMEDIATION VALIDATED`). Both are `Evidence Strength = VALIDATED` (level 2).
- A case that was remediated via config (FED_ENF) is NOT stronger evidence than a case that was never remediated because no remediation was needed (SNB positive case). FED_ENF = `VALIDATED`; SNB = `HIGH-CONFIDENCE VALIDATED` (level 3, due to independent review).
- `REMEDIATION-VALIDATED` and `ENGINEERING-REQUIRED CONFIRMED` are NOT levels of Evidence Strength. They belong to the Resolution Layer (Section 3.3).

**NO aggregate "MAX Evidence Strength"**:

The framework MUST NOT compute a single "MAX Evidence Strength" as the aggregate strength of a capability. Aggregating by MAX hides the distribution and can mislead (e.g., a capability with 1 case at level 3 + 3 cases at level 1 would aggregate to "3", implying high strength — but the actual evidence is thin).

**Instead, the framework MUST use an Evidence Profile / Distribution**:

```text
Evidence Profile (per capability):
  Level 0 (HYPOTHESIS):              [count]
  Level 1 (OBSERVED):                [count]
  Level 2 (VALIDATED):               [count]
  Level 3 (HIGH-CONFIDENCE VALIDATED): [count]
  Total confirmed cases:            [count]
  Highest evidence state observed:   [label — descriptive only, NOT aggregate strength]
```

The "Highest evidence state observed" field is **descriptive only** — it does NOT represent the capability's aggregate strength. The Evidence Profile (distribution across levels) is the canonical representation.

**Example (from Registry)**:

```text
Browser Rendering:
  Evidence Profile:
    Level 0 (HYPOTHESIS):              0
    Level 1 (OBSERVED):                0
    Level 2 (VALIDATED):               4 (TCMB, NSO India, Basel Committee, EIOPA)
    Level 3 (HIGH-CONFIDENCE VALIDATED): 0
    Total confirmed cases:              4
    Highest evidence state observed:    VALIDATED (descriptive only)

Provenance:
  Evidence Profile:
    Level 0 (HYPOTHESIS):              0
    Level 1 (OBSERVED):                2 (ESMA, BaFin)
    Level 2 (VALIDATED):               0
    Level 3 (HIGH-CONFIDENCE VALIDATED): 1 (SNB)
    Total confirmed cases:              3
    Highest evidence state observed:    HIGH-CONFIDENCE VALIDATED (descriptive only)
```

#### 3.1.4 Evidence Confidence (derived reporting field — NOT an independent dimension)

**CRITICAL RULE — Evidence Confidence is a derived reporting summary of the evidence profile, NOT an independent decision input and NOT an additional evidence dimension.**

Evidence Confidence is computed FROM the Evidence Strength Profile (Section 3.1.1). It is a human-readable summary of the distribution — for example, "High (1 HIGH-CONFIDENCE VALIDATED + 2 OBSERVED)" or "High for existence (4 VALIDATED cases)".

**Evidence Confidence MUST NOT**:
- Be treated as an independent evidence dimension (it is derived from Evidence Strength Profile).
- Be used as an investment-weighting input (Decision Readiness is derived from Evidence Profile + Coverage + Diversity — NOT from a separate Confidence weight).
- Re-weight the evidence a second time (the Evidence Profile already captures the distribution; Confidence merely summarizes it).

**Why this rule exists**: If Evidence Confidence were treated as an independent dimension, the framework would risk re-introducing the overlap problem we are trying to prevent. Confidence is meaningfully derived from Strength Profile — treating it as independent would double-count the same evidence under two names.

**Evidence Confidence scale** (derived, descriptive): `High` / `Medium` / `Low` — based on the Evidence Strength Profile distribution. The derivation rule is NOT numerically fixed (per Open Design Gap — Decision-Readiness Calibration, Section 9); the user assigns the descriptive label based on the profile.

**Example**:
```text
Provenance:
  Evidence Strength Profile:
    Level 0 (HYPOTHESIS):              0
    Level 1 (OBSERVED):                2 (ESMA, BaFin)
    Level 2 (VALIDATED):               0
    Level 3 (HIGH-CONFIDENCE VALIDATED): 1 (SNB)
  Evidence Confidence (derived): High
    — because 1 case at HIGH-CONFIDENCE VALIDATED + 2 at OBSERVED
      provides strong evidence for the boundary, even with only 3 cases
```

#### 3.1.2 Evidence Coverage (capability-level, knowledge-boundary)

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

#### 3.1.3 Evidence Diversity (capability-level, breadth-of-evidence)

Evidence Diversity measures the **breadth** of the evidence base — whether the confirmed cases come from independent institutions, geographies, and intelligence types, or whether they cluster around a single institution/pattern.

**Mandatory Diversity fields** (per capability):

| Field | What it measures |
|-------|------------------|
| `Distinct institutions` | Count of distinct source institutions across confirmed cases |
| `Distinct institutional classes` | Count of distinct B1-B9 classes represented |
| `Distinct geographies` | Count of distinct countries/regions represented |
| `Distinct intelligence types` | Count of distinct intelligence types observed |
| `Independent validation reviews` | Count of cases with independent validation review (e.g., SNB `332788c`) |

**CRITICAL RULE — Diversity is independent of Coverage**:

- 3 cases from 3 different countries and 2 institutional classes is **stronger evidence** (broader) than 3 cases from 1 institution, 1 country, 1 intelligence type.
- This is NOT because the first set has "higher prevalence" — it has the same case count (3). It is because the first set provides **breadth of evidence** that the second set does not.
- Diversity does NOT compensate for insufficient Evidence Strength or Coverage. A capability with high Diversity but low Strength is still weak evidence. But among capabilities with similar Strength and Coverage, higher Diversity is preferred.

**Example (from Registry)**:

```text
Browser Rendering:
  Distinct institutions: 4 (TCMB, NSO India, Basel Committee, EIOPA)
  Distinct institutional classes: 4 (B1, B3, B7, B9)
  Distinct geographies: 4 (TR, IN, INT, EU)
  Distinct intelligence types: 4 (monetary_policy, statistical_release, financial_coordination, regulatory_enforcement)
  Independent validation reviews: 0
  → Broad institutional, geographic, and intelligence-type diversity

Provenance:
  Distinct institutions: 3 (ESMA, SNB, BaFin)
  Distinct institutional classes: 2 (B1, B2)
  Distinct geographies: 3 (CH, EU, DE)
  Distinct intelligence types: N/A (provenance is cross-cutting)
  Independent validation reviews: 1 (SNB)
  → Moderate diversity; 1 independent review (SNB) provides high-confidence validation
```

### 3.2 Decision Layer

The Decision Layer contains the commercial/strategic inputs. These enter the decision ONLY AFTER the Evidence Layer is established. **Decision Layer inputs cannot elevate weak evidence to strong evidence.**

**Mandatory Decision Layer fields** (per capability):

| Field | What it measures | Scale |
|-------|------------------|-------|
| `Institutional Value` | How strategically important are the affected sources? | HIGH / MEDIUM / LOW |
| `Reuse Potential` | Would building this capability unlock additional sources beyond the confirmed cases? | UNKNOWN / HYPOTHESIS / CONFIRMED |
| `Engineering Cost` | How much engineering work is required? | LOW / MEDIUM / HIGH |
| `Engineering Risk` | What is the risk of the engineering work (throughput, reproducibility, complexity)? | LOW / MEDIUM / HIGH |
| `Strategic Alignment` | Which strategic priorities (customer demand, global expansion roadmap, jurisdiction priorities) does this capability address? | Descriptive (list of strategic priorities) |

**CRITICAL RULE — Decision Layer does not elevate evidence**:

```text
WRONG: "Browser Rendering has high strategic value → BUILD NOW"
RIGHT: "Browser Rendering has high strategic value, BUT evidence coverage is
        very limited (4 confirmed cases, prevalence unknown) → INVESTMENT
        CANDIDATE (not BUILD NOW)"
```

A capability with high Decision Layer scores but weak Evidence Layer remains an `INVESTMENT CANDIDATE`, not `INVESTMENT DECISION READY`. Decision Layer inputs can prioritize AMONG capabilities at the same evidence level, but they cannot raise a capability to a higher decision level than its evidence supports.

### 3.3 Resolution Layer (per-case, status-of-the-issue)

The Resolution Layer describes the **status of resolving the boundary** for each confirmed case. It is INDEPENDENT of Evidence Strength.

**Mandatory 4-state Resolution Status** (per case):

| State | Label | Definition | Example from Registry |
|-------|-------|------------|------------------------|
| 0 | `UNTESTED` | No remediation has been attempted. The boundary is documented but not resolved. | ESMA (Provenance — routing outcome, no remediation); SNB (Provenance — positive case, no remediation needed); Bangladesh Bank, Central Bank of Egypt, CBS Netherlands, Basel Committee (Event-Model — V1.1 content observations, no remediation) |
| 1 | `CONFIG-ONLY REMEDIATION VALIDATED` | A remediation was attempted AND succeeded AND was confirmed to be config-only (no engineering required). | FED_ENF (Pattern Specificity — config-only remediation PASS `f16bc00`); BaFin (Configuration Contract Compatibility — config-only remediation `bd7285d`+`282de0f`) |
| 2 | `ENGINEERING REQUIRED` | A remediation was attempted AND failed because engineering is required (config-only cannot resolve). The engineering work is well-defined but not executed. | TCMB (Browser Rendering — engineering-required `04289d2`, `45bbd88`) |
| 3 | `ENGINEERING REMEDIATION VALIDATED` | Engineering work was executed AND succeeded in resolving the boundary. (No case in the current Registry — this state is reserved for future evidence.) | (none yet) |

**CRITICAL RULE — Resolution Status is independent of Evidence Strength**:

- TCMB: `Evidence Strength = VALIDATED` (level 2) + `Resolution Status = ENGINEERING REQUIRED` (state 2). TCMB is NOT "more strongly evidenced" than FED_ENF because it required engineering. They have the SAME Evidence Strength (VALIDATED) but DIFFERENT Resolution Status.
- FED_ENF: `Evidence Strength = VALIDATED` (level 2) + `Resolution Status = CONFIG-ONLY REMEDIATION VALIDATED` (state 1). FED_ENF is NOT "more strongly evidenced" than TCMB because it was remediated. Same Evidence Strength, different Resolution Status.

**Resolution Profile (per capability)**:

```text
Resolution Profile (per capability):
  State 0 (UNTESTED):                              [count]
  State 1 (CONFIG-ONLY REMEDIATION VALIDATED):      [count]
  State 2 (ENGINEERING REQUIRED):                   [count]
  State 3 (ENGINEERING REMEDIATION VALIDATED):      [count]
  Total confirmed cases:                            [count]
```

**Example (from Registry)**:

```text
Browser Rendering:
  Resolution Profile:
    State 0 (UNTESTED):                              3 (NSO India, Basel Committee, EIOPA — validated but no remediation attempted)
    State 1 (CONFIG-ONLY REMEDIATION VALIDATED):      0
    State 2 (ENGINEERING REQUIRED):                   1 (TCMB)
    State 3 (ENGINEERING REMEDIATION VALIDATED):      0
    Total confirmed cases:                            4

Pattern Specificity:
  Resolution Profile:
    State 0 (UNTESTED):                              1 (ABS — hypothesis, not remediation-tested)
    State 1 (CONFIG-ONLY REMEDIATION VALIDATED):      1 (FED_ENF)
    State 2 (ENGINEERING REQUIRED):                   0
    State 3 (ENGINEERING REMEDIATION VALIDATED):      0
    Total confirmed cases:                            2

Provenance:
  Resolution Profile:
    State 0 (UNTESTED):                              3 (ESMA, SNB, BaFin — none remediation-tested for provenance)
    State 1 (CONFIG-ONLY REMEDIATION VALIDATED):      0
    State 2 (ENGINEERING REQUIRED):                   0
    State 3 (ENGINEERING REMEDIATION VALIDATED):      0
    Total confirmed cases:                            3

Configuration Contract Compatibility:
  Resolution Profile:
    State 0 (UNTESTED):                              6 (Bundesbank, Banca d'Italia, FSB, UK HM Treasury, Eurostat, FED_ENF — none remediation-tested for contract; FED_ENF's remediation was for Pattern Specificity, not Contract)
    State 1 (CONFIG-ONLY REMEDIATION VALIDATED):      1 (BaFin — `bd7285d`+`282de0f`)
    State 2 (ENGINEERING REQUIRED):                   0
    State 3 (ENGINEERING REMEDIATION VALIDATED):      0
    Total confirmed cases:                            7
```

### 3.4 Combined Evidence + Resolution view (per case)

Each confirmed case is represented by a (Evidence Strength, Resolution Status) tuple. This is the canonical per-case representation.

**Example — per-case tuples (from Registry)**:

| Capability | Source | Evidence Strength | Resolution Status |
|------------|--------|-------------------|-------------------|
| Provenance | ESMA | OBSERVED (1) | UNTESTED (0) |
| Provenance | SNB | HIGH-CONFIDENCE VALIDATED (3) | UNTESTED (0) |
| Provenance | BaFin | OBSERVED (1) | UNTESTED (0) |
| Content-Path | US Treasury | VALIDATED (2) | UNTESTED (0) |
| Content-Path | RBI | VALIDATED (2) | UNTESTED (0) |
| Content-Path | SEBI | VALIDATED (2) | UNTESTED (0) |
| Content-Path | PRA | VALIDATED (2) | UNTESTED (0) |
| Content-Path | BaFin | VALIDATED (2) | UNTESTED (0) |
| Content-Path | Eurostat | VALIDATED (2) | UNTESTED (0) |
| Content-Path | FED_ENF | VALIDATED (2) | UNTESTED (0) |
| Content-Path | ABS | OBSERVED (1) | UNTESTED (0) |
| Pattern Specificity | FED_ENF | VALIDATED (2) | CONFIG-ONLY REMEDIATION VALIDATED (1) |
| Pattern Specificity | ABS | HYPOTHESIS (0) | UNTESTED (0) |
| Browser Rendering | TCMB | VALIDATED (2) | ENGINEERING REQUIRED (2) |
| Browser Rendering | NSO India | VALIDATED (2) | UNTESTED (0) |
| Browser Rendering | Basel Committee | VALIDATED (2) | UNTESTED (0) |
| Browser Rendering | EIOPA | VALIDATED (2) | UNTESTED (0) |
| Language | INSEE | OBSERVED (1) | UNTESTED (0) |
| Language | Banca d'Italia | OBSERVED (1) | UNTESTED (0) |
| Language | FSO Switzerland | OBSERVED (1) | UNTESTED (0) |
| Language | BaFin | OBSERVED (1) | UNTESTED (0) |
| Language | Saudi MoF | OBSERVED (1) | UNTESTED (0) |
| Language | CBS Netherlands | OBSERVED (1) | UNTESTED (0) |
| Language | CSRC | OBSERVED (1) | UNTESTED (0) |
| Event-Model | Bundesbank | VALIDATED (2) | UNTESTED (0) |
| Event-Model | FSB | VALIDATED (2) | UNTESTED (0) |
| Event-Model | UK HM Treasury | VALIDATED (2) | UNTESTED (0) |
| Event-Model | Bangladesh Bank | OBSERVED (1) | UNTESTED (0) |
| Event-Model | Central Bank of Egypt | OBSERVED (1) | UNTESTED (0) |
| Event-Model | CBS Netherlands | OBSERVED (1) | UNTESTED (0) |
| Event-Model | Basel Committee | OBSERVED (1) | UNTESTED (0) |
| Configuration Contract Compatibility | Bundesbank | VALIDATED (2) | UNTESTED (0) |
| Configuration Contract Compatibility | Banca d'Italia | VALIDATED (2) | UNTESTED (0) |
| Configuration Contract Compatibility | FSB | VALIDATED (2) | UNTESTED (0) |
| Configuration Contract Compatibility | UK HM Treasury | VALIDATED (2) | UNTESTED (0) |
| Configuration Contract Compatibility | BaFin | VALIDATED (2) | CONFIG-ONLY REMEDIATION VALIDATED (1) |
| Configuration Contract Compatibility | Eurostat | VALIDATED (2) | UNTESTED (0) |
| Configuration Contract Compatibility | FED_ENF | VALIDATED (2) | UNTESTED (0) |

---

## 4. Mandatory Design Constraint #2 — Confidence is Derived; Coverage and Diversity are Independent

The framework MUST NOT treat Evidence Confidence as an independent dimension co-equal with Evidence Coverage and Evidence Diversity.

**Mandatory structure**:

| Field | Type | What it measures | Scale |
|-------|------|------------------|-------|
| `Evidence Strength Profile` | Independent dimension (per-case) | Distribution of cases across epistemic strength levels | 4-level scale (Section 3.1.1) |
| `Evidence Coverage` | Independent dimension (capability-level) | How much do we know vs. what is unknown? | Limited / Moderate / Wide / UNKNOWN (NOT a percentage) |
| `Evidence Diversity` | Independent dimension (capability-level) | How broad is the evidence base? | Narrow / Moderate / Broad |
| `Evidence Confidence` | **Derived reporting field** (NOT a dimension) | Summary of the Evidence Strength Profile | High / Medium / Low (derived, descriptive only) |
| `Decision Readiness` | Output (per Section 6) | What decision level does the evidence support? | 5-level ladder (Section 6) |

**CRITICAL RULE**:

> **Evidence Confidence is a derived reporting summary of the evidence profile, not an independent decision input and not an additional evidence dimension.**

Decision Readiness is derived from **Evidence Profile + Coverage + Diversity** — NOT from a separate Confidence weight that re-weights the evidence a second time.

**Example (formalized per user directive)**:

| Capability | Evidence Strength Profile | Evidence Confidence (derived) | Evidence Coverage | Evidence Diversity | Decision Readiness |
|------------|---------------------------|------------------------------|-------------------|-------------------|-------------------|
| Provenance | 1 HIGH-CONFIDENCE VALIDATED + 2 OBSERVED | High (derived) | Limited | Moderate | Evidence-supported |
| Content-Path | 7 VALIDATED + 1 OBSERVED | High (derived) | Moderate | Moderate | Evidence-supported |
| Pattern Specificity | 1 VALIDATED + 1 HYPOTHESIS | High for FED_ENF only (derived) | Very limited | Narrow | Partial |
| Browser Rendering | 4 VALIDATED | High for existence (derived) | Very limited | Broad | Investment candidate |
| Language | 7 OBSERVED | High for confirmed gaps (derived) | Very limited | Broad | Investment candidate |
| Event-Model | 3 VALIDATED + 4 OBSERVED | High for 3 confirmed gaps (derived) | Limited | Moderate | Investment candidate |
| Configuration Contract Compatibility | 7 VALIDATED | High (derived) | Moderate | Moderate | Evidence-supported |

Note: Evidence Confidence in this table is **derived from the Strength Profile** — it is NOT a separate weighting. The Decision Readiness column is derived from **Evidence Profile + Coverage + Diversity** (plus Decision Layer inputs per Section 3.2), NOT from Confidence as an independent weight.

---

## 5. Mandatory Design Constraint #3 — Capability Naming Consistency

The framework MUST use consistent capability names. In particular:

- The capability is named **`Configuration Contract Compatibility`** — NOT `Configuration Contract`, NOT `Contract Compatibility`, NOT `Configuration Contract Verification`.
- `Configuration Contract` is the name of the **artifact/contract** itself (the static check performed against `EVENT_TYPE_RULES` + `PATTERN_TYPE_METADATA` + `trigger_metrics`).
- `Configuration Contract Compatibility` is the name of the **capability** — the ability of a source's configuration to be compatible with the pipeline's contract.

```text
Artifact:
  Configuration Contract

Capability:
  Configuration Contract Compatibility
```

This capability includes:
- Static contract verification (event_type supported? pattern metrics normalized? trigger_metrics compatible? content_keywords / adapter compatible?)
- Semantic compatibility assessment (assessed separately — see v2 Semantic Representation Assessment)

BaFin's remediation evidence (`bd7285d` + `282de0f`) is attributed to this capability — `Configuration Contract Compatibility`.

---

## 6. Mandatory Design Constraint #4 — Decision Readiness Ladder (NOT direct BUILD NOW)

The framework MUST use a multi-level decision ladder. It MUST NOT jump directly from evidence to `BUILD NOW`.

**Mandatory 5-level decision ladder**:

| Level | Label | Meaning |
|-------|-------|---------|
| 0 | `NO INVESTMENT DECISION` | Evidence does not support any investment discussion. |
| 1 | `EVIDENCE-ONLY` | Evidence is documented but no investment decision is warranted. Capability remains in the Registry. |
| 2 | `CUSTOMER-SPECIFIC` | Evidence supports engineering work IF a specific customer requests a specific affected source. Not a platform investment. |
| 3 | `INVESTMENT CANDIDATE` | Evidence supports considering the capability for platform investment, BUT evidence coverage is insufficient for an `INVESTMENT DECISION READY` decision. Requires additional evidence (customer demand signals, manual URL discovery, different execution environment) before promotion. |
| 4 | `INVESTMENT DECISION READY` | Evidence strength + coverage + diversity + strategic value are all sufficient for a manual BUILD NOW / DEFER / CUSTOMER-SPECIFIC decision by the user. |

**CRITICAL RULES**:

1. **Decision Layer inputs can prioritize AMONG capabilities at the same decision level**, but cannot raise a capability to a higher decision level than its evidence supports.
   - Example: Browser Rendering may have high strategic value, but with prevalence unknown, it remains `INVESTMENT CANDIDATE` (level 3), NOT `INVESTMENT DECISION READY` (level 4).

2. **A single confirmed case (e.g., TCMB) cannot become a core engineering project solely on its own evidence**. TCMB = `Evidence Strength = VALIDATED` + `Resolution Status = ENGINEERING REQUIRED` for ONE source. This supports `CUSTOMER-SPECIFIC` (decision level 2) — NOT `INVESTMENT DECISION READY` (decision level 4) for the platform.

3. **A capability with few confirmed cases but high evidence strength is NOT automatically lower priority than a capability with many cases but mixed evidence strength**. The framework must compare capabilities on Evidence Strength × Evidence Coverage × Evidence Diversity × Decision Layer — not on case count alone.

4. **Coverage UNKNOWN does NOT mean "no evidence"**. It means "evidence exists but prevalence is unknown." This is different from `NO INVESTMENT DECISION` (which means evidence does not support any investment discussion).

5. **`Resolution Status = ENGINEERING REQUIRED` does NOT automatically promote a capability to `INVESTMENT DECISION READY`**. TCMB has `Resolution Status = ENGINEERING REQUIRED`, but Browser Rendering as a capability remains `INVESTMENT CANDIDATE` because Evidence Coverage is very limited (4 confirmed cases, prevalence unknown).

---

## 7. Mandatory Design Constraint #5 — No Prevalence Inference

The framework MUST NOT infer prevalence from confirmed cases.

**Explicit prohibitions**:

1. The framework MUST NOT compute `confirmed_cases / 178` as a prevalence estimate.
2. The framework MUST NOT use phrases like "X% of sources" or "X% of the Universe".
3. The framework MUST NOT compare capabilities by prevalence percentage.
4. The framework MUST NOT promote a capability to `INVESTMENT DECISION READY` based on a prevalence estimate.

**What the framework MAY do**:

1. Report confirmed case counts (e.g., "4 confirmed cases").
2. Report institutional classes / geographies / intelligence types represented (Diversity fields).
3. Report untested scope (e.g., "149 sources untested; prevalence UNKNOWN").
4. Compare capabilities by Evidence Profile (Section 3.1.1) + Resolution Profile (Section 3.3) + Coverage (Section 3.1.2) + Diversity (Section 3.1.3) — NOT by prevalence percentage.

---

## 8. Mandatory Design Constraint #6 — Remediation Attribution

The framework MUST attribute each remediation to the capability that the test proved caused or resolved the issue. This is the standard established in the Registry (FROZEN at `dd66cc1`).

**Example**:
- BaFin's remediation (`bd7285d` + `282de0f`) is attributed to **Configuration Contract Compatibility** (Capability 7), NOT Provenance (Capability 1). The framework MUST NOT count BaFin's remediation as evidence for Provenance investment.
- FED_ENF's remediation (`f16bc00`) is attributed to **Pattern Specificity** (Capability 3), NOT to any other capability.

---

## 9. Open Design Gap — Decision-Readiness Calibration (UNRESOLVED)

**This is an explicit, unresolved design problem. The framework MUST NOT silently assume thresholds.**

The framework currently defines ordered decision states (Section 6) but does NOT establish empirical thresholds for transition between them. No fixed number of cases, coverage level, institutional diversity, or geographic diversity is currently authorized as a transition rule.

**Explicit statement**:

> **Decision-Readiness Calibration is an unresolved design problem. No fixed number of cases, coverage band, geography count, or institutional-class count is currently authorized as a transition threshold.**

**What this means**:

- The framework CANNOT say "≥5 confirmed cases → INVESTMENT CANDIDATE" or "≥3 institutional classes → INVESTMENT DECISION READY".
- The framework CANNOT say "≥30% prevalence → INVESTMENT DECISION READY" (this would also violate Constraint #5).
- The framework CAN describe the Evidence Profile, Coverage, Diversity, Resolution Profile, and Decision Layer inputs for each capability — and the user makes the manual decision-readiness assignment based on these inputs.

**Thresholds will be designed explicitly in a later calibration step** after sufficient decision evidence exists (i.e., after the framework has been applied to real decisions and the user has observed which evidence patterns correspond to which decision outcomes).

This Open Design Gap is **intentionally left unresolved**. It is better to have an explicit unresolved design problem than to bury arbitrary numerical thresholds inside the framework.

---

## 10. What This Document Does NOT Do

- Does NOT build the Capability Investment Decision Framework itself.
- Does NOT make any investment decision.
- Does NOT prioritize capabilities.
- Does NOT establish decision-readiness thresholds (Section 9 — Open Design Gap).
- Does NOT modify the Capability Evidence Registry V1 (FROZEN).
- Does NOT modify the Capability Gap Portfolio V1.
- Does NOT modify any frozen artifact (v2 framework, Queue, Contract, Commercial Model).
- Does NOT authorize any engineering work.

---

## 11. What This Document DOES Do

- Establishes 6 mandatory design constraints that the Capability Investment Decision Framework MUST satisfy.
- Prevents the framework from repeating the quantitative survey's methodological errors (case-count weighting, coverage-as-prevalence, conflating epistemic strength with resolution state, treating derived confidence as an independent weight).
- Separates the framework into 4 layers: Evidence Layer / Decision Layer / Resolution Layer / Decision Readiness.
- Separates Evidence Strength (epistemic) from Resolution Status (status-of-the-issue) as independent axes.
- Replaces the misleading "MAX Evidence Strength" aggregate with Evidence Profile / Distribution.
- Adds Evidence Diversity as a separate field (breadth-of-evidence, independent of case count).
- **Classifies Evidence Confidence as a derived reporting field — NOT an independent evidence dimension, NOT an investment-weighting input.**
- Renames Capability 7 consistently to `Configuration Contract Compatibility`.
- Replaces the direct `BUILD NOW` jump with a 5-level decision ladder.
- Establishes that Coverage is a knowledge-boundary (NOT a prevalence percentage).
- Establishes that Decision Layer inputs cannot elevate weak evidence.
- Establishes that remediation attribution must be precise (per the Registry standard).
- Documents Decision-Readiness Calibration as an explicit Open Design Gap (no arbitrary thresholds).

---

## 12. Next Step (Per User Directive)

This document is a **design constraint**, now FROZEN. The user has ratified the 6 constraints and authorized building the **Capability Investment Decision Framework v1** in accordance with these constraints.

The framework will:
1. Take the Capability Evidence Registry V1 (FROZEN) as evidence input.
2. Take the Global Source Universe V1 as scope input.
3. Take the Commercial Model as strategic input.
4. Apply the 6 mandatory design constraints from this document.
5. Produce per-capability Evidence Profile + Resolution Profile + Coverage + Diversity + Decision Layer + Decision Readiness assignment (with Evidence Confidence as a derived reporting field, NOT an input).
6. NOT make automatic BUILD NOW decisions — the user makes the final manual decision per capability.
7. NOT establish decision-readiness thresholds (Open Design Gap — Section 9).

---

## 13. Document Status

**CAPABILITY_INVESTMENT_FRAMEWORK_DESIGN_CONSTRAINTS_V1 — FROZEN (design constraints ratified by user).**

Per user CONDITIONAL RATIFICATION of `da123d4` with one final correction applied:

**Evidence Confidence reclassified as derived reporting field — NOT an independent evidence dimension, NOT an investment-weighting input.**

> **Evidence Confidence is a derived reporting summary of the evidence profile, not an independent decision input and not an additional evidence dimension.**

This prevents the framework from re-introducing the overlap problem: Confidence is meaningfully derived from the Strength Profile, so treating it as an independent dimension would double-count the same evidence under two names. Decision Readiness is derived from **Evidence Profile + Coverage + Diversity** (plus Decision Layer inputs), NOT from a separate Confidence weight.

**Cumulative corrections across the document's evolution**:
1. Evidence Strength separated from Resolution Status (per `da123d4`)
2. Removed MAX aggregate; replaced with Evidence Profile / Distribution (per `da123d4`)
3. Renamed Capability 7 to `Configuration Contract Compatibility` consistently (per `da123d4`)
4. Added Evidence Diversity as a separate field (per `da123d4`)
5. Documented Decision-Readiness Calibration as Open Design Gap (per `da123d4`)
6. **Evidence Confidence reclassified as derived reporting field, NOT an independent dimension (this commit)**

**6 ratified mandatory design constraints**:
1. Four-layer separation (Evidence Layer / Decision Layer / Resolution Layer / Decision Readiness)
2. Confidence is derived; Coverage and Diversity are independent (NOT Confidence as a co-equal dimension)
3. Capability naming consistency (`Configuration Contract Compatibility`)
4. Decision Readiness ladder (NOT direct BUILD NOW)
5. No prevalence inference
6. Remediation attribution

**Explicitly ratified Open Design Gap**:
- Decision-Readiness Calibration — thresholds not yet established; no numerical transition rules authorized.

**Final status: Capability Investment Framework — Design Constraints V1 — FROZEN.**

The 6 constraints are now FROZEN and ready to govern the framework build. The user has authorized building the **Capability Investment Decision Framework v1** in accordance with these constraints.

---

## 14. Document Provenance

| Field | Value |
|-------|-------|
| Author | main (Super Z) |
| Date | 2026-08-15 |
| Branch | `top20-prescreening` |
| Status | FROZEN (design constraints ratified by user) |
| Base | Capability Evidence Registry V1 (FROZEN at `dd66cc1`) |
| Type | Design constraint document — NOT the framework |
| Evolution | `bc8c12c` (initial draft) → `da123d4` (corrected: Evidence ≠ Resolution; removed MAX; renamed Cap 7; added Diversity; Open Design Gap) → this commit (frozen: Evidence Confidence reclassified as derived reporting field) |
| Ratified constraints | 6 (Four-layer separation; Confidence is derived; Configuration Contract Compatibility naming; Decision ladder; No prevalence inference; Remediation attribution) |
| Ratified Open Design Gap | Decision-Readiness Calibration (no numerical thresholds authorized) |
| Does NOT modify | Capability Evidence Registry V1, Capability Gap Portfolio V1, Capability Survey Results V1/V1.1, Survey Protocols V1/V1.1, Queue V1/V1.1, v2 Qualification framework, pipeline/config, Contract, Commercial Model, website |
| Next step (per user directive) | Build Capability Investment Decision Framework v1 in accordance with these FROZEN constraints. |

# Commercial Source Qualification Model v1

**Date**: 2026-08-13
**Branch**: `evidence-matrix`
**Status**: Draft for approval
**Evidence base**: `7384033` → `b4fabe9` → `332788c` → `c09de13` → `c8af140` → `146aa3b` → `7710a84` → `de64f31`
**Type**: Commercial operational document — NOT a code, config, Contract, or website change

---

## 1. Purpose

Transform the question:

> "Can we ingest this source?"

Into:

> **"What level of commitment can we make for this source before starting work?"**

This model converts the pipeline's 5-gate boundary framework into a commercial decision tool that tells the buyer — before any engineering begins — what to expect.

---

## 2. Commercial Classifications

Four classifications replace the technical GREEN/YELLOW/RED/BLOCKED labels. These are written in **sales and execution language**, not pipeline language.

| Classification | Commercial Meaning |
|---------------|-------------------|
| **STANDARD** | Configuration-driven onboarding is the expected implementation path. No engineering work package required. |
| **QUALIFIED ENGINEERING** | Source is technically addressable, but onboarding requires a defined engineering work package before commitment. |
| **CONDITIONAL** | Source is accessible and processable, but publication depends on resolving a documented provenance, semantic, or coverage condition. |
| **NOT CURRENTLY SUPPORTED** | Source cannot enter production intelligence through the current pipeline path. No commitment should be made within standard engagement. |

---

## 3. Qualification Flow

```text
Source Intake
   ↓
Access Qualification (Gate 1)
   ↓
Provenance Qualification (Gate 2)
   ↓
Content Qualification (Gate 3)
   ↓
Configuration Applicability (Gate 4)
   ↓
Risk / Semantic Review (Gate 5)
   ↓
Commercial Classification
```

The earliest blocking gate determines the **initial routing decision**; final commercial classification may require root-cause review.

### Decision rules

| Earliest blocking gate | Initial routing | Rationale |
|----------------------|---------------|-----------|
| Gate 1 (Access) | **NOT CURRENTLY SUPPORTED** | Cannot reach the source without infrastructure investment (proxy, IP, auth) |
| Gate 2 (Provenance) | **CONDITIONAL** | Extraction works, but provenance incomplete — publication blocked until date path resolved |
| Gate 3 (Content) | **NOT CURRENTLY SUPPORTED** | Source is JS-rendered or content shell — requires JS execution infrastructure |
| Gate 4 (Configuration) | **QUALIFIED ENGINEERING** | Source domain not covered by existing patterns — requires pattern category extension |
| Gate 5 (First attempt) | **ROOT-CAUSE REVIEW** → routes to CONDITIONAL, QUALIFIED ENGINEERING, or NOT CURRENTLY SUPPORTED | Configuration path exists but produced 0 publishable IOs — root cause must be identified before classification |
| No failure (all gates pass) | **STANDARD** | Configuration-driven onboarding is the expected path |

### Gate 5 failure → Root-cause review

Gate 5 failure does not produce a direct commercial classification. Instead, it opens a **qualification review** that examines the root cause:

```text
Gate 5 FAIL
    ↓
ROOT-CAUSE REVIEW
    ├── provenance / publication condition
    │       → CONDITIONAL
    ├── configuration abstraction insufficient
    │       → QUALIFIED ENGINEERING
    └── unsupported / unresolved
            → NOT CURRENTLY SUPPORTED
```

This is necessary because Gate 5 failure has not been tested prospectively; its commercial behavior is not yet established.

### Special case: Gate 5 pass with Quality REVIEW

If Gate 5 passes (publishable IOs produced) but semantic review reveals ambiguous facts:

- Classification: **STANDARD** (onboarding succeeded)
- Quality status: **REVIEW** (intelligence needs human review before publication)
- These are independent dimensions — onboarding success does not guarantee semantic quality

---

## 4. What We Promise for Each Classification

### STANDARD

> Configuration-driven onboarding is the expected implementation path.

- No core pipeline modification required
- No source-specific code
- Provenance: 100% chain verification expected
- Reproducibility: expected
- Onboarding time: not yet committed (requires independent measurement)

**We do NOT promise:**
- A fixed onboarding time
- 100% extraction coverage
- Zero semantic review needed

### QUALIFIED ENGINEERING

> Source is technically addressable, but onboarding requires a defined engineering work package.

- A specific engineering scope is identified before commitment
- The buyer knows what type of engineering is needed (access infrastructure, pattern extension, extraction hardening)
- The buyer can decide whether to fund the engineering package
- No commitment to timeline until engineering scope is estimated

**We do NOT promise:**
- That engineering will succeed
- A fixed timeline
- That the source will become STANDARD after engineering

### CONDITIONAL

> Source is accessible and processable, but publication depends on resolving a documented provenance, semantic, or coverage condition.

- The pipeline CAN extract facts from the source
- The pipeline CANNOT publish IOs because a specific condition is unmet
- The condition is documented (e.g., "document_date not available via current path")
- The buyer knows exactly what is blocked and why

**We do NOT promise:**
- That the condition will be resolved
- That the source will become STANDARD after resolution
- That extraction quality is sufficient even if the condition is resolved

### NOT CURRENTLY SUPPORTED

> Source cannot enter production intelligence through the current pipeline path.

- No commitment should be made within standard engagement
- The buyer is informed of the blocker (e.g., Akamai blocking, JS rendering)
- The source may become supported in the future through infrastructure investment, but no timeline is given

**We do NOT promise:**
- That the source will ever be supported
- A workaround
- That engineering will resolve the blocker

---

## 5. Customer-Facing Information per Source

For every source submitted for qualification, the buyer receives:

| Information | Description |
|------------|-------------|
| Access path | How the source is reached (RSS, HTML, PDF, blocked) |
| Provenance path | How document_date is obtained (pubDate, dc:date, URL, config, unavailable) |
| Content format | What the content looks like (static HTML, PDF, JS-rendered, empty) |
| Configuration applicability | Whether existing pattern categories cover the source's domain |
| Expected engineering dependency | What type of engineering, if any, is needed |
| Quality review status | PASS / REVIEW / FAIL (if extraction was attempted) |
| Known blockers | Specific gates that failed, with root cause |
| Qualification decision | STANDARD / QUALIFIED ENGINEERING / CONDITIONAL / NOT CURRENTLY SUPPORTED |
| Evidence basis | Which test or screening produced this classification |

---

## 6. The Core Commercial Promise

> **"Give us your source list. We will qualify each source before we commit to implementation, and identify whether it fits the standard path or requires additional engineering review."**

This is the commercial value proposition. It sells **predictability and governance** — not unlimited ingestion.

The buyer knows:
- Which sources are expected to be STANDARD (configuration-only)
- Which sources need engineering (and what type)
- Which sources are conditional (and what condition is blocking)
- Which sources are not currently supported (and why)
- Which sources require root-cause review before a final classification

**Before any implementation work begins.**

---

## 7. Evidence Mapping

### STANDARD — demonstrated

| Source | Class | Evidence | Quality |
|--------|-------|----------|---------|
| BEA | statistical_authority | `c8af140` — first-attempt PASS, 10/10 publishable | PASS |
| SNB | central_bank | `c09de13` — first-attempt PASS, 1/1 publishable, independently reviewed (`332788c`) | PASS |
| CFTC | financial_regulator | `b4fabe9` — prospective prediction confirmed, 10/10 publishable | REVIEW |

### CONDITIONAL — demonstrated

| Source | Class | Evidence | Condition |
|--------|-------|----------|-----------|
| ESMA (RSS) | financial_regulator | `27294db` — extraction works, provenance incomplete | document_date unavailable (no pubDate, no dc:date) |
| ESMA (HTML) | financial_regulator | `8041cda` — extraction works, provenance incomplete | document_date unavailable (no date in URL) |

### NOT CURRENTLY SUPPORTED — demonstrated

| Source | Class | Evidence | Blocker |
|--------|-------|----------|---------|
| RBA | central_bank | Phase B — Akamai 403 | Access blocked |
| ARAMCO | corporate_ir | Phase B — Akamai 403 | Access blocked |
| ONS | statistical_authority | Phase B — JS-rendered | Content unavailable in static HTML |
| IMF | financial_regulator | `b4fabe9` — prospective prediction confirmed | Access blocked (Akamai 403) |
| RBNZ | central_bank | Phase B — content URLs 403 | Access partially blocked |

### QUALIFIED ENGINEERING — not yet demonstrated

No source has been classified as QUALIFIED ENGINEERING through prospective testing. This classification exists in the model because Gate 4 (pattern category) and Gate 5 (first-attempt) failures could require it, but no such case has been observed.

---

## 8. Commercial Claims We Are Authorized to Make

### Authorized

> ROUA can onboard selected official institutional sources through a governed, configuration-driven pipeline, subject to predefined access, provenance, content, and extraction constraints.

> Configuration-only onboarding has been demonstrated for 3 genuinely new sources across 3 distinct institutional classes (statistical_authority, central_bank, financial_regulator), with complete provenance, reproducibility, and 0 core code changes.

> Before any implementation work begins, ROUA can pre-screen a source against the currently observed qualification boundaries and assign an initial qualification status; cases requiring Gate 4/5 engineering judgment remain subject to validation.

> ROUA's pipeline produces Intelligence Objects with complete provenance chains (source → document → fact → evidence) and deterministic reproducibility for sources that pass the qualification gates.

> Access compatibility does not guarantee publishability. Provenance completeness is a separate gating requirement.

### Not Yet Authorized

> "ROUA supports all official sources." — Not tested; not claimed.

> "Onboarding is always configuration-only." — ESMA disproves this for the tested paths.

> "X% of sources can be onboarded automatically." — Sample too small; no success rate claimed.

> "Onboarding takes X hours." — Human onboarding time not independently measured. Pipeline runtime (2-15s) is NOT onboarding time.

> "The boundary framework is predictive." — Only 2 prospective tests; partially validated.

> "Gate 1 is the most common boundary." — Observation, not prevalence finding.

> "Extraction is case-complete across all financial domains." — B-Closure showed extraction limits (case sensitivity, deduplication); CFTC showed Quality REVIEW.

---

## 9. Relationship to Existing Documents

| Document | Role | Relationship to this model |
|----------|------|---------------------------|
| Supported Source Contract v1.0 | What ROUA supports (technical) | This model is the commercial layer above the Contract — it translates technical boundaries into buyer-facing classifications |
| Evidence Matrix V3 | What was tested (evidence) | This model is built entirely on V3's frozen evidence |
| Onboarding Boundary Analysis v1 | Decision tree (technical) | This model converts the 5-gate framework into 4 commercial classifications |
| Validation Protocol v2 | How to test a new source | This model defines what the test result means commercially |

---

## 10. What This Model Does NOT Do

- It does not replace the Supported Source Contract
- It does not modify the pipeline or any code
- It does not calculate a success rate
- It does not promise a fixed onboarding time
- It does not guarantee that STANDARD sources will have PASS intelligence quality
- It does not commit to supporting any specific source not yet tested
- It does not authorize Phase C or any new source testing

---

## Appendix: Classification Quick Reference

```
Source Intake
   ↓
Gate 1 (Access) FAIL → NOT CURRENTLY SUPPORTED
   ↓ PASS
Gate 2 (Provenance) FAIL → CONDITIONAL
   ↓ PASS
Gate 3 (Content) FAIL → NOT CURRENTLY SUPPORTED
   ↓ PASS
Gate 4 (Configuration) FAIL → QUALIFIED ENGINEERING
   ↓ PASS
Gate 5 (First attempt) FAIL → CONDITIONAL or QUALIFIED ENGINEERING
   ↓ PASS
STANDARD (Quality reported separately: PASS / REVIEW / FAIL)
```

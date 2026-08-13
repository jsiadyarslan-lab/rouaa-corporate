# Source Qualification Report v1 — Operational Template

**Date**: 2026-08-13
**Branch**: `evidence-matrix`
**Status**: Template for operational use
**Basis**: Commercial Source Qualification Model v1 (`f99e894`), Evidence Matrix V3 (`7384033`)
**Type**: Operational deliverable template — NOT code, config, Contract, or website change

---

## Purpose

A single deliverable that ROUA produces for a customer after qualifying their source list. One report per source, plus a portfolio summary.

This template is used by:
- **Solutions Architect** — fills Gates 1-4 + initial routing
- **Intelligence/Data Reviewer** — fills quality/provenance/coverage assessment
- **Commercial Lead** — fills commercial recommendation
- **Engineering** — fills engineering scope (only if Engineering Review triggered)

---

## Part A: Source Qualification Record (one per source)

```text
┌─────────────────────────────────────────────────────────────────────┐
│  SOURCE QUALIFICATION RECORD                                        │
│  Report ID: [auto-generated]                                        │
│  Date: [YYYY-MM-DD]                                                 │
│  Customer: [name]                                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SOURCE INFORMATION                                                 │
│  Source name:           [official name]                             │
│  Official URL:          [website URL]                               │
│  Feed URL:              [RSS/Atom/feed URL, or "none"]              │
│  Source class:          [central_bank / financial_regulator /       │
│                          statistical_authority / corporate_ir /     │
│                          government_regulatory / other]             │
│  Priority:              [customer-assigned: high / medium / low]    │
│  Critical workflows:    [what the customer needs from this source]  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  GATE 1 — ACCESS QUALIFICATION                                      │
│  Assessed by:           [Solutions Architect]                       │
│  Access path:           [RSS / HTML index / PDF / blocked]          │
│  Fetch method:          [urllib / Playwright / blocked]             │
│  Result:                [PASS / FAIL]                               │
│  Notes:                 [if FAIL, what is the blocker?]             │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  GATE 2 — PROVENANCE QUALIFICATION                                  │
│  Assessed by:           [Solutions Architect]                       │
│  Date source:           [<pubDate> / <dc:date> / URL pattern /      │
│                          config / not available]                    │
│  Result:                [PASS / FAIL]                               │
│  Notes:                 [if FAIL, where does the date exist?]       │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  GATE 3 — CONTENT QUALIFICATION                                     │
│  Assessed by:           [Solutions Architect]                       │
│  Content format:        [static HTML / PDF / JS-rendered / empty]   │
│  Machine-readable:      [YES / NO]                                  │
│  Result:                [PASS / FAIL]                               │
│  Notes:                 [if FAIL, what does the page contain?]      │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  GATE 4 — CONFIGURATION APPLICABILITY                               │
│  Assessed by:           [Solutions Architect]                       │
│  Pattern category:      [rate / regulatory / statistical /          │
│                          earnings / not covered]                    │
│  Result:                [PASS / FAIL]                               │
│  Notes:                 [if FAIL, what domain is not covered?]      │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  GATE 5 — FIRST-ATTEMPT VALIDATION (if Gates 1-4 PASS)             │
│  Assessed by:           [Solutions Architect + Reviewer]            │
│  Configuration created: [YES / NO / N/A]                            │
│  Publishable IOs:       [count]                                     │
│  Provenance complete:   [YES / NO]                                  │
│  Reproducible:          [YES / NO]                                  │
│  Result:                [PASS / FAIL / NOT ATTEMPTED]               │
│  If FAIL → Root-cause:  [provenance / configuration / unsupported]  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  INTELLIGENCE QUALITY ASSESSMENT (if Gate 5 attempted)              │
│  Assessed by:           [Intelligence/Data Reviewer]                │
│  Quality status:        [PASS / REVIEW / FAIL / N/A]                │
│  Semantic errors:       [count + description]                       │
│  Coverage:              [docs with facts / total docs]              │
│  Coverage notes:        [why coverage is what it is]                │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  INITIAL ROUTING                                                     │
│  Earliest blocking gate: [Gate 1 / 2 / 3 / 4 / 5 / none]           │
│  Initial routing:        [STANDARD candidate /                      │
│                           CONDITIONAL /                              │
│                           QUALIFIED ENGINEERING /                    │
│                           NOT CURRENTLY SUPPORTED /                  │
│                           ROOT-CAUSE REVIEW]                         │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ROOT-CAUSE REVIEW (if Gate 5 FAIL or routing unclear)              │
│  Reviewed by:            [Intelligence/Data Reviewer]               │
│  Root cause:             [description]                              │
│  Resolution path:        [provenance fix / config extension /       │
│                           extraction hardening / infrastructure /   │
│                           unresolved]                               │
│  Final classification:   [CONDITIONAL / QUALIFIED ENGINEERING /     │
│                           NOT CURRENTLY SUPPORTED]                  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  QUALIFICATION DECISION                                              │
│  Decided by:             [Commercial Lead + Solutions Architect]    │
│  Final classification:   [STANDARD /                                │
│                           QUALIFIED ENGINEERING /                    │
│                           CONDITIONAL /                              │
│                           NOT CURRENTLY SUPPORTED]                  │
│  Confidence:             [HIGH / MEDIUM / LOW]                      │
│  Evidence basis:         [test commit / screening / manual review]  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  COMMERCIAL RECOMMENDATION                                           │
│  Prepared by:            [Commercial Lead]                          │
│  Recommended action:     [standard onboarding /                     │
│                           scoped engineering package /              │
│                           conditional engagement /                   │
│                           do not commit]                            │
│  Required work:          [configuration / engineering scope /       │
│                           provenance resolution / infrastructure]   │
│  Dependencies:           [what else is needed before starting]      │
│  Open questions:         [unresolved items]                         │
│  Timeline estimate:      [NOT committed — requires scoping]         │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ENGINEERING SCOPE (only if QUALIFIED ENGINEERING)                  │
│  Prepared by:            [Engineering]                              │
│  Problem:                [specific technical gap]                   │
│  Required engineering:   [access infra / pattern extension /        │
│                           extraction hardening / parser work]       │
│  Risk:                   [what could go wrong]                      │
│  Dependencies:           [internal/external dependencies]           │
│  Estimate:               [scope only — no timeline until approved]  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Part B: Portfolio Summary (one per customer engagement)

```text
┌─────────────────────────────────────────────────────────────────────┐
│  SOURCE QUALIFICATION PORTFOLIO SUMMARY                             │
│  Customer: [name]                                                   │
│  Date:     [YYYY-MM-DD]                                             │
│  Prepared by: [Commercial Lead]                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PORTFOLIO COMPOSITION                                              │
│                                                                     │
│  Sources submitted:       [N]                                       │
│                                                                     │
│  STANDARD:                [N]  ([%])                               │
│  QUALIFIED ENGINEERING:   [N]  ([%])                               │
│  CONDITIONAL:             [N]  ([%])                               │
│  NOT CURRENTLY SUPPORTED: [N]  ([%])                               │
│  ROOT-CAUSE REVIEW:       [N]  ([%])                               │
│                                                                     │
│  NOTE: Percentages represent portfolio composition for THIS         │
│  customer's source list. They are NOT a general success rate.       │
│  They must NOT be used as a marketing claim.                        │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SOURCE-BY-SOURCE SUMMARY                                           │
│                                                                     │
│  #  │ Source         │ Class        │ Qualification     │ Action     │
│  ───┼────────────────┼──────────────┼───────────────────┼────────────│
│  1  │ [name]         │ [class]      │ STANDARD          │ Onboard    │
│  2  │ [name]         │ [class]      │ CONDITIONAL       │ Resolve    │
│  3  │ [name]         │ [class]      │ ENG. REVIEW       │ Scope      │
│  4  │ [name]         │ [class]      │ NOT SUPPORTED     │ Exclude    │
│  ...│                │              │                   │            │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  COMMERCIAL SCOPE                                                   │
│                                                                     │
│  Standard onboarding package:                                       │
│    Sources: [N]                                                     │
│    Work:    Configuration-driven                                    │
│    Commitment: Expected standard path                               │
│                                                                     │
│  Engineering package (if applicable):                               │
│    Sources: [N]                                                     │
│    Work:    [scope summary]                                         │
│    Commitment: Scoped after engineering assessment                  │
│                                                                     │
│  Conditional resolution (if applicable):                            │
│    Sources: [N]                                                     │
│    Blocker: [provenance / quality / coverage]                       │
│    Commitment: Conditional on resolution                           │
│                                                                     │
│  Not supported:                                                     │
│    Sources: [N]                                                     │
│    Commitment: None within standard engagement                      │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  OPERATING RULE                                                     │
│                                                                     │
│  Qualify → Evidence → Scope → Commit → Engineer                     │
│                                                                     │
│  NOT: Engineer → Hope → Explain                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Usage Rules

1. **One Source Qualification Record per source** — no batching, no skipping gates.

2. **Portfolio Summary is customer-specific** — percentages are composition, not success rate. Must not be reused for other customers or marketing.

3. **Gate 5 is only attempted if Gates 1-4 pass** — no configuration creation for sources that fail access/provenance/content.

4. **Root-Cause Review is mandatory** if Gate 5 fails — no direct classification from Gate 5 failure.

5. **Engineering does not start until Commercial Lead approves scope** — the operating rule is: Qualify → Evidence → Scope → Commit → Engineer.

6. **Timeline is never committed in the report** — timeline requires separate scoping after engineering assessment.

7. **Quality and Coverage are reported separately from Onboarding** — these are independent dimensions. A source can be STANDARD (onboarding PASS) with REVIEW quality.

8. **Evidence basis must be cited** — every qualification decision references a test commit, screening result, or manual review.

---

## Roles and Responsibilities

| Role | Fills | Does NOT do |
|------|-------|-------------|
| Sales / Account | Source Intake Register, customer priority | Technical qualification |
| Solutions Architect | Gates 1-4, initial routing | Commercial commitment |
| Intelligence / Data Reviewer | Quality assessment, root-cause review | Commercial commitment |
| Engineering | Engineering scope (only if triggered) | Qualification decision |
| Commercial Lead | Qualification decision, commercial recommendation | Technical assessment |

**No role fills another role's section.** This prevents engineers from deciding what to sell, and sales from promising what hasn't been qualified.

---

## Relationship to Evidence

This template is operational — it uses the 5-gate framework from the Boundary Analysis, the 4 classifications from the Commercial Qualification Model, and the evidence standards from Evidence Matrix V3.

It does NOT:
- Modify the pipeline
- Modify the Supported Source Contract
- Modify the website
- Create new technical claims
- Authorize new source testing

It operationalizes what has already been proven, within the boundaries of what has been established.

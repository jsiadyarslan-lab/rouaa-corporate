# Source Qualification Report v2 — Operational Template

**Date**: 2026-08-15
**Branch**: `top20-prescreening`
**Status**: FROZEN — Ready for operational use
**Basis**: Source Qualification Report Template v1 (`f5caf57`), Commercial Source Qualification Model v2 Design (`cfc16b6`), Qualification v2 Operationalization Review (`982ed2d`)
**Evidence base**: Top 20 Pre-Screening (`4443553`) + Gate 5 testing (`282de0f`, `b70171e`, `bd7285d`)
**Type**: Operational deliverable template — NOT code, config, Contract, or website change.

---

## Backward Compatibility

**v1 reports remain valid and are not rewritten.** Sources qualified under v1 methodology (Gates 1-4 → Gate 5) retain their v1 classifications. v2 adds qualification stages between Gate 4 and Gate 5 — these are applied to new sources going forward, not retroactively to v1 records.

v2 SQR stages (Content-Path Alignment, Configuration Contract Verification, Semantic Representation Assessment) are tracked within the Source Qualification Record. They are **NOT Queue states**. The Queue remains unchanged at v1.1 operational level.

---

## Purpose

A single deliverable that ROUA produces for a customer after qualifying their source list. One report per source, plus a portfolio summary.

This template is used by:
- **Solutions Architect** — fills Gates 1-4, Content-Path Alignment, Configuration Contract Verification, initial routing
- **Intelligence/Data Reviewer** — fills Semantic Representation Assessment, quality/provenance/coverage assessment, root-cause review
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
│  Template version: v2                                               │
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
│                          config / not available /                    │
│                          PENDING — depends on content access]       │
│  Result:                [PASS / FAIL / PASS WITH REVIEW / PENDING] │
│  Notes:                 [if FAIL, where does the date exist?        │
│                          if PASS WITH REVIEW, what date-source       │
│                          precedence issue is unresolved?]            │
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
│  GATE 4 — PATTERN CATEGORY APPLICABILITY                            │
│  Assessed by:           [Solutions Architect]                       │
│  Pattern category:      [rate / regulatory / statistical /          │
│                          earnings / not covered]                    │
│  Result:                [PASS / FAIL]                               │
│  Notes:                 [if FAIL, what domain is not covered?]      │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CONTENT-PATH ALIGNMENT (new in v2)                                 │
│  Assessed by:           [Solutions Architect]                       │
│  Selected source path:  [RSS feed URL / HTML index URL / PDF URL]  │
│  Expected intelligence:  [sanctions / rate decisions / consumer      │
│                          warnings / securities auctions / etc.]     │
│  Representative docs     [count sampled]                            │
│    sampled:                                                         │
│  Content type observed:  [actual content type in sampled docs]       │
│  Alignment:             [ALIGNED / NOT ALIGNED / INCONCLUSIVE]     │
│  Evidence:              [what was sampled, what was found]          │
│  Notes:                 [if NOT ALIGNED, what content type was      │
│                          found instead of expected?]               │
│                                                                     │
│  Sampling standard: representative evidence — not a fixed document  │
│  count. Default target = up to 3 documents when available.          │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CONFIGURATION CONTRACT VERIFICATION (new in v2)                    │
│  Assessed by:           [Solutions Architect]                       │
│  event_type:            [configured event_type]                     │
│  event_type supported:  [YES / NO — exists in EVENT_TYPE_RULES]    │
│  Pattern metrics         [list of normalized metrics after          │
│    (normalized):          PATTERN_TYPE_METADATA lookup]             │
│  Trigger intersection:   [metrics found in trigger_metrics]          │
│  Content keywords        [YES / NO / N/A — compatible with adapter  │
│    compatible:            document-title behavior]                  │
│  Contract compatible:    [YES / NO]                                 │
│  Confidence:            [HIGH — static contract verification only]  │
│  Notes:                 [if NO, which check failed?]               │
│                                                                     │
│  Note: HIGH confidence applies only to deterministic static          │
│  contract verification. Semantic compatibility is assessed          │
│  separately (below) at MEDIUM confidence.                           │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SEMANTIC REPRESENTATION ASSESSMENT (new in v2)                      │
│  Assessed by:           [Solutions Architect + Reviewer]            │
│  Source intelligence     [what the source produces — e.g.,           │
│    type:                 "consumer warnings about unauthorized      │
│                          financial services"]                       │
│  Matching metrics /      [which metrics match which event type's     │
│    event type:           trigger_metrics]                           │
│  Semantic fit:            [COMPATIBLE / INCONCLUSIVE /               │
│                           REPRESENTATION GAP]                       │
│  Confidence:            [MEDIUM — human judgment, not deterministic]│
│  Evidence basis:         [pattern_type → metric mapping,             │
│                           trigger_metric's role in event model,      │
│                           source's actual content type]               │
│  Notes:                 [if REPRESENTATION GAP, what intelligence   │
│                          type is not representable?]                │
│                                                                     │
│  Outcomes:                                                          │
│    COMPATIBLE → semantic fit confirmed → proceed                    │
│    INCONCLUSIVE → proceed to Gate 5 WITH SEMANTIC REVIEW            │
│    REPRESENTATION GAP → route to Engineering Review                  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  QUALIFICATION READY (v2)                                           │
│  Pre-screened:           [YES / NO — Gates 1-4 passed]             │
│  Content-path aligned:   [YES / NO]                                 │
│  Configuration            [YES / NO — contract compatible]          │
│    compatible:                                                      │
│  Semantic                [COMPATIBLE / INCONCLUSIVE / GAP]          │
│    representation:                                                  │
│  QUALIFICATION_READY:    [YES / YES WITH SEMANTIC REVIEW / NO]     │
│  Notes:                 [if NO, which stage failed?]               │
│                                                                     │
│  QUALIFICATION_READY = YES when:                                    │
│    pre-screened = YES                                               │
│    AND content-path aligned = YES                                   │
│    AND configuration compatible = YES                               │
│    AND semantic = COMPATIBLE                                        │
│                                                                     │
│  QUALIFICATION_READY = YES WITH SEMANTIC REVIEW when:               │
│    pre-screened = YES                                               │
│    AND content-path aligned = YES                                   │
│    AND configuration compatible = YES                               │
│    AND semantic = INCONCLUSIVE                                      │
│                                                                     │
│  QUALIFICATION_READY = NO when:                                     │
│    any preceding stage failed                                       │
│    OR semantic = REPRESENTATION GAP (route to Engineering Review)  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  GATE 5 — FIRST-ATTEMPT VALIDATION                                  │
│  (only if QUALIFICATION_READY = YES or YES WITH SEMANTIC REVIEW)   │
│  Assessed by:           [Solutions Architect + Reviewer]            │
│  Configuration created: [YES / NO / N/A]                            │
│  Publishable IOs:       [count]                                     │
│  Provenance complete:   [YES / NO]                                  │
│  Reproducible:          [YES / NO]                                  │
│  Result:                [PASS / FAIL / NOT ATTEMPTED]               │
│  If FAIL → Root-cause:  [content-path mismatch /                    │
│                          configuration contract failure /            │
│                          semantic representation issue /              │
│                          provenance /                                │
│                          pipeline behavior boundary /                │
│                          other]                                     │
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
│  INITIAL ROUTING (v2 — multi-stage)                                 │
│  Pre-screen stage:      [Gate 1 / 2 / 3 / 4 / PASS]                │
│  Content-path stage:    [ALIGNED / NOT ALIGNED / NOT ASSESSED]     │
│  Configuration stage:   [COMPATIBLE / NOT COMPATIBLE / NOT         │
│                          ASSESSED]                                   │
│  Semantic stage:        [COMPATIBLE / INCONCLUSIVE / GAP /          │
│                          NOT ASSESSED]                              │
│  Gate 5:                 [PASS / FAIL / NOT ATTEMPTED]               │
│  Initial routing:        [STANDARD candidate /                      │
│                           CONTENT-PATH REVIEW /                      │
│                           ENGINEERING REVIEW /                      │
│                           QUALIFIED ENGINEERING /                    │
│                           CONDITIONAL /                              │
│                           NOT CURRENTLY SUPPORTED /                  │
│                           ROOT-CAUSE REVIEW]                         │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ROOT-CAUSE REVIEW (if Gate 5 FAIL or routing unclear)              │
│  Reviewed by:            [Intelligence/Data Reviewer]               │
│  Root cause:             [description]                              │
│  Root-cause category:    [content-path mismatch /                    │
│                           configuration contract failure /           │
│                           semantic representation issue /             │
│                           provenance /                               │
│                           pipeline behavior boundary /               │
│                           unresolved]                               │
│  Resolution path:        [content-path correction /                  │
│                           config fix /                               │
│                           event-model extension /                    │
│                           provenance resolution /                    │
│                           infrastructure /                           │
│                           unresolved]                               │
│  Final classification:   [CONDITIONAL / QUALIFIED ENGINEERING /     │
│                           NOT CURRENTLY SUPPORTED]                  │
│                                                                     │
│  Note: If semantic was INCONCLUSIVE and Gate 5 failed,              │
│  root-cause review must specifically investigate whether             │
│  semantic representation was the cause.                              │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  QUALIFICATION DECISION                                             │
│  Decided by:             [Commercial Lead + Solutions Architect]    │
│                                                                     │
│  Qualification status:  [STANDARD /                                │
│                           QUALIFIED ENGINEERING /                    │
│                           CONDITIONAL /                              │
│                           NOT CURRENTLY SUPPORTED]                  │
│  (Separate from the following fields:)                              │
│                                                                     │
│  Content-path status:    [ALIGNED / NOT ALIGNED / NOT ASSESSED]     │
│  Configuration           [COMPATIBLE / NOT COMPATIBLE / NOT         │
│    compatibility:          ASSESSED]                                │
│  Semantic representation:[COMPATIBLE / INCONCLUSIVE /                │
│                          REPRESENTATION GAP / NOT ASSESSED]         │
│  Review status:         [NOT REQUIRED / ROOT-CAUSE REVIEW /          │
│                          SEMANTIC REVIEW]                           │
│                                                                     │
│  Confidence:             [HIGH / MEDIUM / LOW]                      │
│    HIGH = direct evidence from documented Gate 5 test               │
│    MEDIUM = screening + partial or retrospective evidence           │
│    LOW = inference or unresolved condition                          │
│  Evidence basis:         [test commit / screening / manual review]  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  COMMERCIAL RECOMMENDATION                                           │
│  Prepared by:            [Commercial Lead]                          │
│  Recommended action:     [standard onboarding /                     │
│                           scoped engineering package /              │
│                           conditional engagement /                   │
│                           content-path correction /                  │
│                           do not commit]                            │
│  Required work:          [configuration / engineering scope /       │
│                           provenance resolution / infrastructure /   │
│                           content-path correction]                  │
│  Dependencies:           [what else is needed before starting]      │
│  Open questions:         [unresolved items]                         │
│  Timeline estimate:      [NOT committed — requires scoping]         │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ENGINEERING SCOPE (only if QUALIFIED ENGINEERING or                │
│                     ENGINEERING REVIEW)                             │
│  Prepared by:            [Engineering]                              │
│  Problem:                [specific technical gap]                   │
│  Required engineering:   [access infra / pattern extension /        │
│                           extraction hardening / parser work /      │
│                           event-model extension]                    │
│  Routing basis:          [evidence-supported routing — NOT           │
│                           engineering-demonstrated. No work package   │
│                           has been executed.]                       │
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
│  Template version: v2                                               │
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
│  CONTENT-PATH REVIEW:     [N]  (not a classification —            │
│                                pending path correction)              │
│  ENGINEERING REVIEW:      [N]  (not a classification —              │
│                                pending representation assessment)    │
│  Open root-cause reviews: [N]  (not a classification —              │
│                                pending Gate 5 root-cause review)    │
│                                                                     │
│  NOTE: Percentages represent portfolio composition for THIS         │
│  customer's source list. They are NOT a general success rate.       │
│  They must NOT be used as a marketing claim.                        │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SOURCE-BY-SOURCE SUMMARY                                           │
│                                                                     │
│  #  │ Source         │ Class        │ Content-Path │ Config  │ Qual  │ Action     │
│  ───┼────────────────┼──────────────┼──────────────┼─────────┼───────┼────────────│
│  1  │ [name]         │ [class]      │ ALIGNED       │ COMPAT  │ STD   │ Onboard    │
│  2  │ [name]         │ [class]      │ ALIGNED       │ COMPAT  │ ENG   │ Scope      │
│  3  │ [name]         │ [class]      │ NOT ALIGNED   │ N/A     │ —     │ Path fix  │
│  4  │ [name]         │ [class]      │ ALIGNED       │ GAP     │ ENG   │ Review     │
│  ...│                │              │               │         │       │            │
│                                                                     │
│  Legend:                                                            │
│    Content-Path: ALIGNED / NOT ALIGNED / INCONCLUSIVE / N/A         │
│    Config: COMPAT (compatible) / NOT COMPAT / GAP (representation)  │
│    Qual: STD (Standard) / ENG (Engineering) / COND (Conditional) /  │
│          NCS (Not Currently Supported)                              │
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
│    Routing basis: Evidence-supported, NOT engineering-demonstrated  │
│                                                                     │
│  Content-path corrections (if applicable):                          │
│    Sources: [N]                                                     │
│    Work:    Identify correct source path                            │
│    Commitment: Conditional on path discovery                        │
│                                                                     │
│  Conditional resolution (if applicable):                            │
│    Sources: [N]                                                     │
│    Blocker: [provenance / quality / coverage]                      │
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

## Usage Rules (v2)

1. **One Source Qualification Record per source** — no batching, no skipping stages.

2. **Portfolio Summary is customer-specific** — percentages are composition, not success rate. Must not be reused for other customers or marketing.

3. **Gate 5 is only attempted if QUALIFICATION_READY = YES or YES WITH SEMANTIC REVIEW** — no executable pipeline/source configuration is created for Gate 5 until QUALIFICATION_READY is reached. Static configuration contract verification may inspect or model a proposed configuration before Gate 5 (checking event_type, trigger_metrics, content_keywords compatibility) without creating an executable pipeline configuration.

4. **Root-Cause Review is mandatory** if Gate 5 fails — no direct classification from Gate 5 failure.

5. **Engineering does not start until Commercial Lead approves scope** — the operating rule is: Qualify → Evidence → Scope → Commit → Engineer.

6. **Timeline is never committed in the report** — timeline requires separate scoping after engineering assessment.

7. **Quality and Coverage are reported separately from Onboarding** — these are independent dimensions. A source can be STANDARD (onboarding PASS) with REVIEW quality.

8. **Evidence basis must be cited** — every qualification decision references a test commit, screening result, or manual review.

9. **Content-Path Alignment requires representative sampling** — not a fixed document count. Default target = up to 3 documents when available. The standard is representativeness.

10. **Configuration Contract Verification is HIGH confidence for static checks only** — semantic compatibility is assessed separately at MEDIUM confidence.

11. **INCONCLUSIVE semantic does NOT block Gate 5** — it produces QUALIFICATION_READY WITH SEMANTIC REVIEW. If Gate 5 subsequently fails, root-cause review must investigate whether semantic representation was the cause.

12. **REPRESENTATION GAP routes to Engineering Review** — evidence-supported routing, not engineering-demonstrated. No work package has been executed.

13. **v2 stages are SQR qualification stages, NOT Queue states** — the Queue remains unchanged. Content-Path Alignment, Configuration Contract Verification, and Semantic Representation Assessment are tracked within the SQR.

---

## Roles and Responsibilities (v2)

| Role | Fills | Does NOT do |
|------|-------|-------------|
| Sales / Account | Source Intake Register, customer priority | Technical qualification |
| Solutions Architect | Gates 1-4, Content-Path Alignment, Configuration Contract Verification, initial routing | Commercial commitment, Semantic Representation Assessment (joint) |
| Intelligence / Data Reviewer | Semantic Representation Assessment (joint), quality assessment, root-cause review | Commercial commitment |
| Engineering | Engineering scope (only if triggered) | Qualification decision |
| Commercial Lead | Qualification decision, commercial recommendation | Technical assessment |

**No role fills another role's section.** This prevents engineers from deciding what to sell, and sales from promising what hasn't been qualified.

---

## Relationship to Evidence (v2)

This template is operational — it uses:
- The 5-gate framework from the Boundary Analysis v1 (preserved)
- The v2 qualification stages from the Commercial Source Qualification Model v2 Design (`cfc16b6`)
- The v2 operationalization rules from the Operationalization Review (`982ed2d`)
- The evidence standards from Evidence Matrix V3 (`7384033`)
- The Gate 5 findings from Content-Path Qualification Findings v1 (`b70171e`)
- The Configuration Contract Verification from `bd7285d`

It does NOT:
- Modify the pipeline
- Modify the Supported Source Contract
- Modify the Queue
- Modify the website
- Create new technical claims
- Authorize new source testing
- Modify v1 template (`f5caf57`)

It operationalizes what has already been proven, within the boundaries of what has been established.

---

## Backward Compatibility Note

**v1 reports remain valid and are not rewritten.** Sources qualified under v1 methodology retain their v1 classifications. The v2 template adds qualification stages (Content-Path Alignment, Configuration Contract Verification, Semantic Representation Assessment) between Gate 4 and Gate 5 — these are applied to new sources going forward.

Sources that were qualified under v1 and are already ALREADY_QUALIFIED do not need retroactive v2 assessment — they already passed Gate 5, which is the ultimate validation.

Sources that are QUALIFICATION_READY under v1 (14 sources in Queue v1.1) have NOT yet been assessed under v2 stages. Their v1 QUALIFICATION_READY status is preserved; v2 stages would be assessed before attempting Gate 5.

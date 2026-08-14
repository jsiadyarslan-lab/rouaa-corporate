# Qualification v2 Operationalization Review v1

**Date**: 2026-08-15
**Branch**: `top20-prescreening`
**Base**: `cfc16b6` (Commercial Source Qualification Model v2 — Design CLEARED)
**Type**: Impact review — documentation only. Does NOT modify any existing operational artifact.
**Status**: DRAFT FOR APPROVAL

---

## A. Current-State Mapping

### Artifact 1: Source Qualification Report Template v1 (`f5caf57`)

| Existing v1 field/section | v2 requirement | Coverage |
|---------------------------|---------------|----------|
| SOURCE INFORMATION (name, URL, feed URL, class, priority, workflows) | Retained as-is | ✅ Covered |
| GATE 1 — ACCESS QUALIFICATION (access path, fetch method, result, notes) | Retained as-is | ✅ Covered |
| GATE 2 — PROVENANCE QUALIFICATION (date source, result, notes) | Retained as-is | ✅ Covered |
| GATE 3 — CONTENT QUALIFICATION (format, machine-readable, result, notes) | Retained as-is | ✅ Covered |
| GATE 4 — CONFIGURATION APPLICABILITY (pattern category, result, notes) | **Insufficient** — v2 requires content-path alignment + configuration contract + semantic representation as separate assessments between Gate 4 and Gate 5 | ⚠️ Partially covered |
| GATE 5 — FIRST-ATTEMPT VALIDATION (config created, IOs, provenance, reproducible, result, root-cause) | Retained, but needs content-path mismatch as a root-cause category | ⚠️ Partially covered |
| INTELLIGENCE QUALITY ASSESSMENT (quality, errors, coverage, notes) | Retained as-is | ✅ Covered |
| INITIAL ROUTING (earliest blocking gate, routing) | **Insufficient** — v2 routing is multi-stage (pre-screened → content-path → config-compatible → qualification_ready) not single-gate | ❌ Missing |
| ROOT-CAUSE REVIEW (root cause, resolution path, final classification) | **Needs expansion** — must include content-path mismatch and configuration contract failure as root causes | ⚠️ Partially covered |
| QUALIFICATION DECISION (status, review status, confidence, evidence basis) | **Insufficient** — v2 separates qualification status from content-path status and configuration compatibility | ❌ Missing |
| COMMERCIAL RECOMMENDATION (action, work, dependencies, questions, timeline) | Retained, but routing vocabulary needs updating | ⚠️ Partially covered |
| ENGINEERING SCOPE (problem, engineering, risk, dependencies, estimate) | Retained, but must note "evidence-supported routing" not "demonstrated" | ⚠️ Partially covered |

**Missing v2 sections (not in v1 at all)**:
- Content-Path Alignment assessment
- Configuration Contract Verification (event_type + trigger_metrics + keywords)
- Semantic Representation Assessment
- Evidence maturity (DEVELOPMENT_VERIFIED / VALIDATION_VERIFIED / PROSPECTIVE_VALIDATED — currently only in Queue v1.1)

### Artifact 2: Onboarding Boundary Analysis v1 (`5d4cef4`)

| Existing v1 element | v2 requirement | Coverage |
|---------------------|---------------|----------|
| 5-gate decision tree (Gates 1-5) | Retained, but v2 adds stages between Gate 4 and Gate 5 | ⚠️ Partially covered |
| Gate definitions (Gates 1-4) | Retained as-is | ✅ Covered |
| Gate 4: "Existing configuration abstraction applicable" | **Insufficient** — v2 splits this into: (a) pattern category applicability, (b) content-path alignment, (c) configuration contract, (d) semantic representation | ❌ Missing |
| Gate 5: "First-attempt validation" | Retained, but root-cause categories need expansion | ⚠️ Partially covered |
| Pre-Onboarding Screening Checklist (4 questions) | **Insufficient** — v2 requires 3 additional checks after the 4 questions | ❌ Missing |
| Independent Dimensions (onboarding, provenance, quality, coverage, reproducibility, engineering) | Retained, but needs content-path status and configuration compatibility as separate dimensions | ⚠️ Partially covered |
| Boundary validation table (retrospective) | Retained; v2 evidence (BaFin PASS, US Treasury/RBI mismatch, Bundesbank/Banca d'Italia gap) not yet mapped | ❌ Missing |
| Prospective validation status | **Needs update** — Gate 4 now has prospective evidence (Top 20 pre-screening + Gate 5 testing) | ❌ Missing |

**Missing v2 elements (not in v1 at all)**:
- Content-path alignment check (does the selected path contain the assumed intelligence type?)
- Configuration contract verification (event_type + trigger_metrics static check)
- Semantic representation assessment (does the metric semantically represent the intelligence?)
- Content-path mismatch as a root-cause category
- HTML index + content_keywords interaction as a known pipeline behavior boundary
- Event-model representation gap as a classification path

---

## B. Source Qualification Report Impact

### New sections required between Gate 4 and Gate 5

```text
┌─────────────────────────────────────────────────────────────────────┐
│  CONTENT-PATH ALIGNMENT (new in v2)                                │
│  Assessed by:           [Solutions Architect]                       │
│  Selected source path:  [RSS feed URL / HTML index URL / PDF URL]  │
│  Expected intelligence:  [sanctions / rate decisions / consumer     │
│                          warnings / securities auctions / etc.]     │
│  Sampled documents:     [count]                                    │
│  Content type observed:  [actual content type in sampled docs]     │
│  Alignment:             [ALIGNED / NOT ALIGNED / INCONCLUSIVE]    │
│  Notes:                 [if NOT ALIGNED, what content type was     │
│                          found instead of expected?]              │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CONFIGURATION CONTRACT VERIFICATION (new in v2)                   │
│  Assessed by:           [Solutions Architect]                       │
│  event_type:            [configured event_type]                     │
│  event_type supported:  [YES / NO — exists in EVENT_TYPE_RULES]    │
│  Pattern metrics:        [list of normalized metrics]              │
│  Trigger intersection:   [metrics in trigger_metrics]               │
│  Keywords compatible:    [YES / NO / N/A]                          │
│  Contract compatible:    [YES / NO]                                 │
│  Notes:                 [if NO, which check failed?]               │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SEMANTIC REPRESENTATION ASSESSMENT (new in v2)                    │
│  Assessed by:           [Solutions Architect + Reviewer]            │
│  Intelligence type:      [what the source produces]                │
│  Matching event type:    [which event type the metrics match]      │
│  Semantic fit:            [COMPATIBLE / INCONCLUSIVE /              │
│                           REPRESENTATION GAP]                       │
│  Notes:                 [if REPRESENTATION GAP, what intelligence  │
│                          type is not representable?]                │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  QUALIFICATION READY (v2)                                           │
│  Pre-screened:           [YES / NO]                                 │
│  Content-path aligned:   [YES / NO]                                 │
│  Configuration compatible: [YES / NO]                              │
│  Semantic representation: [COMPATIBLE / INCONCLUSIVE / GAP]        │
│  QUALIFICATION_READY:    [YES / NO]                                 │
│  Notes:                 [if NO, which stage failed?]               │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
```

### Changes to existing sections

**GATE 5 — FIRST-ATTEMPT VALIDATION**:
- Add `Content-path mismatch` as a root-cause category (alongside provenance / configuration / unsupported)
- Add `Configuration contract failure` as a root-cause category

**INITIAL ROUTING**:
- Change from single "earliest blocking gate" to multi-stage routing:
  ```
  Pre-screen stage: Gate 1/2/3/4
  Content-path stage: aligned / not aligned
  Configuration stage: compatible / not compatible
  Semantic stage: compatible / inconclusive / gap
  Gate 5: PASS / FAIL
  ```
- Add new routing option: `CONTENT-PATH REVIEW`

**QUALIFICATION DECISION**:
- Separate fields for: qualification status, content-path status, configuration compatibility, semantic representation
- Not a single "qualification status" field

**ROOT-CAUSE REVIEW**:
- Add root-cause categories:
  - Content-path mismatch (source path contains different intelligence type)
  - Configuration contract failure (event_type or metrics don't match triggers)
  - Event-model representation gap (no semantically compatible event type)
  - Pipeline behavior boundary (HTML index + keyword filter interaction)

---

## C. Pre-Screening Methodology Impact

### New evidence requirements for each v2 stage

#### Content-Path Alignment

| Aspect | Requirement |
|--------|------------|
| Minimum evidence | Sample 1-3 documents from the selected source path (RSS feed URL, HTML index page, or PDF URL) and verify they contain the expected intelligence type |
| Confidence level | MEDIUM (content sampled, not full extraction attempted) |
| What it proves | The source path leads to the content type the patterns are designed for |
| What it does NOT prove | That extraction will produce facts, or that the event model can represent the intelligence |

#### Configuration Contract Verification

| Aspect | Requirement |
|--------|------------|
| Minimum evidence | Static check: (1) event_type exists in EVENT_TYPE_RULES, (2) at least one pattern's normalized metric (via PATTERN_TYPE_METADATA) is in the event_type's trigger_metrics, (3) content_keywords are compatible with the adapter's document-title behavior (empty keywords = no filtering; non-empty keywords must match generic title for HTML index sources) |
| Confidence level | HIGH (static verification against pipeline contract — deterministic, no ambiguity) |
| What it proves | The configuration is syntactically compatible with the pipeline contract |
| What it does NOT prove | That the metrics semantically represent the source's intelligence (that's the semantic assessment) |

#### Semantic Representation Assessment

| Aspect | Requirement |
|--------|------------|
| Minimum evidence | Human judgment: does the metric-to-trigger intersection represent a genuine semantic fit? Evidence: the pattern_type → metric mapping (from PATTERN_TYPE_METADATA), the trigger_metric's role in the event model, and the source's actual content type |
| Confidence level | MEDIUM (human judgment, not deterministic) |
| What it proves | The configuration is semantically meaningful, not just syntactically compatible |
| What it does NOT prove | That Gate 5 will pass (extraction may still fail, or quality may be insufficient) |
| Possible outcomes | COMPATIBLE (semantic fit confirmed), INCONCLUSIVE (needs Gate 5 evidence), REPRESENTATION GAP (no existing metric/event type semantically fits) |

### Updated pre-screening checklist (v2)

The v1 checklist has 4 questions. v2 adds 3 more:

```text
v1 questions (retained):
1. Can we fetch it? (Gate 1)
2. Can we get the date? (Gate 2)
3. Is there machine-readable substantive content? (Gate 3)
4. Does the existing configuration abstraction apply? (Gate 4 — pattern category)

v2 additional questions:
5. Does the selected source path contain the expected intelligence type? (Content-Path Alignment)
6. Is the event_type supported AND do pattern metrics match trigger_metrics? (Configuration Contract)
7. Do the matching metrics semantically represent the source's intelligence? (Semantic Representation)
```

If all 7 pass (with semantic = COMPATIBLE or INCONCLUSIVE) → QUALIFICATION_READY (v2) → proceed to Gate 5.
If semantic = INCONCLUSIVE → QUALIFICATION_READY WITH SEMANTIC REVIEW (proceed to Gate 5, but root-cause review investigates semantic representation if Gate 5 fails).

If 5 = NO → CONTENT-PATH REVIEW (find the correct path or reclassify).

If 6 = NO → CONFIGURATION REVIEW (check event_type + trigger_metrics; if fixable by config, fix; if not, route to Engineering Review).

If 7 = REPRESENTATION GAP → Engineering Review (evidence-supported routing, not engineering-demonstrated).

---

## D. State-Machine Impact

### v1 state machine (from Queue v1.1)

```text
DISCOVERY_ONLY → SCREENING_ONLY → QUALIFICATION_READY → (Gate 5) → ALREADY_QUALIFIED / KNOWN_BLOCKED
```

### v2 proposed state machine

```text
DISCOVERY_ONLY
    ↓ (Gates 1-4 pre-screening)
SCREENED (pre-screened — passed Gates 1-4)
    ↓ (content-path alignment check)
CONTENT-PATH ALIGNED
    ↓ (configuration contract verification)
CONFIGURATION-COMPATIBLE
    ↓ (semantic representation assessment)
QUALIFICATION_READY (v2)
    ↓ (Gate 5 first-attempt validation)
ALREADY_QUALIFIED / CONTENT-PATH REVIEW / ENGINEERING REVIEW / NOT CURRENTLY SUPPORTED
```

### Which states are statuses vs classifications

| State | Type | Rationale |
|-------|------|-----------|
| DISCOVERY_ONLY | **Status** (queue state) | Source identified but not screened |
| SCREENED | **Status** (queue state) | Pre-screening complete (Gates 1-4) |
| CONTENT-PATH ALIGNED | **Status** (qualification stage) | Content-path verified |
| CONFIGURATION-COMPATIBLE | **Status** (qualification stage) | Contract verified |
| QUALIFICATION_READY (v2) | **Status** (queue state) | All pre-Gate-5 checks complete |
| ALREADY_QUALIFIED | **Status** (queue state) | Gate 5 PASS — publishable IOs produced |
| CONTENT-PATH REVIEW | **Classification** (routing) | Content-path mismatch — needs path correction |
| ENGINEERING REVIEW | **Classification** (routing) | Representation gap — needs model assessment |
| NOT CURRENTLY SUPPORTED | **Classification** (commercial) | Cannot onboard with current pipeline |
| KNOWN_BLOCKED | **Status** (queue state) | Source-level access block (HTTP 403) |
| SCREENING_ONLY | **Status** (queue state) | Prior screening evidence but unresolved access |

**Key distinction**: CONTENT-PATH ALIGNED, CONFIGURATION-COMPATIBLE, and QUALIFICATION_READY are **statuses** (they track where a source is in the qualification process). CONTENT-PATH REVIEW, ENGINEERING REVIEW, and NOT CURRENTLY SUPPORTED are **classifications** (they determine what happens next commercially).

---

## E. Evidence Requirements (per v2 stage)

### PRE-SCREENED (Gates 1-4)

| Aspect | Value |
|--------|-------|
| Minimum evidence | HTTP probe results (Gate 1), provenance metadata inspection (Gate 2), static HTML content inspection (Gate 3), pattern category assessment (Gate 4) |
| Confidence level | MEDIUM (screening evidence, not Gate 5 confirmed) |
| What it proves | Source is accessible, has provenance, has content, pattern category exists |
| What it does NOT prove | Content-path alignment, configuration compatibility, or Gate 5 success |

### CONTENT-PATH ALIGNED

| Aspect | Value |
|--------|-------|
| Minimum evidence | Sample enough representative documents from the selected source path to establish content-path alignment; default target = up to 3 documents when available. The standard is representativeness, not a fixed count — some RSS feeds may provide multiple document types, while other sources may offer only one suitable sample. |
| Confidence level | MEDIUM (sampled, not exhaustive) |
| What it proves | The selected source path leads to the content type the patterns are designed for |
| What it does NOT prove | That extraction will produce facts, or that the event model can represent the intelligence |

### CONFIGURATION-COMPATIBLE

| Aspect | Value |
|--------|-------|
| Minimum evidence | Static check: event_type in EVENT_TYPE_RULES, at least one normalized metric in trigger_metrics, content_keywords compatible with adapter behavior |
| Confidence level | HIGH (deterministic static verification — no ambiguity) |
| What it proves | The configuration is syntactically compatible with the pipeline contract |
| What it does NOT prove | Semantic correctness (a metric may be in trigger_metrics without semantically fitting) |

### SEMANTIC REPRESENTATION ASSESSMENT

| Aspect | Value |
|--------|-------|
| Minimum evidence | Human judgment based on: pattern_type → metric mapping, trigger_metric's role in event model, source's actual content type |
| Confidence level | MEDIUM (human judgment, not deterministic) |
| What it proves | The configuration is semantically meaningful |
| What it does NOT prove | Gate 5 success |
| Possible outcomes | COMPATIBLE, INCONCLUSIVE (needs Gate 5 evidence), REPRESENTATION GAP |

### QUALIFICATION_READY (v2)

| Aspect | Value |
|--------|-------|
| Minimum evidence | All 4 pre-Gate-5 stages passed (pre-screened + content-path aligned + configuration-compatible + semantic representation compatible or inconclusive) |
| Confidence level | MEDIUM (pre-Gate-5 checks complete; no probability of success claimed) |
| What it proves | All known pre-Gate-5 compatibility checks have been completed |
| What it does NOT prove | Gate 5 PASS (unknown factors may still cause failure) |

### GATE 5 (first-attempt validation)

| Aspect | Value |
|--------|-------|
| Minimum evidence | Pipeline run: configuration created, documents fetched, facts extracted, events detected, evidence built, provenance chains verified, IOs generated, reproducibility tested |
| Confidence level | HIGH (direct execution evidence) |
| What it proves | Whether config-only onboarding produces publishable IOs |
| What it does NOT prove | Intelligence quality (separate dimension), coverage breadth, or long-term stability |

---

## F. Change Specification (proposed, NOT applied)

### Changes to Source Qualification Report Template v1

**Add 4 new sections** between Gate 4 and Gate 5:
1. CONTENT-PATH ALIGNMENT (source path, expected intelligence, sampled docs, content type observed, alignment result)
2. CONFIGURATION CONTRACT VERIFICATION (event_type, supported?, pattern metrics, trigger intersection, keywords compatible, contract compatible)
3. SEMANTIC REPRESENTATION ASSESSMENT (intelligence type, matching event type, semantic fit: COMPATIBLE/INCONCLUSIVE/REPRESENTATION GAP)
4. QUALIFICATION READY (v2) (pre-screened, content-path aligned, configuration compatible, semantic representation, QUALIFICATION_READY: YES/NO)

**Modify 3 existing sections**:
1. GATE 5 — add content-path mismatch and configuration contract failure as root-cause categories
2. INITIAL ROUTING — change from single "earliest blocking gate" to multi-stage routing (pre-screen / content-path / configuration / semantic / Gate 5)
3. ROOT-CAUSE REVIEW — add content-path mismatch, configuration contract failure, event-model representation gap, and pipeline behavior boundary as root-cause categories

**Add to QUALIFICATION DECISION**:
- Content-path status (ALIGNED / NOT ALIGNED / NOT ASSESSED)
- Configuration compatibility (COMPATIBLE / NOT COMPATIBLE / NOT ASSESSED)
- Semantic representation (COMPATIBLE / INCONCLUSIVE / REPRESENTATION GAP / NOT ASSESSED)

### Changes to Onboarding Boundary Analysis v1

**Add 3 new checks** to the Pre-Onboarding Screening Checklist (questions 5-7):
5. Does the selected source path contain the expected intelligence type?
6. Is the event_type supported AND do pattern metrics match trigger_metrics?
7. Do the matching metrics semantically represent the source's intelligence?

**Add new gate-stage descriptions** between Gate 4 and Gate 5:
- Content-Path Alignment stage (what it checks, how to assess, what evidence is needed)
- Configuration Contract Verification stage (static checks, no pipeline run)
- Semantic Representation Assessment stage (human judgment, possible outcomes)

**Update the decision tree** to include the new stages:
```
Gate 4 PASS
   ↓
Content-Path Alignment
   ├── NOT ALIGNED → CONTENT-PATH REVIEW
   ↓ ALIGNED
Configuration Contract Verification
   ├── NOT COMPATIBLE → Semantic Representation Assessment
   │       ├── REPRESENTATION GAP → ENGINEERING REVIEW
   │       └── INCONCLUSIVE → proceed with caution
   ↓ COMPATIBLE
QUALIFICATION_READY (v2)
   ↓
Gate 5
```

**Update the boundary validation table** to include Top 20 pre-screening + Gate 5 evidence (BaFin PASS, US Treasury/RBI mismatch, Bundesbank/Banca d'Italia gap).

**Update prospective validation status**: Gate 4 now has prospective evidence (Top 20 pre-screening + Gate 5 testing). Gate 5 has 1 PASS (BaFin) and 2 content-path mismatches.

---

## G. Backward Compatibility

### v1 historical records

| Record type | v2 impact | Backward compatible? |
|-------------|----------|-------------------|
| ALREADY_QUALIFIED sources (12 in Queue v1.1) | v2 adds new stages, but ALREADY_QUALIFIED sources already passed Gate 5 — they don't need retroactive v2 assessment | ✅ Yes — v1 records remain valid; v2 stages are forward-looking |
| Top 20 pre-screening SQRs (20 records at `4443553`) | Pre-screening was done under v1 methodology (Gates 1-4 only); v2 adds content-path + config + semantic stages not assessed during pre-screening | ✅ Yes — v1 SQRs are historical evidence; v2 stages would be added in future assessments, not retroactively |
| Gate 5 records (pilot, re-run, re-run 2) | Gate 5 testing produced evidence that informed v2 design; the records are historical evidence, not v2 assessments | ✅ Yes — Gate 5 records remain as evidence; v2 doesn't reclassify them |
| Queue v1.1 (state transitions at `001d349`) | v2 introduces new states (CONTENT-PATH ALIGNED, CONFIGURATION-COMPATIBLE) but these are forward-looking — existing queue states remain valid | ✅ Yes — Queue v1.1 states are not rewritten; v2 states would be added in Queue v2 if approved |
| Evidence Matrix V3 (`7384033` — FROZEN) | v2 does not modify frozen evidence | ✅ Yes — frozen evidence is not rewritten |
| Supported Source Contract v1.0 | v2 does not modify the Contract | ✅ Yes |

**Principle**: v2 adds stages forward — it does not reclassify or rewrite historical evidence. Existing v1 records remain interpretable under v1 methodology. v2 assessments are applied to new sources going forward.

---

## H. Operational Readiness

### Can v2 be operationalized after these changes?

**Yes, with caveats:**

1. **Template changes are mechanical** — adding 4 new sections and modifying 3 existing sections in the SQR template is straightforward documentation work.

2. **Pre-screening methodology changes are procedural** — adding 3 questions to the checklist and defining how to assess content-path alignment requires a methodology update, not code changes.

3. **Configuration contract verification is static** — it can be performed by checking `EVENT_TYPE_RULES` and `PATTERN_TYPE_METADATA` without running the pipeline. No new tooling is needed.

4. **Semantic representation assessment requires human judgment** — this cannot be automated. It requires a Solutions Architect or Reviewer to assess whether the metric-to-trigger intersection is semantically meaningful. This is a process change, not a technical change.

### Unresolved design questions

1. **Should CONTENT-PATH ALIGNED and CONFIGURATION-COMPATIBLE be queue states or SQR-only fields?** If queue states, Queue v1.1 needs to be updated to v2. If SQR-only fields, the queue remains at v1.1 and the SQR carries the additional information.

   *Recommendation*: Start as SQR-only fields (no Queue change). If operational experience shows they need to be tracked at the queue level, promote to queue states in a future Queue v2.

2. **Should the Semantic Representation Assessment be a gate or a classification?** The v2 design says "not a gate" — but operationally, if it produces REPRESENTATION GAP, the source is routed to Engineering Review. This looks like a gate in practice, even if it's called an "assessment."

   *Recommendation*: Keep as "assessment" (not a gate) because the outcome is not binary (PASS/FAIL) but tri-state (COMPATIBLE / INCONCLUSIVE / REPRESENTATION GAP). Gates are binary; assessments can have intermediate states.

3. **What happens when INCONCLUSIVE semantic representation is followed by Gate 5 FAIL?** If semantic fit was inconclusive and Gate 5 fails, does the root-cause review treat it as a semantic gap or as an unknown failure?

   *Recommendation*: If Gate 5 fails and semantic was INCONCLUSIVE, root-cause review should specifically investigate whether the semantic representation was the cause. This is a process rule, not a model change.

4. **How many documents should be sampled for content-path alignment?** The v2 design says "1-3" — is this sufficient?

   *Recommendation*: Start with 3 (provides enough variety to detect content-type mismatch without excessive probing). Refine based on operational experience.

---

## Final Status

**Qualification v2 Operationalization Review — DRAFT FOR APPROVAL**

This document identifies exactly what needs to change in the two v1 operational artifacts (SQR Template and Boundary Analysis) to operationalize v2. No changes have been applied. The change specification in Section F is a proposal, not an implementation.

### What is needed to proceed

1. User approves this review
2. User authorizes specific changes to the SQR Template (Section F.1)
3. User authorizes specific changes to the Boundary Analysis (Section F.2)
4. Changes are applied as a new version (v2) of each artifact
5. Queue remains at v1.1 (v2 states start as SQR-only fields)

### What is NOT needed to proceed

- No pipeline changes
- No code changes
- No config changes
- No Queue changes
- No Contract changes
- No website changes
- No source probing
- No Gate 5 execution

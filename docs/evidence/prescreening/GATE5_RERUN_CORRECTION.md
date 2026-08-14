# Gate 5 Re-run — Correction to Summary

**Date**: 2026-08-15
**Corrects**: `GATE5_RERUN_SUMMARY.md` (committed at `f7004ac`)
**Branch**: `top20-prescreening`

---

## Purpose

User review of `f7004ac` identified three errors in the re-run summary's interpretation. This document corrects the summary without remediating the source configs or modifying the pipeline.

---

## Error 1: Banca d'Italia Did Not Fail Gate 1 or Gate 3

### What the summary said

The summary's per-gate prediction accuracy table stated:

> Gate 1 (Access): 4 PASS + 1 FAILED (content_keywords filter) — ⚠️ 4/5 confirmed
> Gate 3 (Content): 4 PASS + 1 FAILED (0 docs fetched) — ⚠️ 4/5 confirmed

### Why this is wrong

Banca d'Italia's pre-screening predicted Gate 1 PASS and Gate 3 PASS. In the Gate 5 re-run:

- **Gate 1 (Access)**: The HTML index page was successfully fetched (HTTP 200, 113,816 bytes). Gate 1's prediction was **CONFIRMED** — the source was accessible.
- **Gate 3 (Content)**: Pre-screening verified that the source has substantive content (PDF press releases with dates). Gate 3's prediction was about the *existence* of substantive content, which was confirmed during pre-screening.
- **Gate 5 failure cause**: The pipeline's content_keywords filtering discarded all HTML index documents *before* fetching their content, because HTML index documents receive generic titles (e.g., "BANCA_D_ITALIA Action") that don't match the configured keywords. This is a **pipeline behavior boundary** — an interaction between HTML index parsing, title generation, and keyword filtering — not an access or content failure.

### Corrected classification

```text
Banca d'Italia Gate 5 result:

  Gate 1 (Access):     PASS predicted → PASS actual → CONFIRMED ✓
  Gate 3 (Content):    PASS predicted → PASS actual (content exists) → CONFIRMED ✓
  Gate 5 (Onboarding): FAILED at fetch step — content_keywords filter discarded
                       all documents before content fetch

  Root cause: pipeline behavior boundary (HTML index + generic title + keyword filter)
  Classification: NOT a Gate 1 failure
                 NOT a Gate 3 failure
                 NOT an engineering failure
                 NOT a config authoring issue in the simple sense

  This is a pipeline behavior boundary: pre-screening Gate 3 verified content
  exists, but Gate 5 encountered an ordering/interaction in the pipeline that
  prevents reaching the content. The keyword filter is applied BEFORE content
  fetch for HTML index sources, using only the generic title. This is distinct
  from "config authoring" because the issue is the pipeline's interaction model,
  not the pattern definitions.
```

### Corrected per-gate prediction accuracy

| Gate | Predicted PASS | Actual | Correct? |
|------|---------------|--------|----------|
| Gate 1 (Access) | 5 PASS | 5 PASS (all sources accessed) | ✅ 5/5 confirmed |
| Gate 3 (Content) | 5 PASS | 5 PASS (all sources have content; Banca d'Italia content exists but wasn't reached due to pipeline behavior) | ✅ 5/5 confirmed |
| Gate 4 (Applicability) | 5 candidate | 4 extracted facts (Banca d'Italia prevented from reaching extraction by upstream filter) | ✅ 4/5 reached extraction; 1 blocked by pipeline behavior, not by Gate 4 prediction error |

---

## Error 2: Event-Type Mismatch Is Not Just "Config Authoring"

### What the summary said

The summary classified the event_type mismatch as a "config authoring issue" and suggested it was easily fixable:

> This is a configuration-level issue. The event_type values should use the detector's supported names.

### Why this is incomplete

The event_type mismatch reveals a **structural gap** in the qualification model, not just a naming error. The current pre-screening framework (Gates 1-4) does not assess whether the source's content type can be represented by the pipeline's event model.

The pipeline's event detector supports 6 event types:
- `monetary_policy_decision`
- `regulatory_enforcement`
- `statistical_release`
- `earnings_release`
- `sanctions_designation`
- `market_statistic_release`

The 5 Gate 5 sources produce content that doesn't cleanly map to these 6 types:
- US Treasury press releases (general fiscal policy, speeches) → no matching event type
- Bundesbank securities auction announcements → no matching event type (closest: `statistical_release` or `market_statistic_release`)
- Banca d'Italia securities auctions (BOT/BTP) → no matching event type
- RBI monetary policy operations (VRRR auctions, SGB redemption) → closest: `monetary_policy_decision`, but RBI's content is operations, not decisions
- BaFin consumer warnings → closest: `regulatory_enforcement`, but the content is warnings, not enforcement actions

This means **even with correct extraction patterns and facts extracted, the pipeline cannot produce IOs if the source's intelligence type doesn't match the existing event model**. This is not a naming issue — it's an **event-model applicability gap**.

### The new layer this reveals

```text
Source Access (Gate 1)
       ↓
Content Access (Gate 3)
       ↓
Extraction Applicability (Gate 4)
       ↓
Event-Model Applicability   ← NEW GAP REVEALED BY GATE 5
       ↓
Evidence
       ↓
Provenance
       ↓
IO
```

Pre-screening (Gates 1-4) covers the first three layers. Gate 5 revealed that the fourth layer — event-model applicability — is NOT assessed during pre-screening. The qualification process doesn't know in advance whether the source's intelligence type can be represented by the pipeline's event model.

### Why this matters

This is distinct from "config authoring" because:
1. The event types are hardcoded in the detector's `EVENT_TYPE_RULES` dict (data, but structural data)
2. Adding a new event type requires adding a new entry with trigger_metrics, headline_template, summary_metrics, and subtype logic — this is more than renaming a config field
3. The config author cannot simply "use the right name" if no supported event type matches the source's content
4. This is a **model coverage** question, not a **config naming** question

---

## Error 3: "Gate 4 Predicts Extraction 4/5" Is Slightly Stronger Than the Evidence

### What the summary said

> Gate 4 "candidate applicability" correctly predicted extraction for 4/5 sources.

### Why this is imprecise

Banca d'Italia was prevented from reaching extraction by an upstream pipeline behavior (content_keywords filter). We don't know whether Gate 4's prediction was correct for Banca d'Italia because extraction was never attempted. The 5th source wasn't a Gate 4 prediction failure — it was a pipeline behavior boundary that prevented testing Gate 4's prediction.

### Corrected statement

> **Among the five sampled QUALIFICATION_READY sources, four reached successful fact extraction when given patterns derived from pre-screening evidence; one was prevented from reaching extraction by an upstream content-keyword filtering behavior.**

This is a diagnostic finding (good evidence that extraction works for the 4 that reached it), but not yet a strict predictive validation (we don't know about the 5th because it was blocked upstream).

---

## Corrected Gate 5 Assessment

### What Gate 5 proved

1. **Extraction abstraction works**: 4 sources extracted 61 facts with patterns derived from pre-screening evidence. No engineering needed.
2. **Pipeline behavior boundary identified**: HTML index sources with content_keywords filtering can lose all documents before content fetch — a pipeline interaction issue, not a config or engineering issue.
3. **Event-model applicability gap identified**: even with facts extracted, IO production requires the source's content type to match the detector's 6 supported event types. Pre-screening does not assess this.
4. **No engineering needed**: 0 source-specific code, 0 core changes for all 5 sources. All issues are at the configuration/model layer.

### What Gate 5 did NOT prove

- ❌ Did NOT prove that QUALIFICATION_READY sources can produce publishable IOs (0/5 produced IOs)
- ❌ Did NOT prove that config-only onboarding is sufficient for IO production
- ❌ Did NOT provide strict predictive validation (1 source blocked upstream; all 5 blocked at event detection)

### Corrected prediction assessment

```text
QUALIFICATION_READY predictions = 5
Gate 5 PASS (publishable IOs)              = 0
Gate 5 FAIL                                 = 5
  - 4 reached extraction but stopped at event detection (event-model gap)
  - 1 prevented from reaching extraction (pipeline behavior boundary)
Prediction confirmed                         = 0
Prediction overturned                        = 0 (all blocked, none disproven)
Config-only                                  = 5 (no engineering)
Engineering-required                        = 0
```

Note: "Prediction overturned = 0" because none of the 5 sources were *disproven* — they were all *blocked* at layers not assessed during pre-screening. The QUALIFICATION_READY prediction was not wrong; it was incomplete.

---

## Two Layers Revealed by Gate 5

Gate 5 revealed that there are at least **two distinct layers** between pre-screening and publishable IOs that are NOT currently assessed:

### Layer A: Pattern applicability

- **Assessed?**: Partially — Gate 4 assesses category-level applicability, not pattern-level
- **Gate 5 evidence**: 4/5 sources extracted facts with minimum valid patterns (good evidence this layer is testable)
- **Nature**: Configuration-level (patterns are regex data in config)
- **Status**: Promising — extraction works when patterns are provided

### Layer B: Event-model applicability

- **Assessed?**: NOT assessed during pre-screening
- **Gate 5 evidence**: 0/5 sources produced events because config event_types don't match detector's supported event types
- **Nature**: Model-level (the detector supports 6 fixed event types; sources produce content that may not match any)
- **Status**: Gap identified — this is the primary blocker for IO production

### Relationship between the layers

These are **distinct layers**, not a single gap:
- Pattern applicability = "can the extractor find facts in this content?" (regex matching)
- Event-model applicability = "can the detector classify the source's intelligence into an existing event type?" (semantic matching)

A source could pass pattern applicability (facts extracted) but fail event-model applicability (no matching event type) — which is exactly what happened for 4/5 sources.

---

## What This Means for the Qualification Model

The current model has:

```text
PRE-SCREENED (Gates 1-4)
       ↓
QUALIFICATION_READY
       ↓
Gate 5 (first-attempt validation)
       ↓
PUBLISHABLE or FAIL
```

Gate 5 revealed that QUALIFICATION_READY → PUBLISHABLE is not a single step. There are intermediate states:

```text
PRE-SCREENED
QUALIFICATION_READY
PATTERN-READY (extraction patterns defined and tested)
EVENT-READY (event type matches detector's model)
PUBLISHABLE (IOs produced, provenance complete, reproducible)
```

However, **before redefining the model**, the following must be verified:
1. Were the 34 patterns truly "minimum valid configuration" or were they inconsistently authored?
2. Were the event_type values derived from pre-screening evidence or arbitrarily chosen?
3. Could different event_type choices have produced events for any of the 5 sources?

This verification is the **next step before any model change**.

---

## Constraints

- ❌ No Gate 4.5 added (premature — two distinct layers identified, not one)
- ❌ No pipeline changes (no engineering)
- ❌ No source remediation (the 5 configs stand as-is)
- ❌ No Qualification Model v2 yet (need to verify config quality first)
- ✅ Corrected the summary interpretation only
- ✅ Gate 5 remains NOT CLEARED (0/5 produced IOs)

---

## Final Status

**Gate 5 Re-run = VALID EVIDENCE, but Gate 5 remains NOT CLEARED.**

The test produced real diagnostic value:
- 4/5 sources reached extraction with valid patterns (extraction abstraction confirmed)
- 1 source blocked by pipeline behavior boundary (HTML index + content_keywords)
- 5/5 blocked at event detection (event-model applicability gap)

Two distinct layers revealed:
1. Pattern applicability (partially testable, promising)
2. Event-model applicability (not assessed, primary blocker)

Next step: review the 5 G5VR records to verify the 34 patterns and event_types were truly "minimum valid configuration" consistent with the pipeline contract, before deciding whether to refine the Qualification Model.

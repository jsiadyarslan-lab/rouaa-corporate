# Content-Path Qualification Findings v1

**Date**: 2026-08-15
**Branch**: `top20-prescreening`
**Base**: `282de0f` (Gate 5 Re-run 2)
**Type**: Findings document — no pipeline changes, no config changes, no new gates.

---

## Purpose

Document a new boundary discovered during Gate 5 testing: the current pre-screening framework (Gates 1-4) does not verify that the **source path selected for extraction** contains the **intelligence type** that the **patterns are designed to extract**.

This finding links three observed cases from Gate 5 Re-run 2 and defines the boundary precisely, without proposing a solution.

---

## The Three Cases

### Case 1: BaFin — PASS (correct path + correct content type)

```text
RSS path: /EN/service/rss/_function/RSS_Presse.xml
→ content type: consumer warnings about unauthorized financial services
→ patterns: regulatory_patterns (action_type, violation_type, penalty_amount, entity_name)
→ event type: regulatory_enforcement (supported, trigger_metrics match)
→ result: 52 facts, 9 events, 52 evidence, 52 provenance, 9 publishable IOs
→ classification: config-only, 0 engineering, reproducible, quality=accept
```

**Why it worked**: The RSS feed path contains exactly the content type that the patterns are designed to extract. Consumer warnings about unauthorized services contain violation types, action types, and entity names — matching the regulatory_patterns. The event type (`regulatory_enforcement`) is supported by the detector, and the normalized metrics match its trigger_metrics.

**Alignment**:
```
source path → content type → pattern type → event type → IO
     ✅           ✅              ✅            ✅        ✅
```

### Case 2: US Treasury — MISMATCH (accessible path, wrong intelligence content)

```text
HTML index path: /news/press-releases
→ content type: general fiscal policy speeches, readouts, testimonies
→ patterns: sanctions_patterns (designated_entity, sanctions_program, action_type)
→ event type: sanctions_designation (supported, trigger_metrics match)
→ result: 4 facts extracted (all usd_amount — dollar amounts from speeches), 0 events
→ classification: config-only, 0 engineering, NOT publishable
```

**Why it failed**: The press releases listing at `/news/press-releases` contains general fiscal policy content (speeches by the Secretary, manufacturing renaissance announcements, readouts), not OFAC sanctions designations. The sanctions patterns (designed for SDN List entries with entity names, country names, and sanctions program codes) didn't match because the content doesn't contain sanctions designations.

The patterns are correct for sanctions content. The event type is correct. The extraction abstraction works. But the **source path** doesn't lead to the **intelligence type** the patterns expect.

**Alignment**:
```
source path → content type → pattern type → event type → IO
     ✅           ❌              ✅            ✅        ❌
               (path leads to       (patterns are        (event type is
                fiscal speeches,     correct for           correct for
                not sanctions        sanctions)            sanctions)
                designations)
```

**The mismatch**: US Treasury DOES publish sanctions designations — but on a different path (`/recent-actions` or OFAC-specific pages), not on the general press releases listing. Pre-screening verified the source is accessible and has content, but the specific path selected (`/news/press-releases`) contains a different content type than assumed.

### Case 3: RBI — MISMATCH (accessible path, wrong intelligence content)

```text
RSS path: rbi.org.in/pressreleases_rss.xml
→ content type: operational announcements (SGB redemption, securities auctions, monetary penalties)
→ patterns: rate_patterns (repo rate, reverse repo rate, MSF, VRRR operations)
→ event type: monetary_policy_decision (supported, trigger_metrics match via extractor normalization)
→ result: 1 fact (inr_amount_crore from securities auction), 0 events
→ classification: config-only, 0 engineering, NOT publishable
```

**Why it failed**: The press releases RSS feed contains operational announcements, not monetary policy rate decisions. The rate patterns (designed for "repo rate at X%", "maintained the policy rate") didn't match because the content doesn't contain rate decision text.

RBI DOES publish monetary policy rate decisions — but in a separate section (Monetary Policy Committee statements), not in the general press releases RSS feed. Pre-screening verified the source is accessible and has content, but the specific RSS feed selected (`pressreleases_rss.xml`) contains operational content, not rate decisions.

**Alignment**:
```
source path → content type → pattern type → event type → IO
     ✅           ❌              ✅            ✅        ❌
               (RSS feed leads      (patterns are        (event type is
                to operational       correct for           correct for
                announcements,       rate decisions)       rate decisions)
                not rate decisions)
```

**The mismatch**: RBI has 6 RSS feeds (press releases, notifications, speeches, publications, annual reports, tenders). Pre-screening identified the press releases feed, but the rate decisions are in a different content section (MPC statements), not in the press releases feed.

---

## The Boundary

### What pre-screening currently verifies

```text
Gate 1: Is the source accessible?                    → YES (HTTP 200)
Gate 2: Is provenance metadata available?            → YES (dates in RSS/HTML)
Gate 3: Is substantive content present?              → YES (static HTML with text)
Gate 4: Does a pattern category appear applicable?    → YES (PATTERN_TYPE_METADATA exists)
```

### What pre-screening does NOT verify

```text
[NEW OBSERVED BOUNDARY]
Content-Path ↔ Intelligence-Type Alignment

Does the specific source path selected for extraction
contain the intelligence type that the patterns are
designed to extract?
```

### The boundary visualized

```text
Gate 1 (Access)
   ↓
Gate 2 (Provenance)
   ↓
Gate 3 (Content existence)
   ↓
Gate 4 (Pattern/category applicability)
   ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT-PATH ↔ INTELLIGENCE-TYPE ALIGNMENT  ← NEW BOUNDARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ↓
Configuration contract (event_type + trigger_metrics)
   ↓
Event detection
   ↓
Evidence / Provenance / IO
```

### Why this is distinct from Gate 4

Gate 4 asks: "Does a configuration abstraction exist that can match this source?" — this is a **category-level** question about the pattern type (e.g., PATTERN_TYPE_METADATA, central_bank class).

The content-path boundary asks: "Does the **specific path** we selected contain the **specific content type** that these patterns are designed for?" — this is a **path-level** question about content alignment.

A source can:
- Pass Gate 4 (pattern category applicable) ✅
- Fail content-path alignment (the selected path leads to a different content type) ❌

This is exactly what happened with US Treasury and RBI:
- US Treasury: Gate 4 PASS (sanctions patterns applicable to Treasury as an institution) → content-path mismatch (press releases ≠ sanctions actions)
- RBI: Gate 4 PASS (rate patterns applicable to RBI as a central bank) → content-path mismatch (press releases RSS ≠ MPC statements)

### Why this is distinct from the configuration contract

The configuration contract (event_type + trigger_metrics) is about **whether the extracted metrics match the detector's event model**. This was the issue identified for Bundesbank/Banca d'Italia (architecture gap — EUR metrics not in any trigger set).

The content-path boundary is about **whether the fetched content contains the intelligence type the patterns expect**. This is a different question:
- Configuration contract: "Do the metrics match the triggers?" (metric → event compatibility)
- Content-path boundary: "Does the content match the patterns?" (content → pattern compatibility)

BaFin passed both:
- Content-path alignment: RSS feed contains consumer warnings → regulatory patterns match ✅
- Configuration contract: metrics (action_type, violation_type) match regulatory_enforcement triggers ✅

US Treasury failed content-path (press releases ≠ sanctions) but the configuration contract was correct (sanctions_designation triggers match sanctions patterns). RBI failed content-path (operational RSS ≠ rate decisions) but the configuration contract was correct (monetary_policy_decision triggers match rate patterns via normalization).

---

## What Is Proven

### 1. Pipeline end-to-end works
**PROVEN** by BaFin: Fetch → Normalize → Extract → Detect → Evidence → Provenance → IO completed successfully. The pipeline architecture is sound.

### 2. Config-only can produce publishable IO
**PROVEN** by BaFin: 9 publishable IOs with 0 engineering, 0 source-specific code. Only event_type correction was needed.

### 3. Pre-screening does not verify content-path ↔ intelligence-type alignment
**PROVEN** by US Treasury and RBI: both passed Gates 1-4 but failed at Gate 5 because the selected source path contains a different content type than the patterns assume. Pre-screening verified content exists but didn't verify the specific path leads to the assumed intelligence type.

---

## What Is NOT Proven

### 4. QUALIFICATION_READY predicts Gate 5 success generally
**NOT PROVEN.** 1/3 sources passed Gate 5 (BaFin). 2/3 failed due to content-path mismatch. The sample is too small and the failures are due to a boundary not assessed during pre-screening. QUALIFICATION_READY was not disproven (the 2 failures weren't prediction errors — they were untested boundaries), but it was not confirmed as a general predictor.

### 5. No engineering intervention = onboarding success
**NOT PROVEN.** All 3 sources required 0 engineering. But only 1/3 produced publishable IOs. Absence of engineering is necessary but not sufficient for onboarding success.

### 6. Gate 5 success rate
**NOT CALCULATED.** n=3 is not valid for statistics. This is a diagnostic test, not a success rate measurement.

---

## Correction to GATE5_RERUN2_SUMMARY.md

The following statements in `GATE5_RERUN2_SUMMARY.md` (`282de0f`) are overclaims:

### Overclaim 1: "QUALIFICATION_READY can predict Gate 5 PASS"

**Corrected**: QUALIFICATION_READY was confirmed for BaFin (1 source). It was not disproven for US Treasury and RBI (they were blocked by a boundary not assessed during pre-screening, not by a prediction error). The statement "QUALIFICATION_READY can predict Gate 5 PASS" is not proven generally; only "QUALIFICATION_READY was confirmed for BaFin specifically" is proven.

### Overclaim 2: "Config-only sufficiency = 3/3"

**Corrected**: No engineering intervention was required in any of the 3 attempts. However, only BaFin reached publishable IO. "Config-only was sufficient for onboarding" is proven only for BaFin. For US Treasury and RBI, "config-only" means "no engineering was needed" — but onboarding was not achieved.

### Overclaim 3: Stop condition phrasing

The summary states "Stop immediately if any source fails" as a constraint. The actual constraint (per user directive) is "stop when engineering intervention is required." US Treasury failed but did not require engineering, so continuing to BaFin and RBI was correct. The constraint phrasing should be corrected to avoid future confusion.

---

## What This Finding Means for the Qualification Model

### Current model

```text
PRE-SCREENED (Gates 1-4)
   ↓
QUALIFICATION_READY
   ↓
Gate 5 (first-attempt validation)
   ↓
PUBLISHABLE or FAIL
```

### Observed gaps between QUALIFICATION_READY and PUBLISHABLE

Gate 5 testing revealed **two distinct gaps** between QUALIFICATION_READY and PUBLISHABLE:

**Gap A: Content-path ↔ intelligence-type alignment** (identified in this document)
- Not assessed during pre-screening
- Caused US Treasury and RBI failures
- Nature: the selected source path doesn't contain the assumed content type
- Fixable by: content-path verification (assessing whether the specific path contains the assumed intelligence type)

**Gap B: Event-model applicability** (identified in Configuration Contract Verification)
- Not assessed during pre-screening
- Caused Bundesbank and Banca d'Italia failures
- Nature: the source's content type isn't representable by the existing event model
- Fixable by: model extension (adding new event types or trigger metrics) — data-driven, no code changes

These are **distinct gaps**:
- Gap A is about content-path selection (which feed/section to use)
- Gap B is about event-model coverage (whether the intelligence type can be classified)

### What Gate 4 might need to become

Currently Gate 4 is:
> "Pattern Category Applicability" — does a pattern category abstraction exist?

Gate 4 might need to become:
> "Configuration Applicability" — a multi-dimensional assessment:
> - source path → document/content type
> - content type → intended intelligence type
> - intelligence type → pattern applicability
> - pattern metrics → event compatibility

But **this is a finding, not a proposal**. The decision on whether to:
- Expand Gate 4 to include content-path verification
- Add a separate assessment step
- Change the qualification model structure
- Simply improve config authoring guidance

...must be made after reviewing this finding. No model changes are proposed here.

---

## No Actions Taken

- ❌ No pipeline changes
- ❌ No config changes (beyond the 3 event_type corrections in `282de0f`)
- ❌ No new gates added
- ❌ No Gate 4.5 added
- ❌ No Qualification Model v2
- ❌ No remediation of US Treasury or RBI
- ❌ No re-running of Bundesbank or Banca d'Italia
- ❌ No Queue changes
- ❌ No Contract/website/Phase C changes

This document is **findings only** — it describes what was observed and what it means, without proposing changes.

---

## Next Decision Required

The user must decide:

1. **Accept these findings as evidence of a pre-screening gap** (content-path ↔ intelligence-type alignment) and decide whether to evolve the qualification model before further Gate 5 attempts

2. **Treat the content-path mismatches as config authoring issues** (the configurator should have selected the correct path) and document this as a config-authoring lesson without model changes

3. **Propose a specific model evolution** (e.g., expand Gate 4 to include content-path verification, or add a new assessment step) and review before implementation

The BaFin PASS (1/3) proves the pipeline works. The 2 content-path mismatches reveal that pre-screening needs to verify path-level content alignment. The 2 architecture gaps (Bundesbank, Banca d'Italia — from earlier verification) reveal the event model needs extension for EUR/securities content.

These are three separate findings that should be addressed independently.

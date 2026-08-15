# Onboarding Boundary Analysis v2 — Pre-Screening Methodology

**Date**: 2026-08-15
**Branch**: `top20-prescreening`
**Status**: FROZEN — Ready for operational use
**Basis**: Onboarding Boundary Analysis v1 (`5d4cef4`), Source Qualification Report Template v2 (`a62ad65` — FROZEN), Commercial Source Qualification Model v2 Design (`cfc16b6`), Qualification v2 Operationalization Review (`982ed2d`)
**Evidence base**: Top 20 Pre-Screening (`4443553`) + Gate 5 testing (`282de0f`, `b70171e`, `bd7285d`)
**Type**: Methodology document — NOT code, config, Contract, or website change.

---

## 1. The Question

> What is the predictable boundary between configuration-only onboarding and engineering-required onboarding?

v1 answered this with 5 gates (Access → Provenance → Content → Pattern Applicability → First-attempt validation). Gate 5 testing proved that Gates 1-4 are necessary but not sufficient — two additional boundaries exist between Gate 4 and Gate 5:

1. **Content-Path Alignment**: does the selected source path contain the intelligence type the patterns expect?
2. **Configuration Contract**: is the event_type supported and do pattern metrics match trigger_metrics?
3. **Semantic Representation**: do the matching metrics semantically represent the source's intelligence?

v2 adds these three stages as SQR qualification stages (NOT Queue states) between Gate 4 and Gate 5.

---

## 2. v2 Qualification Flow

```text
Gate 1 — Access
    ↓ PASS
Gate 2 — Provenance
    ↓ PASS / PASS WITH REVIEW
Gate 3 — Content
    ↓ PASS
Gate 4 — Pattern Category Applicability
    ↓ PASS
Content-Path Alignment
    ↓ ALIGNED
Configuration Contract Verification
    ↓ COMPATIBLE
Semantic Representation Assessment
    ↓ COMPATIBLE or INCONCLUSIVE
QUALIFICATION_READY (v2)
    ↓
Gate 5 — First-Attempt Validation
```

**Gate 5 is only attempted if QUALIFICATION_READY = YES or YES WITH SEMANTIC REVIEW.**

---

## 3. Gate Definitions (Gates 1-4 preserved from v1)

### Gate 1: Access

| Aspect | Value |
|--------|-------|
| Purpose | Determine whether the source can be fetched via an existing adapter |
| Assessor | Solutions Architect |
| Minimum evidence | HTTP probe with browser User-Agent; record status code, response size, server header |
| Confidence | MEDIUM |
| Semantics | PASS / FAIL |
| Proves | Source is reachable via RSS, HTML index, or PDF adapter |
| Does NOT prove | Content substance, provenance availability, or Gate 5 success |
| Routing consequence | FAIL → NOT CURRENTLY SUPPORTED (if source-level block) or SCREENING_ONLY (if path-level issue) |

### Gate 2: Provenance

| Aspect | Value |
|--------|-------|
| Purpose | Determine whether document_date is available through a supported extraction path |
| Assessor | Solutions Architect |
| Minimum evidence | Inspect RSS `<pubDate>`/`<dc:date>`, HTML `<meta>` tags, URL date patterns, or config `published_at` |
| Confidence | MEDIUM |
| Semantics | PASS / FAIL / PASS WITH REVIEW |
| Proves | Publication date metadata exists and is machine-readable |
| Does NOT prove | Date-source precedence is resolved (if multiple sources disagree → PASS WITH REVIEW) |
| Routing consequence | FAIL → CONDITIONAL; PASS WITH REVIEW → QUALIFICATION_READY with provenance review qualifier |

### Gate 3: Content

| Aspect | Value |
|--------|-------|
| Purpose | Determine whether fetched content contains machine-readable substantive text |
| Assessor | Solutions Architect |
| Minimum evidence | Fetch sample document; verify static HTML contains substantive text (not just navigation/cookies) |
| Confidence | MEDIUM |
| Semantics | PASS / FAIL |
| Proves | Content is present in static HTML or extractable PDF; no JS rendering required |
| Does NOT prove | That the content matches the expected intelligence type (that's Content-Path Alignment) |
| Routing consequence | FAIL → NOT CURRENTLY SUPPORTED (JS-rendered) or SCREENING_ONLY |

### Gate 4: Pattern Category Applicability

| Aspect | Value |
|--------|-------|
| Purpose | Determine whether an existing pattern category abstraction can match this source's content domain |
| Assessor | Solutions Architect |
| Minimum evidence | Compare source's institutional class and content type to existing pattern categories (rate_patterns, regulatory_patterns, statistical_patterns, earnings_patterns); identify closest analog in ALREADY_QUALIFIED sources |
| Confidence | MEDIUM |
| Semantics | PASS / FAIL |
| Proves | A pattern category abstraction exists that could match the source's content |
| Does NOT prove | That specific patterns will extract facts (content-path alignment needed), or that the event model can represent the intelligence (configuration contract + semantic assessment needed) |
| Routing consequence | FAIL → QUALIFIED ENGINEERING (new pattern category needed) |

---

## 4. v2 Qualification Stages (new)

### Content-Path Alignment

| Aspect | Value |
|--------|-------|
| Purpose | Verify that the selected source path (RSS feed URL, HTML index page, or PDF URL) contains the intelligence type that the patterns are designed to extract |
| Assessor | Solutions Architect |
| Minimum evidence | Sample enough representative documents from the selected source path to establish content-path alignment. Default target = up to 3 documents when available. The standard is **representativeness**, not a fixed count — some RSS feeds may provide multiple document types, while other sources may offer only one suitable sample. Verify sampled documents contain the expected intelligence type (e.g., "this RSS feed contains consumer warnings, not rate decisions"). |
| Confidence | MEDIUM (sampled, not exhaustive) |
| Semantics | ALIGNED / NOT ALIGNED / INCONCLUSIVE |
| Proves | The selected source path leads to the content type the patterns are designed for |
| Does NOT prove | That extraction will produce facts, or that the event model can represent the intelligence |
| Routing consequence | NOT ALIGNED → CONTENT-PATH REVIEW (identify correct path or reclassify); INCONCLUSIVE → proceed with caution to Configuration Contract Verification |

**Methodology**:
1. Identify the expected intelligence type from the source's institutional class and the patterns being considered (e.g., central bank → rate decisions; financial regulator → enforcement actions; statistical authority → statistical releases)
2. Fetch enough representative documents from the selected source path to establish alignment; default target = up to 3 documents when available. The count is not a minimum or mandatory requirement.
3. Inspect document titles and content to determine the actual content type
4. Compare actual content type to expected intelligence type
5. If they match → ALIGNED; if they don't → NOT ALIGNED; if unclear from sample → INCONCLUSIVE

### Configuration Contract Verification

| Aspect | Value |
|--------|-------|
| Purpose | Verify that the proposed source configuration (event_type + pattern metrics) is syntactically compatible with the pipeline's detector contract |
| Assessor | Solutions Architect |
| Minimum evidence | Static verification (no pipeline run needed): (1) check `event_type` exists in `EVENT_TYPE_RULES`; (2) check at least one pattern's normalized metric (via `PATTERN_TYPE_METADATA` lookup) is in the event_type's `trigger_metrics`; (3) check `content_keywords` are compatible with the adapter's document-title behavior (empty keywords = no filtering; non-empty keywords must match the generic title pattern for HTML index sources) |
| Confidence | **HIGH — static contract verification only** (deterministic; applies only to contract compatibility, NOT semantic compatibility) |
| Semantics | COMPATIBLE / NOT COMPATIBLE |
| Proves | The configuration is syntactically compatible with the pipeline contract — the detector will find triggering facts if extraction produces any |
| Does NOT prove | That the metrics semantically represent the source's intelligence (that's the Semantic Representation Assessment); that extraction will actually produce facts (content-path alignment is a prerequisite) |
| Routing consequence | NOT COMPATIBLE → see routing logic below (distinguish fixable config mismatch from representation gap) |

**Methodology**:
1. List all pattern types defined in the source config (second element of each pattern tuple)
2. For each pattern type, look up `PATTERN_TYPE_METADATA` to find the normalized metric name
3. Check if `event_type` exists in `EVENT_TYPE_RULES`
4. If yes, check if any normalized metric is in the event_type's `trigger_metrics`
5. Check content_keywords: if non-empty and feed_format=html_index, verify at least one keyword matches the generic title pattern `"{source_code} Action"`
6. If all checks pass → COMPATIBLE; if any fails → NOT COMPATIBLE

**Important**: This stage performs **static proposed configuration inspection** — it inspects or models a proposed configuration (checking event_type, trigger_metrics, content_keywords compatibility) without creating an executable pipeline configuration. The latter is prohibited until Gate 5 is authorized.

### Semantic Representation Assessment

| Aspect | Value |
|--------|-------|
| Purpose | Determine whether the matching metrics semantically represent the source's intelligence type — i.e., does the metric's meaning in the pipeline's event model correspond to the actual meaning of the extracted fact in the source's content? |
| Assessor | Solutions Architect + Intelligence/Data Reviewer (joint) |
| Minimum evidence | Human judgment based on: (1) the pattern_type → metric mapping (from `PATTERN_TYPE_METADATA`); (2) the trigger_metric's role in the event model (what does this event type represent?); (3) the source's actual content type (what intelligence does the source produce?) |
| Confidence | **MEDIUM** (human judgment, not deterministic) |
| Semantics | COMPATIBLE / INCONCLUSIVE / REPRESENTATION GAP |
| Proves | The configuration is semantically meaningful, not just syntactically compatible |
| Does NOT prove | That Gate 5 will pass (extraction may still fail, or quality may be insufficient) |
| Routing consequence | COMPATIBLE → QUALIFICATION_READY = YES; INCONCLUSIVE → QUALIFICATION_READY = YES WITH SEMANTIC REVIEW; REPRESENTATION GAP → ENGINEERING REVIEW (evidence-supported routing, not engineering-demonstrated) |

**Methodology**:
1. Identify the source's actual intelligence type (e.g., "consumer warnings about unauthorized financial services", "EUR-denominated securities auction announcements", "monetary policy rate decisions")
2. Identify the matching event type and its trigger_metrics (from Configuration Contract Verification)
3. Assess: does the metric-to-trigger intersection represent a genuine semantic fit?
   - If the metric's meaning in the event model corresponds to the source's content → COMPATIBLE
   - If the evidence is insufficient to determine fit → INCONCLUSIVE
   - If no existing metric/event type semantically fits without distortion → REPRESENTATION GAP
4. If REPRESENTATION GAP: document what intelligence type is not representable and why no existing metric fits

**Key distinction**: Contract compatibility (HIGH confidence, deterministic) asks "do the sets intersect?" Semantic representation (MEDIUM confidence, judgment) asks "does the intersection mean what we need it to mean?"

---

## 5. Qualification-Ready Logic

```text
PRE-SCREENED = YES (Gates 1-4 PASS)
AND Content-Path = ALIGNED
AND Configuration Contract = COMPATIBLE
AND Semantic = COMPATIBLE
    → QUALIFICATION_READY = YES

PRE-SCREENED = YES
AND Content-Path = ALIGNED
AND Configuration Contract = COMPATIBLE
AND Semantic = INCONCLUSIVE
    → QUALIFICATION_READY = YES WITH SEMANTIC REVIEW

Any blocking failure (Gate 1-4 FAIL, Content-Path NOT ALIGNED,
Configuration NOT COMPATIBLE, Semantic REPRESENTATION GAP)
    → QUALIFICATION_READY = NO
```

**QUALIFICATION_READY = YES**: all pre-Gate-5 checks passed. Source is ready for Gate 5 first-attempt validation. No probability of success is claimed.

**QUALIFICATION_READY = YES WITH SEMANTIC REVIEW**: all checks passed but semantic fit is inconclusive. Source proceeds to Gate 5, but if Gate 5 fails, root-cause review must specifically investigate whether semantic representation was the cause.

**QUALIFICATION_READY = NO**: at least one stage failed. Source is routed to the appropriate review (CONTENT-PATH REVIEW, CONFIGURATION REVIEW, ENGINEERING REVIEW, or classified as NOT CURRENTLY SUPPORTED / CONDITIONAL).

---

## 6. Static vs Executable Configuration

**Explicit separation**:

| Activity | When allowed | What it involves |
|----------|-------------|-----------------|
| Static proposed configuration inspection | During qualification (before Gate 5) | Inspecting or modeling a proposed configuration: checking event_type against `EVENT_TYPE_RULES`, looking up `PATTERN_TYPE_METADATA` for metric normalization, checking `trigger_metrics` intersection, checking `content_keywords` compatibility with adapter behavior. No pipeline execution. |
| Executable pipeline configuration | Only after QUALIFICATION_READY = YES or YES WITH SEMANTIC REVIEW | Creating an actual source config entry in `source_configs.py` and running the pipeline (Gate 5). |

**The former is part of qualification. The latter is Gate 5 onboarding. They must not be confused.**

---

## 7. Updated Pre-Screening Checklist (v2)

The v1 checklist had 4 questions. v2 adds 3 more:

```text
v1 questions (retained):
1. Can we fetch it? (Gate 1 — Access)
2. Can we get the date? (Gate 2 — Provenance)
3. Is there machine-readable substantive content? (Gate 3 — Content)
4. Does the existing configuration abstraction apply? (Gate 4 — Pattern Category)

v2 additional questions:
5. Does the selected source path contain the expected intelligence type? (Content-Path Alignment)
6. Is the event_type supported AND do pattern metrics match trigger_metrics? (Configuration Contract Verification)
7. Do the matching metrics semantically represent the source's intelligence? (Semantic Representation Assessment)
```

If questions 1-4 = YES, and 5 = ALIGNED, and 6 = COMPATIBLE, and 7 = COMPATIBLE or INCONCLUSIVE:
→ QUALIFICATION_READY = YES (or YES WITH SEMANTIC REVIEW if 7 = INCONCLUSIVE) → proceed to Gate 5

If any question fails:
→ route to the appropriate review/classification (see Section 8)

---

## 8. Routing Consequences

```text
Gate 1 FAIL (source-level block)     → NOT CURRENTLY SUPPORTED
Gate 1 FAIL (path-level issue)       → SCREENING_ONLY
Gate 2 FAIL                           → CONDITIONAL
Gate 2 PASS WITH REVIEW               → QUALIFICATION_READY with provenance review
Gate 3 FAIL (JS-rendered)            → SCREENING_ONLY / NOT CURRENTLY SUPPORTED
Gate 4 FAIL (no pattern category)    → QUALIFIED ENGINEERING
Content-Path NOT ALIGNED              → CONTENT-PATH REVIEW
Configuration NOT COMPATIBLE
         ├── Fixable configuration mismatch
         │   (e.g., event_type wrong but metrics exist in a supported type's triggers)
         │   → CONFIGURATION REVIEW → correct and re-verify
         │
         └── No contract-compatible representation
             (e.g., event_type supported but metrics not in triggers, or
              no existing metric semantically fits)
             → SEMANTIC REPRESENTATION ASSESSMENT
             → COMPATIBLE / INCONCLUSIVE / REPRESENTATION GAP

Key distinction: if the event_type is simply wrong but a supported event_type exists
whose trigger_metrics match the extracted metrics, this is a fixable configuration
mismatch (correct the event_type and re-verify). If no supported event_type has
trigger_metrics that match — or if the matching is syntactic but not semantic —
this requires Semantic Representation Assessment to determine whether the gap is
fixable or requires model extension.
Semantic REPRESENTATION GAP          → ENGINEERING REVIEW
Gate 5 PASS                           → STANDARD (Quality reported separately)
Gate 5 FAIL                           → ROOT-CAUSE REVIEW
  ├── Content-path mismatch           → CONTENT-PATH REVIEW
  ├── Configuration contract failure   → CONFIGURATION REVIEW
  ├── Semantic representation issue    → ENGINEERING REVIEW
  ├── Provenance                       → CONDITIONAL
  ├── Pipeline behavior boundary      → Engineering assessment
  └── Unresolved                      → NOT CURRENTLY SUPPORTED
```

---

## 9. Independent Dimensions (preserved from v1 + v2 additions)

For every source assessed:

| Dimension | What it measures |
|-----------|-----------------|
| Onboarding | Did the configuration path produce a publishable IO without core intervention? (Gate 5) |
| Provenance | Is document_date available and are all chains verified? |
| Intelligence Quality | Are the extracted facts semantically correct? (PASS/REVIEW/FAIL) |
| Extraction Coverage | What fraction of documents produced facts? (measured, never treated as onboarding success) |
| Reproducibility | Does re-extraction produce identical facts? |
| Engineering intervention | Was any core code modification required? (0 / >0) |
| Content-path status | Is the selected source path aligned with the expected intelligence type? (v2) |
| Configuration compatibility | Is the event_type + metrics contract-compatible with the pipeline? (v2) |
| Semantic representation | Do the matching metrics semantically represent the source's intelligence? (v2) |

---

## 10. Worked Examples (existing evidence, NOT new tests)

The following examples use evidence from the Top 20 Pre-Screening (`4443553`) and Gate 5 testing (`282de0f`, `b70171e`, `bd7285d`). They are **existing evidence**, not new tests.

### Example 1: BaFin — full v2 qualification path to STANDARD

```text
Gate 1: PASS (RSS accessible, HTTP 200, 4 feeds)
Gate 2: PASS (RSS <pubDate> with timezone)
Gate 3: PASS (static HTML, Government Site Builder CMS, 4,546 chars article body)
Gate 4: PASS (regulatory_patterns applicable; analogs in SEC, FCA)
    ↓
Content-Path Alignment: ALIGNED
  Selected path: /EN/service/rss/_function/RSS_Presse.xml
  Expected intelligence: consumer warnings about unauthorized financial services
  Sampled: 3 RSS items (capitalx.market, auextrade.com, backoffice-raisin.de)
  Observed: consumer warnings about unauthorized financial services ✅
    ↓
Configuration Contract Verification: COMPATIBLE
  event_type: regulatory_enforcement (supported ✅)
  Pattern metrics: action_type, violation_type, penalty_amount, entity_name
  Normalized metrics (via PATTERN_TYPE_METADATA):
    action_type → action_type (in regulatory_enforcement.trigger_metrics ✅)
    violation_type → violation_type (in trigger_metrics ✅)
    penalty_amount → penalty_amount (in trigger_metrics ✅)
    entity_name → entity_name (NOT in PATTERN_TYPE_METADATA → metric=entity_name, not in triggers)
  Trigger intersection: {action_type, violation_type, penalty_amount} — 3 matches ✅
  Content keywords: non-empty, feed_format=rss → keywords match RSS titles ✅
  Contract compatible: YES
  Confidence: HIGH (static contract verification)
    ↓
Semantic Representation Assessment: COMPATIBLE
  Source intelligence type: consumer warnings about unauthorized financial services
  Matching event type: regulatory_enforcement
  Semantic fit: consumer warnings about unauthorized services → regulatory enforcement
    is a natural semantic representation ✅
  Confidence: MEDIUM (human judgment)
    ↓
QUALIFICATION_READY = YES
    ↓
Gate 5: PASS (52 facts, 9 events, 52 evidence, 52 provenance, 9 IOs)
  Output quality: accept
  Reproducible: True
  Source-specific code: 0
  Engineering intervention: False
    ↓
Classification: STANDARD
```

### Example 2: US Treasury — content-path mismatch

```text
Gate 1: PASS (HTML index accessible)
Gate 2: PASS (Drupal field-news-publication-date + listing <time>)
Gate 3: PASS (static HTML, Drupal 10)
Gate 4: PASS (sanctions/regulatory patterns applicable)
    ↓
Content-Path Alignment: NOT ALIGNED
  Selected path: /news/press-releases
  Expected intelligence: OFAC sanctions designations
  Sampled: 3 press releases (sb0604, sb0603, sb0602)
  Observed: general fiscal policy speeches and announcements
    (e.g., "Treasury Secretary Bessent Highlights America's Main Street")
  Expected vs observed: sanctions designations ≠ fiscal policy speeches ❌
    ↓
Routing: CONTENT-PATH REVIEW
  (US Treasury DOES publish sanctions — but on a different path: /recent-actions or OFAC-specific pages, not /news/press-releases)
```

### Example 3: RBI — content-path mismatch

```text
Gate 1: PASS (RSS accessible, 6 feeds)
Gate 2: PASS (RSS <pubDate>)
Gate 3: PASS (static HTML + RSS with full HTML in <description>)
Gate 4: PASS (rate_patterns applicable; extractor normalizes rate_value→policy_rate)
    ↓
Content-Path Alignment: NOT ALIGNED
  Selected path: rbi.org.in/pressreleases_rss.xml
  Expected intelligence: monetary policy rate decisions
  Sampled: 3 RSS items (SGB redemption, state securities auction, VRRR auction)
  Observed: operational announcements (SGB redemption prices, securities auctions, VRRR operations)
  Expected vs observed: rate decisions ≠ operational announcements ❌
    ↓
Routing: CONTENT-PATH REVIEW
  (RBI DOES publish rate decisions — but in MPC statements, not in the general press releases RSS feed)
```

### Example 4: Bundesbank — representation/configuration boundary

```text
Gate 1: PASS (RSS accessible, 5 feeds)
Gate 2: PASS (RSS <pubDate> + <dc:date>)
Gate 3: PASS (static HTML + RSS with PDF enclosures)
Gate 4: PASS (statistical patterns candidate)
    ↓
Content-Path Alignment: ALIGNED
  Selected path: /service/rss/en/633306/feed.rss
  Expected intelligence: securities auction announcements
  Sampled: 3 RSS items (Bubills invitation, 10-year Federal bond auction, procurement)
  Observed: securities auction announcements ✅
    ↓
Configuration Contract Verification: NOT COMPATIBLE
  event_type: securities_auction (NOT supported — not in EVENT_TYPE_RULES ❌)
  Even if changed to statistical_release:
    Pattern metrics: eur_amount, securities_type, auction_amount, yield_value
    Normalized metrics (via PATTERN_TYPE_METADATA): NONE of these are in
      PATTERN_TYPE_METADATA → metrics remain as-is (eur_amount, securities_type,
      auction_amount, yield_value)
    trigger_metrics intersection: 0 matches across ALL 6 supported event types ❌
  Contract compatible: NO
    ↓
Semantic Representation Assessment: REPRESENTATION GAP
  Source intelligence type: EUR-denominated securities auction announcements
  Matching event type: none (no existing event type covers securities auctions)
  Semantic fit:
    eur_amount → usd_amount? NO (EUR ≠ USD, would distort semantics)
    securities_type → statistic_value? NO (categorical ≠ numeric)
    yield_value → percentage_change? NO (level ≠ change)
    No existing metric semantically fits without distortion ❌
  Confidence: MEDIUM (human judgment)
    ↓
Routing: ENGINEERING REVIEW (evidence-supported routing, NOT engineering-demonstrated)
  Representation gap: EUR-denominated securities auction content has no
  semantically compatible trigger in any existing event type.
  No engineering work package has been executed.
```

### Example 5: Banca d'Italia — representation gap + pipeline behavior boundary

```text
Gate 1: PASS (HTML index accessible)
Gate 2: PASS (bdi-titlepagev2-date publication date field)
Gate 3: PASS (static HTML + PDF press releases)
Gate 4: PASS (statistical patterns candidate)
    ↓
Content-Path Alignment: ALIGNED (would be, if documents reached)
  — but documents are discarded by content_keywords filter before content fetch
  Pipeline behavior boundary: HTML index generates generic title "BANCA_D_ITALIA Action";
  content_keywords ["BOT","BTP","CCTeu","auction","asta","Treasury"] do not match
  generic title; all documents discarded
    ↓
Configuration Contract Verification: NOT COMPATIBLE (same as Bundesbank)
  eur_amount, securities_type, auction_amount, yield_value not in any trigger_metrics
    ↓
Semantic Representation Assessment: REPRESENTATION GAP (same as Bundesbank)
    ↓
Routing: ENGINEERING REVIEW
  Two issues:
  1. Event-model representation gap (same as Bundesbank)
  2. Pipeline behavior boundary (HTML index + content_keywords interaction)
  No engineering work package has been executed.
```

---

## 11. Commercial Discipline

This methodology does NOT introduce:
- Success rates (sample too small)
- Predictive probabilities (QUALIFICATION_READY does not claim probability of Gate 5 success)
- Onboarding-time claims (not independently measured)
- Universal source-support claims (not tested)
- Fixed document-count rules for content-path sampling (representativeness is the standard)

This methodology does NOT:
- Turn v2 stages into Queue states (v2 stages are SQR qualification stages)
- Authorize executable pipeline configuration before Gate 5
- Modify the pipeline, Queue, Contract, or website
- Authorize new source probing or Gate 5 execution

---

## 12. Relationship to Existing Documents

| Document | Role | Relationship |
|----------|------|-------------|
| Onboarding Boundary Analysis v1 (`5d4cef4`) | v1 methodology | This v2 supersedes v1 methodology; v1 is preserved as historical reference |
| Source Qualification Report Template v2 (`a62ad65`) | Operational record format | This methodology defines HOW to fill the v2 SQR stages |
| Commercial Source Qualification Model v2 Design (`cfc16b6`) | Commercial classification framework | This methodology operationalizes the v2 model's qualification flow |
| Qualification v2 Operationalization Review (`982ed2d`) | Change specification | This methodology implements the approved operationalization review |
| Global Qualification Queue v1.1 (`001d349`) | Queue states | Queue remains unchanged; v2 stages are SQR-only |
| Evidence Matrix V3 (`7384033`) | Frozen evidence | Not modified |
| Supported Source Contract v1.0 | Technical contract | Not modified |

---

## 13. What This Methodology Does NOT Do

- Does NOT modify the pipeline or any code
- Does NOT modify the Queue
- Does NOT add new gates to the pipeline (v2 stages are SQR qualification stages, not pipeline gates)
- Does NOT calculate a success rate
- Does NOT promise a fixed onboarding time
- Does NOT guarantee that STANDARD sources will have PASS intelligence quality
- Does NOT determine the solution for event-model representation gaps
- Does NOT authorize Phase C or any new source testing
- Does NOT modify v1 Boundary Analysis (`5d4cef4`)
- Does NOT modify SQR Template v2 (`a62ad65` — FROZEN)
- Does NOT modify Queue v1.1

---

## 14. Boundary Framework Status (updated from v1)

```text
Boundary framework v1              CLEARED (historical)
Boundary framework v2              FROZEN
Retrospective consistency (v1)     CLEARED
Retrospective consistency (v2)     CLEARED (5 worked examples match evidence)
Prospective prediction (v1)        PARTIALLY VALIDATED
Prospective prediction (v2)        NOT YET TESTED (v2 stages not yet applied prospectively)
Gate 1 prediction                  VALIDATED
Gate 2 prediction                  NOT TESTED PROSPECTIVELY
Gate 3 prediction                  NOT TESTED PROSPECTIVELY
Gate 4 prediction                  VALIDATED (Top 20 pre-screening)
Content-Path Alignment prediction  NOT YET TESTED PROSPECTIVELY (evidence from Gate 5 retrospective)
Configuration Contract prediction  NOT YET TESTED PROSPECTIVELY (evidence from Gate 5 retrospective)
Semantic Representation prediction NOT YET TESTED PROSPECTIVELY (evidence from Gate 5 retrospective)
Gate 5 prediction                  1 PASS (BaFin), 2 content-path mismatches (US Treasury, RBI), 2 representation gaps (Bundesbank, Banca d'Italia)
Commercial boundary claim          NOT AUTHORIZED
```

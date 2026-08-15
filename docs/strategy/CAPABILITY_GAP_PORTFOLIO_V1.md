# Capability Gap Portfolio V1

**Date**: 2026-08-15
**Branch**: `top20-prescreening`
**Status**: V1 — Preliminary Classifications (for user ratification)
**Type**: Strategic planning document — NOT code, config, Contract, Queue, methodology, or Commercial Model change.
**Base**: Cumulative evidence from Gate 5 testing + remediation tests (`3a759cd` → `45bbd88`)

---

## 1. Purpose

This portfolio shifts the project's management frame from **source-by-source problem tracking** to **capability-roadmap management**.

The boundary established by the two remediation tests (FED_ENF config-only PASS, TCMB engineering-required) proved that:

> **Configuration expressiveness ≠ Adapter capability**

These are two different dimensions of failure:
- **Configuration expressiveness**: can the regex / config / event-type express what the source requires? (Often resolvable inside `source_configs.py`.)
- **Adapter capability**: can the fetcher / normalizer / extractor reach the content at all? (Changes the boundaries of the product itself.)

A source-by-source view obscures this distinction. A capability view makes it visible — and makes it possible to prioritize **platform capabilities** that unlock many sources at once over **single-source fixes** that unlock only one.

---

## 2. Current State (Per User Directive)

| Artifact | State |
|----------|-------|
| v2 qualification framework | **FROZEN** |
| Prospective validation | **VALID** |
| Eurostat | PASS |
| FED_ENF remediation | CONFIG-ONLY PASS |
| TCMB remediation | ENGINEERING REQUIRED |
| ABS | UNTESTED |
| Commercial model | UNCHANGED |
| Remediation testing phase | **CLOSED** |

This portfolio is the **first artifact of the next phase**: capability roadmap management.

---

## 3. What This Portfolio Does NOT Change

- The v2 qualification framework remains FROZEN. No new gate is added.
- GLOBAL_QUALIFICATION_QUEUE_V1 / V1.1 remains FROZEN. **Engineering Candidates is NOT a new Queue state** — it is a classification tracked in this portfolio only.
- No pipeline code changes. No config changes. No Contract changes.
- No Commercial Model update (sample size too small — per user directive).
- ABS remains UNTESTED. This portfolio does NOT recommend probing ABS — it surfaces ABS as a relevant evidence point for two capabilities, but classification for ABS-specific remediation remains deferred.

---

## 4. Classification Scheme

Each capability receives ONE of four classifications:

| Classification | Meaning |
|----------------|---------|
| **BUILD NOW** | The capability is required to meet the v2 commercial promise or to unblock multiple QUALIFICATION_READY sources at Gate 5. Building it is part of the core pipeline roadmap. |
| **ENGINEERING CANDIDATE** | Evidence supports the capability gap; building it would solve ≥1 real source. BUT the strategic value (reuse × institutional value × implementation risk) is not yet established. Track as a candidate for future engineering prioritization — DO NOT auto-promote to BUILD NOW. |
| **DEFER** | Evidence exists but is too thin to evaluate strategic value. Wait for more remediation / onboarding evidence before classifying. |
| **CUSTOMER-SPECIFIC** | The capability is unlikely to ever generalize; treat as scope-of-work for a specific customer engagement, not as a platform capability. |

### Critical Discipline

> **A single remediation test producing "engineering required" does NOT auto-promote a capability to BUILD NOW.**

TCMB → ENGINEERING REQUIRED is one data point. It establishes that *adapter capability* is a real category. It does NOT establish that browser-rendered ingestion should be built now. Before any BUILD NOW decision on adapter capability, the user's evaluation matrix must be applied:

```
Institutional value
× Reuse potential of the capability
× Number of blocked sources likely solved
× Implementation risk
```

This portfolio provides the inputs (institutional value, reuse potential, blocked-source estimate, engineering implication) but does NOT compute the final score. The final BUILD NOW vs ENGINEERING CANDIDATE decision is the user's to make.

---

## 5. Capability × Source × Outcome Matrix

The matrix below summarizes which sources hit which capability gap. It is the evidence base for the per-capability sections that follow.

| Source | Gate 5 outcome | Content-Path Qualification | Configuration Contract | Content-Regex Specificity | Adapter / Browser Rendering | Language Coverage | Event-Model Representation | Provenance Compatibility |
|--------|----------------|----------------------------|------------------------|---------------------------|------------------------------|-------------------|----------------------------|--------------------------|
| BaFin | PASS | aligned | compatible | n/a (no failure) | static OK | n/a | compatible | compatible |
| Eurostat | PASS | aligned | compatible | n/a (no failure) | static OK | n/a | compatible | compatible |
| US Treasury | FAIL | **NOT ALIGNED** (press releases ≠ sanctions) | compatible | n/a | static OK | n/a | compatible | compatible |
| RBI | FAIL | **NOT ALIGNED** (operations ≠ rate decisions) | compatible | n/a | static OK | n/a | compatible | compatible |
| Bundesbank | NOT COMPATIBLE | aligned | **NOT COMPATIBLE** (EUR metrics not in any trigger) | n/a | static OK | n/a | **REPRESENTATION GAP** | compatible |
| Banca d'Italia | NOT COMPATIBLE | aligned | **NOT COMPATIBLE** | n/a | static OK | n/a | **REPRESENTATION GAP** + HTML index keyword boundary | compatible |
| OCC | SCREENING_ONLY | aligned | compatible | n/a | **TCP timeout** (unresolved access — not browser-rendering) | n/a | compatible | n/a |
| SEBI | CONTENT-PATH REVIEW | **NOT ALIGNED** (press releases ≠ enforcement) | compatible | n/a | static OK | n/a | compatible | compatible |
| PRA | CONTENT-PATH REVIEW | **NOT ALIGNED** (RSS general publications, not enforcement) | compatible | n/a | static OK | n/a | compatible | compatible |
| INSEE | ENGINEERING REVIEW | aligned | compatible | untested | static OK | **FRENCH-LANGUAGE GAP** | **REPRESENTATION GAP** | compatible |
| FSB | ENGINEERING REVIEW | aligned | **NOT COMPATIBLE** (no event type for financial policy/coordination) | n/a | static OK | n/a | **REPRESENTATION GAP** | compatible |
| UK HM Treasury | ENGINEERING REVIEW | aligned | **NOT COMPATIBLE** (no event type for fiscal policy/guidance) | n/a | static OK | n/a | **REPRESENTATION GAP** | compatible |
| FED_ENF | FAIL → **PASS (config-only)** | aligned | compatible | **CONTENT-REGEX SPECIFICITY** (resolved by config change) | static OK | n/a | compatible | compatible |
| ABS | FAIL (untested) | aligned | compatible | **PATTERN-CONTENT MISMATCH** (Australian terminology — untested hypothesis) | static OK | potential AU-English terminology gap | compatible | compatible |
| TCMB | FAIL (engineering required) | aligned | compatible | n/a (0 docs fetched) | **REQUIRED CONTENT UNAVAILABLE TO STATIC ADAPTER** | n/a | compatible | compatible |

**Legend**: "n/a" = capability not tested or not relevant for this source's outcome.

---

## 6. Capability Cards

Each capability follows the structure:

```
Capability
├── Problem definition
├── Evidence
├── Affected source cases
├── Current capability
├── Observed boundary
├── Reuse potential
├── Institutional value
├── Engineering implication
├── Confidence
└── Decision
```

---

### Capability 1 — Content-Path Qualification

**Problem definition**: A source has multiple content paths (e.g., press releases, sanctions lists, statistical releases, speeches). The selected path may not contain the intelligence type the configured patterns expect. This is invisible at Gates 1-4 (path is accessible, content is substantive, pattern category exists) — it only surfaces at Gate 5 when extraction produces 0 facts because the content type doesn't match the pattern set.

**Evidence**:
- US Treasury: configured for sanctions (`sanctions_designation` event type), but the selected path returned general press releases. 0 facts extracted. Root cause: content-path mismatch (press releases ≠ sanctions designations).
- RBI: configured for monetary policy decisions, but the selected path returned operational press releases. 0 facts. Root cause: content-path mismatch (operations ≠ rate decisions).
- SEBI: configured for regulatory enforcement, but the press releases listing contains mixed content types, not all enforcement-specific. Routed to CONTENT-PATH REVIEW.
- PRA: configured for regulatory enforcement, but the RSS feed contains general publications, not enforcement-specific. Routed to CONTENT-PATH REVIEW.
- BaFin / Eurostat / FED_ENF: selected paths WERE aligned. Confirmed via Gate 5 PASS (or FAIL with non-path root cause).

**Affected source cases**: US Treasury, RBI, SEBI, PRA (4 sources with content-path mismatch).

**Current capability**: Content-path alignment was added as a v2 qualification stage (SQR-only field, not Queue state). Methodology requires sampling up to 3 representative documents from the selected path to verify content type matches expected intelligence.

**Observed boundary**: v2 pre-screening CAN detect content-path mismatch before Gate 5 (the 4 cases above were correctly routed). This is the v2 stage that works most reliably — every content-path mismatch in the evidence base was caught by pre-screening before Gate 5.

**Reuse potential**: HIGH. Every source has multiple paths; content-path qualification is a universal pre-Gate-5 check.

**Institutional value**: HIGH. Prevents wasted Gate 5 attempts on misaligned sources.

**Engineering implication**: NONE. This is a qualification methodology capability, not a pipeline capability. Already operationalized in v2 SQR template.

**Confidence**: HIGH. v2 stage validated across 4 mismatch cases + 4 aligned cases (BaFin, Eurostat, FED_ENF, ABS).

**Decision**: **Already operational — no further action.** The v2 Content-Path Alignment stage is the most validated component of the v2 framework. Not a portfolio action item.

---

### Capability 2 — Configuration Contract Compatibility

**Problem definition**: A source's configured `event_type` may not be supported by the pipeline's `EVENT_TYPE_RULES`, OR the configured pattern metrics (via `PATTERN_TYPE_METADATA`) may not appear in the event type's `trigger_metrics`. This is a static contract violation — invisible to content-path qualification (which assumes the contract is satisfied) and only surfaced by static contract verification.

**Evidence**:
- Bundesbank: configured for monetary policy decision, but the source's EUR-denominated metrics (e.g., EUR inflation, EUR GDP) don't appear in any existing trigger_metrics set. Static contract verification: NOT COMPATIBLE.
- Banca d'Italia: same EUR-metric gap, compounded by an HTML index keyword boundary (the document-title keyword filter rejected Italian-language titles).
- FSB: configured event type was `regulatory_enforcement`, but FSB content is financial policy coordination — no existing event type semantically represents this. Static contract: NOT COMPATIBLE.
- UK HM Treasury: configured event type was `regulatory_enforcement`, but HMT content is fiscal policy / guidance — no existing event type fits. Static contract: NOT COMPATIBLE.

**Affected source cases**: Bundesbank, Banca d'Italia, FSB, UK HM Treasury (4 sources with contract incompatibility).

**Current capability**: Configuration Contract Verification was added as a v2 qualification stage (static check — deterministic, HIGH confidence). Already operationalized.

**Observed boundary**: v2 contract verification correctly identifies contract violations BEFORE Gate 5. All 4 cases above were routed to ENGINEERING REVIEW with "representation gap" findings — none required Gate 5 execution to discover.

**Reuse potential**: HIGH. Static contract verification is universal.

**Institutional value**: HIGH. Prevents wasted Gate 5 attempts and surfaces event-model gaps early.

**Engineering implication**: NONE for the verification mechanism itself (already implemented as static check). The contract violations point to Event-Model Representation gaps (Capability 6 below).

**Confidence**: HIGH. v2 stage validated across 4 incompatible cases + multiple compatible cases.

**Decision**: **Already operational — no further action.** The v2 Configuration Contract Verification stage is well-validated. The gaps it surfaces belong to Capability 6 (Event-Model Representation).

---

### Capability 3 — Content-Regex Pattern Specificity

**Problem definition**: Even when content-path is aligned AND configuration contract is compatible AND event-model representation fits, the specific regex patterns in `source_configs.py` may not match the source's actual phrasing. The configuration expressiveness is sufficient (the right pattern categories exist) but the specific regex strings don't match the source's language style. This is invisible to all v2 pre-Gate-5 stages — it only surfaces at Gate 5 when extraction produces 0 facts despite all pre-checks passing.

**Evidence**:
- FED_ENF: original `regulatory_patterns` expected "enforcement action with X" / "enforcement action against X". Actual Fed phrasing is "Consent Prohibition against X", "Consent Order against X", "Written Agreement with X", "Civil Money Penalty against X". 0 facts at Gate 5 (FAIL). Remediation test: replacing the patterns (config-only change, no code change) produced 5 facts, 3 events, 3 publishable IOs. Classification: **config-only remediable**.
- ABS: configured `statistical_patterns` use US-centric phrasing ("CPI inflation was X%", "GDP grew by X%"). Australian Bureau of Statistics may use different terminology. 0 facts at Gate 5 (FAIL). Remediation: NOT TESTED — remains a hypothesis.

**Affected source cases**: FED_ENF (resolved config-only), ABS (untested hypothesis).

**Current capability**: Pattern authoring is an operational onboarding capability. The v2 framework treats content-regex specificity as a Gate 5 root-cause category — pattern refinement is performed at the source-configuration level (`source_configs.py`), not at the platform level. There is NO pre-Gate-5 stage that detects phrasing mismatches (by design — pattern execution readiness is a Gate 5 concern, not a pre-screening concern).

**Observed boundary**: Content-regex specificity is the gap between "category-level applicability" (Gate 4 + Configuration Contract) and "pattern-level execution readiness" (Gate 5). Pre-screening proved category applicability; Gate 5 proved the patterns didn't match the actual phrasing. This boundary is NOT covered by any v2 stage — and per the v2 design, it should NOT be. Pattern execution readiness is a Gate 5 root-cause category.

**Reuse potential**: MEDIUM per source (each source has its own phrasing), but the remediation pattern is reusable — the Phase B diagnostic script written for FED_ENF can be reused as a pre-flight tool for any future source. This is an **operational authoring capability**, not a platform engineering capability.

**Institutional value**: MEDIUM. Reduces remediation cycles but doesn't change the product boundary.

**Engineering implication**: NONE for platform engineering. This is a source-configuration authoring capability. The Phase B diagnostic script (already in the repo) can serve as the seed for any future pre-flight tooling — but that is utility-script work, not core pipeline work.

**Confidence**: HIGH. FED_ENF proved config-only remediation works. ABS remains an untested hypothesis but the remediation pattern (refine patterns, re-run Gate 5) is well-established.

**Decision**: **Already Operational — Configuration Authoring Required.** Pattern specificity is a Gate 5 root-cause category, not a platform engineering candidate. The remediation pattern (refine `source_configs.py` patterns, re-run Gate 5) is operational and proven (FED_ENF). ABS remains an untested hypothesis — when probed, it will follow the same config-only remediation pattern. This classification prevents converting every source's phrasing differences into platform-engineering backlog items.

**Sub-classification**:
- Content-regex specificity, US-English sources: validated config-only fixable (FED_ENF). No action needed — remediation pattern works.
- Content-regex specificity, non-US English phrasing (AU, UK, IN): untested (ABS hypothesis). Will follow the same config-only remediation pattern when probed.
- Content-regex specificity, non-English sources: see Capability 5 (Language Coverage) — these are a different capability because they require per-language pattern libraries, not per-source pattern adjustment.

---

### Capability 4 — Adapter / Browser Rendering Capability

**Problem definition**: Some sources return only a navigation skeleton via static HTTP (urllib). The actual document URLs are unavailable in the static HTML representation and become available only after browser rendering (Playwright). The current pipeline's `fetch_with_fallback()` only invokes Playwright on HTTP 403 — sources that return HTTP 200 with empty/static content never trigger the browser fallback.

**Evidence**:
- TCMB: static HTML (urllib, 35 KB) contains 27 empty year tab panes — zero individual press release URLs. Original `link_pattern` matched 0 URLs. Playwright-rendered HTML (66 KB) contains 33 press release URLs — the original `link_pattern` matches all 33. The link_pattern was CORRECT; the failure is that the URLs aren't available to the static adapter.
- Diagnosis confirmed: required content unavailable to static adapter. The exact internal DOM-generation mechanism is NOT established by this test — only the observable fact (URLs absent in static, present after rendering).
- OCC: TCP timeout during screening. This is a NETWORK ACCESS issue, NOT a browser-rendering issue — surfaced here only to prevent misclassification. OCC's failure mode is "unresolved access" not "browser rendering required".

**Affected source cases**: TCMB (1 source with confirmed browser-rendering requirement). OCC is a separate capability gap (network access) — not counted here.

**Current capability**: The pipeline HAS Playwright integration (`fetch_with_browser()` in `fetcher.py`). It is invoked only on HTTP 403. There is no config flag to force browser rendering for sources that return 200 with empty content.

**Observed boundary**: The boundary is between "source is accessible via static HTTP" and "source requires browser rendering to expose document URLs". This is NOT a configuration-expressiveness issue (the link_pattern was correct) — it is an adapter-capability issue (the fetcher cannot reach the content without browser execution).

**Reuse potential**: UNKNOWN. This is the critical unknown. TCMB is one source. Before BUILD NOW, we need to estimate how many sources in the Global Source Universe (178 records) require browser rendering. Hypothesis: WebSphere Portal CMS (used by TCMB) is also used by other central banks and government portals — but this is unverified. Modern SPA-heavy bank/regulator websites are candidates, but no systematic survey has been done.

**Institutional value**: HIGH for TCMB specifically (Turkey is a G20 economy). UNKNOWN for the broader source universe.

**Engineering implication**: MEDIUM. Two options identified in the TCMB remediation test:
1. Add `force_browser: True` config flag + modify `fetch_with_fallback()` to respect it (~10 lines in `fetcher.py`).
2. Add a new `html_index_js` feed_format + new parser branch (~25 lines in `fetcher.py`).

Both are additive — they don't require rewriting the fetcher, just adding a new code path. Playwright is already a dependency. Risk: browser rendering is slower and more resource-intensive than urllib; pipeline throughput would drop for sources using this path. Reproducibility may also be affected (browser-rendered content can vary with timing).

**Confidence**: HIGH that the capability gap exists (TCMB is empirically confirmed). LOW on the strategic value (reuse potential unknown).

**Decision**: **ENGINEERING CANDIDATE — Evidence-Supported.** Per user directive: do NOT auto-promote to BUILD NOW. TCMB is added to the Engineering Candidates category (evidence-supported, not engineering-demonstrated). Before any BUILD NOW decision:
- Survey the Global Source Universe for sources that likely require browser rendering (static HTML inspection — quick probe, no Gate 5 execution).
- Estimate the count: if ≥10 sources likely need browser rendering, this becomes a platform capability (BUILD NOW candidate). If <5, TCMB stays customer-specific scope.
- Apply the user's evaluation matrix: institutional value × reuse potential × blocked-source count × implementation risk.

**Sub-classification**:
- Browser-rendering requirement, WebSphere Portal CMS sources: 1 confirmed (TCMB). UNKNOWN reuse — needs survey.
- Browser-rendering requirement, modern SPA-heavy sources: 0 confirmed. UNKNOWN — needs survey.
- Network access issues (TCP timeouts, HTTP 403): separate capability (not browser rendering). OCC is the only confirmed case. Likely customer-specific or network-operations scope, not platform capability.

---

### Capability 5 — Language / Multilingual Pattern Coverage

**Problem definition**: The pipeline's pattern library is English-centric. Sources publishing in other languages (French, German, Italian, Spanish, Japanese, Chinese, Arabic, Turkish) may have substantive content + correct event-model representation + correct content-path, but the regex patterns won't match non-English phrasing. This is a configuration-expressiveness gap, but at a different scale than per-source phrasing differences — it requires a per-language pattern library, not per-source pattern adjustment.

**Evidence**:
- INSEE (France): aligned content-path, compatible contract, BUT French-language content didn't match English patterns. Root cause classification included both representation gap AND French-language gap. Routed to ENGINEERING REVIEW.
- Banca d'Italia: compounded issue — EUR-metric representation gap + HTML index keyword boundary (Italian-language titles rejected by the keyword filter). The keyword filter is part of the `parse_html_index()` adapter behavior.
- TCMB: English version available — language was NOT a factor. (Surfaced here to prevent misclassification.)
- Other sources in the Global Source Universe publish in non-English: PBOC (Chinese), BOJ (Japanese), BCB (Portuguese), BANCO_DE_ESPANA (Spanish), SARB (English + Afrikaans), BANK_OF_KOREA (Korean), SFC_HONG_KONG (English + Chinese). None have been Gate 5 tested — language coverage gap is hypothesized, not confirmed, for these.

**Affected source cases**: INSEE (confirmed French gap), Banca d'Italia (compounded with keyword filter), plus 7+ sources in the Global Source Universe that publish in non-English languages (untested).

**Current capability**: NO multilingual pattern coverage exists. All `rate_patterns`, `regulatory_patterns`, `statistical_patterns` are English-only. The HTML index keyword filter (`content_keywords`) is also English-only — non-English document titles will be rejected.

**Observed boundary**: The boundary is between "source publishes in English" (covered) and "source publishes in another language" (not covered). This is invisible at pre-screening if the source has an English version (TCMB has English; INSEE has English summaries but substantive content is French).

**Reuse potential**: HIGH if ROUAA's market includes non-English-speaking jurisdictions (which it does — global expansion is the strategic frame). A French pattern library would unlock INSEE + Banque de France + AMF. A German library would unlock Bundesbank + BaFin German content. Language coverage should be prioritized by verified source-language inventory, not assumed regional similarity — the count of sources per language is currently hypothesized, not quantified.

**Institutional value**: HIGH. Global expansion into non-English jurisdictions is core to the commercial strategy.

**Engineering implication**: MEDIUM-HIGH. Two distinct work items:
1. **Per-language pattern libraries**: authoring regex patterns for French, German, Italian, Spanish, Japanese, Chinese, Arabic, Portuguese. This is configuration work (data, not code) — but it requires linguistic expertise and is substantial in volume.
2. **HTML index keyword filter internationalization**: the current `parse_html_index()` adapter filters document titles by `content_keywords`. For non-English sources, this filter rejects legitimate titles. Fix: either disable keyword filtering for non-English sources (config flag) or accept non-English keywords (config data). Small code change (~5 lines) + per-source config data.

**Confidence**: HIGH that the gap exists (INSEE confirmed). MEDIUM on the strategic priority (depends on which jurisdictions are prioritized for global expansion).

**Decision**: **ENGINEERING CANDIDATE — Evidence-Supported.** INSEE confirms the gap. Building a French pattern library would unlock INSEE + Banque de France + AMF (3 sources). Broader multilingual coverage would unlock a hypothesized set of sources — the count remains a hypothesis pending a verified source-language inventory, NOT a quantified reuse estimate. This is substantial work (linguistic + pattern authoring) and the priority depends on the global expansion sequence. Defer BUILD NOW decision until the global expansion roadmap is set AND a verified source-language inventory is completed. Track as Engineering Candidate with HIGH reuse potential (hypothesis, not yet quantified).

**Sub-classification**:
- French language coverage: 1 confirmed gap (INSEE). 3 sources likely affected (INSEE, Banque de France, AMF). HIGH priority IF EU expansion is prioritized.
- German language coverage: 0 confirmed (Bundesbank failed for representation gap, not language). 2 sources likely affected (Bundesbank German content, BaFin German content). MEDIUM priority.
- Italian language coverage: 0 confirmed (Banca d'Italia failed for compounded reasons). 1 source affected. LOWER priority.
- Other languages (Spanish, Portuguese, Japanese, Chinese, Korean, Arabic): 0 confirmed. Multiple sources likely affected. DEFER until specific jurisdictions are prioritized.
- HTML index keyword filter internationalization: small code change, blocks Banca d'Italia (compounded). LOW effort, MEDIUM value. Could be bundled with any language-library work.

---

### Capability 6 — Event-Model Representation

**Problem definition**: The pipeline's `EVENT_TYPE_RULES` defines 6 event types (monetary_policy_decision, regulatory_enforcement, statistical_release, earnings_release, sanctions_designation, market_statistic_release). Sources producing intelligence that doesn't fit any of these 6 types cannot be onboarded — no amount of configuration or pattern work will help. This is a fundamental model boundary.

**Evidence**:
- Bundesbank: EUR-denominated metrics don't appear in any trigger_metrics set. The source's intelligence (EUR monetary statistics) cannot be represented by the existing event types. REPRESENTATION GAP.
- FSB: produces financial policy coordination content. No existing event type semantically represents "financial policy coordination" or "international regulatory standard-setting". REPRESENTATION GAP.
- UK HM Treasury: produces fiscal policy / guidance content. No existing event type for "fiscal policy" or "government economic guidance". REPRESENTATION GAP.
- INSEE: partly representation gap (some French statistical content fits `statistical_release`, but some doesn't). Compounded with language gap.

**Affected source cases**: Bundesbank, FSB, UK HM Treasury (3 sources with confirmed representation gap), INSEE (compounded).

**Current capability**: 6 event types. The v2 Semantic Representation Assessment stage (SQR-only, human judgment) correctly identifies representation gaps and routes to ENGINEERING REVIEW. The gap is in the EVENT_TYPE_RULES table, not in the assessment methodology.

**Observed boundary**: The boundary is between "source's intelligence fits an existing event type" (covered) and "source's intelligence requires a new event type" (not covered). v2 pre-screening CANNOT resolve this — it can only detect it and route to ENGINEERING REVIEW.

**Reuse potential**: VARIES by event type:
- **EUR monetary statistics event type**: would unlock Bundesbank + Banca d'Italia + Banque de France (potentially). 2-3 sources. MEDIUM reuse.
- **Financial policy coordination event type**: would unlock FSB + BIS (potentially). 2 sources. MEDIUM reuse.
- **Fiscal policy / government guidance event type**: would unlock UK HM Treasury + US Treasury (fiscal content) + potentially others. 2-3 sources. MEDIUM-HIGH reuse.
- **Other event types** (e.g., trade sanctions compliance, prudential supervision, market structure): UNKNOWN — would need survey of the Global Source Universe.

**Institutional value**: HIGH for fiscal policy / government guidance (G7 economies all have this content). MEDIUM for EUR monetary statistics (overlaps with existing ECB coverage). MEDIUM for financial policy coordination (FSB, BIS — small set but high-tier institutions).

**Engineering implication**: MEDIUM per event type. Each new event type requires:
- New `EVENT_TYPE_RULES` entry (~10 lines in `detector.py`).
- New `PATTERN_TYPE_METADATA` entries for new metrics (~5 lines per metric).
- New pattern library (similar to existing rate_patterns / regulatory_patterns) — configuration work.
- SQR template update to document the new event type.

No core architectural changes — the existing config-driven architecture handles new event types cleanly. But each new event type is a meaningful authoring investment (pattern library + trigger_metrics design + sample content validation).

**Confidence**: HIGH that the gap exists (3 confirmed cases). MEDIUM on which event types to prioritize.

**Decision**: **ENGINEERING CANDIDATE — Evidence-Supported.** Three distinct event-type gaps are confirmed (EUR monetary, financial policy coordination, fiscal policy). Each would unlock 2-3 sources. Defer BUILD NOW decision until:
- The global expansion roadmap identifies which jurisdictions / intelligence types are prioritized.
- A survey of the Global Source Universe quantifies how many sources each new event type would unlock.
- Per user directive: do NOT auto-promote any single representation gap to BUILD NOW.

**Sub-classification**:
- EUR monetary statistics event type: 2-3 sources. MEDIUM priority. Overlaps with ECB (already qualified) — may be lower value than it appears.
- Financial policy coordination event type: 2 sources (FSB, BIS). MEDIUM priority. High-tier institutions.
- Fiscal policy / government guidance event type: 2-3 sources (HMT, US Treasury fiscal content, potentially others). MEDIUM-HIGH priority. G7 coverage.
- Other potential event types: UNKNOWN. DEFER until survey.

---

### Capability 7 — Provenance Metadata Compatibility

**Problem definition**: The pipeline requires provenance metadata (publish date, source URL, document title) for the evidence chain. Sources that don't expose this metadata in a standard way (no RSS `<pubDate>`, no visible dates in HTML, dynamic date rendering) fail Gate 2 (Provenance) — but the failure modes vary and may not all be of the same kind.

**Evidence**:
- BaFin: initial Gate 5 run flagged provenance ambiguity (the BaFin RSS feed had unusual `<pubDate>` formatting). Resolved in Gate 5 Re-run 2 — was a configuration issue, not a fundamental gap.
- OCC: TCP timeout during screening — Gate 2 never reached. Not a provenance compatibility issue.
- TCMB: dates ARE present in the static HTML (DD.MM.YYYY format) — Gate 2 PASS. Provenance compatibility for browser-rendered sources is UNTESTED (the rendered HTML may have different date metadata than the static HTML) — but this is subsumed under Capability 4 (Adapter / Browser Rendering), not a separate provenance gap.
- ESMA: confirmed in earlier RSS/HTML testing that the source was not publishable because `document_date` was not available via the tested path. This is an actual documented provenance boundary — the source hit a real Gate 2 boundary, even though it did not escalate to an engineering requirement. This is a confirmed case, not a hypothesis.
- Other sources: most central banks / regulators expose `<pubDate>` in RSS or visible dates in HTML.

**Affected source cases**: ESMA (confirmed provenance boundary — `document_date` not available via tested path), BaFin (resolved via configuration), plus the hypothesized browser-rendered-source case (subsumed under Capability 4).

**Current capability**: Gate 2 (Provenance) is operational. The normalizer handles RSS `<pubDate>`, Atom `<published>`, RDF `<dc:date>`, and visible dates in HTML. BaFin's `<pubDate>` formatting issue was resolved by config adjustment. The ESMA case demonstrated the documented failure path: when provenance metadata is unavailable via the tested path, the source is correctly classified as not publishable — no engineering escalation, no platform change required.

**Observed boundary**: The boundary is between "source exposes provenance metadata via a supported format" (covered) and "source does not expose provenance metadata via the tested path" (correctly classified as not publishable). This boundary is known, documented, and operational — Gate 2 surfaces it cleanly.

**Reuse potential**: LOW for additional engineering. The current Gate 2 implementation correctly handles the provenance cases observed. The ESMA boundary is a routing outcome (source not publishable via this path), not an engineering gap.

**Institutional value**: LOW for additional engineering. No confirmed case requires new provenance tooling.

**Engineering implication**: NONE demonstrated. Gate 2 is operational. The ESMA case demonstrated the documented failure path (source not publishable via this path) — this is a routing outcome, not an engineering gap. No specific engineering work has been identified.

**Confidence**: HIGH. The capability is operational. The known boundary (ESMA case) is documented. No engineering work is currently justified.

**Decision**: **Already Operational — Known Boundary.** Gate 2 (Provenance) is operational. The ESMA case provides a documented failure path when provenance metadata is unavailable via the tested path — the source is correctly classified as not publishable, with no engineering escalation required. There is currently no evidence justifying the creation of a new provenance engineering capability. This classification replaces the earlier `DEFER` — the boundary is not hypothetical, it is known and operational.

---

## 7. Summary Decision Table

| # | Capability | Decision | Confidence | Sources affected | Reuse potential |
|---|------------|----------|------------|------------------|-----------------|
| 1 | Content-Path Qualification | Already operational | HIGH | 4 mismatches caught | HIGH (universal) |
| 2 | Configuration Contract Compatibility | Already operational | HIGH | 4 incompatibilities caught | HIGH (universal) |
| 3 | Content-Regex Pattern Specificity | Already Operational — Configuration Authoring Required | HIGH | 1 confirmed (FED_ENF) + 1 hypothesized (ABS) | MEDIUM (per-source authoring, not platform) |
| 4 | Adapter / Browser Rendering | ENGINEERING CANDIDATE — Evidence-Supported | HIGH (gap exists) / LOW (strategic value) | 1 confirmed (TCMB) | UNKNOWN — needs survey |
| 5 | Language / Multilingual Coverage | ENGINEERING CANDIDATE — Evidence-Supported | HIGH (gap exists) / MEDIUM (priority) | 1 confirmed (INSEE) + hypothesized (count unverified) | HIGH (hypothesis, not quantified) |
| 6 | Event-Model Representation | ENGINEERING CANDIDATE — Evidence-Supported | HIGH (gap exists) / MEDIUM (which types) | 3 confirmed + 1 compounded | MEDIUM-HIGH (varies by type) |
| 7 | Provenance Metadata Compatibility | Already Operational — Known Boundary | HIGH | 1 confirmed (ESMA — routing outcome, no engineering) | LOW (no engineering needed) |

### Engineering Candidates Registry (Evidence-Supported)

Three capabilities have evidence supporting a real platform-capability gap but do NOT have sufficient strategic-value evidence to justify BUILD NOW. They are tracked here as candidates for future engineering prioritization:

| Capability | Confirmed source cases | Estimated reuse | Next evidence needed |
|------------|------------------------|-----------------|----------------------|
| Adapter / Browser Rendering | TCMB (engineering required) | UNKNOWN | Survey Global Source Universe for browser-rendering requirement (per `CAPABILITY_SURVEY_PROTOCOL_V1`) |
| Language / Multilingual Coverage | INSEE (French gap), Banca d'Italia (compounded) | HIGH (hypothesis — count unverified) | Verified source-language inventory of Global Source Universe |
| Event-Model Representation | Bundesbank, FSB, UK HM Treasury (3 confirmed) | MEDIUM-HIGH (2-3 sources per new event type) | Survey of uncovered intelligence types in Global Source Universe |

**TCMB is NOT auto-added to the engineering backlog.** TCMB is the evidence base for the Adapter / Browser Rendering capability candidate. Whether to build that capability depends on the reuse survey — not on TCMB's institutional value alone.

**Capabilities 3 (Content-Regex Specificity) and 7 (Provenance Compatibility) are NOT engineering candidates.** Capability 3 is an operational onboarding authoring capability (config-only remediation pattern proven by FED_ENF). Capability 7 is operational with a known boundary (ESMA case — routing outcome, no engineering). Neither belongs in the engineering backlog.

---

## 8. What This Portfolio Does NOT Decide

- Does NOT decide BUILD NOW for any capability. The three engineering candidates require the user's evaluation matrix (institutional value × reuse potential × blocked-source count × implementation risk) before promotion.
- Does NOT modify the v2 qualification framework. Capabilities 1, 2, and 7 are already operationalized as v2 stages or known boundaries — no change.
- Does NOT recommend probing ABS. ABS appears as a hypothesized case for Capability 3 (Content-Regex Specificity) — classification remains as an untested hypothesis per the user's "stop remediation" directive.
- Does NOT update the Commercial Model. The commercial promise stands unchanged.
- Does NOT prioritize capabilities. The order in this document is the user's original list order, not a priority ranking.
- Does NOT treat content-regex phrasing differences as platform engineering. Per Capability 3's revised classification: pattern specificity is an operational authoring capability, not an engineering candidate. This prevents converting every source's phrasing differences into engineering backlog items.

---

## 9. Recommended Next Actions (For User Decision)

1. **Author `CAPABILITY_SURVEY_PROTOCOL_V1` before any survey execution.** A defensible sampling framework must be defined BEFORE probing the 178-source Universe — not after. The survey question is not only "does this source need browser rendering?" but the broader question: is there sufficient **reuse-adjusted platform value** to justify building a general capability? The protocol must define: sampling strategy, per-capability survey questions, evidence thresholds for BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC, and the evaluation matrix application.

2. **Execute the three surveys per the protocol** (only after the protocol is ratified):
   - Browser-rendering requirement survey (feeds Capability 4)
   - Non-English primary language inventory (feeds Capability 5)
   - Uncovered intelligence types inventory (feeds Capability 6)

3. **No action on Capability 3 (Content-Regex Specificity) or Capability 7 (Provenance Compatibility).** Both are operational — Capability 3 has a working config-only remediation pattern (FED_ENF); Capability 7 has a known boundary (ESMA case — routing outcome). Neither requires engineering work or survey action.

4. **Do NOT open an engineering work package for TCMB specifically.** TCMB is evidence for Capability 4 — it is not itself a work item. The work item (if approved post-survey) is "browser-rendered ingestion capability" — a platform capability that may or may not include TCMB depending on the survey results.

---

## 10. Document Status

**CAPABILITY_GAP_PORTFOLIO_V1 — CORRECTED per user review of `9e0733c`**

User review identified three corrections (applied in this version):
1. **Capability 7 (Provenance)** reclassified from `DEFER` to `Already Operational — Known Boundary`. The ESMA case provides a documented failure path (`document_date` not available via tested path) — this is a confirmed boundary, not a hypothesis. Gate 2 is operational; no engineering work is justified.
2. **Capability 3 (Content-Regex Specificity)** reclassified from `ENGINEERING CANDIDATE` to `Already Operational — Configuration Authoring Required`. FED_ENF proved the problem is config-only remediable. Pattern specificity is a Gate 5 root-cause category, not a platform engineering candidate. This prevents converting every source's phrasing differences into engineering backlog items.
3. **Capability 5 (Language Coverage)** wording corrected. Removed the inaccurate "Spanish library would unlock BCB Portuguese-adjacent" claim (BCB is Brazilian/Portuguese, not Spanish-adjacent). Tightened the reuse estimate from "7+ sources" (quantified) to "hypothesis — count unverified". Language coverage should be prioritized by verified source-language inventory, not assumed regional similarity.

Final classification summary:
- 4 capabilities **Already Operational** (1, 2, 3, 7) — including 2 with known boundaries (3: config authoring; 7: provenance routing)
- 3 capabilities **ENGINEERING CANDIDATE — Evidence-Supported** (4, 5, 6)
- 0 capabilities **BUILD NOW** (no platform engineering is currently justified)
- 0 capabilities **DEFER** (Capability 7 promoted out of DEFER per user review)

The user is asked to ratify these corrected classifications. The next step (per Section 9) is to author `CAPABILITY_SURVEY_PROTOCOL_V1` before any survey execution.

---

## 11. Document Provenance

| Field | Value |
|-------|-------|
| Author | main (Super Z) |
| Date | 2026-08-15 |
| Branch | `top20-prescreening` |
| Base commits | `3a759cd` (Replication Batch) → `b59ab3f` (phrasing correction) → `f16bc00` (FED_ENF remediation) → `04289d2` (TCMB remediation) → `45bbd88` (TCMB phrasing corrections) → `9e0733c` (Portfolio V1 initial) → this commit (Portfolio V1 corrected) |
| Evidence base | 16 source cases (BaFin, Eurostat, US Treasury, RBI, Bundesbank, Banca d'Italia, OCC, SEBI, PRA, INSEE, FSB, UK HM Treasury, FED_ENF, ABS, TCMB, ESMA) |
| Methodology | v2 qualification framework (FROZEN) |
| Does NOT modify | v2 framework, Queue V1.1, pipeline code, source_configs.py, Contract, Commercial Model, website |

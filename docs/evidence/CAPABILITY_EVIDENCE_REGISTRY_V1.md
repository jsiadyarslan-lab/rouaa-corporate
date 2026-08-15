# Capability Evidence Registry V1

**Date**: 2026-08-15
**Branch**: `top20-prescreening`
**Status**: V1 — DRAFT FOR REVIEW
**Type**: Evidence artifact — documentation only. Does NOT modify any other artifact.
**Purpose**: Document the actual confirmed evidence for each capability boundary, distinct from the Capability Gap Portfolio's capability-importance view.

---

## 1. Purpose and Distinction

### Purpose

This registry documents the **actual confirmed evidence** that proves each capability boundary. It is an evidence artifact, not a roadmap decision.

### Distinction from Capability Gap Portfolio

```text
Capability Gap Portfolio (docs/strategy/CAPABILITY_GAP_PORTFOLIO_V1.md)
→ What capabilities do we believe are important?
→ Per-capability: problem definition, evidence, current capability,
   observed boundary, reuse potential, institutional value, engineering
   implication, confidence, decision

Capability Evidence Registry (this document)
→ What actual evidence proves each boundary?
→ Per-capability: confirmed cases with exact commits, evidence
   strength, observed failure/boundary, successful remediation
   evidence (if any), reuse potential, known affected sources,
   engineering implication, what is NOT established, open questions
```

The Portfolio answers "which capabilities matter?". The Registry answers "what evidence do we actually have?".

### What this registry is NOT

- NOT a roadmap decision document
- NOT a quantitative prevalence estimate
- NOT a replacement for the Portfolio
- NOT a modification of any frozen artifact

### Evidence classification states

Each confirmed case is classified into one of five states:

| State | Definition |
|-------|------------|
| `OBSERVED` | The boundary was observed at least once (e.g., Gate 5 FAIL with documented root cause). Single observation. |
| `VALIDATED` | The boundary was observed and the observation method was validated (e.g., v2 pre-screening stage confirmed the boundary before Gate 5). |
| `REMEDIATION-VALIDATED` | A remediation was attempted AND succeeded AND the remediation type (config-only vs engineering-required) was confirmed. |
| `ENGINEERING-REQUIRED` | Remediation was attempted AND failed because engineering is required (config-only cannot resolve). |
| `HYPOTHESIS / UNKNOWN` | The boundary is plausible but untested. NOT counted as evidence. |

---

## 2. Per-Capability Records

Each capability record uses the 12-field structure:

```text
Capability
Current status
Evidence strength
Confirmed cases
Source / intelligence type
Evidence commit(s)
Observed failure/boundary
Successful remediation evidence, if any
Reuse potential
Known affected sources
Engineering implication
What is NOT established
Open questions
```

---

### Capability 1 — Provenance Metadata Compatibility

**Current status**: ALREADY OPERATIONAL — KNOWN BOUNDARY

**Evidence strength**: HIGH — Gate 2 surfaces provenance boundaries cleanly. ESMA case provides a documented failure path (routing outcome, not engineering escalation). BaFin case provides a documented resolution path (configuration adjustment).

**Confirmed cases**:

| # | Source | State | Intelligence type | Evidence commit(s) | Observed failure/boundary | Successful remediation evidence |
|---|--------|-------|-------------------|---------------------|---------------------------|----------------------------------|
| 1 | ESMA | `OBSERVED` | Provenance (publish date metadata) | Earlier RSS/HTML testing (pre-V1 survey); documented in `e2479fb` (V1 Results correction) | `document_date` not available via tested path. Source not publishable — correctly classified by Gate 2 as not publishable. No engineering escalation. | NONE — routing outcome, not engineering issue |
| 2 | BaFin | `REMEDIATION-VALIDATED` | Provenance (RSS `<pubDate>` formatting) | Gate 5 Re-run 1 (`3bc9448`); Gate 5 Re-run 2 (`282de0f`); final BaFin PUBLISHABLE PASS documented in `282de0f` | Initial Gate 5 run flagged provenance ambiguity (unusual `<pubDate>` formatting in BaFin RSS feed) | YES — resolved in Gate 5 Re-run 2 via configuration adjustment (NOT engineering). BaFin achieved PUBLISHABLE PASS with 9 IOs. |

**Source / intelligence type**: Central bank / financial regulator RSS feeds with `<pubDate>` metadata

**Evidence commit(s)**: ESMA — documented in `e2479fb`; BaFin — `3bc9448`, `282de0f`

**Observed failure/boundary**: The boundary is between "source exposes provenance metadata via a supported format" (covered by Gate 2) and "source does not expose provenance metadata via the tested path" (correctly classified as not publishable by Gate 2). This boundary is known, documented, and operational — Gate 2 surfaces it cleanly.

**Successful remediation evidence**: BaFin — `<pubDate>` formatting issue resolved via configuration adjustment (NOT engineering). BaFin achieved PUBLISHABLE PASS in Gate 5 Re-run 2.

**Reuse potential**: LOW for additional engineering. The current Gate 2 implementation correctly handles the provenance cases observed. The ESMA boundary is a routing outcome (source not publishable via this path), not an engineering gap.

**Known affected sources**: ESMA (confirmed boundary), BaFin (resolved via configuration)

**Engineering implication**: NONE demonstrated. Gate 2 is operational. No confirmed case requires new provenance tooling.

**What is NOT established**:
- Whether browser-rendered sources (TCMB-class) have different date metadata in rendered vs static HTML — UNTESTED (subsumed under Capability 4, not a separate provenance gap)
- Whether sources with non-standard date formats would fail Gate 2 — plausible but no confirmed case beyond ESMA

**Open questions**:
- Are there provenance metadata formats the current Gate 2 normalizer does not handle? UNKNOWN — no confirmed case
- Would browser-rendered ingestion (Capability 4) require additional provenance metadata handling? UNKNOWN — not tested

---

### Capability 2 — Content-Path Boundary

**Current status**: ALREADY OPERATIONAL — v2 Content-Path Alignment stage validated

**Evidence strength**: HIGH — v2 Content-Path Alignment stage validated across 4 mismatch cases + 4 aligned cases. The v2 stage correctly detects content-path mismatch BEFORE Gate 5.

**Confirmed cases**:

| # | Source | State | Intelligence type | Evidence commit(s) | Observed failure/boundary | Successful remediation evidence |
|---|--------|-------|-------------------|---------------------|---------------------------|----------------------------------|
| 1 | US Treasury | `VALIDATED` | Sanctions designations (`sanctions_designation` event type) | Top 20 Pre-Screening (`4443553`); Gate 5 testing (`b70171e`); Content-Path Qualification Findings V1 (`b70171e`) | Selected path returned general press releases, NOT sanctions designations. 0 facts at Gate 5. Root cause: content-path mismatch (press releases ≠ sanctions designations). | NONE — routed to CONTENT-PATH REVIEW. Content-path mismatch is a routing outcome, not an engineering issue. |
| 2 | RBI | `VALIDATED` | Monetary policy decisions (`monetary_policy_decision` event type) | Top 20 Pre-Screening (`4443553`); Gate 5 testing (`b70171e`) | Selected path returned operational press releases, NOT rate decisions. 0 facts at Gate 5. Root cause: content-path mismatch (operations ≠ rate decisions). | NONE — routed to CONTENT-PATH REVIEW. |
| 3 | SEBI | `VALIDATED` | Regulatory enforcement (`regulatory_enforcement` event type) | Prospective v2 (`3a759cd`, corrected `b59ab3f`) | Press releases listing contains mixed content types, not all enforcement-specific. Routed to CONTENT-PATH REVIEW. | NONE — routed to CONTENT-PATH REVIEW. |
| 4 | PRA | `VALIDATED` | Regulatory enforcement (`regulatory_enforcement` event type) | Prospective v2 (`3a759cd`, corrected `b59ab3f`) | RSS feed contains general publications, not enforcement-specific. Routed to CONTENT-PATH REVIEW. | NONE — routed to CONTENT-PATH REVIEW. |
| 5 | BaFin | `VALIDATED` (aligned) | Regulatory enforcement (`regulatory_enforcement` event type) | Gate 5 Re-run 2 (`282de0f`) | Content-path was aligned; BaFin achieved PUBLISHABLE PASS. | YES — Gate 5 PASS in Re-run 2 (9 IOs, config-only onboarding). |
| 6 | Eurostat | `VALIDATED` (aligned) | Statistical release (`statistical_release` event type) | Gate 5 PASS (`3454603`) | Content-path was aligned; Eurostat achieved PUBLISHABLE PASS. | YES — Gate 5 PASS (`3454603`), 1 IO, config-only onboarding. |
| 7 | FED_ENF | `VALIDATED` (aligned) | Regulatory enforcement (`regulatory_enforcement` event type) | Prospective v2 (`3a759cd`); FED_ENF Remediation Test (`f16bc00`) | Content-path was aligned. Initial Gate 5 FAIL was due to pattern specificity (Capability 3), NOT content-path. Remediation confirmed config-only fixable. | YES — FED_ENF remediation PASS (`f16bc00`), config-only. |
| 8 | ABS | `OBSERVED` (aligned) | Statistical release (`statistical_release` event type) | Prospective v2 (`3a759cd`) | Content-path was aligned. Initial Gate 5 FAIL was due to pattern terminology (Capability 3 hypothesis), NOT content-path. | NONE — remediation not attempted (per user directive). |

**Source / intelligence type**: Multiple — sanctions designations (US Treasury), monetary policy (RBI), regulatory enforcement (SEBI, PRA, BaFin, FED_ENF), statistical release (Eurostat, ABS)

**Evidence commit(s)**: `4443553`, `b70171e`, `3a759cd`, `b59ab3f`, `282de0f`, `3454603`, `f16bc00`

**Observed failure/boundary**: The boundary is between "selected source path contains the intelligence type the patterns expect" (covered) and "selected source path contains a different intelligence type" (caught by v2 Content-Path Alignment stage). Every content-path mismatch in the evidence base was caught by v2 pre-screening before Gate 5.

**Successful remediation evidence**: 3 aligned cases reached Gate 5 PASS — BaFin (Re-run 2, `282de0f`), Eurostat (`3454603`), FED_ENF remediation (`f16bc00`). These confirm the v2 Content-Path Alignment stage correctly identifies aligned paths.

**Reuse potential**: HIGH (universal) — every source has multiple paths; content-path qualification is a universal pre-Gate-5 check.

**Known affected sources**: US Treasury, RBI, SEBI, PRA (mismatches caught); BaFin, Eurostat, FED_ENF, ABS (aligned paths confirmed)

**Engineering implication**: NONE — already operationalized as v2 SQR stage (SQR-only field, not Queue state). Methodology document: Onboarding Boundary Analysis V2 (FROZEN)

**What is NOT established**:
- Whether the v2 Content-Path Alignment stage produces false negatives (aligned paths that actually contain mixed content types) — no confirmed false negative in current evidence
- Whether the "up to 3 representative documents" sampling target is sufficient for all source types — no confirmed under-sampling case

**Open questions**:
- Are there source structures where the content-path boundary is more subtle (e.g., mixed content within a single RSS feed)? UNKNOWN — no confirmed case beyond what v2 detects

---

### Capability 3 — Pattern Specificity

**Current status**: ALREADY OPERATIONAL — Configuration Authoring Required. Pattern specificity is a Gate 5 root-cause category, not a platform engineering candidate.

**Evidence strength**: HIGH that the failure mode exists (FED_ENF proved it). HIGH that config-only remediation works for at least one source (FED_ENF). UNKNOWN whether ABS follows the same pattern (untested hypothesis).

**Confirmed cases**:

| # | Source | State | Intelligence type | Evidence commit(s) | Observed failure/boundary | Successful remediation evidence |
|---|--------|-------|-------------------|---------------------|---------------------------|----------------------------------|
| 1 | FED_ENF | `REMEDIATION-VALIDATED` | Regulatory enforcement (`regulatory_enforcement` event type) | Prospective v2 (`3a759cd`); FED_ENF Remediation Test (`f16bc00`) | Original `regulatory_patterns` expected "enforcement action with X" / "enforcement action against X". Actual Fed phrasing is "Consent Prohibition against X", "Consent Order against X", "Written Agreement with X", "Civil Money Penalty against X". 0 facts at Gate 5 (FAIL). | YES — REMEDIATION-VALIDATED as CONFIG-ONLY. Replacing the patterns in `source_configs.py` (config-only change, no code change) produced 5 facts, 3 events, 3 publishable IOs. Pipeline state: DOCUMENTED → PUBLISHABLE. Engineering intervention: False. Source-specific code: 0. Commit `f16bc00`. |
| 2 | ABS | `HYPOTHESIS / UNKNOWN` | Statistical release (`statistical_release` event type) | Prospective v2 (`3a759cd`) | Configured `statistical_patterns` use US-centric phrasing ("CPI inflation was X%", "GDP grew by X%"). Australian Bureau of Statistics may use different terminology. 0 facts at Gate 5 (FAIL). | NONE — remediation NOT attempted (per user directive). Hypothesis: Australian statistical terminology differs from US-centric patterns. May follow same config-only remediation pattern as FED_ENF, but UNVERIFIED. |

**Source / intelligence type**: FED_ENF (regulatory enforcement — Federal Reserve enforcement actions); ABS (statistical release — Australian CPI/inflation statistics)

**Evidence commit(s)**: `3a759cd`, `f16bc00`

**Observed failure/boundary**: The boundary is between "category-level applicability" (Gate 4 + Configuration Contract — pattern categories exist and metrics match trigger_metrics) and "pattern-level execution readiness" (Gate 5 — the specific regex patterns match the source's actual phrasing). Pre-screening proved category applicability; Gate 5 proved the patterns didn't match the actual phrasing. This boundary is NOT covered by any v2 stage — and per the v2 design, it should NOT be. Pattern execution readiness is a Gate 5 root-cause category.

**Successful remediation evidence**: FED_ENF — config-only remediation validated. Replacing patterns (no code change) produced 5 facts, 3 publishable IOs. The remediation was config-only: 0 engineering intervention, 0 source-specific code, 0 lines changed in `extractor.py` / `detector.py` / `normalizer.py` / `schemas.py` / `PATTERN_TYPE_METADATA` / `EVENT_TYPE_RULES`. Commit `f16bc00`.

**Reuse potential**: MEDIUM per source (each source has its own phrasing), but the remediation pattern is reusable — the Phase B diagnostic script written for FED_ENF (already in repo) can serve as a pre-flight tool for any future source.

**Known affected sources**: FED_ENF (resolved config-only), ABS (untested hypothesis)

**Engineering implication**: NONE for platform engineering. This is a source-configuration authoring capability. The Phase B diagnostic script (already in repo) can serve as the seed for any future pre-flight tooling — but that is utility-script work, not core pipeline work.

**What is NOT established**:
- Whether ABS follows the same config-only remediation pattern as FED_ENF — UNVERIFIED (remediation not attempted per user directive)
- How many future sources will hit content-regex specificity gaps — no quantitative estimate possible from this environment

**Open questions**:
- Should pattern-authoring tooling (Phase B diagnostic as a formal pre-Gate-5 tool) be built as a utility script? UNKNOWN — no decision made
- Should a per-source pattern library (curated set of patterns per event_type with multiple phrasings) be built? UNKNOWN — no decision made
- Are there content-regex specificity failures that CANNOT be resolved config-only (i.e., that require extractor/detector changes)? UNKNOWN — FED_ENF was config-only; no other case tested

---

### Capability 4 — Adapter / Browser Rendering

**Current status**: ENGINEERING-REQUIRED CASE CONFIRMED (1 source: TCMB); other 3 cases confirmed BROWSER_RENDERED via validated survey measurement

**Evidence strength**: HIGH that the capability gap exists (4 confirmed cases). HIGH that TCMB requires engineering (remediation test proved config-only cannot resolve it). HIGH that 3 additional cases (NSO India, Basel Committee, EIOPA) require browser rendering (validated by V1 + V1.1 survey using the improved measurement protocol). UNKNOWN whether the 4 cases are representative (survey could not measure prevalence due to measurement infrastructure limitations).

**Confirmed cases**:

| # | Source | State | Intelligence type | Evidence commit(s) | Observed failure/boundary | Successful remediation evidence |
|---|--------|-------|-------------------|---------------------|---------------------------|----------------------------------|
| 1 | TCMB | `ENGINEERING-REQUIRED` | Monetary policy decisions (`monetary_policy_decision` event type) | Prospective v2 (`3a759cd`); TCMB Remediation Test (`04289d2`); TCMB Phrasing Corrections (`45bbd88`) | Static HTML (urllib, 35 KB) contains 27 empty year tab panes — zero individual press release URLs. Original `link_pattern` matched 0 URLs. Playwright-rendered HTML (66 KB) contains 33 press release URLs — original `link_pattern` matches all 33. The link_pattern was CORRECT; the failure is that the URLs aren't available to the static adapter. | NONE — REMEDIATION-VALIDATED AS ENGINEERING-REQUIRED. Config-only remediation CANNOT resolve this failure. Two engineering options identified: (1) `force_browser: True` config flag + modify `fetch_with_fallback()` (~10 lines in `fetcher.py`); (2) new `html_index_js` feed_format + parser (~25 lines in `fetcher.py`). Per user directive: STOP, do NOT execute engineering. |
| 2 | NSO India | `VALIDATED` | Statistical release (`statistical_release` event type) | Survey V1 (`2ac5d04`); Survey V1.1 (`e193071`) | V1: static count=0, rendered count≥5, individual document URLs exposed after rendering (satisfies measurement-validity rule). V1.1 confirmed BROWSER_RENDERED. | NONE — remediation not attempted (per user directive). |
| 3 | Basel Committee | `VALIDATED` | Financial coordination / prudential supervision | Survey V1 (`2ac5d04`); Survey V1.1 (`e193071`) | V1: static count=2, rendered count≥5, individual document URLs exposed after rendering. V1.1 confirmed BROWSER_RENDERED using improved measurement protocol (Playwright on selected content path per Discovery vs Ingestion Distinction rule). V1.1 content inspection: 2 docs fetched, classified as `financial_coordination + prudential_supervision`. | NONE — remediation not attempted. V1 evidence preserved in V1.1 (not new discovery). |
| 4 | EIOPA | `VALIDATED` | Regulatory enforcement | Survey V1 (`2ac5d04`); Survey V1.1 (`e193071`) | V1: static count=0, rendered count≥5, individual document URLs exposed after rendering. V1.1 confirmed BROWSER_RENDERED using improved measurement protocol. V1.1 content inspection: 0 docs fetched (no doc URLs in content path). | NONE — remediation not attempted. V1 evidence preserved in V1.1 (not new discovery). |

**Source / intelligence type**: TCMB (monetary policy decisions — Central Bank of Turkey); NSO India (statistical release — Indian National Statistical Office); Basel Committee (financial coordination / prudential supervision — BIS Basel Committee on Banking Supervision); EIOPA (regulatory enforcement — European Insurance and Occupational Pensions Authority)

**Evidence commit(s)**: `3a759cd`, `04289d2`, `45bbd88`, `2ac5d04`, `e193071`

**Observed failure/boundary**: The boundary is between "source is accessible via static HTTP" (covered by urllib) and "source requires browser rendering to expose document URLs" (requires Playwright on the SELECTED CONTENT PATH). This is NOT a configuration-expressiveness issue (the link_pattern was correct in all 4 cases) — it is an adapter-capability issue (the fetcher cannot reach the content without browser execution).

The Discovery vs Ingestion Distinction (FROZEN in `14de356`) clarifies: use of Playwright for URL discovery does NOT classify a source as BROWSER_RENDERED. A source is BROWSER_RENDERED only when the **selected content path itself** exposes target documents only after browser rendering.

**Successful remediation evidence**: NONE for any of the 4 cases. TCMB remediation test (`04289d2`, `45bbd88`) confirmed that config-only CANNOT resolve this failure — engineering is required. The other 3 cases (NSO India, Basel Committee, EIOPA) were not remediation-tested; they were classified BROWSER_RENDERED via validated survey measurement.

**Reuse potential**: UNKNOWN — this is the critical unknown. The 4 confirmed cases are real evidence, but the survey (V1 + V1.1) could not reliably estimate how many of the 149 untested sources require browser rendering. The 14 sources that remained INCONCLUSIVE after V1.1 re-run are NOT evidence of browser-rendering requirement — they are evidence of measurement infrastructure limitations (homepage fetch blocked).

**Known affected sources**: TCMB (engineering-required), NSO India (validated), Basel Committee (validated), EIOPA (validated). 4 confirmed cases total.

**Engineering implication**: MEDIUM. Two options identified in TCMB remediation test (`45bbd88`):
1. Add `force_browser: True` config flag + modify `fetch_with_fallback()` to respect it (~10 lines in `fetcher.py`)
2. Add a new `html_index_js` feed_format + new parser branch (~25 lines in `fetcher.py`)

Both are additive — they don't require rewriting the fetcher, just adding a new code path. Playwright is already a dependency. Risk: browser rendering is slower and more resource-intensive than urllib; pipeline throughput would drop for sources using this path. Reproducibility may also be affected (browser-rendered content can vary with timing).

**What is NOT established**:
- **Prevalence in the 149-source untested population** — UNKNOWN and cannot be reliably measured from this environment (V1 + V1.1 survey could not achieve ≥80% measurement completeness)
- **Whether the 4 confirmed cases are outliers or representative** — cannot be determined without reliable prevalence measurement
- **Whether WebSphere Portal CMS (used by TCMB) is also used by other central banks/government portals** — unverified hypothesis
- **Whether modern SPA-heavy bank/regulator websites require browser rendering** — unverified hypothesis
- **Whether the 14 V1.1 INCONCLUSIVE sources would have been classified BROWSER_RENDERED with better URL discovery** — UNKNOWN (their homepages could not be fetched from this environment)

**Open questions**:
- If a customer explicitly requests TCMB (or NSO India, Basel Committee, EIOPA), should the engineering work be authorized? UNKNOWN — strategic decision, not evidence-based
- If browser-rendered ingestion capability is built, would it unlock more than these 4 sources? UNKNOWN — would require either manual URL discovery per source OR a different execution environment with unrestricted network access
- Should V1.2 universe survey be authorized with a different approach (e.g., manual URL discovery)? NOT RECOMMENDED per user directive — the survey approach has been exhausted from this execution environment

---

### Capability 5 — Language / Multilingual Boundary

**Current status**: EVIDENCE-SUPPORTED — confirmed gaps exist across 6 languages; prevalence unknown

**Evidence strength**: HIGH that the gap exists (INSEE confirmed from prospective v2; V1.1 confirmed 6 additional non-English source-language gaps across 5 languages). HIGH that each gap is real. UNKNOWN whether the prevalence is high enough to justify a per-language pattern library (survey could not measure this reliably — 53.1% of V1.1 sources had UNKNOWN language).

**Confirmed cases**:

| # | Source | State | Intelligence type | Evidence commit(s) | Observed failure/boundary | Successful remediation evidence |
|---|--------|-------|-------------------|---------------------|---------------------------|----------------------------------|
| 1 | INSEE | `OBSERVED` | Statistical release (`statistical_release` event type) | Prospective v2 (`3a759cd`, corrected `b59ab3f`) | Aligned content-path, compatible contract, BUT French-language content didn't match English patterns. Root cause classification included both representation gap AND French-language gap. Routed to ENGINEERING REVIEW. | NONE — remediation not attempted (per user directive). |
| 2 | Banca d'Italia | `OBSERVED` (compounded) | Regulatory enforcement | Prospective v2 (`3a759cd`, corrected `b59ab3f`) | EUR-metric representation gap + HTML index keyword boundary (Italian-language titles rejected by the keyword filter). The keyword filter is part of the `parse_html_index()` adapter behavior. Routed to ENGINEERING REVIEW. | NONE — remediation not attempted. |
| 3 | FSO Switzerland | `OBSERVED` | Statistical release | Survey V1.1 (`e193071`) | V1.1 confirmed: primary language=de (German), English version=NO. Content not fetchable for inspection (SPARSE_CONTENT). | NONE — observation only. |
| 4 | Federal Financial Supervisory Authority (BaFin) | `OBSERVED` | Regulatory enforcement | Survey V1.1 (`e193071`) | V1.1 confirmed: primary language=de (German), English version=NO. V1 INCONCLUSIVE → V1.1 SPARSE_CONTENT via improved URL discovery. Content not fetchable for inspection. | NONE — measurement improvement only (V1 → V1.1 promotion). NOT onboarding success. |
| 5 | Ministry of Finance (Saudi Arabia) | `OBSERVED` | Fiscal policy / financial coordination | Survey V1.1 (`e193071`) | V1.1 confirmed: primary language=ar (Arabic), English version=NO. SPARSE_CONTENT. | NONE — observation only. |
| 6 | CBS (Netherlands) | `OBSERVED` | Statistical release | Survey V1.1 (`e193071`) | V1.1 confirmed: primary language=nl (Dutch), English version=NO. V1 INCONCLUSIVE → V1.1 STATIC_SUFFICIENT via improved URL discovery. Content inspection: 3 docs fetched, classified `fiscal_policy + other`. | NONE — measurement improvement only. NOT onboarding success. |
| 7 | Banco Central do Brasil | `OBSERVED` | Monetary policy / statistical release | Survey V1.1 (`e193071`) | V1.1 confirmed: primary language=pt (Portuguese), English version=YES. SPARSE_CONTENT. | NONE — observation only. |
| 8 | CSRC (China) | `OBSERVED` | Regulatory enforcement | Survey V1.1 (`e193071`) | V1.1 confirmed: primary language=zh (Chinese), English version=NO. STATIC_SUFFICIENT but 0 docs inspected (no doc URLs in content path). | NONE — observation only. |

**Source / intelligence type**: Multiple — statistical release (INSEE, FSO, CBS Netherlands, Banco Central do Brasil), regulatory enforcement (Banca d'Italia, BaFin, CSRC), monetary policy (Banco Central do Brasil), fiscal policy (Saudi MoF)

**Evidence commit(s)**: `3a759cd`, `b59ab3f`, `e193071`

**Observed failure/boundary**: The boundary is between "source publishes in English" (covered by existing patterns) and "source publishes in another language" (not covered). This is invisible at pre-screening if the source has an English version (TCMB has English; INSEE has English summaries but substantive content is French).

The boundary has two sub-components:
1. **Per-language pattern libraries** — rate_patterns / regulatory_patterns / statistical_patterns are English-only. Non-English content won't match.
2. **HTML index keyword filter internationalization** — the `parse_html_index()` adapter filters document titles by `content_keywords` (English). Non-English document titles will be rejected.

**Successful remediation evidence**: NONE. No per-language pattern library has been built. No HTML index keyword filter internationalization has been implemented. The confirmed cases document the boundary; they do NOT validate any remediation approach.

**Reuse potential**: HIGH if ROUAA's market includes non-English-speaking jurisdictions (which it does — global expansion is the strategic frame). A French pattern library would unlock INSEE + Banque de France + AMF. A German library would unlock Bundesbank + BaFin German content. Language coverage should be prioritized by verified source-language inventory, not assumed regional similarity — the count of sources per language is currently observed (not quantified as prevalence).

**Known affected sources**: INSEE (French), Banca d'Italia (Italian — compounded), FSO Switzerland (German), BaFin (German), Saudi MoF (Arabic), CBS Netherlands (Dutch), Banco Central do Brasil (Portuguese), CSRC (Chinese). 8 confirmed sources across 6 languages.

**Engineering implication**: MEDIUM-HIGH. Two distinct work items:
1. **Per-language pattern libraries**: authoring regex patterns for French, German, Italian, Spanish, Japanese, Chinese, Arabic, Portuguese. This is configuration work (data, not code) — but it requires linguistic expertise and is substantial in volume.
2. **HTML index keyword filter internationalization**: the current `parse_html_index()` adapter filters document titles by `content_keywords`. For non-English sources, this filter rejects legitimate titles. Fix: either disable keyword filtering for non-English sources (config flag) or accept non-English keywords (config data). Small code change (~5 lines) + per-source config data.

**What is NOT established**:
- **Prevalence in the 149-source untested population** — UNKNOWN (53.1% UNKNOWN language in V1.1)
- **Which jurisdictions are prioritized for global expansion** — strategic decision, not measurement
- **Whether sources with an English version can be onboarded via English patterns + Capability 3 authoring** — likely YES for most, but unverified
- **Whether building any single language library unlocks enough sources to justify the work** — UNKNOWN (depends on global expansion roadmap)

**Open questions**:
- Should a French pattern library be built to unlock INSEE + Banque de France + AMF? UNKNOWN — strategic decision
- Should the HTML index keyword filter be internationalized (small code change, blocks Banca d'Italia compounded case)? UNKNOWN — no decision made
- Are there non-English sources with an English version that could be onboarded via English patterns without a per-language library? UNKNOWN — likely YES but unverified

---

### Capability 6 — Event-Model Representation

**Current status**: EVIDENCE-SUPPORTED — confirmed representation gaps for 3 distinct event types from prospective v2; V1.1 content inspection confirmed 4 uncovered intelligence types (actual inspection, not stratum heuristic)

**Evidence strength**: HIGH that the gap exists (3 confirmed from prospective v2 + V1.1 content inspection confirmed 4 uncovered types across 9 successfully-inspected sources). MEDIUM on which event types to prioritize (V1.1 content inspection was actual, not stratum-based, but coverage was only 28.1%).

**Confirmed cases**:

| # | Source | State | Intelligence type | Evidence commit(s) | Observed failure/boundary | Successful remediation evidence |
|---|--------|-------|-------------------|---------------------|---------------------------|----------------------------------|
| 1 | Bundesbank | `OBSERVED` | EUR monetary statistics (UNCOVERED) | Prospective v2 (`3a759cd`, corrected `b59ab3f`); Configuration Contract Verification (`bd7285d`) | EUR-denominated metrics (e.g., EUR inflation, EUR GDP) don't appear in any existing trigger_metrics set. Static contract verification: NOT COMPATIBLE. The source's intelligence (EUR monetary statistics) cannot be represented by the existing event types. REPRESENTATION GAP. | NONE — routed to ENGINEERING REVIEW. |
| 2 | FSB | `OBSERVED` | Financial policy coordination (UNCOVERED) | Prospective v2 (`3a759cd`, corrected `b59ab3f`); Configuration Contract Verification (`bd7285d`) | Configured event type was `regulatory_enforcement`, but FSB content is financial policy coordination — no existing event type semantically represents this. Static contract: NOT COMPATIBLE. REPRESENTATION GAP. | NONE — routed to ENGINEERING REVIEW. |
| 3 | UK HM Treasury | `OBSERVED` | Fiscal policy / government guidance (UNCOVERED) | Prospective v2 (`3a759cd`, corrected `b59ab3f`); Configuration Contract Verification (`bd7285d`) | Configured event type was `regulatory_enforcement`, but HMT content is fiscal policy / guidance — no existing event type for "fiscal policy" or "government economic guidance". Static contract: NOT COMPATIBLE. REPRESENTATION GAP. | NONE — routed to ENGINEERING REVIEW. |
| 4 | INSEE | `OBSERVED` (compounded) | Statistical release (partly covered) + French-language gap | Prospective v2 (`3a759cd`) | Partly representation gap (some French statistical content fits `statistical_release`, but some doesn't). Compounded with language gap (Capability 5). | NONE — routed to ENGINEERING REVIEW. |
| 5 | Bangladesh Bank | `OBSERVED` (V1.1 content inspection) | fiscal_policy + monetary_policy + statistical_release (mixed) | Survey V1.1 (`e193071`) | V1.1 content inspection (actual, not stratum-based): 2 docs fetched. Classified as `fiscal_policy + monetary_policy + statistical_release`. fiscal_policy is UNCOVERED. | NONE — observation only. |
| 6 | Central Bank of Egypt | `OBSERVED` (V1.1 content inspection) | monetary_policy + prudential_supervision + consumer_protection + other (mixed) | Survey V1.1 (`e193071`) | V1.1 content inspection: 3 docs fetched. Classified as `monetary_policy + prudential_supervision + consumer_protection + other`. prudential_supervision and consumer_protection are UNCOVERED. | NONE — observation only. |
| 7 | CBS (Netherlands) | `OBSERVED` (V1.1 content inspection) | fiscal_policy + other (mixed) | Survey V1.1 (`e193071`) | V1.1 content inspection: 3 docs fetched. Classified as `fiscal_policy + other`. fiscal_policy is UNCOVERED. | NONE — observation only. |
| 8 | Basel Committee | `OBSERVED` (V1.1 content inspection) | financial_coordination + prudential_supervision (mixed) | Survey V1.1 (`e193071`) | V1.1 content inspection: 2 docs fetched. Classified as `financial_coordination + prudential_supervision`. Both are UNCOVERED. | NONE — observation only. |

**Source / intelligence type**: Multiple — EUR monetary statistics (Bundesbank), financial policy coordination (FSB, Basel Committee), fiscal policy (UK HM Treasury, Bangladesh Bank, CBS Netherlands), prudential supervision (Central Bank of Egypt, Basel Committee), consumer protection (Central Bank of Egypt)

**Evidence commit(s)**: `3a759cd`, `b59ab3f`, `bd7285d`, `e193071`

**Observed failure/boundary**: The boundary is between "source's intelligence fits an existing event type" (covered by 6 existing event types: monetary_policy_decision, regulatory_enforcement, statistical_release, earnings_release, sanctions_designation, market_statistic_release) and "source's intelligence requires a new event type" (not covered). v2 pre-screening CANNOT resolve this — it can only detect it and route to ENGINEERING REVIEW.

The v2 Configuration Contract Verification stage (static check, deterministic) correctly identifies contract violations BEFORE Gate 5. All 3 prospective v2 representation gap cases were routed to ENGINEERING REVIEW with "representation gap" findings — none required Gate 5 execution to discover.

**Successful remediation evidence**: NONE. No new event type has been built. The confirmed cases document the boundary; they do NOT validate any remediation approach.

**Reuse potential**: VARIES by event type:
- **EUR monetary statistics event type**: would unlock Bundesbank + Banca d'Italia + Banque de France (potentially). 2-3 sources. MEDIUM reuse. Overlaps with ECB (already qualified) — may be lower value than it appears.
- **Financial policy coordination event type**: would unlock FSB + BIS (potentially). 2 sources. MEDIUM reuse. High-tier institutions.
- **Fiscal policy / government guidance event type**: would unlock UK HM Treasury + US Treasury (fiscal content) + potentially others (Bangladesh Bank, CBS Netherlands showed fiscal_policy in V1.1 content inspection). 2-4 sources. MEDIUM-HIGH reuse. G7 coverage.
- **Prudential supervision event type**: V1.1 confirmed 2 sources (Central Bank of Egypt, Basel Committee). Unknown broader reuse.
- **Consumer protection event type**: V1.1 confirmed 1 source (Central Bank of Egypt). LOW reuse based on current evidence.

**Known affected sources**: Bundesbank (EUR monetary statistics), FSB (financial coordination), UK HM Treasury (fiscal policy), Bangladesh Bank (fiscal — V1.1 content inspection), CBS Netherlands (fiscal — V1.1), Central Bank of Egypt (prudential + consumer protection — V1.1), Basel Committee (financial coordination + prudential — V1.1), INSEE (compounded).

**Engineering implication**: MEDIUM per event type. Each new event type requires:
- New `EVENT_TYPE_RULES` entry (~10 lines in `detector.py`)
- New `PATTERN_TYPE_METADATA` entries for new metrics (~5 lines per metric)
- New pattern library (similar to existing rate_patterns / regulatory_patterns) — configuration work
- SQR template update to document the new event type

No core architectural changes — the existing config-driven architecture handles new event types cleanly. But each new event type is a meaningful authoring investment (pattern library + trigger_metrics design + sample content validation).

**What is NOT established**:
- **Which intelligence types are most prevalent in the untested population** — UNKNOWN (V1.1 content inspection only 28.1% complete)
- **Whether the 7 "other" classifications in V1.1 represent new uncovered types or classifier limitations** — UNKNOWN (the keyword-based classifier may be too narrow)
- **Whether building any single event type unlocks enough sources to justify the work** — UNKNOWN (depends on global expansion roadmap)
- **Whether the V1.1 content inspection classifier produced accurate results** — UNKNOWN (the classifier is keyword-based; actual content may produce additional uncovered types or fewer of some types)

**Open questions**:
- Should an EUR monetary statistics event type be built to unlock Bundesbank + Banca d'Italia + Banque de France? UNKNOWN — strategic decision (overlaps with ECB already qualified)
- Should a financial policy coordination event type be built to unlock FSB + BIS? UNKNOWN — strategic decision
- Should a fiscal policy / government guidance event type be built to unlock HMT + US Treasury fiscal + others? UNKNOWN — strategic decision
- Should the V1.1 keyword-based content classifier be improved (to reduce "other" classifications)? UNKNOWN — would require additional validation work

---

### Capability 7 — Configuration Contract Compatibility

**Current status**: ALREADY OPERATIONAL — v2 Configuration Contract Verification stage validated

**Evidence strength**: HIGH — v2 Configuration Contract Verification stage (static check, deterministic, HIGH confidence) validated across 4 incompatible cases + multiple compatible cases. All 4 incompatible cases were routed to ENGINEERING REVIEW before Gate 5.

**Confirmed cases**:

| # | Source | State | Intelligence type | Evidence commit(s) | Observed failure/boundary | Successful remediation evidence |
|---|--------|-------|-------------------|---------------------|---------------------------|----------------------------------|
| 1 | Bundesbank | `VALIDATED` (incompatible) | EUR monetary statistics | Configuration Contract Verification V1 (`bd7285d`); Content-Path Qualification Findings V1 (`b70171e`); Prospective v2 (`3a759cd`) | Configured event_type=monetary_policy_decision, but EUR-denominated metrics (e.g., EUR inflation, EUR GDP) don't appear in any existing trigger_metrics set. Static contract verification: NOT COMPATIBLE. | NONE — routed to ENGINEERING REVIEW. The contract incompatibility points to Capability 6 (Event-Model Representation) gap. |
| 2 | Banca d'Italia | `VALIDATED` (incompatible) | EUR monetary statistics + Italian keyword boundary | Configuration Contract Verification V1 (`bd7285d`); Prospective v2 (`3a759cd`) | Same EUR-metric gap as Bundesbank + HTML index keyword boundary (Italian-language titles rejected by the keyword filter). Static contract: NOT COMPATIBLE. | NONE — routed to ENGINEERING REVIEW. |
| 3 | FSB | `VALIDATED` (incompatible) | Financial policy coordination | Configuration Contract Verification V1 (`bd7285d`); Prospective v2 (`3a759cd`) | Configured event type was `regulatory_enforcement`, but FSB content is financial policy coordination — no existing event type semantically represents this. Static contract: NOT COMPATIBLE. | NONE — routed to ENGINEERING REVIEW. |
| 4 | UK HM Treasury | `VALIDATED` (incompatible) | Fiscal policy / government guidance | Configuration Contract Verification V1 (`bd7285d`); Prospective v2 (`3a759cd`) | Configured event type was `regulatory_enforcement`, but HMT content is fiscal policy / guidance — no existing event type for "fiscal policy" or "government economic guidance". Static contract: NOT COMPATIBLE. | NONE — routed to ENGINEERING REVIEW. |
| 5 | BaFin | `VALIDATED` (compatible) | Regulatory enforcement | Gate 5 Re-run 2 (`282de0f`); Configuration Contract Verification V1 (`bd7285d`) | Contract compatible. BaFin achieved PUBLISHABLE PASS in Gate 5 Re-run 2. | YES — Gate 5 PASS (`282de0f`), 9 IOs, config-only onboarding. |
| 6 | Eurostat | `VALIDATED` (compatible) | Statistical release | Gate 5 PASS (`3454603`); Configuration Contract Verification V1 (`bd7285d`) | Contract compatible. Eurostat achieved PUBLISHABLE PASS. | YES — Gate 5 PASS (`3454603`), 1 IO, config-only onboarding. |
| 7 | FED_ENF | `VALIDATED` (compatible) | Regulatory enforcement | FED_ENF Remediation Test (`f16bc00`) | Contract compatible. Initial Gate 5 FAIL was due to pattern specificity (Capability 3), NOT contract incompatibility. | YES — FED_ENF remediation PASS (`f16bc00`), config-only. |

**Source / intelligence type**: Multiple — EUR monetary statistics (Bundesbank, Banca d'Italia), financial policy coordination (FSB), fiscal policy (UK HM Treasury), regulatory enforcement (BaFin, FED_ENF), statistical release (Eurostat)

**Evidence commit(s)**: `bd7285d`, `b70171e`, `3a759cd`, `282de0f`, `3454603`, `f16bc00`

**Observed failure/boundary**: The boundary is between "source's configured `event_type` is supported by `EVENT_TYPE_RULES` AND the configured pattern metrics appear in the event type's `trigger_metrics`" (covered) and "either the event_type is not supported OR the pattern metrics don't match trigger_metrics" (NOT COMPATIBLE, caught by static check).

The v2 Configuration Contract Verification stage (static check, deterministic, HIGH confidence) correctly identifies contract violations BEFORE Gate 5. All 4 incompatible cases were routed to ENGINEERING REVIEW without requiring Gate 5 execution.

**Successful remediation evidence**: 3 compatible cases reached Gate 5 PASS — BaFin (Re-run 2, `282de0f`), Eurostat (`3454603`), FED_ENF remediation (`f16bc00`). These confirm the v2 Configuration Contract Verification stage correctly identifies compatible contracts.

**Reuse potential**: HIGH (universal) — static contract verification is universal.

**Known affected sources**: Bundesbank, Banca d'Italia, FSB, UK HM Treasury (incompatible); BaFin, Eurostat, FED_ENF (compatible). The 4 incompatible cases point to Capability 6 (Event-Model Representation) gaps.

**Engineering implication**: NONE for the verification mechanism itself (already implemented as static check). The contract violations point to Event-Model Representation gaps (Capability 6).

**What is NOT established**:
- Whether the v2 Configuration Contract Verification stage produces false negatives (compatible contracts that actually fail at Gate 5) — no confirmed false negative in current evidence
- Whether the static check covers all contract dimensions — appears to, but no systematic review performed

**Open questions**:
- Are there contract dimensions the v2 verification stage does NOT check? UNKNOWN — no confirmed gap
- Should the v2 stage be promoted from SQR-only field to Queue state? UNKNOWN — operational recommendation deferred (per v2 Operationalization Review)

---

## 3. Evidence Classification Summary

| # | Capability | Confirmed cases | Evidence states | Decision readiness |
|---|------------|-----------------|------------------|-------------------|
| 1 | Provenance Metadata Compatibility | 2 (ESMA, BaFin) | 1 OBSERVED + 1 REMEDIATION-VALIDATED | EVIDENCE-SUPPORTED |
| 2 | Content-Path Boundary | 8 (4 mismatches + 4 aligned) | 7 VALIDATED + 1 OBSERVED | EVIDENCE-SUPPORTED |
| 3 | Pattern Specificity | 2 (FED_ENF, ABS) | 1 REMEDIATION-VALIDATED + 1 HYPOTHESIS/UNKNOWN | EVIDENCE-SUPPORTED (FED_ENF); EVIDENCE-INCOMPLETE (ABS) |
| 4 | Adapter / Browser Rendering | 4 (TCMB, NSO India, Basel, EIOPA) | 1 ENGINEERING-REQUIRED + 3 VALIDATED | ENGINEERING-REQUIRED CASE CONFIRMED (TCMB); REUSE UNKNOWN |
| 5 | Language / Multilingual Boundary | 8 across 6 languages | 8 OBSERVED | EVIDENCE-SUPPORTED; REUSE UNKNOWN |
| 6 | Event-Model Representation | 8 (3 prospective + 5 V1.1 content inspection) | 8 OBSERVED | EVIDENCE-SUPPORTED; REUSE UNKNOWN |
| 7 | Configuration Contract Compatibility | 7 (4 incompatible + 3 compatible) | 7 VALIDATED | EVIDENCE-SUPPORTED |

---

## 4. Capability Decision Readiness

For each capability, the decision readiness is classified using ONLY these labels (no roadmap decision is made by this document):

| Capability | Decision readiness |
|------------|-------------------|
| 1 — Provenance Metadata Compatibility | `EVIDENCE-SUPPORTED` (ESMA boundary + BaFin remediation validated) |
| 2 — Content-Path Boundary | `EVIDENCE-SUPPORTED` (4 mismatches + 4 aligned, v2 stage validated) |
| 3 — Pattern Specificity | `EVIDENCE-SUPPORTED` for FED_ENF remediation pattern; `EVIDENCE-INCOMPLETE` for ABS hypothesis |
| 4 — Adapter / Browser Rendering | `ENGINEERING-REQUIRED CASE CONFIRMED` (TCMB); `REUSE UNKNOWN` (prevalence cannot be measured from this environment) |
| 5 — Language / Multilingual Boundary | `EVIDENCE-SUPPORTED` (8 confirmed gaps across 6 languages); `REUSE UNKNOWN` (prevalence cannot be measured) |
| 6 — Event-Model Representation | `EVIDENCE-SUPPORTED` (3 confirmed representation gaps + 4 uncovered types from V1.1 content inspection); `REUSE UNKNOWN` (which event types to prioritize depends on strategic roadmap) |
| 7 — Configuration Contract Compatibility | `EVIDENCE-SUPPORTED` (4 incompatible + 3 compatible, v2 stage validated) |

### What "Decision Readiness" means

- `EVIDENCE-SUPPORTED`: The capability boundary is confirmed by actual evidence. A roadmap decision COULD be made (build now, defer, or customer-specific) — but this document does NOT make that decision. The user makes the decision based on strategic context.
- `EVIDENCE-INCOMPLETE`: The capability boundary is plausible but unverified. A specific case (e.g., ABS for Pattern Specificity) remains a hypothesis. No roadmap decision should be made until the hypothesis is tested.
- `ENGINEERING-REQUIRED CASE CONFIRMED`: At least one case has been confirmed via remediation test as requiring engineering (config-only cannot resolve). The engineering work is well-defined. Whether to execute it is a strategic decision.
- `REUSE UNKNOWN`: The capability gap is confirmed, but the prevalence (how many sources are affected) is unknown and cannot be measured from this environment. A BUILD NOW decision would require additional evidence (e.g., customer demand signals, manual URL discovery, different execution environment).

### What this section does NOT do

- Does NOT make any BUILD NOW / ENGINEERING CANDIDATE / CUSTOMER-SPECIFIC / DEFER decision
- Does NOT apply the evaluation matrix
- Does NOT promote any capability to roadmap priority
- Does NOT estimate prevalence

---

## 5. Critical Disciplinary Rules Applied

Per user directive:

1. **Do not infer prevalence from these cases.** The 4 confirmed Adapter cases do NOT mean "X% of the 178-source Universe requires browser rendering." They mean "4 sources are confirmed to require browser rendering." The prevalence in the 149-source untested population is UNKNOWN.

2. **Do not infer BUILD NOW.** No capability is promoted to BUILD NOW by this document. The user makes that decision based on strategic context.

3. **Do not convert a source-specific failure into a platform capability requirement without evidence.** TCMB's engineering-required status does NOT automatically mean "browser-rendered ingestion capability should be built now." It means "TCMB requires engineering to onboard." Whether to build the capability depends on reuse potential, which is UNKNOWN.

4. **Distinguish `configuration-only remediation` from `engineering-required remediation`.**
   - FED_ENF (Pattern Specificity): config-only remediation validated (`f16bc00`). 0 engineering, 0 source-specific code.
   - TCMB (Adapter): engineering-required remediation confirmed (`04289d2`, `45bbd88`). Config-only CANNOT resolve.
   - BaFin (Provenance): config-only remediation validated (`282de0f`). 0 engineering.

5. **Preserve exact evidence commits.** Every confirmed case references its exact evidence commit(s). No evidence is paraphrased or summarized without commit reference.

---

## 6. What This Registry Does NOT Do

- Does NOT make any roadmap decision
- Does NOT apply the evaluation matrix
- Does NOT estimate prevalence in the 178-source Universe
- Does NOT promote any capability to BUILD NOW
- Does NOT modify CAPABILITY_GAP_PORTFOLIO_V1.md (complementary view, not replacement)
- Does NOT update the Commercial Model
- Does NOT recommend V1.2 universe survey with the same automated approach
- Does NOT infer that a source-specific failure is a platform capability requirement

---

## 7. Document Status

**CAPABILITY_EVIDENCE_REGISTRY_V1 — DRAFT FOR REVIEW.**

This registry:
- Documents the actual confirmed evidence for each capability boundary (Section 2)
- Uses the 12-field structure per capability as specified by the user
- Classifies each confirmed case into one of 5 evidence states (OBSERVED / VALIDATED / REMEDIATION-VALIDATED / ENGINEERING-REQUIRED / HYPOTHESIS-UNKNOWN)
- Provides a Capability Decision Readiness section (Section 4) with 4 classification labels
- Does NOT make any roadmap decision
- Does NOT modify any frozen artifact

The user is asked to:
1. Review the confirmed-evidence registry
2. Confirm the evidence classifications are accurate
3. Use this registry as the evidence input for future capability roadmap decisions (when strategic context is available)

---

## 8. Document Provenance

| Field | Value |
|-------|-------|
| Author | main (Super Z) |
| Date | 2026-08-15 |
| Branch | `top20-prescreening` |
| Base commits | All prior capability workstream commits through `98c9a94` (Capability Evidence Registry strategic-shift commit, docs/strategy/) → this commit (Capability Evidence Registry V1 evidence artifact, docs/evidence/) |
| Evidence base | 16+ confirmed source cases across 7 capabilities, with exact commit references |
| Distinguishes from | docs/strategy/CAPABILITY_GAP_PORTFOLIO_V1.md (Portfolio = capability-importance view; Registry = evidence-confirmation view) |
| Does NOT modify | Capability Gap Portfolio V1, Capability Survey Results V1/V1.1, Survey Protocols V1/V1.1, Queue V1/V1.1, v2 Qualification framework, pipeline/config, Contract, Commercial Model, website |

# TCMB Remediation Test — Findings V1

**Date**: 2026-08-15
**Branch**: `top20-prescreening`
**Base**: Prospective v2 Replication Batch Summary (corrected at `b59ab3f`)
**Source tested**: TCMB (Central Bank of the Republic of Turkey)
**User directive**: Run ONE remediation validation on TCMB only. Goal: determine whether the TCMB Gate 5 failure (0 documents fetched because `link_pattern` did not match the WebSphere Portal URL structure) is resolvable by configuration only. If any core engineering is required: STOP.

---

## Question Under Test

> هل يمكن حل فشل TCMB عبر تعديل التكوين فقط؟

(Is the TCMB Gate 5 failure resolvable through configuration alone?)

The original Replication Batch Summary (`3a759cd`, corrected at `b59ab3f`) classified the TCMB failure as a link-pattern mismatch:

> `link_pattern` mismatch مع WebSphere URL structure.

This test sought to determine whether a configuration-only change to the `link_pattern` (and possibly other TCMB config fields) could resolve the failure.

---

## Initial Hypothesis

Based on the original classification, the working hypothesis was:

> The TCMB link_pattern regex (`/wps/wcm/connect/[^"']+Press\+Releases/2026/[^"']+`) did not match the actual URL structure used by the WebSphere Portal CMS. A refined `link_pattern` (handling URL-encoded spaces `%20` vs `+`, or different path structures) would resolve the failure.

If this hypothesis were correct, a CONFIG-ONLY change to the `link_pattern` field in `source_configs.py` would produce fetched documents and potentially extractable facts.

---

## Method

### Phase A Diagnostic — Static HTML Structure

Script: `scripts/pipeline/tcmb_remediation_phase_a_diagnostic.py`

1. Fetched the TCMB Press Releases index page via `urllib` (same path the pipeline uses).
2. Saved the raw static HTML (35 KB) for inspection.
3. Extracted all `<a href>` URLs (93 total).
4. Tested the EXISTING link_pattern against the static HTML.
5. Tested 7 CANDIDATE patterns of varying breadth against the static HTML.

### Phase B Diagnostic — Playwright Rendering Verification

Script: `scripts/pipeline/tcmb_remediation_phase_b_playwright.py`

1. Launched Playwright Chromium headless.
2. Navigated to the TCMB Press Releases index URL.
3. Waited 5 seconds for `networkidle` plus any lazy-loaded content.
4. Captured the fully rendered HTML (66 KB).
5. Extracted all `<a href>` URLs and tested the original `link_pattern` against the rendered HTML.

---

## Findings

### Phase A Result: Static HTML contains NO press release URLs

The static HTML returned by `urllib` (35 KB) contains:

- All navigation links (About the Bank, Core Functions, Announcements, Banknotes, etc.)
- A year-tab skeleton with 27 empty year panes:
  ```html
  <div id="y00010001" data-w-tab="2026" class="block-tabs-content w-tab-pane w--tab-active">
  
  
  </div>
  <div id="y00010002" data-w-tab="2025" class="block-tabs-content w-tab-pane ">
  
  </div>
  ... (27 empty panes total)
  ```
- Zero individual press release URLs anywhere in the static HTML.

The existing `link_pattern` `/wps/wcm/connect/[^"']+Press\+Releases/2026/[^"']+` matched **0 URLs** in the static HTML — not because the pattern is wrong, but because there are no URLs in the static HTML to match.

Seven candidate patterns were tested. The most permissive (matching any `/wps/wcm/connect/` URL containing `Press` or `Basin`) found only 2 unique URLs — both navigation links to the Press Briefings / Press Releases section pages, not individual press release articles.

### Phase B Result: Playwright rendering reveals 33 press release URLs

After JavaScript rendering via Playwright:

- Rendered HTML length: 66 KB (vs 35 KB static — ~31 KB of dynamically generated content).
- Total `<a href>` URLs: 163 (vs 93 static).
- The original `link_pattern` `/wps/wcm/connect/[^"']+Press\+Releases/2026/[^"']+` matched **33 URLs** — exactly the press release URLs that should have been discovered.

The URLs have the structure:
```
/wps/wcm/connect/EN/TCMB+EN/Main+Menu/Announcements/Press+Releases/2026/ANO2026-XX
```

The original `link_pattern` was CORRECT. The URLs follow the exact format the pattern expected. The issue was never a pattern mismatch — it was that `urllib` cannot execute JavaScript and the press release URLs are JavaScript-rendered.

### Inspection of supporting JavaScript files

The TCMB page loads two custom JavaScript files:
- `basin-duyurulari-filter.js` (1.1 KB) — purely client-side filtering of already-rendered DOM elements. No AJAX calls.
- `sublanding.js` (10.7 KB) — navigation, mega-menus, sub-left-link behavior. No AJAX calls. Declares `var pageContent = "N"; /*Page does not include ajax*/` (overridden to `"A"` in an inline script on the actual page).

A search of the rendered HTML for `<iframe>`, `data-src`, `data-url`, and `fetch(` patterns found no additional content-loading mechanism. The press release URLs appear to be inserted into the DOM by the WebSphere Portal server-side rendering layer (which is invoked by the JavaScript on the client side, requiring browser execution).

---

## Answer to the Question

> **TCMB Gate 5 failure CANNOT be resolved through configuration alone.** A core pipeline change to `fetcher.py` is required to enable JavaScript rendering for sources that need it.

The original classification of "link-pattern mismatch" was incorrect. The accurate classification is:

> **JavaScript-rendered content requirement.** The TCMB Press Releases page returns only a navigation skeleton via static HTTP; the actual press release URLs are populated by client-side JavaScript. `urllib` cannot execute JavaScript, so no `link_pattern` (no matter how broad or refined) can match URLs that aren't present in the static HTML.

---

## Validation Matrix

| Metric | Phase A (urllib, static) | Phase B (Playwright, rendered) |
|--------|--------------------------|--------------------------------|
| HTTP status | 200 | 200 |
| HTML length | 35 KB | 66 KB |
| Total `<a href>` URLs | 93 | 163 |
| Original link_pattern matches | 0 | **33** |
| Press release URLs discovered | 0 | 33 (PDF links to ANO2026-XX.pdf) |

### What would happen IF Playwright were enabled for TCMB

The pipeline's existing `link_pattern` would match all 33 URLs (predicted). The pipeline's existing PDF handling (`feed_format` detection + pdfplumber normalizer) would then download each PDF, extract text, and apply the `rate_patterns` already configured for TCMB. If the PDFs contain rate decision language matching the patterns, facts would be extracted.

However, validating this end-to-end is OUT OF SCOPE for this test because it requires a core pipeline change (the next section).

---

## Resolution Options Considered

Three options were considered for resolving the TCMB failure:

### Option A: Add `force_browser: True` flag to TCMB config + modify `fetch_with_fallback()`

This would require:
- **Config change**: Add `"force_browser": True` to TCMB source config.
- **Core pipeline change**: Modify `fetcher.py` `fetch_with_fallback()` to check for `force_browser` flag and skip directly to Playwright instead of trying urllib first. Add a new `fetch_method` value (e.g., `"playwright_forced"`) so the metrics differentiate this from auto-fallback.

Estimated lines of code changed in `fetcher.py`: ~10 lines.

**This is a CORE PIPELINE CHANGE.** Per user constraint, STOP.

### Option B: Add a new `html_index_js` feed_format + new parser

This would require:
- **Config change**: Set `"feed_format": "html_index_js"` in TCMB config.
- **Core pipeline change**: Add a new branch in `fetch_source_publications()` (in `fetcher.py`) that handles `html_index_js` by calling Playwright instead of urllib.

Estimated lines of code changed in `fetcher.py`: ~25 lines.

**This is a CORE PIPELINE CHANGE.** Per user constraint, STOP.

### Option C: Discover a hidden JSON/XML API endpoint

The TCMB JS files (`basin-duyurulari-filter.js`, `sublanding.js`) contain NO AJAX calls. The WebSphere Portal CMS renders the content server-side into the JavaScript-rendered DOM. There is no JSON/XML API endpoint discoverable from the page's JavaScript.

**This option is not viable** — no API endpoint exists.

---

## Decision

### Per User Constraint

> "if any core engineering is required: STOP"

All viable resolution options (A and B) require core pipeline changes to `fetcher.py`. Option C is not viable. The test is STOPPED at the diagnostic phase.

### Final Classification

> **ENGINEERING REQUIRED**

The TCMB Gate 5 failure is NOT a pattern-specificity issue (as originally classified). It is a **JavaScript-rendered content requirement** that requires core pipeline changes to `fetcher.py` to enable Playwright fetching for sources that return only navigation skeletons via static HTTP.

---

## What This Test Does NOT Prove

This test does NOT prove:

- ❌ That enabling Playwright would actually produce publishable IOs from TCMB (end-to-end validation was not performed — would require core changes first).
- ❌ That all JavaScript-rendered sources will fail similarly (only TCMB was tested).
- ❌ That the existing rate_patterns for TCMB are correct (the patterns were never applied because no documents were fetched — the patterns remain untested).
- ❌ Anything about ABS (untested per user directive).

---

## What This Test DOES Prove

1. **The original classification was wrong.** The Replication Batch Summary (`3a759cd`, corrected at `b59ab3f`) classified TCMB as "link-pattern mismatch (WebSphere Portal URL encoding)". The accurate classification is "JavaScript-rendered content requirement". The pattern itself was correct.

2. **A config-only `link_pattern` change CANNOT resolve this failure.** No matter how the `link_pattern` is adjusted, urllib returns only the static HTML which contains zero press release URLs. The URLs only appear after JavaScript rendering.

3. **TCMB is a fundamentally different failure mode from FED_ENF.** FED_ENF was a content-regex specificity issue (config-only fix). TCMB is a JavaScript-rendering requirement (engineering required).

4. **Pattern-Specificity is NOT a single homogeneous category.** Within the "pattern-specificity" bucket identified in the Replication Batch Summary, there are at least two distinct sub-types:
   - **Content-regex specificity** (FED_ENF) — config-only remediable
   - **Link-pattern + JS rendering** (TCMB) — engineering required
   
   This has implications for treating Pattern-Specificity as a Gate 5 root-cause category — it may need sub-classification.

---

## Strategic Implications

### For the Pattern-Specificity boundary

The user's strategic framing (from the review of `3a759cd`):

```
QUALIFICATION_READY
→
PATTERN-SPECIFICITY / EXECUTION READINESS   ← this boundary
→ Gate 5
```

This test reveals that **Pattern-Specificity is not monolithic**. Within it, there are sub-types that differ in remediation cost:

```
QUALIFICATION_READY
→
PATTERN-SPECIFICITY
  ├── Content-regex specificity    (FED_ENF: config-only fixable)
  ├── Link-pattern specificity     (TCMB: JS rendering required — engineering)
  └── Terminology specificity      (ABS: untested — hypothesis only)
→ Gate 5
```

### Per user decision: NO new gate added

The user explicitly directed (in the review of `3a759cd`):
> ثم لا نضيف Gate 4.5 ولا Pattern-Specificity Gate الآن.

(Do not add Gate 4.5 or Pattern-Specificity Gate now.)

Pattern-Specificity remains a Gate 5 root-cause category. The two data points now available (FED_ENF config-only, TCMB engineering-required) suggest that if Pattern-Specificity were ever to be promoted to a gate, it would need to differentiate between config-only-fixable sub-types and engineering-required sub-types. But this is a future decision based on more data.

### For the commercial promise

The user explicitly directed:
> Do not update commercial claims from this single test.

The (corrected) commercial promise stands unchanged:

> ROUAA can qualify source access, provenance, content-path alignment, configuration compatibility, and semantic representation before onboarding; Gate 5 remains the validation step for source-specific extraction behavior.

This test does NOT change that promise. It adds ONE empirical data point: in the TCMB case, the Gate 5 failure was NOT resolvable through configuration alone — but that fact does not (yet) warrant a commercial claim update.

---

## Cumulative Remediation Evidence Base

After this test, the cumulative evidence base for Pattern-Specificity remediation is:

| Source | Pre-screening | Gate 5 (first attempt) | Remediation test | Classification |
|--------|----------------|------------------------|------------------|----------------|
| Eurostat | QUALIFICATION_READY | PASS | (not attempted — already PASS) | n/a |
| FED_ENF | QUALIFICATION_READY | FAIL (pattern-phrasing) | **PASS (config-only)** | Content-regex specificity — config-only |
| TCMB | QUALIFICATION_READY | FAIL (link-pattern) | **ENGINEERING REQUIRED** | Link-pattern + JS rendering — engineering required |
| ABS | QUALIFICATION_READY | FAIL (terminology) | not attempted | untested hypothesis |

**Two distinct Pattern-Specificity sub-types are now empirically distinguished.** Future remediation tests on additional sources will help determine whether these sub-types generalize.

---

## Reproducibility

This test is fully reproducible:

- **Diagnostic scripts**:
  - `scripts/pipeline/tcmb_remediation_phase_a_diagnostic.py` (static HTML analysis)
  - `scripts/pipeline/tcmb_remediation_phase_b_playwright.py` (Playwright rendering verification)
- **Saved HTML artifacts** (not committed to repo — regenerated on each run):
  - `scripts/pipeline/output/tcmb_diag/tcmb_press_index.html` (35 KB static HTML)
  - `scripts/pipeline/output/tcmb_diag/tcmb_press_index_rendered.html` (66 KB rendered HTML)
  - `scripts/pipeline/output/tcmb_diag/tcmb_press_urls.txt` (URL list)

Anyone can re-run the diagnostics on this branch and observe the same results.

---

## Next Steps (User Decision Pending)

This test is complete and stopped at the diagnostic phase per user constraint. The user may now decide:

1. **Stop remediation testing here**: We now have evidence for two distinct Pattern-Specificity sub-types (FED_ENF config-only, TCMB engineering-required). The classification of ABS remains a hypothesis.

2. **Test ABS**: Run a third remediation test on ABS (terminology mismatch — Australian statistical phrasing). This may reveal a third sub-type or confirm that ABS is also config-only (like FED_ENF).

3. **Engineering decision for TCMB**: If TCMB is strategically important, the engineering options (A or B) can be designed and approved in a separate work package. This would NOT be part of the v2 qualification methodology — it would be a pipeline enhancement.

Per the user's original directive, this test does NOT modify:
- `source_configs.py` (no config changes applied — none would help)
- `fetcher.py` (no core pipeline changes)
- Any other pipeline file
- The v2 methodology / SQR / Queue / Contract / website

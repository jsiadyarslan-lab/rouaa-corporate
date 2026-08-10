# C5-A — Residual Defect Discovery Scan (Exhaustive)

> **Status:** Discovery only. **No code modified. No commit of edits. No execution.**
> **Baseline:** `ee00a90` on `main`
> **Method:** Exhaustive grep scan across all HTML files (excluding `index.html` — FROZEN) + external JS files
> **Purpose:** Complete inventory of D.1, D.3, D.12, D.14 instances with per-instance classification.

---

## Summary Counts

| Category | Total instances | CONFIRMED | REVIEW | ACCEPTABLE |
|---|---|---|---|---|
| D.1 — Dead CSS / dead sub-blocks | ~60 | ~42 (developers.html) + 19 (other pages, need verification) | 19 | 0 |
| D.3 — Malformed HTML comments | 2 | 2 | 0 | 0 |
| D.12 — Missing source links | 15 (source-explorer) + 6 (sample-library) | 21 | 0 | 0 |
| D.14 — Timing claims in JS/data | 22 (products.js) | 22 | 0 | 0 |
| **Total** | **~105** | **~87** | **19** | **0** |

---

## D.1 — Dead CSS / Dead Style Blocks

### CONFIRMED — developers.html (~42 dead classes)

The entire `developers.html` inline `<style>` block (lines 13–278) contains large sections of dead CSS from previous page architectures that were replaced. The dead classes are organized in sub-blocks:

| Dead sub-block | Lines | Classes | Used in body? |
|---|---|---|---|
| `.tree-*` (Tree visual) | 70–78 | `.tree-visual`, `.tree-connector`, `.tree-lines`, `.tree-line`, `.tree-line-icon`, `.tree-line-name`, `.tree-line-count`, `.tree-products` | 0 (confirmed in Delta 22, comment says "legacy, unused") |
| `.arch-branch.b-*` (modifier colors) | 84–88 | `.b-media`, `.b-trading`, `.b-research`, `.b-risk`, `.b-dev` | 0 (confirmed in Delta 22) |
| `.bridge-*` (Bridge Logic) | 54–61 | `.bridge-logic`, `.bridge-block`, `.bridge-block-h`, `.bridge-block-val`, `.bridge-arrow` | 0 |
| `.arch-tree / .arch-root / .arch-branches` | 63–77 | `.arch-tree`, `.arch-root`, `.arch-root-h`, `.arch-root-sub`, `.arch-branches`, `.arch-branch`, `.arch-branch-h`, `.arch-branch-icon`, `.arch-branch-name` | 0 |
| `.arch-suite-* / .arch-cap-* / .arch-product-*` | 95–110 | `.arch-suite-desc`, `.arch-capabilities`, `.arch-capability`, `.arch-cap-name`, `.arch-suite-foot`, `.arch-suite-count`, `.arch-suite-link`, `.arch-products-list`, `.arch-product-row`, `.arch-product-name`, `.arch-product-arrow` | 0 |
| `.arch-powered-*` | 121–124 | `.arch-powered`, `.arch-powered-h`, `.arch-powered-tag` | 0 |
| `.buying-*` | 112–119 | `.buying-grid`, `.buying-card`, `.buying-num`, `.buying-h`, `.buying-desc`, `.buying-example` | 0 |
| `.cta-final` | 127–129 | `.cta-final` (may be used — need verification) | REVIEW |
| `.dev-scope` etc. | 131+ | These ARE used (live CSS for current page structure) | ✓ Live |

**Total dead classes in developers.html: ~42** (7 tree + 5 b-* + 5 bridge + 9 arch-tree/root + 11 arch-suite/cap/product + 3 arch-powered + 6 buying = ~46, minus overlaps = ~42)

### REVIEW — other pages (19 potentially dead classes, need per-class verification)

| Page | Potentially dead classes | Reason for REVIEW |
|---|---|---|
| architecture.html | 12 (`.arch-meta-live`, `.blue`, `.connector`, `.evidence-meta-sep`, `.muted`, `.orb-1`, `.orb-2`, `.pipeline-layer-status`, `.scrolled`, `.step-card`, `.sup`, `.vr-demo-card`) | Some may be used in JS-generated DOM (Three.js canvas, dynamic content) — cannot confirm dead without runtime inspection |
| catalog.html | 7 (`.maturity-early`, `.maturity-enterprise`, `.maturity-preview`, `.maturity-production`, `.outcome-text`, `.product-card-link`, `.product-card-outcome`) | May be used in JS-rendered product cards from `products.js` — cannot confirm dead without runtime inspection |

**Classification: REVIEW — these classes may be used by JavaScript that generates DOM content at runtime. Static grep cannot detect JS-generated class usage.**

---

## D.3 — Malformed HTML Comments

### CONFIRMED (2 instances)

| # | File | Line | Current text | Classification | Recommended action |
|---|---|---|---|---|---|
| 1 | market-intelligence.html | 652 | `<!-- ============ CTA ============  <!-- ============ 8. CTA ============ -->` | CONFIRMED — nested `<!--` inside `<!--`, breaks comment balance (31 open / 30 close) | Replace with single clean comment: `<!-- ============ CTA ============ -->` |
| 2 | risk-intelligence.html | 598 | `<!-- ============ CTA ============  <!-- ============ 8. CTA ============ -->` | CONFIRMED — same pattern, breaks comment balance (32 open / 31 close) | Same fix |

**Root cause:** Copy-paste propagation between Market and Risk during section renumbering (confirmed in original Spec v6 D.3 defect entry).

---

## D.12 — Missing Source Links on Explorer Pages

### CONFIRMED — source-explorer.html (15 source entries, 0 external links)

`source-explorer.html` displays 15 source registry entries, each with an "Official Domain" field showing the domain as **plain text** (e.g., `federalreserve.gov`, `ecb.europa.eu`, `bis.org`) — NOT as clickable `<a href>` links.

| # | Line | Domain (as text) | Classification | Recommended action |
|---|---|---|---|---|
| 1 | 701 | `federalreserve.gov` | CONFIRMED | Wrap in `<a href="https://www.federalreserve.gov" target="_blank" rel="noopener">` |
| 2 | 756 | `ecb.europa.eu` | CONFIRMED | Same |
| 3 | ~810 | `bankofengland.co.uk` | CONFIRMED | Same |
| 4 | ~865 | `boj.or.jp` | CONFIRMED | Same |
| 5 | ~920 | `pbc.gov.cn` | CONFIRMED | Same |
| 6 | ~975 | `bls.gov` | CONFIRMED | Same |
| 7 | ~1030 | `bea.gov` | CONFIRMED | Same |
| 8 | ~1085 | `ec.europa.eu/eurostat` | CONFIRMED | Same |
| 9 | ~1140 | `sec.gov` | CONFIRMED | Same |
| 10 | ~1195 | `fca.org.uk` | CONFIRMED | Same |
| 11 | ~1250 | `nyse.com` | CONFIRMED | Same |
| 12 | ~1305 | `aramco.com` | CONFIRMED | Same |
| 13 | ~1360 | `imf.org` | CONFIRMED | Same |
| 14 | 1416 | `bis.org` | CONFIRMED | Same |
| 15 | ~1470 | `oecd.org` | CONFIRMED | Same |

**Total: 0 external `<a href>` links in source-explorer.html** — all 15 "Official Domain" values are plain text.

### CONFIRMED — sample-library.html (6 samples, 0 external source links)

`sample-library.html` displays 6 sample intelligence outputs, each with "Source" and "Document" fields showing source names as **plain text** (e.g., "Federal Reserve — Federal Open Market Committee", "U.S. Bureau of Labor Statistics") — NOT as clickable links.

| # | Line | Source (as text) | Classification | Recommended action |
|---|---|---|---|---|
| 1 | 348 | `Federal Reserve — Federal Open Market Committee` | CONFIRMED | Wrap in link to federalreserve.gov |
| 2 | 482 | `U.S. Bureau of Labor Statistics` | CONFIRMED | Wrap in link to bls.gov |
| 3 | ~620 | Source name (need exact line) | CONFIRMED | Link to source domain |
| 4 | ~730 | Source name | CONFIRMED | Same |
| 5 | 804 | `Federal Reserve — Federal Open Market Committee` | CONFIRMED | Same |
| 6 | ~840 | Source name | CONFIRMED | Same |

**Total: 0 external `<a href>` links in sample-library.html** for source references.

### ACCEPTABLE — evidence-explorer.html (8 external links present)

`evidence-explorer.html` has **8 external `<a href>` links** to official sources (federalreserve.gov, aramco.com, home.treasury.gov, ofac.treasury.gov). This page is NOT defective — it demonstrates the correct pattern that source-explorer and sample-library should adopt.

---

## D.14 — Timing Claims in External JS Data Files

### CONFIRMED — products.js (22 instances)

`products.js` (47KB, loaded by `catalog.html`) contains 22 timing/freshness claims in product descriptions that are rendered as visible HTML content. These are D.14 violations per Spec v7.

| # | Line | Exact text | Classification | Recommended replacement |
|---|---|---|---|---|
| 1 | 94 | `'Infographics from official data in seconds'` | CONFIRMED — "in seconds" | `'Infographics from official data — rapidly'` |
| 2 | 228 | `'Real-time analysis'` (feature) | CONFIRMED — "Real-time" | `'Live analysis'` or `'Configured analysis'` |
| 3 | 358 | `'A committee-ready decision memo — in minutes'` | CONFIRMED — "in minutes" | `'A committee-ready decision memo — within configured processing windows'` |
| 4 | 378 | `'Prepare an investment committee in minutes — not days'` | CONFIRMED — "in minutes" | `'Prepare an investment committee — within configured processing windows'` |
| 5 | 480 | `'From a global event to a risk alert — in seconds'` | CONFIRMED — "in seconds" | `'From a global event to a risk alert — through configured monitoring'` |
| 6 | 481 | `'A 24/7 monitor of geopolitical and economic events'` | CONFIRMED — "24/7" | `'Continuous monitoring of geopolitical and economic events'` |
| 7 | 481 | `'instant impact assessment'` | CONFIRMED — "instant" | `'rapid impact assessment'` |
| 8 | 492 | `'24/7 monitoring'` (feature) | CONFIRMED — "24/7" | `'Continuous monitoring'` |
| 9 | 500 | `'Reveal your portfolio\\'s exposure — in real time'` | CONFIRMED — "in real time" | `'Reveal your portfolio\\'s exposure — through configured analysis'` |
| 10 | 512 | `'Real-time analysis'` (feature) | CONFIRMED | `'Live analysis'` |
| 11 | 614 | `'Instant response'` (feature) | CONFIRMED — "instant" | `'Rapid response'` |
| 12 | 614 | `'Real-time updates'` (feature) | CONFIRMED | `'Configured updates'` |
| 13 | 654 | `'Instant retrieval'` (feature) | CONFIRMED — "instant" | `'Rapid retrieval'` |
| 14 | 674 | `'Real-time insights'` (feature) | CONFIRMED | `'Live insights'` |
| 15 | 682 | `'Real-time events — via WebSocket'` | CONFIRMED | `'Streaming events — via WebSocket'` |
| 16 | 683 | `'Real-time streaming of all financial events'` | CONFIRMED | `'Streaming of all financial events'` |
| 17 | 683 | `'instant events'` | CONFIRMED — "instant" | `'immediate events'` or remove |
| 18 | 714 | `'24/7 support'` (feature) | CONFIRMED — "24/7" | `'Continuous support'` |
| 19 | 724 | `'A macro analyst that works 24/7'` | CONFIRMED — "24/7" | `'A macro analyst with continuous coverage'` |
| 20 | 764 | `'A risk officer that works 24/7'` | CONFIRMED — "24/7" | `'A risk officer with continuous coverage'` |
| 21 | 776 | `'24/7 monitoring'` (feature) | CONFIRMED | `'Continuous monitoring'` |
| 22 | 818 | `'Real-time updates'` (feature) | CONFIRMED | `'Configured updates'` |
| 23 | 939 | `'Real-time updates'` (feature) | CONFIRMED | `'Configured updates'` |

**Note:** Count is 23 lines but some lines have 2 claims (e.g., line 481 has "24/7" + "instant"). Total distinct timing claims: ~25 across 23 lines.

### Additional finding — products.js D.10

| # | Line | Text | Classification |
|---|---|---|---|
| 1 | 175 | `nameEn: 'Trading Intelligence Dashboard'` | CONFIRMED — old taxonomy in JS data (should be "Market & Trading Intelligence Dashboard" to match C3-B2 fix in catalog.html line 344) |

**Note:** This was NOT caught in C3 because C3-A scanned HTML files only, not JS data files. This is a C5-A finding.

### External JS files checked (CLEAN)

| File | Timing claims | D.4 | D.5 |
|---|---|---|---|
| `main.js` | 0 | 0 | 0 |
| `design-system/roua-v7.js` | 0 | 0 | 0 |

---

## Discovery Summary

| Category | CONFIRMED | REVIEW | ACCEPTABLE | Total |
|---|---|---|---|---|
| D.1 — Dead CSS | ~42 (developers.html) | 19 (architecture + catalog — may be JS-generated) | 0 | ~61 |
| D.3 — Malformed comments | 2 (market-intel + risk-intel) | 0 | 0 | 2 |
| D.12 — Missing source links | 21 (15 source-explorer + 6 sample-library) | 0 | 8 (evidence-explorer — has links) | 29 |
| D.14 — JS timing claims | ~25 (products.js — 23 lines, ~25 distinct claims) | 0 | 0 | ~25 |
| D.10 in JS (bonus finding) | 1 (products.js line 175) | 0 | 0 | 1 |
| **Total** | **~91** | **19** | **8** | **~118** |

### Key findings

1. **D.1 in developers.html is the largest single-page dead CSS issue** — ~42 dead classes from 7 dead sub-blocks (tree, bridge, arch-tree, arch-suite, arch-powered, buying, b-* modifiers). The inline `<style>` block was carried forward from an earlier page architecture without cleanup.

2. **D.3 is exactly 2 instances** — same pattern in market-intelligence.html and risk-intelligence.html (nested `<!--` in CTA comment). Confirmed in original Spec v6.

3. **D.12 is 21 missing source links** — source-explorer.html (15 entries) and sample-library.html (6 samples) show official domains as plain text, not clickable links. evidence-explorer.html has 8 working links and serves as the correct pattern.

4. **D.14 in products.js is the most significant finding** — 22+ timing claims in product descriptions rendered as HTML by catalog.html. These were never swept because the P0 sweep cleaned HTML content but not external JS data files. This is the same root cause as the original D.14 discovery in Spec v6.

5. **Bonus D.10 finding in products.js** — line 175 has "Trading Intelligence Dashboard" which was fixed in catalog.html (C3-B2) but the JS data file was not scanned during C3. This should be fixed in C5-B alongside D.14.

6. **D.1 REVIEW items (19 classes in architecture + catalog)** — these may be used by JavaScript that generates DOM content at runtime (Three.js, products.js rendering). Static grep cannot confirm they are dead without runtime inspection. **Recommendation: leave as REVIEW — do not delete without runtime verification.**

---

*End of C5-A Residual Defect Discovery Scan. No code modified. No execution. Discovery only. Awaiting team review before C5-B.*

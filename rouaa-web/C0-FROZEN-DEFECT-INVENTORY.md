# C0 — Frozen Defect Inventory (Reconciled)

> **Status:** Phase C0 — frozen defect inventory. **No code modified. No repairs executed.**
> **Source:** 30 Delta Reports (Delta 01–30) + Phase B dependency impact analysis grep scans
> **Spec:** v7 (commit `2337e71`)
> **Purpose:** Final, non-changing list of every defect to be repaired in C1–C6. Each instance is classified CONFIRMED / REVIEW / ACCEPTABLE with repair type. This inventory does not change during execution.

---

## Scope

### In scope (31 HTML pages + 2 CSS files + 1 JS comment)

| # | File | Audited? | CSS stack |
|---|---|---|---|
| 1–30 | 30 HTML pages (Delta 01–30) | ✅ Audited | v7 (29 pages) or old 4-file (2 pages) |
| — | `design-system/tokens.css` | Via GDS-1 (Delta 29/30) | Root file |
| — | `design-system/typography.css` | Phase B grep | Root file |
| — | `architecture.html` line 2732 JS comment | Phase B grep | — |

### Out of scope (not repaired in Phase C)

| File | Reason |
|---|---|
| `index.html` | FROZEN as Visual Reference Implementation — not audited in Delta 1–30, not repaired in Phase C |
| `design-system/roua-v7.css` | CLEAN — zero legacy palette, zero D.5 |
| `design-system/roua-v7-patch.css` | CLEAN — zero legacy palette, zero D.5 |
| `design-system/components.css` | CLEAN |
| `styles.css` | CLEAN |
| `main.js` | CLEAN |
| `design-system/roua-v7.js` | CLEAN |
| Third-party libraries | Out of scope per GDS-1 scope limit |

---

## Classification System

| Class | Meaning | Action in Phase C |
|---|---|---|
| **CONFIRMED** | Definitively a violation per Spec v7. No team decision needed. | Repair in C1–C5 |
| **REVIEW** | Requires team judgment (context-dependent). | Defer to team decision; do NOT auto-repair |
| **ACCEPTABLE** | Not a defect. False positive, exception, or context-acceptable. | No repair needed |
| **AUDIT MISS** | Found in Phase B grep but not reported in original Delta report. | Treat as CONFIRMED if context verifies |

### Repair types

| Type | Meaning | Examples |
|---|---|---|
| **MECHANICAL** | Safe global find-replace. No context judgment needed. | D.2 (rgba replace), D.1 (dead CSS delete) |
| **CONTEXT-CLASSIFIED** | Requires per-instance context check before replacement. | D.9 (capability vs illustrative vs design-ref), D.10 (page identity vs descriptive), D.8 (timing vs operational-state), "every claim" (ROUA claim vs quoted question) |
| **CONTENT-DECISION** | Requires marketing/legal/product decision. | D.5 competitor naming in visible content |

---

## D.2 — Legacy gold `rgba(201, 162, 39, ...)` / `#C9A227`

**All instances are CONFIRMED. No false positives possible — `rgba(201,162,39,...)` is always D.2.**

### Root-file D.2 (inherited — fix at source)

| Root file | Instances | Lines | Importers | Repair type |
|---|---|---|---|---|
| `tokens.css` | 8 | 30, 35, 37, 38, 41, 42, 59, 65 | visual-reference, design-reference (2 pages) | MECHANICAL — replace `#C9A227` → `#e3b45a`, `rgba(201,162,39,X)` → `rgba(227,180,90,X)` |

### Page-local D.2 (NOT inherited — each page's own inline `<style>` / inline styles)

| Page | Count | Delta source | Classification | Repair type |
|---|---|---|---|---|
| visual-reference.html | 27 | Delta 29 | CONFIRMED | MECHANICAL (~8 min) |
| architecture.html | 23 | Delta 06 | CONFIRMED | MECHANICAL (~8 min) |
| why-roua.html | 4 | Delta 13 | CONFIRMED | MECHANICAL (~2 min) |
| developers.html | 3 | Delta 22 | CONFIRMED | MECHANICAL (~2 min) |
| evidence-explorer.html | 3 | Delta 07 | CONFIRMED | MECHANICAL (~2 min) |
| infrastructure-report.html | 3 | Delta 20 | CONFIRMED | MECHANICAL (~2 min) |
| market-intelligence.html | 2 | Delta 02 | CONFIRMED | MECHANICAL (~1 min) |
| media-intelligence.html | 2 | Delta 04 | CONFIRMED | MECHANICAL (~1 min) |
| risk-intelligence.html | 2 | Delta 03 | CONFIRMED | MECHANICAL (~1 min) |
| source-explorer.html | 2 | Delta 08 | CONFIRMED | MECHANICAL (~1 min) |
| trading-platform.html | 2 | Delta 23 | CONFIRMED | MECHANICAL (~1 min) |
| business-case.html | 1 | Delta 14 | CONFIRMED | MECHANICAL (~1 min) |
| company.html | 1 | Delta 16 | CONFIRMED | MECHANICAL (~1 min) |
| financial-intelligence.html | 1 | Delta 24 | CONFIRMED | MECHANICAL (~1 min) |
| product-experience.html | 1 | Delta 21 | CONFIRMED | MECHANICAL (~1 min) |
| research-institute.html | 1 | Delta 28 | CONFIRMED | MECHANICAL (~1 min) |
| sample-library.html | 1 | Delta 09 | CONFIRMED | MECHANICAL (~1 min) |
| solutions.html | 1 | Delta 11 | CONFIRMED | MECHANICAL (~1 min) |
| **Total page-local** | **80** | | | **~36 min** |

**Note:** design-reference.html has 0 page-level D.2 — its D.2 is entirely inherited from tokens.css.

---

## D.4 — "Audit-Ready" (all semantic variants)

### CONFIRMED (repair needed)

| Page | Count | Delta source | Context | Repair type |
|---|---|---|---|---|
| architecture.html | 1 | **AUDIT MISS** (Phase B found; Delta 06 didn't report) | Line 1619: "Audit-ready, defensible institutional decisions" | CONTEXT-CLASSIFIED → replace with "Auditable" |
| business-case.html | 3 | Delta 14 | Visible content | CONTEXT-CLASSIFIED → replace with "Auditable" |
| company.html | 1 | Delta 16 | Visible content | CONTEXT-CLASSIFIED → replace with "Auditable" |
| design-reference.html | 1 | Delta 30 | Badge label in component demo | CONTEXT-CLASSIFIED → replace with "Auditable" |
| evidence-explorer.html | 3 | Delta 07 | Visible content | CONTEXT-CLASSIFIED → replace with "Auditable" |
| financial-intelligence.html | 1 | Delta 24 | Visible content | CONTEXT-CLASSIFIED → replace with "Auditable" |
| market-intelligence.html | 1 | Delta 02 | Visible content | CONTEXT-CLASSIFIED → replace with "Auditable" |
| methodology.html | 1 | Delta 19 | H4 title "Audit-Ready By Construction" | CONTEXT-CLASSIFIED → replace with "Auditable By Construction" |
| sample-library.html | 1 | Delta 09 | "Audit Ready" (no hyphen variant) | CONTEXT-CLASSIFIED → replace with "Auditable" |
| visual-reference.html | 2 | Delta 29 | Pipeline + comparison table | CONTEXT-CLASSIFIED → replace with "Auditable" |
| why-roua.html | 1 | Delta 13 | Visible content | CONTEXT-CLASSIFIED → replace with "Auditable" |
| **Total CONFIRMED** | **16** | | | **~8 min** |

### ACCEPTABLE (NOT defects — D.4 exception page)

| Page | Count | Reason |
|---|---|---|
| risk-intelligence.html | 11 | D.4 exception page — "audit-ready" is legitimate risk context per Spec v6 Layer 3.6 |

### OUT OF SCOPE

| Page | Count | Reason |
|---|---|---|
| index.html | 2 | FROZEN homepage — not audited, not repaired in Phase C |

---

## D.5 — Competitor naming

### CONFIRMED (in CSS comments — mechanical fix)

| Source | Competitors | Pages affected | Repair type |
|---|---|---|---|
| `tokens.css` line 5 (comment) | Bloomberg Terminal, Palantir, BlackRock Aladdin | visual-reference, design-reference (2) | MECHANICAL — replace comment with "Visual identity: institutional financial infrastructure" |
| `typography.css` lines 6–8 (comments) | Bloomberg Terminal, Palantir, BlackRock Aladdin | visual-reference, design-reference (2) | MECHANICAL — replace 3 comment lines |
| `architecture.html` line 2732 (JS comment) | Palantir ("Palantir-grade") | architecture (1) | MECHANICAL — replace "Palantir-grade" with "institutional-grade" |

### REVIEW (in HTML visible content — content decision required)

| Page | Competitors | Delta source | Context | Repair type |
|---|---|---|---|---|
| investment-intelligence.html | Bloomberg (1) | Delta 01 | Differentiation block | CONTENT-DECISION |
| market-intelligence.html | Bloomberg (1) | Delta 02 | Differentiation block | CONTENT-DECISION |
| risk-intelligence.html | Bloomberg (1) | Delta 03 | Differentiation block | CONTENT-DECISION |
| financial-intelligence.html | Bloomberg, FactSet, Reuters (1 line) | Delta 24 | Competitive positioning section | CONTENT-DECISION |

### OUT OF SCOPE

| Page | Count | Reason |
|---|---|---|
| index.html | 2 | FROZEN homepage |

---

## D.8 — Timing / latency claims

### CONFIRMED (FORBID — repair needed)

| Page | Count | Instance | Delta source | Repair type |
|---|---|---|---|---|
| architecture.html | 2 | "in real time" (lines 1517, 1872) | Delta 06 | CONTEXT-CLASSIFIED → "as they are published" |
| business-case.html | 1 | "in real time" (line 435) | Delta 14 | CONTEXT-CLASSIFIED → "as they are published" |
| developers.html | 2 | "Real-time" (lines 343, 443) | Delta 22 | CONTEXT-CLASSIFIED → "as detected and validated" / "streaming" |
| financial-intelligence.html | 1 | "in minutes, not hours" (line 410) | Delta 24 | CONTEXT-CLASSIFIED → "through configured workflows" |
| financial-media.html | 1 | "Real-time" (line 286) | Delta 25 | CONTEXT-CLASSIFIED → "Configured central bank monitoring" |
| trust-framework.html | 1 | "in real time" (line 333) | Delta 15 | CONTEXT-CLASSIFIED → "as they are published" |
| **Total CONFIRMED** | **8** | | | **~5 min** |

### REVIEW (context-dependent — "monitored continuously")

| Page | Count | Instance | Delta source | Context | Classification |
|---|---|---|---|---|---|
| financial-media.html | 1 | "monitored continuously" (line 158) | Delta 25 | Marketing workflow description | REVIEW leans FORBID |
| source-explorer.html | 1 | "monitored continuously" (line 525 area) | Delta 08 | Stat card / marketing | REVIEW leans FORBID |
| source-registry.html | 1 | "monitored continuously" (line 414) | Delta 18 | Process description (how-desc) | REVIEW leans acceptable |
| investment-intelligence.html | 1 | "monitored continuously" (line 438) | **AUDIT MISS** (Phase B found; Delta 01 didn't report) | Process description (how-desc) | REVIEW leans acceptable |
| risk-intelligence.html | 1 | "monitored continuously" (line 306) | **AUDIT MISS** (Phase B found; Delta 03 didn't report) | Process description | REVIEW leans acceptable |

### ACCEPTABLE (operational-state language — NOT D.8 per v7)

| Page | Language | Delta source | Reason |
|---|---|---|---|
| infrastructure-report.html | "live", "today", "running", "current", "already", "operational" | Delta 20 | Operational-status statements |
| contact.html | "30-minute call", "About two minutes" | Delta 26 | Meeting/form durations |
| careers.html | "45-minute call", "90-minute conversation", "60-minute conversation" | Delta 27 | Meeting durations |

---

## D.9 — Confidence terminology (concept-based per v7)

### CONFIRMED FORBID (repair needed)

| Page | Count | Instances | Delta source | Repair type |
|---|---|---|---|---|
| architecture.html | 1 | "confidence scored" (line 2312) | Delta 06 | CONTEXT-CLASSIFIED → "confidence signals recorded" |
| evidence-explorer.html | 2 | "confidence score" (lines 632, 1202) | Delta 07 | CONTEXT-CLASSIFIED → "confidence signals" |
| developers.html | 1 | "confidence scores" plural (line 435) | Delta 22 | CONTEXT-CLASSIFIED → "confidence signals" |
| visual-reference.html | 4 | "confidence scores" / "confidence scored" (lines 1588, 2790, 2935, 3051) | Delta 29 | CONTEXT-CLASSIFIED → "confidence signals" |
| **Total CONFIRMED FORBID** | **8** | | | **~5 min** |

### REVIEW leans FORBID (capability descriptions — team decision)

| Page | Count | Instances | Delta source | Repair type |
|---|---|---|---|---|
| methodology.html | 2 | "Extraction Confidence" H4 + "scored independently" (lines 210, 172) | Delta 19 | CONTEXT-CLASSIFIED (team decides) |
| infrastructure-report.html | 2 | "confidence scoring" + "extraction confidence" (lines 271, 288) | Delta 20 | CONTEXT-CLASSIFIED (team decides) |
| developers.html | 2 | "extraction confidence" capability (lines 338, 411) | Delta 22 | CONTEXT-CLASSIFIED (team decides) |
| contact.html | 1 | "confidence scoring" (line 127) | Delta 26 | CONTEXT-CLASSIFIED (team decides) |
| research-institute.html | 6 | "scores confidence" + "score source confidence" + "fact extraction confidence" + "confidence scoring" × 3 (lines 118, 134, 209, 214, 244, 302) | Delta 28 | CONTEXT-CLASSIFIED (team decides) |
| design-reference.html | 1 | "confidence scoring" (line 550) | Delta 30 | CONTEXT-CLASSIFIED (team decides) |
| business-case.html | 3 | (Delta 14) | Delta 14 | CONTEXT-CLASSIFIED (team decides) |
| catalog.html | 2 | (Delta 10) | Delta 10 | CONTEXT-CLASSIFIED (team decides) |
| company.html | 2 | (Delta 16) | Delta 16 | CONTEXT-CLASSIFIED (team decides) |
| solutions.html | 1 | (Delta 11) | Delta 11 | CONTEXT-CLASSIFIED (team decides) |
| trust-framework.html | 1 | (Delta 15) | Delta 15 | CONTEXT-CLASSIFIED (team decides) |
| why-roua.html | 2 | (Delta 13) | Delta 13 | CONTEXT-CLASSIFIED (team decides) |
| **Total REVIEW** | **25** | | | **~15 min (after team decision)** |

### ACCEPTABLE (NOT defects)

| Page | Count | Reason | Delta source |
|---|---|---|---|
| sample-library.html | 11 | All marked "(illustrative)" — illustrative metadata | Delta 09 |
| product-experience.html | 1 | Marked "illustrative metric" | Delta 21 |
| methodology.html | 5 | Illustrative/descriptive uses | Delta 19 |
| visual-reference.html | 3 | Design-reference documentation (typographic label, scenario, localization) | Delta 29 |
| design-reference.html | 2 | Design-reference component samples ("97%") | Delta 30 |

---

## D.10 — Old taxonomy as page identity / product name

### CONFIRMED (repair needed)

| Page | Count | Instances | Delta source | Repair type |
|---|---|---|---|---|
| trading-platform.html | 6 | "Trading Intelligence" as page identity (title, meta, hero eyebrow, hero paragraph, section H2, section paragraph) | Delta 23 | CONTEXT-CLASSIFIED → "Market & Trading Intelligence" or "Trading Desks" |
| financial-intelligence.html | 6 | "Institutional Intelligence" page identity × 5 + "Trading Intelligence" CTA × 1 | Delta 24 | CONTEXT-CLASSIFIED → "Investment Firms" / "Investment Intelligence" |
| product-experience.html | 2 | "View Institutional Intelligence" + "View Trading Intelligence Page" CTA labels | Delta 21 | CONTEXT-CLASSIFIED → canonical names |
| financial-media.html | 1 | "Institutional Intelligence Platform" isolated reference | Delta 25 | CONTEXT-CLASSIFIED → "ROUA Platform" |
| contact.html | 1 | "trading intelligence" lowercase in meta description | Delta 26 | CONTEXT-CLASSIFIED → "Market & Trading Intelligence" |
| evidence-explorer.html | 1 | "Trading Intelligence · Institutional Intelligence · Media Intelligence · Developer APIs" in output field | Delta 07 | CONTEXT-CLASSIFIED → canonical names |
| catalog.html | 1 | (Delta 10) | Delta 10 | CONTEXT-CLASSIFIED → canonical names |
| **Total CONFIRMED** | **18** | | | **~10 min** |

### REVIEW (leaning acceptable — NOT auto-repaired)

| Pattern | Pages | Count | Reason |
|---|---|---|---|
| "Institutional Intelligence Products" in footer copyright | ALL pages with standard footer | 1 per page | Descriptive phrase, leans acceptable per Deltas 24/25/26/27/28/30 |
| Shorthand product lists ("Investment, Market, Risk, Media, Trading, or Developer") | contact, research-institute, design-reference | 1 per page | Descriptive shorthand, leans acceptable |

### ACCEPTABLE (NOT D.10 — false positives in raw grep)

| Pattern | Reason |
|---|---|
| "Market & Trading Intelligence" in nav/footer | Canonical product name |
| "institutional intelligence products" lowercase | Descriptive adjective use |
| "institutional intelligence" lowercase in body text | Descriptive |
| "Institutional Dark" / "Institutional Gold" in color swatches | Design-reference color names |

---

## "every claim" FORBID

### CONFIRMED FORBID (ROUA capability claims — repair needed)

| Page | Count | Instance | Delta source | Repair type |
|---|---|---|---|---|
| business-case.html | 1 | "every claim traceable to an official source" | Delta 14 | CONTEXT-CLASSIFIED → "each claim" |
| evidence-explorer.html | 2 | "every claim carries its source" + "every claim can be traced" | Delta 07 | CONTEXT-CLASSIFIED → "each claim" |
| financial-intelligence.html | 2 | meta "Every claim traceable" + "Every claim arrives at committee" | Delta 24 | CONTEXT-CLASSIFIED → "Each claim" |
| financial-media.html | 2 | "Every claim in every published article links back" + "Every claim in every article links to" | Delta 25 | CONTEXT-CLASSIFIED → "Each claim" |
| solutions.html | 1 | "every claim traceable to an official source" | Delta 11 | CONTEXT-CLASSIFIED → "each claim" |
| trust-framework.html | 1 | "verify every claim in real time" (also D.8!) | Delta 15 | CONTEXT-CLASSIFIED → "each claim" + D.8 fix |
| visual-reference.html | 1 | "evidence patterns that prove every claim" | Delta 29 | CONTEXT-CLASSIFIED → "each claim" |
| why-roua.html | 1 | "every claim traces to a source document" | Delta 13 | CONTEXT-CLASSIFIED → "each claim" |
| **Total CONFIRMED** | **11** | | | **~6 min** |

### REVIEW

| Page | Count | Instance | Reason |
|---|---|---|---|
| financial-media.html | 1 | "Every claim must be verifiable" | Institutional requirement (not ROUA claim) — REVIEW |
| solutions.html | 1 | "Every claim must be verifiable" | Same pattern — REVIEW |

### ACCEPTABLE

| Page | Count | Instance | Reason |
|---|---|---|---|
| architecture.html | 1 | "Can we locate the exact passage behind every claim?" | Quoted institutional question — ACCEPTABLE per v7 |

---

## "verified Intelligence Object" FORBID variant

### CONFIRMED FORBID

| Page | Count | Delta source | Repair type |
|---|---|---|---|
| product-experience.html | 4 | Delta 21 | CONTEXT-CLASSIFIED → "Governed Intelligence Object" (4 EVIDENCE footers) |

---

## D.13 — "24/7" timing claim

### CONFIRMED

| Page | Count | Delta source | Context | Repair type |
|---|---|---|---|---|
| financial-intelligence.html | 1 | Delta 24 | "Monitored 24/7" in Product Architecture | CONTEXT-CLASSIFIED → "Monitored through configured schedules" |

### REVIEW

| Page | Count | Delta source | Context | Classification |
|---|---|---|---|---|
| source-explorer.html | 1 | Delta 08 | "24/7" stat card | REVIEW — team decides if operational commitment or unproven claim |

---

## D.1 — Dead `<style>` blocks / dead sub-blocks

### CONFIRMED

| Page | Type | Delta source | Repair type |
|---|---|---|---|
| investment-intelligence.html | Dead `<style>` block (lines 13–30) | Delta 01 | MECHANICAL — delete block |
| market-intelligence.html | Dead `<style>` block (lines 13–30) | Delta 02 | MECHANICAL — delete block |
| risk-intelligence.html | Dead `<style>` block (lines 13–30) | Delta 03 | MECHANICAL — delete block |
| media-intelligence.html | Dead `<style>` block (lines 13–30) | Delta 04 | MECHANICAL — delete block |
| developers.html | Dead sub-blocks inside live `<style>` (`.tree-*` + `.arch-branch.b-*`) | Delta 22 | MECHANICAL — delete dead classes |

### REVIEW (need verification — `<style>` exists but may be live)

| Page | Has `<style>`? | Delta source | Notes |
|---|---|---|---|
| architecture.html | 1 block | Delta 06 | Live — not D.1 |
| catalog.html | 1 block | Delta 10 | Need verification |
| evidence-explorer.html | 1 block | Delta 07 | Need verification |
| index.html | 2 blocks | FROZEN | OUT OF SCOPE |
| market-intelligence.html | 2 blocks | Delta 02 | 1 dead (lines 13–30), 1 live |
| platform.html | 1 block | Delta 17 | Live — not D.1 (PASS page) |
| product-experience.html | 1 block | Delta 21 | Live — not D.1 |
| sample-library.html | 1 block | Delta 09 | Need verification |
| visual-reference.html | 1 block | Delta 29 | Live — not D.1 |
| design-reference.html | 1 block | Delta 30 | Live — not D.1 |

---

## D.7 / D.11 — Deprecated / non-canonical raw hex

### CONFIRMED D.7 (deprecated hex from VISUAL-IDENTITY-SYSTEM.md)

| Page | Count | Delta source | Context | Repair type |
|---|---|---|---|---|
| architecture.html | ~42 raw hex (many deprecated) | Delta 06 | SVG `fill`/`stroke` + Three.js PALETTE | MECHANICAL — replace with canonical |
| index.html | ~14 | FROZEN | OUT OF SCOPE |

### CONFIRMED D.11 (non-canonical hex — never existed in any palette)

| Page | Count | Delta source | Context | Repair type |
|---|---|---|---|---|
| product-experience.html | 15 | Delta 21 | macOS dots `#E5484D` / `#F5A623` / `#20A878` (5 groups × 3) | MECHANICAL — use `.mockup-dot` classes already defined |
| source-explorer.html | 9 | Delta 08 | Status badges, stat cards, lifecycle stages | MECHANICAL — replace with canonical tokens |
| developers.html | ~9 (excluding Dracula) | Delta 22 | `.arch-branch.b-*` colors + `.dev-method` colors + `.dev-code` bg | MECHANICAL — replace with tokens |

### REVIEW (Dracula syntax-highlighting colors — team decision)

| Page | Count | Delta source | Context | Classification |
|---|---|---|---|---|
| developers.html | 4 | Delta 22 | `.dev-code .k/.s/.c/.n` Dracula theme colors (`#ff79c6`, `#f1fa8c`, `#6272a4`, `#8be9fd`) | REVIEW — code syntax highlighting convention exception? |

### ACCEPTABLE (NOT D.11 — false positives)

| Page | Count | Reason |
|---|---|---|
| developer-intelligence.html | 1 | `#05070D` in `<meta name="theme-color">` — exempt per Spec |
| platform.html | 1 | `#05070D` in `<meta name="theme-color">` — exempt per Spec |
| risk-intelligence.html | 4 | Need context check — may be in `<meta>` or SVG |

---

## D.6 — `var(--gold)` direct usage

### CONFIRMED

| Page | Count | Delta source | Repair type |
|---|---|---|---|
| methodology.html | 18 | Delta 19 | MECHANICAL — `var(--gold)` → `var(--roua-accent)` |
| financial-media.html | 1 | Delta 25 | MECHANICAL — `var(--gold)` → `var(--roua-accent)` |
| **Total** | **19** | | **~5 min** |

---

## D.3 — Malformed HTML comment

### CONFIRMED

| Page | Delta source | Repair type |
|---|---|---|
| market-intelligence.html | Delta 02 | MECHANICAL — fix nested `<!--` |
| risk-intelligence.html | Delta 03 | MECHANICAL — fix nested `<!--` |

---

## D.12 — No direct source links on Explorer pages

### CONFIRMED

| Page | Delta source | Repair type |
|---|---|---|
| source-explorer.html | Delta 08 | Add `<a href>` to 15 source entries |
| sample-library.html | Delta 09 | Add `<a href>` to 6 samples × 2 fields |

---

## D.14 — Timing claims in external JS data files

### CONFIRMED

| File | Delta source | Repair type |
|---|---|---|
| `products.js` (loaded by catalog.html) | Delta 10 | CONTEXT-CLASSIFIED — replace 10 timing claims |

---

## Summary: Frozen Defect Counts

| Defect | CONFIRMED | REVIEW | ACCEPTABLE | OUT OF SCOPE | Repair type |
|---|---|---|---|---|---|
| D.1 | 5 pages | 3 pages (need verification) | — | 1 (index) | MECHANICAL |
| D.2 | 8 (root) + 80 (page-local) = 88 | — | — | — | MECHANICAL |
| D.3 | 2 pages | — | — | — | MECHANICAL |
| D.4 | 16 instances (11 pages) | — | 11 (risk exception) | 2 (index) | CONTEXT-CLASSIFIED |
| D.5 | 3 CSS/JS comments | 4 HTML pages | — | 2 (index) | MECHANICAL (comments) + CONTENT-DECISION (HTML) |
| D.6 | 19 instances (2 pages) | — | — | — | MECHANICAL |
| D.7 | ~42 (architecture) | — | — | ~14 (index) | MECHANICAL |
| D.8 | 8 instances (6 pages) | 5 instances (5 pages) | Multiple (op-state language) | — | CONTEXT-CLASSIFIED |
| D.9 | 8 FORBID (4 pages) | 25 REVIEW (12 pages) | 22 (illustrative/design-ref) | 2 (index) | CONTEXT-CLASSIFIED |
| D.10 | 18 instances (7 pages) | ~31 (footer copyright + shorthand lists) | ~150+ (canonical names in nav/footer) | 19 (index) | CONTEXT-CLASSIFIED |
| D.11 | 33 instances (3 pages) | 4 (Dracula colors) | 2 (meta theme-color) | 14 (index) | MECHANICAL + REVIEW |
| D.12 | 2 pages | — | — | — | Add links |
| D.13 | 1 (financial-intelligence) | 1 (source-explorer) | — | — | CONTEXT-CLASSIFIED |
| D.14 | 1 file (products.js) | — | — | — | CONTEXT-CLASSIFIED |
| "every claim" | 11 instances (8 pages) | 2 instances (2 pages) | 1 (architecture) | — | CONTEXT-CLASSIFIED |
| "verified Intel Obj" | 4 instances (1 page) | — | — | — | CONTEXT-CLASSIFIED |

### Audit Misses Found in Phase B (defects existing but not reported in original Delta)

| Page | Defect | Instance | Reason missed |
|---|---|---|---|
| architecture.html | D.4 | Line 1619 "Audit-ready" | Delta 06 did not scan for D.4 (D.4 was added to Spec later in v5) |
| investment-intelligence.html | D.8 variant | Line 438 "monitored continuously" | Delta 01 may have classified as acceptable (process description) — now REVIEW under v7 |
| risk-intelligence.html | D.8 variant | Line 306 "monitored continuously" | Delta 03 same — now REVIEW under v7 |

---

## Execution Priority (for C1–C6 planning)

| Priority | Category | Defects | Effort | Notes |
|---|---|---|---|---|
| C1 | Root-file repairs | D.2 (tokens.css × 8) + D.5 (tokens.css + typography.css comments) + D.5 (architecture JS comment) | ~5 min | MECHANICAL — fixes 2 pages' inherited D.2 + all CSS-comment D.5 |
| C2 | Canonical token normalization | D.2 page-local (80 instances, 18 pages) + D.6 (19 instances, 2 pages) + D.7 (architecture) + D.11 (3 pages) | ~50 min | MECHANICAL — largest single batch |
| C3 | Taxonomy normalization | D.10 (18 instances, 7 pages) | ~10 min | CONTEXT-CLASSIFIED — per-instance check |
| C4 | Trust-language normalization | D.4 (16) + D.8 CONFIRMED (8) + D.9 FORBID (8) + "every claim" (11) + "verified Intel Obj" (4) + D.13 (1) + D.14 (1) | ~25 min | CONTEXT-CLASSIFIED — per-instance check, NOT blind find-replace |
| C5 | Residual page-specific | D.1 (5 pages) + D.3 (2 pages) + D.12 (2 pages) | ~20 min | MECHANICAL + structural |
| C6 | Full-site re-verification | Re-run all grep checks on every page | ~30 min | Verify zero regressions |
| **Total** | | | **~140 min** | |

### REVIEW items (deferred — not in C1–C6 execution)

| Category | Count | Decision needed |
|---|---|---|
| D.9 REVIEW leans FORBID | 25 instances | Team decides: replace "confidence scoring" / "Extraction Confidence" with "confidence signals"? |
| D.8 REVIEW ("monitored continuously") | 5 instances | Team decides: process description (acceptable) or marketing claim (FORBID)? |
| D.5 REVIEW (competitor naming in HTML) | 4 pages | Team decides: soften to generic phrasing? |
| D.10 REVIEW (footer copyright + shorthand) | ~31 instances | Team decides: align footer copyright across all pages? |
| D.11 REVIEW (Dracula colors) | 4 instances | Team decides: code syntax highlighting exception? |
| D.13 REVIEW (source-explorer "24/7") | 1 instance | Team decides: operational commitment or unproven claim? |
| "every claim" REVIEW | 2 instances | Team decides: institutional requirement (acceptable) or ROUA claim (FORBID)? |

---

*End of C0 — Frozen Defect Inventory. No code modified. No repairs executed. This inventory is the final, non-changing foundation for C1–C6 execution.*

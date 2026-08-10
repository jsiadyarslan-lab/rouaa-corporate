# C3-A — Taxonomy Discovery Scan (Exhaustive)

> **Status:** Discovery only. **No code modified. No commit. No execution.**
> **Baseline:** `7bdfb96` on `main`
> **Method:** Exhaustive grep scan across all HTML files (excluding `index.html` — FROZEN)
> **Purpose:** Complete inventory of every old/conflicting taxonomy instance, classified per-instance.

---

## Scan Parameters

**Target terms (per Spec v7 Layer 1.10):**
- "Trading Intelligence" (standalone — NOT "Market & Trading Intelligence")
- "Institutional Intelligence" (standalone — NOT lowercase descriptive "institutional intelligence products")
- "Developer Intelligence" (standalone)
- "Developer APIs" (standalone)
- "Market Intelligence" (alone — NOT "Market & Trading Intelligence")

**Excluded from results (canonical — NOT defects):**
- "Market & Trading Intelligence" (canonical product name)
- "Investment Intelligence" (canonical product name)
- "Risk Intelligence" (canonical product name)
- "Media Intelligence" (canonical product name)
- "Developer Platform" (canonical product name)
- "Trading Desks" (canonical solution label)
- "Investment Firms" (canonical solution label)

**Scope:** All `.html` files in `rouaa-web/` except `index.html` (FROZEN).

---

## Summary Counts

| Term | Total raw instances | ACCEPTABLE | REVIEW | CONFIRMED |
|---|---|---|---|---|
| Trading Intelligence (standalone) | 20 | 2 (comments) | 4 (body content) | **14** (page identity + body content) |
| Institutional Intelligence | 86 | 64 (lowercase descriptive) | 9 (body/footer) | **13** (page identity + hero + isolated) |
| Developer Intelligence | 0 | — | — | — |
| Developer APIs | 2 | — | — | **2** (body content) |
| Market Intelligence (alone) | 46 | 34 (body descriptive + comments) | 9 (section/hero + decision card) | **3** (page identity) |
| **Total** | **154** | **100** | **22** | **32** |

---

## Classification Criteria

| Classification | Definition |
|---|---|
| **CONFIRMED** | Old taxonomy used as product name, page identity, or standalone taxonomy label. Must be repaired. |
| **REVIEW** | Context-dependent. Could be descriptive shorthand, body content, or footer copyright. Needs team judgment. |
| **ACCEPTABLE** | Lowercase descriptive adjective use, HTML comment (not visible), or shorthand product list. NOT a defect per Spec v7. |

### Context categories

| Context | Description | Default classification |
|---|---|---|
| PAGE IDENTITY (title/meta) | `<title>` or `<meta name="description">` | CONFIRMED — old taxonomy as page identity |
| HERO IDENTITY (eyebrow/H1) | Hero section eyebrow, H1, hero paragraph | CONFIRMED — old taxonomy as page identity |
| SECTION IDENTITY (H2/eyebrow) | Section H2, section eyebrow | CONFIRMED if standalone product name; REVIEW if shorthand |
| NAV LABEL | `nav-dropdown-link` text | ACCEPTABLE if canonical name; CONFIRMED if old term |
| FOOTER LABEL | `footer-col` link text | ACCEPTABLE if canonical name; REVIEW if "Institutional Intelligence Products" (copyright) |
| BODY CONTENT | Paragraph text, card descriptions | REVIEW — context-dependent (descriptive vs product-name use) |
| DECISION CARD TITLE | `.da-title` element | REVIEW — could be canonical short-form or old taxonomy |
| HTML COMMENT | `<!-- ... -->` | ACCEPTABLE — not visible to user |
| LOWERCASE DESCRIPTIVE | "institutional intelligence products/outputs/content" (lowercase) | ACCEPTABLE per Spec v7 Layer 1.10 |

---

## CONFIRMED Defects (32 instances — for C3-B execution)

### Trading Intelligence — CONFIRMED (14 instances)

| # | File | Line | Current text | Context | Canonical replacement | Reason |
|---|---|---|---|---|---|---|
| 1 | trading-platform.html | 7 | `<title>ROUA Trading Intelligence — Decision Intelligence Layer for Trading Desks</title>` | PAGE IDENTITY (title) | "ROUA for Trading Desks" or "ROUA Market & Trading Intelligence" | Old taxonomy as page title |
| 2 | trading-platform.html | 8 | `<meta name="description" content="ROUA Trading Intelligence — the decision intelligence layer...">` | PAGE IDENTITY (meta) | "ROUA for Trading Desks" or "ROUA Market & Trading Intelligence" | Old taxonomy in meta description |
| 3 | trading-platform.html | 110 | `<span class="eyebrow">Trading Intelligence Platform</span>` | HERO IDENTITY (eyebrow) | "Trading Desks Solution" or "Market & Trading Intelligence" | Old taxonomy as hero eyebrow |
| 4 | trading-platform.html | 116 | `ROUA Trading Intelligence combines evidence-backed...` | HERO IDENTITY (paragraph) | "ROUA for Trading Desks combines..." or "ROUA Market & Trading Intelligence combines..." | Old taxonomy as hero paragraph subject |
| 5 | trading-platform.html | 183 | `evaluated through ROUA's trading intelligence stack` | SECTION IDENTITY | "ROUA's Market & Trading Intelligence stack" or "ROUA's trading intelligence capabilities" (lowercase descriptive) | REVIEW — leans CONFIRMED if "stack" implies product name |
| 6 | trading-platform.html | 285 | `<span class="eyebrow">The Trading Intelligence Stack</span>` | SECTION IDENTITY (eyebrow) | "The Market & Trading Intelligence Stack" or "The Trading Intelligence Capabilities" | Old taxonomy as section eyebrow |
| 7 | trading-platform.html | 331 | `<h2>Trading Intelligence is not standalone.</h2>` | SECTION IDENTITY (H2) | "Market & Trading Intelligence is not standalone." | Old taxonomy as section H2 subject |
| 8 | trading-platform.html | 332 | `Trading Intelligence is a specialized workflow...` | BODY CONTENT (section paragraph) | "Market & Trading Intelligence is a specialized workflow..." or "The Trading Desks solution is a specialized workflow..." | Old taxonomy as standalone subject |
| 9 | financial-intelligence.html | 151 | `<h4>Trading Intelligence →</h4>` | BODY CONTENT (CTA card label) | "Market & Trading Intelligence →" or "Trading Desks →" | Old taxonomy as CTA card label (target: trading-platform.html = "Trading Desks") |
| 10 | product-experience.html | 744 | `View Trading Intelligence Page →` | BODY CONTENT (CTA button) | "View Trading Desks Page →" or "View Market & Trading Intelligence Page →" | Old taxonomy as CTA button label |
| 11 | contact.html | 8 | `trading intelligence` (lowercase, in meta) | PAGE IDENTITY (meta) | "Market & Trading Intelligence" | Old taxonomy in meta description (lowercase case variant — D.10 per v7) |
| 12 | evidence-explorer.html | 1214 | `Trading Intelligence · Institutional Intelligence · Media Intelligence · Developer APIs` | BODY CONTENT (output field) | "Market & Trading Intelligence · Investment Intelligence · Media Intelligence · Developer Platform" | All 4 terms old taxonomy in product delivery list |
| 13 | catalog.html | 344 | `Trading Intelligence Dashboard` | BODY CONTENT (product listing) | "Market & Trading Intelligence Dashboard" | Old taxonomy in product listing |
| 14 | catalog.html | 514 | `Trading Intelligence` (filter label) | BODY CONTENT (filter checkbox) | "Market & Trading Intelligence" | Old taxonomy as filter label |

### Institutional Intelligence — CONFIRMED (13 instances)

| # | File | Line | Current text | Context | Canonical replacement | Reason |
|---|---|---|---|---|---|---|
| 1 | financial-intelligence.html | 7 | `<title>ROUA Institutional Intelligence — Evidence-Backed Intelligence for Institutions</title>` | PAGE IDENTITY (title) | "ROUA for Investment Firms" or "ROUA Investment Intelligence" | Old taxonomy as page title |
| 2 | financial-intelligence.html | 8 | `<meta name="description" content="ROUA Institutional Intelligence — evidence-backed...">` | PAGE IDENTITY (meta) | "ROUA for Investment Firms" or "ROUA Investment Intelligence" | Old taxonomy in meta description |
| 3 | financial-intelligence.html | 110 | `<span class="eyebrow">Institutional Intelligence Solution</span>` | HERO IDENTITY (eyebrow) | "Investment Firms Solution" or "Investment Intelligence Solution" | Old taxonomy as hero eyebrow |
| 4 | financial-intelligence.html | 112 | `Institutional Intelligence Built on` | HERO IDENTITY (H1) | "Investment Firm Intelligence Built on" or "Evidence-Backed Intelligence Built on" | Old taxonomy in hero H1 |
| 5 | financial-intelligence.html | 191 | `<span class="eyebrow">Institutional Intelligence Applications</span>` | SECTION IDENTITY (eyebrow) | "Institutional Applications" or "Investment Firm Applications" | Old taxonomy as section eyebrow |
| 6 | financial-media.html | 318 | `ROUA through the Institutional Intelligence Platform` | BODY CONTENT (isolated reference) | "ROUA Platform" or "ROUA Media Intelligence Platform" | Old taxonomy as platform name |
| 7 | company.html | 7 | `<title>ROUA — Institutional Intelligence Company</title>` | PAGE IDENTITY (title) | "ROUA — Institutional Intelligence Company" → REVIEW (company page, not product) | Old taxonomy in company page title |
| 8 | company.html | 97 | `An institutional intelligence company` | HERO IDENTITY (H1) | "An institutional intelligence company" → REVIEW (descriptive?) | Old taxonomy in hero H1 |
| 9 | catalog.html | 601 | `<h2>Build Your Institutional Intelligence Architecture.</h2>` | SECTION IDENTITY (H2) | "Build Your Intelligence Architecture." or "Build Your Institutional Intelligence Architecture." → REVIEW | Old taxonomy in section H2 |
| 10 | platform.html | 8 | `<title>ROUA · Platform — How Official Evidence Becomes Institutional Intelligence</title>` | PAGE IDENTITY (title) | REVIEW — "Institutional Intelligence" in title may be descriptive (process), not product name |
| 11 | visual-reference.html | 7 | `<title>ROUA Institutional Intelligence Design System · v1.0</title>` | PAGE IDENTITY (title) | REVIEW — design-system artifact name, not product taxonomy (per Delta 29) |
| 12 | visual-reference.html | 1298 | `<span class="eyebrow">ROUA Institutional Intelligence Design System · v1.0 FINAL</span>` | HERO IDENTITY (eyebrow) | REVIEW — same as above (design-system artifact name) |
| 13 | product-experience.html | 668 | `View Institutional Intelligence →` | BODY CONTENT (CTA button) | "View Investment Firms →" or "View Investment Intelligence →" | Old taxonomy as CTA button label (target: financial-intelligence.html = "Investment Firms") |

**Note:** Items 7–12 are marked CONFIRMED in the count but have REVIEW notes. The team should decide: are "Institutional Intelligence" in company/platform/visual-reference titles descriptive (the company IS an institutional intelligence company) or product taxonomy (using a non-canonical product name)?

### Developer APIs — CONFIRMED (2 instances)

| # | File | Line | Current text | Context | Canonical replacement | Reason |
|---|---|---|---|---|---|---|
| 1 | evidence-explorer.html | 1214 | `Developer APIs` (in delivery list) | BODY CONTENT (output field) | "Developer Platform" | Old taxonomy in product delivery list (same line as TI/II) |
| 2 | architecture.html | 2187 | `developer APIs providing the integration layer` | BODY CONTENT (paragraph) | "Developer Platform providing the integration layer" or "developer APIs" → REVIEW (descriptive?) | Old taxonomy in body paragraph — REVIEW if lowercase descriptive |

### Market Intelligence (alone) — CONFIRMED (3 instances)

| # | File | Line | Current text | Context | Canonical replacement | Reason |
|---|---|---|---|---|---|---|
| 1 | market-intelligence.html | 6 | `<title>ROUA Market Intelligence — Event-Driven Market Understanding with Evidence</title>` | PAGE IDENTITY (title) | "ROUA Market & Trading Intelligence — Event-Driven Market Understanding with Evidence" | Product page title uses short-form "Market Intelligence" instead of canonical "Market & Trading Intelligence" |
| 2 | market-intelligence.html | 7 | `<meta name="description" content="ROUA Market Intelligence — structured economic events...">` | PAGE IDENTITY (meta) | "ROUA Market & Trading Intelligence — structured economic events..." | Same — meta description |
| 3 | market-intelligence.html | 154 | `<span class="eyebrow">Market Intelligence</span>` | HERO IDENTITY (eyebrow) | "Market & Trading Intelligence" | Hero eyebrow uses short-form |

**Critical note on Market Intelligence:** The product page `market-intelligence.html` uses "Market Intelligence" (short-form) as its page identity throughout — title, meta, hero eyebrow, multiple section headers. The canonical product name is "Market & Trading Intelligence." However, "Market Intelligence" appears **32 times in body content** as descriptive shorthand (e.g., "market intelligence teams", "market intelligence output", "market intelligence operation"). These body-content uses lean ACCEPTABLE as descriptive adjective use. Only the **page identity instances** (title, meta, hero eyebrow) are CONFIRMED.

---

## REVIEW Items (22 instances — deferred to team decision)

### Trading Intelligence — REVIEW (4 instances)

| File | Line | Text | Context | Question for team |
|---|---|---|---|---|
| trading-platform.html | 112 | `Institutional trading intelligence` (lowercase, in H1) | HERO IDENTITY | Is "trading intelligence" (lowercase) descriptive adjective or product name? Leans acceptable. |
| trading-platform.html | 183 | `ROUA's trading intelligence stack` | SECTION IDENTITY | Is "trading intelligence stack" (lowercase) descriptive shorthand or product name? Leans acceptable. |
| solutions.html | 197 | `ROUA Product: Trading Intelligence` | BODY CONTENT | Is this a product label (CONFIRMED) or descriptive text (REVIEW)? |
| solutions.html | 388 | `Trading intelligence & execution` | BODY CONTENT (table cell) | Is "trading intelligence" (lowercase) descriptive? Leans acceptable. |

### Institutional Intelligence — REVIEW (9 instances)

| File | Line | Text | Context | Question for team |
|---|---|---|---|---|
| financial-intelligence.html | 177 | `Institutional intelligence requires more than information.` | BODY CONTENT | Is "institutional intelligence" (lowercase) descriptive? Leans acceptable. |
| catalog.html | 174 | (needs context check) | BODY CONTENT | Review specific line |
| catalog.html | 189 | (needs context check) | BODY CONTENT | Review specific line |
| evidence-explorer.html | 1214 | `Institutional Intelligence` (in delivery list) | BODY CONTENT | Same line as TI/DA — CONFIRMED if product name, REVIEW if descriptive |
| company.html | 7 | `ROUA — Institutional Intelligence Company` | PAGE IDENTITY | Is "Institutional Intelligence Company" a product claim or a company description? |
| company.html | 97 | `An institutional intelligence company` | HERO IDENTITY | Same question — descriptive or product? |
| platform.html | 8 | `How Official Evidence Becomes Institutional Intelligence` | PAGE IDENTITY | Is "Institutional Intelligence" here a process description (acceptable) or product name (CONFIRMED)? |
| visual-reference.html | 7, 1298 | `ROUA Institutional Intelligence Design System` | PAGE IDENTITY | Design-system artifact name — per Delta 29, leans acceptable |
| product-experience.html | 668 | `View Institutional Intelligence →` | CTA BUTTON | Target is financial-intelligence.html (= "Investment Firms"). CONFIRMED. |

### Market Intelligence — REVIEW (9 instances)

| File | Line | Text | Context | Question for team |
|---|---|---|---|---|
| market-intelligence.html | 400 | `market intelligence output` (lowercase, H2) | SECTION IDENTITY | Descriptive shorthand? Leans acceptable. |
| market-intelligence.html | 516 | `Market Intelligence Teams` (H4) | SECTION IDENTITY | Is "Market Intelligence Teams" a product name or a team description? Leans acceptable. |
| market-intelligence.html | 607 | `market intelligence operation` (lowercase, H2) | SECTION IDENTITY | Descriptive shorthand? Leans acceptable. |
| market-intelligence.html | 655-656 | `Market Intelligence` (eyebrow + H2) | SECTION IDENTITY | Is this product name (CONFIRMED) or section topic (acceptable)? |
| solutions.html | 8 | `market intelligence` (lowercase, in meta) | PAGE IDENTITY | Descriptive adjective in meta? Leans acceptable. |
| solutions.html | 196 | `Turn Market Intelligence Into Trading Decisions` (H2) | SECTION IDENTITY | Is "Market Intelligence" here a product name or a capability description? |
| financial-intelligence.html | 216 | `<div class="da-title">Market Intelligence</div>` | DECISION CARD TITLE | Decision Advantage card title — short-form product name or capability label? |
| evidence-explorer.html | 357 | `from Market Intelligence` (eyebrow) | SECTION IDENTITY | Is "Market Intelligence" here a product name or source description? |
| catalog.html | 511, 778 | `Market Intelligence` (filter + JS data) | BODY CONTENT | Short-form product name in catalog data — CONFIRMED or shorthand? |

---

## ACCEPTABLE Items (100 instances — NOT defects)

### Lowercase descriptive "institutional intelligence" (64 instances)

These appear as "institutional intelligence products", "institutional intelligence outputs", "institutional intelligence content", "institutional intelligence company" (lowercase) in:
- Footer brand description: "ROUA delivers institutional intelligence products powered by a governed financial intelligence foundation" (appears on ALL pages with standard footer — ~28 instances)
- Footer copyright: "Institutional Intelligence Products Powered by Evidence Infrastructure" (appears on ALL pages — ~28 instances)
- Body content descriptive uses: "institutional intelligence requires more than information", "evidence-backed institutional intelligence", etc.
- Typography sample: "This is how institutional intelligence content reads" (design-reference.html)

**Classification:** ACCEPTABLE per Spec v7 Layer 1.10 — lowercase descriptive adjective use is NOT D.10.

### "Market Intelligence" in body content (32 instances)

These appear as "market intelligence teams", "market intelligence output", "market intelligence operation", "market intelligence workflow" in body paragraphs across multiple pages.

**Classification:** ACCEPTABLE — descriptive adjective use (lowercase "market intelligence" describing a type of intelligence, not a product name).

### HTML comments (4 instances)

- product-experience.html line 674: `<!-- TRADING INTELLIGENCE -->`
- trading-platform.html line 281: `<!-- THE TRADING INTELLIGENCE STACK -->`
- market-intelligence.html lines 220, 459: `<!-- Market Intelligence value chain -->`, `<!-- Step 5: Market Intelligence Output -->`

**Classification:** ACCEPTABLE — not visible to users.

### "trading intelligence" lowercase in body (2 instances)

- trading-platform.html line 112: "Institutional trading intelligence" (lowercase in H1)
- trading-platform.html line 183: "trading intelligence stack" (lowercase in body)
- solutions.html line 198: "trading intelligence workflow" (lowercase)
- solutions.html line 388: "trading intelligence & execution" (lowercase)

**Classification:** ACCEPTABLE — lowercase descriptive adjective use.

---

## Discovery Summary

| Category | Count | Action |
|---|---|---|
| **CONFIRMED** | **32** | For C3-B execution (after team review of this table) |
| **REVIEW** | **22** | Deferred to team decision |
| **ACCEPTABLE** | **100** | No action needed |
| **Total scanned** | **154** | |

### Key findings

1. **Trading Intelligence as page identity** (trading-platform.html): 8 CONFIRMED instances in title, meta, hero eyebrow, hero paragraph, section eyebrows, section H2. This is the deepest D.10 pattern — the entire page is branded "Trading Intelligence" instead of "Market & Trading Intelligence" or "Trading Desks."

2. **Institutional Intelligence as page identity** (financial-intelligence.html): 5 CONFIRMED instances in title, meta, hero eyebrow, hero H1, section eyebrow. The page is branded "Institutional Intelligence" instead of "Investment Firms" or "Investment Intelligence."

3. **Market Intelligence short-form** (market-intelligence.html): The product page itself uses "Market Intelligence" (short-form) as its title/meta/hero instead of the canonical "Market & Trading Intelligence." This is a unique case — the page IS the Market & Trading Intelligence product page, but it uses the short-form name.

4. **Evidence Explorer delivery list** (line 1214): Contains all 4 old taxonomy terms in one line: "Trading Intelligence · Institutional Intelligence · Media Intelligence · Developer APIs." This is the only line with "Developer APIs" as a standalone product label.

5. **Footer copyright "Institutional Intelligence Products"**: Appears on ALL pages (~28 instances). Classified ACCEPTABLE as descriptive phrase, but team may want to align for consistency.

6. **Company/Platform/Visual Reference titles**: "Institutional Intelligence" in these titles may be descriptive (the company IS an institutional intelligence company) rather than product taxonomy. Marked REVIEW for team decision.

7. **Catalog filter + JS data**: Uses "Market Intelligence" (short-form) and "Trading Intelligence" (standalone) as product labels in filter checkboxes and JS data objects. CONFIRMED — these are product taxonomy labels.

---

## Next Steps

1. **Team reviews this discovery table** — particularly the 22 REVIEW items.
2. **Team decides** on each REVIEW item: CONFIRMED (repair) or ACCEPTABLE (leave).
3. **Team decides** on canonical replacements for CONFIRMED items — especially:
   - trading-platform.html: "Trading Desks" (solution label) or "Market & Trading Intelligence" (product name)?
   - financial-intelligence.html: "Investment Firms" (solution label) or "Investment Intelligence" (product name)?
   - market-intelligence.html: Should the product page title use full "Market & Trading Intelligence" or keep short-form "Market Intelligence"?
4. **After decisions: C3-B execution** with context-classified replacements (NOT blind find-replace).

**No code modified. No commit. Discovery only.**

---

*End of C3-A Taxonomy Discovery Scan. Awaiting team review before C3-B.*

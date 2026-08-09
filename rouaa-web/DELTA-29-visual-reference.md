# Delta Report 29 — `visual-reference.html` vs Product Family Consolidation Spec v6

> **Status:** Design Reference / Design System documentation page test. Tests Spec v6 against a single-file visual reference that demonstrates every surface, intelligence object, evidence pattern, and operational state for ROUA interfaces.
> **Audited file:** `/home/z/my-project/rouaa-corporate/rouaa-web/visual-reference.html` (3572 lines — largest audited page)
> **Reference:** `PRODUCT-FAMILY-CONSOLIDATION-SPEC.md` v6 (commit `d60ec70`)
> **Method:** No code modification. Full cumulative audit across ALL implementation layers (HTML + inline styles + inline `<style>` block (~1227 lines) + inline `<script>` block + external CSS files + external JS content strings + content claims).
> **Acceptance Verdict:** **FAIL** — 6 confirmed defect types (D.2 × 27, D.4 × 2, D.7 × 6+, D.9 × 7, "every claim" FORBID × 1, external-CSS D.5 × 1) + 0 D.15+ new defect types.

**Critical context:** This page is a **design reference document**, not a live UI page. It is `noindex,nofollow` (line 4) and is not linked from the main site navigation as a user-facing page. Many of the raw hex values and color swatches are **deliberate design-reference material** (swatches showing the color system) rather than token violations in live UI. The audit distinguishes between **design-reference material** (swatches demonstrating the palette) and **live UI usage** (inline styles on actual interface elements).

---

## PART 0 — VISUAL REFERENCE'S ACTUAL INSTITUTIONAL FUNCTION

Visual Reference is a **Design Reference / Design System documentation page** — it is the single-file reference demonstrating every surface, intelligence object, evidence pattern, visualization, and operational state that defines ROUA interfaces. Its function is explicitly NOT a product page, NOT a solution page, NOT a platform page — it is the **internal/developer design-system reference** that future ROUA interfaces inherit from.

The page's defining claim — "This is not a style guide. It is the operating language of an intelligence institution" (line 1300) — positions it as the **design-system specification page**: designers and engineers can see every color, typography rule, component, evidence pattern, and operational state in one place.

**Critical observations:**
1. The page is `noindex,nofollow` (line 4) — not indexed by search engines, not a user-facing page.
2. The page is linked from the main site nav as "Design System" (line 1280: `<a href="visual-reference.html" class="nav-link active">Design System</a>`) — but it's a top-level nav item, not under any dropdown.
3. The page loads 4 external CSS files: `design-system/tokens.css`, `design-system/typography.css`, `design-system/components.css`, `styles.css` — plus a ~1227-line inline `<style>` block.
4. The page contains **color swatches** that deliberately display raw hex values (#080B12, #0B0F18, #C9A227, etc.) as reference material — these are NOT token violations in the D.7/D.11 sense; they are the design system documenting its own palette.

### Inferred UX Test for Visual Reference

**Can a designer or engineer quickly find every color, typography rule, component, evidence pattern, and operational state that defines ROUA interfaces — with enough specificity to implement a new interface that inherits from this system?**

Chain: `Hero (design system v1.0) → Section 01 Foundations (color, typography, spacing, motion) → Section 02 Surfaces (cards, panels, console) → Section 03 Intelligence Objects (evidence chain, confidence, provenance) → Section 04 Evidence Patterns (chain, signals, derivation) → Section 05 Visualizations (matrix, timeline, graph) → Section 06 Operational States (loading, error, threshold) → Section 07 Components (buttons, nav, forms) → Section 08 Page Patterns (hero, section, CTA) → Section 09 Localization → Footer`

### Page Structure (24 sections)

The page has 24 `<section>` elements covering: Hero, Foundations (color/typography/spacing/motion), Surfaces, Intelligence Objects, Evidence Patterns, Visualizations, Operational States, Components, Page Patterns, Localization, and Footer.

---

## PART 1 — STRUCTURAL FACTS

### 1.1 CSS / JS Stack

| Component | Loaded | Notes |
|---|---|---|
| `design-system/tokens.css` | ✓ | Token definitions — **contains D.5 violation in comment (line 5)**: "Visual identity: Bloomberg Terminal × Palantir × BlackRock Aladdin" |
| `design-system/typography.css` | ✓ | Typography rules — CLEAN |
| `design-system/components.css` | ✓ | Component styles — CLEAN |
| `styles.css` | ✓ | Navbar/footer styles — CLEAN |
| `roua-v7.css` | ✗ NOT loaded | This page uses the older 4-file CSS stack, not the consolidated v7 CSS |
| `roua-v7-patch.css` | ✗ NOT loaded | |
| **Inline `<style>` block** | ✓ PRESENT (lines 13–1240, ~1227 lines) | Large inline style block defining all `.vr-*` reference classes. LIVE — all classes referenced in body. |
| `main.js` | ✗ NOT loaded | Page uses inline `<script>` instead |
| `design-system/roua-v7.js` | ✗ NOT loaded | |
| **Inline `<script>` block** | ✓ PRESENT (lines 3466–3570, ~104 lines) | Navbar scroll state, reveal observer, animation replay. CLEAN — no forbidden phrases, no timing claims, no confidence strings. |
| **External JS data files** | ✗ ABSENT | No products.js / catalog-data.js etc. — D.14 N/A |

### 1.2 Token Usage — **COMPLEX (design-reference distinction)**

| Token Family | Usage | Verdict |
|---|---|---|
| `--roua-*` aliases | Extensive use throughout inline `<style>` and body | ✓ Correct — broad token vocabulary |
| `var(--gold)` direct (D.6) | **0 instances** | ✓ **D.6 absent** — 12th page with zero D.6 |
| `rgba(201, 162, 39, ...)` (OLD gold, D.2) | **27 instances** | ✗ **D.2 PRESENT — mixed context** — see analysis below |
| Raw hex values (D.7) | **6+ instances of deprecated VISUAL-IDENTITY hex** (`#080B12`, `#0B0F18`, `#C9A227`) | ⚠ **D.7 REVIEW — design-reference context** — see analysis below |
| Non-canonical hex (D.11) | **91 instances total** (including D.7 instances) | ⚠ **D.11 REVIEW — design-reference context** — see analysis below |

**D.2 analysis (27 instances, mixed context):**

The 27 D.2 instances fall into two categories:

**Category A: Design-reference swatches (deliberate documentation, ~4 instances)**
- Lines 1457, 1460, 1464, 1467: Color swatches in the "Institutional Gold" section displaying `rgba(201,162,39,0.06)` and `rgba(201,162,39,0.20)` as reference material with hex labels. These are the design system documenting its own (deprecated) gold palette — NOT live UI usage. **Classification: design-reference material, NOT D.2 violation in the live-UI sense.** However, the design system is documenting a deprecated palette, which is itself a documentation defect — the reference should document the canonical `rgba(227,180,90,...)` palette instead.

**Category B: Live UI inline styles (~23 instances)**
- Lines 108, 109, 119, 213, 214, 650, 702, 767, 953: Inline `<style>` block using `rgba(201,162,39,...)` for grid patterns, radial gradients, pulse animations, hover backgrounds. These are live CSS rules applied to actual interface elements.
- Lines 2739, 2774, 2799, 2800, 2801, 2802, 2804: SVG fills and inline bar-chart backgrounds using `rgba(201,162,39,...)`.

**Classification:** ~23 live-UI D.2 violations + ~4 design-reference D.2 instances (documenting deprecated palette).

**D.7/D.11 analysis (91 raw hex instances, design-reference context):**

The 91 raw hex instances are overwhelmingly in the **color swatch section** (lines 1340–1470+) where the design system documents its palette. The swatches display hex values like `#080B12`, `#0B0F18`, `#101722`, `#C9A227`, `#D4B542`, etc. with labels — these are deliberate design-reference material.

**Classification:**
- **D.7 (deprecated VISUAL-IDENTITY hex):** 6+ instances of `#080B12`, `#0B0F18`, `#C9A227` in swatches. These are the design system documenting deprecated hex values — a documentation defect (should document canonical values), but NOT a live-UI token violation.
- **D.11 (non-canonical raw hex):** 91 instances total, ~85+ in swatch documentation, ~6 in live UI (SVG strokes like `#C9A227` on lines 2739, 2774).

**Key distinction:** This page is a design reference. Raw hex in color swatches is the page's JOB — it's documenting the palette. The defect is that the palette being documented includes deprecated values (`#C9A227`, `#080B12`, `#0B0F18`, `rgba(201,162,39,...)`) rather than canonical values (`#e3b45a` / `rgba(227,180,90,...)`). The live-UI D.2 instances (in the inline `<style>` block and SVG fills) are standard D.2 violations.

### 1.3 Page Structure

```
<head> (lines 1–1241)
  External CSS (lines 9–12): tokens.css, typography.css, components.css, styles.css
  Inline <style> (lines 13–1240, ~1227 lines): all .vr-* reference classes
<body> (lines 1242–3572)
  Skip-link (line 1243)
  Navbar (lines 1245–1282)
  24 <section> elements covering design-system reference material (lines 1284–3450)
  Footer (lines 3451–3465)
  Inline <script> (lines 3466–3570, ~104 lines): navbar scroll, reveal observer, animation replay
</body>
```

- `<section>` count: **24**
- `<div>` balance: 822 / 822 ✓ PASS
- `<section>` balance: 24 / 24 ✓ PASS
- HTML comment balance: 127 / 127 ✓ PASS

### 1.4 HTML Integrity — ALL PASS

| Check | Result |
|---|---|
| `<div>` balance | 822 / 822 ✓ PASS |
| `<section>` balance | 24 / 24 ✓ PASS |
| HTML comment balance | 127 / 127 ✓ PASS |
| Broken internal anchors | None ✓ (skip-link `href="#vr-main"` → `id="vr-main"` ✓; other `href="#"` are demo buttons with `onclick="return false;"`) |
| Dead `<style>` block (D.1) | ✗ ABSENT — inline `<style>` is LIVE (all classes referenced in body) |
| Malformed comment (D.3) | ✗ ABSENT |

### 1.5 Unique Structural Elements

- **Active nav state** on "Design System" top-level link (line 1280) — Visual Reference is a top-level nav item, not under a dropdown
- **`noindex,nofollow` meta** (line 4) — page is not indexed by search engines, not a user-facing page in the SEO sense
- **Skip-link** (line 1243) — `<a href="#vr-main" class="skip-link">Skip to content</a>` — second audited page with skip-link (after Developers Delta 22)
- **4 external CSS files** — uses older 4-file CSS stack (tokens + typography + components + styles) instead of consolidated v7 CSS. This is the **only audited page using the older CSS stack** — all other audited pages use `roua-v7.css` + `roua-v7-patch.css`.
- **Color swatch documentation section** (lines 1340–1470+) — deliberate design-reference material showing the palette with hex labels. This is the page's job as a design system reference.
- **Typography reference section** (lines 1588+) — documents the type hierarchy including "Confidence Score" as a typographic category (line 1640).
- **Evidence pattern visualizations** (lines 2739+) — SVG-based evidence chain, confidence matrix, operational states.
- **Inline `<script>` block** (lines 3466–3570) — navbar scroll state, reveal observer, animation replay button. CLEAN — no forbidden phrases.

---

## PART 2 — ACCEPTANCE CONTRACT EVALUATION (Spec v6)

### Layer 1 — Canonical Baseline

#### 1.1 Token System — **FAIL (D.2 + D.7, mixed context)**

Zero D.6 — 12th page with clean direct-token usage. **But 27 D.2 + 6+ D.7 + 91 D.11 instances**, with the design-reference distinction applied.

**Live-UI D.2 violations (~23 instances):** Inline `<style>` block and SVG fills using `rgba(201,162,39,...)` for actual interface elements. These are standard D.2 violations — should use canonical `rgba(227,180,90,...)`.

**Design-reference D.2/D.7/D.11 instances (~68+ instances):** Color swatches documenting the palette. The defect is that the documented palette includes deprecated values (`#C9A227`, `#080B12`, `#0B0F18`, `rgba(201,162,39,...)`) rather than canonical values. The swatches themselves are NOT violations — they're the page's job. The violation is documenting a deprecated palette.

#### 1.2 Container & Layout — **PASS**
#### 1.3 Navigation — **PASS** (active nav on "Design System" top-level link)
#### 1.4 Buttons — **PASS** (demo buttons with `onclick="return false;"`)
#### 1.5 Footer — **PASS**
#### 1.6 Card Hierarchy — **PASS**
#### 1.7 Motion — **PASS** (reveal-on-scroll with `prefers-reduced-motion` consideration; animation replay button for demo)
#### 1.8 Typography — **PASS**

#### 1.9 Trust Grammar (Forbidden Phrases) — **FAIL (multiple)**

| Phrase | Count | Verdict |
|---|---|---|
| "within seconds" / "in seconds" | 0 | ✓ PASS |
| "real-time" / "real time" (D.8) | 0 | ✓ PASS |
| "instantly" / "instant" | 0 | ✓ PASS |
| **"every claim" (FORBID)** | **1 instance** (line 1300) | ✗ **FAIL** — see analysis below |
| **"audit-ready" / "Audit-Ready" (D.4)** | **2 instances** (lines 2411, 2473) | ✗ **FAIL** — see analysis below |
| "Trust Promise" | 0 | ✓ PASS |
| "Provenance Immutability" | 0 | ✓ PASS |
| "confidence score" / "confidence scored" (D.9 FORBID exact) | 0 | ✓ PASS |
| **"Confidence Scoring" / "confidence scoring" (D.9 REVIEW leans FORBID)** | **0 instances** | ✓ PASS |
| **"confidence scores" (D.9 FORBID plural variant)** | **3 instances** (lines 1588, 2790, 3051) | ✗ **FAIL** — see analysis below |
| **"Confidence Score" (D.9 — typographic category label)** | **1 instance** (line 1640) | ⚠ **REVIEW leans acceptable** — see analysis below |
| **"Confidence score fell" (D.9 — descriptive scenario text)** | **1 instance** (line 2863) | ⚠ **REVIEW leans acceptable** — see analysis below |
| **"confidence scored" (D.9 FORBID exact — past tense)** | **1 instance** (line 2935) | ✗ **FAIL** — see analysis below |
| **"confidence scores" (D.9 — localization rule, line 3417)** | **1 instance** (line 3417) | ⚠ **REVIEW leans acceptable** — see analysis below |
| "SOC 2" / "ISO 27001" | 0 | ✓ PASS |
| "24/7" (D.13) | 0 | ✓ PASS |
| "continuously monitored" / "monitored continuously" | 0 | ✓ PASS |
| **Competitor naming (D.5) — external CSS** | **1 instance in tokens.css line 5** | ✗ **FAIL** — see analysis below |
| "VERIFIED INTELLIGENCE OBJECT" / "verified Intelligence Object" (FORBID + variant) | 0 | ✓ PASS |
| "confidence propagation" | 0 | ✓ PASS (N/A) |

**"every claim" FORBID analysis (1 instance, line 1300):**

```html
<p class="lead">This is not a style guide. It is the operating language of an intelligence institution &mdash; surfaces that hold data, intelligence objects that carry provenance, evidence patterns that prove every claim, and operational states that reflect how the system actually runs. Every ROUA interface inherits from here.</p>
```

**Verdict: FORBID violation.** "evidence patterns that prove every claim" uses the forbidden "every claim" phrase. Should be replaced with "each claim" or "governed claims".

**D.4 "Audit-ready" analysis (2 instances):**

| Line | Text | Context |
|---|---|---|
| 2411 | "Audit-ready, defensible institutional decisions — every conclusion traces back through the intelligence object to its verifiable source." | Pipeline "Decisions" zone description |
| 2473 | `<strong>Audit-ready decisions</strong>` | Comparison table cell (ROUA column) |

**Verdict: D.4 VIOLATION (2 instances).** Both use "Audit-ready" as a descriptor. Visual Reference is NOT the D.4 exception page (only `risk-intelligence.html` is). Should be replaced with "Auditable" or "Reconstructable".

**D.9 analysis (7 instances, mixed classification):**

| Line | Text | Context | Classification |
|---|---|---|---|
| 1588 | "Monospace for data only — confidence scores, evidence IDs, source IDs." | Typography section description | ✗ **FAIL** — "confidence scores" (plural) is D.9 FORBID variant (per Delta 22 Developers precedent). Listed as a typography category. |
| 1640 | `<span class="name">Confidence Score</span>` with sample "97.4%" | Typography reference — "Confidence Score" as a typographic category label | ⚠ **REVIEW leans acceptable** — this is a typographic category label in a design system reference, not a capability claim. The design system is documenting how to typeset confidence scores, not claiming to produce them. Leans acceptable as design-reference documentation. |
| 2790 | "A grid showing confidence scores across sources or scenarios." | Confidence matrix visualization description | ✗ **FAIL** — "confidence scores" (plural) is D.9 FORBID variant. |
| 2863 | "Confidence score fell below the institutional threshold (e.g. 85%)." | Operational state scenario description | ⚠ **REVIEW leans acceptable** — descriptive scenario text illustrating an operational state (confidence below threshold). The design system is documenting what the UI looks like when confidence falls below threshold — not claiming to produce confidence scores. Leans acceptable as design-reference documentation. |
| 2935 | "Source fetched, document parsed, facts extracted, evidence chain assembled, confidence scored. All automated, all logged." | Automation operational state description | ✗ **FAIL** — "confidence scored" (past tense) is D.9 FORBID exact match. |
| 3051 | "Evidence markers, confidence scores, briefing CTA, verified badges" | Mobile evidence card component description | ✗ **FAIL** — "confidence scores" (plural) is D.9 FORBID variant. |
| 3417 | "Confidence scores (97.4%), rates (5.25–5.50%), dates (2026-08-03), and all numeric data remain in international format." | Localization rule description | ⚠ **REVIEW leans acceptable** — localization rule listing what data types don't localize. "Confidence scores" here is a data-type label in a localization context, not a capability claim. Leans acceptable as design-reference documentation. |

**D.9 verdict: 4 confirmed FORBID violations (lines 1588, 2790, 2935, 3051) + 3 REVIEW leaning acceptable (lines 1640, 2863, 3417).**

The 3 REVIEW-leaning-acceptable instances are all in design-reference documentation contexts (typographic category label, operational state scenario, localization data-type label) — NOT capability claims. This is a nuanced classification: the design system references "confidence scores" as a data type to document, not as a capability to claim. Per Delta 28 precedent ("confidence propagation" is acceptable because it's a different concept), these design-reference uses lean acceptable.

**D.5 competitor naming analysis (1 instance in external CSS):**

```css
/* tokens.css line 5:
   Visual identity: Bloomberg Terminal × Palantir × BlackRock Aladdin
   NOT SaaS. NOT crypto. NOT startup AI. NOT retail trading.
*/
```

**Verdict: D.5 VIOLATION (1 instance, external CSS comment).** The `tokens.css` file (loaded by visual-reference.html) contains a comment naming three competitor/reference platforms: "Bloomberg Terminal × Palantir × BlackRock Aladdin". This is in a CSS comment (not visible content), but it IS a competitor naming reference in a file loaded by the page.

**Classification:** Per Spec D.5 rule, competitor naming is forbidden. The comment names Bloomberg Terminal (competitor), Palantir (competitor), and BlackRock Aladdin (competitor). While this is in a CSS comment (not user-visible), it's in a file loaded by the page and is part of the design-system documentation. The canonical replacement would be generic phrasing: "Visual identity: institutional financial infrastructure — NOT SaaS. NOT crypto. NOT startup AI. NOT retail trading."

**Note:** This D.5 instance is in `tokens.css`, not in `visual-reference.html` itself. However, since `visual-reference.html` loads `tokens.css`, the violation is attributable to this page's CSS stack. This is the **first D.5 instance in an external CSS file** on the audited site — previous D.5 violations (Delta 24 Financial Intelligence) were in HTML content.

#### 1.10 Taxonomy (Full Content Scan) — **PASS (design-reference context)**

| Term | Count | Context | Verdict |
|---|---|---|---|
| **"Institutional Intelligence" (standalone, as page/product name)** | **Multiple** (lines 7, 15, 1298, 1595) | Title, inline `<style>` comment, hero eyebrow, typography sample | ⚠ **REVIEW — design-reference context** — see analysis below |
| "Trading Intelligence" (standalone, as product/page name) | 0 | — | ✓ PASS |
| "Market & Trading Intelligence" | 2 (lines 1253, 3456) | Nav + footer | ✓ PASS — canonical product name |
| "Investment Intelligence" | Multiple (nav, footer, pipeline pills, feeds) | Nav, footer, pipeline visualization | ✓ PASS — canonical product name |
| "Risk Intelligence" | Multiple (nav, footer, pipeline pills, feeds) | Nav, footer, pipeline visualization | ✓ PASS — canonical product name |
| "Media Intelligence" | Multiple (nav, footer, pipeline pills) | Nav, footer, pipeline visualization | ✓ PASS — canonical product name |
| "Developer Platform" | Multiple (nav, footer, pipeline pills) | Nav, footer, pipeline visualization | ✓ PASS — canonical product name |
| "Developer APIs" | 0 | — | ✓ PASS |

**D.10 REVIEW analysis — "Institutional Intelligence" as design-system name:**

The page title is "ROUA Institutional Intelligence Design System · v1.0" (line 7), and the hero eyebrow is "ROUA Institutional Intelligence Design System · v1.0 FINAL" (line 1298). The inline `<style>` comment (line 15) says "ROUA INSTITUTIONAL INTELLIGENCE DESIGN SYSTEM · v1.0".

**Classification: REVIEW leans acceptable — design-reference context.** The page is the design system documentation for "ROUA Institutional Intelligence" — here, "Institutional Intelligence" is being used as the **name of the design system itself**, not as a product name in the Spec taxonomy sense. The Spec D.10 rule targets old taxonomy used as product/page identity. Here, "Institutional Intelligence Design System" is the name of the design system artifact (v1.0), not a product claim.

However, this is a borderline case. If the team decides "Institutional Intelligence" should never appear as a standalone capitalized phrase regardless of context, this would be D.10. If the team accepts "Institutional Intelligence Design System" as the name of the design system artifact (distinct from product taxonomy), this leans acceptable.

**Note:** Line 1595 uses "Institutional intelligence, engineered." as a typography H1 sample — this is clearly a typographic sample (demonstrating the H1 style), not a product identity claim. ACCEPTABLE as design-reference material.

### Layer 1 Overall Verdict: **FAIL**

6 confirmed defect types:
1. D.2 violation (~23 live-UI instances + ~4 design-reference instances documenting deprecated palette)
2. D.4 violation (2 instances, lines 2411, 2473) — "Audit-ready" in pipeline and comparison table
3. D.5 violation (1 instance in external `tokens.css` line 5) — "Bloomberg Terminal × Palantir × BlackRock Aladdin" in CSS comment
4. D.7/D.11 (6+ deprecated hex instances in design-reference swatches — documenting deprecated palette)
5. D.9 FORBID (4 confirmed instances: lines 1588, 2790, 2935, 3051) + 3 REVIEW leaning acceptable (lines 1640, 2863, 3417)
6. "every claim" FORBID (1 instance, line 1300)

Plus 1 REVIEW:
- D.10 REVIEW (lines 7, 15, 1298) — "Institutional Intelligence Design System" as design-system artifact name, leans acceptable

---

### Layer 5 — Do-Not-Touch Rules — **PASS**

Visual Reference is NOT forced into Product, Platform, Explorer, Architecture, Solution, or Developer grammar. It has its own design-system-reference structure (24 sections covering foundations, surfaces, intelligence objects, evidence patterns, visualizations, operational states, components, page patterns, localization). Correct adaptation — the page is a design system reference, not a content page.

### Layer 6 — Visual-Reference-Specific Rules

No Spec v6 Visual-Reference-specific UX test. This page is a special case — it's a design system reference document, not a user-facing page. Recommend Spec v7 add a "Design Reference Pages" subsection with modified acceptance criteria (see Part 7).

### UX / Design System Reference Test

**Does the page help a designer or engineer find every color, typography rule, component, evidence pattern, and operational state with enough specificity to implement a new interface?**

✓ **PASS** — The page is comprehensive: 24 sections, 822 divs, ~1227-line inline `<style>` block, color swatches with hex labels, typography samples, component demos, evidence pattern visualizations, operational state scenarios, localization rules. It is the most comprehensive design-system reference on the audited site.

---

## PART 3 — LAYER 4 DEFECT SCAN (D.1–D.14)

| ID | Defect | Present? | Details |
|---|---|---|---|
| D.1 | Dead `<style>` block | ✗ ABSENT | Inline `<style>` (lines 13–1240) is LIVE — all classes referenced in body |
| **D.2** | **Old-gold `rgba(201, 162, 39, ...)`** | **✓ PRESENT (27)** | ~23 live-UI instances (inline `<style>` + SVG fills) + ~4 design-reference swatch instances documenting deprecated palette |
| D.3 | Malformed HTML comment | ✗ ABSENT | 127/127 balanced |
| **D.4** | **"Audit-Ready" violation** | **✓ PRESENT (2)** | Lines 2411, 2473 — "Audit-ready" in pipeline Decisions zone + comparison table |
| **D.5** | **Competitor naming** | **✓ PRESENT (1, external CSS)** | `tokens.css` line 5 comment: "Bloomberg Terminal × Palantir × BlackRock Aladdin" — first D.5 in external CSS on audited site |
| D.6 | `var(--gold)` mixing | ✗ ABSENT | 0 instances — 12th page with clean D.6 |
| **D.7** | **Deprecated raw hex** | **⚠ PRESENT (6+, design-reference)** | `#080B12`, `#0B0F18`, `#C9A227` in color swatches documenting deprecated palette. Design-reference context — the page is documenting the palette, but the palette includes deprecated values. |
| D.8 | "real time" timing claim | ✗ ABSENT | |
| D.8 variant | "continuously monitored" / "24/7" | ✗ ABSENT | |
| D.9 (FORBID exact) | "confidence score/d" | ✗ ABSENT (exact singular) | 0 instances of exact "confidence score" / "confidence scored" (singular)... |
| **D.9 (FORBID)** | **"confidence scored" (past tense, line 2935)** | **✓ PRESENT (1)** | Line 2935 — "confidence scored. All automated, all logged." — past tense FORBID exact match |
| **D.9 (FORBID plural variant)** | **"confidence scores" (plural)** | **✓ PRESENT (3)** | Lines 1588, 2790, 3051 — plural variant (per Delta 22 precedent) |
| D.9 (REVIEW leans acceptable) | "Confidence Score" typographic label + scenario text + localization label | ⚠ REVIEW (3) | Lines 1640, 2863, 3417 — design-reference documentation contexts, lean acceptable |
| **D.10** | **Old taxonomy as product name** | **⚠ REVIEW (leans acceptable)** | "Institutional Intelligence Design System" as design-system artifact name (lines 7, 15, 1298) — design-reference context, leans acceptable |
| **D.11** | **Non-canonical raw hex** | **⚠ PRESENT (91, mostly design-reference)** | ~85+ in color swatch documentation (design-reference material) + ~6 in live UI (SVG strokes) |
| D.12 | No direct source links | N/A | Visual Reference is not an Explorer |
| D.13 | "24/7" timing claim | ✗ ABSENT | |
| D.14 | Timing claims in JS data files | ✗ ABSENT | No external data JS files; inline `<script>` is CLEAN; external CSS files checked — `tokens.css` has D.5 in comment but no timing claims |
| **(FORBID)** | **"every claim"** | **✓ PRESENT (1)** | Line 1300 — "evidence patterns that prove every claim" |
| (FORBID variant) | "verified Intelligence Object" | ✗ ABSENT | 0 instances |

**No D.15+ new defect types found.** Spec v6 sufficient for Visual Reference page.

---

## PART 4 — ACCEPTANCE VERDICT

## **FAIL**

Six confirmed defect types + 1 REVIEW:

1. **D.2 violation** (27 instances: ~23 live-UI + ~4 design-reference) — old-gold `rgba(201,162,39,...)` in inline `<style>`, SVG fills, and swatch documentation
2. **D.4 violation** (2 instances, lines 2411, 2473) — "Audit-ready" in pipeline Decisions zone and comparison table
3. **D.5 violation** (1 instance in external `tokens.css` line 5) — "Bloomberg Terminal × Palantir × BlackRock Aladdin" in CSS comment — first D.5 in external CSS
4. **D.7/D.11** (6+ deprecated hex + 91 total raw hex, mostly design-reference) — color swatches documenting deprecated palette
5. **D.9 FORBID** (4 confirmed: lines 1588, 2790, 2935, 3051) + 3 REVIEW leaning acceptable (lines 1640, 2863, 3417)
6. **"every claim" FORBID** (1 instance, line 1300) — "evidence patterns that prove every claim"

Plus 1 REVIEW:
- **D.10 REVIEW** (lines 7, 15, 1298) — "Institutional Intelligence Design System" as design-system artifact name, leans acceptable

### What's CLEAN

- ✓ Zero D.1 (inline `<style>` is LIVE), D.3, D.6, D.8, D.13
- ✓ Zero D.6 — **12th page with clean direct-token usage**
- ✓ Zero D.8 — no "real-time" / "within seconds" / "24/7" / "in minutes" timing claims
- ✓ Zero "VERIFIED INTELLIGENCE OBJECT" / "Trust Promise" / "Provenance Immutability" / "SOC 2" / "ISO 27001" / "continuously monitored"
- ✓ HTML integrity ALL PASS (822/822 divs, 24/24 sections, 127/127 comments)
- ✓ Active nav on "Design System" top-level link (correct)
- ✓ `noindex,nofollow` — page is not indexed by search engines
- ✓ Skip-link accessibility (line 1243) — second audited page with skip-link
- ✓ Inline `<script>` block (lines 3466–3570) is CLEAN — no forbidden phrases, no timing claims, no confidence strings
- ✓ External CSS files (`typography.css`, `components.css`, `styles.css`) are CLEAN — no forbidden phrases
- ✓ No ambient motion beyond reveal-on-scroll (with `prefers-reduced-motion` consideration)
- ✓ **Most comprehensive design-system reference on the audited site** — 24 sections, 822 divs, color swatches, typography samples, component demos, evidence pattern visualizations, operational state scenarios, localization rules
- ✓ D.9 "Confidence Score" typographic category label (line 1640), operational state scenario (line 2863), and localization data-type label (line 3417) lean acceptable as design-reference documentation

---

## PART 5 — CROSS-REPORT COMPARISON

| Aspect | Enterprise (12) | Platform (17) | Source Registry (18) | Methodology (19) | Infrastructure (20) | Product Experience (21) | Developers (22) | Trading Platform (23) | Financial Intelligence (24) | Financial Media (25) | Contact (26) | Careers (27) | Research Institute (28) | **Visual Reference (29)** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Lines | 515 | 718 | 551 | 552 | 596 | 1144 | 754 | 478 | 584 | 455 | 366 | 375 | 429 | **3572** |
| Sections | 10 | 12 | 10 | 12 | 7 | 12 | 11 | 10 | 12 | 10 | 5 | 7 | 10 | **24** |
| Inline `<style>` | Absent | Present (~78) | Absent | Absent | Absent | Present (~274) | Present (~152, partial dead) | Absent | Absent | Absent | Absent | Absent | Absent | **Present (~1227, LIVE)** |
| D.2 | 0 | 0 | 0 | 0 | 3 | 1 | 3 | 2 | 1 | 0 | 0 | 0 | 1 | **27** |
| D.4 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | **2** |
| D.5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | **1 (external CSS)** |
| D.6 | 0 | 0 | 0 | 18 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | **0** |
| D.7 | 0 | 0 | 0 | 0 | 0 | 0 | 1 (REVIEW) | 0 | 0 | 0 | 0 | 0 | 0 | **6+ (design-reference)** |
| D.8 | 0 | 0 | 0 (REVIEW) | 0 | 0 | 0 | 2 | 0 | 0 | 1 | 0 | 0 | 0 | **0** |
| D.9 (any) | 0 | 0 | 0 | 7 | 2 | 1 | 5 | 0 | 0 | 0 | 1 | 0 | 6 | **4 confirmed + 3 REVIEW** |
| D.10 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 6 | 6 | 1 | 1 | 0 | 0 | **0 (+ REVIEW)** |
| D.11 | 0 | 0 | 0 | 0 | 0 | 15 | 9 | 0 | 0 | 0 | 0 | 0 | 0 | **91 (mostly design-reference)** |
| D.13 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | **0** |
| FORBID ("every claim") | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 4 | 0 | 0 | 0 | **1** |
| FORBID variant ("verified Intelligence Object") | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **0** |
| Total defects | 0 | 0 | 0 (+1 REVIEW) | 2 + 2 REVIEW | 3 + 2 REVIEW | 18 + 4 + 1 | 15 + 1 + 1 | 8 + 2 REVIEW | 12 + 1 REVIEW | 7 + 1 REVIEW | 1 + 1 REVIEW | 0 | 1 + 6 REVIEW | **35+ + 4 REVIEW** |
| Verdict | **PASS** | **PASS** | **FAIL (borderline)** | **FAIL** | **FAIL** | **FAIL** | **FAIL** | **FAIL** | **FAIL** | **FAIL** | **FAIL** | **PASS** | **FAIL** | **FAIL** |

### Key Insights

1. **Visual Reference is the LARGEST and MOST DEFECT-DENSE audited page** — 3572 lines, 35+ confirmed defects. This is expected for a comprehensive design-system reference that documents the full palette (including deprecated values) and uses legacy `rgba(201,162,39,...)` throughout its inline `<style>` block.
2. **Design-reference context distinction — first of its kind** — Visual Reference is the first audited page where the design-reference-vs-live-UI distinction is critical. Color swatches documenting the palette are NOT token violations in the live-UI sense — they're the page's job. The defect is that the documented palette includes deprecated values. Spec v7 should add a "Design Reference Pages" subsection with modified acceptance criteria.
3. **D.5 in external CSS — first of its kind** — `tokens.css` line 5 comment names "Bloomberg Terminal × Palantir × BlackRock Aladdin" as visual identity references. This is the first D.5 instance in an external CSS file on the audited site. Previous D.5 violations (Delta 24) were in HTML content. This expands the D.5 scope: external CSS/JS files loaded by a page are part of the page's defect surface.
4. **D.9 design-reference nuance** — 3 of 7 D.9 instances lean acceptable because they're in design-reference documentation contexts (typographic category label, operational state scenario, localization data-type label). The design system references "confidence scores" as a data type to document, not as a capability to claim. This is a nuanced classification that Spec v7 should address: design-reference documentation of a concept is different from capability-claim usage of the same concept.
5. **D.4 "Audit-ready" in design-reference context** — 2 instances (lines 2411, 2473). Unlike the D.9 design-reference instances, these do NOT lean acceptable — "Audit-ready" is used as a descriptor of institutional decisions ("Audit-ready, defensible institutional decisions") and as a comparison-table cell label ("Audit-ready decisions"). These are capability/positioning claims, not design-reference documentation. Confirmed D.4 violations.
6. **D.10 "Institutional Intelligence Design System" — design-reference context** — The page uses "Institutional Intelligence" as part of the design system's name ("ROUA Institutional Intelligence Design System · v1.0"). This leans acceptable because it's the name of the design system artifact, not a product taxonomy claim. However, if the team decides "Institutional Intelligence" should never appear as a standalone capitalized phrase, this would be D.10.
7. **Older CSS stack** — Visual Reference is the only audited page using the older 4-file CSS stack (tokens + typography + components + styles) instead of the consolidated v7 CSS. This is consistent with the page being a v1.0 design system reference — it documents the design system as it was originally specified, including the deprecated palette.
8. **`noindex,nofollow` — not a user-facing page** — The page is not indexed by search engines. This means the D.4/D.5/D.9/"every claim" violations are less visible to external audiences, but they're still Spec violations.
9. **Most comprehensive design-system reference on the audited site** — 24 sections covering foundations, surfaces, intelligence objects, evidence patterns, visualizations, operational states, components, page patterns, localization. This is a positive Spec contribution — the page is a thorough design system specification.
10. **No D.15+ new defect types found** — Spec v6 sufficient for Visual Reference page. The design-reference context distinction is a nuance within existing defect types, not a new defect type.

---

## PART 6 — RECOMMENDED FIX

### Phase 1 — Live-UI Defect Repairs (~15 minutes)

| Step | Fix | Line(s) | Effort |
|---|---|---|---|
| 29.1 | **D.2 (live-UI)** — Replace all ~23 live-UI `rgba(201,162,39,...)` instances with canonical `rgba(227,180,90,...)` in inline `<style>` block (lines 108, 109, 119, 213, 214, 650, 702, 767, 953) and SVG fills (lines 2739, 2774, 2799, 2800, 2801, 2802, 2804). | (23 lines) | ~8 min |
| 29.2 | **D.4** — Replace "Audit-ready, defensible institutional decisions" with "Auditable, defensible institutional decisions" (line 2411). Replace `<strong>Audit-ready decisions</strong>` with `<strong>Auditable decisions</strong>` (line 2473). | 2411, 2473 | ~2 min |
| 29.3 | **D.5 (external CSS)** — Replace `tokens.css` line 5 comment "Visual identity: Bloomberg Terminal × Palantir × BlackRock Aladdin" with "Visual identity: institutional financial infrastructure" (generic phrasing). | tokens.css:5 | ~1 min |
| 29.4 | **"every claim" FORBID** — Replace "evidence patterns that prove every claim" with "evidence patterns that prove each claim" (line 1300). | 1300 | ~1 min |
| 29.5 | **D.9 FORBID (confirmed)** — Replace "confidence scores" (plural) with "confidence signals" on lines 1588, 2790, 3051. Replace "confidence scored" (past tense) with "confidence signals recorded" on line 2935. | 1588, 2790, 2935, 3051 | ~3 min |

### Phase 2 — Design-Reference Documentation Updates (~10 minutes, team decision)

| Step | Fix | Line(s) | Effort |
|---|---|---|---|
| 29.6 | **D.2/D.7/D.11 (design-reference swatches)** — Update color swatch documentation to show canonical palette (`#e3b45a`, `rgba(227,180,90,...)`) alongside or instead of deprecated palette (`#C9A227`, `rgba(201,162,39,...)`, `#080B12`, `#0B0F18`). | 1340–1470+ | ~5 min |
| 29.7 | **D.9 REVIEW (design-reference)** — If team decides typographic category label (line 1640), operational state scenario (line 2863), and localization label (line 3417) lean acceptable as design-reference documentation, no change needed. If team decides to align for consistency, replace with "confidence signals" / "confidence signal" throughout. | 1640, 2863, 3417 | ~3 min |
| 29.8 | **D.10 REVIEW** — If team decides "Institutional Intelligence Design System" (lines 7, 15, 1298) leans acceptable as design-system artifact name, no change needed. If team decides to align, rename to "ROUA Design System" (drop "Institutional Intelligence"). | 7, 15, 1298 | ~2 min |

**Total Phase 1+P2 repair budget for Visual Reference: ~25 minutes.**

If Phase 1 is applied (live-UI fixes), Visual Reference moves from FAIL → borderline FAIL (design-reference D.2/D.7/D.11 instances remain but are documentation-of-deprecated-palette, not live-UI violations). If Phase 2 is also applied, Visual Reference moves to PASS.

---

## PART 7 — SPEC v7 INPUT

Visual Reference surfaces four items relevant for Spec v7 (do NOT implement now — record for cumulative review after all audits):

1. **Design Reference Pages subsection** — Visual Reference is the first audited page where the design-reference-vs-live-UI distinction is critical. Spec v7 should add a "Design Reference Pages" subsection with modified acceptance criteria:
   - Color swatches documenting the palette are NOT D.7/D.11 violations in the live-UI sense — they're the page's job.
   - The defect is documenting a deprecated palette, not using raw hex in swatches.
   - D.4/D.5/D.8/D.9/"every claim" violations in design-reference content text ARE still violations (these are content claims, not palette documentation).
   - D.9 references in typographic category labels, operational state scenarios, and localization data-type labels lean acceptable (design-reference documentation of a concept ≠ capability claim).
2. **D.5 external CSS/JS scope expansion** — `tokens.css` line 5 comment names competitors. Spec v7 should clarify that D.5 covers external CSS/JS files loaded by a page, not just HTML content. The defect surface includes all files in the page's CSS/JS stack.
3. **D.9 design-reference documentation distinction** — 3 of 7 D.9 instances on Visual Reference lean acceptable because they're in design-reference documentation contexts. Spec v7 should clarify: D.9 covers capability claims and marketing descriptions, NOT design-reference documentation of a concept as a data type or scenario. The distinction: "confidence scores" as a typography category label (line 1640) is documentation; "confidence scores" as a product feature description (line 1588) is a capability claim.
4. **Comprehensive design-system reference pattern** — Visual Reference's 24-section structure (foundations, surfaces, intelligence objects, evidence patterns, visualizations, operational states, components, page patterns, localization) is the most comprehensive design-system reference on the audited site. **Recommend adopting as canonical reference** in Spec v7 Layer 1 (Design System Reference subsection) for any future design-system documentation page.

No other Spec v7 changes triggered by Visual Reference. No new defect types (D.15+).

---

*End of Delta Report 29. Visual Reference FAILS — 6 confirmed defect types (D.2 × 27, D.4 × 2, D.5 × 1 in external CSS, D.7/D.11 × 97 mostly design-reference, D.9 × 4 confirmed + 3 REVIEW, "every claim" FORBID × 1). Largest and most defect-dense audited page (3572 lines). First audited page with D.5 in external CSS, first with design-reference-vs-live-UI distinction critical. Despite the FAIL, the page is the most comprehensive design-system reference on the audited site (24 sections, skip-link, noindex,nofollow). 3 D.9 instances lean acceptable as design-reference documentation. No D.15+ new defect types. Spec v6 sufficient (with design-reference nuance). Total Phase 1+P2 repair budget: ~25 minutes.*

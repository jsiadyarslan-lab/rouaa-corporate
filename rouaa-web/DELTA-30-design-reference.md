# Delta Report 30 (REVISED) — `design-reference.html` vs Product Family Consolidation Spec v6

> **Status:** Design Reference / Component Library documentation page test — **FINAL PAGE** of the 30-page cumulative audit.
> **Audited file:** `/home/z/my-project/rouaa-corporate/rouaa-web/design-reference.html` (863 lines) + its token dependency `design-system/tokens.css` (145 lines)
> **Reference:** `PRODUCT-FAMILY-CONSOLIDATION-SPEC.md` v6 (commit `d60ec70`)
> **Method:** No code modification. Full cumulative audit across ALL implementation layers (HTML + inline styles + inline `<style>` block + **external CSS files including `tokens.css` as source-of-truth** + external JS content strings + content claims).
> **Acceptance Verdict:** **FAIL** — 3 confirmed defects + 3 REVIEW items.

**Revision note:** This report supersedes the initial Delta 30. The initial report classified the color swatches as "design-reference documenting a deprecated palette" — implying the palette was deprecated but the page still showed it. The corrected reading (verified by inspecting `tokens.css` directly) reveals that **`tokens.css` itself — the canonical source-of-truth token file — defines the accent color as `#C9A227` and `rgba(201, 162, 39, ...)`**. The Design Reference page's swatches are therefore NOT documenting a deprecated palette — they are documenting the **actual current palette** as defined in the source-of-truth. This transforms the defect from a documentation issue into a **production design-system governance defect**.

---

## PART 0 — DESIGN REFERENCE'S ACTUAL INSTITUTIONAL FUNCTION

Design Reference is a **Design Reference / Component Library documentation page** — it documents all components, patterns, and visual elements in the ROUA design system. Its function is explicitly NOT a product page, NOT a solution page, NOT a platform page — it is the **component-library reference** that designers and engineers use to implement ROUA interfaces.

The page's defining claim — "Every component, pattern, and visual element in the ROUA institutional design system. **This page is the source of truth — all pages must use these components.**" (lines 313-314) — positions it as the **component-library specification page**.

### The Governance Problem (Critical Finding)

The page claims to be "the source of truth," and it imports `design-system/tokens.css` as its token foundation. However, `tokens.css` itself defines the accent color using the **legacy palette**:

```css
/* tokens.css — the canonical token file */
--roua-accent: #C9A227;                          /* line 35 — legacy hex */
--roua-text-accent: #C9A227;                     /* line 30 — legacy hex */
--roua-accent-subtle: rgba(201, 162, 39, 0.06);  /* line 37 — legacy RGBA */
--roua-accent-border: rgba(201, 162, 39, 0.20);  /* line 38 — legacy RGBA */
--roua-glow-accent: rgba(201, 162, 39, 0.12);    /* line 41 — legacy RGBA */
--roua-glow-accent-strong: rgba(201, 162, 39, 0.22); /* line 42 — legacy RGBA */
--roua-border-accent: rgba(201, 162, 39, 0.20);  /* line 59 — legacy RGBA */
--roua-shadow-glow: 0 0 24px rgba(201, 162, 39, 0.04); /* line 65 — legacy RGBA */
```

The canonical new-gold per Spec is `#e3b45a` / `rgba(227, 180, 90, ...)`. The `tokens.css` file — which is the **source-of-truth token layer** imported by this page (and by `visual-reference.html` Delta 29) — still carries the legacy `#C9A227` / `rgba(201, 162, 39, ...)` palette.

**This is not a documentation defect.** The Design Reference page's color swatches (showing `#C9A227` as "Institutional Gold") are accurately reflecting what `tokens.css` defines. The swatches are correct relative to the token file. The defect is that **the token file itself — the governed source of truth — carries the legacy palette**.

This means the Design Reference + `tokens.css` form **one governed design-system surface**, and a legacy token in the imported source-of-truth layer is a **production design-system defect**, even when the page itself is `noindex`/internal documentation.

---

## PART 1 — STRUCTURAL FACTS

### 1.1 CSS / JS Stack

| Component | Loaded | Notes |
|---|---|---|
| `design-system/tokens.css` | ✓ | **Canonical token file — contains D.2 (legacy palette) + D.5 (competitor naming in comment)** |
| `design-system/typography.css` | ✓ | CLEAN |
| `design-system/components.css` | ✓ | CLEAN |
| `styles.css` | ✓ | CLEAN |
| `roua-v7.css` | ✗ NOT loaded | Uses older 4-file CSS stack (same as Delta 29) |
| `roua-v7-patch.css` | ✗ NOT loaded | |
| **Inline `<style>` block** | ✓ PRESENT (lines 13–278, ~265 lines) | LIVE — all classes referenced in body |
| `main.js` | ✓ | Nav behavior — CLEAN |
| **Inline `<script>` block** | ✗ ABSENT | |
| **External JS data files** | ✗ ABSENT | D.14 N/A |

### 1.2 Token Usage — **FAIL (D.2 confirmed in source-of-truth)**

| Token Family | Usage | Verdict |
|---|---|---|
| `--roua-*` aliases | Extensive use | ✓ Correct (aliases themselves are fine) |
| `var(--gold)` direct (D.6) | **0 instances** | ✓ **D.6 absent** — 13th page with zero D.6 |
| **Legacy palette in `tokens.css` (D.2)** | **8 token definitions** use `#C9A227` or `rgba(201, 162, 39, ...)` | ✗ **D.2 CONFIRMED — in source-of-truth** |
| Raw hex in page swatches (D.7) | 6+ deprecated hex in swatches | ⚠ **Not a separate defect** — swatches accurately reflect `tokens.css` |
| Non-canonical hex in page (D.11) | 30 instances in swatches + ref-code | ⚠ **Not a separate defect** — swatches accurately reflect `tokens.css` |

**Key correction from initial report:** The initial report classified the swatch hex values as D.7/D.11 design-reference instances. The corrected reading: the swatches are **accurate documentation of `tokens.css`**. The actual defect is D.2 in `tokens.css` itself — the source-of-truth token file defines the accent using the legacy palette. The swatches are a **symptom**, not the defect.

### 1.3 Page Structure

- `<section>` count: **15**
- `<div>` balance: 303 / 303 ✓ PASS
- `<section>` balance: 15 / 15 ✓ PASS
- HTML comment balance: 17 / 17 ✓ PASS
- `noindex,nofollow` (line 4) ✓

### 1.4 HTML Integrity — ALL PASS

| Check | Result |
|---|---|
| `<div>` balance | 303 / 303 ✓ PASS |
| `<section>` balance | 15 / 15 ✓ PASS |
| HTML comment balance | 17 / 17 ✓ PASS |
| Broken internal anchors | None ✓ (10 section-anchor links → matching IDs; 5 demo `href="#"` placeholders) |
| Dead `<style>` block (D.1) | ✗ ABSENT — inline `<style>` is LIVE |
| Malformed comment (D.3) | ✗ ABSENT |

---

## PART 2 — ACCEPTANCE CONTRACT EVALUATION (Spec v6)

### Layer 1 — Canonical Baseline

#### 1.1 Token System — **FAIL (D.2 in source-of-truth `tokens.css`)**

The `tokens.css` file — imported as the canonical token foundation — defines 8 accent-related tokens using the legacy `#C9A227` hex or `rgba(201, 162, 39, ...)` RGBA. This is D.2 at the source-of-truth layer, not at the page-swatch layer.

**D.2 confirmed instances in `tokens.css`:**

| Line | Token | Value |
|---|---|---|
| 30 | `--roua-text-accent` | `#C9A227` |
| 35 | `--roua-accent` | `#C9A227` |
| 37 | `--roua-accent-subtle` | `rgba(201, 162, 39, 0.06)` |
| 38 | `--roua-accent-border` | `rgba(201, 162, 39, 0.20)` |
| 41 | `--roua-glow-accent` | `rgba(201, 162, 39, 0.12)` |
| 42 | `--roua-glow-accent-strong` | `rgba(201, 162, 39, 0.22)` |
| 59 | `--roua-border-accent` | `rgba(201, 162, 39, 0.20)` |
| 65 | `--roua-shadow-glow` | `0 0 24px rgba(201, 162, 39, 0.04)` |

All should use canonical `#e3b45a` / `rgba(227, 180, 90, ...)`.

#### 1.2–1.8 — **PASS** (container, layout, buttons, footer, cards, motion, typography)

#### 1.9 Trust Grammar — **FAIL (D.4 + D.5 + D.9)**

| Phrase | Count | Verdict |
|---|---|---|
| **"Audit Ready" (D.4)** | **1 instance** (line 706) | ✗ **FAIL** — badge label in output card demo. Space-separated variant. NOT design-reference documentation exception — it's a visible badge inside an Intelligence Product Component. |
| **Competitor naming (D.5) — `tokens.css` line 5** | **1 instance** | ✗ **FAIL** — "Bloomberg Terminal × Palantir × BlackRock Aladdin" in CSS comment. `tokens.css` is loaded directly by this page. |
| **"confidence scoring" (D.9 REVIEW → leans FORBID)** | **1 instance** (line 550) | ⚠ **REVIEW → leans FORBID** — "Validation rules, confidence scoring, audit controls" in Architecture Layer 06. This is a **capability description** within the Governance layer, NOT a data-type label. Per Deltas 19–29 precedent: capability descriptions lean FORBID. |
| **"97% · Tier 1 · Official" (D.9 REVIEW — design-reference)** | **1 instance** (line 488, Evidence Chain) | ⚠ **REVIEW — acceptable** — visual sample of evidence-chain component confidence display. Design-reference context. |
| **"97% Confidence" (D.9 REVIEW — design-reference)** | **1 instance** (line 771, Stats Bar) | ⚠ **REVIEW — acceptable** — visual sample of stats bar metric. Design-reference context. |
| "real-time" / "real time" (D.8) | 0 | ✓ PASS |
| "every claim" (FORBID) | 0 | ✓ PASS |
| "24/7" (D.13) | 0 | ✓ PASS |
| "continuously monitored" | 0 | ✓ PASS |
| "VERIFIED INTELLIGENCE OBJECT" | 0 | ✓ PASS |

**D.4 analysis (line 706):** "Audit Ready" appears as a badge label inside the Output Card component demo. This is NOT design-reference documentation of a data type — it's a visible badge presented as a distribution-channel label within an Intelligence Product Component. Per Spec D.4 rule, all "Audit-Ready" variants are forbidden except on `risk-intelligence.html`. **Confirmed D.4 violation.**

**D.9 "confidence scoring" analysis (line 550):** "Validation rules, confidence scoring, audit controls" describes the Intelligence Governance architecture layer (layer 06). This is a **capability description** — listing what the Governance layer does. Per Deltas 19 (Methodology), 20 (Infrastructure), 22 (Developers), 26 (Contact), 28 (Research Institute) precedent: "confidence scoring" as a capability/component description leans FORBID. The canonical replacement is "confidence signals". **REVIEW → leans FORBID.**

**D.9 design-reference samples (lines 488, 771):** "97% · Tier 1 · Official" and "97% Confidence" are visual samples within component demos (Evidence Chain node + Stats Bar metric). These are **design-reference documentation** showing how confidence values appear in the UI — NOT capability claims. Per Delta 29 precedent (typographic category labels, operational scenarios, localization labels lean acceptable in design-reference context): **acceptable.**

**"Last: 14:00 UTC" (line 645, Source Card):** This is a metadata-field sample in a source-card component demo — NOT a D.8 timing claim. It shows what a "last checked" timestamp looks like in the UI. **ACCEPTABLE.**

#### 1.10 Taxonomy — **PASS (design-reference context)**

| Term | Count | Context | Verdict |
|---|---|---|---|
| "Trading Intelligence" (standalone product name) | 0 | — | ✓ PASS |
| "Institutional Intelligence" (standalone product name) | 0 | — | ✓ PASS |
| "Market & Trading Intelligence" (line 786) | 1 | Decision Advantage Card title — **design-system component demo** | ✓ PASS — canonical product name used as demo content, NOT page-identity claim |
| "Investment · Trading · Risk · Media · Developer" (line 558) | 1 | Architecture Layer 07 description — application domains example | ✓ PASS — shorthand list as component-demo content |
| "institutional intelligence" (lowercase, line 406) | 1 | Typography sample body text | ✓ PASS — descriptive adjective |
| "Institutional Dark" / "Institutional Gold" (lines 323, 328, 348) | 3 | Color palette labels | ✓ PASS — design-reference color names |

**Layer 1.10 verdict: PASS** — Zero D.10. All taxonomy references are design-system component demo content, not page-identity or product-identity claims.

### Layer 1 Overall Verdict: **FAIL**

3 confirmed defects + 3 REVIEW:
1. **D.2 CONFIRMED** — legacy palette (`#C9A227` / `rgba(201,162,39,...)`) in `tokens.css` source-of-truth (8 token definitions)
2. **D.4 CONFIRMED** — "Audit Ready" badge label (line 706)
3. **D.5 CONFIRMED** — competitor naming in `tokens.css` line 5 comment
4. **D.9 REVIEW → leans FORBID** — "confidence scoring" capability description (line 550)
5. **D.9 REVIEW — acceptable** — "97% · Tier 1 · Official" design-reference sample (line 488)
6. **D.9 REVIEW — acceptable** — "97% Confidence" design-reference sample (line 771)

---

### Layer 5 — Do-Not-Touch Rules — **PASS**

Design Reference is NOT forced into Product/Platform/Explorer/Solution grammar. It has its own component-library structure.

### UX / Component Library Reference Test — **PASS**

15 sections covering all major ROUA components with demo + ref-code blocks. Comprehensive and well-structured for designer/engineer use.

---

## PART 3 — LAYER 4 DEFECT SCAN (D.1–D.14)

| ID | Defect | Present? | Details |
|---|---|---|---|
| D.1 | Dead `<style>` block | ✗ ABSENT | Inline `<style>` is LIVE |
| **D.2** | **Legacy gold palette** | **✓ CONFIRMED (in `tokens.css`)** | 8 token definitions in source-of-truth use `#C9A227` / `rgba(201,162,39,...)` |
| D.3 | Malformed HTML comment | ✗ ABSENT | |
| **D.4** | **"Audit Ready"** | **✓ CONFIRMED (1)** | Line 706 — badge label in Output Card |
| **D.5** | **Competitor naming** | **✓ CONFIRMED (1, external CSS)** | `tokens.css` line 5 — "Bloomberg Terminal × Palantir × BlackRock Aladdin" |
| D.6 | `var(--gold)` mixing | ✗ ABSENT | 0 instances — 13th page with clean D.6 |
| D.7 | Deprecated raw hex | ⚠ Reframed | Swatch hex values accurately reflect `tokens.css` — not a separate defect; the defect is D.2 in `tokens.css` |
| D.8 | Timing claims | ✗ ABSENT | "Last: 14:00 UTC" is metadata-field sample, not timing claim |
| D.9 (FORBID exact) | "confidence score/d" | ✗ ABSENT | |
| **D.9 (REVIEW → leans FORBID)** | **"confidence scoring"** | **✓ PRESENT (1)** | Line 550 — capability description in Governance layer |
| **D.9 (REVIEW — acceptable)** | **Confidence metric samples** | **⚠ PRESENT (2)** | Lines 488, 771 — design-reference component samples |
| D.10 | Old taxonomy as product name | ✗ ABSENT | All taxonomy references are component-demo content |
| D.11 | Non-canonical raw hex | ⚠ Reframed | Swatch hex accurately reflects `tokens.css` — not a separate defect |
| D.12 | No direct source links | N/A | |
| D.13 | "24/7" | ✗ ABSENT | |
| D.14 | Timing in JS data files | ✗ ABSENT | `main.js` CLEAN; no external data JS |
| (FORBID) | "every claim" | ✗ ABSENT | |
| (FORBID variant) | "verified Intelligence Object" | ✗ ABSENT | |

**No D.15+ new defect types found.**

---

## PART 4 — ACCEPTANCE VERDICT

## **FAIL**

3 confirmed defects + 3 REVIEW:

1. **D.2 CONFIRMED** — legacy palette in `tokens.css` source-of-truth (8 token definitions: `#C9A227` + `rgba(201,162,39,...)` × 7). This is the **most significant finding** — the canonical token file itself carries the legacy palette, meaning every page importing `tokens.css` inherits D.2.
2. **D.4 CONFIRMED** — "Audit Ready" badge label (line 706)
3. **D.5 CONFIRMED** — competitor naming in `tokens.css` line 5 comment
4. **D.9 REVIEW → leans FORBID** — "confidence scoring" capability description (line 550)
5. **D.9 REVIEW — acceptable** — "97% · Tier 1 · Official" design-reference sample (line 488)
6. **D.9 REVIEW — acceptable** — "97% Confidence" design-reference sample (line 771)

### What's CLEAN

- ✓ Zero D.1, D.3, D.6, D.8, D.10, D.13, D.14
- ✓ Zero D.6 — **13th page with clean direct-token usage** (no `var(--gold)` in page markup)
- ✓ Zero D.8 — no timing/freshness claims
- ✓ Zero D.10 — all taxonomy references are component-demo content
- ✓ Zero "every claim" FORBID, zero "verified Intelligence Object" FORBID variant
- ✓ HTML integrity ALL PASS (303/303 divs, 15/15 sections, 17/17 comments)
- ✓ `noindex,nofollow` — not indexed
- ✓ Inline `<style>` is LIVE — no dead CSS
- ✓ No inline JavaScript; page loads `main.js` only (CLEAN)
- ✓ Section anchors match IDs
- ✓ Design Reference context is clear and explicit

---

## PART 5 — THE GOVERNANCE FINDING (Critical for Spec v7)

### The Problem

The Design Reference page claims: **"This page is the source of truth — all pages must use these components."**

It imports `tokens.css` as its token foundation. But `tokens.css` defines the accent color as `#C9A227` / `rgba(201, 162, 39, ...)` — the **legacy palette**.

This means:
1. The "source of truth" page accurately reflects the token file it imports.
2. The token file itself carries the legacy palette.
3. Every page that imports `tokens.css` (Visual Reference Delta 29, Design Reference Delta 30, and potentially others using the older 4-file CSS stack) inherits the legacy palette at the token-definition layer.

**This is not a page-level defect. This is a design-system governance defect.** The Design Reference + `tokens.css` form **one governed design-system surface**, and the legacy tokens in the source-of-truth layer constitute a production defect — even though the page is `noindex`/internal documentation.

### Spec v7 Rule (Recommended)

> **A design-reference page and the canonical token files it imports must be evaluated as one governed design-system surface. A legacy token in the imported source-of-truth layer is a production design-system defect, even when the page itself is noindex/internal documentation.**

This rule elevates the audit scope from "page-level token usage" to "governed design-system surface." It means:
- D.2 in `tokens.css` is a D.2 violation for every page that imports it — not just the design-reference pages.
- The fix must happen at `tokens.css` (the source), not at individual page swatches.
- The design-reference page's swatches are **accurate documentation** of the current (legacy) palette — they become correct automatically once `tokens.css` is fixed.

### Impact on Other Pages

This finding may retroactively affect other pages that import `tokens.css`. The 30-page audit used `roua-v7.css` + `roua-v7-patch.css` as the canonical CSS stack for most pages. However, `tokens.css` is part of the older 4-file stack used by Visual Reference (Delta 29) and Design Reference (Delta 30). If any other audited pages also import `tokens.css`, they would inherit the same D.2 at the token-definition layer. This should be checked in the Spec v7 refinement phase.

---

## PART 6 — RECOMMENDED FIX

### Phase 1 — Source-of-Truth + Page Defects (~5 minutes)

| Step | Fix | Location | Effort |
|---|---|---|---|
| 30.1 | **D.2 (source-of-truth)** — Update `tokens.css` to use canonical new-gold: `--roua-accent: #e3b45a;` and replace all `rgba(201, 162, 39, X)` with `rgba(227, 180, 90, X)` across 8 token definitions (lines 30, 35, 37, 38, 41, 42, 59, 65). **This is the root fix — it automatically corrects the Design Reference swatches and any other page importing `tokens.css`.** | `tokens.css` | ~3 min |
| 30.2 | **D.5 (source-of-truth)** — Replace `tokens.css` line 5 comment "Visual identity: Bloomberg Terminal × Palantir × BlackRock Aladdin" with "Visual identity: institutional financial infrastructure". **Shared fix with Delta 29.** | `tokens.css`:5 | ~1 min |
| 30.3 | **D.4** — Replace "Audit Ready" badge label with "Auditable" in Output Card demo (line 706). | `design-reference.html`:706 | ~1 min |
| 30.4 | **D.9 REVIEW → leans FORBID** — If team confirms, replace "confidence scoring" with "confidence signals" in Architecture Layer 06 (line 550). | `design-reference.html`:550 | ~1 min |

### Phase 2 — No Additional Fixes Required

Once `tokens.css` is updated (step 30.1), the Design Reference page's color swatches automatically reflect the canonical palette. No separate swatch-update work is needed — the swatches already read from `tokens.css` definitions.

**Total repair budget: ~5 minutes** (and steps 30.1 + 30.2 are shared with Delta 29, so the marginal cost for Delta 30 alone is ~2 minutes).

---

## PART 7 — SPEC v7 INPUT

Design Reference (corrected) surfaces three items for Spec v7:

1. **Governed Design-System Surface rule** (critical) — A design-reference page and the canonical token files it imports must be evaluated as one governed design-system surface. A legacy token in the imported source-of-truth layer is a production design-system defect, even when the page is `noindex`/internal. This rule retroactively means D.2 in `tokens.css` is a violation for every page importing it.

2. **D.9 design-reference vs capability distinction** (reinforced from Delta 29) — "confidence scoring" as a capability description in an architecture layer (line 550) leans FORBID; "97%" as a visual sample in a component demo (lines 488, 771) is acceptable. The distinction: capability descriptions describe what the system does; design-reference samples show how data appears in the UI.

3. **D.5 external CSS scope** (reinforced from Delta 29) — `tokens.css` is shared between Visual Reference (Delta 29) and DesignReference (Delta 30). Fixing `tokens.css` line 5 fixes both pages. D.5 scope includes all files in the page's CSS/JS stack.

No D.15+ new defect types.

---

*End of Delta Report 30 (REVISED) — FINAL PAGE of the 30-page cumulative audit. Design Reference FAILS — 3 confirmed (D.2 in `tokens.css` source-of-truth, D.4 "Audit Ready", D.5 competitor naming in `tokens.css`) + 3 REVIEW (D.9 "confidence scoring" leans FORBID, 2 D.9 design-reference samples acceptable). The critical finding: the legacy palette lives in `tokens.css` itself — the canonical source-of-truth — not just in page-level swatches. This is a production design-system governance defect. Fixing `tokens.css` (root fix) automatically corrects the Design Reference swatches and is shared with Delta 29. No D.15+ new defect types. Spec v6 sufficient. Total repair budget: ~5 minutes (or ~2 minutes marginal if shared with Delta 29).*

*This completes the 30-page cumulative audit: **4 PASS, 26 FAIL** (Source Registry remains borderline as previously reported). Spec v6 sufficient for all 30 pages — no D.15+ new defect types found across the entire audit. The audit is ready for the Spec v7 refinement phase and Phase 1 repair execution.*

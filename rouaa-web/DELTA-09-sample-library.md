# Delta Report 09 — `sample-library.html` vs Product Family Consolidation Spec v4

> **Status:** Third Inspection-category test. Final Explorer-category page. Tests Spec v4 (with D.11/D.12/D.13 + UX split + D.10 downgrade).
> **Audited file:** `/home/z/my-project/rouaa-corporate/rouaa-web/sample-library.html` (1076 lines)
> **Reference:** `PRODUCT-FAMILY-CONSOLIDATION-SPEC.md` v4 (commit `da454f5`)
> **Method:** No code modification. Acceptance Contract applied across ALL implementation layers. UX test inferred from actual implementation (not assumed from Explorer template).
> **Acceptance Verdict:** **FAIL** — D.4 ("Audit Ready" without hyphen — variant of D.4) + D.9 ("Extraction Confidence" — variant of D.9) + D.10 (old taxonomy in H1 headline) + D.12 (no direct source links).

---

## Classification Framework (Same A/B/C/D + Spec v4 Acceptance)

| Category | Meaning |
|---|---|
| **A** | Must match — system primitives |
| **B** | Must adapt to category nature |
| **C** | Must NOT transfer from Homepage or Decision Environments |
| **D** | Real defect — must fix |

---

# PART 1 — SAMPLE LIBRARY'S ACTUAL FUNCTION (Determined Before Testing)

> User asked: "Sample Library is not an Explorer in the same sense — do not assume a UX chain. Determine its actual function first, then test it."

## What Sample Library Actually Is

Sample Library is a **gallery of illustrative intelligence output samples** — NOT an evidence inspector (like Evidence Explorer) and NOT a source registry browser (like Source Explorer). Its function is:

1. **Show what ROUA's intelligence outputs look like** — 6 tab-switchable samples across product lines
2. **Demonstrate the evidence chain structure** each output carries — Source, Document, Location, Evidence ID, Extracted Fact, Provenance Status, Evidence Status, Source Tier, Source Type, Extraction Confidence
3. **Illustrate the reasoning/validation boundary** — "Derived" vs "Not inferred" vs "Validation" labels
4. **Provide cross-links to product pages** — each sample links to its parent product

## The 6 Samples

| Tab | Sample | Product link |
|---|---|---|
| FOMC Intelligence Brief | Monetary Policy Intelligence Brief — Fed maintains rate at 5.25–5.50% | Market Intelligence |
| Earnings Evidence Report | Corporate Event Evidence Report — Aramco Q2 2026 revenue $108.2B | Investment Intelligence |
| Market Impact Brief | Economic Release Analysis — US CPI release | Market & Trading Intelligence |
| Risk Alert | Risk Intelligence Alert — Regulatory Designation Update | Risk Intelligence |
| Media Intelligence Brief | Financial Media Intelligence Brief — FOMC story draft | Media Intelligence |
| API Intelligence Object | API Intelligence Object — Developer Platform JSON excerpt | Developer Platform |

## Inferred UX Test for Sample Library

Based on the actual implementation, the UX test for Sample Library is:

**Can the user quickly browse sample outputs, understand what each output contains (evidence chain, reasoning/validation boundary, available formats), and navigate to the relevant product page?**

Chain: `Sample Output → Evidence Chain → Reasoning/Validation Boundary → Product Cross-Link`

This is **NOT** the Evidence Explorer chain (`Source → Document → Evidence → Provenance → Context`) and **NOT** the Source Explorer chain (`Source → Identity → Jurisdiction → Type → Monitoring Status → Official Domain`). Sample Library has its own purpose: **showcasing output structure**, not inspecting evidence or browsing sources.

---

# PART 2 — STRUCTURAL FACTS

## 2.1 CSS / JS Stack

| Component | Loaded | Notes |
|---|---|---|
| `roua-v7.css` | ✓ | |
| `roua-v7-patch.css` | ✓ | |
| `styles.css` | ✗ NOT loaded | Same as all prior pages |
| **Inline `<style>` block** (lines 13–152) | ✓ | Defines `.sample-tabs`, `.sample-tab`, `.sample-display`, `.brief-frame`, `.brief-header`, `.brief-type`, `.brief-title`, `.brief-meta`, `.brief-body`, `.brief-section`, `.brief-text`, `.evidence-box`, `.evidence-row`, `.evidence-label`, `.evidence-value`, `.concept-badge` — the sample gallery design system. ~139 lines. |
| `main.js` | ✓ | |
| **Inline `<script>` block** (lines 1055–1073) | ✓ | Tab-switching logic (click handler, active class toggle, display show/hide). ~18 lines. |
| `design-system/roua-v7.js` | ✓ | |

## 2.2 Token Usage

| Token Family | Usage | Verdict |
|---|---|---|
| `--roua-*` aliases | Used throughout | ✓ Correct |
| `var(--gold)` direct (D.6) | **0 instances** | ✓ D.6 absent |
| `rgba(201, 162, 39, ...)` (OLD gold, D.2) | **1 instance** (line 142) | ⚠ **D.2 PRESENT** |
| Raw hex values (D.7 / D.11) | **0 instances** | ✓ D.7 + D.11 absent |
| Non-canonical hex (D.11) | **0 instances** | ✓ D.11 absent |

**D.2 location:** Line 142: `.concept-badge` background — `rgba(201, 162, 39, 0.15)` — same pattern as Evidence Explorer and Source Explorer.

## 2.3 Page Structure

```
Navigation (lines 158–247)
1. Page Hero — .page-hero (lines 249–268)
2. Sample Selector + 6 tab-switchable samples (lines 270–980)
   - Sample 1: FOMC Intelligence Brief (lines 282–443)
   - Sample 2: Market Impact Brief (lines 445–546)
   - Sample 3: Earnings Evidence Report (lines 548–650)
   - Sample 4: Risk Alert (lines 652–761)
   - Sample 5: Media Intelligence Brief (lines 763–868)
   - Sample 6: API Intelligence Object (lines 870–970)
3. CTA (lines 982–995)
Footer (lines 997–1052)
```

- `<section>` count: **3** (fewest of any audited page — Page Hero + Sample Selector + CTA)
- `<div>` balance: 402 / 402 ✓ PASS
- `<section>` balance: 3 / 3 ✓ PASS
- HTML comment balance: 11 / 11 ✓ **PASS**

## 2.4 HTML Integrity

| Check | Result |
|---|---|
| `<div>` balance | 402 / 402 ✓ PASS |
| `<section>` balance | 3 / 3 ✓ PASS |
| HTML comment balance | 11 / 11 ✓ PASS |
| Broken internal anchors | None ✓ (6 `href="#"` anchors are tab triggers with JS `e.preventDefault()`, not navigation) |
| Dead `<style>` block (D.1) | ✗ ABSENT — inline `<style>` is the sample gallery design system |

---

# PART 3 — ACCEPTANCE CONTRACT EVALUATION (Spec v4)

## Layer 1 — Canonical Baseline

### 1.1 Token System

| Rule | Status | Notes |
|---|---|---|
| Use `--roua-*` aliases | ✓ PASS | All aliases used correctly |
| Never use raw hex in CSS/inline | ✓ PASS | Zero raw hex values |
| Never use raw hex in SVG | ✓ PASS | No SVG diagrams |
| Never use raw hex in Canvas/Three.js | ✓ PASS | No Three.js/Canvas |
| Never use `rgba(201, 162, 39, ...)` | ✗ **FAIL** | 1 instance (D.2): line 142 |
| Never use `var(--gold)` directly | ✓ PASS | 0 instances |
| Never use non-canonical raw hex (D.11) | ✓ PASS | 0 non-canonical hex values |

**Layer 1.1 verdict:** **FAIL** — D.2 (1 instance).

### 1.2 Container & Layout — **PASS**

### 1.3 Navigation — **PASS**

| Rule | Status |
|---|---|
| `.navbar` system | ✓ PASS |
| Products dropdown: 6 links | ✓ PASS |
| Solutions dropdown: 7 links | ✓ PASS |
| Mobile hamburger | ✓ PASS (line 244) |
| Active nav state | ✓ PASS — on Experience dropdown (line 213). Sample Library is the **fifth page** with active nav state (after Developer + Architecture + Evidence Explorer + Source Explorer). |

### 1.4 Buttons — **PASS**
### 1.5 Footer — **PASS** (6 columns, no Channels)

### 1.6 Card Hierarchy — **PASS**

| Rule | Status | Notes |
|---|---|---|
| Evidence-first card pattern | ✓ PASS | Uses custom `.brief-frame` + `.evidence-box` system — equivalent evidence-first pattern with no hover theatrics |
| `.cx` hover theatrics | ✗ ABSENT | Correct |
| `.card-accent` marketing | ✗ ABSENT | Correct |

### 1.7 Motion — **PASS**

Zero ambient motion. Only user-triggered tab switching (JS click handler).

### 1.8 Typography — **PASS**

### 1.9 Trust Grammar (Forbidden Phrases)

| Phrase | Count | Verdict |
|---|---|---|
| **"Audit Ready"** (without hyphen) | **1** (line 316) | ✗ **FAIL — D.4 variant** |
| "within seconds" / "in seconds" | 0 | ✓ PASS |
| "real-time" / "real time" | 0 | ✓ PASS |
| "instantly" / "instant" | 0 | ✓ PASS |
| "continuously monitored" | 0 | ✓ PASS |
| "every claim" | 0 | ✓ PASS |
| "VERIFIED INTELLIGENCE OBJECT" | 0 | ✓ PASS |
| "Trust Promise" | 0 | ✓ PASS |
| "Provenance Immutability" | 0 | ✓ PASS |
| **"confidence score" / "confidence scored"** | 0 | ✓ PASS (exact phrase) |
| **"Extraction Confidence"** | **12 instances** | ⚠ **D.9 variant — REVIEW** |
| "SOC 2" / "ISO 27001" | 0 | ✓ PASS |
| "24/7" | 0 | ✓ PASS (D.13 absent) |

**D.4 variant — "Audit Ready" (line 316):**
```html
<div style="font-size: 13px; color: var(--roua-accent); font-weight: 600;">Audit Ready</div>
```
This is a status badge in Sample 1 (FOMC Intelligence Brief) metadata grid. "Audit Ready" (without hyphen) is a variant of "Audit-Ready" — same semantic meaning, same FORBID rule applies. Sample Library is NOT `risk-intelligence.html`.

**D.9 variant — "Extraction Confidence" (12 instances):**
The page uses "Extraction Confidence" extensively (lines 288, 311, 383, 451, 517, 554, 621, 732, 769, 839, 876, 901) as a metadata field showing percentage values (97%, 98%, 99%, 97.4%). This is a **variant** of "confidence score" — it uses "confidence" in a scoring context (percentage values).

However, there's a nuance: every instance is marked "(illustrative)" — the page explicitly flags these as illustrative values, not production claims. This is a **REVIEW** judgment call:
- If "Extraction Confidence" is treated as D.9 (confidence score variant): FORBID, replace with "Verification Tier"
- If "Extraction Confidence" is treated as acceptable metadata (like "Source Tier" which also appears): acceptable, since it's explicitly illustrative

**Classification: D.9 variant — REVIEW.** The phrase "Extraction Confidence" is not the exact forbidden phrase "confidence score", but it uses "confidence" in a scoring context. The illustrative disclaimer mitigates but doesn't eliminate the concern. Recommend Spec v5 clarify whether "Extraction Confidence" is a D.9 variant or acceptable metadata.

### 1.10 Taxonomy (Full Content Scan)

| Old term (FORBID) | Count | Verdict |
|---|---|---|
| "Trading Intelligence" (alone) | 0 | ✓ PASS |
| **"Institutional Intelligence"** | **3** (lines 254, 1003, 1049) | ⚠ **REVIEW** |
| "Developer Intelligence" | 0 | ✓ PASS |
| "Developer APIs" | 0 | ✓ PASS |
| "Market Intelligence" (alone as product name) | 0 | ✓ PASS |

**Line 254 — H1 headline:** `"Institutional Intelligence Outputs"` — This is the page's H1. "Institutional Intelligence" here is used as a **descriptive adjective phrase** ("institutional intelligence outputs" = "outputs of institutional intelligence"), NOT as a product name. It's not referring to the old "Institutional Intelligence" product (which was renamed to "Investment Intelligence").

**Lines 1003, 1049 — footer brand:** `"ROUA delivers institutional intelligence products"` and `"Institutional Intelligence Products Powered by Evidence Infrastructure"` — Same descriptive use as all other pages' footers (confirmed identical across Investment, Market, Risk, Media, Developer, Architecture, Evidence Explorer, Source Explorer).

**Classification:** These are **descriptive adjective uses**, not product-name uses. "Institutional intelligence" (lowercase, descriptive) ≠ "Institutional Intelligence" (capitalized, product name). The H1 uses title case ("Institutional Intelligence Outputs") which is ambiguous — it could be read as a product name.

**Verdict: REVIEW.** The H1 headline "Institutional Intelligence Outputs" is borderline. If read as "outputs of institutional intelligence" (descriptive), it's acceptable. If read as "Institutional Intelligence" product name + "Outputs", it's D.10. Recommend softening to "Institutional Intelligence Sample Outputs" or "Sample Intelligence Outputs" to remove ambiguity.

### Layer 1 Overall Verdict: **FAIL**
D.2 (1 instance) + D.4 variant (1 instance "Audit Ready") + D.9 variant REVIEW (12 instances "Extraction Confidence") + D.10 REVIEW (1 instance "Institutional Intelligence" in H1).

---

## Layer 5 — Do-Not-Touch Rules — **PASS**

| Rule | Status |
|---|---|
| Do NOT force Decision Environment grammar | ✓ PASS — Sample Library has its own `.brief-frame` + `.evidence-box` grammar |
| Do NOT force product-specific Trust Grammar labels | ✓ PASS — Uses "Extracted Fact", "Provenance Status", "Evidence Status" — generic evidence labels, not product-specific |
| Do NOT add Homepage-brand elements | ✓ PASS — Zero Homepage-brand elements |
| Do NOT force `.hero-split` + `.glass-status-card` | ✓ PASS — Uses `.page-hero` |
| Do NOT force `.cx` hover theatrics | ✓ PASS — Zero `.cx` usage |

---

## Layer 6 — Explorer-Specific Rules (Spec v4 Layer 6.3)

| Rule | Status | Notes |
|---|---|---|
| Evidence-first card pattern (`.card-evidence` OR equivalent) | ✓ PASS | Custom `.brief-frame` + `.evidence-box` system — equivalent evidence-first pattern |
| Must NOT use `.cx` hover theatrics | ✓ PASS | Zero `.cx` |
| Minimal motion — zero animation | ✓ PASS | Only user-triggered tab switching |
| Dense metadata | ✓ PASS | Each sample has 10 evidence-row fields + 6 metadata cards + reasoning/validation block |
| **Direct links to official sources** | ✗ **FAIL** | **D.12** — Zero external links to official sources. Evidence boxes show "Source: Federal Reserve" as text, not as clickable link. Same pattern as Source Explorer. |
| UX inspection test | ✓ PASS | See inferred UX test below |

### UX Inspection Test (inferred from actual implementation)

**Can the user quickly browse sample outputs, understand what each output contains, and navigate to the relevant product page?**

✓ **PASS** — The user can:
1. Browse 6 samples via tab selector (click any tab to switch)
2. See each sample's structure: brief-type, brief-title, brief-meta, headline, context, analytical context, evidence chain (10 fields), reasoning & validation, supporting evidence stats, available formats
3. Navigate to the relevant product page via cross-link at the bottom of each sample

The UX test chain: `Sample Output → Evidence Chain → Reasoning/Validation Boundary → Product Cross-Link` — **PASS**.

---

## Layer 4 — Confirmed Defects (D.1–D.13)

| ID | Defect | Present? | Details |
|---|---|---|---|
| D.1 | Dead `<style>` block | ✗ ABSENT | Inline `<style>` is the sample gallery design system |
| **D.2** | Old-gold `rgba(201, 162, 39, ...)` | **✓ PRESENT — 1 instance** | Line 142 (`.concept-badge` bg) |
| D.3 | Malformed HTML comment | ✗ ABSENT | 11/11 PASS |
| **D.4** | "Audit-Ready" violation | **✓ PRESENT — 1 instance (variant)** | Line 316: "Audit Ready" (without hyphen) — status badge in Sample 1 metadata. Same semantic meaning as "Audit-Ready". |
| D.5 | Bloomberg naming | ✗ ABSENT | 0 instances |
| D.6 | `var(--gold)` base token | ✗ ABSENT | 0 instances |
| D.7 | Deprecated raw hex | ✗ ABSENT | 0 deprecated hex values |
| D.8 | "real time" timing claim | ✗ ABSENT | 0 instances |
| **D.9** | "confidence score/d" claim | **⚠ VARIANT — "Extraction Confidence" × 12** | Lines 288, 311, 383, 451, 517, 554, 621, 732, 769, 839, 876, 901. Uses "confidence" in scoring context (percentage values). Every instance marked "(illustrative)". **REVIEW: is "Extraction Confidence" a D.9 variant or acceptable metadata?** |
| **D.10** | Old taxonomy in content | **⚠ REVIEW — "Institutional Intelligence" in H1** | Line 254: H1 headline "Institutional Intelligence Outputs". Descriptive adjective use or product-name use? Ambiguous. |
| D.11 | Non-canonical raw hex | ✗ ABSENT | 0 non-canonical hex values |
| **D.12** | No direct source links | **✓ PRESENT** | Zero external links to official sources. Evidence boxes show "Source: Federal Reserve" as text. Same pattern as Source Explorer. |
| D.13 | "24/7" timing claim | ✗ ABSENT | 0 instances |

---

# PART 4 — SAMPLE / ILLUSTRATION vs VERIFIED SOURCE EVIDENCE BOUNDARY

> User asked: "Separate sample/illustration from verified source evidence — this is a core trust point on this page."

## How Sample Library Handles the Boundary

### Illustrative disclaimers — **STRONG** ✓✓

The page has **24 instances of "illustrative"** — the most of any audited page. Key disclaimers:

1. **Hero (line 264):** "ⓘ Illustrative View — Illustrative samples — representative structure, not production records."
2. **Each sample's brief-meta (lines 288, 451, 554, 658, 769, 876):** "Illustrative timestamp" + "Extraction confidence: 97% (illustrative)"
3. **Each evidence-row "Extraction Confidence" (lines 383, 517, 621, 732, 839):** "97% (illustrative) · direct extraction"
4. **Each sample's "Validation" reasoning (lines 401, 535, 639, 750, 857, 959):** "Governance state: illustrative. Production workflows can record validation and authorized review in the audit trail."
5. **Closing note (line 974):** "These examples illustrate outputs produced through ROUA's intelligence infrastructure — every output carries its source, document, evidence ID, and provenance status."

### Evidence/Analysis boundary — **STRONG** ✓✓

Each sample has an explicit "Analytical Context" section with the disclaimer:
- "— Analytical interpretation, not investment recommendation." (lines 341, 579)
- "— Analytical interpretation, not trading recommendation." (line 475)
- "— Analytical interpretation, not verified fact." (line 797)

And each sample has a "Reasoning & Validation" section with three labeled categories:
- **"Derived:"** — "Conclusions reached by combining verified facts through governed reasoning rules. Carries auditable analytical trace."
- **"Not inferred:"** — "Forward-looking predictions, scenario probabilities, or editorial framing are labeled as analytical interpretation — not presented as verified fact."
- **"Validation:"** — "Governance state: illustrative."

### Verified source evidence — **PRESENT but NOT LINKED** ⚠

Each sample's evidence box shows:
- Source: "Federal Reserve — Federal Open Market Committee" (text)
- Document: "FOMC Statement — August 2, 2026" (text)
- Location: "Page 1 · Paragraph 2" (text)
- Evidence ID: "EV-FOMC-2026-08-001-P1S2" (text)
- Extracted Fact: "target range for the federal funds rate at 5.25 to 5.50 percent" (text)
- Provenance Status: "Verified · Source-linked" (text)
- Evidence Status: "Verified" (text)
- Source Tier: "Tier 1" (text)
- Source Type: "Official central bank publication" (text)
- Extraction Confidence: "97% (illustrative) · direct extraction" (text)

**All evidence fields are TEXT — none are clickable links.** This is D.12 (same as Source Explorer). The user can read the evidence chain but cannot click through to the official source.

### Boundary verdict

| Boundary aspect | Verdict |
|---|---|
| Illustrative disclaimer coverage | ✓✓ PASS — 24 "illustrative" instances, comprehensive |
| Evidence/Analysis boundary | ✓✓ PASS — "Analytical interpretation, not recommendation/fact" disclaimers + Derived/Not inferred/Validation labels |
| Verified source evidence present | ✓ PASS — 10-field evidence chain per sample |
| Verified source evidence linked | ✗ FAIL — D.12: zero external links to official sources |

---

# PART 5 — DRIFT SUMMARY

## A — Must match (system primitives)
| ID | Finding | Verdict |
|---|---|---|
| A.1 | `.page-hero` (like Developer + Evidence Explorer + Source Explorer) | **KEEP** (B-category — Inspection) |
| A.2 | Active nav state on Experience | **KEEP** (correct — fifth page with active nav) |

## B — Must adapt to category nature (Inspection — Sample Gallery)
| ID | Finding | Verdict |
|---|---|---|
| B.1 | Custom `.brief-frame` + `.evidence-box` design system (~139 lines CSS) | **KEEP** — correct sample gallery adaptation |
| B.2 | 6 tab-switchable samples | **KEEP** — correct gallery UX |
| B.3 | 10-field evidence chain per sample | **KEEP** — correct evidence density |
| B.4 | Reasoning & Validation block (Derived / Not inferred / Validation) | **KEEP** — correct evidence/analysis boundary |
| B.5 | 24 "illustrative" disclaimers | **KEEP** — strongest illustrative framing in product family |
| B.6 | Zero ambient motion (only user-triggered tab switching) | **KEEP** — correct Inspection restraint |
| B.7 | Cross-links to product pages at bottom of each sample | **KEEP** — correct gallery-to-product navigation |

## C — Must NOT transfer from Homepage or Decision Environments
| ID | Finding | Verdict |
|---|---|---|
| C.1–C.14 | All 14 Homepage-brand elements | ✓ **All correctly absent** |
| C.15 | `.glass-status-card` | ✓ Absent |
| C.16 | `.hero-split` | ✓ Absent |
| C.17 | `.card-accent` | ✓ Absent |
| C.18 | `.cx` hover theatrics | ✓ Absent |

## D — Real defects
| ID | Finding | Severity | Fix |
|---|---|---|---|
| **D.2** | 1 instance of `rgba(201, 162, 39, ...)` (line 142) | **P1 — REPAIR** | Replace with `rgba(227, 180, 90, ...)` |
| **D.4 variant** | 1 instance of "Audit Ready" (line 316, without hyphen) | **P1 — REPAIR** | Replace with "Evidence-Linked" or "Inspectable" |
| **D.9 variant** | 12 instances of "Extraction Confidence" (lines 288–901) | **P3 — REVIEW** | Is "Extraction Confidence" a D.9 variant (FORBID) or acceptable metadata (like "Source Tier")? All instances marked "(illustrative)". |
| **D.10 REVIEW** | "Institutional Intelligence" in H1 headline (line 254) | **P3 — REVIEW** | Descriptive adjective use or product-name use? Ambiguous. Recommend softening to remove ambiguity. |
| **D.12** | Zero external links to official sources (same as Source Explorer) | **P1 — REPAIR** | Add `<a href>` to each sample's "Source" and "Document" evidence-row values |

---

# PART 6 — ACCEPTANCE VERDICT

## **FAIL**

The page **FAILS** the Acceptance Contract due to:

1. **Layer 1.1 token violation:** D.2 (1 instance of old-gold rgba)
2. **Layer 1.9 Trust Grammar violation:** D.4 variant ("Audit Ready" without hyphen, line 316)
3. **Layer 6.3 Explorer rule violation:** D.12 (zero external source links)
4. **Layer 4 confirmed defects:** D.2 (1) + D.4 variant (1) + D.12 (all 6 samples) + D.9 variant REVIEW (12) + D.10 REVIEW (1)

## What the Spec correctly allowed (Layer 5 + Layer 6 PASS)

- ✓ Sample Library NOT forced into Decision Environment grammar
- ✓ `.page-hero` (single-column) accepted
- ✓ Custom `.brief-frame` + `.evidence-box` system accepted as evidence-first card pattern (v4 rule)
- ✓ `.cx` hover theatrics correctly absent
- ✓ Zero ambient motion correct for Inspection
- ✓ Active nav state on Experience dropdown CORRECT
- ✓ D.10 confirmed NOT present as product-name use (but H1 ambiguity → REVIEW)
- ✓ D.11 (non-canonical hex) ABSENT — cleanest token usage alongside Developer
- ✓ D.13 ("24/7") ABSENT
- ✓ Illustrative disclaimer coverage is the STRONGEST in the product family (24 instances)
- ✓ Evidence/Analysis boundary is the STRONGEST in the product family (Derived/Not inferred/Validation labels per sample)

**The Spec v4 works.** The FAIL is due to genuine defects (D.2, D.4 variant, D.12) + 2 REVIEW items (D.9 variant, D.10 ambiguity), not Spec over-constraint.

---

# PART 7 — NEW DEFECT VARIANTS + SPEC V5 RECOMMENDATIONS

## D.4 variant — "Audit Ready" (without hyphen)

The Spec v4 Layer 1.9 forbids "audit-ready" / "Audit-Ready" (with hyphen). Sample Library uses "Audit Ready" (without hyphen) at line 316. This is the **same semantic meaning** — a status badge claiming audit readiness.

**Spec v5 recommendation:** Expand D.4 to cover all hyphenation variants: "audit-ready" / "Audit-Ready" / "Audit Ready" / "audit ready". The FORBID rule applies to the concept, not the hyphenation.

## D.9 variant — "Extraction Confidence"

The Spec v4 Layer 1.9 forbids "confidence score" / "confidence scored". Sample Library uses "Extraction Confidence" (12 instances) as a metadata field showing percentage values (97%, 98%, 99%, 97.4%).

**Judgment call:** "Extraction Confidence" is not the exact phrase "confidence score", but it uses "confidence" in a scoring context (percentage values). However, it's explicitly marked "(illustrative)" on every instance, and it's structurally similar to "Source Tier" (also a metadata field, also acceptable).

**Spec v5 recommendation:** Add "Extraction Confidence" as a **REVIEW** item in Layer 1.9 — not auto-FORBID, but flag for team decision. The team must determine whether "Extraction Confidence" is:
- (a) A D.9 variant → FORBID, replace with "Verification Tier"
- (b) Acceptable metadata → KEEP, but ensure "(illustrative)" disclaimer is always present

## D.10 ambiguity — "Institutional Intelligence" in H1

Line 254: H1 headline "Institutional Intelligence Outputs". This could be read as:
- (a) "Outputs of institutional intelligence" (descriptive adjective) → acceptable
- (b) "Institutional Intelligence" (product name) + "Outputs" → D.10 violation

**Spec v5 recommendation:** No Spec change needed. This is a page-specific REVIEW item. Recommend softening the H1 to "Sample Intelligence Outputs" or "Institutional Sample Outputs" to remove ambiguity.

## Spec v5 summary

| Update | Layer | Detail |
|---|---|---|
| **Expand D.4 to cover hyphenation variants** | Layer 1.9 | Add "Audit Ready" (without hyphen) to forbidden phrases. FORBID applies to the concept, not the hyphenation. |
| **Add "Extraction Confidence" as REVIEW** | Layer 1.9 | Not auto-FORBID. Flag for team decision: is it a D.9 variant or acceptable metadata? If acceptable, "(illustrative)" disclaimer must always be present. |
| **D.10 H1 ambiguity** | No Spec change | Page-specific REVIEW. Recommend softening H1 to remove "Institutional Intelligence" ambiguity. |
| **Sample Library UX test** | Layer 6.3 | Add to UX acceptance table: `Sample Output → Evidence Chain → Reasoning/Validation Boundary → Product Cross-Link` |

---

# PART 8 — CROSS-REPORT COMPARISON

## Sample Library vs Prior Explorer Pages (Delta 07 + 08 + 09)

| Aspect | Evidence Explorer (07) | Source Explorer (08) | Sample Library (09) |
|---|---|---|---|
| Lines | 1560 | 1679 | 1076 |
| Sections | 15 | 6 | **3** (fewest) |
| Function | Evidence inspector | Source registry browser | **Sample output gallery** |
| UX test chain | Source → Document → Evidence → Provenance → Context | Source → Identity → Jurisdiction → Type → Monitoring Status → Official Domain | **Sample Output → Evidence Chain → Reasoning/Validation → Product Cross-Link** |
| D.2 (old-gold rgba) | 3 | 2 | **1** (fewest) |
| D.4 (Audit-Ready) | 2 | 0 | **1 (variant: "Audit Ready" without hyphen)** |
| D.9 (confidence) | 3 | 0 | **12 (variant: "Extraction Confidence")** |
| D.10 (old taxonomy) | 1 (confirmed) | 0 (clean) | **0 (REVIEW: H1 ambiguity)** |
| D.11 (non-canonical hex) | 0 | 3 values, ~8 instances | **0** (cleanest) |
| D.12 (no source links) | 0 (has 6 links) | 1 (0 links) | **1 (0 links)** |
| D.13 ("24/7") | 0 | 1 (REVIEW) | **0** |
| External source links | 6 | 0 | **0** |
| Illustrative disclaimers | moderate | moderate | **24 (strongest)** |
| Evidence/Analysis boundary | present | N/A | **strongest (Derived/Not inferred/Validation per sample)** |
| Acceptance verdict | FAIL | FAIL | **FAIL** |

## Key Insights

### 1. Each Explorer has its own defect profile — confirmed again
- Evidence Explorer: D.2 + D.4 + D.9 + D.10
- Source Explorer: D.2 + D.8 + D.11 + D.12 + D.13
- Sample Library: D.2 + D.4 variant + D.9 variant + D.12

**No two Explorer pages share the same defect combination.** Page-by-page audits remain essential.

### 2. Sample Library has the strongest illustrative framing
24 "illustrative" instances — more than any other page. Every evidence value, every confidence percentage, every governance state is explicitly marked illustrative.

### 3. Sample Library has the strongest evidence/analysis boundary
Each of 6 samples has a "Reasoning & Validation" block with three explicit labels: "Derived" / "Not inferred" / "Validation". This is the most structured evidence/analysis separation in the product family.

### 4. D.4 and D.9 have hyphenation/word-form variants
Sample Library introduces "Audit Ready" (without hyphen) and "Extraction Confidence" (different phrase using "confidence"). The Spec must cover concept variants, not just exact phrases.

### 5. D.12 (no source links) is now confirmed across 2 of 3 Explorers
Source Explorer and Sample Library both have zero external source links. Only Evidence Explorer has direct links. This suggests D.12 may be a pattern across non-Evidence-Explorer pages — but each page should still be audited individually.

### 6. D.10 is confirmed NOT system-wide — third clean page
Sample Library (like Source Explorer) has no D.10 product-name taxonomy violation. The H1 "Institutional Intelligence Outputs" is REVIEW (ambiguous adjective use), not a confirmed D.10. This further confirms D.10 was specific to Evidence Explorer.

---

# PART 9 — RECOMMENDED FIXES

## P1 — Technical Repairs (~5 minutes)

| Step | Fix | Lines | Effort |
|---|---|---|---|
| 9.1 | REPAIR D.2 — replace 1 old-gold rgba with `rgba(227, 180, 90, ...)` | 142 | ~1 min |
| 9.2 | REPAIR D.4 variant — replace "Audit Ready" with "Evidence-Linked" | 316 | ~1 min |
| 9.3 | REPAIR D.12 — add `<a href>` to each sample's "Source" and "Document" evidence-row values | 6 samples × 2 fields = 12 links | ~3 min |

## P3 — Content Review

| Step | Fix | Lines | Effort |
|---|---|---|---|
| 9.4 | REVIEW D.9 variant — determine if "Extraction Confidence" is FORBID or acceptable. If FORBID, replace with "Verification Tier" across 12 instances. | 288–901 | Spec v5 decision |
| 9.5 | REVIEW D.10 ambiguity — soften H1 "Institutional Intelligence Outputs" to "Sample Intelligence Outputs" or similar | 254 | ~1 min |

---

*End of Delta Report 09. Spec v4 tested on third Inspection page — works correctly. 2 new defect variants discovered (D.4 hyphenation, D.9 phrase variant). D.10 confirmed NOT system-wide (third clean page). D.12 confirmed across 2 of 3 Explorers. Spec v5 recommended to cover concept variants + add Sample Library UX test.*

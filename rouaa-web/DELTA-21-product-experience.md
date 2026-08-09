# Delta Report 21 — `product-experience.html` vs Product Family Consolidation Spec v6

> **Status:** Experience / Product Experience Center test. Tests Spec v6 against a visualization / demo page that shows how one governed Intelligence Object flows through 4 decision environments + 1 integration layer.
> **Audited file:** `/home/z/my-project/rouaa-corporate/rouaa-web/product-experience.html` (1144 lines — largest audited page so far)
> **Reference:** `PRODUCT-FAMILY-CONSOLIDATION-SPEC.md` v6 (commit `d60ec70`)
> **Method:** No code modification. Full cumulative audit across ALL implementation layers (HTML + inline styles + inline `<style>` block + JS content strings + content claims).
> **Acceptance Verdict:** **FAIL** — 3 confirmed defect types (D.2 × 1, D.10 × 2, D.11 × 15) + 1 forbidden-phrase-variant ("verified Intelligence Object" × 4) + 1 D.9 REVIEW (acceptable, illustrative).

---

## PART 0 — PRODUCT EXPERIENCE'S ACTUAL INSTITUTIONAL FUNCTION

Product Experience is an **Experience / Visualization page** — it shows how one governed Intelligence Object (an FOMC Rate Decision) flows through four decision environments (Investment, Risk, Market & Trading, Media) and one integration layer (Developer Platform). Its function is explicitly NOT a product page, NOT a terminal demo, NOT a live dashboard — it is an **illustrative representation** of how the same governed truth is consumed differently across institutional workflows.

The page's defining claim — "ROUA is not a product suite. It is evidence infrastructure that produces governed, evidence-linked Intelligence Objects" — positions it as the **architectural-narrative visualization page**: institutions can see the "one object, five outputs" pattern that distinguishes ROUA from a product suite.

### Inferred UX Test for Product Experience

**Can the institutional buyer quickly see that ROUA produces ONE governed intelligence object consumed by FIVE different workflows (4 decision environments + 1 integration layer) — all carrying the same evidence chain — without being misled into thinking this is a live product demo?**

Chain: `Hero (one object, five outputs) → What This Is Not (not a terminal) → One Object visualization → Intelligence Object Journey (4 stages) → Environment 01 Investment → Environment 02 Market & Trading → Environment 03 Risk → Environment 04 Media → Integration Layer Developer Platform → Deployment Models → Explore the Experience (cross-nav) → CTA`

### Page Structure (12 sections)

1. **Page Hero** — "One governed intelligence object. Four decision environments. One integration layer." — with explicit illustrative disclaimer (line 402)
2. **What This Is Not** — "ROUA is not another destination terminal"
3. **One Object, Four Environments + One Integration Layer** — central visualization: source object + 5 output cards (4 environments + 1 integration layer)
4. **The Intelligence Object Journey** — 4-stage flow: Institutional Question → Evidence Found → Intelligence Object → Defensible Decision
5. **Environment 01 · Investment Decision Intelligence** — question + object + output summary + evidence trace path + compact interface snapshot
6. **Environment 02 · Market & Trading Intelligence** — same pattern
7. **Environment 03 · Risk Decision Intelligence** — same pattern
8. **Environment 04 · Financial Media Intelligence** — same pattern + media value chain (4 stages)
9. **Integration Layer · Developer Platform** — same pattern + distribution methods
10. **Deployment Models** — 4 cards: Cloud / Private Cloud / Enterprise Deployment / API Integration
11. **Explore the Experience** — cross-navigation to Evidence Explorer / Sample Library / Source Registry Explorer
12. **CTA** — Request Institutional Briefing

---

## PART 1 — STRUCTURAL FACTS

### 1.1 CSS / JS Stack

| Component | Loaded | Notes |
|---|---|---|
| `roua-v7.css` | ✓ | Canonical design system |
| `roua-v7-patch.css` | ✓ | Patch layer |
| `styles.css` | ✗ NOT loaded | ✓ |
| **Inline `<style>` block** | ✓ PRESENT (lines 13–287, ~274 lines) | Defines mockup-specific styles: `.mockup-frame`, `.mockup-titlebar`, `.mockup-dot`, `.dash-grid`, `.dash-sidebar`, `.event-item`, `.evidence-chain`, `.chart-placeholder`, `.product-tabs`, `.concept-badge`. **NOT a D.1 dead block** — all classes are referenced in the page body. However, the inline block defines `.mockup-dot.red/yellow/green` classes (lines 35–37) that are NEVER used in the page body — the body uses raw hex instead (D.11 violation, see below). |
| `main.js` | ✓ | Nav behavior |
| `design-system/roua-v7.js` | ✓ | v7 enhancements |
| **External JS data files** | ✗ ABSENT | No products.js / catalog-data.js etc. — D.14 N/A |

### 1.2 Token Usage

| Token Family | Usage | Verdict |
|---|---|---|
| `--roua-*` aliases | Extensive use throughout (text-primary, text-secondary, text-muted, surface, surface-border, surface-border-strong, bg-secondary, bg-tertiary, accent, accent-subtle, accent-border, red, amber, green, blue, blue-subtle, green-subtle, border, radius-sm, radius-md, radius-lg, radius-full, transition-base, transition-fast, font-mono, tracking-wider) | ✓ Correct — broadest token vocabulary of any audited page |
| `var(--gold)` direct (D.6) | **0 instances** | ✓ **D.6 absent** — fifth page with zero D.6 |
| `rgba(201, 162, 39, ...)` (OLD gold, D.2) | **1 instance** | ✗ **D.2 PRESENT** — line 237 |
| Raw hex values (D.7) | **0 instances** of deprecated VISUAL-IDENTITY hex | ✓ D.7 absent |
| Non-canonical hex (D.11) | **15 instances** (5 groups of 3: `#E5484D`, `#F5A623`, `#20A878`) | ✗ **D.11 PRESENT** — see details below |

**Token verdict: FAIL.** Zero D.6, D.7 — but **1 D.2 + 15 D.11 violations**. The D.11 violations are especially notable because the inline `<style>` block defines the canonical token-based classes (`.mockup-dot.red/yellow/green` → `var(--roua-red/amber/green)`) but the page body uses raw hex instead of those classes.

### 1.3 Page Structure

```
Navigation (lines 293–382)
1. Page Hero — .page-hero (lines 384–405)
2. What This Is Not — disclaimer card (lines 407–421)
3. One Object, Four Environments + One Integration Layer (lines 423–535)
4. The Intelligence Object Journey — 4 stages (lines 537–595)
5. Environment 01 · Investment (lines 597–672)
6. Environment 02 · Market & Trading (lines 674–748)
7. Environment 03 · Risk (lines 750–823)
8. Environment 04 · Financial Media (lines 825–925)
9. Integration Layer · Developer Platform (lines 927–1002)
10. Deployment Models — 4 cards (lines 1004–1031)
11. Explore the Experience — cross-nav 3 cards (lines 1034–1064)
12. CTA (lines 1066–1082)
Footer (lines 1084–1139)
```

- `<section>` count: **12**
- `<div>` balance: 285 / 285 ✓ PASS
- `<section>` balance: 12 / 12 ✓ PASS
- HTML comment balance: 39 / 39 ✓ PASS

### 1.4 HTML Integrity — ALL PASS

| Check | Result |
|---|---|
| `<div>` balance | 285 / 285 ✓ PASS |
| `<section>` balance | 12 / 12 ✓ PASS |
| HTML comment balance | 39 / 39 ✓ PASS |
| Broken internal anchors | None ✓ (no `href="#..."` internal anchors; section IDs exist for `data-environment` reference, not anchor navigation) |
| Dead `<style>` block (D.1) | ✗ ABSENT — inline `<style>` is LIVE (all classes referenced in body) |
| Malformed comment (D.3) | ✗ ABSENT |

### 1.5 Unique Structural Elements

- **Active nav state** on Experience dropdown (line 348) — correct (Product Experience Center is under Experience)
- **Central "One Object → Five Outputs" visualization** (lines 440–519) — unique architectural-narrative artifact. No other audited page visualizes the one-object-five-outputs pattern.
- **Intelligence Object Journey** (lines 551–591) — 4-stage flow: Institutional Question → Evidence Found → Intelligence Object (turning point, highlighted) → Defensible Decision. Unique journey visualization.
- **Per-environment standard pattern** (5 environments × ~5 sub-blocks each) — each environment has: Institutional Question + Object Consumed + Output summary + Evidence Trace Path + Compact Interface Snapshot + CTA. **Most rigorous structural consistency of any audited page.**
- **Standardized Evidence Trace Path** (lines 629–643, 705–719, 781–795, 883–897, 960–974) — visual chain: `Federal Reserve (source) → FOMC Statement (document) → p.1 §2 (evidence) → FOMC Rate Decision (object) → [Output]`. Same 5-step chain repeated in all 5 environments. **Strongest evidence-chain visualization pattern on the audited site.**
- **Compact Interface Snapshot** (5 instances, lines 645–665, 721–741, 797–817, 899–919, 976–996) — each environment has a mockup "window" with macOS-style dots + 3 metadata cells + EVIDENCE footer. All marked "Illustrative Interface".
- **Media Value Chain** (lines 847–872) — 4-stage flow unique to Environment 04: Raw Financial Event → Verified Story Object → Editorial Publication → Audit Evidence
- **Deployment Models** (lines 1012–1029) — 4 cards: Cloud / Private Cloud / Enterprise Deployment / API Integration
- **Illustrative disclaimer in hero** (line 402): "Illustrative representation of ROUA decision environments. In a deployed environment, these workflows can connect to your sources, systems, and evidence infrastructure."

---

## PART 2 — ACCEPTANCE CONTRACT EVALUATION (Spec v6)

### Layer 1 — Canonical Baseline

#### 1.1 Token System — **FAIL (D.2 + D.11)**

Zero D.6, D.7 — fifth page with fully clean direct-token usage. **But 1 D.2 violation + 15 D.11 violations**.

**D.2 violation (1 instance):**

| # | Line | Context | Exact RGBA |
|---|---|---|---|
| 1 | 237 | `.chart-placeholder::before` background gradient (inline `<style>` block) | `linear-gradient(180deg, transparent, rgba(201, 162, 39, 0.12))` |

Should use canonical `rgba(227, 180, 90, 0.12)`.

**D.11 violations (15 instances, 5 groups of 3):**

| Group | Lines | Context | Hex values |
|---|---|---|---|
| 1 | 648–650 | Environment 01 (Investment) Compact Interface Snapshot — macOS-style window dots | `#E5484D`, `#F5A623`, `#20A878` |
| 2 | 724–726 | Environment 02 (Market & Trading) Compact Interface Snapshot | `#E5484D`, `#F5A623`, `#20A878` |
| 3 | 800–802 | Environment 03 (Risk) Compact Interface Snapshot | `#E5484D`, `#F5A623`, `#20A878` |
| 4 | 902–904 | Environment 04 (Media) Compact Interface Snapshot | `#E5484D`, `#F5A623`, `#20A878` |
| 5 | 979–981 | Integration Layer (Developer) Compact Interface Snapshot | `#E5484D`, `#F5A623`, `#20A878` |

All 15 instances should use the canonical token-based classes already defined in the inline `<style>` block (lines 35–37):
- `#E5484D` → `var(--roua-red)` (via `.mockup-dot.red`)
- `#F5A623` → `var(--roua-amber)` (via `.mockup-dot.yellow`)
- `#20A878` → `var(--roua-green)` (via `.mockup-dot.green`)

The inline `<style>` block defines the correct classes but the page body bypasses them with raw hex. **This is the clearest D.11 violation pattern on the audited site** — the canonical replacement already exists in the same file but is not used.

#### 1.2 Container & Layout — **PASS**
#### 1.3 Navigation — **PASS** (active nav on Experience, 6-link Products, 7-link Solutions, 4-link Experience, mobile hamburger)
#### 1.4 Buttons — **PASS**
#### 1.5 Footer — **PASS** (1 brand + 5 footer-col = 6 total, no Channels column)
#### 1.6 Card Hierarchy — **PASS** (uses `.card`, `.btn`, `.eyebrow`, `.section-header`, `.cta-section`, `.cta-buttons` — all canonical v7 components)
#### 1.7 Motion — **PASS** (zero ambient motion — no canvas, no Three.js, no GSAP; the `.pulse-dot` class is referenced once on line 449 but is defined in v7-patch.css, not a page-level animation)
#### 1.8 Typography — **PASS**

#### 1.9 Trust Grammar (Forbidden Phrases)

| Phrase | Count | Verdict |
|---|---|---|
| "within seconds" / "in seconds" | 0 | ✓ PASS |
| "real-time" / "real time" | 0 | ✓ PASS |
| "instantly" / "instant" | 0 | ✓ PASS |
| "every claim" | 0 | ✓ PASS |
| "audit-ready" / "Audit-Ready" / "Audit Ready" (D.4) | 0 | ✓ PASS |
| "Trust Promise" | 0 | ✓ PASS |
| "Provenance Immutability" | 0 | ✓ PASS |
| "confidence score" / "confidence scored" (D.9 FORBID) | 0 | ✓ PASS |
| "Confidence Scoring" (D.9 REVIEW leans FORBID) | 0 | ✓ PASS |
| "Extraction Confidence" (D.9 REVIEW, illustrative ok) | **1 instance** (line 462) | ⚠ **REVIEW — ACCEPTABLE** (marked "illustrative metric" on line 463, immediately adjacent) |
| "SOC 2" / "ISO 27001" | 0 | ✓ PASS |
| "24/7" | 0 | ✓ PASS |
| "continuously monitored" / "monitored continuously" | 0 | ✓ PASS |
| Competitor naming (Bloomberg / Reuters / Market Terminals / FactSet / Refinitiv) | 0 | ✓ PASS |
| **"VERIFIED INTELLIGENCE OBJECT" (FORBID)** | **0 exact-match** | — |
| **"verified Intelligence Object" (case variant of FORBID)** | **4 instances** (lines 662, 738, 814, 916) | ✗ **FAIL — forbidden-phrase variant** (see analysis below) |
| "live briefing" (line 1071) | 1 | ✓ ACCEPTABLE — status-truth language (per Delta 20 clarification), not timing claim |

**"verified Intelligence Object" analysis (4 instances):**

| Line | Text | Context |
|---|---|---|
| 662 | "Every field traces back to the verified Intelligence Object." | Environment 01 (Investment) Compact Interface Snapshot — EVIDENCE footer |
| 738 | "Every market assessment traces back to the verified Intelligence Object." | Environment 02 (Market & Trading) Compact Interface Snapshot — EVIDENCE footer |
| 814 | "Every risk assessment traces back to the verified Intelligence Object." | Environment 03 (Risk) Compact Interface Snapshot — EVIDENCE footer |
| 916 | "Every published story traces back to the verified Intelligence Object." | Environment 04 (Media) Compact Interface Snapshot — EVIDENCE footer |

**Classification:**

The Spec Layer 1.9 FORBID list includes "VERIFIED INTELLIGENCE OBJECT" (all caps as exact phrase). The canonical replacement is "Governed Intelligence Object" — used correctly elsewhere on this page (lines 440 comment, 388 hero "governed, evidence-linked Intelligence Objects", 578 "Every decision environment consumes it", etc.).

The 4 instances use "verified Intelligence Object" (sentence case, lowercase 'v'). Per the Spec's pattern of treating case variants as violations (D.4 precedent: "Audit Ready" / "Audit-Ready" / "audit-ready" all flagged), the concept-based interpretation applies. "Verified Intelligence Object" is the same concept as "VERIFIED INTELLIGENCE OBJECT" — using "verified" as an adjective for Intelligence Object contradicts the canonical "Governed Intelligence Object" terminology.

**Verdict: FORBID violation (4 instances).** Should be replaced with "Governed Intelligence Object" to align with canonical terminology. This is NOT a new D.15+ defect type — it is a case variant of the existing "VERIFIED INTELLIGENCE OBJECT" FORBID rule, classified consistently with how D.4 case variants are handled.

**D.9 "Extraction Confidence" analysis (1 instance, line 462):**

```html
Extraction confidence: <span style="color: var(--roua-accent); font-weight: 700;">97.4%</span>
<span style="opacity: 0.6;">&middot; illustrative metric</span>
```

**Verdict: REVIEW — ACCEPTABLE.** Marked "illustrative metric" immediately adjacent (line 463). Per Spec D.9 rule ("Extraction Confidence — REVIEW, illustrative ok"), this is the acceptable illustrative pattern. The page also marks the Intelligence Object ID as "illustrative example" (line 446), the Object Consumed IDs as "illustrative" (lines 615, 692, 768, 843), and the hero as "Illustrative representation" (line 402) — consistent illustrative framing throughout.

#### 1.10 Taxonomy (Full Content Scan)

| Old term | Count | Context | Verdict |
|---|---|---|---|
| "Trading Intelligence" (alone, as product/page name) | **1 instance** (line 744) | CTA button: `<a href="trading-platform.html">View Trading Intelligence Page →</a>` | ✗ **D.10 VIOLATION** — uses old taxonomy "Trading Intelligence" alone as page label. The trading-platform.html solution page is named "Trading Desks" in nav (line 338). The canonical product name is "Market & Trading Intelligence". Should be "View Market & Trading Intelligence Page →" or "View Trading Desks Page →". |
| "Institutional Intelligence" (alone, as product/page name) | **1 instance** (line 668) | CTA button: `<a href="financial-intelligence.html">View Institutional Intelligence →</a>` | ✗ **D.10 VIOLATION** — uses old taxonomy "Institutional Intelligence" alone as page label. The financial-intelligence.html solution page is named "Investment Firms" in nav (line 339). Should be "View Investment Firms Page →" or "View Investment Intelligence Page →". |
| "Market & Trading Intelligence" | 4 (lines 308, 678, 679, 1096) | Nav + section eyebrow + section H2 + footer | ✓ PASS — canonical product name (per Spec taxonomy, NOT D.10) |
| "institutional intelligence products" (lowercase) | 2 (lines 1090, 1136) | Footer brand description + copyright tagline | ✓ PASS — descriptive adjective use, NOT product name (per v5: descriptive = NOT D.10) |
| "Developer APIs" | 0 | — | ✓ PASS |
| "TRADING INTELLIGENCE" (line 674, HTML comment) | 1 | Section comment marker | ✓ PASS — comment, not visible content |

**Layer 1.10 verdict: FAIL** — 2 D.10 violations (lines 668, 744). Both are CTA button labels using old taxonomy terms as standalone page names.

### Layer 1 Overall Verdict: **FAIL**

4 confirmed/review-level issues:
1. D.2 violation (1 instance, line 237) — old-gold `rgba(201, 162, 39, 0.12)` in chart-placeholder gradient
2. D.10 violation (2 instances, lines 668 + 744) — old taxonomy "Institutional Intelligence" and "Trading Intelligence" used as CTA button labels
3. D.11 violation (15 instances, 5 groups of 3) — raw hex `#E5484D` / `#F5A623` / `#20A878` in macOS-style window dots; canonical token-based classes (`.mockup-dot.red/yellow/green`) already defined in inline `<style>` but not used
4. "verified Intelligence Object" FORBID-variant (4 instances, lines 662, 738, 814, 916) — case variant of "VERIFIED INTELLIGENCE OBJECT"; should be "Governed Intelligence Object"

---

### Layer 5 — Do-Not-Touch Rules — **PASS**

Product Experience is NOT forced into Product, Platform, Explorer, Architecture, or Solutions grammar. It has its own visualization-narrative structure (Hero → What This Is Not → One Object → Journey → 5 Environments → Deployment → Cross-nav → CTA). Correct adaptation — the page explicitly disclaims what it is NOT ("ROUA is not another destination terminal", line 413).

### Layer 6 — Product-Experience-Specific Rules

No Spec v6 Product-Experience-specific UX test. Recommend adding:
`Hero (one object, five outputs) → What This Is Not → One Object visualization → Intelligence Object Journey → 5 Environments (each: Question + Object + Output + Evidence Trace + Interface Snapshot + CTA) → Deployment Models → Explore the Experience → CTA`

### UX / Visualization Test

**Does the page help the institutional buyer see that ROUA produces ONE governed intelligence object consumed by FIVE different workflows — all carrying the same evidence chain — without being misled into thinking this is a live product demo?**

✓ **PASS** — The page follows a clear architectural-narrative visualization:

1. **Hero:** "One governed intelligence object. Four decision environments. One integration layer." — with explicit illustrative disclaimer
2. **What This Is Not:** "ROUA is not another destination terminal" — positions page as visualization, not product
3. **One Object visualization:** Central governed object + 5 output cards (4 environments + 1 integration layer) — same FOMC Rate Decision flows to all 5
4. **Intelligence Object Journey:** 4 stages with Object as "turning point" — explains what an Intelligence Object IS
5. **5 Environments (rigorous consistency):** Each has Institutional Question + Object Consumed + Output summary + Evidence Trace Path + Compact Interface Snapshot + CTA. Same 5-step evidence chain in all 5. All marked "Illustrative Interface".
6. **Deployment Models:** 4 cards covering deployment flexibility
7. **Explore the Experience:** Cross-nav to Evidence Explorer / Sample Library / Source Registry Explorer
8. **CTA:** "Not a generic demo. Your domain, your sources, your decision — reconstructed from evidence to conclusion." (line 1074)

The page successfully delivers the one-object-five-outputs visualization with:
- Explicit illustrative disclaimers (hero line 402, each interface snapshot "Illustrative Interface", each object ID "illustrative")
- Consistent 5-step evidence chain across all 5 environments
- Same FOMC Rate Decision (EVT-FOMC-2026-08-001) used as the running example throughout
- Honest "not a live demo" framing

---

## PART 3 — LAYER 4 DEFECT SCAN (D.1–D.14)

| ID | Defect | Present? | Details |
|---|---|---|---|
| D.1 | Dead `<style>` block | ✗ ABSENT | Inline `<style>` (lines 13–287) is LIVE — all classes referenced in body. (Note: `.mockup-dot.red/yellow/green` classes defined but not used — D.11 issue, not D.1) |
| **D.2** | **Old-gold `rgba(201, 162, 39, ...)`** | **✓ PRESENT (1)** | Line 237 — chart-placeholder gradient in inline `<style>` |
| D.3 | Malformed HTML comment | ✗ ABSENT | 39/39 balanced, no nested |
| D.4 | "Audit-Ready" violation | ✗ ABSENT | 0 instances |
| D.5 | Competitor naming | ✗ ABSENT | |
| D.6 | `var(--gold)` mixing | ✗ ABSENT | 0 instances — 5th page with clean D.6 |
| D.7 | Deprecated raw hex | ✗ ABSENT | |
| D.8 | "real time" timing claim | ✗ ABSENT | "live briefing" (line 1071) is status-truth, not timing — ACCEPTABLE per Delta 20 clarification |
| D.8 variant | "continuously monitored" / "24/7" | ✗ ABSENT | |
| D.9 (FORBID) | "confidence score/d" | ✗ ABSENT | 0 instances |
| D.9 (REVIEW leans FORBID) | "Confidence Scoring" | ✗ ABSENT | 0 instances |
| D.9 (REVIEW, illustrative ok) | "Extraction Confidence" | ⚠ 1 instance (line 462) | **ACCEPTABLE** — marked "illustrative metric" immediately adjacent (line 463) |
| **D.10** | **Old taxonomy as product name** | **✓ PRESENT (2)** | Line 668 "View Institutional Intelligence →" + line 744 "View Trading Intelligence Page →" — both CTA buttons use old taxonomy as standalone page labels |
| **D.11** | **Non-canonical raw hex** | **✓ PRESENT (15)** | 5 groups of 3 (`#E5484D` / `#F5A623` / `#20A878`) in 5 Compact Interface Snapshot macOS-style window dots. Canonical token-based classes already defined in inline `<style>` but not used. |
| D.12 | No direct source links | N/A | Product Experience is not an Explorer |
| D.13 | "24/7" timing claim | ✗ ABSENT | |
| D.14 | Timing claims in JS data files | ✗ ABSENT | No external data JS files |
| **(FORBID variant)** | **"verified Intelligence Object"** | **✓ PRESENT (4)** | Lines 662, 738, 814, 916 — case variant of "VERIFIED INTELLIGENCE OBJECT" FORBID phrase. Should be "Governed Intelligence Object". |

**No D.15+ new defect types found.** The "verified Intelligence Object" case variant is classified as a variant of the existing "VERIFIED INTELLIGENCE OBJECT" FORBID rule (consistent with D.4 case-variant handling), NOT a new defect type. Spec v6 sufficient for Product Experience page.

---

## PART 4 — ACCEPTANCE VERDICT

## **FAIL**

Four confirmed/review-level issues:

1. **D.2 violation** (1 instance, line 237) — old-gold `rgba(201, 162, 39, 0.12)` in chart-placeholder gradient (inside inline `<style>` block)
2. **D.10 violation** (2 instances, lines 668 + 744) — CTA buttons use old taxonomy "Institutional Intelligence" and "Trading Intelligence" as standalone page labels. Should use canonical names ("Investment Firms" / "Investment Intelligence" / "Market & Trading Intelligence" / "Trading Desks")
3. **D.11 violation** (15 instances, 5 groups of 3) — raw hex `#E5484D` / `#F5A623` / `#20A878` in macOS-style window dots across 5 Compact Interface Snapshots. Canonical token-based classes (`.mockup-dot.red/yellow/green` → `var(--roua-red/amber/green)`) already defined in inline `<style>` block but not used in body
4. **"verified Intelligence Object" FORBID-variant** (4 instances, lines 662, 738, 814, 916) — case variant of "VERIFIED INTELLIGENCE OBJECT" FORBID phrase. Should be "Governed Intelligence Object" (canonical term, used correctly elsewhere on the same page)

### What's CLEAN

- ✓ Zero D.1 (inline `<style>` is LIVE), D.3, D.4, D.5, D.6, D.7, D.8, D.13, D.14
- ✓ Zero D.6 — **fifth page with fully clean direct-token usage**
- ✓ Zero D.9 FORBID ("confidence score/d") and zero "Confidence Scoring"
- ✓ D.9 "Extraction Confidence" (1 instance, line 462) — ACCEPTABLE (marked illustrative immediately adjacent)
- ✓ All other forbidden phrases (real-time, 24/7, every claim, Trust Promise, Provenance Immutability, SOC 2, ISO 27001, audit-ready, continuously monitored, competitor names) absent
- ✓ HTML integrity ALL PASS (285/285 divs, 12/12 sections, 39/39 comments)
- ✓ Active nav on Experience (correct)
- ✓ No external JS data files (D.14 N/A)
- ✓ No ambient motion (no canvas, no Three.js, no GSAP)
- ✓ **Rigorous per-environment structural consistency** — all 5 environments follow the same 6-block pattern (Question + Object + Output + Evidence Trace + Interface Snapshot + CTA). Strongest structural consistency of any audited page.
- ✓ **Standardized Evidence Trace Path** — same 5-step chain (`Federal Reserve → FOMC Statement → p.1 §2 → FOMC Rate Decision → [Output]`) repeated in all 5 environments. Strongest evidence-chain visualization on the audited site.
- ✓ **Explicit illustrative framing** — hero disclaimer (line 402), each interface snapshot marked "Illustrative Interface", each object ID marked "illustrative", D.9 metric marked "illustrative metric"
- ✓ **Honest "not a live demo" positioning** — "ROUA is not another destination terminal" (line 413), "Not a generic demo" (line 1074)
- ✓ "Governed Intelligence Object" used correctly in hero (line 388), comments (line 440), journey (line 578), and 5 environment headers — the canonical term IS used on this page; only the 4 EVIDENCE footers use the non-canonical "verified Intelligence Object" variant
- ✓ "Versioned Provenance" canonical term pattern respected (no "Provenance Immutability")
- ✓ "Developer Platform is not a decision environment. It is the integration layer" (line 933) — correct canonical taxonomy framing

---

## PART 5 — CROSS-REPORT COMPARISON

| Aspect | Enterprise (12) | Platform (17) | Source Registry (18) | Methodology (19) | Infrastructure (20) | **Product Experience (21)** |
|---|---|---|---|---|---|---|
| Lines | 515 | 718 | 551 | 552 | 596 | **1144** |
| Sections | 10 | 12 | 10 | 12 | 7 | **12** |
| Inline `<style>` | Absent | Present (~78 lines) | Absent | Absent | Absent | **Present (~274 lines, LIVE)** |
| D.2 | 0 | 0 | 0 | 0 | 3 | **1** |
| D.4 | 0 | 0 | 0 | 1 | 0 | **0** |
| D.6 | 0 | 0 | 0 | 18 | 0 | **0** |
| D.8 | 0 | 0 | 0 (REVIEW) | 0 | 0 | **0** |
| D.9 (REVIEW) | 0 | 0 | 0 | 7 (2 FORBID) | 2 (both FORBID) | **1 (acceptable, illustrative)** |
| D.10 | 0 | 0 | 0 | 0 | 0 | **2** |
| D.11 | 0 | 0 | 0 | 0 | 0 | **15** |
| "verified Intelligence Object" (FORBID variant) | 0 | 0 | 0 | 0 | 0 | **4** |
| Total defects | 0 | 0 | 0 (+1 REVIEW) | 2 + 2 REVIEW | 3 + 2 REVIEW | **18 + 4 FORBID-variant + 1 REVIEW** |
| Verdict | **PASS** | **PASS** | **FAIL (borderline)** | **FAIL** | **FAIL** | **FAIL** |

### Key Insights

1. **Product Experience is the LARGEST and MOST DEFECT-DENSE audited page so far** — 1144 lines, 18 confirmed D.2/D.10/D.11 violations + 4 FORBID-variant instances + 1 acceptable REVIEW. This is the first page with 4 distinct defect categories in a single audit.
2. **D.11 appears here for the FIRST time as a major pattern** — 15 instances of raw hex `#E5484D` / `#F5A623` / `#20A878` in macOS-style window dots. The Source Explorer (Delta 8) had D.11 with `#2DBA8E`, but only a few instances. Product Experience's 15 D.11 instances are the highest D.11 count of any audited page.
3. **The D.11 violation is especially notable because the canonical replacement ALREADY EXISTS in the same file** — the inline `<style>` block (lines 35–37) defines `.mockup-dot.red/yellow/green` classes with `var(--roua-red/amber/green)` tokens, but the page body uses raw hex instead of those classes. This is a copy-paste artifact: the mockup-dot classes were defined for an earlier version of the page, but the actual implementation bypassed them with raw hex when building the 5 Compact Interface Snapshots.
4. **D.10 violations are CTA button labels** — "View Institutional Intelligence →" (line 668) and "View Trading Intelligence Page →" (line 744). Both use old taxonomy terms as standalone page names. The target pages (financial-intelligence.html, trading-platform.html) are solution pages named "Investment Firms" and "Trading Desks" in nav. This is a clear D.10 pattern: old taxonomy used as page label, not descriptive adjective.
5. **"verified Intelligence Object" FORBID-variant (4 instances)** — first appearance of this variant on the audited site. The Spec FORBID list has "VERIFIED INTELLIGENCE OBJECT" (all caps); the instances use "verified Intelligence Object" (sentence case). Classified as a case variant of the existing FORBID rule (consistent with D.4 case-variant handling), NOT a new D.15+ defect type. The canonical term "Governed Intelligence Object" IS used correctly elsewhere on the same page — the 4 EVIDENCE footers are the only places using the non-canonical adjective "verified".
6. **Strongest per-environment structural consistency of any audited page** — all 5 environments follow the same 6-block pattern. This is a positive Spec contribution: the per-environment template (Question + Object + Output + Evidence Trace + Interface Snapshot + CTA) could be adopted as a canonical reference pattern for any future multi-environment visualization page.
7. **Standardized Evidence Trace Path** — same 5-step chain repeated in all 5 environments. Strongest evidence-chain visualization on the audited site. Recommend adopting as Spec reference pattern.
8. **D.2 violation is inside the inline `<style>` block** (line 237), not in body inline styles. This is a different D.2 pattern than Infrastructure Report (Delta 20), where D.2 was in body inline gradients. The fix is the same: replace `rgba(201, 162, 39, 0.12)` with `rgba(227, 180, 90, 0.12)`.
9. **"live briefing" (line 1071) — ACCEPTABLE status-truth language** (per Delta 20 clarification). Not a D.8 timing claim.
10. **No D.15+ new defect types found** — Spec v6 sufficient for Product Experience page.

---

## PART 6 — RECOMMENDED FIX

### Phase 1 — Token + Taxonomy Repairs (~12 minutes)

| Step | Fix | Line(s) | Effort |
|---|---|---|---|
| 21.1 | **D.2** — Replace `rgba(201, 162, 39, 0.12)` with `rgba(227, 180, 90, 0.12)` in `.chart-placeholder::before` background gradient | 237 | ~1 min |
| 21.2 | **D.10** — Replace `<a href="financial-intelligence.html">View Institutional Intelligence →</a>` with `<a href="financial-intelligence.html">View Investment Firms →</a>` (matches nav label on line 339) | 668 | ~1 min |
| 21.3 | **D.10** — Replace `<a href="trading-platform.html">View Trading Intelligence Page →</a>` with `<a href="trading-platform.html">View Trading Desks Page →</a>` (matches nav label on line 338) | 744 | ~1 min |
| 21.4 | **D.11** — Replace all 15 raw hex instances with canonical token-based classes. In each of the 5 Compact Interface Snapshots, replace `<span style="...background: #E5484D...">` with `<span class="mockup-dot red">` (and similarly for yellow/green). The classes are already defined in inline `<style>` lines 35–37. Lines: 648–650, 724–726, 800–802, 902–904, 979–981. | (15 lines, 5 groups) | ~5 min (mechanical, 5 snapshots × 3 dots) |
| 21.5 | **"verified Intelligence Object" FORBID-variant** — Replace "verified Intelligence Object" with "Governed Intelligence Object" in all 4 EVIDENCE footers. Lines: 662, 738, 814, 916. | (4 lines) | ~4 min |

### Phase 2 — No REVIEW items requiring team decision

The single D.9 REVIEW instance (line 462, "Extraction confidence: 97.4%") is ACCEPTABLE as illustrative (marked "illustrative metric" immediately adjacent). No team decision required.

**Total Phase 1 repair budget for Product Experience: ~12 minutes.**

If Phase 1 is applied, Product Experience moves from FAIL → PASS.

---

## PART 7 — SPEC v7 INPUT

Product Experience surfaces three items relevant for Spec v7 (do NOT implement now — record for cumulative review after all audits):

1. **"verified Intelligence Object" case-variant clarification for FORBID list** — The Spec Layer 1.9 FORBID list includes "VERIFIED INTELLIGENCE OBJECT" (all caps). Spec v7 should clarify that the rule is concept-based (not case-based), covering all case variants: "VERIFIED INTELLIGENCE OBJECT" / "Verified Intelligence Object" / "verified Intelligence Object" / "verified intelligence object". The canonical replacement is "Governed Intelligence Object". This is consistent with how D.4 case variants are handled.
2. **Per-environment visualization template** (Question + Object + Output + Evidence Trace + Interface Snapshot + CTA) — unique to Product Experience. **Recommend adopting as canonical reference pattern** in Spec v7 Layer 1 (Card Hierarchy or new "Visualization Patterns" subsection) for any future multi-environment visualization page.
3. **Standardized Evidence Trace Path** (5-step chain: Source → Document → Evidence location → Object → Output) — repeated in all 5 environments. **Recommend adopting as canonical reference pattern** in Spec v7 for evidence-chain visualization across multi-output pages.

No other Spec v7 changes triggered by Product Experience. No new defect types (D.15+).

---

*End of Delta Report 21. Product Experience FAILS — 1 D.2 + 2 D.10 + 15 D.11 + 4 "verified Intelligence Object" FORBID-variant + 1 acceptable D.9 REVIEW. Despite the FAIL (highest defect count of any audited page), the page introduces two positive Spec contributions: the per-environment visualization template (6-block pattern × 5 environments) and the Standardized Evidence Trace Path (5-step chain × 5 environments). The D.11 violation is especially notable because the canonical token-based replacement classes already exist in the same file's inline `<style>` block but are not used. No D.15+ new defect types. Spec v6 sufficient. Total Phase 1 repair budget: ~12 minutes.*

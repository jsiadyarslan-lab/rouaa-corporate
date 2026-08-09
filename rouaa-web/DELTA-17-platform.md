# Delta Report 17 — `platform.html` vs Product Family Consolidation Spec v6

> **Status:** Platform Overview category test. Tests Spec v6 against a buyer-level platform narrative page.
> **Audited file:** `/home/z/my-project/rouaa-corporate/rouaa-web/platform.html` (718 lines)
> **Reference:** `PRODUCT-FAMILY-CONSOLIDATION-SPEC.md` v6 (commit `d60ec70`)
> **Method:** No code modification. Full cumulative audit across ALL implementation layers.
> **Acceptance Verdict:** **PASS** — Second page to PASS. Zero D.1–D.14 defects.

---

## PART 0 — PLATFORM OVERVIEW'S ACTUAL INSTITUTIONAL FUNCTION

Platform Overview is a **buyer-level platform narrative page** — it bridges the gap between "why you need ROUA" (Solutions/Why ROUA) and "how it works technically" (Architecture). Its function is:

1. **Scope clarification** — explicitly distinguishes Platform (what/why) from Architecture (how)
2. **Why this platform exists** — institutions rebuild the same pipeline; ROUA builds it once
3. **Platform architecture (buyer-level)** — 7-layer chain with stats, without technical depth
4. **Built today — operational proof** — production metrics, source counts, coverage
5. **Evidence trace demo** — step-by-step trace from source to intelligence output
6. **One platform → multiple applications** — product fan-out
7. **Why not build internally** — 4-card build vs deploy comparison
8. **Deployment models** — 4 deployment options
9. **Production infrastructure** — environment summary
10. **CTA** — Request Platform Briefing

### Inferred UX Test for Platform Overview

**Can the institutional buyer quickly understand what ROUA's platform provides at a buyer level, why they shouldn't rebuild it, and how to deploy it — without needing the technical architecture?**

Chain: `Platform Need → Layer Overview → Operational Proof → Evidence Trace → Product Fan-out → Build vs Deploy → Deployment Model → Briefing Request`

---

## PART 1 — STRUCTURAL FACTS

### 1.1 CSS / JS Stack

| Component | Loaded | Notes |
|---|---|---|
| `roua-v7.css` | ✓ | |
| `roua-v7-patch.css` | ✓ | |
| `styles.css` | ✗ NOT loaded | |
| **Inline `<style>` block** (lines 12–90) | ✓ | Custom design system: `.hero-platform`, `.why-exists`, `.arch-layer`, `.arch-product-chip`, `.why-card`, `.deploy-card`, `.trace-demo`, `.cta-final` — ~78 lines. NOT dead code. |
| `main.js` | ✓ | |
| `design-system/roua-v7.js` | ✓ | |
| **External JS data files** | ✗ ABSENT | |

### 1.2 Token Usage

| Token Family | Usage | Verdict |
|---|---|---|
| `--roua-*` aliases | Used throughout | ✓ Correct |
| `var(--gold)` direct (D.6) | **0 instances** | ✓ D.6 absent |
| `rgba(201, 162, 39, ...)` (OLD gold, D.2) | **0 instances** | ✓ **D.2 ABSENT** |
| Raw hex values | **1: `#05070D`** (line 7, `<meta name="theme-color">`) | ✓ Acceptable (meta theme-color exception) |
| `rgba(227, 180, 90, ...)` (CORRECT gold) | **1 instance** (line 216) | ✓ Correct gold used |
| Non-canonical hex (D.11) | **0 instances** | ✓ D.11 absent |

**Token verdict: CLEAN.** Zero D.2, D.6, D.7, D.11. Uses canonical `rgba(227, 180, 90, ...)` correctly.

### 1.3 Page Structure

```
Navigation (lines 98–185)
1. Hero — .hero-platform (lines 189–211)
2. Scope: Platform vs Architecture (lines 213–233)
3. Why This Platform Exists (lines 235–273)
4. Platform Architecture — buyer-level (lines 301–385)
5. Built Today — Operational Proof (lines 387–446)
6. Evidence Trace Demo (lines 448–492)
7. One Platform → Multiple Applications (lines 494–530)
8. Why Not Build Internally (lines 532–566)
9. Deployment (lines 568–596)
10. Production Infrastructure (lines 598–629)
11. CTA (lines 631–645)
Footer (lines 647–718)
```

- `<section>` count: **12**
- `<div>` balance: 245 / 245 ✓ PASS
- `<section>` balance: 12 / 12 ✓ PASS
- HTML comment balance: 20 / 20 ✓ PASS

### 1.4 HTML Integrity — ALL PASS

| Check | Result |
|---|---|
| `<div>` balance | 245 / 245 ✓ PASS |
| `<section>` balance | 12 / 12 ✓ PASS |
| HTML comment balance | 20 / 20 ✓ PASS |
| Broken internal anchors | None ✓ |
| Dead `<style>` block (D.1) | ✗ ABSENT — inline `<style>` is the page's design system |

### 1.5 Unique Structural Elements

- **`.skip-link`** present (line 96) — accessibility feature (like Developer)
- **Active nav state** on Platform dropdown (line 120) — correct
- **Custom `.hero-platform`** Hero (not `.page-hero` or `.hero-split`) — unique centered Hero with platform bg
- **7-layer `.arch-layer` chain** — buyer-level architecture visualization with per-layer color coding
- **`.trace-demo`** — step-by-step evidence trace with timestamps
- **Explicit Platform vs Architecture scope clarification** — "This page is why you need ROUA and what you get. Architecture is how it works inside."

---

## PART 2 — ACCEPTANCE CONTRACT EVALUATION (Spec v6)

### Layer 1 — Canonical Baseline

#### 1.1 Token System — **PASS**

Zero D.2, D.6, D.7, D.11. Uses canonical `rgba(227, 180, 90, ...)` (line 216). Raw hex `#05070D` only in `<meta name="theme-color">` (acceptable exception).

#### 1.2 Container & Layout — **PASS**
#### 1.3 Navigation — **PASS** (active nav on Platform, 6-link Products, 7-link Solutions, mobile hamburger, `.skip-link` present)
#### 1.4 Buttons — **PASS**
#### 1.5 Footer — **PASS** (1 brand + 5 footer-col = 6 total, no Channels)
#### 1.6 Card Hierarchy — **PASS** (uses custom `.why-card`, `.deploy-card` with CSS transitions, no `.cx`, no `.card-accent`)
#### 1.7 Motion — **PASS** (zero ambient motion, only CSS border-color transitions on hover)
#### 1.8 Typography — **PASS**

#### 1.9 Trust Grammar (Forbidden Phrases)

| Phrase | Count | Verdict |
|---|---|---|
| "audit-ready" / "Audit-Ready" / "Audit Ready" | 0 | ✓ PASS |
| "within seconds" / "in seconds" | 0 | ✓ PASS |
| "real-time" / "real time" | 0 | ✓ PASS |
| "instantly" / "instant" | 0 | ✓ PASS |
| "continuously monitored" | 0 | ✓ PASS |
| "every claim" | 0 | ✓ PASS |
| "VERIFIED INTELLIGENCE OBJECT" | 0 | ✓ PASS |
| "Trust Promise" | 0 | ✓ PASS |
| "Provenance Immutability" | 0 | ✓ PASS |
| "confidence score" / "confidence scored" | 0 | ✓ PASS |
| "Confidence Scoring" | 0 | ✓ PASS |
| "Extraction Confidence" | 0 | ✓ PASS |
| "SOC 2" / "ISO 27001" | 0 | ✓ PASS |
| "24/7" | 0 | ✓ PASS |

**Layer 1.9 verdict: PASS** — Zero forbidden phrases. Cleanest Trust Grammar alongside Enterprise and Developer.

**Note on "Continuously updated" (line 268):** "Production Metrics · Continuously updated" — this is NOT "continuously monitored" (which is D.8 FORBID). "Continuously updated" describes the metrics display, not a monitoring claim. **Acceptable.**

#### 1.10 Taxonomy (Full Content Scan)

| Old term | Count | Context | Verdict |
|---|---|---|---|
| "Trading Intelligence" (alone) | 0 | — | ✓ PASS |
| "Institutional Intelligence" | 4 (lines 8, 295, 653, 697) | Title tag, body text, footer brand — all descriptive adjective use | ✓ PASS (per v5: descriptive = NOT D.10) |
| "Developer Intelligence" | 0 | — | ✓ PASS |
| "Developer APIs" | 0 | — | ✓ PASS |
| "Market Intelligence" (alone as product) | 0 | — | ✓ PASS |

**Layer 1.10 verdict: PASS** — Zero D.10.

### Layer 1 Overall Verdict: **PASS**

---

### Layer 5 — Do-Not-Touch Rules — **PASS**

Platform Overview is NOT forced into Product, Explorer, Architecture, or Solutions grammar. It has its own buyer-level platform narrative structure. Correct adaptation.

### Layer 6 — Platform-Specific Rules

No Spec v6 Platform-specific UX test. Recommend adding:
`Platform Need → Layer Overview → Operational Proof → Evidence Trace → Product Fan-out → Build vs Deploy → Deployment Model → Briefing Request`

### UX / Buyer-Level Platform Test

**Does the page help the institutional buyer understand what ROUA's platform provides without needing the technical architecture?**

✓ **PASS** — The page explicitly clarifies its scope: "This page is why you need ROUA and what you get. Architecture is how it works inside." It provides:
1. **Buyer-level 7-layer overview** with per-layer stats (not technical depth)
2. **Operational proof** (production metrics, source counts)
3. **Evidence trace demo** (step-by-step from source to output with timestamps)
4. **Product fan-out** (one platform → multiple products)
5. **Build vs deploy** comparison
6. **Deployment models**

---

## PART 3 — LAYER 4 DEFECT SCAN (D.1–D.14)

| ID | Defect | Present? | Details |
|---|---|---|---|
| D.1 | Dead `<style>` block | ✗ ABSENT | Inline `<style>` is the page's design system |
| D.2 | Old-gold `rgba(201, 162, 39, ...)` | ✗ **ABSENT** | 0 instances — uses canonical `rgba(227, 180, 90, ...)` |
| D.3 | Malformed HTML comment | ✗ ABSENT | 20/20 PASS |
| D.4 | "Audit-Ready" violation | ✗ ABSENT | 0 instances |
| D.5 | Competitor naming | ✗ ABSENT | 0 instances |
| D.6 | `var(--gold)` mixing | ✗ ABSENT | 0 instances |
| D.7 | Deprecated raw hex | ✗ ABSENT | 0 instances (only `#05070D` in meta theme-color — acceptable) |
| D.8 | "real time" timing claim | ✗ ABSENT | 0 instances |
| D.9 | "confidence score/d" / "Confidence Scoring" | ✗ ABSENT | 0 instances |
| D.10 | Old taxonomy as product name | ✗ ABSENT | 0 instances |
| D.11 | Non-canonical raw hex | ✗ ABSENT | 0 instances |
| D.12 | No direct source links | N/A | Platform is not an Explorer |
| D.13 | "24/7" timing claim | ✗ ABSENT | 0 instances |
| D.14 | Timing claims in JS data files | ✗ ABSENT | No external JS |

**Zero D.1–D.14 defects. No D.15+ new defect types.**

---

## PART 4 — ACCEPTANCE VERDICT

## **PASS**

**This is the SECOND page to PASS the Acceptance Contract** (after Enterprise).

A page PASSES acceptance when:
- ✓ All Layer 1 rules satisfied across ALL implementation layers — **PASS**
- ✓ Zero Layer 5 do-not-touch violations — **PASS**
- ✓ Layer 6 category-specific rules satisfied — **PASS**
- ✓ Zero D.1–D.14 defects — **PASS**

### What makes Platform PASS?

| Factor | Platform | Why it passes |
|---|---|---|
| Token usage | Zero D.2, D.6, D.7, D.11 | Uses canonical `rgba(227, 180, 90, ...)` correctly |
| Trust Grammar | Zero forbidden phrases | No "Audit-Ready", no "confidence scoring", no "real time" |
| Taxonomy | Zero D.10 | "Institutional Intelligence" only as descriptive adjective |
| HTML integrity | 245/245 divs, 12/12 sections, 20/20 comments | Clean structure |
| `.skip-link` | Present (line 96) | Accessibility feature (like Developer) |
| Active nav | On Platform (correct) | Sixth page with active nav |
| "Continuously updated" | Acceptable (NOT "continuously monitored") | Describes metrics display, not monitoring claim |
| Scope clarification | Explicit Platform vs Architecture distinction | Correct information architecture |

---

## PART 5 — CROSS-REPORT COMPARISON

| Aspect | Enterprise (12) | Trust Framework (15) | Company (16) | **Platform (17)** |
|---|---|---|---|---|
| Lines | 515 | 434 | 349 | **718** |
| Sections | 10 | 7 | 7 | **12** |
| Inline `<style>` | Absent | Absent | Absent | **Present (~78 lines, page design system)** |
| D.2 | 0 | 0 | 1 | **0** |
| D.4 | 0 | 0 | 1 | **0** |
| D.8 | 0 | 1 | 0 | **0** |
| D.9 | 0 | 0 | 2 | **0** |
| Total defects | 0 | 1 | 4 | **0** |
| Verdict | **PASS** | FAIL | FAIL | **PASS** |

### Key Insights

1. **Platform is the SECOND page to PASS** — zero D.1–D.14 defects
2. **Platform has an inline `<style>` block** (~78 lines) but it's a legitimate page design system (`.hero-platform`, `.arch-layer`, `.trace-demo`), NOT dead code
3. **Platform uses canonical gold** `rgba(227, 180, 90, ...)` — the FIRST page to use the correct gold in inline styles (all other pages with inline gold use old-gold `rgba(201, 162, 39, ...)`)
4. **"Continuously updated" (line 268) is NOT D.8** — it describes metrics display refresh, not source monitoring. "Continuously monitored" (D.8 FORBID) is absent.
5. **Explicit Platform vs Architecture scope** — "This page is why you need ROUA and what you get. Architecture is how it works inside." — correct information architecture
6. **`.skip-link` present** — sixth page with this accessibility feature (after Developer, Architecture, Evidence Explorer, Source Explorer, Sample Library)

---

## PART 6 — RECOMMENDED FIXES

**Zero fixes needed.** Platform has zero D.1–D.14 defects.

---

*End of Delta Report 17. Platform Overview PASSES — second page to achieve PASS after Enterprise. Zero defects across all implementation layers. Uses canonical gold correctly. No D.15+ new defect types.*

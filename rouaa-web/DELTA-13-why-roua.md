# Delta Report 13 — `why-roua.html` vs Product Family Consolidation Spec v6

> **Status:** Third Solutions-category test. Tests Spec v6 against a narrative/positioning page.
> **Audited file:** `/home/z/my-project/rouaa-corporate/rouaa-web/why-roua.html` (473 lines)
> **Reference:** `PRODUCT-FAMILY-CONSOLIDATION-SPEC.md` v6 (commit `d60ec70`)
> **Method:** No code modification. Full cumulative audit across ALL implementation layers.
> **Acceptance Verdict:** **FAIL** — D.2 (4 instances) + D.4 ("Audit-Ready" × 1) + D.9 variant ("Confidence Scoring" × 1, "extraction confidence" × 1).

---

## PART 0 — WHY-ROUA'S ACTUAL INSTITUTIONAL FUNCTION

### What Why ROUA Actually Is

Why ROUA is a **positioning/narrative page** — it answers the institutional buyer's strategic question: "Why should I choose ROUA over what I already have?" Its function is:

1. **Positioning** — Explicitly states what ROUA is NOT (not an information platform, not TradingView, not ChatGPT/AI wrapper)
2. **Comparison** — 7-dimension comparison table (Information Platforms vs ROUA) across What you see, Output, Role, Architecture, Defensibility, AI role, Primary buyer
3. **The Moat** — 7 structural advantages that are hard to copy (Source Network, Evidence Infrastructure, Provenance, Governance Engine, Audit-Ready Output, Workflow Integration, Institutional Memory)
4. **Institutional Knowledge Layer** — External verified intelligence + internal knowledge = institutional decision layer
5. **The Layer Above** — ROUA sits above existing data platforms, not competing with them
6. **Why Incumbents Cannot Replicate** — Trust direction argument (Source → Document → Fact → Evidence → Reasoning → Decision)
7. **Why Now** — 4 market conditions (Information Volume, AI Governance Gap, Regulator Expectations, Documented Decision Reasoning)
8. **Who Moves to ROUA** — 4 buyer triggers (Investment Firms, Banks, Trading Desks, Media)
9. **CTA** — "Assess your intelligence infrastructure"

### Is it a positioning page or a feature list?

It is a **positioning page**, NOT a feature list. The distinction:
- **Feature list** (Catalog): "Here are 54 capabilities you can filter"
- **Positioning page** (Why ROUA): "Here is why the existing stack cannot do what ROUA does, and why the gap is structural — not a feature gap"

The page builds a **strategic argument**, not a capability inventory.

### Inferred UX Test for Why ROUA

**Can the institutional buyer quickly understand why ROUA is a different category (not a better terminal), what makes it structurally hard to copy, and why the timing is now?**

Chain: `Category Positioning → Competitive Comparison → Structural Moat → Why Now → Buyer Trigger → Assessment Request`

---

## PART 1 — STRUCTURAL FACTS

### 1.1 CSS / JS Stack

| Component | Loaded | Notes |
|---|---|---|
| `roua-v7.css` | ✓ | Provides `.comparison-table`, `.comparison-row`, `.comparison-cell` classes |
| `roua-v7-patch.css` | ✓ | |
| `styles.css` | ✗ NOT loaded | |
| **Inline `<style>` block** | ✡ ABSENT | Like Solutions + Enterprise — relies entirely on v7 CSS classes |
| `main.js` | ✓ | |
| `design-system/roua-v7.js` | ✓ | |
| **External JS data files** | ✡ ABSENT | |

**Key finding:** Why ROUA is the **third structurally cleanest page** (after Solutions + Enterprise) — no inline `<style>`, no external JS, no custom design system.

### 1.2 Token Usage

| Token Family | Usage | Verdict |
|---|---|---|
| `--roua-*` aliases | Used throughout | ✓ Correct |
| `var(--gold)` direct (D.6) | **0 instances** | ✓ D.6 absent |
| `rgba(201, 162, 39, ...)` (OLD gold, D.2) | **4 instances** | ⚠ **D.2 PRESENT** |
| Raw hex values (D.7 / D.11) | **0 instances** | ✓ D.7 + D.11 absent |
| Non-canonical hex (D.11) | **0 instances** | ✓ D.11 absent |

**D.2 locations (4 instances):**
- Line 267: Institutional Decision Layer panel gradient
- Line 288: ROUA layer panel gradient (in "Layer Above" diagram)
- Line 323: "Decision" pill gradient (in trust direction chain)
- Line 363: "The missing layer" callout panel gradient

All 4 are gradient backgrounds on gold-accented panels — same old-gold rgba pattern.

### 1.3 Page Structure

```
Navigation (lines 18–105)
1. Page Hero — .page-hero (lines 107–119)
2. The Positioning — 3 cards (lines 121–144)
3. Comparison Table — 7 dimensions (lines 146–198)
4. The Moat — 7 structural advantages (lines 200–246)
5. Institutional Knowledge Layer (lines 248–273)
6. ROUA as the Layer Above (lines 275–299)
7. Why Incumbents Cannot Replicate (lines 301–336)
8. Why Now — 4 market conditions (lines 338–369)
9. Who Moves to ROUA — 4 buyer triggers (lines 371–398)
10. CTA (lines 400–413)
Footer (lines 415–468)
```

- `<section>` count: **10**
- `<div>` balance: 134 / 134 ✓ PASS
- `<section>` balance: 10 / 10 ✓ PASS
- HTML comment balance: 12 / 12 ✓ PASS

### 1.4 HTML Integrity — ALL PASS

| Check | Result |
|---|---|
| `<div>` balance | 134 / 134 ✓ PASS |
| `<section>` balance | 10 / 10 ✓ PASS |
| HTML comment balance | 12 / 12 ✓ PASS |
| Broken internal anchors | None ✓ |
| Dead `<style>` block (D.1) | ✡ ABSENT |

---

## PART 2 — ACCEPTANCE CONTRACT EVALUATION (Spec v6)

### Layer 1 — Canonical Baseline

#### 1.1 Token System — **FAIL** (D.2)

Zero D.6, D.7, D.11. But 4 instances of D.2 (old-gold rgba in gradient backgrounds).

#### 1.2 Container & Layout — **PASS**
#### 1.3 Navigation — **PASS** (active nav on Solutions, 6-link Products, 7-link Solutions, mobile hamburger)
#### 1.4 Buttons — **PASS**
#### 1.5 Footer — **PASS** (1 brand + 5 footer-col = 6 total, no Channels)
#### 1.6 Card Hierarchy — **PASS** (uses `.card` v7-patch plain throughout, no `.cx`, no `.card-accent`)
#### 1.7 Motion — **PASS** (zero ambient motion)
#### 1.8 Typography — **PASS**

#### 1.9 Trust Grammar (Forbidden Phrases)

| Phrase | Count | Verdict |
|---|---|---|
| **"Audit-Ready"** | **1** (line 231) | ✡ **FAIL — D.4** |
| "within seconds" / "in seconds" | 0 | ✓ PASS |
| "real-time" / "real time" | 0 | ✓ PASS |
| "instantly" / "instant" | 0 | ✓ PASS |
| "continuously monitored" | 0 | ✓ PASS |
| **"every claim"** | **1** (line 140) | ⚠ **REVIEW** — "ROUA produces intelligence where every claim traces to a source document" — this is a **ROUA capability claim**, not a quoted institutional question. Per Spec v5: "every claim" is REVIEW — acceptable in quoted institutional questions, forbidden as a ROUA claim. This is a ROUA claim. **Leans FORBID.** |
| "VERIFIED INTELLIGENCE OBJECT" | 0 | ✓ PASS |
| "Trust Promise" | 0 | ✓ PASS |
| "Provenance Immutability" | 0 | ✓ PASS |
| "confidence score" / "confidence scored" | 0 | ✓ PASS |
| **"confidence scoring"** | **1** (line 227) | ⚠ **D.9 variant — REVIEW leans FORBID** |
| **"extraction confidence"** | **1** (line 217) | ⚠ **D.9 variant — REVIEW** |
| "SOC 2" / "ISO 27001" | 0 | ✓ PASS |
| "24/7" | 0 | ✓ PASS |

**D.4 context (line 231):**
```html
<h4 style="margin-bottom: 12px; color: var(--roua-accent);">Audit-Ready Output</h4>
<p>Every decision reconstructable from source to outcome. Designed for regulators and investment committees — not for retail screen time.</p>
```
This is in "The Moat" section — a structural advantage card titled "Audit-Ready Output". Why ROUA is NOT `risk-intelligence.html`. **D.4 violation confirmed.**

**D.9 variant — "Confidence Scoring" (line 227):**
```
"Validation rules, confidence scoring, and source hierarchy operate before analysis reaches decision-makers."
```
Capability description, NOT illustrative metadata. Per Spec v6: REVIEW leans FORBID. Same pattern as Solutions (Delta 11) and Catalog (Delta 10).

**D.9 variant — "extraction confidence" (line 217):**
```
"Every fact linked to document, page, paragraph, and extraction confidence."
```
This is a capability description (not marked "(illustrative)"). Per Spec v5: "Extraction Confidence" is REVIEW when marked illustrative. This is NOT marked illustrative — it's a capability claim. **Leans FORBID.**

**"every claim" (line 140) — REVIEW:**
```
"ROUA produces intelligence where every claim traces to a source document, page, and paragraph"
```
This is a **ROUA claim** (not a quoted institutional question). Per Spec v5: "every claim" is REVIEW — acceptable in quoted institutional questions, forbidden as a ROUA claim. This is a ROUA capability claim. **Leans FORBID.** Recommend softening to "governed claims".

#### 1.10 Taxonomy (Full Content Scan)

| Old term | Count | Context | Verdict |
|---|---|---|---|
| "Trading Intelligence" (alone) | 0 | — | ✓ PASS |
| "Institutional Intelligence" | 4 (lines 7, 113, 421, 465) | Title tag, Hero accent text, footer brand — all descriptive adjective use ("institutional intelligence products/foundation") | ✓ PASS (per v5: descriptive = NOT D.10) |
| "Developer Intelligence" | 0 | — | ✓ PASS |
| "Developer APIs" | 0 | — | ✓ PASS |
| "Market Intelligence" (alone as product) | 0 | — | ✓ PASS |

**Layer 1.10 verdict: PASS** — Zero D.10.

### Layer 1 Overall Verdict: **FAIL**
D.2 (4 instances) + D.4 ("Audit-Ready" × 1) + D.9 variant ("Confidence Scoring" × 1 + "extraction confidence" × 1) + "every claim" REVIEW (leans FORBID).

---

### Layer 5 — Do-Not-Touch Rules — **PASS**

Why ROUA is NOT forced into Product, Explorer, Architecture, or Enterprise grammar. It has its own positioning/narrative structure (Positioning → Comparison → Moat → Layer Above → Why Incumbents Can't → Why Now → Who Moves). Correct positioning-page adaptation.

### Layer 6 — Why-ROUA-Specific Rules

No Spec v6 Why-ROUA-specific UX test exists. Recommend adding:
`Category Positioning → Competitive Comparison → Structural Moat → Why Now → Buyer Trigger → Assessment Request`

### Positioning / Narrative Test

**Does the page explain why ROUA, or does it become a capability list?**

✓ **PASS** — The page is a **strategic argument**, not a feature list:

1. **Explicit category exclusion:** "Three categories ROUA is not in" — Information Platforms, TradingView/Charting Tools, ChatGPT/AI Wrappers
2. **7-dimension comparison:** Not feature-by-feature, but architecture-level (What you see, Output, Role, Architecture, Defensibility, AI role, Primary buyer)
3. **Structural moat argument:** 7 advantages that "cannot be bolted onto a terminal" — Source Network, Evidence Infrastructure, Provenance, Governance Engine, Audit-Ready Output, Workflow Integration, Institutional Memory
4. **Trust direction argument:** Source → Document → Fact → Evidence → Reasoning → Decision — "trust is established at the source layer and preserved upward"
5. **Why incumbents can't replicate:** "Adding evidence and governance to an existing terminal means retrofitting the entire chain — that is not a feature addition, it is a rebuild"
6. **Why now:** 4 market conditions (Information Volume, AI Governance Gap, Regulator Expectations, Documented Decision Reasoning)
7. **"Not TradingView" / "Not ChatGPT"** — explicit competitor category naming (NOT direct competitor naming like "Bloomberg" — these are product categories, acceptable)

The page successfully distinguishes ROUA from AI wrappers, data vendors, and generic research tools through **architectural argument**, not feature comparison.

### Institutional Buyer Psychology Test

**Does the page build a compelling reason to request a briefing?**

✓ **PASS** — The page builds the case through:
1. **Problem framing:** "Institutions don't buy more information. They buy defensible decisions."
2. **Competitive differentiation:** "The comparison is not about features. It is about what would have to be rebuilt from scratch to match ROUA."
3. **Urgency:** "The conditions that made ROUA necessary did not exist five years ago."
4. **Buyer triggers:** "When investment committee starts rejecting analysis without provenance" / "When audit and compliance require reconstructable decision trails"
5. **CTA:** "Assess your intelligence infrastructure" — not "Request a demo" but "assess your gap"

The CTA connects the **institutional problem** (ungoverned intelligence) to the **next step** (assessment), not to the technology.

---

## PART 3 — LAYER 4 DEFECT SCAN (D.1–D.14)

| ID | Defect | Present? | Details |
|---|---|---|---|
| D.1 | Dead `<style>` block | ✡ ABSENT | |
| **D.2** | Old-gold `rgba(201, 162, 39, ...)` | **✓ PRESENT — 4 instances** | Lines 267, 288, 323, 363 (gold-accented panel gradients) |
| D.3 | Malformed HTML comment | ✡ ABSENT | 12/12 PASS |
| **D.4** | "Audit-Ready" violation | **✓ PRESENT — 1 instance** | Line 231: "Audit-Ready Output" card title in The Moat section |
| D.5 | Competitor naming | ✡ ABSENT | "TradingView" and "ChatGPT" are product categories, not direct competitor naming (D.5 covers "Bloomberg / Market Terminals") |
| D.6 | `var(--gold)` mixing | ✡ ABSENT | |
| D.7 | Deprecated raw hex | ✡ ABSENT | |
| D.8 | "real time" timing claim | ✡ ABSENT | |
| **D.9 variant** | "Confidence Scoring" + "extraction confidence" | **✓ PRESENT — 2 instances** | Line 227: "confidence scoring" (capability description, REVIEW leans FORBID). Line 217: "extraction confidence" (capability claim, NOT marked illustrative, leans FORBID). |
| D.10 | Old taxonomy as product name | ✡ ABSENT | |
| D.11 | Non-canonical raw hex | ✡ ABSENT | |
| D.12 | No direct source links | N/A | Why ROUA is not an Explorer |
| D.13 | "24/7" timing claim | ✡ ABSENT | |
| D.14 | Timing claims in JS data files | ✡ ABSENT | No external JS |

**No D.15+ new defect types found.**

---

## PART 4 — DRIFT SUMMARY

### A — Must match
| ID | Finding | Verdict |
|---|---|---|
| A.1 | `.page-hero` | **KEEP** |
| A.2 | Active nav on Solutions | **KEEP** (correct — Why ROUA is under Solutions) |
| A.3 | No inline `<style>` — relies on v7 CSS | **KEEP** (structurally cleanest alongside Solutions + Enterprise) |

### B — Must adapt (Positioning/Narrative)
| ID | Finding | Verdict |
|---|---|---|
| B.1 | 3-card category exclusion (Not Information Platform, Not TradingView, Not ChatGPT) | **KEEP** — correct positioning |
| B.2 | 7-dimension comparison table | **KEEP** — correct architectural differentiation |
| B.3 | 7-card Moat section | **KEEP** — correct structural advantage argument |
| B.4 | Trust direction chain (Source → Decision) | **KEEP** — correct trust-flow visualization |
| B.5 | "Layer Above" diagram | **KEEP** — correct non-competitive positioning |
| B.6 | "Why Incumbents Cannot Replicate" argument | **KEEP** — correct structural argument |
| B.7 | "Why Now" market conditions | **KEEP** — correct timing argument |
| B.8 | 4 buyer triggers | **KEEP** — correct buyer psychology |
| B.9 | "Not TradingView" / "Not ChatGPT" product category naming | **KEEP** — category naming, NOT direct competitor naming (D.5 covers "Bloomberg") |
| B.10 | Zero ambient motion | **KEEP** |
| B.11 | Uses `.card` v7-patch plain throughout | **KEEP** |

### C — Must NOT transfer
| ID | Finding | Verdict |
|---|---|---|
| C.1–C.14 | All 14 Homepage-brand elements | ✓ **All correctly absent** |

### D — Real defects
| ID | Finding | Severity | Fix |
|---|---|---|---|
| **D.2** | 4 instances of `rgba(201, 162, 39, ...)` (lines 267, 288, 323, 363) | **P1 — REPAIR** | Replace with `rgba(227, 180, 90, ...)` |
| **D.4** | "Audit-Ready Output" card title (line 231) | **P1 — REPAIR** | Replace with "Evidence-Linked Output" or "Inspectable Output" |
| **D.9 variant** | "confidence scoring" (line 227) — capability description, REVIEW leans FORBID | **P3 — REVIEW** | Replace with "verification tiering" if FORBID decision |
| **D.9 variant** | "extraction confidence" (line 217) — capability claim, NOT illustrative, leans FORBID | **P3 — REVIEW** | Replace with "verification tier" if FORBID decision |
| **REVIEW** | "every claim" (line 140) — ROUA capability claim, leans FORBID | **P3 — REVIEW** | Replace with "governed claims" |

---

## PART 5 — ACCEPTANCE VERDICT

## **FAIL**

The page **FAILS** due to:

1. **Layer 1.1:** D.2 (4 instances of old-gold rgba in gradient panels)
2. **Layer 1.9:** D.4 ("Audit-Ready Output" card title, line 231)
3. **Layer 1.9:** D.9 variant ("confidence scoring" × 1 + "extraction confidence" × 1, both lean FORBID)
4. **Layer 1.9:** "every claim" × 1 (ROUA capability claim, leans FORBID)

## What's CLEAN

- ✓ Zero D.6, D.7, D.11 (token system clean except D.2)
- ✓ Zero D.3 (HTML comments balanced)
- ✓ Zero D.5 (no direct competitor naming — "TradingView" and "ChatGPT" are category references, acceptable)
- ✓ Zero D.8, D.13 (no timing claims)
- ✓ Zero D.10 (no old taxonomy as product names)
- ✓ Zero D.14 (no external JS)
- ✓ All 14 Homepage-brand elements absent
- ✓ HTML integrity ALL PASS
- ✓ Genuine positioning page (not a feature list or marketing page)
- ✓ Strong institutional buyer psychology (problem → moat → why now → trigger → assessment)
- ✓ Correct category exclusion (not terminal, not charting tool, not AI wrapper)

---

## PART 6 — SPEC v7 RECOMMENDATIONS

| Update | Layer | Detail |
|---|---|---|
| **Add Why ROUA UX test** | Layer 6.3 | `Category Positioning → Competitive Comparison → Structural Moat → Why Now → Buyer Trigger → Assessment Request` |
| **"every claim" as ROUA claim** | Layer 1.9 | Current Spec says "every claim" is REVIEW (acceptable in quoted institutional questions). Why ROUA uses it as a **ROUA capability claim** ("ROUA produces intelligence where every claim traces to a source"). Consider tightening: "every claim" is FORBID as ROUA claim, REVIEW only in quoted institutional questions. |
| **"extraction confidence" without "(illustrative)"** | Layer 1.9 | Current Spec says "Extraction Confidence" is REVIEW when marked "(illustrative)". Why ROUA uses it WITHOUT illustrative disclaimer — as a capability claim. Consider: "Extraction Confidence" without "(illustrative)" = FORBID. |
| **No new defect types** | — | No D.15+ found. |

**Spec v7 recommended** — but only for tightening existing REVIEW items, not for new defect types.

---

## PART 7 — CROSS-REPORT COMPARISON

| Aspect | Solutions (11) | Enterprise (12) | **Why ROUA (13)** |
|---|---|---|---|
| Lines | 476 | 515 | **473** |
| Sections | 10 | 10 | **10** |
| Inline `<style>` | Absent | Absent | **Absent** |
| D.2 | 1 | 0 | **4** |
| D.4 | 0 | 0 | **1** |
| D.9 | 1 (REVIEW) | 0 | **2 (REVIEW leans FORBID)** |
| D.10 | 3 | 0 | **0** |
| Total defects | 3 | 0 | **4+** |
| Verdict | FAIL | **PASS** | **FAIL** |

### Key Insights

1. **Why ROUA has the most D.2 instances among Solutions pages** (4 vs Solutions 1 vs Enterprise 0) — because it uses gold-accented gradient panels in 4 places (Institutional Decision Layer, Layer Above diagram, Trust Direction chain, Missing Layer callout)
2. **D.4 appears here for the first time on a Solutions page** — "Audit-Ready Output" as a Moat card title. Why ROUA is NOT risk-intelligence.html.
3. **D.9 variant is strongest here** — both "confidence scoring" (capability description) AND "extraction confidence" (without illustrative disclaimer) appear. Both lean FORBID.
4. **"every claim" as ROUA claim** — first time this phrase appears as a ROUA capability claim (not a quoted institutional question). May need Spec tightening.
5. **"TradingView" and "ChatGPT" are category references, NOT D.5** — the page says "Not TradingView / Charting Tools" and "Not ChatGPT / AI Finance Wrappers" to position ROUA's category. This is acceptable (product category naming, not direct competitor naming like "Bloomberg / Market Terminals").
6. **Structurally cleanest alongside Solutions + Enterprise** — no inline `<style>`, no external JS, no custom design system. All three Solutions pages share this structural cleanliness.
7. **Genuine positioning page** — builds a strategic argument through category exclusion, architectural comparison, structural moat, trust direction, and market timing. NOT a feature list.

---

## PART 8 — RECOMMENDED FIXES

### P1 — Technical Repairs (~3 minutes)

| Step | Fix | Lines | Effort |
|---|---|---|---|
| 13.1 | REPAIR D.2 — replace 4 old-gold rgba with `rgba(227, 180, 90, ...)` | 267, 288, 323, 363 | ~3 min |
| 13.2 | REPAIR D.4 — replace "Audit-Ready Output" with "Evidence-Linked Output" | 231 | ~1 min |

### P3 — Content Review

| Step | Fix | Lines | Effort |
|---|---|---|---|
| 13.3 | REVIEW D.9 variant — replace "confidence scoring" with "verification tiering" (if FORBID) | 227 | ~1 min |
| 13.4 | REVIEW D.9 variant — replace "extraction confidence" with "verification tier" (if FORBID, since NOT marked illustrative) | 217 | ~1 min |
| 13.5 | REVIEW "every claim" — replace with "governed claims" (ROUA capability claim, leans FORBID) | 140 | ~1 min |

---

*End of Delta Report 13. Spec v6 tested on positioning/narrative page — works correctly. D.2 (4 instances) + D.4 (1) + D.9 variant (2) + "every claim" REVIEW. No D.15+ new defect types. Spec v7 recommended for tightening "every claim" and "extraction confidence" REVIEW boundaries. Page is genuine positioning argument, not feature list.*

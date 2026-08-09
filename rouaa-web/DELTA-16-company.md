# Delta Report 16 — `company.html` vs Product Family Consolidation Spec v6

> **Status:** Company / Corporate category test. Tests Spec v6 against a corporate About page.
> **Audited file:** `/home/z/my-project/rouaa-corporate/rouaa-web/company.html` (349 lines)
> **Reference:** `PRODUCT-FAMILY-CONSOLIDATION-SPEC.md` v6 (commit `d60ec70`)
> **Method:** No code modification. Full cumulative audit across ALL implementation layers.
> **Acceptance Verdict:** **FAIL** — D.2 (1) + D.4 ("Audit-Ready" × 1) + D.9 variant ("Confidence Scoring" × 2).

---

## PART 0 — COMPANY PAGE'S ACTUAL FUNCTION

Company is a **corporate identity / About page** — it answers "who is ROUA and why does this company exist?" Its function is:

1. **Why ROUA Exists** — the gap between information and defensible decisions
2. **Six Principles** — Source-First, Governance Before Output, Audit-Ready By Construction, Institutions Not Individuals, Products Built on Infrastructure, Transparency Creates Trust
3. **Our Approach** — Institutional Engagement, Research-Led, Long Horizons, Selective Partnerships
4. **Research & Engineering** — 3 team descriptions (Source & Evidence Engineering, Intelligence & Governance Engineering, Institutional Research)
5. **Why ROUA Exists Now** — 4 market conditions (AI verification gap, Information volume, Regulator traceability, Committee reasoning expectations)
6. **CTA** — Request Institutional Briefing / View Careers / Research Institute

### Is it a corporate page or a product page?

It is a **corporate identity page**, NOT a product page. The distinction:
- **Product page:** "Here is what ROUA does and how it works"
- **Company page:** "Here is why ROUA exists, what it believes, and how it operates as a company"

The page focuses on mission, principles, approach, and team — not on product capabilities.

### Inferred UX Test for Company

**Can the institutional buyer quickly understand why ROUA exists as a company, what principles guide it, and whether it operates with institutional discipline?**

Chain: `Mission → Principles → Approach → Team → Why Now → Engagement`

---

## PART 1 — STRUCTURAL FACTS

### 1.1 CSS / JS Stack

| Component | Loaded | Notes |
|---|---|---|
| `roua-v7.css` | ✓ | |
| `roua-v7-patch.css` | ✓ | |
| `styles.css` | ✗ NOT loaded | |
| **Inline `<style>` block** | ✗ ABSENT | Fifth structurally cleanest page |
| `main.js` | ✓ | |
| `design-system/roua-v7.js` | ✓ | |
| **External JS data files** | ✗ ABSENT | |

### 1.2 Token Usage

| Token Family | Usage | Verdict |
|---|---|---|
| `--roua-*` aliases | Used throughout | ✓ Correct |
| `var(--gold)` direct (D.6) | **0 instances** | ✓ D.6 absent |
| `rgba(201, 162, 39, ...)` (OLD gold, D.2) | **1 instance** (line 270) | ⚠ **D.2 PRESENT** |
| Raw hex values (D.7 / D.11) | **0 instances** | ✓ D.7 + D.11 absent |

**D.2 location:** Line 270 — "Why ROUA Exists Now" callout panel gradient.

### 1.3 Page Structure

```
Navigation (lines 18–91)
1. Page Hero — .page-hero (lines 93–106)
2. Why ROUA Exists — 3 cards (lines 108–135)
3. What We Believe — 6 principles (lines 137–176)
4. Our Approach — 4 cards + 1 callout (lines 178–209)
5. Research & Engineering — 3 team cards (lines 211–242)
6. Why ROUA Exists Now — 4 cards + callout (lines 244–276)
7. CTA (lines 278–290)
Footer (lines 292–349)
```

- `<section>` count: **7** (fewest of any page with content sections — Trust Framework had 7 too)
- `<div>` balance: 69 / 69 ✓ PASS
- `<section>` balance: 7 / 7 ✓ PASS
- HTML comment balance: 4 / 4 ✓ PASS

### 1.4 HTML Integrity — ALL PASS

---

## PART 2 — ACCEPTANCE CONTRACT EVALUATION (Spec v6)

### Layer 1 — Canonical Baseline

#### 1.1 Token System — **FAIL** (D.2, 1 instance)
#### 1.2 Container & Layout — **PASS**
#### 1.3 Navigation — **PASS** (active nav on Company, 6-link Products, 7-link Solutions, mobile hamburger)
#### 1.4 Buttons — **PASS**
#### 1.5 Footer — **PASS** (1 brand + 5 footer-col = 6 total, no Channels)
#### 1.6 Card Hierarchy — **PASS** (uses `.card` v7-patch plain throughout)
#### 1.7 Motion — **PASS** (zero ambient motion)
#### 1.8 Typography — **PASS**

#### 1.9 Trust Grammar (Forbidden Phrases)

| Phrase | Count | Verdict |
|---|---|---|
| **"Audit-Ready"** | **1** (line 156) | ✗ **FAIL — D.4** |
| "within seconds" / "in seconds" | 0 | ✓ PASS |
| "real-time" / "real time" | 0 | ✓ PASS |
| "instantly" / "instant" | 0 | ✓ PASS |
| "every claim" | 0 | ✓ PASS |
| "VERIFIED INTELLIGENCE OBJECT" | 0 | ✓ PASS |
| "Trust Promise" | 0 | ✓ PASS |
| "Provenance Immutability" | 0 | ✓ PASS |
| "confidence score" / "confidence scored" | 0 | ✓ PASS |
| **"confidence scoring"** | **2** (lines 152, 226) | ⚠ **D.9 variant — REVIEW leans FORBID** |
| "SOC 2" / "ISO 27001" | 0 | ✓ PASS |
| "24/7" | 0 | ✓ PASS |

**D.4 context (line 156):**
```html
<h4>Audit-Ready By Construction</h4>
<p>Every governed intelligence output is designed to be reconstructable from its underlying evidence to its generated conclusion and delivery context. Audit-readiness is not a feature we add at the end — it's the architecture itself.</p>
```
This is Principle 03 — "Audit-Ready By Construction" as a principle title. Company is NOT `risk-intelligence.html`.

**D.9 variant — "Confidence Scoring" (2 instances):**
- Line 152: Principle 02 (Governance Before Output) — "Validation rules, confidence scoring, and source hierarchy operate before analysis is produced"
- Line 226: Team description (Intelligence & Governance Engineering) — "validation rules, and confidence scoring"

Both are capability descriptions, NOT illustrative metadata. Per Spec v6: REVIEW leans FORBID.

#### 1.10 Taxonomy (Full Content Scan)

| Old term | Count | Context | Verdict |
|---|---|---|---|
| "Trading Intelligence" (alone) | 0 | — | ✓ PASS |
| "Institutional Intelligence" | 4 (lines 7, 97, 298, 342) | Title tag, Hero text, footer brand — all descriptive adjective use | ✓ PASS (per v5: descriptive = NOT D.10) |
| "Developer Intelligence" | 0 | — | ✓ PASS |
| "Developer APIs" | 0 | — | ✓ PASS |
| "Market Intelligence" (alone as product) | 0 | — | ✓ PASS |

**Layer 1.10 verdict: PASS** — Zero D.10.

### Layer 1 Overall Verdict: **FAIL**
D.2 (1) + D.4 (1) + D.9 variant (2).

---

### Layer 5 — Do-Not-Touch Rules — **PASS**

Company page is NOT forced into Product, Explorer, Architecture, or Solutions grammar. It has its own corporate-identity structure. Correct adaptation.

### Layer 6 — Company-Specific Rules

No Spec v6 Company-specific UX test. Recommend adding:
`Mission → Principles → Approach → Team → Why Now → Engagement`

### UX / Institutional Identity Test

**Does the page help the institutional buyer understand who ROUA is and whether to trust the company?**

✓ **PASS** — The page builds corporate credibility through:

1. **Mission clarity:** "ROUA exists to address the gap between financial information and defensible institutional decisions"
2. **Six principles** — each with specific operational commitment (Source-First, Governance Before Output, Audit-Ready By Construction, Institutions Not Individuals, Products Built on Infrastructure, Transparency Creates Trust)
3. **Approach** — Institutional Engagement, Research-Led, Long Horizons, Selective Partnerships
4. **Team descriptions** — 3 engineering/research teams with specific responsibilities
5. **"Named leadership, advisory structure, and reference engagements are shared under NDA during the briefing process — not posted as marketing."** (line 235) — correct anti-marketing discipline
6. **Why Now** — 4 market conditions that made ROUA necessary

The page does NOT post fabricated team photos, LinkedIn profiles, or marketing bios. It describes team functions and refers to NDA for named leadership — correct institutional discipline.

---

## PART 3 — LAYER 4 DEFECT SCAN (D.1–D.14)

| ID | Defect | Present? | Details |
|---|---|---|---|
| D.1 | Dead `<style>` block | ✗ ABSENT | |
| **D.2** | Old-gold `rgba(201, 162, 39, ...)` | **✓ PRESENT — 1 instance** | Line 270 |
| D.3 | Malformed HTML comment | ✗ ABSENT | 4/4 PASS |
| **D.4** | "Audit-Ready" violation | **✓ PRESENT — 1 instance** | Line 156: "Audit-Ready By Construction" (Principle 03 title) |
| D.5 | Competitor naming | ✗ ABSENT | |
| D.6 | `var(--gold)` mixing | ✗ ABSENT | |
| D.7 | Deprecated raw hex | ✗ ABSENT | |
| D.8 | "real time" timing claim | ✗ ABSENT | |
| **D.9 variant** | "Confidence Scoring" | **✓ PRESENT — 2 instances** | Lines 152, 226 — capability descriptions, REVIEW leans FORBID |
| D.10 | Old taxonomy as product name | ✗ ABSENT | |
| D.11 | Non-canonical raw hex | ✗ ABSENT | |
| D.12 | No direct source links | N/A | |
| D.13 | "24/7" timing claim | ✗ ABSENT | |
| D.14 | Timing claims in JS data files | ✗ ABSENT | |

**No D.15+ new defect types found.**

---

## PART 4 — DRIFT SUMMARY

### D — Real defects
| ID | Finding | Severity | Fix |
|---|---|---|---|
| **D.2** | 1 instance (line 270) | **P1 — REPAIR** | Replace with `rgba(227, 180, 90, ...)` |
| **D.4** | "Audit-Ready By Construction" (line 156) | **P1 — REPAIR** | Replace with "Inspectable By Construction" or "Evidence-Linked By Construction" |
| **D.9 variant** | "confidence scoring" × 2 (lines 152, 226) | **P3 — REVIEW (leans FORBID)** | Replace with "verification tiering" if FORBID decision |

---

## PART 5 — ACCEPTANCE VERDICT

## **FAIL**

The page **FAILS** due to D.2 (1) + D.4 (1) + D.9 variant (2).

### What's CLEAN

- ✓ Zero D.6, D.7, D.11 (token system clean except D.2)
- ✓ Zero D.3, D.5, D.8, D.10, D.13, D.14
- ✓ All 14 Homepage-brand elements absent
- ✓ HTML integrity ALL PASS (69/69 divs, 7/7 sections, 4/4 comments)
- ✓ Genuine corporate identity page (not a product page)
- ✓ "Named leadership shared under NDA — not posted as marketing" — correct anti-marketing discipline
- ✓ No fabricated team photos or LinkedIn profiles
- ✓ Active nav on Company (correct)
- ✓ Fifth structurally cleanest page (no inline `<style>`, no external JS)
- ✓ Zero competitor naming

---

## PART 6 — CROSS-REPORT COMPARISON

| Aspect | Enterprise (12) | Trust Framework (15) | **Company (16)** |
|---|---|---|---|
| Lines | 515 | 434 | **349 (shortest!)** |
| Sections | 10 | 7 | **7** |
| D.2 | 0 | 0 | **1** |
| D.4 | 0 | 0 | **1** |
| D.8 | 0 | 1 | **0** |
| D.9 variant | 0 | 0 | **2** |
| Total defects | 0 | 1 | **4** |
| Verdict | **PASS** | FAIL (closest) | **FAIL** |

### Key Insights

1. **Company is the shortest page** (349 lines) — concise corporate identity
2. **D.4 "Audit-Ready By Construction"** appears as a Principle title — this is a philosophical/brand use of "Audit-Ready", not a feature claim. However, per Spec v6, D.4 FORBID applies to the concept regardless of context.
3. **D.9 variant "confidence scoring"** appears in both Principle 02 (Governance Before Output) and team description — both capability descriptions.
4. **"Named leadership shared under NDA — not posted as marketing"** — strongest anti-marketing discipline on the site. Company page refuses to post fabricated team credentials.
5. **No D.15+ new defect types** — Spec v6 sufficient.

---

## PART 7 — RECOMMENDED FIXES

### P1 — Technical Repairs (~3 minutes)

| Step | Fix | Lines | Effort |
|---|---|---|---|
| 16.1 | REPAIR D.2 — replace 1 old-gold rgba | 270 | ~1 min |
| 16.2 | REPAIR D.4 — replace "Audit-Ready By Construction" with "Inspectable By Construction" | 156 | ~1 min |

### P3 — Content Review

| Step | Fix | Lines | Effort |
|---|---|---|---|
| 16.3 | REVIEW D.9 variant — replace "confidence scoring" × 2 with "verification tiering" (if FORBID) | 152, 226 | ~2 min |

---

*End of Delta Report 16. Company page FAILS with 4 defects (D.2 + D.4 + D.9 variant × 2). Shortest page on site (349 lines). Genuine corporate identity page with strong anti-marketing discipline ("named leadership shared under NDA"). No D.15+ new defect types.*

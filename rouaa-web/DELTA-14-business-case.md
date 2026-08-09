# Delta Report 14 — `business-case.html` vs Product Family Consolidation Spec v6

> **Status:** Fourth Solutions-category test. Tests Spec v6 against an economic justification / business case page.
> **Audited file:** `/home/z/my-project/rouaa-corporate/rouaa-web/business-case.html` (648 lines)
> **Reference:** `PRODUCT-FAMILY-CONSOLIDATION-SPEC.md` v6 (commit `d60ec70`)
> **Method:** No code modification. Full cumulative audit across ALL implementation layers.
> **Acceptance Verdict:** **FAIL** — D.2 (1) + D.4 (3 instances) + D.8 ("real time" × 1) + D.9 variant ("Confidence Scoring" × 3) + "every claim" REVIEW.

---

## PART 0 — BUSINESS CASE'S ACTUAL INSTITUTIONAL FUNCTION

### What Business Case Actually Is

Business Case is an **economic justification page** — it answers the CFO/CIO's budget question: "Why should we allocate capital to ROUA instead of building internally or staying as we are?" Its function is:

1. **The Business Question** — reframes from technology decision to capital allocation decision
2. **Cost of Inaction** — 4 areas where the institution already pays for the gap (Manual Research, Compliance Reconstruction, Slow Decision Cycles, Fragmented Systems)
3. **Build vs Buy** — 8-dimension comparison table (Source infrastructure, Document intelligence, Evidence/Knowledge graph, Governance, Time to maturity, Maintenance, Learning curve, Total cost of ownership)
4. **ROI Dimensions** — 4 measurable returns (Research Preparation Time, Decision Cycles, Duplicate Work, Compliance Reconstruction Cost) — each with "Measure against" baseline
5. **Regulatory Risk Reduction** — 6 structural risk reduction mechanisms
6. **Quantified Value Framework** — 4-step framework for institutions to estimate ROUA's value against their own baseline (NOT fabricated benchmarks)
7. **Value by Institution Type** — 4 institution types with different primary value (Banks, Asset Managers, Trading Firms, Media)
8. **Institutional Decision Framework** — 5 questions CFOs/CIOs should ask
9. **Enterprise Readiness** — 6 stakeholder perspectives (Security, Procurement, Legal, Infrastructure, Risk, CIO)
10. **Pilot Economics** — 4-step pilot framework (Assess Baseline → Pilot → Measure Delta → Scale or Stop)

### Is it a real economic argument or marketing numbers?

It is a **real economic argument**, NOT marketing numbers. The critical distinction:

- **Marketing numbers:** "ROUA delivers 300% ROI" or "Save $2M annually" — fabricated benchmarks
- **Business Case page:** "ROUA does not publish fabricated ROI benchmarks. Every institution's baseline is different. Instead, here is the framework institutional buyers use to estimate ROUA's value against their own numbers." (line 349)

The page explicitly refuses to publish fabricated metrics and instead provides a **measurement framework** — the institution brings its own baseline numbers. This is the most disciplined economic-claim approach on the site.

### Inferred UX Test for Business Case

**Can the CFO/CIO quickly understand the cost of inaction, evaluate build vs buy, identify measurable ROI dimensions, and determine whether a pilot is worth initiating?**

Chain: `Cost of Inaction → Build vs Buy Decision → ROI Dimensions → Quantified Value Framework → Pilot Economics → Business Case Review Request`

---

## PART 1 — STRUCTURAL FACTS

### 1.1 CSS / JS Stack

| Component | Loaded | Notes |
|---|---|---|
| `roua-v7.css` | ✓ | Provides `.comparison-table`, `.strategic-channel-list`, `.strategic-channel-item` classes |
| `roua-v7-patch.css` | ✓ | |
| `styles.css` | ✗ NOT loaded | |
| **Inline `<style>` block** | ✗ ABSENT | Fourth structurally cleanest page (after Solutions, Enterprise, Why ROUA) |
| `main.js` | ✓ | |
| `design-system/roua-v7.js` | ✓ | |
| **External JS data files** | ✗ ABSENT | |

### 1.2 Token Usage

| Token Family | Usage | Verdict |
|---|---|---|
| `--roua-*` aliases | Used throughout | ✓ Correct |
| `var(--gold)` direct (D.6) | **0 instances** | ✓ D.6 absent |
| `rgba(201, 162, 39, ...)` (OLD gold, D.2) | **1 instance** (line 405) | ⚠ **D.2 PRESENT** |
| Raw hex values (D.7 / D.11) | **0 instances** | ✓ D.7 + D.11 absent |

**D.2 location:** Line 405 — Quantified Value Framework callout panel gradient.

### 1.3 Page Structure

```
Navigation (lines 18–106)
1. Page Hero — .page-hero (lines 108–126)
2. The Business Question — 3 cards (lines 128–155)
3. Cost of Inaction — 4 cards (lines 157–196)
4. Build vs Buy — 8-dimension comparison table (lines 198–260)
5. ROI Dimensions — 4 cards with "Measure against" (lines 262–301)
6. Regulatory Risk Reduction — 6 cards (lines 303–341)
7. Quantified Value Framework — 4-step (lines 343–411)
8. Value by Institution Type — 4 cards (lines 413–444)
9. Institutional Decision Framework — 5 questions (lines 446–492)
10. Enterprise Readiness — 6 stakeholder cards (lines 494–532)
11. Pilot Economics — 4-step (lines 534–572)
12. CTA (lines 574–587)
Footer (lines 589–648)
```

- `<section>` count: **12**
- `<div>` balance: 178 / 178 ✓ PASS
- `<section>` balance: 12 / 12 ✓ PASS
- HTML comment balance: 14 / 14 ✓ PASS

### 1.4 HTML Integrity — ALL PASS

| Check | Result |
|---|---|
| `<div>` balance | 178 / 178 ✓ PASS |
| `<section>` balance | 12 / 12 ✓ PASS |
| HTML comment balance | 14 / 14 ✓ PASS |
| Broken internal anchors | None ✓ (4 anchors: `#cost-of-inaction`, `#build-vs-buy`, `#roi`, `#cta` — all valid) |
| Dead `<style>` block (D.1) | ✗ ABSENT |

---

## PART 2 — ACCEPTANCE CONTRACT EVALUATION (Spec v6)

### Layer 1 — Canonical Baseline

#### 1.1 Token System — **FAIL** (D.2, 1 instance)
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
| **"Audit-Ready"** | **3** (lines 325, 425, 513) | ✗ **FAIL — D.4** (all 3 are semantic variants: "Audit-Ready On Demand" card title, "Audit-ready on demand" in body text, "Audit-ready decision trails" in Legal card) |
| "within seconds" / "in seconds" | 0 | ✓ PASS |
| **"real time"** | **1** (line 435) | ✗ **FAIL — D.8** |
| "instantly" / "instant" | 0 | ✓ PASS |
| "continuously monitored" | 0 | ✓ PASS |
| **"every claim"** | **1** (line 440) | ⚠ **REVIEW** — "Publish faster with every claim traceable to an official source" — ROUA capability claim, leans FORBID |
| "VERIFIED INTELLIGENCE OBJECT" | 0 | ✓ PASS |
| "Trust Promise" | 0 | ✓ PASS |
| "Provenance Immutability" | 0 | ✓ PASS |
| "confidence score" / "confidence scored" | 0 | ✓ PASS |
| **"confidence scoring"** | **3** (lines 229, 322, 521) | ⚠ **D.9 variant — REVIEW leans FORBID** (capability descriptions, NOT illustrative) |
| "SOC 2" / "ISO 27001" | 0 | ✓ PASS |
| "24/7" | 0 | ✓ PASS |

**D.4 context (3 instances):**
- Line 325: "Audit-Ready On Demand" — card title in Regulatory Risk Reduction section
- Line 425: "Audit-ready on demand" — in Value by Institution Type (Banks card body text)
- Line 513: "Audit-ready decision trails" — in Enterprise Readiness (Legal & Compliance card)

Business Case is NOT `risk-intelligence.html`. All 3 are D.4 violations.

**D.8 context (line 435):**
```
"Market movements linked to events and documents in real time."
```
This is in Value by Institution Type — Trading Firms & Quant Teams card. "In real time" is a timing claim. D.8 FORBID violation.

**D.9 variant — "Confidence Scoring" (3 instances):**
- Line 229: Build vs Buy comparison table — "Design governance rules, confidence scoring, and validation workflows"
- Line 322: Regulatory Risk Reduction — "Validation rules, confidence scoring, and source hierarchy operate before analysis reaches decision-makers"
- Line 521: Enterprise Readiness (Risk card) — "Source hierarchy and trust classification. Confidence scoring. Validation before output."

All 3 are capability descriptions, NOT illustrative metadata. Per Spec v6: REVIEW leans FORBID.

**"every claim" (line 440):**
```
"Publish faster with every claim traceable to an official source."
```
ROUA capability claim (not quoted institutional question). Per Spec v5: REVIEW — leans FORBID. Recommend "governed claims".

#### 1.10 Taxonomy (Full Content Scan)

| Old term | Count | Context | Verdict |
|---|---|---|---|
| "Trading Intelligence" (alone) | 0 | — | ✓ PASS |
| "Institutional Intelligence" | 2 (lines 595, 640) | Footer brand descriptive use | ✓ PASS (per v5: descriptive = NOT D.10) |
| "Developer Intelligence" | 0 | — | ✓ PASS |
| "Developer APIs" | 0 | — | ✓ PASS |
| "Market Intelligence" (alone as product) | 0 | — | ✓ PASS |

**Layer 1.10 verdict: PASS** — Zero D.10.

**"Quant Teams" (line 433):**
```
Trading Firms & Quant Teams
```
Same as Solutions Overview (Delta 11) — not D.10 (buyer type), but inconsistent with Market Intelligence page where it was removed. **REVIEW.**

### Layer 1 Overall Verdict: **FAIL**
D.2 (1) + D.4 (3) + D.8 (1) + D.9 variant (3, REVIEW leans FORBID) + "every claim" REVIEW.

---

### Layer 5 — Do-Not-Touch Rules — **PASS**

Business Case is NOT forced into Product, Explorer, Architecture, or Enterprise grammar. It has its own economic-justification structure. Correct adaptation.

### Layer 6 — Business-Case-Specific Rules

No Spec v6 Business Case-specific UX test. Recommend adding:
`Cost of Inaction → Build vs Buy Decision → ROI Dimensions → Quantified Value Framework → Pilot Economics → Business Case Review Request`

### Economic Justification Test

**Does the page provide a real economic argument, or just marketing numbers?**

✓✓ **PASS — Strongest economic discipline on the site.**

Key evidence:
1. **Explicit refusal to fabricate:** "ROUA does not publish fabricated ROI benchmarks. Every institution's baseline is different." (line 349)
2. **Measurement framework, not marketing claims:** 4-step framework where the institution brings its own baseline numbers
3. **"Measure against" baseline:** Each ROI dimension includes specific metrics to measure against (analyst hours per brief, time from event to committee-ready brief, duplicated research instances, audit response time)
4. **Pilot economics with "Scale or Stop":** "If the measured delta justifies investment, scale to additional teams. If not, you've spent weeks, not an enterprise budget." (line 564)
5. **"This is a measurement framework, not a marketing claim."** (line 569) — explicit meta-disclaimer
6. **"ROI" used as section title** (line 266) but NOT as a fabricated number — the section provides dimensions to measure, not claimed returns
7. **No dollar amounts, no percentage savings, no fabricated benchmarks** — the page provides the framework, the institution provides the numbers

### Value → Cost → Outcome Test

**Is the relationship between problem, investment, and outcome clear?**

✓ **PASS** — The page follows a clear value chain:

1. **Problem (Cost of Inaction):** 4 areas where the institution already pays
2. **Investment (Build vs Buy):** 8-dimension comparison showing total cost of ownership
3. **Outcome (ROI Dimensions):** 4 measurable returns with "Measure against" baselines
4. **Framework (Quantified Value):** 4-step process to estimate value against own numbers
5. **Pilot (Pilot Economics):** 4-step pilot to validate before enterprise commitment

The relationship is: **"You are already paying (cost of inaction). ROUA's cost is finite and scoped (platform fee). The value is measurable against your own baseline (not fabricated). Pilot first, then decide."**

---

## PART 3 — LAYER 4 DEFECT SCAN (D.1–D.14)

| ID | Defect | Present? | Details |
|---|---|---|---|
| D.1 | Dead `<style>` block | ✗ ABSENT | |
| **D.2** | Old-gold `rgba(201, 162, 39, ...)` | **✓ PRESENT — 1 instance** | Line 405 (Quantified Value Framework callout gradient) |
| D.3 | Malformed HTML comment | ✗ ABSENT | 14/14 PASS |
| **D.4** | "Audit-Ready" violation | **✓ PRESENT — 3 instances** | Line 325: "Audit-Ready On Demand" (card title). Line 425: "Audit-ready on demand" (body text). Line 513: "Audit-ready decision trails" (Legal card). |
| D.5 | Competitor naming | ✗ ABSENT | 0 instances (no Bloomberg, no TradingView, no ChatGPT) |
| D.6 | `var(--gold)` mixing | ✗ ABSENT | |
| D.7 | Deprecated raw hex | ✗ ABSENT | |
| **D.8** | "real time" timing claim | **✓ PRESENT — 1 instance** | Line 435: "Market movements linked to events and documents in real time." |
| **D.9 variant** | "Confidence Scoring" | **✓ PRESENT — 3 instances** | Lines 229, 322, 521 — all capability descriptions, REVIEW leans FORBID |
| D.10 | Old taxonomy as product name | ✗ ABSENT | |
| D.11 | Non-canonical raw hex | ✗ ABSENT | |
| D.12 | No direct source links | N/A | Business Case is not an Explorer |
| D.13 | "24/7" timing claim | ✗ ABSENT | |
| D.14 | Timing claims in JS data files | ✗ ABSENT | No external JS |

**No D.15+ new defect types found.**

---

## PART 4 — DRIFT SUMMARY

### A — Must match
| ID | Finding | Verdict |
|---|---|---|
| A.1 | `.page-hero` | **KEEP** |
| A.2 | Active nav on Solutions | **KEEP** |
| A.3 | No inline `<style>` | **KEEP** (4th structurally cleanest) |

### B — Must adapt (Economic Justification)
| ID | Finding | Verdict |
|---|---|---|
| B.1 | Cost of Inaction framework (4 areas) | **KEEP** — correct economic framing |
| B.2 | Build vs Buy comparison table (8 dimensions) | **KEEP** — correct capital allocation framing |
| B.3 | ROI Dimensions with "Measure against" baselines | **KEEP** — correct measurable-returns framing |
| B.4 | Quantified Value Framework (4-step, institution's own numbers) | **KEEP** — strongest anti-fabrication discipline |
| B.5 | Pilot Economics (4-step with "Scale or Stop") | **KEEP** — correct de-risked adoption |
| B.6 | Value by Institution Type (4 types) | **KEEP** — correct buyer-segmented value |
| B.7 | Institutional Decision Framework (5 questions) | **KEEP** — correct CFO/CIO framing |
| B.8 | Enterprise Readiness (6 stakeholder perspectives) | **KEEP** — correct procurement framing |
| B.9 | "ROUA does not publish fabricated ROI benchmarks" | **KEEP** — strongest economic-claim discipline on site |
| B.10 | "This is a measurement framework, not a marketing claim" | **KEEP** — explicit meta-disclaimer |
| B.11 | Zero ambient motion | **KEEP** |
| B.12 | Uses `.card` v7-patch plain throughout | **KEEP** |

### C — Must NOT transfer
| ID | Finding | Verdict |
|---|---|---|
| C.1–C.14 | All 14 Homepage-brand elements | ✓ **All correctly absent** |

### D — Real defects
| ID | Finding | Severity | Fix |
|---|---|---|---|
| **D.2** | 1 instance of `rgba(201, 162, 39, ...)` (line 405) | **P1 — REPAIR** | Replace with `rgba(227, 180, 90, ...)` |
| **D.4** | "Audit-Ready" × 3 (lines 325, 425, 513) | **P1 — REPAIR** | Replace with "Evidence-Linked" or "Inspectable" |
| **D.8** | "in real time" × 1 (line 435) | **P1 — REPAIR** | Replace with "through configured source monitoring" or "as they are published" |
| **D.9 variant** | "confidence scoring" × 3 (lines 229, 322, 521) | **P3 — REVIEW (leans FORBID)** | Replace with "verification tiering" if FORBID decision |
| **REVIEW** | "every claim" × 1 (line 440) — ROUA capability claim | **P3 — REVIEW** | Replace with "governed claims" |
| **REVIEW** | "Quant Teams" (line 433) — inconsistent with Market Intelligence page | **P3 — REVIEW** | Consistency check |

---

## PART 5 — ACCEPTANCE VERDICT

## **FAIL**

The page **FAILS** due to:

1. **Layer 1.1:** D.2 (1 instance)
2. **Layer 1.9:** D.4 ("Audit-Ready" × 3) — **most D.4 instances of any page**
3. **Layer 1.9:** D.8 ("in real time" × 1)
4. **Layer 1.9:** D.9 variant ("Confidence Scoring" × 3, REVIEW leans FORBID)
5. **Layer 1.9:** "every claim" × 1 (REVIEW, leans FORBID)

## What's CLEAN

- ✓ Zero D.6, D.7, D.11 (token system clean except D.2)
- ✓ Zero D.3, D.5, D.10, D.13, D.14
- ✓ All 14 Homepage-brand elements absent
- ✓ HTML integrity ALL PASS (178/178 divs, 12/12 sections, 14/14 comments)
- ✓ **Strongest economic-claim discipline on the site** — explicitly refuses fabricated benchmarks
- ✓ Genuine economic argument (Cost of Inaction → Build vs Buy → ROI → Framework → Pilot)
- ✓ "This is a measurement framework, not a marketing claim" — explicit meta-disclaimer
- ✓ Zero competitor naming
- ✓ No fabricated dollar amounts, percentages, or benchmarks

---

## PART 6 — SPEC v7 RECOMMENDATIONS

| Update | Layer | Detail |
|---|---|---|
| **Add Business Case UX test** | Layer 6.3 | `Cost of Inaction → Build vs Buy Decision → ROI Dimensions → Quantified Value Framework → Pilot Economics → Business Case Review Request` |
| **Tighten "every claim"** | Layer 1.9 | FORBID as ROUA capability claim; REVIEW only in quoted institutional questions. Why ROUA (line 140) and Business Case (line 440) both use it as ROUA claims. |
| **Tighten "extraction confidence" without "(illustrative)"** | Layer 1.9 | FORBID when not marked illustrative (seen on Why ROUA line 217) |
| **No new defect types** | — | No D.15+ found. |

**Spec v7 recommended** — for tightening REVIEW boundaries + adding Business Case UX test.

---

## PART 7 — CROSS-REPORT COMPARISON (Solutions category)

| Aspect | Solutions (11) | Enterprise (12) | Why ROUA (13) | **Business Case (14)** |
|---|---|---|---|---|
| Lines | 476 | 515 | 473 | **648 (longest Solutions)** |
| Sections | 10 | 10 | 10 | **12** |
| Inline `<style>` | Absent | Absent | Absent | **Absent** |
| D.2 | 1 | 0 | 4 | **1** |
| D.4 | 0 | 0 | 1 | **3 (most!)** |
| D.8 | 0 | 0 | 0 | **1** |
| D.9 variant | 1 | 0 | 2 | **3 (most!)** |
| D.10 | 3 (most) | 0 | 0 | **0** |
| Total defects | 3 | 0 | 4+ | **5+ (most)** |
| Verdict | FAIL | **PASS** | FAIL | **FAIL** |

### Key Insights

1. **Business Case has the most defects among Solutions pages** (5+ vs Solutions 3, Why ROUA 4+, Enterprise 0) — because it has the most content discussing governance, risk, and compliance (where D.4 "Audit-Ready" and D.9 "Confidence Scoring" naturally appear)
2. **D.4 is most prevalent here** (3 instances) — "Audit-Ready" appears in Regulatory Risk Reduction, Value by Institution Type, and Enterprise Readiness sections
3. **D.9 variant is most prevalent here** (3 instances) — "Confidence Scoring" appears in Build vs Buy, Regulatory Risk, and Enterprise Readiness sections
4. **D.8 appears for the first time on a Solutions page** — "in real time" in Trading Firms value card
5. **Strongest economic-claim discipline on the site** — explicitly refuses fabricated benchmarks, provides measurement framework instead
6. **Fourth structurally cleanest page** — no inline `<style>`, no external JS
7. **"Quant Teams" inconsistency** continues — same as Solutions Overview (Delta 11)

---

## PART 8 — RECOMMENDED FIXES

### P1 — Technical Repairs (~5 minutes)

| Step | Fix | Lines | Effort |
|---|---|---|---|
| 14.1 | REPAIR D.2 — replace 1 old-gold rgba | 405 | ~1 min |
| 14.2 | REPAIR D.4 — replace 3 "Audit-Ready" variants with "Evidence-Linked" | 325, 425, 513 | ~3 min |
| 14.3 | REPAIR D.8 — replace "in real time" with "as they are published" | 435 | ~1 min |

### P3 — Content Review

| Step | Fix | Lines | Effort |
|---|---|---|---|
| 14.4 | REVIEW D.9 variant — replace 3 "confidence scoring" with "verification tiering" (if FORBID) | 229, 322, 521 | ~3 min |
| 14.5 | REVIEW "every claim" — replace with "governed claims" | 440 | ~1 min |
| 14.6 | REVIEW "Quant Teams" — consistency with Market Intelligence page | 433 | Judgment call |

---

*End of Delta Report 14. Spec v6 tested on economic justification page — works correctly. D.4 (3, most), D.8 (1), D.9 variant (3, most), D.2 (1). Strongest economic-claim discipline on site (explicitly refuses fabricated benchmarks). No D.15+ new defect types. Spec v7 recommended for tightening REVIEW boundaries + adding Business Case UX test.*

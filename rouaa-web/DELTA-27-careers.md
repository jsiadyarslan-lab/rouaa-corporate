# Delta Report 27 — `careers.html` vs Product Family Consolidation Spec v6

> **Status:** Company / Careers page test. Tests Spec v6 against a Company-category page that serves as the careers / hiring-process entry point.
> **Audited file:** `/home/z/my-project/rouaa-corporate/rouaa-web/careers.html` (375 lines)
> **Reference:** `PRODUCT-FAMILY-CONSOLIDATION-SPEC.md` v6 (commit `d60ec70`)
> **Method:** No code modification. Full cumulative audit across ALL implementation layers (HTML + inline styles + JS content strings + content claims).
> **Acceptance Verdict:** **PASS** — 4th page to PASS (after Enterprise, Platform, Source Registry borderline). Zero confirmed defects across all 14 defect types (D.1–D.14) + zero FORBID phrase violations + zero D.15+ new defect types.

---

## PART 0 — CAREERS' ACTUAL INSTITUTIONAL FUNCTION

Careers is a **Company / Hiring Process page** — it serves as the careers / hiring-process entry point for ROUA. Its function is explicitly NOT a product page, NOT a solution page, NOT a platform page, NOT a contact page — it is the **recruiting page** where potential candidates learn about ROUA's culture, areas of work, ownership model, and 4-stage hiring process.

The page's defining claim — "Build intelligence products that institutions can defend." (line 97-98) — positions it as the **mission-driven recruiting page**: candidates can understand what ROUA is building, the cultural principles, the areas of work, and the hiring process before submitting an expression of interest.

### Inferred UX Test for Careers

**Can a potential candidate quickly understand what ROUA is building (mission), the cultural principles (6 principles), the areas of work (5 areas + open expression of interest), the ownership model (early-stage, build from first principles), and the 4-stage hiring process — and submit an expression of interest via email?**

Chain: `Hero (build intelligence products that institutions can defend) → Why People Join ROUA (3 cards) → Culture (6 principles) → Areas of Work (5 areas + Open expression) → What You Will Own (4 ownership cards + early-stage disclaimer) → How We Hire (4-stage process) → CTA (email careers@roua.com)`

### Page Structure (7 sections)

1. **Page Hero** — "Build intelligence products that institutions can defend" + 2 CTAs (Areas of Work / Our Culture)
2. **Why People Join ROUA** — 3 cards: Work That Has Weight / Hard Problems, No Off-The-Shelf Answers / Compounding Work, Long Horizons
3. **Culture** — 6 principle cards: Provenance In Everything / Governance Before Output / Institutional Outcomes, Human Workflows / Open Methodology / Long Horizons / Dissent Is Welcome
4. **Areas of Work** — 5 area cards (Engineering / Intelligence / Research / Operations / Institutional Engagement) + 1 Open Expression of Interest card (dashed border, distinct visual)
5. **What You Will Own** — early-stage disclaimer callout + 4 ownership cards: Build From First Principles / Own Outcomes / Work Across Disciplines / Challenge the System
6. **How We Hire** — 4-stage how-step flow: Initial Conversation (45-min) → Deep Dive (90-min) → Work Sample (paid) → Team Conversation (60-min)
7. **CTA** — Send us a note + email careers@roua.com + Use Contact Form + Learn About ROUA

---

## PART 1 — STRUCTURAL FACTS

### 1.1 CSS / JS Stack

| Component | Loaded | Notes |
|---|---|---|
| `roua-v7.css` | ✓ | Canonical design system |
| `roua-v7-patch.css` | ✓ | Patch layer |
| `styles.css` | ✗ NOT loaded | ✓ |
| **Inline `<style>` block** | ✗ ABSENT | D.1 absent — structurally clean |
| `main.js` | ✓ | Nav behavior |
| `design-system/roua-v7.js` | ✓ | v7 enhancements |
| **Inline `<script>` block** | ✗ ABSENT | No inline `<script>` content (only the `js` class add on line 4) |
| **External JS data files** | ✗ ABSENT | No products.js / catalog-data.js etc. — D.14 N/A |

### 1.2 Token Usage

| Token Family | Usage | Verdict |
|---|---|---|
| `--roua-*` aliases | Extensive use (text-primary, text-secondary, text-muted, surface, bg-secondary, accent, accent-border, border, border-strong, radius-md, font-mono) | ✓ Correct — broad token vocabulary |
| `var(--gold)` direct (D.6) | **0 instances** | ✓ **D.6 absent** — 10th page with zero D.6 |
| `rgba(201, 162, 39, ...)` (OLD gold, D.2) | **0 instances** | ✓ **D.2 absent** |
| Raw hex values (D.7) | **0 instances** | ✓ D.7 absent |
| Non-canonical hex (D.11) | **0 instances** | ✓ D.11 absent |

**Token verdict: PASS.** Zero D.2, D.6, D.7, D.11 — **10th page with fully clean tokens** (cleanest token page in audit set, tied with Contact Delta 26).

### 1.3 Page Structure

```
Navigation (lines 18–91)
1. Page Hero — .page-hero (lines 93–113)
2. Why People Join ROUA — 3 .card (lines 115–136)
3. Culture — 6 .card (lines 138–177)
4. Areas of Work — 5 .card + 1 Open Expression card (lines 179–225)
5. What You Will Own — disclaimer callout + 4 .card (lines 229–259)
6. How We Hire — 4 .how-step (lines 261–302)
7. CTA (lines 304–316)
Footer (lines 318–371)
```

- `<section>` count: **7**
- `<div>` balance: 93 / 93 ✓ PASS
- `<section>` balance: 7 / 7 ✓ PASS
- HTML comment balance: 3 / 3 ✓ PASS

### 1.4 HTML Integrity — ALL PASS

| Check | Result |
|---|---|
| `<div>` balance | 93 / 93 ✓ PASS |
| `<section>` balance | 7 / 7 ✓ PASS |
| HTML comment balance | 3 / 3 ✓ PASS |
| Broken internal anchors | None ✓ (`href="#areas-of-work"` → `id="areas-of-work"` ✓; `href="#culture"` → `id="culture"` ✓) |
| Dead `<style>` block (D.1) | ✗ ABSENT |
| Malformed comment (D.3) | ✗ ABSENT |

### 1.5 Unique Structural Elements

- **Active nav state** on Company dropdown (line 71) — correct (Careers is under Company, line 80: `<a href="careers.html" class="nav-dropdown-link">Careers</a>`)
- **6 Cultural Principles** (lines 144–175) — Provenance In Everything / Governance Before Output / Institutional Outcomes, Human Workflows / Open Methodology / Long Horizons / Dissent Is Welcome. **Strongest cultural-principles articulation on the audited site** — 6 explicit principles, each with a descriptive paragraph. Principle 01 "Provenance In Everything" (line 147) directly echoes the Spec's Provenance canonical term.
- **5 Areas of Work + 1 Open Expression card** (lines 186–223) — Engineering / Intelligence / Research / Operations / Institutional Engagement + Open Expression of Interest (dashed border, distinct visual). The Open card explicitly welcomes expressions of interest outside the 5 areas: "We hire for trajectory, not just for posted openings." (line 221)
- **Early-stage disclaimer** (lines 236–238) — explicit "ROUA is an early-stage company. Many of these disciplines will begin as individual ownership areas and expand as the company grows." — honest size/stage disclosure.
- **4-stage hiring process** (lines 268–300) — Initial Conversation (45-min, no technical tests) → Deep Dive (90-min, system design / methodology / workflow discussion) → Work Sample (paid) → Team Conversation (60-min, cultural fit). **Strongest hiring-process disclosure on the audited site** — explicit durations, what happens at each stage, paid work sample.
- **Paid work sample** (line 289) — "A paid work sample — a real problem relevant to the role, scoped to a reasonable time commitment. We pay for your time. You see how we work. We see how you think." — strongest candidate-respect pattern: paid work sample, two-way evaluation.
- **Two-way evaluation framing** (line 266) — "The process is designed as much for you to evaluate us as for us to evaluate you. Every stage is a conversation — not a test."
- **Anti-sales-pressure framing** (line 215) — "People who engage with CIO offices, research heads, and editors-in-chief — not SaaS salespeople." (in Institutional Engagement area description)
- **Dissent-welcome principle** (lines 172–173) — "Building intelligence products that institutions can defend requires that we get the architecture right. That requires disagreement. We hire people who will tell us when we are wrong — and we listen."

---

## PART 2 — ACCEPTANCE CONTRACT EVALUATION (Spec v6)

### Layer 1 — Canonical Baseline

#### 1.1 Token System — **PASS**

Zero D.2, D.6, D.7, D.11 — **10th page with fully clean tokens**. All `--roua-*` aliases used correctly.

#### 1.2 Container & Layout — **PASS**
#### 1.3 Navigation — **PASS** (active nav on Company, 6-link Products, 7-link Solutions, 4-link Experience, mobile hamburger)
#### 1.4 Buttons — **PASS**
#### 1.5 Footer — **PASS** (1 brand + 5 footer-col = 6 total, no Channels column)
#### 1.6 Card Hierarchy — **PASS** (uses `.card`, `.how-step`, `.eyebrow`, `.section-header`, `.cta-section`, `.cta-buttons` — all canonical v7 components)
#### 1.7 Motion — **PASS** (zero ambient motion — no canvas, no Three.js, no GSAP, no reveal-on-scroll)
#### 1.8 Typography — **PASS**

#### 1.9 Trust Grammar (Forbidden Phrases) — **PASS (all)**

| Phrase | Count | Verdict |
|---|---|---|
| "within seconds" / "in seconds" | 0 | ✓ PASS |
| "real-time" / "real time" (D.8) | 0 | ✓ PASS |
| "instantly" / "instant" | 0 | ✓ PASS |
| "every claim" (FORBID) | 0 | ✓ PASS |
| "audit-ready" / "Audit-Ready" / "Audit Ready" (D.4) | 0 | ✓ PASS |
| "Trust Promise" | 0 | ✓ PASS |
| "Provenance Immutability" | 0 | ✓ PASS |
| "confidence score" / "confidence scored" (D.9 FORBID) | 0 | ✓ PASS |
| "Confidence Scoring" (D.9 REVIEW leans FORBID) | 0 | ✓ PASS |
| "Extraction Confidence" (D.9 REVIEW) | 0 | ✓ PASS |
| "SOC 2" / "ISO 27001" | 0 | ✓ PASS |
| "24/7" (D.13) | 0 | ✓ PASS |
| "continuously monitored" / "monitored continuously" | 0 | ✓ PASS |
| Competitor naming (D.5) | 0 | ✓ PASS |
| "VERIFIED INTELLIGENCE OBJECT" / "verified Intelligence Object" (FORBID + variant) | 0 | ✓ PASS |
| "45-minute call" / "90-minute conversation" / "60-minute conversation" (lines 273, 281, 297) | 3 | ✓ ACCEPTABLE — meeting-duration descriptions, NOT D.8 timing/freshness claims. These describe how long a hiring stage takes, not how fast intelligence arrives. (Per Delta 20 + Delta 26 clarification: operational-duration language is NOT D.8.) |
| "paid work sample" (line 289) | 1 | ✓ ACCEPTABLE — compensation disclosure, NOT a timing claim |
| "material claim" (line 148) | 1 | ✓ ACCEPTABLE — internal culture principle ("If you make a material claim — in code, design, research, or a meeting — be ready to show the evidence behind it"). This is the page's own cultural principle, NOT the "every claim" FORBID phrase. "Material claim" ≠ "every claim" — different concept (materiality qualifier). |

**Trust Grammar verdict: PASS.** All forbidden phrases absent. Zero D.4, D.8, D.9, D.13, "every claim" FORBID, "verified Intelligence Object" FORBID variant. Notable: "material claim" (line 148) is the page's cultural principle phrasing — distinct from the "every claim" FORBID phrase.

#### 1.10 Taxonomy (Full Content Scan) — **PASS**

| Term | Count | Context | Verdict |
|---|---|---|---|
| "Trading Intelligence" (standalone, as product/page name) | 0 | — | ✓ PASS |
| "Institutional Intelligence" (standalone, as product/page name) | 0 | — | ✓ PASS |
| "Market & Trading Intelligence" | 2 (lines 33, 330) | Nav + footer | ✓ PASS — canonical product name |
| "Investment Intelligence" | 2 (lines 31, 328) | Nav + footer | ✓ PASS — canonical product name |
| "Risk Intelligence" | 2 (lines 32, 329) | Nav + footer | ✓ PASS — canonical product name |
| "Media Intelligence" | 2 (lines 34, 331) | Nav + footer | ✓ PASS — canonical product name |
| "Developer Platform" | 2 (lines 35, 332) | Nav + footer | ✓ PASS — canonical product name |
| "institutional intelligence products" (lowercase, descriptive) | 2 (lines 324, 368) | Footer brand description + copyright tagline | ✓ PASS — descriptive adjective use, NOT product name (per v5: descriptive = NOT D.10) |
| "Institutional Intelligence Products" (capitalized, footer copyright) | 1 (line 368) | Footer copyright | ⚠ **REVIEW leans acceptable** — descriptive phrase "Institutional Intelligence Products Powered by Evidence Infrastructure", NOT standalone product name. Same pattern as Financial Intelligence (Delta 24), Financial Media (Delta 25), Contact (Delta 26). Leans acceptable as descriptive. |
| "Developer APIs" | 0 | — | ✓ PASS |
| "institutional engagement" (lowercase, line 8 + 215) | 2 | Meta description + Area 05 description | ✓ PASS — descriptive phrase, NOT product name |
| "financial intelligence" (lowercase, descriptive, lines 8, 100, 104, 128, 190) | 5 | Meta + hero + culture + area descriptions | ✓ PASS — descriptive adjective use |
| "governed AI" (lines 128, 197) | 2 | Culture card 02 + Intelligence area description | ✓ PASS — descriptive capability language, not taxonomy |

**Layer 1.10 verdict: PASS** — Zero D.10 confirmed. The only REVIEW item is "Institutional Intelligence Products" in footer copyright (line 368) — same descriptive-phrase pattern seen on Deltas 24, 25, 26. Leans acceptable.

### Layer 1 Overall Verdict: **PASS**

Zero confirmed defects. Zero D.1, D.2, D.3, D.4, D.5, D.6, D.7, D.8, D.9, D.11, D.13, D.14. Zero "every claim" FORBID, zero "verified Intelligence Object" FORBID variant. Only 1 REVIEW item (footer copyright "Institutional Intelligence Products" — leans acceptable, same pattern as Deltas 24, 25, 26).

---

### Layer 5 — Do-Not-Touch Rules — **PASS**

Careers is NOT forced into Product, Platform, Explorer, Architecture, Solution, or Developer grammar. It has its own careers-page structure (Hero → Why Join → Culture → Areas of Work → Ownership → Hiring Process → CTA). Correct adaptation — the page is a recruiting page, not a content page.

### Layer 6 — Careers-Specific Rules

No Spec v6 Careers-specific UX test. Recommend adding:
`Hero (mission) → Why People Join (3 cards) → Culture (6 principles) → Areas of Work (5 areas + Open expression) → What You Will Own (4 ownership cards + early-stage disclaimer) → How We Hire (4-stage process) → CTA (email)`

### UX / Hiring Process Test

**Does the page help a potential candidate understand what ROUA is building (mission), the cultural principles, the areas of work, the ownership model, and the 4-stage hiring process — and submit an expression of interest via email?**

✓ **PASS** — The page follows a clear recruiting narrative:

1. **Hero:** "Build intelligence products that institutions can defend" — mission statement
2. **3 Why People Join cards:** Work That Has Weight / Hard Problems / Compounding Work — frames the value proposition
3. **6 Cultural Principles:** Provenance In Everything / Governance Before Output / Institutional Outcomes / Open Methodology / Long Horizons / Dissent Is Welcome — explicit culture articulation
4. **5 Areas of Work + Open Expression:** Engineering / Intelligence / Research / Operations / Institutional Engagement + Open Expression of Interest (dashed border, distinct visual)
5. **Early-stage disclaimer + 4 Ownership cards:** Build From First Principles / Own Outcomes / Work Across Disciplines / Challenge the System
6. **4-stage hiring process:** Initial Conversation (45-min) → Deep Dive (90-min) → Work Sample (paid) → Team Conversation (60-min)
7. **CTA:** Email careers@roua.com + Use Contact Form + Learn About ROUA

The page successfully delivers recruiting functionality with:
- **Strongest cultural-principles articulation on the audited site** — 6 explicit principles, each with descriptive paragraph
- **Strongest hiring-process disclosure on the audited site** — 4 stages with explicit durations, paid work sample, two-way evaluation framing
- **Honest early-stage disclosure** (line 237): "ROUA is an early-stage company. Many of these disciplines will begin as individual ownership areas and expand as the company grows."
- **Paid work sample** (line 289) — candidate-respect pattern: paid work sample, two-way evaluation
- **Two-way evaluation framing** (line 266): "The process is designed as much for you to evaluate us as for us to evaluate you. Every stage is a conversation — not a test."
- **Anti-sales-pressure framing** (line 215): "not SaaS salespeople"
- **Dissent-welcome principle** (lines 172-173): "We hire people who will tell us when we are wrong — and we listen."
- **Open Expression of Interest** (lines 218-222) — welcomes expressions outside the 5 areas: "We hire for trajectory, not just for posted openings."

---

## PART 3 — LAYER 4 DEFECT SCAN (D.1–D.14)

| ID | Defect | Present? | Details |
|---|---|---|---|
| D.1 | Dead `<style>` block | ✗ ABSENT | No `<style>` tag |
| D.1 variant | Dead CSS sub-blocks | N/A | No inline `<style>` at all |
| D.2 | Old-gold `rgba(201, 162, 39, ...)` | ✗ ABSENT | 0 instances |
| D.3 | Malformed HTML comment | ✗ ABSENT | 3/3 balanced, no nested |
| D.4 | "Audit-Ready" violation | ✗ ABSENT | 0 instances |
| D.5 | Competitor naming | ✗ ABSENT | |
| D.6 | `var(--gold)` mixing | ✗ ABSENT | 0 instances — 10th page with clean D.6 |
| D.7 | Deprecated raw hex | ✗ ABSENT | |
| D.8 | "real time" timing claim | ✗ ABSENT | "45-minute call" / "90-minute conversation" / "60-minute conversation" are meeting-duration descriptions, NOT D.8 timing/freshness claims |
| D.8 variant | "continuously monitored" / "24/7" | ✗ ABSENT | |
| D.9 (FORBID) | "confidence score/d" | ✗ ABSENT | 0 instances |
| D.9 (REVIEW) | "Confidence Scoring" / "Extraction Confidence" | ✗ ABSENT | 0 instances |
| D.10 | Old taxonomy as product name | ✗ ABSENT (1 REVIEW) | Zero confirmed. 1 REVIEW: "Institutional Intelligence Products" in footer copyright (line 368) — leans acceptable as descriptive phrase (same pattern as Deltas 24, 25, 26) |
| D.11 | Non-canonical raw hex | ✗ ABSENT | |
| D.12 | No direct source links | N/A | Careers is not an Explorer |
| D.13 | "24/7" timing claim | ✗ ABSENT | |
| D.14 | Timing claims in JS data files | ✗ ABSENT | No external data JS files; no inline `<script>` content (only `js` class add on line 4) |
| (FORBID) | "every claim" | ✗ ABSENT | 0 instances ("material claim" on line 148 is a different concept — materiality qualifier) |
| (FORBID variant) | "verified Intelligence Object" | ✗ ABSENT | 0 instances |

**No D.15+ new defect types found.** Spec v6 sufficient for Careers page.

---

## PART 4 — ACCEPTANCE VERDICT

## **PASS**

**4th page to PASS** (after Enterprise Delta 12, Platform Delta 17, Source Registry Delta 18 borderline).

Zero confirmed defects across all 14 defect types (D.1–D.14). Zero FORBID phrase violations. Zero D.15+ new defect types.

The only REVIEW item is "Institutional Intelligence Products" in footer copyright (line 368) — leans acceptable as descriptive phrase (same pattern as Deltas 24, 25, 26). This does not prevent PASS.

### What's CLEAN

- ✓ Zero D.1, D.1 variant, D.2, D.3, D.4, D.5, D.6, D.7, D.8, D.9, D.11, D.13, D.14
- ✓ Zero D.2, D.6, D.7, D.11 — **10th page with fully clean tokens** (tied with Contact Delta 26 as cleanest token page)
- ✓ Zero D.6 — **10th page with clean direct-token usage**
- ✓ Zero D.8 — no "real-time" / "within seconds" / "24/7" / "in minutes" timing claims
- ✓ Zero D.9 — no "confidence score" / "Extraction Confidence" / "Confidence Scoring" anywhere
- ✓ Zero D.4, D.5, D.13 — no "audit-ready", no competitor naming, no "24/7"
- ✓ Zero "every claim" FORBID, zero "verified Intelligence Object" FORBID variant
- ✓ Zero "Trust Promise" / "Provenance Immutability" / "SOC 2" / "ISO 27001" / "continuously monitored"
- ✓ HTML integrity ALL PASS (93/93 divs, 7/7 sections, 3/3 comments)
- ✓ Active nav on Company (correct — Careers is under Company)
- ✓ No external JS data files (D.14 N/A)
- ✓ No inline `<script>` content (only `js` class add on line 4)
- ✓ No ambient motion (no canvas, no Three.js, no GSAP)
- ✓ **Strongest cultural-principles articulation on the audited site** — 6 explicit principles, each with descriptive paragraph. Principle 01 "Provenance In Everything" directly echoes the Spec's Provenance canonical term.
- ✓ **Strongest hiring-process disclosure on the audited site** — 4 stages with explicit durations (45-min / 90-min / paid / 60-min), paid work sample, two-way evaluation framing
- ✓ **Honest early-stage disclosure** (line 237): "ROUA is an early-stage company. Many of these disciplines will begin as individual ownership areas and expand as the company grows."
- ✓ **Paid work sample** (line 289) — candidate-respect pattern: paid work sample, two-way evaluation
- ✓ **Two-way evaluation framing** (line 266): "The process is designed as much for you to evaluate us as for us to evaluate you. Every stage is a conversation — not a test."
- ✓ **Anti-sales-pressure framing** (line 215): "not SaaS salespeople"
- ✓ **Dissent-welcome principle** (lines 172-173): "We hire people who will tell us when we are wrong — and we listen."
- ✓ **Open Expression of Interest** (lines 218-222) — welcomes expressions outside the 5 areas: "We hire for trajectory, not just for posted openings."
- ✓ "Governed Intelligence Object" / "governed intelligence" pattern respected — no "Verified Intelligence Object"
- ✓ "Versioned Provenance" canonical term pattern respected — no "Provenance Immutability" (Principle 01 "Provenance In Everything" uses canonical "Provenance" term)
- ✓ "45-minute call" / "90-minute conversation" / "60-minute conversation" are ACCEPTABLE — meeting-duration descriptions, NOT D.8 timing/freshness claims (per Delta 20 + Delta 26 clarification)
- ✓ "material claim" (line 148) is the page's cultural principle — distinct from "every claim" FORBID phrase (materiality qualifier)

---

## PART 5 — CROSS-REPORT COMPARISON

| Aspect | Enterprise (12) | Platform (17) | Source Registry (18) | Methodology (19) | Infrastructure (20) | Product Experience (21) | Developers (22) | Trading Platform (23) | Financial Intelligence (24) | Financial Media (25) | Contact (26) | **Careers (27)** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Lines | 515 | 718 | 551 | 552 | 596 | 1144 | 754 | 478 | 584 | 455 | 366 | **375** |
| Sections | 10 | 12 | 10 | 12 | 7 | 12 | 11 | 10 | 12 | 10 | 5 | **7** |
| Inline `<style>` | Absent | Present (~78) | Absent | Absent | Absent | Present (~274) | Present (~152, partial dead) | Absent | Absent | Absent | Absent | **Absent** |
| Inline `<script>` (content) | Absent | Absent | Absent | Absent | Absent | Absent | Present (IntersectionObserver) | Absent | Absent | Absent | Present (mailto handler) | **Absent** |
| D.1 / variant | Absent | Absent | Absent | Absent | Absent | Absent | Variant | Absent | Absent | Absent | Absent | **Absent** |
| D.2 | 0 | 0 | 0 | 0 | 3 | 1 | 3 | 2 | 1 | 0 | 0 | **0** |
| D.4 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | **0** |
| D.5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | **0** |
| D.6 | 0 | 0 | 0 | 18 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | **0** |
| D.7 | 0 | 0 | 0 | 0 | 0 | 0 | 1 (REVIEW) | 0 | 0 | 0 | 0 | **0** |
| D.8 (exact) | 0 | 0 | 0 (REVIEW) | 0 | 0 | 0 | 2 | 0 | 0 | 1 | 0 | **0** |
| D.8 (variant) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 (+1 REVIEW) | 0 | **0** |
| D.9 (any) | 0 | 0 | 0 | 7 | 2 | 1 (acceptable) | 5 | 0 | 0 | 0 | 1 (REVIEW) | **0** |
| D.10 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 6 | 6 | 1 | 1 | **0 (+ 1 REVIEW)** |
| D.11 | 0 | 0 | 0 | 0 | 0 | 15 | 9 | 0 | 0 | 0 | 0 | **0** |
| D.13 ("24/7") | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | **0** |
| FORBID ("every claim") | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 4 | 0 | **0** |
| FORBID variant ("verified Intelligence Object") | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | **0** |
| Total defects | 0 | 0 | 0 (+1 REVIEW) | 2 + 2 REVIEW | 3 + 2 REVIEW | 18 + 4 + 1 | 15 + 1 + 1 | 8 + 2 REVIEW | 12 + 1 REVIEW | 7 + 1 REVIEW | 1 + 1 REVIEW (+ 2 REVIEW) | **0 (+ 1 REVIEW)** |
| Verdict | **PASS** | **PASS** | **FAIL (borderline)** | **FAIL** | **FAIL** | **FAIL** | **FAIL** | **FAIL** | **FAIL** | **FAIL** | **FAIL** | **PASS** |

### Key Insights

1. **Careers is the 4th page to PASS** (after Enterprise Delta 12, Platform Delta 17, Source Registry Delta 18 borderline). It is the **cleanest PASS** in the audit set — zero confirmed defects across all 14 defect types, zero FORBID phrase violations. Source Registry (Delta 18) was borderline PASS with 1 D.8 REVIEW variant; Careers has zero confirmed and zero REVIEW leaning FORBID (only 1 D.10 REVIEW leaning acceptable).
2. **Cleanest token page in the audit set** (tied with Contact Delta 26) — zero D.2, D.6, D.7, D.11. 10th page with fully clean tokens.
3. **Zero inline `<script>` content** — only the `js` class add on line 4. No mailto handler, no IntersectionObserver, no inline JavaScript logic. The page is structurally simpler than Contact (Delta 26) which had a mailto handler.
4. **Strongest cultural-principles articulation on the audited site** — 6 explicit principles, each with a descriptive paragraph. Principle 01 "Provenance In Everything" directly echoes the Spec's Provenance canonical term. Principle 02 "Governance Before Output" echoes the Spec's "Governance Precedes Output" (Methodology Delta 19 principle). Principle 06 "Dissent Is Welcome" is the strongest anti-groupthink framing on the audited site.
5. **Strongest hiring-process disclosure on the audited site** — 4 stages with explicit durations (45-min / 90-min / paid / 60-min), paid work sample, two-way evaluation framing. No other audited page discloses a hiring process this explicitly.
6. **Honest early-stage disclosure** — line 237: "ROUA is an early-stage company. Many of these disciplines will begin as individual ownership areas and expand as the company grows." This is the strongest company-stage honesty on the audited site.
7. **Paid work sample + two-way evaluation** — line 289: "A paid work sample — a real problem relevant to the role, scoped to a reasonable time commitment. We pay for your time." + line 266: "The process is designed as much for you to evaluate us as for us to evaluate you. Every stage is a conversation — not a test." This is the strongest candidate-respect pattern on the audited site.
8. **"material claim" ≠ "every claim"** — The page uses "material claim" (line 148) as a cultural principle: "If you make a material claim — in code, design, research, or a meeting — be ready to show the evidence behind it." This is distinct from the "every claim" FORBID phrase — "material" is a materiality qualifier (only claims that matter materially require evidence), not a universal quantifier. ACCEPTABLE.
9. **Meeting-duration language is ACCEPTABLE** — "45-minute call" (line 273), "90-minute conversation" (line 281), "60-minute conversation" (line 297) are hiring-stage durations, NOT D.8 timing/freshness claims. Confirms Delta 20 + Delta 26 clarification: operational-duration language is NOT D.8.
10. **No D.15+ new defect types found** — Spec v6 sufficient for Careers page. The page is clean enough that no new defect patterns emerge.

---

## PART 6 — RECOMMENDED FIX

### No Phase 1 Repairs Required

Zero confirmed defects. No fixes needed.

### Phase 2 — REVIEW Resolutions (optional, ~1 minute, team decision)

| Step | Fix | Line(s) | Effort |
|---|---|---|---|
| 27.1 | **D.10 REVIEW** — If team decides "Institutional Intelligence Products" (line 368 footer copyright) leans acceptable as descriptive phrase, no change needed. If team decides to align for consistency across all pages, replace with "institutional intelligence products" (lowercase) or "evidence infrastructure products". | 368 | ~1 min (same pattern as Deltas 24, 25, 26 — if team aligns all 4 pages, this is a batch fix) |

**Total repair budget for Careers: 0 minutes (Phase 1) + ~1 minute (Phase 2 optional) = 0–1 minute.**

Careers PASSES without any Phase 1 fixes. The Phase 2 REVIEW item is the same footer-copyright pattern seen on Deltas 24, 25, 26 — if the team decides to align all 4 pages, it's a single batch fix across 4 files.

---

## PART 7 — SPEC v7 INPUT

Careers surfaces two items relevant for Spec v7 (do NOT implement now — record for cumulative review after all audits):

1. **"material claim" vs "every claim" distinction** — Careers uses "material claim" (line 148) as a cultural principle, which is distinct from the "every claim" FORBID phrase. "Material" is a materiality qualifier (only materially-relevant claims require evidence), not a universal quantifier. Spec v7 should clarify that "material claim" / "material claims" is ACCEPTABLE (materiality qualifier), while "every claim" / "all claims" is FORBID (universal quantifier). This is a nuance that the current Spec v6 does not explicitly address.
2. **Cultural-principles articulation pattern** — Careers' 6-principle structure (Provenance In Everything / Governance Before Output / Institutional Outcomes / Open Methodology / Long Horizons / Dissent Is Welcome) is the strongest cultural-principles articulation on the audited site. Principle 01 and 02 directly echo Spec canonical terms (Provenance, Governance Precedes Output). **Recommend adopting as canonical reference** in Spec v7 Layer 1 (Company Page Patterns subsection) for any company/culture page. The pattern: 6 principles, each with H4 title + descriptive paragraph, using canonical terminology where applicable.

No other Spec v7 changes triggered by Careers. No new defect types (D.15+).

---

*End of Delta Report 27. Careers PASSES — 4th page to PASS (after Enterprise, Platform, Source Registry borderline). Zero confirmed defects across all 14 defect types (D.1–D.14). Zero FORBID phrase violations. Zero D.15+ new defect types. Cleanest PASS in the audit set — zero confirmed + zero REVIEW leaning FORBID (only 1 D.10 REVIEW leaning acceptable, same footer-copyright pattern as Deltas 24, 25, 26). 10th page with fully clean tokens. Strongest cultural-principles articulation, strongest hiring-process disclosure, strongest candidate-respect pattern (paid work sample + two-way evaluation), and strongest company-stage honesty on the audited site. No Phase 1 fixes required. Spec v6 sufficient. Total repair budget: 0–1 minute (optional Phase 2 batch fix across 4 pages).*

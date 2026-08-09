# Delta Report 26 — `contact.html` vs Product Family Consolidation Spec v6

> **Status:** Company / Contact page test. Tests Spec v6 against a Company-category page that serves as the institutional briefing-request entry point.
> **Audited file:** `/home/z/my-project/rouaa-corporate/rouaa-web/contact.html` (366 lines)
> **Reference:** `PRODUCT-FAMILY-CONSOLIDATION-SPEC.md` v6 (commit `d60ec70`)
> **Method:** No code modification. Full cumulative audit across ALL implementation layers (HTML + inline styles + inline `<script>` block + JS content strings + content claims).
> **Acceptance Verdict:** **FAIL** — 2 confirmed defect types (D.9 REVIEW leans FORBID × 1, D.10 × 1) + 0 D.15+ new defect types.

---

## PART 0 — CONTACT'S ACTUAL INSTITUTIONAL FUNCTION

Contact is a **Company / Briefing Request page** — it serves as the institutional briefing-request entry point. Its function is explicitly NOT a product page, NOT a solution page, NOT a platform page — it is the **conversion page** where institutional buyers submit a structured briefing request through a 3-stage process (Product & Workflow Fit → Workflow Review → Deployment Discussion).

The page's defining claim — "The objective is a clear fit assessment — what ROUA can support, what it cannot, and what deployment would require." (line 107) — positions it as the **honest-fit-assessment page**: institutions can request a briefing knowing that ROUA will tell them if it's not a fit during Stage 01.

### Inferred UX Test for Contact

**Can the institutional buyer quickly submit a structured briefing request — choosing their product interest, deployment context, and message — and understand the 3-stage briefing process, with honest expectation-setting that ROUA will say no if it's not a fit?**

Chain: `Hero (briefing request + 3-stage process) → What A Briefing Can Cover (4 cards) → What To Expect (3 stages) → Briefing Form (7 fields + mailto submit) → Direct Contact (3 emails)`

### Page Structure (5 sections)

1. **Page Hero** — "Request a product briefing" + 3-stage process summary (Product fit → Workflow review → Deployment discussion)
2. **What A Briefing Can Cover** — 4 cards: Product Fit / Evidence Requirements / Deployment Model / Institutional Workflow
3. **What To Expect** — 3 stage cards: Stage 01 Product & Workflow Fit (30-min) / Stage 02 Workflow Review (60-min) / Stage 03 Deployment Discussion
4. **Briefing Form** — 7-field form (Name / Work Email / Organization / Role / Interest / Deployment Context / Message) + inline `<script>` mailto handler + success message
5. **Direct Contact** — 3 email cards: Institutional Briefings / Partnerships & Distribution / Press & Media Inquiries

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
| **Inline `<script>` block** | ✓ PRESENT (lines 243–280, ~38 lines) | `submitBriefing(e)` function — builds mailto link from form data, opens user's email client, shows success message. **CLEAN** — no forbidden phrases, no timing claims, no confidence strings. Explicit honest framing in comments (lines 266, 272): "This is the honest path: the user sees their email client open and must actually send the email" / "We do NOT claim the email was sent — only that the client was opened." |
| **External JS data files** | ✗ ABSENT | No products.js / catalog-data.js etc. — D.14 N/A |

### 1.2 Token Usage

| Token Family | Usage | Verdict |
|---|---|---|
| `--roua-*` aliases | Extensive use (text-primary, text-secondary, text-muted, surface, surface-border, bg-secondary, accent, accent-subtle, accent-border, radius-md) | ✓ Correct — broad token vocabulary |
| `var(--gold)` direct (D.6) | **0 instances** | ✓ **D.6 absent** — ninth page with zero D.6 |
| `rgba(201, 162, 39, ...)` (OLD gold, D.2) | **0 instances** | ✓ **D.2 absent** |
| Raw hex values (D.7) | **0 instances** | ✓ D.7 absent |
| Non-canonical hex (D.11) | **0 instances** | ✓ D.11 absent |

**Token verdict: PASS.** Zero D.2, D.6, D.7, D.11 — **ninth page with fully clean tokens** (after Enterprise, Platform, Source Registry, Infrastructure Report, Methodology [D.6-only], Product Experience [D.6 clean], Trading Platform, Financial Intelligence, Financial Media [D.6-only]). Contact is the **cleanest token page in the audit set** — zero token-family violations.

### 1.3 Page Structure

```
Navigation (lines 18–91)
1. Page Hero — .page-hero (lines 93–110)
2. What A Briefing Can Cover — 4 .card (lines 112–139)
3. What To Expect — 3 .card (lines 141–168)
4. Briefing Form — <form> + 7 fields + inline <script> (lines 170–282)
5. Direct Contact — 3 .card (lines 284–306)
Footer (lines 308–361)
```

- `<section>` count: **5**
- `<div>` balance: 59 / 59 ✓ PASS
- `<section>` balance: 5 / 5 ✓ PASS
- HTML comment balance: 7 / 7 ✓ PASS
- `<form>` balance: 1 / 1 ✓ PASS
- `<input>` count: 4
- `<select>` balance: 2 / 2 ✓ PASS
- `<textarea>` balance: 1 / 1 ✓ PASS
- `<button>` balance: 6 / 6 ✓ PASS (1 form submit + 5 nav-toggle/buttons)
- `<option>` count: 15

### 1.4 HTML Integrity — ALL PASS

| Check | Result |
|---|---|
| `<div>` balance | 59 / 59 ✓ PASS |
| `<section>` balance | 5 / 5 ✓ PASS |
| HTML comment balance | 7 / 7 ✓ PASS |
| `<form>` / `<select>` / `<textarea>` / `<button>` balance | All balanced ✓ PASS |
| Broken internal anchors | None ✓ (no `href="#..."` internal anchors; form uses `id="form"` for reference, not anchor navigation) |
| Dead `<style>` block (D.1) | ✗ ABSENT |
| Malformed comment (D.3) | ✗ ABSENT |

### 1.5 Unique Structural Elements

- **Active nav state** on Company dropdown (line 71) — correct (Contact is under Company, line 81: `<a href="contact.html" class="nav-dropdown-link">Contact</a>`)
- **3-stage briefing process** (lines 100–107, 148–161) — explicit process disclosure: Product fit → Workflow review → Deployment discussion. Each stage card has duration (30-min / 60-min / conversation) and outcome statement.
- **Honest no-fit disclosure** (line 164): "If ROUA's products are not the right fit, we will tell you during Stage 01 — and recommend what would be." — strongest anti-forced-fit disclaimer on the audited site.
- **7-field structured briefing form** (lines 179–237) — Name / Work Email / Organization / Role / Interest (8 options) / Deployment Context (5 options) / Message. Interest dropdown includes canonical product names (Investment Intelligence / Market & Trading Intelligence / Risk Intelligence / Media Intelligence / Developer Platform) + solution labels (Trading Desks / Investment Firms) + "Not sure — need guidance".
- **Inline mailto handler** (lines 243–280) — `submitBriefing(e)` function builds a mailto link from form data and opens the user's email client. **Explicit honest framing in code comments** (lines 266, 272): "This is the honest path: the user sees their email client open and must actually send the email for the request to reach ROUA." / "We do NOT claim the email was sent — only that the client was opened." This is the **strongest honest-form pattern on the audited site** — the form does not pretend to submit server-side; it transparently opens the email client.
- **Honest success message** (lines 238–242) — "Your email client should have opened." (not "Your request was sent") + "If it did not, please email us directly" + "We will review the workflow, product area, and deployment context you provided. If ROUA is not a fit, we will say so."
- **3 Direct Contact emails** (lines 291–304) — institutional@roua.com / partnerships@roua.com / press@roua.com — direct email access without requiring form submission.
- **Form field option D.10 check** — Interest dropdown (lines 204–213) uses canonical product names (Investment Intelligence / Market & Trading Intelligence / Risk Intelligence / Media Intelligence / Developer Platform) + canonical solution labels (Trading Desks / Investment Firms) + "Not sure — need guidance". **No D.10 violations in form options.**

---

## PART 2 — ACCEPTANCE CONTRACT EVALUATION (Spec v6)

### Layer 1 — Canonical Baseline

#### 1.1 Token System — **PASS**

Zero D.2, D.6, D.7, D.11 — **ninth page with fully clean tokens**. All `--roua-*` aliases used correctly.

#### 1.2 Container & Layout — **PASS**
#### 1.3 Navigation — **PASS** (active nav on Company, 6-link Products, 7-link Solutions, 4-link Experience, mobile hamburger)
#### 1.4 Buttons — **PASS**
#### 1.5 Footer — **PASS** (1 brand + 5 footer-col = 6 total, no Channels column)
#### 1.6 Card Hierarchy — **PASS** (uses `.card`, `.eyebrow`, `.section-header`, `.cta-buttons` — all canonical v7 components)
#### 1.7 Motion — **PASS** (zero ambient motion — no canvas, no Three.js, no GSAP, no reveal-on-scroll)
#### 1.8 Typography — **PASS**

#### 1.9 Trust Grammar (Forbidden Phrases)

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
| **"Confidence Scoring" (D.9 REVIEW leans FORBID)** | **1 instance** (line 127) | ⚠ **REVIEW leans FORBID** — see analysis below |
| "Extraction Confidence" (D.9 REVIEW) | 0 | ✓ PASS |
| "SOC 2" / "ISO 27001" | 0 | ✓ PASS |
| "24/7" (D.13) | 0 | ✓ PASS |
| "continuously monitored" / "monitored continuously" | 0 | ✓ PASS |
| Competitor naming (D.5) | 0 | ✓ PASS |
| "VERIFIED INTELLIGENCE OBJECT" / "verified Intelligence Object" (FORBID + variant) | 0 | ✓ PASS |
| "30-minute call" / "60-minute structured walkthrough" (lines 151, 155) | 2 | ✓ ACCEPTABLE — meeting-duration descriptions, NOT D.8 timing/freshness claims. These describe how long a briefing stage takes, not how fast intelligence arrives. |
| "About two minutes" (line 175, form H2) | 1 | ✓ ACCEPTABLE — form-fill-time estimate, NOT D.8 timing/freshness claim. Describes user effort, not intelligence delivery. |

**D.9 "Confidence Scoring" REVIEW analysis (1 instance, line 127):**

```html
<div class="card text-center">
  <h4 style="margin-bottom: 12px; color: var(--roua-accent);">Evidence Requirements</h4>
  <p style="font-size: 14px;">Source hierarchy, evidence chain structure, confidence scoring, and how ROUA handles sources your institution cares about — central banks, regulators, statistical agencies, exchanges, issuers, filings, and other authoritative sources.</p>
</div>
```

**Verdict: REVIEW leans FORBID.** "Confidence scoring" is listed as a capability that the briefing can cover — a capability description, not an illustrative example. Per Spec D.9 rule, "Confidence Scoring" is REVIEW leans FORBID (capability description). The page lists it alongside "Source hierarchy" and "evidence chain structure" as evidence-requirement topics — describing what ROUA can demonstrate, not illustrating a specific confidence score.

**Classification:** Per Delta 22 (Developers) precedent, "Confidence Scoring" as a capability component leans FORBID. Per Delta 20 (Infrastructure Report) precedent, "Confidence scoring" listed as a Governance Controls component leans FORBID. Contact's usage is the same pattern — listing "confidence scoring" as a briefing topic (capability description). Should be replaced with "confidence signals" (canonical Methodology phrasing) or "confidence thresholds" to align with Spec v6/v7 direction.

#### 1.10 Taxonomy (Full Content Scan) — **FAIL (D.10, 1 instance)**

| Term | Count | Context | Verdict |
|---|---|---|---|
| **"trading intelligence" (lowercase, in meta description)** | **1 instance** (line 8) | Meta description: "Request an institutional briefing on ROUA's financial intelligence products, evidence infrastructure, trading intelligence, deployment models, and workflow integration." | ✗ **D.10 VIOLATION** — see analysis below |
| "Trading Intelligence" (standalone, as product/page name, capitalized) | 0 | — | ✓ PASS |
| "Market & Trading Intelligence" | 3 (lines 33, 206, 320) | Nav + form Interest dropdown + footer | ✓ PASS — canonical product name |
| "Investment Intelligence" | 3 (lines 31, 205, 318) | Nav + form Interest dropdown + footer | ✓ PASS — canonical product name |
| "Risk Intelligence" | 2 (lines 32, 207) | Nav + form Interest dropdown | ✓ PASS — canonical product name |
| "Media Intelligence" | 2 (lines 34, 208) | Nav + form Interest dropdown | ✓ PASS — canonical product name |
| "Developer Platform" | 3 (lines 35, 209, 322) | Nav + form Interest dropdown + footer | ✓ PASS — canonical product name |
| "Trading Desks" (solution label) | 1 (line 210) | Form Interest dropdown | ✓ PASS — canonical solution label |
| "Investment Firms" (solution label) | 1 (line 211) | Form Interest dropdown | ✓ PASS — canonical solution label |
| "Trading" (standalone, in Product Fit card list, line 123) | 1 | "Which ROUA intelligence products — Investment, Market, Risk, Media, Trading, or Developer — map to your institution's decisions" | ⚠ **REVIEW leans acceptable** — see analysis below |
| "Institutional Intelligence" (standalone, as product/page name) | 0 | — | ✓ PASS |
| "institutional intelligence products" (lowercase, descriptive) | 2 (lines 314, 358) | Footer brand description + copyright tagline | ✓ PASS — descriptive adjective use |
| "Institutional Intelligence Products" (capitalized, footer copyright) | 1 (line 358) | Footer copyright | ⚠ **REVIEW leans acceptable** — descriptive phrase "Institutional Intelligence Products Powered by Evidence Infrastructure", NOT standalone product name. Same pattern as Financial Intelligence (Delta 24) and Financial Media (Delta 25). Leans acceptable as descriptive. |
| "Developer APIs" | 0 | — | ✓ PASS |
| "financial intelligence products" (lowercase, descriptive, line 8 meta) | 1 | Meta description | ✓ PASS — descriptive adjective use |

**D.10 violation analysis — "trading intelligence" in meta description (1 instance, line 8):**

```html
<meta name="description" content="Request an institutional briefing on ROUA's financial intelligence products, evidence infrastructure, trading intelligence, deployment models, and workflow integration.">
```

**Verdict: D.10 VIOLATION.** "trading intelligence" (lowercase) appears in the meta description as a standalone product name, listed alongside "financial intelligence products", "evidence infrastructure", "deployment models", and "workflow integration". The canonical product name is "Market & Trading Intelligence" (used correctly in nav line 33, form line 206, footer line 320). The meta description uses the deprecated standalone "trading intelligence" instead of the canonical name.

**Classification:** Per Delta 23 (Trading Platform) precedent, "Trading Intelligence" as a standalone product/page name is D.10. The lowercase "trading intelligence" in meta description is a case variant — same concept, different capitalization. Classified as D.10 consistent with case-variant handling (per D.4 case-variant precedent and "verified Intelligence Object" case-variant precedent from Delta 21).

Should be replaced with "Market & Trading Intelligence" (canonical product name) or "trading intelligence products" (descriptive adjective use, lowercase) to align with Spec taxonomy.

**D.10 REVIEW — "Trading" standalone in Product Fit card list (line 123):**

```html
<p style="font-size: 14px;">Which ROUA intelligence products — Investment, Market, Risk, Media, Trading, or Developer — map to your institution's decisions, and which do not. Honest scope, not a forced fit.</p>
```

**Verdict: REVIEW leans acceptable.** "Trading" appears in a comma-separated list of product short-names: "Investment, Market, Risk, Media, Trading, or Developer". This is a **shorthand list pattern** — each item is a short-form reference to a canonical product name:
- "Investment" = "Investment Intelligence"
- "Market" = "Market & Trading Intelligence" (or "Market Intelligence")
- "Risk" = "Risk Intelligence"
- "Media" = "Media Intelligence"
- "Trading" = "Market & Trading Intelligence" (or "Trading Desks" solution)
- "Developer" = "Developer Platform"

The list is descriptive shorthand, NOT a standalone product name claim. The full canonical names appear in the form Interest dropdown (lines 205-211) and nav/footer. "Trading" here is a short-form reference in a conversational list, not a product identity claim. Leans acceptable as descriptive shorthand.

However, there's an ambiguity: "Trading" could refer to either "Market & Trading Intelligence" (product) or "Trading Desks" (solution). The list mixes product short-names (Investment, Market, Risk, Media, Developer) with what could be a solution short-name (Trading). If team decides this ambiguity is problematic, replace "Trading" with "Market & Trading" or "Market" for consistency with the product short-name pattern.

### Layer 1 Overall Verdict: **FAIL**

2 confirmed/review-level issues:
1. D.9 REVIEW leans FORBID (1 instance, line 127) — "confidence scoring" as capability description in Evidence Requirements card
2. D.10 violation (1 instance, line 8) — "trading intelligence" in meta description (lowercase case variant)

Plus 2 REVIEW leaning acceptable:
- D.10 REVIEW (line 123) — "Trading" in shorthand product list
- D.10 REVIEW (line 358) — "Institutional Intelligence Products" in footer copyright (descriptive phrase, same pattern as Deltas 24, 25)

---

### Layer 5 — Do-Not-Touch Rules — **PASS**

Contact is NOT forced into Product, Platform, Explorer, Architecture, Solution, or Developer grammar. It has its own contact-page structure (Hero → Briefing Coverage → What To Expect → Form → Direct Contact). Correct adaptation — the page is a conversion page, not a content page.

### Layer 6 — Contact-Specific Rules

No Spec v6 Contact-specific UX test. Recommend adding:
`Hero (3-stage process) → What A Briefing Can Cover (4 cards) → What To Expect (3 stages with durations) → Briefing Form (7 fields + mailto) → Direct Contact (3 emails)`

### UX / Briefing Request Test

**Does the page help the institutional buyer submit a structured briefing request — choosing product interest, deployment context, and message — and understand the 3-stage process with honest expectation-setting?**

✓ **PASS** — The page follows a clear briefing-request narrative:

1. **Hero:** 3-stage process summary (Product fit → Workflow review → Deployment discussion) + honest objective: "what ROUA can support, what it cannot, and what deployment would require"
2. **4 Briefing Coverage cards:** Product Fit / Evidence Requirements / Deployment Model / Institutional Workflow — each card describes what the briefing can cover
3. **3 What To Expect stages:** Stage 01 (30-min Product & Workflow Fit) / Stage 02 (60-min Workflow Review) / Stage 03 (Deployment Discussion) — each with duration and outcome
4. **Honest no-fit disclosure** (line 164): "If ROUA's products are not the right fit, we will tell you during Stage 01 — and recommend what would be."
5. **7-field structured form:** Name / Work Email / Organization / Role / Interest (8 options) / Deployment Context (5 options) / Message
6. **Inline mailto handler:** Honest form pattern — opens user's email client, does not pretend server-side submission
7. **Honest success message:** "Your email client should have opened." (not "Your request was sent")
8. **3 Direct Contact emails:** institutional@roua.com / partnerships@roua.com / press@roua.com

The page successfully delivers briefing-request functionality with:
- **Strongest anti-forced-fit disclaimer on the audited site** (line 164): "If ROUA's products are not the right fit, we will tell you during Stage 01 — and recommend what would be."
- **Strongest honest-form pattern on the audited site** — inline mailto handler with explicit code comments (lines 266, 272): "This is the honest path" / "We do NOT claim the email was sent — only that the client was opened"
- **Honest success message** (line 239): "Your email client should have opened." (not "Your request was sent")
- **3-stage process disclosure** with durations and outcomes — institutions know what to expect
- **Direct email access** without requiring form submission

---

## PART 3 — LAYER 4 DEFECT SCAN (D.1–D.14)

| ID | Defect | Present? | Details |
|---|---|---|---|
| D.1 | Dead `<style>` block | ✗ ABSENT | No `<style>` tag |
| D.1 variant | Dead CSS sub-blocks | N/A | No inline `<style>` at all |
| D.2 | Old-gold `rgba(201, 162, 39, ...)` | ✗ ABSENT | 0 instances |
| D.3 | Malformed HTML comment | ✗ ABSENT | 7/7 balanced, no nested |
| D.4 | "Audit-Ready" violation | ✗ ABSENT | 0 instances |
| D.5 | Competitor naming | ✗ ABSENT | |
| D.6 | `var(--gold)` mixing | ✗ ABSENT | 0 instances — 9th page with clean D.6 |
| D.7 | Deprecated raw hex | ✗ ABSENT | |
| D.8 | "real time" timing claim | ✗ ABSENT | "30-minute call" / "60-minute walkthrough" / "About two minutes" are meeting/form-duration descriptions, NOT D.8 timing/freshness claims |
| D.8 variant | "continuously monitored" / "24/7" | ✗ ABSENT | |
| D.9 (FORBID) | "confidence score/d" | ✗ ABSENT | 0 instances |
| **D.9 (REVIEW leans FORBID)** | **"Confidence Scoring"** | **✓ PRESENT (1)** | Line 127 — "confidence scoring" listed as Evidence Requirements briefing topic (capability description) |
| D.9 (REVIEW) | "Extraction Confidence" | ✗ ABSENT | 0 instances |
| **D.10** | **Old taxonomy as product name** | **✓ PRESENT (1)** | Line 8 — "trading intelligence" (lowercase) in meta description, listed as standalone product name alongside "financial intelligence products", "evidence infrastructure", "deployment models" |
| D.10 (REVIEW) | "Trading" shorthand in product list | ⚠ REVIEW (1) | Line 123 — "Investment, Market, Risk, Media, Trading, or Developer" shorthand list. Leans acceptable as descriptive shorthand. |
| D.10 (REVIEW) | "Institutional Intelligence Products" footer | ⚠ REVIEW (1) | Line 358 — descriptive phrase in copyright, leans acceptable (same pattern as Deltas 24, 25) |
| D.11 | Non-canonical raw hex | ✗ ABSENT | |
| D.12 | No direct source links | N/A | Contact is not an Explorer |
| D.13 | "24/7" timing claim | ✗ ABSENT | |
| D.14 | Timing claims in JS data files | ✗ ABSENT | No external data JS files; inline `<script>` (lines 243–280) is CLEAN — no forbidden phrases, no timing claims, no confidence strings. Explicit honest framing in code comments. |

**No D.15+ new defect types found.** Spec v6 sufficient for Contact page.

---

## PART 4 — ACCEPTANCE VERDICT

## **FAIL**

Two confirmed/review-level issues:

1. **D.9 REVIEW leans FORBID** (1 instance, line 127) — "confidence scoring" listed as Evidence Requirements briefing topic (capability description). Should be replaced with "confidence signals" (canonical Methodology phrasing).
2. **D.10 violation** (1 instance, line 8) — "trading intelligence" (lowercase) in meta description, listed as standalone product name. Should be replaced with "Market & Trading Intelligence" (canonical product name) or "trading intelligence products" (descriptive adjective use).

Plus 2 REVIEW leaning acceptable:
- **D.10 REVIEW** (line 123) — "Trading" in shorthand product list, leans acceptable as descriptive shorthand
- **D.10 REVIEW** (line 358) — "Institutional Intelligence Products" in footer copyright, leans acceptable as descriptive phrase

### What's CLEAN

- ✓ Zero D.1, D.1 variant, D.2, D.3, D.4, D.5, D.6, D.7, D.8, D.11, D.13, D.14
- ✓ Zero D.2, D.6, D.7, D.11 — **ninth page with fully clean tokens** (cleanest token page in audit set)
- ✓ Zero D.6 — **ninth page with clean direct-token usage**
- ✓ Zero D.8 — no "real-time" / "within seconds" / "24/7" / "in minutes" timing claims
- ✓ Zero D.9 FORBID ("confidence score/d") and zero "Extraction Confidence"
- ✓ Zero D.4, D.5, D.13 — no "audit-ready", no competitor naming, no "24/7"
- ✓ Zero "every claim" FORBID, zero "VERIFIED INTELLIGENCE OBJECT" / "Trust Promise" / "Provenance Immutability" / "SOC 2" / "ISO 27001" / "continuously monitored"
- ✓ HTML integrity ALL PASS (59/59 divs, 5/5 sections, 7/7 comments, 1/1 form, 2/2 select, 1/1 textarea, 6/6 button)
- ✓ Active nav on Company (correct — Contact is under Company)
- ✓ No external JS data files (D.14 N/A)
- ✓ Inline `<script>` block (lines 243–280) is CLEAN — no forbidden phrases, no timing claims, no confidence strings
- ✓ No ambient motion (no canvas, no Three.js, no GSAP)
- ✓ **Strongest anti-forced-fit disclaimer on the audited site** (line 164): "If ROUA's products are not the right fit, we will tell you during Stage 01 — and recommend what would be."
- ✓ **Strongest honest-form pattern on the audited site** — inline mailto handler with explicit code comments: "This is the honest path" / "We do NOT claim the email was sent — only that the client was opened"
- ✓ **Honest success message** (line 239): "Your email client should have opened." (not "Your request was sent")
- ✓ **3-stage process disclosure** with durations (30-min / 60-min / conversation) and outcomes — institutions know what to expect
- ✓ **Direct email access** without requiring form submission (3 emails: institutional / partnerships / press)
- ✓ Form Interest dropdown uses canonical product names + canonical solution labels — no D.10 violations in form options
- ✓ "Governed Intelligence Object" / "governed intelligence" pattern respected — no "Verified Intelligence Object"
- ✓ "Versioned Provenance" canonical term pattern respected — no "Provenance Immutability"
- ✓ "30-minute call" / "60-minute structured walkthrough" / "About two minutes" are ACCEPTABLE — meeting/form-duration descriptions, NOT D.8 timing/freshness claims

---

## PART 5 — CROSS-REPORT COMPARISON

| Aspect | Enterprise (12) | Platform (17) | Source Registry (18) | Methodology (19) | Infrastructure (20) | Product Experience (21) | Developers (22) | Trading Platform (23) | Financial Intelligence (24) | Financial Media (25) | **Contact (26)** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Lines | 515 | 718 | 551 | 552 | 596 | 1144 | 754 | 478 | 584 | 455 | **366** |
| Sections | 10 | 12 | 10 | 12 | 7 | 12 | 11 | 10 | 12 | 10 | **5** |
| Inline `<style>` | Absent | Present (~78) | Absent | Absent | Absent | Present (~274) | Present (~152, partial dead) | Absent | Absent | Absent | **Absent** |
| Inline `<script>` (content) | Absent | Absent | Absent | Absent | Absent | Absent | Present (IntersectionObserver) | Absent | Absent | Absent | **Present (mailto handler, CLEAN)** |
| D.1 / variant | Absent | Absent | Absent | Absent | Absent | Absent | Variant | Absent | Absent | Absent | **Absent** |
| D.2 | 0 | 0 | 0 | 0 | 3 | 1 | 3 | 2 | 1 | 0 | **0** |
| D.4 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | **0** |
| D.5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | **0** |
| D.6 | 0 | 0 | 0 | 18 | 0 | 0 | 0 | 0 | 0 | 1 | **0** |
| D.7 | 0 | 0 | 0 | 0 | 0 | 0 | 1 (REVIEW) | 0 | 0 | 0 | **0** |
| D.8 (exact) | 0 | 0 | 0 (REVIEW) | 0 | 0 | 0 | 2 | 0 | 0 | 1 | **0** |
| D.8 (variant) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 (+1 REVIEW) | **0** |
| D.9 (any) | 0 | 0 | 0 | 7 | 2 | 1 (acceptable) | 5 | 0 | 0 | 0 | **1 (REVIEW leans FORBID)** |
| D.10 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 6 | 6 | 1 | **1 (+ 2 REVIEW)** |
| D.11 | 0 | 0 | 0 | 0 | 0 | 15 | 9 | 0 | 0 | 0 | **0** |
| D.13 ("24/7") | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | **0** |
| FORBID ("every claim") | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 4 | **0** |
| FORBID variant ("verified Intelligence Object") | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | **0** |
| Total defects | 0 | 0 | 0 (+1 REVIEW) | 2 + 2 REVIEW | 3 + 2 REVIEW | 18 + 4 + 1 | 15 + 1 + 1 | 8 + 2 REVIEW | 12 + 1 REVIEW | 7 + 1 REVIEW | **1 + 1 REVIEW (+ 2 REVIEW)** |
| Verdict | **PASS** | **PASS** | **FAIL (borderline)** | **FAIL** | **FAIL** | **FAIL** | **FAIL** | **FAIL** | **FAIL** | **FAIL** | **FAIL** |

### Key Insights

1. **Contact is the CLEANEST page in the audit set so far** — only 1 confirmed defect (D.10 line 8) + 1 D.9 REVIEW leaning FORBID + 2 D.10 REVIEW leaning acceptable. Zero D.1, D.2, D.4, D.5, D.6, D.7, D.8, D.11, D.13, D.14. Zero "every claim" FORBID, zero "verified Intelligence Object" FORBID variant. This is the **lowest defect count** of any audited page (tied with Source Registry Delta 18 borderline, but Source Registry had a D.8 REVIEW variant).
2. **Cleanest token page in the audit set** — zero D.2, D.6, D.7, D.11. Ninth page with fully clean tokens. No `var(--gold)`, no `rgba(201,162,39,...)`, no raw hex, no deprecated VISUAL-IDENTITY hex.
3. **Strongest honest-form pattern on the audited site** — inline mailto handler (lines 243–280) with explicit code comments: "This is the honest path: the user sees their email client open and must actually send the email" / "We do NOT claim the email was sent — only that the client was opened". The form does not pretend to submit server-side; it transparently opens the email client. This is a positive Spec contribution — recommend adopting as canonical reference for any form that does not have server-side processing.
4. **Strongest anti-forced-fit disclaimer on the audited site** — line 164: "If ROUA's products are not the right fit, we will tell you during Stage 01 — and recommend what would be." This is the strongest anti-sales-pressure framing on the audited site. Positive Spec contribution: recommend adopting as canonical reference for any conversion page.
5. **D.10 in meta description — first lowercase case variant** — Previous D.10 violations (Deltas 23, 24) used capitalized "Trading Intelligence" / "Institutional Intelligence" as page identity. Contact uses lowercase "trading intelligence" in meta description (line 8). Classified as D.10 case variant consistent with D.4 case-variant handling and "verified Intelligence Object" case-variant precedent (Delta 21).
6. **D.9 "Confidence Scoring" — 4th page with this REVIEW** — Methodology (Delta 19), Infrastructure Report (Delta 20), Developers (Delta 22), and now Contact (Delta 26) all have "Confidence Scoring" as REVIEW leaning FORBID. This reinforces the Spec v7 recommendation to tighten "Confidence Scoring" as leans FORBID. The canonical replacement "confidence signals" (Methodology phrasing) is consistently available.
7. **Meeting/form-duration language is ACCEPTABLE** — "30-minute call" (line 151), "60-minute structured walkthrough" (line 155), "About two minutes" (line 175) are meeting/form-duration descriptions, NOT D.8 timing/freshness claims. This confirms the Delta 20 clarification: status-truth and operational-duration language is NOT D.8. D.8 covers intelligence-delivery latency (real-time / within seconds / in minutes), not meeting durations or form-fill estimates.
8. **Form Interest dropdown taxonomy is CLEAN** — The 8-option Interest dropdown (lines 204–213) uses canonical product names (Investment Intelligence / Market & Trading Intelligence / Risk Intelligence / Media Intelligence / Developer Platform) + canonical solution labels (Trading Desks / Investment Firms) + "Not sure — need guidance". **No D.10 violations in form options.** This is the correct pattern for any taxonomy-referencing form element.
9. **Inline `<script>` is CLEAN** — The mailto handler (lines 243–280) contains no forbidden phrases, no timing claims, no confidence strings. The only content strings are functional ("Briefing Request — " subject prefix, "Opening email client…" button text, "Field" fallback label). Explicit honest framing in code comments. This is the cleanest inline `<script>` block in the audit set.
10. **No D.15+ new defect types found** — Spec v6 sufficient for Contact page.

---

## PART 6 — RECOMMENDED FIX

### Phase 1 — Defect Repairs (~2 minutes)

| Step | Fix | Line(s) | Effort |
|---|---|---|---|
| 26.1 | **D.10** — Replace "trading intelligence" with "Market & Trading Intelligence" (canonical product name) in meta description (line 8). | 8 | ~1 min |
| 26.2 | **D.9 REVIEW leans FORBID** — If team decides "confidence scoring" (line 127) leans FORBID as capability description, replace with "confidence signals" (canonical Methodology phrasing) or "confidence thresholds". | 127 | ~1 min |

### Phase 2 — REVIEW Resolutions (~1 minute, team decision)

| Step | Fix | Line(s) | Effort |
|---|---|---|---|
| 26.3 | **D.10 REVIEW** — If team decides "Trading" in shorthand product list (line 123) leans acceptable as descriptive shorthand, no change needed. If team decides the ambiguity (Trading = product or solution?) is problematic, replace "Trading" with "Market & Trading" or "Market" for consistency. | 123 | ~1 min |
| 26.4 | **D.10 REVIEW** — If team decides "Institutional Intelligence Products" (line 358 footer copyright) leans acceptable as descriptive phrase, no change needed. If team decides to align for consistency, replace with "institutional intelligence products" (lowercase) or "evidence infrastructure products". | 358 | ~1 min (same pattern as Deltas 24, 25) |

**Total Phase 1+P2 repair budget for Contact: ~3 minutes.**

If Phase 1 is applied (2 fixes), Contact moves from FAIL → PASS (assuming D.9 REVIEW item 26.2 is resolved in FORBID direction; if team accepts current "confidence scoring" as definitional, only D.10 fix needed for PASS).

---

## PART 7 — SPEC v7 INPUT

Contact surfaces three items relevant for Spec v7 (do NOT implement now — record for cumulative review after all audits):

1. **D.10 meta-description case variant** — Contact introduces "trading intelligence" (lowercase) in meta description as D.10 case variant. Previous D.10 violations (Deltas 23, 24) used capitalized forms. Spec v7 should clarify that D.10 covers all case variants (concept-based, not case-based) — consistent with D.4 case-variant handling and "verified Intelligence Object" case-variant precedent (Delta 21).
2. **Honest-form pattern (mailto handler)** — Contact's inline mailto handler with explicit code comments ("This is the honest path" / "We do NOT claim the email was sent") is the strongest honest-form pattern on the audited site. **Recommend adopting as canonical reference** in Spec v7 Layer 1 (Form Patterns subsection) for any form that does not have server-side processing. The pattern: transparently open email client, do not pretend server-side submission, honest success message ("email client should have opened", not "request was sent").
3. **Anti-forced-fit disclaimer pattern** — Contact's line 164 ("If ROUA's products are not the right fit, we will tell you during Stage 01 — and recommend what would be.") is the strongest anti-sales-pressure framing on the audited site. **Recommend adopting as canonical reference** in Spec v7 Layer 1 (Trust Grammar or Conversion Patterns) for any conversion page.

No other Spec v7 changes triggered by Contact. No new defect types (D.15+).

---

*End of Delta Report 26. Contact FAILS — 1 D.10 (meta description lowercase variant) + 1 D.9 REVIEW leans FORBID ("confidence scoring"). Despite the FAIL, Contact is the CLEANEST page in the audit set so far (lowest defect count) with the strongest honest-form pattern (mailto handler with explicit code comments), the strongest anti-forced-fit disclaimer, and the cleanest inline `<script>` block. Zero D.1, D.2, D.4, D.5, D.6, D.7, D.8, D.11, D.13, D.14. Zero "every claim" FORBID, zero "verified Intelligence Object" FORBID variant. Ninth page with fully clean tokens. No D.15+ new defect types. Spec v6 sufficient. Total Phase 1+P2 repair budget: ~3 minutes.*

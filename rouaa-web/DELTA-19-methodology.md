# Delta Report 19 — `methodology.html` vs Product Family Consolidation Spec v6

> **Status:** Platform / Methodology explanation page test. Tests Spec v6 against a methodology / governance-process explanation page that sits between Source Registry and Trust Framework.
> **Audited file:** `/home/z/my-project/rouaa-corporate/rouaa-web/methodology.html` (552 lines)
> **Reference:** `PRODUCT-FAMILY-CONSOLIDATION-SPEC.md` v6 (commit `d60ec70`)
> **Method:** No code modification. Full cumulative audit across ALL implementation layers (HTML + inline styles + JS content strings + content claims).
> **Acceptance Verdict:** **FAIL** — 2 confirmed defects (D.4 × 1, D.6 × 18) + 2 D.9 REVIEW items leaning FORBID.

---

## PART 0 — METHODOLOGY'S ACTUAL INSTITUTIONAL FUNCTION

Methodology is a **Platform / Methodology explanation page** — it documents the transformation path between Source Registry (where source material enters the system) and Trust Framework (the controls that make the workflow reviewable and auditable). The page explicitly disclaims what it is NOT: not Architecture (system internals) and not Trust Framework (control enforcement).

### Inferred UX Test for Methodology

**Can the institutional buyer understand how evidence is transformed into governed intelligence — the methodology path, including source hierarchy, confidence signals, verification workflow, governance rules, and output-type labeling?**

Chain: `Methodology Scope → Methodological Principles → Source Hierarchy → Confidence Signals → Verification Workflow → Governance Rules → Output Types → Methodology Limitations → Worked Example → Methodology Edge Cases`

### Page Structure (12 sections)

1. **Page Hero** — "How ROUA verifies, scores, and governs financial intelligence" — with explicit disclaimers about Architecture and Trust Framework
2. **Methodology Scope** — defines scope; visual scope-chain: `Source → Document → Fact → Event → Evidence → Governed Reasoning → Intelligence Object → Output`
3. **Methodological Principles** (3) — Provenance Is Structural / Governance Precedes Output / **Audit-Ready By Construction** (← D.4 violation)
4. **Source Hierarchy** (4 tiers) — Tier 1 (primary official) → Tier 4 (excluded by default)
5. **Confidence Signals** (4 factors) — Source Tier / **Extraction Confidence** / Corroboration / Recency
6. **Verification Workflow** (7 steps) — Source Detection → Audit Record Preserved
7. **Governance Rules** (6) — Source Hierarchy Enforcement / Evidence Eligibility / Intelligence Input Constraints / Analytical Traceability / Versioned Provenance / Audit Trail Completeness
8. **Output Types** (4) — Verified Fact / Detected Event / Derived Insight / Analytical Interpretation
9. **Methodology Limitations** — explicit boundary statement
10. **Worked Example** — illustrative ECB Rate Decision evidence record with 4 signals
11. **Methodology Edge Cases** (3) — Conflicting Evidence / Stale Source / Failed Extraction
12. **CTA** — Request Methodology Review / Research Institute / Architecture

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
| **External JS data files** | ✗ ABSENT | No products.js / catalog-data.js etc. — D.14 N/A |

### 1.2 Token Usage

| Token Family | Usage | Verdict |
|---|---|---|
| `--roua-*` aliases | Used in CSS classes (e.g. `--bg2`, `--dim`, `--dim2`, `--warning`, `--info`) | ✓ Correct (mostly via class definitions) |
| `var(--gold)` direct (D.6) | **18 instances** in inline styles | ✗ **D.6 PRESENT — major violation** |
| `rgba(201, 162, 39, ...)` (OLD gold, D.2) | **0 instances** | ✓ D.2 absent |
| Raw hex values (D.7) | **0 instances** | ✓ D.7 absent |
| Non-canonical hex (D.11) | **0 instances** | ✓ D.11 absent |

**Token verdict: FAIL.** Zero D.2, D.7, D.11 — but **18 D.6 violations**. The page does not use `var(--roua-accent)` anywhere in inline styles; every gold-colored heading, link, and accent span uses `var(--gold)` directly. This is the **highest D.6 instance count of any audited page so far** (Media was the previous D.6 reference, with fewer instances).

### 1.3 Page Structure

```
Navigation (lines 14–93)
1. Page Hero — .page-hero (lines 95–108)
2. Methodology Scope — .scope-box (lines 110–128)
3. Methodological Principles — .principle-grid (lines 130–152)
4. Source Hierarchy — .comparison-table (lines 154–192)
5. Confidence Signals — .grid-4 / .card-data (lines 194–233)
6. Verification Workflow — .workflow 7-step (lines 235–301)
7. Governance Rules — .grid-3 / .card-governance (lines 303–337)
8. Output Types — .output-taxonomy (lines 339–373)
9. Methodology Limitations — .limitations-box (lines 375–383)
10. Worked Example — .evidence-record (lines 385–444)
11. Methodology Edge Cases — .grid-3 / .card-governance (lines 446–475)
12. CTA (lines 477–490)
Footer (lines 492–547)
```

- `<section>` count: **12**
- `<div>` balance: 192 / 192 ✓ PASS
- `<section>` balance: 12 / 12 ✓ PASS
- HTML comment balance: 14 / 14 ✓ PASS
- `<h4>` count: 16

### 1.4 HTML Integrity — ALL PASS

| Check | Result |
|---|---|
| `<div>` balance | 192 / 192 ✓ PASS |
| `<section>` balance | 12 / 12 ✓ PASS |
| HTML comment balance | 14 / 14 ✓ PASS |
| Broken internal anchors | None ✓ |
| Dead `<style>` block (D.1) | ✗ ABSENT |
| Malformed comment (D.3) | ✗ ABSENT |

### 1.5 Unique Structural Elements

- **Active nav state** on Platform dropdown (line 34) — correct (Methodology is under Platform)
- **`.comparison-table`** used for Source Hierarchy (4 tiers) — canonical v7 component for tabular comparison
- **`.workflow`** with 7 numbered steps — canonical v7 component for sequential processes (matches Source Registry's Source Lifecycle)
- **`.evidence-record`** component (lines 394–441) — used for the worked example, with `evidence-signal-grid` (4 signals), `evidence-eligibility`, `evidence-provenance`. This is a **positive Spec-component adoption** — the same component used by Evidence Explorer and Source Registry's Sample Registry Entry
- **`.limitations-box`** (lines 378–381) — explicit methodology limitation statement. **Strongest trust-boundary moment on the page**: "ROUA methodology improves traceability, evidence quality, and governance of intelligence workflows. It does not replace institutional judgment, investment committees, or regulatory responsibilities."
- **`.output-taxonomy`** (lines 347–368) — 4 output types with clear distinction between Verified Fact / Detected Event / Derived Insight / Analytical Interpretation. This is **unique to Methodology** — no other audited page distinguishes output types this explicitly
- **Worked example** marked illustrative throughout: "illustrative example" badges on each signal (lines 412, 417, 422, 427) + footer note (line 442)
- **Edge Cases section** (lines 446–475) — explicit handling of conflict / staleness / failure. Unique institutional-trust pattern: "A methodology that only handles the ideal path is marketing. A methodology that documents how it handles conflict, staleness, and failure is auditable." (line 472)

---

## PART 2 — ACCEPTANCE CONTRACT EVALUATION (Spec v6)

### Layer 1 — Canonical Baseline

#### 1.1 Token System — **FAIL**

Zero D.2, D.7, D.11. **But 18 D.6 violations** (`var(--gold)` direct in inline styles). Should use `var(--roua-accent)` per Spec.

**Full list of D.6 violations:**

| # | Line | Context |
|---|---|---|
| 1 | 104 | Hero link to Architecture: `style="color:var(--gold);text-decoration:underline"` |
| 2 | 105 | Hero link to Trust Framework |
| 3 | 117 | Scope box link to Source Registry |
| 4 | 119 | Scope box link to Trust Framework |
| 5 | 205 | H4 "Source Tier" — Confidence Signals Factor 01 |
| 6 | 210 | H4 "Extraction Confidence" — Confidence Signals Factor 02 |
| 7 | 215 | H4 "Corroboration" — Confidence Signals Factor 03 |
| 8 | 220 | H4 "Recency" — Confidence Signals Factor 04 |
| 9 | 312 | H4 "Source Hierarchy Enforcement" |
| 10 | 316 | H4 "Evidence Eligibility" |
| 11 | 320 | H4 "Intelligence Input Constraints" |
| 12 | 324 | H4 "Analytical Traceability" |
| 13 | 328 | H4 "Versioned Provenance" |
| 14 | 332 | H4 "Audit Trail Completeness" |
| 15 | 438 | Provenance span in worked example |
| 16 | 457 | H4 "Conflicting Evidence" — Edge Case 01 |
| 17 | 462 | H4 "Stale Source" — Edge Case 02 |
| 18 | 467 | H4 "Failed Extraction" — Edge Case 03 |

#### 1.2 Container & Layout — **PASS**
#### 1.3 Navigation — **PASS** (active nav on Platform, 6-link Products, 7-link Solutions, mobile hamburger)
#### 1.4 Buttons — **PASS**
#### 1.5 Footer — **PASS** (1 brand + 5 footer-col = 6 total, no Channels column)
#### 1.6 Card Hierarchy — **PASS** (uses `.card-data`, `.card-governance`, `.evidence-record` — all canonical v7 components)
#### 1.7 Motion — **PASS** (zero ambient motion)
#### 1.8 Typography — **PASS**

#### 1.9 Trust Grammar (Forbidden Phrases)

| Phrase | Count | Verdict |
|---|---|---|
| "within seconds" / "in seconds" | 0 | ✓ PASS |
| "real-time" / "real time" | 0 | ✓ PASS |
| "instantly" / "instant" | 0 | ✓ PASS |
| "every claim" | 0 | ✓ PASS |
| "VERIFIED INTELLIGENCE OBJECT" | 0 | ✓ PASS |
| "Trust Promise" | 0 | ✓ PASS |
| "Provenance Immutability" | 0 | ✓ PASS |
| "confidence score" / "confidence scored" (D.9 FORBID) | 0 | ✓ PASS |
| "Confidence Scoring" (D.9 REVIEW leans FORBID) | 0 | ✓ PASS |
| "Extraction Confidence" (D.9 REVIEW, illustrative ok) | **7 instances** | ⚠ **REVIEW** — see analysis below |
| "scored independently" (D.9 variant — describes scoring act) | **1 instance** (line 172) | ⚠ **REVIEW leans FORBID** |
| "SOC 2" / "ISO 27001" | 0 | ✓ PASS |
| "24/7" | 0 | ✓ PASS |
| "continuously monitored" / "monitored continuously" | 0 | ✓ PASS |
| **"audit-ready" / "Audit-Ready" / "Audit Ready" (D.4)** | **1 instance** (line 147) | ✗ **FAIL** — methodology is NOT risk-intelligence.html (the only D.4 exception) |
| Competitor naming (Bloomberg / Reuters / Market Terminals / FactSet / Refinitiv) | 0 | ✓ PASS |

**D.4 violation analysis (line 147):**

```html
<div class="principle-card">
  <h4>Audit-Ready By Construction</h4>
  <p>Governed outputs are designed to be reconstructable through the evidence chain. From a published analysis back through the evidence chain to the original source document — for authorized auditors, reviewers, and institutional oversight teams, on demand.</p>
</div>
```

This is the H4 title of the third methodological principle. The phrase "Audit-Ready By Construction" is a hyphenated variant of "Audit-Ready" — exactly the D.4 pattern. The Spec D.4 rule: **"Audit-Ready" forbidden on all pages except `risk-intelligence.html`**.

Methodology is NOT the exception page. This is a clear, single-instance D.4 violation.

**D.9 "Extraction Confidence" analysis (7 instances):**

| Line | Text | Context | Classification |
|---|---|---|---|
| 172 | "Source authority is separate from extraction confidence, which is scored independently." | Source Hierarchy cell description | ⚠ **REVIEW leans FORBID** — uses "scored" verb for extraction confidence, which describes the act of scoring (close to "Confidence Scoring" REVIEW leans FORBID) |
| 206 | "Source authority is separate from extraction confidence — a Tier 1 source with a failed extraction still has high authority but low extraction confidence." | Confidence Signals Factor 01 description | **ACCEPTABLE** — descriptive capability text distinguishing authority from confidence |
| 210 | `<h4>Extraction Confidence</h4>` | Confidence Signals Factor 02 title (H4) | ⚠ **REVIEW leans FORBID** — used as capability factor name (not illustrative). The page itself uses the alternative phrasing "Extraction quality" in line 140 ("Extraction quality is recorded separately as a confidence signal") — suggesting "Extraction Quality" could replace "Extraction Confidence" as the factor name |
| 264 | "each fact linked to the document, the page, the paragraph, and stored with extraction confidence." | Verification Workflow step 03 description | **ACCEPTABLE** — descriptive workflow text |
| 280 | "Validation rules check source tier, extraction confidence, corroboration, and recency." | Verification Workflow step 05 description | **ACCEPTABLE** — listing the four factors |
| 415 | `<div class="evidence-signal-label">Extraction Confidence</div>` | Worked example signal label | **ACCEPTABLE** — illustrative context (page is explicitly marked "illustrative example" throughout) |
| 468 | "extraction confidence falls below the configured threshold (e.g., unstructured PDF, ambiguous table)" | Edge Case 03 (Failed Extraction) description | **ACCEPTABLE** — descriptive edge-case text |

**D.9 verdict: 2 instances lean FORBID** (line 172 "scored independently", line 210 H4 factor name). The other 5 instances are acceptable descriptive / illustrative uses.

**Notable positive trust-boundary on line 391:** "showing how the four confidence factors are recorded as signals, **not combined into a single score**." — actively distinguishes from composite scoring. This is the strongest anti-D.9 framing on the audited site so far.

#### 1.10 Taxonomy (Full Content Scan)

| Old term | Count | Context | Verdict |
|---|---|---|---|
| "Trading Intelligence" (alone) | 0 | — | ✓ PASS |
| "Market & Trading Intelligence" | 2 (lines 27, 504) | Nav + footer | ✓ PASS — canonical product name (per Spec taxonomy, NOT D.10) |
| "Institutional Intelligence" (alone, as product) | 0 | — | ✓ PASS |
| "institutional intelligence products" (lowercase) | 2 (lines 498, 544) | Footer brand description + copyright tagline | ✓ PASS — descriptive adjective use, NOT product name (per v5: descriptive = NOT D.10) |
| "Developer APIs" | 0 | — | ✓ PASS |

**Layer 1.10 verdict: PASS** — Zero D.10.

### Layer 1 Overall Verdict: **FAIL**

3 confirmed/review-level issues:
1. D.4 violation (line 147) — single instance
2. D.6 violation (18 instances) — major pattern across inline styles
3. D.9 REVIEW leans FORBID (2 instances: line 172 "scored independently", line 210 H4 factor name)

---

### Layer 5 — Do-Not-Touch Rules — **PASS**

Methodology is NOT forced into Product, Explorer, Architecture, or Solutions grammar. It has its own methodology-explanation structure (Scope → Principles → Hierarchy → Signals → Workflow → Rules → Output Types → Limitations → Worked Example → Edge Cases). Correct adaptation — the page explicitly disclaims what it is NOT (Architecture, Trust Framework).

### Layer 6 — Methodology-Specific Rules

No Spec v6 Methodology-specific UX test. Recommend adding:
`Methodology Scope → Methodological Principles → Source Hierarchy → Confidence Signals → Verification Workflow → Governance Rules → Output Types → Methodology Limitations → Worked Example → Methodology Edge Cases`

### UX / Methodology Test

**Does the page help the institutional buyer understand how evidence is transformed into governed intelligence — the methodology path?**

✓ **PASS** — The page follows a clear methodology narrative:

1. **Scope:** Explicitly defines what methodology covers (transformation path) and what it does NOT cover (Architecture = system internals; Trust Framework = control enforcement)
2. **3 Principles:** Provenance Is Structural / Governance Precedes Output / Audit-Ready By Construction (← D.4 violation in the third principle's title)
3. **Source Hierarchy:** 4 tiers with explicit governance treatment per tier — Tier 4 (social media, scrapers) excluded by default
4. **4 Confidence Factors:** Source Tier / Extraction Confidence / Corroboration / Recency — with explicit "no composite score unless institution configures documented formula" (line 228–229)
5. **7-step Verification Workflow:** Source Detection → Document Ingestion → Fact Extraction → Evidence Linking → Governance Validation → Knowledge Graph & Intelligence Object → Audit Record Preserved
6. **6 Governance Rules:** Source Hierarchy Enforcement / Evidence Eligibility / Intelligence Input Constraints / Analytical Traceability / Versioned Provenance / Audit Trail Completeness
7. **4 Output Types:** Verified Fact / Detected Event / Derived Insight / Analytical Interpretation — with explicit "ROUA labels each output with its type — so your institution does not treat an interpretation as if it were a verified fact" (line 370)
8. **Limitations:** "ROUA methodology improves traceability, evidence quality, and governance of intelligence workflows. It does not replace institutional judgment, investment committees, or regulatory responsibilities." (line 380) — strongest trust-boundary on the page
9. **Worked Example:** Illustrative ECB Rate Decision with 4 confidence signals, all marked illustrative
10. **3 Edge Cases:** Conflicting Evidence / Stale Source / Failed Extraction — explicit handling of non-ideal paths

The page successfully explains the methodology transformation path with explicit disclaimers, illustrative framing, and edge-case handling.

---

## PART 3 — LAYER 4 DEFECT SCAN (D.1–D.14)

| ID | Defect | Present? | Details |
|---|---|---|---|
| D.1 | Dead `<style>` block | ✗ ABSENT | No `<style>` tag |
| D.2 | Old-gold `rgba(201, 162, 39, ...)` | ✗ ABSENT | 0 instances |
| D.3 | Malformed HTML comment | ✗ ABSENT | 14/14 balanced, no nested |
| **D.4** | **"Audit-Ready" violation** | **✓ PRESENT (1)** | Line 147: `<h4>Audit-Ready By Construction</h4>` — methodology is NOT risk-intelligence.html (the only exception) |
| D.5 | Competitor naming | ✗ ABSENT | |
| **D.6** | **`var(--gold)` mixing** | **✓ PRESENT (18 instances)** | Major violation across all inline `color:var(--gold)` styles |
| D.7 | Deprecated raw hex | ✗ ABSENT | |
| D.8 | "real time" timing claim | ✗ ABSENT | |
| D.8 variant | "continuously monitored" / "24/7" | ✗ ABSENT | |
| D.9 (FORBID) | "confidence score/d" | ✗ ABSENT | 0 instances |
| D.9 (REVIEW leans FORBID) | "Confidence Scoring" | ✗ ABSENT | 0 instances |
| **D.9 (REVIEW)** | **"Extraction Confidence"** | **⚠ 7 instances** | 1 H4 factor name (line 210) + 1 illustrative signal label (line 415) + 5 descriptive text uses (lines 172, 206, 264, 280, 468). 2 of these lean FORBID: line 172 ("scored independently") + line 210 (H4 factor name) |
| D.10 | Old taxonomy as product name | ✗ ABSENT | "Market & Trading Intelligence" is canonical product name; "institutional intelligence products" is descriptive |
| D.11 | Non-canonical raw hex | ✗ ABSENT | |
| D.12 | No direct source links | N/A | Methodology is not an Explorer |
| D.13 | "24/7" timing claim | ✗ ABSENT | |
| D.14 | Timing claims in JS data files | ✗ ABSENT | No external data JS files |

**No D.15+ new defect types found.** Spec v6 sufficient for Methodology page.

---

## PART 4 — ACCEPTANCE VERDICT

## **FAIL**

Two confirmed defects + two D.9 REVIEW items leaning FORBID:

1. **D.4 violation** (line 147) — "Audit-Ready By Construction" H4 in Methodological Principles. Methodology is NOT the D.4 exception page (only `risk-intelligence.html` is).
2. **D.6 violation** (18 instances) — Every inline accent color in the page uses `var(--gold)` directly instead of `var(--roua-accent)`. **Highest D.6 instance count of any audited page so far**.
3. **D.9 REVIEW leans FORBID** (line 172) — "extraction confidence, which is scored independently" — uses "scored" verb for extraction confidence, describing the scoring act.
4. **D.9 REVIEW leans FORBID** (line 210) — `<h4>Extraction Confidence</h4>` used as a capability factor name (not illustrative). The page itself suggests "Extraction Quality" as an alternative phrasing in line 140.

### What's CLEAN

- ✓ Zero D.1, D.2, D.3, D.5, D.7, D.8, D.10, D.11, D.13, D.14
- ✓ Zero D.9 FORBID ("confidence score/d") and zero "Confidence Scoring"
- ✓ All forbidden phrases (VERIFIED INTELLIGENCE OBJECT, Trust Promise, Provenance Immutability, SOC 2, ISO 27001, 24/7, every claim, real-time, within seconds, instantly) absent
- ✓ HTML integrity ALL PASS (192/192 divs, 12/12 sections, 14/14 comments)
- ✓ Active nav on Platform (correct)
- ✓ No external JS data files (D.14 N/A)
- ✓ **Strongest trust-boundary definitions on the audited site**:
  - Line 380: "ROUA methodology improves traceability, evidence quality, and governance of intelligence workflows. It does not replace institutional judgment, investment committees, or regulatory responsibilities."
  - Line 391: "showing how the four confidence factors are recorded as signals, **not combined into a single score**."
  - Line 472: "A methodology that only handles the ideal path is marketing. A methodology that documents how it handles conflict, staleness, and failure is auditable."
- ✓ **Unique Output Types taxonomy** (4 types: Verified Fact / Detected Event / Derived Insight / Analytical Interpretation) — explicit type labeling, no other audited page distinguishes output types this clearly
- ✓ Worked example marked illustrative throughout (4 signal badges + footer note)
- ✓ Explicit scope disclaimers (NOT Architecture, NOT Trust Framework)
- ✓ 3 Edge Cases section — conflict / staleness / failure handling — unique auditable-methodology pattern
- ✓ "no composite score unless institution configures documented formula" (line 228–229) — explicit anti-D.9 framing
- ✓ "Versioned Provenance" used correctly (line 328) — matches canonical term, not deprecated "Provenance Immutability"
- ✓ "Governed Intelligence Object" used correctly throughout — not "Verified Intelligence Object"

---

## PART 5 — CROSS-REPORT COMPARISON

| Aspect | Enterprise (12) | Platform (17) | Source Registry (18) | **Methodology (19)** |
|---|---|---|---|---|
| Lines | 515 | 718 | 551 | **552** |
| Sections | 10 | 12 | 10 | **12** |
| Inline `<style>` | Absent | Present (~78 lines) | Absent | **Absent** |
| D.2 | 0 | 0 | 0 | **0** |
| D.4 | 0 | 0 | 0 | **1 (line 147)** |
| D.6 | 0 | 0 | 0 | **18** |
| D.8 | 0 | 0 | 0 (REVIEW variant) | **0** |
| D.9 | 0 | 0 | 0 | **7 instances (2 lean FORBID)** |
| D.10 | 0 | 0 | 0 | **0** |
| Total defects | 0 | 0 | 0 (+ 1 REVIEW) | **2 confirmed + 2 REVIEW** |
| Verdict | **PASS** | **PASS** | **FAIL (borderline)** | **FAIL** |

### Key Insights

1. **Methodology is the FIRST Platform-page to FAIL with both D.4 and D.6 confirmed together** — Source Registry (Delta 18) only had a borderline D.8 variant; Methodology has structural violations.
2. **D.6 dominant pattern (18 instances)** — higher than any other audited page. The page author used `var(--gold)` directly in inline styles for every accent-colored element (links, H4s, provenance span) instead of using the canonical `var(--roua-accent)` alias. This suggests the page was authored before D.6 was tightened in Spec v5/v6, or the author was not aware of the alias requirement.
3. **D.4 violation in a Methodological Principle title** — the third principle is literally named "Audit-Ready By Construction". This is a deeper D.4 violation than the marketing-copy uses seen on other pages: it's a **definitional principle** of the methodology, not a casual claim. Either rephrase (e.g. "Auditable By Construction", "Reconstructable By Construction") or move the entire principle to a different framing.
4. **D.9 territory — Methodology is the most explicit page about extraction confidence** — it's natural for the methodology page to discuss this concept, but the H4 factor name (line 210) and the "scored independently" phrasing (line 172) lean FORBID because they describe a capability rather than illustrating it. The page itself uses "Extraction quality" as an alternative phrasing in line 140, suggesting a clean replacement path.
5. **Strongest trust-boundary language on the audited site** — Methodology contains three trust-boundary statements that no other page matches:
   - Limitations disclaimer (line 380)
   - Anti-composite-score framing (line 391)
   - Auditable-vs-marketing distinction (line 472)
6. **Unique Output Types taxonomy** — 4 types (Verified Fact / Detected Event / Derived Insight / Analytical Interpretation) with explicit institutional-trust framing. This is a **positive Spec contribution** — no other audited page distinguishes output types this clearly. Recommend adopting this taxonomy into Spec v7 as a canonical reference.
7. **No D.15+ new defect types found** — Spec v6 sufficient for Methodology page.

---

## PART 6 — RECOMMENDED FIX

### Phase 1 — Token + Defect Repairs (~6 minutes)

| Step | Fix | Line | Effort |
|---|---|---|---|
| 19.1 | **D.4** — Replace `<h4>Audit-Ready By Construction</h4>` with `<h4>Auditable By Construction</h4>` (or "Reconstructable By Construction"). Adjust body text accordingly if needed. | 147 | ~1 min |
| 19.2 | **D.6** — Replace all 18 `var(--gold)` instances in inline styles with `var(--roua-accent)`. Lines: 104, 105, 117, 119, 205, 210, 215, 220, 312, 316, 320, 324, 328, 332, 438, 457, 462, 467. | (18 lines) | ~5 min (mechanical find-replace) |

### Phase 2 — D.9 REVIEW Resolutions (~4 minutes, team decision required)

| Step | Fix | Line | Effort |
|---|---|---|---|
| 19.3 | **D.9 (REVIEW leans FORBID)** — If team decides H4 factor name (line 210) leans FORBID as capability description, replace `<h4>Extraction Confidence</h4>` with `<h4>Extraction Quality</h4>` (matches the alternative phrasing already used in line 140). Update signal label (line 415) and descriptive text accordingly for consistency. | 210 (+ 415, 172, 206, 264, 280, 468 for consistency) | ~3 min |
| 19.4 | **D.9 (REVIEW leans FORBID)** — If team decides "scored independently" (line 172) leans FORBID, replace with "assessed independently" or "measured independently". | 172 | ~1 min |

If all four fixes are applied, Methodology moves from FAIL → PASS (assuming D.9 decisions resolve in the FORBID direction; if team accepts current "Extraction Confidence" usage as definitional, only Phase 1 needed for PASS).

**Total Phase 1+P2 repair budget for Methodology: ~10 minutes.**

---

## PART 7 — SPEC v7 INPUT

Methodology surfaces two items relevant for Spec v7 (do NOT implement now — record for cumulative review after all audits):

1. **Output Types taxonomy** (lines 347–368) — 4 types (Verified Fact / Detected Event / Derived Insight / Analytical Interpretation) with explicit institutional-trust framing. **Recommend adopting as canonical reference in Spec v7 Layer 1 (Taxonomy)** — no other audited page distinguishes output types this clearly. This is a positive Spec contribution from Methodology.
2. **D.9 boundary clarification** — Methodology exposes a real edge case: when a methodology page MUST discuss extraction confidence as a definitional factor, the H4 factor name (line 210) and "scored" verb (line 172) become REVIEW-leaning-FORBID. Spec v7 should clarify: is "Extraction Confidence" as a **factor name** acceptable on a methodology page (definitional use), or does it always lean FORBID regardless of context? The page's own alternative phrasing "Extraction Quality" (line 140) suggests a clean replacement path exists.

No other Spec v7 changes triggered by Methodology.

---

*End of Delta Report 19. Methodology FAILS — 2 confirmed defects (D.4 × 1, D.6 × 18) + 2 D.9 REVIEW items leaning FORBID. Despite the FAIL, the page contains the strongest trust-boundary language and the most explicit Output Types taxonomy on the audited site. No D.15+ new defect types. Spec v6 sufficient. Total Phase 1+P2 repair budget: ~10 minutes.*

# Delta Report 07 — `evidence-explorer.html` vs Product Family Consolidation Spec v2

> **Status:** First test of Spec v2 against an Inspection-category page. Evidence Explorer is the strictest inspection surface on the site.
> **Audited file:** `/home/z/my-project/rouaa-corporate/rouaa-web/evidence-explorer.html` (1560 lines)
> **Reference:** `PRODUCT-FAMILY-CONSOLIDATION-SPEC.md` v2 (commit `f7c9752`)
> **Method:** No code modification. Acceptance Contract applied across ALL implementation layers (HTML + CSS + SVG + JS + content claims).
> **Acceptance Verdict:** **FAIL** — Trust Grammar violations (D.4 "Audit-Ready" + D.9 "confidence score/d") + old-gold rgba (D.2) + old taxonomy in Step 07 output.

---

## Classification Framework (Same A/B/C/D + Spec v2 Acceptance)

| Category | Meaning |
|---|---|
| **A** | Must match — system primitives |
| **B** | Must adapt to category nature (Inspection) |
| **C** | Must NOT transfer from Homepage or Decision Environments |
| **D** | Real defect — must fix |

**Acceptance Contract (v2):** PASS requires safety across ALL implementation layers (HTML + CSS + SVG + JS + content claims). Any FORBID violation in ANY layer = FAIL.

---

# PART 1 — STRUCTURAL FACTS

## 1.1 CSS / JS Stack

| Component | Loaded | Notes |
|---|---|---|
| `roua-v7.css` | ✓ | |
| `roua-v7-patch.css` | ✓ | |
| `styles.css` | ✗ NOT loaded | Same as all prior pages |
| **Inline `<style>` block** (lines 13–176) | ✓ | **NOT dead code** — defines `.explorer-frame`, `.explorer-step`, `.step-nav`, `.step-dot`, `.step-line`, `.step-btn`, `.step-content`, `.step-card`, `.step-field`, `.concept-badge` — the Explorer's interactive walkthrough design system. ~164 lines. |
| `main.js` | ✓ | |
| `design-system/roua-v7.js` | ✓ | |

**Key finding:** Evidence Explorer has its OWN interactive walkthrough system (7 steps with navigation dots, prev/next buttons, and step content panels). This is a **B-category adaptation** — correct for an Inspection page that needs guided evidence-tracing.

## 1.2 Token Usage

| Token Family | Usage | Verdict |
|---|---|---|
| `--roua-*` aliases | Used throughout CSS + inline styles | ✓ Correct |
| `var(--gold)` direct (D.6) | **0 instances** | ✓ D.6 absent |
| `rgba(201, 162, 39, ...)` (OLD gold, D.2) | **3 instances** (lines 136, 166, 1030) | ⚠ **D.2 PRESENT** |
| Raw hex values | **0 instances** | ✓ D.7 absent (no SVG diagrams with deprecated hex, no Three.js) |
| White rgba | Acceptable in glass surfaces (not used here — Explorer doesn't use `.glass-status-card`) | ✓ |

**D.2 locations:**
- Line 136: `.step-card.highlight` background gradient — `linear-gradient(180deg, rgba(201, 162, 39,0.06), rgba(201, 162, 39,0.02))`
- Line 166: `.concept-badge` background — `rgba(201, 162, 39, 0.15)`
- Line 1030: inline style on a status indicator — `background: rgba(201, 162, 39, 0.06)`

## 1.3 Page Structure

```
Navigation (lines 182–271)
1.  Page Hero — .page-hero (lines 273–293)
2.  Aramco Q1 2026 — Matching Sample (lines 295–350)
3.  FOMC Jul 29 2026 — Matching Sample (lines 352–415)
4.  OFAC sb0581 — Matching Sample (lines 417–495)
5.  FOMC Jul 29 2026 — Matching Sample (Media) (lines 497–560)
6.  Failure Philosophy (lines 562–572)
7.  Why This Matters (lines 574–598)
8.  What You Can Prove (lines 600–637)
9.  Same Chain, Multiple Source Types (lines 639–649)
10. The Evidence Chain — Intro (lines 651–665)
11. Explorer — Interactive 7-step walkthrough (lines 667–1240)
12. Object Relationships (lines 1242–1308)
13. Human Oversight Checkpoint (lines 1310–1384)
14. Complete Evidence Package (lines 1386–1430)
15. CTA (lines 1432–1448)
Footer (lines 1450–1510)
```

- `<section>` count: **15** (tied with Architecture for most sections)
- `<div>` balance: 605 / 605 ✓ PASS
- `<section>` balance: 15 / 15 ✓ PASS
- HTML comment balance: 65 / 65 ✓ **PASS**

## 1.4 HTML Integrity

| Check | Result |
|---|---|
| `<div>` balance | 605 / 605 ✓ PASS |
| `<section>` balance | 15 / 15 ✓ PASS |
| HTML comment balance | 65 / 65 ✓ PASS |
| Broken internal anchors | None ✓ (anchors: `#step1`–`#step7`, `#aramco-q1-2026`, `#fomc-jul-2026`, `#ofac-sb0581`, `#main` — all valid) |
| Dead `<style>` block (D.1) | ✗ ABSENT — the inline `<style>` is the Explorer's interactive walkthrough design system, NOT dead code |

## 1.5 Unique Structural Elements (Explorer-specific)

Evidence Explorer has its OWN interactive walkthrough system:
- `.explorer-frame` — container with strong border
- `.explorer-step` / `.explorer-step.active` — 7 steps, only active is visible
- `.step-nav` — navigation bar with progress dots
- `.step-dot` / `.step-dot.completed` / `.step-dot.active` — circular progress indicators
- `.step-line` / `.step-line.completed` — connecting lines between dots
- `.step-controls` — prev/next buttons
- `.step-btn` / `.step-btn.primary` / `.step-btn:disabled` — button states
- `.step-content` — content area for each step
- `.step-card` / `.step-card.highlight` — evidence cards within steps
- `.step-field` — label/value grid for metadata
- `.concept-badge` — gold pill for concept labels

**Verdict:** This is a **B-category adaptation** — correct for an Inspection page. The interactive walkthrough guides the user through Source → Document → Fact → Evidence → Object, which is exactly the inspection UX the Spec requires.

---

# PART 2 — ACCEPTANCE CONTRACT EVALUATION (Spec v2)

## Layer 1 — Canonical Baseline (across ALL implementation layers)

### 1.1 Token System

| Rule | Status | Notes |
|---|---|---|
| Use `--roua-*` aliases | ✓ PASS | All aliases used correctly |
| Never use raw hex in CSS or inline styles | ✓ PASS | Zero raw hex values |
| Never use raw hex in SVG `fill`/`stroke` | ✓ PASS | No SVG diagrams with hex colors |
| Never use raw hex in Canvas/Three.js | ✓ PASS | No Three.js/Canvas |
| Never use raw hex in JavaScript color strings | ✓ PASS | No JS color constants |
| Never use `rgba(201, 162, 39, ...)` | ✗ **FAIL** | 3 instances (D.2): lines 136, 166, 1030 |
| Never use `var(--gold)` directly | ✓ PASS | 0 instances (D.6 absent) |

**Layer 1.1 verdict:** **FAIL** — D.2 present (3 instances of old-gold rgba).

### 1.2 Container & Layout

| Rule | Status |
|---|---|
| Use `.container` (1200px max) | ✓ PASS |
| Section padding | ✓ PASS (uses `.section` 88px + compressed 48px for matching samples) |
| Alternating bands | ✓ PASS |

**Layer 1.2 verdict:** **PASS**

### 1.3 Navigation

| Rule | Status |
|---|---|
| `.navbar` + `.nav-container` + `.nav-logo` + `.nav-links` | ✓ PASS |
| Products dropdown: 6 links (no Trading Desks) | ✓ PASS |
| Solutions dropdown: 7 links | ✓ PASS |
| Mobile hamburger | ✓ PASS (line 268) |
| **Active nav state** | ✓ PASS — on Experience dropdown (line 237), correct (Evidence Explorer is under Experience) |

**Layer 1.3 verdict:** **PASS** — Evidence Explorer is the **third page** (after Developer + Architecture) with active nav state.

### 1.4 Buttons

| Rule | Status |
|---|---|
| Primary: `.btn .btn-primary` | ✓ PASS |
| Secondary: `.btn .btn-secondary` | ✓ PASS |
| Pill-shaped | ✓ PASS |

**Layer 1.4 verdict:** **PASS**

### 1.5 Footer

| Rule | Status |
|---|---|
| 6 columns | ✓ PASS |
| NO "Channels" column | ✓ PASS |

**Layer 1.5 verdict:** **PASS**

### 1.6 Card Hierarchy

| Rule | Status | Notes |
|---|---|---|
| `.card-evidence` for evidence rows | ✗ **NOT ADOPTED** | Spec Layer 6.3 says Explorers "Must use `.card-evidence` (v7-patch) for evidence rows". Evidence Explorer uses custom `.step-card` and inline-styled evidence panels instead. |
| `.card-accent` for marketing | ✗ ABSENT | Correct — Explorer is not a marketing page |
| `.cx` hover theatrics | ✗ ABSENT | Correct — Spec Layer 6.3 says "Must NOT use `.cx` hover theatrics on evidence rows" |

**Layer 1.6 verdict:** **PARTIAL FAIL** — `.card-evidence` not adopted (ADOPT recommendation, but Spec says "Must use"). However, the custom `.step-card` system achieves the same evidence-first hierarchy. **Judgment call: the Spec's "Must use .card-evidence" is too rigid — the custom system is functionally equivalent. Recommend Spec v3 update to soften this to "Must use evidence-first card pattern (.card-evidence OR equivalent custom system with no hover theatrics)".**

### 1.7 Motion

| Rule | Status |
|---|---|
| Entrance reveals | ✓ PASS (no `.rv` class used, but Explorer uses JS-driven step transitions which are interactive, not ambient) |
| `glass-status-dot` pulse | ✗ ABSENT (correct — Explorer is not Decision Environment) |
| Homepage ambient motion | ✗ ABSENT (correct — no globe, particles, wave, etc.) |
| `prefers-reduced-motion` | ✓ PASS (step transitions are user-triggered, not auto-playing) |

**Layer 1.7 verdict:** **PASS** — Explorer has zero ambient motion. The only motion is user-triggered step navigation (prev/next buttons), which is correct for Inspection.

### 1.8 Typography

| Rule | Status |
|---|---|
| Inter sans + Fira Code mono | ✓ PASS |
| Sans/mono separation | ✓ PASS |

**Layer 1.8 verdict:** **PASS**

### 1.9 Trust Grammar (Forbidden Phrases)

| Phrase | Count | Verdict |
|---|---|---|
| **"Audit-Ready" / "Audit-ready"** | **2** (lines 1177, 1214) | ✗ **FAIL — D.4 FORBID violation** (Explorer is NOT risk-intelligence.html) |
| "within seconds" / "in seconds" | 0 | ✓ PASS |
| "real-time" / "real time" | 0 | ✓ PASS |
| "instantly" / "instant" | 0 | ✓ PASS |
| "continuously monitored" | 0 | ✓ PASS |
| **"every claim"** | **2** (lines 284, 1009) | ⚠ **REVIEW** — both in descriptive context, not as ROUA claim. Line 284: "every claim carries its source, supporting evidence, provenance, and the relevant confidence signal." Line 1009: "every claim can be traced to its origin in the source document." These are capability descriptions, not marketing claims. Per Spec v2, "every claim" is REVIEW (acceptable in quoted institutional questions, forbidden as ROUA claim). These are closer to capability descriptions — **judgment call: acceptable, but recommend softening to "governed claims" for consistency.** |
| "VERIFIED INTELLIGENCE OBJECT" | 0 | ✓ PASS |
| "Trust Promise" | 0 | ✓ PASS |
| "Provenance Immutability" | 0 | ✓ PASS |
| **"confidence score" / "confidence scored"** | **3** (lines 632, 1202 ×2) | ✗ **FAIL — D.9 FORBID violation** |
| "SOC 2" / "ISO 27001" | 0 | ✓ PASS |

**Layer 1.9 verdict:** **FAIL** — 2 FORBID violations: D.4 (Audit-Ready × 2) + D.9 (confidence score/d × 3).

### 1.10 Taxonomy

| Term | Count | Verdict |
|---|---|---|
| **"Trading Intelligence"** | **1** (line 1214, as standalone — NOT in "Market & Trading Intelligence") | ✗ **FAIL — old taxonomy** |
| **"Institutional Intelligence"** | **1** (line 1214, as standalone — should be "Investment Intelligence" or "Investment Firms") | ✗ **FAIL — old taxonomy** |
| "Developer Intelligence" | 0 | ✓ PASS |

**Layer 1.10 verdict:** **FAIL** — Line 1214 uses old taxonomy: "→ Trading Intelligence · Institutional Intelligence · Media Intelligence · Developer APIs". Should be: "→ Market & Trading Intelligence · Investment Intelligence · Media Intelligence · Developer Platform".

**This is a NEW defect type — old taxonomy in Step 07 output's "Delivered To" field.** Not seen in any prior Delta. **D.10 candidate.**

### Layer 1 Overall Verdict: **FAIL**
D.2 (old-gold rgba) + D.4 (Audit-Ready) + D.9 (confidence score/d) + old taxonomy (D.10 candidate).

---

## Layer 5 — Do-Not-Touch Rules

| Rule | Status | Notes |
|---|---|---|
| Do NOT force Decision Environment grammar onto non-Decision pages | ✓ PASS | Explorer has its own `.explorer-*` grammar, no "Verified Fact → Context → Decision" chain forced |
| Do NOT force product-specific Trust Grammar labels | ✓ PASS | Explorer uses "Extracted Fact", "Verified Event", "Verified Risk Event" — matches the product each sample came from |
| Do NOT add Homepage-brand elements | ✓ PASS | Zero Homepage-brand elements (all 11 checked = 0) |
| Do NOT force `.hero-split` + `.glass-status-card` | ✓ PASS | Explorer uses `.page-hero` (single-column, like Developer) |
| Do NOT force `.card-accent` marketing cards | ✓ PASS | Explorer uses custom `.step-card` evidence panels |
| Do NOT force product-specific motion patterns | ✓ PASS | Explorer has zero ambient motion, only user-triggered step navigation |
| Do NOT add `.cx` hover theatrics on evidence rows | ✓ PASS | Zero `.cx` usage |

**Layer 5 verdict:** **PASS** — the Spec correctly does NOT force Decision Environment or Homepage grammar onto the Inspection page.

---

## Layer 6 — Explorer-Specific Rules (Spec Layer 6.3)

| Rule | Status | Notes |
|---|---|---|
| Must use `.card-evidence` for evidence rows | ✗ **NOT ADOPTED** | Uses custom `.step-card` + inline-styled panels instead. Functionally equivalent but not the Spec-mandated class. **Spec v3 recommendation: soften to "evidence-first card pattern (.card-evidence OR equivalent)".** |
| Must NOT use `.cx` hover theatrics on evidence rows | ✓ PASS | Zero `.cx` usage |
| Minimal motion — zero animation | ✓ PASS | Zero ambient motion; only user-triggered step transitions |
| Dense metadata (mono labels, provenance, source links) | ✓ PASS | Every evidence panel has mono labels, provenance, source links |
| Direct links to official sources | ✓ PASS | 6 external links, all to official sources (aramco.com, federalreserve.gov, home.treasury.gov, ofac.treasury.gov) |
| Must use "Verified Fact/Event" labels | ✓ PASS | Uses "Extracted Fact" (Investment), "Verified Event" (Market), "Verified Risk Event" (Risk) — matches each product |
| Must include "Inspect in Evidence Explorer" continuity links | N/A | This IS the Evidence Explorer |

**Layer 6 verdict:** **PARTIAL** — `.card-evidence` not adopted (Spec says "Must use", but custom system is functionally equivalent). All other Explorer rules PASS.

---

## Layer 4 — Confirmed Defects (D.1–D.9 + new)

| ID | Defect | Present? | Details |
|---|---|---|---|
| D.1 | Dead `<style>` block | ✗ ABSENT | Inline `<style>` is the Explorer's design system, not dead code |
| **D.2** | Old-gold `rgba(201, 162, 39, ...)` | **✓ PRESENT — 3 instances** | Lines 136 (`.step-card.highlight` bg), 166 (`.concept-badge` bg), 1030 (inline status indicator bg) |
| D.3 | Malformed HTML comment | ✗ ABSENT | 65/65 comment balance PASS |
| **D.4** | "Audit-Ready" violation | **✓ PRESENT — 2 instances** | Line 1177: "Published · Immutable · Audit-Ready" status badge. Line 1214: "Published · Immutable · Audit-ready" output status. **Explorer is NOT risk-intelligence.html — FORBID violation.** |
| D.5 | Bloomberg naming | ✗ ABSENT | 0 instances |
| D.6 | `var(--gold)` base token | ✗ ABSENT | 0 instances |
| D.7 | Deprecated raw hex | ✗ ABSENT | 0 raw hex values (no SVG, no Three.js) |
| D.8 | "real time" timing claim | ✗ ABSENT | 0 instances (uses "configured source monitoring" correctly — lines 733, 782) |
| **D.9** | "confidence score/d" claim | **✓ PRESENT — 3 instances** | Line 632: "A composite confidence score — source tier, extraction, corroboration, recency. Published with the fact." Line 1202: "Validation rules applied · confidence scored · audit trail preserved" |
| **D.10 (NEW)** | **Old taxonomy in output** | **✓ PRESENT — 1 instance** | Line 1214: "→ Trading Intelligence · Institutional Intelligence · Media Intelligence · Developer APIs" — uses old product names ("Trading Intelligence" should be "Market & Trading Intelligence", "Institutional Intelligence" should be "Investment Intelligence", "Developer APIs" should be "Developer Platform") |
| REVIEW | "every claim" | ⚠ 2 instances | Lines 284, 1009 — descriptive context, not ROUA claim. Acceptable per Spec v2 REVIEW, but recommend softening to "governed claims". |

---

# PART 3 — UX INSPECTION TEST

> User asked: "Can the user quickly inspect Source → Document → Evidence → Provenance → Context?"

## The 4 Matching Samples (lines 295–560)

Evidence Explorer opens with **4 matching samples** — one from each product page Hero:
1. **Aramco Q1 2026** (from Investment Intelligence) — Extracted Fact + Source Document + Provenance + cross-reference link
2. **FOMC Jul 29 2026** (from Market Intelligence) — Verified Event + Source Document + ROUA Market Context (dashed border) + Provenance + cross-reference link
3. **OFAC sb0581** (from Risk Intelligence) — Verified Risk Event + Blocked Property (8 vessels) + Source Document + ROUA Risk Context (dashed border) + Provenance + cross-reference link
4. **FOMC Jul 29 2026** (from Media Intelligence) — Verified News Fact + Source Document + ROUA Editorial Context (dashed border) + Provenance + cross-reference link

**Verdict:** ✓✓ **PASS** — Each matching sample shows the complete chain: Source → Document → Fact/Event → (ROUA Context where applicable) → Provenance → cross-reference link. The user can inspect each layer in seconds.

## The Interactive 7-Step Walkthrough (lines 667–1240)

The Explorer's core is a 7-step interactive walkthrough with navigation dots and prev/next buttons:

| Step | Title | What it shows |
|---|---|---|
| 1 | Source Detection | Source registry detects publication through configured source monitoring |
| 2 | Document Intelligence | PDF parsed, structure extracted, citation coordinates preserved |
| 3 | Fact Extraction | Material facts extracted with provenance (page, paragraph, exact text) |
| 4 | Event Detection | Facts correlated into events, classified, correlated |
| 5 | Evidence Assembly | Provenance chain assembled — every fact linked to source, document, page, paragraph |
| 6 | Intelligence Object | Governed output produced with evidence pack attached |
| 7 | Publication | Object published, immutable, delivered to workflows |

**Verdict:** ✓✓ **PASS** — The walkthrough guides the user through the complete inspection chain. Each step shows:
- Step label (mono, uppercase)
- Step title (large, bold)
- Step description (body copy)
- Step cards (evidence panels with label/value fields)
- Status indicators (mono badges)

**The UX makes inspection fast.** The user can:
- Click through steps sequentially (prev/next)
- Jump to any step via navigation dots
- See the evidence chain build progressively
- Inspect each layer's metadata in structured fields

## Inspection Chain Completeness

| Chain step | Present? | Location |
|---|---|---|
| Source (official publication) | ✓ | Step 1 + all 4 matching samples |
| Document (parsed structure) | ✓ | Step 2 |
| Fact/Event (extracted) | ✓ | Step 3 + 4 + all 4 matching samples |
| Evidence (provenance chain) | ✓ | Step 5 + all 4 matching samples |
| Provenance (source · page · paragraph) | ✓ | Step 5 + all 4 matching samples |
| Context (ROUA analytical layer) | ✓ | Matching samples 2, 3, 4 (Market, Risk, Media — dashed border) |
| Intelligence Object (governed output) | ✓ | Step 6 + 7 |

**Verdict:** ✓✓ **PASS** — The full inspection chain is present and navigable.

---

# PART 4 — DRIFT SUMMARY

## A — Must match (system primitives)
| ID | Finding | Verdict |
|---|---|---|
| A.1 | Two nav class systems | **STANDARDIZE** (Explorer uses product-page `.navbar` system — correct) |
| A.2 | `.page-hero` (like Developer) | **KEEP** (B-category — Inspection page, not Decision Environment) |
| A.3 | Active nav state on Experience | **KEEP** (correct — Explorer is under Experience) |

## B — Must adapt to category nature (Inspection)
| ID | Finding | Verdict |
|---|---|---|
| B.1 | Custom `.explorer-*` design system (~164 lines CSS) | **KEEP** — correct Inspection adaptation |
| B.2 | Interactive 7-step walkthrough | **KEEP** — correct Inspection UX |
| B.3 | 4 matching samples from product Heroes | **KEEP** — correct cross-product inspection continuity |
| B.4 | Zero ambient motion (only user-triggered) | **KEEP** — correct Inspection restraint |
| B.5 | Dense metadata (mono labels, provenance, source links) | **KEEP** — correct Inspection density |
| B.6 | `.page-hero` single-column Hero (not `.hero-split`) | **KEEP** — correct for non-Decision Environment |
| B.7 | Custom `.step-card` instead of `.card-evidence` | **KEEP** (functionally equivalent — Spec v3 should soften "Must use .card-evidence" to "Must use evidence-first card pattern") |

## C — Must NOT transfer from Homepage or Decision Environments
| ID | Finding | Verdict |
|---|---|---|
| C.1–C.14 | All 14 Homepage-brand elements | ✓ **All correctly absent** |
| C.15 | `.glass-status-card` (Decision Environment) | ✓ Absent |
| C.16 | `.hero-split` (Decision Environment) | ✓ Absent |
| C.17 | `.card-accent` (marketing) | ✓ Absent |
| C.18 | `.cx` hover theatrics | ✓ Absent |

## D — Real defects
| ID | Finding | Severity | Fix |
|---|---|---|---|
| **D.2** | 3 instances of `rgba(201, 162, 39, ...)` (lines 136, 166, 1030) | **P1 — REPAIR** | Replace with `rgba(227, 180, 90, ...)` |
| **D.4** | 2 instances of "Audit-Ready" (lines 1177, 1214) | **P1 — REPAIR** | Replace with "Evidence-Linked" or "Inspectable" |
| **D.9** | 3 instances of "confidence score/d" (lines 632, 1202) | **P1 — REPAIR** | Replace with "verification tier" or "confidence signals" |
| **D.10 (NEW)** | Old taxonomy in Step 07 output (line 1214) | **P1 — REPAIR** | Replace "Trading Intelligence · Institutional Intelligence · Media Intelligence · Developer APIs" with "Market & Trading Intelligence · Investment Intelligence · Media Intelligence · Developer Platform" |
| REVIEW | "every claim" × 2 (lines 284, 1009) | **P3 — REVIEW** | Descriptive context, acceptable but recommend softening to "governed claims" |

---

# PART 5 — ACCEPTANCE VERDICT

## **FAIL**

The page **FAILS** the Acceptance Contract due to:

1. **Layer 1.9 FORBID violations:**
   - "Audit-Ready" × 2 instances (lines 1177, 1214) — D.4
   - "confidence score/d" × 3 instances (lines 632, 1202) — D.9

2. **Layer 1.10 taxonomy violations:**
   - Old taxonomy in Step 07 output (line 1214) — D.10 (new)

3. **Layer 1.1 token violations:**
   - 3 instances of old-gold `rgba(201, 162, 39, ...)` (lines 136, 166, 1030) — D.2

4. **Layer 4 confirmed defects:**
   - D.2 (3 instances)
   - D.4 (2 instances)
   - D.9 (3 instances)
   - D.10 (1 instance — new)

## What the Spec correctly allowed (Layer 5 + Layer 6 PASS)

Despite the FAIL verdict, the Spec **correctly handled** the Inspection category:

- ✓ Explorer is NOT forced into Decision Environment grammar
- ✓ `.page-hero` (single-column) is accepted, not forced into `.hero-split`
- ✓ Zero ambient motion is correct for Inspection
- ✓ Custom `.explorer-*` design system is accepted as B-category adaptation
- ✓ `.cx` hover theatrics correctly absent (Spec FORBID on Explorer evidence rows)
- ✓ Active nav state on Experience dropdown is CORRECT
- ✓ 4 matching samples from product Heroes provide cross-product inspection continuity
- ✓ The UX inspection test PASSES — user can quickly inspect Source → Document → Evidence → Provenance → Context

**The Spec works.** The FAIL is due to genuine defects (D.2, D.4, D.9, D.10), not Spec over-constraint.

---

# PART 6 — NEW DEFECT D.10 + SPEC V3 RECOMMENDATION

## D.10 — Old taxonomy in output content

| Field | Value |
|---|---|
| **Pattern** | Old product taxonomy names used in content (not in nav/footer, which are correct) — "Trading Intelligence" (should be "Market & Trading Intelligence"), "Institutional Intelligence" (should be "Investment Intelligence"), "Developer APIs" (should be "Developer Platform") |
| **Pages affected** | Evidence Explorer (Delta 07): line 1214 — Step 07 output "Delivered To" field |
| **Pages clean** | All 5 product pages + Architecture (nav/footer taxonomy correct) |
| **Root cause** | The Step 07 output field was written before taxonomy was locked, and survived because it's in content (not nav/footer) where the P0 sweep didn't scan |
| **Fix** | Replace "Trading Intelligence · Institutional Intelligence · Media Intelligence · Developer APIs" with "Market & Trading Intelligence · Investment Intelligence · Media Intelligence · Developer Platform" |
| **Fix type** | Page-specific — 1 line edit |
| **Effort** | ~1 minute |
| **Verdict** | **REPAIR** (P1 priority) |

## Spec v3 Recommendation

Based on Delta 07 findings, recommend Spec v3 updates:

| Update | Layer | Detail |
|---|---|---|
| **Add D.10** | Layer 4 | "Old taxonomy in content — product names used in body copy, output fields, or descriptions that don't match locked taxonomy (Layer 1.10). P0 sweep cleaned nav/footer but not all content." |
| **Soften Layer 6.3 `.card-evidence` rule** | Layer 6 | Change "Must use `.card-evidence` for evidence rows" to "Must use evidence-first card pattern (`.card-evidence` OR equivalent custom system with no hover theatrics, no ambient motion, dense metadata, direct source links)" |
| **Expand Layer 1.10 scan scope** | Layer 1.10 | Add note: "Taxonomy check applies to ALL content — nav, footer, body copy, output fields, descriptions, JavaScript strings. Not just nav/footer." |

---

# PART 7 — CROSS-REPORT COMPARISON

## Evidence Explorer vs Prior Pages (Delta 01–06)

| Aspect | Product Pages (5) | Architecture (06) | Evidence Explorer (07) |
|---|---|---|---|
| Lines | 566–734 | 3484 | 1560 |
| Sections | 8–11 | 15 | **15** (tied) |
| Inline `<style>` | Dead block (D.1) or absent | ~1200 lines (design system) | ~164 lines (interactive walkthrough system) |
| JavaScript libraries | main.js + roua-v7.js | + Three.js + GSAP + ScrollTrigger | main.js + roua-v7.js (no external libs) |
| Hero pattern | `.hero-split` or `.page-hero` | `.arch-hero` (custom) | `.page-hero` (like Developer) |
| Active nav state | Developer only | Architecture (Platform) | **Explorer (Experience)** — third page with it |
| D.2 (old-gold rgba) | 2–3 instances | 23 instances | **3 instances** |
| D.4 (Audit-Ready) | Market only (1) | 0 | **2 instances** |
| D.9 (confidence score/d) | 0 | 1 | **3 instances** |
| **D.10 (old taxonomy)** | 0 | 0 | **1 instance (new)** |
| Acceptance verdict | Investment PASS, Market FAIL, Risk PASS, Media FAIL, Developer PASS | FAIL | **FAIL** |

## Key Insight

Evidence Explorer is the **first page** with:
- D.4 (Audit-Ready) outside Market — confirming Audit-Ready leaks beyond product pages
- D.9 (confidence score/d) with 3 instances — more than Architecture's 1
- D.10 (old taxonomy in content) — new defect type, content-level taxonomy drift not caught by P0 sweep

The Explorer's UX inspection test PASSES (the user can inspect the full chain), but the page FAILS acceptance due to Trust Grammar + taxonomy + token violations in the content.

---

# PART 8 — RECOMMENDED FIXES

## P1 — Technical Repairs (~8 minutes)

| Step | Fix | Lines | Effort |
|---|---|---|---|
| 8.1 | REPAIR D.2 — replace 3 old-gold rgba with `rgba(227, 180, 90, ...)` | 136, 166, 1030 | ~3 min |
| 8.2 | REPAIR D.4 — replace "Audit-Ready" / "Audit-ready" with "Evidence-Linked" | 1177, 1214 | ~2 min |
| 8.3 | REPAIR D.9 — replace "confidence score/d" with "verification tier" / "confidence signals" | 632, 1202 | ~2 min |
| 8.4 | REPAIR D.10 — replace old taxonomy in Step 07 output | 1214 | ~1 min |

## P3 — Content Review

| Step | Fix | Line | Effort |
|---|---|---|---|
| 8.5 | REVIEW "every claim" × 2 — consider softening to "governed claims" | 284, 1009 | Judgment call |

---

*End of Delta Report 07. Spec v2 tested on Inspection category — works correctly, catches real defects (D.2, D.4, D.9, new D.10). Spec v3 recommended to add D.10 + soften .card-evidence rule + expand taxonomy scan scope.*

# Delta Report 02 — `market-intelligence.html` vs ROUA Visual System v1

> **Status:** Second test of `ROUA-VISUAL-SYSTEM-v1.md` against a product page.
> **Audited file:** `/home/z/my-project/rouaa-corporate/rouaa-web/market-intelligence.html` (734 lines)
> **Reference:** `ROUA-VISUAL-SYSTEM-v1.md` (commit `855ffd1`) + `index.html` (commit `de9830f`)
> **Baseline:** `DELTA-01-investment-intelligence.md` (commit `ff17d40`)
> **Method:** No code modification. Drift classified into A/B/C/D per user framework.
> **Verdict:** The page is **largely aligned** with v1 and **structurally consistent** with Investment page. **3 real defects (D)** found — 2 of which are NEW patterns not seen in Investment (old-gold rgba + malformed HTML comment), 1 of which is a Trust Grammar violation that Investment did NOT have. **1 expected B-category difference** in Hero evidence-card density.

---

## Classification Framework (Same as Delta 01)

| Category | Meaning | Action |
|---|---|---|
| **A** | Must match — system primitives | Drift = real defect, must fix |
| **B** | Must adapt to product nature | Difference is expected; only fix if it harms trust or comprehension |
| **C** | Must NOT transfer from Homepage | Presence in product page = real defect, must remove |
| **D** | Real defect — old token, contradictory CSS override, old taxonomy, trust grammar violation, duplicate component, unproven claim, visual hierarchy that harms trust | Must fix |

---

# PART 1 — STRUCTURAL FACTS

## 1.1 CSS / JS Stack

| Component | Loaded | Notes |
|---|---|---|
| `roua-v7.css` | ✓ | Provides `.navbar`, `.footer`, `.hero-split`, `.glass-status-card`, `.cta-section`, `.how-step`, `.card-accent`, `.bg-grid-enhanced`, `.glow-blue`, `.glow-gold` — same as Investment |
| `roua-v7-patch.css` | ✓ | Provides `.card` override, semantic tokens, workflow components |
| `styles.css` | ✗ NOT loaded | Same as Investment — not needed because `roua-v7.css` defines equivalents |
| Inline `<style>` block #1 (lines 13–30) | ✓ | Targets `#integrates-with` and `#powered-by` — **IDs that DO NOT EXIST in this page**. Dead code. Same defect as Investment D.1. |
| Inline `<style>` block #2 (lines 32–49) | ✓ | Targets `.section div[style*="grid-template-columns: repeat(5, 1fr)"]` — responsive collapse for 5-column grids. **Actually used** by the 5-card Problem section at line 274. NOT dead code. |
| `main.js` + `design-system/roua-v7.js` | ✓ | Same as Investment |

**Finding:** Two inline `<style>` blocks. Block #1 is dead code (D.1 — same as Investment). Block #2 is legitimate responsive override for the 5-column Problem grid.

## 1.2 Token Usage

| Token Family | Usage | Verdict |
|---|---|---|
| `--roua-*` aliases | Used throughout | ✓ Correct |
| Old tokens (`--bg`, `--gold`, etc.) directly | **0 instances** | ✓ Same as Investment |
| Raw hex values | **0 instances** | ✓ Same as Investment |
| `rgba(201, 162, 39, ...)` (OLD gold from VISUAL-IDENTITY-SYSTEM.md) | **3 instances** at lines 405, 460 | ⚠ **DRIFT — D.2** (see below) |
| `rgba(255, 255, 255, ...)` (white, used in glass card surface) | 2 instances at lines 190, 221 | Acceptable — matches Investment's glass-card surface treatment |

**Drift D.2 — Old-gold rgba values:** Lines 405 and 460 use `rgba(201, 162, 39, 0.06/0.08/0.02)` — this is the **OLD `#C9A227`** gold from the deprecated `VISUAL-IDENTITY-SYSTEM.md`. The canonical gold is `#e3b45a` = `rgba(227, 180, 90, ...)`.

This is a **real defect (D)** that Investment did NOT have. It means:
- The evidence-flow card at line 405 has a slightly different gold glow shadow than the rest of the page
- The Market Intelligence Output card at line 460 has a slightly different gold gradient background

The visual difference is subtle (the old gold is slightly darker/more muted), but it is **token drift** — exactly the kind of defect the global cleanup phase will need to sweep.

**Classification:** **D (real defect — old token drift)** — Must fix in a focused commit. Replace `rgba(201, 162, 39, ...)` with `rgba(227, 180, 90, ...)` at lines 405 and 460.

## 1.3 Page Structure

```
1.  Navigation (lines 55–142)
2.  Hero — Product-Forward (lines 144–237)
3.  Positioning — Why Market Intelligence (lines 240–264)         ← NEW vs Investment
4.  The Problem — 5 cards (lines 266–307)
5.  Capabilities — 4 cards (lines 309–340)
6.  How It Works — 5-step buyer workflow (lines 342–393)
7.  Evidence Example — FOMC Decision (lines 395–500)              ← NEW vs Investment
8.  Buyer Environments (lines 502–549)                            ← Equivalent to Investment's "Built For"
9.  Business Outcomes — Before/After grid (lines 552–599)         ← NEW vs Investment
10. Deployment (lines 602–649)
11. CTA (lines 652–674)
12. Footer (lines 676–729)
```

- `<section>` count: 10 (vs Investment's 8 — Market adds Positioning, Evidence Example, Business Outcomes)
- `<div>` balance: 246 / 246 ✓ PASS
- `<section>` balance: 10 / 10 ✓ PASS
- HTML comment balance: 31 `<!--` / 30 `-->` ⚠ **FAIL** (see D.3 below)

## 1.4 HTML Comment Defect

**Line 652:** `<!-- ============ CTA ============  <!-- ============ 8. CTA ============ -->`

This is a **nested malformed comment**. The first `<!--` opens, but the inner `<!-- ... 8. CTA ... -->` consumes the closing `-->`, leaving the first comment open.

Browser parsing behavior: the browser greedily matches the first `-->`, so the entire string becomes one comment ending right before `<section>`. The page **renders correctly**, but the HTML is malformed.

**Classification:** **D (real defect — malformed HTML)** — Must fix. Replace line 652 with a single clean comment: `<!-- ============ CTA ============ -->`.

**Comparison with Investment:** Investment has 24/24 comment balance (PASS). This defect is **unique to Market**.

---

# PART 2 — VISUAL IDENTITY AUDIT (14 Items from §17 of v1)

## Item 1 — Color Tokens → **PASS** (A)

Same as Investment: `--roua-*` aliases used exclusively, no raw hex, no old `--bg`/`--gold`/etc.
Exception: the 3 `rgba(201,162,39,...)` instances (D.2 above) — those are explicit rgba values, not token references.

## Item 2 — Typography → **PASS** (A/B)

- Inter sans + Fira Code mono via `--sans` / `--mono` / `--font-mono` ✓
- Hero H1: `clamp(2rem, 4.2vw, 2.8rem)` weight 300 — **same as Investment** ✓
- Section H2 via `.section-header h2` from `roua-v7.css` ✓
- Mono labels: 11px / 0.1–0.14em letter-spacing ✓
- Body: 13–14px ✓

**No drift from Investment.** The two product pages share identical typography rhythm.

## Item 3 — Container & Grid → **PASS** (A)

- Container: `.container` (max-width 1200px) — same as Investment ✓
- 5-column grid in Problem section (line 274) — **unique to Market** (Investment uses 4-column). This is acceptable adaptation — Market has 5 problem statements, Investment has 4.

**No drift.**

## Item 4 — Section Rhythm → **PASS** (A)

- Standard 88px padding via `.section` ✓
- Positioning section: 48px compressed (line 241) — acceptable transitional compression ✓
- Alternating `--roua-bg-secondary` bands at: Positioning(no), Problem(yes), Capabilities(no), How It Works(yes), Evidence Example(no), Buyer Environments(yes), Business Outcomes(no), Deployment(no), CTA(yes) ✓

**Rhythm is correct.** Three consecutive non-alt sections (Evidence Example → Buyer Environments → Business Outcomes) might feel slightly monotone, but each has distinct visual treatment (gold-bordered evidence card vs surface cards vs before/after grid).

## Item 5 — Card Hierarchy → **PASS** (B)

- `.card.card-accent` used throughout for Problem, Capabilities, Deployment ✓ — same as Investment
- Evidence Example uses a custom **gold-bordered flow card** (line 405): `border: 1px solid var(--roua-accent-border); border-left: 4px solid var(--roua-accent); box-shadow: 0 0 32px rgba(201, 162, 39, 0.06);`
- The box-shadow uses **old-gold rgba** (D.2 drift) — but the structural pattern (gold-bordered evidence card) is correct.

**Classification:** **B** — Evidence Example card is a stronger evidence-first presentation than Investment's. Acceptable adaptation for Market, where the evidence-chain narrative is the central selling point.

## Item 6 — Hero Composition → **PASS — Stronger B than Investment** (B)

### Market Hero Composition
1. `.bg-grid-enhanced` background + `.glow-blue` + `.glow-gold` — same as Investment ✓
2. `.hero-split` grid: 1.1fr .9fr — same as Investment ✓
3. Left: eyebrow + h1 + subheadline (no CTAs in Hero) — same as Investment ✓
4. Right: `.glass-status-card` with:
   - Brand header + Status badge ✓
   - Title + tagline ✓
   - **Sample Intelligence Object** with **4 evidence layers**:
     - Verified Event (FOMC JUL 29 2026, 3.50–3.75% range, 9-3 vote)
     - Source Document (Federal Reserve direct link)
     - **ROUA Market Context — Illustrative** (dashed gold border, "Potentially relevant: USD, short-term rates, front-end Treasury yields, rate-sensitive equities")
     - Inspect in Evidence Explorer link
   - Market Intelligence Value Chain (Official Market Event → Verified Event → Market Context → Decision Context)

### Comparison with Investment Hero

| Layer | Investment | Market |
|---|---|---|
| Verified Fact/Event | ✓ (Aramco $33.6B) | ✓ (FOMC 3.50–3.75%) |
| Source Document | ✓ (Aramco direct link) | ✓ (Federal Reserve direct link) |
| Provenance | ✓ (separate row, "Source: official press release") | ✓ (inline "federalreserve.gov · July 29, 2026") |
| **ROUA Context (Illustrative)** | ✗ NOT present in Hero | **✓ Present** — dashed gold border + "Illustrative" label + "ROUA Analytical Layer — not source fact" note |
| Evidence Explorer link | ✓ | ✓ |
| Value Chain | ✓ (4 steps) | ✓ (4 steps) |

**Finding:** Market Hero is **more Trust-Grammar-complete** than Investment Hero. It includes the explicit **ROUA Context / Illustrative** layer with dashed gold border, which Investment's Hero does NOT have.

**Classification:** **B (must adapt)** — This is a meaningful product-specific adaptation. Market Intelligence is fundamentally about **interpretation of events** (what does this FOMC decision mean for USD? for rates?), so the boundary between verified event and analytical context MUST be visible. Investment Intelligence is more about verified facts (earnings numbers), so the boundary is less prominent.

**Verdict:** This is **correct adaptation, not drift**. Do NOT change. In fact, this is the strongest Hero evidence-card pattern across the product family so far.

## Item 7 — Navigation → **DRIFT — Same as Investment** (A)

| Element | Homepage | Investment | Market |
|---|---|---|---|
| Nav class | `.wrap .nav` | `.container .nav-container` | `.container .nav-container` ✓ |
| Brand | SVG hex + h1 | Text-only `.nav-logo` | Text-only `.nav-logo` ✓ |
| Products dropdown | 7 links (incl Trading Desks) | 6 links (no Trading Desks) | 6 links (no Trading Desks) ✓ |
| Solutions dropdown | 7 links | 7 links | 7 links ✓ |
| CTA | `.btnGold` | `.btn .btn-primary .btn-sm` | `.btn .btn-primary .btn-sm` ✓ |
| Mobile hamburger | ✗ none | ✓ `.nav-toggle` | ✓ `.nav-toggle` |

**No new drift vs Investment.** Market and Investment are identical in nav structure. The drift is **between Homepage and product pages** (already documented in Delta 01 A.1–A.4).

**Pattern confirmation:** This is the **second product page** with the same nav structure. The "two nav systems" drift is now a **confirmed pattern across the product family**, not a page-specific issue.

## Item 8 — Buttons → **DRIFT — Same as Investment** (A)

- `.btn .btn-primary` / `.btn .btn-secondary` used — same as Investment
- Visually equivalent to Homepage's `.btnGold` / `.btnGhost`

**No new drift.** Pattern confirmed across product family.

## Item 9 — Motion → **PASS** (B)

- `bg-grid-enhanced::before` static grid ✓
- `glow-blue` / `glow-gold` static radial gradients ✓
- `glass-status-dot` 2s pulse ✓
- No entrance reveals, no ambient theatrics ✓

**Same as Investment.** Correct product-page restraint.

## Item 10 — Background / Atmosphere → **PASS** (B)

- Body: flat `--bg` ✓
- Hero: `.bg-grid-enhanced` + 2 soft glows ✓
- Section bands: alternating `--roua-bg-secondary` ✓
- CTA: `.cta-section::before` radial overlay ✓

**Same as Investment.**

## Item 11 — Mono Usage → **PASS** (A)

- Mono for: Evidence Chain labels, Value Chain labels, "ROUA Analytical Layer" label, all uppercase mono labels ✓
- Sans for: headlines, body, eyebrows ✓
- Clean separation ✓

**Same as Investment.**

## Item 12 — Icons → **PASS** (A)

- No inline SVG icons in this page ✓
- No emoji ✓
- No icon fonts ✓
- `.glass-card-brand-logo` "R" letter mark (CSS-only) ✓

**Same as Investment.**

## Item 13 — Visual Density → **PASS — Denser than Investment** (B)

### Found
- 5-card Problem grid (Investment has 4)
- 4-card Capabilities grid (same as Investment)
- 5-step How It Works vertical flow (same as Investment)
- **Full Evidence Example flow** (5 steps: Source → Verified Event → Evidence → ROUA Market Context → Market Impact Output) — Investment has a simpler evidence chain at line 406
- 2-card Primary + 4-card Secondary Buyer Environments grid (Investment has 6-card Built For grid)
- **4-card Before/After Business Outcomes grid** — unique to Market
- 4-card Deployment grid (same as Investment)

**Comparison:** Market is **structurally denser** than Investment — it has 3 additional sections (Positioning, Evidence Example, Business Outcomes) and uses 5-column grids where Investment uses 4-column.

**Classification:** **B (must adapt)** — Market Intelligence's narrative is more complex: it must show event → impact → outcome, not just fact → research. The additional density is justified.

**Verdict:** Do NOT change. The density serves the product's evidence-chain story.

## Item 14 — Responsive → **DRIFT — D.1 + legitimate override** (A)

### Found
- `.hero-split` collapses at `<968px` via `roua-v7.css` ✓
- Inline `<style>` block #1 (lines 13–30) targets non-existent `#integrates-with` and `#powered-by` — **dead code, same as Investment D.1**
- Inline `<style>` block #2 (lines 32–49) targets `.section div[style*="grid-template-columns: repeat(5, 1fr)"]` — **legitimate responsive override** for the 5-column Problem grid (collapses to 3 → 2 → 1 columns at 968/768/480 breakpoints)

**Classification:**
- Block #1: **D (dead code)** — same as Investment D.1. Pattern confirmed.
- Block #2: **A (must match — but acceptable)** — legitimate product-specific responsive override. Keep.

---

# PART 3 — TRUST GRAMMAR AUDIT (14 Items from §17 of v1)

## Item 1 — Verified Fact/Event → **PASS** ✓
Used at lines 196, 421, 423. Solid card with source's literal claim. Strong usage — 5 instances across the page.

## Item 2 — ROUA Context → **PASS — STRONGER than Investment** ✓
Used at lines 209, 210, 445, 447, 449. **Dashed gold border** (`border: 1px dashed var(--roua-accent-border)`) + **"Illustrative" label** + **"ROUA Analytical Layer — not source fact"** explicit disclaimer. This is the **canonical v1 §15 spec implementation**.

Investment's Hero did not have this layer. Market's Hero does. **Market is the gold-standard implementation** for Trust Grammar in product Heroes.

## Item 3 — Source Document → **PASS** ✓
Lines 204, 413, 437. Direct clickable external links with `rel="noopener"`. Three source-document references (Federal Reserve FOMC Statement + FOMC Implementation Note).

## Item 4 — Evidence → **PASS** ✓
Lines 432, 434. Structured evidence chain: Source → Verified Event → Evidence → ROUA Market Context → Market Impact Output. Five-step chain with provenance preserved.

## Item 5 — Provenance → **PASS** ✓
Line 436: "Provenance: Source document, paragraph preserved · Cross-reference: FOMC Implementation Note (IORB 3.65%)."

## Item 6 — Illustrative → **PASS** ✓
Lines 210, 217, 447, 496. Four instances of illustrative disclaimers. Multiple layers of "this is ROUA's analytical contribution, not source fact" messaging.

## Item 7 — Governance → **PASS** ✓
Lines 387, 388, 412, 466. Used correctly in audit/governance context.

## Item 8 — "audit-ready" forbidden phrase → **DRIFT — D.4** ✗

**Line 468:** `<span ...>Audit-Ready</span>` — used as a chip badge in the Market Intelligence Output section.

**v1 §15 spec:** "'audit-ready' = forbidden except on `risk-intelligence.html` (legitimate risk context)."

**This is a real Trust Grammar violation (D).** Investment page did NOT have this. Market page does.

**Classification:** **D (real defect — Trust Grammar violation)** — Must fix. Replace "Audit-Ready" with "Evidence-Linked" or "Inspectable" — both are v1-compliant alternatives.

## Item 9 — "within seconds" forbidden phrase → **PASS** ✓
Zero instances. The page uses "through configured source monitoring" (line 356) — **the exact locked phrase**. ✓

## Item 10 — "every claim" forbidden phrase → **PASS** ✓
Zero instances.

## Item 11 — "VERIFIED INTELLIGENCE OBJECT" forbidden phrase → **PASS** ✓
Zero instances.

## Item 12 — "Trust Promise" forbidden phrase → **PASS** ✓
Zero instances.

## Item 13 — "Provenance Immutability" forbidden phrase → **PASS** ✓
Zero instances.

## Item 14 — "Confidence score" forbidden phrase → **PASS** ✓
Zero instances.

---

# PART 4 — ADDITIONAL FINDINGS

## Finding X1 — "Bloomberg / Market Terminals" comparison block (D — same as Investment)

Lines 247, 251: Same direct competitor naming pattern as Investment (D.3 in Delta 01).

**Classification:** **D (content risk)** — same as Investment. Pattern confirmed. Will be addressed in product-family content review.

## Finding X2 — "Continuous intelligence" phrase (B)

Line 568: "Continuous intelligence from source-linked official sources" — used in Business Outcomes Before/After grid.

This is **not** the same as "continuously monitored" (which Investment uses and which is acceptable). "Continuous intelligence" is a marketing phrase describing the always-on nature of the intelligence feed.

**Classification:** **B** — Acceptable marketing language. Does not violate Trust Grammar (no timing claim, no "real-time" promise). Do NOT change.

## Finding X3 — Footer matches v1 spec (A)

Footer structure: 6 columns (Brand + Products + Platform + Solutions + Experience + Company). No "Channels" column. ✓ Same as Investment.

## Finding X4 — No platform stats in Hero (A)

Market Hero's glass card shows a **Sample Intelligence Object** (real FOMC event), NOT platform stats. ✓ Same as Investment.

## Finding X5 — Three CTAs in CTA section (B — denser than Investment)

Market CTA section (lines 668–672) has **3 CTAs**: "Request Market Assessment" (primary) + "← Back to Catalog" (secondary) + "View Architecture" (secondary).

Investment CTA has **3 CTAs** too: "Request Investment Intelligence Briefing" + "View Architecture" + "← Back to Catalog".

**Same structure, different order.** Acceptable.

## Finding X6 — "Assess how your institution..." CTA headline (B)

Market CTA headline: "Assess how your institution turns financial events into market intelligence."
Investment CTA headline: "Request an Investment Intelligence Briefing."

Market uses "Assess" (consultative framing). Investment uses "Request" (direct framing). Both are acceptable product-specific tones.

**Classification:** **B** — Acceptable adaptation. Market's consultative tone fits its more complex buyer workflow narrative.

---

# PART 5 — DRIFT SUMMARY

## All Findings by Category

### A — Must match (system primitives)
| ID | Finding | Severity | Pattern? | Action |
|---|---|---|---|---|
| A.1 | Two nav class systems (Homepage `.wrap/.nav` vs product `.container/.nav-container`) | Low | **Confirmed pattern** (Investment + Market) | Park for global cleanup |
| A.2 | Two container classes (`.wrap` 1240px vs `.container` 1200px) | Negligible | **Confirmed pattern** | Park for global cleanup |
| A.3 | Two button class systems (`.btnGold/.btnGhost` vs `.btn/.btn-primary/.btn-secondary`) | Negligible | **Confirmed pattern** | Park for global cleanup |
| A.4 | Product pages have mobile hamburger; Homepage does not | Real defect on Homepage | **Confirmed pattern** | Document for Homepage delta report |

**Status:** All A-category drifts are **confirmed patterns across the product family**, not page-specific. Will be addressed in global cleanup phase (last).

### B — Must adapt to product nature (expected differences)
| ID | Finding | Verdict |
|---|---|---|
| B.1 | Hero H1 weight 300 (light) vs Homepage 800 | Correct adaptation — same as Investment |
| B.2 | `.card-accent` (premium) used for marketing cards | Correct — same as Investment |
| B.3 | Hero composition: `.hero-split` + `.glass-status-card` + Sample Intelligence Object | Correct — same as Investment |
| B.4 | Motion restrained (only status dot pulse) | Correct — same as Investment |
| B.5 | Atmosphere restrained (thin grid + 2 soft glows) | Correct — same as Investment |
| B.6 | Density **higher than Investment** (5-col Problem grid, full Evidence Example flow, Business Outcomes Before/After grid) | **Correct product-specific adaptation** — Market's narrative requires more evidence-chain density |
| B.7 | **ROUA Context layer in Hero** with dashed gold border + "Illustrative" label + "ROUA Analytical Layer — not source fact" disclaimer | **Stronger than Investment** — Market is the gold-standard implementation of v1 §15 Trust Grammar in product Heroes |
| B.8 | "Continuous intelligence" marketing phrase | Acceptable — not a timing claim |
| B.9 | CTA "Assess" consultative tone | Acceptable product-specific tone |

### C — Must NOT transfer from Homepage
| ID | Finding | Verdict |
|---|---|---|
| C.1–C.10 | All 10 Homepage-brand elements | ✓ **All correctly absent** — same as Investment |

**All C-category checks PASS.** Pattern confirmed across product family.

### D — Real defects
| ID | Finding | Severity | Pattern? | Action |
|---|---|---|---|---|
| D.1 | Dead inline `<style>` block #1 (lines 13–30) targeting non-existent IDs | Low — dead code | **Confirmed pattern** (Investment D.1 + Market D.1) | Remove lines 13–30 |
| **D.2** | **3 instances of `rgba(201, 162, 39, ...)` (OLD gold) at lines 405, 460** | **Real defect — old token drift** | **NEW — NOT in Investment** | Replace with `rgba(227, 180, 90, ...)` |
| **D.3** | **Malformed HTML comment at line 652** (nested `<!--` inside `<!--`) | **Real defect — malformed HTML** | **NEW — NOT in Investment** | Replace with single clean comment |
| **D.4** | **"Audit-Ready" chip at line 468** | **Real defect — Trust Grammar violation** | **NEW — NOT in Investment** | Replace with "Evidence-Linked" or "Inspectable" |
| D.5 | "Bloomberg / Market Terminals" direct competitor naming (lines 247, 251) | Content risk | **Confirmed pattern** (Investment D.3 + Market D.5) | Document for content review |

---

# PART 6 — VERDICT

## Is `market-intelligence.html` aligned with v1?

**Yes, strongly — and in some ways MORE aligned than Investment.**

The page:
- Uses canonical `--roua-*` token aliases exclusively (except for the 3 old-gold rgba instances in D.2)
- Correctly adapts Hero, motion, atmosphere, and density for evidence-first role
- Implements **the strongest Trust Grammar Hero pattern** in the product family so far (ROUA Context layer with dashed gold border + "Illustrative" label + "not source fact" disclaimer)
- Has 13/14 Trust Grammar checks PASS (only "audit-ready" violation at D.4)
- Correctly excludes all 10 Homepage-brand elements
- Has 3 NEW defects not seen in Investment (D.2, D.3, D.4) + 2 confirmed patterns (D.1, D.5)

## Recommended fixes for this page (priority order)

| Priority | ID | Fix | Effort |
|---|---|---|---|
| **P1** | D.2 | Replace `rgba(201, 162, 39, ...)` with `rgba(227, 180, 90, ...)` at lines 405 and 460 (3 instances) | 2 minutes |
| **P1** | D.3 | Fix malformed HTML comment at line 652 — replace with `<!-- ============ CTA ============ -->` | 1 minute |
| **P1** | D.4 | Replace "Audit-Ready" chip at line 468 with "Evidence-Linked" or "Inspectable" | 1 minute |
| P2 | D.1 | Remove dead inline `<style>` block #1 (lines 13–30) | 1 minute |
| P3 | D.5 | Soften "Bloomberg / Market Terminals" to "Market Data Terminals" (content review) | 1 minute |

**Total fix budget:** ~6 minutes for P1+P2.

---

# PART 7 — CROSS-REPORT COMPARISON (Delta 01 vs Delta 02)

## Pattern Confirmation Matrix

| Drift Type | Investment (Delta 01) | Market (Delta 02) | Pattern? |
|---|---|---|---|
| A.1 Two nav class systems | ✓ | ✓ | **Confirmed product-family pattern** |
| A.2 Two container classes | ✓ | ✓ | **Confirmed product-family pattern** |
| A.3 Two button class systems | ✓ | ✓ | **Confirmed product-family pattern** |
| A.4 Mobile hamburger (product has, Homepage lacks) | ✓ | ✓ | **Confirmed product-family pattern** |
| B.1 Hero H1 weight 300 | ✓ | ✓ | **Confirmed product-family adaptation** |
| B.2 `.card-accent` for marketing cards | ✓ | ✓ | **Confirmed product-family adaptation** |
| B.3 Hero composition (`.hero-split` + `.glass-status-card`) | ✓ | ✓ | **Confirmed product-family adaptation** |
| B.4 Motion restrained | ✓ | ✓ | **Confirmed product-family adaptation** |
| B.5 Atmosphere restrained | ✓ | ✓ | **Confirmed product-family adaptation** |
| C.1–C.10 Homepage-brand elements absent | ✓ all 10 | ✓ all 10 | **Confirmed product-family compliance** |
| D.1 Dead inline `<style>` block (lines 13–30) | ✓ | ✓ | **Confirmed product-family defect** — likely copy-paste artifact |
| D.2 Old-gold `rgba(201,162,39,...)` | ✗ | ✓ | **Market-specific defect** |
| D.3 Malformed HTML comment | ✗ | ✓ | **Market-specific defect** |
| D.4 "audit-ready" Trust Grammar violation | ✗ | ✓ | **Market-specific defect** |
| D.5 "Bloomberg" competitor naming | ✓ | ✓ | **Confirmed product-family content risk** |

## Key Insights

### 1. The product family is structurally consistent
Investment and Market share the same nav, button, card, motion, atmosphere, and Hero composition patterns. The v1 reference successfully identifies these as **B-category adaptations** (correct, do not change), not defects.

### 2. Each product page has its own D-category defects
- Investment had 3 D-defects (dead CSS, missing Trading Desks in nav [Homepage's fault], Bloomberg naming)
- Market has 5 D-defects (dead CSS, old-gold rgba, malformed comment, audit-ready violation, Bloomberg naming)

**Only 2 of 5 D-defects are shared** (D.1 dead CSS, D.5 Bloomberg naming). The other 3 are **page-specific**. This means **page-by-page audits remain necessary** — there is no single "product-family fix" that catches everything.

### 3. Market has STRONGER Trust Grammar in Hero than Investment
Market's Hero includes the explicit ROUA Context / Illustrative layer (dashed gold border + "not source fact" disclaimer). Investment's Hero does not. This is **not a defect in Investment** — it's a **product-nature difference**:
- Market Intelligence is about **interpreting events** (what does FOMC mean for USD?) — boundary between evidence and analysis MUST be visible
- Investment Intelligence is about **verifying facts** (Aramco Q1 $33.6B) — boundary is less critical because the fact itself is the product

**This validates the v1 principle:** "The Homepage is the reference, not the victim. Each product adapts to its nature."

### 4. The old-gold rgba drift (D.2) suggests an older codebase layer
The `rgba(201, 162, 39, ...)` values come from the deprecated `VISUAL-IDENTITY-SYSTEM.md` (Aug 7). They likely survived from an earlier version of the page that was not fully migrated to v7 tokens. This is exactly the kind of defect the **global cleanup phase** will catch — but it's also a **page-specific fix** that can be done now.

### 5. The malformed comment (D.3) suggests incomplete editing
Line 652 looks like a botched merge of two section markers: `<!-- CTA -->` and `<!-- 8. CTA -->`. This is a copy-paste or merge artifact, not a design decision. Trivial to fix.

---

# PART 8 — MODEL VALIDATION (Cumulative)

## What Delta 01 + Delta 02 together prove about v1

1. **The A/B/C/D framework scales.** Applied to two pages, it consistently separates patterns from defects.
2. **The 14+14 checklist is reliable.** Both pages pass C-category 10/10 and most Trust Grammar items.
3. **Product-family patterns are emerging.** Nav, buttons, container, Hero composition, motion, atmosphere — all consistent across Investment and Market. These will become **product-family baseline rules** in the eventual system documentation.
4. **Page-specific defects remain real.** Each page has its own D-category issues that cannot be caught by pattern-matching alone. **Page-by-page audits remain necessary through all 5 product pages.**
5. **The model correctly identifies adaptation vs drift.** Market's higher density and stronger Trust Grammar Hero are correctly classified as B (adaptation), not D (defect).

## Recommended next step

Continue with **Delta 03: `risk-intelligence.html`** — the third product page. This will further validate the product-family patterns and may reveal whether the "audit-ready" exception (legitimate on risk page per v1 §15) is correctly scoped.

---

*End of Delta Report 02.*

# Delta Report 03 — `risk-intelligence.html` vs ROUA Visual System v1

> **Status:** Third test of `ROUA-VISUAL-SYSTEM-v1.md` against a product page.
> **Audited file:** `/home/z/my-project/rouaa-corporate/rouaa-web/risk-intelligence.html` (696 lines)
> **Reference:** `ROUA-VISUAL-SYSTEM-v1.md` (commit `855ffd1`) + `index.html` (commit `de9830f`)
> **Baseline:** `DELTA-01-investment-intelligence.md` + `DELTA-02-market-intelligence.md`
> **Method:** No code modification. Drift classified into A/B/C/D per user framework.
> **Special focus per user request:** Audit-Ready exception scoping, Trust boundary integrity, OFAC source integrity, Gold/token drift (context-checked), HTML integrity (comments/div/anchors/orphaned CSS), product-family patterns, Risk-specific differences (do NOT force Investment/Market grammar if functionally justified).

---

## Classification Framework (Same as Delta 01 + 02)

| Category | Meaning |
|---|---|
| **A** | Must match — system primitives |
| **B** | Must adapt to product nature |
| **C** | Must NOT transfer from Homepage |
| **D** | Real defect — must fix |

---

# PART 1 — STRUCTURAL FACTS

## 1.1 CSS / JS Stack

| Component | Loaded | Notes |
|---|---|---|
| `roua-v7.css` | ✓ | Same as Investment + Market |
| `roua-v7-patch.css` | ✓ | Same as Investment + Market |
| `styles.css` | ✗ NOT loaded | Same as Investment + Market — not needed |
| Inline `<style>` block (lines 13–30) | ✓ | Targets `#integrates-with` and `#powered-by` — **IDs that DO NOT EXIST in this page**. Dead code. **Same defect as Investment D.1 + Market D.1.** |
| `main.js` + `design-system/roua-v7.js` | ✓ | Same as Investment + Market |

**Finding:** Inline `<style>` block is dead code — **third consecutive page with this defect**. Confirmed product-family pattern.

## 1.2 Token Usage

| Token Family | Usage | Verdict |
|---|---|---|
| `--roua-*` aliases | Used throughout | ✓ Correct |
| Old tokens (`--bg`, `--gold`, etc.) directly | **0 instances** | ✓ Same as Investment + Market |
| Raw hex values | **0 instances** | ✓ Same as Investment + Market |
| `rgba(201, 162, 39, ...)` (OLD gold from `VISUAL-IDENTITY-SYSTEM.md`) | **2 instances** at lines 416, 483 | ⚠ **DRIFT — D.2** (same as Market D.2) |
| `rgba(255, 255, 255, ...)` (white, glass card surface) | 2 instances | Acceptable — same as Investment + Market |

**Drift D.2 — Old-gold rgba values:** Lines 416 and 483 use `rgba(201, 162, 39, 0.06/0.08/0.02)` — the OLD `#C9A227` gold. Same defect as Market D.2. Both pages have the **exact same pattern**: one instance in the evidence-flow card box-shadow, one in the Risk/Market Intelligence Output card gradient background.

**Classification:** **D (real defect — old token drift)** — Same as Market D.2. Pattern confirmed.

## 1.3 Page Structure

```
1.  Navigation (lines 36–123)
2.  Hero — Product-Forward (lines 125–254)                      ← UNIQUE: has CTA row + trust pills in Hero
3.  The Problem — 4 cards (lines 256–292)                       ← Same count as Investment
4.  Capabilities — 4 cards (lines 294–325)                      ← Same as Investment + Market
5.  Differentiation (lines 327–351)                             ← Equivalent to Market's Positioning
6.  How It Works — 5-step buyer workflow (lines 353–404)        ← Same as Market
7.  Evidence Example — OFAC Sanctions Action (lines 406–501)    ← 5-step flow with Blocked Property detail
8.  Buyer Environments (lines 503–546)                          ← Same as Market
9.  Deployment (lines 548–595)                                  ← Same as Investment + Market
10. CTA (lines 598–636)                                         ← UNIQUE: 4-card assessment grid
11. Footer (lines 638–691)
```

- `<section>` count: 9 (vs Investment's 8, Market's 10)
- `<div>` balance: 248 / 248 ✓ PASS
- `<section>` balance: 9 / 9 ✓ PASS
- HTML comment balance: 32 `<!--` / 31 `-->` ⚠ **FAIL** (see D.3 below)

## 1.4 HTML Comment Defect (D.3 — SAME as Market)

**Line 598:** `<!-- ============ CTA ============  <!-- ============ 8. CTA ============ -->`

This is the **exact same malformed nested comment** as Market D.3 (line 652). Same string, same pattern: `<!-- ============ CTA ============  <!-- ============ 8. CTA ============ -->`.

**Pattern confirmation:** This defect appears in BOTH Market (line 652) and Risk (line 598), but NOT in Investment (which has clean `<!-- ============ 10. CTA ============ -->` at line 553).

This is a **copy-paste artifact** that propagated from one page to the other. Investment escaped it because it was edited separately (or earlier).

**Classification:** **D (real defect — malformed HTML)** — Same as Market D.3. Pattern confirmed across Market + Risk.

## 1.5 Duplicate Closing Tags Check

Initial scan flagged 5 potential duplicate `</div></div>` patterns. Manual verification confirmed these are **false positives** — they are normal nested div closes at different indentation levels (inner card div + outer container div). Div balance 248/248 PASS confirms structure is sound.

**No real duplicate closing tag defects.** ✓

## 1.6 Broken Anchors Check

Scanned all `href="#..."` internal anchors against `id="..."` attributes in the page.

**Result:** Zero broken internal anchors. ✓

The only internal anchor is `href="#capabilities"` at line 148 (Hero CTA "Explore Risk Intelligence →"), which correctly targets `id="capabilities"` at line 295.

---

# PART 2 — VISUAL IDENTITY AUDIT (14 Items from §17 of v1)

## Item 1 — Color Tokens → **PASS** (A)

Same as Investment + Market: `--roua-*` aliases used exclusively, no raw hex, no old base tokens. Exception: 2 `rgba(201,162,39,...)` instances (D.2 above).

## Item 2 — Typography → **PASS** (A/B)

Same as Investment + Market: Inter sans + Fira Code mono, Hero H1 weight 300, section H2 via `.section-header h2`, mono labels 11px / 0.1–0.14em.

**No drift from Investment or Market.** Product-family typography rhythm is consistent across all 3 pages.

## Item 3 — Container & Grid → **PASS** (A)

Same as Investment + Market: `.container` (1200px max), 4-column grids for Problem/Capabilities/Deployment, 2-column for Buyer Environments primary, 3-column for Buyer Environments secondary.

**No drift.**

## Item 4 — Section Rhythm → **PASS** (A)

- Standard 88px padding via `.section` ✓
- Differentiation section: 48px compressed (line 328) — same pattern as Market's Positioning section ✓
- Alternating `--roua-bg-secondary` bands at: Problem(yes), Capabilities(no), Differentiation(no), How It Works(yes), Evidence Example(no), Buyer Environments(yes), Deployment(no), CTA(yes) ✓

## Item 5 — Card Hierarchy → **PASS** (B)

- `.card.card-accent` used throughout ✓ — same as Investment + Market
- Evidence Example uses gold-bordered flow card (line 416) — same pattern as Market
- The box-shadow at line 416 uses old-gold rgba (D.2) — but structural pattern is correct

## Item 6 — Hero Composition → **PASS — STRONGEST Hero in product family** (B)

### Risk Hero Composition
1. `.bg-grid-enhanced` + `.glow-blue` + `.glow-gold` — same as Investment + Market ✓
2. `.hero-split` grid: 1.1fr .9fr — same ✓
3. Left: eyebrow + h1 + subheadline + **CTA row** + **3 trust pills** ← UNIQUE
4. Right: `.glass-status-card` with:
   - Brand header + Status badge ✓
   - Title + tagline ✓
   - **Sample Intelligence Object** with 4 evidence layers (same as Market):
     - Verified Risk Event (OFAC sb0581, 2 firms + 8 vessels)
     - Source Document (U.S. Treasury direct link)
     - **ROUA Risk Context — Illustrative** (dashed gold border)
     - Inspect in Evidence Explorer link
   - Risk Intelligence Value Chain (Official Risk Event → Designated Entities → Exposure Review → Audit-Ready Decision)

### Comparison with Investment + Market Heroes

| Layer | Investment | Market | Risk |
|---|---|---|---|
| Verified Fact/Event | ✓ (Aramco) | ✓ (FOMC) | ✓ (OFAC sb0581) |
| Source Document | ✓ | ✓ | ✓ |
| Provenance | ✓ (separate row) | ✓ (inline) | ✓ (inline) |
| **ROUA Context (Illustrative)** | ✗ NOT in Hero | ✓ Present | ✓ Present |
| Evidence Explorer link | ✓ | ✓ | ✓ |
| Value Chain | ✓ (4 steps) | ✓ (4 steps) | ✓ (4 steps) |
| **CTA row in Hero** | ✗ | ✗ | **✓ Present** (Explore + Request Briefing) |
| **Trust pills in Hero** | ✗ | ✗ | **✓ Present** (3 pills: Regulatory Events, Exposure Review, Audit-Ready Outputs) |

**Finding:** Risk Hero is the **most compositionally rich** in the product family. It includes:
- CTA row (Investment + Market do NOT have CTAs in Hero)
- 3 trust pills with SVG icons (Investment + Market do NOT have these)
- Full Sample Intelligence Object with ROUA Context layer (same as Market, stronger than Investment)

**Classification:** **B (must adapt)** — Risk has the strongest "decision-ready" framing because the buyer (risk/compliance teams) needs immediate confidence that the system produces audit-ready outputs. The trust pills (especially "Audit-Ready Outputs") are a Risk-specific selling point that belongs in the Hero.

**Verdict:** Do NOT change. This is correct Risk-specific adaptation. Forcing Risk to match Investment/Market's sparser Hero would weaken its buyer-specific value proposition.

## Item 7 — Navigation → **DRIFT — Same as Investment + Market** (A)

| Element | Homepage | Investment | Market | Risk |
|---|---|---|---|---|
| Nav class | `.wrap .nav` | `.container .nav-container` | `.container .nav-container` | `.container .nav-container` ✓ |
| Brand | SVG hex + h1 | Text-only | Text-only | Text-only ✓ |
| Products dropdown | 7 links | 6 links | 6 links | 6 links ✓ |
| Solutions dropdown | 7 links | 7 links | 7 links | 7 links ✓ |
| CTA | `.btnGold` | `.btn .btn-primary .btn-sm` | `.btn .btn-primary .btn-sm` | `.btn .btn-primary .btn-sm` ✓ |
| Mobile hamburger | ✗ | ✓ | ✓ | ✓ ✓ |

**No new drift.** Pattern confirmed across all 3 product pages.

## Item 8 — Buttons → **DRIFT — Same as Investment + Market** (A)

- `.btn .btn-primary` / `.btn .btn-secondary` used — same as Investment + Market
- Visually equivalent to Homepage's `.btnGold` / `.btnGhost`

**No new drift.** Pattern confirmed across all 3 product pages.

## Item 9 — Motion → **PASS** (B)

Same as Investment + Market: `bg-grid-enhanced::before` static grid, `glow-blue`/`glow-gold` static, `glass-status-dot` 2s pulse. No ambient theatrics.

## Item 10 — Background / Atmosphere → **PASS** (B)

Same as Investment + Market: flat body bg, Hero grid + 2 glows, alternating section bands, CTA radial overlay.

## Item 11 — Mono Usage → **PASS** (A)

Clean sans/mono separation. Mono for labels, evidence chain, value chain, metadata. Sans for headlines, body, eyebrows.

## Item 12 — Icons → **PASS — Richer than Investment + Market** (B)

### Found
- **3 inline SVG icons in Hero trust pills** (lines 156, 165, 174) — globe, checkmark, shield
- All SVGs: `viewBox="0 0 24 24"`, `stroke="currentColor"`, `stroke-width="1.6"`, `fill="none"`, `stroke-linecap="round"`, `stroke-linejoin="round"` — matches v1 §11 spec exactly ✓
- `.glass-card-brand-logo` "R" letter mark ✓
- CTA assessment cards use `&#9656;` (▶) character — acceptable decorative marker
- No emoji ✓, no icon fonts ✓

**Classification:** **B** — Risk uses more inline SVG icons than Investment + Market because of the trust pills. This is correct adaptation — Risk buyers need visual reassurance of the three trust pillars.

## Item 13 — Visual Density → **PASS — Between Investment and Market** (B)

### Found
- 4-card Problem grid (same as Investment, less than Market's 5)
- 4-card Capabilities grid (same as both)
- 5-step How It Works (same as Market)
- **Full Evidence Example flow** with 5 steps + Blocked Property detail (8 vessels with IMO numbers) — denser than Market's evidence example
- 2-card Primary + 3-card Secondary Buyer Environments (Market has 2+4)
- 4-card Deployment grid (same as both)
- **4-card CTA assessment grid** — unique to Risk (Investment + Market use 2-column checklist)

**Classification:** **B** — Risk is denser than Investment, slightly less dense than Market in section count but denser in evidence-example detail (8 vessels with IMO numbers is a unique evidence-density pattern).

**Verdict:** Do NOT change. The 8-vessel detail is exactly what a risk/compliance buyer needs to see — it proves the system preserves the full granularity of the source.

## Item 14 — Responsive → **DRIFT — D.1** (A)

Same as Investment + Market: dead inline `<style>` block (lines 13–30) targeting non-existent IDs.

**Classification:** **D.1 (dead code)** — third consecutive page with this defect. Confirmed product-family pattern.

---

# PART 3 — TRUST GRAMMAR AUDIT (14 Items from §17 of v1)

## Item 1 — Verified Fact/Event → **PASS** ✓

Used at lines 213, 432, 434. Label is **"Verified Risk Event"** (Risk-specific variant) — solid card with source's literal claim. 3 instances.

The Risk page correctly uses "Verified Risk Event" (not generic "Verified Fact" or "Verified Event") — this is the **product-specific Trust Grammar label** that distinguishes risk events from investment facts or market events.

## Item 2 — ROUA Context → **PASS — Strongest implementation** ✓

Used at lines 226, 227, 468, 470, 472. **5 instances** of "ROUA Risk Context" — the most of any product page so far.

Implementation:
- **Dashed gold border** (`border: 1px dashed var(--roua-accent-border)`) ✓
- **"Illustrative" label** ✓
- **"ROUA Analytical Layer — not source fact"** explicit disclaimer ✓
- Content clearly analytical: "Potential exposure requiring review: maritime insurance, vessel counterparties, shipping activity, payments involving designated persons, 50% rule"

This is the **canonical v1 §15 spec implementation** — same pattern as Market, both stronger than Investment.

## Item 3 — Source Document → **PASS** ✓

Lines 221, 424, 460. **Three direct clickable links** to official sources:
- `https://home.treasury.gov/news/press-releases/sb0581` (Treasury press release — 2 links)
- `https://ofac.treasury.gov/recent-actions/20260729` (OFAC Recent Actions — 1 link)

All with `target="_blank" rel="noopener"`. This is the **strongest source-document implementation** in the product family — three distinct official links, not just one.

## Item 4 — Evidence → **PASS** ✓

Lines 459, 489. Structured 5-step evidence chain:
1. Source (Treasury press release)
2. Verified Event (2 firms + 8 vessels)
3. Blocked Property (8 vessels with IMO numbers + associated companies)
4. ROUA Risk Context (analytical, dashed border)
5. Risk Briefing (output)

Plus "Evidence Pack Attached" chip at line 489 — distinct Risk-specific evidence label.

## Item 5 — Provenance → **PASS** ✓

Line 459: "Provenance: Source document, vessel names and IMO numbers preserved · Cross-reference: OFAC Recent Actions (20260729)."

Structured metadata with cross-reference to a second official source. **Stronger than Investment + Market** — both the primary source (Treasury press release) and a cross-reference (OFAC Recent Actions) are linked.

## Item 6 — Illustrative → **PASS** ✓

Lines 227, 234, 470, 475, 497. Five instances of illustrative disclaimers. Multiple layers of "this is ROUA's analytical contribution, not source fact" messaging.

## Item 7 — Governance → **PASS** ✓

Line 398: "Audit & governance" label on Step 05 of How It Works. Used correctly in audit/governance context.

## Item 8 — "audit-ready" forbidden phrase → **PASS — EXCEPTION CORRECTLY APPLIED** ✓✓

**This is the key test for Delta 03.**

v1 §15 spec: "'audit-ready' = forbidden except on `risk-intelligence.html` (legitimate risk context)."

### Findings (9 total instances)

| Line | Context | Verdict |
|---|---|---|
| 6 | `<title>` — "Audit-Ready Risk Intelligence for Material Decisions" | ✓ Legitimate — Risk page title |
| 7 | `<meta description>` — "audit-ready evidence for material decisions" | ✓ Legitimate — Risk page meta |
| 143 | Hero subheadline — "audit-ready assessments" | ✓ Legitimate — Risk product description |
| 177 | Hero trust pill — "Audit-Ready Outputs" | ✓ Legitimate — Risk trust pillar |
| 247 | Hero value chain — "Audit-Ready Decision" | ✓ Legitimate — Risk value chain endpoint |
| 358 | How It Works H2 — "From regulatory event to audit-ready decision" | ✓ Legitimate — Risk workflow description |
| 411 | Evidence Example H2 — "What an audit-ready risk briefing looks like" | ✓ Legitimate — Risk evidence example |
| 412 | Evidence Example lead — "to audit-ready output" | ✓ Legitimate — Risk output description |
| 491 | Evidence Example chip — "Audit-Ready" | ✓ Legitimate — Risk output badge |

**Verdict:** ALL 9 instances are in legitimate Risk/governance context. The exception is **correctly scoped** — "audit-ready" appears only on `risk-intelligence.html` (the one page where it is allowed), and every usage directly relates to risk/compliance audit defensibility.

**This validates v1 §15's exception design.** The rule is not "audit-ready is forbidden everywhere" — it is "audit-ready is forbidden everywhere EXCEPT risk-intelligence.html, where it is the core value proposition."

**Comparison with Market D.4:** Market had "Audit-Ready" at line 468 — that was a **violation** because Market is NOT the risk page. Risk having it is **correct**.

**Classification:** **PASS** — Exception correctly applied. Do NOT change.

## Item 9 — "within seconds" forbidden phrase → **PASS** ✓

Zero instances. The page uses "through configured source monitoring" (line 367) — **the exact locked phrase**. ✓ Same as Market.

## Item 10 — "every claim" → **PASS** ✓
Zero instances.

## Item 11 — "VERIFIED INTELLIGENCE OBJECT" → **PASS** ✓
Zero instances.

## Item 12 — "Trust Promise" → **PASS** ✓
Zero instances.

## Item 13 — "Provenance Immutability" → **PASS** ✓
Zero instances.

## Item 14 — "Confidence score" → **PASS** ✓
Zero instances. The page uses "evidence confidence" (line 316) — acceptable variant.

---

# PART 4 — USER-SPECIFIED FOCUS AREAS

## Focus 1 — Audit-Ready Exception → **PASS** ✓✓

(See Item 8 above.)

**Conclusion:** The exception is correctly scoped. All 9 instances serve Risk's nature. Do NOT remove any.

## Focus 2 — Trust Boundary → **PASS** ✓✓

User specified chain: `Official Risk Event → Verified Risk Event → Designated Entity / Exposure → Evidence → Decision Context`

### Hero value chain (line 240–248)
```
Official Risk Event → Designated Entities → Exposure Review → Audit-Ready Decision
```
**4-step chain.** Matches user spec (condensed — "Designated Entities" combines designated entity + exposure, "Audit-Ready Decision" = Decision Context).

### Evidence Example 5-step flow (lines 418–494)
```
Source → Verified Event → Blocked Property → ROUA Risk Context → Risk Briefing
```
**5-step chain.** Matches user spec exactly:
- Source = Official Risk Event origin
- Verified Event = Verified Risk Event ✓
- Blocked Property = Designated Entity / Exposure ✓ (8 vessels with IMO numbers — designated property detail)
- ROUA Risk Context = Evidence + analytical context ✓
- Risk Briefing = Decision Context ✓

### No analysis leakage into fact section

**Verified Risk Event (lines 212–216):** Contains ONLY source's literal claim:
- "Two firms designated under E.O. 13902 + eight vessels identified as blocked property"
- "Persian Gulf Marine Insurance Co. · HormuzSafe Marine Services Authority"

**NO ROUA analysis in this card.** ✓

**ROUA Risk Context (lines 226–229):** Clearly separated analytical layer:
- Dashed gold border (visual cue)
- "Illustrative" label (semantic cue)
- "ROUA Analytical Layer — not source fact" disclaimer (explicit boundary)
- Content: "Potential exposure requiring review: maritime insurance, vessel counterparties, shipping activity, payments involving designated persons, 50% rule"

**The boundary between evidence and analysis is visible to the buyer.** ✓✓

**Conclusion:** Trust boundary is perfectly maintained. No analysis leakage into fact section.

## Focus 3 — OFAC Source Integrity → **PASS** ✓✓

User specified requirements:
1. **Official source** ✓ — `home.treasury.gov/news/press-releases/sb0581` (Treasury press release) + `ofac.treasury.gov/recent-actions/20260729` (OFAC Recent Actions)
2. **Designated entity** ✓ — "Persian Gulf Marine Insurance Co. · HormuzSafe Marine Services Authority" (lines 215, 435) + 8 vessels with IMO numbers + associated companies (lines 449–456)
3. **Event date** ✓ — "July 29, 2026" (lines 209, 222, 423, 460, 486)
4. **Evidence/Provenance** ✓ — Line 459: "Provenance: Source document, vessel names and IMO numbers preserved · Cross-reference: OFAC Recent Actions (20260729)."
5. **Link to official source** ✓ — Three direct clickable links (lines 221, 424, 460), all with `target="_blank" rel="noopener"`

**Conclusion:** OFAC source integrity is **perfect**. All 5 requirements met. This is the strongest source-integrity implementation in the product family.

## Focus 4 — Gold/Token Drift (Context-Checked) → **D.2** ⚠

### Findings

| Location | Value | Context | Verdict |
|---|---|---|---|
| Line 416 | `rgba(201, 162, 39, 0.06)` | Evidence flow card box-shadow | **D.2 — old gold drift** |
| Line 483 | `rgba(201, 162, 39, 0.08)` + `rgba(201, 162, 39, 0.02)` | Risk Briefing output card gradient background | **D.2 — old gold drift** |

### Context Analysis

Both instances are in the **Evidence Example section** — the same section where Market D.2 occurred. The pattern is identical:
- Line 416 = evidence flow card box-shadow (Market line 405)
- Line 483 = output card gradient (Market line 460)

This confirms the old-gold rgba drift is **a pattern in the Evidence Example section template**, not a page-specific typo. The Evidence Example section was likely built once (for Market) and copied to Risk, carrying the old-gold rgba values along.

**Classification:** **D.2 (real defect — old token drift)** — Must fix, but the fix is the same as Market D.2: replace `rgba(201, 162, 39, ...)` with `rgba(227, 180, 90, ...)`. This will likely be a **single fix across both Market and Risk** (and possibly Media + Developer if they have the same Evidence Example section).

## Focus 5 — HTML Integrity → **D.3** ⚠

### Findings

| Check | Result |
|---|---|
| `<div>` balance | 248 / 248 ✓ PASS |
| `<section>` balance | 9 / 9 ✓ PASS |
| HTML comment balance | 32 / 31 ⚠ **FAIL** |
| Duplicate closing tags | None (false positives confirmed) ✓ |
| Broken internal anchors | None ✓ |
| Orphaned CSS (dead `<style>` block) | D.1 — lines 13–30 target non-existent IDs ⚠ |

### Comment Defect (D.3)

**Line 598:** `<!-- ============ CTA ============  <!-- ============ 8. CTA ============ -->`

Same exact string as Market line 652. Confirmed copy-paste artifact.

**Classification:** **D.3 (real defect — malformed HTML)** — Same as Market D.3.

## Focus 6 — Product-Family Patterns → **CONFIRMED** ✓

### A-category patterns (confirmed across Investment + Market + Risk)

| Pattern | Investment | Market | Risk |
|---|---|---|---|
| A.1 Two nav class systems | ✓ | ✓ | ✓ |
| A.2 Two container classes | ✓ | ✓ | ✓ |
| A.3 Two button class systems | ✓ | ✓ | ✓ |
| A.4 Mobile hamburger (product has, Homepage lacks) | ✓ | ✓ | ✓ |

**All 4 A-category patterns confirmed across 3 pages.** Will be addressed in global cleanup phase.

### D-category patterns (confirmed)

| Pattern | Investment | Market | Risk |
|---|---|---|---|
| D.1 Dead inline `<style>` block (lines 13–30) | ✓ | ✓ | ✓ |
| D.2 Old-gold `rgba(201,162,39,...)` in Evidence Example | ✗ | ✓ | ✓ |
| D.3 Malformed HTML comment at CTA section | ✗ | ✓ | ✓ |
| D.5 "Bloomberg" competitor naming | ✓ | ✓ | ✓ |

**D.1, D.5 confirmed across all 3 pages.** D.2, D.3 confirmed across Market + Risk (Investment does not have an Evidence Example section with the same template).

## Focus 7 — Risk-Specific Defects (Do NOT force Investment/Market grammar)

### Risk-specific differences that are CORRECT (do not change)

| Difference | Risk | Investment/Market | Verdict |
|---|---|---|---|
| Hero has CTA row | ✓ (Explore + Request Briefing) | ✗ (no CTAs in Hero) | **Correct Risk adaptation** — Risk buyers need immediate action path |
| Hero has 3 trust pills | ✓ (Regulatory Events, Exposure Review, Audit-Ready Outputs) | ✗ | **Correct Risk adaptation** — Risk buyers need visual reassurance of trust pillars |
| Uses "Verified Risk Event" label | ✓ | Investment: "Verified Fact", Market: "Verified Event" | **Correct product-specific Trust Grammar** |
| Uses "ROUA Risk Context" label | ✓ | Investment: none, Market: "ROUA Market Context" | **Correct product-specific Trust Grammar** |
| Uses "Audit-Ready" (9 instances) | ✓ | ✗ (forbidden) | **Correct exception per v1 §15** |
| Evidence Example includes Blocked Property detail (8 vessels + IMO) | ✓ | Market: no equivalent detail | **Correct Risk-specific evidence density** |
| CTA assessment uses 4-card grid | ✓ | Investment + Market: 2-column checklist | **Correct Risk-specific CTA density** |
| Title contains "Audit-Ready" | ✓ | ✗ | **Correct Risk-specific positioning** |

**Conclusion:** All Risk-specific differences from Investment/Market are **functionally justified**. Do NOT force Risk to match the sparser Hero or less-dense Evidence Example of the other products. Each adaptation serves Risk's buyer (risk/compliance teams who need audit defensibility).

---

# PART 5 — DRIFT SUMMARY

## All Findings by Category

### A — Must match (system primitives)
| ID | Finding | Pattern? | Action |
|---|---|---|---|
| A.1 | Two nav class systems | **Confirmed across 3 pages** | Park for global cleanup |
| A.2 | Two container classes | **Confirmed across 3 pages** | Park for global cleanup |
| A.3 | Two button class systems | **Confirmed across 3 pages** | Park for global cleanup |
| A.4 | Mobile hamburger | **Confirmed across 3 pages** | Document for Homepage delta report |

### B — Must adapt to product nature
| ID | Finding | Verdict |
|---|---|---|
| B.1 | Hero H1 weight 300 | Same as Investment + Market — correct |
| B.2 | `.card-accent` for marketing cards | Same — correct |
| B.3 | Hero composition (`.hero-split` + `.glass-status-card`) | Same — correct |
| B.4 | Motion restrained | Same — correct |
| B.5 | Atmosphere restrained | Same — correct |
| B.6 | Density (between Investment and Market) | Correct Risk-specific |
| B.7 | **ROUA Risk Context layer in Hero** with dashed gold border + "Illustrative" + "not source fact" | **Strongest implementation** — same pattern as Market |
| B.8 | **Hero CTA row + 3 trust pills** | **Risk-specific** — correct adaptation |
| B.9 | **"Verified Risk Event" + "ROUA Risk Context" labels** | **Risk-specific Trust Grammar** — correct |
| B.10 | **Evidence Example with 8-vessel Blocked Property detail** | **Risk-specific evidence density** — correct |
| B.11 | **4-card CTA assessment grid** | **Risk-specific** — correct |

### C — Must NOT transfer from Homepage
| ID | Finding | Verdict |
|---|---|---|
| C.1–C.10 | All 10 Homepage-brand elements | ✓ **All correctly absent** — same as Investment + Market |

**All C-category checks PASS.** Pattern confirmed across 3 pages.

### D — Real defects
| ID | Finding | Pattern? | Action |
|---|---|---|---|
| D.1 | Dead inline `<style>` block (lines 13–30) | **Confirmed across 3 pages** | Remove |
| D.2 | 2 instances of `rgba(201, 162, 39, ...)` at lines 416, 483 | **Confirmed across Market + Risk** (Investment does not have Evidence Example section) | Replace with `rgba(227, 180, 90, ...)` |
| D.3 | Malformed HTML comment at line 598 | **Confirmed across Market + Risk** (Investment has clean comment) | Replace with single clean comment |
| D.5 | "Bloomberg / Market Terminals" competitor naming (line 334) | **Confirmed across 3 pages** | Document for content review |

---

# PART 6 — VERDICT

## Is `risk-intelligence.html` aligned with v1?

**Yes — and it is the strongest product-page implementation so far.**

The page:
- Uses canonical `--roua-*` token aliases exclusively (except for the 2 old-gold rgba instances in D.2)
- Implements the **strongest Trust Grammar** in the product family:
  - "Verified Risk Event" (product-specific label)
  - "ROUA Risk Context — Illustrative" (5 instances, dashed border + explicit disclaimer)
  - "Blocked Property" (Risk-specific evidence layer with 8 vessels + IMO numbers)
  - "Evidence Pack Attached" (Risk-specific evidence chip)
  - "Audit-Ready" (9 instances, ALL in legitimate Risk context — exception correctly applied)
- Has **perfect OFAC source integrity**: 3 direct official links, designated entities, event date, provenance with cross-reference, 8 vessels with IMO numbers
- Has **perfect Trust boundary**: solid card for Verified Risk Event (source's literal claim), dashed gold border for ROUA Risk Context (analytical layer)
- Has **14/14 Trust Grammar checks PASS** (including the Audit-Ready exception test)
- Correctly excludes all 10 Homepage-brand elements
- Has 3 D-category defects (D.1, D.2, D.3) + 1 content risk (D.5)

## Audit-Ready Exception Validation

**This is the most important finding of Delta 03.**

v1 §15 specified: "'audit-ready' = forbidden except on `risk-intelligence.html` (legitimate risk context)."

Delta 02 (Market) found "Audit-Ready" at line 468 — classified as **D.4 Trust Grammar violation** because Market is NOT the risk page.

Delta 03 (Risk) finds "Audit-Ready" 9 times — ALL classified as **legitimate** because Risk IS the page where the exception applies.

**The exception is correctly scoped.** The v1 rule works as designed:
- Market using "Audit-Ready" = violation (must fix)
- Risk using "Audit-Ready" = correct (do not change)

This validates the **product-category-specific Trust Grammar** principle in v1 §0: each page category has its own role, and Trust Grammar adapts to that role.

## Recommended fixes for this page (priority order)

| Priority | ID | Fix | Effort |
|---|---|---|---|
| **P1** | D.2 | Replace `rgba(201, 162, 39, ...)` with `rgba(227, 180, 90, ...)` at lines 416, 483 (2 instances) | 2 minutes |
| **P1** | D.3 | Fix malformed HTML comment at line 598 — replace with `<!-- ============ CTA ============ -->` | 1 minute |
| P2 | D.1 | Remove dead inline `<style>` block (lines 13–30) | 1 minute |
| P3 | D.5 | Soften "Bloomberg / Market Terminals" to "Market Data Terminals" (content review) | 1 minute |

**Total fix budget:** ~5 minutes for P1+P2.

---

# PART 7 — CROSS-REPORT COMPARISON (Delta 01 + 02 + 03)

## Pattern Confirmation Matrix (3 pages)

| Drift Type | Investment | Market | Risk | Pattern? |
|---|---|---|---|---|
| **A.1** Two nav class systems | ✓ | ✓ | ✓ | **Confirmed across 3 pages** |
| **A.2** Two container classes | ✓ | ✓ | ✓ | **Confirmed across 3 pages** |
| **A.3** Two button class systems | ✓ | ✓ | ✓ | **Confirmed across 3 pages** |
| **A.4** Mobile hamburger | ✓ | ✓ | ✓ | **Confirmed across 3 pages** |
| **B.1** Hero H1 weight 300 | ✓ | ✓ | ✓ | **Confirmed across 3 pages** |
| **B.2** `.card-accent` for marketing | ✓ | ✓ | ✓ | **Confirmed across 3 pages** |
| **B.3** Hero composition | ✓ | ✓ | ✓ (richest) | **Confirmed across 3 pages** |
| **B.4** Motion restrained | ✓ | ✓ | ✓ | **Confirmed across 3 pages** |
| **B.5** Atmosphere restrained | ✓ | ✓ | ✓ | **Confirmed across 3 pages** |
| **C.1–C.10** Homepage-brand absent | ✓ all 10 | ✓ all 10 | ✓ all 10 | **Confirmed across 3 pages** |
| **D.1** Dead `<style>` block | ✓ | ✓ | ✓ | **Confirmed across 3 pages** |
| **D.2** Old-gold rgba | ✗ | ✓ | ✓ | **Confirmed Market + Risk** (Evidence Example template) |
| **D.3** Malformed HTML comment | ✗ | ✓ | ✓ | **Confirmed Market + Risk** (copy-paste from same source) |
| **D.5** Bloomberg naming | ✓ | ✓ | ✓ | **Confirmed across 3 pages** |

## Product-Family Baseline Rules (emerging from 3 deltas)

Based on 3 confirmed pages, the following are **product-family baseline rules** (will be formalized in eventual system documentation):

### Always (all product pages)
1. Use `--roua-*` token aliases, never raw hex or old base tokens
2. Use `.container` (1200px), not `.wrap` (1240px)
3. Use `.navbar` + `.nav-container` + `.nav-logo` + `.nav-links`, not Homepage's `.wrap .nav .brand .nlinks`
4. Use `.btn .btn-primary` / `.btn .btn-secondary`, not Homepage's `.btnGold` / `.btnGhost`
5. Include `.nav-toggle` mobile hamburger
6. Hero uses `.hero-split` + `.glass-status-card` + Sample Intelligence Object (never `.glass` Homepage card)
7. Hero H1 weight 300 (light), not Homepage's 800 (extrabold)
8. Motion restrained: only `glass-status-dot` pulse, no ambient theatrics
9. Atmosphere restrained: `.bg-grid-enhanced` + 2 soft glows, no globe/particles/wave
10. Exclude all 10 Homepage-brand elements (globe, particles, wave, .glass, .chain, .hline, decode, .chips, .gstats, 3D tilt)
11. Products dropdown: 6 links (no Trading Desks — that's a Solution)
12. Footer: 6 columns (no Channels column)

### Per-product (adaptation allowed)
1. Hero composition density (Risk has CTAs + trust pills; Investment + Market do not)
2. Evidence Example detail (Risk has 8-vessel Blocked Property; Market has 5-step flow; Investment has simpler chain)
3. Trust Grammar labels (Verified Fact / Verified Event / Verified Risk Event; ROUA Context / ROUA Market Context / ROUA Risk Context)
4. "Audit-Ready" allowed ONLY on risk-intelligence.html
5. CTA tone (Investment: "Request"; Market: "Assess"; Risk: "Assess your risk workflow")

## Key Insights

### 1. The product family is now strongly characterized
3 pages confirm the same A/B/C patterns. The remaining 2 pages (Media + Developer) will likely confirm the same.

### 2. D.2 and D.3 are Evidence-Example-template defects
Both Market and Risk have an "Evidence Example" section with the same template structure. That template contains:
- `rgba(201, 162, 39, ...)` in the flow card box-shadow and output card gradient (D.2)
- (Risk does NOT have the malformed comment in Evidence Example — that's in CTA)

The malformed comment (D.3) is in the CTA section comment, which was likely copied from Market to Risk (or vice versa) during a section renumbering edit.

### 3. The Audit-Ready exception is the cleanest v1 validation so far
v1 §15 specified a per-page exception. Delta 02 confirmed the violation (Market using it = wrong). Delta 03 confirms the exception (Risk using it = right). **The rule works exactly as designed.**

### 4. Risk is the strongest Trust Grammar implementation
- Most ROUA Context instances (5)
- Most source links (3)
- Most evidence detail (8 vessels + IMO numbers + cross-reference)
- Strongest trust boundary (solid card vs dashed border, with explicit "not source fact" disclaimer)

This is correct — Risk buyers (compliance officers, CROs, regulators) have the highest trust requirements.

---

# PART 8 — MODEL VALIDATION (Cumulative across 3 deltas)

## What Delta 01 + 02 + 03 together prove

1. **The A/B/C/D framework is robust.** 3 pages, consistent classification, no ambiguous edge cases.
2. **The 14+14 checklist is reliable.** All 3 pages pass C-category 10/10. Trust Grammar passes 14/14 on Investment + Risk, 13/14 on Market (the one violation was correctly caught).
3. **Product-family patterns are stable.** 11 "Always" rules confirmed across 3 pages. These will become the product-family baseline.
4. **Per-product adaptation is correctly identified.** Risk's richer Hero, denser Evidence Example, and "Audit-Ready" usage are all correctly classified as B (adaptation), not D (defect).
5. **The Audit-Ready exception validates v1 §15's design.** The rule is not blanket prohibition — it is scoped exception, and the scoping works.
6. **D-category defects are either product-family patterns (D.1, D.5) or template-level (D.2, D.3).** Page-specific D-defects are rare — most defects propagate from shared templates.

## Recommended next step

Continue with **Delta 04: `media-intelligence.html`** — the fourth product page. This will further validate the product-family patterns and test whether Media (which has an editorial-story Trust Grammar) follows the same adaptation rules as Market and Risk.

---

*End of Delta Report 03.*

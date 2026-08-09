# Delta Report 04 — `media-intelligence.html` vs ROUA Visual System v1

> **Status:** Fourth test of `ROUA-VISUAL-SYSTEM-v1.md` against a product page. Final product-family test before Developer.
> **Audited file:** `/home/z/my-project/rouaa-corporate/rouaa-web/media-intelligence.html` (714 lines)
> **Reference:** `ROUA-VISUAL-SYSTEM-v1.md` (commit `855ffd1`) + `index.html` (commit `de9830f`)
> **Baseline:** `DELTA-01` (Investment) + `DELTA-02` (Market) + `DELTA-03` (Risk)
> **Method:** No code modification. Drift classified into A/B/C/D per user framework.
> **Special focus per user request:** Editorial evidence boundary (is Media's Trust Grammar its own, or a copy of Investment/Market with changed text?), source vs editorial separation, timing/freshness claims, news sources, language (must NOT become "AI news generator" framing — must stay institutional media intelligence infrastructure).

---

## Classification Framework (Same as Delta 01–03)

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
| `roua-v7.css` | ✓ | Same as Investment + Market + Risk |
| `roua-v7-patch.css` | ✓ | Same |
| `styles.css` | ✗ NOT loaded | Same — not needed |
| Inline `<style>` block (lines 13–30) | ✓ | Targets `#integrates-with` and `#powered-by` — **IDs that DO NOT EXIST in this page**. Dead code. **Same defect as D.1 across all 4 product pages.** |
| `main.js` + `design-system/roua-v7.js` | ✓ | Same |

**Finding:** Dead inline `<style>` block — **fourth consecutive page with this defect**. Confirmed product-family pattern across all 4 product pages.

## 1.2 Token Usage

| Token Family | Usage | Verdict |
|---|---|---|
| `--roua-*` aliases | Used throughout (except 1 instance) | ✓ Mostly correct |
| `var(--gold)` (base token, NOT `--roua-accent` alias) | **1 instance** at line 338 | ⚠ **NEW D.6 — token-system mixing** (see below) |
| Old tokens (`--bg`, `--txt`, `--dim`, etc.) directly | **0 instances** | ✓ |
| Raw hex values | **0 instances** | ✓ |
| `rgba(201, 162, 39, ...)` (OLD gold from `VISUAL-IDENTITY-SYSTEM.md`) | **2 instances** at lines 429, 484 | ⚠ **D.2** (same as Market + Risk — Evidence Example template defect) |
| `rgba(227, 180, 90, .08)` (CORRECT gold) | 1 instance at line 338 | ✓ Correct — used in the same card that has the `var(--gold)` border |

**Drift D.2 — Old-gold rgba values (CONFIRMED across Market + Risk + Media):**
Lines 429 and 484 use `rgba(201, 162, 39, 0.06/0.08/0.02)` — same OLD gold. **Pattern now confirmed across 3 pages** (Market, Risk, Media). Investment does NOT have this defect (it has no Evidence Example section with this template).

**Drift D.6 — Token-system mixing (NEW, Media-specific):**
Line 338: `<div style="...border: 1px solid var(--gold);...">` — uses `var(--gold)` (base token) instead of `var(--roua-accent)` (alias).

**Context analysis (per user request — "check context before flagging"):**
- `--gold` is defined in `roua-v7.css` line 19 as `#e3b45a` — the **canonical** gold color
- `--roua-accent` is defined in `roua-v7.css` line 349 as `var(--gold)` — an alias pointing to the same value
- So **visually**, `var(--gold)` and `var(--roua-accent)` produce identical output
- But **structurally**, this is the only place in any of the 4 product pages where a base token is used directly instead of the `--roua-*` alias
- Investment + Market + Risk use `var(--roua-accent)` exclusively for gold accents

**Classification:** **D.6 (real defect — token-system mixing)** — Not a visual defect, but a consistency defect. The page mixes two token systems in a single inline style. Fix: replace `var(--gold)` with `var(--roua-accent)` at line 338.

## 1.3 Page Structure

```
1.  Navigation (lines 36–123)
2.  Hero — Product-Forward (lines 125–220)
3.  The Problem — 4 cards (lines 222–258)                       ← Same count as Investment + Risk
4.  Capabilities — 4 cards (lines 260–291)                      ← Same as all 3 prior
5.  Differentiation (lines 293–317)                             ← Same as Risk's Differentiation
6.  Editorial Control + One Event → Multiple Outputs (lines 320–364)  ← UNIQUE: combined section
7.  How It Works — 5-step buyer workflow (lines 366–417)        ← Same as Market + Risk
8.  Evidence Example — FOMC Policy Decision (lines 419–502)      ← Same template as Market + Risk
9.  Buyer Environments (lines 504–543)                          ← Same as Market + Risk
10. Business Outcomes — Before/After grid (lines 546–602)       ← Same as Market, denser (5 cards vs 4)
11. Deployment (lines 605–629)                                  ← UNIQUE: compressed 3-card format
12. CTA (lines 632–654)
13. Footer (lines 656–709)
```

- `<section>` count: 11 (vs Investment 8, Market 10, Risk 9) — **Media has the most sections**
- `<div>` balance: 248 / 248 ✓ PASS
- `<section>` balance: 11 / 11 ✓ PASS
- HTML comment balance: 33 / 33 ✓ **PASS** — **Media does NOT have the malformed comment defect (D.3)** that Market + Risk have

## 1.4 HTML Integrity

| Check | Result |
|---|---|
| `<div>` balance | 248 / 248 ✓ PASS |
| `<section>` balance | 11 / 11 ✓ PASS |
| HTML comment balance | 33 / 33 ✓ **PASS** — **Media is clean** (unlike Market + Risk) |
| Duplicate closing tags | None ✓ |
| Broken internal anchors | None ✓ |
| Orphaned CSS (dead `<style>` block) | D.1 — lines 13–30 ⚠ |

**Key finding:** Media is the **first product page after Investment** to have clean HTML comment balance. Market (D.3) and Risk (D.3) both have the malformed `<!-- ============ CTA ============  <!-- ============ 8. CTA ============ -->` defect. Media has a clean `<!-- ============ 8. CTA ============ -->` at line 632.

This means:
- D.3 is NOT a product-family pattern (only Market + Risk)
- D.3 is a **template-propagation artifact** between Market and Risk specifically
- Media was either edited separately or escaped the propagation

---

# PART 2 — USER-SPECIFIED FOCUS AREAS (KEY TEST)

## Focus 1 — Editorial Evidence Boundary → **PASS — Media has its OWN Trust Grammar** ✓✓

User asked: "Does Media have its own Trust Grammar, or is it a copy of Investment/Market with changed text?"

### Verified Label Taxonomy Across 4 Products

| Product | Verified Label(s) | ROUA Context Label | Value Chain |
|---|---|---|---|
| Investment | "Verified Fact" | (none in Hero) | Company Event → Verified Fact → Evidence → Investment Context |
| Market | "Verified Event" | "ROUA Market Context" | Official Market Event → Verified Event → Market Context → Decision Context |
| Risk | "Verified Event" + "Verified Risk Event" | "ROUA Risk Context" (5 instances) | Official Risk Event → Designated Entities → Exposure Review → Audit-Ready Decision |
| **Media** | **"Verified Fact" + "Verified News Fact"** | **"ROUA Editorial Context"** (4 instances) | **Official Event → Verified News Fact → Editorial Story → Publication Outputs → Editorial Record** |

**Finding:** Media has its **own distinct Trust Grammar**, not a copy:

1. **"Verified News Fact"** (4 instances) — Media-specific label. Distinguishes news-publication-ready facts from generic verified facts. Used in Hero (line 177) and Evidence Example (lines 445, 447, 488).
2. **"ROUA Editorial Context"** (4 instances) — Media-specific label. Replaces Market's "ROUA Market Context" and Risk's "ROUA Risk Context".
3. **5-step value chain** — longer than Investment (4) and Market (4), matches Risk (5) but with editorial-specific steps:
   - Official Event → Verified News Fact → **Editorial Story** → **Publication Outputs** → **Editorial Record**
   - The last 3 steps are unique to Media — no other product has "Editorial Story", "Publication Outputs", or "Editorial Record"

### Editorial Evidence Boundary Chain (User Spec)

User specified: `Verified Media Event/Fact → Source → Evidence → ROUA Editorial Context → Story/Briefing`

**Media implementation (5-step Evidence Example, lines 419–502):**

| Step | Label | Content | Verdict |
|---|---|---|---|
| 1 | Source | Federal Reserve — FOMC Statement (official link) | ✓ |
| 2 | Verified Fact | "Federal Reserve maintains federal funds target range at 3.50%–3.75%" | ✓ |
| 3 | Evidence | "FOMC Statement · Opening paragraph" + provenance + cross-reference link | ✓ |
| 4 | ROUA Editorial Context | "Editorial story angles — what the event may mean for coverage" + **dashed gold border** + **"Illustrative"** label + **"ROUA Analytical Layer — not source fact"** disclaimer | ✓ |
| 5 | News Article | "Fed Holds Rates Steady at 3.50%–3.75%, 9-3 Vote Split Signals Internal Debate" — publication-ready output | ✓ |

**Verdict:** The editorial evidence boundary is **fully implemented** and matches the user-specified chain. Media is NOT a copy of Investment/Market — it has its own complete Trust Grammar.

## Focus 2 — Source vs Editorial Separation → **PASS** ✓✓

User asked: "Does interpretation ever appear as if from official source?"

### Verified Fact card (lines 176–180)
Content: "Federal Reserve maintains federal funds target range at 3.50%–3.75%" + "Approved by 9-3 vote · July 29, 2026"
**NO ROUA analysis in this card.** ✓ Solid card surface (`var(--roua-bg-tertiary)`), no dashed border.

### ROUA Editorial Context card (lines 189–193)
- **Dashed gold border** (`border: 1px dashed var(--roua-accent-border)`) — visual cue ✓
- **"Illustrative" label** — semantic cue ✓
- **"ROUA Analytical Layer — not source fact"** disclaimer (line 473 in Evidence Example) — explicit boundary ✓
- Content: "Potential story angles: policy decision, dissenting votes, inflation and labor-market language, implications for future coverage"
- This is clearly **analytical/editorial suggestion**, not source claim ✓

### News Article output (lines 484–495)
- Gold gradient background — visual distinction from source cards
- Headline: "Fed Holds Rates Steady at 3.50%–3.75%, 9-3 Vote Split Signals Internal Debate"
- Body explicitly states: "Each assertion in this article links to its source — FOMC Statement, opening paragraph — preserved in the evidence pack attached to the published story."
- Chips: "Evidence Pack Attached" + "Source-Linked" + "Publication-Ready"

**Verdict:** The boundary between source and editorial interpretation is **visible at every layer**. No interpretation appears as if from the official source. The dashed border + "Illustrative" label + "not source fact" disclaimer form a **three-layer separation** that is stronger than Investment and matches Market + Risk.

## Focus 3 — Timing/Freshness Claims → **PASS** ✓✓

User asked: "Check for real-time / continuously monitored / immediate / instant claims."

### Scan results

| Phrase | Count |
|---|---|
| "real-time" / "real time" | 0 |
| "instantly" / "instant" | 0 |
| "in seconds" / "within seconds" | 0 |
| "continuously monitored" | 0 |
| "live feed" / "live update" / "live data" | 0 |
| **"configured source monitoring"** (locked phrase) | **2 instances** (lines 380, 562) ✓ |

**Verdict:** Zero timing/freshness violations. Media uses the exact locked phrase "through configured source monitoring" in both the How It Works workflow (line 380) and the Business Outcomes Before/After grid (line 562). This is the **cleanest timing-claims implementation** in the product family.

**Notable:** Media's buyer (newsrooms) has the highest pressure for speed — yet the page resists every temptation to claim "real-time" or "instant" publication. This is correct institutional positioning.

## Focus 4 — News Sources → **PASS** ✓✓

User asked: "Do links/references point to official/permitted sources per ROUA model, or are media sources used in ways needing review?"

### External links found

| URL | Type |
|---|---|
| `https://www.federalreserve.gov/newsevents/pressreleases/monetary20260729a.htm` | Official — Federal Reserve (2 instances: Hero line 185, Evidence Example line 437) |
| `https://www.federalreserve.gov/newsevents/pressreleases/monetary20260729a1.htm` | Official — Federal Reserve FOMC Implementation Note (1 instance: Evidence Example line 461) |

**All 3 external links point to federalreserve.gov — official government source.** ✓

### No media-source references

- Zero links to Reuters, Bloomberg, AP, Dow Jones, or any wire service
- Zero links to news articles or secondary reporting
- The page mentions "News / Wire Layer" (line 300) and "AI Generation Layer" (line 304) as **competitive categories** in the Differentiation section, but does NOT link to them

**Verdict:** News source integrity is **perfect**. Media only references official sources — exactly matching the ROUA model where evidence chains must lead back to official/government sources, not to secondary media reporting. This is the **strongest source-discipline** in the product family.

## Focus 5 — Language (AI News Generator vs Institutional Infrastructure) → **PASS — STRONGEST anti-AI-generator framing** ✓✓

User asked: "Must NOT become 'AI news generator' framing. Must stay institutional media intelligence infrastructure."

### Anti-AI-generator framing (5 distinct instances)

1. **Line 277 (Capabilities):** "ROUA does not replace editorial judgment; it generates evidence-linked drafts that remain subject to editorial review."
2. **Line 309 (Differentiation):** "Evidence-linked editorial intelligence connecting published claims to source documents, provenance, and reconstructable editorial records — **built on top of news and AI layers, not replacing them**."
3. **Line 328 (Editorial Control Statement):** "Editorial control remains with your newsroom. ROUA supplies source-linked intelligence and production-ready materials; **publication decisions remain with the publisher**."
4. **Line 358 (One Event section):** "Editorial review precedes publication — **ROUA generates intelligence, the newsroom decides what to publish**."
5. **Line 388 (How It Works Step 02):** "The draft arrives pre-sourced, pre-cited, and ready for editorial judgment — **not auto-published**."

### Additional institutional-infrastructure framing

- Title (line 6): "Evidence-Backed Editorial Operations" — NOT "AI News Generator"
- Meta description (line 7): "transform editorial workflows into evidence-backed intelligence operations" — operations, not generation
- Hero subheadline (line 143): "giving financial media organizations a **governed intelligence layer** behind their newsroom workflows" — layer, not generator
- Differentiation positions ROUA **above** News/Wire + AI Generation layers, not against them

### Competitor naming — STRONGEST discipline

| Page | "Bloomberg" / competitor naming |
|---|---|
| Investment | ✓ Present (D.5) |
| Market | ✓ Present (D.5) |
| Risk | ✓ Present (D.5) |
| **Media** | **✗ ABSENT** — uses "News / Wire Layer" and "AI Generation Layer" generic categories instead |

**Verdict:** Media is the **only product page** that does NOT name competitors directly. It uses generic category labels ("News / Wire Layer", "AI Generation Layer", "Compliance Screening Tools" pattern adapted from Risk). This is the **strongest competitor-naming discipline** in the product family.

**Combined verdict:** Media's language is **explicitly institutional-infrastructure**, not AI-generator. The 5 anti-AI-generator statements + "built on top of, not replacing" positioning + editorial-control framing make this the **most disciplined product page** in the family for language.

---

# PART 3 — VISUAL IDENTITY AUDIT (14 Items from §17 of v1)

## Item 1 — Color Tokens → **PASS with D.6** (A)

`--roua-*` aliases used throughout. Exception: 1 `var(--gold)` at line 338 (D.6 — token-system mixing) + 2 `rgba(201,162,39,...)` at lines 429, 484 (D.2 — old-gold rgba).

## Item 2 — Typography → **PASS** (A/B)

Same as Investment + Market + Risk: Inter sans + Fira Code mono, Hero H1 weight 300, section H2 via `.section-header h2`, mono labels 11px / 0.1–0.14em.

## Item 3 — Container & Grid → **PASS** (A)

Same `.container` (1200px max), same grid patterns.

## Item 4 — Section Rhythm → **PASS** (A)

- Standard 88px padding ✓
- Differentiation (48px compressed) + Editorial Control (within section) + Deployment (48px compressed) — acceptable compressions ✓
- Alternating `--roua-bg-secondary` bands ✓

## Item 5 — Card Hierarchy → **PASS** (B)

`.card.card-accent` throughout. Evidence Example uses gold-bordered flow card (line 429) with D.2 old-gold rgba in box-shadow.

## Item 6 — Hero Composition → **PASS — Same pattern as Investment + Market** (B)

### Media Hero Composition
1. `.bg-grid-enhanced` + `.glow-blue` + `.glow-gold` ✓
2. `.hero-split` grid: 1.1fr .9fr ✓
3. Left: eyebrow + h1 + subheadline (no CTAs, no trust pills) — **same as Investment + Market, less rich than Risk**
4. Right: `.glass-status-card` with:
   - Brand header + Status badge ✓
   - Title + tagline ("Source-linked. Governed. Publishable.") ✓
   - Sample Intelligence Object with **4 evidence layers** (same as Market + Risk):
     - **Verified News Fact** (Media-specific label)
     - Source Document (Federal Reserve direct link)
     - **ROUA Editorial Context — Illustrative** (dashed gold border)
     - Inspect in Evidence Explorer link
   - Media Intelligence Value Chain (5 steps — longer than Investment + Market)

### Comparison with prior 3 products

| Hero Element | Investment | Market | Risk | Media |
|---|---|---|---|---|
| CTA row in Hero | ✗ | ✗ | ✓ | ✗ |
| Trust pills in Hero | ✗ | ✗ | ✓ (3 pills) | ✗ |
| ROUA Context layer in Hero | ✗ | ✓ | ✓ | ✓ |
| Verified label | "Verified Fact" | "Verified Event" | "Verified Risk Event" | **"Verified News Fact"** |
| ROUA Context label | (none) | "ROUA Market Context" | "ROUA Risk Context" | **"ROUA Editorial Context"** |
| Value chain length | 4 steps | 4 steps | 4 steps | **5 steps** |

**Classification:** **B** — Media Hero matches the Investment + Market pattern (no CTAs, no trust pills), but has the strongest Trust Grammar (ROUA Editorial Context layer + 5-step value chain). This is correct adaptation — Media buyers (publishers, news networks) need to see the editorial boundary clearly, not action buttons.

## Item 7 — Navigation → **DRIFT — Same as all 3 prior** (A)

Same nav structure as Investment + Market + Risk. 6-link Products dropdown, 7-link Solutions dropdown, mobile hamburger present.

## Item 8 — Buttons → **DRIFT — Same as all 3 prior** (A)

`.btn .btn-primary` / `.btn .btn-secondary` used — same as all 3 prior.

## Item 9 — Motion → **PASS** (B)

Same as all 3 prior: only `glass-status-dot` pulse, no ambient theatrics.

## Item 10 — Background / Atmosphere → **PASS** (B)

Same as all 3 prior.

## Item 11 — Mono Usage → **PASS** (A)

Clean sans/mono separation.

## Item 12 — Icons → **PASS** (A)

No inline SVG icons in this page (same as Investment + Market). No emoji, no icon fonts. `.glass-card-brand-logo` "R" letter mark.

## Item 13 — Visual Density → **PASS — Highest section count** (B)

- 11 sections (most in product family: Investment 8, Market 10, Risk 9, Media 11)
- 4-card Problem grid (same as Investment + Risk)
- 4-card Capabilities grid (same as all)
- 5-step How It Works (same as Market + Risk)
- Full Evidence Example with 5-step flow (same template as Market + Risk, with D.2 old-gold rgba)
- 2-card Primary + 2-card Secondary Buyer Environments (Market + Risk have 2+3 or 2+4)
- **5-card Business Outcomes Before/After grid** (Market has 4 — Media has 5, with the 5th spanning 2 columns)
- **Compressed 3-card Deployment** (unique to Media — Investment + Market + Risk use 4-card Deployment)

**Classification:** **B** — Media has the most sections but compressed Deployment. This reflects Media's narrative: more editorial-workflow detail, less deployment-model detail (newsrooms typically use Cloud or White-label, not the full 4-model spectrum).

## Item 14 — Responsive → **DRIFT — D.1** (A)

Same dead inline `<style>` block (lines 13–30) as all 3 prior. Confirmed product-family pattern across all 4 pages.

---

# PART 4 — TRUST GRAMMAR AUDIT (14 Items from §17 of v1)

## Item 1 — Verified Fact/Event → **PASS** ✓
"Verified Fact" (1) + "Verified News Fact" (4) — Media-specific label used correctly. Solid card with source's literal claim.

## Item 2 — ROUA Context → **PASS — STRONGEST in product family (tied with Risk)** ✓
"ROUA Editorial Context" (4 instances) + "ROUA Analytical Layer — not source fact" disclaimer. Dashed gold border + "Illustrative" label. Same strong pattern as Market + Risk.

## Item 3 — Source Document → **PASS** ✓
Lines 185, 437, 461. Three direct clickable links to federalreserve.gov, all with `target="_blank" rel="noopener"`.

## Item 4 — Evidence → **PASS** ✓
5-step evidence chain: Source → Verified Fact → Evidence → ROUA Editorial Context → News Article.

## Item 5 — Provenance → **PASS** ✓
Line 460: "Provenance: Source document, paragraph preserved · Cross-reference: FOMC Implementation Note (IORB 3.65%)."

## Item 6 — Illustrative → **PASS** ✓
Lines 191, 198, 471, 476, 498. Five instances of illustrative disclaimers.

## Item 7 — Governance → **PASS** ✓
Used in Editorial Record + accountability context.

## Item 8 — "audit-ready" forbidden phrase → **PASS** ✓
Zero instances. Media correctly does NOT use "audit-ready" — that exception belongs only to Risk.

## Item 9 — "within seconds" → **PASS** ✓
Zero instances. Uses "configured source monitoring" (locked phrase) twice.

## Item 10 — "every claim" → **PASS** ✓
Zero instances.

## Item 11 — "VERIFIED INTELLIGENCE OBJECT" → **PASS** ✓
Zero instances.

## Item 12 — "Trust Promise" → **PASS** ✓
Zero instances.

## Item 13 — "Provenance Immutability" → **PASS** ✓
Zero instances.

## Item 14 — "Confidence score" → **PASS** ✓
Zero instances.

**Trust Grammar: 14/14 PASS.** Cleanest in product family alongside Investment.

---

# PART 5 — DRIFT SUMMARY

## All Findings by Category

### A — Must match (system primitives)
| ID | Finding | Pattern? | Action |
|---|---|---|---|
| A.1 | Two nav class systems | **Confirmed across 4 pages** | Park for global cleanup |
| A.2 | Two container classes | **Confirmed across 4 pages** | Park for global cleanup |
| A.3 | Two button class systems | **Confirmed across 4 pages** | Park for global cleanup |
| A.4 | Mobile hamburger | **Confirmed across 4 pages** | Document for Homepage delta report |

### B — Must adapt to product nature
| ID | Finding | Verdict |
|---|---|---|
| B.1 | Hero H1 weight 300 | Same as all 3 prior — correct |
| B.2 | `.card-accent` for marketing cards | Same — correct |
| B.3 | Hero composition (`.hero-split` + `.glass-status-card`) | Same — correct |
| B.4 | Motion restrained | Same — correct |
| B.5 | Atmosphere restrained | Same — correct |
| B.6 | Density (highest section count: 11) | Correct Media-specific adaptation |
| B.7 | **ROUA Editorial Context layer** with dashed border + "Illustrative" + "not source fact" | **Media-specific Trust Grammar** — correct |
| B.8 | **"Verified News Fact" label** | **Media-specific Trust Grammar** — correct |
| B.9 | **5-step value chain** (Official Event → Verified News Fact → Editorial Story → Publication Outputs → Editorial Record) | **Media-specific** — correct |
| B.10 | **Editorial Control Statement** section | **Media-specific anti-AI-generator framing** — correct |
| B.11 | **Compressed 3-card Deployment** | **Media-specific** — newsrooms typically use Cloud/White-label, not full 4-model spectrum |
| B.12 | **5-card Business Outcomes Before/After grid** | **Media-specific** — denser than Market's 4-card |

### C — Must NOT transfer from Homepage
| ID | Finding | Verdict |
|---|---|---|
| C.1–C.10 | All 10 Homepage-brand elements | ✓ **All correctly absent** — same as all 3 prior |

**All C-category checks PASS.** Pattern confirmed across 4 pages.

### D — Real defects
| ID | Finding | Pattern? | Action |
|---|---|---|---|
| D.1 | Dead inline `<style>` block (lines 13–30) | **Confirmed across 4 pages** | Remove |
| D.2 | 2 instances of `rgba(201, 162, 39, ...)` at lines 429, 484 | **Confirmed across Market + Risk + Media** (3 pages) | Replace with `rgba(227, 180, 90, ...)` |
| **D.6** | **1 instance of `var(--gold)` at line 338** (base token instead of `--roua-accent` alias) | **NEW — Media-specific** (Investment + Market + Risk use `--roua-accent` exclusively) | Replace with `var(--roua-accent)` |
| D.5 | "Bloomberg" competitor naming | **✗ ABSENT in Media** — Media uses generic "News / Wire Layer" + "AI Generation Layer" instead | No fix needed — Media is the discipline example |

**Notable absences:**
- **D.3 (malformed HTML comment) NOT present in Media** — only Market + Risk have this defect
- **D.4 ("Audit-Ready" Trust Grammar violation) NOT present in Media** — only Market had this
- **D.5 (Bloomberg naming) NOT present in Media** — Media is the only product page without it

---

# PART 6 — VERDICT

## Is `media-intelligence.html` aligned with v1?

**Yes — and it is the most disciplined product page in the family.**

The page:
- Implements its **own distinct Trust Grammar** (Verified News Fact, ROUA Editorial Context, Editorial Story → Publication Outputs → Editorial Record) — NOT a copy of Investment/Market with changed text
- Has **perfect source vs editorial separation**: solid card for Verified Fact, dashed gold border + "Illustrative" + "not source fact" for ROUA Editorial Context
- Has **zero timing/freshness claims** — uses "configured source monitoring" (locked phrase) twice
- Has **perfect news source integrity**: all 3 external links point to federalreserve.gov (official government source), zero links to wire services or secondary media
- Has **the strongest anti-AI-generator framing** in the family: 5 distinct statements + "built on top of, not replacing" positioning + Editorial Control Statement section
- Has **zero competitor naming** — the only product page that does NOT name Bloomberg/FactSet/Refinitiv directly
- Has **14/14 Trust Grammar checks PASS** — cleanest alongside Investment
- Has **clean HTML** (comment balance PASS) — unlike Market + Risk
- Has 3 D-category defects (D.1, D.2, D.6) — fewer than Market (5) and Risk (4), more than Investment (3)

## Media's Trust Grammar is its own — confirmed

The user's core question was: "Does Media have its own Trust Grammar, or is it a copy of Investment/Market with changed text?"

**Answer: Media has its own.** The evidence:

| Trust Grammar Element | Investment | Market | Risk | Media |
|---|---|---|---|---|
| Verified label | "Verified Fact" | "Verified Event" | "Verified Risk Event" | **"Verified News Fact"** |
| ROUA Context label | (none) | "ROUA Market Context" | "ROUA Risk Context" | **"ROUA Editorial Context"** |
| Value chain | 4 steps (Company → Fact → Evidence → Investment Context) | 4 steps (Event → Verified → Market Context → Decision) | 4 steps (Risk Event → Entities → Exposure → Audit-Ready Decision) | **5 steps (Event → News Fact → Editorial Story → Publication Outputs → Editorial Record)** |
| Output label | (implicit) | "Market Intelligence Output" | "Risk & Compliance Brief" | **"News Article"** |
| Output chips | (none) | "Evidence Preserved", "Impact Assessed", "Audit-Ready" | "Evidence Pack Attached", "Exposure Review Areas", "Audit-Ready" | **"Evidence Pack Attached", "Source-Linked", "Publication-Ready"** |
| Anti-AI-generator framing | ✗ | ✗ | ✗ | **✓ (5 instances + dedicated section)** |
| Competitor naming | "Bloomberg / Market Terminals" | "Bloomberg / Market Terminals" | "Bloomberg / Market Terminals" | **Generic "News / Wire Layer" + "AI Generation Layer"** |

Each product has its **own verified label, own ROUA Context label, own value chain, own output label, own output chips**. Media additionally has **anti-AI-generator framing** that no other product has — because only Media faces the "is this an AI news generator?" question.

## Recommended fixes for this page (priority order)

| Priority | ID | Fix | Effort |
|---|---|---|---|
| **P1** | D.2 | Replace `rgba(201, 162, 39, ...)` with `rgba(227, 180, 90, ...)` at lines 429, 484 (2 instances) | 2 minutes |
| **P1** | D.6 | Replace `var(--gold)` with `var(--roua-accent)` at line 338 | 1 minute |
| P2 | D.1 | Remove dead inline `<style>` block (lines 13–30) | 1 minute |

**Total fix budget:** ~4 minutes for P1+P2. **No D.5 fix needed** (Media has no Bloomberg naming). **No D.3 fix needed** (Media has clean HTML comments). **No D.4 fix needed** (Media has no audit-ready violation).

---

# PART 7 — CROSS-REPORT COMPARISON (Delta 01 + 02 + 03 + 04)

## Pattern Confirmation Matrix (4 pages)

| Drift Type | Investment | Market | Risk | Media | Pattern? |
|---|---|---|---|---|---|
| **A.1** Two nav class systems | ✓ | ✓ | ✓ | ✓ | **Confirmed across 4 pages** |
| **A.2** Two container classes | ✓ | ✓ | ✓ | ✓ | **Confirmed across 4 pages** |
| **A.3** Two button class systems | ✓ | ✓ | ✓ | ✓ | **Confirmed across 4 pages** |
| **A.4** Mobile hamburger | ✓ | ✓ | ✓ | ✓ | **Confirmed across 4 pages** |
| **B.1** Hero H1 weight 300 | ✓ | ✓ | ✓ | ✓ | **Confirmed across 4 pages** |
| **B.2** `.card-accent` for marketing | ✓ | ✓ | ✓ | ✓ | **Confirmed across 4 pages** |
| **B.3** Hero composition | ✓ | ✓ | ✓ | ✓ | **Confirmed across 4 pages** |
| **B.4** Motion restrained | ✓ | ✓ | ✓ | ✓ | **Confirmed across 4 pages** |
| **B.5** Atmosphere restrained | ✓ | ✓ | ✓ | ✓ | **Confirmed across 4 pages** |
| **C.1–C.10** Homepage-brand absent | ✓ all 10 | ✓ all 10 | ✓ all 10 | ✓ all 10 | **Confirmed across 4 pages** |
| **D.1** Dead `<style>` block | ✓ | ✓ | ✓ | ✓ | **Confirmed across 4 pages** |
| **D.2** Old-gold rgba | ✗ | ✓ | ✓ | ✓ | **Confirmed across 3 pages** (Market + Risk + Media — Evidence Example template) |
| **D.3** Malformed HTML comment | ✗ | ✓ | ✓ | ✗ | **Market + Risk only** (template propagation between those 2 pages) |
| **D.4** "Audit-Ready" violation | ✗ | ✓ | (exception) | ✗ | **Market only** (Risk's usage is legitimate exception) |
| **D.5** Bloomberg naming | ✓ | ✓ | ✓ | ✗ | **3 of 4 pages** (Media is the discipline example) |
| **D.6** `var(--gold)` base token | ✗ | ✗ | ✗ | ✓ | **Media only** |

## Product-Family Baseline Rules (confirmed across 4 pages)

### Always (all 4 product pages — 11 rules)
1. Use `--roua-*` token aliases (except Media D.6 — 1 exception)
2. Use `.container` (1200px), not `.wrap` (1240px)
3. Use `.navbar` + `.nav-container` + `.nav-logo` + `.nav-links`
4. Use `.btn .btn-primary` / `.btn .btn-secondary`
5. Include `.nav-toggle` mobile hamburger
6. Hero uses `.hero-split` + `.glass-status-card` + Sample Intelligence Object
7. Hero H1 weight 300
8. Motion restrained
9. Atmosphere restrained
10. Exclude all 10 Homepage-brand elements
11. Footer: 6 columns (no Channels)

### Per-product (adaptation confirmed across 4 pages)
1. **Verified label** — each product has its own (Verified Fact / Verified Event / Verified Risk Event / Verified News Fact)
2. **ROUA Context label** — each product has its own (none / Market / Risk / Editorial)
3. **Value chain** — 4 or 5 steps, product-specific (Risk + Media have 5; Investment + Market have 4)
4. **Output label** — each product has its own (implicit / Market Intelligence Output / Risk & Compliance Brief / News Article)
5. **"Audit-Ready"** — allowed ONLY on risk-intelligence.html
6. **Competitor naming** — Media is the discipline example (generic categories, no direct naming)
7. **Hero richness** — Risk has CTAs + trust pills; others do not
8. **Evidence Example detail** — Risk has 8-vessel Blocked Property; others have simpler chains
9. **Deployment grid** — Media uses compressed 3-card; others use 4-card
10. **Business Outcomes** — Market + Media have Before/After grid; Investment + Risk do not

## Key Insights

### 1. The product family is now fully characterized
4 pages confirm the same 11 "Always" rules and 10 "Per-product" adaptation rules. The remaining 1 page (Developer) will likely confirm the same.

### 2. Media is the most disciplined product page
- Zero Audit-Ready violations (unlike Market)
- Zero Bloomberg naming (unlike Investment + Market + Risk)
- Zero timing claims (cleanest in family)
- Zero malformed HTML (unlike Market + Risk)
- Strongest anti-AI-generator framing (5 instances + dedicated section)
- Own Trust Grammar (not a copy)

### 3. D.2 (old-gold rgba) is now confirmed as Evidence-Example-template defect
3 of 4 pages (Market + Risk + Media) have the exact same `rgba(201,162,39,...)` in the same two locations (evidence flow card box-shadow + output card gradient). Investment does NOT have this because it has no Evidence Example section with this template.

**This means D.2 can be fixed with a single global find-and-replace** across the 3 affected pages — no page-specific logic needed.

### 4. D.3 (malformed HTML comment) is NOT a product-family pattern
Only Market + Risk have this. Media and Investment have clean comments. This is a **propagation artifact between Market and Risk specifically** — likely one was copied from the other during a section renumbering edit.

### 5. D.6 (var(--gold) base token) is Media-specific
Only Media mixes the base token system with the alias system. This is a **single-line fix** on Media.

### 6. The "per-product Trust Grammar" principle is now proven across 4 pages
Each product has:
- Its own verified label
- Its own ROUA Context label
- Its own value chain
- Its own output label
- Its own output chips
- (Sometimes) its own exception (Risk's Audit-Ready)

This validates v1 §0's "page-category roles" design at the deepest level: **Trust Grammar is not one-size-fits-all — it adapts to the product's nature while preserving the evidence/analysis boundary.**

---

# PART 8 — MODEL VALIDATION (Cumulative across 4 deltas)

## What Delta 01 + 02 + 03 + 04 together prove

1. **The A/B/C/D framework is fully robust.** 4 pages, consistent classification, zero ambiguous edge cases.
2. **The 14+14 checklist is reliable.** All 4 pages pass C-category 10/10. Trust Grammar: Investment 14/14, Market 13/14, Risk 14/14 (with exception), Media 14/14.
3. **Product-family patterns are stable.** 11 "Always" rules confirmed across 4 pages.
4. **Per-product adaptation is correctly identified.** Each product has its own Trust Grammar, density, Hero richness, and CTA tone — all correctly classified as B (adaptation), not D (defect).
5. **The Audit-Ready exception is correctly scoped.** Risk (legitimate), Market (violation), Investment + Media (correctly absent).
6. **D-defects are now fully classified:**
   - D.1: product-family pattern (all 4 pages) — dead `<style>` block
   - D.2: Evidence-Example-template defect (3 of 4 pages) — old-gold rgba
   - D.3: Market + Risk propagation artifact (2 of 4 pages) — malformed comment
   - D.4: Market-specific Trust Grammar violation (1 of 4 pages)
   - D.5: competitor-naming pattern (3 of 4 pages — Media is exception)
   - D.6: Media-specific token-system mixing (1 of 4 pages)

## Recommended next step

Continue with **Delta 05: `developer-intelligence.html`** — the fifth and final product page. This will complete the product-family audit and enable the final cross-report synthesis:
- Global corrections (D.1, D.2 — template-level, fixable in bulk)
- Product-family corrections (D.5 — content review across 3 pages)
- Page-specific corrections (D.3, D.4, D.6 — individual fixes)
- Intentional differences (all B-category — preserve)
- Actual defects (D-category — fix in priority order)

After Delta 05, the team will have a **complete specification extracted from a successful implementation**, ready to apply to the remaining 25+ pages (Architecture, Explorers, Catalog, Company, Solutions, etc.).

---

*End of Delta Report 04.*

# ROUA Product Family Consolidation Spec

> **Status:** Authoritative acceptance contract extracted from Delta Reports 01–05.
> **Source:** 5 product pages audited against `ROUA-VISUAL-SYSTEM-v1.md` (commits `ff17d40` → `62016e5`).
> **Purpose:** Converts audit findings into actionable rules for the remaining 25+ pages. Every rule ends with one of six verdicts.
> **Effective date:** August 9, 2026.
> **Modification policy:** This spec is the acceptance contract. Page edits must comply. Spec edits require re-auditing the affected product page.

---

## Verdict System (6 verdicts)

| Verdict | Meaning | Action |
|---|---|---|
| **KEEP** | Current state is correct. Do not change. | None |
| **STANDARDIZE** | Multiple valid implementations exist. Pick one, apply everywhere. | Global cleanup (last phase) |
| **REPAIR** | Broken. Must fix. | Fix in priority order |
| **ADOPT** | A good practice exists in one page. Propagate to others. | Copy from source page to targets |
| **FORBID** | Explicitly prohibited. Never introduce. | Reject in review |
| **REVIEW** | Needs human judgment (content, legal, marketing). | Escalate, do not auto-fix |

---

# LAYER 1 — CANONICAL BASELINE

> What MUST be unified across ALL product pages. These are the non-negotiable system primitives.

## 1.1 Token System

| Rule | Detail | Verdict |
|---|---|---|
| Use `--roua-*` aliases | Never use base tokens (`--bg`, `--gold`, `--txt`, `--dim`, `--panel`, `--line`) directly in inline styles. Always use aliases (`--roua-bg-primary`, `--roua-accent`, `--roua-text-primary`, etc.). | **KEEP** |
| Never use raw hex in styles | Zero `#xxxxxx` values in `style="..."` attributes. Exception: `<meta name="theme-color">` may use raw hex. | **KEEP** |
| Never use `rgba(201, 162, 39, ...)` | This is the OLD gold from deprecated `VISUAL-IDENTITY-SYSTEM.md`. Canonical gold is `#e3b45a` = `rgba(227, 180, 90, ...)`. | **FORBID** |
| Never use `var(--gold)` directly | Use `var(--roua-accent)` instead. (Media D.6 is the one violation — REPAIR.) | **FORBID** |
| White rgba in glass cards | `rgba(255,255,255,0.02)` and `rgba(255,255,255,0.06)` are acceptable in `.glass-status-card` surfaces. | **KEEP** |

## 1.2 Container & Layout

| Rule | Detail | Verdict |
|---|---|---|
| Use `.container` (1200px max) | Product pages use `.container`, not Homepage's `.wrap` (1240px). | **STANDARDIZE** (product pages already aligned; Homepage keeps `.wrap` as Brand-layer exception) |
| Section padding: 88px standard | `.section` class provides `padding: 88px 0`. | **KEEP** |
| Compressed sections: 48px | Positioning / Differentiation / Powered-By / Deployment (Media+Developer) use `padding: 48px 0`. | **KEEP** |
| CTA section: 120px | `.cta-section` provides `padding: 120px 0`. | **KEEP** |
| Alternating `--roua-bg-secondary` bands | Never two consecutive same-background sections. | **KEEP** |

## 1.3 Navigation

| Rule | Detail | Verdict |
|---|---|---|
| Use `.navbar` + `.nav-container` + `.nav-logo` + `.nav-links` | Product nav system (not Homepage's `.wrap .nav .brand .nlinks`). | **STANDARDIZE** (Homepage will adopt in global cleanup) |
| Brand: text-only `.nav-logo` | `<a class="nav-logo"><span class="nav-logo-text">ROUA</span></a>`. No SVG hex mark in product nav (Homepage keeps SVG hex as Brand-layer exception). | **STANDARDIZE** |
| Products dropdown: 6 links | Investment, Risk, Market & Trading, Media, Developer Platform, Catalog. **NO "Trading Desks"** (that's a Solution, not a Product). | **KEEP** (Homepage must REPAIR — currently has 7 with Trading Desks) |
| Solutions dropdown: 7 links | Trading Desks, Investment Firms, Financial Media, Enterprise, Solutions Overview, Why ROUA, Business Case. | **KEEP** |
| Platform dropdown: 6 links | Architecture, Platform Overview, Source Registry, Trust Framework, Methodology, Infrastructure Report. | **KEEP** |
| Experience dropdown: 4 links | Product Experience Center, Evidence Explorer, Sample Intelligence Library, Source Registry Explorer. | **KEEP** |
| Company dropdown: 4 links | About, Research Institute, Careers, Contact. | **KEEP** |
| "Developers" plain link | After 5 dropdowns, single link to `developers.html`. | **KEEP** |
| CTA: `.btn .btn-primary .btn-sm` "Request Briefing" | Pill button, gold gradient, top-right. | **KEEP** |
| Mobile hamburger: `.nav-toggle` | All product pages have it. Homepage lacks it. | **ADOPT** (Homepage must add) |
| Active nav state: `nav-dropdown-trigger active` | Currently only Developer has it. Should mark the current page's parent dropdown. | **ADOPT** (Investment + Market + Risk + Media must add) |

## 1.4 Buttons

| Rule | Detail | Verdict |
|---|---|---|
| Primary: `.btn .btn-primary` | Gold gradient pill, dark text. | **STANDARDIZE** (Homepage's `.btnGold` is visually equivalent; unify in global cleanup) |
| Secondary: `.btn .btn-secondary` | Transparent with border, gold on hover. | **STANDARDIZE** (Homepage's `.btnGhost` equivalent) |
| Both are pill-shaped (999px radius) | Never rectangular buttons. | **KEEP** |
| Uppercase + tracked text | `text-transform: uppercase; letter-spacing: 0.12em;` | **KEEP** |

## 1.5 Footer

| Rule | Detail | Verdict |
|---|---|---|
| 6 columns: Brand + Products + Platform + Solutions + Experience + Company | | **KEEP** |
| NO "Channels" column | Was removed in P0 sweep. Must never return. | **FORBID** |
| Footer heading: `.footer-heading` | Mono, 0.62rem, 0.2em tracking, uppercase, `--roua-text-muted`. | **KEEP** |
| Footer brand: `.nav-logo-text` 24px | Text-only "ROUA", no SVG. | **KEEP** |
| Copyright: `.footer-bottom` | Mono, 0.62rem, centered, `--roua-text-muted`. | **KEEP** |

## 1.6 Card Hierarchy

| Rule | Detail | Verdict |
|---|---|---|
| Marketing cards: `.card .card-accent` | Premium surface with gold top border + gradient. Used for Problem, Capabilities, Deployment, Built For cards. | **KEEP** |
| Static information cards: `.card` (v7-patch override) | Plain surface, no hover lift, no shine. Reserved for Explorer pages. | **KEEP** |
| Evidence flow card: custom gold-bordered panel | `border: 1px solid var(--roua-accent-border); border-left: 4px solid var(--roua-accent);` — used in Evidence Example sections. | **KEEP** |
| ROUA Context card: dashed gold border | `border: 1px dashed var(--roua-accent-border);` — distinguishes analytical layer from source fact. | **KEEP** |

## 1.7 Motion

| Rule | Detail | Verdict |
|---|---|---|
| Entrance reveals: `.rv` class | One-shot fade+translate on scroll into view. Allowed on all pages. | **KEEP** |
| `glass-status-dot` pulse: 2s infinite | Allowed on Decision Environment products (Investment + Market + Risk + Media). NOT on Developer. | **KEEP** (Decision Environments only) |
| Homepage ambient motion (globe, particles, wave, chain pulse, 3D tilt, decode chars, button magnetic) | Homepage-only. NEVER on product pages. | **FORBID** (on product pages) |
| `prefers-reduced-motion` respect | All pages must include the reduced-motion media query. | **KEEP** |

## 1.8 Typography

| Rule | Detail | Verdict |
|---|---|---|
| Sans: Inter (via `--sans`) | Body, headlines, eyebrows. | **KEEP** |
| Mono: Fira Code (via `--mono` / `--font-mono`) | Labels, metadata, evidence chains, value chains. | **KEEP** |
| Sans/mono separation | Never use mono for body or headlines. Never use sans for evidence/metadata labels. | **KEEP** |
| Eyebrow: 0.66–0.7rem, 0.18–0.3em tracking, uppercase | Section label above H2. | **KEEP** |
| Mono labels: 11px, 0.1–0.14em tracking, uppercase | Evidence Chain, Value Chain, "01 · Capability" etc. | **KEEP** |
| Body: 13–15px | Section body copy. | **KEEP** |

## 1.9 Trust Grammar (Forbidden Phrases)

| Phrase | Verdict | Exception |
|---|---|---|
| "audit-ready" / "Audit-Ready" | **FORBID** | Only `risk-intelligence.html` (legitimate risk context) |
| "within seconds" / "in seconds" | **FORBID** | None. Use "through configured source monitoring" |
| "real-time" / "real time" | **FORBID** | None |
| "instantly" / "instant" | **FORBID** | None |
| "continuously monitored" (as timing claim) | **FORBID** | None. Use "configured source monitoring" |
| "every claim" | **FORBID** | None. Use "governed claims" |
| "VERIFIED INTELLIGENCE OBJECT" | **FORBID** | None. Use "GOVERNED INTELLIGENCE OBJECT" |
| "Trust Promise" | **FORBID** | None. Use "Trust Property" |
| "Provenance Immutability" | **FORBID** | None. Use "Versioned Provenance" |
| "confidence score" / "confidence scored" | **FORBID** | None. Use "Confidence signals" or "Verification tier" |
| "SOC 2" / "ISO 27001" | **FORBID** | None (removed in P0 sweep) |

## 1.10 Taxonomy (Locked)

| Term | Correct Usage | Verdict |
|---|---|---|
| "Investment Intelligence" | Product name | **KEEP** |
| "Risk Intelligence" | Product name | **KEEP** |
| "Market & Trading Intelligence" | Product name (never "Market Intelligence" alone as product name) | **KEEP** |
| "Media Intelligence" | Product name | **KEEP** |
| "Developer Platform" | Product name (never "Developer Intelligence") | **KEEP** |
| "Trading Desks" | Solution (never Product) | **KEEP** |
| "Investment Firms" | Solution (never "Institutional Intelligence") | **KEEP** |
| "Intelligence Modules Catalog" | Product reference page | **KEEP** |

---

# LAYER 2 — FIVE PAGE ARCHETYPES

## 2.1 Decision Environment — Investment Intelligence
**File:** `investment-intelligence.html`
**Role:** Evidence-backed investment research product page.
**Buyer:** Asset managers, investment firms, CIO offices, sovereign wealth funds, pension funds, investment committees.
**Hero pattern:** `.hero-split` + `.glass-status-card` + Sample Intelligence Object (Aramco Q1 2026).
**Trust Grammar:** "Verified Fact" / (no ROUA Context in Hero) / 4-step value chain (Company Event → Verified Fact → Evidence → Investment Context).
**Unique:** Simplest Hero evidence card (no ROUA Context layer in Hero).
**Verdict:** **KEEP**

## 2.2 Decision Environment — Market & Trading Intelligence
**File:** `market-intelligence.html`
**Role:** Event-driven market understanding product page.
**Buyer:** Market intelligence teams, trading desks, banks, brokers, research teams.
**Hero pattern:** `.hero-split` + `.glass-status-card` + Sample Intelligence Object (FOMC Jul 29 2026).
**Trust Grammar:** "Verified Event" / "ROUA Market Context — Illustrative" / 4-step value chain (Official Market Event → Verified Event → Market Context → Decision Context).
**Unique:** 5-column Problem grid (denser than Investment's 4). Full Evidence Example with 5-step flow. Business Outcomes Before/After grid.
**Verdict:** **KEEP** (after REPAIR D.2, D.3, D.4)

## 2.3 Decision Environment — Risk Intelligence
**File:** `risk-intelligence.html`
**Role:** Audit-ready risk intelligence product page.
**Buyer:** Risk teams, compliance officers, CROs, internal audit, regulated institutions.
**Hero pattern:** `.hero-split` + `.glass-status-card` + Sample Intelligence Object (OFAC sb0581) + **CTA row + 3 trust pills** (richest Hero).
**Trust Grammar:** "Verified Risk Event" / "ROUA Risk Context — Illustrative" (5 instances, strongest) / 4-step value chain (Official Risk Event → Designated Entities → Exposure Review → Audit-Ready Decision).
**Unique:** Audit-Ready exception (9 legitimate instances). 8-vessel Blocked Property detail with IMO numbers. 4-card CTA assessment grid.
**Verdict:** **KEEP** (after REPAIR D.2, D.3)

## 2.4 Decision Environment — Media Intelligence
**File:** `media-intelligence.html`
**Role:** Evidence-backed editorial operations product page.
**Buyer:** Financial publishers, news networks, economic media groups, data platforms.
**Hero pattern:** `.hero-split` + `.glass-status-card` + Sample Intelligence Object (FOMC editorial angle).
**Trust Grammar:** "Verified News Fact" / "ROUA Editorial Context — Illustrative" / 5-step value chain (Official Event → Verified News Fact → Editorial Story → Publication Outputs → Editorial Record).
**Unique:** Anti-AI-generator framing (5 statements + Editorial Control Statement section). Zero competitor naming (only product page without Bloomberg). Compressed 3-card Deployment. 5-card Business Outcomes grid. Highest section count (11).
**Verdict:** **KEEP** (after REPAIR D.2, D.6)

## 2.5 Integration Layer — Developer Platform
**File:** `developer-intelligence.html`
**Role:** Governed intelligence integration product page (NOT a Decision Environment).
**Buyer:** Financial data platforms, institutional software providers, fintech builders, enterprise research platforms.
**Hero pattern:** `.page-hero` (single-column, NOT split) + custom "Illustrative Intelligence Integration Object" card (NOT `.glass-status-card`). No ambient background.
**Trust Grammar:** "Verified Fact" + "Verified Event" / "Governance Metadata" (replaces ROUA Context) / 5-step value chain (Intelligence Request → Verified Fact/Event → Evidence Chain → Governance Metadata → Product Integration).
**Unique:** Zero D-defects (cleanest page). Zero animation. Zero ambient background. `.skip-link` + `.back-link` + active nav state. Enterprise Engagement workflow (5-step). "Designed to" anti-claim framing (14 instances). Anti-contract-perception (not self-serve, not JSON, not production capabilities).
**Verdict:** **KEEP** (no repairs needed)

---

# LAYER 3 — ALLOWED VARIATIONS

> These differences are CORRECT adaptations to each product's nature. Do NOT unify them.

## 3.1 Hero Composition

| Variation | Investment | Market | Risk | Media | Developer | Verdict |
|---|---|---|---|---|---|---|
| Layout | `.hero-split` (2-col) | `.hero-split` | `.hero-split` | `.hero-split` | `.page-hero` (1-col) | **KEEP** (Developer is Integration Layer) |
| Hero H1 weight | 300 | 300 | 300 | 300 | 800 | **KEEP** (different layout requires different weight) |
| Ambient background | `.bg-grid-enhanced` + 2 glows | same | same | same | none | **KEEP** (Developer has zero atmosphere) |
| Right-side card | `.glass-status-card` | same | same | same | custom "Illustrative Integration Object" | **KEEP** |
| CTAs in Hero | no | no | yes | no | yes | **KEEP** (Risk + Developer need action path) |
| Trust pills in Hero | no | no | yes (3) | no | no | **KEEP** (Risk-specific) |
| Back-link | no | no | no | no | yes | **KEEP** (Developer-specific) |
| Skip-link | no | no | no | no | yes | **ADOPT** (all pages should add) |

## 3.2 Density

| Variation | Verdict |
|---|---|
| Section count (8–11) | **KEEP** — each product has different narrative depth |
| Problem grid (4-card vs 5-card) | **KEEP** — Market has 5 problems, others have 4 |
| Capabilities grid (4-card) | **KEEP** — consistent across all 5 |
| Evidence Example detail (Risk 8-vessel vs simpler) | **KEEP** — Risk requires source granularity |
| Deployment grid (4-card vs 3-card compressed) | **KEEP** — Media + Developer use compressed; others use full |
| Business Outcomes (present in Market + Media, absent in Investment + Risk + Developer) | **KEEP** — product-specific |
| CTA assessment (4-card grid in Risk vs 2-column checklist in others) | **KEEP** — Risk-specific |

## 3.3 Trust Labels (Per-Product)

| Label Type | Investment | Market | Risk | Media | Developer | Verdict |
|---|---|---|---|---|---|---|
| Verified label | "Verified Fact" | "Verified Event" | "Verified Risk Event" | "Verified News Fact" | "Verified Fact" + "Verified Event" | **KEEP** (each product-specific) |
| ROUA Context label | (none in Hero) | "ROUA Market Context" | "ROUA Risk Context" | "ROUA Editorial Context" | "Governance Metadata" | **KEEP** (Developer's replacement is correct) |
| Output label | (implicit) | "Market Intelligence Output" | "Risk & Compliance Brief" | "News Article" | "Product Integration" | **KEEP** |
| Output chips | (none) | Evidence Preserved + Impact Assessed + Audit-Ready | Evidence Pack + Exposure Review + Audit-Ready | Evidence Pack + Source-Linked + Publication-Ready | (none — integration contract deferred) | **KEEP** |
| Value chain length | 4 steps | 4 steps | 4 steps | 5 steps | 5 steps | **KEEP** |

## 3.4 Evidence / Context Boundary

| Variation | Verdict |
|---|---|
| Solid card for Verified Fact/Event (source's literal claim) | **KEEP** — all 5 products |
| Dashed gold border for ROUA Context (analytical layer) | **KEEP** — Market + Risk + Media + Developer |
| "Illustrative" label on ROUA Context | **KEEP** — all 4 products with ROUA Context layer |
| "not source fact" disclaimer | **KEEP** — Market + Risk + Media (Investment has simpler Hero) |
| "Evidence/Analysis Boundary" as explicit step | **KEEP** — Developer only (Integration Layer contract requirement) |
| Investment Hero without ROUA Context layer | **KEEP** — Investment is fact-verification product, boundary less critical |

## 3.5 Motion

| Variation | Verdict |
|---|---|
| `glass-status-dot` pulse (2s) | **KEEP** — Investment + Market + Risk + Media only |
| Zero animation | **KEEP** — Developer only |
| Entrance reveals (`.rv`) | **KEEP** — allowed on all, currently used on none of the 5 |
| Homepage ambient (globe, particles, wave, etc.) | **FORBID** — on all product pages |

## 3.6 Terminology (Per-Product)

| Term | Product | Verdict |
|---|---|---|
| "Audit-Ready" | Risk only (9 instances) | **KEEP** (Risk exception) |
| "Audit-Ready" | Any other product | **FORBID** |
| "News / Wire Layer" + "AI Generation Layer" (generic categories) | Media | **KEEP** |
| "Bloomberg / Market Terminals" (direct competitor naming) | Investment + Market + Risk | **REVIEW** (soften to "Market Data Terminals") |
| "Bloomberg / Market Terminals" | Media + Developer | **KEEP** (absent — discipline examples) |
| "designed to" anti-claim framing | Developer (14 instances) | **KEEP** + **ADOPT** (other pages should use for capability claims) |
| "configured source monitoring" (locked phrase) | All | **KEEP** |
| "not self-serve" / "not JSON" / "not production capabilities" | Developer | **KEEP** (anti-contract-perception) |
| "Editorial control remains with your newsroom" | Media | **KEEP** (anti-AI-generator) |
| "built on top of news and AI layers, not replacing them" | Media | **KEEP** |

---

# LAYER 4 — CONFIRMED DEFECTS

> All defects found in Delta 01–05. Each has page, line/pattern, fix type, and verdict.

## D.1 — Dead inline `<style>` block (lines 13–30)

| Field | Value |
|---|---|
| **Pattern** | Inline `<style>` block targeting `#integrates-with` and `#powered-by` IDs that do not exist in the page |
| **Pages affected** | Investment, Market, Risk, Media (4 of 5) |
| **Pages clean** | Developer |
| **Lines** | 13–30 in each affected page |
| **Fix** | Remove the entire `<style>` block (lines 13–30) |
| **Fix type** | Bulk cleanup — single find-and-delete across 4 pages |
| **Effort** | ~1 minute per page, ~4 minutes total |
| **Verdict** | **REPAIR** (P2 priority) |

## D.2 — Old-gold `rgba(201, 162, 39, ...)` in Evidence Example template

| Field | Value |
|---|---|
| **Pattern** | `rgba(201, 162, 39, 0.06/0.08/0.02)` — OLD gold from deprecated `VISUAL-IDENTITY-SYSTEM.md`. Canonical gold is `rgba(227, 180, 90, ...)` |
| **Pages affected** | Market (lines 405, 460), Risk (lines 416, 483), Media (lines 429, 484) — 3 of 5 |
| **Pages clean** | Investment (no Evidence Example section), Developer (no Evidence Example section) |
| **Location pattern** | Always in Evidence Example section: (1) gold-bordered flow card box-shadow, (2) output card gradient background |
| **Fix** | Replace `rgba(201, 162, 39, ...)` with `rgba(227, 180, 90, ...)` |
| **Fix type** | Bulk find-replace — same string replacement across 3 pages |
| **Effort** | ~2 minutes per page, ~6 minutes total |
| **Verdict** | **REPAIR** (P1 priority) |

## D.3 — Malformed HTML comment at CTA section

| Field | Value |
|---|---|
| **Pattern** | `<!-- ============ CTA ============  <!-- ============ 8. CTA ============ -->` — nested `<!--` inside `<!--`, breaks comment balance |
| **Pages affected** | Market (line 652), Risk (line 598) — 2 of 5 |
| **Pages clean** | Investment (line 553: clean `<!-- ============ 10. CTA ============ -->`), Media (line 632: clean `<!-- ============ 8. CTA ============ -->`), Developer (clean) |
| **Root cause** | Copy-paste propagation between Market and Risk during section renumbering |
| **Fix** | Replace with single clean comment: `<!-- ============ CTA ============ -->` |
| **Fix type** | Page-specific — 2 individual line edits |
| **Effort** | ~1 minute per page |
| **Verdict** | **REPAIR** (P1 priority) |

## D.4 — "Audit-Ready" Trust Grammar violation

| Field | Value |
|---|---|
| **Pattern** | "Audit-Ready" chip badge in Market Intelligence Output section |
| **Pages affected** | Market (line 468) — 1 of 5 |
| **Pages with legitimate exception** | Risk (9 instances, all legitimate) |
| **Pages clean** | Investment, Media, Developer |
| **Fix** | Replace "Audit-Ready" with "Evidence-Linked" or "Inspectable" |
| **Fix type** | Page-specific — single line edit |
| **Effort** | ~1 minute |
| **Verdict** | **REPAIR** (P1 priority) |

## D.5 — Direct competitor naming ("Bloomberg / Market Terminals")

| Field | Value |
|---|---|
| **Pattern** | "Bloomberg / Market Terminals" in Differentiation comparison block |
| **Pages affected** | Investment (line 387), Market (lines 247, 251), Risk (line 334) — 3 of 5 |
| **Pages clean** | Media (uses generic "News / Wire Layer"), Developer (no Differentiation block) |
| **Risk** | Direct competitor naming invites legal review; Media + Developer demonstrate the discipline |
| **Fix** | Soften to "Market Data Terminals" or "Existing Research Platforms" |
| **Fix type** | Content review — marketing/legal decision, not technical |
| **Effort** | ~1 minute per page (after content decision) |
| **Verdict** | **REVIEW** (P3 priority — content decision required before fix) |

## D.6 — `var(--gold)` base token mixing

| Field | Value |
|---|---|
| **Pattern** | `var(--gold)` used directly in inline style instead of `var(--roua-accent)` alias |
| **Pages affected** | Media (line 338) — 1 of 5 |
| **Pages clean** | Investment, Market, Risk, Developer |
| **Visual impact** | None — `--gold` and `--roua-accent` resolve to same value (`#e3b45a`) |
| **Structural impact** | Token-system inconsistency — Media mixes base tokens with aliases |
| **Fix** | Replace `var(--gold)` with `var(--roua-accent)` at line 338 |
| **Fix type** | Page-specific — single line edit |
| **Effort** | ~1 minute |
| **Verdict** | **REPAIR** (P1 priority) |

## Defect Summary

| ID | Type | Pages | Priority | Effort | Verdict |
|---|---|---|---|---|---|
| D.1 | Dead `<style>` block | 4/5 | P2 | ~4 min | **REPAIR** |
| D.2 | Old-gold rgba | 3/5 | P1 | ~6 min | **REPAIR** |
| D.3 | Malformed HTML comment | 2/5 | P1 | ~2 min | **REPAIR** |
| D.4 | "Audit-Ready" violation | 1/5 | P1 | ~1 min | **REPAIR** |
| D.5 | Competitor naming | 3/5 | P3 | content | **REVIEW** |
| D.6 | `var(--gold)` mixing | 1/5 | P1 | ~1 min | **REPAIR** |

**Total technical repair budget (P1+P2): ~14 minutes.**
**Content review (P3): separate track.**

---

# LAYER 5 — DO-NOT-TOUCH RULES

> These are the adaptations that MUST survive consolidation. Touching them recreates the Homepage-disaster problem.

## 5.1 Do-Not-Touch: Product-Specific Grammar

| Rule | Verdict | Reason |
|---|---|---|
| Do NOT force Decision Environment grammar onto Developer | **KEEP** | Developer is Integration Layer, not Decision Environment. Its value chain (Intelligence Request → Product Integration) is correct. |
| Do NOT force Investment's sparser Hero onto Risk | **KEEP** | Risk needs CTA row + trust pills because buyer (compliance) needs immediate action path + trust reassurance. |
| Do NOT remove Risk's Audit-Ready exception | **KEEP** | v1 §15 explicitly allows "audit-ready" on `risk-intelligence.html`. The 9 instances are all legitimate. |
| Do NOT remove Media's anti-AI-generator framing | **KEEP** | 5 statements + Editorial Control Statement section prevent Media from being perceived as "AI news generator." |
| Do NOT remove Developer's "designed to" anti-claim language | **KEEP** | 14 "designed to" statements + 5 deferrals + 1 anti-claim prevent contract perception. |
| Do NOT remove Media's Editorial Control Statement section | **KEEP** | "Editorial control remains with your newsroom" is the core anti-AI-generator positioning. |
| Do NOT remove Developer's Enterprise Engagement workflow | **KEEP** | 5-step engagement workflow replaces self-serve signup. Core to Integration Layer positioning. |
| Do NOT remove product-specific Verified labels | **KEEP** | Each label (Verified Fact / Event / Risk Event / News Fact) serves its product's nature. |
| Do NOT remove product-specific ROUA Context labels | **KEEP** | Market / Risk / Editorial / Governance Metadata — each correct for its product. |
| Do NOT remove product-specific value chains | **KEEP** | 4-step (Investment + Market + Risk) vs 5-step (Media + Developer) — each correct. |
| Do NOT remove Risk's 8-vessel Blocked Property detail | **KEEP** | Source granularity is Risk's core value (compliance buyers need IMO numbers). |

## 5.2 Do-Not-Touch: Hero Composition

| Rule | Verdict | Reason |
|---|---|---|
| Do NOT unify Hero H1 weight (300 vs 800) | **KEEP** | Developer's `.page-hero` (single-column) requires 800; split Hero requires 300 for balance. |
| Do NOT unify Hero layout (`.hero-split` vs `.page-hero`) | **KEEP** | Developer is Integration Layer — single-column Hero is correct. |
| Do NOT add `.glass-status-card` to Developer | **KEEP** | Developer uses custom "Illustrative Integration Object" card — correct for integration framing. |
| Do NOT add ambient background to Developer | **KEEP** | Developer has zero atmosphere — correct for technical Integration Layer audience. |
| Do NOT add `glass-status-dot` pulse to Developer | **KEEP** | Developer has zero animation — correct. |
| Do NOT add Homepage-brand elements to any product page | **FORBID** | Globe, particles, wave, 3D tilt, decode chars, `.chain` pulse, `.hline` rise — all Homepage-only. |

## 5.3 Do-Not-Touch: Density & Structure

| Rule | Verdict | Reason |
|---|---|---|
| Do NOT force 4-card Problem grid onto Market | **KEEP** | Market has 5 problems (Context Loss, Price Without Cause, Market Moves Without Context, Decisions Without Proof, Decision Accountability). |
| Do NOT force 4-card Deployment onto Media + Developer | **KEEP** | Media + Developer use compressed 3-card Deployment — correct for their buyer (Cloud/White-label focus). |
| Do NOT remove Business Outcomes from Market + Media | **KEEP** | Before/After grid is correct for these products' narrative. |
| Do NOT add Business Outcomes to Investment + Risk + Developer | **KEEP** | These products don't need it — their narrative is complete without it. |
| Do NOT force Evidence Example section onto Developer | **KEEP** | Developer uses "Evidence & Governance Flow" (how-step vertical) instead — correct for Integration Layer. |

## 5.4 Do-Not-Touch: Source Discipline

| Rule | Verdict | Reason |
|---|---|---|
| Do NOT add competitor naming to Media or Developer | **FORBID** | Media + Developer are the discipline examples (generic categories only). |
| Do NOT add wire service links to Media | **FORBID** | Media only links to official government sources (federalreserve.gov). Zero Reuters/Bloomberg/AP. |
| Do NOT add API/SDK code samples to Developer | **FORBID** | Developer explicitly defers all contract specifics to enterprise engagement. |

---

# LAYER 6 — PROPAGATION MATRIX FOR REST OF SITE

> How the product-family rules apply to the remaining 25+ pages. Each page category has a role and inherits specific rules.

## 6.1 Page Category Roles

| Category | Role | Visual Identity | Trust Grammar | Motion |
|---|---|---|---|---|
| **Homepage** (`index.html`) | Brand | Cinematic but restrained (FROZEN — Visual Reference) | Demonstrates grammar; not strictest | Ambient allowed (globe, particles, wave) |
| **Product Pages** (5 audited) | Decision / Integration | Evidence-first / restrained | Strictest evidence/analysis boundary | Minimal (status dot only) |
| **Architecture** (`architecture.html`) | Infrastructure | Diagrams, depth, no glass/globe | Canonical pipeline explanation | Minimal |
| **Explorers** (Evidence, Source, Sample) | Inspection | Minimal motion, dense metadata, `.card-evidence` | Maximum inspectability | Zero (most restrained) |
| **Catalog** (`catalog.html`) | Reference | Structured, no marketing theatrics | Component listing | Minimal |
| **Solutions** (Trading Desks, Investment Firms, Financial Media, Enterprise) | Buyer-facing | Similar to product pages but solution-focused | Outcome-oriented | Minimal |
| **Solutions Overview / Why ROUA / Business Case** | Analytical | Evidence-dense, no marketing | Argument-building | Minimal |
| **Company** (About, Research Institute, Careers, Contact) | Corporate | Restrained, no product theatrics | Standard | Minimal |
| **Trust Framework** (`trust-framework.html`) | Governance | Most restrained, evidence-first | Canonical trust properties | Zero |
| **Methodology** (`methodology.html`) | Reference | Document-style, dense | Canonical methodology | Zero |
| **Infrastructure Report** (`infrastructure-report.html`) | Reference | Document-style, dense | Canonical infrastructure | Zero |
| **Platform Overview** (`platform.html`) | Reference | Diagrams, structure | Platform explanation | Minimal |
| **Source Registry** (`source-registry.html`) | Inspection | Dense table, minimal motion | Source listing | Zero |
| **Product Experience Center** (`product-experience.html`) | Experience | Interactive demos | Sample showcase | Controlled |
| **Developers** (`developers.html`) | Reference | Code-heavy, links to Developer Platform | Developer docs | Zero |
| **Design Reference** (`design-reference.html`) | Reference | Design system showcase | Component library | Zero |

## 6.2 Mandatory Rules for ALL Remaining Pages

Every page (regardless of category) MUST comply with:

| Rule | Verdict |
|---|---|
| Use `--roua-*` token aliases (no base tokens, no raw hex in styles) | **KEEP** |
| Never use `rgba(201, 162, 39, ...)` (old gold) | **FORBID** |
| Never use `var(--gold)` directly (use `var(--roua-accent)`) | **FORBID** |
| Use `.navbar` + `.nav-container` + `.nav-logo` + `.nav-links` | **STANDARDIZE** |
| Products dropdown: 6 links (no Trading Desks) | **KEEP** |
| Footer: 6 columns (no Channels) | **KEEP** |
| Mobile hamburger: `.nav-toggle` | **KEEP** |
| Active nav state: `nav-dropdown-trigger active` on current page's dropdown | **ADOPT** |
| `.skip-link` accessibility link | **ADOPT** |
| Zero forbidden phrases (Layer 1.9) | **FORBID** |
| Zero old taxonomy (Layer 1.10) | **FORBID** |
| Zero Homepage-brand elements (globe, particles, wave, 3D tilt, decode, `.chain`, `.hline`, `.chips`, `.gstats`, `.glass`) | **FORBID** (except Homepage itself) |
| HTML comment balance PASS | **KEEP** |
| `<div>` balance PASS | **KEEP** |
| `<section>` balance PASS | **KEEP** |
| No broken internal anchors | **KEEP** |
| No dead inline `<style>` blocks targeting non-existent IDs | **FORBID** |

## 6.3 Category-Specific Rules

### Architecture (`architecture.html`)
| Rule | Verdict |
|---|---|
| May use depth/orbits for infrastructure visualization | **KEEP** |
| Must NOT use the literal `.globe` canvas | **FORBID** |
| Must NOT use `.glass` | **FORBID** |
| Should use `.card-evidence` for pipeline stages | **ADOPT** |
| Should use `.workflow` (v7-patch) for vertical process flows | **ADOPT** |
| May use entrance reveals (`.rv`) | **KEEP** |
| Must NOT have constant ambient motion | **FORBID** |

### Explorers (Evidence Explorer, Source Explorer, Sample Library)
| Rule | Verdict |
|---|---|
| Must use `.card-evidence` (v7-patch) for evidence rows | **ADOPT** |
| Must NOT use `.cx` hover theatrics on evidence rows | **FORBID** |
| Minimal motion — zero animation | **KEEP** |
| Dense metadata (mono labels, provenance, source links) | **KEEP** |
| Direct links to official sources (like product pages) | **KEEP** |
| Must use "Verified Fact/Event" labels (like product pages) | **KEEP** |
| Must include "Inspect in Evidence Explorer" continuity links | **KEEP** |

### Catalog (`catalog.html`)
| Rule | Verdict |
|---|---|
| Structured component listing | **KEEP** |
| No marketing theatrics | **KEEP** |
| Use `.card` (v7-patch plain) for component cards | **ADOPT** |
| May use `.card-accent` for featured modules | **KEEP** |

### Solutions (Trading Desks, Investment Firms, Financial Media, Enterprise)
| Rule | Verdict |
|---|---|
| Similar Hero pattern to product pages (`.hero-split` + `.glass-status-card`) | **ADOPT** |
| Solution-specific value chain (not product chain) | **KEEP** |
| May use 4-card Deployment grid | **KEEP** |
| Must link to relevant product pages | **KEEP** |
| Must NOT use "Bloomberg" naming | **REVIEW** (adopt Media discipline) |

### Solutions Overview / Why ROUA / Business Case
| Rule | Verdict |
|---|---|
| Evidence-dense, argument-building | **KEEP** |
| May use comparison tables (like Homepage) | **KEEP** |
| Must NOT use Homepage ambient motion | **FORBID** |
| Should use "Build vs Integrate" pattern (from Developer) | **ADOPT** |

### Company (About, Research Institute, Careers, Contact)
| Rule | Verdict |
|---|---|
| Restrained, corporate | **KEEP** |
| No product theatrics | **KEEP** |
| Standard nav + footer | **KEEP** |
| Contact page: form-focused, clean | **KEEP** |

### Trust Framework (`trust-framework.html`)
| Rule | Verdict |
|---|---|
| Most restrained page on site | **KEEP** |
| Zero animation | **KEEP** |
| Canonical trust properties (Versioned Provenance, Trust Property — NOT Provenance Immutability / Trust Promise) | **KEEP** |
| Must use "Governed Intelligence Object" (NOT "Verified Intelligence Object") | **KEEP** |
| Must NOT claim SOC 2 / ISO 27001 | **FORBID** |

### Methodology / Infrastructure Report
| Rule | Verdict |
|---|---|
| Document-style, dense | **KEEP** |
| Zero animation | **KEEP** |
| Canonical methodology/infrastructure explanation | **KEEP** |

### Developers (`developers.html`)
| Rule | Verdict |
|---|---|
| Code-heavy reference page | **KEEP** |
| Links to Developer Platform product page | **KEEP** |
| May show code samples (this is the developer reference, not the product page) | **KEEP** |
| Must maintain "designed to" anti-claim language | **KEEP** |

### Homepage (`index.html`)
| Rule | Verdict |
|---|---|
| FROZEN as Visual Reference Implementation | **KEEP** |
| May use full cinematic vocabulary (globe, particles, wave, 3D tilt, etc.) | **KEEP** (Homepage only) |
| Must add `.nav-toggle` mobile hamburger | **ADOPT** (from product pages) |
| Must remove "Trading Desks" from Products dropdown | **REPAIR** (currently 7 links, should be 6) |
| Must remove "Channels" footer column | **REPAIR** (currently present) |
| Must address "411+" stats presentation (Hero vs Trusted Foundation inconsistency) | **REVIEW** |

---

# ACCEPTANCE CONTRACT

> This spec is the acceptance contract for every subsequent page audit. Any page (Delta 06+) is evaluated against:
> 1. **Layer 1** — Does it comply with the canonical baseline?
> 2. **Layer 5** — Does it violate any do-not-touch rule?
> 3. **Layer 6** — Does it comply with its category-specific rules?
> 4. **Layer 4** — Does it have any of the confirmed defects (D.1–D.6)?

## Acceptance Criteria

A page PASSES acceptance when:
- ✓ All Layer 1 rules satisfied (KEEP / STANDARDIZE-compliant / no FORBID violations)
- ✓ Zero Layer 5 do-not-touch violations
- ✓ Layer 6 category-specific rules satisfied
- ✓ Zero D.1–D.6 defects (or all REPAIR items resolved)

A page FAILS acceptance when:
- ✗ Any Layer 1 FORBID violation
- ✗ Any Layer 5 do-not-touch violation
- ✗ Any Layer 6 category-specific FORBID violation
- ✗ Any unrepaired D.1–D.6 defect

## Audit Workflow (for Delta 06+)

1. Identify page category (Layer 6.1)
2. Run Layer 1 canonical baseline check (14+14 checklist from v1 §17)
3. Run Layer 5 do-not-touch check
4. Run Layer 6 category-specific check
5. Run Layer 4 defect scan (D.1–D.6)
6. Classify remaining drift into A/B/C/D
7. Produce Delta Report with PASS/FAIL acceptance verdict

---

# IMPLEMENTATION SEQUENCE

> After this spec is approved, implementation proceeds in this order. No step begins until the prior step is complete.

## Phase 1: Technical Repairs (P1) — ~10 minutes

| Step | Action | Pages | Effort |
|---|---|---|---|
| 1.1 | REPAIR D.2 — replace `rgba(201,162,39,...)` with `rgba(227,180,90,...)` | Market, Risk, Media | ~6 min |
| 1.2 | REPAIR D.3 — fix malformed HTML comment | Market (line 652), Risk (line 598) | ~2 min |
| 1.3 | REPAIR D.4 — replace "Audit-Ready" with "Evidence-Linked" | Market (line 468) | ~1 min |
| 1.4 | REPAIR D.6 — replace `var(--gold)` with `var(--roua-accent)` | Media (line 338) | ~1 min |

## Phase 2: Cleanup (P2) — ~5 minutes

| Step | Action | Pages | Effort |
|---|---|---|---|
| 2.1 | REPAIR D.1 — remove dead `<style>` block (lines 13–30) | Investment, Market, Risk, Media | ~4 min |
| 2.2 | ADOPT `.skip-link` | Investment, Market, Risk, Media | ~1 min each |

## Phase 3: Content Review (P3) — separate track

| Step | Action | Pages | Effort |
|---|---|---|---|
| 3.1 | REVIEW D.5 — soften "Bloomberg / Market Terminals" to "Market Data Terminals" | Investment, Market, Risk | Content decision |
| 3.2 | ADOPT active nav state | Investment, Market, Risk, Media | ~1 min each |
| 3.3 | ADOPT `.back-link` where appropriate | Investment, Market, Risk, Media | ~1 min each |

## Phase 4: Homepage Repairs — separate track

| Step | Action | Effort |
|---|---|---|
| 4.1 | REPAIR — remove "Trading Desks" from Products dropdown | ~1 min |
| 4.2 | REPAIR — remove "Channels" footer column | ~2 min |
| 4.3 | ADOPT — add `.nav-toggle` mobile hamburger | ~5 min |
| 4.4 | REVIEW — "411+" stats presentation consistency | Content decision |

## Phase 5: Continue Audits — Delta 06+

| Step | Action |
|---|---|
| 5.1 | Audit Architecture (`architecture.html`) against this spec |
| 5.2 | Audit Explorers (Evidence, Source, Sample) |
| 5.3 | Audit Catalog |
| 5.4 | Audit Solutions pages |
| 5.5 | Audit Company pages |
| 5.6 | Audit Trust Framework |
| 5.7 | Audit remaining reference pages |

---

*End of ROUA Product Family Consolidation Spec.*
*This document is the acceptance contract for all subsequent page audits and edits.*

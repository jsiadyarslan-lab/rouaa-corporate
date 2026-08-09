# ROUA Product Family Consolidation Spec

> **Status:** Authoritative acceptance contract extracted from Delta Reports 01–30.
> **Source:** 30 pages audited (Delta 01–30): 5 product pages + 25 non-product pages (Architecture, Explorers, Catalog, Solutions, Company, Trust Framework, Methodology, Infrastructure Report, Platform, Source Registry, Product Experience, Developers, Trading Platform, Financial Intelligence, Financial Media, Contact, Careers, Research Institute, Visual Reference, Design Reference).
> **Purpose:** Converts audit findings into actionable rules. Every rule ends with one of six verdicts.
> **Effective date:** August 10, 2026 (v7 — updated August 10, 2026 after Delta 30 Design Reference audit + 30-page cumulative audit completion).
> **Modification policy:** This spec is the acceptance contract. Page edits must comply. Spec edits require re-auditing the affected product page.
>
> **v7 changelog (post-Delta-30, 30-page cumulative audit):**
> - **No D.15+ added.** Defect taxonomy remains D.1–D.14. All 11 candidate rules from the 30-page audit enter v7 as either NEW category rules (3) or CLARIFICATIONS of existing D.x (8). No new defect types.
> - **3 NEW Layer 6 category rules added:**
>   - **GDS-1: Governed Design-System Surface** — A design-reference page and the canonical token definition files it imports are evaluated as one governed surface. Scope is **dependency-based and confined to canonical token definition files** (`tokens.css`, `roua-v7.css`, `roua-v7-patch.css`) — NOT a general gate for all imported CSS/JS. A legacy token in a canonical token file is D.2 for design-reference pages that import it. Does NOT cascade to third-party libraries, utility CSS, or non-token-definition files.
>   - **Customer-Production Boundary** — Infrastructure Report must explicitly distinguish internal production from customer production in at least 3 locations (hero, status definition, environment note).
>   - **Design-Reference Exception** — On design-reference pages, documentation of a concept (color swatches, typographic labels, scenario text, localization labels) is ACCEPTABLE even if the concept name matches a D.9 term. This is a context exception, NOT an exemption from claims or governance. Capability descriptions in design-reference page text are still D.9; "Audit Ready" as a visible badge is still D.4.
> - **8 CLARIFICATIONS of existing D.1–D.14:**
>   - D.1 expanded: covers dead sub-blocks inside live `<style>` (not just fully-dead blocks).
>   - D.2 expanded: scan surface includes canonical token definition files, not just page-level usage.
>   - D.5 expanded: scan surface includes external CSS/JS files loaded by the page (project-authored files only, not third-party libraries).
>   - D.8 expanded: covers latency-range variants ("in minutes", "in minutes, not hours", "in hours"). Operational-status language ("live", "running", "today", "current", "already", "operational") and meeting/form durations ("30-minute call") are explicitly EXCLUDED — they are not timing claims.
>   - D.9 expanded: concept-based, not keyword-based. Covers verb forms ("scores confidence"), past tense ("confidence scored"), plural ("confidence scores"). "confidence propagation" is explicitly EXCLUDED — different concept. Design-reference data-type documentation added as acceptable tier.
>   - D.10 expanded: covers page identity locations (title, meta description, hero eyebrow, hero H1, hero paragraph, section H2, section paragraph), not just UI labels. Case-insensitive.
>   - Layer 1.9 "every claim" clarified: "material claim" (materiality qualifier) is ACCEPTABLE; "every claim" (universal quantifier) is FORBID. The distinction is the quantifier, not the word "claim".
>   - D.8 operational-state clarification: operational-status language ≠ timing claim. Meeting durations ≠ timing claim. Form-fill estimates ≠ timing claim.
>
> **v6 changelog (post-Delta-10):**
> - Implementation-Layer Scope expanded: added **JavaScript content/data strings** (text in external JS files that is rendered as visible HTML). Previously covered JS color strings only; now covers ALL JS strings that become user-visible content.
> - Layer 4 confirmed defects: D.14 (timing/freshness/performance claims in external JS data files) added. Extends D.8/D.13 forbidden phrases to JS content strings rendered as HTML.
> - Layer 1.9 D.9 clarified: "Confidence Scoring" added as **REVIEW leaning FORBID**. Unlike "Extraction Confidence" (illustrative metadata, acceptable when marked "(illustrative)"), "Confidence Scoring" is a capability description without illustrative disclaimer — closer to FORBID. Boundary: `illustrative metadata (acceptable) < confidence scoring as capability description (REVIEW leans FORBID) < confidence score as proven claim (FORBID)`.
> - Layer 6.3: Catalog UX acceptance added: `Product Overview → Capability Filter → Maturity Classification → Product Page Navigation`.
> - D.10 confirmed again: Catalog (Delta 10) line 514 — "Trading Intelligence" as filter label (product-name use). Now 2 confirmed cases (Evidence Explorer + Catalog). Risk remains LOW but is NOT zero.
>
> **v5 changelog (post-Delta-09):**
> - Layer 1.9 D.4 expanded: FORBID now covers all semantic variants of "audit-ready" — "Audit-Ready", "Audit Ready", "audit ready", "audit-ready". The FORBID applies to the **concept** (claiming audit readiness), not the hyphenation. Scanner matches case-insensitive, hyphen-insensitive.
> - Layer 1.9 D.9 clarified: "Extraction Confidence" added as **REVIEW** (not auto-FORBID). When "confidence" is used as illustrative metadata (marked "(illustrative)") and NOT as a proven platform claim, it is acceptable. When "confidence" is used as a scoring claim without illustrative disclaimer, it is FORBID. Spec defines the boundary: `illustrative metadata ≠ platform claim`.
> - Layer 1.10 D.10 clarified: descriptive adjective use of "institutional intelligence" (e.g., "institutional intelligence products", "Institutional Intelligence Outputs" as a headline describing the category of outputs) is **NOT** D.10. D.10 applies only when old taxonomy terms are used as **product names or taxonomy labels** — not when they appear as natural descriptive language. The taxonomy scanner must not block natural language.
> - Layer 6.3 UX table: Sample Library UX test added: `Sample Output → Evidence Chain → Reasoning/Validation Boundary → Product Cross-Link`.
> - D.12 scope clarified: remains Explorer-specific. For Sample Library, samples built on a specific identified source should link to that source/document. Not generalized to all site pages.
> - D.10 status: mandatory scan continues, but NOT system-wide. Evidence Explorer remains the only confirmed case. Three subsequent pages (Architecture, Source Explorer, Sample Library) are clean.
>
> **v4 changelog (post-Delta-08):**
> - Layer 4 confirmed defects: D.11 (non-canonical raw hex), D.12 (no direct source links on Explorer pages), D.13 ("24/7" timing claim — REVIEW) added.
> - Layer 1.1 Token System: added explicit rule forbidding non-canonical/off-brand raw colors. ALL hex values must match a canonical token. D.7 (deprecated) and D.11 (non-canonical) are distinct defect classes.
> - Layer 6.3 Explorer rules: UX acceptance split by Explorer type. Evidence Explorer: `Source → Document → Evidence → Provenance → Context`. Source Explorer: `Source → Identity → Jurisdiction → Type → Monitoring Status → Official Domain`.
> - D.10 status downgraded: from "system-wide potential" to "confirmed defect on Evidence Explorer + mandatory scan elsewhere". Source Explorer (Delta 08) is clean, confirming D.10 is NOT system-wide — but scan remains mandatory.
> - D.13 deliberately kept as REVIEW (not auto-FORBID): "24/7" is not automatically equivalent to "real-time". Spec v4 treats it as judgment call until operational evidence is reviewed.
>
> **v3 changelog (post-Delta-07):**
> - Layer 4 confirmed defects: D.10 (old taxonomy in content) added. Treated as **system-wide potential defect** until proven otherwise by audit — not just an Evidence Explorer issue.
> - Layer 6.3 Explorer rules softened: `.card-evidence` rule changed from "Must use" to "Must use evidence-first card pattern (`.card-evidence` OR equivalent custom system)".
> - Layer 1.10 Taxonomy scan scope expanded: taxonomy check applies to ALL content (nav, footer, body copy, output fields, descriptions, JavaScript strings), not just nav/footer.
>
> **v2 changelog (post-Delta-06):**
> - Layer 1.1 Token System expanded: raw-hex prohibition now covers CSS, inline styles, SVG `fill`/`stroke`, Canvas/Three.js colors, and JavaScript color constants.
> - Layer 4 confirmed defects: D.7 (deprecated raw hex), D.8 ("real time" claims), D.9 ("confidence score/d" claims) added.
> - Acceptance Contract clarified: PASS requires safety across ALL implementation layers (HTML + CSS + SVG + JS + content claims), not HTML/CSS only.
> - Technology neutrality principle added: Three.js / GSAP / Canvas are NOT prohibited — inconsistent usage and unproven claims are the problem.

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

> **Scope expansion (v2):** Token rules apply across **all implementation layers** — CSS declarations, inline styles, SVG `fill`/`stroke` attributes, Canvas/Three.js color definitions, and JavaScript color constants. A page is not token-clean if it uses canonical tokens in CSS but hardcodes deprecated colors in SVG or JavaScript.
>
> **v7 scope expansion — canonical token definition files:** D.2 scan surface now includes **canonical token definition files** (`tokens.css`, `roua-v7.css`, `roua-v7-patch.css`) — not just page-level usage. If a token definition file defines `--roua-accent: #C9A227`, every page that imports that file inherits D.2 at the token-definition layer, even if the page's own markup uses `var(--roua-accent)` correctly. This is the **governed design-system surface** scope (see GDS-1 in Layer 6). **Scope limit:** This applies ONLY to canonical token definition files — NOT to third-party libraries, utility CSS, or non-token-definition JS files.

| Rule | Detail | Verdict |
|---|---|---|
| Use `--roua-*` aliases | Never use base tokens (`--bg`, `--gold`, `--txt`, `--dim`, `--panel`, `--line`) directly in inline styles or page-level `<style>` blocks. Always use aliases (`--roua-bg-primary`, `--roua-accent`, `--roua-text-primary`, etc.). | **KEEP** |
| Never use raw hex in CSS or inline styles | Zero `#xxxxxx` values in `style="..."` attributes or `<style>` blocks. Exception: `<meta name="theme-color">` may use raw hex. | **KEEP** |
| Never use raw hex in SVG `fill` / `stroke` | Inline SVG diagrams (Evidence Chain, flow charts, etc.) must use canonical tokens or `rgba(227, 180, 90, ...)` equivalents. **Forbidden deprecated values:** `#0B0F18`, `#2A3543`, `#949EAF`, `#C4CCDA`, `#C9A227`, `#F5F7FA` (all from deprecated `VISUAL-IDENTITY-SYSTEM.md`). | **FORBID** |
| Never use raw hex in Canvas / Three.js / WebGL | JavaScript color constants (e.g., Three.js `PALETTE`, Canvas `fillStyle`) must use canonical gold `0xE3B45A` (not deprecated `0xC9A227`). Same for blue `0x4F8CFF`, green `0x10B981`, etc. | **FORBID** |
| Never use raw hex in JavaScript color strings | `rgba()`/`rgb()`/hex strings in JavaScript (e.g., `'rgba(201,162,39,0.5)'`) must use canonical values, not deprecated palette. | **FORBID** |
| Never use `rgba(201, 162, 39, ...)` | This is the OLD gold from deprecated `VISUAL-IDENTITY-SYSTEM.md`. Canonical gold is `#e3b45a` = `rgba(227, 180, 90, ...)`. Applies in CSS, SVG, JS — everywhere. | **FORBID** |
| Never use `var(--gold)` directly | Use `var(--roua-accent)` instead. (Media D.6 is the one violation — REPAIR.) | **FORBID** |
| Never use non-canonical/off-brand raw hex (v4 — D.11) | ALL hex values in CSS, inline styles, SVG, or JS must match a canonical token from the color reference table below. Off-brand colors that match NO token (e.g., `#2DBA8E` instead of `var(--roua-green)` `#10B981`, `#4A90D9` instead of `var(--roua-blue)` `#4F8CFF`, `#F5A623` instead of `var(--roua-amber)` `#F59E0B`) are **FORBID**. Distinct from D.7 (deprecated hex from old palette) — D.11 covers hex values that never existed in any palette. Documented exceptions allowed only when functionally necessary (e.g., a specific chart library requires a precise color not in the token system — must be documented in a code comment explaining why). | **FORBID** |
| White rgba in glass cards | `rgba(255,255,255,0.02)` and `rgba(255,255,255,0.06)` are acceptable in `.glass-status-card` surfaces. | **KEEP** |

### Canonical color reference (for replacement)

| Role | Hex | rgba | Three.js hex | Token alias |
|---|---|---|---|---|
| Gold (accent) | `#E3B45A` | `rgba(227, 180, 90, ...)` | `0xE3B45A` | `var(--roua-accent)` |
| Gold light | `#F4D492` | `rgba(244, 212, 146, ...)` | `0xF4D492` | `var(--roua-accent-hover)` |
| Blue | `#4F8CFF` | `rgba(79, 140, 255, ...)` | `0x4F8CFF` | `var(--roua-blue)` |
| Green (operational) | `#10B981` | `rgba(16, 185, 129, ...)` | `0x10B981` | `var(--roua-green)` |
| Amber (warning) | `#F59E0B` | `rgba(245, 158, 11, ...)` | `0xF59E0B` | `var(--roua-amber)` |
| Background primary | `#040B1C` | `rgba(4, 11, 28, ...)` | `0x040B1C` | `var(--roua-bg-primary)` |
| Surface (panel) | `#0A1630` | `rgba(10, 22, 48, ...)` | `0x0A1630` | `var(--roua-surface)` |
| Text primary | `#EAF2FF` | `rgba(234, 242, 255, ...)` | `0xEAF2FF` | `var(--roua-text-primary)` |
| Text secondary | `#9FB0CC` | `rgba(159, 176, 204, ...)` | `0x9FB0CC` | `var(--roua-text-secondary)` |
| Text muted | `#6B7F9F` | `rgba(107, 127, 159, ...)` | `0x6B7F9F` | `var(--roua-text-muted)` |

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

> **v2 note:** Forbidden phrases apply to ALL content — marketing copy, infrastructure descriptions, JavaScript comments, SVG `<text>` elements, and metadata. A "real time" claim in an Architecture pipeline description is just as forbidden as one in a product Hero.
>
> **v7 clarifications:**
> - **D.8 latency-range variants:** "in minutes", "in minutes, not hours", "in hours" (as intelligence-delivery latency claims) are FORBID — same concept as "real-time" / "within seconds".
> - **D.8 operational-state exclusion:** "live", "running", "today", "current", "already", "operational" are ACCEPTABLE — operational-status statements, not timing/freshness claims. Meeting durations ("30-minute call"), form-fill estimates ("about two minutes"), and deployment timelines ("integration in days" — REVIEW) are also acceptable — they describe user/meeting/deployment effort, not intelligence delivery.
> - **"material claim" ≠ "every claim":** "material claim" / "material claims" (materiality qualifier — only materially-relevant claims require evidence) is ACCEPTABLE. "every claim" / "all claims" (universal quantifier — all claims without qualification) is FORBID. The distinction is the quantifier, not the word "claim".
> - **D.9 concept-based:** D.9 covers all grammatical forms: noun ("Confidence Scoring", "Extraction Confidence", "confidence scores" plural), verb ("scores confidence", "score source confidence"), past tense ("confidence scored"). "confidence propagation" is NOT D.9 — different concept (research term for how confidence values propagate through evidence chain, not a scoring claim).
> - **D.9 design-reference tier:** On design-reference pages, documentation of a concept (typographic labels, scenario text, localization labels) is acceptable even if the concept name matches a D.9 term (see Design-Reference Exception in Layer 6).

| Phrase | Verdict | Exception | Defect ID |
|---|---|---|---|
| "audit-ready" / "Audit-Ready" / "Audit Ready" / "audit ready" (v5 — all semantic variants) | **FORBID** | Only `risk-intelligence.html` (legitimate risk context). FORBID applies to the **concept** (claiming audit readiness), not the hyphenation. Scanner matches case-insensitive, hyphen-insensitive. | D.4 |
| "within seconds" / "in seconds" | **FORBID** | None. Use "through configured source monitoring" | — |
| **"real-time" / "real time"** | **FORBID** | None. Use "through configured source monitoring" or "as they are published" | **D.8** |
| **"in minutes" / "in minutes, not hours" / "in hours"** (v7 — latency-range variants) | **FORBID** | None. These are intelligence-delivery latency claims — same concept as "real-time". Use "through configured source monitoring". | **D.8** |
| **"monitored continuously"** (v7 — word-order variant of "continuously monitored") | **REVIEW** | Acceptable as process description ("the source enters continuous monitoring"). Leans FORBID as marketing/timing claim ("sources monitored continuously"). Context-dependent per Delta 18/25. | D.8 variant |
| "instantly" / "instant" | **FORBID** | None | — |
| "continuously monitored" (as timing claim) | **FORBID** | None. Use "configured source monitoring" | — |
| **"live" / "running" / "today" / "current" / "already" / "operational"** (v7 — operational-state language) | **ACCEPTABLE** | These are operational-status statements (what exists/works now), NOT timing/freshness claims (how fast intelligence arrives). Acceptable on operational-status pages (Infrastructure Report, Contact, Careers). | — |
| **Meeting durations** ("30-minute call", "60-minute walkthrough", "45-minute conversation") (v7) | **ACCEPTABLE** | Describe meeting/user effort, not intelligence delivery. | — |
| **Form-fill estimates** ("about two minutes") (v7) | **ACCEPTABLE** | Describe user effort, not intelligence delivery. | — |
| **"every claim"** (v7 — FORBID tightened) | **FORBID** | Acceptable ONLY in quoted institutional questions ("Can we locate the exact passage behind every claim?"). Forbidden as a ROUA capability claim — use "governed claims" or "each claim". **Variant:** "every published claim" is also FORBID (concept-based). | — |
| **"material claim" / "material claims"** (v7 — ACCEPTABLE) | **ACCEPTABLE** | Materiality qualifier — "only claims that matter materially require evidence". NOT the "every claim" universal quantifier. Distinction is the quantifier, not the word "claim". | — |
| "VERIFIED INTELLIGENCE OBJECT" / "verified Intelligence Object" (v7 — case variants) | **FORBID** | None. Use "GOVERNED INTELLIGENCE OBJECT". FORBID is concept-based — covers all case variants. | — |
| "Trust Promise" | **FORBID** | None. Use "Trust Property" | — |
| "Provenance Immutability" | **FORBID** | None. Use "Versioned Provenance" | — |
| **"confidence score" / "confidence scored" / "confidence scores" (plural)** (v7 — concept-based) | **FORBID** | None. Use "Confidence signals" or "Verification tier". Covers singular, plural, and past-tense forms. | **D.9** |
| **"scores confidence" / "score source confidence"** (v7 — verb forms) | **REVIEW leans FORBID** | Verb-form variants of "Confidence Scoring". Capability descriptions — lean FORBID. Replace with "assesses confidence signals" or "records confidence signals". | D.9 variant |
| **"Extraction Confidence"** (v5 — REVIEW) | **REVIEW** | Acceptable as **illustrative metadata** when marked "(illustrative)" — e.g., Sample Library's "Extraction Confidence: 97% (illustrative)". FORBID when used as a **proven platform claim** without illustrative disclaimer. Boundary: `illustrative metadata ≠ platform claim`. | D.9 variant |
| **"Confidence Scoring"** (v6 — REVIEW leans FORBID) | **REVIEW** | When used as a **capability description** without illustrative disclaimer — **leans FORBID**. Recommend replacing with "Confidence Signals". | D.9 variant |
| **"confidence propagation"** (v7 — EXCLUSION) | **ACCEPTABLE** | NOT D.9. Different concept — research term for how confidence values propagate through the evidence chain (structural property), not a scoring claim. | — |
| **Design-reference documentation of confidence terms** (v7 — Design-Reference Exception) | **ACCEPTABLE** | On design-reference pages, typographic category labels ("Confidence Score" as a type-style label), operational-state scenario text ("Confidence score fell below threshold"), and localization data-type labels ("Confidence scores remain in international format") are acceptable — the page documents how to display/typeset/localize the concept, not claiming it as a capability. See Layer 6 Design-Reference Exception. | — |
| "SOC 2" / "ISO 27001" | **FORBID** | None (removed in P0 sweep) | — |

## 1.10 Taxonomy (Locked)

> **v3 scope expansion:** Taxonomy check applies to **ALL content** — navigation, footer, body copy, output fields, descriptions, JavaScript strings, SVG `<text>` elements, and metadata. The P0 sweep cleaned nav/footer across the site, but **content-level taxonomy drift survives** in pages built before taxonomy was locked. Every page audit must scan the full content surface, not just nav/footer.
>
> **v7 D.10 scope expansion — page identity:** D.10 covers old taxonomy used as **page identity** (title, meta description, hero eyebrow, hero H1, hero paragraph, section H2, section paragraph), NOT just UI labels (CTA buttons, card titles). Using "Trading Intelligence" or "Institutional Intelligence" as the page's primary identity is D.10 — even if canonical names appear correctly in nav/footer. **Case-insensitive:** lowercase "trading intelligence" in meta description is D.10. **Shorthand product lists** ("Investment, Market, Risk, Media, Trading, or Developer") lean acceptable as descriptive shorthand (per Delta 26, 28, 30).

| Term | Correct Usage | Verdict |
|---|---|---|
| "Investment Intelligence" | Product name | **KEEP** |
| "Risk Intelligence" | Product name | **KEEP** |
| "Market & Trading Intelligence" | Product name (never "Market Intelligence" alone as product name) | **KEEP** |
| "Media Intelligence" | Product name | **KEEP** |
| "Developer Platform" | Product name (never "Developer Intelligence" or "Developer APIs") | **KEEP** |
| "Trading Desks" | Solution (never Product) | **KEEP** |
| "Investment Firms" | Solution (never "Institutional Intelligence") | **KEEP** |
| "Intelligence Modules Catalog" | Product reference page | **KEEP** |

### Forbidden old taxonomy (v5 — descriptive-use clarification)

> **D.10 (v5 clarification):** The following old terms are FORBID when used as **product names or taxonomy labels** — NOT when they appear as natural descriptive language. The taxonomy scanner must not block natural language.
>
> **Descriptive use is NOT D.10.** For example:
> - "institutional intelligence products" (lowercase, descriptive adjective phrase = "products of institutional intelligence") → **acceptable**
> - "Institutional Intelligence Outputs" as a headline describing the category of outputs → **acceptable** (describes what the outputs are, not a product name)
> - "Trading Intelligence" as a standalone product name in a "Delivered To" field → **D.10 violation** (used as product name)
>
> **Product-name use IS D.10.** For example:
> - "Trading Intelligence · Institutional Intelligence · Media Intelligence · Developer APIs" in a product delivery list → **D.10 violation** (each term used as a product name)
>
> **D.10 status (v5):** Mandatory scan continues on all pages, but NOT system-wide. Evidence Explorer (Delta 07) is the only confirmed case. Three subsequent pages (Architecture, Source Explorer, Sample Library) are clean.

| Old term (FORBID as product name/taxonomy label) | Correct term (KEEP) | Descriptive use (acceptable) |
|---|---|---|
| "Trading Intelligence" (alone, as product name) | "Market & Trading Intelligence" | N/A — always a product reference |
| "Institutional Intelligence" (as product name) | "Investment Intelligence" (product) or "Investment Firms" (solution) | "institutional intelligence products/outputs" (lowercase, descriptive adjective) = acceptable |
| "Developer Intelligence" (as product name) | "Developer Platform" | N/A — always a product reference |
| "Developer APIs" (as product name) | "Developer Platform" | N/A — always a product reference |
| "Market Intelligence" (alone, as product name) | "Market & Trading Intelligence" | "market intelligence" (lowercase, descriptive) = acceptable |

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

## D.1 — Dead inline `<style>` block (lines 13–30) / Dead CSS sub-blocks (v7)

| Field | Value |
|---|---|
| **Pattern** | Inline `<style>` block targeting `#integrates-with` and `#powered-by` IDs that do not exist in the page. **v7 expansion:** Also covers **dead sub-blocks inside an otherwise live `<style>`** — classes defined but never referenced in body. |
| **Pages affected** | Investment, Market, Risk, Media (4 of 5 — fully dead blocks). Developers (Delta 22 — dead sub-blocks: `.tree-*` classes + `.arch-branch.b-*` modifiers inside live `<style>`). |
| **Pages clean** | Developer (for fully-dead blocks). |
| **Lines** | 13–30 in each affected page (fully dead). Developers lines 70–78, 84–88 (dead sub-blocks). |
| **Fix** | Remove the entire `<style>` block (fully dead) OR remove only the dead class definitions (dead sub-blocks). **Detection method (v7):** grep for class definitions in `<style>`, then grep for class usage in `<body>`. If defined but not used, it's dead CSS — whether the block is fully dead or partially dead. |
| **Fix type** | Bulk cleanup (fully dead) or targeted removal (dead sub-blocks). |
| **Effort** | ~1 minute per page (fully dead), ~2 min for dead sub-block removal. |
| **Verdict** | **REPAIR** (P2 priority) |

## D.2 — Old-gold `rgba(201, 162, 39, ...)` and legacy `#C9A227` (v7 — includes canonical token files)

| Field | Value |
|---|---|
| **Pattern** | `rgba(201, 162, 39, 0.06/0.08/0.02)` — OLD gold from deprecated `VISUAL-IDENTITY-SYSTEM.md`. Also covers `#C9A227` (legacy hex). Canonical gold is `#e3b45a` = `rgba(227, 180, 90, ...)`. **v7 expansion:** D.2 scan surface includes **canonical token definition files** (`tokens.css`, `roua-v7.css`, `roua-v7-patch.css`) — not just page-level usage. |
| **Pages affected** | Market (lines 405, 460), Risk (lines 416, 483), Media (lines 429, 484) — 3 of 5 product pages. Plus: Infrastructure Report (3 instances), Product Experience (1), Developers (3), Trading Platform (2), Financial Intelligence (1), Research Institute (1), Visual Reference (27), Design Reference (0 page-level but inherits via tokens.css). **v7 root cause:** `tokens.css` defines 8 accent tokens using `#C9A227` / `rgba(201,162,39,...)` (lines 30, 35, 37, 38, 41, 42, 59, 65) — every page importing `tokens.css` inherits D.2 at the token-definition layer. |
| **Pages clean** | Investment (no Evidence Example section), Developer (no Evidence Example section), Contact, Careers. |
| **Location pattern** | Page-level: gold-bordered flow card box-shadow, output card gradient background, SVG fills. Token-level: `tokens.css` accent token definitions. |
| **Fix** | Replace `rgba(201, 162, 39, ...)` with `rgba(227, 180, 90, ...)` and `#C9A227` with `#e3b45a`. **Root fix (v7):** Update `tokens.css` to use canonical values — this automatically fixes all pages importing it. See GDS-1 in Layer 6. |
| **Fix type** | Bulk find-replace (page-level) + root fix (tokens.css). |
| **Effort** | ~3 min for `tokens.css` root fix (shared across all pages importing it) + page-level residual fixes. |
| **Verdict** | **REPAIR** (P1 priority — root fix first) |

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

## D.4 — "Audit-Ready" Trust Grammar violation (v5 — all semantic variants)

| Field | Value |
|---|---|
| **Pattern** | Any semantic variant of "audit-ready" used as a status badge or claim — "Audit-Ready", "Audit Ready", "audit ready", "audit-ready". FORBID applies to the **concept** (claiming audit readiness), not the hyphenation. Scanner matches case-insensitive, hyphen-insensitive. |
| **Pages affected** | Market (line 468 — "Audit-Ready"), Evidence Explorer (lines 1177, 1214 — "Audit-Ready"), Sample Library (line 316 — "Audit Ready" without hyphen, v5 variant) |
| **Pages with legitimate exception** | Risk (9 instances, all legitimate — only page where "audit-ready" is allowed) |
| **Pages clean** | Investment, Media, Developer, Architecture, Source Explorer |
| **Fix** | Replace with "Evidence-Linked" or "Inspectable" |
| **Fix type** | Page-specific — find-and-replace per page |
| **Effort** | ~1 min (Market) + ~2 min (Evidence Explorer) + ~1 min (Sample Library) = ~4 min |
| **Verdict** | **REPAIR** (P1 priority) |

## D.5 — Direct competitor naming ("Bloomberg / Market Terminals") + external CSS/JS (v7)

| Field | Value |
|---|---|
| **Pattern** | "Bloomberg / Market Terminals" in Differentiation comparison block. **v7 expansion:** Also covers competitor naming in **external CSS/JS files loaded by the page** (project-authored files only, not third-party libraries). A competitor reference in `tokens.css` comment is D.5 for every page importing `tokens.css`. |
| **Pages affected** | Investment (line 387), Market (lines 247, 251), Risk (line 334) — 3 of 5. Financial Intelligence (Delta 24, line 430 — "Bloomberg, FactSet, and Reuters"). Visual Reference + Design Reference (Delta 29/30 — `tokens.css` line 5 comment: "Bloomberg Terminal × Palantir × BlackRock Aladdin"). |
| **Pages clean** | Media (uses generic "News / Wire Layer"), Developer (no Differentiation block), most other pages. |
| **Risk** | Direct competitor naming invites legal review; Media + Developer demonstrate the discipline. |
| **Fix** | Soften to "Market Data Terminals" or "Existing Research Platforms" (HTML content). For `tokens.css` comment: replace with "Visual identity: institutional financial infrastructure" (generic phrasing). **Scope limit (v7):** D.5 external-file scope applies to project-authored CSS/JS files only — NOT to third-party libraries (jQuery, GSAP, Three.js from CDN). |
| **Fix type** | Content review (HTML) + comment fix (tokens.css — shared root fix). |
| **Effort** | ~1 minute per page (HTML, after content decision) + ~1 min for tokens.css comment fix. |
| **Verdict** | **REVIEW** (P3 — HTML content decisions) + **REPAIR** (P1 — tokens.css comment, shared root fix) |

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

## D.7 — Deprecated raw hex values (from `VISUAL-IDENTITY-SYSTEM.md`)

| Field | Value |
|---|---|
| **Pattern** | Raw hex values from the deprecated `VISUAL-IDENTITY-SYSTEM.md` palette used in inline SVG `fill`/`stroke` attributes, Canvas/Three.js color constants, or JavaScript color strings |
| **Deprecated hex values** | `#0B0F18` (graphite bg), `#2A3543` (border steel), `#949EAF` (muted steel), `#C4CCDA` (light slate), `#C9A227` (OLD institutional gold), `#F5F7FA` (white) |
| **Deprecated Three.js hex** | `0xC9A227` (old gold), `0xF5C842` (old gold bright), `0x4A90D9` (old blue), `0x1A2433` (old graphite), `0x20A878` (old green) |
| **Pages affected** | Architecture (Delta 06): 6 deprecated hex in inline SVG Evidence Chain diagram (lines 2018–2068) + 5 deprecated hex in Three.js PALETTE (lines 2734–2738) |
| **Pages clean** | All 5 product pages (Investment, Market, Risk, Media, Developer) |
| **Root cause** | Page was built using the deprecated palette and was NOT included in the P0 system sweep that cleaned product pages |
| **Fix** | Replace each deprecated hex with the canonical equivalent from the Layer 1.1 color reference table. For SVG: use `fill="var(--roua-*)"` where supported, or `fill="#E3B45A"` (canonical) where CSS variables are not supported in SVG attributes. For Three.js: replace `0xC9A227` with `0xE3B45A`, `0x4A90D9` with `0x4F8CFF`, etc. |
| **Fix type** | Page-specific — find-and-replace in SVG attributes and JavaScript color constants |
| **Effort** | ~5 minutes (SVG) + ~3 minutes (Three.js PALETTE) = ~8 minutes for Architecture |
| **Verdict** | **REPAIR** (P1 priority) |

## D.8 — "real time" / "real-time" + latency-range variants + operational-state exclusion (v7)

| Field | Value |
|---|---|
| **Pattern** | "real time" or "real-time" used as a timing/freshness claim. **v7 expansion:** Also covers **latency-range variants**: "in minutes", "in minutes, not hours", "in hours" (as intelligence-delivery latency claims). **v7 exclusion:** Operational-status language ("live", "running", "today", "current", "already", "operational"), meeting durations ("30-minute call"), and form-fill estimates ("about two minutes") are **NOT D.8** — they describe operational state or user/meeting effort, not intelligence-delivery latency. |
| **Pages affected** | Architecture (Delta 06): line 1517, 1872 ("in real time"). Developers (Delta 22): lines 343, 443 ("Real-time" push/streaming). Financial Intelligence (Delta 24): line 410 ("in minutes, not hours" — latency variant). Financial Media (Delta 25): line 286 ("Real-time"), line 158 ("monitored continuously" — REVIEW, marketing context leans FORBID). |
| **Pages clean (operational-state language ACCEPTABLE)** | Infrastructure Report (Delta 20): "live" / "today" / "running" / "current" / "already" / "operational" — all acceptable. Contact (Delta 26): "30-minute call" / "About two minutes" — acceptable. Careers (Delta 27): "45-minute call" / "90-minute conversation" — acceptable. |
| **Why forbidden** | "real time" and latency-range claims imply a guaranteed delivery speed that ROUA has not proven. Per Layer 1.9, use "through configured source monitoring" or "as they are published" instead. |
| **Fix** | Replace "in real time" / "Real-time" with "as they are published" or "through configured source monitoring". Replace "in minutes, not hours" with "through configured workflows". Replace "monitored continuously" (marketing context) with "monitored through configured schedules". |
| **Fix type** | Page-specific line edits. |
| **Effort** | ~1 min per instance. |
| **Verdict** | **REPAIR** (P1 priority) |

## D.9 — Confidence terminology (v7 — concept-based, not keyword-based)

| Field | Value |
|---|---|
| **Pattern** | Confidence terminology used as a verification/metric claim. **v7: concept-based, not keyword-based.** Covers all grammatical forms: noun ("Confidence Scoring", "Extraction Confidence", "confidence scores" plural), verb ("scores confidence", "score source confidence"), past tense ("confidence scored"). **v7 exclusion:** "confidence propagation" is NOT D.9 — different concept (research term for how confidence values propagate through evidence chain, not a scoring claim). **v7 design-reference tier:** On design-reference pages, documentation of confidence terms (typographic labels, scenario text, localization labels) is acceptable (see Layer 6 Design-Reference Exception). |
| **Boundary (v7 — 4 tiers)** | `illustrative metadata (acceptable) < design-reference data-type documentation (acceptable) < capability description (REVIEW leans FORBID) < proven platform claim (FORBID)` |
| **Pages affected (D.9 FORBID)** | Architecture (line 2312 "confidence scored"). Evidence Explorer (lines 632, 1202 "confidence score"). Developers (Delta 22: line 435 "confidence scores" plural). Visual Reference (Delta 29: lines 1588, 2790, 2935, 3051 — "confidence scores" / "confidence scored"). |
| **Pages affected (D.9 REVIEW leans FORBID)** | Methodology (Delta 19: 2 instances). Infrastructure Report (Delta 20: 2 instances). Developers (Delta 22: 2 instances). Contact (Delta 26: 1 instance). Research Institute (Delta 28: 6 instances — most on single page, including verb forms). Design Reference (Delta 30: 1 instance). |
| **Pages affected (D.9 acceptable — design-reference)** | Visual Reference (Delta 29: lines 1640, 2863, 2417 — typographic label, scenario, localization). Design Reference (Delta 30: lines 488, 771 — component samples). |
| **Pages affected (D.9 acceptable — illustrative)** | Sample Library (Delta 09: 12 instances, all marked "(illustrative)"). Product Experience (Delta 21: 1 instance, marked "illustrative metric"). |
| **Pages clean** | Investment, Risk, Media, Enterprise, Platform, Source Registry, Trading Platform, Financial Intelligence, Financial Media, Careers. |
| **Fix (FORBID)** | Replace "confidence score" / "confidence scored" / "confidence scores" with "confidence signals" or "verification tier". Replace verb forms ("scores confidence") with "assesses confidence signals" or "records confidence signals". |
| **Fix (REVIEW leans FORBID)** | Replace "Confidence Scoring" / "Extraction Confidence" (capability descriptions) with "confidence signals" or "confidence thresholds". |
| **Fix type** | Page-specific find-and-replace. |
| **Effort** | ~1 min per instance. |
| **Verdict** | **REPAIR** (P1 — FORBID instances) + **REVIEW** (P3 — REVIEW leans FORBID instances, team decision) |

## D.10 — Old taxonomy in content + page identity (v7)

| Field | Value |
|---|---|
| **Pattern** | Old product taxonomy names used in content — body copy, output fields, descriptions, JavaScript strings, SVG `<text>` elements. **v7 expansion:** Also covers **page identity locations** (title, meta description, hero eyebrow, hero H1, hero paragraph, section H2, section paragraph) — NOT just UI labels (CTA buttons, card titles). **Case-insensitive:** lowercase "trading intelligence" in meta is D.10. |
| **Old terms (FORBID)** | "Trading Intelligence" (alone, should be "Market & Trading Intelligence"), "Institutional Intelligence" (should be "Investment Intelligence" or "Investment Firms"), "Developer Intelligence" (should be "Developer Platform"), "Developer APIs" (should be "Developer Platform"), "Market Intelligence" alone as product name (should be "Market & Trading Intelligence") |
| **Pages affected** | Evidence Explorer (Delta 07: line 1214 — UI label). Product Experience (Delta 21: lines 668, 744 — CTA button labels). Trading Platform (Delta 23: 6 instances — page identity: title, meta, hero eyebrow, hero paragraph, section H2, section paragraph). Financial Intelligence (Delta 24: 5 "Institutional Intelligence" page-identity instances + 1 "Trading Intelligence" CTA). Financial Media (Delta 25: 1 "Institutional Intelligence Platform" isolated reference). Contact (Delta 26: 1 "trading intelligence" lowercase in meta description). |
| **Pages clean (confirmed)** | All 5 product pages (nav/footer) + Architecture + Source Explorer + Sample Library + Enterprise + Platform + Methodology + Infrastructure Report + Developers + Careers + Research Institute + Visual/Design Reference (design-reference context). |
| **ACCEPTABLE (not D.10)** | Descriptive adjective use ("institutional intelligence products" lowercase). Shorthand product lists ("Investment, Market, Risk, Media, Trading, or Developer"). Design-reference component demo content. Footer copyright "Institutional Intelligence Products" (descriptive phrase). |
| **Root cause** | Content fields + page identity written before taxonomy was locked (pre-P0-sweep), survived because they are in body copy / page identity, not in nav/footer where P0 scanned. |
| **Fix** | Replace each old term with the correct term from Layer 1.10 taxonomy table. For page-identity violations: update title, meta, hero eyebrow, hero H1/paragraph, section headers. |
| **Fix type** | Page-specific find-and-replace in content + page identity. |
| **Effort** | ~1 min per instance. |
| **Verdict** | **REPAIR** (P1 priority) |

## D.11 — Non-canonical raw hex colors (v4 — NEW)

| Field | Value |
|---|---|
| **Pattern** | Raw hex color values that match NO canonical token (canonical or deprecated). These are "off-brand" colors that drifted from the token system entirely. |
| **D.11 vs D.7 distinction** | D.7 = deprecated hex from `VISUAL-IDENTITY-SYSTEM.md` (`#C9A227`, `#0B0F18`, `#2A3543`, `#949EAF`, `#C4CCDA`, `#F5F7FA`). D.11 = non-canonical hex that matches NO token at all — colors that never existed in any palette. |
| **Pages affected** | Source Explorer (Delta 08): 3 hex values, ~8 instances — `#2DBA8E` (green, should be `var(--roua-green)` `#10B981`), `#4A90D9` (blue, should be `var(--roua-blue)` `#4F8CFF`), `#F5A623` (amber, should be `var(--roua-amber)` `#F59E0B`). Used in status badges, stat cards, source lifecycle stages. |
| **Pages clean** | All 5 product pages + Architecture + Evidence Explorer |
| **Root cause** | Page was built with ad-hoc color values instead of canonical tokens. The status-badge colors (healthy green, warning amber) and lifecycle-stage colors (discovery green, verification/classification blue) were hardcoded. |
| **Fix** | Replace each non-canonical hex with the corresponding canonical token: `#2DBA8E` → `var(--roua-green)`, `#4A90D9` → `var(--roua-blue)`, `#F5A623` → `var(--roua-amber)`. Use the Layer 1.1 canonical color reference table for mapping. |
| **Fix type** | Page-specific — find-and-replace in inline styles + `<style>` block |
| **Effort** | ~5 minutes for Source Explorer |
| **Verdict** | **REPAIR** (P1 priority) |

## D.12 — No direct source links on Explorer pages (v4 — NEW)

| Field | Value |
|---|---|
| **Pattern** | Source registry page shows "Official Domain: federalreserve.gov" as TEXT in a detail field, not as a clickable `<a href>`. Zero external links to official sources. |
| **Spec rule violated** | Layer 6.3 Explorers: "Direct links to official sources (like product pages)" — **KEEP** |
| **Pages affected** | Source Explorer (Delta 08): all 15 source entries. Sample Library (Delta 09): all 6 samples' evidence boxes show "Source" and "Document" as text. |
| **Pages clean** | Evidence Explorer (Delta 07) — has 6 direct links |
| **Scope (v5 clarified)** | **Explorer-specific rule.** For Source Explorer: each source's "Official Domain" should be a clickable link. For Sample Library: samples built on a specific identified source should link to that source/document. NOT generalized to all site pages. |
| **Root cause** | Source Explorer was built as a metadata browser, not an evidence inspector. The "Official Domain" field was treated as display data, not as a link. |
| **Fix** | Add `<a href="https://[official-domain]" target="_blank" rel="noopener">` to each source's "Official Domain" `.detail-value` |
| **Fix type** | Page-specific — 15 source entries need link wrapping |
| **Effort** | ~10 minutes for Source Explorer |
| **Verdict** | **REPAIR** (P1 priority) |

## D.13 — "24/7" timing claim (v4 — NEW, REVIEW)

| Field | Value |
|---|---|
| **Pattern** | "24/7" used as a timing/freshness stat or claim (e.g., "Source Monitoring: 24/7") |
| **Spec rule context** | Layer 1.9 forbids "real-time", "within seconds", "continuously monitored" (as timing claim). "24/7" is similar — it implies continuous guaranteed monitoring — but is NOT automatically equivalent to "real-time". |
| **Pages affected** | Source Explorer (Delta 08): line 525 — stat card "Source Monitoring" shows "24/7" |
| **Judgment call (v4 — deliberately REVIEW, not FORBID)** | "24/7" describes a monitoring schedule (always-on), not a latency guarantee. It may be an acceptable operational description OR an unproven timing claim. Spec v4 does NOT auto-equate "24/7" with "real-time" — that would be overreach. Instead, this is **REVIEW**: the team must determine whether "24/7" is (a) a proven operational commitment (acceptable) or (b) an unproven positioning claim (FORBID). |
| **Fix (if FORBID)** | Replace "24/7" with "Continuous" or "Configured" or "Ongoing" |
| **Fix (if acceptable)** | Leave as-is, but add illustrative disclaimer: "24/7 monitoring — operational target, not guaranteed uptime" |
| **Fix type** | Content review — Spec v4 decision required before fix |
| **Effort** | ~1 minute (after REVIEW decision) |
| **Verdict** | **REVIEW** (P3 priority — deliberate, not auto-FORBID) |

## D.14 — Timing/freshness/performance claims in external JS data files (v6 — NEW)

| Field | Value |
|---|---|
| **Pattern** | Timing/freshness/performance claims ("in under 30 seconds", "in seconds", "real-time", "instant", "24/7") in external JavaScript data files that are rendered as visible HTML content on the page |
| **Why this is new** | D.8 covers "real time" in HTML content. D.13 covers "24/7" in HTML content. D.14 extends forbidden timing claims to **external JS data files** (e.g., `products.js`) whose string values are rendered as HTML. The Spec v5 Implementation-Layer Scope covered JS color strings but NOT JS content strings. v6 closes this gap. |
| **Pages affected** | Catalog (Delta 10): `products.js` loaded by `catalog.html` — 10 instances across multiple capability descriptions: "in under 30 seconds" (line 15), "in seconds" (lines 94, 480), "Real-time analysis" (lines 228, 512), "24/7 monitor" + "instant impact assessment" (lines 481), "in real time" (line 500), "Instant response" + "Real-time updates" (line 614), "Instant retrieval" (line 654), "Real-time insights" (line 674) |
| **Root cause** | `products.js` was written as a data file with marketing-style capability descriptions, including timing claims that were never swept. The P0 sweep cleaned HTML content but did not scan external JS data files. |
| **Fix** | Replace timing claims in `products.js` with governed-language alternatives: "in under 30 seconds" → "through configured source monitoring", "real-time" → "live" or remove, "instant" → "rapid", "24/7" → "continuous", "in seconds" → "rapidly" |
| **Fix type** | External JS file — find-and-replace in `products.js` |
| **Effort** | ~5 minutes |
| **Verdict** | **REPAIR** (P1 priority) |

## Defect Summary

| ID | Type | Pages affected | Priority | Effort | Verdict |
|---|---|---|---|---|---|
| D.1 | Dead `<style>` block | 4/5 product pages | P2 | ~4 min | **REPAIR** |
| D.2 | Old-gold rgba in CSS | 3/5 product pages + Architecture + Evidence Explorer + Source Explorer | P1 | ~6 min (products) + ~10 min (Architecture) + ~3 min (Evidence Explorer) + ~2 min (Source Explorer) | **REPAIR** |
| D.3 | Malformed HTML comment | 2/5 product pages | P1 | ~2 min | **REPAIR** |
| D.4 | "Audit-Ready" violation (all semantic variants) | Market + Evidence Explorer + Sample Library | P1 | ~4 min | **REPAIR** |
| D.5 | Competitor naming | 3/5 product pages | P3 | content | **REVIEW** |
| D.6 | `var(--gold)` mixing | Media | P1 | ~1 min | **REPAIR** |
| D.7 | Deprecated raw hex (SVG/JS) | Architecture | P1 | ~8 min | **REPAIR** |
| D.8 | "real time" timing claim | Architecture + Source Explorer | P1 | ~2 min (Architecture) + ~1 min (Source Explorer) | **REPAIR** |
| D.9 | "confidence score/d" + "Extraction Confidence" REVIEW + "Confidence Scoring" REVIEW leans FORBID | Architecture + Evidence Explorer (FORBID) + Sample Library (REVIEW) + Catalog (REVIEW leans FORBID) | P1+P3 | ~3 min (FORBID) + TBD (REVIEW) | **REPAIR** + **REVIEW** |
| D.10 | Old taxonomy in content (product-name use only) | Evidence Explorer + Catalog (confirmed); mandatory scan elsewhere (risk LOW) | P1 | ~1 min (Explorer) + ~1 min (Catalog) + TBD (risk LOW) | **REPAIR** |
| D.11 | Non-canonical raw hex (v4) | Source Explorer | P1 | ~5 min | **REPAIR** |
| D.12 | No direct source links (v4) | Source Explorer + Sample Library | P1 | ~10 min (Source) + ~3 min (Sample) | **REPAIR** |
| D.13 | "24/7" timing claim (v4) | Source Explorer | P3 | ~1 min (after REVIEW) | **REVIEW** |
| D.14 | Timing claims in external JS data files (v6) | Catalog (`products.js`) | P1 | ~5 min | **REPAIR** |

**Total technical repair budget (P1+P2): ~58 minutes** (was ~53 in v5, was ~48 in v4, was ~33 in v3, was ~25 in v2, was ~14 in v1).
**Content review (P3): D.5 + D.13 + D.9 variants (Sample Library + Catalog) on separate track.**
**D.10 mandatory scan: continues, risk LOW (2 confirmed cases: Evidence Explorer + Catalog).**

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
| Must use evidence-first card pattern (`.card-evidence` OR equivalent custom system with no hover theatrics, no ambient motion, dense metadata, direct source links) | **KEEP** (v3 — softened from "Must use .card-evidence" to accept equivalent patterns like Evidence Explorer's `.step-card`) |
| Must NOT use `.cx` hover theatrics on evidence rows | **FORBID** |
| Minimal motion — zero animation (user-triggered navigation allowed) | **KEEP** |
| Dense metadata (mono labels, provenance, source links) | **KEEP** |
| Direct links to official sources (like product pages) | **KEEP** |
| Must use "Verified Fact/Event" labels (like product pages) | **KEEP** |
| Must include "Inspect in Evidence Explorer" continuity links | **KEEP** |
| Must provide UX inspection test PASS (v4 — split by Explorer type) | **KEEP** — UX acceptance is split by Explorer type (see table below) |

#### Explorer UX acceptance — split by type (v4)

| Explorer type | UX test chain | What the user must be able to quickly inspect |
|---|---|---|
| **Evidence Explorer** (`evidence-explorer.html`) | `Source → Document → Evidence → Provenance → Context` | The full evidence chain behind a claim — from official source to governed intelligence output. User can trace any claim back to its source document, page, paragraph. |
| **Source Explorer** (`source-explorer.html`) | `Source → Identity → Jurisdiction → Type → Monitoring Status → Official Domain` | Source registry metadata — who the source is, what type, what jurisdiction, whether it's healthy, and where its official endpoint is. User can browse, filter, and inspect any source's registry record. |
| **Sample Library** (`sample-library.html`) (v5 — determined) | `Sample Output → Evidence Chain → Reasoning/Validation Boundary → Product Cross-Link` | Sample output gallery — user browses 6 illustrative intelligence outputs, inspects each output's evidence chain + reasoning/validation boundary, and navigates to the relevant product page. |

> **Note:** Each Explorer has its own UX purpose. Do NOT force Evidence Explorer's `Source → Document → Evidence → Provenance → Context` chain onto Source Explorer or Sample Library. Each Explorer's UX test is defined by its own inspection purpose.

### Catalog (`catalog.html`)
| Rule | Verdict |
|---|---|
| Structured component listing | **KEEP** |
| No marketing theatrics | **KEEP** |
| Use `.card` (v7-patch plain) for component cards | **ADOPT** |
| May use `.card-accent` for featured modules | **KEEP** |
| Must provide UX test PASS (v6 — added) | **KEEP** — `Product Overview → Capability Filter → Maturity Classification → Product Page Navigation` |
| External JS data files must comply with Trust Grammar (v6 — D.14) | **FORBID** (timing claims in JS content strings) |

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

## 6.4 v7 NEW Rules — Governance & Context-Specific

### GDS-1: Governed Design-System Surface (v7 — NEW)

> **Scope limit (critical):** GDS-1 is **dependency-based and confined to canonical token definition files** — NOT a general gate for all imported CSS/JS. This rule does NOT cascade to third-party libraries, utility CSS, or non-token-definition files.

| Rule | Verdict |
|---|---|
| A design-reference page (`visual-reference.html`, `design-reference.html`) and the canonical token definition files it imports are evaluated as **one governed design-system surface**. | **KEEP** (v7 — NEW) |
| Canonical token definition files are: `tokens.css`, `roua-v7.css`, `roua-v7-patch.css`. These are the ONLY files in scope for GDS-1. | **KEEP** |
| A legacy token (e.g., `--roua-accent: #C9A227`) in a canonical token definition file is D.2 for design-reference pages that import it — even when the page's own markup uses `var(--roua-accent)` correctly. | **FORBID** (D.2 at source-of-truth level) |
| The page's color swatches accurately reflecting the token file is a **symptom**, not the defect. The defect is in the source-of-truth token file. | **KEEP** |
| **GDS-1 does NOT apply to:** third-party libraries (jQuery, GSAP, Three.js from CDN), utility CSS that isn't a token-definition file, random JS files that don't define design tokens, or any non-canonical-token file. | **KEEP** (scope limit — prevents false-positive cascade) |
| Fix must happen at the token definition file (root fix), not at individual page swatches. Fixing `tokens.css` automatically corrects all pages importing it. | **KEEP** |

### Customer-Production Boundary (v7 — NEW)

| Rule | Verdict |
|---|---|
| Infrastructure Report (`infrastructure-report.html`) must explicitly distinguish **internal production** from **customer production**. | **KEEP** (v7 — NEW) |
| The boundary must be stated in at least **3 locations**: hero, status definition, environment note. | **KEEP** |
| "Operational" = running in ROUA internal production — NOT customer production deployment. | **KEEP** |
| This prevents buyers from assuming ROUA is describing customer-facing production. | **KEEP** |
| Applies to any page describing ROUA's internal production environment (currently Infrastructure Report only). | **KEEP** |

### Design-Reference Exception (v7 — NEW)

> **Critical scope:** This is a **context exception**, NOT an exemption from claims or governance. Capability descriptions in design-reference page text are still D.9; "Audit Ready" as a visible badge is still D.4.

| Rule | Verdict |
|---|---|
| On design-reference pages (`visual-reference.html`, `design-reference.html`), documentation of a concept is ACCEPTABLE even if the concept name matches a D.9 term. | **KEEP** (v7 — NEW) |
| Acceptable design-reference documentation includes: (a) color swatches documenting the palette, (b) typographic category labels ("Confidence Score" as a type-style label), (c) operational-state scenario text ("Confidence score fell below threshold"), (d) localization data-type labels ("Confidence scores remain in international format"). | **KEEP** |
| The distinction: `design-reference documentation of a concept (acceptable) ≠ capability claim of the same concept (D.9 leans FORBID)`. | **KEEP** |
| **NOT excepted:** Capability descriptions in design-reference page text ("confidence scoring" in an architecture layer description) are still D.9. | **FORBID** (still D.9) |
| **NOT excepted:** "Audit Ready" as a visible badge label in a component demo is still D.4. | **FORBID** (still D.4) |
| **NOT excepted:** Competitor naming in design-reference page text or imported CSS comments is still D.5. | **FORBID** (still D.5) |

---

# ACCEPTANCE CONTRACT

> This spec is the acceptance contract for every subsequent page audit. Any page (Delta 06+) is evaluated against:
> 1. **Layer 1** — Does it comply with the canonical baseline? (Covers **all implementation layers**: HTML, CSS, inline styles, SVG attributes, Canvas/Three.js colors, JavaScript color constants, and content claims.)
> 2. **Layer 5** — Does it violate any do-not-touch rule?
> 3. **Layer 6** — Does it comply with its category-specific rules?
> 4. **Layer 4** — Does it have any of the confirmed defects (D.1–D.14)?

## Implementation-Layer Scope (v7)

A page is not compliant merely because its HTML structure is sound and its CSS uses canonical tokens. **PASS requires safety across ALL implementation layers:**

| Layer | What is checked | Example defects |
|---|---|---|
| **HTML** | div/section/comment balance, broken anchors, malformed comments | D.1, D.3 |
| **CSS (page-level `<style>`)** | Token aliases, no deprecated hex, no old-gold rgba, no dead sub-blocks (v7) | D.1 (dead sub-blocks), D.2 (in CSS), D.6 |
| **Inline styles (`style="..."`)** | Token aliases, no raw hex, no `var(--gold)` | D.2 (in inline), D.6 |
| **SVG `fill`/`stroke`** | No deprecated hex from `VISUAL-IDENTITY-SYSTEM.md` | D.7 (SVG) |
| **Canvas / Three.js / WebGL colors** | Canonical hex (`0xE3B45A`, not `0xC9A227`) | D.7 (Three.js) |
| **JavaScript color strings** | `rgba()`/hex strings use canonical values | D.7 (JS) |
| **JavaScript content/data strings** (v6) | Text in external JS files (e.g., `products.js`) that is rendered as visible HTML must comply with Trust Grammar, forbidden phrases, timing claims, and taxonomy. JS content strings are NOT exempt from content rules. | D.4, D.5, D.8, D.9, D.10, D.13, D.14 |
| **Content claims (copy in HTML)** | Trust Grammar forbidden phrases, timing claims, taxonomy. v7: includes page-identity locations (title, meta, hero, section headers) for D.10. | D.4, D.5, D.8, D.9, D.10 |
| **External CSS/JS files (project-authored)** (v7 — NEW) | Project-authored CSS/JS files loaded by the page — competitor naming in comments (D.5), timing claims in JS content (D.8/D.14). **Scope limit:** applies to project-authored files only, NOT third-party libraries (jQuery, GSAP, Three.js from CDN). | D.5 (tokens.css comment), D.14 (products.js) |
| **Canonical token definition files** (v7 — NEW, GDS-1) | `tokens.css`, `roua-v7.css`, `roua-v7-patch.css` — legacy palette in token definitions is D.2 for pages importing them. **Scope limit:** ONLY these 3 files count as "canonical token definition files" — NOT utility CSS, NOT third-party libraries. See GDS-1 in Layer 6.4. | D.2 (tokens.css legacy palette) |

> **A single deprecated hex in an SVG diagram, a single "real time" in a content claim, a single "in under 30 seconds" in a JS data file, or a single `#C9A227` in `tokens.css` — FAILS the page, even if every CSS rule is canonical.**

## Technology Neutrality Principle (v2)

**Three.js, GSAP, Canvas, WebGL, and similar technologies are NOT prohibited.** The Spec does not forbid any rendering or animation library.

What IS prohibited:
- Using deprecated color values in any technology's color definitions (D.7)
- Making timing/freshness claims that the technology has not proven (D.8)
- Making verification/metric claims that the technology has not proven (D.9)
- Forcing Decision Environment motion patterns onto non-Decision pages (Layer 5)
- Using Homepage-brand ambient motion (globe, particles, wave, 3D tilt, decode, chain pulse) on non-Homepage pages (Layer 1.7)

**The technology is neutral. Inconsistent usage and unproven claims are the problem.** Architecture's Three.js 3D "Intelligence Stack" is ALLOWED (Layer 6 — depth/orbits for infrastructure visualization). Architecture's deprecated gold `0xC9A227` in the Three.js PALETTE is FORBIDDEN (D.7).

## Acceptance Criteria

A page PASSES acceptance when:
- ✓ All Layer 1 rules satisfied across ALL implementation layers (HTML + CSS + SVG + JS + external CSS/JS + content claims + canonical token files per GDS-1)
- ✓ Zero Layer 5 do-not-touch violations
- ✓ Layer 6 category-specific rules satisfied (including v7 rules: GDS-1, Customer-Production Boundary, Design-Reference Exception where applicable)
- ✓ Zero D.1–D.14 defects (or all REPAIR items resolved; REVIEW items deferred)

A page FAILS acceptance when:
- ✗ Any Layer 1 FORBID violation in any implementation layer
- ✗ Any Layer 5 do-not-touch violation
- ✗ Any Layer 6 category-specific FORBID violation (including GDS-1 legacy tokens in canonical files, Design-Reference Exception violations)
- ✗ Any unrepaired D.1–D.14 defect in any implementation layer (REVIEW items are P3, not blocking)

## Audit Workflow (v7 — for all pages)

1. Identify page category (Layer 6.1)
2. Run Layer 1 canonical baseline check across ALL implementation layers:
   - HTML integrity (div/section/comment balance, anchors)
   - CSS tokens (page-level `<style>` + external CSS)
   - Inline style tokens (`style="..."`)
   - SVG `fill`/`stroke` hex values
   - Canvas/Three.js/WebGL color constants
   - JavaScript color strings
   - JavaScript content/data strings (text rendered as HTML)
   - Content claims (Trust Grammar forbidden phrases, timing claims, taxonomy — **including page-identity locations** for D.10)
   - **External CSS/JS files (project-authored)** — competitor naming in comments (D.5), timing claims (D.8/D.14)
   - **Canonical token definition files** (v7 GDS-1) — if page imports `tokens.css` / `roua-v7.css` / `roua-v7-patch.css`, scan these for D.2 legacy palette
3. Run Layer 5 do-not-touch check
4. Run Layer 6 category-specific check (**including v7 rules: GDS-1, Customer-Production Boundary, Design-Reference Exception**)
5. Run Layer 4 defect scan (D.1–D.14) across ALL implementation layers
6. Classify remaining drift into A/B/C/D
7. Produce Delta Report with PASS/FAIL acceptance verdict

---

# IMPLEMENTATION SEQUENCE

> After this spec is approved, implementation proceeds in this order. No step begins until the prior step is complete.

## Phase 1: Technical Repairs (P1) — ~53 minutes

| Step | Action | Pages | Effort |
|---|---|---|---|
| 1.1 | REPAIR D.2 — replace `rgba(201,162,39,...)` with `rgba(227,180,90,...)` in CSS | Market, Risk, Media | ~6 min |
| 1.2 | REPAIR D.2 — replace 23 old-gold rgba in Architecture `<style>` block | Architecture | ~10 min |
| 1.3 | REPAIR D.2 — replace 3 old-gold rgba in Evidence Explorer `<style>` + inline | Evidence Explorer | ~3 min |
| 1.4 | REPAIR D.2 — replace 2 old-gold rgba in Source Explorer `<style>` + inline | Source Explorer | ~2 min |
| 1.5 | REPAIR D.3 — fix malformed HTML comment | Market (line 652), Risk (line 598) | ~2 min |
| 1.6 | REPAIR D.4 — replace all semantic variants of "Audit-Ready" with "Evidence-Linked" | Market (line 468), Evidence Explorer (lines 1177, 1214), Sample Library (line 316) | ~4 min |
| 1.7 | REPAIR D.6 — replace `var(--gold)` with `var(--roua-accent)` | Media (line 338) | ~1 min |
| 1.8 | REPAIR D.7 — replace deprecated raw hex in Architecture SVG | Architecture (lines 2018–2068) | ~5 min |
| 1.9 | REPAIR D.7 — replace deprecated hex in Architecture Three.js PALETTE | Architecture (lines 2734–2738) | ~3 min |
| 1.10 | REPAIR D.8 — replace "real time" with "as they are published" | Architecture (lines 1517, 1872), Source Explorer (line 1566) | ~3 min |
| 1.11 | REPAIR D.9 — replace "confidence scored" with "verification tier assigned" (FORBID instances only) | Architecture (line 2312), Evidence Explorer (lines 632, 1202) | ~3 min |
| 1.12 | REPAIR D.10 — replace old taxonomy in Evidence Explorer + Catalog | Evidence Explorer (line 1214), Catalog (line 514) | ~2 min |
| 1.13 | REPAIR D.11 — replace non-canonical hex `#2DBA8E` with `var(--roua-green)` | Source Explorer (lines 145, 334, 1521, 1522) | ~2 min |
| 1.14 | REPAIR D.11 — replace non-canonical hex `#4A90D9` with `var(--roua-blue)` | Source Explorer (lines 1526, 1527, 1531, 1532) | ~2 min |
| 1.15 | REPAIR D.11 — replace non-canonical hex `#F5A623` with `var(--roua-amber)` | Source Explorer (lines 145, 334, 521) | ~1 min |
| 1.16 | REPAIR D.12 — wrap source/sample "Official Domain" + "Source" values in `<a href>` | Source Explorer (15 entries), Sample Library (6 samples × 2 fields) | ~13 min |
| 1.17 | REPAIR D.14 — replace timing claims in `products.js` with governed-language alternatives | Catalog (`products.js` — 10 instances) | ~5 min |

## Phase 2: Cleanup (P2) — ~5 minutes

| Step | Action | Pages | Effort |
|---|---|---|---|
| 2.1 | REPAIR D.1 — remove dead `<style>` block (lines 13–30) | Investment, Market, Risk, Media | ~4 min |
| 2.2 | ADOPT `.skip-link` | Investment, Market, Risk, Media | ~1 min each |

## Phase 3: Content Review (P3) — separate track

| Step | Action | Pages | Effort |
|---|---|---|---|
| 3.1 | REVIEW D.5 — soften "Bloomberg / Market Terminals" to "Market Data Terminals" | Investment, Market, Risk | Content decision |
| 3.2 | REVIEW D.13 — determine if "24/7" is FORBID or acceptable operational description | Source Explorer (line 525) | Spec v4 decision |
| 3.3 | REVIEW D.9 variant — determine if "Extraction Confidence" (illustrative metadata) is FORBID or acceptable | Sample Library (12 instances, all marked illustrative) | Spec v5 decision |
| 3.4 | REVIEW D.9 variant — determine if "Confidence Scoring" (capability description, leans FORBID) should be replaced | Catalog (lines 438, 584) | Spec v6 decision |
| 3.5 | ADOPT active nav state | Investment, Market, Risk, Media | ~1 min each |
| 3.6 | ADOPT `.back-link` where appropriate | Investment, Market, Risk, Media | ~1 min each |

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
| 5.1 | Audit Architecture (`architecture.html`) against this spec ✅ (Delta 06 — FAIL, D.2+D.7+D.8+D.9) |
| 5.2 | Audit Evidence Explorer (`evidence-explorer.html`) against this spec ✅ (Delta 07 — FAIL, D.2+D.4+D.9+D.10) |
| 5.3 | Audit Source Explorer (`source-explorer.html`) against this spec ✅ (Delta 08 — FAIL, D.2+D.8+D.11+D.12+D.13) |
| 5.4 | Audit Sample Library (`sample-library.html`) ✅ (Delta 09 — FAIL, D.2+D.4 variant+D.9 variant REVIEW+D.12) |
| 5.5 | Audit Catalog (`catalog.html`) ✅ (Delta 10 — FAIL, D.9 variant+D.10+D.14) |
| 5.6 | Audit Solutions pages against Spec v6 |
| 5.7 | Audit Company pages against Spec v6 ✅ (Delta 26–28 — Contact, Careers, Research Institute) |
| 5.8 | Audit Trust Framework against Spec v6 ✅ (Delta 15 — Trust Framework) |
| 5.9 | Audit remaining reference pages against Spec v6 ✅ (Delta 29–30 — Visual Reference, Design Reference) |

> **v7 Note:** All 30 pages audited (Delta 01–30). 4 PASS (Enterprise, Platform, Source Registry borderline, Careers), 26 FAIL. **No D.15+ new defect types found across the entire 30-page audit.** Spec v7 refines D.1–D.14 with 8 clarifications and adds 3 NEW Layer 6 category rules (GDS-1, Customer-Production Boundary, Design-Reference Exception). Defect taxonomy remains D.1–D.14. **D.10** now covers page-identity locations (title/meta/hero/section headers). **D.9** is concept-based (covers verb forms, excludes "confidence propagation"). **D.8** covers latency-range variants and excludes operational-status language. **D.5** covers external CSS/JS (project-authored only). **D.2** covers canonical token definition files (GDS-1 scope — `tokens.css`, `roua-v7.css`, `roua-v7-patch.css` only). **Root-fix priority:** `tokens.css` (D.2 + D.5) is the highest-leverage single fix in the entire audit.

---

*End of ROUA Product Family Consolidation Spec — v7.*
*This document is the acceptance contract for all subsequent page audits and edits.*
*30-page cumulative audit complete (Delta 01–30). No D.15+. Ready for Phase B dependency impact analysis and Phase C root-first repair execution.*

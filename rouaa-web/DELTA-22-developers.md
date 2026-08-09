# Delta Report 22 — `developers.html` vs Product Family Consolidation Spec v6

> **Status:** Developers / Engineering integration portal test. Tests Spec v6 against a developer-facing integration page that sits alongside (but distinct from) the Developer Platform product page.
> **Audited file:** `/home/z/my-project/rouaa-corporate/rouaa-web/developers.html` (754 lines)
> **Reference:** `PRODUCT-FAMILY-CONSOLIDATION-SPEC.md` v6 (commit `d60ec70`)
> **Method:** No code modification. Full cumulative audit across ALL implementation layers (HTML + inline styles + inline `<style>` block + inline `<script>` block + JS content strings + content claims).
> **Acceptance Verdict:** **FAIL** — 4 confirmed defect types (D.2 × 3, D.7 × 1, D.8 × 2, D.9 × 4, D.11 × 9) + 1 dead-CSS-block sub-issue (D.1 variant).

---

## PART 0 — DEVELOPERS PAGE'S ACTUAL INSTITUTIONAL FUNCTION

Developers is an **Engineering Integration Portal** — it documents how engineering teams integrate with ROUA's API, SDK, and evidence access patterns. Its function is explicitly distinguished from the Developer Platform product page (`developer-intelligence.html`): "Developer Platform is what you buy. This page is how you integrate." (line 296)

The page's defining claim — "This page is for the engineers who will build the integration, not the buyer who will sign the contract." (line 280) — positions it as the **engineering reference page**: institutions that have already engaged ROUA can onboard their engineering teams to this page for technical integration details.

### Inferred UX Test for Developers

**Can the engineering team quickly understand the integration surfaces (REST/Streaming/SDK), authentication model, evidence access patterns, and deployment options — and request API access through institutional onboarding (not self-serve)?**

Chain: `Hero (how developers integrate) → Scope (this page vs Developer Platform) → Integration Overview (3 surfaces) → Authentication (3 cards) → API Surface (7 endpoints) → Evidence Access (4 patterns) → Example Request/Response (illustrative) → Integration Architecture (6 cards) → API Access (onboarding) → Enterprise Integration (4 cards) → CTA`

### Page Structure (11 sections)

1. **Hero** — "How developers integrate with ROUA" — with 2 CTAs (Request API Access / View Integration Architecture)
2. **Scope: Two Pages, Two Jobs** — explicit distinction: Developer Platform = what you buy; Developers = how you integrate
3. **Integration Overview** — 3 surfaces: REST API (representative) / Streaming WebSocket (integration roadmap) / SDK + Components (integration roadmap)
4. **Authentication** — 3 cards: Scoped API Keys / TLS + Bearer Token / Per-Request Audit
5. **API Surface / Endpoints** — 7 representative endpoints: GET /v1/sources, GET /v1/sources/{id}/documents, GET /v1/facts, GET /v1/evidence/{id}, POST /v1/intelligence/investment/brief, POST /v1/intelligence/risk/scan, WS /v1/stream/events
6. **Evidence / Provenance Access** — 4 cards: Source Anchors / Confidence Signals / Derivation Trace / Evidence Chain Pull
7. **Example Request/Response** — illustrative curl + JSON response with `extraction_confidence: 0.98` field
8. **Integration Architecture** — 6 cards: Behind Your Stack / Versioned Retrieval / Typed SDK (planned) / Embeddable Components / Private Deployment / Observable
9. **API Access** — onboarding process (not self-serve): 6-step structured onboarding list
10. **Enterprise Integration** — 4 cards: Private Deployment / Dedicated Source Tiers / Your Audit Trail / White-Label Presentation
11. **CTA** — Ready to integrate? Request API Access + 3 cross-nav links

---

## PART 1 — STRUCTURAL FACTS

### 1.1 CSS / JS Stack

| Component | Loaded | Notes |
|---|---|---|
| `roua-v7.css` | ✓ | Canonical design system |
| `roua-v7-patch.css` | ✓ | Patch layer |
| `styles.css` | ✗ NOT loaded | ✓ |
| **Inline `<style>` block** | ✓ PRESENT (lines 16–168, ~152 lines) | Defines accessibility utilities (.skip-link, .mono-label, .text-gold, .text-mute, .text-dim, .small, .mb-3, .mb-6), section utilities (.section-centered, .section-tag, .section-h, .section-lead), button helpers (.btn-lg, .btn-link), reveal-on-scroll (.reveal, .reveal.visible), hero (.hero-pa*), bridge logic, arch tree, suite-based layout, buying logic, powered-by strip, CTA, AND **developer-portal extensions** (.dev-scope, .dev-endpoints, .dev-code, .dev-access). **Mostly LIVE** — but contains a **dead sub-block: `.tree-visual`, `.tree-lines`, `.tree-line`, `.tree-line-icon`, `.tree-line-name`, `.tree-line-count`, `.tree-products` (lines 70–78)** which the comment on line 69 explicitly marks "(legacy, unused)". Body grep confirms zero usage of these classes. This is a **D.1 variant** — a dead sub-block inside an otherwise live `<style>` block. |
| `main.js` | ✓ | Nav behavior |
| `design-system/roua-v7.js` | ✓ | v7 enhancements |
| **Inline `<script>` block** | ✓ PRESENT (lines 738–748) | IntersectionObserver for `.reveal` class — adds `.visible` on intersection. No content strings, no forbidden phrases, no timing claims. CLEAN. |
| **External JS data files** | ✗ ABSENT | No products.js / catalog-data.js etc. — D.14 N/A |

### 1.2 Token Usage

| Token Family | Usage | Verdict |
|---|---|---|
| `--roua-*` aliases | Extensive use (text-primary, text-secondary, text-muted, surface, surface-border, bg-primary, bg-secondary, accent, accent-subtle, accent-border, border, radius-sm, radius-md, radius-xl, radius-full, transition-base, transition-slow) | ✓ Correct — broad token vocabulary |
| `var(--gold)` direct (D.6) | **0 instances** | ✓ **D.6 absent** — sixth page with zero D.6 |
| `rgba(201, 162, 39, ...)` (OLD gold, D.2) | **3 instances** | ✗ **D.2 PRESENT** — see details below |
| Raw hex values (D.7) | **1 instance** of `#080B12` (line 7, theme-color meta) | ⚠ **D.7 REVIEW** — `#080B12` is a near-match to the deprecated `#0B0F18`/`#0A0E1A` family from VISUAL-IDENTITY-SYSTEM.md. It is NOT an exact match to any deprecated hex in the current D.7 list, but it IS the same dark-navy family. Strict interpretation: D.7 violation (deprecated family). Lenient interpretation: D.11 violation (non-canonical raw hex not in the token system). Either way, it's a raw hex that should use a token (`var(--roua-bg-primary)` or similar). |
| Non-canonical hex (D.11) | **9 instances** (excluding the theme-color #080B12 already counted as D.7) | ✗ **D.11 PRESENT** — see details below |

**Token verdict: FAIL.** Zero D.6 — but **3 D.2 + 1 D.7 (or D.11 variant) + 9 D.11** violations.

### 1.3 Page Structure

```
Skip-link (line 174)
Navigation (lines 176–263)
<main id="main"> (line 265)
1. Hero — .hero-pa (lines 267–288)
2. Scope: Two Pages, Two Jobs — .dev-scope (lines 290–324)
3. Integration Overview — 3 .why-card (lines 326–352)
4. Authentication — 3 .why-card (lines 354–380)
5. API Surface / Endpoints — 7 .dev-endpoint (lines 382–454)
6. Evidence / Provenance Access — 4 .why-card (lines 456–487)
7. Example Request/Response — .dev-code (lines 489–549)
8. Integration Architecture — 6 .why-card (lines 551–595)
9. API Access — .dev-access (lines 597–628)
10. Enterprise Integration — 4 .why-card (lines 630–664)
11. CTA — .cta-final (lines 666–679)
</main> (line 681)
Footer (lines 683–736)
Inline <script> IntersectionObserver (lines 738–748)
main.js (line 750)
roua-v7.js (line 752)
```

- `<section>` count: **11**
- `<div>` balance: 199 / 199 ✓ PASS
- `<section>` balance: 11 / 11 ✓ PASS
- HTML comment balance: 13 / 13 ✓ PASS

### 1.4 HTML Integrity — ALL PASS

| Check | Result |
|---|---|
| `<div>` balance | 199 / 199 ✓ PASS |
| `<section>` balance | 11 / 11 ✓ PASS |
| HTML comment balance | 13 / 13 ✓ PASS |
| Broken internal anchors | None ✓ (`href="#main"` → `id="main"` ✓; `href="#access"` → `id="access"` ✓; `href="#architecture"` → `id="architecture"` ✓) |
| Dead `<style>` block (D.1) | ⚠ **PARTIAL** — inline `<style>` is mostly LIVE, but contains a dead sub-block (`.tree-*` classes, lines 70–78) explicitly marked "(legacy, unused)" in the comment on line 69. Body grep confirms zero usage. |
| Malformed comment (D.3) | ✗ ABSENT |
| Skip-link accessibility | ✓ PRESENT (line 174) — first audited page with skip-link |

### 1.5 Unique Structural Elements

- **Active nav state** on Developers (line 256) — correct (Developers is a top-level nav link, not under a dropdown)
- **Skip-link** (line 174) — `<a href="#main" class="skip-link">Skip to main content</a>` — **first audited page with skip-link accessibility**. Positive accessibility contribution.
- **`<main id="main">` wrapper** (lines 265–681) — first audited page using semantic `<main>` landmark. Positive accessibility contribution.
- **Scope distinction** (lines 290–324) — explicit "Two Pages, Two Jobs" framing distinguishing Developers (how you integrate) from Developer Platform (what you buy). **Unique scope-disambiguation pattern** — no other audited page distinguishes itself from a sibling product page this explicitly.
- **3 integration surfaces with status badges** (lines 334–350) — REST API (representative) / Streaming WebSocket (integration roadmap) / SDK + Components (integration roadmap). Honest status disclosure per surface.
- **7 representative endpoints** (lines 390–447) — REST/POST/WS methods color-coded via `.dev-method.get/post/ws` classes. Each endpoint has scope identifier. Explicit disclaimer (line 388): "The endpoints below are representative and illustrative — not a production API contract."
- **Illustrative API response** (lines 511–541) — synthetic JSON with `extraction_confidence: 0.98` field, `validation_gates_passed: ["source_tier", "extraction_confidence", "cross_source"]`. Explicit disclaimer (line 495): "Illustrative example. The response below is synthetic — field names, IDs, and values are representative, not production records."
- **6-step onboarding list** (lines 610–617) — explicit "API access is not a sign-up form" framing. Anti-self-serve discipline.
- **Inline IntersectionObserver script** (lines 738–748) — reveal-on-scroll behavior with `prefers-reduced-motion` fallback already handled in CSS (line 43). CLEAN inline script — no content strings, no forbidden phrases.
- **Honest "integration roadmap" disclosure** — Streaming and SDK both marked "integration roadmap" (lines 342, 347) — institutions know what is available today vs what is planned.

---

## PART 2 — ACCEPTANCE CONTRACT EVALUATION (Spec v6)

### Layer 1 — Canonical Baseline

#### 1.1 Token System — **FAIL (D.2 + D.7 + D.11)**

Zero D.6 — sixth page with fully clean direct-token usage. **But 3 D.2 + 1 D.7 + 9 D.11 violations**.

**D.2 violations (3 instances, all in inline `<style>` block):**

| # | Line | Context | Exact RGBA |
|---|---|---|---|
| 1 | 78 | `.tree-products` border (DEAD CSS — `.tree-products` is in the unused `.tree-*` sub-block) | `border: 1px solid rgba(201, 162, 39, 0.3)` |
| 2 | 132 | `.dev-scope` background gradient | `linear-gradient(180deg, rgba(201,162,39,0.05), rgba(201,162,39,0.01))` |
| 3 | 146 | `.dev-method.ws` background | `background: rgba(201,162,39,0.12)` |

All 3 should use canonical `rgba(227, 180, 90, X)`.

**D.7 violation (1 instance):**

| Line | Context | Hex | Classification |
|---|---|---|---|
| 7 | `<meta name="theme-color" content="#080B12">` | `#080B12` | ⚠ **D.7 REVIEW** — `#080B12` is in the deprecated dark-navy family from VISUAL-IDENTITY-SYSTEM.md (`#0B0F18`, `#0A0E1A`). It is NOT an exact match to any hex in the current D.7 list, but it IS the same family. Strict interpretation: D.7 violation (deprecated family). Lenient interpretation: D.11 violation (non-canonical raw hex). Either way, should use a token — though `<meta name="theme-color">` cannot reference a CSS variable, so this requires either a hardcoded canonical hex (e.g., `#080B12` → keep, since it's a meta tag outside the CSS token system) or alignment with the canonical dark-navy value used elsewhere. **Borderline case** — flagged for team decision. |

**D.11 violations (9 instances, all in inline `<style>` block):**

| # | Line | Context | Hex | Canonical replacement |
|---|---|---|---|---|
| 1 | 84 | `.arch-branch.b-media` color | `#4A90D9` | `var(--roua-blue)` (if defined) |
| 2 | 85 | `.arch-branch.b-trading` color | `#2DBA8E` | `var(--roua-green)` (if defined) |
| 3 | 87 | `.arch-branch.b-risk` color | `#E5484D` | `var(--roua-red)` (if defined) |
| 4 | 88 | `.arch-branch.b-dev` color | `#F5A623` | `var(--roua-amber)` (if defined) |
| 5 | 144 | `.dev-method.get` color | `#2DBA8E` | `var(--roua-green)` |
| 6 | 145 | `.dev-method.post` color | `#4A90D9` | `var(--roua-blue)` |
| 7 | 151 | `.dev-code` background | `#0a0e1a` | `var(--roua-bg-primary)` or `var(--roua-bg-tertiary)` |
| 8 | 154 | `.dev-code pre` color | `#c4cad6` | `var(--roua-text-secondary)` |
| 9 | 155–159 | `.dev-code .k/.s/.c/.p/.n` syntax-highlighting colors | `#ff79c6`, `#f1fa8c`, `#6272a4`, `#8be9fd` | These are Dracula theme syntax-highlighting colors — **deliberate non-token hex for code syntax highlighting**. This is a special case: code syntax highlighting traditionally uses fixed color schemes (Dracula, Solarized, Monokai) that are NOT part of the design token system. **REVIEW** — team decision: should code syntax highlighting use design tokens (probably not — would break readability conventions) or remain as fixed hex (current state)? |

**Note on `.arch-branch.b-*` classes (lines 84–88):** Body grep confirms these classes are NEVER used in the page body (no `class="arch-branch b-media"` etc.). They are part of the dead sub-block — `.arch-branch` IS used (line 81 defines it), but the `b-media/b-trading/b-research/b-risk/b-dev` modifier classes are not. So lines 84–88 are dead CSS, similar to the `.tree-*` dead sub-block.

**Updated dead-CSS inventory:**
- Lines 70–78: `.tree-*` classes (7 classes, comment line 69 marks "(legacy, unused)")
- Lines 84–88: `.arch-branch.b-*` modifier classes (5 classes, body grep confirms zero usage)

**Total dead CSS in inline `<style>`: 12 classes across 15 lines.** This is a D.1 variant — dead sub-blocks inside an otherwise live `<style>`.

#### 1.2 Container & Layout — **PASS**
#### 1.3 Navigation — **PASS** (active nav on Developers top-level link, 6-link Products, 7-link Solutions, 4-link Experience, mobile hamburger)
#### 1.4 Buttons — **PASS**
#### 1.5 Footer — **PASS** (1 brand + 5 footer-col = 6 total, no Channels column)
#### 1.6 Card Hierarchy — **PASS** (uses `.why-card`, `.why-grid`, `.dev-scope`, `.dev-endpoint`, `.dev-code`, `.dev-access`, `.cta-final`, `.section-tag`, `.section-h`, `.section-lead` — all canonical v7 components)
#### 1.7 Motion — **PASS** (zero ambient motion — only reveal-on-scroll via IntersectionObserver, with `prefers-reduced-motion` fallback in CSS line 43)
#### 1.8 Typography — **PASS**

#### 1.9 Trust Grammar (Forbidden Phrases)

| Phrase | Count | Verdict |
|---|---|---|
| "within seconds" / "in seconds" | 0 | ✓ PASS |
| **"real-time" / "real time" (D.8)** | **2 instances** (lines 343, 443) | ✗ **FAIL** — see analysis below |
| "instantly" / "instant" | 0 | ✓ PASS |
| "every claim" | 0 | ✓ PASS |
| "audit-ready" / "Audit-Ready" / "Audit Ready" (D.4) | 0 | ✓ PASS |
| "Trust Promise" | 0 | ✓ PASS |
| "Provenance Immutability" | 0 | ✓ PASS |
| "confidence score" / "confidence scored" (D.9 FORBID) | 0 | ✓ PASS |
| **"Confidence Scoring" (D.9 REVIEW leans FORBID)** | **0 instances** | ✓ PASS |
| **"Extraction Confidence" (D.9 REVIEW)** | **4 instances** (lines 338, 411, 435, 473) | ⚠ **REVIEW — 2 lean FORBID, 2 acceptable** — see analysis below |
| **"confidence scores" (D.9 FORBID variant — plural)** | **1 instance** (line 435) | ✗ **FAIL** — see analysis below |
| "SOC 2" / "ISO 27001" | 0 | ✓ PASS |
| "24/7" | 0 | ✓ PASS |
| "continuously monitored" / "monitored continuously" | 0 | ✓ PASS |
| Competitor naming (Bloomberg / Reuters / Market Terminals / FactSet / Refinitiv) | 0 | ✓ PASS |
| "VERIFIED INTELLIGENCE OBJECT" / "verified Intelligence Object" (FORBID + variant) | 0 | ✓ PASS |
| "live deployment" / "live workflows" (status-truth language) | 2 (lines 343, 612) | ✓ ACCEPTABLE — per Delta 20 clarification, status-truth language is NOT D.8 |

**D.8 violation analysis (2 instances of "real-time"):**

| Line | Text | Context | Classification |
|---|---|---|---|
| 343 | "Real-time push of events as they are detected and validated — new source publications, fact extractions, risk alerts, intelligence updates. For dashboards, alerts, and live workflows that must react as the registry moves." | Streaming (WebSocket) surface description (Integration Overview section) | ✗ **D.8 VIOLATION** — "Real-time push of events" is a timing/freshness claim. The Spec D.8 rule forbids "real-time" / "real time" as timing claims. WebSocket streaming does push events as they happen, but the phrase "real-time" is the forbidden pattern. Should be replaced with "event push as detected and validated" or "push delivery of events as they are detected" or "streaming push of events as detected and validated". Note: the card is already marked "integration roadmap" (line 342) — so the streaming surface is NOT yet operational, making the "real-time" claim even more problematic (timing claim for a non-operational surface). |
| 443 | "WebSocket subscription for real-time event pushes — new source publications, fact extractions, risk alerts." | /v1/stream/events endpoint description (API Surface section) | ✗ **D.8 VIOLATION** — "real-time event pushes" is the same forbidden pattern. Should be replaced with "WebSocket subscription for event pushes as detected and validated" or "streaming event pushes". |

**D.8 verdict: 2 confirmed violations.** Both describe the WebSocket streaming surface using "real-time" as a timing claim. The page already uses the canonical alternative phrasing ("as they are detected and validated" on line 343, "as detected" implicit on line 443) — the fix is to remove "real-time" and let the existing descriptive phrasing carry the meaning.

**D.9 "Extraction Confidence" analysis (4 instances):**

| Line | Text | Context | Classification |
|---|---|---|---|
| 338 | "Every response carries provenance: source document, page, paragraph, extraction confidence." | REST API surface description (Integration Overview) | ⚠ **REVIEW leans FORBID** — describes extraction confidence as a capability (what every response carries). Could be replaced with "extraction signals" or "extraction quality" to align with Methodology canonical phrasing. |
| 411 | "Each fact carries source document, page, paragraph, extraction confidence, and validation status." | /v1/facts endpoint description (API Surface) | ⚠ **REVIEW leans FORBID** — describes extraction confidence as a fact attribute (capability description). Same replacement path. |
| 435 | "Run a Risk Intelligence scan against a portfolio or exposure set. Returns flagged risks with source citations and confidence scores." | /v1/intelligence/risk/scan endpoint description (API Surface) | ✗ **FAIL — D.9 FORBID variant** — "confidence scores" (plural) is a variant of "confidence score" (D.9 FORBID). The Spec D.9 FORBID list includes "confidence score" / "confidence scored" — the plural "confidence scores" is a concept-based variant. Should be replaced with "confidence signals" or "confidence metadata". |
| 473 | "Extraction confidence, source trust tier, and validation status travel with every fact." | Confidence Signals card description (Evidence Access section) | ⚠ **REVIEW leans acceptable** — this is the "Confidence Signals" card (line 472 H4 title), and the body lists "extraction confidence" as one of the signals. Descriptive use within a confidence-signals context. Leans acceptable but could be replaced for consistency. |

**D.9 verdict: 1 confirmed FORBID variant (line 435 "confidence scores") + 2 REVIEW leaning FORBID (lines 338, 411) + 1 REVIEW leaning acceptable (line 473).**

Additionally, the **illustrative API response** (lines 511–541) contains:
- Line 530: `"extraction_confidence": 0.98` — JSON field name. This is **acceptable** because (a) it's inside an explicitly illustrative JSON example (line 495 disclaimer: "Illustrative example. The response below is synthetic"), and (b) it's a JSON field name (snake_case identifier), not a marketing claim. The page marks it illustrative.
- Line 538: `"validation_gates_passed": ["source_tier", "extraction_confidence", "cross_source"]` — JSON array values. Same classification: acceptable illustrative JSON.

#### 1.10 Taxonomy (Full Content Scan)

| Old term | Count | Context | Verdict |
|---|---|---|---|
| "Trading Intelligence" (alone, as product/page name) | 0 | — | ✓ PASS |
| "Institutional Intelligence" (alone, as product/page name) | 0 | — | ✓ PASS |
| "Market & Trading Intelligence" | 2 (lines 191, 695) | Nav + footer | ✓ PASS — canonical product name (per Spec taxonomy, NOT D.10) |
| "institutional intelligence products" (lowercase) | 2 (lines 689, 733) | Footer brand description + copyright tagline | ✓ PASS — descriptive adjective use, NOT product name (per v5: descriptive = NOT D.10) |
| "Developer APIs" | 0 | — | ✓ PASS |
| "Risk Intelligence scan" (line 435) | 1 | Endpoint description | ✓ PASS — descriptive adjective use ("Risk Intelligence" modifying "scan"), NOT product name |
| "Investment Intelligence brief" (line 426, 500) | 2 | Endpoint path + curl example | ✓ PASS — descriptive adjective use, NOT product name |

**Layer 1.10 verdict: PASS** — Zero D.10.

### Layer 1 Overall Verdict: **FAIL**

5 confirmed/review-level issues:
1. D.2 violation (3 instances, lines 78, 132, 146) — old-gold `rgba(201,162,39,...)` in inline `<style>` block
2. D.7/D.11 borderline (1 instance, line 7) — `#080B12` in `<meta name="theme-color">` — deprecated dark-navy family
3. D.8 violation (2 instances, lines 343, 443) — "real-time" as timing claim for WebSocket streaming surface
4. D.9 FORBID variant (1 instance, line 435) — "confidence scores" (plural) in Risk scan endpoint description
5. D.9 REVIEW leaning FORBID (2 instances, lines 338, 411) — "extraction confidence" as capability description
6. D.11 violation (9 instances, lines 84, 85, 87, 88, 144, 145, 151, 154, 155–159) — raw hex in inline `<style>` block
7. D.1 variant — dead CSS sub-blocks (`.tree-*` lines 70–78, `.arch-branch.b-*` lines 84–88) inside otherwise live `<style>`

---

### Layer 5 — Do-Not-Touch Rules — **PASS**

Developers is NOT forced into Product, Platform, Explorer, Architecture, or Solutions grammar. It has its own engineering-integration structure (Hero → Scope → Integration Overview → Authentication → API Surface → Evidence Access → Example → Architecture → Access → Enterprise → CTA). Correct adaptation — the page explicitly distinguishes itself from Developer Platform product page (line 296: "Developer Platform is what you buy. This page is how you integrate.").

### Layer 6 — Developers-Specific Rules

No Spec v6 Developers-specific UX test. Recommend adding:
`Hero → Scope (vs Developer Platform) → Integration Overview (3 surfaces) → Authentication (3 cards) → API Surface (7 endpoints) → Evidence Access (4 patterns) → Example (illustrative) → Architecture (6 cards) → API Access (onboarding) → Enterprise (4 cards) → CTA`

### UX / Engineering Integration Test

**Does the page help the engineering team understand the integration surfaces, authentication, evidence access patterns, and deployment options — and request API access through institutional onboarding?**

✓ **PASS** — The page follows a clear engineering-integration narrative:

1. **Hero:** "How developers integrate with ROUA" — positions page as engineering reference
2. **Scope:** Explicit "Two Pages, Two Jobs" distinction from Developer Platform product page
3. **3 Integration Surfaces:** REST (representative) / Streaming (roadmap) / SDK (roadmap) — honest status disclosure
4. **3 Authentication cards:** Scoped API Keys / TLS + Bearer / Per-Request Audit
5. **7 Representative endpoints:** REST/POST/WS methods, scope identifiers, explicit illustrative disclaimer
6. **4 Evidence Access patterns:** Source Anchors / Confidence Signals / Derivation Trace / Evidence Chain Pull
7. **Illustrative API response:** Synthetic JSON with extraction_confidence field, explicit "synthetic illustrative example" disclaimer
8. **6 Integration Architecture cards:** Behind Your Stack / Versioned Retrieval / Typed SDK (planned) / Embeddable Components / Private Deployment / Observable
9. **API Access:** 6-step structured onboarding (anti-self-serve)
10. **4 Enterprise Integration cards:** Private Deployment / Dedicated Source Tiers / Your Audit Trail / White-Label Presentation
11. **CTA:** Request API Access + 3 cross-nav links

The page successfully delivers engineering integration guidance with:
- Explicit scope disambiguation (vs Developer Platform product page)
- Honest "integration roadmap" disclosure for Streaming and SDK surfaces
- Explicit "representative and illustrative" disclaimers for endpoints and example response
- Anti-self-serve onboarding discipline ("API access is not a sign-up form")
- Skip-link accessibility (first audited page with this)
- Semantic `<main>` landmark (first audited page with this)
- Reveal-on-scroll with `prefers-reduced-motion` fallback

---

## PART 3 — LAYER 4 DEFECT SCAN (D.1–D.14)

| ID | Defect | Present? | Details |
|---|---|---|---|
| **D.1 (variant)** | **Dead `<style>` sub-block** | **⚠ PARTIAL** | Inline `<style>` (lines 16–168) is mostly LIVE, but contains 2 dead sub-blocks: `.tree-*` classes (lines 70–78, comment line 69 marks "(legacy, unused)") and `.arch-branch.b-*` modifier classes (lines 84–88, body grep confirms zero usage). Total: 12 dead classes across 15 lines. |
| **D.2** | **Old-gold `rgba(201, 162, 39, ...)`** | **✓ PRESENT (3)** | Lines 78, 132, 146 — all in inline `<style>` block |
| D.3 | Malformed HTML comment | ✗ ABSENT | 13/13 balanced, no nested |
| D.4 | "Audit-Ready" violation | ✗ ABSENT | 0 instances |
| D.5 | Competitor naming | ✗ ABSENT | |
| D.6 | `var(--gold)` mixing | ✗ ABSENT | 0 instances — 6th page with clean D.6 |
| **D.7** | **Deprecated raw hex family** | **⚠ REVIEW (1)** | Line 7 — `#080B12` in `<meta name="theme-color">`. Near-match to deprecated `#0B0F18`/`#0A0E1A` family. Borderline — flagged for team decision. |
| **D.8** | **"real time" / "real-time" timing claim** | **✓ PRESENT (2)** | Lines 343, 443 — both describe WebSocket streaming surface using "real-time" as timing claim |
| D.8 variant | "continuously monitored" / "24/7" | ✗ ABSENT | |
| D.9 (FORBID) | "confidence score/d" | ✗ ABSENT (exact) | 0 instances of exact singular "confidence score" |
| **D.9 (FORBID variant)** | **"confidence scores" (plural)** | **✓ PRESENT (1)** | Line 435 — "Returns flagged risks with source citations and confidence scores." Plural variant of FORBID phrase. |
| D.9 (REVIEW leans FORBID) | "Confidence Scoring" | ✗ ABSENT | 0 instances |
| **D.9 (REVIEW)** | **"Extraction Confidence"** | **⚠ 4 instances** | Lines 338, 411, 435, 473 — 2 lean FORBID (338, 411 — capability descriptions), 1 FORBID variant (435 — "confidence scores" plural), 1 leans acceptable (473 — descriptive use within Confidence Signals card) |
| D.9 (acceptable illustrative) | "extraction_confidence" in JSON | 2 instances (lines 530, 538) | ✓ ACCEPTABLE — JSON field name in explicitly illustrative synthetic example |
| D.10 | Old taxonomy as product name | ✗ ABSENT | "Risk Intelligence scan" and "Investment Intelligence brief" are descriptive adjective uses, NOT product names |
| **D.11** | **Non-canonical raw hex** | **✓ PRESENT (9)** | Lines 84, 85, 87, 88, 144, 145, 151, 154, 155–159 — raw hex in inline `<style>` for `.arch-branch.b-*` colors (dead CSS), `.dev-method` colors, `.dev-code` background, syntax-highlighting colors |
| D.12 | No direct source links | N/A | Developers is not an Explorer |
| D.13 | "24/7" timing claim | ✗ ABSENT | |
| D.14 | Timing claims in JS data files | ✗ ABSENT | No external data JS files; inline IntersectionObserver script is CLEAN (no content strings) |

**No D.15+ new defect types found.** Spec v6 sufficient for Developers page.

---

## PART 4 — ACCEPTANCE VERDICT

## **FAIL**

Six confirmed/review-level issues:

1. **D.1 variant** — dead CSS sub-blocks inside live inline `<style>` (`.tree-*` lines 70–78, `.arch-branch.b-*` lines 84–88). 12 dead classes across 15 lines.
2. **D.2 violation** (3 instances, lines 78, 132, 146) — old-gold `rgba(201,162,39,...)` in inline `<style>` block
3. **D.7/D.11 borderline** (1 instance, line 7) — `#080B12` in `<meta name="theme-color">` — deprecated dark-navy family
4. **D.8 violation** (2 instances, lines 343, 443) — "real-time" as timing claim for WebSocket streaming surface. Page already uses canonical alternative phrasing ("as they are detected and validated") — fix is to remove "real-time" and let existing phrasing carry meaning
5. **D.9 FORBID variant** (1 instance, line 435) — "confidence scores" (plural) in Risk scan endpoint description
6. **D.9 REVIEW leaning FORBID** (2 instances, lines 338, 411) — "extraction confidence" as capability description
7. **D.11 violation** (9 instances) — raw hex in inline `<style>` block. Includes a special case: `.dev-code .k/.s/.c/.p/.n` syntax-highlighting colors (lines 155–159) are Dracula theme colors — deliberate non-token hex for code syntax highlighting. Team decision required.

### What's CLEAN

- ✓ Zero D.3, D.4, D.5, D.6, D.10, D.13, D.14
- ✓ Zero D.6 — **sixth page with fully clean direct-token usage**
- ✓ Zero D.9 FORBID exact singular ("confidence score" / "confidence scored")
- ✓ Zero "Confidence Scoring" (D.9 REVIEW leans FORBID)
- ✓ D.9 "extraction_confidence" in JSON example (lines 530, 538) — ACCEPTABLE (illustrative synthetic JSON field name)
- ✓ All other forbidden phrases (within seconds, instantly, every claim, VERIFIED INTELLIGENCE OBJECT, Trust Promise, Provenance Immutability, SOC 2, ISO 27001, audit-ready, continuously monitored, 24/7, competitor names) absent
- ✓ HTML integrity ALL PASS (199/199 divs, 11/11 sections, 13/13 comments)
- ✓ Active nav on Developers top-level link (correct)
- ✓ No external JS data files (D.14 N/A)
- ✓ Inline `<script>` block (IntersectionObserver) is CLEAN — no content strings, no forbidden phrases
- ✓ No ambient motion (only reveal-on-scroll with `prefers-reduced-motion` fallback)
- ✓ **Skip-link accessibility** (line 174) — first audited page with skip-link
- ✓ **Semantic `<main>` landmark** (lines 265–681) — first audited page with `<main>` wrapper
- ✓ **Explicit scope disambiguation** (lines 290–324) — "Developer Platform is what you buy. This page is how you integrate." Unique pattern distinguishing Developers from Developer Platform product page
- ✓ **Honest "integration roadmap" disclosure** — Streaming and SDK surfaces marked "integration roadmap" (lines 342, 347)
- ✓ **Anti-self-serve onboarding discipline** — "API access is not a sign-up form" (line 608), 6-step structured onboarding (lines 610–617)
- ✓ **Illustrative API response disclaimers** — line 495: "Illustrative example. The response below is synthetic"; line 545: "synthetic illustrative example"
- ✓ **Representative endpoints disclaimer** — line 388: "The endpoints below are representative and illustrative — not a production API contract"
- ✓ "Governed Intelligence Object" / "Governed intelligence" used correctly (lines 278, 563) — not "Verified Intelligence Object"
- ✓ "Versioned Provenance" canonical term pattern respected (line 568 "Versioned Retrieval") — no "Provenance Immutability"
- ✓ "live deployment" (line 612) and "live workflows" (line 343) — ACCEPTABLE status-truth language per Delta 20 clarification

---

## PART 5 — CROSS-REPORT COMPARISON

| Aspect | Enterprise (12) | Platform (17) | Source Registry (18) | Methodology (19) | Infrastructure (20) | Product Experience (21) | **Developers (22)** |
|---|---|---|---|---|---|---|---|
| Lines | 515 | 718 | 551 | 552 | 596 | 1144 | **754** |
| Sections | 10 | 12 | 10 | 12 | 7 | 12 | **11** |
| Inline `<style>` | Absent | Present (~78 lines) | Absent | Absent | Absent | Present (~274 lines, LIVE) | **Present (~152 lines, mostly LIVE + 2 dead sub-blocks)** |
| D.1 | Absent | Absent | Absent | Absent | Absent | Absent | **Variant (dead sub-blocks)** |
| D.2 | 0 | 0 | 0 | 0 | 3 | 1 | **3** |
| D.4 | 0 | 0 | 0 | 1 | 0 | 0 | **0** |
| D.6 | 0 | 0 | 0 | 18 | 0 | 0 | **0** |
| D.7 | 0 | 0 | 0 | 0 | 0 | 0 | **1 (REVIEW)** |
| **D.8** | 0 | 0 | 0 (REVIEW) | 0 | 0 | 0 | **2 (confirmed)** |
| D.9 (FORBID variant) | 0 | 0 | 0 | 0 | 0 | 0 | **1 ("confidence scores" plural)** |
| D.9 (REVIEW) | 0 | 0 | 0 | 7 (2 FORBID) | 2 (both FORBID) | 1 (acceptable) | **4 (2 FORBID + 1 FORBID variant + 1 acceptable)** |
| D.10 | 0 | 0 | 0 | 0 | 0 | 2 | **0** |
| D.11 | 0 | 0 | 0 | 0 | 0 | 15 | **9** |
| Total defects | 0 | 0 | 0 (+1 REVIEW) | 2 + 2 REVIEW | 3 + 2 REVIEW | 18 + 4 FORBID-variant + 1 REVIEW | **15 + 1 D.7 REVIEW + 1 D.1 variant** |
| Verdict | **PASS** | **PASS** | **FAIL (borderline)** | **FAIL** | **FAIL** | **FAIL** | **FAIL** |

### Key Insights

1. **Developers is the FIRST audited page with confirmed D.8 violations** — 2 instances of "real-time" describing the WebSocket streaming surface (lines 343, 443). All previous audited pages either had zero D.8 or only REVIEW variants ("continuously monitored" / "monitored continuously"). Developers breaks the D.8 streak.
2. **D.8 context is significant**: The "real-time" claims describe a surface marked "integration roadmap" (line 342) — meaning the streaming surface is NOT yet operational. Making a "real-time" timing claim for a non-operational surface is doubly problematic: it's both a forbidden timing claim AND a claim about a feature that doesn't exist yet.
3. **D.9 FORBID variant "confidence scores" (plural)** — first appearance of the plural variant on the audited site. The Spec D.9 FORBID list has "confidence score" / "confidence scored" (singular). The plural "confidence scores" is a concept-based variant — classified as FORBID consistent with how D.4 case variants and "verified Intelligence Object" case variants are handled.
4. **D.1 variant — dead CSS sub-blocks inside live `<style>`** — first appearance of this pattern. Previous D.1 violations were entirely dead `<style>` blocks (lines 13–30 targeting non-existent IDs). Developers introduces a new D.1 pattern: a LIVE `<style>` block containing DEAD sub-blocks (`.tree-*` and `.arch-branch.b-*`). This is a D.1 variant, NOT a new D.15+ defect type — it's still dead CSS, just partially dead instead of fully dead.
5. **D.7 borderline — `#080B12` in `<meta name="theme-color">`** — first appearance of D.7 territory on an audited page. `#080B12` is in the deprecated dark-navy family but not an exact match to any hex in the current D.7 list. Borderline case for team decision. Note: `<meta name="theme-color">` cannot reference CSS variables, so the fix requires either keeping a hardcoded canonical hex or aligning with the canonical dark-navy value used elsewhere.
6. **D.11 special case — Dracula syntax-highlighting colors** (lines 155–159) — `.dev-code .k/.s/.c/.p/.n` use fixed hex colors (`#ff79c6`, `#f1fa8c`, `#6272a4`, `#8be9fd`) from the Dracula theme. This is a deliberate non-token use: code syntax highlighting traditionally uses fixed color schemes that are NOT part of the design token system. Team decision required: should code syntax highlighting use design tokens (probably not — would break readability conventions) or remain as fixed hex (current state)?
7. **Strongest accessibility contributions on the audited site** — skip-link (line 174) and semantic `<main>` landmark (lines 265–681). First audited page with either pattern. Positive Spec contribution: recommend adopting as canonical reference for all pages.
8. **Strongest scope-disambiguation pattern on the audited site** — "Two Pages, Two Jobs" (lines 290–324) explicitly distinguishes Developers from Developer Platform product page. No other audited page distinguishes itself from a sibling page this explicitly. Positive Spec contribution: recommend adopting as canonical reference for any page that could be confused with a sibling.
9. **Honest "integration roadmap" disclosure** — Streaming and SDK surfaces both marked "integration roadmap" (lines 342, 347). Institutions know what is available today vs what is planned. Positive accountability pattern.
10. **Anti-self-serve onboarding discipline** — "API access is not a sign-up form" (line 608), 6-step structured onboarding (lines 610–617). Reinforces institutional engagement model.
11. **No D.15+ new defect types found** — Spec v6 sufficient for Developers page.

---

## PART 6 — RECOMMENDED FIX

### Phase 1 — Token + Defect Repairs (~15 minutes)

| Step | Fix | Line(s) | Effort |
|---|---|---|---|
| 22.1 | **D.1 variant** — Remove dead CSS sub-blocks: `.tree-*` classes (lines 70–78) and `.arch-branch.b-*` modifier classes (lines 84–88). Body grep confirms zero usage. | 70–78, 84–88 | ~2 min |
| 22.2 | **D.2** — Replace `rgba(201, 162, 39, 0.3)` with `rgba(227, 180, 90, 0.3)` in `.tree-products` border (line 78). Note: this class is in the dead sub-block being removed in 22.1, so this fix may be moot if 22.1 is applied first. | 78 | ~1 min (moot if 22.1 applied) |
| 22.3 | **D.2** — Replace `rgba(201,162,39,0.05)` and `rgba(201,162,39,0.01)` with canonical new-gold in `.dev-scope` background gradient (line 132). | 132 | ~1 min |
| 22.4 | **D.2** — Replace `rgba(201,162,39,0.12)` with `rgba(227, 180, 90, 0.12)` in `.dev-method.ws` background (line 146). | 146 | ~1 min |
| 22.5 | **D.8** — Remove "Real-time" from line 343: "Real-time push of events as they are detected and validated" → "Push of events as they are detected and validated" (or "Event push as detected and validated"). The existing phrasing already carries the meaning. | 343 | ~1 min |
| 22.6 | **D.8** — Remove "real-time" from line 443: "WebSocket subscription for real-time event pushes" → "WebSocket subscription for event pushes as detected and validated" (or "WebSocket subscription for streaming event pushes"). | 443 | ~1 min |
| 22.7 | **D.9 FORBID variant** — Replace "confidence scores" with "confidence signals" on line 435: "Returns flagged risks with source citations and confidence signals." | 435 | ~1 min |
| 22.8 | **D.9 REVIEW leans FORBID** — If team decides "extraction confidence" as capability description leans FORBID, replace "extraction confidence" with "extraction signals" or "extraction quality" on lines 338 and 411. | 338, 411 | ~2 min |
| 22.9 | **D.11** — Replace raw hex in `.arch-branch.b-*` classes (lines 84, 85, 87, 88) with canonical tokens. Note: these classes are in the dead sub-block being removed in 22.1, so this fix may be moot if 22.1 is applied first. | 84–88 | ~1 min (moot if 22.1 applied) |
| 22.10 | **D.11** — Replace raw hex in `.dev-method.get` and `.dev-method.post` (lines 144, 145) with canonical tokens (`var(--roua-green)`, `var(--roua-blue)`). | 144, 145 | ~2 min |
| 22.11 | **D.11** — Replace `#0a0e1a` with `var(--roua-bg-primary)` or `var(--roua-bg-tertiary)` in `.dev-code` background (line 151). Replace `#c4cad6` with `var(--roua-text-secondary)` in `.dev-code pre` color (line 154). | 151, 154 | ~2 min |

### Phase 2 — Team Decisions (~5 minutes)

| Step | Fix | Line(s) | Effort |
|---|---|---|---|
| 22.12 | **D.7/D.11 borderline** — Team decision on `#080B12` in `<meta name="theme-color">` (line 7). Options: (a) keep as-is (meta tag outside CSS token system), (b) align with canonical dark-navy value used elsewhere, (c) replace with canonical hex from token system. | 7 | ~2 min |
| 22.13 | **D.11 special case** — Team decision on Dracula syntax-highlighting colors (lines 155–159). Options: (a) keep as fixed hex (code syntax highlighting convention), (b) replace with design tokens (would break readability conventions). Recommended: keep as fixed hex — code syntax highlighting is a special case. | 155–159 | ~2 min |
| 22.14 | **D.9 REVIEW leans acceptable** — Line 473 "Extraction confidence, source trust tier, and validation status travel with every fact." — team decision on whether to replace "Extraction confidence" with "Extraction signals" for consistency with lines 338/411 (if 22.8 applied). | 473 | ~1 min |

**Total Phase 1+P2 repair budget for Developers: ~20 minutes.**

If Phase 1 + Phase 2 are applied (with 22.13 deciding to keep Dracula colors), Developers moves from FAIL → PASS.

---

## PART 7 — SPEC v7 INPUT

Developers surfaces four items relevant for Spec v7 (do NOT implement now — record for cumulative review after all audits):

1. **D.9 plural variant clarification** — "confidence scores" (plural) is a variant of "confidence score" (D.9 FORBID). Spec v7 should clarify that the FORBID rule covers both singular and plural forms (concept-based, not number-based). Consistent with how D.4 case variants and "verified Intelligence Object" case variants are handled.
2. **D.1 variant — dead CSS sub-blocks inside live `<style>`** — Spec v7 should clarify that D.1 covers BOTH (a) entirely dead `<style>` blocks AND (b) dead sub-blocks inside otherwise live `<style>` blocks. The detection method is the same: grep for class definitions, then grep for class usage in body. If defined but not used, it's dead CSS.
3. **D.11 special case — code syntax highlighting** — Spec v7 should add a clarifying note: code syntax highlighting colors (Dracula, Solarized, Monokai themes) are a deliberate non-token use case. Team decision required: either (a) exempt code syntax highlighting from D.11 (recommended — code readability conventions), or (b) require design tokens for all hex including syntax highlighting.
4. **Accessibility patterns — skip-link and `<main>` landmark** — Developers is the first audited page with skip-link (line 174) and semantic `<main>` wrapper (lines 265–681). **Recommend adopting as canonical reference** in Spec v7 Layer 1 (Accessibility subsection) for all pages. Both patterns are accessibility best practices (WCAG 2.1 SC 2.4.1 Bypass Blocks).

No other Spec v7 changes triggered by Developers. No new defect types (D.15+).

---

*End of Delta Report 22. Developers FAILS — 3 D.2 + 1 D.7 REVIEW + 2 D.8 + 1 D.9 FORBID variant + 2 D.9 REVIEW + 9 D.11 + 1 D.1 variant. Despite the FAIL, the page introduces three positive Spec contributions: skip-link accessibility, semantic `<main>` landmark, and explicit scope-disambiguation pattern ("Two Pages, Two Jobs"). The D.8 violations are especially notable — first confirmed D.8 on the audited site, and the "real-time" claims describe a surface marked "integration roadmap" (non-operational). No D.15+ new defect types. Spec v6 sufficient. Total Phase 1+P2 repair budget: ~20 minutes.*

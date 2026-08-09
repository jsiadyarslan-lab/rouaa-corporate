# Delta Report 28 — `research-institute.html` vs Product Family Consolidation Spec v6

> **Status:** Company / Research Institute page test. Tests Spec v6 against a Company-category page that documents ROUA's internal research capability.
> **Audited file:** `/home/z/my-project/rouaa-corporate/rouaa-web/research-institute.html` (429 lines)
> **Reference:** `PRODUCT-FAMILY-CONSOLIDATION-SPEC.md` v6 (commit `d60ec70`)
> **Method:** No code modification. Full cumulative audit across ALL implementation layers (HTML + inline styles + JS content strings + content claims).
> **Acceptance Verdict:** **FAIL** — 2 confirmed defect types (D.2 × 1, D.9 REVIEW leans FORBID × 6) + 0 D.15+ new defect types.

---

## PART 0 — RESEARCH INSTITUTE'S ACTUAL INSTITUTIONAL FUNCTION

Research Institute is a **Company / Research Capability page** — it documents ROUA's internal research function: who does the research, why it exists, what programs are underway, and how external institutions can engage. Its function is explicitly NOT the Methodology page (which specifies how ROUA verifies sources and governs output) — the page explicitly distinguishes itself from Methodology (lines 110-119: "Institute vs Methodology — What's the Difference?").

The page's defining claim — "The research capability behind ROUA intelligence products." (line 97-98) — positions it as the **research-transparency page**: institutions can see what research problems ROUA is working on, what the Institute publishes, and how to collaborate.

### Inferred UX Test for Research Institute

**Can the institutional buyer quickly understand what research ROUA is conducting (current programs), what research areas are being explored, what the Institute publishes, and how to engage — while understanding the distinction between the Institute (capability) and Methodology (specification)?**

Chain: `Hero (research capability) → Institute vs Methodology separator → Institute Mission → Current Research Program (3 programs) → Research Areas (5 areas + Open) → Publication Types (4 types) → Collaborate (3 ways) → From Research to Platform (4 cards) → Research Advisory Structure (5 cards + Open) → CTA`

### Page Structure (10 sections)

1. **Page Hero** — "The research capability behind ROUA intelligence products"
2. **Institute vs Methodology Separator** — explicit distinction: Institute = capability (people, programs, publications); Methodology = specification (rules, tiers, validation logic)
3. **Institute Mission** — 3 cards: Open Methodology / Frameworks / Research Partnerships
4. **Current Research Program** — 3 strategic-channel items: Evidence Chain Specification v1.0 / Source Trust Model v1.0 / Governed AI Framework v1.0
5. **Research Areas** — 5 area cards (Source Verification / Evidence Architecture / Governance Models / Knowledge Graphs / Governed AI) + 1 Open Emerging Areas card
6. **Publication Types** — 4 cards: Methodology Papers / Reference Frameworks / Industry Reports / White Papers
7. **Collaborate** — 3 cards: Research Partnerships / Institutional Review / Research Fellows
8. **From Research to Platform** — 4 cards: Methodology / Architecture / Standards / Product Foundations
9. **Research Advisory Structure** — 5 cards (Former Regulators / Economists & Market Structure Experts / Financial Data Researchers / AI Governance Specialists / Information Scientists) + 1 Open Advisory Structure card
10. **CTA** — Discuss Research Collaboration + Review Methodology + Explore the Architecture

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
| `--roua-*` aliases | Extensive use (text-primary, text-secondary, text-muted, surface, bg-secondary, accent, accent-border, border-strong, radius-md, font-mono, leading-relaxed) | ✓ Correct — broad token vocabulary |
| `var(--gold)` direct (D.6) | **0 instances** | ✓ **D.6 absent** — 11th page with zero D.6 |
| `rgba(201, 162, 39, ...)` (OLD gold, D.2) | **1 instance** | ✗ **D.2 PRESENT** — see details below |
| Raw hex values (D.7) | **0 instances** | ✓ D.7 absent |
| Non-canonical hex (D.11) | **0 instances** | ✓ D.11 absent |

**Token verdict: FAIL (D.2 only).** Zero D.6, D.7, D.11 — but **1 D.2 violation** in inline gradient background.

### 1.3 Page Structure

```
Navigation (lines 18–91)
1. Page Hero — .page-hero (lines 93–104)
2. Institute vs Methodology Separator (lines 106–126)
3. Institute Mission — 3 .card (lines 128–152)
4. Current Research Program — 3 .strategic-channel-item (lines 154–191)
5. Research Areas — 5 .card + 1 Open card (lines 193–233)
6. Publication Types — 4 .card (lines 235–265)
7. Collaborate — 3 .card (lines 267–288)
8. From Research to Platform — 4 .card (lines 291–319)
9. Research Advisory Structure — 5 .card + 1 Open card (lines 321–356)
10. CTA (lines 358–370)
Footer (lines 372–425)
```

- `<section>` count: **10**
- `<div>` balance: 103 / 103 ✓ PASS
- `<section>` balance: 10 / 10 ✓ PASS
- HTML comment balance: 6 / 6 ✓ PASS

### 1.4 HTML Integrity — ALL PASS

| Check | Result |
|---|---|
| `<div>` balance | 103 / 103 ✓ PASS |
| `<section>` balance | 10 / 10 ✓ PASS |
| HTML comment balance | 6 / 6 ✓ PASS |
| Broken internal anchors | None ✓ (no `href="#..."` internal anchors; section IDs exist for reference, not anchor navigation) |
| Dead `<style>` block (D.1) | ✗ ABSENT |
| Malformed comment (D.3) | ✗ ABSENT |

### 1.5 Unique Structural Elements

- **Active nav state** on Company dropdown (line 71) — correct (Research Institute is under Company, line 79: `<a href="research-institute.html" class="nav-dropdown-link">Research Institute</a>`)
- **Institute vs Methodology separator** (lines 106–126) — explicit distinction between Institute (capability — people, programs, publications) and Methodology (specification — rules, tiers, validation logic). Unique disambiguation pattern — no other audited page distinguishes itself from Methodology this explicitly. Includes visual chain (line 122): "Research → Evidence → Intelligence Products → Institutional Decisions"
- **3 Current Research Programs** (lines 162–184) — Evidence Chain Specification v1.0 / Source Trust Model v1.0 / Governed AI Framework v1.0. Each with version number (v1.0) and descriptive paragraph.
- **5 Research Areas + 1 Open Emerging Areas card** (lines 200–231) — Source Verification / Evidence Architecture / Governance Models / Knowledge Graphs / Governed AI + Open Emerging Areas (dashed border, distinct visual). Same Open card pattern as Careers (Delta 27).
- **4 Publication Types** (lines 241–258) — Methodology Papers / Reference Frameworks / Industry Reports / White Papers.
- **3 Collaboration pathways** (lines 273–286) — Research Partnerships / Institutional Review / Research Fellows.
- **From Research to Platform 4-card pattern** (lines 299–316) — Methodology / Architecture / Standards / Product Foundations. Explicit "research becomes product foundation" framing.
- **Research Advisory Structure** (lines 329–354) — 5 advisory-profile cards (Former Regulators / Economists & Market Structure Experts / Financial Data Researchers / AI Governance Specialists / Information Scientists) + 1 Open Advisory Structure card. Honest "as the Institute develops" framing (line 352).
- **Honest maturation disclosure** (line 187): "Additional programs are in earlier stages... These will be added to the public program as they mature."
- **Honest advisory disclosure** (line 327): "The Institute is designed to incorporate external input as it develops. An advisory structure... is intended to provide independent review..."
- **Open review priority** (line 261): "The Institute prioritizes open review over speed of release — every publication undergoes internal research review before release."

---

## PART 2 — ACCEPTANCE CONTRACT EVALUATION (Spec v6)

### Layer 1 — Canonical Baseline

#### 1.1 Token System — **FAIL (D.2 only)**

Zero D.6, D.7, D.11 — 11th page with fully clean direct-token usage. **But 1 D.2 violation** in inline gradient background.

**D.2 violation (1 instance):**

| # | Line | Context | Exact RGBA |
|---|---|---|---|
| 1 | 109 | Institute vs Methodology separator card background gradient | `linear-gradient(180deg, rgba(201, 162, 39, 0.04), rgba(201, 162, 39, 0.01))` |

Should use canonical `rgba(227, 180, 90, X)`.

#### 1.2 Container & Layout — **PASS**
#### 1.3 Navigation — **PASS** (active nav on Company, 6-link Products, 7-link Solutions, 4-link Experience, mobile hamburger)
#### 1.4 Buttons — **PASS**
#### 1.5 Footer — **PASS** (1 brand + 5 footer-col = 6 total, no Channels column)
#### 1.6 Card Hierarchy — **PASS** (uses `.card`, `.strategic-channel-item`, `.eyebrow`, `.section-header`, `.cta-section`, `.cta-buttons` — all canonical v7 components)
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
| "confidence score" / "confidence scored" (D.9 FORBID exact) | 0 | ✓ PASS |
| **"Confidence Scoring" (D.9 REVIEW leans FORBID)** | **3 instances** (lines 214, 244, 302) | ⚠ **REVIEW leans FORBID** — see analysis below |
| **"Extraction Confidence" (D.9 REVIEW)** | **1 instance** (line 209, as "fact extraction confidence") | ⚠ **REVIEW leans FORBID** — see analysis below |
| **"scores confidence" / "score source confidence" (D.9 verb-form variants)** | **2 instances** (lines 118, 134) | ⚠ **REVIEW leans FORBID** — see analysis below |
| "SOC 2" / "ISO 27001" | 0 | ✓ PASS |
| "24/7" (D.13) | 0 | ✓ PASS |
| "continuously monitored" / "monitored continuously" | 0 | ✓ PASS |
| Competitor naming (D.5) | 0 | ✓ PASS |
| "VERIFIED INTELLIGENCE OBJECT" / "verified Intelligence Object" (FORBID + variant) | 0 | ✓ PASS |
| "confidence propagation" (lines 167, 181, 224) | 3 | ✓ ACCEPTABLE — different concept (how confidence propagates through evidence chain), NOT "confidence scoring" or "Extraction Confidence". Research term, not D.9. |

**D.9 analysis (6 instances total, all REVIEW leaning FORBID):**

| Line | Text | Context | Classification |
|---|---|---|---|
| 118 | "How ROUA actually verifies sources, constructs evidence chains, scores confidence, and governs output." | Institute vs Methodology separator — Methodology page description | ⚠ **REVIEW leans FORBID** — "scores confidence" (verb form) describes the act of scoring confidence as a Methodology capability. Per Spec D.9, "Confidence Scoring" as capability description leans FORBID. Verb form "scores confidence" is a concept-based variant. |
| 134 | "How do you score source confidence?" | Institute Mission paragraph — listing open research problems | ⚠ **REVIEW leans FORBID** — "score source confidence" (verb form) describes the research problem of scoring source confidence. While framed as a question (open problem), it still describes the capability concept. Leans FORBID. |
| 209 | "Provenance design, fact extraction confidence, paragraph-level linking, and the structural properties of defensible evidence." | Research Area 02 (Evidence Architecture) description | ⚠ **REVIEW leans FORBID** — "fact extraction confidence" is a variant of "Extraction Confidence" (with "fact" prefix). Listed as a research-area component (capability description), not illustrative. Leans FORBID. |
| 214 | "Validation rules, confidence scoring, source hierarchy, and audit controls — designed as architecture, not policy." | Research Area 03 (Governance Models) description | ⚠ **REVIEW leans FORBID** — "confidence scoring" listed as a governance component (capability description). Same pattern as Methodology (Delta 19), Infrastructure (Delta 20), Developers (Delta 22), Contact (Delta 26). |
| 244 | "How ROUA works — source hierarchy, confidence scoring, evidence chain construction, governance rules." | Publication Types — Methodology Papers description | ⚠ **REVIEW leans FORBID** — "confidence scoring" listed as a methodology topic (capability description). |
| 302 | "Rules for source verification, evidence construction, confidence scoring, and governance controls." | From Research to Platform — Methodology card description | ⚠ **REVIEW leans FORBID** — "confidence scoring" listed as a methodology rule (capability description). |

**D.9 verdict: 6 instances, all REVIEW leaning FORBID.** This is the **most D.9 instances on a single audited page** (vs. Methodology Delta 19 with 7 instances but 2 leaning FORBID + 5 acceptable/illustrative; Research Institute has 6 all leaning FORBID).

The pattern: Research Institute discusses confidence scoring as a research topic and methodology component in 6 locations. While it's natural for a research page to discuss this concept, the usage pattern (listing "confidence scoring" / "fact extraction confidence" / "scores confidence" as capabilities or research-area components) leans FORBID per Spec v6/v7 direction. The canonical replacement is "confidence signals" (Methodology canonical phrasing).

**Note:** "confidence propagation" (lines 167, 181, 224) is a DIFFERENT concept — how confidence values propagate through the evidence chain — and is NOT D.9. This is a research term describing a structural property, not a capability claim.

#### 1.10 Taxonomy (Full Content Scan) — **PASS**

| Term | Count | Context | Verdict |
|---|---|---|---|
| "Trading Intelligence" (standalone, as product/page name) | 0 | — | ✓ PASS |
| "Institutional Intelligence" (standalone, as product/page name) | 0 | — | ✓ PASS |
| "Market & Trading Intelligence" | 2 (lines 33, 384) | Nav + footer | ✓ PASS — canonical product name |
| "Investment Intelligence" | 2 (lines 31, 382) | Nav + footer | ✓ PASS — canonical product name |
| "Risk Intelligence" | 2 (lines 32, 383) | Nav + footer | ✓ PASS — canonical product name |
| "Media Intelligence" | 2 (lines 34, 385) | Nav + footer | ✓ PASS — canonical product name |
| "Developer Platform" | 2 (lines 35, 386) | Nav + footer | ✓ PASS — canonical product name |
| "Investment, Market, Risk, Media, and Trading" (shorthand list, line 134) | 1 | Institute Mission paragraph | ⚠ **REVIEW leans acceptable** — shorthand product list (same pattern as Contact Delta 26 line 123). "Trading" here is a short-form reference to "Market & Trading Intelligence". Leans acceptable as descriptive shorthand. |
| "institutional intelligence" (lowercase, descriptive, line 198) | 1 | Research Areas intro: "evidence-backed institutional intelligence" | ✓ PASS — descriptive adjective use |
| "institutional intelligence products" (lowercase, descriptive, line 378) | 1 | Footer brand description | ✓ PASS — descriptive adjective use |
| "Institutional Intelligence Products" (capitalized, footer copyright, line 422) | 1 | Footer copyright | ⚠ **REVIEW leans acceptable** — descriptive phrase "Institutional Intelligence Products Powered by Evidence Infrastructure", NOT standalone product name. Same pattern as Deltas 24, 25, 26, 27. Leans acceptable as descriptive. |
| "Developer APIs" | 0 | — | ✓ PASS |

**Layer 1.10 verdict: PASS** — Zero D.10 confirmed. 2 REVIEW items both leaning acceptable (shorthand product list + footer copyright phrase).

### Layer 1 Overall Verdict: **FAIL**

2 confirmed/review-level issues:
1. D.2 violation (1 instance, line 109) — old-gold `rgba(201,162,39,...)` in Institute vs Methodology separator gradient
2. D.9 REVIEW leans FORBID (6 instances, lines 118, 134, 209, 214, 244, 302) — "scores confidence" / "score source confidence" / "fact extraction confidence" / "confidence scoring" × 3 — most D.9 instances on a single audited page

---

### Layer 5 — Do-Not-Touch Rules — **PASS**

Research Institute is NOT forced into Product, Platform, Explorer, Architecture, Solution, or Developer grammar. It has its own research-page structure (Hero → Institute vs Methodology → Mission → Current Research → Research Areas → Publications → Collaborate → From Research to Platform → Advisory → CTA). Correct adaptation — the page explicitly distinguishes itself from Methodology (lines 110-119).

### Layer 6 — Research-Institute-Specific Rules

No Spec v6 Research-Institute-specific UX test. Recommend adding:
`Hero → Institute vs Methodology separator → Institute Mission → Current Research Program → Research Areas → Publication Types → Collaborate → From Research to Platform → Research Advisory Structure → CTA`

### UX / Research Transparency Test

**Does the page help the institutional buyer understand what research ROUA is conducting, what research areas are being explored, what the Institute publishes, and how to engage — while understanding the Institute vs Methodology distinction?**

✓ **PASS** — The page follows a clear research-transparency narrative:

1. **Hero:** "The research capability behind ROUA intelligence products" — positions Institute as internal research function
2. **Institute vs Methodology separator:** Explicit distinction — Institute = capability (people, programs, publications); Methodology = specification (rules, tiers, validation logic). Visual chain: Research → Evidence → Intelligence Products → Institutional Decisions
3. **3 Institute Mission cards:** Open Methodology / Frameworks / Research Partnerships
4. **3 Current Research Programs:** Evidence Chain Specification v1.0 / Source Trust Model v1.0 / Governed AI Framework v1.0 — with version numbers
5. **5 Research Areas + Open:** Source Verification / Evidence Architecture / Governance Models / Knowledge Graphs / Governed AI + Open Emerging Areas
6. **4 Publication Types:** Methodology Papers / Reference Frameworks / Industry Reports / White Papers
7. **3 Collaboration pathways:** Research Partnerships / Institutional Review / Research Fellows
8. **From Research to Platform:** 4-card pattern showing how research becomes product foundation (Methodology / Architecture / Standards / Product Foundations)
9. **Research Advisory Structure:** 5 advisory-profile cards + Open Advisory Structure card
10. **CTA:** Discuss Research Collaboration + Review Methodology + Explore the Architecture

The page successfully delivers research-transparency with:
- **Strongest Institute vs Methodology disambiguation on the audited site** (lines 106-126) — explicit distinction with visual chain
- **Honest maturation disclosure** (line 187): "Additional programs are in earlier stages... These will be added to the public program as they mature."
- **Honest advisory disclosure** (line 327): "The Institute is designed to incorporate external input as it develops"
- **Open review priority** (line 261): "The Institute prioritizes open review over speed of release"
- **Versioned research programs** (v1.0) — explicit version disclosure for each current program
- **Open Emerging Areas + Open Advisory Structure cards** — same dashed-border Open pattern as Careers (Delta 27)

---

## PART 3 — LAYER 4 DEFECT SCAN (D.1–D.14)

| ID | Defect | Present? | Details |
|---|---|---|---|
| D.1 | Dead `<style>` block | ✗ ABSENT | No `<style>` tag |
| D.1 variant | Dead CSS sub-blocks | N/A | No inline `<style>` at all |
| **D.2** | **Old-gold `rgba(201, 162, 39, ...)`** | **✓ PRESENT (1)** | Line 109 — Institute vs Methodology separator gradient background |
| D.3 | Malformed HTML comment | ✗ ABSENT | 6/6 balanced, no nested |
| D.4 | "Audit-Ready" violation | ✗ ABSENT | 0 instances |
| D.5 | Competitor naming | ✗ ABSENT | |
| D.6 | `var(--gold)` mixing | ✗ ABSENT | 0 instances — 11th page with clean D.6 |
| D.7 | Deprecated raw hex | ✗ ABSENT | |
| D.8 | "real time" timing claim | ✗ ABSENT | |
| D.8 variant | "continuously monitored" / "24/7" | ✗ ABSENT | |
| D.9 (FORBID exact) | "confidence score/d" | ✗ ABSENT | 0 instances |
| **D.9 (REVIEW leans FORBID)** | **"Confidence Scoring"** | **✓ PRESENT (3)** | Lines 214, 244, 302 — all capability descriptions |
| **D.9 (REVIEW leans FORBID)** | **"Extraction Confidence" (variant "fact extraction confidence")** | **✓ PRESENT (1)** | Line 209 — capability description |
| **D.9 (REVIEW leans FORBID)** | **"scores confidence" / "score source confidence" (verb-form variants)** | **✓ PRESENT (2)** | Lines 118, 134 — capability descriptions |
| D.9 (ACCEPTABLE) | "confidence propagation" | 3 instances (lines 167, 181, 224) | ✓ ACCEPTABLE — different concept (research term, not capability claim) |
| D.10 | Old taxonomy as product name | ✗ ABSENT (2 REVIEW leaning acceptable) | Zero confirmed. 2 REVIEW: shorthand product list (line 134) + footer copyright phrase (line 422) |
| D.11 | Non-canonical raw hex | ✗ ABSENT | |
| D.12 | No direct source links | N/A | Research Institute is not an Explorer |
| D.13 | "24/7" timing claim | ✗ ABSENT | |
| D.14 | Timing claims in JS data files | ✗ ABSENT | No external data JS files; no inline `<script>` content |
| (FORBID) | "every claim" | ✗ ABSENT | 0 instances |
| (FORBID variant) | "verified Intelligence Object" | ✗ ABSENT | 0 instances |

**No D.15+ new defect types found.** Spec v6 sufficient for Research Institute page.

---

## PART 4 — ACCEPTANCE VERDICT

## **FAIL**

Two confirmed/review-level issues:

1. **D.2 violation** (1 instance, line 109) — old-gold `rgba(201,162,39,...)` in Institute vs Methodology separator gradient
2. **D.9 REVIEW leans FORBID** (6 instances, lines 118, 134, 209, 214, 244, 302) — most D.9 instances on a single audited page. All are capability descriptions of confidence scoring / extraction confidence, not illustrative examples.

### What's CLEAN

- ✓ Zero D.1, D.1 variant, D.3, D.4, D.5, D.6, D.7, D.8, D.11, D.13, D.14
- ✓ Zero D.6 — **11th page with clean direct-token usage**
- ✓ Zero D.8 — no "real-time" / "within seconds" / "24/7" / "in minutes" timing claims
- ✓ Zero D.9 FORBID exact ("confidence score/d")
- ✓ Zero D.4, D.5, D.13 — no "audit-ready", no competitor naming, no "24/7"
- ✓ Zero "every claim" FORBID, zero "verified Intelligence Object" FORBID variant
- ✓ Zero "Trust Promise" / "Provenance Immutability" / "SOC 2" / "ISO 27001" / "continuously monitored"
- ✓ HTML integrity ALL PASS (103/103 divs, 10/10 sections, 6/6 comments)
- ✓ Active nav on Company (correct — Research Institute is under Company)
- ✓ No external JS data files (D.14 N/A)
- ✓ No inline `<script>` content (only `js` class add on line 4)
- ✓ No ambient motion (no canvas, no Three.js, no GSAP)
- ✓ **Strongest Institute vs Methodology disambiguation on the audited site** (lines 106-126) — explicit distinction with visual chain: Research → Evidence → Intelligence Products → Institutional Decisions
- ✓ **Versioned research programs** (v1.0) — explicit version disclosure for each current program (Evidence Chain Specification v1.0 / Source Trust Model v1.0 / Governed AI Framework v1.0)
- ✓ **Honest maturation disclosure** (line 187): "Additional programs are in earlier stages... These will be added to the public program as they mature."
- ✓ **Honest advisory disclosure** (line 327): "The Institute is designed to incorporate external input as it develops"
- ✓ **Open review priority** (line 261): "The Institute prioritizes open review over speed of release"
- ✓ **Open Emerging Areas + Open Advisory Structure cards** — same dashed-border Open pattern as Careers (Delta 27)
- ✓ "confidence propagation" (lines 167, 181, 224) is ACCEPTABLE — different concept (research term for how confidence values propagate through evidence chain), NOT D.9
- ✓ "Governed Intelligence Object" / "governed intelligence" pattern respected — no "Verified Intelligence Object"
- ✓ "Versioned Provenance" canonical term pattern respected — no "Provenance Immutability"

---

## PART 5 — CROSS-REPORT COMPARISON

| Aspect | Enterprise (12) | Platform (17) | Source Registry (18) | Methodology (19) | Infrastructure (20) | Product Experience (21) | Developers (22) | Trading Platform (23) | Financial Intelligence (24) | Financial Media (25) | Contact (26) | Careers (27) | **Research Institute (28)** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Lines | 515 | 718 | 551 | 552 | 596 | 1144 | 754 | 478 | 584 | 455 | 366 | 375 | **429** |
| Sections | 10 | 12 | 10 | 12 | 7 | 12 | 11 | 10 | 12 | 10 | 5 | 7 | **10** |
| Inline `<style>` | Absent | Present (~78) | Absent | Absent | Absent | Present (~274) | Present (~152, partial dead) | Absent | Absent | Absent | Absent | Absent | **Absent** |
| D.2 | 0 | 0 | 0 | 0 | 3 | 1 | 3 | 2 | 1 | 0 | 0 | 0 | **1** |
| D.4 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | **0** |
| D.5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | **0** |
| D.6 | 0 | 0 | 0 | 18 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | **0** |
| D.7 | 0 | 0 | 0 | 0 | 0 | 0 | 1 (REVIEW) | 0 | 0 | 0 | 0 | 0 | **0** |
| D.8 (exact) | 0 | 0 | 0 (REVIEW) | 0 | 0 | 0 | 2 | 0 | 0 | 1 | 0 | 0 | **0** |
| D.8 (variant) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 (+1 REVIEW) | 0 | 0 | **0** |
| **D.9 (any)** | 0 | 0 | 0 | 7 | 2 | 1 (acceptable) | 5 | 0 | 0 | 0 | 1 (REVIEW) | 0 | **6 (all REVIEW leans FORBID)** |
| D.10 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 6 | 6 | 1 | 1 | 0 (+ 1 REVIEW) | **0 (+ 2 REVIEW)** |
| D.11 | 0 | 0 | 0 | 0 | 0 | 15 | 9 | 0 | 0 | 0 | 0 | 0 | **0** |
| D.13 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | **0** |
| FORBID ("every claim") | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 4 | 0 | 0 | **0** |
| FORBID variant ("verified Intelligence Object") | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | **0** |
| Total defects | 0 | 0 | 0 (+1 REVIEW) | 2 + 2 REVIEW | 3 + 2 REVIEW | 18 + 4 + 1 | 15 + 1 + 1 | 8 + 2 REVIEW | 12 + 1 REVIEW | 7 + 1 REVIEW | 1 + 1 REVIEW (+ 2 REVIEW) | 0 (+ 1 REVIEW) | **1 + 6 REVIEW** |
| Verdict | **PASS** | **PASS** | **FAIL (borderline)** | **FAIL** | **FAIL** | **FAIL** | **FAIL** | **FAIL** | **FAIL** | **FAIL** | **FAIL** | **PASS** | **FAIL** |

### Key Insights

1. **Research Institute has the MOST D.9 instances on a single audited page** — 6 instances, all REVIEW leaning FORBID. Methodology (Delta 19) had 7 instances but mixed (2 leaning FORBID + 5 acceptable/illustrative). Research Institute has 6 all leaning FORBID — the highest concentration of FORBID-leaning D.9 on a single page. This is because the page discusses confidence scoring as a research topic and methodology component in 6 locations.
2. **D.9 verb-form variants — first appearance** — Research Institute introduces "scores confidence" (line 118) and "score source confidence" (line 134) as verb-form variants of "Confidence Scoring". Previous D.9 instances were noun forms ("Confidence Scoring", "Extraction Confidence"). The verb form "scores confidence" is a concept-based variant — describing the act of scoring confidence as a capability. Classified as REVIEW leans FORBID consistent with the noun-form handling.
3. **"fact extraction confidence" — variant of "Extraction Confidence"** — Line 209 uses "fact extraction confidence" (with "fact" prefix). This is a variant of "Extraction Confidence" — same concept, different word order. Classified as REVIEW leans FORBID consistent with the Spec D.9 variant handling.
4. **"confidence propagation" is NOT D.9** — Lines 167, 181, 224 use "confidence propagation" which is a DIFFERENT concept: how confidence values propagate through the evidence chain. This is a research term describing a structural property, not a capability claim about scoring confidence. ACCEPTABLE. This distinction is important — not every "confidence" + word combination is D.9.
5. **Strongest Institute vs Methodology disambiguation on the audited site** — Lines 106-126 explicitly distinguish Institute (capability) from Methodology (specification) with a visual chain. No other audited page distinguishes itself from Methodology this explicitly. Positive Spec contribution: recommend adopting as canonical reference for any page that could be confused with Methodology.
6. **Versioned research programs** — Each current research program has a version number (v1.0): Evidence Chain Specification v1.0 / Source Trust Model v1.0 / Governed AI Framework v1.0. This is the only audited page that versions its research artifacts explicitly. Positive Spec contribution: versioned disclosure is an accountability pattern.
7. **Honest maturation + advisory disclosure** — Two explicit "as it develops / as they mature" disclaimers (lines 187, 327). The page does not claim a mature research institute — it honestly discloses that programs are in earlier stages and advisory structure is developing. This is the strongest research-stage honesty on the audited site.
8. **Open review priority** — Line 261: "The Institute prioritizes open review over speed of release — every publication undergoes internal research review before release." This is the strongest anti-speed-over-quality framing on a research page.
9. **Open card pattern (dashed border) — recurring positive Spec contribution** — Research Institute uses the same dashed-border Open card pattern as Careers (Delta 27): Open Emerging Areas (line 226) + Open Advisory Structure (line 350). This pattern is becoming a canonical reference for "we welcome input beyond the listed categories" framing.
10. **No D.15+ new defect types found** — Spec v6 sufficient for Research Institute page.

---

## PART 6 — RECOMMENDED FIX

### Phase 1 — Token Repair (~1 minute)

| Step | Fix | Line(s) | Effort |
|---|---|---|---|
| 28.1 | **D.2** — Replace `rgba(201, 162, 39, 0.04)` and `rgba(201, 162, 39, 0.01)` with `rgba(227, 180, 90, 0.04)` and `rgba(227, 180, 90, 0.01)` in Institute vs Methodology separator gradient (line 109). | 109 | ~1 min |

### Phase 2 — D.9 REVIEW Resolutions (~5 minutes, team decision required)

| Step | Fix | Line(s) | Effort |
|---|---|---|---|
| 28.2 | **D.9 (REVIEW leans FORBID)** — If team decides "scores confidence" (line 118) leans FORBID as capability description, replace with "assesses confidence signals" or "records confidence signals". | 118 | ~1 min |
| 28.3 | **D.9 (REVIEW leans FORBID)** — If team decides "score source confidence" (line 134) leans FORBID, replace with "assess source confidence signals" or "record source confidence signals". | 134 | ~1 min |
| 28.4 | **D.9 (REVIEW leans FORBID)** — If team decides "fact extraction confidence" (line 209) leans FORBID, replace with "fact extraction confidence signals" or "fact extraction quality". | 209 | ~1 min |
| 28.5 | **D.9 (REVIEW leans FORBID)** — If team decides "confidence scoring" (line 214) leans FORBID, replace with "confidence signals" (canonical Methodology phrasing). | 214 | ~1 min |
| 28.6 | **D.9 (REVIEW leans FORBID)** — If team decides "confidence scoring" (line 244) leans FORBID, replace with "confidence signals". | 244 | ~1 min |
| 28.7 | **D.9 (REVIEW leans FORBID)** — If team decides "confidence scoring" (line 302) leans FORBID, replace with "confidence signals". | 302 | ~1 min |

**Total Phase 1+P2 repair budget for Research Institute: ~6 minutes.**

If Phase 1 + Phase 2 are applied (7 fixes), Research Institute moves from FAIL → PASS (assuming D.9 decisions resolve in the FORBID direction; if team accepts current usage as definitional research terminology, only Phase 1 D.2 fix needed for PASS).

---

## PART 7 — SPEC v7 INPUT

Research Institute surfaces three items relevant for Spec v7 (do NOT implement now — record for cumulative review after all audits):

1. **D.9 verb-form variants clarification** — Research Institute introduces "scores confidence" / "score source confidence" (verb forms) as D.9 variants. Previous D.9 instances were noun forms ("Confidence Scoring", "Extraction Confidence"). Spec v7 should clarify that D.9 covers BOTH noun forms ("Confidence Scoring", "Extraction Confidence") AND verb forms ("scores confidence", "score source confidence") — concept-based interpretation, not part-of-speech-based.
2. **D.9 "confidence propagation" exclusion** — Research Institute uses "confidence propagation" (lines 167, 181, 224) which is a DIFFERENT concept (how confidence values propagate through the evidence chain), NOT "confidence scoring" or "Extraction Confidence". Spec v7 should explicitly exclude "confidence propagation" from D.9 — it is a research term describing a structural property, not a capability claim about scoring confidence.
3. **Institute vs Methodology disambiguation pattern** — Research Institute's explicit distinction (lines 106-126) between Institute (capability) and Methodology (specification) with visual chain is the strongest disambiguation pattern on the audited site. **Recommend adopting as canonical reference** in Spec v7 Layer 1 (Page Disambiguation Patterns subsection) for any page that could be confused with a sibling page.

No other Spec v7 changes triggered by Research Institute. No new defect types (D.15+).

---

*End of Delta Report 28. Research Institute FAILS — 1 D.2 + 6 D.9 REVIEW leaning FORBID (most D.9 instances on a single audited page). Despite the FAIL, the page has the strongest Institute vs Methodology disambiguation, versioned research programs (v1.0), honest maturation/advisory disclosure, open review priority, and uses the Open card pattern (dashed border) consistently. "confidence propagation" is ACCEPTABLE (different concept, NOT D.9). No D.15+ new defect types. Spec v6 sufficient. Total Phase 1+P2 repair budget: ~6 minutes.*

# Spec v7 Refinement Proposal

> **Status:** Gap analysis between Spec v6 and accumulated Delta 1–30 findings. **Proposal only — no Spec file modified, no code modified.**
> **Source:** `PRODUCT-FAMILY-CONSOLIDATION-SPEC.md` v6 (commit `d60ec70`, 922 lines) + 30 Delta Reports (Delta 01–30)
> **Purpose:** Determine which of the 11 candidate rules from the audit deserve to enter Spec v7 as NEW rules, which are CLARIFICATIONS of existing D.1–D.14, and which need NO CHANGE.

---

## Methodology

For each of the 11 candidate rules surfaced during the 30-page audit, this proposal:

1. **Identifies the existing v6 rule** (if any) that the candidate relates to.
2. **States the new clarification** the audit revealed.
3. **Cites the Delta evidence** where the rule was first observed or reinforced.
4. **Proposes v7 wording** (only if the rule enters v7).
5. **Classifies** the candidate as:
   - **NEW** — A rule that does not exist in v6 and should be added as a distinct rule in v7.
   - **CLARIFICATION** — An existing v6 rule that needs expanded wording to cover the case the audit revealed. The rule is NOT new — it's a boundary expansion of an existing D.x.
   - **NO CHANGE** — The v6 rule already covers the case. No v7 change needed; the audit confirmed the rule works as-is.

---

## Gap Analysis Table

### Candidate 1: Governed Design-System Surface

| Field | Value |
|---|---|
| **Existing v6 rule** | Layer 1.1 Token System + Implementation-Layer Scope (v2) — covers CSS, inline styles, SVG, Canvas/Three.js, JS color strings, JS content strings |
| **New clarification** | A design-reference page and the canonical token files it imports must be evaluated as **one governed design-system surface**. A legacy token in the imported source-of-truth layer (e.g., `tokens.css` defining `--roua-accent: #C9A227`) is a **production design-system defect**, even when the page itself is `noindex`/internal documentation. The page's color swatches accurately reflecting the token file is a **symptom**, not the defect — the defect is in the source-of-truth. |
| **Evidence / Delta** | Delta 29 (Visual Reference) — initial discovery of `tokens.css` legacy palette. Delta 30 REVISED (Design Reference) — confirmed `tokens.css` defines 8 accent tokens using `#C9A227` / `rgba(201,162,39,...)`, transforming D.2 from "page-level swatch issue" to "source-of-truth governance defect". |
| **Proposed v7 wording** | See NEW rule GDS-1 below. |
| **Classification** | **NEW** — v6 Implementation-Layer Scope covers JS content strings but does NOT cover **canonical token definition files as source-of-truth**. The concept of "governed design-system surface" (page + its imported token dependencies evaluated as one unit) is absent from v6. This is a scope expansion, not a clarification of an existing D.x. |

---

### Candidate 2: D.2 at canonical-token level (not just local usage)

| Field | Value |
|---|---|
| **Existing v6 rule** | Layer 1.1: "Never use `rgba(201, 162, 39, ...)`" — FORBID. D.2 defect: "Old-gold `rgba(201, 162, 39, ...)` in Evidence Example template". |
| **New clarification** | D.2 must be scanned at **two levels**: (1) local page usage (inline styles, SVG, JS) — already covered by v6; (2) **canonical token definition files** (`tokens.css`, `roua-v7.css`) — NOT covered by v6. If `tokens.css` defines `--roua-accent: #C9A227`, every page importing it inherits D.2 at the token-definition layer, even if the page's own markup uses `var(--roua-accent)` correctly. |
| **Evidence / Delta** | Delta 30 REVISED — `tokens.css` lines 30, 35, 37, 38, 41, 42, 59, 65 define 8 accent tokens using legacy palette. This means D.2 is not just in page markup — it's in the source that defines what `var(--roua-accent)` resolves to. |
| **Proposed v7 wording** | Expand D.2 scope: "D.2 covers `rgba(201, 162, 39, ...)` in ALL layers: page-level CSS, inline styles, SVG, JS, AND **canonical token definition files** (`tokens.css`, `roua-v7.css`, `roua-v7-patch.css`). A legacy value in a token definition file is D.2 for every page that imports that file." |
| **Classification** | **CLARIFICATION** — D.2 already exists in v6. This expands its scope from "page-level usage" to "token-definition-level + page-level usage". Not a new defect type — same D.2, broader scan surface. |

---

### Candidate 3: D.5 extends to CSS/JS dependencies

| Field | Value |
|---|---|
| **Existing v6 rule** | D.5: "Direct competitor naming" — currently scoped to HTML content. Layer 3.6: "Bloomberg / Market Terminals" REVIEW. |
| **New clarification** | D.5 covers competitor naming in **external CSS/JS files loaded by the page**, not just HTML content. A competitor name in a CSS comment (e.g., `tokens.css` line 5: "Bloomberg Terminal × Palantir × BlackRock Aladdin") is D.5 for every page that loads that CSS file. |
| **Evidence / Delta** | Delta 29 (Visual Reference) — first D.5 in external CSS. Delta 30 (Design Reference) — same `tokens.css` D.5, shared file. |
| **Proposed v7 wording** | Expand D.5 scope: "D.5 covers competitor naming in ALL layers: HTML content, JavaScript content strings, AND **external CSS/JS files loaded by the page** (including comments). A competitor reference in `tokens.css` is D.5 for every page importing `tokens.css`." |
| **Classification** | **CLARIFICATION** — D.5 already exists in v6. This expands its scope from "HTML content" to "HTML content + external CSS/JS dependencies". Same D.5, broader scan surface. Aligns with v6's Implementation-Layer Scope expansion pattern (v2 added SVG/Canvas, v6 added JS content strings — v7 adds external CSS/JS comments). |

---

### Candidate 4: D.8 covers latency-range claims (not just "real-time")

| Field | Value |
|---|---|
| **Existing v6 rule** | D.8: "real time" / "real-time" timing claim — FORBID. Layer 1.9: "within seconds", "in seconds", "instantly", "instant", "continuously monitored" (as timing claim). |
| **New clarification** | D.8 covers **any specific-delivery-latency claim**, not just the exact phrases "real-time" / "within seconds". Variants include: "in minutes, not hours" (Delta 24), "in minutes" (general), "in seconds" (already covered), "in hours" (as latency claim). The concept: any claim promising a specific time-to-delivery for intelligence is D.8. **Does NOT cover**: meeting durations ("30-minute call"), deployment estimates ("integration in days" — REVIEW), or operational-status language ("live" / "running" / "today"). |
| **Evidence / Delta** | Delta 22 (Developers) — first confirmed D.8 ("real-time" × 2). Delta 24 (Financial Intelligence) — D.8 variant "in minutes, not hours". Delta 25 (Financial Media) — D.8 "Real-time" + variant "monitored continuously". Delta 26 (Contact) — "30-minute call" / "About two minutes" ACCEPTABLE (meeting/form duration, not intelligence-delivery latency). |
| **Proposed v7 wording** | Expand D.8: "D.8 covers intelligence-delivery latency claims in all forms: 'real-time', 'real time', 'within seconds', 'in seconds', 'in minutes', 'in minutes, not hours', 'in hours', 'instantly', 'instant'. **Does NOT cover**: meeting durations ('30-minute call'), form-fill estimates ('about two minutes'), deployment timelines ('integration in days' — REVIEW), or operational-status language ('live' / 'running' / 'today' per Delta 20 clarification)." |
| **Classification** | **CLARIFICATION** — D.8 already exists in v6. This expands the forbidden phrase list to cover latency-range variants and explicitly excludes non-latency duration language. Same D.8, clearer boundary. |

---

### Candidate 5: D.9 is concept-based, not keyword-based

| Field | Value |
|---|---|
| **Existing v6 rule** | D.9: "confidence score" / "confidence scored" — FORBID. "Extraction Confidence" — REVIEW. "Confidence Scoring" — REVIEW leans FORBID. |
| **New clarification** | D.9 covers the **concept** of confidence-as-proven-claim, regardless of grammatical form. This includes: noun forms ("Confidence Scoring", "Extraction Confidence", "confidence scores" plural), verb forms ("scores confidence", "score source confidence"), and past-tense forms ("confidence scored"). The boundary: `illustrative metadata (acceptable) < design-reference data-type documentation (acceptable) < capability description (REVIEW leans FORBID) < proven platform claim (FORBID)`. **Exclusion**: "confidence propagation" is NOT D.9 — it's a different concept (how confidence values propagate through the evidence chain, a research/architecture term). |
| **Evidence / Delta** | Delta 22 (Developers) — "confidence scores" plural variant. Delta 28 (Research Institute) — verb forms "scores confidence" / "score source confidence" + "confidence propagation" exclusion. Delta 29 (Visual Reference) — "Confidence Score" typographic label (design-reference, acceptable) vs "confidence scores" capability claim (FORBID). Delta 30 (Design Reference) — "confidence scoring" capability (leans FORBID) vs "97%" design-reference sample (acceptable). |
| **Proposed v7 wording** | Expand D.9: "D.9 is concept-based, not keyword-based. Covers all grammatical forms: noun ('Confidence Scoring', 'Extraction Confidence', 'confidence scores' plural), verb ('scores confidence', 'score source confidence'), past tense ('confidence scored'). Boundary: `illustrative metadata (acceptable) < design-reference data-type documentation (acceptable) < capability description (REVIEW leans FORBID) < proven claim (FORBID)`. **Exclusion**: 'confidence propagation' is NOT D.9 — different concept (research term for structural property, not a scoring claim)." |
| **Classification** | **CLARIFICATION** — D.9 already exists in v6 with 3 tiers. This adds: (a) verb-form coverage, (b) explicit "confidence propagation" exclusion, (c) design-reference data-type documentation as a 4th tier (acceptable). Same D.9, more complete boundary. |

---

### Candidate 6: D.10 covers page identity (title, meta, hero, section headers)

| Field | Value |
|---|---|
| **Existing v6 rule** | D.10: "Old taxonomy in content" — FORBID when used as "product names or taxonomy labels". v5 clarification: descriptive adjective use is NOT D.10. |
| **New clarification** | D.10 covers **page identity** (title, meta description, hero eyebrow, hero H1, hero paragraph, section H2, section paragraph), NOT just UI labels (CTA buttons, card titles). Using "Trading Intelligence" or "Institutional Intelligence" as the page's primary identity (title/meta/hero) is D.10 — even if the canonical names appear correctly in nav/footer. Also: case variants count (lowercase "trading intelligence" in meta description is D.10, per Delta 26). Shorthand product lists ("Investment, Market, Risk, Media, Trading, or Developer") lean acceptable as descriptive shorthand (per Delta 26, 28, 30). |
| **Evidence / Delta** | Delta 21 (Product Experience) — D.10 in CTA button labels (UI label). Delta 23 (Trading Platform) — D.10 as page identity (6 instances: title, meta, hero eyebrow, hero paragraph, section H2, section paragraph). Delta 24 (Financial Intelligence) — D.10 as page identity (5 "Institutional Intelligence" instances). Delta 26 (Contact) — D.10 lowercase case variant in meta description. |
| **Proposed v7 wording** | Expand D.10: "D.10 covers old taxonomy used as **page identity** (title, meta description, hero eyebrow, hero H1, hero paragraph, section H2, section paragraph) AND **UI labels** (CTA buttons, card titles). Case-insensitive — lowercase 'trading intelligence' in meta is D.10. Shorthand product lists ('Investment, Market, Risk, Media, Trading, or Developer') lean acceptable as descriptive shorthand." |
| **Classification** | **CLARIFICATION** — D.10 already exists in v6. This expands the scan surface from "content fields" to explicitly include "page identity locations" (title/meta/hero/section headers) and confirms case-insensitivity. Same D.10, clearer scope. |

---

### Candidate 7: "material claim" ≠ "every claim"

| Field | Value |
|---|---|
| **Existing v6 rule** | Layer 1.9: "every claim" — REVIEW (acceptable in quoted institutional questions, forbidden as ROUA claim). |
| **New clarification** | "material claim" (with materiality qualifier) is **NOT** the "every claim" FORBID phrase. "Material claim" means "only claims that matter materially require evidence" — a materiality qualifier, not a universal quantifier. "Every claim" is a universal quantifier (all claims, without qualification). The distinction: `material claim (acceptable, materiality qualifier) ≠ every claim (FORBID, universal quantifier)`. |
| **Evidence / Delta** | Delta 27 (Careers) — "If you make a material claim — in code, design, research, or a meeting — be ready to show the evidence behind it." (cultural principle, ACCEPTABLE). Delta 24/25/29 — "every claim" FORBID instances. |
| **Proposed v7 wording** | Add to Layer 1.9: "'material claim' / 'material claims' is ACCEPTABLE (materiality qualifier — only materially-relevant claims require evidence). 'every claim' / 'all claims' is FORBID (universal quantifier — all claims without qualification). The distinction is the quantifier, not the word 'claim'." |
| **Classification** | **CLARIFICATION** — "every claim" already exists in v6 as REVIEW. This adds the "material claim" distinction to prevent false-positive flagging. Not a new rule — a boundary clarification of the existing "every claim" REVIEW. |

---

### Candidate 8: Operational-state language ≠ timing claim

| Field | Value |
|---|---|
| **Existing v6 rule** | D.8: "real time" / "continuously monitored" (as timing claim) — FORBID. D.13: "24/7" — REVIEW. |
| **New clarification** | Operational-status language ("live", "running", "today", "current", "already", "operational", "live briefing", "live deployment", "live source", "live ingestion logs") is **NOT** D.8/D.13. These describe operational state (what exists/works now), not timing/freshness (how fast intelligence arrives). The distinction: `operational-status statement (acceptable) ≠ timing/freshness claim (D.8/D.13)`. Meeting durations ("30-minute call", "60-minute walkthrough") and form-fill estimates ("about two minutes") are also acceptable — they describe user/meeting effort, not intelligence delivery. |
| **Evidence / Delta** | Delta 20 (Infrastructure Report) — "live" / "today" / "running" / "current" / "already" / "operational" status-truth language ACCEPTABLE. Delta 26 (Contact) — "30-minute call" / "60-minute walkthrough" / "About two minutes" ACCEPTABLE. Delta 27 (Careers) — "45-minute call" / "90-minute conversation" / "60-minute conversation" ACCEPTABLE. |
| **Proposed v7 wording** | Add to D.8: "Operational-status language ('live', 'running', 'today', 'current', 'already', 'operational') is ACCEPTABLE — describes what exists/works now, not how fast intelligence arrives. Meeting durations ('30-minute call') and form-fill estimates ('about two minutes') are ACCEPTABLE — describe user/meeting effort, not intelligence delivery. The distinction: `operational-status statement ≠ timing/freshness claim`." |
| **Classification** | **CLARIFICATION** — D.8 already exists in v6. This adds the operational-status exclusion to prevent false-positive flagging of "live" / "today" / "running" on operational-status pages (Infrastructure Report, Contact, Careers). Same D.8, clearer boundary. |

---

### Candidate 9: Customer-production vs internal-production boundary

| Field | Value |
|---|---|
| **Existing v6 rule** | Not explicitly covered. Layer 6.1 page category roles mention "Infrastructure Report" as "Reference" category but do not address production-deployment boundary discipline. |
| **New clarification** | Pages describing ROUA's internal production environment (Infrastructure Report) must explicitly distinguish **internal production** from **customer production**. The boundary must be stated in at least 3 locations (hero, status definition, environment note). "Operational" means "running in ROUA internal production" — NOT "customer production deployment". This prevents buyers from assuming ROUA is describing customer-facing production. |
| **Evidence / Delta** | Delta 20 (Infrastructure Report) — 4 explicit customer-production boundary disclaimers (lines 121, 132, 230, 313): "Customer production deployment is a separate engagement" / "ROUA internal environment — not customer production" / "this report does not describe customer production". |
| **Proposed v7 wording** | Add to Layer 6 (Infrastructure Report category): "Infrastructure Report must explicitly distinguish internal production from customer production in at least 3 locations (hero, status definition, environment note). 'Operational' = running in ROUA internal production, NOT customer production deployment." |
| **Classification** | **NEW** — v6 does not have a rule about customer-vs-internal production boundary discipline. This is a new rule for the Infrastructure Report page category (and potentially other operational-status pages). Not a clarification of an existing D.x — it's a category-specific rule that the audit revealed. |

---

### Candidate 10: Design-reference examples ≠ capability claims

| Field | Value |
|---|---|
| **Existing v6 rule** | Not explicitly covered. D.9 has a 3-tier boundary (illustrative < capability < proven) but does not address design-reference documentation context. |
| **New clarification** | On design-reference pages (`visual-reference.html`, `design-reference.html`), the following are **design-reference documentation** (acceptable), NOT capability claims: (a) color swatches documenting the palette, (b) typographic category labels ("Confidence Score" as a type-style label), (c) operational-state scenario text ("Confidence score fell below threshold"), (d) localization data-type labels ("Confidence scores remain in international format"). The distinction: `design-reference documentation of a concept (acceptable) ≠ capability claim of the same concept (D.9 leans FORBID)`. **However**: "Audit Ready" as a badge label in a component demo IS still D.4 — it's a visible badge presented as a product attribute, not a data-type documentation. |
| **Evidence / Delta** | Delta 29 (Visual Reference) — "Confidence Score" typographic label (acceptable), "confidence scores" in typography description (FORBID — capability claim in description text), "Confidence score fell" scenario (acceptable). Delta 30 (Design Reference) — "confidence scoring" in architecture layer description (FORBID — capability description), "97%" in component sample (acceptable). |
| **Proposed v7 wording** | Add to Layer 6 (Design Reference category): "Design-reference documentation of a concept (color swatches, typographic labels, scenario text, localization labels) is ACCEPTABLE even if the concept name matches a D.9 term — the page is documenting how to display/typeset/localize the concept, not claiming it as a capability. However, capability descriptions in design-reference page text ('confidence scoring' in an architecture layer description) are still D.9. 'Audit Ready' as a visible badge label is still D.4 even in a component demo." |
| **Classification** | **NEW** — v6 does not have a design-reference-page exception for D.9. This is a new rule for the Design Reference page category. Not a clarification of D.9 itself — D.9's boundary stays the same, but design-reference pages get a context-specific exception for documentation-of-concept uses. |

---

### Candidate 11: Dead CSS sub-blocks inside live `<style>` (D.1 variant)

| Field | Value |
|---|---|
| **Existing v6 rule** | D.1: "Dead inline `<style>` block (lines 13–30)" — targeting non-existent IDs. Layer 6.2: "No dead inline `<style>` blocks targeting non-existent IDs" — FORBID. |
| **New clarification** | D.1 covers **both** (a) entirely dead `<style>` blocks (all classes unused — v6's current scope) AND (b) **dead sub-blocks inside an otherwise live `<style>`** (some classes defined but never used in body). Detection method: grep for class definitions in `<style>`, then grep for class usage in body. If defined but not used, it's dead CSS — whether the block is fully dead or partially dead. |
| **Evidence / Delta** | Delta 22 (Developers) — `.tree-*` classes (lines 70–78, marked "(legacy, unused)") + `.arch-branch.b-*` modifier classes (lines 84–88, body grep confirms zero usage) inside an otherwise live `<style>` block. |
| **Proposed v7 wording** | Expand D.1: "D.1 covers (a) entirely dead `<style>` blocks (all classes unused) AND (b) dead sub-blocks inside an otherwise live `<style>` (classes defined but never referenced in body). Detection: grep class definitions in `<style>`, grep class usage in `<body>` — if defined but not used, it's dead CSS regardless of whether the surrounding block is live." |
| **Classification** | **CLARIFICATION** — D.1 already exists in v6. This expands its scope from "fully dead blocks" to "fully dead + partially dead sub-blocks". Same D.1, broader detection. |

---

## Summary Classification

| # | Candidate Rule | Classification | Enters v7? |
|---|---|---|---|
| 1 | Governed Design-System Surface | **NEW** | ✅ Yes — new rule GDS-1 |
| 2 | D.2 at canonical-token level | **CLARIFICATION** | ✅ Yes — D.2 scope expansion |
| 3 | D.5 extends to CSS/JS dependencies | **CLARIFICATION** | ✅ Yes — D.5 scope expansion |
| 4 | D.8 covers latency-range claims | **CLARIFICATION** | ✅ Yes — D.8 boundary clarification |
| 5 | D.9 is concept-based | **CLARIFICATION** | ✅ Yes — D.9 boundary clarification |
| 6 | D.10 covers page identity | **CLARIFICATION** | ✅ Yes — D.10 scope expansion |
| 7 | "material claim" ≠ "every claim" | **CLARIFICATION** | ✅ Yes — Layer 1.9 clarification |
| 8 | Operational-state language ≠ timing claim | **CLARIFICATION** | ✅ Yes — D.8 exclusion clarification |
| 9 | Customer-production vs internal-production boundary | **NEW** | ✅ Yes — new Layer 6 category rule |
| 10 | Design-reference examples ≠ capability claims | **NEW** | ✅ Yes — new Layer 6 category rule |
| 11 | Dead CSS sub-blocks inside live `<style>` (D.1 variant) | **CLARIFICATION** | ✅ Yes — D.1 scope expansion |

### Tally

- **NEW rules: 3** (Candidates 1, 9, 10)
- **CLARIFICATIONS of existing D.x: 8** (Candidates 2, 3, 4, 5, 6, 7, 8, 11)
- **NO CHANGE: 0**

All 11 candidates enter v7 — but 8 enter as clarifications of existing defect types, not as new defect types. Only 3 are genuinely new rules (governed design-system surface, customer-production boundary, design-reference exception). **No D.15+ new defect types are proposed.**

---

## Proposed v7 Structure (Delta from v6)

### What changes in v7

1. **Layer 1.1 Token System** — add note: "D.2 scan includes canonical token definition files (`tokens.css`, `roua-v7.css`, `roua-v7-patch.css`), not just page-level usage." (Candidate 2)

2. **Layer 1.9 Trust Grammar** — add:
   - "material claim" distinction (Candidate 7)
   - D.8 latency-range variants + operational-status exclusion (Candidates 4, 8)
   - D.9 concept-based clarification + "confidence propagation" exclusion + design-reference documentation tier (Candidate 5)

3. **Layer 4 Defects** — expand:
   - D.1: add "dead sub-blocks inside live `<style>`" (Candidate 11)
   - D.2: add "canonical token definition files" to scan surface (Candidate 2)
   - D.5: add "external CSS/JS files loaded by the page" to scan surface (Candidate 3)
   - D.8: add latency-range variants + operational-status exclusion (Candidates 4, 8)
   - D.9: add verb-form coverage + "confidence propagation" exclusion + design-reference tier (Candidate 5)
   - D.10: add "page identity locations" to scan surface (Candidate 6)

4. **Layer 6 Page Category Rules** — add:
   - **NEW rule GDS-1**: Governed Design-System Surface (Candidate 1) — applies to Design Reference pages
   - **NEW rule**: Customer-production vs internal-production boundary (Candidate 9) — applies to Infrastructure Report
   - **NEW rule**: Design-reference documentation exception (Candidate 10) — applies to Design Reference pages

### What does NOT change in v7

- The 6-verdict system (KEEP / STANDARDIZE / REPAIR / ADOPT / FORBID / REVIEW)
- Layer 2 (Five Page Archetypes)
- Layer 3 (Allowed Variations)
- Layer 5 (Do-Not-Touch Rules)
- The 14 defect types (D.1–D.14) — no D.15+ added
- Implementation-Layer Scope (v2/v6) — stays as-is, with external CSS/JS comments added
- Technology Neutrality Principle
- Acceptance Criteria

---

## Decision Required

For each of the 11 candidates, confirm:

1. **NEW rules (3):** Do you accept adding GDS-1 (governed design-system surface), customer-production boundary rule, and design-reference exception rule to v7 Layer 6?
2. **CLARIFICATIONS (8):** Do you accept expanding D.1, D.2, D.5, D.8, D.9, D.10, and Layer 1.9 ("every claim" / "material claim") per the proposed wording?
3. **No D.15+:** Confirm that no new defect types are added — all 11 candidates are either new category rules or clarifications of existing D.1–D.14.

Once confirmed, I will draft the v7 Spec file (modifying `PRODUCT-FAMILY-CONSOLIDATION-SPEC.md`) — but only after your approval of this proposal.

---

*End of Spec v7 Refinement Proposal. No Spec file modified. No code modified. Proposal only — awaiting approval before drafting v7.*

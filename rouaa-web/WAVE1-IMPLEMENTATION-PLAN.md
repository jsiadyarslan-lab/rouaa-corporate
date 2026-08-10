# Wave 1 — Implementation Plan (No Code Changes)

> **Status:** Plan only. **No code modified. No commit.**
> **Baseline:** `b6ac82e`
> **Pages:** `architecture.html`, `catalog.html`, `contact.html`

---

## Page 1: `architecture.html`

### Current state (15 sections, 3484 lines)

| # | Section (line) | Current content | Strategic role | Action |
|---|---|---|---|---|
| 1 | Hero (1278-1340) | "The Evidence Infrastructure Behind Institutional Financial Decisions" + Decision Journey visual (5-step) | Identity + what is it | **KEEP** — strong positioning. Minor: hero paragraph is wordy, could tighten. Decision Journey visual is excellent — keep. |
| 2 | The Institutional Trust Gap (1362-1393) | "Financial institutions do not lack information. They lack governed intelligence they can verify and defend." | Problem | **KEEP + PROMOTE** — this is the Problem section that 02/03 require. Already exists but could be positioned earlier or given more visual weight. |
| 3 | Why Seven Layers? (1394-1443) | "The difference between data and defensible decisions." | Why it matters | **KEEP** — good bridge from problem to architecture. |
| 4 | Evidence Intelligence Pipeline (1444-1630) | Visual pipeline: Sources → Documents → Facts/Events → Evidence → Intelligence → Workflows | How it works (core proof) | **KEEP + PROMOTE** — this is the moat narrative per 02.6. Should be the centerpiece. Already large section (~186 lines). |
| 5 | The Atomic Unit (1631-1700) | "What ROUA actually produces." — Intelligence Object concept | What it creates | **KEEP** — important concept. Links to evidence proof per 04.4. |
| 6 | Architecture Layers (1701-2006) | "Explore each layer." — 7 interactive layers | Technical detail | **KEEP** — already structured well. Each layer should ideally link to institutional consequence per 05.5, but current content is acceptable. |
| 7 | Every Decision Has A Memory (2007-2114) | "ROUA preserves the complete reasoning path behind every institutional conclusion." | Governance proof | **KEEP** — this is the evidence artifact per 04.4/04.5. Strong section. |
| 8 | Object Relationship Model (2115-2184) | "An object is not an isolated record." | Technical detail (deep) | **KEEP** — optional depth for technical evaluators. Not conversion-critical but adds credibility. |
| 9 | From Intelligence Infrastructure to Institutional Workflows (2185-2229) | "Where the intelligence is consumed." | What it powers | **KEEP** — this connects infrastructure to workflows per 01.5 hierarchy. |
| 10 | Architecture Operating Model (2230-2290) | "What each layer does — and what state it is in." | Operational proof | **KEEP** — important for 04.5/04.6 governance proof. Shows what's operational vs in development. |
| 11 | Human Oversight Layer (2291-2395) | "The system can process. Only institutions can approve." | Governance proof | **KEEP** — this is the AI trust positioning per 04.6. Excellent section. |
| 12 | Deployment Model (2396-2442) | "How institutions deploy ROUA." — Cloud / Private Cloud / On-Premise | Deployment proof | **KEEP** — per 04.8/05.13. Already has deployment options. |
| 13 | CTA (2443-2450) | "Explore the Intelligence Infrastructure" + "Request Briefing" | Conversion | **REFINE** — Change primary CTA text to "Request an Institutional Briefing" (currently "Request Briefing"). Add "View Institutional Workflows" as secondary. |
| Footer | Standard | — | — | **KEEP** |

### Architecture page assessment

**The page is already very well structured for institutional trust.** It has:
- ✅ Problem section (Trust Gap)
- ✅ Architecture as proof
- ✅ Evidence/pipeline as moat
- ✅ Governance/oversight
- ✅ Deployment
- ✅ CTA

**Changes needed (minimal):**
1. CTA text: "Request Briefing" → "Request an Institutional Briefing" (2 instances: nav line 1260 + section line 2447)
2. Secondary CTA: "Reconstruct a Decision" → "View Institutional Workflows" (line 2448) — or keep both
3. No structural changes needed — the page already follows the 05 hierarchy

---

## Page 2: `catalog.html`

### Current state (12 sections, 868 lines)

| # | Section (line) | Current content | Strategic role | Action |
|---|---|---|---|---|
| 1 | Hero (150-167) | "Five products. One intelligence foundation." + 2 CTAs | Identity | **REFINE** — "Five products" framing pushes product-catalog mentality per 02.4. Change to "Intelligence capabilities built on one governed foundation." Primary CTA: "Request an Institutional Briefing" (currently "Explore Institutional Deployments" — swap priority). |
| 2 | Why This Catalog Exists (170-181) | "Built as Institutional Intelligence Infrastructure" | Positioning | **KEEP** — good framing. Already says "institutional outcomes, not isolated AI tools." |
| 3 | Product vs Module (184-196) | "Products are institutional intelligence systems. Modules are specialized capabilities." | Education | **KEEP** — useful distinction. Prevents catalog mentality. |
| 4 | Typical Institutional Deployments (260-420) | "From capabilities to institutional intelligence products." — buyer × workflow grid | Buyer mapping | **KEEP + REFINE** — this is the "Who Buys This" section per 03.5/05.11. Already maps buyer → problem → workflow. Needs CTA per buyer card ("View [Workflow] →"). |
| 5 | Provenance Chain (421-463) | "From official evidence to institutional decisions." — visual chain | Evidence proof | **KEEP** — supports 04.4 evidence proof. |
| 6 | Capability Maturity Model (464-500) | "Every capability classified by deployment readiness." | Operational proof | **KEEP** — supports 04.5 operational proof. Shows maturity. |
| 7 | Explore Intelligence Products (501-560) | "Each product is built from specialized capabilities." — filter + grid | Product evaluation | **KEEP** — this is the product catalog. Per 02.4, reduce emphasis: it should feel like "here's what the foundation powers" not "pick a product." The filter UI is already good. |
| 8 | Platform Foundation (561-600) | "Six intelligence foundation assets. One governance layer." | Infrastructure proof | **KEEP** — connects products back to foundation. |
| 9 | CTA (601-608) | "Build Your Institutional Intelligence Architecture." + 2 CTAs | Conversion | **REFINE** — Primary: "Request an Institutional Briefing" (currently correct). Secondary: "View Architecture" → keep. Add "What Happens Next" section before CTA per 05.14. |
| 10 | JS data (products.js) | Product catalog data | — | **KEEP** — already fixed in C5-B3 for timing claims. |

### Catalog page assessment

**The page is reasonably well-structured but has a catalog-first feel.** Changes needed:
1. Hero: reframe from "Five products" to "One foundation → multiple workflows"
2. Hero CTA: swap priority — "Request an Institutional Briefing" primary, "Explore Deployments" secondary
3. Add "What Happens Next" 5-step section before final CTA (per 05.14)
4. Buyer deployment cards: add per-card CTA ("View Research Workflow →")
5. No major structural change needed

---

## Page 3: `contact.html`

### Current state (5 sections, 366 lines)

| # | Section (line) | Current content | Strategic role | Action |
|---|---|---|---|---|
| 1 | Hero (93-110) | "Request a product briefing." + 3-stage process summary | Conversion entry | **REFINE** — Title: "Request a product briefing" → "Request an Institutional Briefing". Eyebrow: "Product Briefing Request" → "Institutional Briefing Request". 3-stage summary is good but should align with 05.14 5-step model (currently 3 stages, spec asks for 5). |
| 2 | What A Briefing Can Cover (112-139) | 4 cards: Product Fit / Evidence / Deployment / Workflow | Qualification | **KEEP** — good content. Already structured around institutional questions. |
| 3 | What To Expect (141-168) | 3 stages: Product & Workflow Fit → Workflow Review → Deployment Discussion | Process transparency | **REFINE** — Expand from 3 stages to 5 per 05.14: (1) Institutional Assessment (2) Source & Workflow Mapping (3) Workflow Demonstration (4) Pilot Definition (5) Deployment Planning. Keep the "If ROUA is not the right fit, we will tell you during Stage 01" disclaimer — it's excellent. |
| 4 | Briefing Form (170-282) | Form: Name / Work Email / Organization / Role / Interest / Deployment Context / Message | Conversion form | **REFINE** — Per 05.15: (a) Title: "Briefing Request" → "Request an Institutional Briefing" (b) Add "What intelligence workflow are you evaluating?" as optional field (c) Interest dropdown: remove "Trading Desks" and "Investment Firms" (these are solution labels, not interests — already in nav as solutions). Add "Intelligence Infrastructure" and "Risk & Governance" options. (d) Add trust statement before submit button: "Institutional briefing — no commitment required." |
| 5 | Direct Contact (284-306) | 3 email addresses: institutional / partnerships / press | Alternative contact | **KEEP** — useful for non-briefing inquiries. |

### Contact page assessment

**The page is already well-designed for institutional conversion.** Changes needed:
1. Title/eyebrow: "product briefing" → "institutional briefing"
2. What To Expect: expand 3 stages → 5 stages per 05.14
3. Form: refine interest options + add optional workflow question + add trust statement
4. Submit button: "Request Briefing" → "Request an Institutional Briefing"
5. These are text changes + 1 section expansion — no structural redesign needed

---

## Summary: Wave 1 Implementation Plan

### architecture.html — MINIMAL CHANGES

| Change | Type | Effort |
|---|---|---|
| Nav CTA: "Request Briefing" → "Request an Institutional Briefing" | Text | ~1 min |
| Section CTA: "Request Briefing" → "Request an Institutional Briefing" | Text | ~1 min |
| Secondary CTA: add "View Institutional Workflows" alongside "Reconstruct a Decision" | Text | ~1 min |
| **Total** | — | **~3 min** |

**The page is already structurally excellent.** It has problem, architecture, evidence, governance, deployment, and CTA in the right order. Only CTA text needs alignment.

### catalog.html — MODERATE CHANGES

| Change | Type | Effort |
|---|---|---|
| Hero: reframe "Five products" → "One foundation → multiple workflows" | Text rewrite | ~5 min |
| Hero CTAs: swap priority (Briefing primary, Deployments secondary) | Reorder | ~2 min |
| Add "What Happens Next" 5-step section before final CTA | New section | ~10 min |
| Buyer deployment cards: add per-card CTA | Text | ~5 min |
| **Total** | — | **~22 min** |

### contact.html — MODERATE CHANGES

| Change | Type | Effort |
|---|---|---|
| Title/eyebrow: "product briefing" → "institutional briefing" | Text | ~2 min |
| What To Expect: expand 3 → 5 stages | Section rewrite | ~10 min |
| Form: refine interest options | Dropdown edit | ~3 min |
| Form: add optional "What intelligence workflow are you evaluating?" | New field | ~5 min |
| Form: add trust statement before submit | New text | ~2 min |
| Submit button text | Text | ~1 min |
| **Total** | — | **~23 min** |

### Wave 1 total estimated effort: ~48 minutes

---

## What this plan does NOT do

- ❌ No structural redesign of any page
- ❌ No new pages
- ❌ No navigation restructuring
- ❌ No changes to `index.html` (FROZEN)
- ❌ No changes to product/solution pages (Wave 2+)
- ❌ No new taxonomy
- ❌ No new claims or metrics
- ❌ No visual design changes (layout, colors, typography)

## What this plan DOES do

- ✅ Aligns CTA text across 3 pages to "Request an Institutional Briefing"
- ✅ Adds "What Happens Next" 5-step process to catalog.html
- ✅ Expands contact.html briefing process from 3 → 5 stages
- ✅ Refines contact form for institutional qualification
- ✅ Adds trust statement before form submission
- ✅ Reframes catalog hero from product-catalog to foundation-first
- ✅ Adds per-buyer-card CTAs in catalog deployment section

---

*End of Wave 1 Implementation Plan. No code modified. Awaiting approval before execution.*

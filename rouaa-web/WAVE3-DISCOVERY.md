# Wave 3 — Discovery & Strategic QA

> **Status:** Audit only. **No code modified. No commit.**
> **Subject:** Wave 3 platform pages — strategic conversion readiness
> **Pages:** `platform.html` · `developers.html`
> **Method:** Apply the 7-link test per page:
>   **Buyer → Problem → ROUA Capability → Evidence/Proof → Workflow → Deployment → Institutional Briefing**
> **Strategic question:** Does the page make the buyer say
>   *"I want to understand how this can be deployed inside my institution"* —
>   not just *"this is a good platform page"*?
> **Per user direction:** Identify gaps only. No implementation recommendations in this Discovery.
> **Baseline:** `bb53b09` (Wave 2 Strategic QA — Wave 2 closed)
> **Date:** 2026-08-11

---

## 1. Method

For each page, I read the full HTML and evaluate seven conversion links:

| Link | Question |
|---|---|
| **L1 Buyer** | Does the page name the buyer explicitly in the hero or first sections? |
| **L2 Problem** | Does the page name a specific institutional pain (not a generic one)? |
| **L3 Capability** | Does the page show what ROUA actually does — not adjectives, but capabilities? |
| **L4 Evidence/Proof** | Does the page prove its claims (sample objects, evidence chain, source links)? |
| **L5 Workflow** | Does the page show how ROUA enters the institution's existing workflow? |
| **L6 Deployment** | Does the page describe how ROUA deploys (cloud / private / on-prem / hybrid)? |
| **L7 Briefing** | Does the page lead to a clear, institutional next step — not a soft "learn more"? |

**Note on page types:** Wave 3 pages differ from Wave 2 product pages. They are platform/infrastructure pages, not product pages. The "buyer" is different:
- `platform.html` → CTO / Head of Platform / institutional buyer evaluating the infrastructure layer
- `developers.html` → Engineering teams / fintech integration leads (the page explicitly says "this page is for the engineers who will build the integration, not the buyer who will sign the contract")

This means the 7-link test must adapt:
- L1 Buyer for developers.html is the **engineer**, not the procurement buyer
- L7 Briefing for developers.html is **"Request API Access"** (a different conversion path), not "Request an Institutional Briefing"

These are not inconsistencies — they reflect a genuinely different journey (developer integration ≠ institutional procurement). Wave 1 QA already documented this as "different journey, by design."

---

## 2. Page 1: `platform.html` (718 lines)

### 2.1 Section map

| # | Section | Lines | Role |
|---|---|---|---|
| 1 | Hero | 189-211 | Identity |
| 2 | Scope: Platform vs Architecture | 213-233 | Positioning |
| 3 | Why This Platform Exists | 235-273 | Problem + chain concept |
| 4 | Without ROUA / With ROUA | 275-299 | Problem (comparison) |
| 5 | Platform Architecture — buyer-level overview (7 layers) | 301-385 | Capability |
| 6 | Built Today — Operational Proof | 387-446 | Evidence/Proof (operational) |
| 7 | Evidence Trace Demo (Aramco) | 448-492 | Evidence/Proof (trace) |
| 8 | One Platform → Multiple Applications | 494-530 | Capability (products) |
| 9 | Why Not Build Internally | 532-566 | Problem (build vs buy) |
| 10 | Enterprise Deployment | 568-596 | Deployment |
| 11 | Production Infrastructure | 598-629 | Capability (scale) |
| 12 | CTA | 631-642 | Briefing |

### 2.2 7-link test

| Link | Evidence | Verdict |
|---|---|---|
| L1 Buyer | **Implicit.** Hero says "for Institutions" but does not name a specific buyer archetype (CTO, Head of Platform, Head of Research). Section 9 "Why Not Build Internally" mentions "specialized teams across data engineering, governance, research, and deployment" — but these are ROUA's teams, not the buyer's. Section 11 "Production Infrastructure" says "designed for the scale at which financial institutions actually operate" — generic. **No named buyer.** | ⚠️ PASS WITH FRICTION |
| L2 Problem | **Strong.** Section 3 "Why This Platform Exists": "Most institutions rebuild the same pipeline" — 4-step problem chain (fragmented sources → each institution builds same pipeline → requires specialized teams → ROUA builds once). Section 4 "Without ROUA / With ROUA" comparison. Section 9 "Why Not Build Internally": "Building this infrastructure internally requires years of specialized development." | ✅ PASS |
| L3 Capability | **Strong.** Section 5 "Platform Architecture — Overview" — 7 layers (Source Registry → Document Intelligence → Financial Fact Engine → Event Engine → Evidence & Provenance → Governed Reasoning → Intelligence Distribution). Each layer has buyer-level value statement (e.g., "Numbers arrive pre-linked to their source page and paragraph — defensible from the first reference"). Section 8 "One Platform → Multiple Applications" connects platform to 4 decision environments + 1 integration layer. | ✅ PASS |
| L4 Evidence/Proof | **Strong — operational proof is unique to this page.** Section 6 "Built Today" — 4 operational cards (Source Intelligence Layer, Document Intelligence Layer, Evidence & Provenance Layer, Financial Event Engine) all marked "Operational" with specific capabilities. Section 7 "Evidence Trace Demo" — 4-step Aramco trace (Research Conclusion → Source-Linked Fact → Source Document → Official Origin). **However:** the Aramco trace is conceptual — no live source link, unlike Wave 2 product pages which have live aramco.com / federalreserve.gov / ecb.europa.eu links. | ✅ PASS (with friction on live links) |
| L5 Workflow | **Weak — this is a platform page, not a workflow page.** The page shows the platform's internal pipeline (7 layers, intelligence chain) but does NOT show the buyer's workflow. There is no "How your team uses ROUA on Monday morning" section. Section 4 "Without ROUA / With ROUA" shows high-level before/after but not the buyer's actual workflow. | ⚠️ PASS WITH FRICTION |
| L6 Deployment | **Strong.** Section 10 "Enterprise Deployment" — 4 models (Cloud SaaS, Private Cloud, On-Premise, Hybrid). On-Premise explicitly names "for central banks and governments." Section 11 "Production Infrastructure" adds scale context (continuous monitoring, daily document volume, multi-language, private deployment). | ✅ PASS |
| L7 Briefing | CTA (line 638): "Request Platform Briefing" (primary) → contact.html. Secondary: "Explore the Architecture." | ✅ PASS |

### 2.3 Strategic question

> Does the page make a CTO / Head of Platform say *"I want to understand how this can be deployed inside my institution"*?

**Verdict: PARTIAL — strong on capability + operational proof, weak on buyer naming + workflow.**

The page is structurally excellent for a platform/infrastructure page:
- ✅ Clear problem (institutions rebuild the same pipeline)
- ✅ Clear capability (7 layers, each with buyer value)
- ✅ Strong operational proof (Built Today section is unique — no other page shows what is actually running)
- ✅ Evidence trace demo (4-step Aramco trace)
- ✅ Clear deployment (4 models)

But it has 2 frictions:
- ⚠️ **L1 Buyer:** No named buyer archetype. A CTO arriving here does not see "for CTOs" or "for Heads of Platform" — they see "for Institutions" (generic). This is the same friction as enterprise.html (Wave 1 QA Card 6).
- ⚠️ **L5 Workflow:** The page shows the platform's pipeline but not the buyer's workflow. A CTO cannot see "how my team uses this on Monday morning" — only "how ROUA processes information internally."

### 2.4 Page-1 gaps (identified, not fixed)

| Gap | Severity | Notes |
|---|---|---|
| L1 Buyer: no named buyer archetype | Medium | Hero says "for Institutions" — generic. Compare to investment-intelligence which names 6 buyer archetypes. |
| L5 Workflow: platform pipeline shown, not buyer workflow | Medium | Platform page by nature shows infrastructure, but buyer still needs to see "how my team engages." |
| L4 Evidence: Aramco trace is conceptual (no live source link) | Low | Wave 2 product pages have live source links (aramco.com, federalreserve.gov, ecb.europa.eu). Platform page's Evidence Trace Demo has no live link — only "Saudi Aramco Q1 2026 Earnings Release · Page 4, Paragraph 3, Revenue Table." |
| L7 Briefing: "Request Platform Briefing" is product-prefixed | Low | Consistent with Wave 2 product pages (product-prefixed pattern). Global normalization is Wave 4. |
| Production Metrics disclaimer: "Continuously updated · Environment: Internal Production Infrastructure" | Low | This is the GDS-2 Customer-Production Boundary rule from Spec v7 — important for trust. Verify this is intentional and accurate. |

---

## 3. Page 2: `developers.html` (683 lines)

### 3.1 Section map

| # | Section | Lines | Role |
|---|---|---|---|
| 1 | Hero | 196-217 | Identity |
| 2 | Scope: What This Page Is (vs Developer Platform) | 219-253 | Positioning |
| 3 | API / Integration Overview (3 surfaces) | 255-281 | Capability |
| 4 | Authentication | 283-309 | Capability (security) |
| 5 | API Surface / Endpoints | 311-383 | Capability (API contract) |
| 6 | Evidence / Provenance Access | 385-416 | Evidence/Proof |
| 7 | Example Request / Response (NVIDIA) | 418-478 | Evidence/Proof (code) |
| 8 | Architecture References | 480-524 | Workflow (integration topology) |
| 9 | Access / Credentials | 526-557 | Briefing (API access process) |
| 10 | Enterprise Integration | 559-593 | Deployment |
| 11 | CTA | 595-608 | Briefing |

### 3.2 7-link test

| Link | Evidence | Verdict |
|---|---|---|
| L1 Buyer | **Explicit and unique.** Hero says: "This page is for the engineers who will build the integration, not the buyer who will sign the contract." Section 2 reinforces: "If your institution has already engaged ROUA and you are the engineer building the integration, this is your page." This is the clearest buyer naming on the entire site. | ✅ PASS (strongest) |
| L2 Problem | **Implicit.** The page does not have a "The Developer Problem" section. The closest is Section 2 scope clarification ("Developer Platform is what you buy. This page is how you integrate.") which frames the problem as "you need to integrate ROUA into your stack." But there is no explicit pain statement (e.g., "Most financial APIs return raw data without provenance — your downstream code cannot verify claims"). | ⚠️ PASS WITH FRICTION |
| L3 Capability | **Strong — the most technically detailed page on the site.** Section 3 "Three integration surfaces" (REST API, Streaming WebSocket, SDK + Components). Section 4 "Authentication" (Scoped API Keys, TLS + Bearer Token, Per-Request Audit). Section 5 "API Surface" — 7 representative endpoints with HTTP method, path, description, and required scope. Section 8 "Architecture References" — 6 integration patterns (Behind Your Stack, Versioned Retrieval, Typed SDK, Embeddable Components, Private Deployment, Observable). | ✅ PASS |
| L4 Evidence/Proof | **Strong — unique code example.** Section 6 "Evidence Access" — 4 cards (Source Anchors, Confidence Signals, Derivation Trace, Evidence Chain Pull). Section 7 "Example Request / Response" — full curl request + JSON response excerpt for NVIDIA Investment Intelligence brief. Response includes: key_facts with evidence object (source_id, source_name, source_tier, document_id, page, paragraph, extraction_confidence, validation_status), derivation object (facts_used, rules_applied, validation_gates_passed), evidence_chain_url. **Clearly labeled as synthetic/illustrative** — "The response below is synthetic — field names, IDs, and values are representative, not production records." | ✅ PASS |
| L5 Workflow | **Strong — integration topology.** Section 8 "Architecture References" — "ROUA does not replace your data warehouse, your OMS, or your editorial CMS. It sits alongside them as an intelligence layer — queried on demand, pushed via stream, or embedded via SDK." 6 integration patterns show where ROUA fits in the engineer's stack. This is the equivalent of financial-media's "Where ROUA Fits in the Newsroom" — integration topology, not buyer workflow. | ✅ PASS |
| L6 Deployment | **Present but distributed.** Section 8 includes "Private Deployment" card. Section 10 "Enterprise Integration" — 4 cards (Private Deployment, Dedicated Source Tiers, Your Audit Trail, White-Label Presentation). No dedicated "Deployment Models" section with 4 options (Cloud SaaS / Private Cloud / On-Premise / Hybrid) like the product pages have. | ⚠️ PASS WITH FRICTION |
| L7 Briefing | **Different journey by design.** CTA (line 601): "Request API Access" (primary) → contact.html. Section 9 "Access / Credentials" explains API access is provisioned through institutional onboarding — not self-serve. Secondary: "Developer Platform Product" → developer-intelligence.html, "Platform Architecture" → architecture.html, "Enterprise Deployment" → enterprise.html. | ✅ PASS (different journey, by design) |

### 3.3 Strategic question

> Does the page make an engineering team lead say *"I want to understand how this can be deployed inside my institution"*?

**Verdict: YES — for the engineering audience. The page is the most technically credible page on the site.**

The page is uniquely strong:
- ✅ Clearest buyer naming on the site ("for the engineers who will build the integration")
- ✅ Most technically detailed capability section (7 representative endpoints with scopes)
- ✅ Unique code example (curl + JSON response with full evidence object)
- ✅ Clear integration topology (6 patterns showing where ROUA fits)
- ✅ Honest about what is illustrative vs production ("synthetic illustrative example")
- ✅ Clear access process (API access is provisioned through institutional onboarding, not self-serve)

But it has 2 frictions:
- ⚠️ **L2 Problem:** No explicit "The Developer Problem" section. The page jumps from hero to scope clarification to capability, without naming the developer's pain (e.g., "Most financial APIs return raw data without provenance — your downstream code cannot verify claims"). The closest is Section 6 "Evidence Access" which implicitly frames the problem by contrasting ROUA with "a generic data API."
- ⚠️ **L6 Deployment:** No dedicated "Deployment Models" section. Deployment information is distributed across Section 8 (Private Deployment card) and Section 10 (Enterprise Integration with 4 cards). An engineer looking for "how do I deploy this?" must scan multiple sections.

### 3.4 Page-2 gaps (identified, not fixed)

| Gap | Severity | Notes |
|---|---|---|
| L2 Problem: no explicit "The Developer Problem" section | Medium | Page jumps from hero to scope to capability without naming the developer's pain. The implicit problem (raw data without provenance) is buried in Section 6. |
| L6 Deployment: no dedicated deployment section | Low | Deployment info distributed across Sections 8 + 10. Compare to product pages which have a dedicated "Deployment Models" section with 4 options. |
| L7 Briefing: "Request API Access" is a different journey | Low (by design) | Wave 1 QA already documented this as "different journey, by design." Not a gap — just a note that developer conversion ≠ institutional briefing. |
| Endpoint surface is "representative and illustrative" | Low (by design) | Page explicitly says "not a production API contract" and "full specification shared during onboarding." This is honest, not a gap — but means the engineer cannot fully evaluate the API without engaging. |
| SDK + Streaming marked "integration roadmap" / "planned" | Low (by design) | Page honestly marks these as planned. Not a gap — but means the engineer sees a partial surface today. |

---

## 4. Cross-Page Analysis

### 4.1 Link-by-link comparison

| Link | platform.html | developers.html |
|---|---|---|
| L1 Buyer | ⚠️ Implicit ("for Institutions") | ✅ Explicit ("for the engineers") |
| L2 Problem | ✅ Strong (rebuild same pipeline) | ⚠️ Implicit (no "Developer Problem" section) |
| L3 Capability | ✅ Strong (7 layers + products) | ✅ Strong (3 surfaces + 7 endpoints + 6 patterns) |
| L4 Evidence | ✅ Operational proof + Aramco trace (no live link) | ✅ Code example with full evidence object (synthetic) |
| L5 Workflow | ⚠️ Platform pipeline, not buyer workflow | ✅ Integration topology (6 patterns) |
| L6 Deployment | ✅ 4 models + scale context | ⚠️ Distributed (no dedicated section) |
| L7 Briefing | ✅ "Request Platform Briefing" | ✅ "Request API Access" (different journey) |

### 4.2 Two patterns observed

**Pattern A — Page type determines link strength:**
- `platform.html` is a **platform/infrastructure page** → strong on capability + deployment, weak on buyer naming + workflow
- `developers.html` is a **developer/integration page** → strong on buyer naming + capability + evidence, weak on problem + deployment consolidation

The 7-link test was designed for product pages (Wave 2). Platform and developer pages have different conversion logic:
- Product page: "Does the buyer see their workflow?"
- Platform page: "Does the CTO see the infrastructure they would adopt?"
- Developer page: "Does the engineer see the API they would integrate?"

**The test still applies, but the "passing bar" shifts.** A platform page can pass without a buyer workflow section (L5) because the buyer is evaluating infrastructure, not their own daily process. A developer page can pass without a dedicated deployment section (L6) because deployment is distributed across integration patterns.

**Pattern B — Evidence quality is strong but different:**
- `platform.html` Evidence Trace Demo: 4-step Aramco trace, conceptual (no live link)
- `developers.html` Example Request/Response: full curl + JSON with evidence object, synthetic (clearly labeled)

Both are honest about being illustrative — but neither has a live source link like the Wave 2 product pages (aramco.com, federalreserve.gov, ecb.europa.eu). This is consistent with the platform/developer page nature (these pages show infrastructure/API, not specific source events), but it means the buyer cannot click through to verify a real source.

### 4.3 The strategic question — answered per page

| Page | Does the buyer say "I want to understand deployment"? | Why or why not |
|---|---|---|
| platform.html | **Partial.** CTO sees strong capability + operational proof + deployment models, but does not see themselves named or their workflow. | L1 + L5 friction |
| developers.html | **Yes.** Engineer sees explicit buyer naming + detailed API surface + code example + integration topology. | Strongest technical credibility on the site |

---

## 5. Gap Summary (Identified Only — No Implementation Recommendations)

### 5.1 `platform.html` gaps

| # | Gap | Severity |
|---|---|---|
| P1 | L1 Buyer: no named buyer archetype (hero says "for Institutions" — generic) | Medium |
| P2 | L5 Workflow: platform pipeline shown, not buyer workflow | Medium |
| P3 | L4 Evidence: Aramco trace is conceptual (no live source link, unlike Wave 2 product pages) | Low |
| P4 | L7 Briefing: "Request Platform Briefing" is product-prefixed (consistent with Wave 2 pattern; global normalization is Wave 4) | Low |

### 5.2 `developers.html` gaps

| # | Gap | Severity |
|---|---|---|
| D1 | L2 Problem: no explicit "The Developer Problem" section | Medium |
| D2 | L6 Deployment: no dedicated deployment section (info distributed across Sections 8 + 10) | Low |
| D3 | L7 Briefing: "Request API Access" is a different journey (by design — not a gap, just a note) | Low (by design) |
| D4 | Endpoint surface is "representative and illustrative" (by design — full spec shared during onboarding) | Low (by design) |
| D5 | SDK + Streaming marked "integration roadmap" / "planned" (by design — honest about current state) | Low (by design) |

### 5.3 Cross-page observations

- Both pages are **structurally strong** — neither requires redesign
- Both pages have **honest evidence** (clearly labeled illustrative/synthetic) — consistent with site-wide pattern
- Both pages have **product-prefixed CTAs** — consistent with Wave 2 pattern (global normalization is Wave 4)
- Neither page touches `index.html` or reopens C3/C4/C5 work
- The 7-link test applies differently to platform/developer pages than to product pages — this is expected, not a gap

---

## 6. Strategic Verdict

### 6.1 Are the 2 pages ready for Wave 3 implementation?

**Per user direction: identify gaps only. No implementation recommendations in this Discovery.**

The gaps are documented in Section 5. The user will decide:
- Which gaps to fix in Wave 3 implementation
- Which gaps to defer to Wave 4
- Whether to proceed to Wave 3 implementation at all

### 6.2 What this Discovery does NOT do

- ❌ Does NOT recommend specific fixes (per user direction)
- ❌ Does NOT prioritize gaps
- ❌ Does NOT estimate implementation effort
- ❌ Does NOT touch any code
- ❌ Does NOT reopen Wave 1/2 work
- ❌ Does NOT move Wave 4 friction points into Wave 3

### 6.3 Wave 4 backlog (carried forward, NOT in Wave 3 scope)

Per user direction, these remain Wave 4:
- Workflow → Deployment handoff (Wave 2 friction)
- CTA → contact context preservation (Wave 2 friction)
- Evidence → Sample Library (Wave 2 friction)
- Global CTA normalization (Wave 2 friction)
- Sovereign friction (Wave 1 friction)

---

## 7. What This Discovery Does NOT Cover

- ❌ Visual rendering (no browser testing) — HTML structure and content only
- ❌ Mobile UX
- ❌ Whether the "Production Metrics · Continuously updated · Environment: Internal Production Infrastructure" disclaimer on platform.html is accurate (GDS-2 Customer-Production Boundary rule)
- ❌ Whether the representative endpoints on developers.html match the actual API contract (cannot verify without onboarding)
- ❌ Analytics / conversion data

---

## 8. Recommendation

**Per user direction: identify gaps only. No implementation recommendations.**

The gaps are documented in Section 5. Awaiting user direction on:
1. Which gaps to fix in Wave 3 implementation
2. Which gaps to defer to Wave 4
3. Whether to proceed to Wave 3 implementation

**No code modified. No commit. Awaiting user strategic decision.**

---

*End of Wave 3 Discovery Report. No code modified. No commit. Awaiting user direction.*

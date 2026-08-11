# Wave 4 — Discovery: Conversion Journey Audit

> **Status:** Audit only. **No code modified. No commit.**
> **Subject:** Wave 4 — Conversion Journey Integrity across all 8 buyer paths
> **Method:** Trace each buyer journey end-to-end:
>   Catalog card → Landing page → Primary CTA → contact.html → Buyer context → What happens next → Institutional assessment → Deployment discussion
> **Output:** Journey matrix with current state / break point / severity / required change per journey
> **Per user direction:** Discovery only. No implementation recommendations beyond gap identification + P0/P1/P2 classification.
> **Baseline:** `c69bf30` (Wave 3 Strategic QA — Wave 3 closed)
> **Date:** 2026-08-11

---

## 1. Method

Wave 4 is the final structural-fix wave before visual/final review. Per user direction, it addresses the gap between "good page" and "coherent institutional buying journey."

**The 8 buyer journeys** (from Wave 1 catalog deployment cards):

| # | Catalog card | Landing page | Primary CTA |
|---|---|---|---|
| 1 | Investment Firm | financial-intelligence.html | "Request Institutional Briefing" |
| 2 | Equity Research Team | investment-intelligence.html | "Request Investment Intelligence Briefing" |
| 3 | Financial Publisher | financial-media.html | "Request a Media Intelligence Briefing" |
| 4 | Trading Platforms & Brokerage | trading-platform.html | "Request Institutional Briefing" |
| 5 | Risk & Compliance Team | risk-intelligence.html | "Request Risk Assessment" |
| 6 | Sovereign & Economic Institutions | enterprise.html | "Request Enterprise Briefing" |
| 7 | Fintech / Developer | developers.html | "Request API Access" |
| 8 | Enterprise / Bank | enterprise.html | "Request Enterprise Briefing" |

**The journey to trace:**

```
Catalog card (buyer context)
   ↓
Landing page (hero receives buyer)
   ↓
Primary CTA (click → contact.html)
   ↓
contact.html (hero + form — does it know why buyer came?)
   ↓
Buyer context preserved? (Interest dropdown pre-selected? Hero personalized?)
   ↓
What happens next (5-stage process — does it reference buyer's workflow?)
   ↓
Institutional assessment (Stage 01 — does it name buyer's use case?)
   ↓
Deployment discussion (Stage 05 — does it reference buyer's deployment model?)
```

**Break point = any link where buyer context is lost or generic.**

---

## 2. Journey Matrix

### Journey 1: Investment Firm → financial-intelligence.html

| Step | Current state | Break? |
|---|---|---|
| Catalog card | "Investment Firm" — buyer named, challenge described, 4 core workflows listed, CTA "View Investment Workflow →" | ✅ |
| Landing page hero | "Investment Intelligence Solution" eyebrow, "Investment Intelligence Built on Verified Financial Information" h1 — buyer received | ✅ |
| Primary CTA | "Request Institutional Briefing" (line 519) → contact.html | ✅ |
| contact.html hero | Generic: "Request an institutional briefing." — no mention of Investment | ⚠️ **BREAK** |
| contact.html Interest dropdown | "Investment Intelligence" is option 1 of 8 — NOT pre-selected | ⚠️ **BREAK** |
| What To Expect (5 stages) | Generic stages — no Investment-specific context | ⚠️ **BREAK** |
| Stage 01 Institutional Assessment | Generic — no mention of investment workflow | ⚠️ **BREAK** |
| Stage 05 Deployment Planning | Generic — no mention of investment deployment model | ⚠️ **BREAK** |

**Journey verdict:** 4 breaks. Buyer context lost at contact.html handoff.

| Field | Value |
|---|---|
| Break point | contact.html (all 4 steps after CTA) |
| Severity | **P0** — CTA context preservation |
| Required change | contact.html must know buyer came from Investment Intelligence page (URL parameter or referrer detection → pre-select Interest + personalize hero) |

---

### Journey 2: Equity Research Team → investment-intelligence.html

| Step | Current state | Break? |
|---|---|---|
| Catalog card | "Equity Research Team" — buyer named, CTA "View Research Workflow →" | ✅ |
| Landing page hero | "Investment Intelligence" eyebrow, "Evidence-backed intelligence for investment research." h1 — buyer received (research-coded) | ✅ |
| Primary CTA | "Request Investment Intelligence Briefing" (line 579) → contact.html | ✅ |
| contact.html hero | Generic — no mention of Investment Intelligence or research | ⚠️ **BREAK** |
| contact.html Interest dropdown | "Investment Intelligence" is option 1 of 8 — NOT pre-selected | ⚠️ **BREAK** |
| What To Expect | Generic — no research context | ⚠️ **BREAK** |
| Stage 01 / Stage 05 | Generic | ⚠️ **BREAK** |

**Journey verdict:** 4 breaks. Same as Journey 1 — contact.html is generic.

| Field | Value |
|---|---|
| Break point | contact.html (all 4 steps after CTA) |
| Severity | **P0** — CTA context preservation |
| Required change | Same as Journey 1 (contact.html personalization) |

---

### Journey 3: Financial Publisher → financial-media.html

| Step | Current state | Break? |
|---|---|---|
| Catalog card | "Financial Publisher" — buyer named, CTA "View Editorial Workflow →" | ✅ |
| Landing page hero | "Media Intelligence Solution" eyebrow — buyer received | ✅ |
| Primary CTA | "Request a Media Intelligence Briefing" (line 519) → contact.html | ✅ |
| contact.html hero | Generic — no mention of Media | ⚠️ **BREAK** |
| contact.html Interest dropdown | "Media Intelligence" is option 4 of 8 — NOT pre-selected | ⚠️ **BREAK** |
| What To Expect | Generic — no media/editorial context | ⚠️ **BREAK** |
| Stage 01 / Stage 05 | Generic | ⚠️ **BREAK** |

**Journey verdict:** 4 breaks. Same pattern.

| Field | Value |
|---|---|
| Break point | contact.html (all 4 steps after CTA) |
| Severity | **P0** — CTA context preservation |
| Required change | Same as Journey 1 (contact.html personalization) |

---

### Journey 4: Trading Platforms & Brokerage → trading-platform.html

| Step | Current state | Break? |
|---|---|---|
| Catalog card | "Trading Platforms & Brokerage Institutions" — buyer named, CTA "View Trading Workflow →" | ✅ |
| Landing page hero | "Market & Trading Intelligence Platform" eyebrow — buyer received | ✅ |
| Primary CTA | "Request Institutional Briefing" (line 413) → contact.html | ✅ |
| contact.html hero | Generic | ⚠️ **BREAK** |
| contact.html Interest dropdown | "Market & Trading Intelligence" is option 2 of 8 — NOT pre-selected | ⚠️ **BREAK** |
| What To Expect / Stages | Generic | ⚠️ **BREAK** |

**Journey verdict:** 4 breaks. Same pattern.

| Field | Value |
|---|---|
| Break point | contact.html |
| Severity | **P0** — CTA context preservation |
| Required change | Same as Journey 1 |

---

### Journey 5: Risk & Compliance Team → risk-intelligence.html

| Step | Current state | Break? |
|---|---|---|
| Catalog card | "Risk & Compliance Team" — buyer named, CTA "View Risk Workflow →" | ✅ |
| Landing page hero | "Risk Intelligence" eyebrow — buyer received | ✅ |
| Primary CTA | **"Request Risk Assessment"** (line 631) → contact.html | ⚠️ **BREAK** (CTA text inconsistency — "Assessment" not "Briefing") |
| contact.html hero | Generic | ⚠️ **BREAK** |
| contact.html Interest dropdown | "Risk Intelligence" is option 3 of 8 — NOT pre-selected | ⚠️ **BREAK** |
| What To Expect / Stages | Generic | ⚠️ **BREAK** |

**Journey verdict:** 5 breaks. Same pattern + CTA text inconsistency (risk-intelligence.html still says "Assessment" — this was flagged in Wave 1 QA and Wave 2 Discovery but NOT fixed because risk-intelligence.html was not in Wave 2 scope).

| Field | Value |
|---|---|
| Break point | CTA text + contact.html |
| Severity | **P0** — CTA context preservation + **P1** — CTA normalization |
| Required change | contact.html personalization + normalize "Request Risk Assessment" → "Request a Risk Intelligence Briefing" |

---

### Journey 6: Sovereign & Economic Institutions → enterprise.html

| Step | Current state | Break? |
|---|---|---|
| Catalog card | "Sovereign & Economic Institutions" — buyer named, CTA "View Sovereign Workflow →" | ✅ |
| Landing page hero | "Enterprise Solutions" eyebrow — **generic, does NOT name Sovereign** | ⚠️ **BREAK** (Wave 1 QA friction — deferred) |
| Sovereign buyer reception | Deferred to deployment model 3 (line 258: "Banks, sovereign funds...") | ⚠️ **BREAK** (Wave 1 QA friction) |
| Primary CTA | "Request Enterprise Briefing" (line 451) → contact.html | ✅ |
| contact.html hero | Generic | ⚠️ **BREAK** |
| contact.html Interest dropdown | No "Sovereign" or "Enterprise" option — closest is "Intelligence Infrastructure" or "Not sure" | ⚠️ **BREAK** |
| What To Expect / Stages | Generic | ⚠️ **BREAK** |

**Journey verdict:** 6 breaks. The weakest journey — Sovereign buyer is not received at landing page hero (Wave 1 friction), not pre-selected in contact form, and has no matching Interest option.

| Field | Value |
|---|---|
| Break point | Landing hero + contact.html |
| Severity | **P1** — Sovereign friction (Wave 1 backlog) + **P0** — CTA context preservation |
| Required change | enterprise.html hero refinement (name sovereign) + contact.html personalization + add "Enterprise / Sovereign" Interest option |

---

### Journey 7: Fintech / Developer → developers.html

| Step | Current state | Break? |
|---|---|---|
| Catalog card | "Fintech / Developer" — buyer named, CTA "View Developer Path →" | ✅ |
| Landing page hero | "Developer Portal" eyebrow, "How developers integrate with ROUA." h1 — buyer received (engineer-coded) | ✅ |
| Primary CTA | "Request API Access" (line 590) → contact.html | ✅ (different journey by design — Wave 1 QA documented) |
| contact.html hero | Generic ("Institutional Briefing") — does NOT match "API Access" framing | ⚠️ **BREAK** (different journey, but contact form still generic) |
| contact.html Interest dropdown | "Developer Platform" is option 5 of 8 — NOT pre-selected | ⚠️ **BREAK** |
| What To Expect (5 stages) | Generic institutional briefing stages — does NOT match developer onboarding flow described on developers.html | ⚠️ **BREAK** (developers.html describes API onboarding, contact.html describes institutional briefing — mismatch) |

**Journey verdict:** 3 breaks. The developer journey is structurally different (API access ≠ institutional briefing), but contact.html treats it the same as all other journeys. The developer arrives at a generic institutional briefing form after clicking "Request API Access."

| Field | Value |
|---|---|
| Break point | contact.html (hero + form + What To Expect mismatch) |
| Severity | **P0** — CTA context preservation (developer-specific) |
| Required change | contact.html must detect developer journey and either (a) personalize for API access onboarding, or (b) route to a developer-specific contact path |

---

### Journey 8: Enterprise / Bank → enterprise.html

| Step | Current state | Break? |
|---|---|---|
| Catalog card | "Enterprise / Bank" — buyer named, CTA "View Enterprise Workflow →" | ✅ |
| Landing page hero | "Enterprise Solutions" eyebrow — buyer received (enterprise-coded) | ✅ |
| Primary CTA | "Request Enterprise Briefing" (line 451) → contact.html | ✅ |
| contact.html hero | Generic | ⚠️ **BREAK** |
| contact.html Interest dropdown | No "Enterprise" option — closest is "Intelligence Infrastructure" or "Not sure" | ⚠️ **BREAK** |
| What To Expect / Stages | Generic | ⚠️ **BREAK** |

**Journey verdict:** 4 breaks. Same pattern as other journeys, plus no matching Interest option for Enterprise.

| Field | Value |
|---|---|
| Break point | contact.html (hero + Interest dropdown + stages) |
| Severity | **P0** — CTA context preservation + **P1** — Interest dropdown gap |
| Required change | contact.html personalization + add "Enterprise / Sovereign" Interest option |

---

## 3. Cross-Journey Pattern Analysis

### 3.1 The universal break: contact.html is generic

**Every single journey (8/8) breaks at contact.html.** The buyer context — which product, which buyer archetype, which workflow — is lost the moment the buyer clicks the primary CTA. contact.html treats all buyers identically:
- Same generic hero ("Request an institutional briefing.")
- Same generic What To Expect (5 stages, no product context)
- Same generic form (Interest dropdown NOT pre-selected, no buyer context)
- Same generic submit button ("Request an Institutional Briefing")

**This is the single biggest conversion leak in the entire site.** The landing pages do excellent work receiving the buyer (Wave 2 + Wave 3 fixes), but all that work is lost at the handoff.

### 3.2 The CTA text variance (still present)

| Landing page | Primary CTA text | Pattern |
|---|---|---|
| financial-intelligence.html | "Request Institutional Briefing" | Generic |
| investment-intelligence.html | "Request Investment Intelligence Briefing" | Product-prefixed |
| financial-media.html | "Request a Media Intelligence Briefing" | Product-prefixed |
| trading-platform.html | "Request Institutional Briefing" | Generic |
| risk-intelligence.html | **"Request Risk Assessment"** | **Outlier (not "Briefing")** |
| enterprise.html | "Request Enterprise Briefing" | Product-prefixed |
| developers.html | "Request API Access" | Different journey (by design) |
| platform.html | "Request Platform Briefing" | Product-prefixed |

**risk-intelligence.html is the only page still using "Assessment" instead of "Briefing."** This was flagged in Wave 1 QA and Wave 2 Discovery but never fixed (risk-intelligence.html was not in Wave 2 scope).

### 3.3 The Workflow → Deployment handoff (P0 #2)

Per user direction, this is a P0 priority. Current state:

| Page | Workflow section | Deployment section | Explicit handoff? |
|---|---|---|---|
| investment-intelligence.html | "How It Works" (6-step buyer workflow, Wave 2) | "Deployment" (4 models) | ❌ No explicit handoff — workflow ends at "Defensible Output", deployment is separate section |
| market-intelligence.html | "How It Works" (5-step buyer workflow) | "Deployment Models" (4 models) | ❌ No explicit handoff — workflow ends at "Post-Decision Review", deployment is separate |
| financial-media.html | "Media Intelligence Workflows" (5 workflows) | "Media Adoption Models" (3 models) | ❌ No explicit handoff |
| risk-intelligence.html | (workflow present) | "Deployment" (4 models) | ❌ No explicit handoff |
| platform.html | "How ROUA Lives Inside Your Institution" (5-step adoption workflow, Wave 3) | "Enterprise Deployment" (4 models) | ⚠️ Partial — Step 02 "ROUA Deployed Alongside" references deployment models but does not link to deployment section |
| developers.html | (integration topology in "Architecture References") | (distributed across Sections 8 + 10) | ❌ No explicit handoff |

**Pattern:** Every product/platform page has a Workflow section AND a Deployment section, but NONE explicitly connect them. The buyer sees "how I use ROUA" and separately "where ROUA runs" — but never sees "how my workflow leads to my deployment."

**The user's desired flow:** `Workflow → How deployed → What happens next → Briefing`

### 3.4 The Evidence → Sample Library handoff (P0 #3)

Per user direction, this is a P0 priority. Current state:

| Page | Evidence sample in content | Links to Sample Library? |
|---|---|---|
| investment-intelligence.html | Aramco Q1 2026 sample (hero glass card) | ❌ Only in nav/footer — NOT in content body |
| market-intelligence.html | FOMC July 29 2026 sample (hero + walkthrough section) | ❌ Only in nav/footer |
| financial-media.html | ECB July 16 2026 sample (Evidence Demonstration section, Wave 2) | ✅ "View Sample Intelligence Outputs" CTA (line 520) — ONLY page with content-body link |
| risk-intelligence.html | OFAC sample (hero glass card) | ❌ Only in nav/footer |
| platform.html | Aramco trace (conceptual, no live link) | ❌ Only in nav/footer |
| developers.html | NVIDIA code example (synthetic) | ❌ Only in nav/footer |

**Pattern:** financial-media.html is the ONLY page that links from its evidence demonstration to sample-library.html in the content body. All other pages have Sample Library only in nav/footer — the buyer must know to look there.

**Sample Library status:** sample-library.html has 6 samples (FOMC, Earnings, Market Impact, Risk Alert, Media, API) with real source links (federalreserve.gov, aramco.com). The library EXISTS and is populated — the problem is the pages don't link to it from their evidence sections.

---

## 4. P0 / P1 / P2 Classification

### P0 — Must address first (per user direction)

| # | Friction | Scope | Affected journeys |
|---|---|---|---|
| P0-1 | **CTA → Contact Context Preservation** | contact.html | All 8 journeys |
| P0-2 | **Workflow → Deployment Handoff** | All product/platform pages | All 8 journeys |
| P0-3 | **Evidence → Sample Library** | All product/platform pages (except financial-media) | 7 of 8 journeys |

### P1 — Address after P0

| # | Friction | Scope | Affected journeys |
|---|---|---|---|
| P1-1 | Sovereign friction (enterprise.html hero does not name sovereign) | enterprise.html | Journey 6 |
| P1-2 | Global CTA normalization (risk-intelligence "Assessment" + variance) | risk-intelligence.html + all landing pages | Journey 5 + all |
| P1-3 | platform.html P3 — Aramco trace live source link | platform.html | Journey 7 (platform) |
| P1-4 | developers.html D2 — deployment consolidation | developers.html | Journey 7 |
| P1-5 | contact.html Interest dropdown missing "Enterprise / Sovereign" option | contact.html | Journeys 6 + 8 |

### P2 / Do NOT touch (per user direction)

| # | Friction | Reason |
|---|---|---|
| P2-1 | developers.html D3 — "Request API Access" | Different journey by design — changing it would harm page honesty |
| P2-2 | developers.html D4 — endpoint surface "representative and illustrative" | By design — full spec shared during onboarding |
| P2-3 | developers.html D5 — SDK + Streaming "planned" | By design — honest about current state |

---

## 5. The Universal Break: contact.html Deep Dive

Since P0-1 (CTA → Contact Context Preservation) affects ALL 8 journeys, it deserves a focused analysis.

### 5.1 What contact.html currently does

When a buyer clicks ANY primary CTA on ANY landing page, they arrive at contact.html which shows:

1. **Title:** "ROUA — Request an Institutional Briefing" (generic)
2. **Hero eyebrow:** "Institutional Briefing Request" (generic)
3. **Hero h1:** "Request an institutional briefing." (generic)
4. **Hero paragraph:** "Every briefing follows a structured five-stage process — from institutional assessment to deployment planning." (generic)
5. **What A Briefing Can Cover:** 4 cards (Product Fit, Evidence Requirements, Deployment Model, Institutional Workflow) — generic
6. **What To Expect:** 5 stages (Institutional Assessment → Source & Workflow Mapping → Workflow Demonstration → Pilot Definition → Deployment Planning) — generic
7. **Form eyebrow:** "Request an Institutional Briefing" (generic)
8. **Form fields:** Name, Work Email, Organization, Role, Interest (dropdown, NOT pre-selected), optional workflow question, Deployment Context (dropdown, NOT pre-selected), Message
9. **Submit button:** "Request an Institutional Briefing" (generic)

**Every element is generic.** The buyer's context (which product, which buyer archetype, which workflow) is lost.

### 5.2 What contact.html should do (per user direction)

The user said: *"contact.html must know why the buyer came."* This requires:

1. **URL parameter detection:** Landing page CTAs should pass context: `contact.html?product=investment-intelligence&buyer=research-team`
2. **Dynamic hero:** Hero h1 + eyebrow + paragraph personalize based on URL parameter
3. **Pre-selected Interest dropdown:** Form auto-selects the matching Interest option
4. **Personalized What To Expect:** Stages reference the buyer's specific workflow (e.g., "Stage 03 — Workflow Demonstration: We walk through the investment research workflow with your team")
5. **Optional: personalized submit button** ("Request an Investment Intelligence Briefing" instead of generic)

### 5.3 Technical approach (identified, not recommended — per user direction)

Three options exist:
- **(a) URL parameter + JavaScript:** `contact.html?product=X` → JS reads parameter, updates DOM. Simplest, no backend.
- **(b) Per-product briefing pages:** 5 separate pages (investment-contact.html, market-contact.html, etc.). Most control, most maintenance.
- **(c) Server-side personalization:** Backend reads parameter, renders personalized HTML. Most robust, requires backend.

**Per user direction: identify gaps only. No implementation recommendations.** The user will choose the approach in Wave 4 Implementation.

---

## 6. Journey Integrity Score

| Journey | Breaks | P0 issues | P1 issues | Score |
|---|---|---|---|---|
| 1. Investment Firm | 4 | 3 (P0-1, P0-2, P0-3) | 0 | 4/8 links broken |
| 2. Equity Research | 4 | 3 | 0 | 4/8 |
| 3. Financial Publisher | 4 | 2 (P0-1, P0-2) — P0-3 already fixed | 0 | 3/8 |
| 4. Trading Platforms | 4 | 3 | 0 | 4/8 |
| 5. Risk & Compliance | 5 | 3 | 1 (CTA normalization) | 5/8 |
| 6. Sovereign | 6 | 1 (P0-1) | 2 (Sovereign friction, Interest dropdown) | 6/8 |
| 7. Fintech/Developer | 3 | 3 (P0-1 developer-specific, P0-2, P0-3) | 0 | 3/8 |
| 8. Enterprise/Bank | 4 | 1 (P0-1) | 1 (Interest dropdown) | 4/8 |

**Average: 4.1/8 links broken per journey.** The site has good pages but broken journeys.

---

## 7. What This Discovery Does NOT Do

- ❌ Does NOT recommend specific implementation approach (per user direction)
- ❌ Does NOT prioritize P0 items against each other (user already prioritized)
- ❌ Does NOT estimate implementation effort
- ❌ Does NOT touch any code
- ❌ Does NOT revisit Wave 1/2/3 closed work
- ❌ Does NOT address P2 items (user said do not touch)

---

## 8. Strategic Verdict

### 8.1 The site's core problem is now visible

After 3 waves of page-level fixes, the site has **good pages but broken journeys**. Each landing page receives its buyer well (Wave 2 + Wave 3 verified this). But the moment the buyer clicks the primary CTA, all context is lost at contact.html.

**The single highest-leverage fix is P0-1 (CTA → Contact Context Preservation).** It affects all 8 journeys and would convert 8 broken handoffs into 8 coherent journeys.

### 8.2 P0-2 and P0-3 are page-level fixes

- **P0-2 (Workflow → Deployment Handoff):** Each product/platform page needs an explicit connection between its Workflow section and Deployment section. This is a per-page fix (6+ pages).
- **P0-3 (Evidence → Sample Library):** Each product/platform page needs a content-body link from its evidence section to sample-library.html. This is a per-page fix (5+ pages, financial-media already done).

### 8.3 Recommendation

**Per user direction: identify gaps only. No implementation recommendations.**

The journey matrix in Section 2 + P0/P1/P2 classification in Section 4 provide the complete picture. The user will decide:
1. Which P0 items to fix in Wave 4 Implementation
2. Which P1 items to include vs defer
3. What implementation approach to use for contact.html personalization
4. Whether to follow the same Discovery → Implementation → QA pattern

**No code modified. No commit. Awaiting user strategic decision on Wave 4 Implementation scope.**

---

*End of Wave 4 Discovery Report. No code modified. No commit. Awaiting user direction.*

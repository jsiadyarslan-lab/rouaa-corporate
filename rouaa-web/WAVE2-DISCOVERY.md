# Wave 2 — Discovery & Strategic QA

> **Status:** Audit only. **No code modified. No commit.**
> **Subject:** Wave 2 product pages — strategic conversion readiness
> **Pages:** `investment-intelligence.html` · `market-intelligence.html` · `financial-media.html`
> **Method:** Apply the 7-link test per page:
>   **Buyer → Problem → ROUA capability → Evidence/Proof → Workflow → Deployment → Institutional Briefing**
> **Strategic question:** Does the page make a Head of Research / Investment Manager / Editorial Director say
>   *"I want to understand how this can be deployed inside my institution"* —
>   not just *"this is a good product page"*?
> **Baseline:** `d5187aa` (Wave 1 Strategic QA)
> **Date:** 2026-08-11

---

## 1. Method

For each product page, I read the full HTML and evaluate seven conversion links:

| Link | Question |
|---|---|
| **L1 Buyer** | Does the page name the buyer explicitly in the hero or first sections? |
| **L2 Problem** | Does the page name a specific institutional pain (not a generic one)? |
| **L3 Capability** | Does the page show what ROUA actually does — not adjectives, but capabilities? |
| **L4 Evidence/Proof** | Does the page prove its claims (sample objects, evidence chain, source links)? |
| **L5 Workflow** | Does the page show how ROUA enters the institution's existing workflow? |
| **L6 Deployment** | Does the page describe how ROUA deploys (cloud / private / on-prem / hybrid)? |
| **L7 Briefing** | Does the page lead to a clear, institutional next step — not a soft "learn more"? |

**Passing the 7-link test is necessary but not sufficient.** The strategic question is whether the buyer, after reading the page, wants to understand **deployment inside their institution**. A page that passes all 7 links mechanically but does not trigger that question is a *product page*, not a *conversion page*.

---

## 2. Page 1: `investment-intelligence.html` (636 lines)

### 2.1 Section map

| # | Section | Lines | Role |
|---|---|---|---|
| 1 | Hero (product-forward, glass status card) | 125-218 | Identity |
| 2 | The Investment Research Problem | 221-264 | Problem |
| 3 | What Investment Intelligence Produces | 267-309 | Capability (outputs) |
| 4 | Capabilities (4 cards + What You Receive + Differentiation + Evidence Chain) | 311-422 | Capability + Proof |
| 5 | How It Works (5-step pipeline) | 424-475 | Workflow |
| 6 | Built For Investment Teams & Institutions | 479-520 | Buyer |
| 7 | Deployment (4 models) | 524-551 | Deployment |
| 8 | CTA + Briefing Includes | 553-576 | Briefing |

### 2.2 7-link test

| Link | Evidence | Verdict |
|---|---|---|
| L1 Buyer | "Built For Investment Teams & Institutions" section (line 480): 6 named buyer archetypes — Asset Managers, Investment Firms, CIO Offices, Sovereign Wealth Funds, Pension Funds, Investment Committees. Each with outcome statement. | ✅ PASS |
| L2 Problem | "The Investment Research Problem" (line 222): 4 specific pains — Research Without Proof, Earnings Without Context, Valuation Without Evidence Context, Research Reconstruction. Each pain names a real institutional friction. | ✅ PASS |
| L3 Capability | "Capabilities" section (line 312): 4 capabilities — Research Intelligence, Research Evidence, Scenario Analysis, Investment Briefings. Plus "What You Receive" (6 outputs: Company Intelligence, Earnings Intelligence, Equity & Valuation Context, Portfolio Briefings, Macro & Sector Briefings, Evidence-linked Research). | ✅ PASS |
| L4 Evidence/Proof | **Strongest in the 3 pages.** Hero has a live Sample Intelligence Object (Aramco Q1 2026) with verified fact ($33.6B adjusted net income), source document link (aramco.com), provenance, and link to Evidence Explorer. Capabilities section has Evidence Chain visual (Company Event → Official Disclosure → Source-Linked Financial Facts → Evidence Chain → Research Context → Investment Conclusion). Differentiation panel compares Bloomberg / AI Research Tools / ROUA. | ✅ PASS (strong) |
| L5 Workflow | "How It Works" (line 425): 5-step pipeline — Source Detection → Evidence Extraction → Context Intelligence → Intelligence Reasoning → Investment Intelligence Output. Each step names the engine (ROUA Engine, Evidence Engine, Knowledge Graph, Analyst + Reasoning Engine, Research Workflow). | ✅ PASS |
| L6 Deployment | "Deployment" section (line 525): 4 models — Cloud SaaS, Private Cloud, On-Premise, Hybrid. Each with one-line description and ideal-for buyer. | ✅ PASS |
| L7 Briefing | CTA (line 554): "Request an Investment Intelligence Briefing" (primary) → contact.html. Plus "Briefing Includes" box (4 items: workflow review, governance gap analysis, recommended deployment model, pilot workflow proposal). Secondary: View Architecture, Back to Catalog. | ✅ PASS |

### 2.3 Strategic question

> Does the page make a Head of Research say *"I want to understand how this can be deployed inside my institution"*?

**Verdict: YES — with one caveat.**

The page is structurally excellent. It has all 7 links, the evidence layer is the strongest of the 3 pages (live Aramco sample object in hero), and the "Briefing Includes" box explicitly names deployment model recommendation + pilot workflow proposal — which primes the buyer to think about deployment before they even click.

**Caveat (L5 Workflow):** The "How It Works" pipeline describes ROUA's internal pipeline (Source Detection → Evidence Extraction → Context Intelligence → Intelligence Reasoning → Output). This is the *engine's* workflow, not the *buyer's* workflow. The buyer's workflow is: "How does my analyst use this on Monday morning?" The page does not show:
- Where the analyst logs in
- What they see first
- How ROUA output enters their existing research process
- What handoff points exist between ROUA output and the institution's downstream systems (Bloomberg, factset, internal research tools)

The "Built For" section names buyers but does not show the buyer's day-1 workflow.

**This is the page's single biggest gap.** It proves what ROUA *is* and *produces*, but does not prove how ROUA *enters* the institution. The buyer leaves thinking "this is a good product" — not "I want to understand how this deploys inside my firm."

### 2.4 Page-1 findings

| Finding | Severity | Wave 2 fix? |
|---|---|---|
| L5 Workflow is engine-pipeline, not buyer-workflow | **High** — strategic | YES (Wave 2 core) |
| "Briefing Includes" box does not reference the 5-stage process from contact.html / catalog.html | Low — consistency | Wave 4 |
| Hero is product-forward (good) but does not name the buyer archetype | Low — hero already strong | Wave 4 |
| No "What Happens Next" 5-stage section (unlike catalog.html post-Wave 1) | Low — consistency | Wave 4 |

---

## 3. Page 2: `market-intelligence.html` (734 lines)

### 3.1 Section map

| # | Section | Lines | Role |
|---|---|---|---|
| 1 | Hero (product-forward, glass status card with FOMC sample) | 144-237 | Identity |
| 2 | Positioning (Bloomberg / AI News / ROUA comparison) | 240-264 | Differentiation |
| 3 | The Market Problem (5 cards) | 266-307 | Problem |
| 4 | Capabilities (4 cards) | 309-340 | Capability |
| 5 | How It Works (5-step buyer workflow) | 342-393 | Workflow |
| 6 | Evidence Example — FOMC Decision | 395-501 | Evidence/Proof |
| 7 | Buyer Environments (2 primary + 4 secondary) | 502-549 | Buyer |
| 8 | Business Outcomes (Before → After, 4 pairs) | 552-599 | Outcome |
| 9 | Deployment Models (4 models) | 602-649 | Deployment |
| 10 | CTA + Assessment Includes | 652-674 | Briefing |

### 3.2 7-link test

| Link | Evidence | Verdict |
|---|---|---|
| L1 Buyer | "Buyer Environments" (line 503): 2 primary (Market Intelligence Teams, Trading Desks) + 4 secondary (Heads of Research, Portfolio Managers, Market Strategists, Risk Teams). Each with one-line role description. | ✅ PASS |
| L2 Problem | "The Market Problem" (line 267): 5 cards — Context Loss, Price Without Cause, Market Moves Without Context, Decisions Without Proof, Decision Accountability. Each names a specific institutional friction. | ✅ PASS |
| L3 Capability | "Capabilities" (line 310): 4 capabilities — Economic & Market Event Intelligence, Market Impact Analysis, Macro & Sector Intelligence, Scenario & Outlook Intelligence. | ✅ PASS |
| L4 Evidence/Proof | **Strongest evidence example on the site.** Hero has live FOMC July 29 2026 sample object (verified event + source link to federalreserve.gov + ROUA Market Context illustrative). Plus dedicated "Evidence Example — FOMC Decision" section (line 396) — a full walkthrough of how one FOMC statement becomes market intelligence. This is deeper than the investment page's hero sample. | ✅ PASS (strongest) |
| L5 Workflow | "How It Works" (line 343): 5-step **buyer workflow** — Pre-Session Monitoring → Event Detection & Verification → Impact Assessment → Trading/Research Decision → Post-Decision Review. Each step has a buyer-context tag (Before the market opens / When an event breaks / Connecting event to exposure / Acting with evidence / Audit & governance). | ✅ PASS (best of 3) |
| L6 Deployment | "Deployment Models" (line 603): 4 models — Cloud SaaS, Private Cloud, On-Premise, Hybrid. Each with deployment number, description, and "Ideal For" buyer. | ✅ PASS |
| L7 Briefing | CTA (line 653): **"Request Market Assessment"** (primary) → contact.html. Plus "Assessment Includes" box. Secondary: Back to Catalog, View Architecture. | ⚠️ PASS WITH FRICTION |

### 3.3 Strategic question

> Does the page make a Head of Research / Market Intelligence Lead say *"I want to understand how this can be deployed inside my institution"*?

**Verdict: YES — strongest of the 3 pages.**

This page is the gold standard. It has:
- All 7 links present
- The **only buyer-workflow** (not engine-pipeline) "How It Works" of the 3 pages — explicitly tagged with buyer context ("Before the market opens", "When an event breaks", etc.)
- The deepest evidence example (full FOMC walkthrough section)
- A "Business Outcomes" section with Before → After pairs that show what changes
- Buyer environments clearly separated into primary vs. secondary

**The buyer leaves this page thinking "I can see how this fits my operation" — which is exactly the strategic goal.**

### 3.4 Page-2 findings

| Finding | Severity | Wave 2 fix? |
|---|---|---|
| **L7 Briefing CTA says "Request Market Assessment" — NOT "Briefing"** | **High — inconsistency with spec 05.14** | YES (Wave 2 — already flagged in Wave 1 QA as D.10-class) |
| "Assessment Includes" box label — same inconsistency | Medium | YES (paired with CTA fix) |
| L5 Workflow is excellent — keep as reference pattern for other pages | — | No fix — preserve |
| No "What Happens Next" 5-stage section (unlike catalog.html post-Wave 1) | Low — consistency | Wave 4 |

**The "Request Market Assessment" inconsistency is the same pattern flagged in Wave 1 QA for risk-intelligence.html ("Request Risk Assessment").** Both pages use "Assessment" instead of "Briefing" — which (a) contradicts spec 05.14's canonical "Request an Institutional Briefing", and (b) frames the engagement as an assessment rather than a briefing. The user explicitly flagged this in the Wave 1 QA decision: *"الـ CTA المؤسسي النهائي ينبغي أن يقود إلى briefing/engagement، لا إلى وعد مختلف بالـ assessment."*

This is a Wave 2 fix, not a backlog item.

---

## 4. Page 3: `financial-media.html` (455 lines)

### 4.1 Section map

| # | Section | Lines | Role |
|---|---|---|---|
| 1 | Hero (text-only, no glass card) | 107-119 | Identity |
| 2 | The Media Problem (3 cards) | 121-143 | Problem |
| 3 | Media Intelligence Workflows (5 numbered items + Publishing Agent) | 145-197 | Capability + Workflow |
| 4 | Editorial Value (4 cards) | 199-225 | Outcome |
| 5 | Powered by Financial Intelligence Pipes + One Event → Multiple Media Products | 228-274 | Capability (proof) |
| 6 | Who Uses ROUA In Media (5 profiles) | 276-306 | Buyer |
| 7 | Media Adoption Models (3 models) | 308-330 | Deployment |
| 8 | Where ROUA Fits in the Newsroom (4-stage flow) | 332-368 | Workflow (deployment-specific) |
| 9 | The Product Behind the Workflow | 370-380 | Cross-link to media-intelligence product page |
| 10 | CTA | 382-395 | Briefing |

### 4.2 7-link test

| Link | Evidence | Verdict |
|---|---|---|
| L1 Buyer | "Who Uses ROUA In Media" (line 277): 5 profiles — Newsrooms, Data Desks, Research Teams, Content Platforms, Financial Information Platforms. Each with one-line description. | ✅ PASS |
| L2 Problem | "The Media Problem" (line 122): 3 cards — Speed Problem, Accuracy Problem, Defensibility Problem. Generic but accurate for media buyers. | ✅ PASS (thin) |
| L3 Capability | "Media Intelligence Workflows" (line 146): 5 numbered workflows — Financial Intelligence Monitoring, Evidence-Backed Financial Publishing, Research Generation & Intelligence Reports, White-Label Intelligence Systems, Multi-Format Output. Plus "One Event → Multiple Media Products" visual showing 8 output formats from 1 event. | ✅ PASS |
| L4 Evidence/Proof | ⚠️ **Weakest of the 3 pages.** No live sample object in hero (text-only hero). No source-link example. No evidence chain visual. The "One Event → Multiple Media Products" diagram is conceptual (ECB Rate Decision → 8 outputs) but uses no real source link, no real verified fact, no real provenance. The investment page has Aramco Q1 2026 with a real aramco.com link. The market page has FOMC July 29 2026 with a real federalreserve.gov link. **The media page has only a conceptual diagram.** | ⚠️ PASS WITH FRICTION |
| L5 Workflow | "Where ROUA Fits in the Newsroom" (line 333): 4-stage flow — Official Sources → ROUA Media Intelligence (Verify / Evidence / Drafts / Feeds) → Editorial Systems (CMS / Editorial review / Approval) → Published Content (Website / Terminal / Newsletter / API). This is a **deployment-specific workflow** — it shows where ROUA sits in the newsroom stack. It is the only page that shows the integration topology explicitly. | ✅ PASS |
| L6 Deployment | "Media Adoption Models" (line 309): 3 models — Platform Access, White Label, Private Deployment. Fewer than the other 2 pages (which have 4 each) — but appropriate for media (Hybrid is less common in newsrooms). | ✅ PASS |
| L7 Briefing | CTA (line 383): "Request a Media Intelligence Briefing" (primary) → contact.html. Secondary: View Sample Intelligence Outputs, Explore Media Intelligence. | ✅ PASS |

### 4.3 Strategic question

> Does the page make an Editorial Director / Chief Content Officer say *"I want to understand how this can be deployed inside my newsroom"*?

**Verdict: PARTIAL — the page proves the workflow but not the evidence.**

This page has a unique strength: it is the **only page of the 3 that shows the integration topology explicitly** (Official Sources → ROUA → Editorial Systems → Published Content). A media buyer can see exactly where ROUA sits in their stack. That is a deployment-triggering visualization.

But it has a critical weakness: **no live evidence object**. The investment page shows a real Aramco fact with a real source link. The market page shows a real FOMC event with a real source link. The media page shows only a conceptual "ECB Rate Decision" diagram with no source link, no verified fact, no provenance.

For a media buyer — whose entire job is "is this claim defensible?" — the absence of a real evidence example is a significant gap. The page tells the media buyer that ROUA produces evidence-backed content, but does not *show* what that evidence looks like.

**The buyer leaves this page thinking "this is a good workflow fit" — but not "I have seen the evidence quality."** That is the difference between a product page and a conversion page.

### 4.4 Page-3 findings

| Finding | Severity | Wave 2 fix? |
|---|---|---|
| **L4 Evidence: no live sample object in hero, no real source link, no real verified fact** | **High — strategic** | YES (Wave 2 core) |
| L2 Problem is thin (3 generic cards vs. investment's 4 specific + market's 5 specific) | Medium | YES (Wave 2 — add specificity) |
| Hero is text-only (vs. investment & market which have glass status cards) | Medium — visual consistency | YES (Wave 2 — add glass card with real media evidence sample) |
| L5 Workflow (Where ROUA Fits) is excellent — preserve as pattern | — | No fix |
| No "What Happens Next" 5-stage section (unlike catalog.html) | Low — consistency | Wave 4 |
| CTA "Request a Media Intelligence Briefing" is product-prefixed (consistent with investment page) | Low — defer to Wave 4 CTA normalization | Wave 4 |

---

## 5. Cross-Page Analysis

### 5.1 Link-by-link comparison

| Link | investment | market | financial-media |
|---|---|---|---|
| L1 Buyer | ✅ 6 archetypes | ✅ 2 primary + 4 secondary | ✅ 5 profiles |
| L2 Problem | ✅ 4 specific | ✅ 5 specific | ⚠️ 3 generic |
| L3 Capability | ✅ 4 caps + 6 outputs | ✅ 4 caps | ✅ 5 workflows + outputs diagram |
| L4 Evidence | ✅ Aramco sample (live link) | ✅ FOMC sample (live link) + full walkthrough section | ⚠️ Conceptual only — no live link |
| L5 Workflow | ⚠️ Engine pipeline (not buyer workflow) | ✅ Buyer workflow (best of 3) | ✅ Integration topology (unique) |
| L6 Deployment | ✅ 4 models | ✅ 4 models | ✅ 3 models (appropriate) |
| L7 Briefing | ✅ "Request Investment Intelligence Briefing" | ⚠️ "Request Market **Assessment**" | ✅ "Request a Media Intelligence Briefing" |

### 5.2 Three patterns observed

**Pattern A — Workflow representation varies by page:**
- investment-intelligence.html: engine pipeline (Source → Evidence → Context → Reasoning → Output)
- market-intelligence.html: buyer workflow (Pre-Session → Event Detection → Impact → Decision → Post-Decision Review)
- financial-media.html: integration topology (Sources → ROUA → Editorial Systems → Published Content)

Each is a valid representation, but they answer different questions:
- Engine pipeline = "what does ROUA do internally?"
- Buyer workflow = "what does my team do on Monday morning?"
- Integration topology = "where does ROUA sit in my stack?"

**The market-intelligence buyer workflow is the conversion-strongest** because it answers the buyer's actual question. The other two pages answer questions the buyer did not ask.

**Pattern B — Evidence quality varies by page:**
- investment: live Aramco sample in hero (real source link)
- market: live FOMC sample in hero (real source link) + full FOMC walkthrough section
- financial-media: conceptual ECB diagram only (no source link)

**The financial-media page is the only one that asks the buyer to trust claims without showing evidence.** For a media buyer — whose job is verifying claims — this is the worst page to lack evidence on.

**Pattern C — Briefing CTA text varies:**
- investment: "Request Investment Intelligence Briefing" ✅
- market: "Request Market Assessment" ⚠️ (NOT "Briefing")
- financial-media: "Request a Media Intelligence Briefing" ✅

The market page's "Assessment" wording is the same D.10-class inconsistency flagged in Wave 1 QA for risk-intelligence.html. The user explicitly called this out: the institutional CTA should lead to briefing/engagement, not a different "assessment" promise.

### 5.3 Shared gaps (all 3 pages)

| Gap | Severity | Wave 2 fix? |
|---|---|---|
| No "What Happens Next" 5-stage section (catalog.html has one post-Wave 1) | Low — consistency | Wave 4 (after Wave 2 product pages stabilized) |
| CTA "Includes" box labels ("Briefing Includes" / "Assessment Includes") do not reference the canonical 5-stage process from spec 05.14 | Low — consistency | Wave 4 |
| No page has a "deployment decision tree" — which deployment model fits which buyer | Medium — could strengthen L6 | Wave 4 (Wave 2 should not add new sections, only fix existing) |

### 5.4 The strategic question — answered per page

| Page | Does the buyer say "I want to understand deployment"? | Why or why not |
|---|---|---|
| investment-intelligence | **Partial.** Buyer sees a strong product + evidence but not their own workflow. | L5 is engine pipeline, not buyer workflow. |
| market-intelligence | **Yes — strongest.** Buyer sees their own workflow + evidence + outcomes. | L5 is buyer workflow; L4 has full FOMC walkthrough. |
| financial-media | **Partial.** Buyer sees the integration topology but not the evidence. | L4 is conceptual only; L5 is excellent. |

---

## 6. Wave 2 Implementation Recommendations

### 6.1 What Wave 2 should do (per page)

**`investment-intelligence.html` — 1 high-severity fix:**
1. **L5 Workflow rewrite:** Replace the engine-pipeline "How It Works" with a buyer-workflow pattern matching market-intelligence.html. Show the analyst's day (e.g. "Before market open" → "When a company reports" → "Building a research view" → "Committee prep" → "Post-decision review"). Keep the engine pipeline as a secondary visual or move it to the architecture page.

**`market-intelligence.html` — 1 high-severity fix:**
1. **L7 CTA normalization:** "Request Market Assessment" → "Request a Market Intelligence Briefing" (or "Request an Institutional Briefing"). Also rename "Assessment Includes" → "Briefing Includes". This aligns with spec 05.14 and the user's explicit Wave 1 QA direction.

**`financial-media.html` — 2 high-severity fixes:**
1. **L4 Evidence:** Add a live sample object to the hero (matching the pattern from investment & market pages). Use a real recent financial event with a real source link — e.g. a central bank press release or a major corporate disclosure — and show how ROUA turns it into a publishable article with evidence chain. Also consider adding a dedicated "Evidence Example" section like market-intelligence.html has.
2. **L2 Problem specificity:** Expand the 3 generic problem cards (Speed / Accuracy / Defensibility) to 4-5 specific media-publisher pains — e.g. "Source attribution at scale", "Editorial review bottleneck", "Multi-format production cost", "Compliance reconstruction for published claims", "Syndication without losing provenance". Match the specificity of the investment and market pages.

### 6.2 What Wave 2 should NOT do

- ❌ Do NOT add "What Happens Next" 5-stage section to these 3 pages — that is a Wave 4 consistency task
- ❌ Do NOT normalize all CTA text to "Request an Institutional Briefing" globally — that is a Wave 4 task. Wave 2 only fixes the "Assessment" outlier on market-intelligence.html
- ❌ Do NOT redesign the hero of investment or market pages — both are strong
- ❌ Do NOT add new sections (deployment decision tree, buyer persona cards, etc.) — Wave 2 is about fixing existing links, not adding new ones
- ❌ Do NOT touch `index.html` (FROZEN)

### 6.3 Estimated effort

| Page | Fix | Effort |
|---|---|---|
| investment-intelligence.html | L5 rewrite (5-step buyer workflow replacing engine pipeline) | ~30 min |
| market-intelligence.html | L7 CTA + "Includes" label normalization (2 text edits) | ~5 min |
| financial-media.html | L4 live evidence sample in hero + L2 problem card expansion | ~45 min |
| **Total** | | **~80 min** |

### 6.4 Execution guardrails (carried from Wave 1)

1. **Single commit** for all 3 pages — no per-page commits
2. **Separate from** `d5187aa` (Wave 1 QA) AND `41551bc` (Wave 1 impl) AND `b6ac82e` (baseline)
3. **No new taxonomy, claims, or metrics** — only restructure existing content + add real-source evidence samples
4. **Diff audit** before commit: verify only 3 files changed, `index.html` untouched, no D.1–D.14 regressions
5. **Push to `main`** after audit passes

---

## 7. Strategic Verdict

### 7.1 Are the 3 pages ready for Wave 2 implementation?

**YES — with the 4 specific fixes in Section 6.1.**

All 3 pages have strong foundations. None require structural redesign. The fixes are surgical:
- 1 workflow rewrite (investment)
- 1 CTA normalization (market)
- 1 evidence sample addition + 1 problem-card expansion (financial-media)

### 7.2 Will Wave 2 make the buyer say "I want to understand deployment"?

**After the fixes — YES for all 3 pages.**

- **investment-intelligence:** Buyer sees their own workflow (not the engine's) → "this fits my day"
- **market-intelligence:** Buyer sees consistent "Briefing" CTA (not "Assessment") → "this is an engagement, not a sales call"
- **financial-media:** Buyer sees real evidence (not conceptual) → "I can trust the evidence quality"

### 7.3 What to decide before implementation

1. **Confirm the 4 fixes in Section 6.1 are the right scope.** Anything to add, remove, or reprioritize?
2. **For the investment L5 workflow rewrite:** confirm the buyer-workflow pattern (analyst's day, not engine pipeline). The market-intelligence "How It Works" is the reference pattern.
3. **For the financial-media L4 evidence sample:** confirm the event to use. Options: a recent central bank decision (ECB / Fed / BoE), a major corporate disclosure (Aramco / Apple / etc.), or a regulatory action. The sample must use a real source link and show the evidence chain.
4. **For the market L7 CTA:** confirm the target text. Options: "Request a Market Intelligence Briefing" (product-prefixed, consistent with investment & financial-media pages) OR "Request an Institutional Briefing" (spec 05.14 canonical). Recommend the product-prefixed variant for consistency with the other 2 product pages — global normalization is a Wave 4 task.

---

## 8. What This Discovery Does NOT Cover

- ❌ Visual rendering (no browser testing) — HTML structure and content only
- ❌ Mobile UX
- ❌ Whether the "Briefing Includes" box content should be expanded to match the 5-stage process from contact.html (Wave 4 consistency)
- ❌ Whether the "What Happens Next" 5-stage section should be added to all product pages (Wave 4 consistency)
- ❌ Whether the product-prefixed CTA pattern ("Request a [Product] Briefing") should be globally normalized to "Request an Institutional Briefing" (Wave 4)

---

## 9. Recommendation

**Proceed to Wave 2 implementation with the 4 fixes in Section 6.1.**

**Sequence:**
1. User confirms scope (Section 7.3 questions)
2. Implementation: 1 commit, 3 files, ~80 min
3. Diff audit: verify only 3 files, index.html untouched, no regressions
4. Push to `main`
5. Wave 2 Strategic QA (same 7-link test, post-implementation)
6. STOP before Wave 3 — await user strategic review

**Awaiting user confirmation on Section 7.3 before any code changes.**

---

*End of Wave 2 Discovery Report. No code modified. No commit. Awaiting user direction.*

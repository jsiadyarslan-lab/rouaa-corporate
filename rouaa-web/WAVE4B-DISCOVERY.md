# Wave 4-B — Discovery: Workflow → Deployment Handoff Audit

> **Status:** Audit only. **No code modified. No commit.**
> **Subject:** Wave 4-B — Workflow → Deployment Handoff across all pages with both sections
> **Method:** Apply B1-B7 test per page. Test the chain:
>   **Buyer Workflow → Institutional Output → Deployment Model → Briefing**
> **Core question:** Does the buyer understand, without inference or mental leap, how what they saw in the workflow becomes ROUA deployed inside their institution?
> **Per user direction:** Discovery only. No implementation recommendations. Answer 4 questions:
>   1. Where does the handoff actually break?
>   2. Is the problem in content, ordering, missing link/CTA, or the deployment model itself?
>   3. Do we need to add something, or just re-link what exists?
>   4. Is there one pattern applicable to all pages, or does workflow → deployment differ fundamentally by buyer?
> **Baseline:** `c74341d` (Wave 4-A Strategic QA — Wave 4-A closed)
> **Date:** 2026-08-11

---

## 1. Method

For each page with both a Workflow section and a Deployment section (or equivalent), I apply 7 tests:

| Test | Question |
|---|---|
| **B1 Workflow endpoint** | What does the workflow actually produce? |
| **B2 Deployment presence** | Where does deployment appear? |
| **B3 Explicit handoff** | Is there an explicit connection between them? |
| **B4 Buyer comprehension** | Can the buyer understand the transition without extra interpretation? |
| **B5 Deployment relevance** | Is the deployment model actually tied to the use case? |
| **B6 CTA continuity** | Does the path flow from deployment to briefing without interruption? |
| **B7 Cross-page consistency** | Do pages differ without reason, or does each difference have justification? |

**Pages audited (8):**
1. investment-intelligence.html
2. market-intelligence.html
3. financial-media.html
4. risk-intelligence.html
5. platform.html
6. enterprise.html
7. trading-platform.html
8. developers.html

---

## 2. Page-by-Page Matrix

### Page 1: `investment-intelligence.html`

| Test | Finding |
|---|---|
| **B1 Workflow endpoint** | Step 06 "Defensible Output" — "Research briefs, evidence packages, scenarios, and investment intelligence are **delivered into the institution's research workflow** — reviewable, traceable, and defensible." The workflow produces defensible research outputs that enter the institution's research workflow. |
| **B2 Deployment presence** | Separate "Deployment" section (line 532) with 4 models: Cloud SaaS, Private Cloud, On-Premise, Hybrid. Each model has a one-line description + "for [buyer type]" note. |
| **B3 Explicit handoff** | ❌ **NO explicit handoff.** Between Workflow (ends at line 483) and Deployment (starts at line 532), there is a "Built For" section (6 buyer archetype cards). The workflow says outputs are "delivered into the institution's research workflow" — but there is no statement connecting this to HOW ROUA is deployed to make that delivery possible. The buyer must infer: "if outputs are delivered into my workflow, ROUA must be running somewhere — and that somewhere is the deployment section below." |
| **B4 Buyer comprehension** | ⚠️ **Requires mental leap.** The buyer sees: (1) workflow produces outputs delivered into their workflow, (2) 6 buyer archetypes, (3) 4 deployment models. The connection between "outputs delivered into my workflow" and "choose a deployment model" is implicit. The buyer must infer that the deployment model determines where ROUA runs, which determines how outputs reach their workflow. |
| **B5 Deployment relevance** | ✅ **Relevant.** Each deployment model names a buyer type: Cloud SaaS "for investment teams evaluating," Private Cloud "for asset managers," On-Premise "for sovereign wealth funds and pension funds," Hybrid "for investment firms with split workloads." The models are tied to investment use cases. |
| **B6 CTA continuity** | ⚠️ **Partial.** After Deployment section, the CTA (line 561) says "Request an Investment Intelligence Briefing" with a "Briefing Includes" box (4 items including "Recommended deployment model"). The CTA mentions deployment — but the Deployment section itself does not link to the CTA. The buyer must scroll past Deployment to find the CTA. |
| **B7 Cross-page consistency** | ⚠️ **Inconsistent with market-intelligence.** Investment has: Workflow → Built For → Deployment → CTA. Market has: Workflow → Evidence Example → Buyer Environments → Business Outcomes → Deployment → CTA. The ordering differs — investment puts "Built For" (buyer archetypes) between workflow and deployment, while market puts "Business Outcomes" (before/after) between buyer environments and deployment. |

**Break point:** Between Workflow Step 06 and Deployment section. The workflow says outputs are "delivered into the institution's research workflow" — but the page never says "this delivery requires ROUA to be deployed in your environment, and here are the deployment models that make it possible."

---

### Page 2: `market-intelligence.html`

| Test | Finding |
|---|---|
| **B1 Workflow endpoint** | Step 05 "Post-Decision Review" — "the market assessment is reconstructable — the event, the evidence, the impact assessment, the reasoning path, and the decision context." The workflow produces replayable market assessments for governance review. |
| **B2 Deployment presence** | Separate "Deployment Models" section (line 602) with 4 models: Cloud SaaS, Private Cloud, On-Premise, Hybrid. Each model has a description + "Ideal For" buyer type. |
| **B3 Explicit handoff** | ❌ **NO explicit handoff.** Between Workflow (ends at line 393) and Deployment (line 602), there are 3 intervening sections: Evidence Example (FOMC walkthrough), Buyer Environments, Business Outcomes (before/after pairs). The workflow produces "replayable market assessments" — but the page never connects this to deployment. The buyer must infer that deployment determines where ROUA runs, which determines how assessments are produced and reviewed. |
| **B4 Buyer comprehension** | ⚠️ **Requires mental leap.** The buyer sees: (1) workflow produces replayable assessments, (2) FOMC evidence example, (3) buyer environments, (4) business outcomes (before/after), (5) deployment models. The connection between "replayable assessments" and "choose a deployment model" is implicit. |
| **B5 Deployment relevance** | ✅ **Relevant.** Each model names a buyer: Cloud SaaS "for research and market intelligence teams," Private Cloud "for banks, brokers, and asset managers," On-Premise "for trading floors and institutions with strict latency," Hybrid "for institutions with distributed data, latency-sensitive trading floors." |
| **B6 CTA continuity** | ⚠️ **Partial.** After Deployment, CTA (line 652) says "Request a Market Intelligence Briefing" with "Briefing Includes" box (includes "Recommended deployment model"). The CTA mentions deployment — but the Deployment section does not link to the CTA. |
| **B7 Cross-page consistency** | ⚠️ **Inconsistent with investment.** Market has 3 intervening sections between Workflow and Deployment (Evidence Example, Buyer Environments, Business Outcomes). Investment has 1 (Built For). The structural ordering differs. |

**Break point:** Between Workflow Step 05 and Deployment section — with 3 intervening sections diluting the connection. The workflow produces "replayable assessments" but the page never says "this replayability requires ROUA to be deployed in your environment."

---

### Page 3: `financial-media.html`

| Test | Finding |
|---|---|
| **B1 Workflow endpoint** | "Media Intelligence Workflows" section (line 153) — 5 numbered workflows (Financial Intelligence Monitoring, Evidence-Backed Publishing, Research Generation, White-Label Systems, Multi-Format Output). The workflow produces "news articles, market reports, strategic reports, research briefs, video reports, infographics, charts, structured feeds, API outputs." |
| **B2 Deployment presence** | "Media Adoption Models" section (line 437) with 3 models: Platform Access, White Label, Private Deployment. **Different from other pages** — uses "Adoption Models" not "Deployment Models," and has 3 not 4. |
| **B3 Explicit handoff** | ⚠️ **Partial handoff via "Where ROUA Fits in the Newsroom."** Between Workflows and Adoption Models, there is: Evidence Demonstration (ECB), Editorial Value, Pipes diagram, Audience Profiles. Then Adoption Models. Then "Where ROUA Fits" (line 499) — a 4-stage integration topology: Official Sources → ROUA Media Intelligence → Editorial Systems → Published Content. This IS a form of handoff — it shows where ROUA sits in the newsroom stack. But it appears AFTER the Adoption Models section, not before. |
| **B4 Buyer comprehension** | ⚠️ **Confusing ordering.** The buyer sees: (1) 5 workflows, (2) Evidence Demonstration, (3) Editorial Value, (4) Pipes, (5) Audience Profiles, (6) Adoption Models (3 deployment options), (7) Where ROUA Fits (integration topology), (8) Product Behind Workflow, (9) CTA. The "Where ROUA Fits" topology should come BEFORE Adoption Models — it answers "where does ROUA sit?" which logically precedes "how do I adopt it?" |
| **B5 Deployment relevance** | ✅ **Relevant.** 3 adoption models are media-specific: Platform Access (newsroom teams), White Label (your publication's brand), Private Deployment (inside your newsroom). Tied to media use cases. |
| **B6 CTA continuity** | ✅ **Good.** CTA (line 511) has "Request a Media Intelligence Briefing" + "View Sample Intelligence Outputs" (links to sample-library). The CTA is well-connected — media is the only page with a Sample Library link in the CTA. |
| **B7 Cross-page consistency** | ⚠️ **Structurally different.** Media uses "Adoption Models" (3) not "Deployment Models" (4). Media has "Where ROUA Fits" integration topology (unique to this page). Media has 3 models vs. 4 on other pages — justified (Hybrid is less common in newsrooms). |

**Break point:** Ordering — "Where ROUA Fits" (integration topology) appears AFTER Adoption Models, when it should precede them. The buyer sees adoption options before understanding where ROUA sits in their newsroom.

---

### Page 4: `risk-intelligence.html`

| Test | Finding |
|---|---|
| **B1 Workflow endpoint** | Step 05 "Decision Record" — "the risk assessment is reconstructable — the event, the evidence, the exposure review, the escalation, and the decision context." The workflow produces replayable risk assessments for regulators and boards. |
| **B2 Deployment presence** | Separate "Deployment Models" section (line 548) with 4 models: Cloud SaaS, Private Cloud, On-Premise, Hybrid. Each has description + "Ideal For" buyer type. |
| **B3 Explicit handoff** | ❌ **NO explicit handoff.** Between Workflow (ends at line 403) and Deployment (line 548), there are intervening sections (Evidence Example — OFAC Sanctions, Built For). The workflow produces "replayable governance records" — but the page never connects this to deployment. |
| **B4 Buyer comprehension** | ⚠️ **Requires mental leap.** Same pattern as investment and market. The buyer must infer that deployment determines where ROUA runs, which determines how risk assessments are produced and governed. |
| **B5 Deployment relevance** | ✅ **Relevant.** Each model names a buyer: Cloud SaaS "for risk teams piloting," Private Cloud "for CRO offices and regulated risk teams," On-Premise "for regulated institutions with strict data residency, sovereignty, or air-gapped supervisory requirements," Hybrid "for institutions with split workloads — regulated exposure data on-prem, sanctions monitoring in cloud." |
| **B6 CTA continuity** | ⚠️ **Partial.** After Deployment, CTA (line 598) says "Request Risk Assessment" (NOTE: CTA text not yet normalized — Wave 4-D P1-2). The CTA does not mention deployment. |
| **B7 Cross-page consistency** | ⚠️ **CTA text inconsistency.** Risk uses "Request Risk Assessment" (not "Briefing"). Same as Wave 1/2 flagged issue. Structural ordering similar to investment (Workflow → Evidence → Built For → Deployment → CTA). |

**Break point:** Between Workflow Step 05 and Deployment section. Same pattern as investment and market — no explicit connection. Plus CTA text inconsistency ("Assessment" not "Briefing").

---

### Page 5: `platform.html`

| Test | Finding |
|---|---|
| **B1 Workflow endpoint** | "How ROUA Lives Inside Your Institution" (Wave 4-A added) — 5-step adoption workflow: Your Existing Stack → ROUA Deployed Alongside → Integration Surface → Evidence-Linked Intelligence Delivered In → Governed Decisions, Your Authority. **This IS a deployment workflow** — Step 02 explicitly says "ROUA Deployed Alongside (Cloud SaaS / Private Cloud / On-Premise / Hybrid)." |
| **B2 Deployment presence** | Separate "Enterprise Deployment" section (line 605) with 4 models: Cloud SaaS, Private Cloud, On-Premise, Hybrid. **Plus** Step 02 of the adoption workflow already references deployment models. |
| **B3 Explicit handoff** | ✅ **STRONGEST handoff on the site.** The adoption workflow IS the handoff. Step 02 says "ROUA Deployed Alongside" and names the 4 models. Step 04 says "delivered into your existing systems." Step 05 says "your teams retain decision authority." The workflow explicitly connects to deployment. |
| **B4 Buyer comprehension** | ✅ **Clear.** The CTO sees: (1) your stack stays, (2) ROUA deploys alongside (4 models named), (3) integration surface, (4) intelligence delivered in, (5) you retain authority. Then the Deployment section provides detail on each model. The connection is explicit. |
| **B5 Deployment relevance** | ✅ **Relevant.** On-Premise says "for central banks and governments" — platform-relevant. Other models are generic but appropriate for platform audience. |
| **B6 CTA continuity** | ✅ **Good.** CTA (line 668) says "Request Platform Briefing" + "Explore the Architecture." The Deployment section flows naturally to the CTA. |
| **B7 Cross-page consistency** | ✅ **Platform is the gold standard.** Platform's adoption workflow (Wave 4-A) IS the handoff pattern that other pages lack. This is the reference pattern. |

**Break point:** None — platform.html has the strongest Workflow → Deployment handoff on the site. The adoption workflow (Step 02) explicitly names deployment models, creating a natural bridge.

---

### Page 6: `enterprise.html`

| Test | Finding |
|---|---|
| **B1 Workflow endpoint** | ❌ **NO workflow section.** Enterprise.html is deployment-first. It has: Hero → Enterprise Problem → Build vs Buy → Deployment Models (3 detailed models) → Enterprise Governance → Enterprise APIs → Enterprise Engagement → CTA. There is no "How your team uses ROUA" workflow. |
| **B2 Deployment presence** | ✅ **Deployment is the core content.** "Deployment Models" section (line 192) with 3 detailed models: Platform Access, API Integration, Private Deployment. Each has: description, Business Outcome, Time To Value, Best For. **Most detailed deployment section on the site.** |
| **B3 Explicit handoff** | N/A — no workflow section to hand off from. The page IS the deployment destination. |
| **B4 Buyer comprehension** | ✅ **Clear for deployment.** The buyer sees deployment models with business outcomes, time-to-value, and best-for buyer types. But there is no workflow context — the buyer arrives at enterprise.html from a product page (which has workflow) and lands on a deployment-only page. The workflow → deployment handoff happens CROSS-PAGE, not within the page. |
| **B5 Deployment relevance** | ✅ **Highly relevant.** 3 models with detailed buyer mapping: Platform Access (investment firms, banks, research houses, trading desks), API Integration (platforms, brokers, data providers), Private Deployment (banks, sovereign funds, strict data residency). |
| **B6 CTA continuity** | ✅ **Good.** CTA (line 451) says "Request Enterprise Briefing" + "View Architecture" + "View Solutions." The Enterprise Engagement section (before CTA) describes a 5-stage process: Assessment → Source Mapping → Workflow Design → Pilot → Deployment → Governance → Scale. |
| **B7 Cross-page consistency** | ⚠️ **Structurally different — by design.** Enterprise is the only page that is deployment-first (no workflow). This is justified — enterprise buyers are evaluating deployment models, not workflows. But it means the workflow → deployment handoff must happen cross-page (from product pages to enterprise.html). |

**Break point:** Cross-page — enterprise.html has no workflow, so the handoff from workflow (on product pages) to deployment (on enterprise.html) requires the buyer to navigate between pages. This is a different pattern from same-page handoff.

---

### Page 7: `trading-platform.html`

| Test | Finding |
|---|---|
| **B1 Workflow endpoint** | "Institutional Workflow" section (line 153) — 5 steps: Detect → Understand → Assess → Act → Execution Handoff. Step 05 "Execution Handoff" — "Approved trading actions are handed off to connected execution systems, with the relevant decision context and workflow record preserved for review." |
| **B2 Deployment presence** | ❌ **NO dedicated Deployment section.** Instead, "Broker-Neutral Integration" section (line 389) mentions deployment models as tags: "REST APIs, Streaming APIs, Webhooks, SDKs, White-Label Components, Private Deployment." Deployment is a tag list, not a structured section. |
| **B3 Explicit handoff** | ⚠️ **Partial.** The workflow ends at "Execution Handoff" (Step 05). Then there is an Evidence Chain visual, then "Broker-Neutral Integration" (which mentions deployment as tags). The connection between "execution handoff" and "deployment models" is implicit — the buyer must infer that deployment determines how ROUA connects to their execution systems. |
| **B4 Buyer comprehension** | ⚠️ **Requires mental leap.** The buyer sees: (1) workflow ends at execution handoff, (2) evidence chain, (3) broker-neutral integration (deployment as tags). The connection is weak — deployment is a tag list, not a structured section. |
| **B5 Deployment relevance** | ⚠️ **Weak.** Deployment is a tag list ("Private Deployment" is one of 6 tags). No buyer-type mapping. No "Ideal For" notes. Compare to other pages where each deployment model has a description + buyer type. |
| **B6 CTA continuity** | ✅ **Good.** CTA (line 405) says "Request Institutional Briefing" + "View Architecture" + "Explore Product Experience." |
| **B7 Cross-page consistency** | ⚠️ **Inconsistent.** Trading-platform is the only product page WITHOUT a dedicated Deployment Models section. It uses a tag list instead. This is a structural inconsistency — but may be justified (trading desks think in terms of integration, not deployment models). |

**Break point:** No dedicated Deployment section — deployment is a tag list. The buyer cannot evaluate deployment options on this page; they must go to enterprise.html or platform.html for structured deployment information.

---

### Page 8: `developers.html`

| Test | Finding |
|---|---|
| **B1 Workflow endpoint** | No traditional "workflow" section. Instead: "Integration Architecture" (line 480) — 6 integration patterns (Behind Your Stack, Versioned Retrieval, Typed SDK, Embeddable Components, Private Deployment, Observable). This is an integration topology, not a buyer workflow. |
| **B2 Deployment presence** | "Enterprise Integration" section (line 559) — 4 cards: Private Deployment, Dedicated Source Tiers, Your Audit Trail, White-Label Presentation. **Different from other pages** — these are enterprise integration features, not deployment models (Cloud SaaS / Private Cloud / On-Premise / Hybrid). |
| **B3 Explicit handoff** | ⚠️ **Partial.** "Integration Architecture" (line 480) says "ROUA does not replace your data warehouse, your OMS, or your editorial CMS. It sits alongside them as an intelligence layer." This is a positioning statement, not a handoff. The "Enterprise Integration" section (line 559) describes deployment features for stricter boundaries. The connection is: integration architecture (how ROUA fits) → enterprise integration (deployment for regulated institutions). |
| **B4 Buyer comprehension** | ✅ **Clear for developer audience.** The engineer sees: (1) 3 integration surfaces (REST, Streaming, SDK), (2) authentication, (3) API endpoints, (4) evidence access, (5) code example, (6) integration architecture (where ROUA fits), (7) API access process, (8) enterprise integration (for stricter boundaries). The flow is logical for a developer. |
| **B5 Deployment relevance** | ✅ **Relevant for developers.** Enterprise Integration cards are developer-specific: Private Deployment (local endpoint), Dedicated Source Tiers (scoped keys), Your Audit Trail (SIEM integration), White-Label Presentation (customer-facing products). |
| **B6 CTA continuity** | ✅ **Good.** CTA (line 596) says "Request API Access" + links to Developer Platform Product, Platform Architecture, Enterprise Deployment. |
| **B7 Cross-page consistency** | ⚠️ **Structurally different — by design.** Developers page uses "Enterprise Integration" (4 feature cards) not "Deployment Models" (4 models). This is justified — developers think in terms of integration features, not deployment models. |

**Break point:** Partial — developers.html has a different structure (integration topology + enterprise features) that works for its audience. The handoff is implicit but logical for developers.

---

## 3. Cross-Page Analysis (B7)

### 3.1 Structural patterns observed

| Page | Workflow type | Deployment type | Handoff? | Intervening sections |
|---|---|---|---|---|
| investment-intelligence | 6-step buyer workflow | 4 models (Cloud/Private/On-Prem/Hybrid) | ❌ None | Built For (6 buyer cards) |
| market-intelligence | 5-step buyer workflow | 4 models | ❌ None | Evidence Example, Buyer Environments, Business Outcomes |
| financial-media | 5 workflows (numbered) | 3 adoption models | ⚠️ Partial (Where ROUA Fits, but wrong order) | Evidence Demo, Editorial Value, Pipes, Audience |
| risk-intelligence | 5-step buyer workflow | 4 models | ❌ None | Evidence Example, Built For |
| platform.html | 5-step adoption workflow | 4 models | ✅ Strong (Step 02 names models) | Platform Architecture, Built Today, Evidence Trace, Applications, Why Not Build |
| enterprise.html | ❌ No workflow | 3 detailed models (with Time To Value) | N/A (deployment-first page) | Problem, Build vs Buy, Governance, APIs, Engagement |
| trading-platform.html | 5-step buyer workflow | ❌ Tag list (no section) | ⚠️ Partial (Broker-Neutral Integration) | Evidence Chain |
| developers.html | Integration topology (6 patterns) | 4 enterprise features | ⚠️ Partial | API surface, Auth, Endpoints, Evidence, Code example, Access |

### 3.2 The 4 user questions — answered

**Q1: Where does the handoff actually break?**

The handoff breaks on **4 product pages** (investment, market, risk, financial-media) between the Workflow section and the Deployment section. The workflow produces an institutional output (defensible research, replayable assessment, publisher-ready content), but the page never explicitly connects this output to the deployment model required to produce it.

**Specifically:**
- **investment-intelligence:** Workflow Step 06 says "delivered into the institution's research workflow" — but no statement connects this to deployment.
- **market-intelligence:** Workflow Step 05 says "replayable market assessments" — but 3 intervening sections dilute the connection to deployment.
- **risk-intelligence:** Workflow Step 05 says "replayable governance records" — but no connection to deployment.
- **financial-media:** Has "Where ROUA Fits" topology, but it appears AFTER Adoption Models (wrong order).

**Q2: Is the problem in content, ordering, missing link/CTA, or the deployment model itself?**

**The problem is primarily ordering + missing explicit link** — NOT content and NOT the deployment model itself.

- **Content:** The workflow content and deployment content are both strong. The deployment models are relevant and buyer-mapped.
- **Ordering:** On most pages, there are 1-3 intervening sections between Workflow and Deployment, diluting the connection. Financial-media has "Where ROUA Fits" in the wrong position (after Adoption Models).
- **Missing link:** No page (except platform.html) has an explicit statement like "This workflow requires ROUA to be deployed in your environment" or a CTA within the workflow section pointing to deployment.
- **Deployment model:** The deployment models themselves are fine. The issue is the buyer cannot see how their workflow choice leads to a deployment choice.

**Q3: Do we need to add something, or just re-link what exists?**

**Both — but mostly re-link what exists.**

- **Re-link (primary):** Add an explicit handoff statement at the end of each Workflow section, connecting the workflow output to the Deployment section below. This is a 1-2 sentence addition + possibly a link.
- **Re-order (financial-media only):** Move "Where ROUA Fits" topology to BEFORE Adoption Models.
- **Add (trading-platform only):** Consider adding a brief Deployment Models section (or linking to enterprise.html/platform.html for structured deployment info). Currently deployment is a tag list.

**We do NOT need to:**
- Add new deployment models
- Rewrite workflow sections
- Add new buyer archetype sections
- Restructure the page ordering (except financial-media)

**Q4: Is there one pattern applicable to all pages, or does workflow → deployment differ fundamentally by buyer?**

**There is ONE pattern — but it must be adapted per page type.**

The pattern (from platform.html, the gold standard):

```
Workflow produces institutional output
    ↓ (explicit handoff statement)
"This output requires ROUA to be deployed in your environment."
    ↓
Deployment Models (how ROUA runs)
    ↓
CTA (briefing — includes deployment model recommendation)
```

**This pattern applies to all 4 product pages** (investment, market, risk, financial-media) — they all have Workflow + Deployment sections and need an explicit handoff statement.

**Adaptations:**
- **platform.html:** Already has this pattern (Step 02 of adoption workflow). No change needed.
- **enterprise.html:** Deployment-first page — no workflow to hand off from. The handoff happens cross-page (product pages → enterprise.html). No same-page handoff needed.
- **trading-platform.html:** Has workflow but no deployment section. Needs either (a) a brief deployment section, or (b) an explicit link to enterprise.html/platform.html for deployment options.
- **developers.html:** Different audience (engineers). The integration topology → enterprise integration flow works for developers. No same-page handoff needed — the developer journey is structurally different.

### 3.3 B7 consistency verdict

Pages differ in structure — but most differences are **justified by buyer type**:
- Product pages (investment, market, risk): same pattern (Workflow → Deployment), differing only in intervening sections
- Financial-media: slightly different (Adoption Models not Deployment Models, 3 not 4) — justified (newsrooms think in adoption, not deployment)
- Platform: adoption workflow (Wave 4-A) — justified (CTO audience)
- Enterprise: deployment-first — justified (enterprise buyers evaluate deployment)
- Trading-platform: no deployment section — NOT justified (trading desks need deployment info too)
- Developers: integration features not deployment models — justified (developer audience)

**One unjustified inconsistency:** trading-platform.html lacks a dedicated deployment section while every other product page has one.

---

## 4. Findings Summary

### 4.1 Break points (where the handoff actually breaks)

| Page | Break point | Severity |
|---|---|---|
| investment-intelligence | Between Workflow Step 06 and Deployment — no explicit connection | Medium |
| market-intelligence | Between Workflow Step 05 and Deployment — 3 intervening sections dilute connection | Medium |
| financial-media | "Where ROUA Fits" topology appears AFTER Adoption Models (wrong order) | Medium |
| risk-intelligence | Between Workflow Step 05 and Deployment — no explicit connection | Medium |
| platform.html | ✅ No break — adoption workflow IS the handoff | — |
| enterprise.html | N/A — no workflow section (deployment-first page) | — |
| trading-platform.html | No dedicated Deployment section — deployment is a tag list | Medium |
| developers.html | Partial — but works for developer audience | Low |

### 4.2 Root cause

**The problem is ordering + missing explicit link — NOT content, NOT deployment models.**

The workflow content and deployment content are both strong. The issue is the buyer cannot see how their workflow choice leads to a deployment choice because:
1. There is no explicit statement connecting workflow output to deployment requirement
2. Intervening sections dilute the connection (especially on market-intelligence)
3. Financial-media has the right element ("Where ROUA Fits") in the wrong position

### 4.3 What needs to change vs. what must NOT be touched

**Needs to change (re-link what exists):**
- 4 product pages: Add explicit handoff statement at end of Workflow section
- Financial-media: Re-order "Where ROUA Fits" to before Adoption Models
- Trading-platform: Add brief deployment section or explicit link

**Must NOT be touched:**
- ❌ Workflow section content (the steps are correct)
- ❌ Deployment model content (the models are relevant and buyer-mapped)
- ❌ Buyer archetype sections (Built For, Buyer Environments)
- ❌ Evidence sections (Evidence Example, Evidence Demonstration)
- ❌ Business Outcomes sections
- ❌ CTA text (Wave 4-D handles CTA normalization)
- ❌ platform.html adoption workflow (already the gold standard)
- ❌ enterprise.html structure (deployment-first by design)
- ❌ developers.html structure (integration topology by design)
- ❌ index.html (FROZEN)

---

## 5. Recommended Scope (For User Approval — Not Yet Executed)

### 5.1 What Wave 4-B should do

**Per user direction: "I don't want an implementation recommendation now."** This section identifies scope but does NOT recommend implementation approach.

**Scope identified:**
1. **4 product pages** (investment, market, risk, financial-media): Add explicit handoff statement at end of Workflow section, connecting workflow output to Deployment section
2. **Financial-media**: Re-order "Where ROUA Fits" topology to appear BEFORE Adoption Models
3. **Trading-platform**: Add brief deployment section OR explicit link to enterprise.html/platform.html

### 5.2 What Wave 4-B should NOT do

- ❌ Do NOT rewrite workflow sections
- ❌ Do NOT add new deployment models
- ❌ Do NOT change CTA text (Wave 4-D)
- ❌ Do NOT touch platform.html (already gold standard)
- ❌ Do NOT touch enterprise.html (deployment-first by design)
- ❌ Do NOT touch developers.html (integration topology by design)
- ❌ Do NOT touch index.html (FROZEN)
- ❌ Do NOT add "Step 07" to workflows (the user explicitly said "do not assume the problem is solved by adding Step 07")

### 5.3 The pattern question (Q4 answer)

**One pattern, adapted per page type:**
```
Workflow produces institutional output
    ↓ (explicit handoff statement — 1-2 sentences)
"This output requires ROUA to be deployed in your environment."
    ↓
Deployment Models (existing section — no change)
    ↓
CTA (existing — no change)
```

This is the platform.html pattern (gold standard). It applies to the 4 product pages. Trading-platform needs a structural addition (deployment section or link). Financial-media needs re-ordering. Platform, enterprise, and developers need no change.

---

## 6. What This Discovery Does NOT Do

- ❌ Does NOT recommend specific handoff statement text (per user direction)
- ❌ Does NOT recommend whether trading-platform should get a deployment section vs. a link
- ❌ Does NOT estimate implementation effort
- ❌ Does NOT touch any code
- ❌ Does NOT revisit Wave 4-A closed work
- ❌ Does NOT address P0-3 (Evidence → Sample Library — that's Wave 4-C)

---

## 7. Strategic Verdict

### 7.1 The handoff problem is real but narrow

The Workflow → Deployment handoff breaks on **4 product pages** and is weak on **1 page** (trading-platform). The root cause is **missing explicit connection + ordering** — NOT content quality or deployment model design.

### 7.2 The fix is primarily re-linking, not adding

The workflow content and deployment content are both strong. The fix is:
1. Add an explicit handoff statement (1-2 sentences) at the end of each Workflow section
2. Re-order financial-media's "Where ROUA Fits" to before Adoption Models
3. Add a brief deployment section or link on trading-platform

**No new sections, no new deployment models, no workflow rewrites.**

### 7.3 One pattern, adapted per page

The platform.html adoption workflow (Wave 4-A) is the gold standard. The same pattern — explicit connection between workflow output and deployment requirement — applies to the 4 product pages. Trading-platform needs a structural addition. Financial-media needs re-ordering. The other 3 pages (platform, enterprise, developers) need no change.

### 7.4 What to decide before Wave 4-B Implementation

1. **Approve the scope in Section 5.1?** (4 product pages + financial-media re-order + trading-platform addition)
2. **Approve the pattern in Section 5.3?** (explicit handoff statement, NOT Step 07)
3. **For trading-platform:** Add a brief deployment section, OR add an explicit link to enterprise.html/platform.html? (User decision needed)
4. **For financial-media re-order:** Move "Where ROUA Fits" to before Adoption Models, or leave as-is and add a handoff statement instead? (User decision needed)

---

*End of Wave 4-B Discovery Report. No code modified. No commit. Awaiting user direction on Wave 4-B Implementation scope.*

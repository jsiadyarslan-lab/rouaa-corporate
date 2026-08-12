# Buyer Reality Test — Simulation Framework

> **Status:** Strategic framework. **No code modified. No commit. No implementation.**
> **Subject:** What would a real Head of Research / CIO / CRO / Compliance Officer conclude after reading investment-intelligence.html and risk-intelligence.html?
> **Method:** Simulated buyer cognition test — answer the 10 questions from the perspective of each buyer archetype, using ONLY what the pages actually say (no external knowledge, no assumptions beyond what the site presents)
> **Per user direction:** "The question is not 'is the page correct?' but 'what does the buyer actually conclude?'"
> **Baseline:** `de8c209` (Pilot Evidence Strategic QA — 36/36 PASS)
> **Date:** 2026-08-11

---

## 1. The 4 Buyer Archetypes

| Archetype | Page | What they care about |
|---|---|---|
| **Head of Research** | investment-intelligence.html | Can my research team produce defensible investment views faster? |
| **CIO** | investment-intelligence.html | Does this fit our technology governance? Is it infrastructure or a tool? |
| **Chief Risk Officer** | risk-intelligence.html | Can my compliance team show regulators how exposures were identified? |
| **Compliance Officer** | risk-intelligence.html | Does this reduce our audit reconstruction burden? Is it defensible? |

---

## 2. Head of Research — Reading investment-intelligence.html

### Q1: What do you think ROUA is selling?

**Answer from page:** ROUA is selling an intelligence infrastructure that transforms official financial information (filings, earnings releases, disclosures) into evidence-linked investment intelligence. It's not a data terminal (Bloomberg) and not an AI research tool (ChatGPT-style summarization). It's a layer that sits beneath research workflows, connecting every claim to its official source.

**Buyer's likely mental model:** "This is a research infrastructure platform — like a provenance engine for investment research. It doesn't give me data or summaries; it gives me evidence-linked intelligence that my analysts can use and my committee can verify."

### Q2: What problem do you think it solves?

**Answer from page:** The problem is that investment research often lacks evidence context — research notes are disconnected from their underlying sources, earnings releases aren't structured for analysis, valuation models lack evidence linkage, and research cannot be reconstructed weeks later. The consequence: "decisions become difficult to verify, difficult to audit, and difficult to defend."

**Buyer's likely mental model:** "My analysts spend hours collecting and validating sources. When the committee asks 'where did this number come from?', no one can answer quickly. If ROUA actually connects every claim to its source, that solves a real defensibility problem."

### Q3: What did you see that you can actually verify?

**Answer from page:** The "What You Can Verify" unit says I can inspect the Aramco Q1 2026 evidence chain — follow a verified financial fact ($33.6B adjusted net income) from aramco.com through document intelligence, fact extraction, evidence linkage, and into a governed Intelligence Object. The source link is live. I can click it and verify the fact against the source.

**Buyer's likely mental model:** "I can click through to aramco.com and see the actual press release. I can see how ROUA extracted the fact and built the evidence chain. This is real — it's not a mockup. But it's one example."

### Q4: What was NOT proven to you?

**Answer from page:** The D8 boundary explicitly states: no customer deployment, no production-scale performance, no ROI/time savings, no integration with my institution's infrastructure.

**Buyer's likely mental model:** "So I can see the concept works on one example. But I don't know if it works at scale — for hundreds of companies, across multiple markets, in my research workflow. And I don't know what it costs or how long it takes to deploy."

### Q5: Why might you need to deploy it inside your institution?

**Answer from page:** The institutional job is: "Research teams can verify how an investment conclusion was constructed." The business consequence is: "Less manual source reconciliation. Stronger defensibility before investment committees. Research outputs that survive audit."

**Buyer's likely mental model:** "If my research team could produce investment views where every number traces back to its source, that would save significant time in committee prep and audit response. But I need to know if this works for MY companies, MY sources, MY workflow."

### Q6: What would you ask for in a meeting?

**Buyer's likely mental model:** "I'd want to see: (1) the system working on MY portfolio companies, not just Aramco, (2) how long it takes to set up, (3) what it costs, (4) whether my analysts would actually use it or if it's another tool they'd ignore."

### Q7: What prevents you from requesting a meeting now?

**Buyer's likely mental model:** "I'm intrigued but not convinced. The evidence chain is impressive, but one example doesn't prove scale. I don't know the price. I don't know if my sources are covered. I don't know if my team would adopt it. The CTA says 'Request an Investment Intelligence Briefing' — but I'm not sure I'm ready to commit 30 minutes to a sales call without knowing more about cost and fit."

### Q8: What do you need to see before considering a pilot logical?

**Buyer's likely mental model:** "I'd need to see: (1) a sample intelligence output for a company I actually cover, (2) evidence that my key sources (not just Aramco/FOMC) are in the 411+ registry, (3) some indication of timeline and cost — even a range, (4) evidence that the system handles edge cases (conflicting sources, missing data, complex corporate structures)."

### Q9: Does the cost seem justified even before knowing the number?

**Buyer's likely mental model:** "I can't answer this without a number. 'Less manual reconciliation' is valuable, but I don't know if it's worth $50K/year or $500K/year. The business consequence is described qualitatively, not quantitatively. I can't build a business case from 'less manual reconciliation' alone."

### Q10: Would you consider ROUA a product, platform, infrastructure, research tool, or something else?

**Buyer's likely mental model:** "It feels like infrastructure — a layer beneath our research workflow, not a tool my analysts would log into. But it's sold as a 'product' (Investment Intelligence). This is slightly confusing. Is it a platform I integrate, or a product I subscribe to? The page says both."

---

## 3. CIO — Reading investment-intelligence.html

### Q1: What do you think ROUA is selling?

**Buyer's mental model:** "An intelligence infrastructure layer that sits alongside our existing stack (Bloomberg, FactSet, internal tools) and provides evidence-linked intelligence. It's not replacing anything — it's adding a provenance/evidence layer."

### Q2: What problem do you think it solves?

**Buyer's mental model:** "The compliance and audit problem — when regulators or internal audit ask 'where did this decision come from?', we spend weeks reconstructing evidence trails. If this system builds the trail at extraction time, that's an operational risk reduction."

### Q3: What did you see that you can actually verify?

**Buyer's mental model:** "The Aramco evidence chain is real — I can verify the source. The infrastructure report says 6 of 7 layers are operational. The API surface is defined. These are positive signals."

### Q4: What was NOT proven to you?

**Buyer's mental model:** "No customer deployment. No security certifications (SOC 2, ISO 27001). No named team. No pricing. No SLA. No data processing agreement. For a CIO, these are not optional — they are prerequisites for evaluation."

### Q5: Why might you need to deploy it?

**Buyer's mental model:** "If the evidence chain works at scale, it could reduce compliance reconstruction time and improve audit readiness. But I need to see it in a real deployment — not just internal production."

### Q6: What would you ask for in a meeting?

**Buyer's mental model:** "Security documentation, deployment architecture for our environment, integration plan, timeline, cost, and references from other institutions who have deployed."

### Q7: What prevents you from requesting a meeting now?

**Buyer's mental model:** "No security certifications. No named team. No customer references. For institutional procurement, these are blocking — not friction, blocking. I can't even start an internal evaluation without a security review, and I can't do a security review without documentation."

### Q8: What do you need to see before considering a pilot logical?

**Buyer's mental model:** "SOC 2 Type 1 (or at least a documented security framework), a named CTO/Head of Engineering I can verify, a data processing agreement template, and a deployment timeline estimate."

### Q9: Does the cost seem justified?

**Buyer's mental model:** "Can't assess without a number. The qualitative case is sound, but CIOs need numbers for budget approval."

### Q10: Product, platform, infrastructure, or tool?

**Buyer's mental model:** "Infrastructure. But it's positioned as a product. For a CIO, infrastructure means: I need to understand the deployment model, security model, and integration model — not just the output quality."

---

## 4. Chief Risk Officer — Reading risk-intelligence.html

### Q1: What do you think ROUA is selling?

**Buyer's mental model:** "A risk intelligence system that monitors regulatory and sanctions events, maps exposure, and produces audit-ready risk alerts with evidence chains. It's not a screening tool — it's an intelligence layer that makes risk assessments defensible."

### Q2: What problem do you think it solves?

**Buyer's mental model:** "The audit reconstruction problem. When regulators ask 'how did you identify this exposure?', we currently spend weeks rebuilding the trail. If ROUA builds the trail at detection time, that's a significant compliance burden reduction."

### Q3: What did you see that you can actually verify?

**Buyer's mental model:** "The OFAC sb0581 evidence chain is real — I can open the Treasury press release and verify the designation. The risk alert sample shows the evidence chain structure. The methodology documents source hierarchy and confidence signals. This is more governance documentation than most vendors provide."

### Q4: What was NOT proven to you?

**Buyer's mental model:** "No customer deployment. No regulatory acceptance — the D8 boundary explicitly says 'Regulatory acceptance of ROUA outputs as compliance evidence' is NOT proven. No real-time screening. No integration with our risk infrastructure."

### Q5: Why might you need to deploy it?

**Buyer's mental model:** "If the evidence chain works at scale across all the regulatory sources we monitor, it could transform our compliance audit response. Instead of reconstructing trails, we'd have them built at detection time."

### Q6: What would you ask for in a meeting?

**Buyer's mental model:** "I'd want to see: (1) the system monitoring sources WE care about (not just OFAC), (2) how it handles false positives, (3) whether regulators would accept ROUA outputs as audit evidence, (4) deployment timeline, (5) cost."

### Q7: What prevents you from requesting a meeting now?

**Buyer's mental model:** "The D8 boundary is refreshingly honest — but it also tells me that ROUA hasn't been tested in a regulatory context. As a CRO, I can't deploy something that hasn't been validated by at least one other regulated institution. I need a reference — even an unnamed one: 'Pilot deployment with a [type] institution completed in [timeframe].'"

### Q8: What do you need to see before considering a pilot logical?

**Buyer's mental model:** "Evidence that the system handles our regulatory scope (not just OFAC), some indication of deployment timeline and cost, and at least one reference — even unnamed — that another institution has evaluated it."

### Q9: Does the cost seem justified?

**Buyer's mental model:** "Audit reconstruction cost is real and measurable. If I knew the system reduced reconstruction time by even 50%, I could justify a significant cost. But I don't have that number, and the site doesn't provide one."

### Q10: Product, platform, infrastructure, or tool?

**Buyer's mental model:** "It's a compliance infrastructure layer — similar to how a KYC/AML platform sits beneath the compliance workflow. But it's positioned as 'Risk Intelligence' (a product), not 'Risk Infrastructure' (a layer). The distinction matters for procurement."

---

## 5. Compliance Officer — Reading risk-intelligence.html

### Q1: What do you think ROUA is selling?

**Buyer's mental model:** "A system that makes risk alerts defensible — each alert carries its evidence chain back to the official source. It's not a screening engine; it's an evidence layer that makes our existing risk monitoring auditable."

### Q2: What problem do you think it solves?

**Buyer's mental model:** "The 'where did this come from?' problem. When audit or regulators question a risk assessment, we currently rebuild the context from fragmented logs. If the evidence chain is built at detection time, we can respond in minutes instead of weeks."

### Q3: What did you see that you can actually verify?

**Buyer's mental model:** "I can open the OFAC press release and verify the designation. I can see how ROUA maps the exposure. I can read the methodology and evaluate the governance controls. This is more transparency than I've seen from most compliance vendors."

### Q4: What was NOT proven to you?

**Buyer's mental model:** "No customer deployment. No regulatory acceptance. No real-time screening. No integration. The D8 boundary is honest — but it tells me this is a promising concept, not a proven solution."

### Q5: Why might you need to deploy it?

**Buyer's mental model:** "If it works as described, it would significantly reduce our compliance reconstruction burden and improve our audit response time. But 'if it works as described' is the key question."

### Q6: What would you ask for in a meeting?

**Buyer's mental model:** "I'd want to see: (1) the system processing a real regulatory event from OUR jurisdiction, (2) how it handles false positives and edge cases, (3) what the audit trail looks like in practice, (4) how long deployment takes, (5) what it costs."

### Q7: What prevents you from requesting a meeting now?

**Buyer's mental model:** "I'm actually more interested than the CRO might be — the evidence chain concept is compelling for compliance. But I can't justify a meeting to my CRO without at least knowing the cost range and timeline. 'Request a Risk Intelligence Briefing' sounds like a sales call. I'd be more likely to engage if it said something like 'Review your regulatory sources against the ROUA registry' — a concrete, low-commitment action."

### Q8: What do you need to see before considering a pilot logical?

**Buyer's mental model:** "A source coverage check (are my sources in the 411+?), a timeline estimate, a cost range, and evidence that the system handles the edge cases we encounter (conflicting sources, delayed publications, jurisdictional variations)."

### Q9: Does the cost seem justified?

**Buyer's mental model:** "The compliance audit burden is quantifiable — I know what it costs us in person-hours to reconstruct evidence trails. If ROUA reduces that by even 30%, it would likely justify a significant annual cost. But I need the number."

### Q10: Product, platform, infrastructure, or tool?

**Buyer's mental model:** "It's a compliance evidence infrastructure. But it's sold as 'Risk Intelligence' — which sounds like a product that produces risk assessments. The actual value is the evidence layer, not the risk assessment. The positioning may be misleading compliance buyers."

---

## 6. Cross-Buyer Findings

### 6.1 What ALL 4 buyers agreed on

| Finding | Head of Research | CIO | CRO | Compliance |
|---|---|---|---|---|
| ROUA's evidence chain is real and verifiable | ✅ | ✅ | ✅ | ✅ |
| The concept is compelling | ✅ | ✅ | ✅ | ✅ |
| D8 boundary is refreshingly honest | ✅ | ✅ | ✅ | ✅ |
| One example is not enough to prove scale | ✅ | ✅ | ✅ | ✅ |
| No cost = can't build business case | ✅ | ✅ | ✅ | ✅ |
| No customer reference = can't justify internal evaluation | — | ✅ | ✅ | ✅ |
| Positioning confusion (product vs infrastructure) | ✅ | ✅ | ✅ | ✅ |

### 6.2 The 3 blocking gaps (not friction — blocking)

**Gap 1: No economic signal (all 4 buyers)**
Every buyer said some version of: "I can't justify a meeting without knowing the cost — even a range." The qualitative business consequence is sound, but no one can build a budget case from 'less manual reconciliation' alone.

**Gap 2: No institutional reference (CIO, CRO, Compliance)**
Three of four buyers said: "I can't start an internal evaluation without evidence that another institution has deployed this." This is not about testimonials — it's about risk reduction. No one wants to be the first.

**Gap 3: Positioning ambiguity (all 4 buyers)**
All four buyers were confused about whether ROUA is a product, platform, or infrastructure. The site says "product" (Investment Intelligence, Risk Intelligence) but the architecture says "infrastructure" (evidence layer, deployment models, API surface). This matters because:
- Products get evaluated by business users
- Infrastructure gets evaluated by CIOs and security teams
- Platforms get evaluated by both

If ROUA is infrastructure (which the architecture strongly suggests), positioning it as a product creates a mismatch: business users evaluate it and say "interesting, but I need IT to deploy it," while IT says "interesting, but I need security certifications and references."

### 6.3 The willingness-to-engage spectrum

| Buyer | Willingness to engage | Blocker |
|---|---|---|
| Head of Research | 🟡 Moderate — intrigued by evidence chain, needs scale proof + cost | No cost signal |
| CIO | 🔴 Low — cannot start evaluation without security docs + references | No security certifications, no named team |
| CRO | 🟡 Moderate — sees compliance value, needs regulatory validation | No customer reference, no regulatory acceptance |
| Compliance Officer | 🟢 Higher — most compelled by evidence chain concept | No cost signal, but most likely to engage if CTA is low-commitment |

### 6.4 The CTA observation

The current CTA ("Request an Investment Intelligence Briefing" / "Request a Risk Intelligence Briefing") implies a **product sales call**. But the buyers' mental model is closer to **infrastructure evaluation** — which requires a different engagement model.

The Compliance Officer's observation is revealing:
> "I'd be more likely to engage if it said something like 'Review your regulatory sources against the ROUA registry' — a concrete, low-commitment action."

This suggests the CTA might be **too heavy** — asking for a briefing when the buyer isn't ready to commit 30 minutes to a sales call. A lighter first step (source coverage check, methodology review, evidence chain walkthrough) might generate more engagement.

---

## 7. The Strongest Honest Ask

Per user direction: "What is the strongest ask we can make honestly right now?"

### What ROUA can honestly say today

1. ✅ "You can verify our evidence chain on a real event right now" (VERIFIED)
2. ✅ "You can inspect 6 sample intelligence outputs with real source links" (VERIFIED)
3. ✅ "You can review our methodology, source hierarchy, and governance controls" (VERIFIED)
4. ✅ "You can see which layers are operational and which are in development" (OPERATIONAL)
5. ✅ "You can evaluate our API surface and integration architecture" (ILLUSTRATIVE)

### What ROUA cannot honestly say today

1. ❌ "X institutions have deployed ROUA" (no customers)
2. ❌ "ROUA costs $X per year" (no pricing)
3. ❌ "ROUA saves X% of analyst time" (no measurement)
4. ❌ "ROUA is SOC 2 certified" (no certification)
5. ❌ "Our team includes [named experts]" (no named team)

### The strongest honest ask options

| Option | What it says | Who it attracts | Commitment level |
|---|---|---|---|
| **"Request an Institutional Briefing"** (current) | "Talk to us about deploying ROUA" | Buyers ready for a sales call | High (30-60 min meeting) |
| **"Review Your Sources Against Our Registry"** | "Check if we cover your jurisdictions" | Compliance/Research buyers evaluating fit | Low (asynchronous, 5 min) |
| **"Request an Evidence Review"** | "Walk through the evidence chain on your sources" | Technical buyers evaluating proof | Medium (30 min, technical) |
| **"Evaluate a Sample on Your Portfolio"** | "See ROUA process a company you cover" | Research buyers evaluating output quality | Medium (requires engagement) |

### Analysis

The current CTA ("Request a Briefing") is the **heaviest** ask — it implies the buyer is ready for a sales conversation. But the Buyer Reality Test suggests most buyers are at an **evaluation** stage, not a **purchasing** stage.

A lighter first step (source coverage check, evidence review) might:
1. Generate more initial engagement (lower commitment)
2. Qualify buyers before the briefing (they've already seen proof)
3. Provide ROUA with buyer-specific data (which sources they care about)

**But this is a strategic decision, not a website decision.** The CTA architecture (Wave 4-A) already supports multiple engagement paths — the question is whether to add a lighter one.

---

## 8. Strategic Conclusions

### 8.1 The site's current state (honest assessment)

| Dimension | Status | Evidence |
|---|---|---|
| Architecture | 🟢 Strong | 7-layer, 4 deployment models, API surface |
| Evidence continuity | 🟢 Strong | 11 VERIFIED artifacts, live source URLs, D8 boundary |
| Buyer routing | 🟢 Strong | solutionId architecture, contact personalization |
| Deployment narrative | 🟢 Strong | Workflow → handoff → deployment → briefing |
| Proof transparency | 🟢 Strong | "What You Can Verify" with D8 boundary |
| Commercial proof | 🔴 Absent | No customers, no numbers, no references |
| Economic case | 🔴 Absent | No pricing, no ROI, no pilot scope |
| Buyer willingness-to-engage | 🟡 Untested | No real buyer has been through the journey |

### 8.2 What the Buyer Reality Test reveals

The site is an **excellent explanation instrument** that has been upgraded to a **credible verification instrument** (via the Pilot Evidence units). But it is NOT yet a **buying instrument** because:

1. **No economic signal** — buyers can't build a business case
2. **No institutional reference** — buyers can't reduce perceived risk
3. **Positioning ambiguity** — buyers don't know if they're evaluating a product or infrastructure
4. **CTA may be too heavy** — asking for a briefing when buyers want to evaluate first

### 8.3 What this means for next steps

**The website has reached the limit of what it can do without product/company inputs.** Further site work (expanding Pilot, adding pages, refining CTAs) will produce marginal improvements. The breakthrough requires:

1. **(Product)** A real customer deployment — even a pilot
2. **(Business)** A pricing model — even a range
3. **(Company)** Named leadership — even just founder/CTO
4. **(Positioning)** A clear answer: is ROUA a product, platform, or infrastructure?

These are not website decisions. They are company decisions that the website can then reflect.

### 8.4 The question that remains

> **"هل هذا يجعل مؤسسة حقيقية تطلب اجتماعاً، أم يجعلها فقط تنبهر بأن ROUA موثق جيداً؟**

**Based on the Buyer Reality Test simulation:**

- A Head of Research would be **intrigued but not convinced** — they'd want to see it on their companies
- A CIO would **not request a meeting** — blocking gaps (security, references)
- A CRO would be **interested but cautious** — needs regulatory validation
- A Compliance Officer would be **most likely to engage** — but might prefer a lighter CTA

**The site makes buyers impressed that ROUA is well-documented. It does not yet make them want to buy.** The missing elements (cost, customer, positioning clarity) are not things the website can create — they require company-level decisions.

---

## 9. Recommendations (For User Decision — Not Implementation)

### What COULD still be done on the website (low-risk, if user approves)

1. **Add a lighter CTA option** — alongside "Request a Briefing," offer "Review Your Sources Against Our Registry" or "Request an Evidence Review" as a lower-commitment first step
2. **Clarify positioning** — explicitly state whether ROUA is infrastructure (sold to CIOs) or product (sold to business users) or both (sold as platform)
3. **Add a "Pilot Engagement" page** — describe what a pilot looks like (scope, duration, success criteria) even without pricing

### What CANNOT be done on the website (requires company decisions)

4. **First customer deployment** — requires product readiness + sales engagement
5. **Pricing model** — requires business strategy
6. **Named team** — requires team consent
7. **Security certifications** — requires audit process
8. **Published research** — requires Research Institute output

### What MUST NOT be done

- ❌ Fabricate any of the above
- ❌ Add more evidence units (Pilot expansion) before the commercial gap is addressed
- ❌ Change CTA without strategic decision on engagement model
- ❌ Start Wave 5

---

*End of Buyer Reality Test. No code modified. No commit. No implementation. This is a strategic assessment based on simulated buyer cognition. Awaiting user strategic direction.*

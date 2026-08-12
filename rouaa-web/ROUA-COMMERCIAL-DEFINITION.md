# ROUA Commercial Definition — Internal Decision Document

> **Status:** Internal strategic document. **Not for publication on the website. No code modified. No commit.**
> **Subject:** Product positioning, buyer architecture, pilot offer, commercial model — the deal structure beneath the website
> **Method:** Consolidate all strategic discoveries (Strategic Gap Review → Proof Inventory → Buying Evidence Architecture → Buyer Reality Test) into a single internal decision document
> **Per user direction:** "From website engineering to deal engineering. Fix positioning first, then build the commercial offer around it."
> **Baseline:** `6eb77c1` (Buyer Reality Test)
> **Date:** 2026-08-11

---

## 1. ROUA Positioning — Fixed

### 1.1 The decision

**ROUA = Institutional Financial Intelligence Infrastructure, delivered as a platform for institutional intelligence workflows.**

This is NOT a choice between product / platform / infrastructure. It is a layered identity:

| Layer | What it is | Who evaluates it | What they need to see |
|---|---|---|---|
| **Infrastructure** | Evidence engine: source registry → document intelligence → fact extraction → evidence/provenance → governance | CIO / Enterprise Architect / CTO | Architecture, deployment models, security, governance controls, API surface |
| **Platform** | Intelligence foundation: 7-layer system that institutions deploy alongside their existing stack | Head of Platform / Technology Leadership | Adoption workflow, integration surface, deployment models, operational status |
| **Intelligence Workflows** | Configured products: Investment, Market, Risk, Media Intelligence + Developer Platform | Head of Research / CRO / Editorial Director / Head of Trading | Workflow fit, output quality, evidence chains, sample intelligence |
| **Evidence-backed Outputs** | Governed Intelligence Objects with full provenance | Analysts / Risk Officers / Editors / Developers | Verifiable evidence chains, source links, confidence signals, audit trail |

### 1.2 Why this resolves the positioning ambiguity

The Buyer Reality Test found that all 4 buyer archetypes were confused: "Is ROUA a product, platform, or infrastructure?"

**Answer: It is all four — at different layers of the institutional stack.**

- The CIO buys **infrastructure** (evidence engine deployed in their environment)
- The Head of Research uses **intelligence workflows** (Investment Intelligence product)
- The analyst receives **evidence-backed outputs** (Intelligence Objects with provenance)
- The platform team manages the **platform** (7-layer system alongside existing stack)

**The website must communicate all four layers — but the BUYER enters at the layer most relevant to their role.** This is what the solutionId routing already does (Wave 4-A): each buyer enters at their layer, and the journey connects them to the layers beneath.

### 1.3 What this means for the website (later — not now)

When we return to the website, the positioning should be stated explicitly:

> "ROUA is institutional financial intelligence infrastructure — delivered as a platform, configured into intelligence workflows, and producing evidence-backed outputs that institutions can verify, govern, and defend."

This single sentence resolves the ambiguity. But we do NOT add it now — we fix the commercial architecture first.

---

## 2. Who Actually Buys

### 2.1 The buyer matrix

| Buyer | Layer they enter at | What they're buying | What blocks them (from Buyer Reality Test) |
|---|---|---|---|
| **Head of Research** | Intelligence Workflows | Defensible investment research with evidence chains | No cost signal, no scale proof |
| **CIO** | Infrastructure | Evidence infrastructure deployed in their environment | No security certs, no named team, no customer reference |
| **CRO / Head of Risk** | Intelligence Workflows | Audit-ready risk monitoring with provenance | No customer reference, no regulatory validation |
| **Compliance Officer** | Evidence-backed Outputs | Defensible compliance records built at detection time | No cost signal, CTA too heavy |
| **Editorial Director** | Intelligence Workflows | Evidence-linked editorial intelligence | (Not tested — financial-media Pilot not yet built) |
| **Head of Trading** | Intelligence Workflows | Evidence-backed trading intelligence | (Not tested — trading-platform has structural evidence gap) |
| **CTO / Head of Platform** | Platform | Platform architecture to deploy alongside stack | Needs operational proof, deployment timeline |
| **Engineering Lead** | Evidence-backed Outputs | API surface with evidence-linked intelligence | API is representative (not production contract) |

### 2.2 The primary buyer

**Head of Research / Head of Risk / Editorial Director** — these are the buyers who experience the institutional pain (research without evidence, compliance without audit trails, editorial without verification). They are the ones who say "we need this."

**CIO / CTO** — these are the evaluators who must approve the deployment. They are the ones who say "we can deploy this."

**The buying journey has two gates:**
1. **Pain gate** (Head of Research/Risk/Editorial): "Do I need this?" → answered by the website (evidence chains, workflow, institutional job)
2. **Deployment gate** (CIO/CTO): "Can I deploy this?" → currently blocked (no security, no references, no pricing)

### 2.3 What this means for the commercial model

The commercial model must serve BOTH gates:
- The pain gate needs a low-friction entry (not a "briefing" — an evaluation)
- The deployment gate needs institutional readiness signals (security, references, timeline)

---

## 3. Institutional Problem — What ROUA Solves

### 3.1 The problem (validated by Buyer Reality Test)

| Problem | Who feels it | Current cost | ROUA's answer |
|---|---|---|---|
| Research without evidence context | Head of Research, analysts | Manual source reconciliation, indefensible conclusions | Evidence-linked intelligence from official sources |
| Compliance reconstruction burden | CRO, Compliance Officer | Weeks rebuilding evidence trails for audit/regulators | Evidence chains built at detection time |
| Editorial verification bottleneck | Editorial Director | Speed vs accuracy trade-off | Evidence-backed publishing with source attribution |
| Workflow fragmentation | CIO, Head of Platform | Disconnected systems, no shared evidence layer | One intelligence infrastructure alongside existing stack |

### 3.2 The value proposition (per buyer)

| Buyer | Value proposition | Evidence on site today |
|---|---|---|
| Head of Research | "Your research team can verify how every conclusion was constructed" | ✅ Aramco evidence chain (VERIFIED) |
| CRO | "Your compliance team can show regulators exactly how exposure was identified" | ✅ OFAC evidence chain (VERIFIED) |
| Editorial Director | "Your newsroom can publish claims with full source attribution" | ✅ ECB evidence chain (VERIFIED) |
| CIO | "Your institution gets an evidence infrastructure layer alongside your existing stack" | ✅ Platform adoption workflow (Wave 4-B) |

---

## 4. Pilot Entry Point

### 4.1 The current problem

The website asks buyers to "Request a Briefing" — a 30-60 minute sales call. But the Buyer Reality Test showed:
- Head of Research: "intrigued but not convinced — need to see it on my companies"
- Compliance Officer: "I'd prefer a lower-commitment first step"
- CIO: "can't start evaluation without security docs"

**"Request a Briefing" is too heavy for evaluation-stage buyers and too light for deployment-stage buyers.**

### 4.2 The proposed entry architecture

```
Entry (low commitment)
│
├── Option A: Source Coverage Review
│   "Check if your sources are in the 411+ registry"
│   Commitment: 5 minutes, asynchronous
│   Value to buyer: confidence in source coverage
│   Value to ROUA: learn buyer's source universe
│
├── Option B: Evidence Review
│   "Walk through the evidence chain on a source you care about"
│   Commitment: 30 minutes, technical
│   Value to buyer: verify the system works on their sources
│   Value to ROUA: demonstrate capability on buyer-specific input
│
└── Option C: Institutional Briefing (current)
    "Full briefing on capabilities, deployment, and workflow fit"
    Commitment: 60 minutes, strategic
    Value to buyer: full evaluation
    Value to ROUA: qualified buyer
```

### 4.3 The entry principle

**The buyer chooses their entry point based on their readiness.** ROUA does not force all buyers through the same door. The solutionId routing (Wave 4-A) already supports this — each entry can carry context.

**But we do NOT implement this on the website now.** We fix the commercial model first, then reflect it on the site.

---

## 5. Pilot Scope

### 5.1 What a pilot includes

| Dimension | What's included | What's NOT included |
|---|---|---|
| **Sources** | Buyer-selected subset (e.g., 20-50 sources from their jurisdiction) | Full 411+ registry |
| **Workflows** | 1-2 workflows (e.g., investment research OR risk monitoring) | All 4 intelligence products |
| **Outputs** | Intelligence Objects with evidence chains on buyer's sources | Production-scale intelligence across all markets |
| **Deployment** | ROUA internal environment (buyer reviews outputs) | Customer environment deployment |
| **Duration** | 2-4 weeks | Ongoing production |
| **Governance** | ROUA governance controls demonstrated | Buyer's governance framework integration |
| **Success criteria** | Defined below | ROI measurement (requires production deployment) |

### 5.2 What a pilot does NOT include

- ❌ Customer environment deployment (that's the next stage)
- ❌ All sources (pilot uses a subset)
- ❌ All workflows (pilot uses 1-2)
- ❌ ROI measurement (requires production data)
- ❌ Security certification (pilot runs in ROUA environment)
- ❌ Integration with buyer's systems (pilot produces outputs for review, not live integration)

### 5.3 Pilot success criteria

The pilot succeeds if the buyer can answer:

> **"Based on what I've seen during the pilot, ROUA provides institutional value that justifies moving to a deployment evaluation."**

Specifically:
1. ✅ Evidence chains are real and traceable on the buyer's sources
2. ✅ Intelligence outputs are usable in the buyer's workflow
3. ✅ Governance controls are visible and adequate
4. ✅ The system handles edge cases (conflicting sources, missing data)
5. ✅ The buyer wants to proceed to deployment evaluation

The pilot fails if:
- ❌ Evidence chains don't work on the buyer's sources
- ❌ Outputs don't fit the buyer's workflow
- ❌ The buyer doesn't see sufficient value to proceed

---

## 6. Deployment Transition

### 6.1 From pilot to deployment

```
Pilot (2-4 weeks, ROUA environment)
    ↓
    If pilot succeeds:
    ↓
Deployment Evaluation (2-4 weeks)
    ├── Security review
    ├── Integration architecture
    ├── Deployment model selection (Cloud / Private Cloud / On-Prem / Hybrid)
    ├── Governance framework mapping
    └── Commercial terms
    ↓
    If deployment evaluation succeeds:
    ↓
Production Deployment (4-12 weeks depending on model)
    ├── Environment provisioning
    ├── Source onboarding
    ├── Workflow configuration
    ├── Governance setup
    ├── Integration
    └── Go-live
```

### 6.2 Timeline honesty

| Stage | Duration | Variables |
|---|---|---|
| Pilot | 2-4 weeks | Source scope, workflow complexity |
| Deployment Evaluation | 2-4 weeks | Security review depth, integration complexity |
| Production Deployment | 4-12 weeks | Deployment model (Cloud fastest, On-Prem slowest), source scope, governance requirements |

**Total: 8-20 weeks from first contact to production.** This is honest — it's not a "sign up and start using it" SaaS model. It's institutional infrastructure deployment.

---

## 7. Commercial Model

### 7.1 Pricing principles

Per user direction: "Pricing based on deployment + source scope + workflow scope + governance + support — NOT per-seat or AI features."

| Dimension | What it means | Why it matters |
|---|---|---|
| **Deployment model** | Cloud SaaS < Private Cloud < On-Prem < Hybrid | Infrastructure cost scales with isolation |
| **Source scope** | Number of sources monitored + jurisdictions covered | More sources = more ingestion, more monitoring |
| **Workflow scope** | Number of intelligence products (1-4) + workflows configured | More workflows = more configuration, more outputs |
| **Governance** | Custom governance rules, validation gates, audit requirements | More governance = more configuration, more compliance |
| **Support** | Standard / Priority / Dedicated | More support = more operational overhead |

### 7.2 The minimum viable pilot price

Per user direction: "What is the minimum we ask from an institution to make the pilot economically logical for ROUA?"

**This is an internal business decision — not a website decision.** The document identifies the question but does not set the number. The number depends on:
- ROUA's operational cost per pilot (engineering time, source onboarding, support)
- The value of pilot learnings (source coverage data, workflow validation)
- The strategic value of the first customer reference

### 7.3 What the website should eventually show (NOT now)

When pricing is defined internally, the website should show:
- **NOT a price list** — institutional infrastructure is not priced per-seat
- **A pilot framework** — what's included, what's not, how long, what success looks like
- **A deployment timeline** — honest stages from pilot to production
- **A commercial model description** — what drives cost (deployment + scope + governance), not a number

---

## 8. Production Contract

### 8.1 What a production contract includes

| Element | Description |
|---|---|
| Deployment model | Cloud / Private Cloud / On-Prem / Hybrid |
| Source scope | Defined set of sources, jurisdictions, source types |
| Workflow scope | Defined intelligence products + workflows |
| Governance | Custom rules, validation gates, audit trail configuration |
| SLA | Uptime, response time, support response |
| Data processing | Data residency, retention, deletion |
| Security | Security framework (when certifications exist) |
| Commercial terms | Annual license + implementation + support |
| Term | Annual commitment with renewal |
| Exit | Data portability, transition support |

### 8.2 What a production contract does NOT include

- ❌ Per-seat pricing (institutional infrastructure is not per-seat)
- ❌ Feature-based tiers (governance is governance — no "premium governance")
- ❌ AI feature add-ons (intelligence is the product, not an add-on)
- ❌ Usage-based pricing (institutions need predictable costs)

---

## 9. The Complete Commercial Architecture

```
ROUA POSITIONING
  Institutional Financial Intelligence Infrastructure
  delivered as a platform for institutional intelligence workflows
        ↓
WHO BUYS
  Pain gate: Head of Research / CRO / Editorial Director
  Deployment gate: CIO / CTO
        ↓
INSTITUTIONAL PROBLEM
  Research without evidence / Compliance reconstruction / Editorial verification
        ↓
PILOT ENTRY POINT
  A: Source Coverage Review (low commitment)
  B: Evidence Review (medium commitment)
  C: Institutional Briefing (high commitment)
        ↓
PILOT SCOPE
  2-4 weeks, ROUA environment, 20-50 sources, 1-2 workflows
  Success: buyer sees institutional value → deployment evaluation
        ↓
DEPLOYMENT TRANSITION
  2-4 weeks: security review, integration architecture, deployment model
        ↓
PRODUCTION DEPLOYMENT
  4-12 weeks: environment, sources, workflows, governance, integration
        ↓
COMMERCIAL MODEL
  deployment + source scope + workflow scope + governance + support
  NOT per-seat, NOT feature tiers, NOT AI add-ons
        ↓
PRODUCTION CONTRACT
  Annual license + implementation + support
  Defined scope, SLA, security, data processing, exit
```

---

## 10. What This Document Does NOT Do

- ❌ Does NOT set prices (internal business decision)
- ❌ Does NOT name customers (none exist yet)
- ❌ Does NOT claim security certifications (none exist yet)
- ❌ Does NOT change the website (commercial architecture first, website later)
- ❌ Does NOT create a Pilot page (commercial model must be validated first)
- ❌ Does NOT add CTAs (engagement model must be decided first)

---

## 11. What This Document DOES Do

1. ✅ **Fixes positioning** — ROUA = infrastructure delivered as platform, configured into workflows, producing evidence-backed outputs
2. ✅ **Maps buyers** — who buys at which layer, what blocks them
3. ✅ **Defines pilot scope** — what's included, what's not, success criteria
4. ✅ **Defines deployment transition** — pilot → evaluation → production timeline
5. ✅ **Defines commercial model principles** — what drives cost, what doesn't
6. ✅ **Defines production contract elements** — what a deal looks like
7. ✅ **Connects to website** — what the site should eventually reflect (not now)

---

## 12. Decisions Required (Internal — Not Website)

1. **Approve positioning** — "Institutional Financial Intelligence Infrastructure delivered as a platform"?
2. **Approve buyer model** — pain gate + deployment gate?
3. **Approve pilot scope** — 2-4 weeks, ROUA environment, 20-50 sources, 1-2 workflows?
4. **Approve pilot success criteria** — "buyer sees institutional value → deployment evaluation"?
5. **Approve deployment timeline** — 8-20 weeks total (pilot → evaluation → production)?
6. **Set minimum pilot price** — internal number (not for website)
7. **Define pricing model** — deployment + source scope + workflow scope + governance + support?
8. **Decide engagement model** — 3 entry points (source review / evidence review / briefing)?
9. **Identify first pilot candidate** — which institution type / which workflow?

**After these decisions: return to the website and reflect the commercial architecture.**

---

*End of ROUA Commercial Definition. Internal document. Not for publication. No code modified. No commit (other than this document). Awaiting user decisions on the 9 internal questions.*

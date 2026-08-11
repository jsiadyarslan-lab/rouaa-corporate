# Buying Evidence Architecture — Discovery

> **Status:** Discovery only. **No code modified. No commit. No implementation.**
> **Subject:** How to convert existing proof assets into institutional buying evidence that appears before the CTA — not after
> **Method:** Map every artifact → capability → institutional job → business consequence, then route to each solutionId
> **Per user direction:** "The goal is NOT to add a Proof Section. The goal is to make every page capable of proving the argument it asks the institution to believe — before asking for a briefing."
> **Baseline:** `2819ac1` (Proof Inventory & Buyer Evidence Audit)
> **Date:** 2026-08-11

---

## 1. The Architectural Problem

The site currently has this journey:

```
Institutional Problem → What ROUA Does → Workflow → Deployment → CTA (Briefing)
                                                                    ↓
                                                        Evidence (buried in "Experience" dropdown)
```

The buyer is asked to request a briefing BEFORE encountering the proof that would justify the request. The proof exists — 6 strong, verifiable assets — but it appears AFTER the CTA, not before.

**The required journey:**

```
Institutional Problem
    ↓
What ROUA Does
    ↓
What the Institution Receives
    ↓
What You Can Verify Today ← proof as part of the argument, not a separate section
    ↓
Evidence / Samples ← buyer inspects before being asked to act
    ↓
How It Fits Your Environment
    ↓
Deployment
    ↓
Briefing ← buyer arrives convinced, not just educated
```

**Key principle: Evidence is not a destination. It is part of the argument.**

---

## 2. Proof Taxonomy (Governance Rule for the Entire Site)

Per user direction, this taxonomy must become a governance rule — not copywriting.

| Classification | Meaning | What the site can say |
|---|---|---|
| **VERIFIED** | Real, independently checkable right now | "Click the source link. Verify the fact." |
| **OPERATIONAL** | Running in ROUA internal production | "Operational in our internal environment" |
| **DEMONSTRABLE** | Can be shown during briefing | "Demonstrable during institutional briefing" |
| **ILLUSTRATIVE** | Shows design, not production evidence | "Illustrative — workflow shown for demonstration" |
| **CUSTOMER-VALIDATED** | Proven in a customer environment | (Not yet applicable — no customers) |
| **COMMERCIAL** | Price, pilot scope, contract, ROI | (Not yet applicable — no pricing) |

**Governance rule:** No page may use a higher classification than the artifact actually warrants. The danger is not lack of proof — it is proof inflation as the site evolves.

---

## 3. Artifact Inventory — Complete Mapping

### 3.1 All proof artifacts on the site

| # | Artifact | Location | What it shows | Source | Live URL? | Classification |
|---|---|---|---|---|---|---|
| A1 | Aramco Evidence Chain | evidence-explorer.html#aramco-q1-2026 | 7-step chain: aramco.com press release → document → fact ($33.6B) → evidence → Intelligence Object | Saudi Aramco Q1 2026 | ✅ aramco.com | **VERIFIED** |
| A2 | FOMC Evidence Chain | evidence-explorer.html#fomc-jul-2026 | 7-step chain: federalreserve.gov FOMC statement → event → impact → output | Federal Reserve July 29 2026 | ✅ federalreserve.gov | **VERIFIED** |
| A3 | OFAC Evidence Chain | evidence-explorer.html#ofac-sb0581 | Sanctions action → designated entities → exposure → risk alert | OFAC sb0581 / U.S. Treasury | ✅ home.treasury.gov | **VERIFIED** |
| A4 | FOMC Media Evidence Chain | evidence-explorer.html#fomc-media-jul-2026 | FOMC event → editorial intelligence → publisher-ready output | Federal Reserve | ✅ federalreserve.gov | **VERIFIED** |
| A5 | Evidence Package (generic) | evidence-explorer.html#evidence-package | Structural view of evidence chain components | N/A | N/A | **ILLUSTRATIVE** |
| B1 | FOMC Intelligence Brief | sample-library.html #sample-fomc | Full intelligence output with evidence chain | Federal Reserve (Aug 2, 2026) | ✅ federalreserve.gov | **VERIFIED** |
| B2 | Earnings Evidence Report | sample-library.html #sample-earnings | Corporate earnings intelligence with source links | Saudi Aramco | ✅ aramco.com | **VERIFIED** |
| B3 | Market Impact Brief | sample-library.html #sample-market | Economic release analysis with evidence | U.S. Bureau of Labor Statistics | ✅ bls.gov | **VERIFIED** |
| B4 | Risk Alert | sample-library.html #sample-risk | Sanctions risk alert with OFAC source | OFAC / U.S. Treasury | ✅ ofac.treasury.gov | **VERIFIED** |
| B5 | Media Intelligence Brief | sample-library.html #sample-media | Editorial intelligence with ECB source | ECB | ✅ ecb.europa.eu | **VERIFIED** |
| B6 | API Intelligence Object | sample-library.html #sample-api | JSON Intelligence Object with provenance structure | FOMC (JSON provenance) | ⚠️ JSON (no live URL) | **ILLUSTRATIVE** |
| C1 | Source Registry Explorer | source-explorer.html | 21 real institutions with type, jurisdiction, trust tier | 21 real sources (Fed, ECB, BoE, BoJ, PBOC, SEC, NYSE...) | ⚠️ Names verifiable, no source links | **VERIFIED** (names) |
| C2 | Source Registry Overview | source-registry.html | 411+ sources classified by type + jurisdiction | Real institution names | ⚠️ No live links | **OPERATIONAL** |
| D1 | Methodology | methodology.html | Source hierarchy, confidence signals, verification workflow, edge cases | N/A (process documentation) | N/A | **VERIFIED** (readable) |
| D2 | Infrastructure Report | infrastructure-report.html | 6/7 layers operational, validation methods, walkthrough | FOMC event traced | ⚠️ During briefing | **OPERATIONAL** |
| E1 | API Surface | developers.html | 7 representative endpoints + authentication + code example | NVIDIA (synthetic) | ⚠️ Synthetic | **ILLUSTRATIVE** |
| E2 | Code Example | developers.html | Full curl + JSON response with evidence object | NVIDIA (synthetic) | ⚠️ Synthetic, labeled | **ILLUSTRATIVE** |
| F1 | Product page hero samples | investment/market/financial-media/risk | Real events with verified facts + source links | Aramco, FOMC, ECB, OFAC | ✅ Live URLs | **VERIFIED** |
| F2 | Platform Evidence Trace | platform.html | 4-step Aramco trace (research note → fact → document → origin) | Saudi Aramco | ⚠️ No live link | **OPERATIONAL** |

### 3.2 Summary by classification

| Classification | Count | Assets |
|---|---|---|
| **VERIFIED** | 11 | A1-A4, B1-B5, C1, D1, F1 |
| **OPERATIONAL** | 3 | C2, D2, F2 |
| **ILLUSTRATIVE** | 3 | A5, B6, E1-E2 |
| **CUSTOMER-VALIDATED** | 0 | — |
| **COMMERCIAL** | 0 | — |

**11 VERIFIED assets.** This is significantly more proof than the Strategic Gap Review suggested. The problem is definitively proof surfacing, not proof absence.

---

## 4. Artifact → Capability → Institutional Job → Business Consequence

Per user direction: "The buyer doesn't buy 'Aramco evidence chain.' They buy their institution's ability to convert official information into usable intelligence."

### Mapping for each key artifact

| Artifact | Capability it proves | Institutional Job it addresses | Business Consequence |
|---|---|---|---|
| **A1: Aramco Evidence Chain** | Evidence-backed financial intelligence from corporate disclosures | Research team can verify how a conclusion was constructed | Less manual source reconciliation + stronger defensibility |
| **A2: FOMC Evidence Chain** | Event-driven intelligence from central bank decisions | Market intelligence team can trace market event → official source → impact assessment | Faster event understanding + replayable decision trail |
| **A3: OFAC Evidence Chain** | Sanctions monitoring with traceable exposure | Compliance team can show regulator exactly how exposure was identified | Audit-ready compliance + reduced reconstruction cost |
| **A4: FOMC Media Evidence Chain** | Editorial intelligence from official events | Newsroom can publish verified claims with full attribution | Faster publishing + defensible editorial standards |
| **B1-B5: Sample Intelligence Outputs** | Complete intelligence products with full evidence chains | Institution can evaluate output quality before engagement | Informed evaluation + no blind commitment |
| **B6: API Intelligence Object** | Programmatic intelligence with provenance | Engineering team can evaluate integration structure | Integration readiness assessment |
| **C1: Source Registry Explorer** | Source coverage scope | Institution can verify their sources are covered | Confidence that ROUA covers their jurisdictions |
| **C2: Source Registry (411+)** | Scale of source monitoring | Institution knows the system is not a prototype | Scale confidence |
| **D1: Methodology** | Governance rigor (source hierarchy, confidence, verification) | Compliance/risk can evaluate methodology before engagement | Methodology transparency + no black-box concern |
| **D2: Infrastructure Report** | System maturity (what's operational vs in development) | CIO/CTO can assess deployment readiness | Honest maturity assessment + risk calibration |
| **E1-E2: API Surface + Code** | Integration capability (structure, not production) | Engineering team can evaluate API design | Integration planning (representative, not contract) |
| **F1: Hero samples** | Real events processed into intelligence | Buyer sees proof immediately on landing | First-impression credibility |
| **F2: Platform Evidence Trace** | Platform-level traceability | CTO can evaluate infrastructure-level evidence capability | Infrastructure confidence |

### The missing layer

**What the site proves:** ROUA can convert official sources into evidence-linked intelligence.
**What the site does NOT prove:** How this converts to measurable institutional value (time saved, cost reduced, risk mitigated).

**The gap is not artifact absence — it is the artifact → business consequence mapping.** The site shows the artifact but doesn't connect it to the institutional job it solves.

---

## 5. Buyer-Specific Proof Routing (by solutionId)

Per user direction: "The 6 assets should not all appear to every buyer. Use the canonical solutionId."

| solutionId | Primary proof artifacts | Why this proof for this buyer |
|---|---|---|
| **investment-intelligence** | A1 (Aramco chain) + B2 (Earnings sample) + F1 (hero Aramco) | Investment buyer cares about corporate earnings evidence → research defensibility |
| **market-intelligence** | A2 (FOMC chain) + B1 (FOMC sample) + B3 (Market Impact sample) + F1 (hero FOMC) | Market buyer cares about event-driven intelligence → market context |
| **financial-media** | A4 (FOMC Media chain) + B5 (ECB Media sample) + F1 (hero ECB) | Media buyer cares about editorial intelligence → publishable claims |
| **risk-intelligence** | A3 (OFAC chain) + B4 (Risk Alert sample) + F1 (hero OFAC) | Risk buyer cares about sanctions/regulatory evidence → audit-ready compliance |
| **api** | B6 (API Object sample) + E1-E2 (API surface + code) | Developer cares about API structure → integration capability |
| **platform** | F2 (Platform trace) + D2 (Infrastructure report) + C1-C2 (Source registry) | CTO cares about system maturity → deployment readiness |
| **enterprise** | D2 (Infrastructure report) + C2 (Source registry 411+) + D1 (Methodology) | Enterprise buyer cares about scale + governance → institutional fit |
| **sources** | C1 (Source Explorer) + C2 (Source Registry) + D1 (Methodology) | Sources buyer cares about coverage + governance → source trust |
| **business-case** | D1 (Methodology) + D2 (Infrastructure report) + B1-B5 (all samples) | Evaluation buyer cares about overall maturity → justify engagement |
| **general** | B1-B5 (all samples) + D1 (Methodology) | General buyer needs broad overview → breadth of proof |

### The routing principle

**Not every buyer sees every proof.** Each solutionId gets a proof path that matches its institutional job. This prevents the "giant proof page" problem and makes each proof encounter feel relevant, not encyclopedic.

---

## 6. Where Each Artifact Should Appear in the Journey

### Current state: proof appears AFTER CTA

```
Product page → Workflow → Deployment → CTA (briefing) → [proof buried in Experience dropdown]
```

### Required state: proof appears BEFORE CTA

```
Product page
  → Institutional Problem (buyer recognizes their pain)
  → What ROUA Does (buyer understands the solution)
  → What the Institution Receives (buyer sees the output)
  → What You Can Verify Today (buyer inspects proof for their use case)
  → How It Fits Your Environment (buyer understands deployment)
  → Briefing (buyer arrives convinced)
```

### Per-page proof insertion points

| Page | Where proof should appear | Which artifact |
|---|---|---|
| investment-intelligence.html | After "What Investment Intelligence Produces" section, before Capabilities | Link to A1 (Aramco chain) + B2 (Earnings sample) |
| market-intelligence.html | After "Evidence Example — FOMC" section (already has FOMC walkthrough) | Link to B1 (FOMC sample) + B3 (Market Impact sample) |
| financial-media.html | After "Evidence Demonstration — ECB" section (already has ECB chain) | Link to B5 (Media sample) + A4 (Media chain) |
| risk-intelligence.html | After "Evidence Example — OFAC" section (already has OFAC walkthrough) | Link to B4 (Risk Alert sample) + A3 (OFAC chain) |
| trading-platform.html | After "Evidence Chain" section (currently conceptual) | Link to B1 (FOMC sample) — closest match for trading |
| platform.html | After "Evidence Trace Demo" section (already has Aramco trace) | Link to D2 (Infrastructure report) + B2 (Earnings sample) |
| developers.html | After "Example Request/Response" section (already has code) | Link to B6 (API Object sample) — already done in Wave 4-C |
| enterprise.html | After "Deployment Models" section | Link to D2 (Infrastructure report) + C1 (Source Explorer) |

**Key observation:** Most pages ALREADY have an evidence section (Evidence Example, Evidence Demonstration, Evidence Trace). The problem is not that proof is absent from the page — it's that the page doesn't connect the proof to the **business consequence** and doesn't explicitly say "you can verify this now."

**The fix is not adding new sections. It's adding the artifact → capability → institutional job → business consequence mapping to the existing evidence sections, plus making the sample-library link a "verify now" call rather than a "view samples" navigation link.**

---

## 7. What's Missing to Convert Intelligence Proof into Institutional Buying Proof

### 7.1 What EXISTS (strong)

- ✅ 11 VERIFIED artifacts with real sources and live URLs
- ✅ Evidence chains structurally complete
- ✅ Methodology documented
- ✅ Infrastructure status honest
- ✅ Sample outputs comprehensive (6 products)

### 7.2 What's MISSING (the gap)

| Gap | What it means | Can the website fix it? |
|---|---|---|
| **Artifact → Business Consequence mapping** | The site shows WHAT ROUA produces but not WHY it matters financially | ✅ YES — add 1-2 sentences per evidence section connecting proof to institutional job |
| **"Verify Now" framing** | Proof links are labeled "Inspect in Evidence Explorer" (technical) not "Verify this yourself" (buying) | ✅ YES — reframe link labels from technical to buying language |
| **Buyer-specific proof routing** | All buyers see the same proof, not proof matched to their use case | ✅ YES — use solutionId to route proof on product pages |
| **Proof before CTA** | CTA appears before proof in the journey | ✅ YES — restructure page ordering (evidence before CTA) |
| **Customer validation** | No customer has deployed ROUA | ❌ NO — requires real customer |
| **Pricing/pilot scope** | No economic framework | ❌ NO — requires business strategy |
| **Named team** | No public team members | ❌ NO — requires team consent |
| **Published research** | Research Institute has no publications | ❌ NO — requires research output |
| **Security certifications** | No SOC 2/ISO 27001 | ❌ NO — requires audit process |

### 7.3 The critical insight

**4 of the 9 gaps CAN be fixed by the website.** These 4 are all about proof surfacing and framing — not about creating new proof. The other 5 require product/company decisions.

**The website's next job is not to add proof. It's to convert existing proof into buying evidence by:**
1. Connecting each artifact to the institutional job it proves
2. Reframing proof links from technical ("Inspect in Evidence Explorer") to buying ("Verify this yourself")
3. Routing buyer-specific proof via solutionId
4. Ensuring proof appears before CTA in the journey

---

## 8. The "What You Can Verify Today" Element

Per user direction: not a marketing badge, but a clear, structured element.

### Design principle

Each product page's existing evidence section gets a **"What You Can Verify Today"** sub-section that:

1. Names the artifact (e.g., "Aramco Q1 2026 Evidence Chain")
2. States what it proves (e.g., "Follow a verified financial fact from official filing to intelligence output")
3. States what the buyer can inspect (e.g., "Source document → extracted fact → evidence chain → Intelligence Object")
4. Links to the artifact (e.g., evidence-explorer.html#aramco-q1-2026)
5. Classifies honestly (e.g., "Verified — source link is live")

### Example (for investment-intelligence.html)

```
What You Can Verify Today

Evidence Chain — Saudi Aramco Q1 2026
Follow a verified financial fact from the official filing through extraction,
evidence, and intelligence output.

Inspect: source → document → fact → evidence → intelligence object
Classification: VERIFIED — source link is live and independently checkable

[Open Evidence Chain →]    [View Sample Intelligence Output →]
```

### What this replaces

This replaces the current pattern:
- "Inspect in Evidence Explorer →" (technical, passive, after CTA)

With:
- "What You Can Verify Today" + artifact description + "Open Evidence Chain →" (buying, active, before CTA)

---

## 9. What Must Not Be Done

- ❌ Do NOT create a standalone "Proof" page — proof must be part of each page's argument
- ❌ Do NOT show all 6 artifacts to every buyer — route by solutionId
- ❌ Do NOT add "No customers" or "No pricing" as visible negative claims — use honest classification instead
- ❌ Do NOT fabricate customers, numbers, testimonials, or certifications
- ❌ Do NOT change the existing evidence sections' content — add the mapping layer above/around them
- ❌ Do NOT touch index.html (FROZEN)
- ❌ Do NOT start implementation before user approves this architecture

---

## 10. Decisions Required Before Implementation

1. **Approve the proof taxonomy** (VERIFIED / OPERATIONAL / DEMONSTRABLE / ILLUSTRATIVE / CUSTOMER-VALIDATED / COMMERCIAL) as a governance rule?
2. **Approve the artifact → capability → institutional job → business consequence mapping** approach?
3. **Approve buyer-specific proof routing** (each solutionId gets different proof artifacts)?
4. **Approve "What You Can Verify Today"** as a sub-section within existing evidence sections (not a standalone page)?
5. **Approve the principle: proof appears before CTA** in the journey?
6. **Confirm: do NOT add visible "no customers / no pricing" claims** — use honest classification instead?
7. **Which pages to start with?** (Recommend: the 4 product pages that already have evidence sections — investment, market, financial-media, risk)

---

*End of Buying Evidence Architecture Discovery. No code modified. No commit. No implementation. Awaiting user strategic direction.*

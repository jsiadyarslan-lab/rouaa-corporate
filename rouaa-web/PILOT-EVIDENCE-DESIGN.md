# Buying Evidence Architecture — Pilot Design

> **Status:** Design only. **No code modified. No commit. No implementation.**
> **Subject:** Canonical evidence unit design for 2 pilot pages: investment-intelligence.html + risk-intelligence.html
> **Method:** Design the exact structure, placement, and content of the "What You Can Verify" unit — including D8 Claim Boundary — for each page
> **Per user direction:** "Design the canonical evidence unit for investment and risk. If this model succeeds, then we transfer to market and financial-media."
> **Key test:** "Can we convert existing proof into buying evidence without overstating what it proves?"
> **Baseline:** `eebff5a` (Buying Evidence Architecture Discovery)
> **Date:** 2026-08-11

---

## 1. The Canonical Evidence Unit

Every "What You Can Verify" unit follows this structure:

```
WHAT YOU CAN VERIFY
│
├── Artifact name
├── What it proves (capability)
├── What it does NOT prove (D8 Claim Boundary)
├── Institutional job it addresses
├── Business consequence
├── Classification (VERIFIED / OPERATIONAL / ILLUSTRATIVE)
├── Inspect action (link to evidence-explorer)
└── Sample action (link to sample-library)
```

**Design principles:**
1. Not a marketing card — a verification invitation
2. D8 Claim Boundary is mandatory — every unit states what it does NOT prove
3. Classification is visible — buyer knows the evidence tier
4. Two actions only: Inspect (evidence chain) + Sample (intelligence output)
5. Maximum 1-2 units per page — not a proof catalog

---

## 2. Pilot Page 1: `investment-intelligence.html`

### 2.1 Current section order

```
1. Hero (Aramco sample in glass card + Inspect/View Sample links)
2. The Investment Research Problem
3. What Investment Intelligence Produces
4. Capabilities (+ What You Receive + Differentiation + Evidence Chain visual)
5. How It Works (6-step buyer workflow + handoff)
6. Built For
7. Deployment
8. CTA
```

### 2.2 Where to place the evidence unit

**After section 4 (Capabilities, which already contains the Evidence Chain visual) and before section 5 (How It Works).**

Rationale: The buyer has just seen what ROUA produces (section 3) and what capabilities it has (section 4). The Evidence Chain visual is already in section 4. The "What You Can Verify" unit transforms that conceptual chain into a verifiable claim — then the buyer proceeds to How It Works (the workflow) with proof already established.

### 2.3 The evidence unit for investment

```
WHAT YOU CAN VERIFY

Evidence Chain — Saudi Aramco Q1 2026 Earnings

WHAT IT PROVES:
A verified financial fact ($33.6B adjusted net income) can be traced from
the official Aramco press release through document intelligence, fact
extraction, evidence linkage, and into a governed Intelligence Object.

WHAT IT DOES NOT PROVE:
- Customer deployment of this pipeline
- Production-scale performance under institutional load
- ROI or time savings for a research team
- Integration with a specific institution's research infrastructure

INSTITUTIONAL JOB:
Research teams can verify how an investment conclusion was constructed —
not just read the conclusion, but inspect the source document, page,
paragraph, and extraction confidence behind each material claim.

BUSINESS CONSEQUENCE:
Less manual source reconciliation. Stronger defensibility before investment
committees. Research outputs that survive audit — because the evidence
chain was built at extraction time, not reconstructed later.

CLASSIFICATION: VERIFIED
The source link (aramco.com) is live and independently checkable. The
evidence chain is traceable from source to output. The intelligence object
structure is inspectable.

INSPECT: [Open Evidence Chain →] → evidence-explorer.html#aramco-q1-2026
SAMPLE: [View Earnings Evidence Report →] → sample-library.html#sample-earnings
```

### 2.4 What changes on the page

| Element | Current state | After pilot |
|---|---|---|
| Hero glass card "Inspect" + "View Sample" links | Present (Wave 4-C) | **Keep as-is** — early-CTA buyers can still verify immediately |
| Capabilities Evidence Chain visual | Conceptual chain: Event → Disclosure → Facts → Evidence → Context → Conclusion | **Keep as-is** — explains capability |
| **NEW: "What You Can Verify" unit** | Does not exist | **Insert after Capabilities section, before How It Works** — transforms conceptual chain into verifiable buying evidence with D8 boundary |
| How It Works handoff | Present (Wave 4-B) | **Keep as-is** |
| Deployment | Present | **Keep as-is** |
| CTA | Present | **Keep as-is** — but buyer now arrives with proof already seen |

### 2.5 What does NOT change

- ❌ Hero sample — stays as-is (early verification path for buyers who know what they want)
- ❌ Evidence Chain visual — stays as-is (explains capability, not proof)
- ❌ Workflow steps — stays as-is
- ❌ Deployment models — stay as-is
- ❌ CTA text — stays as-is
- ❌ "Built For" section — stays as-is

---

## 3. Pilot Page 2: `risk-intelligence.html`

### 3.1 Current section order

```
1. Hero (OFAC sample in glass card + Inspect/View Sample links)
2. The Risk Problem
3. Capabilities
4. Differentiation
5. How It Works (5-step buyer workflow + handoff)
6. Evidence Example — OFAC Sanctions Action (full walkthrough)
7. Buyer Environments
8. Deployment
9. CTA
```

### 3.2 Where to place the evidence unit

**After section 6 (Evidence Example — OFAC, which already contains the full walkthrough) and before section 7 (Buyer Environments).**

Rationale: The buyer has just seen the full OFAC evidence walkthrough (section 6). The "What You Can Verify" unit transforms that walkthrough from a demonstration into a buying claim with explicit boundary — then the buyer proceeds to Buyer Environments with proof established.

**This is different from investment** — investment places the unit after Capabilities (which has a conceptual chain), while risk places it after the Evidence Example (which has a full walkthrough). The placement follows where the proof already lives on each page.

### 3.3 The evidence unit for risk

```
WHAT YOU CAN VERIFY

Evidence Chain — OFAC Sanctions Action sb0581

WHAT IT PROVES:
A regulatory event (OFAC designation of two firms + eight vessels under
E.O. 13902) can be traced from the official U.S. Treasury press release
through event detection, exposure mapping, and into a governed Risk
Intelligence Alert with audit-ready provenance.

WHAT IT DOES NOT PROVE:
- Customer deployment of this risk monitoring pipeline
- Real-time sanctions screening across all OFAC lists
- Regulatory acceptance of ROUA outputs as compliance evidence
- Integration with a specific institution's risk or compliance infrastructure

INSTITUTIONAL JOB:
Risk and compliance teams can show a regulator or audit committee exactly
how a sanctions exposure was identified — not just the alert, but the
source document, the designated entities, the exposure path, and the
governance controls that validated the output.

BUSINESS CONSEQUENCE:
Audit-ready compliance records built at detection time — not reconstructed
weeks later from fragmented logs. Reduced compliance reconstruction cost.
Defensible exposure assessments that carry their evidence chain.

CLASSIFICATION: VERIFIED
The source link (home.treasury.gov) is live and independently checkable.
The evidence chain is traceable from source to risk alert. The governance
controls (source tier, validation status, confidence signals) are inspectable.

INSPECT: [Open Evidence Chain →] → evidence-explorer.html#ofac-sb0581
SAMPLE: [View Risk Alert Sample →] → sample-library.html#sample-risk
```

### 3.4 Verification: this is NOT earnings-centric

| Dimension | Investment (Aramco) | Risk (OFAC) |
|---|---|---|
| Source type | Corporate disclosure (aramco.com) | Regulatory action (home.treasury.gov) |
| Event type | Earnings release | Sanctions designation |
| Intelligence output | Investment Intelligence Object | Risk Intelligence Alert |
| Institutional job | Research defensibility | Compliance audit-readiness |
| Business consequence | Less manual reconciliation + committee defensibility | Audit-ready records + reduced reconstruction cost |
| What it does NOT prove | Customer deployment, ROI, integration | Customer deployment, real-time screening, regulatory acceptance |

**The model works for both — without forcing risk into an earnings frame.** The canonical unit structure is the same; the content is domain-specific.

---

## 4. D8 Claim Boundary — Explicit

### 4.1 Why D8 matters

The biggest risk in the next phase is not lack of proof — it is **proof inflation**: allowing the buyer to infer that "I can inspect the evidence chain" means "ROUA is commercially proven."

**D8 prevents this by explicitly stating what each artifact does NOT prove.**

### 4.2 Claim boundary for investment (Aramco)

**Proves:**
- ✅ Source traceability (aramco.com → document → fact → evidence → output)
- ✅ Extraction lineage (page, paragraph, confidence preserved)
- ✅ Evidence linkage (fact connected to source document)
- ✅ Intelligence Object construction (structured output with provenance)

**Does NOT prove:**
- ❌ Customer deployment of this pipeline
- ❌ Production-scale performance under institutional load
- ❌ ROI or time savings for a research team
- ❌ Integration with a specific institution's research infrastructure

### 4.3 Claim boundary for risk (OFAC)

**Proves:**
- ✅ Source traceability (home.treasury.gov → event → exposure → risk alert)
- ✅ Regulatory event detection (OFAC action identified and structured)
- ✅ Exposure mapping (designated entities + blocked property linked)
- ✅ Audit-ready provenance (governance controls, source tier, validation)

**Does NOT prove:**
- ❌ Customer deployment of this risk monitoring pipeline
- ❌ Real-time sanctions screening across all OFAC lists
- ❌ Regulatory acceptance of ROUA outputs as compliance evidence
- ❌ Integration with a specific institution's risk or compliance infrastructure

### 4.4 The governance rule

**Every "What You Can Verify" unit must contain both columns: what it proves AND what it does not prove.** No unit may appear without the D8 boundary. This is not optional copy — it is a structural requirement.

---

## 5. Visual Design Specification

### 5.1 The unit is NOT a card — it is a structured block

```
┌─────────────────────────────────────────────────────────────────┐
│ WHAT YOU CAN VERIFY                                              │
│                                                                  │
│ Evidence Chain — Saudi Aramco Q1 2026 Earnings                  │
│                                                                  │
│ WHAT IT PROVES                                                   │
│ A verified financial fact ($33.6B adjusted net income) can be   │
│ traced from the official Aramco press release through document  │
│ intelligence, fact extraction, evidence linkage, and into a     │
│ governed Intelligence Object.                                    │
│                                                                  │
│ WHAT IT DOES NOT PROVE                                           │
│ • Customer deployment of this pipeline                          │
│ • Production-scale performance under institutional load         │
│ • ROI or time savings for a research team                       │
│ • Integration with a specific institution's infrastructure      │
│                                                                  │
│ INSTITUTIONAL JOB                                                │
│ Research teams can verify how an investment conclusion was      │
│ constructed — not just read the conclusion, but inspect the     │
│ source document, page, paragraph, and extraction confidence     │
│ behind each material claim.                                     │
│                                                                  │
│ BUSINESS CONSEQUENCE                                             │
│ Less manual source reconciliation. Stronger defensibility       │
│ before investment committees. Research outputs that survive     │
│ audit — because the evidence chain was built at extraction      │
│ time, not reconstructed later.                                  │
│                                                                  │
│ CLASSIFICATION: VERIFIED                                         │
│ Source link is live and independently checkable.                │
│                                                                  │
│ [Open Evidence Chain →]  [View Earnings Evidence Report →]      │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Styling principles

- **Not a card with shadow/elevation** — it is a content block, not a UI widget
- **Gold accent border-left** — consistent with other evidence blocks on the site
- **Clear section labels** (WHAT IT PROVES, WHAT IT DOES NOT PROVE, etc.) — not headings, just labels
- **"WHAT IT DOES NOT PROVE" is visually equal to "WHAT IT PROVES"** — not smaller, not dimmed, not hidden
- **Two action links at the bottom** — Inspect (evidence-explorer) + Sample (sample-library)
- **Classification badge** — small, clear, not decorative

### 5.3 What the unit is NOT

- ❌ NOT a testimonial card
- ❌ NOT a feature card
- ❌ NOT a marketing badge
- ❌ NOT a "trust signal" widget
- ❌ NOT collapsible or hidden behind a toggle
- ❌ NOT the same as the existing Evidence Chain visual (which explains capability — this proves it)

---

## 6. Placement in the Journey

### 6.1 Investment page journey after pilot

```
1. Hero (Aramco sample + early verify links for buyers who know what they want)
2. The Investment Research Problem
3. What Investment Intelligence Produces
4. Capabilities (+ Evidence Chain visual — explains capability)
5. WHAT YOU CAN VERIFY (NEW — proves capability, with D8 boundary)
6. How It Works (6-step buyer workflow + handoff)
7. Built For
8. Deployment
9. CTA (buyer arrives with proof already seen)
```

### 6.2 Risk page journey after pilot

```
1. Hero (OFAC sample + early verify links)
2. The Risk Problem
3. Capabilities
4. Differentiation
5. How It Works (5-step buyer workflow + handoff)
6. Evidence Example — OFAC Sanctions Action (full walkthrough — demonstrates capability)
7. WHAT YOU CAN VERIFY (NEW — proves capability, with D8 boundary)
8. Buyer Environments
9. Deployment
10. CTA (buyer arrives with proof already seen)
```

### 6.3 D5 compliance (Proof before primary CTA)

Both pages now have proof (What You Can Verify) appearing before the primary CTA. The hero still has early verify links for buyers who know what they want (D5 exception — early CTA for informed buyers is acceptable).

---

## 7. Success Criteria for the Pilot

The pilot succeeds if:

1. ✅ A Head of Research reading investment-intelligence.html can, before reaching the CTA, inspect a real evidence chain and understand what it proves AND what it does not prove
2. ✅ A Risk/Compliance officer reading risk-intelligence.html can, before reaching the CTA, inspect a real OFAC evidence chain and understand what it proves AND what it does not prove
3. ✅ Neither page overstates what the evidence proves (D8 boundary present and clear)
4. ✅ The model works for both earnings (investment) and regulatory (risk) — not earnings-centric
5. ✅ The existing page content is not rewritten — only the new unit is added
6. ✅ The unit connects artifact → institutional job → business consequence (D2 mapping)

The pilot fails if:
- ❌ The D8 boundary is absent or unclear
- ❌ The unit reads like a marketing card
- ❌ The content overstates what the evidence proves
- ❌ The model doesn't transfer from investment to risk

---

## 8. What Happens After Pilot Success

If the pilot succeeds on investment + risk:
1. Apply the same canonical unit to market-intelligence.html (FOMC evidence)
2. Apply the same canonical unit to financial-media.html (ECB evidence)
3. Consider application to platform.html (Aramco trace) and developers.html (API object)

If the pilot reveals problems:
1. Iterate on the canonical unit structure
2. Re-test on both pages
3. Do not expand to market/financial-media until the model is stable

---

## 9. What Must NOT Be Done

- ❌ Do NOT add more than 1 "What You Can Verify" unit per page
- ❌ Do NOT remove the D8 boundary (what it does NOT prove)
- ❌ Do NOT make the unit look like a marketing card
- ❌ Do NOT rewrite existing evidence sections — only add the new unit
- ❌ Do NOT touch index.html (FROZEN)
- ❌ Do NOT change CTA text or placement
- ❌ Do NOT start implementation before user approves this design
- ❌ Do NOT expand to market/financial-media before pilot is verified

---

## 10. Decisions Required Before Implementation

1. **Approve the canonical evidence unit structure** (WHAT IT PROVES / WHAT IT DOES NOT PROVE / INSTITUTIONAL JOB / BUSINESS CONSEQUENCE / CLASSIFICATION / INSPECT / SAMPLE)?
2. **Approve the placement** (investment: after Capabilities; risk: after Evidence Example)?
3. **Approve the D8 Claim Boundary content** for both Aramco and OFAC?
4. **Approve the visual design specification** (structured block, not card; gold border-left; D8 visually equal to proof)?
5. **Approve the success criteria** for the pilot?
6. **Confirm: start with investment + risk only** — do not touch market/financial-media until pilot verified?

---

*End of Pilot Evidence Design. No code modified. No commit. No implementation. Awaiting user approval of the canonical evidence unit design.*

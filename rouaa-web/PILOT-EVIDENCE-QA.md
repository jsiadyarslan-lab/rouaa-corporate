# Pilot Evidence Strategic QA — Buying Evidence Transition Verification

> **Status:** QA complete. **No code modified during QA. No commit.**
> **Subject:** Pilot Evidence implementation (`59a1b2e`) — 8-gate buying evidence transition verification
> **Method:** Playwright browser testing (Chromium headless) — 8 acceptance gates, 36 tests
> **Result:** **36 PASS / 0 FAIL / 0 DISCLOSURE**
> **Baseline:** `59a1b2e` (Pilot Evidence Implementation)
> **Date:** 2026-08-11

---

## 1. Results Summary

| Gate | Tests | PASS | FAIL |
|---|---|---|---|
| A. Position | 4 | 4 | 0 |
| B. Evidence Integrity | 8 | 8 | 0 |
| C. D8 Claim Boundary | 6 | 6 | 0 |
| D. Institutional Translation | 4 | 4 | 0 |
| E. Buyer Cognition | 2 | 2 | 0 |
| F. Cross-domain Validity | 3 | 3 | 0 |
| G. Regression | 7 | 7 | 0 |
| H. Conversion Impact | 2 | 2 | 0 |
| **Total** | **36** | **36** | **0** |

---

## 2. Gate-by-Gate Results

### A. Position — What You Can Verify before primary CTA
- ✅ Investment: verify unit at position 34510, CTA at 54436 — verify before CTA
- ✅ Investment: verify after Capabilities (23510), before How It Works (38735)
- ✅ Risk: verify unit at position 43708, CTA at 60512 — verify before CTA
- ✅ Risk: verify after Evidence Example (12407), before Buyer Environments (48072)

### B. Evidence Integrity — source matching, no false continuity
- ✅ Investment page uses Aramco evidence + links to aramco-q1-2026 + sample-earnings
- ✅ sample-earnings uses aramco.com source — genuine match
- ✅ Risk page uses OFAC evidence + links to ofac-sb0581 + sample-risk
- ✅ sample-risk uses ofac.treasury.gov source — genuine match
- ✅ No false continuity on either page

### C. D8 Claim Boundary — present AND visually equal
- ✅ Both pages: "What it proves" and "What it does not prove" both present
- ✅ Both pages: font-size equal (11px/11px), font-weight equal (700/700)
- ✅ Both pages: "does not prove" contains actual boundary items (list with `<li>`)
- **D8 verified at computed-style level, not just text presence**

### D. Institutional Translation — Artifact→Capability→Job→Consequence
- ✅ Investment: all 4 elements present (Aramco artifact, proves text, research job, consequence)
- ✅ Investment: consequence is operational reasoning, NOT ROI claim (no %, no "saves X hours")
- ✅ Risk: all 4 elements present (OFAC artifact, proves text, compliance job, consequence)
- ✅ Risk: consequence is operational reasoning, NOT ROI claim

### E. Buyer Cognition — verifiable vs not-inferable
- ✅ Investment: buyer can identify what's verifiable + what's NOT inferable + classification visible
- ✅ Risk: buyer can identify what's verifiable + what's NOT inferable + classification visible

### F. Cross-domain Validity — not earnings-generic
- ✅ Investment proves research workflow (research teams, investment committees)
- ✅ Risk proves compliance workflow (compliance, regulator, audit, sanctions)
- ✅ No domain cross-contamination (investment has no "sanctions", risk has no "earnings season")

### G. Regression
- ✅ index.html: 0 diff vs b6ac82e (FROZEN)
- ✅ market-intelligence.html: not modified in pilot
- ✅ financial-media.html: not modified in pilot
- ✅ No new every-claim or audit-ready violations (risk C6 exception excluded)
- ✅ CTA text unchanged on both pages
- ✅ HTML balance: investment 216/216 divs 9/9 sections, risk 263/263 divs 10/10 sections

### H. Conversion Impact — proof precedes CTA
- ✅ Investment: journey ordered Problem→Produces→Capabilities→Verify→How It Works→Built For→Deployment→Briefing
- ✅ Risk: journey ordered Problem→Capabilities→How It Works→Evidence Example→Verify→Buyer Environments→Deployment→Briefing
- **Both: "What You Can Verify" appears before primary CTA in the journey**

---

## 3. The Buying Evidence Transition Test

Per user direction: *"After reading the unit, can the buyer identify what they can verify now, and what they cannot infer from it?"*

**YES — verified for both pages.**

| Page | What buyer can verify | What buyer cannot infer |
|---|---|---|
| Investment | How an investment conclusion was constructed (source → fact → evidence → output) | Customer deployment, production-scale performance, ROI, specific integration |
| Risk | How a sanctions exposure was identified (source → event → exposure → risk alert) | Customer deployment, real-time screening, regulatory acceptance, specific integration |

**The buyer leaves the unit knowing:**
1. ✅ What ROUA can prove (evidence chain from official source to intelligence output)
2. ✅ What ROUA cannot prove (customer deployment, ROI, integration)
3. ✅ What institutional job this addresses (research defensibility / compliance audit-readiness)
4. ✅ What business consequence it delivers (operational reasoning, not ROI claim)
5. ✅ Where to inspect the proof (evidence-explorer link)
6. ✅ Where to see the sample (sample-library link)

---

## 4. D8 Claim Boundary Verification

**D8 is verified at computed-style level, not just text presence.**

| Element | Investment | Risk |
|---|---|---|
| "What it proves" present | ✅ | ✅ |
| "What it does not prove" present | ✅ | ✅ |
| Font-size equal (proves vs not-proves) | ✅ 11px = 11px | ✅ 11px = 11px |
| Font-weight equal (proves vs not-proves) | ✅ 700 = 700 | ✅ 700 = 700 |
| Boundary items present (list with `<li>`) | ✅ 4 items | ✅ 4 items |

**D8 prevents proof inflation.** The buyer cannot infer that "I can inspect the evidence chain" means "ROUA is commercially proven" — because the unit explicitly states what it does NOT prove, with equal visual weight.

---

## 5. Cross-Domain Validity

The model works for both domains without being earnings-centric:

| Dimension | Investment (Aramco) | Risk (OFAC) |
|---|---|---|
| Source | Corporate disclosure (aramco.com) | Regulatory action (home.treasury.gov) |
| Intelligence output | Investment Intelligence Object | Risk Intelligence Alert |
| Institutional job | Research defensibility | Compliance audit-readiness |
| Business consequence | Less manual reconciliation + committee defensibility | Audit-ready records + reduced reconstruction cost |
| Domain language | "investment conclusion", "investment committees" | "compliance", "regulator", "sanctions", "audit" |
| Cross-contamination | None (no "sanctions" on investment page) | None (no "earnings season" on risk page) |

---

## 6. Conversion Impact Assessment

Per user direction: *"If the unit makes the page more provable but doesn't bring the buyer closer to a meeting decision, that's not a technical failure — but it will be important in the strategic judgment."*

**The journey now flows:**
```
Problem → Capability → WHAT YOU CAN VERIFY → Institutional meaning → Deployment → Briefing
```

The buyer encounters proof BEFORE the CTA. Whether this converts to more briefing requests is a commercial question that cannot be answered by QA — it requires real buyer interaction. But the architectural precondition is met: **the buyer arrives at the CTA having seen verifiable proof, not just architecture.**

---

## 7. Final Verdict

**Pilot Evidence: PASS (36/36)**

The canonical evidence unit works:
- ✅ Proof appears before CTA (D5 compliant)
- ✅ Evidence integrity maintained (no false continuity)
- ✅ D8 Claim Boundary present and visually equal
- ✅ Institutional translation complete (Artifact→Job→Consequence)
- ✅ Buyer cognition supported (verifiable + not-inferable both clear)
- ✅ Cross-domain validity confirmed (not earnings-centric)
- ✅ Zero regressions
- ✅ Journey ordering correct (proof precedes briefing)

**The pilot model is stable and can be transferred to market-intelligence.html and financial-media.html — pending user strategic decision.**

---

*End of Pilot Evidence Strategic QA. No code modified during QA. Verdict: PASS (36/36).*

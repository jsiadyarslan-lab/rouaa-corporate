# Wave 4-D — Discovery: Sovereign Friction + CTA Normalization

> **Status:** Audit only. **No code modified. No commit.**
> **Subject:** Wave 4-D — Sovereign buyer journey + CTA consistency + D7 Context Integrity impact
> **Method:** Sovereign journey mapping + complete CTA inventory + D7 chain verification
> **Per user direction:** Discovery only. Normalization ≠ homogenization. Do not assume every CTA should carry the same text.
> **Baseline:** `7c148fd` (Wave 4-C Remediation — Wave 4-C CLOSED, 45/45 PASS)
> **Date:** 2026-08-11

---

## 1. Sovereign Journey Map

### 1.1 The sovereign buyer's path

```
Catalog Card 6: "Sovereign & Economic Institutions"
  → CTA: "View Sovereign Workflow →" → enterprise.html
    → Hero: "Enterprise Solutions" / "Deploy ROUA Around Your Institution's Requirements"
      ⚠️ Does NOT name "sovereign" — generic enterprise framing
    → Enterprise Problem section: generic institutional pain
    → Deployment Models section:
      → Model 3 (Private Deployment): "Banks, sovereign funds, and institutions with strict
         data residency, compliance, or sovereignty requirements." ← sovereign named here (line 258)
    → Enterprise Governance section: "sovereignty requirements" mentioned (line 284)
    → CTA: "Request Enterprise Briefing" → contact.html?solution=enterprise
      → contact.html personalization:
        → eyebrow: "Enterprise Briefing Request"
        → heading: "Request an Enterprise briefing."
        → description: "...deployment planning for your sovereignty and governance requirements."
          ← sovereign concept present in contact description
        → interestValue: "Intelligence Infrastructure"
        → submitLabel: "Request an Enterprise Briefing"
```

### 1.2 Is "Sovereign" truly missing?

**NO — it is present but DEFERRED.** The sovereign buyer's journey works structurally:

| Step | Sovereign named? | Where |
|---|---|---|
| Catalog card 6 | ✅ YES | "Sovereign & Economic Institutions" — buyer recognized |
| Catalog CTA | ✅ YES | "View Sovereign Workflow →" — sovereign-specific label |
| enterprise.html hero | ❌ NO | "Enterprise Solutions" — generic |
| enterprise.html problem | ❌ NO | Generic institutional pain |
| enterprise.html deployment model 3 | ✅ YES | "Banks, sovereign funds, and institutions with strict data residency" |
| enterprise.html governance | ✅ YES | "sovereignty requirements" |
| contact.html enterprise description | ✅ YES | "sovereignty and governance requirements" |

**The sovereign buyer is named at entry (catalog) and at deployment (model 3) and at contact (description).** The gap is only in the enterprise.html hero — the first thing the buyer sees after clicking "View Sovereign Workflow →" from the catalog.

### 1.3 The friction point

The sovereign buyer clicks "View Sovereign Workflow →" from the catalog and lands on a hero that says "Enterprise Solutions" — not "Sovereign." For 3 seconds, the buyer may feel they landed on the wrong page. Then they scroll to deployment model 3 and see "sovereign funds" — reception is deferred, not absent.

**Is this worth fixing?** Per user direction: *"Do not add the word Sovereign just to improve copy if it expands positioning without commercial value."*

**Analysis:**
- enterprise.html serves THREE buyer types: Banks, Sovereign Funds, Enterprise/Bank
- The hero cannot name all three — it must be generic or pick one
- Making it sovereign-specific would alienate bank and enterprise buyers
- Making it "Enterprise / Sovereign / Bank" would be clunky
- The current generic "Enterprise Solutions" + deployment model 3 naming is structurally sound

**Verdict:** The sovereign friction is **a positioning choice, not a defect.** The buyer IS received — just not in the hero. The catalog CTA ("View Sovereign Workflow") + deployment model 3 + contact description create a coherent sovereign thread. Adding "sovereign" to the hero would NOT add commercial value — it would narrow the page's positioning.

### 1.4 Sovereign journey verdict

| Element | Status |
|---|---|
| Catalog recognition | ✅ Named explicitly |
| Catalog CTA | ✅ Sovereign-specific label |
| enterprise.html hero | ⚠️ Generic (positioning choice, not defect) |
| enterprise.html deployment model 3 | ✅ Named explicitly |
| enterprise.html governance | ✅ Sovereignty mentioned |
| contact.html description | ✅ Sovereignty mentioned |
| solutionId chain (D7) | ✅ enterprise → enterprise → enterprise (intact) |

**Recommendation:** Do NOT change enterprise.html hero. The sovereign friction is a positioning choice — the current structure covers sovereign buyers without narrowing the page. The 3-second hero gap is acceptable because the buyer sees "sovereign" within the first scroll (deployment model 3).

---

## 2. CTA Inventory

### 2.1 Complete CTA classification

| # | Page | CTA text | solutionId | Type | Issue? |
|---|---|---|---|---|---|
| 1 | investment-intelligence | "Request Investment Intelligence Briefing" | investment-intelligence | Briefing | ✅ Consistent |
| 2 | market-intelligence | "Request a Market Intelligence Briefing" | market-intelligence | Briefing | ✅ Consistent |
| 3 | financial-media | "Request a Media Intelligence Briefing" | financial-media | Briefing | ✅ Consistent |
| 4 | risk-intelligence (hero) | "Request Briefing" | (none — generic) | Briefing | ⚠️ No solutionId (missed in 4-A) |
| 5 | risk-intelligence (CTA) | "Request Risk Assessment" | risk-intelligence | Assessment | ❌ "Assessment" not "Briefing" |
| 6 | trading-platform | "Request Institutional Briefing" | market-intelligence | Briefing | ⚠️ Generic text, product solutionId |
| 7 | platform (hero) | "Request Platform Briefing" | platform | Briefing | ✅ Consistent |
| 8 | platform (CTA) | "Request Platform Briefing" | platform | Briefing | ✅ Consistent |
| 9 | enterprise (hero) | "Discuss Enterprise Requirements" | enterprise | Discussion | ⚠️ Different verb (intentional?) |
| 10 | enterprise (CTA) | "Request Enterprise Briefing" | enterprise | Briefing | ✅ Consistent |
| 11 | developers (hero) | "Request API Access" | api | API Access | ✅ Different journey (by design) |
| 12 | developers (CTA) | "Request API Access" | api | API Access | ✅ Different journey (by design) |
| 13 | architecture | "Request an Institutional Briefing" | platform | Briefing | ⚠️ Generic text, platform solutionId |
| 14 | catalog (hero) | "Request an Institutional Briefing" | (none — generic) | Briefing | ✅ Generic page, generic CTA |
| 15 | catalog (CTA) | "Request an Institutional Briefing" | (none — generic) | Briefing | ✅ Generic page, generic CTA |
| 16 | solutions | "Request Institutional Briefing" | (none — generic) | Briefing | ✅ Generic page, generic CTA |
| 17 | why-roua | "Request Intelligence Assessment" | business-case | Assessment | ⚠️ "Assessment" not "Briefing" |
| 18 | business-case | "Request Business Case Review" | business-case | Review | ⚠️ "Review" not "Briefing" |
| 19 | source-registry | "Review Source Coverage" | sources | Review | ⚠️ "Review" not "Briefing" |
| 20 | trust-framework | "Request Trust Framework Review" | sources | Review | ⚠️ "Review" not "Briefing" |
| 21 | methodology | "Request Methodology Review" | sources | Review | ⚠️ "Review" not "Briefing" |
| 22 | infrastructure-report | "Request Institutional Briefing" | platform | Briefing | ⚠️ Generic text, platform solutionId |
| 23 | product-experience | "Request Institutional Briefing" | (none — generic) | Briefing | ✅ Generic page, generic CTA |
| 24 | media-intelligence | "Request Media Intelligence Briefing" | financial-media | Briefing | ⚠️ Missing "a" (vs #3) |
| 25 | developer-intelligence | "Request Integration Briefing" | api | Briefing | ⚠️ "Integration" not "API" or "Developer" |
| 26 | financial-intelligence | "Request Institutional Briefing" | investment-intelligence | Briefing | ⚠️ Generic text, product solutionId |

### 2.2 CTA type analysis

**Briefing CTAs (19 instances):**
- Product-prefixed pattern: "Request [a] [Product] Briefing" — used on investment, market, financial-media, platform, enterprise, developer-intelligence
- Generic pattern: "Request [an] Institutional Briefing" — used on architecture, catalog, solutions, infrastructure-report, product-experience, financial-intelligence, trading-platform
- The generic pattern is appropriate for pages WITHOUT a clear product identity (catalog, solutions, product-experience)
- The generic pattern is INCONSISTENT when used on pages WITH a product identity (architecture→platform, infrastructure-report→platform, financial-intelligence→investment, trading-platform→market)

**Assessment CTAs (2 instances):**
- risk-intelligence: "Request Risk Assessment"
- why-roua: "Request Intelligence Assessment"
- These use "Assessment" instead of "Briefing" — implies a different engagement model (assessment vs briefing)

**Review CTAs (3 instances):**
- business-case: "Request Business Case Review"
- source-registry: "Review Source Coverage"
- trust-framework: "Request Trust Framework Review"
- methodology: "Request Methodology Review"
- These use "Review" — implies evaluating a specific artifact (business case, source coverage, framework, methodology)

**API Access CTAs (2 instances):**
- developers: "Request API Access" — different journey by design (Wave 1 QA documented)

**Discussion CTAs (1 instance):**
- enterprise (hero): "Discuss Enterprise Requirements" — softer CTA, secondary position

### 2.3 The normalization question

Per user direction: *"Normalization ≠ homogenization. Do not assume every CTA should carry the same text."*

**CTAs that should NOT change (intentionally different):**
- developers "Request API Access" — different journey (API onboarding ≠ institutional briefing)
- enterprise hero "Discuss Enterprise Requirements" — softer secondary CTA, appropriate for enterprise exploration stage
- source-registry "Review Source Coverage" — the buyer wants to review sources, not get a briefing
- trust-framework "Request Trust Framework Review" — the buyer wants to review the framework
- methodology "Request Methodology Review" — the buyer wants to review methodology
- business-case "Request Business Case Review" — the buyer wants a business case review
- catalog/solutions/product-experience "Request Institutional Briefing" — generic pages, generic CTA is correct

**CTAs that SHOULD change (genuine inconsistency):**
- risk-intelligence CTA: "Request Risk Assessment" → "Request a Risk Intelligence Briefing" (matches product-prefixed pattern, matches contact.html submitLabel)
- risk-intelligence hero: "Request Briefing" → add ?solution=risk-intelligence (missed in Wave 4-A)
- why-roua: "Request Intelligence Assessment" → "Request an Intelligence Briefing" (Assessment implies different engagement; contact.html solutionId=business-case uses "Request an Intelligence Assessment" as submitLabel — so this is actually CONSISTENT with the contact personalization)

Wait — let me re-check. The contact.html for solution=business-case has:
```
submitLabel: 'Request an Intelligence Assessment'
```

So why-roua's CTA "Request Intelligence Assessment" → contact.html submitLabel "Request an Intelligence Assessment" — these MATCH. The "Assessment" wording is intentional and consistent with the contact personalization.

Similarly, risk-intelligence CTA "Request Risk Assessment" → contact.html for solution=risk-intelligence has:
```
submitLabel: 'Request a Risk Intelligence Briefing'
```

These DO NOT match. The CTA says "Assessment" but the contact page says "Briefing." This is the real inconsistency.

**CTAs with minor inconsistency (worth fixing?):**
- media-intelligence: "Request Media Intelligence Briefing" vs financial-media: "Request a Media Intelligence Briefing" — missing "a"
- developer-intelligence: "Request Integration Briefing" — inconsistent naming (developers uses "API Access", developer-intelligence uses "Integration Briefing")
- financial-intelligence: "Request Institutional Briefing" (generic) but solutionId=investment-intelligence — text-solutionId mismatch
- architecture: "Request an Institutional Briefing" (generic) but solutionId=platform — text-solutionId mismatch
- infrastructure-report: "Request Institutional Briefing" (generic) but solutionId=platform — text-solutionId mismatch
- trading-platform: "Request Institutional Briefing" (generic) but solutionId=market-intelligence — text-solutionId mismatch

---

## 3. Context Integrity Impact (D7)

### 3.1 Does CTA text change break D7?

**NO.** The D7 chain is:
```
Landing CTA href (?solution=X) → contact.html detection → DOM (E1-E5) → form data-solution → email subject
```

The CTA **text** is NOT part of this chain. Only the CTA **href** (which contains ?solution=X) is part of the chain. Changing "Request Risk Assessment" to "Request a Risk Intelligence Briefing" does NOT change the href `contact.html?solution=risk-intelligence`.

**D7 is safe.** CTA text normalization does not affect context integrity.

### 3.2 The text-solutionId mismatch problem

However, there IS a user experience issue when CTA text doesn't match contact.html personalization:

| Page | CTA text | contact.html submitLabel | Match? |
|---|---|---|---|
| risk-intelligence | "Request Risk Assessment" | "Request a Risk Intelligence Briefing" | ❌ MISMATCH |
| why-roua | "Request Intelligence Assessment" | "Request an Intelligence Assessment" | ✅ Match |
| business-case | "Request Business Case Review" | "Request an Intelligence Assessment" | ❌ MISMATCH |
| source-registry | "Review Source Coverage" | "Request Source Coverage Review" | ❌ MISMATCH |
| trust-framework | "Request Trust Framework Review" | "Request Source Coverage Review" | ❌ MISMATCH |
| methodology | "Request Methodology Review" | "Request Source Coverage Review" | ❌ MISMATCH |

**5 of 26 CTAs have text-solutionId mismatches** where the CTA text doesn't match what contact.html shows after personalization.

**The risk-intelligence mismatch is the most severe** because it's a product page (the buyer expects product-specific engagement) and the words are different concepts ("Assessment" vs "Briefing").

**The sources mismatch is structural** — 3 different pages (source-registry, trust-framework, methodology) all map to the same solutionId (sources) but have different CTA texts. contact.html can only show one submitLabel for sources. This is a limitation of the solutionId architecture — one solutionId = one personalization, but 3 pages have different CTAs.

---

## 4. P0 / P1 / P2 Classification

### P0 — Must fix (genuine inconsistency, buyer-facing)

| # | CTA | Page | Issue | Fix |
|---|---|---|---|---|
| P0-1 | "Request Risk Assessment" | risk-intelligence (CTA) | "Assessment" not "Briefing" — mismatches contact.html submitLabel | → "Request a Risk Intelligence Briefing" |
| P0-2 | "Request Briefing" (no solutionId) | risk-intelligence (hero) | No ?solution= parameter — missed in Wave 4-A | → add ?solution=risk-intelligence |

### P1 — Should fix (minor inconsistency, low buyer impact)

| # | CTA | Page | Issue | Fix? |
|---|---|---|---|---|
| P1-1 | "Request Media Intelligence Briefing" | media-intelligence | Missing "a" vs financial-media pattern | → "Request a Media Intelligence Briefing" |
| P1-2 | "Request Integration Briefing" | developer-intelligence | Inconsistent with developers.html "Request API Access" | → "Request API Access" (match developers.html) |
| P1-3 | "Request Institutional Briefing" | financial-intelligence | Generic text + investment solutionId mismatch | → "Request an Investment Intelligence Briefing" |
| P1-4 | "Request an Institutional Briefing" | architecture | Generic text + platform solutionId mismatch | → "Request a Platform Briefing" |
| P1-5 | "Request Institutional Briefing" | infrastructure-report | Generic text + platform solutionId mismatch | → "Request a Platform Briefing" |
| P1-6 | "Request Institutional Briefing" | trading-platform | Generic text + market solutionId mismatch | → "Request a Market Intelligence Briefing" |

### P2 — Do NOT change (intentionally different)

| # | CTA | Page | Reason |
|---|---|---|---|
| P2-1 | "Request API Access" | developers | Different journey by design (Wave 1 QA) |
| P2-2 | "Discuss Enterprise Requirements" | enterprise (hero) | Softer secondary CTA, appropriate for enterprise exploration |
| P2-3 | "Review Source Coverage" | source-registry | Buyer wants to review sources, not get a briefing |
| P2-4 | "Request Trust Framework Review" | trust-framework | Buyer wants to review the framework |
| P2-5 | "Request Methodology Review" | methodology | Buyer wants to review methodology |
| P2-6 | "Request Business Case Review" | business-case | Buyer wants a business case review |
| P2-7 | "Request Intelligence Assessment" | why-roua | Consistent with contact.html submitLabel for business-case |
| P2-8 | "Request an Institutional Briefing" | catalog, solutions, product-experience | Generic pages, generic CTA is correct |
| P2-9 | "Request Enterprise Briefing" | enterprise (CTA) | Consistent with contact.html submitLabel |
| P2-10 | "Request Platform Briefing" | platform | Consistent with contact.html submitLabel |

### P1-1 Sovereign friction verdict

**Do NOT change.** The sovereign friction is a positioning choice — enterprise.html hero is generic by design. Sovereign buyers are received at catalog card, deployment model 3, and contact description. Adding "sovereign" to the hero would narrow positioning without commercial value.

---

## 5. What to Change

### 5.1 P0 (2 changes — must fix)

1. **risk-intelligence CTA:** "Request Risk Assessment" → "Request a Risk Intelligence Briefing"
   - Matches product-prefixed pattern (investment, market, financial-media)
   - Matches contact.html submitLabel for solution=risk-intelligence
   - Eliminates "Assessment" → "Briefing" text mismatch

2. **risk-intelligence hero:** "Request Briefing" → "Request Briefing" + add ?solution=risk-intelligence
   - Missed in Wave 4-A CTA parameter updates
   - Without this, hero CTA falls back to referrer detection (which works, but URL parameter is more reliable)

### 5.2 P1 (6 changes — should fix, low risk)

3. **media-intelligence:** "Request Media Intelligence Briefing" → "Request a Media Intelligence Briefing" (add "a")
4. **developer-intelligence:** "Request Integration Briefing" → "Request API Access" (match developers.html)
5. **financial-intelligence:** "Request Institutional Briefing" → "Request an Investment Intelligence Briefing" (match solutionId)
6. **architecture:** "Request an Institutional Briefing" → "Request a Platform Briefing" (match solutionId)
7. **infrastructure-report:** "Request Institutional Briefing" → "Request a Platform Briefing" (match solutionId)
8. **trading-platform:** "Request Institutional Briefing" → "Request a Market Intelligence Briefing" (match solutionId)

### 5.3 What NOT to change (P2 — 10 CTAs)

All P2 CTAs are intentionally different. Do NOT homogenize them.

### 5.4 Sovereign friction

**Do NOT change enterprise.html hero.** The sovereign buyer is received adequately through catalog card + deployment model 3 + contact description.

---

## 6. D7 Context Integrity Verification

### 6.1 All CTA text changes are D7-safe

CTA text is NOT part of the D7 chain. Only the href (containing ?solution=X) is part of the chain. Changing CTA text does not affect:
- URL parameter detection
- contact.html personalization
- Interest pre-select
- form data-solution attribute
- email subject construction

### 6.2 P0-2 (risk-intelligence hero solutionId) strengthens D7

Adding ?solution=risk-intelligence to the risk-intelligence hero CTA makes the D7 chain more reliable — currently it relies on referrer detection only, which is the secondary fallback. Adding the URL parameter makes it the primary detection path.

### 6.3 No D7 breaks from any P0 or P1 change

All 8 changes (2 P0 + 6 P1) only modify CTA text or add URL parameters. None modify the solutionId value, the contact.html personalization script, or the form submission logic.

---

## 7. Decisions Required Before Implementation

1. **Approve P0 (2 changes)?** — risk-intelligence CTA text + hero solutionId
2. **Approve P1 (6 changes)?** — 6 CTAs with text-solutionId mismatch
3. **Confirm P2 (10 CTAs) do NOT change?** — intentionally different
4. **Confirm sovereign friction is NOT in scope?** — positioning choice, not defect
5. **For P1-2 (developer-intelligence):** change "Request Integration Briefing" → "Request API Access"? Or keep as "Briefing" since developer-intelligence is the product page (not the portal)?
6. **For P1-3 through P1-6:** change generic CTAs to product-prefixed? Or keep generic since the pages are solution pages (not product pages)?

---

## 8. What This Discovery Does NOT Cover

- ❌ Does NOT recommend whether sovereign should get its own solutionId (currently maps to enterprise)
- ❌ Does NOT address the sources solutionId limitation (3 pages, 1 personalization)
- ❌ Does NOT address whether "Assessment" and "Review" CTAs should be normalized to "Briefing" (user said normalization ≠ homogenization)
- ❌ Does NOT touch index.html (FROZEN)
- ❌ Does NOT modify contact.html personalization (Wave 4-A architecture)

---

*End of Wave 4-D Discovery Report. No code modified. No commit. Awaiting user direction on Wave 4-D Implementation scope.*

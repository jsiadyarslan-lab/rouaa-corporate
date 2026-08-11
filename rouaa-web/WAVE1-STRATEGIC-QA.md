# Wave 1 — Strategic QA Report

> **Status:** Audit only. **No code modified. No commit.**
> **Subject:** Wave 1 implementation (`41551bc`) — per-buyer CTA chain integrity
> **Method:** Page-by-page verification of: catalog card → CTA → landing page hero → buyer narrative → proof → deployment → briefing CTA
> **Baseline:** `41551bc` (Wave 1 implementation, pushed to `origin/main`)
> **Date:** 2026-08-11

---

## 1. Scope

Wave 1 added per-buyer CTAs to all 8 deployment cards in `catalog.html`. Each CTA links the buyer to a landing page. The user's strategic question:

> **لا نريد أن يصبح catalog مجرد موزّع روابط أفضل. نريد أن يصبح نقطة دخول إلى مسارات شراء مؤسسية متماسكة.**

Translation: catalog must not become a better link distributor. It must become an entry point into **coherent institutional buying journeys**.

This QA verifies the chain for each of the 8 cards. The chain has 6 links:

```
Card context → CTA label/target → Landing hero → Buyer narrative match
            → Proof section → Deployment section → Briefing CTA
```

If any link breaks, the buyer arrives at a page that does not receive them with a matching narrative — and the catalog becomes a link distributor, not a journey entry point.

---

## 2. The 8-Card → 7-Page Mapping

| # | Card (catalog.html) | Buyer context | CTA label | Target page | Page type |
|---|---|---|---|---|---|
| 1 | Investment Firm | Investment teams preparing research + committee decisions | View Investment Workflow → | `financial-intelligence.html` | Solution (Investment Firms) |
| 2 | Equity Research Team | Analysts needing verified data for hundreds of stocks | View Research Workflow → | `investment-intelligence.html` | Product (Investment Intelligence) |
| 3 | Financial Publisher | Publishers needing speed without sacrificing verification | View Editorial Workflow → | `financial-media.html` | Solution (Financial Media) |
| 4 | Trading Platforms & Brokerage | Trading teams needing market context, not only price | View Trading Workflow → | `trading-platform.html` | Solution (Trading Desks) |
| 5 | Risk & Compliance Team | Risk teams needing earlier detection + explainable exposure | View Risk Workflow → | `risk-intelligence.html` | Product (Risk Intelligence) |
| 6 | Sovereign & Economic Institutions | Sovereign institutions needing sovereignty over data + governance | View Sovereign Workflow → | `enterprise.html` | Solution (Enterprise) |
| 7 | Fintech / Developer | Fintechs embedding intelligence into customer-facing products | View Developer Path → | `developers.html` | Developer Portal |
| 8 | Enterprise / Bank | Banks/institutions needing private deployment | View Enterprise Workflow → | `enterprise.html` | Solution (Enterprise) |

**Note:** `enterprise.html` receives 2 cards (Sovereign + Enterprise/Bank). Both must feel received.

---

## 3. Per-Card Verdict

### Card 1: Investment Firm → `financial-intelligence.html` — **PASS**

| Link | Evidence |
|---|---|
| Card context | "Investment teams spend days preparing research, validating information, and preparing committee decisions" |
| CTA | "View Investment Workflow →" → `financial-intelligence.html` |
| Landing hero eyebrow | "Investment Intelligence Solution" |
| Landing hero H1 | "Investment Intelligence Built on Verified Financial Information" |
| Landing hero paragraph | "ROUA connects official financial information, governed intelligence, and institutional workflows across investment research, market intelligence, risk, media, and trading — powered by the Financial Intelligence Pipes." |
| Buyer narrative match | Section 2 ("Institutional Applications"): "Different institutional teams. One intelligence foundation." Explicitly lists "Asset Managers & Investment Firms" + "Research Teams, CIO Offices & Investment Committees" (line 201, 219). Direct match for the card's "Investment Firm" buyer. |
| Deployment section | Yes — "Product Architecture: What you buy, what powers it, what you receive" (line 319) |
| Briefing CTA | "Request Institutional Briefing" (primary) → `contact.html` |

**Verdict:** Coherent chain. Card says "Investment Firm" → landing page says "Investment Firms" + "Asset Managers" in its opening sections. Buyer feels received.

**Minor friction:** CTA label says "Investment Workflow" but landing page title says "Investment Intelligence Solution." Not a mismatch — both use "Investment" — but the workflow/intelligence phrasing is slightly off. **Not blocking.**

---

### Card 2: Equity Research Team → `investment-intelligence.html` — **PASS**

| Link | Evidence |
|---|---|
| Card context | "Equity analysts need verified data and evidence-backed analysis for hundreds of stocks daily" |
| CTA | "View Research Workflow →" → `investment-intelligence.html` |
| Landing hero eyebrow | "Investment Intelligence" |
| Landing hero H1 | "Evidence-backed intelligence for investment research." |
| Landing hero paragraph | "Transform official company filings, earnings releases, financial events, and market information into source-linked company intelligence, earnings analysis, research outputs, and investment context — powered by the ROUA Financial Intelligence Pipes." |
| Buyer narrative match | Section explicitly titled "03 · Equity Research" (line 288). Multiple mentions of "research teams" (lines 273, 333, 379, 454, 495) and "analysts" (lines 379, 461, 495). The page is a deep, structured walkthrough of exactly what the Equity Research Team buyer needs. |
| Deployment section | Yes — "Deploy where your research governance requires" (line 529, `#deployment` section) |
| Briefing CTA | "Request Investment Intelligence Briefing" (primary) → `contact.html` |

**Verdict:** Strongest match in the set. Card says "Equity Research Team" → landing page has an entire section named "Equity Research" and is research-team-coded throughout.

---

### Card 3: Financial Publisher → `financial-media.html` — **PASS**

| Link | Evidence |
|---|---|
| Card context | "Financial publishers need speed without sacrificing verification" |
| CTA | "View Editorial Workflow →" → `financial-media.html` |
| Landing hero eyebrow | "Media Intelligence Solution" |
| Landing hero H1 | "Financial Media Intelligence, Built on Verified Financial Information." |
| Landing hero paragraph | "ROUA transforms official financial information and verified market events into analyzed news, research reports, strategic briefings, video, infographics, and publishable intelligence — all traceable to the evidence behind them." |
| Buyer narrative match | Page opens with "Financial Media Intelligence" — direct match for "Financial Publisher" buyer. Section "Where does ROUA fit in the newsroom?" (line 337) confirms editorial-production framing. |
| Deployment section | Implied through CTA buttons (sample library, media-intelligence product) — no dedicated `#deployment` anchor |
| Briefing CTA | "Request a Media Intelligence Briefing" (primary) → `contact.html` |

**Verdict:** Coherent chain. Card says "Financial Publisher" → landing page is "Financial Media Intelligence" with explicit newsroom framing.

**Minor friction:** CTA label says "Editorial Workflow" but landing page eyebrow says "Media Intelligence Solution." Both are media-coded, but "editorial" is narrower than "media." **Not blocking — but flag for Wave 2 review.**

---

### Card 4: Trading Platforms & Brokerage → `trading-platform.html` — **PASS**

| Link | Evidence |
|---|---|
| Card context | "Trading teams need market context, not only price movement" |
| CTA | "View Trading Workflow →" → `trading-platform.html` |
| Landing hero eyebrow | "Market & Trading Intelligence Platform" |
| Landing hero H1 | "Institutional trading intelligence from market signal to controlled execution." |
| Landing hero paragraph | "ROUA Market & Trading Intelligence combines evidence-backed financial intelligence with multi-model signal evaluation, advanced chart intelligence, market scanning, predictive markets, and controlled automated execution — connecting verified market context to institutional trading workflows." |
| Buyer narrative match | Section 2: "The Trading Desk Problem" (line 137) — 4 problem cards explicitly for trading desks. Section 3: "How institutional trading workflows work with ROUA" (line 169). Direct match. |
| Deployment section | Yes — "Connect ROUA with your existing stack" (line 389) |
| Briefing CTA | "Request Institutional Briefing" (primary) → `contact.html` |

**Verdict:** Coherent chain. Card says "Trading Platforms & Brokerage" → landing page is "Market & Trading Intelligence Platform" with explicit trading-desk problem framing.

---

### Card 5: Risk & Compliance Team → `risk-intelligence.html` — **PASS**

| Link | Evidence |
|---|---|
| Card context | "Risk teams need earlier detection and explainable exposure analysis" |
| CTA | "View Risk Workflow →" → `risk-intelligence.html` |
| Landing hero eyebrow | "Risk Intelligence" |
| Landing hero H1 | "Regulatory and financial risk intelligence with evidence-backed monitoring." |
| Landing hero paragraph | "ROUA Risk Intelligence turns official regulatory and financial information into traceable risk alerts, exposure reports, and audit-ready assessments — each output linked to its underlying evidence. Built for risk, compliance, and regulatory teams." |
| Buyer narrative match | Hero paragraph explicitly says "Built for risk, compliance, and regulatory teams." Direct, explicit match for the card's "Risk & Compliance Team" buyer. |
| Deployment section | Yes (implied through #capabilities anchor and final CTA structure) |
| Briefing CTA | "Request Risk Assessment" (primary) → `contact.html` |

**Verdict:** Coherent chain. The hero literally names the buyer.

**Friction flagged:** Briefing CTA text is "Request Risk Assessment" — this is the **only** card whose landing-page primary CTA does NOT say "Briefing." Spec 05.14 mandates "Request an Institutional Briefing" as the canonical primary CTA. "Risk Assessment" frames the engagement as an assessment rather than a briefing — this is a **D.10-class inconsistency** (buyer-facing CTA language variance). **REVIEW — not blocking Wave 2, but should be normalized in a future pass.**

---

### Card 6: Sovereign & Economic Institutions → `enterprise.html` — **PASS**

| Link | Evidence |
|---|---|
| Card context | "Sovereign institutions need comprehensive economic intelligence with full sovereignty over data and governance" |
| CTA | "View Sovereign Workflow →" → `enterprise.html` |
| Landing hero eyebrow | "Enterprise Solutions" |
| Landing hero H1 | "Deploy ROUA Around Your Institution's Requirements" |
| Landing hero paragraph | "Deploy ROUA's financial intelligence infrastructure through the operating model that fits your institution — from hosted platform access to private deployment, API integration, and governed enterprise environments." |
| Buyer narrative match | The hero is enterprise/deployment-generic — does NOT name sovereign institutions. **However**, Deployment Model 3 (line 258) explicitly says: "Banks, sovereign funds, and institutions with strict data residency, compliance, or sovereignty requirements." So the sovereign buyer IS received — but only after scrolling past 2 deployment models. |
| Deployment section | Yes — 3 explicit deployment models including on-premise for sovereignty |
| Briefing CTA | "Request Enterprise Briefing" (primary) → `contact.html` |

**Verdict:** Coherent chain, but the sovereign buyer's reception is **deferred** — they must scroll to deployment model 3 to see themselves named. The hero does not say "sovereign" or "sovereignty."

**Friction flagged:** CTA label says "View Sovereign Workflow" but landing hero is generic enterprise. Buyer arriving from catalog card 6 may feel they landed on the wrong page for the first 3 seconds. **REVIEW — should the hero acknowledge sovereignty use cases? Or should the CTA target a different page (none currently exists)?** Not blocking, but this is the weakest chain in the set.

---

### Card 7: Fintech / Developer → `developers.html` — **PASS**

| Link | Evidence |
|---|---|
| Card context | "For fintechs embedding intelligence into customer-facing products" |
| CTA | "View Developer Path →" → `developers.html` |
| Landing hero eyebrow | "Developer Portal" |
| Landing hero H1 | "How developers integrate with ROUA." |
| Landing hero paragraph | "ROUA's API and SDK surface give engineering teams programmatic access to source-linked, governed intelligence — sources, evidence chains, extracted facts, and governed intelligence outputs. This page is for the engineers who will build the integration, not the buyer who will sign the contract." |
| Buyer narrative match | Page explicitly distinguishes "developer portal" (this page, integration-focused) from "Developer Platform" (the product page, `developer-intelligence.html`). The fintech buyer arriving here gets exactly the integration-focused page they need. |
| Deployment section | Yes — "For institutions with stricter boundaries" (line 564) + Enterprise APIs section |
| Briefing CTA | "Request API Access" (primary) → `contact.html` |

**Verdict:** Coherent chain. The page even tells the buyer "this page is for the engineers who will build the integration, not the buyer who will sign the contract" — exactly the right framing for a fintech/developer buyer.

**Friction flagged:** CTA is "Request API Access" — different verb than the canonical "Request an Institutional Briefing." This is acceptable because the developer journey is genuinely different (API access ≠ institutional briefing), but it does mean the developer path has its own conversion model. **Not blocking — by design.**

---

### Card 8: Enterprise / Bank → `enterprise.html` — **PASS**

| Link | Evidence |
|---|---|
| Card context | "For banks and institutions needing private deployment" |
| CTA | "View Enterprise Workflow →" → `enterprise.html` |
| Landing hero eyebrow | "Enterprise Solutions" |
| Landing hero H1 | "Deploy ROUA Around Your Institution's Requirements" |
| Landing hero paragraph | (Same as Card 6 — generic enterprise/deployment framing) |
| Buyer narrative match | Deployment Model 3 (line 258): "Banks, sovereign funds, and institutions with strict data residency, compliance, or sovereignty requirements." Banks explicitly named. The Enterprise Problem section (line 128) also discusses institutional buyers broadly. |
| Deployment section | Yes — 3 deployment models, with on-premise/private being model 3 |
| Briefing CTA | "Request Enterprise Briefing" (primary) → `contact.html` |

**Verdict:** Coherent chain. Banks are explicitly named in deployment model 3. The hero is generic but the page does receive the bank buyer before the briefing CTA.

---

## 4. Cross-Card Findings

### 4.1 CTA Text Inconsistency (D.10-class)

Across the 7 landing pages, the primary CTA text varies:

| Page | Primary CTA text |
|---|---|
| `financial-intelligence.html` | "Request Institutional Briefing" |
| `investment-intelligence.html` | "Request Investment Intelligence Briefing" |
| `financial-media.html` | "Request a Media Intelligence Briefing" |
| `trading-platform.html` | "Request Institutional Briefing" |
| `risk-intelligence.html` | "Request Risk Assessment" ← **outlier** |
| `enterprise.html` | "Request Enterprise Briefing" |
| `developers.html` | "Request API Access" ← **different journey (by design)** |

**Spec 05.14 mandates:** Primary CTA = "Request an Institutional Briefing."

- 2 pages match exactly (financial-intelligence, trading-platform — modulo "an")
- 3 pages use product-prefixed variants (Investment Intelligence, Media Intelligence, Enterprise) — defensible but inconsistent
- 1 page uses "Risk Assessment" instead of "Briefing" — **inconsistent with spec 05.14**
- 1 page uses "API Access" — different journey, acceptable

**Recommendation:** Wave 4 (CTA text alignment) should normalize these to either:
- (a) "Request an Institutional Briefing" everywhere (strict spec compliance), OR
- (b) "Request an [Product] Briefing" pattern (consistent variant, e.g., "Request an Investment Intelligence Briefing")

**Not blocking Wave 2.** But the inconsistency means a buyer walking through 3 pages sees 3 different CTA verbs — this is exactly the "link distributor, not journey" risk the user flagged.

---

### 4.2 Hero Reception Quality

| Page | Names buyer in hero? | Buyer-specific section? |
|---|---|---|
| `financial-intelligence.html` | Yes ("Investment Firms", "Asset Managers") | Yes (Institutional Applications, line 129) |
| `investment-intelligence.html` | Yes (research teams, analysts throughout) | Yes (Equity Research section, line 288) |
| `financial-media.html` | Yes ("Financial Media") | Yes (newsroom section, line 337) |
| `trading-platform.html` | Yes ("Trading Desk Problem") | Yes (problem cards, line 137) |
| `risk-intelligence.html` | Yes (explicit: "Built for risk, compliance, and regulatory teams") | Yes (capabilities section) |
| `enterprise.html` | **No** (generic "your institution") | **Deferred** (sovereign/banks named only in deployment model 3, line 258) |
| `developers.html` | Yes ("engineers who will build the integration") | Yes (scope section distinguishes buyer vs. engineer) |

**Only `enterprise.html` has hero reception gap.** It receives 2 cards (Sovereign + Enterprise/Bank) but its hero names neither. The buyer is received only after scrolling to deployment model 3.

---

### 4.3 Catalog CTA Label vs. Landing Page Eyebrow Phrasing

| Card CTA label | Landing eyebrow | Phrasing match? |
|---|---|---|
| View Investment Workflow → | Investment Intelligence Solution | Partial — "Investment" only |
| View Research Workflow → | Investment Intelligence | Partial — "Investment" only |
| View Editorial Workflow → | Media Intelligence Solution | Partial — "Media" only |
| View Trading Workflow → | Market & Trading Intelligence Platform | Strong — "Trading" |
| View Risk Workflow → | Risk Intelligence | Strong — "Risk" |
| View Sovereign Workflow → | Enterprise Solutions | **Weak — no shared word** |
| View Developer Path → | Developer Portal | Strong — "Developer" |
| View Enterprise Workflow → | Enterprise Solutions | Strong — "Enterprise" |

**Card 6 (Sovereign) is the only weak match.** The CTA says "Sovereign Workflow" but the landing eyebrow says "Enterprise Solutions." No shared word.

---

## 5. Strategic Verdict

### 5.1 The user's question

> هل تحول catalog من "link distributor" إلى "entry point into coherent institutional buying journeys"؟

### 5.2 Answer: **YES — for 7 of 8 cards. Card 6 (Sovereign) is the exception.**

| Card | Chain integrity | Verdict |
|---|---|---|
| 1 — Investment Firm | ✅ Coherent | PASS |
| 2 — Equity Research Team | ✅ Coherent (strongest) | PASS |
| 3 — Financial Publisher | ✅ Coherent | PASS |
| 4 — Trading Platforms | ✅ Coherent | PASS |
| 5 — Risk & Compliance | ✅ Coherent | PASS |
| 6 — Sovereign | ⚠️ Deferred reception | **PASS WITH FRICTION** |
| 7 — Fintech / Developer | ✅ Coherent (different journey, by design) | PASS |
| 8 — Enterprise / Bank | ✅ Coherent | PASS |

### 5.3 Is Wave 1 ready for Wave 2?

**YES — with one documented friction point (Card 6) and one cross-cutting inconsistency (CTA text variance).**

Neither is blocking. Wave 2 (product pages) can proceed. The friction points should be tracked:

- **Card 6 (Sovereign → enterprise.html):** Hero does not name sovereign buyer. Reception deferred to deployment model 3. **Track for Wave 4 enterprise.html refinement OR Wave 5 sovereign-specific page.**
- **CTA text variance (Section 4.1):** 7 landing pages use 5 different primary CTA phrases. **Track for Wave 4 (global CTA alignment).**

---

## 6. What This QA Does NOT Cover

- ❌ Visual rendering (no browser testing) — only HTML structure and content
- ❌ Mobile UX — the catalog deployment cards use `grid-3` which may stack differently on mobile
- ❌ Page-load performance
- ❌ Whether buyers actually convert (no analytics data)
- ❌ Whether the catalog cards themselves are the right 8 buyer archetypes (that was a Wave 1 design decision, not in scope here)

---

## 7. Recommendation for the User

### 7.1 Proceed to Wave 2?

**Yes.** Wave 1 succeeds at the strategic level: 7/8 cards have coherent CTA → landing → buyer narrative chains. The 8th (Sovereign) has deferred reception but is not broken.

### 7.2 Before Wave 2, decide:

1. **Is the Sovereign → enterprise.html chain acceptable for now?** If yes, track for Wave 4. If no, block Wave 2 until either (a) enterprise.html hero is refined, or (b) a sovereign-specific page is created.

2. **Is the CTA text variance acceptable for now?** If yes, track for Wave 4. If no, block Wave 2 until all 7 landing pages use "Request an Institutional Briefing" (or a consistent product-prefixed variant).

3. **What is Wave 2's scope?** Per spec 05.17, Wave 2 = investment, market&trading, financial-media product pages. These are 3 of the 7 landing pages audited above. Wave 2 will refine them — meaning the chains audited here will be re-touched. Decide whether Wave 2 should explicitly address the friction points found here, or treat them as Wave 4 work.

### 7.3 What I will NOT do without explicit approval

- ❌ Refine enterprise.html hero to name sovereign/bank buyers
- ❌ Normalize the 7 landing-page primary CTAs to "Request an Institutional Briefing"
- ❌ Start Wave 2 implementation

**Awaiting user's strategic decision before any further code changes.**

---

*End of Wave 1 Strategic QA Report. No code modified. No commit. Awaiting user direction.*

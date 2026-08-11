# Wave 4-A — Contact Context Architecture (Discovery)

> **Status:** Architecture design only. **No code modified. No commit.**
> **Subject:** Canonical buyer/solution context model for `contact.html` personalization
> **Question this document answers:**
>   *What is the canonical buyer/solution context that travels from any entry point to the briefing?*
> **Per user direction:** Establish the architecture FIRST, before modifying any landing page. If we establish it first, we can apply it to all 8 pages without creating 8 different solutions.
> **Baseline:** `ed5b563` (Wave 4 Discovery)
> **Date:** 2026-08-11

---

## 1. Why Architecture First

The user's directive is precise:

> **Wave 4-A must be Discovery/Implementation of the contact context model BEFORE modifying any landing page.**
>
> Because the architectural decision here is not "how do we change the text?" — it is:
> **What is the canonical buyer/solution context that travels from any entry point to briefing?**
>
> If we establish it first, we can apply it to all 8 pages without creating 8 different solutions.

This document defines that canonical context model. Once approved, Wave 4-A Implementation will:
1. Build the context-detection + personalization layer on `contact.html`
2. Update all landing-page CTAs to pass the canonical context parameter

**No code is modified in this Discovery.**

---

## 2. Entry Point Inventory

### 2.1 All content-body CTAs to contact.html (across site)

I identified 20 distinct content-body CTAs across 18 pages that link to `contact.html`. Each represents a different entry context:

| # | Page | CTA text | Entry context (what buyer is thinking) |
|---|---|---|---|
| 1 | financial-intelligence.html | "Request Institutional Briefing" | Investment Firms buyer evaluating solution |
| 2 | investment-intelligence.html | "Request Investment Intelligence Briefing" | Investment Intelligence product evaluation |
| 3 | financial-media.html | "Request a Media Intelligence Briefing" | Financial Media / Editorial buyer |
| 4 | trading-platform.html | "Request Institutional Briefing" | Trading Desks buyer |
| 5 | risk-intelligence.html | "Request Risk Assessment" | Risk & Compliance buyer |
| 6 | enterprise.html (hero) | "Discuss Enterprise Requirements" | Enterprise / Bank / Sovereign buyer |
| 7 | enterprise.html (CTA) | "Request Enterprise Briefing" | Enterprise / Bank / Sovereign buyer |
| 8 | developers.html (hero) | "Request API Access" | Developer / Fintech integration |
| 9 | developers.html (CTA) | "Request API Access" | Developer / Fintech integration |
| 10 | platform.html (hero) | "Request Platform Briefing" | CTO / Head of Platform |
| 11 | platform.html (CTA) | "Request Platform Briefing" | CTO / Head of Platform |
| 12 | architecture.html | "Request an Institutional Briefing" | Architecture / Infrastructure evaluation |
| 13 | catalog.html (hero) | "Request an Institutional Briefing" | Catalog browsing → general |
| 14 | catalog.html (CTA) | "Request an Institutional Briefing" | Catalog browsing → general |
| 15 | solutions.html | "Request Institutional Briefing" | Solutions overview browsing |
| 16 | why-roua.html | "Request Intelligence Assessment" | Why ROUA evaluation |
| 17 | business-case.html | "Request Business Case Review" | Business case evaluation |
| 18 | source-registry.html | "Review Source Coverage" | Source registry evaluation |
| 19 | trust-framework.html | "Request Trust Framework Review" | Trust framework evaluation |
| 20 | methodology.html | "Request Methodology Review" | Methodology evaluation |
| 21 | infrastructure-report.html | "Request Institutional Briefing" | Infrastructure report evaluation |
| 22 | product-experience.html | "Request Institutional Briefing" | Product experience center |
| 23 | media-intelligence.html | "Request Media Intelligence Briefing" | Media Intelligence product evaluation |
| 24 | developer-intelligence.html | "Request Integration Briefing" | Developer Platform product evaluation |
| 25 | index.html (hero) | "Request Briefing" | Homepage → general |
| 26 | index.html (CTA) | "Request an Intelligence Briefing" | Homepage → general |

**Plus:** Every page has a nav-button "Request Briefing" (generic, no context) and footer "Contact" link (generic).

### 2.2 The context variance problem

The 26 CTAs above use **15 different text variants** and represent **at least 10 distinct entry contexts**. Without a canonical model, personalizing contact.html would require 26 special cases — unmaintainable.

The canonical context model must reduce these 26 entry points to a **small, enumerable set of context values** that contact.html can personalize against.

---

## 3. Canonical Context Model

### 3.1 The parameter: `solution`

Per user direction, the URL parameter is `solution`:

```
contact.html?solution=investment-intelligence
contact.html?solution=market-intelligence
contact.html?solution=financial-media
contact.html?solution=risk-intelligence
contact.html?solution=enterprise
contact.html?solution=platform
contact.html?solution=api
```

### 3.2 Canonical solution values

I propose **10 canonical solution values** that cover all 26 entry points:

| `solution` value | Meaning | Maps to Interest dropdown option | Entry points (CTA #s from §2.1) |
|---|---|---|---|
| `investment-intelligence` | Investment Intelligence product | "Investment Intelligence" | 2 |
| `market-intelligence` | Market & Trading Intelligence product | "Market & Trading Intelligence" | 4 |
| `financial-media` | Financial Media solution (editorial/newsroom) | "Media Intelligence" | 3 |
| `risk-intelligence` | Risk Intelligence product | "Risk Intelligence" | 5 |
| `enterprise` | Enterprise / Bank / Sovereign solution | "Intelligence Infrastructure" (NEW — see P1-5) | 6, 7 |
| `platform` | Platform / Infrastructure evaluation | "Intelligence Infrastructure" | 10, 11, 12 |
| `api` | Developer / API access | "Developer Platform" | 8, 9, 24 |
| `sources` | Source Registry / Trust / Methodology evaluation | "Intelligence Infrastructure" | 18, 19, 20 |
| `business-case` | Business case / Why ROUA evaluation | "Not sure — need guidance" | 16, 17 |
| `general` | Generic / homepage / catalog / unknown | (no pre-select) | 1, 13, 14, 15, 21, 22, 25, 26, nav buttons, footer |

**Why 10 values, not 8?** The user listed 7 in their message. I add 3:
- `sources` — needed for source-registry, trust-framework, methodology pages (3 distinct CTAs)
- `business-case` — needed for why-roua, business-case pages (these are evaluation-stage, not product-specific)
- `general` — needed as the explicit fallback for homepage, catalog, solutions, product-experience, infrastructure-report, nav buttons, footer links, and direct entry

### 3.3 Optional second parameter: `buyer`

Per user direction, the context is "buyer/solution context." The `solution` parameter covers the product/solution. An optional `buyer` parameter could carry the buyer archetype:

| `buyer` value | Meaning | Used when |
|---|---|---|
| `research-team` | Equity research / analyst team | From investment-intelligence catalog card 2 |
| `investment-firm` | Investment firm / asset manager | From financial-intelligence catalog card 1 |
| `trading-desk` | Trading desk / brokerage | From trading-platform catalog card 4 |
| `risk-compliance` | Risk & compliance team | From risk-intelligence catalog card 5 |
| `editorial` | Editorial / newsroom | From financial-media catalog card 3 |
| `sovereign` | Sovereign / economic institution | From enterprise catalog card 6 |
| `enterprise-bank` | Enterprise / bank | From enterprise catalog card 8 |
| `fintech` | Fintech / developer | From developers catalog card 7 |
| `cto` | CTO / Head of Platform | From platform page |
| (omitted) | Generic | Nav buttons, footer, direct entry |

**The `buyer` parameter is optional.** If omitted, contact.html personalizes only on `solution`. If present, contact.html can further refine the hero text (e.g., "Request an Investment Intelligence Briefing for your research team").

**Recommendation:** Start with `solution` only in Wave 4-A. Add `buyer` in a later iteration if needed. The `solution` parameter alone solves 90% of the context-loss problem.

### 3.4 URL parameter format

```
contact.html?solution=investment-intelligence
contact.html?solution=market-intelligence
contact.html?solution=financial-media
contact.html?solution=risk-intelligence
contact.html?solution=enterprise
contact.html?solution=platform
contact.html?solution=api
contact.html?solution=sources
contact.html?solution=business-case
```

For the optional `buyer` parameter (future):
```
contact.html?solution=investment-intelligence&buyer=research-team
```

---

## 4. Context → Personalization Mapping

For each canonical `solution` value, contact.html personalizes **5 elements**:

### 4.1 The 5 personalization elements

| Element | Current (generic) | Personalized (example: solution=investment-intelligence) |
|---|---|---|
| **E1: Hero eyebrow** | "Institutional Briefing Request" | "Investment Intelligence Briefing Request" |
| **E2: Hero h1** | "Request an institutional briefing." | "Request an Investment Intelligence briefing." |
| **E3: Hero paragraph** | "Every briefing follows a structured five-stage process — from institutional assessment to deployment planning..." | "Every Investment Intelligence briefing follows a structured five-stage process — from assessment of your research workflow to deployment planning for your governance requirements." |
| **E4: Interest dropdown** | (not pre-selected) | Pre-selected: "Investment Intelligence" |
| **E5: Submit button** | "Request an Institutional Briefing" | "Request an Investment Intelligence Briefing" |

**What does NOT change:**
- What A Briefing Can Cover (4 cards) — stays generic, applies to all
- What To Expect (5 stages) — stays generic; the stages are universal
- Form fields (Name, Work Email, Organization, Role, optional workflow question, Deployment Context, Message) — stay generic
- Trust statement ("Institutional briefing — no commitment required.") — stays
- Direct Contact section — stays

### 4.2 Full personalization table (all 10 solution values)

| `solution` | E1: Eyebrow | E2: H1 | E3: Paragraph (key phrase) | E4: Interest pre-select | E5: Submit button |
|---|---|---|---|---|---|
| `investment-intelligence` | Investment Intelligence Briefing Request | Request an Investment Intelligence briefing. | "...assessment of your research workflow to deployment planning for your governance requirements." | Investment Intelligence | Request an Investment Intelligence Briefing |
| `market-intelligence` | Market Intelligence Briefing Request | Request a Market Intelligence briefing. | "...assessment of your market intelligence operation to deployment planning for your trading-floor requirements." | Market & Trading Intelligence | Request a Market Intelligence Briefing |
| `financial-media` | Media Intelligence Briefing Request | Request a Media Intelligence briefing. | "...assessment of your editorial workflow to deployment planning for your newsroom requirements." | Media Intelligence | Request a Media Intelligence Briefing |
| `risk-intelligence` | Risk Intelligence Briefing Request | Request a Risk Intelligence briefing. | "...assessment of your risk monitoring workflow to deployment planning for your compliance requirements." | Risk Intelligence | Request a Risk Intelligence Briefing |
| `enterprise` | Enterprise Briefing Request | Request an Enterprise briefing. | "...assessment of your institutional requirements to deployment planning for your sovereignty and governance requirements." | Intelligence Infrastructure (NEW) | Request an Enterprise Briefing |
| `platform` | Platform Briefing Request | Request a Platform briefing. | "...assessment of your platform requirements to deployment planning for your infrastructure boundary." | Intelligence Infrastructure | Request a Platform Briefing |
| `api` | API Access Request | Request API access. | "...API access is provisioned through institutional onboarding — scope alignment, environment provisioning, and engineering briefing." | Developer Platform | Request API Access |
| `sources` | Source Coverage Review Request | Request a source coverage review. | "...assessment of your source coverage needs against the ROUA Source Registry." | Intelligence Infrastructure | Request Source Coverage Review |
| `business-case` | Intelligence Assessment Request | Request an intelligence assessment. | "...assessment of your institutional intelligence needs and where ROUA fits." | Not sure — need guidance | Request an Intelligence Assessment |
| `general` (fallback) | Institutional Briefing Request | Request an institutional briefing. | (current generic text) | (no pre-select) | Request an Institutional Briefing |

### 4.3 Special case: `api` (developer journey)

The `api` solution value is structurally different. Per Wave 4 Discovery, the developer journey is "different by design" — developers.html describes API onboarding (scope alignment, environment provisioning, engineering briefing), not the 5-stage institutional briefing process.

**For `solution=api`, the What To Expect section should ALSO personalize:**

| Stage | Generic (current) | API-specific (solution=api) |
|---|---|---|
| Stage 01 | Institutional Assessment | Scope Alignment — which intelligence products, which source tiers, which endpoints |
| Stage 02 | Source & Workflow Mapping | Environment Provisioning — staging keys for integration development |
| Stage 03 | Workflow Demonstration | Engineering Briefing — working session on evidence access patterns |
| Stage 04 | Pilot Definition | Integration Pilot — your engineering team builds against staging |
| Stage 05 | Deployment Planning | Production Deployment — production keys, security review, go-live |

**This is a deeper personalization** — it changes the 5-stage process itself, not just the hero text. Per user direction (P2: "don't touch developers.html D3/D4/D5"), the developer journey's *landing page* stays as-is. But the *contact.html handoff* for `solution=api` can personalize the What To Expect stages.

**Recommendation:** Include API-specific What To Expect personalization in Wave 4-A. It is the only solution value that requires stage-level personalization. All others use the generic 5 stages.

---

## 5. Progressive Enhancement + Fallback

### 5.1 The principle

Per user direction:

> **The URL parameter must not be the only source of truth; it must be progressive enhancement, with a clear fallback if the user enters contact.html directly.**

### 5.2 Detection hierarchy

contact.html should detect context in this order:

1. **URL parameter** (`?solution=X`) — highest priority, explicit
2. **`document.referrer`** — if URL parameter absent, check if referrer is a known landing page (e.g., referrer contains `investment-intelligence.html` → solution=investment-intelligence)
3. **Fallback: `general`** — if no URL parameter and no recognizable referrer, use generic context

### 5.3 Fallback behavior

When `solution=general` (or no parameter):
- E1: "Institutional Briefing Request" (current)
- E2: "Request an institutional briefing." (current)
- E3: Current generic paragraph
- E4: Interest dropdown NOT pre-selected (current)
- E5: "Request an Institutional Briefing" (current)

**The fallback IS the current contact.html.** This means:
- Direct entry to contact.html → current behavior (no regression)
- Nav button "Request Briefing" (no parameter) → current behavior
- Footer "Contact" link → current behavior
- Any unrecognized referrer → current behavior

**Progressive enhancement:** Only when a recognized `?solution=X` parameter is present does personalization activate. This guarantees zero regression for existing traffic.

### 5.4 Referrer detection (secondary fallback)

If URL parameter is absent but `document.referrer` matches a known landing page, use the mapping:

| Referrer contains | → solution value |
|---|---|
| `investment-intelligence.html` | `investment-intelligence` |
| `market-intelligence.html` or `trading-platform.html` | `market-intelligence` |
| `financial-media.html` or `media-intelligence.html` | `financial-media` |
| `risk-intelligence.html` | `risk-intelligence` |
| `enterprise.html` | `enterprise` |
| `platform.html` or `architecture.html` | `platform` |
| `developers.html` or `developer-intelligence.html` | `api` |
| `source-registry.html` or `trust-framework.html` or `methodology.html` | `sources` |
| `why-roua.html` or `business-case.html` | `business-case` |
| (anything else or empty) | `general` |

**Referrer detection is a secondary fallback.** URL parameter always wins if present. This handles the case where a user manually navigates (e.g., clicks nav button on investment-intelligence.html → referrer carries context even without URL parameter).

### 5.5 JavaScript implementation requirements

The personalization script must:
1. Run on DOMContentLoaded (before user sees content — avoid flash of generic content)
2. Be inline in contact.html (not external JS) — ensures it runs even if external JS fails
3. Be defensive — wrap in try/catch, fall back to `general` on any error
4. Not depend on any external library (vanilla JS only)
5. Update DOM in place — no page reload, no redirect

---

## 6. Architecture Decisions (Awaiting User Approval)

### 6.1 The 10 canonical solution values

Per §3.2: `investment-intelligence`, `market-intelligence`, `financial-media`, `risk-intelligence`, `enterprise`, `platform`, `api`, `sources`, `business-case`, `general`.

**Question for user:** Are these 10 values correct? Should any be:
- Added? (e.g., `sovereign` as separate from `enterprise`?)
- Removed? (e.g., merge `sources` into `platform`?)
- Renamed? (e.g., `financial-media` → `media`?)

### 6.2 The 5 personalization elements

Per §4.1: E1 (eyebrow), E2 (h1), E3 (paragraph), E4 (Interest pre-select), E5 (submit button).

**What does NOT change:** What A Briefing Can Cover, What To Expect (5 stages — except API special case), form fields, trust statement, Direct Contact.

**Question for user:** Should What A Briefing Can Cover (4 cards) also personalize? Or stay generic? My recommendation: stay generic — the 4 cards (Product Fit, Evidence Requirements, Deployment Model, Institutional Workflow) apply universally.

### 6.3 API special case (stage-level personalization)

Per §4.3: For `solution=api`, the What To Expect 5 stages personalize to API onboarding stages.

**Question for user:** Approve API-specific stage personalization? Or keep API journey on the generic 5 stages?

### 6.4 Optional `buyer` parameter

Per §3.3: A second parameter `buyer` could carry the buyer archetype (research-team, investment-firm, trading-desk, etc.).

**Recommendation:** Defer to later iteration. `solution` alone solves 90% of the problem. Add `buyer` only if testing shows that buyers need archetype-level personalization beyond product-level.

**Question for user:** Defer `buyer` parameter? Or include in Wave 4-A?

### 6.5 Referrer detection

Per §5.4: Secondary fallback using `document.referrer`.

**Question for user:** Include referrer detection? Or rely solely on URL parameter (simpler, but misses nav-button clicks)?

### 6.6 P1-5: Interest dropdown new option

Per Wave 4 Discovery P1-5: contact.html Interest dropdown is missing "Enterprise / Sovereign" option. The canonical model maps `enterprise` and `platform` and `sources` solutions to "Intelligence Infrastructure" (which already exists in the dropdown).

**Alternative:** Add a new option "Enterprise / Sovereign" and map `enterprise` → that option instead.

**Recommendation:** Use existing "Intelligence Infrastructure" for `enterprise`, `platform`, `sources`. Do NOT add a new option — keeps the dropdown at 8 options (current count) and avoids expanding form friction.

**Question for user:** Use existing "Intelligence Infrastructure" for enterprise/platform/sources? Or add "Enterprise / Sovereign" as new option?

---

## 7. Implementation Scope (For Approval — Not Yet Executed)

Once the architecture decisions in §6 are approved, Wave 4-A Implementation will:

### 7.1 contact.html changes
1. Add inline personalization script (vanilla JS, DOMContentLoaded, try/catch, defensive)
2. Add `id` attributes to the 5 personalization elements (E1-E5) so JS can target them
3. Add a context-data structure (JavaScript object) mapping solution values → personalization text
4. Implement URL parameter detection + referrer fallback
5. Implement API-specific What To Expect stage personalization (if approved in §6.3)
6. Ensure fallback to `general` (current behavior) on any error or missing parameter

### 7.2 Landing page CTA updates
Update all 26 content-body CTAs (from §2.1) to pass the `?solution=X` parameter:

| Current | Updated |
|---|---|
| `<a href="contact.html" class="btn btn-primary">Request Investment Intelligence Briefing</a>` | `<a href="contact.html?solution=investment-intelligence" class="btn btn-primary">Request Investment Intelligence Briefing</a>` |
| `<a href="contact.html" class="btn btn-primary">Request Risk Assessment</a>` | `<a href="contact.html?solution=risk-intelligence" class="btn btn-primary">Request a Risk Intelligence Briefing</a>` (also normalizes CTA text — P1-2) |
| ... | ... |

**Nav buttons and footer links stay generic** (no parameter) — they fall back to `general` context.

### 7.3 What is NOT in Wave 4-A scope
- ❌ P0-2 (Workflow → Deployment handoff) — Wave 4-B
- ❌ P0-3 (Evidence → Sample Library) — Wave 4-C
- ❌ P1-1 (Sovereign friction on enterprise.html hero) — Wave 4-D
- ❌ P1-2 (Global CTA normalization) — Wave 4-D (except where it naturally overlaps with CTA parameter updates in §7.2)
- ❌ P1-3, P1-4 — deferred
- ❌ P2 items — do not touch
- ❌ index.html — FROZEN
- ❌ Visual redesign

---

## 8. Risk Analysis

### 8.1 Regression risk

**Low** — because:
- Fallback is the current contact.html (zero change for direct entry / nav / footer)
- Personalization is progressive enhancement (only activates with recognized parameter)
- Script is defensive (try/catch, fallback to `general`)
- No backend changes, no new pages, no URL structure changes

### 8.2 Maintenance risk

**Medium** — because:
- 26 CTAs across 18 pages need parameter updates
- Context-data structure (solution → personalization text) must be maintained
- Adding a new product/solution in future requires adding a new solution value + personalization text

**Mitigation:** The canonical 10-value model is designed to be exhaustive. New products would map to existing values or require one new value addition (not a structural change).

### 8.3 SEO / analytics risk

**Low** — because:
- URL parameter (`?solution=X`) does not change the page URL fundamentally (still contact.html)
- Search engines treat `contact.html?solution=X` as the same page as `contact.html` (query parameters ignored for indexing by default)
- Analytics can track solution parameter as a custom dimension (optional, not required for Wave 4-A)

---

## 9. What This Architecture Does NOT Do

- ❌ Does NOT create per-product briefing pages (option b from Wave 4 Discovery — rejected in favor of option a)
- ❌ Does NOT require backend / server-side changes (option c — rejected)
- ❌ Does NOT change the 5-stage What To Expect process (except API special case)
- ❌ Does NOT change form fields or form structure
- ❌ Does NOT touch index.html
- ❌ Does NOT address P0-2 or P0-3 (those are Wave 4-B and 4-C)
- ❌ Does NOT normalize all CTA text globally (that's Wave 4-D — except natural overlap in §7.2)

---

## 10. Strategic Verdict

### 10.1 The architecture is ready for user approval

This document defines:
- ✅ Canonical context model (10 solution values)
- ✅ 5 personalization elements (E1-E5)
- ✅ Full personalization table (all 10 values × 5 elements)
- ✅ Progressive enhancement + fallback (URL param → referrer → general)
- ✅ API special case (stage-level personalization)
- ✅ Implementation scope (contact.html + 26 CTA updates)
- ✅ Risk analysis (low regression, medium maintenance, low SEO risk)

### 10.2 6 architecture decisions awaiting user approval

Per §6, the user must approve:
1. The 10 canonical solution values (§6.1)
2. The 5 personalization elements — What A Briefing Can Cover stays generic? (§6.2)
3. API-specific What To Expect stage personalization? (§6.3)
4. Defer optional `buyer` parameter? (§6.4)
5. Include referrer detection as secondary fallback? (§6.5)
6. Use existing "Intelligence Infrastructure" for enterprise/platform/sources? (§6.6)

### 10.3 Next step

**Per user direction: "Start Wave 4-A: Contact Context Architecture Discovery only, no code."**

This document IS that Discovery. No code modified. No commit.

**Awaiting user approval on the 6 architecture decisions in §6 before proceeding to Wave 4-A Implementation.**

---

*End of Wave 4-A Contact Context Architecture Discovery. No code modified. No commit. Awaiting user direction on the 6 architecture decisions.*

# Delta Report 10 — `catalog.html` vs Product Family Consolidation Spec v5

> **Status:** First Catalog-category test. Tests Spec v5 against a Reference/Navigation page that is NOT a product, NOT an Explorer, NOT Architecture.
> **Audited file:** `/home/z/my-project/rouaa-corporate/rouaa-web/catalog.html` (868 lines) + `products.js` (external data layer, ~690 lines)
> **Reference:** `PRODUCT-FAMILY-CONSOLIDATION-SPEC.md` v5 (commit `fb5eb57`)
> **Method:** No code modification. Acceptance Contract applied across ALL implementation layers including external JS data file.
> **Acceptance Verdict:** **FAIL** — D.9 variant ("Confidence Scoring" × 2) + D.10 ("Trading Intelligence" as product name in filter × 1) + D.14 (NEW: timing claims in external JS data layer `products.js`).

---

## PART 0 — CATALOG'S ACTUAL INSTITUTIONAL FUNCTION

> User asked: "Catalog is not Explorer, not Product, not Infrastructure. Determine its actual institutional function first."

### What Catalog Actually Is

Catalog is a **product capability reference page** — a structured navigation surface that shows:
1. **What ROUA sells** (5 products + their modules/capabilities)
2. **How products relate to modules** (Product vs Module definition)
3. **Platform hierarchy** (Foundation → 5 Products → Capabilities → Workflows → Distribution)
4. **Typical institutional deployments** (8 deployment scenarios: Investment Firm, Equity Research, Financial Publisher, Trading, Risk, Sovereign, Fintech, Enterprise)
5. **Capability maturity model** (Production / Enterprise / Research Preview / Early Access)
6. **Full filterable capability catalog** (54 capabilities from `products.js`, filterable by product/type/maturity/search)
7. **Platform foundation** (6 foundation assets + governance layer)

### Inferred UX Test for Catalog

**Can the user quickly understand what ROUA offers, filter capabilities by product/type/maturity, and navigate to the relevant product page?**

Chain: `Product Overview → Capability Filter → Maturity Classification → Product Page Navigation`

This is a **Reference/Navigation** page — its purpose is to help buyers and evaluators understand the full scope of ROUA's offering and navigate to specific products.

---

## PART 1 — STRUCTURAL FACTS

### 1.1 CSS / JS Stack

| Component | Loaded | Notes |
|---|---|---|
| `roua-v7.css` | ✓ | |
| `roua-v7-patch.css` | ✓ | |
| `styles.css` | ✗ NOT loaded | Same as all prior pages |
| **Inline `<style>` block** (lines 13–54) | ✓ | Defines `.catalog-layout`, `.catalog-filters`, `.filter-group`, `.filter-item`, `.catalog-tabs`, `.catalog-tab`, `.product-card`, `.product-card-head`, `.maturity-badge`, `.deployment-card`, `.product-grid` — the catalog filter/card system. ~41 lines. |
| **`products.js?v=b95fb0d`** | ✓ | **External data layer** — 54 capability definitions with name, description, category, type, maturity, deploy, features, pricing, integration. ~690 lines. |
| `main.js` | ✓ | |
| Inline `<script>` (lines 677–868) | ✓ | Catalog filtering logic (checkboxes, tabs, search, rendering) |
| `design-system/roua-v7.js` | ✓ | |

**Key finding:** Catalog loads an **external JavaScript data file** (`products.js`) that contains capability descriptions. This file has its own content claims that must be audited.

### 1.2 Token Usage

| Token Family | Usage | Verdict |
|---|---|---|
| `--roua-*` aliases | Used throughout | ✓ Correct |
| `var(--gold)` direct (D.6) | **0 instances** | ✓ D.6 absent |
| `rgba(201, 162, 39, ...)` (OLD gold, D.2) | **0 instances** | ✓ **D.2 ABSENT — first page without it!** |
| Raw hex values (D.7 / D.11) | **0 instances** | ✓ D.7 + D.11 absent |
| Non-canonical hex (D.11) | **0 instances** | ✓ D.11 absent |

**Token verdict:** **CLEANEST token usage in the entire product family.** Zero D.2, zero D.6, zero D.7, zero D.11. First page to have zero token defects.

### 1.3 Page Structure

```
Navigation (lines 60–147)
1. Hero — .page-hero (lines 149–167)
2. Why This Catalog Exists (lines 170–181)
3. Product vs Module (lines 184–210)
4. Platform Hierarchy (lines 212–230)
5. Summary Stats — 411+, 5, 54, Evidence-backed (lines 232–254)
6. Typical Institutional Deployments — 8 deployment cards (lines 256–414)
7. How Capabilities Fit Together — supply chain diagram (lines 417–457)
8. Capability Maturity Model (lines 460–483)
9. Intelligence Is Not Purchased as Modules (lines 486–494)
10. Full Catalog — filterable grid from products.js (lines 496–554)
11. Platform Foundation — 6+1 foundation assets (lines 557–596)
12. CTA (lines 598–611)
Footer (lines 613–674)
```

- `<section>` count: **12**
- `<div>` balance: 187 / 187 ✓ PASS
- `<section>` balance: 12 / 12 ✓ PASS
- HTML comment balance: 16 / 16 ✓ PASS

### 1.4 HTML Integrity — ALL PASS

| Check | Result |
|---|---|
| `<div>` balance | 187 / 187 ✓ PASS |
| `<section>` balance | 12 / 12 ✓ PASS |
| HTML comment balance | 16 / 16 ✓ PASS |
| Dead `<style>` block (D.1) | ✗ ABSENT — inline `<style>` is the catalog design system |

### 1.5 Unique Structural Elements

- **`.back-link`** present (line 152) — "← Back to Products" (like Developer)
- **Active nav state** on Products dropdown (line 66) — correct (Catalog is under Products)
- **`products.js` external data layer** — 54 capability definitions loaded via `<script src>`
- **Filter panel** (sticky sidebar) — filter by product, type, maturity, search
- **Catalog tabs** — 10 quick-filter tabs (All, Production, Enterprise, Media, Investment, Market, Risk, Developer, Agents, Assets)
- **Product cards** rendered dynamically from `products.js` via JS

---

## PART 2 — ACCEPTANCE CONTRACT EVALUATION (Spec v5)

### Layer 1 — Canonical Baseline

#### 1.1 Token System — **PASS** (cleanest in product family)

Zero D.2, zero D.6, zero D.7, zero D.11. All `--roua-*` aliases used correctly.

#### 1.2 Container & Layout — **PASS**
#### 1.3 Navigation — **PASS** (active nav on Products, 6-link dropdown, mobile hamburger)
#### 1.4 Buttons — **PASS**
#### 1.5 Footer — **PASS** (6 columns, no Channels)
#### 1.6 Card Hierarchy — **PASS** (custom `.product-card` + `.deployment-card` system, no `.cx` theatrics)
#### 1.7 Motion — **PASS** (zero ambient motion, only CSS transitions on hover/filter)
#### 1.8 Typography — **PASS**

#### 1.9 Trust Grammar (Forbidden Phrases)

| Phrase | Count | Verdict |
|---|---|---|
| "audit-ready" / "Audit-Ready" / "Audit Ready" | 0 | ✓ PASS (D.4 absent) |
| "within seconds" / "in seconds" | 0 (in catalog.html) | ✓ PASS |
| "real-time" / "real time" | 0 (in catalog.html) | ✓ PASS |
| "instantly" / "instant" | 0 (in catalog.html) | ✓ PASS |
| "continuously monitored" | 0 | ✓ PASS |
| "every claim" | 0 | ✓ PASS |
| "VERIFIED INTELLIGENCE OBJECT" | 0 | ✓ PASS |
| "Trust Promise" | 0 | ✓ PASS |
| "Provenance Immutability" | 0 | ✓ PASS |
| "confidence score" / "confidence scored" | 0 | ✓ PASS |
| **"Confidence Scoring"** | **2** (lines 438, 584) | ⚠ **D.9 variant — REVIEW** |
| "Extraction Confidence" | 0 | ✓ PASS |
| "SOC 2" / "ISO 27001" | 0 | ✓ PASS |
| "24/7" | 0 (in catalog.html) | ✓ PASS |

**"Confidence Scoring" context:**
- Line 438: Reasoning Engine description in supply chain diagram — "Validation · Confidence Scoring · Scenario Generation"
- Line 584: Platform Foundation Reasoning Engine card — "Validation, confidence scoring, scenario generation"

**Classification:** D.9 variant — REVIEW. "Confidence Scoring" is not the exact phrase "confidence score" or "confidence scored", but it uses "confidence" in a scoring context. Unlike Sample Library's "Extraction Confidence" (which was marked "(illustrative)"), these instances are **NOT** marked illustrative — they are descriptions of the Reasoning Engine's capabilities.

Per Spec v5: "Extraction Confidence" is REVIEW because it's illustrative metadata. "Confidence Scoring" is NOT illustrative metadata — it's a capability description. This makes it closer to FORBID than REVIEW.

**Verdict: D.9 variant — REVIEW (leaning FORBID).** Recommend replacing "Confidence Scoring" with "Verification Tiering" or "Confidence Signals".

#### 1.10 Taxonomy (Full Content Scan)

| Old term | Count | Context | Verdict |
|---|---|---|---|
| **"Trading Intelligence"** (alone) | **2** (lines 344, 514) | Line 344: "Trading Intelligence Dashboard" (capability name in deployment card). Line 514: filter label "Trading Intelligence" (filter checkbox for `trading-platform` category). | ⚠ **D.10 — line 514 is product-name use** (filter label for a product category). Line 344 is a capability name — borderline. |
| "Institutional Intelligence" | 6 | All descriptive adjective use ("institutional intelligence products/infrastructure/systems") | ✓ PASS (per v5: descriptive use is NOT D.10) |
| "Developer Intelligence" | 0 | — | ✓ PASS |
| "Developer APIs" | 0 | — | ✓ PASS |

**D.10 analysis — line 514:**
```html
<label class="filter-item">
  <input type="checkbox" class="filter-cat" value="trading-platform" checked> Trading Intelligence
</label>
```
This is a **filter label for a product category**. The filter value is `trading-platform` (which maps to Trading Desks solution / trading-platform.html). The label says "Trading Intelligence" — this is using "Trading Intelligence" as a **product/category name**, not as a descriptive phrase. Per v5: D.10 applies when old terms are used as product names/taxonomy labels.

**Classification: D.10 PRESENT** (line 514 — "Trading Intelligence" as product filter label).

**D.10 analysis — line 344:**
```html
<li>Trading Intelligence Dashboard</li>
```
This is a **capability name** in a deployment card's workflow list. "Trading Intelligence Dashboard" could be:
- (a) A product name "Trading Intelligence" + "Dashboard" → D.10
- (b) A descriptive capability name "dashboard for trading intelligence" → acceptable

**Classification: REVIEW** — borderline. The capability is listed under "Trading Platforms & Brokerage Institutions" deployment, suggesting it refers to the trading product.

#### Layer 1 Overall Verdict: **FAIL**
D.9 variant ("Confidence Scoring" × 2, REVIEW leaning FORBID) + D.10 ("Trading Intelligence" as filter label, line 514).

---

### Layer 5 — Do-Not-Touch Rules — **PASS**

Catalog is NOT forced into Decision Environment, Explorer, or Architecture grammar. It has its own `.catalog-layout` + `.product-card` + `.deployment-card` system. Correct Reference/Navigation adaptation.

### Layer 6 — Catalog-Specific Rules (Spec v5 Layer 6.3)

| Rule | Status | Notes |
|---|---|---|
| Structured component listing | ✓ PASS | 54 capabilities in filterable grid |
| No marketing theatrics | ✓ PASS | Clean reference design |
| Use `.card` (v7-patch plain) for component cards | ⚠ PARTIAL | Uses custom `.product-card` with `:hover` lift (`translateY(-2px)` + `box-shadow`). This is mild hover feedback for clickable cards, NOT `.cx`-level theatrics. **Acceptable adaptation** — product cards are interactive (clickable links to product pages), so hover feedback is appropriate. |

---

### Layer 4 — Confirmed Defects (D.1–D.13 + NEW D.14)

| ID | Defect | Present? | Details |
|---|---|---|---|
| D.1 | Dead `<style>` block | ✗ ABSENT | |
| D.2 | Old-gold rgba | ✗ **ABSENT** | **First page with zero D.2!** |
| D.3 | Malformed HTML comment | ✗ ABSENT | 16/16 PASS |
| D.4 | "Audit-Ready" violation | ✗ ABSENT | |
| D.5 | Competitor naming | ✗ ABSENT | |
| D.6 | `var(--gold)` mixing | ✗ ABSENT | |
| D.7 | Deprecated raw hex | ✗ ABSENT | |
| D.8 | "real time" in catalog.html | ✗ ABSENT | |
| **D.9 variant** | "Confidence Scoring" | **✓ PRESENT — 2 instances** (lines 438, 584) | REVIEW — capability description, NOT illustrative metadata. Leans FORBID. |
| **D.10** | "Trading Intelligence" as product name | **✓ PRESENT — 1 confirmed + 1 REVIEW** | Line 514: filter label (confirmed D.10). Line 344: capability name (REVIEW). |
| D.11 | Non-canonical raw hex | ✗ ABSENT | |
| D.12 | No direct source links | N/A | Catalog is not an Explorer — D.12 is Explorer-specific |
| D.13 | "24/7" in catalog.html | ✗ ABSENT | |
| **D.14 (NEW)** | **Timing claims in external JS data file** | **✓ PRESENT in `products.js`** | See below |

### D.14 (NEW) — Timing/freshness claims in external JS data layer

| Field | Value |
|---|---|
| **Pattern** | Timing/freshness claims ("in under 30 seconds", "in seconds", "real-time", "instant", "24/7") in external JavaScript data files that are rendered as HTML content on the page |
| **Location** | `products.js` (loaded by `catalog.html`) — 8 instances across multiple capability descriptions |
| **Instances** | Line 15: "publishes it in 6 languages — in under 30 seconds" / Line 94: "Infographics from official data in seconds" / Line 228: "Real-time analysis" / Line 480: "From a global event to a risk alert — in seconds" / Line 481: "A 24/7 monitor...with instant impact assessment" / Line 500: "in real time" / Line 512: "Real-time analysis" / Line 614: "Instant response...Real-time updates" / Line 654: "Instant retrieval" / Line 674: "Real-time insights" |
| **Why this is new** | D.8 covers "real time" in HTML content. D.14 extends this to **external JS data files** that are rendered as HTML. The Spec v5 Implementation-Layer Scope covers "JavaScript color strings" but does NOT explicitly cover **JavaScript content strings** (text that becomes visible HTML when rendered). |
| **Pages affected** | Catalog (Delta 10) — `products.js` loaded by `catalog.html`, rendered as product card descriptions |
| **Root cause** | `products.js` was written as a data file with marketing-style capability descriptions, including timing claims that were never swept |
| **Fix** | Replace timing claims in `products.js` with governed-language alternatives: "in under 30 seconds" → "through configured source monitoring", "real-time" → "live" or remove, "instant" → "rapid", "24/7" → "continuous", "in seconds" → "rapidly" |
| **Fix type** | External JS file — find-and-replace in `products.js` |
| **Effort** | ~5 minutes |
| **Verdict** | **REPAIR** (P1 priority) |

---

## PART 3 — DRIFT SUMMARY

### A — Must match
| ID | Finding | Verdict |
|---|---|---|
| A.1 | `.page-hero` (like Developer + all Explorers) | **KEEP** |
| A.2 | Active nav on Products | **KEEP** (correct — Catalog is under Products) |
| A.3 | `.back-link` present | **KEEP** (like Developer) |

### B — Must adapt (Reference/Navigation)
| ID | Finding | Verdict |
|---|---|---|
| B.1 | Custom `.catalog-layout` + `.product-card` + `.deployment-card` design system | **KEEP** — correct Reference adaptation |
| B.2 | External `products.js` data layer (54 capabilities) | **KEEP** — correct data-driven catalog |
| B.3 | Filter panel (sticky sidebar with 4 filter groups + search) | **KEEP** — correct browsing UX |
| B.4 | 8 deployment scenario cards | **KEEP** — correct institutional-buyer navigation |
| B.5 | Capability maturity model (Production / Enterprise / Preview / Early Access) | **KEEP** — correct readiness classification |
| B.6 | Platform hierarchy diagram (Foundation → Products → Capabilities → Workflows → Distribution) | **KEEP** — correct structural overview |
| B.7 | Supply chain diagram (Sources → Documents → Evidence → Knowledge → Reasoning → Workflow → Capabilities → Decisions) | **KEEP** — correct provenance visualization |
| B.8 | Product card hover lift (`translateY(-2px)`) | **KEEP** — mild interactive feedback for clickable cards, NOT `.cx`-level theatrics |
| B.9 | 12 sections (moderate density) | **KEEP** — correct Reference depth |

### C — Must NOT transfer
| ID | Finding | Verdict |
|---|---|---|
| C.1–C.14 | All 14 Homepage-brand elements | ✓ **All correctly absent** |

### D — Real defects
| ID | Finding | Severity | Fix |
|---|---|---|---|
| **D.9 variant** | "Confidence Scoring" × 2 (lines 438, 584) — capability description, NOT illustrative | **P1 — REVIEW (leans FORBID)** | Replace with "Verification Tiering" or "Confidence Signals" |
| **D.10** | "Trading Intelligence" as filter label (line 514) — product-name use | **P1 — REPAIR** | Replace with "Market & Trading Intelligence" or "Trading Desks" |
| **D.10 REVIEW** | "Trading Intelligence Dashboard" as capability name (line 344) | **P3 — REVIEW** | Borderline — is it a product name or a capability description? |
| **D.14 (NEW)** | Timing claims in `products.js` (10 instances: "under 30 seconds", "real-time", "instant", "24/7", "in seconds") | **P1 — REPAIR** | Replace with governed-language alternatives in `products.js` |

---

## PART 4 — ACCEPTANCE VERDICT

## **FAIL**

The page **FAILS** due to:

1. **Layer 1.9 D.9 variant:** "Confidence Scoring" × 2 (REVIEW leaning FORBID — NOT illustrative metadata)
2. **Layer 1.10 D.10:** "Trading Intelligence" as product filter label (line 514)
3. **Layer 4 D.14 (NEW):** Timing claims in external JS data file `products.js` (10 instances)

## What's CLEAN (strongest aspects)

- ✓ **CLEANEST token usage** in the entire product family — zero D.2, zero D.6, zero D.7, zero D.11
- ✓ Zero D.4 (no "Audit-Ready" variants)
- ✓ Zero D.5 (no competitor naming)
- ✓ Zero D.8 in catalog.html (no "real time" in HTML)
- ✓ Zero D.12 (N/A — Catalog is not Explorer)
- ✓ Zero D.13 (no "24/7" in HTML)
- ✓ Active nav state on Products (correct)
- ✓ `.back-link` present (like Developer)
- ✓ All 14 Homepage-brand elements absent
- ✓ HTML integrity ALL PASS
- ✓ 12 well-structured sections with clear institutional purpose
- ✓ 54-capability filterable catalog with search
- ✓ 8 deployment scenario cards
- ✓ Capability maturity model
- ✓ Platform hierarchy + supply chain diagrams

---

## PART 5 — SPEC v6 RECOMMENDATIONS

| Update | Layer | Detail |
|---|---|---|
| **Add D.14** | Layer 4 | "Timing/freshness claims in external JS data files — content strings in JavaScript data files (e.g., `products.js`) that are rendered as visible HTML must comply with Trust Grammar. D.8 ('real time'), D.13 ('24/7'), and all forbidden timing claims apply to JS content strings, not just HTML." |
| **Expand Implementation-Layer Scope** | Acceptance Contract | Add "JavaScript content strings (text rendered as HTML)" to the implementation-layer table. Currently covers JS color strings but not JS content strings. |
| **Add "Confidence Scoring" to D.9 REVIEW** | Layer 1.9 | "Confidence Scoring" (as a capability description, NOT illustrative metadata) should be REVIEW leaning FORBID. Unlike "Extraction Confidence" (which is illustrative metadata), "Confidence Scoring" is a capability claim without illustrative disclaimer. |
| **Add Catalog UX test to Layer 6.3** | Layer 6.3 | Add Catalog category to page-category roles: `Product Overview → Capability Filter → Maturity Classification → Product Page Navigation` |
| **D.10 confirmed again** | Layer 4 | D.10 confirmed on Catalog (line 514 — filter label). Not system-wide, but appears on pages with older product references in content. |

---

## PART 6 — CROSS-REPORT COMPARISON

| Aspect | Products (5) | Architecture (06) | Evidence Explorer (07) | Source Explorer (08) | Sample Library (09) | **Catalog (10)** |
|---|---|---|---|---|---|---|
| Lines | 566–734 | 3484 | 1560 | 1679 | 1076 | **868** |
| Sections | 8–11 | 15 | 15 | 6 | 3 | **12** |
| D.2 (old-gold rgba) | 2–3 | 23 | 3 | 2 | 1 | **0 (cleanest!)** |
| D.4 (Audit-Ready) | 0–1 | 0 | 2 | 0 | 1 | **0** |
| D.9 (confidence) | 0 | 1 | 3 | 0 | 12 (REVIEW) | **2 (REVIEW)** |
| D.10 (taxonomy) | 0 | 0 | 1 | 0 | 0 (REVIEW) | **1 + 1 REVIEW** |
| D.11 (non-canonical hex) | 0 | 0 | 0 | 3 | 0 | **0** |
| D.12 (no source links) | N/A | N/A | 0 | 1 | 1 | **N/A** |
| D.13 ("24/7") | 0 | 0 | 0 | 1 | 0 | **0 (in HTML)** |
| **D.14 (JS timing claims)** | 0 | 0 | 0 | 0 | 0 | **10 (NEW)** |
| External JS data | No | No | No | No | No | **Yes (products.js)** |
| Token cleanliness | Mixed | Worst | Moderate | Moderate | Good | **Best** |

### Key Insights

1. **Catalog has the cleanest tokens** — first page with zero D.2/D.6/D.7/D.11
2. **D.14 is a new defect class** — timing claims in external JS data files rendered as HTML. This extends the Implementation-Layer Scope to cover JS content strings, not just JS color strings.
3. **D.10 continues to appear** — now on Catalog's filter label. Not system-wide, but appears on pages with older content references.
4. **"Confidence Scoring" is a D.9 variant** that leans FORBID (not illustrative metadata like "Extraction Confidence")
5. **Catalog is the most structurally complete Reference page** — 12 sections covering products, modules, hierarchy, deployments, maturity, catalog, foundation, and CTA

---

## PART 7 — RECOMMENDED FIXES

### P1 — Technical Repairs (~10 minutes)

| Step | Fix | Location | Effort |
|---|---|---|---|
| 10.1 | REPAIR D.10 — replace "Trading Intelligence" filter label with "Market & Trading Intelligence" or "Trading Desks" | catalog.html line 514 | ~1 min |
| 10.2 | REVIEW D.9 variant — replace "Confidence Scoring" with "Verification Tiering" (if FORBID decision) | catalog.html lines 438, 584 | ~2 min |
| 10.3 | REPAIR D.14 — replace timing claims in `products.js` with governed-language alternatives | products.js lines 15, 94, 228, 480, 481, 500, 512, 614, 654, 674 | ~5 min |

### P3 — Content Review

| Step | Fix | Location | Effort |
|---|---|---|---|
| 10.4 | REVIEW D.10 — "Trading Intelligence Dashboard" capability name (line 344) | catalog.html | Judgment call |

---

*End of Delta Report 10. Spec v5 tested on first Catalog/Reference page — works correctly. D.14 (NEW: timing claims in external JS data files) discovered. D.10 appears again (filter label). Catalog has cleanest token usage in product family. Spec v6 recommended to add D.14 + expand Implementation-Layer Scope to cover JS content strings.*

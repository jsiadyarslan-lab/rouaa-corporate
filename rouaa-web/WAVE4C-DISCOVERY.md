# Wave 4-C — Discovery: Evidence → Sample Library Handoff Audit

> **Status:** Audit only. **No code modified. No commit.**
> **Subject:** Wave 4-C — Evidence → Sample Library continuity across all pages with evidence
> **Method:** Apply C1-C8 test per page. Test the chain:
>   **Evidence Demonstration → Real Sample → Official Source → Traceable Evidence → Buyer Understanding → Briefing**
> **Core question:** Can the buyer transition from the evidence they saw inside the solution page to a real inspectable sample, then understand why this proves ROUA's value, then transition to briefing?
> **Per user direction:** Discovery only. No implementation. Distinguish between Real evidence, Conceptual demonstration, Official-source trace, Sample Library sample, and Navigation-only link. Do NOT consider footer sample-library link as C6 success. Do NOT invent samples.
> **Baseline:** `1c96dcb` (Wave 4-B Strategic QA — Wave 4-B closed)
> **Date:** 2026-08-11

---

## 1. Method

For each page with evidence content, I apply 8 tests:

| Test | Question |
|---|---|
| **C1 Evidence existence** | What is shown as actual evidence? |
| **C2 Evidence specificity** | Is it a real claim or just conceptual illustration? |
| **C3 Source identity** | Is the official source identified? |
| **C4 Traceability** | Can the user reach a real document/source? |
| **C5 Sample mapping** | Is there a matching sample in sample-library.html? |
| **C6 Direct continuity** | Is the link inside the evidence context itself (not just nav/footer)? |
| **C7 Buyer relevance** | Does the buyer understand why this example matters for their use case? |
| **C8 Briefing continuity** | Can they transition from sample/proof to briefing without losing context? |

**Evidence types distinguished:**
- **Real evidence** — specific event, verified fact, live source URL
- **Conceptual demonstration** — illustrative chain/diagram, no specific event
- **Official-source trace** — references a real source but no live link
- **Sample Library sample** — exists in sample-library.html with its own evidence
- **Navigation-only link** — sample-library appears only in nav/footer (not counted as C6)

---

## 2. Sample Library Inventory (What Actually Exists)

sample-library.html contains **6 samples**:

| Sample ID | Tab label | Source | Live URL? | Buyer relevance |
|---|---|---|---|---|
| `sample-fomc` | FOMC Intelligence Brief | Federal Reserve — FOMC | ✅ federalreserve.gov | Market/Investment intelligence |
| `sample-market` | Market Impact Brief | U.S. Bureau of Labor Statistics | ✅ bls.gov | Market intelligence |
| `sample-earnings` | Earnings Evidence Report | Saudi Aramco | ✅ aramco.com | Investment intelligence |
| `sample-risk` | Risk Alert | "Regulatory Authority — Official Announcement" | ❌ No live link (generic) | Risk intelligence |
| `sample-media` | Media Intelligence Brief | Federal Reserve — FOMC | ✅ federalreserve.gov | Media intelligence |
| `sample-api` | API Intelligence Object | SRC-FED-FOMC-001 (JSON provenance) | ❌ No live link (JSON) | Developer/API |

**Key observation:** 4 of 6 samples have live source URLs. 2 (sample-risk, sample-api) do not have live source links — they use generic or JSON-format source references.

---

## 3. Evidence Matrix (8 Pages × C1-C8)

### Page 1: `investment-intelligence.html` — PASS WITH GAP

| Test | Finding |
|---|---|
| **C1 Evidence existence** | ✅ Aramco Q1 2026 sample in hero glass card — Sample Intelligence Object with verified fact ($33.6B adjusted net income), source document, provenance |
| **C2 Evidence specificity** | ✅ **Real claim** — specific company (Aramco), specific period (Q1 2026), specific metric ($33.6B), specific source (aramco.com) |
| **C3 Source identity** | ✅ Source identified with **live URL**: aramco.com/en/news-media/news/2026/aramco-announces-first-quarter-2026-results |
| **C4 Traceability** | ✅ Live source link + Evidence Explorer link (#aramco-q1-2026) |
| **C5 Sample mapping** | ✅ **MATCH** — sample-library `sample-earnings` uses Saudi Aramco as source (aramco.com) |
| **C6 Direct continuity** | ❌ **GAP** — NO link to sample-library from evidence section. sample-library appears ONLY in footer (line 631). The "Inspect in Evidence Explorer" link goes to evidence-explorer.html, NOT sample-library.html |
| **C7 Buyer relevance** | ✅ Investment research buyer sees Aramco earnings — directly relevant to their use case |
| **C8 Briefing continuity** | ⚠️ **PARTIAL** — CTA links to contact (briefing), but evidence → sample path is broken. Buyer cannot go from Aramco evidence to Aramco sample in sample-library |

**Evidence type:** Real evidence (live source link, verified fact, specific claim)

**Gap:** C6 — no direct link from Aramco evidence to sample-earnings in sample-library

---

### Page 2: `market-intelligence.html` — PASS WITH GAP

| Test | Finding |
|---|---|
| **C1 Evidence existence** | ✅ FOMC July 29 2026 sample in hero glass card + full FOMC Evidence Example walkthrough section |
| **C2 Evidence specificity** | ✅ **Real claim** — specific event (FOMC decision), specific date (July 29, 2026), specific source (federalreserve.gov) |
| **C3 Source identity** | ✅ Source identified with **live URL**: federalreserve.gov/newsevents/pressreleases/monetary20260729a.htm |
| **C4 Traceability** | ✅ Live source link + Evidence Explorer link (#fomc-jul-2026) |
| **C5 Sample mapping** | ⚠️ **PARTIAL MATCH** — sample-library `sample-fomc` uses Federal Reserve FOMC, but date is **August 2, 2026** (not July 29). Same source type, different event instance |
| **C6 Direct continuity** | ❌ **GAP** — NO link to sample-library from evidence section. sample-library appears ONLY in footer (line 721) |
| **C7 Buyer relevance** | ✅ Market intelligence buyer sees FOMC event — directly relevant |
| **C8 Briefing continuity** | ⚠️ **PARTIAL** — CTA links to contact, but evidence → sample path is broken |

**Evidence type:** Real evidence (live source link, verified event, specific claim)

**Gap:** C6 — no direct link from FOMC evidence to sample-fomc in sample-library. Plus C5 date mismatch (July 29 vs August 2).

---

### Page 3: `financial-media.html` — PASS WITH MISMATCH

| Test | Finding |
|---|---|
| **C1 Evidence existence** | ✅ ECB July 16 2026 Evidence Demonstration section (Wave 2) — full 5-step chain: Official Source → Document → Verified Fact → Evidence → Publisher-Ready Output |
| **C2 Evidence specificity** | ✅ **Real claim** — specific event (ECB Monetary Policy Decision), specific date (July 16, 2026), specific source (ecb.europa.eu) |
| **C3 Source identity** | ✅ Source identified with **live URL**: ecb.europa.eu/press/pr/date/2026/html/index.en.html |
| **C4 Traceability** | ✅ Live source link + Evidence Explorer link (#ecb-jul-2026) |
| **C5 Sample mapping** | ❌ **MISMATCH** — sample-library `sample-media` uses **Federal Reserve** (federalreserve.gov), NOT ECB. The financial-media page shows ECB evidence, but the sample-library media sample uses a different source entirely |
| **C6 Direct continuity** | ✅ **YES** — "View Sample Intelligence Outputs" button (line 520) links to sample-library.html. **Only page with content-body sample-library link** |
| **C7 Buyer relevance** | ✅ Media/publisher buyer sees editorial workflow — directly relevant |
| **C8 Briefing continuity** | ⚠️ **PARTIAL** — Has sample-library link (C6 ✅), but the sample doesn't match the evidence (C5 ❌). Buyer sees ECB evidence → clicks "View Sample Intelligence Outputs" → lands on sample that uses Federal Reserve, not ECB. Context is lost |

**Evidence type:** Real evidence (strongest on the site — full chain to Publisher-Ready Output)

**Gap:** C5 — sample-media in sample-library uses Federal Reserve, but financial-media page demonstrates ECB. The buyer clicking "View Sample Intelligence Outputs" expects to see an ECB-based media sample, but gets a Federal Reserve-based one instead.

---

### Page 4: `risk-intelligence.html` — PASS WITH GAP

| Test | Finding |
|---|---|
| **C1 Evidence existence** | ✅ OFAC sb0581 sample in hero glass card — Sample Intelligence Object with sanctions event |
| **C2 Evidence specificity** | ✅ **Real claim** — specific OFAC action (sb0581), specific source type (OFAC sanctions) |
| **C3 Source identity** | ⚠️ Source identified by name ("OFAC sb0581") but **NO live URL link** — only Evidence Explorer reference |
| **C4 Traceability** | ⚠️ **PARTIAL** — Evidence Explorer link (#ofac-sb0581) but no live source URL. Buyer cannot click through to the actual OFAC document |
| **C5 Sample mapping** | ❌ **MISMATCH** — sample-library `sample-risk` uses generic "Regulatory Authority — Official Announcement", NOT OFAC specifically. No live source link in sample-risk either |
| **C6 Direct continuity** | ❌ **GAP** — NO link to sample-library from evidence section. sample-library appears ONLY in footer (line 683) |
| **C7 Buyer relevance** | ✅ Risk/compliance buyer sees OFAC sanctions — directly relevant |
| **C8 Briefing continuity** | ⚠️ **PARTIAL** — CTA links to contact, but evidence → sample path is broken |

**Evidence type:** Real evidence (specific OFAC action) but **weakest traceability** — no live source URL

**Gap:** C3/C4 (no live source URL) + C5 (sample mismatch) + C6 (no direct link)

---

### Page 5: `trading-platform.html` — PASS WITH STRUCTURAL GAP

| Test | Finding |
|---|---|
| **C1 Evidence existence** | ⚠️ Evidence Chain visual — conceptual diagram: Market Movement → Market Context → Verified Source → Extracted Fact → Evidence → Trading Context |
| **C2 Evidence specificity** | ❌ **Conceptual only** — no specific event, no specific source, no verified fact. Illustrative chain, not a real claim |
| **C3 Source identity** | ❌ No specific source identified — "Verified Source" is a label, not a real institution |
| **C4 Traceability** | ❌ No traceability — no live link, no Evidence Explorer link, no sample-library link |
| **C5 Sample mapping** | ⚠️ **NO MATCH** — sample-library `sample-market` uses BLS (Bureau of Labor Statistics), but trading-platform has no specific event to match against |
| **C6 Direct continuity** | ❌ **GAP** — NO link to sample-library from evidence section. sample-library appears ONLY in footer (line 465) |
| **C7 Buyer relevance** | ⚠️ Buyer-relevant conceptually (evidence chain is important for trading) but no specific proof to evaluate |
| **C8 Briefing continuity** | ⚠️ **PARTIAL** — CTA links to contact, but evidence → sample path is broken |

**Evidence type:** Conceptual demonstration (no real claim, no real source)

**Gap:** C2/C3/C4 (conceptual only, no real source) + C5 (no match) + C6 (no direct link). This is a **structural gap** — trading-platform lacks real evidence entirely.

---

### Page 6: `platform.html` — PASS WITH GAP

| Test | Finding |
|---|---|
| **C1 Evidence existence** | ⚠️ Evidence Trace Demo — 4-step trace: Research Conclusion → Source-Linked Fact → Source Document → Official Origin. References "Investment Research Note · Aramco Analysis" |
| **C2 Evidence specificity** | ⚠️ **MIXED** — references real Aramco Q1 2026 Earnings Release but no verified fact shown, no live link |
| **C3 Source identity** | ⚠️ Source identified by name ("Saudi Aramco Q1 2026 Earnings Release · Page 4, Paragraph 3, Revenue Table") but **NO live URL** |
| **C4 Traceability** | ❌ No traceability — no live link, no Evidence Explorer link. Links to trust-framework.html instead |
| **C5 Sample mapping** | ✅ **MATCH** — sample-library `sample-earnings` uses Saudi Aramco (aramco.com). Platform's Aramco trace matches sample-earnings source |
| **C6 Direct continuity** | ❌ **GAP** — NO link to sample-library from Evidence Trace Demo. Links to trust-framework.html (line 514) instead. sample-library appears ONLY in footer (line 722) |
| **C7 Buyer relevance** | ✅ Platform buyer sees Aramco trace — relevant to understanding platform capability |
| **C8 Briefing continuity** | ⚠️ **PARTIAL** — CTA links to contact, but evidence → sample path is broken |

**Evidence type:** Official-source trace (references real source but no live link)

**Gap:** C3/C4 (no live source URL) + C6 (no direct link to sample-library, links to trust-framework instead)

---

### Page 7: `enterprise.html` — N/A (No Evidence Section)

| Test | Finding |
|---|---|
| **C1-C8** | N/A — enterprise.html is deployment-first. No evidence demonstration section. The page discusses evidence conceptually ("evidence trails," "evidence-backed intelligence") but does not show a specific evidence sample |

**Evidence type:** None (conceptual references only)

**Gap:** None — this page's role is deployment evaluation, not evidence demonstration

---

### Page 8: `developers.html` — PASS WITH GAP

| Test | Finding |
|---|---|
| **C1 Evidence existence** | ✅ Code example — full curl request + JSON response for NVIDIA Investment Intelligence brief. Response includes evidence object (source_id, source_name, source_tier, document_id, page, paragraph, extraction_confidence, validation_status) + derivation object + evidence_chain_url |
| **C2 Evidence specificity** | ⚠️ **Synthetic/illustrative** — clearly labeled "The response below is synthetic — field names, IDs, and values are representative, not production records" |
| **C3 Source identity** | ⚠️ Source identified in JSON ("NVIDIA Investor Relations", source_tier: 1) but **NO live URL** — synthetic data |
| **C4 Traceability** | ⚠️ **PARTIAL** — evidence_chain_url in JSON response ("/v1/evidence/example_brief_id") but it's illustrative, not a real link |
| **C5 Sample mapping** | ✅ **MATCH** — sample-library `sample-api` shows API Intelligence Object with provenance structure matching the developers.html code example |
| **C6 Direct continuity** | ❌ **GAP** — NO link to sample-library from code example section. sample-library appears ONLY in footer (line 688) |
| **C7 Buyer relevance** | ✅ Developer buyer sees API response with evidence object — directly relevant to integration evaluation |
| **C8 Briefing continuity** | ⚠️ **PARTIAL** — CTA links to contact (API Access), but evidence → sample path is broken |

**Evidence type:** Conceptual demonstration (synthetic but realistic, clearly labeled)

**Gap:** C2/C3 (synthetic, no live source) + C6 (no direct link to sample-api in sample-library)

---

## 4. Cross-Page Sample Mapping Summary

| Page | Evidence source | sample-library sample | Match? | C6 direct link? |
|---|---|---|---|---|
| investment-intelligence | Aramco (aramco.com) | sample-earnings (Aramco) | ✅ MATCH | ❌ No |
| market-intelligence | FOMC July 29 (federalreserve.gov) | sample-fomc (FOMC August 2) | ⚠️ PARTIAL (different date) | ❌ No |
| financial-media | ECB July 16 (ecb.europa.eu) | sample-media (Federal Reserve) | ❌ MISMATCH | ✅ Yes |
| risk-intelligence | OFAC sb0581 (no live URL) | sample-risk (generic "Regulatory Authority") | ❌ MISMATCH | ❌ No |
| trading-platform | Conceptual (no specific source) | sample-market (BLS) | ❌ NO MATCH | ❌ No |
| platform.html | Aramco trace (no live URL) | sample-earnings (Aramco) | ✅ MATCH | ❌ No |
| enterprise.html | N/A (no evidence) | N/A | N/A | N/A |
| developers.html | NVIDIA (synthetic) | sample-api (FOMC JSON) | ⚠️ PARTIAL (different entity) | ❌ No |

---

## 5. Findings

### 5.1 The universal gap: C6 (direct continuity)

**7 of 8 pages have NO direct link from their evidence section to sample-library.html.** Only financial-media.html has a content-body link ("View Sample Intelligence Outputs"). All other pages have sample-library ONLY in nav/footer — which does NOT count as C6 success per user direction.

**This is the single biggest gap.** The evidence demonstrations are strong on most pages (5 of 8 have real evidence with live source links), but the buyer cannot transition from "I see this evidence" to "let me inspect a real sample" without knowing to look in the footer.

### 5.2 The sample mismatch problem (C5)

**3 of 7 pages with evidence have sample mismatches:**
- **financial-media:** ECB evidence → sample-media uses Federal Reserve (different source entirely)
- **risk-intelligence:** OFAC evidence → sample-risk uses generic "Regulatory Authority" (different source)
- **trading-platform:** Conceptual evidence → sample-market uses BLS (no specific event to match)

**2 of 7 have partial matches:**
- **market-intelligence:** FOMC July 29 → sample-fomc FOMC August 2 (same source type, different event)
- **developers:** NVIDIA → sample-api FOMC (different entity, same API structure)

**Only 2 of 7 have clean matches:**
- **investment-intelligence:** Aramco → sample-earnings (Aramco) ✅
- **platform.html:** Aramco trace → sample-earnings (Aramco) ✅

### 5.3 The traceability gap (C3/C4)

**3 of 8 pages lack live source URLs in their evidence:**
- **risk-intelligence:** OFAC sb0581 — no live URL (only Evidence Explorer reference)
- **trading-platform:** Conceptual only — no specific source
- **platform.html:** Aramco trace — no live URL (references source by name only)

### 5.4 The structural gap: trading-platform

**trading-platform.html has NO real evidence.** Its "Evidence Chain" is a conceptual diagram with no specific event, no specific source, no verified fact. This is a **structural gap** — not a linking issue. Adding a sample-library link would not solve it because there is no specific evidence to link from.

### 5.5 Financial-media special case (per user direction)

**The ECB Evidence Demonstration is the strongest evidence on the site** (Wave 2 — full 5-step chain to Publisher-Ready Output). But the sample-library `sample-media` uses Federal Reserve, not ECB.

**The buyer clicking "View Sample Intelligence Outputs" expects to see an ECB-based media sample** (matching what they just saw). Instead, they land on a Federal Reserve-based sample. The context is lost.

**This is the most critical mismatch** because financial-media is the ONLY page with a C6 link — and the link leads to a mismatched sample.

---

## 6. P0 / P1 / P2 Classification

### P0 — Must address (per user direction: "proof architecture, not link stuffing")

| # | Gap | Pages affected | Root cause |
|---|---|---|---|
| P0-1 | **C6 gap: no direct link from evidence to sample-library** | 7 of 8 pages (all except financial-media) | Missing content-body link from evidence section to matching sample |
| P0-2 | **C5 mismatch: financial-media ECB evidence → sample-media Federal Reserve** | financial-media.html | sample-media in sample-library uses wrong source — should use ECB to match page evidence |
| P0-3 | **C5 mismatch: risk-intelligence OFAC → sample-risk generic** | risk-intelligence.html | sample-risk uses generic "Regulatory Authority" — should reference OFAC or a real regulatory source |

### P1 — Address after P0

| # | Gap | Pages affected |
|---|---|---|
| P1-1 | C5 partial match: market-intelligence FOMC July 29 → sample-fomc August 2 (date mismatch) | market-intelligence.html |
| P1-2 | C3/C4 gap: risk-intelligence OFAC — no live source URL | risk-intelligence.html |
| P1-3 | C3/C4 gap: platform.html Aramco trace — no live source URL | platform.html (Wave 3 P3, deferred) |
| P1-4 | C5 partial match: developers NVIDIA → sample-api FOMC (entity mismatch) | developers.html |

### P2 — Structural gaps (not solvable by linking)

| # | Gap | Pages affected |
|---|---|---|
| P2-1 | C2/C3/C4 structural gap: trading-platform has NO real evidence (conceptual only) | trading-platform.html |
| P2-2 | enterprise.html has no evidence section (by design — deployment-first) | enterprise.html (not a gap) |

---

## 7. Recommended Scope (For User Approval — Not Yet Executed)

### 7.1 What Wave 4-C should do

**Per user direction: "Do not assume every page needs a link to Sample Library. If the evidence on the page is stronger than a generic sample, or has a direct official link that serves the purpose, note that."**

**P0-1 (C6 direct links):** Add content-body links from evidence sections to matching sample-library samples. ONLY for pages where a real match exists:
- ✅ investment-intelligence: Aramco evidence → sample-library.html#sample-earnings (clean match)
- ✅ platform.html: Aramco trace → sample-library.html#sample-earnings (clean match)
- ✅ developers.html: API code example → sample-library.html#sample-api (structural match)
- ⚠️ market-intelligence: FOMC evidence → sample-library.html#sample-fomc (partial match — same source type, different date)
- ❌ financial-media: Already has C6 link, but sample mismatches (P0-2 must be fixed first)
- ❌ risk-intelligence: Sample mismatches (P0-3 must be fixed first)
- ❌ trading-platform: No real evidence to link from (P2-1 structural gap)

**P0-2 (financial-media sample mismatch):** Update sample-library `sample-media` to use ECB as source (matching the financial-media page's ECB Evidence Demonstration). This is a **sample-library content change**, not a page change.

**P0-3 (risk-intelligence sample mismatch):** Update sample-library `sample-risk` to reference OFAC or a real regulatory source with a live URL. This is a **sample-library content change**.

### 7.2 What Wave 4-C should NOT do

- ❌ Do NOT add sample-library links to trading-platform (no real evidence to link from — P2-1)
- ❌ Do NOT add sample-library links to enterprise.html (no evidence section — by design)
- ❌ Do NOT invent samples or source relationships (per user direction)
- ❌ Do NOT touch the evidence demonstrations themselves (they are strong)
- ❌ Do NOT touch index.html (FROZEN)
- ❌ Do NOT normalize CTA text (Wave 4-D)
- ❌ Do NOT add live source URLs to risk-intelligence/platform (P1-2/P1-3 — separate scope)

### 7.3 The pattern question

**Per user direction: "Is there one pattern, or does evidence → sample differ fundamentally by buyer?"**

**One pattern, with 3 variants:**
1. **Direct match (investment, platform, developers):** Add content-body link from evidence to matching sample. Clean.
2. **Sample fix first (financial-media, risk-intelligence):** Fix sample-library sample to match page evidence, THEN the existing/planned link works.
3. **No link (trading-platform, enterprise):** Do not add link. trading-platform needs real evidence first (structural). enterprise has no evidence section (by design).

---

## 8. What Must Not Be Touched

- ❌ **Evidence demonstrations on product pages** — they are strong (Wave 2 verified). Do NOT rewrite them.
- ❌ **Live source URLs on investment/market/financial-media** — they are correct and traceable.
- ❌ **Evidence Explorer links** — they work alongside sample-library links, not instead of them.
- ❌ **sample-library.html structure** — 6 samples with tabs is correct. Only sample CONTENT (sample-media source, sample-risk source) needs updating.
- ❌ **platform.html, enterprise.html, developers.html page structure** — protected per Wave 4-B.
- ❌ **index.html** — FROZEN.
- ❌ **CTA text** — Wave 4-D handles normalization.
- ❌ **Trading-platform evidence** — structural gap (P2-1) not solvable by Wave 4-C linking.

---

## 9. Strategic Verdict

### 9.1 The evidence is strong; the continuity is broken

The site has **strong real evidence** on 5 of 8 pages (investment, market, financial-media, risk, developers all have specific claims with identified sources). But the buyer cannot transition from "I see this evidence" to "let me inspect a real sample" because:
1. **7 of 8 pages lack a content-body link** from evidence to sample-library (C6 gap)
2. **3 samples in sample-library don't match** the page evidence (C5 mismatch)

### 9.2 The fix is primarily linking + sample content updates

**NOT new evidence creation.** The evidence demonstrations are strong. The fix is:
1. Add content-body links from evidence sections to matching samples (P0-1)
2. Fix 2 mismatched samples in sample-library (P0-2, P0-3)

### 9.3 What to decide before Wave 4-C Implementation

1. **Approve P0-1 scope?** (Add direct links on 3-4 pages with clean/partial matches: investment, platform, developers, market)
2. **Approve P0-2?** (Update sample-media in sample-library to use ECB instead of Federal Reserve)
3. **Approve P0-3?** (Update sample-risk in sample-library to use OFAC or real regulatory source with live URL)
4. **Confirm trading-platform is P2 (structural, not in Wave 4-C scope)?**
5. **Confirm enterprise.html is N/A (no evidence section, by design)?**

---

*End of Wave 4-C Discovery Report. No code modified. No commit. Awaiting user direction on Wave 4-C Implementation scope.*

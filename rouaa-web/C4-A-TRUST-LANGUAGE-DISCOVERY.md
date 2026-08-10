# C4-A — Trust-Language Discovery Scan (Exhaustive)

> **Status:** Discovery only. **No code modified. No commit. No execution.**
> **Baseline:** `96e0a5a` on `main`
> **Method:** Exhaustive grep scan across all HTML files (excluding `index.html` — FROZEN)
> **Purpose:** Complete inventory of every trust-language instance, classified per-instance with context and concept.

---

## Summary Counts

| Category | Total raw instances | CONFIRMED | REVIEW | ACCEPTABLE |
|---|---|---|---|---|
| D.4 — Audit-Ready | 27 | 16 | 0 | 11 (risk-intelligence exception) |
| D.8 — Timing claims | 13 | 5 | 5 | 3 |
| D.9 — Confidence terminology | 69 | 0 | 56 | 13 |
| D.13 — 24/7 | 2 | 1 | 1 | 0 |
| "every claim" FORBID | 14 | 6 | 6 | 2 |
| "verified Intelligence Object" FORBID variant | 4 | 4 | 0 | 0 |
| **Total** | **129** | **32** | **68** | **29** |

---

## D.4 — Audit-Ready (27 instances)

### ACCEPTABLE — risk-intelligence.html exception page (11 instances)

All 11 instances on `risk-intelligence.html` are ACCEPTABLE per Spec v7 Layer 3.6 — risk-intelligence is the D.4 exception page where "audit-ready" is legitimate risk context.

### CONFIRMED — all other pages (16 instances)

| # | File | Line | What is described as audit-ready | Context | Classification |
|---|---|---|---|---|---|
| 1 | architecture.html | 1619 | "decisions" | BODY | CONFIRMED |
| 2 | business-case.html | 325 | "On Demand" (section H4) | SECTION | CONFIRMED |
| 3 | business-case.html | 425 | "decision trails" | BODY | CONFIRMED |
| 4 | business-case.html | 513 | "decisions" | BODY | CONFIRMED |
| 5 | company.html | 156 | "By Construction" (section H4) | SECTION | CONFIRMED |
| 6 | design-reference.html | 706 | badge label "Audit Ready" | BADGE | CONFIRMED |
| 7 | evidence-explorer.html | 1177 | status label | BODY | CONFIRMED |
| 8 | evidence-explorer.html | 1210 | "Published · Immutable · Audit-ready" | BODY | CONFIRMED |
| 9 | evidence-explorer.html | 1422 | "Published · Reviewed" | BODY | CONFIRMED |
| 10 | financial-intelligence.html | 504 | "conclusions" / "defensible" | BODY | CONFIRMED |
| 11 | market-intelligence.html | 468 | badge label | BADGE | CONFIRMED |
| 12 | methodology.html | 147 | "By Construction" (H4 principle) | SECTION | CONFIRMED |
| 13 | sample-library.html | 316 | badge label "Audit Ready" | BADGE | CONFIRMED |
| 14 | visual-reference.html | 2411 | "decisions" | BODY | CONFIRMED |
| 15 | visual-reference.html | 2473 | "decisions" | BODY | CONFIRMED |
| 16 | why-roua.html | 231 | "Output" (section H4) | SECTION | CONFIRMED |

**What is being described as "audit-ready" across these 16 instances:**
- Decisions (5 instances) — "audit-ready decisions" / "audit-ready decision trails"
- Outputs (2 instances) — "Audit-Ready Output" / badge on output
- By Construction (2 instances) — "Audit-Ready By Construction" (principle name)
- Badge/label (3 instances) — status badge "Audit Ready"
- Conclusions/evidence (2 instances) — "audit-ready, defensible conclusions"
- Published artifacts (2 instances) — "Published · Immutable · Audit-ready"

---

## D.8 — Timing Claims (13 instances)

### CONFIRMED — FORBID (5 instances)

| # | File | Line | Term | What it refers to | Classification |
|---|---|---|---|---|---|
| 1 | architecture.html | 1517 | "in real time" | Event detection/correlation | CONFIRMED — intelligence-delivery latency claim |
| 2 | architecture.html | 1872 | "in real time" | Event detection/correlation | CONFIRMED — same |
| 3 | business-case.html | 435 | "in real time" | Market movements linked to events | CONFIRMED — intelligence-delivery latency |
| 4 | developers.html | 343 | "Real-time push" | Event push (WebSocket) | CONFIRMED — delivery latency claim on non-operational surface |
| 5 | developers.html | 443 | "real-time event pushes" | WebSocket subscription | CONFIRMED — same |

### REVIEW — "monitored continuously" (5 instances)

| # | File | Line | Term | What it refers to | Classification | Reason |
|---|---|---|---|---|---|---|
| 1 | financial-media.html | 158 | "monitored continuously" | Source monitoring in marketing workflow | REVIEW leans FORBID | Marketing context, not process description |
| 2 | investment-intelligence.html | 438 | "monitored continuously" | Source monitoring in how-desc | REVIEW leans acceptable | Process description (how-desc) |
| 3 | risk-intelligence.html | 306 | "monitored continuously" | Regulatory source monitoring | REVIEW leans acceptable | Process description |
| 4 | source-explorer.html | 1566 | "Real-time feed monitoring" | Feed monitoring label | REVIEW | "Real-time" as adjective for feed monitoring — timing claim or description? |
| 5 | source-registry.html | 414 | "monitored continuously" | Endpoint health monitoring | REVIEW leans acceptable | Process description (how-desc) |

### CONFIRMED — additional (3 instances)

| # | File | Line | Term | What it refers to | Classification |
|---|---|---|---|---|---|
| 6 | financial-intelligence.html | 410 | "in minutes, not hours" | Publication latency | CONFIRMED — latency-range claim (v7) |
| 7 | financial-media.html | 286 | "Real-time" | Central bank monitoring | CONFIRMED — timing claim |
| 8 | trust-framework.html | 333 | "in real time" | Committee verification | CONFIRMED — timing claim (also "every claim" on same line) |

---

## D.9 — Confidence Terminology (69 instances)

### ACCEPTABLE (13 instances)

| Concept | Count | Pages | Reason |
|---|---|---|---|
| confidence propagation | 3 | research-institute.html | Research term — NOT D.9 per v7 |
| extraction confidence (marked illustrative) | 10 | evidence-explorer.html, sample-library.html | Marked "(illustrative)" or in illustrative context |

### REVIEW leans FORBID — confidence scoring as capability description (16 instances)

| # | File | Line | Term | Context |
|---|---|---|---|---|
| 1 | design-reference.html | 550 | "confidence scoring" | Architecture layer capability |
| 2 | infrastructure-report.html | 288 | "Confidence scoring" | Governance controls row |
| 3 | solutions.html | 177 | "confidence scoring" | Decision advantage body |
| 4 | catalog.html | 438 | "confidence scoring" | Capability pill |
| 5 | catalog.html | 584 | "confidence scoring" | Module description |
| 6 | business-case.html | 229 | "confidence scoring" | Comparison table (traditional side) |
| 7 | business-case.html | 322 | "confidence scoring" | Body paragraph |
| 8 | business-case.html | 521 | "Confidence scoring" | Body paragraph |
| 9 | contact.html | 127 | "confidence scoring" | Evidence requirements card |
| 10 | company.html | 152 | "confidence scoring" | Body paragraph |
| 11 | company.html | 226 | "confidence scoring" | Body paragraph |
| 12 | why-roua.html | 227 | "confidence scoring" | Body paragraph |
| 13 | research-institute.html | 244 | "confidence scoring" | Publication description |
| 14 | research-institute.html | 302 | "confidence scoring" | Methodology card |
| 15 | research-institute.html | 214 | "confidence scoring" | Research area body |
| 16 | research-institute.html | 118 | "scores confidence" (verb) | Methodology description |

### REVIEW leans FORBID — extraction confidence as capability (18 instances)

| # | File | Line | Term | Context |
|---|---|---|---|---|
| 1 | methodology.html | 210 | "Extraction Confidence" (H4) | Confidence Signals factor name |
| 2 | methodology.html | 172 | "extraction confidence, which is scored" | Source hierarchy cell |
| 3 | methodology.html | 206 | "extraction confidence" | Body paragraph |
| 4 | methodology.html | 264 | "extraction confidence" | Workflow step |
| 5 | methodology.html | 280 | "extraction confidence" | Workflow step |
| 6 | methodology.html | 415 | "Extraction Confidence" | Evidence signal label |
| 7 | methodology.html | 468 | "extraction confidence" | Edge case body |
| 8 | architecture.html | 1673 | "Extraction confidence" | Evidence layer detail |
| 9 | architecture.html | 2094 | "Extraction Confidence" | Evidence meta key |
| 10 | architecture.html | 2312 | "confidence scored" | Three.js detail panel |
| 11 | developers.html | 338 | "extraction confidence" | REST API description |
| 12 | developers.html | 411 | "extraction confidence" | Endpoint description |
| 13 | developers.html | 473 | "Extraction confidence" | Evidence access card |
| 14 | infrastructure-report.html | 271 | "extraction confidence" | Status table row |
| 15 | evidence-explorer.html | 1123 | "Extraction Confidence" | Evidence label (non-illustrative context) |
| 16 | sample-library.html | 311, 383, 517, 621, 732, 839 | "Extraction Confidence" | Evidence labels (6 instances — may be illustrative context, needs per-instance check) |
| 17 | trust-framework.html | 274 | "extraction confidence" | Body paragraph |
| 18 | why-roua.html | 217 | "extraction confidence" | Body paragraph |

### REVIEW — other confidence terms needing context check (22 instances)

These include "confidence scored" (past tense), "Confidence Score" (typographic label in visual-reference), "confidence scores" in body text, and design-reference samples. Each needs per-instance context classification:

- **visual-reference.html** (7 instances): mix of design-reference documentation (ACCEPTABLE) and capability descriptions in page text (REVIEW leans FORBID)
- **evidence-explorer.html** (5 instances): mix of illustrative metadata (ACCEPTABLE) and capability labels (REVIEW)
- **research-institute.html** (2 instances): verb forms "scores confidence" / "score source confidence" (REVIEW leans FORBID)
- **Other pages** (8 instances): various body content references

---

## D.13 — 24/7 (2 instances)

| # | File | Line | Text | Classification | Reason |
|---|---|---|---|---|---|
| 1 | financial-intelligence.html | 332 | "Monitored 24/7 · Tier 1 trust · structurally verified" | CONFIRMED | Timing claim in Product Architecture visual — "24/7" as monitoring guarantee |
| 2 | source-explorer.html | 525 | stat-value "24/7" | REVIEW | Stat card — team decides: operational commitment or unproven claim? |

---

## "every claim" FORBID (14 instances)

### ACCEPTABLE — quoted institutional question (2 instances)

| # | File | Line | Text | Reason |
|---|---|---|---|---|
| 1 | architecture.html | 1803 | "Can we locate the exact passage behind every claim?" | Quoted institutional question — ACCEPTABLE per v7 |

### CONFIRMED — ROUA capability claim (6 instances)

| # | File | Line | Text | Reason |
|---|---|---|---|---|
| 1 | evidence-explorer.html | 284 | "every claim carries its source, supporting evidence" | ROUA capability claim |
| 2 | evidence-explorer.html | 1009 | "every claim can be traced" | ROUA capability claim |
| 3 | financial-intelligence.html | 496 | "Every claim arrives at committee with a traceable evidence chain" | ROUA capability claim |
| 4 | financial-media.html | 165 | "Every claim in every published article links back" | ROUA capability claim |
| 5 | financial-media.html | 213 | "Every claim in every article links to source document" | ROUA capability claim |
| 6 | visual-reference.html | 1300 | "evidence patterns that prove every claim" | ROUA capability claim |
| 7 | why-roua.html | 140 | "every claim traces to a source document" | ROUA capability claim |

### REVIEW — institutional requirement vs ROUA claim (6 instances)

| # | File | Line | Text | Reason |
|---|---|---|---|---|
| 1 | business-case.html | 440 | "Publish faster with every claim traceable" | REVIEW — capability claim or editorial requirement? |
| 2 | financial-intelligence.html | 8 | "Every claim traceable to its source document" (meta) | REVIEW — meta description, is this ROUA claim or institutional requirement? |
| 3 | financial-media.html | 135 | "Every claim must be verifiable" | REVIEW — institutional requirement, not ROUA claim |
| 4 | solutions.html | 240 | "Every claim must be verifiable" | REVIEW — same pattern |
| 5 | solutions.html | 254 | "every claim traceable to an official source" | REVIEW — outcome description or ROUA claim? |
| 6 | trust-framework.html | 333 | "verify every claim in real time" | REVIEW — also has D.8 ("real time") on same line |

---

## "verified Intelligence Object" FORBID variant (4 instances)

All 4 instances are on `product-experience.html` — EVIDENCE footers in 4 of the 5 environment sections:

| # | File | Line | Text | Classification |
|---|---|---|---|---|
| 1 | product-experience.html | 662 | "Every field traces back to the verified Intelligence Object." | CONFIRMED — should be "Governed Intelligence Object" |
| 2 | product-experience.html | 738 | "Every market assessment traces back to the verified Intelligence Object." | CONFIRMED |
| 3 | product-experience.html | 814 | "Every risk assessment traces back to the verified Intelligence Object." | CONFIRMED |
| 4 | product-experience.html | 916 | "Every published story traces back to the verified Intelligence Object." | CONFIRMED |

---

## Discovery Summary

| Category | CONFIRMED | REVIEW | ACCEPTABLE | Total |
|---|---|---|---|---|
| D.4 — Audit-Ready | 16 | 0 | 11 | 27 |
| D.8 — Timing claims | 5 | 5 | 3 | 13 |
| D.9 — Confidence terminology | 0 | 56 | 13 | 69 |
| D.13 — 24/7 | 1 | 1 | 0 | 2 |
| "every claim" | 7 | 6 | 1 | 14 |
| "verified Intelligence Object" | 4 | 0 | 0 | 4 |
| **Total** | **33** | **68** | **28** | **129** |

### Key findings

1. **D.9 is the largest category** (69 instances) but has **zero CONFIRMED** — all 56 non-ACCEPTABLE instances are REVIEW. This is because D.9 is concept-based per v7: each instance requires context classification (capability description vs illustrative metadata vs design-reference documentation vs research term). No blind replacement is possible.

2. **D.4 has 16 CONFIRMED** across 11 pages. These are clear FORBID violations — "Audit-Ready" used as descriptor for decisions, outputs, conclusions, and badges on pages that are NOT risk-intelligence.html.

3. **"verified Intelligence Object" has 4 CONFIRMED** — all on product-experience.html, all in EVIDENCE footers. Clear FORBID variant — should be "Governed Intelligence Object."

4. **D.8 has 5 CONFIRMED** — "real-time" and "in minutes, not hours" as intelligence-delivery latency claims. 5 REVIEW instances are "monitored continuously" which is context-dependent.

5. **"every claim" has 7 CONFIRMED** — ROUA capability claims using universal quantifier. 6 REVIEW instances are institutional requirements ("every claim must be verifiable") which may be acceptable.

6. **D.13 has 1 CONFIRMED + 1 REVIEW** — "24/7" in financial-intelligence (timing claim) and source-explorer (stat card, team decides).

### What C4-B would look like

- **D.4 (16 CONFIRMED):** Context-classified replacement — "Audit-Ready" → "Auditable" (for decisions/outputs) or "Reconstructable" (for evidence trails). NOT blind find-replace — the replacement depends on what is described as audit-ready.
- **"verified Intelligence Object" (4 CONFIRMED):** Mechanical replacement → "Governed Intelligence Object."
- **D.8 (5 CONFIRMED):** Context-classified replacement — "real-time" → "as they are published" / "through configured source monitoring." "in minutes, not hours" → "through configured workflows."
- **"every claim" (7 CONFIRMED):** Context-classified replacement → "each claim" / "governed claims."
- **D.13 (1 CONFIRMED):** "24/7" → "through configured schedules."
- **D.9 (56 REVIEW):** All deferred to team decision — no auto-replacement. Each instance needs context classification: is "confidence scoring" a capability description (replace with "confidence signals") or a research/architecture term (leave)?

---

*End of C4-A Trust-Language Discovery Scan. No code modified. No execution. Discovery only. Awaiting team review before C4-B.*

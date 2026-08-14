# Source Qualification Record — PBoC (Pre-screening)

**Source**: People's Bank of China (PBoC)
**Top 20 rank**: 1
**Pre-screening date**: 2026-08-15
**Branch**: `top20-prescreening`
**Queue baseline**: Global Qualification Queue v1 (`92b6c4f` — FROZEN)
**Template**: Source Qualification Report Template v1 (`f5caf57`)
**Type**: Pre-screening record — documentation only. NOT onboarding, NOT Gate 5, NOT configuration, NOT Contract, NOT website change.

---

## Source Information

| Field | Value |
|-------|-------|
| Source name | People's Bank of China (PBoC / 中国人民银行) |
| Official URL | `https://www.pbc.gov.cn/` |
| English site | `https://www.pbc.gov.cn/en/3688006/index.html` |
| Feed URL | No RSS/Atom feed discovered at standard paths (`/rss.xml`, `/feed.xml`, `/atom.xml`, `/en/rss`, `/en/feed`, `/eportal/...` — all return 404) |
| Source class | central_bank |
| Country | CN |
| Region | E. Asia |
| Tier | T1 |
| Queue priority (Top 20) | 1 — systemically important; largest economy without coverage |
| Critical workflows | Monetary policy decisions, press releases, currency swap agreements, reserve requirement changes |

---

## Gate 1 — Access Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (automated HTTP probing) |
| Access path | HTML index (year-archive page) |
| Primary URL tested | `https://www.pbc.gov.cn/en/3688110/3688172/2026/index.html` (Press Releases — 2026 archive) |
| Fetch method | urllib-equivalent (curl with browser User-Agent) |
| HTTP status | 200 OK |
| Response size | 125,956 bytes |
| Result | **PASS** |

### Probing notes

- Root domain `https://www.pbc.gov.cn/` returns HTTP 200 (Chinese homepage, 141 KB)
- English root `https://www.pbc.gov.cn/en/` returns HTTP 403 (directory listing denied — this is a path-level denial, not source-level block; the English site is reachable via specific page paths)
- English homepage `https://www.pbc.gov.cn/en/3688006/index.html` returns HTTP 200 (106 KB)
- Press releases 2026 archive `https://www.pbc.gov.cn/en/3688110/3688172/2026/index.html` returns HTTP 200 (126 KB) — this is the access path for the press release listing
- Common RSS/Atom paths all return HTTP 404 (see Feed URL field above)
- No `Link: <...>; rel=alternate` header advertising a feed

**Gate 1 conclusion**: Source is accessible via HTML index paths. No RSS feed exists. The access path is the year-archive HTML page, not a feed. This is consistent with the ESMA HTML-validation precedent (`8041cda`) where HTML index pages were used as the access path when no feed was available.

---

## Gate 2 — Provenance Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (HTML metadata inspection) |
| Date source | Multiple date sources detected — **date-source precedence UNRESOLVED** |
| URL timestamp (sampled article) | `/en/3688110/3688172/2026/2026080716471581555/index.html` — timestamp `YYYYMMDDHHMMSSmmm` parses to **2026-08-07 16:47:15** |
| HTML meta tag — `PubDate` | `<meta name="PubDate" content="2026-08-06">` — date **2026-08-06** |
| HTML meta tag — `createDate` | `<meta name="createDate" content="2026-08-07 16:47:21">` — date **2026-08-07 16:47:21** |
| Listing-page date string | Year-archive page contains `>2026-08-10<`, `>2026-08-07<`, `>2026-08-06<`, `>2026-08-02<` date strings adjacent to article links |
| Date-source agreement | URL timestamp (2026-08-07) and `createDate` (2026-08-07 16:47:21) agree — 6 seconds apart, same event. **`PubDate` (2026-08-06) differs by 1 day.** |
| Result | **PASS WITH REVIEW** — provenance metadata is available, but date-source precedence is unresolved |

### Provenance pattern assessment

PBoC provides multiple date sources per article, but they do **not all agree**:

1. **URL timestamp** (`YYYYMMDDHHMMSSmmm` embedded in article path): **2026-08-07 16:47:15**
2. **HTML meta tag `createDate`**: **2026-08-07 16:47:21** (6 seconds after URL timestamp — likely same event: article creation in CMS)
3. **HTML meta tag `PubDate`**: **2026-08-06** (1 day **before** URL timestamp and `createDate`)
4. **Listing-page date strings**: visible on year-archive page; presumably derived from one of the above, but the source is not yet determined

The URL timestamp and `createDate` are consistent with each other (same day, same minute, 6 seconds apart), suggesting they both reflect when the article was created in the CMS. The `PubDate` is 1 day **earlier**, which is unusual — `PubDate` conventionally represents the official publication date, but here it precedes the creation date.

**Date-source precedence is unresolved.** We do not yet know:
- Whether `PubDate` represents the date of the underlying event (e.g., when the BCRA agreement was signed) vs. when the article was published
- Which date should enter provenance as the official `document_date` for the pipeline
- Whether different article types (press releases vs. monetary policy reports vs. statistics) use different date conventions

This requires review during the qualification phase (Gate 5) or manual review before onboarding. Pre-screening cannot resolve this question because it would require comparing multiple article types and inspecting their content semantics.

**Comparison to known cases:**
- ESMA RSS (`27294db` — Gate 2 FAIL): no publication date in RSS feed at all → PBoC is stronger than ESMA because dates ARE available
- SNB (`c09de13` — Gate 2 PASS): single date source (`dc:date` in RSS) → SNB had unambiguous provenance; PBoC has multiple date sources that conflict

**Gate 2 conclusion**: Provenance metadata is available and machine-readable, but date-source precedence is unresolved. The route to a definitive `document_date` requires explicit review during qualification. Pre-screening flags this as **PASS WITH REVIEW**.

---

## Gate 3 — Content Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (static HTML inspection) |
| Content format | Static HTML (no JS rendering required) |
| Sample URL | `https://www.pbc.gov.cn/en/3688110/3688172/2026/2026080716471581555/index.html` |
| Sample title | "PBOC and BCRA Renew Bilateral Currency Swap Agreement" |
| Sample size | 120,994 bytes |
| Machine-readable | **YES** — static HTML contains full article body, title, and metadata in `<head>` |
| Result | **PASS** |

### Content inspection notes

The press release HTML contains:
- `<title>` tag with the full English title
- `<meta name="PubDate">` and `<meta name="createDate">` tags in `<head>`
- Static HTML body with full article text (no JS-rendered content detected; no `__NEXT_DATA__` or `window.__INITIAL_STATE__` markers)
- 20 article URLs visible in the 2026 year-archive page (static HTML)

This contrasts with the UK ONS Gate 3 FAIL (`Phase B` — JS-rendered, static HTML empty). PBoC's content is fully present in static HTML.

**Gate 3 conclusion**: Content is substantive and machine-readable in static HTML. No JS rendering required for extraction.

---

## Gate 4 — Configuration Applicability

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (pattern category match) |
| Pattern category | `central_bank` — matches existing PATTERN_TYPE_METADATA category |
| Existing analogs | BEA (`c8af140` — statistical_authority, PATTERN_TYPE_METADATA, config-only PASS), SNB (`c09de13` — central_bank, PATTERN_TYPE_METADATA, config-only PASS) |
| Result | **PASS** — configuration category appears applicable; Gate 5 required to determine actual onboarding effort |

### Pattern category notes

PBoC's content structure (press releases with titles, dates, and body text) matches the `central_bank` class pattern. The provenance pattern (HTML meta tag with `PubDate`) falls under PATTERN_TYPE_METADATA in the pipeline's pattern taxonomy — the same category as BEA and SNB.

**Gate 4 answers only**: "Does a category/configuration abstraction exist that can match this source?" — Answer: YES (`PATTERN_TYPE_METADATA`, with `central_bank` class analogs in SNB).

Gate 4 does **NOT** predict:
- How much engineering effort Gate 5 will require
- Whether source-specific code will be needed
- Whether the configuration will succeed on first attempt

These are Gate 5 questions. Pre-screening separates **applicability** (does the abstraction exist?) from **difficulty** (how much work will Gate 5 take?) — per Section 5 of the Queue (priority / readiness / technical difficulty are independent dimensions).

**Gate 4 conclusion**: Configuration category is applicable. Actual onboarding effort is a Gate 5 question, not a Gate 4 question.

---

## Gate 5 — First-Attempt Validation

| Field | Value |
|-------|-------|
| Result | **NOT ATTEMPTED** |

Per pre-screening scope: Gate 5 is NOT performed during pre-screening. No configuration is created. No pipeline run is attempted. Gate 5 is reserved for the qualification phase (after pre-screening produces a QUALIFICATION_READY routing).

---

## Intelligence Quality Assessment

| Field | Value |
|-------|-------|
| Quality status | N/A — Gate 5 not attempted |

---

## Initial Routing

| Field | Value |
|-------|-------|
| Earliest blocking gate | none (Gates 1, 3, 4 PASS; Gate 2 PASS WITH REVIEW) |
| Initial routing | **QUALIFICATION_READY** |
| Routing qualifier | **PROVENANCE DATE PRECEDENCE REVIEW** — Gate 2 flagged multiple date sources that do not agree (`PubDate` 2026-08-06 vs. URL timestamp / `createDate` 2026-08-07); date-source precedence must be resolved during qualification (Gate 5) or via manual review before onboarding |
| Routing rationale | Gates 1, 3, 4 PASS; Gate 2 PASS WITH REVIEW (provenance available but date-source precedence unresolved); configuration category (`PATTERN_TYPE_METADATA`, `central_bank` class) appears applicable |
| Confidence | MEDIUM |
| Confidence basis | HIGH = direct evidence from documented Gate 5 test; MEDIUM = screening + partial or retrospective evidence; LOW = inference or unresolved condition. This record is MEDIUM because it is based on pre-screening (Gate 1-4 only) without Gate 5 confirmation. |

---

## Evidence

| Evidence | Source | What it proves |
|----------|--------|----------------|
| HTTP 200 on press release archive | `https://www.pbc.gov.cn/en/3688110/3688172/2026/index.html` (probed 2026-08-15) | Gate 1 PASS — access path exists and returns content |
| HTTP 200 on sample press release | `https://www.pbc.gov.cn/en/3688110/3688172/2026/2026080716471581555/index.html` (probed 2026-08-15) | Gate 3 PASS — static HTML contains full article content |
| URL timestamp pattern | `/2026/2026080716471581555/` in article URL → 2026-08-07 16:47:15 | Gate 2 — date is embedded in URL (YYYYMMDDHHMMSSmmm) |
| HTML meta tag PubDate | `<meta name="PubDate" content="2026-08-06">` on sample press release | Gate 2 — machine-readable provenance in HTML head (date 2026-08-06) |
| HTML meta tag createDate | `<meta name="createDate" content="2026-08-07 16:47:21">` on sample press release | Gate 2 — secondary provenance source (date 2026-08-07) |
| Date-source disagreement | `PubDate` (2026-08-06) ≠ URL timestamp / `createDate` (2026-08-07) | Gate 2 PASS WITH REVIEW — date-source precedence unresolved |
| 20 article URLs in year-archive page | Static HTML of `/en/3688110/3688172/2026/index.html` | Gate 3 PASS — listing page exposes article set without JS |
| Pattern category match | SNB (`c09de13` — central_bank, PATTERN_TYPE_METADATA, config-only PASS) | Gate 4 PASS — configuration category applicable; proven analog exists in same class |

### What this evidence does NOT prove

- Does NOT prove that a Gate 5 first-attempt run will succeed (sample too small, per Governance Rule 10)
- Does NOT prove that the pipeline's configurable extractor will handle PBoC without source-specific code (Gate 4 confirms pattern category applicability only; actual onboarding effort is a Gate 5 question)
- Does NOT resolve which date source (URL timestamp, `createDate`, or `PubDate`) should be used as the official `document_date` — this requires qualification-phase review
- Does NOT prove coverage breadth (only one press release was sampled; PBoC may publish other content types — monetary policy reports, statistics, regulations — that require additional pattern categories)
- Does NOT prove language handling (Chinese-language paths exist alongside English; pattern category for Chinese-language content not assessed)
- Does NOT authorize onboarding, configuration creation, or Gate 5 attempt

---

## Priority Retained

| Field | Value |
|-------|-------|
| Top 20 rank | 1 (unchanged) |
| Queue state transition | DISCOVERY_ONLY → **QUALIFICATION_READY** |
| Priority retained | Yes — pre-screening result does not demote the source's queue priority. PBoC remains Top 20 rank #1. |

### Queue state update

Per Section 15 of Global Qualification Queue v1 (`92b6c4f`), pre-screening may transition a source from DISCOVERY_ONLY to either QUALIFICATION_READY or KNOWN_BLOCKED. PBoC transitions to QUALIFICATION_READY based on Gates 1, 3, 4 PASS and Gate 2 PASS WITH REVIEW (provenance available but date-source precedence unresolved — flagged as routing qualifier).

This transition will be reflected in the next queue state update after pre-screening of the Top 20 is complete (or batched at a user-defined checkpoint). The current Queue v1 FROZEN baseline is not modified by individual pre-screening records.

---

## Root-Cause Review

| Field | Value |
|-------|-------|
| Triggered? | No — not triggered because Gate 5 was not attempted |

---

## Qualification Decision

| Field | Value |
|-------|-------|
| Decided by | N/A — pre-screening does not produce a qualification decision |
| Qualification status | PENDING — pre-screening produced a routing recommendation (QUALIFICATION_READY), not a qualification decision |
| Review status | NOT REQUIRED at pre-screening stage |
| Confidence | MEDIUM (per Initial Routing section) |
| Evidence basis | Pre-screening HTTP probing + HTML metadata inspection (no test commit, no Gate 5 run) |

---

## Commercial Recommendation

| Field | Value |
|-------|-------|
| Prepared by | N/A — pre-screening does not produce a commercial recommendation |
| Recommended action | PENDING — pre-screening produces a routing recommendation only; commercial recommendation requires the full Source Qualification Report workflow (Gate 5 + Intelligence Quality + Engineering Scope) |

---

## Engineering Scope

| Field | Value |
|-------|-------|
| Prepared by | N/A — pre-screening does not trigger engineering scope |
| Engineering required | Not yet determined — pre-screening does not predict engineering effort. Gate 4 confirms configuration category applicability only; actual onboarding effort is determined during Gate 5 (first-attempt validation) |

---

## Appendix: Probing Log

```text
2026-08-15 — Pre-screening probe of PBoC

Probe 1: https://www.pbc.gov.cn/                                → 200 OK (141 KB, Chinese homepage)
Probe 2: https://www.pbc.gov.cn/en/                              → 403 (directory listing denied — path-level, not source-level)
Probe 3: https://www.pbc.gov.cn/en/3688006/index.html            → 200 OK (106 KB, English homepage)
Probe 4: https://www.pbc.gov.cn/en/3688110/3688172/index.html   → 200 OK (122 KB, Press Releases listing)
Probe 5: https://www.pbc.gov.cn/en/3688110/3688172/2026/index.html → 200 OK (126 KB, 2026 archive with 20 article links)
Probe 6: https://www.pbc.gov.cn/en/3688110/3688172/2026/2026080716471581555/index.html → 200 OK (121 KB, sample press release "PBOC and BCRA Renew Bilateral Currency Swap Agreement")
Probe 7: https://www.pbc.gov.cn/rss.xml                          → 404 (no RSS at this path)
Probe 8: https://www.pbc.gov.cn/en/rss.xml                       → 404
Probe 9: https://www.pbc.gov.cn/feed.xml                         → 404
Probe 10: https://www.pbc.gov.cn/atom.xml                       → 404
Probe 11: https://www.pbc.gov.cn/en/feed                         → 404
Probe 12: https://www.pbc.gov.cn/en/rss                          → 404
Probe 13: https://www.pbc.gov.cn/eportal/getUmRssWidgetRssList   → 404 (no eportal RSS endpoint)

Provenance detected:
- URL pattern: /2026/2026080716471581555/ (timestamp YYYYMMDDHHMMSSmmm)
- HTML meta tag: <meta name="PubDate" content="2026-08-06">
- HTML meta tag: <meta name="createDate" content="2026-08-07 16:47:21">
- Listing-page date strings: >2026-08-10<, >2026-08-07<, >2026-08-06<, >2026-08-02<
```

---

## Pre-screening Verdict

| Gate | Result | Notes |
|------|--------|-------|
| Gate 1 (Access) | PASS | HTML index path; HTTP 200; no RSS feed, but year-archive HTML works |
| Gate 2 (Provenance) | **PASS WITH REVIEW** | Multiple date sources detected; URL timestamp and `createDate` agree (2026-08-07), but `PubDate` differs (2026-08-06); date-source precedence unresolved |
| Gate 3 (Content) | PASS | Static HTML, no JS rendering; full article body + title + metadata |
| Gate 4 (Configuration applicability) | PASS | Configuration category (`PATTERN_TYPE_METADATA`, `central_bank` class) appears applicable; SNB analog exists. Gate 5 required to determine actual onboarding effort |
| Gate 5 (First-attempt validation) | NOT ATTEMPTED | Per pre-screening scope |
| **Initial routing** | **QUALIFICATION_READY** | Gates 1, 3, 4 PASS; Gate 2 PASS WITH REVIEW |
| **Routing qualifier** | **PROVENANCE DATE PRECEDENCE REVIEW** | Date-source precedence must be resolved during qualification (Gate 5) or via manual review before onboarding |
| **Confidence** | MEDIUM | Based on pre-screening evidence; not Gate 5 confirmed |
| **Priority retained** | Yes | Top 20 rank #1 unchanged |

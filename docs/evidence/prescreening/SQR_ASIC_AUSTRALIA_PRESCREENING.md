# Source Qualification Record — ASIC Australia (Pre-screening)

**Source**: Australian Securities and Investments Commission (ASIC)
**Top 20 rank**: 20
**Pre-screening date**: 2026-08-15
**Branch**: `top20-prescreening`
**Queue baseline**: Global Qualification Queue v1 (`92b6c4f` — FROZEN)
**Template**: Source Qualification Report Template v1 (`f5caf57`)
**Type**: Pre-screening record — documentation only. NOT onboarding, NOT Gate 5, NOT configuration, NOT Contract, NOT website change.

---

## Source Information

| Field | Value |
|-------|-------|
| Source name | Australian Securities and Investments Commission (ASIC) |
| Official URL | `https://www.asic.gov.au/` |
| Feed URL | No RSS/Atom feed discovered at standard paths (`/rss`, `/feed.xml`, `/atom.xml`, `/rss-media-releases.xml` — all return 404) |
| Source class | financial_regulator |
| Country | AU |
| Region | Oceania |
| Tier | T2 |
| Queue priority (Top 20) | 20 — Major APAC regulator |
| Critical workflows | Media releases, reports, bannings and alerts, speeches, ASIC views |

---

## Gate 1 — Access Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (automated HTTP probing) |
| Access path | HTML index (newsroom + media releases) |
| Primary URL tested | `https://www.asic.gov.au/newsroom` |
| Fetch method | urllib-equivalent (curl with browser User-Agent) |
| HTTP status | 200 OK |
| Response size | 16,192 bytes |
| Server | AWS ELB (awselb/2.0) |
| Result | **PASS** |

### Probing notes

- `https://asic.gov.au/` returns HTTP 301 redirect to `https://www.asic.gov.au/` (86 KB, English homepage)
- `https://www.asic.gov.au/newsroom` returns HTTP 200 (16 KB, newsroom landing page)
- `https://www.asic.gov.au/newsroom/media-releases` returns HTTP 200 (14 KB, media releases listing)
- Common RSS/Atom paths return HTTP 404 (`/rss`, `/feed.xml`, `/atom.xml`, `/rss-media-releases.xml`)
- No `<link rel="alternate" type="application/rss+xml">` tag in HTML head
- Sample media release `https://www.asic.gov.au/about-asic/news-centre/find-a-media-release/2026-releases/26-189mr-consumers-left-in-the-dark-about-rising-car-insurance-premiums-asic-warns` returns HTTP 200 (24 KB)

The site uses AWS ELB (Elastic Load Balancer) with redirect from apex domain (`asic.gov.au`) to `www.asic.gov.au`. Media releases use URL pattern `/about-asic/news-centre/find-a-media-release/YYYY-releases/NN-NNNmr-title`.

**Gate 1 conclusion**: Source is accessible via HTML index paths. No RSS feed exists. The access path is the newsroom/media releases listing pages and individual media release article pages.

---

## Gate 2 — Provenance Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (HTML metadata inspection) |
| Date source | Multiple authoritative publication date sources — **all sources agree** |
| Article meta tag — `dcterms.date.created` | `<meta name="dcterms.date.created" content="2026-08-11">` (sampled on media release "26-189MR Consumers left in the dark about rising car insurance premiums, ASIC warns") |
| Article meta tag — `displayDate` | `<meta name="displayDate" content="11 August 2026">` — display version of publication date |
| Update metadata (NOT publication evidence) | `<meta name="dcterms.date.modified" content="2026-08-11">` — recorded as update metadata only; NOT counted as publication evidence per Batch 3 established rule (same date as creation in this case, but still classified as update metadata) |
| Update metadata (NOT publication evidence) | `<meta name="modified" content="11/08/2026 08:54 PM">` — additional update metadata; NOT counted as publication evidence |
| Date-source agreement | `dcterms.date.created` (2026-08-11) and `displayDate` (11 August 2026) — both authoritative publication date sources agree |
| Result | **PASS** — authoritative publication date sources present and machine-readable; all sources agree |

### Provenance pattern assessment

ASIC provides multiple date metadata fields, and the authoritative publication date sources **agree**:

1. **`dcterms.date.created`**: `2026-08-11` — Dublin Core metadata for creation/publication date (ISO 8601 format)
2. **`displayDate`**: `11 August 2026` — display version of the publication date (human-readable English format)

Both sources reference the same date (August 11, 2026). No date-source conflict exists.

The `dcterms.date.modified` (2026-08-11) and `modified` (11/08/2026 08:54 PM) meta tags are recorded as **update metadata only** — per the Batch 3 established rule, modified/updated timestamps are NOT treated as publication date evidence. In this case, `dcterms.date.modified` happens to equal `dcterms.date.created` (both 2026-08-11), suggesting the article was not modified after publication. However, the `modified` meta tag (11/08/2026 08:54 PM) provides a more specific timestamp that is later in the day — this is update metadata, not publication date evidence.

**Comparison to known cases:**
- SARB (Batch 4 — Gate 2 PASS): RSS `<pubDate>` + article HTML "Published Date" field (both agreed; "Last Modified Date" classified as update metadata)
- ASIC (this batch — Gate 2 PASS): `dcterms.date.created` + `displayDate` (both agree on August 11, 2026; `dcterms.date.modified` and `modified` classified as update metadata)

**Gate 2 conclusion**: Authoritative publication date sources are present, machine-readable, and agree. The `dcterms.date.created` (ISO 8601) and `displayDate` (English format) both reference August 11, 2026. The `dcterms.date.modified` and `modified` meta tags are correctly classified as update metadata only. No date-source precedence review is required.

---

## Gate 3 — Content Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (static HTML inspection) |
| Content format | Static HTML (no JS rendering required for article body) |
| Sample URL | `https://www.asic.gov.au/about-asic/news-centre/find-a-media-release/2026-releases/26-189mr-consumers-left-in-the-dark-about-rising-car-insurance-premiums-asic-warns` |
| Sample title | "26-189MR Consumers left in the dark about rising car insurance premiums, ASIC warns" |
| Sample size | 24,382 bytes |
| Machine-readable | **YES** — static HTML contains title, multiple date meta tags, article body with substantive content (6,831 chars), and structured metadata |
| Result | **PASS** |

### Content inspection notes

The media release HTML contains:
- `<title>` tag with "26-189MR Consumers left in the dark about rising car insurance premiums, ASIC warns | ASIC"
- Multiple date meta tags:
  - `<meta name="dcterms.date.created" content="2026-08-11">` — authoritative publication date (ISO 8601)
  - `<meta name="displayDate" content="11 August 2026">` — display version of publication date
  - `<meta name="dcterms.date.modified" content="2026-08-11">` — update metadata (NOT publication evidence)
  - `<meta name="modified" content="11/08/2026 08:54 PM">` — update metadata (NOT publication evidence)
- Article body with 6,831 chars of substantive content: "Car insurers are leaving many Australians guessing about the factors driving sharp and repeated premium increases, an ASIC review has found..."
- Media release numbering: `26-189MR` (year-sequence format)
- Static HTML (no JS-rendered content detected for article body)

**Gate 3 conclusion**: Content is substantive and machine-readable in static HTML. Multiple date meta tags provide both authoritative publication dates (`dcterms.date.created`, `displayDate`) and update metadata (`dcterms.date.modified`, `modified`). Article body contains 6,831 chars of substantive content.

---

## Gate 4 — Configuration Applicability

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (pattern category match) |
| Pattern category | `financial_regulator` — matches existing `PATTERN_TYPE_METADATA` category |
| Existing analogs | US SEC (`146aa3b` — DEVELOPMENT_VERIFIED), US CFTC (`b4fabe9` — PROSPECTIVE_VALIDATED), SFC Hong Kong (this batch), JFSA Japan (this batch), BaFin (this batch), AMF France (this batch) |
| Result | **PASS** — configuration category appears applicable; Gate 5 required to determine actual onboarding effort |

### Pattern category notes

ASIC's content structure (media releases with titles, Dublin Core date metadata, and article body text) matches the `financial_regulator` class pattern. The provenance pattern (`dcterms.date.created` meta tag — Dublin Core metadata) falls under `PATTERN_TYPE_METADATA` in the pipeline's pattern taxonomy.

**Gate 4 answers only**: "Does a category/configuration abstraction exist that can match this source?" — Answer: YES (`PATTERN_TYPE_METADATA`, with `financial_regulator` class analogs in US SEC, US CFTC, SFC Hong Kong, JFSA Japan, BaFin, and AMF France).

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

---

## Intelligence Quality Assessment

| Field | Value |
|-------|-------|
| Quality status | N/A — Gate 5 not attempted |

---

## Initial Routing

| Field | Value |
|-------|-------|
| Earliest blocking gate | none (Gates 1-4 all PASS) |
| Initial routing | **QUALIFICATION_READY** |
| Routing qualifier | None — all authoritative publication date sources agree |
| Routing rationale | All Gates 1-4 PASS; provenance unambiguous (`dcterms.date.created` = `displayDate`, both August 11, 2026; `dcterms.date.modified` and `modified` correctly classified as update metadata); configuration category (`PATTERN_TYPE_METADATA`, `financial_regulator` class) appears applicable with analogs in US SEC, US CFTC, SFC Hong Kong, JFSA Japan, BaFin, and AMF France |
| Confidence | MEDIUM |
| Confidence basis | HIGH = direct evidence from documented Gate 5 test; MEDIUM = screening + partial or retrospective evidence; LOW = inference or unresolved condition. This record is MEDIUM because it is based on pre-screening (Gate 1-4 only) without Gate 5 confirmation. |

---

## Evidence

| Evidence | Source | What it proves |
|----------|--------|----------------|
| HTTP 200 on newsroom | `https://www.asic.gov.au/newsroom` (probed 2026-08-15) | Gate 1 PASS — newsroom accessible (16 KB) |
| HTTP 200 on media releases listing | `https://www.asic.gov.au/newsroom/media-releases` (probed 2026-08-15) | Gate 1 PASS — media releases listing accessible |
| HTTP 200 on sample media release | `https://www.asic.gov.au/about-asic/news-centre/find-a-media-release/2026-releases/26-189mr-consumers-left-in-the-dark-about-rising-car-insurance-premiums-asic-warns` (probed 2026-08-15) | Gate 3 PASS — static HTML contains full article content (24 KB) |
| `dcterms.date.created` meta tag | `<meta name="dcterms.date.created" content="2026-08-11">` on sample article | Gate 2 PASS — Dublin Core authoritative publication date (ISO 8601) |
| `displayDate` meta tag | `<meta name="displayDate" content="11 August 2026">` on sample article | Gate 2 PASS — display version of publication date (agrees with `dcterms.date.created`) |
| Update metadata (NOT publication evidence) | `<meta name="dcterms.date.modified" content="2026-08-11">` and `<meta name="modified" content="11/08/2026 08:54 PM">` | Recorded as update metadata only; NOT counted as publication date per Batch 3 rule |
| Article body content (6,831 chars) | Static HTML main content area | Gate 3 PASS — substantive content in static HTML |
| Media release numbering | `26-189MR` (year-sequence format) in URL and title | Structured media release identification |
| Pattern category match | US SEC (`146aa3b`), US CFTC (`b4fabe9`), SFC Hong Kong, JFSA Japan, BaFin, AMF France (this batch) | Gate 4 PASS — direct analogs exist in same class and same provenance pattern |

### What this evidence does NOT prove

- Does NOT prove that a Gate 5 first-attempt run will succeed (sample too small, per Governance Rule 10)
- Does NOT prove that the pipeline's configurable extractor will handle ASIC without source-specific code (Gate 4 confirms pattern category applicability only; actual onboarding effort is a Gate 5 question)
- Does NOT prove coverage breadth (only one media release was sampled; ASIC has multiple content types — media releases, reports, bannings and alerts, speeches, ASIC views — that may require different pattern categories)
- Does NOT resolve whether all content types share the same Dublin Core date metadata structure (only media releases were sampled)
- Does NOT authorize onboarding, configuration creation, or Gate 5 attempt

---

## Priority Retained

| Field | Value |
|-------|-------|
| Top 20 rank | 20 (unchanged) |
| Queue state transition | DISCOVERY_ONLY → **QUALIFICATION_READY** |
| Priority retained | Yes — pre-screening result does not demote the source's queue priority. ASIC remains Top 20 rank #20. |

---

## Root-Cause Review

| Field | Value |
|-------|-------|
| Triggered? | No — not triggered because Gate 5 was not attempted |

---

## Appendix: Probing Log

```text
2026-08-15 — Pre-screening probe of ASIC Australia

Probe 1:  https://asic.gov.au/                                → 301 redirect to https://www.asic.gov.au/
Probe 2:  https://www.asic.gov.au/                            → 200 OK (87 KB, English homepage, AWS ELB)
Probe 3:  https://www.asic.gov.au/newsroom                    → 200 OK (16 KB, newsroom landing page)
Probe 4:  https://www.asic.gov.au/newsroom/media-releases      → 200 OK (14 KB, media releases listing)
Probe 5:  https://asic.gov.au/rss                            → 404
Probe 6:  https://asic.gov.au/feed.xml                       → 404
Probe 7:  https://asic.gov.au/atom.xml                       → 404
Probe 8:  https://asic.gov.au/rss-media-releases.xml         → 404
Probe 9:  https://www.asic.gov.au/about-asic/news-centre/find-a-media-release/2026-releases/26-189mr-consumers-left-in-the-dark-about-rising-car-insurance-premiums-asic-warns
                                                                       → 200 OK (24 KB, sample media release "26-189MR Consumers left in the dark about rising car insurance premiums")

Provenance detected (sample media release):
- dcterms.date.created: <meta name="dcterms.date.created" content="2026-08-11"> (authoritative publication date, ISO 8601)
- displayDate: <meta name="displayDate" content="11 August 2026"> (display version, agrees with dcterms.date.created)
- dcterms.date.modified: <meta name="dcterms.date.modified" content="2026-08-11"> (update metadata — NOT publication evidence)
- modified: <meta name="modified" content="11/08/2026 08:54 PM"> (update metadata — NOT publication evidence)
- Both authoritative publication date sources agree on August 11, 2026

Date-source agreement:
  dcterms.date.created:  2026-08-11        → August 11, 2026
  displayDate:           11 August 2026     → August 11, 2026
  Both authoritative publication sources agree
  dcterms.date.modified (2026-08-11) and modified (11/08/2026 08:54 PM) recorded as update metadata only

Article body: 6,831 chars of substantive content (static HTML, no JS rendering)
Media release numbering: 26-189MR (year-sequence format)
```

---

## Pre-screening Verdict

| Gate | Result | Notes |
|------|--------|-------|
| Gate 1 (Access) | PASS | HTML index path; HTTP 200; AWS ELB; apex domain redirects to www; no RSS feed, but newsroom and media releases accessible |
| Gate 2 (Provenance) | PASS | Two authoritative publication date sources (`dcterms.date.created` ISO 8601 + `displayDate` English format) — both agree on August 11, 2026; `dcterms.date.modified` and `modified` correctly classified as update metadata only |
| Gate 3 (Content) | PASS | Static HTML; full title + Dublin Core date metadata + 6,831 chars article body + media release numbering |
| Gate 4 (Configuration applicability) | PASS | Configuration category (`PATTERN_TYPE_METADATA`, `financial_regulator` class) appears applicable; analogs in US SEC, US CFTC, SFC Hong Kong, JFSA Japan, BaFin, AMF France. Gate 5 required to determine actual onboarding effort |
| Gate 5 (First-attempt validation) | NOT ATTEMPTED | Per pre-screening scope |
| **Initial routing** | **QUALIFICATION_READY** | All Gates 1-4 PASS; no unresolved items |
| **Routing qualifier** | None | All authoritative publication date sources agree |
| **Confidence** | MEDIUM | Based on pre-screening evidence; not Gate 5 confirmed |
| **Priority retained** | Yes | Top 20 rank #20 unchanged |

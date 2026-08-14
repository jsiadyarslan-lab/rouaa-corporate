# Source Qualification Record — US Bureau of Labor Statistics (Pre-screening)

**Source**: US Bureau of Labor Statistics (BLS)
**Top 20 rank**: 2
**Pre-screening date**: 2026-08-15
**Branch**: `top20-prescreening`
**Queue baseline**: Global Qualification Queue v1 (`92b6c4f` — FROZEN)
**Template**: Source Qualification Report Template v1 (`f5caf57`)
**Type**: Pre-screening record — documentation only. NOT onboarding, NOT Gate 5, NOT configuration, NOT Contract, NOT website change.

---

## Source Information

| Field | Value |
|-------|-------|
| Source name | US Bureau of Labor Statistics (BLS) |
| Official URL | `https://www.bls.gov/` |
| Feed URL | N/A — source inaccessible (see Gate 1) |
| Source class | statistical_authority |
| Country | US |
| Region | N. America |
| Tier | T1 |
| Queue priority (Top 20) | 2 — T1 source; high institutional importance; qualification not yet performed |
| Critical workflows | Employment situation, CPI, PPI, wage data, labor market statistics |

---

## Gate 1 — Access Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (automated HTTP probing) |
| Access path | blocked (all paths return HTTP 403) |
| Primary URL tested | `https://www.bls.gov/` |
| Fetch method | N/A — source blocked |
| HTTP status | 403 Forbidden |
| Server | AkamaiGHost |
| Response | Akamai "Access Denied" page (HTML, 363 bytes) |
| Result | **FAIL** — confirmed source-level block |

### Probing notes

Probed paths — all return HTTP 403 from AkamaiGHost:

| URL | HTTP | Response |
|-----|------|----------|
| `https://www.bls.gov/` | 403 | Akamai Access Denied (363 B) |
| `https://www.bls.gov/rss/` | 403 | Akamai Access Denied (371 B) |
| `https://www.bls.gov/feed.xml` | 403 | Akamai Access Denied (375 B) |
| `https://www.bls.gov/atom.xml` | 403 | Akamai Access Denied (375 B) |
| `https://www.bls.gov/news/rss/` | 403 | Akamai Access Denied (380 B) |
| `https://www.bls.gov/news.xml` | 403 | Akamai Access Denied (375 B) |
| `https://www.bls.gov/schedule/news_releases/` | 403 | Akamai Access Denied (398 B) |
| `https://www.bls.gov/news_release/` | 403 | Akamai Access Denied (384 B) |
| `https://data.bls.gov/` | 403 | Akamai Access Denied (364 B) |
| `https://download.bls.gov/` | 403 | Akamai Access Denied (368 B) |
| `https://api.bls.gov/publicAPI/v2/timeseries/data/` | 403 | Akamai Access Denied (410 B) |

Response headers confirm AkamaiGHost as the server. The response body is an Akamai "Access Denied" page with a Reference ID (`#18.d1142017.1786727730.936140c`) and an `errors.edgesuite.net` link — this is an authoritative server-level denial, not a path-level failure.

Additional header probes with `Accept`, `Accept-Language`, `Accept-Encoding`, and `Connection` headers did not change the result — Akamai blocks the request regardless of header completeness.

**Comparison to known cases:**
- IMF (`b4fabe9` — SCREENING_ONLY, Gate 1 FAIL): Akamai 403 — same root cause, same blocker
- Reserve Bank of Australia (Phase B — SCREENING_ONLY, Gate 1 FAIL): Akamai 403 — same root cause
- OECD (`92b6c4f` — KNOWN_BLOCKED): HTTP 403 from origin server — same evidence classification

**Gate 1 conclusion**: BLS is confirmed as a source-level block. HTTP 403 from AkamaiGHost is an authoritative server-level denial, not a path-level failure. This matches the evidence classification established in Queue v1 semantic reconciliation (`4d3b5bc`): HTTP 403 from origin/Akamai = confirmed source-level block → KNOWN_BLOCKED classification.

---

## Gate 2 — Provenance Qualification

| Field | Value |
|-------|-------|
| Result | **NOT ATTEMPTED** — Gate 1 FAIL (source inaccessible) |

Gate 2 cannot be assessed because the source is blocked at Gate 1. No HTML or feed content can be retrieved to inspect provenance metadata.

---

## Gate 3 — Content Qualification

| Field | Value |
|-------|-------|
| Result | **NOT ATTEMPTED** — Gate 1 FAIL (source inaccessible) |

Gate 3 cannot be assessed because the source is blocked at Gate 1. No sample article can be retrieved to verify content substance.

---

## Gate 4 — Configuration Applicability

| Field | Value |
|-------|-------|
| Result | **NOT ASSESSED** — Gate 1 FAIL (source inaccessible) |

Gate 4 cannot be assessed because no content was retrieved to compare against existing pattern categories. The `statistical_authority` class is known (BEA `c8af140` is the proven analog), but applicability to BLS specifically cannot be confirmed without content access.

---

## Gate 5 — First-Attempt Validation

| Field | Value |
|-------|-------|
| Result | **NOT ATTEMPTED** |

Per pre-screening scope: Gate 5 is NOT performed during pre-screening.

---

## Intelligence Quality Assessment

| Field | Value |
|-------|-------|
| Quality status | N/A — Gate 5 not attempted |

---

## Initial Routing

| Field | Value |
|-------|-------|
| Earliest blocking gate | Gate 1 (confirmed source-level block — HTTP 403 Akamai) |
| Initial routing | **KNOWN_BLOCKED** |
| Routing rationale | Gate 1 FAIL with confirmed source-level block (HTTP 403 from AkamaiGHost across all paths and subdomains). This matches the evidence classification established in Queue v1 semantic reconciliation: HTTP 403 from origin/Akamai = confirmed source-level block → KNOWN_BLOCKED. Same root cause as IMF and OECD. |
| Confidence | HIGH |
| Confidence basis | HTTP 403 from AkamaiGHost is direct, repeatable evidence confirmed across 11 probe paths and 3 subdomains (`www.bls.gov`, `data.bls.gov`, `download.bls.gov`, `api.bls.gov`). The block is authoritative and consistent — not a transient or path-level failure. |

---

## Evidence

| Evidence | Source | What it proves |
|----------|--------|----------------|
| HTTP 403 on `https://www.bls.gov/` | Probed 2026-08-15 | Gate 1 FAIL — source-level block |
| HTTP 403 on `https://www.bls.gov/rss/`, `/feed.xml`, `/atom.xml`, `/news/rss/`, `/news.xml` | Probed 2026-08-15 | Gate 1 FAIL — feed paths also blocked |
| HTTP 403 on `https://www.bls.gov/schedule/news_releases/`, `/news_release/` | Probed 2026-08-15 | Gate 1 FAIL — news listing paths also blocked |
| HTTP 403 on `https://data.bls.gov/`, `https://download.bls.gov/`, `https://api.bls.gov/publicAPI/v2/timeseries/data/` | Probed 2026-08-15 | Gate 1 FAIL — subdomains also blocked (block is at the source level, not path level) |
| Server header: `AkamaiGHost` | HTTP response headers | Confirms Akamai CDN/firewall is the blocker — same infrastructure as IMF (`b4fabe9`) |
| Response body: Akamai "Access Denied" page with Reference ID and `errors.edgesuite.net` link | HTTP response body | Confirms authoritative Akamai denial, not a path-level 404 or timeout |
| Header variation probe (Accept, Accept-Language, Accept-Encoding, Connection) | Additional probing with full browser headers | Block persists regardless of header completeness — confirms it is not a header-quality issue |

### What this evidence does NOT prove

- Does NOT prove that BLS will remain blocked indefinitely (Akamai policies can change; access may be granted via different infrastructure or user-agent)
- Does NOT prove that no alternative access path exists (only standard paths were probed; BLS may offer access via email subscription, FTP, or partner APIs not tested)
- Does NOT authorize onboarding, configuration creation, or Gate 5 attempt
- Does NOT demote BLS from Top 20 rank #2 (priority is independent of access feasibility per Section 5 of the Queue)

---

## Priority Retained

| Field | Value |
|-------|-------|
| Top 20 rank | 2 (unchanged) |
| Queue state transition | DISCOVERY_ONLY → **KNOWN_BLOCKED** |
| Priority retained | Yes — pre-screening result does not demote the source's queue priority. BLS remains Top 20 rank #2. The block is a technical blocker, not a strategic demotion. If the block is resolved (e.g., via infrastructure investment, partner access, or Akamai policy change), BLS returns to the executable queue at its original priority. |

### Queue state update

Per Section 15 of Global Qualification Queue v1 (`92b6c4f`) and the semantic reconciliation principle established in `4d3b5bc`, pre-screening may transition a source from DISCOVERY_ONLY to KNOWN_BLOCKED when the evidence confirms a source-level block (HTTP 403 from origin/Akamai). BLS transitions to KNOWN_BLOCKED based on confirmed HTTP 403 from AkamaiGHost across all probed paths and subdomains.

This transition will be reflected in the next queue state update after pre-screening of the Top 20 is complete (or batched at a user-defined checkpoint). The current Queue v1 FROZEN baseline is not modified by individual pre-screening records.

---

## Root-Cause Review

| Field | Value |
|-------|-------|
| Triggered? | No — not triggered because Gate 5 was not attempted. However, the Gate 1 FAIL is documented with root cause: Akamai CDN/firewall blocks all requests regardless of headers or path. |

---

## Qualification Decision

| Field | Value |
|-------|-------|
| Decided by | N/A — pre-screening does not produce a qualification decision |
| Qualification status | PENDING — pre-screening produced a routing classification (KNOWN_BLOCKED), not a qualification decision |
| Review status | NOT REQUIRED at pre-screening stage |
| Confidence | HIGH (per Initial Routing section) |
| Evidence basis | Pre-screening HTTP probing (11 paths, 4 subdomains, header variation) |

---

## Commercial Recommendation

| Field | Value |
|-------|-------|
| Prepared by | N/A — pre-screening does not produce a commercial recommendation |

---

## Engineering Scope

| Field | Value |
|-------|-------|
| Prepared by | N/A — pre-screening does not trigger engineering scope |
| Engineering required | Not yet determined — Gate 1 FAIL means no onboarding is possible until the Akamai block is resolved. Engineering effort to resolve the block (e.g., infrastructure investment, partner access, alternative transport) is a separate question from Gate 5 onboarding effort. |

---

## Appendix: Probing Log

```text
2026-08-15 — Pre-screening probe of US Bureau of Labor Statistics (BLS)

Probe 1:  https://www.bls.gov/                                           → 403 (Akamai Access Denied, 363 B)
Probe 2:  https://www.bls.gov/rss/                                        → 403 (Akamai Access Denied, 371 B)
Probe 3:  https://www.bls.gov/feed.xml                                     → 403 (Akamai Access Denied, 375 B)
Probe 4:  https://www.bls.gov/atom.xml                                     → 403 (Akamai Access Denied, 375 B)
Probe 5:  https://www.bls.gov/news/rss/                                    → 403 (Akamai Access Denied, 380 B)
Probe 6:  https://www.bls.gov/news.xml                                     → 403 (Akamai Access Denied, 375 B)
Probe 7:  https://www.bls.gov/schedule/news_releases/                       → 403 (Akamai Access Denied, 398 B)
Probe 8:  https://www.bls.gov/news_release/                                 → 403 (Akamai Access Denied, 384 B)
Probe 9:  https://data.bls.gov/                                            → 403 (Akamai Access Denied, 364 B)
Probe 10: https://download.bls.gov/                                        → 403 (Akamai Access Denied, 368 B)
Probe 11: https://api.bls.gov/publicAPI/v2/timeseries/data/                → 403 (Akamai Access Denied, 410 B)

Header probe (full browser headers: Accept, Accept-Language, Accept-Encoding, Connection):
  https://www.bls.gov/ → 403 (block persists regardless of header completeness)

Response headers (https://www.bls.gov/):
  HTTP/2 403
  server: AkamaiGHost
  content-type: text/html
  content-length: 363

Response body (https://www.bls.gov/):
  <HTML><HEAD><TITLE>Access Denied</TITLE></HEAD><BODY>
  <H1>Access Denied</H1>
  You don't have permission to access "http://www.bls.gov/" on this server.
  Reference #18.d1142017.1786727730.936140c
  https://errors.edgesuite.net/18.d1142017.1786727730.936140c
  </BODY></HTML>
```

---

## Pre-screening Verdict

| Gate | Result | Notes |
|------|--------|-------|
| Gate 1 (Access) | **FAIL** | HTTP 403 from AkamaiGHost across all 11 paths and 4 subdomains — confirmed source-level block |
| Gate 2 (Provenance) | NOT ATTEMPTED | Gate 1 FAIL — source inaccessible |
| Gate 3 (Content) | NOT ATTEMPTED | Gate 1 FAIL — source inaccessible |
| Gate 4 (Configuration applicability) | NOT ASSESSED | Gate 1 FAIL — no content to compare |
| Gate 5 (First-attempt validation) | NOT ATTEMPTED | Per pre-screening scope |
| **Initial routing** | **KNOWN_BLOCKED** | Confirmed source-level block (HTTP 403 Akamai); same evidence classification as OECD, IMF |
| **Confidence** | HIGH | Direct, repeatable evidence across 11 paths and 4 subdomains |
| **Priority retained** | Yes | Top 20 rank #2 unchanged — block is a technical blocker, not a strategic demotion |

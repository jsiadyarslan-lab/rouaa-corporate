# Source Qualification Record — De Nederlandsche Bank (Pre-screening)

**Source**: De Nederlandsche Bank (DNB)
**Top 20 rank**: 8
**Pre-screening date**: 2026-08-15
**Branch**: `top20-prescreening`
**Queue baseline**: Global Qualification Queue v1 (`92b6c4f` — FROZEN)
**Template**: Source Qualification Report Template v1 (`f5caf57`)
**Type**: Pre-screening record — documentation only. NOT onboarding, NOT Gate 5, NOT configuration, NOT Contract, NOT website change.

---

## Source Information

| Field | Value |
|-------|-------|
| Source name | De Nederlandsche Bank (DNB) |
| Official URL | `https://www.dnb.nl/en/` |
| Feed URL | N/A — source inaccessible (see Gate 1) |
| Source class | central_bank |
| Country | NL |
| Region | Europe |
| Tier | T2 |
| Queue priority (Top 20) | 8 — ECB system member |
| Critical workflows | Press releases, monetary policy, supervisory publications, financial stability reports |

---

## Gate 1 — Access Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (automated HTTP probing) |
| Access path | blocked (all paths return HTTP 403) |
| Primary URL tested | `https://www.dnb.nl/en/` |
| Fetch method | N/A — source blocked |
| HTTP status | 403 Forbidden |
| Server | AkamaiGHost |
| Response | Akamai "Access Denied" page (HTML, 369 bytes) |
| Result | **FAIL** — confirmed source-level block |

### Probing notes

Probed paths — all return HTTP 403 from AkamaiGHost:

| URL | HTTP | Response |
|-----|------|----------|
| `https://www.dnb.nl/` | 403 | Akamai Access Denied (362 B) |
| `https://www.dnb.nl/en/` | 403 | Akamai Access Denied (369 B) |
| `https://www.dnb.nl/en/news/` | 403 | Akamai Access Denied (378 B) |
| `https://www.dnb.nl/en/news-and-publications/` | 403 | Akamai Access Denied (403 B) |
| `https://www.dnb.nl/rss` | 403 | Akamai Access Denied (365 B) |
| `https://www.dnb.nl/feed.xml` | 403 | Akamai Access Denied (374 B) |
| `https://www.dnb.nl/atom.xml` | 403 | Akamai Access Denied (374 B) |
| `https://www.dnb.nl/en/rss` | 403 | Akamai Access Denied (372 B) |
| `https://www.dnb.nl/en/feed.xml` | 403 | Akamai Access Denied (381 B) |

Response headers confirm AkamaiGHost as the server. The response body is an Akamai "Access Denied" page — this is an authoritative server-level denial, not a path-level failure.

**Comparison to known cases:**
- BLS (Batch 2 — KNOWN_BLOCKED): Akamai 403 with `server: AkamaiGHost` header exposed — same root cause
- Banque de France (Batch 2 — KNOWN_BLOCKED): HTTP 403 with Akamai signature (`errors.edgesuite.net`) — same root cause
- IMF (`b4fabe9` — SCREENING_ONLY, Gate 1 FAIL): Akamai 403 — same root cause
- OECD (`92b6c4f` — KNOWN_BLOCKED): HTTP 403 from origin server — same evidence classification

**Gate 1 conclusion**: DNB is confirmed as a source-level block. HTTP 403 from AkamaiGHost is an authoritative server-level denial, not a path-level failure. This matches the evidence classification established in Queue v1 semantic reconciliation (`4d3b5bc`): HTTP 403 from origin/Akamai = confirmed source-level block → KNOWN_BLOCKED classification.

---

## Gate 2 — Provenance Qualification

| Field | Value |
|-------|-------|
| Result | **NOT ATTEMPTED** — Gate 1 FAIL (source inaccessible) |

---

## Gate 3 — Content Qualification

| Field | Value |
|-------|-------|
| Result | **NOT ATTEMPTED** — Gate 1 FAIL (source inaccessible) |

---

## Gate 4 — Configuration Applicability

| Field | Value |
|-------|-------|
| Result | **NOT ASSESSED** — Gate 1 FAIL (no content to compare) |

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
| Earliest blocking gate | Gate 1 (confirmed source-level block — HTTP 403 Akamai) |
| Initial routing | **KNOWN_BLOCKED** |
| Routing rationale | Gate 1 FAIL with confirmed source-level block (HTTP 403 from AkamaiGHost across all paths). Same root cause as BLS (Batch 2), Banque de France (Batch 2), IMF, OECD. |
| Confidence | HIGH |
| Confidence basis | HTTP 403 from AkamaiGHost is direct, repeatable evidence confirmed across 9 probe paths. The block is authoritative and consistent — not a transient or path-level failure. |

---

## Evidence

| Evidence | Source | What it proves |
|----------|--------|----------------|
| HTTP 403 on `https://www.dnb.nl/en/` | Probed 2026-08-15 | Gate 1 FAIL — source-level block |
| HTTP 403 on `/rss`, `/feed.xml`, `/atom.xml`, `/en/rss`, `/en/feed.xml` | Probed 2026-08-15 | Gate 1 FAIL — feed paths also blocked |
| HTTP 403 on `/en/news/`, `/en/news-and-publications/` | Probed 2026-08-15 | Gate 1 FAIL — news listing paths also blocked |
| Server header: `AkamaiGHost` | HTTP response headers | Confirms Akamai CDN/firewall is the blocker — same infrastructure as BLS (Batch 2), IMF (`b4fabe9`) |

### What this evidence does NOT prove

- Does NOT prove that DNB will remain blocked indefinitely (Akamai policies can change; access may be granted via different infrastructure or user-agent)
- Does NOT prove that no alternative access path exists (only standard paths were probed)
- Does NOT authorize onboarding, configuration creation, or Gate 5 attempt
- Does NOT demote DNB from Top 20 rank #8 (priority is independent of access feasibility per Section 5 of the Queue)

---

## Priority Retained

| Field | Value |
|-------|-------|
| Top 20 rank | 8 (unchanged) |
| Queue state transition | DISCOVERY_ONLY → **KNOWN_BLOCKED** |
| Priority retained | Yes — pre-screening result does not demote the source's queue priority. DNB remains Top 20 rank #8. |

### Queue state update

Per Section 15 of Global Qualification Queue v1 (`92b6c4f`) and the semantic reconciliation principle established in `4d3b5bc`, pre-screening may transition a source from DISCOVERY_ONLY to KNOWN_BLOCKED when the evidence confirms a source-level block (HTTP 403 from origin/Akamai). DNB transitions to KNOWN_BLOCKED based on confirmed HTTP 403 from AkamaiGHost across all probed paths.

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
| Evidence basis | Pre-screening HTTP probing (9 paths, server header confirmation) |

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
| Engineering required | Not yet determined — Gate 1 FAIL means no onboarding is possible until the Akamai block is resolved. |

---

## Appendix: Probing Log

```text
2026-08-15 — Pre-screening probe of De Nederlandsche Bank (DNB)

Probe 1:  https://www.dnb.nl/                                → 403 (Akamai Access Denied, 362 B)
Probe 2:  https://www.dnb.nl/en/                            → 403 (Akamai Access Denied, 369 B)
Probe 3:  https://www.dnb.nl/en/news/                       → 403 (Akamai Access Denied, 378 B)
Probe 4:  https://www.dnb.nl/en/news-and-publications/      → 403 (Akamai Access Denied, 403 B)
Probe 5:  https://www.dnb.nl/rss                            → 403 (Akamai Access Denied, 365 B)
Probe 6:  https://www.dnb.nl/feed.xml                       → 403 (Akamai Access Denied, 374 B)
Probe 7:  https://www.dnb.nl/atom.xml                       → 403 (Akamai Access Denied, 374 B)
Probe 8:  https://www.dnb.nl/en/rss                          → 403 (Akamai Access Denied, 372 B)
Probe 9:  https://www.dnb.nl/en/feed.xml                     → 403 (Akamai Access Denied, 381 B)

Response headers (https://www.dnb.nl/en/):
  HTTP/2 403
  server: AkamaiGHost
  content-type: text/html
  content-length: 369
```

---

## Pre-screening Verdict

| Gate | Result | Notes |
|------|--------|-------|
| Gate 1 (Access) | **FAIL** | HTTP 403 from AkamaiGHost across all 9 paths — confirmed source-level block |
| Gate 2 (Provenance) | NOT ATTEMPTED | Gate 1 FAIL — source inaccessible |
| Gate 3 (Content) | NOT ATTEMPTED | Gate 1 FAIL — source inaccessible |
| Gate 4 (Configuration applicability) | NOT ASSESSED | Gate 1 FAIL — no content to compare |
| Gate 5 (First-attempt validation) | NOT ATTEMPTED | Per pre-screening scope |
| **Initial routing** | **KNOWN_BLOCKED** | Confirmed source-level block (HTTP 403 Akamai); same evidence classification as BLS, Banque de France, IMF, OECD |
| **Confidence** | HIGH | Direct, repeatable evidence across 9 paths |
| **Priority retained** | Yes | Top 20 rank #8 unchanged — block is a technical blocker, not a strategic demotion |

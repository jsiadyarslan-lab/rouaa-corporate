# Source Qualification Record — Bank of Mexico (Pre-screening)

**Source**: Bank of Mexico (Banco de México / Banxico)
**Top 20 rank**: 13
**Pre-screening date**: 2026-08-15
**Branch**: `top20-prescreening`
**Queue baseline**: Global Qualification Queue v1 (`92b6c4f` — FROZEN)
**Template**: Source Qualification Report Template v1 (`f5caf57`)
**Type**: Pre-screening record — documentation only. NOT onboarding, NOT Gate 5, NOT configuration, NOT Contract, NOT website change.

---

## Source Information

| Field | Value |
|-------|-------|
| Source name | Bank of Mexico (Banco de México / Banxico) |
| Official URL | `https://www.banxico.org.mx/` |
| Feed URL | No RSS/Atom feed discovered; press release paths redirect to `anterior.banxico.org.mx` which returns HTTP 403 |
| Source class | central_bank |
| Country | MX |
| Region | LATAM |
| Tier | T2 |
| Queue priority (Top 20) | 13 — Major LATAM economy; USMCA partner; fills Latin America gap |
| Critical workflows | Monetary policy decisions, press releases, statistics, exchange rates |

---

## Gate 1 — Access Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (automated HTTP probing) |
| Access path | Mixed — main domain accessible (HTTP 200) but press release paths redirect to blocked subdomain (HTTP 403) |
| Primary URL tested | `https://www.banxico.org.mx/` (main domain) and `https://www.banxico.org.mx/indexEN.html` (English homepage) |
| Fetch method | urllib-equivalent (curl with browser User-Agent) |
| HTTP status | 200 OK (main domain) / 403 Forbidden (anterior subdomain) |
| Response size | 27,463 bytes (Spanish homepage) / 21,475 bytes (English homepage) |
| Result | **PASS** (main domain access) / **UNRESOLVED** (press release content location) |

### Probing notes

- `https://www.banxico.org.mx/` returns HTTP 200 (27 KB, Spanish homepage) — main domain is accessible
- `https://www.banxico.org.mx/indexEN.html` returns HTTP 200 (21 KB, English homepage) — English site is accessible
- Press release paths (`/press/`, `/prensa/`, `/contenidos/prensa.html`, `/dyn/portales-de-usuarios/sala-prensa/`, `/secciones/sala-prensa/`) all return HTTP 404 with redirect to `https://anterior.banxico.org.mx/...`
- `https://anterior.banxico.org.mx/` returns HTTP 403 Forbidden (1,233 bytes) — the "anterior" (legacy) subdomain is blocked
- Common RSS/Atom paths on main domain (`/rss`, `/feed.xml`, `/atom.xml`) return HTTP 404 with redirect to `anterior.banxico.org.mx`
- The main domain homepage is a landing page with links to the SIE (Sistema de Información Económica) statistical system at `/SieInternet/` — no press release links on the static HTML
- `https://www.banxico.org.mx/SieInternet/` returns HTTP 200 (40 KB) — the SIE statistical system is accessible
- `https://www.banxico.org.mx/SieInternet/consultarDirectorioInternetAction.do?sector=18&accion=consultarCuadro&idCuadro=CF101&locale=en` returns HTTP 200 (258 KB) — SIE data queries are accessible

### Access path analysis

Bank of Mexico has a split architecture:
1. **Main domain** (`www.banxico.org.mx`): landing page + SIE statistical system — accessible (HTTP 200)
2. **Legacy subdomain** (`anterior.banxico.org.mx`): press releases, news, content — blocked (HTTP 403)

The main domain does NOT contain press release content in static HTML. All press release paths redirect to the legacy subdomain, which returns HTTP 403. This creates an ambiguous access situation:
- Gate 1 PASS at the main domain level (source is reachable)
- Gate 1 FAIL at the press release content level (legacy subdomain is blocked)

**Comparison to known cases:**
- Banco de España (Batch 3 — SCREENING_ONLY): TCP connection timeout — main domain unreachable
- BCB (this batch — SCREENING_ONLY): main domain accessible but content is JS-rendered
- Banxico (this batch): main domain accessible but press release content is on a blocked legacy subdomain

**Per Batch 3 established rule**: The 403 on `anterior.banxico.org.mx` is a path-level denial, not a source-level block. The main domain `www.banxico.org.mx` is accessible. This classifies as SCREENING_ONLY (unresolved access path for press release content) — not KNOWN_BLOCKED (source is not fully blocked).

**Gate 1 conclusion**: Main domain is accessible (HTTP 200), but press release content paths redirect to a blocked legacy subdomain (HTTP 403). This is an unresolved access path for press release content — the source is reachable but the specific content type (press releases) cannot be accessed. Per the established rule, this classifies as SCREENING_ONLY (unresolved access path).

---

## Gate 2 — Provenance Qualification

| Field | Value |
|-------|-------|
| Result | **NOT ATTEMPTED** — press release content inaccessible (legacy subdomain blocked) |

Gate 2 cannot be assessed because press release content cannot be retrieved. The main domain homepage and SIE statistical system do not contain press release publication dates.

---

## Gate 3 — Content Qualification

| Field | Value |
|-------|-------|
| Result | **NOT ATTEMPTED** — press release content inaccessible |

Gate 3 cannot be assessed because press release content cannot be retrieved. The main domain homepage is a landing page without article content; the SIE system contains statistical data tables, not press releases.

---

## Gate 4 — Configuration Applicability

| Field | Value |
|-------|-------|
| Result | **NOT ASSESSED** — no press release content to compare |

Gate 4 cannot be assessed because no press release content was retrieved. The `central_bank` class is known (SNB, Bundesbank, RBI are proven analogs), but applicability to Banxico specifically cannot be confirmed without content access.

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
| Earliest blocking gate | Gate 1 (press release content path — legacy subdomain returns HTTP 403) |
| Initial routing | **SCREENING_ONLY** (unresolved access path for press release content) |
| Routing rationale | Main domain is accessible (HTTP 200), but press release content paths redirect to a blocked legacy subdomain (`anterior.banxico.org.mx` returns HTTP 403). This is a path-level denial, not a source-level block — the main domain `www.banxico.org.mx` is accessible. Per the Batch 3 established rule (matching the Statistics Canada and Banco de España precedents), path-level access issues classify as SCREENING_ONLY, not KNOWN_BLOCKED. The source remains in the executable queue for future investigation (alternative press release paths, API endpoints, or the SIE statistical system may provide content access). |
| Confidence | MEDIUM |
| Confidence basis | HIGH = direct evidence from documented Gate 5 test or confirmed source-level block; MEDIUM = screening + partial or retrospective evidence; LOW = inference or unresolved condition. This record is MEDIUM because the main domain access is direct evidence, but the press release content access is unresolved — the 403 on the legacy subdomain is a path-level denial that does not confirm source-level blocking. |

---

## Evidence

| Evidence | Source | What it proves |
|----------|--------|----------------|
| HTTP 200 on main domain | `https://www.banxico.org.mx/` (probed 2026-08-15) | Gate 1 PASS (main domain) — source is reachable |
| HTTP 200 on English homepage | `https://www.banxico.org.mx/indexEN.html` (probed 2026-08-15) | Gate 1 PASS — English site accessible |
| HTTP 404 with redirect to anterior on press paths | `/press/`, `/prensa/`, `/contenidos/prensa.html`, `/dyn/portales-de-usuarios/sala-prensa/` (probed 2026-08-15) | Press release paths redirect to legacy subdomain |
| HTTP 403 on anterior subdomain | `https://anterior.banxico.org.mx/` (probed 2026-08-15) | Legacy subdomain is blocked — path-level denial, not source-level |
| HTTP 200 on SIE statistical system | `https://www.banxico.org.mx/SieInternet/` (probed 2026-08-15) | SIE data system accessible (statistical data, not press releases) |
| HTTP 200 on SIE data query | `https://www.banxico.org.mx/SieInternet/consultarDirectorioInternetAction.do?sector=18&...&locale=en` (probed 2026-08-15) | SIE data queries accessible (258 KB, statistical tables) |

### What this evidence does NOT prove

- Does NOT prove that Banxico is blocking access at the source level (the main domain is accessible)
- Does NOT prove that no press release content is accessible (only standard paths were probed; Banxico may offer press releases via API, alternative paths, or the SIE system)
- Does NOT prove that the legacy subdomain block is permanent (the 403 may be a firewall rule, geographic restriction, or temporary issue)
- Does NOT authorize onboarding, configuration creation, or Gate 5 attempt
- Does NOT demote Banxico from Top 20 rank #13 (priority is independent of access feasibility per Section 5 of the Queue)

---

## Priority Retained

| Field | Value |
|-------|-------|
| Top 20 rank | 13 (unchanged) |
| Queue state transition | DISCOVERY_ONLY → **SCREENING_ONLY** (unresolved access path for press release content) |
| Priority retained | Yes — pre-screening result does not demote the source's queue priority. Banxico remains Top 20 rank #13. |

### Queue state update

Per Section 15 of Global Qualification Queue v1 (`92b6c4f`) and the semantic reconciliation principle established in `4d3b5bc`, pre-screening may transition a source from DISCOVERY_ONLY to SCREENING_ONLY when the evidence shows prior probing but unresolved access. Banxico transitions from DISCOVERY_ONLY → SCREENING_ONLY because this pre-screening constitutes prior Gate 1 evidence (main domain accessible, but press release content paths redirect to blocked legacy subdomain).

This transition will be reflected in the next queue state update after pre-screening of the Top 20 is complete (or batched at a user-defined checkpoint). The current Queue v1 FROZEN baseline is not modified by individual pre-screening records.

---

## Root-Cause Review

| Field | Value |
|-------|-------|
| Triggered? | No — not triggered because Gate 5 was not attempted. However, the Gate 1 access issue is documented with root cause: Banxico's press release content is hosted on a legacy subdomain (`anterior.banxico.org.mx`) that returns HTTP 403. The main domain (`www.banxico.org.mx`) is a landing page + SIE statistical system without press release content. This split architecture creates an unresolved access path for press release content. |

---

## Appendix: Probing Log

```text
2026-08-15 — Pre-screening probe of Bank of Mexico (Banxico)

Probe 1:  https://www.banxico.org.mx/                                → 200 OK (27 KB, Spanish homepage)
Probe 2:  https://www.banxico.org.mx/indexEN.html                  → 200 OK (21 KB, English homepage)
Probe 3:  https://www.banxico.org.mx/press/                         → 404 (redirects to anterior.banxico.org.mx/press/)
Probe 4:  https://www.banxico.org.mx/prensa/                        → 404 (redirects to anterior.banxico.org.mx/prensa/)
Probe 5:  https://www.banxico.org.mx/contenidos/prensa.html         → 404 (redirects to anterior.banxico.org.mx)
Probe 6:  https://www.banxico.org.mx/dyn/portales-de-usuarios/sala-prensa/ → 404 (redirects to anterior.banxico.org.mx)
Probe 7:  https://www.banxico.org.mx/rss                            → 404 (redirects to anterior.banxico.org.mx/rss)
Probe 8:  https://www.banxico.org.mx/feed.xml                       → 404 (redirects to anterior.banxico.org.mx/feed.xml)
Probe 9:  https://www.banxico.org.mx/atom.xml                       → 404 (redirects to anterior.banxico.org.mx/atom.xml)
Probe 10: https://anterior.banxico.org.mx/                        → 403 Forbidden (1,233 bytes — legacy subdomain blocked)
Probe 11: https://www.banxico.org.mx/SieInternet/                  → 200 OK (40 KB, SIE statistical system)
Probe 12: https://www.banxico.org.mx/SieInternet/consultarDirectorioInternetAction.do?sector=18&accion=consultarCuadro&idCuadro=CF101&locale=en
                                                                       → 200 OK (258 KB, SIE data query — statistical tables)
Probe 13: https://www.banxico.org.mx/SieInternet/defaultEnglish.do → 200 OK (39 KB, SIE English default)

Access path analysis:
  Main domain (www.banxico.org.mx): HTTP 200 — landing page + SIE statistical system
  Legacy subdomain (anterior.banxico.org.mx): HTTP 403 — press releases, news, content (blocked)
  Split architecture: press release content is on the blocked legacy subdomain
```

---

## Pre-screening Verdict

| Gate | Result | Notes |
|------|--------|-------|
| Gate 1 (Access) | UNRESOLVED | Main domain accessible (HTTP 200) but press release content paths redirect to blocked legacy subdomain (HTTP 403) |
| Gate 2 (Provenance) | NOT ATTEMPTED | Press release content inaccessible |
| Gate 3 (Content) | NOT ATTEMPTED | Press release content inaccessible |
| Gate 4 (Configuration applicability) | NOT ASSESSED | No content to compare |
| Gate 5 (First-attempt validation) | NOT ATTEMPTED | Per pre-screening scope |
| **Initial routing** | **SCREENING_ONLY** | Path-level access issue (legacy subdomain 403); main domain accessible; matches Statistics Canada and Banco de España precedents (unresolved access path) |
| **Confidence** | MEDIUM | Direct evidence of path-level block; does not confirm source-level block |
| **Priority retained** | Yes | Top 20 rank #13 unchanged — unresolved access is a technical blocker, not a strategic demotion |

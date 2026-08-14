# Source Qualification Record — Banco Central do Brasil (Pre-screening)

**Source**: Banco Central do Brasil (BCB)
**Top 20 rank**: 12
**Pre-screening date**: 2026-08-15
**Branch**: `top20-prescreening`
**Queue baseline**: Global Qualification Queue v1 (`92b6c4f` — FROZEN)
**Template**: Source Qualification Report Template v1 (`f5caf57`)
**Type**: Pre-screening record — documentation only. NOT onboarding, NOT Gate 5, NOT configuration, NOT Contract, NOT website change.

---

## Source Information

| Field | Value |
|-------|-------|
| Source name | Banco Central do Brasil (BCB) |
| Official URL | `https://www.bcb.gov.br/` |
| Feed URL | No RSS/Atom feed discovered at standard paths (`/rss`, `/feed.xml`, `/atom.xml`, `/en/rss`, `/en/feed.xml` — all return the Angular SPA shell) |
| Source class | central_bank |
| Country | BR |
| Region | LATAM |
| Tier | T2 |
| Queue priority (Top 20) | 12 — Largest LATAM economy; fills Latin America gap |
| Critical workflows | Press releases, monetary policy (Copom), statistics, exchange rates, financial stability |

---

## Gate 1 — Access Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (automated HTTP probing) |
| Access path | HTML shell (Angular SPA — content is JS-rendered) |
| Primary URL tested | `https://www.bcb.gov.br/en` |
| Fetch method | urllib-equivalent (curl with browser User-Agent) |
| HTTP status | 200 OK |
| Response size | 2,871 bytes (Angular SPA shell — no substantive content in static HTML) |
| Result | **PASS** (access) / **CAUTION** (content is JS-rendered) |

### Probing notes

- `https://www.bcb.gov.br/` returns HTTP 200 (2,871 bytes — Angular SPA shell)
- `https://www.bcb.gov.br/en/` returns HTTP 200 (2,871 bytes — same SPA shell)
- `https://www.bcb.gov.br/en/communications` returns HTTP 200 (2,871 bytes — same SPA shell)
- All paths return the same 2,871-byte Angular SPA shell — the `<app-root></app-root>` element is empty; all content is rendered client-side by JavaScript bundles (`main-C4AX6EHZ.js`, `polyfills-YNRAXNVJ.js`, `scripts-HOKEOIWL.js`)
- The `<noscript>` tag states: "Essa pagina depende do javascript para abrir, favor habilitar o javascript do seu browser!" (This page depends on JavaScript to open — please enable JavaScript in your browser)
- Common RSS/Atom paths (`/rss`, `/feed.xml`, `/atom.xml`, `/en/rss`, `/en/feed.xml`) all return the same SPA shell (HTTP 200, 2,871 bytes) — no RSS feed exists
- `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao='08-14-2026')` returns HTTP 200 with valid JSON (218 bytes) — the Olinda public data API is accessible and returns exchange rate data

### Angular SPA detection

The static HTML contains:
- `<app-root></app-root>` — empty Angular root element
- `<base href="/">` — Angular base href
- JavaScript bundle references: `polyfills-YNRAXNVJ.js`, `scripts-HOKEOIWL.js`, `main-C4AX6EHZ.js`
- `<noscript>` message confirming JavaScript dependency
- No press release content, no article links, no date metadata in static HTML

**Comparison to known cases:**
- UK ONS (Phase B — Gate 3 FAIL, SCREENING_ONLY): JS-rendered, static HTML empty — BCB matches this pattern
- PBoC (Batch 1 — Gate 1 PASS, Gate 3 PASS): static HTML contained full content; BCB does NOT match PBoC's pattern

**Gate 1 conclusion**: Source is accessible at the HTTP level (200 OK), but the content is entirely JavaScript-rendered. The static HTML contains no press release content, no article links, and no date metadata. This is the same pattern as the UK ONS Gate 3 FAIL precedent. However, BCB also has a public data API (Olinda) that returns JSON for exchange rates and other statistical data — press release content was not found via the Olinda API in this pre-screening.

---

## Gate 2 — Provenance Qualification

| Field | Value |
|-------|-------|
| Result | **NOT ASSESSED** — Gate 3 unresolved (JS-rendered content; no publication date visible in static HTML) |

Gate 2 cannot be assessed because the static HTML contains no publication date metadata. The Angular SPA renders content client-side, and pre-screening does not execute JavaScript (per pre-screening methodology — only static HTML is inspected).

**Note**: The Olinda API returns JSON with `dataHoraCotacao` fields for exchange rate data (e.g., `"dataHoraCotacao":"2026-08-14 13:10:22.94166"`), but this is statistical data timestamps, not press release publication dates. Press release content was not found via the Olinda API.

---

## Gate 3 — Content Qualification

| Field | Value |
|-------|-------|
| Assessed by | Pre-screening (static HTML inspection) |
| Content format | JavaScript-rendered (Angular SPA) — static HTML is empty shell |
| Sample URL | `https://www.bcb.gov.br/en/communications` |
| Sample size | 2,871 bytes (SPA shell only) |
| Machine-readable | **NO** — static HTML contains no article content, no titles, no dates, no body text |
| Result | **FAIL** — static HTML is empty; content requires JavaScript execution |

### Content inspection notes

The static HTML of `https://www.bcb.gov.br/en/communications` contains:
- `<title>Banco Central do Brasil</title>` — generic site title, not article-specific
- `<app-root></app-root>` — empty Angular root element
- `<noscript>` message confirming JavaScript dependency
- No `<h1>` or article title
- No publication date metadata
- No article body text
- No article links

All substantive content is rendered client-side by the Angular JavaScript bundles. Pre-screening methodology does not execute JavaScript — only static HTML is inspected (consistent with the UK ONS Gate 3 FAIL precedent).

**Comparison to known cases:**
- UK ONS (Phase B — Gate 3 FAIL): JS-rendered, static HTML empty → BCB matches this pattern
- Danmarks Nationalbank (Batch 3 — Gate 3 PASS): React framework detected but article content was server-rendered in static HTML → BCB does NOT match this pattern

**Gate 3 conclusion**: Content is not accessible in static HTML. The Angular SPA requires JavaScript execution to render content. This matches the UK ONS Gate 3 FAIL precedent. Pre-screening cannot verify content substance without JavaScript execution, which is outside the pre-screening methodology scope.

---

## Gate 4 — Configuration Applicability

| Field | Value |
|-------|-------|
| Result | **NOT ASSESSED** — Gate 3 unresolved (no content to compare) |

Gate 4 cannot be assessed because no content was retrieved in static HTML. The `central_bank` class is known (SNB, Bundesbank, RBI are proven analogs), but applicability to BCB specifically cannot be confirmed without content access.

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
| Earliest blocking gate | Gate 3 (content not accessible in static HTML — JS-rendered SPA) |
| Initial routing | **SCREENING_ONLY** (retained — no queue state transition from DISCOVERY_ONLY) |
| Routing rationale | Gate 3 FAIL: static HTML is an empty Angular SPA shell. Content requires JavaScript execution, which is outside pre-screening methodology scope (matches UK ONS Gate 3 FAIL precedent). BCB was classified as DISCOVERY_ONLY in Queue v1 Section 9; this pre-screening does not promote it to QUALIFICATION_READY because content cannot be verified. However, BCB is NOT classified as KNOWN_BLOCKED because the source IS accessible at Gate 1 (HTTP 200) — the blocker is content rendering, not access. The source remains in the executable queue for future qualification-phase investigation (which may include JavaScript-rendered content extraction via Playwright or similar). |
| Confidence | MEDIUM |
| Confidence basis | HIGH = direct evidence from documented Gate 5 test or confirmed source-level block; MEDIUM = screening + partial or retrospective evidence; LOW = inference or unresolved condition. This record is MEDIUM because the JS-rendering blocker is direct evidence, but does not confirm that the source cannot be qualified — it only confirms that pre-screening methodology cannot verify content. |

---

## Evidence

| Evidence | Source | What it proves |
|----------|--------|----------------|
| HTTP 200 on all paths | `https://www.bcb.gov.br/`, `/en/`, `/en/communications`, `/rss`, `/feed.xml`, `/atom.xml` (all probed 2026-08-15) | Gate 1 PASS (access) — source is reachable, not blocked |
| 2,871-byte response on all paths | All probed URLs return identical SPA shell | Gate 3 FAIL — static HTML is empty; content is JS-rendered |
| `<app-root></app-root>` empty element | Static HTML of `/en/communications` | Angular SPA detected — content rendered client-side |
| `<noscript>` JavaScript dependency message | Static HTML: "Essa pagina depende do javascript para abrir" | Confirms JavaScript is required to render content |
| JavaScript bundle references | `main-C4AX6EHZ.js`, `polyfills-YNRAXNVJ.js`, `scripts-HOKEOIWL.js` | Confirms Angular SPA architecture |
| Olinda API accessible | `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao='08-14-2026')` returns HTTP 200 with JSON (218 bytes) | Gate 1 PASS — public data API is accessible (but does not contain press release content) |

### What this evidence does NOT prove

- Does NOT prove that BCB content is inaccessible (it IS accessible via JavaScript execution, which is outside pre-screening scope)
- Does NOT prove that no RSS feed exists (only standard paths were probed; BCB may offer feeds via non-standard paths or API)
- Does NOT prove that the Olinda API contains press release content (only exchange rate data was tested)
- Does NOT authorize onboarding, configuration creation, or Gate 5 attempt
- Does NOT demote BCB from Top 20 rank #12 (priority is independent of content rendering method per Section 5 of the Queue)

---

## Priority Retained

| Field | Value |
|-------|-------|
| Top 20 rank | 12 (unchanged) |
| Queue state transition | None — BCB remains **DISCOVERY_ONLY** (no transition because pre-screening could not verify content; the source is accessible but content rendering method is incompatible with pre-screening methodology) |
| Priority retained | Yes — pre-screening result does not demote the source's queue priority. BCB remains Top 20 rank #12. The JS-rendering blocker is a methodology limitation, not a source-level block. Future qualification-phase investigation (with JavaScript execution capability) may confirm content access. |

### Queue state update

Per Section 15 of Global Qualification Queue v1 (`92b6c4f`), pre-screening may transition a source from DISCOVERY_ONLY to QUALIFICATION_READY or KNOWN_BLOCKED. BCB does NOT transition to QUALIFICATION_READY because Gate 3 could not be verified (content is JS-rendered). BCB does NOT transition to KNOWN_BLOCKED because Gate 1 PASS (source is accessible). BCB remains in DISCOVERY_ONLY — the pre-screening methodology limitation (no JavaScript execution) prevents promotion, but no source-level issue was found.

This is consistent with the UK ONS precedent (Phase B — SCREENING_ONLY with Gate 3 FAIL). However, UK ONS was already classified as SCREENING_ONLY in Queue v1 Section 7 based on prior Phase B evidence. BCB was DISCOVERY_ONLY in Queue v1 Section 9 and remains DISCOVERY_ONLY after this pre-screening because the blocker is methodology-related (JS rendering), not evidence-related (no prior probing existed for BCB).

**Correction**: BCB should transition to SCREENING_ONLY because this pre-screening constitutes prior Gate 1-3 evidence (Gate 1 PASS, Gate 3 FAIL due to JS rendering). This matches the pattern: sources with any Gate 1-4 screening evidence are classified as SCREENING_ONLY, not DISCOVERY_ONLY. BCB transitions from DISCOVERY_ONLY → SCREENING_ONLY (Gate 3 unresolved — JS-rendered content).

---

## Root-Cause Review

| Field | Value |
|-------|-------|
| Triggered? | No — not triggered because Gate 5 was not attempted. However, the Gate 3 blocker is documented with root cause: BCB website is an Angular SPA that renders all content client-side via JavaScript bundles. Static HTML inspection returns an empty `<app-root>` shell with no article content. |

---

## Appendix: Probing Log

```text
2026-08-15 — Pre-screening probe of Banco Central do Brasil (BCB)

Probe 1:  https://www.bcb.gov.br/                                → 200 OK (2,871 bytes — Angular SPA shell)
Probe 2:  https://www.bcb.gov.br/en/                            → 200 OK (2,871 bytes — same SPA shell)
Probe 3:  https://www.bcb.gov.br/en/communications             → 200 OK (2,871 bytes — same SPA shell)
Probe 4:  https://www.bcb.gov.br/rss                            → 200 OK (2,871 bytes — same SPA shell)
Probe 5:  https://www.bcb.gov.br/feed.xml                       → 200 OK (2,871 bytes — same SPA shell)
Probe 6:  https://www.bcb.gov.br/atom.xml                       → 200 OK (2,871 bytes — same SPA shell)
Probe 7:  https://www.bcb.gov.br/en/rss                          → 200 OK (2,871 bytes — same SPA shell)
Probe 8:  https://www.bcb.gov.br/en/feed.xml                     → 200 OK (2,871 bytes — same SPA shell)
Probe 9:  https://www3.bcb.gov.br/                               → 200 OK (2,871 bytes — same SPA shell)
Probe 10: https://api.bcb.gov.br/                               → 404
Probe 11: https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao='08-14-2026')
                                                                       → 200 OK (218 bytes — JSON with exchange rate data)

Angular SPA detection:
  Static HTML contains:
    - <app-root></app-root> (empty)
    - <base href="/">
    - JavaScript bundles: polyfills-YNRAXNVJ.js, scripts-HOKEOIWL.js, main-C4AX6EHZ.js
    - <noscript>Essa pagina depende do javascript para abrir</noscript>
    - No article content, no titles, no dates, no body text in static HTML

Olinda API (accessible):
  https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao='08-14-2026')
  Returns JSON: {"value":[{"cotacaoCompra":5.22300,"cotacaoVenda":5.22360,"dataHoraCotacao":"2026-08-14 13:10:22.94166"}]}
  (Statistical data API — does not contain press release content)
```

---

## Pre-screening Verdict

| Gate | Result | Notes |
|------|--------|-------|
| Gate 1 (Access) | PASS | HTTP 200 on all paths; source is accessible (not blocked) |
| Gate 2 (Provenance) | NOT ASSESSED | Gate 3 unresolved — no publication date visible in static HTML |
| Gate 3 (Content) | **FAIL** | Static HTML is empty Angular SPA shell; content requires JavaScript execution; matches UK ONS Gate 3 FAIL precedent |
| Gate 4 (Configuration applicability) | NOT ASSESSED | Gate 3 unresolved — no content to compare |
| Gate 5 (First-attempt validation) | NOT ATTEMPTED | Per pre-screening scope |
| **Initial routing** | **SCREENING_ONLY** | Gate 3 FAIL (JS-rendered content); source is accessible but content cannot be verified via static HTML inspection |
| **Confidence** | MEDIUM | Direct evidence of JS-rendering blocker; does not confirm source cannot be qualified (methodology limitation) |
| **Priority retained** | Yes | Top 20 rank #12 unchanged — JS rendering is a methodology limitation, not a source-level issue |

# Source Qualification Record — OCC (Prospective v2)

**Source**: Office of the Comptroller of the Currency (OCC)
**Qualification type**: Prospective v2 — first operational validation of v2 methodology on a new source
**Date**: 2026-08-15
**Branch**: `top20-prescreening`
**Base**: Pre-Screening Methodology v2 (FROZEN — `e48281a`), SQR Template v2 (FROZEN — `a62ad65`)
**Type**: Prospective v2 qualification record — documentation only.

---

## Prediction (frozen before probing)

| Field | Value |
|-------|-------|
| Expected class | `financial_regulator` |
| Expected intelligence candidate | `regulatory_enforcement` |
| Expected semantic representation | `POTENTIALLY COMPATIBLE` (enforcement actions may fit `regulatory_enforcement` event type) |
| Expected outcome | **UNKNOWN** — no assumption on access, provenance, RSS, content-path alignment, configuration compatibility, or Gate 5 success |
| Existing evidence used | BaFin (`282de0f`) proves that `regulatory_enforcement` event type can produce publishable IOs from financial regulator content. This is used ONLY as evidence that the representation exists in the current model — NOT as a baseline that OCC must match. |

---

## Gate 1 — Access Qualification

| Field | Value |
|-------|-------|
| Assessed by | Prospective v2 qualification (automated HTTP probing + Playwright fallback) |
| Access path | TCP connection timeout (both urllib and Playwright) |
| Fetch method | blocked (both urllib and Playwright timed out) |
| Result | **FAIL — UNRESOLVED** |
| Notes | DNS resolves to `199.83.40.54` but TCP connection to port 443 times out (15s urllib, 30s Playwright). Both methods returned connection timeout. No HTTP response was received — the connection could not be established at the TCP layer. |

### Probing log

```text
2026-08-15 — Prospective v2 qualification probe of OCC

Probe 1: https://www.occ.treas.gov/                              → 000 (TCP timeout, 15s)
Probe 2: https://www.occ.treas.gov/news-issuances/news-releases/ → 000 (TCP timeout)
Probe 3: https://www.occ.treas.gov/news-issuances/enforcement-actions/ → 000 (TCP timeout)
Probe 4: https://www.occ.treas.gov/rss                           → 000 (TCP timeout)
Probe 5: https://www.occ.treas.gov/feed.xml                       → 000 (TCP timeout)
Playwright: https://www.occ.treas.gov/                           → Timeout 30000ms exceeded

DNS resolution:
  www.occ.treas.gov → 199.83.40.54 (resolution succeeds)

TCP connection:
  199.83.40.54:443 → timeout (no TCP connection established)

curl error: (28) Connection timed out after 15002 milliseconds
  Failure phase: TCP connection establishment (not TLS, not HTTP)
```

### Analysis

The failure is at the TCP connection establishment phase — DNS resolves but TCP connection to port 443 cannot be established. This is the same pattern as Banco de España (Batch 3 pre-screening): TCP timeout, not a confirmed source-level block.

Per v2 methodology (Onboarding Boundary Analysis v2, Section 8):
- TCP timeout does NOT confirm source-level block (no HTTP 403, no Akamai signature)
- This is classified as **UNRESOLVED** — not NOT CURRENTLY SUPPORTED
- Routing consequence: SCREENING_ONLY (path-level access issue, not source-level block)

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

## Gate 4 — Pattern Category Applicability

| Field | Value |
|-------|-------|
| Result | **NOT ASSESSED** — Gate 1 FAIL (no content to compare) |

---

## Content-Path Alignment

| Field | Value |
|-------|-------|
| Result | **NOT ASSESSED** — Gate 1 FAIL |

---

## Configuration Contract Verification

| Field | Value |
|-------|-------|
| Result | **NOT ASSESSED** — Gate 1 FAIL |

---

## Semantic Representation Assessment

| Field | Value |
|-------|-------|
| Result | **NOT ASSESSED** — Gate 1 FAIL |

---

## QUALIFICATION READY (v2)

| Field | Value |
|-------|-------|
| Pre-screened | NO (Gate 1 FAIL) |
| Content-path aligned | NOT ASSESSED |
| Configuration compatible | NOT ASSESSED |
| Semantic representation | NOT ASSESSED |
| QUALIFICATION_READY | **NO** |

---

## Gate 5 — First-Attempt Validation

| Field | Value |
|-------|-------|
| Result | **NOT ATTEMPTED** — QUALIFICATION_READY = NO |

---

## Initial Routing (v2 — multi-stage)

| Stage | Result |
|-------|--------|
| Pre-screen stage | Gate 1 FAIL (TCP timeout — UNRESOLVED) |
| Content-path stage | NOT ASSESSED |
| Configuration stage | NOT ASSESSED |
| Semantic stage | NOT ASSESSED |
| Gate 5 | NOT ATTEMPTED |
| Initial routing | **SCREENING_ONLY** (unresolved access path — TCP timeout does not confirm source-level block) |

---

## Root-Cause Review

| Field | Value |
|-------|-------|
| Triggered? | No — Gate 5 was not attempted |
| Root cause | TCP connection timeout to `199.83.40.54:443` — DNS resolves but TCP connection cannot be established |
| Classification | Same pattern as Banco de España (Batch 3): TCP timeout at connection phase, not a confirmed source-level block |

---

## QUALIFICATION DECISION

| Field | Value |
|-------|-------|
| Qualification status | **NOT CURRENTLY SUPPORTED** (at this time — access cannot be established) |
| Content-path status | NOT ASSESSED |
| Configuration compatibility | NOT ASSESSED |
| Semantic representation | NOT ASSESSED |
| Review status | NOT REQUIRED |
| Confidence | MEDIUM (direct evidence of TCP timeout; does not confirm source-level block) |
| Evidence basis | Prospective v2 probing (5 urllib probes + 1 Playwright attempt) |

---

## Prediction Assessment

| Dimension | Prediction | Actual | Correct? |
|-----------|------------|--------|----------|
| Gate 1 (Access) | UNKNOWN | FAIL (TCP timeout) | N/A — prediction was UNKNOWN |
| Overall outcome | UNKNOWN | SCREENING_ONLY | N/A — prediction was UNKNOWN |

The prediction was **UNKNOWN** — no assumption was made about access, and the result (TCP timeout) is a valid v2 outcome. The prediction was not wrong; it was appropriately uncommitted.

---

## What This Proves

1. **v2 methodology works prospectively**: the frozen prediction (UNKNOWN) was correctly uncommitted, and the v2 stages were applied in order. Gate 1 failed, and the remaining stages were correctly NOT ASSESSED.

2. **v2 routing is correct**: TCP timeout → SCREENING_ONLY (not KNOWN_BLOCKED, not NOT CURRENTLY SUPPORTED as a source-level block). This matches the v2 methodology rule: "TCP timeout does not confirm source-level block."

3. **No circular validation**: OCC was not assumed to succeed. The result is evidence-driven — the source is inaccessible from this environment, and v2 correctly classifies this as SCREENING_ONLY.

4. **v2 stages are sequential and dependent**: Gate 1 failure correctly prevented all subsequent stages from being assessed. No stages were skipped or assessed out of order.

---

## What This Does NOT Prove

- Does NOT prove that OCC is blocked at the source level (could be transient, geographic, or network-specific)
- Does NOT prove that OCC would fail Gate 2-7 if accessed (the source was never reached)
- Does NOT prove that v2's content-path alignment or configuration contract stages work (they were not reached)
- Does NOT calculate any success rate (n=1, not valid for statistics)
- Does NOT compare OCC to BaFin (different sources, different environments, different outcomes)

---

## Commercial Classification

| Classification | Applies? |
|---------------|----------|
| STANDARD | ❌ No — Gate 5 not attempted |
| QUALIFIED ENGINEERING | ❌ No — no engineering issue identified (access issue, not architecture) |
| CONDITIONAL | ❌ No — no provenance or content condition |
| NOT CURRENTLY SUPPORTED | ⚠️ Partially — source is currently inaccessible, but this may be transient |
| SCREENING_ONLY | ✅ Yes — unresolved access path; TCP timeout does not confirm source-level block |

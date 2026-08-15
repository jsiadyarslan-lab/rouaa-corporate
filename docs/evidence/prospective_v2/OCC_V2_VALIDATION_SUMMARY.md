# OCC v2 Validation Summary

**Date**: 2026-08-15
**Branch**: `top20-prescreening`
**Base**: Pre-Screening Methodology v2 (FROZEN — `e48281a`), SQR Template v2 (FROZEN — `a62ad65`)
**Type**: Prospective v2 validation summary — first operational test of v2 methodology on a new source.

---

## Source

**Office of the Comptroller of the Currency (OCC)** — US financial regulator, DISCOVERY_ONLY in Queue v1.1.

## Prediction (frozen before probing)

| Field | Value |
|-------|-------|
| Expected class | `financial_regulator` |
| Expected intelligence candidate | `regulatory_enforcement` |
| Expected semantic representation | `POTENTIALLY COMPATIBLE` |
| Expected outcome | **UNKNOWN** |
| No assumptions | access, provenance, RSS, content-path, configuration, Gate 5 |

---

## Results

### Per-stage evidence

| Stage | Result | Evidence |
|-------|--------|----------|
| Gate 1 — Access | **FAIL (UNRESOLVED)** | TCP timeout to `199.83.40.54:443`; DNS resolves; both urllib and Playwright timed out |
| Gate 2 — Provenance | NOT ATTEMPTED | Gate 1 FAIL |
| Gate 3 — Content | NOT ATTEMPTED | Gate 1 FAIL |
| Gate 4 — Pattern Category | NOT ASSESSED | Gate 1 FAIL |
| Content-Path Alignment | NOT ASSESSED | Gate 1 FAIL |
| Configuration Contract | NOT ASSESSED | Gate 1 FAIL |
| Semantic Representation | NOT ASSESSED | Gate 1 FAIL |
| QUALIFICATION_READY | **NO** | Gate 1 FAIL |
| Gate 5 | NOT ATTEMPTED | QUALIFICATION_READY = NO |

### Routing

**SCREENING_ONLY** — unresolved access path (TCP timeout). Per v2 methodology: TCP timeout does not confirm source-level block; classified as path-level issue, not source-level block.

### Configuration compatibility

Not assessed — source was never reached.

### Semantic representation

Not assessed — source was never reached.

### Gate 5 outcome

Not attempted — QUALIFICATION_READY = NO.

### Provenance

Not assessed — source was never reached.

### Reproducibility

Not applicable — no IOs produced.

### Intelligence quality

Not applicable — no IOs produced.

### Engineering intervention

None — no engineering was needed or attempted. The failure is at the access layer, not the pipeline architecture.

### Root cause

TCP connection to `199.83.40.54:443` times out. DNS resolves successfully. Both urllib (15s timeout) and Playwright (30s timeout) failed to establish TCP connection. The failure is at the TCP connection establishment phase, not at TLS handshake or HTTP response.

This is the same pattern as Banco de España (Batch 3 pre-screening at `50aedc0`): TCP timeout, not a confirmed source-level block (no HTTP 403, no Akamai signature).

---

## Prediction Assessment

| Dimension | Prediction | Actual | Assessment |
|-----------|------------|--------|------------|
| Access | UNKNOWN | FAIL (TCP timeout) | Prediction was UNKNOWN — correctly uncommitted |
| Overall | UNKNOWN | SCREENING_ONLY | Prediction was UNKNOWN — result is evidence-driven |

The prediction was **UNKNOWN** — no assumption was made. The result (TCP timeout → SCREENING_ONLY) is a valid v2 outcome. The prediction was not wrong; it was appropriately uncommitted.

---

## What This Validation Proves

1. **v2 methodology is operational**: the frozen v2 methodology was applied prospectively to a completely new source. The prediction was frozen before probing (UNKNOWN), the stages were applied in order, and the result is evidence-driven.

2. **v2 routing is correct for TCP timeout**: the methodology correctly classifies TCP timeout as SCREENING_ONLY (unresolved access path), not KNOWN_BLOCKED (source-level block). This matches the v2 rule: "TCP timeout does not confirm source-level block."

3. **v2 stages are sequential and dependent**: Gate 1 failure correctly prevented all subsequent stages from being assessed. No stages were skipped or assessed out of order.

4. **No circular validation**: OCC was not assumed to succeed. The result is independent of BaFin's success — BaFin was used only as evidence that `regulatory_enforcement` representation exists, not as a baseline that OCC must match.

5. **v2 handles access failure correctly**: the methodology did not attempt to force access or skip Gate 1. The source is inaccessible from this environment, and v2 correctly classifies this without making assumptions about whether OCC is permanently blocked.

---

## What This Validation Does NOT Prove

- ❌ Does NOT prove that OCC is blocked at the source level (could be transient, geographic, or network-specific)
- ❌ Does NOT prove that OCC would pass Gate 2-7 if accessed (source was never reached)
- ❌ Does NOT prove that v2's content-path alignment, configuration contract, or semantic representation stages work (they were not reached)
- ❌ Does NOT calculate any success rate (n=1, not valid for statistics)
- ❌ Does NOT compare OCC to BaFin as a success-rate calculation

---

## Final Status

**OCC v2 Validation = SCREENING_ONLY (unresolved access path)**

The v2 methodology was applied correctly and prospectively. The result is evidence-driven:
- OCC's TCP connection times out from this environment
- v2 correctly classifies this as SCREENING_ONLY (not KNOWN_BLOCKED, not NOT CURRENTLY SUPPORTED as a permanent block)
- The prediction (UNKNOWN) was appropriately uncommitted
- No stages were skipped or forced
- No engineering intervention was needed

**This is NOT a PASS, NOT a FAIL, NOT an INVALID TEST DESIGN.** It is a valid v2 outcome: the source was screened, access could not be established, and it was routed to SCREENING_ONLY — exactly as the v2 methodology prescribes for TCP timeout.

---

## Queue Impact

OCC remains DISCOVERY_ONLY in Queue v1.1. This prospective v2 qualification does NOT modify the Queue. If the user decides to apply the v2 result, OCC would transition from DISCOVERY_ONLY → SCREENING_ONLY (unresolved access path), but this requires a separate Queue update commit — not done here.

# SQR — TCMB Turkey (Prospective v2 — New-Source Replication)

**Source**: Central Bank of the Republic of Turkey (TCMB)
**Date**: 2026-08-15
**Type**: Prospective new-source replication.

## Prediction: UNKNOWN

## v2 Stages

| Stage | Result |
|-------|--------|
| Gate 1 | PASS — HTTP 200, 78 KB English homepage |
| Gate 2 | PASS — dates in content (06.07.2026, 13.08.2026 — DD.MM.YYYY) |
| Gate 3 | PASS — static HTML, 4,473 chars; 54 rate/monetary keywords |
| Gate 4 | PASS — rate_patterns candidate |
| Content-Path | ALIGNED — press releases listing contains monetary policy content |
| Config Contract | COMPATIBLE — event_type=monetary_policy_decision; rate_value→policy_rate (normalized), rate_maintain→rate_decision, rate_action→rate_decision — all in trigger_metrics |
| Semantic | COMPATIBLE — interest rate decisions → monetary_policy_decision |
| QUALIFICATION_READY | YES |

## Gate 5

| Field | Value |
|-------|-------|
| Pipeline state | FAILED (0 documents fetched — link pattern matched 0 URLs) |
| Documents fetched | 0 |
| Facts extracted | 0 |
| Events | 0 |
| IOs | 0 |
| Engineering | None |
| Root cause | Link pattern mismatch: WebSphere Portal URL encoding doesn't match the configured link_pattern regex |

## Gate 5 result: FAIL (link pattern configuration gap — not a content or representation issue)

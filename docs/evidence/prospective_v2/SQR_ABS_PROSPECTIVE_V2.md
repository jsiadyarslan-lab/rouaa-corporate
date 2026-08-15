# SQR — ABS Australia (Prospective v2 — New-Source Replication)

**Source**: Australian Bureau of Statistics
**Date**: 2026-08-15
**Type**: Prospective new-source replication.

## Prediction: UNKNOWN

## v2 Stages

| Stage | Result |
|-------|--------|
| Gate 1 | PASS — HTTP 200, 104 KB |
| Gate 2 | PASS — visible dates ("29 July 2026", "2026-07-29") |
| Gate 3 | PASS — static HTML, 43,788 chars; 153 statistical keywords; percentages (3.8%, 4.0%) |
| Gate 4 | PASS — statistical_patterns candidate |
| Content-Path | ALIGNED — CPI latest release page contains statistical content |
| Config Contract | COMPATIBLE — event_type=statistical_release; all metrics in trigger_metrics |
| Semantic | COMPATIBLE — CPI/inflation → statistical_release |
| QUALIFICATION_READY | YES |

## Gate 5

| Field | Value |
|-------|-------|
| Pipeline state | DOCUMENTED (0 facts) |
| Documents fetched | 5 |
| Documents normalized | 5 |
| Facts extracted | 0 |
| Events | 0 |
| IOs | 0 |
| Engineering | None |
| Root cause | Pattern-content mismatch: Australian statistical phrasing doesn't match US-centric patterns |

## Gate 5 result: FAIL (pattern-specificity gap)

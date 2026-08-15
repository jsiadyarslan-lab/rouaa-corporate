# Prospective v2 Operational Run — 5 Sources — Summary

**Date**: 2026-08-15
**Branch**: `top20-prescreening`
**Base**: Pre-Screening Methodology v2 (FROZEN — `bda3ffb`), SQR Template v2 (FROZEN — `a62ad65`)
**Type**: Prospective v2 operational validation — no success rate calculated.

---

## Per-Source Results

| # | Source | Gate 1 | Gate 2 | Gate 3 | Gate 4 | Content-Path | Config Contract | Semantic | QUALIFICATION_READY | Gate 5 | Routing | Engineering |
|---|--------|--------|--------|--------|--------|---------------|-----------------|----------|---------------------|--------|---------|-------------|
| 1 | PRA (UK) | PASS | PASS | PASS | PASS | **NOT ALIGNED** | NOT ASSESSED | NOT ASSESSED | NO | NOT ATTEMPTED | CONTENT-PATH REVIEW | None |
| 2 | Eurostat | PASS | PASS | PASS | PASS | **ALIGNED** | **COMPATIBLE** | **COMPATIBLE** | **YES** | NOT EXECUTED | QUALIFICATION_READY | None |
| 3 | INSEE (France) | PASS | PASS (WITH REVIEW) | PASS | PASS | **ALIGNED** | COMPATIBLE | **REPRESENTATION GAP** | NO | NOT ATTEMPTED | ENGINEERING REVIEW | None |
| 4 | FSB | PASS | PASS | PASS | PASS | **ALIGNED** | **NOT COMPATIBLE** | **REPRESENTATION GAP** | NO | NOT ATTEMPTED | ENGINEERING REVIEW | None |
| 5 | UK HM Treasury | PASS | PASS | PASS | PASS | **ALIGNED** | **NOT COMPATIBLE** | **REPRESENTATION GAP** | NO | NOT ATTEMPTED | ENGINEERING REVIEW | None |

---

## Stage Reached Per Source

| Source | Last stage reached | Stage that blocked |
|--------|-------------------|-------------------|
| PRA | Content-Path Alignment | Content-Path NOT ALIGNED (RSS contains general regulatory publications, not enforcement actions) |
| Eurostat | QUALIFICATION_READY | — (all stages passed; Gate 5 not executed in this batch) |
| INSEE | Semantic Representation | REPRESENTATION GAP (French-language content — existing patterns are English-only) |
| FSB | Semantic Representation | REPRESENTATION GAP (no existing event type for financial policy/coordination content) |
| UK HM Treasury | Semantic Representation | REPRESENTATION GAP (no existing event type for fiscal policy/guidance content) |

---

## Routing Outcomes

| Routing | Count | Sources |
|---------|-------|---------|
| QUALIFICATION_READY | 1 | Eurostat |
| CONTENT-PATH REVIEW | 1 | PRA |
| ENGINEERING REVIEW | 3 | INSEE, FSB, UK HM Treasury |

---

## Gate 5

| Source | Gate 5 reached? | Gate 5 result |
|--------|----------------|---------------|
| PRA | N | — |
| Eurostat | N (qualified but not executed in this batch) | — |
| INSEE | N | — |
| FSB | N | — |
| UK HM Treasury | N | — |

---

## Engineering Intervention

No engineering intervention was required for any source. All 5 sources were assessed through v2 stages without:
- Core pipeline changes
- Source-specific code
- Configuration changes (no executable pipeline config created)
- Remediation during any attempt

All routing to ENGINEERING REVIEW is evidence-supported (representation gap identified), not engineering-demonstrated (no work package executed).

---

## Root Causes

| Source | Root cause | Category |
|--------|-----------|----------|
| PRA | RSS feed contains general prudential publications (roundtables, digests, policy statements), not enforcement actions. PRA enforcement actions may be on a different path. | content-path mismatch |
| Eurostat | All v2 stages passed. Eurostat content (statistical releases) matches existing `statistical_release` event type. Currency-neutral metrics (`percentage_statistic`, `statistic_value`) are semantically compatible. | — (no failure) |
| INSEE | Content is primarily in French. Existing extraction patterns are English-only (e.g., "inflation rate was X%", "GDP grew by X%"). French content requires French-language patterns. This is a pattern language coverage gap, not an event-model gap. | representation gap (language) |
| FSB | Content is financial stability policy, international coordination, and consultation responses. No existing event type represents "financial policy/coordination" intelligence. No extractable financial metrics match existing trigger_metrics. | representation gap (event model) |
| UK HM Treasury | Content is fiscal policy, government spending guidance, and budget documents. No existing event type represents "fiscal policy/guidance" intelligence. No financial metrics in sampled content. | representation gap (event model) |

---

## Framework Consistency

### v2 stages applied correctly?

| Check | Result |
|-------|--------|
| Stages applied in order (1→2→3→4→content-path→contract→semantic→ready) | ✅ Yes — all 5 sources assessed stage by stage |
| Failed stage correctly prevented subsequent stages | ✅ Yes — PRA's content-path failure prevented contract/semantic; INSEE/FSB/HMT semantic failure prevented Gate 5 |
| Content-path sampling used representativeness (not fixed count) | ✅ Yes — 3 documents sampled for PRA, Eurostat; fewer for others where content was clear from title/description |
| Configuration contract verification was static (no pipeline run) | ✅ Yes — all checks were against EVENT_TYPE_RULES and PATTERN_TYPE_METADATA |
| Semantic assessment was human judgment (MEDIUM confidence) | ✅ Yes |
| INCONCLUSIVE would have produced QUALIFICATION_READY WITH SEMANTIC REVIEW | ✅ N/A — no INCONCLUSIVE outcomes in this batch |
| No engineering intervention | ✅ Yes — 0 for all 5 |
| No remediation during attempts | ✅ Yes |
| Predictions were UNKNOWN (not PASS/FAIL) | ✅ Yes |

### Did v2 produce different outcomes for sources that v1 would have treated identically?

**Yes.** Under v1, all 5 sources would have been classified as "QUALIFICATION_READY" after Gates 1-4 (all passed). v2 differentiated them:
- 1 source (Eurostat) reached QUALIFICATION_READY — would proceed to Gate 5
- 1 source (PRA) was stopped at Content-Path Alignment — content-path mismatch discovered before Gate 5
- 3 sources (INSEE, FSB, UK HM Treasury) were stopped at Semantic Representation — representation gap discovered before Gate 5

Under the v1 routing logic, all five would have been eligible for Gate 5 after Gates 1–4; their actual Gate 5 outcomes were not tested in this run. v2 routed four sources before Gate 5 based on observed pre-Gate-5 conditions.

### Were the "test scenarios" (case types) predictive?

No — the test scenarios were NOT predictive of actual outcomes:
- PRA was labeled "STANDARD candidate" but failed at Content-Path Alignment
- Eurostat was labeled "Content-Path Review candidate" but passed all stages
- INSEE was labeled "Provenance Review candidate" but the actual issue was language representation, not provenance
- FSB was labeled "Representation Gap candidate" — this was confirmed (but it's the only one that matched its scenario)
- UK HM Treasury was labeled "Untested class variant" — the actual issue was representation gap, not class variant

This confirms that predictions should remain UNKNOWN — the test scenarios were useful for selecting diverse sources but were not predictive of outcomes.

---

## What This Batch Proves

1. **v2 methodology is operational**: all 5 sources were assessed through the frozen v2 stages. The methodology correctly differentiated sources at different stages (content-path, configuration contract, semantic representation).

2. **v2 routed 4 of 5 sources before Gate 5**: based on identified pre-Gate-5 conditions (content-path mismatch, representation gaps). This reduced Gate 5 executions in this batch; it does not establish that those sources would have failed Gate 5.

3. **Content-Path Alignment is a real boundary**: PRA's failure (RSS contains general publications, not enforcement actions) is the 4th content-path mismatch observed (after US Treasury, RBI, SEBI). This is a consistent pattern.

4. **Semantic Representation catches event-model gaps**: 3 of 5 sources have representation gaps (INSEE: language; FSB: policy/coordination; HMT: fiscal policy). These were identified before Gate 5 through the v2 semantic assessment stage.

5. **v2 stages work prospectively**: the methodology was applied to 5 completely new sources from 4 different institutional classes, and produced evidence-driven outcomes without assumptions.

6. **No engineering intervention was executed**: no engineering was performed during this run. Three sources were routed to Engineering Review based on evidence-supported representation findings. All issues are at the configuration/model layer.

---

## What This Batch Does NOT Prove

- Does NOT calculate a success rate (n=5, not valid for statistics)
- Does NOT prove that Eurostat will pass Gate 5 (Gate 5 was not executed)
- Does NOT prove that v2 is "complete" — representation gaps for INSEE/FSB/HMT may require model extension
- Does NOT generalize outcomes to institutional classes (1 PRA ≠ all financial regulators; 1 FSB ≠ all multilaterals)
- Does NOT compare sources as a success-rate calculation

---

## Final Status

**Prospective v2 Operational Run — 5 Sources — COMPLETE**

| Metric | Value |
|--------|-------|
| Sources assessed | 5 |
| Gate 1 passed | 5/5 |
| Content-Path Aligned | 4/5 |
| Configuration Compatible | 2/5 |
| Semantic Compatible | 1/5 |
| QUALIFICATION_READY | 1/5 (Eurostat) |
| Gate 5 reached | 0/5 (not executed in this batch) |
| Engineering intervention | 0/5 |
| Root causes: content-path mismatch | 1 (PRA) |
| Root causes: representation gap (language) | 1 (INSEE) |
| Root causes: representation gap (event model) | 2 (FSB, UK HM Treasury) |
| Root causes: no failure | 1 (Eurostat) |

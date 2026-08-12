# Architecture Gate Report

**Date**: 2026-08-12
**Phase**: Architecture Gate (between Phase A.2 and Phase B)
**Scope**: Review the pipeline abstraction itself — not re-test sources
**Website**: FROZEN (no changes)

## Executive Summary

The Architecture Gate reviews 7 dimensions of the pipeline abstraction. The goal is to determine whether the success of 4 Phase A.2 sources reflects a **productizable system** or a **central-bank-specific prototype** disguised as a generic pipeline.

**Overall verdict**: 🟡 **CONDITIONAL PASS** — The abstraction is sound at its core but has 3 structural issues that must be addressed before Phase B. None require redesign; all are additive fixes.

| # | Dimension | Verdict | Severity |
|---|-----------|---------|----------|
| 1 | Configuration limits | 🟡 CONDITIONAL | Medium — patterns are config, but some layers still hardcode monetary-policy assumptions |
| 2 | Data model scalability | 🟡 CONDITIONAL | Medium — schema is generic, but IO generator is monetary-policy-specific |
| 3 | Extractor semantics | 🔴 FAIL | High — `primary/dissent/alternative/context` is monetary-policy-specific, not a general financial fact model |
| 4 | Access layer separation | 🟢 PASS | Low — access strategy is well-isolated from intelligence pipeline |
| 5 | Failure isolation | 🟡 CONDITIONAL | Medium — failures are isolated per-source, but no explicit state machine |
| 6 | Human intervention | 🔴 FAIL | High — cannot measure because pipeline was developed iteratively, not onboarded |
| 7 | Configuration economics | 🟡 CONDITIONAL | Medium — config-only for 3/4 sources, but BOC required feed URL discovery |

**Decision**: Fix dimensions 3, 6, and the conditional issues in 1, 2, 5 before Phase B. Estimated effort: 1-2 hours of refactoring (no redesign).

---

## Dimension 1: Configuration Limits

### Question
Is `source_configs.py` genuine configuration, or is it code disguised as configuration?

### Findings

**What IS config (genuine)**:
- Source identity (code, name, type, country, jurisdiction, trustTier) — pure data
- Feed URL and website URL — pure data
- `content_keywords` — list of strings, pure data
- `event_type` — single string, pure data
- `rate_patterns` — list of (regex, pattern_type) tuples — **this is the boundary case**

**The boundary case — `rate_patterns`**:

Each source has 5-7 regex patterns. These ARE configuration (no code executes them differently per source), but they're complex:
```python
(r"target\s+range\s+for\s+the\s+federal\s+funds\s+rate\s+at\s+(\d+(?:[-\s]\d+/\d+|\.\d+)?)\s*(?:to|-)\s*(\d+(?:[-\s]\d+/\d+|\.\d+)?)\s*(?:percent|%|pct)", "rate_range")
```

This is **domain knowledge encoded as regex** — not code, but not simple config either. It's acceptable IF:
1. Adding a new source = adding new patterns (not modifying existing ones)
2. Patterns don't leak into other layers

**What is NOT config (code disguised)**:
- `intelligence_object.py` L45-56: hardcoded `rate_maintain`, `rate_hike`, `rate_cut`, `policy_rate`, `rate_decision` — these are monetary-policy-specific code branches, not config
- `fetcher.py` L235: function named `is_monetary_policy_related()` — naming couples fetcher to monetary policy
- `detector.py` L197-205: special title formatting for `monetary_policy_decision` event type — hardcoded branch

### Verdict: 🟡 CONDITIONAL

**The config file itself is genuine configuration.** Adding a new central bank = adding a dict entry with patterns. No code changes needed for same-category sources.

**However**, 3 code files have monetary-policy-specific assumptions that would need extension (not redesign) for non-monetary sources:
1. `intelligence_object.py` — headline/summary generation is rate-specific
2. `fetcher.py` — function naming couples to monetary policy
3. `detector.py` — title formatting has a monetary-policy branch

**Required fix before Phase B**: Make IO headline/summary generation data-driven (extend `EVENT_TYPE_RULES` in detector.py with headline_template, move logic out of intelligence_object.py). Rename `is_monetary_policy_related` → `is_relevant_content`.

---

## Dimension 2: Data Model Scalability

### Question
Does `Document → Fact → Event → Evidence → IO` scale beyond central-bank rate decisions to 10, 100, 500 sources across different domains?

### Findings

**Schema review** (schemas.py, 180 lines):

| Schema | Generic? | Notes |
|--------|----------|-------|
| `SourceRef` | ✓ Yes | Pure identity fields — works for any source type |
| `Document` | ✓ Yes | `doc_type` field exists but defaults to "press_release" — extensible |
| `Fact` | ✓ Yes | `metric`, `value`, `unit`, `fact_role` — domain-agnostic |
| `FinancialEvent` | ✓ Yes | `event_type`, `event_subtype` — generic classification |
| `Evidence` | ✓ Yes | Links fact to document — domain-agnostic |
| `ProvenanceChain` | ✓ Yes | Traceability chain — domain-agnostic |
| `IntelligenceObject` | 🟡 Partial | `object_type` defaults to "monetary_policy_intelligence" — should be configurable |

**The schema itself is well-designed.** Every field is generic. The `Fact.metric` field can hold "policy_rate", "penalty_amount", "revenue", "inflation_rate" — all equally valid.

**The problem is not the schema — it's the consumers:**

1. `intelligence_object.py` L55-56:
   ```python
   rate_facts = [f for f in facts if f.metric in ("policy_rate", "policy_rate_range")]
   decision_facts = [f for f in facts if f.metric == "rate_decision"]
   ```
   This hardcodes which metrics are "important" for the summary. For a regulatory enforcement event, the important metric is `penalty_amount`, not `policy_rate`.

2. `intelligence_object.py` L45-52:
   ```python
   if event.event_subtype == "rate_maintain":
       headline = f"{source_name} Maintains Policy Rate"
   ```
   Hardcoded headline generation for monetary policy only.

3. `intelligence_object.py` L162: `object_type: str = "monetary_policy_intelligence"` — default assumption.

### Verdict: 🟡 CONDITIONAL

**The data model scales — the consumers don't.** The schema can handle 500 sources across 20 domains. But the IO generator is written for monetary policy specifically.

**Required fix before Phase B**: Extend `EVENT_TYPE_RULES` in detector.py to include `headline_template` and `summary_metrics` (which metrics to prioritize in summary). Make `intelligence_object.py` consume these rules instead of hardcoding monetary-policy logic.

---

## Dimension 3: Extractor Semantics

### Question
Is `primary / dissent / alternative / context` a general financial fact model, or is it an abstraction for monetary policy only?

### Findings

**`detect_fact_role()` in extractor.py L63-125**:

The semantic role detection is **entirely monetary-policy-specific**:

```python
dissent_para_patterns = [
    "votes to increase", "votes to raise", "votes to cut", "votes to lower",
    "preferred to increase", "preferred to raise", "preferred to cut",
    "voted against", "voted to increase", "voted to raise",
    "preferring to increase", "preferring to raise",
    "preferred a 0.25 percentage point increase",
    "preferred a 0.25 percentage point",
    "raising bank rate to", "increasing bank rate to",
    "raise bank rate to", "increase bank rate to",
]
```

Every single pattern is about **central bank dissenting votes**. There is no concept of:
- Regulatory dissent (commissioner disagreed with enforcement action)
- Earnings revision (restated vs original)
- Statistical revision (preliminary vs final)
- Sanctions dissent (committee member objected to designation)

**The `primary` role works for any domain** — it's the default. But `dissent`, `alternative`, and `context` are meaningful only in monetary policy context.

**Impact on Phase B sources**:
- SEC enforcement: no dissent concept — `action_type` is always primary
- FCA fines: no dissent concept — `penalty_amount` is always primary
- ONS statistics: `context` could mean "revised from previous" but current patterns don't detect this
- OFAC sanctions: no dissent concept — `designated_entity` is always primary
- Earnings: `context` could mean "vs previous quarter" but not detected

### Verdict: 🔴 FAIL

**The semantic role model is not general — it's a monetary-policy-specific overlay.** For Phase B, this won't cause incorrect facts (non-monetary sources just default to `primary`), but it means the "semantic safety" claim from Phase A.2 doesn't extend to new domains.

**Required fix before Phase B**: Either:
- (a) Make role detection domain-aware via config (`role_patterns` in source config), OR
- (b) Generalize the patterns to cover common financial-domain roles (revision, restatement, dissent, forecast vs actual), OR
- (c) Acknowledge that `primary` is the only universal role, and `dissent/alternative/context` are monetary-policy-specific extensions

**Recommendation**: Option (c) is most honest. Document that `primary` is universal, and `dissent/alternative/context` are monetary-policy-specific. Add `revision` and `forecast` roles for statistical/earnings domains. Make the role patterns configurable per source type.

---

## Dimension 4: Access Layer Separation

### Question
Is the access strategy fully isolated from the intelligence pipeline? Does the extractor or evidence layer know anything about how the source was accessed?

### Findings

**Layer separation audit**:

| Layer | Knows about access? | Knows about intelligence? |
|-------|---------------------|---------------------------|
| `fetcher.py` | ✓ (urllib, Playwright, blocked) | ✗ (only comment mentions "fact extraction") |
| `content_extractor.py` | ✗ | ✗ (only normalizes content) |
| `extractor.py` | ✗ | ✓ (creates Facts) |
| `detector.py` | ✗ | ✓ (creates Events) |
| `evidence.py` | ✗ | ✓ (creates Evidence/Provenance) |
| `intelligence_object.py` | ✗ | ✓ (creates IO) |

**Access strategy is well-isolated.** The fetcher returns `(documents, access_status, fetch_method)`. The access_status and fetch_method are tracked in the results dict but never passed to downstream layers. The extractor, detector, evidence builder, and IO generator never see how the document was fetched.

**One naming issue**: `is_monetary_policy_related()` in fetcher.py couples the function name to monetary policy. The function itself is generic (keyword matching), but the name is misleading. This is a cosmetic issue, not a structural one.

### Verdict: 🟢 PASS

**Access layer is properly isolated.** The intelligence pipeline doesn't know or care whether the source was fetched via urllib, Playwright, or classified as blocked. This dimension needs no changes (only a rename for clarity).

---

## Dimension 5: Failure Isolation

### Question
Does a source failing at fetch cause the whole workflow to fail? Is there an explicit state machine: `accessible → processed → extracted → governed → publishable`?

### Findings

**Current failure handling** (run_pipeline.py):

Each source runs in its own `try/except` block at the top level (L293-301):
```python
for source_code in PHASE_A_SOURCES:
    try:
        results = run_pipeline_for_source(source_code)
        all_results[source_code] = results
    except Exception as e:
        # Source failure doesn't crash the pipeline
        all_results[source_code] = {"errors": [f"FATAL: {str(e)}"], ...}
```

**Per-source failure isolation**: ✓ Working. One source crashing doesn't affect others.

**Within-source failure handling**: Each step has its own try/except:
- Step 1 (Fetch): if blocked → return early with `output_quality: "blocked"`
- Step 2 (Normalize): if failed → return early
- Step 3 (Extract): if no facts → continue (not a failure)
- Step 4 (Detect): if no events → continue
- Steps 5-7: only execute if facts exist

**What's missing — explicit state machine**:

The pipeline tracks booleans (`fetch_success`, `document_normalization`, `fact_extraction`, etc.) but doesn't have an explicit state enum. The user's requested state machine is:

```
accessible → processed → extracted → governed → publishable
```

Current equivalent:
- `accessible` = `access_status == "open"` + `fetch_success == True`
- `processed` = `document_normalization == True`
- `extracted` = `fact_extraction == True` + `event_detection == True`
- `governed` = `evidence_generation == True` + `provenance_completeness == True`
- `publishable` = `intelligence_object == True` + `output_quality == "accept"`

**The states are implicit** (derivable from metrics) but **not explicit** (no `pipeline_state` field). This makes it hard to answer "what state is source X in?" without computing from multiple fields.

### Verdict: 🟡 CONDITIONAL

**Failure isolation works** — one source failing doesn't crash others. But the state machine is implicit, not explicit. This makes it hard to:
1. Report which stage a source failed at
2. Resume from the last successful stage
3. Track partial progress (e.g., fetched but not extracted)

**Required fix before Phase B**: Add explicit `pipeline_state` field to results, with values: `pending → accessible → processed → extracted → governed → publishable → failed`. Update after each step. This is a reporting improvement, not a structural change.

---

## Dimension 6: Human Intervention Measurement

### Question
How many of the 4 Phase A.2 sources passed **without manual intervention after running the pipeline**?

### Findings

**This dimension cannot be measured honestly** because the pipeline was developed iteratively, not onboarded:

| Source | Iterations | Manual interventions |
|--------|------------|---------------------|
| ECB | Multiple runs | Pattern tuning, content extraction debugging |
| BOE | Multiple runs | Semantic role detection (dissent vs primary), pattern tuning |
| FED | Multiple runs | Fractional rate regex fix, rate_range group fix |
| BOC | Multiple runs | Feed URL discovery (wrong feed → correct feed), pattern addition |

**The pipeline was BUILT by iterating on these 4 sources.** Every pattern, every fix, every adapter was created in response to a specific source's behavior. This is **development**, not **onboarding**.

**The question "did it pass without manual intervention?" is meaningless for development sources** — the manual intervention IS how they were built.

**What we can measure**: The pipeline NOW produces correct IOs for all 4 sources on a clean run (verified by Phase A.2 regression). But this proves the pipeline works for sources it was designed around, not that it works for new sources without intervention.

### Verdict: 🔴 FAIL

**Cannot claim "0 manual intervention" for Phase A.2 sources** because the pipeline was developed against them. This is the most critical finding of the Architecture Gate:

> **Phase A.2 proved the pipeline works. It did NOT prove the pipeline onboards new sources without manual intervention.**

**Required before Phase B**: Phase B itself IS the measurement. The 10 new sources must be onboarded with **explicit tracking of every manual intervention**:
- Pattern added/modified
- Config field added
- Code change required
- Feed URL discovered (not in initial config)

This is why Phase B's "Manual intervention measured per source" criterion is essential.

---

## Dimension 7: Configuration Economics

### Question
What is the cost of adding a new source? Classify as: 0 code / config only / engineering / blocked.

### Findings

**Phase A.2 source classification** (retrospective):

| Source | Classification | Effort | Notes |
|--------|---------------|--------|-------|
| ECB | Config only | ~1 hour | Initial patterns, then iteration |
| BOE | Config only | ~1.5 hours | Patterns + semantic role tuning |
| FED | Config + code | ~2 hours | Required fractional rate regex fix (generic code change) |
| BOC | Config only | ~1 hour | Required feed URL discovery (config change) |

**The "config only" classification is generous** because it counts the final state, not the development path. In reality:
- ECB patterns were refined 3-4 times
- BOE required adding `rate_action_with_value` pattern type
- FED required a code change to the extractor (fractional rate normalization)
- BOC required discovering the correct feed URL (not a code change, but research)

**Honest classification**:
- 3/4 sources: config-only onboarding AFTER the pipeline was built
- 1/4 sources: required generic code change (FED fractional rates)
- 0/4 sources: required source-specific code

**The 0 source-specific code claim is verified and honest.** The "config only" claim is true for the final state but obscures the development effort.

### Verdict: 🟡 CONDITIONAL

**Configuration economics look good in the final state** (0 source-specific code, config-only onboarding for 3/4 sources). But:
1. The development path required iteration (not measurable for onboarding claim)
2. Generic code changes were needed (FED fractional rates) — acceptable but should be tracked
3. Feed URL discovery is research, not pure config — should be tracked separately

**Required for Phase B**: Track each source's onboarding cost explicitly:
- Config entries added (count)
- Patterns added (count)
- Generic code changes required (count + description)
- Feed URL discovery time (minutes)
- Total onboarding time (minutes)

---

## Summary of Required Fixes Before Phase B

### Must fix (blocking):

1. **Dimension 3 — Extractor semantics**: Document that `primary` is the only universal role. Add `revision` and `forecast` roles for non-monetary domains. Make role patterns configurable per source type. (1 hour)

2. **Dimension 6 — Human intervention**: Phase B itself is the measurement. Set up explicit tracking of every manual intervention per source. (Framework setup: 30 minutes)

### Should fix (recommended):

3. **Dimension 1 — Configuration limits**: Make IO headline/summary generation data-driven. Move monetary-policy-specific logic out of `intelligence_object.py` into `EVENT_TYPE_RULES`. (1 hour)

4. **Dimension 2 — Data model consumers**: Extend `EVENT_TYPE_RULES` with `headline_template` and `summary_metrics`. Make IO generator consume these rules. (Part of fix #3)

5. **Dimension 5 — Failure isolation**: Add explicit `pipeline_state` field: `pending → accessible → processed → extracted → governed → publishable → failed`. (30 minutes)

### Cosmetic fixes:

6. Rename `is_monetary_policy_related()` → `is_relevant_content()` in fetcher.py. (5 minutes)

7. Change `IntelligenceObject.object_type` default from "monetary_policy_intelligence" to "intelligence" (generic). (5 minutes)

**Total estimated effort**: 3-4 hours of refactoring. No redesign. No architecture changes. All fixes are additive.

---

## Decision

**Phase B is APPROVED after the 2 must-fix items are completed.**

The 3 "should fix" items can be done in parallel with Phase B Wave 1 (cold run) — they don't block the cold run, but should be fixed before Wave 2 (generic changes).

The architecture is **sound**. The 3 FAIL/CONDITIONAL verdicts are about:
- Honesty in claims (Dimension 6 — can't claim "no manual intervention" for dev sources)
- Generalizing beyond monetary policy (Dimension 3 — semantic roles)
- Data-driven consumers (Dimensions 1, 2 — IO generator hardcoding)

None of these require redesign. They require **extension and honesty**.

**The abstraction is not collapsing. It needs to be honest about what it currently is (monetary-policy-focused with generic schema) and what it needs to become (multi-domain with data-driven consumers).**

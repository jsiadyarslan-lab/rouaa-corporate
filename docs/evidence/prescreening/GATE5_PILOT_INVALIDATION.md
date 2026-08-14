# Gate 5 Pilot — Test Design Invalidation

**Date**: 2026-08-15
**Commit invalidated**: `1a2724f` (Gate 5 Representative Validation — Final Summary)
**Branch**: `top20-prescreening`
**Status**: INVALIDATED TEST DESIGN — results cannot validate or invalidate Gate 4 or QUALIFICATION_READY predictive power

---

## What Was Done

A Gate 5 representative validation was run on 5 QUALIFICATION_READY sources. Each source was given a configuration with **empty extraction patterns** (`rate_patterns: []`, no other pattern categories defined). The pipeline fetched 60 documents and normalized 59, but extracted 0 facts and produced 0 IOs.

## Why the Test Is Invalid

### 1. Empty patterns ≠ test of Gate 4

Gate 4 assessed "pattern category appears applicable" — meaning the PATTERN_TYPE_METADATA abstraction exists and has proven analogs. The Gate 5 test then provided **zero patterns** to the extractor and concluded "Gate 4 prediction = 0/5 confirmed."

This is circular:
- Gate 4: "the pattern category appears applicable"
- Gate 5 config: `rate_patterns: []` (no patterns at all)
- Result: 0 facts extracted
- Conclusion: "Gate 4 prediction not confirmed"

The conclusion does not follow. The test only proved:

> **Empty extraction configuration produces zero facts.**

This is trivially true and reveals nothing about the predictive power of Gate 4 or the QUALIFICATION_READY state. Gate 4 said the category is applicable; the test never gave the category any patterns to apply.

### 2. "Config-only = Yes" is misleading

The report marked all 5 sources as `config_only = Yes`. But what was created was:
- A source identity (code, name, type, URLs)
- An access configuration (feedUrl, feed_format, link_pattern)
- **Empty** extraction patterns (`rate_patterns: []`)

This is not "config-only onboarding" in any meaningful intelligence sense. No extraction configuration was provided. The correct classification is:

```text
Configuration intervention: Yes (access config created)
Engineering intervention: No
Meaningful extraction configuration: No (patterns were empty)
Gate 5 validity: INVALID TEST
```

### 3. Gate 1/Gate 3 "100% predictive accuracy" is an overclaim

The 5 sources were selected from sources that had already passed Gates 1-3 during pre-screening. The pipeline reproducing those access/content conditions is **reproduction of previously observed conditions**, not independent predictive validation.

What the test actually proved:

> **The pipeline reproduced the previously observed access/content conditions for the sample.**

NOT:

> Gate 1/Gate 3 have 100% predictive accuracy.

This is a methodologically important distinction: the sample was pre-selected for passing Gates 1-3, so observing that they pass again is expected, not predictive.

### 4. The Gate 4.5 proposal is premature

The report proposed adding "Gate 4.5: Pattern-level content assessment" based on the invalid test results. This proposal is **not adopted**. Before adding a new gate, the correct test must be run first:

```text
Gate 1–4
   ↓
Create MINIMUM VALID extraction configuration (with actual patterns)
   ↓
Run Gate 5
   ↓
Does existing abstraction + patterns extract?
```

Only if this test fails should we consider whether a new gate is needed. The failure cause could be:
- Pattern coverage (fixable via config, no new gate needed)
- Wrong category selection (fixable via pre-screening refinement, no new gate needed)
- Document-type mismatch (may require new pattern category, but that's config not a gate)
- Semantic extraction limitation (may require engineering, which is a Gate 5 FAIL)
- Provenance issue (tested only after extraction produces facts)
- Or genuinely a missing layer between category and pattern selection

We cannot determine which until the correct test is run.

---

## What Retains Value

The pilot produced real operational data:

```text
5 sources
60 documents fetched
59 documents normalized
0 facts extracted (expected — empty patterns)
0 IOs (expected)
0 core engineering changes
0 source-specific code
```

The value of this data:
- **Pipeline infrastructure confirmed**: HTML index parsing, RSS parsing, PDF text extraction all work without source-specific code
- **Access and content handling confirmed**: the fetcher and normalizer handle diverse source types correctly
- **The extraction step is the critical path**: the pipeline reliably reaches DOCUMENTED state but cannot progress further without patterns

But the **interpretation** of this data in `1a2724f` was wrong. The data shows the pipeline works; it does NOT show that QUALIFICATION_READY fails to predict Gate 5.

---

## Corrected Interpretation

> The attempted Gate 5 runs used intentionally incomplete extraction configurations, so the results cannot validate or invalidate the predictive power of Gate 4 or QUALIFICATION_READY.

This makes the document **evidence of test-design failure**, not evidence of product failure.

---

## Next Step: Gate 5 Re-run with Minimum Valid Configurations

The Gate 5 validation must be re-run on the same 5 sources with a new rule:

> **The first attempt must contain the minimum valid configuration required to test the source's actual extraction applicability, derived from the pre-screening evidence, without modifying core code.**

Rules for the re-run:
- Configs must include actual extraction patterns derived from pre-screening evidence (content types observed during pre-screening)
- Patterns should use existing pattern categories (`rate_patterns`, `regulatory_patterns`, `statistical_patterns`, `earnings_patterns`)
- No empty pattern lists
- No patterns added after seeing the result
- No core code modifications
- No remediation within the same source attempt
- If core engineering is required: STOP immediately for that source

Only with this corrected test design can we answer:

> **Does QUALIFICATION_READY from Gates 1-4 predict Gate 5 onboarding capability?**

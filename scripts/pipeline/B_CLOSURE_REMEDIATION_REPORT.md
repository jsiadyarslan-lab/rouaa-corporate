# B-Closure Remediation Report — Config-Only Fixes + Stop Condition

**Date**: 2026-08-12
**Branch**: `pipeline-b-closure`
**Base commit**: `de64f31` (frozen baseline)
**Remediation commit**: this one

## What Was Attempted

Config-only fixes for 2 semantic errors identified in B-Closure baseline:

1. **BOJ `role_patterns`** — Add dissent/alternative patterns for BOJ minutes/opinions
2. **FCA `defendant_name` regex** — Tighten to stop matching "defined benefit" fragments

## What Was Changed (config-only)

### `source_configs.py` — BOJ
- Added `role_patterns` dict with dissent/alternative/context/forecast/revision patterns
- Patterns target: "one member expressed the view", "a different member said", "preferred to", voting language

### `source_configs.py` — FCA
- Replaced `fined\s+([A-Z][A-Za-z\s,&\.]{3,80})` with `fined\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})`
- Added "X has been fined" / "X was fined" pattern
- Removed "final notice" from action_type (it's a document type, not an action)

### `run_b_closure.py` — Semantic review rule (test runner, NOT core pipeline)
- Changed `MIXED_DECISIONS` check to `MIXED_PRIMARY_DECISIONS`
- Now only flags multiple PRIMARY decisions with distinct values (not dissent/alternative)
- Rationale: dissent with different values is EXPECTED in BOJ minutes; only conflicting PRIMARY decisions are semantic errors

## Results After Remediation

| Source | Baseline Sem Errors | After Remediation | Change |
|--------|--------------------|-------------------|--------|
| BOJ | 2 | 2 | 0 (no improvement) |
| FCA | 3 | 1 | -2 (improved) |
| **Total** | **5** | **3** | **-2** |

### Remaining errors:

**BOJ (2 errors — MIXED_PRIMARY_DECISIONS)**:
- IO 1: 4 PRIMARY rate_decision facts with 3 distinct values: {hike, maintain, action}
- IO 2: 5 PRIMARY rate_decision facts with 3 distinct values: {hike, maintain, action}

**FCA (1 error — DEFENDANT_FRAGMENT)**:
- defendant_name='benefit pension schemes between' still matches

## STOP CONDITION TRIGGERED

### FCA defendant_name — requires core extractor change

The FCA regex fix did NOT work because the extractor applies `re.IGNORECASE` to ALL patterns:

```python
# extractor.py line 588
matches = re.finditer(pattern_str, paragraph, re.IGNORECASE)
```

With `re.IGNORECASE`, `[A-Z]` matches lowercase letters. So `[A-Z][a-z]+` matches "benefit" (lowercase 'b'). This means **any regex that relies on case sensitivity cannot work** in the current extractor.

**Per user rule**: "إذا احتاج إصلاح FCA أو BOJ إلى تعديل core extractor، يتوقف الاختبار فوراً. عندها لم يعد remediation config-only."

**STOP: The FCA defendant_name fix requires modifying `extractor.py` to support per-pattern case sensitivity. This is a core extractor change, not config-only.**

### BOJ mixed decisions — requires extractor deduplication logic

The BOJ role_patterns partially worked (some facts classified as dissent), but the minutes document contains paragraphs with multiple PRIMARY rate_decision matches from different pattern types (maintain + action + hike). This is because:
- "the Bank judged it appropriate to adjust" → matches `rate_action`
- "will continue to raise" → matches `rate_action` (future guidance, but classified as primary)
- "maintained after the change" → matches `rate_maintain`

All three match in the same paragraph, all classified as primary. Fixing this requires either:
1. Extractor deduplication (keep only highest-confidence fact per metric per paragraph)
2. Better pattern design (but this is iterative config tuning, not a clean fix)

**This also requires core extractor changes or iterative config tuning beyond simple remediation.**

## Honest Comparison: Baseline vs After Remediation

| Metric | Frozen Baseline | After Remediation | Change |
|--------|----------------|-------------------|--------|
| Publishable | 7/10 = 70% | 7/10 = 70% | 0 |
| Semantic errors | 5 | 3 | -2 |
| Provenance | 70% | 70% | 0 |
| Reproducibility | 70% | 70% | 0 |
| Source-specific code | 0 | 0 | 0 |
| Config-only | Yes | Yes | ✓ |
| Core code changes | 0 | 0 | ✓ |

## Gate B Verdict (unchanged)

**YELLOW — NOT CLEARED**

The remediation improved semantic errors from 5 to 3, but:
- FCA fix requires core extractor change (IGNORECASE issue)
- BOJ fix requires extractor deduplication or iterative config tuning
- Publishable rate unchanged (70%, below 80% threshold)
- Provenance/reproducibility unchanged (70%, below 95%/100%)

## What This Proves

1. **Config-only fixes can address SOME semantic errors** (FCA action_type, partial BOJ role detection)
2. **Some semantic errors require core extractor changes** (case sensitivity, deduplication)
3. **The architecture is config-friendly but not config-complete** — some fixes need engineering

## Next Steps (Per User Direction)

The user's rule was clear: if core extractor changes are needed, stop. We have hit that condition.

**Recommended path**:
1. Keep this remediation commit as evidence of what config-only can achieve
2. Do NOT modify core extractor now (would require new architecture gate)
3. Define Supported Source Contract with honest scope:
   - Supported: sources where patterns don't depend on case sensitivity
   - Supported: sources where one fact per metric per paragraph is expected
   - Not supported: sources requiring case-sensitive extraction or complex deduplication
4. Gate B remains YELLOW — architecture promising, productization not proven

# SNB Independent Validation Review — Audit Report

**Date**: 2026-08-13
**Reviewer**: Independent (execution tool)
**Subject**: SNB commit `c09de13` on branch `new-source-validation-snb`
**Base**: `146aa3b` (Extraction Hardening CLEARED)
**Mode**: Review only — NO code, config, Contract, or website modifications

---

## Checks Performed

### Check 1: `c09de13` contains only intended SNB configuration change

**Result**: PASS

Files changed between `146aa3b` and `c09de13` (excluding output):
- `scripts/pipeline/source_configs.py` (+39 lines — SNB_SOURCE dict only)

Output files (evidence artifacts, not code):
- `scripts/pipeline/output/SNB/io_1.json`
- `scripts/pipeline/output/SNB/io_1.txt`
- `scripts/pipeline/output/snb_first_attempt.log`
- `scripts/pipeline/output/snb_first_attempt_results.json`

No other files modified.

### Check 2: All core pipeline files diff-equivalent to `146aa3b`

**Result**: PASS

SHA-256 hash comparison (first 16 chars):

| File | `146aa3b` | `c09de13` | Match |
|------|-----------|-----------|-------|
| extractor.py | `3cf9b2a5d9c9804d` | `3cf9b2a5d9c9804d` | MATCH |
| detector.py | `c2c15df45136f40b` | `c2c15df45136f40b` | MATCH |
| fetcher.py | `669fd4c89b93e19b` | `669fd4c89b93e19b` | MATCH |
| content_extractor.py | `696a1be5589809d5` | `696a1be5589809d5` | MATCH |
| evidence.py | `e68f4e6ba33cf0f1` | `e68f4e6ba33cf0f1` | MATCH |
| intelligence_object.py | `6f19cd736a05661b` | `6f19cd736a05661b` | MATCH |
| pipeline_state.py | `7d50fc6237a82e21` | `7d50fc6237a82e21` | MATCH |
| schemas.py | `0efdce1114aa9429` | `0efdce1114aa9429` | MATCH |

All 8 core files byte-for-byte identical. 0 diff lines across all 12 pipeline `.py` files.

### Check 3: SNB absent from baseline before onboarding

**Result**: PASS

- SNB count in `146aa3b` source_configs.py: **0**
- SNB not in `PHASE_A_SOURCES` (ECB, BOE, FED, BOC, RBA)
- SNB not in `PHASE_B_SOURCES` (BOJ, RBNZ, SEC, FCA, ONS, BIS_STATS, APPLE, ARAMCO, OFAC, BIS_QR)
- No "Swiss", "SNB", or "Schweiz" references in baseline
- SNB count = 0 in all 6 prior branches (pipeline-b-closure, extraction-hardening, new-source-validation, new-source-validation-esma, esma-html-validation, evidence-matrix)

### Check 4: Verify counts against actual artifacts

**Result**: PASS

| Metric | Reported | Artifact | Match |
|--------|---------|----------|-------|
| documents_fetched | 10 | (verified in log) | MATCH |
| documents_normalized | 9 | (1 failed normalization — circular letter) | MATCH |
| facts | 4 | IO key_facts = 4 | MATCH |
| events | 1 | (1 event detected for the monetary policy doc) | MATCH |
| evidence_chains | 4 | IO evidence_chains = 4 | MATCH |
| IOs | 1 | 1 IO file on disk | MATCH |
| publishable | 1 | IO provenance_complete=True, confidence=1.0 >= 0.7 | MATCH |

### Check 5: `document_date` from `dc:date`, not fallback

**Result**: PASS

- SNB RSS feed item for the publishable IO:
  - `<pubDate>`: NOT FOUND
  - `<dc:date>`: `2026-07-16T07:30:00Z`
  - `<published>`/`<updated>`: NOT FOUND
- Parser extracted `published_at`: `2026-07-16T07:30:00Z`
- IO `document_date`: `2026-07-16T07:30:00Z`
- Evidence chain `document_date`: `2026-07-16T07:30:00Z`
- Source: **`<dc:date>` (Dublin Core)** — CONFIRMED, not a fallback or manual value

### Check 6: Inspect `rate_decision=leave` and `policy_rate=0`

**Result**: PASS

**Fact 1: `rate_decision = leave`**
- Value: `'leave'`
- Role: primary
- Confidence: 0.9
- Paragraph: 3
- Evidence excerpt: `"...the Governing Board of the Swiss National Bank decided to leave the SNB policy rate unchanged at 0%..."`
- Chain verified: True

**Fact 2: `policy_rate = 0`**
- Value: `'0'`
- Role: primary
- Confidence: 1.0
- Paragraph: 3
- Evidence excerpt: `"...decided to leave the SNB policy rate unchanged at 0%..."`
- Chain verified: True

**Source verification**: Fetched the actual SNB document and found the exact sentence: "the Governing Board of the Swiss National Bank decided to leave the SNB policy rate unchanged at 0%". Both facts are correct and traceable to the source.

### Check 7: Provenance completeness + reproducibility

**Result**: PASS

**Provenance**:
- 4 evidence chains, all verified (chain_verified = True)
- IO provenance_complete = True
- All 12 required fields populated in every chain (no empty fields)

**Reproducibility**:
- Original facts: `{('policy_rate', '0', 3), ('policy_rate', '0', 38), ('rate_decision', 'leave', 3), ('rate_decision', 'leave', 38)}`
- Re-extracted facts: identical set
- Match: PASS (deterministic)

### Check 8: 8 other documents — no unexplained pipeline failure

**Result**: PASS

| Doc # | Title (abbreviated) | Content | Facts | Explanation |
|-------|---------------------|---------|-------|-------------|
| 1 | Data portal - Important monetary policy data | 2764 chars | 0 | Data portal page — no rate decision text |
| 2 | Data portal - Exchange rate indices | 2742 chars | 0 | Data portal page — no rate decision text |
| 3 | Data portal - Interest rates and exchange rates | 2764 chars | 0 | Data portal page — no rate decision text |
| 4 | Data portal - Important monetary policy data | 2762 chars | 0 | Data portal page — no rate decision text |
| 5 | Data portal - SNB balance sheet items | 2747 chars | 0 | Data portal page — no rate decision text |
| 6 | Data portal - Important monetary policy data | 2760 chars | 0 | Data portal page — no rate decision text |
| 7 | Data portal - Important monetary policy data | 2760 chars | 0 | Data portal page — no rate decision text |
| 8 | **Monetary policy assessment** | **18356 chars** | **4** | **Rate decision document — CORRECT** |
| 9 | Data portal - Important monetary policy data | 2760 chars | 0 | Data portal page — no rate decision text |
| (failed) | New circular letter | 0 chars | n/a | Normalization failed — content empty (circular letter has no accessible HTML body) |

**1 normalization failure** (doc 10 — "New circular letter") is explained: the page has no accessible HTML body content (0 chars after normalization). This is a content access issue for that specific page, not a pipeline failure.

The 8/9 docs with 0 facts are "Data portal" pages that contain "rate" and "monetary policy" in navigation text but no rate decision language. 0 facts is correct for these documents.

### Check 9: Phase A regression suite

**Result**: PASS

Ran `run_pipeline.py` against the review state (SNB config added, no core changes):

| Source | State | Status |
|--------|-------|--------|
| ECB | PUBLISHABLE | accept |
| BOE | PUBLISHABLE | accept |
| FED | PUBLISHABLE | accept |
| BOC | PUBLISHABLE | accept |
| RBA | BLOCKED | blocked |

- PASS (IO accepted): 4/4 accessible sources
- Reproducibility: 4/4 = 100%
- No regression introduced.

### Check 10: Search for source-specific branches

**Result**: PASS (0 found)

Searched all `.py` files in `scripts/pipeline/` for:
- `if source ==`, `if source_code ==`, `if config[`
- `if 'SNB'`, `if 'BEA'`, `if 'ESMA'`, etc.
- Any source-name conditional logic

**Result**: 0 source-specific branches found in any `.py` file.

The diff between `146aa3b` and `c09de13` contains only:
- Configuration data (SNB_SOURCE dict with patterns, keywords, event_type)
- Evidence output files (IO JSON/TXT, results JSON, log)

No conditional logic, no source-specific code paths, no special-case handling.

---

## Mandatory Classification

| Dimension | Result |
|-----------|--------|
| **Onboarding** | **PASS** — config-only, first attempt, 1 publishable IO, 0 core intervention, 0 source-specific code |
| **Provenance** | **PASS** — 100% (4/4 chains verified, all fields populated, document_date from dc:date) |
| **Intelligence Quality** | **PASS** — 0 critical errors, 0 ambiguous errors, facts verified against source text |
| **Extraction Coverage** | 1/9 docs produced facts (feed composition characteristic — 8/9 are data portal updates, not rate decisions) |
| **Reproducibility** | **PASS** — re-extraction produces identical facts |
| **Regression** | **PASS** — Phase A 4/4 PUBLISHABLE, RBA BLOCKED, 0 core files changed |
| **Source-specific code** | **0** — verified by hash comparison, diff audit, and grep across all .py files |

---

## Final Verdict

### **CLEARED**

The reported SNB PASS survives independent verification. All 10 checks passed. No material claim could not be reproduced from the evidence. No discrepancies found.

The evidence chain is preserved:
```
c09de13 → 146aa3b → 7710a84 → a363d9d → de64f31
```

No code was modified during this review. No remediation was performed. No merges were executed.

---

## Audit Report Only

This document is an audit report. It contains no code modifications, no configuration changes, no Contract updates, and no website changes. Pipeline runtime (11.17s) is not onboarding time. No commercial success rate is calculated or promoted.

# Gate 5 Validation Record — Bundesbank

**Source**: Deutsche Bundesbank
**Gate 5 rank**: 2 of 5 (representative sample)
**Validation date**: 2026-08-15
**Branch**: `top20-prescreening`
**Queue baseline**: V1.1 (`001d349`)
**Pre-screening evidence**: `4443553` (SQR_BUNDESBANK_PRESCREENING.md)
**Type**: Gate 5 first-attempt validation — config-only, no source-specific code, no remediation.

---

## Pre-screen Prediction (from `4443553`)

| Gate | Pre-screen result | Prediction for Gate 5 |
|------|-------------------|----------------------|
| Gate 1 (Access) | PASS | RSS feed accessible; pipeline will fetch documents |
| Gate 2 (Provenance) | PASS | RSS `<pubDate>` + `<dc:date>` available for provenance |
| Gate 3 (Content) | PASS | Static HTML + RSS descriptions substantive |
| Gate 4 (Applicability) | PASS (candidate) | Configuration category appears applicable; Gate 5 will determine actual extraction |
| Routing | QUALIFICATION_READY (no qualifier) | Candidate for standard onboarding path |

**Overall prediction**: QUALIFICATION_READY — expected to pass Gate 5 with config-only onboarding.

---

## Gate 5 Configuration

| Field | Value |
|-------|-------|
| Source code | `BUNDESBANK` |
| Source type | `central_bank` |
| Feed URL | `https://www.bundesbank.de/service/rss/en/633306/feed.rss` (Latest feed) |
| Feed format | `rss` (default — RSS 2.0) |
| Rate patterns | `[]` (empty — no pattern category forced per user constraint) |
| Content keywords | `[]` (empty — no filtering) |
| Event type | `press_release` (generic) |
| Source-specific code | 0 (none) |

**Configuration principle**: Minimum configuration based on pre-screening findings only. No pattern category forced in advance.

---

## Gate 5 Execution Result

### Pipeline state

| Field | Value |
|-------|-------|
| Pipeline state | **DOCUMENTED** (stopped at step 2 — normalization succeeded, extraction returned 0 facts) |
| Access status | `open` |
| Fetch method | `urllib` |
| Reproducible | `False` |

### Document counts

| Step | Count |
|------|-------|
| Documents fetched | 10 (RSS items parsed) |
| Documents normalized | 10/10 (all normalized) |
| Facts extracted | **0** |
| Events detected | 0 |
| Evidence records | 0 |
| Provenance chains | 0 |
| Intelligence objects | 0 |

### Quality metrics

| Field | Value |
|-------|-------|
| Output quality | `reject` |
| Source-specific code | 0 |
| Onboarding classification | `config_only` |
| Engineering intervention | `False` |

---

## Prediction Assessment

| Dimension | Prediction | Actual | Correct? |
|-----------|------------|--------|----------|
| Access (Gate 1) | PASS | PASS — 10 docs fetched via urllib | ✅ CONFIRMED |
| Provenance (Gate 2) | PASS | NOT TESTED — 0 facts → 0 provenance chains | ⚠️ UNTESTED |
| Content (Gate 3) | PASS | PASS — 10/10 docs normalized | ✅ CONFIRMED |
| Applicability (Gate 4) | Candidate applicable | 0 facts extracted (no patterns defined) | ❌ NOT CONFIRMED |
| Overall Gate 5 | QUALIFICATION_READY → expected PASS | **FAIL** (DOCUMENTED, not PUBLISHABLE) | ❌ NOT CONFIRMED |

### Prediction result

**PARTIALLY CONFIRMED** — access and content predictions correct; extraction not confirmed.

---

## Root Cause Analysis

Same root cause as US Treasury: no extraction patterns defined → 0 facts extracted → pipeline stops at DOCUMENTED.

Bundesbank's RSS feed contains press releases about federal securities auctions, counterfeits, procurement — content that doesn't match the existing `rate_patterns` (which are designed for monetary policy rate decisions). Without specific patterns for auction results or securities announcements, the extractor returns 0 facts.

---

## Gate 5 Verdict

| Field | Value |
|-------|-------|
| Gate 5 result | **FAIL** (DOCUMENTED; 0 IOs) |
| Prediction correctness | **PARTIALLY CONFIRMED** (access + content correct; extraction not confirmed) |
| Engineering required? | No |
| Config-only? | Yes |
| Publishable? | No (0 IOs) |
| Provenance complete? | No (0 provenance chains) |
| Reproducible? | No |
| Root cause | No extraction patterns defined — Gate 4 "candidate applicability" does not predict pattern-level extraction success |

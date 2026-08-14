# Gate 5 Validation Record — Reserve Bank of India (RBI)

**Source**: Reserve Bank of India
**Gate 5 rank**: 4 of 5 (representative sample)
**Validation date**: 2026-08-15
**Queue baseline**: V1.1 (`001d349`)
**Pre-screening evidence**: `4443553` (SQR_RBI_PRESCREENING.md)

---

## Pre-screen Prediction

| Gate | Pre-screen result | Prediction for Gate 5 |
|------|-------------------|----------------------|
| Gate 1 (Access) | PASS | RSS feed accessible; 6 feeds available |
| Gate 2 (Provenance) | PASS | RSS `<pubDate>` + article HTML date agree |
| Gate 3 (Content) | PASS | Static HTML + RSS with full HTML in `<description>` |
| Gate 4 (Applicability) | PASS (candidate) | Configuration category appears applicable |
| Routing | QUALIFICATION_READY (no qualifier) | Candidate for standard onboarding path |

---

## Gate 5 Configuration

| Field | Value |
|-------|-------|
| Feed URL | `https://rbi.org.in/pressreleases_rss.xml` (RSS 2.0) |
| Rate patterns | `[]` (empty — no pattern category forced) |
| Source-specific code | 0 |

---

## Gate 5 Execution Result

| Field | Value |
|-------|-------|
| Pipeline state | **DOCUMENTED** |
| Documents fetched | 10 (RSS items) |
| Documents normalized | 10/10 |
| Facts extracted | **0** |
| Intelligence objects | 0 |
| Onboarding classification | `config_only` |

---

## Prediction Assessment

| Dimension | Prediction | Actual | Correct? |
|-----------|------------|--------|----------|
| Access (Gate 1) | PASS | PASS — 10 docs fetched | ✅ CONFIRMED |
| Content (Gate 3) | PASS | PASS — 10/10 normalized | ✅ CONFIRMED |
| Applicability (Gate 4) | Candidate applicable | 0 facts (no patterns) | ❌ NOT CONFIRMED |
| Overall Gate 5 | QUALIFICATION_READY | **FAIL** (DOCUMENTED, 0 IOs) | ❌ NOT CONFIRMED |

**Prediction result**: PARTIALLY CONFIRMED — same pattern as Sources 1-3.

---

## Gate 5 Verdict

| Field | Value |
|-------|-------|
| Gate 5 result | **FAIL** (DOCUMENTED; 0 IOs) |
| Engineering required? | No |
| Config-only? | Yes |
| Root cause | No extraction patterns defined — same gap as all previous sources |

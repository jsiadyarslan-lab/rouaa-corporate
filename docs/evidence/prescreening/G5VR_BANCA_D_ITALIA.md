# Gate 5 Validation Record — Banca d'Italia

**Source**: Banca d'Italia
**Gate 5 rank**: 3 of 5 (representative sample)
**Validation date**: 2026-08-15
**Branch**: `top20-prescreening`
**Queue baseline**: V1.1 (`001d349`)
**Pre-screening evidence**: `4443553` (SQR_BANCA_D_ITALIA_PRESCREENING.md)
**Type**: Gate 5 first-attempt validation — config-only, no source-specific code, no remediation.

---

## Pre-screen Prediction (from `4443553`)

| Gate | Pre-screen result | Prediction for Gate 5 |
|------|-------------------|----------------------|
| Gate 1 (Access) | PASS | HTML index accessible; pipeline will fetch documents |
| Gate 2 (Provenance) | PASS | `bdi-titlepagev2-date` field available |
| Gate 3 (Content) | PASS | Static HTML + PDF enclosures substantive |
| Gate 4 (Applicability) | PASS (candidate) | Configuration category appears applicable |
| Routing | QUALIFICATION_READY (no qualifier) | Candidate for standard onboarding path |

---

## Gate 5 Configuration

| Field | Value |
|-------|-------|
| Source code | `BANCA_D_ITALIA` |
| Feed URL | `https://www.bancaditalia.it/media/comunicati/index.html` |
| Feed format | `html_index` |
| Link pattern | `/media/comunicati/documenti/[^"']+\.pdf` |
| Rate patterns | `[]` (empty — no pattern category forced) |
| Source-specific code | 0 |

---

## Gate 5 Execution Result

| Field | Value |
|-------|-------|
| Pipeline state | **DOCUMENTED** |
| Documents fetched | 10 (PDF press releases) |
| Documents normalized | 10/10 (PDF text extraction succeeded) |
| Facts extracted | **0** |
| Intelligence objects | 0 |
| Output quality | `reject` |
| Onboarding classification | `config_only` |
| Engineering intervention | `False` |

**Notable**: PDF normalization worked — the pipeline detected PDF content via magic bytes (`%PDF-`) and extracted text using pdfplumber. This is an existing pipeline capability (from BIS_QR source). No engineering was needed for PDF handling.

---

## Prediction Assessment

| Dimension | Prediction | Actual | Correct? |
|-----------|------------|--------|----------|
| Access (Gate 1) | PASS | PASS — 10 PDFs fetched | ✅ CONFIRMED |
| Content (Gate 3) | PASS | PASS — 10/10 PDFs normalized (text extracted) | ✅ CONFIRMED |
| Applicability (Gate 4) | Candidate applicable | 0 facts (no patterns) | ❌ NOT CONFIRMED |
| Overall Gate 5 | QUALIFICATION_READY | **FAIL** (DOCUMENTED, 0 IOs) | ❌ NOT CONFIRMED |

### Prediction result

**PARTIALLY CONFIRMED** — access and content predictions correct; extraction not confirmed. Same pattern as Sources 1 and 2.

---

## Gate 5 Verdict

| Field | Value |
|-------|-------|
| Gate 5 result | **FAIL** (DOCUMENTED; 0 IOs) |
| Prediction correctness | **PARTIALLY CONFIRMED** |
| Engineering required? | No |
| Config-only? | Yes |
| Publishable? | No |
| Root cause | No extraction patterns defined — same gap as US Treasury and Bundesbank |

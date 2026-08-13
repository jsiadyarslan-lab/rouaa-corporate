# Evidence Matrix V2

**Date**: 2026-08-13
**Branch**: `evidence-matrix`
**Predecessor**: Evidence Matrix V1 (`934feb7`)
**New evidence**: SNB Cross-Class Validation (`c09de13`)

---

## Evidence Base (Updated)

| Commit | Description | Branch |
|--------|-------------|--------|
| `de64f31` | Frozen pipeline baseline | `pipeline-b-closure` |
| `a363d9d` | B-Closure remediation + STOP | `pipeline-b-closure` |
| `7710a84` | Supported Source Contract v1.0 | `pipeline-b-closure` |
| `146aa3b` | Extraction Hardening CLEARED | `extraction-hardening` |
| `c8af140` | BEA first-attempt PASS | `new-source-validation` |
| `27294db` | ESMA RSS first-attempt FAIL | `new-source-validation-esma` |
| `8041cda` | ESMA HTML first-attempt FAIL | `esma-html-validation` |
| `c09de13` | **SNB first-attempt PASS** (NEW) | `new-source-validation-snb` |

---

## Matrix — 3 Distinct Sources × 18 Dimensions

### Note on ESMA

ESMA was tested twice (RSS and HTML). Both are the **same source** with different adapter paths. ESMA counts as **1 source** for source-level analysis, but **2 adapter tests** for adapter-level analysis.

| Dimension | BEA | ESMA (RSS) | ESMA (HTML) | SNB |
|-----------|-----|-----------|-------------|-----|
| **Source class** | statistical_authority | financial_regulator | financial_regulator | central_bank |
| **Access** | PASS | PASS | PASS | PASS |
| **Fetch** | PASS (10 docs) | PASS (10 docs) | PASS (10 docs) | PASS (10 docs) |
| **Normalization** | PASS (10/10) | PASS (10/10) | PASS (10/10) | PASS (9/10) |
| **Extraction** | PASS (237 facts) | PASS (122 facts) | PASS (122 facts) | PASS (4 facts) |
| **Event detection** | PASS (10 events) | PASS (10 events) | PASS (10 events) | PASS (1 event) |
| **Evidence construction** | PASS (237 chains) | PASS (122 chains) | PASS (122 chains) | PASS (4 chains) |
| **Semantic validation** | PASS (0 errors) | PASS (0 errors) | PASS (0 errors) | PASS (0 errors) |
| **Reproducibility** | PASS | PASS | PASS | PASS |
| **Provenance** | PASS (100%) | FAIL (0%) | FAIL (0%) | PASS (100%) |
| **Publishability** | PASS (10/10) | FAIL (0/10) | FAIL (0/10) | PASS (1/1) |
| **Core intervention** | 0 | 0 | 0 | 0 |
| **Source-specific code** | 0 | 0 | 0 | 0 |
| **Config-only** | Yes | Yes | Yes | Yes |
| **First attempt** | PASS | FAIL | FAIL | PASS |
| **Onboarding** | PASS | FAIL | FAIL | PASS |
| **Intelligence Quality** | PASS | n/a | n/a | PASS |
| **Pipeline runtime** | 15.2s | 9.6s | 9.68s | 11.17s |
| **Failure reason** | — | document_date empty (no pubDate) | document_date empty (no date in URL) | — |

### Extraction Coverage (separate dimension)

| Source | Docs normalized | Docs with facts | Facts total | Coverage note |
|--------|----------------|-----------------|-------------|---------------|
| BEA | 10 | 10 | 237 | Full coverage — all docs are statistical releases |
| ESMA | 10 | 10 | 122 | Full extraction — all docs produced facts |
| SNB | 9 | 1 | 4 | 1/9 docs contained rate decision text; 8/9 are data portal updates (expected — feed mixes content types) |

**Coverage is independent from onboarding.** SNB's 1/9 is a feed composition characteristic, not an onboarding failure.

---

## Independent Validation Review of SNB (`c09de13`)

### 8 Checks Performed

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 1 | SNB genuinely new before test | PASS | SNB count = 0 in all 6 prior branches; not in PHASE_A or PHASE_B source lists |
| 2 | `c09de13` contains config only | PASS | 5 files changed: source_configs.py (+39 lines) + 4 output files. All 8 core files: 0 diff lines |
| 3 | document_date from dc:date | PASS | Feed has no `<pubDate>`, has `<dc:date>` = 2026-08-12T12:30:00Z. Parser extracted it. IO document_date = 2026-07-16T07:30:00Z (from the monetary policy assessment item). |
| 4 | 4 facts semantically correct | PASS | All 4 facts verified against source text: "decided to leave the SNB policy rate unchanged at 0%". rate_decision=leave, policy_rate=0. Evidence excerpts trace to source. |
| 5 | 1 publishable IO doesn't hide problems | PASS | 8/9 other docs are "Data portal" updates (exchange rates, balance sheets) — they contain "rate" and "monetary policy" in navigation text but no rate decision language. 0 facts is correct for these docs. |
| 6 | No regression against 146aa3b | PASS | 0 core code changes between 146aa3b and c09de13. Phase A configs load correctly. Regression is structurally impossible. |
| 7 | No source-specific logic | PASS | 0 SNB references in any core file. 0 `if source ==` branches. SNB config is a pure data dict entry. |
| 8 | Dimension separation | PASS | Onboarding (PASS), Quality (PASS), Coverage (1/9 — documented), Provenance (100%), Runtime (11.17s — NOT onboarding time) all recorded separately. |

**Independent Validation Review: CLEARED**

---

## Inference Layers (Updated)

### Layer 1: Observed

1. BEA (statistical_authority, RSS with `<pubDate>`) → Onboarding PASS, Quality PASS, 10/10 publishable.
2. ESMA (financial_regulator, RSS without `<pubDate>`) → Onboarding FAIL, 0/10 publishable (document_date empty).
3. ESMA (financial_regulator, HTML with slug URLs) → Onboarding FAIL, 0/10 publishable (same root cause).
4. **SNB (central_bank, RSS with `<dc:date>`) → Onboarding PASS, Quality PASS, 1/1 publishable.** (NEW)
5. All 4 tests required 0 core code modifications and 0 source-specific code.
6. All 4 tests passed reproducibility and had 0 semantic errors.
7. ESMA's dates exist in content text but not in feed metadata or URLs. SNB's dates are available via `<dc:date>` (Dublin Core), which the parser supports.
8. SNB's 1/9 documents producing facts is because the RSS feed mixes monetary policy assessments with data portal updates — 8/9 docs are not rate decisions.

### Layer 2: Supported Inference

1. **Configuration-only onboarding has been demonstrated across 2 distinct institutional classes** (statistical_authority + central_bank) with complete provenance. (BEA + SNB)

2. **The provenance boundary is the primary configuration abstraction limit observed.** Sources that provide dates via standard paths (`<pubDate>`, `<dc:date>`, URL `\d{8}`, config `published_at`) can achieve publishable output. Sources that provide dates only in content text cannot — within the tested pipeline state.

3. **The pipeline's extraction, event detection, and evidence construction layers are source-class-agnostic.** 3 classes tested (statistical, regulator, central bank) — all produced facts, events, and evidence chains through the same configuration-driven patterns.

4. **Access compatibility does not guarantee provenance compatibility** (confirmed). ESMA passed 8/10 pipeline stages but failed provenance. SNB passed all stages including provenance.

5. **Extraction coverage is source-specific, not pipeline-specific.** BEA had 10/10 docs with facts; SNB had 1/9. This reflects feed composition, not pipeline capability.

6. **The `<dc:date>` path works.** SNB uses Dublin Core dates (not `<pubDate>`), and the parser extracts them correctly. This extends the "supported date paths" beyond `<pubDate>` and URL patterns.

### Layer 3: Not Established

1. **A source-onboarding success rate cannot be calculated.** 3 distinct sources tested: 2 PASS, 1 FAIL. This is not a statistically meaningful rate.

2. **Pipeline runtime is not onboarding time.** 15.2s / 9.6s / 9.68s / 11.17s are execution times. Human onboarding time was not independently measured.

3. **It is NOT established that configuration-only onboarding will generalize to all source classes.** 2 PASS (statistical, central bank) + 1 FAIL (regulator) does not establish a pattern. More sources are needed.

4. **It is NOT established that ESMA is "unsupported."** ESMA is unsupported through the tested paths (RSS and HTML index). The `<dc:date>` path (which worked for SNB) was not tested for ESMA because ESMA's RSS has no `<dc:date>`.

5. **It is NOT established that the pipeline cannot extract dates from content text.** What is established: the RSS parser and HTML index adapter did not extract dates from ESMA's content text. Other approaches were not tested.

6. **First-attempt onboarding economics remain an evidence gap.** All 3 sources were onboarded by the pipeline designer, not an independent onboarding engineer.

---

## Commercial Claims — Updated Evidence Boundary

### What We Can Say Now

> Configuration-only onboarding has been demonstrated for 2 genuinely new sources across 2 distinct institutional classes (statistical_authority + central_bank), with complete provenance, reproducibility, and 0 core code changes.

> The pipeline supports date extraction from 3 standard paths: RSS `<pubDate>`, Dublin Core `<dc:date>`, and URL `\d{8}` patterns. Sources using these paths can achieve publishable output through configuration.

> Access compatibility does not guarantee provenance compatibility. A source may pass access, fetch, normalization, extraction, event detection, evidence construction, semantic validation, and reproducibility — yet fail to produce publishable output if the provenance layer cannot obtain `document_date`.

### What We Can Say After More Samples

> A source-onboarding success rate after testing 10+ genuinely new sources across 3+ institutional classes.

> Onboarding economics (P50/P90 time, first-attempt success rate) after independent measurement by an onboarding engineer who did not design the pipeline.

### What We Cannot Say Based on This Test

> "ROUA supports all official sources." — Not tested.

> "Onboarding is always configuration-only." — ESMA disproves this for the tested paths.

> "2/3 success rate" — Sample too small; ESMA counts as 1 source with 2 adapter tests, not 2 independent sources.

> Pipeline runtime = onboarding time. — These are different measurements.

> "The pipeline cannot extract dates from content text." — Not tested broadly enough.

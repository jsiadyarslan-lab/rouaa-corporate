# Delta Report 08 — `source-explorer.html` vs Product Family Consolidation Spec v3

> **Status:** Second Inspection-category test. First test of Spec v3 (with D.10 + softened `.card-evidence` + expanded taxonomy scope).
> **Audited file:** `/home/z/my-project/rouaa-corporate/rouaa-web/source-explorer.html` (1679 lines)
> **Reference:** `PRODUCT-FAMILY-CONSOLIDATION-SPEC.md` v3 (commit `4857217`)
> **Method:** No code modification. Acceptance Contract applied across ALL implementation layers (HTML + CSS + SVG + JS + content claims + full taxonomy scan).
> **Acceptance Verdict:** **FAIL** — D.8 ("Real-time feed monitoring") + D.11 (NEW: non-canonical raw hex colors) + D.12 (NEW: no direct source links) + D.13 (NEW: "24/7" timing claim).

---

## Classification Framework (Same A/B/C/D + Spec v3 Acceptance)

| Category | Meaning |
|---|---|
| **A** | Must match — system primitives |
| **B** | Must adapt to category nature (Inspection) |
| **C** | Must NOT transfer from Homepage or Decision Environments |
| **D** | Real defect — must fix |

**Acceptance Contract (v3):** PASS requires safety across ALL implementation layers (HTML + CSS + SVG + JS + content claims + full taxonomy). Any FORBID violation in ANY layer = FAIL.

---

# PART 1 — STRUCTURAL FACTS

## 1.1 CSS / JS Stack

| Component | Loaded | Notes |
|---|---|---|
| `roua-v7.css` | ✓ | |
| `roua-v7-patch.css` | ✓ | |
| `styles.css` | ✗ NOT loaded | Same as all prior pages |
| **Inline `<style>` block** (lines 13–391) | ✓ | **NOT dead code** — defines `.explorer-layout`, `.filter-panel`, `.filter-group`, `.filter-item`, `.source-table`, `.source-row`, `.source-entry`, `.source-detail`, `.detail-grid`, `.detail-cell`, `.status-badge`, `.registry-stats`, `.stat-card`, `.concept-badge`, `.registry-definition`, `.status-legend` — the Explorer's interactive filter/table/detail design system. ~378 lines. |
| `main.js` | ✓ | |
| `design-system/roua-v7.js` | ✓ | |

**Key finding:** Source Explorer has the **most sophisticated Explorer UX** — a filter panel (left sidebar) + source table with expandable `<details>` rows + detail grid with 9 metadata fields per source. This is a **B-category adaptation** — correct for an Inspection page that needs source-registry browsing.

## 1.2 Token Usage

| Token Family | Usage | Verdict |
|---|---|---|
| `--roua-*` aliases | Used throughout most CSS + inline styles | ✓ Mostly correct |
| `var(--gold)` direct (D.6) | **0 instances** | ✓ D.6 absent |
| `rgba(201, 162, 39, ...)` (OLD gold, D.2) | **2 instances** (lines 189, 353) | ⚠ **D.2 PRESENT** |
| **Raw hex values (non-canonical)** | **3 values: `#2DBA8E`, `#4A90D9`, `#F5A623`** | ⚠ **NEW D.11** (see below) |
| Raw hex from deprecated palette (D.7) | **0 instances** | ✓ D.7 absent (no `#C9A227`, `#0B0F18`, etc.) |

### D.11 (NEW) — Non-canonical raw hex colors

| Hex value | Where used | What it should be |
|---|---|---|
| `#2DBA8E` | Lines 145, 334, 521, 1521, 1522 — `.status-badge.healthy` color, `.legend-badge.healthy` color, "Source Categories" stat value color, Source Lifecycle "Discovery" stage color | Should be `var(--roua-green)` = `#10B981` (canonical green). `#2DBA8E` is a DIFFERENT green — not in any token. |
| `#4A90D9` | Lines 1526, 1527, 1531, 1532 — Source Lifecycle "Verification" + "Classification" stage colors | Should be `var(--roua-blue)` = `#4F8CFF` (canonical blue). `#4A90D9` is a DIFFERENT blue — not in any token. |
| `#F5A623` | Lines 145, 334, 521, 1566 — `.status-badge.warning` color, `.legend-badge.warning` color, "Source Categories" stat value color, "Real-time feed monitoring" context | Should be `var(--roua-amber)` = `#F59E0B` (canonical amber). `#F5A623` is a DIFFERENT amber — not in any token. |

**This is a new defect type.** D.7 covers deprecated hex from `VISUAL-IDENTITY-SYSTEM.md`. D.11 covers **non-canonical raw hex** — colors that don't match ANY token (canonical or deprecated). These are "off-brand" colors that drifted from the token system entirely.

## 1.3 Page Structure

```
Navigation (lines 397–486)
1. Page Hero — .page-hero (lines 488–506)
2. Registry Stats — 4 stat cards (lines 508–529)
3. What the Registry Records (lines 531–545)
4. Explorer — Filter panel + Source table with 15 expandable entries (lines 547–1509)
5. Source Lifecycle — 6-stage vertical flow (lines 1511–1553)
6. Monitoring Methods — 6 ingestion adapters (lines 1555–1590)
7. CTA — Cross-link to Source Registry (lines 1592–1617)
Footer (lines 1619–1677)
```

- `<section>` count: **6** (vs Evidence Explorer 15, Architecture 15)
- `<div>` balance: 649 / 649 ✓ PASS
- `<section>` balance: 6 / 6 ✓ PASS
- `<details>` balance: 15 / 15 ✓ PASS (15 expandable source entries)
- `<summary>` balance: 15 / 15 ✓ PASS
- HTML comment balance: 13 / 13 ✓ **PASS**

## 1.4 HTML Integrity

| Check | Result |
|---|---|
| `<div>` balance | 649 / 649 ✓ PASS |
| `<section>` balance | 6 / 6 ✓ PASS |
| `<details>` balance | 15 / 15 ✓ PASS |
| `<summary>` balance | 15 / 15 ✓ PASS |
| HTML comment balance | 13 / 13 ✓ PASS |
| Broken internal anchors | None ✓ |
| Dead `<style>` block (D.1) | ✗ ABSENT — the inline `<style>` is the Explorer's design system, NOT dead code |

## 1.5 Unique Structural Elements (Explorer-specific)

Source Explorer has its OWN interactive source-registry browsing system:
- `.explorer-layout` — 2-column grid (220px filter sidebar + 1fr source table)
- `.filter-panel` — sticky sidebar with 3 filter groups (Source Type, Jurisdiction, Status)
- `.filter-item` — checkbox + label + count
- `.source-table` — table with header row + 15 expandable entries
- `.source-entry` — `<details>` element with `<summary>` (clickable row) + `.source-detail` (expanded grid)
- `.detail-grid` — 3-column grid with 9 `.detail-cell` items per source
- `.status-badge.healthy` / `.status-badge.warning` — status indicators
- `.status-legend` — 2-column legend explaining status badges
- `.registry-stats` — 4-card stat row
- `.registry-definition` — gold-bordered definition panel

**Verdict:** This is the **most functionally sophisticated Explorer** — filter + table + expandable detail. Correct B-category adaptation for an Inspection page that needs source-registry browsing.

---

# PART 2 — ACCEPTANCE CONTRACT EVALUATION (Spec v3)

## Layer 1 — Canonical Baseline (across ALL implementation layers)

### 1.1 Token System

| Rule | Status | Notes |
|---|---|---|
| Use `--roua-*` aliases | ✓ PASS | Most CSS + inline uses aliases |
| Never use raw hex in CSS or inline styles | ✗ **FAIL** | 3 non-canonical hex values (`#2DBA8E`, `#4A90D9`, `#F5A623`) in inline styles (D.11 NEW) |
| Never use raw hex in SVG `fill`/`stroke` | ✓ PASS | No SVG diagrams with hex colors |
| Never use raw hex in Canvas/Three.js | ✓ PASS | No Three.js/Canvas |
| Never use `rgba(201, 162, 39, ...)` | ✗ **FAIL** | 2 instances (D.2): lines 189, 353 |
| Never use `var(--gold)` directly | ✓ PASS | 0 instances (D.6 absent) |

**Layer 1.1 verdict:** **FAIL** — D.2 (2 instances) + D.11 (3 non-canonical hex values, ~8 instances total).

### 1.2 Container & Layout

| Rule | Status |
|---|---|
| Use `.container` (1200px max) | ✓ PASS |
| Section padding | ✓ PASS |
| Alternating bands | ✓ PASS |

**Layer 1.2 verdict:** **PASS**

### 1.3 Navigation

| Rule | Status |
|---|---|
| `.navbar` + `.nav-container` + `.nav-logo` + `.nav-links` | ✓ PASS |
| Products dropdown: 6 links (no Trading Desks) | ✓ PASS |
| Solutions dropdown: 7 links | ✓ PASS |
| Mobile hamburger | ✓ PASS (line 483) |
| **Active nav state** | ✓ PASS — on Experience dropdown (line 452), correct (Source Explorer is under Experience) |

**Layer 1.3 verdict:** **PASS** — Source Explorer is the **fourth page** (after Developer + Architecture + Evidence Explorer) with active nav state.

### 1.4 Buttons

| Rule | Status |
|---|---|
| Primary: `.btn .btn-primary` | ✓ PASS |
| Secondary: `.btn .btn-secondary` | ✓ PASS |
| Pill-shaped | ✓ PASS |

**Layer 1.4 verdict:** **PASS**

### 1.5 Footer

| Rule | Status |
|---|---|
| 6 columns | ✓ PASS |
| NO "Channels" column | ✓ PASS |

**Layer 1.5 verdict:** **PASS**

### 1.6 Card Hierarchy

| Rule | Status | Notes |
|---|---|---|
| Evidence-first card pattern (`.card-evidence` OR equivalent) | ✓ PASS | Uses custom `.source-entry` + `.source-detail` system — equivalent evidence-first pattern with no hover theatrics, no ambient motion, dense metadata (9 fields per source) |
| `.cx` hover theatrics | ✗ ABSENT | Correct — Spec FORBID on Explorer |
| `.card-accent` marketing | ✗ ABSENT | Correct — not marketing page |

**Layer 1.6 verdict:** **PASS** — v3 softened rule (`.card-evidence` OR equivalent) accepts Source Explorer's custom system.

### 1.7 Motion

| Rule | Status |
|---|---|
| Entrance reveals | ✓ PASS (no `.rv` class, but Explorer uses CSS transitions on hover/expand — user-triggered, not ambient) |
| `glass-status-dot` pulse | ✗ ABSENT (correct — Explorer is not Decision Environment) |
| Homepage ambient motion | ✗ ABSENT (correct) |
| `prefers-reduced-motion` | ✓ PASS (only CSS transitions, no auto-playing animation) |

**Layer 1.7 verdict:** **PASS** — Zero ambient motion. Only user-triggered transitions (hover, expand/collapse).

### 1.8 Typography

| Rule | Status |
|---|---|
| Inter sans + Fira Code mono | ✓ PASS |
| Sans/mono separation | ✓ PASS |

**Layer 1.8 verdict:** **PASS**

### 1.9 Trust Grammar (Forbidden Phrases)

| Phrase | Count | Verdict |
|---|---|---|
| "audit-ready" / "Audit-Ready" | 0 | ✓ PASS |
| "within seconds" / "in seconds" | 0 | ✓ PASS |
| **"real-time" / "real time"** | **1** (line 1566) | ✗ **FAIL — D.8 FORBID violation** |
| "instantly" / "instant" | 0 | ✓ PASS |
| "continuously monitored" | 0 | ✓ PASS |
| "every claim" | 0 | ✓ PASS |
| "VERIFIED INTELLIGENCE OBJECT" | 0 | ✓ PASS |
| "Trust Promise" | 0 | ✓ PASS |
| "Provenance Immutability" | 0 | ✓ PASS |
| "confidence score" / "confidence scored" | 0 | ✓ PASS |
| "SOC 2" / "ISO 27001" | 0 | ✓ PASS |

**Layer 1.9 verdict:** **FAIL** — D.8 ("Real-time feed monitoring" at line 1566).

### 1.10 Taxonomy (Full Content Scan — v3 expanded scope)

| Old term (FORBID) | Count | Verdict |
|---|---|---|
| "Trading Intelligence" (alone) | 0 | ✓ PASS |
| "Institutional Intelligence" (as product name) | 0 | ✓ PASS (2 instances of "institutional intelligence products" in footer brand — descriptive use, same as all other pages' footers, NOT product name) |
| "Developer Intelligence" | 0 | ✓ PASS |
| "Developer APIs" | 0 | ✓ PASS |
| "Market Intelligence" (alone as product name) | 0 | ✓ PASS |

**Layer 1.10 verdict:** **PASS** — D.10 ABSENT. Source Explorer is **the first page** (after the 5 product pages) where D.10 does NOT appear. This suggests D.10 is NOT system-wide — it was specific to Evidence Explorer's Step 07 output field.

### Layer 1 Overall Verdict: **FAIL**
D.2 (2 instances) + D.8 (1 instance) + D.11 (NEW: 3 non-canonical hex values, ~8 instances).

---

## Layer 5 — Do-Not-Touch Rules

| Rule | Status | Notes |
|---|---|---|
| Do NOT force Decision Environment grammar onto non-Decision pages | ✓ PASS | Explorer has its own `.explorer-layout` + `.source-entry` grammar |
| Do NOT force product-specific Trust Grammar labels | ✓ PASS | Explorer uses "Source", "Authority / Type", "Jurisdiction", "Official Domain", "Access Method", "Monitoring Status", "Latest Publication", "Last Successful Fetch", "Verification State" — source-registry-specific labels |
| Do NOT add Homepage-brand elements | ✓ PASS | Zero Homepage-brand elements (all 11 checked = 0) |
| Do NOT force `.hero-split` + `.glass-status-card` | ✓ PASS | Explorer uses `.page-hero` (single-column) |
| Do NOT force `.card-accent` marketing cards | ✓ PASS | Explorer uses custom `.source-entry` + `.source-detail` |
| Do NOT force product-specific motion patterns | ✓ PASS | Explorer has zero ambient motion |
| Do NOT add `.cx` hover theatrics on evidence rows | ✓ PASS | Zero `.cx` usage |

**Layer 5 verdict:** **PASS** — the Spec correctly does NOT force Decision Environment or Homepage grammar onto the Inspection page.

---

## Layer 6 — Explorer-Specific Rules (Spec v3 Layer 6.3)

| Rule | Status | Notes |
|---|---|---|
| Must use evidence-first card pattern (`.card-evidence` OR equivalent) | ✓ PASS | Custom `.source-entry` + `.source-detail` system with no hover theatrics, no ambient motion, dense metadata (9 fields per source), direct source links (see D.12 below) |
| Must NOT use `.cx` hover theatrics | ✓ PASS | Zero `.cx` usage |
| Minimal motion — zero animation | ✓ PASS | Only user-triggered CSS transitions |
| Dense metadata (mono labels, provenance, source links) | ✓ PASS | 9 metadata fields per source: Source, Authority/Type, Jurisdiction, Official Domain, Access Method, Monitoring Status, Latest Publication, Last Successful Fetch, Verification State |
| **Direct links to official sources** | ✗ **FAIL** | **D.12 (NEW)** — Source Explorer shows "Official Domain: federalreserve.gov" as TEXT, not as a clickable link. Zero external links to official sources. Evidence Explorer had 6 direct links; Source Explorer has 0. |
| Must use "Verified Fact/Event" labels | N/A | Source Explorer is about sources, not facts/events. Uses "Verification State: Verified" instead — acceptable adaptation. |
| Must include "Inspect in Evidence Explorer" continuity links | ✓ PASS | CTA section (line 1592) cross-links to `source-registry.html` |
| Must provide UX inspection test PASS | ⚠ PARTIAL | See UX test below |

**Layer 6 verdict:** **PARTIAL FAIL** — D.12 (no direct source links). All other Explorer rules PASS.

### UX Inspection Test

> User asked: "Can the user quickly inspect Source → Document → Evidence → Provenance → Context?"

**Source Explorer is a SOURCE REGISTRY, not an evidence inspector.** Its UX purpose is different from Evidence Explorer:

| Inspection chain step | Present? | Notes |
|---|---|---|
| Source (official institution) | ✓ | 15 source entries with full metadata |
| Document (publication) | ✓ | "Latest Publication" field per source |
| Evidence | ✗ | Not in scope — Source Explorer is about sources, not evidence chains |
| Provenance | ✗ | Not in scope |
| Context | ✗ | Not in scope |

**Verdict:** The UX inspection test is **NOT APPLICABLE** to Source Explorer in the same form as Evidence Explorer. Source Explorer's purpose is to **browse and inspect source registry metadata** (source identity, jurisdiction, type, monitoring status), not to trace evidence chains.

**Spec v4 recommendation:** Clarify that the UX inspection test (`Source → Document → Evidence → Provenance → Context`) applies to **Evidence Explorer** specifically, not all Explorer-category pages. Source Explorer has its own UX test: "Can the user quickly inspect Source → Identity → Jurisdiction → Type → Monitoring Status → Official Domain?"

**Source Explorer's own UX test: PASS** — The filter panel + expandable source entries + 9-field detail grid allows the user to quickly inspect any source's registry metadata. The expand/collapse interaction is fast and clear.

---

## Layer 4 — Confirmed Defects (D.1–D.10 + new)

| ID | Defect | Present? | Details |
|---|---|---|---|
| D.1 | Dead `<style>` block | ✗ ABSENT | Inline `<style>` is the Explorer's design system |
| **D.2** | Old-gold `rgba(201, 162, 39, ...)` | **✓ PRESENT — 2 instances** | Lines 189 (`.concept-badge` bg), 353 (`.registry-definition` gradient bg) |
| D.3 | Malformed HTML comment | ✗ ABSENT | 13/13 comment balance PASS |
| D.4 | "Audit-Ready" violation | ✗ ABSENT | 0 instances |
| D.5 | Bloomberg naming | ✗ ABSENT | 0 instances |
| D.6 | `var(--gold)` base token | ✗ ABSENT | 0 instances |
| D.7 | Deprecated raw hex | ✗ ABSENT | 0 deprecated hex values |
| **D.8** | "real time" timing claim | **✓ PRESENT — 1 instance** | Line 1566: "Real-time feed monitoring" (in Monitoring Methods section, RSS adapter description) |
| D.9 | "confidence score/d" | ✗ ABSENT | 0 instances |
| **D.10** | Old taxonomy in content | **✗ ABSENT** | 0 instances — **Source Explorer is CLEAN for D.10** (first non-product page without it) |
| **D.11 (NEW)** | **Non-canonical raw hex colors** | **✓ PRESENT — 3 hex values, ~8 instances** | `#2DBA8E` (green, should be `--roua-green` `#10B981`), `#4A90D9` (blue, should be `--roua-blue` `#4F8CFF`), `#F5A623` (amber, should be `--roua-amber` `#F59E0B`). Used in status badges, stat cards, source lifecycle stages. |
| **D.12 (NEW)** | **No direct source links** | **✓ PRESENT** | Source Explorer shows "Official Domain: federalreserve.gov" as TEXT in `.detail-value`, not as a clickable `<a href>`. Zero external links to official sources. Spec Layer 6.3 requires "Direct links to official sources (like product pages)". |
| **D.13 (NEW)** | **"24/7" timing claim** | **⚠ PRESENT — 1 instance** | Line 525: stat card "24/7" with label "Source Monitoring". This is a timing/freshness claim. Per Spec Layer 1.9, timing claims like "real-time" are FORBID. "24/7" is similar — it implies continuous guaranteed monitoring. **Judgment call: is "24/7" a forbidden timing claim, or an acceptable operational description?** Recommend Spec v4 clarify. |

---

# PART 3 — DRIFT SUMMARY

## A — Must match (system primitives)
| ID | Finding | Verdict |
|---|---|---|
| A.1 | Two nav class systems | **STANDARDIZE** (Explorer uses product-page `.navbar` system — correct) |
| A.2 | `.page-hero` (like Developer + Evidence Explorer) | **KEEP** (B-category — Inspection page) |
| A.3 | Active nav state on Experience | **KEEP** (correct — Source Explorer is under Experience) |

## B — Must adapt to category nature (Inspection)
| ID | Finding | Verdict |
|---|---|---|
| B.1 | Custom `.explorer-layout` + `.source-entry` + `.source-detail` design system (~378 lines CSS) | **KEEP** — correct Inspection adaptation |
| B.2 | Filter panel (sticky sidebar with 3 filter groups) | **KEEP** — correct source-registry browsing UX |
| B.3 | Expandable source entries (`<details>` + `<summary>` with 9-field detail grid) | **KEEP** — correct Inspection density |
| B.4 | Status legend (healthy + warning) | **KEEP** — correct monitoring-status explanation |
| B.5 | Registry stats (4-card row) | **KEEP** — correct overview |
| B.6 | Source Lifecycle (6-stage vertical flow) | **KEEP** — correct governance explanation |
| B.7 | Monitoring Methods (6 ingestion adapters) | **KEEP** — correct technical explanation |
| B.8 | Zero ambient motion (only user-triggered transitions) | **KEEP** — correct Inspection restraint |
| B.9 | `.page-hero` single-column Hero | **KEEP** — correct for non-Decision Environment |

## C — Must NOT transfer from Homepage or Decision Environments
| ID | Finding | Verdict |
|---|---|---|
| C.1–C.14 | All 14 Homepage-brand elements | ✓ **All correctly absent** |
| C.15 | `.glass-status-card` (Decision Environment) | ✓ Absent |
| C.16 | `.hero-split` (Decision Environment) | ✓ Absent |
| C.17 | `.card-accent` (marketing) | ✓ Absent |
| C.18 | `.cx` hover theatrics | ✓ Absent |

## D — Real defects
| ID | Finding | Severity | Fix |
|---|---|---|---|
| **D.2** | 2 instances of `rgba(201, 162, 39, ...)` (lines 189, 353) | **P1 — REPAIR** | Replace with `rgba(227, 180, 90, ...)` |
| **D.8** | 1 instance of "Real-time feed monitoring" (line 1566) | **P1 — REPAIR** | Replace with "Feed monitoring through configured ingestion adapters" or "RSS feed monitoring" |
| **D.11 (NEW)** | 3 non-canonical raw hex values (`#2DBA8E`, `#4A90D9`, `#F5A623`) in ~8 instances | **P1 — REPAIR** | Replace with canonical tokens: `#2DBA8E` → `var(--roua-green)`, `#4A90D9` → `var(--roua-blue)`, `#F5A623` → `var(--roua-amber)` |
| **D.12 (NEW)** | No direct source links (0 external links to official sources) | **P1 — REPAIR** | Add `<a href="https://federalreserve.gov" target="_blank" rel="noopener">` to each source's "Official Domain" field |
| **D.13 (NEW)** | "24/7" timing claim (line 525) | **P3 — REVIEW** | Judgment call: is "24/7" a forbidden timing claim (like "real-time") or an acceptable operational description? Recommend Spec v4 clarify. If FORBID, replace with "Continuous" or "Configured". |

---

# PART 4 — ACCEPTANCE VERDICT

## **FAIL**

The page **FAILS** the Acceptance Contract due to:

1. **Layer 1.1 token violations:**
   - D.2: 2 instances of old-gold `rgba(201, 162, 39, ...)` (lines 189, 353)
   - D.11 (NEW): 3 non-canonical raw hex values in ~8 instances (lines 145, 334, 521, 1521, 1522, 1526, 1527, 1531, 1532, 1566)

2. **Layer 1.9 Trust Grammar violation:**
   - D.8: "Real-time feed monitoring" (line 1566)

3. **Layer 6.3 Explorer rule violation:**
   - D.12 (NEW): No direct source links (Spec requires "Direct links to official sources")

4. **Layer 4 confirmed defects:**
   - D.2 (2 instances)
   - D.8 (1 instance)
   - D.11 (NEW — 3 hex values, ~8 instances)
   - D.12 (NEW — 0 external links)
   - D.13 (NEW — "24/7" timing claim, REVIEW)

## What the Spec correctly allowed (Layer 5 + Layer 6 PASS)

Despite the FAIL verdict, the Spec **correctly handled** the Inspection category:

- ✓ Explorer is NOT forced into Decision Environment grammar
- ✓ `.page-hero` (single-column) is accepted
- ✓ Custom `.source-entry` + `.source-detail` system is accepted as evidence-first card pattern (v3 softened rule)
- ✓ `.cx` hover theatrics correctly absent
- ✓ Zero ambient motion is correct for Inspection
- ✓ Active nav state on Experience dropdown is CORRECT
- ✓ D.10 (old taxonomy) is ABSENT — confirms D.10 is NOT system-wide (was specific to Evidence Explorer)

**The Spec v3 works.** The FAIL is due to genuine defects (D.2, D.8, D.11, D.12, D.13), not Spec over-constraint. The v3 softened `.card-evidence` rule correctly accepted Source Explorer's custom system.

---

# PART 5 — NEW DEFECTS D.11 + D.12 + D.13

## D.11 — Non-canonical raw hex colors (NEW)

| Field | Value |
|---|---|
| **Pattern** | Raw hex color values that don't match ANY canonical token (canonical or deprecated). These are "off-brand" colors that drifted from the token system entirely. |
| **D.11 vs D.7 distinction** | D.7 = deprecated hex from `VISUAL-IDENTITY-SYSTEM.md` (`#C9A227`, `#0B0F18`, etc.). D.11 = non-canonical hex that matches NO token at all (`#2DBA8E`, `#4A90D9`, `#F5A623`). |
| **Pages affected** | Source Explorer (Delta 08): `#2DBA8E` (green, should be `--roua-green` `#10B981`), `#4A90D9` (blue, should be `--roua-blue` `#4F8CFF`), `#F5A623` (amber, should be `--roua-amber` `#F59E0B`) |
| **Root cause** | Page was built with ad-hoc color values instead of canonical tokens. The status-badge colors (healthy green, warning amber) and lifecycle-stage colors (discovery green, verification/classification blue) were hardcoded. |
| **Fix** | Replace each non-canonical hex with the corresponding canonical token: `#2DBA8E` → `var(--roua-green)`, `#4A90D9` → `var(--roua-blue)`, `#F5A623` → `var(--roua-amber)` |
| **Fix type** | Page-specific — find-and-replace in inline styles + `<style>` block |
| **Effort** | ~5 minutes |
| **Verdict** | **REPAIR** (P1 priority) |

## D.12 — No direct source links (NEW)

| Field | Value |
|---|---|
| **Pattern** | Source registry page shows "Official Domain: federalreserve.gov" as TEXT in `.detail-value`, not as a clickable `<a href>`. Zero external links to official sources. |
| **Spec rule violated** | Layer 6.3 Explorers: "Direct links to official sources (like product pages)" — **KEEP** |
| **Pages affected** | Source Explorer (Delta 08): all 15 source entries show Official Domain as text, none as clickable link |
| **Pages clean** | Evidence Explorer (Delta 07) — has 6 direct links to official sources |
| **Root cause** | Source Explorer was built as a metadata browser, not an evidence inspector. The "Official Domain" field was treated as display data, not as a link. |
| **Fix** | Add `<a href="https://[official-domain]" target="_blank" rel="noopener">` to each source's "Official Domain" `.detail-value` |
| **Fix type** | Page-specific — 15 source entries need link wrapping |
| **Effort** | ~10 minutes |
| **Verdict** | **REPAIR** (P1 priority) |

## D.13 — "24/7" timing claim (NEW — REVIEW)

| Field | Value |
|---|---|
| **Pattern** | "24/7" used as a timing/freshness stat: "Source Monitoring" stat card shows "24/7" |
| **Spec rule** | Layer 1.9 forbids "real-time", "within seconds", "continuously monitored" (as timing claim). "24/7" is similar — it implies continuous guaranteed monitoring. |
| **Pages affected** | Source Explorer (Delta 08): line 525 |
| **Judgment call** | Is "24/7" a forbidden timing claim (like "real-time") or an acceptable operational description? "24/7" describes the monitoring schedule, not a latency guarantee. However, it still implies a continuous operational commitment that ROUA has not proven. |
| **Fix (if FORBID)** | Replace "24/7" with "Continuous" or "Configured" or "Ongoing" |
| **Fix (if REVIEW)** | Leave as-is, but add illustrative disclaimer: "24/7 monitoring — operational target, not guaranteed uptime" |
| **Verdict** | **REVIEW** (P3 priority — Spec v4 should clarify whether "24/7" is FORBID or acceptable) |

---

# PART 6 — SPEC V4 RECOMMENDATIONS

Based on Delta 08 findings, recommend Spec v4 updates:

| Update | Layer | Detail |
|---|---|---|
| **Add D.11** | Layer 4 | "Non-canonical raw hex colors — raw hex values that don't match ANY canonical token (canonical or deprecated). Distinct from D.7 (deprecated hex). Example: `#2DBA8E` instead of `var(--roua-green)` `#10B981`." |
| **Add D.12** | Layer 4 | "No direct source links on Explorer pages — Spec Layer 6.3 requires 'Direct links to official sources'. Source registry pages must wrap 'Official Domain' values in `<a href>` tags, not display as text." |
| **Add D.13** | Layer 4 | "'24/7' timing claim — REVIEW. Determine whether '24/7' is FORBID (like 'real-time') or acceptable operational description. If FORBID, add to Layer 1.9 forbidden phrases list." |
| **Expand Layer 1.1** | Layer 1.1 | Add rule: "Never use non-canonical raw hex colors. ALL hex values in CSS, inline styles, SVG, or JS must match a canonical token from the Layer 1.1 color reference table. Off-brand colors (`#2DBA8E`, `#4A90D9`, `#F5A623`) are FORBID — use `var(--roua-green)`, `var(--roua-blue)`, `var(--roua-amber)` instead." |
| **Clarify Layer 6.3 UX test** | Layer 6.3 | Clarify that the UX inspection test (`Source → Document → Evidence → Provenance → Context`) applies to **Evidence Explorer** specifically. Source Explorer has its own UX test: `Source → Identity → Jurisdiction → Type → Monitoring Status → Official Domain`. |
| **D.10 system-wide status update** | Layer 4 | D.10 confirmed NOT system-wide. Source Explorer (Delta 08) is clean. D.10 appears to be specific to Evidence Explorer's Step 07 output field. Update D.10 "system-wide potential" to "confirmed on Evidence Explorer; other pages should still scan but risk is lower." |

---

# PART 7 — CROSS-REPORT COMPARISON

## Source Explorer vs Prior Pages (Delta 01–07)

| Aspect | Product Pages (5) | Architecture (06) | Evidence Explorer (07) | Source Explorer (08) |
|---|---|---|---|---|
| Lines | 566–734 | 3484 | 1560 | 1679 |
| Sections | 8–11 | 15 | 15 | 6 (most focused) |
| Inline `<style>` | Dead block (D.1) or absent | ~1200 lines | ~164 lines | ~378 lines |
| JS libraries | main.js + roua-v7.js | + Three.js + GSAP | main.js + roua-v7.js | main.js + roua-v7.js |
| Hero pattern | `.hero-split` or `.page-hero` | `.arch-hero` | `.page-hero` | `.page-hero` |
| Active nav state | Developer only | Architecture (Platform) | Explorer (Experience) | **Explorer (Experience)** — fourth page |
| D.2 (old-gold rgba) | 2–3 | 23 | 3 | **2** |
| D.4 (Audit-Ready) | Market only (1) | 0 | 2 | **0** |
| D.8 ("real time") | 0 | 2 | 0 | **1** |
| D.9 (confidence score/d) | 0 | 1 | 3 | **0** |
| D.10 (old taxonomy) | 0 | 0 | 1 | **0 — D.10 NOT system-wide** |
| **D.11 (non-canonical hex)** | 0 | 0 | 0 | **3 hex values, ~8 instances (NEW)** |
| **D.12 (no source links)** | N/A | N/A | 0 (has 6 links) | **1 (0 external links — NEW)** |
| **D.13 ("24/7" claim)** | 0 | 0 | 0 | **1 (REVIEW — NEW)** |
| External source links | 1–3 per page | 0 | 6 | **0 (D.12)** |
| Acceptance verdict | Mixed | FAIL | FAIL | **FAIL** |

## Key Insights

### 1. D.10 is NOT system-wide
Source Explorer (Delta 08) is **clean for D.10** — zero old taxonomy in content. This confirms D.10 was specific to Evidence Explorer's Step 07 output field, not a system-wide pattern. The Spec v3 "system-wide potential" designation can be downgraded.

### 2. D.11 is a new defect class — non-canonical colors
Source Explorer introduces **D.11**: raw hex colors that match NO token (canonical or deprecated). These are "off-brand" colors (`#2DBA8E` green, `#4A90D9` blue, `#F5A623` amber) that drifted from the token system. This is distinct from D.7 (deprecated hex from old palette). The Spec v4 must explicitly forbid non-canonical hex.

### 3. D.12 reveals Explorer rule gap
Source Explorer shows "Official Domain: federalreserve.gov" as TEXT, not as a clickable link. The Spec Layer 6.3 says "Direct links to official sources" but didn't explicitly require Source Explorer to linkify domain values. D.12 closes this gap.

### 4. Source Explorer is the most functionally sophisticated Explorer
Filter panel + expandable source entries + 9-field detail grid + status legend + source lifecycle + monitoring methods — this is the richest Explorer UX. The custom `.source-entry` + `.source-detail` system is a correct B-category adaptation that the v3 softened `.card-evidence` rule correctly accepts.

### 5. Source Explorer has the fewest sections (6) but the most focused purpose
Unlike Evidence Explorer (15 sections, narrative walkthrough) and Architecture (15 sections, infrastructure explanation), Source Explorer is **6 sections of focused source-registry browsing**. This is correct adaptation — the page has one job (browse sources) and does it well.

---

# PART 8 — RECOMMENDED FIXES

## P1 — Technical Repairs (~18 minutes)

| Step | Fix | Lines | Effort |
|---|---|---|---|
| 8.1 | REPAIR D.2 — replace 2 old-gold rgba with `rgba(227, 180, 90, ...)` | 189, 353 | ~2 min |
| 8.2 | REPAIR D.8 — replace "Real-time feed monitoring" with "Feed monitoring through configured ingestion adapters" | 1566 | ~1 min |
| 8.3 | REPAIR D.11 — replace `#2DBA8E` with `var(--roua-green)` | 145, 334, 1521, 1522 | ~3 min |
| 8.4 | REPAIR D.11 — replace `#4A90D9` with `var(--roua-blue)` | 1526, 1527, 1531, 1532 | ~3 min |
| 8.5 | REPAIR D.11 — replace `#F5A623` with `var(--roua-amber)` | 145, 334, 521 | ~2 min |
| 8.6 | REPAIR D.12 — wrap each source's "Official Domain" value in `<a href>` | 15 source entries | ~10 min |

## P3 — Content Review

| Step | Fix | Line | Effort |
|---|---|---|---|
| 8.7 | REVIEW D.13 — determine if "24/7" is FORBID or acceptable. If FORBID, replace with "Continuous" or "Configured". | 525 | Spec v4 decision |

---

*End of Delta Report 08. Spec v3 tested on second Inspection page — works correctly, catches real defects (D.2, D.8, new D.11/D.12/D.13). D.10 confirmed NOT system-wide. Spec v4 recommended to add D.11/D.12/D.13 + clarify UX test scope + downgrade D.10 system-wide status.*

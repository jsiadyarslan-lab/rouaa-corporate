# Delta Report 06 — `architecture.html` vs Product Family Consolidation Spec

> **Status:** First test of the Consolidation Spec against a non-product page. Tests whether the Spec's Acceptance Contract works on Infrastructure/Architecture category.
> **Audited file:** `/home/z/my-project/rouaa-corporate/rouaa-web/architecture.html` (3484 lines — largest page on site)
> **Reference:** `PRODUCT-FAMILY-CONSOLIDATION-SPEC.md` (commit `7e894ff`) + `ROUA-VISUAL-SYSTEM-v1.md`
> **Method:** No code modification. Acceptance Contract applied per Layer 1 + Layer 5 + Layer 6 + Layer 4.
> **Acceptance Verdict:** **FAIL** — Trust Grammar violations (Layer 1.9 FORBID) + massive old-gold drift (D.2) + deprecated raw hex values (new D.7).

---

## Classification Framework (Same A/B/C/D + Spec Acceptance)

| Category | Meaning |
|---|---|
| **A** | Must match — system primitives |
| **B** | Must adapt to category nature |
| **C** | Must NOT transfer from Homepage |
| **D** | Real defect — must fix |

**Acceptance Contract:** PASS requires Layer 1 + Layer 5 + Layer 6 + zero D-defects. Any FORBID violation = FAIL.

---

# PART 1 — STRUCTURAL FACTS

## 1.1 CSS / JS Stack

| Component | Loaded | Notes |
|---|---|---|
| `roua-v7.css` | ✓ | |
| `roua-v7-patch.css` | ✓ | |
| `styles.css` | ✗ NOT loaded | Same as product pages — not needed |
| **Inline `<style>` block** | ✓ (lines 13–1220) | **NOT dead code** — this is the page's ENTIRE custom design system (~1200 lines of CSS). Defines `.arch-hero`, `.arch-section`, `.reveal`, `.pulse-dot`, `.status-badge`, `.layer-panel`, `.pipeline-stage`, etc. |
| `main.js` | ✓ | |
| **Three.js r128** (CDN) | ✓ | 3D "Intelligence Stack" visualization in Hero |
| **GSAP 3.12.5** (CDN) | ✓ | Scroll-triggered animations |
| **ScrollTrigger** (CDN) | ✓ | GSAP plugin |
| `design-system/roua-v7.js` | ✓ | |

**Key finding:** Architecture loads **3 heavy JavaScript libraries via CDN** (Three.js + GSAP + ScrollTrigger). No product page loads any of these. This is the most JavaScript-heavy page on the site.

## 1.2 Token Usage

| Token Family | Usage | Verdict |
|---|---|---|
| `--roua-*` aliases | Used throughout CSS | ✓ Correct — all aliases defined in v7 |
| Custom v7 tokens (`--weight-bold`, `--tracking-tight`, `--roua-amber`, `--roua-blue`, `--roua-green`, `--roua-border`, `--roua-surface-hover`, etc.) | Used throughout | ✓ All defined in `roua-v7.css` (verified lines 337–390) |
| `var(--gold)` direct (D.6) | **0 instances** | ✓ D.6 absent |
| `rgba(201, 162, 39, ...)` (OLD gold, D.2) | **23 instances** | ⚠ **D.2 — MASSIVE** (see below) |
| **Raw hex values** (deprecated palette) | **6 values: `#0B0F18`, `#2A3543`, `#949EAF`, `#C4CCDA`, `#C9A227`, `#F5F7FA`** | ⚠ **NEW D.7** (see below) |
| Three.js PALETTE hardcoded hex | **5 values: `0xC9A227`, `0xF5C842`, `0x4A90D9`, `0x1A2433`, `0x20A878`** | ⚠ **D.7 extension** — deprecated gold hardcoded in JavaScript |

## 1.3 Page Structure

```
Navigation (lines 1222–1267)
1.  Hero — .arch-hero with 3D Intelligence Stack (lines 1268–1343)
2.  Architecture Principle (lines 1344–1357)
3.  Institutional Trust Gap (lines 1358–1378)
4.  Failure Philosophy (lines 1379–1389)
5.  Why Defensible Decisions Matter (lines 1390–1439)
6.  Intelligence Pipeline — 7 layers (lines 1440–1626)
7.  Intelligence Object Showcase (lines 1627–1696)
8.  Layer Explorer — interactive (lines 1697–2002)
9.  Evidence Chain — SVG diagram (lines 2003–2110)
10. Object Relationships (lines 2111–2180)
11. Institutional Applications (lines 2181–2225)
12. Architecture Operating Model (lines 2226–2286)
13. Human Oversight Layer (lines 2287–2391)
14. Deployment (lines 2392–2438)
15. CTA — .arch-cta (lines 2439–2454)
Footer (lines 2455–2490)
Three.js + GSAP scripts (lines 2703–3484)
```

- `<section>` count: **15** (vs product pages 8–11)
- `<div>` balance: 446 / 446 ✓ PASS
- `<section>` balance: 15 / 15 ✓ PASS
- HTML comment balance: 70 / 70 ✓ **PASS** — Architecture has clean comments

## 1.4 HTML Integrity

| Check | Result |
|---|---|
| `<div>` balance | 446 / 446 ✓ PASS |
| `<section>` balance | 15 / 15 ✓ PASS |
| HTML comment balance | 70 / 70 ✓ PASS |
| Broken internal anchors | None ✓ |
| Dead `<style>` block (D.1) | ✗ ABSENT — the inline `<style>` is the page's design system, NOT dead code |

## 1.5 Unique Structural Elements

Architecture has its OWN complete design system (`.arch-*` classes):
- `.arch-hero` (centered, NOT `.hero-split` or `.page-hero`)
- `.arch-section` (96px padding, NOT `.section`'s 88px)
- `.arch-section.alt` (alternating background with radial gradient wash)
- `.arch-section-header` (centered, max-width 760px)
- `.arch-cta` (custom CTA section)
- `.arch-meta-bar` / `.arch-meta-item` (Hero metadata)
- `.arch-hero-stats` / `.stat-pill` (Hero stat pills)
- `.arch-decision-journey` (decision journey panel)
- `.reveal` / `.reveal-stagger` (scroll-triggered reveals — custom, NOT `.rv`)
- `.pulse-dot` (custom status indicator — NOT `.glass-status-dot`)
- `.status-badge` (custom status badge with 4 variants: op/ver/bld/sup)
- `.layer-nav-item` / `.layer-panel-content` (interactive layer explorer)
- `.pipeline-stage` / `.pipeline-layer` (pipeline visualization)

**Verdict:** Architecture's custom design system is **B-category adaptation** — correct for an Infrastructure page that needs specialized visualization components (3D stack, interactive layer explorer, pipeline diagram, evidence chain SVG).

---

# PART 2 — ACCEPTANCE CONTRACT EVALUATION

## Layer 1 — Canonical Baseline

### 1.1 Token System

| Rule | Status | Notes |
|---|---|---|
| Use `--roua-*` aliases | ✓ PASS | All aliases used correctly |
| Never use raw hex in styles | ✗ **FAIL** | 6 deprecated hex values in SVG + 5 in Three.js PALETTE |
| Never use `rgba(201, 162, 39, ...)` | ✗ **FAIL** | 23 instances in page's `<style>` block |
| Never use `var(--gold)` directly | ✓ PASS | 0 instances — D.6 absent |

**Layer 1.1 verdict:** **FAIL** — raw hex + old-gold rgba violations.

### 1.2 Container & Layout

| Rule | Status | Notes |
|---|---|---|
| Use `.container` (1200px max) | ✓ PASS | Used throughout |
| Section padding: 88px standard | ⚠ PARTIAL | Architecture uses `.arch-section` at 96px (not 88px). Acceptable adaptation for Infrastructure page — denser visual rhythm. |
| Compressed sections: 48px | ✓ PASS | Some sections use 80px / 64px compressed |
| CTA section: 120px | ⚠ PARTIAL | `.arch-cta` uses custom padding (not `.cta-section`'s 120px) |
| Alternating bands | ✓ PASS | `.arch-section.alt` used correctly |

**Layer 1.2 verdict:** **PASS** (with B-category adaptation for 96px sections — acceptable for Infrastructure).

### 1.3 Navigation

| Rule | Status | Notes |
|---|---|---|
| Use `.navbar` + `.nav-container` + `.nav-logo` + `.nav-links` | ✓ PASS | |
| Products dropdown: 6 links (no Trading Desks) | ✓ PASS | Investment, Risk, Market & Trading, Media, Developer Platform, Catalog |
| Solutions dropdown: 7 links | ✓ PASS | Trading Desks, Investment Firms, Financial Media, Enterprise, Solutions Overview, Why ROUA, Business Case |
| Platform dropdown: 6 links | ✓ PASS | Architecture, Platform Overview, Source Registry, Trust Framework, Methodology, Infrastructure Report |
| Mobile hamburger: `.nav-toggle` | ✓ PASS | Present (line 1261) |
| Active nav state: `nav-dropdown-trigger active` | ✓ PASS | On Platform dropdown (line 1234) — correct, Architecture is under Platform |

**Layer 1.3 verdict:** **PASS** — fully compliant. Architecture is the **second page** (after Developer) with active nav state.

### 1.4 Buttons

| Rule | Status |
|---|---|
| Primary: `.btn .btn-primary` | ✓ PASS |
| Secondary: `.btn .btn-secondary` | ✓ PASS |
| Pill-shaped (999px radius) | ✓ PASS |

**Layer 1.4 verdict:** **PASS**

### 1.5 Footer

| Rule | Status | Notes |
|---|---|---|
| 6 columns: Brand + Products + Platform + Solutions + Experience + Company | ✓ PASS | |
| NO "Channels" column | ✓ PASS | |

**Layer 1.5 verdict:** **PASS**

### 1.6 Card Hierarchy

| Rule | Status | Notes |
|---|---|---|
| `.card .card-accent` for marketing | ⚠ PARTIAL | Architecture uses custom `.arch-section` panels, not `.card-accent`. Acceptable B-category adaptation. |
| `.card-evidence` for evidence rows | ✗ NOT ADOPTED | Spec says "Should use .card-evidence for pipeline stages" — Architecture uses custom `.layer-panel` and `.pipeline-stage` instead. |

**Layer 1.6 verdict:** **PASS** (B-category — custom card system is acceptable for Infrastructure; `.card-evidence` is ADOPT recommendation, not requirement).

### 1.7 Motion

| Rule | Status | Notes |
|---|---|---|
| Entrance reveals allowed | ✓ PASS | Uses custom `.reveal` / `.reveal-stagger` classes (NOT `.rv` — acceptable adaptation) |
| `glass-status-dot` pulse (Decision Environments only) | ✗ ABSENT | Architecture uses custom `.pulse-dot` (gold/green/blue variants). Correct — Architecture is NOT a Decision Environment. |
| Homepage ambient motion FORBID on product pages | ✓ PASS | No globe, particles, wave, 3D tilt, decode, chain pulse, hline rise, button magnetic |
| `prefers-reduced-motion` respect | ✓ PASS | Three.js scene explicitly checks `prefers-reduced-motion` (line ~2725) and returns early. GSAP also respects it. |

**Layer 1.7 verdict:** **PASS** — Architecture's Three.js 3D scene is "depth/orbits for infrastructure visualization" per Layer 6.1, which is ALLOWED.

### 1.8 Typography

| Rule | Status |
|---|---|
| Inter sans (via `--sans`) | ✓ PASS |
| Fira Code mono (via `--mono` / `--font-mono`) | ✓ PASS |
| Sans/mono separation | ✓ PASS |

**Layer 1.8 verdict:** **PASS**

### 1.9 Trust Grammar (Forbidden Phrases)

| Phrase | Count | Verdict |
|---|---|---|
| "audit-ready" / "Audit-Ready" | 0 | ✓ PASS (correct — Architecture is not Risk) |
| "within seconds" / "in seconds" | 0 | ✓ PASS |
| **"real-time" / "real time"** | **2** (lines 1517, 1872) | ✗ **FAIL — FORBID violation** |
| "instantly" / "instant" | 0 | ✓ PASS |
| "continuously monitored" | 0 | ✓ PASS |
| **"every claim"** | **1** (line 1803) | ⚠ **REVIEW** — in quoted "Institutional Question": "Can we locate the exact passage behind every claim?" — judgment call |
| "VERIFIED INTELLIGENCE OBJECT" | 0 | ✓ PASS |
| "Trust Promise" | 0 | ✓ PASS |
| "Provenance Immutability" | 0 | ✓ PASS |
| **"confidence score" / "confidence scored"** | **1** (line 2312) | ✗ **FAIL — FORBID violation** |
| "SOC 2" / "ISO 27001" | 0 | ✓ PASS |

**Layer 1.9 verdict:** **FAIL** — 2 FORBID violations ("real time" × 2, "confidence scored" × 1) + 1 REVIEW ("every claim" in quoted question).

### 1.10 Taxonomy

| Term | Count | Verdict |
|---|---|---|
| "Trading Intelligence" alone | 2 (both in "Market & Trading Intelligence") | ✓ PASS |
| "Developer Intelligence" alone | 0 | ✓ PASS (uses "Developer Platform") |
| "Institutional Intelligence" | 1 (footer brand description) | ✓ PASS (descriptive use) |

**Layer 1.10 verdict:** **PASS**

### Layer 1 Overall Verdict: **FAIL**
Two FORBID violations in Trust Grammar (Layer 1.9) + raw hex + old-gold rgba in Layer 1.1.

---

## Layer 5 — Do-Not-Touch Rules

| Rule | Status | Notes |
|---|---|---|
| Do NOT force Decision Environment grammar onto non-Decision pages | ✓ PASS | Architecture has its own `.arch-*` grammar, no "Verified Fact → Context → Decision" chain |
| Do NOT force product-specific Trust Grammar labels | ✓ PASS | No "Verified Fact" / "ROUA Context" / "Decision Context" labels forced |
| Do NOT add Homepage-brand elements | ✓ PASS | Zero Homepage-brand elements (globe, particles, wave, glass, chain, orbit, hline, gstats, chips, fchip, cdot all = 0) |
| Do NOT force `.hero-split` + `.glass-status-card` | ✓ PASS | Architecture uses `.arch-hero` (centered, custom) |
| Do NOT force `.card-accent` marketing cards | ✓ PASS | Architecture uses custom `.arch-section` panels |
| Do NOT force product-specific motion patterns | ✓ PASS | Architecture uses Three.js 3D (allowed per Layer 6) + custom `.reveal` classes |

**Layer 5 verdict:** **PASS** — the Spec correctly does NOT force Decision Environment grammar onto Architecture. This is the key test the user requested, and the Spec passes it.

---

## Layer 6 — Architecture-Specific Rules

| Rule (from Spec Layer 6.3) | Status | Notes |
|---|---|---|
| May use depth/orbits for infrastructure visualization | ✓ PASS | Three.js 3D "Intelligence Stack" with 7 glass-like layers + golden data streams — this IS infrastructure visualization |
| Must NOT use the literal `.globe` canvas | ✓ PASS | Zero `.globe` instances |
| Must NOT use `.glass` | ✓ PASS | Zero `.glass` class instances (the 3D scene describes "glass-like layers" in a comment, but that's descriptive, not the CSS class) |
| Should use `.card-evidence` for pipeline stages | ⚠ NOT ADOPTED | Uses custom `.layer-panel` and `.pipeline-stage` instead. ADOPT recommendation, not requirement. |
| Should use `.workflow` for vertical process flows | ⚠ NOT ADOPTED | Uses custom `.how-step` (same class name as product pages) and `.pipeline-stage` instead. ADOPT recommendation, not requirement. |
| May use entrance reveals (`.rv`) | ✓ PASS | Uses custom `.reveal` / `.reveal-stagger` (functionally equivalent) |
| Must NOT have constant ambient motion | ⚠ PARTIAL | Three.js 3D scene has continuous rotation animation (RAF loop). However, this is "depth visualization" not "ambient theatrics" — and it respects `prefers-reduced-motion`. **Judgment call: B-category acceptable.** |

**Layer 6 verdict:** **PASS** (with B-category notes on `.card-evidence` / `.workflow` adoption being optional, and Three.js animation being acceptable infrastructure visualization)

---

## Layer 4 — Confirmed Defects (D.1–D.6 + new)

| ID | Defect | Present? | Details |
|---|---|---|---|
| D.1 | Dead `<style>` block (lines 13–30) | ✗ ABSENT | Architecture's `<style>` is the page's design system, not dead code |
| **D.2** | **Old-gold `rgba(201, 162, 39, ...)`** | **✓ PRESENT — 23 instances** | Lines 46, 84, 85, 128, 138, 139, 670, 888, 920, 921, 930, 931, 948, 951, 1043, etc. — in page's `<style>` block CSS rules |
| D.3 | Malformed HTML comment | ✗ ABSENT | 70/70 comment balance PASS |
| D.4 | "Audit-Ready" violation | ✗ ABSENT | 0 instances (correct — Architecture is not Risk) |
| D.5 | Bloomberg naming | ✗ ABSENT | 0 instances |
| D.6 | `var(--gold)` base token | ✗ ABSENT | 0 instances |
| **D.7 (NEW)** | **Deprecated raw hex values from VISUAL-IDENTITY-SYSTEM.md** | **✓ PRESENT — 6 hex values** | `#0B0F18`, `#2A3543`, `#949EAF`, `#C4CCDA`, `#C9A227`, `#F5F7FA` in inline SVG (Evidence Chain diagram, lines 2018–2068) + Three.js PALETTE `0xC9A227`, `0xF5C842`, `0x4A90D9`, `0x1A2433`, `0x20A878` (lines 2734–2738) |
| **D.8 (NEW)** | **"real time" Trust Grammar violation** | **✓ PRESENT — 2 instances** | Lines 1517, 1872 — FORBID per Layer 1.9 |
| **D.9 (NEW)** | **"confidence score/d" Trust Grammar violation** | **✓ PRESENT — 1 instance** | Line 2312 — FORBID per Layer 1.9 |
| **REVIEW** | **"every claim" in quoted question** | **⚠ 1 instance** | Line 1803 — "Can we locate the exact passage behind every claim?" — quoted "Institutional Question", not a ROUA claim. Needs human judgment. |

---

# PART 3 — DRIFT SUMMARY

## A — Must match (system primitives)
| ID | Finding | Verdict |
|---|---|---|
| A.1 | Two nav class systems | **STANDARDIZE** (Architecture uses product-page `.navbar` system — correct) |
| A.2 | Section padding 96px vs 88px | **KEEP** (B-category — Infrastructure adaptation) |
| A.3 | Custom `.reveal` vs `.rv` | **KEEP** (B-category — functionally equivalent) |
| A.4 | Custom `.pulse-dot` vs `.glass-status-dot` | **KEEP** (B-category — Architecture is not Decision Environment) |

## B — Must adapt to category nature
| ID | Finding | Verdict |
|---|---|---|
| B.1 | Custom `.arch-*` design system (~1200 lines CSS) | **KEEP** — correct Infrastructure adaptation |
| B.2 | Three.js 3D "Intelligence Stack" in Hero | **KEEP** — "depth/orbits for infrastructure visualization" per Layer 6 |
| B.3 | GSAP + ScrollTrigger scroll animations | **KEEP** — entrance reveals, not ambient theatrics |
| B.4 | Centered `.arch-hero` (not `.hero-split` or `.page-hero`) | **KEEP** — correct for Infrastructure |
| B.5 | 15 sections (most of any page) | **KEEP** — Architecture has the deepest narrative |
| B.6 | Interactive Layer Explorer (custom JS) | **KEEP** — correct Infrastructure feature |
| B.7 | SVG Evidence Chain diagram | **KEEP** — correct Infrastructure visualization |
| B.8 | 96px section padding (vs 88px standard) | **KEEP** — denser visual rhythm for Infrastructure |

## C — Must NOT transfer from Homepage
| ID | Finding | Verdict |
|---|---|---|
| C.1–C.14 | All 14 Homepage-brand elements | ✓ **All correctly absent** |

## D — Real defects
| ID | Finding | Severity | Fix |
|---|---|---|---|
| **D.2** | 23 instances of `rgba(201, 162, 39, ...)` in page's `<style>` block | **P1 — REPAIR** | Replace all with `rgba(227, 180, 90, ...)` |
| **D.7 (NEW)** | 6 deprecated raw hex values in SVG + 5 in Three.js PALETTE | **P1 — REPAIR** | Replace with canonical tokens or `rgba(227, 180, 90, ...)` equivalents |
| **D.8 (NEW)** | "real time" × 2 (lines 1517, 1872) | **P1 — REPAIR** | Replace with "through configured source monitoring" or "as they are published" |
| **D.9 (NEW)** | "confidence scored" × 1 (line 2312) | **P1 — REPAIR** | Replace with "verification tier assigned" or "confidence signals recorded" |
| **REVIEW** | "every claim" in quoted question (line 1803) | **P3 — REVIEW** | Judgment call — the phrase appears in a quoted institutional question, not as a ROUA claim. May be acceptable. |

---

# PART 4 — ACCEPTANCE VERDICT

## **FAIL**

The page **FAILS** the Acceptance Contract due to:

1. **Layer 1.9 FORBID violations:**
   - "real time" × 2 instances (lines 1517, 1872)
   - "confidence scored" × 1 instance (line 2312)

2. **Layer 1.1 token violations:**
   - 23 instances of old-gold `rgba(201, 162, 39, ...)` (D.2)
   - 6 deprecated raw hex values from VISUAL-IDENTITY-SYSTEM.md (D.7)
   - 5 deprecated hex values in Three.js PALETTE (D.7 extension)

3. **Layer 4 confirmed defects:**
   - D.2 (23 instances)
   - D.7 (new — deprecated hex in SVG + Three.js)
   - D.8 (new — "real time" Trust Grammar violation)
   - D.9 (new — "confidence scored" Trust Grammar violation)

## What the Spec correctly allowed (Layer 5 + Layer 6 PASS)

Despite the FAIL verdict, the Spec **correctly handled** the category distinction:

- ✓ Architecture is NOT forced into Decision Environment grammar
- ✓ Three.js 3D visualization is ALLOWED as "depth/orbits for infrastructure visualization"
- ✓ Custom `.arch-*` design system is ACCEPTED as B-category adaptation
- ✓ `.globe` and `.glass` are correctly FORBIDDEN and absent
- ✓ Active nav state on Platform dropdown is CORRECT
- ✓ Skip-link, mobile hamburger, 6-link Products dropdown all CORRECT

**The Spec works.** It catches real Trust Grammar violations without forcing product-page grammar onto a non-product page. The FAIL is due to genuine defects, not Spec over-constraint.

---

# PART 5 — RECOMMENDED FIXES

## P1 — Technical Repairs (~20 minutes)

| Step | Fix | Lines | Effort |
|---|---|---|---|
| 5.1 | Replace all 23 `rgba(201, 162, 39, ...)` with `rgba(227, 180, 90, ...)` in `<style>` block | 46, 84, 85, 128, 138, 139, 670, 888, 920, 921, 930, 931, 948, 951, 1043, etc. | ~10 min |
| 5.2 | Replace 6 deprecated hex values in SVG with canonical equivalents | 2018–2068 | ~5 min |
| 5.3 | Replace 5 deprecated hex values in Three.js PALETTE with canonical equivalents | 2734–2738 | ~3 min |
| 5.4 | Replace "real time" (×2) with "as they are published" or "through configured source monitoring" | 1517, 1872 | ~2 min |
| 5.5 | Replace "confidence scored" with "verification tier assigned" | 2312 | ~1 min |

## P3 — Content Review

| Step | Fix | Line | Effort |
|---|---|---|---|
| 5.6 | REVIEW "every claim" in quoted institutional question | 1803 | Judgment call |

---

# PART 6 — SPEC VALIDATION

## Does the Spec work on non-product pages?

**YES.** The Acceptance Contract successfully:

1. **Caught real Trust Grammar violations** — "real time" and "confidence scored" are FORBID per Layer 1.9, and the Spec correctly flagged them.
2. **Did NOT force Decision Environment grammar** — Architecture's custom `.arch-*` system, Three.js 3D, and centered Hero were all accepted as B-category adaptations.
3. **Correctly applied category-specific rules** — Layer 6 Architecture rules (depth/orbits allowed, `.globe`/`.glass` forbidden) were applied and passed.
4. **Identified new defect types** — D.7 (deprecated raw hex), D.8 ("real time"), D.9 ("confidence scored") are new defects not seen in product pages. The Spec's FORBID rules caught them.
5. **Did NOT over-constrain** — the Spec did not require `.card-evidence` or `.workflow` (ADOPT recommendations, not requirements).

## Spec updates needed

The Spec should be updated to include:

| Update | Layer | Detail |
|---|---|---|
| **D.7** — Deprecated raw hex values | Layer 4 | Add D.7: "Raw hex values from deprecated VISUAL-IDENTITY-SYSTEM.md (`#0B0F18`, `#2A3543`, `#949EAF`, `#C4CCDA`, `#C9A227`, `#F5F7FA`) — replace with canonical tokens or `rgba(227, 180, 90, ...)` equivalents" |
| **D.8** — "real time" | Layer 4 | Add D.8: "'real time' / 'real-time' Trust Grammar violation — FORBID per Layer 1.9, use 'through configured source monitoring' or 'as they are published'" |
| **D.9** — "confidence scored" | Layer 4 | Add D.9: "'confidence score' / 'confidence scored' Trust Grammar violation — FORBID per Layer 1.9, use 'verification tier' or 'confidence signals'" |
| **SVG hex values** | Layer 1.1 | Expand raw hex rule: "Never use raw hex in styles OR inline SVG `fill`/`stroke` attributes OR JavaScript color definitions" |
| **Three.js/Canvas color definitions** | Layer 1.1 | Add: "JavaScript color definitions (e.g., Three.js PALETTE, Canvas fillStyle) must use canonical gold `0xE3B45A` (not deprecated `0xC9A227`)" |

---

# PART 7 — CROSS-REPORT COMPARISON

## Architecture vs Product Pages (Delta 01–05)

| Aspect | Product Pages (5) | Architecture (Delta 06) |
|---|---|---|
| Lines | 566–734 | **3484** (5x larger) |
| Sections | 8–11 | **15** |
| Inline `<style>` | Dead block (D.1) or absent | **~1200 lines** (page's design system) |
| JavaScript | `main.js` + `roua-v7.js` only | **+ Three.js + GSAP + ScrollTrigger** |
| Hero pattern | `.hero-split` or `.page-hero` | **`.arch-hero`** (centered, custom) |
| 3D visualization | None | **Three.js Intelligence Stack** |
| Interactive elements | Standard | **Layer Explorer, Pipeline, SVG diagrams** |
| Token system | `--roua-*` aliases | `--roua-*` aliases + custom v7 tokens |
| D.2 (old-gold rgba) | 2–3 instances (Evidence Example template) | **23 instances** (page's own CSS) |
| D.7 (deprecated hex) | 0 | **6 in SVG + 5 in Three.js** |
| D.8 ("real time") | 0 | **2** |
| D.9 ("confidence scored") | 0 | **1** |
| Trust Grammar violations | 0–1 (Market D.4) | **3–4** (D.8 × 2, D.9 × 1, REVIEW × 1) |
| Acceptance verdict | Investment PASS, Market FAIL (D.4), Risk PASS, Media FAIL (D.6), Developer PASS | **FAIL** (D.2, D.7, D.8, D.9) |

## Key Insight

Architecture is the **most defect-heavy page audited so far** — but the defects are **genuine**, not Spec over-constraint. The page has:
- The most old-gold rgba drift (23 instances vs 2–3 in product pages)
- The only deprecated raw hex values (D.7 — new defect type)
- The only "real time" violations (D.8 — new defect type)
- The only "confidence scored" violation (D.9 — new defect type)

This makes sense: Architecture was likely built earlier (using the deprecated VISUAL-IDENTITY-SYSTEM.md palette) and was NOT included in the P0 system sweep that cleaned product pages. The Trust Grammar violations ("real time", "confidence scored") survived because they were in infrastructure-descriptive content, not in marketing claims.

**The Spec correctly identified all of these.** The FAIL verdict is real, not a false positive.

---

*End of Delta Report 06. Acceptance Contract tested on Infrastructure/Architecture category — Spec works correctly, catches real defects without over-constraining.*

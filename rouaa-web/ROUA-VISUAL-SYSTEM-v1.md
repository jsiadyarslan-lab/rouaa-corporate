# ROUA Visual System v1

> **Status:** Canonical reference, extracted from `index.html` at commit `de9830f` (post-revert to `eca0fef`).
> **Purpose:** This document is the operational source of truth for what the ROUA Homepage actually looks like, structurally and visually. Other pages are compared against this reference, not against theoretical docs.
> **Relationship to `VISUAL-IDENTITY-SYSTEM.md`:** That earlier document (Aug 7) drifted from reality. Where the two conflict, **this document wins**. The earlier document is retained only as historical context.

---

## 0. How To Use This Document

### Two Separate Systems, Never Mixed

The previous visual-audit work failed because it conflated two distinct systems. This document keeps them strictly separate:

| System | What It Governs | Source of Truth |
|---|---|---|
| **Visual Identity** | How ROUA looks — typography, grid, color, surfaces, motion, depth | Extracted from `index.html` §1–§14 below |
| **Trust Grammar** | How ROUA communicates evidence vs interpretation — labels, disclaimers, semantic colors | Extracted from `index.html` §15 below, plus the locked taxonomy from prior product-page work |

### Page Category Roles (locked)

The Homepage is the most visually ambitious page on the site. It is NOT the restrained baseline. Other page categories take roles relative to it:

| Category | Visual Role | Trust Grammar Role |
|---|---|---|
| **Homepage** | System / Brand — full cinematic vocabulary allowed | Demonstrates grammar; not the strictest inspector |
| **Product Pages (5)** | Decision / Evidence — restrained, no globe/particles | Strictest evidence/analysis boundary |
| **Architecture** | Infrastructure — diagrams, depth, but no glass/globe | Canonical pipeline explanation |
| **Explorers** (Evidence/Source) | Inspection — minimal motion, dense metadata | Maximum inspectability |
| **Developer** | Integration — code blocks, schemas, mono-heavy | API contracts, embedded evidence |

---

# PART A — VISUAL IDENTITY

## 1. Color System (Actual)

Extracted from `index.html` line 18–20. This is the live token set used by the Homepage. **All other pages must align to this token set, not to `VISUAL-IDENTITY-SYSTEM.md`'s palette.**

### Backgrounds
```
--bg    #040b1c    Deep institutional navy (page background)
--bg2   #071228    Section alt background (panel-on-panel)
--panel #0a1630    Card surface
```

### Borders
```
--line  rgba(148,184,255,.14)   Subtle blue border (default)
--line2 rgba(148,184,255,.28)   Stronger blue border (emphasis)
```

### Text Hierarchy
```
--txt   #eaf2ff   Primary text (headlines, key data)
--dim   #9fb0cc   Secondary text (body, descriptions)
--dim2  #6b7f9f   Muted metadata (labels, timestamps, system identifiers)
```

### Accent — Institutional Gold (PRIMARY)
```
--gold  #e3b45a   Primary accent — used for:
                  • Verified status labels
                  • Evidence chain final nodes
                  • Hero accent text (em)
                  • CTA buttons (gradient base)
                  • Card hover corner brackets
                  • Status pills / decorative glow
--gold2 #f4d492   Lighter gold for gradients and hover
```

**Drift note:** `VISUAL-IDENTITY-SYSTEM.md` §2 specifies gold = `#C9A227` (muted, desaturated). The live Homepage uses `#e3b45a` (brighter, more saturated). **`#e3b45a` is the canonical gold.** Pages using `#C9A227` or `rgba(201,162,39,...)` are drifting.

### Accent — Information Blue
```
--blue  #4f8cff   Information accent (data flow, chain arrows, secondary hex)
--blue2 #8ab6ff   Lighter blue (hex icons, globe points)
```

### Functional
```
--op    #10b981   Success / Operational (status pill, "Verified" market context)
--pr    #f59e0b   Warning amber (chain stages, attention states)
```

### Gold Usage Rule (Semantic, NOT Decorative)

The Homepage uses gold both semantically (Verified Event, Evidence Chain labels) AND decoratively (globe point glow, chain arrow color, hex icon variant). **For product/explorer pages, gold MUST be reserved for semantic use only.** The Homepage retains decorative gold because it is the brand layer.

---

## 2. Typography (Actual)

### Font Stack
```
--sans  Inter, -apple-system, 'Segoe UI', Roboto, sans-serif    (body, headlines)
--mono  'Fira Code', 'SFMono-Regular', Consolas, monospace      (metadata, labels, system identifiers)
```

### Type Scale

| Element | Selector | Size | Weight | Line | Letter-spacing |
|---|---|---|---|---|---|
| Hero H1 | `h2.hh` | `clamp(2rem, 3.8vw, 3.2rem)` | 800 | 1.1 | normal |
| Hero H1 accent | `h2.hh em` | inherit | inherit | inherit | normal, color gold |
| Section H2 | `h2.sec` | `clamp(1.7rem, 3.2vw, 2.4rem)` | 800 | 1.2 (text-wrap balance) | normal |
| Card H3 | `.app h3` / `.glass h3` | 1.35rem | 700 | 1.3 | normal |
| Deployment H3 | `.dcell h3` | 1.6rem | 700 | — | -0.01em |
| Body | base | 1rem (base) | 400 | 1.6 | normal |
| Hero sub | `.heroSub` | 0.98rem | 400 | 1.6 | normal |
| Section lead | `.subC` | 0.92rem | 400 | — | normal |
| Eyebrow | `.eyebrow` / `.eyebrowC` | 0.66rem | 600 | — | 0.3em (uppercase) |
| Mono label | various | 0.62–0.66rem | 700 | — | 0.12–0.24em (uppercase) |
| Mono metadata | various | 0.58–0.72rem | 600/700 | — | 0.06–0.20em |
| Hero stats number | `.gstats b` | 1.1rem | 800 | — | normal |
| Card number watermark | `.gn` | 2.2rem | 700 | — | normal, opacity 0.07 |

### Typography Rules

1. **Two faces only:** `--sans` for narrative, `--mono` for evidence/metadata/system-identifiers. Never mix sans-serif into evidence rows; never mix mono into hero headlines.
2. **All-caps reserved for:** eyebrows, mono labels, button text, status pills. Body copy is NEVER all-caps.
3. **Letter-spacing 0.3em = eyebrow.** Letter-spacing 0.12–0.24em = mono label. Anything else is wrong.
4. **`text-wrap: balance`** on all section H2 — non-negotiable.
5. **Italic** is reserved for disclaimers and the hero accent phrase (`em` styled as italic with gold color).

---

## 3. Grid & Spacing (Actual)

### Container
```
.wrap   max-width: 1240px; padding: 0 28px;
```

### Section rhythm
```
section            padding: 88px 0;    scroll-margin-top: 86px;
#hero              padding: 84px 0 30px;
#cta               padding: 120px 0;
trust-strip        padding: 48px 0;    (compressed)
one-event          padding: 64px 0;    (compressed)
workflow-scope     padding: 64px 0;    (compressed)
```

### Grid patterns (Homepage uses 5 distinct grids)

| Grid | Columns | Gap | Use |
|---|---|---|---|
| Hero split | `1fr 1fr` | 50px | Hero narrative + glass |
| Products | `1fr 1fr` | 20px | Premium product cards (.app.cx) |
| Who Uses | `repeat(4, 1fr)` | 12px | Buyer cards |
| Deployment | `repeat(4, 1fr)` | 14px | Deployment cells |
| CTA product row | `repeat(6, 1fr)` | 10px | All 6 products as final-CTA tiles |
| Footer | `1.5fr repeat(6, 1fr)` | 24px | Brand + 6 link columns |
| Trust strip | `repeat(5, 1fr)` | 16px | 5 trust indicators |

### Responsive Collapse
```
@media (max-width: 1020px) {
  hero, products, stage-flow   → 1fr
  who, dgrid                   → repeat(2, 1fr)
  footer                       → repeat(2, 1fr)
  cmp-row                      → 1fr
  globe                        → right: -430px; opacity: .5
  nlinks                       → display: none
}
```

### Spacing scale (observed)
```
4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 30, 32, 40, 44, 48, 60, 84, 88, 120 px
```
No 8px grid is enforced strictly. Spacing values follow rhythm-by-eye. **This is part of the Homepage's character — do not impose strict 8px on it.**

---

## 4. Surfaces & Cards (Actual)

The Homepage uses FOUR distinct surface types. Each has a specific role. Pages that mix them or invent new ones are drifting.

### Type 1 — `.cx` Premium Surface
**Role:** Interactive/featured cards. Default surface for clickable product cards, deployment cells, CTA tiles.

```css
.cx {
  border: 1px solid transparent;        /* gradient border, not solid */
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(13,25,52,.85), rgba(7,15,34,.96)) padding-box,
              linear-gradient(165deg, rgba(227,180,90,.5), rgba(79,140,255,.3) 45%, rgba(148,184,255,.12)) border-box;
  box-shadow: 0 18px 44px -24px rgba(0,0,0,.85), inset 0 1px 0 rgba(255,255,255,.06);
  transition: transform .35s cubic-bezier(.2,.7,.2,1), box-shadow .35s;
}
.cx:hover {
  transform: translateY(-6px);
  box-shadow: 0 32px 64px -26px rgba(0,0,0,.9), 0 0 24px -6px rgba(227,180,90,.18), ...;
}
.cx::before  /* corner brackets in gold — visible on hover only */
.cx::after   /* shine sweep — left-to-right on hover */
```

**Allowed on:** Homepage (product cards, CTA tiles, deployment cells, comparison rows).
**Forbidden on:** Evidence Explorer, Source Explorer — those pages need stability, not hover theatrics.

### Type 2 — `.glass` Hero Glass Card
**Role:** ONE per page, in the Hero only. The signature "ROUA terminal" surface.

```css
.glass {
  border-radius: 18px;
  padding: 28px;
  background: linear-gradient(150deg, rgba(20,40,90,.55), rgba(8,18,44,.78));
  border: 1px solid rgba(138,182,255,.35);
  backdrop-filter: blur(14px);
  box-shadow: 0 40px 90px -30px rgba(0,0,0,.8), inset 0 1px 0 rgba(255,255,255,.12);
  transform-style: preserve-3d;
  transition: transform .2s;
}
.glass::before  /* diagonal sheen, always on */
```

**Allowed on:** Homepage Hero (one instance).
**Forbidden on:** Product pages (they use `.glass-status-card` from `styles.css`, a different surface).
**Forbidden on:** Any section that is not the Hero.

### Type 3 — `.panel` Surface (var(--panel))
**Role:** Plain content cards, table rows, non-interactive panels.

```css
background: var(--panel);              /* #0a1630 */
border: 1px solid var(--line);         /* subtle blue */
border-radius: 6–14px;                 /* varies by use */
/* No hover lift, no shine, no corner brackets */
```

**Allowed on:** All page types. Default surface for static information.

### Type 4 — `.bg2` Alt Section Background
**Role:** Alternating section bands to create rhythm.

```css
background: var(--bg2);                /* #071228 */
border-block: 1px solid var(--line);
```

**Used on Homepage at:** Products intro band, Financial Intelligence Pipes band, Workflow Scope, How It Works, Trusted Foundation, Trust Strip.

### Card Hierarchy Summary (locked)

| Class | Hover lift | Shine | Corner brackets | Use case |
|---|---|---|---|---|
| `.cx` | -6px | yes | yes | Premium interactive |
| `.glass` | 3D tilt | sheen (always on) | no | Hero signature only |
| `.panel` (default) | none | no | no | Static information |
| `.card-featured` (defined in v7-patch) | -3px | no | no | Highlighted static |
| `.card-evidence` (defined in v7-patch) | none | no | no | Source/evidence rows |

---

## 5. Hero Composition (Actual)

The Homepage Hero is the most compositionally complex section on the site. It is intentionally rich — this is the brand moment.

### Layer Stack (z-index order)
```
z=0  .globe (840px circle, right -190, top -130, canvas with 420 Fibonacci points)
z=0  .orbit o1 (1060×340 ellipse, rotated -16°, blue)
z=0  .orbit o2 (900×260 ellipse, rotated -10°, gold)
z=1  #glow (520px radial-gradient, follows mouse)
z=2  .heroG grid (1fr 1fr)
       LEFT  — eyebrow + h1 + sub + CTAs + 3 feature chips
       RIGHT — .glass card with brand + statusPill + h3 + tag + 4 stats + provenance footnote
z=2  .chain (horizontal evidence chain, below heroG)
z=2  .wave (SVG transition out of Hero)
```

### Hero Left Composition
1. Eyebrow (decode-animated, gold, 0.66rem, 0.3em tracking)
2. H1 (`h2.hh`) — 2 lines, second line italic gold
3. Subhead (`.heroSub`, 0.98rem, max-width 540px)
4. "How ROUA Is Structured" inline panel — border-top/bottom only, mono uppercase header
5. CTA row — `.btnGold` + `.btnGhost`
6. Feature chips — 3 columns, hex icon + label/desc

### Hero Right Composition (.glass)
1. Top row: ROUA brand (svg + text) | OPERATIONAL status pill
2. H3: "Financial Intelligence Infrastructure"
3. Tag (decode-animated): "Pipes. Evidence. Defensible."
4. 4-column stats grid (counter-animated): 4 products · 411+ sources · Evidence · 6 workflows
5. Provenance footnote (mono, 0.62rem, dim2)
6. 3D tilt on mousemove (rotateY ±7°, rotateX ∓5°)

### Hero Motion Inventory
- **Entrance:** hline rise (translateY 112% → 0, staggered 0.14s)
- **Entrance:** decode chars on eyebrow + tag
- **Constant:** particle drift (44 particles, 9s ease infinite)
- **Constant:** globe canvas rotation (RAF, ~0.0016 rad/frame)
- **Constant:** chain pulse (cdot traverses 8s, nodes activate sequentially)
- **Constant:** status pill pulse (2s infinite, success green)
- **Hover:** glass 3D tilt + globe parallax translate + #glow follow
- **Hover:** button magnetic translate (±8px x, ±6px y)

### Hero Rule (locked)
> The Hero is the ONLY section on the site that uses .globe, .orbit, #glow, .wave, .glass together. No other page may import this combination. Architecture page may use depth/orbits for infrastructure visualization, but not the full set.

---

## 6. Navigation (Actual)

### Structure
```
<nav id="navbar">
  .brand  → svg hex logo (40px) + "ROUA" wordmark
  .nlinks → 5 dropdowns + 1 plain link
              Products  Platform  Solutions  Experience  Company  | Developers
  .btnGold "Request Briefing"
```

### Behavior
- Sticky top (z=60)
- Background: `rgba(4,11,28,.86)` + `backdrop-filter: blur(12px)`
- On scroll > 10px: `nav.scd` adds stronger background + shadow
- Dropdowns: hover-open, 6–7 links each, min-width 230px
- Active state: gold underline (`.nlinks a.on::after`)
- Mobile (≤1020px): `.nlinks` hidden, no hamburger implemented (known issue)

### Color States
| Element | Default | Hover | Active |
|---|---|---|---|
| Top-level link | `--dim` | `--txt` | `--gold` + underline |
| Dropdown link | `--dim` | `--gold` + subtle gold bg | — |
| CTA button | gold gradient | gold glow shadow | — |

---

## 7. Buttons (Actual)

Only TWO button styles on the entire site. Pages using other variants are drifting.

### `.btnGold` — Primary
```css
background: linear-gradient(135deg, var(--gold2), var(--gold));
color: #1a1206;                /* dark text on gold */
font-weight: 700;
font-size: 0.72rem;
letter-spacing: 0.12em;
text-transform: uppercase;
padding: 12px 24px;
border-radius: 999px;          /* pill */
box-shadow: 0 8px 24px -10px rgba(227,180,90,.5);
hover: box-shadow strengthens to 0 14px 34px -10px rgba(227,180,90,.7)
hover: magnetic translate (±8px x, ±6px y)
```

### `.btnGhost` — Secondary
```css
background: transparent;
border: 1px solid var(--line2);
color: var(--txt);
font-size: 0.72rem;
letter-spacing: 0.12em;
text-transform: uppercase;
padding: 12px 24px;
border-radius: 999px;          /* pill */
hover: border-color → var(--gold); color → var(--gold)
hover: magnetic translate
```

### Button Rules
- Both buttons are pill-shaped (999px radius). No rectangular buttons anywhere.
- Both have uppercase + tracked text. Never sentence-case.
- The `.btnGhost` arrow (`→`) is a content-level addition, not a CSS pseudo-element.
- The v7-patch adds `.btn-primary` and `.btn-secondary` variants — these are for product pages only, NOT the Homepage.

---

## 8. Motion Language (Actual)

The Homepage has the richest motion vocabulary on the site. Other pages may use SUBSETS, never the full set.

### Motion Categories

| Category | Examples | Where Allowed |
|---|---|---|
| **Entrance reveal** | `.rv` opacity+translate, `.hline` rise, decode chars, counter | All pages |
| **Constant ambient** | particle drift, globe rotation, chain pulse, status pill | Homepage only |
| **Hover interaction** | `.cx` lift+corners+shine, button magnetic, glass 3D tilt, globe parallax | `.cx` hover on most pages; glass/3D on Homepage only |
| **Section transition** | `.wave` SVG stroke-draw at Hero exit | Homepage only |
| **Scroll-driven** | chain pulse uses time, not scroll; `#prog` progress bar | All pages (progress bar) |

### Motion Rules

1. **Hover indicates interaction.** Static information must remain visually stable. (v7-patch rule — preserved.)
2. **Entrance animations are one-shot.** Once revealed, content does not re-animate.
3. **Constant ambient motion is Homepage-only.** Product/Explorer pages must NOT have particles, rotating globes, or pulsing dots.
4. **All motion respects `prefers-reduced-motion`** — the inline `<noscript>` block and the `@media (prefers-reduced-motion: reduce)` block at line 208 enforce this.
5. **JS-fail-safe:** If JS fails, `.rv` is visible, `.hline>span` is visible, `nav` is static. Content is never hidden behind JS.

---

## 9. Background / Atmosphere (Actual)

### Hero Atmosphere (the richest)
- `.globe` — radial-gradient sphere with canvas-rendered 420-point Fibonacci sphere
- `.orbit` ×2 — large elliptical rings, rotated, drop-shadow glow
- `#glow` — mouse-following radial gradient
- `#px` — 44 floating particles (gold + blue2), drift animation
- Body background — flat `--bg` (no gradient mesh on body)

### Section Atmosphere (alternating)
- Even sections: `--bg` flat
- Alt sections: `--bg2` flat + `border-block: 1px solid var(--line)`
- CTA section: radial-gradient overlay at bottom (`rgba(227,180,90,.1)` ellipse)

### Atmosphere Rules

1. **No gradient mesh on body.** Body is flat `--bg`.
2. **Atmosphere belongs to specific sections** (Hero, CTA), not the page.
3. **Particles are Homepage-only.** No other page uses `#px`.
4. **Globe is Homepage-only.** Architecture may use abstract depth, not the literal globe canvas.
5. **Section borders are 1px solid `--line`**, top and bottom (`border-block`). Never only top, never only bottom.

---

## 10. Data Language (Mono)

### Where Mono is Used
- All eyebrows (`.eyebrow`, `.eyebrowC`) — actually sans, but tracked like mono. (Exception, not rule.)
- All uppercase mono labels: `.an` (product number), `.gn` (watermark), `.cmp-cell` headers, status pill text, evidence chain labels, "What You Receive" headers, "ROUA Advantage" headers, deployment cell headers
- All metadata: timestamps, source identifiers, section numbers
- All numeric stats in `.gstats`, `.ametrics`, `.kpis`
- Footer column headers (`.fG h4`)
- Disclaimer text (`.disclaim`)
- Chain arrows (`.carr`)

### Mono Rules

1. **Mono = evidence/metadata/system.** Sans = narrative. Never mix.
2. **Mono is always uppercase when used as a label.** Mono is sentence-case only in disclaimers and inline metadata.
3. **Mono font-size is always 0.56–0.72rem.** Larger mono is forbidden — it becomes hard to read.
4. **Letter-spacing on mono labels is 0.12–0.24em.** Tighter than sans labels.

---

## 11. Icons (Actual)

### Icon System
- All icons are inline SVG, `viewBox="0 0 24 24"`, `stroke="currentColor"`, `stroke-width="1.6"`, `fill="none"`, `stroke-linecap="round"`, `stroke-linejoin="round"`
- Default size: 22×22 (`.ic` class)
- Hex container: 52×58 clip-path hexagon, with `.hex.g` gold variant and `.hex` blue variant
- Deployment icon container: 66×66 `.icwrap` with spinning dashed ring (`.ring`)

### Icon Usage Patterns
1. **Hex-contained icon** — for product/feature classification (Hero chips, product cards, deployment cells)
2. **Bare icon** — for inline UI controls (chevrons, checkmarks, arrows)
3. **Spinning-ring hex** — for deployment/architecture states only

### Icon Rules
1. **No emoji anywhere.** The site uses zero emoji.
2. **No icon fonts.** All icons are inline SVG.
3. **Stroke-width 1.6 is canonical.** 1.5 is acceptable for tiny icons. 2+ is forbidden.
4. **Hex icons use gold or blue variant, never both at once on the same hex.**

---

## 12. Section Rhythm & Transitions (Actual)

### Homepage Section Sequence
```
1. HERO              — bg, atmosphere rich
2. PRODUCTS          — bg2, alt band
3. FIPES             — bg, primary
4. PRODUCT OUTPUTS   — bg, primary
5. ONE EVENT         — bg, compressed (64px)
6. WORKFLOW SCOPE    — bg2, compressed (64px)
7. WHO USES          — bg, primary
8. WHY DIFFERENT     — bg, primary
9. HOW IT WORKS      — bg2, alt band
10. TRUSTED FOUNDATION — bg2, alt band
11. TRUST STRIP      — bg2, compressed (48px)
12. CTA              — bg, with radial-gradient overlay
13. FOOTER           — bg2
```

### Rhythm Rules
1. **Alternating bg/bg2 creates section rhythm.** Never two consecutive sections with the same background.
2. **Compressed sections (48–64px) are for transitional content** (Trust Strip, One Event, Workflow Scope).
3. **Standard sections are 88px padding.** CTA is 120px (terminal emphasis).
4. **Hero-to-Products transition uses `.wave` SVG** — the only section-to-section visual bridge on the site.

---

## 13. Visual Density (Actual)

The Homepage is the DENSEST page on the site. This is intentional — it is the brand layer.

### Density Markers
- Hero glass card: 6 distinct information zones (brand, status, title, tag, 4 stats, footnote)
- Product cards: 7 zones (number watermark, hex icon, product label, title, description, buyer/problem, what-you-receive chips, ROUA advantage, explore row)
- Comparison rows: 3 columns × 5 rows = 15 cells
- CTA product row: 6 tiles in one row
- Footer: 7 columns

### Density Rule
> Other pages should be LESS dense than the Homepage. Product pages split density across multiple sections. The Homepage compresses everything into 12 sections because it is the brand layer.

---

## 14. Responsive Behavior (Actual)

### Breakpoint: 1020px
- Hero grid: 1fr 1fr → 1fr
- Products grid: 1fr 1fr → 1fr
- Stage flow: 1fr auto 1fr auto 1fr → 1fr (arrows rotate 90°)
- Who Uses: 4 cols → 2 cols
- Deployment: 4 cols → 2 cols
- Footer: 7 cols → 2 cols
- Comparison rows: 3 cols → 1 col
- Globe: pushed further right (-430px), opacity reduced to 0.5
- Nav: `.nlinks` hidden (no hamburger — known issue)

### Breakpoint: 700px
- Feature chips: 3 cols → 1 col

### Responsive Rules
1. **Single breakpoint at 1020px for major restructure.** 700px is a minor adjustment only.
2. **Globe does not disappear on mobile** — it persists at reduced opacity. This is intentional brand atmosphere.
3. **Nav has no mobile menu.** This is a known issue to fix, NOT a design choice to preserve.

---

# PART B — TRUST GRAMMAR

## 15. Trust Grammar (Actual, from Homepage)

Trust Grammar is the semantic system that distinguishes **what the source says** from **what ROUA derives**. It is SEPARATE from Visual Identity.

### The 7 Trust Labels (Actual Usage)

| Label | Meaning | Visual Treatment | Homepage Usage |
|---|---|---|---|
| **Verified Event** | An event confirmed against an official source | Gold uppercase mono label + bold value text | One Event section, line 811 |
| **Verified** (loose) | Generic "this has been checked" — WEAK usage | Inline mono, green (`--op`) or gold | Used loosely at lines 506, 780, 905 |
| **Source** | The official document/organization | Mono label + linked text or inline reference | Throughout (Source Registry, source names) |
| **Evidence** | The chain linking output back to source | Mono uppercase label + gold accent | Heavy usage: "Evidence-Linked", "Evidence Chain", "Evidence Confidence" |
| **Provenance** | The structured lineage (source · page · paragraph) | Mono label + structured text | Lines 622, 931, 1112 |
| **Illustrative** | Marker indicating platform-scale data is illustrative | Italic, dim2, parenthetical | Line 1075: "(Illustrative platform scale)" |
| **Governance** | The validation-before-analysis property | Mono uppercase label | Lines 367, 931 |

### Trust Grammar Drift (Issues Found in Homepage)

These are NOT to be fixed now. They are documented for the comparison phase.

1. **"411+" sources in Hero stats** (line 355) — presented as factual, but only marked "Illustrative" at line 1075 (Trusted Foundation section). Inconsistent.
2. **"Evidence" as a stat value** (line 356: `<b>Evidence</b><span>LINKED OUTPUTS</span>`) — uses a trust label as a metric. Confusing.
3. **"Verified market context"** (line 780) — uses "Verified" loosely, not as a strict trust label.
4. **"Verified financial content"** (line 506) — same loose usage.
5. **Footer "CHANNELS" column** (lines 1196–1200) — duplicates "Solutions" column with overlapping links. Was supposed to be removed in P0 sweep but survived on the original Homepage.
6. **"Trading Intelligence Platform"** (line 904) — uses old taxonomy. Should be "Trading Desks" per locked taxonomy.
7. **"Banks & Financial Institutions"** (line 898) — buyer name not in locked taxonomy.
8. **No "ROUA Context" label exists yet** — the locked grammar requires distinguishing "what the source says" from "what ROUA derives", but the Homepage does not use a "ROUA Context" label anywhere. Product pages do (via dashed gold border + "Illustrative" tag).
9. **"confidence scored"** (line 622) — uses old terminology. Should be "confidence signals" or "verification tier" per locked grammar.

### Trust Grammar Rules (Locked, from Prior Product-Page Work)

These rules apply to ALL pages including the Homepage. The Homepage currently violates some — those violations are documented above, NOT fixed in this audit.

1. **Verified Fact/Event** = solid card surface. What the source says.
2. **ROUA Context** = dashed gold border + "Illustrative" label + "not source fact" note. What ROUA derives.
3. **Source Document** = clickable direct link, never just a name.
4. **Evidence** = mono label, always paired with provenance (source · section · paragraph).
5. **Provenance** = structured metadata, never prose.
6. **Illustrative** = italic, dim2, parenthetical. NEVER used for verified facts.
7. **Governance** = mono uppercase label, indicates validation-before-analysis.
8. **"audit-ready"** = forbidden except on `risk-intelligence.html` (legitimate risk context).
9. **"within seconds"** = forbidden. Use "through configured source monitoring".
10. **"every claim"** = forbidden. Use "governed claims".
11. **"VERIFIED INTELLIGENCE OBJECT"** = forbidden. Use "GOVERNED INTELLIGENCE OBJECT".
12. **"Trust Promise"** = forbidden. Use "Trust Property".
13. **"Provenance Immutability"** = forbidden. Use "Versioned Provenance".
14. **"Confidence score"** = forbidden. Use "Confidence signals" or "Verification tier".

---

# PART C — DRIFT FINDINGS

## 16. Where `VISUAL-IDENTITY-SYSTEM.md` Diverges from Reality

The earlier document (Aug 7) was aspirational. The implementation drifted. This section catalogs the divergences — for the comparison phase, NOT for fixing the Homepage.

| Dimension | `VISUAL-IDENTITY-SYSTEM.md` says | `index.html` actually does | Which wins |
|---|---|---|---|
| Gold color | `#C9A227` (muted) | `#e3b45a` (brighter) | **Actual (`#e3b45a`)** |
| Glassmorphism | "Why Not Glassmorphism" (forbidden) | `.glass` is the Hero signature | **Actual (glass is allowed in Hero)** |
| Background | `#080B12` | `#040b1c` | **Actual** |
| Graphite surface | `#131B27` | `#0a1630` (`--panel`) | **Actual** |
| Border steel | `#2A3543` | `rgba(148,184,255,.14)` (`--line`) | **Actual** |
| Primary text | `#F5F7FA` | `#eaf2ff` (`--txt`) | **Actual** |
| 8px grid | "The 8px Grid" enforced | Rhythm-by-eye, no strict grid | **Actual (no strict 8px)** |
| Mono font | (not specified in §3 snippet) | `'Fira Code', 'SFMono-Regular', Consolas, monospace` | **Actual** |
| Sans font | (not specified in §3 snippet) | `Inter, -apple-system, 'Segoe UI', Roboto, sans-serif` | **Actual** |

### What this means for the comparison phase
- Pages using `#C9A227` gold are drifting — must be repointed to `#e3b45a`.
- Pages using `#080B12`-ish backgrounds are drifting — must be repointed to `#040b1c`.
- Pages using `#131B27`-ish surfaces are drifting — must be repointed to `#0a1630`.
- Pages with strict 8px spacing are NOT drifting (they're more disciplined than the Homepage) — this is acceptable for product/explorer pages.

---

# PART D — COMPARISON METHODOLOGY

## 17. How To Compare Other Pages Against This Reference

When auditing any other page against ROUA Visual System v1, run this checklist:

### Visual Identity Checklist (14 items)
1. **Color tokens** — Does the page use `#e3b45a` gold, `#040b1c` bg, `#0a1630` panel? (Check both inline styles and CSS files.)
2. **Typography** — Does the page use Inter sans + Fira Code mono? Are type sizes from the §2 scale?
3. **Container** — Does the page use `.wrap` (1240px max, 28px padding)?
4. **Section rhythm** — Does the page alternate `--bg` / `--bg2`? Is padding 88px standard?
5. **Card hierarchy** — Does the page use `.cx` for interactive, `.panel` for static, and (only if product page) `.glass-status-card` for Hero?
6. **Hero composition** — Does the page have a single Hero? Does it use `.glass` (only if Homepage)?
7. **Navigation** — Does the page use the standard `<nav id="navbar">` with 5 dropdowns?
8. **Buttons** — Does the page use `.btnGold` and `.btnGhost` only? (Product pages may use `.btn-primary`/`.btn-secondary`.)
9. **Motion** — Does the page use entrance reveals only? (Constant ambient motion is Homepage-only.)
10. **Background** — Is the body flat `--bg`? (No gradient mesh.)
11. **Mono usage** — Is mono reserved for metadata/labels/evidence? (Never for body or headlines.)
12. **Icons** — Are all icons inline SVG, stroke-width 1.6, no emoji?
13. **Density** — Is the page less dense than the Homepage? (Except Architecture, which may match.)
14. **Responsive** — Does the page collapse at 1020px? Does it have a mobile nav solution?

### Trust Grammar Checklist (14 items)
1. **Verified Fact/Event** — Used as a solid card with the source's literal claim?
2. **ROUA Context** — Used with dashed gold border + "Illustrative" label?
3. **Source Document** — Always a clickable direct link, never just a name?
4. **Evidence** — Always paired with provenance (source · section · paragraph)?
5. **Provenance** — Structured metadata, never prose?
6. **Illustrative** — Italic, dim2, parenthetical, never on verified facts?
7. **Governance** — Mono uppercase, indicates validation-before-analysis?
8. **"audit-ready"** — Absent except on `risk-intelligence.html`?
9. **"within seconds"** — Absent? (Use "through configured source monitoring".)
10. **"every claim"** — Absent? (Use "governed claims".)
11. **"VERIFIED INTELLIGENCE OBJECT"** — Absent? (Use "GOVERNED INTELLIGENCE OBJECT".)
12. **"Trust Promise"** — Absent? (Use "Trust Property".)
13. **"Provenance Immutability"** — Absent? (Use "Versioned Provenance".)
14. **"Confidence score"** — Absent? (Use "Confidence signals" or "Verification tier".)

### Page-Category-Specific Adjustments
- **Product pages:** May use `.glass-status-card` from `styles.css` instead of `.glass`. May use `.btn-primary`/`.btn-secondary`. Must NOT use globe, particles, wave, or constant ambient motion.
- **Architecture:** May use orbits/depth for infrastructure visualization. Must NOT use the literal globe canvas. Must NOT use `.glass`.
- **Explorers (Evidence/Source):** Must use `.card-evidence` (v7-patch) for evidence rows. Must NOT use `.cx` hover theatrics. Minimal motion.
- **Developer:** Mono-heavy. Code blocks. May use `.cx` for endpoint cards.

---

## 18. What This Document Is NOT

- It is NOT a redesign brief. The Homepage is not changing.
- It is NOT a global sweep trigger. We do NOT start fixing other pages until each is audited.
- It is NOT a replacement for `VISUAL-IDENTITY-SYSTEM.md`. That document is retained as historical context. Where the two conflict, this document wins.
- It is NOT a Trust Grammar enforcement document. Trust Grammar violations on the Homepage (§15) are documented, NOT fixed.

---

## 19. Next Steps (Operational)

1. **This document is committed to the repo.** It becomes the canonical reference.
2. **No modifications to `index.html`** unless a real defect is found (not a style preference).
3. **Page-by-page comparison** begins against this reference, one page at a time.
4. **Each page audit produces a delta report** listing: (a) Visual Identity drift, (b) Trust Grammar drift, (c) Category-specific violations.
5. **Fixes are applied page-by-page**, NOT as global sweeps. Each fix is committed independently.
6. **The Homepage is touched only if** a delta report against THIS document shows the Homepage itself has drifted (which would mean this document needs updating, not the Homepage).

---

*End of ROUA Visual System v1.*

# ROUAA Institutional Intelligence Design System

## The Visual, Informational, Operational, and Cognitive Foundation for Financial Intelligence Infrastructure

> This is not a website design. This is the institutional design system from which every ROUAA interface, component, and interaction will naturally emerge.

---

## 1. VISUAL DIRECTION

### Core Metaphor

ROUAA looks like **the blueprint of a financial institution's nervous system** — the infrastructure that connects official sources to defensible decisions. Not a building. Not a machine. A **living evidence architecture**.

### What ROUAA Looks Like

Imagine walking into the engineering room beneath a central bank. The walls are dark navy. The screens show data flowing through verified pipelines. Every number has a source. Every conclusion has a chain. The room is quiet, precise, and authoritative. Nothing is decorative. Everything is functional. The light is dim but clear. The air feels institutional.

That is ROUAA.

### What ROUAA Does NOT Look Like

| ❌ Never This | ✅ Always This |
|---|---|
| Crypto luxury (gold gradients, neon) | Institutional precision (muted tones, structure) |
| AI startup (purple gradients, robot icons) | Infrastructure company (engineering diagrams, evidence) |
| SaaS marketing (friendly illustrations, rounded cards) | Institutional system (structured panels, audit trails) |
| Bloomberg clone (orange-on-black terminal) | New category (navy + muted gold + evidence language) |
| Military/cyberpunk (dark green, scan lines) | Calm authority (deep navy, soft light, deliberate motion) |

---

## 2. COLOR SYSTEM

### Primary Palette

```
INSTITUTIONAL NAVY (background)
#080B12 — the room. Deep, authoritative, quiet.

GRAPHITE (surfaces)
#131B27 — the panels. Structured, visible, layered.

BORDER STEEL
#2A3543 — the structure. Visible edges, architectural.

BORDER STRONG
#38465A — the emphasis. Clear divisions, intentional.
```

### Text Hierarchy

```
WHITE (primary text)
#F5F7FA — headlines, key data, decisions.

LIGHT SLATE (secondary text)
#C4CCDA — body text, descriptions, context.

MUTED STEEL (metadata)
#949EAF — labels, timestamps, system identifiers.
```

### Accent — Muted Institutional Gold (Trust Signal, NOT Brand Color)

```
INSTITUTIONAL GOLD
#C9A227 — used ONLY for:
  • "Verified" status badges
  • Evidence chain final nodes
  • Trust indicators (e.g., "Evidence Verified")
  • Certification marks

GOLD HOVER
#D4B542 — interaction state only.

GOLD SUBTLE (backgrounds)
rgba(201, 162, 39, 0.06) — barely-there tint for verified zones.

GOLD BORDER
rgba(201, 162, 39, 0.20) — luminous edge for verified elements.
```

### Primary Interaction Color — Steel Blue-Gray

```
STEEL BLUE-GRAY (primary interaction)
#7B8FA8 — buttons, links, hover states, active navigation
This is the WORKING color. Gold is the TRUST color.

STEEL HOVER
#94A8C1 — lighter on hover

STEEL SUBTLE
rgba(123, 143, 168, 0.08) — subtle background for active states
```

**Gold vs Steel Rule**:
- Gold = "this has been verified" (trust signal, like a central bank seal)
- Steel = "this is interactive" (buttons, links, hover, active states)
- Gold is NOT the primary interaction color. Steel is.
- Gold appears maybe 5-10 times per page. Steel can appear 50+ times.
- If everything is gold, gold means nothing.

### Functional Colors

```
OPERATIONAL GREEN
#20A878 — system is running. Not neon. Desaturated, calm.

ALERT RED
#E5484D — something requires attention. Used sparingly.

INFO BLUE
#4A90D9 — informational state. Not the brand color.

WARNING AMBER
#F5A623 — caution. Distinct from gold (amber is brighter, warmer).
```

### Color Psychology

The palette communicates:
- **Navy** → institutional depth, trust, authority
- **Graphite** → structure, engineering, layers
- **Gold** → verified, official, evidence-backed
- **Green** → operational, alive, functioning
- **White** → clarity, decision, truth

The combination says: "This is a financial institution that has engineered trust into its architecture."

---

## 3. TYPOGRAPHY

### Font Family

```
PRIMARY: Inter (400, 500, 600, 700, 800)
— Institutional grotesk. Clear, neutral, precise.
— Not playful, not decorative, not geometric-cute.

MONOSPACE: JetBrains Mono (400, 600)
— For data only: IDs, timestamps, evidence locations, pipeline labels.
— Never for body text. Never for headings. Never for decoration.
```

### Type Scale (8px grid)

```
Hero          56px / 700 / 1.1 / -0.02em
H2            40px / 700 / 1.15 / -0.02em
H3            24px / 600 / 1.3 / -0.01em
H4            21px / 600 / 1.3 / 0
Body Large    18px / 400 / 1.7 / 0
Body          16px / 400 / 1.7 / 0
Body Small    14px / 400 / 1.6 / 0
Label         13px / 600 / 1.4 / 0.08em uppercase
Mono Label    12px / 600 / 1.4 / 0.08em uppercase
Mono Data     13px / 400 / 1.5 / 0
```

### Typography Rules

1. **Headlines are white.** Never gold, never colored. Gold is for ONE keyword only.
2. **Body text is light slate** (#C4CCDA). Never white (too bright for long reading).
3. **Monospace is data.** If it's not a data value (ID, timestamp, coordinate), it's not monospace.
4. **Labels are uppercase, tracked.** `font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;`
5. **Numbers are tabular.** `font-variant-numeric: tabular-nums;` for all data displays.
6. **Line height is generous.** Body: 1.7. Headlines: 1.1-1.15. Never below 1.1.

### Typography Hierarchy Feeling

The type should feel like **a well-structured legal document** — clear hierarchy, generous breathing room, every word intentional. Not a marketing brochure. Not a terminal dump.

---

## 4. SPACING PHILOSOPHY

### The 8px Grid

Every space is a multiple of 8:
```
4px   — tight (icon gaps, badge padding)
8px   — compact (inline elements)
16px  — standard (card internal gaps)
24px  — comfortable (card padding, section header gaps)
32px  — spacious (between related groups)
48px  — section internal breaks
64px  — section padding (mobile)
80px  — section padding (desktop, reduced)
96px  — section padding (desktop, standard)
```

### Spacing Rules

1. **Whitespace is luxury.** Premium platforms breathe. Don't fill every pixel.
2. **Section rhythm varies.** Not every section is 96px. Some are 64px (dense), some are 128px (dramatic pause).
3. **Cards have 24px padding.** Always. Not 16px (too tight), not 32px (too airy).
4. **Grid gaps are 24px.** Between cards, between columns. Consistent.
5. **Section headers have 48px margin-bottom.** Enough to separate concept from content.

---

## 5. LAYOUT LANGUAGE

### Layout Principles

1. **Not every section is cards.** Mix:
   - Full-width narrative sections (text + subtle visual)
   - Architectural diagrams (SVG, structured)
   - Asymmetric layouts (2:1 or 1:2 splits)
   - Timeline sections (horizontal or vertical flow)
   - Evidence pathways (connected nodes)
   - Large typography statements (minimal, powerful)
   - Interactive exploration (split panels)
   - Comparison tables (structured data)
   - Negative space (intentional emptiness)

2. **The rhythm constantly changes.**
   - Section 1: centered hero (symmetric)
   - Section 2: full-width diagram (horizontal)
   - Section 3: split panel (asymmetric)
   - Section 4: centered visual (symmetric)
   - Section 5: full-width table (structured)
   - Section 6: 4-column strip (grid)
   - Section 7: centered CTA (symmetric)

3. **Content width varies:**
   - Text: 720px (readable, focused)
   - Diagrams: 1080px (wide, detailed)
   - Full-width: 100% (immersive)
   - Tables: 880px (structured, scannable)

4. **Alignment is centered for marketing, left for data.**
   - Hero, section headers, CTA: centered
   - Tables, evidence traces, console panels: left-aligned
   - Layer explorer: split (nav left, detail right)

### Layout Anti-Patterns

❌ Every section is a grid of 3-4 cards
❌ Every section has the same padding
❌ Every section is centered text
❌ Every card is the same size
❌ No full-width elements
❌ No asymmetric layouts
❌ No negative space

---

## 6. ILLUSTRATION STYLE

### Original Style: "Institutional Blueprints"

ROUAA's illustrations are **abstract architectural diagrams** — not marketing illustrations. They look like:

- **Engineering schematics** of intelligence pipelines
- **Network topology** showing source-to-decision flow
- **Layered system diagrams** showing 7-layer architecture
- **Evidence maps** showing provenance chains
- **Knowledge architecture** showing entity relationships
- **Precision diagrams** with measurements, labels, annotations

### Visual Language

```
Lines:     1px-1.5px stroke, consistent weight
Nodes:     rectangles with rounded corners (3-5px), labeled
Connectors: dashed lines with arrows, animated stroke-dashoffset
Labels:    monospace, uppercase, tracked
Colors:    white lines on navy, gold for verified nodes
Depth:     layering via opacity (30%, 50%, 100%)
Texture:   subtle grid backgrounds (data-center feel)
```

### What Illustrations Show

1. **Pipeline flow** — sources → layers → applications
2. **Evidence chains** — source → document → fact → evidence → output
3. **Architecture stack** — 7 layers, connected, governed
4. **Source ecosystem** — 411+ sources mapped by type/jurisdiction
5. **Decision pathways** — from event to committee-ready brief

### What Illustrations Do NOT Show

❌ People
❌ Robots
❌ AI brains
❌ Floating cubes
❌ City skylines
❌ Abstract gradients
❌ Marketing illustrations
❌ 3D renders

---

## 7. ICONOGRAPHY

### Style

Custom SVG icons, **not stock libraries**. Consistent style:
- **Stroke-width**: 1.5px (all icons, no exceptions)
- **Style**: outline (line art), not filled
- **Size**: 16px (inline), 24px (cards), 32px (feature), 48px (detail panels)
- **Color**: `currentColor` (inherit from parent)
- **Corners**: slight rounding on line endpoints (`stroke-linecap: round`)

### Icon Categories

```
SOURCE ICONS:
  Central Bank → classical building with columns
  Regulator → shield with checkmark
  Statistical Agency → bar chart
  Corporate Filing → document with lines
  Exchange → ascending graph

LAYER ICONS:
  Source Registry → database cylinder
  Document Intelligence → document with magnifier
  Fact Engine → checkmark in circle
  Event Engine → lightning bolt
  Evidence Layer → shield with document
  Knowledge Graph → connected nodes
  Governance → shield with gavel/scales

STATUS ICONS:
  Operational → green dot (pulsing)
  Verified → gold checkmark
  Building → amber gear
  Ready → blue circle

NAVIGATION ICONS:
  Minimal chevrons, arrows, dots
  No hamburger menus on desktop
```

---

## 8. ANIMATION PRINCIPLES

### Motion Philosophy

Motion in ROUAA is **operational, not decorative**. Every animation communicates system state — nothing animates "because it looks nice."

### Animation Types

```
SCROLL REVEAL
  What: Elements fade in + slide up as they enter viewport
  How: opacity 0→1, translateY 24px→0
  Duration: 600ms
  Easing: cubic-bezier(0.4, 0, 0.2, 1)
  Stagger: children delay 80ms each

HOVER STATES
  What: Cards lift slightly + border brightens
  How: translateY(-2px), border-color → accent-border
  Duration: 300ms
  Easing: ease

PULSE (LIVE INDICATORS)
  What: Green dots pulse to show system is alive
  How: opacity 1→0.3→1
  Duration: 2.5s
  Easing: ease-in-out
  Infinite: yes (but disabled by prefers-reduced-motion)

PROGRESSIVE DISCLOSURE
  What: Description hidden, revealed on hover
  How: max-height 0→60px, opacity 0→1
  Duration: 300ms

PANEL TRANSITION
  What: Layer explorer detail panel switches
  How: opacity 0→1, translateX 12px→0
  Duration: 400ms

PIPELINE FLOW
  What: Dashed connector lines animate (stroke-dashoffset)
  How: stroke-dashoffset animation
  Duration: 1.6s
  Infinite: yes (subtle, not distracting)
```

### Animation Rules

1. **Duration**: 200-600ms. Never longer. Never shorter (except pulses).
2. **Easing**: `ease` or `cubic-bezier(0.4, 0, 0.2, 1)`. Never `linear` (feels robotic).
3. **Stagger**: 80ms between siblings. Creates "cascade" feeling.
4. **Reduced motion**: `prefers-reduced-motion: reduce` disables ALL animations.
5. **No continuous animations** except: pulse dots, pipeline flow lines.
6. **No bounce, no elastic, no spring.** ROUAA is calm, not playful.

---

## 9. COMPONENT LANGUAGE

### Component Family

Each component belongs to the same design language. They share:
- Same border treatment (1px solid, steel color)
- Same border-radius (3-5px — sharp, institutional)
- Same padding rhythm (8px grid)
- Same transition timing (300ms ease)
- Same color tokens (navy, graphite, gold, green)

### Component Inventory

```
STRUCTURAL:
  • Hero (centered, data-grid bg, radial glow)
  • Section header (eyebrow + h2 + description)
  • Section divider (gradient line, 1px)
  • CTA strip (centered, buttons)

DATA DISPLAY:
  • Pipeline schematic (zones + layers + flow connectors)
  • Evidence chain diagram (SVG, 5 nodes, dashed connectors)
  • System status console (table, zebra-striped, status badges)
  • Comparison table (2-column, alternating rows)
  • Source registry table (browsable, filterable)

INTERACTIVE:
  • Layer explorer (split panel: nav + detail)
  • Hover-reveal cards (progressive disclosure)
  • Tab switcher (sample library)
  • Step navigator (evidence explorer)

STATUS:
  • Status badge (operational/verified/building/supported)
  • Pulse dot (live indicator)
  • Trust pill (hero status indicators)

NAVIGATION:
  • Navbar (sticky, blur background, dropdown menus)
  • Footer (multi-column, institutional)
  • Breadcrumb (if needed)
```

### Component Design Rules

1. **Borders are visible.** Cards have 1px borders that are clearly visible against the background. No invisible cards.
2. **Border-radius is 3-5px.** Sharp, institutional. Not 12px (too soft), not 0px (too harsh).
3. **Hover is meaningful.** Every hover state communicates "this is interactive" — border brightens, card lifts, icon scales.
4. **Status badges are consistent.** Same shape, same size, same padding. Only color + text changes.
5. **Tables have structure.** Zebra striping (alternating rows), clear column headers, hover row highlight, monospace data column.

---

## 10. SECTION RHYTHM

### Rhythm Pattern

The page should breathe like a well-composed piece of music:

```
INTRO (loud, clear)
  Hero — large, centered, radial glow

BUILD (structured, detailed)
  Pipeline — full-width diagram, dense

EXPLORE (interactive, focused)
  Layer Explorer — split panel, asymmetric

PROVE (visual, powerful)
  Evidence Chain — centered SVG, dramatic

VERIFY (dense, authoritative)
  System Status — table, structured

ARGUE (comparative, persuasive)
  Why Seven Layers — comparison table

OFFER (practical, clear)
  Deployment — 4-column strip

CLOSE (direct, action-oriented)
  CTA — centered, button with glow
```

### Section Background Alternation

```
Section 1 (Hero):     bg-primary (#080B12) + grid + glow
Section 2 (Pipeline): bg-secondary (#0B0F18) — subtle shift
Section 3 (Explorer): bg-primary (#080B12) — back to base
Section 4 (Evidence): bg-secondary (#0B0F18) — shift
Section 5 (Status):   bg-primary (#080B12) — back to base
Section 6 (Why):      bg-secondary (#0B0F18) — shift
Section 7 (Deploy):   bg-primary (#080B12) — back to base
Section 8 (CTA):      bg-primary + radial glow — dramatic close
```

### Section Divider

Between sections: 1px gradient line (transparent → border-strong → transparent). Creates visual pause without heavy separation.

---

## 11. IMAGE DIRECTION

### If Photography Is Used

- **Minimal** — 1-2 images max per page, only where they add meaning
- **Editorial** — museum-quality, abstract, architectural
- **Treatment** — desaturated, dark, cropped tight
- **Never**: smiling teams, handshakes, city skylines, stock photos, people in meetings

### If Illustration Is Used

- **Original** — custom SVG diagrams, not stock illustrations
- **Architectural** — blueprints, schematics, topology maps
- **Abstract** — no literal objects, no metaphors that distract
- **Technical** — labeled, measured, precise

### Preferred Visual Assets

1. SVG diagrams (pipeline, evidence chain, architecture stack)
2. Data visualizations (status console, comparison tables)
3. Abstract grid backgrounds (data-center feel)
4. Radial gradient glows (depth, not decoration)

---

## 12. INTERACTION PHILOSOPHY

### How ROUAA Feels to Use

1. **Calm.** Nothing flashes. Nothing bounces. Nothing demands attention.
2. **Responsive.** Every hover is acknowledged. Every click has feedback.
3. **Deliberate.** Animations are slow enough to notice but fast enough to not wait.
4. **Structured.** Elements don't move randomly. They follow the grid.
5. **Confident.** The interface doesn't apologize. It doesn't explain itself excessively. It presents and lets the user explore.

### Interaction States

```
DEFAULT:    Element at rest. Calm. Clear.
HOVER:      Element acknowledges presence. Border brightens, card lifts.
ACTIVE:     Element confirms action. Brief scale-down (0.98) then release.
FOCUS:      Element shows keyboard accessibility. Gold outline, 2px.
LOADING:    Element shows system working. Skeleton shimmer, not spinner.
ERROR:      Element shows problem. Red accent, clear message.
SUCCESS:    Element shows completion. Green checkmark, brief fade.
DISABLED:   Element shows unavailability. 40% opacity, no cursor.
```

### Touch/Mobile Interactions

- Hover states replaced with tap states
- Progressive disclosure always visible on mobile (no hover dependency)
- Swipe gestures for tab switchers
- Collapsible sections for long content

---

## 13. BRAND PERSONALITY SUMMARY

### ROUAA Is:

| Trait | How It's Expressed Visually |
|---|---|
| **Calm** | Slow animations, generous whitespace, muted colors |
| **Confident** | Large typography, clear hierarchy, no excessive decoration |
| **Engineered** | Grid system, structured layouts, technical diagrams |
| **Auditable** | Evidence chains, status consoles, provenance trails |
| **Global** | Multi-jurisdiction sources, universal visual language |
| **Institutional** | Navy + gold palette, institutional typography, serious tone |

### ROUAA Is NOT:

| Anti-Trait | What We Avoid |
|---|---|
| Loud | No neon, no bright colors, no large decorative elements |
| Flashy | No gradients fills, no glow effects (except CTA), no animations that distract |
| Trying to impress | No "look at our AI" visuals, no tech buzzwords, no vanity metrics |
| Playful | No bounce animations, no emoji, no casual language |
| Generic | No stock photos, no template layouts, no Bootstrap defaults |

---

## 14. IMPLEMENTATION CHECKLIST

When building any ROUAA page, verify:

```
COLOR:
  ☐ Background uses --rouaa-bg-primary or --rouaa-bg-secondary
  ☐ Cards use --rouaa-surface with visible borders
  ☐ Gold used ONLY for verified/CTA/hero keyword
  ☐ Body text is --rouaa-text-secondary (not white, not muted)
  ☐ Labels are uppercase, tracked, gold or muted

TYPOGRAPHY:
  ☐ Headlines are white, 700 weight
  ☐ Body is 16px, 400 weight, 1.7 line-height
  ☐ Monospace ONLY for data values (IDs, timestamps)
  ☐ One gold keyword max per heading

SPACING:
  ☐ All spacing is multiples of 8px
  ☐ Section padding: 80-96px desktop, 56-64px mobile
  ☐ Card padding: 24px
  ☐ Grid gap: 24px

LAYOUT:
  ☐ Not every section is cards
  ☐ Section rhythm varies (centered, full-width, split, asymmetric)
  ☐ Background alternates between primary/secondary
  ☐ Content width varies (720px text, 1080px diagrams)

ANIMATION:
  ☐ Scroll reveal on key elements
  ☐ Hover states on all interactive elements
  ☐ Pulse on live indicators
  ☐ prefers-reduced-motion respected
  ☐ No continuous animations except pulses and flow lines

COMPONENTS:
  ☐ Border-radius: 3-5px (not 8px+, not 0px)
  ☐ Status badges consistent (same shape, size, padding)
  ☐ Tables have zebra striping
  ☐ SVG icons: 1.5px stroke, outline style, currentColor
  ☐ No stock icons (FontAwesome, etc.) — custom SVG only

ACCESSIBILITY:
  ☐ Text contrast meets WCAG AA (4.5:1 minimum)
  ☐ Focus states visible (gold outline)
  ☐ Keyboard navigable
  ☐ Touch targets ≥ 44px
  ☐ alt text on all images
  ☐ aria-labels on interactive elements
```

---

## 15. THE ROUAA FEEL

### The 5-Second Test

When a visitor lands on any ROUAA page, within 5 seconds they should feel:

1. **"This is institutional."** — Not a startup, not a SaaS, not a crypto project.
2. **"This is engineered."** — Not a marketing page, but a system architecture.
3. **"This is trustworthy."** — Evidence, provenance, governance are visible.
4. **"This is calm."** — No urgency, no pop-ups, no aggressive CTAs.
5. **"This is premium."** — Whitespace, typography, and precision convey quality.

### The 30-Second Test

After 30 seconds of scrolling, the visitor should understand:

1. ROUAA is infrastructure, not a tool.
2. Every output has a traceable evidence chain.
3. The system is operational, not conceptual.
4. It's built for institutions, not individuals.
5. It connects sources to decisions through governance.

If they don't understand these 5 things in 30 seconds, the visual identity has failed.

---

## 16. STRUCTURED SURFACES (NOT GLASSMORPHISM)

### Why Not Glassmorphism

Glassmorphism (backdrop-filter, transparency, blur) is associated with:
- SaaS dashboards
- Consumer AI products
- Apple-style interfaces
- Modern marketing sites

ROUAA is NOT any of these. ROUAA is institutional infrastructure.

### What ROUAA Uses: Structured Surfaces

```
SOLID GRAPHITE PANELS
Background: #131B27 (solid, not transparent)
Borders: #2A3543 (hard, visible, structural)
No backdrop-filter
No transparency
No blur

LAYER SEPARATION
Layers are separated by:
  1. Solid background color shifts (#080B12 → #0B0F18)
  2. Hard 1px borders (#2A3543)
  3. Section dividers (gradient lines)
  NOT by: transparency, blur, or glass effects

HARD BOUNDARIES
Every panel, card, and surface has:
  - A visible solid border
  - A distinct solid background
  - Clear edge definition
  - No ambiguity about where one element ends and another begins
```

### Surface Hierarchy

```
Level 0: Page background     #080B12 (deepest)
Level 1: Section alt          #0B0F18 (subtle shift)
Level 2: Panel/Card surface   #131B27 (clearly visible)
Level 3: Elevated surface     #18222F (hover/active)
Level 4: Input/Data surface   #0D1119 (darker, for data fields)
```

Each level is a SOLID color. No transparency. No blur. Hard boundaries.

---

## 17. INTELLIGENCE OBJECT COMPONENT

### The Core Component That Defines ROUAA

This is the component that Bloomberg doesn't have. ChatGPT doesn't have. Only ROUAA has it.

An Intelligence Object is a **verified, reusable, traceable financial intelligence artifact**.

### Component Structure

```
┌─────────────────────────────────────────────┐
│ INTELLIGENCE OBJECT                         │
│                                             │
│ TYPE:        Monetary Policy Event          │
│ ENTITY:      Federal Reserve                │
│ FACT:        Rate maintained 5.25–5.50%     │
│ EVIDENCE:    FOMC Statement · Page 1 · ¶ 2 │
│ CONFIDENCE:  97% · Tier 1 · Official        │
│                                             │
│ USED BY:                                    │
│ Research · Trading · Risk · Media           │
│                                             │
│ [Gold border = verified]                    │
└─────────────────────────────────────────────┘
```

### Visual Design

```
Container: Solid graphite panel (#131B27)
Border: 1px solid #2A3543 (standard) OR gold #C9A227 (if verified)
Header: "INTELLIGENCE OBJECT" — mono, 12px, uppercase, muted
Fields: Label (mono, muted) → Value (white, 600 weight)
Confidence: Gold if ≥90%, steel if 70-89%, muted if <70%
Used By: Small pills, steel border
```

### Intelligence Object Types

```
• Source Record      — authority, jurisdiction, trust tier
• Document Record    — format, hash, publication date
• Fact Record        — metric, value, extraction confidence
• Event Record       — type, entity, impact level
• Evidence Record    — fact ref, document ref, location
• Scenario Record    — probability, assumptions, risk factors
• Intelligence Output — analysis, evidence package, audit trail
```

Each type shares the same visual container but shows different fields.

---

## 18. DEPENDENCY MODEL

### Layers Are Not a List — They're a System

Every layer card must show:
1. What it depends on (inputs from which layers)
2. What it feeds (outputs to which layers/consumers)

### Dependency Display

```
LAYER 05 — Evidence Layer

Purpose: Creates provenance chains

Depends on:
  ← Layer 02 (Document Intelligence)
  ← Layer 03 (Financial Fact Engine)

Feeds:
  → Layer 06 (Knowledge Graph)
  → Layer 07 (Intelligence Governance)
  → Applications (Research, Risk, Trading, Media)

Status: Verified
```

### Visual Design

```
Dependencies shown as:
  ← arrow + layer name (muted, mono)
Feeds shown as:
  → arrow + consumer name (steel, mono)
This creates a visual web of connections, not a flat list.
```

---

## 19. DATA OBJECTS METRICS

### Beyond Source Counts

Institutions don't just ask "how many sources?" They ask "what is the system producing?"

### Data Objects Dashboard

```
DATA OBJECTS

Documents Processed     [count]
Facts Extracted         [count]
Events Detected         [count]
Evidence Links Created  [count]
Intelligence Outputs    [count]
Pipeline Success Rate   [percentage]
```

### Visual Design

```
6 metric cards in a grid
Each: large number (gold or steel) + label (mono, muted)
Numbers use tabular-nums for alignment
Below: "Last updated: [timestamp]" in monospace
```

**Important**: Only show REAL numbers. If counts aren't available yet, show the metric structure with "—" as placeholder. Never fabricate.

---

## 20. DATA FLOW ANIMATION

### The Signature Motion of ROUAA

This is NOT a fade-in. This is **data moving through the pipeline**.

### How It Works

```
A small dot (or packet) travels:
  Source → Document → Fact → Evidence → Output

The dot is small (4px), gold (verified data moving)
It moves slowly (2s per segment)
It follows the dashed connector lines
When it reaches a node, the node briefly highlights
When it reaches the final node (Output), the node glows gold
```

### Visual Design

```
Dot: 4px circle, gold #C9A227, slight glow
Path: follows existing dashed connector lines
Speed: 2s per segment, 0.5s pause at each node
Node highlight: border brightens for 0.5s when dot arrives
Final node: gold glow pulse when dot arrives
Loop: restarts after 3s pause

Reduced motion: dot is static at final position, no animation
```

### Where to Use

- Architecture page (pipeline section)
- Evidence Explorer (chain section)
- Home page (hero pipeline)
- Product Experience Center (shared foundation)

This animation becomes the **visual signature** of ROUAA — when you see data flowing through verified layers, you know you're looking at ROUAA.

---

## 21. DATA VISUALIZATION LANGUAGE

### Not TradingView. Not Excel. ROUAA's Own.

ROUAA doesn't show price charts. It shows **intelligence relationships**.

### Visualization Types

```
1. EVENT TIMELINE
   Horizontal timeline showing:
   - When sources published
   - When facts were extracted
   - When events were classified
   - When intelligence was generated
   Each event: dot on timeline, hover shows evidence chain

2. EVIDENCE GRAPH
   Network diagram showing:
   - Source nodes (blue-gray)
   - Document nodes (graphite)
   - Fact nodes (white)
   - Evidence nodes (gold border = verified)
   - Connection lines (dashed, directional)
   Like a knowledge graph but focused on provenance

3. ENTITY NETWORK
   Shows relationships between financial entities:
   - Central bank → policy → market impact
   - Regulator → rule → affected entities
   - Corporation → filing → market reaction
   Nodes = entities, edges = relationships

4. SCENARIO TREE
   Branching diagram showing:
   - Current event at root
   - 2-3 scenario branches
   - Probability on each branch
   - Evidence supporting each branch
   - Risk factors on each branch

5. CONFIDENCE DISTRIBUTION
   Shows confidence scores across:
   - Sources (x-axis: trust tier, y-axis: count)
   - Facts (x-axis: confidence %, y-axis: count)
   - Outputs (x-axis: confidence, y-axis: type)
   Simple bar chart, monospace labels, no decoration
```

### Visualization Design Rules

```
Colors: white/steel for structure, gold ONLY for verified nodes
Lines: 1px solid (structural) or 1px dashed (flow)
Labels: monospace, 12px, muted
Background: transparent (on page bg) or panel bg
No: gradients, 3D, shadows on data elements
No: TradingView-style candlesticks, price lines, volume bars
Yes: clean, labeled, precise diagrams that look like engineering schematics
```

---

## 22. INSTITUTIONAL WORKSPACE PATTERNS

### How Applications Look

Each ROUAA application is NOT a dashboard. It's an **intelligence workspace**.

### Workspace Layout

```
┌──────────────────────────────────────────────────┐
│ NAVIGATION BAR                                    │
├──────────┬───────────────────────────────────────┤
│          │ WORKSPACE HEADER                      │
│ SIDEBAR  │ (title, metadata, last updated)       │
│          ├───────────────────────────────────────┤
│ - Items  │                                       │
│ - Items  │ INTELLIGENCE PANELS                   │
│ - Items  │ (evidence chains, fact cards,         │
│          │  scenario trees, event feeds)         │
│          │                                       │
│          ├───────────────────────────────────────┤
│          │ EVIDENCE TRAIL (bottom)               │
│          │ (trace any output to source)          │
└──────────┴───────────────────────────────────────┘
```

### Workspace Types

```
RESEARCH WORKSPACE
  Sidebar: Briefs, Macro Research, Equity Analysis, Evidence Library
  Panels: Committee brief, scenario analysis, evidence summary
  Trail: Every claim → source document

TRADING WORKSPACE
  Sidebar: Events, Scenarios, Positions, Alerts
  Panels: Event feed, market context, evidence chain
  Trail: Every signal → verified event → source

RISK WORKSPACE
  Sidebar: Exposure, Regulatory Monitor, Audit Trail
  Panels: Risk alerts, exposure breakdown, compliance
  Trail: Every alert → regulatory source → affected entities

MEDIA WORKSPACE
  Sidebar: Newsroom, Source Monitor, Drafts, Published
  Panels: Breaking story, evidence verification, publish
  Trail: Every published claim → official source

DEVELOPER WORKSPACE
  Sidebar: API Explorer, Endpoints, SDK, Keys
  Panels: Request/response, evidence metadata
  Trail: Every API response → evidence chain included
```

### Workspace Design Rules

```
- Sidebar: 240px, bg-secondary, border-right
- Header: 64px, shows title + metadata + status
- Panels: solid graphite, visible borders
- Evidence Trail: fixed bottom bar, expandable
- All workspaces share the same shell, different content
```

---

## 23. TRUST INDICATORS

### Institutional Trust Signals

Trust in ROUAA is not claimed — it's **displayed**.

### Trust Indicator Components

```
SOURCE VERIFIED
┌──────────────────────────┐
│ ✓ SOURCE VERIFIED        │
│ Federal Reserve · Tier 1 │
└──────────────────────────┘
Gold border, green check, mono text

DOCUMENT AUTHENTICATED
┌──────────────────────────┐
│ ✓ DOCUMENT AUTHENTICATED │
│ Hash: a3f8...e2b1        │
└──────────────────────────┘
Gold border, green check, mono hash

FACT EXTRACTED
┌──────────────────────────┐
│ ✓ FACT EXTRACTED         │
│ Confidence: 97%          │
└──────────────────────────┘
Gold border, confidence in gold

EVIDENCE ATTACHED
┌──────────────────────────┐
│ ✓ EVIDENCE ATTACHED      │
│ Page 1 · Paragraph 2     │
└──────────────────────────┘
Gold border, location in mono

OUTPUT GOVERNED
┌──────────────────────────┐
│ ✓ OUTPUT GOVERNED        │
│ Validation: passed       │
│ Audit trail: preserved   │
└──────────────────────────┘
Gold border, validation status
```

### Visual Design

```
Shape: small rectangular badge, 3px radius
Border: 1px solid gold (if verified) or steel (if pending)
Icon: ✓ checkmark (12px)
Text: monospace, 11px, uppercase
Background: gold-subtle (if verified) or transparent
```

### Where Trust Indicators Appear

- On every intelligence output
- On every evidence chain node
- On source records
- On document records
- On fact records
- In system status console
- In workspace headers

Trust indicators are **pervasive**. The user should see "✓ VERIFIED" everywhere they look. This is how ROUAA builds trust — not through marketing claims, but through structural, visible verification.

---

## 24. EMPTY STATES & ERROR STATES

### Institutional Systems Must Handle Failure Gracefully

#### Empty States

```
SOURCE UNAVAILABLE
┌──────────────────────────────────┐
│ Source temporarily unavailable   │
│                                  │
│ Federal Reserve · FOMC           │
│ Last successful check: 14:00 UTC │
│ Retry in: 60s                    │
│                                  │
│ [Retry Now]  [View Last Cache]   │
└──────────────────────────────────┘
Design: amber border, amber icon, mono timestamps

DOCUMENT INCOMPLETE
┌──────────────────────────────────┐
│ Document processing incomplete   │
│                                  │
│ Document: fomc_2026_08.pdf       │
│ Pages processed: 2 of 3          │
│ Issue: Page 3 extraction failed  │
│                                  │
│ [Retry Extraction]  [View Partial]│
└──────────────────────────────────┘
Design: amber border, progress indicator

LOW CONFIDENCE
┌──────────────────────────────────┐
│ Confidence below threshold       │
│                                  │
│ Fact: "Rate cut expected Q4"     │
│ Confidence: 62%                  │
│ Threshold: 80%                   │
│                                  │
│ Flagged for human review.        │
│ [Override]  [Request Review]     │
└──────────────────────────────────┘
Design: amber border, confidence in amber

HUMAN REVIEW REQUIRED
┌──────────────────────────────────┐
│ Human review required            │
│                                  │
│ Intelligence output: INT-2026-041│
│ Reason: Confidence 62% < 80%     │
│ Evidence: 2 sources (need 3+)    │
│                                  │
│ [Review Now]  [Escalate]         │
└──────────────────────────────────┘
Design: steel border, review icon
```

#### Error States

```
EXTRACTION FAILED
┌──────────────────────────────────┐
│ ⚠ Extraction failed              │
│                                  │
│ Document: fomc_2026_08.pdf       │
│ Error: PDF structure corrupted   │
│ Timestamp: 2026-08-02 14:00:14   │
│                                  │
│ [Retry]  [Report Issue]          │
└──────────────────────────────────┘
Design: red border, red icon, mono error details

SOURCE DISCONNECTED
┌──────────────────────────────────┐
│ ⚠ Source disconnected            │
│                                  │
│ Source: ECB · Statistical Release│
│ Last connection: 2h ago          │
│ Error: Connection timeout        │
│                                  │
│ [Reconnect]  [View Cache]        │
└──────────────────────────────────┘
Design: red border, red icon, mono timestamps
```

### Design Rules for States

```
Empty/Pending: amber border (#F5A623), amber icon
Error/Critical: red border (#E5484D), red icon
Review/Action: steel border (#7B8FA8), info icon
All states: monospace for IDs, timestamps, error details
All states: clear action buttons (steel, not gold)
Never: hide errors, use generic "something went wrong"
Always: show what happened, when, and what can be done
```

---

*This document is the source of truth for all ROUAA institutional design decisions. Every page, every component, every interaction must trace back to this system. ROUAA is not a website — it is an institutional intelligence infrastructure with a visual language that proves its own trustworthiness.*

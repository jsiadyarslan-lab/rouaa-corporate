# Al Jazeera Data Journalism Visual Design Brief
## For Building a Video Renderer

> Compiled from web research of Al Jazeera brand guidelines, AJ Labs output, AJ+ digital content, Territory Studio broadcast design, academic analysis (IJOC/arXiv), and award submissions (Shorty Awards, OJA).

---

## 1. COLOR PALETTE

### Primary Brand Colors (Official)
| Color | Hex | RGB | Pantone | Usage |
|-------|-----|-----|---------|-------|
| **Al Jazeera Gold** | `#DBA200` | (219, 162, 0) | 117 C | Primary accent, headlines, data highlights |
| **Al Jazeera Blue** | `#212E64` | (33, 46, 100) | 2756 C | Primary brand, backgrounds, deep tones |

### AJ+ / Digital-First Palette (Observed)
| Color | Hex | Usage |
|-------|-----|-------|
| **Warm Orange** | `#FA6400` to `#F5A623` | AJ+ signature accent, CTAs, key data callouts |
| **Deep Navy** | `#0A1628` to `#141E3C` | Video backgrounds, dark mode primary |
| **Off-White** | `#F5F0E8` to `#FAFAF5` | Light backgrounds (warm, not cool white) |
| **Warm Gray** | `#6B6B6B` to `#9B9B9B` | Secondary text, supporting data |
| **Pale Gold** | `#F0D68A` to `#E8C85A` | Subtle highlights, chart fills, map overlays |
| **Teal/Cyan** | `#00A6B5` to `#2EC4D1` | Secondary data series, interactive elements |
| **Crimson Red** | `#CC2936` to `#E63946` | Alert data, conflict/violence indicators |
| **Soft Green** | `#4CAF50` to `#66BB6A` | Positive indicators, growth data |

### Key Color Principles
- **Warm, not cool**: Unlike Western news brands that use cold grays and blues, Al Jazeera's palette is distinctly WARM. Golds, ambers, and warm whites dominate.
- **Orange is the AJ+ signature**: AJ+ uses a bright, warm orange as its primary digital accent — distinct from the parent brand's gold.
- **Dark backgrounds dominate video**: Nearly all data video content uses deep navy/black backgrounds with high-contrast data elements.
- **Gold on dark = iconic AJ look**: The gold-on-dark combination is the single most recognizable visual motif.
- **High contrast for data legibility**: Chart elements are always bright against dark; never muted pastels on dark.

---

## 2. TYPOGRAPHY

### English Type
| Context | Style | Notes |
|---------|-------|-------|
| **Headlines** | Bold sans-serif, condensed | Strong, blocky, high-impact. Think "trade gothic" feel |
| **Data Labels** | Light/regular sans-serif | Clean, minimal — often all-caps for small labels |
| **Body Text** | Regular sans-serif | Readable, humanist-influenced geometric sans |
| **Big Numbers** | Ultra-bold sans, often monospaced | Counter animations use tabular figures |
| **Captions/Subtitles** | Light sans-serif with background bar | White text on semi-transparent dark bar |

### Likely Font Families (Observed)
- **Headlines**: Similar to *Condensed Sans* families — appears close to Trade Gothic, Akzidenz Grotesk Condensed, or a custom AJ sans
- **Body**: Geometric/humanist sans — appears close to Noto Sans, Source Sans Pro, or custom
- **Data**: Monospace-adjacent for numbers — tabular lining figures

### Arabic Type
| Context | Style | Notes |
|---------|-------|-------|
| **Headlines** | Bold Naskh or modern Kufic | Strong, angular, right-to-left optimized |
| **Body** | Clean Naskh | Readable, traditional with modern proportions |
| **Data** | Arabic-indic or Western numerals | Context-dependent; Western numerals common in data |
- **Dual-language is mandatory**: Every major project publishes simultaneously in English AND Arabic with equivalent typographic weight.

### Typography Principles
- **ALL-CAPS for category labels** and section headers (e.g., "EXPLAINER", "BY THE NUMBERS")
- **Numbers are oversized** — often 3-4x the body text size
- **Left-aligned** (English) / **Right-aligned** (Arabic) — never centered for data text
- **Minimal font weights** — primarily bold (headlines) and regular (body). Light used sparingly.

---

## 3. LAYOUT PATTERNS

### Video Layout Patterns

#### Pattern A: Full-Screen Data (Most Common)
```
┌─────────────────────────────────┐
│  [Category Label - small caps]  │
│                                 │
│        ┌───────────────┐        │
│        │  BIG NUMBER   │        │
│        │  or CHART     │        │
│        └───────────────┘        │
│                                 │
│  [Context / Source line]        │
│  [AJ Labs / Al Jazeera bug]    │
└─────────────────────────────────┘
```
- Dark background fills entire frame
- Single data element dominates center
- Minimal surrounding text

#### Pattern B: Split Screen (Presenter + Data)
```
┌─────────────────┬───────────────┐
│                 │               │
│   PRESENTER     │  DATA PANEL   │
│   (video)       │  (chart/map)  │
│                 │               │
│                 │  [Key stat]   │
└─────────────────┴───────────────┘
```
- Used in "Start Here" format
- Presenter on left (English), data on right
- Data panel animates in independently

#### Pattern C: Stacked Card (Social / Vertical Video)
```
┌─────────────────┐
│ [Category]      │
│                 │
│  BIG HEADLINE   │
│                 │
│  ┌───────────┐  │
│  │  Chart /  │  │
│  │  Map      │  │
│  └───────────┘  │
│                 │
│  Key stat       │
│  Source line     │
│  [AJ Labs bug]  │
└─────────────────┘
```
- Mobile-first vertical format
- Single idea per card/frame
- Carousel-style on Instagram

#### Pattern D: Immersive Scrollytelling (Web)
- Full-screen sections alternate between text and data visualization
- Map-based stories common (territory, conflict zones)
- Interactive elements: country selectors, timeline sliders
- Inspired by "The War Across the River", "Palestine Remix"

### Layout Principles
- **One idea per frame**: Mohammed Haddad's rule: "You should be able to just look at a chart and very quickly grasp what it is trying to communicate to you."
- **Generous whitespace**: Never crowded; data breathes
- **Asymmetry preferred**: Data elements are rarely centered; often offset with text at margins
- **Reproducible formats**: AJ Labs uses consistent, repeatable templates across Instagram posts — same grid, same label positions

---

## 4. ANIMATION STYLE

### Motion Design Language

| Animation Type | Style | Duration | Easing |
|---------------|-------|----------|--------|
| **Counter animations** | Numbers count up from 0 | 1.5-2.5s | Ease-out with slight overshoot |
| **Chart builds** | Bars grow from baseline; lines draw left-to-right | 1-2s | Ease-in-out |
| **Map reveals** | Regions fill/highlight sequentially | 0.5-1s per region | Ease-out |
| **Text reveals** | Fade up + slight translate-Y | 0.5-0.8s | Ease-out |
| **Data transitions** | Morph between chart states | 0.8-1.2s | Smooth cubic-bezier |
| **Scene transitions** | Horizontal slide or fade-through-black | 0.6-1s | Ease-in-out |
| **Category labels** | Quick fade-in, often with underline draw | 0.3-0.5s | Snappy |

### Animation Principles
- **Deliberate, not flashy**: Territory Studio designed the system "that wouldn't distract viewers from the information being conveyed"
- **Slow reveals for impact**: Key statistics animate slowly to build tension
- **Sequential data entry**: Data points appear one-by-one, never all at once
- **Subtle parallax**: Background elements move at different rates in video bumpers
- **Real-time capable**: Broadcast graphics use Vizrt for live data-driven animation
- **Timeline motif**: The 2022 rebrand centered on "a story timeline created from a square taken from Al Jazeera's distinctive peninsula logo" — elements slide along a timeline axis

### Broadcast Motion (Territory Studio "Midnight Report")
- Opening titles: 3D camera move through abstract geometric landscape
- Full-screen graphic backgrounds: subtle animated gradients with data overlays
- Closing sequences: reverse of opening
- News bumpers: fast-paced montage with data snippets
- All designed to work across broadcast AND digital platforms simultaneously

---

## 5. SCENE STRUCTURE (Data Story Arc)

### The Al Jazeera Data Story Formula
Based on Konstantinos Antonopoulos' (Senior Interactive Designer, AJ) presentation at the Al Jazeera Forum:

```
1. UNIVERSAL IDEA          ── The "why do we care?" hook
   (e.g., "Refugees are fleeing war")

2. SETUP                   ── People, setting, time, state of mind
   (e.g., "In 2011, millions took to the streets...")

3. NARRATIVE MOVEMENT      ── Action, conflicts, events
   (e.g., "Country by country, regimes fell...")

4. DATA REVEAL             ── The moment data makes the universal idea concrete
   (e.g., "250,000 tweets per hour. 17 countries. 4 regimes fell.")

5. CLIMAX                  ── The moment the universal idea makes sense
   (e.g., "This was the most documented revolution in history")

6. POST-CLIMAX             ── Resolution: how have things changed?
   (e.g., "10 years later, only Tunisia remains a democracy")

7. ENGAGEMENT              ── Interactive exploration / "dig deeper"
   (e.g., "Explore how your country voted at the UN")
```

### Video Scene Timing (Typical 7-10 min "Start Here" Episode)
| Segment | Duration | Visual Treatment |
|---------|----------|-----------------|
| Cold open / hook | 15-30s | Full-screen data or map with dramatic counter |
| Title card | 5s | Animated AJ/Start Here logo |
| Setup/context | 1-2 min | Presenter on camera + supporting graphics |
| Data sequence 1 | 1-2 min | Full-screen charts/maps animated sequentially |
| Mid-point pivot | 30s | Return to presenter / transition to deeper data |
| Data sequence 2 | 1-2 min | More complex visualization (interactive web) or animated build |
| Climax data | 30-60s | The single most impactful stat/chart |
| Resolution | 1 min | Presenter wrap-up + key takeaway text on screen |
| End card | 10s | Logo + social CTAs |

### Instagram/Carousel Structure (AJ Labs)
Based on the IJOC academic study:
1. **Slide 1**: Title slide — bold headline, single striking visual (map or chart preview), category label
2. **Slides 2-4**: Progressive data reveals — one key finding per slide
3. **Slide 5**: The "so what?" — human context, quote, or comparison
4. **Slide 6-7**: Additional context or methodology note
5. **Final slide**: Source credits + AJ Labs branding

### Web Interactive Structure
1. **Hero section**: Full-screen map/visualization with minimal text
2. **Scroll-triggered reveals**: Each scroll section reveals new data
3. **Interactive exploration**: User can filter/select (e.g., "How did YOUR country vote?")
4. **Narrative chapters**: Explicit chapter breaks with headers
5. **Embedded media**: Video clips, audio, social media embeds (e.g., Arab Spring Twitter recreation)

---

## 6. WHAT MAKES AL JAZEERA DIFFERENT FROM BLOOMBERG/CNBC

| Dimension | Al Jazeera / AJ Labs | Bloomberg / CNBC |
|-----------|----------------------|------------------|
| **Primary color** | Warm gold (#DBA200) / Orange (#FA6400) | Cool blue / Teal / Green |
| **Background** | Deep navy, almost black | Dark gray, lighter navy |
| **Typography mood** | Bold, condensed, humanist | Ultra-clean, corporate, Bloomberg Terminal aesthetic |
| **Data framing** | **Human-driven** — "Don't give me more data, give me a story" (Haddad) | **Market-driven** — Data IS the story; price/action first |
| **Geographic focus** | Global South, Middle East, conflict zones, underreported regions | US/EU markets, financial instruments, corporate earnings |
| **Chart style** | Simplified, high-contrast, single-message | Dense, multi-variable, real-time tickers |
| **Animation pace** | Slow, deliberate, story-paced | Fast, real-time, ticker-paced |
| **Presenter role** | Guide/explainer (Sandra Gathmann in "Start Here") | Anchor/analyst reading data |
| **Emotional register** | Empathic, human-cost emphasis | Analytical, market-impact emphasis |
| **Language** | Dual English/Arabic mandatory | English only (or single language) |
| **Platform strategy** | Platform-native (different video per platform) | Repurposed broadcast content |
| **Interactivity** | Narrative-first with optional exploration | Data-first with real-time dashboards |
| **Sound design** | Orchestral, regional instruments, "voice of the people" | Electronic, ticker sounds, corporate |
| **Map usage** | Extensive — maps are THE primary visual | Minimal — markets don't need maps |
| **Photo/people** | Human faces, field footage, on-the-ground | Charts, screens, trading floors |

### The Fundamental Difference
**Bloomberg/CNBC design for the trader. Al Jazeera designs for the citizen.**

Bloomberg's visual language says "here's what the numbers are doing." Al Jazeera's visual language says "here's what the numbers mean for people." This philosophical difference manifests in every design choice: warm vs. cool colors, story-first vs. data-first framing, empathic vs. analytical tone, and the persistent presence of human faces alongside data.

---

## 7. VISUAL REFERENCES (Described)

### Al Jazeera "Midnight Report" (Territory Studio, 2021)
- **Opening**: 3D camera sweeps through an abstract geometric landscape built from translucent squares and rectangles (the "peninsula logo" motif). Colors are deep navy with gold edge-lighting. Grid lines pulse subtly.
- **Full-screen backgrounds**: Dark gradients (navy to near-black) with very subtle animated geometric patterns. Data overlays are bright gold and white.
- **OSP/Insert graphics**: Clean lower-thirds with gold accent line. Sans-serif text. Category labels in small caps.
- **Social templates**: Simplified versions of broadcast graphics, same color language.

### AJ Labs Instagram Posts
- **Static infographics**: Dark backgrounds (navy/charcoal), bright data elements, maps with gold/teal fills. Always includes source line and AJ Labs bug.
- **Carousel format**: Consistent template — same font sizes, same label positions, same color usage across every post. "Reproducible formats" as the IJOC study identified.
- **Data topics**: Predominantly politics, conflict, human rights, and Global South issues.

### "Start Here" with Sandra Gathmann (2019-2025)
- **Studio**: Modern, dark set with LED video walls. Warm ambient lighting.
- **Graphics style**: Presenter-led with cutaway to full-screen animated explainers. Mix of maps, charts, and illustrated metaphors.
- **Motion graphics**: "Elegant graphics" per their Shorty Award submission. Clean vector-style illustrations, smooth transitions.
- **Tone**: Casual and conversational. "Our style is authentic and intimate."
- **Duration**: 7-15 minutes per episode

### AJ+ Vertical Videos
- **Format**: 9:16 vertical, mobile-first
- **Visual mix**: Three approaches used:
  1. **Illustrated**: Hand-drawn or vector illustrations with animation
  2. **Motion graphics**: Animated charts, maps, typographic builds
  3. **Raw footage**: Documentary clips with data overlays
- **Art direction**: "Human presence and art direction go hand-in-hand" — faces and data always paired
- **Platform-specific**: Each platform gets a restructured version, not a simple reformat

### Al Jazeera 2022 Broadcast Redesign
- **Core concept**: "Story timeline" built from a square (the peninsula logo shape)
- **Motion**: Elements slide along a timeline axis; the square becomes a frame, a progress indicator, a content container
- **Graphics**: Refreshed insert graphics with updated color themes
- **Music**: Fully orchestrated package by Stephen Arnold Music; complete sonic rebrand by Sonic Lens

---

## 8. RENDERER IMPLEMENTATION NOTES

### Essential Config Values
```javascript
const AJ_DESIGN_SYSTEM = {
  colors: {
    gold:        '#DBA200',
    blue:        '#212E64',
    darkBg:      '#0A1628',
    midBg:       '#141E3C',
    warmWhite:   '#F5F0E8',
    gray:        '#6B6B6B',
    orange:      '#FA6400',
    teal:        '#00A6B5',
    crimson:     '#CC2936',
    paleGold:    '#F0D68A',
  },
  typography: {
    headline:  { family: 'sans-serif', weight: 700, style: 'condensed' },
    body:      { family: 'sans-serif', weight: 400 },
    data:      { family: 'monospace',  weight: 700, fontVariantNumeric: 'tabular-nums' },
    label:     { family: 'sans-serif', weight: 400, transform: 'uppercase', letterSpacing: '0.1em' },
  },
  animation: {
    counterDuration: 2000,      // ms
    chartBuildDuration: 1500,   // ms
    textRevealDuration: 600,    // ms
    sceneTransition: 800,       // ms
    easing: [0.25, 0.1, 0.25, 1.0], // CSS cubic-bezier ease-out
  },
  layout: {
    safeMargin: 0.08,          // 8% from edges
    dataToTextRatio: 0.65,     // Data takes 65% of frame
    darkBackground: true,       // Default dark mode
    dualLanguage: true,         // Support RTL Arabic
  },
  sceneStructure: [
    'hook',        // Cold open with dramatic data
    'titleCard',   // Animated logo
    'setup',       // Context + presenter
    'dataReveal1', // Primary data animation
    'pivot',       // Transition
    'dataReveal2', // Deeper data
    'climax',      // Key statistic
    'resolution',  // Wrap-up
    'endCard',     // Credits + CTA
  ],
};
```

### Key Implementation Priorities
1. **Dark mode first** — all backgrounds start dark; light mode is secondary
2. **RTL support** — Arabic text must render right-to-left with mirrored layout
3. **Counter animations** — the single most important animation type; numbers counting up from zero is AJ's signature data moment
4. **Map rendering** — maps (especially of Middle East, Africa, Global South) are the #1 visualization type; must support choropleth fills and point markers
5. **Warm color temperature** — no cool grays, no blue-blacks; everything skews warm
6. **Reproducible templates** — same layout grid, same label positions, same color assignments per data role
7. **Timeline motif** — the "square becoming a timeline" concept from the 2022 rebrand could be a key animation language for scene transitions

---

## Sources
- Al Jazeera Brand & Logo Guidelines (2022 PDF), network.aljazeera.net
- BrandColorCode.com/al-jazeera — official hex values
- Territory Studio — "Al Jazeera Midnight Report" project (territorystudio.com)
- Online Journalism Blog — Mohammed Haddad interview (2021)
- Storybench — "How AlJazeera plans its interactive storytelling projects" (2015)
- AJ Labs Medium — "How AJLabs uses data to tell stories" (2019) + website redesign (2016)
- IJOC/arXiv — "Instagrammable Data: Using Visuals to Showcase More Than Numbers on AJ Labs Instagram Page" (2022)
- Shorty Awards — Start Here (13th, 15th), AJ+ Vertical Video (14th)
- NewscastStudio — AJ 2020 studio refresh + 2022 motion redesign
- Stephen Arnold Music — Al Jazeera Rebrand case study
- Sonic Lens — Al Jazeera English sonic branding
- Datalabs Agency — Al Jazeera Infographics Workshop case study (2017)
- Al Jazeera Media Institute — Data Journalism guidebook, Infographics course

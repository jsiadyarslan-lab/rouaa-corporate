# ROUAA · Information Architecture (IA) v1

> بنية المحتوى والتنقل والعلاقات بين الصفحات.
>
> ليست Site Map فقط. هي **طريقة التفكير في التنقل**.
>
> **تكتب قبل أي HTML.**

---

## جدول المحتويات

1. [الأقسام الخمسة الكبرى (Top-Level Taxonomy)](#1-الأقسام-الخمسة-الكبرى-top-level-taxonomy)
2. [هيكل كل قسم (Section Structure)](#2-هيكل-كل-قسم-section-structure)
3. [Navigation Logic](#3-navigation-logic)
4. [URL Structure](#4-url-structure)
5. [Cross-Reference Map](#5-cross-reference-map)
6. [Breadcrumb Logic](#6-breadcrumb-logic)
7. [Footer Architecture](#7-footer-architecture)
8. [Search & Filter Logic](#8-search--filter-logic)
9. [Content Hierarchy per Page Type](#9-content-hierarchy-per-page-type)
10. [Internal Linking Rules](#10-internal-linking-rules)
11. [معايير الاعتماد](#11-معايير-الاعتماد)

---

## 1. الأقسام الخمسة الكبرى (Top-Level Taxonomy)

الموقع ينقسم إلى 5 أقسام كبرى، كل قسم يخدم حاجة مستخدم مختلفة:

```
┌─────────────────────────────────────────────────┐
│  KNOWLEDGE (المعرفة)                            │
│  من نحن + لماذا رؤى + التكنولوجيا + الثقة      │
│  Pages: about, technology, trust, careers, blog │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  COMMERCIAL (التجاري)                           │
│  ماذا نبيع + الحلول + المنتجات                  │
│  Pages: catalog, solutions, business lines,     │
│         product pages, showcases                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  INDUSTRIES (القطاعات)                          │
│  لمن نبيع + حلول قطاعية                         │
│  Pages: industries landing + 6 industry pages   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  DEVELOPERS (المطورون)                          │
│  كيف تدمج + التوثيق + SDK                       │
│  Pages: developers, api, sdk, docs, security    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  COMPANY (الشركة)                               │
│  تواصل + قانوني + وظائف                         │
│  Pages: contact, legal, careers                 │
└─────────────────────────────────────────────────┘
```

### لماذا 5 أقسام (لا 9 روابط nav)؟

الـ nav يمكن أن يحوي 9 روابط، لكن **التفكير** ينقسم إلى 5 أقسام. الفرق:

- **Nav** = what user clicks (9 items)
- **Taxonomy** = how we think (5 sections)

بعض الأقسام تظهر في عدة روابط nav. مثلاً «Pricing» يظهر في nav لكنه ينتمي لـ Commercial.

---

## 2. هيكل كل قسم (Section Structure)

كل قسم يتبع نفس الـ pattern الداخلي:

```
Section
│
├── Landing Page (نقطة الدخول)
│   └── Overview of what's in this section
│
├── Overview Pages (الفهم العام)
│   └── تشرح المفاهيم الكبرى
│
├── Detail Pages (التفاصيل)
│   └── صفحات منتجات/حلول/قطاعات
│
└── CTA Layer (الفعل)
    └── Demo / Trial / Contact / Subscribe
```

### مثال: قسم COMMERCIAL

```
COMMERCIAL
│
├── Landing: catalog.html (نقطة الدخول)
│
├── Overview: solutions.html (الحلول)
│   ├── media-technologies.html (BL1 overview)
│   └── trading-technologies.html (BL2 overview)
│
├── Details: 16 product pages + 7 solution pages
│
└── CTA: pricing.html (الفعل — اشترِ)
```

---

## 3. Navigation Logic

### 3.1 Primary Navigation (Top Nav)

```
Home · Catalog · Solutions · Media · Trading · Developers · Enterprise · Pricing · About
```

### 3.2 Nav Item → Section Mapping

| Nav Item | Section | Page | Why |
|---------|---------|------|-----|
| Home | — | index.html | نقطة الدخول العامة |
| Catalog | Commercial | catalog.html | كل المنتجات في مكان واحد |
| Solutions | Commercial | solutions.html | الحلول الجاهزة (Bundles) |
| Media | Commercial | media-technologies.html | Business Line 1 landing |
| Trading | Commercial | trading-technologies.html | Business Line 2 landing |
| Developers | Developers | developers.html | Platform Access landing |
| Enterprise | Industries | industries.html | القطاعات الكبرى |
| Pricing | Commercial | pricing.html | التسعير (هرم موحّد) |
| About | Knowledge | about.html | من نحن + الرؤية (صفحة إنسانية) |
| Technology | Knowledge | technology.html | كيف يعمل النظام تقنياً (Architecture + Factory) |
| Trust | Knowledge | trust.html | Trust Center — لماذا أصدّق رؤى |
| Methodology | Knowledge | methodology.html | كيف نختار المصادر ونُقيّم الثقة |

### 3.3 Nav Behavior

- Sticky top (يبقى مرئي عند scroll)
- Active state: gold underline + slightly bolder
- Hover: gold text color
- Mobile: hamburger drawer with all 9 items + CTA button at bottom
- CTA button "Contact Sales" يظهر دائماً يمين الـ nav (RTL: يسار)

### 3.4 Secondary Navigation (in-page)

كل صفحة هبوط (landing) تحوي sub-nav داخلي:

مثال `developers.html`:
```
[Overview] [APIs] [SDK] [White Label] [Deployment] [Security]
```

مثال `media-technologies.html`:
```
[Overview] [Products] [Showcase] [Pricing]
```

---

## 4. URL Structure

### 4.1 URL Patterns

```
/                           → index.html
/about                      → about.html
/technology                 → technology.html (Architecture + Factory + Layers)
/methodology                → methodology.html (how sources/facts/confidence work)
/trust                      → trust.html (Trust Center — 7 principles + Evidence demo)
/catalog                    → catalog.html
/solutions                  → solutions.html (landing)
/solutions/{solution}       → solutions/newsroom.html, etc.
/media                      → media-technologies.html
/media/{product}            → media/news-agency.html, etc.
/trading                    → trading-technologies.html
/trading/{product}          → trading/lasaa.html, etc.
/developers                 → developers.html
/developers/{topic}         → developers/api.html (or /api, /sdk separately)
/industries                 → industries.html (landing)
/industries/{industry}      → industries/banks.html, etc.
/pricing                    → pricing.html
/enterprise                 → enterprise.html (alias of /industries)
/services                   → professional-services.html
/services/{service}         → services/implementation.html, etc.
/resources                  → resources.html
/resources/{type}           → resources/docs.html, /blog, /case-studies
/compare                    → compare.html (landing)
/compare/{competitor}       → compare/bloomberg.html, etc.
/news                       → news.html (Showcase)
/trade                      → trade.html (Showcase)
/contact                    → contact.html
/careers                    → careers.html
/legal                      → legal.html
/trust                      → trust.html
```

### 4.2 URL Rules

- كل URLs صغيرة (lowercase)
- كلمات مفصولة بـ hyphens (لا underscores)
- لا file extensions في URL (لا `.html` يظهر)
- Arabic paths لا (الـ URLs إنجليزية دائماً، المحتوى عربي)
- Max 3 levels deep: `/section/subsection/item`

### 4.3 Redirect Rules

```
/old-news → /news
/old-trade → /trade
/core → /about  (Core = Factory, ذكر في About)
/api-docs → /resources/docs
/pricing-old → /pricing
```

---

## 5. Cross-Reference Map

كل صفحة على الموقع يجب أن تربط بـ 3-5 صفحات ذات صلة. هذه ليست عشوائية — هي استراتيجية.

### Cross-Reference Rules:

| من | إلى | لماذا |
|----|-----|------|
| Product Page | Solution containing it | «هذا المنتج جزء من Solution X» |
| Solution Page | Products in it | «هذا الحل يحوي المنتجات التالية» |
| Industry Page | Solutions for this industry | «لهذا القطاع، نوصي بالحلول التالية» |
| Product Page | Related Product (same BL) | «منتجات ذات صلة» |
| Product Page | Compare page (if applicable) | «قارن مع المنافس» |
| Pricing Page | All Products + Solutions | روابط للتفاصيل |
| Catalog | All Products (obviously) | الفلترة |
| About | Catalog | «شاهد ما ننتجه» |
| News Showcase | Media Technologies + Newsroom Solution | «هذا ما يمكن شراؤه» |
| Trade Showcase | Trading Technologies + Hedge Fund Solution | «هذا ما يمكن شراؤه» |

### Example Cross-Reference for `/trading/lasaa.html`:

```
LASAA Product Page
│
├── ← Back to: Trading Technologies
│
├── → Part of: Hedge Fund Trading Solution
│
├── → Related Products:
│   ├── AI Council (pairs with LASAA)
│   ├── Smart Chart (analysis layer)
│   └── Execution Bridge (alternative execution)
│
├── → Compare: vs Bloomberg Terminal (execution speed)
│
├── → Industry: Hedge Funds
│
├── → Pricing: LASAA pricing tier
│
└── → CTA: Contact Sales (LASAA is Enterprise-only)
```

---

## 6. Breadcrumb Logic

كل صفحة (عدا Home) تحوي breadcrumbs أعلى المحتوى:

### Pattern:
```
Home > [Section] > [Subsection] > [Current Page]
```

### Examples:
```
Home > Catalog > News Agency Agent
Home > Solutions > Newsroom Solution
Home > Trading > LASAA
Home > Industries > Banks
Home > Developers > API
Home > Resources > Documentation
```

### Breadcrumb Rules:

- العنصر الأخير (Current Page) غير قابل للنقر
- كل العناصر الأخرى روابط
- Separator: `>` (لا slash، لا arrow icon)
- RTL: الأسهم تشير لليسار `<` (ليس يميناً)
- Mobile: قد تختصر إلى `Home > ... > Current`

---

## 7. Footer Architecture

الـ Footer ينظّم حسب الأقسام الخمسة (Top-Level Taxonomy):

```
┌─────────────────────────────────────────────────────────────┐
│  ROUAA · Intelligence Platform                              │
│  من المصدر الرسمي إلى القرار الموثّق                       │
│  v23 · المؤسسي · 2026                                       │
├──────────────┬──────────────┬──────────────┬───────────────┤
│  COMMERCIAL  │  DEVELOPERS  │  INDUSTRIES  │  COMPANY      │
│              │              │              │               │
│  Catalog     │  API         │  Banks       │  About        │
│  Solutions   │  SDK         │  Hedge Funds │  Careers      │
│  Media Tech  │  White Label │  Brokers     │  Contact      │
│  Trading Tech│  Deployment  │  Media       │  Legal        │
│  Pricing     │  Security    │  Government  │  Trust        │
│  Services    │  Docs        │  Research    │               │
├──────────────┴──────────────┴──────────────┴───────────────┤
│  © 2026 ROUAA · Privacy · Terms · Security · Status       │
└─────────────────────────────────────────────────────────────┘
```

### Footer Rules:

- 4 أعمدة على desktop (2 على tablet، 1 على mobile)
- كل عمود يضم 5-6 روابط
- الشعار + الوصف + الإصدار أعلى الـ Footer
- الروابط القانونية أسفل الـ Footer
- لا social media icons (مهنية، لا مرح)

---

## 8. Search & Filter Logic

### 8.1 Global Search

- Search bar في الـ nav (كل الصفحات)
- Auto-suggest (5 نتائج فورية)
- Search results page: `/search?q=...`
- Results grouped by Section (Commercial, Developers, Resources, etc.)
- «No results» state with suggestions

### 8.2 Catalog Filters

`catalog.html` يحوي 4 تصنيفات (per COM v1):

```
Filter Sidebar (يمين الشاشة في RTL):
│
├── By Business Line
│   ☐ Media Technologies (7)
│   ☐ Trading Technologies (9)
│   ☐ Platform Access (8)
│
├── By Industry
│   ☐ Banks (8)
│   ☐ Hedge Funds (6)
│   ☐ Brokers (5)
│   ☐ Media Companies (7)
│   ☐ Governments (4)
│   ☐ Research Firms (5)
│
├── By Use Case
│   ☐ Get Market Intelligence (5)
│   ☐ Produce Content (4)
│   ☐ Make Trading Decisions (6)
│   ☐ Execute Trades (3)
│   ☐ Manage Risk (3)
│   ☐ Build Custom Solutions (3)
│
└── By Technology
    ☐ AI / Machine Learning (4)
    ☐ Real-time / Streaming (3)
    ☐ APIs / SDK (5)
    ☐ On-Premise / Private (3)
    ☐ White Label (2)
```

### 8.3 View Tabs

```
[By Business Line] [By Industry] [By Use Case] [By Technology]
```

الـ Default: By Business Line. المستخدم يمكنه التبديل لإعادة تنظيم البطاقات.

### 8.4 Filter Behavior

- Multi-select (يمكن اختيار عدة filters)
- Count badges على كل filter (عدد المنتجات المطابقة)
- URL params (filters تظهر في URL للمشاركة: `?bl=media&industry=banks`)
- Clear all button
- Smooth animation عند re-filter (لا full reload)

---

## 9. Content Hierarchy per Page Type

### 9.1 Home Page Hierarchy

```
1. Hero (1 viewport)
   - Logo + tagline
   - H1 (positioning)
   - Sub (value)
   - 2 CTAs (Catalog + About)

2. "Who Are You?" Selector (1 viewport)
   - 4 cards (Developer / Institution / Trader / Media)

3. Architecture Overview (1 viewport)
   - 5-layer Business Architecture visual

4. Business Value Layer (1 viewport)
   - 6 value cards

5. 4 Business Lines Preview (1 viewport)
   - Media (7 products)
   - Trading (9 products)
   - Platform Access (8 methods)
   - Professional Services (6 services)

6. Industries Strip (1 viewport)
   - 6 sector badges

7. Positioning (1 viewport)
   - "Why ROUAA, not Bloomberg/Refinitiv"

8. Final CTA (1 viewport)
   - Demo / Contact
```

### 9.2 Product Page Hierarchy (9 sections per COM)

```
1. Hero — Problem
2. Solution
3. How it Works
4. Components
5. Capabilities
6. Demo (interactive)
7. Use Cases (Personas)
8. Pricing
9. CTA + Cross-References
```

### 9.3 Solution Page Hierarchy (7 sections per COM)

```
1. Hero — Bundle positioning
2. Industry Problem
3. Components (Products + Services)
4. Value (vs buying separately)
5. Implementation timeline
6. Pricing
7. CTA
```

### 9.4 Industry Page Hierarchy (7 sections per COM)

```
1. Hero — "ROUAA for [Industry]"
2. Challenges
3. Solutions + Products
4. Use Cases
5. Deployment
6. Pricing
7. CTA
```

### 9.5 Pricing Page Hierarchy

```
1. Hero — "Transparent Pricing"
2. Pricing Pyramid (6 tiers visual)
3. Products Section (Individual + Pro + Bundles)
4. Solutions Section (7 bundles)
5. Enterprise Licensing Section
6. Professional Services Section
7. FAQ
8. CTA (Contact Sales + Start Trial)
```

### 9.6 Catalog Page Hierarchy

```
1. Hero — "Find your solution"
2. View Tabs (4 classifications)
3. Filter Sidebar + Product Grid (main)
4. "Can't decide?" CTA → Contact Sales
```

---

## 10. Internal Linking Rules

### Rule 1 — Every page links to at least 3 related pages
لا صفحات معزولة. كل صفحة تربط بسياقها الأوسع.

### Rule 2 — No orphan pages
كل صفحة يجب أن يصلها الزائر من على الأقل 2 صفحات أخرى.

### Rule 3 — CTA hierarchy
- Primary CTA: 1 لكل صفحة (واضح، gold button)
- Secondary CTA: 1-2 لكل صفحة (ghost button)
- Tertiary CTAs: في cross-references (نصوص روابط، لا أزرار)

### Rule 4 — Anchor text يجب أن يكون وصفياً
- ❌ «اضغط هنا»
- ❌ «اقرأ المزيد»
- ✅ «استكشف Newsroom Solution»
- ✅ «قارن رؤى مع Bloomberg»

### Rule 5 — Links تفتح في نفس التبويب
لا `target="_blank"` إلا لروابط خارجية (GitHub, docs externes).

### Rule 6 — Visited links تتغير لونها
- Unvisited: text-dim
- Hover: gold
- Visited: gold dim (subtle indication)

---

## 11. معايير الاعتماد

- [ ] 5 Top-Level Taxonomy sections (Knowledge / Commercial / Industries / Developers / Company)
- [ ] كل قسم يتبع Landing → Overview → Details → CTA structure
- [ ] Primary Nav: 9 items mapped to sections
- [ ] URL structure موحّد (max 3 levels, lowercase, hyphens)
- [ ] Cross-Reference Map لكل نوع صفحة
- [ ] Breadcrumbs على كل صفحة (عدا Home)
- [ ] Footer بـ 4 أعمدة mapping to taxonomy
- [ ] Global Search مع auto-suggest
- [ ] Catalog Filters (4 classifications + view tabs)
- [ ] Content Hierarchy محدّد لكل Page Type (Home, Product, Solution, Industry, Pricing, Catalog)
- [ ] Internal Linking Rules (6 rules)
- [ ] Anchor text وصفي دائماً

---

## 12. المبدأ النهائي

> **الموقع ليس صفحات. الموقع علاقات.**
>
> كل صفحة تشير لأخرى. كل رابط يحكي قصة. كل breadcrumb يضع المستخدم في سياق.
>
> IA v1 يثبّت هذه العلاقات مسبقاً — لا اجتهاد أثناء التنفيذ.
>
> **مع COM v1 + EXA v1 + IA v1، التنفيذ يصبح تنفيذ مواصفات.**

---

**الحالة:** v1 — بانتظار الاعتماد النهائي
**الأساس:** COMMERCIAL-OPERATING-MODEL-v1.md + EXPERIENCE-ARCHITECTURE-v1.md
**Branch:** `redesign-v20-architecture`
**التاريخ:** يوليو 2026
**Top-Level Sections:** 5
**Page Types:** 9 (Home, About, Catalog, Product, Solution, Industry, Pricing, Developers, Resources)
**Navigation Items:** 9
**URL Patterns:** 14

# ROUAA · Experience Architecture (EXA) v1

> المرجع الوحيد لأي مصمم أو Frontend Engineer.
>
> كل الوثائق السابقة تصف «ما هي رؤى». هذه الوثيقة تصف **«كيف يجب أن يشعر المستخدم عند استخدام الموقع»**.
>
> **القاعدة:** بدون هذه الوثيقة، عشرة مصممين سيخرجون بعشرة مواقع مختلفة. معها، التنفيذ تنفيذ مواصفات.
>
> **تكتب قبل أي HTML.**

---

## جدول المحتويات

1. [المبادئ الثلاثة للتجربة](#1-المبادئ-الثلاثة-للتجربة)
2. [نبرة الصوت (Voice & Tone)](#2-نبرة-الصوت-voice--tone)
3. [أهداف الصفحات (Page Goals)](#3-أهداف-الصفحات-page-goals)
4. [مسارات التحويل (Conversion Paths)](#4-مسارات-التحويل-conversion-paths)
5. [Decision Tree (لأي زائر جديد)](#5-decision-tree-لأي-زائر-جديد)
6. [Micro-Experiences](#6-micro-experiences)
7. [Visual Hierarchy Principles](#7-visual-hierarchy-principles)
8. [Motion & Interaction Principles](#8-motion--interaction-principles)
9. [Mobile Experience](#9-mobile-experience)
10. [Accessibility (A11y)](#10-accessibility-a11y)
11. [محظورات التصميم (Anti-Patterns)](#11-محظورات-التصميم-anti-patterns)

---

## 1. المبادئ الثلاثة للتجربة

### المبدأ 1 — كل صفحة لها هدف واحد فقط

لا توجد صفحة تبيع منتجين. لا توجد صفحة تشرح فكرتين. كل صفحة = هدف واحد قابل للقياس.

| الصفحة | هدفها الوحيد | ما يجب ألا تفعله |
|--------|------------|----------------|
| Home | إقناع المستخدم بالبقاء 30 ثانية أخرى | لا تبيع منتجاً |
| About | فهم «لماذا رؤى موجودة» | لا تعرض منتجات |
| Catalog | اكتشاف المنتج المناسب | لا تشرح المنتج بالتفصيل |
| Product Page | إقناع العميل أن هذا هو المنتج الصحيح | لا تعرض منتجات أخرى |
| Pricing | إزالة الغموض | لا تخفي الأسعار |
| Contact Sales | تحويل الزائر إلى Lead | لا تطلب معلومات زائدة |
| Demo | جدولة مكالمة | لا تعرض ميزات أخرى |

**القاعدة الذهبية:** لو لم تستطع وصف هدف الصفحة في جملة واحدة، الصفحة مكسورة.

### المبدأ 2 — هرم الانتباه (Attention Hierarchy)

```
1. الهدف (Goal)          — أول ما يراه المستخدم
2. القيمة (Value)         — ثاني ما يراه
3. الدليل (Evidence)      — ثالث ما يراه
4. الفعل (Action)         — رابع ما يراه (CTA)
5. التفاصيل (Details)     — لمن أراد التعمّق
```

لا تضع الـ CTA قبل القيمة. لا تضع التفاصيل قبل الدليل.

### المبدأ 3 — كل تجربة لها Three-Act Structure

```
ACT 1 — SET UP
   المستخدم يصل بسياق (سؤال، حاجة، فضول)
   الصفحة تعترف بسياقه (H1 يتطابق مع نية البحث)

ACT 2 — BUILD UP
   الصفحة تبني الإقناع (قيمة → دليل → ميزات)
   المستخدم يفهم «لماذا هذا لي؟»

ACT 3 — PAYOFF
   الصفحة تقدّم الفعل التالي (CTA واضح)
   المستخدم يتحرك (Demo / Trial / Contact)
```

---

## 2. نبرة الصوت (Voice & Tone)

### Voice (شخصية رؤى الثابتة)

- **مؤسسية لا شركاتية:** نتحدث كمؤسسة بنية، لا كشركة ناشئة متحمّسة
- **واثقة لا متعجرفة:** نعرف قيمتنا، لا نحتاج للمقارنة بالآخرين في كل جملة
- **عميقة لا سطحية:** نشرح «لماذا» قبل «ماذا»
- **عربية أولاً:** نتحدث بالعربية الفصحى المعاصرة، الإنجليزية للمصطلحات التقنية فقط

### Tone (النبرة المتغيّرة حسب السياق)

| السياق | النبرة |
|--------|------|
| Home / Hero | ملهمة + واثقة |
| Product Pages | إعلامية + إقناعية |
| Pricing | شفافة + مباشرة |
| About | إنسانية + رؤيوية |
| Documentation | تقنية + دقيقة |
| Error States | هادئة + مُساعدة |
| Success States | مؤكّدة + غير مبالغة |

### محظورات لغوية:

- ❌ «الثوري» / «الأفضل» / «الوحيد» (ادعاءات لا يمكن إثباتها)
- ❌ «حلول مبتكرة» / «تقنيات متقدمة» (كلمات بلا معنى)
- ❌ «نحن متحمسون» (لا يهم العميل)
- ❌ مصطلحات تسويقية فضفاضة («منصة شاملة»، «حل متكامل»)
- ✅ «411 مصدر رسمي» (محدد)
- ✅ «0.4 ثانية لكل وثيقة» (قابل للقياس)
- ✅ «دليل كامل لكل ادعاء» (وعد يمكن التحقق منه)

### قاعدة الصياغة:

> كل جملة في الموقع يجب أن تجتاز اختبار: «هل يمكنني إثبات هذا الرقم؟»
> إن لا — احذفها أو استبدلها بما يمكن إثباته.

---

## 3. أهداف الصفحات (Page Goals)

### Identity Pages

#### `index.html` (Home)
- **الهدف:** إقناع المستخدم بالبقاء 30 ثانية أخرى
- **النجاح:** scroll إلى الأسفل + click على أي رابط
- **الفشل:** bounce خلال 10 ثوانٍ
- **CTA الأساسي:** «استكشف الكاتالوج»
- **CTA ثانوي:** «عن رؤى»

#### `about.html`
- **الهدف:** فهم «لماذا رؤى موجودة»
- **النجاح:** المستخدم يقرأ الـ Factory concept
- **CTA:** «استكشف الحلول» / «تواصل معنا»

#### `careers.html`
- **الهدف:** جذب مرشحين عالي الجودة
- **CTA:** «قدّم الآن»

#### `contact.html`
- **الهدف:** توفير قناة اتصال واضحة
- **CTA:** form submission

#### `legal.html`
- **الهدف:** الامتثال + الثقة
- لا CTA — صفحة مرجعية

### Discovery Pages

#### `catalog.html`
- **الهدف:** اكتشاف المنتج المناسب
- **النجاح:** click على بطاقة منتج
- **CTA على البطاقة:** «اعرف المزيد»
- **لا تشرح المنتج** — فقط أظهر اسمه + سؤاله + «يبدأ من $X» + زر

#### `solutions.html`
- **الهدف:** فهم أن رؤى تبيع حلولاً جاهزة (Bundles)
- **النجاح:** click على Solution معيّن
- **CTA:** «شاهد تفاصيل الحل»

#### `pricing.html`
- **الهدف:** إزالة الغموض
- **النجاح:** المستخدم لا يغادر بسبب «السعر مخفي»
- **CTA:** «اطلب Demo» / «ابدأ تجربة» (حسب المستوى)

### Business Line Landings

#### `media-technologies.html`
- **الهدف:** فهم أن Media Technologies = 7 منتجات مستقلة
- **CTA الأساسي:** «استكشف الكاتالوج بفلتر Media»
- **CTA ثانوي:** «شاهد Newsroom Solution»

#### `trading-technologies.html`
- **الهدف:** فهم أن Trading Technologies = 9 منتجات مستقلة
- **CTA الأساسي:** «استكشف الكاتالوج بفلتر Trading»
- **CTA ثانوي:** «شاهد Hedge Fund Solution»

### Product Pages (16 صفحة)

كل صفحة منتج تتبع **9-section template** بنفس الأهداف:

| Section | الهدف |
|---------|------|
| 1. Hero (المشكلة) | المستخدم يقول «نعم، هذه مشكلتي» |
| 2. الحل | المستخدم يقول «نعم، هذا يحلها» |
| 3. كيف يعمل | المستخدم يفهم المنطق |
| 4. المكونات | المستخدم يثق بالعمق التقني |
| 5. القدرات | المستخدم يقول «أحتاج هذا» |
| 6. Demo | المستخدم يرى المنتج في عمل |
| 7. من يستخدمه | المستخدم يرى نفسه في الـ Personas |
| 8. التسعير | المستخدم يفهم البنية (لا يصدم) |
| 9. CTA | المستخدم يطلب Demo أو Trial |

### Solution Pages (7 صفحات)

| Section | الهدف |
|---------|------|
| 1. Hero | فهم الحل كحزمة (لا منتجات منفصلة) |
| 2. المشكلة القطاعية | تحدّيات القطاع |
| 3. المكونات | ما الذي يحويه الحل (Products + Services) |
| 4. القيمة | لماذا الحل أفضل من شراء المكونات منفردة |
| 5. Implementation | كم يستغرق النشر |
| 6. التسعير | «يبدأ من $X» |
| 7. CTA | «تحدث مع خبير قطاعي» |

### Industry Pages (6 صفحات)

| Section | الهدف |
|---------|------|
| 1. Hero | «رؤى للقطاع X» |
| 2. التحديات | ألم القطاع |
| 3. الحلول | Solutions + Products المناسبة |
| 4. Use Cases | سيناريوهات حقيقية |
| 5. Deployment | نموذج النشر المناسب |
| 6. Pricing | «يبدأ من» |
| 7. CTA | «تحدث مع خبير قطاعي» |

### Platform Access Pages

#### `developers.html`
- **الهدف:** فهم طرق الوصول (API/SDK/White Label/Deployment)
- **CTA:** «اقرأ التوثيق» / «جرّب API»

#### `api.html`
- **الهدف:** فهم أن APIs = منتجات (Data/Intelligence/Evidence/Reasoning)
- **CTA:** «اطلب مفتاح API» / «اقرأ التوثيق»

#### `security.html`
- **الهدف:** إزالة المخاوف الأمنية للمؤسسات
- **CTA:** «اطلب تقرير الأمان» / «تواصل مع Sales»

### Showcase Pages

#### `news.html`
- **الهدف:** عرض ما ينتجه المصنع (ليس بيع منتج)
- **CTA:** «شاهد Newsroom Solution» / «استكشف Media Technologies»

#### `trade.html`
- **الهدف:** عرض محركات القرار في عمل
- **CTA:** «شاهد Hedge Fund Solution» / «استكشف Trading Technologies»

### Resources Pages

#### `docs.html`
- **الهدف:** يصبح المرجع التقني للمطورين
- **CTA:** «جرّب API»

#### `case-studies.html`
- **الهدف:** إثبات اجتماعي (Social Proof)
- **CTA:** «اقرأ القصة كاملة»

#### `blog.html`
- **الهدف:** SEO + Thought Leadership
- **CTA:** «اشترك في النشرة»

#### `trust.html`
- **الهدف:** تركز الثقة (Security + Compliance + Sources)
- **CTA:** «اطلب تقرير الثقة»

### Compare Pages

#### `compare/bloomberg.html`
- **الهدف:** إقناع عميل Bloomberg أن رؤى مختلفة (لا أرخص)
- **CTA:** «شاهد Demo» / «قارن التفاصيل»

**قاعدة صفحات المقارنة:** لا نقارن بالسعر في العنوان. نقارن بالقدرات وحالات الاستخدام. السعر يأتي آخراً، بلطف.

---

## 4. مسارات التحويل (Conversion Paths)

### Path A — Enterprise (Sales-Led)

```
1. Visitor → Home (CTA: Catalog)
2. Catalog → clicks Product (CTA: Learn More)
3. Product Page → clicks "Contact Sales" (Form)
4. Form → Sales Rep calls (24h)
5. Demo → Custom Proposal
6. POC → Contract
```

### Path B — Pro / Small Business (Sales-Assisted)

```
1. Visitor → Home (CTA: Catalog)
2. Catalog → clicks Solution Bundle (CTA: Learn More)
3. Solution Page → clicks "Request Demo" (Form)
4. Form → Sales Engineer calls (48h)
5. Demo → Trial or Direct Quote
6. Trial → Conversion to Paid
```

### Path C — Individual (Self-Service)

```
1. Visitor → Trading Technologies → Smart Chart
2. Smart Chart Page → clicks "Start 14-day Trial"
3. Trial → In-app upgrade to Paid
```

### Path D — Developer (Self-Service)

```
1. Visitor → Developers → API
2. API Page → clicks "Get API Key"
3. Free Tier (10K calls/month)
4. Usage grows → Upgrade to Pro
5. Pro → Enterprise (sales介入)
```

### Path E — Returning Customer (Expansion)

```
1. Existing customer → Catalog (logged in)
2. Catalog → shows "Recommended for you" (based on current products)
3. clicks Product → Product Page
4. CTA: "Add to your plan" (no Sales needed for Pro, Sales for Enterprise)
```

### Path F — Lost Visitor (Re-engagement)

```
1. Visitor bounces from Home
2. Retargeting ad on LinkedIn
3. Ad → specific Product Page (not Home)
4. Product Page → Demo CTA
```

---

## 5. Decision Tree (لأي زائر جديد)

الموقع يجب أن يقرر **في أول 5 ثوانٍ** أين يرسل الزائر بناءً على إشارته الأولى.

### Adaptive Routing Logic:

```
Visitor arrives at index.html
│
├── Referrer = LinkedIn ad mentioning "Bloomberg alternative"
│   → Hero shows "Why ROUAA, not Bloomberg" message
│   → Primary CTA: compare/bloomberg.html
│
├── Referrer = Google search "financial intelligence API"
│   → Hero shows "Build with ROUAA APIs" message
│   → Primary CTA: developers.html
│
├── Referrer = Google search "Arabic financial news"
│   → Hero shows "ROUAA Media Technologies" message
│   → Primary CTA: media-technologies.html
│
├── First-time visitor (no referrer, no cookie)
│   → Hero shows generic positioning
│   → Below Hero: "Who are you?" 4-card selector:
│       ├── "I'm a Developer" → developers.html
│       ├── "I'm an Institution" → solutions.html
│       ├── "I'm a Trader" → trading-technologies.html
│       └── "I'm in Media" → media-technologies.html
│
├── Returning visitor (has cookie from previous visit)
│   → Hero shows "Welcome back, [last section visited]"
│   → Primary CTA: continue where they left off
│
└── Mobile visitor
    → Simplified Hero (no animation, fast load)
    → Primary CTA: catalog.html (easier to scan)
```

### The "Who Are You?" Selector (الأهم)

في الـ Home، أسفل الـ Hero مباشرة، تظهر 4 بطاقات:

```
┌─────────────────┐  ┌─────────────────┐
│ I'm a Developer │  │ I'm an          │
│ → APIs · SDK    │  │ Institution     │
│                 │  │ → Solutions     │
└─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐
│ I'm a Trader    │  │ I'm in Media    │
│ → Trading       │  │ → Media         │
└─────────────────┘  └─────────────────┘
```

هذا يقلّل معدل الضياع بشكل كبير — كل زائر يجد مساره في ثانيتين.

---

## 6. Micro-Experiences

### 6.1 Hover States

كل عنصر قابل للنقر يجب أن يستجيب بـ:
- Color shift (gold accent)
- Subtle translateY(-2px)
- Border highlight
- Cursor pointer

لا hover effects مبالغ فيها. المهنية أولاً.

### 6.2 Loading States

- Skeleton screens (لا spinners منفردة)
- Progressive loading (المحتوى يظهر أولاً، الصور ثانياً)
- Never blank screens

### 6.3 Empty States

كل empty state (لا نتائج بحث، لا بيانات، لا notifications) يجب أن:
- يشرح لماذا فارغ
- يقترح خطوة تالية
- يحتوي CTA

### 6.4 Error States

- لا technical jargon («Error 500»)
- لغة إنسانية («حدث خلل — حاول مرة أخرى أو تواصل معنا»)
- زر إعادة المحاولة
- رابط للدعم

### 6.5 Success States

- تأكيد فوري (✓)
- شرح ما حدث («تم إرسال طلبك — سنتواصل خلال 24 ساعة»)
- الخطوة التالية («ستصلك رسالة تأكيد على بريدك»)

### 6.6 Form Experiences

- Inline validation (لا انتظار لـ submit)
- Smart defaults (البلد من IP، اللغة من المتصفح)
- Progressive disclosure (لا تطلب كل شيء مرة واحدة)
- Save draft (للنماذج الطويلة)

### 6.7 Search Experience

- Search bar visible in nav (every page)
- Auto-suggest (5 suggestions)
- Search results page with filters
- «No results» state with suggestions

### 6.8 Mobile Menu

- Hamburger top-right (RTL)
- Slide-in drawer from right
- Search bar at top of drawer
- All nav items + CTA at bottom

---

## 7. Visual Hierarchy Principles

### 7.1 Typography Scale

```
Hero H1:        clamp(2.25rem, 5vw, 3.75rem)  ← أكبر، يحدد النبرة
Section H2:     clamp(2rem, 4vw, 3rem)         ← واضح، يقسم
Subsection H3:  1.25rem                         ← توضيحي
Body:           1rem (16px)                     ← أساسي
Small:          0.875rem (14px)                 ← ثانوي
Micro:          0.75rem (12px)                  ← labels, tags
Mono:           0.6875rem (11px)                ← code, stats
```

### 7.2 Color Usage (Role, not Decoration)

| اللون | الدور | أين يظهر |
|------|------|------|
| Navy (#05070D) | الخلفية الأساسية | كل الصفحة |
| Gold (#C8A951) | Accent + CTA + brand | أزرار، روابط، شارات |
| Blue (#60a5fa) | Media Technologies | عناصر BL1 |
| Emerald (#34D399) | Trading Technologies + نجاح | عناصر BL2، success states |
| Rose (#EF4444) | أخطاء + خسارة | error states، negative numbers |
| Text (#F3F4F6) | المحتوى الأساسي | كل النصوص |

**القاعدة:** لا تستخدم اللون للزينة. كل لون يحمل معنى.

### 7.3 Whitespace

- مسافات سخية بين الأقسام (8rem vertical padding)
- لا ازدحام داخل البطاقات (1.5rem padding minimum)
- الهواء الأبيض = فخامة

### 7.4 Grid System

- 12-column desktop grid
- 1280px max-width container
- 2rem gutters (1.25rem mobile)
- Cards: minmax(240px, 1fr) — تعيد الترتيب بسلاسة

---

## 8. Motion & Interaction Principles

### 8.1 Reveal on Scroll

- عناصر `.reveal` تبدأ opacity:0 + translateY(20px)
- عند دخولها viewport: opacity:1 + translateY(0)
- المدة: 0.8s ease
- العتبة: 10% من العنصر مرئي
- احترام `prefers-reduced-motion` (لا حركة لمن يطلبها)

### 8.2 Hover Transitions

- المدة: 0.2-0.3s
- لا bounce، لا elastic (مهنية، لا مرح)
- تحريك بسيط + تغيير لون

### 8.3 Click Feedback

- Buttons: scale(0.98) عند النقر
- Cards: translateY(-2px) عند hover
- Links: color shift فوري

### 8.4 Page Transitions

- لا full page reloads (إذا أمكن)
- التحميل التدريجي: المحتوى أولاً، الصور ثانياً
- Skeleton screens أثناء التحميل

### 8.5 What NOT to Animate

- ❌ Numbers (لا ت عدّ تصاعدي — يبدو عرضياً)
- ❌ Text on load (لا fade-in للنصوص الأساسية)
- ❌ Background gradients (لا shifting backgrounds)
- ❌ Parallax (مشكلة على الموبايل + يشتت)

---

## 9. Mobile Experience

### 9.1 Principles

- Mobile-first في التفكير، Desktop-first في التنفيذ
- كل ميزة تعمل على mobile
- No "available on desktop only" warnings

### 9.2 Mobile Layout Rules

- Nav → hamburger drawer
- Multi-column grids → single column
- Tables → cards (responsive restructure)
- Modals → full-screen sheets
- Forms → single column, larger inputs

### 9.3 Touch Targets

- Minimum 44×44px لكل عنصر قابل للنقر
- 8px spacing بين العناصر المتجاورة

### 9.4 Performance (Mobile)

- Images: WebP + lazy load
- Fonts: subset + display: swap
- JS: minimal, no heavy libraries
- LCP < 2.5s on 3G

---

## 10. Accessibility (A11y)

### 10.1 WCAG 2.1 AA Compliance

- Color contrast: 4.5:1 minimum للنصوص، 3:1 للنصوص الكبيرة
- All interactive elements keyboard accessible
- Focus visible (gold outline, 3px offset)
- Skip to main content link

### 10.2 Screen Reader

- Semantic HTML (nav, main, section, article, aside, footer)
- ARIA labels where semantic isn't enough
- alt text for all images
- Live regions for dynamic content

### 10.3 RTL (Right-to-Left)

- `dir="rtl"` on html
- Logical properties (margin-inline-start, not margin-right)
- Mirror icons that imply direction (arrows)
- No forced LTR for code (use `dir="ltr"` only on code blocks)

### 10.4 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 11. محظورات التصميم (Anti-Patterns)

### ❌ ما لا يجب فعله أبداً:

1. **No hero video backgrounds** — بطيئة، مشتتة، تبدو 2010
2. **No carousels** — لا أحد ينتظر الـ slide الثاني
3. **No accordion FAQs على الصفحات الرئيسية** — أرشفها في صفحة منفصلة
4. **No "Trusted by" logo strips بلا context** — لوغوهات بلا قصة = لا قيمة
5. **No giant numbers بدون دليل** — «99.9% uptime» بحاجة صفحة status
6. **No placeholder text** — كل كلمة على الموقع يجب أن تكون نهائية
7. **No "Lorem ipsum"** — لو المحتوى غير جاهز، الصفحة غير جاهزة
8. **No mixed alignment** — RTL في كل مكان، LTR فقط للكود والـ brand names
9. **No English mixed with Arabic في النصوص** — الإنجليزية للمصطلحات التقنية فقط (API, SDK, REST, etc.)
10. **No dark patterns** — لا تطلب معلومات زائدة، لا تختار default خاطئ، لا تجعل الإلغاء صعباً
11. **No emojis في النصوص المؤسسية** — مهنية أولاً
12. **No gradient text** — يبدو رخيصاً
13. **No drop shadows عميقة** — الحدود (borders) أنظف
14. **No full-width videos autoplay** — مزعجة
15. **No infinite scroll على صفحات منتجات** — فقط على Blog/Catalog

### ✅ ما يجب فعله دائماً:

1. **وعد واضح في H1** — كل صفحة تقول ما الذي ستحصل عليه
2. **CTA واحد أساسي لكل صفحة** — لا تتيه بين أزرار
3. **أرقام محددة** — لا «عشرات المصادر»، بل «411 مصدر رسمي»
4. **Source لكل ادعاء** — لو قلت «الأسرع»، اشرح مقارنة بمن
5. **صفحات قصيرة أفضل من صفحات لا نهائية** — لا تخف من التقسيم
6. **Hero واحد لكل صفحة** — لا تكرر الـ pattern

---

## 12. معايير الاعتماد

- [ ] كل صفحة لها هدف واحد قابل للوصف في جملة
- [ ] Voice & Tone موثّق (مؤسسية + واثقة + عميقة)
- [ ] 7 Page Goals محدّدة (Home / Catalog / Product / Pricing / Contact / Demo / Compare)
- [ ] 6 Conversion Paths (Enterprise / Pro / Individual / Developer / Returning / Lost)
- [ ] Adaptive Routing Decision Tree (Referrer-aware + "Who Are You?" selector)
- [ ] 8 Micro-Experiences (Hover / Loading / Empty / Error / Success / Form / Search / Mobile Menu)
- [ ] Visual Hierarchy موثّق (Typography + Color roles + Whitespace + Grid)
- [ ] Motion Principles (Reveal + Hover + Click + ما لا يُحرّك)
- [ ] Mobile Experience كاملة
- [ ] WCAG 2.1 AA Compliance
- [ ] 15 Anti-Patterns محظورة
- [ ] 6 Positive Patterns مطلوبة

---

## 13. المبدأ النهائي

> **التجربة ليست زخرفة. التجربة هي القرار.**
>
> كل تفاعل على الموقع هو قرار: يستمر الزائر أم يغادر؟
>
> EXA v1 يثبّت هذه القرارات مسبقاً — لا اجتهاد أثناء التنفيذ.
>
> **مع COM v1 + IA + EXA، التنفيذ يصبح تنفيذ مواصفات.**

---

**الحالة:** v1 — بانتظار الاعتماد النهائي
**الأساس:** COMMERCIAL-OPERATING-MODEL-v1.md
**Branch:** `redesign-v20-architecture`
**التاريخ:** يوليو 2026

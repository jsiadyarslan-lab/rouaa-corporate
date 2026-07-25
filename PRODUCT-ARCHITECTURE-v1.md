# ROUAA · Product & Monetization Architecture v1

> وثيقة مرجعية موحّدة تُكتب قبل أي تعديل صفحات.
>
> **المبدأ المركزي:** لا حذف. إعادة تنظيم. كل ما بُني خلال الأشهر الماضية أصول تقنية ومنتجات قابلة للبيع — المشكلة كانت في السرد والتصنيف، لا في الكود.
>
> **المرجع الرسمي لـ v20.** لا يُعدّل أي HTML قبل اعتماد هذه الوثيقة.

---

## 1. الفكرة المركزية

رؤى ليست منتجاً واحداً. ليست موقع أخبار. ليست منصة تداول. ليست API.

رؤى **أربع شركات داخل شركة واحدة**:

```
ROUAA Intelligence Ecosystem
              │
   ┌──────────┼──────────────┐
   │          │              │
البنية       المصانع        واجهات البيع
التحتية      الإعلامية      والتأجير
والاستخبارات  واتخاذ القرار
```

هذه الوثيقة تثبّت:
- كل منتج موجود
- لمن يُباع
- السعر
- الصفحة الخاصة به
- مكانه في المعمارية

---

## 2. المعمارية الكاملة (5 طبقات)

```
                Layer 0
         ROUAA Intelligence Platform
                    │
   ┌────────────────┼─────────────────┐
   │                │                 │
Layer 1          Layer 2           Layer 3
Infrastructure   Engines          Products
(مصادر وثقة)     (ذكاء)           (تأجير وبيع)
   │                │                 │
   └────────────────┼─────────────────┘
                    │
                Layer 4
              Enterprise
            (حلول قطاعية)
```

| الطبقة | السؤال | المحتوى |
|--------|------|------|
| Layer 0 | ما هي رؤى؟ | Intelligence Platform — الإطار السردي |
| Layer 1 | كيف نبني الثقة؟ | Official Sources، Source Registry، Evidence System، Knowledge Graph |
| Layer 2 | كيف ننتج الذكاء؟ | Knowledge Engines + Decision Engines |
| Layer 3 | ماذا نبيع؟ | 4 عائلات منتجات (انظر القسم 4) |
| Layer 4 | لمن؟ | Banks، Hedge Funds، Brokers، Media، Governments، Research Firms |

---

## 3. عائلات المنتجات (Layer 3 — مفصّلة)

رؤى تبيع 4 عائلات منتجات، كل عائلة تحوي منتجات قابلة للبيع بشكل مستقل:

### 3A — ROUAA Intelligence Platform (Licensing)

**لمن:** البنوك، الصناديق، المؤسسات البحثية، الحكومات
**السعر:** Enterprise Licensing (حسب العقد)

| المنتج | الوظيفة | الصفحة |
|--------|------|------|
| Intelligence Infrastructure | وصول كامل لـ Layer 1 + Layer 2 | `/intelligence-platform` |

### 3B — ROUAA Media Intelligence Suite (Content Factories)

**لمن:** المواقع الإخبارية، الصحف المالية، القنوات، المؤسسات الإعلامية، الوسطاء (لمحتوى عملائهم)
**السعر:** $1,000 — $50,000 شهرياً حسب المنتج والباقة

| المنتج | الوظيفة | السعر الشهري | الصفحة |
|--------|------|------|------|
| Independent News Agency Agent | وكالة أنباء مالية خاصة باسم المؤسسة | $5,000 — $20,000 | `/news-agency` |
| News Pipeline | أنبوب إنتاج أخبار (جمع، تحليل، كتابة، ترجمة، صور، نشر) | $1,000 — $10,000 | `/news-pipeline` |
| Reports Pipeline | تقارير يومية، أسبوعية، قطاعية، استراتيجية | $5,000 — $50,000 | `/reports-pipeline` |
| Video Pipeline | فيديوهات تحليلية، أخبار، ملخصات | حسب العقد | `/video-pipeline` |
| Infographic Pipeline | رسوم، بيانات، خرائط اقتصادية | حسب العقد | `/infographic-pipeline` |
| Stock Analysis Pipeline | تحليل أساسي + فني + SWOT لآلاف الأسهم | حسب العقد | `/stock-analysis` |
| Geopolitical Risk Pipeline | مخاطر الدول، الأحداث، تأثير الأسواق | حسب العقد | `/geopolitical-risk` |

**باقات المبيعات:**
- Starter Pipeline — $1,000 — $5,000 (أنبوب واحد)
- Professional Newsroom — $10,000 — $50,000 (غرفة أخبار كاملة)
- Enterprise Media Infrastructure — حسب العقد

### 3C — ROUAA Trading Intelligence Suite

**لمن:** الأفراد، الصناديق، الوسطاء، المؤسسات
**السعر:** $99 — $50,000 شهرياً حسب المنتج والباقة

| المنتج | الوظيفة | السعر الشهري | الصفحة |
|--------|------|------|------|
| AI Council | 10 أدوار استدلال تتشاور قبل كل توصية | مشمول في الباقات | `/ai-council` |
| Smart Executor | تنفيذ محافظ متوسط وطويل المدى (15 فحص أمان) | مشمول | `/executors` |
| Autonomous Trading Agent | تاجر مستقل بدورة كاملة (8 استراتيجيات، Reinforcement Learning) | مشمول | `/executors` |
| **LASAA (اللاسع)** | **High Frequency Execution Agent (<5ms، tick data، microstructure)** | **منتج مستقل** | `/lasaa` |
| Smart Chart Intelligence | 83 أداة رسم، 15 مؤشر، Bayesian Engine، Wyckoff، Elliott، Harmonic، Scenario Engine، AI Explanation | منتج مستقل | `/smart-chart` |
| Advanced Scanner | SmartScore، Multi-timeframe، Patterns، Divergence، Volume Profile | منتج مستقل | `/scanner` |
| Predictive Markets | احتمالات حية للأحداث المالية الكبرى | مشمول | `/prediction-markets` |
| Portfolio Intelligence | إدارة المراكز مع ربط كل مركز بالاستخبارات | مشمول | `/portfolio` |
| AI Trading Assistant | مساعد ذكي بـ 32 لغة | مشمول | `/ai-assistant` |
| MT5 Bridge | جسر تنفيذ للوسطاء والمؤسسات | مشمول | `/execution-bridge` |

**باقات المبيعات:**
- Individual — $99 — $499 شهرياً
- Professional — $1,000 — $5,000 شهرياً
- Institutional — $5,000 — $50,000 شهرياً

**معمارية المنفّذين (Execution Agents):**
```
        AI Council
            │
   ┌────────┼─────────┐
   │        │         │
Smart     Auto      LASAA
Executor  Agent     Scalper
(Swing)   (Full)    (<5ms)
```

### 3D — ROUAA APIs + White Label (Platform Access)

**لمن:** الشركات التي تبني منتجاتها
**السعر:** حسب الاستهلاك ( APIs) / حسب العقد (White Label)

| المنتج | الوظيفة | الصفحة |
|--------|------|------|
| Financial Intelligence API | Official Data + Facts + Events + Evidence | `/api` |
| Trading Intelligence API | Signals + Scores + AI Council access | `/api` |
| Content API | News + Reports + Video | `/api` |
| Streaming API | WebSocket | `/api` |
| SDK | Python/JS/Go/Java/Rust | `/api` |
| White Label | منصة كاملة قابلة للعلامة التجارية | `/white-label` |

---

## 4. هيكل الموقع النهائي (Site Map)

```
index.html (Home — Layer 0 + 5-layer overview)
│
├── intelligence-platform.html (Layer 0+1+2 — البنية والمحركات)
│
├── media-intelligence.html (Suite landing — 3B)
│   ├── news-agency.html
│   ├── news-pipeline.html
│   ├── reports-pipeline.html
│   ├── video-pipeline.html
│   ├── infographic-pipeline.html
│   ├── stock-analysis.html
│   └── geopolitical-risk.html
│
├── trading-intelligence.html (Suite landing — 3C)
│   ├── ai-council.html
│   ├── executors.html
│   ├── lasaa.html
│   ├── smart-chart.html
│   ├── scanner.html
│   ├── prediction-markets.html
│   ├── portfolio.html
│   ├── ai-assistant.html
│   └── execution-bridge.html
│
├── api.html (Suite landing — 3D part 1)
│
├── white-label.html (3D part 2)
│
├── enterprise.html (Layer 4 — حلول قطاعية)
│   └── (#security section)
│
└── pricing.html (جميع الباقات في صفحة واحدة)
```

**إجمالي الصفحات:** 21 صفحة (موزّعة: 6 حالية معدّلة + 15 صفحة جديدة)

---

## 5. صفحة Home (index.html) — ما الذي يبقى وما الذي يتغير

### يبقى كما هو (من v19):
- Hero: "From Official Intelligence to Investment Execution"
- Architecture Map (5 طبقات)
- Business Value Layer (6 value cards)
- Enterprise strip

### يتغير:
- قسم المنتجات يُعاد ترتيبه من 4 منتجات إلى **4 عائلات منتجات**
- كل عائلة تعرض منتجاتها الفرعية كروابط
- شارة "Powered by ROUAA Intelligence Core" تبقى على كل صفحة منتج

### القسم الجديد في Home:

```
Layer 3 · Commercial Products — 4 Families

┌─────────────────────────┐  ┌─────────────────────────┐
│ 3A · Intelligence        │  │ 3B · Media Intelligence │
│ Platform Licensing       │  │ Suite (Content Factories)│
│ 1 منتج — Enterprise      │  │ 7 منتجات — $1K-$50K/mo  │
└─────────────────────────┘  └─────────────────────────┘

┌─────────────────────────┐  ┌─────────────────────────┐
│ 3C · Trading Intelligence│  │ 3D · APIs + White Label │
│ Suite (Decision+Exec)    │  │ (Platform Access)       │
│ 10 منتجات — $99-$50K/mo  │  │ 6 منتجات — Usage-based  │
└─────────────────────────┘  └─────────────────────────┘
```

---

## 6. قواعد تصميم الصفحات (تُطبّق بعد اعتماد هذه الوثيقة)

### 6.1 صفحة Home (index.html)
- تبيع الرؤية + القيمة + 4 عائلات منتجات (لا تفاصيل المنتجات الفرعية)
- الـ 5 طبقات + Business Value Layer يبقيان
- لا تكرار — كل منتج يظهر مرة واحدة فقط في الموقع كله

### 6.2 صفحات Suite Landings (3 صفحات)
- `media-intelligence.html` — يعرض 7 منتجات الـ Media Intelligence Suite
- `trading-intelligence.html` — يعرض 10 منتجات الـ Trading Intelligence Suite
- `api.html` — يعرض 5 منتجات API + Pricing Model

كل صفحة Suite:
- Hero (اسم العائلة + السؤال الذي تجيب عنه)
- المنتجات في شبكة بطاقات
- باقات المبيعات
- Pricing range
- CTA

### 6.3 صفحات المنتجات الفردية (15 صفحة جديدة)
كل صفحة منتج تتبع نفس القالب:
1. **المشكلة** (Problem) — ما الذي يعانيه العميل بدون هذا المنتج
2. **الحل** (Solution) — كيف يحل المنتج المشكلة
3. **كيف يعمل** (How it works) — معمارية المنتج ومكوّناته
4. **الميزات** (Features) — قائمة كاملة بالقدرات
5. **Demo** — عرض تفاعلي حيث أمكن
6. **API** — إن وُجد، كيف يدمج العميل المنتج
7. **الاستخدامات** (Use cases) — من يستخدمه وكيف
8. **التسعير** (Pricing) — باقات واضحة
9. **CTA** — طلب وصول أو تواصل

### 6.4 صفحة Enterprise (Layer 4)
- تبقى صفحة واحدة
- تضيف قطاعين جديدين: **Media Companies** و **Research Firms**
- تضيف Deployment Models + Procurement Process (موجودة من v19)
- كل قطاع يربط بالمنتجات المناسبة له

### 6.5 صفحة Pricing (جديدة)
- صفحة واحدة تجمع كل الباقات
- مقسّمة حسب العائلة: Intelligence Platform / Media / Trading / APIs / White Label
- لكل باقة: السعر، ما المُضمَّن، لمن

### 6.6 Navigation الموحّد
```
Platform · Intelligence · Media Suite · Trading Suite · APIs · Enterprise · Pricing
```

كل صفحة منتج فردي تحوي:
- Breadcrumb: Home > [Suite] > [Product]
- Powered by ROUAA Intelligence Core (شارة)

---

## 7. ما الذي لا يتغير (الأصول المحفوظة)

### يبقى كما هو تماماً من v19:
1. **نظام التصميم** — نفس الـ color tokens (navy/gold/blue/emerald)، نفس الخطوط (Cairo/Inter/JetBrains Mono)، نفس RTL Arabic
2. **الـ Navigation الأساسي** — نفس النمط، مع تعديل الروابط فقط
3. **Architecture Map** في index.html — 5 طبقات واضحة
4. **Business Value Layer** في index.html — 6 value cards
5. **Evidence Chain** في صفحات التداول — سلسلة الإثبات الكاملة
6. **Knowledge Graph SVG** — إن وُجد
7. **API Explorer** — التفاعلي مع 5 تبويبات
8. **Deployment Models** في Enterprise — 4 نماذج
9. **Procurement Process** في Enterprise — 4 خطوات
10. **Pricing Model** في API — by volume/depth/method/SLA
11. **Footer** — نفس البنية، تحديث الروابط فقط

### يُعاد تنظيمه فقط (لا حذف):
- صفحة `news.html` الحالية → تُدمج مع `media-intelligence.html` (Suite landing)
- ميزات News الموجودة (Intelligence Feed, Research, Reports, Calendar, Asset Intel, Media Intel, Source Trust, AI Publishing) → تُوزّع على صفحات منتجات Media Suite السبعة
- صفحة `trade.html` الحالية → تُدمج مع `trading-intelligence.html` (Suite landing)
- ميزات Trade الموجودة (Decision Dashboard, Smart Chart, Portfolio, Assistant, Neural Lab) + (AI Council, Smart Executor, Autonomous Trader, EA Bridge, Prediction Market, Risk Engine) → تُوزّع على صفحات منتجات Trading Suite العشرة

---

## 8. ترتيب التنفيذ (بعد اعتماد الوثيقة)

### المرحلة 1 — تحديث index.html
- إعادة ترتيب قسم المنتجات من 4 منتجات إلى 4 عائلات
- إضافة روابط لصفحات Suite الجديدة

### المرحلة 2 — إنشاء 3 صفحات Suite Landings
- `media-intelligence.html` (7 منتجات)
- `trading-intelligence.html` (10 منتجات)
- تحديث `api.html` (5 منتجات API + White Label link)

### المرحلة 3 — إنشاء 15 صفحة منتج فردي
كل صفحة بالقالب الموحّد (Problem/Solution/How/Features/Demo/API/Use cases/Pricing/CTA):
- 7 صفحات Media Suite
- 8 صفحات Trading Suite (LASAA, Smart Chart, Scanner, Prediction Markets, Portfolio, Assistant, EA Bridge, Executors)

### المرحلة 4 — تحديث enterprise.html
- إضافة قطاعي Media Companies + Research Firms
- ربط كل قطاع بالمنتجات المناسبة

### المرحلة 5 — إنشاء pricing.html
- صفحة واحدة تجمع كل الباقات

### المرحلة 6 — تحديث Navigation
- كل الصفحات تحوي نفس الـ nav الموحّد

---

## 9. ما يحتاج تثبيته قبل أي تنفيذ

- [ ] اعتماد 4 عائلات منتجات (3A Intelligence Platform / 3B Media Suite / 3C Trading Suite / 3D APIs+WL)
- [ ] اعتماد قائمة المنتجات داخل كل عائلة (1+7+10+6 = 24 منتج)
- [ ] اعتماد الأسعار (نطاقات starter/pro/enterprise لكل عائلة)
- [ ] اعتماد LASAA كمنتج مستقل بصفحة خاصة (`/lasaa`)
- [ ] اعتماد Smart Chart كمنتج مستقل بصفحة خاصة (`/smart-chart`)
- [ ] اعتماد News Agency Agent كمنتج مستقل بصفحة خاصة (`/news-agency`)
- [ ] اعتماد إنشاء صفحة Pricing مركزية
- [ ] اعتماد قالب صفحة المنتج الموحّد (Problem/Solution/How/Features/Demo/API/Use cases/Pricing/CTA)
- [ ] اعتماد إضافة قطاعي Media Companies + Research Firms في Enterprise
- [ ] اعتماد ترتيب التنفيذ: المراحل 1-6

---

## 10. المبدأ النهائي

> **رؤى لا تبيع منتجاً. تبيع منظومة.**
>
> لكن المنظومة تُستهلك عبر منتجات. كل منتج يحل مشكلة محددة لعميل محدد بسعر محدد.
>
> دور الموقع: أن يوضح كيف تتحول المنظومة إلى قيمة قابلة للشراء — لا أن يعرض المعمارية فقط.

---

**الحالة:** v1 — بانتظار الاعتماد النهائي من المستخدم قبل أي تعديل صفحات
**الأساس:** v19-product-depth (المعمارية + Business Value Layer محفوظة)
**Branch:** `redesign-v20-architecture`
**التاريخ:** يوليو 2026
**عدد الصفحات المتوقعة بعد التنفيذ:** 21 صفحة (6 معدّلة + 15 جديدة)

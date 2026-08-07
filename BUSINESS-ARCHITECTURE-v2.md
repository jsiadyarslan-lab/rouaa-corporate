# ROUA · Business Architecture v2

> الوثيقة الأم — تثبّت **نموذج الأعمال** قبل **نموذج المنتج**.
>
> v2 تطبّق تعديلين استراتيجيين من مراجعة المستخدم:
> 1. Platform Access لم يعد Business Line — أصبح **Consumption Layer** يخدم كل خطوط الأعمال
> 2. إضافة **Solutions Layer** بين خطوط الأعمال والمنتجات — حلول جاهزة من عدة منتجات
>
> **القاعدة:** لا يُلمس أي HTML حتى تُعتمد هذه الوثيقة.

---

## 1. الإدراك الجوهري (مثبّت من v1)

رؤى ليست شركة بمنتجات. رؤى **شركة تمتلك مصنعاً، وتبيع أجزاءه بطرق مختلفة**:

```
Core Intelligence Platform (المصنع)
        ↓
Business Lines (الشركات) ← Solutions (حلول Bundles) ← Products (منتجات)
        ↓
Consumption Layer (طرق الاستهلاك)
```

> **News و Trade ليسا منتجات. هما Showcase فقط.**
> **العميل يشتري حلاً (Solution) أو منتجاً (Product)، لا منصة.**

---

## 2. المعمارية الجديدة (v2) — 5 طبقات تجارية

```
┌─────────────────────────────────────────┐
│  Core Intelligence Platform             │  ← المصنع
│  (Layer 0/1/2 — Infrastructure+Engines)│
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼────────┐ ┌──────▼─────────┐
│  Media         │ │  Trading       │  ← Business Lines
│  Technologies  │ │  Technologies  │     (الشركتان)
└───────┬────────┘ └──────┬─────────┘
        │                 │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │  Solutions      │  ← NEW: حلول Bundles
        │  (by Industry)  │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │  Products (24)  │  ← المنتجات المستقلة
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │  Consumption    │  ← v2: Access = Consumption Layer
        │  Layer          │     (API/SDK/White Label)
        │  • API          │
        │  • SDK          │
        │  • White Label  │
        │  • On-Premise   │
        │  • Cloud        │
        └─────────────────┘
```

---

## 3. التعديلان الجوهريان على v1

### تعديل 1 — Platform Access = Consumption Layer (لا Business Line)

**v1 (خطأ):** Platform Access كـ Business Line 4 موازية للميديا والتداول
**v2 (صحيح):** Consumption Layer تخدم **كل** خطوط الأعمال

**السبب:** API يمكن أن يخص Media أو Trading أو Intelligence — جميعها. تقسيمه كـ Business Line يخلق تداخلاً.

```
Consumption Layer (تعبر كل Business Lines)
├── API (REST/Streaming) — يصل لأي منتج في أي Business Line
├── SDK — يلّف أي API
├── White Label — يأخذ أي Business Line كاملاً بعلامة العميل
├── On-Premise — أي Business Line على بنية العميل
└── Cloud SaaS — أي Business Line مستضافة
```

### تعديل 2 — إضافة Solutions Layer

**v1 (نقص):** العميل يشتري منتجاً واحداً (Pipeline واحد)
**v2 (صحيح):** العميل يشتري **Solution** (Bundle من عدة منتجات + Professional Services)

**السبب:** المؤسسات لا تشتري Reports Pipeline. تشتري «Central Bank Intelligence Solution» الذي يحوي Reports + News + Risk + API + Implementation.

```
Solutions Layer (بين Business Lines والمنتجات)
├── Newsroom Solution (للإعلام المالي)
│   └── News Agency + News Pipeline + Reports Pipeline + Video + Implementation
├── Central Bank Intelligence Solution
│   └── Intelligence Platform + Reports Pipeline + Geopolitical Risk + API + Training
├── Broker Intelligence Solution
│   └── White Label + Trading Suite + News Pipeline + Onboarding
├── Hedge Fund Trading Solution
│   └── AI Council + LASAA + Smart Chart + Streaming API + Implementation
├── Government Policy Solution
│   └── Intelligence Platform (On-Prem) + Geopolitical Risk + Reports + Advisory
├── Fintech Investment App Solution
│   └── Stock Analysis + News API + Smart Chart SDK + White Label
└── Custom Solutions (عقد مخصص)
```

**هذا يرفع متوسط قيمة العقد (ACV) بشكل كبير.**

---

## 4. فصل واضح: Who We Are vs What We Sell

### تعديل 3 — إضافة صفحة About Roua

**v1 (نقص):** لا يوجد فصل بين الهوية والمنتجات
**v2 (إضافة):** صفحة `about.html` تشرح:

- لماذا بُنيت رؤى
- فلسفة "Financial Intelligence Infrastructure"
- الفرق بين رؤى و Bloomberg / Refinitiv
- المصنع (Factory) كمفهوم
- الرؤية طويلة المدى

هذه ليست صفحة تسويق — بل صفحة هوية مؤسسية.

---

## 5. خريطة الموقع الجديدة (v2) — 27 صفحة

```
index.html (Home — Layer 0 + 5-layer Business Architecture + 4 Business Lines preview)
│
├── about.html (Who We Are — الهوية المؤسسية) ★ NEW
│
├── catalog.html (Solutions Catalog — كل الـ 24 منتج) ★ NEW
│
├── solutions.html (Solutions Landing — 6+ Solutions Bundles) ★ NEW
│   ├── /newsroom-solution
│   ├── /central-bank-solution
│   ├── /broker-solution
│   ├── /hedge-fund-solution
│   ├── /government-solution
│   ├── /fintech-solution
│   └── /custom-solution
│
├── intelligence-platform.html (Core Platform landing)
│   ├── /deployment (Cloud / Private / On-Prem / Hybrid)
│   └── /licensing
│
├── media-technologies.html (Business Line 1 landing)
│   ├── news-agency.html
│   ├── news-pipeline.html
│   ├── reports-pipeline.html
│   ├── video-pipeline.html
│   ├── infographic-pipeline.html
│   ├── stock-analysis.html
│   └── geopolitical-risk.html
│
├── trading-technologies.html (Business Line 2 landing)
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
├── developers.html (Consumption Layer landing) ★ NEW (replaces platform-access)
│   ├── api.html (Financial / Trading / Content / Streaming APIs)
│   ├── sdk.html
│   ├── white-label.html
│   └── deployment.html (Cloud / Private / On-Prem / Hybrid)
│
├── news.html (Showcase — ليس منتج)
├── trade.html (Showcase — ليس منتج)
│
├── enterprise.html (Layer 4 — حلول قطاعية، 6 قطاعات)
│   └── (#security section)
│
├── pricing.html (by Business Line + Solutions + Professional Services)
│
└── professional-services.html ★ NEW
    ├── /implementation
    ├── /migration
    ├── /training
    ├── /managed-operations
    ├── /advisory
    └── /custom-ai-development
```

**إجمالي:** 27 صفحة (6 حالية معدّلة + 21 جديدة)

---

## 6. خطوط الأعمال (مُحدّثة — 2 فقط بدل 4)

### Core · Intelligence Platform (المصنع)

**السوق:** البنوك المركزية، صناديق الثروة السيادية، الجهات الحكومية
**الإيراد:** Enterprise Licensing (عقود سنوية تبدأ من $500K)
**المنتجات (3 — أنواع Deployment):**
1. Intelligence Platform — Cloud SaaS
2. Intelligence Platform — On-Premise
3. Intelligence Platform — Hybrid

**الرسالة:** «لا تبني محرّكات معرفة من الصفر — استلم المصنع جاهزاً.»

### Business Line 1 · Media Technologies

**السوق:** المواقع الاقتصادية، الصحف المالية، القنوات، البنوك، الوسطاء، المؤسسات الإعلامية
**الإيراد:** $1K — $50K شهرياً لكل منتج
**المنتجات (7):**
1. Independent News Agency Agent — $5K — $20K/mo
2. News Pipeline — $1K — $10K/mo
3. Reports Pipeline — $5K — $50K/mo
4. Video Pipeline — $10K+ /mo
5. Infographic Pipeline — $3K+ /mo
6. Stock Analysis Pipeline — $15K+ /mo
7. Geopolitical Risk Pipeline — $10K+ /mo

**Showcase:** news.html

**الرسالة:** «املك غرفة أخبار مالية كاملة — بلا محررين، بلا تأخير، بلا اعتماد على Bloomberg.»

### Business Line 2 · Trading Technologies

**السوق:** الأفراد، Prop Firms، صناديق التحوط، الوسطاء، Quant Firms، Market Makers
**الإيراد:** $99 — $50K+ شهرياً
**المنتجات (10):**
1. AI Council — $5K+ /mo
2. Executors (Smart + Autonomous) — included in suite
3. LASAA — $25K+ /mo (Enterprise)
4. Smart Chart Intelligence — $99 — $5K/mo
5. Advanced Scanner — $99 — $3K/mo
6. Predictive Markets — $2K+ /mo
7. Portfolio Intelligence — included in suite
8. AI Trading Assistant — $49 — $2K/mo
9. Execution Bridge (MT5) — $1K — $10K/mo

**Showcase:** trade.html

**الرسالة:** «من المعلومة إلى التنفيذ إلى التعلّم — دورة قرار كاملة، لا أمر مفرد.**

### Consumption Layer (تعبر كل ما سبق — ليست Business Line)

**السوق:** المطورون، الـ Quant، شركات الفينتك، الوسطاء، المؤسسات
**الإيراد:** Usage-based + Enterprise contracts
**المنتجات (5 — طرق الاستهلاك):**
1. API (Financial / Trading / Content / Streaming) — يصل لأي Business Line
2. SDK — يلّف أي API (Python/JS/Go/Java/Rust)
3. White Label — يأخذ أي Business Line كاملاً بعلامة العميل
4. On-Premise Deployment — أي Business Line على بنية العميل
5. Cloud SaaS Deployment — أي Business Line مستضافة

**الرسالة:** «رؤى بـ JSON — أو رؤى باسمك. اختر طريقة الاستهلاك.»

---

## 7. Solutions Layer — Bundles جاهزة (جديد v2)

العميل المؤسسي لا يشتري منتجاً. يشتري **حلاً متكاملاً** يحوي منتجات + خدمات.

### Solution 1 · Newsroom Solution (للإعلام المالي)
**العميل:** موقع اقتصادي، صحيفة مالية، قناة إخبارية
**المكونات:** News Agency + News Pipeline + Reports Pipeline + Video Pipeline + Implementation (4 أسابيع)
**السعر:** يبدأ من $30K شهرياً + $50K setup

### Solution 2 · Central Bank Intelligence Solution
**العميل:** بنك مركزي
**المكونات:** Intelligence Platform (On-Prem) + Reports Pipeline + Geopolitical Risk + API + Training (5 أيام) + Advisory (3 أشهر)
**السعر:** يبدأ من $500K سنوياً

### Solution 3 · Broker Intelligence Solution
**العميل:** وسيط مالي
**المكونات:** White Label + Trading Suite + News Pipeline + Onboarding (8 أسابيع)
**السعر:** يبدأ من $40K شهرياً + $100K setup

### Solution 4 · Hedge Fund Trading Solution
**العميل:** صندوق تحوط كمي
**المكونات:** AI Council + LASAA + Smart Chart + Streaming API + Implementation (6 أسابيع)
**السعر:** يبدأ من $60K شهرياً + $75K setup

### Solution 5 · Government Policy Solution
**العميل:** جهة حكومية اقتصادية
**المكونات:** Intelligence Platform (On-Prem) + Geopolitical Risk + Reports Pipeline + Advisory (6 أشهر)
**السعر:** يبدأ من $750K سنوياً

### Solution 6 · Fintech Investment App Solution
**العميل:** شركة فينتك تطلق تطبيق استثمار
**المكونات:** Stock Analysis + News API + Smart Chart SDK + White Label + Implementation (10 أسابيع)
**السعر:** يبدأ من $25K شهرياً + $50K setup

### Solution 7 · Custom Solutions
**العميل:** أي مؤسسة بحاجة مخصصة
**المكونات:** يُبنى حسب الطلب من أي منتجات رؤى + Professional Services
**السعر:** حسب العقد

**رسالة Solutions Layer:**
> «لا تشتري منتجاً وتتركه — اشترِ حلاً متكاملاً. نركّب، ندرّب، ندعم، ونهاجر بك. متوسط قيمة العقد أعلى، زمن القيمة أسرع.»

---

## 8. Professional Services — موسّعة (v2)

6 خدمات بدل 5، وأكبر:

| الخدمة | الوصف | السعر |
|--------|------|------|
| Implementation Services | تركيب وتكامل مع بنية العميل | $25K — $200K |
| Migration Assistance | نقل من Bloomberg/Refinitiv إلى رؤى | $50K — $500K |
| Custom Training | تدريب فريق العميل على رؤيي | $5K — $25K/برنامج |
| **Managed Operations** | تشغيل رؤى بالكامل نيابة عن العميل | $10K — $50K/شهرياً |
| Strategic Advisory | استشارات استراتيجية لبناء المنتجات | $15K — $50K/مهمة |
| **Custom AI Development** | تطوير وكلاء/محرّكات مخصصة للعميل | $50K — $500K |

> المؤسسات الكبيرة قد تدفع في الخدمات أكثر من الترخيص نفسه.

---

## 9. Navigation الموحّد (مُحدّث — v2)

```
Home · Catalog · Solutions · Media · Trading · Developers · Enterprise · Pricing · About
```

| العنصر | الوجهة | لمن |
|--------|------|------|
| Home | index.html | الجميع |
| Catalog | catalog.html | من يبحث عن منتج محدد |
| **Solutions** | solutions.html | المؤسسات التي تريد حلاً جاهزاً |
| Media | media-technologies.html | الإعلام المالي |
| Trading | trading-technologies.html | صناديق التحوط، الوسطاء، الأفراد |
| **Developers** | developers.html | المطورون (Consumption Layer) |
| Enterprise | enterprise.html | البنوك، الحكومات، القطاعات الكبرى |
| Pricing | pricing.html | من يريد معرفة التكلفة |
| **About** | about.html | من يريد فهم هوية رؤى |

**التغييرات عن v1:**
- حذف «Platform» (غامض) — استبدل بـ «About» + «Solutions»
- إضافة «Developers» بدل «Access» (أوضح للمطورين)
- إضافة «Solutions» كقسم أول-level

---

## 10. Pricing — فصل في وثيقة مستقلة

**v2 (تطبيق ملاحظة المستخدم):** الأسعار تُفصل في وثيقة مستقلة `PRICING-MODEL.md` لأنها ستتغير أكثر من الهيكل، وقد تختلف حسب السوق.

المعمارية (هذه الوثيقة) تثبّت **البنية التجارية** فقط.
الأسعار (PRICING-MODEL.md) تثبّت **الأرقام** بشكل قابل للتحديث بمعزل عن المعمارية.

---

## 11. ما الذي يبقى (أصول محفوظة من v1 + v20 + v19)

كل ما بُني محفوظ — لا حذف:

**من BUSINESS-ARCHITECTURE-v1.md (v1):**
- الإدراك: News و Trade = Showcase (مثبّت)
- فكرة catalog.html (مثبّتة)
- 24 منتج (مثبّتة)
- Professional Services (موسّعة في v2)
- إضافة قطاعي Media Companies + Research Firms في Enterprise

**من PRODUCT-BIBLE-v1.md (v20):**
- 24 منتج بكل التفاصيل (العميل/المشكلة/القيمة/المكونات/السعر/الرسالة) — تبقى كما هي
- كل منتج = أصل تجاري مستقل

**من PRODUCT-ARCHITECTURE-v1.md (v20):**
- 5 طبقات تقنية (Layer 0/1/2A/2B/3/4) — لا تغيير

**من v19 (الكود والتصميم):**
- نظام التصميم كاملاً (colors/fonts/RTL) — لا تغيير
- Architecture Map، Business Value Layer، Evidence Chain، API Explorer، Deployment Models، Procurement Process — كلها تبقى

---

## 12. هيكل التنفيذ (بعد اعتماد v2)

### المرحلة 1 — تثبيت البنية التجارية v2 (هذه الوثيقة)
### المرحلة 2 — كتابة PRICING-MODEL.md (منفصل)
### المرحلة 3 — تحديث index.html (5-layer Business Architecture)
### المرحلة 4 — إنشاء about.html (الهوية المؤسسية)
### المرحلة 5 — إنشاء catalog.html (نقطة الدخول الرئيسية)
### المرحلة 6 — إنشاء solutions.html + 7 صفحات Solutions
### المرحلة 7 — إنشاء 2 صفحة Business Line Landings (Media + Trading)
### المرحلة 8 — إنشاء developers.html (Consumption Layer landing)
### المرحلة 9 — إعادة توجيه news.html و trade.html كـ Showcase
### المرحلة 10 — إنشاء 16 صفحة منتج فردي (7 Media + 9 Trading)
### المرحلة 11 — تحديث enterprise.html (6 قطاعات)
### المرحلة 12 — إنشاء pricing.html (by Business Line + Solutions + Services)
### المرحلة 13 — إنشاء professional-services.html + 6 صفحات خدمات
### المرحلة 14 — تحديث Navigation الموحّد الجديد

---

## 13. معايير الاعتماد قبل أي HTML

- [ ] اعتماد المعمارية الجديدة: Core → 2 Business Lines → Solutions → Products → Consumption
- [ ] اعتماد Platform Access = Consumption Layer (لا Business Line)
- [ ] اعتماد Solutions Layer (7 Solutions Bundles)
- [ ] اعتماد News و Trade = Showcase
- [ ] اعتماد إنشاء about.html (الهوية المؤسسية)
- [ ] اعتماد إنشاء catalog.html (نقطة الدخول)
- [ ] اعتماد إنشاء solutions.html + 7 Solutions
- [ ] اعتماد 24 منتج موزّعة على Business Lines
- [ ] اعتماد Professional Services الموسّعة (6 خدمات)
- [ ] اعتماد فصل PRICING-MODEL.md عن المعمارية
- [ ] اعتماد Navigation الجديد (9 عناصر)
- [ ] اعتماد 14 مرحلة تنفيذ

---

## 14. المبدأ النهائي

> **رؤى شركة تمتلك مصنعاً، وتبيع أجزاءه بطرق مختلفة.**
>
> العميل يشتري:
> - **Solution** (حل متكامل) — لأعلى قيمة
> - **Product** (منتج مستقل) — لقيمة متوسطة
> - **Access** (استهلاك) — لأقل تكلفة
>
> والمصنع (Core Intelligence Platform) هو الأصل الذي يبني كل ما سبق.
>
> **الموقع يجب أن يعكس هذا التدرج — لا أن يعرض «منصات».**

---

**الحالة:** v2 — بانتظار الاعتماد النهائي قبل أي HTML
**الأساس:** BUSINESS-ARCHITECTURE-v1.md + PRODUCT-BIBLE-v1.md + PRODUCT-ARCHITECTURE-v1.md
**Branch:** `redesign-v20-architecture`
**التاريخ:** يوليو 2026
**Business Lines:** 2 (Media + Trading) + Core + Consumption Layer
**Solutions:** 7 Bundles
**Products:** 24
**Pages:** 27 (6 معدّلة + 21 جديدة)

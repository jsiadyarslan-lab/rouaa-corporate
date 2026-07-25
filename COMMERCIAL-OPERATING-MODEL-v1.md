# ROUAA · Commercial Operating Model (COM) v1

> الوثيقة الموحّدة الأخيرة قبل أي HTML أو Figma.
>
> تجمع كل ما سبق (Architecture + Bible + Business v2 + Pricing) في نموذج تشغيلي واحد متماسك.
>
> تعالج 10 مشاكل بنيوية محدّدة في المراجعة السابقة.
>
> **القاعدة:** لا يُلمس أي HTML حتى تُعتمد هذه الوثيقة. هي الحلقة الأخيرة.

---

## جدول المحتويات

1. [الإصلاحات العشرة (مقدمة)](#1-الإصلاحات-العشرة)
2. [Competitive Positioning](#2-competitive-positioning)
3. [Buyer Personas](#3-buyer-personas)
4. [Customer Journey & Sales Lifecycle](#4-customer-journey--sales-lifecycle)
5. [Commercial Model — الهرم الصحيح](#5-commercial-model--الهرم-الصحيح)
6. [Business Lines & Products](#6-business-lines--products)
7. [Solutions as Packaging (not Layer)](#7-solutions-as-packaging)
8. [Consumption Layer](#8-consumption-layer)
9. [Pricing Rules — موحّدة ومنسجمة](#9-pricing-rules)
10. [Sales Process](#10-sales-process)
11. [Deployment Process](#11-deployment-process)
12. [Support & Customer Success](#12-support--customer-success)
13. [Renewal & Expansion](#13-renewal--expansion)
14. [Catalog Multi-Classification](#14-catalog-multi-classification)
15. [Industry Landings](#15-industry-landings)
16. [Site Map — العضوي](#16-site-map--العضوي)
17. [معايير الاعتماد](#17-معايير-الاعتماد)

---

## 1. الإصلاحات العشرة

| # | المشكلة | الإصلاح في COM v1 |
|---|--------|------------------|
| 1 | Factory = Product تناقض | المصنع لا يباع، لا يظهر في الكاتالوج — فقط في About |
| 2 | Solutions كـ Layer خطأ | Solutions = Packaging (Bundle) — يأتي بعد Products |
| 3 | Developers ≠ Consumption Layer | إعادة التسمية: Platform Access (يشمل White Label/On-Prem) |
| 4 | تضارب أسعار الباقات | توحيد: خصم الباقة = 20% دائماً، حساب رياضي شفاف |
| 5 | هرم تسعير غير واضح | Products → Solutions → Enterprise → Professional Services |
| 6 | لا Lifecycle بيع | 7 مراحل: Discover → Compare → Demo → Trial → Contact → Proposal → Implementation |
| 7 | لا Positioning | خريطة تنافسية ضد Bloomberg/Refinitiv/FactSet/Palantir/Snowflake |
| 8 | Catalog تصنيف واحد | 4 تصنيفات: Industry / Use Case / Product / Technology |
| 9 | لا Industry Landings | 6 صفحات قطاع مستقلة (Banks, Funds, Brokers, Media, Gov, Research) |
| 10 | Page count ثابت | عدد الصفحات عضوي — ينتج طبيعياً من تغطية احتياجات المستخدمين |

---

## 2. Competitive Positioning

### أين تجلس رؤى في السوق؟

```
                  Data  ←————————————→  Intelligence
                   │                       │
        Raw Data   │                       │  Actionable Intelligence
                   │                       │
        ┌──────────┼───────────┬───────────┼──────────┐
        │          │           │           │          │
   Bloomberg    Refinitiv    FactSet    AlphaSense   ROUAA
   Terminal     Eikon        Research   AI Search    ★
                                                     │
                                                     │
                                  ┌──────────────────┤
                                  │                  │
                              Palantir           Snowflake
                              Foundry            AI Data Cloud
                              (Government)       (Infra)
```

### رؤى vs المنافسين

| المنافس | ما يقدّم | أين تتفوّق رؤى (باختلاف الفئة، لا السعر) |
|--------|--------|--------------|
| **Bloomberg Terminal** | بيانات + أخبار + تحليل | رؤى Evidence Chain + AI Council + White Label + عربي أولاً |
| **Refinitiv (LSEG)** | بيانات + APIs | رؤى أبسط تكاملاً + أدلة لكل رقم + Solutions جاهزة |
| **FactSet** | بيانات + تحليل لـصناديق التحوط | رؤى أوسع (إعلام + تداول) + Solutions جاهزة |
| **Morningstar** | بيانات استثمارية + تقييمات | رؤى شامل (ليس أسهماً فقط) + AI Reasoning |
| **AlphaSense** | بحث ذكي بالـ AI | رؤى يشمل التنفيذ (Trading Suite) لا البحث فقط |
| **Dataminr** | تنبيهات من وسائل التواصل | رؤى مصادر رسمية فقط (لا إشاعات) + Evidence |
| **Palantir Foundry** | منصة بيانات للقطاع العام | رؤى مالية متخصصة (لا عامة) + أسرع setup |
| **Snowflake AI** | بنية بيانات سحابية | رؤى جاهزة (لا تبني) + محتوى مالي جاهز |
| **TradingView** | شارت قوي | رؤى Smart Chart + AI Explanation + Bayesian |

### Positioning Statement

> **رؤى تجلس حيث يلتقي Bloomberg بالـ AI — لكن أعمق، أشمل، وأكثر مرونة في النشر.**
>
> **للمنطقة العربية أولاً. للعالم ثانياً.**
>
> ليست بيانات فقط (مثل Refinitiv). ليست بحثاً فقط (مثل AlphaSense). ليست تنفيذاً فقط (مثل TradingView).
> رؤى **منظومة كاملة** — من المصدر الرسمي إلى القرار الموثّق إلى التنفيذ المدقّق.

### ثلاث رسائل positioning للصفحة الرئيسية:

1. **«رؤى تجمع الاستخبارات المالية، الاستدلال بالذكاء الاصطناعي، ومرونة النشر في منظومة واحدة.»**
2. **«من المصدر الرسمي إلى القرار الموثّق — مع دليل في كل خطوة.»**
3. **«للمنطقة العربية أولاً. للعالم ثانياً.»**

**ملاحظة على الـ positioning:** نتجنّب المقارنات السعرية الصريحة («أرخص بـ X%») في الواجهات التسويقية لأنها تخاطرة ما لم يكن لدينا دليل يمكن الدفاع عنه. بدلاً منها نركّز على **اختلاف الفئة** (Category Difference): رؤى تجمع ما لا يجمعه أي منافس — الاستخبارات + الاستدلال + النشر + الأدلة. المقارنات التفصيلية تظهر في صفحات `/compare/*` حيث نشرح الفروقات حسب حالات الاستخدام والقدرات، لا السعر فقط.

---

## 3. Buyer Personas

### Persona 1 — Khalid (CIO, Regional Bank)
- **العمر:** 45-55
- **الدور:** CIO في بنك إقليمي
- **الهدف:** تحديث بنية البيانات البنكية دون بناء فريق هندسي
- **الألم:** Bloomberg يكلّف ملايين، فريق البيانات الداخلي بطيء، المراجع التنظيمي يطالب بأدلة
- **ما يبحث عنه:** Intelligence Platform Licensing + Evidence API + On-Prem
- **المسار:** Enterprise → Solutions → Central Bank Intelligence Solution → Contact Sales

### Persona 2 — Sara (Head of Research, Hedge Fund)
- **العمر:** 35-45
- **الدور:** مديرة الأبحاث في صندوق تحوط
- **الهدف:** إشارات أسرع قبل المنافسين + قابلية مراجعة
- **الألم:** الإشارات البطيئة تفقدها فرصاً، لا تملك سجل أدلة للمراجعة
- **ما تبحث عنه:** Streaming API + AI Council + LASAA + Hedge Fund Solution
- **المسار:** Trading → AI Council → Demo → Trial → Contact Sales

### Persona 3 — Ahmed (CEO, Broker)
- **العمر:** 40-55
- **الدور:** CEO وسيط مالي متوسط
- **الهدف:** قيمة مضافة للعملاء دون بناء فريق
- **الألم:** المنافسون يقدّمون محتوى، هو لا يقدّم. هوامش الربح تنخفض.
- **ما يبحث عنه:** White Label + News Pipeline + Broker Solution
- **المسار:** Solutions → Broker Intelligence → Demo → Proposal

### Persona 4 — Lina (Editor-in-Chief, Financial News Site)
- **العمر:** 35-50
- **الدور:** رئيسة تحرير موقع اقتصادي
- **الهدف:** محتوى مالي يومي عالي الجودة بسعر معقول
- **الألم:** فريق التحرير مكلف، الاعتماد على نسخ Bloomberg/Reuters يقلل التمايز
- **ما تبحث عنه:** News Agency Agent + Newsroom Solution
- **المسار:** Media → News Agency → Demo → Trial → Contact

### Persona 5 — Tariq (CTO, Fintech Startup)
- **العمر:** 30-40
- **الدور:** CTO في فينتك تطلق تطبيق استثمار
- **الهدف:** إطلاق سريع بتكلفة معقولة
- **الألم:** بناء محرّكات معرفة من الصفر مكلف، يحتاج API + SDK + White Label
- **ما يبحث عنه:** Stock Analysis API + Smart Chart SDK + Fintech Solution
- **المسار:** Developers → API → SDK → Fintech Solution → Trial

### Persona 6 — Dr. Fatima (Economic Advisor, Government)
- **العمر:** 45-60
- **الدور:** مستشارة اقتصادية لجهة حكومية
- **الهدف:** استخبارات اقتصادية لتقييم السياسات
- **الألم:** البيانات الحكومية منفصلة عن التحليل، لا يوجد رسم معرفة موحّد
- **ما تبحث عنه:** Intelligence Platform (On-Prem) + Geopolitical Risk + Government Solution
- **المسار:** Enterprise → Government → Contact Sales → Proposal

### Persona 7 — Omar (Independent Trader)
- **العمر:** 25-40
- **الدور:** متداول فردي محترف
- **الهدف:** أدوات احترافية بسعر معقول
- **الألم:** TradingView مكلف، لا يوجد شارت بالعربية، لا مساعد ذكي
- **ما يبحث عنه:** Smart Chart + Scanner + AI Assistant (Individual)
- **المسار:** Trading → Smart Chart → Pricing → Trial → Subscribe

### Persona 8 — Yusuf (Lead Developer, Quant Firm)
- **العمر:** 28-38
- **الدور:** Lead Developer في شركة Quant
- **الهدف:** بيانات + إشارات + تنفيذ سريع عبر API
- **الألم:** APIs متفرقة، لا SDK موحّد، لا دليل لكل إشارة
- **ما يبحث عنه:** Trading Intelligence API + SDK + Streaming + LASAA
- **المسار:** Developers → API → SDK → Documentation → Trial

---

## 4. Customer Journey & Sales Lifecycle

### 7 مراحل لتحويل الزائر إلى عميل:

```
1. DISCOVER
   │  زائر يصل من: بحث Google، إعلان، LinkedIn، إحالة
   │  الصفحات: index.html, about.html
   │  الهدف: فهم «ما هي رؤى؟» في 10 ثوانٍ
   ↓
2. EXPLORE
   │  زائر يتصفح: catalog.html, solutions.html, business line landings
   │  الهدف: يجد المنتج/الحل المناسب
   ↓
3. COMPARE
   │  زائر يقارن: صفحات المنتجات، pricing.html, vs المنافسين
   │  الهدف: يقتنع أن رؤى أفضل من البديل
   ↓
4. DEMO
   │  زائر يطلب: Demo (Form → Calendly)
   │  الصفحة: أي صفحة منتج (CTA: «اطلب Demo»)
   │  الفريق: Sales Engineer يجري الـ Demo (30-60 دقيقة)
   ↓
5. TRIAL  (للأفراد والشركات الصغيرة فقط)
   │  عميل يحاول: Trial مجاني 14 يوم (Smart Chart, Scanner, Assistant)
   │  للمؤسسات: POC محدود بدل Trial
   ↓
6. CONTACT SALES  (للمؤسسات)
   │  عميل يطلب عرضاً: Form → Sales Rep
   │  الفريق: Account Executive + Solutions Architect
   │  المخرج: Proposal مخصّص
   ↓
7. PROPOSAL & IMPLEMENTATION
   │  عميل يوقع عقداً
   │  الفريق: Implementation Team + Customer Success
   │  المدة: 4-12 أسبوع حسب الحل
   ↓
   CUSTOMER (Renewal + Expansion — انظر القسم 13)
```

### كيف يظهر هذا في الموقع؟

كل صفحة منتج تحوي CTAs حسب المرحلة:
- **Discover:** «استكشف الكاتالوج»، «اقرأ عن رؤى»
- **Explore:** «شاهد Solutions»، «قارن الباقات»
- **Compare:** «قارن مع Bloomberg»، «عرض التسعير»
- **Demo:** «اطلب Demo» (Form)
- **Trial:** «ابدأ تجربة مجانية» (للأفراد فقط)
- **Contact Sales:** «تحدث مع المبيعات» (Form)
- **Implementation:** يحدث بعد التوقيع (صفحة onboarding منفصلة)

---

## 5. Commercial Model — الهرم الصحيح

### v2 (خطأ): Business Lines → Solutions → Products → Consumption
### COM v1 (صحيح):

```
┌────────────────────────────────────────────────┐
│  LAYER 0: ROUAA (Company)                      │  ← Who we are (about.html)
│  «Financial Intelligence Infrastructure»        │
└────────────────────┬───────────────────────────┘
                     │
┌────────────────────▼───────────────────────────┐
│  LAYER 1: Factory (لا يباع، لا يظهر في Catalog)│  ← Internal only
│  Core Intelligence Platform (the engine)       │     Mentioned in About
└────────────────────┬───────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐ ┌──────────────▼───────────┐
│  LAYER 2A:     │ │  LAYER 2B:               │  ← Business Lines
│  Media         │ │  Trading                 │     (the 2 companies)
│  Technologies  │ │  Technologies            │
└───────┬────────┘ └──────────────┬───────────┘
        │                         │
        └────────────┬────────────┘
                     │
┌────────────────────▼───────────────────────────┐
│  LAYER 3: Products (24 مستقلة)                 │  ← What we sell
│  (في catalog.html)                              │     (each has own page)
└────────────────────┬───────────────────────────┘
                     │
┌────────────────────▼───────────────────────────┐
│  LAYER 4: Solutions (Packaging — Bundles)      │  ← How we package
│  (في solutions.html)                            │     (7 industry bundles)
└────────────────────┬───────────────────────────┘
                     │
┌────────────────────▼───────────────────────────┐
│  LAYER 5: Consumption (Access Methods)         │  ← How you consume
│  API · SDK · White Label · Cloud · On-Prem     │     (developers.html)
└────────────────────┬───────────────────────────┘
                     │
┌────────────────────▼───────────────────────────┐
│  LAYER 6: Pricing (Rules + Tiers)              │  ← How you pay
│  (في pricing.html + PRICING-MODEL.md)          │
└────────────────────┬───────────────────────────┘
                     │
┌────────────────────▼───────────────────────────┐
│  LAYER 7: Professional Services                │  ← How we help
│  Implementation · Migration · Training · ...   │     (professional-services.html)
└─────────────────────────────────────────────────┘
```

### الفرق الجوهري عن v2:

| v2 (خطأ) | COM v1 (صحيح) |
|---------|---------------|
| Core = Factory = Product (تناقض) | Factory لا يباع، يظهر في About فقط |
| Solutions = Layer بين Business و Products | Solutions = Packaging بعد Products |
| Consumption = Layer موازٍ | Consumption = Layer تحت Products/Solutions |
| Pricing مدمج | Pricing Layer مستقل |

---

## 6. Business Lines & Products

### Core Intelligence Platform (Factory — لا يباع)

**يظهر فقط في `about.html`** كـ «المصنع» الذي ينتج كل شيء.

| المكون | الوظيفة |
|--------|------|
| Official Sources | 411 مصدر رسمي مراقب 24/7 |
| Source Registry | فهرسة كاملة |
| Data Quality | مراقبة صحة |
| Provenance Storage | تخزين الأصل الموثّق |
| Document Intelligence | PDF ← بيانات مهيكلة |
| Fact Engine | استخراج NLP |
| Evidence Engine | ربط كل حقيقة بمصدرها |
| Event Engine | تصنيف وربط الأحداث |
| Knowledge Graph | شبكة العلاقات المالية |
| AI Research | 10 أدوار استدلال |
| AI Council | مجلس استدلال للقرارات المعقدة |
| Risk Engine | تقييم المخاطر |
| Market Intelligence | استنتاج التأثيرات السوقية |

**هذا المصنع يولّد المنتجات. لا يباع منفرداً.**

### Business Line 1 · Media Technologies (7 منتجات)

| # | المنتج | الصفحة | Individual | Pro | Enterprise |
|---|--------|------|------|-----|-----------|
| 1 | News Agency Agent | `/news-agency` | — | $10K/mo | $20K/mo |
| 2 | News Pipeline | `/news-pipeline` | $1K/mo | $5K/mo | $10K/mo |
| 3 | Reports Pipeline | `/reports-pipeline` | $5K/mo | $25K/mo | $50K/mo |
| 4 | Video Pipeline | `/video-pipeline` | — | $10K/mo | Custom |
| 5 | Infographic Pipeline | `/infographic-pipeline` | $3K/mo | $8K/mo | Custom |
| 6 | Stock Analysis Pipeline | `/stock-analysis` | — | $15K/mo | Custom |
| 7 | Geopolitical Risk Pipeline | `/geopolitical-risk` | — | $10K/mo | Custom |

**Showcase:** `news.html` (يعرض ما ينتجه المصنع — ليس منتجاً)

### Business Line 2 · Trading Technologies (9 منتجات)

| # | المنتج | الصفحة | Individual | Pro | Institutional |
|---|--------|------|------|-----|--------------|
| 1 | AI Council | `/ai-council` | — | $1K/mo | $5K+/mo |
| 2 | Executors (Smart + Autonomous) | `/executors` | included | included | included |
| 3 | LASAA | `/lasaa` | — | — | $25K+/mo |
| 4 | Smart Chart Intelligence | `/smart-chart` | $99/mo | $499/mo | $5K/mo |
| 5 | Advanced Scanner | `/scanner` | $99/mo | $499/mo | $3K/mo |
| 6 | Predictive Markets | `/prediction-markets` | — | $500/mo | $2K+/mo |
| 7 | Portfolio Intelligence | `/portfolio` | included | included | included |
| 8 | AI Trading Assistant | `/ai-assistant` | $49/mo | $499/mo | $2K/mo |
| 9 | Execution Bridge (MT5) | `/execution-bridge` | — | $1K/mo | $10K/mo |

**Showcase:** `trade.html` (يعرض محركات القرار في عمل — ليس منتجاً)

**ملاحظة على Trading Suite Bundle:**
- Individual Suite = $199/mo (Smart Chart + Scanner + Assistant — قيمة فردية: $247 → خصم 20%)
- Pro Suite = $1,500/mo (Smart Chart Pro + Scanner Pro + Assistant Pro + AI Council + Executors + Portfolio — قيمة فردية: $2,497 → خصم 40% للباقة الكاملة)
- Institutional Suite = $20K+/mo — Contact Sales

### Consumption Layer (5 طرق وصول — تعبر كل المنتجات)

| # | طريقة الوصول | الصفحة | السعر |
|---|------------|------|------|
| 1 | Financial Intelligence API | `/developers#financial-api` | $1K — Enterprise/mo |
| 2 | Trading Intelligence API | `/developers#trading-api` | $3K+ /mo |
| 3 | Content API | `/developers#content-api` | $2K — $8K/mo |
| 4 | Streaming API | `/developers#streaming-api` | $2K+ /mo |
| 5 | SDK | `/developers#sdk` | مجاني مع أي API |
| 6 | White Label | `/white-label` | $25K+ /mo + $50K-$200K setup |
| 7 | On-Premise Deployment | `/deployment#on-prem` | Custom ($500K+/yr) |
| 8 | Cloud SaaS Deployment | `/deployment#cloud` | مضمّن في الاشتراك |
| 9 | Private Cloud Deployment | `/deployment#private` | +30% على الاشتراك |
| 10 | Hybrid Deployment | `/deployment#hybrid` | Custom |

---

## 7. Solutions as Packaging

**v2 (خطأ):** Solutions كـ Layer بين Business و Products
**COM v1 (صحيح):** Solutions = Bundles تأتي بعد Products — Packaging فقط

### 7 Solutions Bundles (بحساب رياضي شفاف)

لكل Solution: مجموع أسعار المكونات − 20% خصم الباقة = سعر Solution

| Solution | المكونات | مجموع فردي | خصم 20% | سعر Solution |
|---------|--------|-----------|---------|-------------|
| **Newsroom** | News Agency Pro + News Pipeline Pro + Reports Pipeline Pro + Video Pipeline Pro + Implementation | $50K/mo + $50K setup | 20% | **$40K/mo + $50K setup** |
| **Central Bank Intelligence** | Intelligence Platform On-Prem + Reports Pipeline Enterprise + Geopolitical Risk Enterprise + API + Training + Advisory | $1.2M/yr + $100K setup | 20% | **$960K/yr ($80K/mo) + $100K setup** |
| **Broker Intelligence** | White Label + Trading Suite Institutional + News Pipeline Pro + Onboarding | $45K/mo + $100K setup | 20% | **$36K/mo + $100K setup** |
| **Hedge Fund Trading** | AI Council Institutional + LASAA + Smart Chart Institutional + Streaming API + Implementation | $75K/mo + $75K setup | 20% | **$60K/mo + $75K setup** |
| **Government Policy** | Intelligence Platform On-Prem + Geopolitical Risk Enterprise + Reports Pipeline Enterprise + Advisory | $1.5M/yr + $150K setup | 20% | **$1.2M/yr ($100K/mo) + $150K setup** |
| **Fintech Investment App** | Stock Analysis Pro + News API Pro + Smart Chart SDK Pro + White Label + Implementation | $31K/mo + $50K setup | 20% | **$25K/mo + $50K setup** |
| **Custom Solutions** | حسب الطلب | — | — | حسب العقد |

**قاعدة الخصم الموحّدة:**
- Bundle من 2-3 منتجات: خصم 15%
- Bundle من 4-5 منتجات: خصم 20%
- Bundle من 6+ منتجات: خصم 25%
- Solutions الجاهزة: دائماً 20% (لأنها مُحزّمة مسبقاً)

---

## 8. Consumption Layer

**التسمية:** `Platform Access` (ليس Developers — Developers subset فقط)

**السبب:** White Label و On-Prem ليست للمطورين — هي Enterprise Sales.

### Structure of `/developers.html` (Platform Access Landing)

```
Platform Access
├── For Developers
│   ├── APIs (Financial / Trading / Content / Streaming)
│   ├── SDK (5 languages)
│   └── Documentation
│
├── For Enterprises
│   ├── White Label
│   ├── On-Premise Deployment
│   ├── Private Cloud
│   └── Hybrid
│
└── For All
    ├── Cloud SaaS (default)
    └── Authentication (OAuth, SSO, JWT)
```

---

## 9. Pricing Rules

### الهرم الموحّد للتسعير:

```
Pricing Pyramid (from bottom to top):

1. INDIVIDUAL PRODUCTS (Per Product)
   - Single product, single user
   - Example: Smart Chart $99/mo
   - Public prices, self-service

2. PROFESSIONAL PRODUCTS (Per Product)
   - Single product, team use
   - Example: Smart Chart Pro $499/mo
   - Public prices, self-service

3. PRODUCT BUNDLES (Per Business Line)
   - Multiple products from one Business Line
   - Example: Trading Suite Pro $1,500/mo (40% off individual)
   - Public prices, self-service

4. SOLUTIONS (Per Industry)
   - Bundle across Business Lines + Services
   - Example: Newsroom Solution $40K/mo (20% off components)
   - Public "starting from", contact sales

5. ENTERPRISE LICENSING (Per Contract)
   - Custom contract, multi-product, multi-year
   - Example: Central Bank $960K/yr
   - Private pricing, sales-led

6. PROFESSIONAL SERVICES (Per Engagement)
   - One-time or recurring services
   - Example: Implementation $25K-$200K
   - Public ranges, sales-led
```

### قواعد التسعير الموحّدة:

| القاعدة | التفاصيل |
|--------|--------|
| خصم الباقة | 15% (2-3 products) / 20% (4-5) / 25% (6+) |
| خصم سنوي | 15% على العقود السنوية (vs شهري) |
| خصم Solutions | دائماً 20% (مُحزّمة مسبقاً) |
| Startup Program | خصم 30% للشركات الناشئة (case-by-case) |
| Government | خصم 20% للعقود متعددة السنوات |
| Setup Fee | مطلوب للـ White Label + On-Prem + Solutions |
| Minimum Contract | 12 شهر للمؤسسات، شهري للأفراد |

### ما يُعرض على الموقع (pricing.html):

| المستوى | يُعرض |
|--------|------|
| Individual | ✅ سعر كامل |
| Professional | ✅ سعر كامل |
| Bundles | ✅ سعر + «Save X%» |
| Solutions | ✅ «Starting from $X» + Contact Sales |
| Enterprise | ❌ «Contact Sales» فقط |
| Professional Services | ✅ «Starting from $X» |

---

## 10. Sales Process

### Process Map:

```
LEAD GENERATION
│
├── Inbound (Website + Forms)
│   ├── Demo Request → Sales Engineer (24h)
│   ├── Trial Signup → Auto-onboarding (instant)
│   ├── Pricing Inquiry → Account Executive (24h)
│   └── Contact Sales → Account Executive (4h)
│
├── Outbound (Sales Team)
│   ├── Target Accounts → Cold Outreach
│   ├── Events + Conferences → Lead Capture
│   └── Partnerships → Referral
│
└── Partner Channel
    ├── System Integrators
    ├── Technology Partners
    └── Resellers

DISCOVERY (Week 1)
├── Qualification Call (30 min)
├── Needs Assessment
├── Budget + Authority + Timeline
└── Persona + Use Case Identification

DEMO (Week 1-2)
├── Custom Demo (60 min)
├── Sandbox Access
├── Technical Q&A
└── Fit Assessment

PROPOSAL (Week 2-3)
├── Solution Design
├── Pricing + Terms
├── Implementation Plan
├── SLA + Contract
└── Legal Review

POC / TRIAL (Week 3-6)
├── For Enterprise: POC (4-6 weeks)
├── For Pro: Trial (14 days)
└── Success Criteria Defined

NEGOTIATION (Week 6-8)
├── Final Pricing
├── Contract Terms
├── Sign-off
└── Procurement

CLOSE (Week 8)
├── Contract Signed
├── Kickoff Scheduled
└── Implementation Begins
```

### Sales Team Roles:

| Role | مسؤول عن |
|------|--------|
| SDR (Sales Development Rep) | Lead qualification, demo booking |
| Account Executive | Proposal, negotiation, close |
| Sales Engineer | Technical demo, POC, technical Q&A |
| Solutions Architect | Solution design, custom architecture |
| Customer Success Manager | Post-sale onboarding, renewal, expansion |

---

## 11. Deployment Process

### Process per Deployment Type:

**Cloud SaaS (Weeks 1-2):**
1. Account provisioning
2. API keys + SDK access
3. Integration guide
4. Training session (2h)
5. Go-live

**Private Cloud (Weeks 2-4):**
1. Infrastructure setup
2. Data migration
3. Integration
4. Testing
5. Training (1 day)
6. Go-live

**On-Premise (Weeks 6-12):**
1. Requirements gathering
2. Architecture design
3. Infrastructure prep (client side)
4. Installation
5. Configuration + Customization
6. Integration with internal systems
7. Testing (UAT)
8. Training (3-5 days)
9. Go-live
10. Handoff to Support

**Hybrid (Weeks 8-16):**
- Combination of above

### Deliverables per Phase:

| Phase | Deliverable |
|------|------------|
| Discovery | Solution Architecture Document |
| Design | Implementation Plan + Timeline |
| Build | Configured System + Documentation |
| Test | UAT Report + Sign-off |
| Deploy | Live System + Monitoring |
| Train | Training Materials + Recorded Sessions |
| Handoff | Support Runbook + Account Manager |

---

## 12. Support & Customer Success

### Support Tiers:

| Tier | السعر | المُضمَّن |
|------|------|------|
| Standard | مضمّن | Email, 24h response, business hours |
| Pro | +$2K/mo | Email + Chat, 4h response, 24/7 |
| Enterprise | +$10K/mo | Dedicated CSM, 1h response, 24/7, Slack channel |
| Premium | Custom | On-site support, 15min response, dedicated team |

### Customer Success Framework:

```
ONBOARDING (Weeks 1-4)
├── Welcome kit
├── Kickoff meeting
├── Implementation plan
├── Training sessions
└── First value milestone

ADOPTION (Months 1-3)
├── Weekly check-ins
├── Usage analytics review
├── Training reinforcement
├── Feature adoption tracking
└── QBR (Quarterly Business Review) prep

VALUE REALIZATION (Months 3-6)
├── ROI assessment
├── Use case expansion
├── Advanced training
├── Best practices sharing
└── Reference customer program

EXPANSION (Months 6-12)
├── Upsell opportunities
├── Cross-sell to other teams
├── Solution expansion
├── Multi-product adoption
└── Renewal preparation

RENEWAL (Month 11-12)
├── Renewal proposal
├── Contract negotiation
├── Expansion discussion
└── Multi-year conversion
```

---

## 13. Renewal & Expansion

### Renewal Metrics:

| المؤشر | الهدف |
|--------|------|
| Net Revenue Retention | 110%+ |
| Gross Revenue Retention | 90%+ |
| Renewal Rate | 95%+ |
| Expansion Rate | 25%+ |

### Expansion Plays:

1. **Product Expansion:** العميل يضيف منتج من Business Line أخرى
2. **User Expansion:** العميل يزيد عدد المستخدمين
3. **Volume Expansion:** العميل يزيد استهلاك API
4. **Solution Upgrade:** العميل ينتقل من Product إلى Solution
5. **Deployment Upgrade:** العميل ينتقل من Cloud إلى Private/On-Prem

### Renewal Process:

```
Month 9: Health Check
├── Usage analysis
├── Satisfaction survey
├── Risk assessment
└── Expansion opportunity identification

Month 10: Renewal Proposal
├── Pricing options
├── Multi-year incentive
├── Expansion proposal
└── Custom terms

Month 11: Negotiation
├── Terms discussion
├── Legal review
├── Sign-off
└── Procurement

Month 12: Renewal Close
├── Contract signed
├── New term begins
├── Expansion implemented
└── CSM handoff
```

---

## 14. Catalog Multi-Classification

### 4 تصنيفات للكاتالوج (مثل AWS/Azure):

### Classification 1 — By Business Line

```
Media Technologies (7 products)
Trading Technologies (9 products)
Platform Access (8 methods)
```

### Classification 2 — By Industry

```
Banks (8 products)
Hedge Funds (6 products)
Brokers (5 products)
Media Companies (7 products)
Governments (4 products)
Research Firms (5 products)
```

### Classification 3 — By Use Case

```
Get Market Intelligence (5 products)
Produce Content (4 products)
Make Trading Decisions (6 products)
Execute Trades (3 products)
Manage Risk (3 products)
Build Custom Solutions (3 products)
```

### Classification 4 — By Technology

```
AI / Machine Learning (4 products)
Real-time / Streaming (3 products)
APIs / SDK (5 products)
On-Premise / Private (3 products)
White Label (2 products)
```

### Catalog UX:

```
catalog.html
│
├── Search bar (top)
│
├── Filter sidebar (left)
│   ├── By Business Line (3 checkboxes)
│   ├── By Industry (6 checkboxes)
│   ├── By Use Case (6 checkboxes)
│   └── By Technology (6 checkboxes)
│
├── View tabs (top)
│   ├── By Business Line (default)
│   ├── By Industry
│   ├── By Use Case
│   └── By Technology
│
└── Product grid (main)
    Each card:
    - Product name (AR + EN)
    - Tag (Business Line)
    - One-line description
    - "Starting from $X"
    - "Learn more →"
```

---

## 15. Industry Landings

### 6 صفحات قطاع مستقلة (ليست sections في Enterprise):

```
/industries/banks
/industries/hedge-funds
/industries/brokers
/industries/media-companies
/industries/governments
/industries/research-firms
```

### قالب صفحة القطاع:

1. **Hero:** اسم القطاع + السؤال الذي يجيب عنه
2. **التحديات:** ما يعانيه هذا القطاع
3. **الحلول:** Solutions المناسبة + Products المناسبة
4. **Use Cases:** 3-5 سيناريوهات حقيقية
5. **Case Studies:** (إن وُجدت)
6. **Deployment:** نموذج النشر المناسب
7. **Pricing:** «Starting from $X»
8. **CTA:** «تحدث مع خبير قطاعي»

### مثال — `/industries/banks`:

```
Hero: «للبنوك: قرارات ائتمان مدعومة بأدلة كاملة»

التحديات:
- لوائح امتثال صارمة
- لجان مخاطر تطالب بأدلة
- أنظمة قديمة لا تتكامل
- فريق بيانات محدود

الحلول:
- Central Bank Intelligence Solution
- Evidence API
- Intelligence Platform (On-Prem)
- Reports Pipeline

Use Cases:
1. قرارات ائتمان موثّقة
2. مراجعة تنظيمية سريعة
3. تقارير مخاطر تلقائية
4. تكامل مع أنظمة البنك

Deployment: On-Premise أو Hybrid

Pricing: «يبدأ من $80K شهرياً — Contact Sales»

CTA: «تحدث مع خبير مصرفي»
```

---

## 16. Site Map — العضوي

عدد الصفحات **عضوي** — ينتج طبيعياً من تغطية احتياجات المستخدمين. لا هدف ثابت.

### الصفحات (تقديرية — تنتج من التصميم):

```
=== IDENTITY (5 pages) ===
index.html (Home)
about.html (Who We Are — الشركة + Factory concept)
careers.html (الوظائف)
contact.html (تواصل)
legal.html (الشروط + الخصوصية)

=== DISCOVERY (3 pages) ===
catalog.html (Solutions Catalog — multi-classification)
solutions.html (Solutions Bundles landing)
pricing.html (Pricing by tier)

=== BUSINESS LINES (2 landings + 16 products = 18 pages) ===
media-technologies.html (BL1 landing)
  ├── news-agency.html
  ├── news-pipeline.html
  ├── reports-pipeline.html
  ├── video-pipeline.html
  ├── infographic-pipeline.html
  ├── stock-analysis.html
  └── geopolitical-risk.html

trading-technologies.html (BL2 landing)
  ├── ai-council.html
  ├── executors.html
  ├── lasaa.html
  ├── smart-chart.html
  ├── scanner.html
  ├── prediction-markets.html
  ├── portfolio.html
  ├── ai-assistant.html
  └── execution-bridge.html

=== SOLUTIONS (7 pages) ===
solutions/newsroom.html
solutions/central-bank.html
solutions/broker.html
solutions/hedge-fund.html
solutions/government.html
solutions/fintech.html
solutions/custom.html

=== INDUSTRIES (7 pages) ===
industries.html (landing)
industries/banks.html
industries/hedge-funds.html
industries/brokers.html
industries/media-companies.html
industries/governments.html
industries/research-firms.html

=== PLATFORM ACCESS (6 pages) ===
developers.html (landing — Platform Access)
api.html (Financial / Trading / Content / Streaming)
sdk.html
white-label.html
deployment.html (Cloud / Private / On-Prem / Hybrid)
security.html (الأمان + Compliance)

=== SHOWCASES (2 pages) ===
news.html (Showcase — ليس منتج)
trade.html (Showcase — ليس منتج)

=== PROFESSIONAL SERVICES (7 pages) ===
professional-services.html (landing)
services/implementation.html
services/migration.html
services/training.html
services/managed-operations.html
services/advisory.html
services/custom-ai.html

=== RESOURCES (5+ pages) ===
resources.html (landing)
docs.html (Documentation)
case-studies.html (قصص نجاح)
blog.html (المدونة)
trust.html (مركز الثقة)

=== COMPARE (3+ pages) ===
compare.html (landing)
compare/bloomberg.html
compare/refinitiv.html
compare/factset.html
```

**إجمالي تقديري:** 50-60 صفحة (عضوي — قد ينمو)

**ليس هدفاً ثابتاً.** الهدف: تغطية كل Persona وكل Journey stage.

---

## 17. معايير الاعتماد

### الإصلاحات العشرة:

- [ ] **1. Factory ≠ Product:** المصنع لا يباع، يظهر في About فقط
- [ ] **2. Solutions = Packaging:** ليست Layer، بل Bundle بعد Products
- [ ] **3. Platform Access:** (ليس Developers) يشمل White Label/On-Prem
- [ ] **4. توحيد التسعير:** خصم الباقة = 20% دائماً، حساب شفاف
- [ ] **5. هرم تسعير واضح:** Products → Bundles → Solutions → Enterprise → Services
- [ ] **6. Customer Journey:** 7 مراحل (Discover → Implementation)
- [ ] **7. Competitive Positioning:** خريطة ضد Bloomberg/Refinitiv/FactSet/Palantir/Snowflake
- [ ] **8. Catalog Multi-Classification:** 4 تصنيفات (Industry/UseCase/Product/Tech)
- [ ] **9. Industry Landings:** 6 صفحات قطاع مستقلة
- [ ] **10. Page count عضوي:** 50-60 صفحة، لا هدف ثابت

### Personas & Journey:

- [ ] **8 Buyer Personas** محدّدة
- [ ] **7-stage Customer Journey** مدمج في كل صفحة

### Commercial Model:

- [ ] **7 Layers:** Company → Factory → Business Lines → Products → Solutions → Consumption → Pricing → Services
- [ ] **24 Products** موزّعة على 2 Business Lines
- [ ] **7 Solutions** بحساب رياضي شفاف (20% خصم)
- [ ] **8 Consumption Methods** في Platform Access
- [ ] **6 Professional Services**

### Sales & Operations:

- [ ] **Sales Process** 8 أسابيع (Discovery → Close)
- [ ] **Deployment Process** حسب النوع (Cloud/Private/On-Prem/Hybrid)
- [ ] **Support Tiers** 4 (Standard/Pro/Enterprise/Premium)
- [ ] **Customer Success Framework** 5 مراحل (Onboarding → Renewal)
- [ ] **Renewal & Expansion** metrics + process

### Site Structure:

- [ ] **5 Identity pages** (Home, About, Careers, Contact, Legal)
- [ ] **3 Discovery pages** (Catalog, Solutions, Pricing)
- [ ] **18 Business Line pages** (2 landings + 16 products)
- [ ] **7 Solution pages**
- [ ] **7 Industry pages** (1 landing + 6 industries)
- [ ] **6 Platform Access pages**
- [ ] **2 Showcase pages** (News, Trade)
- [ ] **7 Professional Services pages**
- [ ] **5+ Resources pages** (Docs, Case Studies, Blog, Trust)
- [ ] **3+ Compare pages** (vs Bloomberg, Refinitiv, FactSet)

---

## 18. المبدأ النهائي

> **رؤى ليست موقعاً. رؤى شركة.**
>
> الموقع يجب أن يعكس كيف تعمل الشركة: كيف تجذب عملاء، كيف تبيع، كيف تنشر، كيف تدعم، كيف تجدّد، كيف تتوسّع.
>
> كل صفحة لها دور في هذه الرحلة. لا صفحة «للتزيين».
>
> **COM v1 يثبّت هذا. التالي: تنفيذ مباشر.**

---

**الحالة:** v1 — بانتظار الاعتماد النهائي قبل أي HTML
**الأساس:** BUSINESS-ARCHITECTURE-v2.md + PRODUCT-BIBLE-v1.md + PRODUCT-ARCHITECTURE-v1.md + PRICING-MODEL.md
**Branch:** `redesign-v20-architecture`
**التاريخ:** يوليو 2026
**Personas:** 8
**Customer Journey stages:** 7
**Commercial Layers:** 8
**Products:** 24
**Solutions:** 7
**Industries:** 6
**Consumption Methods:** 8
**Professional Services:** 6
**Pages (estimated):** 50-60 (عضوي)

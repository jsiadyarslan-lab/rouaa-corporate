# ROUAA · Business Architecture v1

> الوثيقة الأم — تثبّت **نموذج الأعمال** قبل **نموذج المنتج**.
>
> كل محاولة سابقة فشلت لأنها قسّمت المنتجات دون أن تقسّم خطوط الأعمال.
> هذه الوثيقة تعلن: رؤى ليست 4 عائلات منتجات. رؤى **3 شركات + طبقة وصول**، تشترك في نفس المصنع.
>
> **القاعدة:** لا يُلمس أي HTML حتى تُعتمد هذه الوثيقة. هي الحلقة المفقودة.

---

## 1. الإدراك الجوهري

ما تملكه رؤى فعلياً ليس 4 عائلات منتجات متساوية. بل:

```
3 شركات مختلفة + 1 طبقة وصول
            تشترك في نفس المصنع
```

والأهم — وهذا ما أغفلناه طوال السنة:

> **News و Trade ليسا منتجات.**
>
> **News و Trade هما Showcase فقط — يعرضان ما يستطيع المصنع إنتاجه.**
>
> **المنتجات الحقيقية هي Pipelines وEngines — تُباع منفردة، والعميل قد لا يدخل News أو Trade إطلاقاً.**

---

## 2. الطبقة التجارية الجديدة (Layer 3 — Commercial Businesses)

الطبقة لم تعد «4 عائلات منتجات». أصبحت **4 خطوط أعمال**:

```
Layer 3 — Commercial Businesses

├── Business Line 1 · Intelligence Platform
│      Enterprise Licensing
│      (المصنع نفسه — للبنوك والحكومات)
│
├── Business Line 2 · Media Technologies
│      7 منتجات SaaS مستقلة
│      News = Showcase فقط (ليس منتج)
│
├── Business Line 3 · Trading Technologies
│      10 منتجات مستقلة
│      Trade = Showcase فقط (ليس منتج)
│
└── Business Line 4 · Platform Access
       APIs · SDK · White Label
       (طرق استهلاك المصنع)
```

**الفرق الجوهري عن v20:**
- v20: كتبنا «Products» أولاً (المنتج قبل الشركة)
- v21: نكتب «Businesses» أولاً (الشركة قبل المنتج)

> العميل يشتري حلاً من **خط أعمال معين**، ثم يختار المنتج.
>
> لا يدخل «منصة News» ليشتري «News Pipeline» — بل يدخل Media Technologies، يختار Pipeline، ويدفع.

---

## 3. ما الذي تغيّر جذرياً عن v20؟

### تغيير 1 — News و Trade لم يعودا منتجات

| v20 (خطأ) | v21 (صحيح) |
|----------|----------|
| `news.html` = منتج | `news.html` = Showcase فقط — يعرض ما ينتجه المصنع |
| `trade.html` = منتج | `trade.html` = Showcase فقط — يشرح كيف تستخدم محركات القرار |
| المنتجات داخل News/Trade | المنتجات مستقلة داخل Business Line |

### تغيير 2 — القسمة من «عائلات» إلى «خطوط أعمال»

| v20 | v21 |
|-----|-----|
| 3A Intelligence Platform Licensing | **Business Line 1 · Intelligence Platform** |
| 3B Media Intelligence Suite | **Business Line 2 · Media Technologies** |
| 3C Trading Intelligence Suite | **Business Line 3 · Trading Technologies** |
| 3D APIs + White Label | **Business Line 4 · Platform Access** |

### تغيير 3 — صفحة Solutions Catalog (جديدة كلياً)

الصفحة التي لم تكن موجودة في أي نسخة سابقة. تشبه كتالوج AWS / Microsoft / Bloomberg:
- كل المنتجات الـ 24 في صفحة واحدة
- مقسّمة حسب خطوط الأعمال
- كل بطاقة: المنتج + لمن + المشكلة + نوع الترخيص + «يبدأ من...» + «اعرف المزيد»

هذه هي **نقطة الدخول** إلى كل المنتجات — وليست الصفحة الرئيسية.

### تغيير 4 — صفحة Pricing أعيد هيكلتها حسب خط الأعمال

```
Pricing

├── Intelligence Licensing
├── Media Products
├── Trading Products
├── API Usage
├── White Label
└── Professional Services (NEW)
```

**Professional Services** رافد إيراد جديد (لم يكن في v20):
- Implementation Services
- Custom Training
- On-site Support
- Migration Assistance
- Strategic Consulting

---

## 4. كل منتج = أصل تجاري مستقل

هذا أهم مبدأ في v21:

> **كل Pipeline وكل Engine هو SaaS مستقل قابل للبيع منفرداً — ليس ميزة داخل منصة.**

العميل قد يشتري:
- News Pipeline فقط — دون الدخول لمنصة News
- LASAA فقط — دون الدخول لمنصة Trade
- Reports Pipeline فقط — دون أي منتج آخر

كل منتج له:
- صفحة بيع مستقلة
- تسعير مستقل
- عقد مستقل
- onboarding مستقل

---

## 5. خريطة الموقع الجديدة (Site Map — v21)

```
index.html (Home — Layer 0 + 5-layer overview + 4 Business Lines)
│
├── catalog.html (Solutions Catalog — كل الـ 24 منتج) ★ NEW
│
├── intelligence-platform.html (Business Line 1 landing)
│   ├── /deployment (Cloud / Private / On-Prem / Hybrid)
│   └── /licensing
│
├── media-technologies.html (Business Line 2 landing) ★ renamed from media-intelligence
│   ├── news-agency.html
│   ├── news-pipeline.html
│   ├── reports-pipeline.html
│   ├── video-pipeline.html
│   ├── infographic-pipeline.html
│   ├── stock-analysis.html
│   └── geopolitical-risk.html
│
├── trading-technologies.html (Business Line 3 landing) ★ renamed from trading-intelligence
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
├── platform-access.html (Business Line 4 landing) ★ NEW
│   ├── api.html
│   ├── sdk.html
│   └── white-label.html
│
├── news.html (Showcase — ليس منتج) ★ repurposed
├── trade.html (Showcase — ليس منتج) ★ repurposed
│
├── enterprise.html (Layer 4 — حلول قطاعية)
│   └── (#security section)
│
└── pricing.html (by Business Line) ★ restructured
```

**إجمالي:** 24 صفحة (6 حالية معدّلة + 18 صفحة جديدة)

---

## 6. دور كل صفحة في النموذج الجديد

### index.html (Home)
- تبيع الرؤية + 4 خطوط أعمال (لا تبيع منتجاً)
- شارة واحدة لكل Business Line مع عدد المنتجات
- رابطان رئيسيان: «استكشف الكاتالوج» + «تواصل مع المبيعات»

### catalog.html (Solutions Catalog) — **نقطة الدخول الرئيسية**
- 24 منتج في صفحة واحدة
- مقسّم 4 أقسام (Business Lines)
- كل بطاقة: اسم + لمن + مشكلة + نوع الترخيص + «يبدأ من $X» + زر
- فلترة: حسب القطاع / حسب السعر / حسب Business Line
- **هذه الصفحة تحلّ مشكلة «أين أجد ما أحتاج؟»**

### صفحات Business Lines (4 صفحات landing)
كل صفحة:
- Hero: اسم الخط + السؤال الذي يجيب عنه
- المنتجات في شبكة بطاقات (معاينات فقط — التفاصيل في صفحات المنتجات)
- باقات المبيعات
- رابط للكاتالوج

### صفحات المنتجات الفردية (18 صفحة)
قالب موحّد:
1. المشكلة
2. الحل
3. كيف يعمل
4. المكونات التقنية
5. القدرات
6. Demo
7. من يستخدمه
8. التسعير
9. CTA

### news.html و trade.html (Showcase فقط — ليست منتجات)
- تشرح ما يستطيع المصنع إنتاجه
- تربط بالمنتجات الفعلية في Business Line المناسبة
- مثال: news.html يعرض News Pipeline + Reports Pipeline في عمل — مع روابط شراء كل واحد منفرداً
- مثال: trade.html يعرض AI Council + Smart Executor في عمل — مع روابط شراء كل واحد منفرداً

### enterprise.html (Layer 4)
- 6 قطاعات (مع إضافة Media Companies + Research Firms)
- لكل قطاع: الحاجة + المنتجات المناسبة + Deployment + Outcome
- رابط مباشر للكاتالوج المُفلتر حسب القطاع

### pricing.html (by Business Line)
- 6 أقسام: Intelligence Licensing / Media Products / Trading Products / API Usage / White Label / Professional Services
- لكل منتج: باقة + سعر + ما المُضمَّن
- الأفراد: أسعار معلنة
- المؤسسات: «Enterprise Pricing — Contact Sales»

---

## 7. خطوط الأعمال — التفصيل النهائي

### Business Line 1 · Intelligence Platform (المصنع)

**السوق:** البنوك المركزية، البنوك التجارية الكبرى، صناديق الثروة السيادية، الجهات الحكومية
**الإيراد:** Enterprise Licensing (عقود سنوية تبدأ من $500K)
**المنتجات:**
1. Intelligence Platform (Cloud SaaS)
2. Intelligence Platform (On-Premise)
3. Intelligence Platform (Hybrid)

**الرسالة:** «لا تبني محرّكات معرفة من الصفر — استلم المصنع جاهزاً.»

### Business Line 2 · Media Technologies (مصانع المحتوى)

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

**Showcase:** news.html (يعرض ما ينتجه المصنع — ليس منتجاً)

**الرسالة:** «املك غرفة أخبار مالية كاملة — بلا محررين، بلا تأخير، بلا اعتماد على Bloomberg.»

### Business Line 3 · Trading Technologies (محرّكات القرار والتنفيذ)

**السوق:** الأفراد، Prop Firms، صناديق التحوط، الوسطاء، Quant Firms، Market Makers
**الإيراد:** $99 — $50K+ شهرياً
**المنتجات (10):**
1. AI Council — $5K+ /mo (API) or included in suite
2. Executors (Smart + Autonomous) — included in suite
3. LASAA — $25K+ /mo (Enterprise)
4. Smart Chart Intelligence — $99 — $5K/mo
5. Advanced Scanner — $99 — $3K/mo
6. Predictive Markets — $2K+ /mo (API) or included
7. Portfolio Intelligence — included in suite
8. AI Trading Assistant — $49 — $2K/mo
9. Execution Bridge (MT5) — $1K — $10K/mo

**Showcase:** trade.html (يعرض محركات القرار في عمل — ليس منتجاً)

**الرسالة:** «من المعلومة إلى التنفيذ إلى التعلّم — دورة قرار كاملة، لا أمر مفرد.»

### Business Line 4 · Platform Access (طرق الاستهلاك)

**السوق:** المطورون، الـ Quant، شركات الفينتك، الوسطاء، المؤسسات التي تبني منتجاتها
**الإيراد:** Usage-based + Enterprise contracts
**المنتجات (6):**
1. Financial Intelligence API — $1K — Enterprise/mo
2. Trading Intelligence API — $3K+ /mo
3. Content API — $2K — $8K/mo
4. Streaming API — $2K+ /mo
5. SDK — مجاني مع أي API
6. White Label — $25K+ /mo + setup

**الرسالة:** «رؤى بـ JSON — أو رؤى باسمك. اختر طريقة الاستهلاك.»

---

## 8. Professional Services — رافد إيراد جديد

لم يكن موجوداً في v20. يُضاف الآن كقسم في Pricing:

| الخدمة | الوصف | السعر |
|--------|------|------|
| Implementation Services | تركيب وتكامل مع بنية العميل | $25K — $200K (one-time) |
| Custom Training | تدريب فريق العميل على رؤى | $5K — $25K (per program) |
| On-site Support | مهندس رؤى على موقع العميل | $3K — $10K/day |
| Migration Assistance | نقل من Bloomberg/Refinitiv إلى رؤى | $50K — $500K (one-time) |
| Strategic Consulting | استشارات استراتيجية لبناء المنتجات | $15K — $50K/engagement |

**الرسالة:** «لا تشتري رؤى وتتركه — فريقنا يركّب، يدرّب، يدعم، ويهاجر بك من أي حل سابق.»

---

## 9. هيكل التنفيذ (بعد اعتماد Business Architecture v1)

### المرحلة 1 — تثبيت البنية التجارية
- كتابة `BUSINESS-ARCHITECTURE-v1.md` (هذه الوثيقة)
- اعتماد 4 Business Lines + 24 منتج + Professional Services

### المرحلة 2 — تحديث index.html
- 4 Business Lines بدل 4 منتجات
- شارة: «24 منتج · 4 خطوط أعمال · منظومة واحدة»
- CTA رئيسي: «استكشف الكاتالوج»

### المرحلة 3 — إنشاء catalog.html (الأهم)
- 24 منتج في صفحة واحدة
- فلترة وبحث
- بطاقات قابلة للنقر لصفحات المنتجات

### المرحلة 4 — إنشاء 4 صفحات Business Line Landings
- intelligence-platform.html
- media-technologies.html
- trading-technologies.html
- platform-access.html

### المرحلة 5 — إعادة توجيه news.html و trade.html كـ Showcase
- news.html: يعرض ما ينتجه المصنع، يربط بالمنتجات
- trade.html: يعرض محركات القرار، يربط بالمنتجات

### المرحلة 6 — إنشاء 18 صفحة منتج فردي
- 7 صفحات Media Technologies
- 9 صفحات Trading Technologies (incl. LASAA, Smart Chart, Scanner, etc.)
- 1 صفحة SDK + تحديث api.html و white-label.html
- صفحة intelligence-platform مع deployment options

### المرحلة 7 — تحديث enterprise.html
- إضافة قطاعي Media Companies + Research Firms (6 قطاعات)
- ربط كل قطاع بالمنتجات المناسبة (فلتر في الكاتالوج)

### المرحلة 8 — إنشاء pricing.html (by Business Line)
- 6 أقسام (4 Business Lines + Professional Services + Bundles)
- أسعار معلنة للفرد، «Enterprise» للمؤسسات

### المرحلة 9 — تحديث Navigation الموحّد
```
Platform · Catalog · Intelligence · Media · Trading · Access · Enterprise · Pricing
```

---

## 10. ما الذي يبقى من v20 (أصول محفوظة)

كل ما بُني محفوظ — لا حذف:

**من PRODUCT-ARCHITECTURE-v1.md (المعمارية):**
- 5 طبقات (Layer 0/1/2A/2B/3/4) — تبقى كما هي
- Layer 1 (Infrastructure) — لا تغيير
- Layer 2A (Knowledge Engines) — لا تغيير
- Layer 2B (Decision Engines) — لا تغيير
- Layer 4 (Enterprise) — يُوسّع بقطاعين جديدين

**من PRODUCT-BIBLE-v1.md (المنتجات):**
- 24 منتج — كل التفاصيل (العميل/المشكلة/القيمة/المكونات/السعر/الرسالة) تبقى كما هي
- الفرق الوحيد: إعادة توزيعها على Business Lines بدل Product Families

**من v19 (الكود والتصميم):**
- نظام التصميم كاملاً (colors/fonts/RTL) — لا تغيير
- Architecture Map في index.html — يُحدّث فقط ليعكس Business Lines
- Business Value Layer (6 cards) — يبقى
- Evidence Chain — يبقى
- API Explorer — يبقى
- Deployment Models — يبقى
- Procurement Process — يبقى
- Pricing Model (by volume/depth/method/SLA) — يبقى كقسم داخل Pricing

---

## 11. معايير الاعتماد قبل أي HTML

- [ ] اعتماد 4 Business Lines (لا Product Families)
- [ ] اعتماد أن News و Trade = Showcase، لا منتجات
- [ ] اعتماد إنشاء catalog.html كنقطة دخول رئيسية
- [ ] اعتماد 24 منتج موزّعة على Business Lines
- [ ] اعتماد Professional Services كرافد إيراد جديد
- [ ] اعتماد Pricing معاد الهيكلة (6 أقسام حسب Business Line)
- [ ] اعتماد إضافة قطاعي Media Companies + Research Firms في Enterprise
- [ ] اعتماد قالب صفحة المنتج الموحّد (9 أقسام)
- [ ] اعتماد 9 مراحل تنفيذ (لا تبدأ قبل اعتماد الكل)
- [ ] اعتماد Navigation الموحّد الجديد

---

## 12. المبدأ النهائي

> **العميل لا يشتري منصة. يشتري حلاً من خط أعمال معين.**
>
> الموقع يجب أن يعكس هذا — لا أن يعرض «منصات» بل أن يعرض **خطوط أعمال** تحت كل منها **منتجات مستقلة قابلة للبيع منفرداً**.
>
> والكاتالوج هو نقطة الدخول — لأن العميل قد يعرف ما يريد قبل أن يعرف اسم المنتج.
>
> رؤى منظومة استخبارات مالية، تُباع كـ 24 منتجاً مستقلاً، عبر 4 خطوط أعمال، لـ 6 قطاعات.

---

**الحالة:** v1 — بانتظار الاعتماد النهائي قبل أي HTML
**الأساس:** PRODUCT-BIBLE-v1.md + PRODUCT-ARCHITECTURE-v1.md (محفوظان كـ inputs)
**Branch:** `redesign-v20-architecture`
**التاريخ:** يوليو 2026
**المنتجات:** 24
**خطوط الأعمال:** 4
**القطاعات:** 6
**الصفحات المتوقعة:** 24 (6 معدّلة + 18 جديدة)

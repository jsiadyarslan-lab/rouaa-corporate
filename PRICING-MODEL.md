# ROUA · Pricing Model v1

> وثيقة منفصلة عن Business Architecture — لأن الأسعار ستتغير أكثر من الهيكل، وقد تختلف حسب السوق.
>
> **القاعدة:** هذه الوثيقة قابلة للتحديث بمعزل عن المعمارية. تتغير الأرقام دون أن تتغير البنية.

---

## 1. مبادئ التسعير

### مبدأ 1 — أسعار معلنة للفرد، Enterprise للمؤسسات
- الأفراد / الشركات الصغيرة: أسعار معلنة على الموقع
- المؤسسات: «Enterprise Pricing — Contact Sales»

### مبدأ 2 — التسعير حسب الاستهلاك (Usage-based) للـ APIs
- Volume (عدد الطلبات/الوثائق/الأحداث)
- Depth (Data only / +Intelligence / +Evidence / +Reasoning)
- Method (REST / Streaming / Webhooks)
- SLA (99.9% / 99.95% / 99.99%)

### مبدأ 3 — Solutions أعلى من Products أعلى من Access
- Solution (Bundle + Services): أعلى قيمة
- Product (مستقل): وسط
- Access (API/SDK): أقل تكلفة لكن حجم أكبر

### مبدأ 4 — Professional Services رافد مستقل
- one-time (Implementation, Migration)
- recurring (Managed Operations)
- per-engagement (Advisory, Custom AI)

---

## 2. Core Intelligence Platform — Enterprise Licensing

### Deployment Pricing

| Deployment | السعر السنوي | المُضمَّن |
|------|------|------|
| Cloud SaaS | $500K — $1M | Hosting + Updates + 24/7 Support |
| Private Cloud | $750K — $1.5M | Dedicated infrastructure + isolation |
| On-Premise | $1M — $2M | Installation + training + on-site support |
| Hybrid | $1M — $2.5M | Mix — custom |

**ملاحظة:** جميعها تتطلب setup fee ($50K — $200K) + 12-month minimum contract.

---

## 3. Media Technologies — Pricing

| المنتج | Starter | Professional | Enterprise |
|--------|---------|-------------|-----------|
| News Agency Agent | — | $10K/mo | $20K/mo |
| News Pipeline | $1K/mo | $5K/mo | $10K/mo |
| Reports Pipeline | $5K/mo | $25K/mo | $50K/mo |
| Video Pipeline | — | $10K/mo | Custom |
| Infographic Pipeline | $3K/mo | $8K/mo | Custom |
| Stock Analysis Pipeline | — | $15K/mo | Custom |
| Geopolitical Risk Pipeline | — | $10K/mo | Custom |

**باقة Newsroom Bundle:** $30K/mo + $50K setup
- News Agency + News Pipeline + Reports Pipeline + Video Pipeline + Implementation

---

## 4. Trading Technologies — Pricing

| المنتج | Individual | Professional | Institutional |
|--------|------------|-------------|---------------|
| AI Council (API) | — | $5K/mo | Custom |
| Executors | included | included | included |
| LASAA | — | — | $25K+/mo |
| Smart Chart Intelligence | $99/mo | $499/mo | $5K/mo |
| Advanced Scanner | $99/mo | $499/mo | $3K/mo |
| Predictive Markets (API) | — | $2K/mo | Custom |
| Portfolio Intelligence | included | included | included |
| AI Trading Assistant | $49/mo | $499/mo | $2K/mo |
| Execution Bridge (MT5) | — | $1K/mo | $10K/mo |

**باقة Trading Suite Bundle (Professional):** $1,500/mo
- AI Council + Executors + Smart Chart + Scanner + Portfolio + Assistant
**باقة Trading Suite Bundle (Institutional):** $25K+/mo — Contact Sales

---

## 5. Consumption Layer — API Pricing

### Financial Intelligence API
| Tier | السعر | الحد |
|------|------|------|
| Starter | $1K/mo | 10K calls |
| Pro | $5K/mo | 100K calls + Streaming |
| Enterprise | Custom | Unlimited + SLA |

### Trading Intelligence API
| Tier | السعر | الحد |
|------|------|------|
| Pro | $3K/mo | 50K calls |
| Enterprise | $15K+/mo | Custom |

### Content API
| Tier | السعر | الحد |
|------|------|------|
| Starter | $2K/mo | 1K content pieces |
| Pro | $8K/mo | 10K content pieces |
| Enterprise | Custom | Unlimited |

### Streaming API
| Tier | السعر | الحد |
|------|------|------|
| Pro | $2K/mo | < 50ms latency |
| Enterprise | $10K+/mo | < 50ms + SLA 99.99% |

### SDK
- مجاني مع أي اشتراك API

### White Label
- Setup: $50K — $200K
- Monthly: $25K+ (حسب النطاق)

---

## 6. Solutions — Bundle Pricing

| Solution | الشهري | Setup |
|---------|------|------|
| Newsroom Solution | $30K+ | $50K |
| Central Bank Intelligence | $42K+ (أو $500K/yr) | $100K |
| Broker Intelligence | $40K+ | $100K |
| Hedge Fund Trading | $60K+ | $75K |
| Government Policy | $62K+ (أو $750K/yr) | $150K |
| Fintech Investment App | $25K+ | $50K |
| Custom Solutions | حسب العقد | حسب العقد |

---

## 7. Professional Services

| الخدمة | السعر | النوع |
|--------|------|------|
| Implementation Services | $25K — $200K | one-time |
| Migration from Bloomberg/Refinitiv | $50K — $500K | one-time |
| Custom Training | $5K — $25K | per program |
| Managed Operations | $10K — $50K/mo | recurring |
| Strategic Advisory | $15K — $50K | per engagement |
| Custom AI Development | $50K — $500K | one-time |

---

## 8. Discounts & Negotiation Rules

- **Annual contracts:** 15% discount (vs monthly)
- **Multi-product:** 20% discount when bundling 3+ products
- **Solutions Bundles:** always cheaper than buying components separately (15-25% saving)
- **Startups / Fintech:** special pricing program (case-by-case)
- **Government / Central Banks:** preferential pricing for multi-year contracts

---

## 9. Pricing Page UX Rules

### ما يُعرض على الموقع (pricing.html):
- ✅ أسعار Individual و Professional (للأفراد والشركات الصغيرة)
- ✅ «Starting from $X» للمؤسسات
- ✅ «Enterprise — Contact Sales» للأسعار العالية
- ✅ Comparison tables per Business Line
- ✅ Solution bundles مع «Save 20% vs individual»

### ما لا يُعرض على الموقع:
- ❌ الأسعار الفعلية للعقود المؤسسية ($500K, $1M, إلخ)
- ❌ تفاصيل الـ SLA لكل مستوى
- ❌ شروط التفاوض

**القاعدة:** «ابدأ من...» للمؤسسات. السعر الحقيقي في مكالمة المبيعات.

---

## 10. تحديث الأسعار

هذه الوثيقة قابلة للتحديث بمعزل عن BUSINESS-ARCHITECTURE-v2.md.
عند تغيير الأسعار:
1. تحديث PRICING-MODEL.md (هذه الوثيقة)
2. تحديث pricing.html (الصفحة)
3. تحديث أرقام «يبدأ من» في صفحات المنتجات الفردية
4. لا حاجة لتغيير المعمارية أو البنية التجارية

---

**الحالة:** v1 — قابلة للتحديث
**المرجع:** BUSINESS-ARCHITECTURE-v2.md
**Branch:** `redesign-v20-architecture`
**التاريخ:** يوليو 2026

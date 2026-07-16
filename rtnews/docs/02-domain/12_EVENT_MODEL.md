# 📐 Event Model

> هذه الوثيقة تشرح الفلسفة وراء Event ككيان أساسي، وعلاقته بالوثائق والحقائق.

## ما هو Event؟

**Event** = حدث مالي محدد وقع في وقت محدد، صادر عن جهة رسمية محددة.

```
Event ≠ خبر
Event ≠ وثيقة
Event ≠ حقيقة
Event = الحدث نفسه في العالم الحقيقي
```

مثال:
- **Event:** "الفيدرالي رفع الفائدة 25bps إلى 5.50% في 16 يوليو 2026"
- هذا Event واحد. يصدر عنه document واحد (البيان الصحفي). يُستخرج منه facts متعددة.

## الفرق بين Event و Document

| الجانب | Document | Event |
|--------|----------|-------|
| **ما هو** | وثيقة فعلية (PDF, HTML) | حدث في العالم الحقيقي |
| **العدد** | واحد لكل وثيقة | واحد لكل حدث |
| **المصدر** | من OfficialSource | مستخرج من Document(s) |
| **المحتوى** | نص خام | حقائق منتظمة |
| **العمر** | دائم (محفوظ) | يُنشأ ثم يُؤرشف |

مثال:
- **Document:** بيان FOMC (HTML، 45KB)
- **Event:** قرار رفع الفائدة (مستخرج من الـ Document)

## الفرق بين Fact و Event

| الجانب | Fact | Event |
|--------|------|-------|
| **ما هو** | معلومة محددة | حدث متكامل |
| **العدد** | متعدد لكل وثيقة | واحد لكل حدث |
| **التركيب** | قيمة مفردة | مجموعة facts |
| **الاستقلال** | لا معنى بدون Event | مستقل |

مثال:
- **Fact 1:** "معدل الفائدة = 5.50%"
- **Fact 2:** "التغيير = +25bps"
- **Fact 3:** "القرار = رفع"
- **Event:** يجمع Facts 1+2+3 في حدث واحد

## متى يصبح Document حدثاً؟

ليس كل Document يُنتج Event.

**يُنتج Event عندما:**
1. يحتوي على قرار رسمي (rate decision, regulatory action)
2. يحتوي على بيانات اقتصادية (CPI, GDP, Employment)
3. يحتوي على إيداع شركة (earnings, 8-K, 10-Q)
4. يحتوي على خطاب مسؤول (speech, testimony)
5. يحتوي على تصنيف ائتماني (rating action)

**لا يُنتج Event عندما:**
1. الوثيقة إدارية بحتة (صفحة عن، سياسة خصوصية)
2. الوثيقة تكرار لوثيقة سابقة
3. الوثيقة لا تحتوي على معلومة مالية جديدة

## علاقة Document ↔ Event

### واحد إلى واحد (1:1)
```
Document (بيان FOMC) → Event (قرار الفائدة)
```
الأكثر شيوعاً.

### واحد إلى متعدد (1:N)
```
Document (تقرير BLS الشهري) → Events:
  - Event 1: CPI Data Release
  - Event 2: Employment Data Release
  - Event 3: Wage Growth Data Release
```
وثيقة واحدة تنتج أحداثاً متعددة.

### متعدد إلى واحد (N:1)
```
Documents:
  - Document 1: بيان FOMC (HTML)
  - Document 2: محضر الاجتماع (PDF)
  - Document 3: خطاب باول (HTML)
→ Event واحد: قرار الفائدة (مدعوم بـ 3 وثائق)
```
حدث واحد يعتمد على وثائق متعددة (Evidence).

## أنواع Events

### Macro Events (أحداث اقتصادية كلية)
- `rate_decision` — قرار الفائدة
- `data_release` — إصدار بيانات (CPI, GDP, Employment)
- `speech` — خطاب مسؤول
- `policy_change` — تغيير سياسة
- `forecast_update` — تحديث توقعات

### Corporate Events (أحداث شركات)
- `earnings` — أرباح
- `filing` — إيداع تنظيمي (8-K, 10-Q, 10-K)
- `guidance` — توجيه
- `dividend` — توزيعات
- `split` — تجزئة سهم
- `ma` — استحواذ/اندماج
- `product_launch` — إطلاق منتج

### Market Events (أحداث أسواق)
- `listing` — إدراج
- `delisting` — شطب
- `trading_halt` — إيقاف تداول
- `corporate_action` — إجراءات الشركات

### Regulatory Events (أحداث تنظيمية)
- `regulatory_action` — إجراء تنظيمي
- `enforcement` — إنفاذ قانون
- `rating_action` — تصنيف ائتماني

### Geopolitical Events (أحداث جيوسياسية)
- `conflict_escalation` — تصعيد نزاع
- `sanctions` — عقوبات
- `trade_policy` — سياسة تجارية

## خصائص Event الأساسية

كل Event يجب أن يحتوي على:

1. **Type** — نوع محدد (rate_decision, earnings, etc.)
2. **Entity** — الجهة المصدر (Federal Reserve, Apple, SEC)
3. **Time** — وقت دقيق (eventDate)
4. **Value** — القيمة الرئيسية (+25bps, $1.2B, 3.2%)
5. **Direction** — الاتجاه (increase, decrease, neutral)
6. **Confidence** — مستوى الثقة (0-100)
7. **Source** — المصدر الرسمي
8. **Evidence** — الأدلة الداعمة

## قاعدة الذهب

```
لا Event بدون Source
لا Event بدون Evidence
لا Event بدون Time
لا Event بدون Type
```

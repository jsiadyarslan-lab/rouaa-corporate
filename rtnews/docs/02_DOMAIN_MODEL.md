# 🧩 Domain Model

> هذه ليست قاعدة بيانات. هذه فلسفة النظام.
> كل كيان هنا يمثل مفهوماً في العالم المالي الحقيقي.

## الكيانات الأساسية

```
Official Source
    ↓
Official Document
    ↓
Extracted Fact
    ↓
Financial Event
    ↓
Evidence
    ↓
Insight
    ↓
Publication
```

## تعريف كل كيان

### 1. Official Source (المصدر الرسمي)
**المفهوم:** الجهة التي تصدر البيانات المالية الرسمية.

**أمثلة:** Federal Reserve, SEC, BLS, Apple Investor Relations

**الخصائص:**
- له هوية مؤسسية (اسم، دولة، نوع)
- له مستوى موثوقية (official > verified > unverified)
- له طرق وصول متعددة (RSS, API, PDF, HTML)
- يصدر وثائق متعددة

**العلاقات:**
- واحد → متعدد Document
- واحد → متعدد Event

---

### 2. Official Document (الوثيقة الرسمية)
**المفهوم:** وثيقة فعلية صادرة عن مصدر رسمي.

**أمثلة:** 
- بيان صحفي للبنك المركزي (HTML)
- تقرير التضخم الشهري (PDF)
- إيداع 8-K لدى SEC (XBRL)
- بيانات التوظيف (CSV)

**الخصائص:**
- لها نوع (HTML, PDF, RSS, JSON, XML, CSV, XBRL)
- لها محتوى خام (rawContent)
- لها نص مستخرج (extractedText)
- لها بصمة رقمية (hash) للتحقق
- لها نسخة مؤرشفة (snapshot)
- لها تاريخ نشر وتاريخ جلب

**العلاقات:**
- تنتمي → Official Source
- واحدة → متعدد Fact
- واحدة → متعدد Event (ممكن)

---

### 3. Extracted Fact (الحقيقة المستخرجة)
**المفهوم:** معلومة محددة مستخرجة من وثيقة.

**أمثلة:**
- "معدل الفائدة = 5.50%"
- "التضخم = 3.2%"
- "أرباح Apple = $1.2B"
- "قرار: رفع الفائدة 25bps"

**الخصائص:**
- لها نوع (رقم، قرار، تاريخ، اقتباس)
- لها قيمة
- لها وحدة (%, bps, $, نقطة)
- لها سياق (الفقرة التي استُخرجت منها)
- لها مستوى ثقة

**العلاقات:**
- تنتمي → Official Document
- تغذي → Financial Event

---

### 4. Financial Event (الحدث المالي)
**المفهوم:** حدث مالي محدد وقع في وقت محدد.

**أمثلة:**
- قرار الفائدة (Rate Decision)
- إصدار بيانات (Data Release)
- أرباح شركة (Earnings)
- إيداع تنظيمي (Filing)
- خطاب مسؤول (Speech)
- تخفيض تصنيف (Rating Action)

**الخصائص:**
- له نوع محدد
- له كيان (Entity: Federal Reserve, Apple, SEC)
- له قيمة (Value: +25bps, $1.2B, 3.2%)
- له اتجاه (Direction: increase, decrease, neutral)
- له أصول متأثرة (Affected Assets: USD, GOLD, BONDS)
- له تاريخ ووقت دقيق
- له مستوى تأثير (Impact Level)

**العلاقات:**
- مصدره → Official Document (ممكن)
- مصدره → Official Source
- يولد → Evidence
- يولد → Publication (خبر/تقرير/تنبيه)

---

### 5. Evidence (الدليل)
**المفهوم:** الإثبات الموثق لكل ادعاء في النظام.

**أمثلة:**
- "التضخم انخفض" → Evidence: BLS CPI Report, Table 1, Row 3, Value 3.2%

**الخصائص:**
- له نوع (PDF, HTML, Quote, Table, Chart)
- له رابط للوثيقة الأصلية
- له الفقرة/الجدول المحدد
- له وقت النشر الرسمي
- له نسخة الوثيقة (Version)
- له بصمة رقمية (Hash)

**العلاقات:**
- يثبت → Claim في Publication
- مصدره → Official Document
- مصدره → Official Event

---

### 6. Insight (الرؤية)
**المفهوم:** تحليل أو استنتاج مأخوذ من حدث أو مجموعة أحداث.

**أمثلة:**
- "الفيدرالي يميل للمتشدد → USD قد يرتفع"
- "أرباح Apple تجاوزت التوقعات → السهم قد يرتفع"

**الخصائص:**
- له نوع (تحليل، تنبؤ، مقارنة، اتجاه)
- له مستوى ثقة
- له أصول متأثرة
- له سيناريوهات
- له توصية (ممكن)

**العلاقات:**
- مبني على → Event(s)
- مدعوم بـ → Evidence
- ينشر كـ → Publication

---

### 7. Publication (المنشور)
**المفهوم:** الصياغة النهائية للقارئ.

**أمثلة:**
- خبر وكالة أنباء
- ملخص تنفيذي
- تنبيه فوري
- موجز صباحي
- تحليل أولي
- تقرير استراتيجي

**الخصائص:**
- له نوع (news, alert, brief, report, analysis)
- له لغة (locale)
- له جمهور مستهدف
- له قنوات نشر (web, API, telegram, RSS)

**العلاقات:**
- مصدره → Event + Insight
- مدعوم بـ → Evidence
- يُنشر عبر → Channels

## قاعدة الذهب

```
كل Publication مرتبط بـ Insight
كل Insight مرتبط بـ Event(s)
كل Event مرتبط بـ Evidence
كل Evidence مرتبط بـ Document
كل Document مرتبط بـ Source
```

لا توجد حلقة مفقودة.

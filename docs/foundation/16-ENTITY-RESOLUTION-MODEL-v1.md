# ROUAA · ENTITY-RESOLUTION-MODEL-v1

> **الطبقة الهوية فوق KNOWLEDGE-ONTOLOGY-MODEL-v1 و KNOWLEDGE-GRAPH-MODEL-v1.**
>
> تجيب عن سؤال واحد:
>
> **كيف يعرف رؤى أن الكيان المذكور في آلاف الوثائق المختلفة هو نفس الكيان الحقيقي، دون إنشاء كيانات وهمية أو علاقات خاطئة؟**

الإصدار: v1.0
الحالة: الوثيقة التأسيسية لهوية المعرفة
النطاق: Global Financial Entity Identity System

---

# 0. لماذا Entity Resolution؟

العالم المالي لا يستخدم أسماء موحدة.

نفس الكيان قد يظهر بأشكال مختلفة:

```
Apple Inc.

Apple

Apple Computer Inc.

AAPL

NASDAQ:AAPL

US0378331005
```

لكن النظام يجب أن يفهم:

```
كلها = نفس الكيان
```

---

المشكلة ليست تقنية فقط.

خطأ واحد في الهوية يؤدي إلى:

* ربط تقرير بشركة خاطئة
* تحليل مخاطر غير صحيح
* إشارات تداول خاطئة
* Audit Trail غير موثوق
* فقدان الثقة المؤسسية

لذلك:

> الهوية هي أساس الحقيقة.

---

# 1. تعريف ROUAA Entity Resolution

## التعريف الداخلي

> Entity Resolution هو النظام الذي يكتشف، يطابق، يثبت، ويدير هوية الكيانات عبر مصادر متعددة، ويحافظ على سجل الهوية التاريخي لكل كيان.

---

## التعريف التجاري

لا يقال للعميل:

"لدينا Entity Resolution Engine"

بل:

> "رؤى يعرف السياق المالي الحقيقي خلف كل اسم، مؤسسة، أصل، أو حدث."

---

# 2. موقع Entity Resolution داخل المنظومة

```
Official Sources
        ↓
Documents
        ↓
Extraction
        ↓
Entity Resolution
        ↓
Knowledge Graph
        ↓
Intelligence Objects
        ↓
Decision Intelligence
```

---

# 3. المشكلة التي يحلها النظام

## بدون Entity Resolution

مثال:

وثيقة 1:

```
Federal Reserve
```

وثيقة 2:

```
Fed
```

وثيقة 3:

```
US Federal Reserve System
```

النظام يرى:

```
Entity A
Entity B
Entity C
```

---

## مع Entity Resolution

النظام يبني:

```
Federal Reserve System

Aliases:
- Fed
- Federal Reserve
- US Federal Reserve

Identifiers:
- LEI
- Official ID
- Jurisdiction

Type:
Central Bank

Confidence:
99.9%
```

---

# 4. نموذج الهوية الأساسي

كل Entity داخل رؤى يمتلك:

```
Entity Identity Object

├── Canonical Name
├── Entity Type
├── Identifiers
├── Aliases
├── Attributes
├── Historical Names
├── Relationships
├── Evidence
├── Confidence
└── Lifecycle
```

---

# 5. Canonical Identity

## الاسم الأساسي

هو الاسم الرسمي المعتمد.

مثال:

```
Canonical Name:

Apple Inc.
```

---

## لماذا مهم؟

لأن كل الطبقات الأخرى تعتمد عليه:

* Knowledge Graph
* Evidence Graph
* Search
* Analytics
* Reporting

---

# 6. Entity Identifiers

الأسماء وحدها غير كافية.

يستخدم رؤى معرفات عالمية.

---

## Corporate Identifiers

```
LEI
Ticker
CUSIP
ISIN
SEDOL
Company Registration Number
```

---

## Institutional Identifiers

```
Central Bank Code
Government Identifier
Regulator ID
```

---

## Financial Asset Identifiers

```
ISIN
FIGI
Ticker
Exchange Symbol
```

---

مثال:

```
Apple Inc.

Identifiers:

Ticker:
AAPL

ISIN:
US0378331005

Exchange:
NASDAQ
```

---

# 7. Alias Management

كل كيان لديه أسماء بديلة.

مثال:

```
Entity:
European Central Bank


Aliases:

ECB

European Central Bank

Eurosystem Central Bank
```

---

أنواع Alias:

## Official Alias

اسم رسمي.

---

## Market Alias

اسم يستخدمه السوق.

---

## Historical Alias

اسم سابق.

مثال:

```
Facebook Inc.

changed to

Meta Platforms Inc.
```

---

## Language Alias

الأسماء بلغات مختلفة.

مثال:

```
البنك المركزي الأوروبي

European Central Bank

Europäische Zentralbank
```

---

# 8. Entity Matching Pipeline

## المرحلة 1 — Candidate Generation

البحث عن الكيانات المحتملة.

مصادر:

* الاسم
* الرمز
* الدولة
* القطاع
* السياق

---

مثال:

Input:

```
Apple
```

Candidates:

```
Apple Inc.
Apple Bank
Apple Records
```

---

# المرحلة 2 — Feature Comparison

المقارنة:

```
Name similarity

Identifier match

Location match

Industry match

Document context

Relationship similarity
```

---

# المرحلة 3 — Confidence Scoring

النظام لا يقول:

"نعم"

بل:

```
Match Score:

98.7%
```

---

مثال:

```
Apple

→ Apple Inc.

Confidence:
99.8%

Reason:

Ticker match
+
SEC filing match
+
Industry match
```

---

# المرحلة 4 — Human Review

في الحالات الحساسة:

```
Confidence < Threshold

↓

Review Queue

↓

Human Approval

↓

Entity Confirmed
```

---

# 9. نموذج الثقة

كل قرار مطابقة يحمل:

```
Resolution Confidence Object

{
candidate_entity,
score,
signals,
evidence,
review_status,
timestamp
}
```

---

# 10. Entity Merge Rules

أحياناً يتم إنشاء كيانات مكررة.

مثال:

```
Tesla Motors

Tesla Inc.
```

النظام يقوم بـ:

```
Duplicate Detection

↓

Merge Proposal

↓

Approval

↓

Unified Entity
```

---

# 11. Entity Splitting

العكس مهم.

مثال:

شركة تنقسم:

```
Company A

↓

Company A
+
Company B
```

لا يجوز دمج التاريخ كله.

يجب:

* حفظ التاريخ
* إنشاء كيانات جديدة
* ربط العلاقة الزمنية

---

# 12. Temporal Identity

الهوية تتغير مع الزمن.

مثال:

```
Facebook Inc.

2012-2021

↓

Meta Platforms Inc.

2021-present
```

النظام يحفظ:

```
Previous Name

Valid From

Valid To

Evidence
```

---

# 13. Entity Types داخل رؤى

حسب Ontology:

```
Institution

Company

Person

Asset

Market

Country

Sector

Indicator

Event

Document Source
```

---

# 14. Entity Resolution + Evidence

لا يتم إنشاء هوية بدون دليل.

مثال:

```
Entity:

Federal Reserve


Evidence:

Official Website

Annual Report

Government Registry
```

---

# 15. Entity Resolution + AI

الذكاء الاصطناعي يستخدم للمساعدة.

لكن القرار النهائي يعتمد على:

* Rules
* Identifiers
* Evidence
* Confidence

ليس على LLM وحده.

---

# 16. لماذا هذه الطبقة تمثل Moat؟

لأن بناء هوية مالية عالمية يحتاج:

* سنوات من التنظيف
* آلاف المصادر
* تاريخ التغييرات
* علاقات موثقة
* مراجعات بشرية

النماذج العامة تعرف اللغة.

لكنها لا تملك:

> Financial Identity Graph.

---

# 17. مقاييس الجودة

## Resolution Accuracy

نسبة المطابقات الصحيحة.

---

## False Merge Rate

دمج كيانات مختلفة بالخطأ.

---

## False Split Rate

اعتبار كيان واحد كيانات متعددة.

---

## Coverage

نسبة الكيانات المعروفة عالمياً.

---

# 18. المبدأ المؤسس

> قبل أن يفهم رؤى العلاقات بين الأشياء، يجب أن يعرف ما هي الأشياء أصلاً.

---

# 19. الوثائق التالية

بعد Entity Resolution:

## RELATIONSHIP-MODEL-v1

لتعريف:

* أنواع العلاقات
* قواعد صلاحيتها
* قوة العلاقة
* تأثيرها

ثم:

## KNOWLEDGE-INGESTION-MODEL-v1

كيف تدخل المعرفة من:

* مصادر رسمية
* تقارير
* ملفات PDF
* APIs

ثم:

## REASONING-MODEL-v1

كيف تتحول المعرفة إلى استنتاجات وقرارات.

---

الحالة:

**ROUAA Global Entity Identity Layer v1 Established**

الخطوة التالية المنطقية:

**RELATIONSHIP-MODEL-v1**

لأن بعد معرفة "من هو الشيء"، يجب تعريف "كيف يرتبط بالأشياء الأخرى".

# ROUAA · RELATIONSHIP-MODEL-v1

> **الطبقة البنيوية فوق ENTITY-RESOLUTION-MODEL-v1.**
>
> تجيب عن سؤال واحد:
>
> **كيف يعرّف رؤى العلاقات بين الكيانات؟ وكيف يضمن أن كل علاقة صحيحة، موثقة، قابلة للتتبع، وقابلة للتغير مع الزمن؟**

الإصدار: v1.0
الحالة: Foundational Architecture
النطاق: Institutional Financial Relationship Model

---

# 0. لماذا هذه الوثيقة؟

Entity Resolution يجيب:

> من هو الكيان؟

Knowledge Graph يجيب:

> كيف ترتبط الكيانات؟

لكن يبقى سؤال أساسي:

> ما هي العلاقة نفسها؟

في معظم الأنظمة تكون العلاقة مجرد Edge.

في رؤى:

> **العلاقة أصل معرفي (Knowledge Object) له هوية وسجل حياة وأدلة.**

---

# 1. تعريف العلاقة

## التعريف الداخلي

العلاقة تمثل حقيقة موثقة تصف ارتباطًا بين كيانين أو أكثر ضمن سياق زمني ومعرفي محدد.

كل علاقة تمتلك:

* معنى
* أدلة
* تاريخ
* درجة ثقة
* تأثيرًا على القرار

---

## التعريف الخارجي

لا يرى العميل العلاقات.

بل يرى:

* سياقًا
* تفسيرًا
* سلسلة تأثير
* روابط بين الأحداث

---

# 2. المبادئ المؤسسة

## Principle 1

لا توجد علاقة بلا دليل.

---

## Principle 2

لا توجد علاقة بلا نوع.

---

## Principle 3

لا توجد علاقة أبدية.

كل علاقة لها:

* بداية
* نهاية
* أو حالة مستمرة

---

## Principle 4

العلاقة يمكن أن تتغير دون تغيير الكيان.

---

## Principle 5

العلاقة نفسها قابلة للتدقيق.

---

# 3. Relationship Object

كل علاقة داخل رؤى تمثل كائنًا مستقلًا.

```text
Relationship

├── Relationship ID
├── Relationship Type
├── Source Entity
├── Target Entity
├── Properties
├── Evidence
├── Confidence
├── Validity
├── Lifecycle
├── Version
└── Audit Trail
```

العلاقة ليست:

```
A ----> B
```

بل:

```
A

↓

Relationship Object

↓

B
```

---

# 4. مكونات العلاقة

## المصدر

الكيان الذي تبدأ منه العلاقة.

---

## الهدف

الكيان الذي تنتهي إليه العلاقة.

---

## النوع

نوع العلاقة.

---

## الأدلة

كل علاقة مرتبطة بسلسلة أدلة.

---

## الثقة

Confidence Score.

---

## الزمن

Validity Period.

---

## التأثير

Decision Impact.

---

# 5. التصنيف الرئيسي للعلاقات

## 5.1 Structural Relationships

تعبر عن البنية.

أمثلة:

* Owns
* Subsidiary Of
* Parent Of
* Member Of
* Listed On

---

## 5.2 Regulatory Relationships

العلاقات التنظيمية.

أمثلة:

* Regulates
* Supervises
* Licenses
* Oversees

---

## 5.3 Financial Relationships

أمثلة:

* Invests In
* Holds
* Issues
* Guarantees
* Funds

---

## 5.4 Economic Relationships

أمثلة:

* Influences
* Depends On
* Competes With
* Correlates With

---

## 5.5 Operational Relationships

أمثلة:

* Supplies
* Manufactures
* Distributes
* Partners With

---

## 5.6 Knowledge Relationships

أمثلة:

* Supports Claim
* Refutes Claim
* References
* Derived From

---

## 5.7 Decision Relationships

تمثل علاقات القرار.

أمثلة:

* Justifies
* Challenges
* Assumes
* Recommends
* Rejects

وهذه الفئة تميز رؤى عن معظم Knowledge Graphs التقليدية.

---

# 6. خصائص العلاقة

كل علاقة تحمل خصائص مستقلة.

```text
Strength

Direction

Confidence

Priority

Evidence Count

Source Quality

Decision Weight
```

---

# 7. العلاقة ليست دائماً ثنائية

قد ترتبط أكثر من عقدتين.

مثال:

```
Federal Reserve

↓

Interest Rate Decision

↓

Bond Market

↓

Portfolio Risk
```

هذا ليس أربع علاقات منفصلة.

بل سلسلة سببية مترابطة.

لذلك يدعم رؤى:

* Binary Relationships
* Multi-Entity Relationships
* Causal Chains

---

# 8. العلاقة والزمن

العلاقة قد تكون:

## Permanent

مثل:

```
ECB

is

Central Bank
```

---

## Temporary

مثل:

```
Company

owns

Asset

2022–2025
```

---

## Event Driven

مثل:

```
Rate Decision

affected

Market

for 3 days
```

---

# 9. العلاقة والثقة

ليست كل العلاقات متساوية.

```text
Confidence

95%

Evidence

4 official documents

Reviewed

Yes
```

أو:

```text
Confidence

62%

Evidence

Single source

Pending Review
```

الثقة خاصية للعلاقة، لا للكيان.

---

# 10. العلاقة والأدلة

كل علاقة يجب أن تشير إلى:

* Source Registry
* Document
* Evidence Node
* Citation
* Audit Reference

ولا يسمح بعلاقة مجهولة المصدر.

---

# 11. العلاقة والإصدارات

إذا تغيرت العلاقة:

لا يتم استبدالها.

بل:

```text
Relationship V1

↓

Relationship V2

↓

Relationship V3
```

ويبقى التاريخ كاملاً.

---

# 12. العلاقة والسببية

هذه أهم طبقة في رؤى.

هناك فرق بين:

```
Oil Price

related to

Inflation
```

وبين:

```
Oil Price

causes

Inflation Pressure
```

العلاقة السببية لا تُنشأ إلا إذا دعمتها الأدلة.

---

# 13. Decision Impact

كل علاقة تحمل أثراً على القرار.

مثال:

```
Interest Rate

↓

Mortgage Market

↓

Construction Sector

↓

Bank Earnings
```

عند تغير أول عنصر:

يعرف النظام تلقائياً ما الذي قد يتأثر.

---

# 14. Governance

العلاقات تمر عبر دورة حياة.

```
Proposed

↓

Validated

↓

Active

↓

Deprecated

↓

Archived
```

ولا تنتقل بين الحالات إلا وفق قواعد الحوكمة.

---

# 15. مقاييس الجودة

تقاس جودة طبقة العلاقات عبر:

* Relationship Accuracy
* Evidence Coverage
* Temporal Accuracy
* Causal Accuracy
* Duplicate Relationship Rate
* Unsupported Relationship Rate

---

# 16. العلاقة مع بقية المنظومة

```
Ontology

↓

Entity Resolution

↓

Relationship Model

↓

Knowledge Graph

↓

Reasoning Engine

↓

Intelligence Objects

↓

Decision Intelligence
```

العلاقات هي العمود الفقري الذي يسمح لمحرك الاستدلال بفهم كيفية انتقال التأثير داخل النظام.

---

# 17. ما الذي لا يعتبر علاقة؟

لا تُنشأ علاقة إذا كانت:

* تخميناً بلا دليل.
* ناتجة فقط عن تشابه الأسماء.
* مشتقة من نموذج لغوي دون تحقق.
* مؤقتة جداً ولا تحمل قيمة معرفية.
* خاصة بجلسة مستخدم أو بواجهة الاستخدام.

---

# 18. المبادئ المؤسسة

1. **العلاقة أصل معرفي وليست Edge.**
2. **كل علاقة تحتاج Evidence Chain مستقلة.**
3. **العلاقة لها هوية مستقلة عن الكيان.**
4. **الثقة خاصية للعلاقة وليست للكيان.**
5. **كل علاقة قابلة للإصدار والتدقيق والإلغاء دون فقدان التاريخ.**
6. **العلاقات السببية تختلف عن العلاقات الوصفية ويجب الفصل بينهما.**
7. **قيمة Knowledge Graph تأتي من جودة العلاقات أكثر من عددها.**

---

# 19. الوثائق التالية

بعد اعتماد هذه الوثيقة يصبح التسلسل المنطقي:

1. **KNOWLEDGE-INGESTION-MODEL-v1**
   كيف تدخل المعرفة من المصادر الرسمية وتتحول إلى كيانات وعلاقات وحقائق.

2. **REASONING-MODEL-v1**
   كيف يستخدم النظام العلاقات لإنتاج الاستنتاجات وIntelligence Objects.

3. **DECISION-GRAPH-MODEL-v1**
   كيف تتحول شبكة المعرفة إلى شبكة قرارات مؤسسية.

---

الحالة:

**ROUAA Relationship Architecture v1 Established**

الخطوة التالية المنطقية ليست Reasoning مباشرة، بل **KNOWLEDGE-INGESTION-MODEL-v1**، لأن النظام يجب أولاً أن يحدد كيف تُنشأ الكيانات والعلاقات والحقائق من الوثائق الرسمية قبل أن يبدأ بالاستدلال عليها.

# DECISION-MODEL-v1

## Institutional Decision Architecture

**الإصدار:** v1.0

**الحالة:** Foundational Architecture

**الموقع في المنظومة:**

```
Evidence
        ↓
Knowledge
        ↓
Reasoning
        ↓
Decision
        ↓
Execution
        ↓
Outcome
        ↓
Learning
```

هذه الوثيقة تعرّف الأصل (Core Object) الذي تدور حوله منصة ROUAA بأكملها.

---

# 1. لماذا هذه الوثيقة؟

حتى الآن أصبح لدى ROUAA:

* مصادر رسمية
* وثائق
* حقائق
* أحداث
* علاقات
* Knowledge Graph
* Ontology
* Evidence
* Intelligence Objects
* Reasoning Engine

لكن كل ذلك لا يمثل ما تشتريه المؤسسة.

المؤسسة لا تشتري:

* Fact
* Event
* Graph
* Report

المؤسسة تشتري:

> **قدرة إنتاج قرار مؤسسي يمكن الوثوق به وتنفيذه والدفاع عنه وإعادة بنائه.**

لذلك فإن Decision هو الأصل التجاري الحقيقي للمنصة.

---

# 2. التعريف

القرار المؤسسي ليس توصية.

وليس تقريراً.

وليس Signal.

وليس Prediction.

بل هو:

> **قرار مؤسسي موثق، مبني على الأدلة، قابل للتفسير، قابل للتدقيق، وقابل للتنفيذ داخل سياق أعمال محدد.**

بالإنجليزية:

> **An Institutional Decision is a governed, evidence-backed, explainable, auditable and executable business decision.**

---

# 3. المبادئ المؤسسة

## المبدأ الأول

كل قرار يبدأ من Evidence.

وليس من نموذج لغوي.

---

## المبدأ الثاني

كل قرار يمكن إعادة بنائه بالكامل.

---

## المبدأ الثالث

كل قرار يملك مالكاً واضحاً.

---

## المبدأ الرابع

كل قرار يملك حدود صلاحية.

---

## المبدأ الخامس

كل قرار قابل للطعن والمراجعة.

---

## المبدأ السادس

كل قرار يمكن قياس نتيجته.

---

## المبدأ السابع

كل قرار يبقى أصلاً معرفياً للمؤسسة.

---

# 4. ما هو Decision Object؟

Decision Object هو أعلى كائن معرفي داخل ROUAA.

```
Evidence

↓

Facts

↓

Events

↓

Knowledge

↓

Reasoning

↓

Decision
```

كل شيء في المنصة ينتهي إليه.

---

# 5. مكونات Decision Object

كل قرار يحتوي على:

```
Decision ID

Title

Decision Type

Decision Scope

Decision Owner

Business Context

Objective

Decision Statement

Supporting Evidence

Supporting Facts

Relationships

Reasoning Chain

Alternative Scenarios

Opposing Arguments

Confidence

Risk Assessment

Expected Impact

Affected Assets

Affected Entities

Dependencies

Approvals

Execution Plan

Success Metrics

Review Schedule

Lifecycle State

Audit Trail
```

هذا الكائن ليس مجرد JSON، بل يمثل عقداً معرفياً بين المنصة والمؤسسة.

---

# 6. أنواع القرارات

ليست كل القرارات من النوع نفسه.

### Investment Decision

مثل:

شراء أو بيع أو زيادة أو تخفيض مركز.

---

### Risk Decision

رفع حدود المخاطر أو خفضها.

---

### Portfolio Decision

إعادة موازنة المحفظة.

---

### Research Decision

اعتماد فرضية أو رفضها.

---

### Compliance Decision

الموافقة أو الرفض التنظيمي.

---

### Editorial Decision

نشر تحليل أو تأجيله.

---

### Operational Decision

تشغيل Workflow أو إيقافه.

---

### Strategic Decision

قرار طويل الأجل.

---

# 7. Decision Scope

كل قرار يحدد نطاقه.

قد يكون:

```
Security

Sector

Country

Region

Portfolio

Client

Fund

Committee

Enterprise
```

---

# 8. Decision Lifecycle

```
Draft

↓

Evidence Collection

↓

Reasoning

↓

Internal Challenge

↓

Review

↓

Approval

↓

Published

↓

Executed

↓

Monitoring

↓

Post Analysis

↓

Archived
```

لا توجد قفزات.

---

# 9. القرار ليس نتيجة واحدة

كل Decision يحتوي على ثلاثة أجزاء.

```
Recommendation

↓

Confidence

↓

Explanation
```

لا يجوز وجود Recommendation وحدها.

---

# 10. السيناريوهات

كل قرار يحتوي على:

```
Base

Bull

Bear

Stress

Alternative
```

وليس سيناريو واحداً.

---

# 11. المعارضة المؤسسية

كل قرار يمر عبر Challenge.

وليس Review فقط.

مثال:

```
Research

↓

Bull Analysis

↓

Bear Analysis

↓

Risk Review

↓

Compliance Review

↓

Chair Decision
```

الهدف ليس الاتفاق.

بل اختبار قوة القرار.

---

# 12. درجة الثقة

الثقة لا تأتي من النموذج.

بل من النظام.

تعتمد على:

* Evidence Quality
* Source Reliability
* Coverage
* Agreement
* Conflict Level
* Historical Accuracy
* Data Freshness
* Reasoning Consistency

---

# 13. تقييم المخاطر

لكل قرار ملف مخاطر مستقل.

يشمل:

```
Market Risk

Data Risk

Evidence Risk

Liquidity Risk

Timing Risk

Compliance Risk

Execution Risk

Operational Risk
```

---

# 14. خطة التنفيذ

القرار لا يكتمل حتى يعرف النظام ماذا سيفعل به.

قد يكون:

* إرسال إلى لجنة الاستثمار.
* إنشاء أمر تداول.
* إصدار تقرير.
* إرسال تنبيه.
* تحديث لوحة متابعة.
* تشغيل Workflow.
* استدعاء API.

---

# 15. قياس النجاح

بعد التنفيذ لا ينتهي القرار.

يتم قياس:

* هل تحقق الهدف؟
* هل كان القرار صحيحاً؟
* هل ظهرت معلومات جديدة؟
* هل كان مستوى الثقة مناسباً؟
* هل كانت المخاطر مقدرة بدقة؟

ثم تُربط النتائج بالقرار نفسه.

---

# 16. العلاقة مع بقى النماذج

```
Evidence Foundation
        ↓
Knowledge Graph
        ↓
Ontology
        ↓
Entity Resolution
        ↓
Relationship Model
        ↓
Knowledge Ingestion
        ↓
Reasoning Model
        ↓
DECISION MODEL
        ↓
Decision Workflow
        ↓
Decision Governance
        ↓
Execution
        ↓
Feedback
```

---

# 17. ما الذي يراه كل جمهور؟

| الجمهور        | ما يراه من القرار                                       |
| -------------- | ------------------------------------------------------- |
| المستثمر       | أصل مؤسسي يولد قرارات عالية الجودة ويزيد من قيمة المنصة |
| CIO            | قرار قابل للتتبع والتنفيذ والحوكمة                      |
| مدير المخاطر   | الأدلة، المخاطر، وسجل المراجعة                          |
| لجنة الاستثمار | التوصية، السيناريوهات، والاعتراضات                      |
| المحلل         | المبررات، الأدلة، ومستوى الثقة                          |
| المطور         | Decision Object وواجهات التكامل                         |

---

# 18. ما الذي يجعل قرار ROUAA مختلفاً؟

الفرق ليس أن ROUAA يصدر توصية.

الفرق أنه يصدر **قراراً مؤسسياً كاملاً** يحمل معه كل ما يحتاجه ليصبح جزءاً من عملية المؤسسة:

* هوية فريدة.
* سياق أعمال.
* سلسلة أدلة.
* سلسلة استدلال.
* فرضيات بديلة.
* اعتراضات موثقة.
* تقييم مخاطر.
* مستوى ثقة محسوب.
* خطة تنفيذ.
* سجل تدقيق كامل.
* نتائج لاحقة تغذي التعلم المؤسسي.

وبذلك يصبح **Decision Object** هو الأصل المركزي الذي يربط جميع طبقات ROUAA السابقة (Evidence، Knowledge، Reasoning) بجميع الطبقات اللاحقة (Workflow، Governance، Execution، Learning). إنه ليس مخرجاً للنظام، بل الوحدة الأساسية التي تُبنى حولها منصة **Institutional Decision Intelligence** بأكملها.

# ROUAA · KNOWLEDGE-GRAPH-MODEL-v1

> **الطبقة المعرفية فوق DATA-GOVERNANCE-MODEL و ENTERPRISE-ARCHITECTURE-MODEL.**
>
> تجيب عن سؤال واحد:
>
> **كيف تتحول ملايين الحقائق والأحداث والأدلة والكيانات المالية إلى شبكة معرفة مؤسسية تفهم العلاقات، لا مجرد قاعدة بيانات؟**

الإصدار: v1.0
الحالة: مسودة تأسيسية قبل التنفيذ
النطاق: Knowledge Graph Architecture for Institutional Decision Intelligence

---

# 0. لماذا هذه الوثيقة؟

الأنظمة المالية التقليدية تخزن البيانات.

قواعد البيانات تعرف:

* ما هي القيمة؟
* متى حدثت؟
* من أين جاءت؟

لكنها لا تفهم:

* لماذا حدثت؟
* ما علاقتها بحدث آخر؟
* كيف تؤثر على قرار؟
* ما سلسلة الأدلة خلفها؟
* ما الكيانات المتصلة بها؟

رؤى لا تبني Data Warehouse جديدًا.

رؤى تبني:

> **Institutional Intelligence Network**

حيث تتحول البيانات المالية من سجلات منفصلة إلى شبكة علاقات قابلة للاستدلال.

---

# 1. التعريف

## 1.1 التعريف الداخلي

> Knowledge Graph في رؤى هو طبقة معرفية تربط الكيانات المالية، الأحداث، الحقائق، الأدلة، القرارات، والسياقات الزمنية في نموذج علاقات موحد يسمح بالبحث، الاستدلال، وإعادة بناء القرار.

---

## 1.2 التعريف الخارجي

لا يُباع للعميل باسم Knowledge Graph.

اللغة الخارجية:

> "شبكة معرفة مالية موثقة تربط كل معلومة بسياقها ومصدرها وتأثيرها."

لأن العميل لا يشتري Graph.

العميل يشتري:

* قرارات أفضل
* بحث أسرع
* تفسير واضح
* تدقيق أسهل

---

# 2. موقع Knowledge Graph داخل منظومة رؤى

```
Enterprise Outcomes
        ↑
Decision Intelligence
        ↑
Intelligence Objects
        ↑
Knowledge Graph
        ↑
Evidence Graph
        ↑
Official Sources + Documents
```

Knowledge Graph ليست أعلى طبقة.

هي المحرك الذي يجعل Intelligence Objects تفهم العالم المالي.

---

# 3. الفرق بين Evidence Graph و Knowledge Graph

## Evidence Graph

السؤال:

> "هل هذا الادعاء مدعوم؟"

يربط:

```
Claim
 |
Evidence
 |
Document
 |
Official Source
```

مثال:

```
Inflation increased to 3.2%

↓ supported by

BLS CPI Report

↓ published by

US Bureau of Labor Statistics
```

---

## Knowledge Graph

السؤال:

> "ما العلاقات والمعاني حول هذه الحقيقة؟"

مثال:

```
Inflation Increase

connected to:

Federal Reserve
      |
      affects
      |
Interest Rate Decision
      |
      impacts
      |
Bond Market
      |
      impacts
      |
Portfolio Allocation
```

---

# 4. النموذج الأساسي للكيانات

## 4.1 Core Entities

### Entity

يمثل أي كيان معروف في النظام:

أمثلة:

* شركة
* بنك مركزي
* دولة
* قطاع
* أصل مالي
* مؤشر اقتصادي
* صندوق استثماري
* شخصية مؤثرة

---

### Event

حدث مالي أو اقتصادي:

أمثلة:

* FOMC Meeting
* Earnings Release
* CPI Publication
* Rate Decision
* Merger Announcement

---

### Fact

حقيقة قابلة للتحقق:

مثال:

```
Entity:
Federal Reserve

Fact:
Federal Funds Rate = 5.50%

Date:
2026-07-01

Evidence:
FOMC Statement
```

---

### Relationship

العلاقة بين الكيانات:

أمثلة:

```
Federal Reserve
        ↓ controls
Interest Rate

Interest Rate
        ↓ affects
Bond Yield

Bond Yield
        ↓ impacts
Portfolio Risk
```

---

# 5. الطبقات المعرفية

## Layer 1 — Entity Layer

من هم اللاعبون؟

يشمل:

* Companies
* Institutions
* Governments
* Markets
* Assets

---

## Layer 2 — Event Layer

ماذا حدث؟

يشمل:

* Releases
* Decisions
* Announcements
* Market Events

---

## Layer 3 — Fact Layer

ما الحقائق الناتجة؟

يشمل:

* Numbers
* Statements
* Metrics
* Changes

---

## Layer 4 — Relationship Layer

ما الروابط؟

يشمل:

* owns
* regulates
* impacts
* competes_with
* depends_on
* correlates_with

---

## Layer 5 — Decision Layer

كيف تؤثر المعرفة على القرار؟

مثال:

```
Oil Price Increase

↓

Energy Sector Margin Expansion

↓

Equity Allocation Consideration

↓

Investment Committee Decision
```

---

# 6. نموذج العلاقة

كل Edge في Knowledge Graph يجب أن يحمل:

```
Relationship Object

{
 source_entity,
 target_entity,
 relationship_type,
 confidence,
 evidence_reference,
 timestamp,
 validity_period
}
```

لا توجد علاقة بلا:

* مصدر
* ثقة
* زمن

---

# 7. الزمن في Knowledge Graph

الأسواق تتغير.

لذلك لا يكفي:

```
Company A owns Company B
```

بل:

```
Company A owns Company B

valid:
2024-01-01 → 2026-03-01

Evidence:
SEC Filing
```

---

# 8. لماذا هذا يمثل Moat؟

النماذج اللغوية يمكن شراؤها.

لكن لا يمكن شراء:

* آلاف الكيانات المنظّمة
* ملايين العلاقات الموثقة
* التاريخ الزمني للأحداث
* سلاسل الأدلة
* نماذج القرار المتراكمة

القيمة ليست في الرسم البياني.

القيمة في:

> Accumulated Institutional Intelligence.

---

# 9. استخدامات Knowledge Graph داخل رؤى

## Research Intelligence

بدل:

"ابحث عن أخبار الشركة"

يصبح:

"ما كل الأحداث التي غيرت تقييم الشركة خلال آخر 5 سنوات؟"

---

## Risk Intelligence

بدل:

"ما المخاطر الحالية؟"

يصبح:

"ما الشبكة الكاملة للتعرض غير المباشر لهذا الأصل؟"

---

## Trading Intelligence

بدل:

"هل يوجد إشارة شراء؟"

يصبح:

"ما الأحداث والسياسات والمؤشرات التي تدعم أو تعارض هذه الإشارة؟"

---

## Compliance Intelligence

بدل:

"أعطني التقرير"

يصبح:

"أعد بناء كل القرارات المرتبطة بهذا الأصل خلال فترة معينة مع الأدلة."

---

# 10. العلاقة مع Intelligence Objects

Knowledge Graph لا يستبدل Intelligence Objects.

بل يغذيها.

```
Knowledge Graph

        ↓

Intelligence Object

{
 claim,
 confidence,
 evidence_chain,
 related_entities,
 historical_context,
 reasoning
}
```

---

# 11. المبدأ المؤسس

> رؤى لا تخزن المعرفة فقط.
>
> رؤى تبني شبكة تفهم كيف ترتبط المعرفة بالقرار.

---

# 12. ما سيتم بناؤه لاحقاً

هذه الوثيقة تفتح الوثائق التالية:

* KNOWLEDGE-ONTOLOGY-MODEL-v1
* ENTITY-RESOLUTION-MODEL-v1
* RELATIONSHIP-MODEL-v1
* GRAPH-QUERY-MODEL-v1
* INTELLIGENCE-REASONING-MODEL-v1

لأن Knowledge Graph بدون Ontology واضحة تتحول إلى مخزن علاقات غير قابل للتوسع.

---

الحالة:
**Approved Conceptual Foundation**

الخطوة التالية المنطقية:
**KNOWLEDGE-ONTOLOGY-MODEL-v1**
لأن الـ Ontology هي التي تحدد "ما الأشياء التي يفهمها رؤى وما العلاقات المسموح بها بينها".

الوثيقة التالية لا يجب أن تكون Graph Query أو تقنية مباشرة؛ الأولوية هي **Ontology** لأنها تحدد قاموس العالم المالي الذي سيبني عليه كل شيء.

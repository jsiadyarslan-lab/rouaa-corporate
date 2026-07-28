# ROUAA · DECISION-MODEL-v1

> **الطبقة التي تحوّل المعرفة والاستدلال إلى قرارات مؤسسية قابلة للتنفيذ، التفسير، والتدقيق.**
>
> فوق:
> REASONING-MODEL-v1
> KNOWLEDGE-GRAPH-MODEL-v1
> INTELLIGENCE-MODEL-v4
>
> وتحت:
> DECISION-GOVERNANCE-MODEL
> DECISION-WORKFLOW-MODEL
> ENTERPRISE-INTEGRATION-MODEL
>
> يجيب عن سؤال واحد:
>
> **كيف تنتقل المؤسسة من "فهم الواقع" إلى "اتخاذ قرار يمكن الدفاع عنه؟"**

> **ملاحظة الإصدار:** هذه النسخة المُحسَّنة تحلّ محل النسخة الأصلية (المؤرشفة في `archive/DECISION-MODEL-v1-original-superseeded.md`). تضيف Decision Formation Engine (4 مراحل)، Decision Confidence Model كمعادلة صريحة، Contrarian Decision Testing، Decision Memory، Decision Quality Score، وجدول الفرق بين Intelligence و Decision.

---

# 0. لماذا هذه الوثيقة؟

معظم أنظمة الذكاء الحالية تتوقف عند:

```
Data
   ↓
Information
   ↓
Insight
```

لكن المؤسسات لا تعمل عند مستوى Insight.

المؤسسة تحتاج:

```
Insight
   ↓
Decision
   ↓
Action
   ↓
Outcome
   ↓
Review
```

الفجوة بين التحليل والقرار هي المكان الذي تخسره المؤسسات:

- وقت
- رأس مال
- فرص
- قدرة على التفسير
- معرفة مؤسسية

رؤى لا تبيع معلومات ولا تحليلات فقط.

رؤى تبني:

> **Decision Intelligence Infrastructure**

---

# 1. تعريف Decision في رؤى

## التعريف الداخلي

> Decision هو كائن مؤسسي يمثل اختيارًا قابلًا للتنفيذ، مبنيًا على أدلة واستدلالات وسيناريوهات، مع تسجيل كامل للسياق والافتراضات والنتيجة.

---

## التعريف الخارجي

لا نقول:

"ننتج قرارات بواسطة AI."

بل:

> "رؤى تمنح المؤسسات طبقة قرار موثقة تجعل كل قرار أسرع، أوضح، وقابلًا لإعادة البناء."

---

# 2. موقع Decision Layer

```
Evidence Foundation
        ↓
Knowledge Layer
   Facts
   Events
   Entities
   Relationships
        ↓
Reasoning Layer
   Context
   Inference
   Hypothesis
   Scenarios
   Confidence
        ↓
⭐ Decision Layer
   Decision
   Recommendation
   Approval
   Action
   Review
        ↓
Institutional Outcome
   Performance
   Risk Reduction
   Compliance
   Learning
```

---

# 3. القرار كـ Intelligence Object

القرار في رؤى ليس نصًا.

هو كائن مؤسسي.

## Decision Object

```
Decision Object
{
  id
  decision_type
  question
  recommendation
  rationale
  evidence_chain
  reasoning_chain
  scenarios
  alternatives
  assumptions
  confidence_score
  risk_assessment
  owner
  approval_status
  execution_status
  outcome_tracking
  audit_history
}
```

---

# 4. أنواع القرارات

رؤى لا تبني نموذج قرار واحد.

لأن المؤسسات لديها عائلات مختلفة من القرارات.

---

## 4.1 Investment Decisions

أمثلة:
- شراء أصل
- بيع أصل
- تعديل وزن محفظة
- تغيير استراتيجية

Decision Object:

```
Decision:        Increase exposure to Energy Sector
Reason:          Supply disruption + pricing power
Confidence:      76%
Risk:            Demand slowdown
Approval:        Investment Committee
```

---

## 4.2 Risk Decisions

أمثلة:
- تخفيض تعرض
- تعديل حدود المخاطر
- تفعيل تحذير

```
Decision:        Reduce Emerging Market Exposure
Trigger:         Currency volatility
Risk Level:      High
Required Action: Portfolio Review
```

---

## 4.3 Research Decisions

أمثلة:
- اعتماد فرضية استثمارية
- إصدار تقرير
- تحديث توصية

---

## 4.4 Operational Decisions

أمثلة:
- تغيير workflow
- تصعيد حالة
- طلب مراجعة بشرية

---

# 5. Decision Lifecycle

كل قرار يمر بدورة حياة محددة:

```
1. Decision Trigger        — حدث أو سؤال
        ↓
2. Intelligence Gathering  — جمع الأدلة
        ↓
3. Reasoning               — تحليل العلاقات والسيناريوهات
        ↓
4. Decision Formation      — تكوين القرار
        ↓
5. Governance Review       — مراجعة واعتماد
        ↓
6. Execution               — تنفيذ
        ↓
7. Outcome Measurement     — قياس النتيجة
        ↓
8. Learning Loop           — تحسين النموذج
```

---

# 6. Decision Formation Engine

تحويل Reasoning إلى قرار.

يتكون من:

## 6.1 Question Definition

كل قرار يبدأ بسؤال.

مثال:

ليس:

"حلل النفط."

بل:

"هل يجب زيادة التعرض لقطاع الطاقة خلال الربع القادم؟"

---

## 6.2 Evidence Package

كل قرار يحصل على:

```
Evidence Package
  - Primary Sources
  - Historical Data
  - Related Events
  - Previous Decisions
  - Market Context
```

---

## 6.3 Alternative Generation

رؤى لا تعرض خيارًا واحدًا.

بل:

```
Option A — Increase Exposure
Option B — Maintain Position
Option C — Reduce Exposure
```

---

## 6.4 Decision Scoring

كل خيار يقيم حسب:

```
- Expected Impact
- Risk
- Confidence
- Evidence Strength
- Time Horizon
- Strategic Alignment
```

---

# 7. Decision Confidence Model

الثقة ليست رأيًا.

هي نتيجة عوامل:

```
Decision Confidence
=
  Evidence Quality
  *
  Reasoning Strength
  *
  Historical Similarity
  *
  Consensus
  *
  Uncertainty
  *
  Contradictions
```

---

مثال:

```
Decision Confidence:    82%
Evidence:               Strong
Reasoning:              Validated
Contradictions:         Low
```

---

# 8. Decision Governance

القرار المؤسسي يحتاج حوكمة.

ليس كل قرار ينفذ مباشرة.

```
Decision
   ↓
Risk Review
   ↓
Compliance Review
   ↓
Investment Committee
   ↓
Approval
   ↓
Execution
```

---

# 9. AI Council داخل القرار

القرار لا يعتمد على Agent واحد.

```
Decision Council
  - Research Agent
  - Risk Agent
  - Macro Agent
  - Contrarian Agent
  - Compliance Agent
        ↓
  Decision Assessment
```

---

# 10. Contrarian Decision Testing

قبل اعتماد القرار:

النظام يحاول إثبات أنه خاطئ.

يسأل:
- ما الافتراض الأضعف؟
- ما السيناريو الذي يفشل القرار؟
- ما البيانات التي تغير الرأي؟

Output:

```
Decision Challenge
  Weak Assumption:     Inflation remains stable
  Failure Scenario:    Energy shock
  Required Monitoring: Oil prices
```

---

# 11. Decision Memory

أحد أهم الأصول الاستراتيجية.

كل قرار يصبح معرفة مستقبلية.

```
Past Decision
   ↓
Reasoning
   ↓
Outcome
   ↓
Learning
```

بعد سنوات:

رؤى تعرف:
- ما القرارات التي نجحت؟
- ما الأنماط المتكررة؟
- أين أخطأت المؤسسة؟

---

# 12. Decision Audit Trail

كل قرار يحمل:

```
Who
Made
Which Decision
When
Based On
Which Evidence
Using Which Reasoning
With Which Confidence
And What Happened Later
```

---

# 13. Decision Quality Measurement

رؤى لا تقيس عدد القرارات فقط.

تقيس جودة القرار.

---

## Decision Quality Score

يعتمد على:

```
- Evidence Completeness
- Reasoning Quality
- Risk Awareness
- Outcome Accuracy
- Post Decision Review
```

---

# 14. العلاقة مع Outcomes

## Faster Decisions
عن طريق: Decision Workflow Automation

## Audit Ready
عن طريق: Decision Object + Audit Trail

## Lower Risk
عن طريق: Scenario + Challenge

## Explainable Research
عن طريق: Evidence-backed Decisions

## Regulatory Traceability
عن طريق: Decision History

## Operational Leverage
عن طريق: Decision Automation

---

# 15. ما يراه العميل

لا يرى:

Decision Object.

يرى:

```
Investment Decision Brief

Question:        Should exposure increase?
Recommendation:  Increase gradually
Confidence:      79%
Supporting Evidence: 12 verified sources
Main Risks:      Demand slowdown
Approval:        Pending Committee Review
```

---

# 16. الفرق بين Intelligence و Decision

| Intelligence | Decision |
|---|---|
| ماذا يحدث؟ | ماذا نفعل؟ |
| فهم الواقع | اختيار مسار |
| تحليل | التزام |
| معرفة | مسؤولية |
| Insight | Action |

---

# 17. Strategic Importance

Decision Model هو المكان الذي تتحول فيه رؤى من:

```
Information Platform
```

إلى:

```
Institutional Operating System
```

لأن المؤسسة لا تدفع مقابل معرفة إضافية.

تدفع مقابل:

> تحسين طريقة اتخاذ القرار.

---

# 18. المبادئ النهائية

1. القرار يبدأ بسؤال وليس ببيانات.
2. كل قرار يحتاج Evidence Chain.
3. كل قرار يحتاج Reasoning Chain.
4. كل قرار يحتاج بدائل.
5. كل قرار يحتاج مسؤولية بشرية واضحة.
6. كل قرار يجب أن يكون قابلًا للمراجعة بعد الزمن.
7. القرارات السابقة تصبح أصولًا معرفية.
8. الهدف ليس استبدال القرار البشري، بل رفع جودته.

---

# STATUS

```
STATUS: FOUNDATIONAL MODEL COMPLETE

DEPENDS ON:
- Knowledge Model
- Ontology
- Entity Resolution
- Relationship Model
- Reasoning Model

ENABLES:
- Decision Governance
- Decision Workflow
- Enterprise Integration
- Customer Implementation

NEXT:
- DECISION-GOVERNANCE-MODEL-v1.md
```

---

بعد هذه الوثيقة يصبح التسلسل المنطقي:

- **18 — Reasoning**: كيف نفهم ونستدل
- **19 — Decision**: كيف نختار ونتصرف
- **20 — Decision Governance**: كيف نضمن أن القرار المؤسسي منضبط وقابل للتدقيق
- **21 — Decision Workflow**: كيف يدخل القرار في عمليات المؤسسة اليومية

الخطوة التالية الطبيعية هي:

**20-DECISION-GOVERNANCE-MODEL-v1.md**

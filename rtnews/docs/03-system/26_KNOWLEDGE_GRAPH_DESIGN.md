# 🕸️ Knowledge Graph Design

> سيُنفذ في المرحلة 6، لكن يجب تصميمه من الآن لضمان توافق البيانات.

## المفهوم

Knowledge Graph يربط الكيانات المالية بعلاقات دلالية.
يسمح بسؤال: "ماذا حدث آخر 10 مرات عندما رفع Fed الفائدة مع تضخم > 5%؟"

## الكيانات (Nodes)

```
Node Types:
├── Institution (Federal Reserve, Apple, SEC)
├── Asset (USD, GOLD, AAPL, BTC)
├── Country (USA, China, Germany)
├── Indicator (CPI, GDP, Unemployment)
├── Event (Rate Decision, Earnings)
├── Person (Powell, Cook)
└── Policy (Quantitative Easing, Tariffs)
```

## العلاقات (Edges)

```
Edge Types:
├── ISSUES (Institution → Event)
│   "Federal Reserve ISSUES Rate Decision"
├── AFFECTS (Event → Asset)
│   "Rate Decision AFFECTS USD"
├── LOCATED_IN (Institution → Country)
│   "Federal Reserve LOCATED_IN USA"
├── MANAGES (Institution → Indicator)
│   "BLS MANAGES CPI"
├── CORRELATES_WITH (Asset ↔ Asset)
│   "GOLD CORRELATES_WITH USD (inverse)"
├── EMPLOYS (Institution → Person)
│   "Federal Reserve EMPLOYS Powell"
├── PRECEDED_BY (Event → Event)
│   "Rate Hike PRECEDED_BY CPI Release"
└── RESPONDS_TO (Asset → Event)
    "USD RESPONDS_TO Rate Decision"
```

## Properties على Edges

```
每个 edge يحوي:
├── weight (قوة العلاقة 0-1)
├── direction (positive/negative)
├── lag (تأخر زمني بالثواني)
├── confidence (0-100)
├── lastObserved (timestamp)
└── observationCount (كم مرة رأينا هذه العلاقة)
```

## أمثلة استعلامات

```
"ماذا حدث لـ GOLD بعد آخر 10 قرارات رفع فائدة؟"
→
MATCH (e:Event {type: 'hike'})-[:AFFECTS]->(a:Asset {symbol: 'GOLD'})
WHERE e.eventDate > '2020-01-01'
RETURN a.direction, a.magnitude, e.eventDate
ORDER BY e.eventDate DESC
LIMIT 10
```

## تنفيذ تقني

### Option A: PostgreSQL + pg_graph
- بسيط، لا بنية إضافية
- مناسب لـ < 1M علاقات

### Option B: Neo4j
- مخصص للـ graph queries
- أسرع للـ traversals المعقدة
- يتطلب بنية منفصلة

### Option C: RedisGraph
- في الذاكرة، سريع جداً
- محدود بالذاكرة المتاحة

**التوصية:** ابدأ بـ PostgreSQL (Option A)، انتقل لـ Neo4j عند الحاجة.

## التكامل مع Events

كل OfficialEvent يُولّد:
```
1. Node for the Event
2. Edge: Source → ISSUES → Event
3. Edges: Event → AFFECTS → Asset (لكل affectedAsset)
4. Edge: Event → LOCATED_IN → Country
5. Edge: Event → PRECEDED_BY → lastEvent (من نفس النوع)
```

## التكامل مع Documents

كل OfficialDocument يُولّد:
```
1. Node for the Document
2. Edge: Source → PUBLISHES → Document
3. Edge: Document → DERIVES → Event
```

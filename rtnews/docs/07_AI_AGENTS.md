# 🤖 AI Agents

> الـ AI Agents هم "الموظفون" الذين يشغلون النظام تلقائياً.

## وكلاء المرحلة 1-3 (Foundation)

### Agent 1: Source Discovery Agent
**المرحلة:** 1 (Source Registry)  
**الوظيفة:** يبحث عن مصادر رسمية جديدة

```
Input: Source type + Country
Output: List of candidate sources
Process:
  1. Search for official websites
  2. Check for RSS/API
  3. Validate authority
  4. Suggest for admin approval
```

---

### Agent 2: Source Monitor Agent
**المرحلة:** 2 (Document Engine)  
**الوظيفة:** يراقب المصادر النشطة

```
Input: Active sources list
Output: New documents detected
Process:
  1. Poll RSS/API at scheduled intervals
  2. Compare with last fetch
  3. Queue new documents
  4. Trigger Document Pipeline
```

---

### Agent 3: Document Parser Agent
**المرحلة:** 2 (Document Engine)  
**الوظيفة:** يحلل الوثائق الخام

```
Input: Raw document (HTML/PDF/JSON)
Output: Extracted text + metadata + hash
Process:
  1. Detect document type
  2. Parse structure
  3. Extract clean text
  4. Generate SHA-256
  5. Save to R2 + DB
```

---

### Agent 4: Fact Extractor Agent
**المرحلة:** 3 (Event Engine)  
**الوظيفة:** يستخرج الحقائق من الوثائق

```
Input: Parsed document
Output: List of facts
Process:
  1. AI reads extracted text
  2. Identifies: numbers, decisions, dates, entities
  3. Classifies fact type
  4. Assigns confidence
  5. Links to source paragraph
```

---

### Agent 5: Event Builder Agent
**المرحلة:** 3 (Event Engine)  
**الوظيفة:** يبني Event objects منتظمة

```
Input: Extracted facts
Output: OfficialEvent record
Process:
  1. Group related facts
  2. Determine event type
  3. Extract value, direction, entity
  4. Identify affected assets
  5. Assign impact level
  6. Save to DB
```

---

### Agent 6: Evidence Linker Agent
**المرحلة:** 4 (Evidence System)  
**الوظيفة:** يربط كل Event بالأدلة

```
Input: OfficialEvent
Output: Evidence records
Process:
  1. Find source document
  2. Extract relevant paragraph/table
  3. Generate citation
  4. Verify hash
  5. Save Evidence record
```

## وكلاء المرحلة 5+ (Newsroom)

### Agent 7: Newsworthiness Agent
**الوظيفة:** يقرر هل الحدث يستحق النشر

```
Input: OfficialEvent
Output: { publish: boolean, priority: string }
Criteria:
  - Impact level (high/critical → publish)
  - Affected assets (major assets → publish)
  - Source authority (official → publish)
  - Uniqueness (first of its kind → publish)
```

---

### Agent 8: News Writer Agent
**الوظيفة:** يكتب الخبر بأسلوب صحفي

```
Input: OfficialEvent + Evidence
Output: NewsItem draft
Process:
  1. Read event + evidence
  2. Write title (Event + Impact)
  3. Write body (lead + details + context)
  4. Cite evidence [1], [2], [3]
  5. Generate AI Analysis [1]-[7]
  6. Save draft for review
```

---

### Agent 9: Fact Verification Agent
**الوظيفة:** يتحقق من كل ادعاء في الخبر

```
Input: NewsItem draft
Output: { verified: boolean, issues: [] }
Process:
  1. Parse each claim
  2. Find matching Evidence
  3. Verify hash + source
  4. Flag unsupported claims
  5. Reject if any claim lacks evidence
```

---

### Agent 10: Impact Analyst Agent
**الوظيفة:** يحلل تأثير الحدث على الأسواق

```
Input: OfficialEvent
Output: Impact analysis
Process:
  1. Identify affected assets
  2. Determine direction (up/down/neutral)
  3. Estimate magnitude
  4. Find historical parallels
  5. Generate scenarios
```

---

### Agent 11: Financial Editor Agent
**الوظيفة:** يراجع ويحرر الخبر النهائي

```
Input: NewsItem draft + Verification + Impact
Output: Final NewsItem
Process:
  1. Check language quality
  2. Verify structure
  3. Ensure evidence links
  4. Format for publication
  5. Approve for publishing
```

## وكلاء المرحلة 6+ (Intelligence)

### Agent 12: Knowledge Graph Builder
**الوظيفة:** يبني العلاقات بين الكيانات

### Agent 13: AI Research Analyst
**الوظيفة:** يجيب على أسئلة المستخدمين

### Agent 14: Historical Comparator
**الوظيفة:** يقارن الأحداث الحالية بالتاريخية

## أولوية البناء

```
Phase 1: Agent 1 (Source Discovery)
Phase 2: Agent 2 (Monitor) + Agent 3 (Parser)
Phase 3: Agent 4 (Fact) + Agent 5 (Event) 
Phase 4: Agent 6 (Evidence)
Phase 5: Agent 7-11 (Newsroom)
Phase 6+: Agent 12-14 (Intelligence)
```

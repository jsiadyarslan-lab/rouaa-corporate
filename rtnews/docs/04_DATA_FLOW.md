# 🔄 Data Flow

## المسار الكامل: من المصدر إلى القارئ

```
1. Source Registry
   ↓
2. Scheduler triggers Fetch
   ↓
3. Adapter fetches Document (RSS/HTML/PDF/API)
   ↓
4. Raw content stored in R2
   ↓
5. Parser extracts text
   ↓
6. Hash generated (SHA-256)
   ↓
7. Document saved to DB
   ↓
8. Fact Extractor (AI) extracts facts
   ↓
9. Event Builder creates Event object
   ↓
10. Evidence Linker connects Event → Document → Source
    ↓
11. Impact Analyzer determines affected assets
    ↓
12. Knowledge Graph updates relationships
    ↓
13. Publication decision (newsworthy?)
    ↓
14. If yes → Newsroom generates article
    ↓
15. Article published with Evidence links
    ↓
16. Reader sees: Article + Evidence + Source + History
```

## مثال عملي: قرار الفائدة الفيدرالي

### Step 1: Schedule Trigger
```
Time: 2026-07-16 14:00 UTC
Source: Federal Reserve (official_source.id = "fed")
Frequency: realtime (event-driven)
```

### Step 2: Fetch
```
Adapter: RSSAdapter
URL: https://federalreserve.gov/feeds/press_all.xml
Detected: New item "FOMC Statement - July 2026"
```

### Step 3: Raw Storage
```
R2 URL: https://r2.../docs/fed-2026-07-16-fomc.html
Size: 45KB
```

### Step 4: Parse + Extract
```
documentType: html
extractedText: "The Federal Open Market Committee decided to raise 
the target range for the federal funds rate by 25 basis points to 
5.50 to 5.75 percent..."
hash: a3f2e1b8c9...
```

### Step 5: Fact Extraction (AI)
```
Facts extracted:
- type: rate_decision
- entity: Federal Reserve
- value: +25bps
- new_rate: 5.50-5.75%
- direction: increase
- confidence: 100%
```

### Step 6: Event Creation
```
Event:
  type: rate_decision
  entity: Federal Reserve
  country: USA
  value: +25bps
  direction: increase
  affectedAssets: [
    {symbol: "USD", direction: "up", reason: "hawkish"},
    {symbol: "GOLD", direction: "down", reason: "higher rates"},
    {symbol: "BONDS", direction: "down", reason: "yield increase"}
  ]
  confidence: 100%
  eventDate: 2026-07-16T14:00:00Z
```

### Step 7: Evidence Linking
```
Evidence:
  event → fed-rate-decision-2026-07-16
  document → fed-2026-07-16-fomc.html
  source → Federal Reserve
  paragraph: "para 2, line 3"
  hash: a3f2e1b8c9...
```

### Step 8: Publication Decision
```
Newsworthy: YES (impact: high)
→ Trigger Newsroom
```

### Step 9: Newsroom
```
Publication:
  type: news
  locale: ar
  title: "الفيدرالي يرفع الفائدة 25 نقطة أساس إلى 5.50%"
  body: [AI-generated with evidence citations]
  evidenceUrls: [link to original document]
  sourceId: fed
  eventId: [link to Event]
```

### Step 10: Reader View
```
Reader sees:
┌─────────────────────────────────┐
│ ⚡ EVENT: Rate Decision          │
│ Entity: Federal Reserve         │
│ Value: +25bps → 5.50%           │
│ Date: 2026-07-16 14:00 UTC      │
│ Confidence: 100% (Official)     │
├─────────────────────────────────┤
│ 📰 NEWS: الفيدرالي يرفع الفائدة  │
│ [AI-generated article body]     │
├─────────────────────────────────┤
│ 📋 EVIDENCE:                    │
│ 📄 FOMC Statement (HTML)        │
│    URL | Fetched: 14:02 UTC     │
│    Hash: a3f2e1b8...            │
│ 🏛️ Source: Federal Reserve      │
│    [View Source Profile →]      │
├─────────────────────────────────┤
│ 📊 IMPACT:                      │
│ USD ↑ | GOLD ↓ | BONDS ↓        │
│ Historical: Last 10 rate hikes  │
└─────────────────────────────────┘
```

## أنواع التدفقات

### Flow A: Scheduled (مجدول)
```
Scheduler → Source → Document → Event → Publication
```
مثال: تقارير BLS الشهرية

### Flow B: Real-time (فوري)
```
RSS Update → Source → Document → Event → Alert
```
مثال: بيانات صحفي عاجل للفيدرالي

### Flow C: On-demand (عند الطلب)
```
User Question → Knowledge Graph → Events → AI Analyst → Report
```
مثال: "لماذا تحرك الذهب اليوم؟"

### Flow D: Historical (تاريخي)
```
Batch Import → Source → Documents → Events → Archive
```
مثال: استيراد قرارات الفائدة التاريخية

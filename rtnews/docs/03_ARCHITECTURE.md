# 🏗️ Architecture

## نظرة عامة

النظام مكون من 7 طبقات متراكمة. كل طبقة تعتمد على ما تحتها.

```
┌─────────────────────────────────────┐
│ Layer 7: Applications               │
│ (Web, Terminal, API, Mobile)        │
├─────────────────────────────────────┤
│ Layer 6: AI Intelligence            │
│ (Analyst, Research, Insights)       │
├─────────────────────────────────────┤
│ Layer 5: Knowledge Graph            │
│ (Relationships, History, Context)   │
├─────────────────────────────────────┤
│ Layer 4: Event & Evidence Engine    │
│ (Events, Facts, Evidence)           │
├─────────────────────────────────────┤
│ Layer 3: Document Intelligence      │
│ (Fetch, Parse, Extract, Store)      │
├─────────────────────────────────────┤
│ Layer 2: Source Registry            │
│ (Official Sources, Adapters)        │
├─────────────────────────────────────┤
│ Layer 1: Infrastructure             │
│ (DB, R2, AI Providers, Queue)       │
└─────────────────────────────────────┘
```

## Layer 1: Infrastructure

### قاعدة البيانات
- **PostgreSQL** (Railway) — البيانات الأساسية
- **Prisma ORM** — الـ schema والـ migrations
- **R2 (Cloudflare)** — تخزين الوثائق الخام والصور

### AI Providers
- HuggingFace (Qwen2.5-72B) — التحليل الأساسي
- Groq — السرعة
- OpenRouter — التعدد
- DeepSeek (مستقبلاً) — الاستدلال

### Queue System (مستقبلاً)
- BullMQ + Redis — للعمليات غير المتزامنة
- مطلوب للـ Document Engine (جلب + parsing)

## Layer 2: Source Registry

```
OfficialSource (DB Table)
    ↓
SourceAdapter (interface)
    ↓
RSSAdapter | APIAdapter | PDFAdapter | HTMLAdapter
```

كل مصدر له Adapter يحدد:
- كيف يُجلب (fetch method)
- كيف يُحدّث (frequency)
- كيف يُتحقق (validation)

## Layer 3: Document Intelligence

```
Fetcher → Raw Storage → Parser → Text Extractor → Document DB
```

الـ Pipeline:
1. **Fetcher**: يجلب الوثيقة من المصدر (RSS/HTML/PDF/API)
2. **Raw Storage**: يخزن النسخة الأصلية في R2
3. **Parser**: يحلل البنية (HTML structure, PDF layout, JSON schema)
4. **Text Extractor**: يستخرج النص الصافي
5. **Hash Generator**: يولد SHA-256 للتحقق
6. **Document DB**: يخزن الـ metadata + extractedText

## Layer 4: Event & Evidence Engine

```
Document → Fact Extractor → Event Builder → Evidence Linker
```

1. **Fact Extractor**: يستخرج الحقائق من النص (AI-powered)
2. **Event Builder**: يبني Event object منتظم
3. **Evidence Linker**: يربط كل Event بـ Document + Source + Hash

## Layer 5: Knowledge Graph

```
Events → Relationships → Graph
```

- كل Event يرتبط بـ Entities (institutions, assets, countries)
- العلاقات تُبنى تدريجياً
- الاستعلام: "ماذا حدث آخر 10 مرات عندما..."

## Layer 6: AI Intelligence

```
RAG Pipeline → AI Analyst → Insights
```

- **RAG**: Retrieval-Augmented Generation فوق Events + Documents
- **AI Analyst**: يجيب على أسئلة طبيعية
- **Insights**: استنتاجات مع citations

## Layer 7: Applications

- **Web Platform**: rouatradingnews.com
- **Newsroom**: وكالة الأنباa (واجهة واحدة)
- **API Platform**: REST + WebSocket
- **Terminal** (مستقبلاً): Institutional

## Folder Structure المقترح

```
src/
├── lib/
│   ├── db/                    # Prisma + db-init
│   ├── ai/                    # AI providers
│   └── utils/
├── services/
│   ├── source-registry/       # Layer 2
│   │   ├── adapters/
│   │   ├── lib/
│   │   └── __tests__/
│   ├── document-engine/       # Layer 3
│   │   ├── fetchers/
│   │   ├── parsers/
│   │   ├── extractors/
│   │   └── lib/
│   ├── event-engine/          # Layer 4
│   │   ├── extractors/
│   │   ├── builders/
│   │   └── lib/
│   ├── evidence-system/       # Layer 4
│   ├── knowledge-graph/       # Layer 5
│   ├── ai-intelligence/       # Layer 6
│   └── news-agency/           # Layer 7 (Newsroom — frozen until Phase 3)
├── app/
│   ├── api/
│   ├── sources/               # /sources page
│   ├── events/                # /events page
│   ├── documents/             # /documents page
│   └── ...
└── components/
```

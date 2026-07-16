# 🗄️ Database Design

> ملاحظة: هذا التصميم أولي. سيُ refinement بعد إكمال Phase -1.

## استراتيجية قاعدة البيانات

### Database
- **PostgreSQL** على Railway
- **Prisma ORM** للـ schema والـ migrations
- **db-init.ts** للـ ALTER TABLE الآمنة على الإنتاج

### Storage
- **R2 (Cloudflare)** للوثائق الخام والصور
- **DB** للـ metadata فقط (URL references)

## الجداول الموجودة (الحالية)

| الجدول | الحالة | ملاحظة |
|--------|--------|--------|
| NewsItem | موجود | يحتاج sourceId FK (Phase 1) |
| AgencyEvent | موجود | يحتاج علاقة Prisma حقيقية |
| EconomicReport | موجود | يحتاج sourceUrls display |
| MarketAnalysis | موجود | يحتاج sourceId |
| GeopoliticalRisk | موجود | يحتاج sourceId |
| Infographic | موجود | لا تغيير |

## الجداول الجديدة (المطلوب بناؤها)

### Phase 1: OfficialSource

```prisma
model OfficialSource {
  id              String   @id @default(cuid())
  name            String
  slug            String   @unique
  shortName       String?
  country         String?
  countryCode     String?
  region          String?
  type            String   @default("other")
  category        String?
  authorityScore  Int      @default(100)
  reliability     String   @default("official")
  website         String?
  rss             String?
  api             String?
  accessMethods   String   @default("[]")
  language        String   @default("en")
  locale          String   @default("en")
  updateFrequency String?
  timezone        String?
  relatedAssets   String   @default("[]")
  relatedEntities String   @default("[]")
  description     String?  @db.Text
  logoUrl         String?
  isActive        Boolean  @default(true)
  isVerified      Boolean  @default(false)
  lastFetchedAt   DateTime?
  totalEvents     Int      @default(0)
  totalDocuments  Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  documents OfficialDocument[]
  events    OfficialEvent[]

  @@index([type, isActive])
  @@index([country])
  @@index([region])
  @@index([authorityScore])
  @@index([isActive, lastFetchedAt])
  @@map("official_sources")
}
```

### Phase 2: OfficialDocument

```prisma
model OfficialDocument {
  id            String   @id @default(cuid())
  sourceId      String
  source        OfficialSource @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  url           String
  documentType  String   @default("html")
  title         String?
  rawContent    String?  @db.Text
  extractedText String?  @db.Text
  hash          String?
  snapshotUrl   String?
  language      String   @default("en")
  publishedAt   DateTime?
  fetchedAt     DateTime @default(now())
  metadata      String   @default("{}")

  events OfficialEvent[]

  @@unique([sourceId, url])
  @@index([sourceId, fetchedAt])
  @@index([documentType])
  @@index([publishedAt])
  @@map("official_documents")
}
```

### Phase 3: OfficialEvent

```prisma
model OfficialEvent {
  id              String   @id @default(cuid())
  documentId      String?
  document        OfficialDocument? @relation(fields: [documentId], references: [id], onDelete: SetNull)
  sourceId        String
  source          OfficialSource @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  type            String
  title           String
  entity          String
  entitySymbol    String?
  country         String?
  countryCode     String?
  value           String?
  direction       String?
  affectedAssets  String   @default("[]")
  confidence      Int      @default(100)
  impactLevel     String   @default("medium")
  eventDate       DateTime
  publishedAt     DateTime?
  createdAt       DateTime @default(now())

  @@index([sourceId, eventDate])
  @@index([type, eventDate])
  @@index([entity])
  @@index([countryCode])
  @@index([eventDate])
  @@map("official_events")
}
```

### Phase 4: Evidence

```prisma
model Evidence {
  id          String   @id @default(cuid())
  eventId     String?
  documentId  String
  type        String   // pdf | html | quote | table | chart
  url         String
  paragraph   String?  // reference within document
  hash        String?
  fetchedAt   DateTime @default(now())
  
  @@index([eventId])
  @@index([documentId])
  @@map("evidence")
}
```

## استراتيجية Migration

1. **لا destructive migrations على الإنتاج**
2. كل ALTER TABLE يستخدم `IF NOT EXISTS`
3. db-init.ts يدير التغييرات تلقائياً
4. Prisma schema للـ development فقط (generate)

## العلاقات بين الجداول

```
OfficialSource (1) ─── (N) OfficialDocument
OfficialSource (1) ─── (N) OfficialEvent
OfficialDocument (1) ─ (N) OfficialEvent
OfficialEvent (1) ──── (N) Evidence
OfficialDocument (1) ─ (N) Evidence
NewsItem (N) ──────── (1) OfficialSource (via sourceId, future)
NewsItem (N) ──────── (1) OfficialEvent (via eventId, future)
```

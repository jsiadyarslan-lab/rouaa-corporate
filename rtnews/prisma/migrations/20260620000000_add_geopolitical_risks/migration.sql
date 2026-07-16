-- CreateTable: GeopoliticalRisk
CREATE TABLE IF NOT EXISTS "geopolitical_risks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "locale" TEXT NOT NULL DEFAULT 'ar',
    "riskCategory" TEXT NOT NULL DEFAULT 'conflict',
    "riskLevel" TEXT NOT NULL DEFAULT 'moderate',
    "riskScore" INTEGER NOT NULL DEFAULT 50,
    "aiGprScore" DOUBLE PRECISION,
    "acledEventCount" INTEGER NOT NULL DEFAULT 0,
    "acledFatalityCount" INTEGER NOT NULL DEFAULT 0,
    "worldBankStability" DOUBLE PRECISION,
    "gdeltTone" DOUBLE PRECISION,
    "affectedRegions" JSONB NOT NULL DEFAULT '[]',
    "affectedCountries" JSONB NOT NULL DEFAULT '[]',
    "affectedAssets" JSONB NOT NULL DEFAULT '[]',
    "scenarios" JSONB,
    "tradeRoutes" JSONB,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "imageUrl" TEXT,
    "sourceUrls" JSONB NOT NULL DEFAULT '[]',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "geopolitical_risks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "geopolitical_risks_riskCategory_locale_idx" ON "geopolitical_risks"("riskCategory", "locale");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "geopolitical_risks_riskLevel_idx" ON "geopolitical_risks"("riskLevel");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "geopolitical_risks_publishedAt_idx" ON "geopolitical_risks"("publishedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "geopolitical_risks_locale_isPublished_publishedAt_idx" ON "geopolitical_risks"("locale", "isPublished", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "geopolitical_risks_slug_locale_key" ON "geopolitical_risks"("slug", "locale");

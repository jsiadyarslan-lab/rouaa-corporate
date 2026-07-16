-- AlterTable: Add style and marketImpact columns to video_reports
-- "style": "pulse" = Bloomberg style, "dataviz" = Al Jazeera style
-- "marketImpact": bullish | bearish | neutral — matches EconomicReport.marketImpact

-- Add style column if it doesn't already exist (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_reports' AND column_name = 'style'
  ) THEN
    ALTER TABLE "video_reports" ADD COLUMN "style" TEXT NOT NULL DEFAULT 'pulse';
  END IF;
END $$;

-- Add marketImpact column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_reports' AND column_name = 'market_impact'
  ) THEN
    ALTER TABLE "video_reports" ADD COLUMN "market_impact" TEXT NOT NULL DEFAULT 'neutral';
  END IF;
END $$;

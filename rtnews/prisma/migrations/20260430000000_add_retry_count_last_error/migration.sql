-- AlterTable
-- Add retryCount and lastError fields to news_items for proper failure tracking
-- Instead of pushing failed articles to the past (which hides them forever),
-- we now track how many times processing failed and what the last error was.
-- The pipeline will re-process failed articles up to MAX_RETRIES times.

ALTER TABLE "news_items" ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "news_items" ADD COLUMN "lastError" TEXT;

-- Reset any articles that were pushed to the far past (fetchedAt > 25 days ago)
-- back to recent time so they can be re-processed with the new retry logic
UPDATE "news_items"
SET "fetchedAt" = NOW() - INTERVAL '1 hour',
    "retryCount" = 0,
    "lastError" = 'Recovered from far-past push'
WHERE "fetchedAt" < NOW() - INTERVAL '25 days'
  AND "isReady" = false
  AND "processingStage" NOT IN ('analyzed', 'imaged');

-- AlterTable: Add style column to video_reports
-- "pulse" = Bloomberg style, "dataviz" = Al Jazeera style
ALTER TABLE "video_reports" ADD COLUMN "style" TEXT NOT NULL DEFAULT 'pulse';

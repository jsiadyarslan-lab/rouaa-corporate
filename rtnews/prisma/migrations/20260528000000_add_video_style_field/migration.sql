-- AlterTable: Add style field to video_reports (pulse | dataviz)
ALTER TABLE "video_reports" ADD COLUMN "style" TEXT NOT NULL DEFAULT 'pulse';

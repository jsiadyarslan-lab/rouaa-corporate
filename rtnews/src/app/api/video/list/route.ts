// ─── Video List API Route ───────────────────────────────────
// Returns list of video reports from the database
// Admin mode: returns ALL videos (including failed/processing) when admin=true
// Also includes batch R2 recovery for videos that lost their local files

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isR2VideoUrl } from '@/lib/video-storage';
import { getR2Config } from '@/lib/r2-client';

export const dynamic = 'force-dynamic';

// ─── One-time legacy backfill ────────────────────────────
// Older completed videos were created before `isPublished` was honored, so they
// have `isPublished=false` AND `publishedAt=null`. Since there was previously no
// UI to hide a video, all such legacy completed videos should be public. We
// auto-publish them exactly once per server lifetime. User-hidden videos
// (isPublished=false but publishedAt != null) are NOT touched.
let legacyBackfillDone = false;
async function backfillLegacyPublishedVideos() {
  if (legacyBackfillDone) return;
  legacyBackfillDone = true;
  try {
    const result = await db.videoReport.updateMany({
      where: {
        status: 'completed',
        isPublished: false,
        publishedAt: null,
      },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
    });
    if (result.count > 0) {
      console.log(`[VideoList] Backfilled ${result.count} legacy completed videos to isPublished=true`);
    }
  } catch (err: any) {
    console.warn('[VideoList] Legacy backfill failed:', err.message);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'ar';
    const assetClass = searchParams.get('assetClass') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const admin = searchParams.get('admin') === 'true';

    // Backfill legacy videos on every request (no-op after first run)
    await backfillLegacyPublishedVideos();

    // In admin mode: show ALL videos (including failed, processing, hidden)
    // Public mode: only show completed AND explicitly published videos
    const where: any = admin
      ? { locale }
      : {
          locale,
          status: 'completed',
          isPublished: true,
        };

    if (assetClass) where.assetClass = assetClass;

    const [videos, total] = await Promise.all([
      db.videoReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          symbol: true,
          assetName: true,
          locale: true,
          reportType: true,
          assetClass: true,
          videoUrl: true,
          thumbnailUrl: true,
          duration: true,
          status: true,
          error: true,
          marketImpact: true,
          isPublished: true,
          sourceReportId: true,
          sourceType: true,
          style: true,
          chartMode: true,
          viewCount: true,
          publishedAt: true,
          createdAt: true,
        },
      }),
      db.videoReport.count({ where }),
    ]);

    // Batch R2 recovery: construct R2 URLs for completed videos with local URLs
    // Strategy: construct R2 URL directly (no HeadObject check) — if the file
    // was uploaded to R2, the URL will work. If not, the browser handles it gracefully.
    const r2Config = getR2Config();
    if (r2Config && r2Config.publicUrl && !admin) {
      for (const video of videos) {
        if (video.status === 'completed' && video.videoUrl && !isR2VideoUrl(video.videoUrl)) {
          const r2Key = `videos/${video.id}.mp4`;
          const r2Url = `${r2Config.publicUrl.replace(/\/$/, '')}/${r2Key}`;
          console.log(`[VideoList] Recovering R2 URL for ${video.id}`);
          try {
            await db.videoReport.update({
              where: { id: video.id },
              data: {
                videoUrl: r2Url,
                thumbnailUrl: video.thumbnailUrl && !isR2VideoUrl(video.thumbnailUrl)
                  ? `${r2Config.publicUrl.replace(/\/$/, '')}/videos/${video.id}_thumb.png`
                  : video.thumbnailUrl,
              },
            });
          } catch {}
          video.videoUrl = r2Url;
          if (video.thumbnailUrl && !isR2VideoUrl(video.thumbnailUrl)) {
            video.thumbnailUrl = `${r2Config.publicUrl.replace(/\/$/, '')}/videos/${video.id}_thumb.png`;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      videos,
      total,
      page,
      limit,
    });

  } catch (err: any) {
    console.error('[VideoList] Error:', err.message);
    return NextResponse.json(
      { success: false, error: err.message, videos: [], total: 0 },
      { status: 500 }
    );
  }
}

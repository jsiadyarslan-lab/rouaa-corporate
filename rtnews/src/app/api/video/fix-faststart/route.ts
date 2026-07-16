// ─── Video Faststart Fix API Route ──────────────────────────
// One-time migration: Downloads R2 videos, re-encodes with -movflags +faststart,
// and re-uploads to R2. This fixes videos that can't play in browsers because
// the moov atom was at the end of the file.
//
// Can be triggered via: POST /api/video/fix-faststart?key=fix-videos-2026

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isR2VideoUrl, uploadVideoBufferToR2 } from '@/lib/video-storage';
import { execSync } from 'child_process';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key') || request.nextUrl.searchParams.get('key');
  if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'fix-videos-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const videos = await db.videoReport.findMany({
      where: { status: 'completed', videoUrl: { not: null } },
      select: { id: true, videoUrl: true, title: true },
    });

    const r2Videos = videos.filter(v => v.videoUrl && isR2VideoUrl(v.videoUrl!));
    console.log(`[FixFaststart] Found ${r2Videos.length} R2 videos to check`);

    const results: { id: string; status: string; message: string }[] = [];
    const tmpDir = join(tmpdir(), 'roua-faststart-fix');
    execSync(`mkdir -p "${tmpDir}"`, { stdio: 'ignore' });

    for (const video of r2Videos) {
      try {
        const videoUrl = video.videoUrl!;
        console.log(`[FixFaststart] Processing ${video.id}...`);

        const tmpOriginal = join(tmpDir, `${video.id}_original.mp4`);
        const tmpFixed = join(tmpDir, `${video.id}_fixed.mp4`);

        execSync(`curl -k -s -o "${tmpOriginal}" "${videoUrl}"`, {
          timeout: 120000, stdio: 'ignore',
        });

        if (!existsSync(tmpOriginal)) {
          results.push({ id: video.id, status: 'error', message: 'Download failed' });
          continue;
        }

        // Check if moov is already at the beginning
        const stat = readFileSync(tmpOriginal);
        const headData = stat.slice(0, Math.min(4096, stat.length));
        if (headData.includes(Buffer.from('moov'))) {
          results.push({ id: video.id, status: 'skipped', message: 'Already has faststart' });
          try { unlinkSync(tmpOriginal); } catch {}
          continue;
        }

        // Fix with qt-faststart (fast, no re-encoding)
        try {
          execSync(`qt-faststart "${tmpOriginal}" "${tmpFixed}"`, { timeout: 60000, stdio: 'ignore' });
        } catch {
          execSync(`ffmpeg -y -i "${tmpOriginal}" -c copy -movflags +faststart "${tmpFixed}"`, { timeout: 120000, stdio: 'ignore' });
        }

        if (!existsSync(tmpFixed)) {
          results.push({ id: video.id, status: 'error', message: 'Faststart fix failed' });
          try { unlinkSync(tmpOriginal); } catch {}
          continue;
        }

        const fixedBuffer = readFileSync(tmpFixed);
        const uploadResult = await uploadVideoBufferToR2(video.id, fixedBuffer, fixedBuffer.length);

        if (uploadResult.success) {
          results.push({ id: video.id, status: 'fixed', message: `Re-uploaded with faststart (${(fixedBuffer.length / 1024 / 1024).toFixed(1)}MB)` });
        } else {
          results.push({ id: video.id, status: 'error', message: `R2 upload failed: ${uploadResult.error}` });
        }

        try { unlinkSync(tmpOriginal); } catch {}
        try { unlinkSync(tmpFixed); } catch {}

      } catch (err: any) {
        results.push({ id: video.id, status: 'error', message: err.message?.slice(0, 100) });
      }
    }

    return NextResponse.json({ success: true, processed: r2Videos.length, results });
  } catch (err: any) {
    console.error('[FixFaststart] Error:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

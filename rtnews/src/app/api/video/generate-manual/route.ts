// ═══ Manual Video Generation API ═══
// Accepts user-defined scenes with separate narration/display/image fields
// Calls scripts/video-renderer-manual.mjs to produce the final video

import { NextRequest, NextResponse } from 'next/server';
import { db, safeDBQuery } from '@/lib/db';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, mkdirSync, existsSync, unlinkSync, statSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { uploadVideoToR2, uploadThumbnailToR2, isR2VideoAvailable } from '@/lib/video-storage';

const execFileAsync = promisify(execFile);
const VIDEO_DIR = join(process.cwd(), 'public', 'generated', 'videos');
const RENDERER_SCRIPT = join(process.cwd(), 'scripts', 'video-renderer-v2.mjs');

function ensureVideoDir() {
  if (!existsSync(VIDEO_DIR)) mkdirSync(VIDEO_DIR, { recursive: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      locale = 'ar',
      coverPrompt = '',
      music = 'none',
      outroText = '',
      scenes = [],
    } = body;

    if (!title || !scenes || scenes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Title and at least one scene are required' },
        { status: 400 }
      );
    }

    // Validate each scene has required fields
    for (let i = 0; i < scenes.length; i++) {
      if (!scenes[i].title || !scenes[i].narrationText) {
        return NextResponse.json(
          { success: false, error: `Scene ${i + 1} is missing title or narration text` },
          { status: 400 }
        );
      }
    }

    ensureVideoDir();

    const videoId = randomUUID();
    const slug = `manual-${Date.now()}`;
    const cleanTitle = title.replace(/[^A-Za-z0-9\u0600-\u06FF:_.\-\s]/g, '').slice(0, 100);

    // Create VideoReport entry
    let videoReport: any;
    try {
      videoReport = await safeDBQuery(
        () => db.videoReport.create({
          data: {
            id: videoId,
            title: cleanTitle,
            slug,
            symbol: 'MANUAL',
            assetName: cleanTitle,
            locale: locale === 'en' ? 'en' : locale === 'fr' ? 'fr' : locale === 'tr' ? 'tr' : locale === 'es' ? 'es' : 'ar',
            reportType: 'manual',
            assetClass: 'manual',
            chartMode: 'manual',
            style: 'manual',
            marketImpact: 'neutral',
            analysisText: '',
            status: 'processing',
            isPublished: false,
          },
        }),
        'videoReport.create.manual'
      );
    } catch (dbErr: any) {
      return NextResponse.json({ success: false, error: 'DB error: ' + dbErr.message }, { status: 500 });
    }

    if (!videoReport) {
      return NextResponse.json({ success: false, error: 'DB connection failed' }, { status: 500 });
    }

    // Write input JSON for the renderer
    const inputJsonPath = join(VIDEO_DIR, `${videoId}_input.json`);
    const outputMp4Path = join(VIDEO_DIR, `${videoId}.mp4`);
    const thumbnailPath = join(VIDEO_DIR, `${videoId}_thumb.png`);

    const rendererData = {
      title,
      locale,
      coverPrompt,
      music,
      outroText,
      scenes: scenes.map((s: any) => ({
        title: s.title,
        imagePrompt: s.imagePrompt || '',
        narrationText: s.narrationText,
        displayText: s.displayText || '',
        duration: s.duration || 5,
        transition: s.transition || 'fade',
      })),
    };

    writeFileSync(inputJsonPath, JSON.stringify(rendererData, null, 2), 'utf-8');

    // Check renderer script exists
    if (!existsSync(RENDERER_SCRIPT)) {
      await safeDBQuery(
        () => db.videoReport.update({
          where: { id: videoId },
          data: { status: 'failed', error: 'Renderer script not found' },
        }),
        'videoReport.update.missingRenderer'
      );
      return NextResponse.json({ success: false, error: 'Renderer script not found', videoId }, { status: 500 });
    }

    // Return immediately — generation runs in background
    const immediateResponse = NextResponse.json({
      success: true,
      videoId,
      slug,
      title: cleanTitle,
      status: 'processing',
      message: 'Manual video generation started. Poll /api/video/[id] for status.',
    }, { status: 202 });

    // Background generation
    (async () => {
      const RENDER_TIMEOUT = 25 * 60 * 1000;
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Manual video generation timed out after 25 minutes')), RENDER_TIMEOUT)
      );

      try {
        await Promise.race([
          (async () => {
            const { stdout, stderr } = await execFileAsync('node', [
              '--max-old-space-size=512',
              '--expose-gc',
              '--dns-result-order=ipv4first',
              RENDERER_SCRIPT,
              '--input', inputJsonPath,
              '--output', outputMp4Path,
            ], {
              timeout: 1500000,
              maxBuffer: 100 * 1024 * 1024,
              env: { ...process.env, NODE_ENV: 'production', NODE_OPTIONS: '--dns-result-order=ipv4first' },
            });

            console.log(`[ManualVideo] Renderer output: ${stdout?.slice(-500) || 'none'}`);
            if (stderr) console.warn(`[ManualVideo] Renderer stderr: ${stderr?.slice(-300) || 'none'}`);

            if (!existsSync(outputMp4Path)) {
              throw new Error('Video file was not created');
            }

            // Generate thumbnail
            try {
              const { execSync } = require('child_process');
              execSync(`ffmpeg -y -i "${outputMp4Path}" -vframes 1 -q:v 2 "${thumbnailPath}"`, {
                timeout: 15000, stdio: 'ignore',
              });
            } catch {}

            // Upload to R2
            let videoUrl = `/api/video/serve/${videoId}.mp4`;
            let thumbnailUrl = existsSync(thumbnailPath) ? `/api/video/serve/${videoId}_thumb.png` : null;

            try {
              const r2Result = await uploadVideoToR2(videoId, outputMp4Path);
              if (r2Result.success && r2Result.url) videoUrl = r2Result.url;
            } catch {}

            if (existsSync(thumbnailPath)) {
              try {
                const thumbResult = await uploadThumbnailToR2(videoId, thumbnailPath);
                if (thumbResult.success && thumbResult.url) thumbnailUrl = thumbResult.url;
              } catch {}
            }

            // Get duration
            let actualDuration = 60;
            try {
              const { execSync } = require('child_process');
              const probeOutput = execSync(
                `ffprobe -v quiet -print_format json -show_format "${outputMp4Path}"`,
                { encoding: 'utf-8', timeout: 10000 }
              );
              const probeData = JSON.parse(probeOutput);
              const probedDuration = parseFloat(probeData?.format?.duration || '0');
              if (probedDuration > 0) actualDuration = Math.round(probedDuration);
            } catch {}

            await safeDBQuery(
              () => db.videoReport.update({
                where: { id: videoId },
                data: {
                  status: 'completed',
                  videoUrl,
                  thumbnailUrl,
                  duration: actualDuration,
                  isPublished: true,
                  publishedAt: new Date(),
                  analysisText: JSON.stringify({ title, sceneCount: scenes.length, locale, music }),
                },
              }),
              'videoReport.update.manual.completed'
            );

            console.log(`[ManualVideo] ✅ Complete: ${videoId} (${actualDuration}s)`);

            // Cleanup
            try { unlinkSync(inputJsonPath); } catch {}
            if (existsSync(outputMp4Path)) { try { unlinkSync(outputMp4Path); } catch {} }
            if (existsSync(thumbnailPath)) { try { unlinkSync(thumbnailPath); } catch {} }
          })(),
          timeoutPromise,
        ]);
      } catch (err: any) {
        console.error(`[ManualVideo] FAILED:`, err.message);
        await safeDBQuery(
          () => db.videoReport.update({
            where: { id: videoId },
            data: { status: 'failed', error: err.message?.slice(0, 3000) || 'Generation failed' },
          }),
          'videoReport.update.manual.failed'
        );
        try { unlinkSync(inputJsonPath); } catch {}
      }
    })();

    return immediateResponse;

  } catch (err: any) {
    console.error('[ManualVideo] Error:', err.message);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

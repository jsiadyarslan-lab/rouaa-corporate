// ═══ AI Video Generation API (5th video type) ═══
// Uses project's AI provider chain (NOT z-ai directly):
//   - LLM: chatCompletion() from @/lib/ai-provider (Bedrock Claude/Gemini/OpenRouter/Grok/GLM)
//   - Images: generateImageBuffer() from @/lib/image-gen (Cloudflare SDXL/Gemini/Prodia/Pollinations)
//   - Rendering: video-renderer-gold-engine.mjs (subprocess — needs Playwright)
//
// Pipeline: report → Engine (LLM) → scenes → image-gen → gold-engine renderer → R2

import { NextRequest, NextResponse } from 'next/server';
import { db, safeDBQuery } from '@/lib/db';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, mkdirSync, existsSync, unlinkSync, statSync, readFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { uploadVideoToR2, uploadThumbnailToR2 } from '@/lib/video-storage';
import { generateVideoScript } from '@/lib/video-script-engine';
import { generateImageBuffer } from '@/lib/image-gen';

const execFileAsync = promisify(execFile);
const VIDEO_DIR = join(process.cwd(), 'public', 'generated', 'videos');
const RENDERER_SCRIPT_GOLD = join(process.cwd(), 'scripts', 'video-renderer-gold-engine.mjs');
const RENDERER_SCRIPT_PULSE = join(process.cwd(), 'scripts', 'video-renderer-pulse-engine.mjs');
const RENDERER_SCRIPT_DATAVIZ = join(process.cwd(), 'scripts', 'video-renderer-dataviz-engine.mjs');
const RENDERER_SCRIPT_OBSERVATORY = join(process.cwd(), 'scripts', 'video-renderer-observatory-engine.mjs');
const RENDERER_SCRIPT_AI = join(process.cwd(), 'scripts', 'video-renderer-ai-engine.mjs');

function ensureVideoDir() {
  if (!existsSync(VIDEO_DIR)) mkdirSync(VIDEO_DIR, { recursive: true });
}

async function findEconomicReport(id: string) {
  return await safeDBQuery(
    () => db.economicReport.findFirst({ where: { OR: [{ id }, { slug: id }] } }),
    'findEconomicReport.ai'
  );
}

// ─── Transform EconomicReport → Engine input format ───────
function transformReportForEngine(report: any, locale: string): any {
  const content = typeof report.content === 'string'
    ? (() => { try { return JSON.parse(report.content); } catch { return {}; } })()
    : report.content || {};

  let summary = '';
  if (typeof content === 'object' && content) {
    summary = content.summary || content.introduction || content.overview ||
              content.executiveSummary || content.context || '';
    if (typeof summary !== 'string') summary = JSON.stringify(summary);
  }
  if (!summary && report.summary) summary = report.summary;
  if (!summary) summary = report.title || '';

  // Always include title and summary at the top so the LLM knows the topic
  let contentText = `REPORT TITLE: ${report.title || 'Financial Report'}\n\nSUMMARY: ${summary}\n`;
  if (content && typeof content === 'object' && content.sections) {
    const sections = content.sections;
    for (const [sectionName, sectionContent] of Object.entries(sections)) {
      if (typeof sectionContent === 'string' && sectionContent.trim().length > 20) {
        contentText += `\n\n## ${sectionName}\n\n${sectionContent}`;
      } else if (typeof sectionContent === 'object' && sectionContent !== null) {
        const flatten = (obj: any, depth = 0): string => {
          if (depth > 3) return '';
          const parts: string[] = [];
          for (const [k, v] of Object.entries(obj)) {
            if (typeof v === 'string' && v.trim().length > 5) parts.push(v.trim());
            else if (Array.isArray(v)) v.forEach((item: any) => {
              if (typeof item === 'string' && item.trim().length > 5) parts.push(`- ${item.trim()}`);
            });
            else if (typeof v === 'object' && v !== null) {
              const nested = flatten(v, depth + 1);
              if (nested) parts.push(nested);
            }
          }
          return parts.join('\n');
        };
        const flat = flatten(sectionContent);
        if (flat.length > 20) contentText += `\n\n## ${sectionName}\n\n${flat}`;
      }
    }
  }
  if (!contentText) contentText = summary;

  return {
    title: report.title || 'تقرير مالي',
    summary: summary.slice(0, 1000),
    locale: locale,
    market_impact: report.marketImpact || 'neutral',
    content: contentText,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sourceReportId,
      sourceType = 'economic_report',
      locale = 'ar',
      title: customTitle,
      rendererStyle = 'gold', // 'gold' | 'pulse' | 'dataviz' | 'observatory' | 'ai' — selects visual identity
      videoFormat = 'landscape', // 'landscape' (16:9) or 'vertical' (9:16) or 'square' (1:1)
    } = body;

    // Select renderer based on style
    const RENDERER_SCRIPT = rendererStyle === 'pulse' ? RENDERER_SCRIPT_PULSE
      : rendererStyle === 'dataviz' ? RENDERER_SCRIPT_DATAVIZ
      : rendererStyle === 'observatory' ? RENDERER_SCRIPT_OBSERVATORY
      : rendererStyle === 'ai' ? RENDERER_SCRIPT_AI
      : RENDERER_SCRIPT_GOLD;
    const dbStyle = rendererStyle === 'pulse' ? 'pulse'
      : rendererStyle === 'dataviz' ? 'dataviz'
      : rendererStyle === 'observatory' ? 'observatory'
      : rendererStyle === 'ai' ? 'ai'
      : 'gold';

    if (!sourceReportId) {
      return NextResponse.json(
        { success: false, error: 'sourceReportId is required' },
        { status: 400 }
      );
    }

    console.log(`[AIVideo] Starting for report ${sourceReportId} (${locale})`);

    ensureVideoDir();

    // ── Step 1: Fetch the report ──
    let report: any = null;
    if (sourceType === 'economic_report') {
      report = await findEconomicReport(sourceReportId);
    } else if (sourceType === 'geopolitical_risk') {
      try {
        report = await db.geopoliticalRisk.findFirst({
          where: { OR: [{ id: sourceReportId }, { slug: sourceReportId }] },
        });
      } catch (dbErr: any) {
        console.error(`[AIVideo] GeopoliticalRisk query failed: ${dbErr.message?.slice(0, 80)}`);
      }
    }

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found', sourceReportId, sourceType },
        { status: 404 }
      );
    }

    console.log(`[AIVideo] Found report: "${report.title?.slice(0, 60)}"`);

    // ── Step 2: Create VideoReport entry ──
    const videoId = randomUUID();
    const slug = `ai-${Date.now()}`;
    const cleanTitle = (customTitle || report.title || 'AI Video').replace(/[^A-Za-z0-9\u0600-\u06FF:_.\-\s]/g, '').slice(0, 100);

    let videoReport: any;
    try {
      videoReport = await safeDBQuery(
        () => db.videoReport.create({
          data: {
            id: videoId,
            title: cleanTitle,
            slug,
            symbol: 'AI',
            assetName: cleanTitle,
            locale: locale === 'en' ? 'en' : locale === 'fr' ? 'fr' : locale === 'tr' ? 'tr' : locale === 'es' ? 'es' : 'ar',
            reportType: 'ai',
            assetClass: 'ai',
            chartMode: 'ai',
            style: dbStyle,
            marketImpact: (report.marketImpact as string) || 'neutral',
            analysisText: '',
            status: 'processing',
            isPublished: false,
            sourceReportId: sourceReportId,
            sourceType: sourceType,
          },
        }),
        'videoReport.create.ai'
      );
    } catch (dbErr: any) {
      return NextResponse.json({ success: false, error: 'DB error: ' + dbErr.message }, { status: 500 });
    }

    if (!videoReport) {
      return NextResponse.json({ success: false, error: 'DB connection failed' }, { status: 500 });
    }

    // ── Step 3: Check renderer script exists ──
    if (!existsSync(RENDERER_SCRIPT)) {
      await safeDBQuery(
        () => db.videoReport.update({
          where: { id: videoId },
          data: { status: 'failed', error: `Renderer script not found: ${RENDERER_SCRIPT}` },
        }),
        'videoReport.update.ai.missingRenderer'
      );
      return NextResponse.json({ success: false, error: `Renderer script not found: ${rendererStyle}`, videoId }, { status: 500 });
    }

    // ── Return immediately — generation runs in background ──
    const immediateResponse = NextResponse.json({
      success: true,
      videoId,
      slug,
      title: cleanTitle,
      status: 'processing',
      message: 'AI video generation started. Pipeline: Engine (LLM) → image-gen → gold-engine renderer. Poll /api/video/[id] for status.',
    }, { status: 202 });

    // ── Background generation pipeline ──
    (async () => {
      const PIPELINE_TIMEOUT = 45 * 60 * 1000; // 45 min — rendering 8+ scenes at 1080p@24fps on Railway is slow
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI video pipeline timed out after 45 minutes')), PIPELINE_TIMEOUT)
      );

      // Paths
      const enrichedScenesPath = join(VIDEO_DIR, `${videoId}_scenes_enriched.json`);
      const outputMp4Path = join(VIDEO_DIR, `${videoId}.mp4`);
      const thumbnailPath = join(VIDEO_DIR, `${videoId}_thumb.png`);

      try {
        await Promise.race([
          (async () => {
            // ── Stage 1: Run Engine (LLM) — report → scenes ──
            // Uses project's chatCompletion (Bedrock Claude/Gemini/OpenRouter/Grok/GLM)
            console.log(`[AIVideo ${videoId}] Stage 1: Engine (LLM) generating scenes...`);
            const engineInput = transformReportForEngine(report, locale);
            const engineResult = await generateVideoScript(engineInput, { lang: locale });

            if (!engineResult.success || !engineResult.scenes || engineResult.scenes.length === 0) {
              throw new Error(`Engine failed: ${engineResult.error || 'no scenes produced'}`);
            }

            console.log(`[AIVideo ${videoId}] Engine produced ${engineResult.scenes.length} scenes in ${engineResult.elapsed}s`);

            // ── Stage 2: Generate images via project's image-gen (Cloudflare/Gemini/Prodia/Pollinations) ──
            console.log(`[AIVideo ${videoId}] Stage 2: Generating images...`);
            const enrichedScenes = [];
            for (let i = 0; i < engineResult.scenes.length; i++) {
              const scene = engineResult.scenes[i] as any;
              // Map Engine field names to renderer field names
              // Engine: { sceneTitle, sceneType, motionDirection, narrationText, displayText, imagePrompt, duration }
              // Renderer expects: { title, sceneType, motionDirection, narrationText, displayText, imagePrompt, duration }
              const sceneForRenderer: any = {
                title: scene.sceneTitle || scene.title || `المشهد ${i + 1}`,
                sceneType: scene.sceneType,
                motionDirection: scene.motionDirection,
                narrationText: scene.narrationText,
                displayText: scene.displayText,
                imagePrompt: scene.imagePrompt,
                duration: scene.duration,
              };
              if (!scene.imagePrompt) {
                sceneForRenderer.imageBase64 = null;
                enrichedScenes.push(sceneForRenderer);
                continue;
              }
              console.log(`[AIVideo ${videoId}] Image ${i+1}/${engineResult.scenes.length}: "${scene.imagePrompt.slice(0, 50)}..."`);
              const buf = await generateImageBuffer(scene.imagePrompt, videoFormat as any);
              sceneForRenderer.imageBase64 = buf ? buf.toString('base64') : null;
              enrichedScenes.push(sceneForRenderer);
              console.log(`[AIVideo ${videoId}] Image ${i+1}: ${buf ? '✓ ' + Math.round(buf.length/1024) + 'KB' : '✗'}`);
            }

            // Write enriched scenes JSON for the renderer
            const enrichedData = {
              title: engineInput.title,
              locale: locale,
              outroText: locale === 'ar'
                ? 'تابعنا لمزيد من التحليلات الاستراتيجية. رؤى — حيث يلتقي المال بالمعرفة.'
                : locale === 'fr'
                ? "Suivez-nous pour plus d'analyses stratégiques. Rouaa — où l'argent rencontre la connaissance."
                : locale === 'tr'
                ? 'Daha fazla stratejik analiz için bizi takip edin. Rouaa — paranın bilgiyle buluştuğu yer.'
                : locale === 'es'
                ? 'Síganos para más análisis estratégicos. Rouaa — donde el dinero se encuentra con el conocimiento.'
                : 'Follow us for more strategic insights. Rouaa — where money meets knowledge.',
              scenes: enrichedScenes,
              _meta: {
                N: engineResult.N,
                totalDuration: engineResult.totalDuration,
                brokenCount: engineResult.brokenCount,
                action: engineResult.action,
                elapsed: engineResult.elapsed,
              },
            };
            writeFileSync(enrichedScenesPath, JSON.stringify(enrichedData, null, 2), 'utf-8');

            // ── Stage 3: Run gold-engine renderer (subprocess — needs Playwright) ──
            console.log(`[AIVideo ${videoId}] Stage 3: gold-engine renderer...`);
            const renderResult = await execFileAsync('node', [
              '--max-old-space-size=1024',
              '--expose-gc',
              '--dns-result-order=ipv4first',
              RENDERER_SCRIPT,
              '--input', enrichedScenesPath,
              '--output', outputMp4Path,
              '--format', videoFormat,
            ], {
              timeout: 1500000,
              maxBuffer: 100 * 1024 * 1024,
              env: { ...process.env, NODE_ENV: 'production', NODE_OPTIONS: '--dns-result-order=ipv4first' },
            });

            console.log(`[AIVideo ${videoId}] Renderer stdout: ${renderResult.stdout?.slice(-500) || 'none'}`);
            if (renderResult.stderr) console.warn(`[AIVideo ${videoId}] Renderer stderr: ${renderResult.stderr?.slice(-300)}`);

            if (!existsSync(outputMp4Path)) {
              throw new Error('Renderer did not produce video file');
            }

            // ── Stage 4: Thumbnail ──
            try {
              const { execSync } = require('child_process');
              execSync(`ffmpeg -y -i "${outputMp4Path}" -vframes 1 -q:v 2 "${thumbnailPath}"`, {
                timeout: 15000, stdio: 'ignore',
              });
            } catch {}

            // ── Stage 5: Upload to R2 ──
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

            // ── Stage 6: Get duration ──
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

            // ── Stage 7: Update DB ──
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
                  analysisText: JSON.stringify({
                    title: enrichedData.title,
                    sceneCount: enrichedScenes.length,
                    locale,
                    engineMeta: enrichedData._meta,
                  }),
                },
              }),
              'videoReport.update.ai.completed'
            );

            console.log(`[AIVideo ${videoId}] ✅ Complete: ${actualDuration}s, ${enrichedScenes.length} scenes`);

            // Cleanup
            try { unlinkSync(enrichedScenesPath); } catch {}
            if (existsSync(outputMp4Path)) { try { unlinkSync(outputMp4Path); } catch {} }
            if (existsSync(thumbnailPath)) { try { unlinkSync(thumbnailPath); } catch {} }
          })(),
          timeoutPromise,
        ]);
      } catch (err: any) {
        console.error(`[AIVideo ${videoId}] FAILED:`, err.message);
        await safeDBQuery(
          () => db.videoReport.update({
            where: { id: videoId },
            data: { status: 'failed', error: err.message?.slice(0, 3000) || 'AI generation failed' },
          }),
          'videoReport.update.ai.failed'
        );
        try { unlinkSync(enrichedScenesPath); } catch {}
      }
    })();

    return immediateResponse;

  } catch (err: any) {
    console.error('[AIVideo] Error:', err.message);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── Quick Image Test — ONLY tests HuggingFace (fast, ~30s max) ───
// Skips StableHorde and other slow tests. Use /api/news/diag-image for full diagnostics.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  const report: any = {
    timestamp: new Date().toISOString(),
    environment: {
      hasZaiBaseUrl: !!process.env.ZAI_BASE_URL,
      hasTogetherApiKey: !!process.env.TOGETHER_API_KEY,
      hasHfApiKey: !!(process.env.HF_API_KEY || process.env.HF_API_TOKEN || process.env.HF_TOKEN),
      hasCloudflareApiToken: !!process.env.CLOUDFLARE_API_TOKEN,
      hasR2AccountId: !!process.env.R2_ACCOUNT_ID,
      hasR2Config: !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME),
    },
    tests: {},
  };

  // ── Test 1: HuggingFace with NEW router URL ──
  try {
    const hfToken = process.env.HF_API_KEY || process.env.HF_API_TOKEN || process.env.HF_TOKEN;
    if (hfToken) {
      const hfModel = process.env.HF_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell';
      const newUrl = `https://router.huggingface.co/hf-inference/models/${hfModel}`;
      const startTime = Date.now();

      const res = await fetch(newUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: 'financial stock market chart blue professional',
          parameters: { width: 512, height: 512, num_inference_steps: 4 },
        }),
        signal: AbortSignal.timeout(45000),
      });
      const duration = Date.now() - startTime;
      const ct = res.headers.get('content-type') || '';

      if (res.ok && ct.startsWith('image/')) {
        const buf = Buffer.from(await res.arrayBuffer());
        report.tests.huggingFace = {
          status: 'SUCCESS ✅',
          url: newUrl,
          model: hfModel,
          imageSize: `${(buf.length / 1024).toFixed(0)}KB`,
          duration: `${duration}ms`,
        };
      } else {
        const text = await res.text().catch(() => '');
        // If 503 + loading, wait and retry once
        if (res.status === 503 && text.includes('loading')) {
          const waitMatch = text.match(/estimated_time.*?(\d+\.?\d*)/);
          const waitSec = waitMatch ? Math.min(Math.ceil(parseFloat(waitMatch[1])), 20) : 10;
          report.tests.huggingFace = { status: 'MODEL_LOADING', wait: `${waitSec}s`, retrying: true };

          await new Promise(r => setTimeout(r, waitSec * 1000));
          const retryStart = Date.now();
          const retryRes = await fetch(newUrl, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ inputs: 'financial chart blue', parameters: { width: 512, height: 512, num_inference_steps: 4 } }),
            signal: AbortSignal.timeout(45000),
          });
          const retryDuration = Date.now() - retryStart;
          const retryCt = retryRes.headers.get('content-type') || '';

          if (retryRes.ok && retryCt.startsWith('image/')) {
            const buf = Buffer.from(await retryRes.arrayBuffer());
            report.tests.huggingFace = {
              status: 'SUCCESS ✅ (after model load wait)',
              url: newUrl,
              model: hfModel,
              imageSize: `${(buf.length / 1024).toFixed(0)}KB`,
              duration: `${retryDuration}ms`,
              totalDuration: `${Date.now() - startTime}ms`,
            };
          } else {
            const retryText = await retryRes.text().catch(() => '');
            report.tests.huggingFace = {
              status: 'FAILED ❌',
              url: newUrl,
              httpStatus: retryRes.status,
              contentType: retryCt,
              body: retryText.slice(0, 200),
              duration: `${retryDuration}ms`,
            };
          }
        } else {
          report.tests.huggingFace = {
            status: 'FAILED ❌',
            url: newUrl,
            httpStatus: res.status,
            contentType: ct,
            body: text.slice(0, 200),
            duration: `${duration}ms`,
          };
        }
      }
    } else {
      report.tests.huggingFace = { status: 'SKIPPED', reason: 'No HF_API_KEY/HF_TOKEN set' };
    }
  } catch (err: any) {
    report.tests.huggingFace = { status: 'FAILED ❌', error: err.message?.slice(0, 300), code: err.code };
  }

  // ── Test 2: Actually call imageArticle on an analyzed article ──
  try {
    const article = await db.newsItem.findFirst({
      where: { isReady: false, processingStage: 'analyzed' },
      orderBy: { fetchedAt: 'desc' },
      select: { id: true, titleAr: true, category: true, locale: true, processingStage: true },
    });

    if (article) {
      report.tests.analyzedArticle = {
        found: true,
        id: article.id.slice(0, 12),
        titleAr: article.titleAr?.slice(0, 60),
        category: article.category,
        locale: article.locale,
      };

      try {
        const { imageArticle } = await import('@/lib/pipeline/agents/imager');
        const imgStart = Date.now();
        const imageResult = await imageArticle(article.id);
        report.tests.imageArticle = {
          success: imageResult.success,
          imageSource: imageResult.imageSource,
          error: imageResult.error?.slice(0, 300),
          duration: `${Date.now() - imgStart}ms`,
        };

        // If image was generated, check what's in DB now
        if (imageResult.success) {
          const updated = await db.newsItem.findUnique({
            where: { id: article.id },
            select: { generatedImage: true, processingStage: true, isReady: true },
          });
          report.tests.imageArticle.dbState = {
            hasImage: !!updated?.generatedImage,
            imageFormat: updated?.generatedImage?.startsWith('https://') ? 'R2 URL'
              : updated?.generatedImage?.startsWith('data:') ? 'base64'
              : updated?.generatedImage?.startsWith('/') ? 'filesystem'
              : 'unknown',
            imagePrefix: updated?.generatedImage?.slice(0, 80),
            stage: updated?.processingStage,
            isReady: updated?.isReady,
          };
        }
      } catch (imgErr: any) {
        report.tests.imageArticle = { success: false, error: imgErr.message?.slice(0, 300) };
      }
    } else {
      report.tests.analyzedArticle = { found: false, note: 'No articles at analyzed stage — try running the pipeline first' };
    }
  } catch (dbErr: any) {
    report.tests.dbQuery = { status: 'FAILED', error: dbErr.message?.slice(0, 200) };
  }

  return NextResponse.json(report);
}

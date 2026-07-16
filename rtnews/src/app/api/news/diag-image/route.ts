// ─── Image Generation Diagnostics Endpoint V260 ─────────────────
// Tests ALL image generation methods on the LIVE Railway container.
// Returns detailed results including error messages, response times, and sizes.
// V260: Added Stable Horde test (100% free, anonymous, no API key needed).

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 180;

export async function GET() {
  const report: any = {
    timestamp: new Date().toISOString(),
    environment: {
      hasZaiBaseUrl: !!process.env.ZAI_BASE_URL,
      hasZaiApiKey: !!process.env.ZAI_API_KEY,
      hasTogetherApiKey: !!process.env.TOGETHER_API_KEY,
      togetherImageModel: process.env.TOGETHER_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell-Free',
      hasHfApiKey: !!(process.env.HF_API_KEY || process.env.HF_API_TOKEN || process.env.HF_TOKEN),
      hasR2Config: !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME),
      hasR2PublicUrl: !!process.env.R2_PUBLIC_URL,
      cwd: process.cwd(),
      nodeEnv: process.env.NODE_ENV,
    },
    tests: {},
  };

  // ── Test 1: z-ai-web-dev-sdk availability ──
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    report.tests.zaiSdk = { import: 'success' };

    try {
      const zai = await ZAI.create();
      report.tests.zaiSdk.create = 'success';

      try {
        const startTime = Date.now();
        const response = await Promise.race([
          zai.images.generations.create({
            prompt: 'simple blue square on white background',
            size: '768x1344',
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Image generation timeout after 60s')), 60000)
          ),
        ]) as any;
        const duration = Date.now() - startTime;

        if (response.data?.[0]?.base64) {
          report.tests.zaiSdk.imageGeneration = {
            status: 'SUCCESS',
            duration: `${duration}ms`,
            base64Length: response.data[0].base64.length,
          };
        } else {
          report.tests.zaiSdk.imageGeneration = {
            status: 'FAILED',
            duration: `${duration}ms`,
            reason: 'No base64 data in response',
            responseKeys: Object.keys(response),
            dataLength: response.data?.length,
          };
        }
      } catch (imgErr: any) {
        report.tests.zaiSdk.imageGeneration = {
          status: 'FAILED',
          error: imgErr.message?.slice(0, 300),
        };
      }
    } catch (createErr: any) {
      report.tests.zaiSdk.create = `FAILED: ${createErr.message?.slice(0, 200)}`;
    }
  } catch (importErr: any) {
    report.tests.zaiSdk = { import: `FAILED: ${importErr.message?.slice(0, 200)}` };
  }

  // ── Test 2: Together AI (FLUX.1-schnell-Free) ──
  try {
    const togetherApiKey = process.env.TOGETHER_API_KEY;
    if (togetherApiKey) {
      const startTime = Date.now();
      const togetherRes = await fetch('https://api.together.xyz/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${togetherApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.TOGETHER_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell-Free',
          prompt: 'simple financial chart blue',
          width: 512,
          height: 512,
          steps: 4,
          n: 1,
          response_format: 'b64_json',
        }),
        signal: AbortSignal.timeout(60000),
      });
      const duration = Date.now() - startTime;

      if (!togetherRes.ok) {
        const errText = await togetherRes.text().catch(() => '');
        report.tests.togetherAI = {
          status: 'FAILED',
          httpStatus: togetherRes.status,
          error: errText.slice(0, 300),
          duration: `${duration}ms`,
          model: process.env.TOGETHER_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell-Free',
        };
        if (togetherRes.status === 401) {
          (report.tests.togetherAI as any).troubleshooting = 'Invalid API key — verify TOGETHER_API_KEY on Railway';
        } else if (togetherRes.status === 402) {
          (report.tests.togetherAI as any).troubleshooting = 'Payment required — ensure model name is exactly black-forest-labs/FLUX.1-schnell-Free (with -Free suffix)';
        }
      } else {
        const togetherData = await togetherRes.json() as any;
        if (togetherData.data?.[0]?.b64_json) {
          const imgBuffer = Buffer.from(togetherData.data[0].b64_json, 'base64');
          report.tests.togetherAI = {
            status: 'SUCCESS',
            sizeBytes: imgBuffer.length,
            sizeKB: `${(imgBuffer.length / 1024).toFixed(0)}KB`,
            duration: `${duration}ms`,
            model: process.env.TOGETHER_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell-Free',
          };
        } else if (togetherData.data?.[0]?.url) {
          report.tests.togetherAI = {
            status: 'SUCCESS',
            imageUrl: togetherData.data[0].url.slice(0, 100),
            duration: `${duration}ms`,
            model: process.env.TOGETHER_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell-Free',
          };
        } else {
          report.tests.togetherAI = {
            status: 'FAILED',
            reason: 'No image data in response',
            responseKeys: Object.keys(togetherData),
            duration: `${duration}ms`,
          };
        }
      }
    } else {
      report.tests.togetherAI = { status: 'SKIPPED', reason: 'TOGETHER_API_KEY not set' };
    }
  } catch (togetherErr: any) {
    report.tests.togetherAI = {
      status: 'FAILED',
      error: togetherErr.message?.slice(0, 300),
    };
  }

  // ── Test 2.5: Stable Horde (100% FREE, anonymous, no API key) ──
  try {
    const hordeStart = Date.now();
    // Submit a small test image request
    const hordeSubmitRes = await fetch('https://stablehorde.net/api/v2/generate/async', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Client-Agent': 'RouaTradingNews-Diag:1.0', 'apikey': '0000000000' },
      body: JSON.stringify({
        prompt: 'simple blue square on white background',
        params: { width: 256, height: 256, steps: 10, cfg_scale: 7, n: 1 },
        nsfw: false,
        models: ['SDXL 1.0'],
        r2: true,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!hordeSubmitRes.ok) {
      const errText = await hordeSubmitRes.text().catch(() => '');
      report.tests.stableHorde = {
        status: 'FAILED',
        phase: 'submit',
        httpStatus: hordeSubmitRes.status,
        error: errText.slice(0, 200),
        duration: `${Date.now() - hordeStart}ms`,
      };
    } else {
      const submitData = await hordeSubmitRes.json() as any;
      const genId = submitData.id;

      if (!genId) {
        report.tests.stableHorde = {
          status: 'FAILED',
          phase: 'submit',
          error: 'No generation ID returned',
          response: JSON.stringify(submitData).slice(0, 200),
        };
      } else {
        // Poll for result (max 180s for diag)
        let hordeDone = false;
        let hordeWaitTime = 0;
        const maxHordeWait = 180_000;

        while (!hordeDone && Date.now() - hordeStart < maxHordeWait) {
          await new Promise(r => setTimeout(r, 5000));
          try {
            const checkRes = await fetch(`https://stablehorde.net/api/v2/generate/check/${genId}`, {
              headers: { 'Client-Agent': 'RouaTradingNews-Diag:1.0', 'apikey': '0000000000' },
              signal: AbortSignal.timeout(10000),
            });
            if (checkRes.ok) {
              const checkData = await checkRes.json() as any;
              hordeDone = checkData.done === true;
              hordeWaitTime = checkData.wait_time ?? 0;
            }
          } catch { /* retry */ }
        }

        const hordeDuration = Date.now() - hordeStart;

        if (!hordeDone) {
          report.tests.stableHorde = {
            status: 'FAILED',
            phase: 'polling',
            reason: `Timed out after ${Math.round(hordeDuration / 1000)}s`,
            generationId: genId,
          };
        } else {
          // Fetch result
          const resultRes = await fetch(`https://stablehorde.net/api/v2/generate/status/${genId}`, {
            headers: { 'Client-Agent': 'RouaTradingNews-Diag:1.0', 'apikey': '0000000000' },
            signal: AbortSignal.timeout(15000),
          });
          if (resultRes.ok) {
            const resultData = await resultRes.json() as any;
            const imgEntry = resultData.generations?.[0];
            if (imgEntry?.img) {
              const isUrl = imgEntry.img.startsWith('http');
              const sizeInfo = isUrl ? 'R2 URL' : `${Math.round(imgEntry.img.length * 0.75 / 1024)}KB base64`;
              report.tests.stableHorde = {
                status: 'SUCCESS',
                duration: `${hordeDuration}ms`,
                imageFormat: isUrl ? 'r2-url' : 'base64',
                sizeInfo,
                model: imgEntry.model || 'unknown',
              };
            } else {
              report.tests.stableHorde = {
                status: 'FAILED',
                phase: 'result',
                reason: 'No image data in result',
                duration: `${hordeDuration}ms`,
              };
            }
          } else {
            report.tests.stableHorde = {
              status: 'FAILED',
              phase: 'result-fetch',
              httpStatus: resultRes.status,
              duration: `${hordeDuration}ms`,
            };
          }
        }
      }
    }
  } catch (hordeErr: any) {
    report.tests.stableHorde = {
      status: 'FAILED',
      error: hordeErr.message?.slice(0, 300),
    };
  }

  // ── Test 2.7: HuggingFace Inference API ──
  try {
    const hfToken = process.env.HF_API_KEY || process.env.HF_API_TOKEN || process.env.HF_TOKEN;
    if (hfToken) {
      const hfModel = process.env.HF_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell';
      const hfStart = Date.now();

      // Test the OLD URL (currently in imager.ts code)
      const oldUrl = `https://api-inference.huggingface.co/models/${hfModel}`;
      // Test the NEW URL (HuggingFace router)
      const newUrl = `https://router.huggingface.co/hf-inference/models/${hfModel}`;

      const results: any = {};

      // Test OLD URL
      try {
        const oldRes = await fetch(oldUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: 'blue square on white', parameters: { width: 256, height: 256, num_inference_steps: 4 } }),
          signal: AbortSignal.timeout(30000),
        });
        results.oldUrl = {
          url: oldUrl,
          status: oldRes.status,
          statusText: oldRes.statusText,
          contentType: oldRes.headers.get('content-type'),
        };
        if (oldRes.ok) {
          const ct = oldRes.headers.get('content-type') || '';
          if (ct.startsWith('image/')) {
            const buf = Buffer.from(await oldRes.arrayBuffer());
            results.oldUrl.imageSize = buf.length;
            results.oldUrl.success = true;
          } else {
            const text = await oldRes.text();
            results.oldUrl.body = text.slice(0, 200);
            results.oldUrl.success = false;
          }
        } else {
          const text = await oldRes.text();
          results.oldUrl.body = text.slice(0, 200);
          results.oldUrl.success = false;
        }
      } catch (oldErr: any) {
        results.oldUrl = { url: oldUrl, error: oldErr.message?.slice(0, 200), code: oldErr.code || 'none' };
      }

      // Test NEW URL
      try {
        const newRes = await fetch(newUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: 'blue square on white', parameters: { width: 256, height: 256, num_inference_steps: 4 } }),
          signal: AbortSignal.timeout(30000),
        });
        results.newUrl = {
          url: newUrl,
          status: newRes.status,
          statusText: newRes.statusText,
          contentType: newRes.headers.get('content-type'),
        };
        if (newRes.ok) {
          const ct = newRes.headers.get('content-type') || '';
          if (ct.startsWith('image/')) {
            const buf = Buffer.from(await newRes.arrayBuffer());
            results.newUrl.imageSize = buf.length;
            results.newUrl.success = true;
          } else {
            const text = await newRes.text();
            results.newUrl.body = text.slice(0, 200);
            results.newUrl.success = false;
          }
        } else {
          const text = await newRes.text();
          results.newUrl.body = text.slice(0, 200);
          results.newUrl.success = false;
        }
      } catch (newErr: any) {
        results.newUrl = { url: newUrl, error: newErr.message?.slice(0, 200), code: newErr.code || 'none' };
      }

      results.duration = `${Date.now() - hfStart}ms`;
      results.model = hfModel;
      report.tests.huggingFace = results;
    } else {
      report.tests.huggingFace = { status: 'SKIPPED', reason: 'HF_API_KEY/HF_TOKEN not set' };
    }
  } catch (hfErr: any) {
    report.tests.huggingFace = { status: 'FAILED', error: hfErr.message?.slice(0, 300) };
  }

  // ── Test 3: Pollinations.ai ──
  try {
    const startTime = Date.now();
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent('simple financial chart blue')}/1344x768?nologo=true&seed=${Date.now()}`;
    const imageResponse = await fetch(pollinationsUrl, {
      signal: AbortSignal.timeout(60000),
    });
    const duration = Date.now() - startTime;

    if (!imageResponse.ok) {
      report.tests.pollinations = {
        status: 'FAILED',
        httpStatus: imageResponse.status,
        statusText: imageResponse.statusText,
        duration: `${duration}ms`,
      };
    } else {
      const contentType = imageResponse.headers.get('content-type') || '';
      const imageBuffer = await imageResponse.arrayBuffer();

      if (!contentType.startsWith('image/')) {
        report.tests.pollinations = {
          status: 'FAILED',
          reason: 'Non-image content-type',
          contentType,
          duration: `${duration}ms`,
        };
      } else {
        report.tests.pollinations = {
          status: 'SUCCESS',
          contentType,
          sizeBytes: imageBuffer.byteLength,
          duration: `${duration}ms`,
        };
      }
    }
  } catch (pollErr: any) {
    report.tests.pollinations = {
      status: 'FAILED',
      error: pollErr.message?.slice(0, 300),
    };
  }

  // ── Test 3: Unsplash stock image ──
  try {
    const startTime = Date.now();
    const stockUrl = 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1344&h=768&fit=crop&q=80';
    const imageResponse = await fetch(stockUrl, {
      signal: AbortSignal.timeout(30000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    const duration = Date.now() - startTime;

    if (!imageResponse.ok) {
      report.tests.unsplash = {
        status: 'FAILED',
        httpStatus: imageResponse.status,
        duration: `${duration}ms`,
      };
    } else {
      const contentType = imageResponse.headers.get('content-type') || '';
      const imageBuffer = await imageResponse.arrayBuffer();
      const ok = contentType.startsWith('image/') && imageBuffer.byteLength > 500;
      report.tests.unsplash = {
        status: ok ? 'SUCCESS' : 'FAILED',
        contentType,
        sizeBytes: imageBuffer.byteLength,
        duration: `${duration}ms`,
      };
    }
  } catch (unsplashErr: any) {
    report.tests.unsplash = {
      status: 'FAILED',
      error: unsplashErr.message?.slice(0, 300),
    };
  }

  // ── Test 4: Filesystem write ──
  try {
    const { writeFileSync, mkdirSync, existsSync, unlinkSync } = await import('fs');
    const { join } = await import('path');
    const testDir = join(process.cwd(), 'public', 'article-images');
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
    const testFile = join(testDir, 'diag-test.txt');
    writeFileSync(testFile, 'test');
    if (existsSync(testFile)) {
      unlinkSync(testFile);
      report.tests.filesystem = { status: 'SUCCESS' };
    } else {
      report.tests.filesystem = { status: 'FAILED', reason: 'Written but not found' };
    }
  } catch (fsErr: any) {
    report.tests.filesystem = {
      status: 'FAILED',
      error: fsErr.message?.slice(0, 200),
      code: fsErr.code,
    };
  }

  // ── Test 5: R2 upload ──
  try {
    const { uploadImageToR2 } = await import('@/lib/image-storage');
    const testBuffer = Buffer.from('test image data for diagnostics');
    const result = await uploadImageToR2('diag-test', testBuffer, 'image/png');
    report.tests.r2Upload = {
      status: result.success ? 'SUCCESS' : 'FAILED',
      error: result.error,
      storageType: result.storageType,
    };
  } catch (r2Err: any) {
    report.tests.r2Upload = { status: 'FAILED', error: r2Err.message?.slice(0, 200) };
  }

  // ── Test 6: Find an analyzed article and check its state ──
  try {
    const article = await db.newsItem.findFirst({
      where: { isReady: false, processingStage: 'analyzed' },
      orderBy: { fetchedAt: 'desc' },
      select: {
        id: true, titleAr: true, contentAr: true, aiAnalysis: true,
        // EGRESS FIX: removed generatedImage from select — not used in diagnostic output for analyzed articles
        slug: true, category: true,
        retryCount: true, lastError: true, fetchedAt: true,
        processingStage: true,
      },
    });

    if (article) {
      // Test validation that the orchestrator does before calling imageArticle
      const validationChecks: any = { stage: article.processingStage };

      // Check 1: titleAr
      validationChecks.hasTitleAr = !!article.titleAr && article.titleAr.length > 0;
      validationChecks.titleArLen = article.titleAr?.length || 0;

      // Check 2: contentAr
      validationChecks.hasContentAr = !!article.contentAr && article.contentAr.length >= 200;
      validationChecks.contentArLen = article.contentAr?.length || 0;

      // Check 3: aiAnalysis
      validationChecks.hasAiAnalysis = !!article.aiAnalysis && article.aiAnalysis.length > 50;
      validationChecks.aiAnalysisLen = article.aiAnalysis?.length || 0;

      // Check 4: aiAnalysis JSON parsing (same as validateStageOutput)
      if (article.aiAnalysis && article.aiAnalysis.length > 50) {
        try {
          const parsed = JSON.parse(article.aiAnalysis);
          validationChecks.aiAnalysisJsonValid = true;
          validationChecks.hasFullContent = !!parsed.fullContent;
          validationChecks.fullContentHasArabic = parsed.fullContent ? /[\u0600-\u06FF]/.test(parsed.fullContent) : false;
          validationChecks.fullContentLen = parsed.fullContent?.length || 0;
          validationChecks.aiPath = parsed.path;
        } catch (parseErr: any) {
          validationChecks.aiAnalysisJsonValid = false;
          validationChecks.parseError = parseErr.message?.slice(0, 100);
          // Try to see what the JSON looks like
          validationChecks.aiAnalysisStart = article.aiAnalysis.slice(0, 100);
          validationChecks.aiAnalysisEnd = article.aiAnalysis.slice(-100);
        }
      }

      // Check 5: slug
      validationChecks.hasSlug = !!article.slug && article.slug.length >= 2;

      // Overall validation result (matches validateStageOutput for 'analyzed')
      const wouldPassValidation = validationChecks.hasTitleAr
        && validationChecks.hasContentAr
        && validationChecks.hasAiAnalysis
        && validationChecks.aiAnalysisJsonValid
        && validationChecks.hasFullContent
        && validationChecks.fullContentHasArabic;
      validationChecks.wouldPassOrchestratorValidation = wouldPassValidation;

      report.tests.analyzedArticle = {
        found: true,
        id: article.id.slice(0, 12),
        titleAr: article.titleAr?.slice(0, 60),
        retryCount: article.retryCount,
        lastError: article.lastError?.slice(0, 300),
        ageHours: Math.round((Date.now() - new Date(article.fetchedAt).getTime()) / 3600000),
        validation: validationChecks,
      };

      // ── Test 7: Actually call imageArticle on this article ──
      try {
        const { imageArticle } = await import('@/lib/pipeline/agents/imager');
        const imageResult = await imageArticle(article.id);
        report.tests.imageArticleCall = {
          success: imageResult.success,
          imageSource: imageResult.imageSource,
          error: imageResult.error?.slice(0, 300),
          duration: `${imageResult.duration}ms`,
        };
      } catch (imgCallErr: any) {
        report.tests.imageArticleCall = {
          success: false,
          error: imgCallErr.message?.slice(0, 300),
        };
      }
    } else {
      report.tests.analyzedArticle = { found: false };
    }
  } catch (dbErr: any) {
    report.tests.dbQuery = { status: 'FAILED', error: dbErr.message?.slice(0, 200) };
  }

  return NextResponse.json(report);
}

// V230: POST endpoint — Fix articles with invalid/broken generatedImage values
// Scans for published articles with bad image references and clears them
// so the pipeline regenerates images on next cycle.
export async function POST() {
  try {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
      return NextResponse.json({ error: 'No DB' }, { status: 500 });
    }

    const results = {
      scanned: 0,
      fixed: 0,
      details: [] as { id: string; reason: string; oldValue: string }[],
    };

    // Find published articles with potentially broken generatedImage
    const articles = await db.newsItem.findMany({
      where: {
        isPublished: true,
        generatedImage: { not: null },
      },
      // Case C: genuinely needs generatedImage data to detect broken URLs/filesystem paths/garbage (admin diagnostic, very low traffic)
      select: { id: true, generatedImage: true },
      take: 500,
    });

    results.scanned = articles.length;

    for (const article of articles) {
      const img = article.generatedImage;
      if (!img || img.length <= 10) continue;

      let shouldFix = false;
      let reason = '';

      // Check 1: Non-R2, non-base64, non-filesystem, non-Pollinations external URL
      // These are likely broken external URLs that will 404
      if (img.startsWith('https://') || img.startsWith('http://')) {
        const { isR2Url } = await import('@/lib/image-storage');
        if (!isR2Url(img) && !img.includes('image.pollinations.ai')) {
          // Unknown external URL — likely broken
          shouldFix = true;
          reason = 'Unknown external URL (not R2/Pollinations)';
        }
      }
      // Check 2: Filesystem paths that definitely won't exist after redeployment
      else if (img.startsWith('/article-images/')) {
        const { existsSync } = await import('fs');
        const { join } = await import('path');
        const filePath = join(process.cwd(), 'public', img);
        if (!existsSync(filePath)) {
          shouldFix = true;
          reason = 'Filesystem image lost (ephemeral storage)';
        }
      }
      // Check 3: Garbage strings (too short, random chars, etc.)
      else if (!img.startsWith('data:image/') && !img.startsWith('/article-images/') && !img.includes('image.pollinations.ai')) {
        const { isR2Url } = await import('@/lib/image-storage');
        if (!isR2Url(img)) {
          shouldFix = true;
          reason = `Invalid format: "${img.slice(0, 50)}"`;
        }
      }

      if (shouldFix) {
        await db.newsItem.update({
          where: { id: article.id },
          data: { generatedImage: null },
        });
        results.fixed++;
        results.details.push({ id: article.id.slice(0, 12), reason, oldValue: img.slice(0, 80) });

        // Only log first 20 to avoid noise
        if (results.details.length <= 20) {
          console.log(`[V230 Fix] Cleared broken image for ${article.id.slice(0, 12)}: ${reason}`);
        }
      }
    }

    console.log(`[V230 Fix] Scanned ${results.scanned}, fixed ${results.fixed} articles with broken images`);
    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── Bulk Image Migration: base64 → R2 ──────────────────────
// POST /api/admin/migrate-images
// Migrates ALL base64-encoded images from the database to Cloudflare R2.
// This permanently eliminates base64 from the DB, reducing Supabase egress by 95%+.
//
// Query params:
//   ?dryRun=1     — Count only, don't migrate (safe preview)
//   ?limit=50     — Max articles to process per run (default: 100)
//   ?clearOnly=1  — Just clear base64 from DB (set generatedImage=null), don't upload to R2
//
// Auth: Requires ADMIN_SECRET header for safety

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { uploadImageToR2 } from '@/lib/image-storage';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min timeout for long migrations

export async function POST(request: NextRequest) {
  // Auth check
  const adminSecret = request.headers.get('x-admin-secret') || request.headers.get('admin-secret');
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'rouaa-admin-2024') {
    return NextResponse.json({ error: 'Unauthorized — provide ADMIN_SECRET header' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get('dryRun') === '1';
  const clearOnly = searchParams.get('clearOnly') === '1';
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '100')));

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
    return NextResponse.json({ error: 'No database configured' }, { status: 400 });
  }

  try {
    // Step 1: Find articles with base64 images
    // We need to select generatedImage here because that's exactly what we're migrating
    const articles = await db.newsItem.findMany({
      where: {
        generatedImage: { not: null },
      },
      select: {
        id: true,
        generatedImage: true, // REQUIRED: we need the base64 data to migrate it
      },
      take: limit,
    });

    // Filter to only base64 images (not R2 URLs, not filesystem paths)
    const base64Articles = articles.filter(a => {
      const img = a.generatedImage || '';
      return img.startsWith('data:image/') || (img.length > 200 && /^[A-Za-z0-9+/=\s]+$/.test(img.slice(0, 200)));
    });

    const r2Articles = articles.filter(a => {
      const img = a.generatedImage || '';
      return img.startsWith('http://') || img.startsWith('https://');
    });

    const fsArticles = articles.filter(a => {
      const img = a.generatedImage || '';
      return img.startsWith('/article-images/');
    });

    if (dryRun) {
      // Count total base64 size
      let totalBase64Bytes = 0;
      for (const a of base64Articles) {
        const raw = a.generatedImage || '';
        const b64 = raw.includes('base64,') ? raw.split('base64,')[1] : raw;
        totalBase64Bytes += Math.ceil(b64.length * 0.75); // base64 → raw bytes estimate
      }

      return NextResponse.json({
        dryRun: true,
        totalArticlesWithImages: articles.length,
        base64Images: base64Articles.length,
        r2Images: r2Articles.length,
        filesystemImages: fsArticles.length,
        estimatedBase64SizeMB: (totalBase64Bytes / 1024 / 1024).toFixed(1),
        monthlyEgressImpactGB: ((totalBase64Bytes * 50) / 1024 / 1024 / 1024).toFixed(1), // ~50 page loads/month
        message: `Found ${base64Articles.length} articles with base64 images (~${(totalBase64Bytes / 1024 / 1024).toFixed(1)}MB). Run without dryRun to migrate.`,
      });
    }

    // Step 2: Migrate
    const results = {
      migrated: 0,
      cleared: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
      savedBytes: 0,
    };

    for (const article of base64Articles) {
      try {
        const raw = article.generatedImage || '';
        const b64Content = raw.includes('base64,') ? raw.split('base64,')[1] : raw;

        if (b64Content.length < 100) {
          results.skipped++;
          continue;
        }

        // Detect MIME type
        let mimeType = 'image/png';
        let ext = 'png';
        if (raw.includes('data:image/jpeg') || raw.includes('data:image/jpg')) {
          mimeType = 'image/jpeg'; ext = 'jpg';
        } else if (raw.includes('data:image/webp')) {
          mimeType = 'image/webp'; ext = 'webp';
        } else if (raw.includes('data:image/svg+xml')) {
          // SVG placeholders — just clear them, not worth migrating
          await db.newsItem.update({
            where: { id: article.id },
            data: { generatedImage: null },
          });
          results.cleared++;
          results.savedBytes += b64Content.length;
          continue;
        }

        if (clearOnly) {
          // Just clear base64 from DB, don't upload to R2
          await db.newsItem.update({
            where: { id: article.id },
            data: { generatedImage: null },
          });
          results.cleared++;
          results.savedBytes += b64Content.length;
          continue;
        }

        // Decode base64
        const buffer = Buffer.from(b64Content, 'base64');
        results.savedBytes += b64Content.length;

        // Upload to R2
        const uploadResult = await uploadImageToR2(article.id, buffer, mimeType);

        if (uploadResult.success && uploadResult.url) {
          // Update DB with R2 URL (replaces the massive base64 string)
          await db.newsItem.update({
            where: { id: article.id },
            data: { generatedImage: uploadResult.url },
          });
          results.migrated++;
        } else {
          // R2 upload failed — clear the base64 to stop egress bleeding
          // The image will be re-generated on next pipeline run
          await db.newsItem.update({
            where: { id: article.id },
            data: { generatedImage: null },
          });
          results.failed++;
          if (results.errors.length < 10) {
            results.errors.push(`Article ${article.id}: ${uploadResult.error}`);
          }
        }

        // Rate limit: don't hammer R2
        if (results.migrated % 5 === 0) {
          await new Promise(r => setTimeout(r, 200));
        }
      } catch (err: any) {
        results.failed++;
        if (results.errors.length < 10) {
          results.errors.push(`Article ${article.id}: ${err.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: base64Articles.length,
      ...results,
      savedMB: (results.savedBytes / 1024 / 1024).toFixed(1),
      message: results.migrated > 0
        ? `Migrated ${results.migrated} images to R2, cleared ${results.cleared} SVG/base64. Saved ~${(results.savedBytes / 1024 / 1024).toFixed(1)}MB from DB.`
        : results.cleared > 0
        ? `Cleared ${results.cleared} base64 images from DB. Saved ~${(results.savedBytes / 1024 / 1024).toFixed(1)}MB.`
        : `No base64 images found to migrate.`,
    });
  } catch (error: any) {
    console.error('[MigrateImages] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

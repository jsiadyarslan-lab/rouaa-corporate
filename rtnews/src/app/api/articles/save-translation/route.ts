// ─── Save Article Translation to DB V40 ──────────────────────
// Called by the client after completing source content translation.
// Persists translated paragraphs, title, and summary to the database
// so future visitors get pre-translated content instantly.
//
// V40 GOLDEN RULE: This route NEVER sets isPublished=true or isReady=true.
// Only the Publisher agent (pipeline) can make an article visible.
// Previously, this route set isPublished=true with just titleAr + slug,
// causing incomplete articles (no contentAr, no image, no analysis)
// to appear on the site. This is now FORBIDDEN.
//
// POST { url, titleAr?, summaryAr?, contentAr?, newsId? }

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateSlug } from '@/lib/slug';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, titleAr, summaryAr, contentAr, newsId } = body;

    // At least one translation field is required
    if (!titleAr && !summaryAr && !contentAr) {
      return NextResponse.json({ error: 'No translation data provided' }, { status: 400 });
    }

    // We need either a newsId or a url to find the article
    if (!newsId && !url) {
      return NextResponse.json({ error: 'newsId or url is required' }, { status: 400 });
    }

    let newsItem: Awaited<ReturnType<typeof db.newsItem.findUnique>> = null;

    // Find by ID first (most reliable)
    if (newsId) {
      try {
        newsItem = await db.newsItem.findUnique({ where: { id: newsId } });
      } catch {}
    }

    // Find by URL if not found by ID
    if (!newsItem && url) {
      try {
        newsItem = await db.newsItem.findFirst({
          where: { url: url },
          orderBy: { fetchedAt: 'desc' },
        });
      } catch {}
    }

    if (newsItem) {
      // Update existing record with translations
      const updateData: Record<string, any> = {};

      // Only update fields that have new Arabic content
      // CRITICAL SAFEGUARD: Only update titleAr if the existing titleAr is empty or
      // has no Arabic chars. This prevents overwriting a good translation.
      if (titleAr && /[\u0600-\u06FF]/.test(titleAr) && (!newsItem.titleAr || !/[\u0600-\u06FF]/.test(newsItem.titleAr))) {
        updateData.titleAr = titleAr;
        // Generate slug from Arabic title if missing
        // CRITICAL: NEVER change the slug on update — it breaks existing URLs!
        if (!newsItem.slug) {
          updateData.slug = generateSlug(titleAr);
          // V40: DO NOT set isPublished=true here! Only the Publisher agent does that.
          // The pipeline will pick up this article and process it through all stages.
        }
      }
      if (summaryAr && /[\u0600-\u06FF]/.test(summaryAr) && (!newsItem.summaryAr || !/[\u0600-\u06FF]/.test(newsItem.summaryAr))) {
        updateData.summaryAr = summaryAr;
      }
      if (contentAr && /[\u0600-\u06FF]/.test(contentAr) && contentAr.length > 20) {
        // CRITICAL: Only update contentAr if existing is empty or shorter than new content
        // This prevents overwriting good translated content with shorter content
        if (!newsItem.contentAr || newsItem.contentAr.length < contentAr.length) {
          updateData.contentAr = contentAr;
        }
      }

      if (Object.keys(updateData).length > 0) {
        await db.newsItem.update({
          where: { id: newsItem.id },
          data: updateData,
        });
        console.log(`[Save Translation] Saved ${Object.keys(updateData).join(', ')} for article: ${newsItem.id}`);
      }

      return NextResponse.json({
        success: true,
        savedFields: Object.keys(updateData),
        newsId: newsItem.id,
      });
    }

    // No existing NewsItem found — create a minimal one if we have a URL
    // V40: Created articles are ALWAYS invisible (isPublished=false, isReady=false)
    // The pipeline will process them and the Publisher agent will make them visible.
    if (url) {
      const createData: {
        title: string;
        url: string;
        newsType: string;
        originalLanguage: string;
        titleAr?: string;
        summaryAr?: string;
        contentAr?: string;
        slug?: string;
        // V40: isPublished and isReady are NOT set — defaults are false
      } = {
        title: titleAr || 'Untitled',
        url,
        newsType: 'live',
        originalLanguage: 'en',
      };

      if (titleAr && /[\u0600-\u06FF]/.test(titleAr)) {
        createData.titleAr = titleAr;
        createData.slug = generateSlug(titleAr);
        // V40: DO NOT set isPublished=true! The pipeline Publisher handles this.
      }
      if (summaryAr && /[\u0600-\u06FF]/.test(summaryAr)) createData.summaryAr = summaryAr;
      if (contentAr && /[\u0600-\u06FF]/.test(contentAr) && contentAr.length > 20) createData.contentAr = contentAr;

      try {
        const newItem = await db.newsItem.create({ data: createData });
        console.log(`[Save Translation] Created new article (invisible until pipeline publishes): ${newItem.id}`);
        return NextResponse.json({
          success: true,
          savedFields: Object.keys(createData).filter(k => k !== 'url' && k !== 'newsType' && k !== 'originalLanguage'),
          newsId: newItem.id,
          created: true,
          slug: newItem.slug,
        });
      } catch (createErr: any) {
        console.warn(`[Save Translation] Could not create article: ${createErr.message}`);
        return NextResponse.json({
          success: false,
          error: 'فشل في إنشاء المقال',
          code: createErr.code,
        }, { status: 500 });
      }
    }

    return NextResponse.json({ success: false, error: 'Article not found and could not be created' }, { status: 404 });
  } catch (error: any) {
    console.error('[Save Translation] Error:', error.message);
    return NextResponse.json({ error: 'فشل في حفظ الترجمة' }, { status: 500 });
  }
}

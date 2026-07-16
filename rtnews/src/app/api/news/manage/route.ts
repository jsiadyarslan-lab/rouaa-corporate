// ─── News Management CRUD API V49 ────────────────────────────
// Full CRUD for admin news management
// ⚠️ All operations require admin authentication (via middleware.ts)
// V49: Added `status` filter (published/fetched/all), admin can delete any article without force flag
//     The golden rule of not deleting published news applies to AI pipeline only, not to admin users

import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { notifyTelegramSubscribers } from '@/lib/telegram-notifier';
import { formatBreakingNews } from '@/lib/telegram-formatter';
import { isSvgPlaceholderImage } from '@/lib/image-storage';

export const dynamic = 'force-dynamic';

async function verifyAdmin(request: Request): Promise<boolean> {
  const token = (request as any).cookies?.get?.('admin_token')?.value;
  if (!token) return false;
  try {
    return await verifyAdminToken(token);
  } catch {
    return false;
  }
}

// ─── GET: List news with pagination and filters ────────────
export async function GET(request: Request) {
  // GET is publicly accessible (news list is public data)
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 20)));
    const newsType = searchParams.get('newsType');
    const category = searchParams.get('category');
    const sentiment = searchParams.get('sentiment');
    const search = searchParams.get('search');
    const status = searchParams.get('status'); // V49: 'published' | 'fetched' | 'all'
    const sortBy = searchParams.get('sortBy') || 'fetchedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Whitelist allowed sort fields to prevent injection
    const ALLOWED_SORT_FIELDS = ['fetchedAt', 'createdAt', 'updatedAt', 'title', 'sentimentScore', 'views', 'category'];
    const safeSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'fetchedAt';
    const safeSortOrder = sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : 'desc';

    const where: any = {};
    if (newsType) where.newsType = newsType;
    if (category) where.category = category;
    if (sentiment) where.sentiment = sentiment;
    // V49: Status filter for tab-based dashboard
    if (status === 'published') {
      where.isReady = true;
    } else if (status === 'fetched') {
      where.isReady = false;
    }
    // 'all' or undefined = no filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { titleAr: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { source: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [news, total] = await Promise.all([
      db.newsItem.findMany({
        where,
        orderBy: { [safeSortBy]: safeSortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.newsItem.count({ where }),
    ]);

    // Serialize all fields
    const serializedNews = news.map((item: any) => ({
      id: String(item.id),
      title: String(item.title || ''),
      titleAr: item.titleAr ? String(item.titleAr) : null,
      summary: String(item.summary || ''),
      summaryAr: item.summaryAr ? String(item.summaryAr) : null,
      content: item.content ? String(item.content) : null,
      contentAr: item.contentAr ? String(item.contentAr) : null,
      source: String(item.source || ''),
      url: String(item.url || ''),
      category: String(item.category || ''),
      sentiment: String(item.sentiment || 'neutral'),
      sentimentScore: Number(item.sentimentScore || 55),
      impactLevel: String(item.impactLevel || 'low'),
      impactScore: Number(item.impactScore || 0),
      originalLanguage: String(item.originalLanguage || 'ar'),
      newsType: String(item.newsType || 'live'),
      affectedAssets: String(item.affectedAssets || '[]'),
      aiAnalysis: item.aiAnalysis ? String(item.aiAnalysis) : null,
      isPublished: Boolean(item.isPublished),
      isReady: Boolean(item.isReady),
      imageUrl: item.imageUrl || null,
      slug: item.slug || null,
      fetchedAt: item.fetchedAt instanceof Date ? item.fetchedAt.toISOString() : String(item.fetchedAt || new Date().toISOString()),
      createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt || new Date().toISOString()),
    }));

    return NextResponse.json({
      news: serializedNews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      systemStatus: {
        dbConnected: !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy'),
      }
    });
  } catch (error: any) {
    console.error('[NewsManage] GET error:', error);
    return NextResponse.json({ error: error.message, news: [], total: 0, page: 1, totalPages: 0 }, { status: 500 });
  }
}

// ─── POST: Create a new news item ──────────────────────────
export async function POST(request: Request) {
  // Require admin auth for create
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'غير مصرح — سجّل الدخول أولاً' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const {
      title, titleAr, summary, summaryAr,
      content, contentAr,
      source, url, category, sentiment, sentimentScore,
      impactLevel, newsType, imageUrl, isPublished,
      aiAnalysis, affectedAssets,
    } = body;

    if (!title || !summary) {
      return NextResponse.json({ error: 'العنوان والملخص مطلوبان' }, { status: 400 });
    }

    // Create stable ID from URL or title
    const idSource = url || title;
    const id = `${newsType || 'live'}-${Buffer.from(idSource).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '').slice(0, 20)}`;

    // V39 FIX: Validate readiness with SAME strict criteria as the Publisher agent.
    // Previously, this used weaker criteria (imageUrl OK instead of generatedImage,
    // summaryAr enough instead of contentAr + aiAnalysis). Now matches Publisher:
    //   1. Arabic title (titleAr) — mandatory
    //   2. Arabic content (contentAr) — 500+ chars, mostly Arabic
    //   3. AI-generated image (generatedImage OR admin-provided imageUrl) — mandatory
    //   4. AI analysis with Arabic fullContent — mandatory
    //   5. Slug — mandatory
    const hasValidArabicTitle = !!(titleAr && titleAr.length > 3 && /[\u0600-\u06FF]/.test(titleAr));
    const hasArabicContent = !!(contentAr && contentAr.length >= 500 && /[\u0600-\u06FF]/.test(contentAr));
    const hasImage = !!(imageUrl && imageUrl.length > 10); // Admin-provided imageUrl is accepted for admin-created articles
    // V39: Also require AI analysis with Arabic fullContent
    let hasValidAnalysis = false;
    if (aiAnalysis && aiAnalysis.length > 50) {
      try {
        const parsed = typeof aiAnalysis === 'string' ? JSON.parse(aiAnalysis) : aiAnalysis;
        if (parsed.fullContent && parsed.fullContent.length > 50 && /[\u0600-\u06FF]/.test(parsed.fullContent)) {
          hasValidAnalysis = true;
        }
      } catch {}
    }
    const hasSlug = !!((titleAr && titleAr.length > 3)); // Slug will be generated from titleAr
    // V39: Match Publisher criteria exactly
    const isArticleReady = hasValidArabicTitle && hasArabicContent && hasImage && hasValidAnalysis && hasSlug;

    // Generate slug from Arabic title if available (includes random suffix)
    let slug = null;
    if (titleAr && titleAr.length > 3) {
      const { generateSlug } = await import('@/lib/slug');
      slug = generateSlug(String(titleAr)); // Now includes random 4-char suffix
      // Ensure slug is unique within the same locale
      const itemLocale = titleAr ? 'ar' : 'en';
      try {
        const existing = await db.newsItem.findFirst({ where: { slug, locale: itemLocale, NOT: { id } } });
        if (existing) slug = `${slug}-${Date.now().toString(36)}`;
      } catch {}
    }

    const news = await db.newsItem.create({
      data: {
        id,
        title: String(title),
        titleAr: titleAr ? String(titleAr) : null,
        summary: String(summary).slice(0, 250),
        summaryAr: summaryAr ? String(summaryAr).slice(0, 500) : null,
        content: content ? String(content) : null,
        contentAr: contentAr ? String(contentAr) : null,
        source: String(source || 'يدوي'),
        url: String(url || ''),
        category: String(category || 'اقتصاد كلي'),
        sentiment: String(sentiment || 'neutral'),
        sentimentScore: Number(sentimentScore || 55),
        impactLevel: String(impactLevel || 'medium'),
        originalLanguage: titleAr ? 'ar' : 'en',
        newsType: String(newsType || 'live'),
        affectedAssets: affectedAssets ? String(affectedAssets) : '[]',
        aiAnalysis: aiAnalysis ? String(aiAnalysis) : null,
        isPublished: isArticleReady, // V40: MUST match isReady — never publish incomplete articles
        isReady: isArticleReady, // V40: Only true when ALL Publisher criteria met
        processingStage: isArticleReady ? 'imaged' : 'fetched', // V12: Correct stage
        imageUrl: imageUrl ? String(imageUrl) : null,
        slug,
        fetchedAt: new Date(),
      },
    });

    // ── Send Telegram notification for breaking news ──
    if (String(newsType || 'live') === 'breaking' && isPublished !== false) {
      const displayTitle = news.titleAr || String(title);
      const telegramMessage = formatBreakingNews({
        title: displayTitle,
        summary: String(summary || '').slice(0, 300) || undefined,
        impactLevel: String(impactLevel || 'medium'),
        slug: news.slug || undefined,
        id: news.id,
      });

      notifyTelegramSubscribers('breaking', telegramMessage).then(count => {
        if (count > 0) console.log(`[NewsManage] Breaking news Telegram sent to ${count} subscribers`);
      }).catch(err => {
        console.warn('[NewsManage] Telegram notification failed:', err.message);
      });
    }

    return NextResponse.json({
      success: true,
      news: {
        id: String(news.id),
        title: String(news.title),
        titleAr: news.titleAr,
      },
    });
  } catch (error: any) {
    console.error('[NewsManage] POST error:', error);
    // Handle duplicate ID
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'خبر بنفس المعرف موجود بالفعل' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── PUT: Update an existing news item ─────────────────────
export async function PUT(request: Request) {
  // Require admin auth for update
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'غير مصرح — سجّل الدخول أولاً' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'معرف الخبر مطلوب' }, { status: 400 });
    }

    // Build update data with only provided fields
    const data: any = {};
    const allowedFields = ['title', 'titleAr', 'summary', 'summaryAr', 'content', 'contentAr',
      'source', 'url', 'category', 'sentiment', 'sentimentScore', 'impactLevel', 'newsType',
      'imageUrl', 'isPublished', 'isReady', 'processingStage', 'aiAnalysis', 'affectedAssets'];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        data[field] = updates[field];
      }
    }

    // V49: Admin can explicitly set isReady and isPublished directly.
    // If the admin explicitly sends isReady/isPublished in the update, respect it.
    // This allows admin to publish/unpublish articles freely.
    if (updates.isReady !== undefined) {
      data.isReady = Boolean(updates.isReady);
      if (data.isReady) {
        data.isPublished = true;
        data.processingStage = 'imaged';
      }
    }

    if (data.titleAr !== undefined) {
      data.originalLanguage = data.titleAr ? 'ar' : 'en';
    }

    // Auto-validate readiness only when admin hasn't explicitly set isReady
    // and titleAr/contentAr is being updated
    if (updates.isReady === undefined && data.titleAr !== undefined) {
      try {
        const current = await db.newsItem.findUnique({
          where: { id: String(id) },
          select: {
            titleAr: true, summaryAr: true, contentAr: true, aiAnalysis: true,
            // EGRESS FIX: removed generatedImage from select — use processingStage and where clause instead
            imageUrl: true, slug: true, isReady: true, processingStage: true,
          },
        });
        if (current) {
          if (current.isReady) {
            // Already published — don't touch isReady
            delete data.isReady;
          } else {
            // Not yet published — check if it meets criteria
            const effectiveTitleAr = data.titleAr ?? current.titleAr;
            const effectiveContentAr = data.contentAr ?? current.contentAr;
            // EGRESS FIX: use processingStage instead of pulling generatedImage base64
            // If article is at 'imaged' stage, it has a valid generated image (SVG detection handled by auto-migrate)
            const effectiveHasGeneratedImage = current.processingStage === 'imaged' || !!data.generatedImage;

            const hasValidArabicTitle = !!(effectiveTitleAr && effectiveTitleAr.length > 3 && /[\u0600-\u06FF]/.test(effectiveTitleAr));
            const hasArabicContent = !!(effectiveContentAr && effectiveContentAr.length >= 500 && /[\u0600-\u06FF]/.test(effectiveContentAr));
            
            let hasRealAnalysis = false;
            try {
              const analysisSource = data.aiAnalysis ?? current.aiAnalysis;
              if (analysisSource && analysisSource.length > 50) {
                const parsed = JSON.parse(analysisSource);
                const isMinimal = parsed.isMinimal === true || parsed.isSummaryFallback === true;
                hasRealAnalysis = !isMinimal && 
                  !!(parsed.fullContent && parsed.fullContent.length > 50 && /[\u0600-\u06FF]/.test(parsed.fullContent));
              }
            } catch {}

            if (hasValidArabicTitle && hasArabicContent && hasRealAnalysis && effectiveHasGeneratedImage && current.slug) {
              data.isReady = true;
              data.isPublished = true;
              data.processingStage = 'imaged';
            }
          }
        }
      } catch {
        delete data.isReady;
      }
    }

    const news = await db.newsItem.update({
      where: { id: String(id) },
      data,
    });

    return NextResponse.json({
      success: true,
      news: {
        id: String(news.id),
        title: String(news.title),
        titleAr: news.titleAr,
      },
    });
  } catch (error: any) {
    console.error('[NewsManage] PUT error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'الخبر غير موجود' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── DELETE: Delete a news item ────────────────────────────
// V49: Admin has FULL delete permissions for any article (published or not).
// The golden rule of not deleting published news applies to AI pipeline only.
// Admin users can delete anything with simple auth check.
// A confirmation dialog in the UI is still shown as UX best practice.
export async function DELETE(request: Request) {
  // Require admin auth for delete
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'غير مصرح — سجّل الدخول أولاً' }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const resolveId = async (): Promise<string | null> => {
      if (id) return id;
      try {
        const body = await request.json();
        return body.id || null;
      } catch { return null; }
    };

    const targetId = await resolveId();
    if (!targetId) {
      return NextResponse.json({ error: 'معرف الخبر مطلوب' }, { status: 400 });
    }

    // Check if article exists
    const article = await db.newsItem.findUnique({
      where: { id: String(targetId) },
      select: { isReady: true, isPublished: true, titleAr: true, title: true, slug: true },
    });

    if (!article) {
      return NextResponse.json({ error: 'الخبر غير موجود' }, { status: 404 });
    }

    // V49: Admin has full delete permissions — no force flag needed
    // The AI pipeline respects the golden rule, but the admin user does not
    if (article.isReady || article.isPublished) {
      console.warn(`[NewsManage] ADMIN DELETE — admin deleting published article: "${article.titleAr || article.title}" (isReady=${article.isReady}, isPublished=${article.isPublished}, slug=${article.slug})`);
    } else {
      console.log(`[NewsManage] Deleted unpublished article: "${article.titleAr || article.title}"`);
    }

    await db.newsItem.delete({ where: { id: String(targetId) } });
    return NextResponse.json({ success: true, deletedTitle: article.titleAr || article.title });
  } catch (error: any) {
    console.error('[NewsManage] DELETE error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'الخبر غير موجود' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

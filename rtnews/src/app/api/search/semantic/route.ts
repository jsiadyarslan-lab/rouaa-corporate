// ─── Search API ─────────────────────────────────────────────
// Uses PostgreSQL's native case-insensitive search via Prisma
// This is the SAME approach used by /api/news/archive, /api/reports/search, etc.
// that already works correctly in the codebase.
//
// NO MORE: Fetching 200 articles + filtering in JS (slow, unreliable)
// NO MORE: Pseudo-embedding semantic search (broken cross-lingual matching)
// NOW: Direct PostgreSQL ILIKE via Prisma contains + mode insensitive
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const requestedLimit = parseInt(searchParams.get('limit') || '10');
    const limit = Math.min(requestedLimit, 20);

    if (!query || query.trim().length < 1) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    const searchTerm = query.trim();

    // ─── STRATEGY 1: Direct Prisma search (PostgreSQL ILIKE) ───
    // This searches title, titleAr, summary, summaryAr, content, contentAr
    // Using the SAME proven approach from /api/news/archive/route.ts
    const articles = await db.newsItem.findMany({
      where: {
        isReady: true,
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { titleAr: { contains: searchTerm, mode: 'insensitive' } },
          { summary: { contains: searchTerm, mode: 'insensitive' } },
          { summaryAr: { contains: searchTerm, mode: 'insensitive' } },
          { content: { contains: searchTerm, mode: 'insensitive' } },
          { contentAr: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        titleAr: true,
        summary: true,
        summaryAr: true,
        category: true,
        slug: true,
        sentiment: true,
        impactLevel: true,
        imageUrl: true,
        fetchedAt: true,
        locale: true,
      },
      orderBy: { fetchedAt: 'desc' },
      take: limit,
    });

    // Score results based on match quality
    const results = articles.map(article => {
      const lowerQuery = searchTerm.toLowerCase();
      let score = 0.5; // Base score for any match (PostgreSQL already filtered)

      // Boost for title match (most relevant)
      if (article.title?.toLowerCase().includes(lowerQuery)) score += 0.3;
      if (article.titleAr?.toLowerCase().includes(lowerQuery)) score += 0.3;

      // Boost for summary match
      if (article.summary?.toLowerCase().includes(lowerQuery)) score += 0.1;
      if (article.summaryAr?.toLowerCase().includes(lowerQuery)) score += 0.1;

      // Cap at 1.0
      score = Math.min(score, 1.0);

      return {
        id: article.id,
        title: article.title,
        titleAr: article.titleAr || undefined,
        summary: article.summary,
        summaryAr: article.summaryAr || undefined,
        score,
        category: article.category,
        slug: article.slug || undefined,
        sentiment: (article.sentiment as string) || undefined,
        impactLevel: (article.impactLevel as string) || undefined,
        imageUrl: `/api/article-image/${article.id}`,
        publishedAt: article.fetchedAt?.toISOString() || undefined,
      };
    });

    // Sort by score (title matches first)
    results.sort((a, b) => b.score - a.score);

    // ─── STRATEGY 2: If no results, try word-level search ───
    // Split query into words and search each independently
    if (results.length === 0) {
      const words = searchTerm.split(/\s+/).filter(w => w.length > 1);

      if (words.length > 1) {
        const wordArticles = await db.newsItem.findMany({
          where: {
            isReady: true,
            OR: words.flatMap(word => [
              { title: { contains: word, mode: 'insensitive' } },
              { titleAr: { contains: word, mode: 'insensitive' } },
              { summary: { contains: word, mode: 'insensitive' } },
              { summaryAr: { contains: word, mode: 'insensitive' } },
            ]),
          },
          select: {
            id: true,
            title: true,
            titleAr: true,
            summary: true,
            summaryAr: true,
            category: true,
            slug: true,
            sentiment: true,
            impactLevel: true,
            imageUrl: true,
            fetchedAt: true,
            locale: true,
          },
          orderBy: { fetchedAt: 'desc' },
          take: limit,
        });

        for (const article of wordArticles) {
          // Count how many words match
          const text = `${article.title} ${article.summary} ${article.titleAr || ''} ${article.summaryAr || ''}`.toLowerCase();
          let matchCount = 0;
          for (const word of words) {
            if (text.includes(word.toLowerCase())) matchCount++;
          }
          const score = matchCount / words.length;

          results.push({
            id: article.id,
            title: article.title,
            titleAr: article.titleAr || undefined,
            summary: article.summary,
            summaryAr: article.summaryAr || undefined,
            score,
            category: article.category,
            slug: article.slug || undefined,
            sentiment: (article.sentiment as string) || undefined,
            impactLevel: (article.impactLevel as string) || undefined,
            imageUrl: `/api/article-image/${article.id}`,
            publishedAt: article.fetchedAt?.toISOString() || undefined,
          });
        }

        results.sort((a, b) => b.score - a.score);
      }
    }

    // ─── STRATEGY 3: If STILL no results, return recent articles ───
    // Better than showing "No results" for a financial news site
    if (results.length === 0) {
      const recentArticles = await db.newsItem.findMany({
        where: { isReady: true },
        select: {
          id: true,
          title: true,
          titleAr: true,
          summary: true,
          summaryAr: true,
          category: true,
          slug: true,
          sentiment: true,
          impactLevel: true,
          imageUrl: true,
          fetchedAt: true,
          locale: true,
        },
        orderBy: { fetchedAt: 'desc' },
        take: 5,
      });

      for (const article of recentArticles) {
        results.push({
          id: article.id,
          title: article.title,
          titleAr: article.titleAr || undefined,
          summary: article.summary,
          summaryAr: article.summaryAr || undefined,
          score: 0.1, // Low score = not a real match
          category: article.category,
          slug: article.slug || undefined,
          sentiment: (article.sentiment as string) || undefined,
          impactLevel: (article.impactLevel as string) || undefined,
          imageUrl: `/api/article-image/${article.id}`,
          publishedAt: article.fetchedAt?.toISOString() || undefined,
        });
      }
    }

    return NextResponse.json({
      query: searchTerm,
      results: results.slice(0, limit),
      total: results.length,
    });
  } catch (error: any) {
    console.error('[Search API] Error:', error.message);
    return NextResponse.json({ error: 'Search temporarily unavailable' }, { status: 500 });
  }
}

// ─── NewsHero Component ───────────────────────────────────────────────
// Server Component: Fetches and displays the latest breaking news
// Full-width hero section with dark background, image, and large title

import { db } from '@/lib/db';

export default async function NewsHero() {
  // V39: Strictest visibility check — isReady AND isPublished
  // Articles are invisible (isReady=false, isPublished=false) until fully processed.
  const heroNews = await db.newsItem.findFirst({
    where: {
      isReady: true,
      isPublished: true,
      newsType: 'breaking',
      slug: { not: null },
      titleAr: { not: null },
    },
    orderBy: {
      fetchedAt: 'desc',
    },
    select: {
      id: true, title: true, titleAr: true, source: true, sourceName: true,
      imageUrl: true, newsType: true, fetchedAt: true,
    },
  });

  // Fallback to latest news if no breaking news
  const news = heroNews || await db.newsItem.findFirst({
    where: {
      isReady: true,
      isPublished: true,
      slug: { not: null },
      titleAr: { not: null },
    },
    orderBy: {
      fetchedAt: 'desc',
    },
    select: {
      id: true, title: true, titleAr: true, source: true, sourceName: true,
      imageUrl: true, newsType: true, fetchedAt: true,
    },
  });

  if (!news) {
    return null;
  }

  const displayTitle = news.titleAr || news.title;
  const sourceName = news.sourceName || news.source;
  // Always use /api/article-image route — it handles all image formats
  const imageUrl = `/api/article-image/${news.id}`;

  return (
    <section 
      className="relative w-full min-h-[500px] overflow-hidden"
      style={{ backgroundColor: 'var(--surface-base)' }}
    >
      {/* Background Image with Overlay */}
      {imageUrl && (
        <div className="absolute inset-0">
          <img
            src={imageUrl}
            alt={displayTitle}
            className="w-full h-full object-cover opacity-30 max-w-full"
            width={1200}
            height={630}
            onError={e => { const el = e.target as HTMLImageElement; el.style.display = 'none'; }}
          />
          <div 
            className="absolute inset-0"
            style={{ 
              background: 'linear-gradient(to top, var(--surface-base) 0%, transparent 100%)' 
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-12 md:py-20">
        <div className="max-w-4xl">
          {/* Breaking Badge */}
          {news.newsType === 'breaking' && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" 
                 style={{ 
                   backgroundColor: 'var(--custom-accent)',
                   color: 'white' 
                 }}>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="font-bold text-sm">عاجل</span>
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
              style={{ color: 'white' }}>
            {displayTitle}
          </h1>

          {/* Footer: Source and Time */}
          <div className="flex items-center gap-4 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <span className="font-medium">{sourceName}</span>
            <span>•</span>
            <span>
              {new Date(news.fetchedAt).toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

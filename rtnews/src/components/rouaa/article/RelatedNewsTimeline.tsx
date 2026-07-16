// ─── Related News Timeline ─────────────────────────────────────
// Alternative timeline view of related news articles
'use client';

import { useRouter } from 'next/navigation';

interface RelatedArticle {
  id: string;
  title: string;
  summary: string;
  score: number;
  category: string;
  slug?: string;
  imageUrl?: string;
  sentiment?: string;
  impactLevel?: string;
  publishedAt?: string;
}

interface RelatedNewsTimelineProps {
  articles: RelatedArticle[];
  basePath?: string;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

export function RelatedNewsTimeline({ articles, basePath = '/news', locale = 'ar' }: RelatedNewsTimelineProps) {
  const router = useRouter();
  const t = (ar: string, en: string, fr?: string, tr?: string, es?: string) => locale === 'es' ? (es || en) : locale === 'tr' ? (tr || en) : locale === 'fr' ? (fr || en) : locale === 'en' ? en : ar;

  if (!articles || articles.length === 0) return null;

  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return t('غير محدد', 'Unknown', 'Inconnu', 'Bilinmiyor', 'Desconocido');
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (locale === 'tr') {
        if (diffMins < 60) return `${diffMins}dk önce`;
        if (diffHours < 24) return `${diffHours}sa önce`;
        if (diffDays === 1) return 'Dün';
        if (diffDays < 7) return `${diffDays}g önce`;
        return date.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });
      }
      if (locale === 'en' || locale === 'es') {
        if (diffMins < 60) return locale === 'es' ? `hace ${diffMins} min` : `${diffMins}m ago`;
        if (diffHours < 24) return locale === 'es' ? `hace ${diffHours}h` : `${diffHours}h ago`;
        if (diffDays === 1) return locale === 'es' ? 'Ayer' : 'Yesterday';
        if (diffDays < 7) return locale === 'es' ? `hace ${diffDays}d` : `${diffDays}d ago`;
        return date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric' });
      }
      if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      if (diffDays === 1) return 'أمس';
      if (diffDays < 7) return `منذ ${diffDays} أيام`;
      return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
    } catch { return ''; }
  };

  const getSentimentDot = (s?: string) => {
    if (s === 'positive') return { color: 'var(--bull)', glow: '0 0 8px rgba(34,197,94,0.4)' };
    if (s === 'negative') return { color: 'var(--bear)', glow: '0 0 8px rgba(239,83,80,0.4)' };
    return { color: 'var(--neutral)', glow: '0 0 8px rgba(100,116,139,0.3)' };
  };

  return (
    <div style={{ direction: locale === 'ar' ? 'rtl' : 'ltr' }}>
      {articles.map((article, i) => {
        const dotStyle = getSentimentDot(article.sentiment);
        const validSlug = article.slug || article.id;
        const isValidSlug = validSlug && validSlug !== 'undefined' && validSlug !== 'null';

        return (
          <div
            key={article.id}
            className="flex gap-4 relative cursor-pointer group"
            style={{ minHeight: i < articles.length - 1 ? '80px' : 'auto' }}
            onClick={() => {
              if (isValidSlug) router.push(`${basePath}/${validSlug}`);
            }}
          >
            {/* Connecting line */}
            {i < articles.length - 1 && (
              <div
                className="absolute"
                style={{
                  right: '9px',
                  top: '24px',
                  bottom: '0',
                  width: '2px',
                  background: 'var(--border)',
                  borderRadius: '1px',
                  transition: 'background 0.3s',
                }}
              />
            )}

            {/* Dot */}
            <div className="flex-shrink-0 mt-2 relative z-10">
              <div
                className="w-[20px] h-[20px] rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  background: 'var(--bg4)',
                  border: `2px solid ${dotStyle.color}`,
                  boxShadow: dotStyle.glow,
                }}
              >
                <div className="w-[8px] h-[8px] rounded-full transition-all duration-300 group-hover:scale-150" style={{ background: dotStyle.color }} />
              </div>
            </div>

            {/* Content */}
            <div
              className="flex-1 pb-4 rounded-lg p-3 transition-all duration-300 group-hover:-translate-y-0.5"
              style={{
                background: 'var(--bg4)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[10px] font-mono-price font-bold" style={{ color: 'var(--text3)' }}>
                  {formatRelativeTime(article.publishedAt)}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'var(--cyan2)', color: 'var(--cyan)' }}>
                  {article.category}
                </span>
                {article.score > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'var(--purple2)', color: 'var(--purple)' }}>
                    {t('صلة', 'Relevance', 'Pertinence', 'Alaka', 'Relevancia')} {Math.round(article.score * 100)}%
                  </span>
                )}
              </div>
              <h4 className="text-[13px] font-semibold leading-[1.7] line-clamp-2 group-hover:text-[var(--cyan)] transition-colors" style={{ color: 'var(--text)' }}>
                {article.title}
              </h4>
              {article.summary && (
                <p className="text-[11px] leading-[1.7] line-clamp-1 mt-1" style={{ color: 'var(--text3)' }}>{article.summary}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

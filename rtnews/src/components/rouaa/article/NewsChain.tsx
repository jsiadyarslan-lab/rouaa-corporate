// ─── News Chain ("Ongoing Story") ──────────────────────────────
// Shows a chain of related articles that tell an ongoing story
// Horizontal scrollable timeline of articles
'use client';

import { useRouter } from 'next/navigation';

interface ChainArticle {
  id: string;
  title: string;
  slug?: string;
  publishedAt?: string;
  sentiment?: string;
  category?: string;
  imageUrl?: string;
}

interface NewsChainProps {
  articles: ChainArticle[];
  basePath?: string;
  currentArticleId?: string;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

export function NewsChain({ articles, basePath = '/news', currentArticleId, locale = 'ar' }: NewsChainProps) {
  const router = useRouter();
  const t = (ar: string, en: string, fr?: string, tr?: string, es?: string) => locale === 'es' ? (es || en) : locale === 'tr' ? (tr || en) : locale === 'fr' ? (fr || en) : locale === 'en' ? en : ar;

  if (!articles || articles.length < 2) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString(locale === 'es' ? 'es-ES' : locale === 'tr' ? 'tr-TR' : locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'ar-SA', { month: 'short', day: 'numeric' });
    } catch { return ''; }
  };

  const getSentimentDot = (s?: string) => {
    if (s === 'positive') return 'var(--bull)';
    if (s === 'negative') return 'var(--bear)';
    return 'var(--neutral)';
  };

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        <span className="text-[13px] font-bold" style={{ color: 'var(--cyan)' }}>{t('القصة المستمرة', 'Ongoing Story', 'Histoire en cours', 'Devam Eden Hikaye', 'Historia Continua')}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.2)' }}>
          {articles.length} {t('أخبار', 'news', 'actualités', 'haber', 'noticias')}
        </span>
      </div>

      {/* Horizontal Scrollable Chain */}
      <div className="overflow-x-auto custom-scrollbar" style={{ direction: locale === 'ar' ? 'rtl' : 'ltr' }}>
        <div className="flex gap-0 min-w-max pb-2">
          {articles.map((article, i) => {
            const isCurrent = article.id === currentArticleId;
            const isValidSlug = article.slug && article.slug !== 'undefined' && article.slug !== 'null';

            return (
              <div key={article.id} className="flex items-center flex-shrink-0">
                {/* Chain Node */}
                <button
                  onClick={() => {
                    if (isValidSlug && !isCurrent) router.push(`${basePath}/${article.slug || article.id}`);
                  }}
                  disabled={isCurrent}
                  className="flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-300 min-w-[120px] max-w-[160px]"
                  style={{
                    background: isCurrent ? 'var(--cyan2)' : 'transparent',
                    border: isCurrent ? '1px solid rgba(0,229,255,0.3)' : '1px solid transparent',
                    cursor: isCurrent ? 'default' : 'pointer',
                  }}
                >
                  {/* Time */}
                  <span className="text-[10px] font-mono-price font-bold" style={{ color: isCurrent ? 'var(--cyan)' : 'var(--text3)' }}>
                    {formatDate(article.publishedAt)}
                  </span>

                  {/* Dot */}
                  <div className="relative">
                    <div
                      className="w-3 h-3 rounded-full transition-all"
                      style={{
                        background: isCurrent ? 'var(--cyan)' : getSentimentDot(article.sentiment),
                        boxShadow: isCurrent ? '0 0 10px rgba(0,229,255,0.5)' : 'none',
                      }}
                    />
                    {isCurrent && (
                      <div className="absolute inset-0 w-3 h-3 rounded-full animate-ping" style={{ background: 'var(--cyan)', opacity: 0.3 }} />
                    )}
                  </div>

                  {/* Title */}
                  <span
                    className="text-[11px] leading-[1.6] line-clamp-2 text-center"
                    style={{ color: isCurrent ? 'var(--cyan)' : 'var(--text2)' }}
                  >
                    {article.title}
                  </span>

                  {/* Current label */}
                  {isCurrent && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(0,229,255,0.15)', color: 'var(--cyan)' }}>
                      {t('المقال الحالي', 'Current Article', 'Article actuel', 'Mevcut Makale', 'Artículo actual')}
                    </span>
                  )}
                </button>

                {/* Connector Line */}
                {i < articles.length - 1 && (
                  <div className="flex-shrink-0 w-8 h-0.5 rounded" style={{ background: 'var(--border)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

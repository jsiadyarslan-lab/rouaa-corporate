// ─── Related News Cards (Enhanced) ─────────────────────────────
// Enhanced related article cards with:
// - Relevance score indicator
// - Time proximity indicator ("منذ ساعة", "أمس")
// - Hover animation improvements
// - Category, sentiment, impact display
'use client';

import { useRouter } from 'next/navigation';
import NewsImage from '@/components/rouaa/NewsImage';

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

interface RelatedNewsGridProps {
  articles: RelatedArticle[];
  basePath?: string; // '/article' or '/news'
  showRelevance?: boolean;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

const categoryConfig: Record<string, { css: string; label: string }> = {
  'بنوك مركزية': { css: 'cat-central-banks', label: 'بنوك مركزية' },
  'سلع': { css: 'cat-metals', label: 'سلع' },
  'أسواق عربية': { css: 'cat-arab-markets', label: 'أسواق عربية' },
  'اقتصاد أمريكي': { css: 'cat-macro', label: 'اقتصاد أمريكي' },
  'أرباح شركات': { css: 'cat-earnings', label: 'أرباح' },
  'فوركس': { css: 'cat-forex', label: 'فوركس' },
  'عملات': { css: 'cat-forex', label: 'عملات' },
  'تشفير': { css: 'cat-crypto', label: 'كريبتو' },
  'كريبتو': { css: 'cat-crypto', label: 'كريبتو' },
  'نفط': { css: 'cat-oil', label: 'طاقة' },
  'طاقة': { css: 'cat-oil', label: 'طاقة' },
  'أسهم': { css: 'cat-stocks', label: 'أسهم' },
  'اقتصاد كلي': { css: 'cat-economy', label: 'اقتصاد كلي' },
};

export function RelatedNewsGrid({ articles, basePath = '/news', showRelevance = true, locale = 'ar' }: RelatedNewsGridProps) {
  const router = useRouter();
  const t = (ar: string, en: string, fr?: string, tr?: string, es?: string) => locale === 'es' ? (es || en) : locale === 'tr' ? (tr || en) : locale === 'fr' ? (fr || en) : locale === 'en' ? en : ar;

  if (articles.length === 0) return null;

  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return '';
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

  const getImpactDot = (impact?: string) => {
    if (impact === 'high') return { color: 'var(--bear)', label: t('عالٍ', 'High', 'Élevé', 'Yüksek', 'Alto') };
    if (impact === 'medium') return { color: 'var(--gold)', label: t('متوسط', 'Medium', 'Moyen', 'Orta', 'Medio') };
    return { color: 'var(--neutral)', label: t('منخفض', 'Low', 'Faible', 'Düşük', 'Bajo') };
  };

  const getSentimentIcon = (s?: string) => {
    if (s === 'positive') return { icon: '▲', color: 'var(--bull)' };
    if (s === 'negative') return { icon: '▼', color: 'var(--bear)' };
    return { icon: '●', color: 'var(--neutral)' };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {articles.map((article) => {
        const catCfg = categoryConfig[article.category] || { css: 'cat-economy', label: article.category };
        const impact = getImpactDot(article.impactLevel);
        const sentiment = getSentimentIcon(article.sentiment);
        const validSlug = article.slug || article.id;
        const relevanceScore = Math.round(article.score * 100);

        return (
          <button
            key={article.id}
            onClick={() => {
              if (validSlug && validSlug !== 'undefined' && validSlug !== 'null') {
                router.push(`${basePath}/${validSlug}`);
              }
            }}
            className={`glass-card ${locale === 'ar' ? 'text-right' : 'text-left'} transition-all duration-300 hover:-translate-y-1.5 cursor-pointer group`}
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            {/* Relevance indicator bar */}
            {showRelevance && article.score > 0 && (
              <div className="absolute top-0 right-0 left-0 h-[3px] rounded-t-lg overflow-hidden" style={{ background: 'var(--border)' }}>
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${Math.min(relevanceScore, 100)}%`,
                    background: 'linear-gradient(90deg, var(--cyan), var(--purple))',
                    borderRadius: '0 0 0 3px',
                  }}
                />
              </div>
            )}

            {/* Image thumbnail — always show with gradient fallback */}
            <div className="relative h-[120px] rounded-t-xl overflow-hidden mb-0" style={{ borderBottom: '1px solid var(--border)' }}>
              <NewsImage
                src={article.imageUrl}
                alt={article.title}
                category={article.category}
                width={400}
                height={120}
                className="w-full h-full transition-transform duration-700 group-hover:scale-110"
                style={{ width: '100%', height: '120px' }}
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--bg4) 0%, transparent 60%)' }} />
            </div>
            <div className="p-4">
              {/* Category + Impact + Relevance row */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-[9px] px-2 py-0.5 rounded font-medium ${catCfg.css}`}>
                  {catCfg.label}
                </span>
                <span className="flex items-center gap-1 text-[9px]" style={{ color: impact.color }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: impact.color }} />
                  {impact.label}
                </span>
                {article.sentiment && (
                  <span className="text-[9px]" style={{ color: sentiment.color }}>{sentiment.icon}</span>
                )}
                {showRelevance && article.score > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded ms-auto" style={{ background: 'var(--purple2)', color: 'var(--purple)' }}>
                    {t('صلة', 'Relevance', 'Pertinence', 'Alaka', 'Relevancia')} {relevanceScore}%
                  </span>
                )}
              </div>

              <h4 className="text-[14px] font-semibold mb-2 leading-[1.7] line-clamp-2 group-hover:text-[var(--cyan)] transition-colors duration-300" style={{ color: 'var(--text)' }}>{article.title}</h4>
              <p className="text-[12px] leading-[1.8] line-clamp-2" style={{ color: 'var(--text3)' }}>{article.summary}</p>

              {/* Time proximity */}
              {article.publishedAt && (
                <div className="flex items-center gap-1.5 mt-2.5">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                  <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
                    {formatRelativeTime(article.publishedAt)}
                  </span>
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

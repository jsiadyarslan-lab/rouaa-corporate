// ─── Sentiment Comparison ──────────────────────────────────────
// Compares current article sentiment with overall market sentiment
// Shows before/after or source vs AI sentiment
'use client';

interface SentimentComparisonProps {
  articleSentiment: string;
  articleConfidence: number;
  marketSentiment?: string;     // overall market sentiment
  marketConfidence?: number;    // overall market confidence
  sourceSentiment?: string;     // original source sentiment
  sourceConfidence?: number;    // source confidence
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

export function SentimentComparison({
  articleSentiment,
  articleConfidence,
  marketSentiment,
  marketConfidence,
  sourceSentiment,
  sourceConfidence,
  locale = 'ar',
}: SentimentComparisonProps) {
  const t = (ar: string, en: string, fr?: string, tr?: string, es?: string) => locale === 'es' ? (es || en) : locale === 'tr' ? (tr || en) : locale === 'fr' ? (fr || en) : locale === 'en' ? en : ar;
  const getSentimentLabel = (s: string) => {
    if (s === 'positive') return t('إيجابي', 'Positive', 'Positif', 'Olumlu', 'Positivo');
    if (s === 'negative') return t('سلبي', 'Negative', 'Négatif', 'Olumsuz', 'Negativo');
    return t('محايد', 'Neutral', 'Neutre', 'Nötr', 'Neutral');
  };

  const getSentimentColor = (s: string) => {
    if (s === 'positive') return 'var(--bull)';
    if (s === 'negative') return 'var(--bear)';
    return 'var(--neutral)';
  };

  const getSentimentIcon = (s: string) => {
    if (s === 'positive') return '▲';
    if (s === 'negative') return '▼';
    return '●';
  };

  // Calculate alignment/difference between sentiments
  const getAlignmentLabel = () => {
    if (!marketSentiment && !sourceSentiment) return null;
    const compareWith = marketSentiment || sourceSentiment || 'neutral';
    if (articleSentiment === compareWith) return { text: t('متوافق', 'Aligned', 'Aligné', 'Uyumlu', 'Alineado'), color: 'var(--bull)' };
    // Both not neutral
    if (articleSentiment !== 'neutral' && compareWith !== 'neutral' && articleSentiment !== compareWith) {
      return { text: t('متعارض', 'Opposing', 'Opposé', 'Zıt', 'Opuesto'), color: 'var(--bear)' };
    }
    return { text: t('مختلف جزئياً', 'Partially Different', 'Partiellement différent', 'Kısmen Farklı', 'Parcialmente diferente'), color: 'var(--gold)' };
  };

  const alignment = getAlignmentLabel();

  // Generate gauge position: positive → right, negative → left, neutral → center
  const getGaugePosition = (sentiment: string, confidence: number) => {
    if (sentiment === 'positive') return Math.min(50 + confidence * 0.45, 95);
    if (sentiment === 'negative') return Math.max(50 - confidence * 0.45, 5);
    return 50;
  };

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2">
          <path d="M12 20V10" />
          <path d="M18 20V4" />
          <path d="M6 20v-4" />
        </svg>
        <span className="text-[13px] font-bold" style={{ color: 'var(--cyan)' }}>{t('مقارنة المشاعر', 'Sentiment Comparison', 'Comparaison du sentiment', 'Duygu Karşılaştırması', 'Comparación de sentimiento')}</span>
        {alignment && (
          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold mr-auto" style={{
            background: alignment.color === 'var(--bull)' ? 'var(--bull2)' : alignment.color === 'var(--bear)' ? 'var(--bear2)' : 'var(--gold2)',
            color: alignment.color,
            border: '1px solid ' + (alignment.color === 'var(--bull)' ? 'rgba(34,197,94,0.25)' : alignment.color === 'var(--bear)' ? 'rgba(239,83,80,0.25)' : 'rgba(255,184,0,0.25)'),
          }}>
            {alignment.text}
          </span>
        )}
      </div>

      {/* Sentiment Spectrum Bar */}
      <div className="mb-5">
        <div className="flex justify-between mb-1.5">
          <span className="text-[10px] font-bold" style={{ color: 'var(--bear)' }}>{t('سلبي', 'Negative', 'Négatif', 'Olumsuz', 'Negativo')}</span>
          <span className="text-[10px] font-bold" style={{ color: 'var(--neutral)' }}>{t('محايد', 'Neutral', 'Neutre', 'Nötr', 'Neutral')}</span>
          <span className="text-[10px] font-bold" style={{ color: 'var(--bull)' }}>{t('إيجابي', 'Positive', 'Positif', 'Olumlu', 'Positivo')}</span>
        </div>
        <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          {/* Gradient background */}
          <div className="absolute inset-0 rounded-full" style={{
            background: 'linear-gradient(90deg, var(--bear), var(--gold), var(--bull))',
            opacity: 0.15,
          }} />
          {/* Article sentiment marker */}
          <div
            className="absolute top-0 w-2.5 h-2.5 rounded-full"
            style={{
              right: `${getGaugePosition(articleSentiment, articleConfidence)}%`,
              transform: 'translateX(50%)',
              background: getSentimentColor(articleSentiment),
              boxShadow: `0 0 8px ${getSentimentColor(articleSentiment)}`,
              border: '2px solid var(--bg4)',
              zIndex: 2,
            }}
          />
          {/* Market sentiment marker (triangle) */}
          {marketSentiment && (
            <div
              className="absolute"
              style={{
                right: `${getGaugePosition(marketSentiment, marketConfidence || 50)}%`,
                transform: 'translateX(50%)',
                top: '-4px',
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '6px solid var(--purple)',
                zIndex: 2,
              }}
            />
          )}
        </div>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: getSentimentColor(articleSentiment) }} />
            <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{t('المقال', 'Article', 'Article', 'Makale', 'Artículo')}</span>
          </div>
          {marketSentiment && (
            <div className="flex items-center gap-1">
              <div className="w-0 h-0" style={{ borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '5px solid var(--purple)' }} />
              <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{t('السوق', 'Market', 'Marché', 'Pazar', 'Mercado')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Article Sentiment Card */}
        <div className="rounded-lg p-3 text-center" style={{
          background: getSentimentColor(articleSentiment) === 'var(--bull)' ? 'var(--bull2)' : getSentimentColor(articleSentiment) === 'var(--bear)' ? 'var(--bear2)' : 'var(--cyan2)',
          border: '1px solid ' + (getSentimentColor(articleSentiment) === 'var(--bull)' ? 'rgba(34,197,94,0.2)' : getSentimentColor(articleSentiment) === 'var(--bear)' ? 'rgba(239,83,80,0.2)' : 'rgba(0,229,255,0.2)'),
        }}>
          <div className="text-[10px] mb-1.5" style={{ color: 'var(--text3)' }}>{t('تحليل المقال', 'Article Analysis', "Analyse de l'article", 'Makale Analizi', 'Análisis del artículo')}</div>
          <div className="text-[18px] font-bold mb-0.5" style={{ color: getSentimentColor(articleSentiment) }}>
            {getSentimentIcon(articleSentiment)} {getSentimentLabel(articleSentiment)}
          </div>
          <div className="text-[11px] font-mono-price" style={{ color: 'var(--text2)' }}>{articleConfidence}%</div>
        </div>

        {/* Market/Source Sentiment Card */}
        <div className="rounded-lg p-3 text-center" style={{
          background: marketSentiment
            ? (getSentimentColor(marketSentiment) === 'var(--bull)' ? 'var(--bull2)' : getSentimentColor(marketSentiment) === 'var(--bear)' ? 'var(--bear2)' : 'var(--cyan2)')
            : sourceSentiment
              ? (getSentimentColor(sourceSentiment) === 'var(--bull)' ? 'var(--bull2)' : getSentimentColor(sourceSentiment) === 'var(--bear)' ? 'var(--bear2)' : 'var(--cyan2)')
              : 'var(--cyan2)',
          border: '1px solid rgba(0,229,255,0.2)',
        }}>
          <div className="text-[10px] mb-1.5" style={{ color: 'var(--text3)' }}>
            {marketSentiment ? t('المشاعر السوقية', 'Market Sentiment', 'Sentiment du marché', 'Piyasa Duygusu', 'Sentimiento del mercado') : sourceSentiment ? t('المصدر الأصلي', 'Original Source', 'Source originale', 'Orijinal Kaynak', 'Fuente original') : t('الاتجاه العام', 'Overall Trend', 'Tendance générale', 'Genel Trend', 'Tendencia general')}
          </div>
          <div className="text-[18px] font-bold mb-0.5" style={{
            color: marketSentiment
              ? getSentimentColor(marketSentiment)
              : sourceSentiment
                ? getSentimentColor(sourceSentiment)
                : 'var(--neutral)',
          }}>
            {getSentimentIcon(marketSentiment || sourceSentiment || 'neutral')} {getSentimentLabel(marketSentiment || sourceSentiment || 'neutral')}
          </div>
          <div className="text-[11px] font-mono-price" style={{ color: 'var(--text2)' }}>
            {marketConfidence || sourceConfidence || 50}%
          </div>
        </div>
      </div>
    </div>
  );
}

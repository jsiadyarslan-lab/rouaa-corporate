'use client';

import { NewsWithAnalysis, parseAiAnalysis, timeAgo } from './types';
import s from './NewsAnalysisSection.module.css';

type Locale5 = 'ar' | 'en' | 'fr' | 'tr' | 'es';

interface NewsAnalysisSectionProps {
  news: NewsWithAnalysis[];
  loading: boolean;
  locale?: Locale5;
}

function formatPubTime5(dateStr: string, locale: Locale5): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const dl = locale === 'ar' ? 'ar-EG' : locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : locale === 'tr' ? 'tr-TR' : 'en-US';
    return date.toLocaleDateString(dl, { day: 'numeric', month: 'short' }) + ' · ' + date.toLocaleTimeString(dl, { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

const TEXT: Record<Locale5, {
  sectionTitle: string; viewAll: string; loading: string;
  noNews: string; autoAnalyzed: string;
  highImpact: string; mediumImpact: string; lowImpact: string;
  aiAnalysis: string;
  positive: string; negative: string; neutral: string;
}> = {
  ar: {
    sectionTitle: 'آخر تحليلات AI للأخبار', viewAll: 'عرض كل الأخبار ←',
    loading: 'جارٍ التحميل...', noNews: 'لا توجد أخبار مع تحليل AI متاحة حالياً',
    autoAnalyzed: 'يتم تحليل الأخبار الجديدة تلقائياً بواسطة AI',
    highImpact: 'تأثير عالي', mediumImpact: 'تأثير متوسط', lowImpact: 'تأثير منخفض',
    aiAnalysis: 'تحليل AI', positive: '📈 إيجابي', negative: '📉 سلبي', neutral: '◆ محايد',
  },
  en: {
    sectionTitle: 'Latest AI News Analysis', viewAll: 'View All News →',
    loading: 'Loading...', noNews: 'No news with AI analysis available',
    autoAnalyzed: 'New articles are analyzed automatically by AI',
    highImpact: 'High Impact', mediumImpact: 'Medium Impact', lowImpact: 'Low Impact',
    aiAnalysis: 'AI Analysis', positive: '📈 Positive', negative: '📉 Negative', neutral: '◆ Neutral',
  },
  fr: {
    sectionTitle: 'Dernières analyses IA des actualités', viewAll: 'Voir toutes les actualités →',
    loading: 'Chargement...', noNews: 'Aucune actualité avec analyse IA disponible',
    autoAnalyzed: 'Les nouveaux articles sont analysés automatiquement par l\'IA',
    highImpact: 'Impact élevé', mediumImpact: 'Impact moyen', lowImpact: 'Faible impact',
    aiAnalysis: 'Analyse IA', positive: '📈 Positif', negative: '📉 Négatif', neutral: '◆ Neutre',
  },
  tr: {
    sectionTitle: 'Son AI Haber Analizleri', viewAll: 'Tüm Haberleri Gör →',
    loading: 'Yükleniyor...', noNews: 'AI analizli haber bulunmuyor',
    autoAnalyzed: 'Yeni haberler AI tarafından otomatik analiz edilir',
    highImpact: 'Yüksek Etki', mediumImpact: 'Orta Etki', lowImpact: 'Düşük Etki',
    aiAnalysis: 'AI Analizi', positive: '📈 Pozitif', negative: '📉 Negatif', neutral: '◆ Nötr',
  },
  es: {
    sectionTitle: 'Últimos Análisis IA de Noticias', viewAll: 'Ver Todas las Noticias →',
    loading: 'Cargando...', noNews: 'No hay noticias con análisis IA disponibles',
    autoAnalyzed: 'Los nuevos artículos se analizan automáticamente por IA',
    highImpact: 'Alto Impacto', mediumImpact: 'Impacto Medio', lowImpact: 'Bajo Impacto',
    aiAnalysis: 'Análisis IA', positive: '📈 Positivo', negative: '📉 Negativo', neutral: '◆ Neutral',
  },
};

export default function NewsAnalysisSection({ news, loading, locale = 'ar' }: NewsAnalysisSectionProps) {
  const txt = TEXT[locale] || TEXT.en;
  const newsPath = locale === 'ar' ? '/news' : `/${locale}/news`;

  return (
    <div>
      <div className={s.sectionHeader}>
        <div className={s.sectionTitleWrap}>
          <span className={s.sectionIcon}>🧠</span>
          <span className={s.sectionTitle}>{txt.sectionTitle}</span>
          <span className={s.sectionCount}>{news.length}</span>
        </div>
        <a href={newsPath} className={s.sectionLink}>{txt.viewAll}</a>
      </div>

      {loading ? (
        <div className={s.loadingSpinner}>
          <div className={s.spinnerDot} style={{ animationDelay: '0s' }} />
          <div className={s.spinnerDot} style={{ animationDelay: '0.2s' }} />
          <div className={s.spinnerDot} style={{ animationDelay: '0.4s' }} />
          <span>{txt.loading}</span>
        </div>
      ) : news.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyStateIcon}>🧠</div>
          <div>{txt.noNews}</div>
          <div style={{ fontSize: 11, marginTop: 6 }}>{txt.autoAnalyzed}</div>
        </div>
      ) : (
        <div className={s.newsCardsGrid}>
          {news.map(n => {
            const analysis = parseAiAnalysis(n.aiAnalysis);
            const title = locale === 'ar' ? (n.titleAr || n.title) : (n.title || n.titleAr);
            const newsDetailPath = locale === 'ar' ? `/news/${n.slug || n.id}` : `/${locale}/news/${n.slug || n.id}`;
            const impactLabel = n.impactLevel === 'high' ? txt.highImpact : n.impactLevel === 'medium' ? txt.mediumImpact : txt.lowImpact;
            const sentimentLabel = n.sentiment === 'positive' ? txt.positive : n.sentiment === 'negative' ? txt.negative : txt.neutral;

            return (
              <a key={n.id} href={newsDetailPath} style={{ textDecoration: 'none' }}>
                <div className={s.newsAnalysisCard}>
                  <div className={s.newsCardBody}>
                    <div className={s.newsCardHeader}>
                      <span className={s.newsCardCategory}>{n.category}</span>
                      <div className={s.newsCardImpact}>
                        <span className={`${s.impactDot} ${n.impactLevel || 'medium'}`} />
                        <span className={s.impactLabel}>{impactLabel}</span>
                      </div>
                    </div>
                    <div className={s.newsCardTitle}>{title}</div>

                    {analysis && (
                      <div className={s.aiBlock}>
                        <div className={s.aiBlockHeader}>
                          <span style={{ fontSize: 12 }}>🧠</span>
                          <span className={s.aiBlockLabel}>{txt.aiAnalysis}</span>
                        </div>

                        {analysis.keyTakeaways && analysis.keyTakeaways.length > 0 && (
                          <div className={s.aiTakeaways}>
                            {analysis.keyTakeaways.slice(0, 3).map((tk, i) => (
                              <div key={i} className={s.aiTakeawayItem}>{tk}</div>
                            ))}
                          </div>
                        )}

                        {analysis.recommendation && (
                          <div className={s.aiRecommendation}>{analysis.recommendation}</div>
                        )}

                        {analysis.affectedAssets && analysis.affectedAssets.length > 0 && (
                          <div className={s.aiAssetsRow}>
                            {analysis.affectedAssets.slice(0, 4).map((asset, i) => (
                              <span key={i} className={`${s.aiAssetChip} ${asset.direction === 'up' ? s.up : asset.direction === 'down' ? s.down : s.neutral}`}>
                                {asset.direction === 'up' ? '▲' : asset.direction === 'down' ? '▼' : '◆'}
                                {asset.symbol}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className={s.newsCardFooter}>
                    <span className={`${s.newsCardSentiment} ${n.sentiment}`}>{sentimentLabel}</span>
                    <span className={s.newsCardTime}>{timeAgo(n.publishedAt, locale)}{formatPubTime5(n.publishedAt, locale) ? ` · ${formatPubTime5(n.publishedAt, locale)}` : ''}</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

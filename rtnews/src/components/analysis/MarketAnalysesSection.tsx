'use client';

import { MarketAnalysisItem, ASSET_CLASS, RISK_LEVEL, sentimentClass, sentimentLabel, riskLabel, assetClassLabel } from './types';
import s from './MarketAnalysesSection.module.css';

type Locale5 = 'ar' | 'en' | 'fr' | 'tr' | 'es';

interface MarketAnalysesSectionProps {
  analyses: MarketAnalysisItem[];
  loading: boolean;
  locale?: Locale5;
}

function cleanTitle(raw: string): string {
  let t = String(raw || '').trim();
  if (t.startsWith('{')) {
    try { const obj = JSON.parse(t); t = String(obj.title || obj.name || ''); }
    catch { const m = t.match(/"title"\s*:\s*"([^"]+)"/); if (m) t = m[1]; else t = t.replace(/[{}"]/g, '').trim().slice(0, 80); }
  }
  t = t.replace(/^#{1,6}\s+/gm, '').replace(/\*\*/g, '').replace(/\*{1,2}/g, '');
  t = t.replace(/^\[\d+\]\s*/, '');
  t = t.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ' ');
  t = t.replace(/^[:\-\u2013\u2014]+\s*/, '');
  t = t.replace(/\s+/g, ' ').trim();
  if (t.length > 120) t = t.slice(0, 117) + '...';
  return t || 'Analysis';
}

function timeAgo5(dateStr: string, locale: Locale5): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diff)) return '';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return locale === 'ar' ? 'الآن' : locale === 'fr' ? "À l'instant" : locale === 'es' ? 'Ahora' : locale === 'tr' ? 'Şimdi' : 'Just now';
  if (mins < 60) return locale === 'ar' ? `منذ ${mins} دقيقة` : locale === 'fr' ? `Il y a ${mins} min` : locale === 'es' ? `Hace ${mins} min` : locale === 'tr' ? `${mins} dk önce` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return locale === 'ar' ? `منذ ${hours} ساعة` : locale === 'fr' ? `Il y a ${hours}h` : locale === 'es' ? `Hace ${hours}h` : locale === 'tr' ? `${hours} sa önce` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return locale === 'ar' ? `منذ ${days} يوم` : locale === 'fr' ? `Il y a ${days}j` : locale === 'es' ? `Hace ${days}d` : locale === 'tr' ? `${days} gün önce` : `${days}d ago`;
}

function formatPubTime5(dateStr: string, locale: Locale5): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const dl = locale === 'ar' ? 'ar-EG' : locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : locale === 'tr' ? 'tr-TR' : 'en-US';
    return date.toLocaleDateString(dl, { day: 'numeric', month: 'short' }) + ' · ' + date.toLocaleTimeString(dl, { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

const STOCK_TITLE_PREFIXES = [
  /Comprehensive\s+Analysis\s*:\s*/i, /Technical\s+Analysis\s*:\s*/i,
  /Fundamental\s+Analysis\s*:\s*/i, /Full\s+Analysis\s*:\s*/i,
  /Risk\s+Analysis\s*:\s*/i, /News\s+Impact\s*:\s*/i,
  /Weekly\s+Outlook\s*:\s*/i, /Daily\s+Analysis\s*:\s*/i,
  /Market\s+Analysis\s*:\s*/i, /Quick\s+Analysis\s*:\s*/i,
  /In-Depth\s+Analysis\s*:\s*/i, /Entry\/Exit\s+Analysis\s*:\s*/i,
  /AI\s+Analysis\s*:\s*/i, /Analysis\s*:\s*/i,
];
const SENTIMENT_WORDS = ['Bullish', 'Bearish', 'Neutral', 'Positive', 'Negative', 'Strong Buy', 'Strong Sell', 'Buy', 'Sell', 'Hold'];

function sanitizeStockTitle(rawTitle: string, sentiment: string, locale: Locale5): string {
  let t = cleanTitle(rawTitle);
  if (!t || t === 'Analysis') return t;
  const hasTemplatePrefix = STOCK_TITLE_PREFIXES.some(rx => rx.test(t));
  if (!hasTemplatePrefix) return t;
  for (const rx of STOCK_TITLE_PREFIXES) { t = t.replace(rx, ''); }
  t = t.trim();
  const sClass = sentimentClass(sentiment);
  const sLabel = sClass === 'bullish' ? (locale === 'ar' ? 'صعودي' : locale === 'fr' ? 'Haussier' : locale === 'es' ? 'Alcista' : locale === 'tr' ? 'Yükseliş' : 'Bullish') : sClass === 'bearish' ? (locale === 'ar' ? 'هبوطي' : locale === 'fr' ? 'Baissier' : locale === 'es' ? 'Bajista' : locale === 'tr' ? 'Düşüş' : 'Bearish') : (locale === 'ar' ? 'محايد' : locale === 'fr' ? 'Neutre' : locale === 'es' ? 'Neutral' : locale === 'tr' ? 'Nötr' : 'Neutral');
  for (const sw of SENTIMENT_WORDS) { t = t.replace(new RegExp(`^${sw}\\s+`, 'i'), ''); }
  const singleLetterSymbolMatch = t.match(/^([A-Z])\s+([A-Z]{2,5})$/);
  if (singleLetterSymbolMatch) { return `${singleLetterSymbolMatch[2]} – ${sLabel}`; }
  if (t) { return `${t} – ${sLabel}`; }
  return locale === 'ar' ? 'تحليل' : locale === 'fr' ? 'Analyse' : locale === 'es' ? 'Análisis' : locale === 'tr' ? 'Analiz' : 'Analysis';
}

const TEXT: Record<Locale5, {
  sectionTitle: string; viewAll: string; loading: string;
  noAnalyses: string; analysesGenerated: string;
}> = {
  ar: { sectionTitle: 'تحليلات السوق', viewAll: 'عرض الكل ←', loading: 'جارٍ التحميل...', noAnalyses: 'لا توجد تحليلات سوق متاحة حالياً', analysesGenerated: 'يتم إنشاء تحليلات جديدة تلقائياً كل ساعة' },
  en: { sectionTitle: 'Market Analyses', viewAll: 'View All →', loading: 'Loading...', noAnalyses: 'No market analyses available', analysesGenerated: 'New analyses are generated automatically every hour' },
  fr: { sectionTitle: 'Analyses de marché', viewAll: 'Voir tout →', loading: 'Chargement...', noAnalyses: 'Aucune analyse de marché disponible', analysesGenerated: 'De nouvelles analyses sont générées automatiquement chaque heure' },
  tr: { sectionTitle: 'Piyasa Analizleri', viewAll: 'Tümünü Gör →', loading: 'Yükleniyor...', noAnalyses: 'Mevcut piyasa analizi bulunmuyor', analysesGenerated: 'Yeni analizler her saat otomatik olarak oluşturulur' },
  es: { sectionTitle: 'Análisis de Mercado', viewAll: 'Ver Todo →', loading: 'Cargando...', noAnalyses: 'No hay análisis de mercado disponibles', analysesGenerated: 'Se generan nuevos análisis automáticamente cada hora' },
};

export default function MarketAnalysesSection({ analyses, loading, locale = 'ar' }: MarketAnalysesSectionProps) {
  const txt = TEXT[locale] || TEXT.en;
  const acMap = ASSET_CLASS;
  const riskMap = RISK_LEVEL;
  const reportsPath = locale === 'ar' ? '/reports' : `/${locale}/reports`;

  return (
    <div>
      <div className={s.sectionHeader}>
        <div className={s.sectionTitleWrap}>
          <span className={s.sectionIcon}>📊</span>
          <span className={s.sectionTitle}>{txt.sectionTitle}</span>
          <span className={s.sectionCount}>{analyses.length}</span>
        </div>
        <a href={reportsPath} className={s.sectionLink}>{txt.viewAll}</a>
      </div>

      {loading ? (
        <div className={s.loadingSpinner}>
          <div className={s.spinnerDot} style={{ animationDelay: '0s' }} />
          <div className={s.spinnerDot} style={{ animationDelay: '0.2s' }} />
          <div className={s.spinnerDot} style={{ animationDelay: '0.4s' }} />
          <span>{txt.loading}</span>
        </div>
      ) : analyses.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyStateIcon}>📊</div>
          <div>{txt.noAnalyses}</div>
          <div style={{ fontSize: 11, marginTop: 6 }}>{txt.analysesGenerated}</div>
        </div>
      ) : (
        <div className={s.analysisCardsGrid}>
          {analyses.map(a => {
            const sc = sentimentClass(a.sentiment);
            const dotClass = sc === 'bullish' ? s.bullish : sc === 'bearish' ? s.bearish : s.neutralDot;
            const badgeClass = sc === 'bullish' ? s.bullish : sc === 'bearish' ? s.bearish : s.neutralBadge;
            const riskCls = /high|مرتفع|extreme|شديد/i.test(a.riskLevel) ? s.riskHigh : /medium|متوسط/i.test(a.riskLevel) ? s.riskMedium : s.riskLow;

            return (
              <div key={a.id} className={`${s.marketAnalysisCard} ${sc === 'bullish' ? s.bullish : sc === 'bearish' ? s.bearish : s.neutralSentiment}`}>
                <div className={s.cardTopRow}>
                  <div className={s.cardAssetBadge}>
                    <span className={`${s.cardAssetDot} ${dotClass}`} />
                    <span className={s.cardAssetName}>{acMap[a.assetClass]?.[locale] || a.assetClass}</span>
                  </div>
                  <span className={`${s.cardSentimentBadge} ${badgeClass}`}>
                    {sentimentLabel(a.sentiment, locale)}
                  </span>
                </div>
                <div className={s.cardTitle}>{sanitizeStockTitle(a.title, a.sentiment, locale)}</div>
                <div className={s.cardMeta}>
                  <span>{timeAgo5(a.publishedAt, locale)}</span>
                  {formatPubTime5(a.publishedAt, locale) && <span style={{ opacity: 0.6, fontSize: 10 }}>{formatPubTime5(a.publishedAt, locale)}</span>}
                  <span className={s.cardConfidence}>{a.confidenceScore}%</span>
                  <span className={`${s.cardRiskBadge} ${riskCls}`}>
                    {riskMap[a.riskLevel]?.[locale] || a.riskLevel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

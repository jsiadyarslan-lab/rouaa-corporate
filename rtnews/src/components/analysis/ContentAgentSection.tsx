'use client';

import { useState, useMemo } from 'react';
import { ContentAnalysisItem, sentimentClass } from './types';
import s from './ContentAgentSection.module.css';

type Locale5 = 'ar' | 'en' | 'fr' | 'tr' | 'es';

interface ContentAgentSectionProps {
  analyses: ContentAnalysisItem[];
  loading: boolean;
  locale?: Locale5;
}

/** Patterns indicating an article is an error artifact, not real content */
const ERROR_PATTERNS = [
  /GLM API error/i, /API error/i, /timeout of \d+ms exceeded/i,
  /ECONNREFUSED/i, /fetch failed/i, /Internal Server Error/i,
  /circuit breaker/i, /rate limit/i,
];

function isErrorArticle(item: ContentAnalysisItem): boolean {
  const fields = [item.title, item.content, item.summary];
  for (const field of fields) {
    if (typeof field !== 'string') continue;
    for (const pattern of ERROR_PATTERNS) {
      if (pattern.test(field)) return true;
    }
  }
  return false;
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

function sentimentLabel5(s: string, loc: Locale5): string {
  const cls = sentimentClass(s);
  if (cls === 'bullish') return loc === 'ar' ? 'صعودي' : loc === 'fr' ? 'Haussier' : loc === 'es' ? 'Alcista' : loc === 'tr' ? 'Yükseliş' : 'Bullish';
  if (cls === 'bearish') return loc === 'ar' ? 'هبوطي' : loc === 'fr' ? 'Baissier' : loc === 'es' ? 'Bajista' : loc === 'tr' ? 'Düşüş' : 'Bearish';
  return loc === 'ar' ? 'محايد' : loc === 'fr' ? 'Neutre' : loc === 'es' ? 'Neutral' : loc === 'tr' ? 'Nötr' : 'Neutral';
}

function sanitizeStockTitle(rawTitle: string, symbols: string[], sentiment: string | number, locale: Locale5): string {
  let t = cleanTitle(rawTitle);
  if (!t || t === 'Analysis') return t;
  const hasTemplatePrefix = STOCK_TITLE_PREFIXES.some(rx => rx.test(t));
  if (!hasTemplatePrefix) return t;
  for (const rx of STOCK_TITLE_PREFIXES) { t = t.replace(rx, ''); }
  t = t.trim();
  const sLabel = sentimentLabel5(String(sentiment), locale);
  for (const sw of SENTIMENT_WORDS) { t = t.replace(new RegExp(`^${sw}\\s+`, 'i'), ''); }
  const singleLetterSymbolMatch = t.match(/^([A-Z])\s+([A-Z]{2,5})$/);
  const primarySymbol = symbols.length > 0 ? symbols[0] : '';
  if (singleLetterSymbolMatch) { return `${singleLetterSymbolMatch[2]} – ${sLabel}`; }
  const nameWithSymbolMatch = t.match(/^(.+?)\s*\(([A-Z]{1,5})\)\s*$/);
  if (nameWithSymbolMatch) { return `${nameWithSymbolMatch[1].trim()} (${nameWithSymbolMatch[2]}) – ${sLabel}`; }
  if (primarySymbol) {
    const displaySymbol = primarySymbol.replace('/USDT', '').replace('/USD', '');
    const remaining = t.replace(new RegExp(`\\b${displaySymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'), '').trim();
    if (remaining && remaining.length > 1 && remaining !== displaySymbol) { return `${remaining} (${displaySymbol}) – ${sLabel}`; }
    return `${displaySymbol} – ${sLabel}`;
  }
  if (t) { return `${t} – ${sLabel}`; }
  return locale === 'ar' ? 'تحليل' : locale === 'fr' ? 'Analyse' : locale === 'es' ? 'Análisis' : locale === 'tr' ? 'Analiz' : 'Analysis';
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

const TEXT: Record<Locale5, {
  sectionTitle: string; platform: string; loading: string;
  noAnalyses: string; autoGenerates: string;
  bullish: string; bearish: string; neutral: string;
  highImpact: string; mediumImpact: string; lowImpact: string;
  readMore: string; showLess: string;
}> = {
  ar: {
    sectionTitle: 'تحليلات وكيل المحتوى', platform: 'منصة رؤى',
    loading: 'جارٍ تحميل التحليلات...', noAnalyses: 'لا توجد تحليلات من وكيل المحتوى حالياً',
    autoGenerates: 'يقوم وكيل المحتوى بإنتاج تحليلات تلقائياً كل ساعة',
    bullish: 'صعودي', bearish: 'هبوطي', neutral: 'محايد',
    highImpact: 'تأثير عالي', mediumImpact: 'تأثير متوسط', lowImpact: 'تأثير منخفض',
    readMore: 'اقرأ المزيد', showLess: 'عرض أقل',
  },
  en: {
    sectionTitle: 'Content Agent Analyses', platform: 'Rouaa Platform',
    loading: 'Loading analyses...', noAnalyses: 'No content agent analyses available',
    autoGenerates: 'The content agent generates analyses automatically every hour',
    bullish: 'Bullish', bearish: 'Bearish', neutral: 'Neutral',
    highImpact: 'High Impact', mediumImpact: 'Medium Impact', lowImpact: 'Low Impact',
    readMore: 'Read more', showLess: 'Show less',
  },
  fr: {
    sectionTitle: "Analyses de l'agent de contenu", platform: 'Plateforme Rouaa',
    loading: 'Chargement des analyses...', noAnalyses: "Aucune analyse d'agent de contenu disponible",
    autoGenerates: "L'agent de contenu génère des analyses automatiquement chaque heure",
    bullish: 'Haussier', bearish: 'Baissier', neutral: 'Neutre',
    highImpact: 'Impact élevé', mediumImpact: 'Impact moyen', lowImpact: 'Faible impact',
    readMore: 'Lire la suite', showLess: 'Voir moins',
  },
  tr: {
    sectionTitle: 'İçerik Ajanı Analizleri', platform: 'Rouaa Platformu',
    loading: 'Analizler yükleniyor...', noAnalyses: 'İçerik ajanı analizi bulunmuyor',
    autoGenerates: 'İçerik ajanı her saat otomatik analiz üretir',
    bullish: 'Yükseliş', bearish: 'Düşüş', neutral: 'Nötr',
    highImpact: 'Yüksek Etki', mediumImpact: 'Orta Etki', lowImpact: 'Düşük Etki',
    readMore: 'Devamını oku', showLess: 'Daha az göster',
  },
  es: {
    sectionTitle: 'Análisis del Agente de Contenido', platform: 'Plataforma Rouaa',
    loading: 'Cargando análisis...', noAnalyses: 'No hay análisis del agente de contenido disponibles',
    autoGenerates: 'El agente de contenido genera análisis automáticamente cada hora',
    bullish: 'Alcista', bearish: 'Bajista', neutral: 'Neutral',
    highImpact: 'Alto Impacto', mediumImpact: 'Impacto Medio', lowImpact: 'Bajo Impacto',
    readMore: 'Leer más', showLess: 'Mostrar menos',
  },
};

export default function ContentAgentSection({ analyses, loading, locale = 'ar' }: ContentAgentSectionProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const txt = TEXT[locale] || TEXT.en;

  const cleanAnalyses = useMemo(() => analyses.filter(a => !isErrorArticle(a)), [analyses]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  return (
    <div>
      <div className={s.sectionHeader}>
        <div className={s.sectionTitleWrap}>
          <span className={s.sectionIcon}>🤖</span>
          <span className={s.sectionTitle}>{txt.sectionTitle}</span>
          <span className={s.sectionCount}>{cleanAnalyses.length}</span>
          <span className={s.rouaBadge}>{txt.platform}</span>
        </div>
      </div>

      {loading ? (
        <div className={s.loadingSpinner}>
          <div className={s.spinnerDot} style={{ animationDelay: '0s' }} />
          <div className={s.spinnerDot} style={{ animationDelay: '0.2s' }} />
          <div className={s.spinnerDot} style={{ animationDelay: '0.4s' }} />
          <span>{txt.loading}</span>
        </div>
      ) : cleanAnalyses.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyStateIcon}>🤖</div>
          <div>{txt.noAnalyses}</div>
          <div style={{ fontSize: 11, marginTop: 6 }}>{txt.autoGenerates}</div>
        </div>
      ) : (
        <div className={s.agentCardsList}>
          {cleanAnalyses.map((analysis) => {
            const isBullish = /bull|صعود|إيجاب/i.test(String(analysis.sentiment));
            const isBearish = /bear|هبوط|سلب/i.test(String(analysis.sentiment));
            const sColor = isBullish ? 'var(--bull)' : isBearish ? 'var(--bear)' : 'var(--cyan)';
            const sLabel = isBullish ? txt.bullish : isBearish ? txt.bearish : txt.neutral;
            const sIcon = isBullish ? '▲' : isBearish ? '▼' : '◆';
            const isExpanded = expandedIds.has(analysis.id);
            const contentText = analysis.content || '';
            const isLong = contentText.length > 600;
            const impLabel = analysis.impactLevel === 'HIGH' ? txt.highImpact : analysis.impactLevel === 'MEDIUM' ? txt.mediumImpact : analysis.impactLevel === 'LOW' ? txt.lowImpact : analysis.impactLevel || '';
            const impColor = analysis.impactLevel === 'HIGH' ? 'var(--bear)' : analysis.impactLevel === 'MEDIUM' ? 'var(--gold)' : 'var(--text3)';
            const safeSymbols = Array.isArray(analysis.symbols) ? analysis.symbols : [];
            const safeTags = Array.isArray(analysis.tags) ? analysis.tags : [];
            const sentimentBg = sColor === 'var(--bull)' ? 'var(--bull2)' : sColor === 'var(--bear)' ? 'var(--bear2)' : 'var(--cyan2)';

            return (
              <div key={analysis.id} className={s.agentCard} style={{ borderInlineStart: `3px solid ${sColor}` }}>
                <div className={s.agentCardHeader}>
                  <div className={s.agentCardHeaderLeft}>
                    <div className={s.agentCardIcon}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                        <path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z" />
                      </svg>
                    </div>
                    <div className={s.agentCardTitleGroup}>
                      <div className={s.agentCardTitle}>{sanitizeStockTitle(analysis.title, safeSymbols.slice(0, 4).map(s => typeof s === 'string' ? s : String(s)), analysis.sentiment, locale)}</div>
                      <div className={s.agentCardSymbolsRow}>
                        {safeSymbols.slice(0, 4).map((sym, i) => (
                          <span key={i} className={s.symbolChip}>{typeof sym === 'string' ? sym.replace('/USDT', '').replace('/USD', '') : sym}</span>
                        ))}
                        {analysis.category && <span className={s.categoryText}>{analysis.category}</span>}
                        {analysis.publishedAt && (
                          <span className={s.categoryText} style={{ opacity: 0.6 }}>⏱ {timeAgo5(analysis.publishedAt, locale)}{formatPubTime5(analysis.publishedAt, locale) ? ` · ${formatPubTime5(analysis.publishedAt, locale)}` : ''}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={s.agentCardHeaderRight}>
                    <span className={s.sentimentChip} style={{ background: sentimentBg, color: sColor }}>{sIcon} {sLabel}</span>
                    <span className={s.impactLabel} style={{ color: impColor }}>{impLabel}</span>
                  </div>
                </div>
                <div className={s.agentCardContent}>
                  {analysis.summary && <div className={s.summaryText}>{analysis.summary}</div>}
                  {isLong && !isExpanded ? (
                    <div className={s.contentText}>{contentText.slice(0, 500)}...<button onClick={() => toggleExpand(analysis.id)} className={s.readMoreBtn}>{txt.readMore}</button></div>
                  ) : isLong && isExpanded ? (
                    <div className={s.contentText}>{contentText}<button onClick={() => toggleExpand(analysis.id)} className={s.readMoreBtn}>{txt.showLess}</button></div>
                  ) : (
                    <div className={s.contentText}>{contentText}</div>
                  )}
                  {safeTags.length > 0 && (
                    <div className={s.tagsRow}>{safeTags.slice(0, 5).map((tag, i) => (<span key={i} className={s.tagChip}>{tag}</span>))}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

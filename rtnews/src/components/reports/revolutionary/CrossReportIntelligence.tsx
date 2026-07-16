'use client';

import { useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════
// Revolutionary Addition #5: Cross-Report Intelligence
// Shows connections between the current report and related reports,
// highlighting overlapping sectors, sentiment divergence, and
// consensus patterns.
// ═══════════════════════════════════════════════════════════════

interface RelatedReport {
  id: string;
  title: string;
  slug: string;
  reportType: string;
  marketImpact: string;
  confidenceScore: number;
  publishedAt: string | Date | null;
}

interface Props {
  currentReport: {
    title: string;
    marketImpact: string;
    confidenceScore: number;
    sectors: string[];
    reportType: string;
  };
  relatedReports: RelatedReport[];
  locale?: 'en' | 'fr' | 'ar' | 'tr' | 'es';
}

const LABELS: Record<string, Record<string, string>> = {
  en: {
    title: 'Cross-Report Intelligence',
    subtitle: 'Connections and patterns across related reports',
    consensus: 'Consensus',
    divergence: 'Divergence',
    bullishConsensus: 'Bullish Consensus',
    bearishConsensus: 'Bearish Consensus',
    mixedSignals: 'Mixed Signals',
    avgConfidence: 'Average Confidence',
    overlappingSectors: 'Overlapping Sectors',
    sentimentFlow: 'Sentiment Flow',
    recent: 'Recent',
    noRelatedReports: 'No related reports available for intelligence analysis',
  },
  fr: {
    title: 'Intelligence Inter-Rapports',
    subtitle: 'Connexions et schémas entre les rapports connexes',
    consensus: 'Consensus',
    divergence: 'Divergence',
    bullishConsensus: 'Consensus Haussier',
    bearishConsensus: 'Consensus Baissier',
    mixedSignals: 'Signaux Mixtes',
    avgConfidence: 'Confiance Moyenne',
    overlappingSectors: 'Secteurs Chevauchants',
    sentimentFlow: 'Flux de Sentiment',
    recent: 'Récent',
    noRelatedReports: 'Aucun rapport connexe disponible pour l\'analyse',
  },
  ar: {
    title: 'ذكاء التقارير المتقاطعة',
    subtitle: 'الروابط والأنماط عبر التقارير ذات الصلة',
    consensus: 'الإجماع',
    divergence: 'التباين',
    bullishConsensus: 'إجماع صاعد',
    bearishConsensus: 'إجماع هابط',
    mixedSignals: 'إشارات مختلطة',
    avgConfidence: 'متوسط الثقة',
    overlappingSectors: 'القطاعات المتداخلة',
    sentimentFlow: 'تدفق المشاعر',
    recent: 'حديث',
    noRelatedReports: 'لا توجد تقارير ذات صلة متاحة للتحليل',
  },
  es: {
    title: 'Inteligencia de Informes Cruzados',
    subtitle: 'Conexiones y patrones entre informes relacionados',
    consensus: 'Consenso',
    divergence: 'Divergencia',
    bullishConsensus: 'Consenso Alcista',
    bearishConsensus: 'Consenso Bajista',
    mixedSignals: 'Señales Mixtas',
    avgConfidence: 'Confianza Promedio',
    overlappingSectors: 'Sectores Superpuestos',
    sentimentFlow: 'Flujo de Sentimiento',
    recent: 'Reciente',
    noRelatedReports: 'No hay informes relacionados disponibles para análisis de inteligencia',
  },
};

export default function CrossReportIntelligence({ currentReport, relatedReports, locale = 'en' }: Props) {
  const t = (key: string) => LABELS[locale]?.[key] || LABELS.en[key] || key;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  const intelligence = useMemo(() => {
    if (relatedReports.length === 0) return null;

    const allReports = [currentReport, ...relatedReports.map(r => ({
      title: r.title, marketImpact: r.marketImpact, confidenceScore: r.confidenceScore,
      sectors: [], reportType: r.reportType,
    }))];

    // Sentiment analysis
    const bullishCount = allReports.filter(r => r.marketImpact === 'bullish').length;
    const bearishCount = allReports.filter(r => r.marketImpact === 'bearish').length;
    const neutralCount = allReports.filter(r => r.marketImpact === 'neutral').length;
    const total = allReports.length;

    let consensusType: string;
    let consensusColor: string;
    let consensusTKey: string;
    if (bullishCount > total * 0.6) {
      consensusType = 'bullish'; consensusColor = '#00996B'; consensusTKey = 'bullishConsensus';
    } else if (bearishCount > total * 0.6) {
      consensusType = 'bearish'; consensusColor = '#D4365C'; consensusTKey = 'bearishConsensus';
    } else {
      consensusType = 'mixed'; consensusColor = '#D4930D'; consensusTKey = 'mixedSignals';
    }

    // Average confidence
    const avgConfidence = Math.round(allReports.reduce((sum, r) => sum + r.confidenceScore, 0) / total);

    // Divergence score (how much reports disagree)
    const maxGroup = Math.max(bullishCount, bearishCount, neutralCount);
    const divergenceScore = Math.round((1 - maxGroup / total) * 100);

    return {
      bullishCount, bearishCount, neutralCount,
      consensusType, consensusColor, consensusTKey,
      avgConfidence, divergenceScore, total,
    };
  }, [currentReport, relatedReports]);

  if (!intelligence || relatedReports.length === 0) return null;

  const barTotal = intelligence.bullishCount + intelligence.bearishCount + intelligence.neutralCount;
  const bullishPct = Math.round((intelligence.bullishCount / barTotal) * 100);
  const bearishPct = Math.round((intelligence.bearishCount / barTotal) * 100);
  const neutralPct = 100 - bullishPct - bearishPct;

  return (
    <div style={{
      background: 'rgba(10, 14, 39, 0.6)',
      border: '1px solid rgba(0, 229, 255, 0.15)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      direction: dir,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span style={{ fontSize: '18px' }}>&#128279;</span>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-head)', margin: 0 }}>{t('title')}</h3>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text3)', margin: '0 0 16px 0' }}>{t('subtitle')}</p>

      {/* Consensus badge */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
        background: `${intelligence.consensusColor}10`, border: `1px solid ${intelligence.consensusColor}25`,
      }}>
        <span style={{ fontSize: '14px', fontWeight: 700, color: intelligence.consensusColor }}>
          {t(intelligence.consensusTKey)}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
          {intelligence.bullishCount}↑ {intelligence.bearishCount}↓ {intelligence.neutralCount}→
        </span>
      </div>

      {/* Sentiment flow bar */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px', fontWeight: 500 }}>{t('sentimentFlow')}</div>
        <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
          {bullishPct > 0 && <div style={{ width: `${bullishPct}%`, background: '#00996B', transition: 'width 0.3s' }} />}
          {neutralPct > 0 && <div style={{ width: `${neutralPct}%`, background: '#D4930D', transition: 'width 0.3s' }} />}
          {bearishPct > 0 && <div style={{ width: `${bearishPct}%`, background: '#D4365C', transition: 'width 0.3s' }} />}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: 'var(--text3)' }}>
          <span style={{ color: '#00996B' }}>{bullishPct}% ↑</span>
          <span style={{ color: '#D4930D' }}>{neutralPct}% →</span>
          <span style={{ color: '#D4365C' }}>{bearishPct}% ↓</span>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(128,128,128,0.05)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>{t('avgConfidence')}</div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: intelligence.avgConfidence >= 60 ? '#00996B' : '#D4930D' }}>
            {intelligence.avgConfidence}%
          </div>
        </div>
        <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(128,128,128,0.05)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>{t('divergence')}</div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: intelligence.divergenceScore > 40 ? '#D4930D' : '#00996B' }}>
            {intelligence.divergenceScore}%
          </div>
        </div>
      </div>
    </div>
  );
}

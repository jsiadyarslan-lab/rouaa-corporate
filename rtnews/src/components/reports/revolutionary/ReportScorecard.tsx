'use client';

import { useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════
// Revolutionary Addition #2: Report Scorecard
// Visual quality/rating card for each report with letter grade,
// confidence meter, data quality indicators, and freshness score.
// ═══════════════════════════════════════════════════════════════

interface Props {
  confidenceScore: number;
  marketImpact: string;
  reportType: string;
  sectors: string[];
  keyIndicators: Record<string, any>;
  publishedAt: string | Date | null;
  locale?: 'en' | 'fr' | 'ar' | 'tr' | 'es';
}

const LABELS: Record<string, Record<string, string>> = {
  en: {
    title: 'Report Scorecard',
    grade: 'Grade',
    confidence: 'Confidence',
    dataQuality: 'Data Quality',
    sourceReliability: 'Source Reliability',
    freshness: 'Freshness',
    coverage: 'Market Coverage',
    overall: 'Overall Score',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    fresh: 'Fresh',
    recent: 'Recent',
    aging: 'Aging',
    stale: 'Stale',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  },
  fr: {
    title: 'Carte de Score du Rapport',
    grade: 'Note',
    confidence: 'Confiance',
    dataQuality: 'Qualité des Données',
    sourceReliability: 'Fiabilité des Sources',
    freshness: 'Fraîcheur',
    coverage: 'Couverture du Marché',
    overall: 'Score Global',
    excellent: 'Excellent',
    good: 'Bon',
    fair: 'Correct',
    poor: 'Faible',
    fresh: 'Récent',
    recent: 'Récent',
    aging: 'Vieillissant',
    stale: 'Obsolète',
    high: 'Élevée',
    medium: 'Moyenne',
    low: 'Faible',
  },
  ar: {
    title: 'بطاقة تقييم التقرير',
    grade: 'التقدير',
    confidence: 'الثقة',
    dataQuality: 'جودة البيانات',
    sourceReliability: 'موثوقية المصادر',
    freshness: 'الحداثة',
    coverage: 'تغطية السوق',
    overall: 'الدرجة الإجمالية',
    excellent: 'ممتاز',
    good: 'جيد',
    fair: 'مقبول',
    poor: 'ضعيف',
    fresh: 'طازج',
    recent: 'حديث',
    aging: 'قديم',
    stale: 'منتهي الصلاحية',
    high: 'عالية',
    medium: 'متوسطة',
    low: 'منخفضة',
  },
  tr: {
    title: 'Rapor Değerlendirme Kartı',
    grade: 'Derece',
    confidence: 'Güven',
    dataQuality: 'Veri Kalitesi',
    sourceReliability: 'Kaynak Güvenilirliği',
    freshness: 'Güncellik',
    coverage: 'Piyasa Kapsamı',
    overall: 'Genel Puan',
    excellent: 'Mükemmel',
    good: 'İyi',
    fair: 'Orta',
    poor: 'Zayıf',
    fresh: 'Taze',
    recent: 'Yeni',
    aging: 'Eskime',
    stale: 'Eski',
    high: 'Yüksek',
    medium: 'Orta',
    low: 'Düşük',
  },
  es: {
    title: 'Tarjeta de Puntuación del Informe',
    grade: 'Calificación',
    confidence: 'Confianza',
    dataQuality: 'Calidad de Datos',
    sourceReliability: 'Fiabilidad de Fuentes',
    freshness: 'Actualidad',
    coverage: 'Cobertura de Mercado',
    overall: 'Puntuación General',
    excellent: 'Excelente',
    good: 'Bueno',
    fair: 'Aceptable',
    poor: 'Deficiente',
    fresh: 'Reciente',
    recent: 'Nuevo',
    aging: 'Envejeciendo',
    stale: 'Obsoleto',
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
  },
};

function getGrade(score: number): { letter: string; color: string; label: string; tKey: string } {
  if (score >= 85) return { letter: 'A+', color: '#00996B', label: 'A+', tKey: 'excellent' };
  if (score >= 75) return { letter: 'A', color: '#00996B', label: 'A', tKey: 'excellent' };
  if (score >= 65) return { letter: 'B+', color: '#D4930D', label: 'B+', tKey: 'good' };
  if (score >= 55) return { letter: 'B', color: '#D4930D', label: 'B', tKey: 'good' };
  if (score >= 45) return { letter: 'C+', color: '#E67E22', label: 'C+', tKey: 'fair' };
  if (score >= 35) return { letter: 'C', color: '#E67E22', label: 'C', tKey: 'fair' };
  return { letter: 'D', color: '#D4365C', label: 'D', tKey: 'poor' };
}

export default function ReportScorecard({ confidenceScore, marketImpact, reportType, sectors, keyIndicators, publishedAt, locale = 'en' }: Props) {
  const t = (key: string) => LABELS[locale]?.[key] || LABELS.en[key] || key;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  const metrics = useMemo(() => {
    // Calculate freshness score (0-100)
    const pubDate = publishedAt ? new Date(publishedAt) : new Date();
    const hoursOld = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60);
    let freshness: number;
    let freshnessTKey: string;
    if (hoursOld < 6) { freshness = 95; freshnessTKey = 'fresh'; }
    else if (hoursOld < 24) { freshness = 80; freshnessTKey = 'recent'; }
    else if (hoursOld < 72) { freshness = 55; freshnessTKey = 'aging'; }
    else { freshness = 25; freshnessTKey = 'stale'; }

    // Data quality from indicators count
    const indicatorCount = keyIndicators?.indicators?.length || Object.keys(keyIndicators || {}).length;
    let dataQuality: number;
    let dataQualityTKey: string;
    if (indicatorCount >= 8) { dataQuality = 90; dataQualityTKey = 'high'; }
    else if (indicatorCount >= 4) { dataQuality = 70; dataQualityTKey = 'medium'; }
    else { dataQuality = 40; dataQualityTKey = 'low'; }

    // Source reliability from confidence score
    const sourceReliability = Math.min(100, confidenceScore + 10);

    // Market coverage from sectors count
    const coverageScore = Math.min(100, 30 + sectors.length * 15);

    // Overall score (weighted average)
    const overall = Math.round(
      confidenceScore * 0.30 +
      dataQuality * 0.25 +
      sourceReliability * 0.20 +
      freshness * 0.15 +
      coverageScore * 0.10
    );

    return {
      confidence: confidenceScore,
      dataQuality,
      dataQualityTKey,
      sourceReliability,
      freshness,
      freshnessTKey,
      coverage: coverageScore,
      overall,
    };
  }, [confidenceScore, keyIndicators, sectors, publishedAt]);

  const grade = getGrade(metrics.overall);

  const MetricBar = ({ value, label, tKey }: { value: number; label: string; tKey?: string }) => (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '11px', fontWeight: 700, color: value >= 70 ? '#00996B' : value >= 45 ? '#D4930D' : '#D4365C' }}>
          {value}%{tKey ? ` · ${t(tKey)}` : ''}
        </span>
      </div>
      <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(128,128,128,0.12)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: '2px', transition: 'width 0.6s ease',
          width: `${value}%`,
          background: value >= 70 ? 'linear-gradient(90deg, #00996B, #00C897)' : value >= 45 ? 'linear-gradient(90deg, #D4930D, #E6A817)' : 'linear-gradient(90deg, #D4365C, #E74C6F)',
        }} />
      </div>
    </div>
  );

  return (
    <div style={{
      background: 'rgba(10, 14, 39, 0.6)',
      border: '1px solid rgba(0, 229, 255, 0.15)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      direction: dir,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '18px' }}>&#9733;</span>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-head)', margin: 0 }}>{t('title')}</h3>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '16px' }}>
        {/* Grade Circle */}
        <div style={{
          minWidth: '72px', height: '72px', borderRadius: '50%',
          background: `radial-gradient(circle, ${grade.color}20, ${grade.color}08)`,
          border: `2px solid ${grade.color}40`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '28px', fontWeight: 900, color: grade.color, lineHeight: 1 }}>{grade.letter}</span>
          <span style={{ fontSize: '9px', fontWeight: 600, color: grade.color, marginTop: '2px' }}>{t(grade.tKey)}</span>
        </div>

        {/* Metrics */}
        <div style={{ flex: 1 }}>
          <MetricBar value={metrics.confidence} label={t('confidence')} />
          <MetricBar value={metrics.dataQuality} label={t('dataQuality')} tKey={metrics.dataQualityTKey} />
          <MetricBar value={metrics.sourceReliability} label={t('sourceReliability')} />
          <MetricBar value={metrics.freshness} label={t('freshness')} tKey={metrics.freshnessTKey} />
          <MetricBar value={metrics.coverage} label={t('coverage')} />
        </div>
      </div>

      {/* Overall Score */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 14px', borderRadius: '8px',
        background: `${grade.color}10`, border: `1px solid ${grade.color}25`,
      }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-head)' }}>{t('overall')}</span>
        <span style={{ fontSize: '18px', fontWeight: 900, color: grade.color }}>{metrics.overall}%</span>
      </div>
    </div>
  );
}

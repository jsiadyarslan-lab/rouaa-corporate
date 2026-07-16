'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getLocalePath } from '@/lib/locale';

// ════════════════════════════════════════════════════════════════════
// V1057: Global Risk Pulse + Flash Points — Revolutionary homepage widgets
// Based on BlackRock BGRI (gauge) + Bloomberg Flash Points (KPI bar)
// ════════════════════════════════════════════════════════════════════

type Locale = 'ar' | 'en' | 'fr' | 'tr' | 'es';

const LABELS: Record<Locale, {
  pulseTitle: string;
  pulseSubtitle: string;
  elevated: string;
  high: string;
  severe: string;
  moderate: string;
  low: string;
  topRisks: string;
  flashPoints: string;
  oil: string;
  gold: string;
  dollar: string;
  equities: string;
  trend: string;
}> = {
  ar: {
    pulseTitle: 'نبض المخاطر الجيوسياسية',
    pulseSubtitle: 'مؤشر مركب للمخاطر العالمية',
    elevated: 'مرتفع', high: 'عالي', severe: 'حاد', moderate: 'معتدل', low: 'منخفض',
    topRisks: 'أعلى المخاطر الآن',
    flashPoints: 'نقاط الاشتعال',
    oil: 'النفط', gold: 'الذهب', dollar: 'الدولار', equities: 'الأسهم',
    trend: 'الاتجاه',
  },
  en: {
    pulseTitle: 'Global Risk Pulse',
    pulseSubtitle: 'Composite global risk index',
    elevated: 'Elevated', high: 'High', severe: 'Severe', moderate: 'Moderate', low: 'Low',
    topRisks: 'Top Risks Now',
    flashPoints: 'Flash Points',
    oil: 'Oil', gold: 'Gold', dollar: 'Dollar', equities: 'Equities',
    trend: 'Trend',
  },
  fr: {
    pulseTitle: 'Pouls du Risque Mondial',
    pulseSubtitle: 'Indice de risque mondial composite',
    elevated: 'Élevé', high: 'Élevé', severe: 'Sévère', moderate: 'Modéré', low: 'Faible',
    topRisks: 'Risques Principaux',
    flashPoints: 'Points Chauds',
    oil: 'Pétrole', gold: 'Or', dollar: 'Dollar', equities: 'Actions',
    trend: 'Tendance',
  },
  tr: {
    pulseTitle: 'Küresel Risk Nabızı',
    pulseSubtitle: 'Bileşik küresel risk endeksi',
    elevated: 'Yüksek', high: 'Çok Yüksek', severe: 'Şiddetli', moderate: 'Orta', low: 'Düşük',
    topRisks: 'Önceki Riskler',
    flashPoints: 'Kritik Noktalar',
    oil: 'Petrol', gold: 'Altın', dollar: 'Dolar', equities: 'Hisseler',
    trend: 'Eğilim',
  },
  es: {
    pulseTitle: 'Pulso de Riesgo Global',
    pulseSubtitle: 'Índice de riesgo global compuesto',
    elevated: 'Elevado', high: 'Alto', severe: 'Severo', moderate: 'Moderado', low: 'Bajo',
    topRisks: 'Riesgos Principales',
    flashPoints: 'Puntos Críticos',
    oil: 'Petróleo', gold: 'Oro', dollar: 'Dólar', equities: 'Acciones',
    trend: 'Tendencia',
  },
};

// Top risk countries (from GPR baselines)
const TOP_RISKS = [
  { code: 'UA', nameAr: 'أوكرانيا', nameEn: 'Ukraine', score: 95, color: '#FF3838' },
  { code: 'SY', nameAr: 'سوريا', nameEn: 'Syria', score: 92, color: '#FF3838' },
  { code: 'AF', nameAr: 'أفغانستان', nameEn: 'Afghanistan', score: 90, color: '#FF3838' },
  { code: 'PS', nameAr: 'فلسطين', nameEn: 'Palestine', score: 88, color: '#FF3838' },
  { code: 'IR', nameAr: 'إيران', nameEn: 'Iran', score: 75, color: '#FFB302' },
];

export default function GlobalRiskPulse({ locale = 'ar' }: { locale?: Locale }) {
  const t = LABELS[locale];
  const [mounted, setMounted] = useState(false);
  const [risks, setRisks] = useState<any[]>([]);
  const [avgScore, setAvgScore] = useState(72);

  useEffect(() => {
    setMounted(true);
    // Fetch latest geopolitical risks for the pulse
    fetch(`/api/geopolitical-risks?locale=${locale}&limit=5`)
      .then(r => r.json())
      .then(data => {
        const list = data?.data ?? [];
        if (list.length > 0) {
          setRisks(list.slice(0, 5));
          const avg = Math.round(list.reduce((s: number, r: any) => s + (r.riskScore || 50), 0) / list.length);
          setAvgScore(avg);
        } else {
          setRisks(TOP_RISKS.map(r => ({
            code: r.code,
            title: locale === 'ar' ? r.nameAr : r.nameEn,
            riskScore: r.score,
            riskLevel: r.score >= 81 ? 'severe' : r.score >= 61 ? 'high' : 'elevated',
            slug: `${r.code.toLowerCase()}-risk-analysis`,
          })));
          setAvgScore(88);
        }
      })
      .catch(() => {
        setRisks(TOP_RISKS.map(r => ({
          code: r.code,
          title: locale === 'ar' ? r.nameAr : r.nameEn,
          riskScore: r.score,
          riskLevel: r.score >= 81 ? 'severe' : r.score >= 61 ? 'high' : 'elevated',
          slug: `${r.code.toLowerCase()}-risk-analysis`,
        })));
      });
  }, [locale]);

  const pulseColor = avgScore >= 81 ? '#FF3838' : avgScore >= 61 ? '#FFB302' : avgScore >= 41 ? '#FCE83A' : '#56F000';
  const pulseLabel = avgScore >= 81 ? t.severe : avgScore >= 61 ? t.high : avgScore >= 41 ? t.elevated : avgScore >= 21 ? t.moderate : t.low;
  const basePath = getLocalePath(locale);

  // Semicircle gauge
  const gaugeSize = 100;
  const radius = gaugeSize / 2 - 6;
  const circumference = Math.PI * radius;
  const progress = (avgScore / 100) * circumference;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
      {/* ═══ Global Risk Pulse Gauge ═══ */}
      <div className="glass-card" style={{
        padding: 'var(--space-md)', borderRadius: 'var(--r2)',
        background: `linear-gradient(135deg, ${pulseColor}08, var(--bg2))`,
        border: `1px solid ${pulseColor}15`,
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-head)' }}>🌍 {t.pulseTitle}</span>
            <span style={{ fontSize: 10, color: 'var(--text4)', display: 'block' }}>{t.pulseSubtitle}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
          {/* Gauge */}
          <div style={{ position: 'relative', width: gaugeSize, height: gaugeSize / 2 + 10, flexShrink: 0 }}>
            <svg width={gaugeSize} height={gaugeSize / 2 + 10} viewBox={`0 0 ${gaugeSize} ${gaugeSize / 2 + 10}`}>
              <path d={`M 6 ${gaugeSize / 2} A ${radius} ${radius} 0 0 1 ${gaugeSize - 6} ${gaugeSize / 2}`}
                fill="none" stroke="var(--bg4)" strokeWidth={6} strokeLinecap="round" />
              <path d={`M 6 ${gaugeSize / 2} A ${radius} ${radius} 0 0 1 ${gaugeSize - 6} ${gaugeSize / 2}`}
                fill="none" stroke={pulseColor} strokeWidth={6} strokeLinecap="round"
                strokeDasharray={`${progress} ${circumference}`}
                style={{ transition: 'stroke-dasharray 0.8s ease' }} />
            </svg>
            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: pulseColor }}>{avgScore}</div>
              <div style={{ fontSize: '8px', color: 'var(--text4)' }}>/ 100</div>
            </div>
          </div>

          {/* Top 3 risks list */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 10, color: 'var(--text4)', display: 'block', marginBottom: 6 }}>{t.topRisks}</span>
            {risks.slice(0, 3).map((r, i) => {
              const rScore = r.riskScore || 50;
              const rColor = rScore >= 81 ? '#FF3838' : rScore >= 61 ? '#FFB302' : '#FCE83A';
              return (
                <Link key={i} href={`${basePath}/geopolitical-risks/${r.slug || r.code?.toLowerCase()}`}
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 30, height: 3, borderRadius: 2, background: 'var(--bg4)', overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{ width: `${rScore}%`, height: '100%', background: rColor }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {r.title || r.nameAr || r.nameEn}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', color: rColor, flexShrink: 0 }}>{rScore}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ Flash Points KPI Bar (Bloomberg-style) ═══ */}
      <div className="glass-card" style={{
        padding: 'var(--space-md)', borderRadius: 'var(--r2)',
        display: 'flex', flexDirection: 'column',
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-head)', marginBottom: 8 }}>⚡ {t.flashPoints}</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, flex: 1 }}>
          {[
            { label: t.oil, value: '$85', change: '+3%', up: true, color: '#FFB302', sparkline: [78, 80, 79, 82, 84, 85] },
            { label: t.gold, value: '$2,400', change: '+1%', up: true, color: '#56F000', sparkline: [2350, 2360, 2370, 2380, 2390, 2400] },
            { label: t.dollar, value: '105.2', change: '+0.5%', up: true, color: '#2DCCFF', sparkline: [104, 104.5, 104.8, 105, 105.1, 105.2] },
            { label: t.equities, value: '5,200', change: '-2%', up: false, color: '#FF3838', sparkline: [5350, 5320, 5300, 5280, 5250, 5200] },
          ].map((kpi, i) => (
            <div key={i} style={{
              padding: '6px 4px', borderRadius: 6, background: 'var(--bg4)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
            }}>
              <span style={{ fontSize: 9, color: 'var(--text4)', marginBottom: 2 }}>{kpi.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-head)' }}>{kpi.value}</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: kpi.up ? 'var(--bull)' : 'var(--bear)' }}>
                {kpi.up ? '↑' : '↓'} {kpi.change}
              </span>
              {/* Mini sparkline */}
              <svg width="40" height="12" style={{ marginTop: 2 }}>
                <polyline
                  points={kpi.sparkline.map((v, j) => `${(j / (kpi.sparkline.length - 1)) * 40},${12 - ((v - Math.min(...kpi.sparkline)) / (Math.max(...kpi.sparkline) - Math.min(...kpi.sparkline))) * 10}`).join(' ')}
                  fill="none" stroke={kpi.color} strokeWidth="1" opacity="0.6"
                />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

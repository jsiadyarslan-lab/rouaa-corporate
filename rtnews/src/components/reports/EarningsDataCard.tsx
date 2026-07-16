'use client';

import React, { useState, useEffect } from 'react';

interface EarningsCardProps {
  symbol: string;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

interface EarningsData {
  symbol: string;
  company: string;
  currentQuarter: {
    fiscalDateEnding: string;
    reportedEPS: number;
    estimatedEPS: number;
    surprise: number;
    surprisePercent: number;
    reportedRevenue: number;
    estimatedRevenue?: number;
    revenueSurprise?: number;
    revenueSurprisePercent?: number;
    beatOrMiss: 'beat' | 'miss' | 'meet';
  } | null;
  guidance?: {
    direction: 'raised' | 'lowered' | 'maintained';
  };
  analystConsensus?: {
    rating: string;
    targetPrice: number;
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
  };
}

const UI_LABELS: Record<string, Record<string, string>> = {
  ar: {
    title: 'بيانات الأرباح',
    eps: 'ربحية السهم (EPS)',
    estimated: 'المتوقع',
    reported: 'الفعلي',
    surprise: 'المفاجأة',
    revenue: 'الإيرادات',
    estimatedRevenue: 'الإيرادات المتوقعة',
    reportedRevenue: 'الإيرادات الفعلية',
    revenueSurprise: 'مفاجأة الإيرادات',
    epsSurprise: 'مفاجأة الأرباح',
    revenueVsEps: 'الإيرادات مقابل الأرباح',
    beat: 'تجاوز التوقعات',
    miss: 'إخفاق التوقعات',
    meet: 'تطابق التوقعات',
    guidance: 'التوجيه المستقبلي',
    raised: 'رفع التوقعات',
    lowered: 'خفض التوقعات',
    maintained: 'الحفاظ على التوقعات',
    consensus: 'إجماع المحللين',
    targetPrice: 'السعر المستهدف',
    loading: 'جاري تحميل البيانات...',
    error: 'فشل تحميل البيانات',
    quarter: 'الربع',
    bullish: 'صعودي',
    bearish: 'هبوطي',
  },
  en: {
    title: 'Earnings Data',
    eps: 'Earnings Per Share (EPS)',
    estimated: 'Estimated',
    reported: 'Reported',
    surprise: 'Surprise',
    revenue: 'Revenue',
    estimatedRevenue: 'Estimated Revenue',
    reportedRevenue: 'Reported Revenue',
    revenueSurprise: 'Revenue Surprise',
    epsSurprise: 'EPS Surprise',
    revenueVsEps: 'Revenue vs EPS',
    beat: 'Beat Estimates',
    miss: 'Missed Estimates',
    meet: 'Met Estimates',
    guidance: 'Guidance',
    raised: 'Raised Guidance',
    lowered: 'Lowered Guidance',
    maintained: 'Maintained Guidance',
    consensus: 'Analyst Consensus',
    targetPrice: 'Target Price',
    loading: 'Loading data...',
    error: 'Failed to load data',
    quarter: 'Quarter',
    bullish: 'Bullish',
    bearish: 'Bearish',
  },
};

function formatNumber(n: number, prefix = '', suffix = ''): string {
  if (n === 0) return '-';
  if (Math.abs(n) >= 1e9) return `${prefix}${(n / 1e9).toFixed(1)}B${suffix}`;
  if (Math.abs(n) >= 1e6) return `${prefix}${(n / 1e6).toFixed(1)}M${suffix}`;
  return `${prefix}${n.toFixed(2)}${suffix}`;
}

export default function EarningsDataCard({ symbol, locale = 'ar' }: EarningsCardProps) {
  const t = (key: string) => UI_LABELS[locale]?.[key] || UI_LABELS.ar[key] || key;
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/earnings?symbol=${encodeURIComponent(symbol)}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [symbol]);

  if (loading) {
    return (
      <div style={{
        padding: '16px',
        borderRadius: '10px',
        background: 'rgba(128,128,128,0.04)',
        border: '1px solid rgba(128,128,128,0.08)',
        textAlign: 'center',
      }}>
        <div style={{
          width: '16px', height: '16px', borderRadius: '50%',
          border: '2px solid rgba(128,128,128,0.2)', borderTopColor: '#00996B',
          animation: 'spin 1s linear infinite', margin: '0 auto 8px',
        }} />
        <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{t('loading')}</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !data) return null;

  const q = data.currentQuarter;
  const beatColor = q?.beatOrMiss === 'beat' ? '#00996B' : q?.beatOrMiss === 'miss' ? '#D4365C' : '#D4930D';
  const guidanceColor = data.guidance?.direction === 'raised' ? '#00996B' : data.guidance?.direction === 'lowered' ? '#D4365C' : '#D4930D';

  return (
    <div style={{
      padding: '16px',
      borderRadius: '10px',
      background: 'rgba(128,128,128,0.04)',
      border: '1px solid rgba(128,128,128,0.08)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '12px', paddingBottom: '8px',
        borderBottom: '1px solid rgba(128,128,128,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            padding: '2px 8px', borderRadius: '4px',
            background: 'rgba(0,153,107,0.1)', border: '1px solid rgba(0,153,107,0.2)',
            fontSize: '12px', fontWeight: 700, color: '#00996B',
            fontFamily: 'var(--font-mono, monospace)',
          }}>
            {data.symbol}
          </span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-head)' }}>
            {data.company}
          </span>
        </div>
        <span style={{
          fontSize: '10px', fontWeight: 700, padding: '2px 8px',
          borderRadius: '4px',
          background: `${beatColor}15`, color: beatColor,
          border: `1px solid ${beatColor}30`,
        }}>
          {q ? t(q.beatOrMiss) : '-'}
        </span>
      </div>

      {/* EPS Data */}
      {q && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          <div style={{ textAlign: 'center', padding: '8px', borderRadius: '6px', background: 'rgba(128,128,128,0.03)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>{t('estimated')}</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-head)' }}>${q.estimatedEPS.toFixed(2)}</div>
            <div style={{ fontSize: '9px', color: 'var(--text3)' }}>{t('eps')}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px', borderRadius: '6px', background: 'rgba(128,128,128,0.03)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>{t('reported')}</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: beatColor }}>${q.reportedEPS.toFixed(2)}</div>
            <div style={{ fontSize: '9px', color: 'var(--text3)' }}>{t('eps')}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px', borderRadius: '6px', background: 'rgba(128,128,128,0.03)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>{t('surprise')}</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: beatColor }}>
              {q.surprisePercent > 0 ? '+' : ''}{q.surprisePercent.toFixed(1)}%
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text3)' }}>${q.surprise.toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* Revenue vs EPS Comparison — side-by-side when both surprises available */}
      {q && q.reportedRevenue > 0 && (q.revenueSurprisePercent !== undefined || q.estimatedRevenue) && (
        <div style={{
          marginBottom: '12px', padding: '10px 12px', borderRadius: '8px',
          background: 'linear-gradient(135deg, rgba(0,153,107,0.04) 0%, rgba(212,147,13,0.04) 100%)',
          border: '1px solid rgba(128,128,128,0.08)',
        }}>
          <div style={{
            fontSize: '11px', fontWeight: 600, color: 'var(--text-head)',
            marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <span style={{ fontSize: '13px' }}>📊</span>
            {t('revenueVsEps')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {/* EPS Surprise Side */}
            <div style={{
              textAlign: 'center', padding: '8px', borderRadius: '6px',
              background: 'rgba(128,128,128,0.03)',
              border: '1px solid rgba(128,128,128,0.06)',
            }}>
              <div style={{ fontSize: '9px', color: 'var(--text3)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('epsSurprise')}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: beatColor }}>
                {q.surprisePercent > 0 ? '+' : ''}{q.surprisePercent.toFixed(1)}%
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>
                ${q.estimatedEPS.toFixed(2)} → ${q.reportedEPS.toFixed(2)}
              </div>
            </div>
            {/* Revenue Surprise Side */}
            <div style={{
              textAlign: 'center', padding: '8px', borderRadius: '6px',
              background: 'rgba(128,128,128,0.03)',
              border: '1px solid rgba(128,128,128,0.06)',
            }}>
              <div style={{ fontSize: '9px', color: 'var(--text3)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('revenueSurprise')}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: q.revenueSurprisePercent !== undefined ? (q.revenueSurprisePercent >= 0 ? '#00996B' : '#D4365C') : beatColor }}>
                {q.revenueSurprisePercent !== undefined
                  ? `${q.revenueSurprisePercent > 0 ? '+' : ''}${q.revenueSurprisePercent.toFixed(1)}%`
                  : q.estimatedRevenue
                    ? `${((q.reportedRevenue - q.estimatedRevenue) / q.estimatedRevenue * 100) > 0 ? '+' : ''}${((q.reportedRevenue - q.estimatedRevenue) / q.estimatedRevenue * 100).toFixed(1)}%`
                    : '-'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>
                {q.estimatedRevenue
                  ? `${formatNumber(q.estimatedRevenue, '$')} → ${formatNumber(q.reportedRevenue, '$')}`
                  : formatNumber(q.reportedRevenue, '$')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue */}
      {q && q.reportedRevenue > 0 && !(q.revenueSurprisePercent !== undefined || q.estimatedRevenue) && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 12px', borderRadius: '6px',
          background: 'rgba(128,128,128,0.03)', marginBottom: '8px',
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{t('revenue')}</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-head)' }}>
            {formatNumber(q.reportedRevenue, '$')}
          </span>
        </div>
      )}

      {/* Guidance */}
      {data.guidance && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 12px', borderRadius: '6px',
          background: 'rgba(128,128,128,0.03)', marginBottom: '8px',
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{t('guidance')}</span>
          <span style={{
            fontSize: '12px', fontWeight: 700, color: guidanceColor,
            padding: '2px 8px', borderRadius: '4px',
            background: `${guidanceColor}15`,
          }}>
            {t(data.guidance.direction)}
          </span>
        </div>
      )}

      {/* Analyst Consensus */}
      {data.analystConsensus && (
        <div style={{
          padding: '8px 12px', borderRadius: '6px',
          background: 'rgba(128,128,128,0.03)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{t('consensus')}</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-head)' }}>
              {data.analystConsensus.rating}
            </span>
          </div>
          {data.analystConsensus.targetPrice > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text3)' }}>{t('targetPrice')}</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#00996B' }}>
                ${data.analystConsensus.targetPrice.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

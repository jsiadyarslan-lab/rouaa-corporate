'use client';

import { useState, useMemo } from 'react';
import { analyzeCountrySentiment, generateSentimentTimeSeries, detectSentimentAnomalies, getTrackedSentimentCountries } from '@/lib/geopolitical/sentiment-analyzer';
import { t } from '@/lib/geopolitical/i18n';

interface SentimentDashboardProps {
  locale: string;
}

const COUNTRY_NAMES: Record<string, Record<string, string>> = {
  IR: { ar: 'إيران', en: 'Iran', fr: 'Iran', tr: 'İran', es: 'Irán' },
  UA: { ar: 'أوكرانيا', en: 'Ukraine', fr: 'Ukraine', tr: 'Ukrayna', es: 'Ucrania' },
  IL: { ar: 'إسرائيل', en: 'Israel', fr: 'Israël', tr: 'İsrail', es: 'Israel' },
  CN: { ar: 'الصين', en: 'China', fr: 'Chine', tr: 'Çin', es: 'China' },
  SA: { ar: 'السعودية', en: 'Saudi Arabia', fr: 'Arabie saoudite', tr: 'Suudi Arabistan', es: 'Arabia Saudita' },
  RU: { ar: 'روسيا', en: 'Russia', fr: 'Russie', tr: 'Rusya', es: 'Rusia' },
  IQ: { ar: 'العراق', en: 'Iraq', fr: 'Irak', tr: 'Irak', es: 'Irak' },
  SY: { ar: 'سوريا', en: 'Syria', fr: 'Syrie', tr: 'Suriye', es: 'Siria' },
  TW: { ar: 'تايوان', en: 'Taiwan', fr: 'Taïwan', tr: 'Tayvan', es: 'Taiwán' },
  YE: { ar: 'اليمن', en: 'Yemen', fr: 'Yémen', tr: 'Yemen', es: 'Yemen' },
};

const ALERT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  normal: { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)', text: '#22C55E' },
  elevated: { bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.25)', text: '#EAB308' },
  high: { bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)', text: '#F97316' },
  critical: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: '#EF4444' },
};

const TREND_ICONS: Record<string, { icon: string; color: string }> = {
  improving: { icon: '\u2193', color: '#22C55E' },
  stable: { icon: '\u2192', color: '#EAB308' },
  worsening: { icon: '\u2191', color: '#F97316' },
  surging: { icon: '\u2191\u2191', color: '#EF4444' },
};

export default function SentimentDashboard({ locale }: SentimentDashboardProps) {
  const isRtl = locale === 'ar';
  const countries = getTrackedSentimentCountries();
  const [selectedCountry, setSelectedCountry] = useState(countries[0] || 'IR');

  const allSentiments = useMemo(() =>
    countries.map(analyzeCountrySentiment),
    [countries]
  );

  const selectedSentiment = useMemo(() =>
    analyzeCountrySentiment(selectedCountry),
    [selectedCountry]
  );

  const timeSeries = useMemo(() =>
    generateSentimentTimeSeries(selectedCountry, 72),
    [selectedCountry]
  );

  const anomalies = useMemo(() =>
    detectSentimentAnomalies(timeSeries),
    [timeSeries]
  );

  const countryName = (code: string) =>
    COUNTRY_NAMES[code]?.[locale] || COUNTRY_NAMES[code]?.en || code;

  return (
    <div
      className="rounded-xl border p-6"
      style={{ background: 'var(--bg3)', borderColor: 'var(--rim)' }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold" style={{ color: 'var(--text-head)' }}>
          {t('sentiment.title', locale)}
        </h3>
        <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>
          {t('sentiment.live', locale)}
        </span>
      </div>

      {/* Country Selector */}
      <div className="mb-4">
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
          style={{
            background: 'var(--bg4)',
            borderColor: 'var(--rim)',
            color: 'var(--text)',
          }}
        >
          {countries.map((code) => (
            <option key={code} value={code}>
              {countryName(code)}
            </option>
          ))}
        </select>
      </div>

      {/* Main Score */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Risk Sentiment Gauge */}
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg4)', borderColor: 'var(--rim)' }}>
          <p className="text-xs mb-2" style={{ color: 'var(--text3)' }}>
            {t('sentiment.riskIndex', locale)}
          </p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold tabular-nums" style={{ color: ALERT_COLORS[selectedSentiment.alertLevel].text }}>
              {selectedSentiment.riskSentiment}
            </span>
            <span className="text-xs pb-1" style={{ color: 'var(--text3)' }}>/100</span>
          </div>
          {/* Risk bar */}
          <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg5)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${selectedSentiment.riskSentiment}%`,
                background: ALERT_COLORS[selectedSentiment.alertLevel].text,
              }}
            />
          </div>
          {/* Alert badge */}
          <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{
              background: ALERT_COLORS[selectedSentiment.alertLevel].bg,
              border: `1px solid ${ALERT_COLORS[selectedSentiment.alertLevel].border}`,
              color: ALERT_COLORS[selectedSentiment.alertLevel].text,
            }}>
            {selectedSentiment.alertLevel === 'normal' && t('sentiment.alertNormal', locale)}
            {selectedSentiment.alertLevel === 'elevated' && t('sentiment.alertElevated', locale)}
            {selectedSentiment.alertLevel === 'high' && t('sentiment.alertHigh', locale)}
            {selectedSentiment.alertLevel === 'critical' && t('sentiment.alertCritical', locale)}
          </div>
        </div>

        {/* Overall Sentiment + Trend */}
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg4)', borderColor: 'var(--rim)' }}>
          <p className="text-xs mb-2" style={{ color: 'var(--text3)' }}>
            {t('sentiment.overall', locale)}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tabular-nums" style={{
              color: selectedSentiment.overallSentiment > 0 ? '#22C55E' : '#EF4444'
            }}>
              {(selectedSentiment.overallSentiment > 0 ? '+' : '')}{selectedSentiment.overallSentiment.toFixed(2)}
            </span>
            <span className="text-sm" style={{ color: TREND_ICONS[selectedSentiment.trendDirection].color }}>
              {TREND_ICONS[selectedSentiment.trendDirection].icon}
            </span>
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text3)' }}>
            {t('sentiment.velocity', locale)}: <span className="font-bold" style={{ color: selectedSentiment.velocity > 2 ? '#EF4444' : 'var(--text)' }}>{selectedSentiment.velocity.toFixed(1)}</span>
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>
            {t('sentiment.volume', locale)}: <span className="font-bold" style={{ color: 'var(--text)' }}>{selectedSentiment.volume.toLocaleString()}</span>
          </p>
        </div>
      </div>

      {/* Sentiment Time Series Mini Chart */}
      <div className="mb-6">
        <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--text3)' }}>
          {t('sentiment.last72Hours', locale)}
        </h4>
        <div className="h-24 relative" style={{ background: 'var(--bg4)', borderRadius: '8px' }}>
          <svg width="100%" height="100%" viewBox="0 0 400 96" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="48" x2="400" y2="48" stroke="var(--rim)" strokeWidth="0.5" strokeDasharray="4" />
            {/* Sentiment line */}
            <polyline
              fill="none"
              stroke="#3B82F6"
              strokeWidth="1.5"
              points={timeSeries.points
                .filter((_, i) => i % 2 === 0) // Sample every other point
                .map((p, i, arr) => {
                  const x = (i / (arr.length - 1)) * 400;
                  const y = 48 - (p.sentiment * 40); // -1=top(risk), +1=bottom(safe)
                  return `${x},${y}`;
                })
                .join(' ')}
            />
            {/* Risk sentiment line */}
            <polyline
              fill="none"
              stroke="#EF4444"
              strokeWidth="1"
              strokeDasharray="3,3"
              points={timeSeries.points
                .filter((_, i) => i % 2 === 0)
                .map((p, i, arr) => {
                  const x = (i / (arr.length - 1)) * 400;
                  const y = 96 - (p.riskSentiment / 100) * 96;
                  return `${x},${y}`;
                })
                .join(' ')}
            />
          </svg>
          {/* Legend */}
          <div className="absolute bottom-1 right-2 flex gap-3 text-[9px]" style={{ color: 'var(--text3)' }}>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 inline-block" style={{ background: '#3B82F6' }} />
              {t('sentiment.sentiment', locale)}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 inline-block" style={{ background: '#EF4444', borderStyle: 'dashed' }} />
              {t('sentiment.risk', locale)}
            </span>
          </div>
        </div>
      </div>

      {/* Top Topics */}
      <div className="mb-6">
        <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--text3)' }}>
          {t('sentiment.trendingTopics', locale)}
        </h4>
        <div className="space-y-2">
          {selectedSentiment.topTopics.map((topic, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-lg p-2" style={{ background: 'var(--bg4)' }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{
                  background: topic.sentiment < -0.3 ? '#EF4444' : topic.sentiment > 0 ? '#22C55E' : '#EAB308'
                }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                  {locale === 'ar' ? topic.topicAr : topic.topicEn}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tabular-nums" style={{ color: 'var(--text3)' }}>
                  {topic.volume.toLocaleString()}
                </span>
                <span className="text-[10px]" style={{ color: topic.trend === 'rising' ? '#EF4444' : topic.trend === 'falling' ? '#22C55E' : '#EAB308' }}>
                  {topic.trend === 'rising' ? '\u2191' : topic.trend === 'falling' ? '\u2193' : '\u2192'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {anomalies.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--text3)' }}>
            {t('sentiment.alerts', locale)}
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
              {anomalies.length}
            </span>
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {anomalies.slice(0, 5).map((alert) => (
              <div key={alert.id} className="rounded-lg p-2 text-xs" style={{
                background: ALERT_COLORS[alert.severity === 'critical' ? 'critical' : alert.severity === 'high' ? 'high' : 'elevated'].bg,
                borderLeft: `3px solid ${ALERT_COLORS[alert.severity === 'critical' ? 'critical' : alert.severity === 'high' ? 'high' : 'elevated'].text}`,
              }}>
                <span style={{ color: 'var(--text)' }}>
                  {locale === 'ar' ? alert.descriptionAr : alert.descriptionEn}
                </span>
                {alert.corroborated && (
                  <span className="ml-1 text-[9px]" style={{ color: '#22C55E' }}>
                    {t('sentiment.verified', locale)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Countries Overview */}
      <div>
        <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--text3)' }}>
          {t('sentiment.allCountries', locale)}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {allSentiments.map((s) => {
            const colors = ALERT_COLORS[s.alertLevel];
            return (
              <button
                key={s.countryCode}
                onClick={() => setSelectedCountry(s.countryCode)}
                className="rounded-lg p-2 text-left transition-all hover:scale-[1.02]"
                style={{
                  background: s.countryCode === selectedCountry ? 'var(--bg4)' : 'transparent',
                  border: `1px solid ${s.countryCode === selectedCountry ? colors.text : 'var(--rim)'}`,
                }}
              >
                <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                  {countryName(s.countryCode)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-sm font-bold tabular-nums" style={{ color: colors.text }}>
                    {s.riskSentiment}
                  </span>
                  <span className="text-[9px]" style={{ color: TREND_ICONS[s.trendDirection].color }}>
                    {TREND_ICONS[s.trendDirection].icon}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] mt-4" style={{ color: 'var(--text3)' }}>
        {t('sentiment.disclaimer', locale)}
      </p>
    </div>
  );
}

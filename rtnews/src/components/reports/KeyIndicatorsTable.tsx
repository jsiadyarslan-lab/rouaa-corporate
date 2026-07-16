'use client';

import { useState, useMemo } from 'react';

// ─── Types ───────────────────────────────────────────────────
interface IndicatorRow {
  name: string;
  value: string;
  change?: string;
  interpretation: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface KeyIndicatorsTableProps {
  reportText: string;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

// ─── Indicator extraction patterns ───────────────────────────
const INDICATOR_PATTERNS: {
  regex: RegExp;
  name: string;
  valueTransform?: (match: RegExpMatchArray) => string;
  changeTransform?: (match: RegExpMatchArray) => string | undefined;
  interpretation: string;
}[] = [
  {
    regex: /برنت[^0-9]*(\d+\.?\d*)\s*دولار[^)]*(?:\(([+\-]?\d+\.?\d*)\s*%\))?/i,
    name: 'خام برنت',
    valueTransform: (m) => `${m[1]} دولار`,
    changeTransform: (m) => m[2] ? `${m[2]}%` : undefined,
    interpretation: 'ارتفاع بسبب التوترات الجيوسياسية',
  },
  {
    regex: /خام\s*(?:أمريكي|WTI)[^0-9]*(\d+\.?\d*)\s*دولار/i,
    name: 'خام WTI',
    valueTransform: (m) => `${m[1]} دولار`,
    interpretation: 'يتأثر بمخزونات الولايات المتحدة',
  },
  {
    regex: /الصادرات[^0-9]*(\d+\.?\d*)\s*مليار[^)]*(?:\(([+\-]?\d+\.?\d*)\s*%\))?/i,
    name: 'الصادرات',
    valueTransform: (m) => `${m[1]} مليار دولار`,
    changeTransform: (m) => m[2] ? `${m[2]}%` : undefined,
    interpretation: 'مؤشر على قوة الاقتصاد التصديرية',
  },
  {
    regex: /التضخم[^0-9]*(\d+\.?\d*)\s*%/i,
    name: 'التضخم',
    valueTransform: (m) => `${m[1]}%`,
    interpretation: 'مؤشر لأسعار المستهلكين',
  },
  {
    regex: /الفائدة[^0-9]*(\d+\.?\d*)\s*%/i,
    name: 'سعر الفائدة',
    valueTransform: (m) => `${m[1]}%`,
    interpretation: 'أداة البنك المركزي لضبط الاقتصاد',
  },
  {
    regex: /الناتج المحلي[^0-9]*(\d+\.?\d*)\s*%/i,
    name: 'الناتج المحلي',
    valueTransform: (m) => `${m[1]}%`,
    interpretation: 'مؤشر النمو الاقتصادي',
  },
  {
    regex: /الذهب[^0-9]*(\d+[,.\d]*)\s*دولار/i,
    name: 'الذهب',
    valueTransform: (m) => `${m[1]} دولار`,
    interpretation: 'ملاذ آمن في أوقات عدم اليقين',
  },
  {
    regex: /الدولار[^0-9]*(\d+\.?\d*)\s*(?:يورو|رينمينبي|ين)/i,
    name: 'مؤشر الدولار',
    valueTransform: (m) => `${m[1]}`,
    interpretation: 'قوة العملة الأمريكية مقابل العملات الرئيسية',
  },
  {
    regex: /البطالة[^0-9]*(\d+\.?\d*)\s*%/i,
    name: 'معدل البطالة',
    valueTransform: (m) => `${m[1]}%`,
    interpretation: 'مؤشر لصحة سوق العمل',
  },
];

// ─── Main Component ──────────────────────────────────────────
export default function KeyIndicatorsTable({ reportText, locale = 'ar' }: KeyIndicatorsTableProps) {
  const isAr = locale === 'ar';
  const isFr = locale === 'fr';
  const isTr = locale === 'tr';
  const [sortKey, setSortKey] = useState<'name' | 'value'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Extract indicators from text
  const indicators = useMemo(() => {
    const found: IndicatorRow[] = [];
    const seen = new Set<string>();

    for (const pattern of INDICATOR_PATTERNS) {
      if (seen.has(pattern.name)) continue;
      const match = reportText.match(pattern.regex);
      if (match) {
        seen.add(pattern.name);
        const value = pattern.valueTransform ? pattern.valueTransform(match) : match[1];
        const change = pattern.changeTransform ? pattern.changeTransform(match) : undefined;
        
        let trend: 'up' | 'down' | 'neutral' = 'neutral';
        if (change) {
          const changeNum = parseFloat(change);
          if (changeNum > 0) trend = 'up';
          else if (changeNum < 0) trend = 'down';
        }

        // Adjust interpretation based on context
        let interpretation = pattern.interpretation;
        const contextMatch = reportText.match(new RegExp(`.{0,80}${pattern.name}.{0,80}`, 'i'));
        if (contextMatch) {
          const ctx = contextMatch[0];
          if (/ارتفاع|نمو|زيادة|صعود|تحسن/i.test(ctx)) interpretation = 'اتجاه صعودي — تأثير إيجابي';
          else if (/انخفاض|تراجع|هبوط|تدهور/i.test(ctx)) interpretation = 'اتجاه هبوطي — تأثير سلبي';
          else if (/تقلب|عدم يقين|حذر/i.test(ctx)) interpretation = 'اتجاه متقلب — حذر';
        }

        found.push({ name: pattern.name, value, change, interpretation, trend });
      }
    }

    return found;
  }, [reportText]);

  if (indicators.length === 0) return null;

  // Sort
  const sorted = [...indicators].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'name') cmp = a.name.localeCompare(b.name, 'ar');
    else cmp = a.value.localeCompare(b.value);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const handleSort = (key: 'name' | 'value') => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  return (
    <div style={{
      background: 'rgba(11,14,20,0.6)',
      borderRadius: '12px',
      border: '1px solid rgba(128,128,128,0.12)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(128,128,128,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{ fontSize: '16px' }}>📋</span>
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-head)' }}>
          {isTr ? 'Rapordan Çıkarılan Temel Göstergeler' : isFr ? 'Indicateurs Clés Extraits du Rapport' : isAr ? 'المؤشرات الرئيسية المستخرجة من التقرير' : 'Key Indicators Extracted from Report'}
        </span>
        <span style={{
          fontSize: '10px',
          padding: '2px 8px',
          borderRadius: '10px',
          background: 'rgba(0,229,255,0.08)',
          color: 'var(--cyan, #00e5ff)',
          fontWeight: 600,
          marginRight: 'auto',
        }}>
          {indicators.length} {isTr ? 'gösterge' : isFr ? 'indicateur(s)' : isAr ? 'مؤشر' : 'indicator(s)'}
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: 'rgba(0,153,107,0.06)' }}>
              <th style={{
                padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '10px',
                borderBottom: '2px solid rgba(0,153,107,0.15)', color: 'var(--text-head)',
                cursor: 'pointer', userSelect: 'none',
                letterSpacing: '0.5px',
              }} onClick={() => handleSort('name')}>
                {isTr ? 'Gösterge' : isFr ? 'Indicateur' : isAr ? 'المؤشر' : 'Indicator'} {sortKey === 'name' && (sortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th style={{
                padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '10px',
                borderBottom: '2px solid rgba(0,153,107,0.15)', color: 'var(--text-head)',
                cursor: 'pointer', userSelect: 'none',
                letterSpacing: '0.5px',
              }} onClick={() => handleSort('value')}>
                {isTr ? 'Değer' : isFr ? 'Valeur' : isAr ? 'القيمة' : 'Value'} {sortKey === 'value' && (sortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th style={{
                padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '10px',
                borderBottom: '2px solid rgba(0,153,107,0.15)', color: 'var(--text-head)',
                letterSpacing: '0.5px',
              }}>
                {isTr ? 'Değişim' : isFr ? 'Variation' : isAr ? 'التغيير' : 'Change'}
              </th>
              <th style={{
                padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '10px',
                borderBottom: '2px solid rgba(0,153,107,0.15)', color: 'var(--text-head)',
                letterSpacing: '0.5px',
              }}>
                {isTr ? 'Yorum' : isFr ? 'Interprétation' : isAr ? 'التفسير' : 'Interpretation'}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((ind, i) => (
              <tr key={i} style={{
                borderBottom: '1px solid rgba(128,128,128,0.06)',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(128,128,128,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '10px 14px', color: 'var(--text-head)', fontWeight: 600 }}>
                  {ind.name}
                </td>
                <td style={{ padding: '10px 14px', color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>
                  {ind.value}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  {ind.change ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: ind.trend === 'up' ? 'rgba(0,153,107,0.1)' : ind.trend === 'down' ? 'rgba(212,54,92,0.1)' : 'rgba(212,147,13,0.1)',
                      color: ind.trend === 'up' ? '#00996B' : ind.trend === 'down' ? '#D4365C' : '#D4930D',
                    }}>
                      {ind.trend === 'up' ? '▲' : ind.trend === 'down' ? '▼' : '●'} {ind.change}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text3)', fontSize: '10px' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '10px 14px', color: 'var(--text3)', fontSize: '11px', lineHeight: '1.5' }}>
                  {ind.interpretation}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid rgba(128,128,128,0.08)',
        fontSize: '10px',
        color: 'var(--text3)',
        textAlign: 'center',
      }}>
        ⚠️ {isTr ? 'Değerler rapor metninden otomatik olarak çıkarılmıştır — lütfen orijinal kaynakları doğrulayın' : isFr ? 'Valeurs extraites automatiquement du texte du rapport — veuillez vérifier les sources originales' : isAr ? 'القيم مستخرجة آلياً من نص التقرير — يُرجى التحقق من المصادر الأصلية' : 'Values extracted automatically from report text — please verify original sources'}
      </div>
    </div>
  );
}

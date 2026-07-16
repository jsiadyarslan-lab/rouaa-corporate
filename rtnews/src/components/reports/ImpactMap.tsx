'use client';

import { useState, useMemo } from 'react';

// ─── Country Impact Data ─────────────────────────────────────
interface CountryImpact {
  id: string;           // ISO 3166-1 alpha-2 or alpha-3
  nameAr: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  affectedAssets: string[];
}

interface ImpactMapProps {
  countries: CountryImpact[];
  title?: string;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

// ─── Predefined country positions (simplified lat/lng → % positions) ──
// This avoids needing a TopoJSON library for a simple visualization
const COUNTRY_POSITIONS: Record<string, { x: number; y: number; w: number; h: number }> = {
  US: { x: 12, y: 32, w: 14, h: 12 },
  CN: { x: 72, y: 30, w: 10, h: 10 },
  RU: { x: 60, y: 14, w: 18, h: 10 },
  SA: { x: 54, y: 44, w: 4, h: 4 },
  IR: { x: 56, y: 38, w: 4, h: 4 },
  AE: { x: 55, y: 46, w: 2, h: 2 },
  DE: { x: 47, y: 26, w: 3, h: 3 },
  GB: { x: 44, y: 24, w: 2, h: 3 },
  JP: { x: 82, y: 32, w: 3, h: 5 },
  KR: { x: 79, y: 32, w: 2, h: 2 },
  IN: { x: 66, y: 42, w: 5, h: 8 },
  BR: { x: 28, y: 60, w: 8, h: 14 },
  AU: { x: 80, y: 68, w: 8, h: 6 },
  CA: { x: 14, y: 20, w: 12, h: 8 },
  QA: { x: 55, y: 44, w: 1.5, h: 1.5 },
  KW: { x: 54, y: 40, w: 1.5, h: 1.5 },
  IQ: { x: 55, y: 36, w: 3, h: 4 },
  EG: { x: 50, y: 42, w: 3, h: 4 },
  TR: { x: 52, y: 32, w: 4, h: 3 },
  ZA: { x: 50, y: 72, w: 4, h: 6 },
  NG: { x: 44, y: 52, w: 3, h: 4 },
  MX: { x: 12, y: 44, w: 4, h: 6 },
  FR: { x: 45, y: 28, w: 3, h: 3 },
  IT: { x: 47, y: 32, w: 2, h: 4 },
  ES: { x: 43, y: 34, w: 3, h: 3 },
};

// Country name aliases (Arabic → code)
const NAME_TO_CODE: Record<string, string> = {
  'الولايات المتحدة': 'US', 'أمريكا': 'US', 'الولايات': 'US',
  'الصين': 'CN', 'صين': 'CN',
  'روسيا': 'RU', 'الاتحاد الروسي': 'RU',
  'السعودية': 'SA', 'المملكة العربية السعودية': 'SA',
  'إيران': 'IR', 'ايران': 'IR',
  'الإمارات': 'AE', 'دبي': 'AE', 'أبوظبي': 'AE',
  'ألمانيا': 'DE',
  'بريطانيا': 'GB', 'المملكة المتحدة': 'GB', 'إنجلترا': 'GB',
  'اليابان': 'JP',
  'كوريا': 'KR', 'كوريا الجنوبية': 'KR',
  'الهند': 'IN',
  'البرازيل': 'BR',
  'أستراليا': 'AU',
  'كندا': 'CA',
  'قطر': 'QA',
  'الكويت': 'KW',
  'العراق': 'IQ',
  'مصر': 'EG',
  'تركيا': 'TR',
  'جنوب أفريقيا': 'ZA',
  'نيجيريا': 'NG',
  'المكسيك': 'MX',
  'فرنسا': 'FR',
  'إيطاليا': 'IT',
  'إسبانيا': 'ES',
};

const IMPACT_COLORS = {
  positive: { bg: 'rgba(0,153,107,0.25)', border: '#00996B', dot: '#00996B' },
  negative: { bg: 'rgba(212,54,92,0.25)', border: '#D4365C', dot: '#D4365C' },
  neutral: { bg: 'rgba(212,147,13,0.25)', border: '#D4930D', dot: '#D4930D' },
};

const IMPACT_LABELS: Record<'ar' | 'en' | 'fr' | 'tr' | 'es', Record<'positive' | 'negative' | 'neutral', string>> = {
  ar: { positive: 'إيجابي', negative: 'سلبي', neutral: 'محايد / متقلب' },
  en: { positive: 'Positive', negative: 'Negative', neutral: 'Neutral / Volatile' },
  fr: { positive: 'Positif', negative: 'Négatif', neutral: 'Neutre / Volatile' },
  tr: { positive: 'Olumlu', negative: 'Olumsuz', neutral: 'Nötr / Değişken' },
  es: { positive: 'Positivo', negative: 'Negativo', neutral: 'Neutral / Volátil' },
};

export default function ImpactMap({ countries, title, locale = 'ar' }: ImpactMapProps) {
  const isAr = locale === 'ar';
  const isFr = locale === 'fr';
  const isEs = locale === 'es';
  const isTr = locale === 'tr';
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  // Map country impacts to visual positions
  const mapPins = useMemo(() => {
    return countries.map(c => {
      const pos = COUNTRY_POSITIONS[c.id];
      if (!pos) return null;
      return { ...c, pos };
    }).filter(Boolean) as (CountryImpact & { pos: { x: number; y: number; w: number; h: number } })[];
  }, [countries]);

  if (mapPins.length === 0) return null;

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
        <span style={{ fontSize: '16px' }}>🗺️</span>
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-head)' }}>
          {title || (isEs ? 'Mapa de Impacto Geopolítico y Económico' : isTr ? 'Jeopolitik ve Ekonomik Etki Haritası' : isFr ? "Carte d'Impact Géopolitique et Économique" : isAr ? 'خريطة التأثيرات الجيوسياسية والاقتصادية' : 'Geopolitical & Economic Impact Map')}
        </span>
      </div>

      {/* Map area */}
      <div style={{ position: 'relative', padding: '12px' }}>
        <svg viewBox="0 0 100 85" style={{ width: '100%', height: 'auto' }}>
          {/* Background grid lines */}
          {[20, 40, 60, 80].map(x => (
            <line key={`vl-${x}`} x1={x} y1={0} x2={x} y2={85} stroke="rgba(128,128,128,0.06)" strokeWidth="0.2" />
          ))}
          {[20, 40, 60].map(y => (
            <line key={`hl-${y}`} x1={0} y1={y} x2={100} y2={y} stroke="rgba(128,128,128,0.06)" strokeWidth="0.2" />
          ))}

          {/* Equator line */}
          <line x1={0} y1={42} x2={100} y2={42} stroke="rgba(0,229,255,0.08)" strokeWidth="0.3" strokeDasharray="2,2" />

          {/* Country markers */}
          {mapPins.map(pin => {
            const colors = IMPACT_COLORS[pin.impact];
            const isHovered = hoveredCountry === pin.id;
            const cx = pin.pos.x + pin.pos.w / 2;
            const cy = pin.pos.y + pin.pos.h / 2;

            return (
              <g key={pin.id}
                onMouseEnter={() => setHoveredCountry(pin.id)}
                onMouseLeave={() => setHoveredCountry(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Country area (subtle) */}
                <rect
                  x={pin.pos.x} y={pin.pos.y}
                  width={pin.pos.w} height={pin.pos.h}
                  rx="1"
                  fill={isHovered ? colors.bg : 'transparent'}
                  stroke={isHovered ? colors.border : 'rgba(128,128,128,0.1)'}
                  strokeWidth={isHovered ? '0.4' : '0.15'}
                  style={{ transition: 'all 0.2s ease' }}
                />
                {/* Dot marker */}
                <circle
                  cx={cx} cy={cy} r={isHovered ? '1.8' : '1.2'}
                  fill={colors.dot}
                  stroke={isHovered ? '#fff' : 'transparent'}
                  strokeWidth="0.3"
                  style={{ transition: 'all 0.2s ease' }}
                />
                {/* Pulse effect */}
                {isHovered && (
                  <circle cx={cx} cy={cy} r="3" fill="none" stroke={colors.dot} strokeWidth="0.2" opacity="0.5">
                    <animate attributeName="r" from="1.5" to="4" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip overlay */}
        {hoveredCountry && (() => {
          const pin = mapPins.find(p => p.id === hoveredCountry);
          if (!pin) return null;
          const colors = IMPACT_COLORS[pin.impact];
          return (
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#151A22',
              border: `1px solid ${colors.border}40`,
              borderRadius: '8px',
              padding: '10px 14px',
              minWidth: '180px',
              boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 12px ${colors.border}20`,
              zIndex: 10,
              direction: isAr ? 'rtl' : 'ltr',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors.dot }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-head)' }}>{pin.nameAr}</span>
                {/* Locale-aware country name could be added via a nameEn/nameFr field */}
                <span style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: colors.bg,
                  color: colors.dot,
                  fontWeight: 600,
                  marginRight: 'auto',
                }}>{IMPACT_LABELS[locale][pin.impact]}</span>
              </div>
              {pin.description && (
                <p style={{ fontSize: '11px', color: 'var(--text2)', lineHeight: '1.6', margin: '0 0 4px' }}>{pin.description}</p>
              )}
              {pin.affectedAssets.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {pin.affectedAssets.map((asset, i) => (
                    <span key={i} style={{
                      fontSize: '9px',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: 'rgba(128,128,128,0.1)',
                      color: 'var(--text3)',
                      border: '1px solid rgba(128,128,128,0.1)',
                    }}>{asset}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Legend */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid rgba(128,128,128,0.08)',
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        flexWrap: 'wrap',
      }}>
        {(['positive', 'negative', 'neutral'] as const).map(impact => (
          <div key={impact} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: IMPACT_COLORS[impact].dot }} />
            <span style={{ fontSize: '10px', color: 'var(--text3)' }}>{IMPACT_LABELS[locale][impact]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Helper: Extract countries from report text ──────────────
export function extractCountriesFromText(text: string): CountryImpact[] {
  const countries: CountryImpact[] = [];
  const seen = new Set<string>();

  for (const [arabicName, code] of Object.entries(NAME_TO_CODE)) {
    if (seen.has(code)) continue;
    // Check if country is mentioned in the text
    const regex = new RegExp(arabicName, 'i');
    if (regex.test(text)) {
      seen.add(code);
      
      // Determine impact from surrounding context
      let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
      // Look for impact keywords near the country name
      const contextRegex = new RegExp(`.{0,80}${arabicName}.{0,80}`, 'gi');
      const contextMatches = text.match(contextRegex);
      if (contextMatches) {
        const contextText = contextMatches.join(' ');
        const posWords = (contextText.match(/نمو|ارتفاع|زيادة|إيجابي|صعود|فائض|تحسن|انتعاش|تفوق|أرباح|تقدم|ازدهار/gi) || []).length;
        const negWords = (contextText.match(/انخفاض|تراجع|خسارة|سلبي|هبوط|عجز|تدهور|أزمة|تضخم|عقوبات|حرب|توتر|صراع|مخاطر|تخفيض/gi) || []).length;
        if (posWords > negWords + 1) impact = 'positive';
        else if (negWords > posWords + 1) impact = 'negative';
      }

      // Extract affected assets from context
      const affectedAssets: string[] = [];
      const assetKeywords: Record<string, string[]> = {
        'نفط': ['نفط', 'بترول', 'برنت', 'خام', 'أوبك'],
        'ذهب': ['ذهب', 'ملاذ آمن', 'سبائك'],
        'عملات': ['عملات', 'دولار', 'يورو', 'فوركس', 'يوان'],
        'مؤشرات': ['مؤشر', 'داو', 'ناسداك', 'إس آند بي', 'فوتسي'],
        'غاز': ['غاز', 'طاقة', 'أنابيب'],
        'أسهم': ['أسهم', 'بورصة', 'تداول'],
      };
      for (const [assetName, keywords] of Object.entries(assetKeywords)) {
        if (keywords.some(kw => text.includes(kw))) {
          affectedAssets.push(assetName);
        }
      }

      // Extract short description from context
      const descMatch = text.match(new RegExp(`.{0,60}${arabicName}.{0,60}`, 'i'));
      const description = descMatch ? descMatch[0].replace(new RegExp(arabicName, 'gi'), `**${arabicName}**`).slice(0, 100) + '...' : '';

      countries.push({
        id: code,
        nameAr: arabicName,
        impact,
        description,
        affectedAssets: affectedAssets.slice(0, 4),
      });
    }
  }

  return countries;
}

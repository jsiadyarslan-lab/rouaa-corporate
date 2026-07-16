'use client';

// ─── Sentiment Analysis Widget ──────────────────────────────────
// Shows overall market sentiment for a stock with visual meter (0-100),
// color gradient (red→gold→green), signal badge, and breakdown bars
// for Technical, Fundamental, and Analyst scores.
// Supports RTL (Arabic) and LTR (English/French) with trilingual labels.

// ── Locale Labels ──
const LABELS: Record<string, Record<string, string>> = {
  en: {
    sentiment: 'Market Sentiment',
    bullish: 'Bullish',
    bearish: 'Bearish',
    neutral: 'Neutral',
    technical: 'Technical',
    fundamental: 'Fundamental',
    analyst: 'Analyst',
    confidence: 'Confidence',
    overallScore: 'Overall Score',
    bearishLabel: 'Bearish',
    neutralLabel: 'Neutral',
    bullishLabel: 'Bullish',
  },
  ar: {
    sentiment: 'مشاعر السوق',
    bullish: 'صاعد',
    bearish: 'هابط',
    neutral: 'محايد',
    technical: 'الفني',
    fundamental: 'الأساسي',
    analyst: 'المحللين',
    confidence: 'الثقة',
    overallScore: 'الدرجة الإجمالية',
    bearishLabel: 'هابط',
    neutralLabel: 'محايد',
    bullishLabel: 'صاعد',
  },
  fr: {
    sentiment: 'Sentiment du Marché',
    bullish: 'Haussier',
    bearish: 'Baissier',
    neutral: 'Neutre',
    technical: 'Technique',
    fundamental: 'Fondamental',
    analyst: 'Analystes',
    confidence: 'Confiance',
    overallScore: 'Score Global',
    bearishLabel: 'Baissier',
    neutralLabel: 'Neutre',
    bullishLabel: 'Haussier',
  },
  tr: {
    sentiment: 'Piyasa Duygusu',
    bullish: 'Yükseliş',
    bearish: 'Düşüş',
    neutral: 'Nötr',
    technical: 'Teknik',
    fundamental: 'Temel',
    analyst: 'Analistler',
    confidence: 'Güven',
    overallScore: 'Genel Puan',
    bearishLabel: 'Düşüş',
    neutralLabel: 'Nötr',
    bullishLabel: 'Yükseliş',
  },
  es: {
    sentiment: 'Sentimiento del Mercado',
    bullish: 'Alcista',
    bearish: 'Bajista',
    neutral: 'Neutral',
    technical: 'Técnico',
    fundamental: 'Fundamental',
    analyst: 'Analistas',
    confidence: 'Confianza',
    overallScore: 'Puntuación General',
    bearishLabel: 'Bajista',
    neutralLabel: 'Neutral',
    bullishLabel: 'Alcista',
  },
};

// ── Props ──
interface SentimentWidgetProps {
  overallSignal: string;   // bullish, bearish, neutral
  confidenceScore: number;  // 0-100
  technicalScore?: number;  // 0-100
  fundamentalScore?: number; // 0-100
  locale: string;           // 'en' | 'ar' | 'fr'
}

export default function SentimentWidget({
  overallSignal,
  confidenceScore,
  technicalScore,
  fundamentalScore,
  locale,
}: SentimentWidgetProps) {
  const t = LABELS[locale] || LABELS.en;
  const isRTL = locale === 'ar';
  const dir = isRTL ? 'rtl' : 'ltr';

  // Compute analyst score from overall signal strength + confidence
  const analystScore = (() => {
    const sig = (overallSignal || '').toLowerCase();
    if (sig === 'bullish') return Math.min(100, 60 + confidenceScore * 0.4);
    if (sig === 'bearish') return Math.max(0, 40 - confidenceScore * 0.4);
    return 50;
  })();

  // Weighted overall sentiment score (0-100)
  const overallScore = Math.round(
    (technicalScore ?? 50) * 0.4 +
    (fundamentalScore ?? 50) * 0.35 +
    analystScore * 0.25
  );

  // Clamp to 0-100
  const clampedScore = Math.max(0, Math.min(100, overallScore));

  // Determine signal key for styling
  const signalKey = (overallSignal || '').toLowerCase() === 'bullish'
    ? 'bullish'
    : (overallSignal || '').toLowerCase() === 'bearish'
      ? 'bearish'
      : 'neutral';

  // Signal color mapping using CSS vars
  const signalColors: Record<string, { color: string; bg: string; border: string }> = {
    bullish: { color: 'var(--bull)', bg: 'var(--bull2)', border: 'rgba(34,197,94,0.3)' },
    bearish: { color: 'var(--bear)', bg: 'var(--bear2)', border: 'rgba(239,83,80,0.3)' },
    neutral: { color: 'var(--gold)', bg: 'var(--gold2)', border: 'rgba(255,184,0,0.3)' },
  };

  const sc = signalColors[signalKey];

  // Gradient color for meter bar position
  const meterGradient = (score: number) => {
    if (score >= 60) return 'var(--bull)';
    if (score >= 40) return 'var(--gold)';
    return 'var(--bear)';
  };

  // Source breakdown data
  const sources = [
    { label: t.technical, score: Math.round(technicalScore ?? 50) },
    { label: t.fundamental, score: Math.round(fundamentalScore ?? 50) },
    { label: t.analyst, score: Math.round(analystScore) },
  ];

  return (
    <div
      dir={dir}
      className="glass-card"
      style={{
        borderRadius: 12,
        padding: 20,
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'var(--cyan2)',
            border: '1px solid var(--border2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--cyan)',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>
          {t.sentiment}
        </span>
      </div>

      {/* Overall Sentiment Badge */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div
          style={{
            display: 'inline-block',
            padding: '8px 28px',
            borderRadius: 10,
            background: sc.bg,
            border: `1px solid ${sc.border}`,
            fontSize: 20,
            fontWeight: 700,
            color: sc.color,
            letterSpacing: 0.5,
          }}
        >
          {signalKey === 'bullish'
            ? t.bullish
            : signalKey === 'bearish'
              ? t.bearish
              : t.neutral}
        </div>
      </div>

      {/* Confidence indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 20,
        }}
      >
        <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>
          {t.confidence}
        </span>
        <div
          style={{
            width: 80,
            height: 4,
            borderRadius: 2,
            background: 'var(--bg4)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.max(0, Math.min(100, confidenceScore))}%`,
              borderRadius: 2,
              background: 'var(--cyan)',
              transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--cyan)',
            fontFamily: 'var(--font-jetbrains-mono), monospace',
          }}
          suppressHydrationWarning
        >
          {Math.round(confidenceScore)}%
        </span>
      </div>

      {/* Visual Sentiment Meter (0-100) with gradient */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: 'var(--bear)',
              fontWeight: 700,
            }}
          >
            0
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontSize: 11,
                color: 'var(--text3)',
                fontWeight: 600,
              }}
            >
              {t.overallScore}
            </span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: meterGradient(clampedScore),
                fontFamily: 'var(--font-jetbrains-mono), monospace',
              }}
              suppressHydrationWarning
            >
              {clampedScore}
            </span>
          </div>
          <span
            style={{
              fontSize: 10,
              color: 'var(--bull)',
              fontWeight: 700,
            }}
          >
            100
          </span>
        </div>

        {/* Meter bar with gradient background */}
        <div
          style={{
            position: 'relative',
            height: 14,
            borderRadius: 7,
            background: 'var(--bg4)',
            overflow: 'hidden',
          }}
        >
          {/* Full gradient background: red → gold → green */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to right, #ef5350, #ffb800, #22c55e)',
              opacity: 0.2,
              borderRadius: 7,
            }}
          />
          {/* Filled portion up to the score */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: isRTL ? undefined : 0,
              right: isRTL ? 0 : undefined,
              width: `${clampedScore}%`,
              borderRadius: 7,
              background: meterGradient(clampedScore),
              transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
              opacity: 0.85,
            }}
          />
          {/* Pointer indicator */}
          <div
            style={{
              position: 'absolute',
              top: -3,
              bottom: -3,
              width: 4,
              borderRadius: 2,
              background: 'var(--text-head)',
              left: isRTL ? undefined : `calc(${clampedScore}% - 2px)`,
              right: isRTL ? `calc(${clampedScore}% - 2px)` : undefined,
              boxShadow: '0 0 8px rgba(0,0,0,0.5)',
              transition: isRTL
                ? 'right 1s cubic-bezier(0.4,0,0.2,1)'
                : 'left 1s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </div>

        {/* Labels below meter */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 4,
          }}
        >
          <span style={{ fontSize: 9, color: 'var(--text3)' }}>
            {t.bearishLabel}
          </span>
          <span style={{ fontSize: 9, color: 'var(--text3)' }}>
            {t.neutralLabel}
          </span>
          <span style={{ fontSize: 9, color: 'var(--text3)' }}>
            {t.bullishLabel}
          </span>
        </div>
      </div>

      {/* Source Breakdown Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sources.map((src) => (
          <div key={src.label}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 5,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--text3)',
                  fontWeight: 600,
                }}
              >
                {src.label}
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: meterGradient(src.score),
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                }}
                suppressHydrationWarning
              >
                {src.score}
              </span>
            </div>
            <div
              style={{
                position: 'relative',
                height: 6,
                borderRadius: 3,
                background: 'var(--bg4)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: isRTL ? undefined : 0,
                  right: isRTL ? 0 : undefined,
                  width: `${src.score}%`,
                  borderRadius: 3,
                  background: meterGradient(src.score),
                  transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

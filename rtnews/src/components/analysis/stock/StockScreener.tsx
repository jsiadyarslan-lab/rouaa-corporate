'use client';

import { useState, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════
// Stock Screener Component — Filter and discover stocks
// Powered by Groq AI for intelligent recommendations
// ═══════════════════════════════════════════════════════════════════

interface StockRecommendation {
  symbol: string;
  companyName: string;
  sector: string;
  signal: string;
  confidence: number;
  priceTarget: string;
  rationale: string;
  riskLevel: string;
  timeframe: string;
}

interface Props {
  locale: 'ar' | 'en' | 'fr' | 'es' | 'tr';
  cssModule: any;
}

const CRITERIA_OPTIONS = [
  { id: 'growth', labelAr: 'نمو', labelEn: 'Growth' },
  { id: 'value', labelAr: 'قيمة', labelEn: 'Value' },
  { id: 'dividend', labelAr: 'أرباح', labelEn: 'Dividend' },
  { id: 'momentum', labelAr: 'زخم', labelEn: 'Momentum' },
  { id: 'ai-tech', labelAr: 'ذكاء اصطناعي', labelEn: 'AI & Tech' },
  { id: 'blue-chip', labelAr: 'شركات كبرى', labelEn: 'Blue Chip' },
  { id: 'small-cap', labelAr: 'شركات صغيرة', labelEn: 'Small Cap' },
  { id: 'esg', labelAr: 'ESG', labelEn: 'ESG' },
];

const SECTOR_OPTIONS = [
  { id: 'all', labelAr: 'الكل', labelEn: 'All' },
  { id: 'Technology', labelAr: 'تكنولوجيا', labelEn: 'Technology' },
  { id: 'Healthcare', labelAr: 'رعاية صحية', labelEn: 'Healthcare' },
  { id: 'Finance', labelAr: 'مالية', labelEn: 'Finance' },
  { id: 'Energy', labelAr: 'طاقة', labelEn: 'Energy' },
  { id: 'Consumer', labelAr: 'استهلاكي', labelEn: 'Consumer' },
  { id: 'Industrial', labelAr: 'صناعي', labelEn: 'Industrial' },
  { id: 'Real Estate', labelAr: 'عقارات', labelEn: 'Real Estate' },
  { id: 'Materials', labelAr: 'مواد', labelEn: 'Materials' },
  { id: 'Utilities', labelAr: 'مرافق', labelEn: 'Utilities' },
];

const RISK_OPTIONS = [
  { id: 'conservative', labelAr: 'محافظ', labelEn: 'Conservative' },
  { id: 'moderate', labelAr: 'متوسط', labelEn: 'Moderate' },
  { id: 'aggressive', labelAr: 'جريء', labelEn: 'Aggressive' },
];

const HORIZON_OPTIONS = [
  { id: 'short', labelAr: 'قصير (1-3 أشهر)', labelEn: 'Short (1-3 mo)' },
  { id: 'medium', labelAr: 'متوسط (3-12 شهر)', labelEn: 'Medium (3-12 mo)' },
  { id: 'long', labelAr: 'طويل (1-5 سنوات)', labelEn: 'Long (1-5 yr)' },
];

function getSignalColor(signal: string): string {
  const s = signal?.toLowerCase() || '';
  if (s.includes('strong buy')) return 'var(--bull)';
  if (s.includes('buy')) return '#4ade80';
  if (s.includes('strong sell')) return 'var(--bear)';
  if (s.includes('sell')) return '#f87171';
  return 'var(--gold)';
}

function getSignalBg(signal: string): string {
  const s = signal?.toLowerCase() || '';
  if (s.includes('buy')) return 'rgba(34,197,94,0.1)';
  if (s.includes('sell')) return 'rgba(239,83,80,0.1)';
  return 'rgba(255,184,0,0.1)';
}

function getRiskColor(risk: string): string {
  const r = risk?.toLowerCase() || '';
  if (r === 'low') return 'var(--bull)';
  if (r === 'high') return 'var(--bear)';
  return 'var(--gold)';
}

export default function StockScreener({ locale, cssModule: s }: Props) {
  const isAr = locale === 'ar';

  // ── Filter State ──
  const [criteria, setCriteria] = useState('growth');
  const [sector, setSector] = useState('all');
  const [riskTolerance, setRiskTolerance] = useState('moderate');
  const [investmentHorizon, setInvestmentHorizon] = useState('medium');
  const [count, setCount] = useState(8);

  // ── Result State ──
  const [stocks, setStocks] = useState<StockRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockRecommendation | null>(null);

  // ── Search Handler ──
  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedStock(null);

    try {
      const res = await fetch('/api/stock-analysis/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'find-best-stocks',
          locale,
          criteria,
          sector,
          riskTolerance,
          investmentHorizon,
          count,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.stocks && data.stocks.length > 0) {
        setStocks(data.stocks);
      } else if (data.rawAnalysis) {
        // Fallback: Try to extract stocks from raw text
        setStocks([]);
        setError(isAr ? 'لم يتم العثور على توصيات. حاول معايير مختلفة.' : 'No recommendations found. Try different criteria.');
      }

      setHasSearched(true);
    } catch (err: any) {
      setError(isAr ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
    } finally {
      setLoading(false);
    }
  }, [criteria, sector, riskTolerance, investmentHorizon, count, locale, isAr]);

  return (
    <div className={s.screenerPanel}>
      {/* ── Header ── */}
      <div className={s.screenerHeader}>
        <div className={s.screenerHeaderLeft}>
          <div className={s.screenerIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <div>
            <h3 className={s.screenerTitle}>
              {isAr ? 'ماسح الأسهم الذكي' : 'Smart Stock Scanner'}
            </h3>
            <p className={s.screenerSub}>
              {isAr ? 'مدعوم بـ Groq AI · توصيات فورية' : 'Powered by Groq AI · Instant recommendations'}
            </p>
          </div>
        </div>
        <div className={s.groqBadge}>
          <span className={s.groqDot} />
          Groq
        </div>
      </div>

      {/* ── Filters Grid ── */}
      <div className={s.screenerFilters}>
        {/* Criteria */}
        <div className={s.filterGroup}>
          <label className={s.filterLabel}>
            {isAr ? 'استراتيجية الاستثمار' : 'Investment Strategy'}
          </label>
          <div className={s.filterChips}>
            {CRITERIA_OPTIONS.map(opt => (
              <button
                key={opt.id}
                className={`${s.filterChip} ${criteria === opt.id ? s.filterChipActive : ''}`}
                onClick={() => setCriteria(opt.id)}
              >
                {isAr ? opt.labelAr : opt.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Sector */}
        <div className={s.filterGroup}>
          <label className={s.filterLabel}>
            {isAr ? 'القطاع' : 'Sector'}
          </label>
          <div className={s.filterChips}>
            {SECTOR_OPTIONS.map(opt => (
              <button
                key={opt.id}
                className={`${s.filterChip} ${sector === opt.id ? s.filterChipActive : ''}`}
                onClick={() => setSector(opt.id)}
              >
                {isAr ? opt.labelAr : opt.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Risk & Horizon Row */}
        <div className={s.filterRow}>
          <div className={s.filterGroup}>
            <label className={s.filterLabel}>
              {isAr ? 'تحمل المخاطر' : 'Risk Tolerance'}
            </label>
            <div className={s.filterChips}>
              {RISK_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  className={`${s.filterChip} ${riskTolerance === opt.id ? s.filterChipActive : ''}`}
                  onClick={() => setRiskTolerance(opt.id)}
                >
                  {isAr ? opt.labelAr : opt.labelEn}
                </button>
              ))}
            </div>
          </div>
          <div className={s.filterGroup}>
            <label className={s.filterLabel}>
              {isAr ? 'أفق الاستثمار' : 'Investment Horizon'}
            </label>
            <div className={s.filterChips}>
              {HORIZON_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  className={`${s.filterChip} ${investmentHorizon === opt.id ? s.filterChipActive : ''}`}
                  onClick={() => setInvestmentHorizon(opt.id)}
                >
                  {isAr ? opt.labelAr : opt.labelEn}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search Button */}
        <button
          className={s.searchBtn}
          onClick={handleSearch}
          disabled={loading}
        >
          {loading
            ? (isAr ? '⏳ جارٍ التحليل...' : '⏳ Analyzing...')
            : (isAr ? '🔍 ابحث عن أفضل الأسهم' : '🔍 Find Best Stocks')}
        </button>
      </div>

      {/* ── Results ── */}
      {loading && (
        <div className={s.screenerLoading}>
          <div className={s.spinnerDot} />
          <div className={s.spinnerDot} />
          <div className={s.spinnerDot} />
          <span>{isAr ? 'Groq يحلل السوق...' : 'Groq analyzing the market...'}</span>
        </div>
      )}

      {error && (
        <div className={s.screenerError}>
          <span>{error}</span>
        </div>
      )}

      {hasSearched && !loading && stocks.length === 0 && !error && (
        <div className={s.screenerEmpty}>
          <span style={{ fontSize: 32 }}>🔍</span>
          <p>{isAr ? 'لم يتم العثور على نتائج. جرّب معايير مختلفة.' : 'No results found. Try different criteria.'}</p>
        </div>
      )}

      {stocks.length > 0 && (
        <div className={s.screenerResults}>
          <div className={s.resultsHeader}>
            <h4 className={s.resultsTitle}>
              {isAr ? `أفضل ${stocks.length} توصية` : `Top ${stocks.length} Recommendations`}
            </h4>
            <span className={s.groqTag}>Groq AI</span>
          </div>
          <div className={s.stocksGrid}>
            {stocks.map((stock, i) => (
              <div
                key={stock.symbol + i}
                className={`${s.stockCard} ${selectedStock?.symbol === stock.symbol ? s.stockCardSelected : ''}`}
                onClick={() => setSelectedStock(selectedStock?.symbol === stock.symbol ? null : stock)}
              >
                <div className={s.stockCardTop}>
                  <div className={s.stockSymbol}>{stock.symbol}</div>
                  <div
                    className={s.stockSignalChip}
                    style={{
                      color: getSignalColor(stock.signal),
                      background: getSignalBg(stock.signal),
                    }}
                  >
                    {stock.signal}
                  </div>
                </div>
                <div className={s.stockName}>{stock.companyName}</div>
                <div className={s.stockSector}>{stock.sector}</div>
                <div className={s.stockMeta}>
                  <div className={s.stockConfidence}>
                    <span className={s.confidenceLabel}>
                      {isAr ? 'ثقة' : 'Conf.'}
                    </span>
                    <div className={s.confidenceBar}>
                      <div
                        className={s.confidenceFill}
                        style={{ width: `${stock.confidence}%` }}
                      />
                    </div>
                    <span className={s.confidenceValue}>{stock.confidence}%</span>
                  </div>
                  <div className={s.stockRisk} style={{ color: getRiskColor(stock.riskLevel) }}>
                    {isAr
                      ? stock.riskLevel === 'Low' ? 'منخفض' : stock.riskLevel === 'High' ? 'عالي' : 'متوسط'
                      : stock.riskLevel}
                  </div>
                </div>
                {selectedStock?.symbol === stock.symbol && (
                  <div className={s.stockDetail}>
                    <div className={s.stockDetailRow}>
                      <span>{isAr ? 'السعر المستهدف' : 'Price Target'}</span>
                      <span className={s.stockDetailValue}>{stock.priceTarget}</span>
                    </div>
                    <div className={s.stockDetailRow}>
                      <span>{isAr ? 'الإطار الزمني' : 'Timeframe'}</span>
                      <span className={s.stockDetailValue}>{stock.timeframe}</span>
                    </div>
                    <div className={s.stockRationale}>{stock.rationale}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════
// AI Stock Finder Component — Natural language stock discovery
// Powered by Groq for sub-second AI inference
// ═══════════════════════════════════════════════════════════════════

interface StockAnalysis {
  symbol: string;
  companyName: string;
  currentAssessment: string;
  technicalSignal: string;
  fundamentalRating: string;
  keyLevels: { support: string; resistance: string };
  pros: string[];
  cons: string[];
  signal: string;
  confidence: number;
  priceTarget: string;
  stopLoss: string;
  riskReward: string;
  summary: string;
}

interface SectorAnalysis {
  sector: string;
  overallOutlook: string;
  confidence: number;
  topStocks: Array<{ symbol: string; name: string; signal: string; reason: string }>;
  keyDrivers: string[];
  risks: string[];
  etfPlay: string;
  summary: string;
}

interface Props {
  locale: 'ar' | 'en' | 'fr' | 'es' | 'tr';
  cssModule: any;
}

type FinderMode = 'analyze' | 'compare' | 'sector';

const QUICK_PROMPTS_AR = [
  'أفضل أسهم التكنولوجيا للشراء الآن',
  'أسهم أرباح عالية منخفضة المخاطر',
  'أسهم AI وذكاء اصطناعي واعدة',
  'أرخص أسهم من حيث P/E',
  'أفضل أسهم للدخل المنتظم',
  'توقعات سهم AAPL',
];

const QUICK_PROMPTS_EN = [
  'Best tech stocks to buy now',
  'High dividend low risk stocks',
  'Promising AI stocks',
  'Cheapest stocks by P/E ratio',
  'Best stocks for regular income',
  'AAPL stock forecast',
];

function getSignalColor(signal: string): string {
  const s = (signal || '').toLowerCase();
  if (s.includes('strong buy') || s.includes('صعودي قوي')) return 'var(--bull)';
  if (s.includes('buy') || s.includes('شراء') || s.includes('صعود')) return '#4ade80';
  if (s.includes('strong sell') || s.includes('هبوطي قوي')) return 'var(--bear)';
  if (s.includes('sell') || s.includes('بيع') || s.includes('هبوط')) return '#f87171';
  return 'var(--gold)';
}

export default function AIStockFinder({ locale, cssModule: s }: Props) {
  const isAr = locale === 'ar';

  // ── State ──
  const [mode, setMode] = useState<FinderMode>('analyze');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [compareSymbols, setCompareSymbols] = useState('');
  const [selectedSector, setSelectedSector] = useState('Technology');

  // ── Analyze Stock ──
  const handleAnalyze = useCallback(async (symbol?: string) => {
    const target = symbol || query.trim();
    if (!target) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/stock-analysis/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze-stock',
          locale,
          symbol: target.toUpperCase(),
          analysisType: 'comprehensive',
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setResult(data.analysis);
    } catch {
      setError(isAr ? 'خطأ في الاتصال' : 'Connection error');
    } finally {
      setLoading(false);
    }
  }, [query, locale, isAr]);

  // ── Compare Stocks ──
  const handleCompare = useCallback(async () => {
    const symbols = compareSymbols.split(/[,+\s]+/).filter(Boolean).map(s => s.trim().toUpperCase());
    if (symbols.length < 2) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/stock-analysis/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'compare-stocks',
          locale,
          symbols,
          metric: 'overall',
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setResult(data.comparison);
    } catch {
      setError(isAr ? 'خطأ في الاتصال' : 'Connection error');
    } finally {
      setLoading(false);
    }
  }, [compareSymbols, locale, isAr]);

  // ── Sector Analysis ──
  const handleSector = useCallback(async (sector?: string) => {
    const target = sector || selectedSector;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/stock-analysis/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sector-analysis',
          locale,
          sector: target,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setResult(data.sectorAnalysis);
    } catch {
      setError(isAr ? 'خطأ في الاتصال' : 'Connection error');
    } finally {
      setLoading(false);
    }
  }, [selectedSector, locale, isAr]);

  // ── Quick Prompt Click ──
  const handleQuickPrompt = useCallback((prompt: string) => {
    // Detect if it's a symbol-specific query
    const symbolMatch = prompt.match(/\b([A-Z]{2,5})\b/);
    if (symbolMatch) {
      setQuery(symbolMatch[1]);
      setMode('analyze');
      handleAnalyze(symbolMatch[1]);
    } else {
      // Use as screener query
      setQuery(prompt);
      setMode('analyze');
    }
  }, [handleAnalyze]);

  return (
    <div className={s.finderPanel}>
      {/* ── Header ── */}
      <div className={s.finderHeader}>
        <div className={s.finderHeaderLeft}>
          <div className={s.finderIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <h3 className={s.finderTitle}>
              {isAr ? 'مساعد الأسهم الذكي' : 'AI Stock Assistant'}
            </h3>
            <p className={s.finderSub}>
              {isAr ? 'اسأل بأي لغة · Groq AI فوري' : 'Ask in any language · Instant Groq AI'}
            </p>
          </div>
        </div>
        <div className={s.groqBadge}>
          <span className={s.groqDot} />
          Groq
        </div>
      </div>

      {/* ── Mode Tabs ── */}
      <div className={s.finderModeTabs}>
        <button
          className={`${s.finderModeTab} ${mode === 'analyze' ? s.finderModeTabActive : ''}`}
          onClick={() => setMode('analyze')}
        >
          <span>🔍</span> {isAr ? 'تحليل سهم' : 'Analyze Stock'}
        </button>
        <button
          className={`${s.finderModeTab} ${mode === 'compare' ? s.finderModeTabActive : ''}`}
          onClick={() => setMode('compare')}
        >
          <span>⚖️</span> {isAr ? 'مقارنة' : 'Compare'}
        </button>
        <button
          className={`${s.finderModeTab} ${mode === 'sector' ? s.finderModeTabActive : ''}`}
          onClick={() => setMode('sector')}
        >
          <span>📊</span> {isAr ? 'تحليل قطاع' : 'Sector'}
        </button>
      </div>

      {/* ── Input Area ── */}
      {mode === 'analyze' && (
        <div className={s.finderInputArea}>
          <div className={s.finderInputRow}>
            <input
              type="text"
              className={s.finderInput}
              placeholder={isAr ? 'أدخل رمز السهم (مثال: AAPL, TSLA)...' : 'Enter stock symbol (e.g., AAPL, TSLA)...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
            <button
              className={s.finderBtn}
              onClick={() => handleAnalyze()}
              disabled={loading || !query.trim()}
            >
              {loading
                ? (isAr ? '⏳ يحلل...' : '⏳ Analyzing...')
                : (isAr ? 'حلّل' : 'Analyze')}
            </button>
          </div>
          {/* Quick Prompts */}
          <div className={s.quickPrompts}>
            {(isAr ? QUICK_PROMPTS_AR : QUICK_PROMPTS_EN).map((prompt, i) => (
              <button
                key={i}
                className={s.quickPrompt}
                onClick={() => handleQuickPrompt(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'compare' && (
        <div className={s.finderInputArea}>
          <div className={s.finderInputRow}>
            <input
              type="text"
              className={s.finderInput}
              placeholder={isAr ? 'أدخل الرموز مفصولة بفاصلة (مثال: AAPL, MSFT, GOOG)...' : 'Enter symbols separated by commas (e.g., AAPL, MSFT, GOOG)...'}
              value={compareSymbols}
              onChange={(e) => setCompareSymbols(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
            />
            <button
              className={s.finderBtn}
              onClick={handleCompare}
              disabled={loading || compareSymbols.split(',').filter(Boolean).length < 2}
            >
              {loading
                ? (isAr ? '⏳ يقارن...' : '⏳ Comparing...')
                : (isAr ? 'قارن' : 'Compare')}
            </button>
          </div>
        </div>
      )}

      {mode === 'sector' && (
        <div className={s.finderInputArea}>
          <div className={s.sectorChips}>
            {['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer', 'Industrial', 'Real Estate', 'Utilities'].map(sector => (
              <button
                key={sector}
                className={`${s.filterChip} ${selectedSector === sector ? s.filterChipActive : ''}`}
                onClick={() => { setSelectedSector(sector); handleSector(sector); }}
              >
                {isAr
                  ? sector === 'Technology' ? 'تكنولوجيا'
                  : sector === 'Healthcare' ? 'رعاية صحية'
                  : sector === 'Finance' ? 'مالية'
                  : sector === 'Energy' ? 'طاقة'
                  : sector === 'Consumer' ? 'استهلاكي'
                  : sector === 'Industrial' ? 'صناعي'
                  : sector === 'Real Estate' ? 'عقارات'
                  : 'مرافق'
                  : sector}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className={s.screenerLoading}>
          <div className={s.spinnerDot} /><div className={s.spinnerDot} /><div className={s.spinnerDot} />
          <span>{isAr ? 'Groq يحلل...' : 'Groq analyzing...'}</span>
        </div>
      )}

      {/* ── Error ── */}
      {error && <div className={s.screenerError}>{error}</div>}

      {/* ── Stock Analysis Result ── */}
      {mode === 'analyze' && result && !result.rawText && (
        <div className={s.analysisResult}>
          <div className={s.analysisHeader}>
            <div>
              <span className={s.analysisSymbol}>{result.symbol}</span>
              <span className={s.analysisName}>{result.companyName}</span>
            </div>
            <div className={s.analysisSignal} style={{ color: getSignalColor(result.signal), background: `${getSignalColor(result.signal)}15` }}>
              {result.signal}
            </div>
          </div>

          <div className={s.analysisAssessment}>{result.currentAssessment}</div>

          <div className={s.analysisMetrics}>
            <div className={s.metricCard}>
              <span className={s.metricLabel}>{isAr ? 'فني' : 'Technical'}</span>
              <span className={s.metricValue} style={{ color: getSignalColor(result.technicalSignal) }}>{result.technicalSignal}</span>
            </div>
            <div className={s.metricCard}>
              <span className={s.metricLabel}>{isAr ? 'أساسي' : 'Fundamental'}</span>
              <span className={s.metricValue}>{result.fundamentalRating}</span>
            </div>
            <div className={s.metricCard}>
              <span className={s.metricLabel}>{isAr ? 'ثقة' : 'Confidence'}</span>
              <span className={s.metricValue}>{result.confidence}%</span>
            </div>
          </div>

          {result.keyLevels && (
            <div className={s.keyLevelsRow}>
              <div className={s.keyLevel}>
                <span className={s.keyLevelLabel}>{isAr ? 'دعم' : 'Support'}</span>
                <span className={s.keyLevelValue} style={{ color: 'var(--bull)' }}>{result.keyLevels.support}</span>
              </div>
              <div className={s.keyLevel}>
                <span className={s.keyLevelLabel}>{isAr ? 'مقاومة' : 'Resistance'}</span>
                <span className={s.keyLevelValue} style={{ color: 'var(--bear)' }}>{result.keyLevels.resistance}</span>
              </div>
              <div className={s.keyLevel}>
                <span className={s.keyLevelLabel}>{isAr ? 'مستهدف' : 'Target'}</span>
                <span className={s.keyLevelValue} style={{ color: 'var(--cyan)' }}>{result.priceTarget}</span>
              </div>
              <div className={s.keyLevel}>
                <span className={s.keyLevelLabel}>{isAr ? 'وقف خسارة' : 'Stop Loss'}</span>
                <span className={s.keyLevelValue} style={{ color: 'var(--bear)' }}>{result.stopLoss}</span>
              </div>
            </div>
          )}

          {result.pros && result.pros.length > 0 && (
            <div className={s.prosConsRow}>
              <div className={s.prosSection}>
                <h5 className={s.prosConsTitle} style={{ color: 'var(--bull)' }}>
                  {isAr ? '✅ نقاط القوة' : '✅ Strengths'}
                </h5>
                {result.pros.map((pro: string, i: number) => (
                  <div key={i} className={s.proConItem}>{pro}</div>
                ))}
              </div>
              <div className={s.consSection}>
                <h5 className={s.prosConsTitle} style={{ color: 'var(--bear)' }}>
                  {isAr ? '⚠️ نقاط الضعف' : '⚠️ Weaknesses'}
                </h5>
                {result.cons.map((con: string, i: number) => (
                  <div key={i} className={s.proConItem}>{con}</div>
                ))}
              </div>
            </div>
          )}

          <div className={s.analysisSummary}>{result.summary}</div>
        </div>
      )}

      {/* ── Compare Result ── */}
      {mode === 'compare' && result?.comparison && (
        <div className={s.compareResult}>
          {result.comparison.map((item: any, i: number) => (
            <div key={i} className={s.compareCard}>
              <div className={s.compareCardTop}>
                <span className={s.compareSymbol}>{item.symbol}</span>
                <span className={s.compareScore}>{item.score}/100</span>
              </div>
              <div className={s.compareName}>{item.companyName}</div>
              <div className={s.compareSignal} style={{ color: getSignalColor(item.signal) }}>{item.signal}</div>
              <div className={s.compareVerdict}>{item.verdict}</div>
              {item.strengths && (
                <div className={s.comparePros}>
                  {item.strengths.slice(0, 2).map((s: string, j: number) => (
                    <span key={j} className={(s as any).proTag}>+ {s}</span>
                  ))}
                </div>
              )}
              {item.weaknesses && (
                <div className={s.compareCons}>
                  {item.weaknesses.slice(0, 2).map((w: string, j: number) => (
                    <span key={j} className={s.conTag}>- {w}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {result.winner && (
            <div className={s.compareWinner}>
              <span className={s.winnerLabel}>{isAr ? '🏆 الفائز' : '🏆 Winner'}</span>
              <span className={s.winnerSymbol}>{result.winner}</span>
              <span className={s.winnerRationale}>{result.rationale}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Sector Analysis Result ── */}
      {mode === 'sector' && result && !result.rawText && (
        <div className={s.sectorResult}>
          <div className={s.sectorHeader}>
            <h4>{result.sector}</h4>
            <span className={s.sectorOutlook} style={{ color: getSignalColor(result.overallOutlook) }}>
              {result.overallOutlook}
            </span>
          </div>
          <div className={s.sectorConfidence}>
            {isAr ? 'ثقة' : 'Confidence'}: {result.confidence}%
          </div>
          {result.topStocks && (
            <div className={s.sectorTopStocks}>
              {(result.topStocks || []).slice(0, 5).map((stock: any, i: number) => (
                <div key={i} className={s.sectorStockItem}>
                  <span className={s.sectorStockSymbol}>{stock.symbol}</span>
                  <span className={s.sectorStockName}>{stock.name}</span>
                  <span className={s.sectorStockSignal} style={{ color: getSignalColor(stock.signal) }}>{stock.signal}</span>
                </div>
              ))}
            </div>
          )}
          {result.keyDrivers && (
            <div className={s.sectorDrivers}>
              <h5>{isAr ? 'المحركات الرئيسية' : 'Key Drivers'}</h5>
              {result.keyDrivers.map((d: string, i: number) => (
                <div key={i} className={s.driverItem}>→ {d}</div>
              ))}
            </div>
          )}
          {result.risks && (
            <div className={s.sectorRisks}>
              <h5>{isAr ? 'المخاطر' : 'Risks'}</h5>
              {result.risks.map((r: string, i: number) => (
                <div key={i} className={s.riskItem}>⚠ {r}</div>
              ))}
            </div>
          )}
          {result.summary && <div className={s.sectorSummary}>{result.summary}</div>}
          {result.etfPlay && (
            <div className={s.etfPlay}>
              <span>{isAr ? 'ETF مقترح' : 'ETF Play'}:</span>
              <span className={s.etfSymbol}>{result.etfPlay}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Raw Text Fallback ── */}
      {result?.rawText && (
        <div className={s.rawResult}>
          <pre className={s.rawText}>{result.rawText}</pre>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import AIGeneratorPanel from '@/components/analysis/AIGeneratorPanel';
import ChartPanel from '@/components/analysis/ChartPanel';
import MarketAnalysesSection from '@/components/analysis/MarketAnalysesSection';
import NewsAnalysisSection from '@/components/analysis/NewsAnalysisSection';
import ContentAgentSection from '@/components/analysis/ContentAgentSection';
import SentimentPanel from '@/components/analysis/SentimentPanel';
import RiskCalculator from '@/components/analysis/RiskCalculator';
import TradingQuotesPanel from '@/components/analysis/TradingQuotesPanel';
import {
  type SentimentData, type MarketAnalysisItem, type NewsWithAnalysis,
  type ContentAnalysisItem, type TradingQuote,
  ANALYSIS_TYPES, TIMEFRAMES, STYLES,
} from '@/components/analysis/types';
import s from '@/app/analysis/AnalysisPage.module.css';

// ═══════════════════════════════════════════════════════════════════
// Tab IDs
// ═══════════════════════════════════════════════════════════════════
type TabId = 'ai' | 'markets' | 'news' | 'analysts';

interface TabDef {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: TabDef[] = [
  { id: 'ai', label: 'AI Analysis', icon: '🧠' },
  { id: 'markets', label: 'Markets', icon: '📈' },
  { id: 'news', label: 'News', icon: '📰' },
  { id: 'analysts', label: 'Analysts', icon: '🤖' },
];

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT — Tab-Based Terminal Architecture (English)
// ═══════════════════════════════════════════════════════════════════
export default function EnAnalysisPage() {
  // ── Tab State ──
  const [activeTab, setActiveTab] = useState<TabId>('ai');

  // ── AI Generator State ──
  const [genLoading, setGenLoading] = useState(false);
  const [genOutput, setGenOutput] = useState<string | null>(null);
  const [genTimestamp, setGenTimestamp] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState('Ready');

  // ── Chart State ──
  const [chartPair, setChartPair] = useState('EUR/USD');

  // ── Data State ──
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [marketAnalyses, setMarketAnalyses] = useState<MarketAnalysisItem[]>([]);
  const [analysesLoading, setAnalysesLoading] = useState(true);
  const [newsWithAnalysis, setNewsWithAnalysis] = useState<NewsWithAnalysis[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [tradingQuotes, setTradingQuotes] = useState<TradingQuote[]>([]);
  const [tradingLoading, setTradingLoading] = useState(true);
  const [contentAnalyses, setContentAnalyses] = useState<ContentAnalysisItem[]>([]);
  const [contentLoading, setContentLoading] = useState(true);

  // ── Stats ──
  const [stats, setStats] = useState({ totalAnalysis: 0, highImpact: 0, bullish: 0, bearish: 0 });

  // ── UI State ──
  const [showBackTop, setShowBackTop] = useState(false);

  // ── Scroll to top on mount ──
  useEffect(() => {
    window.scrollTo(0, 0);
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Fetch Sentiment (5min poll) ──
  useEffect(() => {
    const fetchSentiment = async () => {
      try {
        const res = await fetch('/api/markets/sentiment', { cache: 'no-store' });
        if (res.ok) setSentimentData(await res.json());
      } catch { /* silent */ }
    };
    fetchSentiment();
    const interval = setInterval(fetchSentiment, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Fetch Trading Quotes (30s poll) ──
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        setTradingLoading(true);
        const res = await fetch('/api/trading-platform?symbols=BTC/USDT,ETH/USDT,XAU/USD,AAPL,TSLA,SPY', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setTradingQuotes(data.data || []);
        }
      } catch { /* silent */ }
      finally { setTradingLoading(false); }
    };
    fetchQuotes();
    const interval = setInterval(() => { if (document.hidden) return; fetchQuotes(); }, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Fetch Content Agent Analyses ──
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setContentLoading(true);
        const res = await fetch('/api/trading-platform/analysis?limit=5', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setContentAnalyses(
            (data.articles || []).map((a: any) => ({
              ...a,
              symbols: Array.isArray(a.symbols)
                ? a.symbols
                : typeof a.symbols === 'string'
                  ? (a.symbols.startsWith('[')
                    ? (() => { try { const parsed = JSON.parse(a.symbols); return Array.isArray(parsed) ? parsed : a.symbols.split(',').filter(Boolean); } catch { return a.symbols.split(',').filter(Boolean); } })()
                    : a.symbols.split(',').filter(Boolean))
                  : [],
              tags: Array.isArray(a.tags)
                ? a.tags
                : typeof a.tags === 'string'
                  ? (() => { try { const parsed = JSON.parse(a.tags); return Array.isArray(parsed) ? parsed : []; } catch { return []; } })()
                  : [],
            }))
          );
        }
      } catch { /* silent */ }
      finally { setContentLoading(false); }
    };
    fetchContent();
  }, []);

  // ── Fetch Market Analyses ──
  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        setAnalysesLoading(true);
        const res = await fetch('/api/market-analyses?limit=6', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setMarketAnalyses(data.analyses || []);
        }
      } catch { /* silent */ }
      finally { setAnalysesLoading(false); }
    };
    fetchAnalyses();
  }, []);

  // ── Fetch News with AI Analysis ──
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setNewsLoading(true);
        const res = await fetch('/api/analysis/news?limit=6', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setNewsWithAnalysis((data.items || []).filter((n: any) => n.aiAnalysis && n.aiAnalysis.length > 50));
        }
      } catch { /* silent */ }
      finally { setNewsLoading(false); }
    };
    fetchNews();
  }, []);

  // ── Compute Stats ──
  useEffect(() => {
    const total = marketAnalyses.length + newsWithAnalysis.length;
    const highImpact = newsWithAnalysis.filter(n => n.impactLevel === 'high').length;
    const bullish = marketAnalyses.filter(a => /bull|positive|up/i.test(a.sentiment)).length +
      newsWithAnalysis.filter(n => n.sentiment === 'positive').length;
    const bearish = marketAnalyses.filter(a => /bear|negative|down/i.test(a.sentiment)).length +
      newsWithAnalysis.filter(n => n.sentiment === 'negative').length;
    setStats({ totalAnalysis: total, highImpact, bullish, bearish });
  }, [marketAnalyses, newsWithAnalysis]);

  // ── AI Generation Handler ──
  const handleGenerate = useCallback(async (params: {
    pair: string; analysisType: string; timeframe: string; style: string;
  }) => {
    if (genLoading) return;
    setGenLoading(true);
    setAiStatus('Processing...');
    setGenOutput(null);

    try {
      const typeLabel = ANALYSIS_TYPES[params.analysisType] || params.analysisType;
      const tfLabel = TIMEFRAMES[params.timeframe] || params.timeframe;
      const styleLabel = STYLES[params.style] || params.style;

      const prompt = `You are an expert market analyst and investment advisor for the "Rouaa" platform. Analyze ${params.pair} — Analysis type: ${typeLabel} — Timeframe: ${tfLabel} — Style: ${styleLabel}.

Provide a professional analysis following this exact structure:

[1] Current Situation Summary
Two sentences summarizing the current situation for ${params.pair} and why it matters to traders right now.

[2] Key Levels
Identify major support and resistance levels with prices. State whether they are strong or weak.

[3] Expected Trend
Identify the prevailing trend (bullish/bearish/sideways) with technical or fundamental justification.

[4] Potential Entry and Exit Points
Bullish scenario: Entry condition + Price + Stop Loss + Target
Bearish scenario: Entry condition + Price + Stop Loss + Target

[5] Risk Management
Recommended risk-to-reward ratio. Suggested position size. Emergency exit triggers.

[6] Final Recommendation
One sharp sentence summarizing the investment position.

Rules:
- Do not use Markdown (no ** no ## no *)
- Do not repeat ideas
- Do not invent numbers — if insufficient data is available, state that explicitly
- Tone: direct, technical, emotionally neutral
- Write in professional English
- Start each section with [N] as in the structure above`;

      const res = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });

      const data = await res.json();
      if (data.response) {
        setGenOutput(data.response);
        setGenTimestamp(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        setAiStatus('Complete ✓');
      } else {
        setGenOutput('Sorry, an error occurred during generation. Please try again.');
        setAiStatus('Error');
      }
    } catch {
      setGenOutput('Sorry, could not connect to the server.');
      setAiStatus('Error');
    } finally {
      setGenLoading(false);
    }
  }, [genLoading]);

  // ── Tab Content Renderer ──
  const renderTabContent = () => {
    switch (activeTab) {
      case 'ai':
        return (
          <>
            <AIGeneratorPanel
              onGenerate={handleGenerate}
              loading={genLoading}
              output={genOutput}
              timestamp={genTimestamp}
              aiStatus={aiStatus}
              locale="en"
            />
            <ChartPanel chartPair={chartPair} onPairChange={setChartPair} locale="en" />
          </>
        );
      case 'markets':
        return (
          <>
            <ChartPanel chartPair={chartPair} onPairChange={setChartPair} locale="en" />
            <MarketAnalysesSection analyses={marketAnalyses} loading={analysesLoading} locale="en" />
          </>
        );
      case 'news':
        return (
          <NewsAnalysisSection news={newsWithAnalysis} loading={newsLoading} locale="en" />
        );
      case 'analysts':
        return (
          <ContentAgentSection analyses={contentAnalyses} loading={contentLoading} locale="en" />
        );
      default:
        return null;
    }
  };

  return (
    <main className={s.pageRoot} dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className={s.pageContainer}>

        {/* ═══ TERMINAL HEADER ═══ */}
        <div className={s.terminalHeader}>
          <div className={s.terminalHeaderLeft}>
            <div className={s.terminalLogo}>
              <svg className={s.terminalLogoSvg} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div className={s.terminalTitleGroup}>
              <div className={s.terminalBadge}>
                <span className={s.terminalBadgeDot} />
                ANALYSIS ENGINE v2
              </div>
              <h1 className={s.terminalTitle}>Smart Analysis Center</h1>
              <p className={s.terminalSubtitle}>Instant AI analysis · Live data · Professional tools</p>
            </div>
          </div>
          <div className={s.terminalHeaderRight}>
            <a href="/en/advisor" className={s.advisorBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Chat with Rouaa AI Advisor
            </a>
            <button
              onClick={() => {
                const el = document.getElementById('ai-generator');
                if (el) { setActiveTab('ai'); setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100); }
              }}
              className={s.advisorBtnOutline}
            >
              ⚡ Generate Analysis
            </button>
          </div>
        </div>

        {/* ═══ STATS BAR ═══ */}
        <div className={s.statsBar}>
          <div className={s.statCard}>
            <div className={s.statIcon} style={{ background: 'rgba(123,94,167,0.12)' }}>📊</div>
            <div className={s.statContent}>
              <span className={s.statLabel}>Total Analyses</span>
              <span className={s.statValue}>{stats.totalAnalysis}</span>
            </div>
          </div>
          <div className={s.statCard}>
            <div className={s.statIcon} style={{ background: 'rgba(212,54,92,0.1)' }}>🔴</div>
            <div className={s.statContent}>
              <span className={s.statLabel}>High Impact</span>
              <span className={s.statValue}>{stats.highImpact}</span>
            </div>
          </div>
          <div className={s.statCard}>
            <div className={s.statIcon} style={{ background: 'rgba(0,153,107,0.1)' }}>📈</div>
            <div className={s.statContent}>
              <span className={s.statLabel}>Bullish</span>
              <span className={s.statValue} style={{ color: 'var(--bull)' }}>{stats.bullish}</span>
            </div>
          </div>
          <div className={s.statCard}>
            <div className={s.statIcon} style={{ background: 'rgba(212,54,92,0.1)' }}>📉</div>
            <div className={s.statContent}>
              <span className={s.statLabel}>Bearish</span>
              <span className={s.statValue} style={{ color: 'var(--bear)' }}>{stats.bearish}</span>
            </div>
          </div>
        </div>

        {/* ═══ TAB NAVIGATION ═══ */}
        <div className={s.tabBar}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${s.tabButton} ${activeTab === tab.id ? s.tabButtonActive : ''}`}
            >
              <span className={s.tabIcon}>{tab.icon}</span>
              {tab.label}
              {tab.id === 'markets' && marketAnalyses.length > 0 && (
                <span className={s.tabCount}>{marketAnalyses.length}</span>
              )}
              {tab.id === 'news' && newsWithAnalysis.length > 0 && (
                <span className={s.tabCount}>{newsWithAnalysis.length}</span>
              )}
              {tab.id === 'analysts' && contentAnalyses.length > 0 && (
                <span className={s.tabCount}>{contentAnalyses.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ═══ MAIN TERMINAL GRID ═══ */}
        <div className={s.terminalGrid}>

          {/* LEFT — Main Content Area */}
          <div className={s.mainContent}>
            <div className={s.tabContent} key={activeTab}>
              {renderTabContent()}
            </div>
          </div>

          {/* RIGHT — Sidebar */}
          <div className={s.sidebar}>
            <SentimentPanel sentimentData={sentimentData} newsWithAnalysis={newsWithAnalysis} locale="en" />
            <RiskCalculator locale="en" />
            <TradingQuotesPanel quotes={tradingQuotes} loading={tradingLoading} locale="en" />

            {/* ─── Chat with Rouaa AI Advisor CTA ─── */}
            <a href="/en/advisor" className={s.sidebarCta}>
              <div className={s.sidebarCtaIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                  <path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z" />
                </svg>
              </div>
              <div className={s.sidebarCtaContent}>
                <div className={s.sidebarCtaTitle}>Chat with Rouaa AI Advisor</div>
                <div className={s.sidebarCtaDesc}>Ask about any financial asset, get personalized recommendations</div>
              </div>
              <svg className={s.sidebarCtaArrow} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Back to top */}
      {showBackTop && (
        <button className={s.backToTop} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          ↑
        </button>
      )}
    </main>
  );
}

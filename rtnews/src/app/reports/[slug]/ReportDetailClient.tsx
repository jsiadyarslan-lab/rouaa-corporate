'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { stripMarkdownHeadings, truncateAtBoundary, fixMissingSpaces } from '@/lib/clean-markdown';
// V1052: Removed embedded AssistantChatWidget — was causing 500 errors on report pages
// The floating assistant (from layout.tsx) is still available globally
import ImpactMap, { extractCountriesFromText } from '@/components/reports/ImpactMap';
import EconomicCharts from '@/components/reports/EconomicCharts';
import ContextImage from '@/components/reports/ContextImage';
import KeyIndicatorsTable from '@/components/reports/KeyIndicatorsTable';
import EarningsDataCard from '@/components/reports/EarningsDataCard';
import RelatedReports from '@/components/reports/RelatedReports';
import GeopoliticalRisksWidget from '@/components/geopolitical/GeopoliticalRisksWidget';
import SubscribeForm from '@/components/rouaa/SubscribeForm';
import VideoPlayer from '@/components/video/VideoPlayer';
import {
  PriceChart,
  SentimentGauge,
  SectorPerformance,
  ConfidenceIndicator,
  MiniSparkline,
  HeatMapGrid,
} from '@/components/rouaa/charts';
import { SmartCouncilWidget, EconomicCalendarWidget, MostReadWidget } from '@/components/shared/SidebarWidgets';
import {
  InteractiveScenarioEngine,
  ReportScorecard,
  RecommendationTracker,
  AIAudioBrief,
  CrossReportIntelligence,
  CustomFearGreedIndex,
  PaperTradingSimulator,
  ContextAwareAITranslation,
  GlobalHeatmap,
  PersonalizedMorningBrief,
} from '@/components/reports/revolutionary';
import { translateSectorsToLocale } from '@/lib/locale';
import { SymbolLinkedText } from '@/components/news/SymbolLinkText';

interface Report { 
  id: string; title: string; slug: string; summary: string;
  content: string; reportType: string; scope: string;
  sectors: string[]; countries: string[];
  keyIndicators: Record<string, any>; marketImpact: string;
  confidenceScore: number; sourceUrls: string[];
  imageUrl?: string; publishedAt: string | Date | null; createdAt: string | Date;
}

interface RelatedReport {
  id: string; title: string; slug: string;
  reportType: string; marketImpact: string;
  confidenceScore: number; publishedAt: string | Date | null;
}

interface Props { report: Report; related: RelatedReport[]; }

const TYPE_LABELS: Record<string, string> = { strategic: 'استراتيجي', daily: 'يومي', weekly: 'أسبوعي', monthly: 'شهري', quarterly: 'ربع سنوي', special: 'خاص', analysis: 'تحليل', technical: 'فني', fundamental: 'أساسي', sentiment: 'مشاعر' };
const SCOPE_LABELS: Record<string, string> = { arabic: 'عربي', global: 'عالمي', regional: 'إقليمي', economy: 'اقتصادي', stocks: 'أسهم', commodities: 'سلع', forex: 'فوركس', crypto: 'عملات رقمية', bonds: 'سندات', energy: 'طاقة', realEstate: 'عقارات', banking: 'بنوك', strategic: 'استراتيجي', technicalAnalysis: 'تحليل فني', earnings: 'أرباح شركات', arabMarkets: 'أسواق عربية' };
const IMPACT_COLORS: Record<string, string> = { bullish: '#00996B', bearish: '#D4365C', neutral: '#D4930D' };
const IMPACT_LABELS: Record<string, string> = { bullish: 'صعودي', bearish: 'هبوطي', neutral: 'محايد' };

// V153→V201: Custom ReactMarkdown components for professional Arabic report rendering
const MARKDOWN_COMPONENTS: Record<string, React.ComponentType<any>> = {
  // V201: Suppress BOTH h1 AND h2 headings — the UI already renders section titles.
  // AI is instructed to use ONLY ### and below for sub-headings.
  // Any # or ## in output is a template artifact or AI mistake.
  h1: () => null,
  h2: () => null,
  h3: ({ children }: any) => (
    <h3 style={{ fontSize: '15px', fontWeight: 600, marginTop: '16px', marginBottom: '8px', color: 'var(--text-head)', lineHeight: '1.5' }}>{children}</h3>
  ),
  h4: ({ children }: any) => (
    <h4 style={{ fontSize: '14px', fontWeight: 600, marginTop: '12px', marginBottom: '6px', color: 'var(--text-head)' }}>{children}</h4>
  ),
  ul: ({ children }: any) => <ul style={{ listStyle: 'disc', paddingRight: '20px', margin: '8px 0' }}>{children}</ul>,
  ol: ({ children }: any) => <ol style={{ listStyle: 'decimal', paddingRight: '20px', margin: '8px 0' }}>{children}</ol>,
  li: ({ children }: any) => <li style={{ fontSize: '13px', lineHeight: '1.9', color: 'var(--text2)', marginBottom: '4px' }}>{children}</li>,
  table: ({ children }: any) => (
    <div style={{ overflowX: 'auto', margin: '12px 0', borderRadius: '8px', border: '1px solid rgba(128,128,128,0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>{children}</table>
    </div>
  ),
  thead: ({ children }: any) => <thead style={{ background: 'rgba(0,153,107,0.08)' }}>{children}</thead>,
  th: ({ children }: any) => (
    <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '11px', borderBottom: '2px solid rgba(0,153,107,0.2)', color: 'var(--text-head)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{children}</th>
  ),
  td: ({ children }: any) => (
    <td style={{ padding: '10px 14px', textAlign: 'right', borderBottom: '1px solid rgba(128,128,128,0.08)', color: 'var(--text2)', fontSize: '12px' }}>{children}</td>
  ),
  strong: ({ children }: any) => <strong style={{ fontWeight: 700, color: 'var(--text-head)' }}>{children}</strong>,
  // V1184: Wrap paragraph text with SymbolLinkedText for clickable stock/crypto links
  p: ({ children }: any) => {
    // Convert children to string if possible, then render with symbol links
    const text = typeof children === 'string' ? children :
      (Array.isArray(children) ? children.map((c: any) => typeof c === 'string' ? c : '').join('') : '');
    if (text && /[A-Z]{2,}|\[\[|\//.test(text)) {
      return <p style={{ margin: '8px 0', fontSize: '13px', lineHeight: '1.9', color: 'var(--text2)' }}>
        <SymbolLinkedText text={text} />
      </p>;
    }
    return <p style={{ margin: '8px 0', fontSize: '13px', lineHeight: '1.9', color: 'var(--text2)' }}>{children}</p>;
  },
  blockquote: ({ children }: any) => (
    <blockquote style={{ borderInlineStart: '3px solid var(--cyan)', paddingRight: '16px', margin: '12px 0', fontStyle: 'italic', color: 'var(--text3)', background: 'rgba(0,229,255,0.03)', padding: '12px 16px', borderRadius: '0 8px 8px 0' }}>{children}</blockquote>
  ),
  hr: () => <hr style={{ border: 'none', borderTop: '1px solid rgba(128,128,128,0.12)', margin: '20px 0' }} />,
};

// Extract stock symbol from report title or content
const extractSymbolFromReport = (title: string, sectors: string[]): string => {
  // Try to find a ticker symbol pattern (2-5 uppercase letters) in the title
  const tickerMatch = title.match(/\b([A-Z]{2,5})\b/);
  if (tickerMatch) return tickerMatch[1];

  // V310: Map Arabic company names to their ticker symbols
  const ARABIC_COMPANY_TO_SYMBOL: Record<string, string> = {
    'أوراكل': 'ORCL', 'إنفيديا': 'NVDA', 'آبل': 'AAPL', 'مايكروسوفت': 'MSFT',
    'أمازون': 'AMZN', 'جوجل': 'GOOGL', 'ألفابت': 'GOOGL', 'ميتا': 'META',
    'فيسبوك': 'META', 'تسلا': 'TSLA', 'وول مارت': 'WMT', 'بنك أمريكا': 'BAC',
    'جي بي مورغان': 'JPM', 'ماستركارد': 'MA', 'فيزا': 'V', 'بايدو': 'BIDU',
    'علي بابا': 'BABA', 'سامسونج': '005930.KS', 'توشيبا': '6502.T',
    'إنتل': 'INTC', 'إيه أم دي': 'AMD', 'برودكوم': 'AVGO', 'كوالكوم': 'QCOM',
    'نتفليكس': 'NFLX', 'ديزني': 'DIS', 'كوكا كولا': 'KO', 'بيبسي': 'PEP',
    'نайк': 'NKE', 'آبي ميدسين': 'ABMD', 'جونسون آند جونسون': 'JNJ',
    'فايزر': 'PFE', 'مودرنا': 'MRNA', 'بنك أوف أمريكا': 'BAC',
    'ولز فارجو': 'WFC', 'سيتي جروب': 'C', 'غولدمان ساكس': 'GS',
    'مورغان ستانلي': 'MS', 'شيفرون': 'CVX', 'إكسون موبيل': 'XOM',
    'شلم': 'SLB', 'هاليبرتون': 'HAL', 'بي بي': 'BP',
  };
  for (const [arabicName, symbol] of Object.entries(ARABIC_COMPANY_TO_SYMBOL)) {
    if (title.includes(arabicName)) return symbol;
  }

  // Check sectors for known company names
  const SECTOR_TO_SYMBOL: Record<string, string> = {
    'تقنية': 'AAPL', 'تكنولوجيا': 'AAPL', 'طاقة': 'XOM',
    'بنوك': 'JPM', 'أسهم': 'SPY',
  };
  for (const sector of sectors) {
    if (SECTOR_TO_SYMBOL[sector]) return SECTOR_TO_SYMBOL[sector];
  }
  return '';
};

const SECTOR_ICONS: Record<string, string> = {
  'طاقة': '⚡', 'نفط': '🛢️', 'غاز': '🔥', 'أوبك': '🛢️',
  'أسهم': '📈', 'عملات': '💱', 'فوركس': '💱', 'كريبتو': '₿', 'عملات رقمية': '₿',
  'ذهب': '🥇', 'سلع': '🏗️', 'عقارات': '🏢', 'إسكان': '🏠',
  'بنوك': '🏦', 'فائدة': '🏦', 'إسلامي': '🕌', 'مصارف': '🏦',
  'تقنية': '💻', 'تكنولوجيا': '💻', 'ذكاء اصطناعي': '🤖',
  'اقتصاد': '📊', 'تضخم': '📈', 'بطالة': '📉',
  'صحة': '🏥', 'أدوية': '💊', 'اتصالات': '📱',
  'زراعة': '🌾', 'تعليم': '🎓', 'نقل': '🚛',
  'سياحة': '✈️', 'ترفيه': '🎮', 'أمن': '🛡️',
  'تحليل فني': '📐', 'أرباح شركات': '💰', 'أسواق عربية': '🌍',
};

type ContentTab = 'overview' | 'indicators' | 'charts' | 'data';

// ─── Economic Video Section Component ─────────────────
// Generates a professional MP4 video from the report with one click
// Uses Python backend: edge-tts + Pillow + FFmpeg (100% free)
function EconomicVideoSection({ reportId, reportTitle }: { reportId: string; reportTitle: string }) {
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleGenerate = async () => {
    setStatus('generating');
    setErrorMsg('');
    setProgress(0);

    // Simulate progress (video takes 30-90 seconds)
    let p = 0;
    intervalRef.current = setInterval(() => {
      p = Math.min(p + Math.random() * 8, 90);
      setProgress(Math.round(p));
    }, 2000);

    try {
      const res = await fetch(`/api/economic-reports/${reportId}/generate-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (intervalRef.current) clearInterval(intervalRef.current);

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.videoUrl) {
          setVideoUrl(data.videoUrl);
          setStatus('done');
          setProgress(100);
        } else {
          setErrorMsg(data.error || 'فشل في توليد الفيديو');
          setStatus('error');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.error || 'حدث خطأ أثناء توليد الفيديو');
        setStatus('error');
      }
    } catch (err) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setErrorMsg('خدمة توليد الفيديو غير متاحة حالياً');
      setStatus('error');
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '12px', padding: '10px 14px',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(139,92,246,0.06) 100%)',
        borderRadius: '10px', border: '1px solid rgba(59,130,246,0.15)',
        flexWrap: 'wrap',
      }}>
        {/* Icon */}
        <div style={{
          width: '28px', height: '28px', borderRadius: '7px',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
        </div>

        {/* Title */}
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-head)' }}>
          تقرير فيديو
        </span>
        <span style={{
          fontSize: '9px', fontWeight: 700, padding: '2px 8px',
          borderRadius: '4px', background: 'rgba(59,130,246,0.1)',
          color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)',
        }}>
          AI
        </span>

        <div style={{ flex: 1 }} />

        {/* Generate Button */}
        {status === 'idle' && (
          <button
            onClick={handleGenerate}
            style={{
              fontSize: '10px', fontWeight: 700, padding: '6px 16px',
              borderRadius: '6px', cursor: 'pointer',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              color: '#fff', border: 'none',
              boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(59,130,246,0.3)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5,3 19,12 5,21" /></svg>
            إنشاء فيديو للتقرير
          </button>
        )}

        {/* Generating status */}
        {status === 'generating' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '16px', height: '16px', borderRadius: '50%',
              border: '2px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6',
              animation: 'spin 1s linear infinite',
            }} />
            <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 600 }}>
              جاري التوليد... {progress}%
            </span>
            <div style={{
              width: '80px', height: '4px', borderRadius: '2px',
              background: 'rgba(59,130,246,0.15)', overflow: 'hidden',
            }}>
              <div style={{
                width: `${progress}%`, height: '100%', borderRadius: '2px',
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        )}

        {/* Done — show video player */}
        {status === 'done' && videoUrl && (
          <div style={{ width: '100%', marginTop: '12px' }}>
            <video
              controls
              style={{
                width: '100%', maxHeight: '400px', borderRadius: '10px',
                background: '#0a1120',
              }}
              poster=""
            >
              <source src={videoUrl} type="video/mp4" />
              متصفحك لا يدعم تشغيل الفيديو
            </video>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px',
            }}>
              <a
                href={videoUrl}
                download
                style={{
                  fontSize: '10px', fontWeight: 600, padding: '4px 12px',
                  borderRadius: '5px', background: 'rgba(59,130,246,0.1)',
                  color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)',
                  textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                تحميل MP4
              </a>
              <button
                onClick={() => { setStatus('idle'); setVideoUrl(null); }}
                style={{
                  fontSize: '10px', padding: '4px 12px', borderRadius: '5px',
                  background: 'rgba(128,128,128,0.08)', border: '1px solid rgba(128,128,128,0.15)',
                  color: 'var(--text2)', cursor: 'pointer',
                }}
              >
                إنشاء نسخة جديدة
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', marginTop: '8px' }}>
            <span style={{ fontSize: '11px', color: '#ef4444' }}>{errorMsg}</span>
            <button
              onClick={handleGenerate}
              style={{
                fontSize: '10px', padding: '4px 12px', borderRadius: '5px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#ef4444', cursor: 'pointer', fontWeight: 600,
              }}
            >
              إعادة المحاولة
            </button>
          </div>
        )}
      </div>

      {/* CSS animation for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function ReportDetailClient({ report, related }: Props) {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Locale-aware sector translation for revolutionary components (Arabic always)
  const locale = 'ar' as const;
  const translateSectors = (sectors: string[]) => translateSectorsToLocale(sectors, locale);

  // Track view on page load (BUG 5 fix)
  useEffect(() => {
    fetch(`/api/reports/${report.id}/views`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportType: (report as any).isAnalysis ? 'market_analysis' : 'economic_report' }),
    }).catch(err => console.warn('[ReportDetail V156] Feedback tracking failed:', err instanceof Error ? err.message : err));
  }, [report.id]);

  const [activeTab, setActiveTab] = useState<ContentTab>('overview');
  const [shareCopied, setShareCopied] = useState(false);
  const [readAlsoReports, setReadAlsoReports] = useState<RelatedReport[]>([]);
  const [readAlsoLoading, setReadAlsoLoading] = useState(() => !!report.title);
  const [expandedScenarios, setExpandedScenarios] = useState<Set<number>>(new Set([0]));
  const [introExpanded, setIntroExpanded] = useState(false);

  // V210: stripMarkdownHeadings is now imported from @/lib/clean-markdown
  // It is THE single source of truth for #/## removal — replaces the old
  // local stripMarkdownHeadings callback.

  // V156: Compute a proper sentiment score based on market impact + confidence
  const computedSentiment = useMemo(() => {
    // Base score from market impact
    let base = 50;
    if (report.marketImpact === 'bullish') base = 72;
    else if (report.marketImpact === 'bearish') base = 28;
    // Adjust with confidence score — higher confidence pushes further in the direction
    const confidenceAdjust = (report.confidenceScore - 50) * 0.3;
    return Math.round(Math.max(0, Math.min(100, base + confidenceAdjust)));
  }, [report.marketImpact, report.confidenceScore]);

  // ═══ SAFE TEXT CLEANER ═══
  // V201: Comprehensive markdown cleanup — applies to ALL report types.
  // Removes raw #/##/### markers, decorative lines, prompt artifacts,
  // duplicate headings, AI comment leaks, and banned filler phrases.
  // Works for: strategic, daily, weekly, monthly, quarterly, special,
  // stocks, commodities, forex, crypto, bonds, energy, realEstate,
  // economy, banking, technicalAnalysis, arabMarkets, earnings
  const cleanJsonFromText = (text: string): string => {
    if (!text) return '';
    let cleaned = text;

    // ═══ PHASE 0: Fix missing spaces between Arabic/Latin/digit text ═══
    // V300: Handles concatenation like "تحليلصعوديAI" → "تحليل صعودي AI"
    cleaned = fixMissingSpaces(cleaned);

    // ═══ PHASE 0b: Split merged heading lines ═══
    // V300: Handles "## مقدمة التقرير ## الملخص التنفيذي" → separate lines
    cleaned = cleaned.replace(/(#{1,2}(?!#)\s*[\u0600-\u06FF\w][^\n#]*?)\s*(#{1,2}(?!#)\s*[\u0600-\u06FF])/g, '$1\n$2');

    // ═══ PHASE 1: Remove code block wrappers ═══
    cleaned = cleaned.replace(/```(?:json|markdown)?\s*/gi, '');
    cleaned = cleaned.replace(/^"\s*/, '');
    cleaned = cleaned.replace(/\s*"$/, '');
    cleaned = cleaned.replace(/^\s*"\s*$/gm, '');

    // ═══ PHASE 2: Remove ALL #/## level headings ═══
    // V210: Use the unified stripMarkdownHeadings from @/lib/clean-markdown
    cleaned = stripMarkdownHeadings(cleaned);

    // Remove ### headings that are prompt template artifacts
    // Keep ### headings that are real sub-sections (investor categories, scenario types)
    cleaned = cleaned.replace(/^###\s*(?:\d+[\.\s]*)?(?:القسم|تحذير|ملاحظة|تنبيه|هام|خطوة|تعليمات)\s*.*$/gm, '');

    // ═══ PHASE 3: Remove decorative lines and separators ═══
    cleaned = cleaned.replace(/^[━═─\-_=~•·]{3,}\s*$/gm, '');
    cleaned = cleaned.replace(/[═]{3,}/g, '');
    cleaned = cleaned.replace(/[━]{3,}/g, '');
    cleaned = cleaned.replace(/^---\s*$/gm, '');

    // ═══ PHASE 4: Remove ⚠️ prompt instruction lines ═══
    // V200: Two-pass approach — first remove known prompt keywords,
    // then remove remaining ⚠️ lines that look like instructions.
    // KEEP ⚠️ lines that look like genuine content warnings.
    cleaned = cleaned.replace(/^\s*⚠️\s+(مهم|ممنوع|قاعدة|إلزامي|تحذير صارم|قبل كتابة|مهم جداً|إذا وجدت|اختبار الجودة|لا تملأ|توقف بعد|ممنوع كتابة|ممنوع إضافة|التزم بالأقسام|كل شريحة|كل توصية|ليس إعادة|ممنوع النقاط|ممنوع الحشو|الحد الأقصى|ممنوع في هذا|ممنوع منعاً|V\d+|راقب|انتبه|تأكد|لا تنس|تذكر).*$/gm, '');
    // V200: Remove remaining ⚠️ lines that are clearly instructions (long lines with Arabic directives)
    // Short ⚠️ lines (like "⚠️ تنبيه") might be content, so keep those
    cleaned = cleaned.replace(/^\s*⚠️\s+(?:.{40,})$/gm, '');

    // ═══ PHASE 5: Remove prompt instruction artifacts ═══
    cleaned = cleaned.replace(/^قرارات عملية مباشرة\s*[-—:]?\s*ماذا تفعل الآن\??\s*$/gm, '');
    cleaned = cleaned.replace(/^تحليل أكاديمي موضوعي\s*[-—:]?\s*ماذا تقول البيانات\??\s*$/gm, '');
    cleaned = cleaned.replace(/^صوت الكتابة:.*$/gm, '');
    cleaned = cleaned.replace(/^القارئ يريد.*$/gm, '');
    cleaned = cleaned.replace(/^تنسيق العناوين:.*$/gm, '');
    cleaned = cleaned.replace(/^قواعد التنسيق:.*$/gm, '');
    cleaned = cleaned.replace(/^تحذير:\s*(هذا تقرير|هذه توصيات|هذا التحليل).*$/gm, '');

    // ═══ PHASE 6: Remove leading headings before content starts ═══
    const lines = cleaned.split('\n');
    let contentStarted = false;
    const filteredLines: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!contentStarted) {
        if (trimmed.length === 0) continue; // skip leading blank lines
        if (/^#{1,4}\s*/.test(trimmed) && trimmed.replace(/[#\s\d.]/g, '').length < 5) continue; // skip leading headings
        contentStarted = true;
      }
      filteredLines.push(line);
    }
    cleaned = filteredLines.join('\n');

    // ═══ PHASE 7: Remove banned filler phrases ═══
    const bannedPhrases = [
      /يعد هذا العامل من أبرز المحركات المؤثرة على السوق حالياً[،.]?/g,
      /يؤثر بشكل مباشر على قرارات المستثمرين وتحركات رؤوس الأموال[،.]?/g,
      /من أبرز العوامل المؤثرة على السوق في الوقت الراهن[،.]?/g,
      /يعد من أهم العوامل التي تؤثر على توجهات السوق[،.]?/g,
      /في هذا السياق[،.]?/g,
      /هذا الإنجاز يعتبر إنجازاً كبيراً[،.]?/g,
      /من المتوقع أن يؤثر هذا الإنجاز[،.]?/g,
      /راقب التطورات[،.]?/g,
      /انتبه للتقلبات[،.]?/g,
      /تجدر الإشارة إلى أن[،.]?/g,
      /كما هو معروف[،.]?/g,
    ];
    for (const pattern of bannedPhrases) {
      cleaned = cleaned.replace(pattern, '');
    }

    // ═══ PHASE 8: Remove AI internal comment leaks ═══
    cleaned = cleaned.replace(/^\s*ملاحظة[\s:]*(للمراجع|للناشر|للقارئ|للمحرر|للمدقق)?[\s:]*.*$/gm, '');
    cleaned = cleaned.replace(/^\s*كما هو مطلوب.*$/gm, '');
    cleaned = cleaned.replace(/^\s*بناءً?\s+على\s+التعليمات.*$/gm, '');
    cleaned = cleaned.replace(/^\s*سأقوم\s+ب.*$/gm, '');
    cleaned = cleaned.replace(/^\s*الآن\s+سأكتب.*$/gm, '');
    cleaned = cleaned.replace(/^\s*الآن\s+أكمل.*$/gm, '');
    cleaned = cleaned.replace(/\[ملاحظة[^\]]*\]/g, '');
    cleaned = cleaned.replace(/\(ملاحظة[^)]*\)/g, '');

    // ═══ PHASE 9: Remove remaining artifacts ═══
    cleaned = cleaned.replace(/^(\d+)\s*$/gm, '');          // Orphaned numbers
    cleaned = cleaned.replace(/^\d+[\.\s]*$/gm, '');      // Orphaned section numbers
    cleaned = cleaned.replace(/^>\s*$/gm, '');              // Empty blockquotes
    cleaned = cleaned.replace(/^[-*]\s*$/gm, '');           // Empty list markers
    cleaned = cleaned.replace(/خوف شديد\s*خوف\s*محايد\s*جشع\s*جشع شديد/g, ''); // Raw sentiment text
    cleaned = cleaned.replace(/\*\*\s*\*\*/g, '');           // Empty bold markers
    cleaned = cleaned.replace(/__\s*__/g, '');               // Empty underline markers

    // ═══ PHASE 10: Final cleanup ═══
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    return cleaned.trim();
  };

  // V201: Strip ALL markdown headings from section content.
  // The UI already renders section titles, so ANY # or ## heading is redundant.
  // Also strips ### headings that duplicate the section title.
  // V201: Ultra-aggressive — catches RTL marks, leading whitespace, no-space patterns.
  const stripDuplicateHeading = (content: string, sectionTitle: string): string => {
    if (!content) return content;
    const normalizedTitle = sectionTitle ? sectionTitle.replace(/[_*]/g, '').trim() : '';
    const lines = content.split('\n');
    const filtered = lines.filter(line => {
      const trimmed = line.trim();
      // V201: Remove # level headings — ultra-aggressive (any # with content, but not ###)
      if (/^\s*[\u200F\u200E]*#(?!#)\s*.+/.test(trimmed)) return false;
      // V201: Remove ## level headings — ultra-aggressive (any ## with content, but not ###)
      if (/^\s*[\u200F\u200E]*##(?!#)\s*.+/.test(trimmed)) return false;
      // Remove orphaned # markers
      if (/^\s*[\u200F\u200E]*#{1,6}\s*$/.test(trimmed)) return false;
      // Remove ### headings that duplicate the section title
      const headingMatch = trimmed.match(/^###\s*(?:\d+[\.\s]*)?(.+)$/);
      if (headingMatch && normalizedTitle.length >= 3) {
        const headingText = headingMatch[1].replace(/[_*]/g, '').trim();
        if (headingText === normalizedTitle ||
            headingText.includes(normalizedTitle) ||
            normalizedTitle.includes(headingText)) {
          return false;
        }
      }
      return true;
    });
    return filtered.join('\n').trim();
  };

  // ═══ PARSE CONTENT ═══
  // V104: For strategic reports, strip hallucinated "التحليل المفصل" section from raw Markdown
  // before parsing. This section comes from the old report template and contains generic
  // content (central banks, inflation, international trade) unrelated to the strategic topic.
  let rawContent = report.content;
  const isStrategicReportType = report.reportType === 'strategic';
  if (isStrategicReportType && rawContent) {
    // Remove "## التحليل المفصل" section and its content until the next ## heading
    rawContent = rawContent.replace(/^##\s*التحليل المفصل\s*\n[\s\S]*?(?=\n##\s|\n---\s*$|$)/im, '');
    // Also remove any "التحليل المفصل" as a subsection (### level)
    rawContent = rawContent.replace(/^###?\s*التحليل المفصل\s*\n[\s\S]*?(?=\n##\s|\n###?\s|\n---\s*$|$)/im, '');
  }
  let contentData: any = {};
  try { contentData = JSON.parse(rawContent); }
  catch { contentData = { overview: rawContent }; }

  const sections = contentData.sections || {};
  const metadata = contentData.metadata || {};
  const dataQuality = contentData.dataQuality || {};

  const cleanSection = (val: any): string => typeof val === 'string' ? cleanJsonFromText(val) : '';
  const rawOverview = cleanSection(sections.executiveSummary || sections.weeklyOverview || sections.economicOverview 
    || sections.quarterlyOverview || sections.eventAnalysis || sections.overview 
    || (sections.rawContent ? truncateAtBoundary(sections.rawContent, 500) : ''));
  const rawIntroduction = cleanSection(sections.introduction);

  // V167: Smart dedup between introduction and overview
  // If both exist, check if one is a subset of the other. If so, only keep the longer one.
  // This prevents showing "مقدمة التقرير" and "الملخص التنفيذي" with the same content.
  let displayIntroduction = rawIntroduction;
  let displayOverview = rawOverview;

  if (rawIntroduction && rawOverview) {
    // Normalize for comparison: strip markdown, whitespace, and compare
    const normalizeForCompare = (s: string) => s.replace(/[#*_\-\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
    const introNorm = normalizeForCompare(rawIntroduction);
    const overviewNorm = normalizeForCompare(rawOverview);
    
    // Check if one is a prefix/substring of the other (>=70% overlap)
    const introStart = introNorm.slice(0, 80);
    const overviewStart = overviewNorm.slice(0, 80);
    const isDuplicate = introStart === overviewStart 
      || overviewNorm.includes(introNorm.slice(0, 60))
      || introNorm.includes(overviewNorm.slice(0, 60));
    
    if (isDuplicate) {
      // Keep the longer one as overview, discard the shorter
      if (rawIntroduction.length > rawOverview.length) {
        displayOverview = rawIntroduction;
        displayIntroduction = '';
      } else {
        displayIntroduction = '';
      }
    }
  }

  const overview = displayOverview;
  // V167: Max chars for introduction before "show more" toggle
  const INTRO_MAX_CHARS = 600;

  // V154: Extract report text for visual components (map, charts, indicators)
  // MUST be after cleanJsonFromText/cleanSection/overview are defined
  const fullReportText = useMemo(() => {
    const parts: string[] = [];
    if (overview) parts.push(overview);
    if (displayIntroduction) parts.push(displayIntroduction);
    for (const [, value] of Object.entries(sections)) {
      if (typeof value === 'string' && value.trim().length > 20) parts.push(cleanJsonFromText(value));
    }
    return parts.join('\n\n');
  }, [overview, displayIntroduction, sections]);

  // V154: Extract countries from report text for the impact map
  const mapCountries = useMemo(() => extractCountriesFromText(fullReportText), [fullReportText]);

  // Parse highlights - may be stored as JSON string or array
  const rawHighlights = sections.highlights || sections.keyPoints || sections.mainFindings || [];
  const highlights: string[] = (() => {
    if (Array.isArray(rawHighlights)) return rawHighlights;
    if (typeof rawHighlights === 'string') {
      try {
        const parsed = JSON.parse(rawHighlights);
        return Array.isArray(parsed) ? parsed : [rawHighlights];
      } catch {
        return [rawHighlights];
      }
    }
    return [];
  })();

  // ═══ KEY TAKEAWAYS — extract bullet points from content ═══
  const keyTakeaways = useMemo(() => {
    const sourceText = overview || displayIntroduction || report.summary || '';
    if (!sourceText) return [];
    const lines = sourceText.split('\n');
    const bulletLines: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^[-•*]\s+/.test(trimmed)) {
        bulletLines.push(trimmed.replace(/^[-•*]\s+/, ''));
      }
    }
    // If no bullet points found, try to extract from highlights
    if (bulletLines.length === 0 && highlights.length > 0) {
      return highlights.slice(0, 5);
    }
    return bulletLines.slice(0, 5);
  }, [overview, displayIntroduction, report.summary, highlights]);

  // V153: Parse scenario sections for accordion rendering
  const parseScenarios = useCallback((content: string): { title: string; probability: number; content: string; emoji: string; color: string }[] => {
    const scenarios: { title: string; probability: number; content: string; emoji: string; color: string }[] = [];
    
    // Try splitting by ### sub-headings first
    const parts = content.split(/^(###\s+)/m);
    
    if (parts.length > 2) {
      for (let i = 1; i < parts.length; i += 2) {
        const heading = parts[i].replace('###', '').trim();
        const body = (parts[i + 1] || '').trim();
        if (!heading) continue;
        
        const probMatch = body.match(/(?:احتمالية|احتمال)\s*[:\-]?\s*(\d+)\s*%?/) || body.match(/(\d+)\s*%\s*(?:احتمال|احتمالية)/);
        const probability = probMatch ? Math.min(100, Math.max(0, parseInt(probMatch[1]))) : 50;
        
        let emoji = '📊', color = '#D4930D';
        if (/متفائل|صاعد|إيجابي|الصعودي/i.test(heading)) { emoji = '📈'; color = '#00996B'; }
        else if (/متشائم|هابط|سلبي|الهبوطي/i.test(heading)) { emoji = '📉'; color = '#D4365C'; }
        else if (/محايد|عرضي|العرضي/i.test(heading)) { emoji = '➡️'; color = '#D4930D'; }
        else if (/قصير/i.test(heading)) { emoji = '⚡'; color = '#00996B'; }
        else if (/متوسط/i.test(heading)) { emoji = '📊'; color = '#D4930D'; }
        else if (/طويل/i.test(heading)) { emoji = '🔭'; color = '#7C3AED'; }
        
        scenarios.push({ title: heading, probability, content: body, emoji, color });
      }
    } else {
      // No sub-headings — try splitting by scenario keywords
      const blocks = content.split(/(?=سيناريو\s+(?:قصير|متوسط|طويل|متفائل|محايد|متشائم|صاعد|عرضي|هابط|صعودي))/i);
      if (blocks.length > 1) {
        for (const block of blocks) {
          if (!block.trim()) continue;
          const firstLine = block.split('\n')[0].trim();
          const titleMatch = firstLine.match(/سيناريو[\s\u0600-\u06FF\-\d()]+/);
          const title = titleMatch ? titleMatch[0].trim() : firstLine.slice(0, 60);
          
          const probMatch = block.match(/(?:احتمالية|احتمال)\s*[:\-]?\s*(\d+)\s*%?/) || block.match(/(\d+)\s*%\s*(?:احتمال|احتمالية)/);
          const probability = probMatch ? Math.min(100, Math.max(0, parseInt(probMatch[1]))) : 50;
          
          let emoji = '📊', color = '#D4930D';
          if (/متفائل|صاعد|إيجابي|الصعودي/i.test(title)) { emoji = '📈'; color = '#00996B'; }
          else if (/متشائم|هابط|سلبي|الهبوطي/i.test(title)) { emoji = '📉'; color = '#D4365C'; }
          else if (/محايد|عرضي|العرضي/i.test(title)) { emoji = '➡️'; color = '#D4930D'; }
          else if (/قصير/i.test(title)) { emoji = '⚡'; color = '#00996B'; }
          else if (/متوسط/i.test(title)) { emoji = '📊'; color = '#D4930D'; }
          else if (/طويل/i.test(title)) { emoji = '🔭'; color = '#7C3AED'; }
          
          scenarios.push({ title, probability, content: block.trim(), emoji, color });
        }
      }
    }
    
    return scenarios;
  }, []);

  // Add more section title mappings for MarketAnalysis content
  const detailedSections: { title: string; content: string }[] = [];
  
  const SECTION_TITLES: Record<string, string> = {
    introduction: 'مقدمة التقرير',
    rouaRecommendations: 'توصيات رؤى',
    rouaaRecommendations: 'توصيات رؤى',
    executiveSummary: 'الملخص التنفيذي', keyMovers: 'المحركات الرئيسية',
    todayCalendar: 'أحداث اليوم وأخبار الشركات', direction: 'الاتجاه',
    whatWeWatching: 'ما نراقبه', confidenceAssessment: 'تقييم الثقة',
    marketPulse: 'نبض السوق', tomorrowOutlook: 'نظرة الغد',
    weeklyOverview: 'نظرة أسبوعية شاملة', sectorPerformance: 'أداء القطاعات',
    sentimentAnalysis: 'تحليل المشاعر السوقية', technicalOutlook: 'النظرة الفنية',
    strategicRecommendations: 'التوصيات الاستراتيجية', eventCalendar: 'تقويم الأحداث',
    economicOverview: 'نظرة عامة اقتصادية', monetaryPolicy: 'السياسة النقدية',
    commodities: 'السلع والطاقة', regionalFocus: 'التركيز الإقليمي',
    riskAssessment: 'تقييم المخاطر', monthlyForecast: 'التوقعات الشهرية',
    quarterlyOverview: 'نظرة ربع سنوية', macroAnalysis: 'تحليل اقتصادي كلي',
    sectorDeepDive: 'تعمق قطاعي', policyReview: 'مراجعة السياسات',
    riskFactors: 'عوامل الخطر', nextQuarterForecast: 'توقعات الربع القادم',
    eventAnalysis: 'تحليل الحدث', marketImpact: 'التأثير على السوق',
    historicalContext: 'السياق التاريخي', expertOpinions: 'آراء الخبراء', outlook: 'التوقعات',
    // New asset class analysis sections
    oilAnalysis: 'تحليل النفط', gasAnalysis: 'تحليل الغاز',
    renewableEnergy: 'الطاقة المتجددة', opecImpact: 'تأثير أوبك',
    residentialMarket: 'السوق السكني', commercialMarket: 'السوق التجاري',
    reitsPerformance: 'أداء صناديق العقارات', regionalMarkets: 'الأسواق الإقليمية',
    gdpAnalysis: 'تحليل الناتج المحلي', inflationOutlook: 'توقعات التضخم',
    tradeBalance: 'الميزان التجاري', arabEconomies: 'الاقتصادات العربية',
    bankEarnings: 'أرباح البنوك', interestRateImpact: 'تأثير أسعار الفائدة',
    islamicBanking: 'البنوك الإسلامية', arabBanks: 'البنوك العربية',
    // MarketAnalysis-specific sections
    overview: 'نظرة عامة', detailedAnalysis: 'التحليل المفصل', keyFindings: 'النتائج الرئيسية',
    fundamentalAnalysis: 'التحليل الأساسي',
    // Forex-specific sections
    currencyPairsAnalysis: 'تحليل أزواج العملات', supplyDemandAnalysis: 'تحليل العرض والطلب',
    btcDominance: 'هيمنة البيتكوين', creditSpreads: 'فروقات الائتمان',
    yieldCurveAnalysis: 'تحليل منحنى العائد',
    // V105: Strategic report sections (from new structured JSON format)
    context: 'السياق والخلفية',
    economicImpact: 'التداعيات الاقتصادية المباشرة',
    scenarios: 'السيناريوهات',
    affectedAssets: 'أصول تستفيد وأصول تتضرر',
    followUpIndicators: 'مؤشرات المتابعة',
    // V210: Commodities-specific sections
    goldAnalysis: 'تحليل الذهب والمعادن النفيسة',
    industrialMetals: 'تحليل المعادن الصناعية',
    agriculturalCommodities: 'تحليل السلع الزراعية',
    supplyDemand: 'العرض والطلب العالمي',
    dollarImpact: 'تأثير الدولار على السلع',
    commoditiesEnergy: 'السلع والطاقة',
    // V411: Arab Markets report sections
    saudiMarket: 'السوق السعودي — تداول',
    dubaiMarket: 'سوق دبي المالي',
    abuDhabiMarket: 'سوق أبوظبي',
    egyptKuwaitMarkets: 'الأسواق المصرية والكويتية',
    regionalGlobalImpact: 'التأثير الإقليمي والعالمي',
    ipoActivity: 'الطروحات الأولية',
  };
  
  // V100→V104: For strategic reports, skip the hallucinated "detailedAnalysis" section
  // that comes from the old template and contains generic content unrelated to the topic.
  // V104: Also skip any other sections that are NOT in the 8-section strategic template.
  const isStrategicReport = report.reportType === 'strategic';
  const skipSectionKeys = new Set([
    'rawContent', 'highlights', 'keyPoints', 'mainFindings',
    // V144: Skip fallback sectionN keys that contain fragmented roua recommendations
    // These appear when the parser can't match a ## heading to a known section name
    // and creates generic keys like section3, section4, etc.
    ...Array.from({length: 20}, (_, i) => `section${i + 1}`),
    ...(isStrategicReport ? [
      'detailedAnalysis',           // "التحليل المفصل" — old template hallucination
      'introduction',               // Strategic reports have their own "السياق والخلفية"
      'eventAnalysis',              // Not a strategic section
      'marketPulse',                // Daily report section, not strategic
      'todayCalendar',              // Daily-specific
      'tomorrowOutlook',            // Daily-specific
      'direction',                  // Daily-specific (V158)
      'whatWeWatching',             // Daily-specific (V158)
      'confidenceAssessment',       // Daily-specific (V158)
      'sectorPerformance',          // Weekly-specific
      'sentimentAnalysis',          // Analysis-specific
      'technicalOutlook',           // Analysis-specific
      'eventCalendar',              // Calendar-specific
    ] : []),
  ]);

  const overviewKeys = ['introduction', 'executiveSummary', 'weeklyOverview', 'economicOverview', 'quarterlyOverview', 'eventAnalysis', 'overview', 'context'];
  // V160→V211: Keys for sections already rendered as UI components — skip to avoid duplicates.
  // V211: Recommendation keys (strategicRecommendations, rouaRecommendations, rouaaRecommendations)
  // are now rendered as investor-category cards for ALL report types, not just strategic.
  // This means commodities, forex, stocks, etc. all get structured recommendation cards
  // with execution prices (entry, stop-loss, target).
  const uiRenderedKeys = new Set([
    'confidenceAssessment',  // Rendered as V160 confidence card
    'sentimentGauge',        // Rendered as V156 gradient bar
    'affectedAssets',        // V225: Rendered as colored gainers/losers cards
    'strategicRecommendations', // V211: Rendered as investor-category recommendations (all types)
    'rouaaRecommendations',     // V211: Rendered as investor-category recommendations (all types)
    'rouaRecommendations',      // V211: Rendered as investor-category recommendations (all types)
  ]);
  for (const [key, value] of Object.entries(sections)) {
    if (skipSectionKeys.has(key)) continue;
    if (overviewKeys.includes(key)) continue;
    if (uiRenderedKeys.has(key)) continue; // V160: Skip UI-rendered sections
    if (typeof value === 'string' && value.trim().length > 20) {
      let cleanedValue = cleanJsonFromText(value);
      // V160: Skip sections that are just raw sentiment gauge text (already rendered as V156 bar)
      // The AI sometimes generates this with keys like 'sentimentGauge', 'sentiment', etc.
      const isRawSentimentGauge = /^مقياس المشاعر السوقية/i.test(cleanedValue.trim()) &&
        cleanedValue.replace(/[#*\->\s\nخوفشديدجشعمحايدر°٪%0-9.]+/g, '').trim().length < 30;
      if (isRawSentimentGauge) continue;
      // V160: Remove raw sentiment gauge text within content
      cleanedValue = cleanedValue.replace(/خوف شديد\s*خوف\s*محايد\s*جشع\s*جشع شديد/g, '');
      // V160: Also skip sections whose title is just "مقياس المشاعر السوقية" with no real analysis
      let sectionTitle = SECTION_TITLES[key];
      if (!sectionTitle) {
        const firstLine = cleanedValue.split('\n')[0].trim();
        if (firstLine.length > 2 && firstLine.length < 80 && !/^[a-zA-Z0-9_]+$/.test(firstLine)) {
          sectionTitle = firstLine.replace(/^[#\s]+/, '');
        }
      }
      // V160: Skip if section title is "مقياس المشاعر السوقية" — rendered by V156 bar
      if (sectionTitle && /^مقياس المشاعر السوقية$/.test(sectionTitle.trim())) continue;
      // V160: Skip if section title is "تقييم الثقة" — rendered by V160 card
      if (sectionTitle && /^تقييم الثقة$/.test(sectionTitle.trim())) continue;
      if (cleanedValue.trim().length > 20) {
        // V84: Never show raw "section8" style keys to the user
        let finalTitle = SECTION_TITLES[key];
        if (!finalTitle) {
          // Try to extract the Arabic title from the content's first line
          const firstLine = cleanedValue.split('\n')[0].trim();
          if (firstLine.length > 2 && firstLine.length < 80 && !/^[a-zA-Z0-9_]+$/.test(firstLine)) {
            finalTitle = firstLine.replace(/^[#\s]+/, '');
          } else if (/^section[_\d]+$/i.test(key)) {
            // Skip showing generic section keys — extract from the content's ## header if present
            const headerMatch = cleanedValue.match(/^##\s+(.+)$/m);
            finalTitle = headerMatch ? headerMatch[1].trim() : '';
            if (!finalTitle) continue; // Don't show sections with no meaningful title
          } else {
            finalTitle = key;
          }
        }
        // V201: Skip sections with garbled/corrupted titles (mostly dots, symbols, no Arabic letters)
        // A valid Arabic title should contain at least 2 Arabic characters
        const arabicCharCount = (finalTitle.match(/[\u0600-\u06FF]/g) || []).length;
        if (arabicCharCount < 2) {
          // Title is mostly symbols/dots/numbers — skip this section
          continue;
        }
        // V160: Strip duplicate heading from content (AI generates ## heading that UI already shows)
        const dedupedContent = stripDuplicateHeading(cleanedValue, finalTitle);
        detailedSections.push({ title: finalTitle, content: dedupedContent });
      }
    }
  }

  if (detailedSections.length === 0 && sections.rawContent) {
    const raw = sections.rawContent;
    const headerParts = raw.split(/^##\s+/m);
    if (headerParts.length > 1) {
      for (let i = 1; i < headerParts.length; i++) {
        const part = headerParts[i].trim();
        if (!part) continue;
        const lines = part.split('\n');
        const title = lines[0].trim();
        const content = lines.slice(1).join('\n').trim();
        // V201: Skip sections with garbled/corrupted titles (no meaningful Arabic)
        const titleArabicCount = (title.match(/[\u0600-\u06FF]/g) || []).length;
        if (titleArabicCount < 2) continue;
        if (content) detailedSections.push({ title: title || `القسم ${i}`, content });
      }
    } else {
      const paragraphs = raw.split(/\n\n+/).filter((p: string) => p.trim().length > 20);
      paragraphs.forEach((p: string, i: number) => {
        const lines = p.split('\n');
        const firstLine = lines[0].trim();
        if (firstLine.length < 50 && (firstLine.endsWith(':') || firstLine.startsWith('**'))) {
          detailedSections.push({ title: firstLine.replace(/\*\*/g, '').replace(/:$/, ''), content: lines.slice(1).join('\n').trim() });
        } else {
          detailedSections.push({ title: i === 0 ? 'نظرة عامة' : `القسم ${i + 1}`, content: p });
        }
      });
    }
  }

  if (detailedSections.length === 0 && !overview && report.summary) {
    detailedSections.push({ title: 'ملخص التقرير', content: report.summary });
  }

  const categories = sections.categories || [];

  // ═══ ENRICHED KEY INDICATORS ═══
  const keyIndicatorsList = useMemo(() => {
    if (!report.keyIndicators || Object.keys(report.keyIndicators).length === 0) {
      const fallback: { name: string; value: number; change: number }[] = [];
      if (report.confidenceScore) {
        fallback.push({ name: 'مستوى الثقة', value: report.confidenceScore, change: 0 });
      }
      if (report.marketImpact) {
        const impactValue = report.marketImpact === 'bullish' ? 65 : report.marketImpact === 'bearish' ? 30 : 50;
        fallback.push({ name: 'مؤشر المشاعر', value: impactValue, change: 0 });
      }
      return fallback;
    }
    const indicators = report.keyIndicators.indicators || [];
    if (Array.isArray(indicators) && indicators.length > 0) return indicators;
    const result = Object.entries(report.keyIndicators)
      .filter(([key, value]) => key !== 'priceHistory' && key !== 'indicators' && typeof value === 'number')
      .map(([key, value]) => ({ name: key, value, change: 0 }));
    if (result.length === 0) {
      if (report.confidenceScore) result.push({ name: 'مستوى الثقة', value: report.confidenceScore, change: 0 });
      const impactValue = report.marketImpact === 'bullish' ? 65 : report.marketImpact === 'bearish' ? 30 : 50;
      result.push({ name: 'مؤشر المشاعر', value: impactValue, change: 0 });
    }
    return result;
  }, [report.keyIndicators, report.confidenceScore, report.marketImpact]);

  // ═══ CHART DATA ═══
  const priceChartData = useMemo(() => {
    if (report.keyIndicators?.priceHistory && Array.isArray(report.keyIndicators.priceHistory)) return report.keyIndicators.priceHistory;
    const numericKeys = Object.entries(report.keyIndicators || {}).filter(([, v]) => typeof v === 'number' && !isNaN(v)).slice(0, 1);
    if (numericKeys.length === 0) {
      const baseValue = report.confidenceScore || 50;
      const now = new Date();
      const data = [];
      for (let i = 90; i >= 0; i -= 3) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        const variation = baseValue * (0.92 + Math.random() * 0.16);
        data.push({ date: d.toISOString().split('T')[0], value: Math.round(variation * 100) / 100 });
      }
      return data;
    }
    const baseValue = numericKeys[0][1] as number;
    const now = new Date();
    const data = [];
    for (let i = 90; i >= 0; i -= 3) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const variation = baseValue * (0.95 + Math.random() * 0.1);
      data.push({ date: d.toISOString().split('T')[0], value: Math.round(variation * 100) / 100 });
    }
    return data;
  }, [report.keyIndicators, report.confidenceScore]);

  const sectorPerformanceData = useMemo(() => {
    if (categories.length > 0) return categories.map((c: any) => ({ sector: c.name || c.category || '', change: c.sentiment ? (c.sentiment - 50) * 0.5 : 0, label: c.name || c.category || '' }));
    if (report.sectors?.length > 0) return report.sectors.map((s: string) => ({ sector: s, change: (Math.random() - 0.4) * 8, label: s }));
    const scopeSectors: Record<string, { name: string; base: number }[]> = {
      global: [
        { name: 'أسهم أمريكية', base: 1.2 }, { name: 'أسهم أوروبية', base: -0.3 },
        { name: 'أسهم آسيوية', base: 0.8 }, { name: 'سلع', base: 1.5 },
        { name: 'عملات رقمية', base: -1.2 }, { name: 'سندات', base: 0.1 },
      ],
      economy: [
        { name: 'نمو اقتصادي', base: 0.5 }, { name: 'تضخم', base: -0.8 },
        { name: 'أسعار فائدة', base: 0.3 }, { name: 'تجارة', base: -0.2 },
        { name: 'توظيف', base: 0.6 }, { name: 'طاقة', base: 1.1 },
      ],
      arabic: [
        { name: 'السعودية', base: 0.9 }, { name: 'الإمارات', base: 1.1 },
        { name: 'مصر', base: -0.4 }, { name: 'قطر', base: 0.7 },
        { name: 'البحرين', base: 0.3 }, { name: 'الكويت', base: 0.5 },
      ],
    };
    const scopeKey = report.scope || 'global';
    const sectorList = scopeSectors[scopeKey] || scopeSectors.global;
    return sectorList.map(s => ({ sector: s.name, change: s.base + (Math.random() - 0.5) * 2, label: s.name }));
  }, [categories, report.sectors, report.scope]);

  const heatmapData = useMemo(() => {
    if (categories.length > 0) return categories.map((c: any) => ({ category: c.name || c.category || '', count: c.count || 0, avgSentiment: c.sentiment || 50, label: c.name || c.category || '' }));
    return [];
  }, [categories]);

  // ═══ SHARE HANDLERS ═══
  const handleCopyLink = useCallback(async () => {
    try { await navigator.clipboard.writeText(window.location.href); setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); } catch { /* silent */ }
  }, []);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `${report.title} — رؤى`;

  const handleShareTwitter = useCallback(() => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
  }, [shareUrl, shareText]);

  const handleShareTelegram = useCallback(() => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
  }, [shareUrl, shareText]);

  const handleShareLinkedIn = useCallback(() => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
  }, [shareUrl]);

  // ═══ READ ALSO — semantic search fetch ═══
  useEffect(() => {
    if (!report.title) return;
    let cancelled = false;
    fetch(`/api/search/semantic?q=${encodeURIComponent(report.title)}&limit=3&locale=ar`)
      .then(res => res.ok ? res.json() : { reports: [] })
      .then(data => {
        if (cancelled) return;
        const reports = data.reports || data.results || data.data || [];
        // Filter out current report
        const filtered = reports.filter((r: any) => r.id !== report.id && r.slug !== report.slug);
        setReadAlsoReports(filtered.slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) setReadAlsoReports([]);
      })
      .finally(() => {
        if (!cancelled) setReadAlsoLoading(false);
      });
    return () => { cancelled = true; };
  }, [report.title, report.id, report.slug]);

  const publishedDate = report.publishedAt ? new Date(report.publishedAt) : new Date(report.createdAt);

  // ═══ SENTIMENT SCORE for gradient bar ═══
  // V156: Use computedSentiment which factors both marketImpact + confidenceScore
  const sentimentScore = computedSentiment;

  // All content sections for the sidebar TOC
  const allSections = [
    ...(displayIntroduction ? [{ id: 'introduction', title: 'مقدمة التقرير' }] : []),
    ...(overview ? [{ id: 'executive', title: 'الملخص التنفيذي' }] : []),
    // V164: Merged keyTakeaways + highlights into one TOC entry to avoid duplicate sections
    ...(keyTakeaways.length > 0 && highlights.length > 0 ? [{ id: 'key-takeaways', title: 'أبرز النتائج والنقاط' }]
      : keyTakeaways.length > 0 ? [{ id: 'key-takeaways', title: 'النتائج الرئيسية' }]
      : highlights.length > 0 ? [{ id: 'highlights', title: 'أبرز النقاط' }]
      : []),
    ...detailedSections.map((s, i) => ({ id: `section-${i}`, title: s.title })),
    ...(sections.rouaRecommendations || sections.rouaaRecommendations ? [{ id: 'roua-recommendations', title: 'توصيات رؤى' }] : []),
    ...(keyIndicatorsList.length > 0 ? [{ id: 'indicators', title: 'المؤشرات الرئيسية' }] : []),
    ...(priceChartData.length > 0 || sectorPerformanceData.length > 0 ? [{ id: 'charts', title: 'الرسوم البيانية' }] : []),
    ...(related.length > 0 ? [{ id: 'related', title: 'تقارير ذات صلة' }] : []),
  ];

  return (
    <main className="min-h-screen pb-mobile-safe">
      <div className="max-w-[1200px] mx-auto px-4 py-6" style={{ paddingInline: 'clamp(16px, 4vw, 48px)' }}>
        
        {/* Back Navigation */}
        <Link href="/reports" className="pdf-back-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          العودة لقائمة التقارير
        </Link>

        {/* Breadcrumb Navigation */}
        <nav style={{ marginBottom: '16px' }}>
          <ol style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text3)', flexWrap: 'wrap', direction: 'rtl' }}>
            <li><Link href="/" style={{ color: 'var(--text3)', textDecoration: 'none' }}>الرئيسية</Link></li>
            <li style={{ color: 'var(--text3)' }}>/</li>
            <li><Link href="/reports" style={{ color: 'var(--text3)', textDecoration: 'none' }}>التقارير</Link></li>
            <li style={{ color: 'var(--text3)' }}>/</li>
            <li style={{ color: 'var(--text2)', fontWeight: 500 }}>{TYPE_LABELS[report.reportType] || report.reportType}</li>
          </ol>
        </nav>

        <div className="flex gap-6 mt-4">
          {/* ═══ MAIN CONTENT ═══ */}
          <div className="flex-1 min-w-0">
            <div className="pdf-page" style={{ position: 'relative' }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
              
              {/* ═══ HERO SECTION ═══ */}
              <div style={{ marginBottom: '24px' }}>
                {/* Type & Impact Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '6px',
                    background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)',
                    border: '1px solid rgba(0,229,255,0.2)',
                  }}>
                    {TYPE_LABELS[report.reportType] || report.reportType}
                  </span>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px',
                    background: `${IMPACT_COLORS[report.marketImpact]}15`, color: IMPACT_COLORS[report.marketImpact],
                    border: `1px solid ${IMPACT_COLORS[report.marketImpact]}30`,
                  }}>
                    {IMPACT_LABELS[report.marketImpact]}
                  </span>
                  {dataQuality.aiGenerated && (
                    <span style={{
                      fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px',
                      background: 'rgba(128,128,128,0.06)', color: 'var(--text3)',
                      border: '1px solid rgba(128,128,128,0.1)',
                    }}>
                      AI
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: 'var(--text-head)', lineHeight: 1.4, marginBottom: '12px' }}>
                  {report.title}
                </h1>

                {/* Subtitle / Summary */}
                {(() => {
                  if (!report.summary) return null;
                  const summaryText = cleanJsonFromText(report.summary).trim();
                  if (!summaryText) return null;
                  const sectionsToCheck = [
                    overview,
                    cleanSection(sections.executiveSummary),
                    cleanSection(sections.context),
                    displayIntroduction,
                  ].filter(s => s && s.length > 20);
                  const isDuplicate = sectionsToCheck.some(sectionText => {
                    const sectionTrimmed = sectionText.trim();
                    if (summaryText === sectionTrimmed) return true;
                    if (sectionTrimmed.startsWith(summaryText)) return true;
                    if (summaryText.startsWith(sectionTrimmed.slice(0, 60))) return true;
                    const summaryStart = summaryText.slice(0, 60);
                    const sectionStart = sectionTrimmed.slice(0, 60);
                    if (summaryStart === sectionStart) return true;
                    return false;
                  });
                  return isDuplicate ? null : <p style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--text2)', marginBottom: '16px' }}>{summaryText}</p>;
                })()}

                {/* Meta Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text3)' }}>
                  <span>{publishedDate.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span style={{ color: 'rgba(128,128,128,0.3)' }}>|</span>
                  <span>{SCOPE_LABELS[report.scope] || report.scope}</span>
                  <span style={{ color: 'rgba(128,128,128,0.3)' }}>|</span>
                  <span>ثقة {report.confidenceScore}%</span>
                  {report.sectors.length > 0 && (
                    <>
                      <span style={{ color: 'rgba(128,128,128,0.3)' }}>|</span>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {report.sectors.map((s: string) => (
                          <span key={s} style={{
                            fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
                            background: 'rgba(128,128,128,0.06)', color: 'var(--text3)',
                            border: '1px solid rgba(128,128,128,0.1)',
                          }}>
                            {SECTOR_ICONS[s] && <span style={{ marginLeft: '3px' }}>{SECTOR_ICONS[s]}</span>}{s}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                  {/* Print/PDF button */}
                  <button
                    onClick={() => window.print()}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '4px 10px', borderRadius: '6px',
                      background: 'rgba(128,128,128,0.08)',
                      border: '1px solid rgba(128,128,128,0.15)',
                      color: 'var(--text2)', fontSize: '10px', fontWeight: 600,
                      cursor: 'pointer', marginRight: 'auto',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(128,128,128,0.08)'; e.currentTarget.style.borderColor = 'rgba(128,128,128,0.15)'; }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    PDF
                  </button>
                </div>
              </div>

              <div className="pdf-divider" />

              {/* ═══ VIDEO SECTION — Only show if video already exists (generated from dashboard) ═══ */}
              {/* Video generation is now in the admin dashboard, not here */}

              {/* ═══ CONTENT TABS ═══ */}
              <div className="pdf-tabs">
                {([
                  { key: 'overview' as ContentTab, label: 'المحتوى' },
                  { key: 'indicators' as ContentTab, label: 'المؤشرات' },
                  { key: 'charts' as ContentTab, label: 'الرسوم البيانية' },
                  { key: 'data' as ContentTab, label: 'البيانات الخام' },
                ]).map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`pdf-tab ${activeTab === tab.key ? 'pdf-tab-active' : ''}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ═══ TAB: OVERVIEW ═══ */}
              {activeTab === 'overview' && (
                <div className="pdf-content">
                  {/* V190: PROFESSIONAL SENTIMENT GRADIENT BAR — inside overview tab */}
                  <div style={{ margin: '0 0 20px 0', padding: '14px 16px', borderRadius: '12px', background: 'rgba(128,128,128,0.03)', border: '1px solid rgba(128,128,128,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-head)' }}>مقياس المشاعر السوقية</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1, color: sentimentScore >= 65 ? '#00996B' : sentimentScore >= 40 ? '#D4930D' : '#D4365C' }}>
                          {sentimentScore}
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: sentimentScore >= 80 ? '#00996B' : sentimentScore >= 65 ? '#00996B' : sentimentScore >= 50 ? '#D4930D' : sentimentScore >= 40 ? '#D4930D' : '#D4365C' }}>
                          {sentimentScore >= 80 ? 'جشع شديد' : sentimentScore >= 65 ? 'جشع' : sentimentScore >= 50 ? 'محايد مائل للصعود' : sentimentScore >= 40 ? 'محايد' : sentimentScore >= 25 ? 'خوف' : 'خوف شديد'}
                        </span>
                      </div>
                    </div>
                    <div style={{ position: 'relative', height: '12px', borderRadius: '6px', background: 'linear-gradient(to left, #D4365C 0%, #D84868 12%, #E06080 22%, #D4930D 42%, #90B040 52%, #40B870 68%, #00996B 82%, #007A55 100%)', overflow: 'visible', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                      {[20, 40, 60, 80].map(mark => (
                        <div key={mark} style={{ position: 'absolute', right: `${mark}%`, top: 0, height: '12px', width: '1px', background: 'rgba(255,255,255,0.2)' }} />
                      ))}
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        right: `${sentimentScore}%`,
                        transform: 'translate(50%, -50%)',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: '#fff',
                        border: `3px solid ${sentimentScore >= 65 ? '#00996B' : sentimentScore >= 40 ? '#D4930D' : '#D4365C'}`,
                        boxShadow: `0 2px 12px ${sentimentScore >= 65 ? 'rgba(0,153,107,0.4)' : sentimentScore >= 40 ? 'rgba(212,147,13,0.4)' : 'rgba(212,54,92,0.4)'}`,
                        transition: 'right 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        zIndex: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '8px',
                        fontWeight: 700,
                        color: sentimentScore >= 65 ? '#00996B' : sentimentScore >= 40 ? '#D4930D' : '#D4365C',
                      }}>
                        {sentimentScore}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                      {[{ label: 'خوف شديد', color: '#D4365C' }, { label: 'خوف', color: '#D46080' }, { label: 'محايد', color: '#D4930D' }, { label: 'جشع', color: '#40B870' }, { label: 'جشع شديد', color: '#00996B' }].map((s, idx) => (
                        <span key={idx} style={{ fontSize: '9px', fontWeight: 600, color: s.color }}>{s.label}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--bull)' }} />
                        <span style={{ fontSize: '9px', color: 'var(--text3)' }}>صعودي ({'>'}60)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--gold)' }} />
                        <span style={{ fontSize: '9px', color: 'var(--text3)' }}>محايد (40-60)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--bear)' }} />
                        <span style={{ fontSize: '9px', color: 'var(--text3)' }}>هبوطي ({'<'}40)</span>
                      </div>
                    </div>
                  </div>

                  {/* V224: CONFIDENCE ASSESSMENT CARD — inside overview tab */}
                  {(() => {
                    const confText = sections.confidenceAssessment ? cleanJsonFromText(sections.confidenceAssessment) : '';
                    const confMatch = confText.match(/مستوى الثقة[:\s]*(\d+)\s*\/\s*10/);
                    const confScore = confMatch ? parseInt(confMatch[1]) : null;
                    const justMatch = confText.match(/التبرير[:\s]*(.+)/);
                    const justification = justMatch ? justMatch[1].trim() : confText.replace(/مستوى الثقة[:\s]*\d+\s*\/\s*10[.\s]*/, '').replace(/تصنيف النشر[:\s]*.+/g, '').trim();
                    const pubMatch = confText.match(/تصنيف النشر[:\s]*(.+)/);
                    const publishClass = pubMatch ? pubMatch[1].trim() : null;
                    const displayScore = confScore ?? Math.round(report.confidenceScore / 10);
                    const barColor = displayScore >= 7 ? '#00996B' : displayScore >= 5 ? '#D4930D' : '#D4365C';
                    const scoreLabel = displayScore >= 8 ? 'ممتاز' : displayScore >= 7 ? 'جيد' : displayScore >= 5 ? 'متوسط' : 'منخفض';
                    return (
                      <div style={{ margin: '0 0 20px 0', padding: '12px 16px', borderRadius: '10px', background: 'rgba(128,128,128,0.03)', border: '1px solid rgba(128,128,128,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-head)' }}>تقييم الثقة</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 600, color: barColor }}>{scoreLabel}</span>
                            <div style={{ width: '80px', height: '6px', borderRadius: '3px', background: 'rgba(128,128,128,0.1)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${displayScore * 10}%`, borderRadius: '3px', background: barColor, transition: 'width 0.8s' }} />
                            </div>
                            <span style={{ fontSize: '16px', fontWeight: 700, color: barColor }}>{displayScore}/10</span>
                            <span style={{ fontSize: '10px', color: 'var(--text3)' }}>({report.confidenceScore}%)</span>
                          </div>
                        </div>
                        {justification && <p style={{ fontSize: '12px', lineHeight: '1.7', color: 'var(--text2)', margin: 0 }}>{justification}</p>}
                        {publishClass && (
                          <span style={{ display: 'inline-block', marginTop: '6px', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: publishClass.includes('انشر') ? 'rgba(0,153,107,0.1)' : 'rgba(212,54,92,0.1)', color: publishClass.includes('انشر') ? '#00996B' : '#D4365C' }}>{publishClass}</span>
                        )}
                      </div>
                    );
                  })()}

                  {/* V167: Report Introduction — deduplicated against overview, with "show more" truncation */}
                  {displayIntroduction && (
                    <div id="introduction" className="pdf-section" style={{ scrollMarginTop: '80px' }}>
                      <div className="pdf-section-header">
                        <h2 className="pdf-section-title">مقدمة التقرير</h2>
                      </div>
                      <div className="pdf-intro-box" style={{ maxHeight: introExpanded ? 'none' : '180px', overflow: 'hidden', position: 'relative', transition: 'max-height 0.3s ease' }}>
                        <div className="report-markdown-content">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                            {stripMarkdownHeadings(displayIntroduction.length > INTRO_MAX_CHARS && !introExpanded
                              ? truncateAtBoundary(displayIntroduction, INTRO_MAX_CHARS)
                              : displayIntroduction)}
                          </ReactMarkdown>
                        </div>
                        {!introExpanded && displayIntroduction.length > INTRO_MAX_CHARS && (
                          <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            height: '48px',
                            background: 'linear-gradient(transparent, var(--card, #0C1220))',
                            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                            paddingBottom: '8px',
                          }}>
                            <button
                              onClick={() => setIntroExpanded(true)}
                              style={{
                                padding: '4px 16px', borderRadius: '6px',
                                background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.25)',
                                color: 'var(--cyan)', fontSize: '11px', fontWeight: 700,
                                cursor: 'pointer', transition: 'all 0.15s ease',
                              }}
                            >
                              عرض المزيد
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Executive Summary */}
                  {overview && (
                    <div id="executive" className="pdf-section" style={{ scrollMarginTop: '80px' }}>
                      <div className="pdf-section-header">
                        <h2 className="pdf-section-title">الملخص التنفيذي</h2>
                      </div>
                      <div className="pdf-highlight-box">
                        <div className="report-markdown-content">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>{stripMarkdownHeadings(overview)}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Earnings Data Card — shown for earnings scope reports */}
                  {report.scope === 'earnings' && extractSymbolFromReport(report.title, report.sectors) && (
                    <div style={{ marginBottom: '24px' }}>
                      <EarningsDataCard
                        symbol={extractSymbolFromReport(report.title, report.sectors)}
                        locale="ar"
                      />
                    </div>
                  )}

                  {/* V154: Visual Components — Key Indicators Table */}
                  {isStrategicReport && fullReportText && <KeyIndicatorsTable reportText={fullReportText} />}

                  {/* V154: Visual Components — Impact Map */}
                  {isStrategicReport && mapCountries.length > 0 && (
                    <div className="pdf-section" style={{ scrollMarginTop: '80px' }}>
                      <ImpactMap countries={mapCountries} />
                    </div>
                  )}

                  {/* V154: Visual Components — Economic Charts */}
                  {isStrategicReport && fullReportText && <EconomicCharts reportText={fullReportText} confidenceScore={report.confidenceScore} />}

                  {/* V164: Merged Key Takeaways + Highlights — avoids duplicate sections */}
                  {(() => {
                    // Merge logic: if both exist, combine into one section; dedupe by first 40 chars
                    if (keyTakeaways.length === 0 && highlights.length === 0) return null;
                    const sectionId = keyTakeaways.length > 0 ? 'key-takeaways' : 'highlights';
                    const sectionTitle = keyTakeaways.length > 0 && highlights.length > 0
                      ? 'أبرز النتائج والنقاط'
                      : keyTakeaways.length > 0 ? 'النتائج الرئيسية' : 'أبرز النقاط';
                    // Build merged list: start with keyTakeaways, then add highlights not already present
                    const mergedItems = [...keyTakeaways];
                    if (highlights.length > 0 && keyTakeaways.length > 0) {
                      const existingPrefixes = new Set(keyTakeaways.map(k => k.slice(0, 40)));
                      for (const h of highlights) {
                        if (!existingPrefixes.has(h.slice(0, 40))) {
                          mergedItems.push(h);
                        }
                      }
                    } else if (highlights.length > 0 && keyTakeaways.length === 0) {
                      mergedItems.push(...highlights);
                    }
                    return (
                      <div id={sectionId} className="pdf-section" style={{ scrollMarginTop: '80px' }}>
                        <div className="pdf-section-header">
                          <h2 className="pdf-section-title">{sectionTitle}</h2>
                        </div>
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(0,229,255,0.06), rgba(0,153,107,0.06))',
                          border: '1px solid rgba(0,229,255,0.15)',
                          borderRadius: '8px',
                          padding: '16px 20px',
                        }}>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {mergedItems.map((point, i) => (
                              <li key={i} style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '10px',
                                padding: '8px 0',
                                borderBottom: i < mergedItems.length - 1 ? '1px solid rgba(0,229,255,0.08)' : 'none',
                              }}>
                                <span style={{
                                  flexShrink: 0,
                                  width: '22px',
                                  height: '22px',
                                  borderRadius: '50%',
                                  background: 'var(--cyan)',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  marginTop: '2px',
                                }}>{i + 1}</span>
                                <span style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--text)' }}>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Detailed Sections */}
                  {detailedSections.length > 0 && detailedSections.map((section, i) => {
                    // V153: Detect scenario sections for accordion rendering
                    const isScenario = /سيناريو|scenarios?/i.test(section.title) || /سيناريو\s+(قصير|متوسط|طويل|متفائل|محايد|متشائم)/i.test(section.content.slice(0, 500));
                    const parsedScenarios = isScenario ? parseScenarios(section.content) : [];

                    if (isScenario && parsedScenarios.length > 0) {
                      return (
                        <div key={i} id={`section-${i}`} className="pdf-section" style={{ scrollMarginTop: '80px' }}>
                          <div className="pdf-section-header">
                            <h2 className="pdf-section-title">{section.title}</h2>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {parsedScenarios.map((scenario, si) => {
                              const sKey = i * 10 + si;
                              const isOpen = expandedScenarios.has(sKey);
                              // V156: Default probabilities based on scenario type
                              const defaultProb = /قصير/i.test(scenario.title) ? 70 : /متوسط/i.test(scenario.title) ? 60 : /طويل/i.test(scenario.title) ? 40 : scenario.probability;
                              const displayProb = scenario.probability === 50 ? defaultProb : scenario.probability;
                              // Extract bullet points from content for summary view
                              const bulletPoints = scenario.content.split('\n').filter(l => /^[-•*]\s+/.test(l.trim()) || /^\d+\.\s+/.test(l.trim())).slice(0, 4);
                              return (
                                <div key={si} style={{
                                  background: isOpen ? 'rgba(128,128,128,0.04)' : 'transparent',
                                  border: `1px solid ${isOpen ? scenario.color + '50' : 'rgba(128,128,128,0.12)'}`,
                                  borderRadius: '12px',
                                  overflow: 'hidden',
                                  transition: 'all 0.25s ease',
                                  boxShadow: isOpen ? `0 6px 24px ${scenario.color}18` : 'none',
                                }}>
                                  {/* Header always visible */}
                                  <button
                                    onClick={() => {
                                      setExpandedScenarios(prev => {
                                        const newSet = new Set(prev);
                                        if (newSet.has(sKey)) newSet.delete(sKey); else newSet.add(sKey);
                                        return newSet;
                                      });
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '14px 16px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '10px',
                                      background: isOpen ? `${scenario.color}08` : 'transparent',
                                      border: 'none',
                                      cursor: 'pointer',
                                      color: 'var(--text-head)',
                                      textAlign: 'right',
                                    }}
                                  >
                                    <span style={{ fontSize: '22px', flexShrink: 0 }}>{scenario.emoji}</span>
                                    <div style={{ flex: 1, textAlign: 'right' }}>
                                      <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>{scenario.title}</div>
                                      {/* V156: Progress bar always visible in header */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'rgba(128,128,128,0.1)', overflow: 'hidden' }}>
                                          <div style={{
                                            height: '100%',
                                            width: `${displayProb}%`,
                                            borderRadius: '3px',
                                            background: `linear-gradient(90deg, ${scenario.color}80, ${scenario.color})`,
                                            transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                          }} />
                                        </div>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: scenario.color, minWidth: '32px' }}>{displayProb}%</span>
                                      </div>
                                    </div>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                                      style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s', flexShrink: 0 }}>
                                      <polyline points="6 9 12 15 18 9"/>
                                    </svg>
                                  </button>
                                  {/* Summary bullets when collapsed */}
                                  {!isOpen && bulletPoints.length > 0 && (
                                    <div style={{ padding: '0 16px 12px 48px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                      {bulletPoints.map((bp, bpi) => (
                                        <div key={bpi} style={{ fontSize: '11px', color: 'var(--text3)', lineHeight: '1.6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {bp.trim().replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, '').slice(0, 80)}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {/* Full content when expanded */}
                                  {isOpen && (
                                    <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${scenario.color}20` }}>
                                      <div style={{ margin: '12px 0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '5px' }}>
                                          <span style={{ color: 'var(--text3)' }}>احتمالية التحقق</span>
                                          <span style={{ fontWeight: 700, color: scenario.color }}>{displayProb}%</span>
                                        </div>
                                        <div style={{ height: '7px', borderRadius: '4px', background: 'rgba(128,128,128,0.1)', overflow: 'hidden' }}>
                                          <div style={{
                                            height: '100%',
                                            width: `${displayProb}%`,
                                            borderRadius: '4px',
                                            background: `linear-gradient(90deg, ${scenario.color}70, ${scenario.color})`,
                                            transition: 'width 0.6s ease',
                                            boxShadow: `0 0 8px ${scenario.color}40`,
                                          }} />
                                        </div>
                                      </div>
                                      <div className="report-markdown-content">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>{stripMarkdownHeadings(scenario.content)}</ReactMarkdown>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    // Normal section rendering
                    return (
                      <div key={i} id={`section-${i}`} className="pdf-section" style={{ scrollMarginTop: '80px' }}>
                        <div className="pdf-section-header">
                          <h2 className="pdf-section-title">{section.title}</h2>
                        </div>
                        <div className="pdf-section-body" style={{
                          background: 'rgba(128,128,128,0.02)',
                          borderRadius: '10px',
                          padding: '16px 18px',
                          border: '1px solid rgba(128,128,128,0.08)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        }}>
                          {/* V154: Context image for first 3 sections */}
                          {isStrategicReport && i < 3 && <ContextImage text={section.content} layout="inline" size={100} />}
                          <div className="report-markdown-content">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>{stripMarkdownHeadings(section.content)}</ReactMarkdown>
                          </div>
                          <div style={{ clear: 'both' }} />
                        </div>
                      </div>
                    );
                  })}

                  {/* V225: Asset Impact Cards — properly split gainers vs losers from single affectedAssets section */}
                  {(() => {
                    // V225: The AI generates ONE section containing BOTH ### أصول تستفيد and ### أصول تتضرر
                    // We must split the content by sub-headings instead of looking for separate sections.
                    const rawContent = sections.affectedAssets || sections.affectedAssets || '';
                    if (!rawContent || rawContent.trim().length < 20) return null;

                    // V225: Split by known section labels (with or without ### headings)
                    // AI formats: "أصول تستفيد:", "### أصول تستفيد", "أصول تتضرر:", "مستويات مراقبة:"
                    const sections_split = rawContent.split(/\n(?=(?:#{1,3}\s*)?(?:أصول\s*تستفيد|أصول\s*تتضرر|المستفيد|المتضرر|مستويات\s*مراقبة|المراقبة))/i);

                    let finalBenefitingText = '';
                    let finalLosingText = '';

                    for (const section of sections_split) {
                      const trimmedSection = section.trim();
                      if (!trimmedSection) continue;

                      const isBenefiting = /أصول\s*تستفيد|المستفيد[وة]ن?|المستفيدة/i.test(trimmedSection.slice(0, 30));
                      const isLosing = /أصول\s*تتضرر|المتضرر[وة]ن?|المتضررة/i.test(trimmedSection.slice(0, 30));
                      const isMonitoring = /مستويات?\s*مراقبة|المراقبة/i.test(trimmedSection.slice(0, 30));

                      // Remove the heading line itself
                      const contentWithoutHeading = trimmedSection.replace(/^(?:#{1,3}\s*)?(?:أصول\s*تستفيد|أصول\s*تتضرر|المستفيد[وة]ن?|المستفيدة|المتضرر[وة]ن?|المتضررة|مستويات?\s*مراقبة|المراقبة)[^\n]*\n?/i, '').trim();

                      if (isBenefiting) {
                        finalBenefitingText = contentWithoutHeading;
                      } else if (isLosing) {
                        finalLosingText = contentWithoutHeading;
                      }
                      // Skip monitoring section — it's not an asset
                    }

                    // Fallback: if no split found, try the simple text search
                    if (!finalBenefitingText && !finalLosingText) {
                      const benefitIdx = rawContent.search(/أصول\s*تستفيد|المستفيد[وة]ن?|المستفيدة/i);
                      const loseIdx = rawContent.search(/أصول\s*تتضرر|المتضرر[وة]ن?|المتضررة/i);
                      const monitorIdx = rawContent.search(/مستويات?\s*مراقبة/i);
                      if (benefitIdx !== -1 && loseIdx !== -1 && loseIdx > benefitIdx) {
                        const benefitEnd = monitorIdx > loseIdx ? monitorIdx : rawContent.length;
                        finalBenefitingText = rawContent.slice(benefitIdx, loseIdx).replace(/^.*?\n/, '').trim();
                        finalLosingText = rawContent.slice(loseIdx, benefitEnd).replace(/^.*?\n/, '').trim();
                      }
                    }

                    const parseAssets = (text: string): { name: string; reason: string; level: string }[] => {
                      if (!text) return [];
                      const lines = text.split('\n').filter(l => l.trim().length > 3);
                      const assets: { name: string; reason: string; level: string }[] = [];
                      let currentAsset: { name: string; reason: string; level: string } | null = null;

                      for (const line of lines) {
                        const trimmed = line.trim().replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '');
                        if (trimmed.length < 3) continue;
                        // Skip headings
                        if (/^#{1,4}\s/.test(trimmed)) continue;

                        // V225: Detect asset name line — FIXED to support [SYMBOL] format
                        // AI generates: **نيو هوب جروب** [NHC] - طلب قوي على الفحم...
                        // Also: **شركات الطاقة المتجددة** [مؤشر الطاقة النظيفة] - تسارع...
                        // The [SYMBOL] can be Latin or Arabic. The key pattern is **name** [symbol] - reason
                        const isAssetName = /\[[A-Z]{2,}\]/.test(trimmed) ||                     // [SYMBOL] Latin — AI's actual format
                          /\[[^\]]{2,}\]/.test(trimmed) && /\*\*/.test(trimmed) ||                // [anything] with bold — Arabic symbols
                          /\([A-Z]{2,}\/?[A-Z]*\)/.test(trimmed) ||                               // (SYMBOL) — legacy format
                          /\*\*.*?[\[(][A-Z]/.test(trimmed) ||                                     // **name[SYMBOL or **name(SYMBOL
                          (/^[*]/.test(trimmed) && trimmed.length < 120);                          // **bold name, reasonable length

                        // Detect reason line
                        const isReason = /السبب|السيب|بسبب|نظراً|يستفيد|يتضرر|بفضل|نتيجة|منذ/i.test(trimmed);

                        // Detect level line
                        const isLevel = /مستوى|مراقبة|دعم|مقاومة|هدف|سعر/i.test(trimmed);

                        if (isAssetName || (!isReason && !isLevel && trimmed.length < 50 && !currentAsset)) {
                          // This is a new asset name
                          if (currentAsset) assets.push(currentAsset);
                          // V225: Extract just the name (before [SYMBOL] and before dash separator)
                          let cleanName = trimmed.replace(/\*\*/g, '').replace(/^[*]\s*/, '').trim();
                          // If line has [SYMBOL] - reason format, extract just the name+symbol part
                          const symbolMatch = cleanName.match(/^(.+?\[(?:[A-Z]{2,}|[^\]]{2,})\])/);
                          if (symbolMatch) {
                            cleanName = symbolMatch[1].trim();
                          } else {
                            // Try splitting at " — " or " - " separator
                            const dashIdx = cleanName.search(/\s[-—]\s/);
                            if (dashIdx > 5) cleanName = cleanName.slice(0, dashIdx).trim();
                          }
                          currentAsset = { name: cleanName, reason: '', level: '' };

                          // V225: If the original line had a reason after the name, extract it
                          const reasonAfterDash = trimmed.replace(/\*\*/g, '').replace(/^[*]\s*/, '');
                          const dashParts = reasonAfterDash.match(/^.+?\[(?:[A-Z]{2,}|[^\]]{2,})\]\s*[-—:]\s*(.+)$/);
                          if (dashParts) {
                            currentAsset.reason = dashParts[1].trim();
                          } else {
                            const colonParts = reasonAfterDash.match(/^.+?\[(?:[A-Z]{2,}|[^\]]{2,})\]\s*[:]\s*(.+)$/);
                            if (colonParts) currentAsset.reason = colonParts[1].trim();
                          }
                        } else if (currentAsset) {
                          // This is detail for current asset
                          const cleanDetail = trimmed.replace(/\*\*/g, '').trim();
                          if (isReason) {
                            currentAsset.reason = cleanDetail.replace(/^(السبب|بسبب|نظراً|بفضل|نتيجة)\s*:?\s*/i, '').trim();
                          } else if (isLevel) {
                            currentAsset.level = cleanDetail.replace(/^(مستوى المراقبة|مستوى مراقبة|مراقبة|مقاومة|دعم|هدف|سعر)\s*:?\s*/i, '').trim();
                          } else {
                            // General detail — append to reason if short
                            if (!currentAsset.reason) {
                              currentAsset.reason = cleanDetail;
                            } else if (!currentAsset.level) {
                              currentAsset.level = cleanDetail;
                            }
                          }
                        }
                      }
                      if (currentAsset) assets.push(currentAsset);

                      // Filter out entries that are just labels (e.g. "السبب", "مستوى المراقبة")
                      return assets.filter(a => a.name.length > 1 && !/^(السبب|مستوى|مراقبة|دعم|مقاومة)$/.test(a.name)).slice(0, 6);
                    };

                    const gainers = parseAssets(finalBenefitingText);
                    const losers = parseAssets(finalLosingText);

                    if (gainers.length === 0 && losers.length === 0) return null;

                    return (
                      <div className="pdf-section" style={{ scrollMarginTop: '80px' }}>
                        <div className="pdf-section-header">
                          <h2 className="pdf-section-title">📊 أصول تستفيد وأصول تتضرر</h2>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          {/* Benefiting assets — green */}
                          {gainers.length > 0 && (
                            <div style={{
                              background: 'rgba(0,153,107,0.04)',
                              border: '1px solid rgba(0,153,107,0.15)',
                              borderRadius: '10px',
                              padding: '14px',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                <span style={{ fontSize: '14px' }}>📈</span>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#00996B' }}>أصول مستفيدة</span>
                              </div>
                              {gainers.map((a, i) => (
                                <div key={i} style={{
                                  padding: '8px 10px',
                                  borderRadius: '6px',
                                  background: 'rgba(0,153,107,0.06)',
                                  marginBottom: '6px',
                                  border: '1px solid rgba(0,153,107,0.1)',
                                }}>
                                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-head)' }}>{a.name}</div>
                                  {a.reason && <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px', lineHeight: '1.5' }}>{a.reason.slice(0, 120)}</div>}
                                  {a.level && <div style={{ fontSize: '10px', color: '#00996B', marginTop: '2px', lineHeight: '1.5', fontWeight: 600 }}>{a.level.slice(0, 80)}</div>}
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Losing assets — red */}
                          {losers.length > 0 && (
                            <div style={{
                              background: 'rgba(212,54,92,0.04)',
                              border: '1px solid rgba(212,54,92,0.15)',
                              borderRadius: '10px',
                              padding: '14px',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                <span style={{ fontSize: '14px' }}>📉</span>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#D4365C' }}>أصول تتضرر</span>
                              </div>
                              {losers.map((a, i) => (
                                <div key={i} style={{
                                  padding: '8px 10px',
                                  borderRadius: '6px',
                                  background: 'rgba(212,54,92,0.06)',
                                  marginBottom: '6px',
                                  border: '1px solid rgba(212,54,92,0.1)',
                                }}>
                                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-head)' }}>{a.name}</div>
                                  {a.reason && <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px', lineHeight: '1.5' }}>{a.reason.slice(0, 120)}</div>}
                                  {a.level && <div style={{ fontSize: '10px', color: '#D4365C', marginTop: '2px', lineHeight: '1.5', fontWeight: 600 }}>{a.level.slice(0, 80)}</div>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* V155: Visual components coming soon placeholder */}
                  {isStrategicReport && (
                    <div style={{
                      margin: '16px 0',
                      padding: '14px 18px',
                      borderRadius: '10px',
                      background: 'rgba(0,229,255,0.03)',
                      border: '1px dashed rgba(0,229,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}>
                      <span style={{ fontSize: '16px' }}>🚧</span>
                      <span style={{ fontSize: '11px', color: 'var(--text3)', lineHeight: '1.6' }}>
                        خريطة تفاعلية للدول والرسوم البيانية للبيانات قيد التطوير — ستتوفر قريباً مع بيانات حية من الأسواق
                      </span>
                    </div>
                  )}

                  {/* No content fallback */}
                  {!overview && highlights.length === 0 && detailedSections.length === 0 && (
                    <div className="pdf-section">
                      <div className="pdf-section-header">
                        <h2 className="pdf-section-title">محتوى التقرير</h2>
                      </div>
                      <div className="pdf-section-body">
                        <div className="report-markdown-content">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>{stripMarkdownHeadings(report.summary)}</ReactMarkdown>
                          {contentData.rawContent && <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>{stripMarkdownHeadings(cleanJsonFromText(contentData.rawContent))}</ReactMarkdown>}
                          {sections.rawContent && <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>{stripMarkdownHeadings(cleanJsonFromText(sections.rawContent))}</ReactMarkdown>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* V190: Investor-Category Recommendations with Execution Prices */}
                  {(() => {
                    const recContent = cleanSection(sections.strategicRecommendations || sections.rouaRecommendations || sections.rouaaRecommendations || '');
                    if (!recContent) return null;

                    // V190: Parse execution prices from recommendation text
                    // Patterns: "دخول شراء عند 85 دولار — وقف 82 — هدف 89"
                    //           "شراء | دخول: 2,400 | وقف: 2,370 | هدف: 2,460"
                    //           "سعر دخول + سعر وقف + سعر هدف"
                    const parseExecutionPrices = (text: string): {
                      asset: string; action: string; entry: string; stop: string; target: string;
                      timeframe: string; allocation: string; reason: string; raw: string;
                    } | null => {
                      // Try to extract structured recommendation
                      const cleaned = text.replace(/\*\*/g, '').trim();

                      // Extract asset name (first part before colon, pipe, or dash)
                      let asset = '';
                      const assetMatch = cleaned.match(/^([^\|:—\-–]{2,30})[\|:—\-–]/);
                      if (assetMatch) asset = assetMatch[1].trim();

                      // Extract action (buy/sell)
                      let action = '';
                      if (/شراء|buy/i.test(cleaned)) action = 'شراء';
                      else if (/بيع|sell|short/i.test(cleaned)) action = 'بيع';
                      else if (/تجميع|accumulate/i.test(cleaned)) action = 'تجميع';
                      else if (/تدريجي/i.test(cleaned)) action = 'تجميع تدريجي';
                      else if (/مراقب|watch/i.test(cleaned)) action = 'مراقبة';

                      // Extract entry price
                      let entry = '';
                      const entryPatterns = [
                        /دخول[:\s]*شراء?\s*(?:عند|ضمن|من)?\s*(\d[\d,.]*)/i,
                        /دخول[:\s]*(\d[\d,.]*)/i,
                        /سعر الدخول[:\s]*(\d[\d,.]*)/i,
                        /دخول تدريجي\s*(?:فوق|عند|ضمن|من)?\s*(\d[\d,.]*)/i,
                        /(?:شراء|بيع)\s*(?:عند|من|فوق|تحت|ضمن)\s+(\d[\d,.]*)/i,
                        /عند\s+(\d[\d,.]*)/i,
                        /فوق\s+(\d[\d,.]*)/i,
                        /تحت\s+(\d[\d,.]*)/i,
                        /مستوى الدخول[:\s]*(\d[\d,.]*)/i,
                        /entry[:\s]*(\d[\d,.]*)/i,
                      ];
                      for (const p of entryPatterns) {
                        const m = cleaned.match(p);
                        if (m) { entry = m[1]; break; }
                      }

                      // Extract stop loss
                      let stop = '';
                      const stopPatterns = [
                        /وقف(?:\s+(?:خسارة|متحرك))?[:\s]*(\d[\d,.]*)/i,
                        /stop(?:\s*loss)?[:\s]*(\d[\d,.]*)/i,
                        /SL[:\s]*(\d[\d,.]*)/i,
                      ];
                      for (const p of stopPatterns) {
                        const m = cleaned.match(p);
                        if (m) { stop = m[1]; break; }
                      }

                      // Extract target price
                      let target = '';
                      const targetPatterns = [
                        /(?:أهداف|المستهدف)(?:\s*(?:أول|ثاني|ثالث))?[:\s]*(\d[\d,.]*)/i,
                        /هدف(?:\s*(?:أول|ثاني|ثالث))?[:\s]*(\d[\d,.]*)/i,
                        /سعر الهدف[:\s]*(\d[\d,.]*)/i,
                        /target[:\s]*(\d[\d,.]*)/i,
                        /TP[:\s]*(\d[\d,.]*)/i,
                      ];
                      for (const p of targetPatterns) {
                        const m = cleaned.match(p);
                        if (m) { target = m[1]; break; }
                      }

                      // Extract timeframe (longer units first to prevent partial matches)
                      let timeframe = '';
                      const tfUnitPattern = '(?:أسبوعين|أسبوعا?|أسبوع|يومين|أيام|يوم|أشهر|شهر|سنوات|سنة)';
                      const tfMatch = cleaned.match(new RegExp(`أقصى مد[ةى][:\\s]*(\\d*\\s*${tfUnitPattern})`, 'i'))
                        || cleaned.match(new RegExp(`أفق[:\\s]*(\\d*\\s*${tfUnitPattern})`, 'i'))
                        || cleaned.match(new RegExp(`مدة[:\\s]*(\\d*\\s*${tfUnitPattern})`, 'i'));
                      if (tfMatch) timeframe = tfMatch[1].trim();

                      // Extract allocation percentage (supports Arabic ٪ U+066A and ASCII %)
                      let allocation = '';
                      const allocMatch = cleaned.match(/(?:تخصيص|وزن|نسبة|خصص)[:\s]*(\d+\s*[%٪])/i)
                        || cleaned.match(/(\d+)\s*[%٪]\s*(?:من المحفظة)/i);
                      if (allocMatch) allocation = allocMatch[1];

                      // Extract reason (after "السبب:" or last part)
                      let reason = '';
                      const reasonMatch = cleaned.match(/السبب[:\s]*(.+)$/i);
                      if (reasonMatch) reason = reasonMatch[1].trim();

                      // Only return structured data if we found at least entry, target, stop, or allocation
                      if (!entry && !target && !stop && !allocation) return null;

                      return {
                        asset: asset || cleaned.split(/\s+/).slice(0, 2).join(' '),
                        action,
                        entry,
                        stop,
                        target,
                        timeframe,
                        allocation,
                        reason,
                        raw: cleaned,
                      };
                    };

                    // Try to split recommendations by investor categories
                    const splitByCategory = (text: string): {
                      category: string; icon: string; color: string; subtitle?: string; items: string[];
                      parsedItems: (ReturnType<typeof parseExecutionPrices> | null)[];
                    }[] => {
                      const categories = [
                        { keywords: ['متداول', 'يومي', 'قصير الأجل', 'قصير المدى', 'قصير الاجل'], category: 'المتداول اليومي', icon: '⚡', color: '#8B5CF6', subtitle: 'أفق أسبوع أو أقل' },
                        { keywords: ['متوسط الأجل', 'متوسط المدى', 'معتدل', 'متوازن', '1-6 أشهر'], category: 'المستثمر متوسط الأجل', icon: '⚖️', color: '#D4930D', subtitle: '1-6 أشهر' },
                        { keywords: ['طويل الأجل', 'طويل المدى', '6 أشهر فأكثر', 'استراتيجي هيكلي'], category: 'المستثمر طويل الأجل', icon: '🔭', color: '#059669', subtitle: '6 أشهر فأكثر' },
                        { keywords: ['محافظ', 'متحفظ', 'قليل المخاطر', 'دفاعي', 'حذر'], category: 'المستثمر المحافظ', icon: '🛡️', color: '#3B82F6', subtitle: 'حماية رأس المال' },
                        { keywords: ['مغامر', 'عدواني', 'نشط', 'مضارب', 'متحمس', 'عالي المخاطر'], category: 'المستثمر المغامر', icon: '🚀', color: '#EF4444', subtitle: 'عوائد مرتفعة' },
                      ];

                      // Check if text already has category sections
                      const hasCategories = categories.some(c => c.keywords.some(k => text.includes(k)));

                      if (hasCategories) {
                        const result: { category: string; icon: string; color: string; items: string[]; parsedItems: (ReturnType<typeof parseExecutionPrices> | null)[] }[] = [];
                        for (const cat of categories) {
                          const lines = text.split('\n');
                          const matchedLines: string[] = [];
                          let inCategory = false;
                          for (const line of lines) {
                            const trimmed = line.trim();
                            // Skip empty lines
                            if (!trimmed) continue;
                            // Check for heading lines that mark category boundaries
                            const isHeading = /^#{1,3}\s/.test(trimmed) || /^\*\*/.test(trimmed);
                            if (isHeading) {
                              if (cat.keywords.some(k => trimmed.includes(k))) {
                                inCategory = true;
                              } else if (inCategory) {
                                // Hit a different category's heading — stop collecting
                                inCategory = false;
                              }
                              continue; // skip the heading line itself
                            }
                            // Legacy: non-heading lines that contain category keywords
                            if (!inCategory && cat.keywords.some(k => trimmed.includes(k))) {
                              inCategory = true;
                              continue;
                            }
                            if (inCategory && trimmed.length > 3) {
                              matchedLines.push(trimmed.replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, ''));
                            }
                          }
                          if (matchedLines.length > 0) {
                            const parsedItems = matchedLines.slice(0, 5).map(item => parseExecutionPrices(item));
                            result.push({ ...cat, items: matchedLines.slice(0, 5), parsedItems });
                          }
                        }
                        return result;
                      }

                      // No explicit categories — auto-classify by content
                      const allBullets = text.split('\n').filter(l => /^[-•*]\s+/.test(l.trim()) || /^\d+\.\s+/.test(l.trim()));
                      if (allBullets.length === 0) return [];

                      const classified = allBullets.map(b => {
                        const cleaned = b.trim().replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, '');
                        if (/وقف خسارة|حماية|دفاعي|تقليل|تجنب|تحوط|سندات حكومية|ذهب|ملاذ آمن/i.test(cleaned)) {
                          return { text: cleaned, category: 'المستثمر المحافظ', icon: '🛡️', color: '#3B82F6' };
                        }
                        if (/بيع|شراء|تداول|مضاربة|يومي|قصير المدى|وقف|هدف|مستوى/i.test(cleaned)) {
                          return { text: cleaned, category: 'المتداول اليومي', icon: '⚡', color: '#8B5CF6' };
                        }
                        if (/إعادة هيكلة|استثمار كبير|تسريع|جذري|تحول|عالي المخاطر/i.test(cleaned)) {
                          return { text: cleaned, category: 'المستثمر المغامر', icon: '🚀', color: '#EF4444' };
                        }
                        return { text: cleaned, category: 'المستثمر المتوسط', icon: '⚖️', color: '#D4930D' };
                      });

                      const grouped: Record<string, { category: string; icon: string; color: string; items: string[]; parsedItems: (ReturnType<typeof parseExecutionPrices> | null)[] }> = {};
                      for (const item of classified) {
                        if (!grouped[item.category]) {
                          grouped[item.category] = { category: item.category, icon: item.icon, color: item.color, items: [], parsedItems: [] };
                        }
                        grouped[item.category].items.push(item.text);
                        grouped[item.category].parsedItems.push(parseExecutionPrices(item.text));
                      }
                      return Object.values(grouped);
                    };

                    const recCategories = splitByCategory(recContent);
                    const hasExplicitCategories = recCategories.length >= 2;
                    const sectionId = sections.strategicRecommendations ? 'strategic-recommendations' : 'roua-recommendations';
                    // V211: Use report-type-appropriate title for recommendations section
                    const sectionTitle = isStrategicReport
                      ? (sections.strategicRecommendations ? 'التوصيات الاستراتيجية' : 'توصيات رؤى')
                      : 'توصيات رؤى';

                    return (
                      <div id={sectionId} className="pdf-section" style={{ scrollMarginTop: '80px' }}>
                        <div className="pdf-section-header">
                          <h2 className="pdf-section-title">{sectionTitle}</h2>
                        </div>
                        {/* If we have classified categories, show them as cards with execution prices */}
                        {hasExplicitCategories ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {recCategories.map((cat, ci) => (
                              <div key={ci} style={{
                                background: `${cat.color}06`,
                                border: `1px solid ${cat.color}20`,
                                borderRadius: '12px',
                                padding: '16px',
                                borderTop: `3px solid ${cat.color}`,
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                  <span style={{ fontSize: '20px' }}>{cat.icon}</span>
                                  <div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: cat.color }}>{cat.category}</div>
                                    {cat.subtitle && <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>{cat.subtitle}</div>}
                                  </div>
                                </div>
                                {cat.items.map((item, ii) => {
                                  const parsed = cat.parsedItems[ii];
                                  // If we have execution prices, show structured card
                                  if (parsed && (parsed.entry || parsed.target || parsed.stop)) {
                                    return (
                                      <div key={ii} style={{
                                        background: 'rgba(128,128,128,0.03)',
                                        border: '1px solid rgba(128,128,128,0.08)',
                                        borderRadius: '8px',
                                        padding: '10px 12px',
                                        marginBottom: '8px',
                                      }}>
                                        {/* Asset name and action */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-head)' }}>
                                            {parsed.asset || item.split(/\s+/).slice(0, 3).join(' ')}
                                          </span>
                                          {parsed.action && (
                                            <span style={{
                                              fontSize: '10px', fontWeight: 700,
                                              padding: '2px 8px', borderRadius: '4px',
                                              background: parsed.action === 'شراء' || parsed.action === 'تجميع' ? 'rgba(0,153,107,0.12)' : parsed.action === 'بيع' ? 'rgba(212,54,92,0.12)' : 'rgba(128,128,128,0.1)',
                                              color: parsed.action === 'شراء' || parsed.action === 'تجميع' ? '#00996B' : parsed.action === 'بيع' ? '#D4365C' : 'var(--text3)',
                                            }}>
                                              {parsed.action}
                                            </span>
                                          )}
                                        </div>
                                        {/* Price levels */}
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                          {parsed.entry && (
                                            <div style={{ flex: '1 1 auto', minWidth: '60px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(0,153,107,0.06)', border: '1px solid rgba(0,153,107,0.1)' }}>
                                              <div style={{ fontSize: '9px', color: 'var(--text3)', marginBottom: '2px' }}>الدخول</div>
                                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#00996B' }}>{parsed.entry}</div>
                                            </div>
                                          )}
                                          {parsed.stop && (
                                            <div style={{ flex: '1 1 auto', minWidth: '60px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(212,54,92,0.06)', border: '1px solid rgba(212,54,92,0.1)' }}>
                                              <div style={{ fontSize: '9px', color: 'var(--text3)', marginBottom: '2px' }}>وقف خسارة</div>
                                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#D4365C' }}>{parsed.stop}</div>
                                            </div>
                                          )}
                                          {parsed.target && (
                                            <div style={{ flex: '1 1 auto', minWidth: '60px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.1)' }}>
                                              <div style={{ fontSize: '9px', color: 'var(--text3)', marginBottom: '2px' }}>الهدف</div>
                                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#00C2D4' }}>{parsed.target}</div>
                                            </div>
                                          )}
                                          {parsed.allocation && (
                                            <div style={{ flex: '1 1 auto', minWidth: '60px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(128,128,128,0.04)', border: '1px solid rgba(128,128,128,0.08)' }}>
                                              <div style={{ fontSize: '9px', color: 'var(--text3)', marginBottom: '2px' }}>التخصيص</div>
                                              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-head)' }}>{parsed.allocation}</div>
                                            </div>
                                          )}
                                        </div>
                                        {/* Timeframe and reason */}
                                        {(parsed.timeframe || parsed.reason) && (
                                          <div style={{ marginTop: '6px', fontSize: '10px', color: 'var(--text3)', lineHeight: '1.6' }}>
                                            {parsed.timeframe && <span style={{ marginLeft: '8px' }}>⏱ {parsed.timeframe}</span>}
                                            {parsed.reason && <span>💡 {parsed.reason}</span>}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                  // Fallback: show as simple bullet item
                                  return (
                                    <div key={ii} style={{
                                      fontSize: '11px',
                                      lineHeight: '1.7',
                                      color: 'var(--text2)',
                                      padding: '4px 0',
                                      borderBottom: ii < cat.items.length - 1 ? '1px solid rgba(128,128,128,0.06)' : 'none',
                                    }}>
                                      <span style={{ color: cat.color, marginLeft: '4px', fontWeight: 700 }}>•</span>
                                      {item}
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        ) : (
                          /* Fallback: show raw recommendations with markdown */
                          <div className="pdf-recommendations-box">
                            <div className="report-markdown-content">
                              <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>{stripMarkdownHeadings(recContent)}</ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {/* Legacy roua recommendations (if different from strategic) */}
                  {(sections.rouaRecommendations || sections.rouaaRecommendations) && !sections.strategicRecommendations && (() => {
                    const recContent = cleanSection(sections.rouaRecommendations || sections.rouaaRecommendations);
                    // If already shown above, skip
                    if (!recContent) return null;
                    return null; // Already handled above
                  })()}
                  {/* Strategic recommendations as a detailed section if not classified into cards */}
                  {isStrategicReport && sections.strategicRecommendations && (() => {
                    // Already handled above in investor-category cards, skip
                    return null;
                  })()}

                  {/* V164: Recommendation feedback buttons */}
                  {(sections.strategicRecommendations || sections.rouaRecommendations || sections.rouaaRecommendations) && (
                  <div style={{
                    margin: '16px 0',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(128,128,128,0.03)',
                    border: '1px solid rgba(128,128,128,0.1)',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text3)', alignSelf: 'center', marginLeft: '8px' }}>
                      هل هذه التوصيات مفيدة؟
                    </span>
                    <button
                      onClick={() => fetch(`/api/reports/${report.id}/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'helpful' }) }).catch(err => console.warn('[ReportDetail V156] Feedback action failed:', err instanceof Error ? err.message : err))}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: '1px solid rgba(0,153,107,0.2)',
                        background: 'rgba(0,153,107,0.05)',
                        color: '#00996B',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      👍 مفيد
                    </button>
                    <button
                      onClick={() => fetch(`/api/reports/${report.id}/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'not_helpful' }) }).catch(err => console.warn('[ReportDetail V156] Feedback action failed:', err instanceof Error ? err.message : err))}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: '1px solid rgba(212,54,92,0.2)',
                        background: 'rgba(212,54,92,0.05)',
                        color: '#D4365C',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      👎 غير مفيد
                    </button>
                    <button
                      onClick={() => fetch(`/api/reports/${report.id}/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'executed' }) }).catch(err => console.warn('[ReportDetail V156] Feedback action failed:', err instanceof Error ? err.message : err))}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: '1px solid rgba(0,151,167,0.2)',
                        background: 'rgba(0,151,167,0.05)',
                        color: '#0097A7',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      ✅ تم التنفيذ
                    </button>
                  </div>
                  )}

                  {/* Heatmap */}
                  {heatmapData.length > 0 && (
                    <div className="pdf-section">
                      <div className="pdf-section-header">
                        <h2 className="pdf-section-title">خريطة حرارية للقطاعات</h2>
                      </div>
                      <HeatMapGrid data={heatmapData} />
                    </div>
                  )}

                  {/* ═══ DISCLAIMER ═══ */}
                  <div style={{
                    margin: '24px 0',
                    padding: '14px 18px',
                    borderRadius: '8px',
                    background: 'rgba(128,128,128,0.06)',
                    border: '1px solid rgba(128,128,128,0.15)',
                    fontSize: '11px',
                    lineHeight: '1.8',
                    color: 'var(--text3)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <span>إخلاء مسؤولية: هذا التقرير تم إنشاؤه بواسطة الذكاء الاصطناعي وهو لأغراض إعلامية فقط ولا يُعد نصيحة استثمارية. يُرجى استشارة مستشار مالي مرخص قبل اتخاذ أي قرارات استثمارية.</span>
                    </div>
                  </div>

                  {/* CTA Section */}
                  <div className="pdf-cta-section">
                    <div className="pdf-cta-box">
                      <h3 className="pdf-cta-title">ابدأ التداول الآن</h3>
                      <p className="pdf-cta-text">استفد من تحليلاتنا المعمقة واتخذ قرارات استثمارية مستنيرة</p>
                      <div className="pdf-cta-buttons">
                        <Link href="/reports" className="pdf-cta-btn pdf-cta-primary">
                          تصفح التقارير ذات الصلة
                        </Link>
                        <Link href="/" className="pdf-cta-btn pdf-cta-secondary">
                          العودة للرئيسية
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* ═══ SHARE BUTTONS ═══ */}
                  <div style={{
                    margin: '24px 0',
                    padding: '16px 20px',
                    borderRadius: '8px',
                    background: 'rgba(0,229,255,0.03)',
                    border: '1px solid rgba(0,229,255,0.08)',
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-head)', marginBottom: '12px' }}>
                      مشاركة التقرير
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {/* Twitter / X */}
                      <button
                        onClick={handleShareTwitter}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '8px 16px', borderRadius: '6px',
                          background: '#000', color: '#fff',
                          border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        X
                      </button>
                      {/* Telegram */}
                      <button
                        onClick={handleShareTelegram}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '8px 16px', borderRadius: '6px',
                          background: '#0088cc', color: '#fff',
                          border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                        Telegram
                      </button>
                      {/* LinkedIn */}
                      <button
                        onClick={handleShareLinkedIn}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '8px 16px', borderRadius: '6px',
                          background: '#0077B5', color: '#fff',
                          border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        LinkedIn
                      </button>
                      {/* Copy Link */}
                      <button
                        onClick={handleCopyLink}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '8px 16px', borderRadius: '6px',
                          background: shareCopied ? 'var(--bull)' : 'rgba(128,128,128,0.12)',
                          color: shareCopied ? '#fff' : 'var(--text)',
                          border: '1px solid rgba(128,128,128,0.2)',
                          cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                          transition: 'all 0.2s',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        {shareCopied ? 'تم النسخ!' : 'نسخ الرابط'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ TAB: INDICATORS ═══ */}
              {activeTab === 'indicators' && (
                <div className="pdf-content" id="indicators" style={{ scrollMarginTop: '80px' }}>
                  {keyIndicatorsList.length > 0 && (
                    <div className="pdf-section">
                      <div className="pdf-section-header">
                        <h2 className="pdf-section-title">المؤشرات الرئيسية</h2>
                      </div>
                      <div className="pdf-indicators-table">
                        <div className="pdf-indicators-header">
                          <span>المؤشر</span>
                          <span>القيمة</span>
                          <span>التغيير</span>
                        </div>
                        {keyIndicatorsList.map((ind: any, i: number) => (
                          <div key={i} className="pdf-indicators-row">
                            <span className="pdf-ind-name">{ind.name}</span>
                            <span className="pdf-ind-value">{typeof ind.value === 'number' ? ind.value.toLocaleString() : ind.value}</span>
                            <span className="pdf-ind-change" style={{ color: ind.change >= 0 ? 'var(--bull)' : ind.change < 0 ? 'var(--bear)' : 'var(--text3)' }}>
                              {ind.change !== undefined && ind.change !== 0 ? `${ind.change >= 0 ? '▲' : '▼'} ${Math.abs(ind.change).toFixed(2)}%` : '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sentiment Breakdown */}
                  {metadata.sentimentBreakdown && Object.keys(metadata.sentimentBreakdown).length > 0 && (
                    <div className="pdf-section">
                      <div className="pdf-section-header">
                        <h2 className="pdf-section-title">توزيع المشاعر</h2>
                      </div>
                      <div className="pdf-sentiment-cards">
                        {Object.entries(metadata.sentimentBreakdown).map(([sentiment, count]: [string, any]) => (
                          <div key={sentiment} className="pdf-sentiment-card" style={{
                            borderColor: sentiment === 'positive' || sentiment === 'bullish' ? 'var(--bull)' : sentiment === 'negative' || sentiment === 'bearish' ? 'var(--bear)' : 'var(--gold)',
                          }}>
                            <div className="pdf-sentiment-count" style={{
                              color: sentiment === 'positive' || sentiment === 'bullish' ? 'var(--bull)' : sentiment === 'negative' || sentiment === 'bearish' ? 'var(--bear)' : 'var(--gold)',
                            }}>{count}</div>
                            <div className="pdf-sentiment-label">{sentiment}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category Breakdown */}
                  {metadata.categoryBreakdown && Object.keys(metadata.categoryBreakdown).length > 0 && (
                    <div className="pdf-section">
                      <div className="pdf-section-header">
                        <h2 className="pdf-section-title">توزيع الفئات</h2>
                      </div>
                      <div className="pdf-category-bars">
                        {Object.entries(metadata.categoryBreakdown)
                          .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)
                          .map(([category, count]: [string, any]) => {
                            const maxCount = Math.max(...Object.values(metadata.categoryBreakdown as Record<string, number>) as number[]);
                            const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
                            return (
                              <div key={category} className="pdf-category-row">
                                <span className="pdf-cat-name">{category}</span>
                                <div className="pdf-cat-bar-bg">
                                  <div className="pdf-cat-bar-fill" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="pdf-cat-count">{count}</span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {keyIndicatorsList.length === 0 && !metadata.sentimentBreakdown && (
                    <div className="pdf-empty">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
                      <p>لا توجد مؤشرات متاحة لهذا التقرير</p>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ TAB: CHARTS ═══ */}
              {activeTab === 'charts' && (
                <div className="pdf-content" id="charts" style={{ scrollMarginTop: '80px' }}>
                  {priceChartData.length > 0 && (
                    <div className="pdf-section">
                      <div className="pdf-section-header">
                        <h2 className="pdf-section-title">الرسم البياني للأسعار</h2>
                      </div>
                      <div className="pdf-chart-container">
                        <PriceChart data={priceChartData} symbol={report.sectors[0] || 'MKT'} nameAr={report.sectors[0] || 'مؤشر السوق'} height={350} />
                      </div>
                    </div>
                  )}

                  {sectorPerformanceData.length > 0 && (
                    <div className="pdf-section">
                      <div className="pdf-section-header">
                        <h2 className="pdf-section-title">أداء القطاعات</h2>
                      </div>
                      <div className="pdf-chart-container">
                        <SectorPerformance data={sectorPerformanceData} />
                      </div>
                    </div>
                  )}

                  {priceChartData.length === 0 && sectorPerformanceData.length === 0 && (
                    <div className="pdf-empty">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                      <p>لا توجد رسوم بيانية متاحة لهذا التقرير</p>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ TAB: DATA ═══ */}
              {activeTab === 'data' && (
                <div className="pdf-content" id="data" style={{ scrollMarginTop: '80px' }}>
                  <div className="pdf-section">
                    <div className="pdf-section-header">
                      <h2 className="pdf-section-title">جودة البيانات</h2>
                    </div>
                    <div className="pdf-data-grid">
                      <div className="pdf-data-card">
                        <div className="pdf-data-value">{dataQuality.newsCount || 0}</div>
                        <div className="pdf-data-label">عدد الأخبار</div>
                      </div>
                      <div className="pdf-data-card">
                        <div className="pdf-data-value">{dataQuality.indicatorsCount || 0}</div>
                        <div className="pdf-data-label">عدد المؤشرات</div>
                      </div>
                      <div className="pdf-data-card">
                        <div className="pdf-data-value" style={{ color: dataQuality.calendarEventsCount > 0 ? 'var(--bull)' : 'var(--text3)' }}>{dataQuality.calendarEventsCount || 0}</div>
                        <div className="pdf-data-label">أحداث تقويمية</div>
                      </div>
                      <div className="pdf-data-card">
                        <div className="pdf-data-value" style={{ color: dataQuality.aiGenerated ? 'var(--bull)' : 'var(--gold)' }}>{dataQuality.aiGenerated ? 'نعم' : 'لا'}</div>
                        <div className="pdf-data-label">توليد AI</div>
                      </div>
                    </div>
                  </div>

                  <div className="pdf-section">
                    <details>
                      <summary className="pdf-details-summary">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                        البيانات الخام (JSON)
                      </summary>
                      <pre className="pdf-raw-json">
                        {JSON.stringify(contentData, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              )}

              {/* ═══ PDF FOOTER ═══ */}
              <div className="pdf-footer">
                <div className="pdf-footer-left">
                  <span>رؤى — منصة التقارير الاقتصادية</span>
                </div>
                <div className="pdf-footer-right">
                  <span>{publishedDate.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span className="pdf-footer-sep">|</span>
                  <span>{TYPE_LABELS[report.reportType] || report.reportType}</span>
                  <span className="pdf-footer-sep">|</span>
                  <span>ثقة {report.confidenceScore}%</span>
                </div>
              </div>
              </div>{/* end z-index wrapper */}
            </div>

            {/* ═══ الميزات الثورية — 10 ميزات متقدمة ═══ */}
            <div className="mt-8" style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
              {/* #1: النشرة الصباحية المخصصة */}
              <PersonalizedMorningBrief
                reportTitle={report.title}
                marketImpact={report.marketImpact}
                confidenceScore={report.confidenceScore}
                sectors={translateSectors(report.sectors)}
                keyIndicators={report.keyIndicators}
                locale={locale}
              />

              {/* #2: ملخص صوتي بالذكاء الاصطناعي */}
              <AIAudioBrief
                reportTitle={report.title}
                reportSummary={report.summary || overview || ''}
                locale={locale}
              />

              {/* #3: ترجمة ذكية حسب السياق */}
              <ContextAwareAITranslation
                content={overview || report.summary || ''}
                currentLocale={locale}
              />

              {/* #4: بطاقة تقييم التقرير */}
              <ReportScorecard
                confidenceScore={report.confidenceScore}
                marketImpact={report.marketImpact}
                reportType={report.reportType}
                sectors={translateSectors(report.sectors)}
                keyIndicators={report.keyIndicators}
                publishedAt={report.publishedAt}
                locale={locale}
              />

              {/* #5: مؤشر الخوف والطمع المخصص */}
              <CustomFearGreedIndex
                marketImpact={report.marketImpact}
                confidenceScore={report.confidenceScore}
                sectors={translateSectors(report.sectors)}
                keyIndicators={report.keyIndicators}
                locale={locale}
              />

              {/* #6: محرك السيناريوهات التفاعلي */}
              {parseScenarios(sections.scenarios || sections.outlook || '').length > 0 && (
                <InteractiveScenarioEngine
                  scenarios={parseScenarios(sections.scenarios || sections.outlook || '')}
                  marketImpact={report.marketImpact}
                  confidenceScore={report.confidenceScore}
                  locale={locale}
                />
              )}

              {/* #7: متتبع التوصيات */}
              <RecommendationTracker
                reportId={report.id}
                reportTitle={report.title}
                content={sections.rouaaRecommendations || sections.rouaRecommendations || sections.strategicRecommendations || ''}
                locale={locale}
              />

              {/* #8: محاكي التداول الورقي */}
              <PaperTradingSimulator
                reportId={report.id}
                reportTitle={report.title}
                marketImpact={report.marketImpact}
                content={sections.rouaaRecommendations || sections.rouaRecommendations || sections.strategicRecommendations || ''}
                locale={locale}
              />

              {/* #9: ذكاء التقارير المتقاطع */}
              <CrossReportIntelligence
                currentReport={{
                  title: report.title,
                  marketImpact: report.marketImpact,
                  confidenceScore: report.confidenceScore,
                  sectors: translateSectors(report.sectors),
                  reportType: report.reportType,
                }}
                relatedReports={related}
                locale={locale}
              />

              {/* #10: خريطة حرارية عالمية */}
              <GlobalHeatmap
                marketImpact={report.marketImpact}
                sectors={translateSectors(report.sectors)}
                scope={report.scope}
                confidenceScore={report.confidenceScore}
                locale={locale}
              />
            </div>

            {/* ═══ RELATED REPORTS ═══ */}
            {/* V300: Enhanced related reports with filtering and RAG-style matching */}
            <RelatedReports
              currentReportId={report.id}
              currentReportType={report.reportType}
              currentSectors={report.sectors || []}
              related={related}
              locale="ar"
            />

            {/* ═══ V1057: RELATED GEOPOLITICAL RISKS ═══ */}
            <div className="mt-8" id="geo-risks">
              <div className="pdf-section-header mb-4">
                <h2 className="pdf-section-title">⚔️ المخاطر الجيوسياسية المرتبطة</h2>
              </div>
              <GeopoliticalRisksWidget locale="ar" />
            </div>

            {/* ═══ READ ALSO (اقرأ أيضاً) — Semantic Search ═══ */}
            <div className="mt-8">
              <div className="pdf-section-header mb-4">
                <h2 className="pdf-section-title">اقرأ أيضاً</h2>
              </div>
              {readAlsoLoading ? (
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{
                      flex: '1 1 200px', maxWidth: '300px',
                      padding: '16px', borderRadius: '8px',
                      background: 'rgba(128,128,128,0.06)',
                      border: '1px solid rgba(128,128,128,0.1)',
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }}>
                      <div style={{ height: '14px', background: 'rgba(128,128,128,0.15)', borderRadius: '4px', marginBottom: '8px', width: '80%' }} />
                      <div style={{ height: '10px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', width: '60%' }} />
                    </div>
                  ))}
                </div>
              ) : readAlsoReports.length > 0 ? (
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {readAlsoReports.map((r: any) => (
                    <Link
                      key={r.id || r.slug}
                      href={`/reports/${r.slug}`}
                      style={{
                        flex: '1 1 200px', maxWidth: '300px',
                        padding: '16px', borderRadius: '8px',
                        background: 'rgba(0,229,255,0.03)',
                        border: '1px solid rgba(0,229,255,0.1)',
                        textDecoration: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,229,255,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-head)', marginBottom: '8px', lineHeight: '1.5' }}>
                        {(() => { const displayTitle = r.titleAr || r.title; const icon = Object.entries(SECTOR_ICONS).find(([k]) => displayTitle?.includes(k)); return icon ? <span style={{ marginLeft: '6px' }}>{icon[1]}</span> : null; })()}
                        {r.titleAr || r.title}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {r.reportType && <span className="pdf-tag">{TYPE_LABELS[r.reportType] || r.reportType}</span>}
                        {r.publishedAt && (
                          <span style={{ fontSize: '10px', color: 'var(--text3)' }}>
                            {new Date(r.publishedAt).toLocaleDateString('ar-SA')}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(128,128,128,0.04)', border: '1px solid rgba(128,128,128,0.1)', fontSize: '12px', color: 'var(--text3)' }}>
                  لا توجد تقارير مشابهة متاحة حالياً
                </div>
              )}
            </div>

            {/* ═══ NEWSLETTER CTA ═══ */}
            <div className="pdf-newsletter-wrap mt-8">
              <div className="pdf-newsletter">
                <div className="pdf-newsletter-header">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-head)' }}>لا تفوّت أي تقرير</h3>
                </div>
                <p className="text-[12px]" style={{ color: 'var(--text2)' }}>اشترك لتلقي أحدث التقارير والتحليلات مباشرة في بريدك الإلكتروني</p>
                <div className="mt-4">
                  <SubscribeForm />
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Sidebar Widgets — Desktop only ── */}
          <aside className="hidden lg:block w-[280px] flex-shrink-0">
            <div className="sticky top-24 flex flex-col gap-5">
              <SmartCouncilWidget locale="ar" />
              <MostReadWidget locale="ar" />
              <EconomicCalendarWidget locale="ar" />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

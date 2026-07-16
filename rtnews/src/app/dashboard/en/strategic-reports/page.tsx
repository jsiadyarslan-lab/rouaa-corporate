// ─── English Strategic Reports Dashboard ───────────────────────
// Same design as Arabic version but LTR, English UI, English options.
// Generates via /api/reports/generate with locale='en', type='special'

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Shield, Sparkles, Globe, TrendingUp, TrendingDown, Minus,
  Eye, RefreshCw, Loader2, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronUp, Clock, BarChart3, MapPin,
  Layers, CalendarDays, FileText, Zap, ArrowLeft,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────
interface StrategicReport {
  id: string;
  title: string;
  slug: string;
  summary: string;
  scope: string;
  marketImpact: string;
  confidenceScore: number;
  isPublished: boolean;
  createdAt: string;
}

interface JobStatus {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration: number;
  result?: { id: string; title: string; slug: string; confidence: number; published: boolean };
  error?: string;
}

// ─── Constants ─────────────────────────────────────────────
const REGION_OPTIONS = [
  { value: 'Arab World & Middle East', label: 'Arab World & Middle East', icon: '🌍' },
  { value: 'Arabian Gulf', label: 'Arabian Gulf', icon: '🏜️' },
  { value: 'North Africa', label: 'North Africa', icon: '🌴' },
  { value: 'Global', label: 'Global', icon: '🌐' },
  { value: 'United States & Europe', label: 'United States & Europe', icon: '🏛️' },
  { value: 'Asia Pacific', label: 'Asia Pacific', icon: '🌏' },
];

const SECTOR_OPTIONS = [
  { value: 'Macroeconomics', label: 'Macroeconomics' },
  { value: 'Equities', label: 'Equities' },
  { value: 'Energy', label: 'Energy' },
  { value: 'Forex', label: 'Forex' },
  { value: 'Cryptocurrencies', label: 'Cryptocurrencies' },
  { value: 'Commodities', label: 'Commodities' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Central Banks', label: 'Central Banks' },
  { value: 'Corporate Earnings', label: 'Corporate Earnings' },
  { value: 'Arab Markets', label: 'Arab Markets' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Politics', label: 'Politics' },
];

const SCENARIO_OPTIONS = [
  { value: 'Short-term (1-3 months)', label: 'Short-term (1-3 months)' },
  { value: 'Medium-term (6-12 months)', label: 'Medium-term (6-12 months)' },
  { value: 'Long-term (1-3 years)', label: 'Long-term (1-3 years)' },
  { value: 'Immediate (less than 1 month)', label: 'Immediate (less than 1 month)' },
  { value: 'Five Years', label: 'Five Years' },
];

const TOPIC_PRESETS = [
  'Impact of Trade Wars on Arab Markets',
  'Oil Price Forecasts and Their Effect on Gulf Economies',
  'The Future of Cryptocurrencies in the Arab Region',
  'Impact of US Interest Rate Hikes on Emerging Markets',
  'Green Transition and Renewable Energy Investment Opportunities',
  'Impact of AI on the Financial Services Sector',
  'Food Security and Investment in AgriTech',
  'Tourism & Entertainment: Growth Opportunities in the Middle East',
];

// ─── Main Component ────────────────────────────────────────
export default function EnStrategicReportsPage() {
  // Form state
  const [topic, setTopic] = useState('');
  const [region, setRegion] = useState('Global');
  const [selectedSectors, setSelectedSectors] = useState<string[]>(['Macroeconomics']);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([
    'Short-term (1-3 months)',
    'Medium-term (6-12 months)',
    'Long-term (1-3 years)',
  ]);
  const [publishOnComplete, setPublishOnComplete] = useState(true);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);

  // Reports list
  const [reports, setReports] = useState<StrategicReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPresetTopics, setShowPresetTopics] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');

  // ─── Fetch Reports ────────────────────────────────────────
  const fetchReports = useCallback(async () => {
    try {
      // V316: Use isPublished=all to show drafts too
      const res = await fetch('/api/en/reports?limit=50&isPublished=all');
      const data = await res.json();
      const items = data.reports || data.items || [];
      // Filter for strategic/special reports only (including drafts)
      const strategic = Array.isArray(items)
        ? items.filter((r: any) => r.reportType === 'special' || r.reportType === 'strategic')
        : [];
      setReports(strategic);
    } catch (err) {
      console.error('Failed to fetch English strategic reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // ─── Toggle Sector ────────────────────────────────────────
  const toggleSector = (sector: string) => {
    setSelectedSectors(prev =>
      prev.includes(sector)
        ? prev.filter(s => s !== sector)
        : [...prev, sector]
    );
  };

  const toggleScenario = (scenario: string) => {
    setSelectedScenarios(prev =>
      prev.includes(scenario)
        ? prev.filter(s => s !== scenario)
        : [...prev, scenario]
    );
  };

  // ─── Build English Strategic Prompt ──────────────────────
  const buildStrategicPrompt = (): string => {
    return `Write a comprehensive strategic analysis report in English.

Topic: ${topic.trim()}
Geographic Scope: ${region}
Sectors: ${selectedSectors.join(', ')}
Time Horizons: ${selectedScenarios.join(', ')}

The report MUST follow this exact structure:

## 1. Executive Summary
5 numbered bullet points — key quantitative analytical findings: percentages, figures, comparisons.

## 2. Introduction
A brief narrative paragraph (2-3 sentences, 60 words max): Who? What? Why does it matter now?
- Max 60 words — never exceed
- No bullet points — narrative only
- Start directly with the information — no filler

## 3. Context & Background
- Strategic significance with numbers
- Historical precedents if any
- Key stakeholders affected

## 4. Direct Economic Implications
Break down by the requested sectors only.
For each sector: Impact + Magnitude + Expected Duration.

## 5. Impact on Financial Markets
Mention indices and assets by their real names and tickers.
Do not mention numbers unless they are reliable.

## 6. Scenarios
For each requested time horizon:
- Assumptions
- Expected impact with percentage estimates
- What could change this scenario

## 7. Beneficiary & Vulnerable Assets
- Beneficiary assets: [Name] [Ticker] [Reason]
- Vulnerable assets: [Name] [Ticker] [Reason]
- Monitoring levels if data available

## 8. Strategic Recommendations
Objective academic analysis — what do the data say? With reference price levels.
- Written in neutral analyst voice with actionable numbers
- Explains logic and reasons in detail
- Does not address the reader directly
- Divided by: Individual / Institutional / Traders
- Each category must include: Direction + Reference assets + Approximate entry level + Target + Stop-loss
- Example: "Defense sector expected to benefit — Reference entry: $320 | Target: $350 | Stop: $305 | Horizon: 3 months"

## 9. Rou'a Recommendations
Actionable decisions — What to do NOW?

### Day Trader (1 week or less)
Quick trades with specific entry/exit levels.
Each recommendation MUST include: entry price + stop-loss + target + max duration

### Medium-term Investor (1-6 months)
Monthly investment plans with portfolio allocation percentages.
Each recommendation MUST include: portfolio % + approximate entry point + time horizon in months

### Long-term Investor (6+ months)
Structural strategies for building a portfolio over years.
Each recommendation MUST include: structural strategy + portfolio weight + re-evaluation point

## 10. Follow-up Indicators
5 specific indicators to monitor for updating this report.

## 11. Sources & References
Each source cited with date. Do not include sources not actually used.

---
Disclaimer: This is an analytical report for informational purposes only.`;
  };

  // ─── Generate Report ──────────────────────────────────────
  const handleGenerate = async () => {
    if (!topic.trim() || topic.trim().length < 3) {
      toast.error('Enter a report topic (at least 3 characters)');
      return;
    }
    if (selectedSectors.length === 0) {
      toast.error('Select at least one sector');
      return;
    }
    if (selectedScenarios.length === 0) {
      toast.error('Select at least one time horizon');
      return;
    }

    setGenerating(true);
    setJobId(null);
    setJobStatus(null);

    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'strategic',
          locale: 'en',
          force: true,
          async: true,
          publish: publishOnComplete,
          title: topic.trim(),
          prompt: buildStrategicPrompt(),
          // V316: Pass strategic report context for proper news filtering
          region: region,
          sectors: selectedSectors,
          scenarios: selectedScenarios,
        }),
      });

      const data = await res.json();
      if (data.success && data.jobId) {
        setJobId(data.jobId);
        toast.success('Strategic report generation started');
        pollJobStatus(data.jobId);
      } else {
        toast.error(data.error || 'Failed to start generation');
        setGenerating(false);
      }
    } catch (err) {
      console.error('Generate error:', err);
      toast.error('An error occurred during generation request');
      setGenerating(false);
    }
  };

  // ─── Poll Job Status ─────────────────────────────────────
  const pollJobStatus = useCallback(async (jId: string) => {
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/reports/generate?jobId=${jId}`);
        const data = await res.json();
        setJobStatus(data);

        if (data.status === 'completed') {
          clearInterval(interval);
          setGenerating(false);
          toast.success('Strategic report generated successfully!');
          fetchReports();
          setActiveTab('history');
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setGenerating(false);
          toast.error(`Generation failed: ${data.error || 'Unknown error'}`);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setGenerating(false);
          toast.error('Generation timed out');
        }
      } catch {
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setGenerating(false);
        }
      }
    }, 5000);
  }, [fetchReports]);

  // ─── Impact Badge ─────────────────────────────────────────
  const getImpactBadge = (impact: string) => {
    if (impact === 'bullish') return { icon: TrendingUp, label: 'Bullish', color: 'var(--bull)', bg: 'var(--bull2)' };
    if (impact === 'bearish') return { icon: TrendingDown, label: 'Bearish', color: 'var(--bear)', bg: 'var(--bear2)' };
    return { icon: Minus, label: 'Neutral', color: 'var(--gold)', bg: 'var(--gold2)' };
  };

  // ─── Render ───────────────────────────────────────────────
  return (
    <div dir="ltr" className="space-y-6">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-bold font-heading flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Shield size={22} style={{ color: 'var(--purple)' }} />
            Strategic Reports
          </h1>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>
            Deep analysis on specific topics — different from automated daily reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="text-[9px] gap-1" style={{
            background: 'rgba(139,92,246,0.1)', color: 'var(--purple)',
            border: '1px solid rgba(139,92,246,0.2)',
          }}>
            <Sparkles size={10} />
            Sonnet
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchReports} className="text-[11px] gap-1"
            style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
            <RefreshCw size={12} /> Refresh
          </Button>
        </div>
      </div>

      {/* ═══ Difference Banner ═══ */}
      <Card className="border-0" style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(0,229,255,0.03))',
        border: '1px solid rgba(139,92,246,0.12)',
      }}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
              <FileText size={14} style={{ color: 'var(--text3)' }} />
              <div>
                <div className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>Automated Reports</div>
                <div className="text-[9px]" style={{ color: 'var(--text4)' }}>Daily news aggregation</div>
              </div>
            </div>
            <div className="text-[12px] font-bold" style={{ color: 'var(--text4)' }}>→</div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Shield size={14} style={{ color: 'var(--purple)' }} />
              <div>
                <div className="text-[10px] font-bold" style={{ color: 'var(--purple)' }}>Strategic Reports</div>
                <div className="text-[9px]" style={{ color: 'var(--text4)' }}>Specific question + deep analysis</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Tab Navigation ═══ */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('generate')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold transition-all"
          style={{
            background: activeTab === 'generate' ? 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(0,229,255,0.05))' : 'var(--bg3)',
            border: `1px solid ${activeTab === 'generate' ? 'rgba(139,92,246,0.25)' : 'var(--border)'}`,
            color: activeTab === 'generate' ? 'var(--purple)' : 'var(--text3)',
            boxShadow: activeTab === 'generate' ? '0 2px 8px rgba(139,92,246,0.1)' : 'none',
          }}
        >
          <Sparkles size={15} /> Generate New Report
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold transition-all"
          style={{
            background: activeTab === 'history' ? 'var(--bg4)' : 'var(--bg3)',
            border: `1px solid ${activeTab === 'history' ? 'var(--border)' : 'var(--border)'}`,
            color: activeTab === 'history' ? 'var(--text)' : 'var(--text3)',
          }}
        >
          <Clock size={15} /> History ({reports.length})
        </button>
      </div>

      {/* ═══ Generation Status ═══ */}
      {generating && jobStatus && (
        <Card className="border-0" style={{
          background: jobStatus.status === 'completed'
            ? 'var(--bull2)' : jobStatus.status === 'failed'
            ? 'var(--bear2)' : 'rgba(139,92,246,0.04)',
          border: `1px solid ${jobStatus.status === 'completed'
            ? 'rgba(0,200,150,0.2)' : jobStatus.status === 'failed'
            ? 'rgba(255,77,106,0.2)' : 'rgba(139,92,246,0.15)'}`,
        }}>
          <CardContent className="p-4 flex items-center gap-3">
            {jobStatus.status === 'completed' ? (
              <CheckCircle2 size={24} style={{ color: 'var(--bull)' }} />
            ) : jobStatus.status === 'failed' ? (
              <AlertTriangle size={24} style={{ color: 'var(--bear)' }} />
            ) : (
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--purple)' }} />
            )}
            <div className="flex-1">
              <div className="text-[13px] font-bold" style={{
                color: jobStatus.status === 'completed' ? 'var(--bull)' : jobStatus.status === 'failed' ? 'var(--bear)' : 'var(--purple)',
              }}>
                {jobStatus.status === 'completed' ? 'Report generated successfully!'
                  : jobStatus.status === 'failed' ? 'Generation failed'
                  : jobStatus.status === 'running' ? 'AI generation in progress...'
                  : 'Queued...'}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text3)' }}>
                {jobStatus.status === 'completed' && jobStatus.result
                  ? `${jobStatus.result.title}`
                  : `Topic: ${topic} · Duration: ${Math.round((Date.now() - (jobStatus.duration || 0)) / 1000)}s`}
              </div>
            </div>
            {jobStatus.status === 'completed' && jobStatus.result && (
              <Link href={`/en/reports/${jobStatus.result.slug}`} target="_blank">
                <Button size="sm" className="text-[11px] gap-1" style={{ background: 'var(--bull)', color: 'white' }}>
                  <Eye size={12} /> View Report
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══ Generate Tab ═══ */}
      {activeTab === 'generate' && (
        <div className="space-y-4">
          {/* ── Topic Input ── */}
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Sparkles size={15} style={{ color: 'var(--purple)' }} />
                Topic
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Impact of Trade Wars on Arab Markets"
                rows={2}
                className="w-full px-4 py-3 rounded-xl text-[14px] resize-none"
                style={{
                  background: 'var(--bg4)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  outline: 'none',
                }}
              />
              <div className="flex items-center justify-between mt-2">
                <div className="text-[10px]" style={{ color: 'var(--text4)' }}>
                  {topic.length} characters — Enter a specific topic for strategic analysis
                </div>
                <button
                  onClick={() => setShowPresetTopics(!showPresetTopics)}
                  className="text-[10px] font-bold flex items-center gap-1 px-2 py-1 rounded-md"
                  style={{ color: 'var(--purple)', background: 'rgba(139,92,246,0.06)' }}
                >
                  {showPresetTopics ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  Suggested topics
                </button>
              </div>
              {showPresetTopics && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  {TOPIC_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => { setTopic(preset); setShowPresetTopics(false); }}
                      className="text-[11px] text-left px-3 py-2.5 rounded-lg transition-all hover:scale-[1.01]"
                      style={{
                        background: topic === preset ? 'rgba(139,92,246,0.1)' : 'var(--bg4)',
                        border: `1px solid ${topic === preset ? 'rgba(139,92,246,0.25)' : 'var(--border)'}`,
                        color: topic === preset ? 'var(--purple)' : 'var(--text2)',
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Region & Sectors ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Region */}
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <MapPin size={15} style={{ color: 'var(--cyan)' }} />
                  Geographic Scope
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {REGION_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setRegion(opt.value)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-[12px] text-left transition-all"
                      style={{
                        background: region === opt.value ? 'rgba(0,229,255,0.08)' : 'var(--bg4)',
                        border: `1px solid ${region === opt.value ? 'rgba(0,229,255,0.25)' : 'var(--border)'}`,
                        color: region === opt.value ? 'var(--cyan)' : 'var(--text2)',
                      }}
                    >
                      <span>{opt.icon}</span>
                      <span className="font-semibold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sectors */}
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <Layers size={15} style={{ color: 'var(--gold)' }} />
                  Sectors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {SECTOR_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => toggleSector(opt.value)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                      style={{
                        background: selectedSectors.includes(opt.value) ? 'rgba(255,184,0,0.1)' : 'var(--bg4)',
                        border: `1px solid ${selectedSectors.includes(opt.value) ? 'rgba(255,184,0,0.25)' : 'var(--border)'}`,
                        color: selectedSectors.includes(opt.value) ? 'var(--gold)' : 'var(--text3)',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Scenarios ── */}
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <CalendarDays size={15} style={{ color: 'var(--bull)' }} />
                Time Horizons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {SCENARIO_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => toggleScenario(opt.value)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                    style={{
                      background: selectedScenarios.includes(opt.value) ? 'rgba(0,200,150,0.1)' : 'var(--bg4)',
                      border: `1px solid ${selectedScenarios.includes(opt.value) ? 'rgba(0,200,150,0.25)' : 'var(--border)'}`,
                      color: selectedScenarios.includes(opt.value) ? 'var(--bull)' : 'var(--text3)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Generate Button ── */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-[11px] cursor-pointer" style={{ color: 'var(--text3)' }}>
                <input
                  type="checkbox"
                  checked={publishOnComplete}
                  onChange={(e) => setPublishOnComplete(e.target.checked)}
                  className="rounded"
                />
                Auto-publish after generation
              </label>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generating || !topic.trim()}
              className="text-[13px] font-bold gap-2 px-8 py-3 h-auto"
              style={{
                background: generating
                  ? 'var(--bg4)'
                  : 'linear-gradient(135deg, #8B5CF6, #00E5FF)',
                color: generating ? 'var(--text3)' : 'white',
                boxShadow: generating ? 'none' : '0 4px 16px rgba(139,92,246,0.3)',
              }}
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Shield size={16} />
                  Generate Strategic Report
                </>
              )}
            </Button>
          </div>

          {/* Prompt Preview */}
          <Card className="border-0" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={12} style={{ color: 'var(--purple)' }} />
                <span className="text-[11px] font-bold" style={{ color: 'var(--text3)' }}>Request Summary</span>
              </div>
              <div className="space-y-1 text-[11px]" style={{ color: 'var(--text3)' }}>
                <div>Topic: <span style={{ color: 'var(--text)' }}>{topic || '—'}</span></div>
                <div>Region: <span style={{ color: 'var(--cyan)' }}>{region}</span></div>
                <div>Sectors: <span style={{ color: 'var(--gold)' }}>{selectedSectors.join(', ')}</span></div>
                <div>Horizons: <span style={{ color: 'var(--bull)' }}>{selectedScenarios.join(', ')}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ History Tab ═══ */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {loading ? (
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardContent className="p-8 text-center">
                <Loader2 size={24} className="animate-spin mx-auto mb-3" style={{ color: 'var(--purple)' }} />
                <span className="text-[12px]" style={{ color: 'var(--text3)' }}>Loading reports...</span>
              </CardContent>
            </Card>
          ) : reports.length === 0 ? (
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardContent className="p-8 text-center">
                <Shield size={32} style={{ color: 'var(--text4)', margin: '0 auto 12px' }} />
                <p className="text-[13px] font-bold" style={{ color: 'var(--text3)' }}>No strategic reports yet</p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text4)' }}>
                  Create your first strategic report from the Generate tab
                </p>
                <Button
                  onClick={() => setActiveTab('generate')}
                  variant="outline"
                  size="sm"
                  className="text-[11px] gap-1 mt-3"
                  style={{ borderColor: 'var(--border)', color: 'var(--purple)' }}
                >
                  <Sparkles size={12} /> Generate Report
                </Button>
              </CardContent>
            </Card>
          ) : (
            reports.map(report => {
              const impact = getImpactBadge(report.marketImpact);
              const ImpactIcon = impact.icon;
              return (
                <Card key={report.id} className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield size={14} style={{ color: 'var(--purple)' }} />
                          <Link
                            href={`/en/reports/${report.slug}`}
                            target="_blank"
                            className="text-[13px] font-bold hover:underline"
                            style={{ color: 'var(--text)', textDecoration: 'none' }}
                          >
                            {report.title}
                          </Link>
                        </div>
                        {report.summary && (
                          <p className="text-[11px] mt-1 line-clamp-2" style={{ color: 'var(--text3)' }}>
                            {report.summary.slice(0, 200)}{report.summary.length > 200 ? '...' : ''}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <Badge className="text-[8px]" style={{
                            background: impact.bg, color: impact.color,
                            border: `1px solid ${impact.color}20`,
                          }}>
                            <ImpactIcon size={9} className="inline" /> {impact.label}
                          </Badge>
                          <Badge className="text-[8px]" style={{
                            background: 'var(--bg4)', color: 'var(--text3)', border: '1px solid var(--border)',
                          }}>
                            Confidence: {report.confidenceScore}%
                          </Badge>
                          <Badge className="text-[8px]" style={{
                            background: report.isPublished ? 'var(--bull2)' : 'var(--gold2)',
                            color: report.isPublished ? 'var(--bull)' : 'var(--gold)',
                            border: `1px solid ${report.isPublished ? 'rgba(0,200,150,0.2)' : 'rgba(255,184,0,0.2)'}`,
                          }}>
                            {report.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                          <span className="text-[9px]" style={{ color: 'var(--text4)' }}>
                            {new Date(report.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                      <Link href={`/en/reports/${report.slug}`} target="_blank">
                        <Button variant="outline" size="sm" className="text-[10px] gap-1 h-8"
                          style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
                          <Eye size={12} /> View
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

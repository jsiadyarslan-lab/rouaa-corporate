// ─── Turkish Stock Analysis Pipeline Page ────────────────────
// Locale-specific pipeline controls and analysis listing

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  Play, RefreshCw, Loader2, TrendingUp, TrendingDown, Minus,
  Activity, ArrowUpRight, ArrowDownRight, Clock, Database,
  CheckCircle2, XCircle, Flame, BarChart3,
} from 'lucide-react';

const LOCALE = 'tr';
const LOCALE_INFO = { flag: '🇹🇷', label: 'Türkçe İşlem Hatları', color: '#E53935' };

interface AnalysisItem {
  id: string; symbol: string; slug: string; title: string; summary: string;
  price: number; change: number; changePercent: number; overallSignal: string;
  overallScore: number; confidenceScore: number; riskLevel: string;
  marketType: string; createdAt: string;
}

function formatPrice(val: number): string {
  if (val >= 1000) return val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (val >= 1) return val.toFixed(2);
  return val.toFixed(4);
}

function formatTimeAgo(dateStr: string) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (isNaN(diff) || diff < 0) return 'şimdi';
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'şimdi';
    if (mins < 60) return `${mins}dk önce`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}sa önce`;
    return `${Math.floor(hours / 24)}g önce`;
  } catch { return 'şimdi'; }
}

function getSignalStyle(signal: string) {
  if (signal === 'bullish') return { bg: 'rgba(0,200,150,0.12)', color: 'var(--bull)', label: 'Yükseliş', icon: TrendingUp };
  if (signal === 'bearish') return { bg: 'rgba(255,77,106,0.12)', color: 'var(--bear)', label: 'Düşüş', icon: TrendingDown };
  return { bg: 'rgba(100,116,139,0.12)', color: 'var(--text3)', label: 'Nötr', icon: Minus };
}

export default function TrStockAnalysisPage() {
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [maxStocks, setMaxStocks] = useState([5]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stock-analysis?action=list&locale=${LOCALE}&page=${page}&limit=20`);
      const data = await res.json();
      if (data.analyses) { setAnalyses(data.analyses); setTotal(data.total ?? 0); }
    } catch (err) {
      console.error('[TrStock] Fetch error:', err);
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRunPipeline = async () => {
    setRunning(true); setResult(null);
    try {
      const res = await fetch(`/api/stock-analysis?action=run&locale=${LOCALE}&maxStocks=${maxStocks[0]}`);
      const data = await res.json();
      setResult({
        success: res.ok,
        message: res.ok
          ? `${data.result?.generated ?? 0} analiz oluşturuldu, ${data.result?.published ?? 0} yayınlandı`
          : `Başarısız: ${data.error || data.message || 'Bilinmeyen hata'}`,
      });
      setTimeout(fetchData, 2000);
    } catch { setResult({ success: false, message: 'Bağlantı başarısız' }); }
    finally { setTimeout(() => setRunning(false), 1500); }
  };

  const trackedSymbols = [...new Set(analyses.map(a => a.symbol))];
  const signalCounts = analyses.reduce((acc, a) => { acc[a.overallSignal] = (acc[a.overallSignal] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[26px]">{LOCALE_INFO.flag}</span>
          <div>
            <h1 className="text-[22px] font-bold font-heading" style={{ color: 'var(--text)' }}>{LOCALE_INFO.label}</h1>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text3)' }}>Hisse analizi işlem hattı — {total} analiz</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchData} className="gap-1.5" style={{ color: 'var(--text2)' }}>
          <RefreshCw size={13} /> Yenile
        </Button>
      </div>

      {/* Pipeline Controls */}
      <Card className="border-0 overflow-hidden relative" style={{
        background: `linear-gradient(135deg, ${LOCALE_INFO.color}10 0%, ${LOCALE_INFO.color}03 100%)`,
        border: `1px solid ${LOCALE_INFO.color}20`,
      }}>
        <div className="absolute top-0 left-0 w-full h-[2px] opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${LOCALE_INFO.color}, transparent)` }} />
        <CardContent className="p-4 md:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold" style={{ color: 'var(--text3)' }}>Maks hisse</span>
                <span className="font-mono-price text-[14px] font-bold" style={{ color: LOCALE_INFO.color }}>{maxStocks[0]}</span>
              </div>
              <Slider value={maxStocks} onValueChange={setMaxStocks} min={1} max={15} step={1} className="w-full" />
              <div className="flex justify-between mt-1">
                <span className="text-[9px]" style={{ color: 'var(--text4)' }}>1</span>
                <span className="text-[9px]" style={{ color: 'var(--text4)' }}>15</span>
              </div>
            </div>
            <Button
              onClick={handleRunPipeline}
              disabled={running}
              className="gap-2 text-[13px] font-bold h-10 px-6 rounded-lg"
              style={{ background: `${LOCALE_INFO.color}18`, color: LOCALE_INFO.color, border: `1px solid ${LOCALE_INFO.color}30` }}
            >
              {running ? <><Loader2 size={16} className="animate-spin" /> Devam ediyor...</> : <><Play size={16} /> İşlem hattını başlat</>}
            </Button>
          </div>
          {result && (
            <div className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold" style={{
              background: result.success ? 'rgba(0,200,150,0.10)' : 'rgba(255,77,106,0.10)',
              color: result.success ? 'var(--bull)' : 'var(--bear)',
            }}>
              {result.success ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              {result.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-0" style={{ background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.12)' }}>
          <CardContent className="p-3 text-center">
            <span className="font-mono-price text-[22px] font-bold" style={{ color: 'var(--bull)' }}>{signalCounts.bullish ?? 0}</span>
            <span className="text-[10px] block mt-1" style={{ color: 'var(--text3)' }}>Yükseliş</span>
          </CardContent>
        </Card>
        <Card className="border-0" style={{ background: 'rgba(255,77,106,0.06)', border: '1px solid rgba(255,77,106,0.12)' }}>
          <CardContent className="p-3 text-center">
            <span className="font-mono-price text-[22px] font-bold" style={{ color: 'var(--bear)' }}>{signalCounts.bearish ?? 0}</span>
            <span className="text-[10px] block mt-1" style={{ color: 'var(--text3)' }}>Düşüş</span>
          </CardContent>
        </Card>
        <Card className="border-0" style={{ background: 'rgba(100,116,139,0.06)', border: '1px solid rgba(100,116,139,0.12)' }}>
          <CardContent className="p-3 text-center">
            <span className="font-mono-price text-[22px] font-bold" style={{ color: 'var(--text3)' }}>{signalCounts.neutral ?? 0}</span>
            <span className="text-[10px] block mt-1" style={{ color: 'var(--text3)' }}>Nötr</span>
          </CardContent>
        </Card>
        <Card className="border-0" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}>
          <CardContent className="p-3 text-center">
            <span className="font-mono-price text-[22px] font-bold" style={{ color: '#8B5CF6' }}>{trackedSymbols.length}</span>
            <span className="text-[10px] block mt-1" style={{ color: 'var(--text3)' }}>Semboller</span>
          </CardContent>
        </Card>
      </div>

      {/* Tracked Symbols */}
      {trackedSymbols.length > 0 && (
        <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={14} style={{ color: LOCALE_INFO.color }} />
              <span className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>Takip edilen semboller</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {trackedSymbols.map(sym => (
                <Badge key={sym} className="font-mono-price text-[11px] px-2.5 py-1" style={{ background: `${LOCALE_INFO.color}15`, color: LOCALE_INFO.color, border: `1px solid ${LOCALE_INFO.color}25` }}>
                  {sym}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Latest Analyses */}
      <div className="flex items-center gap-2">
        <BarChart3 size={14} style={{ color: LOCALE_INFO.color }} />
        <h2 className="text-[14px] font-bold font-heading" style={{ color: 'var(--text)' }}>Son analizler</h2>
      </div>
      <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--text4)' }} /></div>
          ) : analyses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Database size={32} style={{ color: 'var(--text4)' }} />
              <span className="text-[13px]" style={{ color: 'var(--text3)' }}>Analiz bulunamadı. Yukarıdaki işlem hattını başlatın.</span>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div>
                {analyses.map((a) => {
                  const sig = getSignalStyle(a.overallSignal);
                  const SigIcon = sig.icon;
                  const isPositive = a.changePercent >= 0;
                  return (
                    <div key={a.id} className="flex items-center gap-3 px-4 py-3 border-b transition-colors hover:bg-[var(--cyan3)]" style={{ borderColor: 'var(--border)' }}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sig.color }} />
                      <div className="w-20 flex-shrink-0">
                        <span className="font-mono-price text-[13px] font-bold" style={{ color: 'var(--text)' }}>{a.symbol}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[12px] truncate block" style={{ color: 'var(--text2)' }}>{a.title}</span>
                      </div>
                      <div className="w-20 text-right flex-shrink-0">
                        <span className="font-mono-price text-[12px] font-bold" style={{ color: 'var(--text)' }}>${formatPrice(a.price)}</span>
                      </div>
                      <div className="w-16 text-right flex-shrink-0 flex items-center justify-end gap-0.5">
                        {isPositive ? <ArrowUpRight size={10} style={{ color: 'var(--bull)' }} /> : <ArrowDownRight size={10} style={{ color: 'var(--bear)' }} />}
                        <span className="font-mono-price text-[11px] font-bold" style={{ color: isPositive ? 'var(--bull)' : 'var(--bear)' }}>
                          {isPositive ? '+' : ''}{a.changePercent.toFixed(2)}%
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: sig.bg, color: sig.color }}>
                        <SigIcon size={9} /> {sig.label}
                      </span>
                      <div className="w-20 text-right flex-shrink-0">
                        <span className="text-[10px]" style={{ color: 'var(--text4)' }}>{formatTimeAgo(a.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} style={{ color: 'var(--text2)' }}>Önceki</Button>
          <span className="text-[11px]" style={{ color: 'var(--text3)' }}>Sayfa {page} / {Math.ceil(total / 20)}</span>
          <Button variant="ghost" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)} style={{ color: 'var(--text2)' }}>Sonraki</Button>
        </div>
      )}
    </div>
  );
}

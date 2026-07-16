// ─── Turkish Video Reports Management Dashboard ─────────────────
// Dedicated page for generating and managing economic report videos
// Bloomberg-style videos with Turkish voiceover, fully automated

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Video, Play, RefreshCw, FileText, Loader2, CheckCircle2,
  XCircle, Clock, Sparkles, TrendingUp, TrendingDown, Minus,
  AlertTriangle, Download, ExternalLink, Trash2, Eye, EyeOff, Pencil,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────
interface ReportItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  reportType: string;
  marketImpact: string;
  confidenceScore: number;
  isPublished: boolean;
  createdAt: string;
}

interface VideoItem {
  id: string;
  title: string;
  slug: string;
  symbol: string;
  assetName: string;
  locale: string;
  reportType: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  status: string;
  error: string | null;
  isPublished: boolean;
  sourceReportId: string | null;
  sourceType: string | null;
  createdAt: string;
}

// ─── Constants ─────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  daily: 'Günlük',
  weekly: 'Haftalık',
  monthly: 'Aylık',
  quarterly: 'Üç Aylık',
  special: 'Özel',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  pending: { label: 'Beklemede', color: '#FFB800', icon: Clock, bg: 'rgba(255,184,0,0.1)' },
  processing: { label: 'İşleniyor', color: '#8B5CF6', icon: Loader2, bg: 'rgba(139,92,246,0.1)' },
  completed: { label: 'Tamamlandı', color: '#22C55E', icon: CheckCircle2, bg: 'rgba(34,197,94,0.1)' },
  failed: { label: 'Başarısız', color: '#EF5350', icon: XCircle, bg: 'rgba(239,83,80,0.1)' },
};

// ─── Main Component ────────────────────────────────────────
export default function TrVideosPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'generate' | 'library' | 'geopolitical'>('generate');
  const [videoStyle, setVideoStyle] = useState<'pulse' | 'dataviz' | 'gold' | 'observatory' | 'ai'>('gold');
  const [videoFormat, setVideoFormat] = useState<'landscape' | 'vertical' | 'square'>('landscape');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const pollingRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const [geoRisks, setGeoRisks] = useState<any[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    return () => {
      Object.values(pollingRef.current).forEach(clearInterval);
    };
  }, []);

  // ─── Fetch Data ────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reportsRes, videosRes] = await Promise.all([
        fetch('/api/tr/reports?limit=50'),
        fetch('/api/video/list?locale=tr&admin=true'),
      ]);

      const reportsData = await reportsRes.json();
      const videosData = await videosRes.json();

      const reportList = reportsData.reports || reportsData.items || [];
      setReports(Array.isArray(reportList) ? reportList : []);
      if (videosData.videos) setVideos(videosData.videos);
    } catch (err) {
      console.error('Veri yüklenemedi:', err);
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData();
    fetchGeoRisks(); }, [fetchData]);

  // Fix legacy video URLs
  const fixVideoUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('/generated/videos/')) {
      return url.replace('/generated/videos/', '/api/video/serve/');
    }
    return url;
  };

  // Map of report IDs that already have videos
  const reportVideoMap = new Map<string, VideoItem>();
  videos.forEach(v => {
    if (v.sourceReportId) reportVideoMap.set(v.sourceReportId, v);
  });

  // ─── Video Generation with Status Polling ───
  const handleGenerate = async (report: ReportItem) => {
    if (generatingIds.has(report.id)) return;

    setGeneratingIds(prev => new Set(prev).add(report.id));
    setProgressMap(prev => ({ ...prev, [report.id]: 5 }));

    let p = 5;
    const simInterval = setInterval(() => {
      p = Math.min(p + Math.random() * 3, 25);
      setProgressMap(prev => ({ ...prev, [report.id]: Math.round(p) }));
    }, 1500);

    try {
      const res = await fetch('/api/video/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceReportId: report.id,
          sourceType: 'economic_report',
          locale: 'tr',
          title: report.title,
          style: videoStyle, rendererStyle: videoStyle, videoFormat: videoFormat,
        }),
      });

      clearInterval(simInterval);

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.videoId) {
          toast.info('Video oluşturma başladı — lütfen bekleyin...');
          setProgressMap(prev => ({ ...prev, [report.id]: 30 }));
          startPollingVideoStatus(data.videoId, report.id);
        } else {
          toast.error(data.error || 'Video oluşturma başlatılamadı');
          setGeneratingIds(prev => { const n = new Set(prev); n.delete(report.id); return n; });
          setProgressMap(prev => { const n = { ...prev }; delete n[report.id]; return n; });
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Video oluşturma başarısız');
        setGeneratingIds(prev => { const n = new Set(prev); n.delete(report.id); return n; });
        setProgressMap(prev => { const n = { ...prev }; delete n[report.id]; return n; });
      }
    } catch (err) {
      clearInterval(simInterval);
      toast.error('Video oluşturma hizmeti kullanılamıyor');
      setGeneratingIds(prev => { const n = new Set(prev); n.delete(report.id); return n; });
      setProgressMap(prev => { const n = { ...prev }; delete n[report.id]; return n; });
    }
  };

  const startPollingVideoStatus = (videoId: string, reportId: string) => {
    if (pollingRef.current[reportId]) {
      clearInterval(pollingRef.current[reportId]);
    }

    let elapsed = 0;
    const POLL_INTERVAL = 8000;
    const MAX_POLL_TIME = 15 * 60 * 1000;

    pollingRef.current[reportId] = setInterval(async () => {
      elapsed += POLL_INTERVAL;
      if (elapsed > MAX_POLL_TIME) {
        clearInterval(pollingRef.current[reportId]);
        delete pollingRef.current[reportId];
        toast.error('Video oluşturma zaman aşımına uğradı');
        setGeneratingIds(prev => { const n = new Set(prev); n.delete(reportId); return n; });
        setProgressMap(prev => { const n = { ...prev }; delete n[reportId]; return n; });
        return;
      }

      try {
        const res = await fetch(`/api/video/${videoId}`);
        if (!res.ok) return;
        const data = await res.json();

        const videoStatus = data.video?.status || data.status;
        const videoError = data.video?.error || data.error;

        const progressPct = Math.min(30 + (elapsed / MAX_POLL_TIME) * 65, 95);
        setProgressMap(prev => ({ ...prev, [reportId]: Math.round(progressPct) }));

        if (videoStatus === 'completed') {
          clearInterval(pollingRef.current[reportId]);
          delete pollingRef.current[reportId];
          setProgressMap(prev => ({ ...prev, [reportId]: 100 }));
          toast.success('Video başarıyla oluşturuldu!');
          setTimeout(() => {
            fetchData();
            setGeneratingIds(prev => { const n = new Set(prev); n.delete(reportId); return n; });
            setProgressMap(prev => { const n = { ...prev }; delete n[reportId]; return n; });
          }, 1000);
        } else if (videoStatus === 'failed') {
          clearInterval(pollingRef.current[reportId]);
          delete pollingRef.current[reportId];
          toast.error(`Video oluşturma başarısız: ${videoError || 'Bilinmeyen hata'}`);
          setGeneratingIds(prev => { const n = new Set(prev); n.delete(reportId); return n; });
          setProgressMap(prev => { const n = { ...prev }; delete n[reportId]; return n; });
          fetchData();
        }
      } catch {
        // Network error — continue polling
      }
    }, POLL_INTERVAL);
  };

  // ─── Stats ─────────────────────────────────────────────
  const stats = {
    totalReports: reports.length,
    withVideo: reports.filter(r => reportVideoMap.has(r.id)).length,
    totalVideos: videos.length,
    completedVideos: videos.filter(v => v.status === 'completed').length,
    failedVideos: videos.filter(v => v.status === 'failed').length,
  };

  // ─── Delete Video ─────────────────────────────────────
  const handleDeleteVideo = async (videoId: string) => {
    if (deletingIds.has(videoId)) return;
    if (!confirm('Bu videoyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) return;

    setDeletingIds(prev => new Set(prev).add(videoId));
    try {
      const res = await fetch(`/api/video/${videoId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Video başarıyla silindi');
        setVideos(prev => prev.filter(v => v.id !== videoId));
      } else {
        toast.error(data.error || 'Silme başarısız');
      }
    } catch {
      toast.error('Silme başarısız');
    } finally {
      setDeletingIds(prev => { const n = new Set(prev); n.delete(videoId); return n; });
    }
  };

  // ─── Toggle Video Visibility (Show/Hide publicly) ────
  const handleTogglePublish = async (videoId: string, currentlyPublished: boolean) => {
    if (togglingIds.has(videoId)) return;
    setTogglingIds(prev => new Set(prev).add(videoId));
    try {
      const res = await fetch(`/api/video/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !currentlyPublished }),
      });
      const data = await res.json();
      if (data.success) {
        setVideos(prev => prev.map(v => v.id === videoId ? { ...v, isPublished: !currentlyPublished } : v));
        toast.success(!currentlyPublished ? 'Video artık herkese acik' : 'Video herkese acik siteden gizlendi');
      } else {
        toast.error(data.error || 'Gorunurluk guncellenemedi');
      }
    } catch {
      toast.error('Gorunurluk guncellenemedi');
    } finally {
      setTogglingIds(prev => { const n = new Set(prev); n.delete(videoId); return n; });
    }
  };

  // ─── Edit Video Title ─────────────────────────────────
  const handleSaveEdit = async (videoId: string) => {
    if (!editTitle.trim()) return;
    try {
      const res = await fetch(`/api/video/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Video başarıyla güncellendi');
        setVideos(prev => prev.map(v => v.id === videoId ? { ...v, title: editTitle.trim() } : v));
        setEditingId(null);
      } else {
        toast.error(data.error || 'Güncelleme başarısız');
      }
    } catch {
      toast.error('Güncelleme başarısız');
    }
  };

  // ─── Impact icon helper ────────────────────────────────
  const getImpactDisplay = (impact: string) => {
    if (impact === 'bullish') return { icon: TrendingUp, color: 'var(--bull)', label: 'Yükseliş' };
    if (impact === 'bearish') return { icon: TrendingDown, color: 'var(--bear)', label: 'Düşüş' };
    return { icon: Minus, color: 'var(--gold)', label: 'Nötr' };
  };

// ─── Fetch geopolitical risks ────────────────────────
  const fetchGeoRisks = useCallback(async () => {
    setGeoLoading(true);
    try {
      const res = await fetch('/api/geopolitical-risks?locale=tr&limit=50');
      const data = await res.json();
      const list = data?.data ?? [];
      setGeoRisks(list);
    } catch (err) {
      console.error('Failed to fetch geo risks:', err);
    } finally {
      setGeoLoading(false);
    }
  }, []);

  // ─── Generate video from geopolitical risk ────────────
  const handleGenerateGeoVideo = async (risk: any) => {
    if (generatingIds.has(risk.id)) return;

    setGeneratingIds(prev => new Set(prev).add(risk.id));
    setProgressMap(prev => ({ ...prev, [risk.id]: 5 }));

    let p = 5;
    const simInterval = setInterval(() => {
      p = Math.min(p + Math.random() * 3, 25);
      setProgressMap(prev => ({ ...prev, [risk.id]: Math.round(p) }));
    }, 1500);

    try {
      const res = await fetch('/api/video/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceReportId: risk.id,
          sourceType: 'geopolitical_risk',
          locale: 'tr',
          title: risk.title,
          style: videoStyle, rendererStyle: videoStyle, videoFormat: videoFormat,
        }),
      });

      clearInterval(simInterval);

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.videoId) {
          toast.info(`Jeopolitik risk videosu olusturulmaya baslandi`);
          setProgressMap(prev => ({ ...prev, [risk.id]: 30 }));
          startPollingVideoStatus(data.videoId, risk.id);
        } else {
          toast.error(data.error || 'فشل بدء توليد الفيديو');
          setGeneratingIds(prev => { const n = new Set(prev); n.delete(risk.id); return n; });
          setProgressMap(prev => { const n = { ...prev }; delete n[risk.id]; return n; });
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'فشل توليد الفيديو');
        setGeneratingIds(prev => { const n = new Set(prev); n.delete(risk.id); return n; });
        setProgressMap(prev => { const n = { ...prev }; delete n[risk.id]; return n; });
      }
    } catch (err) {
      clearInterval(simInterval);
      toast.error('خدمة توليد الفيديو غير متاحة');
      setGeneratingIds(prev => { const n = new Set(prev); n.delete(risk.id); return n; });
      setProgressMap(prev => { const n = { ...prev }; delete n[risk.id]; return n; });
    }
  };

  // ─── Delete Video ─────────────────────────────────────
  // ─── Render ─────────────────────────────────────────────
  return (
    <div dir="ltr" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ═══ HEADER ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Video size={22} style={{ color: '#8b5cf6' }} />
            Rapor video oluşturma
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 10,
              background: 'rgba(139,92,246,0.1)', color: '#8b5cf6',
              border: '1px solid rgba(139,92,246,0.2)', fontWeight: 700,
            }}>V322</span>
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>
            Türkçe seslendirme ile otomatik ekonomik video oluşturma — %100 ücretsiz
          </p>
        </div>
        <button
          onClick={fetchData}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '8px',
            background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)',
            color: 'var(--text2)', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Yenile
        </button>
      </div>

      {/* ═══ STYLE SELECTOR ═══ */}
      <div style={{
        padding: '12px 16px', borderRadius: '10px',
        background: 'var(--bg3)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text2)' }}>Video stili:</span>
        <div style={{ display: 'flex', gap: '0', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setVideoStyle('pulse')}
            style={{
              padding: '8px 16px', fontSize: '12px', fontWeight: 600,
              background: videoStyle === 'pulse' ? 'rgba(139,92,246,0.15)' : 'transparent',
              border: 'none', borderRight: '1px solid var(--border)',
              color: videoStyle === 'pulse' ? '#8b5cf6' : 'var(--text3)',
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <span style={{ fontSize: '14px' }}>&#9889;</span>
            Pulse — Bloomberg
          </button>
          <button
            onClick={() => setVideoStyle('dataviz')}
            style={{
              padding: '8px 16px', fontSize: '12px', fontWeight: 600,
              background: videoStyle === 'dataviz' ? 'rgba(6,182,212,0.15)' : 'transparent',
              border: 'none',
              color: videoStyle === 'dataviz' ? '#06B6D4' : 'var(--text3)',
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <span style={{ fontSize: '14px' }}>&#128202;</span>
            DataViz — Al Jazeera
          </button>
          <button
            onClick={() => setVideoStyle('gold')}
            style={{
              padding: '8px 16px', fontSize: '12px', fontWeight: 600,
              background: videoStyle === 'gold' ? 'rgba(212,175,55,0.15)' : 'transparent',
              border: 'none', borderLeft: '1px solid var(--border)',
              color: videoStyle === 'gold' ? '#d4af37' : 'var(--text3)',
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <span style={{ fontSize: '14px' }}>&#11088;</span>
            Gold — Professional
          </button>
          <button
            onClick={() => setVideoStyle('observatory')}
            style={{
              padding: '8px 16px', fontSize: '12px', fontWeight: 600,
              background: videoStyle === 'observatory' ? 'rgba(212,175,55,0.15)' : 'transparent',
              border: 'none', borderLeft: '1px solid var(--border)',
              color: videoStyle === 'observatory' ? '#d4af37' : 'var(--text3)',
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <span style={{ fontSize: '14px' }}>&#128302;</span>
            Observatory — Terminal
          </button>
          <button
            onClick={() => setVideoStyle('ai')}
            style={{
              padding: '8px 16px', fontSize: '12px', fontWeight: 600,
              background: videoStyle === 'ai' ? 'rgba(16,185,129,0.15)' : 'transparent',
              border: 'none', borderLeft: '1px solid var(--border)',
              color: videoStyle === 'ai' ? '#10b981' : 'var(--text3)',
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <span style={{ fontSize: '14px' }}>&#129502;</span>
            AI — Akıllı Motor
          </button>
        </div>
        <span style={{
          fontSize: '10px', padding: '2px 8px', borderRadius: '6px',
          background: videoStyle === 'pulse' ? 'rgba(139,92,246,0.08)' : videoStyle === 'gold' ? 'rgba(212,175,55,0.08)' : videoStyle === 'observatory' ? 'rgba(212,175,55,0.08)' : videoStyle === 'ai' ? 'rgba(16,185,129,0.08)' : 'rgba(6,182,212,0.08)',
          color: videoStyle === 'pulse' ? '#8b5cf6' : videoStyle === 'gold' ? '#d4af37' : videoStyle === 'observatory' ? '#d4af37' : videoStyle === 'ai' ? '#10b981' : '#06B6D4',
          border: `1px solid ${videoStyle === 'pulse' ? 'rgba(139,92,246,0.2)' : videoStyle === 'gold' ? 'rgba(212,175,55,0.2)' : videoStyle === 'observatory' ? 'rgba(212,175,55,0.2)' : videoStyle === 'ai' ? 'rgba(16,185,129,0.2)' : 'rgba(6,182,212,0.2)'}`,
        }}>
          {videoStyle === 'pulse' ? 'AI fonlu 6 atım' : videoStyle === 'observatory' ? '8 benzersiz terminal tarzı profesyonel sahne' : videoStyle === 'ai' ? 'LLM motoru ile 6 sinematik sahne' : 'animasyonlu grafikli 5 sahne'}
        </span>
      {/* Format selector */}
      <div style={{
        padding: '12px 16px', borderRadius: '10px',
        background: 'var(--bg3)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text2)' }}>Format:</span>
        <div style={{ display: 'flex', gap: '0', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setVideoFormat('landscape')}
            style={{
              padding: '8px 16px', fontSize: '12px', fontWeight: 600,
              background: videoFormat === 'landscape' ? 'rgba(96,165,250,0.15)' : 'transparent',
              border: 'none', borderRight: '1px solid var(--border)',
              color: videoFormat === 'landscape' ? '#60a5fa' : 'var(--text3)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            📺 Yatay 16:9
          </button>
          <button
            onClick={() => setVideoFormat('vertical')}
            style={{
              padding: '8px 16px', fontSize: '12px', fontWeight: 600,
              background: videoFormat === 'vertical' ? 'rgba(96,165,250,0.15)' : 'transparent',
              border: 'none', borderRight: '1px solid var(--border)',
              color: videoFormat === 'vertical' ? '#60a5fa' : 'var(--text3)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            📱 Dikey 9:16
          </button>
          <button
            onClick={() => setVideoFormat('square')}
            style={{
              padding: '8px 16px', fontSize: '12px', fontWeight: 600,
              background: videoFormat === 'square' ? 'rgba(96,165,250,0.15)' : 'transparent',
              border: 'none',
              color: videoFormat === 'square' ? '#60a5fa' : 'var(--text3)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            ⬜ Kare 1:1
          </button>
        </div>
      </div>
      </div>

      {/* ═══ STATS CARDS ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Yayınlanan raporlar', value: stats.totalReports, icon: FileText, color: 'var(--cyan)', bg: 'var(--cyan2)' },
          { label: 'Videolu', value: stats.withVideo, icon: Video, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
          { label: 'Videousuz', value: stats.totalReports - stats.withVideo, icon: AlertTriangle, color: 'var(--gold)', bg: 'var(--gold2)' },
          { label: 'Tamamlanan', value: stats.completedVideos, icon: CheckCircle2, color: 'var(--bull)', bg: 'var(--bull2)' },
          { label: 'Başarısız', value: stats.failedVideos, icon: XCircle, color: 'var(--bear)', bg: 'var(--bear2)' },
        ].map((stat, i) => (
          <div key={i} style={{
            padding: '14px 16px', borderRadius: '10px',
            background: 'var(--bg3)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <stat.icon size={16} style={{ color: stat.color }} />
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '2px' }}>{stat.label}</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: stat.color, fontVariantNumeric: 'tabular-nums' }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ TABS ═══ */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border)' }}>
        {[
          { key: 'generate' as const, label: 'Video oluştur', icon: Sparkles },
          { key: 'library' as const, label: 'Video kütüphanesi', icon: Video },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 20px', fontSize: '13px', fontWeight: 600,
              background: activeTab === tab.key ? 'var(--bg3)' : 'transparent',
              border: 'none', borderBottom: activeTab === tab.key ? '2px solid #8b5cf6' : '2px solid transparent',
              color: activeTab === tab.key ? '#8b5cf6' : 'var(--text3)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {tab.icon ? <tab.icon size={15} /> : null}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ GENERATE TAB ═══ */}
      {activeTab === 'generate' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
              <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px', display: 'block', color: '#8b5cf6' }} />
              Raporlar yükleniyor...
            </div>
          ) : reports.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
              <FileText size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
              Video oluşturmak için yayınlanmış rapor bulunamadı
            </div>
          ) : (
            reports.map((report, i) => {
              const existingVideo = reportVideoMap.get(report.id);
              const isGenerating = generatingIds.has(report.id);
              const progress = progressMap[report.id] || 0;
              const impact = getImpactDisplay(report.marketImpact);
              const ImpactIcon = impact.icon;

              return (
                <div
                  key={report.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '14px 18px',
                    borderBottom: i < reports.length - 1 ? '1px solid var(--border)' : 'none',
                    background: 'var(--bg3)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg4)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg3)')}
                >
                  {/* Report Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {report.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '3px', background: 'var(--cyan2)', color: 'var(--cyan)' }}>
                        {TYPE_LABELS[report.reportType] || report.reportType}
                      </span>
                      <span style={{ fontSize: '10px', color: impact.color, display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <ImpactIcon size={10} /> {impact.label}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text3)' }}>
                        Güven: {report.confidenceScore}%
                      </span>
                    </div>
                  </div>

                  {/* Status / Generate Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {isGenerating ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '160px' }}>
                        <Loader2 size={16} className="animate-spin" style={{ color: '#8b5cf6' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '10px', color: '#8b5cf6', fontWeight: 600, marginBottom: '3px' }}>
                            Oluşturuluyor {progress}%
                          </div>
                          <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: 'var(--bg5)', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: '2px', width: `${progress}%`,
                              background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
                              transition: 'width 0.5s',
                            }} />
                          </div>
                        </div>
                      </div>
                    ) : existingVideo ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {existingVideo.status === 'completed' && fixVideoUrl(existingVideo.videoUrl) ? (
                          <>
                            <span style={{
                              fontSize: '10px', fontWeight: 600, padding: '2px 8px',
                              borderRadius: '4px', background: 'rgba(34,197,94,0.1)',
                              color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)',
                            }}>
                              <CheckCircle2 size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                              Video hazır
                            </span>
                            <a
                              href={fixVideoUrl(existingVideo.videoUrl)!}
                              target="_blank"
                              title="Videoyu oynat"
                              style={{
                                width: '32px', height: '32px', borderRadius: '6px',
                                background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,.2)',
                                color: '#8b5cf6', cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                              }}
                            >
                              <Play size={14} />
                            </a>
                          </>
                        ) : existingVideo.status === 'failed' ? (
                          <span style={{
                            fontSize: '10px', fontWeight: 600, padding: '2px 8px',
                            borderRadius: '4px', background: 'rgba(239,83,80,0.1)',
                            color: '#EF5350', border: '1px solid rgba(239,83,80,0.2)',
                          }}>
                            <XCircle size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                            Başarısız
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '10px', fontWeight: 600, padding: '2px 8px',
                            borderRadius: '4px', background: 'rgba(255,184,0,0.1)',
                            color: '#FFB800', border: '1px solid rgba(255,184,0,0.2)',
                          }}>
                            <Clock size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                            {STATUS_CONFIG[existingVideo.status]?.label || existingVideo.status}
                          </span>
                        )}
                        <button
                          onClick={() => handleGenerate(report)}
                          title="Videoyu yeniden oluştur"
                          style={{
                            width: '32px', height: '32px', borderRadius: '6px',
                            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,.2)',
                            color: '#3b82f6', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <RefreshCw size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGenerate(report)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '8px 16px', borderRadius: '8px',
                          background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))',
                          border: '1px solid rgba(139,92,246,0.3)',
                          color: '#8b5cf6', fontSize: '12px', fontWeight: 700,
                          cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >
                        <Sparkles size={14} />
                        Video oluştur
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══ LIBRARY TAB ═══ */}
      {activeTab === 'geopolitical' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {geoRisks.length === 0 && !geoLoading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <button
                onClick={fetchGeoRisks}
                style={{
                  padding: '10px 24px', borderRadius: '8px',
                  background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
                  color: '#F59E0B', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                }}
              >
                Jeopolitik risk analizlerini yukle
              </button>
            </div>
          ) : geoLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
              <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px', display: 'block', color: '#F59E0B' }} />
              Jeopolitik riskler yukleniyor...
            </div>
          ) : (
            geoRisks.map((risk, i) => {
              const isGenerating = generatingIds.has(risk.id);
              const progress = progressMap[risk.id] || 0;
              const existingVideo = reportVideoMap.get(risk.id);
              const riskColor = risk.riskScore >= 81 ? '#FF3838' : risk.riskScore >= 61 ? '#FFB302' : risk.riskScore >= 41 ? '#FCE83A' : '#56F000';
              const riskLabel = risk.riskLevel === 'severe' ? 'حاد' : risk.riskLevel === 'high' ? 'Yuksek' : risk.riskLevel === 'elevated' ? 'Yuksek-' : risk.riskLevel === 'moderate' ? 'Orta' : 'Dusuk';
              const catIcons: Record<string, string> = { conflict: '⚔️', trade: '📦', energy: '⚡', political: '🏛️', cyber: '🖥️', sanctions: '🚫', climate: '🌊' };

              return (
                <div
                  key={risk.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '14px 18px',
                    borderBottom: i < geoRisks.length - 1 ? '1px solid var(--border)' : 'none',
                    background: 'var(--bg3)',
                    transition: 'background 0.15s',
                    borderInlineStart: `3px solid ${riskColor}`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg4)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg3)')}
                >
                  {/* Risk Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {catIcons[risk.riskCategory] || '🌍'} {risk.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '3px', background: `${riskColor}15`, color: riskColor }}>
                        {riskLabel} ({risk.riskScore})
                      </span>
                      {risk.publishedAt && (
                        <span style={{ fontSize: '10px', color: 'var(--text3)' }}>
                          {new Date(risk.publishedAt).toLocaleDateString('tr', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status / Generate Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {isGenerating ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '160px' }}>
                        <Loader2 size={16} className="animate-spin" style={{ color: '#F59E0B' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '10px', color: '#F59E0B', fontWeight: 600, marginBottom: '3px' }}>
                            Olusturuluyor {progress}%
                          </div>
                          <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: 'var(--bg5)', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: '2px', width: `${progress}%`,
                              background: 'linear-gradient(90deg, #F59E0B, #fbbf24)',
                              transition: 'width 0.5s',
                            }} />
                          </div>
                        </div>
                      </div>
                    ) : existingVideo && existingVideo.status === 'completed' && fixVideoUrl(existingVideo.videoUrl) ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '10px', fontWeight: 600, padding: '2px 8px',
                          borderRadius: '4px', background: 'rgba(34,197,94,0.1)',
                          color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)',
                        }}>
                          <CheckCircle2 size={10} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '3px' }} />
                          Video Hazir
                        </span>
                        <a
                          href={fixVideoUrl(existingVideo.videoUrl)!}
                          target="_blank"
                          title="Izle"
                          style={{
                            width: '32px', height: '32px', borderRadius: '6px',
                            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,.2)',
                            color: '#F59E0B', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Play size={14} />
                        </a>
                        <button
                          onClick={() => handleGenerateGeoVideo(risk)}
                          title="Yeniden olustur"
                          style={{
                            width: '32px', height: '32px', borderRadius: '6px',
                            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,.2)',
                            color: '#3b82f6', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <RefreshCw size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGenerateGeoVideo(risk)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '8px 16px', borderRadius: '8px',
                          background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.15))',
                          border: '1px solid rgba(245,158,11,0.3)',
                          color: '#F59E0B', fontSize: '12px', fontWeight: 700,
                          cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >
                        <Sparkles size={14} />
                        Video Olustur
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'library' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {videos.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
              <Video size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
              Video bulunamadı — yukarıdaki sekmeden bir tane oluşturun
            </div>
          ) : (
            videos.map((video, i) => {
              const statusCfg = STATUS_CONFIG[video.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusCfg.icon;

              return (
                <div
                  key={video.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 18px',
                    borderBottom: i < videos.length - 1 ? '1px solid var(--border)' : 'none',
                    background: 'var(--bg3)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg4)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg3)')}
                >
                  {/* Thumbnail or placeholder */}
                  <div style={{
                    width: '64px', height: '40px', borderRadius: '6px',
                    background: fixVideoUrl(video.thumbnailUrl) ? 'var(--bg5)' : 'rgba(139,92,246,0.08)',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', flexShrink: 0,
                  }}>
                    {fixVideoUrl(video.thumbnailUrl) ? (
                      <img src={fixVideoUrl(video.thumbnailUrl)!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Video size={16} style={{ color: '#8b5cf6', opacity: 0.5 }} />
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editingId === video.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(video.id); if (e.key === 'Escape') setEditingId(null); }}
                          style={{
                            flex: 1, padding: '4px 8px', fontSize: '12px',
                            background: 'var(--bg5)', border: '1px solid var(--border)',
                            borderRadius: '4px', color: 'var(--text)', outline: 'none',
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(video.id)}
                          style={{
                            padding: '4px 10px', fontSize: '10px', fontWeight: 600,
                            background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                            color: '#22C55E', borderRadius: '4px', cursor: 'pointer',
                          }}
                        >
                          Kaydet
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{
                            padding: '4px 10px', fontSize: '10px', fontWeight: 600,
                            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                            color: 'var(--text3)', borderRadius: '4px', cursor: 'pointer',
                          }}
                        >
                          İptal
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {video.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                          <span style={{
                            fontSize: '9px', fontWeight: 600, padding: '1px 6px',
                            borderRadius: '3px', background: statusCfg.bg, color: statusCfg.color,
                          }}>
                            {statusCfg.label}
                          </span>
                          {video.status === 'completed' && !video.isPublished && (
                            <span style={{
                              fontSize: '9px', fontWeight: 600, padding: '1px 6px',
                              borderRadius: '3px', background: 'rgba(239,83,80,0.12)', color: '#EF5350',
                              display: 'inline-flex', alignItems: 'center', gap: '2px',
                            }}>
                              <EyeOff size={9} /> Gizli
                            </span>
                          )}
                          {video.duration && (
                            <span style={{ fontSize: '10px', color: 'var(--text3)' }}>
                              {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                            </span>
                          )}
                          <span style={{ fontSize: '10px', color: 'var(--text3)' }}>
                            {new Date(video.createdAt).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        {video.status === 'failed' && video.error && (
                          <div style={{ fontSize: '10px', color: '#EF5350', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {video.error}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    {video.status === 'completed' && fixVideoUrl(video.videoUrl) && (
                      <a
                        href={fixVideoUrl(video.videoUrl)!}
                        target="_blank"
                        title="Oynat"
                        style={{
                          width: '30px', height: '30px', borderRadius: '6px',
                          background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,.2)',
                          color: '#8b5cf6', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Play size={13} />
                      </a>
                    )}
                    {video.status === 'completed' && fixVideoUrl(video.videoUrl) && (
                      <a
                        href={fixVideoUrl(video.videoUrl)!}
                        download
                        title="İndir"
                        style={{
                          width: '30px', height: '30px', borderRadius: '6px',
                          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,.2)',
                          color: '#22C55E', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Download size={13} />
                      </a>
                    )}
                    {/* Edit button */}
                    <button
                      onClick={() => { setEditingId(video.id); setEditTitle(video.title); }}
                      title="Başlığı düzenle"
                      style={{
                        width: '30px', height: '30px', borderRadius: '6px',
                        background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,.2)',
                        color: '#3b82f6', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Pencil size={13} />
                    </button>
                    {/* Show/Hide (publish) toggle — only for completed videos */}
                    {video.status === 'completed' && (
                      <button
                        onClick={() => handleTogglePublish(video.id, video.isPublished)}
                        title={video.isPublished ? 'Herkese acik siteden gizle' : 'Herkese acik sitede goster'}
                        disabled={togglingIds.has(video.id)}
                        style={{
                          width: '30px', height: '30px', borderRadius: '6px',
                          background: video.isPublished ? 'rgba(234,179,8,0.1)' : 'rgba(34,197,94,0.1)',
                          border: video.isPublished ? '1px solid rgba(234,179,8,.25)' : '1px solid rgba(34,197,94,.2)',
                          color: video.isPublished ? '#EAB308' : '#22C55E',
                          cursor: togglingIds.has(video.id) ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: togglingIds.has(video.id) ? 0.5 : 1,
                        }}
                      >
                        {togglingIds.has(video.id)
                          ? <Loader2 size={13} className="animate-spin" />
                          : video.isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    )}
                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteVideo(video.id)}
                      title="Videoyu sil"
                      disabled={deletingIds.has(video.id)}
                      style={{
                        width: '30px', height: '30px', borderRadius: '6px',
                        background: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,.2)',
                        color: '#EF5350', cursor: deletingIds.has(video.id) ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: deletingIds.has(video.id) ? 0.5 : 1,
                      }}
                    >
                      {deletingIds.has(video.id) ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

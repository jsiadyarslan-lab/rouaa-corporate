// ─── French Rapports Production Dashboard V2 ──────────────────
// Complete redesign: Professional, functional, consistent with French version
// Uses /api/reports/manage?locale=fr for full CRUD + /api/fr/reports?isPublished=all for analyses
// Features: Publish/unpublish, delete, sort, filter, pagination, video generation, job tracking

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, RefreshCw, FileText, TrendingUp, TrendingDown, Minus,
  Eye, EyeOff, Trash2, ChevronLeft, ChevronRight,
  ArrowUpDown, Loader2, BarChart3, CheckCircle2, Clock,
  AlertTriangle, Video, Play, X, Sparkles, ExternalLink,
  LayoutGrid, List, Database, Zap,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────
interface RapportItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  reportType: string;
  scope?: string;
  sectors?: string[];
  countries?: string[];
  marketImpact: string;
  confidenceScore: number;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt?: string;
  isAnalysis?: boolean;
  assetClass?: string;
  analysisType?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ─── Constants ─────────────────────────────────────────────
const TYPE_OPTIONS = [
  { value: 'all', label: 'Tous les types' },
  { value: 'daily', label: 'Résumé quotidien' },
  { value: 'weekly', label: 'Analyse hebdomadaire' },
  { value: 'monthly', label: 'Rapport mensuel' },
  { value: 'quarterly', label: 'Revue trimestrielle' },
  { value: 'special', label: 'Rapport spécial' },
  { value: 'strategic', label: 'Stratégique' },
  { value: 'analysis', label: 'Analyse de marché' },
];

const IMPACT_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  bullish: { label: 'Haussier', color: 'var(--bull)', icon: TrendingUp },
  bearish: { label: 'Baissier', color: 'var(--bear)', icon: TrendingDown },
  neutral: { label: 'Neutre', color: 'var(--gold)', icon: Minus },
  positive: { label: 'Positif', color: 'var(--bull)', icon: TrendingUp },
  negative: { label: 'Négatif', color: 'var(--bear)', icon: TrendingDown },
};

const TYPE_COLORS: Record<string, string> = {
  daily: '#00E5FF',
  weekly: '#D4AF37',
  monthly: '#8B5CF6',
  quarterly: '#3BA7F0',
  special: '#EF5350',
  strategic: '#A78BFA',
  analysis: '#00C896',
};

// ─── Helpers ───────────────────────────────────────────────
function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return "À l'instant";
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

// ─── Main Component ────────────────────────────────────────
export default function FrRapportsPage() {
  const [reports, setRapports] = useState<RapportItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [publishedFilter, setPublishedFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'confidence' | 'title'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Video generation state
  const [generatingVideoId, setGeneratingVideoId] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoResults, setVideoResults] = useState<Record<string, { url: string; error?: string }>>({});

  // ─── Data Fetching ────────────────────────────────────────
  const fetchRapports = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      // Fetch from reports/manage (EconomicRapport) + en/reports (includes MarketAnalysis)
      const [manageRes, enRes] = await Promise.all([
        fetch(`/api/reports/manage?page=${page}&limit=20&locale=fr`).catch(() => null),
        fetch(`/api/fr/reports?limit=50&isPublished=all&includeAnalyses=true`).catch(() => null),
      ]);

      let manageRapports: RapportItem[] = [];
      let managePagination: PaginationInfo = { page: 1, limit: 20, total: 0, pages: 1 };
      let analysisRapports: RapportItem[] = [];

      if (manageRes?.ok) {
        const data = await manageRes.json();
        if (data.reports) {
          manageRapports = data.reports.map((r: any) => ({
            id: r.id,
            title: r.title,
            slug: r.slug,
            summary: r.summary || '',
            reportType: r.reportType,
            scope: r.scope,
            sectors: r.sectors,
            countries: r.countries,
            marketImpact: r.marketImpact || 'neutral',
            confidenceScore: r.confidenceScore || 0,
            isPublished: r.isPublished,
            publishedAt: r.publishedAt,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
            isAnalysis: false,
          }));
          managePagination = data.pagination;
        }
      }

      if (enRes?.ok) {
        const data = await enRes.json();
        const items = data.reports || [];
        // Only add MarketAnalysis entries (isAnalysis=true) that are not already in manageRapports
        const manageIds = new Set(manageRapports.map(r => r.id));
        analysisRapports = items
          .filter((r: any) => r.isAnalysis && !manageIds.has(r.id))
          .map((r: any) => ({
            id: r.id,
            title: r.title,
            slug: r.slug,
            summary: r.summary || '',
            reportType: r.reportType || 'analysis',
            scope: r.scope || r.assetClass,
            marketImpact: r.marketImpact || r.sentiment || 'neutral',
            confidenceScore: r.confidenceScore || 0,
            isPublished: r.isPublished,
            publishedAt: r.publishedAt,
            createdAt: r.createdAt,
            isAnalysis: true,
            assetClass: r.assetClass,
            analysisType: r.analysisType,
          }));
      }

      // Combine EconomicRapports + MarketAnalyses
      const allRapports = [...manageRapports, ...analysisRapports]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setRapports(allRapports);
      // Adjust pagination to include analyses
      setPagination({
        ...managePagination,
        total: managePagination.total + analysisRapports.length,
        pages: Math.ceil((managePagination.total + analysisRapports.length) / 20),
      });
    } catch (err) {
      console.error('Échec du chargement des rapports FR :', err);
      toast.error('Impossible de charger les rapports français');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRapports(1); }, [fetchRapports]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ─── Filtered & sorted reports ─────────────────────────────
  const filteredRapports = (() => {
    let result = [...reports];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== 'all') {
      result = result.filter(r => r.reportType === typeFilter);
    }
    if (publishedFilter === 'published') {
      result = result.filter(r => r.isPublished);
    } else if (publishedFilter === 'draft') {
      result = result.filter(r => !r.isPublished);
    }
    result.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'date') return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      if (sortBy === 'confidence') return dir * (a.confidenceScore - b.confidenceScore);
      if (sortBy === 'title') return dir * a.title.localeCompare(b.title, 'fr');
      return 0;
    });
    return result;
  })();

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  // ─── CRUD Operations ────────────────────────────────────────
  const togglePublish = async (report: RapportItem) => {
    try {
      const res = await fetch('/api/reports/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: report.id, isPublished: !report.isPublished }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(report.isPublished ? 'Rapport dépublié' : 'Rapport publié');
        fetchRapports(pagination.page);
      } else {
        toast.error(data.error || 'Échec de la mise à jour du statut de publication');
      }
    } catch {
      toast.error("Une erreur s'est produite");
    }
  };

  const handleSupprimer = async (id: string) => {
    try {
      const res = await fetch('/api/reports/manage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Rapport supprimé avec succès');
        setDeleteConfirm(null);
        fetchRapports(pagination.page);
      } else {
        toast.error(data.error || 'Échec de la suppression du rapport');
      }
    } catch {
      toast.error("Une erreur s'est produite lors de la suppression");
    }
  };

  // ─── Video Generation ────────────────────────────────────
  const handleGenerateVideo = async (reportId: string) => {
    setGeneratingVideoId(reportId);
    setVideoProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p = Math.min(p + Math.random() * 8, 90);
      setVideoProgress(Math.round(p));
    }, 2000);

    try {
      const res = await fetch(`/api/economic-reports/${reportId}/generate-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      clearInterval(interval);
      setVideoProgress(100);

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          toast.success('Video générée avec succès !');
          setVideoResults(prev => ({ ...prev, [reportId]: { url: data.videoUrl } }));
        } else {
          toast.error(data.error || 'Video generation failed');
          setVideoResults(prev => ({ ...prev, [reportId]: { url: '', error: data.error || 'Échoué' } }));
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Video generation failed');
      }
    } catch {
      clearInterval(interval);
      toast.error('Video generation service unavailable');
    } finally {
      setGeneratingVideoId(null);
      setVideoProgress(0);
    }
  };

  // ─── Stats ────────────────────────────────────────────────
  const stats = {
    total: pagination.total,
    published: reports.filter(r => r.isPublished).length,
    drafts: reports.filter(r => !r.isPublished).length,
    avgConfiance: reports.length > 0 ? Math.round(reports.reduce((s, r) => s + (r.confidenceScore || 0), 0) / reports.length) : 0,
    analyses: reports.filter(r => r.isAnalysis).length,
  };

  // ─── Render ───────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', direction: 'ltr' }}>
      {/* ═══ HEADER ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={22} style={{ color: 'var(--cyan)' }} />
            Rapports français — Ligne de production
            <span style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 10,
              background: 'rgba(0,229,255,0.1)',
              color: 'var(--cyan)',
              border: '1px solid rgba(0,229,255,0.2)',
              fontWeight: 700,
            }}>locale=fr</span>
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>
            {stats.total} reports · {stats.published} published · {stats.drafts} drafts · {stats.analyses} analyses
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => fetchRapports(pagination.page)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '8px',
              background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)',
              color: 'var(--text2)', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
      </div>

      {/* ═══ STATS CARDS ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Total rapports', value: stats.total, icon: FileText, color: 'var(--cyan)', bg: 'var(--cyan2)' },
          { label: 'Publié', value: stats.published, icon: Eye, color: 'var(--bull)', bg: 'var(--bull2)' },
          { label: 'Brouillons', value: stats.drafts, icon: EyeOff, color: 'var(--gold)', bg: 'var(--gold2)' },
          { label: 'Confiance moy.', value: `${stats.avgConfiance}%`, icon: BarChart3, color: stats.avgConfiance >= 70 ? 'var(--bull)' : stats.avgConfiance >= 40 ? 'var(--gold)' : 'var(--bear)', bg: stats.avgConfiance >= 70 ? 'var(--bull2)' : stats.avgConfiance >= 40 ? 'var(--gold2)' : 'var(--bear2)' },
          { label: 'Analyses de marché', value: stats.analyses, icon: Database, color: '#00C896', bg: 'rgba(0,200,150,0.1)' },
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

      {/* ═══ FILTERS BAR ═══ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
        padding: '10px 14px', borderRadius: '10px',
        background: 'var(--bg3)', border: '1px solid var(--border)',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher des rapports par titre ou slug..."
            style={{
              width: '100%', padding: '7px 10px 7px 32px', borderRadius: '6px',
              background: 'var(--bg4)', border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: '12px', outline: 'none',
            }}
          />
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            padding: '7px 10px', borderRadius: '6px',
            background: 'var(--bg4)', border: '1px solid var(--border)',
            color: 'var(--text2)', fontSize: '11px', outline: 'none', cursor: 'pointer',
          }}
        >
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Publié Filter */}
        <select
          value={publishedFilter}
          onChange={(e) => setPublishedFilter(e.target.value as any)}
          style={{
            padding: '7px 10px', borderRadius: '6px',
            background: 'var(--bg4)', border: '1px solid var(--border)',
            color: 'var(--text2)', fontSize: '11px', outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="all">Tous les statuts</option>
          <option value="published">Publié</option>
          <option value="draft">Brouillon</option>
        </select>

        {/* Result count */}
        <span style={{ fontSize: '11px', color: 'var(--text3)', whiteSpace: 'nowrap' }}>
          {filteredRapports.length} of {reports.length} reports
        </span>
      </div>

      {/* ═══ REPORTS TABLE ═══ */}
      <div style={{
        borderRadius: '10px', overflow: 'hidden',
        background: 'var(--bg3)', border: '1px solid var(--border)',
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 90px 80px 80px 70px 90px 100px 100px',
          gap: '8px', padding: '10px 16px',
          background: 'var(--bg4)', borderBottom: '1px solid var(--border)',
          fontSize: '10px', fontWeight: 700, color: 'var(--text3)',
          textTransform: 'uppercase', letterSpacing: '0.5px', alignItems: 'center',
        }}>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => toggleSort('title')}>
            Rapport <ArrowUpDown size={10} />
          </div>
          <div>Type</div>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => toggleSort('confidence')}>
            Confiance <ArrowUpDown size={10} />
          </div>
          <div>Impact</div>
          <div>Status</div>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => toggleSort('date')}>
            Date <ArrowUpDown size={10} />
          </div>
          <div>Actions</div>
          <div>Video</div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
            <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px', display: 'block', color: 'var(--cyan)' }} />
            Chargement des rapports français...
          </div>
        ) : filteredRapports.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
            <FileText size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
            <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Aucun rapport français trouvé</p>
            <p style={{ fontSize: '12px' }}>Générez des rapports depuis la page Contrôles FR ou la page Rapports stratégiques</p>
          </div>
        ) : (
          filteredRapports.map((report, i) => {
            const impactCfg = IMPACT_CONFIG[report.marketImpact] || IMPACT_CONFIG.neutral;
            const ImpactIcon = impactCfg.icon;
            const typeColor = TYPE_COLORS[report.reportType] || 'var(--cyan)';
            const reportUrl = report.isAnalysis
              ? `/fr/reports/${report.slug}`
              : `/fr/reports/${report.slug}`;

            return (
              <div
                key={report.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 90px 80px 80px 70px 90px 100px 100px',
                  gap: '8px', padding: '10px 16px',
                  borderBottom: i < filteredRapports.length - 1 ? '1px solid var(--border)' : 'none',
                  alignItems: 'center',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg4)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Title & Summary */}
                <div style={{ minWidth: 0 }}>
                  <Link
                    href={reportUrl}
                    target="_blank"
                    style={{
                      fontSize: '12px', fontWeight: 700, color: 'var(--text)',
                      textDecoration: 'none', display: 'block',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}
                  >
                    {report.isAnalysis && (
                      <span style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(0,200,150,0.1)', color: '#00C896', marginRight: '4px', fontWeight: 700 }}>ANALYSIS</span>
                    )}
                    {report.title}
                  </Link>
                  {report.summary && (
                    <div style={{
                      fontSize: '10px', color: 'var(--text3)', marginTop: '2px',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {report.summary.slice(0, 80)}{report.summary.length > 80 ? '...' : ''}
                    </div>
                  )}
                </div>

                {/* Type */}
                <span style={{
                  fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                  background: `${typeColor}12`, color: typeColor, textAlign: 'center',
                  border: `1px solid ${typeColor}25`,
                }}>
                  {TYPE_OPTIONS.find(o => o.value === report.reportType)?.label || report.reportType}
                </span>

                {/* Confiance */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '32px', height: '4px', borderRadius: '2px',
                    background: 'var(--bg5)', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: '2px',
                      width: `${report.confidenceScore}%`,
                      background: report.confidenceScore >= 70 ? 'var(--bull)' : report.confidenceScore >= 40 ? 'var(--gold)' : 'var(--bear)',
                    }} />
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: 700,
                    color: report.confidenceScore >= 70 ? 'var(--bull)' : report.confidenceScore >= 40 ? 'var(--gold)' : 'var(--bear)',
                  }}>
                    {report.confidenceScore}%
                  </span>
                </div>

                {/* Impact */}
                <span style={{
                  fontSize: '10px', fontWeight: 700,
                  color: impactCfg.color,
                  display: 'flex', alignItems: 'center', gap: '3px',
                }}>
                  <ImpactIcon size={11} />
                  {impactCfg.label}
                </span>

                {/* Publié Status */}
                <button
                  onClick={() => !report.isAnalysis && togglePublish(report)}
                  style={{
                    fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                    background: report.isPublished ? 'var(--bull2)' : 'var(--gold2)',
                    color: report.isPublished ? 'var(--bull)' : 'var(--gold)',
                    border: `1px solid ${report.isPublished ? 'rgba(34,197,94,.2)' : 'rgba(255,184,0,.2)'}`,
                    cursor: report.isAnalysis ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '3px',
                    opacity: report.isAnalysis ? 0.7 : 1,
                  }}
                >
                  {report.isPublished ? <Eye size={10} /> : <EyeOff size={10} />}
                  {report.isPublished ? 'Live' : 'Brouillon'}
                </button>

                {/* Date */}
                <span style={{ fontSize: '10px', color: 'var(--text3)' }}>
                  {formatRelativeTime(report.createdAt)}
                </span>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <Link
                    href={reportUrl}
                    target="_blank"
                    title="Voir sur le site"
                    style={{
                      width: '28px', height: '28px', borderRadius: '6px',
                      background: 'var(--bull2)', border: '1px solid rgba(34,197,94,.15)',
                      color: 'var(--bull)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Eye size={12} />
                  </Link>
                  {!report.isAnalysis && (
                    <button
                      onClick={() => setDeleteConfirm(report.id)}
                      title="Supprimer report"
                      style={{
                        width: '28px', height: '28px', borderRadius: '6px',
                        background: 'var(--bear2)', border: '1px solid rgba(239,83,80,.15)',
                        color: 'var(--bear)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>

                {/* Video Generation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {generatingVideoId === report.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Loader2 size={12} className="animate-spin" style={{ color: '#8b5cf6' }} />
                      <span style={{ fontSize: '9px', color: '#8b5cf6', fontWeight: 600 }}>{videoProgress}%</span>
                    </div>
                  ) : videoResults[report.id]?.url ? (
                    <a
                      href={videoResults[report.id].url.replace('/generated/videos/', '/api/video/serve/')}
                      target="_blank"
                      title="Regarder la vidéo"
                      style={{
                        width: '28px', height: '28px', borderRadius: '6px',
                        background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,.2)',
                        color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Play size={12} />
                    </a>
                  ) : (
                    <button
                      onClick={() => handleGenerateVideo(report.id)}
                      title="Générer la vidéo"
                      disabled={!!generatingVideoId}
                      style={{
                        width: '28px', height: '28px', borderRadius: '6px',
                        background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,.2)',
                        color: '#3b82f6', cursor: generatingVideoId ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: generatingVideoId ? 0.4 : 1,
                      }}
                    >
                      <Video size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ═══ DELETE CONFIRMATION ═══ */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--bg3)', border: '1px solid rgba(239,83,80,0.3)',
          borderRadius: '12px', padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 100,
        }}>
          <AlertTriangle size={18} style={{ color: '#EF5350', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: 'var(--text2)' }}>Supprimer ce rapport définitivement ?</span>
          <button
            onClick={() => handleSupprimer(deleteConfirm)}
            style={{
              padding: '6px 14px', borderRadius: '6px',
              background: '#EF5350', color: 'white', border: 'none',
              fontSize: '11px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Supprimer
          </button>
          <button
            onClick={() => setDeleteConfirm(null)}
            style={{
              padding: '6px 14px', borderRadius: '6px',
              background: 'var(--bg4)', color: 'var(--text3)', border: '1px solid var(--border)',
              fontSize: '11px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Annuler
          </button>
        </div>
      )}

      {/* ═══ PAGINATION ═══ */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <button
            onClick={() => fetchRapports(pagination.page - 1)}
            disabled={pagination.page <= 1}
            style={{
              padding: '6px 10px', borderRadius: '6px',
              background: 'var(--bg3)', border: '1px solid var(--border)',
              color: pagination.page <= 1 ? 'var(--text4)' : 'var(--text2)',
              cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
              fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px',
            }}
          >
            <ChevronLeft size={14} /> Précédent
          </button>
          <span style={{ fontSize: '11px', color: 'var(--text2)' }}>
            {pagination.page} / {pagination.pages}
          </span>
          <button
            onClick={() => fetchRapports(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            style={{
              padding: '6px 10px', borderRadius: '6px',
              background: 'var(--bg3)', border: '1px solid var(--border)',
              color: pagination.page >= pagination.pages ? 'var(--text4)' : 'var(--text2)',
              cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer',
              fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px',
            }}
          >
            Suivant <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

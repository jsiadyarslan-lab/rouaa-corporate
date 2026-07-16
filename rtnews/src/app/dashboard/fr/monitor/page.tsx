// ─── French Pipeline Monitor ───────────────────────────────────
// LTR, French UI. Shows FR pipeline health, orchestrator stats,
// recent articles, error logs. Replaces old raqeeb-fr page.
// Auto-refreshes every 30s.
//
// API endpoints:
//   Status:  GET /api/news/cron-fr?action=status
//   Health:  GET /api/news/health
//   FR News: GET /api/fr/news?limit=10

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Globe, RefreshCw, Activity, CheckCircle2, Clock,
  AlertTriangle, XCircle, CircleDashed, Database,
  Newspaper, TrendingUp, BarChart3, Eye,
  Zap, Loader2, AlertOctagon, Heart,
  Wifi, WifiOff, Server, Shield,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────
interface PipelineStatus {
  totalReady: number;
  totalPublished: number;
  publishedToday: number;
  publishedThisHour: number;
  pending: number;
  awaitingProcessing: number;
  publishedWithoutImage: number;
  limits: { maxDaily: number; maxHourly: number };
}

interface HealthCheck {
  status: string;
  dbConnected?: boolean;
  dbLatencyMs?: number;
  dbError?: string;
  dbRecoveryAttempted?: boolean;
  dbRecovered?: boolean;
  totalArticles?: number;
  publishedArticles?: number;
  lastFetch?: string;
  errors?: string[];
  [key: string]: any;
}

interface RecentArticle {
  id: string;
  title: string;
  category?: string;
  sentiment?: string;
  isPublished?: boolean;
  isReady?: boolean;
  processingStage?: string;
  createdAt: string;
  fetchedAt?: string;
}

// ─── Helpers ────────────────────────────────────────────
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
    return `${diffDays}j`;
  } catch {
    return dateStr;
  }
}

// ─── Mini Stat Card ─────────────────────────────────────
function MiniStat({ icon: Icon, label, value, color, sub }: {
  icon: any; label: string; value: number | string; color: string; sub?: string;
}) {
  return (
    <div className="p-4 rounded-xl" style={{ background: `${color}08`, border: `1px solid ${color}18` }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{label}</span>
      </div>
      <div className="font-mono-price text-[22px] font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>{sub}</div>}
    </div>
  );
}

// ─── Health Indicator ────────────────────────────────────
function HealthIndicator({ label, healthy, detail }: { label: string; healthy: boolean | null; detail?: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg4)' }}>
      <div className="flex items-center gap-2">
        {healthy === true ? (
          <CheckCircle2 size={14} style={{ color: '#22C55E' }} />
        ) : healthy === false ? (
          <XCircle size={14} style={{ color: '#EF5350' }} />
        ) : (
          <CircleDashed size={14} style={{ color: 'var(--text4)' }} />
        )}
        <span className="text-[12px] font-semibold" style={{ color: 'var(--text2)' }}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {detail && <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{detail}</span>}
        <Badge className="text-[8px]" style={{
          background: healthy === true ? 'rgba(34,197,94,0.1)' : healthy === false ? 'rgba(239,68,68,0.1)' : 'var(--bg3)',
          color: healthy === true ? '#22C55E' : healthy === false ? '#EF5350' : 'var(--text4)',
          border: `1px solid ${healthy === true ? 'rgba(34,197,94,0.2)' : healthy === false ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
        }}>
          {healthy === true ? 'OK' : healthy === false ? 'Error' : 'Unknown'}
        </Badge>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────
export default function FrMonitorPage() {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [recentArticles, setRecentArticles] = useState<RecentArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);

  // ─── Fetch All Data ────────────────────────────────────
  // IMPORTANT: Must be defined BEFORE forceReconnect (which references it)
  const fetchAllData = useCallback(async () => {
    try {
      const [statusRes, healthRes, articlesRes] = await Promise.all([
        fetch('/api/news/cron-fr?action=status').catch(() => null),
        // V319: Pass locale=fr to get EN-specific orchestrator stats + dbConnected field
        fetch('/api/news/health?locale=fr').catch(() => null),
        fetch('/api/fr/news?limit=10').catch(() => null),
      ]);

      if (statusRes?.ok) {
        const data = await statusRes.json();
        if (data.pipeline) setStatus(data.pipeline);
      }

      if (healthRes?.ok) {
        const data = await healthRes.json();
        setHealth(data);
      }

      if (articlesRes?.ok) {
        const data = await articlesRes.json();
        const news = data.news || data.items || [];
        setRecentArticles(Array.isArray(news) ? news.slice(0, 10) : []);
      }

      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('Monitor fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Force DB Reconnect ────────────────────────────────
  const forceReconnect = useCallback(async () => {
    setReconnecting(true);
    try {
      const res = await fetch('/api/news/health?locale=fr');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
        if (data.dbConnected) {
          toast.success('Base de données reconnectée avec succès');
        } else {
          toast.error(`Échec de la récupération : ${data.dbError || 'Erreur inconnue'}`);
        }
      }
      await fetch('/api/news/cron-fr?action=trigger').catch(() => {});
    } catch (err: any) {
      toast.error(`Erreur de reconnexion : ${err.message}`);
    } finally {
      setReconnecting(false);
      fetchAllData();
    }
  }, [fetchAllData]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchAllData, 30_000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAllData]);

  // ─── Loading State ──────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-48 rounded-xl animate-pulse" style={{ background: 'var(--bg3)' }} />
        ))}
      </div>
    );
  }

  const isPipelineActive = status !== null;
  const dbHealthy = health?.dbConnected === true;
  const healthErrors = health?.errors || [];

  return (
    <div dir="ltr" className="space-y-6">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{
            background: 'rgba(0,229,255,0.08)',
            border: '1px solid rgba(0,229,255,0.15)',
          }}>
            <Globe size={22} style={{ color: 'var(--cyan)' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">FR Pipeline Monitor</h1>
            <p className="text-sm" style={{ color: 'var(--text3)' }}>Santé et performance du pipeline français en temps réel</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[10px]" style={{ color: 'var(--text4)' }}>
              Dernière màj : {formatRelativeTime(lastUpdated)}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setAutoRefresh(false); fetchAllData(); }}
            className="text-[11px] gap-1"
            style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}
          >
            <RefreshCw size={12} />
            Actualiser
          </Button>
          {!dbHealthy && (
            <Button
              variant="outline"
              size="sm"
              onClick={forceReconnect}
              disabled={reconnecting}
              className="text-[11px] gap-1"
              style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#EF5350', background: 'rgba(239,68,68,0.05)' }}
            >
              {reconnecting ? <Loader2 size={12} className="animate-spin" /> : <Database size={12} />}
              {reconnecting ? 'Reconnexion...' : 'Forcer la reconnexion'}
            </Button>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{
            background: autoRefresh ? 'rgba(34,197,94,0.08)' : 'var(--bg4)',
            border: `1px solid ${autoRefresh ? 'rgba(34,197,94,0.15)' : 'var(--border)'}`,
          }}>
            {autoRefresh ? (
              <Wifi size={12} style={{ color: '#22C55E' }} />
            ) : (
              <WifiOff size={12} style={{ color: 'var(--text4)' }} />
            )}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="text-[10px] font-semibold"
              style={{ color: autoRefresh ? '#22C55E' : 'var(--text4)' }}
            >
              {autoRefresh ? 'Auto : ACTIVÉ' : 'Auto : DÉSACTIVÉ'}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Pipeline Health Banner ═══ */}
      <Card className="border-0 overflow-hidden" style={{
        background: isPipelineActive && dbHealthy
          ? 'linear-gradient(135deg, rgba(0,229,255,0.06), rgba(34,197,94,0.04))'
          : 'linear-gradient(135deg, rgba(239,68,68,0.04), rgba(245,158,11,0.04))',
        borderLeft: isPipelineActive && dbHealthy ? '4px solid #22C55E' : '4px solid #F59E0B',
        border: `1px solid ${isPipelineActive && dbHealthy ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)'}`,
      }}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
              background: isPipelineActive && dbHealthy ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
            }}>
              {isPipelineActive && dbHealthy ? (
                <Heart size={20} style={{ color: '#22C55E' }} />
              ) : (
                <AlertTriangle size={20} style={{ color: '#F59E0B' }} />
              )}
            </div>
            <div>
              <div className="text-[14px] font-bold" style={{
                color: isPipelineActive && dbHealthy ? '#22C55E' : '#F59E0B',
              }}>
                {isPipelineActive && dbHealthy ? 'Pipeline FR opérationnel' : 'Problèmes détectés sur le pipeline FR'}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge className="text-[9px]" style={{
                  background: 'var(--bg4)', color: 'var(--text3)', border: '1px solid var(--border)',
                }}>
                  Orchestrateur FR V3
                </Badge>
                <Badge className="text-[9px]" style={{
                  background: dbHealthy ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                  color: dbHealthy ? '#22C55E' : '#EF5350',
                  border: `1px solid ${dbHealthy ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
                }}>
                  DB : {dbHealthy ? 'Connectée' : 'Déconnectée'}
                </Badge>
                {health?.dbLatencyMs !== undefined && (
                  <Badge className="text-[9px]" style={{
                    background: 'var(--bg4)', color: 'var(--text3)', border: '1px solid var(--border)',
                  }}>
                    Latence : {health.dbLatencyMs}ms
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Vérifications de santé ═══ */}
      <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Shield size={15} style={{ color: 'var(--cyan)' }} />
            Vérifications de santé
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <HealthIndicator
            label="Connexion base de données"
            healthy={dbHealthy}
            detail={health?.dbLatencyMs ? `${health.dbLatencyMs}ms` : health?.dbError ? `${health.dbError.slice(0, 60)}` : undefined}
          />
          {health?.dbRecoveryAttempted && (
            <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: health?.dbRecovered ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)', border: `1px solid ${health?.dbRecovered ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
              {health?.dbRecovered ? (
                <CheckCircle2 size={12} style={{ color: '#22C55E' }} />
              ) : (
                <AlertTriangle size={12} style={{ color: '#EF5350' }} />
              )}
              <span className="text-[10px]" style={{ color: health?.dbRecovered ? '#22C55E' : '#EF5350' }}>
                {health?.dbRecovered ? 'Récupération automatique réussie' : `Échec de la récupération automatique : ${health?.dbError?.slice(0, 80) || 'Unknown'}`}
              </span>
            </div>
          )}
          <HealthIndicator
            label="Orchestrateur du pipeline"
            healthy={isPipelineActive}
            detail={status ? 'Actif' : 'Aucune donnée'}
          />
          <HealthIndicator
            label="Récupération RSS"
            healthy={status ? status.awaitingProcessing >= 0 : null}
            detail={status ? `${status.awaitingProcessing} en attente` : undefined}
          />
          <HealthIndicator
            label="Taux de publication"
            healthy={status ? status.publishedThisHour <= status.limits.maxHourly : null}
            detail={status ? `${status.publishedThisHour}/${status.limits.maxHourly} cette heure` : undefined}
          />
          <HealthIndicator
            label="Génération d'''images"
            healthy={status ? status.publishedWithoutImage < 5 : null}
            detail={status ? `${status.publishedWithoutImage} manquantes` : undefined}
          />
        </CardContent>
      </Card>

      {/* ═══ Pipeline Stats ═══ */}
      {status && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <MiniStat icon={CheckCircle2} label="Total publié" value={status.totalPublished} color="#22C55E" sub={`Prêts : ${status.totalReady}`} />
          <MiniStat icon={TrendingUp} label="Publié aujourd'''hui" value={status.publishedToday} color="#00E5FF" sub={`Limit: ${status.limits.maxDaily}`} />
          <MiniStat icon={Clock} label="Cette heure" value={status.publishedThisHour} color="#F59E0B" sub={`Limit: ${status.limits.maxHourly}`} />
          <MiniStat icon={AlertTriangle} label="En attente" value={status.pending} color="#EF5350" sub={`Récupérés : ${status.awaitingProcessing}`} />
          <MiniStat icon={Database} label="Sans image" value={status.publishedWithoutImage} color="#8B5CF6" />
          <MiniStat icon={Eye} label="Prêt à publier" value={status.totalReady} color="#3BA7F0" />
        </div>
      )}

      {/* ═══ Articles FR récents ═══ */}
      <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Newspaper size={15} style={{ color: 'var(--cyan)' }} />
            Articles FR récents
            <Badge className="text-[9px]" style={{ background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.15)' }}>
              {recentArticles.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentArticles.length === 0 ? (
            <div className="py-8 text-center">
              <Newspaper size={28} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text3)' }} />
              <p className="text-[12px]" style={{ color: 'var(--text3)' }}>Aucun article FR récent</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
              {recentArticles.map((article, i) => {
                const isPublished = article.isPublished || article.isReady;
                return (
                  <div key={article.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--bg4)] transition-colors" style={{
                    borderBottom: i < recentArticles.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    {/* Status dot */}
                    <div className="flex-shrink-0 w-2 h-2 rounded-full" style={{
                      background: isPublished ? '#22C55E' : '#F59E0B',
                    }} />
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold truncate" style={{ color: 'var(--text)' }}>
                        {article.title}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {article.category && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'var(--cyan2)', color: 'var(--cyan)' }}>
                            {article.category}
                          </span>
                        )}
                        {article.sentiment && (
                          <span className="text-[9px]" style={{
                            color: article.sentiment === 'positive' || article.sentiment === 'bullish' ? '#22C55E'
                              : article.sentiment === 'negative' || article.sentiment === 'bearish' ? '#EF5350' : '#64748B',
                          }}>
                            {article.sentiment}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Time */}
                    <div className="flex-shrink-0 text-[10px]" style={{ color: 'var(--text4)' }}>
                      {formatRelativeTime(article.createdAt || article.fetchedAt || '')}
                    </div>
                    {/* Stage */}
                    <div className="flex-shrink-0">
                      <Badge className="text-[8px]" style={{
                        background: isPublished ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                        color: isPublished ? '#22C55E' : '#F59E0B',
                        border: `1px solid ${isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)'}`,
                      }}>
                        {article.processingStage || (isPublished ? 'Publié' : 'En attente')}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ Journal d'''erreurss ═══ */}
      {healthErrors.length > 0 && (
        <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: '#EF5350' }}>
              <AlertOctagon size={15} style={{ color: '#EF5350' }} />
              Journal d'''erreurs
              <Badge className="text-[9px]" style={{
                background: 'rgba(239,68,68,0.1)', color: '#EF5350', border: '1px solid rgba(239,68,68,0.15)',
              }}>
                {healthErrors.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar">
              {healthErrors.map((err, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.04)' }}>
                  <XCircle size={12} style={{ color: '#EF5350', flexShrink: 0, marginTop: 2 }} />
                  <span className="text-[11px]" style={{ color: 'var(--text3)' }}>{err}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ Infos orchestrateur ═══ */}
      <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Server size={15} style={{ color: 'var(--purple)' }} />
            Infos orchestrateur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg" style={{ background: 'var(--bg4)' }}>
              <div className="text-[10px] font-semibold mb-2" style={{ color: 'var(--text3)' }}>Configuration du pipeline</div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: 'var(--text3)' }}>Version</span>
                  <Badge className="text-[9px]" style={{ background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.15)' }}>
                    V3
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: 'var(--text3)' }}>Locale</span>
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--text2)' }}>fr</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: 'var(--text3)' }}>Limite quotidienne</span>
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--text2)' }}>{status?.limits.maxDaily || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: 'var(--text3)' }}>Limite horaire</span>
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--text2)' }}>{status?.limits.maxHourly || '—'}</span>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'var(--bg4)' }}>
              <div className="text-[10px] font-semibold mb-2" style={{ color: 'var(--text3)' }}>Étapes du pipeline</div>
              <div className="space-y-1.5">
                {[
                  { stage: 'Récupération RSS', icon: '📡', color: '#00E5FF' },
                  { stage: 'Content Load', icon: '📄', color: '#3b82f6' },
                  { stage: 'AI Analysis', icon: '🤖', color: '#F59E0B' },
                  { stage: 'Image Gen', icon: '🎨', color: '#8B5CF6' },
                  { stage: 'Publish', icon: '🚀', color: '#22C55E' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--text3)' }}>
                      <span>{s.icon}</span> {s.stage}
                    </span>
                    <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

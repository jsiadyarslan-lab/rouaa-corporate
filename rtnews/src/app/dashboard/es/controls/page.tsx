// ─── Spanish Production Controls ────────────────────────────────
// LTR, Spanish UI. Shows ES pipeline status and trigger buttons.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Play, RefreshCw, Newspaper, Zap, Clock,
  CheckCircle2, Activity, Settings2, Loader2, Rocket,
} from 'lucide-react';

interface PipelineStatus {
  totalReady: number;
  totalPublished: number;
  publishedToday: number;
  publishedThisHour: number;
  pending: number;
  publishedWithoutImage: number;
  limits: { maxDaily: number; maxHourly: number };
}

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

export default function EsControlsPage() {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/news/cron-es?action=status');
      if (res.ok) {
        const data = await res.json();
        if (data.pipeline) setStatus(data.pipeline);
      }
      setLastUpdated(new Date().toISOString());
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al obtener el estado del pipeline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);
  useEffect(() => { const interval = setInterval(fetchStatus, 30_000); return () => clearInterval(interval); }, [fetchStatus]);

  const runAction = async (action: string) => {
    setActionLoading(action);
    setError(null);
    try {
      const res = await fetch(`/api/news/cron-es?action=${action}&limit=10`);
      const data = await res.json();
      if (data.status === 'ok') toast.success(`✓ ${action} ejecutado exitosamente`);
      else toast.error(`Error al ejecutar ${action}`);
      setTimeout(fetchStatus, 2000);
    } catch (err: any) {
      setError(err.message || `Error al ejecutar ${action}`);
      toast.error(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-48 rounded-xl animate-pulse" style={{ background: 'var(--bg3)' }} />)}</div>;
  }

  const isPipelineActive = status !== null;

  return (
    <div dir="ltr" className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.15)' }}>
            <Settings2 size={22} style={{ color: 'var(--cyan)' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Controles de Producción ES</h1>
            <p className="text-sm" style={{ color: 'var(--text3)' }}>Gestionar el pipeline español y la generación de informes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && <span className="text-[10px]" style={{ color: 'var(--text4)' }}>Actualizado: {new Date(lastUpdated).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
          <Button variant="outline" size="sm" onClick={fetchStatus} className="text-[11px] gap-1" style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Actualizar
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-0" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderLeft: '4px solid #EF4444' }}>
          <CardContent className="p-3 flex items-center gap-2"><span className="text-[12px]" style={{ color: '#EF4444' }}>{error}</span></CardContent>
        </Card>
      )}

      <Card className="border-0 overflow-hidden" style={{
        background: isPipelineActive ? 'linear-gradient(135deg, rgba(0,229,255,0.06), rgba(139,92,246,0.04))' : 'var(--bg3)',
        border: `1px solid ${isPipelineActive ? 'rgba(0,229,255,0.15)' : 'var(--border)'}`,
        borderLeft: isPipelineActive ? '4px solid var(--cyan)' : 'none',
      }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: isPipelineActive ? 'var(--cyan2)' : 'var(--bg4)' }}>
                {isPipelineActive ? <Activity size={20} style={{ color: 'var(--cyan)' }} /> : <Clock size={20} style={{ color: 'var(--text3)' }} />}
              </div>
              <div>
                <span className="text-[14px] font-bold" style={{ color: isPipelineActive ? 'var(--cyan)' : 'var(--text3)' }}>
                  {isPipelineActive ? 'Pipeline Español Activo' : 'Sin Datos'}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className="text-[9px]" style={{ background: 'var(--bg4)', color: 'var(--text3)', border: '1px solid var(--border)' }}>ES Pipeline V1</Badge>
                  {status && <Badge className="text-[9px]" style={{ background: 'rgba(0,229,255,0.08)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.15)' }}>Límite Diario: {status.limits.maxDaily}</Badge>}
                </div>
              </div>
            </div>
            {status && (
              <div className="flex items-center gap-4 text-center">
                <div><div className="font-mono-price text-[18px] font-bold" style={{ color: '#22C55E' }}>{status.totalPublished}</div><div className="text-[9px]" style={{ color: 'var(--text3)' }}>Publicados</div></div>
                <div><div className="font-mono-price text-[18px] font-bold" style={{ color: '#FFB800' }}>{status.pending}</div><div className="text-[9px]" style={{ color: 'var(--text3)' }}>Pendientes</div></div>
                <div><div className="font-mono-price text-[18px] font-bold" style={{ color: 'var(--cyan)' }}>{status.totalReady}</div><div className="text-[9px]" style={{ color: 'var(--text3)' }}>Listos</div></div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {status && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MiniStat icon={CheckCircle2} label="Total ES Publicados" value={status.totalPublished} color="#22C55E" sub={`Listos: ${status.totalReady}`} />
          <MiniStat icon={Activity} label="Publicados Hoy" value={status.publishedToday} color="#00E5FF" sub={`Límite: ${status.limits.maxDaily}`} />
          <MiniStat icon={Clock} label="Publicados Esta Hora" value={status.publishedThisHour} color="#F59E0B" sub={`Límite: ${status.limits.maxHourly}`} />
          <MiniStat icon={Zap} label="Sin Imagen" value={status.publishedWithoutImage} color="#8B5CF6" />
        </div>
      )}

      <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <CardContent className="p-4">
          <div className="text-[13px] font-bold flex items-center gap-2 mb-3" style={{ color: 'var(--text)' }}>
            <Zap size={15} style={{ color: 'var(--cyan)' }} /> Acciones del Pipeline Español
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={() => runAction('full-cycle')} disabled={!!actionLoading} size="sm"
              className="text-[12px] font-bold gap-1.5 h-9 px-4"
              style={{ background: actionLoading === 'full-cycle' ? 'var(--cyan2)' : 'linear-gradient(135deg, var(--cyan), #0ea5e9)', color: 'var(--bg)', border: '1px solid rgba(0,229,255,0.3)' }}>
              {actionLoading === 'full-cycle' ? <Loader2 size={13} className="animate-spin" /> : <Rocket size={13} />} Ciclo Completo
            </Button>
            <Button onClick={() => runAction('fetch')} disabled={!!actionLoading} size="sm"
              className="text-[12px] font-bold gap-1.5 h-9 px-4"
              style={{ background: 'rgba(0,229,255,0.06)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.2)' }}>
              {actionLoading === 'fetch' ? <Loader2 size={13} className="animate-spin" /> : <Newspaper size={13} />} Obtener RSS
            </Button>
            <Button onClick={() => runAction('process')} disabled={!!actionLoading} size="sm"
              className="text-[12px] font-bold gap-1.5 h-9 px-4"
              style={{ background: 'rgba(212,175,55,0.06)', color: 'var(--gold)', border: '1px solid rgba(212,175,55,0.2)' }}>
              {actionLoading === 'process' ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />} Procesar Artículos
            </Button>
          </div>
          <div className="mt-3 p-2 rounded-lg flex items-center gap-2" style={{ background: 'rgba(0,229,255,0.04)' }}>
            <Zap size={12} style={{ color: 'var(--cyan)' }} />
            <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
              Ciclo Completo = RSS → Análisis IA → Imagen → Publicar
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

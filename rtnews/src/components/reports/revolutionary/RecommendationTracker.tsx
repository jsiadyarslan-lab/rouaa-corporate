'use client';

import { useState, useCallback, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════
// Revolutionary Addition #3: Recommendation Tracker
// Tracks report recommendations with entry/target/stop prices,
// allowing users to mark them as executed, pending, or missed.
// Persists state in localStorage.
// ═══════════════════════════════════════════════════════════════

interface Recommendation {
  asset: string;
  action: string;
  entry?: string;
  stopLoss?: string;
  target?: string;
  allocation?: string;
  segment?: string;
}

interface Props {
  reportId: string;
  reportTitle: string;
  content: string;
  locale?: 'en' | 'fr' | 'ar' | 'tr' | 'es';
}

const LABELS: Record<string, Record<string, string>> = {
  en: {
    title: 'Recommendation Tracker',
    subtitle: 'Track and manage report recommendations',
    asset: 'Asset',
    action: 'Action',
    entry: 'Entry',
    stopLoss: 'Stop Loss',
    target: 'Target',
    allocation: 'Allocation',
    segment: 'Segment',
    status: 'Status',
    pending: 'Pending',
    executed: 'Executed',
    hitTarget: 'Hit Target',
    stopped: 'Stopped',
    missed: 'Missed',
    noRecommendations: 'No actionable recommendations found in this report',
    trackingProgress: 'Tracking Progress',
    completed: 'completed',
  },
  fr: {
    title: 'Suivi des Recommandations',
    subtitle: 'Suivez et gérez les recommandations du rapport',
    asset: 'Actif',
    action: 'Action',
    entry: 'Entrée',
    stopLoss: 'Stop Loss',
    target: 'Objectif',
    allocation: 'Allocation',
    segment: 'Segment',
    status: 'Statut',
    pending: 'En attente',
    executed: 'Exécuté',
    hitTarget: 'Objectif Atteint',
    stopped: 'Stop Touché',
    missed: 'Raté',
    noRecommendations: 'Aucune recommandation actionnable trouvée dans ce rapport',
    trackingProgress: 'Progression du Suivi',
    completed: 'terminé',
  },
  ar: {
    title: 'متتبع التوصيات',
    subtitle: 'تتبع وإدارة توصيات التقرير',
    asset: 'الأصل',
    action: 'الإجراء',
    entry: 'الدخول',
    stopLoss: 'وقف الخسارة',
    target: 'الهدف',
    allocation: 'التخصيص',
    segment: 'الشريحة',
    status: 'الحالة',
    pending: 'قيد الانتظار',
    executed: 'تم التنفيذ',
    hitTarget: 'تم بلوغ الهدف',
    stopped: 'تم إيقافه',
    missed: 'فائت',
    noRecommendations: 'لم يتم العثور على توصيات قابلة للتنفيذ في هذا التقرير',
    trackingProgress: 'تقدم المتابعة',
    completed: 'مكتمل',
  },
  es: {
    title: 'Rastreador de Recomendaciones',
    subtitle: 'Rastree y gestione las recomendaciones del informe',
    asset: 'Activo',
    action: 'Acción',
    entry: 'Entrada',
    stopLoss: 'Stop Loss',
    target: 'Objetivo',
    allocation: 'Asignación',
    segment: 'Segmento',
    status: 'Estado',
    pending: 'Pendiente',
    executed: 'Ejecutado',
    hitTarget: 'Objetivo Alcanzado',
    stopped: 'Stop Alcanzado',
    missed: 'Perdido',
    noRecommendations: 'No se encontraron recomendaciones accionables en este informe',
    trackingProgress: 'Progreso de Seguimiento',
    completed: 'completado',
  },
};

type RecStatus = 'pending' | 'executed' | 'hitTarget' | 'stopped' | 'missed';

function extractRecommendations(content: string, locale: string): Recommendation[] {
  const recs: Recommendation[] = [];
  const lines = content.split('\n');

  // Pattern: Asset | Action | Entry: X | Stop: Y | Target: Z
  const pipePattern = /^(.+?)\s*\|\s*(Achat|Vente|Acheter|Vendre|Buy|Sell|شراء|بيع|Accumuler|Surveiller|Hold)\s*\|\s*.*?(?:Entrée|Entry|الدخول)\s*:?\s*([^\|]+)/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('-') && trimmed.length < 10) continue;

    // Pipe-separated format: "Or | Achat | Entrée: 2400$ | Stop: 2370$ | Objectif: 2460$"
    if (trimmed.includes('|')) {
      const parts = trimmed.split('|').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 3) {
        const asset = parts[0].replace(/^[-•*]\s*/, '').replace(/\*\*/g, '').trim();
        if (asset.length < 2 || asset.length > 40) continue;

        const action = parts[1]?.trim() || '';
        const entry = parts.find(p => /entr[eé]e|entry|الدخول/i.test(p))?.replace(/.*?:\s*/i, '').trim();
        const stopLoss = parts.find(p => /stop|وقف/i.test(p))?.replace(/.*?:\s*/i, '').trim();
        const target = parts.find(p => /objectif|target|الهدف/i.test(p))?.replace(/.*?:\s*/i, '').trim();
        const allocation = parts.find(p => /allocation|تخصيص/i.test(p))?.replace(/.*?:\s*/i, '').trim();

        if (asset && action) {
          recs.push({ asset, action, entry, stopLoss, target, allocation });
        }
      }
    }
  }

  // Also try bullet-point format: "- **Brent**: Achat à 85$ / Stop 82$ / Objectif 89$"
  const bulletPattern = /^[-•*]\s*\*\*(.+?)\*\*\s*[:\-–]\s*(.+)/gm;
  let match;
  while ((match = bulletPattern.exec(content)) !== null) {
    const asset = match[1].trim();
    const rest = match[2].trim();
    const actionMatch = rest.match(/^(Achat|Vente|Acheter|Vendre|Buy|Sell|شراء|بيع|Accumuler|Surveiller|Hold)/i);
    const entryMatch = rest.match(/(?:Entrée|Entry|الدخول|à|at)\s*:?\s*(\d[\d,.]*\s*\$?)/i);
    const stopMatch = rest.match(/(?:Stop|وقف)\s*:?\s*(\d[\d,.]*\s*\$?)/i);
    const targetMatch = rest.match(/(?:Objectif|Target|الهدف)\s*:?\s*(\d[\d,.]*\s*\$?)/i);

    if (asset && actionMatch) {
      recs.push({
        asset,
        action: actionMatch[1],
        entry: entryMatch?.[1],
        stopLoss: stopMatch?.[1],
        target: targetMatch?.[1],
      });
    }
  }

  return recs.slice(0, 12); // Max 12 recommendations
}

const STATUS_COLORS: Record<RecStatus, string> = {
  pending: '#D4930D',
  executed: '#00996B',
  hitTarget: '#00996B',
  stopped: '#D4365C',
  missed: '#D4365C',
};

export default function RecommendationTracker({ reportId, reportTitle, content, locale = 'en' }: Props) {
  const t = (key: string) => LABELS[locale]?.[key] || LABELS.en[key] || key;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  const recommendations = useMemo(() => extractRecommendations(content, locale), [content, locale]);

  const storageKey = `rec-tracker-${reportId}`;
  const [statuses, setStatuses] = useState<Record<number, RecStatus>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const cycleStatus = useCallback((idx: number) => {
    setStatuses(prev => {
      const current: RecStatus = prev[idx] || 'pending';
      const cycle: RecStatus[] = ['pending', 'executed', 'hitTarget', 'stopped', 'missed'];
      const nextIdx = (cycle.indexOf(current) + 1) % cycle.length;
      const next = { ...prev, [idx]: cycle[nextIdx] };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [storageKey]);

  const completedCount = Object.values(statuses).filter(s => s !== 'pending').length;
  const progress = recommendations.length > 0 ? Math.round((completedCount / recommendations.length) * 100) : 0;

  if (recommendations.length === 0) return null;

  return (
    <div style={{
      background: 'rgba(10, 14, 39, 0.6)',
      border: '1px solid rgba(0, 229, 255, 0.15)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      direction: dir,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span style={{ fontSize: '18px' }}>&#10003;</span>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-head)', margin: 0 }}>{t('title')}</h3>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text3)', margin: '0 0 16px 0' }}>{t('subtitle')}</p>

      {/* Progress bar */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{t('trackingProgress')}</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-head)' }}>{completedCount}/{recommendations.length} {t('completed')}</span>
        </div>
        <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(128,128,128,0.12)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '2px', width: `${progress}%`, background: 'linear-gradient(90deg, #00996B, #00C897)', transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Recommendations list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {recommendations.map((rec, idx) => {
          const status: RecStatus = statuses[idx] || 'pending';
          return (
            <div key={idx} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '8px',
              background: 'rgba(128,128,128,0.04)',
              border: '1px solid rgba(128,128,128,0.08)',
            }}>
              {/* Status button */}
              <button
                onClick={() => cycleStatus(idx)}
                style={{
                  minWidth: '20px', height: '20px', borderRadius: '50%',
                  border: `2px solid ${STATUS_COLORS[status]}`,
                  background: status !== 'pending' ? STATUS_COLORS[status] : 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '10px', fontWeight: 700,
                  transition: 'all 0.15s',
                }}
                title={t(status)}
              >
                {status === 'pending' ? '' : status === 'hitTarget' ? '✓' : status === 'stopped' ? '✕' : status === 'executed' ? '►' : '—'}
              </button>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-head)' }}>{rec.asset}</span>
                  <span style={{
                    fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '3px',
                    background: rec.action.match(/achat|buy|شراء|accumuler/i) ? 'rgba(0,153,107,0.1)' : rec.action.match(/vente|sell|بيع/i) ? 'rgba(212,54,92,0.1)' : 'rgba(212,147,13,0.1)',
                    color: rec.action.match(/achat|buy|شراء|accumuler/i) ? '#00996B' : rec.action.match(/vente|sell|بيع/i) ? '#D4365C' : '#D4930D',
                  }}>
                    {rec.action}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '10px', color: 'var(--text3)', flexWrap: 'wrap' }}>
                  {rec.entry && <span>{t('entry')}: <b style={{ color: 'var(--text2)' }}>{rec.entry}</b></span>}
                  {rec.stopLoss && <span>{t('stopLoss')}: <b style={{ color: '#D4365C' }}>{rec.stopLoss}</b></span>}
                  {rec.target && <span>{t('target')}: <b style={{ color: '#00996B' }}>{rec.target}</b></span>}
                </div>
              </div>

              <span style={{
                fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                background: `${STATUS_COLORS[status]}15`, color: STATUS_COLORS[status],
                border: `1px solid ${STATUS_COLORS[status]}25`,
              }}>
                {t(status)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

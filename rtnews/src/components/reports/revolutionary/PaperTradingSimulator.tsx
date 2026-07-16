'use client';

import { useState, useCallback, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════
// Revolutionary Addition #7: Paper Trading Simulator
// Simulate trades based on report recommendations.
// Users can enter virtual positions, track P&L, and manage
// a virtual portfolio based on report insights.
// ═══════════════════════════════════════════════════════════════

interface Props {
  reportId: string;
  reportTitle: string;
  marketImpact: string;
  content: string;
  locale?: 'en' | 'fr' | 'ar' | 'tr' | 'es';
}

interface VirtualPosition {
  id: string;
  asset: string;
  direction: 'long' | 'short';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  stopLoss?: number;
  target?: number;
  pnl: number;
  pnlPct: number;
  status: 'open' | 'closed';
  openedAt: string;
}

const LABELS: Record<string, Record<string, string>> = {
  en: {
    title: 'Paper Trading Simulator',
    subtitle: 'Practice trading based on report recommendations',
    portfolio: 'Virtual Portfolio',
    balance: 'Balance',
    totalPnl: 'Total P&L',
    openPositions: 'Open Positions',
    openTrade: 'Open Trade',
    closePosition: 'Close',
    asset: 'Asset',
    direction: 'Direction',
    long: 'Long',
    short: 'Short',
    entryPrice: 'Entry Price',
    quantity: 'Quantity',
    stopLoss: 'Stop Loss',
    target: 'Target',
    pnl: 'P&L',
    noOpenPositions: 'No open positions — start by opening a virtual trade',
    disclaimer: 'This is a simulation only. No real money is involved.',
    winRate: 'Win Rate',
    trades: 'Trades',
    avgPnl: 'Avg P&L',
    closedPositions: 'Closed Positions',
  },
  fr: {
    title: 'Simulateur de Trading Virtuel',
    subtitle: 'Pratiquez le trading basé sur les recommandations du rapport',
    portfolio: 'Portefeuille Virtuel',
    balance: 'Solde',
    totalPnl: 'P&L Total',
    openPositions: 'Positions Ouvertes',
    openTrade: 'Ouvrir un Trade',
    closePosition: 'Fermer',
    asset: 'Actif',
    direction: 'Direction',
    long: 'Long',
    short: 'Short',
    entryPrice: 'Prix d\'Entrée',
    quantity: 'Quantité',
    stopLoss: 'Stop Loss',
    target: 'Objectif',
    pnl: 'P&L',
    noOpenPositions: 'Aucune position ouverte — commencez par ouvrir un trade virtuel',
    disclaimer: 'Ceci est une simulation uniquement. Aucun argent réel n\'est impliqué.',
    winRate: 'Taux de Réussite',
    trades: 'Trades',
    avgPnl: 'P&L Moyen',
    closedPositions: 'Positions Fermées',
  },
  ar: {
    title: 'محاكي التداول الورقي',
    subtitle: 'تدرب على التداول بناءً على توصيات التقرير',
    portfolio: 'المحفظة الافتراضية',
    balance: 'الرصيد',
    totalPnl: 'الربح/الخسارة الإجمالية',
    openPositions: 'المراكز المفتوحة',
    openTrade: 'فتح صفقة',
    closePosition: 'إغلاق',
    asset: 'الأصل',
    direction: 'الاتجاه',
    long: 'شراء',
    short: 'بيع',
    entryPrice: 'سعر الدخول',
    quantity: 'الكمية',
    stopLoss: 'وقف الخسارة',
    target: 'الهدف',
    pnl: 'الربح/الخسارة',
    noOpenPositions: 'لا توجد مراكز مفتوحة — ابدأ بفتح صفقة افتراضية',
    disclaimer: 'هذه محاكاة فقط. لا يوجد أموال حقيقية متضمنة.',
    winRate: 'نسبة الفوز',
    trades: 'الصفقات',
    avgPnl: 'متوسط الربح/الخسارة',
    closedPositions: 'المراكز المغلقة',
  },
  es: {
    title: 'Simulador de Trading en Papel',
    subtitle: 'Practique trading basado en las recomendaciones del informe',
    portfolio: 'Portafolio Virtual',
    balance: 'Saldo',
    totalPnl: 'P&L Total',
    openPositions: 'Posiciones Abiertas',
    openTrade: 'Abrir Operación',
    closePosition: 'Cerrar',
    asset: 'Activo',
    direction: 'Dirección',
    long: 'Largo',
    short: 'Corto',
    entryPrice: 'Precio de Entrada',
    quantity: 'Cantidad',
    stopLoss: 'Stop Loss',
    target: 'Objetivo',
    pnl: 'P&L',
    noOpenPositions: 'Sin posiciones abiertas — comience abriendo una operación virtual',
    disclaimer: 'Esto es solo una simulación. No hay dinero real involucrado.',
    winRate: 'Tasa de Éxito',
    trades: 'Operaciones',
    avgPnl: 'P&L Promedio',
    closedPositions: 'Posiciones Cerradas',
  },
};

export default function PaperTradingSimulator({ reportId, reportTitle, marketImpact, content, locale = 'en' }: Props) {
  const t = (key: string) => LABELS[locale]?.[key] || LABELS.en[key] || key;

  const storageKey = `paper-trading-${reportId}`;
  const [positions, setPositions] = useState<VirtualPosition[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ asset: '', direction: 'long' as 'long' | 'short', entryPrice: '', quantity: '', stopLoss: '', target: '' });

  const savePositions = useCallback((pos: VirtualPosition[]) => {
    setPositions(pos);
    try { localStorage.setItem(storageKey, JSON.stringify(pos)); } catch {}
  }, [storageKey]);

  const handleOpenTrade = useCallback(() => {
    const entry = parseFloat(formData.entryPrice);
    const qty = parseFloat(formData.quantity);
    if (!formData.asset || isNaN(entry) || isNaN(qty) || entry <= 0 || qty <= 0) return;

    // Simulate current price with slight random movement
    const drift = marketImpact === 'bullish' ? 0.02 : marketImpact === 'bearish' ? -0.02 : 0;
    const currentPrice = entry * (1 + drift + (Math.random() - 0.5) * 0.04);

    const direction = formData.direction;
    const pnl = direction === 'long'
      ? (currentPrice - entry) * qty
      : (entry - currentPrice) * qty;
    const pnlPct = direction === 'long'
      ? ((currentPrice - entry) / entry) * 100
      : ((entry - currentPrice) / entry) * 100;

    const newPos: VirtualPosition = {
      id: Date.now().toString(),
      asset: formData.asset,
      direction,
      entryPrice: entry,
      currentPrice: Math.round(currentPrice * 100) / 100,
      quantity: qty,
      stopLoss: formData.stopLoss ? parseFloat(formData.stopLoss) : undefined,
      target: formData.target ? parseFloat(formData.target) : undefined,
      pnl: Math.round(pnl * 100) / 100,
      pnlPct: Math.round(pnlPct * 100) / 100,
      status: 'open',
      openedAt: new Date().toISOString(),
    };

    savePositions([...positions, newPos]);
    setShowForm(false);
    setFormData({ asset: '', direction: 'long', entryPrice: '', quantity: '', stopLoss: '', target: '' });
  }, [formData, marketImpact, positions, savePositions]);

  const handleClosePosition = useCallback((id: string) => {
    const updated = positions.map(p => p.id === id ? { ...p, status: 'closed' as const } : p);
    savePositions(updated);
  }, [positions, savePositions]);

  const stats = useMemo(() => {
    const open = positions.filter(p => p.status === 'open');
    const closed = positions.filter(p => p.status === 'closed');
    const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
    const wins = closed.filter(p => p.pnl > 0).length;
    const winRate = closed.length > 0 ? Math.round((wins / closed.length) * 100) : 0;
    const avgPnl = closed.length > 0 ? Math.round((closed.reduce((s, p) => s + p.pnl, 0) / closed.length) * 100) / 100 : 0;
    const balance = 100000 + totalPnl; // Starting balance: $100,000

    return { open, closed, totalPnl, winRate, avgPnl, balance };
  }, [positions]);

  return (
    <div style={{
      background: 'rgba(10, 14, 39, 0.6)',
      border: '1px solid rgba(0, 229, 255, 0.15)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span style={{ fontSize: '18px' }}>&#128200;</span>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-head)', margin: 0 }}>{t('title')}</h3>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text3)', margin: '0 0 16px 0' }}>{t('subtitle')}</p>

      {/* Portfolio Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
        <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(128,128,128,0.05)', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>{t('balance')}</div>
          <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-head)' }}>
            ${Math.round(stats.balance).toLocaleString()}
          </div>
        </div>
        <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(128,128,128,0.05)', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>{t('totalPnl')}</div>
          <div style={{ fontSize: '16px', fontWeight: 900, color: stats.totalPnl >= 0 ? '#00996B' : '#D4365C' }}>
            {stats.totalPnl >= 0 ? '+' : ''}{Math.round(stats.totalPnl).toLocaleString()}$
          </div>
        </div>
        <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(128,128,128,0.05)', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>{t('winRate')}</div>
          <div style={{ fontSize: '16px', fontWeight: 900, color: stats.winRate >= 50 ? '#00996B' : '#D4365C' }}>
            {stats.winRate}%
          </div>
        </div>
      </div>

      {/* Open Trade Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          width: '100%', padding: '10px', borderRadius: '8px', marginBottom: '12px',
          background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)',
          color: 'var(--cyan)', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
        }}
      >
        {showForm ? '✕' : '+'} {t('openTrade')}
      </button>

      {/* Trade Form */}
      {showForm && (
        <div style={{
          padding: '16px', borderRadius: '8px', marginBottom: '12px',
          background: 'rgba(0,229,255,0.03)', border: '1px solid rgba(0,229,255,0.08)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--text3)', display: 'block', marginBottom: '3px' }}>{t('asset')}</label>
              <input value={formData.asset} onChange={e => setFormData(p => ({ ...p, asset: e.target.value }))}
                placeholder="Brent, EUR/USD..."
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', background: 'rgba(128,128,128,0.06)', border: '1px solid rgba(128,128,128,0.12)', color: 'var(--text2)', fontSize: '12px' }} />
            </div>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--text3)', display: 'block', marginBottom: '3px' }}>{t('direction')}</label>
              <select value={formData.direction} onChange={e => setFormData(p => ({ ...p, direction: e.target.value as 'long' | 'short' }))}
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', background: 'rgba(128,128,128,0.06)', border: '1px solid rgba(128,128,128,0.12)', color: 'var(--text2)', fontSize: '12px' }}>
                <option value="long">{t('long')}</option>
                <option value="short">{t('short')}</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--text3)', display: 'block', marginBottom: '3px' }}>{t('entryPrice')}</label>
              <input type="number" value={formData.entryPrice} onChange={e => setFormData(p => ({ ...p, entryPrice: e.target.value }))}
                placeholder="0.00"
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', background: 'rgba(128,128,128,0.06)', border: '1px solid rgba(128,128,128,0.12)', color: 'var(--text2)', fontSize: '12px' }} />
            </div>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--text3)', display: 'block', marginBottom: '3px' }}>{t('quantity')}</label>
              <input type="number" value={formData.quantity} onChange={e => setFormData(p => ({ ...p, quantity: e.target.value }))}
                placeholder="100"
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', background: 'rgba(128,128,128,0.06)', border: '1px solid rgba(128,128,128,0.12)', color: 'var(--text2)', fontSize: '12px' }} />
            </div>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--text3)', display: 'block', marginBottom: '3px' }}>{t('stopLoss')}</label>
              <input type="number" value={formData.stopLoss} onChange={e => setFormData(p => ({ ...p, stopLoss: e.target.value }))}
                placeholder="Optional"
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', background: 'rgba(128,128,128,0.06)', border: '1px solid rgba(128,128,128,0.12)', color: 'var(--text2)', fontSize: '12px' }} />
            </div>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--text3)', display: 'block', marginBottom: '3px' }}>{t('target')}</label>
              <input type="number" value={formData.target} onChange={e => setFormData(p => ({ ...p, target: e.target.value }))}
                placeholder="Optional"
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', background: 'rgba(128,128,128,0.06)', border: '1px solid rgba(128,128,128,0.12)', color: 'var(--text2)', fontSize: '12px' }} />
            </div>
          </div>
          <button onClick={handleOpenTrade} style={{
            width: '100%', marginTop: '10px', padding: '8px', borderRadius: '6px',
            background: 'rgba(0,153,107,0.15)', border: '1px solid rgba(0,153,107,0.3)',
            color: '#00996B', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
          }}>
            {t('openTrade')}
          </button>
        </div>
      )}

      {/* Open Positions */}
      {stats.open.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 600, marginBottom: '8px' }}>{t('openPositions')}</div>
          {stats.open.map(pos => (
            <div key={pos.id} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 10px', borderRadius: '6px', marginBottom: '6px',
              background: 'rgba(128,128,128,0.04)', border: '1px solid rgba(128,128,128,0.08)',
            }}>
              <span style={{
                fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px',
                background: pos.direction === 'long' ? 'rgba(0,153,107,0.1)' : 'rgba(212,54,92,0.1)',
                color: pos.direction === 'long' ? '#00996B' : '#D4365C',
              }}>
                {pos.direction === 'long' ? t('long') : t('short')}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-head)' }}>{pos.asset}</span>
              <span style={{ fontSize: '11px', color: 'var(--text3)', marginLeft: 'auto' }}>
                @{pos.entryPrice} × {pos.quantity}
              </span>
              <span style={{
                fontSize: '12px', fontWeight: 700,
                color: pos.pnl >= 0 ? '#00996B' : '#D4365C',
              }}>
                {pos.pnl >= 0 ? '+' : ''}{pos.pnl}$ ({pos.pnlPct}%)
              </span>
              <button onClick={() => handleClosePosition(pos.id)} style={{
                fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
                background: 'rgba(212,54,92,0.1)', border: '1px solid rgba(212,54,92,0.2)',
                color: '#D4365C', cursor: 'pointer', fontWeight: 600,
              }}>
                {t('closePosition')}
              </button>
            </div>
          ))}
        </div>
      )}

      {stats.open.length === 0 && (
        <p style={{ fontSize: '12px', color: 'var(--text3)', textAlign: 'center', padding: '12px' }}>
          {t('noOpenPositions')}
        </p>
      )}

      {/* Disclaimer */}
      <div style={{
        fontSize: '10px', color: 'var(--text3)', textAlign: 'center', padding: '8px',
        borderRadius: '4px', background: 'rgba(128,128,128,0.03)',
        border: '1px solid rgba(128,128,128,0.06)',
      }}>
        ⚠ {t('disclaimer')}
      </div>
    </div>
  );
}

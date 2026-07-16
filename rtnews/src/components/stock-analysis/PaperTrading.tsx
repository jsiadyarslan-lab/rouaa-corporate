'use client';

// ─── Paper Trading Simulator ──────────────────────────────────
// Simple paper trading interface with localStorage persistence.
// Virtual $100K starting balance, buy/sell, positions tracking.
// localStorage keys: paperTrading_portfolio, paperTrading_history

import { useState, useEffect, useCallback } from 'react';
import type { Locale } from '@/lib/locale';

const PORTFOLIO_KEY = 'paperTrading_portfolio';
const HISTORY_KEY = 'paperTrading_history';
const INITIAL_BALANCE = 100000;

// ── Locale Labels ──
const LABELS: Record<string, Record<string, string>> = {
  en: {
    paperTrading: 'Paper Trading Simulator',
    balance: 'Cash Balance',
    portfolioValue: 'Portfolio Value',
    totalPnl: 'Total P/L',
    pnlPercent: 'P/L %',
    buy: 'Buy',
    sell: 'Sell',
    quantity: 'Quantity',
    positions: 'Open Positions',
    tradeHistory: 'Trade History',
    noPositions: 'No open positions',
    noHistory: 'No trade history',
    entryPrice: 'Entry',
    currentPrice: 'Current',
    pl: 'P/L',
    plPercent: 'P/L %',
    shares: 'Shares',
    action: 'Action',
    price: 'Price',
    date: 'Date',
    resetPortfolio: 'Reset',
    confirmReset: 'Reset portfolio? All positions and history will be lost.',
    insufficientFunds: 'Insufficient funds',
    noShares: 'No shares to sell',
    bought: 'Bought',
    sold: 'Sold',
    virtualBalance: 'Virtual $100K Balance',
    symbol: 'Symbol',
    totalValue: 'Total Value',
    loading: 'Loading portfolio...',
    portfolioSummary: 'Portfolio Summary',
    last10Trades: 'Last 10 Trades',
  },
  ar: {
    paperTrading: 'محاكي التداول الورقي',
    balance: 'الرصيد النقدي',
    portfolioValue: 'قيمة المحفظة',
    totalPnl: 'الربح/الخسارة',
    pnlPercent: 'نسبة ر/خ',
    buy: 'شراء',
    sell: 'بيع',
    quantity: 'الكمية',
    positions: 'المراكز المفتوحة',
    tradeHistory: 'سجل التداول',
    noPositions: 'لا توجد مراكز مفتوحة',
    noHistory: 'لا يوجد سجل تداول',
    entryPrice: 'سعر الدخول',
    currentPrice: 'السعر الحالي',
    pl: 'ر/خ',
    plPercent: 'نسبة ر/خ',
    shares: 'الأسهم',
    action: 'الإجراء',
    price: 'السعر',
    date: 'التاريخ',
    resetPortfolio: 'إعادة تعيين',
    confirmReset: 'إعادة تعيين المحفظة؟ سيتم حذف جميع المراكز والسجل.',
    insufficientFunds: 'رصيد غير كافٍ',
    noShares: 'لا توجد أسهم للبيع',
    bought: 'تم الشراء',
    sold: 'تم البيع',
    virtualBalance: 'رصيد وهمي ١٠٠ ألف دولار',
    symbol: 'الرمز',
    totalValue: 'القيمة الإجمالية',
    loading: 'جارٍ تحميل المحفظة...',
    portfolioSummary: 'ملخص المحفظة',
    last10Trades: 'آخر ١٠ صفقات',
  },
  fr: {
    paperTrading: 'Simulateur de Trading Papier',
    balance: 'Solde',
    portfolioValue: 'Valeur du Portefeuille',
    totalPnl: 'P/L Total',
    pnlPercent: 'P/L %',
    buy: 'Acheter',
    sell: 'Vendre',
    quantity: 'Quantité',
    positions: 'Positions Ouvertes',
    tradeHistory: 'Historique',
    noPositions: 'Aucune position ouverte',
    noHistory: "Aucun historique d'échange",
    entryPrice: "Prix d'Entrée",
    currentPrice: 'Prix Actuel',
    pl: 'P/L',
    plPercent: 'P/L %',
    shares: 'Actions',
    action: 'Action',
    price: 'Prix',
    date: 'Date',
    resetPortfolio: 'Réinitialiser',
    confirmReset: 'Réinitialiser le portefeuille ? Toutes les positions et historique seront perdus.',
    insufficientFunds: 'Fonds insuffisants',
    noShares: 'Aucune action à vendre',
    bought: 'Acheté',
    sold: 'Vendu',
    virtualBalance: 'Solde Virtuel 100K$',
    symbol: 'Symbole',
    totalValue: 'Valeur Totale',
    loading: 'Chargement du portefeuille...',
    portfolioSummary: 'Résumé du Portefeuille',
    last10Trades: '10 Derniers Échanges',
  },
  tr: {
    paperTrading: 'Sanal İşlem Simülatörü',
    balance: 'Nakit Bakiye',
    portfolioValue: 'Portföy Değeri',
    totalPnl: 'Kâr/Zarar',
    pnlPercent: 'K/Z Oranı',
    buy: 'Al',
    sell: 'Sat',
    quantity: 'Miktar',
    positions: 'Açık Pozisyonlar',
    tradeHistory: 'İşlem Geçmişi',
    noPositions: 'Açık pozisyon yok',
    noHistory: 'İşlem geçmişi yok',
    entryPrice: 'Giriş Fiyatı',
    currentPrice: 'Mevcut Fiyat',
    pl: 'K/Z',
    plPercent: 'K/Z %',
    shares: 'Hisseler',
    action: 'İşlem',
    price: 'Fiyat',
    date: 'Tarih',
    resetPortfolio: 'Sıfırla',
    confirmReset: 'Portföyü sıfırlamak istediğinize emin misiniz? Tüm pozisyonlar ve geçmiş silinecektir.',
    insufficientFunds: 'Yetersiz bakiye',
    noShares: 'Satılacak hisse yok',
    bought: 'Satın alındı',
    sold: 'Satıldı',
    virtualBalance: '100.000$ Sanal Bakiye',
    symbol: 'Sembol',
    totalValue: 'Toplam Değer',
    loading: 'Portföy yükleniyor...',
    portfolioSummary: 'Portföy Özeti',
    last10Trades: 'Son 10 İşlem',
  },
  es: {
    paperTrading: 'Simulador de Trading en Papel',
    balance: 'Saldo en Efectivo',
    portfolioValue: 'Valor del Portafolio',
    totalPnl: 'G/P Total',
    pnlPercent: 'G/P %',
    buy: 'Comprar',
    sell: 'Vender',
    quantity: 'Cantidad',
    positions: 'Posiciones Abiertas',
    tradeHistory: 'Historial de Operaciones',
    noPositions: 'No hay posiciones abiertas',
    noHistory: 'No hay historial de operaciones',
    entryPrice: 'Entrada',
    currentPrice: 'Actual',
    pl: 'G/P',
    plPercent: 'G/P %',
    shares: 'Acciones',
    action: 'Acción',
    price: 'Precio',
    date: 'Fecha',
    resetPortfolio: 'Reiniciar',
    confirmReset: '¿Reiniciar portafolio? Se perderán todas las posiciones e historial.',
    insufficientFunds: 'Fondos insuficientes',
    noShares: 'No hay acciones para vender',
    bought: 'Comprado',
    sold: 'Vendido',
    virtualBalance: 'Saldo Virtual de $100K',
    symbol: 'Símbolo',
    totalValue: 'Valor Total',
    loading: 'Cargando portafolio...',
    portfolioSummary: 'Resumen del Portafolio',
    last10Trades: 'Últimas 10 Operaciones',
  },
};

interface Position {
  symbol: string;
  entryPrice: number;
  qty: number;
  date: string;
}

interface TradeRecord {
  symbol: string;
  action: 'buy' | 'sell';
  qty: number;
  price: number;
  date: string;
}

interface PortfolioData {
  balance: number;
  positions: Position[];
}

interface Props {
  symbol: string;
  currentPrice: number;
  locale: Locale;
}

export default function PaperTrading({ symbol, currentPrice, locale }: Props) {
  const t = LABELS[locale] || LABELS.en;
  const isRTL = locale === 'ar';

  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [history, setHistory] = useState<TradeRecord[]>([]);
  const [qty, setQty] = useState('1');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Load from localStorage
  useEffect(() => {
    try {
      const savedPortfolio = localStorage.getItem(PORTFOLIO_KEY);
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedPortfolio) {
        setPortfolio(JSON.parse(savedPortfolio));
      } else {
        setPortfolio({ balance: INITIAL_BALANCE, positions: [] });
      }
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch {
      setPortfolio({ balance: INITIAL_BALANCE, positions: [] });
      setHistory([]);
    }
    setLoading(false);
  }, []);

  // Save portfolio to localStorage
  useEffect(() => {
    if (portfolio) {
      try { localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio)); } catch { /* ignore */ }
    }
  }, [portfolio]);

  // Save history to localStorage
  useEffect(() => {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch { /* ignore */ }
  }, [history]);

  const fmt = (n: number, dec = 2) => n.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });

  const quantity = parseInt(qty) || 0;
  const totalCost = quantity * currentPrice;

  const existingPosition = portfolio?.positions.find(p => p.symbol === symbol);

  // Compute portfolio value
  const positionsValue = (portfolio?.positions || []).reduce((sum, p) => {
    // Use currentPrice for the current symbol, otherwise entryPrice as fallback
    const price = p.symbol === symbol ? currentPrice : p.entryPrice;
    return sum + p.qty * price;
  }, 0);
  const totalValue = (portfolio?.balance || 0) + positionsValue;
  const totalPnl = totalValue - INITIAL_BALANCE;
  const pnlPercent = ((totalPnl / INITIAL_BALANCE) * 100);

  const handleBuy = useCallback(() => {
    if (!portfolio || quantity <= 0) return;
    if (totalCost > portfolio.balance) {
      setMsg(t.insufficientFunds);
      setTimeout(() => setMsg(''), 3000);
      return;
    }
    const newPositions = [...portfolio.positions];
    const existingIdx = newPositions.findIndex(p => p.symbol === symbol);
    if (existingIdx >= 0) {
      const existing = newPositions[existingIdx];
      const totalQty = existing.qty + quantity;
      const avgPrice = ((existing.entryPrice * existing.qty) + (currentPrice * quantity)) / totalQty;
      newPositions[existingIdx] = { ...existing, qty: totalQty, entryPrice: avgPrice };
    } else {
      newPositions.push({ symbol, qty: quantity, entryPrice: currentPrice, date: new Date().toISOString() });
    }
    const trade: TradeRecord = { symbol, action: 'buy', qty: quantity, price: currentPrice, date: new Date().toISOString() };
    setPortfolio({ balance: portfolio.balance - totalCost, positions: newPositions });
    setHistory(prev => [trade, ...prev]);
    setQty('1');
  }, [quantity, totalCost, portfolio, symbol, currentPrice, t.insufficientFunds]);

  const handleSell = useCallback(() => {
    if (!portfolio || quantity <= 0) return;
    if (!existingPosition || existingPosition.qty < quantity) {
      setMsg(t.noShares);
      setTimeout(() => setMsg(''), 3000);
      return;
    }
    const newPositions = [...portfolio.positions];
    const idx = newPositions.findIndex(p => p.symbol === symbol);
    if (idx >= 0) {
      if (newPositions[idx].qty === quantity) {
        newPositions.splice(idx, 1);
      } else {
        newPositions[idx] = { ...newPositions[idx], qty: newPositions[idx].qty - quantity };
      }
    }
    const trade: TradeRecord = { symbol, action: 'sell', qty: quantity, price: currentPrice, date: new Date().toISOString() };
    setPortfolio({ balance: portfolio.balance + (currentPrice * quantity), positions: newPositions });
    setHistory(prev => [trade, ...prev]);
    setQty('1');
  }, [quantity, existingPosition, symbol, currentPrice, portfolio, t.noShares]);

  const handleReset = useCallback(() => {
    if (typeof window !== 'undefined' && confirm(t.confirmReset)) {
      setPortfolio({ balance: INITIAL_BALANCE, positions: [] });
      setHistory([]);
    }
  }, [t.confirmReset]);

  // Loading state
  if (loading || !portfolio) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="glass-card" style={{ borderRadius: 12, padding: 20, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--cyan2)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>{t.paperTrading}</span>
        </div>
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text3)', fontSize: 13, borderRadius: 8, background: 'var(--bg)' }}>
          {t.loading}
        </div>
      </div>
    );
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="glass-card" style={{ borderRadius: 12, padding: 20, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--cyan2)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>{t.paperTrading}</span>
        </div>
        <button onClick={handleReset} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
          {t.resetPortfolio}
        </button>
      </div>

      {/* ── Portfolio Summary Card ── */}
      <div style={{ padding: '16px', borderRadius: 10, background: 'var(--bg)', marginBottom: 16, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginBottom: 12 }}>{t.portfolioSummary}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
          {[
            { label: t.totalValue, value: `$${fmt(totalValue)}`, color: 'var(--cyan)' },
            { label: t.totalPnl, value: `${totalPnl >= 0 ? '+' : ''}$${fmt(totalPnl)}`, color: totalPnl >= 0 ? 'var(--bull)' : 'var(--bear)' },
            { label: t.pnlPercent, value: `${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%`, color: totalPnl >= 0 ? 'var(--bull)' : 'var(--bear)' },
            { label: t.balance, value: `$${fmt(portfolio.balance)}`, color: 'var(--text-head)' },
          ].map(item => (
            <div key={item.label} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg2)', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: item.color, fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Buy/Sell Form ── */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, padding: '14px 16px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginBottom: 4 }}>{t.quantity}</div>
          <input
            type="number"
            min="1"
            value={qty}
            onChange={e => setQty(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 6,
              border: '1px solid var(--border)', background: 'var(--bg2)',
              color: 'var(--text-head)', fontSize: 14, fontWeight: 600,
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ flex: 1.5 }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginBottom: 4 }}>{t.price} ({symbol})</div>
          <div style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg2)', fontSize: 14, fontWeight: 600, color: 'var(--text-head)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
            ${fmt(currentPrice)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-end' }}>
          <button
            onClick={handleBuy}
            style={{
              padding: '8px 20px', borderRadius: 8,
              border: 'none', background: 'var(--bull)',
              color: 'white', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', transition: 'opacity 0.15s',
            }}
          >
            {t.buy}
          </button>
          <button
            onClick={handleSell}
            style={{
              padding: '8px 20px', borderRadius: 8,
              border: 'none', background: 'var(--bear)',
              color: 'white', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', transition: 'opacity 0.15s',
            }}
          >
            {t.sell}
          </button>
        </div>
      </div>

      {/* Error message */}
      {msg && (
        <div style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--bear2)', color: 'var(--bear)', fontSize: 12, fontWeight: 600, marginBottom: 16, textAlign: 'center' }}>
          {msg}
        </div>
      )}

      {/* ── Open Positions Table ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)', marginBottom: 10 }}>{t.positions}</div>
        {portfolio.positions.length > 0 ? (
          <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: 'var(--bg4)' }}>
                  <th style={{ padding: '8px 10px', textAlign: isRTL ? 'right' : 'left', color: 'var(--text3)', fontWeight: 600, fontSize: 10 }}>{t.symbol}</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text3)', fontWeight: 600, fontSize: 10 }}>{t.entryPrice}</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text3)', fontWeight: 600, fontSize: 10 }}>{t.shares}</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text3)', fontWeight: 600, fontSize: 10 }}>{t.currentPrice}</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text3)', fontWeight: 600, fontSize: 10 }}>{t.pl}</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text3)', fontWeight: 600, fontSize: 10 }}>{t.plPercent}</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.positions.map(pos => {
                  const posCurrentPrice = pos.symbol === symbol ? currentPrice : pos.entryPrice;
                  const pl = (posCurrentPrice - pos.entryPrice) * pos.qty;
                  const plPct = ((posCurrentPrice - pos.entryPrice) / pos.entryPrice) * 100;
                  return (
                    <tr key={pos.symbol} style={{ borderBottom: '1px solid var(--border3)' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{pos.symbol}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text2)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>${fmt(pos.entryPrice)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text2)' }}>{pos.qty}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-head)', fontWeight: 600, fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>${fmt(posCurrentPrice)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: pl >= 0 ? 'var(--bull)' : 'var(--bear)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                        {pl >= 0 ? '+' : ''}${fmt(pl)}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: plPct >= 0 ? 'var(--bull)' : 'var(--bear)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                        {plPct >= 0 ? '+' : ''}{plPct.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px', borderRadius: 8, background: 'var(--bg)', color: 'var(--text3)', fontSize: 12 }}>
            {t.noPositions}
          </div>
        )}
      </div>

      {/* ── Trade History (Last 10) ── */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)', marginBottom: 10 }}>{t.last10Trades}</div>
        {history.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
            {history.slice(0, 10).map((trade, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', borderRadius: 6, background: 'var(--bg)', fontSize: 11 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: 10,
                    background: trade.action === 'buy' ? 'var(--bull2)' : 'var(--bear2)',
                    color: trade.action === 'buy' ? 'var(--bull)' : 'var(--bear)',
                  }}>
                    {trade.action === 'buy' ? t.bought : t.sold}
                  </span>
                  <span style={{ color: 'var(--cyan)', fontWeight: 600, fontFamily: 'var(--font-jetbrains-mono), monospace' }}>{trade.symbol}</span>
                  <span style={{ color: 'var(--text3)' }}>×{trade.qty}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--text-head)', fontWeight: 600, fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                    ${fmt(trade.price)}
                  </span>
                  <span style={{ color: 'var(--text4)', fontSize: 10 }}>
                    {new Date(trade.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px', borderRadius: 8, background: 'var(--bg)', color: 'var(--text3)', fontSize: 12 }}>
            {t.noHistory}
          </div>
        )}
      </div>
    </div>
  );
}

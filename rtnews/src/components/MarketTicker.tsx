'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';

interface MarketData {
  symbol: string;
  name: string;
  price: string;
  change: number;
}

export default function MarketTicker() {
  const [markets, setMarkets] = useState<MarketData[]>([
    { symbol: 'XAU', name: 'الذهب', price: '2,345.50', change: 1.2 },
    { symbol: 'BTC', name: 'البيتكوين', price: '64,120', change: -0.8 },
    { symbol: 'ETH', name: 'إيثيريوم', price: '3,150.20', change: 2.1 },
    { symbol: 'DXY', name: 'الدولار', price: '106.12', change: 0.15 },
    { symbol: 'OIL', name: 'برنت', price: '88.40', change: -1.4 },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPrices = async () => {
      // Skip fetching when tab is hidden to save resources
      if (document.hidden) return;
      // Try to get real crypto prices from Binance
      try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT"]');
        const data = await res.json();
        if (Array.isArray(data)) {
          setMarkets(prev => prev.map(m => {
            const btc = data.find(i => i.symbol === 'BTCUSDT');
            const eth = data.find(i => i.symbol === 'ETHUSDT');
            if (m.symbol === 'BTC' && btc) {
              return { ...m, price: parseFloat(btc.lastPrice).toLocaleString('en-US'), change: parseFloat(btc.priceChangePercent) };
            }
            if (m.symbol === 'ETH' && eth) {
              return { ...m, price: parseFloat(eth.lastPrice).toLocaleString('en-US'), change: parseFloat(eth.priceChangePercent) };
            }
            // No jitter for non-crypto — only update when real data changes
            return m;
          }));
        }
      } catch (err) {
        // Don't jitter on error either — just keep previous prices
      }
    };

    fetchPrices(); // Initial fetch
    const interval = setInterval(fetchPrices, 30000); // Reduced from 10s to 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full overflow-hidden border-b border-[var(--border)] bg-[var(--bg2)]/50 backdrop-blur-md py-2 px-4 relative flex items-center gap-6">
      <div className="flex items-center gap-2 flex-shrink-0 border-l border-[var(--border)] pl-4 ml-2">
        <RefreshCw size={12} className={loading ? 'animate-spin text-[var(--cyan)]' : 'text-[var(--text4)]'} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text3)]">Live Markets</span>
      </div>
      
      <div className="flex items-center gap-8 animate-marquee whitespace-nowrap">
        {markets.concat(markets).map((m, i) => (
          <div key={`${m.symbol}-${i}`} className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-[var(--text2)]">{m.name}</span>
            <span className="font-mono-price text-[13px] font-bold tracking-tighter" style={{ color: 'var(--text)' }}>
              ${m.price}
            </span>
            <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              m.change > 0 ? 'text-[var(--bull)] bg-[var(--bull)]/10' : 'text-[var(--bear)] bg-[var(--bear)]/10'
            }`}>
              {m.change > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {Math.abs(m.change).toFixed(2)}%
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .animate-marquee {
          display: flex;
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

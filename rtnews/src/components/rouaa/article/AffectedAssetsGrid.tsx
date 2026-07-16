// ─── Affected Assets Cards (Enhanced) ──────────────────────────
// Interactive cards showing each affected asset with:
// - Mini sparkline visualization (SVG)
// - Better hover effects
// - Percentage change indicator
// - Direction indicator
// - V1180: Symbol is now a clickable link to /stock-analysis/{SYMBOL}
//   (for stock symbols) or /markets?tab={category} (for forex/commodity/crypto)
'use client';

import { useState } from 'react';
import Link from 'next/link';

interface AffectedAsset {
  symbol: string;
  direction: string;
  reason?: string;
  change?: number; // percentage change
  price?: number;
}

interface AffectedAssetsGridProps {
  assets: AffectedAsset[];
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

// V1185: Whitelist-based symbol linking (mirrors publisher.ts logic).
// Only link KNOWN stock symbols — prevents broken links to non-stocks
// like SEC, EDGAR, CPU, GPU, LLC, OTC, etc.
const FOREX_PATTERN = /^[A-Z]{6}$/;
const CRYPTO_SYMBOLS = new Set(['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'MATIC', 'AVAX', 'LINK', 'LTC', 'UNI', 'ATOM', 'XLM']);
const COMMODITY_SYMBOLS = new Set(['GOLD', 'XAU', 'SILVER', 'XAG', 'OIL', 'WTI', 'BRENT', 'NATGAS', 'COPPER', 'PLATINUM', 'PALLADIUM']);
const INDEX_SYMBOLS = new Set(['SPX', 'SP500', 'NDX', 'NASDAQ', 'DJI', 'DOW', 'VIX', 'DXY', 'FTSE', 'DAX', 'CAC', 'NIKKEI', 'HSI']);

const KNOWN_STOCK_SYMBOLS = new Set([
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'V',
  'UNH', 'JNJ', 'WMT', 'XOM', 'PG', 'MA', 'HD', 'CVX', 'MRK', 'ABBV',
  'AVGO', 'KO', 'PEP', 'COST', 'ADBE', 'CRM', 'AMD', 'NFLX', 'INTC', 'CMCSA',
  'LLY', 'NVO', 'ORCL', 'CSCO', 'ABT', 'CVS', 'AXP', 'MCD', 'MDLZ', 'TXN',
  'ISRG', 'GILD', 'REGN', 'VRTX', 'BIIB', 'SBUX', 'BKNG', 'AMGN', 'CAT', 'DE',
  'PYPL', 'SQ', 'SHOP', 'SNAP', 'PIN', 'ROKU', 'ZM', 'DOCU', 'OKTA', 'CRWD',
  'SNOW', 'PLTR', 'COIN', 'RBLX', 'ABNB', 'RIVN', 'LCID', 'NIO', 'XPEV', 'LI',
  'BABA', 'JD', 'PDD', 'NTES', 'TCEHY', 'SE', 'GRAB', 'MSTR', 'MARA', 'RIOT',
  'NVS', 'SNY', 'MRNA', 'BNTX', 'DELL', 'HPQ', 'HPE', 'IBM', 'MU', 'LRCX', 'AMAT', 'KLAC', 'MRVL',
  'CMG', 'YUM', 'DPZ', 'LULU', 'TGT', 'DLTR', 'DG', 'FIVE',
  'BA', 'LMT', 'RTX', 'NOC', 'GD', 'GE', 'MMM', 'HON',
  'BIDU', 'FUTU', 'TME', 'IQ', 'VIPS', 'INFY', 'WIT', 'HDB', 'IBN', 'SEA', 'AEM', 'KL',
  'SPY', 'QQQ', 'IWM', 'DIA', 'VTI', 'VEA', 'VWO', 'BND', 'TLT', 'GLD',
  'SLV', 'USO', 'XLF', 'XLE', 'XLK', 'XLV', 'XLY', 'XLP', 'XLI', 'XLU',
  'MC.PA', 'TTE.PA', 'OR.PA', 'SAP.PA', 'BNP.PA', 'RMS.PA', 'AI.PA', 'EL.PA',
  'SAN.PA', 'CS.PA', 'CAP.PA', 'EN.PA', 'GLE.PA', 'SU.PA', 'RI.PA', 'DG.PA',
  'AIR.PA', 'ALO.PA', 'BN.PA', 'ENGI.PA', 'WLN.PA', 'STLA.PA', 'HO.PA', 'KRNY.PA', 'ACA.PA', 'DSY.PA',
  'SAP.DE', 'SIE.DE', 'ALV.DE', 'DTE.DE', 'IFX.DE', 'ADS.DE', 'BAS.DE', 'BMW.DE', 'BAYN.DE', 'CON.DE',
  'AIR.DE', 'RWE.DE', 'HEI.DE', 'FRE.DE', 'SHL.DE', 'QIA.DE', 'BOSS.DE',
  'SHEL.L', 'AZN.L', 'HSBA.L', 'ULVR.L', 'BP.L', 'GSK.L', 'RIO.L', 'BA.L', 'DGE.L', 'REL.L',
  'AZM.L', 'HLN.L', 'LSEG.L', 'SGE.L', 'PSN.L', 'PRU.L', 'DCC.L', 'SVT.L', 'SMDS.L', 'CPG.L',
  '2222.SR', '1120.SR', '2380.SR', '1180.SR', '1210.SR', '1320.SR', '4005.SR', '4090.SR',
]);

function getSymbolLink(symbol: string): string | null {
  const sym = symbol.toUpperCase().trim();
  if (!sym || sym.length < 2 || sym.length > 10) return null;
  if (FOREX_PATTERN.test(sym)) return '/markets?tab=forex';
  if (CRYPTO_SYMBOLS.has(sym)) return '/markets?tab=crypto';
  if (COMMODITY_SYMBOLS.has(sym)) return '/markets?tab=commodities';
  if (INDEX_SYMBOLS.has(sym)) return '/markets?tab=overview';
  if (KNOWN_STOCK_SYMBOLS.has(sym)) return `/stock-analysis/${sym}`;
  return null;
}

// Generate a pseudo-random sparkline path based on symbol hash
function generateSparkline(symbol: string, direction: string): string {
  // Create deterministic "random" points from symbol name
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = ((hash << 5) - hash) + symbol.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);

  const points: number[] = [];
  const numPoints = 8;
  const baseY = 20;
  const amplitude = 8;

  for (let i = 0; i < numPoints; i++) {
    const pseudoRandom = Math.abs(Math.sin(seed + i * 137.5)) * 2 - 1;
    // Trend: up assets trend upward, down assets trend downward
    const trend = direction === 'up' ? (i / numPoints) * -amplitude : direction === 'down' ? (i / numPoints) * amplitude : 0;
    const noise = pseudoRandom * (amplitude * 0.6);
    points.push(baseY + trend + noise);
  }

  // Build SVG path
  const width = 60;
  const stepX = width / (numPoints - 1);
  let path = `M 0 ${points[0]}`;
  for (let i = 1; i < points.length; i++) {
    const cp1x = (i - 0.5) * stepX;
    const cp1y = points[i - 1];
    const cp2x = (i - 0.5) * stepX;
    const cp2y = points[i];
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${i * stepX} ${points[i]}`;
  }

  return path;
}

export function AffectedAssetsGrid({ assets, locale = 'ar' }: AffectedAssetsGridProps) {
  const t = (ar: string, en: string, fr?: string, tr?: string, es?: string) => locale === 'es' ? (es || en) : locale === 'tr' ? (tr || en) : locale === 'fr' ? (fr || en) : locale === 'en' ? en : ar;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!assets || assets.length === 0) return null;

  const getDirectionStyle = (dir: string) => {
    if (dir === 'up') return {
      bg: 'rgba(34,197,94,0.08)',
      border: 'rgba(34,197,94,0.18)',
      color: 'var(--bull)',
      icon: '▲',
      sparkColor: '#22C55E',
      sparkFill: 'rgba(34,197,94,0.08)',
    };
    if (dir === 'down') return {
      bg: 'rgba(244,63,94,0.08)',
      border: 'rgba(244,63,94,0.18)',
      color: 'var(--bear)',
      icon: '▼',
      sparkColor: '#EF5350',
      sparkFill: 'rgba(244,63,94,0.08)',
    };
    return {
      bg: 'var(--cyan2)',
      border: 'rgba(0,201,167,0.18)',
      color: 'var(--cyan)',
      icon: '→',
      sparkColor: '#00E5FF',
      sparkFill: 'rgba(0,229,255,0.08)',
    };
  };

  // Generate a pseudo change percentage if not provided
  const getChangePercent = (asset: AffectedAsset): number => {
    if (asset.change !== undefined && asset.change !== null) return asset.change;
    // Generate a deterministic pseudo change from the symbol
    let hash = 0;
    for (let i = 0; i < asset.symbol.length; i++) {
      hash = ((hash << 5) - hash) + asset.symbol.charCodeAt(i);
      hash |= 0;
    }
    const absChange = (Math.abs(hash) % 500) / 100; // 0.00 to 5.00
    if (asset.direction === 'down') return -absChange;
    if (asset.direction === 'up') return absChange;
    return 0;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {assets.map((asset, i) => {
        const style = getDirectionStyle(asset.direction);
        const changePct = getChangePercent(asset);
        const isHovered = hoveredIndex === i;
        const sparkPath = generateSparkline(asset.symbol, asset.direction);
        const symbolLink = getSymbolLink(asset.symbol);  // V1180: link target

        return (
          <div
            key={i}
            className="rounded-xl p-3 transition-all duration-300 cursor-default"
            style={{
              background: style.bg,
              border: `1px solid ${isHovered ? style.sparkColor + '44' : style.border}`,
              transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
              boxShadow: isHovered ? `0 4px 16px rgba(0,0,0,0.2), 0 0 12px ${style.sparkFill}` : 'none',
            }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Symbol + Direction */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {symbolLink ? (
                  <Link
                    href={symbolLink}
                    className="font-mono-price text-[14px] font-bold hover:underline transition-all"
                    style={{ color: style.color }}
                    title={`عرض تحليل ${asset.symbol}`}
                  >
                    {asset.symbol}
                  </Link>
                ) : (
                  <span className="font-mono-price text-[14px] font-bold" style={{ color: style.color }}>{asset.symbol}</span>
                )}
                <span className="text-[12px] font-bold" style={{ color: style.color }}>{style.icon}</span>
              </div>
              {/* Mini sparkline */}
              <svg width="48" height="24" viewBox="0 0 60 28" className="flex-shrink-0">
                <path
                  d={sparkPath + ` L 60 28 L 0 28 Z`}
                  fill={style.sparkFill}
                  opacity={isHovered ? 1 : 0.5}
                />
                <path
                  d={sparkPath}
                  fill="none"
                  stroke={style.sparkColor}
                  strokeWidth="1.5"
                  opacity={isHovered ? 1 : 0.7}
                />
              </svg>
            </div>

            {/* Percentage Change */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="font-mono-price text-[12px] font-bold" style={{ color: style.color }}>
                {changePct > 0 ? '+' : ''}{changePct.toFixed(2)}%
              </span>
              {/* Mini bar indicator */}
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(Math.abs(changePct) * 20, 100)}%`,
                    background: style.color,
                    opacity: 0.7,
                  }}
                />
              </div>
            </div>

            {/* Reason */}
            {asset.reason && (
              <p className="text-[11px] leading-[1.6] line-clamp-2" style={{ color: 'var(--text3)' }}>{asset.reason}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

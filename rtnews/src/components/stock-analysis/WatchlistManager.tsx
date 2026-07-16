'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, X, ChevronUp, ChevronDown } from 'lucide-react';
import { getLocalePath } from '@/lib/locale';

interface WatchlistItem {
  symbol: string;
  name: string;
  addedAt: string;
}

interface WatchlistManagerProps {
  locale: string;
}

export default function WatchlistManager({ locale }: WatchlistManagerProps) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [newSymbol, setNewSymbol] = useState('');
  const STORAGE_KEY = 'rouaa_watchlist';

  const labels = {
    watchlist: locale === 'ar' ? 'قائمة المراقبة' : locale === 'tr' ? 'İzleme Listesi' : locale === 'fr' ? 'Liste de Surveillance' : 'Watchlist',
    add: locale === 'ar' ? 'أضف' : locale === 'tr' ? 'Ekle' : locale === 'fr' ? 'Ajouter' : 'Add',
    enterSymbol: locale === 'ar' ? 'أدخل رمز السهم' : locale === 'tr' ? 'Hisse sembolü girin' : locale === 'fr' ? 'Symbole boursier' : 'Enter symbol',
    empty: locale === 'ar' ? 'قائمة المراقبة فارغة' : locale === 'tr' ? 'İzleme listesi boş' : locale === 'fr' ? 'Liste vide' : 'Watchlist is empty',
    addHint: locale === 'ar' ? 'أضف أسهماً لمتابعتها' : locale === 'tr' ? 'Takip için hisse ekleyin' : locale === 'fr' ? 'Ajoutez des actions à surveiller' : 'Add stocks to track',
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setWatchlist(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist)); } catch {}
  }, [watchlist]);

  function addSymbol() {
    const sym = newSymbol.trim().toUpperCase();
    if (!sym || watchlist.some(w => w.symbol === sym)) return;
    setWatchlist(prev => [...prev, { symbol: sym, name: sym, addedAt: new Date().toISOString() }]);
    setNewSymbol('');
  }

  function removeSymbol(symbol: string) {
    setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const newList = [...watchlist];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    setWatchlist(newList);
  }

  function moveDown(index: number) {
    if (index === watchlist.length - 1) return;
    const newList = [...watchlist];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    setWatchlist(newList);
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-semibold text-white">{labels.watchlist}</h3>
      </div>

      {/* Add symbol */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addSymbol()}
          placeholder={labels.enterSymbol}
          className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
        />
        <button
          onClick={addSymbol}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded text-sm font-medium transition-colors"
        >
          {labels.add}
        </button>
      </div>

      {/* Watchlist items */}
      {watchlist.length === 0 ? (
        <div className="text-center py-6">
          <Star className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">{labels.empty}</p>
          <p className="text-gray-500 text-xs">{labels.addHint}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {watchlist.map((item, index) => (
            <div key={item.symbol} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/5 group">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveUp(index)} className="text-gray-500 hover:text-white">
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button onClick={() => moveDown(index)} className="text-gray-500 hover:text-white">
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
              <Link
                href={`${getLocalePath(locale as any)}/stock-analysis/${item.symbol}`}
                className="flex-1 text-sm font-bold text-white hover:text-emerald-400 transition-colors"
              >
                {item.symbol}
              </Link>
              <button
                onClick={() => removeSymbol(item.symbol)}
                className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';

type Locale = 'ar' | 'en' | 'fr' | 'tr' | 'es';

interface QuickLink {
  id: string;
  label: string;
  href: string;
  icon: string;
  group: string;
}

const QUICK_LINKS: Record<Locale, QuickLink[]> = {
  ar: [
    { id: 'home', label: 'الرئيسية', href: '/', icon: '🏠', group: 'الصفحات' },
    { id: 'news', label: 'الأخبار الحية', href: '/news', icon: '📰', group: 'الصفحات' },
    { id: 'markets', label: 'الأسواق', href: '/markets', icon: '📊', group: 'الصفحات' },
    { id: 'analysis', label: 'تحليل AI', href: '/analysis', icon: '🤖', group: 'الصفحات' },
    { id: 'calendar', label: 'التقويم الاقتصادي', href: '/calendar', icon: '📅', group: 'الصفحات' },
    { id: 'central-banks', label: 'البنوك المركزية', href: '/central-banks', icon: '🏦', group: 'الصفحات' },
    { id: 'earnings', label: 'أرباح الشركات', href: '/earnings', icon: '💰', group: 'الصفحات' },
    { id: 'academy', label: 'الأكاديمية', href: '/academy', icon: '🎓', group: 'الصفحات' },
    { id: 'library', label: 'المكتبة', href: '/library', icon: '📚', group: 'الصفحات' },
    { id: 'community', label: 'المجتمع', href: '/community', icon: '👥', group: 'الصفحات' },
    { id: 'pricing', label: 'الأسعار والباقات', href: '/pricing', icon: '💎', group: 'الصفحات' },
  ],
  en: [
    { id: 'home', label: 'Home', href: '/en', icon: '🏠', group: 'Pages' },
    { id: 'news', label: 'Live News', href: '/en/news', icon: '📰', group: 'Pages' },
    { id: 'markets', label: 'Markets', href: '/en/markets', icon: '📊', group: 'Pages' },
    { id: 'analysis', label: 'AI Analysis', href: '/en/analysis', icon: '🤖', group: 'Pages' },
    { id: 'calendar', label: 'Economic Calendar', href: '/en/calendar', icon: '📅', group: 'Pages' },
    { id: 'central-banks', label: 'Central Banks', href: '/en/central-banks', icon: '🏦', group: 'Pages' },
    { id: 'earnings', label: 'Earnings', href: '/en/earnings', icon: '💰', group: 'Pages' },
    { id: 'academy', label: 'Academy', href: '/en/academy', icon: '🎓', group: 'Pages' },
    { id: 'library', label: 'Library', href: '/en/library', icon: '📚', group: 'Pages' },
    { id: 'community', label: 'Community', href: '/en/community', icon: '👥', group: 'Pages' },
    { id: 'pricing', label: 'Pricing', href: '/en/pricing', icon: '💎', group: 'Pages' },
  ],
  fr: [
    { id: 'home', label: 'Accueil', href: '/fr', icon: '🏠', group: 'Pages' },
    { id: 'news', label: 'Actualités en direct', href: '/fr/news', icon: '📰', group: 'Pages' },
    { id: 'markets', label: 'Marchés', href: '/fr/markets', icon: '📊', group: 'Pages' },
    { id: 'analysis', label: 'Analyse IA', href: '/fr/analysis', icon: '🤖', group: 'Pages' },
    { id: 'calendar', label: 'Calendrier économique', href: '/fr/calendar', icon: '📅', group: 'Pages' },
    { id: 'central-banks', label: 'Banques centrales', href: '/fr/central-banks', icon: '🏦', group: 'Pages' },
    { id: 'earnings', label: 'Résultats', href: '/fr/earnings', icon: '💰', group: 'Pages' },
    { id: 'academy', label: 'Académie', href: '/fr/academy', icon: '🎓', group: 'Pages' },
    { id: 'library', label: 'Bibliothèque', href: '/fr/library', icon: '📚', group: 'Pages' },
    { id: 'community', label: 'Communauté', href: '/fr/community', icon: '👥', group: 'Pages' },
    { id: 'pricing', label: 'Tarification', href: '/fr/pricing', icon: '💎', group: 'Pages' },
  ],
  tr: [
    { id: 'home', label: 'Ana Sayfa', href: '/tr', icon: '🏠', group: 'Sayfalar' },
    { id: 'news', label: 'Canlı Haberler', href: '/tr/news', icon: '📰', group: 'Sayfalar' },
    { id: 'markets', label: 'Piyasalar', href: '/tr/markets', icon: '📊', group: 'Sayfalar' },
    { id: 'analysis', label: 'AI Analiz', href: '/tr/analysis', icon: '🤖', group: 'Sayfalar' },
    { id: 'calendar', label: 'Ekonomik Takvim', href: '/tr/calendar', icon: '📅', group: 'Sayfalar' },
    { id: 'central-banks', label: 'Merkez Bankaları', href: '/tr/central-banks', icon: '🏦', group: 'Sayfalar' },
    { id: 'earnings', label: 'Kazançlar', href: '/tr/earnings', icon: '💰', group: 'Sayfalar' },
    { id: 'academy', label: 'Akademi', href: '/tr/academy', icon: '🎓', group: 'Sayfalar' },
    { id: 'library', label: 'Kütüphane', href: '/tr/library', icon: '📚', group: 'Sayfalar' },
    { id: 'community', label: 'Topluluk', href: '/tr/community', icon: '👥', group: 'Sayfalar' },
    { id: 'pricing', label: 'Fiyatlandırma', href: '/tr/pricing', icon: '💎', group: 'Sayfalar' },
  ],
  es: [
    { id: 'home', label: 'Inicio', href: '/es', icon: '🏠', group: 'Páginas' },
    { id: 'news', label: 'Noticias en vivo', href: '/es/news', icon: '📰', group: 'Páginas' },
    { id: 'markets', label: 'Mercados', href: '/es/markets', icon: '📊', group: 'Páginas' },
    { id: 'analysis', label: 'Análisis IA', href: '/es/analysis', icon: '🤖', group: 'Páginas' },
    { id: 'calendar', label: 'Calendario económico', href: '/es/calendar', icon: '📅', group: 'Páginas' },
    { id: 'central-banks', label: 'Bancos centrales', href: '/es/central-banks', icon: '🏦', group: 'Páginas' },
    { id: 'earnings', label: 'Ganancias', href: '/es/earnings', icon: '💰', group: 'Páginas' },
    { id: 'academy', label: 'Academia', href: '/es/academy', icon: '🎓', group: 'Páginas' },
    { id: 'library', label: 'Biblioteca', href: '/es/library', icon: '📚', group: 'Páginas' },
    { id: 'community', label: 'Comunidad', href: '/es/community', icon: '👥', group: 'Páginas' },
    { id: 'pricing', label: 'Precios', href: '/es/pricing', icon: '💎', group: 'Páginas' },
  ],
};

const UI_TEXT: Record<Locale, {
  ariaLabel: string;
  placeholder: string;
  pagesGroup: string;
  newsGroup: string;
  noResults: string;
  noNewsResults: string;
  navigate: string;
  open: string;
  search: string;
  searching: string;
  searchingHint: string;
  seeAll: string;
  justNow: string;
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
}> = {
  ar: {
    ariaLabel: 'البحث السريع',
    placeholder: 'ابحث في رؤى...',
    pagesGroup: 'الصفحات',
    newsGroup: 'الأخبار',
    noResults: 'لا توجد نتائج لـ',
    noNewsResults: 'لا أخبار مطابقة لـ',
    navigate: 'تنقل',
    open: 'فتح',
    search: 'بحث',
    searching: 'جاري البحث...',
    searchingHint: 'اكتب حرفين على الأقل للبحث',
    seeAll: 'عرض كل النتائج',
    justNow: 'الآن',
    minutesAgo: 'دقيقة',
    hoursAgo: 'ساعة',
    daysAgo: 'يوم',
  },
  en: {
    ariaLabel: 'Quick Search',
    placeholder: 'Search Rouaa...',
    pagesGroup: 'Pages',
    newsGroup: 'News',
    noResults: 'No results for',
    noNewsResults: 'No matching news for',
    navigate: 'Navigate',
    open: 'Open',
    search: 'Search',
    searching: 'Searching...',
    searchingHint: 'Type at least 2 characters to search',
    seeAll: 'See all results',
    justNow: 'Just now',
    minutesAgo: 'min ago',
    hoursAgo: 'hr ago',
    daysAgo: 'days ago',
  },
  fr: {
    ariaLabel: 'Recherche rapide',
    placeholder: 'Rechercher dans Rouaa...',
    pagesGroup: 'Pages',
    newsGroup: 'Actualités',
    noResults: 'Aucun résultat pour',
    noNewsResults: 'Aucune actualité pour',
    navigate: 'Naviguer',
    open: 'Ouvrir',
    search: 'Recherche',
    searching: 'Recherche...',
    searchingHint: 'Tapez au moins 2 caractères pour rechercher',
    seeAll: 'Voir tous les résultats',
    justNow: 'À l\'instant',
    minutesAgo: 'min',
    hoursAgo: 'h',
    daysAgo: 'jours',
  },
  tr: {
    ariaLabel: 'Hızlı Arama',
    placeholder: "Rouaa'da ara...",
    pagesGroup: 'Sayfalar',
    newsGroup: 'Haberler',
    noResults: 'Sonuç bulunamadı:',
    noNewsResults: 'Haber bulunamadı:',
    navigate: 'Gezinme',
    open: 'Aç',
    search: 'Ara',
    searching: 'Aranıyor...',
    searchingHint: 'Aramak için en az 2 karakter yazın',
    seeAll: 'Tüm sonuçları gör',
    justNow: 'Şimdi',
    minutesAgo: 'dk önce',
    hoursAgo: 'sa önce',
    daysAgo: 'gün önce',
  },
  es: {
    ariaLabel: 'Búsqueda rápida',
    placeholder: 'Buscar en Rouaa...',
    pagesGroup: 'Páginas',
    newsGroup: 'Noticias',
    noResults: 'Sin resultados para',
    noNewsResults: 'Sin noticias para',
    navigate: 'Navegar',
    open: 'Abrir',
    search: 'Buscar',
    searching: 'Buscando...',
    searchingHint: 'Escribe al menos 2 caracteres para buscar',
    seeAll: 'Ver todos los resultados',
    justNow: 'Ahora',
    minutesAgo: 'min',
    hoursAgo: 'h',
    daysAgo: 'días',
  },
};

function detectLocale(pathname: string): Locale {
  if (pathname.startsWith('/en')) return 'en';
  if (pathname.startsWith('/fr')) return 'fr';
  if (pathname.startsWith('/tr')) return 'tr';
  if (pathname.startsWith('/es')) return 'es';
  return 'ar';
}

// ─── FIX #1: Interface now matches API response ──────────────
// API returns 'score' (not 'similarity'), and includes titleAr/summaryAr
interface SemanticResult {
  id: string;
  title: string;
  titleAr?: string;
  summary: string;
  summaryAr?: string;
  category: string;
  slug?: string;
  sentiment?: string;
  impactLevel?: string;
  score: number;        // FIX: was 'similarity' — API returns 'score'
  imageUrl?: string;
  publishedAt?: string;
}

// ─── Relative time formatter ─────────────────────────────────
function formatRelativeTime(dateStr: string | undefined, ui: typeof UI_TEXT[Locale]): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return ui.justNow;
    if (diffMin < 60) return `${diffMin} ${ui.minutesAgo}`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} ${ui.hoursAgo}`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} ${ui.daysAgo}`;
  } catch {
    return null;
  }
}

// ─── Get locale-aware display title ──────────────────────────
function getDisplayTitle(result: SemanticResult, locale: Locale): string {
  // For Arabic locale, prefer titleAr; fallback to title
  if (locale === 'ar' && result.titleAr) return result.titleAr;
  // For other locales, use the English title
  return result.title;
}

// ─── Get locale-aware display summary ────────────────────────
function getDisplaySummary(result: SemanticResult, locale: Locale): string {
  if (locale === 'ar' && result.summaryAr) return result.summaryAr;
  return result.summary;
}

// ─── Global open/close state ──────────────────────────────────
type SearchCommandCallback = () => void;
let toggleCallback: SearchCommandCallback | null = null;

export function registerSearchToggle(cb: SearchCommandCallback) {
  toggleCallback = cb;
  return () => { toggleCallback = null; };
}

export function toggleSearchCommand() {
  if (toggleCallback) {
    toggleCallback();
  }
}

export default function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<SemanticResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); // Track if search was performed
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const locale = detectLocale(pathname);
  const quickLinks = QUICK_LINKS[locale];
  const ui = UI_TEXT[locale];
  const isRtl = locale === 'ar';

  // Detect Mac for ⌘K display
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes('MAC') || navigator.userAgent.includes('Mac'));
  }, []);

  // Filter quick links based on query
  const filteredLinks = useMemo(() => {
    if (query.length === 0) return quickLinks;
    return quickLinks.filter((link) =>
      link.label.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, quickLinks]);

  // ─── Semantic search via API with debounce ────────────────
  const searchNews = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    try {
      // No locale filter — search ALL articles, display correct language client-side
      const res = await fetch(`/api/search/semantic?q=${encodeURIComponent(searchQuery)}&limit=8`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [locale]);

  // Debounced search trigger
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setSelectedIndex(0);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (newQuery.length >= 2) {
      debounceRef.current = setTimeout(() => {
        searchNews(newQuery);
      }, 300);
    } else {
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [searchNews]);

  // Build flat list of selectable items for keyboard navigation
  const allResults: { type: 'link' | 'news'; href: string; id: string }[] = useMemo(() => [
    ...filteredLinks.map((link) => ({ type: 'link' as const, href: link.href, id: link.id })),
    ...searchResults.map((news) => {
      const pathSegment = news.slug || news.id;
      const validId = pathSegment && typeof pathSegment === 'string' && pathSegment !== 'undefined' ? pathSegment : null;
      const newsPrefix = locale === 'ar' ? '/news' : `/${locale}/news`;
      return { type: 'news' as const, href: validId ? `${newsPrefix}/${validId}` : '', id: news.id };
    }).filter(item => item.href !== ''),
  ], [filteredLinks, searchResults, locale]);

  // FIX #7: Clamp selectedIndex when results change
  useEffect(() => {
    if (allResults.length > 0 && selectedIndex >= allResults.length) {
      setSelectedIndex(Math.max(0, allResults.length - 1));
    }
  }, [allResults.length, selectedIndex]);

  const handleSelect = useCallback((href: string) => {
    router.push(href);
    setOpen(false);
    setQuery('');
    setSearchResults([]);
    setHasSearched(false);
  }, [router]);

  const closeDialog = useCallback(() => {
    setOpen(false);
    setQuery('');
    setSelectedIndex(0);
    setSearchResults([]);
    setHasSearched(false);
  }, []);

  // ─── Register global toggle + keyboard shortcut ───────────
  useEffect(() => {
    const unregister = registerSearchToggle(() => {
      setOpen((prev) => !prev);
    });

    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      unregister();
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // ─── Prevent body scroll when dialog is open ──────────────
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Handle keyboard navigation when dialog is open
  const handleDialogKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeDialog();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const next = Math.min(prev + 1, allResults.length - 1);
        setTimeout(() => selectedRef.current?.scrollIntoView({ block: 'nearest' }), 0);
        return next;
      });
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const next = Math.max(prev - 1, 0);
        setTimeout(() => selectedRef.current?.scrollIntoView({ block: 'nearest' }), 0);
        return next;
      });
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const selected = allResults[selectedIndex];
      if (selected) {
        handleSelect(selected.href);
      }
      return;
    }
  }, [allResults, selectedIndex, handleSelect, closeDialog]);

  // Close on route change
  useEffect(() => {
    closeDialog();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (!open) return null;

  // Compute the "See all results" search page link
  const searchPageHref = locale === 'ar' ? `/search?q=${encodeURIComponent(query)}` : `/${locale}/search?q=${encodeURIComponent(query)}`;

  // Compute result indices
  const newsStartIndex = filteredLinks.length;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]"
      onClick={closeDialog}
      aria-hidden="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ui.ariaLabel}
        className="relative w-full max-w-[560px] mx-4 rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg3)',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          animation: 'slideInTop 0.15s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleDialogKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={ui.placeholder}
            className="flex-1 bg-transparent outline-none text-[14px]"
            style={{ color: 'var(--text)' }}
            autoFocus
            dir={isRtl ? 'rtl' : 'ltr'}
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg5)', color: 'var(--text3)', border: '1px solid var(--border)' }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={scrollContainerRef} className="max-h-[420px] overflow-y-auto custom-scrollbar p-2">
          {/* Quick Links — show when no query or matches found */}
          {filteredLinks.length > 0 && (
            <div className="mb-2">
              <span className="text-[10px] font-bold px-3 py-1 block" style={{ color: 'var(--text3)' }}>
                {ui.pagesGroup}
              </span>
              {filteredLinks.map((link, i) => {
                const isSelected = i === selectedIndex;
                return (
                  <button
                    key={link.id}
                    ref={isSelected ? selectedRef : null}
                    onClick={() => handleSelect(link.href)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-colors ${isRtl ? 'text-right' : 'text-left'} ${isSelected ? 'bg-[var(--cyan3)]' : 'hover:bg-[var(--cyan3)]'}`}
                    style={{ color: isSelected ? 'var(--cyan)' : 'var(--text2)' }}
                  >
                    <span className="text-[16px]">{link.icon}</span>
                    <span className="flex-1">{link.label}</span>
                    {isSelected && (
                      <kbd className="px-1.5 py-0.5 rounded text-[9px]" style={{ background: 'var(--bg5)', border: '1px solid var(--border)', color: 'var(--text3)' }}>↵</kbd>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Semantic Search Results */}
          {query.length >= 2 && (
            <>
              {/* Loading indicator */}
              {isSearching && (
                <div className="px-3 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" style={{ color: 'var(--text3)' }} viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-xs" style={{ color: 'var(--text3)' }}>{ui.searching}</span>
                  </div>
                </div>
              )}

              {/* Search results — FIX #1 & #2: Use score (not similarity) and locale-aware titles */}
              {!isSearching && searchResults.length > 0 && (
                <div className="mb-2">
                  <span className="text-[10px] font-bold px-3 py-1 block" style={{ color: 'var(--text3)' }}>{ui.newsGroup}</span>
                  {searchResults.map((news, i) => {
                    const pathSegment = news.slug || news.id;
                    const validId = pathSegment && typeof pathSegment === 'string' && pathSegment !== 'undefined' ? pathSegment : null;
                    if (!validId) return null;
                    const newsPrefix = locale === 'ar' ? '/news' : `/${locale}/news`;
                    const globalIdx = newsStartIndex + i;
                    const isSelected = globalIdx === selectedIndex;
                    const sentimentColor = news.sentiment === 'positive' ? 'var(--bull)' : news.sentiment === 'negative' ? 'var(--bear)' : 'var(--neutral)';
                    // FIX #2: Use locale-aware title and summary
                    const displayTitle = getDisplayTitle(news, locale);
                    const displaySummary = getDisplaySummary(news, locale);
                    const relativeTime = formatRelativeTime(news.publishedAt, ui);
                    // FIX #1: Use 'score' (API field) instead of 'similarity'
                    const matchScore = Math.round((news.score ?? 0) * 100);
                    return (
                      <button
                        key={news.id}
                        ref={isSelected ? selectedRef : null}
                        onClick={() => handleSelect(`${newsPrefix}/${validId}`)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-colors ${isRtl ? 'text-right' : 'text-left'} ${isSelected ? 'bg-[var(--cyan3)]' : 'hover:bg-[var(--cyan3)]'}`}
                        style={{ color: isSelected ? 'var(--cyan)' : 'var(--text2)' }}
                      >
                        {/* Sentiment dot */}
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2" style={{ background: sentimentColor }} />
                        {/* Content column */}
                        <span className="flex-1 min-w-0">
                          <span className="block truncate font-medium">{displayTitle}</span>
                          {/* FIX #4: Show summary preview */}
                          {displaySummary && (
                            <span className="block text-[11px] mt-0.5 truncate" style={{ color: 'var(--text4)' }}>
                              {displaySummary.slice(0, 100)}{displaySummary.length > 100 ? '...' : ''}
                            </span>
                          )}
                          {/* Category + time row */}
                          <span className="flex items-center gap-2 mt-0.5">
                            {news.category && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg5)', color: 'var(--text4)', border: '1px solid var(--border)' }}>
                                {news.category}
                              </span>
                            )}
                            {relativeTime && (
                              <span className="text-[9px]" style={{ color: 'var(--text4)' }}>{relativeTime}</span>
                            )}
                          </span>
                        </span>
                        {/* Match score */}
                        <span className="text-[10px] flex-shrink-0 mt-1" style={{ color: matchScore > 50 ? 'var(--cyan)' : 'var(--text4)' }}>
                          {matchScore}%
                        </span>
                        {isSelected && (
                          <kbd className="px-1.5 py-0.5 rounded text-[9px] flex-shrink-0 mt-1" style={{ background: 'var(--bg5)', border: '1px solid var(--border)', color: 'var(--text3)' }}>↵</kbd>
                        )}
                      </button>
                    );
                  })}

                  {/* See all results link */}
                  <button
                    onClick={() => handleSelect(searchPageHref)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[12px] transition-colors hover:bg-[var(--cyan3)]"
                    style={{ color: 'var(--cyan)' }}
                  >
                    {ui.seeAll}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {isRtl ? <path d="M19 12H5M12 19l-7-7 7-7" /> : <path d="M5 12h14M12 5l7 7-7 7" />}
                    </svg>
                  </button>
                </div>
              )}

              {/* FIX #6: "No news results" — shown even when page links exist */}
              {!isSearching && hasSearched && searchResults.length === 0 && (
                <div className="text-center py-6">
                  <svg className="mx-auto mb-2" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text4)" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                  <span className="text-[13px] block" style={{ color: 'var(--text3)' }}>
                    {filteredLinks.length > 0 ? ui.noNewsResults : ui.noResults} &quot;{query}&quot;
                  </span>
                  <button
                    onClick={() => handleSelect(searchPageHref)}
                    className="mt-3 text-[12px] px-4 py-1.5 rounded-lg transition-colors hover:bg-[var(--cyan3)]"
                    style={{ color: 'var(--cyan)' }}
                  >
                    {ui.seeAll}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Hint when query < 2 */}
          {query.length > 0 && query.length < 2 && (
            <div className="text-center py-6">
              <span className="text-[12px]" style={{ color: 'var(--text4)' }}>{ui.searchingHint}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2" style={{ borderTop: '1px solid var(--border)' }}>
          <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text3)' }}>
            <kbd className="px-1 py-0.5 rounded text-[9px]" style={{ background: 'var(--bg5)', border: '1px solid var(--border)' }}>↑↓</kbd>
            {ui.navigate}
          </span>
          <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text3)' }}>
            <kbd className="px-1 py-0.5 rounded text-[9px]" style={{ background: 'var(--bg5)', border: '1px solid var(--border)' }}>↵</kbd>
            {ui.open}
          </span>
          <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text3)' }}>
            <kbd className="px-1 py-0.5 rounded text-[9px]" style={{ background: 'var(--bg5)', border: '1px solid var(--border)' }}>{isMac ? '⌘' : 'Ctrl+'}K</kbd>
            {ui.search}
          </span>
        </div>
      </div>

      {/* Animation keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideInTop {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </div>
  );
}

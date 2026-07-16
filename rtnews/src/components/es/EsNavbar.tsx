'use client';

// ─── Spanish Navbar V250 ────────────────────────────────────────
// Full LTR navigation bar matching English version quality.
// Features: Glassmorphism nav items, dropdown menus, market sessions,
// language switcher, search, theme toggle, user menu, mobile drawer.
// All labels in Spanish, all routes use /es/ prefix.

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { toggleSearchCommand } from '@/components/rouaa/SearchCommand';

// ─── Types ───
type SubItem = { label: string; href: string; badge?: string; badgeColor?: string };
type NavItem = {
  label: string;
  href: string;
  badge?: string;
  badgeColor?: string;
  isGold?: boolean;
  sub?: SubItem[];
};

// ─── Navigation Items with Dropdowns — SPANISH ───
const navItems: NavItem[] = [
  { label: 'Inicio', href: '/es' },
  {
    label: 'Noticias',
    href: '/es/news',
    sub: [
      { label: 'Últimas Noticias', href: '/es/news' },
      { label: 'Calendario Económico', href: '/es/calendar' },
    ],
  },
  {
    label: "Asesor Ru'aa",
    href: '/es/advisor',
    badge: 'AI',
    badgeColor: '#d4af37',
    isGold: true,
  },
  {
    label: 'Análisis de Acciones',
    href: '/es/stock-analysis',
    sub: [
      { label: 'Análisis Principal', href: '/es/stock-analysis' },
      { label: 'Escáner de Acciones', href: '/es/stock-analysis/screener' },
      { label: 'Análisis de Sectores', href: '/es/stock-analysis/sectors' },
    ],
  },
  {
    label: 'Señales',
    href: '/es/signals',
  },
  {
    label: 'Mercados',
    href: '/es/markets',
    sub: [
      { label: 'Resumen de Mercados', href: '/es/markets' },
      { label: 'Pulso del Mercado', href: '/es/market-pulse', badge: 'Live', badgeColor: '#22C55E' },
    ],
  },
  {
    label: 'Informes',
    href: '/es/reports',
    sub: [
      { label: 'Centro de informes', href: '/es/reports' },
      { label: 'Análisis Técnicos Avanzados', href: '/es/technical-analyses', badge: 'Nuevo', badgeColor: '#8B5CF6' },
      { label: 'Archivo de informes', href: '/es/reports/search' },
      { label: 'Informes Estratégicos', href: '/es/strategic-reports' },
    ],
  },
  { label: 'Informes Estratégicos', href: '/es/strategic-reports' },
  {
    label: 'Riesgos Geopolíticos',
    href: '/es/geopolitical-risks',
    sub: [
      { label: 'Panel de control', href: '/es/geopolitical-risks' },
      { label: 'Mapa interactivo', href: '/es/geopolitical-risks/map' },
      { label: 'Escenarios', href: '/es/geopolitical-risks/scenarios' },
      { label: 'Rutas comerciales', href: '/es/geopolitical-risks/trade-routes' },
      { label: 'Mapa de calor', href: '/es/geopolitical-risks/heatmap' },
      { label: 'Informes', href: '/es/geopolitical-risks/reports' },
    ],
  },
  { label: 'Infografías', href: '/es/infographics' },
  { label: 'Videos', href: '/es/videos', badge: 'Nuevo', badgeColor: '#EF4444' },
  {
    label: 'Portafolio',
    href: '/es/portfolio',
    sub: [
      { label: 'Mi Portafolio', href: '/es/portfolio' },
      { label: 'Favoritos', href: '/es/bookmarks' },
    ],
  },
  {
    label: 'Academia',
    href: '/es/academy',
    sub: [
      { label: 'Academia', href: '/es/academy' },
      { label: 'Biblioteca', href: '/es/library' },
    ],
  },
];

// ─── More Links — SPANISH ───
const moreLinks = [
  {
    label: 'Análisis IA',
    href: '/es/analysis',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    badge: 'AI' as string | undefined,
    badgeColor: '#8B5CF6',
  },
  {
    label: 'Ganancias',
    href: '/es/earnings',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: 'Boletín',
    href: '/es/reports#newsletter',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    badge: undefined,
    badgeColor: '',
  },
  {
    label: 'Informes Estratégicos',
    href: '/es/strategic-reports',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: 'Pulso del Mercado',
    href: '/es/market-pulse',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    badge: 'Live',
    badgeColor: '#22C55E',
  },
  {
    label: 'Comunidad',
    href: '/es/community',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Telegram',
    href: '/es/telegram',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="#229ED9">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    badge: 'Bot',
    badgeColor: '#229ED9',
  },
  {
    label: 'Documentación API',
    href: '/es/docs/api',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
    badge: 'API',
    badgeColor: '#8B5CF6',
  },
  {
    label: 'Cumplimiento',
    href: '/es/compliance',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    label: 'Acerca de',
    href: '/es/about',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
];

const marketSessions = [
  { code: 'TKY', tz: 'Asia/Tokyo', openH: 9, closeH: 15 },
  { code: 'DXB', tz: 'Asia/Dubai', openH: 10, closeH: 14 },
  { code: 'LDN', tz: 'Europe/London', openH: 8, closeH: 17 },
  { code: 'NY', tz: 'America/New_York', openH: 9, closeH: 16 },
];

function isMarketOpen(tz: string, openH: number, closeH: number): boolean {
  try {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
    const [h] = fmt.format(now).split(':').map(Number);
    return h >= openH && h < closeH;
  } catch { return false; }
}

// ─── Mobile Nav Item — LTR ───
function MobileNavItem({ item, activeLink, onClose }: { item: NavItem; activeLink: string; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const isActive = activeLink === item.href || (item.href !== '/es' && activeLink.startsWith(item.href)) ||
    (item.sub ? item.sub.some(sub => { const p = sub.href.split('#')[0]; return p !== '/es' && activeLink.startsWith(p); }) : false);
  const hasDropdown = !!(item.sub && item.sub.length > 0);
  const isGold = !!item.isGold;

  return (
    <div>
      <div className="flex items-center">
        <Link href={item.href}
          className={`flex-1 flex items-center gap-2 text-[13px] font-semibold py-2.5 px-3 rounded-lg transition-all duration-200 ${
            isActive ? (isGold ? 'text-[#d4af37]' : 'text-[var(--cyan)]') : 'text-[var(--text2)]'
          } ${isActive ? (isGold ? 'bg-[rgba(212,175,55,0.08)]' : 'bg-[var(--cyan2)]') : 'hover:bg-[var(--cyan3)]'}`}
          onClick={onClose}>
          <span>{item.label}</span>
          {item.badge && (
            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${
              isGold ? 'nav-badge-gold' : item.badge === 'AI' ? 'nav-badge-ai' : item.badge === 'Live' ? 'nav-badge-live' : item.badge === 'Nuevo' ? 'nav-badge-new' : ''
            }`}>
              {item.badge}
            </span>
          )}
        </Link>
        {hasDropdown && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg hover:bg-[var(--cyan3)] transition-colors"
            style={{ color: 'var(--text3)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
              <polyline points="6,9 12,15 18,9" />
            </svg>
          </button>
        )}
      </div>
      {hasDropdown && expanded && (
        <div className="ml-4 mt-0.5 mb-1 flex flex-col gap-0.5" style={{ borderLeft: '2px solid var(--border2)' }}>
          {item.sub!.map((sub) => {
            const subPath = sub.href.split('#')[0];
            const isSubActive = subPath === '/es' ? activeLink === '/es' : activeLink.startsWith(subPath);
            return (
              <Link key={sub.href} href={sub.href}
                className={`text-[12px] font-medium py-2 px-3 rounded-md transition-all duration-200 ${
                  isSubActive ? 'text-[var(--cyan)] bg-[var(--cyan2)]' : 'text-[var(--text3)] hover:text-[var(--text2)] hover:bg-[var(--cyan3)]'
                }`}
                onClick={onClose}>
                {sub.label}
                {sub.badge && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold ml-2"
                    style={{ background: `${sub.badgeColor}18`, color: sub.badgeColor, border: `1px solid ${sub.badgeColor}30` }}>
                    {sub.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function EsNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [marketDropdownOpen, setMarketDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const marketDropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const dropdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const activeLink = pathname;
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated' && !!session?.user;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) setUserDropdownOpen(false);
      if (marketDropdownRef.current && !marketDropdownRef.current.contains(e.target as Node)) setMarketDropdownOpen(false);
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) setLangDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setOpenDropdown(null);
    setMoreOpen(false);
    setMobileOpen(false);
    setUserDropdownOpen(false);
    setMarketDropdownOpen(false);
    setLangDropdownOpen(false);
  }, [pathname]);

  const handleDropdownEnter = useCallback((label: string) => {
    if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current);
    setOpenDropdown(label);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    dropdownTimerRef.current = setTimeout(() => { setOpenDropdown(null); }, 200);
  }, []);

  const isItemActive = (item: NavItem) => {
    if (item.href === '/es') return activeLink === '/es';
    if (activeLink.startsWith(item.href)) return true;
    if (item.sub) {
      return item.sub.some(sub => {
        const subPath = sub.href.split('#')[0];
        return subPath !== '/es' && activeLink.startsWith(subPath);
      });
    }
    return false;
  };

  return (
    <>
      {/* ═══ Main Navbar ═══ */}
      <nav className="fixed left-0 right-0 z-[1001] h-[52px] flex items-center"
        dir="ltr"
        role="navigation" aria-label="Navegación principal"
        style={{
          top: 'var(--nav-top, 68px)',
          direction: 'ltr',
          textAlign: 'left',
          background: 'color-mix(in srgb, var(--bg) 80%, transparent)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          borderBottom: '1px solid var(--border)',
          padding: '0 clamp(12px, 2.5vw, 28px)',
        }}>
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px]" style={{ background: 'linear-gradient(90deg, transparent, var(--gold), var(--cyan), var(--purple), transparent)' }} />

        <div className="w-full flex items-center gap-2" dir="ltr">
          {/* Logo — LTR: left side */}
          <a href="/es" className="flex items-center gap-1.5 flex-shrink-0 group">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none" className="flex-shrink-0">
              <rect width="28" height="28" rx="6" fill="rgba(0,229,255,0.1)" />
              <polyline points="4,20 10,12 16,16 24,6" stroke="url(#es-nav-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="24" cy="6" r="2.5" fill="var(--cyan)" />
              <defs>
                <linearGradient id="es-nav-grad" x1="4" y1="20" x2="24" y2="6">
                  <stop offset="0%" stopColor="#00E5FF" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-[16px] sm:text-[20px] font-bold gradient-text font-heading group-hover:scale-105 transition-transform">Ru&#x27;aa</span>
            <span className="live-dot" />
          </a>

          {/* Nav Links — Desktop with Glassmorphism — LTR: flows left to right */}
          <div className="hidden lg:flex items-center ml-2" dir="ltr">
            {navItems.map((item) => {
              const isActive = isItemActive(item);
              const hasDropdown = item.sub && item.sub.length > 0;
              const isDropdownOpen = openDropdown === item.label;
              const isGold = !!item.isGold;
              const isAI = item.badge === 'AI' && !isGold;

              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => hasDropdown && handleDropdownEnter(item.label)}
                  onMouseLeave={() => hasDropdown && handleDropdownLeave()}
                >
                  <Link href={item.href}
                    className={`nav-glass ${isActive ? 'nav-glass-active' : ''} ${isGold ? 'nav-glass-gold' : ''} ${isAI ? 'nav-glass-ai' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => !hasDropdown && setOpenDropdown(null)}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`nav-badge ${isGold ? 'nav-badge-gold' : isAI ? 'nav-badge-ai' : item.badge === 'Live' ? 'nav-badge-live' : item.badge === 'Nuevo' ? 'nav-badge-new' : ''}`}>
                        {item.badge}
                      </span>
                    )}
                    {hasDropdown && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                        <polyline points="6,9 12,15 18,9" />
                      </svg>
                    )}
                  </Link>

                  {/* Dropdown Menu — LTR: opens from left (start-0) */}
                  {hasDropdown && isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1.5 w-[200px] rounded-xl overflow-hidden slide-in-top z-[1100] nav-dropdown-panel" dir="ltr">
                      <div className="py-1.5">
                        {item.sub!.map((sub) => {
                          const subPath = sub.href.split('#')[0];
                          const isSubActive = subPath === '/es' ? activeLink === '/es' : activeLink.startsWith(subPath);
                          return (
                            <Link key={sub.href} href={sub.href}
                              className="flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-semibold transition-all duration-200 nav-dropdown-item"
                              style={{
                                color: isSubActive ? 'var(--cyan)' : 'var(--text2)',
                                background: isSubActive ? 'var(--cyan2)' : 'transparent',
                              }}
                            >
                              <span className="flex-1">{sub.label}</span>
                              {sub.badge && (
                                <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                                  style={{
                                    background: `${sub.badgeColor}18`,
                                    color: sub.badgeColor,
                                    border: `1px solid ${sub.badgeColor}30`,
                                  }}>
                                  {sub.badge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* More Dropdown */}
            <div ref={moreRef} className="relative">
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className="nav-glass"
                aria-label="Más enlaces"
                aria-expanded={moreOpen}
                aria-haspopup="true"
              >
                <span>Más</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className={`transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`}>
                  <polyline points="6,9 12,15 18,9" />
                </svg>
              </button>

              {moreOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-[220px] rounded-xl overflow-hidden slide-in-top z-[1100] nav-dropdown-panel" dir="ltr">
                  <div className="py-1.5">
                    {moreLinks.map((link) => (
                      <Link key={link.href} href={link.href}
                        onClick={() => setMoreOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-semibold transition-all duration-200 nav-dropdown-item"
                        style={{ color: 'var(--text2)' }}
                      >
                        <span style={{ color: 'var(--cyan)', opacity: 0.8 }}>{link.icon}</span>
                        <span className="flex-1">{link.label}</span>
                        {link.badge && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{
                              background: `${link.badgeColor}18`,
                              color: link.badgeColor,
                              border: `1px solid ${link.badgeColor}30`,
                            }}>
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Market Sessions Dropdown — Desktop */}
          <div ref={marketDropdownRef} className="relative hidden lg:flex">
            <button
              onClick={() => setMarketDropdownOpen(!marketDropdownOpen)}
              className="nav-glass-icon"
              aria-label="Sesiones de mercado"
              aria-expanded={marketDropdownOpen}
              aria-haspopup="true"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {mounted && (() => {
                const openCount = marketSessions.filter(s => isMarketOpen(s.tz, s.openH, s.closeH)).length;
                return (
                  <span className="w-[5px] h-[5px] rounded-full flex-shrink-0 -mr-1"
                    style={{
                      background: openCount > 0 ? 'var(--bull)' : 'var(--text3)',
                      boxShadow: openCount > 0 ? '0 0 5px rgba(0,200,150,0.4)' : 'none',
                    }} />
                );
              })()}
            </button>
            {marketDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-[200px] rounded-xl overflow-hidden slide-in-top z-[1100] nav-dropdown-panel" dir="ltr">
                <div className="py-1.5">
                  <div className="px-3.5 py-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>Sesiones de Mercado</span>
                  </div>
                  {marketSessions.map((s) => {
                    const open = mounted ? isMarketOpen(s.tz, s.openH, s.closeH) : false;
                    const nameMap: Record<string, string> = { TKY: 'Tokio', DXB: 'Dubái', LDN: 'Londres', NY: 'Nueva York' };
                    return (
                      <div key={s.code} className="flex items-center justify-between px-3.5 py-2 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                            style={{ background: open ? 'var(--bull)' : 'var(--text3)', boxShadow: open ? '0 0 5px rgba(0,200,150,0.4)' : 'none' }} />
                          <span className="font-mono-price font-semibold" style={{ color: open ? 'var(--bull)' : 'var(--text3)' }}>{s.code}</span>
                          <span style={{ color: 'var(--text2)' }}>{nameMap[s.code] || s.code}</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{
                            color: open ? 'var(--bull)' : 'var(--text3)',
                            background: open ? 'var(--bull2)' : 'transparent',
                            border: open ? '1px solid rgba(0,200,150,0.15)' : '1px solid var(--border)',
                          }}>
                          {open ? 'Abierto' : 'Cerrado'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right Side Controls — LTR: right side */}
          <div className="flex items-center gap-1" dir="ltr">
            {/* Search — Command Palette */}
            <button
              className="flex nav-glass-icon"
              aria-label="Buscar (Ctrl+K)"
              onClick={toggleSearchCommand}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
            </button>

            {/* Bloomberg Terminal is ALWAYS dark — no theme toggle */}

            {/* Auth Buttons — Desktop */}
            {isLoggedIn ? (
              <div ref={userDropdownRef} className="relative hidden sm:block">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 nav-glass"
                  aria-label="Menú de usuario"
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                >
                  {session?.user?.image ? (
                    <img src={session.user.image} alt="Avatar" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                      style={{ background: 'linear-gradient(135deg, var(--cyan), var(--purple))', color: '#fff' }}>
                      {(session?.user?.name || session?.user?.email || 'U')[0]}
                    </div>
                  )}
                  <span className="text-[10px] font-semibold max-w-[40px] sm:max-w-[60px] truncate" style={{ color: 'var(--text2)' }}>
                    {session?.user?.name?.split(' ')[0] || session?.user?.email?.split('@')[0] || 'Usuario'}
                  </span>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className={`transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`}>
                    <polyline points="6,9 12,15 18,9" />
                  </svg>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-[180px] rounded-xl overflow-hidden slide-in-top z-[1100] nav-dropdown-panel" dir="ltr">
                    <div className="py-1.5">
                      <div className="px-3.5 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                        <p className="text-[11px] font-bold truncate" style={{ color: 'var(--text)' }}>{session?.user?.name || 'Usuario'}</p>
                        <p className="text-[9px] truncate" style={{ color: 'var(--text3)' }}>{session?.user?.email}</p>
                      </div>
                      <Link href="/es/portfolio" className="flex items-center gap-2.5 px-3.5 py-2 text-[11px] font-semibold nav-dropdown-item"
                        style={{ color: 'var(--text2)' }} onClick={() => setUserDropdownOpen(false)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        Mi Perfil
                      </Link>
                      <Link href="/es/bookmarks" className="flex items-center gap-2.5 px-3.5 py-2 text-[11px] font-semibold nav-dropdown-item"
                        style={{ color: 'var(--text2)' }} onClick={() => setUserDropdownOpen(false)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                        Favoritos
                      </Link>
                      <Link href="/es/advisor" className="flex items-center gap-2.5 px-3.5 py-2 text-[11px] font-semibold nav-dropdown-item"
                        style={{ color: 'var(--text2)' }} onClick={() => setUserDropdownOpen(false)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        Asesor Ru&apos;aa
                      </Link>
                      <div className="border-t" style={{ borderColor: 'var(--border)' }}>
                        <button
                          onClick={() => { setUserDropdownOpen(false); signOut({ callbackUrl: '/' }); }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[11px] font-semibold nav-dropdown-item"
                          style={{ color: 'var(--bear)' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <a href="/es/auth" className="flex items-center gap-1 text-[9px] font-semibold px-2 py-1 rounded transition-all duration-200 nav-glass"
                style={{ color: 'var(--text2)', borderColor: 'var(--border)' }}>
                Iniciar Sesión
              </a>
            )}

            {/* Language Dropdown — Always visible regardless of login state */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1 text-[9px] font-semibold px-2 py-1 rounded transition-all duration-200 nav-glass"
                style={{ color: 'var(--cyan)' }}
                aria-label="Cambiar idioma"
                aria-expanded={langDropdownOpen}
                aria-haspopup="true">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span className="hidden sm:inline">ES</span>
              </button>
              {langDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-fit min-w-[100px] rounded-lg overflow-hidden z-[1100] nav-dropdown-panel" dir="ltr">
                  <a href="/" onClick={() => setLangDropdownOpen(false)}
                    className="w-full text-left px-3 py-2 text-[11px] transition-colors flex items-center gap-2 nav-dropdown-item"
                    style={{ color: (!activeLink.startsWith('/en') && !activeLink.startsWith('/fr') && !activeLink.startsWith('/tr') && !activeLink.startsWith('/es')) ? 'var(--cyan)' : 'var(--text2)', background: (!activeLink.startsWith('/en') && !activeLink.startsWith('/fr') && !activeLink.startsWith('/tr') && !activeLink.startsWith('/es')) ? 'var(--cyan2)' : 'transparent' }}>
                    عربي
                  </a>
                  <a href="/en" onClick={() => setLangDropdownOpen(false)}
                    className="w-full text-left px-3 py-2 text-[11px] transition-colors flex items-center gap-2 nav-dropdown-item"
                    style={{ color: activeLink.startsWith('/en') ? 'var(--cyan)' : 'var(--text2)', background: activeLink.startsWith('/en') ? 'var(--cyan2)' : 'transparent' }}>
                    English
                  </a>
                  <a href="/es" onClick={() => setLangDropdownOpen(false)}
                    className="w-full text-left px-3 py-2 text-[11px] transition-colors flex items-center gap-2 nav-dropdown-item"
                    style={{ color: activeLink.startsWith('/es') ? 'var(--cyan)' : 'var(--text2)', background: activeLink.startsWith('/es') ? 'var(--cyan2)' : 'transparent' }}>
                    Español
                  </a>
                  <a href="/fr" onClick={() => setLangDropdownOpen(false)}
                    className="w-full text-left px-3 py-2 text-[11px] transition-colors flex items-center gap-2 nav-dropdown-item"
                    style={{ color: activeLink.startsWith('/fr') ? 'var(--cyan)' : 'var(--text2)', background: activeLink.startsWith('/fr') ? 'var(--cyan2)' : 'transparent' }}>
                    Français
                  </a>
                  <a href="/tr" onClick={() => setLangDropdownOpen(false)}
                    className="w-full text-left px-3 py-2 text-[11px] transition-colors flex items-center gap-2 nav-dropdown-item"
                    style={{ color: activeLink.startsWith('/tr') ? 'var(--cyan)' : 'var(--text2)', background: activeLink.startsWith('/tr') ? 'var(--cyan2)' : 'transparent' }}>
                    Türkçe
                  </a>
                </div>
              )}
            </div>

            {/* CTA — Register — Only when not logged in */}
            {!isLoggedIn && (
              <a href="/es/auth?tab=register" className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, var(--gold), #F59E0B)', color: 'var(--bg)', boxShadow: '0 0 12px rgba(212,175,55,0.25)' }}>
                Registrarse
                <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
              </a>
            )}

            {/* Mobile Hamburger */}
            <button className="lg:hidden text-lg p-1.5 rounded-lg hover:bg-[var(--cyan3)] transition-colors" style={{ color: 'var(--text)' }}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileOpen}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileOpen ? <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></> : <><path d="M4 8h16"/><path d="M4 16h16"/></>}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ Mobile Menu — Inline Dropdown (LTR) ═══ */}
      {mobileOpen && (
        <div className="lg:hidden slide-in-top" dir="ltr" style={{ background: 'color-mix(in srgb, var(--bg3) 95%, transparent)', backdropFilter: 'blur(32px)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex flex-col gap-0.5 p-3 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {navItems.map((item) => (
              <MobileNavItem key={item.label} item={item} activeLink={activeLink} onClose={() => setMobileOpen(false)} />
            ))}

            {/* More Links in Mobile */}
            <div className="py-2 mt-1" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-[10px] font-bold px-3 block mb-1" style={{ color: 'var(--text3)' }}>Más</span>
              {moreLinks.map((link) => (
                <Link key={link.href} href={link.href}
                  className="flex items-center gap-2.5 text-[12px] font-medium py-2 px-3 rounded-lg transition-colors text-[var(--text2)] hover:bg-[var(--cyan3)]"
                  onClick={() => setMobileOpen(false)}>
                  <span style={{ color: 'var(--cyan)', opacity: 0.7 }}>{link.icon}</span>
                  <span className="flex-1">{link.label}</span>
                  {link.badge && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: `${link.badgeColor}18`, color: link.badgeColor }}>
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Market sessions in mobile */}
            <div className="flex items-center gap-2 py-2 px-3 overflow-x-auto">
              {marketSessions.map((s) => {
                const open = mounted ? isMarketOpen(s.tz, s.openH, s.closeH) : false;
                const nameMap: Record<string, string> = { TKY: 'Tokio', DXB: 'Dubái', LDN: 'Londres', NY: 'Nueva York' };
                return (
                  <span key={s.code} className="flex items-center gap-1 text-[10px] flex-shrink-0"
                    style={{ color: open ? 'var(--bull)' : 'var(--text3)' }}>
                    <span className="w-[3px] h-[3px] rounded-full" style={{ background: open ? 'var(--bull)' : 'var(--text3)' }} />
                    {nameMap[s.code] || s.code}
                  </span>
                );
              })}
            </div>

            {/* Language switch in mobile */}
            <div className="py-2 px-3" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-[10px] font-bold block mb-1.5" style={{ color: 'var(--text3)' }}>Idioma</span>
              <div className="flex gap-2">
                {/* Use <a> instead of <Link> for language switch to force full page reload. */}
                <a
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center text-[11px] font-semibold px-2 py-2 rounded-lg transition-all"
                  style={{
                    color: (activeLink.startsWith('/en') || activeLink.startsWith('/es')) ? 'var(--text2)' : 'var(--cyan)',
                    background: (activeLink.startsWith('/en') || activeLink.startsWith('/es')) ? 'var(--cyan3)' : 'var(--cyan2)',
                    border: (activeLink.startsWith('/en') || activeLink.startsWith('/es')) ? '1px solid var(--border)' : '1px solid rgba(0,229,255,0.2)',
                  }}>
                  عربي
                </a>
                <a
                  href="/en"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center text-[11px] font-semibold px-2 py-2 rounded-lg transition-all"
                  style={{
                    color: activeLink.startsWith('/en') ? 'var(--cyan)' : 'var(--text2)',
                    background: activeLink.startsWith('/en') ? 'var(--cyan2)' : 'var(--cyan3)',
                    border: activeLink.startsWith('/en') ? '1px solid rgba(0,229,255,0.2)' : '1px solid var(--border)',
                  }}>
                  English
                </a>
                <a
                  href="/es"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center text-[11px] font-semibold px-2 py-2 rounded-lg transition-all"
                  style={{
                    color: activeLink.startsWith('/es') ? 'var(--cyan)' : 'var(--text2)',
                    background: activeLink.startsWith('/es') ? 'var(--cyan2)' : 'var(--cyan3)',
                    border: activeLink.startsWith('/es') ? '1px solid rgba(0,229,255,0.2)' : '1px solid var(--border)',
                  }}>
                  Español
                </a>
                <a
                  href="/fr"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center text-[11px] font-semibold px-2 py-2 rounded-lg transition-all"
                  style={{
                    color: activeLink.startsWith('/fr') ? 'var(--cyan)' : 'var(--text2)',
                    background: activeLink.startsWith('/fr') ? 'var(--cyan2)' : 'var(--cyan3)',
                    border: activeLink.startsWith('/fr') ? '1px solid rgba(0,229,255,0.2)' : '1px solid var(--border)',
                  }}>
                  Français
                </a>
                <a
                  href="/tr"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center text-[11px] font-semibold px-2 py-2 rounded-lg transition-all"
                  style={{
                    color: activeLink.startsWith('/tr') ? 'var(--cyan)' : 'var(--text2)',
                    background: activeLink.startsWith('/tr') ? 'var(--cyan2)' : 'var(--cyan3)',
                    border: activeLink.startsWith('/tr') ? '1px solid rgba(0,229,255,0.2)' : '1px solid var(--border)',
                  }}>
                  Türkçe
                </a>
              </div>
            </div>

            <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              {isLoggedIn ? (
                <>
                  <div className="flex items-center gap-2 flex-1">
                    {session?.user?.image ? (
                      <img src={session.user.image} alt="Avatar" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ background: 'linear-gradient(135deg, var(--cyan), var(--purple))', color: '#fff' }}>
                        {(session?.user?.name || session?.user?.email || 'U')[0]}
                      </div>
                    )}
                    <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--text)' }}>
                      {session?.user?.name?.split(' ')[0] || 'Usuario'}
                    </span>
                  </div>
                  <button
                    onClick={() => { setMobileOpen(false); signOut({ callbackUrl: '/' }); }}
                    className="text-[11px] font-semibold px-2.5 py-1.5 rounded-md"
                    style={{ color: 'var(--bear)', border: '1px solid rgba(244,63,94,0.2)' }}>
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <a href="/auth" className="flex-1 text-center text-[11px] font-semibold px-2.5 py-1.5 rounded-md" style={{ color: 'var(--text2)', border: '1px solid var(--border)' }}>Iniciar Sesión</a>
                  <a href="/auth?tab=register" className="flex-1 text-center text-[11px] font-bold px-2.5 py-1.5 rounded-md" style={{ background: 'linear-gradient(135deg, var(--gold), #F59E0B)', color: 'var(--bg)' }}>Registrarse</a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

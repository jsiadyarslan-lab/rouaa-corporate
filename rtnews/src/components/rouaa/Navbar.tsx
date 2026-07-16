'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { toggleSearchCommand } from '@/components/rouaa/SearchCommand';

// ─── Types ───
type SubItem = { label: string; href: string; badge?: string; badgeColor?: string };
type NavItem = {
  label: string;
  href: string;
  badge?: string;
  badgeColor?: string;
  sub?: SubItem[];
};

// ─── Navigation Items with Dropdowns ───
const navItems: NavItem[] = [
  { label: 'الرئيسية', href: '/ar' },
  {
    label: 'الأخبار',
    href: '/ar/news',
    sub: [
      { label: 'الأخبار', href: '/ar/news' },
      { label: 'الأجندة', href: '/ar/calendar' },
    ],
  },
  {
    label: 'تحليل الأسهم',
    href: '/ar/stock-analysis',
    sub: [
      { label: 'تحليلات اليوم', href: '/ar/stock-analysis' },
      { label: 'ماسح الأسهم', href: '/ar/stock-analysis/screener' },
      { label: 'تحليل القطاعات', href: '/ar/stock-analysis/sectors' },
    ],
  },
  {
    label: 'مساعد رؤى',
    href: '/ar/advisor',
    badge: 'AI',
    badgeColor: '#d4af37',
  },
  {
    label: 'إشارات التداول',
    href: '/ar/signals',
    sub: [
      { label: 'إشارات التداول', href: '/ar/signals' },
      { label: 'أداء الإشارات', href: '/ar/signals/performance' },
    ],
  },
  {
    label: 'الأسواق',
    href: '/ar/markets',
    sub: [
      { label: 'الأسواق', href: '/ar/markets' },
      { label: 'نبض الأسواق', href: '/ar/market-pulse', badge: 'مباشر', badgeColor: '#22C55E' },
    ],
  },
  {
    label: 'تقارير وتحليلات',
    href: '/ar/reports',
    sub: [
      { label: 'مركز التقارير', href: '/ar/reports' },
      { label: 'تحليلات فنية متقدمة', href: '/ar/technical-analyses', badge: 'جديد', badgeColor: '#8B5CF6' },
      { label: 'أرشيف التقارير', href: '/ar/reports/search' },
    ],
  },
  { label: 'تقارير استراتيجية', href: '/ar/strategic-reports' },
  {
    label: 'المخاطر الجيوسياسية',
    href: '/ar/geopolitical-risks',
    sub: [
      { label: 'لوحة المتابعة', href: '/ar/geopolitical-risks' },
      { label: 'الخريطة التفاعلية', href: '/ar/geopolitical-risks/map' },
      { label: 'السيناريوهات', href: '/ar/geopolitical-risks/scenarios' },
      { label: 'طرق التجارة', href: '/ar/geopolitical-risks/trade-routes' },
      { label: 'خريطة الحرارة', href: '/ar/geopolitical-risks/heatmap' },
      { label: 'التقارير', href: '/ar/geopolitical-risks/reports' },
    ],
  },
  { label: 'إنفو غرافيك', href: '/ar/infographics' },
  { label: 'فيديو', href: '/ar/videos' },
  {
    label: 'محفظتي',
    href: '/ar/portfolio',
    sub: [
      { label: 'محفظتي', href: '/ar/portfolio' },
      { label: 'المحفوظات', href: '/ar/bookmarks' },
    ],
  },
  {
    label: 'الأكاديمية',
    href: '/ar/academy',
    sub: [
      { label: 'الأكاديمية', href: '/ar/academy' },
      { label: 'المكتبة', href: '/ar/library' },
    ],
  },
];

// ─── More Links (items not in main nav) ───
const moreLinks = [
  {
    label: 'تحليل AI',
    href: '/ar/analysis',
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
    label: 'النشرة البريدية',
    href: '/ar/reports#newsletter',
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
    label: 'أرشيف التقارير',
    href: '/ar/reports/search',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
    badge: undefined,
    badgeColor: '',
  },
  {
    label: 'الأرشيف',
    href: '/ar/archive',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    badge: undefined,
    badgeColor: '',
  },
  {
    label: 'البنوك المركزية',
    href: '/ar/central-banks',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18" /><path d="M3 10h18" /><path d="M5 6l7-3 7 3" /><path d="M4 10v11" /><path d="M20 10v11" /><path d="M8 14v4" /><path d="M12 14v4" /><path d="M16 14v4" />
      </svg>
    ),
    badge: undefined,
    badgeColor: '',
  },
  {
    label: 'أرباح الشركات',
    href: '/ar/earnings',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20h20" /><path d="M5 20V10" /><path d="M10 20V4" /><path d="M15 20v-8" /><path d="M20 20v-4" />
      </svg>
    ),
    badge: undefined,
    badgeColor: '',
  },
  {
    label: 'المجتمع',
    href: '/ar/community',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    badge: undefined,
    badgeColor: '',
  },
  {
    label: 'الأسعار',
    href: '/ar/pricing',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    badge: undefined,
    badgeColor: '',
  },
  {
    label: 'تيليجرام',
    href: '/ar/telegram',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="#229ED9">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    badge: 'بوت',
    badgeColor: '#229ED9',
  },
  {
    label: 'وثائق API',
    href: '/ar/docs/api',
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
    label: 'الامتثال',
    href: '/ar/compliance',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    ),
    badge: undefined,
    badgeColor: '',
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

// ─── Mobile Nav Item with expandable dropdown ───
function MobileNavItem({ item, activeLink, onClose }: { item: NavItem; activeLink: string; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const isActive = activeLink === item.href || (item.href !== '/' && activeLink.startsWith(item.href)) ||
    (item.sub ? item.sub.some(sub => { const p = sub.href.split('#')[0]; return p !== '/' && activeLink.startsWith(p); }) : false);
  const hasDropdown = !!(item.sub && item.sub.length > 0);
  const isGold = item.label === 'مساعد رؤى';

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
              isGold ? 'nav-badge-gold' : item.badge === 'AI' ? 'nav-badge-ai' : item.badge === 'مباشر' ? 'nav-badge-live' : 'nav-badge-new'
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
        <div className="mr-4 mt-0.5 mb-1 flex flex-col gap-0.5" style={{ borderRight: '2px solid var(--border2)' }}>
          {item.sub!.map((sub) => {
            const subPath = sub.href.split('#')[0];
            const isSubActive = subPath === '/' ? activeLink === '/' : activeLink.startsWith(subPath);
            return (
              <Link key={sub.href} href={sub.href}
                className={`text-[12px] font-medium py-2 px-3 rounded-md transition-all duration-200 ${
                  isSubActive ? 'text-[var(--cyan)] bg-[var(--cyan2)]' : 'text-[var(--text3)] hover:text-[var(--text2)] hover:bg-[var(--cyan3)]'
                }`}
                onClick={onClose}>
                {sub.label}
                {sub.badge && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold mr-2"
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

export default function Navbar() {
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
  const dropdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const activeLink = pathname;
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated' && !!session?.user;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (marketDropdownRef.current && !marketDropdownRef.current.contains(e.target as Node)) {
        setMarketDropdownOpen(false);
      }
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
  }, [pathname]);

  const handleDropdownEnter = useCallback((label: string) => {
    if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current);
    setOpenDropdown(label);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    dropdownTimerRef.current = setTimeout(() => { setOpenDropdown(null); }, 200);
  }, []);

  const isItemActive = (item: NavItem) => {
    if (item.href === '/') return activeLink === '/';
    if (activeLink.startsWith(item.href)) return true;
    if (item.sub) {
      return item.sub.some(sub => {
        const subPath = sub.href.split('#')[0];
        return subPath !== '/' && activeLink.startsWith(subPath);
      });
    }
    return false;
  };

  return (
    <>
      {/* ═══ Main Navbar ═══ */}
      <nav className="fixed left-0 right-0 z-[1001] h-[52px] flex items-center"
        role="navigation" aria-label="القائمة الرئيسية"
        style={{
          top: 'var(--nav-top, 68px)',
          background: 'color-mix(in srgb, var(--bg) 80%, transparent)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          borderBottom: '1px solid var(--border)',
          padding: '0 clamp(12px, 2.5vw, 28px)',
        }}>
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px]" style={{ background: 'linear-gradient(90deg, transparent, var(--gold), var(--cyan), var(--purple), transparent)' }} />

        <div className="w-full flex items-center gap-2">
          {/* Logo */}
          <a href="/ar" className="flex items-center gap-1.5 flex-shrink-0 group">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none" className="flex-shrink-0">
              <rect width="28" height="28" rx="6" fill="rgba(0,229,255,0.1)" />
              <polyline points="4,20 10,12 16,16 24,6" stroke="url(#nav-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="24" cy="6" r="2.5" fill="var(--cyan)" />
              <defs>
                <linearGradient id="nav-grad" x1="4" y1="20" x2="24" y2="6">
                  <stop offset="0%" stopColor="#00E5FF" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-[16px] sm:text-[20px] font-bold gradient-text font-heading group-hover:scale-105 transition-transform">رؤى</span>
            <span className="live-dot" />
          </a>

          {/* Nav Links — Desktop with Glassmorphism */}
          <div className="hidden lg:flex items-center me-2">
            {navItems.map((item) => {
              const isActive = isItemActive(item);
              const hasDropdown = item.sub && item.sub.length > 0;
              const isDropdownOpen = openDropdown === item.label;
              const isGold = item.label === 'مساعد رؤى';
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
                      <span className={`nav-badge ${isGold ? 'nav-badge-gold' : isAI ? 'nav-badge-ai' : item.badge === 'مباشر' ? 'nav-badge-live' : item.badge === 'جديد' ? 'nav-badge-new' : ''}`}>
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

                  {/* Dropdown Menu */}
                  {hasDropdown && isDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1.5 w-[200px] rounded-xl overflow-hidden slide-in-top z-[1100] nav-dropdown-panel">
                      <div className="py-1.5">
                        {item.sub!.map((sub) => {
                          const subPath = sub.href.split('#')[0];
                          const isSubActive = subPath === '/' ? activeLink === '/' : activeLink.startsWith(subPath);
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
                aria-label="المزيد من الروابط"
                aria-expanded={moreOpen}
                aria-haspopup="true"
              >
                <span>المزيد</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className={`transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`}>
                  <polyline points="6,9 12,15 18,9" />
                </svg>
              </button>

              {moreOpen && (
                <div className="absolute top-full right-0 mt-1.5 w-[220px] rounded-xl overflow-hidden slide-in-top z-[1100] nav-dropdown-panel">
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
              aria-label="أوقات التداول"
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
              <div className="absolute top-full start-0 mt-1.5 w-[180px] rounded-xl overflow-hidden slide-in-top z-[1100] nav-dropdown-panel">
                <div className="py-1.5">
                  <div className="px-3.5 py-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>أوقات التداول</span>
                  </div>
                  {marketSessions.map((s) => {
                    const open = mounted ? isMarketOpen(s.tz, s.openH, s.closeH) : false;
                    const nameMap: Record<string, string> = { TKY: 'طوكيو', DXB: 'دبي', LDN: 'لندن', NY: 'نيويورك' };
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
                          {open ? 'مفتوح' : 'مغلق'}
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

          {/* Right Side Controls */}
          <div className="flex items-center gap-1">
            {/* Search — Command Palette */}
            <button
              className="flex nav-glass-icon"
              aria-label="البحث (Ctrl+K)"
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
                  aria-label="قائمة المستخدم"
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                >
                  {/* Avatar */}
                  {session?.user?.image ? (
                    <img src={session.user.image} alt="صورة المستخدم" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                      style={{ background: 'linear-gradient(135deg, var(--cyan), var(--purple))', color: '#fff' }}>
                      {(session?.user?.name || session?.user?.email || 'م')[0]}
                    </div>
                  )}
                  <span className="text-[10px] font-semibold max-w-[40px] sm:max-w-[60px] truncate" style={{ color: 'var(--text2)' }}>
                    {session?.user?.name?.split(' ')[0] || session?.user?.email?.split('@')[0] || 'مستخدم'}
                  </span>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className={`transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`}>
                    <polyline points="6,9 12,15 18,9" />
                  </svg>
                </button>

                {userDropdownOpen && (
                  <div className="absolute end-0 top-full mt-1.5 w-[180px] rounded-xl overflow-hidden slide-in-top z-[1100] nav-dropdown-panel">
                    <div className="py-1.5">
                      <div className="px-3.5 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                        <p className="text-[11px] font-bold truncate" style={{ color: 'var(--text)' }}>{session?.user?.name || 'مستخدم'}</p>
                        <p className="text-[9px] truncate" style={{ color: 'var(--text3)' }}>{session?.user?.email}</p>
                      </div>
                      <Link href="/ar/portfolio" className="flex items-center gap-2.5 px-3.5 py-2 text-[11px] font-semibold nav-dropdown-item"
                        style={{ color: 'var(--text2)' }} onClick={() => setUserDropdownOpen(false)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        ملفي الشخصي
                      </Link>
                      <Link href="/ar/bookmarks" className="flex items-center gap-2.5 px-3.5 py-2 text-[11px] font-semibold nav-dropdown-item"
                        style={{ color: 'var(--text2)' }} onClick={() => setUserDropdownOpen(false)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                        المحفوظات
                      </Link>
                      <Link href="/ar/advisor" className="flex items-center gap-2.5 px-3.5 py-2 text-[11px] font-semibold nav-dropdown-item"
                        style={{ color: 'var(--text2)' }} onClick={() => setUserDropdownOpen(false)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        مساعد رؤى
                      </Link>
                      <div className="border-t" style={{ borderColor: 'var(--border)' }}>
                        <button
                          onClick={() => { setUserDropdownOpen(false); signOut({ callbackUrl: '/' }); }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[11px] font-semibold nav-dropdown-item"
                          style={{ color: 'var(--bear)' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                          تسجيل الخروج
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <a href="/ar/auth" className="flex items-center gap-1 text-[9px] font-semibold px-2 py-1 rounded transition-all duration-200 nav-glass"
                style={{ color: 'var(--text2)', borderColor: 'var(--border)' }}>
                دخول
              </a>
            )}

            {/* Language Dropdown — Always visible regardless of login state */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1 text-[9px] font-semibold px-2 py-1 rounded transition-all duration-200 nav-glass"
                style={{ color: 'var(--cyan)' }}
                aria-label="تبديل اللغة"
                aria-expanded={langDropdownOpen}
                aria-haspopup="true">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span className="hidden sm:inline">ع</span>
              </button>
              {langDropdownOpen && (
                <div className="absolute end-0 top-full mt-1 w-fit min-w-[100px] rounded-lg overflow-hidden z-[1100] nav-dropdown-panel">
                  <a href="/" onClick={() => setLangDropdownOpen(false)}
                    className="w-full text-right px-3 py-2 text-[11px] transition-colors flex items-center gap-2 nav-dropdown-item"
                    style={{ color: (!activeLink.startsWith('/en') && !activeLink.startsWith('/fr') && !activeLink.startsWith('/tr') && !activeLink.startsWith('/es')) ? 'var(--cyan)' : 'var(--text2)', background: (!activeLink.startsWith('/en') && !activeLink.startsWith('/fr') && !activeLink.startsWith('/tr') && !activeLink.startsWith('/es')) ? 'var(--cyan2)' : 'transparent' }}>
                    عربي
                  </a>
                  <a href="/en" onClick={() => setLangDropdownOpen(false)}
                    className="w-full text-right px-3 py-2 text-[11px] transition-colors flex items-center gap-2 nav-dropdown-item"
                    style={{ color: activeLink.startsWith('/en') ? 'var(--cyan)' : 'var(--text2)', background: activeLink.startsWith('/en') ? 'var(--cyan2)' : 'transparent' }}>
                    English
                  </a>
                  <a href="/fr" onClick={() => setLangDropdownOpen(false)}
                    className="w-full text-right px-3 py-2 text-[11px] transition-colors flex items-center gap-2 nav-dropdown-item"
                    style={{ color: activeLink.startsWith('/fr') ? 'var(--cyan)' : 'var(--text2)', background: activeLink.startsWith('/fr') ? 'var(--cyan2)' : 'transparent' }}>
                    Français
                  </a>
                  <a href="/tr" onClick={() => setLangDropdownOpen(false)}
                    className="w-full text-right px-3 py-2 text-[11px] transition-colors flex items-center gap-2 nav-dropdown-item"
                    style={{ color: activeLink.startsWith('/tr') ? 'var(--cyan)' : 'var(--text2)', background: activeLink.startsWith('/tr') ? 'var(--cyan2)' : 'transparent' }}>
                    Türkçe
                  </a>
                  <a href="/es" onClick={() => setLangDropdownOpen(false)}
                    className="w-full text-right px-3 py-2 text-[11px] transition-colors flex items-center gap-2 nav-dropdown-item"
                    style={{ color: activeLink.startsWith('/es') ? 'var(--cyan)' : 'var(--text2)', background: activeLink.startsWith('/es') ? 'var(--cyan2)' : 'transparent' }}>
                    Español
                  </a>
                </div>
              )}
            </div>

            {/* CTA — Register — Only when not logged in */}
            {!isLoggedIn && (
              <a href="/ar/auth?tab=register" className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, var(--gold), #F59E0B)', color: 'var(--bg)', boxShadow: '0 0 12px rgba(212,175,55,0.25)' }}>
                إنشاء حساب
                <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
              </a>
            )}

            {/* Mobile Hamburger */}
            <button className="lg:hidden text-lg p-1.5 rounded-lg hover:bg-[var(--cyan3)] transition-colors" style={{ color: 'var(--text)' }}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              aria-expanded={mobileOpen}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileOpen ? <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></> : <><path d="M4 8h16"/><path d="M4 16h16"/></>}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ Mobile Menu ═══ */}
      {mobileOpen && (
        <div className="lg:hidden slide-in-top" style={{ background: 'color-mix(in srgb, var(--bg3) 95%, transparent)', backdropFilter: 'blur(32px)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex flex-col gap-0.5 p-3 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {navItems.map((item) => (
              <MobileNavItem key={item.label} item={item} activeLink={activeLink} onClose={() => setMobileOpen(false)} />
            ))}

            {/* More Links in Mobile */}
            <div className="py-2 mt-1" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-[10px] font-bold px-3 block mb-1" style={{ color: 'var(--text3)' }}>المزيد</span>
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
                return (
                  <span key={s.code} className="flex items-center gap-1 text-[10px] flex-shrink-0"
                    style={{ color: open ? 'var(--bull)' : 'var(--text3)' }}>
                    <span className="w-[3px] h-[3px] rounded-full" style={{ background: open ? 'var(--bull)' : 'var(--text3)' }} />
                    {s.code}
                  </span>
                );
              })}
            </div>

            {/* Language switch in mobile */}
            <div className="py-2 px-3" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-[10px] font-bold block mb-1.5" style={{ color: 'var(--text3)' }}>اللغة</span>
              <div className="flex gap-2 flex-wrap">
                {/* FIX: Use <a> instead of <Link> for language switch to force full page reload. */}
                <a
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center text-[11px] font-semibold px-2 py-2 rounded-lg transition-all"
                  style={{
                    color: (!activeLink.startsWith('/en') && !activeLink.startsWith('/fr') && !activeLink.startsWith('/tr') && !activeLink.startsWith('/es')) ? 'var(--cyan)' : 'var(--text2)',
                    background: (!activeLink.startsWith('/en') && !activeLink.startsWith('/fr') && !activeLink.startsWith('/tr') && !activeLink.startsWith('/es')) ? 'var(--cyan2)' : 'var(--cyan3)',
                    border: (!activeLink.startsWith('/en') && !activeLink.startsWith('/fr') && !activeLink.startsWith('/tr') && !activeLink.startsWith('/es')) ? '1px solid rgba(0,229,255,0.2)' : '1px solid var(--border)',
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
                  EN
                </a>
                <a href="/es" onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center text-[11px] font-semibold px-2 py-2 rounded-lg transition-all min-w-[60px]"
                  style={{
                    color: activeLink.startsWith('/es') ? 'var(--cyan)' : 'var(--text2)',
                    background: activeLink.startsWith('/es') ? 'var(--cyan2)' : 'var(--cyan3)',
                    border: activeLink.startsWith('/es') ? '1px solid rgba(0,229,255,0.2)' : '1px solid var(--border)',
                  }}>
                  ES
                </a>
                <a href="/fr" onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center text-[11px] font-semibold px-2 py-2 rounded-lg transition-all min-w-[60px]"
                  style={{
                    color: activeLink.startsWith('/fr') ? 'var(--cyan)' : 'var(--text2)',
                    background: activeLink.startsWith('/fr') ? 'var(--cyan2)' : 'var(--cyan3)',
                    border: activeLink.startsWith('/fr') ? '1px solid rgba(0,229,255,0.2)' : '1px solid var(--border)',
                  }}>
                  FR
                </a>
                <a href="/tr" onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center text-[11px] font-semibold px-2 py-2 rounded-lg transition-all min-w-[60px]"
                  style={{
                    color: activeLink.startsWith('/tr') ? 'var(--cyan)' : 'var(--text2)',
                    background: activeLink.startsWith('/tr') ? 'var(--cyan2)' : 'var(--cyan3)',
                    border: activeLink.startsWith('/tr') ? '1px solid rgba(0,229,255,0.2)' : '1px solid var(--border)',
                  }}>
                  TR
                </a>
              </div>
            </div>

            <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              {isLoggedIn ? (
                <>
                  <div className="flex items-center gap-2 flex-1">
                    {session?.user?.image ? (
                      <img src={session.user.image} alt="صورة المستخدم" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ background: 'linear-gradient(135deg, var(--cyan), var(--purple))', color: '#fff' }}>
                        {(session?.user?.name || session?.user?.email || 'م')[0]}
                      </div>
                    )}
                    <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--text)' }}>
                      {session?.user?.name?.split(' ')[0] || 'مستخدم'}
                    </span>
                  </div>
                  <button
                    onClick={() => { setMobileOpen(false); signOut({ callbackUrl: '/' }); }}
                    className="text-[11px] font-semibold px-2.5 py-1.5 rounded-md"
                    style={{ color: 'var(--bear)', border: '1px solid rgba(244,63,94,0.2)' }}>
                    خروج
                  </button>
                </>
              ) : (
                <>
                  <a href="/ar/auth" className="flex-1 text-center text-[11px] font-semibold px-2.5 py-1.5 rounded-md" style={{ color: 'var(--text2)', border: '1px solid var(--border)' }}>دخول</a>
                  <a href="/ar/auth?tab=register" className="flex-1 text-center text-[11px] font-bold px-2.5 py-1.5 rounded-md" style={{ background: 'linear-gradient(135deg, var(--gold), #F59E0B)', color: 'var(--bg)' }}>إنشاء حساب</a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

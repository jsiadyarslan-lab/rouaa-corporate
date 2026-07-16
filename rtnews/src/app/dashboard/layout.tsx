// ─── Dashboard Layout V49 ────────────────────────────────────
// Modern sidebar layout with auth protection, RTL, dark theme
// V49: Collapsible sidebar sections for production lines

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AdminLogin from '@/components/AdminLogin';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Newspaper,
  Bot,
  Settings,
  LogOut,
  RefreshCw,
  Menu,
  ExternalLink,
  Megaphone,
  Users,
  DollarSign,
  AlertTriangle,
  Clock,
  FileText,
  Activity,
  Sparkles,
  Flame,
  Shield,
  Settings2,
  Layers,
  Eye,
  Video,
  Cpu,
  ChevronDown,
  ChevronUp,
  Key,
  Globe,
} from 'lucide-react';

// ── V49: Sectioned navigation — collapsible production lines ──
interface NavItem {
  href: string;
  label: string;
  icon: any;
}

interface NavSection {
  title: string;
  titleEn?: string;
  collapsible: boolean;
  key?: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'عام',
    collapsible: false,
    items: [
      { href: '/dashboard', label: 'نظرة عامة', icon: LayoutDashboard },
    ],
  },
  {
    title: '🇸🇦 خط الإنتاج العربي',
    collapsible: true,
    key: 'ar',
    items: [
      { href: '/dashboard/ar', label: 'لوحة التحكم الموحدة', icon: Settings2 },
      { href: '/dashboard/ar/news', label: 'الأخبار', icon: Newspaper },
      { href: '/dashboard/ar/reports', label: 'التقارير الآلية', icon: FileText },
      { href: '/dashboard/ar/strategic-reports', label: 'التقارير الاستراتيجية', icon: Shield },
      { href: '/dashboard/ar/infographics', label: 'الإنفوغرافيك', icon: Layers },
      { href: '/dashboard/ar/videos', label: 'فيديوهات التقارير', icon: Video },
      { href: '/dashboard/ar/monitor', label: 'رقيب رؤى', icon: Eye },
    ],
  },
  {
    title: '🇬🇧 خط الإنتاج الإنكليزي',
    titleEn: 'English Production',
    collapsible: true,
    key: 'en',
    items: [
      { href: '/dashboard/en', label: 'Unified Dashboard', icon: Settings2 },
      { href: '/dashboard/en/news', label: 'News', icon: Newspaper },
      { href: '/dashboard/en/reports', label: 'Reports', icon: FileText },
      { href: '/dashboard/en/strategic-reports', label: 'Strategic Reports', icon: Shield },
      { href: '/dashboard/en/infographics', label: 'Infographics', icon: Layers },
      { href: '/dashboard/en/videos', label: 'Report Videos', icon: Video },
      { href: '/dashboard/en/monitor', label: 'Monitor', icon: Eye },
    ],
  },
  {
    title: '🇫🇷 خط الإنتاج الفرنسي',
    titleEn: 'French Production',
    collapsible: true,
    key: 'fr',
    items: [
      { href: '/dashboard/fr', label: 'Tableau de Bord', icon: Settings2 },
      { href: '/dashboard/fr/news', label: 'Actualités', icon: Newspaper },
      { href: '/dashboard/fr/reports', label: 'Rapports', icon: FileText },
      { href: '/dashboard/fr/strategic-reports', label: 'Rapports Stratégiques', icon: Shield },
      { href: '/dashboard/fr/infographics', label: 'Infographies', icon: Layers },
      { href: '/dashboard/fr/videos', label: 'Vidéos', icon: Video },
      { href: '/dashboard/fr/monitor', label: 'Surveillance', icon: Eye },
    ],
  },
  {
    title: '🇪🇸 Producción Española',
    titleEn: 'Spanish Production',
    collapsible: true,
    key: 'es',
    items: [
      { href: '/dashboard/es', label: 'Panel de Control', icon: Settings2 },
      { href: '/dashboard/es/news', label: 'Noticias', icon: Newspaper },
      { href: '/dashboard/es/reports', label: 'Informes', icon: FileText },
      { href: '/dashboard/es/strategic-reports', label: 'Informes Estratégicos', icon: Shield },
      { href: '/dashboard/es/infographics', label: 'Infografías', icon: Layers },
      { href: '/dashboard/es/videos', label: 'Videos', icon: Video },
      { href: '/dashboard/es/monitor', label: 'Monitor', icon: Eye },
    ],
  },
  {
    title: '🇹🇷 خط الإنتاج التركي',
    titleEn: 'Turkish Production',
    collapsible: true,
    key: 'tr',
    items: [
      { href: '/dashboard/tr', label: 'Kontrol Paneli', icon: Settings2 },
      { href: '/dashboard/tr/news', label: 'Haberler', icon: Newspaper },
      { href: '/dashboard/tr/reports', label: 'Raporlar', icon: FileText },
      { href: '/dashboard/tr/strategic-reports', label: 'Stratejik Raporlar', icon: Shield },
      { href: '/dashboard/tr/infographics', label: 'İnfografikler', icon: Layers },
      { href: '/dashboard/tr/videos', label: 'Videolar', icon: Video },
      { href: '/dashboard/tr/monitor', label: 'İzleme', icon: Eye },
    ],
  },
  {
    title: '📈 أنابيب تحليل الأسهم',
    titleEn: 'Stock Analysis Pipelines',
    collapsible: true,
    key: 'stocks',
    items: [
      { href: '/dashboard/stock-analysis', label: 'لوحة التحكم', icon: Activity },
      { href: '/dashboard/stock-analysis/ar', label: 'أنابيب العربية', icon: Flame },
      { href: '/dashboard/stock-analysis/en', label: 'English Pipelines', icon: Flame },
      { href: '/dashboard/stock-analysis/fr', label: 'Pipelines Français', icon: Flame },
      { href: '/dashboard/stock-analysis/es', label: 'Pipelines Españoles', icon: Flame },
      { href: '/dashboard/stock-analysis/tr', label: 'Türk İşlem Hatları', icon: Flame },
      { href: '/dashboard/stock-analysis/companies', label: 'ملفات الشركات', icon: Users },
    ],
  },
  {
    title: '🛡️ الحارس الذكي',
    titleEn: 'Smart Guardian',
    collapsible: true,
    key: 'guardian',
    items: [
      { href: '/dashboard/guardian', label: 'لوحة الحارس', icon: Shield },
    ],
  },
  {
    title: '🛡️ المخاطر الجيوسياسية',
    titleEn: 'Geopolitical Risks',
    collapsible: false,
    items: [
      { href: '/dashboard/geopolitical', label: 'لوحة المخاطر الجيوسياسية', icon: Globe },
    ],
  },
  {
    title: '🤖 محرر الأخبار الذكي',
    titleEn: 'AI News Editor',
    collapsible: false,
    items: [
      { href: '/dashboard/ai-news', label: 'الأخبار المولّدة بالذكاء الاصطناعي', icon: Newspaper },
    ],
  },
  {
    title: 'إعدادات مشتركة',
    collapsible: false,
    items: [
      { href: '/dashboard/keys', label: 'إدارة المفاتيح', icon: Key },
      { href: '/dashboard/models', label: 'النماذج والتعيين', icon: Cpu },
      { href: '/dashboard/ai', label: 'AI والتكاليف', icon: Bot },
      { href: '/dashboard/ads', label: 'الإعلانات', icon: Megaphone },
      { href: '/dashboard/community', label: 'المجتمع', icon: Users },
      { href: '/dashboard/settings', label: 'الإعدادات', icon: Settings },
    ],
  },
];

// Flat list for backward compatibility (page title lookup)
const NAV_ITEMS = NAV_SECTIONS.flatMap(s => s.items);

function SidebarNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    // Auto-expand sections whose child route is currently active
    const initial = new Set<string>();
    for (const section of NAV_SECTIONS) {
      if (section.collapsible && section.key) {
        const hasActiveChild = section.items.some(
          item => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
        );
        if (hasActiveChild) {
          initial.add(section.key);
        }
      }
    }
    return initial;
  });

  // Auto-expand when pathname changes to a child route
  useEffect(() => {
    for (const section of NAV_SECTIONS) {
      if (section.collapsible && section.key) {
        const hasActiveChild = section.items.some(
          item => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
        );
        if (hasActiveChild && !expandedSections.has(section.key)) {
          setExpandedSections(prev => new Set(prev).add(section.key!));
        }
      }
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <nav className="flex flex-col gap-0 p-3" style={{ direction: 'rtl' }}>
      {NAV_SECTIONS.map((section, si) => {
        // Check if any child is active (for highlighting section header)
        const hasActiveChild = section.items.some(
          item => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
        );
        const isExpanded = section.collapsible && section.key ? expandedSections.has(section.key) : true;

        return (
          <div key={si}>
            {/* Section header */}
            {section.collapsible ? (
              <button
                onClick={() => section.key && toggleSection(section.key)}
                className={`w-full flex items-center gap-2 px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 hover:opacity-80 ${hasActiveChild ? 'opacity-100' : ''}`}
                style={{ color: hasActiveChild ? 'var(--cyan)' : 'var(--text4)' }}
              >
                <span className="truncate flex-1 text-right">{section.title}</span>
                {isExpanded ? (
                  <ChevronUp size={12} className="flex-shrink-0 transition-transform duration-200" />
                ) : (
                  <ChevronDown size={12} className="flex-shrink-0 transition-transform duration-200" />
                )}
              </button>
            ) : (
              <div className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text4)' }}>
                {section.title}
              </div>
            )}

            {/* Section items — collapsible with animation */}
            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                maxHeight: isExpanded ? '500px' : '0px',
                opacity: isExpanded ? 1 : 0,
              }}
            >
              {section.items.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200 group ${
                      isActive
                        ? 'text-[var(--cyan)] bg-[var(--cyan2)]'
                        : 'text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--cyan3)]'
                    }`}
                    style={isActive ? {
                      boxShadow: '0 0 12px rgba(0,229,255,0.08)',
                      borderLeft: '2px solid var(--cyan)',
                    } : { borderLeft: '2px solid transparent' }}
                  >
                    <Icon size={17} className={`transition-colors flex-shrink-0 ${isActive ? 'text-[var(--cyan)]' : 'text-[var(--text3)] group-hover:text-[var(--text2)]'}`} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Divider between sections */}
            {si < NAV_SECTIONS.length - 1 && (
              <div className="my-2 mx-3 h-[1px]" style={{ background: 'var(--border)' }} />
            )}
          </div>
        );
      })}
    </nav>
  );
}

// Logo component shared between desktop and mobile
function Logo({ size = 28 }: { size?: number }) {
  const id = `logo-grad-${size}`;
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="6" fill="rgba(0,229,255,0.08)" />
        <polyline points="4,20 10,12 16,16 24,6" stroke={`url(#${id})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="24" cy="6" r="2.5" fill="#00E5FF" />
        <defs>
          <linearGradient id={id} x1="4" y1="20" x2="24" y2="6">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-[20px] font-bold gradient-text font-heading">رؤى</span>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionWarning, setSessionWarning] = useState<string | null>(null);
  const sessionCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auth check with session expiry monitoring
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/verify');
      const data = await res.json();
      const isAuth = data.authenticated === true;
      setIsAuthenticated(isAuth);

      // V47: Monitor session expiry
      if (isAuth && data.remainingMs) {
        const remainingMinutes = Math.floor(data.remainingMs / 60000);

        if (remainingMinutes <= 5) {
          setSessionWarning(`تنتهي الجلسة خلال ${remainingMinutes} دقيقة`);
        } else if (remainingMinutes <= 30) {
          setSessionWarning(`تنتهي الجلسة خلال ${remainingMinutes} دقيقة`);
        } else {
          setSessionWarning(null);
        }

        // Auto-logout when session expires
        if (data.remainingMs <= 0) {
          setIsAuthenticated(false);
          setSessionWarning(null);
        }
      } else {
        setSessionWarning(null);
      }
    } catch {
      setIsAuthenticated(false);
      setSessionWarning(null);
    } finally {
      setAuthChecking(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // V47: Check session every 2 minutes
  useEffect(() => {
    if (!isAuthenticated) return;

    sessionCheckRef.current = setInterval(checkAuth, 120000);
    return () => {
      if (sessionCheckRef.current) clearInterval(sessionCheckRef.current);
    };
  }, [isAuthenticated, checkAuth]);

  // V47: Auto-logout on 401 responses from any admin API call
  useEffect(() => {
    const handleFetchError = (event: ErrorEvent) => {
      // This is a generic handler; actual 401 detection happens per-component
    };
    window.addEventListener('error', handleFetchError);
    return () => window.removeEventListener('error', handleFetchError);
  }, []);

  const handleLogin = useCallback(() => {
    setIsAuthenticated(true);
    setSessionWarning(null);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/login', { method: 'DELETE' });
    } catch {
      // Ignore
    }
    setIsAuthenticated(false);
    setSessionWarning(null);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 1500);
  }, [router]);

  // Loading state
  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" className="animate-spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span className="text-[13px]" style={{ color: 'var(--text3)' }}>جارٍ التحقق...</span>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  // Current page title
  const currentPage = NAV_ITEMS.find(item => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)));
  const pageTitle = currentPage?.label || 'لوحة التحكم';

  // V47: Determine if session warning is urgent (less than 5 min)
  const isUrgentWarning = sessionWarning !== null && sessionWarning.includes('خلال 5') || sessionWarning?.includes('خلال 4') || sessionWarning?.includes('خلال 3') || sessionWarning?.includes('خلال 2') || sessionWarning?.includes('خلال 1');

  return (
    <div className="h-screen flex overflow-hidden" dir="rtl" style={{ background: 'var(--bg)' }}>
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      {/* Desktop Sidebar — right side for RTL */}
      <aside
        className="hidden lg:flex flex-col w-[240px] xl:w-[260px] h-screen border-l flex-shrink-0"
        style={{
          background: 'var(--bg2)',
          borderColor: 'var(--border)',
          direction: 'rtl',
        }}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between px-5 py-5 flex-shrink-0">
          <Logo />
          <span className="text-[11px] px-2 py-1 rounded-full font-semibold" style={{ background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.15)' }}>
            ADMIN
          </span>
        </div>

        <Separator style={{ background: 'var(--border)' }} />

        <ScrollArea className="flex-1 py-2 overflow-y-auto">
          <SidebarNav pathname={pathname} />
        </ScrollArea>

        <Separator style={{ background: 'var(--border)' }} />

        {/* Bottom section */}
        <div className="p-3 space-y-1 flex-shrink-0">
          {/* Site link */}
          <Link href="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-[12px] font-medium transition-all hover:bg-[var(--bg4)]"
            style={{ color: 'var(--text3)' }}>
            <ExternalLink size={15} />
            <span>عرض الموقع</span>
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-[12px] font-semibold transition-all hover:bg-[rgba(244,63,94,0.06)]"
            style={{ color: 'var(--bear)' }}
          >
            <LogOut size={15} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* V47: Session expiry warning banner */}
        {sessionWarning && (
          <div
            className="flex items-center justify-center gap-2 px-4 py-1.5 text-[11px] font-semibold flex-shrink-0"
            style={{
              background: isUrgentWarning ? 'rgba(244,63,94,0.12)' : 'rgba(255,187,0,0.10)',
              color: isUrgentWarning ? 'var(--bear)' : '#FFBB00',
              borderBottom: `1px solid ${isUrgentWarning ? 'rgba(244,63,94,0.2)' : 'rgba(255,187,0,0.2)'}`,
            }}
          >
            {isUrgentWarning ? <AlertTriangle size={12} /> : <Clock size={12} />}
            <span>{sessionWarning}</span>
            <button
              onClick={handleLogout}
              className="underline font-bold mr-2 hover:opacity-80"
            >
              تسجيل الخروج
            </button>
          </div>
        )}

        {/* Header bar */}
        <header
          className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-6 h-14 border-b flex-shrink-0"
          style={{
            background: 'rgba(5,8,16,0.88)',
            backdropFilter: 'blur(16px)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" style={{ color: 'var(--text2)' }}>
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[260px] sm:w-[280px] p-0" style={{ background: 'var(--bg2)', borderColor: 'var(--border)', direction: 'rtl' }}>
                <SheetTitle className="sr-only">القائمة</SheetTitle>
                <div className="flex items-center justify-between px-5 py-5">
                  <Logo size={24} />
                  <span className="text-[11px] px-2 py-1 rounded-full font-semibold" style={{ background: 'var(--cyan2)', color: 'var(--cyan)' }}>
                    ADMIN
                  </span>
                </div>
                <Separator style={{ background: 'var(--border)' }} />
                <ScrollArea className="flex-1">
                  <SidebarNav pathname={pathname} onNavigate={() => setMobileOpen(false)} />
                </ScrollArea>
                <Separator style={{ background: 'var(--border)' }} />
                <div className="p-3 space-y-1">
                  <Link href="/"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-[12px] font-medium transition-all hover:bg-[var(--bg4)]"
                    style={{ color: 'var(--text3)' }}>
                    <ExternalLink size={15} />
                    <span>عرض الموقع</span>
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setMobileOpen(false); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-[12px] font-semibold transition-all hover:bg-[rgba(244,63,94,0.06)]"
                    style={{ color: 'var(--bear)' }}
                  >
                    <LogOut size={15} />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Mobile logo */}
            <div className="flex items-center gap-2 lg:hidden">
              <Logo size={22} />
            </div>

            {/* Page title on desktop */}
            <div className="hidden lg:flex items-center gap-2">
              <h2 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>
                {pageTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="transition-all"
              style={{ color: 'var(--text2)' }}
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            </Button>

            {/* Home link */}
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-[11px] hidden lg:flex" style={{ color: 'var(--text3)' }}>
                الرئيسية
              </Button>
            </Link>

            {/* Logout desktop */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-[11px] hidden lg:flex gap-1"
              style={{ color: 'var(--bear)' }}
            >
              <LogOut size={13} />
              خروج
            </Button>
          </div>
        </header>

        {/* Page content — scrollable area with max-width constraint */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="w-full max-w-[1400px] xl:max-w-[1600px] mx-auto p-4 sm:p-5 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

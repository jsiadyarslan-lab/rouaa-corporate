'use client';

import { usePathname } from 'next/navigation';

const tabs = [
  {
    id: 'home',
    label: 'Inicio',
    href: '/es',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9,22 9,12 15,12 15,22"/>
      </svg>
    ),
  },
  {
    id: 'news',
    label: 'Noticias',
    href: '/es/news',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
        <path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>
      </svg>
    ),
  },
  {
    id: 'advisor',
    label: 'Asesor IA',
    href: '/es/analysis',
    isGold: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    id: 'signals',
    label: 'Señales',
    href: '/es/signals',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
  },
  {
    id: 'markets',
    label: 'Mercados',
    href: '/es/markets',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
      </svg>
    ),
  },
];

export default function EsMobileBottomTab() {
  const pathname = usePathname();

  const getActiveTab = () => {
    if (pathname === '/es' || pathname === '/es/') return 'home';
    for (const tab of tabs) {
      const tabPath = tab.href.split('#')[0];
      if (pathname.startsWith(tabPath) && tabPath !== '/es' && tabPath !== '/es/') return tab.id;
    }
    return 'home';
  };

  const activeTab = getActiveTab();

  return (
    <nav dir="ltr" className="md:hidden fixed bottom-0 left-0 right-0 z-[999]"
      style={{
        background: 'color-mix(in srgb, var(--bg3) 97%, transparent)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
      {/* Accent line */}
      <div className="h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), rgba(0,229,255,0.3), rgba(139,92,246,0.3), transparent)' }} />

      <div className="flex items-center justify-around h-[58px] px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isGold = 'isGold' in tab && tab.isGold;
          return (
            <a key={tab.id} href={tab.href}
              className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 rounded-xl transition-all duration-200 relative min-w-[52px]"
              style={{
                color: isActive ? (isGold ? 'var(--gold)' : 'var(--cyan)') : 'var(--text3)',
                background: isActive ? (isGold ? 'rgba(212,175,55,0.08)' : 'rgba(0,229,255,0.06)') : 'transparent',
              }}>
              {isActive && (
                <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full"
                  style={{ background: isGold ? 'var(--gold)' : 'var(--cyan)' }} />
              )}
              <span className="transition-transform duration-200" style={{ transform: isActive ? 'scale(1.1)' : 'scale(1)' }}>
                {tab.icon}
              </span>
              <span className="text-[9px] font-semibold">{tab.label}</span>
              {isGold && (
                <span className="absolute -top-0.5 right-0 text-[7px] px-1 py-0 rounded-full font-bold"
                  style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--gold)', border: '1px solid rgba(212,175,55,0.3)' }}>
                  AI
                </span>
              )}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

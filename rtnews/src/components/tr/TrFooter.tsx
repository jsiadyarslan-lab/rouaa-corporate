'use client';

import { useState, useEffect, useCallback } from 'react';

const socialIcons = [
  {
    name: 'X',
    href: 'https://x.com/RouaNews',
    color: '#E8EDF5',
    hoverColor: '#00E5FF',
    bgColor: 'rgba(232,237,245,0.1)',
    hoverBgColor: 'rgba(0,229,255,0.15)',
    svg: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com/company/roua-news',
    color: '#3BA7F0',
    hoverColor: '#5BB8F5',
    bgColor: 'rgba(59,167,240,0.1)',
    hoverBgColor: 'rgba(59,167,240,0.2)',
    svg: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
      </svg>
    ),
  },
  {
    name: 'Telegram',
    href: 'https://t.me/Rouatradingnews_bot',
    color: '#229ED9',
    hoverColor: '#4DB8E8',
    bgColor: 'rgba(34,158,217,0.1)',
    hoverBgColor: 'rgba(34,158,217,0.2)',
    svg: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    href: 'https://youtube.com/@RouaNews',
    color: '#FF4444',
    hoverColor: '#FF6666',
    bgColor: 'rgba(255,68,68,0.1)',
    hoverBgColor: 'rgba(255,68,68,0.2)',
    svg: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

export default function TrFooter() {
  const [email, setEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [newsletterMsg, setNewsletterMsg] = useState('');
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState<Date | null>(null);

  const tick = useCallback(() => {
    setTime(new Date());
  }, []);

  useEffect(() => {
    setMounted(true);
    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, [tick]);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNewsletterStatus('error');
      setNewsletterMsg('Lütfen geçerli bir e-posta adresi girin');
      return;
    }

    setNewsletterStatus('loading');
    setNewsletterMsg('');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setNewsletterStatus('success');
        setNewsletterMsg(data.message || 'Kayıt başarılı!');
        setEmail('');
      } else {
        setNewsletterStatus('error');
        setNewsletterMsg(data.error || 'Kayıt sırasında bir hata oluştu');
      }
    } catch {
      setNewsletterStatus('error');
      setNewsletterMsg('Sunucuya bağlanılamıyor');
    }
  };

  const worldClocks = [
    { city: 'New York', timezone: 'America/New_York' },
    { city: 'Londra', timezone: 'Europe/London' },
    { city: 'Tokyo', timezone: 'Asia/Tokyo' },
    { city: 'Sydney', timezone: 'Australia/Sydney' },
    { city: 'Hong Kong', timezone: 'Asia/Hong_Kong' },
    { city: 'Zurich', timezone: 'Europe/Zurich' },
  ];

  const links = {
    Platform: [
      { label: 'Ana Sayfa', href: '/tr' },
      { label: 'Haberler', href: '/tr/news' },
      { label: 'Piyasalar', href: '/tr/markets' },
      { label: 'Takvim', href: '/tr/calendar' },
      { label: 'Telegram', href: '/tr/telegram' },
      { label: 'Uyarılar', href: '/tr/alerts' },
      { label: 'Favoriler', href: '/tr/bookmarks' },
      { label: 'Topluluk', href: '/tr/community' },
    ],
    Şirket: [
      { label: 'Hakkımızda', href: '/tr/about' },
      { label: 'Ekip', href: '/tr/about#team' },
      { label: 'İletişim', href: '/tr/contact' },
    ],
    Geliştiriciler: [
      { label: 'API Belgeleri', href: '/docs/api' },
      { label: 'Hizmet Durumu', href: '/api/health' },
    ],
    Yasal: [
      { label: 'Koşullar', href: '/tr/terms' },
      { label: 'Gizlilik', href: '/tr/privacy' },
      { label: 'Uyarı', href: '/tr/disclaimer' },
    ],
  };

  return (
    <footer dir="ltr" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg2)', position: 'relative' }}>
      {/* Gradient accent line at top */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,229,255,.2), rgba(139,92,246,.3), rgba(0,229,255,.2), transparent)' }} />
      <div className="max-w-[1400px] mx-auto px-4 py-8 md:py-12" style={{ margin: '0 auto', padding: '40px clamp(16px, 3vw, 32px) 22px' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-8">
          {/* Brand + Newsletter */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[24px] font-bold font-heading" style={{ background: 'var(--plasma)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Rouaa</span>
              <span className="live-dot" />
            </div>
            <p className="text-[13px] mb-5 max-w-sm" style={{ color: 'var(--text2)', lineHeight: '1.8' }}>
              Yapay zeka destekli küresel finans haberleri platformu. Canlı haberler, yapay zeka analizleri, piyasa verileri ve trading sinyalleri — tek bir yerde.
            </p>

            {/* Newsletter */}
            <div className="mb-4">
              <div className="text-[12px] font-medium mb-2" style={{ color: 'var(--text)' }}>Bültenimize abone olun</div>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (newsletterStatus !== 'idle') setNewsletterStatus('idle'); }}
                  placeholder="E-posta adresiniz"
                  disabled={newsletterStatus === 'loading'}
                  className="flex-1 rounded-xl px-3 py-2 text-[12px] outline-none"
                  style={{ background: 'var(--bg4)', border: newsletterStatus === 'error' ? '1px solid var(--bear)' : '1px solid var(--border)', color: 'var(--text)' }} />
                <button type="submit" disabled={newsletterStatus === 'loading'}
                  className="px-4 py-2 rounded-xl text-[12px] font-bold transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'var(--cyan)', color: '#050810' }}>
                  {newsletterStatus === 'loading' ? 'Kaydediliyor...' : 'Abone Ol'}
                </button>
              </form>
              {newsletterMsg && (
                <p className="text-[11px] mt-1.5" style={{ color: newsletterStatus === 'error' ? 'var(--bear)' : newsletterStatus === 'success' ? 'var(--bull)' : 'var(--text2)' }}>
                  {newsletterMsg}
                </p>
              )}
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-2">
              {socialIcons.map((icon, i) => (
                <a key={i} href={icon.href} target="_blank" rel="noopener noreferrer"
                  className="w-11 h-11 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:scale-105"
                  style={{ background: icon.bgColor, border: `1px solid ${icon.color}30`, color: icon.color }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = icon.hoverBgColor; e.currentTarget.style.borderColor = `${icon.color}60`; e.currentTarget.style.color = icon.hoverColor; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = icon.bgColor; e.currentTarget.style.borderColor = `${icon.color}30`; e.currentTarget.style.color = icon.color; }}
                  aria-label={icon.name}>
                  {icon.svg}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="text-[13px] font-bold mb-3" style={{ color: 'var(--text)' }}>{title}</h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className="text-[12px] transition-colors hover:text-[var(--cyan)]" style={{ color: 'var(--text2)' }}>{item.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* World Clock */}
        <div className="pt-6 mb-6" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
            </svg>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--text2)' }}>Dünya Saatleri</span>
          </div>
          <div className="flex flex-wrap gap-4">
            {worldClocks.map((clock) => {
              const clockTime = (mounted && time) ? time.toLocaleTimeString('tr-TR', {
                timeZone: clock.timezone, hour: '2-digit', minute: '2-digit', hour12: false,
              }) : '--:--';
              return (
                <div key={clock.city} className="flex items-center gap-1.5 text-[12px]">
                  <span style={{ color: 'var(--text3)' }}>{clock.city}</span>
                  <span className="font-mono-price font-medium" style={{ color: 'var(--cyan)' }} suppressHydrationWarning>{clockTime}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="pt-6" style={{ borderTop: '1px solid var(--border)' }}>
          {/* Risk Warning Badge */}
          <div className="flex items-center gap-2 mb-3 p-3 rounded-xl" style={{ background: 'var(--bear2)', border: '1px solid rgba(255,77,106,.15)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bear)" strokeWidth="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span className="text-[10px]" style={{ color: 'var(--bear)' }}>Risk Uyarısı</span>
          </div>
          <p className="text-[10px] leading-relaxed mb-2" style={{ color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace", lineHeight: '1.65' }}>
            Finansal piyasalarda trading yüksek risk taşır ve tüm yatırımcılar için uygun olmayabilir. Bu platformda sunulan bilgiler yalnızca eğitim ve bilgilendirme amaçlıdır ve yatırım tavsiyesi niteliğinde değildir. Geçmiş performans gelecek sonuçları garanti etmez.
          </p>
          <p className="text-[10px]" style={{ color: 'var(--text4)', fontFamily: "'JetBrains Mono', monospace" }}>
            &copy; <span suppressHydrationWarning>{new Date().getFullYear()}</span> Rouaa. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
}

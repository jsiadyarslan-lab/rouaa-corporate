'use client';

export default function TrBlogPage() {
  return (
    <main className="min-h-screen pb-16" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[860px] mx-auto px-4 py-20">
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'var(--cyan2)', border: '1px solid rgba(0,229,255,0.2)' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2">
              <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
              <path d="M18 14h-8" />
              <path d="M15 18h-5" />
              <path d="M10 6h8v4h-8V6Z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold font-heading mb-4 gradient-text">Blog</h1>
          <p className="text-base mb-8" style={{ color: 'var(--text2)' }}>
            Yakında — Finansal piyasaların uzmanlarından özel içerikler hazırlıyoruz
          </p>
          <div
            className="glass-card p-6 max-w-md mx-auto"
            style={{ borderColor: 'rgba(0,229,255,0.15)' }}
          >
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text2)' }}>
              Yakında: Derinlemesine analitik makaleler, haftalık piyasa değerlendirmeleri, trading
              eğitimleri ve bölgesel finans uzmanlarıyla özel röportajlar.
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="live-dot" />
              <span className="text-xs font-semibold" style={{ color: 'var(--bull)' }}>
                Yakında
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Arşiv',
  description: 'Geçmiş haberlerin, raporların ve analizlerin arşivi',
};

export default function TrArchivePage() {
  return (
    <main className="min-h-screen pb-16" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[860px] mx-auto px-4 py-20">
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2">
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold font-heading mb-4 gradient-text">Arşiv</h1>
          <p className="text-base mb-8" style={{ color: 'var(--text2)' }}>
            Geçmiş haberlerin, raporların ve analizlerin arşivi
          </p>
          <div className="glass-card p-6 max-w-md mx-auto" style={{ borderColor: 'rgba(0,229,255,0.15)' }}>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text2)' }}>
              Arşiv özelliği yakında kullanıma sunulacaktır. Geçmiş içeriklere erişim için arama sayfamızı kullanabilirsiniz.
            </p>
            <Link
              href="/tr/search"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold"
              style={{ background: 'var(--cyan)', color: '#000' }}
            >
              Arama Sayfasına Git
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

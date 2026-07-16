'use client';

export default function TrCareersPage() {
  return (
    <main className="min-h-screen pb-16" style={{ background: 'var(--bg)' }} dir="ltr">
      <div className="max-w-[860px] mx-auto px-4 py-20">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--purple2)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold font-heading mb-4 gradient-text">Kariyer</h1>
          <p className="text-base mb-8" style={{ color: 'var(--text2)' }}>Rouaa ekibine katılın ve finansal medyanın geleceğini şekillendirmeye katkıda bulunun</p>
          <div className="glass-card p-6 max-w-md mx-auto" style={{ borderColor: 'rgba(139,92,246,0.15)' }}>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text2)' }}>
              Şu anda açık pozisyon bulunmamaktadır, ancak yapay zeka, finansal analiz, yazılım geliştirme ve tasarım alanlarında olağanüstü yetenekleri her zaman arıyoruz.
            </p>
            <p className="text-sm" style={{ color: 'var(--text3)' }}>
              Özgeçmişinizi <span style={{ color: 'var(--cyan)' }}>careers@rouaa.news</span> adresine gönderin
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

'use client';

export default function FrCareersPage() {
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
          <h1 className="text-3xl font-bold font-heading mb-4 gradient-text">Carrières</h1>
          <p className="text-base mb-8" style={{ color: 'var(--text2)' }}>Rejoignez l&apos;équipe Rouaa et contribuez à façonner l&apos;avenir des médias financiers</p>
          <div className="glass-card p-6 max-w-md mx-auto" style={{ borderColor: 'rgba(139,92,246,0.15)' }}>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text2)' }}>
              Il n&apos;y a pas de postes ouverts pour le moment, mais nous sommes toujours à la recherche de talents exceptionnels en IA, analyse financière, développement logiciel et design.
            </p>
            <p className="text-sm" style={{ color: 'var(--text3)' }}>
              Envoyez votre CV à <span style={{ color: 'var(--cyan)' }}>careers@rouaa.news</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

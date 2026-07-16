'use client';


export default function CareersPage() {
  return (
    <main className="min-h-screen pb-16" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[860px] mx-auto px-4 py-20">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--purple2)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold font-heading mb-4 gradient-text">وظائف</h1>
          <p className="text-base mb-8" style={{ color: 'var(--text2)' }}>انضم إلى فريق رؤى وساهم في بناء مستقبل الإعلام المالي العربي</p>
          <div className="glass-card p-6 max-w-md mx-auto" style={{ borderColor: 'rgba(139,92,246,0.15)' }}>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text2)' }}>
              لا توجد وظائف متاحة حالياً، لكننا نبحث دائماً عن مواهب استثنائية في مجالات الذكاء الاصطناعي والتحليل المالي والتطوير البرمجي والتصميم.
            </p>
            <p className="text-sm" style={{ color: 'var(--text3)' }}>
              أرسل سيرتك الذاتية إلى <span style={{ color: 'var(--cyan)' }}>careers@rouaa.news</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

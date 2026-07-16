'use client';


const values = [
  {
    title: 'الدقة',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    desc: 'نلتزم بأعلى معايير الدقة في نقل الأخبار والتحليلات المالية، مع التحقق من كل معلومة قبل نشرها عبر نظام مراجعة متعدد المراحل.',
    color: 'var(--bull)',
    bg: 'var(--bull2)',
  },
  {
    title: 'السرعة',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    desc: 'نوصل الأخبار المالية في الوقت الفعلي بفضل تقنيات الرصد الآلي، لنبقيك دائماً سبّاقاً في اتخاذ قراراتك الاستثمارية.',
    color: 'var(--cyan)',
    bg: 'var(--cyan2)',
  },
  {
    title: 'الذكاء الاصطناعي',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
        <path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z" />
        <circle cx="12" cy="6" r="1" fill="currentColor" />
      </svg>
    ),
    desc: 'نوظّف أحدث نماذج الذكاء الاصطناعي لتحليل المشاعر السوقية وتوليد رؤى استثمارية ذكية لا تتوفر في أي منصة عربية أخرى.',
    color: 'var(--purple)',
    bg: 'var(--purple2)',
  },
  {
    title: 'إمكانية الوصول',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    desc: 'نجعل المعلومات المالية العالمية متاحة بالعربية للجميع، من المتداول المبتدئ إلى المحترف، بواجهة سهلة ومتجاوبة.',
    color: 'var(--gold)',
    bg: 'var(--gold2)',
  },
];

const techItems = [
  {
    title: 'نماذج AI متعددة',
    desc: 'نستخدم مزيجاً من أقوى مزوّدي الذكاء الاصطناعي عالمياً لضمان دقة التحليل وشمولية التغطية.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" />
      </svg>
    ),
  },
  {
    title: 'رصد RSS لحظي',
    desc: 'نرصد مئات مصادر الأخبار المالية عالمياً في الوقت الفعلي عبر خلاصات RSS المتقدمة.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 11a9 9 0 0 1 9 9" /><path d="M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1" />
      </svg>
    ),
  },
  {
    title: 'ترجمة ذكية تلقائية',
    desc: 'نترجم الأخبار والمحتوى المالي من عشرات اللغات إلى العربية بجودة احترافية فورية.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" />
      </svg>
    ),
  },
  {
    title: 'تحليل المشاعر',
    desc: 'نحلل مشاعر السوق والاتجاهات الاستثمارية باستخدام خوارزميات متقدمة لمعالجة اللغة الطبيعية.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen pb-16" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[860px] mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="badge-ai">مُدمج بالذكاء الاصطناعي</span>
            <span className="badge-live">مباشر</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4 gradient-text">
            رؤى
          </h1>
          <p className="text-lg md:text-xl leading-relaxed" style={{ color: 'var(--text2)' }}>
            منصة الأخبار المالية العربية الأولى المدعومة بالذكاء الاصطناعي
          </p>
          <div className="mt-6 h-[2px] w-24 mx-auto rounded-full" style={{ background: 'linear-gradient(90deg, var(--cyan), var(--purple))' }} />
        </div>

        {/* Our Vision */}
        <section className="section-block">
          <h2 className="sh-title mb-6">رؤيتنا</h2>
          <div className="glass-card p-6">
            <p className="text-[15px] leading-[1.9] mb-4" style={{ color: 'var(--text2)' }}>
              نسعى لأن نكون المنصة العربية الأولى عالمياً في مجال الأخبار والتحليلات المالية المدعومة بالذكاء الاصطناعي. نؤمن بأن المتداول العربي يستحق الوصول إلى نفس جودة المعلومات والتحليلات المتاحة للمتداولين في الأسواق العالمية، دون حواجز لغوية أو تقنية.
            </p>
            <p className="text-[15px] leading-[1.9]" style={{ color: 'var(--text2)' }}>
              رؤيتنا هي سدّ الفجوة بين الأخبار المالية العالمية والمتداولين الناطقين بالعربية، من خلال تقنيات ذكاء اصطناعي متقدمة تترجم وتحلل وتلخص آلاف الأخبار والمؤشرات كل ساعة، لتقدم لك رؤى قابلة للتنفيذ في اللحظة المناسبة.
            </p>
          </div>
        </section>

        {/* Our Values */}
        <section className="section-block">
          <h2 className="sh-title mb-6">قيمنا</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {values.map((v) => (
              <div key={v.title} className="glass-card p-5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: v.bg, color: v.color }}>
                    {v.icon}
                  </div>
                  <h3 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>{v.title}</h3>
                </div>
                <p className="text-[13px] leading-[1.8]" style={{ color: 'var(--text2)' }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Our Technology */}
        <section className="section-block">
          <h2 className="sh-title mb-6">تقنياتنا</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {techItems.map((t) => (
              <div key={t.title} className="glass-card p-5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--cyan2)', color: 'var(--cyan)' }}>
                  {t.icon}
                </div>
                <div>
                  <h3 className="text-[14px] font-bold mb-1" style={{ color: 'var(--text)' }}>{t.title}</h3>
                  <p className="text-[12px] leading-[1.7]" style={{ color: 'var(--text2)' }}>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Our Team */}
        <section className="section-block" id="team">
          <h2 className="sh-title mb-6">فريقنا</h2>
          <div className="glass-card p-6 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--cyan2), var(--purple2))', border: '1px solid var(--border)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="text-[16px] font-bold mb-3" style={{ color: 'var(--text)' }}>فريق من خبراء المال والذكاء الاصطناعي</h3>
            <p className="text-[14px] leading-[1.9]" style={{ color: 'var(--text2)' }}>
              بُنيت رؤى بأيدي فريق متنوع من خبراء الأسواق المالية ومهندسي الذكاء الاصطناعي واللغويين من العالم العربي. يجمع فريقنا بين عقود من الخبرة في التداول والتحليل المالي وبين أحدث المعارف التقنية في مجال معالجة اللغة الطبيعية وتعلم الآلة.
            </p>
            <p className="text-[14px] leading-[1.9] mt-3" style={{ color: 'var(--text2)' }}>
              نحن نفهم احتياجات المتداول العربي لأننا جزء من هذا المجتمع، ونعمل باستمرار على تطوير المنصة لتلبي تطلعاتكم وتساعدكم في اتخاذ قرارات مالية أفضل وأكثر وعياً.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

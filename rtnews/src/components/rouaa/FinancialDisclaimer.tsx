export default function FinancialDisclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="text-[10px] leading-relaxed" style={{ color: 'var(--text3)' }} dir="rtl">
        ⚠️ المحتوى المالي المعروض لا يُعد توصية استثمارية. استشر مختصاً مالياً مرخصاً قبل اتخاذ أي قرار مالي.
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl" style={{ background: 'rgba(232,160,32,0.06)', border: '1px solid rgba(232,160,32,0.15)' }} dir="rtl">
      <div className="flex items-center gap-2 mb-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span className="text-[12px] font-bold" style={{ color: 'var(--gold)' }}>إخلاء مسؤولية مالية</span>
      </div>
      <div className="text-[11px] leading-relaxed space-y-1.5" style={{ color: 'var(--text2)' }}>
        <p>جميع المعلومات والتحليلات المقدمة على منصة رؤى هي لأغراض إعلامية وتعليمية فقط ولا تُعد نصيحة مالية أو استثمارية أو توصية بالتداول.</p>
        <p>الأداء السابق للأسواق المالية لا يضمن النتائج المستقبلية. تداول الأدوات المالية ينطوي على مخاطر عالية وقد تخسر رأس مالك بالكامل.</p>
        <p>يجب عليك إجراء بحثك الخاص واستشارة مستشار مالي مرخص قبل اتخاذ أي قرار استثماري. منصة رؤى غير مسؤولة عن أي خسائر مالية ناتجة عن استخدام المعلومات المنشورة.</p>
      </div>
    </div>
  );
}

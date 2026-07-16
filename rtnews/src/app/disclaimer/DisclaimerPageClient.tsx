'use client';


export default function DisclaimerPage() {
  return (
    <main className="min-h-screen pb-16" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[860px] mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--bear2)', border: '1px solid rgba(255,77,106,0.2)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--bear)" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h1 className="text-2xl font-bold font-heading" style={{ color: 'var(--text)' }}>إخلاء المسؤولية</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text3)' }}>آخر تحديث: أبريل 2026</p>
        </div>

        {/* Risk Warning Banner */}
        <div className="glass-card p-5 mb-8" style={{ borderColor: 'rgba(255,77,106,0.2)', background: 'var(--bear2)' }}>
          <div className="flex items-center gap-3 mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--bear)" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span className="text-lg font-bold" style={{ color: 'var(--bear)' }}>تحذير المخاطر المالية</span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
            التداول في الأسواق المالية ينطوي على مخاطر عالية وقد يؤدي إلى خسارة رأس المال بالكامل. لا تتداول بأموال لا تستطيع تحمل خسارتها. المعلومات المقدمة على منصة رؤى هي لأغراض تعليمية ومعلوماتية فقط ولا تعتبر نصيحة استثمارية بأي شكل من الأشكال.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {/* Not Investment Advice */}
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <span style={{ width: '3px', height: '18px', borderRadius: '2px', background: 'linear-gradient(180deg, var(--cyan), var(--purple))' }} />
              ليس نصيحة استثمارية
            </h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
              <p>جميع المعلومات والتحليلات والمحتوى المنشور على منصة رؤى، بما في ذلك على سبيل المثال لا الحصر: الأخبار المالية، تحليلات الأسواق، مؤشرات المشاعر السوقية، التوصيات الذكية، ومخرجات الذكاء الاصطناعي، هي لأغراض تعليمية ومعلوماتية حصراً. لا يُعد أي محتوى على هذه المنصة نصيحة استثمارية أو توصية بالبيع أو الشراء أو الاحتفاظ بأي أداة مالية.</p>
              <p>لا تقدم رؤى خدمات استشارات مالية مرخصة، ولا تعمل كمستشار مالي أو وسط مالي مسجل. يجب على المستخدمين عدم اتخاذ قرارات استثمارية بناءً على المحتوى المقدم دون استشارة مستشار مالي محترف مرخص. رؤى ليست مسؤولة عن أي قرارات استثمارية يتخذها المستخدم بناءً على المعلومات المتاحة على المنصة.</p>
            </div>
          </section>

          {/* AI Limitations */}
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <span style={{ width: '3px', height: '18px', borderRadius: '2px', background: 'linear-gradient(180deg, var(--cyan), var(--purple))' }} />
              حدود الذكاء الاصطناعي
            </h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
              <p>تعتمد منصة رؤى على نماذج ذكاء اصطناعي لتوليد التحليلات والترجمات والمحتوى. هذه النماذج قد تحتوي على أخطاء أو معلومات غير دقيقة أو غير مكتملة. الذكاء الاصطناعي لا يستطيع التنبؤ بالأسواق المالية بدقة كاملة، وأي تحليلات أو توقعات مبنية عليه هي تقديرات احتمالية وليست ضمانات.</p>
              <p>الترجمات الآلية قد لا تعكس المعنى الدقيق للنصوص المالية الأصلية. التحليلات المشاعرية تعتمد على خوارزميات آلية قد لا تلتقط الفروق الدقيقة في السياق المالي. نوصي دائماً بالرجوع إلى المصادر الأصلية والتحقق من المعلومات قبل اتخاذ أي قرارات مالية مهمة.</p>
            </div>
          </section>

          {/* Past Performance */}
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <span style={{ width: '3px', height: '18px', borderRadius: '2px', background: 'linear-gradient(180deg, var(--cyan), var(--purple))' }} />
              الأداء السابق
            </h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
              <p>الأداء السابق لأي أداة مالية أو استراتيجية تداول لا يُعد ضماناً للنتائج المستقبلية. الأسواق المالية تتأثر بعوامل متعددة ومتغيرة تشمل الأحداث الجيوسياسية والسياسات النقدية والبيانات الاقتصادية والمشاعر السوقية، مما يجعل التنبؤ بالنتائج المستقبلية أمراً غير مؤكد بطبيعته.</p>
              <p>أي إشارات إلى أداء سابق على المنصة هي لأغراض توضيحية فقط ولا ينبغي تفسيرها كمؤشر على الأداء المستقبلي. الخسائر المحتملة قد تتجاوز الاستثمار الأصلي، خاصة في التداول بالهامش أو المشتقات المالية.</p>
            </div>
          </section>

          {/* Seek Professional Advice */}
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <span style={{ width: '3px', height: '18px', borderRadius: '2px', background: 'linear-gradient(180deg, var(--cyan), var(--purple))' }} />
              طلب المشورة المهنية
            </h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
              <p>ننصح بشدة جميع المستخدمين باستشارة مستشار مالي محترف مرخص قبل اتخاذ أي قرارات استثمارية. كل مستثمر يجب أن يقيّم قدرته المالية وتحمله للمخاطر وظروفه الضريبية قبل الدخول في أي عملية تداول. ما يناسب مستثمراً قد لا يناسب آخر.</p>
              <p>إذا كنت غير متأكد من أي جانب من جوانب التداول أو الاستثمار، فلا تتخذ أي إجراء حتى تحصل على مشورة مهنية مؤهلة. تذكر أن حماية رأس المال هي الأولوية القصوى في أي استراتيجية استثمارية ناجحة.</p>
            </div>
          </section>

          {/* Personal Responsibility */}
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <span style={{ width: '3px', height: '18px', borderRadius: '2px', background: 'linear-gradient(180deg, var(--cyan), var(--purple))' }} />
              المسؤولية الشخصية
            </h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
              <p>أنت المسؤول الوحيد عن قراراتك الاستثمارية ونتائج تداولاتك. باستخدامك لمنصة رؤى، فإنك تقر بأنك تفهم المخاطر المرتبطة بالتداول في الأسواق المالية وتوافق على تحمل المسؤولية الكاملة عن أفعالك. رؤى ومنظمتها لا يتحملون أي مسؤولية عن الخسائر المباشرة أو غير المباشرة الناتجة عن استخدام المنصة أو الاعتماد على المحتوى المقدم فيها.</p>
              <p>يجب عليك إجراء بحثك الخاص والتحقق من جميع المعلومات قبل اتخاذ أي قرار استثماري. لا تعتمد بشكل حصري على أي مصدر واحد للمعلومات، بما في ذلك منصة رؤى. التنويع في مصادر المعلومات والاستشارات المهنية هو أساس القرارات الاستثمارية الرشيدة.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

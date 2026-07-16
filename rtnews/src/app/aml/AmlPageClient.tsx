'use client';


export default function AmlPage() {
  return (
    <main className="min-h-screen pb-16" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[860px] mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--purple2)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h1 className="text-2xl font-bold font-heading" style={{ color: 'var(--text)' }}>سياسة مكافحة غسل الأموال</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text3)' }}>آخر تحديث: أبريل 2026</p>
        </div>

        <div className="space-y-8">
          {/* Regulatory Compliance */}
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <span style={{ width: '3px', height: '18px', borderRadius: '2px', background: 'linear-gradient(180deg, var(--cyan), var(--purple))' }} />
              الالتزام التنظيمي
            </h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
              <p>تلتزم منصة رؤى بجميع القوانين والأنظمة المعمول بها المتعلقة بمكافحة غسل الأموال وتمويل الإرهاب، بما في ذلك على سبيل المثال لا الحصر: اتفاقية فيينا لمكافحة الاتجار غير المشروع في المخدرات، اتفاقية بال لمكافحة تمويل الإرهاب، وتوصيات فريق العمل المالي (FATF). تعمل المنصة على ضمان عدم استخدام خدماتها لأي أغراض غير مشروعة.</p>
              <p>تحافظ رؤى على سياسات وإجراءات صارمة لمكافحة غسل الأموال تتوافق مع أفضل الممارسات الدولية والمعايير التنظيمية المحلية في الولايات العربية والدول التي تقدم فيها خدماتها. يتم مراجعة هذه السياسات وتحديثها بشكل دوري لضمان التوافق مع التطورات التشريعية والتنظيمية.</p>
            </div>
          </section>

          {/* KYC */}
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <span style={{ width: '3px', height: '18px', borderRadius: '2px', background: 'linear-gradient(180deg, var(--cyan), var(--purple))' }} />
              اعرف عميلك (KYC)
            </h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
              <p>تطبق رؤى إجراءات "اعرف عميلك" (Know Your Customer) لضمان هوية المستخدمين والتحقق من مصدر أموالهم. قد نطلب من المستخدمين تقديم مستندات هوية رسمية وإثبات العنوان ومعلومات إضافية حسب الحاجة. يُعتبر رفض تقديم المعلومات المطلوبة سبباً كافياً لتعليق أو إنهاء الحساب.</p>
              <p>تشمل إجراءات التحقق: التحقق من الهوية باستخدام وثائق رسمية صادرة عن جهات حكومية معتمدة، التحقق من عنوان الإقامة عبر فواتير الخدمات أو كشوف الحسابات البنكية، فحص قوائم العقوبات الدولية والمحلية، وتقييم مخاطر كل عميل بناءً على نشاطه وموقعه الجغرافي وطبيعة تعاملاته.</p>
            </div>
          </section>

          {/* Reporting Suspicious Activities */}
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <span style={{ width: '3px', height: '18px', borderRadius: '2px', background: 'linear-gradient(180deg, var(--cyan), var(--purple))' }} />
              الإبلاغ عن الأنشطة المشبوهة
            </h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
              <p>تلتزم رؤى بالإبلاغ عن أي أنشطة مشبوهة تتعلق بغسل الأموال أو تمويل الإرهاب إلى الجهات المختصة. يتم تدريب فريق العمل على اكتشاف مؤشرات الأنشطة المشبوهة والإبلاغ عنها فوراً وفق الإجراءات المعتمدة. تشمل مؤشرات الاشتباه: المعاملات غير المعتادة من حيث الحجم أو النمط، رفض العميل تقديم المعلومات المطلوبة، التعقيد غير المبرر في هيكلة المعاملات.</p>
              <p>إذا لاحظت أي نشاط مشبوه على المنصة، يُرجى الإبلاغ عنه فوراً عبر البريد الإلكتروني المخصص للامتثال. نضمن سرية البلاغات وحماية المبلغين من أي إجراءات انتقامية. جميع البلاغات يتم التعامل معها بسرية تامة وفقاً للقوانين المعمول بها.</p>
            </div>
          </section>

          {/* Prohibited Activities */}
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <span style={{ width: '3px', height: '18px', borderRadius: '2px', background: 'linear-gradient(180deg, var(--cyan), var(--purple))' }} />
              الأنشطة المحظورة
            </h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
              <p>يُحظر استخدام منصة رؤى لأي أغراض تتعلق بغسل الأموال أو تمويل الإرهاب أو أي أنشطة غير قانونية. يشمل ذلك على سبيل المثال لا الحصر: استخدام أموال مصدرها غير مشروع، إخفاء المصدر الحقيقي للأموال، تحويل أموال لحسابات وهمية أو مجهولة، استخدام المنصة للتهرب الضريبي أو التهرب من العقوبات الدولية.</p>
              <p>كما يُحظر استخدام المنصة من قبل أشخاص أو كيانات خاضعة لعقوبات من الأمم المتحدة أو الاتحاد الأوروبي أو الولايات المتحدة أو أي سلطة مختصة أخرى. في حالة اكتشاف أي نشطة محظورة، تحتفظ رؤى بالحق في تجميد الحساب وإبلاغ الجهات المختصة فوراً دون إشعار مسبق.</p>
            </div>
          </section>

          {/* Cooperation with Authorities */}
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <span style={{ width: '3px', height: '18px', borderRadius: '2px', background: 'linear-gradient(180deg, var(--cyan), var(--purple))' }} />
              التعاون مع السلطات
            </h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
              <p>تتعاون رؤى بشكل كامل مع الجهات التنظيمية وإنفاذ القانون في جميع الولايات التي تعمل فيها. يشمل ذلك الاستجابة لطلبات المعلومات القانونية وتقديم السجلات والتقارير المطلوبة ضمن الإطار القانوني المعمول به. نحتفظ بسجلات المعاملات والتحقق من الهوية لمدة لا تقل عن خمس سنوات وفقاً للمتطلبات التنظيمية.</p>
              <p>نلتزم بتقديم تقارير الأنشطة المشبوهة (SAR) إلى وحدة المعلومات المالية المختصة في الوقت المناسب. كما نشارك في برامج التدريب والوعي المتعلقة بمكافحة غسل الأموال ونبني شراكات مع المؤسسات المالية والجهات التنظيمية لتعزيز الجهود المشتركة في مكافحة الجرائم المالية.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

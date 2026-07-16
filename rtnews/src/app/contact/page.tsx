'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        setSubmitError(data.error || 'حدث خطأ أثناء إرسال الرسالة');
      }
    } catch {
      setSubmitError('تعذر الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen pb-16" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[860px] mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--cyan2)', border: '1px solid rgba(0,229,255,0.2)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h1 className="text-2xl font-bold font-heading" style={{ color: 'var(--text)' }}>اتصل بنا</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text2)' }}>نسعد بتواصلك معنا. فريقنا جاهز للإجابة على استفساراتك.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Email */}
          <div className="glass-card p-5 text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--cyan2)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </div>
            <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>البريد الإلكتروني</h3>
            <p className="text-xs" style={{ color: 'var(--cyan)' }}>support@rouaa.news</p>
          </div>

          {/* Support Hours */}
          <div className="glass-card p-5 text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--purple2)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>ساعات الدعم</h3>
            <p className="text-xs" style={{ color: 'var(--text2)' }}>الأحد - الخميس: 9ص - 6م</p>
            <p className="text-xs" style={{ color: 'var(--text3)' }}>(توقيت الرياض)</p>
          </div>

          {/* Social */}
          <div className="glass-card p-5 text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--gold2)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>وسائل التواصل</h3>
            <p className="text-xs" style={{ color: 'var(--cyan)' }}>@rouaa_news</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <span style={{ width: '3px', height: '18px', borderRadius: '2px', background: 'linear-gradient(180deg, var(--cyan), var(--purple))' }} />
            أرسل رسالة
          </h2>
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bull2)', border: '1px solid rgba(0,200,150,0.3)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--bull)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--bull)' }}>تم إرسال رسالتك بنجاح</h3>
              <p className="text-sm" style={{ color: 'var(--text2)' }}>سنرد عليك في أقرب وقت ممكن.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text2)' }}>الاسم</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-1"
                    style={{ background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text)' }} placeholder="اسمك الكريم" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text2)' }}>البريد الإلكتروني</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-1"
                    style={{ background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text)' }} placeholder="example@email.com" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text2)' }}>الموضوع</label>
                <input type="text" required value={formData.subject} onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-1"
                  style={{ background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text)' }} placeholder="موضوع الرسالة" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text2)' }}>الرسالة</label>
                <textarea required rows={5} value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-1 resize-none"
                  style={{ background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text)' }} placeholder="اكتب رسالتك هنا..." />
              </div>
              <button type="submit" disabled={isSubmitting} className="px-8 py-3 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--cyan), var(--purple))', color: 'white' }}>
                {isSubmitting ? 'جارٍ الإرسال...' : 'إرسال الرسالة'}
              </button>
              {submitError && (
                <p className="text-xs mt-2" style={{ color: 'var(--bear)' }}>{submitError}</p>
              )}
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

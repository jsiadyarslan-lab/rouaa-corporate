'use client';

import { useState } from 'react';

// ─── Frequency Labels ──────────────────────────────────────
const FREQUENCIES_AR = [
  { value: 'daily', label: 'يومي', icon: '📅' },
  { value: 'weekly', label: 'أسبوعي', icon: '📆' },
  { value: 'monthly', label: 'شهري', icon: '🗓️' },
  { value: 'breaking', label: 'عاجل', icon: '🔴' },
] as any;

const FREQUENCIES_EN = [
  { value: 'daily', label: 'Daily', icon: '📅' },
  { value: 'weekly', label: 'Weekly', icon: '📆' },
  { value: 'monthly', label: 'Monthly', icon: '🗓️' },
  { value: 'breaking', label: 'Breaking', icon: '🔴' },
] as any;

const FREQUENCIES_TR = [
  { value: 'daily', label: 'Günlük', icon: '📅' },
  { value: 'weekly', label: 'Haftalık', icon: '📆' },
  { value: 'monthly', label: 'Aylık', icon: '🗓️' },
  { value: 'breaking', label: 'Acil', icon: '🔴' },
] as any;

const FREQUENCIES_FR = [
  { value: 'daily', label: 'Quotidien', icon: '📅' },
  { value: 'weekly', label: 'Hebdomadaire', icon: '📆' },
  { value: 'monthly', label: 'Mensuel', icon: '🗓️' },
  { value: 'breaking', label: 'Urgent', icon: '🔴' },
] as any;

const FREQUENCIES_ES = [
  { value: 'daily', label: 'Diario', icon: '📅' },
  { value: 'weekly', label: 'Semanal', icon: '📆' },
  { value: 'monthly', label: 'Mensual', icon: '🗓️' },
  { value: 'breaking', label: 'Urgente', icon: '🔴' },
] as any;

// ─── Category Labels ──────────────────────────────────────
const CATEGORIES_AR = [
  'أسهم', 'سلع', 'فوركس', 'عملات رقمية', 'سندات',
  'طاقة', 'عقارات', 'تكنولوجيا', 'بنوك',
] as any;

const CATEGORIES_EN = [
  'Stocks', 'Commodities', 'Forex', 'Crypto', 'Bonds',
  'Energy', 'Real Estate', 'Technology', 'Banks',
] as any;

const CATEGORIES_TR = [
  'Hisseler', 'Emtialar', 'Forex', 'Kripto', 'Tahviller',
  'Enerji', 'Gayrimenkul', 'Teknoloji', 'Bankalar',
] as any;

const CATEGORIES_FR = [
  'Actions', 'Matières Premières', 'Forex', 'Crypto', 'Obligations',
  'Énergie', 'Immobilier', 'Technologie', 'Banques',
] as any;

const CATEGORIES_ES = [
  'Acciones', 'Materias Primas', 'Forex', 'Criptomonedas', 'Bonos',
  'Energía', 'Inmobiliario', 'Tecnología', 'Banca',
] as any;

// ─── Region Labels ──────────────────────────────────────
const REGIONS_AR = [
  'السعودية', 'الإمارات', 'مصر', 'الكويت', 'قطر', 'البحرين', 'عمان',
  'الخليج', 'العالم', 'أمريكا', 'أوروبا', 'آسيا',
] as any;

const REGIONS_EN = [
  'Saudi Arabia', 'UAE', 'Egypt', 'Kuwait', 'Qatar', 'Bahrain', 'Oman',
  'Gulf', 'Global', 'Americas', 'Europe', 'Asia',
] as any;

const REGIONS_TR = [
  'Suudi Arabistan', 'BAE', 'Mısır', 'Kuveyt', 'Katar', 'Bahreyn', 'Umman',
  'Körfez', 'Küresel', 'Amerika', 'Avrupa', 'Asya',
] as any;

const REGIONS_FR = [
  'Arabie Saoudite', 'EAU', 'Égypte', 'Koweït', 'Qatar', 'Bahreïn', 'Oman',
  'Golfe', 'Mondial', 'Amériques', 'Europe', 'Asie',
] as any;

const REGIONS_ES = [
  'Arabia Saudí', 'EAU', 'Egipto', 'Kuwait', 'Catar', 'Baréin', 'Omán',
  'Golfo', 'Global', 'Américas', 'Europa', 'Asia',
] as any;

// ─── Text Translations ──────────────────────────────────────
const TEXT = {
  ar: {
    emailLabel: 'البريد الإلكتروني *',
    nameLabel: 'الاسم (اختياري)',
    namePlaceholder: 'اسمك',
    frequencyLabel: 'تكرار النشرة',
    categoriesLabel: 'الفئات المفضلة',
    regionsLabel: 'المناطق المفضلة',
    submitButton: 'اشترك في النشرة البريدية',
    loadingText: 'جارٍ التسجيل...',
    successTitle: 'تم التسجيل بنجاح!',
    successMessage: 'يرجى التحقق من بريدك الإلكتروني لتأكيد الاشتراك',
    anotherSubscription: 'اشتراك آخر',
    disclaimer: 'لن نشارك بريدك الإلكتروني مع أي طرف ثالث. يمكنك إلغاء الاشتراك في أي وقت.',
    errorDefault: 'حدث خطأ أثناء الاشتراك',
    errorConnection: 'فشل الاتصال بالخادم، حاول مرة أخرى',
  },
  en: {
    emailLabel: 'Email *',
    nameLabel: 'Name (optional)',
    namePlaceholder: 'Your name',
    frequencyLabel: 'Newsletter Frequency',
    categoriesLabel: 'Favorite Categories',
    regionsLabel: 'Favorite Regions',
    submitButton: 'Subscribe to Newsletter',
    loadingText: 'Subscribing...',
    successTitle: 'Successfully Subscribed!',
    successMessage: 'Please check your email to confirm your subscription',
    anotherSubscription: 'Subscribe another',
    disclaimer: 'We won\'t share your email with any third party. You can unsubscribe at any time.',
    errorDefault: 'An error occurred during subscription',
    errorConnection: 'Connection failed, please try again',
  },
  tr: {
    emailLabel: 'E-posta *',
    nameLabel: 'İsim (isteğe bağlı)',
    namePlaceholder: 'Adınız',
    frequencyLabel: 'Bülten Sıklığı',
    categoriesLabel: 'Favori Kategoriler',
    regionsLabel: 'Favori Bölgeler',
    submitButton: 'Bültene Abone Ol',
    loadingText: 'Abone olunuyor...',
    successTitle: 'Başarıyla Abone Oldunuz!',
    successMessage: 'Aboneliğinizi onaylamak için e-postanızı kontrol edin',
    anotherSubscription: 'Başka abone ol',
    disclaimer: 'E-postanızı üçüncü taraflarla paylaşmayacağız. İstediğiniz zaman aboneliğinizi iptal edebilirsiniz.',
    errorDefault: 'Abone olurken bir hata oluştu',
    errorConnection: 'Bağlantı başarısız, lütfen tekrar deneyin',
  },
  fr: {
    emailLabel: 'E-mail *',
    nameLabel: 'Nom (facultatif)',
    namePlaceholder: 'Votre nom',
    frequencyLabel: 'Fréquence de la newsletter',
    categoriesLabel: 'Catégories favorites',
    regionsLabel: 'Régions favorites',
    submitButton: 'S\'abonner à la newsletter',
    loadingText: 'Inscription en cours...',
    successTitle: 'Inscription réussie !',
    successMessage: 'Veuillez vérifier votre e-mail pour confirmer votre abonnement',
    anotherSubscription: 'Autre abonnement',
    disclaimer: 'Nous ne partagerons pas votre e-mail avec des tiers. Vous pouvez vous désabonner à tout moment.',
    errorDefault: 'Une erreur est survenue lors de l\'inscription',
    errorConnection: 'Échec de connexion, veuillez réessayer',
  },
  es: {
    emailLabel: 'Correo electrónico *',
    nameLabel: 'Nombre (opcional)',
    namePlaceholder: 'Tu nombre',
    frequencyLabel: 'Frecuencia del boletín',
    categoriesLabel: 'Categorías favoritas',
    regionsLabel: 'Regiones favoritas',
    submitButton: 'Suscribirse al boletín',
    loadingText: 'Suscribiendo...',
    successTitle: '¡Suscripción exitosa!',
    successMessage: 'Por favor, revisa tu correo electrónico para confirmar tu suscripción',
    anotherSubscription: 'Otra suscripción',
    disclaimer: 'No compartiremos tu correo electrónico con terceros. Puedes cancelar tu suscripción en cualquier momento.',
    errorDefault: 'Ocurrió un error durante la suscripción',
    errorConnection: 'Error de conexión, por favor intenta de nuevo',
  },
} as any;

type LocaleKey = 'ar' | 'en' | 'tr' | 'fr' | 'es';

// ─── Lookup Maps ──────────────────────────────────────
const FREQUENCIES_MAP: Record<LocaleKey, typeof FREQUENCIES_AR> = {
  ar: FREQUENCIES_AR,
  en: FREQUENCIES_EN,
  tr: FREQUENCIES_TR,
  fr: FREQUENCIES_FR,
  es: FREQUENCIES_ES,
};

const CATEGORIES_MAP: Record<LocaleKey, typeof CATEGORIES_AR> = {
  ar: CATEGORIES_AR,
  en: CATEGORIES_EN,
  tr: CATEGORIES_TR,
  fr: CATEGORIES_FR,
  es: CATEGORIES_ES,
};

const REGIONS_MAP: Record<LocaleKey, typeof REGIONS_AR> = {
  ar: REGIONS_AR,
  en: REGIONS_EN,
  tr: REGIONS_TR,
  fr: REGIONS_FR,
  es: REGIONS_ES,
};

interface SubscribeFormProps {
  locale?: LocaleKey;
}

export default function SubscribeForm({ locale = 'ar' }: SubscribeFormProps) {
  // V2: Proper locale-aware lookup instead of binary isEn check
  const t = TEXT[locale] || TEXT.en;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const FREQUENCIES = FREQUENCIES_MAP[locale] || FREQUENCIES_EN;
  const CATEGORIES = CATEGORIES_MAP[locale] || CATEGORIES_EN;
  const REGIONS = REGIONS_MAP[locale] || REGIONS_EN;

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<string>('weekly');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleRegion = (reg: string) => {
    setSelectedRegions(prev =>
      prev.includes(reg) ? prev.filter(r => r !== reg) : [...prev, reg]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
          frequency,
          categories: selectedCategories,
          regions: selectedRegions,
          locale,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.errorDefault);
        return;
      }

      setSuccess(true);
      setEmail('');
      setName('');
    } catch {
      setError(t.errorConnection);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8" style={{ direction: dir }}>
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.3)' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>{t.successTitle}</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text2)' }}>
          {t.successMessage}
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="text-sm px-4 py-2 rounded-lg transition-colors"
          style={{ background: 'var(--cyan2)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.2)' }}
        >
          {t.anotherSubscription}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" style={{ direction: dir }}>
      {/* Email & Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text2)' }}>
            {t.emailLabel}
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-2"
            style={{
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              direction: 'ltr',
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text2)' }}>
            {t.nameLabel}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.namePlaceholder}
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-2"
            style={{
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />
        </div>
      </div>

      {/* Frequency Selector */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text2)' }}>
          {t.frequencyLabel}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FREQUENCIES.map((freq) => (
            <button
              key={freq.value}
              type="button"
              onClick={() => setFrequency(freq.value)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: frequency === freq.value ? 'rgba(0,229,255,0.12)' : 'var(--bg2)',
                border: `1px solid ${frequency === freq.value ? 'rgba(0,229,255,0.4)' : 'var(--border)'}`,
                color: frequency === freq.value ? 'var(--cyan)' : 'var(--text2)',
              }}
            >
              <span>{freq.icon}</span>
              <span>{freq.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category Checkboxes */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text2)' }}>
          {t.categoriesLabel}
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
              style={{
                background: selectedCategories.includes(cat) ? 'rgba(139,92,246,0.15)' : 'var(--bg2)',
                border: `1px solid ${selectedCategories.includes(cat) ? 'rgba(139,92,246,0.4)' : 'var(--border)'}`,
                color: selectedCategories.includes(cat) ? 'var(--purple)' : 'var(--text3)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Region Checkboxes */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text2)' }}>
          {t.regionsLabel}
        </label>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((reg) => (
            <button
              key={reg}
              type="button"
              onClick={() => toggleRegion(reg)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
              style={{
                background: selectedRegions.includes(reg) ? 'rgba(0,229,255,0.12)' : 'var(--bg2)',
                border: `1px solid ${selectedRegions.includes(reg) ? 'rgba(0,229,255,0.3)' : 'var(--border)'}`,
                color: selectedRegions.includes(reg) ? 'var(--cyan)' : 'var(--text3)',
              }}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !email}
        className="w-full py-3 rounded-lg text-sm font-bold transition-all duration-200 disabled:opacity-50"
        style={{
          background: loading ? 'var(--bg2)' : 'linear-gradient(135deg, #00E5FF, #8B5CF6)',
          color: '#fff',
          border: 'none',
        }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t.loadingText}
          </span>
        ) : (
          t.submitButton
        )}
      </button>

      {/* Disclaimer */}
      <p className="text-[11px] text-center" style={{ color: 'var(--text3)' }}>
        {t.disclaimer}
      </p>
    </form>
  );
}

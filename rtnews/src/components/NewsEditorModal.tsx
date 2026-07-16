'use client';

import { useState, useEffect } from 'react';
import { X, Save, Trash2, Globe, FileText, BarChart3, AlertTriangle, CheckCircle2, Plus, Bot, Image, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface NewsItem {
  id?: string;
  title: string;
  titleAr: string | null;
  summary: string;
  summaryAr: string | null;
  content?: string | null;
  contentAr?: string | null;
  source: string;
  url: string;
  category: string;
  sentiment: string;
  sentimentScore: number;
  impactLevel: string;
  newsType: string;
  isPublished: boolean;
  imageUrl?: string | null;
  aiAnalysis?: string | null;
  affectedAssets?: string;
}

interface NewsEditorModalProps {
  item: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const CATEGORIES = ['بنوك مركزية', 'سلع', 'أسواق عربية', 'اقتصاد أمريكي', 'أرباح شركات', 'عملات', 'كريبتو', 'طاقة', 'أسهم', 'اقتصاد كلي', 'اقتصاد'];
const SENTIMENTS = [
  { value: 'positive', label: 'إيجابي' },
  { value: 'negative', label: 'سلبي' },
  { value: 'neutral', label: 'محايد' },
];
const IMPACTS = [
  { value: 'high', label: 'عالي' },
  { value: 'medium', label: 'متوسط' },
  { value: 'low', label: 'منخفض' },
];
const NEWS_TYPES = [
  { value: 'live', label: 'مباشر (Live)' },
  { value: 'breaking', label: 'عاجل (Breaking)' },
  { value: 'article', label: 'مقال (Article)' },
];

export default function NewsEditorModal({ item, isOpen, onClose, onSave }: NewsEditorModalProps) {
  const [formData, setFormData] = useState<NewsItem>({
    title: '',
    titleAr: '',
    summary: '',
    summaryAr: '',
    content: '',
    contentAr: '',
    source: 'يدوي',
    url: '',
    category: 'اقتصاد كلي',
    sentiment: 'neutral',
    sentimentScore: 50,
    impactLevel: 'medium',
    newsType: 'live',
    isPublished: true,
    imageUrl: '',
    aiAnalysis: '',
    affectedAssets: '[]',
  });
  const [loading, setLoading] = useState(false);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiAnalysisText, setAiAnalysisText] = useState('');
  const [affectedAssetsList, setAffectedAssetsList] = useState<string[]>([]);

  useEffect(() => {
    if (item) {
      setFormData({
        ...item,
        titleAr: item.titleAr || '',
        summaryAr: item.summaryAr || '',
        content: item.content || '',
        contentAr: item.contentAr || '',
        imageUrl: item.imageUrl || '',
        aiAnalysis: item.aiAnalysis || '',
        affectedAssets: item.affectedAssets || '[]',
      });
      // Parse AI analysis for display
      try {
        if (item.aiAnalysis) {
          const parsed = JSON.parse(item.aiAnalysis);
          const displayText = [parsed.introduction, parsed.body || parsed.articleBody, parsed.conclusion]
            .filter(Boolean).join('\n\n');
          setAiAnalysisText(displayText || item.aiAnalysis);
        }
      } catch {
        setAiAnalysisText(item.aiAnalysis || '');
      }
      // Parse affected assets
      try {
        const assets = JSON.parse(item.affectedAssets || '[]');
        if (Array.isArray(assets)) {
          setAffectedAssetsList(assets.map((a: any) => typeof a === 'string' ? a : a.symbol || String(a)));
        }
      } catch {
        setAffectedAssetsList([]);
      }
    } else {
      setFormData({
        title: '',
        titleAr: '',
        summary: '',
        summaryAr: '',
        content: '',
        contentAr: '',
        source: 'يدوي',
        url: '',
        category: 'اقتصاد كلي',
        sentiment: 'neutral',
        sentimentScore: 50,
        impactLevel: 'medium',
        newsType: 'live',
        isPublished: true,
        imageUrl: '',
        aiAnalysis: '',
        affectedAssets: '[]',
      });
      setAiAnalysisText('');
      setAffectedAssetsList([]);
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isEdit = !!item?.id;
      const url = '/api/news/manage';
      const method = isEdit ? 'PUT' : 'POST';

      // Include contentAr and aiAnalysis in the submission
      const submitData = {
        ...formData,
        contentAr: formData.contentAr || undefined,
        aiAnalysis: formData.aiAnalysis || undefined,
        affectedAssets: JSON.stringify(
          affectedAssetsList.map(symbol => ({ symbol, direction: 'neutral' }))
        ),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { ...submitData, id: item.id } : submitData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحفظ');

      toast.success(isEdit ? 'تم تحديث الخبر بنجاح' : 'تم إضافة الخبر بنجاح');
      onSave();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item?.id) return;
    
    const isPublished = (item as any).isReady || item.isPublished;
    const displayTitle = item.titleAr || item.title;
    
    // V49: Admin has full delete permissions — simple confirmation only
    const msg = isPublished
      ? `هل أنت متأكد من حذف هذا الخبر المنشور؟\n\n"${displayTitle.slice(0, 80)}"\n\nسيتم حذف الخبر نهائياً ولن يتمكن الزوار من الوصول إليه.`
      : `هل أنت متأكد من حذف هذا الخبر؟\n\n"${displayTitle.slice(0, 80)}"`;
    
    if (!confirm(msg)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/news/manage?id=${item.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'فشل الحذف');
        return;
      }
      toast.success('تم حذف الخبر');
      onSave();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'فشل الحذف');
    } finally {
      setLoading(false);
    }
  };

  const addAsset = (symbol: string) => {
    if (symbol && !affectedAssetsList.includes(symbol)) {
      setAffectedAssetsList([...affectedAssetsList, symbol]);
    }
  };

  const removeAsset = (symbol: string) => {
    setAffectedAssetsList(affectedAssetsList.filter(a => a !== symbol));
  };

  // Update aiAnalysis from the text view
  const updateAiAnalysisFromText = (text: string) => {
    setAiAnalysisText(text);
    try {
      // Try to keep structured data if it exists
      if (formData.aiAnalysis) {
        const parsed = JSON.parse(formData.aiAnalysis);
        parsed.fullContent = text;
        parsed.introduction = text.split('\n\n')[0] || '';
        parsed.body = text.split('\n\n').slice(1, -1).join('\n\n') || '';
        parsed.conclusion = text.split('\n\n').pop() || '';
        setFormData({ ...formData, aiAnalysis: JSON.stringify(parsed) });
      } else {
        setFormData({
          ...formData,
          aiAnalysis: JSON.stringify({
            fullContent: text,
            introduction: text.split('\n\n')[0] || '',
            body: text,
            conclusion: '',
            keyTakeaways: [],
            affectedAssets: [],
            sentiment: formData.sentiment,
            recommendation: '',
            generatedAt: new Date().toISOString(),
          }),
        });
      }
    } catch {
      setFormData({
        ...formData,
        aiAnalysis: JSON.stringify({
          fullContent: text,
          introduction: text.slice(0, 200),
          body: text,
          conclusion: '',
          keyTakeaways: [],
          affectedAssets: [],
          sentiment: formData.sentiment,
          recommendation: '',
          generatedAt: new Date().toISOString(),
        }),
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg3)] border border-[var(--border)] rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col shadow-[var(--cyan2)]/20">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg2)]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--cyan)]/10 flex items-center justify-center">
              {item ? <FileText size={20} className="text-[var(--cyan)]" /> : <Plus size={20} className="text-[var(--cyan)]" />}
            </div>
            <div>
              <h2 className="text-[16px] font-bold" style={{ color: 'var(--text)' }}>
                {item ? 'تعديل الخبر' : 'إضافة خبر جديد'}
              </h2>
              <p className="text-[11px]" style={{ color: 'var(--text3)' }}>
                أدخل تفاصيل الخبر المالي بدقة للمتداولين
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg4)] rounded-lg transition-colors">
            <X size={18} style={{ color: 'var(--text3)' }} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Text Content */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[12px] font-bold flex items-center gap-2" style={{ color: 'var(--text2)' }}>
                  <Globe size={14} className="text-[var(--cyan)]" />
                  العنوان (عربي)
                </label>
                <input
                  required
                  value={formData.titleAr || ''}
                  onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                  placeholder="أدخل العنوان بالعربية..."
                  className="w-full bg-[var(--bg4)] border border-[var(--border)] rounded-xl px-4 py-3 text-[14px] focus:border-[var(--cyan)] focus:ring-1 focus:ring-[var(--cyan)] transition-all outline-none"
                  style={{ color: 'var(--text)', direction: 'rtl' }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>العنوان الأصلي (إنجليزي)</label>
                <input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Original English Title..."
                  className="w-full bg-[var(--bg4)] border border-[var(--border)] rounded-xl px-4 py-3 text-[14px] focus:border-[var(--cyan)] outline-none"
                  style={{ color: 'var(--text)', direction: 'ltr' }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold flex items-center gap-2" style={{ color: 'var(--text2)' }}>
                  <FileText size={14} className="text-[var(--purple)]" />
                  الملخص (عربي)
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.summaryAr || ''}
                  onChange={(e) => setFormData({ ...formData, summaryAr: e.target.value })}
                  placeholder="اكتب ملخصاً جذاباً للمتداولين..."
                  className="w-full bg-[var(--bg4)] border border-[var(--border)] rounded-xl px-4 py-3 text-[13px] focus:border-[var(--cyan)] outline-none resize-none"
                  style={{ color: 'var(--text2)', direction: 'rtl' }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>الملخص الأصلي (إنجليزي)</label>
                <textarea
                  required
                  rows={2}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Original summary content..."
                  className="w-full bg-[var(--bg4)] border border-[var(--border)] rounded-xl px-4 py-3 text-[13px] focus:border-[var(--cyan)] outline-none resize-none"
                  style={{ color: 'var(--text2)', direction: 'ltr' }}
                />
              </div>

              {/* NEW: Content Ar (full article body in Arabic) */}
              <div className="space-y-2">
                <label className="text-[12px] font-bold flex items-center gap-2" style={{ color: 'var(--text2)' }}>
                  <FileText size={14} className="text-[var(--bull)]" />
                  محتوى الخبر (عربي)
                  <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,200,150,0.1)', color: 'var(--bull)' }}>جديد</span>
                </label>
                <textarea
                  rows={6}
                  value={formData.contentAr || ''}
                  onChange={(e) => setFormData({ ...formData, contentAr: e.target.value })}
                  placeholder="اكتب المحتوى الكامل للخبر بالعربية (يظهر في صفحة المقال تحت 'الخبر من المصدر')..."
                  className="w-full bg-[var(--bg4)] border border-[var(--border)] rounded-xl px-4 py-3 text-[13px] focus:border-[var(--cyan)] outline-none resize-y"
                  style={{ color: 'var(--text2)', direction: 'rtl' }}
                />
              </div>
            </div>

            {/* Right Column: Metadata & Settings */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>التصنيف</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[var(--bg4)] border border-[var(--border)] rounded-xl px-3 py-3 text-[13px] outline-none"
                    style={{ color: 'var(--text2)' }}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>نوع الخبر</label>
                  <select
                    value={formData.newsType}
                    onChange={(e) => setFormData({ ...formData, newsType: e.target.value })}
                    className="w-full bg-[var(--bg4)] border border-[var(--border)] rounded-xl px-3 py-3 text-[13px] outline-none"
                    style={{ color: 'var(--text2)' }}
                  >
                    {NEWS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>تأثير الخبر</label>
                  <select
                    value={formData.impactLevel}
                    onChange={(e) => setFormData({ ...formData, impactLevel: e.target.value })}
                    className="w-full bg-[var(--bg4)] border border-[var(--border)] rounded-xl px-3 py-3 text-[13px] outline-none"
                    style={{ color: 'var(--text2)' }}
                  >
                    {IMPACTS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>المشاعر</label>
                  <select
                    value={formData.sentiment}
                    onChange={(e) => setFormData({ ...formData, sentiment: e.target.value })}
                    className="w-full bg-[var(--bg4)] border border-[var(--border)] rounded-xl px-3 py-3 text-[13px] outline-none"
                    style={{ color: 'var(--text2)' }}
                  >
                    {SENTIMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold flex items-center justify-between" style={{ color: 'var(--text2)' }}>
                  <span>قوة المشاعر (Sentiment Score)</span>
                  <span className="font-mono text-[var(--cyan)]">{formData.sentimentScore}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.sentimentScore}
                  onChange={(e) => setFormData({ ...formData, sentimentScore: parseInt(e.target.value) })}
                  className="w-full accent-[var(--cyan)] h-1.5 rounded-lg bg-[var(--bg4)] cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>المصدر</label>
                <input
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="مثال: رويترز، يدوي..."
                  className="w-full bg-[var(--bg4)] border border-[var(--border)] rounded-xl px-4 py-3 text-[13px] focus:border-[var(--cyan)] outline-none"
                  style={{ color: 'var(--text2)' }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>رابط الخبر (اختياري)</label>
                <input
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-[var(--bg4)] border border-[var(--border)] rounded-xl px-4 py-3 text-[13px] focus:border-[var(--cyan)] outline-none"
                  style={{ color: 'var(--text2)', direction: 'ltr' }}
                />
              </div>

              {/* NEW: Image URL */}
              <div className="space-y-2">
                <label className="text-[12px] font-bold flex items-center gap-2" style={{ color: 'var(--text2)' }}>
                  <Image size={14} className="text-[var(--cyan)]" />
                  رابط الصورة
                  <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,200,150,0.1)', color: 'var(--bull)' }}>جديد</span>
                </label>
                <input
                  value={formData.imageUrl || ''}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://... أو اتركه فارغاً لتوليد صورة تلقائياً"
                  className="w-full bg-[var(--bg4)] border border-[var(--border)] rounded-xl px-4 py-3 text-[13px] focus:border-[var(--cyan)] outline-none"
                  style={{ color: 'var(--text2)', direction: 'ltr' }}
                />
                {formData.imageUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-[var(--border)]" style={{ maxHeight: 120 }}>
                    <img
                      src={formData.imageUrl}
                      alt="معاينة الصورة"
                      className="w-full object-cover"
                      style={{ maxHeight: 120 }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>

              {/* NEW: Affected Assets */}
              <div className="space-y-2">
                <label className="text-[12px] font-bold flex items-center gap-2" style={{ color: 'var(--text2)' }}>
                  <BarChart3 size={14} className="text-[var(--gold)]" />
                  الأصول المتأثرة
                  <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,200,150,0.1)', color: 'var(--bull)' }}>جديد</span>
                </label>
                <div className="flex flex-wrap gap-2 p-2 rounded-lg" style={{ background: 'var(--bg4)', border: '1px solid var(--border)', minHeight: 40 }}>
                  {affectedAssetsList.map(asset => (
                    <span key={asset} className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold" style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.2)' }}>
                      {asset}
                      <button type="button" onClick={() => removeAsset(asset)} className="hover:text-[var(--bear)]">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                  <input
                    placeholder="أضف أصل (مثل: XAU) واضغط Enter"
                    className="flex-1 min-w-[120px] bg-transparent text-[11px] outline-none"
                    style={{ color: 'var(--text2)' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.trim().toUpperCase();
                        if (val) { addAsset(val); (e.target as HTMLInputElement).value = ''; }
                      }
                    }}
                  />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {['USD', 'EUR', 'XAU', 'OIL', 'BTC', 'SPX', 'NDX'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addAsset(s)}
                      className="px-2 py-0.5 rounded text-[9px] font-bold transition-all hover:scale-105"
                      style={{ background: 'var(--bg4)', color: 'var(--text3)', border: '1px solid var(--border)' }}
                    >
                      +{s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg4)]/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className={formData.isPublished ? 'text-[var(--bull)]' : 'text-[var(--text4)]'} />
                  <div>
                    <div className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>نشر فوراً</div>
                    <div className="text-[10px]" style={{ color: 'var(--text3)' }}>سيظهر الخبر للزوار بمجرد الحفظ</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isPublished: !formData.isPublished })}
                  className={`w-12 h-6 rounded-full transition-all relative ${formData.isPublished ? 'bg-[var(--bull)]' : 'bg-[var(--bg4)]'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isPublished ? 'left-1' : 'left-7'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* NEW: AI Analysis Section (collapsible) */}
          <div className="rounded-xl border border-[var(--border)]" style={{ background: 'var(--bg4)' }}>
            <button
              type="button"
              onClick={() => setShowAiAnalysis(!showAiAnalysis)}
              className="w-full px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Bot size={16} style={{ color: 'var(--purple)' }} />
                <span className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>تحليل الذكاء الاصطناعي</span>
                {aiAnalysisText && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--purple)' }}>
                    موجود ({aiAnalysisText.length} حرف)
                  </span>
                )}
                <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,200,150,0.1)', color: 'var(--bull)' }}>جديد</span>
              </div>
              {showAiAnalysis ? <ChevronUp size={16} style={{ color: 'var(--text3)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text3)' }} />}
            </button>
            {showAiAnalysis && (
              <div className="px-4 pb-4 space-y-3">
                <p className="text-[10px]" style={{ color: 'var(--text4)' }}>
                  هذا هو التحليل الذي يظهر في صفحة المقال تحت قسم "تحليل الذكاء الاصطناعي". يمكنك تعديله أو إضافة تحليلك الخاص.
                </p>
                <textarea
                  rows={8}
                  value={aiAnalysisText}
                  onChange={(e) => updateAiAnalysisFromText(e.target.value)}
                  placeholder="اكتب تحليلاً مالياً للمقال أو عدل التحليل الموجود..."
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 text-[13px] focus:border-[var(--purple)] outline-none resize-y"
                  style={{ color: 'var(--text2)', direction: 'rtl' }}
                />
                <div className="flex items-center gap-2">
                  <AlertTriangle size={12} style={{ color: 'var(--gold)' }} />
                  <span className="text-[10px]" style={{ color: 'var(--text4)' }}>
                    التعديل هنا يحدث محتوى التحليل فقط. لن يؤثر على المحتوى الأصلي للخبر.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Options */}
          <div className="rounded-xl border border-[var(--border)]" style={{ background: 'var(--bg4)' }}>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} style={{ color: 'var(--gold)' }} />
                <span className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>خيارات متقدمة</span>
              </div>
              {showAdvanced ? <ChevronUp size={16} style={{ color: 'var(--text3)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text3)' }} />}
            </button>
            {showAdvanced && (
              <div className="px-4 pb-4 space-y-4">
                {/* English content field */}
                <div className="space-y-2">
                  <label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>المحتوى الأصلي (إنجليزي)</label>
                  <textarea
                    rows={4}
                    value={formData.content || ''}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Original English content (optional)..."
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 text-[13px] focus:border-[var(--cyan)] outline-none resize-y"
                    style={{ color: 'var(--text2)', direction: 'ltr' }}
                  />
                </div>

                {/* Raw AI Analysis JSON (for debugging) */}
                <div className="space-y-2">
                  <label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>JSON التحليل (للمطورين)</label>
                  <textarea
                    rows={4}
                    value={formData.aiAnalysis || ''}
                    onChange={(e) => setFormData({ ...formData, aiAnalysis: e.target.value })}
                    placeholder="JSON data..."
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 text-[10px] font-mono focus:border-[var(--purple)] outline-none resize-y"
                    style={{ color: 'var(--text3)', direction: 'ltr' }}
                  />
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--bg2)]/50 flex items-center justify-between">
          <div>
            {item && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-[var(--bear)] hover:bg-[var(--bear)]/10 rounded-lg transition-colors font-bold text-[12px]"
              >
                <Trash2 size={16} />
                حذف الخبر
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-[var(--text3)] hover:text-[var(--text)] transition-colors text-[13px] font-bold"
            >
              إلغاء
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-2.5 rounded-xl bg-gradient-to-l from-[var(--cyan)] to-[var(--purple)] text-white font-bold text-[13px] flex items-center gap-2 hover:shadow-lg hover:shadow-[var(--cyan)]/20 transition-all disabled:opacity-50"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
              {item ? 'حفظ التعديلات' : 'إضافة الخبر'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon, Link, Layout, Calendar, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Ad {
  id?: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  position: string;
  isActive: boolean;
  endDate: string | null;
}

interface AdEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  ad: Ad | null;
}

const POSITIONS = [
  { value: 'top_banner', label: 'بانر علوي (Top Banner)' },
  { value: 'sidebar', label: 'جانبي (Sidebar)' },
  { value: 'inline', label: 'داخل الخبر (Inline)' },
  { value: 'bottom', label: 'أسفل الصفحة (Bottom)' },
];

export default function AdEditorModal({ isOpen, onClose, onSave, ad }: AdEditorModalProps) {
  const [formData, setFormData] = useState<Ad>({
    title: '',
    imageUrl: '',
    targetUrl: '',
    position: 'sidebar',
    isActive: true,
    endDate: null,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ad) {
      setFormData({
        ...ad,
        endDate: ad.endDate ? new Date(ad.endDate).toISOString().split('T')[0] : null,
      });
    } else {
      setFormData({
        title: '',
        imageUrl: '',
        targetUrl: '',
        position: 'sidebar',
        isActive: true,
        endDate: null,
      });
    }
  }, [ad, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const method = ad?.id ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/ads', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ad?.id ? { ...formData, id: ad.id } : formData),
      });

      if (!res.ok) throw new Error('فشل الحفظ');
      
      toast.success(ad?.id ? 'تم تحديث الإعلان' : 'تم إضافة الإعلان');
      onSave();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg3)] border border-[var(--border)] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg2)]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--cyan)]/10 flex items-center justify-center">
              <Save size={20} className="text-[var(--cyan)]" />
            </div>
            <h2 className="text-[16px] font-bold" style={{ color: 'var(--text)' }}>
              {ad ? 'تعديل إعلان' : 'إضافة إعلان جديد'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg4)] rounded-lg transition-colors">
            <X size={18} style={{ color: 'var(--text3)' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>عنوان الإعلان (داخلي)</label>
            <input
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-[var(--bg4)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-[var(--cyan)]"
              style={{ color: 'var(--text)' }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-bold flex items-center gap-2" style={{ color: 'var(--text2)' }}>
              <ImageIcon size={14} /> رابط الصورة
            </label>
            <input
              required
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full bg-[var(--bg4)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[13px] outline-none ltr"
              style={{ color: 'var(--text2)', direction: 'ltr' }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-bold flex items-center gap-2" style={{ color: 'var(--text2)' }}>
              <Link size={14} /> رابط الوجهة (Target URL)
            </label>
            <input
              required
              value={formData.targetUrl}
              onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
              className="w-full bg-[var(--bg4)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[13px] outline-none ltr"
              style={{ color: 'var(--text2)', direction: 'ltr' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[12px] font-bold flex items-center gap-2" style={{ color: 'var(--text2)' }}>
                <Layout size={14} /> مكان الظهور
              </label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full bg-[var(--bg4)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[13px] outline-none"
                style={{ color: 'var(--text2)' }}
              >
                {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[12px] font-bold flex items-center gap-2" style={{ color: 'var(--text2)' }}>
                <Calendar size={14} /> تاريخ الانتهاء
              </label>
              <input
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value || null })}
                className="w-full bg-[var(--bg4)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[13px] outline-none"
                style={{ color: 'var(--text2)' }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg4)]/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={18} className={formData.isActive ? 'text-[var(--bull)]' : 'text-[var(--text4)]'} />
              <div>
                <div className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>تفعيل الإعلان</div>
                <div className="text-[10px]" style={{ color: 'var(--text3)' }}>سيظهر الإعلان في المكان المحدد فوراً</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              className={`w-12 h-6 rounded-full transition-all relative ${formData.isActive ? 'bg-[var(--bull)]' : 'bg-[var(--bg4)]'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isActive ? 'left-1' : 'left-7'}`} />
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--bg2)]/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-[var(--text3)] text-[13px] font-bold">إلغاء</button>
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="px-8 py-2.5 rounded-xl bg-gradient-to-l from-[var(--cyan)] to-[var(--purple)] text-white font-bold text-[13px] disabled:opacity-50"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ الإعلان'}
          </button>
        </div>
      </div>
    </div>
  );
}

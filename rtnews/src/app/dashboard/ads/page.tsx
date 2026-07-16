'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Megaphone, Plus, Search, Filter, 
  ExternalLink, BarChart3, Clock, 
  Trash2, Edit2, CheckCircle2, XCircle,
  Eye, MousePointer2, Layout, Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AdEditorModal from '@/components/AdEditorModal';

interface Ad {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  position: string;
  isActive: boolean;
  impressions: number;
  clicks: number;
  startDate: string;
  endDate: string | null;
  createdAt: string;
}

const POSITIONS = [
  { value: 'top_banner', label: 'بانر علوي' },
  { value: 'sidebar', label: 'جانبي' },
  { value: 'inline', label: 'داخل الخبر' },
  { value: 'bottom', label: 'أسفل الصفحة' },
];

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ads');
      const data = await res.json();
      if (data.ads) setAds(data.ads);
    } catch {
      toast.error('فشل جلب البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const filteredAds = ads.filter(ad => 
    ad.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold font-heading flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Megaphone className="text-[var(--cyan)]" size={24} />
            إدارة الإعلانات
          </h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text3)' }}>
            تحكم في المساحات الإعلانية، التمويلات، وبانرات الشركاء
          </p>
        </div>
        <Button 
          onClick={() => { setEditingAd(null); setIsEditorOpen(true); }}
          className="bg-gradient-to-l from-[var(--cyan)] to-[var(--purple)] text-white font-bold gap-2 px-6 h-11 rounded-xl shadow-lg shadow-[var(--cyan)]/10"
        >
          <Plus size={18} />
          إضافة إعلان جديد
        </Button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الإعلانات', value: ads.length, icon: Layout, color: 'var(--cyan)' },
          { label: 'إعلانات نشطة', value: ads.filter(a => a.isActive).length, icon: CheckCircle2, color: 'var(--bull)' },
          { label: 'إجمالي المشاهدات', value: ads.reduce((acc, a) => acc + a.impressions, 0).toLocaleString(), icon: Eye, color: 'var(--purple)' },
          { label: 'إجمالي النقرات', value: ads.reduce((acc, a) => acc + a.clicks, 0).toLocaleString(), icon: MousePointer2, color: 'var(--gold)' },
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg3)]/50 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-bold" style={{ color: 'var(--text3)' }}>{stat.label}</span>
              <stat.icon size={16} style={{ color: stat.color }} />
            </div>
            <div className="text-[20px] font-mono-price font-bold" style={{ color: 'var(--text)' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text4)]" size={16} />
          <Input 
            placeholder="البحث عن إعلان..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 bg-[var(--bg3)] border-[var(--border)] text-[13px] h-11 rounded-xl focus:ring-[var(--cyan)]"
          />
        </div>
      </div>

      {/* Ads Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-[280px] rounded-2xl bg-[var(--bg4)] animate-pulse" />)}
        </div>
      ) : filteredAds.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAds.map((ad) => (
            <div 
              key={ad.id} 
              className="group relative rounded-2xl border border-[var(--border)] bg-[var(--bg3)] overflow-hidden hover:shadow-xl hover:shadow-[var(--cyan)]/5 transition-all duration-300"
            >
              {/* Ad Preview Image */}
              <div className="aspect-[16/9] bg-[var(--bg4)] relative overflow-hidden">
                <img 
                  src={ad.imageUrl} 
                  alt={ad.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => { (e.target as any).src = 'https://placehold.co/600x400/10141d/00e5ff?text=No+Image'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <Badge className={ad.isActive ? 'bg-[var(--bull)]/20 text-[var(--bull)]' : 'bg-[var(--bear)]/20 text-[var(--bear)]'}>
                    {ad.isActive ? 'نشط' : 'متوقف'}
                  </Badge>
                  <Badge className="bg-black/50 backdrop-blur-md border-white/10 text-white">
                    {POSITIONS.find(p => p.value === ad.position)?.label}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-[15px] truncate" style={{ color: 'var(--text)' }}>{ad.title}</h3>
                  <div className="flex items-center gap-1 mt-1 text-[11px]" style={{ color: 'var(--text4)' }}>
                    <ExternalLink size={10} />
                    <span className="truncate max-w-[200px]">{ad.targetUrl}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 py-3 border-y border-[var(--border)]/50">
                  <div className="text-center">
                    <div className="text-[16px] font-mono-price font-bold" style={{ color: 'var(--cyan)' }}>{ad.impressions}</div>
                    <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text4)' }}>مشاهدة</div>
                  </div>
                  <div className="text-center border-r border-[var(--border)]/50">
                    <div className="text-[16px] font-mono-price font-bold" style={{ color: 'var(--gold)' }}>{ad.clicks}</div>
                    <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text4)' }}>نقرة</div>
                  </div>
                </div>

                {/* Date & Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text3)' }}>
                    <Calendar size={12} />
                    <span>{ad.endDate ? `ينتهي: ${new Date(ad.endDate).toLocaleDateString('ar-SA')}` : 'بدون انتهاء'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setEditingAd(ad); setIsEditorOpen(true); }}
                      className="p-2 rounded-lg hover:bg-[var(--cyan)]/10 text-[var(--cyan)] transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="p-2 rounded-lg hover:bg-[var(--bear)]/10 text-[var(--bear)] transition-colors"
                      onClick={async () => {
                        if (!confirm('هل تريد حذف هذا الإعلان؟')) return;
                        await fetch(`/api/admin/ads?id=${ad.id}`, { method: 'DELETE' });
                        fetchAds();
                        toast.success('تم حذف الإعلان');
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--bg3)]/30">
          <Megaphone size={48} className="mx-auto mb-4 opacity-20" />
          <h3 className="text-[18px] font-bold" style={{ color: 'var(--text2)' }}>لا توجد إعلانات حالياً</h3>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text3)' }}>ابدأ بإضافة أول مساحة إعلانية للمنصة</p>
          <Button 
            onClick={() => setIsEditorOpen(true)}
            className="mt-6 bg-[var(--bg4)] border-[var(--border)] text-[var(--text)] hover:bg-[var(--bg4)]/80"
          >
            إضافة إعلان
          </Button>
        </div>
      )}

      {/* Editor Modal */}
      <AdEditorModal 
        isOpen={isEditorOpen}
        onClose={() => { setIsEditorOpen(false); setEditingAd(null); }}
        onSave={fetchAds}
        ad={editingAd}
      />
    </div>
  );
}

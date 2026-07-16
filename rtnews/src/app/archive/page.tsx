// ─── Archive Page ───────────────────────────────────────────────
// Shows all archived news articles with pagination and filtering

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NewsImage from '@/components/rouaa/NewsImage';

interface ArchiveItem {
  id: string;
  title: string;
  titleAr?: string;
  summary: string;
  summaryAr?: string;
  category: string;
  source: string;
  url: string;
  imageUrl?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
  impactLevel: 'high' | 'medium' | 'low';
  publishedAt: string;
  fetchedAt: string;
  slug?: string;
}

export default function ArchivePage() {
  const router = useRouter();
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('');
  const [impactFilter, setImpactFilter] = useState('');

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchArchive();
  }, [page, categoryFilter, sentimentFilter, impactFilter]);

  const fetchArchive = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(categoryFilter && { category: categoryFilter }),
        ...(sentimentFilter && { sentiment: sentimentFilter }),
        ...(impactFilter && { impact: impactFilter }),
      });

      const res = await fetch(`/api/news/archive?${params.toString()}`);
      const data = await res.json();

      if (data.items) {
        setItems(data.items);
      }
    } catch (error) {
      console.error('Archive error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item: ArchiveItem) => {
    const pathSegment = item.slug || item.id;
    if (!pathSegment || typeof pathSegment !== 'string' || pathSegment === 'undefined' || pathSegment === 'null') return;
    // Navigate to article page - all data comes from DB via slug
    router.push(`/news/${pathSegment}`);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getImpactColor = (impact: string) => {
    if (impact === 'high') return 'text-red-400';
    if (impact === 'medium') return 'text-yellow-400';
    return 'text-green-400';
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'positive') return 'text-green-400';
    if (sentiment === 'negative') return 'text-red-400';
    return 'text-gray-400';
  };

  // Get unique categories from items
  const categories = Array.from(new Set(items.map((item) => item.category))).filter(Boolean);

  return (
    <main className="min-h-screen pb-16" style={{ background: 'var(--bg)' }}>

      {/* Archive Header */}
      <section className="pt-8 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-[860px] mx-auto px-4">
          <h1 className="font-heading text-[30px] font-bold mb-6" style={{ color: 'var(--text)' }}>
            أرشيف الأخبار
          </h1>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--bg4)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            >
              <option value="">جميع التصنيفات</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={sentimentFilter}
              onChange={(e) => { setSentimentFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--bg4)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            >
              <option value="">جميع المشاعر</option>
              <option value="positive">إيجابي</option>
              <option value="negative">سلبي</option>
              <option value="neutral">محايد</option>
            </select>

            <select
              value={impactFilter}
              onChange={(e) => { setImpactFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--bg4)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            >
              <option value="">جميع مستويات التأثير</option>
              <option value="high">تأثير عالٍ</option>
              <option value="medium">تأثير متوسط</option>
              <option value="low">تأثير منخفض</option>
            </select>
          </div>
        </div>
      </section>

      {/* Archive Items */}
      <section className="py-6">
        <div className="max-w-[860px] mx-auto px-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="glass-card p-5 rounded-2xl">
                  <div className="skeleton h-4 w-3/4 rounded mb-3" />
                  <div className="skeleton h-3 w-full rounded mb-2" />
                  <div className="skeleton h-3 w-2/3 rounded" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg" style={{ color: 'var(--text3)' }}>لا توجد أخبار في الأرشيف</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="w-full text-right glass-card p-5 rounded-2xl transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-[10px] px-2 py-1 rounded-md font-medium" style={{ background: 'var(--cyan2)', color: 'var(--cyan)' }}>
                          {item.category}
                        </span>
                        <span className="text-[10px] px-2 py-1 rounded-md font-medium" style={{ background: 'rgba(0,201,167,0.1)', color: getImpactColor(item.impactLevel) }}>
                          {item.impactLevel === 'high' ? 'تأثير عالٍ' : item.impactLevel === 'medium' ? 'تأثير متوسط' : 'تأثير منخفض'}
                        </span>
                        <span className="text-[10px] px-2 py-1 rounded-md font-medium" style={{ background: 'rgba(0,201,167,0.1)', color: getSentimentColor(item.sentiment) }}>
                          {item.sentiment === 'positive' ? 'إيجابي' : item.sentiment === 'negative' ? 'سلبي' : 'محايد'}
                        </span>
                      </div>
                      <h3 className="text-[16px] font-semibold mb-2 leading-relaxed" style={{ color: 'var(--text)' }}>
                        {item.titleAr || item.title}
                      </h3>
                      <p className="text-[13px] leading-relaxed mb-3" style={{ color: 'var(--text3)' }}>
                        {item.summaryAr || item.summary}
                      </p>
                      <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--text3)' }}>
                        <span>{item.source}</span>
                        <span>•</span>
                        <span>{formatDate(item.publishedAt)}</span>
                      </div>
                    </div>
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <NewsImage
                        src={item.imageUrl}
                        alt={item.title || 'صورة أرشيف'}
                        category={item.category}
                        width={80}
                        height={80}
                        style={{ width: '80px', height: '80px' }}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Pagination */}
          {items.length === ITEMS_PER_PAGE && (
            <div className="flex justify-center mt-8 gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg"
                style={{
                  background: page === 1 ? 'var(--bg4)' : 'var(--cyan)',
                  color: page === 1 ? 'var(--text3)' : 'white',
                  opacity: page === 1 ? 0.5 : 1,
                }}
              >
                السابق
              </button>
              <span className="px-4 py-2" style={{ color: 'var(--text)' }}>
                الصفحة {page}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-lg"
                style={{
                  background: 'var(--cyan)',
                  color: 'white',
                }}
              >
                التالي
              </button>
            </div>
          )}
        </div>
      </section>

    </main>
  );
}

// ─── Related News Filters ──────────────────────────────────────
// Filter buttons above related news (by category, sentiment, time)
'use client';

import { useState, useMemo } from 'react';

export type FilterType = 'all' | 'positive' | 'negative' | 'neutral' | string;

interface RelatedNewsFiltersProps {
  categories: string[];
  activeFilter: FilterType;
  activeCategory: string;
  onFilterChange: (filter: FilterType) => void;
  onCategoryChange: (category: string) => void;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
}

export function RelatedNewsFilters({
  categories,
  activeFilter,
  activeCategory,
  onFilterChange,
  onCategoryChange,
  locale = 'ar',
}: RelatedNewsFiltersProps) {
  const t = (ar: string, en: string, fr?: string, tr?: string, es?: string) => locale === 'es' ? (es || en) : locale === 'tr' ? (tr || en) : locale === 'fr' ? (fr || en) : locale === 'en' ? en : ar;
  const sentimentFilters: { key: FilterType; label: string; color: string }[] = [
    { key: 'all', label: t('الكل', 'All', 'Tout', 'Hepsi', 'Todos'), color: 'var(--text2)' },
    { key: 'positive', label: t('إيجابي', 'Positive', 'Positif', 'Olumlu', 'Positivo'), color: 'var(--bull)' },
    { key: 'negative', label: t('سلبي', 'Negative', 'Négatif', 'Olumsuz', 'Negativo'), color: 'var(--bear)' },
    { key: 'neutral', label: t('محايد', 'Neutral', 'Neutre', 'Nötr', 'Neutral'), color: 'var(--neutral)' },
  ];

  return (
    <div className="flex flex-col gap-3 mb-4">
      {/* Sentiment Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>{t('المشاعر:', 'Sentiment:', 'Sentiment :', 'Duygu:', 'Sentimiento:')}</span>
        {sentimentFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-200"
            style={{
              background: activeFilter === f.key ? (f.key === 'all' ? 'var(--cyan2)' : f.key === 'positive' ? 'var(--bull2)' : f.key === 'negative' ? 'var(--bear2)' : 'var(--cyan2)') : 'transparent',
              color: activeFilter === f.key ? f.color : 'var(--text3)',
              border: activeFilter === f.key
                ? `1px solid ${f.key === 'all' ? 'rgba(0,229,255,0.3)' : f.key === 'positive' ? 'rgba(34,197,94,0.3)' : f.key === 'negative' ? 'rgba(239,83,80,0.3)' : 'rgba(100,116,139,0.3)'}`
                : '1px solid var(--border)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Category Filters */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>{t('التصنيف:', 'Category:', 'Catégorie :', 'Kategori:', 'Categoría:')}</span>
          <button
            onClick={() => onCategoryChange('all')}
            className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-200"
            style={{
              background: activeCategory === 'all' ? 'var(--cyan2)' : 'transparent',
              color: activeCategory === 'all' ? 'var(--cyan)' : 'var(--text3)',
              border: activeCategory === 'all' ? '1px solid rgba(0,229,255,0.3)' : '1px solid var(--border)',
            }}
          >
            {t('الكل', 'All', 'Tout', 'Hepsi', 'Todos')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-200"
              style={{
                background: activeCategory === cat ? 'var(--cyan2)' : 'transparent',
                color: activeCategory === cat ? 'var(--cyan)' : 'var(--text3)',
                border: activeCategory === cat ? '1px solid rgba(0,229,255,0.3)' : '1px solid var(--border)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── English News Article Detail Page (v2 — Full Featured) ──────
// Architecture: Mirrors the Arabic ArticlePageClient design exactly.
// Uses CSS variables, Tailwind classes, and specialized components.
// LTR layout, English text labels, locale=en API calls.
// ALL content is pre-fetched server-side. NO client-side fetching.

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import BackToTop from '@/components/rouaa/BackToTop';
import { InsightCard } from '@/components/rouaa/article/InsightCard';
import { TradingInsightCard } from '@/components/rouaa/article/TradingInsightCard';
import { BullBearSection } from '@/components/rouaa/article/BullBearSection';
import { ReadingProgressBar } from '@/components/rouaa/article/ReadingProgressBar';
import { TableOfContents, type TocItem } from '@/components/rouaa/article/TableOfContents';
import { AnimatedSentimentGauge } from '@/components/rouaa/article/AnimatedSentimentGauge';
import { AffectedAssetsGrid } from '@/components/rouaa/article/AffectedAssetsGrid';
import { VolatilityIndicator } from '@/components/rouaa/article/VolatilityIndicator';
import { RelatedNewsGrid } from '@/components/rouaa/article/RelatedNewsGrid';
import { CommentsSection } from '@/components/rouaa/article/CommentsSection';
import { SymbolLinkedText } from '@/components/news/SymbolLinkText';
import { ShareBar } from '@/components/rouaa/article/ShareBar';
import { TextToSpeechBtn } from '@/components/rouaa/article/TextToSpeechBtn';
import { PrintBtn } from '@/components/rouaa/article/PrintBtn';
import { FocusMode } from '@/components/rouaa/article/FocusMode';
import { LiveUpdateBanner } from '@/components/rouaa/article/LiveUpdateBanner';
import { ReadingStats } from '@/components/rouaa/article/ReadingStats';
import { BookmarkWithFolders } from '@/components/rouaa/article/BookmarkWithFolders';
import { KeyboardShortcuts, ShortcutsHelp } from '@/components/rouaa/article/KeyboardShortcuts';
import { ParallaxHeroImage } from '@/components/rouaa/article/ParallaxHeroImage';
import { EventTimeline, buildTimelineEvents } from '@/components/rouaa/article/EventTimeline';
import { SentimentComparison } from '@/components/rouaa/article/SentimentComparison';
import { NewsChain } from '@/components/rouaa/article/NewsChain';
import { RelatedNewsFilters, type FilterType } from '@/components/rouaa/article/RelatedNewsFilters';
import { RelatedNewsTimeline } from '@/components/rouaa/article/RelatedNewsTimeline';
import { type NewsAnalysis } from '@/stores/news-store';
import { useUserStore, useUserStoreHydrated } from '@/stores/user-store';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { sanitizeDisplayText } from '@/lib/clean-markdown';
import { SmartCouncilWidget, EconomicCalendarWidget, MostReadWidget } from '@/components/shared/SidebarWidgets';

// ─── Article Data Interface (from page.tsx) ─────────────────────
interface ArticleData {
  id: string;
  title: string;
  slug: string;
  summary: string;
  source: string;
  sourceName: string;
  category: string;
  categoryId?: string | null;
  sentiment: string;
  sentimentScore: number;
  impactLevel: string;
  affectedAssets: any[];
  publishedAt: string;
  content: string;
  contentText?: string;
  hasSourceContent?: boolean;
  introduction: string;
  body: string;
  conclusion: string;
  keyTakeaways: string[];
  hasFullContent: boolean;
  analysisSentiment?: string;
  analysisRecommendation?: string;
  analysisAffectedAssets?: any[];
  wordCount: number;
  newsType: string;
  imageUrl?: string;
  generatedImage?: string;
  seo?: any;
  analysis?: any;
  updatedAt?: string;
  views?: number;
  tags?: string[];
  originalUrl?: string;
}

// ─── Category badge config (English + French labels) ────────────
const categoryConfig: Record<string, { css: string; label: string; labelFr: string; labelTr: string; labelEs: string }> = {
  'Central Banks': { css: 'cat-central-banks', label: 'Central Banks', labelFr: 'Banques Centrales', labelTr: 'Merkez Bankaları', labelEs: 'Bancos Centrales' },
  'Commodities': { css: 'cat-metals', label: 'Commodities', labelFr: 'Matières Premières', labelTr: 'Emtialar', labelEs: 'Materias Primas' },
  'Arab Markets': { css: 'cat-arab-markets', label: 'Arab Markets', labelFr: 'Marchés Arabes', labelTr: 'Arap Piyasaları', labelEs: 'Mercados Árabes' },
  'US Economy': { css: 'cat-macro', label: 'US Economy', labelFr: 'Économie Américaine', labelTr: 'ABD Ekonomisi', labelEs: 'Economía EE.UU.' },
  'Earnings': { css: 'cat-earnings', label: 'Earnings', labelFr: 'Résultats', labelTr: 'Kazanç Raporları', labelEs: 'Resultados' },
  'Forex': { css: 'cat-forex', label: 'Forex', labelFr: 'Devises', labelTr: 'Forex', labelEs: 'Forex' },
  'Currencies': { css: 'cat-forex', label: 'Currencies', labelFr: 'Devises', labelTr: 'Döviz', labelEs: 'Divisas' },
  'Crypto': { css: 'cat-crypto', label: 'Crypto', labelFr: 'Crypto', labelTr: 'Kripto', labelEs: 'Cripto' },
  'Oil': { css: 'cat-oil', label: 'Oil & Energy', labelFr: 'Pétrole & Énergie', labelTr: 'Petrol & Enerji', labelEs: 'Petróleo y Energía' },
  'Energy': { css: 'cat-oil', label: 'Energy', labelFr: 'Énergie', labelTr: 'Enerji', labelEs: 'Energía' },
  'Stocks': { css: 'cat-stocks', label: 'Stocks', labelFr: 'Actions', labelTr: 'Hisseler', labelEs: 'Acciones' },
  'Economy': { css: 'cat-economy', label: 'Economy', labelFr: 'Économie', labelTr: 'Ekonomi', labelEs: 'Economía' },
  'Macroeconomy': { css: 'cat-economy', label: 'Macroeconomy', labelFr: 'Macroéconomie', labelTr: 'Makro Ekonomi', labelEs: 'Macroeconomía' },
  'Healthcare': { css: 'cat-stocks', label: 'Healthcare', labelFr: 'Santé', labelTr: 'Sağlık', labelEs: 'Salud' },
  'Technology': { css: 'cat-stocks', label: 'Technology', labelFr: 'Technologie', labelTr: 'Teknoloji', labelEs: 'Tecnología' },
  'Retail': { css: 'cat-stocks', label: 'Retail', labelFr: 'Commerce', labelTr: 'Perakende', labelEs: 'Comercio Minorista' },
  'Pharma': { css: 'cat-stocks', label: 'Pharma', labelFr: 'Pharmacie', labelTr: 'İlaç', labelEs: 'Farmacia' },
  'Real Estate': { css: 'cat-stocks', label: 'Real Estate', labelFr: 'Immobilier', labelTr: 'Gayrimenkul', labelEs: 'Bienes Raíces' },
  'Banks': { css: 'cat-central-banks', label: 'Banks', labelFr: 'Banques', labelTr: 'Bankalar', labelEs: 'Bancos' },
  'Insurance': { css: 'cat-stocks', label: 'Insurance', labelFr: 'Assurance', labelTr: 'Sigorta', labelEs: 'Seguros' },
  'Mining': { css: 'cat-metals', label: 'Mining', labelFr: 'Mines', labelTr: 'Madencilik', labelEs: 'Minería' },
  'Telecom': { css: 'cat-stocks', label: 'Telecom', labelFr: 'Télécommunications', labelTr: 'Telekomünikasyon', labelEs: 'Telecomunicaciones' },
  'Transport': { css: 'cat-stocks', label: 'Transport', labelFr: 'Transport', labelTr: 'Ulaşım', labelEs: 'Transporte' },
  'Agriculture': { css: 'cat-stocks', label: 'Agriculture', labelFr: 'Agriculture', labelTr: 'Tarım', labelEs: 'Agricultura' },
  'Education': { css: 'cat-stocks', label: 'Education', labelFr: 'Éducation', labelTr: 'Eğitim', labelEs: 'Educación' },
  'Entertainment': { css: 'cat-stocks', label: 'Entertainment', labelFr: 'Divertissement', labelTr: 'Eğlence', labelEs: 'Entretenimiento' },
  'M&A': { css: 'cat-earnings', label: 'M&A', labelFr: 'Fusions & Acquisitions', labelTr: 'Birleşme & Devralmalar', labelEs: 'Fusiones y Adquisiciones' },
  'Cybersecurity': { css: 'cat-stocks', label: 'Cybersecurity', labelFr: 'Cybersécurité', labelTr: 'Siber Güvenlik', labelEs: 'Ciberseguridad' },
  'Banking': { css: 'cat-central-banks', label: 'Banking', labelFr: 'Banque', labelTr: 'Bankacılık', labelEs: 'Banca' },
  'Gold': { css: 'cat-metals', label: 'Gold', labelFr: 'Or', labelTr: 'Altın', labelEs: 'Oro' },
  'Bonds': { css: 'cat-economy', label: 'Bonds', labelFr: 'Obligations', labelTr: 'Tahviller', labelEs: 'Bonos' },
};

// Helper: ensure a value is always a string
function ensureString(val: any): string {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.map(v => typeof v === 'string' ? v : v != null ? JSON.stringify(v) : '').filter(Boolean).join('\n');
  if (val != null && typeof val === 'object') return JSON.stringify(val);
  if (val == null) return '';
  return String(val);
}

// Strip Markdown from display text for clean rendering
function stripDisplayMarkdown(text: string): string {
  if (!text) return text;
  let r = text;
  r = r.replace(/^#{1,6}\s+/gm, '');
  r = r.replace(/\*\*(.+?)\*\*/g, '$1');
  r = r.replace(/__(.+?)__/g, '$1');
  r = r.replace(/\*(.+?)\*/g, '$1');
  r = r.replace(/(?<!\w)_(.+?)_(?!\w)/g, '$1');
  r = r.replace(/^[\-\*]\s+/gm, '');
  r = r.replace(/^[\-\*]{3,}\s*$/gm, '');
  r = r.replace(/`(.+?)`/g, '$1');
  r = r.replace(/\[(.+?)\]\(.+?\)/g, '$1');
  r = r.replace(/\n{3,}/g, '\n\n');
  return r.trim();
}

// V1037 FIX: Split text into readable paragraphs.
// Problem: Source article text often comes as ONE big block (no \n newlines),
// so split('\n') produces a single <p> tag with ~1000+ characters — unreadable.
// Solution:
//   1. Split by existing \n (preserves intentional paragraph breaks)
//   2. For any resulting paragraph > MAX_PARAGRAPH_LENGTH chars, further split
//      by sentence boundaries (period followed by space + capital letter)
//   3. Group sentences into paragraphs of ~2-3 sentences each
// Works for ALL languages (en/es/fr/tr/ar) because sentence-ending punctuation
// (. ! ? ؟) followed by whitespace + capital/letter is universal.
const MAX_PARAGRAPH_LENGTH = 280; // chars — beyond this, split by sentences
const SENTENCES_PER_PARAGRAPH = 2; // group N sentences into one <p>

function splitIntoParagraphs(text: string): string[] {
  if (!text) return [];
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Step 1: split by existing newlines
  const rawParagraphs = trimmed
    .split(/\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  // Step 2: for each long paragraph, further split by sentence boundaries
  const result: string[] = [];
  for (const para of rawParagraphs) {
    if (para.length <= MAX_PARAGRAPH_LENGTH) {
      result.push(para);
      continue;
    }

    // Split by sentence-ending punctuation: . ! ? ؟ (Arabic question mark)
    // followed by optional whitespace and a capital letter or any letter (for Arabic)
    // V1069: \s* instead of \s+ — handles LLM output like "presión.El" (no space after period)
    // Keep the punctuation with the sentence.
    const sentences = para
      .split(/(?<=[.!?؟])\s*(?=[A-ZÀ-ÿ\u0600-\u06FF\u00C0-\u017F«"])/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (sentences.length <= 1) {
      // No sentence boundaries found — keep as one paragraph
      result.push(para);
      continue;
    }

    // Step 3: group sentences into paragraphs of SENTENCES_PER_PARAGRAPH
    for (let i = 0; i < sentences.length; i += SENTENCES_PER_PARAGRAPH) {
      const group = sentences.slice(i, i + SENTENCES_PER_PARAGRAPH).join(' ');
      if (group.trim().length > 0) {
        result.push(group.trim());
      }
    }
  }

  return result;
}

// Parse [1]-[6] structured analysis into sections for formatted display
interface AnalysisSection {
  num: number;
  title: string;
  content: string;
}

const sectionConfig: Record<number, { title: string; titleFr: string; titleTr: string; titleEs: string; icon: string; color: string }> = {
  1: { title: 'Event Summary', titleFr: 'Résumé de l\'Événement', titleTr: 'Olay Özeti', titleEs: 'Resumen del Evento', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'var(--cyan)' },
  2: { title: 'Directly Affected Assets', titleFr: 'Actifs Directement Affectés', titleTr: 'Doğrudan Etkilenen Varlıklar', titleEs: 'Activos Directamente Afectados', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', color: '#22c55e' },
  3: { title: 'Indirectly Affected Assets', titleFr: 'Actifs Indirectement Affectés', titleTr: 'Dolaylı Etkilenen Varlıklar', titleEs: 'Activos Indirectamente Afectados', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: '#eab308' },
  4: { title: 'Broader Context', titleFr: 'Contexte Élargi', titleTr: 'Daha Geniş Bağlam', titleEs: 'Contexto Amplio', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064', color: '#a78bfa' },
  5: { title: 'Trading Scenarios', titleFr: 'Scénarios de Trading', titleTr: 'İşlem Senaryoları', titleEs: 'Escenarios de Trading', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: '#f97316' },
  6: { title: 'Expert Recommendation', titleFr: 'Recommandation de l\'Expert', titleTr: 'Uzman Tavsiyesi', titleEs: 'Recomendación del Experto', icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14', color: 'var(--cyan)' },
};

function parseAnalysisSections(fullContent: string, locale: 'en' | 'fr' | 'tr' | 'es' = 'en'): AnalysisSection[] {
  if (!fullContent) return [];

  const isFr = locale === 'fr';
  const isTr = locale === 'tr';
  const isEs = locale === 'es';
  const cleaned = stripDisplayMarkdown(fullContent);

  if (!/\[\s*1\s*\]/.test(cleaned)) {
    return [{ num: 0, title: '', content: cleaned }];
  }

  const sections: AnalysisSection[] = [];
  const parts = cleaned.split(/\[\s*(\d)\s*\]/);

  for (let i = 1; i < parts.length; i += 2) {
    const num = parseInt(parts[i], 10);
    const content = (parts[i + 1] || '').trim();
    if (num >= 1 && num <= 6 && content) {
      const lines = content.split('\n');
      const firstLine = lines[0].trim();
      const config = sectionConfig[num];
      const bodyLines = lines.slice(1).join('\n').trim();
      const sectionTitle = config ? (isEs ? config.titleEs : isTr ? config.titleTr : isFr ? config.titleFr : config.title) : firstLine;
      const sectionContent = bodyLines || firstLine;
      sections.push({ num, title: sectionTitle, content: sectionContent });
    }
  }

  return sections;
}

function ensureStringArray(arr: any[]): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => {
    if (typeof item === 'string') return item.trim();
    if (item != null && typeof item === 'object') {
      if (typeof item.text === 'string') return item.text.trim();
      if (typeof item.content === 'string') return item.content.trim();
      if (typeof item.value === 'string') return item.value.trim();
      if (typeof item.name === 'string') return item.name.trim();
      return JSON.stringify(item);
    }
    return item != null ? String(item).trim() : '';
  }).filter(s => s.length > 0);
}

// ── Build aiAnalysis from parsed fields ──
function buildAiAnalysis(data: ArticleData): NewsAnalysis | null {
  if (data.analysisSentiment || data.analysisRecommendation || data.analysisAffectedAssets) {
    return {
      summary: data.content || '',
      sentiment: data.analysisSentiment || 'neutral',
      confidence: data.sentimentScore || 85,
      affectedAssets: data.analysisAffectedAssets || [],
      impactLevel: data.impactLevel || 'low',
      recommendation: data.analysisRecommendation || '',
    };
  }
  if (data.analysis && typeof data.analysis === 'object') {
    const a = data.analysis as any;
    return {
      summary: a.summary || a.fullContent || '',
      sentiment: a.sentiment || 'neutral',
      confidence: a.confidence || data.sentimentScore || 85,
      affectedAssets: a.affectedAssets || [],
      impactLevel: data.impactLevel || 'low',
      recommendation: a.recommendation || '',
    };
  }
  return null;
}

// ─── SECTION TITLES (English) ───────────────────────────────────
const SECTION_TITLES_EN = {
  sourceContent: 'News from Source',
  aiAnalysis: 'AI Analysis',
  keyTakeaways: 'Key Takeaways',
  tradingInsight: 'Trading Recommendation',
  affectedAssets: 'Affected Assets',
  conclusion: 'Conclusion',
  analysisSummary: 'Analysis Summary',
  analysisIntro: 'Analysis Introduction',
  deepAnalysis: 'In-Depth Analysis',
  broaderContext: 'Broader Context',
  tradingScenarios: 'Trading Scenarios',
  tradingRecommendation: 'Trading Recommendation',
  expertConclusion: 'Expert Conclusion',
  noDetailedAnalysis: 'Detailed analysis is not yet available for this article — check the Overview tab for the full analysis.',
  noRecommendations: 'No recommendations available for this article yet — check the Overview tab for the full analysis.',
  preparingAnalysis: 'AI analysis is being prepared',
  preparingAnalysisDesc: 'AI is currently processing this article. The detailed analysis will be available soon.',
  refreshingPage: 'Refresh the page in a moment to see the full analysis.',
  source: 'Source',
  readMore: 'Read more',
  showLess: 'Show less',
  relatedTopics: 'Related Topics',
  disclaimer: 'Notice: ',
  disclaimerText: 'This content is provided for informational purposes only. It is not investment advice. Trading involves high risks.',
  translated: 'Translated',
  breaking: 'BREAKING',
};

const SECTION_TITLES_FR = {
  sourceContent: 'Actualité Source',
  aiAnalysis: 'Analyse IA',
  keyTakeaways: 'Points Clés',
  tradingInsight: 'Recommandation de Trading',
  affectedAssets: 'Actifs Affectés',
  conclusion: 'Conclusion',
  analysisSummary: 'Résumé de l\'Analyse',
  analysisIntro: 'Introduction de l\'Analyse',
  deepAnalysis: 'Analyse Approfondie',
  broaderContext: 'Contexte Élargi',
  tradingScenarios: 'Scénarios de Trading',
  tradingRecommendation: 'Recommandation de Trading',
  expertConclusion: 'Conclusion de l\'Expert',
  noDetailedAnalysis: 'L\'analyse détaillée n\'est pas encore disponible pour cet article — consultez l\'onglet Aperçu pour l\'analyse complète.',
  noRecommendations: 'Aucune recommandation disponible pour cet article — consultez l\'onglet Aperçu pour l\'analyse complète.',
  preparingAnalysis: 'L\'analyse IA est en cours de préparation',
  preparingAnalysisDesc: 'L\'IA traite actuellement cet article. L\'analyse détaillée sera bientôt disponible.',
  refreshingPage: 'Actualisez la page dans un instant pour voir l\'analyse complète.',
  source: 'Source',
  readMore: 'Lire la suite',
  showLess: 'Voir moins',
  relatedTopics: 'Sujets Connexes',
  disclaimer: 'Avertissement : ',
  disclaimerText: 'Ce contenu est fourni à titre informatif uniquement. Il ne s\'agit pas de conseils en investissement. Le trading comporte des risques élevés.',
  translated: 'Traduit',
  breaking: 'FLASH',
};

const SECTION_TITLES_TR = {
  sourceContent: 'Kaynak Haber',
  aiAnalysis: 'Yapay Zeka Analizi',
  keyTakeaways: 'Önemli Çıkarımlar',
  tradingInsight: 'İşlem Tavsiyesi',
  affectedAssets: 'Etkilenen Varlıklar',
  conclusion: 'Sonuç',
  analysisSummary: 'Analiz Özeti',
  analysisIntro: 'Analiz Girişi',
  deepAnalysis: 'Derinlemesine Analiz',
  broaderContext: 'Daha Geniş Bağlam',
  tradingScenarios: 'İşlem Senaryoları',
  tradingRecommendation: 'İşlem Tavsiyesi',
  expertConclusion: 'Uzman Sonucu',
  noDetailedAnalysis: 'Bu makale için detaylı analiz henüz mevcut değil — tam analiz için Genel Bakış sekmesine bakın.',
  noRecommendations: 'Bu makale için henüz tavsiye mevcut değil — tam analiz için Genel Bakış sekmesine bakın.',
  preparingAnalysis: 'Yapay zeka analizi hazırlanıyor',
  preparingAnalysisDesc: 'Yapay zeka şu anda bu makaleyi işliyor. Detaylı analiz yakında mevcut olacak.',
  refreshingPage: 'Tam analizi görmek için biraz sonra sayfayı yenileyin.',
  source: 'Kaynak',
  readMore: 'Devamını oku',
  showLess: 'Daha az göster',
  relatedTopics: 'İlgili Konular',
  disclaimer: 'Uyarı: ',
  disclaimerText: 'Bu içerik yalnızca bilgilendirme amacıyla sağlanmaktadır. Yatırım tavsiyesi değildir. İşlem yüksek riskler içerir.',
  translated: 'Çevrildi',
  breaking: 'SON DAKİKA',
};

const SECTION_TITLES_ES = {
  sourceContent: 'Contenido Original',
  aiAnalysis: 'Análisis IA',
  keyTakeaways: 'Puntos Clave',
  tradingInsight: 'Perspectiva de Trading',
  affectedAssets: 'Activos Afectados',
  conclusion: 'Conclusión',
  analysisSummary: 'Resumen del Análisis',
  analysisIntro: 'Introducción del Análisis',
  deepAnalysis: 'Análisis Detallado',
  broaderContext: 'Contexto Amplio',
  tradingScenarios: 'Escenarios de Trading',
  tradingRecommendation: 'Recomendación de Trading',
  expertConclusion: 'Conclusión del Experto',
  noDetailedAnalysis: 'El análisis detallado aún no está disponible para este artículo — consulta la pestaña Resumen para el análisis completo.',
  noRecommendations: 'No hay recomendaciones disponibles para este artículo — consulta la pestaña Resumen para el análisis completo.',
  preparingAnalysis: 'El análisis IA se está preparando',
  preparingAnalysisDesc: 'La IA está procesando este artículo. El análisis detallado estará disponible pronto.',
  refreshingPage: 'Actualiza la página en un momento para ver el análisis completo.',
  source: 'Fuente',
  readMore: 'Leer más',
  showLess: 'Mostrar menos',
  relatedTopics: 'Temas Relacionados',
  disclaimer: 'Aviso: ',
  disclaimerText: 'Este contenido se proporciona únicamente con fines informativos. No es asesoramiento de inversión. El trading conlleva altos riesgos.',
  translated: 'Traducido',
  breaking: 'ÚLTIMA HORA',
};

interface EnNewsArticleClientProps {
  article: ArticleData;
  locale?: 'en' | 'fr' | 'tr' | 'es';
}

export default function EnNewsArticleClient({ article, locale = 'en' }: EnNewsArticleClientProps) {
  const isFr = locale === 'fr';
  const isTr = locale === 'tr';
  const isEs = locale === 'es';
  const SECTION_TITLES = isEs ? SECTION_TITLES_ES : isTr ? SECTION_TITLES_TR : isFr ? SECTION_TITLES_FR : SECTION_TITLES_EN;
  // Helper for inline locale-aware text: (Arabic, English, French, Turkish, Spanish)
  const t = (_ar: string, en: string, fr: string, tr: string, es?: string) => isEs ? (es || en) : isTr ? tr : isFr ? fr : en;
  const localeDate = isEs ? 'es-ES' : isTr ? 'tr-TR' : isFr ? 'fr-FR' : 'en-US';
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [sourceExpanded, setSourceExpanded] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Source content: use contentText (original English article text)
  const contentText = article.contentText || '';
  const [aiAnalysis] = useState<NewsAnalysis | null>(() => buildAiAnalysis(article));

  // Clean content text from Markdown for display
  const cleanContentText = sanitizeDisplayText(stripDisplayMarkdown(contentText));

  const [relatedArticles, setRelatedArticles] = useState<
    { id: string; title: string; summary: string; score: number; category: string; slug?: string; sentiment?: string; impactLevel?: string; publishedAt?: string; imageUrl?: string }[]
  >([]);
  const [relatedFilter, setRelatedFilter] = useState<FilterType>('all');
  const [relatedCategory, setRelatedCategory] = useState('all');
  const [relatedViewMode, setRelatedViewMode] = useState<'grid' | 'timeline'>('grid');

  // ═══ ALL hooks declared BEFORE any conditional returns ═══
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    async function fetchRelated() {
      try {
        const searchRes = await fetch(`/api/search/semantic?q=${encodeURIComponent(article.title)}&limit=4&minScore=0.2&locale=${locale}`);
        const searchData = await searchRes.json();
        if (searchData.results) {
          setRelatedArticles(searchData.results
            .filter((r: any) => r.id !== article.id)
            .map((r: any) => ({
              id: r.id,
              title: r.title || '',
              summary: r.summary || '',
              score: r.score || 0,
              category: r.category || '',
              slug: r.slug || r.id,
              sentiment: r.sentiment || undefined,
              impactLevel: r.impactLevel || undefined,
              publishedAt: r.publishedAt || r.fetchedAt || undefined,
              imageUrl: r.imageUrl || undefined,
            }))
          );
        }
      } catch {}
    }
    if (article.title) fetchRelated();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article.title]);

  const storeHydrated = useUserStoreHydrated();

  useEffect(() => {
    if (!mounted || !storeHydrated) return;
    const timer = setTimeout(() => {
      useUserStore.getState().addToHistory({
        id: article.id, title: article.title,
        source: article.source, category: article.category,
      });
    }, 0);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article.id, mounted, storeHydrated]);

  const handleToggleBookmark = useCallback(() => {
    const store = useUserStore.getState();
    if (store.isBookmarked(article.id)) {
      store.removeBookmark(article.id);
      toast({ title: t('', 'Removed', 'Supprimé', 'Kaldırıldı', 'Eliminado'), description: t('', 'Article removed from bookmarks', 'Article retiré des favoris', 'Makale favorilerden kaldırıldı', 'Artículo eliminado de guardados') });
    } else {
      store.addBookmark({
        id: article.id, title: article.title,
        summary: article.summary,
        source: article.source, category: article.category,
        sentiment: article.sentiment, impactLevel: article.impactLevel,
        url: `/${locale}/news/${article.slug || article.id}`, imageUrl: article.imageUrl,
      });
      toast({ title: t('', 'Saved', 'Enregistré', 'Kaydedildi', 'Guardado'), description: t('', 'Article added to bookmarks', 'Article ajouté aux favoris', 'Makale favorilere eklendi', 'Artículo añadido a guardados') });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article.id, toast, isFr, locale]);

  // ═══ ALL hooks above — conditional returns safe below ═══

  const getImpactBadge = (impact: string) => {
    if (impact === 'high') return { text: t('', 'High Impact', 'Impact Élevé', 'Yüksek Etki', 'Alto Impacto'), bg: 'rgba(244,63,94,0.12)', color: 'var(--bear)' };
    if (impact === 'medium') return { text: t('', 'Medium Impact', 'Impact Moyen', 'Orta Etki', 'Impacto Medio'), bg: 'rgba(232,160,32,0.12)', color: 'var(--gold)' };
    return { text: t('', 'Low Impact', 'Faible Impact', 'Düşük Etki', 'Bajo Impacto'), bg: 'rgba(100,116,139,0.12)', color: 'var(--neutral)' };
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'positive') return 'var(--bull)';
    if (sentiment === 'negative') return 'var(--bear)';
    return 'var(--neutral)';
  };

  const impact = getImpactBadge(article.impactLevel);
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(localeDate, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
  };

  const displayTitle = sanitizeDisplayText(article.title);
  const displaySummary = article.summary ? sanitizeDisplayText(article.summary) : '';
  const readingTime = Math.max(1, Math.ceil((article.wordCount || (displaySummary?.length || 0)) / 200));
  const hasImage = !!article.imageUrl;

  // English page: source content is English text from contentText
  const hasSourceContentFlag = article.hasSourceContent && contentText.length > 20 && article.source !== 'رؤى' && article.source !== 'Rouaa' ;
  const hasAIContent = !!(article.introduction || article.body || article.conclusion || article.content);

  const PREVIEW_LINES = 3;
  const displayCategory = article.category;
  const catCfg = categoryConfig[displayCategory] || { css: 'cat-economy', label: displayCategory, labelFr: displayCategory, labelTr: displayCategory, labelEs: displayCategory };

  const displayContentText = cleanContentText;

  // ── Build Table of Contents ──
  const keyTakeawaysCount = article.keyTakeaways?.length ?? 0;
  const hasRecommendation = !!aiAnalysis?.recommendation;
  const affectedAssetsCount = aiAnalysis?.affectedAssets?.length ?? 0;
  const hasConclusion = !!article.conclusion;

  const tocItems: TocItem[] = useMemo(() => {
    const items: TocItem[] = [];
    if (hasSourceContentFlag) items.push({ id: 'source-content', label: SECTION_TITLES.sourceContent, level: 1 });
    if (hasAIContent) {
      items.push({ id: 'ai-analysis', label: SECTION_TITLES.aiAnalysis, level: 1 });
      if (keyTakeawaysCount > 0) items.push({ id: 'key-takeaways', label: SECTION_TITLES.keyTakeaways, level: 2 });
      if (hasRecommendation) items.push({ id: 'trading-insight', label: SECTION_TITLES.tradingInsight, level: 2 });
      if (affectedAssetsCount > 0) items.push({ id: 'affected-assets', label: SECTION_TITLES.affectedAssets, level: 2 });
      if (hasConclusion) items.push({ id: 'conclusion', label: SECTION_TITLES.conclusion, level: 2 });
    }
    return items;
  }, [hasSourceContentFlag, hasAIContent, keyTakeawaysCount, hasRecommendation, affectedAssetsCount, hasConclusion]);

  // ── TTS text ──
  const ttsText = [article.contentText, article.introduction, article.body, article.conclusion].filter(Boolean).join('. ');

  // ── Current page URL ──
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  // ── Analysis tab content builders ──
  const analysisSections = useMemo(() => parseAnalysisSections(article.content || '', locale), [article.content, locale]);

  const overviewTab = (
    <div>
      {article.content && (
        <div className="mb-6 p-5 rounded-xl" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <span className="text-[13px] font-bold" style={{ color: 'var(--cyan)' }}>{SECTION_TITLES.analysisSummary}</span>
          </div>
          {analysisSections.length > 1 ? (
            <div className="space-y-4">
              {analysisSections.map((section) => {
                const config = sectionConfig[section.num];
                if (!config) {
                  return (
                    <div key={section.num}>
                      {splitIntoParagraphs(section.content).map((para: string, i: number) => (
                        <p key={i} className="mb-2 text-[15px] leading-[2.2]" style={{ color: 'var(--text)', direction: 'ltr' }}>{para}</p>
                      ))}
                    </div>
                  );
                }
                return (
                  <div key={section.num} className="p-4 rounded-xl" style={{
                    background: section.num === 5 ? 'rgba(249,115,22,0.04)' : section.num === 6 ? 'rgba(0,201,167,0.04)' : 'rgba(255,255,255,0.02)',
                    border: '1px solid',
                    borderColor: section.num === 5 ? 'rgba(249,115,22,0.12)' : section.num === 6 ? 'rgba(0,201,167,0.12)' : 'var(--border)',
                    borderLeftWidth: '3px',
                    borderLeftColor: config.color,
                  }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ background: `${config.color}18`, color: config.color, border: `1px solid ${config.color}30` }}>
                        [{section.num}]
                      </span>
                      <span className="text-[13px] font-bold" style={{ color: config.color }}>{isEs ? config.titleEs : isTr ? config.titleTr : isFr ? config.titleFr : config.title}</span>
                    </div>
                    <div className="text-[15px] leading-[2.2]" style={{ color: 'var(--text)', direction: 'ltr' }}>
                      {splitIntoParagraphs(section.content).map((para: string, i: number) => (
                        <p key={i} className="mb-2">{para}</p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-[15px] leading-[2.2]" style={{ color: 'var(--text)', direction: 'ltr' }}>
              {splitIntoParagraphs(stripDisplayMarkdown(ensureString(article.content))).map((para: string, i: number) => (
                <p key={i} className="mb-3">{para}</p>
              ))}
            </div>
          )}
        </div>
      )}
      {article.keyTakeaways && article.keyTakeaways.length > 0 && (
        <div id="key-takeaways"><InsightCard insights={ensureStringArray(article.keyTakeaways)} locale={locale} /></div>
      )}
      {aiAnalysis?.recommendation && (
        <div id="trading-insight"><TradingInsightCard insight={ensureString(aiAnalysis.recommendation)} locale={locale} /></div>
      )}
    </div>
  );

  // Extract sections for use across tabs — compute once
  const section4Content = useMemo(() => {
    const s4 = analysisSections.find(s => s.num === 4);
    return s4 ? s4.content : '';
  }, [analysisSections]);
  const section5Content = useMemo(() => {
    const s5 = analysisSections.find(s => s.num === 5);
    return s5 ? s5.content : '';
  }, [analysisSections]);
  const section6Content = useMemo(() => {
    const s6 = analysisSections.find(s => s.num === 6);
    return s6 ? s6.content : '';
  }, [analysisSections]);
  const section2Content = useMemo(() => {
    const s2 = analysisSections.find(s => s.num === 2);
    return s2 ? s2.content : '';
  }, [analysisSections]);
  const section3Content = useMemo(() => {
    const s3 = analysisSections.find(s => s.num === 3);
    return s3 ? s3.content : '';
  }, [analysisSections]);

  const detailedTab = (
    <div>
      {article.introduction ? (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span className="text-[13px] font-bold" style={{ color: 'var(--cyan)' }}>{SECTION_TITLES.analysisIntro}</span>
          </div>
          <div className="text-[16px] leading-[2.2]" style={{ color: 'var(--text)', direction: 'ltr' }}>
            {splitIntoParagraphs(ensureString(article.introduction)).map((para: string, i: number) => (
              <p key={i} className="mb-4">{para}</p>
            ))}
          </div>
        </div>
      ) : null}

      {article.body ? (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <span className="text-[13px] font-bold" style={{ color: '#a78bfa' }}>{SECTION_TITLES.deepAnalysis}</span>
          </div>
          <div className="text-[16px] leading-[2.2] prose-article" style={{ color: 'var(--text2)', direction: 'ltr' }}>
            {splitIntoParagraphs(ensureString(article.body)).map((para: string, i: number) => (
              <p key={i} className="mb-4">{para}</p>
            ))}
          </div>
        </div>
      ) : null}

      {section4Content && !article.body && (
        <div className="mb-6 p-5 rounded-xl" style={{ background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.12)', borderLeft: '3px solid #a78bfa' }}>
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/></svg>
            <span className="text-[13px] font-bold" style={{ color: '#a78bfa' }}>{SECTION_TITLES.broaderContext}</span>
          </div>
          <div className="text-[15px] leading-[2.2]" style={{ color: 'var(--text)', direction: 'ltr' }}>
            {splitIntoParagraphs(section4Content).map((para: string, i: number) => (
              <p key={i} className="mb-3">{para}</p>
            ))}
          </div>
        </div>
      )}

      {section5Content && !article.body && (
        <div className="mb-6 p-5 rounded-xl" style={{ background: 'rgba(249,115,22,0.04)', border: '1px solid rgba(249,115,22,0.12)', borderLeft: '3px solid #f97316' }}>
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            <span className="text-[13px] font-bold" style={{ color: '#f97316' }}>{SECTION_TITLES.tradingScenarios}</span>
          </div>
          <div className="text-[15px] leading-[2.2]" style={{ color: 'var(--text)', direction: 'ltr' }}>
            {splitIntoParagraphs(section5Content).map((para: string, i: number) => (
              <p key={i} className="mb-3">{para}</p>
            ))}
          </div>
        </div>
      )}

      {!article.introduction && !article.body && !section4Content && !section5Content && !article.content && (
        <div className="text-[14px] leading-[2] p-6 rounded-xl" style={{ color: 'var(--text3)', background: 'var(--bg4)', border: '1px solid var(--border)' }}>
          {SECTION_TITLES.noDetailedAnalysis}
        </div>
      )}
    </div>
  );

  // Extract assets from [2] and [3] sections for assets tab enrichment
  const extractedAssetsFromSections = useMemo(() => {
    const assets: {symbol: string; name: string; direction: string; reason: string}[] = [];
    for (const secContent of [section2Content, section3Content]) {
      if (!secContent) continue;
      const lines = secContent.split('\n').filter(l => l.trim());
      for (const line of lines) {
        const pipeParts = line.split('|').map(s => s.trim());
        if (pipeParts.length >= 2) {
          const namePart = pipeParts[0];
          const dirPart = pipeParts[1];
          const reasonPart = pipeParts[2] || '';
          let direction = 'neutral';
          if (/bullish|up|positive|upward/i.test(dirPart)) direction = 'up';
          else if (/bearish|down|negative|downward/i.test(dirPart)) direction = 'down';
          if (namePart.length > 1) {
            assets.push({ symbol: namePart, name: namePart, direction, reason: reasonPart });
          }
        }
      }
    }
    return assets;
  }, [section2Content, section3Content]);

  // Merged affected assets
  const mergedAffectedAssets = useMemo(() => {
    const aiAssets = aiAnalysis?.affectedAssets || [];
    if (aiAssets.length > 0) {
      const existingSymbols = new Set(aiAssets.map((a: any) => String(a.symbol || a.name || '').split(' ')[0]));
      const supplemental = extractedAssetsFromSections.filter(a => !existingSymbols.has(a.symbol.split(' ')[0]));
      return [...aiAssets, ...supplemental];
    }
    return extractedAssetsFromSections;
  }, [aiAnalysis?.affectedAssets, extractedAssetsFromSections]);

  const assetsTab = (
    <div>
      {aiAnalysis && <AnimatedSentimentGauge sentiment={aiAnalysis.sentiment} confidence={aiAnalysis.confidence} size="md" locale={locale} />}
      {aiAnalysis && (
        <div className="mt-4">
          <SentimentComparison
            articleSentiment={aiAnalysis.sentiment}
            articleConfidence={aiAnalysis.confidence}
            marketSentiment={article.sentiment !== aiAnalysis.sentiment ? article.sentiment : undefined}
            marketConfidence={article.sentimentScore}
            locale={locale}
          />
        </div>
      )}
      <div className="mt-4"><VolatilityIndicator impactLevel={article.impactLevel} sentimentScore={article.sentimentScore} locale={locale} /></div>
      <div id="affected-assets" className="mt-4">
        {mergedAffectedAssets && mergedAffectedAssets.length > 0 && (
          <AffectedAssetsGrid assets={mergedAffectedAssets} locale={locale} />
        )}
      </div>
      {mergedAffectedAssets && mergedAffectedAssets.length > 0 && (
        <div className="mt-4">
          <BullBearSection
            bullishFactors={ensureStringArray(mergedAffectedAssets.filter((a: any) => a.direction === 'up').map((a: any) => a.reason ? `${a.symbol} ▲ — ${ensureString(a.reason)}` : `${a.symbol} ▲`))}
            bearishFactors={ensureStringArray(mergedAffectedAssets.filter((a: any) => a.direction === 'down').map((a: any) => a.reason ? `${a.symbol} ▼ — ${ensureString(a.reason)}` : `${a.symbol} ▼`))}
            locale={locale}
          />
        </div>
      )}
      {section2Content && (
        <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.12)', borderLeft: '3px solid #22c55e' }}>
          <div className="flex items-center gap-2 mb-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
            <span className="text-[12px] font-bold" style={{ color: '#22c55e' }}>{isEs ? 'Activos Directamente Afectados' : isTr ? 'Doğrudan Etkilenen Varlıklar' : isFr ? 'Actifs Directement Affectés' : 'Directly Affected Assets'}</span>
          </div>
          <div className="text-[14px] leading-[2]" style={{ color: 'var(--text)', direction: 'ltr' }}>
            {splitIntoParagraphs(section2Content).map((para: string, i: number) => (
              <p key={i} className="mb-2">{para}</p>
            ))}
          </div>
        </div>
      )}
      {section3Content && (
        <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(234,179,8,0.04)', border: '1px solid rgba(234,179,8,0.12)', borderLeft: '3px solid #eab308' }}>
          <div className="flex items-center gap-2 mb-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            <span className="text-[12px] font-bold" style={{ color: '#eab308' }}>{isEs ? 'Activos Indirectamente Afectados' : isTr ? 'Dolaylı Etkilenen Varlıklar' : isFr ? 'Actifs Indirectement Affectés' : 'Indirectly Affected Assets'}</span>
          </div>
          <div className="text-[14px] leading-[2]" style={{ color: 'var(--text)', direction: 'ltr' }}>
            {splitIntoParagraphs(section3Content).map((para: string, i: number) => (
              <p key={i} className="mb-2">{para}</p>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4">
        <EventTimeline events={buildTimelineEvents(article, locale)} locale={locale} />
      </div>
    </div>
  );

  const recommendationsTab = (
    <div>
      {aiAnalysis?.recommendation && (
        <div className="p-5 rounded-2xl mb-6" style={{ background: 'var(--cyan3)', border: '1px solid rgba(0,201,167,0.2)', borderLeftWidth: '4px', borderLeftColor: 'var(--cyan)' }}>
          <div className="flex items-center gap-2 mb-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
            <span className="text-[14px] font-bold" style={{ color: 'var(--cyan)' }}>{SECTION_TITLES.tradingRecommendation}</span>
          </div>
          <p className="text-[15px] leading-[1.9]" style={{ color: 'var(--text)' }}>{ensureString(aiAnalysis.recommendation)}</p>
        </div>
      )}

      {article.conclusion ? (
        <div id="conclusion" className="p-6 rounded-2xl mb-6" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
            <span className="text-[15px] font-bold" style={{ color: 'var(--cyan)' }}>{SECTION_TITLES.conclusion}</span>
          </div>
          <div className="text-[15px] leading-[2.2]" style={{ color: 'var(--text)', direction: 'ltr' }}>
            {splitIntoParagraphs(ensureString(article.conclusion)).map((para: string, i: number) => (
              <p key={i} className="mb-3">{para}</p>
            ))}
          </div>
        </div>
      ) : section6Content ? (
        <div id="conclusion" className="p-6 rounded-2xl mb-6" style={{ background: 'rgba(0,201,167,0.04)', border: '1px solid rgba(0,201,167,0.12)', borderLeft: '4px solid var(--cyan)' }}>
          <div className="flex items-center gap-2 mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
            <span className="text-[15px] font-bold" style={{ color: 'var(--cyan)' }}>{SECTION_TITLES.expertConclusion}</span>
          </div>
          <div className="text-[15px] leading-[2.2]" style={{ color: 'var(--text)', direction: 'ltr' }}>
            {splitIntoParagraphs(section6Content).map((para: string, i: number) => (
              <p key={i} className="mb-3">{para}</p>
            ))}
          </div>
        </div>
      ) : null}

      {article.keyTakeaways && article.keyTakeaways.length > 0 && (
        <div className="mb-6">
          <InsightCard insights={ensureStringArray(article.keyTakeaways)} locale={locale} />
        </div>
      )}

      {!aiAnalysis?.recommendation && !article.conclusion && !section6Content && (!article.keyTakeaways || article.keyTakeaways.length === 0) && (
        <div className="text-[14px] leading-[2] p-6 rounded-xl" style={{ color: 'var(--text3)', background: 'var(--bg4)', border: '1px solid var(--border)' }}>
          {SECTION_TITLES.noRecommendations}
        </div>
      )}
    </div>
  );

  // ── Analysis Tabs (English labels, same layout as AnalysisTabs component) ──
  const analysisTabsConfig = [
    { id: 'overview', label: t('', 'Overview', 'Aperçu', 'Genel Bakış', 'Resumen'), icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4' },
    { id: 'detailed', label: t('', 'Detailed Analysis', 'Analyse Détaillée', 'Detaylı Analiz', 'Análisis Detallado'), icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'assets', label: t('', 'Assets', 'Actifs', 'Varlıklar', 'Activos'), icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { id: 'recommendations', label: t('', 'Recommendations', 'Recommandations', 'Tavsiyeler', 'Recomendaciones'), icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3' },
  ];

  const contentMap: Record<string, React.ReactNode> = {
    overview: overviewTab,
    detailed: detailedTab,
    assets: assetsTab,
    recommendations: recommendationsTab,
  };

  return (
    <main className="min-h-screen pb-16" style={{ background: 'var(--bg)' }} dir="ltr">
      {mounted && <ReadingProgressBar />}
      {mounted && <LiveUpdateBanner articleId={article.id} publishedAt={article.publishedAt} updatedAt={article.updatedAt || article.publishedAt} locale={locale} />}
      {mounted && <KeyboardShortcuts
        onToggleTTS={() => { /* TTS toggle handled by TextToSpeechBtn */ }}
        onToggleFocus={() => setFocusMode(prev => !prev)}
        onShare={() => { if (navigator.share) navigator.share({ title: displayTitle, url: pageUrl }); else { navigator.clipboard.writeText(pageUrl); toast({ title: t('', 'Link Copied', 'Lien Copié', 'Bağlantı Kopyalandı', 'Enlace Copiado') }); } }}
        onBookmark={handleToggleBookmark}
        onCloseOverlays={() => { setShowShortcutsHelp(false); setFocusMode(false); }}
        locale={locale}
      />}
      {mounted && <ShortcutsHelp show={showShortcutsHelp} onClose={() => setShowShortcutsHelp(false)} locale={locale} />}

      {/* ═══ Breadcrumb ═══ */}
      <nav className="max-w-[860px] mx-auto px-4 pt-4" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-[11px] flex-wrap" style={{ color: 'var(--text3)' }}>
          <li><Link href={`/${locale}`} className="hover:text-[var(--cyan)] transition-colors" style={{ color: 'var(--text3)' }}>{t('', 'Home', 'Accueil', 'Ana Sayfa', 'Inicio')}</Link></li>
          <li><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg></li>
          <li><Link href={`/${locale}/news`} className="hover:text-[var(--cyan)] transition-colors" style={{ color: 'var(--text3)' }}>{t('', 'News', 'Actualités', 'Haberler', 'Noticias')}</Link></li>
          <li><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg></li>
          <li className="font-medium" style={{ color: 'var(--text2)' }} aria-current="page">{isEs ? catCfg.labelEs : isTr ? catCfg.labelTr : isFr ? catCfg.labelFr : catCfg.label}</li>
        </ol>
      </nav>

      {/* ═══ Article Hero ═══ */}
      <header>
        {hasImage ? (
          <div className="relative h-[280px] md:h-[380px] lg:h-[440px] overflow-hidden">
            <ParallaxHeroImage src={article.imageUrl!} alt={displayTitle} category={displayCategory} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--bg) 0%, rgba(10,14,26,0.7) 40%, rgba(10,14,26,0.3) 100%)' }} />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-12 max-w-[860px] mx-auto">
              <div className="flex items-center gap-2.5 mb-4 flex-wrap">
                <span className="text-[11px] px-3 py-1.5 rounded-lg font-semibold backdrop-blur-md" style={{ background: 'rgba(0,201,167,0.2)', color: 'var(--cyan)', border: '1px solid rgba(0,201,167,0.25)' }}>{isEs ? catCfg.labelEs : isTr ? catCfg.labelTr : isFr ? catCfg.labelFr : catCfg.label}</span>
                <span className="text-[11px] px-2.5 py-1 rounded-full font-medium backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.4)', color: impact.color, border: '1px solid rgba(255,255,255,0.08)' }}>{impact.text}</span>
                <span className="text-[11px] px-2.5 py-1 rounded-full font-medium backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.4)', color: getSentimentColor(article.sentiment), border: '1px solid rgba(255,255,255,0.08)' }}>
                  {article.sentiment === 'positive' ? (isEs ? '▲ Alcista' : isTr ? '▲ Yükseliş' : isFr ? '▲ Haussier' : '▲ Bullish') : article.sentiment === 'negative' ? (isEs ? '▼ Bajista' : isTr ? '▼ Düşüş' : isFr ? '▼ Baissier' : '▼ Bearish') : (isEs ? '● Neutral' : isTr ? '● Nötr' : isFr ? '● Neutre' : '● Neutral')}
                </span>
                {article.newsType === 'breaking' && (
                  <span className="badge-breaking text-[10px] backdrop-blur-md" style={{ background: 'rgba(244,63,94,0.6)' }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>{SECTION_TITLES.breaking}
                  </span>
                )}
                {hasAIContent && <span className="text-[9px] px-2 py-0.5 rounded-md font-medium backdrop-blur-md" style={{ background: 'rgba(124,111,205,0.2)', color: 'var(--purple)' }}>AI</span>}
                <span className="flex-1" />
                {mounted && <BookmarkWithFolders articleId={article.id} articleTitle={displayTitle} variant="hero" onToggle={handleToggleBookmark} locale={locale} />}
              </div>
              <h1 className="text-[24px] md:text-[30px] lg:text-[36px] font-bold leading-tight mb-4 font-heading" style={{ color: 'white', direction: 'ltr' }}>{displayTitle || (isEs ? 'Artículo de Noticias' : isTr ? 'Haber Makalesi' : isFr ? 'Article de Presse' : 'News Article')}</h1>
              <div className="flex flex-wrap items-center gap-4 text-[12px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                  <span suppressHydrationWarning>{mounted ? formatDate(article.publishedAt) : article.publishedAt}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  <span>{readingTime} {isEs ? 'min lectura' : isTr ? 'dk okuma' : isFr ? 'min de lecture' : 'min read'}</span>
                </div>
                {article.source && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>{article.source.charAt(0)}</div>
                    <span>{article.sourceName || article.source}</span>
                  </div>
                )}
                {(article.views || 0) > 0 && (
                  <div className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <span style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>{article.views}</span>
                    <span>{isEs ? 'visualizaciones' : isTr ? 'görüntülenme' : isFr ? 'vues' : 'views'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-6 pb-4 max-w-[860px] mx-auto px-4">
            <div className="flex items-center gap-2.5 mb-4 flex-wrap">
              <span className="text-[11px] px-3 py-1.5 rounded-lg font-semibold" style={{ background: 'rgba(0,201,167,0.12)', color: 'var(--cyan)', border: '1px solid rgba(0,201,167,0.2)' }}>{isEs ? catCfg.labelEs : isTr ? catCfg.labelTr : isFr ? catCfg.labelFr : catCfg.label}</span>
              <span className="text-[11px] px-2.5 py-1 rounded-full font-medium" style={{ background: impact.bg, color: impact.color }}>{impact.text}</span>
              <span className="text-[11px] px-2.5 py-1 rounded-full font-medium" style={{ background: article.sentiment === 'positive' ? 'rgba(34,197,94,0.12)' : article.sentiment === 'negative' ? 'rgba(244,63,94,0.12)' : 'rgba(100,116,139,0.12)', color: getSentimentColor(article.sentiment) }}>
                {article.sentiment === 'positive' ? (isEs ? '▲ Alcista' : isTr ? '▲ Yükseliş' : isFr ? '▲ Haussier' : '▲ Bullish') : article.sentiment === 'negative' ? (isEs ? '▼ Bajista' : isTr ? '▼ Düşüş' : isFr ? '▼ Baissier' : '▼ Bearish') : (isEs ? '● Neutral' : isTr ? '● Nötr' : isFr ? '● Neutre' : '● Neutral')}
              </span>
              {article.newsType === 'breaking' && <span className="badge-breaking text-[10px]"><svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>{SECTION_TITLES.breaking}</span>}
              {hasAIContent && <span className="text-[9px] px-2 py-0.5 rounded-md font-medium" style={{ background: 'rgba(124,111,205,0.12)', color: 'var(--purple)' }}>AI</span>}
            </div>
            <h1 className="text-[24px] md:text-[30px] font-bold leading-tight mb-3 font-heading" style={{ color: 'var(--text)', direction: 'ltr' }}>{displayTitle || (isEs ? 'Artículo de Noticias' : isTr ? 'Haber Makalesi' : isFr ? 'Article de Presse' : 'News Article')}</h1>
            <div className="flex flex-wrap items-center gap-4 text-[12px] mb-4" style={{ color: 'var(--text3)' }}>
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                <span suppressHydrationWarning>{mounted ? formatDate(article.publishedAt) : article.publishedAt}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                <span>{readingTime} {isEs ? 'min lectura' : isTr ? 'dk okuma' : isFr ? 'min de lecture' : 'min read'}</span>
              </div>
              {article.source && <span className="flex items-center gap-1.5">{article.sourceName || article.source}</span>}
              {(article.views || 0) > 0 && (
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>{article.views}</span>
                  <span>{isEs ? 'visualizaciones' : isTr ? 'görüntülenme' : isFr ? 'vues' : 'views'}</span>
                </div>
              )}
              <span className="flex-1" />
              {mounted && <BookmarkWithFolders articleId={article.id} articleTitle={displayTitle} onToggle={handleToggleBookmark} locale={locale} />}
            </div>
          </div>
        )}
      </header>

      {/* ═══ Action Bar: Share + TTS + Print ═══ */}
      {mounted && <div className="max-w-[860px] mx-auto px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <ShareBar title={displayTitle} url={pageUrl} summary={displaySummary} sentiment={article.sentiment} source={article.source} variant="inline" locale={locale} />
          <span className="flex-1" />
          <FocusMode locale={locale}>{''}</FocusMode>
          <TextToSpeechBtn text={ttsText} locale={locale} />
          <PrintBtn locale={locale} />
          <ReadingStats wordCount={article.wordCount || displaySummary?.split(/\s+/).length || 0} locale={locale} />
          <button
            onClick={() => setShowShortcutsHelp(true)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all hover:bg-[var(--bg4)]"
            style={{ border: '1px solid var(--border)', color: 'var(--text3)' }}
            title={isEs ? 'Atajos de teclado' : isTr ? 'Klavye kısayolları' : isFr ? 'Raccourcis clavier' : 'Keyboard shortcuts'}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/></svg>
          </button>
        </div>
      </div>}

      {/* ═══ SEO: JSON-LD ═══ */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          "headline": displayTitle,
          "description": displaySummary,
          "datePublished": article.publishedAt,
          "author": { "@type": "Organization", "name": article.source || "Rouaa" },
          "publisher": { "@type": "Organization", "name": "Rouaa", "logo": { "@type": "ImageObject", "url": "/favicon.svg" } },
          "inLanguage": locale,
          ...(article.imageUrl ? { "image": article.imageUrl } : {}),
        })
      }} />

      {/* ═══ Main Content + Sidebar Layout ═══ */}
      <div className="max-w-[1360px] mx-auto px-4">
        {/* V1039 FIX: Added min-w-0 to article so it can shrink below its
            content's intrinsic width on mobile. Without this, flex items
            have implicit min-width: auto, which prevents shrinking below
            content size. On mobile (375px viewport), the article's content
            (paragraphs, code blocks, images) forced it to 482px wide,
            overflowing the 343px parent and causing horizontal scroll. */}
        <div className="flex gap-4 lg:gap-8">
          {/* ── Sidebar (TOC) — Desktop only ── */}
          <aside className="hidden lg:block w-[200px] flex-shrink-0">
            <div className="sticky top-20">
              <TableOfContents items={tocItems} locale={locale} />
            </div>
          </aside>

          {/* ── Main Article Content ── */}
          <article className="flex-1 max-w-[860px] min-w-0">

            {/* ═══ SECTION 1: SOURCE CONTENT ═══ */}
            <section id="source-content" className="mb-10">
              {displaySummary && article.source !== 'رؤى' && article.source !== 'Rouaa' && article.source !== 'محرر رؤى الذكي' && (
                <div className="p-5 rounded-2xl mb-6" style={{ background: 'rgba(0,201,167,0.04)', border: '1px solid rgba(0,201,167,0.12)', borderLeft: '4px solid var(--cyan)' }}>
                  <p className="text-[15px] leading-[2] font-medium" style={{ color: 'var(--text)' }}>{displaySummary}</p>
                </div>
              )}

              {/* V1069: For Rouaa original articles, show the FULL article body in a proper
                  labeled section — same visual structure as aggregated news "News from Source"
                  including the expand/collapse "Read more" button */}
              {article.source === 'رؤى' || article.source === 'Rouaa' ? (
                contentText && contentText.length > 30 ? (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                      <span className="text-[12px] font-bold" style={{ color: 'var(--cyan)' }}>{SECTION_TITLES.sourceContent}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: 'rgba(0,201,167,0.1)', color: 'var(--cyan)', border: '1px solid rgba(0,201,167,0.15)' }}>{article.sourceName || article.source}</span>
                    </div>

                    <div className="text-[16px] leading-[2.2] mb-4" style={{
                      color: 'var(--text)',
                      direction: 'ltr',
                      display: '-webkit-box',
                      WebkitLineClamp: sourceExpanded ? 'unset' : PREVIEW_LINES,
                      WebkitBoxOrient: 'vertical',
                      overflow: sourceExpanded ? 'visible' : 'hidden',
                    }}>
                      {splitIntoParagraphs(stripDisplayMarkdown(cleanContentText)).map((para: string, i: number) => (
                        <p key={i} className="mb-3" dir="ltr">
                          <SymbolLinkedText text={para} />
                        </p>
                      ))}
                    </div>

                    {!sourceExpanded && cleanContentText.length > 100 && (
                      <button onClick={() => setSourceExpanded(true)} className="w-full py-3.5 rounded-xl text-[14px] font-bold transition-all duration-300" style={{ background: 'rgba(0,201,167,0.06)', border: '1px solid rgba(0,201,167,0.2)', color: 'var(--cyan)' }}>
                        <span className="flex items-center justify-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                          {SECTION_TITLES.readMore}
                        </span>
                      </button>
                    )}
                    {sourceExpanded && (
                      <button onClick={() => setSourceExpanded(false)} className="w-full py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 mt-2" style={{ background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text3)' }}>
                        <span className="flex items-center justify-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
                          {SECTION_TITLES.showLess}
                        </span>
                      </button>
                    )}

                    <div className="mt-4 p-3 rounded-lg flex items-center gap-2" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                      <span className="text-[11px]" style={{ color: 'var(--text3)' }}>{SECTION_TITLES.source}: {article.sourceName || article.source}</span>
                    </div>
                  </div>
                ) : displaySummary ? (
                  <div className="p-5 rounded-2xl mb-6" style={{ background: 'rgba(0,201,167,0.04)', border: '1px solid rgba(0,201,167,0.12)', borderLeft: '4px solid var(--cyan)' }}>
                    <p className="text-[15px] leading-[2] font-medium" style={{ color: 'var(--text)' }}>{displaySummary}</p>
                  </div>
                ) : null
              ) : hasSourceContentFlag && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    <span className="text-[12px] font-bold" style={{ color: 'var(--cyan)' }}>{SECTION_TITLES.sourceContent}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: 'rgba(0,201,167,0.1)', color: 'var(--cyan)', border: '1px solid rgba(0,201,167,0.15)' }}>{article.sourceName || article.source}</span>
                  </div>

                  <div className="text-[16px] leading-[2.2] mb-4" style={{
                    color: 'var(--text)',
                    direction: 'ltr',
                    display: '-webkit-box',
                    WebkitLineClamp: sourceExpanded ? 'unset' : PREVIEW_LINES,
                    WebkitBoxOrient: 'vertical',
                    overflow: sourceExpanded ? 'visible' : 'hidden',
                  }}>
                    {splitIntoParagraphs(stripDisplayMarkdown(displayContentText)).map((para, i) => (
                      <p key={i} className="mb-3" dir="ltr">{para}</p>
                    ))}
                  </div>

                  {!sourceExpanded && displayContentText.length > 100 && (
                    <button onClick={() => setSourceExpanded(true)} className="w-full py-3.5 rounded-xl text-[14px] font-bold transition-all duration-300" style={{ background: 'rgba(0,201,167,0.06)', border: '1px solid rgba(0,201,167,0.2)', color: 'var(--cyan)' }}>
                      <span className="flex items-center justify-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                        {SECTION_TITLES.readMore}
                      </span>
                    </button>
                  )}
                  {sourceExpanded && (
                    <button onClick={() => setSourceExpanded(false)} className="w-full py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 mt-2" style={{ background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text3)' }}>
                      <span className="flex items-center justify-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
                        {SECTION_TITLES.showLess}
                      </span>
                    </button>
                  )}

                  <div className="mt-4 p-3 rounded-lg flex items-center gap-2" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    <span className="text-[11px]" style={{ color: 'var(--text3)' }}>{SECTION_TITLES.source}: {article.sourceName || article.source}</span>
                  </div>
                </div>
              )}

              {!hasSourceContentFlag && !article.content && !hasAIContent && article.source && (
                <div className="p-4 rounded-xl mb-6 flex items-center gap-2" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                  <span className="text-[12px]" style={{ color: 'var(--text3)' }}>{SECTION_TITLES.source}: {article.sourceName || article.source}</span>
                </div>
              )}
            </section>

            {/* ═══ AI DIVIDER ═══ */}
            {hasAIContent && (
              <div id="ai-analysis" className="flex items-center gap-3 mb-8">
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(124,111,205,0.08)', border: '1px solid rgba(124,111,205,0.15)' }}>
                  <span className="badge-ai text-[9px]">AI</span>
                  <span className="text-[11px] font-bold" style={{ color: 'var(--purple)' }}>{SECTION_TITLES.aiAnalysis}</span>
                </div>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>
            )}

            {/* ═══ SECTION 2: AI ANALYSIS ═══ */}
            <section className="mb-8">
              {hasAIContent ? (
                <div>
                  {/* Tab buttons — English labels, same styling as AnalysisTabs */}
                  <div className="flex items-center gap-1 mb-5 border-b" style={{ borderColor: 'var(--border)' }}>
                    {analysisTabsConfig.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-semibold transition-all relative"
                        style={{
                          color: activeTab === tab.id ? 'var(--purple)' : 'var(--text3)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={tab.icon}/></svg>
                        {tab.label}
                        {activeTab === tab.id && (
                          <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full" style={{ background: 'var(--purple)' }} />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  <div className="p-5 rounded-xl" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
                    {contentMap[activeTab]}
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl text-center" style={{ background: 'rgba(124,111,205,0.06)', border: '1px solid rgba(124,111,205,0.15)' }}>
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(124,111,205,0.12)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="1.5"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z"/></svg>
                  </div>
                  <h3 className="text-[16px] font-bold mb-2" style={{ color: 'var(--purple)' }}>{SECTION_TITLES.preparingAnalysis}</h3>
                  <p className="text-[13px] leading-[1.8]" style={{ color: 'var(--text3)' }}>{SECTION_TITLES.refreshingPage}</p>
                </div>
              )}
            </section>

            {/* Disclaimer */}
            <div className="mt-6 p-4 rounded-xl text-[11px] leading-relaxed" style={{ background: 'rgba(232,160,32,0.04)', border: '1px solid rgba(232,160,32,0.12)' }}>
              <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{SECTION_TITLES.disclaimer}</span>
              <span style={{ color: 'var(--text3)' }}>{SECTION_TITLES.disclaimerText}</span>
            </div>
          </article>

          {/* ── Right Sidebar Widgets — Desktop only ── */}
          <aside className="hidden lg:block w-[280px] flex-shrink-0">
            <div className="sticky top-24 flex flex-col gap-5">
              <SmartCouncilWidget locale={locale} />
              <MostReadWidget locale={locale} />
              <EconomicCalendarWidget locale={locale} />
            </div>
          </aside>
        </div>
      </div>

      {/* ═══ Floating Share Bar — Desktop ═══ */}
      {mounted && <ShareBar title={displayTitle} url={pageUrl} summary={displaySummary} sentiment={article.sentiment} source={article.source} variant="floating" locale={locale} />}

      {/* ═══ News Chain (Ongoing Story) ═══ */}
      {mounted && relatedArticles.length >= 2 && (
        <div className="max-w-[860px] mx-auto px-4 mb-6">
          <NewsChain articles={relatedArticles} basePath={`/${locale}/news`} currentArticleId={article.id} locale={locale} />
        </div>
      )}

      {/* ═══ Related Articles ═══ */}
      {relatedArticles.length > 0 && (
        <section className="py-8" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="max-w-[860px] mx-auto px-4">
            <div className="flex items-center gap-2 mb-5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <h3 className="text-[20px] font-bold font-heading" style={{ color: 'var(--text)' }}>{SECTION_TITLES.relatedTopics}</h3>
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => setRelatedViewMode('grid')}
                  className="p-1.5 rounded-md transition-all"
                  style={{
                    background: relatedViewMode === 'grid' ? 'var(--cyan2)' : 'transparent',
                    color: relatedViewMode === 'grid' ? 'var(--cyan)' : 'var(--text3)',
                    border: '1px solid ' + (relatedViewMode === 'grid' ? 'rgba(0,229,255,0.3)' : 'var(--border)'),
                  }}
                  aria-label="Grid view"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                </button>
                <button
                  onClick={() => setRelatedViewMode('timeline')}
                  className="p-1.5 rounded-md transition-all"
                  style={{
                    background: relatedViewMode === 'timeline' ? 'var(--cyan2)' : 'transparent',
                    color: relatedViewMode === 'timeline' ? 'var(--cyan)' : 'var(--text3)',
                    border: '1px solid ' + (relatedViewMode === 'timeline' ? 'rgba(0,229,255,0.3)' : 'var(--border)'),
                  }}
                  aria-label="Timeline view"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                </button>
              </div>
            </div>
            <RelatedNewsFilters
              categories={[...new Set(relatedArticles.map(a => a.category).filter(Boolean))]}
              activeFilter={relatedFilter}
              activeCategory={relatedCategory}
              onFilterChange={setRelatedFilter}
              onCategoryChange={setRelatedCategory}
              locale={locale}
            />
            {relatedViewMode === 'grid' ? (
              <RelatedNewsGrid articles={relatedArticles.filter(a => {
                if (relatedFilter !== 'all' && a.sentiment !== relatedFilter) return false;
                if (relatedCategory !== 'all' && a.category !== relatedCategory) return false;
                return true;
              })} basePath={`/${locale}/news`} locale={locale} />
            ) : (
              <RelatedNewsTimeline articles={relatedArticles.filter(a => {
                if (relatedFilter !== 'all' && a.sentiment !== relatedFilter) return false;
                if (relatedCategory !== 'all' && a.category !== relatedCategory) return false;
                return true;
              })} basePath={`/${locale}/news`} locale={locale} />
            )}
          </div>
        </section>
      )}

      {/* ═══ Comments Section ═══ */}
      {mounted && <div className="max-w-[860px] mx-auto px-4">
        <CommentsSection newsId={article.id} locale={locale} />
      </div>}

      <BackToTop />
    </main>
  );
}

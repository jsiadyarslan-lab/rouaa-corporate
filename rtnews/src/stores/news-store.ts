import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

// Re-export useShallow for convenient usage in components
export { useShallow };

export interface LiveNewsItem {
  id: string;
  title: string;
  summary: string;
  time: string;
  source: string;
  url: string;
  category: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  impactLevel: 'high' | 'medium' | 'low';
  originalLanguage: 'ar' | 'en';
  newsType?: 'live' | 'breaking' | 'article';
  imageUrl?: string;
  slug?: string;
  // Translation fields
  translatedTitle?: string;
  translatedSummary?: string;
  isTranslating?: boolean;
  // AI Analysis fields
  aiAnalysis?: NewsAnalysis;
  isAnalyzing?: boolean;
  // ── Article cache indicators ──
  hasFullContent?: boolean;
  cachedSentiment?: string;
  cachedRecommendation?: string;
  cachedKeyTakeaways?: string[];
  cachedAffectedAssets?: { symbol: string; direction?: string; reason?: string }[];
}

export interface BreakingNewsItem {
  id: string;
  title: string;
  summary: string;
  time: string;
  source: string;
  url: string;
  affectedAssets: { symbol: string; change: number }[];
  isBreaking: boolean;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  impactLevel: 'high' | 'medium' | 'low';
  originalLanguage: 'ar' | 'en';
  category?: string;
  newsType?: 'live' | 'breaking' | 'article';
  imageUrl?: string;
  slug?: string;
  // Translation fields
  translatedTitle?: string;
  translatedSummary?: string;
  titleAr?: string;
  summaryAr?: string;
  // AI Analysis fields
  aiAnalysis?: NewsAnalysis;
  isAnalyzing?: boolean;
  // ── Article cache indicators ──
  hasFullContent?: boolean;
  cachedSentiment?: string;
  cachedRecommendation?: string;
  cachedKeyTakeaways?: string[];
  cachedAffectedAssets?: { symbol: string; direction?: string; reason?: string }[];
}

export interface NewsAnalysis {
  summary: string;
  sentiment: string;
  confidence: number;
  affectedAssets: { symbol: string; direction: string }[];
  impactLevel: string;
  recommendation: string;
}

interface CoachMessage {
  text: string;
  type: 'user' | 'bot';
}

interface NewsState {
  // Live news
  liveNews: LiveNewsItem[];
  liveNewsLoading: boolean;
  liveNewsError: string | null;
  liveNewsLastUpdate: string | null;
  
  // Breaking news
  breakingNews: BreakingNewsItem[];
  breakingNewsLoading: boolean;
  breakingNewsError: string | null;
  breakingNewsLastUpdate: string | null;
  
  // New breaking news alert
  newBreakingAlert: BreakingNewsItem | null;
  
  // Analysis cache
  analysisCache: Record<string, NewsAnalysis>;
  analysisLoading: Record<string, boolean>;
  
  // Translation cache
  translationCache: Record<string, { translatedTitle: string; translatedSummary: string }>;
  translationLoading: Record<string, boolean>;
  
  // AI Coach
  coachMessages: CoachMessage[];
  coachLoading: boolean;
  coachError: string | null;
  
  // Auto-refresh settings
  autoRefresh: boolean;
  refreshInterval: number; // in milliseconds
  liveMode: 'live' | 'paused' | 'manual'; // Live toggle state
  updateBuffer: any[]; // Buffer for batching updates
  lastBufferFlush: number; // Timestamp of last buffer flush
  
  // Update news item analysis after generation
  updateNewsItemAnalysis: (newsId: string, analysis: any) => void;

  // Actions
  setLiveNews: (news: LiveNewsItem[], lastUpdate: string) => void;
  setLiveNewsLoading: (loading: boolean) => void;
  setLiveNewsError: (error: string | null) => void;
  
  setBreakingNews: (news: BreakingNewsItem[], lastUpdate: string) => void;
  setBreakingNewsLoading: (loading: boolean) => void;
  setBreakingNewsError: (error: string | null) => void;
  setNewBreakingAlert: (item: BreakingNewsItem | null) => void;
  
  setAnalysis: (newsId: string, analysis: NewsAnalysis) => void;
  setAnalysisLoading: (newsId: string, loading: boolean) => void;
  
  setTranslation: (newsId: string, translation: { translatedTitle: string; translatedSummary: string }) => void;
  setTranslationLoading: (newsId: string, loading: boolean) => void;
  
  addCoachMessage: (message: CoachMessage) => void;
  setCoachLoading: (loading: boolean) => void;
  clearCoachMessages: () => void;
  
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (interval: number) => void;
  setLiveMode: (mode: 'live' | 'paused' | 'manual') => void;
  addToBuffer: (items: any[]) => void;
  flushBuffer: () => void;
  
  // Fetch functions — DB-only, NO client-side processing
  fetchLiveNews: () => Promise<void>;
  fetchBreakingNews: () => Promise<void>;
  sendCoachMessage: (message: string) => Promise<void>;
}

// ── Retry tracking to prevent infinite auto-retry loops ──
let liveNewsRetryCount = 0;
let breakingNewsRetryCount = 0;
let liveNewsRetryTimeout: ReturnType<typeof setTimeout> | null = null;
let breakingNewsRetryTimeout: ReturnType<typeof setTimeout> | null = null;
const MAX_RETRIES = 3;

export function cancelNewsRetries() {
  if (liveNewsRetryTimeout) { clearTimeout(liveNewsRetryTimeout); liveNewsRetryTimeout = null; }
  if (breakingNewsRetryTimeout) { clearTimeout(breakingNewsRetryTimeout); breakingNewsRetryTimeout = null; }
  liveNewsRetryCount = 0;
  breakingNewsRetryCount = 0;
}

export const useNewsStore = create<NewsState>((set, get) => ({
  // Initial state
  liveNews: [],
  liveNewsLoading: false,
  liveNewsError: null,
  liveNewsLastUpdate: null,
  
  breakingNews: [],
  breakingNewsLoading: false,
  breakingNewsError: null,
  breakingNewsLastUpdate: null,
  
  newBreakingAlert: null,
  
  analysisCache: {},
  analysisLoading: {},
  
  translationCache: {},
  translationLoading: {},
  
  coachMessages: [
    { text: 'مرحباً! أنا مدرب رؤى الذكي. اسألني عن أي أصل مالي، وسأحلله لك فوراً مع مؤشرات فنية وأساسية.', type: 'bot' },
  ],
  coachLoading: false,
  coachError: null,
  
  autoRefresh: true,
  refreshInterval: 5 * 60 * 1000, // 5 minutes
  liveMode: 'live' as const,
  updateBuffer: [],
  lastBufferFlush: Date.now(),
  
  // Setters
  setLiveNews: (news, lastUpdate) => set({ liveNews: news, liveNewsLastUpdate: lastUpdate, liveNewsLoading: false }),
  setLiveNewsLoading: (loading) => set({ liveNewsLoading: loading }),
  setLiveNewsError: (error) => set({ liveNewsError: error, liveNewsLoading: false }),
  
  setBreakingNews: (news, lastUpdate) => {
    const currentBreaking = get().breakingNews;
    const newItems = news.filter(n => !currentBreaking.some(c => c.title === n.title));
    // Batch into a SINGLE set() call to prevent cascading re-renders (fixes #185)
    set({
      newBreakingAlert: (newItems.length > 0 && currentBreaking.length > 0) ? newItems[0] : get().newBreakingAlert,
      breakingNews: news,
      breakingNewsLastUpdate: lastUpdate,
      breakingNewsLoading: false,
    });
  },
  setBreakingNewsLoading: (loading) => set({ breakingNewsLoading: loading }),
  setBreakingNewsError: (error) => set({ breakingNewsError: error, breakingNewsLoading: false }),
  setNewBreakingAlert: (item) => set({ newBreakingAlert: item }),
  
  setAnalysis: (newsId, analysis) => set((state) => ({
    analysisCache: { ...state.analysisCache, [newsId]: analysis },
    analysisLoading: { ...state.analysisLoading, [newsId]: false },
    // Also update the news item itself
    liveNews: state.liveNews.map(n => n.id === newsId ? { ...n, aiAnalysis: analysis, isAnalyzing: false } : n),
    breakingNews: state.breakingNews.map(n => n.id === newsId ? { ...n, aiAnalysis: analysis, isAnalyzing: false } : n),
  })),
  setAnalysisLoading: (newsId, loading) => {
    set((state) => ({ 
      analysisLoading: { ...state.analysisLoading, [newsId]: loading },
      liveNews: state.liveNews.map(n => n.id === newsId ? { ...n, isAnalyzing: loading } : n),
      breakingNews: state.breakingNews.map(n => n.id === newsId ? { ...n, isAnalyzing: loading } : n),
    }));
  },
  
  setTranslation: (newsId, translation) => set((state) => ({
    translationCache: { ...state.translationCache, [newsId]: translation },
    translationLoading: { ...state.translationLoading, [newsId]: false },
    liveNews: state.liveNews.map(n => n.id === newsId ? { 
      ...n, 
      translatedTitle: translation.translatedTitle, 
      translatedSummary: translation.translatedSummary,
      isTranslating: false 
    } : n),
  })),
  setTranslationLoading: (newsId, loading) => set((state) => ({
    translationLoading: { ...state.translationLoading, [newsId]: loading },
    liveNews: state.liveNews.map(n => n.id === newsId ? { ...n, isTranslating: loading } : n),
  })),
  
  addCoachMessage: (message) => set((state) => ({
    coachMessages: [...state.coachMessages, message],
  })),
  setCoachLoading: (loading) => set({ coachLoading: loading }),
  clearCoachMessages: () => set({ 
    coachMessages: [{ text: 'مرحباً! أنا مدرب رؤى الذكي. اسألني عن أي أصل مالي، وسأحلله لك فوراً.', type: 'bot' }] 
  }),
  
  // Update a news item's aiAnalysis with generated full content
  // This is called after article generation to prevent re-generation
  updateNewsItemAnalysis: (newsId: string, analysis: any) => set((state) => ({
    liveNews: state.liveNews.map(n => n.id === newsId ? { ...n, aiAnalysis: { ...n.aiAnalysis, ...analysis } } : n),
    breakingNews: state.breakingNews.map(n => n.id === newsId ? { ...n, aiAnalysis: { ...n.aiAnalysis, ...analysis } } : n),
  })),

  setAutoRefresh: (enabled) => set({ autoRefresh: enabled }),
  setRefreshInterval: (interval) => set({ refreshInterval: interval }),
  setLiveMode: (mode) => set({ liveMode: mode }),
  addToBuffer: (items) => set((state) => ({ updateBuffer: [...state.updateBuffer, ...items] })),
  flushBuffer: () => set({ updateBuffer: [], lastBufferFlush: Date.now() }),

  // Fetch functions
  fetchLiveNews: async () => {
    const state = get();
    // In paused mode, don't auto-fetch (only manual refresh)
    if (state.liveMode === 'paused') return;
    
    set({ liveNewsLoading: true, liveNewsError: null });
    try {
      // FIX: Request 200 items to match the server-side page fetch.
      // Without limit=200, the API defaults to 20 items, which causes
      // most category sections to appear empty on the /news main page.
      const res = await fetch('/api/news/live?limit=200');
      const data = await res.json();
      if (data.news && data.news.length > 0) {
        // Preserve translations, analysis, and cache flags from existing items
        const currentNews = get().liveNews;
        const translationCache = get().translationCache;
        const enhancedNews = data.news.map((news: LiveNewsItem) => {
          const existing = currentNews.find(n => n.id === news.id);
          // Prefer new translation data, fall back to existing, then to cache
          const cachedTranslation = translationCache[news.id];
          const translatedTitle = news.translatedTitle || existing?.translatedTitle || cachedTranslation?.translatedTitle;
          const translatedSummary = news.translatedSummary || existing?.translatedSummary || cachedTranslation?.translatedSummary;
          return {
            ...news,
            translatedTitle,
            translatedSummary,
            // Preserve cache flags from server response OR existing store state
            hasFullContent: news.hasFullContent || existing?.hasFullContent || false,
            aiAnalysis: existing?.aiAnalysis || (news.hasFullContent ? {
              summary: '',
              sentiment: news.cachedSentiment || news.sentiment || 'neutral',
              confidence: 85,
              affectedAssets: (news.cachedAffectedAssets || []).map((a: any) => ({ symbol: a.symbol, direction: a.direction })),
              impactLevel: news.impactLevel || 'low',
              recommendation: news.cachedRecommendation || '',
            } : undefined),
          };
        });
        set({ 
          liveNews: enhancedNews, 
          liveNewsLastUpdate: data.lastUpdate || new Date().toISOString(),
          liveNewsLoading: false 
        });
        // If server is still loading (DB empty), auto-retry after delay
        // but the visitor should NOT wait for processing — they'll see data once cron populates DB
      } else if (data.loading) {
        // Server is fetching news in background — auto-retry with limit
        set({ liveNewsLoading: false });
        if (liveNewsRetryCount >= MAX_RETRIES) {
          set({ liveNewsError: 'Server is still loading. Please refresh later.' });
          return;
        }
        liveNewsRetryCount++;
        const retryMs = (data.retryAfter || 15) * 1000;
        liveNewsRetryTimeout = setTimeout(() => { get().fetchLiveNews(); }, retryMs);
      } else if (data.news) {
        set({ liveNewsLoading: false });
      } else {
        set({ liveNewsError: data.error || 'Failed to load news', liveNewsLoading: false });
      }
    } catch (err: any) {
      set({ liveNewsError: err.message || 'Network error', liveNewsLoading: false });
    }
  },
  
  fetchBreakingNews: async () => {
    set({ breakingNewsLoading: true, breakingNewsError: null });
    try {
      const res = await fetch('/api/news/breaking');
      const data = await res.json();
      if (data.news && data.news.length > 0) {
        const currentBreaking = get().breakingNews;
        const translationCache = get().translationCache;
        const newItems = data.news.filter((n: BreakingNewsItem) => !currentBreaking.some(c => c.id === n.id));
        if (newItems.length > 0 && currentBreaking.length > 0) {
          set({ newBreakingAlert: newItems[0] });
        }
        // Preserve analysis, translations, and cache flags from existing items
        const enhancedBreaking = data.news.map((news: BreakingNewsItem) => {
          const existing = currentBreaking.find(n => n.id === news.id);
          const cachedTranslation = translationCache[news.id];
          const translatedTitle = news.translatedTitle || news.titleAr || existing?.translatedTitle || cachedTranslation?.translatedTitle;
          const translatedSummary = news.translatedSummary || news.summaryAr || existing?.translatedSummary || cachedTranslation?.translatedSummary;
          return {
            ...news,
            translatedTitle,
            translatedSummary,
            // Preserve cache flags from server response OR existing store state
            hasFullContent: news.hasFullContent || existing?.hasFullContent || false,
            aiAnalysis: existing?.aiAnalysis || (news.hasFullContent ? {
              summary: '',
              sentiment: news.cachedSentiment || news.sentiment || 'neutral',
              confidence: 85,
              affectedAssets: (news.cachedAffectedAssets || []).map((a: any) => ({ symbol: a.symbol, direction: a.direction })),
              impactLevel: news.impactLevel || 'low',
              recommendation: news.cachedRecommendation || '',
            } : undefined),
          };
        });
        set({ 
          breakingNews: enhancedBreaking, 
          breakingNewsLastUpdate: data.lastUpdate || new Date().toISOString(),
          breakingNewsLoading: false 
        });
      } else if (data.loading) {
        // Server is fetching news in background — auto-retry with limit
        set({ breakingNewsLoading: false });
        if (breakingNewsRetryCount >= MAX_RETRIES) {
          set({ breakingNewsError: 'Server is still loading. Please refresh later.' });
          return;
        }
        breakingNewsRetryCount++;
        const retryMs = (data.retryAfter || 15) * 1000;
        breakingNewsRetryTimeout = setTimeout(() => { get().fetchBreakingNews(); }, retryMs);
      } else if (data.news) {
        set({ breakingNewsLoading: false });
      } else {
        set({ breakingNewsError: data.error || 'Failed to load breaking news', breakingNewsLoading: false });
      }
    } catch (err: any) {
      set({ breakingNewsError: err.message || 'Network error', breakingNewsLoading: false });
    }
  },
  
  // NOTE: fetchAnalysis and fetchTranslation have been REMOVED.
  // ALL analysis and translation happens in the background (cron/bootstrap).
  // The visitor only reads pre-processed data from the database.

  sendCoachMessage: async (message) => {
    // Add user message
    get().addCoachMessage({ text: message, type: 'user' });
    set({ coachLoading: true, coachError: null });
    
    try {
      const history = get().coachMessages.slice(-6); // Last 6 messages
      const res = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, conversationHistory: history }),
      });
      const data = await res.json();
      
      if (data.response) {
        get().addCoachMessage({ text: data.response, type: 'bot' });
      } else {
        get().addCoachMessage({ text: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.', type: 'bot' });
        set({ coachError: data.error || 'Unknown error' });
      }
    } catch (err: any) {
      get().addCoachMessage({ text: 'عذراً، لم أتمكن من الاتصال. تحقق من اتصالك بالإنترنت.', type: 'bot' });
      set({ coachError: err.message });
    }
    
    set({ coachLoading: false });
  },
}));

// ─── i18n Dictionary for Latin Locales ─────────────────────────
// Centralized translation strings for EN/FR/TR/ES.
// Used by En* components to render locale-aware UI text.

import type { Locale } from './locale';

export type LatinLocale = 'en' | 'fr' | 'tr' | 'es';

// ─── Navbar ─────────────────────────────────────────────────────

export const NAV_ITEMS: Record<LatinLocale, { label: string; href: string }[]> = {
  en: [
    { label: 'Home', href: '/en' },
    { label: 'News', href: '/en/news' },
    { label: "Ru'aa Advisor", href: '/en/advisor' },
    { label: 'Stock & Company Analysis', href: '/en/stock-analysis' },
    { label: 'Signals', href: '/en/signals' },
    { label: 'Markets', href: '/en/markets' },
    { label: 'Reports', href: '/en/reports' },
    { label: 'Infographics', href: '/en/infographics' },
    { label: 'Videos', href: '/en/videos' },
    { label: 'Portfolio', href: '/en/portfolio' },
  ],
  fr: [
    { label: 'Accueil', href: '/fr' },
    { label: 'Actualités', href: '/fr/news' },
    { label: "Conseiller Ru'aa", href: '/fr/advisor' },
    { label: 'Analyse Actions', href: '/fr/stock-analysis'},
    { label: 'Signaux', href: '/fr/signals' },
    { label: 'Marchés', href: '/fr/markets' },
    { label: 'Rapports', href: '/fr/reports' },
    { label: 'Infographies', href: '/fr/infographics' },
    { label: 'Vidéos', href: '/fr/videos' },
    { label: 'Portefeuille', href: '/fr/portfolio' },
  ],
  tr: [
    { label: 'Ana Sayfa', href: '/tr' },
    { label: 'Haberler', href: '/tr/news' },
    { label: "Ru'aa Danışman", href: '/tr/advisor' },
    { label: 'Hisse & Şirket Analizi', href: '/tr/stock-analysis'},
    { label: 'Sinyaller', href: '/tr/signals' },
    { label: 'Piyasalar', href: '/tr/markets' },
    { label: 'Raporlar', href: '/tr/reports' },
    { label: 'İnfografikler', href: '/tr/infographics' },
    { label: 'Videolar', href: '/tr/videos' },
    { label: 'Portföy', href: '/tr/portfolio' },
  ],
  es: [
    { label: 'Inicio', href: '/es' },
    { label: 'Noticias', href: '/es/news' },
    { label: "Asesor Ru'aa", href: '/es/advisor' },
    { label: 'Análisis de Acciones', href: '/es/stock-analysis'},
    { label: 'Señales', href: '/es/signals' },
    { label: 'Mercados', href: '/es/markets' },
    { label: 'Informes', href: '/es/reports' },
    { label: 'Infografías', href: '/es/infographics' },
    { label: 'Vídeos', href: '/es/videos' },
    { label: 'Portafolio', href: '/es/portfolio' },
  ],
};

// ─── Navbar Sub-items ───────────────────────────────────────────

export const NAV_NEWS_SUB: Record<LatinLocale, { label: string; href: string }[]> = {
  en: [
    { label: 'Latest News', href: '/en/news' },
    { label: 'Economic Calendar', href: '/en/calendar' },
  ],
  fr: [
    { label: 'Dernières actualités', href: '/fr/news' },
    { label: 'Calendrier économique', href: '/fr/calendar' },
  ],
  tr: [
    { label: 'Son Haberler', href: '/tr/news' },
    { label: 'Ekonomik Takvim', href: '/tr/calendar' },
  ],
  es: [
    { label: 'Últimas noticias', href: '/es/news' },
    { label: 'Calendario económico', href: '/es/calendar' },
  ],
};

export const NAV_ANALYSIS_SUB: Record<LatinLocale, { label: string; href: string }[]> = {
  en: [{ label: 'AI Analysis', href: '/en/analysis' }],
  fr: [{ label: 'Analyse IA', href: '/fr/analysis' }],
  tr: [{ label: 'AI Analiz', href: '/tr/analysis' }],
  es: [{ label: 'Análisis IA', href: '/es/analysis' }],
};

export const NAV_MARKETS_SUB: Record<LatinLocale, { label: string; href: string; badge?: string }[]> = {
  en: [
    { label: 'Market Overview', href: '/en/markets' },
    { label: 'Market Pulse', href: '/en/market-pulse', badge: 'Live' },
  ],
  fr: [
    { label: 'Aperçu du marché', href: '/fr/markets' },
    { label: 'Pulse du marché', href: '/fr/market-pulse', badge: 'Live' },
  ],
  tr: [
    { label: 'Piyasa Genel Bakış', href: '/tr/markets' },
    { label: 'Piyasa Nabzı', href: '/tr/market-pulse', badge: 'Canlı' },
  ],
  es: [
    { label: 'Resumen del mercado', href: '/es/markets' },
    { label: 'Pulso del mercado', href: '/es/market-pulse', badge: 'En vivo' },
  ],
};

export const NAV_REPORTS_SUB: Record<LatinLocale, { label: string; href: string }[]> = {
  en: [
    { label: 'AI Analysis', href: '/en/analysis' },
    { label: 'Strategic Reports', href: '/en/strategic-reports' },
  ],
  fr: [
    { label: 'Analyse IA', href: '/fr/analysis' },
    { label: 'Rapports stratégiques', href: '/fr/strategic-reports' },
  ],
  tr: [
    { label: 'AI Analiz', href: '/tr/analysis' },
    { label: 'Stratejik Raporlar', href: '/tr/strategic-reports' },
  ],
  es: [
    { label: 'Análisis IA', href: '/es/analysis' },
    { label: 'Informes estratégicos', href: '/es/strategic-reports' },
  ],
};

export const NAV_PORTFOLIO_SUB: Record<LatinLocale, { label: string; href: string }[]> = {
  en: [
    { label: 'My Portfolio', href: '/en/portfolio' },
    { label: 'Bookmarks', href: '/en/bookmarks' },
  ],
  fr: [
    { label: 'Mon portefeuille', href: '/fr/portfolio' },
    { label: 'Favoris', href: '/fr/bookmarks' },
  ],
  tr: [
    { label: 'Portföyüm', href: '/tr/portfolio' },
    { label: 'Yer İşaretleri', href: '/tr/bookmarks' },
  ],
  es: [
    { label: 'Mi portafolio', href: '/es/portfolio' },
    { label: 'Marcadores', href: '/es/bookmarks' },
  ],
};

// ─── Navbar More Links ──────────────────────────────────────────

export const NAV_MORE_LINKS: Record<LatinLocale, { label: string; href: string }[]> = {
  en: [
    { label: 'AI Analysis', href: '/en/analysis' },
    { label: 'Earnings Calendar', href: '/en/earnings' },
    { label: 'Newsletter', href: '/en/reports#newsletter' },
    { label: 'Strategic Reports', href: '/en/strategic-reports' },
    { label: 'Market Pulse', href: '/en/market-pulse' },
    { label: 'Community', href: '/en/community' },
    { label: 'Telegram', href: '/en/telegram' },
    { label: 'API Docs', href: '/en/docs/api' },
    { label: 'Compliance', href: '/en/compliance' },
    { label: 'About', href: '/en/about' },
  ],
  fr: [
    { label: 'Analyse IA', href: '/fr/analysis' },
    { label: 'Calendrier des résultats', href: '/fr/earnings' },
    { label: 'Newsletter', href: '/fr/reports#newsletter' },
    { label: 'Rapports stratégiques', href: '/fr/strategic-reports' },
    { label: 'Pulse du marché', href: '/fr/market-pulse' },
    { label: 'Communauté', href: '/fr/community' },
    { label: 'Telegram', href: '/fr/telegram' },
    { label: 'API', href: '/fr/docs/api' },
    { label: 'Conformité', href: '/fr/compliance' },
    { label: 'À propos', href: '/fr/about' },
  ],
  tr: [
    { label: 'Yapay Zeka Analizi', href: '/tr/analysis' },
    { label: 'Kazanç Takvimi', href: '/tr/earnings' },
    { label: 'Bülten', href: '/tr/reports#newsletter' },
    { label: 'Stratejik Raporlar', href: '/tr/strategic-reports' },
    { label: 'Piyasa Nabzı', href: '/tr/market-pulse' },
    { label: 'Topluluk', href: '/tr/community' },
    { label: 'Telegram', href: '/tr/telegram' },
    { label: 'API', href: '/tr/docs/api' },
    { label: 'Uyumluluk', href: '/tr/compliance' },
    { label: 'Hakkında', href: '/tr/about' },
  ],
  es: [
    { label: 'Análisis IA', href: '/es/analysis' },
    { label: 'Calendario de ganancias', href: '/es/earnings' },
    { label: 'Boletín', href: '/es/reports#newsletter' },
    { label: 'Informes estratégicos', href: '/es/strategic-reports' },
    { label: 'Pulso del mercado', href: '/es/market-pulse' },
    { label: 'Comunidad', href: '/es/community' },
    { label: 'Telegram', href: '/es/telegram' },
    { label: 'API', href: '/es/docs/api' },
    { label: 'Cumplimiento', href: '/es/compliance' },
    { label: 'Acerca de', href: '/es/about' },
  ],
};

// ─── Navbar Misc Text ───────────────────────────────────────────

export const NAV_TEXT: Record<string, Record<LatinLocale, string>> = {
  more: { en: 'More', fr: 'Plus', tr: 'Daha fazla', es: 'Más' },
  marketSessions: { en: 'Market Sessions', fr: 'Sessions de marché', tr: 'Piyasa Oturumları', es: 'Sesiones de mercado' },
  language: { en: 'Language', fr: 'Langue', tr: 'Dil', es: 'Idioma' },
  login: { en: 'Login', fr: 'Connexion', tr: 'Giriş', es: 'Iniciar sesión' },
  signUp: { en: 'Sign Up', fr: "S'inscrire", tr: 'Kayıt Ol', es: 'Registrarse' },
  signOut: { en: 'Sign Out', fr: 'Déconnexion', tr: 'Çıkış', es: 'Cerrar sesión' },
  myProfile: { en: 'My Profile', fr: 'Mon profil', tr: 'Profilim', es: 'Mi perfil' },
  bookmarks: { en: 'Bookmarks', fr: 'Favoris', tr: 'Yer İşaretleri', es: 'Marcadores' },
  open: { en: 'Open', fr: 'Ouvert', tr: 'Açık', es: 'Abierto' },
  closed: { en: 'Closed', fr: 'Fermé', tr: 'Kapalı', es: 'Cerrado' },
  search: { en: 'Search', fr: 'Recherche', tr: 'Ara', es: 'Buscar' },
};

// ─── Home Page Section Titles ───────────────────────────────────

export const HOME_SECTIONS: Record<string, Record<LatinLocale, string>> = {
  latestNews: { en: 'Latest News', fr: 'Dernières actualités', tr: 'Son Haberler', es: 'Últimas noticias' },
  viewAll: { en: 'View All', fr: 'Voir tout', tr: 'Tümünü Gör', es: 'Ver todo' },
  strategicReports: { en: 'Strategic Reports', fr: 'Rapports stratégiques', tr: 'Stratejik Raporlar', es: 'Informes estratégicos' },
  reportsAnalysis: { en: 'Reports & Analysis', fr: 'Rapports et Analyse', tr: 'Raporlar ve Analiz', es: 'Informes y Análisis' },
  noStrategicReports: { en: 'No strategic reports available', fr: 'Aucun rapport stratégique disponible', tr: 'Stratejik rapor mevcut değil', es: 'No hay informes estratégicos disponibles' },
  noData: { en: 'No data available', fr: 'Aucune donnée disponible', tr: 'Veri mevcut değil', es: 'No hay datos disponibles' },
  noNews: { en: 'No news available', fr: 'Aucune actualité disponible', tr: 'Haber mevcut değil', es: 'No hay noticias disponibles' },
  noPriceData: { en: 'No price data available', fr: 'Aucune donnée de prix disponible', tr: 'Fiyat verisi mevcut değil', es: 'No hay datos de precios disponibles' },
  marketPulse: { en: 'Market Pulse', fr: 'Pulse du marché', tr: 'Piyasa Nabzı', es: 'Pulso del mercado' },
  marketSessions: { en: 'Market Sessions', fr: 'Sessions de marché', tr: 'Piyasa Oturumları', es: 'Sesiones de mercado' },
  fearGreed: { en: 'Fear & Greed', fr: 'Peur & Cupidité', tr: 'Korku & Açgözlülük', es: 'Miedo y Codicia' },
  arabMarkets: { en: 'Arab Markets', fr: 'Marchés arabes', tr: 'Arap Piyasaları', es: 'Mercados árabes' },
  economicCalendar: { en: 'Economic Calendar', fr: 'Calendrier économique', tr: 'Ekonomik Takvim', es: 'Calendario económico' },
  centralBanks: { en: 'Central Banks', fr: 'Banques centrales', tr: 'Merkez Bankaları', es: 'Bancos centrales' },
  tradingSignals: { en: 'Trading Signals', fr: 'Signaux de trading', tr: 'İşlem Sinyalleri', es: 'Señales de trading' },
  aiAnalysis: { en: 'AI Analysis', fr: 'Analyse IA', tr: 'AI Analiz', es: 'Análisis IA' },
  infographics: { en: 'Infographics', fr: 'Infographies', tr: 'İnfografikler', es: 'Infografías' },
  screener: { en: 'Screener', fr: 'Filtre', tr: 'Tarayıcı', es: 'Filtro' },
  buy: { en: 'Buy', fr: 'Achat', tr: 'Al', es: 'Compra' },
  sell: { en: 'Sell', fr: 'Vente', tr: 'Sat', es: 'Venta' },
  hot: { en: 'Hot', fr: 'Tendance', tr: 'Popüler', es: 'Tendencia' },
  topMovers: { en: 'Top Movers', fr: 'Mouvements principaux', tr: 'En Çok Hareket Edenler', es: 'Mayores movimientos' },
  gainers: { en: 'Gainers', fr: 'En hausse', tr: 'Yükselenler', es: 'Alzas' },
  losers: { en: 'Losers', fr: 'En baisse', tr: 'Düşenler', es: 'Bajas' },
  commodities: { en: 'Commodities', fr: 'Matières premières', tr: 'Emtia', es: 'Materias primas' },
  globalIndices: { en: 'Global Indices', fr: 'Indices mondiaux', tr: 'Küresel Endeksler', es: 'Índices globales' },
  academy: { en: 'Academy', fr: 'Académie', tr: 'Akademi', es: 'Academia' },
  strategic: { en: 'Strategic', fr: 'Stratégique', tr: 'Stratejik', es: 'Estratégico' },
  global: { en: 'Global', fr: 'Mondial', tr: 'Küresel', es: 'Global' },
  regional: { en: 'Regional', fr: 'Régional', tr: 'Bölgesel', es: 'Regional' },
  arabic: { en: 'Arabic', fr: 'Arabe', tr: 'Arapça', es: 'Árabe' },
  bullish: { en: 'Bullish', fr: 'Haussier', tr: 'Yükseliş', es: 'Alcista' },
  bearish: { en: 'Bearish', fr: 'Baissier', tr: 'Düşüş', es: 'Bajista' },
  neutral: { en: 'Neutral', fr: 'Neutre', tr: 'Nötr', es: 'Neutral' },
  now: { en: 'now', fr: 'maintenant', tr: 'şimdi', es: 'ahora' },
  live: { en: 'Live', fr: 'En direct', tr: 'Canlı', es: 'En vivo' },
  mostTraded: { en: 'Most Traded', fr: 'Plus échangés', tr: 'En Çok İşlem Görenler', es: 'Más negociados' },
  quickMarkets: { en: 'Quick Markets', fr: 'Marchés rapides', tr: 'Hızlı Piyasalar', es: 'Mercados rápidos' },
};

// ─── Market Session Names ───────────────────────────────────────

export const MARKET_SESSION_NAMES: Record<string, Record<LatinLocale, string>> = {
  TKY: { en: 'Tokyo', fr: 'Tokyo', tr: 'Tokyo', es: 'Tokio' },
  DXB: { en: 'Dubai', fr: 'Dubaï', tr: 'Dubai', es: 'Dubái' },
  LDN: { en: 'London', fr: 'Londres', tr: 'Londra', es: 'Londres' },
  NY: { en: 'New York', fr: 'New York', tr: 'New York', es: 'Nueva York' },
  SYD: { en: 'Sydney', fr: 'Sydney', tr: 'Sidney', es: 'Sídney' },
  SAU: { en: 'Saudi Arabia', fr: 'Arabie Saoudite', tr: 'Suudi Arabistan', es: 'Arabia Saudí' },
};

// ─── Fear & Greed Labels ────────────────────────────────────────

export const FEAR_GREED_LABELS: Record<string, Record<LatinLocale, string>> = {
  extremeFear: { en: 'Extreme Fear', fr: 'Peur extrême', tr: 'Aşırı Korku', es: 'Miedo extremo' },
  fear: { en: 'Fear', fr: 'Peur', tr: 'Korku', es: 'Miedo' },
  moderateCaution: { en: 'Moderate Caution', fr: 'Prudence modérée', tr: 'Orta Dikkat', es: 'Caución moderada' },
  greed: { en: 'Greed', fr: 'Cupidité', tr: 'Açgözlülük', es: 'Codicia' },
  extremeGreed: { en: 'Extreme Greed', fr: 'Cupidité extrême', tr: 'Aşırı Açgözlülük', es: 'Codicia extrema' },
  noData: { en: 'No data', fr: 'Aucune donnée', tr: 'Veri yok', es: 'Sin datos' },
};

// ─── Footer Text ────────────────────────────────────────────────

export const FOOTER_TEXT: Record<string, Record<LatinLocale, string>> = {
  poweredBy: { en: 'Powered by AI', fr: 'Propulsé par IA', tr: 'AI Destekli', es: 'Potenciado por IA' },
  disclaimer: {
    en: 'Financial information for educational purposes only. Not financial advice.',
    fr: 'Informations financières à des fins éducatives uniquement. Ne constitue pas un conseil financier.',
    tr: 'Finansal bilgiler yalnızca eğitim amaçlıdır. Finansal tavsiye değildir.',
    es: 'Información financiera solo con fines educativos. No es asesoramiento financiero.',
  },
  allRightsReserved: {
    en: 'All rights reserved.',
    fr: 'Tous droits réservés.',
    tr: 'Tüm hakları saklıdır.',
    es: 'Todos los derechos reservados.',
  },
  terms: { en: 'Terms', fr: 'Conditions', tr: 'Şartlar', es: 'Términos' },
  privacy: { en: 'Privacy', fr: 'Confidentialité', tr: 'Gizlilik', es: 'Privacidad' },
  contact: { en: 'Contact', fr: 'Contact', tr: 'İletişim', es: 'Contacto' },
  about: { en: 'About', fr: 'À propos', tr: 'Hakkında', es: 'Acerca de' },
  compliance: { en: 'Compliance', fr: 'Conformité', tr: 'Uyumluluk', es: 'Cumplimiento' },
};

// ─── Financial Disclaimer ───────────────────────────────────────

export const FINANCIAL_DISCLAIMER: Record<LatinLocale, string> = {
  en: 'Financial information is provided for educational and informational purposes only and does not constitute financial, investment, or trading advice. Past performance is not indicative of future results. Always do your own research and consult with a qualified financial advisor before making investment decisions.',
  fr: "Les informations financières sont fournies à des fins éducatives et informatives uniquement et ne constituent pas un conseil financier, d'investissement ou de trading. Les performances passées ne sont pas indicatives des résultats futurs. Faites toujours vos propres recherches et consultez un conseiller financier qualifié avant de prendre des décisions d'investissement.",
  tr: 'Finansal bilgiler yalnızca eğitim ve bilgilendirme amaçlı sağlanmıştır ve finansal, yatırım veya işlem tavsiyesi niteliğinde değildir. Geçmiş performans gelecekteki sonuçların göstergesi değildir. Yatırım kararları almadan önce her zaman kendi araştırmanızı yapın ve nitelikli bir finansal danışmana başvurun.',
  es: 'La información financiera se proporciona únicamente con fines educativos e informativos y no constituye asesoramiento financiero, de inversión o de trading. El rendimiento pasado no es indicativo de resultados futuros. Siempre investigue por su cuenta y consulte con un asesor financiero calificado antes de tomar decisiones de inversión.',
};

// ─── Telegram Subscribe ─────────────────────────────────────────

export const TELEGRAM_TEXT: Record<string, Record<LatinLocale, string>> = {
  title: { en: 'Stay Updated', fr: 'Restez informé', tr: 'Güncel Kalın', es: 'Mantente informado' },
  subtitle: {
    en: 'Get instant financial news and AI analysis on Telegram',
    fr: "Recevez instantanément les actualités financières et l'analyse IA sur Telegram",
    tr: "Telegram'da anlık finansal haberler ve AI analizi alın",
    es: 'Recibe noticias financieras instantáneas y análisis de IA en Telegram',
  },
  button: { en: 'Join Channel', fr: 'Rejoindre le canal', tr: 'Kanala Katıl', es: 'Unirse al canal' },
};

// ─── Hero Section ───────────────────────────────────────────────

export const HERO_TEXT: Record<string, Record<LatinLocale, string>> = {
  breakingNews: { en: 'BREAKING', fr: 'FLASH', tr: 'SON DAKİKA', es: 'ÚLTIMA HORA' },
  liveUpdates: { en: 'Live Updates', fr: 'Mises à jour en direct', tr: 'Canlı Güncellemeler', es: 'Actualizaciones en vivo' },
  aiPowered: { en: 'AI-Powered', fr: 'Propulsé par IA', tr: 'AI Destekli', es: 'Potenciado por IA' },
};

// ─── Personalized Greeting ──────────────────────────────────────

export const GREETING_TEXT: Record<string, Record<LatinLocale, string>> = {
  goodMorning: { en: 'Good morning', fr: 'Bonjour', tr: 'Günaydın', es: 'Buenos días' },
  goodAfternoon: { en: 'Good afternoon', fr: 'Bon après-midi', tr: 'İyi günler', es: 'Buenas tardes' },
  goodEvening: { en: 'Good evening', fr: 'Bonsoir', tr: 'İyi akşamlar', es: 'Buenas noches' },
  welcomeBack: { en: 'Welcome back to the markets', fr: 'Bienvenue sur les marchés', tr: 'Piyasalara hoş geldiniz', es: 'Bienvenido a los mercados' },
};

// ─── Mobile Bottom Tab ──────────────────────────────────────────

export const MOBILE_TAB_TEXT: Record<string, Record<LatinLocale, string>> = {
  home: { en: 'Home', fr: 'Accueil', tr: 'Ana Sayfa', es: 'Inicio' },
  news: { en: 'News', fr: 'Actus', tr: 'Haberler', es: 'Noticias' },
  markets: { en: 'Markets', fr: 'Marchés', tr: 'Piyasa', es: 'Mercados' },
  signals: { en: 'Signals', fr: 'Signaux', tr: 'Sinyaller', es: 'Señales' },
  more: { en: 'More', fr: 'Plus', tr: 'Daha', es: 'Más' },
};

// ─── Helper: Get locale-prefixed path ───────────────────────────

export function localePath(locale: LatinLocale, path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `/${locale}/${cleanPath}`;
}

// ─── Helper: Get translation ────────────────────────────────────

export function t(dict: Record<string, Record<LatinLocale, string>>, key: string, locale: LatinLocale): string {
  return dict[key]?.[locale] || dict[key]?.en || key;
}

// ─── Helper: Get news API path per locale ───────────────────────

export function localeNewsApiPath(locale: LatinLocale): string {
  if (locale === 'en') return '/api/en/news?limit=10';
  return `/api/news/${locale}/live`;
}

export function localeReportsApiPath(locale: LatinLocale): string {
  if (locale === 'en') return '/api/en/reports?limit=6';
  return `/api/en/reports?limit=6`; // Reports API doesn't have locale-specific endpoints yet
}

export function localeNewsLink(locale: LatinLocale, slug: string): string {
  return `/${locale}/news/${slug}`;
}

// ─── Assistant (Universal Copilot) ──────────────────────────────

export const ASSISTANT_TEXT: Record<string, Record<LatinLocale, string>> = {
  title: { en: 'Rouaa Copilot', fr: 'Copilote Rouaa', tr: 'Rouaa Copilot', es: 'Copiloto Rouaa' },
  subtitle: { en: 'Ask about markets, stocks & reports', fr: 'Posez des questions sur les marchés', tr: 'Piyasalar, hisseler ve raporlar hakkında sorular sorun', es: 'Pregunta sobre mercados, acciones e informes' },
  inputPlaceholder: { en: 'Type your question...', fr: 'Tapez votre question...', tr: 'Sorunuzu yazın...', es: 'Escribe tu pregunta...' },
  summarize: { en: 'Summarize this page', fr: 'Résumer cette page', tr: 'Bu sayfayı özetle', es: 'Resumir esta página' },
  stockAnalysis: { en: 'Stock Analysis', fr: "Analyse d'action", tr: 'Hisse Analizi', es: 'Análisis de acciones' },
  compareStocks: { en: 'Compare Stocks', fr: "Comparer des actions", tr: 'Hisseleri Karşılaştır', es: 'Comparar acciones' },
  marketBrief: { en: 'Market Brief', fr: 'Aperçu du marché', tr: 'Piyasa Özeti', es: 'Resumen de mercado' },
  explainTerm: { en: 'Explain Term', fr: 'Expliquer un terme', tr: 'Terim Açıkla', es: 'Explicar término' },
  toolsUsed: { en: 'Tools Used', fr: 'Outils utilisés', tr: 'Kullanılan araçlar', es: 'Herramientas usadas' },
  sources: { en: 'Sources', fr: 'Sources', tr: 'Kaynaklar', es: 'Fuentes' },
  send: { en: 'Send', fr: 'Envoyer', tr: 'Gönder', es: 'Enviar' },
  greeting: { en: 'How can I help you?', fr: 'Comment puis-je vous aider ?', tr: 'Size nasıl yardımcı olabilirim?', es: '¿Cómo puedo ayudarte?' },
  errorConnection: { en: 'Connection error. Please try again.', fr: 'Erreur de connexion. Veuillez réessayer.', tr: 'Bağlantı hatası. Lütfen tekrar deneyin.', es: 'Error de conexión. Inténtalo de nuevo.' },
  quickActions: {
    en: 'Suggested questions',
    fr: 'Questions suggérées',
    tr: 'Önerilen sorular',
    es: 'Preguntas sugeridas',
  },
};

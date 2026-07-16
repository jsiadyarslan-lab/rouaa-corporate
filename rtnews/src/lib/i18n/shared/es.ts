// ─── Shared Spanish Labels for NewsList, PersonalizedGreeting, TradingOpsDashboard ──
// Sigue el mismo patrón de nombres con puntos que src/lib/i18n/stock/
// Claves agrupadas por componente: newsList.*, greeting.*, ops.*

const es: Record<string, string> = {
  // ════════════════════════════════════════════════════════════════
  // ── NewsList ──
  // ════════════════════════════════════════════════════════════════

  'newsList.heading': 'Últimas Noticias',
  'newsList.viewAll': 'Ver Todo →',
  'newsList.archiveCount': 'artículos en archivo',
  'newsList.loadMore': 'Cargar Más',
  'newsList.loadMoreRemaining': 'restantes en archivo',
  'newsList.loading': 'Cargando...',
  'newsList.archiveComplete': 'Todas las noticias archivadas mostradas',
  'newsList.newsUnit': 'artículos',
  'newsList.defaultCategory': 'Noticias',

  // Category labels — aligned with NEWS_CATEGORIES
  'newsList.cat.economy': 'Economía',
  'newsList.cat.stocks': 'Acciones',
  'newsList.cat.forex': 'Divisas',
  'newsList.cat.crypto': 'Criptomonedas',
  'newsList.cat.energy': 'Energía',
  'newsList.cat.oil': 'Petróleo',
  'newsList.cat.commodities': 'Materias Primas',
  'newsList.cat.metals': 'Metales',
  'newsList.cat.bonds': 'Bonos',
  'newsList.cat.centralBanks': 'Bancos Centrales',
  'newsList.cat.technology': 'Tecnología',
  'newsList.cat.technicalAnalysis': 'Análisis Técnico',
  'newsList.cat.earnings': 'Ganancias',
  'newsList.cat.realEstate': 'Inmobiliario',
  'newsList.cat.arabMarkets': 'Mercados Árabes',
  'newsList.cat.strategic': 'Geopolítica',
  'newsList.cat.banking': 'Banca',
  'newsList.cat.macro': 'Macro',
  'newsList.cat.fed': 'Fed',

  // Sentiment labels
  'newsList.sentiment.positive': 'Alcista',
  'newsList.sentiment.negative': 'Bajista',
  'newsList.sentiment.neutral': 'Neutral',

  // Time abbreviations
  'newsList.time.now': 'ahora',
  'newsList.time.min': 'm',
  'newsList.time.hour': 'h',
  'newsList.time.day': 'd',
  'newsList.time.month': 'M',

  // ════════════════════════════════════════════════════════════════
  // ── PersonalizedGreeting ──
  // ════════════════════════════════════════════════════════════════

  'greeting.hello': 'Hola',
  'greeting.subtitle': 'Las recomendaciones de hoy se basan en su perfil de inversión',
  'greeting.advisorPanel': 'Panel del Asesor',
  'greeting.loadingRecs': 'Cargando recomendaciones personalizadas...',
  'greeting.fallbackTitle': 'Recomendación de inversión',

  // Action labels
  'greeting.action.buy': 'Comprar',
  'greeting.action.sell': 'Vender',
  'greeting.action.watch': 'Observar',

  // Logged-out CTA
  'greeting.cta.heading': 'Obtén recomendaciones de inversión personalizadas',
  'greeting.cta.subtitle': 'Regístrate ahora y obtén análisis y recomendaciones basadas en IA según tu perfil de inversión',
  'greeting.cta.signUp': 'Regístrate Ahora',

  // ════════════════════════════════════════════════════════════════
  // ── TradingOpsDashboard ──
  // ════════════════════════════════════════════════════════════════

  // Quick Summary Strip
  'ops.criticalEvents': 'Eventos Críticos',
  'ops.activeSignals': 'Señales Activas',
  'ops.mostVolatile': 'Más Volátil',

  // Card 1: Trading Sessions
  'ops.sessions.heading': 'Sesiones de Trading',
  'ops.sessions.open': 'Abierto',
  'ops.sessions.closed': 'Cerrado',
  'ops.sessions.tokyo': 'Tokio',
  'ops.sessions.saudi': 'Arabia Saudí',
  'ops.sessions.london': 'Londres',
  'ops.sessions.newyork': 'Nueva York',
  'ops.sessions.sydney': 'Sídney',

  // Card 2: Currency Strength
  'ops.currency.heading': 'Fuerza de Divisas',
  'ops.currency.category': 'Divisas',

  // Card 3: Economic Calendar
  'ops.calendar.heading': 'Calendario Económico',
  'ops.calendar.all': 'Todo',
  'ops.calendar.forecast': 'Pron: ',
  'ops.calendar.loading': 'Cargando...',
  'ops.calendar.empty': 'Sin eventos de alto impacto hoy',

  // Card 4: Council Signals
  'ops.signals.heading': 'Señales del Consejo',
  'ops.signals.all': 'Todo',
  'ops.signals.buy': 'Comprar',
  'ops.signals.sell': 'Vender',
  'ops.signals.entry': 'Entrada',
  'ops.signals.target': 'Objetivo',
  'ops.signals.stop': 'Stop',
  'ops.signals.confidence': 'Conf.',
  'ops.signals.loading': 'Cargando...',
  'ops.signals.empty': 'Sin señales activas en este momento',

  // Time abbreviations (ops-specific)
  'ops.time.now': 'Ahora',
  'ops.time.min': 'm',
  'ops.time.hour': 'h',
  'ops.time.day': 'd',
};

export default es;

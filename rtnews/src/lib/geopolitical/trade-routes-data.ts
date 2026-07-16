// ─── Global Trade Routes and Chokepoints Data ──────────────────
// Rouaa (رؤى) Geopolitical Risk Platform
// Key routes: Strait of Hormuz, Suez Canal, Bab el-Mandeb,
// Strait of Malacca, Turkish Straits, Panama Canal
// All coordinates are in GeoJSON [lng, lat] format

export interface Chokepoint {
  nameAr: string;
  nameEn: string;
  nameFr: string;
  nameTr: string;
  nameEs: string;
  lng: number;
  lat: number;
}

export type RouteType = 'strait' | 'canal' | 'passage';

export interface LocalizedText {
  ar: string;
  en: string;
  fr: string;
  tr: string;
  es: string;
}

export interface TradeRoute {
  id: string;
  nameAr: string;
  nameEn: string;
  nameFr: string;
  nameTr: string;
  nameEs: string;
  type: RouteType;
  coordinates: [number, number][];  // GeoJSON [lng, lat] pairs
  centerLng: number;
  centerLat: number;
  globalTradeShare: number;         // % of global trade passing through
  oilTradeShare: number;            // % of global oil trade
  dailyVolume: LocalizedText;       // Daily volume in each language
  status: 'normal' | 'disrupted' | 'threatened' | 'blocked';
  disruptionRisk: number;           // 0-100
  alternativeRoutes: string[];      // IDs of alternative routes
  affectedMarkets: string[];        // market symbols affected
  chokepoints: Chokepoint[];
}

export const TRADE_ROUTES: TradeRoute[] = [
  // ─── Strait of Hormuz ─────────────────────────────────────
  {
    id: 'hormuz',
    nameAr: 'مضيق هرمز',
    nameEn: 'Strait of Hormuz',
    nameFr: "Détroit d'Ormuz",
    nameTr: 'Hürmüz Boğazı',
    nameEs: 'Estrecho de Ormuz',
    type: 'strait',
    coordinates: [
      [56.05, 26.75], [56.10, 26.60], [56.15, 26.50], [56.20, 26.40],
      [56.25, 26.30], [56.30, 26.20], [56.35, 26.10], [56.40, 26.00],
      [56.50, 25.95], [56.60, 25.90],
    ],
    centerLng: 56.3,
    centerLat: 26.2,
    globalTradeShare: 21,
    oilTradeShare: 35,
    dailyVolume: { ar: '20 مليون برميل/يوم', en: '20 million barrels/day', fr: '20 millions de barils/jour', tr: '20 milyon varil/gün', es: '20 millones de barriles/día' },
    status: 'threatened',
    disruptionRisk: 65,
    alternativeRoutes: [],
    affectedMarkets: ['CL=F', '^TASI.SR', '^DFMGI'],
    chokepoints: [
      { nameAr: 'جزيرة قشم', nameEn: 'Qeshm Island', nameFr: 'Île de Qeshm', nameTr: 'Keşm Adası', nameEs: 'Isla de Qeshm', lng: 56.25, lat: 26.80 },
      { nameAr: 'جزيرة هرمز', nameEn: 'Hormuz Island', nameFr: 'Île d\'Hormuz', nameTr: 'Hürmüz Adası', nameEs: 'Isla de Ormuz', lng: 56.45, lat: 26.55 },
      { nameAr: 'ميناء الفجيرة', nameEn: 'Fujairah Port', nameFr: 'Port de Foujaïrah', nameTr: 'Fuceyre Limanı', nameEs: 'Puerto de Fujairah', lng: 56.35, lat: 25.12 },
    ],
  },
  // ─── Suez Canal ──────────────────────────────────────────
  {
    id: 'suez',
    nameAr: 'قناة السويس',
    nameEn: 'Suez Canal',
    nameFr: 'Canal de Suez',
    nameTr: 'Süveyş Kanalı',
    nameEs: 'Canal de Suez',
    type: 'canal',
    coordinates: [
      [32.30, 31.27], [32.31, 31.10], [32.32, 30.90], [32.33, 30.70],
      [32.35, 30.50], [32.40, 30.30], [32.45, 30.10], [32.50, 29.95],
      [32.52, 29.85], [32.55, 29.75],
    ],
    centerLng: 32.4,
    centerLat: 30.2,
    globalTradeShare: 16.4,
    oilTradeShare: 10,
    dailyVolume: { ar: '50 سفينة/يوم', en: '50 vessels/day', fr: '50 navires/jour', tr: '50 gemi/gün', es: '50 buques/día' },
    status: 'disrupted',
    disruptionRisk: 72,
    alternativeRoutes: ['cape_of_good_hope'],
    affectedMarkets: ['CL=F', 'GC=F'],
    chokepoints: [
      { nameAr: 'بورسعيد', nameEn: 'Port Said', nameFr: 'Port-Saïd', nameTr: 'Port Said', nameEs: 'Port Said', lng: 32.30, lat: 31.27 },
      { nameAr: 'الإسماعيلية', nameEn: 'Ismailia', nameFr: 'Ismailia', nameTr: 'İsmailiye', nameEs: 'Ismailia', lng: 32.27, lat: 30.60 },
      { nameAr: 'ميناء السويس', nameEn: 'Suez Port', nameFr: 'Port de Suez', nameTr: 'Süveyş Limanı', nameEs: 'Puerto de Suez', lng: 32.55, lat: 29.97 },
    ],
  },
  // ─── Bab el-Mandeb ───────────────────────────────────────
  {
    id: 'bab_el_mandeb',
    nameAr: 'باب المندب',
    nameEn: 'Bab el-Mandeb',
    nameFr: 'Bab el-Mandeb',
    nameTr: 'Babülmendeb',
    nameEs: 'Bab el-Mandeb',
    type: 'strait',
    coordinates: [
      [43.10, 12.80], [43.15, 12.70], [43.20, 12.60], [43.25, 12.55],
      [43.30, 12.50], [43.35, 12.48], [43.40, 12.50], [43.45, 12.55],
      [43.50, 12.60],
    ],
    centerLng: 43.4,
    centerLat: 12.55,
    globalTradeShare: 10,
    oilTradeShare: 8,
    dailyVolume: { ar: '57 سفينة/يوم', en: '57 vessels/day', fr: '57 navires/jour', tr: '57 gemi/gün', es: '57 buques/día' },
    status: 'disrupted',
    disruptionRisk: 78,
    alternativeRoutes: ['cape_of_good_hope'],
    affectedMarkets: ['CL=F'],
    chokepoints: [
      { nameAr: 'مضيق باب المندب', nameEn: 'Bab el-Mandeb Strait', nameFr: 'Détroit de Bab el-Mandeb', nameTr: 'Babülmendeb Boğazı', nameEs: 'Estrecho de Bab el-Mandeb', lng: 43.33, lat: 12.58 },
      { nameAr: 'جزيرة بريم', nameEn: 'Perim Island', nameFr: 'Île de Perim', nameTr: 'Perim Adası', nameEs: 'Isla de Perim', lng: 43.43, lat: 12.66 },
      { nameAr: 'جيبوتي', nameEn: 'Djibouti', nameFr: 'Djibouti', nameTr: 'Cibuti', nameEs: 'Yibuti', lng: 43.15, lat: 11.59 },
    ],
  },
  // ─── Strait of Malacca ───────────────────────────────────
  {
    id: 'malacca',
    nameAr: 'مضيق ملقا',
    nameEn: 'Strait of Malacca',
    nameFr: 'Détroit de Malacca',
    nameTr: 'Malakka Boğazı',
    nameEs: 'Estrecho de Malaca',
    type: 'strait',
    coordinates: [
      [98.80, 6.20], [99.50, 5.50], [100.20, 4.80], [100.80, 4.10],
      [101.30, 3.50], [101.80, 2.80], [102.20, 2.30], [102.60, 1.80],
      [103.00, 1.40], [103.50, 1.10],
    ],
    centerLng: 102.0,
    centerLat: 2.5,
    globalTradeShare: 25,
    oilTradeShare: 20,
    dailyVolume: { ar: '15 مليون برميل/يوم', en: '15 million barrels/day', fr: '15 millions de barils/jour', tr: '15 milyon varil/gün', es: '15 millones de barriles/día' },
    status: 'normal',
    disruptionRisk: 30,
    alternativeRoutes: ['lombok'],
    affectedMarkets: ['CL=F'],
    chokepoints: [
      { nameAr: 'ميناء سنغافورة', nameEn: 'Singapore Port', nameFr: 'Port de Singapour', nameTr: 'Singapur Limanı', nameEs: 'Puerto de Singapur', lng: 103.85, lat: 1.27 },
      { nameAr: 'مضيق ملقا الضيق', nameEn: 'Phillip Channel', nameFr: 'Canal de Phillip', nameTr: 'Philip Kanalı', nameEs: 'Canal de Phillip', lng: 103.60, lat: 1.20 },
      { nameAr: 'ميناء بيليبانغ', nameEn: 'Port Klang', nameFr: 'Port Klang', nameTr: 'Port Klang', nameEs: 'Port Klang', lng: 101.40, lat: 3.00 },
    ],
  },
  // ─── Cape of Good Hope (alternative route) ───────────────
  {
    id: 'cape_of_good_hope',
    nameAr: 'رأس الرجاء الصالح',
    nameEn: 'Cape of Good Hope',
    nameFr: "Cap de Bonne-Espérance",
    nameTr: 'Ümit Burnu',
    nameEs: 'Cabo de Buena Esperanza',
    type: 'passage',
    coordinates: [
      [17.50, -33.50], [18.00, -33.80], [18.30, -34.00], [18.50, -34.20],
      [18.60, -34.40], [18.60, -34.60], [18.50, -34.80], [18.30, -35.00],
      [19.00, -35.00],
    ],
    centerLng: 18.6,
    centerLat: -34.6,
    globalTradeShare: 0, // alternative route, increases when Suez disrupted
    oilTradeShare: 0,
    dailyVolume: { ar: 'بديل لقناة السويس (+10-14 يوم)', en: 'Alternative to Suez Canal (+10-14 days)', fr: 'Alternative au Canal de Suez (+10-14 jours)', tr: 'Süveyş Kanalı Alternatifi (+10-14 gün)', es: 'Alternativa al Canal de Suez (+10-14 días)' },
    status: 'normal',
    disruptionRisk: 5,
    alternativeRoutes: [],
    affectedMarkets: [],
    chokepoints: [
      { nameAr: 'كيب تاون', nameEn: 'Cape Town', nameFr: 'Le Cap', nameTr: 'Cape Town', nameEs: 'Ciudad del Cabo', lng: 18.42, lat: -33.93 },
    ],
  },
  // ─── Turkish Straits (Bosphorus + Dardanelles) ───────────
  {
    id: 'turkish_straits',
    nameAr: 'المضائق التركية',
    nameEn: 'Turkish Straits',
    nameFr: 'Détroits Turcs',
    nameTr: 'Türk Boğazları',
    nameEs: 'Estrechos Turcos',
    type: 'strait',
    coordinates: [
      [29.00, 41.20], [29.02, 41.15], [29.05, 41.10], [29.08, 41.05],
      [29.10, 41.00], [29.05, 40.95], [28.95, 40.90], [28.85, 40.85],
      [28.70, 40.80], [28.50, 40.60], [28.20, 40.40], [27.50, 40.20],
      [27.00, 40.10], [26.60, 40.00], [26.30, 39.95], [26.10, 40.00],
    ],
    centerLng: 27.8,
    centerLat: 40.6,
    globalTradeShare: 3,
    oilTradeShare: 5,
    dailyVolume: { ar: '3 مليون برميل/يوم', en: '3 million barrels/day', fr: '3 millions de barils/jour', tr: '3 milyon varil/gün', es: '3 millones de barriles/día' },
    status: 'normal',
    disruptionRisk: 20,
    alternativeRoutes: [],
    affectedMarkets: ['CL=F'],
    chokepoints: [
      { nameAr: 'مضيق البوسفور', nameEn: 'Bosphorus', nameFr: 'Bosphore', nameTr: 'İstanbul Boğazı', nameEs: 'Bósforo', lng: 29.05, lat: 41.10 },
      { nameAr: 'مضيق الدردنيل', nameEn: 'Dardanelles', nameFr: 'Dardanelles', nameTr: 'Çanakkale Boğazı', nameEs: 'Dardanelos', lng: 26.50, lat: 40.02 },
      { nameAr: 'إسطنبول', nameEn: 'Istanbul', nameFr: 'Istanbul', nameTr: 'İstanbul', nameEs: 'Estambul', lng: 29.00, lat: 41.01 },
    ],
  },
  // ─── Panama Canal ────────────────────────────────────────
  {
    id: 'panama',
    nameAr: 'قناة بنما',
    nameEn: 'Panama Canal',
    nameFr: 'Canal de Panama',
    nameTr: 'Panama Kanalı',
    nameEs: 'Canal de Panamá',
    type: 'canal',
    coordinates: [
      [-79.90, 9.35], [-79.85, 9.30], [-79.80, 9.25], [-79.75, 9.20],
      [-79.70, 9.15], [-79.65, 9.10], [-79.60, 9.08], [-79.55, 9.10],
      [-79.50, 9.15],
    ],
    centerLng: -79.8,
    centerLat: 9.2,
    globalTradeShare: 5,
    oilTradeShare: 3,
    dailyVolume: { ar: '38 سفينة/يوم', en: '38 vessels/day', fr: '38 navires/jour', tr: '38 gemi/gün', es: '38 buques/día' },
    status: 'normal',
    disruptionRisk: 15,
    alternativeRoutes: ['suez', 'cape_of_good_hope'],
    affectedMarkets: ['CL=F'],
    chokepoints: [
      { nameAr: 'ميناء كولون', nameEn: 'Colón Port', nameFr: 'Port de Colón', nameTr: 'Kolón Limanı', nameEs: 'Puerto de Colón', lng: -79.90, lat: 9.35 },
      { nameAr: 'بحيرة غاتون', nameEn: 'Gatun Lake', nameFr: 'Lac Gatun', nameTr: 'Gatun Gölü', nameEs: 'Lago Gatún', lng: -79.75, lat: 9.20 },
      { nameAr: 'ميناء بالبوا', nameEn: 'Balboa Port', nameFr: 'Port de Balboa', nameTr: 'Balboa Limanı', nameEs: 'Puerto de Balboa', lng: -79.55, lat: 9.08 },
    ],
  },
  // ─── Lombok Strait (alternative to Malacca) ──────────────
  {
    id: 'lombok',
    nameAr: 'مضيق لومبوك',
    nameEn: 'Lombok Strait',
    nameFr: 'Détroit de Lombok',
    nameTr: 'Lombok Boğazı',
    nameEs: 'Estrecho de Lombok',
    type: 'strait',
    coordinates: [
      [115.50, -8.10], [115.60, -8.25], [115.70, -8.40], [115.80, -8.55],
      [115.90, -8.70], [116.00, -8.85],
    ],
    centerLng: 115.9,
    centerLat: -8.55,
    globalTradeShare: 0, // alternative route
    oilTradeShare: 0,
    dailyVolume: { ar: 'بديل لمضيق ملقا', en: 'Alternative to Strait of Malacca', fr: "Alternative au Détroit de Malacca", tr: 'Malakka Boğazı Alternatifi', es: 'Alternativa al Estrecho de Malaca' },
    status: 'normal',
    disruptionRisk: 5,
    alternativeRoutes: [],
    affectedMarkets: [],
    chokepoints: [
      { nameAr: 'مضيق لومبوك', nameEn: 'Lombok Strait', nameFr: 'Détroit de Lombok', nameTr: 'Lombok Boğazı', nameEs: 'Estrecho de Lombok', lng: 115.85, lat: -8.60 },
    ],
  },
];

/**
 * Get the localized daily volume text for a trade route.
 */
export function getRouteDailyVolume(routeId: string, locale: string): string {
  const route = TRADE_ROUTES.find((r) => r.id === routeId);
  if (!route) return '';
  const loc = (locale as keyof LocalizedText) in route.dailyVolume ? (locale as keyof LocalizedText) : 'en';
  return route.dailyVolume[loc] || route.dailyVolume.en;
}

/**
 * Get the localized type label for a route type.
 */
export function getRouteTypeLabel(type: RouteType, locale: string): string {
  const typeLabels: Record<RouteType, LocalizedText> = {
    strait: { ar: 'مضيق', en: 'Strait', fr: 'Détroit', tr: 'Boğaz', es: 'Estrecho' },
    canal: { ar: 'قناة', en: 'Canal', fr: 'Canal', tr: 'Kanal', es: 'Canal' },
    passage: { ar: 'ممر', en: 'Passage', fr: 'Passage', tr: 'Geçit', es: 'Pasaje' },
  };
  const labels = typeLabels[type];
  if (!labels) return type;
  const loc = (locale as keyof LocalizedText) in labels ? (locale as keyof LocalizedText) : 'en';
  return labels[loc] || labels.en;
}

// ─── Locale field mapping ──────────────────────────────────────
const LOCALE_FIELD_MAP: Record<string, keyof TradeRoute> = {
  ar: 'nameAr',
  en: 'nameEn',
  fr: 'nameFr',
  tr: 'nameTr',
  es: 'nameEs',
};

/**
 * Get the localized name of a trade route.
 *
 * @param routeId - The route's unique ID
 * @param locale - Language code: 'ar', 'en', 'fr', 'tr', 'es'
 * @returns Localized route name, or English fallback
 */
export function getRouteName(routeId: string, locale: string): string {
  const route = TRADE_ROUTES.find((r) => r.id === routeId);
  if (!route) return routeId;

  const field = LOCALE_FIELD_MAP[locale] || 'nameEn';
  return (route[field] as string) || route.nameEn;
}

/**
 * Get all trade routes that are currently disrupted or threatened.
 * Excludes routes with 'normal' status.
 *
 * @returns Array of disrupted or threatened trade routes
 */
export function getDisruptedRoutes(): TradeRoute[] {
  return TRADE_ROUTES.filter(
    (route) => route.status === 'disrupted' || route.status === 'threatened' || route.status === 'blocked'
  );
}

/**
 * Get the status color for a trade route based on its current status.
 * Returns a hex color suitable for map markers and UI indicators.
 *
 * @param status - The route's current status
 * @returns Hex color string
 */
export function getRouteStatusColor(status: TradeRoute['status']): string {
  switch (status) {
    case 'normal':
      return '#22c55e'; // green
    case 'threatened':
      return '#f97316'; // orange
    case 'disrupted':
      return '#ef4444'; // red
    case 'blocked':
      return '#7f1d1d'; // dark red
    default:
      return '#6b7280'; // gray
  }
}

/**
 * Get a trade route by its ID.
 * Uses a pre-built Map for O(1) lookup instead of Array.find (O(n)).
 *
 * @param routeId - The route's unique ID
 * @returns Trade route object or undefined
 */

// Lazy-initialized Map for O(1) route lookups
let _routeByIdMap: Map<string, TradeRoute> | null = null;

function getRouteByIdMap(): Map<string, TradeRoute> {
  if (!_routeByIdMap) {
    _routeByIdMap = new Map(TRADE_ROUTES.map(r => [r.id, r]));
  }
  return _routeByIdMap;
}

export function getRouteById(routeId: string): TradeRoute | undefined {
  return getRouteByIdMap().get(routeId);
}

/**
 * Get all alternative routes for a given route.
 * Resolves the alternative route IDs to full TradeRoute objects.
 *
 * @param routeId - The route's unique ID
 * @returns Array of alternative trade routes
 */
export function getAlternativeRoutes(routeId: string): TradeRoute[] {
  const route = getRouteById(routeId);
  if (!route || route.alternativeRoutes.length === 0) return [];

  return route.alternativeRoutes
    .map((altId) => getRouteById(altId))
    .filter((r): r is TradeRoute => r !== undefined);
}

/**
 * Calculate the total global trade share at risk.
 * Sums the globalTradeShare of all disrupted/threatened/blocked routes.
 *
 * @returns Percentage of global trade at risk
 */
export function getTotalTradeAtRisk(): number {
  return TRADE_ROUTES
    .filter((r) => r.status !== 'normal')
    .reduce((sum, r) => sum + r.globalTradeShare, 0);
}

/**
 * Calculate the total oil trade share at risk.
 * Sums the oilTradeShare of all disrupted/threatened/blocked routes.
 *
 * @returns Percentage of global oil trade at risk
 */
export function getTotalOilTradeAtRisk(): number {
  return TRADE_ROUTES
    .filter((r) => r.status !== 'normal')
    .reduce((sum, r) => sum + r.oilTradeShare, 0);
}

/**
 * Get all unique market symbols affected by disrupted routes.
 *
 * @returns Array of market symbol strings
 */
export function getAffectedMarketSymbols(): string[] {
  const symbols = new Set<string>();
  TRADE_ROUTES
    .filter((r) => r.status !== 'normal')
    .forEach((r) => r.affectedMarkets.forEach((m) => symbols.add(m)));
  return Array.from(symbols);
}

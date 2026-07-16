// ─── Country GeoJSON Data with Arabic Names ────────────────────
// Rouaa (رؤى) Geopolitical Risk Platform
// Simplified for performance — only includes essential properties
//
// This file provides metadata only; the actual GeoJSON geometry
// is fetched from CDN at runtime for map visualization.

export interface CountryProperties {
  isoCode: string;
  nameAr: string;
  nameEn: string;
  nameFr: string;
  nameTr: string;
  nameEs: string;
  region: string;
  subRegion?: string;
  centerLat: number;
  centerLng: number;
}

// ─── Country Metadata ──────────────────────────────────────────
// Includes all Middle Eastern countries, major economies, and conflict zones
// for comprehensive geopolitical analysis (50+ countries)

export const COUNTRIES_METADATA: Record<string, CountryProperties> = {
  // ─── Gulf Cooperation Council (GCC) ─────────────────────
  SA: { isoCode: 'SA', nameAr: 'السعودية', nameEn: 'Saudi Arabia', nameFr: 'Arabie Saoudite', nameTr: 'Suudi Arabistan', nameEs: 'Arabia Saudita', region: 'middle-east', subRegion: 'gulf', centerLat: 23.8859, centerLng: 45.0792 },
  AE: { isoCode: 'AE', nameAr: 'الإمارات', nameEn: 'UAE', nameFr: 'Émirats Arabes Unis', nameTr: 'BAE', nameEs: 'EAU', region: 'middle-east', subRegion: 'gulf', centerLat: 23.4241, centerLng: 53.8478 },
  KW: { isoCode: 'KW', nameAr: 'الكويت', nameEn: 'Kuwait', nameFr: 'Koweït', nameTr: 'Kuveyt', nameEs: 'Kuwait', region: 'middle-east', subRegion: 'gulf', centerLat: 29.3759, centerLng: 47.9774 },
  QA: { isoCode: 'QA', nameAr: 'قطر', nameEn: 'Qatar', nameFr: 'Qatar', nameTr: 'Katar', nameEs: 'Catar', region: 'middle-east', subRegion: 'gulf', centerLat: 25.3548, centerLng: 51.1839 },
  BH: { isoCode: 'BH', nameAr: 'البحرين', nameEn: 'Bahrain', nameFr: 'Bahreïn', nameTr: 'Bahreyn', nameEs: 'Baréin', region: 'middle-east', subRegion: 'gulf', centerLat: 26.0667, centerLng: 50.5577 },
  OM: { isoCode: 'OM', nameAr: 'عُمان', nameEn: 'Oman', nameFr: 'Oman', nameTr: 'Umman', nameEs: 'Omán', region: 'middle-east', subRegion: 'gulf', centerLat: 21.4735, centerLng: 55.9754 },

  // ─── Levant ─────────────────────────────────────────────
  SY: { isoCode: 'SY', nameAr: 'سوريا', nameEn: 'Syria', nameFr: 'Syrie', nameTr: 'Suriye', nameEs: 'Siria', region: 'middle-east', subRegion: 'levant', centerLat: 34.8021, centerLng: 38.9968 },
  IQ: { isoCode: 'IQ', nameAr: 'العراق', nameEn: 'Iraq', nameFr: 'Irak', nameTr: 'Irak', nameEs: 'Irak', region: 'middle-east', subRegion: 'levant', centerLat: 33.2232, centerLng: 43.6793 },
  JO: { isoCode: 'JO', nameAr: 'الأردن', nameEn: 'Jordan', nameFr: 'Jordanie', nameTr: 'Ürdün', nameEs: 'Jordania', region: 'middle-east', subRegion: 'levant', centerLat: 30.5852, centerLng: 36.2384 },
  LB: { isoCode: 'LB', nameAr: 'لبنان', nameEn: 'Lebanon', nameFr: 'Liban', nameTr: 'Lübnan', nameEs: 'Líbano', region: 'middle-east', subRegion: 'levant', centerLat: 33.8547, centerLng: 35.8623 },
  PS: { isoCode: 'PS', nameAr: 'فلسطين', nameEn: 'Palestine', nameFr: 'Palestine', nameTr: 'Filistin', nameEs: 'Palestina', region: 'middle-east', subRegion: 'levant', centerLat: 31.9522, centerLng: 35.2332 },
  IL: { isoCode: 'IL', nameAr: 'إسرائيل', nameEn: 'Israel', nameFr: 'Israël', nameTr: 'İsrail', nameEs: 'Israel', region: 'middle-east', subRegion: 'levant', centerLat: 31.0461, centerLng: 34.8516 },

  // ─── Iran & Afghanistan ─────────────────────────────────
  IR: { isoCode: 'IR', nameAr: 'إيران', nameEn: 'Iran', nameFr: 'Iran', nameTr: 'İran', nameEs: 'Irán', region: 'middle-east', subRegion: 'persian', centerLat: 32.4279, centerLng: 53.6880 },
  AF: { isoCode: 'AF', nameAr: 'أفغانستان', nameEn: 'Afghanistan', nameFr: 'Afghanistan', nameTr: 'Afganistan', nameEs: 'Afganistán', region: 'central-asia', subRegion: undefined, centerLat: 33.9391, centerLng: 67.7100 },

  // ─── Yemen ──────────────────────────────────────────────
  YE: { isoCode: 'YE', nameAr: 'اليمن', nameEn: 'Yemen', nameFr: 'Yémen', nameTr: 'Yemen', nameEs: 'Yemen', region: 'middle-east', subRegion: 'arabian-peninsula', centerLat: 15.5527, centerLng: 48.5164 },

  // ─── North Africa ───────────────────────────────────────
  EG: { isoCode: 'EG', nameAr: 'مصر', nameEn: 'Egypt', nameFr: 'Égypte', nameTr: 'Mısır', nameEs: 'Egipto', region: 'north-africa', subRegion: 'nile', centerLat: 26.8206, centerLng: 30.8025 },
  LY: { isoCode: 'LY', nameAr: 'ليبيا', nameEn: 'Libya', nameFr: 'Libye', nameTr: 'Libya', nameEs: 'Libia', region: 'north-africa', subRegion: undefined, centerLat: 26.3351, centerLng: 17.2283 },
  TN: { isoCode: 'TN', nameAr: 'تونس', nameEn: 'Tunisia', nameFr: 'Tunisie', nameTr: 'Tunus', nameEs: 'Túnez', region: 'north-africa', subRegion: undefined, centerLat: 33.8869, centerLng: 9.5375 },
  DZ: { isoCode: 'DZ', nameAr: 'الجزائر', nameEn: 'Algeria', nameFr: 'Algérie', nameTr: 'Cezayir', nameEs: 'Argelia', region: 'north-africa', subRegion: undefined, centerLat: 28.0339, centerLng: 1.6596 },
  MA: { isoCode: 'MA', nameAr: 'المغرب', nameEn: 'Morocco', nameFr: 'Maroc', nameTr: 'Fas', nameEs: 'Marruecos', region: 'north-africa', subRegion: undefined, centerLat: 31.7917, centerLng: -7.0926 },
  SD: { isoCode: 'SD', nameAr: 'السودان', nameEn: 'Sudan', nameFr: 'Soudan', nameTr: 'Sudan', nameEs: 'Sudán', region: 'north-africa', subRegion: 'sahel', centerLat: 12.8628, centerLng: 30.2176 },
  SS: { isoCode: 'SS', nameAr: 'جنوب السودان', nameEn: 'South Sudan', nameFr: 'Soudan du Sud', nameTr: 'Güney Sudan', nameEs: 'Sudán del Sur', region: 'east-africa', subRegion: 'sahel', centerLat: 6.8770, centerLng: 31.3070 },

  // ─── Horn of Africa ─────────────────────────────────────
  ET: { isoCode: 'ET', nameAr: 'إثيوبيا', nameEn: 'Ethiopia', nameFr: 'Éthiopie', nameTr: 'Etiyopya', nameEs: 'Etiopía', region: 'east-africa', subRegion: 'horn', centerLat: 9.1450, centerLng: 40.4897 },
  SO: { isoCode: 'SO', nameAr: 'الصومال', nameEn: 'Somalia', nameFr: 'Somalie', nameTr: 'Somali', nameEs: 'Somalia', region: 'east-africa', subRegion: 'horn', centerLat: 5.1521, centerLng: 46.1996 },
  DJ: { isoCode: 'DJ', nameAr: 'جيبوتي', nameEn: 'Djibouti', nameFr: 'Djibouti', nameTr: 'Cibuti', nameEs: 'Yibuti', region: 'east-africa', subRegion: 'horn', centerLat: 11.8251, centerLng: 42.5903 },
  KE: { isoCode: 'KE', nameAr: 'كينيا', nameEn: 'Kenya', nameFr: 'Kenya', nameTr: 'Kenya', nameEs: 'Kenia', region: 'east-africa', subRegion: undefined, centerLat: -0.0236, centerLng: 37.9062 },
  NG: { isoCode: 'NG', nameAr: 'نيجيريا', nameEn: 'Nigeria', nameFr: 'Nigeria', nameTr: 'Nijerya', nameEs: 'Nigeria', region: 'west-africa', subRegion: undefined, centerLat: 9.0820, centerLng: 8.6753 },

  // ─── Turkey ─────────────────────────────────────────────
  TR: { isoCode: 'TR', nameAr: 'تركيا', nameEn: 'Turkey', nameFr: 'Turquie', nameTr: 'Türkiye', nameEs: 'Turquía', region: 'europe', subRegion: 'southeast-europe', centerLat: 38.9637, centerLng: 35.2433 },

  // ─── Major Powers ──────────────────────────────────────
  US: { isoCode: 'US', nameAr: 'الولايات المتحدة', nameEn: 'United States', nameFr: 'États-Unis', nameTr: 'Amerika Birleşik Devletleri', nameEs: 'Estados Unidos', region: 'north-america', subRegion: undefined, centerLat: 37.0902, centerLng: -95.7129 },
  CN: { isoCode: 'CN', nameAr: 'الصين', nameEn: 'China', nameFr: 'Chine', nameTr: 'Çin', nameEs: 'China', region: 'east-asia', subRegion: undefined, centerLat: 35.8617, centerLng: 104.1954 },
  RU: { isoCode: 'RU', nameAr: 'روسيا', nameEn: 'Russia', nameFr: 'Russie', nameTr: 'Rusya', nameEs: 'Rusia', region: 'europe', subRegion: 'eastern-europe', centerLat: 61.5240, centerLng: 105.3188 },
  GB: { isoCode: 'GB', nameAr: 'بريطانيا', nameEn: 'United Kingdom', nameFr: 'Royaume-Uni', nameTr: 'Birleşik Krallık', nameEs: 'Reino Unido', region: 'europe', subRegion: 'western-europe', centerLat: 55.3781, centerLng: -3.4360 },
  FR: { isoCode: 'FR', nameAr: 'فرنسا', nameEn: 'France', nameFr: 'France', nameTr: 'Fransa', nameEs: 'Francia', region: 'europe', subRegion: 'western-europe', centerLat: 46.2276, centerLng: 2.2137 },
  DE: { isoCode: 'DE', nameAr: 'ألمانيا', nameEn: 'Germany', nameFr: 'Allemagne', nameTr: 'Almanya', nameEs: 'Alemania', region: 'europe', subRegion: 'western-europe', centerLat: 51.1657, centerLng: 10.4515 },

  // ─── Eastern Europe / Conflict Zones ───────────────────
  UA: { isoCode: 'UA', nameAr: 'أوكرانيا', nameEn: 'Ukraine', nameFr: 'Ukraine', nameTr: 'Ukrayna', nameEs: 'Ucrania', region: 'europe', subRegion: 'eastern-europe', centerLat: 48.3794, centerLng: 31.1656 },

  // ─── South Asia ────────────────────────────────────────
  IN: { isoCode: 'IN', nameAr: 'الهند', nameEn: 'India', nameFr: 'Inde', nameTr: 'Hindistan', nameEs: 'India', region: 'south-asia', subRegion: undefined, centerLat: 20.5937, centerLng: 78.9629 },
  PK: { isoCode: 'PK', nameAr: 'باكستان', nameEn: 'Pakistan', nameFr: 'Pakistan', nameTr: 'Pakistan', nameEs: 'Pakistán', region: 'south-asia', subRegion: undefined, centerLat: 30.3753, centerLng: 69.3451 },

  // ─── East Asia ─────────────────────────────────────────
  JP: { isoCode: 'JP', nameAr: 'اليابان', nameEn: 'Japan', nameFr: 'Japon', nameTr: 'Japonya', nameEs: 'Japón', region: 'east-asia', subRegion: undefined, centerLat: 36.2048, centerLng: 138.2529 },
  KR: { isoCode: 'KR', nameAr: 'كوريا الجنوبية', nameEn: 'South Korea', nameFr: 'Corée du Sud', nameTr: 'Güney Kore', nameEs: 'Corea del Sur', region: 'east-asia', subRegion: undefined, centerLat: 35.9078, centerLng: 127.7669 },
  TW: { isoCode: 'TW', nameAr: 'تايوان', nameEn: 'Taiwan', nameFr: 'Taïwan', nameTr: 'Tayvan', nameEs: 'Taiwán', region: 'east-asia', subRegion: undefined, centerLat: 23.6978, centerLng: 120.9605 },

  // ─── Oceania ───────────────────────────────────────────
  AU: { isoCode: 'AU', nameAr: 'أستراليا', nameEn: 'Australia', nameFr: 'Australie', nameTr: 'Avustralya', nameEs: 'Australia', region: 'oceania', subRegion: undefined, centerLat: -25.2744, centerLng: 133.7751 },

  // ─── South America ─────────────────────────────────────
  BR: { isoCode: 'BR', nameAr: 'البرازيل', nameEn: 'Brazil', nameFr: 'Brésil', nameTr: 'Brezilya', nameEs: 'Brasil', region: 'south-america', subRegion: undefined, centerLat: -14.2350, centerLng: -51.9253 },
  AR: { isoCode: 'AR', nameAr: 'الأرجنتين', nameEn: 'Argentina', nameFr: 'Argentine', nameTr: 'Arjantin', nameEs: 'Argentina', region: 'south-america', subRegion: undefined, centerLat: -38.4161, centerLng: -63.6167 },

  // ─── North/Central America ─────────────────────────────
  CA: { isoCode: 'CA', nameAr: 'كندا', nameEn: 'Canada', nameFr: 'Canada', nameTr: 'Kanada', nameEs: 'Canadá', region: 'north-america', subRegion: undefined, centerLat: 56.1304, centerLng: -106.3468 },
  MX: { isoCode: 'MX', nameAr: 'المكسيك', nameEn: 'Mexico', nameFr: 'Mexique', nameTr: 'Meksika', nameEs: 'México', region: 'north-america', subRegion: undefined, centerLat: 23.6345, centerLng: -102.5528 },
  PA: { isoCode: 'PA', nameAr: 'بنما', nameEn: 'Panama', nameFr: 'Panama', nameTr: 'Panama', nameEs: 'Panamá', region: 'central-america', subRegion: undefined, centerLat: 8.5380, centerLng: -80.7822 },

  // ─── Southern Africa ───────────────────────────────────
  ZA: { isoCode: 'ZA', nameAr: 'جنوب أفريقيا', nameEn: 'South Africa', nameFr: 'Afrique du Sud', nameTr: 'Güney Afrika', nameEs: 'Sudáfrica', region: 'southern-africa', subRegion: undefined, centerLat: -30.5595, centerLng: 22.9375 },
};

// ─── GeoJSON Source ────────────────────────────────────────────
// Using Natural Earth simplified 1:110m TopoJSON (~200KB) instead of
// the full 23MB GeoJSON from GitHub. This reduces map load time by ~10-20x.
// The simplified version still provides clear country boundaries at zoom levels 0-6.

export const GEOJSON_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Alternative: 1:50m for more detail (~500KB)
// export const GEOJSON_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';

// ─── Locale field mapping ──────────────────────────────────────
const LOCALE_NAME_FIELD: Record<string, keyof CountryProperties> = {
  ar: 'nameAr',
  en: 'nameEn',
  fr: 'nameFr',
  tr: 'nameTr',
  es: 'nameEs',
};

/**
 * Get the localized name of a country by its ISO code.
 *
 * @param isoCode - ISO 2-letter country code (e.g., 'SA', 'AE')
 * @param locale - Language code: 'ar', 'en', 'fr', 'tr', 'es'
 * @returns Localized country name, or English fallback, or the ISO code
 */
export function getCountryName(isoCode: string, locale: string): string {
  const country = COUNTRIES_METADATA[isoCode];
  if (!country) return isoCode;

  const field = LOCALE_NAME_FIELD[locale] || 'nameEn';
  return (country[field] as string) || country.nameEn;
}

/**
 * Get the region of a country by its ISO code.
 *
 * @param isoCode - ISO 2-letter country code
 * @returns Region string or 'unknown'
 */
export function getCountryRegion(isoCode: string): string {
  const country = COUNTRIES_METADATA[isoCode];
  return country?.region || 'unknown';
}

/**
 * Get the sub-region of a country by its ISO code.
 *
 * @param isoCode - ISO 2-letter country code
 * @returns Sub-region string or undefined
 */
export function getCountrySubRegion(isoCode: string): string | undefined {
  const country = COUNTRIES_METADATA[isoCode];
  return country?.subRegion;
}

/**
 * Get all countries in a specific region.
 *
 * @param region - Region name (e.g., 'middle-east', 'north-africa')
 * @returns Array of country properties in that region
 */
export function getCountriesByRegion(region: string): CountryProperties[] {
  return Object.values(COUNTRIES_METADATA).filter((c) => c.region === region);
}

/**
 * Get all countries in a specific sub-region.
 *
 * @param subRegion - Sub-region name (e.g., 'gulf', 'levant')
 * @returns Array of country properties in that sub-region
 */
export function getCountriesBySubRegion(subRegion: string): CountryProperties[] {
  return Object.values(COUNTRIES_METADATA).filter((c) => c.subRegion === subRegion);
}

/**
 * Get all unique regions in the dataset.
 *
 * @returns Array of region strings
 */
export function getAllRegions(): string[] {
  const regions = new Set<string>();
  Object.values(COUNTRIES_METADATA).forEach((c) => regions.add(c.region));
  return Array.from(regions).sort();
}

/**
 * Get all unique sub-regions in the dataset.
 *
 * @returns Array of sub-region strings (excludes undefined)
 */
export function getAllSubRegions(): string[] {
  const subRegions = new Set<string>();
  Object.values(COUNTRIES_METADATA).forEach((c) => {
    if (c.subRegion) subRegions.add(c.subRegion);
  });
  return Array.from(subRegions).sort();
}

/**
 * Look up a country by its Arabic name.
 * Useful for matching Arabic news text to country codes.
 *
 * @param nameAr - Country name in Arabic
 * @returns Country properties or undefined
 */
export function getCountryByArabicName(nameAr: string): CountryProperties | undefined {
  const normalized = nameAr.trim();
  return Object.values(COUNTRIES_METADATA).find((c) => c.nameAr === normalized);
}

/**
 * Get the ISO code for a country by its name in any supported language.
 * Performs case-insensitive matching.
 *
 * @param name - Country name in any supported language
 * @returns ISO code or undefined
 */
export function getCountryCodeByName(name: string): string | undefined {
  const normalized = name.trim().toLowerCase();
  return Object.values(COUNTRIES_METADATA).find((c) => {
    return (
      c.nameAr === name ||
      c.nameEn.toLowerCase() === normalized ||
      c.nameFr.toLowerCase() === normalized ||
      c.nameTr.toLowerCase() === normalized ||
      c.nameEs.toLowerCase() === normalized
    );
  })?.isoCode;
}

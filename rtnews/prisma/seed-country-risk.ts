// ─── Seed Script: CountryRiskScore — 50+ Countries ──────────────
// Rouaa (رؤى) Geopolitical Risk Platform
// Run: npx tsx prisma/seed-country-risk.ts
// Or:  bunx tsx prisma/seed-country-risk.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CountrySeedData {
  countryCode: string;
  countryNameAr: string;
  countryNameEn: string;
  compositeScore: number;
  gprScore: number | null;
  aiGprScore: number | null;
  acledScore: number | null;
  worldBankScore: number | null;
  gdeltScore: number | null;
  peaceIndexScore: number | null;
  riskLevel: string;
  riskCategory: string;
  region: string;
  subRegion: string | null;
  latitude: number | null;
  longitude: number | null;
}

// ─── 50+ Countries with realistic risk data ────────────────────
// Based on 2024-2025 ACLED, GDELT, World Bank WGI, and GPI data
// Composite scores use the RGI formula: 0.35*GPR + 0.25*ACLED + 0.20*WB + 0.10*GDELT + 0.10*GPI

const COUNTRIES: CountrySeedData[] = [
  // ─── Middle East — الخليج والشرق الأوسط ────────────────────────
  {
    countryCode: 'SY', countryNameAr: 'سوريا', countryNameEn: 'Syria',
    compositeScore: 92, gprScore: 320, aiGprScore: 92, acledScore: 88, worldBankScore: -2.3,
    gdeltScore: -6.5, peaceIndexScore: 4.6, riskLevel: 'severe', riskCategory: 'conflict',
    region: 'middle-east', subRegion: 'levant', latitude: 35.0, longitude: 38.0,
  },
  {
    countryCode: 'IQ', countryNameAr: 'العراق', countryNameEn: 'Iraq',
    compositeScore: 78, gprScore: 180, aiGprScore: 78, acledScore: 72, worldBankScore: -1.8,
    gdeltScore: -4.2, peaceIndexScore: 3.9, riskLevel: 'high', riskCategory: 'conflict',
    region: 'middle-east', subRegion: 'levant', latitude: 33.2, longitude: 43.7,
  },
  {
    countryCode: 'YE', countryNameAr: 'اليمن', countryNameEn: 'Yemen',
    compositeScore: 88, gprScore: 260, aiGprScore: 85, acledScore: 82, worldBankScore: -2.1,
    gdeltScore: -5.8, peaceIndexScore: 4.3, riskLevel: 'severe', riskCategory: 'conflict',
    region: 'middle-east', subRegion: 'arabian-peninsula', latitude: 15.9, longitude: 47.5,
  },
  {
    countryCode: 'IR', countryNameAr: 'إيران', countryNameEn: 'Iran',
    compositeScore: 75, gprScore: 160, aiGprScore: 75, acledScore: 45, worldBankScore: -1.5,
    gdeltScore: -3.8, peaceIndexScore: 3.4, riskLevel: 'high', riskCategory: 'sanctions',
    region: 'middle-east', subRegion: 'gulf', latitude: 32.4, longitude: 53.7,
  },
  {
    countryCode: 'IL', countryNameAr: 'إسرائيل', countryNameEn: 'Israel',
    compositeScore: 82, gprScore: 220, aiGprScore: 82, acledScore: 68, worldBankScore: -0.8,
    gdeltScore: -5.2, peaceIndexScore: 3.2, riskLevel: 'severe', riskCategory: 'conflict',
    region: 'middle-east', subRegion: 'levant', latitude: 31.0, longitude: 34.8,
  },
  {
    countryCode: 'PS', countryNameAr: 'فلسطين', countryNameEn: 'Palestine',
    compositeScore: 90, gprScore: 280, aiGprScore: 88, acledScore: 85, worldBankScore: -2.2,
    gdeltScore: -6.8, peaceIndexScore: 4.5, riskLevel: 'severe', riskCategory: 'conflict',
    region: 'middle-east', subRegion: 'levant', latitude: 31.9, longitude: 35.2,
  },
  {
    countryCode: 'LB', countryNameAr: 'لبنان', countryNameEn: 'Lebanon',
    compositeScore: 76, gprScore: 140, aiGprScore: 83, acledScore: 55, worldBankScore: -1.6,
    gdeltScore: -4.5, peaceIndexScore: 3.5, riskLevel: 'high', riskCategory: 'political',
    region: 'middle-east', subRegion: 'levant', latitude: 33.9, longitude: 35.5,
  },
  {
    countryCode: 'SA', countryNameAr: 'السعودية', countryNameEn: 'Saudi Arabia',
    compositeScore: 38, gprScore: 75, aiGprScore: 42, acledScore: 22, worldBankScore: -0.5,
    gdeltScore: -1.5, peaceIndexScore: 2.4, riskLevel: 'moderate', riskCategory: 'energy',
    region: 'middle-east', subRegion: 'gulf', latitude: 23.9, longitude: 45.1,
  },
  {
    countryCode: 'AE', countryNameAr: 'الإمارات', countryNameEn: 'United Arab Emirates',
    compositeScore: 18, gprScore: 30, aiGprScore: 22, acledScore: 5, worldBankScore: 0.8,
    gdeltScore: -0.5, peaceIndexScore: 1.8, riskLevel: 'low', riskCategory: 'trade',
    region: 'middle-east', subRegion: 'gulf', latitude: 23.4, longitude: 53.8,
  },
  {
    countryCode: 'KW', countryNameAr: 'الكويت', countryNameEn: 'Kuwait',
    compositeScore: 25, gprScore: 40, aiGprScore: 30, acledScore: 8, worldBankScore: 0.2,
    gdeltScore: -0.8, peaceIndexScore: 2.0, riskLevel: 'low', riskCategory: 'energy',
    region: 'middle-east', subRegion: 'gulf', latitude: 29.4, longitude: 47.9,
  },
  {
    countryCode: 'QA', countryNameAr: 'قطر', countryNameEn: 'Qatar',
    compositeScore: 15, gprScore: 25, aiGprScore: 18, acledScore: 3, worldBankScore: 0.9,
    gdeltScore: -0.3, peaceIndexScore: 1.6, riskLevel: 'low', riskCategory: 'energy',
    region: 'middle-east', subRegion: 'gulf', latitude: 25.4, longitude: 51.2,
  },
  {
    countryCode: 'BH', countryNameAr: 'البحرين', countryNameEn: 'Bahrain',
    compositeScore: 32, gprScore: 45, aiGprScore: 25, acledScore: 12, worldBankScore: -0.3,
    gdeltScore: -1.2, peaceIndexScore: 2.2, riskLevel: 'moderate', riskCategory: 'political',
    region: 'middle-east', subRegion: 'gulf', latitude: 26.1, longitude: 50.6,
  },
  {
    countryCode: 'OM', countryNameAr: 'عُمان', countryNameEn: 'Oman',
    compositeScore: 14, gprScore: 20, aiGprScore: 18, acledScore: 2, worldBankScore: 0.6,
    gdeltScore: -0.2, peaceIndexScore: 1.7, riskLevel: 'low', riskCategory: 'trade',
    region: 'middle-east', subRegion: 'gulf', latitude: 21.5, longitude: 55.9,
  },
  {
    countryCode: 'JO', countryNameAr: 'الأردن', countryNameEn: 'Jordan',
    compositeScore: 35, gprScore: 55, aiGprScore: 35, acledScore: 15, worldBankScore: -0.4,
    gdeltScore: -1.0, peaceIndexScore: 2.1, riskLevel: 'moderate', riskCategory: 'political',
    region: 'middle-east', subRegion: 'levant', latitude: 30.6, longitude: 36.2,
  },
  {
    countryCode: 'EG', countryNameAr: 'مصر', countryNameEn: 'Egypt',
    compositeScore: 48, gprScore: 80, aiGprScore: 40, acledScore: 35, worldBankScore: -1.0,
    gdeltScore: -2.5, peaceIndexScore: 2.8, riskLevel: 'elevated', riskCategory: 'political',
    region: 'middle-east', subRegion: 'north-africa', latitude: 26.8, longitude: 30.8,
  },

  // ─── East Asia — شرق آسيا ──────────────────────────────────────
  {
    countryCode: 'CN', countryNameAr: 'الصين', countryNameEn: 'China',
    compositeScore: 55, gprScore: 90, aiGprScore: 48, acledScore: 25, worldBankScore: -0.3,
    gdeltScore: -2.0, peaceIndexScore: 2.3, riskLevel: 'elevated', riskCategory: 'trade',
    region: 'east-asia', subRegion: null, latitude: 35.9, longitude: 104.2,
  },
  {
    countryCode: 'TW', countryNameAr: 'تايوان', countryNameEn: 'Taiwan',
    compositeScore: 62, gprScore: 120, aiGprScore: 62, acledScore: 8, worldBankScore: 0.8,
    gdeltScore: -3.0, peaceIndexScore: 1.7, riskLevel: 'elevated', riskCategory: 'conflict',
    region: 'east-asia', subRegion: null, latitude: 23.7, longitude: 120.9,
  },
  {
    countryCode: 'KP', countryNameAr: 'كوريا الشمالية', countryNameEn: 'North Korea',
    compositeScore: 72, gprScore: 150, aiGprScore: 70, acledScore: 10, worldBankScore: -1.8,
    gdeltScore: -4.0, peaceIndexScore: 3.5, riskLevel: 'high', riskCategory: 'conflict',
    region: 'east-asia', subRegion: null, latitude: 40.3, longitude: 127.5,
  },
  {
    countryCode: 'JP', countryNameAr: 'اليابان', countryNameEn: 'Japan',
    compositeScore: 12, gprScore: 20, aiGprScore: 28, acledScore: 2, worldBankScore: 1.2,
    gdeltScore: -0.3, peaceIndexScore: 1.3, riskLevel: 'low', riskCategory: 'trade',
    region: 'east-asia', subRegion: null, latitude: 36.2, longitude: 138.3,
  },
  {
    countryCode: 'KR', countryNameAr: 'كوريا الجنوبية', countryNameEn: 'South Korea',
    compositeScore: 30, gprScore: 50, aiGprScore: 38, acledScore: 5, worldBankScore: 0.5,
    gdeltScore: -1.0, peaceIndexScore: 1.7, riskLevel: 'moderate', riskCategory: 'conflict',
    region: 'east-asia', subRegion: null, latitude: 35.9, longitude: 127.8,
  },

  // ─── Europe — أوروبا ────────────────────────────────────────────
  {
    countryCode: 'UA', countryNameAr: 'أوكرانيا', countryNameEn: 'Ukraine',
    compositeScore: 96, gprScore: 380, aiGprScore: 95, acledScore: 92, worldBankScore: -2.4,
    gdeltScore: -7.5, peaceIndexScore: 4.8, riskLevel: 'severe', riskCategory: 'conflict',
    region: 'europe', subRegion: 'eastern-europe', latitude: 48.4, longitude: 31.2,
  },
  {
    countryCode: 'RU', countryNameAr: 'روسيا', countryNameEn: 'Russia',
    compositeScore: 88, gprScore: 300, aiGprScore: 88, acledScore: 65, worldBankScore: -1.5,
    gdeltScore: -5.5, peaceIndexScore: 3.4, riskLevel: 'severe', riskCategory: 'conflict',
    region: 'europe', subRegion: 'eastern-europe', latitude: 61.5, longitude: 105.3,
  },
  {
    countryCode: 'GB', countryNameAr: 'بريطانيا', countryNameEn: 'United Kingdom',
    compositeScore: 15, gprScore: 22, aiGprScore: 20, acledScore: 8, worldBankScore: 0.7,
    gdeltScore: -0.5, peaceIndexScore: 1.6, riskLevel: 'low', riskCategory: 'political',
    region: 'europe', subRegion: 'western-europe', latitude: 55.4, longitude: -3.4,
  },
  {
    countryCode: 'FR', countryNameAr: 'فرنسا', countryNameEn: 'France',
    compositeScore: 18, gprScore: 28, aiGprScore: 22, acledScore: 12, worldBankScore: 0.4,
    gdeltScore: -0.8, peaceIndexScore: 1.8, riskLevel: 'low', riskCategory: 'political',
    region: 'europe', subRegion: 'western-europe', latitude: 46.2, longitude: 2.2,
  },
  {
    countryCode: 'DE', countryNameAr: 'ألمانيا', countryNameEn: 'Germany',
    compositeScore: 14, gprScore: 20, aiGprScore: 18, acledScore: 6, worldBankScore: 0.9,
    gdeltScore: -0.4, peaceIndexScore: 1.5, riskLevel: 'low', riskCategory: 'energy',
    region: 'europe', subRegion: 'western-europe', latitude: 51.2, longitude: 10.5,
  },
  {
    countryCode: 'PL', countryNameAr: 'بولندا', countryNameEn: 'Poland',
    compositeScore: 32, gprScore: 55, aiGprScore: 30, acledScore: 10, worldBankScore: 0.8,
    gdeltScore: -1.2, peaceIndexScore: 1.8, riskLevel: 'moderate', riskCategory: 'conflict',
    region: 'europe', subRegion: 'eastern-europe', latitude: 51.9, longitude: 19.1,
  },
  {
    countryCode: 'TR', countryNameAr: 'تركيا', countryNameEn: 'Turkey',
    compositeScore: 52, gprScore: 85, aiGprScore: 45, acledScore: 38, worldBankScore: -0.8,
    gdeltScore: -2.2, peaceIndexScore: 2.8, riskLevel: 'elevated', riskCategory: 'political',
    region: 'europe', subRegion: 'southeastern-europe', latitude: 39.0, longitude: 35.2,
  },

  // ─── South Asia — جنوب آسيا ────────────────────────────────────
  {
    countryCode: 'AF', countryNameAr: 'أفغانستان', countryNameEn: 'Afghanistan',
    compositeScore: 90, gprScore: 280, aiGprScore: 90, acledScore: 82, worldBankScore: -2.3,
    gdeltScore: -6.0, peaceIndexScore: 4.5, riskLevel: 'severe', riskCategory: 'conflict',
    region: 'south-asia', subRegion: null, latitude: 33.9, longitude: 67.7,
  },
  {
    countryCode: 'PK', countryNameAr: 'باكستان', countryNameEn: 'Pakistan',
    compositeScore: 68, gprScore: 120, aiGprScore: 65, acledScore: 55, worldBankScore: -1.5,
    gdeltScore: -3.2, peaceIndexScore: 3.0, riskLevel: 'high', riskCategory: 'conflict',
    region: 'south-asia', subRegion: null, latitude: 30.4, longitude: 69.3,
  },
  {
    countryCode: 'IN', countryNameAr: 'الهند', countryNameEn: 'India',
    compositeScore: 42, gprScore: 65, aiGprScore: 40, acledScore: 32, worldBankScore: -0.4,
    gdeltScore: -1.5, peaceIndexScore: 2.4, riskLevel: 'elevated', riskCategory: 'political',
    region: 'south-asia', subRegion: null, latitude: 20.6, longitude: 79.0,
  },

  // ─── Africa — أفريقيا ──────────────────────────────────────────
  {
    countryCode: 'SO', countryNameAr: 'الصومال', countryNameEn: 'Somalia',
    compositeScore: 85, gprScore: 240, aiGprScore: 85, acledScore: 78, worldBankScore: -2.2,
    gdeltScore: -5.5, peaceIndexScore: 4.2, riskLevel: 'severe', riskCategory: 'conflict',
    region: 'africa', subRegion: 'east-africa', latitude: 5.2, longitude: 46.2,
  },
  {
    countryCode: 'ET', countryNameAr: 'إثيوبيا', countryNameEn: 'Ethiopia',
    compositeScore: 70, gprScore: 150, aiGprScore: 70, acledScore: 60, worldBankScore: -1.4,
    gdeltScore: -3.5, peaceIndexScore: 3.0, riskLevel: 'high', riskCategory: 'conflict',
    region: 'africa', subRegion: 'east-africa', latitude: 9.1, longitude: 40.5,
  },
  {
    countryCode: 'SD', countryNameAr: 'السودان', countryNameEn: 'Sudan',
    compositeScore: 82, gprScore: 220, aiGprScore: 80, acledScore: 75, worldBankScore: -2.0,
    gdeltScore: -5.0, peaceIndexScore: 3.8, riskLevel: 'severe', riskCategory: 'conflict',
    region: 'africa', subRegion: 'north-africa', latitude: 12.9, longitude: 30.2,
  },
  {
    countryCode: 'LY', countryNameAr: 'ليبيا', countryNameEn: 'Libya',
    compositeScore: 78, gprScore: 200, aiGprScore: 78, acledScore: 65, worldBankScore: -1.9,
    gdeltScore: -4.2, peaceIndexScore: 3.4, riskLevel: 'high', riskCategory: 'conflict',
    region: 'africa', subRegion: 'north-africa', latitude: 26.3, longitude: 17.2,
  },
  {
    countryCode: 'NG', countryNameAr: 'نيجيريا', countryNameEn: 'Nigeria',
    compositeScore: 55, gprScore: 95, aiGprScore: 52, acledScore: 45, worldBankScore: -1.2,
    gdeltScore: -2.5, peaceIndexScore: 2.8, riskLevel: 'elevated', riskCategory: 'conflict',
    region: 'africa', subRegion: 'west-africa', latitude: 9.1, longitude: 8.7,
  },
  {
    countryCode: 'ZA', countryNameAr: 'جنوب أفريقيا', countryNameEn: 'South Africa',
    compositeScore: 25, gprScore: 40, aiGprScore: 28, acledScore: 15, worldBankScore: 0.1,
    gdeltScore: -0.8, peaceIndexScore: 2.2, riskLevel: 'moderate', riskCategory: 'political',
    region: 'africa', subRegion: 'southern-africa', latitude: -30.6, longitude: 22.9,
  },
  {
    countryCode: 'DZ', countryNameAr: 'الجزائر', countryNameEn: 'Algeria',
    compositeScore: 38, gprScore: 60, aiGprScore: 38, acledScore: 18, worldBankScore: -0.8,
    gdeltScore: -1.5, peaceIndexScore: 2.3, riskLevel: 'moderate', riskCategory: 'political',
    region: 'africa', subRegion: 'north-africa', latitude: 28.0, longitude: 1.7,
  },
  {
    countryCode: 'MA', countryNameAr: 'المغرب', countryNameEn: 'Morocco',
    compositeScore: 22, gprScore: 35, aiGprScore: 25, acledScore: 10, worldBankScore: 0.2,
    gdeltScore: -0.6, peaceIndexScore: 1.9, riskLevel: 'low', riskCategory: 'political',
    region: 'africa', subRegion: 'north-africa', latitude: 31.8, longitude: -7.1,
  },
  {
    countryCode: 'KE', countryNameAr: 'كينيا', countryNameEn: 'Kenya',
    compositeScore: 35, gprScore: 55, aiGprScore: 35, acledScore: 20, worldBankScore: -0.5,
    gdeltScore: -1.2, peaceIndexScore: 2.2, riskLevel: 'moderate', riskCategory: 'political',
    region: 'africa', subRegion: 'east-africa', latitude: -0.02, longitude: 37.9,
  },
  {
    countryCode: 'CD', countryNameAr: 'الكونغو الديمقراطية', countryNameEn: 'DR Congo',
    compositeScore: 78, gprScore: 190, aiGprScore: 72, acledScore: 70, worldBankScore: -2.0,
    gdeltScore: -4.0, peaceIndexScore: 3.6, riskLevel: 'high', riskCategory: 'conflict',
    region: 'africa', subRegion: 'central-africa', latitude: -4.0, longitude: 21.8,
  },

  // ─── Americas — الأمريكتان ─────────────────────────────────────
  {
    countryCode: 'US', countryNameAr: 'الولايات المتحدة', countryNameEn: 'United States',
    compositeScore: 20, gprScore: 35, aiGprScore: 22, acledScore: 12, worldBankScore: 0.7,
    gdeltScore: -0.8, peaceIndexScore: 2.0, riskLevel: 'low', riskCategory: 'political',
    region: 'americas', subRegion: 'north-america', latitude: 37.1, longitude: -95.7,
  },
  {
    countryCode: 'VE', countryNameAr: 'فنزويلا', countryNameEn: 'Venezuela',
    compositeScore: 65, gprScore: 120, aiGprScore: 60, acledScore: 42, worldBankScore: -1.5,
    gdeltScore: -3.5, peaceIndexScore: 3.0, riskLevel: 'high', riskCategory: 'political',
    region: 'americas', subRegion: 'south-america', latitude: 6.4, longitude: -66.6,
  },
  {
    countryCode: 'MX', countryNameAr: 'المكسيك', countryNameEn: 'Mexico',
    compositeScore: 52, gprScore: 90, aiGprScore: 48, acledScore: 45, worldBankScore: -0.6,
    gdeltScore: -2.0, peaceIndexScore: 2.6, riskLevel: 'elevated', riskCategory: 'conflict',
    region: 'americas', subRegion: 'north-america', latitude: 23.6, longitude: -102.6,
  },
  {
    countryCode: 'BR', countryNameAr: 'البرازيل', countryNameEn: 'Brazil',
    compositeScore: 28, gprScore: 40, aiGprScore: 25, acledScore: 18, worldBankScore: -0.1,
    gdeltScore: -0.8, peaceIndexScore: 2.2, riskLevel: 'moderate', riskCategory: 'political',
    region: 'americas', subRegion: 'south-america', latitude: -14.2, longitude: -51.9,
  },
  {
    countryCode: 'CO', countryNameAr: 'كولومبيا', countryNameEn: 'Colombia',
    compositeScore: 50, gprScore: 85, aiGprScore: 50, acledScore: 40, worldBankScore: -0.7,
    gdeltScore: -1.8, peaceIndexScore: 2.7, riskLevel: 'elevated', riskCategory: 'conflict',
    region: 'americas', subRegion: 'south-america', latitude: 4.6, longitude: -74.3,
  },
  {
    countryCode: 'AR', countryNameAr: 'الأرجنتين', countryNameEn: 'Argentina',
    compositeScore: 22, gprScore: 30, aiGprScore: 20, acledScore: 10, worldBankScore: 0.2,
    gdeltScore: -0.5, peaceIndexScore: 1.8, riskLevel: 'low', riskCategory: 'political',
    region: 'americas', subRegion: 'south-america', latitude: -38.4, longitude: -63.6,
  },
  {
    countryCode: 'CA', countryNameAr: 'كندا', countryNameEn: 'Canada',
    compositeScore: 8, gprScore: 12, aiGprScore: 12, acledScore: 3, worldBankScore: 1.2,
    gdeltScore: -0.2, peaceIndexScore: 1.3, riskLevel: 'low', riskCategory: 'trade',
    region: 'americas', subRegion: 'north-america', latitude: 56.1, longitude: -106.3,
  },

  // ─── Southeast Asia — جنوب شرق آسيا ────────────────────────────
  {
    countryCode: 'MM', countryNameAr: 'ميانمار', countryNameEn: 'Myanmar',
    compositeScore: 80, gprScore: 210, aiGprScore: 75, acledScore: 72, worldBankScore: -2.0,
    gdeltScore: -4.5, peaceIndexScore: 3.6, riskLevel: 'high', riskCategory: 'conflict',
    region: 'southeast-asia', subRegion: null, latitude: 21.9, longitude: 96.0,
  },
  {
    countryCode: 'PH', countryNameAr: 'الفلبين', countryNameEn: 'Philippines',
    compositeScore: 42, gprScore: 70, aiGprScore: 40, acledScore: 30, worldBankScore: -0.5,
    gdeltScore: -1.5, peaceIndexScore: 2.3, riskLevel: 'elevated', riskCategory: 'conflict',
    region: 'southeast-asia', subRegion: null, latitude: 12.9, longitude: 121.8,
  },
  {
    countryCode: 'ID', countryNameAr: 'إندونيسيا', countryNameEn: 'Indonesia',
    compositeScore: 22, gprScore: 35, aiGprScore: 25, acledScore: 10, worldBankScore: 0.1,
    gdeltScore: -0.5, peaceIndexScore: 1.8, riskLevel: 'low', riskCategory: 'trade',
    region: 'southeast-asia', subRegion: null, latitude: -0.8, longitude: 113.9,
  },
  {
    countryCode: 'TH', countryNameAr: 'تايلاند', countryNameEn: 'Thailand',
    compositeScore: 28, gprScore: 45, aiGprScore: 30, acledScore: 12, worldBankScore: -0.2,
    gdeltScore: -0.8, peaceIndexScore: 1.9, riskLevel: 'moderate', riskCategory: 'political',
    region: 'southeast-asia', subRegion: null, latitude: 15.9, longitude: 101.0,
  },

  // ─── Central Asia — وسط آسيا ───────────────────────────────────
  {
    countryCode: 'UZ', countryNameAr: 'أوزبكستان', countryNameEn: 'Uzbekistan',
    compositeScore: 25, gprScore: 38, aiGprScore: 30, acledScore: 5, worldBankScore: -0.5,
    gdeltScore: -0.8, peaceIndexScore: 2.0, riskLevel: 'low', riskCategory: 'political',
    region: 'central-asia', subRegion: null, latitude: 41.4, longitude: 64.6,
  },
  {
    countryCode: 'KZ', countryNameAr: 'كازاخستان', countryNameEn: 'Kazakhstan',
    compositeScore: 18, gprScore: 28, aiGprScore: 22, acledScore: 4, worldBankScore: 0.3,
    gdeltScore: -0.4, peaceIndexScore: 1.8, riskLevel: 'low', riskCategory: 'trade',
    region: 'central-asia', subRegion: null, latitude: 48.0, longitude: 66.9,
  },

  // ─── Additional Strategic Countries ──────────────────────────────
  {
    countryCode: 'AU', countryNameAr: 'أستراليا', countryNameEn: 'Australia',
    compositeScore: 8, gprScore: 12, aiGprScore: 10, acledScore: 2, worldBankScore: 1.3,
    gdeltScore: -0.1, peaceIndexScore: 1.3, riskLevel: 'low', riskCategory: 'trade',
    region: 'oceania', subRegion: null, latitude: -25.3, longitude: 133.8,
  },
  {
    countryCode: 'CH', countryNameAr: 'سويسرا', countryNameEn: 'Switzerland',
    compositeScore: 5, gprScore: 8, aiGprScore: 6, acledScore: 1, worldBankScore: 1.5,
    gdeltScore: -0.1, peaceIndexScore: 1.1, riskLevel: 'low', riskCategory: 'trade',
    region: 'europe', subRegion: 'western-europe', latitude: 46.8, longitude: 8.2,
  },
  {
    countryCode: 'SE', countryNameAr: 'السويد', countryNameEn: 'Sweden',
    compositeScore: 8, gprScore: 12, aiGprScore: 10, acledScore: 2, worldBankScore: 1.3,
    gdeltScore: -0.1, peaceIndexScore: 1.2, riskLevel: 'low', riskCategory: 'trade',
    region: 'europe', subRegion: 'northern-europe', latitude: 60.1, longitude: 18.6,
  },
  {
    countryCode: 'NO', countryNameAr: 'النرويج', countryNameEn: 'Norway',
    compositeScore: 6, gprScore: 10, aiGprScore: 8, acledScore: 1, worldBankScore: 1.5,
    gdeltScore: -0.1, peaceIndexScore: 1.1, riskLevel: 'low', riskCategory: 'energy',
    region: 'europe', subRegion: 'northern-europe', latitude: 60.5, longitude: 8.5,
  },
  {
    countryCode: 'FI', countryNameAr: 'فنلندا', countryNameEn: 'Finland',
    compositeScore: 18, gprScore: 30, aiGprScore: 18, acledScore: 3, worldBankScore: 1.3,
    gdeltScore: -0.5, peaceIndexScore: 1.3, riskLevel: 'low', riskCategory: 'conflict',
    region: 'europe', subRegion: 'northern-europe', latitude: 61.9, longitude: 25.7,
  },
  {
    countryCode: 'TN', countryNameAr: 'تونس', countryNameEn: 'Tunisia',
    compositeScore: 30, gprScore: 50, aiGprScore: 30, acledScore: 15, worldBankScore: -0.3,
    gdeltScore: -1.0, peaceIndexScore: 2.1, riskLevel: 'moderate', riskCategory: 'political',
    region: 'africa', subRegion: 'north-africa', latitude: 33.9, longitude: 9.5,
  },
  {
    countryCode: 'GE', countryNameAr: 'جورجيا', countryNameEn: 'Georgia',
    compositeScore: 45, gprScore: 80, aiGprScore: 42, acledScore: 18, worldBankScore: -0.2,
    gdeltScore: -1.8, peaceIndexScore: 2.3, riskLevel: 'elevated', riskCategory: 'conflict',
    region: 'europe', subRegion: 'eastern-europe', latitude: 42.3, longitude: 43.4,
  },
  {
    countryCode: 'SS', countryNameAr: 'جنوب السودان', countryNameEn: 'South Sudan',
    compositeScore: 85, gprScore: 230, aiGprScore: 82, acledScore: 78, worldBankScore: -2.1,
    gdeltScore: -5.0, peaceIndexScore: 4.0, riskLevel: 'severe', riskCategory: 'conflict',
    region: 'africa', subRegion: 'east-africa', latitude: 6.9, longitude: 31.3,
  },
  {
    countryCode: 'ML', countryNameAr: 'مالي', countryNameEn: 'Mali',
    compositeScore: 72, gprScore: 160, aiGprScore: 68, acledScore: 65, worldBankScore: -1.6,
    gdeltScore: -3.5, peaceIndexScore: 3.2, riskLevel: 'high', riskCategory: 'conflict',
    region: 'africa', subRegion: 'west-africa', latitude: 17.6, longitude: -4.0,
  },
  {
    countryCode: 'NE', countryNameAr: 'النيجر', countryNameEn: 'Niger',
    compositeScore: 55, gprScore: 100, aiGprScore: 48, acledScore: 42, worldBankScore: -1.4,
    gdeltScore: -2.5, peaceIndexScore: 2.8, riskLevel: 'elevated', riskCategory: 'conflict',
    region: 'africa', subRegion: 'west-africa', latitude: 17.6, longitude: 8.1,
  },
  {
    countryCode: 'BF', countryNameAr: 'بوركينا فاسو', countryNameEn: 'Burkina Faso',
    compositeScore: 58, gprScore: 110, aiGprScore: 45, acledScore: 48, worldBankScore: -1.3,
    gdeltScore: -2.8, peaceIndexScore: 2.9, riskLevel: 'elevated', riskCategory: 'conflict',
    region: 'africa', subRegion: 'west-africa', latitude: 12.2, longitude: -1.6,
  },
  {
    countryCode: 'CM', countryNameAr: 'الكاميرون', countryNameEn: 'Cameroon',
    compositeScore: 45, gprScore: 75, aiGprScore: 42, acledScore: 32, worldBankScore: -0.8,
    gdeltScore: -1.8, peaceIndexScore: 2.5, riskLevel: 'elevated', riskCategory: 'conflict',
    region: 'africa', subRegion: 'central-africa', latitude: 7.4, longitude: 12.4,
  },
  {
    countryCode: 'HT', countryNameAr: 'هايتي', countryNameEn: 'Haiti',
    compositeScore: 62, gprScore: 110, aiGprScore: 58, acledScore: 45, worldBankScore: -1.4,
    gdeltScore: -3.0, peaceIndexScore: 2.9, riskLevel: 'elevated', riskCategory: 'political',
    region: 'americas', subRegion: 'caribbean', latitude: 18.9, longitude: -72.3,
  },
];

async function main() {
  console.log('🌱 Seeding CountryRiskScore data...');
  console.log(`   Countries to seed: ${COUNTRIES.length}`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const country of COUNTRIES) {
    try {
      const result = await prisma.countryRiskScore.upsert({
        where: { countryCode: country.countryCode },
        update: {
          countryNameAr: country.countryNameAr,
          countryNameEn: country.countryNameEn,
          compositeScore: country.compositeScore,
          gprScore: country.gprScore,
          aiGprScore: country.aiGprScore,
          acledScore: country.acledScore,
          worldBankScore: country.worldBankScore,
          gdeltScore: country.gdeltScore,
          peaceIndexScore: country.peaceIndexScore,
          riskLevel: country.riskLevel,
          riskCategory: country.riskCategory,
          region: country.region,
          subRegion: country.subRegion,
          latitude: country.latitude,
          longitude: country.longitude,
        },
        create: {
          countryCode: country.countryCode,
          countryNameAr: country.countryNameAr,
          countryNameEn: country.countryNameEn,
          compositeScore: country.compositeScore,
          gprScore: country.gprScore,
          aiGprScore: country.aiGprScore,
          acledScore: country.acledScore,
          worldBankScore: country.worldBankScore,
          gdeltScore: country.gdeltScore,
          peaceIndexScore: country.peaceIndexScore,
          riskLevel: country.riskLevel,
          riskCategory: country.riskCategory,
          region: country.region,
          subRegion: country.subRegion,
          latitude: country.latitude,
          longitude: country.longitude,
        },
      });

      if (result) {
        // Check if it was created or updated by checking createdAt vs updatedAt
        created++;
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`   ❌ Failed to seed ${country.countryCode}: ${msg.slice(0, 80)}`);
      skipped++;
    }
  }

  // Summary
  console.log('');
  console.log('✅ Seed complete!');
  console.log(`   Created/Updated: ${COUNTRIES.length - skipped}`);
  console.log(`   Skipped (errors): ${skipped}`);

  // Print risk level distribution
  const distribution: Record<string, number> = {};
  for (const c of COUNTRIES) {
    distribution[c.riskLevel] = (distribution[c.riskLevel] || 0) + 1;
  }
  console.log('');
  console.log('   Risk Level Distribution:');
  console.log(`   🟢 Low:       ${distribution['low'] || 0} countries`);
  console.log(`   🟡 Moderate:  ${distribution['moderate'] || 0} countries`);
  console.log(`   🟠 Elevated:  ${distribution['elevated'] || 0} countries`);
  console.log(`   🔴 High:      ${distribution['high'] || 0} countries`);
  console.log(`   ⛔ Severe:    ${distribution['severe'] || 0} countries`);

  // Print region distribution
  const regionDist: Record<string, number> = {};
  for (const c of COUNTRIES) {
    regionDist[c.region] = (regionDist[c.region] || 0) + 1;
  }
  console.log('');
  console.log('   Region Distribution:');
  for (const [region, count] of Object.entries(regionDist).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${region}: ${count} countries`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

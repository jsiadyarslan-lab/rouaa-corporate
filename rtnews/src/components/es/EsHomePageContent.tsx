'use client';

/**
 * EsHomePageContent — Spanish version of HomePageContent
 *
 * Delegates to EnHomePageContent with locale='es' to avoid massive code duplication.
 * The EN component already has full Spanish text support in its TEXT dictionary
 * and handles all ES-specific logic (links, category mappings, etc.) via the locale prop.
 *
 * This wrapper provides:
 * 1. A named ES component for import consistency (matches FrHomePageContent pattern)
 * 2. Default locale='es' so callers don't need to pass it
 * 3. Same API surface as EnHomePageContent
 */

import EnHomePageContent from '@/components/en/EnHomePageContent';

interface EsHomePageContentProps {
  initialNews?: any[];
  initialPrices?: any[];
  initialSparklines?: Record<string, number[]>;
  initialSentiment?: any;
  initialArabMarkets?: any[];
  initialCalendar?: any[];
  initialCentralBanks?: any[];
  initialCouncilBriefs?: any[];
  initialAnalyses?: any[];
  initialReports?: any[];
  initialStrategicReports?: any[];
  initialInfographics?: any[];
}

export default function EsHomePageContent({
  initialNews = [],
  initialPrices = [],
  initialSparklines = {},
  initialSentiment = null,
  initialArabMarkets = [],
  initialCalendar = [],
  initialCentralBanks = [],
  initialCouncilBriefs = [],
  initialAnalyses = [],
  initialReports = [],
  initialStrategicReports = [],
  initialInfographics = [],
}: EsHomePageContentProps = {}) {
  return (
    <EnHomePageContent
      initialNews={initialNews}
      initialPrices={initialPrices}
      initialSparklines={initialSparklines}
      initialSentiment={initialSentiment}
      initialArabMarkets={initialArabMarkets}
      initialCalendar={initialCalendar}
      initialCentralBanks={initialCentralBanks}
      initialCouncilBriefs={initialCouncilBriefs}
      initialAnalyses={initialAnalyses}
      initialReports={initialReports}
      initialStrategicReports={initialStrategicReports}
      initialInfographics={initialInfographics}
      locale="es"
    />
  );
}

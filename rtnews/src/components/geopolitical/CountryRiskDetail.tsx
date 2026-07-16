'use client';

import { X, ExternalLink, AlertTriangle } from 'lucide-react';
import RiskScoreGauge from './RiskScoreGauge';
import GeopoliticalRiskBadge from './GeopoliticalRiskBadge';
import { getCountryName, getRiskColor } from '@/lib/geopolitical/risk-thresholds';
import { cn } from '@/lib/utils';
import { t } from '@/lib/geopolitical/i18n';

interface ScoreComponent {
  key: string;
  labelAr: string;
  labelEn: string;
  score: number;
}

interface RecentEvent {
  date: string;
  titleAr: string;
  titleEn: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
}

interface AffectedMarket {
  symbol: string;
  nameAr: string;
  nameEn: string;
  impact: number;
}

interface CountryRiskDetailProps {
  countryCode: string;
  locale: string;
  onClose: () => void;
  compositeScore?: number;
  components?: ScoreComponent[];
  recentEvents?: RecentEvent[];
  affectedMarkets?: AffectedMarket[];
}

const MOCK_COMPONENTS: ScoreComponent[] = [
  { key: 'gpr', labelAr: 'مؤشر المخاطر الجيوسياسية', labelEn: 'GPR Index', score: 72 },
  { key: 'acled', labelAr: 'بيانات ACLED', labelEn: 'ACLED Data', score: 65 },
  { key: 'worldbank', labelAr: 'مؤشر البنك الدولي', labelEn: 'World Bank Index', score: 58 },
  { key: 'gdelt', labelAr: 'بيانات GDELT', labelEn: 'GDELT Data', score: 70 },
  { key: 'peace', labelAr: 'مؤشر السلام العالمي', labelEn: 'Global Peace Index', score: 45 },
];

const MOCK_EVENTS: RecentEvent[] = [
  { date: '2026-06-12', titleAr: 'اشتباكات حدودية جديدة', titleEn: 'New border clashes reported', severity: 'high' },
  { date: '2026-06-10', titleAr: 'فرض عقوبات إضافية', titleEn: 'Additional sanctions imposed', severity: 'moderate' },
  { date: '2026-06-08', titleAr: 'تصعيد عسكري في المنطقة', titleEn: 'Military escalation in the region', severity: 'critical' },
  { date: '2026-06-05', titleAr: 'مفاوضات دبلوماسية متعثرة', titleEn: 'Stalled diplomatic negotiations', severity: 'moderate' },
  { date: '2026-06-02', titleAr: 'تهديدات بإغلاق الممرات المائية', titleEn: 'Threats to close waterways', severity: 'high' },
];

const MOCK_MARKETS: AffectedMarket[] = [
  { symbol: 'OIL', nameAr: 'النفط الخام', nameEn: 'Crude Oil', impact: 12.5 },
  { symbol: 'GOLD', nameAr: 'الذهب', nameEn: 'Gold', impact: 5.2 },
  { symbol: 'USD', nameAr: 'الدولار', nameEn: 'USD', impact: -3.1 },
  { symbol: 'TASI', nameAr: 'مؤشر تاسي', nameEn: 'TASI Index', impact: -8.7 },
];

const SEVERITY_COLORS: Record<string, string> = {
  low: '#22C55E',
  moderate: '#FFB800',
  high: '#FF9800',
  critical: '#EF5350',
};

export default function CountryRiskDetail({
  countryCode,
  locale,
  onClose,
  compositeScore = 68,
  components = MOCK_COMPONENTS,
  recentEvents = MOCK_EVENTS,
  affectedMarkets = MOCK_MARKETS,
}: CountryRiskDetailProps) {
  const isRtl = locale === 'ar';
  const countryName = getCountryName(countryCode, locale);

  return (
    <div
      className="fixed inset-y-0 z-50 w-full max-w-md shadow-2xl overflow-y-auto"
      style={{
        background: 'var(--bg2)',
        borderInlineStart: '1px solid var(--rim)',
        [isRtl ? 'right' : 'left']: 0,
      }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between p-4 border-b"
        style={{ background: 'var(--bg2)', borderColor: 'var(--rim)' }}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" style={{ color: 'var(--gold)' }} />
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-head)' }}>
            {countryName}
          </h2>
          <GeopoliticalRiskBadge score={compositeScore} locale={locale} />
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg4)]"
          style={{ color: 'var(--text3)' }}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Composite Score Gauge */}
        <div className="flex justify-center py-4">
          <RiskScoreGauge score={compositeScore} locale={locale} size={200} />
        </div>

        {/* Score Breakdown */}
        <section>
          <h3
            className="text-sm font-semibold mb-3"
            style={{ color: 'var(--text2)' }}
          >
            {t('country.riskBreakdown', locale)}
          </h3>
          <div className="space-y-3">
            {components.map((comp) => {
              const color = getRiskColor(comp.score);
              const label = isRtl ? comp.labelAr : comp.labelEn;
              return (
                <div key={comp.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: 'var(--text2)' }}>
                      {label}
                    </span>
                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{ color }}
                    >
                      {comp.score}
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'var(--bg5)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${comp.score}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Events */}
        <section>
          <h3
            className="text-sm font-semibold mb-3"
            style={{ color: 'var(--text2)' }}
          >
            {t('country.recentEvents', locale)}
          </h3>
          <div
            className="space-y-2 max-h-64 overflow-y-auto"
            style={{ scrollbarWidth: 'thin' }}
          >
            {recentEvents.map((event, idx) => {
              const sevColor = SEVERITY_COLORS[event.severity] ?? '#888';
              const title = isRtl ? event.titleAr : event.titleEn;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 rounded-lg"
                  style={{ background: 'var(--bg4)' }}
                >
                  <span
                    className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                    style={{ background: sevColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                      {title}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>
                      {event.date}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Affected Markets */}
        <section>
          <h3
            className="text-sm font-semibold mb-3"
            style={{ color: 'var(--text2)' }}
          >
            {t('country.affectedMarkets', locale)}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {affectedMarkets.map((market) => {
              const isPos = market.impact > 0;
              const name = isRtl ? market.nameAr : market.nameEn;
              return (
                <div
                  key={market.symbol}
                  className="rounded-lg p-3"
                  style={{ background: 'var(--bg4)' }}
                >
                  <p className="text-xs" style={{ color: 'var(--text2)' }}>
                    {name}
                  </p>
                  <p
                    className="text-sm font-bold tabular-nums mt-0.5"
                    style={{ color: isPos ? 'var(--bull)' : 'var(--bear)' }}
                  >
                    {isPos ? '+' : ''}{market.impact.toFixed(1)}%
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Link to full analysis */}
        <a
          href="#"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-semibold transition-colors"
          style={{
            background: 'var(--bg4)',
            color: 'var(--cyan)',
            border: '1px solid var(--rim)',
          }}
        >
          {t('country.fullAnalysis', locale)}
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

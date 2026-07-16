'use client';

import { useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface FinancialStatementsProps {
  incomeStatements: any[];
  balanceSheets: any[];
  cashFlowStatements: any[];
  locale: string;
}

const FS_LABELS: Record<string, Record<string, string>> = {
  incomeStatement: { en: 'Income Statement', ar: 'قائمة الدخل', fr: 'Compte de Résultat', tr: 'Gelir Tablosu' },
  balanceSheet: { en: 'Balance Sheet', ar: 'الميزانية العمومية', fr: 'Bilan', tr: 'Bilanço' },
  cashFlow: { en: 'Cash Flow', ar: 'التدفقات النقدية', fr: 'Flux de Trésorerie', tr: 'Nakit Akışı' },
  revenue: { en: 'Revenue', ar: 'الإيرادات', fr: "Chiffre d'affaires", tr: 'Gelir' },
  grossProfit: { en: 'Gross Profit', ar: 'إجمالي الربح', fr: 'Bénéfice Brut', tr: 'Brüt Kâr' },
  operatingIncome: { en: 'Operating Income', ar: 'الدخل التشغيلي', fr: "Résultat d'Exploitation", tr: 'Faaliyet Kârı' },
  netIncome: { en: 'Net Income', ar: 'صافي الدخل', fr: 'Bénéfice Net', tr: 'Net Kâr' },
  eps: { en: 'EPS', ar: 'ربحية السهم', fr: 'BPA', tr: 'HBE' },
  totalAssets: { en: 'Total Assets', ar: 'إجمالي الأصول', fr: 'Total Actifs', tr: 'Toplam Varlıklar' },
  totalLiabilities: { en: 'Total Liabilities', ar: 'إجمالي الالتزامات', fr: 'Total Passifs', tr: 'Toplam Yükümlülükler' },
  totalEquity: { en: 'Total Equity', ar: 'إجمالي حقوق المساهمين', fr: 'Capitaux Propres', tr: 'Özkaynaklar' },
  cash: { en: 'Cash & Equivalents', ar: 'النقد وما في حكمه', fr: 'Trésorerie', tr: 'Nakit ve Benzerleri' },
  totalDebt: { en: 'Total Debt', ar: 'إجمالي الديون', fr: 'Dette Totale', tr: 'Toplam Borç' },
  currentRatio: { en: 'Current Ratio', ar: 'نسبة التداول', fr: 'Ratio de Liquidité', tr: 'Cari Oran' },
  operatingCF: { en: 'Operating Cash Flow', ar: 'التدفق النقدي التشغيلي', fr: "Flux d'Exploitation", tr: 'Faaliyet Nakit Akışı' },
  capEx: { en: 'Capital Expenditure', ar: 'الإنفاق الرأسمالي', fr: "Dépenses d'Investissement", tr: 'Sermaye Harcaması' },
  freeCashFlow: { en: 'Free Cash Flow', ar: 'التدفق النقدي الحر', fr: 'Flux de Trésorerie Libre', tr: 'Serbest Nakit Akışı' },
  dividendsPaid: { en: 'Dividends Paid', ar: 'التوزيعات المدفوعة', fr: 'Dividendes Versés', tr: 'Ödenen Temettüler' },
  stockRepurchased: { en: 'Stock Repurchased', ar: 'الأسهم المعاد شراؤها', fr: 'Actions Rachetées', tr: 'Geri Alınan Hisseler' },
  fiscalYear: { en: 'Fiscal Year', ar: 'السنة المالية', fr: 'Exercice', tr: 'Mali Yıl' },
  noData: { en: 'No financial data available', ar: 'لا توجد بيانات مالية متاحة', fr: 'Aucune donnée financière disponible', tr: 'Finansal veri mevcut değil' },
};

function fsT(key: string, locale: string): string {
  return FS_LABELS[key]?.[locale] || FS_LABELS[key]?.en || key;
}

function formatFinancialValue(n: number | null | undefined): string {
  if (n == null) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

function formatEps(n: number | null | undefined): string {
  if (n == null) return '—';
  return `$${n.toFixed(2)}`;
}

function formatRatio(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toFixed(2);
}

function computeYoY(current: number | null | undefined, previous: number | null | undefined): number | null {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function YoYIndicator({ change }: { change: number | null }) {
  if (change == null) return <span className="text-gray-600 text-[10px] ml-2">—</span>;
  const isPositive = change > 0;
  const isNeutral = Math.abs(change) < 0.5;
  if (isNeutral) {
    return (
      <span className="inline-flex items-center text-gray-400 text-[10px] ml-2">
        <Minus className="w-2.5 h-2.5 mr-0.5" />
        {change.toFixed(1)}%
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center text-[10px] ml-2 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
      {isPositive ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
      {isPositive ? '+' : ''}{change.toFixed(1)}%
    </span>
  );
}

interface RowDef {
  key: string;
  labelKey: string;
  accessor: (item: any) => number | null;
  formatter?: (n: number | null) => string;
}

const INCOME_ROWS: RowDef[] = [
  { key: 'revenue', labelKey: 'revenue', accessor: (d) => d.revenue },
  { key: 'grossProfit', labelKey: 'grossProfit', accessor: (d) => d.grossProfit },
  { key: 'operatingIncome', labelKey: 'operatingIncome', accessor: (d) => d.operatingIncome },
  { key: 'netIncome', labelKey: 'netIncome', accessor: (d) => d.netIncome },
  { key: 'eps', labelKey: 'eps', accessor: (d) => d.eps, formatter: formatEps },
];

const BALANCE_ROWS: RowDef[] = [
  { key: 'totalAssets', labelKey: 'totalAssets', accessor: (d) => d.totalAssets },
  { key: 'totalLiabilities', labelKey: 'totalLiabilities', accessor: (d) => d.totalLiabilities },
  { key: 'totalEquity', labelKey: 'totalEquity', accessor: (d) => d.totalStockholdersEquity ?? d.totalEquity },
  { key: 'cash', labelKey: 'cash', accessor: (d) => d.cashAndCashEquivalents ?? d.cash ?? d.cashAndShortTermInvestments },
  { key: 'totalDebt', labelKey: 'totalDebt', accessor: (d) => d.totalDebt ?? ((d.shortTermDebt ?? 0) + (d.longTermDebt ?? 0) || null) },
  { key: 'currentRatio', labelKey: 'currentRatio', accessor: (d) => {
    const ca = d.totalCurrentAssets;
    const cl = d.totalCurrentLiabilities;
    if (ca && cl && cl > 0) return ca / cl;
    return null;
  }, formatter: formatRatio },
];

const CASH_FLOW_ROWS: RowDef[] = [
  { key: 'operatingCF', labelKey: 'operatingCF', accessor: (d) => d.operatingCashFlow ?? d.netCashProvidedByOperatingActivities },
  { key: 'capEx', labelKey: 'capEx', accessor: (d) => d.capitalExpenditure },
  { key: 'freeCashFlow', labelKey: 'freeCashFlow', accessor: (d) => d.freeCashFlow ?? (((d.operatingCashFlow ?? d.netCashProvidedByOperatingActivities ?? 0) - (d.capitalExpenditure ?? 0)) || null) },
  { key: 'dividendsPaid', labelKey: 'dividendsPaid', accessor: (d) => d.dividendsPaid ? Math.abs(d.dividendsPaid) : null },
  { key: 'stockRepurchased', labelKey: 'stockRepurchased', accessor: (d) => d.commonStockRepurchased ? Math.abs(d.commonStockRepurchased) : null },
];

function StatementTable({
  data,
  rows,
  locale,
}: {
  data: any[];
  rows: RowDef[];
  locale: string;
}) {
  // Take up to 5 years, sorted most recent first
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return [...data]
      .sort((a, b) => {
        const dateA = a.date || a.fiscalDateEnding || '';
        const dateB = b.date || b.fiscalDateEnding || '';
        return dateB.localeCompare(dateA);
      })
      .slice(0, 5);
  }, [data]);

  if (sortedData.length === 0) {
    return (
      <div className="text-center text-gray-500 py-10">
        {fsT('noData', locale)}
      </div>
    );
  }

  const getYear = (item: any) => {
    const d = item.date || item.fiscalDateEnding || '';
    return d.substring(0, 4) || d;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="text-gray-400 font-medium text-xs min-w-[140px]">
              {fsT('fiscalYear', locale)}
            </TableHead>
            {sortedData.map((item, i) => (
              <TableHead
                key={i}
                className="text-gray-300 font-semibold text-xs text-right min-w-[100px]"
              >
                {getYear(item)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key} className="border-white/5 hover:bg-white/[0.03]">
              <TableCell className="text-gray-400 text-xs font-medium py-2.5">
                {fsT(row.labelKey, locale)}
              </TableCell>
              {sortedData.map((item, i) => {
                const value = row.accessor(item);
                const prevValue = i < sortedData.length - 1 ? row.accessor(sortedData[i + 1]) : null;
                const yoy = computeYoY(value, prevValue);
                const formatter = row.formatter || formatFinancialValue;
                return (
                  <TableCell key={i} className="text-right py-2.5">
                    <span className="text-white text-xs font-medium">
                      {formatter(value)}
                    </span>
                    {i < sortedData.length - 1 && <YoYIndicator change={yoy} />}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function FinancialStatements({
  incomeStatements,
  balanceSheets,
  cashFlowStatements,
  locale,
}: FinancialStatementsProps) {
  const hasIncome = incomeStatements && incomeStatements.length > 0;
  const hasBalance = balanceSheets && balanceSheets.length > 0;
  const hasCashFlow = cashFlowStatements && cashFlowStatements.length > 0;

  if (!hasIncome && !hasBalance && !hasCashFlow) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-gray-500">
        {fsT('noData', locale)}
      </div>
    );
  }

  const defaultTab = hasIncome ? 'income' : hasBalance ? 'balance' : 'cashflow';

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <Tabs defaultValue={defaultTab} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <div className="px-5 py-4 border-b border-white/10">
          <TabsList className="bg-white/5 border border-white/10 h-9">
            {hasIncome && (
              <TabsTrigger
                value="income"
                className="text-xs data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
              >
                {fsT('incomeStatement', locale)}
              </TabsTrigger>
            )}
            {hasBalance && (
              <TabsTrigger
                value="balance"
                className="text-xs data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
              >
                {fsT('balanceSheet', locale)}
              </TabsTrigger>
            )}
            {hasCashFlow && (
              <TabsTrigger
                value="cashflow"
                className="text-xs data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
              >
                {fsT('cashFlow', locale)}
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {hasIncome && (
          <TabsContent value="income" className="p-5 mt-0">
            <StatementTable data={incomeStatements} rows={INCOME_ROWS} locale={locale} />
          </TabsContent>
        )}
        {hasBalance && (
          <TabsContent value="balance" className="p-5 mt-0">
            <StatementTable data={balanceSheets} rows={BALANCE_ROWS} locale={locale} />
          </TabsContent>
        )}
        {hasCashFlow && (
          <TabsContent value="cashflow" className="p-5 mt-0">
            <StatementTable data={cashFlowStatements} rows={CASH_FLOW_ROWS} locale={locale} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

import { db } from '@/lib/db';
import SearchReportsClient from './SearchReportsClient';

export const revalidate = 300;
export const metadata = {
  title: 'بحث التقارير',
  description: 'ابحث في التقارير الاقتصادية والتحليلات المالية',
};

export default async function SearchReportsPage() {
  // Get facets for initial filter options
  const [reportTypes, scopes, assetClasses] = await Promise.all([
    db.economicReport.findMany({
      where: { isPublished: true, locale: 'ar' },
      select: { reportType: true },
      distinct: ['reportType'],
    }),
    db.economicReport.findMany({
      where: { isPublished: true, locale: 'ar' },
      select: { scope: true },
      distinct: ['scope'],
    }),
    db.marketAnalysis.findMany({
      where: { isPublished: true, locale: 'ar' },
      select: { assetClass: true },
      distinct: ['assetClass'],
    }),
  ]);

  return (
    <SearchReportsClient
      initialFacets={{
        reportTypes: reportTypes.map(r => r.reportType),
        scopes: scopes.map(s => s.scope),
        assetClasses: assetClasses.map(a => a.assetClass),
      }}
    />
  );
}

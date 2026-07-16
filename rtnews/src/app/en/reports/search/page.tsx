import { db } from '@/lib/db';
import EnSearchReportsClient from './EnSearchReportsClient';

export const revalidate = 300;
export const metadata = {
  title: 'Search Reports',
  description: 'Search economic reports and financial analyses',
};

export default async function EnSearchReportsPage() {
  const [reportTypes, scopes, assetClasses] = await Promise.all([
    db.economicReport.findMany({
      where: { isPublished: true, locale: 'en' },
      select: { reportType: true },
      distinct: ['reportType'],
    }),
    db.economicReport.findMany({
      where: { isPublished: true, locale: 'en' },
      select: { scope: true },
      distinct: ['scope'],
    }),
    db.marketAnalysis.findMany({
      where: { isPublished: true, locale: 'en' },
      select: { assetClass: true },
      distinct: ['assetClass'],
    }),
  ]);

  return (
    <EnSearchReportsClient
      initialFacets={{
        reportTypes: reportTypes.map(r => r.reportType),
        scopes: scopes.map(s => s.scope),
        assetClasses: assetClasses.map(a => a.assetClass),
      }}
    />
  );
}

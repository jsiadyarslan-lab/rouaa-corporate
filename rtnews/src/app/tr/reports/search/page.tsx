import { db } from '@/lib/db';
import TrSearchReportsClient from './TrSearchReportsClient';

export const revalidate = 300;
export const metadata = {
  title: 'Raporlarda ara',
  description: 'Ekonomik raporlarda ve finansal analizlerde arama yapın',
};

export default async function TrSearchReportsPage() {
  const [reportTypes, scopes, assetClasses] = await Promise.all([
    db.economicReport.findMany({
      where: { isPublished: true, locale: 'tr' },
      select: { reportType: true },
      distinct: ['reportType'],
    }),
    db.economicReport.findMany({
      where: { isPublished: true, locale: 'tr' },
      select: { scope: true },
      distinct: ['scope'],
    }),
    db.marketAnalysis.findMany({
      where: { isPublished: true, locale: 'tr' },
      select: { assetClass: true },
      distinct: ['assetClass'],
    }),
  ]);

  return (
    <TrSearchReportsClient
      initialFacets={{
        reportTypes: reportTypes.map(r => r.reportType),
        scopes: scopes.map(s => s.scope),
        assetClasses: assetClasses.map(a => a.assetClass),
      }}
    />
  );
}

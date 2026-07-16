import { db } from '@/lib/db';
import FrSearchReportsClient from './FrSearchReportsClient';

export const revalidate = 300;
export const metadata = {
  title: 'Rechercher des rapports',
  description: 'Rechercher des rapports économiques et des analyses financières',
};

export default async function FrSearchReportsPage() {
  const [reportTypes, scopes, assetClasses] = await Promise.all([
    db.economicReport.findMany({
      where: { isPublished: true, locale: 'fr' },
      select: { reportType: true },
      distinct: ['reportType'],
    }),
    db.economicReport.findMany({
      where: { isPublished: true, locale: 'fr' },
      select: { scope: true },
      distinct: ['scope'],
    }),
    db.marketAnalysis.findMany({
      where: { isPublished: true, locale: 'fr' },
      select: { assetClass: true },
      distinct: ['assetClass'],
    }),
  ]);

  return (
    <FrSearchReportsClient
      initialFacets={{
        reportTypes: reportTypes.map(r => r.reportType),
        scopes: scopes.map(s => s.scope),
        assetClasses: assetClasses.map(a => a.assetClass),
      }}
    />
  );
}

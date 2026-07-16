import { db } from '@/lib/db';
import EnSearchReportsClient from '@/app/en/reports/search/EnSearchReportsClient';

export const revalidate = 300;
export const metadata = {
  title: 'Buscar Informes',
  description: 'Buscar informes económicos y análisis financieros',
};

export default async function EsSearchReportsPage() {
  const [reportTypes, scopes, assetClasses] = await Promise.all([
    db.economicReport.findMany({ where: { isPublished: true, locale: 'es' }, select: { reportType: true }, distinct: ['reportType'] }),
    db.economicReport.findMany({ where: { isPublished: true, locale: 'es' }, select: { scope: true }, distinct: ['scope'] }),
    db.marketAnalysis.findMany({ where: { isPublished: true, locale: 'es' }, select: { assetClass: true }, distinct: ['assetClass'] }),
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

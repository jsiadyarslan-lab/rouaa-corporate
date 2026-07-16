import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Archivo', description: 'Explore el archivo completo de noticias financieras de Rouaa con filtrado y paginación' };
export default function EsArchivePage() {
  return (<main className="min-h-screen flex items-center justify-center" dir="ltr" style={{ background: 'var(--bg)' }}><div className="text-center px-4"><h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--text)' }}>Archivo</h1><p className="text-sm" style={{ color: 'var(--text3)' }}>Archivo histórico de noticias financieras y económicas</p></div></main>);
}

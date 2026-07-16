import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Archives', description: 'Archives des actualités financières' };
export default function FrArchivePage() {
  return (<main className="min-h-screen flex items-center justify-center" dir="ltr" style={{ background: 'var(--bg)' }}><div className="text-center px-4"><h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--text)' }}>Archives</h1><p className="text-sm" style={{ color: 'var(--text3)' }}>Archives historiques des actualités financières et économiques</p></div></main>);
}

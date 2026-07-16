import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'بوت تيليجرام',
  description: 'اشترك في بوت تيليجرام لتلقي الأخبار المالية العاجلة والتحليلات وتنبيهات الأسواق مباشرة',
  openGraph: { title: 'بوت تيليجرام', description: 'اشترك في بوت تيليجرام لتلقي الأخبار المالية العاجلة والتحليلات وتنبيهات الأسواق مباشرة' },
};

export default function TelegramLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

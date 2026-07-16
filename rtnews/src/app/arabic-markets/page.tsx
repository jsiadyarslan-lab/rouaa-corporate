import { redirect } from 'next/navigation';

export const metadata = {
  title: 'الأسواق العربية',
  description: 'متابعة شاملة لأسواق الخليج العربي والأسواق المالية الإسلامية',
};

export default function ArabicMarketsPage() {
  redirect('/markets?tab=arab');
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'التنبيهات الذكية',
  description: 'إنشاء وإدارة التنبيهات الذكية للأسواق المالية - أسعار، مشاعر، أخبار عاجلة',
};

export default function AlertsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

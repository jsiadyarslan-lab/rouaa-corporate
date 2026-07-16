import { Metadata } from 'next'
import InfographicDetailClient from './InfographicDetailClient'

export const metadata: Metadata = {
  title: 'إنفوغرافيك',
  description: 'إنفوغرافيك تحليلي مالي مدعوم بالذكاء الاصطناعي',
}

export default function InfographicDetailPage() {
  return <InfographicDetailClient />
}

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'رؤى — منصة الأخبار المالية العربية',
    short_name: 'رؤى',
    description: 'منصة الأخبار المالية العربية الأولى المدعومة بالذكاء الاصطناعي — أخبار حية، تحليلات AI، بيانات الأسواق',
    start_url: '/',
    display: 'standalone',
    background_color: '#050810',
    theme_color: '#00E5FF',
    orientation: 'any',
    dir: 'rtl',
    lang: 'ar',
    categories: ['finance', 'news', 'business'],
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}

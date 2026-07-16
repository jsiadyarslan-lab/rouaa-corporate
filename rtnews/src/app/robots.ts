import type { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rouatradingnews-production.up.railway.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Removed /article/ from disallow — articles MUST be indexed for SEO
        disallow: ['/api/', '/dashboard/'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}

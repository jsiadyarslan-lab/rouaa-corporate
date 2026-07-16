// ─── Shared SEO Metadata Utility ──────────────────────────────
// Centralized metadata definitions for all pages
// Used by server component page.tsx wrappers for SEO

import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rouatradingnews-production.up.railway.app';
const SITE_NAME = 'رؤى';

interface PageMeta {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
}

const PAGE_METADATA: Record<string, PageMeta> = {
  news: {
    title: 'مركز الأخبار',
    description: 'آخر الأخبار المالية والاقتصادية في الوقت الفعلي مع تحليلات AI ذكية — أخبار الأسواق، العملات، الذهب، النفط والمزيد',
    keywords: ['أخبار مالية', 'أخبار حية', 'تحليلات AI', 'أسواق', 'عملات', 'ذهب', 'نفط'],
  },
  markets: {
    title: 'الأسواق',
    description: 'أسعار العملات والذهب والنفط والأسهم والكريبتو في الوقت الفعلي — بيانات مباشرة من الأسواق العالمية والعربية',
    keywords: ['أسعار العملات', 'الذهب', 'النفط', 'فوركس', 'كريبتو', 'بيتكوين', 'أسواق عربية'],
  },
  analysis: {
    title: 'التحليلات',
    description: 'تحليلات AI ذكية للأسواق المالية — تحليل المشاعر، الأصول المتأثرة، التوصيات الاستثمارية الفورية',
    keywords: ['تحليلات', 'ذكاء اصطناعي', 'تحليل أسواق', 'مشاعر السوق', 'توصيات'],
  },
  academy: {
    title: 'الأكاديمية',
    description: 'تعلم التداول والتحليل المالي — مسارات تعليمية شاملة من المبتدئ إلى المحترف مع نصائح ذهبية',
    keywords: ['تعلم التداول', 'تحليل فني', 'تحليل أساسي', 'إدارة مخاطر', 'تعليم مالي'],
  },
  library: {
    title: 'المكتبة',
    description: 'كتب ومراجع مالية — مكتبة شاملة للمصادر والكتب المترجمة في التداول والتحليل المالي',
    keywords: ['كتب مالية', 'مراجع تداول', 'كتب استثمار', 'مكتبة مالية'],
  },
  calendar: {
    title: 'التقويم الاقتصادي',
    description: 'أحداث اقتصادية عالمية — تقويم اقتصادي مباشر مع مؤشرات التأثير والأصول المتأثرة',
    keywords: ['تقويم اقتصادي', 'NFP', 'CPI', 'FOMC', 'أسعار الفائدة', 'أحداث اقتصادية'],
  },
  community: {
    title: 'المجتمع',
    description: 'مناقشات وتصويتات — شارك رأيك في اتجاهات الأسواق وتفاعل مع مجتمع المتداولين العرب',
    keywords: ['مجتمع المتداولين', 'تصويت', 'مناقشات مالية', 'آراء السوق'],
  },
  pricing: {
    title: 'الأسعار',
    description: 'خطط الاشتراك — باقات مرنة تناسب احتياجاتك من الأخبار والتحليلات المالية الذكية',
    keywords: ['أسعار الاشتراك', 'باقات', 'خطة مجانية', 'خطة احترافية'],
  },
  flash: {
    title: 'الأخبار العاجلة',
    description: 'آخر الأخبار العاجلة — تحديثات لحظية للأحداث المالية عالية التأثير في الوقت الفعلي',
    keywords: ['أخبار عاجلة', 'breaking news', 'أحداث مالية', 'تأثير عالي'],
  },
  search: {
    title: 'البحث',
    description: 'ابحث في الأخبار والتحليلات — بحث دلالي ذكي يجد لك المعلومات المالية بسرعة ودقة',
    keywords: ['بحث', 'بحث مالي', 'بحث دلالي', 'أخبار'],
  },
  bookmarks: {
    title: 'المحفوظات',
    description: 'أخبارك المفضلة — احفظ المقالات التي تهمك وارجع إليها لاحقاً بسهولة',
    keywords: ['محفوظات', 'مفضلة', 'حفظ مقالات', 'قائمة القراءة'],
  },
  about: {
    title: 'عن رؤى',
    description: 'منصة الأخبار المالية العربية الأولى المدعومة بالذكاء الاصطناعي — تعرف على رؤيتنا وتقنياتنا وفريقنا',
    keywords: ['عن رؤى', 'منصة مالية', 'ذكاء اصطناعي', 'رؤيتنا'],
  },
  contact: {
    title: 'اتصل بنا',
    description: 'تواصل مع فريق رؤى — نسعد بتلقي استفساراتك واقتراحاتك لتحسين المنصة',
    keywords: ['اتصل بنا', 'دعم فني', 'تواصل', 'اقتراحات'],
  },
  blog: {
    title: 'المدونة',
    description: 'مقالات وآراء مالية — محتوى حصري من خبراء الأسواق المالية قريباً',
    keywords: ['مدونة', 'مقالات مالية', 'آراء خبراء', 'تحليلات أسبوعية'],
  },
  careers: {
    title: 'الوظائف',
    description: 'انضم لفريق رؤى — وظائف متاحة في الذكاء الاصطناعي والتحليل المالي والتطوير والتصميم',
    keywords: ['وظائف', 'توظيف', 'فرص عمل', 'ذكاء اصطناعي', 'تطوير'],
  },
  'central-banks': {
    title: 'البنوك المركزية',
    description: 'أسعار الفائدة وقرارات البنوك المركزية — متابعة لحظية لسياسات البنوك المركزية العربية والعالمية',
    keywords: ['بنوك مركزية', 'أسعار الفائدة', 'الفيدرالي', 'البنك المركزي الأوروبي', 'ساما'],
  },
  earnings: {
    title: 'أرباح الشركات',
    description: 'تقارير الأرباح الفصلية — نتائج الشركات المدرجة وتوقعات المحللين وتأثيرها على الأسواق',
    keywords: ['أرباح الشركات', 'تقارير فصلية', 'نتائج أعمال', 'Earnings'],
  },
  archive: {
    title: 'الأرشيف',
    description: 'أرشيف الأخبار المالية — تصفح جميع الأخبار والتحليلات السابقة مع تصفية وبحث متقدم',
    keywords: ['أرشيف', 'أخبار سابقة', 'سجل أخبار', 'تصفح'],
  },
  disclaimer: {
    title: 'إخلاء المسؤولية',
    description: 'إخلاء مسؤولية منصة رؤى — المعلومات المقدمة لأغراض تعليمية ومعلوماتية فقط ولا تعتبر نصيحة استثمارية',
    keywords: ['إخلاء مسؤولية', 'تحذير مخاطر', 'نصيحة استثمارية'],
  },
  privacy: {
    title: 'سياسة الخصوصية',
    description: 'سياسة خصوصية منصة رؤى — كيفية جمع واستخدام وحماية بياناتك الشخصية',
    keywords: ['سياسة الخصوصية', 'حماية البيانات', 'خصوصية', 'كوكيز'],
  },
  terms: {
    title: 'شروط الاستخدام',
    description: 'شروط وأحكام استخدام منصة رؤى — القواعد والضوابط التي تحكم استخدامك للمنصة',
    keywords: ['شروط الاستخدام', 'أحكام', 'قوانين المنصة'],
  },
  aml: {
    title: 'مكافحة غسل الأموال',
    description: 'سياسة مكافحة غسل الأموال — التزام منصة رؤى بالقوانين والأنظمة المتعلقة بمكافحة غسل الأموال وتمويل الإرهاب',
    keywords: ['مكافحة غسل الأموال', 'AML', 'KYC', 'امتثال', 'تنظيم'],
  },
};

export function getPageMetadata(route: string): Metadata {
  const meta = PAGE_METADATA[route];
  if (!meta) {
    return {
      title: SITE_NAME,
    };
  }

  const url = `${SITE_URL}/${route}`;

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    openGraph: {
      title: `${meta.title} | ${SITE_NAME}`,
      description: meta.description,
      url,
      siteName: SITE_NAME,
      locale: 'ar_SA',
      type: 'website',
      images: meta.ogImage ? [{ url: meta.ogImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${meta.title} | ${SITE_NAME}`,
      description: meta.description,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default PAGE_METADATA;

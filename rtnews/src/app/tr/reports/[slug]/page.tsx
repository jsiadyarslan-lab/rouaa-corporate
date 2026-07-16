// ─── Turkish Report Detail Page ──────────────────────────────────
// Server Component — fetches a single Turkish report by slug
// Reuses EnReportDetailClient with Turkish-translated data

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { stripMarkdownHeadings, stripSummaryMarkdown, truncateAtBoundary } from '@/lib/clean-markdown';
import ReportDetailClient from '@/app/en/reports/[slug]/EnReportDetailClient';

export const revalidate = 300;
const safeParse = (str: string, fallback: any = []) => { try { return JSON.parse(str); } catch { return fallback; } };

// ─── Turkish Fallback Content Generator ────────────────────────────
const ASSET_CLASS_INFO_TR: Record<string, { nameTr: string; description: string; sectors: string[]; keyDrivers: string[]; risks: string[] }> = {
  strategic: {
    nameTr: 'Stratejik Raporlar',
    description: 'Günlük otomatik raporlardan farklı olarak belirli konularda derinlemesine analitik raporlar. Gerçek verilerle derinlemesine yapay zeka analizine dayanır.',
    sectors: ['Ekonomik Analiz', 'Finansal Piyasalar', 'Gelecek Senaryoları', 'Stratejik Öneriler'],
    keyDrivers: ['Büyük ekonomik ve jeopolitik olaylar', 'Merkez bankası politikaları ve bölgesel etkileri', 'Küresel finansal piyasa gelişmeleri', 'Kurumsal yatırım eğilimleri'],
    risks: ['Parasal politikalarda ani değişiklikler', 'Beklenmeyen jeopolitik gelişmeler', 'Enerji ve döviz piyasalarında yüksek volatilite', 'Beklenenden daha geniş çaplı ekonomik yavaşlama'],
  },
  forex: {
    nameTr: 'Forex',
    description: 'Döviz piyasası günlük hacmi 7 trilyon doları aşan dünyanın en büyük finansal piyasasıdır. Merkez bankası politikaları, makroekonomik veriler ve jeopolitik olaylardan etkilenir.',
    sectors: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF'],
    keyDrivers: ['Fed ve ECB faiz kararları', 'Enflasyon ve ekonomik büyüme verileri', 'Jeopolitik gerilimler ve enerji fiyatları', 'ABD doları endeksi ve sermaye hareketleri'],
    risks: ['Merkez bankalarının beklenmeyen kararları sonrası yüksek volatilite', 'Döviz kurlarına hükümet müdahalesi', 'Gelişmekte olan piyasaların para birimlerini etkileyen bölgesel siyasi krizler', 'Küresel ekonomik yavaşlama sonucu sermaye kaçağı'],
  },
  stocks: {
    nameTr: 'Hisseler',
    description: 'Küresel borsa, büyük şirketlerin sonuç sezonu ve parasal politika beklentileri üzerine odaklanarak ana borsalar arasında karşılıklı etki görür.',
    sectors: ['ABD Hisseleri', 'Avrupa Hisseleri', 'Asya Hisseleri', 'Körfez Hisseleri'],
    keyDrivers: ['Sonuç sezonu ve analist beklentileri', 'Faiz kararları ve değerlemelere etkisi', 'Teknolojik gelişmeler ve yapay zeka', 'Uluslararası yatırım akışları'],
    risks: ['Yükseliş dönemlerinden sonra fiyat düzeltmeleri', 'Ekonomik büyüme yavaşlamasının sonuçlara etkisi', 'Kilit sektörlerde düzenleyici sıkılaştırma', 'Ticaret savaşları ve gümrük tarifeleri'],
  },
  crypto: {
    nameTr: 'Kripto Paralar',
    description: 'Kripto para piyasası yüksek volatilite ve düzenleyici gelişmelere, teknolojik ilerlemelere ve kurumsal sermaye hareketlerine duyarlılık ile karakterize edilir.',
    sectors: ['Bitcoin', 'Ethereum', 'Altcoinler', 'Merkeziyetsiz Finans'],
    keyDrivers: ['Kurumsal sermaye girişi ve ETF fonları', 'Küresel düzenleyici gelişmeler', 'Ağ ve protokol güncellemeleri', 'Faiz oranları ve küresel likidite ortamı'],
    risks: ['Güçlü ve ani fiyat volatilitesi', 'Kilit piyasalarda sıkı düzenleyici müdahale', 'Güvenlik riskleri ve platform hırsızlıkları', 'Güven kaybı ve büyük proje çöküşleri'],
  },
  economy: {
    nameTr: 'Makroekonomi',
    description: 'Küresel ekonomi enflasyon, merkez bankası politikaları ve süregelen jeopolitik gerilimler bağlamında büyüme yavaşlama potansiyeli dahil çoklu zorluklarla karşı karşıya.',
    sectors: ['Ekonomik Büyüme', 'Enflasyon', 'Faiz Oranları', 'Uluslararası Ticaret'],
    keyDrivers: ['Merkez bankası politikaları ve faiz kararları', 'Enflasyon ve GSYİH verileri', 'Uluslararası ticaret ve tedarik zincirleri', 'Hükümet maliye politikaları'],
    risks: ['Küresel ekonomik durgunluk', 'Beklentileri aşan kalıcı enflasyon', 'Egemen borç krizleri', 'Ticaret savaşları ve gümrük tarifeleri'],
  },
  energy: {
    nameTr: 'Enerji',
    description: 'Küresel enerji piyasası arz-talep dengesi, OPEC kararları ve kilit üretici bölgelerdeki jeopolitik gerilimlerden etkilenir.',
    sectors: ['Ham Petrol', 'Doğal Gaz', 'Yenilenebilir Enerji', 'Petrokimya'],
    keyDrivers: ['OPEC üretim seviyesi kararları', 'Çin talebi ve Asya ekonomik büyümesi', 'Orta Doğu gerilimleri ve Hürmüz Boğazı', 'Temiz enerjiye geçiş'],
    risks: ['Büyük üreticiler arası fiyat savaşları', 'Savaş ve krizlerin arza etkisi', 'Durgunluk nedeniyle küresel talep yavaşlaması', 'Üretici ülkelere ticari yaptırımlar'],
  },
  commodities: {
    nameTr: 'Hammaddeler',
    description: 'Hammadde piyasaları dolar gücü, endüstriyel talep, hava koşulları ve jeopolitik gerilimler dahil birçok faktörden etkilenir.',
    sectors: ['Altın', 'Gümüş', 'Bakır', 'Tarım Ürünleri'],
    keyDrivers: ['ABD doları hareketleri ve faiz oranları', 'Çin ve büyük ekonomilerin endüstriyel talebi', 'Hasadı etkileyen hava koşulları', 'Güvenli liman olarak jeopolitik tehditler'],
    risks: ['Doğal veya siyasi olaylar sonucu arz kıtlıkları', 'Küresel endüstriyel talep yavaşlaması', 'Döviz kuru volatilitesi', 'Vadeli piyasalarda spekülasyon'],
  },
  bonds: {
    nameTr: 'Tahviller',
    description: 'Küresel tahvil piyasası faiz beklentilerinin ve enflasyonun kilit bir ölçüsü ve yatırımcıların risk iştahının bir göstergesidir.',
    sectors: ['Sovereign Tahviller', 'Kurumsal Tahviller', 'Yüksek Getirili Tahviller', 'İslami Tahviller'],
    keyDrivers: ['Merkez bankası faiz kararları', 'Enflasyon ve ekonomik büyüme beklentileri', 'Egemen ve kurumsal kredi derecelendirmeleri', 'Yeni borç arz ve talebi'],
    risks: ['Parasal sıkılaşma sonucu getiri artışı', 'Yüksek getirili tahviller için temerrüt riski', 'Zor dönemlerde likidite riskleri', 'Yabancı para cinsinden tahviller için döviz kuru volatilitesi'],
  },
  technicalAnalysis: {
    nameTr: 'Teknik Analiz',
    description: 'Döviz çiftleri, kripto paralar, hammaddeler ve hisselerin teknik göstergeler, fiyat oluşumları ve destek/direnç seviyeleri ile belirli senaryolar ve eyleme geçirilebilir önerilerle derinlemesine teknik analizi.',
    sectors: ['Forex', 'Kripto Paralar', 'Altın ve Petrol', 'Küresel Hisseler'],
    keyDrivers: ['Kilit destek ve direnç seviyeleri', 'Teknik göstergeler (RSI, MACD, Hareketli Ortalamalar)', 'Fiyat oluşumları ve mum çubukları', 'İşlem hacmi ve likidite göstergeleri'],
    risks: ['Farklı zaman dilimlerinde çelişen teknik sinyaller', 'Kilit seviyelerde sahte kırılımlar', 'Jeopolitik veya ekonomik olaylar sonrası ani değişimler', 'Bazı dönemlerde düşük likidite'],
  },
  earnings: {
    nameTr: 'Şirket Sonuçları',
    description: 'Sonuç sezonu, büyük şirketlerin üç aylık finansal sonuçlarını açıklaması ve doğrudan fiyatları ve piyasa eğilimlerini etkilemesiyle piyasanın en önemli itici güçlerinden biridir.',
    sectors: ['ABD Sonuçları', 'Avrupa Sonuçları', 'Körfez Sonuçları', 'Analist Beklentileri'],
    keyDrivers: ['Gerçek sonuçlar vs analist beklentileri', 'Şirketlerin gelecek rehberlik beklentileri', 'Kâr marjları ve operasyonel gelirler', 'Büyüme oranları ve değerlemelere etkileri'],
    risks: ['Büyük şirketlerin hayal kırıklığı yaratan sonuçları ve piyasaya olumsuz etkisi', 'Gelecek sonuç beklentilerinin aşağı yönlü revizyonu', 'Kâr marjları üzerinde enflasyonist baskı', 'Sektörler ve bölgeler arası güçlü farklılık'],
  },
};

function generateFallbackContentTr(analysis: { assetClass: string; sentiment: string; confidenceScore: number; riskLevel: string; title: string }): { sections: Record<string, string>; highlights: string[] } {
  const info = ASSET_CLASS_INFO_TR[analysis.assetClass] || ASSET_CLASS_INFO_TR.economy;
  const sentimentLabel = analysis.sentiment === 'bullish' ? 'Yükseliş' : analysis.sentiment === 'bearish' ? 'Düşüş' : 'Nötr';
  const riskLabel = analysis.riskLevel === 'low' ? 'Düşük' : analysis.riskLevel === 'high' ? 'Yüksek' : analysis.riskLevel === 'extreme' ? 'Çok Yüksek' : 'Orta';
  const isStrategic = analysis.assetClass === 'strategic';

  const sections: Record<string, string> = {};
  const highlights: string[] = [];

  if (isStrategic) {
    sections.overview = `Bu stratejik rapor, günlük otomatik raporlardan farklı olarak belirli bir konuda derinlemesine analiz sağlar. Gerçek verilerle derinlemesine yapay zeka analizine dayanır, zaman senaryolarını, etkilenen varlıkları ve stratejik önerileri kapsar.\n\n${info.description}`;
  } else {
    sections.overview = `Bu rapor, mevcut veriler ve göstergelere dayalı olarak ${info.nameTr} piyasasının kapsamlı bir analizini sunar. ${analysis.confidenceScore}% güven seviyesi, bu analizde kullanılan verilerin güvenilirliğini yansıtırken, genel eğilim ${sentimentLabel} piyasa konumunu göstermektedir.\n\n${info.description}`;

    sections.detailedAnalysis = `Mevcut ${info.nameTr} piyasa ortamı birkaç kilit faktör tarafından şekillendirilmektedir:\n\n${info.keyDrivers.map((d, i) => {
      return `${i + 1}. **${d}**`;
    }).join('\n\n')}`;
  }

  sections.riskAssessment = `${info.nameTr} piyasasındaki risk seviyesi şu anda "${riskLabel}" olarak değerlendirilmektedir:\n\n${info.risks.map((r) => `- ${r}`).join('\n')}`;

  sections.strategicRecommendations = `Yukarıdaki analiz ve ${sentimentLabel} piyasa eğilimine dayanarak:\n\n### Muhafazakar Yatırımcı\n- ${info.nameTr} piyasasında yüksek volatiliteye sahip varlıklara maruziyeti azaltın\n- Sabit getirili savunmacı varlıklara odaklanın\n- Herhangi yeni pozisyon için net stop-loss seviyeleri belirleyin\n\n### Orta Düzey Yatırımcı\n- Yatırımları ${(info as any).sectors.slice(0, 2).join(' ve ')} varlıkları arasında dağıtın\n- Yeni pozisyonlara girmeden önce eğilimin stabilize olmasını bekleyin\n\n### Gün İçi Trader\n- Kilit destek ve direnç seviyelerini izleyin\n- Aktif işlem seansları sırasında ${info.nameTr} piyasasının volatilitesinden yararlanın`;

  sections.outlook = `### Yükseliş Senaryosu (${sentimentLabel === 'Yükseliş' ? '55' : '30'}% olasılık)\n${info.keyDrivers[0] || 'mevcut faktörlerin'} sürekli desteği, özellikle ekonomik verilerin iyileşmesiyle ${info.nameTr} piyasasını üst seviyelere taşıyabilir.\n\n### Nötr Senaryo (${sentimentLabel === 'Nötr' ? '50' : '40'}% olasılık)\n${info.keyDrivers[1] || 'kilit faktörlerin'} yönüne netlik beklenirken mevcut durumun sürmesi ve dar aralıkta işlem görmesi.\n\n### Düşüş Senaryosu (${sentimentLabel === 'Düşüş' ? '55' : '25'}% olasılık)\n${info.risks[0] || 'mevcut risklerin'} etkisinin artması, özellikle risk iştahının düşmesiyle fiyatlara baskı yapabilir.`;

  highlights.push(
    `Güven Seviyesi: ${analysis.confidenceScore}% — ${analysis.confidenceScore >= 70 ? 'Yüksek güvenilirlik' : analysis.confidenceScore >= 50 ? 'Orta güvenilirlik' : 'Sınırlı güvenilirlik'}`,
    `Genel Eğilim: ${sentimentLabel}`,
    `Risk Seviyesi: ${riskLabel}`,
    `Etkilenen Sektörler: ${(info as any).sectors.slice(0, 3).join(', ')}`,
  );

  return { sections, highlights };
}

// ─── Heading to section key mapping ──────────────────────────
const HEADING_TO_KEY: Record<string, string> = {
  'Yönetici Özeti': 'executiveSummary',
  'Bağlam ve Arka Plan': 'context',
  'Doğrudan Ekonomik Etki': 'economicImpact',
  'Piyasa Etkisi': 'marketImpact',
  'Senaryolar': 'scenarios',
  'Etkilenen Varlıklar': 'affectedAssets',
  'Stratejik Öneriler': 'strategicRecommendations',
  'İzleme Göstergeleri': 'followUpIndicators',
  'Genel Görünüm': 'overview',
  'Giriş': 'introduction',
  'Risk Değerlendirmesi': 'riskAssessment',
  'Beklentiler': 'outlook',
  // Also support English/Arabic headings
  'Executive Summary': 'executiveSummary',
  'Context & Background': 'context',
  'Direct Economic Impact': 'economicImpact',
  'Market Impact': 'marketImpact',
  'Overview': 'overview',
  'Risk Assessment': 'riskAssessment',
  'Outlook': 'outlook',
  'الملخص التنفيذي': 'executiveSummary',
  'نظرة عامة': 'overview',
};

function processContent(rawContent: string): {
  sections: Record<string, string>;
  metadata: Record<string, any>;
  dataQuality: Record<string, any>;
  summary: string;
} {
  const result = {
    sections: {} as Record<string, string>,
    metadata: {} as Record<string, any>,
    dataQuality: {} as Record<string, any>,
    summary: '',
  };

  if (!rawContent || rawContent.trim().length === 0) return result;

  try {
    const parsed = JSON.parse(rawContent);

    if (parsed.sections && typeof parsed.sections === 'object') {
      for (const [key, value] of Object.entries(parsed.sections)) {
        if (typeof value === 'string' && value.trim().length > 0) {
          result.sections[key] = stripMarkdownHeadings(value);
        } else if (typeof value === 'object' && value !== null) {
          const extracted = extractTextFromObject(value as Record<string, unknown>);
          if (extracted.length > 20) result.sections[key] = stripMarkdownHeadings(extracted);
        }
      }
    }

    const KNOWN_SECTION_KEYS = [
      'introduction', 'overview', 'executiveSummary', 'weeklyOverview',
      'economicOverview', 'quarterlyOverview', 'eventAnalysis', 'context',
      'economicImpact', 'marketImpact', 'scenarios', 'affectedAssets',
      'followUpIndicators', 'sourcesAndReferences', 'confidenceAssessment',
      'rouaRecommendations', 'rouaaRecommendations', 'strategicRecommendations', 'riskAssessment',
      'outlook', 'keyFindings', 'highlights', 'keyPoints', 'mainFindings',
      'rawContent', 'sentimentAnalysis', 'technicalOutlook', 'detailedAnalysis',
    ];
    if (Object.keys(result.sections).length === 0 && !parsed.sections) {
      for (const [key, value] of Object.entries(parsed)) {
        if (KNOWN_SECTION_KEYS.includes(key) && typeof value === 'string' && value.trim().length > 0) {
          result.sections[key] = stripMarkdownHeadings(value);
        }
      }
    }

    const aiContentSource = parsed.metadata?.aiContent || parsed.aiContent;
    if (aiContentSource && typeof aiContentSource === 'object') {
      const ai = aiContentSource;
      const aiSectionMap: Record<string, string> = {
        summary: 'overview', detailedAnalysis: 'detailedAnalysis',
        recommendations: 'strategicRecommendations', riskFactors: 'riskAssessment',
        outlook: 'outlook', technicalAnalysis: 'technicalOutlook',
        fundamentalAnalysis: 'fundamentalAnalysis', marketPulse: 'marketPulse',
        sectorAnalysis: 'sectorPerformance', sentimentDetails: 'sentimentAnalysis',
      };
      for (const [aiKey, sectionKey] of Object.entries(aiSectionMap)) {
        if ((ai as any)[aiKey] && !result.sections[sectionKey]) {
          const val = (ai as any)[aiKey];
          if (typeof val === 'string' && val.trim().length > 0) {
            result.sections[sectionKey] = stripMarkdownHeadings(val);
          } else if (Array.isArray(val)) {
            const text = val.join('\n\n');
            if (text.trim().length > 20) result.sections[sectionKey] = stripMarkdownHeadings(text);
          }
        }
      }
      if (!result.sections.highlights && Array.isArray(ai.keyFindings) && ai.keyFindings.length > 0) {
        result.sections.highlights = JSON.stringify(ai.keyFindings);
      }
    }

    result.metadata = parsed.metadata || {};
    result.dataQuality = parsed.dataQuality || {};

    const rawSummary = result.sections.introduction || result.sections.overview
      || result.sections.executiveSummary || result.sections.weeklyOverview
      || result.sections.economicOverview || result.sections.quarterlyOverview
      || result.sections.eventAnalysis || result.sections.context || '';
    result.summary = stripSummaryMarkdown(rawSummary);
    if (result.summary.length > 500) result.summary = truncateAtBoundary(result.summary, 500);

  } catch {
    const text = rawContent.trim();
    if (text.length > 20) {
      const headingRegex = /^##\s+(\d+[\.\s]*)?(.+)$/gm;
      const matches: { index: number; number: string; title: string }[] = [];
      let match;
      while ((match = headingRegex.exec(text)) !== null) {
        matches.push({ index: match.index, number: (match[1] || '').replace(/[\.\s]/g, '').trim(), title: match[2].trim() });
      }
      if (matches.length >= 2) {
        for (let i = 0; i < matches.length; i++) {
          const startIdx = matches[i].index + text.substring(matches[i].index).split('\n')[0].length + 1;
          const endIdx = i + 1 < matches.length ? matches[i + 1].index : text.length;
          const content = text.substring(startIdx, endIdx).trim();
          if (content.length < 5) continue;
          let sectionKey = '';
          const title = matches[i].title;
          if (matches[i].number) {
            const numberKeyMap: Record<string, string> = { '1': 'executiveSummary', '2': 'context', '3': 'economicImpact', '4': 'marketImpact', '5': 'scenarios', '6': 'affectedAssets', '7': 'strategicRecommendations', '8': 'followUpIndicators' };
            sectionKey = numberKeyMap[matches[i].number] || '';
          }
          if (!sectionKey) {
            for (const [headingTitle, key] of Object.entries(HEADING_TO_KEY)) {
              if (title.includes(headingTitle) || headingTitle.includes(title)) { sectionKey = key; break; }
            }
          }
          if (!sectionKey) sectionKey = `section${matches[i].number || i + 1}`;
          result.sections[sectionKey] = stripMarkdownHeadings(content);
        }
        result.sections.rawContent = stripMarkdownHeadings(text);
        const rawSummary = result.sections.executiveSummary || result.sections.overview || result.sections.introduction || stripSummaryMarkdown(text.slice(0, 500));
        result.summary = stripSummaryMarkdown(rawSummary);
      } else {
        result.sections.overview = stripMarkdownHeadings(text);
        result.summary = stripSummaryMarkdown(text.slice(0, 500));
      }
      if (result.summary.length > 500) result.summary = truncateAtBoundary(result.summary, 500);
    }
  }
  return result;
}

function extractTextFromObject(obj: Record<string, unknown>, depth = 0): string {
  if (depth > 3) return '';
  const parts: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.trim().length > 5) parts.push(value.trim());
    else if (typeof value === 'number') { const label = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2'); parts.push(`**${label}**: ${value}`); }
    else if (Array.isArray(value)) { for (const item of value) { if (typeof item === 'string' && item.trim().length > 5) parts.push(`- ${item.trim()}`); else if (typeof item === 'object' && item !== null) { const nested = extractTextFromObject(item as Record<string, unknown>, depth + 1); if (nested) parts.push(nested); } } }
    else if (typeof value === 'object' && value !== null) { const nested = extractTextFromObject(value as Record<string, unknown>, depth + 1); if (nested) parts.push(`**${key.replace(/_/g, ' ')}**\n\n${nested}`); }
  }
  return parts.join('\n\n');
}

// ─── Generate Dynamic Metadata for SEO ────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  let { slug: rawSlug } = await params;
  try { if (rawSlug && rawSlug.includes('%')) rawSlug = decodeURIComponent(rawSlug); } catch {}

  if (!rawSlug || rawSlug === 'undefined' || rawSlug === 'null') {
    return { title: 'Rapor bulunamadı — Rouaa', description: 'Yapay zeka destekli finansal analiz' };
  }

  try {
    const slug = rawSlug;
    let report = await db.economicReport.findFirst({
      where: { locale: 'tr', isPublished: true, OR: [{ id: slug }, { slug }] },
      select: { id: true, title: true, summary: true, content: true, slug: true, scope: true, reportType: true, marketImpact: true, confidenceScore: true, imageUrl: true },
    });

    if (!report) {
      const analysis: any = await db.marketAnalysis.findFirst({
        where: { locale: 'tr', isPublished: true, OR: [{ id: slug }, { slug }] },
        select: { id: true, title: true, content: true, slug: true, assetClass: true, sentiment: true, confidenceScore: true },
      });
      if (analysis) {
        let analysisSummary = '';
        try { const parsed = JSON.parse(analysis.content || '{}'); analysisSummary = parsed.metadata?.summary || parsed.summary || ''; } catch {}
        report = { id: analysis.id, title: analysis.title, summary: analysisSummary, slug: analysis.slug, scope: analysis.assetClass || 'economy', reportType: 'analysis' as const, marketImpact: analysis.sentiment || 'neutral', confidenceScore: analysis.confidenceScore, imageUrl: null } as any;
      }
    }

    if (!report) return { title: 'Rapor bulunamadı — Rouaa' };

    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    try { const hdrs = await headers(); const host = hdrs.get('host'); const proto = hdrs.get('x-forwarded-proto') || 'https'; if (host) baseUrl = `${proto}://${host}`; } catch {}

    const title = report.title;
    const description = report.summary ? stripSummaryMarkdown(report.summary).slice(0, 160) : 'Kapsamlı finansal analiz raporu';

    return {
      title: `${title} — Rouaa Raporlar`,
      description,
      openGraph: { title, description, url: `${baseUrl}/tr/reports/${report.slug || slug}`, siteName: 'Rouaa', locale: 'tr_TR', type: 'article', images: [{ url: report.imageUrl || `${baseUrl}/og-image.png`, width: 1200, height: 630 }] },
      twitter: { card: 'summary_large_image', title, description, images: [report.imageUrl || `${baseUrl}/og-image.png`] },
      alternates: { canonical: `/tr/reports/${report.slug || slug}` },
    };
  } catch {
    return { title: 'Rouaa Raporlar', description: 'Yapay zeka destekli finansal analiz' };
  }
}

// ─── Error Fallback Component ─────────────────────────────────
function ReportLoadError(slug: string, err?: unknown) {
  if (err) {
    console.error('════════════════════════════════════════');
    console.error(`🚨 [TR REPORT PAGE] Failed to load report slug="${slug}"`);
    console.error('════════════════════════════════════════');
    console.error('Error name:', (err as Error)?.name);
    console.error('Error message:', (err as Error)?.message);
    console.error('Error stack:', (err as Error)?.stack);
    if ((err as any)?.cause) console.error('Error cause:', (err as any).cause);
    console.error('Full error object:', err);
    console.error('════════════════════════════════════════');
  }
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#0A0E27', direction: 'ltr', fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: '480px', width: '100%', padding: '32px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', margin: '0 auto 20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#E2E8F0', margin: '0 0 12px' }}>Rapor Yüklenemedi</h1>
        <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.6, margin: '0 0 8px' }}>Bu rapor yüklenirken bir hata oluştu. Hata kaydedildi.</p>
        {slug && <p style={{ fontSize: '11px', color: '#475569', fontFamily: 'monospace', margin: '0 0 24px', wordBreak: 'break-all' }}>slug: {slug}</p>}
        <a href="/tr/reports" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, background: '#00E5FF', color: '#0A0E27', textDecoration: 'none' }}>Raporlara Dön</a>
      </div>
    </div>
  );
}

// ─── Page Component ──────────────────────────────────────────
export default async function TrReportSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  let slug = '';
  try {
    let { slug: rawSlug } = await params;
    try { if (rawSlug && rawSlug.includes('%')) rawSlug = decodeURIComponent(rawSlug); } catch {}
    try { const decodedOnce = decodeURIComponent(rawSlug); slug = decodedOnce; } catch { slug = rawSlug; }

    if (!slug || slug === 'undefined') notFound();

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="ltr" style={{ background: '#0A0E27' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ color: '#E2E8F0' }}>Rapor yükleniyor...</h1>
          <p style={{ color: '#64748B' }}>Veriler mevcut olduğunda rapor görüntülenecektir</p>
        </div>
      </div>
    );
  }

  // Strategy 1: Direct match with locale=tr
  let report = await db.economicReport.findFirst({ where: { locale: 'tr', isPublished: true, OR: [{ id: slug }, { slug }] } });

  // Strategy 2: Try with raw slug
  if (!report && slug !== rawSlug) {
    report = await db.economicReport.findFirst({ where: { locale: 'tr', isPublished: true, OR: [{ id: rawSlug }, { slug: rawSlug }] } });
  }

  // Strategy 3: Strategic report nanoid suffix match
  if (!report && slug.startsWith('strategic-')) {
    const parts = slug.split('-');
    const slugSuffix = parts[parts.length - 1];
    if (slugSuffix && slugSuffix.length >= 5) {
      report = await db.economicReport.findFirst({ where: { locale: 'tr', isPublished: true, reportType: 'strategic', slug: { endsWith: `-${slugSuffix}` } } });
    }
  }

  // Strategy 4: Partial slug match
  if (!report && slug.length > 20) {
    report = await db.economicReport.findFirst({ where: { locale: 'tr', isPublished: true, slug: { startsWith: slug.slice(0, 20) } } });
  }

  let isAnalysis = false;

  // V1037: MarketAnalysis queries can throw PrismaClientKnownRequestError.
  // Log e.code explicitly + retry with minimal select as defensive fallback.
  const logPrismaError = (label: string, e: unknown) => {
    const err = e as any;
    console.error(`🚨 [TR Report] ${label}`);
    console.error(`  class: ${err?.constructor?.name}  code: ${err?.code ?? '(none)'}  clientVersion: ${err?.clientVersion ?? '(none)'}`);
    console.error(`  message: ${err?.message ?? '(none)'}`);
    try { console.error(`  meta: ${JSON.stringify(err?.meta)}`); } catch {}
  };

  const MINIMAL_SELECT = {
    id: true, title: true, slug: true, content: true,
    assetClass: true, sentiment: true, confidenceScore: true,
    riskLevel: true, isPublished: true,
    publishedAt: true, createdAt: true, updatedAt: true,
    locale: true,
  };

  // Fallback: try finding a MarketAnalysis
  if (!report) {
    console.log('[TR Report] Strategy: trying MarketAnalysis with locale=tr, slug:', slug);
    let analysis: any = await db.marketAnalysis.findFirst({ where: { locale: 'tr', isPublished: true, OR: [{ id: slug }, { slug }] } })
      .catch(e => { logPrismaError('MarketAnalysis.findFirst(locale=tr) FAILED', e); return null; });
    console.log('[TR Report] MarketAnalysis(locale=tr) result:', analysis ? `FOUND id=${analysis.id}` : 'NOT FOUND');

    // V1037: Defensive fallback — minimal select
    if (!analysis) {
      console.log('[TR Report] Strategy: retry MarketAnalysis(locale=tr) with MINIMAL select');
      analysis = await db.marketAnalysis.findFirst({ where: { locale: 'tr', isPublished: true, OR: [{ id: slug }, { slug }] }, select: MINIMAL_SELECT })
        .catch(e => { logPrismaError('MarketAnalysis.findFirst(locale=tr, MINIMAL) FAILED', e); return null; });
      console.log('[TR Report] MarketAnalysis(locale=tr, MINIMAL) result:', analysis ? `FOUND id=${analysis.id}` : 'NOT FOUND');
    }

    // Without locale filter
    if (!analysis) {
      console.log('[TR Report] Strategy: trying MarketAnalysis without locale filter, slug:', slug);
      analysis = await db.marketAnalysis.findFirst({ where: { isPublished: true, OR: [{ id: slug }, { slug }] } })
        .catch(e => { logPrismaError('MarketAnalysis.findFirst(no locale) FAILED', e); return null; });
      console.log('[TR Report] MarketAnalysis(no locale) result:', analysis ? `FOUND id=${analysis.id}` : 'NOT FOUND');
    }

    // V1037: Defensive fallback — minimal select, no locale
    if (!analysis) {
      console.log('[TR Report] Strategy: retry MarketAnalysis(no locale) with MINIMAL select');
      analysis = await db.marketAnalysis.findFirst({ where: { isPublished: true, OR: [{ id: slug }, { slug }] }, select: MINIMAL_SELECT })
        .catch(e => { logPrismaError('MarketAnalysis.findFirst(no locale, MINIMAL) FAILED', e); return null; });
      console.log('[TR Report] MarketAnalysis(no locale, MINIMAL) result:', analysis ? `FOUND id=${analysis.id}` : 'NOT FOUND');
    }

    if (analysis) {
      isAnalysis = true;
      const assetClass = analysis.assetClass || 'economy';
      const processed = processContent(analysis.content || '{}');
      const sectionsWithContent = Object.values(processed.sections).filter(v => typeof v === 'string' && v.trim().length > 80);
      const hasContent = sectionsWithContent.length >= 2;

      if (!hasContent) {
        const fallback = generateFallbackContentTr({ assetClass, sentiment: analysis.sentiment || 'neutral', confidenceScore: analysis.confidenceScore || 50, riskLevel: analysis.riskLevel || 'medium', title: analysis.title });
        for (const [key, value] of Object.entries(fallback.sections)) { if (!processed.sections[key] || processed.sections[key].trim().length < 80) processed.sections[key] = value; }
        if (fallback.highlights.length > 0 && (!processed.sections.highlights || processed.sections.highlights.length < 10)) processed.sections.highlights = JSON.stringify(fallback.highlights);
        if (!processed.summary || processed.summary.trim().length < 30) processed.summary = processed.sections.introduction || processed.sections.overview || fallback.sections.overview?.slice(0, 300) || '';
      }

      let parsedIndicators: any = {};
      try { const indData = typeof analysis.indicators === 'string' ? JSON.parse(analysis.indicators) : analysis.indicators; if (Array.isArray(indData) && indData.length > 0) { parsedIndicators = { indicators: indData.map((ind: any) => ({ name: ind.name || ind.nameEn || ind.symbol, value: ind.value, change: ind.change || ind.changePercent || 0, symbol: ind.symbol })) }; } else if (typeof indData === 'object' && indData !== null) { parsedIndicators = indData; } } catch {}

      const contentJson = JSON.stringify({ sections: processed.sections, metadata: processed.metadata, dataQuality: processed.dataQuality });
      const normalizedReport = {
        id: analysis.id, title: analysis.title, slug: analysis.slug, summary: processed.summary || analysis.title, content: contentJson,
        reportType: 'analysis', scope: assetClass,
        sectors: (typeof analysis.sectors === 'string' ? safeParse(analysis.sectors) : analysis.sectors) || [],
        countries: (typeof analysis.countries === 'string' ? safeParse(analysis.countries) : analysis.countries) || [],
        keyIndicators: parsedIndicators, marketImpact: analysis.sentiment || 'neutral', confidenceScore: analysis.confidenceScore || 50,
        sourceUrls: (typeof analysis.sourceUrls === 'string' ? safeParse(analysis.sourceUrls) : analysis.sourceUrls) || [],
        imageUrl: analysis.imageUrl || undefined, publishedAt: analysis.publishedAt, createdAt: analysis.createdAt, isAnalysis: true,
      };

      const related = await db.marketAnalysis.findMany({ where: { locale: 'tr', isPublished: true, id: { not: analysis.id } }, take: 4, orderBy: { publishedAt: 'desc' } }).catch(() => []);
      const normalizedRelated = (related || []).map((r: any) => ({ id: r.id, title: r.title, slug: r.slug, reportType: r.reportType || 'analysis', marketImpact: r.marketImpact || r.sentiment || 'neutral', confidenceScore: r.confidenceScore || 50, publishedAt: r.publishedAt }));
      return <ReportDetailClient report={normalizedReport} related={normalizedRelated} locale="tr" />;
    }
  }

  if (!report) notFound();

  let processed: { sections: Record<string, string>; metadata: Record<string, any>; dataQuality: Record<string, any>; summary: string };
  try { processed = processContent(report.content || '{}'); } catch (e) { console.error('[TR Report Page] processContent error:', e); processed = { sections: {}, metadata: {}, dataQuality: {}, summary: report.summary || '' }; }

  const sectionsWithContent = Object.values(processed.sections).filter(v => typeof v === 'string' && v.trim().length > 80);
  const hasContent = sectionsWithContent.length >= 2;

  if (!hasContent) {
    const fallback = generateFallbackContentTr({ assetClass: report.scope || report.reportType || 'economy', sentiment: (report as any).marketImpact || 'neutral', confidenceScore: report.confidenceScore || 50, riskLevel: 'medium', title: report.title });
    for (const [key, value] of Object.entries(fallback.sections)) { if (!processed.sections[key] || processed.sections[key].trim().length < 80) processed.sections[key] = value; }
    if (fallback.highlights.length > 0 && (!processed.sections.highlights || processed.sections.highlights.length < 10)) processed.sections.highlights = JSON.stringify(fallback.highlights);
    if (!processed.summary || processed.summary.trim().length < 30) processed.summary = processed.sections.introduction || processed.sections.overview || fallback.sections.overview?.slice(0, 300) || '';
  }

  const contentJson = JSON.stringify({ sections: processed.sections, metadata: processed.metadata, dataQuality: processed.dataQuality });
  const normalizedReport = {
    id: report.id, title: report.title, slug: report.slug, summary: processed.summary || report.summary || '', content: contentJson,
    reportType: report.reportType || 'daily', scope: report.scope || 'global',
    sectors: (() => { try { const s = (report as any).sectors; if (typeof s === 'string') return safeParse(s); return Array.isArray(s) ? s : []; } catch { return []; } })(),
    countries: (() => { try { const c = (report as any).countries; if (typeof c === 'string') return safeParse(c); return Array.isArray(c) ? c : []; } catch { return []; } })(),
    keyIndicators: (() => { try { const ki = (report as any).keyIndicators; if (!ki) return {}; if (typeof ki === 'string') return JSON.parse(ki); return ki; } catch { return {}; } })(),
    marketImpact: (report as any).marketImpact || 'neutral', confidenceScore: report.confidenceScore || 50,
    sourceUrls: (() => { try { const su = report.sourceUrls; if (!su) return []; if (typeof su === 'string') return safeParse(su); return Array.isArray(su) ? su : []; } catch { return []; } })(),
    imageUrl: report.imageUrl || undefined, publishedAt: report.publishedAt, createdAt: report.createdAt,
  };

  const related = await db.economicReport.findMany({ where: { locale: 'tr', isPublished: true, id: { not: report.id } }, take: 4, orderBy: { publishedAt: 'desc' } }).catch(() => []);
  const normalizedRelated = (related || []).map((r: any) => ({ id: r.id, title: r.title, slug: r.slug, reportType: r.reportType || 'daily', marketImpact: (r as any).marketImpact || 'neutral', confidenceScore: r.confidenceScore || 50, publishedAt: r.publishedAt }));

  return <ReportDetailClient report={normalizedReport} related={normalizedRelated} locale="tr" />;
  } catch (err) {
    // Re-throw Next.js notFound() errors so the 404 page renders correctly.
    if (err instanceof Error && (err as any).digest === 'NEXT_NOT_FOUND') throw err;
    if (err instanceof Error && err.message?.includes('NEXT_NOT_FOUND')) throw err;
    if (err instanceof Error && (err as any).digest?.startsWith('NEXT_')) throw err;

    // Catch all other errors — log them for Railway visibility, show graceful fallback.
    return ReportLoadError(slug, err) as unknown as JSX.Element;
  }
}

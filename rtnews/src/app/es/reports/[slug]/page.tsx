import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { stripMarkdownHeadings, stripSummaryMarkdown, truncateAtBoundary } from '@/lib/clean-markdown';
import EnReportDetailClient from '@/app/en/reports/[slug]/EnReportDetailClient';

export const revalidate = 300;
const safeParse = (str: string, fallback: any = []) => { try { return JSON.parse(str); } catch { return fallback; } };

const ASSET_CLASS_INFO_ES: Record<string, { nombre: string; descripcion: string; sectores: string[]; factoresClave: string[]; riesgos: string[] }> = {
  strategic: {
    nombre: 'Informes Estratégicos', descripcion: 'Informes analíticos exhaustivos sobre temas específicos.',
    sectores: ['Análisis Económico', 'Mercados Financieros', 'Escenarios Futuros', 'Recomendaciones Estratégicas'],
    factoresClave: ['Grandes eventos económicos y geopolíticos', 'Políticas de bancos centrales', 'Cambios en los mercados financieros globales', 'Tendencias de inversión institucional'],
    riesgos: ['Cambios repentinos en políticas monetarias', 'Desarrollos geopolíticos inesperados', 'Alta volatilidad en los mercados de energía y divisas', 'Desaceleración económica'],
  },
  forex: {
    nombre: 'Forex', descripcion: 'El mercado de divisas es el mercado financiero más grande del mundo.',
    sectores: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF'],
    factoresClave: ['Decisiones de tipos de interés de la Reserva Federal y el BCE', 'Datos de inflación y crecimiento económico', 'Tensiones geopolíticas', 'Movimientos del índice del dólar estadounidense'],
    riesgos: ['Volatilidad brusca por decisiones inesperadas de bancos centrales', 'Intervención gubernamental', 'Crisis políticas regionales', 'Desaceleración económica global'],
  },
  stocks: {
    nombre: 'Acciones', descripcion: 'El mercado bursátil global experimenta influencia mutua entre las principales bolsas.',
    sectores: ['Acciones EE.UU.', 'Acciones Europeas', 'Acciones Asiáticas', 'Acciones del Golfo'],
    factoresClave: ['Temporada de resultados corporativos', 'Decisiones de tipos de interés', 'Desarrollos tecnológicos', 'Flujos de inversión internacionales'],
    riesgos: ['Correcciones de precios tras períodos alcistas', 'Desaceleración del crecimiento económico', 'Regulación más estricta', 'Guerras comerciales y aranceles'],
  },
  crypto: {
    nombre: 'Criptomonedas', descripcion: 'El mercado de criptomonedas se caracteriza por su alta volatilidad.',
    sectores: ['Bitcoin', 'Ethereum', 'Altcoins', 'Finanzas Descentralizadas'],
    factoresClave: ['Entrada de capital institucional y fondos ETF', 'Desarrollos regulatorios globales', 'Actualizaciones de red y protocolo', 'Tipos de interés y liquidez global'],
    riesgos: ['Volatilidad de precios brusca y repentina', 'Intervención regulatoria estricta', 'Riesgos de seguridad y brechas de plataformas', 'Pérdida de confianza y colapsos de grandes proyectos'],
  },
  economy: {
    nombre: 'Macroeconomía', descripcion: 'La economía global enfrenta múltiples desafíos.',
    sectores: ['Crecimiento Económico', 'Inflación', 'Tipos de Interés', 'Comercio Internacional'],
    factoresClave: ['Políticas de bancos centrales', 'Datos de inflación y PIB', 'Comercio internacional y cadenas de suministro', 'Políticas fiscales gubernamentales'],
    riesgos: ['Recesión económica global', 'Inflación persistente', 'Crises de deuda soberana', 'Guerras comerciales y aranceles'],
  },
  energy: {
    nombre: 'Energía', descripcion: 'El mercado energético global está influenciado por el equilibrio oferta-demanda.',
    sectores: ['Petróleo Crudo', 'Gas Natural', 'Energía Renovable', 'Petroquímicos'],
    factoresClave: ['Decisiones de la OPEP', 'Demanda china', 'Tensiones en Oriente Medio', 'Transición a energía limpia'],
    riesgos: ['Guerras de precios entre grandes productores', 'Impacto de conflictos en el suministro', 'Desaceleración de la demanda global', 'Sanciones comerciales'],
  },
  commodities: {
    nombre: 'Materias Primas', descripcion: 'Los mercados de materias primas están influenciados por múltiples factores.',
    sectores: ['Oro', 'Plata', 'Cobre', 'Productos Agrícolas'],
    factoresClave: ['Movimientos del dólar estadounidense', 'Demanda industrial de China', 'Condiciones climáticas', 'Tensiones geopolíticas'],
    riesgos: ['Escasez de suministro', 'Desaceleración de la demanda industrial global', 'Volatilidad del tipo de cambio', 'Especulación en mercados de futuros'],
  },
  bonds: {
    nombre: 'Bonos', descripcion: 'El mercado global de bonos es una medida clave de las expectativas de tipos de interés.',
    sectores: ['Bonos Gubernamentales', 'Bonos Corporativos', 'Bonos de Alto Rendimiento', 'Bonos Islámicos'],
    factoresClave: ['Decisiones de bancos centrales sobre tipos de interés', 'Expectativas de inflación', 'Calificaciones crediticias', 'Oferta y demanda de nueva deuda'],
    riesgos: ['Aumento de rendimientos', 'Riesgo de incumplimiento', 'Riesgos de liquidez', 'Volatilidad del tipo de cambio'],
  },
  technicalAnalysis: {
    nombre: 'Análisis Técnico', descripcion: 'Análisis técnico exhaustivo basado en indicadores y patrones.',
    sectores: ['Forex', 'Criptomonedas', 'Oro y Petróleo', 'Acciones Globales'],
    factoresClave: ['Niveles clave de soporte y resistencia', 'Indicadores técnicos', 'Patrones de precios y velas', 'Volumen de negociación'],
    riesgos: ['Señales técnicas contradictorias', 'Falsos rompimientos', 'Cambios repentinos por eventos', 'Períodos de baja liquidez'],
  },
  earnings: {
    nombre: 'Resultados Corporativos', descripcion: 'La temporada de resultados corporativos es uno de los principales impulsores del mercado.',
    sectores: ['Resultados EE.UU.', 'Resultados Europeos', 'Resultados del Golfo', 'Expectativas de Analistas'],
    factoresClave: ['Resultados reales vs expectativas', 'Guía futura', 'Márgenes de beneficio', 'Tasas de crecimiento'],
    riesgos: ['Decepción por resultados importantes', 'Reducción de expectativas futuras', 'Presión inflacionaria en márgenes', 'Divergencia entre sectores'],
  },
  realEstate: {
    nombre: 'Bienes Raíces', descripcion: 'El sector inmobiliario está influenciado por los tipos de interés y las políticas de financiación.',
    sectores: ['Residencial', 'Comercial', 'REITs', 'Desarrollo'],
    factoresClave: ['Tipos hipotecarios', 'Crecimiento demográfico', 'Inversiones gubernamentales', 'Políticas regulatorias'],
    riesgos: ['Burbuja inmobiliaria', 'Aumento de los tipos de interés', 'Desaceleración económica', 'Regulación más estricta'],
  },
  banking: {
    nombre: 'Banca', descripcion: 'El sector bancario está influenciado por el entorno de tipos de interés.',
    sectores: ['Bancos Tradicionales', 'Bancos Islámicos', 'Bancos de Inversión', 'Finanzas Digitales'],
    factoresClave: ['Estructura de tipos de interés', 'Calidad de la cartera crediticia', 'Transformación digital', 'Regulaciones y cumplimiento'],
    riesgos: ['Aumento de tasas de incumplimiento de préstamos', 'Volatilidad de tipos de interés', 'Riesgos cibernéticos y de seguridad', 'Competencia de fintech'],
  },
};

function generateFallbackContentEs(analysis: { assetClass: string; sentiment: string; confidenceScore: number; riskLevel: string; title: string }): { sections: Record<string, string>; highlights: string[] } {
  const info = ASSET_CLASS_INFO_ES[analysis.assetClass] || ASSET_CLASS_INFO_ES.economy;
  const sentimentLabel = analysis.sentiment === 'bullish' ? 'Alcista' : analysis.sentiment === 'bearish' ? 'Bajista' : 'Neutral';
  const riskLabel = analysis.riskLevel === 'low' ? 'Bajo' : analysis.riskLevel === 'high' ? 'Alto' : analysis.riskLevel === 'extreme' ? 'Muy Alto' : 'Medio';

  const sections: Record<string, string> = {};
  const highlights: string[] = [];

  sections.overview = `Este informe proporciona un análisis exhaustivo del mercado de ${info.nombre}. El nivel de confianza del ${analysis.confidenceScore}% refleja la fiabilidad de los datos utilizados, mientras que la tendencia general indica una posición de mercado ${sentimentLabel}.\n\n${info.descripcion}`;

  sections.detailedAnalysis = `El panorama actual del mercado de ${info.nombre} está configurado por varios factores clave:\n\n${info.factoresClave.map((d, i) => `${i + 1}. **${d}**: Directamente vinculado a los movimientos de precios actuales.`).join('\n\n')}`;

  sections.riskAssessment = `El nivel de riesgo en el mercado de ${info.nombre} se evalúa actualmente como "${riskLabel}":\n\n${info.riesgos.map((r) => `- ${r}`).join('\n')}`;

  sections.strategicRecommendations = `Basándose en el análisis y la tendencia de mercado ${sentimentLabel}:\n\n### Inversor Conservador\n- Reducir la exposición a activos de alta volatilidad\n- Enfocarse en activos defensivos\n\n### Inversor Moderado\n- Distribuir inversiones entre activos de ${info.sectores.slice(0, 2).join(' y ')}\n\n### Trader Diario\n- Monitorear los niveles clave de soporte y resistencia`;

  sections.outlook = `### Escenario Alcista (${sentimentLabel === 'Alcista' ? '55' : '30'}% probabilidad)\nEl continuo respaldo de ${info.factoresClave[0]} podría impulsar el mercado al alza.\n\n### Escenario Neutral (${sentimentLabel === 'Neutral' ? '50' : '40'}% probabilidad)\nContinuación de la situación actual a la espera de mayor claridad.\n\n### Escenario Bajista (${sentimentLabel === 'Bajista' ? '55' : '25'}% probabilidad)\nEl impacto creciente de ${info.riesgos[0]} podría presionar los precios a la baja.`;

  highlights.push(
    `Nivel de Confianza: ${analysis.confidenceScore}%`,
    `Tendencia General: ${sentimentLabel}`,
    `Nivel de Riesgo: ${riskLabel}`,
    `Sectores Afectados: ${info.sectores.slice(0, 3).join(', ')}`,
  );

  return { sections, highlights };
}

function extractTextFromObject(obj: Record<string, unknown>, depth = 0): string {
  if (depth > 3) return '';
  const parts: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.trim().length > 5) parts.push(value.trim());
    else if (typeof value === 'number') { const label = key.replace(/_/g, ' '); parts.push(`**${label}**: ${value}`); }
    else if (Array.isArray(value)) { for (const item of value) { if (typeof item === 'string' && item.trim().length > 5) parts.push(`- ${item.trim()}`); else if (typeof item === 'object' && item !== null) { const nested = extractTextFromObject(item as Record<string, unknown>, depth + 1); if (nested) parts.push(nested); } } }
    else if (typeof value === 'object' && value !== null) { const nested = extractTextFromObject(value as Record<string, unknown>, depth + 1); if (nested) parts.push(`**${key.replace(/_/g, ' ')}**\n\n${nested}`); }
  }
  return parts.join('\n\n');
}

const HEADING_TO_KEY: Record<string, string> = {
  'Executive Summary': 'executiveSummary', 'Context & Background': 'context', 'Direct Economic Impact': 'economicImpact',
  'Market Impact': 'marketImpact', 'Scenarios': 'scenarios', 'Affected Assets': 'affectedAssets',
  'Strategic Recommendations': 'strategicRecommendations', 'Follow-up Indicators': 'followUpIndicators',
  'Overview': 'overview', 'Introduction': 'introduction', 'Risk Assessment': 'riskAssessment', 'Outlook': 'outlook',
  'الملخص التنفيذي': 'executiveSummary', 'نظرة عامة': 'overview', 'مقدمة التقرير': 'introduction',
  'تقييم المخاطر': 'riskAssessment', 'التوقعات': 'outlook',
  'Resumen Ejecutivo': 'executiveSummary', 'Impacto Económico Directo': 'economicImpact',
  'Impacto en el Mercado': 'marketImpact', 'Escenarios': 'scenarios', 'Activos Afectados': 'affectedAssets',
  'Recomendaciones Estratégicas': 'strategicRecommendations', 'Indicadores de Seguimiento': 'followUpIndicators',
  'Panorama General': 'overview', 'Introducción': 'introduction', 'Evaluación de Riesgos': 'riskAssessment',
  'Perspectivas': 'outlook', 'Análisis Detallado': 'detailedAnalysis',
};

function processContent(rawContent: string): { sections: Record<string, string>; metadata: Record<string, any>; dataQuality: Record<string, any>; summary: string } {
  const result = { sections: {} as Record<string, string>, metadata: {} as Record<string, any>, dataQuality: {} as Record<string, any>, summary: '' };
  if (!rawContent || rawContent.trim().length === 0) return result;

  try {
    const parsed = JSON.parse(rawContent);
    if (parsed.sections && typeof parsed.sections === 'object') {
      for (const [key, value] of Object.entries(parsed.sections)) {
        if (typeof value === 'string' && value.trim().length > 0) result.sections[key] = stripMarkdownHeadings(value);
        else if (typeof value === 'object' && value !== null) { const extracted = extractTextFromObject(value as Record<string, unknown>); if (extracted.length > 20) result.sections[key] = stripMarkdownHeadings(extracted); }
      }
    }
    const KNOWN_SECTION_KEYS = ['introduction', 'overview', 'executiveSummary', 'weeklyOverview', 'economicOverview', 'quarterlyOverview', 'eventAnalysis', 'context', 'economicImpact', 'marketImpact', 'scenarios', 'affectedAssets', 'followUpIndicators', 'sourcesAndReferences', 'confidenceAssessment', 'rouaRecommendations', 'rouaaRecommendations', 'strategicRecommendations', 'riskAssessment', 'outlook', 'keyFindings', 'highlights', 'keyPoints', 'mainFindings', 'rawContent', 'sentimentAnalysis', 'technicalOutlook', 'detailedAnalysis'];
    if (Object.keys(result.sections).length === 0 && !parsed.sections) {
      for (const [key, value] of Object.entries(parsed)) { if (KNOWN_SECTION_KEYS.includes(key) && typeof value === 'string' && value.trim().length > 0) result.sections[key] = stripMarkdownHeadings(value); }
    }
    const aiContentSource = parsed.metadata?.aiContent || parsed.aiContent;
    if (aiContentSource && typeof aiContentSource === 'object') {
      const ai = aiContentSource;
      const aiSectionMap: Record<string, string> = { summary: 'overview', detailedAnalysis: 'detailedAnalysis', recommendations: 'strategicRecommendations', riskFactors: 'riskAssessment', outlook: 'outlook', technicalAnalysis: 'technicalOutlook', fundamentalAnalysis: 'fundamentalAnalysis', marketPulse: 'marketPulse', sectorAnalysis: 'sectorPerformance', sentimentDetails: 'sentimentAnalysis' };
      for (const [aiKey, sectionKey] of Object.entries(aiSectionMap)) {
        if ((ai as any)[aiKey] && !result.sections[sectionKey]) { const val = (ai as any)[aiKey]; if (typeof val === 'string' && val.trim().length > 0) result.sections[sectionKey] = stripMarkdownHeadings(val); else if (Array.isArray(val)) { const text = val.join('\n\n'); if (text.trim().length > 20) result.sections[sectionKey] = stripMarkdownHeadings(text); } }
      }
      if (!result.sections.highlights && Array.isArray(ai.keyFindings) && ai.keyFindings.length > 0) result.sections.highlights = JSON.stringify(ai.keyFindings);
    }
    result.metadata = parsed.metadata || {};
    result.dataQuality = parsed.dataQuality || {};
    const rawSummary = result.sections.introduction || result.sections.overview || result.sections.executiveSummary || result.sections.weeklyOverview || result.sections.economicOverview || result.sections.quarterlyOverview || result.sections.eventAnalysis || result.sections.context || '';
    result.summary = stripSummaryMarkdown(rawSummary);
    if (result.summary.length > 500) result.summary = truncateAtBoundary(result.summary, 500);
  } catch {
    const text = rawContent.trim();
    if (text.length > 20) { result.sections.overview = stripMarkdownHeadings(text); result.summary = stripSummaryMarkdown(text.slice(0, 500)); }
    if (result.summary.length > 500) result.summary = truncateAtBoundary(result.summary, 500);
  }
  return result;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  let { slug: rawSlug } = await params;
  try { if (rawSlug && rawSlug.includes('%')) rawSlug = decodeURIComponent(rawSlug); } catch {}
  if (!rawSlug || rawSlug === 'undefined' || rawSlug === 'null') return { title: 'Informe no encontrado — Rouaa', description: 'Análisis financiero con IA' };

  try {
    const slug = rawSlug;
    let report = await db.economicReport.findFirst({ where: { locale: 'es', isPublished: true, OR: [{ id: slug }, { slug }] }, select: { id: true, title: true, summary: true, content: true, slug: true, scope: true, reportType: true, marketImpact: true, confidenceScore: true, imageUrl: true } });
    if (!report) {
      const analysis: any = await db.marketAnalysis.findFirst({ where: { locale: 'es', isPublished: true, OR: [{ id: slug }, { slug }] }, select: { id: true, title: true, content: true, slug: true, assetClass: true, sentiment: true, confidenceScore: true } });
      if (analysis) {
        let analysisSummary = '';
        try { const parsed = JSON.parse(analysis.content || '{}'); analysisSummary = parsed.metadata?.summary || parsed.summary || ''; if (!analysisSummary && parsed.sections) { const sections = parsed.sections as Record<string, string>; analysisSummary = sections.introduction || sections.overview || sections.executiveSummary || ''; } } catch {}
        report = { id: analysis.id, title: analysis.title, summary: analysisSummary, slug: analysis.slug, scope: analysis.assetClass || 'economy', reportType: 'analysis' as const, marketImpact: analysis.sentiment || 'neutral', confidenceScore: analysis.confidenceScore, imageUrl: null } as any;
      }
    }
    if (!report) return { title: 'Informe no encontrado — Rouaa' };
    const title = report.title;
    let bestSummary = '';
    if (report.content) { try { const processed = processContent(report.content); if (processed.summary && processed.summary.trim().length > 10) bestSummary = processed.summary; } catch {} }
    const rawDesc = bestSummary ? stripSummaryMarkdown(bestSummary) : (report.summary ? stripSummaryMarkdown(report.summary) : '');
    const description = rawDesc ? truncateAtBoundary(rawDesc, 160, '') : 'Informe integral de análisis financiero';
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    try { const hdrs = await headers(); const host = hdrs.get('host'); const proto = hdrs.get('x-forwarded-proto') || 'https'; if (host) baseUrl = `${proto}://${host}`; } catch {}
    return { title: `${title} — Rouaa Informes`, description, openGraph: { title, description, url: `${baseUrl}/es/reports/${report.slug || slug}`, siteName: 'Rouaa', locale: 'es_ES', type: 'article', images: [{ url: report.imageUrl || `${baseUrl}/og-image.png`, width: 1200, height: 630 }] }, twitter: { card: 'summary_large_image', title, description, images: [report.imageUrl || `${baseUrl}/og-image.png`] }, alternates: { canonical: `/es/reports/${report.slug || slug}` } };
  } catch { return { title: 'Rouaa Informes', description: 'Análisis financiero con IA' }; }
}

// ─── Error Fallback Component ─────────────────────────────────
function ReportLoadError(slug: string, err?: unknown) {
  if (err) {
    console.error('════════════════════════════════════════');
    console.error(`🚨 [ES REPORT PAGE] Failed to load report slug="${slug}"`);
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
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#E2E8F0', margin: '0 0 12px' }}>No se pudo Cargar el Informe</h1>
        <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.6, margin: '0 0 8px' }}>Ocurrió un error al cargar este informe. El error ha sido registrado.</p>
        {slug && <p style={{ fontSize: '11px', color: '#475569', fontFamily: 'monospace', margin: '0 0 24px', wordBreak: 'break-all' }}>slug: {slug}</p>}
        <a href="/es/reports" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, background: '#00E5FF', color: '#0A0E27', textDecoration: 'none' }}>Volver a Informes</a>
      </div>
    </div>
  );
}

export default async function EsReportSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  let slug = '';
  try {
    let { slug: rawSlug } = await params;
    try { if (rawSlug && rawSlug.includes('%')) rawSlug = decodeURIComponent(rawSlug); } catch {}
    try { const decodedOnce = decodeURIComponent(rawSlug); slug = decodedOnce; } catch { slug = rawSlug; }
    if (!slug || slug === 'undefined') notFound();

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
    return (<div className="min-h-screen flex items-center justify-center" dir="ltr" style={{ background: '#0A0E27' }}><div className="text-center"><h1 className="text-2xl font-bold" style={{ color: '#E2E8F0' }}>Cargando informe...</h1><p style={{ color: '#64748B' }}>El informe aparecerá cuando los datos estén disponibles</p></div></div>);
  }

  let report = await db.economicReport.findFirst({ where: { locale: 'es', isPublished: true, OR: [{ id: slug }, { slug }] } });
  if (!report && slug !== rawSlug) { report = await db.economicReport.findFirst({ where: { locale: 'es', isPublished: true, OR: [{ id: rawSlug }, { slug: rawSlug }] } }); }
  if (!report) { report = await db.economicReport.findFirst({ where: { isPublished: true, OR: [{ id: slug }, { slug }] } }); if (report && !/^[a-zA-Z]/.test(report.title || '') && report.locale !== 'es') report = null; }
  if (!report && slug.startsWith('strategic-')) { const parts = slug.split('-'); const slugSuffix = parts[parts.length - 1]; if (slugSuffix && slugSuffix.length >= 5) { report = await db.economicReport.findFirst({ where: { locale: 'es', isPublished: true, reportType: 'strategic', slug: { endsWith: `-${slugSuffix}` } } }); } }
  if (!report && slug.length > 20) { report = await db.economicReport.findFirst({ where: { locale: 'es', isPublished: true, slug: { startsWith: slug.slice(0, 20) } } }); }

  let isAnalysis = false;

  // V1037: MarketAnalysis queries can throw PrismaClientKnownRequestError.
  // Log e.code explicitly + retry with minimal select as defensive fallback.
  const logPrismaError = (label: string, e: unknown) => {
    const err = e as any;
    console.error(`🚨 [ES Report] ${label}`);
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

  if (!report) {
    console.log('[ES Report] Strategy: trying MarketAnalysis with locale=es, slug:', slug);
    let analysis: any = await db.marketAnalysis.findFirst({ where: { locale: 'es', isPublished: true, OR: [{ id: slug }, { slug }] } })
      .catch(e => { logPrismaError('MarketAnalysis.findFirst(locale=es) FAILED', e); return null; });
    console.log('[ES Report] MarketAnalysis(locale=es) result:', analysis ? `FOUND id=${analysis.id}` : 'NOT FOUND');

    // V1037: Defensive fallback — minimal select
    if (!analysis) {
      console.log('[ES Report] Strategy: retry MarketAnalysis(locale=es) with MINIMAL select');
      analysis = await db.marketAnalysis.findFirst({ where: { locale: 'es', isPublished: true, OR: [{ id: slug }, { slug }] }, select: MINIMAL_SELECT })
        .catch(e => { logPrismaError('MarketAnalysis.findFirst(locale=es, MINIMAL) FAILED', e); return null; });
      console.log('[ES Report] MarketAnalysis(locale=es, MINIMAL) result:', analysis ? `FOUND id=${analysis.id}` : 'NOT FOUND');
    }

    // Without locale filter
    if (!analysis) {
      console.log('[ES Report] Strategy: trying MarketAnalysis without locale filter, slug:', slug);
      analysis = await db.marketAnalysis.findFirst({ where: { isPublished: true, OR: [{ id: slug }, { slug }] } })
        .catch(e => { logPrismaError('MarketAnalysis.findFirst(no locale) FAILED', e); return null; });
      if (analysis && analysis.locale === 'ar') analysis = null;
      console.log('[ES Report] MarketAnalysis(no locale) result:', analysis ? `FOUND id=${analysis.id}` : 'NOT FOUND');
    }

    // V1037: Defensive fallback — minimal select, no locale
    if (!analysis) {
      console.log('[ES Report] Strategy: retry MarketAnalysis(no locale) with MINIMAL select');
      analysis = await db.marketAnalysis.findFirst({ where: { isPublished: true, OR: [{ id: slug }, { slug }] }, select: MINIMAL_SELECT })
        .catch(e => { logPrismaError('MarketAnalysis.findFirst(no locale, MINIMAL) FAILED', e); return null; });
      if (analysis && analysis.locale === 'ar') analysis = null;
      console.log('[ES Report] MarketAnalysis(no locale, MINIMAL) result:', analysis ? `FOUND id=${analysis.id}` : 'NOT FOUND');
    }

    if (analysis) {
      isAnalysis = true;
      const assetClass = analysis.assetClass || 'economy';
      const processed = processContent(analysis.content || '{}');
      const sectionsWithContent = Object.values(processed.sections).filter(v => typeof v === 'string' && v.trim().length > 80);
      const hasContent = sectionsWithContent.length >= 2;
      if (!hasContent) {
        const fallback = generateFallbackContentEs({ assetClass, sentiment: analysis.sentiment || 'neutral', confidenceScore: analysis.confidenceScore || 50, riskLevel: analysis.riskLevel || 'medium', title: analysis.title });
        for (const [key, value] of Object.entries(fallback.sections)) { if (!processed.sections[key] || processed.sections[key].trim().length < 80) processed.sections[key] = value; }
        if (fallback.highlights.length > 0 && (!processed.sections.highlights || processed.sections.highlights.length < 10)) processed.sections.highlights = JSON.stringify(fallback.highlights);
        if (!processed.summary || processed.summary.trim().length < 30) processed.summary = processed.sections.introduction || processed.sections.overview || fallback.sections.overview?.slice(0, 300) || '';
      }

      let parsedIndicators: any = {};
      try { const indData = typeof analysis.indicators === 'string' ? JSON.parse(analysis.indicators) : analysis.indicators; if (Array.isArray(indData) && indData.length > 0) { parsedIndicators = { indicators: indData.map((ind: any) => ({ name: ind.name || ind.nameEn || ind.symbol, value: ind.value, change: ind.change || ind.changePercent || 0, symbol: ind.symbol })) }; } else if (typeof indData === 'object' && indData !== null) { parsedIndicators = indData; } } catch {}

      const contentJson = JSON.stringify({ sections: processed.sections, metadata: processed.metadata, dataQuality: processed.dataQuality });
      const normalizedReport = { id: analysis.id, title: analysis.title, slug: analysis.slug, summary: processed.summary || analysis.title, content: contentJson, reportType: 'analysis', scope: assetClass, sectors: (typeof analysis.sectors === 'string' ? safeParse(analysis.sectors) : analysis.sectors) || [], countries: (typeof analysis.countries === 'string' ? safeParse(analysis.countries) : analysis.countries) || [], keyIndicators: parsedIndicators, marketImpact: analysis.sentiment || 'neutral', confidenceScore: analysis.confidenceScore || 50, sourceUrls: (typeof analysis.sourceUrls === 'string' ? safeParse(analysis.sourceUrls) : analysis.sourceUrls) || [], imageUrl: analysis.imageUrl || undefined, publishedAt: analysis.publishedAt, createdAt: analysis.createdAt, isAnalysis: true };

      const related = await db.marketAnalysis.findMany({ where: { locale: 'es', isPublished: true, id: { not: analysis.id } }, take: 4, orderBy: { publishedAt: 'desc' } }).catch(() => []);
      const normalizedRelated = (related || []).map((r: any) => ({ id: r.id, title: r.title, slug: r.slug, reportType: r.reportType || 'analysis', marketImpact: r.marketImpact || r.sentiment || 'neutral', confidenceScore: r.confidenceScore || 50, publishedAt: r.publishedAt }));

      return <EnReportDetailClient report={normalizedReport} related={normalizedRelated} locale="es" />;
    }
  }

  if (!report) notFound();

  let processed: { sections: Record<string, string>; metadata: Record<string, any>; dataQuality: Record<string, any>; summary: string };
  try { processed = processContent(report.content || '{}'); } catch (e) { processed = { sections: {}, metadata: {}, dataQuality: {}, summary: report.summary || '' }; }

  const sectionsWithContent = Object.values(processed.sections).filter(v => typeof v === 'string' && v.trim().length > 80);
  const hasContent = sectionsWithContent.length >= 2;

  if (!hasContent) {
    const fallback = generateFallbackContentEs({ assetClass: report.scope || report.reportType || 'economy', sentiment: (report as any).marketImpact || 'neutral', confidenceScore: report.confidenceScore || 50, riskLevel: 'medium', title: report.title });
    for (const [key, value] of Object.entries(fallback.sections)) { if (!processed.sections[key] || processed.sections[key].trim().length < 80) processed.sections[key] = value; }
    if (fallback.highlights.length > 0 && (!processed.sections.highlights || processed.sections.highlights.length < 10)) processed.sections.highlights = JSON.stringify(fallback.highlights);
    if (!processed.summary || processed.summary.trim().length < 30) processed.summary = processed.sections.introduction || processed.sections.overview || fallback.sections.overview?.slice(0, 300) || '';
  }

  const contentJson = JSON.stringify({ sections: processed.sections, metadata: processed.metadata, dataQuality: processed.dataQuality });
  const normalizedReport = {
    id: report.id, title: report.title, slug: report.slug, summary: processed.summary || report.summary || '', content: contentJson, reportType: report.reportType || 'daily', scope: report.scope || 'global',
    sectors: (() => { try { const s = (report as any).sectors; if (typeof s === 'string') return safeParse(s); return Array.isArray(s) ? s : []; } catch { return []; } })(),
    countries: (() => { try { const c = (report as any).countries; if (typeof c === 'string') return safeParse(c); return Array.isArray(c) ? c : []; } catch { return []; } })(),
    keyIndicators: (() => { try { const ki = (report as any).keyIndicators; if (!ki) return {}; if (typeof ki === 'string') return JSON.parse(ki); return ki; } catch { return {}; } })(),
    marketImpact: (report as any).marketImpact || 'neutral', confidenceScore: report.confidenceScore || 50,
    sourceUrls: (() => { try { const su = report.sourceUrls; if (!su) return []; if (typeof su === 'string') return JSON.parse(su); return Array.isArray(su) ? su : []; } catch { return []; } })(),
    imageUrl: report.imageUrl || undefined, publishedAt: report.publishedAt, createdAt: report.createdAt, isAnalysis: false,
  };

  const related = await db.marketAnalysis.findMany({ where: { locale: 'es', isPublished: true }, take: 4, orderBy: { publishedAt: 'desc' } }).catch(() => []);
  const normalizedRelated = (related || []).map((r: any) => ({ id: r.id, title: r.title, slug: r.slug, reportType: r.reportType || 'analysis', marketImpact: r.marketImpact || r.sentiment || 'neutral', confidenceScore: r.confidenceScore || 50, publishedAt: r.publishedAt }));

  return <EnReportDetailClient report={normalizedReport} related={normalizedRelated} locale="es" />;
  } catch (err) {
    if (err instanceof Error && (err as any).digest === 'NEXT_NOT_FOUND') throw err;
    if (err instanceof Error && err.message?.includes('NEXT_NOT_FOUND')) throw err;
    if (err instanceof Error && (err as any).digest?.startsWith('NEXT_')) throw err;
    return ReportLoadError(slug, err) as unknown as JSX.Element;
  }
}

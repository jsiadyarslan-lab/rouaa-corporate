'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { lessons, financialTerms, academyCategories } from '@/data/mock-data';
import type { TermItem } from '@/data/mock-data';
import {
  translateAcademyCategory,
  translateLessonDuration,
  translateLessonTitle,
  translateTermFull,
  translateTermDescription,
} from '@/data/mock-data';

const LOCALE = 'es' as const;

/* ── Mapa de categorías de términos ── */
const TERM_CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'fed', label: 'Fed' },
  { id: 'macro', label: 'Macro' },
  { id: 'forex', label: 'Divisas' },
  { id: 'market', label: 'Mercados' },
  { id: 'technical', label: 'Técnico' },
  { id: 'fundamental', label: 'Fundamental' },
  { id: 'risk', label: 'Riesgo' },
];

/* ── Tabla de impacto para los términos ── */
const TERM_IMPACTS: Record<string, { pair: string; level: 'high' | 'medium' | 'low'; direction: string }[]> = {
  NFP: [
    { pair: 'EUR/USD', level: 'high', direction: 'Inverso al USD' },
    { pair: 'GBP/USD', level: 'high', direction: 'Inverso al USD' },
    { pair: 'USD/JPY', level: 'high', direction: 'Directo con USD' },
    { pair: 'XAU/USD', level: 'high', direction: 'Inverso al USD' },
  ],
  CPI: [
    { pair: 'EUR/USD', level: 'high', direction: 'Inverso al USD' },
    { pair: 'USD/JPY', level: 'high', direction: 'Directo con USD' },
    { pair: 'XAU/USD', level: 'medium', direction: 'Directo con la inflación' },
  ],
  FOMC: [
    { pair: 'EUR/USD', level: 'high', direction: 'Inverso al USD' },
    { pair: 'USD/JPY', level: 'high', direction: 'Directo con USD' },
    { pair: 'XAU/USD', level: 'high', direction: 'Inverso al USD' },
    { pair: 'SPX', level: 'high', direction: 'Depende del tono' },
  ],
  GDP: [
    { pair: 'EUR/USD', level: 'medium', direction: 'Inverso al USD' },
    { pair: 'USD/JPY', level: 'medium', direction: 'Directo con USD' },
  ],
  DXY: [
    { pair: 'EUR/USD', level: 'high', direction: 'Inverso' },
    { pair: 'XAU/USD', level: 'high', direction: 'Inverso' },
    { pair: 'USD/JPY', level: 'high', direction: 'Directo' },
  ],
  PMI: [
    { pair: 'EUR/USD', level: 'medium', direction: 'Depende de los datos' },
    { pair: 'USD/JPY', level: 'medium', direction: 'Depende de los datos' },
  ],
  VIX: [
    { pair: 'SPX', level: 'high', direction: 'Inverso' },
    { pair: 'USD/JPY', level: 'medium', direction: 'Inverso' },
    { pair: 'XAU/USD', level: 'medium', direction: 'Directo' },
  ],
};

/* ── Insignia de nivel ── */
function levelBadge(level: string) {
  if (level === 'مبتدئ') return { bg: 'var(--bull2)', color: 'var(--bull)', label: 'Principiante' };
  if (level === 'متوسط') return { bg: 'var(--gold2)', color: 'var(--gold)', label: 'Intermedio' };
  return { bg: 'var(--bear2)', color: 'var(--bear)', label: 'Avanzado' };
}

/* ── Color de categoría ── */
function categoryColor(cat: string) {
  switch (cat) {
    case 'fed': return '#FF4444';
    case 'macro': return '#FFB800';
    case 'forex': return '#00E5FF';
    case 'market': return '#4CAF50';
    case 'technical': return '#7B5EA7';
    case 'fundamental': return '#FF8C00';
    case 'risk': return '#FF4444';
    default: return '#00E5FF';
  }
}

function categoryLabel(cat: string) {
  const found = TERM_CATEGORIES.find(c => c.id === cat);
  return found ? found.label : cat;
}

/* ── Insignia de nivel de impacto ── */
function impactBadge(level: 'high' | 'medium' | 'low') {
  if (level === 'high') return { color: '#FF4444', label: 'Alto' };
  if (level === 'medium') return { color: '#FFB800', label: 'Medio' };
  return { color: '#4CAF50', label: 'Bajo' };
}

/* ═══════════════════════════════════════════════════════════════════════
   EsAcademyPageClient
   ═══════════════════════════════════════════════════════════════════════ */
export default function EsAcademyPageClient() {
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [mounted, setMounted] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<TermItem | null>(null);
  const [termSearch, setTermSearch] = useState('');
  const [termCategoryFilter, setTermCategoryFilter] = useState('all');

  useEffect(() => {
    window.scrollTo(0, 0);
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('completedLessons');
      if (saved) setCompletedLessons(JSON.parse(saved));
    } catch { /* silencioso */ }
  }, []);

  const progressPercent = lessons.length > 0 ? Math.round((completedLessons.length / lessons.length) * 100) : 0;

  // Término del día
  const dayIndex = mounted && financialTerms.length > 0 ? Math.floor(Date.now() / 86400000) % financialTerms.length : 0;
  const todaysTerm = financialTerms.length > 0 ? financialTerms[dayIndex] : { term: '—', full: 'Sin datos', description: 'No hay términos financieros disponibles en este momento', category: '' };

  // Filtrar lecciones
  const filteredLessons =
    selectedCategory === 'all'
      ? lessons
      : lessons.filter((l) => l.category === selectedCategory);

  // Filtrar términos
  const filteredTerms = financialTerms.filter((t) => {
    const matchSearch = termSearch === '' || t.term.toLowerCase().includes(termSearch.toLowerCase()) || t.full.includes(termSearch);
    const matchCat = termCategoryFilter === 'all' || t.category === termCategoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <main className="min-h-screen pb-mobile-safe" dir="ltr" style={{ background: 'var(--bg)' }}>

      <div className="pt-4">
        {/* ── Encabezado de página ── */}
        <div className="max-w-[1280px] mx-auto px-4 mb-2" style={{ paddingInline: 'var(--space-md)' }}>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-heading text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-head)' }}>
              Academia Financiera
            </h1>
            <span className="badge-ai">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
              </svg>
              Aprender
            </span>
          </div>
          <p className="text-[14px] max-w-[600px]" style={{ color: 'var(--text-2)' }}>
            Rutas de aprendizaje integrales para entender los mercados financieros y desarrollar tus habilidades de trading e inversión
          </p>
        </div>

        {/* ════════════════════════════════════════════════════════════
           TÉRMINOS FINANCIEROS — Barra lateral interactiva + Detalle
           ════════════════════════════════════════════════════════════ */}
        <section className="section-block" aria-label="Términos financieros" role="region">
          <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            <div className="sh">
              <div className="sh-title">Términos Financieros</div>
              <span className="text-[11px] font-mono-price" style={{ color: 'var(--text-3)' }}>
                {financialTerms.length} términos
              </span>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              {/* ── Barra lateral: Búsqueda + Categoría + Lista ── */}
              <div className="md:w-[280px] flex-shrink-0">
                {/* Búsqueda */}
                <div className="glass-card p-3 mb-3">
                  <div className="relative">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" className="absolute start-3 top-1/2 -translate-y-1/2">
                      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Buscar un término..."
                      value={termSearch}
                      onChange={(e) => setTermSearch(e.target.value)}
                      className="w-full text-[13px] py-2 ps-9 pe-3 rounded-lg outline-none"
                      style={{ background: 'var(--bg4)', border: '1px solid var(--rim)', color: 'var(--text-1)' }}
                    />
                  </div>
                </div>

                {/* Pestañas de categoría */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {TERM_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setTermCategoryFilter(cat.id)}
                      className="text-[10px] px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer"
                      style={{
                        background: termCategoryFilter === cat.id ? 'var(--cyan2)' : 'var(--bg4)',
                        color: termCategoryFilter === cat.id ? 'var(--cyan)' : 'var(--text-3)',
                        border: termCategoryFilter === cat.id ? '1px solid rgba(0,229,255,0.25)' : '1px solid var(--rim)',
                        fontWeight: termCategoryFilter === cat.id ? 600 : 400,
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Lista de términos */}
                <div className="glass-card max-h-[500px] overflow-y-auto custom-scrollbar">
                  {filteredTerms.length === 0 ? (
                    <div className="p-4 text-center">
                      <span className="text-[12px]" style={{ color: 'var(--text-3)' }}>No se encontraron resultados</span>
                    </div>
                  ) : (
                    filteredTerms.map((term) => {
                      const isSelected = selectedTerm?.term === term.term;
                      const catColor = categoryColor(term.category);
                      return (
                        <button
                          key={term.term}
                          onClick={() => setSelectedTerm(term)}
                          className="w-full flex items-center gap-3 p-3 text-left transition-all duration-200 cursor-pointer"
                          style={{
                            background: isSelected ? `${catColor}10` : 'transparent',
                            borderLeft: isSelected ? `3px solid ${catColor}` : '3px solid transparent',
                            borderBottom: '1px solid var(--rim)',
                          }}
                        >
                          <div
                            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold font-mono-price"
                            style={{ background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}25` }}
                          >
                            {term.term.slice(0, 3)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold truncate" style={{ color: isSelected ? catColor : 'var(--text-1)' }}>
                              {term.term}
                            </div>
                            <div className="text-[10px] truncate" style={{ color: 'var(--text-3)' }}>
                              {translateTermFull(term.term, term.full, LOCALE)}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ── Panel principal: Detalle del término ── */}
              <div className="flex-1 min-w-0">
                {selectedTerm ? (
                  <div className="glass-card-elevated p-6 relative overflow-hidden" style={{ borderTop: `3px solid ${categoryColor(selectedTerm.category)}` }}>
                    <div className="absolute top-0 left-0 right-0 h-[120px]" style={{ background: `radial-gradient(ellipse at 50% -20%, ${categoryColor(selectedTerm.category)}10, transparent)` }} />
                    <div className="relative z-10">
                      {/* Encabezado */}
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="text-3xl font-bold font-mono-price px-4 py-2 rounded-xl"
                          style={{ color: categoryColor(selectedTerm.category), border: `2px solid ${categoryColor(selectedTerm.category)}40`, background: `${categoryColor(selectedTerm.category)}10` }}
                        >
                          {selectedTerm.term}
                        </div>
                        <span
                          className="text-[11px] px-3 py-1 rounded-full font-medium"
                          style={{ background: `${categoryColor(selectedTerm.category)}18`, color: categoryColor(selectedTerm.category), border: `1px solid ${categoryColor(selectedTerm.category)}25` }}
                        >
                          {categoryLabel(selectedTerm.category)}
                        </span>
                      </div>

                      {/* Nombre completo */}
                      <h2 className="text-[18px] font-bold mb-4" style={{ color: 'var(--text-1)' }}>
                        {translateTermFull(selectedTerm.term, selectedTerm.full, LOCALE)}
                      </h2>

                      {/* Definición */}
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                          </svg>
                          <h3 className="text-[14px] font-bold" style={{ color: 'var(--text-1)' }}>Definición</h3>
                        </div>
                        <p className="text-[14px] leading-[2]" style={{ color: 'var(--text-2)' }}>
                          {translateTermDescription(selectedTerm.term, selectedTerm.description, LOCALE)}
                        </p>
                      </div>

                      {/* Análisis IA del mercado */}
                      <div className="p-4 rounded-xl mb-6 relative overflow-hidden" style={{ background: 'rgba(124,111,205,0.08)', border: '1px solid rgba(124,111,205,0.2)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[16px]">🧠</span>
                          <span className="text-[12px] font-bold" style={{ color: 'var(--purple)' }}>Análisis IA del Mercado</span>
                        </div>
                        <p className="text-[12px] leading-[1.9]" style={{ color: 'var(--text-2)' }}>
                          {selectedTerm.term === 'NFP' && 'Los datos de empleo no agrícola son el principal impulsor mensual del dólar estadounidense. Cuando el número supera las expectativas en más de 50.000 empleos, el EUR/USD se mueve un promedio de 60-80 pips en la primera hora. También vigila los salarios promedio que pueden tener un impacto más fuerte que el propio número de empleo.'}
                          {selectedTerm.term === 'CPI' && 'El Índice de Precios al Consumidor es la principal medida de inflación de los bancos centrales. Un IPC por encima de las expectativas aumenta la probabilidad de subidas de tipos, lo que fortalece la moneda. El impacto más fuerte se da en el dólar y el euro, con reacciones directas en el oro y las acciones.'}
                          {selectedTerm.term === 'FOMC' && 'Las decisiones del FOMC determinan la trayectoria del dólar para las próximas semanas. La declaración adjunta y la conferencia de prensa de Powell son más importantes que la propia decisión. Palabras como "paciente" o "dependiente de los datos" cambian las expectativas de tipos y mueven los mercados significativamente.'}
                          {selectedTerm.term === 'GDP' && 'El Producto Interior Bruto ofrece una imagen completa de la salud económica. Un crecimiento del PIB superior a las expectativas apoya la moneda, pero el impacto es más lento que el del NFP y el IPC porque los datos son retrospectivos.'}
                          {selectedTerm.term === 'DXY' && 'El Índice del Dólar se mueve de forma inversa a la mayoría de materias primas y divisas. Un DXY por encima de 105 presiona al oro y a los mercados emergentes, mientras que por debajo de 100 abre la puerta a rallies de riesgo.'}
                          {selectedTerm.term === 'PMI' && 'El PMI es un indicador adelantado que precede a los datos oficiales en 2-3 meses. Una lectura inferior a 45 señala recesión, y superior a 55 indica un crecimiento fuerte. Su impacto en el EUR/USD suele ser de 20-30 pips.'}
                          {selectedTerm.term === 'VIX' && 'Un VIX por encima de 30 indica un miedo extremo y puede señalar un suelo cercano. Por debajo de 15 indica una complacencia que puede preceder a una corrección. Úsalo como indicador de sentimiento contrario: compra cuando haya miedo, vende cuando haya complacencia.'}
                          {selectedTerm.term === 'RSI' && 'La divergencia del RSI es una de las señales de trading más fuertes. Cuando el RSI contradice la dirección del precio, la probabilidad de reversión alcanza el 70% en el marco temporal diario. Mejor utilizado con niveles de soporte/resistencia.'}
                          {selectedTerm.term === 'MACD' && 'Los cruces del MACD en el marco temporal semanal son más fiables que los diarios. El histograma da una advertencia temprana 2-3 velas antes del cruce, permitiendo entradas anticipadas con stop-loss más ajustados.'}
                          {!['NFP','CPI','FOMC','GDP','DXY','PMI','VIX','RSI','MACD'].includes(selectedTerm.term) && `Entender ${selectedTerm.full} es esencial para cualquier trader. Este término afecta las decisiones de trading diarias y el análisis de mercado. Sigue nuestro análisis IA para obtener insights en tiempo real sobre su impacto en los principales pares.`}
                        </p>
                      </div>

                      {/* Tabla de impacto */}
                      {TERM_IMPACTS[selectedTerm.term] && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
                            </svg>
                            <h3 className="text-[14px] font-bold" style={{ color: 'var(--text-1)' }}>Impacto en los pares</h3>
                          </div>
                          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--rim)' }}>
                            <table className="w-full text-[12px]">
                              <thead>
                                <tr style={{ background: 'var(--bg4)' }}>
                                  <th className="p-2.5 text-left font-semibold" style={{ color: 'var(--text-2)' }}>Par</th>
                                  <th className="p-2.5 text-center font-semibold" style={{ color: 'var(--text-2)' }}>Nivel de impacto</th>
                                  <th className="p-2.5 text-left font-semibold" style={{ color: 'var(--text-2)' }}>Dirección</th>
                                </tr>
                              </thead>
                              <tbody>
                                {TERM_IMPACTS[selectedTerm.term].map((imp, i) => {
                                  const ib = impactBadge(imp.level);
                                  return (
                                    <tr key={i} style={{ borderBottom: i < TERM_IMPACTS[selectedTerm.term].length - 1 ? '1px solid var(--rim)' : 'none' }}>
                                      <td className="p-2.5 font-mono-price font-semibold" style={{ color: 'var(--cyan)' }}>{imp.pair}</td>
                                      <td className="p-2.5 text-center">
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium inline-block" style={{ background: `${ib.color}18`, color: ib.color }}>
                                          {ib.label}
                                        </span>
                                      </td>
                                      <td className="p-2.5" style={{ color: 'var(--text-2)' }}>{imp.direction}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="glass-card p-10 text-center flex flex-col items-center justify-center min-h-[400px]">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5" className="mb-4 opacity-40">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
                    </svg>
                    <p className="text-[14px]" style={{ color: 'var(--text-3)' }}>Selecciona un término de la lista para ver su explicación</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
           FILTROS POR CATEGORÍA
           ════════════════════════════════════════════════════════════ */}
        <section className="section-block" aria-label="Explorar por categoría" role="region">
          <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            <div className="sh">
              <div className="sh-title">Explorar por categoría</div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {academyCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className="glass-card p-3 text-center transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
                  style={{
                    borderTop: selectedCategory === cat.name ? `2px solid ${cat.color}` : '2px solid transparent',
                    background: selectedCategory === cat.name ? `${cat.color}08` : undefined,
                  }}
                >
                  <div
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mb-1.5"
                    style={{ background: `${cat.color}18`, color: cat.color }}
                  >
                    {cat.icon}
                  </div>
                  <div className="text-[12px] font-medium block" style={{ color: selectedCategory === cat.name ? cat.color : 'var(--text-2)' }}>
                    {translateAcademyCategory(cat.name, LOCALE)}
                  </div>
                  <div className="text-[10px] font-mono-price" style={{ color: 'var(--text-3)' }}>
                    {cat.count} lecciones
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
           BARRA DE PROGRESO GENERAL
           ════════════════════════════════════════════════════════════ */}
        <section className="section-block" aria-label="Tu progreso" role="region">
          <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px]" style={{ color: 'var(--text-2)' }}>Tu progreso en la Academia</span>
                <span className="font-mono-price text-[13px] font-medium" style={{ color: 'var(--cyan)' }}>
                  {completedLessons.length} / {lessons.length} lecciones
                </span>
              </div>
              <div className="progress-bar" style={{ height: '8px' }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${progressPercent}%`,
                    background: 'linear-gradient(90deg, var(--cyan), var(--purple))',
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
           LISTA DE LECCIONES
           ════════════════════════════════════════════════════════════ */}
        <section className="section-block" aria-label="Lecciones educativas" role="region">
          <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            <div className="sh">
              <div className="sh-title">Lecciones Educativas</div>
              <span className="text-[11px] font-mono-price" style={{ color: 'var(--text-3)' }}>
                {filteredLessons.length} lecciones
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredLessons.map((lesson) => {
                const isCompleted = completedLessons.includes(lesson.id);
                const lb = levelBadge(lesson.level);
                const catObj = academyCategories.find(c => c.name === lesson.category);
                const catColor = catObj?.color || 'var(--cyan)';
                return (
                  <Link key={lesson.id} href={`/es/academy/lesson/${lesson.id}`} className="block">
                    <div className="glass-card p-4 relative group cursor-pointer transition-all duration-300 hover:-translate-y-1">
                      {/* Marca de completado */}
                      {isCompleted && (
                        <div
                          className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: 'var(--bull)' }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20,6 9,17 4,12" />
                          </svg>
                        </div>
                      )}

                      {/* Insignia de nivel + duración */}
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: lb.bg, color: lb.color }}
                        >
                          {lb.label}
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>{translateLessonDuration(lesson.duration, LOCALE)}</span>
                      </div>

                      <h3 className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text-1)' }}>{translateLessonTitle(lesson.id, lesson.title, LOCALE)}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${catColor}15`, color: catColor }}>{translateAcademyCategory(lesson.category, LOCALE)}</span>

                      {/* Superposición al pasar el ratón */}
                      <div
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        style={{
                          background: 'rgba(10,14,26,0.8)',
                          backdropFilter: 'blur(4px)',
                          borderRadius: 'var(--card-radius)',
                        }}
                      >
                        <span className="text-[12px] font-medium flex items-center gap-1" style={{ color: 'var(--cyan)' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                          </svg>
                          Leer lección
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
           CONSEJOS DE ORO
           ════════════════════════════════════════════════════════════ */}
        <section className="section-block" aria-label="Consejos de oro" role="region">
          <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            <div className="sh">
              <div className="sh-title">Consejos de Oro</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { id: 1, title: 'Nunca operes dinero que no puedas permitirte perder', description: 'Regla de oro: solo invierte lo que puedes permitirte perder completamente', icon: '🛡️' },
                { id: 2, title: 'Usa siempre órdenes de stop-loss', description: 'Proteger tu capital es más importante que obtener beneficios', icon: '🛑' },
                { id: 3, title: 'Opera a favor de la tendencia', description: 'La tendencia es tu aliada — no luches contra el mercado', icon: '📈' },
                { id: 4, title: 'Lleva un diario de trading', description: 'Registra tus operaciones y errores para aprender de cada experiencia', icon: '📝' },
                { id: 5, title: 'Evita el trading emocional', description: 'No entres en una operación por venganza o codicia para recuperar pérdidas', icon: '🧠' },
                { id: 6, title: 'Diversifica tu cartera', description: 'No pongas todo tu dinero en un solo activo o sector', icon: '⚖️' },
              ].map((tip) => (
                <div key={tip.id} className="glass-card p-4 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0 mt-0.5">{tip.icon}</span>
                    <div>
                      <h4 className="text-[13px] font-bold mb-1" style={{ color: 'var(--text-1)' }}>{tip.title}</h4>
                      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-2)' }}>{tip.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

    </main>
  );
}

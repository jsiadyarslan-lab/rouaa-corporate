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

const LOCALE = 'fr' as const;

/* ── Catégories de termes ── */
const TERM_CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'fed', label: 'Fed' },
  { id: 'macro', label: 'Macro' },
  { id: 'forex', label: 'Devises' },
  { id: 'market', label: 'Marchés' },
  { id: 'technical', label: 'Technique' },
  { id: 'fundamental', label: 'Fondamental' },
  { id: 'risk', label: 'Risque' },
];

/* ── Tableau d'impact pour les termes ── */
const TERM_IMPACTS: Record<string, { pair: string; level: 'high' | 'medium' | 'low'; direction: string }[]> = {
  NFP: [
    { pair: 'EUR/USD', level: 'high', direction: 'Inverse au USD' },
    { pair: 'GBP/USD', level: 'high', direction: 'Inverse au USD' },
    { pair: 'USD/JPY', level: 'high', direction: 'Direct avec USD' },
    { pair: 'XAU/USD', level: 'high', direction: 'Inverse au USD' },
  ],
  CPI: [
    { pair: 'EUR/USD', level: 'high', direction: 'Inverse au USD' },
    { pair: 'USD/JPY', level: 'high', direction: 'Direct avec USD' },
    { pair: 'XAU/USD', level: 'medium', direction: 'Direct avec l\'inflation' },
  ],
  FOMC: [
    { pair: 'EUR/USD', level: 'high', direction: 'Inverse au USD' },
    { pair: 'USD/JPY', level: 'high', direction: 'Direct avec USD' },
    { pair: 'XAU/USD', level: 'high', direction: 'Inverse au USD' },
    { pair: 'SPX', level: 'high', direction: 'Dépend du ton' },
  ],
  GDP: [
    { pair: 'EUR/USD', level: 'medium', direction: 'Inverse au USD' },
    { pair: 'USD/JPY', level: 'medium', direction: 'Direct avec USD' },
  ],
  DXY: [
    { pair: 'EUR/USD', level: 'high', direction: 'Inverse' },
    { pair: 'XAU/USD', level: 'high', direction: 'Inverse' },
    { pair: 'USD/JPY', level: 'high', direction: 'Direct' },
  ],
  PMI: [
    { pair: 'EUR/USD', level: 'medium', direction: 'Dépend des données' },
    { pair: 'USD/JPY', level: 'medium', direction: 'Dépend des données' },
  ],
  VIX: [
    { pair: 'SPX', level: 'high', direction: 'Inverse' },
    { pair: 'USD/JPY', level: 'medium', direction: 'Inverse' },
    { pair: 'XAU/USD', level: 'medium', direction: 'Direct' },
  ],
};

/* ── Badge de niveau ── */
function levelBadge(level: string) {
  if (level === 'مبتدئ') return { bg: 'var(--bull2)', color: 'var(--bull)', label: 'Débutant' };
  if (level === 'متوسط') return { bg: 'var(--gold2)', color: 'var(--gold)', label: 'Intermédiaire' };
  return { bg: 'var(--bear2)', color: 'var(--bear)', label: 'Avancé' };
}

/* ── Couleur de catégorie ── */
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

/* ── Badge de niveau d'impact ── */
function impactBadge(level: 'high' | 'medium' | 'low') {
  if (level === 'high') return { color: '#FF4444', label: 'Élevé' };
  if (level === 'medium') return { color: '#FFB800', label: 'Moyen' };
  return { color: '#4CAF50', label: 'Faible' };
}

/* ═══════════════════════════════════════════════════════════════════════
   FrAcademyPageClient
   ═══════════════════════════════════════════════════════════════════════ */
export default function FrAcademyPageClient() {
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
    } catch { /* silencieux */ }
  }, []);

  const progressPercent = lessons.length > 0 ? Math.round((completedLessons.length / lessons.length) * 100) : 0;

  // Terme du jour
  const dayIndex = mounted && financialTerms.length > 0 ? Math.floor(Date.now() / 86400000) % financialTerms.length : 0;
  const todaysTerm = financialTerms.length > 0 ? financialTerms[dayIndex] : { term: '—', full: 'Aucune donnée', description: 'Aucun terme financier disponible pour le moment', category: '' };

  // Filtrer les leçons
  const filteredLessons =
    selectedCategory === 'all'
      ? lessons
      : lessons.filter((l) => l.category === selectedCategory);

  // Filtrer les termes
  const filteredTerms = financialTerms.filter((t) => {
    const matchSearch = termSearch === '' || t.term.toLowerCase().includes(termSearch.toLowerCase()) || t.full.includes(termSearch);
    const matchCat = termCategoryFilter === 'all' || t.category === termCategoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <main className="min-h-screen pb-mobile-safe" dir="ltr" style={{ background: 'var(--bg)' }}>

      <div className="pt-4">
        {/* ── En-tête de page ── */}
        <div className="max-w-[1280px] mx-auto px-4 mb-2" style={{ paddingInline: 'var(--space-md)' }}>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-heading text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-head)' }}>
              Académie financière
            </h1>
            <span className="badge-ai">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
              </svg>
              Apprendre
            </span>
          </div>
          <p className="text-[14px] max-w-[600px]" style={{ color: 'var(--text-2)' }}>
            Parcours d&apos;apprentissage complets pour comprendre les marchés financiers et développer vos compétences en trading et investissement
          </p>
        </div>

        {/* ════════════════════════════════════════════════════════════
           TERMES FINANCIERS — Barre latérale interactive + Détail
           ════════════════════════════════════════════════════════════ */}
        <section className="section-block" aria-label="Termes financiers" role="region">
          <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            <div className="sh">
              <div className="sh-title">Termes financiers</div>
              <span className="text-[11px] font-mono-price" style={{ color: 'var(--text-3)' }}>
                {financialTerms.length} termes
              </span>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              {/* ── Barre latérale : Recherche + Catégorie + Liste ── */}
              <div className="md:w-[280px] flex-shrink-0">
                {/* Recherche */}
                <div className="glass-card p-3 mb-3">
                  <div className="relative">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" className="absolute start-3 top-1/2 -translate-y-1/2">
                      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Rechercher un terme..."
                      value={termSearch}
                      onChange={(e) => setTermSearch(e.target.value)}
                      className="w-full text-[13px] py-2 ps-9 pe-3 rounded-lg outline-none"
                      style={{ background: 'var(--bg4)', border: '1px solid var(--rim)', color: 'var(--text-1)' }}
                    />
                  </div>
                </div>

                {/* Onglets de catégorie */}
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

                {/* Liste des termes */}
                <div className="glass-card max-h-[500px] overflow-y-auto custom-scrollbar">
                  {filteredTerms.length === 0 ? (
                    <div className="p-4 text-center">
                      <span className="text-[12px]" style={{ color: 'var(--text-3)' }}>Aucun résultat trouvé</span>
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

              {/* ── Panneau principal : Détail du terme ── */}
              <div className="flex-1 min-w-0">
                {selectedTerm ? (
                  <div className="glass-card-elevated p-6 relative overflow-hidden" style={{ borderTop: `3px solid ${categoryColor(selectedTerm.category)}` }}>
                    <div className="absolute top-0 left-0 right-0 h-[120px]" style={{ background: `radial-gradient(ellipse at 50% -20%, ${categoryColor(selectedTerm.category)}10, transparent)` }} />
                    <div className="relative z-10">
                      {/* En-tête */}
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

                      {/* Nom complet */}
                      <h2 className="text-[18px] font-bold mb-4" style={{ color: 'var(--text-1)' }}>
                        {translateTermFull(selectedTerm.term, selectedTerm.full, LOCALE)}
                      </h2>

                      {/* Définition */}
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                          </svg>
                          <h3 className="text-[14px] font-bold" style={{ color: 'var(--text-1)' }}>Définition</h3>
                        </div>
                        <p className="text-[14px] leading-[2]" style={{ color: 'var(--text-2)' }}>
                          {translateTermDescription(selectedTerm.term, selectedTerm.description, LOCALE)}
                        </p>
                      </div>

                      {/* Analyse IA du marché */}
                      <div className="p-4 rounded-xl mb-6 relative overflow-hidden" style={{ background: 'rgba(124,111,205,0.08)', border: '1px solid rgba(124,111,205,0.2)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[16px]">🧠</span>
                          <span className="text-[12px] font-bold" style={{ color: 'var(--purple)' }}>Analyse IA du marché</span>
                        </div>
                        <p className="text-[12px] leading-[1.9]" style={{ color: 'var(--text-2)' }}>
                          {selectedTerm.term === 'NFP' && 'Les données sur les emplois non agricoles sont le principal moteur mensuel du dollar américain. Lorsque le nombre dépasse les attentes de plus de 50 000 emplois, l\'EUR/USD se déplace en moyenne de 60 à 80 pips dans la première heure. Surveillez également les salaires moyens qui peuvent avoir un impact plus fort que le chiffre de l\'emploi lui-même.'}
                          {selectedTerm.term === 'CPI' && 'L\'Indice des prix à la consommation est la principale mesure de l\'inflation des banques centrales. Un IPC au-dessus des attentes augmente la probabilité de hausses de taux, ce qui renforce la devise. L\'impact le plus fort est sur le dollar et l\'euro, avec des réactions directes sur l\'or et les actions.'}
                          {selectedTerm.term === 'FOMC' && 'Les décisions du FOMC déterminent la trajectoire du dollar pour les semaines à venir. La déclaration accompagnatrice et la conférence de presse de Powell sont plus importantes que la décision elle-même. Des mots comme "patient" ou "dépendant des données" modifient les attentes de taux et déplacent les marchés de manière significative.'}
                          {selectedTerm.term === 'GDP' && 'Le Produit intérieur brut donne une image complète de la santé économique. Une croissance du PIB supérieure aux attentes soutient la devise, mais l\'impact est plus lent que celui de l\'NFP et de l\'IPC car les données sont rétrospectives.'}
                          {selectedTerm.term === 'DXY' && 'L\'indice du dollar évolue de manière inverse à la plupart des matières premières et devises. Un DXY au-dessus de 105 met la pression sur l\'or et les marchés émergents, tandis qu\'en dessous de 100, la porte s\'ouvre pour des rallyes risk-on.'}
                          {selectedTerm.term === 'PMI' && 'Le PMI est un indicateur avancé qui précède les données officielles de 2 à 3 mois. Une lecture inférieure à 45 signale une récession, et supérieure à 55 indique une croissance forte. Son impact sur l\'EUR/USD est typiquement de 20 à 30 pips.'}
                          {selectedTerm.term === 'VIX' && 'Un VIX au-dessus de 30 indique une peur extrême et peut signaler un proche creux. En dessous de 15, il indique une complaisance qui peut précéder une correction. Utilisez-le comme un indicateur de sentiment contrariant : achetez quand la peur est forte, vendez quand la complaisance règne.'}
                          {selectedTerm.term === 'RSI' && 'La divergence du RSI est l\'un des signaux de trading les plus forts. Lorsque le RSI contredit la direction des prix, la probabilité de renversement atteint 70 % sur le cadre temporel quotidien. Mieux utilisé avec les niveaux de support/résistance.'}
                          {selectedTerm.term === 'MACD' && 'Les croisements du MACD sur le cadre temporel hebdomadaire sont plus fiables que le quotidien. L\'histogramme donne un avertissement précoce 2 à 3 bougies avant le croisement, permettant des entrées anticipées avec des stop-loss plus serrés.'}
                          {!['NFP','CPI','FOMC','GDP','DXY','PMI','VIX','RSI','MACD'].includes(selectedTerm.term) && `Comprendre ${selectedTerm.full} est essentiel pour tout trader. Ce terme affecte les décisions de trading quotidiennes et l'analyse de marché. Suivez notre analyse IA pour des insights en temps réel sur son impact sur les principales paires.`}
                        </p>
                      </div>

                      {/* Tableau d'impact */}
                      {TERM_IMPACTS[selectedTerm.term] && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
                            </svg>
                            <h3 className="text-[14px] font-bold" style={{ color: 'var(--text-1)' }}>Impact sur les paires</h3>
                          </div>
                          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--rim)' }}>
                            <table className="w-full text-[12px]">
                              <thead>
                                <tr style={{ background: 'var(--bg4)' }}>
                                  <th className="p-2.5 text-left font-semibold" style={{ color: 'var(--text-2)' }}>Paire</th>
                                  <th className="p-2.5 text-center font-semibold" style={{ color: 'var(--text-2)' }}>Niveau d&apos;impact</th>
                                  <th className="p-2.5 text-left font-semibold" style={{ color: 'var(--text-2)' }}>Direction</th>
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
                    <p className="text-[14px]" style={{ color: 'var(--text-3)' }}>Sélectionnez un terme dans la liste pour voir son explication</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
           FILTRES PAR CATÉGORIE
           ════════════════════════════════════════════════════════════ */}
        <section className="section-block" aria-label="Parcourir par catégorie" role="region">
          <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            <div className="sh">
              <div className="sh-title">Parcourir par catégorie</div>
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
                    {cat.count} leçons
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
           BARRE DE PROGRESSION GÉNÉRALE
           ════════════════════════════════════════════════════════════ */}
        <section className="section-block" aria-label="Votre progression" role="region">
          <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px]" style={{ color: 'var(--text-2)' }}>Votre progression à l&apos;académie</span>
                <span className="font-mono-price text-[13px] font-medium" style={{ color: 'var(--cyan)' }}>
                  {completedLessons.length} / {lessons.length} leçons
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
           LISTE DES LEÇONS
           ════════════════════════════════════════════════════════════ */}
        <section className="section-block" aria-label="Leçons éducatives" role="region">
          <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            <div className="sh">
              <div className="sh-title">Leçons éducatives</div>
              <span className="text-[11px] font-mono-price" style={{ color: 'var(--text-3)' }}>
                {filteredLessons.length} leçons
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredLessons.map((lesson) => {
                const isCompleted = completedLessons.includes(lesson.id);
                const lb = levelBadge(lesson.level);
                const catObj = academyCategories.find(c => c.name === lesson.category);
                const catColor = catObj?.color || 'var(--cyan)';
                return (
                  <Link key={lesson.id} href={`/fr/academy/lesson/${lesson.id}`} className="block">
                    <div className="glass-card p-4 relative group cursor-pointer transition-all duration-300 hover:-translate-y-1">
                      {/* Coche terminée */}
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

                      {/* Badge de niveau + durée */}
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

                      {/* Superposition au survol */}
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
                          Lire la leçon
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
           CONSEILS D'OR
           ════════════════════════════════════════════════════════════ */}
        <section className="section-block" aria-label="Conseils d'or" role="region">
          <div className="max-w-[1200px] mx-auto px-4" style={{ paddingInline: 'var(--space-md)' }}>
            <div className="sh">
              <div className="sh-title">Conseils d&apos;or</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { id: 1, title: 'Ne tradez jamais l\'argent que vous ne pouvez pas perdre', description: 'Règle d\'or : n\'investissez que ce que vous pouvez vous permettre de perdre entièrement', icon: '🛡️' },
                { id: 2, title: 'Utilisez toujours des ordres stop-loss', description: 'Protéger votre capital est plus important que de faire des profits', icon: '🛑' },
                { id: 3, title: 'Tradez dans le sens de la tendance', description: 'La tendance est votre alliée — ne luttez pas contre le marché', icon: '📈' },
                { id: 4, title: 'Tenez un journal de trading', description: 'Enregistrez vos trades et vos erreurs pour apprendre de chaque expérience', icon: '📝' },
                { id: 5, title: 'Évitez le trading émotionnel', description: 'N\'entrez pas dans un trade par vengeance ou par cupidité pour récupérer des pertes', icon: '🧠' },
                { id: 6, title: 'Diversifiez votre portefeuille', description: 'Ne mettez pas tout votre argent dans un seul actif ou secteur', icon: '⚖️' },
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

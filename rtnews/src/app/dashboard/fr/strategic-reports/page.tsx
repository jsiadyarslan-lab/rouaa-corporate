// ─── French Rapports stratégiques Dashboard ───────────────────────
// Same design but LTR, French UI, French options.
// Generates via /api/reports/generate with locale='fr', type='special'

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Shield, Sparkles, Globe, TrendingUp, TrendingDown, Minus,
  Eye, RefreshCw, Loader2, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronUp, Clock, BarChart3, MapPin,
  Layers, CalendarDays, FileText, Zap, ArrowLeft,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────
interface StrategicReport {
  id: string;
  title: string;
  slug: string;
  summary: string;
  scope: string;
  marketImpact: string;
  confidenceScore: number;
  isPublished: boolean;
  createdAt: string;
}

interface JobStatus {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration: number;
  result?: { id: string; title: string; slug: string; confidence: number; published: boolean };
  error?: string;
}

// ─── Constants ─────────────────────────────────────────────
const REGION_OPTIONS = [
  { value: 'Arab World & Middle East', label: 'Arab World & Middle East', icon: '🌍' },
  { value: 'Arabian Gulf', label: 'Arabian Gulf', icon: '🏜️' },
  { value: 'North Africa', label: 'North Africa', icon: '🌴' },
  { value: 'Global', label: 'Global', icon: '🌐' },
  { value: 'United States & Europe', label: 'United States & Europe', icon: '🏛️' },
  { value: 'Asia Pacific', label: 'Asia Pacific', icon: '🌏' },
];

const SECTOR_OPTIONS = [
  { value: 'Macroeconomics', label: 'Macroeconomics' },
  { value: 'Equities', label: 'Equities' },
  { value: 'Energy', label: 'Energy' },
  { value: 'Forex', label: 'Forex' },
  { value: 'Cryptocurrencies', label: 'Cryptocurrencies' },
  { value: 'Commodities', label: 'Commodities' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Central Banks', label: 'Central Banks' },
  { value: 'Corporate Earnings', label: 'Corporate Earnings' },
  { value: 'Arab Markets', label: 'Arab Markets' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Politics', label: 'Politics' },
];

const SCENARIO_OPTIONS = [
  { value: 'Court terme (1-3 mois)', label: 'Court terme (1-3 mois)' },
  { value: 'Moyen terme (6-12 mois)', label: 'Moyen terme (6-12 mois)' },
  { value: 'Long terme (1-3 ans)', label: 'Long terme (1-3 ans)' },
  { value: 'Immédiat (moins d\'1 mois)', label: 'Immédiat (moins d\'1 mois)' },
  { value: 'Cinq ans', label: 'Cinq ans' },
];

const TOPIC_PRESETS = [
  "Impact des guerres commerciales sur les marchés arabes",
  "Prévisions des prix du pétrole et leur impact sur les économies du Golfe",
  "L'avenir des cryptomonnaies dans la région arabe",
  "Impact des hausses de taux américains sur les marchés émergents",
  "Transition verte et opportunités d'investissement dans les énergies renouvelables",
  "Impact de l'IA sur le secteur des services financiers",
  "Sécurité alimentaire et investissement dans l'AgriTech",
  "Tourisme & Divertissement : Opportunités de croissance au Moyen-Orient",
];

// ─── Main Component ────────────────────────────────────────
export default function FrStrategicReportsPage() {
  // Form state
  const [topic, setSujet] = useState('');
  const [region, setRegion] = useState('Global');
  const [selectedSecteurs, setSelectedSecteurs] = useState<string[]>(['Macroeconomics']);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([
    'Court terme (1-3 mois)',
    'Moyen terme (6-12 mois)',
    'Long terme (1-3 ans)',
  ]);
  const [publishOnComplete, setPublishOnComplete] = useState(true);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);

  // Reports list
  const [reports, setReports] = useState<StrategicReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPresetSujets, setShowPresetSujets] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');

  // ─── Fetch Reports ────────────────────────────────────────
  const fetchReports = useCallback(async () => {
    try {
      // V316: Use isPublished=all to show drafts too
      const res = await fetch('/api/fr/reports?limit=50&isPublished=all');
      const data = await res.json();
      const items = data.reports || data.items || [];
      // Filter for strategic/special reports only (including drafts)
      const strategic = Array.isArray(items)
        ? items.filter((r: any) => r.reportType === 'special' || r.reportType === 'strategic')
        : [];
      setReports(strategic);
    } catch (err) {
      console.error('Échec du chargement des rapports stratégiques français :', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // ─── Toggle Sector ────────────────────────────────────────
  const toggleSector = (sector: string) => {
    setSelectedSecteurs(prev =>
      prev.includes(sector)
        ? prev.filter(s => s !== sector)
        : [...prev, sector]
    );
  };

  const toggleScenario = (scenario: string) => {
    setSelectedScenarios(prev =>
      prev.includes(scenario)
        ? prev.filter(s => s !== scenario)
        : [...prev, scenario]
    );
  };

  // ─── Construire le prompt stratégique français ──────────────────────
  const buildStrategicPrompt = (): string => {
    return `Rédigez un rapport d'analyse stratégique complet en français professionnel.
⚠️ Tout le contenu doit être en français — interdit d'utiliser l'anglais pour les titres de sections ou les scénarios.

Sujet : ${topic.trim()}
Portée géographique : ${region}
Secteurs : ${selectedSecteurs.join(', ')}
Horizons temporels : ${selectedScenarios.join(', ')}

Le rapport DOIT suivre cette structure exacte :

## 1. Résumé Exécutif
5 points numérotés — résultats analytiques quantitatifs clés : pourcentages, chiffres, comparaisons.
⚠️ Pas une reformulation de l'introduction — points quantitatifs spécifiques uniquement.

## 2. Introduction du Rapport
Paragraphe narratif bref (2-3 phrases seulement, 60 mots maximum) : Qui ? Quoi ? Pourquoi est-ce important maintenant ?
⚠️ Interdit : points numérotés — narratif uniquement.
⚠️ Maximum 60 mots — ne dépassez jamais.
⚠️ Commencez directement par l'information — pas de remplissage.

## 3. Contexte et Historique
- Importance stratégique avec des chiffres
- Précédents historiques le cas échéant
- Parties prenantes clés affectées

## 4. Implications Économiques Directes
Répartissez par les secteurs demandés uniquement.
Pour chaque secteur : Impact + Ampleur + Durée attendue.

## 5. Impact sur les Marchés Financiers
Mentionnez les indices et actifs par leurs noms réels et symboles.
Ne mentionnez des chiffres que s'ils sont fiables.

## 6. Scénarios
Pour chaque horizon temporel demandé, utilisez obligatoirement les titres en français ci-dessous — jamais en anglais :
### Court terme (1-3 mois)
- Hypothèses de base
- Impact attendu en pourcentage sur les actifs clés
- Facteurs de changement : ce qui pourrait modifier ce scénario

### Moyen terme (6-12 mois)
- Hypothèses de base
- Impact attendu en pourcentage sur les actifs clés
- Facteurs de changement : ce qui pourrait modifier ce scénario

### Long terme (1-3 ans)
- Hypothèses de base
- Impact attendu en pourcentage sur les actifs clés
- Facteurs de changement : ce qui pourrait modifier ce scénario

⚠️ Interdit : utiliser les titres en anglais "Short-term", "Medium-term", "Long-term" — utilisez uniquement les titres français ci-dessus.
⚠️ Interdit : utiliser "What Could Change This" — utilisez "Facteurs de changement" à la place.

## 7. Actifs Bénéficiant et Menacés
- Actifs bénéficiant : [Nom] [Symbole] [Raison]
- Actifs menacés : [Nom] [Symbole] [Raison]
- Niveaux de surveillance si données disponibles

## 8. Recommandations Stratégiques
Analyse académique objective — que disent les données ? Avec niveaux de prix de référence.
• Rédigé dans la voix de l'analyste neutre avec chiffres d'exécution
• Explique la logique et les raisons de manière détaillée
• Ne s'adresse pas directement au lecteur
• Organisé par : Particuliers / Institutions / Traders
• Chaque catégorie doit inclure : Direction + Actifs de référence + Niveau d'entrée approximatif + Objectif + Stop loss
• Exemple : "Le secteur de la défense devrait bénéficier — entrée de référence : 320 $ | Objectif : 350 $ | Stop : 305 $ | Horizon : 3 mois"
⚠️ Recommandations sans niveaux de prix = recommandations rejetées

## 9. Recommandations Rouaa
Décisions pratiques directes — que devez-vous faire maintenant ?

### Day Trader (horizon d'une semaine ou moins)
Transactions rapides avec niveaux d'entrée/sortie spécifiques.
Chaque recommandation DOIT inclure : prix d'entrée + stop loss + objectif + durée maximale

### Investisseur Moyen Terme (1-6 mois)
Plans d'investissement mensuels avec pourcentages d'allocation de portefeuille.
Chaque recommandation DOIT inclure : % du portefeuille + point d'entrée approximatif + horizon temporel en mois

### Investisseur Long Terme (6 mois ou plus)
Stratégies structurelles pour construire un portefeuille sur plusieurs années.
Chaque recommandation DOIT inclure : stratégie structurelle + poids du portefeuille + point de réévaluation

⚠️ Interdit : copier toute phrase entre les segments d'investisseurs — chaque segment doit contenir des actifs et recommandations uniques.

## 10. Indicateurs de Suivi
5 indicateurs spécifiques à surveiller après la publication de ce rapport. Pour chaque indicateur, fournissez obligatoirement :
- Nom de l'indicateur (concret et mesurable)
- Signification : pourquoi cet indicateur est important pour ce rapport
- Ce qu'il faut surveiller : seuils ou niveaux clés qui déclencheraient une mise à jour du rapport
- Fréquence de mise à jour recommandée

Format obligatoire pour chaque indicateur :
**[Nom de l'indicateur]**
- Signification : [pourquoi c'est pertinent]
- Seuil de surveillance : [niveau/valeur qui déclenche une alerte]
- Fréquence : [quotidien/hebdomadaire/mensuel]

⚠️ Chaque indicateur doit être concret et mesurable (ex : "Taux directeur de la BCE", "Prix du Brent", "Indice PMI manufacturier")
⚠️ Interdit : indicateurs vagues comme "évolution du marché" ou "sentiment des investisseurs"

## 11. Sources et Références
Chaque source citée avec la date. N'incluez pas les sources non réellement utilisées.

---
Avertissement : Ce rapport analytique est fourni à titre informatif uniquement.`;
  };

  // ─── Générer un rapport ──────────────────────────────────────
  const handleGenerate = async () => {
    if (!topic.trim() || topic.trim().length < 3) {
      toast.error('Entrez un sujet de rapport (at least 3 characters)');
      return;
    }
    if (selectedSecteurs.length === 0) {
      toast.error('Sélectionnez au moins un secteur');
      return;
    }
    if (selectedScenarios.length === 0) {
      toast.error('Sélectionnez au moins un horizon temporel');
      return;
    }

    setGenerating(true);
    setJobId(null);
    setJobStatus(null);

    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'strategic',
          locale: 'fr',
          force: true,
          async: true,
          publish: publishOnComplete,
          title: topic.trim(),
          prompt: buildStrategicPrompt(),
          // V316: Pass strategic report context for proper news filtering
          region: region,
          sectors: selectedSecteurs,
          scenarios: selectedScenarios,
        }),
      });

      const data = await res.json();
      if (data.success && data.jobId) {
        setJobId(data.jobId);
        toast.success('Génération du rapport stratégique lancée');
        pollJobStatus(data.jobId);
      } else {
        toast.error(data.error || 'Échec du démarrage de la génération');
        setGenerating(false);
      }
    } catch (err) {
      console.error('Generate error:', err);
      toast.error("Une erreur s'est produite lors de la demande de génération");
      setGenerating(false);
    }
  };

  // ─── Poll Job Status ─────────────────────────────────────
  const pollJobStatus = useCallback(async (jId: string) => {
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/reports/generate?jobId=${jId}`);
        const data = await res.json();
        setJobStatus(data);

        if (data.status === 'completed') {
          clearInterval(interval);
          setGenerating(false);
          toast.success('Rapport stratégique généré avec succès !');
          fetchReports();
          setActiveTab('history');
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setGenerating(false);
          toast.error(`Génération échouée: ${data.error || 'Unknown error'}`);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setGenerating(false);
          toast.error('Génération expirée');
        }
      } catch {
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setGenerating(false);
        }
      }
    }, 5000);
  }, [fetchReports]);

  // ─── Impact Badge ─────────────────────────────────────────
  const getImpactBadge = (impact: string) => {
    if (impact === 'bullish') return { icon: TrendingUp, label: 'Bullish', color: 'var(--bull)', bg: 'var(--bull2)' };
    if (impact === 'bearish') return { icon: TrendingDown, label: 'Bearish', color: 'var(--bear)', bg: 'var(--bear2)' };
    return { icon: Minus, label: 'Neutral', color: 'var(--gold)', bg: 'var(--gold2)' };
  };

  // ─── Render ───────────────────────────────────────────────
  return (
    <div dir="ltr" className="space-y-6">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-bold font-heading flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Shield size={22} style={{ color: 'var(--purple)' }} />
            Rapports stratégiques
          </h1>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>
            Analyse approfondie sur des sujets spécifiques — différent des rapports quotidiens automatisés
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="text-[9px] gap-1" style={{
            background: 'rgba(139,92,246,0.1)', color: 'var(--purple)',
            border: '1px solid rgba(139,92,246,0.2)',
          }}>
            <Sparkles size={10} />
            Sonnet
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchReports} className="text-[11px] gap-1"
            style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
            <RefreshCw size={12} /> Actualiser
          </Button>
        </div>
      </div>

      {/* ═══ Difference Banner ═══ */}
      <Card className="border-0" style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(0,229,255,0.03))',
        border: '1px solid rgba(139,92,246,0.12)',
      }}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
              <FileText size={14} style={{ color: 'var(--text3)' }} />
              <div>
                <div className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>Rapports automatisés</div>
                <div className="text-[9px]" style={{ color: 'var(--text4)' }}>Agrégation d'actualités quotidiennes</div>
              </div>
            </div>
            <div className="text-[12px] font-bold" style={{ color: 'var(--text4)' }}>→</div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Shield size={14} style={{ color: 'var(--purple)' }} />
              <div>
                <div className="text-[10px] font-bold" style={{ color: 'var(--purple)' }}>Rapports stratégiques</div>
                <div className="text-[9px]" style={{ color: 'var(--text4)' }}>Question spécifique + analyse approfondie</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Tab Navigation ═══ */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('generate')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold transition-all"
          style={{
            background: activeTab === 'generate' ? 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(0,229,255,0.05))' : 'var(--bg3)',
            border: `1px solid ${activeTab === 'generate' ? 'rgba(139,92,246,0.25)' : 'var(--border)'}`,
            color: activeTab === 'generate' ? 'var(--purple)' : 'var(--text3)',
            boxShadow: activeTab === 'generate' ? '0 2px 8px rgba(139,92,246,0.1)' : 'none',
          }}
        >
          <Sparkles size={15} /> Générer un nouveau rapport
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold transition-all"
          style={{
            background: activeTab === 'history' ? 'var(--bg4)' : 'var(--bg3)',
            border: `1px solid ${activeTab === 'history' ? 'var(--border)' : 'var(--border)'}`,
            color: activeTab === 'history' ? 'var(--text)' : 'var(--text3)',
          }}
        >
          <Clock size={15} /> Historique ({reports.length})
        </button>
      </div>

      {/* ═══ Generation Status ═══ */}
      {generating && jobStatus && (
        <Card className="border-0" style={{
          background: jobStatus.status === 'completed'
            ? 'var(--bull2)' : jobStatus.status === 'failed'
            ? 'var(--bear2)' : 'rgba(139,92,246,0.04)',
          border: `1px solid ${jobStatus.status === 'completed'
            ? 'rgba(0,200,150,0.2)' : jobStatus.status === 'failed'
            ? 'rgba(255,77,106,0.2)' : 'rgba(139,92,246,0.15)'}`,
        }}>
          <CardContent className="p-4 flex items-center gap-3">
            {jobStatus.status === 'completed' ? (
              <CheckCircle2 size={24} style={{ color: 'var(--bull)' }} />
            ) : jobStatus.status === 'failed' ? (
              <AlertTriangle size={24} style={{ color: 'var(--bear)' }} />
            ) : (
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--purple)' }} />
            )}
            <div className="flex-1">
              <div className="text-[13px] font-bold" style={{
                color: jobStatus.status === 'completed' ? 'var(--bull)' : jobStatus.status === 'failed' ? 'var(--bear)' : 'var(--purple)',
              }}>
                {jobStatus.status === 'completed' ? 'Rapport généré avec succès !'
                  : jobStatus.status === 'failed' ? 'Génération échouée'
                  : jobStatus.status === 'running' ? 'Génération IA en cours...'
                  : "En file d'attente..."}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text3)' }}>
                {jobStatus.status === 'completed' && jobStatus.result
                  ? `${jobStatus.result.title}`
                  : `Sujet: ${topic} · Duration: ${Math.round((Date.now() - (jobStatus.duration || 0)) / 1000)}s`}
              </div>
            </div>
            {jobStatus.status === 'completed' && jobStatus.result && (
              <Link href={`/fr/reports/${jobStatus.result.slug}`} target="_blank">
                <Button size="sm" className="text-[11px] gap-1" style={{ background: 'var(--bull)', color: 'white' }}>
                  <Eye size={12} /> Voir Report
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══ Generate Tab ═══ */}
      {activeTab === 'generate' && (
        <div className="space-y-4">
          {/* ── Sujet Input ── */}
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Sparkles size={15} style={{ color: 'var(--purple)' }} />
                Sujet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={topic}
                onChange={(e) => setSujet(e.target.value)}
                placeholder="e.g., Impact des guerres commerciales sur les marchés arabes"
                rows={2}
                className="w-full px-4 py-3 rounded-xl text-[14px] resize-none"
                style={{
                  background: 'var(--bg4)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  outline: 'none',
                }}
              />
              <div className="flex items-center justify-between mt-2">
                <div className="text-[10px]" style={{ color: 'var(--text4)' }}>
                  {topic.length} caractères — Entrez un sujet spécifique pour l'analyse stratégique
                </div>
                <button
                  onClick={() => setShowPresetSujets(!showPresetSujets)}
                  className="text-[10px] font-bold flex items-center gap-1 px-2 py-1 rounded-md"
                  style={{ color: 'var(--purple)', background: 'rgba(139,92,246,0.06)' }}
                >
                  {showPresetSujets ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  Sujets suggérés
                </button>
              </div>
              {showPresetSujets && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  {TOPIC_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => { setSujet(preset); setShowPresetSujets(false); }}
                      className="text-[11px] text-left px-3 py-2.5 rounded-lg transition-all hover:scale-[1.01]"
                      style={{
                        background: topic === preset ? 'rgba(139,92,246,0.1)' : 'var(--bg4)',
                        border: `1px solid ${topic === preset ? 'rgba(139,92,246,0.25)' : 'var(--border)'}`,
                        color: topic === preset ? 'var(--purple)' : 'var(--text2)',
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Region & Secteurs ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Region */}
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <MapPin size={15} style={{ color: 'var(--cyan)' }} />
                  Portée géographique
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {REGION_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setRegion(opt.value)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-[12px] text-left transition-all"
                      style={{
                        background: region === opt.value ? 'rgba(0,229,255,0.08)' : 'var(--bg4)',
                        border: `1px solid ${region === opt.value ? 'rgba(0,229,255,0.25)' : 'var(--border)'}`,
                        color: region === opt.value ? 'var(--cyan)' : 'var(--text2)',
                      }}
                    >
                      <span>{opt.icon}</span>
                      <span className="font-semibold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Secteurs */}
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <Layers size={15} style={{ color: 'var(--gold)' }} />
                  Secteurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {SECTOR_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => toggleSector(opt.value)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                      style={{
                        background: selectedSecteurs.includes(opt.value) ? 'rgba(255,184,0,0.1)' : 'var(--bg4)',
                        border: `1px solid ${selectedSecteurs.includes(opt.value) ? 'rgba(255,184,0,0.25)' : 'var(--border)'}`,
                        color: selectedSecteurs.includes(opt.value) ? 'var(--gold)' : 'var(--text3)',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Scenarios ── */}
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <CalendarDays size={15} style={{ color: 'var(--bull)' }} />
                Horizons temporels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {SCENARIO_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => toggleScenario(opt.value)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                    style={{
                      background: selectedScenarios.includes(opt.value) ? 'rgba(0,200,150,0.1)' : 'var(--bg4)',
                      border: `1px solid ${selectedScenarios.includes(opt.value) ? 'rgba(0,200,150,0.25)' : 'var(--border)'}`,
                      color: selectedScenarios.includes(opt.value) ? 'var(--bull)' : 'var(--text3)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Generate Button ── */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-[11px] cursor-pointer" style={{ color: 'var(--text3)' }}>
                <input
                  type="checkbox"
                  checked={publishOnComplete}
                  onChange={(e) => setPublishOnComplete(e.target.checked)}
                  className="rounded"
                />
                Auto-publier après génération
              </label>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generating || !topic.trim()}
              className="text-[13px] font-bold gap-2 px-8 py-3 h-auto"
              style={{
                background: generating
                  ? 'var(--bg4)'
                  : 'linear-gradient(135deg, #8B5CF6, #00E5FF)',
                color: generating ? 'var(--text3)' : 'white',
                boxShadow: generating ? 'none' : '0 4px 16px rgba(139,92,246,0.3)',
              }}
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Shield size={16} />
                  Générer le rapport stratégique
                </>
              )}
            </Button>
          </div>

          {/* Prompt Preview */}
          <Card className="border-0" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={12} style={{ color: 'var(--purple)' }} />
                <span className="text-[11px] font-bold" style={{ color: 'var(--text3)' }}>Résumé de la demande</span>
              </div>
              <div className="space-y-1 text-[11px]" style={{ color: 'var(--text3)' }}>
                <div>Sujet: <span style={{ color: 'var(--text)' }}>{topic || '—'}</span></div>
                <div>Région : <span style={{ color: 'var(--cyan)' }}>{region}</span></div>
                <div>Secteurs: <span style={{ color: 'var(--gold)' }}>{selectedSecteurs.join(', ')}</span></div>
                <div>Horizons : <span style={{ color: 'var(--bull)' }}>{selectedScenarios.join(', ')}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ Historique Tab ═══ */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {loading ? (
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardContent className="p-8 text-center">
                <Loader2 size={24} className="animate-spin mx-auto mb-3" style={{ color: 'var(--purple)' }} />
                <span className="text-[12px]" style={{ color: 'var(--text3)' }}>Chargement des rapports...</span>
              </CardContent>
            </Card>
          ) : reports.length === 0 ? (
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardContent className="p-8 text-center">
                <Shield size={32} style={{ color: 'var(--text4)', margin: '0 auto 12px' }} />
                <p className="text-[13px] font-bold" style={{ color: 'var(--text3)' }}>Aucun rapport stratégique</p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text4)' }}>
                  Créez votre premier rapport stratégique depuis l'onglet Générer
                </p>
                <Button
                  onClick={() => setActiveTab('generate')}
                  variant="outline"
                  size="sm"
                  className="text-[11px] gap-1 mt-3"
                  style={{ borderColor: 'var(--border)', color: 'var(--purple)' }}
                >
                  <Sparkles size={12} /> Générer un rapport
                </Button>
              </CardContent>
            </Card>
          ) : (
            reports.map(report => {
              const impact = getImpactBadge(report.marketImpact);
              const ImpactIcon = impact.icon;
              return (
                <Card key={report.id} className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield size={14} style={{ color: 'var(--purple)' }} />
                          <Link
                            href={`/fr/reports/${report.slug}`}
                            target="_blank"
                            className="text-[13px] font-bold hover:underline"
                            style={{ color: 'var(--text)', textDecoration: 'none' }}
                          >
                            {report.title}
                          </Link>
                        </div>
                        {report.summary && (
                          <p className="text-[11px] mt-1 line-clamp-2" style={{ color: 'var(--text3)' }}>
                            {report.summary.slice(0, 200)}{report.summary.length > 200 ? '...' : ''}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <Badge className="text-[8px]" style={{
                            background: impact.bg, color: impact.color,
                            border: `1px solid ${impact.color}20`,
                          }}>
                            <ImpactIcon size={9} className="inline" /> {impact.label}
                          </Badge>
                          <Badge className="text-[8px]" style={{
                            background: 'var(--bg4)', color: 'var(--text3)', border: '1px solid var(--border)',
                          }}>
                            Confiance : {report.confidenceScore}%
                          </Badge>
                          <Badge className="text-[8px]" style={{
                            background: report.isPublished ? 'var(--bull2)' : 'var(--gold2)',
                            color: report.isPublished ? 'var(--bull)' : 'var(--gold)',
                            border: `1px solid ${report.isPublished ? 'rgba(0,200,150,0.2)' : 'rgba(255,184,0,0.2)'}`,
                          }}>
                            {report.isPublished ? 'Publié' : 'Brouillon'}
                          </Badge>
                          <span className="text-[9px]" style={{ color: 'var(--text4)' }}>
                            {new Date(report.createdAt).toLocaleDateString('fr-FR', {
                              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                      <Link href={`/fr/reports/${report.slug}`} target="_blank">
                        <Button variant="outline" size="sm" className="text-[10px] gap-1 h-8"
                          style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
                          <Eye size={12} /> Voir
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

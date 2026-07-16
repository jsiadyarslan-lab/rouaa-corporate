'use client';

import { useState, useCallback } from 'react';
import { PAIRS, ANALYSIS_TYPES, TIMEFRAMES, STYLES, localized } from './types';
import type { Locale } from '@/components/analysis-v2/locales';
import s from './AIGeneratorPanel.module.css';
// V1042: Rouaa Assistant integration
import { askAssistant } from '@/lib/assistant/global-bridge';

interface AIGeneratorPanelProps {
  onGenerate: (params: {
    pair: string;
    analysisType: string;
    timeframe: string;
    style: string;
  }) => Promise<void>;
  loading: boolean;
  output: string | null;
  timestamp: string | null;
  aiStatus: string;
  locale?: Locale;
}

const TEXT: Record<Locale, {
  title: string;
  subtitle: string;
  selectAsset: string;
  otherPair: string;
  analysisType: string;
  timeframe: string;
  style: string;
  generate: string;
  askRouaa: string;
  processing: string;
  analysisResult: string;
  copy: string;
  discussWith: string;
}> = {
  ar: {
    title: 'مولّد التحليل الذكي',
    subtitle: 'مدعوم بـ AI · تحليل احترافي مهيكل في ثوانٍ',
    selectAsset: 'اختر الأصل',
    otherPair: 'زوج آخر...',
    analysisType: 'نوع التحليل',
    timeframe: 'الإطار الزمني',
    style: 'الأسلوب',
    generate: '⚡ توليد',
    askRouaa: '🤖 مساعد رؤى',
    processing: '⏳ يعالج...',
    analysisResult: 'نتيجة التحليل',
    copy: '📋 نسخ',
    discussWith: 'ناقش هذا التحليل مع مساعد رؤى',
  },
  en: {
    title: 'AI Analysis Generator',
    subtitle: 'Powered by AI · Professional structured analysis in seconds',
    selectAsset: 'Select Asset',
    otherPair: 'Other pair...',
    analysisType: 'Analysis Type',
    timeframe: 'Timeframe',
    style: 'Style',
    generate: '⚡ Generate',
    askRouaa: '🤖 Rouaa Assistant',
    processing: '⏳ Processing...',
    analysisResult: 'Analysis Result',
    copy: '📋 Copy',
    discussWith: 'Discuss this analysis with Rouaa AI Advisor',
  },
  fr: {
    title: "Générateur d'Analyse IA",
    subtitle: 'Propulsé par IA · Analyse professionnelle structurée en secondes',
    selectAsset: 'Sélectionner un actif',
    otherPair: 'Autre paire...',
    analysisType: "Type d'analyse",
    timeframe: 'Horizon temporel',
    style: 'Style',
    generate: '⚡ Générer',
    askRouaa: '🤖 Assistant Rouaa',
    processing: '⏳ Traitement...',
    analysisResult: "Résultat de l'analyse",
    copy: '📋 Copier',
    discussWith: "Discuter de cette analyse avec l'assistant IA Rouaa",
  },
  tr: {
    title: 'AI Analiz Üreteci',
    subtitle: 'AI destekli · Saniyeler içinde profesyonel yapılandırılmış analiz',
    selectAsset: 'Varlık Seç',
    otherPair: 'Başka çift...',
    analysisType: 'Analiz Türü',
    timeframe: 'Zaman Çerçevesi',
    style: 'Stil',
    generate: '⚡ Üret',
    askRouaa: '🤖 Rouaa Asistanı',
    processing: '⏳ İşleniyor...',
    analysisResult: 'Analiz Sonucu',
    copy: '📋 Kopyala',
    discussWith: 'Bu analizi Rouaa AI Danışmanı ile tartışın',
  },
  es: {
    title: 'Generador de Análisis IA',
    subtitle: 'Impulsado por IA · Análisis profesional estructurado en segundos',
    selectAsset: 'Seleccionar Activo',
    otherPair: 'Otra pareja...',
    analysisType: 'Tipo de Análisis',
    timeframe: 'Horizonte Temporal',
    style: 'Estilo',
    generate: '⚡ Generar',
    askRouaa: '🤖 Asistente Rouaa',
    processing: '⏳ Procesando...',
    analysisResult: 'Resultado del Análisis',
    copy: '📋 Copiar',
    discussWith: 'Discutir este análisis con el Asistente IA de Rouaa',
  },
};

export default function AIGeneratorPanel({
  onGenerate,
  loading,
  output,
  timestamp,
  aiStatus,
  locale = 'ar',
}: AIGeneratorPanelProps) {
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  const [customPair, setCustomPair] = useState('');
  const [analysisType, setAnalysisType] = useState('full');
  const [timeframe, setTimeframe] = useState('short');
  const [style, setStyle] = useState('pro');

  const txt = TEXT[locale] || TEXT.ar;
  const advisorPath = locale === 'ar' ? '/ar/advisor' : `/${locale}/advisor`;

  const handleGenerate = useCallback(() => {
    const pair = customPair.trim() || selectedPair;
    if (!pair || loading) return;
    onGenerate({ pair, analysisType, timeframe, style });
  }, [selectedPair, customPair, analysisType, timeframe, style, loading, onGenerate]);

  const copyOutput = useCallback(() => {
    if (output) navigator.clipboard.writeText(output);
  }, [output]);

  const statusColor = (aiStatus === 'جاهز' || aiStatus === 'Ready' || aiStatus === 'Prêt' || aiStatus === 'Hazır' || aiStatus === 'Listo') ? 'var(--bull)' : (aiStatus === 'مكتمل ✓' || aiStatus === 'Complete ✓' || aiStatus === 'Terminé ✓' || aiStatus === 'Tamamlandı ✓' || aiStatus === 'Completado ✓') ? 'var(--cyan)' : 'var(--gold)';

  return (
    <div className={s.genPanel} id="ai-generator">
      <div className={s.genPanelTopBar} />
      <div className={s.genPanelBody}>
        <div className={s.genPanelHeader}>
          <div className={s.genPanelIcon}>🧠</div>
          <div>
            <div className={s.genPanelTitle}>{txt.title}</div>
            <div className={s.genPanelSub}>{txt.subtitle}</div>
          </div>
          <div className={s.genPanelStatus}>
            <div className={s.statusDot} style={{ background: statusColor }} />
            <span className={s.statusText}>{aiStatus}</span>
          </div>
        </div>

        {/* Pair selector tabs */}
        <div className={s.pairSection}>
          <div className={s.pairLabel}>{txt.selectAsset}</div>
          <div className={s.pairTabs}>
            {PAIRS.map(pair => (
              <button key={pair}
                onClick={() => { setSelectedPair(pair); setCustomPair(''); }}
                className={`${s.pairTab} ${selectedPair === pair && !customPair ? s.pairTabActive : ''}`}>
                {pair}
              </button>
            ))}
            <input type="text" value={customPair}
              onChange={e => { setCustomPair(e.target.value); setSelectedPair(''); }}
              placeholder={txt.otherPair}
              className={s.customPairInput} />
          </div>
        </div>

        {/* Controls */}
        <div className={s.controlsGrid}>
          <div className={s.controlGroup}>
            <div className={s.controlLabel}>{txt.analysisType}</div>
            <select value={analysisType} onChange={e => setAnalysisType(e.target.value)} className={s.controlSelect}>
              {Object.entries(ANALYSIS_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{localized(ANALYSIS_TYPES, k, locale)}</option>
              ))}
            </select>
          </div>
          <div className={s.controlGroup}>
            <div className={s.controlLabel}>{txt.timeframe}</div>
            <select value={timeframe} onChange={e => setTimeframe(e.target.value)} className={s.controlSelect}>
              {Object.entries(TIMEFRAMES).map(([k, v]) => (
                <option key={k} value={k}>{localized(TIMEFRAMES, k, locale)}</option>
              ))}
            </select>
          </div>
          <div className={s.controlGroup}>
            <div className={s.controlLabel}>{txt.style}</div>
            <select value={style} onChange={e => setStyle(e.target.value)} className={s.controlSelect}>
              {Object.entries(STYLES).map(([k, v]) => (
                <option key={k} value={k}>{localized(STYLES, k, locale)}</option>
              ))}
            </select>
          </div>
          <button onClick={handleGenerate} disabled={loading} className={s.genBtn}>
            {loading ? txt.processing : txt.generate}
          </button>
          {/* V1042: Alternative — ask Rouaa Assistant for the analysis */}
          <button
            onClick={() => {
              const pair = customPair || selectedPair;
              const typeLabel = localized(ANALYSIS_TYPES, analysisType, locale);
              const tfLabel = localized(TIMEFRAMES, timeframe, locale);
              const prompt = locale === 'ar' ? `حلل زوج ${pair} (${typeLabel}, ${tfLabel}) بشكل شامل مع التوصيات` :
                locale === 'fr' ? `Analyse complète de la paire ${pair} (${typeLabel}, ${tfLabel}) avec recommandations` :
                locale === 'tr' ? `${pair} çiftini kapsamlı şekilde analiz et (${typeLabel}, ${tfLabel}) tavsiyelerle` :
                locale === 'es' ? `Analiza el par ${pair} (${typeLabel}, ${tfLabel}) de forma completa con recomendaciones` :
                `Analyze ${pair} pair (${typeLabel}, ${tfLabel}) comprehensively with recommendations`;
              askAssistant(prompt, { reportType: 'analysis', deepSearch: true });
            }}
            className={s.genBtn}
            style={{
              background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(139,92,246,0.15))',
              border: '1px solid rgba(0,229,255,0.4)',
              color: 'var(--cyan, #00E5FF)',
              boxShadow: '0 0 12px rgba(0,229,255,0.15)',
            }}
          >
            {txt.askRouaa}
          </button>
        </div>
      </div>

      {/* Output area */}
      {output && (
        <div className={s.outputArea}>
          <div className={s.outputHeader}>
            <span style={{ fontSize: 14 }}>🧠</span>
            <span className={s.outputLabel}>{txt.analysisResult}</span>
            <span className={s.outputMeta}>{customPair || selectedPair} · {localized(ANALYSIS_TYPES, analysisType, locale)}</span>
            {timestamp && <span className={s.outputTime}>{timestamp}</span>}
            <button className={s.outputCopyBtn} onClick={copyOutput}>{txt.copy}</button>
          </div>
          <div className={s.outputContent}>{output}</div>
          {/* Discuss with AI Advisor */}
          <div className={s.discussLink}>
            <a href={advisorPath} className={s.discussLinkInner}>
              <svg className={s.discussIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2">
                <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                <path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z" />
              </svg>
              <span className={s.discussText}>{txt.discussWith}</span>
              <svg className={s.discussArrow} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

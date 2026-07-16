'use client';

import { useState, useCallback, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════
// Revolutionary Addition #8: Context-Aware AI Translation
// Real-time translation toggle between languages with
// context-aware financial terminology preservation.
// Uses the /api/translate endpoint if available, or falls back
// to a local dictionary for common financial terms.
// ═══════════════════════════════════════════════════════════════

interface Props {
  content: string;
  currentLocale: 'en' | 'fr' | 'ar' | 'tr';
  onLocaleChange?: (locale: 'en' | 'fr' | 'ar' | 'tr') => void;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', fr: 'Français', ar: 'العربية', tr: 'Türkçe',
};

const FLAG_EMOJI: Record<string, string> = {
  en: '🇬🇧', fr: '🇫🇷', ar: '🇸🇦', tr: '🇹🇷',
};

// Common financial terms dictionary for instant local translation
const FINANCIAL_DICT: Record<string, Record<string, string>> = {
  'en-fr': {
    'bullish': 'haussier', 'bearish': 'baissier', 'neutral': 'neutre',
    'confidence': 'confiance', 'risk': 'risque', 'recommendation': 'recommandation',
    'entry': 'entrée', 'stop loss': 'stop loss', 'target': 'objectif',
    'allocation': 'allocation', 'sector': 'secteur', 'market': 'marché',
    'inflation': 'inflation', 'interest rate': 'taux d\'intérêt',
    'central bank': 'banque centrale', 'GDP': 'PIB', 'forex': 'forex',
    'stocks': 'actions', 'bonds': 'obligations', 'commodities': 'matières premières',
    'energy': 'énergie', 'crypto': 'crypto', 'real estate': 'immobilier',
  },
  'fr-en': {
    'haussier': 'bullish', 'baissier': 'bearish', 'neutre': 'neutral',
    'confiance': 'confidence', 'risque': 'risk', 'recommandation': 'recommendation',
    'entrée': 'entry', 'objectif': 'target', 'secteur': 'sector', 'marché': 'market',
    'actions': 'stocks', 'obligations': 'bonds', 'matières premières': 'commodities',
    'énergie': 'energy', 'immobilier': 'real estate', 'banque centrale': 'central bank',
  },
};

type Locale = 'en' | 'fr' | 'ar' | 'tr';

export default function ContextAwareAITranslation({ content, currentLocale, onLocaleChange }: Props) {
  const [targetLocale, setTargetLocale] = useState<Locale>(currentLocale);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [showTranslated, setShowTranslated] = useState(false);

  const handleTranslate = useCallback(async (locale: Locale) => {
    if (locale === currentLocale) {
      setShowTranslated(false);
      setTargetLocale(locale);
      return;
    }

    setTargetLocale(locale);
    setIsTranslating(true);
    setShowTranslated(true);

    try {
      // Try API translation first
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: content.slice(0, 3000), // Limit content length
          source: currentLocale,
          target: locale,
          domain: 'financial',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.translation) {
          setTranslatedContent(data.translation);
          setIsTranslating(false);
          return;
        }
      }
    } catch {
      // API not available — use local dictionary
    }

    // Fallback: local financial dictionary replacement
    const dictKey = `${currentLocale}-${locale}`;
    const dict = FINANCIAL_DICT[dictKey] || {};
    let translated = content.slice(0, 3000);
    for (const [source, target] of Object.entries(dict)) {
      const regex = new RegExp(`\\b${source}\\b`, 'gi');
      translated = translated.replace(regex, target);
    }
    setTranslatedContent(translated);
    setIsTranslating(false);
  }, [content, currentLocale]);

  const handleLocaleClick = useCallback((locale: Locale) => {
    setTargetLocale(locale);
    if (locale === currentLocale) {
      setShowTranslated(false);
      setTranslatedContent(null);
      if (onLocaleChange) onLocaleChange(locale);
    } else {
      handleTranslate(locale);
    }
  }, [currentLocale, handleTranslate, onLocaleChange]);

  const locales: Locale[] = ['en', 'fr', 'ar', 'tr'];

  return (
    <div style={{
      background: 'rgba(10, 14, 39, 0.6)',
      border: '1px solid rgba(0, 229, 255, 0.15)',
      borderRadius: '12px',
      padding: '14px 20px',
      marginBottom: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '16px' }}>&#127760;</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-head)' }}>
          AI Translation
        </span>
      </div>

      {/* Language buttons */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {locales.map(loc => (
          <button
            key={loc}
            onClick={() => handleLocaleClick(loc)}
            style={{
              padding: '6px 14px', borderRadius: '6px',
              background: targetLocale === loc && (loc === currentLocale ? !showTranslated : showTranslated) ? 'rgba(0,229,255,0.12)' : 'rgba(128,128,128,0.06)',
              border: `1px solid ${targetLocale === loc ? 'rgba(0,229,255,0.25)' : 'rgba(128,128,128,0.1)'}`,
              color: targetLocale === loc ? 'var(--cyan)' : 'var(--text3)',
              cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '4px',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: '14px' }}>{FLAG_EMOJI[loc]}</span>
            {LANGUAGE_NAMES[loc]}
          </button>
        ))}
      </div>

      {/* Translated content preview */}
      {showTranslated && (
        <div style={{
          marginTop: '12px', padding: '12px', borderRadius: '8px',
          background: 'rgba(0,229,255,0.03)', border: '1px solid rgba(0,229,255,0.08)',
          maxHeight: '150px', overflow: 'auto',
        }}>
          {isTranslating ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text3)', fontSize: '12px' }}>
              <span className="animate-spin">&#9696;</span>
              Translating...
            </div>
          ) : translatedContent ? (
            <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.7 }}>
              {translatedContent.slice(0, 500)}{translatedContent.length > 500 ? '...' : ''}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

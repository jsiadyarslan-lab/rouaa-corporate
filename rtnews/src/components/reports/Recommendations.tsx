'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  BellOff,
  Loader2,
} from 'lucide-react';

interface Recommendation {
  id: string;
  text: string;
  category?: string;
  assets?: string[];
}

interface RecommendationsProps {
  recommendations: Recommendation[];
  reportId: string;
  locale?: 'ar' | 'en' | 'fr' | 'tr' | 'es';
  onFeedbackSubmit?: (recommendationId: string, feedbackType: string, executedPrice?: number) => Promise<void>;
}

type FeedbackType = 'executed' | 'useful' | 'not_useful' | 'dismissed';

const FEEDBACK_LABELS: Record<string, Record<FeedbackType, string>> = {
  ar: { executed: 'تم التنفيذ', useful: 'مفيد', not_useful: 'غير مفيد', dismissed: 'تجاهل' },
  en: { executed: 'Executed', useful: 'Useful', not_useful: 'Not Useful', dismissed: 'Dismiss' },
  fr: { executed: 'Exécuté', useful: 'Utile', not_useful: 'Pas Utile', dismissed: 'Ignorer' },
  tr: { executed: 'Gerçekleştirildi', useful: 'Faydalı', not_useful: 'Faydasız', dismissed: 'Yok Say' },
  es: { executed: 'Ejecutado', useful: 'Útil', not_useful: 'No Útil', dismissed: 'Descartar' },
};

const FEEDBACK_BUTTONS: {
  type: FeedbackType;
  icon: React.ReactNode;
  activeClass: string;
}[] = [
  {
    type: 'executed',
    icon: <CheckCircle2 width={14} height={14} />,
    activeClass: 'bg-green-500/20 border-green-500/50 text-green-400',
  },
  {
    type: 'useful',
    icon: <ThumbsUp width={14} height={14} />,
    activeClass: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
  },
  {
    type: 'not_useful',
    icon: <ThumbsDown width={14} height={14} />,
    activeClass: 'bg-orange-500/20 border-orange-500/50 text-orange-400',
  },
  {
    type: 'dismissed',
    icon: <BellOff width={14} height={14} />,
    activeClass: 'bg-gray-500/20 border-gray-500/50 text-gray-300',
  },
];

const UI_LABELS: Record<string, Record<string, string>> = {
  ar: {
    title: 'التوصيات القابلة للتنفيذ',
    pricePlaceholder: 'سعر التنفيذ (اختياري)',
    confirm: 'تأكيد',
    cancel: 'إلغاء',
  },
  en: {
    title: 'Actionable Recommendations',
    pricePlaceholder: 'Execution price (optional)',
    confirm: 'Confirm',
    cancel: 'Cancel',
  },
  fr: {
    title: 'Recommandations Actionnables',
    pricePlaceholder: "Prix d'exécution (optionnel)",
    confirm: 'Confirmer',
    cancel: 'Annuler',
  },
  tr: {
    title: 'Uygulanabilir Tavsiyeler',
    pricePlaceholder: 'Uygulama fiyatı (isteğe bağlı)',
    confirm: 'Onayla',
    cancel: 'İptal',
  },
  es: {
    title: 'Recomendaciones Accionables',
    pricePlaceholder: 'Precio de ejecución (opcional)',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
  },
};

export default function Recommendations({
  recommendations,
  reportId,
  locale = 'ar',
  onFeedbackSubmit,
}: RecommendationsProps) {
  const t = (key: string) => UI_LABELS[locale]?.[key] || UI_LABELS.ar[key] || key;
  // Track feedback state per recommendation
  const [feedbackState, setFeedbackState] = useState<Record<string, FeedbackType | null>>({});
  const [loadingState, setLoadingState] = useState<Record<string, boolean>>({});
  const [showPriceInput, setShowPriceInput] = useState<Record<string, boolean>>({});
  const [executedPrice, setExecutedPrice] = useState<Record<string, string>>({});

  const handleFeedback = async (recId: string, feedbackType: FeedbackType) => {
    if (feedbackState[recId] === feedbackType) return; // Already selected

    // If "executed" is clicked, show price input
    if (feedbackType === 'executed' && !showPriceInput[recId]) {
      setShowPriceInput(prev => ({ ...prev, [recId]: true }));
      return;
    }

    // Submit feedback
    setLoadingState(prev => ({ ...prev, [recId]: true }));

    try {
      const price = feedbackType === 'executed' && executedPrice[recId]
        ? parseFloat(executedPrice[recId])
        : undefined;

      if (onFeedbackSubmit) {
        await onFeedbackSubmit(recId, feedbackType, price);
      } else {
        // Default: POST to the feedback API
        const res = await fetch('/api/advisor/feedback?XTransformPort=3000', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recommendationId: recId,
            feedbackType,
            reportId,
            executedPrice: price,
          }),
        });

        if (!res.ok) throw new Error('Failed to submit feedback');
      }

      setFeedbackState(prev => ({ ...prev, [recId]: feedbackType }));
      setShowPriceInput(prev => ({ ...prev, [recId]: false }));
    } catch (error) {
      console.error('Feedback submission failed:', error);
    } finally {
      setLoadingState(prev => ({ ...prev, [recId]: false }));
    }
  };

  const handlePriceSubmit = (recId: string) => {
    handleFeedback(recId, 'executed');
  };

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '24px' }}>
      <h3 style={{
        fontSize: '16px',
        fontWeight: 700,
        color: 'var(--text-head, #fff)',
        marginBottom: '16px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(128,128,128,0.12)',
      }}>
        {t('title')}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {recommendations.map((rec, index) => (
          <div
            key={rec.id}
            style={{
              padding: '16px',
              borderRadius: '10px',
              background: 'rgba(128,128,128,0.04)',
              border: '1px solid rgba(128,128,128,0.1)',
              transition: 'all 0.2s ease',
            }}
          >
            {/* Recommendation number and text */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: 'rgba(128,128,128,0.1)',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text2, #999)',
                flexShrink: 0,
                marginTop: '2px',
              }}>
                {index + 1}
              </span>
              <p style={{
                fontSize: '13px',
                lineHeight: '1.8',
                color: 'var(--text2, #ccc)',
                margin: 0,
                flex: 1,
              }}>
                {rec.text}
              </p>
            </div>

            {/* Asset tags */}
            {rec.assets && rec.assets.length > 0 && (
              <div style={{
                display: 'flex',
                gap: '6px',
                marginTop: '8px',
                marginRight: '34px',
                flexWrap: 'wrap',
              }}>
                {rec.assets.map(asset => (
                  <span key={asset} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(0,153,107,0.1)',
                    border: '1px solid rgba(0,153,107,0.2)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#00996B',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}>
                    {asset}
                  </span>
                ))}
              </div>
            )}

            {/* Price input for "executed" feedback */}
            {showPriceInput[rec.id] && (
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                marginTop: '10px',
                marginRight: '34px',
              }}>
                <input
                  type="number"
                  step="0.01"
                  placeholder={t('pricePlaceholder')}
                  value={executedPrice[rec.id] || ''}
                  onChange={(e) => setExecutedPrice(prev => ({
                    ...prev,
                    [rec.id]: e.target.value,
                  }))}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(128,128,128,0.2)',
                    background: 'rgba(128,128,128,0.05)',
                    color: 'var(--text2, #ccc)',
                    fontSize: '12px',
                    width: '180px',
                    outline: 'none',
                  }}
                  dir="ltr"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePriceSubmit(rec.id)}
                  disabled={loadingState[rec.id]}
                  style={{ fontSize: '11px', height: '30px' }}
                >
                  {loadingState[rec.id] ? <Loader2 width={12} height={12} className="animate-spin" /> : t('confirm')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPriceInput(prev => ({ ...prev, [rec.id]: false }))}
                  style={{ fontSize: '11px', height: '30px' }}
                >
                  {t('cancel')}
                </Button>
              </div>
            )}

            {/* Feedback buttons */}
            <div style={{
              display: 'flex',
              gap: '6px',
              marginTop: '12px',
              marginRight: '34px',
              flexWrap: 'wrap',
            }}>
              {FEEDBACK_BUTTONS.map(btn => {
                const isActive = feedbackState[rec.id] === btn.type;
                return (
                  <button
                    key={btn.type}
                    onClick={() => handleFeedback(rec.id, btn.type)}
                    disabled={loadingState[rec.id] || (feedbackState[rec.id] != null && !isActive)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: isActive
                        ? '1px solid rgba(128,128,128,0.4)'
                        : '1px solid rgba(128,128,128,0.15)',
                      background: isActive
                        ? 'rgba(128,128,128,0.12)'
                        : 'rgba(128,128,128,0.04)',
                      color: isActive ? 'var(--text-head, #fff)' : 'var(--text2, #999)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: isActive || feedbackState[rec.id] == null ? 'pointer' : 'default',
                      opacity: feedbackState[rec.id] != null && !isActive ? 0.4 : 1,
                      transition: 'all 0.15s ease',
                    }}
                    className={isActive ? btn.activeClass : ''}
                  >
                    {loadingState[rec.id] && btn.type === 'executed' && showPriceInput[rec.id]
                      ? <Loader2 width={12} height={12} className="animate-spin" />
                      : btn.icon
                    }
                    {FEEDBACK_LABELS[locale]?.[btn.type] || FEEDBACK_LABELS.ar[btn.type]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

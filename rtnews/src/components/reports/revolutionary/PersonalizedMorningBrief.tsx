'use client';

import { useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════
// Revolutionary Addition #10: Personalized Morning Brief
// Customizable morning summary widget showing key items for the
// day: market status, key events, portfolio alerts, and
// report highlights in a concise dashboard format.
// ═══════════════════════════════════════════════════════════════

interface Props {
  reportTitle: string;
  marketImpact: string;
  confidenceScore: number;
  sectors: string[];
  keyIndicators: Record<string, any>;
  locale?: 'en' | 'fr' | 'ar' | 'tr' | 'es';
}

const LABELS: Record<string, Record<string, string>> = {
  en: {
    title: 'Morning Brief',
    subtitle: 'Your personalized daily market digest',
    marketStatus: 'Market Status',
    keyEvents: 'Key Events Today',
    portfolioAlert: 'Portfolio Alert',
    sectorsToWatch: 'Sectors to Watch',
    confidenceMeter: 'Confidence Meter',
    actionRequired: 'Action Required',
    noActionNeeded: 'No immediate action required',
    bullishSignal: 'Bullish signals detected — consider long positions',
    bearishSignal: 'Bearish signals detected — consider defensive positions',
    neutralSignal: 'Market is neutral — maintain current positions',
    highConfidence: 'High confidence analysis',
    mediumConfidence: 'Medium confidence — verify with additional sources',
    lowConfidence: 'Low confidence — proceed with caution',
    today: 'Today\'s Focus',
  },
  fr: {
    title: 'Brief Matinal',
    subtitle: 'Votre résumé quotidien personnalisé du marché',
    marketStatus: 'État du Marché',
    keyEvents: 'Événements Clés Aujourd\'hui',
    portfolioAlert: 'Alerte Portefeuille',
    sectorsToWatch: 'Secteurs à Surveiller',
    confidenceMeter: 'Indicateur de Confiance',
    actionRequired: 'Action Requise',
    noActionNeeded: 'Aucune action immédiate requise',
    bullishSignal: 'Signaux haussiers détectés — envisagez des positions longues',
    bearishSignal: 'Signaux baissiers détectés — envisagez des positions défensives',
    neutralSignal: 'Le marché est neutre — maintenez les positions actuelles',
    highConfidence: 'Analyse à haute confiance',
    mediumConfidence: 'Confiance moyenne — vérifiez avec des sources supplémentaires',
    lowConfidence: 'Faible confiance — procédez avec prudence',
    today: 'Focus du Jour',
  },
  ar: {
    title: 'النشرة الصباحية',
    subtitle: 'ملخص السوق اليومي المخصص لك',
    marketStatus: 'حالة السوق',
    keyEvents: 'الأحداث الرئيسية اليوم',
    portfolioAlert: 'تنبيه المحفظة',
    sectorsToWatch: 'القطاعات المراقبة',
    confidenceMeter: 'مقياس الثقة',
    actionRequired: 'إجراء مطلوب',
    noActionNeeded: 'لا حاجة لإجراء فوري',
    bullishSignal: 'إشارات صاعدة مكتشفة — فكر في مراكز شراء',
    bearishSignal: 'إشارات هابطة مكتشفة — فكر في مراكز دفاعية',
    neutralSignal: 'السوق محايد — حافظ على المراكز الحالية',
    highConfidence: 'تحليل عالي الثقة',
    mediumConfidence: 'ثقة متوسطة — تحقق من مصادر إضافية',
    lowConfidence: 'ثقة منخفضة — تقدم بحذر',
    today: 'تركيز اليوم',
  },
  tr: {
    title: 'Sabah Bülteni',
    subtitle: 'Kişiselleştirilmiş günlük piyasa özetiniz',
    marketStatus: 'Piyasa Durumu',
    keyEvents: 'Bugünün Önemli Olayları',
    portfolioAlert: 'Portföy Uyarısı',
    sectorsToWatch: 'İzlenecek Sektörler',
    confidenceMeter: 'Güven Göstergesi',
    actionRequired: 'Eylem Gerekli',
    noActionNeeded: 'Acil eylem gerekmiyor',
    bullishSignal: 'Yükseliş sinyalleri tespit edildi — uzun pozisyonları değerlendirin',
    bearishSignal: 'Düşüş sinyalleri tespit edildi — savunmacı pozisyonları değerlendirin',
    neutralSignal: 'Piyasa nötr — mevcut pozisyonları koruyun',
    highConfidence: 'Yüksek güvenli analiz',
    mediumConfidence: 'Orta güven — ek kaynaklarla doğrulayın',
    lowConfidence: 'Düşük güven — dikkatle ilerleyin',
    today: 'Bugünün Odağı',
  },
  es: {
    title: 'Resumen Matutino',
    subtitle: 'Su resumen diario personalizado del mercado',
    marketStatus: 'Estado del Mercado',
    keyEvents: 'Eventos Clave de Hoy',
    portfolioAlert: 'Alerta de Portafolio',
    sectorsToWatch: 'Sectores a Vigilar',
    confidenceMeter: 'Medidor de Confianza',
    actionRequired: 'Acción Requerida',
    noActionNeeded: 'No se requiere acción inmediata',
    bullishSignal: 'Señales alcistas detectadas — considere posiciones largas',
    bearishSignal: 'Señales bajistas detectadas — considere posiciones defensivas',
    neutralSignal: 'El mercado está neutral — mantenga las posiciones actuales',
    highConfidence: 'Análisis de alta confianza',
    mediumConfidence: 'Confianza media — verifique con fuentes adicionales',
    lowConfidence: 'Baja confianza — proceda con cautela',
    today: 'Enfoque de Hoy',
  },
};

export default function PersonalizedMorningBrief({ reportTitle, marketImpact, confidenceScore, sectors, keyIndicators, locale = 'en' }: Props) {
  const t = (key: string) => LABELS[locale]?.[key] || LABELS.en[key] || key;

  const brief = useMemo(() => {
    const signalKey = marketImpact === 'bullish' ? 'bullishSignal' : marketImpact === 'bearish' ? 'bearishSignal' : 'neutralSignal';
    const confKey = confidenceScore >= 70 ? 'highConfidence' : confidenceScore >= 45 ? 'mediumConfidence' : 'lowConfidence';
    const needsAction = marketImpact !== 'neutral' && confidenceScore >= 50;

    // Extract key events from indicators
    const indicatorEntries = Object.entries(keyIndicators || {})
      .filter(([, v]) => typeof v === 'number')
      .slice(0, 4);

    return { signalKey, confKey, needsAction, indicatorEntries };
  }, [marketImpact, confidenceScore, keyIndicators]);

  const statusColor = marketImpact === 'bullish' ? '#00996B' : marketImpact === 'bearish' ? '#D4365C' : '#D4930D';
  const statusEmoji = marketImpact === 'bullish' ? '📈' : marketImpact === 'bearish' ? '📉' : '➡️';

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(10,14,39,0.8), rgba(0,153,107,0.05))',
      border: '1px solid rgba(0, 229, 255, 0.2)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative element */}
      <div style={{
        position: 'absolute', top: '-20px', right: '-20px',
        width: '80px', height: '80px', borderRadius: '50%',
        background: `${statusColor}08`,
        filter: 'blur(20px)',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '20px' }}>&#9728;</span>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-head)', margin: 0 }}>{t('title')}</h3>
          <span style={{
            fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
            background: `${statusColor}15`, color: statusColor,
            border: `1px solid ${statusColor}25`, marginLeft: 'auto',
          }}>
            {t('today')}
          </span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text3)', margin: '0 0 16px 0' }}>{t('subtitle')}</p>

        {/* Market Status Card */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 16px', borderRadius: '10px', marginBottom: '14px',
          background: `${statusColor}08`, border: `1px solid ${statusColor}15`,
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: `${statusColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px',
          }}>
            {statusEmoji}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '2px' }}>{t('marketStatus')}</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: statusColor, lineHeight: 1.4 }}>
              {t(brief.signalKey)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: 'var(--text3)', marginBottom: '2px' }}>{t('confidenceMeter')}</div>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              border: `3px solid ${confidenceScore >= 70 ? '#00996B' : confidenceScore >= 45 ? '#D4930D' : '#D4365C'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 900,
              color: confidenceScore >= 70 ? '#00996B' : confidenceScore >= 45 ? '#D4930D' : '#D4365C',
            }}>
              {confidenceScore}%
            </div>
          </div>
        </div>

        {/* Two-column info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          {/* Sectors to Watch */}
          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(128,128,128,0.04)', border: '1px solid rgba(128,128,128,0.06)' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', marginBottom: '8px' }}>{t('sectorsToWatch')}</div>
            {sectors.length > 0 ? sectors.slice(0, 4).map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                marginBottom: '4px',
              }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: statusColor }} />
                <span style={{ fontSize: '11px', color: 'var(--text2)' }}>{s}</span>
              </div>
            )) : (
              <span style={{ fontSize: '11px', color: 'var(--text3)' }}>—</span>
            )}
          </div>

          {/* Key Indicators */}
          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(128,128,128,0.04)', border: '1px solid rgba(128,128,128,0.06)' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', marginBottom: '8px' }}>{t('keyEvents')}</div>
            {brief.indicatorEntries.length > 0 ? brief.indicatorEntries.map(([key, val], i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                marginBottom: '4px',
              }}>
                <span style={{ fontSize: '11px', color: 'var(--text2)' }}>{key}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: typeof val === 'number' && val > 0 ? '#00996B' : '#D4365C' }}>
                  {typeof val === 'number' ? val : String(val)}
                </span>
              </div>
            )) : (
              <span style={{ fontSize: '11px', color: 'var(--text3)' }}>—</span>
            )}
          </div>
        </div>

        {/* Action Required */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 14px', borderRadius: '8px',
          background: brief.needsAction ? 'rgba(212,147,13,0.08)' : 'rgba(0,153,107,0.06)',
          border: `1px solid ${brief.needsAction ? 'rgba(212,147,13,0.15)' : 'rgba(0,153,107,0.12)'}`,
        }}>
          <span style={{ fontSize: '14px' }}>{brief.needsAction ? '⚡' : '✓'}</span>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: brief.needsAction ? '#D4930D' : '#00996B' }}>
              {brief.needsAction ? t('actionRequired') : t('noActionNeeded')}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>
              {t(brief.confKey)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

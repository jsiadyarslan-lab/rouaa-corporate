'use client';

// ─── Smart Alerts Configuration ────────────────────────────────
// Users can set price alerts and signal alerts.
// Uses localStorage for persistence with key: smartAlerts_${symbol}

import { useState, useEffect, useCallback } from 'react';
import type { Locale } from '@/lib/locale';

// ── Locale Labels ──
const LABELS: Record<string, Record<string, string>> = {
  en: {
    smartAlerts: 'Smart Alerts',
    priceAbove: 'Price Above',
    priceBelow: 'Price Below',
    signalBullish: 'Signal → Bullish',
    signalBearish: 'Signal → Bearish',
    rsiOverbought: 'RSI Overbought (>70)',
    rsiOversold: 'RSI Oversold (<30)',
    addAlert: 'Add Alert',
    activeAlerts: 'Active Alerts',
    noAlerts: 'No alerts configured',
    triggered: 'Triggered!',
    active: 'Active',
    remove: 'Delete',
    alertType: 'Alert Type',
    value: 'Threshold',
    status: 'Status',
    priceAlert: 'Price Alert',
    signalAlert: 'Signal Alert',
    rsiAlert: 'RSI Alert',
    enterValue: 'Enter value...',
    currentPrice: 'Current Price',
    createAlert: 'Create New Alert',
    loading: 'Loading alerts...',
    threshold: 'Threshold',
  },
  ar: {
    smartAlerts: 'التنبيهات الذكية',
    priceAbove: 'السعر أعلى من',
    priceBelow: 'السعر أقل من',
    signalBullish: 'الإشارة ← صاعد',
    signalBearish: 'الإشارة ← هابط',
    rsiOverbought: 'RSI شراء مفرط (>٧٠)',
    rsiOversold: 'RSI بيع مفرط (<٣٠)',
    addAlert: 'إضافة تنبيه',
    activeAlerts: 'التنبيهات النشطة',
    noAlerts: 'لا توجد تنبيهات',
    triggered: 'تم التفعيل!',
    active: 'نشط',
    remove: 'حذف',
    alertType: 'نوع التنبيه',
    value: 'القيمة',
    status: 'الحالة',
    priceAlert: 'تنبيه سعري',
    signalAlert: 'تنبيه إشارة',
    rsiAlert: 'تنبيه RSI',
    enterValue: 'أدخل القيمة...',
    currentPrice: 'السعر الحالي',
    createAlert: 'إنشاء تنبيه جديد',
    loading: 'جارٍ تحميل التنبيهات...',
    threshold: 'الحد',
  },
  fr: {
    smartAlerts: 'Alertes Intelligentes',
    priceAbove: 'Prix Au-Dessus',
    priceBelow: 'Prix En-Dessous',
    signalBullish: 'Signal → Haussier',
    signalBearish: 'Signal → Baissier',
    rsiOverbought: 'RSI Surachat (>70)',
    rsiOversold: 'RSI Survente (<30)',
    addAlert: 'Ajouter',
    activeAlerts: 'Alertes Actives',
    noAlerts: "Aucune alerte configurée",
    triggered: 'Déclenché!',
    active: 'Actif',
    remove: 'Supprimer',
    alertType: "Type d'Alerte",
    value: 'Valeur',
    status: 'Statut',
    priceAlert: 'Alerte de Prix',
    signalAlert: "Alerte de Signal",
    rsiAlert: 'Alerte RSI',
    enterValue: 'Entrez la valeur...',
    currentPrice: 'Prix Actuel',
    createAlert: 'Créer une Nouvelle Alerte',
    loading: 'Chargement des alertes...',
    threshold: 'Seuil',
  },
  tr: {
    smartAlerts: 'Akıllı Uyarılar',
    priceAbove: 'Fiyat Üstünde',
    priceBelow: 'Fiyat Altında',
    signalBullish: 'Sinyal → Yükseliş',
    signalBearish: 'Sinyal → Düşüş',
    rsiOverbought: 'RSI Aşırı Alım (>70)',
    rsiOversold: 'RSI Aşırı Satım (<30)',
    addAlert: 'Uyarı Ekle',
    activeAlerts: 'Aktif Uyarılar',
    noAlerts: 'Uyarı yok',
    triggered: 'Tetiklendi!',
    active: 'Aktif',
    remove: 'Sil',
    alertType: 'Uyarı Türü',
    value: 'Değer',
    status: 'Durum',
    priceAlert: 'Fiyat Uyarısı',
    signalAlert: 'Sinyal Uyarısı',
    rsiAlert: 'RSI Uyarısı',
    enterValue: 'Değer girin...',
    currentPrice: 'Mevcut Fiyat',
    createAlert: 'Yeni Uyarı Oluştur',
    loading: 'Uyarılar yükleniyor...',
    threshold: 'Eşik',
  },
  es: {
    smartAlerts: 'Alertas Inteligentes',
    priceAbove: 'Precio Por Encima',
    priceBelow: 'Precio Por Debajo',
    signalBullish: 'Señal → Alcista',
    signalBearish: 'Señal → Bajista',
    rsiOverbought: 'RSI Sobrecompra (>70)',
    rsiOversold: 'RSI Sobreventa (<30)',
    addAlert: 'Agregar Alerta',
    activeAlerts: 'Alertas Activas',
    noAlerts: 'No hay alertas configuradas',
    triggered: '¡Activada!',
    active: 'Activa',
    remove: 'Eliminar',
    alertType: 'Tipo de Alerta',
    value: 'Umbral',
    status: 'Estado',
    priceAlert: 'Alerta de Precio',
    signalAlert: 'Alerta de Señal',
    rsiAlert: 'Alerta RSI',
    enterValue: 'Ingrese valor...',
    currentPrice: 'Precio Actual',
    createAlert: 'Crear Nueva Alerta',
    loading: 'Cargando alertas...',
    threshold: 'Umbral',
  },
};

type AlertType = 'price_above' | 'price_below' | 'signal_bullish' | 'signal_bearish' | 'rsi_overbought' | 'rsi_oversold';

interface Alert {
  id: string;
  symbol: string;
  type: AlertType;
  value?: number;
  createdAt: string;
}

interface Props {
  symbol: string;
  currentPrice: number;
  locale: Locale;
}

export default function SmartAlerts({ symbol, currentPrice, locale }: Props) {
  const t = LABELS[locale] || LABELS.en;
  const isRTL = locale === 'ar';

  const storageKey = `smartAlerts_${symbol}`;

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedType, setSelectedType] = useState<AlertType>('price_above');
  const [alertValue, setAlertValue] = useState('');
  const [loading, setLoading] = useState(true);

  // Load alerts from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setAlerts(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, [storageKey]);

  // Save alerts to localStorage
  const saveAlerts = useCallback((newAlerts: Alert[]) => {
    setAlerts(newAlerts);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newAlerts));
    } catch {
      // ignore
    }
  }, [storageKey]);

  const addAlert = useCallback(() => {
    const needsValue = ['price_above', 'price_below'].includes(selectedType);
    const val = needsValue ? parseFloat(alertValue) : undefined;
    if (needsValue && (!val || val <= 0)) return;

    const newAlert: Alert = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      symbol,
      type: selectedType,
      value: val,
      createdAt: new Date().toISOString(),
    };
    saveAlerts([...alerts, newAlert]);
    setAlertValue('');
  }, [selectedType, alertValue, symbol, alerts, saveAlerts]);

  const removeAlert = useCallback((id: string) => {
    saveAlerts(alerts.filter(a => a.id !== id));
  }, [alerts, saveAlerts]);

  // Check if alert is triggered based on current price
  const isTriggered = (alert: Alert): boolean => {
    switch (alert.type) {
      case 'price_above': return currentPrice >= (alert.value || Infinity);
      case 'price_below': return currentPrice <= (alert.value || 0);
      case 'signal_bullish': return false; // Signal-based alerts require external data
      case 'signal_bearish': return false;
      case 'rsi_overbought': return false; // RSI-based alerts require external data
      case 'rsi_oversold': return false;
      default: return false;
    }
  };

  const typeLabels: Record<AlertType, string> = {
    price_above: t.priceAbove,
    price_below: t.priceBelow,
    signal_bullish: t.signalBullish,
    signal_bearish: t.signalBearish,
    rsi_overbought: t.rsiOverbought,
    rsi_oversold: t.rsiOversold,
  };

  const typeCategory = (type: AlertType) => {
    if (type.startsWith('price')) return t.priceAlert;
    if (type.startsWith('signal')) return t.signalAlert;
    return t.rsiAlert;
  };

  const typeCategoryColor = (type: AlertType) => {
    if (type.startsWith('price')) return { color: 'var(--cyan)', bg: 'var(--cyan2)' };
    if (type.startsWith('signal')) return { color: 'var(--gold)', bg: 'var(--gold2)' };
    return { color: 'var(--purple)', bg: 'var(--purple2)' };
  };

  const needsValueInput = (type: AlertType) => ['price_above', 'price_below'].includes(type);

  const fmt = (n: number, dec = 2) => n.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });

  // Loading state
  if (loading) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="glass-card" style={{ borderRadius: 12, padding: 20, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--cyan2)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>{t.smartAlerts}</span>
        </div>
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text3)', fontSize: 13, borderRadius: 8, background: 'var(--bg)' }}>
          {t.loading}
        </div>
      </div>
    );
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="glass-card" style={{ borderRadius: 12, padding: 20, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--cyan2)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>{t.smartAlerts}</span>
      </div>

      {/* Current Price Badge */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 6, background: 'var(--cyan2)', color: 'var(--cyan)', fontWeight: 600, border: '1px solid var(--border2)' }}>
          {t.currentPrice}: <span style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontWeight: 700 }} suppressHydrationWarning>${fmt(currentPrice)}</span>
        </span>
        <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 6, background: 'var(--bg)', color: 'var(--text3)', fontWeight: 600, border: '1px solid var(--border)' }}>
          {symbol}
        </span>
      </div>

      {/* ── Create Alert Form ── */}
      <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg)', marginBottom: 16, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginBottom: 10 }}>{t.createAlert}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 160px' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginBottom: 4 }}>{t.alertType}</div>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value as AlertType)}
              style={{
                width: '100%', padding: '8px 10px', borderRadius: 6,
                border: '1px solid var(--border)', background: 'var(--bg2)',
                color: 'var(--text-head)', fontSize: 12, fontWeight: 600,
                outline: 'none',
              }}
            >
              {(Object.keys(typeLabels) as AlertType[]).map(type => (
                <option key={type} value={type}>{typeLabels[type]}</option>
              ))}
            </select>
          </div>
          {needsValueInput(selectedType) && (
            <div style={{ flex: '0 1 120px' }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginBottom: 4 }}>{t.threshold}</div>
              <input
                type="number"
                value={alertValue}
                onChange={e => setAlertValue(e.target.value)}
                placeholder={t.enterValue}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 6,
                  border: '1px solid var(--border)', background: 'var(--bg2)',
                  color: 'var(--text-head)', fontSize: 12, fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>
          )}
          <button
            onClick={addAlert}
            style={{
              padding: '8px 16px', borderRadius: 8,
              border: 'none', background: 'var(--cyan)',
              color: 'var(--bg)', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', transition: 'opacity 0.15s',
            }}
          >
            {t.addAlert}
          </button>
        </div>
      </div>

      {/* ── Active Alerts List ── */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-head)', marginBottom: 10 }}>{t.activeAlerts}</div>
        {alerts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
            {alerts.map(alert => {
              const triggered = isTriggered(alert);
              const catStyle = typeCategoryColor(alert.type);
              return (
                <div key={alert.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', borderRadius: 8, background: 'var(--bg)',
                  border: triggered ? '1px solid var(--bull)' : '1px solid var(--border)',
                  boxShadow: triggered ? '0 0 8px rgba(34,197,94,0.15)' : 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-head)' }}>{typeLabels[alert.type]}</span>
                      {alert.value && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cyan)', fontFamily: 'var(--font-jetbrains-mono), monospace' }} suppressHydrationWarning>
                          ${fmt(alert.value)}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 10, color: catStyle.color, fontWeight: 600, padding: '1px 6px', borderRadius: 3, background: catStyle.bg, width: 'fit-content' }}>
                      {typeCategory(alert.type)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 5,
                      background: triggered ? 'var(--bull2)' : 'var(--bg4)',
                      color: triggered ? 'var(--bull)' : 'var(--text3)',
                      animation: triggered ? 'smartAlertPulse 2s infinite' : 'none',
                      border: triggered ? '1px solid rgba(34,197,94,0.3)' : '1px solid transparent',
                    }}>
                      {triggered ? t.triggered : t.active}
                    </span>
                    <button
                      onClick={() => removeAlert(alert.id)}
                      style={{
                        padding: '4px 10px', borderRadius: 5, border: '1px solid var(--border)',
                        background: 'transparent', color: 'var(--bear)', fontSize: 10,
                        fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s',
                      }}
                    >
                      {t.remove}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', borderRadius: 8, background: 'var(--bg)', color: 'var(--text3)', fontSize: 12, border: '1px solid var(--border)' }}>
            {t.noAlerts}
          </div>
        )}
      </div>

      <style>{`@keyframes smartAlertPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}

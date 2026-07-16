'use client';

import { useState } from 'react';
import type { Locale } from '@/components/analysis-v2/locales';
import s from './RiskCalculator.module.css';

interface RiskCalculatorProps {
  locale?: Locale;
}

const TEXT: Record<Locale, {
  title: string;
  subtitle: string;
  capital: string;
  riskPct: string;
  entryPrice: string;
  stopLoss: string;
  riskAmount: string;
  lots: string;
  units: string;
  rewardRisk: string;
}> = {
  ar: {
    title: 'حاسبة المخاطر',
    subtitle: 'إدارة حجم الصفقة',
    capital: 'رأس المال ($)',
    riskPct: 'نسبة المخاطرة (%)',
    entryPrice: 'سعر الدخول',
    stopLoss: 'وقف الخسارة',
    riskAmount: 'مبلغ المخاطرة',
    lots: 'عدد اللوتات',
    units: 'حجم الصفقة (Units)',
    rewardRisk: 'المكافأة/المخاطرة (1:R)',
  },
  en: {
    title: 'Risk Calculator',
    subtitle: 'Position Size Management',
    capital: 'Capital ($)',
    riskPct: 'Risk (%)',
    entryPrice: 'Entry Price',
    stopLoss: 'Stop Loss',
    riskAmount: 'Risk Amount',
    lots: 'Lots',
    units: 'Position Size (Units)',
    rewardRisk: 'Reward/Risk (1:R)',
  },
  fr: {
    title: 'Calculateur de Risque',
    subtitle: 'Gestion de la taille de position',
    capital: 'Capital ($)',
    riskPct: 'Risque (%)',
    entryPrice: "Prix d'entrée",
    stopLoss: 'Stop Loss',
    riskAmount: 'Montant du risque',
    lots: 'Lots',
    units: 'Taille de position (Unités)',
    rewardRisk: 'Récompense/Risque (1:R)',
  },
  tr: {
    title: 'Risk Hesaplayıcı',
    subtitle: 'Pozisyon Büyüklüğü Yönetimi',
    capital: 'Sermaye ($)',
    riskPct: 'Risk (%)',
    entryPrice: 'Giriş Fiyatı',
    stopLoss: 'Zarar Durdur',
    riskAmount: 'Risk Tutarı',
    lots: 'Lot Sayısı',
    units: 'Pozisyon Büyüklüğü (Birim)',
    rewardRisk: 'Ödül/Risk (1:R)',
  },
  es: {
    title: 'Calculadora de Riesgo',
    subtitle: 'Gestión del tamaño de posición',
    capital: 'Capital ($)',
    riskPct: 'Riesgo (%)',
    entryPrice: 'Precio de entrada',
    stopLoss: 'Stop Loss',
    riskAmount: 'Monto de riesgo',
    lots: 'Lotes',
    units: 'Tamaño de posición (Unidades)',
    rewardRisk: 'Recompensa/Riesgo (1:R)',
  },
};

export default function RiskCalculator({ locale = 'ar' }: RiskCalculatorProps) {
  const [capital, setCapital] = useState(10000);
  const [riskPct, setRiskPct] = useState(1);
  const [entry, setEntry] = useState(1.0843);
  const [stopLoss, setStopLoss] = useState(1.0800);

  const txt = TEXT[locale] || TEXT.ar;

  const riskDollar = capital * (riskPct / 100);
  const slDistance = Math.abs(entry - stopLoss);
  const lots = slDistance > 0 ? riskDollar / (slDistance * 100000) : 0;
  const units = lots * 100000;

  return (
    <div className={s.riskPanel}>
      <div className={s.riskPanelHeader}>
        <div className={s.riskPanelIcon}>🛡️</div>
        <div>
          <div className={s.riskPanelTitle}>{txt.title}</div>
          <div className={s.riskPanelSub}>{txt.subtitle}</div>
        </div>
      </div>
      <div className={s.riskPanelBody}>
        <div className={s.riskFormGrid}>
          <div className={s.riskInputGroup}>
            <label className={s.riskInputLbl}>{txt.capital}</label>
            <input type="number" value={capital} onChange={e => setCapital(+e.target.value)} className={s.riskInput} />
          </div>
          <div className={s.riskInputGroup}>
            <label className={s.riskInputLbl}>{txt.riskPct}</label>
            <input type="number" value={riskPct} onChange={e => setRiskPct(+e.target.value)} className={s.riskInput} step="0.5" />
          </div>
          <div className={s.riskInputGroup}>
            <label className={s.riskInputLbl}>{txt.entryPrice}</label>
            <input type="number" value={entry} onChange={e => setEntry(+e.target.value)} className={s.riskInput} step="0.0001" />
          </div>
          <div className={s.riskInputGroup}>
            <label className={s.riskInputLbl}>{txt.stopLoss}</label>
            <input type="number" value={stopLoss} onChange={e => setStopLoss(+e.target.value)} className={s.riskInput} step="0.0001" />
          </div>
        </div>
        <div className={s.riskResults}>
          <div className={s.riskResultRow}>
            <span className={s.riskResultLabel}>{txt.riskAmount}</span>
            <span className={s.riskResultValue} style={{ color: 'var(--bear)' }}>${riskDollar.toFixed(2)}</span>
          </div>
          <div className={s.riskResultRow}>
            <span className={s.riskResultLabel}>{txt.lots}</span>
            <span className={s.riskResultValue}>{lots.toFixed(2)}</span>
          </div>
          <div className={s.riskResultRow}>
            <span className={s.riskResultLabel}>{txt.units}</span>
            <span className={s.riskResultValue}>{Math.round(units).toLocaleString()}</span>
          </div>
          <div className={s.riskResultRow}>
            <span className={s.riskResultLabel}>{txt.rewardRisk}</span>
            <span className={s.riskResultValue}>
              {riskDollar > 0 ? `1:${(capital * 0.02 / riskDollar).toFixed(1)}` : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Turkish Ru'aa AI Advisor Page ────────────────────────────────
// Full implementation mirrors the English advisor page with Turkish translations
// Design is identical to the English version — LTR direction

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import dynamicImport from 'next/dynamic';
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Shield,
  BookOpen,
  RefreshCw,
  CheckCircle2,
  X,
  ChevronDown,
  BarChart3,
  Target,
  Lightbulb,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  BellOff,
  Clock,
  DollarSign,
  Award,
  TrendingDown,
  Eye,
  Activity,
} from 'lucide-react';

interface Recommendation {
  id: string;
  type: string;
  title: string;
  titleEn?: string;
  summary: string;
  reasoning: string;
  actionItems: string[];
  relatedAssetClasses: string[];
  relatedSymbols: string[];
  confidenceScore: number;
  urgencyLevel: string;
  validFrom: string;
  validUntil: string;
  isRead: boolean;
  isActioned: boolean;
  createdAt: string;
  reportId?: string;
  reportSlug?: string;
  reportTitle?: string;
  asset?: string;
  action?: string;
  entryPrice?: string;
  targetPrice?: string;
  stopLoss?: string;
  timeHorizon?: string;
  allocationPercent?: string;
  feedbackType?: string;
  executedAt?: string;
  executionPrice?: string;
  actualProfitLoss?: number;
  isSuccessful?: boolean;
  sourceData?: {
    livePrice?: number;
    priceSource?: string;
    targetChangePercent?: string;
    stopLossChangePercent?: string;
    livePriceUnavailable?: boolean;
  };
}

interface Profile {
  experienceLevel: string;
  riskTolerance: string;
  investmentHorizon: string;
  onboardingComplete: boolean;
  advisorEnabled: boolean;
  lastAdvisorRun: string | null;
  preferredAssets?: string[];
  excludedAssets?: string[];
  minConfidenceScore?: number;
  successRate?: number;
  allowGeneralRecommendations?: boolean;
}

interface Stats {
  total: number;
  unread: number;
  critical: number;
  high: number;
  actioned: number;
  estimatedSuccessRate: number;
}

// V229→V341: Trading Operations Room Dashboard (unified — locale prop)
const TradingOpsDashboard = dynamicImport(() => import('@/components/advisor/TradingOpsDashboard'), {
  ssr: false,
});

const TYPE_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  asset_focus: { icon: Target, label: 'Varlık Odak', color: '#00E5FF' },
  market_opportunity: { icon: TrendingUp, label: 'Piyasa Fırsatı', color: '#22C55E' },
  risk_alert: { icon: AlertTriangle, label: 'Risk Uyarısı', color: '#EF5350' },
  portfolio_rebalance: { icon: BarChart3, label: 'Yeniden Dengeleme', color: '#FFB800' },
  educational: { icon: BookOpen, label: 'Eğitim', color: '#8B5CF6' },
};

// Support both Arabic (from DB) and English/French action keys
const ACTION_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  'buy': { label: 'Al', color: '#22C55E', icon: TrendingUp },
  'sell': { label: 'Sat', color: '#EF5350', icon: TrendingDown },
  'accumulate': { label: 'Biriktir', color: '#00E5FF', icon: TrendingUp },
  'monitor': { label: 'İzle', color: '#FFB800', icon: Eye },
  'شراء': { label: 'Al', color: '#22C55E', icon: TrendingUp },
  'بيع': { label: 'Sat', color: '#EF5350', icon: TrendingDown },
  'تجميع': { label: 'Biriktir', color: '#00E5FF', icon: TrendingUp },
  'مراقبة': { label: 'İzle', color: '#FFB800', icon: Eye },
};

const URGENCY_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: 'Düşük', color: '#64748B' },
  normal: { label: 'Normal', color: '#00E5FF' },
  high: { label: 'Yüksek', color: '#FFB800' },
  critical: { label: 'Kritik', color: '#EF5350' },
};

export default function TrAdvisorPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, unread: 0, critical: 0, high: 0, actioned: 0, estimatedSuccessRate: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [showExecutionModal, setShowExecutionModal] = useState<string | null>(null);
  const [executionPriceInput, setExecutionPriceInput] = useState('');
  const [refreshingPrices, setRefreshingPrices] = useState(false);

  const getUserId = useCallback((): string | null => {
    if (session?.user?.id) {
      localStorage.setItem('rouaa_user_id', session.user.id);
      return session.user.id;
    }
    return localStorage.getItem('rouaa_user_id');
  }, [session]);

  useEffect(() => {
    if (session?.user?.id) {
      localStorage.setItem('rouaa_user_id', session.user.id);
    }
  }, [session]);

  const fetchRecommendations = useCallback(async () => {
    try {
      try {
        await fetch('/api/advisor/setup', { method: 'POST' });
      } catch {}

      const userId = getUserId();
      if (!userId) {
        setNeedsOnboarding(true);
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/advisor?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
        setProfile(data.profile);
        setStats(data.stats || { total: 0, unread: 0, critical: 0, high: 0, actioned: 0, estimatedSuccessRate: 0 });

        if (!data.profile || !data.profile.onboardingComplete) {
          setNeedsOnboarding(true);
        }
      }
    } catch (error) {
      console.error('Tavsiyeler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleGenerate = async () => {
    const userId = getUserId();
    if (!userId) return;

    setGenerating(true);
    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'generate' }),
      });

      if (res.ok) {
        await fetchRecommendations();
      }
    } catch (error) {
      console.error('Tavsiyeler oluşturulamadı:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleAction = async (recId: string, action: string) => {
    try {
      const res = await fetch('/api/advisor/recommendation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId: recId, action }),
      });

      if (res.ok) {
        await fetchRecommendations();
        if (action === 'read' && selectedRec?.id === recId) {
          setSelectedRec(null);
        }
      }
    } catch (error) {
      console.error('Güncelleme başarısız:', error);
    }
  };

  const handleRefreshPrices = async () => {
    const userId = getUserId();
    if (!userId) return;

    setRefreshingPrices(true);
    try {
      const res = await fetch('/api/advisor/refresh-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        await fetchRecommendations();
      }
    } catch (error) {
      console.error('Fiyatlar yenilenirken hata oluştu:', error);
    } finally {
      setRefreshingPrices(false);
    }
  };

  const handleFeedback = async (recId: string, feedbackType: string, executionPrice?: string) => {
    try {
      const res = await fetch('/api/advisor/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendationId: recId,
          feedbackType,
          executionPrice: executionPrice || undefined,
        }),
      });

      if (res.ok) {
        setShowExecutionModal(null);
        setExecutionPriceInput('');
        await fetchRecommendations();
      }
    } catch (error) {
      console.error('Geri bildirim kaydedilirken hata oluştu:', error);
    }
  };

  const filteredRecs = recommendations.filter(r => {
    if (filter === 'unread') return !r.isRead;
    if (filter === 'critical') return r.urgencyLevel === 'critical' || r.urgencyLevel === 'high';
    return true;
  });

  // Needs onboarding state
  if (needsOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ paddingTop: '80px', background: 'var(--bg)' }}>
        <div className="glass-card text-center" style={{ padding: '40px', maxWidth: '480px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'var(--purple2)', border: '1px solid rgba(139,92,246,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Sparkles size={28} style={{ color: 'var(--purple)' }} />
          </div>
          <h1 className="heading-lg mb-3" style={{ fontSize: '22px' }}>Ru&apos;aa Danışmanı Etkinleştir</h1>
          <p className="body-text mb-6">
            Profilinize ve hedeflerinize dayalı kişiselleştirilmiş yatırım tavsiyeleri almak için hızlı kurulumu tamamlayın
          </p>
          <a
            href="/tr/onboarding"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '12px 28px', borderRadius: '10px',
              background: 'var(--cyan)', color: '#000',
              fontSize: '15px', fontWeight: 700, textDecoration: 'none',
            }}
          >
            <Sparkles size={16} />
            Kurulumu Başlat
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" dir="ltr" style={{ paddingTop: '80px', background: 'var(--bg)' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* Header — V229: Operations Room */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(0,229,255,0.12), rgba(139,92,246,0.12))',
                border: '1px solid rgba(0,229,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Activity size={22} style={{ color: 'var(--cyan)' }} />
              </div>
              <div>
                <h1 className="heading-lg" style={{ fontSize: '22px' }}>Ru&apos;aa Operasyon Odası</h1>
                <p className="body-text" style={{ fontSize: 12, marginTop: 2 }}>Trader Paneli — Canlı Veriler ve Akıllı Tavsiyeler</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleRefreshPrices}
              disabled={refreshingPrices}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 14px', borderRadius: '10px',
                background: refreshingPrices ? 'var(--bg5)' : 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.3)',
                color: refreshingPrices ? 'var(--text4)' : '#22C55E',
                fontSize: '13px', fontWeight: 600,
                cursor: refreshingPrices ? 'not-allowed' : 'pointer',
              }}
            >
              <DollarSign size={14} className={refreshingPrices ? 'animate-spin' : ''} />
              {refreshingPrices ? 'Güncelleniyor...' : 'Fiyatları Güncelle'}
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '10px',
                background: generating ? 'var(--bg5)' : 'var(--cyan)',
                border: 'none',
                color: generating ? 'var(--text4)' : '#000',
                fontSize: '14px', fontWeight: 700,
                cursor: generating ? 'not-allowed' : 'pointer',
              }}
            >
              <RefreshCw size={16} className={generating ? 'animate-spin' : ''} />
              {generating ? 'Oluşturuluyor...' : 'Yeni Tavsiyeler'}
            </button>
          </div>
        </div>

        {/* ═══ V341: Trading Operations Dashboard (unified) ═══ */}
        <TradingOpsDashboard locale="tr" />

        {/* ── Smart Recommendations Section ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 8 }}>
          <div style={{ width: 3, height: 18, borderRadius: 2, background: 'linear-gradient(180deg, var(--cyan), var(--purple))', boxShadow: '0 0 8px rgba(0,229,255,.3)' }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-head)' }}>Akıllı Tavsiyeler</span>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Aktif Tavsiyeler', value: stats.total, color: 'var(--cyan)', icon: Target },
            { label: 'Okunmamış', value: stats.unread, color: 'var(--purple)', icon: Eye },
            { label: 'Acil/Kritik', value: stats.critical + stats.high, color: 'var(--bear)', icon: AlertTriangle },
            { label: 'Uygulanan', value: stats.actioned, color: 'var(--bull)', icon: CheckCircle2 },
            { label: 'Başarı Oranı', value: `${stats.estimatedSuccessRate}%`, color: '#FFB800', icon: Award },
          ].map(stat => (
            <div key={stat.label} className="glass-card" style={{ padding: '14px', textAlign: 'center' }}>
              <stat.icon size={16} style={{ color: stat.color, margin: '0 auto 6px' }} />
              <div className="data-value" style={{ fontSize: '22px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div className="caption-text" style={{ fontSize: '11px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Profile Summary */}
        {profile && (
          <div className="glass-card mb-6" style={{ padding: '14px 18px' }}>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Shield size={14} style={{ color: 'var(--cyan)' }} />
                <span className="caption-text">Risk toleransı:</span>
                <span className="heading-sm" style={{ fontSize: '12px' }}>
                  {profile.riskTolerance === 'conservative' ? 'Muhafazakar' : profile.riskTolerance === 'aggressive' ? 'Agresif' : 'Ilımlı'}
                </span>
              </div>
              <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
              <div className="flex items-center gap-2">
                <BarChart3 size={14} style={{ color: 'var(--purple)' }} />
                <span className="caption-text">Deneyim:</span>
                <span className="heading-sm" style={{ fontSize: '12px' }}>
                  {profile.experienceLevel === 'beginner' ? 'Başlangıç' : profile.experienceLevel === 'professional' ? 'Profesyonel' : profile.experienceLevel === 'advanced' ? 'İleri' : 'Orta'}
                </span>
              </div>
              {profile.preferredAssets && profile.preferredAssets.length > 0 && (
                <>
                  <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
                  <div className="flex items-center gap-2">
                    <Target size={14} style={{ color: '#22C55E' }} />
                    <span className="caption-text">Varlıklar:</span>
                    <span className="heading-sm" style={{ fontSize: '12px', color: '#22C55E' }}>
                      {profile.preferredAssets.map(a => {
                        const labels: Record<string, string> = { crypto: 'Kripto', forex: 'Forex', commodities: 'Emtalar', realEstate: 'Gayrimenkul', stocks: 'Hisse Senetleri', indices: 'Endeksler' };
                        return labels[a] || a;
                      }).join(', ')}
                    </span>
                  </div>
                </>
              )}
              {profile.successRate !== undefined && profile.successRate > 0 && (
                <>
                  <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
                  <div className="flex items-center gap-2">
                    <Award size={14} style={{ color: '#FFB800' }} />
                    <span className="caption-text">Başarı oranı:</span>
                    <span className="heading-sm" style={{ fontSize: '12px', color: '#FFB800' }}>
                      {profile.successRate.toFixed(0)}%
                    </span>
                  </div>
                </>
              )}
              <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
              <button
                onClick={async () => {
                  const userId = getUserId();
                  if (!userId) return;
                  const newVal = !profile.allowGeneralRecommendations;
                  await fetch('/api/advisor/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, allowGeneralRecommendations: newVal }),
                  });
                  await fetchRecommendations();
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '4px 10px', borderRadius: '6px',
                  background: profile.allowGeneralRecommendations ? 'rgba(34,197,94,0.1)' : 'var(--bg4)',
                  border: `1px solid ${profile.allowGeneralRecommendations ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                  color: profile.allowGeneralRecommendations ? '#22C55E' : 'var(--text4)',
                  fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                <Lightbulb size={11} />
                {profile.allowGeneralRecommendations ? 'Genel Tavsiyeler ✓' : 'Yalnızca Kişiselleştirilmiş'}
              </button>
              <a href="/tr/onboarding" style={{ color: 'var(--cyan)', fontSize: '12px', fontWeight: 600 }}>
                Profili düzenle →
              </a>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'unread', label: 'Okunmamış' },
            { id: 'critical', label: 'Acil' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              style={{
                padding: '6px 16px', borderRadius: '8px',
                background: filter === f.id ? 'var(--cyan2)' : 'var(--bg4)',
                border: `1px solid ${filter === f.id ? 'var(--cyan)' : 'var(--border)'}`,
                color: filter === f.id ? 'var(--cyan)' : 'var(--text3)',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Recommendations List */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--cyan)', margin: '0 auto 12px' }} />
            <p className="body-text">Tavsiyeler yükleniyor...</p>
          </div>
        ) : filteredRecs.length === 0 ? (
          <div className="glass-card text-center" style={{ padding: '40px' }}>
            <Lightbulb size={32} style={{ color: 'var(--text4)', margin: '0 auto 12px' }} />
            <h3 className="heading-md mb-2" style={{ fontSize: '16px' }}>Şu anda tavsiye bulunmuyor</h3>
            <p className="body-text mb-4">
              {recommendations.length === 0
                ? 'Raporlara ve tercih ettiğiniz piyasalara dayalı kişiselleştirilmiş tavsiyeler oluşturmak için "Yeni Tavsiyeler" butonuna tıklayın'
                : 'Filtreyi değiştirmeyi deneyin veya farklı tavsiyeler oluşturmak için yeni raporları bekleyin'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleGenerate}
                disabled={generating}
                style={{
                  padding: '10px 24px', borderRadius: '10px',
                  background: 'var(--cyan)', border: 'none',
                  color: '#000', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                }}
              >
                Tavsiyeleri Oluştur
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredRecs.map(rec => {
              const typeConfig = TYPE_CONFIG[rec.type] || TYPE_CONFIG.market_opportunity;
              const urgency = URGENCY_LABELS[rec.urgencyLevel] || URGENCY_LABELS.normal;
              const actionConfig = rec.action ? ACTION_CONFIG[rec.action] : null;
              const Icon = typeConfig.icon;
              const isSelected = selectedRec?.id === rec.id;
              const hasFeedback = !!rec.feedbackType;

              return (
                <div key={rec.id}>
                  <div
                    className="glass-card"
                    style={{
                      padding: '16px',
                      cursor: 'pointer',
                      borderColor: isSelected ? typeConfig.color : rec.isRead ? 'var(--border)' : `${typeConfig.color}40`,
                      background: rec.isRead ? 'var(--surface-1)' : `${typeConfig.color}05`,
                      opacity: hasFeedback && rec.feedbackType !== 'useful' ? 0.7 : 1,
                    }}
                    onClick={() => {
                      setSelectedRec(isSelected ? null : rec);
                      if (!rec.isRead) handleAction(rec.id, 'read');
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Type Icon */}
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: `${typeConfig.color}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, border: `1px solid ${typeConfig.color}30`,
                      }}>
                        <Icon size={18} style={{ color: typeConfig.color }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Badges Row */}
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {actionConfig && (
                            <span style={{
                              padding: '2px 8px', borderRadius: '4px',
                              background: `${actionConfig.color}20`, color: actionConfig.color,
                              fontSize: '11px', fontWeight: 700,
                              display: 'flex', alignItems: 'center', gap: '3px',
                            }}>
                              <actionConfig.icon size={10} />
                              {actionConfig.label}
                            </span>
                          )}
                          <span style={{
                            padding: '2px 8px', borderRadius: '4px',
                            background: `${urgency.color}15`, color: urgency.color,
                            fontSize: '11px', fontWeight: 700,
                          }}>
                            {urgency.label}
                          </span>
                          <span style={{ color: 'var(--text4)', fontSize: '11px' }}>
                            {typeConfig.label}
                          </span>
                          {!rec.isRead && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--cyan)' }} />}
                          {hasFeedback && (
                            <span style={{
                              padding: '1px 6px', borderRadius: '3px',
                              background: rec.feedbackType === 'executed' ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)',
                              color: rec.feedbackType === 'executed' ? '#22C55E' : '#64748B',
                              fontSize: '10px', fontWeight: 600,
                            }}>
                              {rec.feedbackType === 'executed' ? 'Uygulandı' : rec.feedbackType === 'ignored' ? 'Yoksayıldı' : rec.feedbackType === 'dismissed' ? 'Reddedildi' : rec.feedbackType === 'useful' ? 'Faydalı' : rec.feedbackType === 'not_useful' ? 'Faydalı değil' : ''}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="heading-sm" style={{ fontSize: '14px', marginBottom: '4px' }}>
                          {rec.asset ? `${rec.asset} üzerine tavsiye` : rec.title}
                        </h3>
                        <p className="caption-text" style={{ lineHeight: 1.6 }}>{rec.summary}</p>

                        {/* Price Levels */}
                        {(rec.entryPrice || rec.targetPrice || rec.stopLoss) && (
                          <div className="flex flex-wrap gap-3 mt-3" style={{
                            background: 'rgba(11,14,20,0.5)',
                            borderRadius: '8px', padding: '10px 14px',
                            border: '1px solid var(--border)',
                          }}>
                            {rec.entryPrice && (
                              <div className="flex items-center gap-1">
                                <DollarSign size={12} style={{ color: 'var(--cyan)' }} />
                                <span className="caption-text" style={{ fontSize: '11px' }}>Giriş:</span>
                                <span className="heading-sm" style={{ fontSize: '13px', color: 'var(--cyan)' }}>{rec.entryPrice}</span>
                              </div>
                            )}
                            {rec.targetPrice && (
                              <div className="flex items-center gap-1">
                                <TrendingUp size={12} style={{ color: '#22C55E' }} />
                                <span className="caption-text" style={{ fontSize: '11px' }}>Hedef:</span>
                                <span className="heading-sm" style={{ fontSize: '13px', color: '#22C55E' }}>{rec.targetPrice}</span>
                                {rec.sourceData?.targetChangePercent && (
                                  <span style={{ fontSize: '10px', color: '#22C55E', fontWeight: 600 }}>
                                    ({rec.sourceData.targetChangePercent})
                                  </span>
                                )}
                              </div>
                            )}
                            {rec.stopLoss && (
                              <div className="flex items-center gap-1">
                                <TrendingDown size={12} style={{ color: '#EF5350' }} />
                                <span className="caption-text" style={{ fontSize: '11px' }}>Zarar Durdur:</span>
                                <span className="heading-sm" style={{ fontSize: '13px', color: '#EF5350' }}>{rec.stopLoss}</span>
                                {rec.sourceData?.stopLossChangePercent && (
                                  <span style={{ fontSize: '10px', color: '#EF5350', fontWeight: 600 }}>
                                    ({rec.sourceData.stopLossChangePercent})
                                  </span>
                                )}
                              </div>
                            )}
                            {rec.timeHorizon && (
                              <div className="flex items-center gap-1">
                                <Clock size={12} style={{ color: 'var(--text3)' }} />
                                <span className="caption-text" style={{ fontSize: '11px' }}>{rec.timeHorizon}</span>
                              </div>
                            )}
                            {rec.allocationPercent && (
                              <div className="flex items-center gap-1">
                                <BarChart3 size={12} style={{ color: '#FFB800' }} />
                                <span className="caption-text" style={{ fontSize: '11px' }}>Dağılım:</span>
                                <span className="heading-sm" style={{ fontSize: '13px', color: '#FFB800' }}>{rec.allocationPercent}</span>
                              </div>
                            )}
                            {rec.sourceData?.priceSource === 'api' && (
                              <div className="flex items-center gap-1" style={{ opacity: 0.6 }}>
                                <span style={{ fontSize: '9px', color: 'var(--text4)' }}>Canlı fiyat</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Source Report Link */}
                        {rec.reportSlug && (
                          <a
                            href={`/tr/reports/${rec.reportSlug}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              marginTop: '8px', fontSize: '12px', fontWeight: 600,
                              color: 'var(--cyan)', textDecoration: 'none',
                              padding: '4px 10px', borderRadius: '6px',
                              background: 'var(--cyan2)', border: '1px solid rgba(0,229,255,0.2)',
                            }}
                          >
                            <ExternalLink size={12} />
                            Tam raporu oku
                          </a>
                        )}

                        {/* Confidence Bar */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="caption-text" style={{ fontSize: '11px' }}>Güven:</span>
                          <div style={{ flex: 1, maxWidth: '120px', height: '4px', borderRadius: '2px', background: 'var(--bg5)' }}>
                            <div style={{
                              width: `${rec.confidenceScore}%`, height: '100%', borderRadius: '2px',
                              background: rec.confidenceScore >= 70 ? '#22C55E' : rec.confidenceScore >= 50 ? '#FFB800' : '#EF5350',
                              transition: 'width 0.3s ease',
                            }} />
                          </div>
                          <span className="data-value" style={{ fontSize: '11px', color: 'var(--text3)' }}>{rec.confidenceScore}%</span>
                          {rec.confidenceScore < 50 && (
                            <span style={{ fontSize: '10px', color: '#EF5350', fontWeight: 600 }}>Düşük</span>
                          )}
                        </div>

                        {/* Feedback Buttons */}
                        {!hasFeedback && (
                          <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setShowExecutionModal(rec.id)}
                              style={{
                                padding: '6px 12px', borderRadius: '6px',
                                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                                color: '#22C55E', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '3px',
                              }}
                            >
                              <CheckCircle2 size={12} />
                              Uygulandı
                            </button>
                            <button
                              onClick={() => handleFeedback(rec.id, 'useful')}
                              style={{
                                padding: '6px 12px', borderRadius: '6px',
                                background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)',
                                color: 'var(--cyan)', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '3px',
                              }}
                            >
                              <ThumbsUp size={12} />
                              Faydalı
                            </button>
                            <button
                              onClick={() => handleFeedback(rec.id, 'not_useful')}
                              style={{
                                padding: '6px 12px', borderRadius: '6px',
                                background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)',
                                color: 'var(--text3)', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '3px',
                              }}
                            >
                              <ThumbsDown size={12} />
                              Faydalı değil
                            </button>
                            <button
                              onClick={() => handleFeedback(rec.id, 'ignored')}
                              style={{
                                padding: '6px 12px', borderRadius: '6px',
                                background: 'var(--bg4)', border: '1px solid var(--border)',
                                color: 'var(--text4)', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '3px',
                              }}
                            >
                              <BellOff size={12} />
                              Yoksay
                            </button>
                          </div>
                        )}

                        {/* Executed Recommendation Result */}
                        {rec.actualProfitLoss !== null && rec.actualProfitLoss !== undefined && (
                          <div className="mt-3" style={{
                            padding: '8px 12px', borderRadius: '6px',
                            background: rec.actualProfitLoss >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,83,80,0.1)',
                            border: `1px solid ${rec.actualProfitLoss >= 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,83,80,0.3)'}`,
                          }}>
                            <span style={{
                              fontSize: '13px', fontWeight: 700,
                              color: rec.actualProfitLoss >= 0 ? '#22C55E' : '#EF5350',
                            }}>
                              {rec.actualProfitLoss >= 0 ? '+' : ''}{rec.actualProfitLoss.toFixed(2)}%
                            </span>
                            <span className="caption-text" style={{ fontSize: '11px', marginLeft: '8px' }}>
                              {rec.isSuccessful ? 'Hedefe ulaşıldı' : 'Hedefe henüz ulaşılamadı'}
                            </span>
                          </div>
                        )}
                      </div>

                      <ChevronDown size={16} style={{ color: 'var(--text4)', transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }} />
                    </div>

                    {/* Expanded Details */}
                    {isSelected && (
                      <div className="mt-4" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                        {rec.reasoning && (
                          <div className="mb-4">
                            <h4 className="heading-sm mb-2" style={{ fontSize: '13px' }}>Gerekçe</h4>
                            <p className="body-text" style={{ fontSize: '13px' }}>{rec.reasoning}</p>
                          </div>
                        )}

                        {rec.actionItems?.length > 0 && (
                          <div className="mb-4">
                            <h4 className="heading-sm mb-2" style={{ fontSize: '13px' }}>Eylem Adımları</h4>
                            <div className="flex flex-col gap-2">
                              {rec.actionItems.map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <div style={{
                                    width: '20px', height: '20px', borderRadius: '4px',
                                    background: 'var(--cyan2)', border: '1px solid var(--cyan)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '10px', color: 'var(--cyan)', fontWeight: 700, flexShrink: 0,
                                  }}>
                                    {i + 1}
                                  </div>
                                  <span className="body-text" style={{ fontSize: '13px' }}>{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

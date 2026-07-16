// ─── Turkish Stratejik Raporlar Dashboard ───────────────────────
// Same design but LTR, Turkish UI, Turkish options.
// Generates via /api/reports/generate with locale='tr', type='special'

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
  { value: 'Arab World & Middle East', label: 'Arap Dünyası & Orta Doğu', icon: '🌍' },
  { value: 'Arabian Gulf', label: 'Arap Körfezi', icon: '🏜️' },
  { value: 'North Africa', label: 'Kuzey Afrika', icon: '🌴' },
  { value: 'Global', label: 'Küresel', icon: '🌐' },
  { value: 'United States & Europe', label: 'Amerika & Avrupa', icon: '🏛️' },
  { value: 'Asia Pacific', label: 'Asya Pasifik', icon: '🌏' },
];

const SECTOR_OPTIONS = [
  { value: 'Macroeconomics', label: 'Makroekonomi' },
  { value: 'Equities', label: 'Hisseler' },
  { value: 'Energy', label: 'Enerji' },
  { value: 'Forex', label: 'Forex' },
  { value: 'Cryptocurrencies', label: 'Kripto Paralar' },
  { value: 'Commodities', label: 'Emtialar' },
  { value: 'Real Estate', label: 'Gayrimenkul' },
  { value: 'Central Banks', label: 'Merkez Bankaları' },
  { value: 'Corporate Earnings', label: 'Kurumsal Kazançlar' },
  { value: 'Arab Markets', label: 'Arap Piyasaları' },
  { value: 'Technology', label: 'Teknoloji' },
  { value: 'Politics', label: 'Siyaset' },
];

const SCENARIO_OPTIONS = [
  { value: 'Kısa vadeli (1-3 ay)', label: 'Kısa vadeli (1-3 ay)' },
  { value: 'Orta vadeli (6-12 ay)', label: 'Orta vadeli (6-12 ay)' },
  { value: 'Uzun vadeli (1-3 yıl)', label: 'Uzun vadeli (1-3 yıl)' },
  { value: 'Anlık (1 aydan az)', label: 'Anlık (1 aydan az)' },
  { value: 'Beş yıl', label: 'Beş yıl' },
];

const TOPIC_PRESETS = [
  "Ticaret savaşlarının Arap piyasalarına etkisi",
  "Petrol fiyatı tahminleri ve Körfez ekonomilerine etkisi",
  "Arap bölgesinde kripto paraların geleceği",
  "ABD faiz artışlarının gelişmekte olan piyasalara etkisi",
  "Yeşil dönüşüm ve yenilenebilir enerji yatırımı fırsatları",
  "Yapay zekanın finansal hizmetler sektörüne etkisi",
  "Gıda güvenliği ve AgriTech yatırımı",
  "Turizm & Eğlence: Orta Doğu'da büyüme fırsatları",
];

// ─── Main Component ────────────────────────────────────────
export default function TrStrategicReportsPage() {
  // Form state
  const [topic, setTopic] = useState('');
  const [region, setRegion] = useState('Global');
  const [selectedSectors, setSelectedSectors] = useState<string[]>(['Macroeconomics']);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([
    'Kısa vadeli (1-3 ay)',
    'Orta vadeli (6-12 ay)',
    'Uzun vadeli (1-3 yıl)',
  ]);
  const [publishOnComplete, setPublishOnComplete] = useState(true);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);

  // Reports list
  const [reports, setReports] = useState<StrategicReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPresetTopics, setShowPresetTopics] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');

  // ─── Fetch Reports ────────────────────────────────────────
  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch('/api/tr/reports?limit=50&isPublished=all');
      const data = await res.json();
      const items = data.reports || data.items || [];
      const strategic = Array.isArray(items)
        ? items.filter((r: any) => r.reportType === 'special' || r.reportType === 'strategic')
        : [];
      setReports(strategic);
    } catch (err) {
      console.error('TR stratejik raporlar yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // ─── Toggle Sector ────────────────────────────────────────
  const toggleSector = (sector: string) => {
    setSelectedSectors(prev =>
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

  // ─── Build Turkish strategic prompt ──────────────────────
  const buildStrategicPrompt = (): string => {
    return `Profesyonel Türkçe olarak kapsamlı bir stratejik analiz raporu yazın.
⚠️ Tüm içerik Türkçe olmalıdır — bölüm başlıkları veya senaryolar için İngilizce kullanmak yasaktır.

Konu: ${topic.trim()}
Coğrafi Kapsam: ${region}
Sektörler: ${selectedSectors.join(', ')}
Zaman Ufukları: ${selectedScenarios.join(', ')}

Rapor şu tam yapıyı takip etmelidir:

## 1. Yönetici Özeti
5 numaralandırılmış nokta — niceliksel temel analitik bulgular: yüzdeler, rakamlar, karşılaştırmalar.
⚠️ Girişin yeniden ifade edilmesi değil — yalnızca belirli niceliksel noktalar.

## 2. Rapor Girişi
Kısa anlatı paragrafı (sadece 2-3 cümle, en fazla 60 kelime): Kim? Ne? Neden şimdi önemli?
⚠️ Yasak: numaralandırılmış noktalar — yalnızca anlatı.
⚠️ En fazla 60 kelime — asla aşmayın.
⚠️ Doğrudan bilgiyle başlayın — dolgu yok.

## 3. Bağlam ve Geçmiş
- Rakamlarla stratejik önem
- Varsa tarihsel emsaller
- Etkilenen temel paydaşlar

## 4. Doğrudan Ekonomik Etkiler
Yalnızca istenen sektörlere göre dağıtın.
Her sektör için: Etki + Büyüklük + Beklenen süre.

## 5. Finansal Piyasalara Etkisi
İndeksleri ve varlıkları gerçek isimleri ve sembolleriyle belirtin.
Yalnızca güvenilir olan rakamları belirtin.

## 6. Senaryolar
Her istenen zaman ufku için, aşağıdaki Türkçe başlıkları zorunlu olarak kullanın — asla İngilizce değil:
### Kısa vadeli (1-3 ay)
- Temel varsayımlar
- Ana varlıklara beklenen yüzde etki
- Değişim faktörleri: bu senaryoyu değiştirebilecek şeyler

### Orta vadeli (6-12 ay)
- Temel varsayımlar
- Ana varlıklara beklenen yüzde etki
- Değişim faktörleri: bu senaryoyu değiştirebilecek şeyler

### Uzun vadeli (1-3 yıl)
- Temel varsayımlar
- Ana varlıklara beklenen yüzde etki
- Değişim faktörleri: bu senaryoyu değiştirebilecek şeyler

⚠️ Yasak: "Short-term", "Medium-term", "Long-term" İngilizce başlıklarını kullanmak — yalnızca yukarıdaki Türkçe başlıkları kullanın.
⚠️ Yasak: "What Could Change This" kullanmak — bunun yerine "Değişim faktörleri" kullanın.

## 7. Yararlanan ve Tehdit Altındaki Varlıklar
- Yararlanan varlıklar: [Ad] [Sembol] [Neden]
- Tehdit altındaki varlıklar: [Ad] [Sembol] [Neden]
- Mevcutsa izleme seviyeleri

## 8. Stratejik Öneriler
Nesnel akademik analiz — veriler ne diyor? Referans fiyat seviyeleri ile.
• Nötr analistin sesiyle yazılmış, uygulama rakamları ile
• Mantığı ve nedenleri detaylı olarak açıkla
• Doğrudan okuyucuya hitap etmez
• Şu şekilde düzenlenmiş: Bireysel / Kurumsal / Trader'lar
• Her kategori şunları içermeli: Yön + Referans varlıklar + Yaklaşık giriş seviyesi + Hedef + Stop loss
• Örnek: "Savunma sektörü fayda sağlamalı — referans giriş: 320 $ | Hedef: 350 $ | Stop: 305 $ | Ufuk: 3 ay"
⚠️ Fiyat seviyesi olmayan öneriler = reddedilen öneriler

## 9. Rouaa Önerileri
Pratik doğrudan kararlar — şimdi ne yapmalısınız?

### Gün Trader'ı (bir hafta veya daha kısa ufuk)
Belirli giriş/çıkış seviyeleri ile hızlı işlemler.
Her öneri şunları İÇERMELİDİR: giriş fiyatı + stop loss + hedef + maksimum süre

### Orta Vadeli Yatırımcı (1-6 ay)
Portföy tahsis yüzdeleri ile aylık yatırım planları.
Her öneri şunları İÇERMELİDİR: portföyün %'si + yaklaşık giriş noktası + ay cinsinden zaman ufku

### Uzun Vadeli Yatırımcı (6 ay veya daha fazla)
Birkaç yıl boyunca portföy oluşturmak için yapısal stratejiler.
Her öneri şunları İÇERMELİDİR: yapısal strateji + portföy ağırlığı + yeniden değerlendirme noktası

⚠️ Yasak: yatırımcı segmentleri arasında herhangi bir cümleyi kopyalamak — her segment benzersiz varlıklar ve öneriler içermelidir.

## 10. Takip Göstergeleri
Bu raporun yayınlanmasından sonra izlenmesi gereken 5 belirli gösterge. Her gösterge için zorunlu olarak:
- Göstergenin adı (somut ve ölçülebilir)
- Anlamı: bu gösterge bu rapor için neden önemli
- İzlenecek şey: raporun güncellenmesini tetikleyecek eşikler veya anahtar seviyeler
- Önerilen güncelleme sıklığı

Her gösterge için zorunlu format:
**[Gösterge adı]**
- Anlamı: [neden ilgili]
- İzleme eşiği: [uyarı tetikleyen seviye/değer]
- Sıklık: [günlük/haftalık/aylık]

⚠️ Her gösterge somut ve ölçülebilir olmalıdır (ör: "ECB anahtar faiz oranı", "Brent fiyatı", "İmalat PMI endeksi")
⚠️ Yasak: "piyasa gelişimi" veya "yatırımcı duyarlılığı" gibi belirsiz göstergeler

## 11. Kaynaklar ve Referanslar
Tarihi ile birlikte alıntılanan her kaynak. Gerçekte kullanılmayan kaynakları eklemeyin.

---
Uyarı: Bu analitik rapor yalnızca bilgilendirme amaçlıdır.`;
  };

  // ─── Generate report ──────────────────────────────────────
  const handleGenerate = async () => {
    if (!topic.trim() || topic.trim().length < 3) {
      toast.error('Bir rapor konusu girin (en az 3 karakter)');
      return;
    }
    if (selectedSectors.length === 0) {
      toast.error('En az bir sektör seçin');
      return;
    }
    if (selectedScenarios.length === 0) {
      toast.error('En az bir zaman ufkı seçin');
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
          locale: 'tr',
          force: true,
          async: true,
          publish: publishOnComplete,
          title: topic.trim(),
          prompt: buildStrategicPrompt(),
          region: region,
          sectors: selectedSectors,
          scenarios: selectedScenarios,
        }),
      });

      const data = await res.json();
      if (data.success && data.jobId) {
        setJobId(data.jobId);
        toast.success('Stratejik rapor oluşturma başlatıldı');
        pollJobStatus(data.jobId);
      } else {
        toast.error(data.error || 'Oluşturma başlatılamadı');
        setGenerating(false);
      }
    } catch (err) {
      console.error('Oluşturma hatası:', err);
      toast.error('Oluşturma isteği sırasında bir hata oluştu');
      setGenerating(false);
    }
  };

  // ─── Poll Job Status ─────────────────────────────────────
  const pollJobStatus = useCallback(async (jId: string) => {
    let attempts = 0;
    const maxAttempts = 120;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/reports/generate?jobId=${jId}`);
        const data = await res.json();
        setJobStatus(data);

        if (data.status === 'completed') {
          clearInterval(interval);
          setGenerating(false);
          toast.success('Stratejik rapor başarıyla oluşturuldu!');
          fetchReports();
          setActiveTab('history');
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setGenerating(false);
          toast.error(`Oluşturma başarısız: ${data.error || 'Bilinmeyen hata'}`);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setGenerating(false);
          toast.error('Oluşturma zaman aşımına uğradı');
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
    if (impact === 'bullish') return { icon: TrendingUp, label: 'Yükseliş', color: 'var(--bull)', bg: 'var(--bull2)' };
    if (impact === 'bearish') return { icon: TrendingDown, label: 'Düşüş', color: 'var(--bear)', bg: 'var(--bear2)' };
    return { icon: Minus, label: 'Nötr', color: 'var(--gold)', bg: 'var(--gold2)' };
  };

  // ─── Render ───────────────────────────────────────────────
  return (
    <div dir="ltr" className="space-y-6">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-bold font-heading flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Shield size={22} style={{ color: 'var(--purple)' }} />
            Stratejik raporlar
          </h1>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>
            Belirli konularda derinlemesine analiz — otomatik günlük raporlardan farklı
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
            <RefreshCw size={12} /> Yenile
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
                <div className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>Otomatik raporlar</div>
                <div className="text-[9px]" style={{ color: 'var(--text4)' }}>Günlük haber toplama</div>
              </div>
            </div>
            <div className="text-[12px] font-bold" style={{ color: 'var(--text4)' }}>→</div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Shield size={14} style={{ color: 'var(--purple)' }} />
              <div>
                <div className="text-[10px] font-bold" style={{ color: 'var(--purple)' }}>Stratejik raporlar</div>
                <div className="text-[9px]" style={{ color: 'var(--text4)' }}>Belirli soru + derinlemesine analiz</div>
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
          <Sparkles size={15} /> Yeni rapor oluştur
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
          <Clock size={15} /> Geçmiş ({reports.length})
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
                {jobStatus.status === 'completed' ? 'Rapor başarıyla oluşturuldu!'
                  : jobStatus.status === 'failed' ? 'Oluşturma başarısız'
                  : jobStatus.status === 'running' ? 'AI oluşturma devam ediyor...'
                  : 'Sırada bekliyor...'}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text3)' }}>
                {jobStatus.status === 'completed' && jobStatus.result
                  ? `${jobStatus.result.title}`
                  : `Konu: ${topic} · Süre: ${Math.round((Date.now() - (jobStatus.duration || 0)) / 1000)}s`}
              </div>
            </div>
            {jobStatus.status === 'completed' && jobStatus.result && (
              <Link href={`/tr/reports/${jobStatus.result.slug}`} target="_blank">
                <Button size="sm" className="text-[11px] gap-1" style={{ background: 'var(--bull)', color: 'white' }}>
                  <Eye size={12} /> Raporu görüntüle
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══ Generate Tab ═══ */}
      {activeTab === 'generate' && (
        <div className="space-y-4">
          {/* ── Topic Input ── */}
          <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Sparkles size={15} style={{ color: 'var(--purple)' }} />
                Konu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="örn. Ticaret savaşlarının Arap piyasalarına etkisi"
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
                  {topic.length} karakter — Stratejik analiz için belirli bir konu girin
                </div>
                <button
                  onClick={() => setShowPresetTopics(!showPresetTopics)}
                  className="text-[10px] font-bold flex items-center gap-1 px-2 py-1 rounded-md"
                  style={{ color: 'var(--purple)', background: 'rgba(139,92,246,0.06)' }}
                >
                  {showPresetTopics ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  Önerilen konular
                </button>
              </div>
              {showPresetTopics && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  {TOPIC_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => { setTopic(preset); setShowPresetTopics(false); }}
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

          {/* ── Region & Sectors ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Region */}
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <MapPin size={15} style={{ color: 'var(--cyan)' }} />
                  Coğrafi kapsam
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

            {/* Sectors */}
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <Layers size={15} style={{ color: 'var(--gold)' }} />
                  Sektörler
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
                        background: selectedSectors.includes(opt.value) ? 'rgba(255,184,0,0.1)' : 'var(--bg4)',
                        border: `1px solid ${selectedSectors.includes(opt.value) ? 'rgba(255,184,0,0.25)' : 'var(--border)'}`,
                        color: selectedSectors.includes(opt.value) ? 'var(--gold)' : 'var(--text3)',
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
                Zaman ufukları
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
                Oluşturduktan sonra otomatik yayınla
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
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Shield size={16} />
                  Stratejik rapor oluştur
                </>
              )}
            </Button>
          </div>

          {/* Prompt Preview */}
          <Card className="border-0" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={12} style={{ color: 'var(--purple)' }} />
                <span className="text-[11px] font-bold" style={{ color: 'var(--text3)' }}>İstek özeti</span>
              </div>
              <div className="space-y-1 text-[11px]" style={{ color: 'var(--text3)' }}>
                <div>Konu: <span style={{ color: 'var(--text)' }}>{topic || '—'}</span></div>
                <div>Bölge: <span style={{ color: 'var(--cyan)' }}>{region}</span></div>
                <div>Sektörler: <span style={{ color: 'var(--gold)' }}>{selectedSectors.join(', ')}</span></div>
                <div>Zaman ufukları: <span style={{ color: 'var(--bull)' }}>{selectedScenarios.join(', ')}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ Geçmiş Tab ═══ */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {loading ? (
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardContent className="p-8 text-center">
                <Loader2 size={24} className="animate-spin mx-auto mb-3" style={{ color: 'var(--purple)' }} />
                <span className="text-[12px]" style={{ color: 'var(--text3)' }}>Raporlar yükleniyor...</span>
              </CardContent>
            </Card>
          ) : reports.length === 0 ? (
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardContent className="p-8 text-center">
                <Shield size={32} style={{ color: 'var(--text4)', margin: '0 auto 12px' }} />
                <p className="text-[13px] font-bold" style={{ color: 'var(--text3)' }}>Stratejik rapor bulunamadı</p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text4)' }}>
                  Oluştur sekmesinden ilk stratejik raporunuzu oluşturun
                </p>
                <Button
                  onClick={() => setActiveTab('generate')}
                  variant="outline"
                  size="sm"
                  className="text-[11px] gap-1 mt-3"
                  style={{ borderColor: 'var(--border)', color: 'var(--purple)' }}
                >
                  <Sparkles size={12} /> Rapor oluştur
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
                            href={`/tr/reports/${report.slug}`}
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
                            Güven: {report.confidenceScore}%
                          </Badge>
                          <Badge className="text-[8px]" style={{
                            background: report.isPublished ? 'var(--bull2)' : 'var(--gold2)',
                            color: report.isPublished ? 'var(--bull)' : 'var(--gold)',
                            border: `1px solid ${report.isPublished ? 'rgba(0,200,150,0.2)' : 'rgba(255,184,0,0.2)'}`,
                          }}>
                            {report.isPublished ? 'Yayınlandı' : 'Taslak'}
                          </Badge>
                          <span className="text-[9px]" style={{ color: 'var(--text4)' }}>
                            {new Date(report.createdAt).toLocaleDateString('tr-TR', {
                              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                      <Link href={`/tr/reports/${report.slug}`} target="_blank">
                        <Button variant="outline" size="sm" className="text-[10px] gap-1 h-8"
                          style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
                          <Eye size={12} /> Görüntüle
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

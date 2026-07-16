// ─── Strategic Reports Dashboard V1 ─────────────────────────
// Generate deep strategic analysis reports with specialized Arabic prompt.
// Different from automated reports: user-defined topic + deep analysis + Sonnet.
// تقرير استراتيجي ≠ تقرير آلي

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
  topic: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration: number;
  result?: { id: string; title: string; slug: string };
  error?: string;
}

// ─── Constants ─────────────────────────────────────────────
const REGION_OPTIONS = [
  { value: 'العالم العربي والشرق الأوسط', label: 'العالم العربي والشرق الأوسط', icon: '🌍' },
  { value: 'الخليج العربي', label: 'الخليج العربي', icon: '🏜️' },
  { value: 'شمال أفريقيا', label: 'شمال أفريقيا', icon: '🌴' },
  { value: 'عالمي', label: 'عالمي', icon: '🌐' },
  { value: 'الولايات المتحدة وأوروبا', label: 'الولايات المتحدة وأوروبا', icon: '🏛️' },
  { value: 'آسيا والمحيط الهادئ', label: 'آسيا والمحيط الهادئ', icon: '🌏' },
];

const SECTOR_OPTIONS = [
  { value: 'اقتصاد كلي', label: 'اقتصاد كلي' },
  { value: 'أسهم', label: 'أسهم' },
  { value: 'طاقة', label: 'طاقة' },
  { value: 'عملات', label: 'عملات / فوركس' },
  { value: 'عملات رقمية', label: 'عملات رقمية' },
  { value: 'سلع', label: 'سلع' },
  { value: 'عقارات', label: 'عقارات' },
  { value: 'بنوك مركزية', label: 'بنوك مركزية' },
  { value: 'أرباح شركات', label: 'أرباح شركات' },
  { value: 'أسواق عربية', label: 'أسواق عربية' },
  { value: 'تقنية', label: 'تقنية' },
  { value: 'سياسة', label: 'سياسة' },
];

const SCENARIO_OPTIONS = [
  { value: 'قصير المدى (1-3 أشهر)', label: 'قصير المدى (1-3 أشهر)' },
  { value: 'متوسط المدى (6-12 شهراً)', label: 'متوسط المدى (6-12 شهراً)' },
  { value: 'طويل المدى (1-3 سنوات)', label: 'طويل المدى (1-3 سنوات)' },
  { value: 'فوري (أقل من شهر)', label: 'فوري (أقل من شهر)' },
  { value: 'خمس سنوات', label: 'خمس سنوات' },
];

const TOPIC_PRESETS = [
  'تأثير الحروب التجارية على الأسواق العربية',
  'توقعات أسعار النفط وتأثيرها على اقتصاد الخليج',
  'مستقبل العملات الرقمية في المنطقة العربية',
  'تأثير رفع الفائدة الأمريكية على الأسواق الناشئة',
  'التحول الأخضر وفرص الاستثمار في الطاقة المتجددة',
  'تأثير الذكاء الاصطناعي على قطاع الخدمات المالية',
  'الأمن الغذائي والاستثمار في الزراعة التقنية',
  'السياحة والترفيه: فرص النمو في الشرق الأوسط',
];

// ─── Main Component ────────────────────────────────────────
export default function StrategicReportsPage() {
  // Form state
  const [topic, setTopic] = useState('');
  const [region, setRegion] = useState('العالم العربي والشرق الأوسط');
  const [selectedSectors, setSelectedSectors] = useState<string[]>(['اقتصاد كلي']);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([
    'قصير المدى (1-3 أشهر)',
    'متوسط المدى (6-12 شهراً)',
    'طويل المدى (1-3 سنوات)',
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
      const res = await fetch('/api/reports/strategic?list=true');
      const data = await res.json();
      if (data.reports) setReports(data.reports);
    } catch (err) {
      console.error('Failed to fetch strategic reports:', err);
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

  // ─── Generate Report ──────────────────────────────────────
  const handleGenerate = async () => {
    if (!topic.trim() || topic.trim().length < 3) {
      toast.error('أدخل موضوعاً للتقرير (3 أحرف على الأقل)');
      return;
    }
    if (selectedSectors.length === 0) {
      toast.error('اختر قطاعاً واحداً على الأقل');
      return;
    }
    if (selectedScenarios.length === 0) {
      toast.error('اختر سيناريو زمني واحداً على الأقل');
      return;
    }

    setGenerating(true);
    setJobId(null);
    setJobStatus(null);

    try {
      const res = await fetch('/api/reports/strategic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          region,
          sectors: selectedSectors,
          scenarios: selectedScenarios,
          publish: publishOnComplete,
        }),
      });

      const data = await res.json();
      if (data.success && data.jobId) {
        setJobId(data.jobId);
        toast.success('تم بدء توليد التقرير الاستراتيجي');
        pollJobStatus(data.jobId);
      } else {
        toast.error(data.error || 'فشل بدء التوليد');
        setGenerating(false);
      }
    } catch (err) {
      console.error('Generate error:', err);
      toast.error('حدث خطأ أثناء طلب التوليد');
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
        const res = await fetch(`/api/reports/strategic?jobId=${jId}`);
        const data = await res.json();
        setJobStatus(data);

        if (data.status === 'completed') {
          clearInterval(interval);
          setGenerating(false);
          toast.success('تم توليد التقرير الاستراتيجي بنجاح!');
          fetchReports();
          setActiveTab('history');
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setGenerating(false);
          toast.error(`فشل التوليد: ${data.error || 'خطأ غير معروف'}`);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setGenerating(false);
          toast.error('انتهت مهلة التوليد');
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
    if (impact === 'bullish') return { icon: TrendingUp, label: 'صعودي', color: 'var(--bull)', bg: 'var(--bull2)' };
    if (impact === 'bearish') return { icon: TrendingDown, label: 'هبوطي', color: 'var(--bear)', bg: 'var(--bear2)' };
    return { icon: Minus, label: 'محايد', color: 'var(--gold)', bg: 'var(--gold2)' };
  };

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] font-bold font-heading flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Shield size={22} style={{ color: 'var(--purple)' }} />
            التقارير الاستراتيجية
          </h1>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>
            تحليل معمّق بمواضيع محددة — مختلف عن التقارير الآلية اليومية
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
            <RefreshCw size={12} /> تحديث
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
                <div className="text-[10px] font-bold" style={{ color: 'var(--text3)' }}>التقارير الآلية</div>
                <div className="text-[9px]" style={{ color: 'var(--text4)' }}>تجميع أخبار اليوم</div>
              </div>
            </div>
            <div className="text-[12px] font-bold" style={{ color: 'var(--text4)' }}>→</div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Shield size={14} style={{ color: 'var(--purple)' }} />
              <div>
                <div className="text-[10px] font-bold" style={{ color: 'var(--purple)' }}>التقارير الاستراتيجية</div>
                <div className="text-[9px]" style={{ color: 'var(--text4)' }}>سؤال محدد + تحليل معمق</div>
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
          <Sparkles size={15} /> توليد تقرير جديد
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
          <Clock size={15} /> السجل ({reports.length})
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
                {jobStatus.status === 'completed' ? 'تم توليد التقرير بنجاح!'
                  : jobStatus.status === 'failed' ? 'فشل التوليد'
                  : jobStatus.status === 'running' ? 'جارٍ التوليد بالذكاء الاصطناعي...'
                  : 'في قائمة الانتظار...'}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text3)' }}>
                {jobStatus.status === 'completed' && jobStatus.result
                  ? `${jobStatus.result.title}`
                  : `الموضوع: ${topic} · المدة: ${Math.round((Date.now() - (jobStatus.duration || 0)) / 1000)}ث`}
              </div>
            </div>
            {jobStatus.status === 'completed' && jobStatus.result && (
              <Link href={`/reports/${jobStatus.result.slug}`} target="_blank">
                <Button size="sm" className="text-[11px] gap-1" style={{ background: 'var(--bull)', color: 'white' }}>
                  <Eye size={12} /> عرض التقرير
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
                الموضوع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="مثال: تأثير الحروب التجارية على الأسواق العربية"
                rows={2}
                className="w-full px-4 py-3 rounded-xl text-[14px] resize-none"
                style={{
                  background: 'var(--bg4)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  outline: 'none',
                  direction: 'rtl',
                }}
              />
              <div className="flex items-center justify-between mt-2">
                <div className="text-[10px]" style={{ color: 'var(--text4)' }}>
                  {topic.length} حرف — أدخل موضوعاً محدداً للتحليل الاستراتيجي
                </div>
                <button
                  onClick={() => setShowPresetTopics(!showPresetTopics)}
                  className="text-[10px] font-bold flex items-center gap-1 px-2 py-1 rounded-md"
                  style={{ color: 'var(--purple)', background: 'rgba(139,92,246,0.06)' }}
                >
                  {showPresetTopics ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  مواضيع مقترحة
                </button>
              </div>
              {showPresetTopics && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  {TOPIC_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => { setTopic(preset); setShowPresetTopics(false); }}
                      className="text-[11px] text-right px-3 py-2.5 rounded-lg transition-all hover:scale-[1.01]"
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
                  النطاق الجغرافي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {REGION_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setRegion(opt.value)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-[12px] text-right transition-all"
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
                  القطاعات
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
                السيناريوهات الزمنية
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
                نشر تلقائي بعد التوليد
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
                  جارٍ التوليد...
                </>
              ) : (
                <>
                  <Shield size={16} />
                  توليد التقرير الاستراتيجي
                </>
              )}
            </Button>
          </div>

          {/* Prompt Preview */}
          <Card className="border-0" style={{ background: 'var(--bg4)', border: '1px solid var(--border)' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={12} style={{ color: 'var(--purple)' }} />
                <span className="text-[11px] font-bold" style={{ color: 'var(--text3)' }}>ملخص الطلب</span>
              </div>
              <div className="space-y-1 text-[11px]" style={{ color: 'var(--text3)' }}>
                <div>الموضوع: <span style={{ color: 'var(--text)' }}>{topic || '—'}</span></div>
                <div>المنطقة: <span style={{ color: 'var(--cyan)' }}>{region}</span></div>
                <div>القطاعات: <span style={{ color: 'var(--gold)' }}>{selectedSectors.join('، ')}</span></div>
                <div>السيناريوهات: <span style={{ color: 'var(--bull)' }}>{selectedScenarios.join('، ')}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ History Tab ═══ */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {loading ? (
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardContent className="p-8 text-center">
                <Loader2 size={24} className="animate-spin mx-auto mb-3" style={{ color: 'var(--purple)' }} />
                <span className="text-[12px]" style={{ color: 'var(--text3)' }}>جارٍ تحميل التقارير...</span>
              </CardContent>
            </Card>
          ) : reports.length === 0 ? (
            <Card className="border-0" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <CardContent className="p-8 text-center">
                <Shield size={32} style={{ color: 'var(--text4)', margin: '0 auto 12px' }} />
                <p className="text-[13px] font-bold" style={{ color: 'var(--text3)' }}>لا توجد تقارير استراتيجية بعد</p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text4)' }}>
                  أنشئ أول تقرير استراتيجي من تبويب التوليد
                </p>
                <Button
                  onClick={() => setActiveTab('generate')}
                  variant="outline"
                  size="sm"
                  className="text-[11px] gap-1 mt-3"
                  style={{ borderColor: 'var(--border)', color: 'var(--purple)' }}
                >
                  <Sparkles size={12} /> توليد تقرير
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
                            href={`/reports/${report.slug}`}
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
                            الثقة: {report.confidenceScore}%
                          </Badge>
                          <Badge className="text-[8px]" style={{
                            background: report.isPublished ? 'var(--bull2)' : 'var(--gold2)',
                            color: report.isPublished ? 'var(--bull)' : 'var(--gold)',
                            border: `1px solid ${report.isPublished ? 'rgba(0,200,150,0.2)' : 'rgba(255,184,0,0.2)'}`,
                          }}>
                            {report.isPublished ? 'منشور' : 'مسودة'}
                          </Badge>
                          <span className="text-[9px]" style={{ color: 'var(--text4)' }}>
                            {new Date(report.createdAt).toLocaleDateString('ar-SA', {
                              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                      <Link href={`/reports/${report.slug}`} target="_blank">
                        <Button variant="outline" size="sm" className="text-[10px] gap-1 h-8"
                          style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}>
                          <Eye size={12} /> عرض
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

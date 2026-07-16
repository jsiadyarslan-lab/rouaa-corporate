'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Film, Music, Image as ImageIcon, Mic, Type, Clock3, Loader2, Play } from 'lucide-react';

interface Scene {
  id: string;
  title: string;
  imagePrompt: string;
  narrationText: string;
  displayText: string;
  duration: number;
  transition: 'fade' | 'cut' | 'slide';
}

interface ManualVideoCreatorProps {
  locale: string;
}

export default function ManualVideoCreator({ locale }: ManualVideoCreatorProps) {
  const [videoTitle, setVideoTitle] = useState('');
  const [videoLocale, setVideoLocale] = useState(locale || 'ar');
  const [coverPrompt, setCoverPrompt] = useState('');
  const [music, setMusic] = useState<'none' | 'neutral' | 'tense' | 'rising'>('none');
  const [outroText, setOutroText] = useState('');
  const [scenes, setScenes] = useState<Scene[]>([
    { id: '1', title: '', imagePrompt: '', narrationText: '', displayText: '', duration: 5, transition: 'fade' },
  ]);
  const [generating, setGenerating] = useState(false);
  const [videoResult, setVideoResult] = useState<{ videoId: string; status: string; videoUrl?: string } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loc = {
    ar: {
      title: 'عنوان الفيديو', language: 'لغة الفيديو', cover: 'برومبت صورة الغلاف',
      music: 'الموسيقى الخلفية', outro: 'نص الخاتمة (صوتي)',
      sceneTitle: 'عنوان المشهد', imagePrompt: 'برومبت الصورة (لا يُقرأ صوتياً)',
      narration: 'النطق الصوتي (يُقرأ فقط)', display: 'العرض على الشاشة (لا يُقرأ)',
      duration: 'المدة (ثانية)', transition: 'نوع الانتقال',
      addScene: 'إضافة مشهد', deleteScene: 'حذف', generate: 'توليد الفيديو',
      generating: 'جارٍ التوليد...', videoReady: 'الفيديو جاهز',
      none: 'بدون', neutral: 'محايدة', tense: 'متوترة', rising: 'تصاعدية',
      fade: 'تلاشي', cut: 'قطع مباشر', slide: 'انزلاق',
      titlePlaceholder: 'مثال: تحليل أسعار الذهب', coverPlaceholder: 'مثال: gold bars in vault, cinematic lighting',
      sceneTitlePlaceholder: 'مثال: ارتفاع الذهب', imagePromptPlaceholder: 'مثال: golden bull statue, dark background',
      narrationPlaceholder: 'مثال: ارتفع الذهب اليوم بنسبة 2.5 بالمئة',
      displayPlaceholder: 'مثال: $4,346 +2.53%', outroPlaceholder: 'مثال: شكراً لمتابعتكم',
      fillAll: 'يرجى ملء جميع الحقول المطلوبة', scene: 'مشهد', scenes: 'مشاهد',
    },
    en: {
      title: 'Video Title', language: 'Video Language', cover: 'Cover Image Prompt',
      music: 'Background Music', outro: 'Outro Text (Audio)',
      sceneTitle: 'Scene Title', imagePrompt: 'Image Prompt (not narrated)',
      narration: 'Narration Text (read aloud)', display: 'Display Text (on screen)',
      duration: 'Duration (seconds)', transition: 'Transition Type',
      addScene: 'Add Scene', deleteScene: 'Delete', generate: 'Generate Video',
      generating: 'Generating...', videoReady: 'Video Ready',
      none: 'None', neutral: 'Neutral', tense: 'Tense', rising: 'Rising',
      fade: 'Fade', cut: 'Cut', slide: 'Slide',
      titlePlaceholder: 'e.g. Gold Price Analysis', coverPlaceholder: 'e.g. gold bars in vault, cinematic lighting',
      sceneTitlePlaceholder: 'e.g. Gold Rising', imagePromptPlaceholder: 'e.g. golden bull statue, dark background',
      narrationPlaceholder: 'e.g. Gold rose today by 2.5 percent',
      displayPlaceholder: 'e.g. $4,346 +2.53%', outroPlaceholder: 'e.g. Thank you for watching',
      fillAll: 'Please fill all required fields', scene: 'Scene', scenes: 'Scenes',
    },
  };
  const t = loc[locale as keyof typeof loc] || loc.ar;

  const addScene = () => {
    setScenes(prev => [...prev, {
      id: Date.now().toString(),
      title: '', imagePrompt: '', narrationText: '', displayText: '', duration: 5, transition: 'fade',
    }]);
  };

  const deleteScene = (id: string) => {
    setScenes(prev => prev.filter(s => s.id !== id));
  };

  const updateScene = (id: string, field: keyof Scene, value: any) => {
    setScenes(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleGenerate = async () => {
    if (!videoTitle.trim() || scenes.some(s => !s.title.trim() || !s.narrationText.trim())) {
      toast.error(t.fillAll);
      return;
    }

    setGenerating(true);
    setVideoResult(null);

    try {
      const res = await fetch('/api/video/generate-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: videoTitle,
          locale: videoLocale,
          coverPrompt,
          music,
          outroText,
          scenes: scenes.map(({ id, ...rest }) => rest),
        }),
      });

      if (!res.ok) throw new Error('Failed to start generation');
      const data = await res.json();

      if (data.success && data.videoId) {
        toast.success('Video generation started');
        setVideoResult({ videoId: data.videoId, status: 'processing' });

        // Poll for status
        pollRef.current = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/video/${data.videoId}`);
            const statusData = await statusRes.json();
            const video = statusData.video || statusData;
            if (video.status === 'completed' && video.videoUrl) {
              if (pollRef.current) clearInterval(pollRef.current);
              setVideoResult({ videoId: data.videoId, status: 'completed', videoUrl: video.videoUrl });
              setGenerating(false);
              toast.success(t.videoReady);
            } else if (video.status === 'failed') {
              if (pollRef.current) clearInterval(pollRef.current);
              setVideoResult({ videoId: data.videoId, status: 'failed' });
              setGenerating(false);
              toast.error(video.error || 'Generation failed');
            }
          } catch {}
        }, 10000);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed');
      setGenerating(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid var(--border)', background: 'var(--bg2)',
    color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit',
    outline: 'none', transition: 'border 0.2s',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: 'var(--text2)',
    marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px',
  };
  const sectionCard: React.CSSProperties = {
    background: 'var(--bg2)', borderRadius: '12px', padding: '20px',
    border: '1px solid var(--border)', marginBottom: '16px',
  };
  const sceneCard: React.CSSProperties = {
    background: 'var(--bg3)', borderRadius: '10px', padding: '16px',
    border: '1px solid var(--border)', marginBottom: '12px',
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px 0' }}>

      {/* ═══ Video Level Settings ═══ */}
      <div style={sectionCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Film size={18} color="#8b5cf6" />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>إعدادات الفيديو</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div>
            <label style={labelStyle}><Type size={12} /> {t.title}</label>
            <input style={inputStyle} value={videoTitle} onChange={e => setVideoTitle(e.target.value)} placeholder={t.titlePlaceholder} />
          </div>
          <div>
            <label style={labelStyle}><Mic size={12} /> {t.language}</label>
            <select style={inputStyle} value={videoLocale} onChange={e => setVideoLocale(e.target.value)}>
              <option value="ar">العربية</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="tr">Türkçe</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}><ImageIcon size={12} /> {t.cover}</label>
          <input style={inputStyle} value={coverPrompt} onChange={e => setCoverPrompt(e.target.value)} placeholder={t.coverPlaceholder} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}><Music size={12} /> {t.music}</label>
            <select style={inputStyle} value={music} onChange={e => setMusic(e.target.value as any)}>
              <option value="none">{t.none}</option>
              <option value="neutral">{t.neutral}</option>
              <option value="tense">{t.tense}</option>
              <option value="rising">{t.rising}</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}><Mic size={12} /> {t.outro}</label>
            <input style={inputStyle} value={outroText} onChange={e => setOutroText(e.target.value)} placeholder={t.outroPlaceholder} />
          </div>
        </div>
      </div>

      {/* ═══ Scenes ═══ */}
      {scenes.map((scene, idx) => (
        <div key={scene.id} style={sceneCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#8b5cf6' }}>
              {t.scene} {idx + 1}
            </span>
            {scenes.length > 1 && (
              <button onClick={() => deleteScene(scene.id)} style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '6px', padding: '4px 10px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px',
                color: '#ef4444', fontSize: '11px', fontWeight: 600,
              }}>
                <Trash2 size={12} /> {t.deleteScene}
              </button>
            )}
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>{t.sceneTitle}</label>
            <input style={inputStyle} value={scene.title} onChange={e => updateScene(scene.id, 'title', e.target.value)} placeholder={t.sceneTitlePlaceholder} />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}><ImageIcon size={11} /> {t.imagePrompt}</label>
            <input style={inputStyle} value={scene.imagePrompt} onChange={e => updateScene(scene.id, 'imagePrompt', e.target.value)} placeholder={t.imagePromptPlaceholder} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}><Mic size={11} /> {t.narration}</label>
              <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={scene.narrationText} onChange={e => updateScene(scene.id, 'narrationText', e.target.value)} placeholder={t.narrationPlaceholder} />
            </div>
            <div>
              <label style={labelStyle}><Type size={11} /> {t.display}</label>
              <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={scene.displayText} onChange={e => updateScene(scene.id, 'displayText', e.target.value)} placeholder={t.displayPlaceholder} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}><Clock3 size={11} /> {t.duration}</label>
              <input type="number" style={inputStyle} value={scene.duration} min={3} max={30} onChange={e => updateScene(scene.id, 'duration', parseInt(e.target.value) || 5)} />
            </div>
            <div>
              <label style={labelStyle}>{t.transition}</label>
              <select style={inputStyle} value={scene.transition} onChange={e => updateScene(scene.id, 'transition', e.target.value)}>
                <option value="fade">{t.fade}</option>
                <option value="cut">{t.cut}</option>
                <option value="slide">{t.slide}</option>
              </select>
            </div>
          </div>
        </div>
      ))}

      {/* ═══ Add Scene Button ═══ */}
      <button onClick={addScene} style={{
        width: '100%', padding: '12px', borderRadius: '10px',
        border: '2px dashed var(--border)', background: 'transparent',
        color: 'var(--text2)', fontSize: '13px', fontWeight: 600,
        cursor: 'pointer', transition: 'all 0.2s', marginBottom: '20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      }}>
        <Plus size={16} /> {t.addScene}
      </button>

      {/* ═══ Generate Button ═══ */}
      <button
        onClick={handleGenerate}
        disabled={generating}
        style={{
          width: '100%', padding: '14px', borderRadius: '12px',
          background: generating ? 'var(--bg3)' : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
          border: 'none', color: '#fff', fontSize: '15px', fontWeight: 700,
          cursor: generating ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}
      >
        {generating ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
        {generating ? t.generating : t.generate}
      </button>

      {/* ═══ Result ═══ */}
      {videoResult && (
        <div style={{ marginTop: '20px', padding: '16px', borderRadius: '12px', background: 'var(--bg2)', border: '1px solid var(--border)' }}>
          {videoResult.status === 'processing' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text2)' }}>
              <Loader2 size={16} className="animate-spin" />
              <span style={{ fontSize: '13px' }}>{t.generating}</span>
            </div>
          )}
          {videoResult.status === 'completed' && videoResult.videoUrl && (
            <div>
              <p style={{ fontSize: '13px', color: '#10b981', fontWeight: 600, marginBottom: '10px' }}>✓ {t.videoReady}</p>
              <video src={videoResult.videoUrl} controls style={{ width: '100%', borderRadius: '8px' }} />
            </div>
          )}
          {videoResult.status === 'failed' && (
            <p style={{ fontSize: '13px', color: '#ef4444' }}>✗ Failed</p>
          )}
        </div>
      )}
    </div>
  );
}

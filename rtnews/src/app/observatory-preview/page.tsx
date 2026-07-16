'use client';

import { useState } from 'react';

const SCENES = [
  { num: '01', name: 'السؤال الصادم', tag: 'HOOK', img: '/observatory_preview/01_hook.png' },
  { num: '02', name: 'السياق', tag: 'CONTEXT', img: '/observatory_preview/02_context.png' },
  { num: '03', name: 'البيانات', tag: 'DATA', img: '/observatory_preview/03_data.png' },
  { num: '04', name: 'الأسباب الجذرية', tag: 'CAUSES', img: '/observatory_preview/04_causes.png' },
  { num: '05', name: 'الخريطة الحرارية', tag: 'HEATMAP', img: '/observatory_preview/05_heatmap.png' },
  { num: '06', name: 'الأصول المتأثرة', tag: 'ASSETS', img: '/observatory_preview/06_assets.png' },
  { num: '07', name: 'السيناريوهات', tag: 'SCENARIOS', img: '/observatory_preview/07_scenarios.png' },
  { num: '08', name: 'التوصيات', tag: 'RECOMMENDATIONS', img: '/observatory_preview/08_recommendations.png' },
];

export default function ObservatoryPreview() {
  const [grid, setGrid] = useState(false);
  const [modal, setModal] = useState<string | null>(null);

  return (
    <div style={{
      background: '#0a0e14',
      color: '#fff',
      fontFamily: "'IBM Plex Sans Arabic', sans-serif",
      minHeight: '100vh',
      padding: '30px',
      direction: 'rtl'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '40px',
        paddingBottom: '30px',
        borderBottom: '1px solid rgba(0,255,156,0.2)'
      }}>
        <h1 style={{ fontSize: '36px', fontWeight: 300, marginBottom: '8px' }}>
          رؤى <span style={{ color: '#00FF9C' }}>OBSERVATORY</span>
        </h1>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', fontFamily: "'JetBrains Mono', monospace" }}>
          تقرير فيديو اقتصادي · "سوق الغذاء كسلاح استراتيجي" · 8 مشاهد
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: grid ? '1fr 1fr' : '1fr',
        gap: '30px',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        {SCENES.map(s => (
          <div key={s.num} style={{
            background: '#000',
            border: '1px solid rgba(0,255,156,0.15)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              background: 'rgba(0,255,156,0.05)',
              borderBottom: '1px solid rgba(0,255,156,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '14px',
                  color: '#00FF9C',
                  fontWeight: 700
                }}>
                  SCENE {s.num}/8
                </span>
                <span style={{ fontSize: '18px', fontWeight: 500 }}>{s.name}</span>
              </div>
              <span style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.4)',
                fontFamily: "'JetBrains Mono', monospace",
                padding: '4px 10px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px'
              }}>
                {s.tag}
              </span>
            </div>
            <img
              src={s.img}
              alt={s.name}
              onClick={() => setModal(s.img)}
              style={{
                width: '100%',
                display: 'block',
                aspectRatio: '16/9',
                objectFit: 'cover',
                cursor: 'zoom-in'
              }}
            />
          </div>
        ))}
      </div>

      <div style={{
        position: 'fixed',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.95)',
        border: '1px solid rgba(0,255,156,0.3)',
        borderRadius: '50px',
        padding: '12px 24px',
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        zIndex: 100,
        backdropFilter: 'blur(10px)'
      }}>
        <button
          onClick={() => setGrid(!grid)}
          style={{
            background: grid ? 'rgba(0,255,156,0.15)' : 'transparent',
            border: '1px solid rgba(0,255,156,0.3)',
            color: grid ? '#fff' : '#00FF9C',
            padding: '8px 20px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px'
          }}
        >
          ▦ {grid ? 'عمود واحد' : 'شبكة'}
        </button>
        <span style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.5)',
          fontFamily: "'JetBrains Mono', monospace"
        }}>
          8 مشاهد · 1920×1080
        </span>
      </div>

      {modal && (
        <div
          onClick={() => setModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.95)',
            zIndex: 200,
            padding: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out'
          }}
        >
          <img
            src={modal}
            alt=""
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              border: '1px solid rgba(0,255,156,0.3)',
              borderRadius: '8px'
            }}
          />
        </div>
      )}
    </div>
  );
}

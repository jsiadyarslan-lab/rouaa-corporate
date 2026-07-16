#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// Rouaa Gold Renderer — V1051
// Built on the gold standard HTML template
// 9 scenes: Hook → Context → Data → Root Cause → Assets →
//           Scenarios → Recommendation → Watch → Outro
// ═══════════════════════════════════════════════════════════════

import { chromium } from 'playwright';
import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync, statSync, rmSync, renameSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { generateImage } from './image-gen-shared.mjs';

// ═══ Constants ═══
const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 24;
const SCENE_DURATION = 5; // V10: was 8 — original template uses 5000ms (5s) per scene
const NUM_SCENES = 9;
const MIN_TOTAL_DURATION = 60; // V1051: enforce minimum 60s

// ═══ CSS — Based on gold template, scaled for 1920×1080 ═══
// V10: Rewrote to match original template exactly.
// Removed: ticker bar, brand watermark, global progress bar (all were V9 additions
//   that cluttered the design and weren't in the original).
// Added: per-scene progress bar (.pb/.pf), navigation dots (.nav/.ndots/.nd).
// Reduced: Ken Burns scale 1.12→1.03 (original uses subtle zoom).
// Restored: overlay opacity to .92/.6 (original).
// Added: Tabler icons CDN for scene-tag icons.
const GOLD_CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap');
@import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');
/* V10.2: direction is set per-locale on the <body> tag via inline style (rtl for ar, ltr for others). */
*{box-sizing:border-box;margin:0;padding:0}
body{width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden;font-family:'IBM Plex Sans Arabic','Readex Pro',sans-serif;background:#050810;font-feature-settings:"liga" 1,"calt" 1,"kern" 1}
.vr{font-family:'IBM Plex Sans Arabic',sans-serif;background:#050810;border-radius:16px;overflow:hidden;width:${WIDTH}px;height:${HEIGHT}px}
.scene{position:relative;width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden}
.scene-img{position:absolute;inset:0;background-size:100% 100%;background-position:center;transition:background-size 0.04s linear,background-position 0.04s linear}
.overlay{position:absolute;inset:0}
.content{position:relative;z-index:10;padding:60px 72px 100px;height:100%;display:flex;flex-direction:column;justify-content:flex-end}
.scene-tag{display:inline-flex;align-items:center;gap:8px;font-size:16px;font-weight:500;letter-spacing:.1em;padding:6px 18px;border-radius:24px;border:1px solid;margin-bottom:20px;width:fit-content;animation:fadeUp .6s ease .1s both}
.scene-tag i{font-size:18px}
.scene-num{font-size:20px;color:rgba(255,255,255,.3);margin-bottom:16px;animation:fadeIn .8s ease both}
.big-stat{font-size:120px;font-weight:300;color:#EF4444;letter-spacing:-5px;line-height:1;margin-bottom:12px;animation:countUp 1.2s cubic-bezier(.16,1,.3,1) .3s both}
@keyframes countUp{from{opacity:0;transform:translateY(30px) scale(.9)}to{opacity:1;transform:translateY(0) scale(1)}}
.big-label{font-size:22px;color:rgba(255,255,255,.5);margin-bottom:20px;animation:fadeUp .6s ease .5s both}
.scene-title{font-size:40px;font-weight:500;color:#fff;line-height:1.3;margin-bottom:10px;animation:fadeUp .7s ease .2s both;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.scene-sub{font-size:20px;color:rgba(255,255,255,.55);line-height:1.6;max-width:900px;animation:fadeUp .7s ease .4s both}
.data-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px}
.data-card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:20px;animation:fadeUp .6s ease both}
.data-card:nth-child(1){animation-delay:.3s}
.data-card:nth-child(2){animation-delay:.5s}
.data-card:nth-child(3){animation-delay:.7s}
.dc-val{font-size:36px;font-weight:300;color:#fff;font-variant-numeric:tabular-nums}
.dc-label{font-size:20px;color:rgba(255,255,255,.4);margin-top:8px}
.dc-meaning{font-size:22px;margin-top:10px;font-weight:500}
.causes{display:flex;flex-direction:column;gap:16px;margin-bottom:24px}
.cause{display:flex;align-items:flex-start;gap:16px;padding:18px 22px;background:rgba(255,255,255,.04);border-radius:14px;border:1px solid rgba(255,255,255,.07);animation:slideIn .6s ease both}
.cause:nth-child(1){animation-delay:.3s}
.cause:nth-child(2){animation-delay:.5s}
.cause:nth-child(3){animation-delay:.7s}
@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
.cause-num{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:500;flex-shrink:0}
.cause-text{font-size:18px;color:rgba(255,255,255,.7);line-height:1.6}
.assets{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
.asset-card{padding:20px;border-radius:14px;border:1px solid;animation:fadeUp .6s ease both}
.asset-card:nth-child(1){animation-delay:.3s}
.asset-card:nth-child(2){animation-delay:.5s}
.asset-title{font-size:16px;font-weight:500;margin-bottom:14px;display:flex;align-items:center;gap:8px}
.asset-item{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04)}
.asset-item:last-child{border:none}
.ai-name{font-size:18px;color:rgba(255,255,255,.7)}
.ai-sym{font-size:20px;color:rgba(255,255,255,.3)}
.ai-reason{font-size:20px;color:rgba(255,255,255,.35);margin-top:4px}
.scenarios{display:flex;flex-direction:column;gap:16px;margin-bottom:24px}
.scenario{display:flex;align-items:flex-start;gap:18px;padding:20px;border-radius:14px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);animation:fadeUp .6s ease both}
.scenario:nth-child(1){animation-delay:.3s}
.scenario:nth-child(2){animation-delay:.5s}
.scenario:nth-child(3){animation-delay:.7s}
.sc-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0;margin-top:6px}
.sc-body{flex:1}
.sc-name{font-size:20px;font-weight:500;color:rgba(255,255,255,.85);margin-bottom:6px}
.sc-cond{font-size:22px;color:rgba(255,255,255,.4);line-height:1.6;margin-bottom:10px}
.sc-bar{height:5px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden;margin-bottom:6px}
.sc-fill{height:100%;border-radius:3px;animation:fillBar 1s ease-out .8s both}
@keyframes fillBar{from{width:0!important}}
.sc-prob{font-size:20px;font-weight:500}
.reco-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px}
.reco{padding:20px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);animation:fadeUp .6s ease both}
.reco:nth-child(1){animation-delay:.3s}
.reco:nth-child(2){animation-delay:.5s}
.reco:nth-child(3){animation-delay:.7s}
.reco-type{font-size:20px;font-weight:500;letter-spacing:.06em;margin-bottom:10px}
.reco-action{font-size:18px;font-weight:500;color:#fff;line-height:1.5}
.watchlist{display:flex;flex-direction:column;gap:16px;margin-bottom:24px}
.wl-item{display:flex;align-items:center;gap:18px;padding:18px 22px;background:rgba(255,255,255,.04);border-radius:14px;border:1px solid rgba(255,255,255,.07);animation:fadeUp .6s ease both}
.wl-item:nth-child(1){animation-delay:.3s}
.wl-item:nth-child(2){animation-delay:.5s}
.wl-item:nth-child(3){animation-delay:.7s}
.wl-num{font-size:18px;font-weight:500;color:#3B82F6;flex-shrink:0;width:28px}
.wl-event{font-size:18px;color:rgba(255,255,255,.7)}
.wl-time{font-size:20px;color:rgba(255,255,255,.35);margin-top:6px}
.outro{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:500px;text-align:center}
.brand-logo{font-size:72px;font-weight:300;color:#fff;letter-spacing:-3px;margin-bottom:16px;animation:brandReveal 1s ease both}
@keyframes brandReveal{from{opacity:0;transform:scale(.8);letter-spacing:10px}to{opacity:1;transform:scale(1);letter-spacing:-3px}}
.brand-logo em{font-style:normal;color:#3B82F6}
.brand-tag{font-size:20px;color:rgba(255,255,255,.4);letter-spacing:.2em;margin-bottom:36px;animation:fadeUp .8s ease .4s both}
.disclaimer{font-size:16px;color:rgba(255,255,255,.25);max-width:700px;line-height:1.7;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:18px 26px;animation:fadeUp .8s ease .7s both}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.fade-in{animation:fadeUp .5s ease forwards}
/* V10: Per-scene progress bar (replaces global progress bar) */
.pb{height:4px;background:rgba(255,255,255,.06);position:relative;z-index:20}
.pf{height:100%;width:0%;border-radius:2px}
/* V10: Navigation dots (visual indicator at bottom) */
.nav{display:flex;align-items:center;justify-content:space-between;padding:20px 72px;background:rgba(5,8,16,.98);border-top:1px solid rgba(255,255,255,.05);position:relative;z-index:20}
.ndots{display:flex;gap:8px;align-items:center}
.nd{height:6px;border-radius:3px;background:rgba(255,255,255,.15);transition:all .25s}
.nd.on{width:48px}
.nd:not(.on){width:10px;border-radius:50%}
.nav-info{font-size:24px;color:rgba(255,255,255,.25);font-family:'IBM Plex Sans Arabic',sans-serif}
`;

// Scene colors (from gold template)
const SCENE_COLORS = ['#EF4444','#3B82F6','#F59E0B','#A78BFA','#10B981','#3B82F6','#F59E0B','#A78BFA','#3B82F6'];
const AR_NUMS = ['١','٢','٣','٤','٥','٦','٧','٨','٩'];
// V10: Scene type names (shown in scene-num) + Tabler icons (shown in scene-tag)
const SCENE_ICONS = ['ti-trending-down', 'ti-info-circle', 'ti-chart-bar', 'ti-microscope', 'ti-arrows-up-down', 'ti-git-branch', 'ti-target', 'ti-eye', ''];

// V10.1: i18n — 5 languages (ar/en/fr/tr/es). Fixes hardcoded Arabic in non-Arabic videos.
const I18N = {
  ar: {
    scenePrefix: 'المشهد', sceneOf: 'من ٩',
    types: ['Hook', 'الإطار', 'البيانات', 'السبب الجذري', 'التأثير على الأسواق', 'السيناريوهات', 'التوصية', 'مؤشرات المتابعة', 'Outro'],
    tags: ['عاجل', 'السياق', 'الأرقام', 'التحليل', 'الأصول المتأثرة', 'المسارات المحتملة', 'توصيات رؤى', 'راقب هذا'],
    titles: ['', 'ماذا يحدث؟', 'الأرقام تكشف الحقيقة', 'لماذا؟', 'من يستفيد؟ من يتضرر؟', 'السيناريوهات', 'ماذا تفعل الآن؟', 'مؤشرات المتابعة', ''],
    impactLabels: { bullish: 'صعودي', bearish: 'هبوطي', neutral: 'محايد' },
    benefiting: 'يستفيد', harmed: 'يتضرر',
    recoTypes: ['المتداول اليومي', 'المستثمر', 'المراقب'],
    outro: { logo: 'رؤى <em>Rouaa</em>', tag: 'AI · FINANCIAL · INTELLIGENCE', disclaimer: 'هذا التقرير للأغراض الإعلامية والتعليمية فقط — لا يُعدّ نصيحة استثمارية. استشر مستشاراً مالياً قبل اتخاذ أي قرار.' },
    defaultTitle: 'تقرير مالي',
  },
  en: {
    scenePrefix: 'Scene', sceneOf: 'of 9',
    types: ['Hook', 'Context', 'Data', 'Root Cause', 'Market Impact', 'Scenarios', 'Recommendation', 'Watch', 'Outro'],
    tags: ['Breaking', 'Context', 'Numbers', 'Analysis', 'Affected Assets', 'Possible Paths', 'Rouaa Recommendations', 'Watch This'],
    titles: ['', 'What\'s happening?', 'Numbers reveal the truth', 'Why?', 'Who benefits? Who loses?', 'Scenarios', 'What to do now?', 'Watch indicators', ''],
    impactLabels: { bullish: 'Bullish', bearish: 'Bearish', neutral: 'Neutral' },
    benefiting: 'Benefits', harmed: 'Harmed',
    recoTypes: ['Day Trader', 'Investor', 'Observer'],
    outro: { logo: 'Rouaa <em>رؤى</em>', tag: 'AI · FINANCIAL · INTELLIGENCE', disclaimer: 'This report is for informational and educational purposes only — not investment advice. Consult a financial advisor before making any decision.' },
    defaultTitle: 'Financial Report',
  },
  fr: {
    scenePrefix: 'Scène', sceneOf: 'de 9',
    types: ['Hook', 'Contexte', 'Données', 'Cause Racine', 'Impact Marché', 'Scénarios', 'Recommandation', 'À Surveiller', 'Outro'],
    tags: ['Urgent', 'Contexte', 'Chiffres', 'Analyse', 'Actifs Affectés', 'Trajectoires Possibles', 'Recommandations Rouaa', 'À Surveiller'],
    titles: ['', 'Que se passe-t-il ?', 'Les chiffres révèlent la vérité', 'Pourquoi ?', 'Qui bénéficie ? Qui perd ?', 'Scénarios', 'Que faire maintenant ?', 'Indicateurs à surveiller', ''],
    impactLabels: { bullish: 'Haussier', bearish: 'Baissier', neutral: 'Neutre' },
    benefiting: 'Bénéficie', harmed: 'Affecté',
    recoTypes: ['Trader', 'Investisseur', 'Observateur'],
    outro: { logo: 'Rouaa <em>رؤى</em>', tag: 'AI · FINANCIAL · INTELLIGENCE', disclaimer: 'Ce rapport est à titre informatif et éducatif uniquement — ne constitue pas un conseil en investissement. Consultez un conseiller financier avant toute décision.' },
    defaultTitle: 'Rapport Financier',
  },
  tr: {
    scenePrefix: 'Sahne', sceneOf: '/ 9',
    types: ['Hook', 'Bağlam', 'Veri', 'Kök Neden', 'Piyasa Etkisi', 'Senaryolar', 'Tavsiye', 'İzle', 'Outro'],
    tags: ['Son Dakika', 'Bağlam', 'Rakamlar', 'Analiz', 'Etkilenen Varlıklar', 'Olası Yollar', 'Rouaa Tavsiyeleri', 'Bunu İzle'],
    titles: ['', 'Ne oluyor?', 'Rakamlar gerçeği ortaya koyuyor', 'Neden?', 'Kim kazanır? Kim kaybeder?', 'Senaryolar', 'Şimdi ne yapmalı?', 'İzleme göstergeleri', ''],
    impactLabels: { bullish: 'Yükseliş', bearish: 'Düşüş', neutral: 'Nötr' },
    benefiting: 'Kazançlı', harmed: 'Zararlı',
    recoTypes: ['Günlük Trader', 'Yatırımcı', 'Gözlemci'],
    outro: { logo: 'Rouaa <em>رؤى</em>', tag: 'AI · FINANCIAL · INTELLIGENCE', disclaimer: 'Bu rapor yalnızca bilgilendirme ve eğitim amaçlıdır — yatırım tavsiyesi değildir. Herhangi bir karar öncesi mali danışmana başvurun.' },
    defaultTitle: 'Finansal Rapor',
  },
  es: {
    scenePrefix: 'Escena', sceneOf: 'de 9',
    types: ['Hook', 'Contexto', 'Datos', 'Causa Raíz', 'Impacto Mercado', 'Escenarios', 'Recomendación', 'Observar', 'Outro'],
    tags: ['Urgente', 'Contexto', 'Números', 'Análisis', 'Activos Afectados', 'Trayectorias Posibles', 'Recomendaciones Rouaa', 'Observa Esto'],
    titles: ['', '¿Qué está pasando?', 'Los números revelan la verdad', '¿Por qué?', '¿Quién se beneficia? ¿Quién pierde?', 'Escenarios', '¿Qué hacer ahora?', 'Indicadores a observar', ''],
    impactLabels: { bullish: 'Alcista', bearish: 'Bajista', neutral: 'Neutral' },
    benefiting: 'Se beneficia', harmed: 'Se perjudica',
    recoTypes: ['Trader Diario', 'Inversor', 'Observador'],
    outro: { logo: 'Rouaa <em>رؤى</em>', tag: 'AI · FINANCIAL · INTELLIGENCE', disclaimer: 'Este informe es solo para fines informativos y educativos — no constituye asesoramiento financiero. Consulte a un asesor financiero antes de tomar cualquier decisión.' },
    defaultTitle: 'Informe Financiero',
  },
};
function getI18N(locale) { return I18N[locale] || I18N.en; }

function escapeHTML(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function stripMarkdown(text) {
  if (!text) return '';
  return String(text).replace(/```[\s\S]*?```/g,'').replace(/`([^`]+)`/g,'$1')
    .replace(/(\*{3}|_{3})(.+?)\1/g,'$2').replace(/(\*{2}|_{2})(.+?)\1/g,'$2')
    .replace(/(\*|_)(.+?)\1/g,'$2').replace(/~~(.+?)~~/g,'$1')
    .replace(/^#{1,6}\s+/gm,'').replace(/^[-*_]{3,}\s*$/gm,'')
    .replace(/^[\s]*[-*+]\s+/gm,'').replace(/^[\s]*\d+\.\s+/gm,'')
    .replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/<[^>]+>/g,'')
    .replace(/[ \t]+/g,' ').replace(/\n{2,}/g,'\n').trim();
}

// V16: Bullets helper — splits text into short points (max 8 words each)
function toBullets(text, maxBullets = 4) {
  if (!text) return [];
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const bullets = [];
  for (let i = 0; i < words.length && bullets.length < maxBullets; i += 8) {
    const chunk = words.slice(i, i + 8).join(' ');
    if (chunk.length > 3) bullets.push(chunk);
  }
  return bullets.slice(0, maxBullets);
}

function bulletsHTML(text, maxBullets = 4) {
  const bullets = toBullets(stripMarkdown(text), maxBullets);
  if (bullets.length === 0) return '';
  return `<div style="display:flex;flex-direction:column;gap:10px;margin-top:16px">${bullets.map((b, i) =>
    `<div style="display:flex;align-items:flex-start;gap:12px;font-size:18px;color:rgba(255,255,255,.7);line-height:1.5;animation:fadeUp .6s ease ${0.3 + i * 0.3}s both"><div style="width:8px;height:8px;border-radius:50%;background:#D4AF37;flex-shrink:0;margin-top:8px"></div><div>${escapeHTML(b)}</div></div>`
  ).join('')}</div>`;
}

// ═══ AI Image Generation (reuse existing pipeline) ═══

// ═══ Groq Chat (narration + image prompts) ═══
async function groqChat(messages, maxTokens = 1500) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return null;
  try {
    const result = spawnSync('curl', [
      '-s', '-X', 'POST', 'https://api.groq.com/openai/v1/chat/completions',
      '-H', `Authorization: Bearer ${groqKey}`,
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, temperature: 0.7, max_tokens: maxTokens }),
    ], { encoding: 'utf-8', timeout: 60000 });
    if (result.status === 0 && result.stdout) {
      const resp = JSON.parse(result.stdout);
      return resp.choices?.[0]?.message?.content || null;
    }
  } catch {}
  return null;
}

// ═══ Narration: reads EXACT displayed text per scene (V10.1 — fixes audio/text mismatch) ═══
// Previous version used Groq to generate NEW narration from data, which often diverged
// from the displayed text. Now narration = displayed text, guaranteeing 100% match.
async function generateNarration(data) {
  const locale = data.locale || 'ar';
  const isAr = locale === 'ar';

  const title = stripMarkdown(data.title || (isAr ? 'تقرير مالي' : 'Financial Report'));
  const summary = stripMarkdown(data.summary || '');
  const stats = (data.stats || []).map(s => `${s.label}: ${s.value}`).join(isAr ? '، ' : ', ');
  const rootCauses = (data.root_causes || []).map(r => `${r.title}: ${r.description || ''}`).join(isAr ? '. ' : '. ');
  const benAssets = (data.benefiting_assets || []).map(a => a.name).join(isAr ? '، ' : ', ');
  const harmAssets = (data.harmed_assets || []).map(a => a.name).join(isAr ? '، ' : ', ');
  const scenarios = (data.scenarios || []).map(s => `${s.title} — ${s.probability}: ${s.result || ''}`).join(isAr ? '. ' : '. ');
  const recs = (data.recommendations || []).map(r => `${r.asset}: ${r.action}`).join(isAr ? '، ' : ', ');
  const keyPoints = (data.key_points || []).slice(0, 3).join(isAr ? '. ' : '. ');

  if (isAr) {
    return [
      // S1 Hook — reads the big stat + title
      `${stats ? stats.split('،')[0] + '.' : ''} ${title}. ${summary}`,
      // S2 Context — reads summary + stats
      `ماذا يحدث؟ ${summary} ${stats ? 'الأرقام: ' + stats + '.' : ''}`,
      // S3 Data — reads stats
      `الأرقام تكشف الحقيقة. ${stats || 'لا توجد بيانات متاحة.'}`,
      // S4 Root causes
      `لماذا؟ ${rootCauses || 'تطورات فنية في المؤشرات.'}`,
      // S5 Assets
      `الأصول المتأثرة. ${benAssets ? 'يستفيد: ' + benAssets + '.' : ''} ${harmAssets ? 'يتضرر: ' + harmAssets + '.' : ''}`,
      // S6 Scenarios
      `السيناريوهات المحتملة. ${scenarios || 'متعددة.'}`,
      // S7 Recommendations
      `التوصيات. ${recs || 'إدارة المخاطر أولاً.'}`,
      // S8 Watch
      `مؤشرات المتابعة. ${keyPoints || 'راقب التطورات.'}`,
      // S9 Outro
      'شكراً لمتابعتكم تقرير رؤى. هذا التقرير للأغراض الإعلامية فقط ولا يُعد نصيحة استثمارية.',
    ];
  }

  // English fallback (also used for fr/tr/es with English text)
  return [
    `${stats ? stats.split(',')[0] + '.' : ''} ${title}. ${summary}`,
    `What's happening? ${summary} ${stats ? 'Numbers: ' + stats + '.' : ''}`,
    `The numbers reveal the truth. ${stats || 'No data available.'}`,
    `Why? ${rootCauses || 'Technical developments in the indicators.'}`,
    `Affected assets. ${benAssets ? 'Benefiting: ' + benAssets + '.' : ''} ${harmAssets ? 'Harmed: ' + harmAssets + '.' : ''}`,
    `Likely scenarios. ${scenarios || 'Multiple.'}`,
    `Recommendations. ${recs || 'Risk management first.'}`,
    `Watch indicators. ${keyPoints || 'Monitor developments.'}`,
    'Thank you for watching the Rouaa Report. This report is for informational purposes only.',
  ];
}

// ═══ TTS via Groq ═══
async function generateTTS(text, outputPath, locale) {
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    const voice = locale === 'ar' ? 'Hiba-MSA' : 'Fritz-PlayAI';
    spawnSync('curl', [
      '-s', '-X', 'POST', 'https://api.groq.com/openai/v1/audio/speech',
      '-H', `Authorization: Bearer ${groqKey}`,
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({ model: 'playai-tts', input: text, voice, response_format: 'mp3', speed: 1.0 }),
      '-o', outputPath,
    ], { encoding: 'utf-8', timeout: 60000 });
    if (existsSync(outputPath) && statSync(outputPath).size > 1000) return true;
  }
  // edge-tts fallback
  const tmpFile = outputPath.replace('.mp3', '_text.txt');
  writeFileSync(tmpFile, text, 'utf-8');
  const voices = locale === 'ar' ? ['ar-AE-FatimaNeural'] : ['en-US-JennyNeural'];
  for (const voice of voices) {
    const py = `import asyncio, edge_tts\nasync def main():\n    text = open("${tmpFile}", "r", encoding="utf-8").read()\n    comm = edge_tts.Communicate(text, "${voice}", rate="-5%", pitch="+0Hz")\n    await comm.save("${outputPath}")\nasyncio.run(main())`;
    const result = spawnSync('python3', ['-c', py], { encoding: 'utf-8', timeout: 120000 });
    if (result.status === 0 && existsSync(outputPath) && statSync(outputPath).size > 1000) {
      try { unlinkSync(tmpFile); } catch {}
      return true;
    }
  }
  try { unlinkSync(tmpFile); } catch {}
  return false;
}

function getAudioDuration(path) {
  try {
    const r = spawnSync('ffprobe', ['-v','quiet','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1', path], { encoding: 'utf-8', timeout: 10000 });
    return parseFloat(r.stdout?.trim()) || 0;
  } catch { return 0; }
}

// ═══ Scene HTML Generators (matching gold template structure) ═══

function generateSceneHTML(sceneIndex, data, bgImageBase64) {
  const color = SCENE_COLORS[sceneIndex];
  const isOutro = sceneIndex === 8;
  const locale = data.locale || 'ar';
  const isAr = locale === 'ar';
  const t = getI18N(locale);
  const sceneNumDisplay = isAr ? AR_NUMS[sceneIndex] : String(sceneIndex + 1);
  const sceneNum = isOutro ? '' : `${t.scenePrefix} ${sceneNumDisplay} ${t.sceneOf} — ${t.types[sceneIndex]}`;
  const isRTL = isAr;
  const cleanSummary = stripMarkdown(data.summary || '');
  const cleanTitle = stripMarkdown(data.title || t.defaultTitle);
  const cleanKeyPoints = (data.key_points || []).map(p => stripMarkdown(p));
  const bgStyle = bgImageBase64
    ? `background-image:url('data:image/jpeg;base64,${bgImageBase64}')`
    : `background:linear-gradient(135deg, #050810, #0a1120)`;
  const overlayBg = isOutro
    ? `background:rgba(5,8,16,.75)`
    : `background:linear-gradient(180deg,rgba(5,8,16,.55) 0%,rgba(5,8,16,.35) 40%,rgba(5,8,16,.65) 100%)`;
  const iconHTML = SCENE_ICONS[sceneIndex] ? `<i class="ti ${SCENE_ICONS[sceneIndex]}" aria-hidden="true"></i> ` : '';

  const scenes = [
    // S1: Hook
    () => {
      const stat = data.stats?.[0] || { value: '—', label: '' };
      const impactLabel = t.impactLabels[data.market_impact] || t.impactLabels.neutral;
      return `<div class="scene-tag" style="color:${color};border-color:${color}30;background:${color}10">${iconHTML}${t.tags[0]} — ${impactLabel}</div>
        <div class="big-stat" style="color:${color}">${escapeHTML(stat.value)}</div>
        <div class="big-label">${escapeHTML(stat.label)}</div>
        <div class="scene-title">${escapeHTML(cleanTitle)}</div>
        <div class="scene-sub">${escapeHTML(cleanSummary)}</div>
        ${bulletsHTML(cleanSummary, 3)}`;
    },
    // S2: Context
    () => {
      const cards = (data.stats || []).slice(0, 3).map(s => {
        const c = String(s.value).includes('-') ? '#EF4444' : String(s.value).includes('+') ? '#10B981' : '#3B82F6';
        return `<div class="data-card"><div class="dc-val" style="color:${c}">${escapeHTML(s.value)}</div><div class="dc-label">${escapeHTML(s.label)}</div><div class="dc-meaning" style="color:${c}">${escapeHTML(s.description && s.description !== s.label ? s.description : '')}</div></div>`;
      }).join('');
      return `<div class="scene-tag" style="color:${color};border-color:${color}30;background:${color}10">${iconHTML}${t.tags[1]}</div>
        <div class="scene-title">${t.titles[1]}</div>
        <div class="scene-sub" style="margin-bottom:20px">${escapeHTML(cleanSummary)}</div>
        ${bulletsHTML(cleanSummary, 4)}
        <div class="data-grid">${cards}</div>`;
    },
    // S3: Data
    () => {
      const cards = (data.stats || []).slice(0, 3).map(s => {
        const c = String(s.value).includes('-') ? '#EF4444' : String(s.value).includes('+') ? '#10B981' : '#3B82F6';
        return `<div class="data-card"><div class="dc-val" style="color:${c}">${escapeHTML(s.value)}</div><div class="dc-label">${escapeHTML(s.label)}</div><div class="dc-meaning" style="color:${c}">${escapeHTML(s.description && s.description !== s.label ? s.description : '')}</div></div>`;
      }).join('');
      return `<div class="scene-tag" style="color:${color};border-color:${color}30;background:${color}10">${iconHTML}${t.tags[2]}</div>
        <div class="scene-title">${t.titles[2]}</div>
        <div class="data-grid" style="margin-top:16px">${cards}</div>`;
    },
    // S4: Root Causes
    () => {
      const causes = (data.root_causes || []).slice(0, 3).map((r, i) => {
        const c = ['#EF4444','#F59E0B','#A78BFA'][i % 3];
        const num = isAr ? AR_NUMS[i] : String(i + 1);
        return `<div class="cause"><div class="cause-num" style="background:${c}15;color:${c}">${num}</div><div class="cause-text">${escapeHTML(r.title)}: ${escapeHTML(r.description || '')}</div></div>`;
      }).join('') || `<div class="cause"><div class="cause-text">${isAr ? 'تطورات فنية في المؤشرات' : 'Technical developments'}</div></div>`;
      return `<div class="scene-tag" style="color:${color};border-color:${color}30;background:${color}10">${iconHTML}${t.tags[3]}</div>
        <div class="scene-title">${t.titles[3]}</div>
        <div class="causes">${causes}</div>`;
    },
    // S5: Assets
    () => {
      const ben = (data.benefiting_assets || []).slice(0, 3).map(a => `<div class="asset-item"><div><div class="ai-name">${escapeHTML(a.name)}</div><div class="ai-sym">${escapeHTML(a.symbol || '')}</div></div><div class="ai-reason" style="color:#10B981">${escapeHTML(a.direction === 'up' ? '▲' : '▼')}</div></div>`).join('');
      const har = (data.harmed_assets || []).slice(0, 3).map(a => `<div class="asset-item"><div><div class="ai-name">${escapeHTML(a.name)}</div><div class="ai-sym">${escapeHTML(a.symbol || '')}</div></div><div class="ai-reason" style="color:#EF4444">${escapeHTML(a.direction === 'down' ? '▼' : '▲')}</div></div>`).join('');
      return `<div class="scene-tag" style="color:${color};border-color:${color}30;background:${color}10">${iconHTML}${t.tags[4]}</div>
        <div class="scene-title">${t.titles[4]}</div>
        <div class="assets" style="margin-top:16px">
          <div class="asset-card" style="border-color:#10B98120;background:#10B98105"><div class="asset-title" style="color:#10B981">${t.benefiting}</div>${ben}</div>
          <div class="asset-card" style="border-color:#EF444420;background:#EF444405"><div class="asset-title" style="color:#EF4444">${t.harmed}</div>${har}</div>
        </div>`;
    },
    // S6: Scenarios
    () => {
      const sc = (data.scenarios || []).slice(0, 3).map(s => {
        const prob = parseInt(s.probability) || 0;
        const c = s.color || (prob > 40 ? '#F59E0B' : prob > 25 ? '#10B981' : '#EF4444');
        return `<div class="scenario"><div class="sc-dot" style="background:${c}"></div><div class="sc-body"><div class="sc-name">${escapeHTML(s.title)} — ${escapeHTML(s.probability)}</div><div class="sc-cond">${escapeHTML(s.result || '')}</div><div class="sc-bar"><div class="sc-fill" style="width:${prob}%;background:${c}"></div></div></div></div>`;
      }).join('') || `<div class="scenario"><div class="sc-body"><div class="sc-name">${isAr ? 'سيناريو محايد — 50%' : 'Neutral scenario — 50%'}</div></div></div>`;
      return `<div class="scene-tag" style="color:${color};border-color:${color}30;background:${color}10">${iconHTML}${t.tags[5]}</div>
        <div class="scene-title">${t.titles[5]}</div>
        <div class="scenarios" style="margin-top:16px">${sc}</div>`;
    },
    // S7: Recommendations
    () => {
      const recs = (data.recommendations || []).slice(0, 3).map((r, i) => {
        const colors = ['#3B82F6', '#10B981', '#F59E0B'];
        return `<div class="reco"><div class="reco-type" style="color:${colors[i%3]}">${t.recoTypes[i%3]}</div><div class="reco-action">${escapeHTML(r.asset)}: ${escapeHTML(r.action)}</div></div>`;
      }).join('') || `<div class="reco"><div class="reco-action">${isAr ? 'إدارة المخاطر أولاً' : 'Risk management first'}</div></div>`;
      return `<div class="scene-tag" style="color:${color};border-color:${color}30;background:${color}10">${iconHTML}${t.tags[6]}</div>
        <div class="scene-title">${t.titles[6]}</div>
        <div class="reco-cards" style="margin-top:16px">${recs}</div>`;
    },
    // S8: Watch
    () => {
      const items = cleanKeyPoints.slice(0, 3).map((p, i) => {
        const num = isAr ? AR_NUMS[i] : String(i + 1);
        return `<div class="wl-item"><div class="wl-num">${num}</div><div><div class="wl-event">${escapeHTML(p)}</div></div></div>`;
      }).join('') || `<div class="wl-item"><div class="wl-event">${isAr ? 'راقب التطورات' : 'Monitor developments'}</div></div>`;
      return `<div class="scene-tag" style="color:${color};border-color:${color}30;background:${color}10">${iconHTML}${t.tags[7]}</div>
        <div class="scene-title">${t.titles[7]}</div>
        <div class="watchlist" style="margin-top:16px">${items}</div>`;
    },
    // S9: Outro
    () => {
      return `<div class="outro"><div class="brand-logo">${t.outro.logo}</div><div class="brand-tag">${t.outro.tag}</div><div class="disclaimer">${t.outro.disclaimer}</div></div>`;
    },
  ];

  const contentHTML = scenes[sceneIndex]();
  const contentStyle = isOutro ? 'justify-content:center' : '';

  // V10: Navigation dots
  let dotsHTML = '';
  for (let i = 0; i < NUM_SCENES; i++) {
    const isOn = i === sceneIndex;
    const dotColor = isOn ? SCENE_COLORS[i] : 'rgba(255,255,255,.15)';
    const dotWidth = isOn ? '48px' : '10px';
    const dotRadius = isOn ? '3px' : '50%';
    dotsHTML += `<div class="nd${isOn ? ' on' : ''}" style="background:${dotColor};width:${dotWidth};border-radius:${dotRadius}"></div>`;
  }
  const navInfo = `${sceneNumDisplay} ${t.sceneOf}`;
  const navHTML = `<div class="nav"><div class="ndots">${dotsHTML}</div><span class="nav-info">${navInfo}</span></div>`;

  // V10: Per-scene progress bar
  const pbHTML = `<div class="pb"><div class="pf" style="background:${color}"></div></div>`;

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${isRTL ? 'rtl' : 'ltr'}">
<head><meta charset="UTF-8"><style>${GOLD_CSS}</style></head>
<body style="direction:${isRTL ? 'rtl' : 'ltr'}">
<div class="vr">
  <div class="scene">
    <div class="scene-img" style="${bgStyle}"></div>
    <div class="overlay" style="${overlayBg}"></div>
    <div class="content" style="${contentStyle}">
      ${sceneNum ? `<div class="scene-num">${sceneNum}</div>` : ''}
      <div class="fade-in">${contentHTML}</div>
    </div>
  </div>
  ${pbHTML}
  ${navHTML}
</div>
</body>
</html>`;
}

// ═══ Main Pipeline ═══
async function generateVideo(inputPath, outputPath) {
  const startTime = Date.now();
  console.log('[Gold] Starting...');

  const data = JSON.parse(readFileSync(inputPath, 'utf-8'));
  console.log(`[Gold] Title: "${data.title?.slice(0, 50)}..."`);

  // 1. Narration
  console.log('[Gold] Step 1: Narration...');
  const narrations = await generateNarration(data);
  narrations.forEach((t, i) => console.log(`  S${i+1}: "${t?.slice(0, 60)}..."`));

  // 2. TTS per scene
  console.log('[Gold] Step 2: TTS...');
  const tmpDir = join(tmpdir(), `gold-${randomUUID()}`);
  mkdirSync(tmpDir, { recursive: true });
  const audioPaths = [];
  const audioDurations = [];

  for (let i = 0; i < NUM_SCENES; i++) {
    const audioPath = join(tmpDir, `scene_${i}.mp3`);
    const success = await generateTTS(narrations[i] || '', audioPath, data.locale || 'ar');
    if (success) {
      audioDurations.push(getAudioDuration(audioPath));
      audioPaths.push(audioPath);
      console.log(`  S${i+1}: ${audioDurations[i].toFixed(1)}s`);
    } else {
      audioDurations.push(SCENE_DURATION);
      audioPaths.push(null);
    }
  }

  // 3. Concatenate audio
  console.log('[Gold] Step 3: Audio concat...');
  const fullAudioPath = join(tmpDir, 'full.mp3');
  const validAudio = audioPaths.filter(p => p);
  if (validAudio.length > 0) {
    const listFile = join(tmpDir, 'list.txt');
    writeFileSync(listFile, validAudio.map(p => `file '${p}'`).join('\n'));
    spawnSync('ffmpeg', ['-y','-f','concat','-safe','0','-i',listFile,'-c:a','libmp3lame','-b:a','192k',fullAudioPath], { encoding: 'utf-8', timeout: 60000 });
    // Post-process: silenceremove + loudnorm
    const procPath = fullAudioPath.replace('.mp3','_proc.mp3');
    spawnSync('ffmpeg', ['-y','-i',fullAudioPath,'-af','silenceremove=stop_periods=-1:stop_duration=0.3:stop_threshold=-40dB,loudnorm=I=-16:LRA=11:TP=-1.5','-c:a','libmp3lame','-b:a','192k',procPath], { encoding: 'utf-8', timeout: 120000 });
    if (existsSync(procPath)) { try { unlinkSync(fullAudioPath); } catch {} renameSync(procPath, fullAudioPath); }
  }

  // 4. Generate AI background images (3 groups for variety)
  console.log('[Gold] Step 4: AI images...');

  // V8: Use pre-generated images from infographic pipeline (same 5-provider fallback) if available.
  // V8 expanded from 3 to 10 images — one per paragraph type. gold uses 9 (NUM_SCENES).
  // Falls back to local generation if pre_generated_images is missing or empty.
  const preGenerated = Array.isArray(data.pre_generated_images) ? data.pre_generated_images : [];
  const bgImages = [];
  if (preGenerated.length > 0) {
    console.log(`[Gold] V8: Using ${preGenerated.length} pre-generated images from infographic pipeline`);
    // Load up to NUM_SCENES images (9). If fewer, fall back to local generation for missing ones.
    for (let i = 0; i < NUM_SCENES; i++) {
      const b64 = preGenerated[i];
      if (b64) {
        bgImages.push(b64);
      } else {
        // Pre-generated ran out — generate locally for remaining scenes
        console.log(`[Gold] V8: Pre-generated image ${i + 1} missing — generating locally`);
        const prompt = `Professional financial scene ${i + 1} for "${(data.title || 'financial report').slice(0, 60)}", dark navy blue, gold accent, cinematic, 8K`;
        const buffer = await generateImage(prompt, 1344, 768);
        bgImages.push(buffer ? buffer.toString('base64') : null);
      }
      console.log(`  Image ${i+1}/${NUM_SCENES}: ${bgImages[i] ? 'OK' : 'FAILED'}`);
    }
  } else {
    console.log('[Gold] V8: No pre-generated images — falling back to local generation');
    const imagePrompts = await Promise.all([0, 3, 6].map(idx => {
      const sceneTypes = ['financial crisis scene', 'analysis and data scene', 'strategy and outlook scene'];
      return groqChat([{ role: 'user', content: `Generate a 40-word image prompt for a ${sceneTypes[Math.floor(idx/3)]} about: "${data.title || 'financial report'}". End with: cinematic, dark blue, 8K, photorealistic. No generic terms.` }], 100);
    }));
    for (let i = 0; i < 3; i++) {
      const prompt = imagePrompts[i] || 'dark financial scene, cinematic, 8K';
      const buffer = await generateImage(prompt, 1344, 768);
      bgImages.push(buffer ? buffer.toString('base64') : null);
      console.log(`  Image ${i+1}: ${buffer ? 'OK' : 'FAILED'}`);
    }
  }

  // 5. Render frames
  console.log('[Gold] Step 5: Rendering...');
  const framesDir = join(tmpDir, 'frames');
  mkdirSync(framesDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });

  let frameCount = 0;
  for (let s = 0; s < NUM_SCENES; s++) {
    const dur = Math.max(SCENE_DURATION, audioDurations[s] || 0);
    // V1051: If TTS failed (0 duration), use SCENE_DURATION as minimum
    const totalFrames = Math.ceil(dur * FPS);
    const bgImage = bgImages[s];
    const sceneStartMs = Date.now();
    console.log(`  [Scene ${s+1}/9] START — dur=${dur.toFixed(1)}s frames=${totalFrames} bgImage=${bgImage ? 'YES' : 'NO'}`);

    const html = generateSceneHTML(s, data, bgImage);
    try {
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
    } catch (setContentErr) {
      console.error(`  [Scene ${s+1}] page.setContent FAILED: ${setContentErr.message}`);
      throw new Error(`Scene ${s+1} setContent failed: ${setContentErr.message}`);
    }
    // V9.1: Skip fonts.ready wait — font is loaded via next/font, no need to wait for Google Fonts
    await page.waitForTimeout(100);

    for (let f = 0; f < totalFrames; f++) {
      // V10.2: Ken Burns via background-size + background-position (transform doesn't work on background-image)
      const kbProgress = (f + 1) / totalFrames;
      const kbSize = 100 + 8 * kbProgress; // 100% → 108% (zoom in)
      const kbPosX = 50 - 5 * kbProgress; // 50% → 45% (pan left)
      const kbPosY = 50 - 3 * kbProgress; // 50% → 47% (pan up)
      try {
        await page.evaluate(({ sz, px, py }) => {
          const img = document.querySelector('.scene-img');
          if (img) {
            img.style.backgroundSize = sz + '%';
            img.style.backgroundPosition = px + '% ' + py + '%';
          }
        }, { sz: kbSize, px: kbPosX, py: kbPosY });
      } catch {}
      // V10: Update per-scene progress bar width for this frame
      const progressPct = ((f + 1) / totalFrames) * 100;
      try {
        await page.evaluate(p => {
          const pf = document.querySelector('.pf');
          if (pf) pf.style.width = p + '%';
        }, progressPct);
      } catch {}
      try {
        await page.screenshot({ path: join(framesDir, `frame_${String(frameCount).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 90 });
      } catch (shotErr) {
        console.warn(`[Gold] Scene ${s+1} frame ${f} screenshot failed: ${shotErr.message?.slice(0, 80)}`);
      }
      frameCount++;
    }
    // V9.1: Cinematic transition via CSS class toggle (was page.evaluate per frame — too slow).
    // Apply .scene-transitioning class ONCE, then take 19 screenshots at intervals.
    // The CSS transition handles the slide+zoom+blur animation automatically.
    if (s < NUM_SCENES - 1) {
      const TRANSITION_FRAMES = 19; // 0.8s @ 24fps
      try {
        // Inject transition CSS + trigger it
        await page.addStyleTag({ content: `
          .scene-transitioning { animation: sceneExit 0.8s steps(19) forwards !important; }
          @keyframes sceneExit {
            0% { transform: translateX(0) scale(1); filter: blur(0); opacity: 1; }
            100% { transform: translateX(-100%) scale(1.15); filter: blur(8px); opacity: 0.3; }
          }
        `});
        await page.evaluate(() => {
          const scene = document.querySelector('.scene');
          if (scene) scene.classList.add('scene-transitioning');
        });
        // Wait for animation to progress, capturing frames at intervals
        for (let tf = 0; tf < TRANSITION_FRAMES; tf++) {
          await page.waitForTimeout(33); // ~33ms per frame step (24fps)
          try {
            await page.screenshot({ path: join(framesDir, `frame_${String(frameCount).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 90 });
          } catch (shotErr) {
            console.warn(`[Gold] Transition ${tf} screenshot failed: ${shotErr.message?.slice(0, 80)}`);
          }
          frameCount++;
        }
      } catch (transErr) {
        console.warn(`[Gold] Scene ${s+1} transition failed: ${transErr.message?.slice(0, 80)} — skipping`);
      }
    }
    const sceneElapsed = ((Date.now() - sceneStartMs) / 1000).toFixed(1);
    console.log(`  [Scene ${s+1}/9] DONE in ${sceneElapsed}s — total frames so far: ${frameCount}`);
  }
  await browser.close();
  console.log(`  Total frames: ${frameCount}`);

  // 6. FFmpeg encode
  // V9.1: preset fast (was medium) — halves encoding time + memory on Railway.
  // Removed -bufsize 10M (was causing high memory spikes). maxrate alone is enough.
  console.log('[Gold] Step 6: FFmpeg...');
  const videoOnlyPath = join(tmpDir, 'video.mp4');
  spawnSync('ffmpeg', ['-y','-framerate',String(FPS),'-i',join(framesDir,'frame_%05d.jpg'),'-vf','format=yuv420p','-pix_fmt','yuv420p','-c:v','libx264','-preset','fast','-crf','16','-maxrate','6M','-g','48','-keyint_min','48','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-movflags','+faststart',videoOnlyPath], { encoding: 'utf-8', timeout: 300000 });

  // 7. Merge
  // V9: Added -shortest to cut video at audio end — fixes 29s silent gap at the end.
  console.log('[Gold] Step 7: Merge...');
  if (existsSync(fullAudioPath)) {
    spawnSync('ffmpeg', ['-y','-i',videoOnlyPath,'-i',fullAudioPath,'-c:v','copy','-c:a','aac','-b:a','192k','-ac','2','-shortest','-movflags','+faststart',outputPath], { encoding: 'utf-8', timeout: 120000 });
  } else {
    renameSync(videoOnlyPath, outputPath);
  }

  // 8. Cleanup
  try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const size = (statSync(outputPath).size / 1024 / 1024).toFixed(1);
  console.log(`[Gold] ✅ Done — ${elapsed}s | ${size}MB`);
}

// ═══ CLI ═══
function main() {
  const args = process.argv.slice(2);
  let input = '', output = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i+1]) input = args[++i];
    if (args[i] === '--output' && args[i+1]) output = args[++i];
  }
  if (!input || !output) {
    console.error('Usage: node video-renderer-gold.mjs --input data.json --output video.mp4');
    process.exit(1);
  }
  generateVideo(input, output).catch(err => { console.error('[Gold] FATAL:', err.message); process.exit(1); });
}

main();

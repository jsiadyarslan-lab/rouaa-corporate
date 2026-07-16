// ═══════════════════════════════════════════════════════════════
// Mobile Video Templates — Shared module for all 5 renderers
//
// Implements the EXACT reference design from rouaa-video-mobile-design.html:
//   - Hook: title + price-row + chip-row (2 chips)
//   - Data: title + bar-items (label + value + proportional bar)
//   - Impact: title + impact-rows (dot + name + sub + val + arrow)
//   - Resolution: title + rec-cards (ticker + action badge + levels)
//   - Context: title + ctx-items (label + value)
//
// Design principles from reference:
//   1. Content pinned to bottom (position:absolute;bottom:0)
//   2. Rail is thin (14px), full height, colored by scene type
//   3. Scene-tag is small pill at top-right
//   4. Progress is thin segments at top
//   5. Background VISIBLE through gradient (97% bottom → 15% middle)
//   6. Bar widths = ACTUAL value percentage (proportional)
//   7. Cards semi-transparent with subtle borders
//
// All sizes scaled from 300px reference → 1080px video (×3.6)
// ═══════════════════════════════════════════════════════════════

// ─── Utility functions ─────────────────────────────────────────
function _escapeHTML(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function _stripMarkdown(text) {
  if (!text) return '';
  return String(text).replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/#{1,6}\s+/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/<[^>]+>/g, '').trim();
}
function _parseDisplayItems(text) {
  if (!text) return [];
  return _stripMarkdown(text).split(/\s*[|›]\s*/).map(s => s.trim()).filter(s => s.length > 0);
}

// Parse "label: value%" or "label: value" → { label, value, numericValue, isPercentage }
function _parseStatItem(text) {
  const m = text.match(/^(.+?)[:：]\s*([+\-]?[\d.,]+)\s*(%?)\s*(.*)$/);
  if (m) {
    const num = parseFloat(m[2].replace(/,/g, ''));
    return {
      label: m[1].trim(),
      value: m[2] + (m[3] || '') + (m[4] ? ' ' + m[4].trim() : ''),
      numericValue: isNaN(num) ? null : num,
      isPercentage: m[3] === '%',
      isNegative: m[2].startsWith('-'),
      raw: text,
    };
  }
  return { label: text, value: '', numericValue: null, isPercentage: false, isNegative: false, raw: text };
}

// ─── Scene type labels (5 languages) ───────────────────────────
export const MOBILE_SCENE_LABELS = {
  ar: { hook: 'افتتاح', context: 'سياق', data: 'بيانات', impact: 'تأثير', resolution: 'توصية' },
  en: { hook: 'HOOK', context: 'CONTEXT', data: 'DATA', impact: 'IMPACT', resolution: 'ACTION' },
  fr: { hook: 'OUVERTURE', context: 'CONTEXTE', data: 'DONNÉES', impact: 'IMPACT', resolution: 'ACTION' },
  tr: { hook: 'AÇILIŞ', context: 'BAĞLAM', data: 'VERİ', impact: 'ETKİ', resolution: 'EYLEM' },
  es: { hook: 'INICIO', context: 'CONTEXTO', data: 'DATOS', impact: 'IMPACTO', resolution: 'ACCIÓN' },
};

// ─── Mobile CSS (identical for ALL renderers) ──────────────────
// Sizes scaled from reference 300px → video 1080px (×3.6)
// Reference values in comments for traceability
export const MOBILE_CSS = `
/* ═══ REFERENCE MOBILE DESIGN — exact values from rouaa-video-mobile-design.html ═══ */
/* Hide desktop-only elements */
body.mobile .top-bar,body.mobile .nav,body.mobile .progress-bar,body.mobile .pulse-counter,
body.mobile .hdr,body.mobile .ftr,body.mobile .sidebar,body.mobile .lower-third{display:none!important}
/* Background image — visible but darkened (ref: gradient overlay) */
body.mobile .scene-img{filter:brightness(0.5) saturate(0.7) contrast(1.05)!important}
body.mobile .overlay{background:linear-gradient(to top,rgba(6,8,15,.97) 0%,rgba(6,8,15,.78) 38%,rgba(6,8,15,.15) 62%,rgba(6,8,15,.35) 100%)!important}
body.mobile .scanline{display:none!important}
/* Content wrap — pinned to bottom (ref: .content{position:absolute;bottom:0}) */
body.mobile .content-wrap{position:absolute!important;bottom:0!important;left:0!important;right:0!important;top:auto!important;z-index:10!important;padding:0!important;height:auto!important;max-height:75%!important;overflow-y:auto!important;background:transparent!important}
body.mobile .content-wrap>div{height:auto!important;min-height:auto!important;padding:65px 65px 80px!important;display:block!important;background:transparent!important;border:none!important;border-radius:0!important;backdrop-filter:none!important;box-shadow:none!important;margin:0!important}
body.mobile .content-wrap>div>div{padding:0!important}
body.mobile .content{position:relative!important;padding:0!important;background:transparent!important;border:none!important}
/* Rail — left side (ref: top:18px bottom:18px left:14px width:4px → ×3.6) */
body.mobile .mobile-rail{position:absolute;top:65px;bottom:65px;left:50px;width:14px;border-radius:14px;background:rgba(255,255,255,.08);z-index:5;display:block!important}
body.mobile .mobile-rail-fill{position:absolute;bottom:0;left:0;width:100%;border-radius:14px;transition:height .3s ease;box-shadow:0 0 12px currentColor}
/* Scene tag — pill at top-right (ref: top:18px right:18px padding:6px 12px font:10.5px → ×3.6) */
body.mobile .scene-tag{position:absolute;top:65px;right:50px;z-index:6;display:flex;align-items:center;gap:22px;background:rgba(17,21,31,.72);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.08);padding:22px 43px;border-radius:100px;font-size:38px;font-weight:600;letter-spacing:.3px}
body.mobile .scene-tag .dot{width:22px;height:22px;border-radius:50%;flex-shrink:0}
/* Progress dots — top (ref: top:10px left:18px right:18px gap:4px height:3px → ×3.6) */
body.mobile .mobile-progress{position:absolute;top:36px;left:65px;right:65px;z-index:50;display:flex;gap:14px}
body.mobile .mobile-progress span{flex:1;height:11px;border-radius:11px;background:rgba(255,255,255,.18)}
body.mobile .mobile-progress span.done{background:#F4F2EC}
/* HOOK scene (ref: title 23px, price 34px, unit 13px, chip v 13px l 10px → ×3.6) */
body.mobile .hook-title{font-size:83px;font-weight:700;line-height:1.35;margin-bottom:50px;color:#F4F2EC;text-shadow:0 2px 12px rgba(0,0,0,.9)}
body.mobile .hook-price-row{display:flex;align-items:baseline;gap:29px;margin-bottom:36px}
body.mobile .hook-price{font-size:122px;font-weight:700;letter-spacing:-1.5px;text-shadow:0 4px 20px rgba(0,0,0,.9)}
body.mobile .hook-unit{font-size:47px;font-weight:500;color:rgba(244,242,236,.6)}
body.mobile .chip-row{display:flex;gap:29px;margin-top:14px}
body.mobile .chip{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:36px;padding:29px 36px;flex:1}
body.mobile .chip .v{font-size:47px;font-weight:700;color:#F4F2EC}
body.mobile .chip .l{font-size:36px;color:rgba(244,242,236,.5);margin-top:7px}
/* DATA + CONTEXT scene (ref: title 19px, label 12.5px, value 12.5px → ×3.6) */
body.mobile .data-title{font-size:68px;font-weight:700;margin-bottom:57px;color:#F4F2EC;text-shadow:0 2px 12px rgba(0,0,0,.9)}
body.mobile .bar-item{margin-bottom:47px}
body.mobile .bar-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:22px}
body.mobile .bar-label{font-size:45px;font-weight:600;color:#F4F2EC;text-shadow:0 2px 8px rgba(0,0,0,.9)}
body.mobile .bar-value{font-size:45px;font-weight:700;text-shadow:0 2px 8px rgba(0,0,0,.9)}
body.mobile .bar-track{height:22px;border-radius:22px;background:rgba(255,255,255,.08);overflow:hidden}
body.mobile .bar-fill{height:100%;border-radius:22px;transition:width .5s ease}
body.mobile .ctx-item{display:flex;justify-content:space-between;align-items:baseline;padding:29px 0;border-bottom:1px solid rgba(255,255,255,.06)}
body.mobile .ctx-label{font-size:45px;font-weight:600;color:#F4F2EC;text-shadow:0 2px 8px rgba(0,0,0,.9)}
body.mobile .ctx-value{font-size:45px;font-weight:700;text-shadow:0 2px 8px rgba(0,0,0,.9)}
/* IMPACT scene (ref: title 19px, name 12.5px, sub 10px, val 13px → ×3.6) */
body.mobile .impact-title{font-size:68px;font-weight:700;margin-bottom:50px;color:#F4F2EC;text-shadow:0 2px 12px rgba(0,0,0,.9)}
body.mobile .impact-row{display:flex;align-items:center;justify-content:space-between;padding:36px 43px;border-radius:36px;margin-bottom:29px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07)}
body.mobile .impact-left{display:flex;align-items:center;gap:29px}
body.mobile .impact-left .dot{width:22px;height:22px;border-radius:50%;flex-shrink:0}
body.mobile .impact-name{font-size:45px;font-weight:600;color:#F4F2EC;text-shadow:0 2px 8px rgba(0,0,0,.9)}
body.mobile .impact-sub{font-size:36px;color:rgba(244,242,236,.5);margin-top:4px}
body.mobile .impact-val{font-size:47px;font-weight:700;display:flex;align-items:center;gap:14px;text-shadow:0 2px 8px rgba(0,0,0,.9)}
body.mobile .arrow{font-size:40px}
/* RESOLUTION scene (ref: title 19px, ticker 13.5px, action 10px → ×3.6) */
body.mobile .res-title{font-size:68px;font-weight:700;margin-bottom:50px;color:#F4F2EC;text-shadow:0 2px 12px rgba(0,0,0,.9)}
body.mobile .rec-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:43px;padding:43px 50px;margin-bottom:32px}
body.mobile .rec-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:29px}
body.mobile .rec-ticker{font-size:48px;font-weight:700;color:#F4F2EC;text-shadow:0 2px 8px rgba(0,0,0,.9)}
body.mobile .rec-action{font-size:36px;font-weight:700;padding:11px 32px;border-radius:100px}
body.mobile .rec-levels{display:flex;gap:50px;font-size:40px;color:rgba(244,242,236,.5)}
body.mobile .rec-levels b{display:block;font-size:45px;margin-top:4px;color:#F4F2EC;font-weight:600}
/* Outro */
body.mobile .outro-logo{font-size:83px!important}
body.mobile .outro-tag{font-size:36px!important;margin-bottom:72px!important}
body.mobile .outro-disclaimer{font-size:32px!important;padding:43px 50px!important;max-width:90%!important}
`;

// ─── Create mobile template functions (parameterized by colors) ───
export function createMobileTemplates(colors) {
  const C = colors; // { gold, teal, coral, violet }

  const SCENE_COLORS = {
    hook: C.violet,
    context: C.teal,
    data: C.teal,
    impact: C.coral,
    resolution: C.gold,
  };

  // ─── HOOK: title + price-row + chip-row (exactly like reference) ───
  function mobileHook(scene, locale, color) {
    const title = _escapeHTML(_stripMarkdown(scene.title || scene.sceneTitle || ''));
    const items = _parseDisplayItems(scene.displayText);

    // Extract price (first numeric value) and unit
    let price = '';
    let unit = '';
    let chipStartIdx = 0;
    if (items.length > 0) {
      const priceMatch = items[0].match(/([+\-$€£¥]?[\d.,]+\s*%?)/);
      if (priceMatch) {
        price = priceMatch[1].trim();
        const remaining = items[0].replace(priceMatch[0], '').replace(/^[:|›\s\-–—]+/, '').trim();
        unit = remaining;
        chipStartIdx = 1;
      }
    }

    // Chips: next 2 items (or first 2 if no price found)
    const chipItems = items.slice(chipStartIdx, chipStartIdx + 2);
    const chipColors = [C.gold, C.teal];
    const chipsHTML = chipItems.map((item, i) => {
      const parts = item.split(/[:：]/);
      const v = (parts[0] || item).trim();
      const l = (parts[1] || '').trim();
      const c = chipColors[i % 2];
      return `<div class="chip"><div class="v" style="color:${c}">${_escapeHTML(v)}</div>${l ? `<div class="l">${_escapeHTML(l)}</div>` : ''}</div>`;
    }).join('');

    return `<div class="content"><div class="hook-title">${title}</div>${price ? `<div class="hook-price-row"><span class="hook-price" style="color:${C.gold}">${_escapeHTML(price)}</span>${unit ? `<span class="hook-unit">${_escapeHTML(unit)}</span>` : ''}</div>` : ''}${chipsHTML ? `<div class="chip-row">${chipsHTML}</div>` : ''}</div>`;
  }

  // ─── CONTEXT: title + ctx-items (label + value) ───
  function mobileContext(scene, locale, color) {
    const title = _escapeHTML(_stripMarkdown(scene.title || scene.sceneTitle || ''));
    const items = _parseDisplayItems(scene.displayText).slice(0, 4);
    const itemColors = [C.teal, C.gold, C.coral, C.violet];
    const itemsHTML = items.map((item, i) => {
      const parts = item.match(/^(.+?)[:：]\s*(.+)$/);
      const label = parts ? parts[1].trim() : item;
      const value = parts ? parts[2].trim() : '';
      const c = itemColors[i % 4];
      return `<div class="ctx-item"><span class="ctx-label">${_escapeHTML(label)}</span>${value ? `<span class="ctx-value" style="color:${c}">${_escapeHTML(value)}</span>` : ''}</div>`;
    }).join('');
    return `<div class="content"><div class="data-title">${title}</div>${itemsHTML}</div>`;
  }

  // ─── DATA: title + bar-items with PROPORTIONAL bars ───
  function mobileData(scene, locale, color) {
    const title = _escapeHTML(_stripMarkdown(scene.title || scene.sceneTitle || ''));
    const items = _parseDisplayItems(scene.displayText);
    const stats = items.map(_parseStatItem).slice(0, 4);

    // Find max absolute value for proportional bar widths
    const numericValues = stats.map(s => s.numericValue).filter(v => v !== null && !isNaN(v));
    const maxVal = numericValues.length > 0 ? Math.max(...numericValues.map(Math.abs)) : 100;

    const barColors = [C.teal, C.gold, C.coral, C.violet];
    const barsHTML = stats.map((stat, i) => {
      const c = barColors[i % 4];
      // Proportional width: value/maxVal × 100, clamped to 10-95%
      let widthPct;
      if (stat.numericValue !== null && maxVal > 0) {
        widthPct = Math.max(10, Math.min(95, (Math.abs(stat.numericValue) / maxVal) * 100));
      } else {
        // No numeric value — use descending pattern (60, 45, 30, 15)
        widthPct = 60 - (i * 15);
      }
      return `<div class="bar-item"><div class="bar-top"><span class="bar-label">${_escapeHTML(stat.label)}</span><span class="bar-value" style="color:${c}">${_escapeHTML(stat.value || '—')}</span></div><div class="bar-track"><div class="bar-fill" style="width:${widthPct}%;background:${c}"></div></div></div>`;
    }).join('');
    return `<div class="content"><div class="data-title">${title}</div>${barsHTML}</div>`;
  }

  // ─── IMPACT: title + impact-rows (dot + name + sub + val + arrow) ───
  function mobileImpact(scene, locale, color) {
    const title = _escapeHTML(_stripMarkdown(scene.title || scene.sceneTitle || ''));
    const items = _parseDisplayItems(scene.displayText);

    // Parse benefiting/harmed sections (universal — works for all 5 languages)
    const benefiting = []; const harmed = []; let section = null;
    for (const item of items) {
      const colonMatch = item.match(/^(.+?)[:：]\s*(.+)$/);
      if (colonMatch) {
        const prefix = colonMatch[1].toLowerCase();
        const content = colonMatch[2].trim();
        if (/يستفيد|مستفيد|benefit|gain|up|bullish|yarar|kazan|beneficio|ganancia/i.test(prefix)) {
          section = 'up'; if (content) benefiting.push(content); continue;
        }
        if (/يتضرر|متضرر|harm|loss|down|bearish|zarar|kayb|perjuicio|p[eé]rdida/i.test(prefix)) {
          section = 'down'; if (content) harmed.push(content); continue;
        }
      }
      // If no section header, assign based on + / - sign
      if (section === 'up') benefiting.push(item);
      else if (section === 'down') harmed.push(item);
      else {
        // Auto-detect: items with + or ▲ go to benefiting, - or ▼ go to harmed
        if (/^[+\-]?[\d.]+%?/.test(item) && item.startsWith('-')) harmed.push(item);
        else benefiting.push(item);
      }
    }

    const rowHTML = (arr, isUp) => arr.slice(0, 4).map((item) => {
      const c = isUp ? C.teal : C.coral;
      const arrow = isUp ? '▲' : '▼';
      // Parse: "Name - Sub" or "Name | Sub" or just "Name"
      const parts = item.match(/^(.+?)(?:\s*[-–—]\s*|\s*\|\s*)(.+)$/);
      const name = parts ? parts[1].trim() : item;
      const sub = parts ? parts[2].trim() : '';
      // Extract numeric value (e.g. +4.8%, -0.6%, 210)
      const valMatch = item.match(/([+\-]?[\d.,]+\s*%?)/);
      const val = valMatch ? valMatch[1].trim() : '';
      return `<div class="impact-row"><div class="impact-left"><span class="dot" style="background:${c}"></span><div><div class="impact-name">${_escapeHTML(name)}</div>${sub ? `<div class="impact-sub">${_escapeHTML(sub)}</div>` : ''}</div></div>${val ? `<div class="impact-val" style="color:${c}">${_escapeHTML(val)} <span class="arrow">${arrow}</span></div>` : ''}</div>`;
    }).join('');

    return `<div class="content"><div class="impact-title">${title}</div>${rowHTML(benefiting, true)}${rowHTML(harmed, false)}</div>`;
  }

  // ─── RESOLUTION: title + rec-cards (ticker + action + levels) ───
  function mobileResolution(scene, locale, color) {
    const title = _escapeHTML(_stripMarkdown(scene.title || scene.sceneTitle || ''));
    const items = _parseDisplayItems(scene.displayText).slice(0, 3);
    const cardColors = [C.teal, C.gold, C.coral];

    const cardsHTML = items.map((item, i) => {
      const c = cardColors[i % 3];
      // Parse: "TICKER: action entry X target Y stop Z"
      // or "TICKER - action" or "TICKER | levels"
      const parts = item.match(/^(.+?)(?:\s*[:：]\s*|\s*[-–—]\s*|\s*\|\s*)(.+)$/);
      const ticker = parts ? parts[1].trim() : item.split(/\s+/)[0];
      const rest = parts ? parts[2].trim() : '';

      // Detect action keyword
      const actionMatch = rest.match(/^(buy|sell|hold|شراء|بيع|انتظار|acheter|vendre|sat|al|comprar|vender|wait|احتفظ|monitor|watch|تنويع|diversify)/i);
      const action = actionMatch ? actionMatch[1] : '';
      const remaining = actionMatch ? rest.replace(actionMatch[0], '').trim() : rest;

      // Parse levels from remaining: "entry 238-241 target 255 stop 230"
      const levels = [];
      const entryMatch = remaining.match(/(?:entry|دخول|giriş|entrada)[:\s]*([+\-]?[\d.,–\s]+)/i);
      const targetMatch = remaining.match(/(?:target|goal|هدف|hedef|objetivo)[:\s]*([+\-]?[\d.,\s]+)/i);
      const stopMatch = remaining.match(/(?:stop|sl|وقف|zarar|parada)[:\s]*([+\-]?[\d.,\s]+)/i);

      if (entryMatch) levels.push(`<span>دخول<b style="color:#F4F2EC">${_escapeHTML(entryMatch[1].trim())}</b></span>`);
      if (targetMatch) levels.push(`<span>هدف<b style="color:${C.teal}">${_escapeHTML(targetMatch[1].trim())}</b></span>`);
      if (stopMatch) levels.push(`<span>وقف<b style="color:${C.coral}">${_escapeHTML(stopMatch[1].trim())}</b></span>`);

      const levelsHTML = levels.length > 0
        ? `<div class="rec-levels">${levels.join('')}</div>`
        : (remaining ? `<div class="rec-levels"><span>${_escapeHTML(remaining)}</span></div>` : '');

      return `<div class="rec-card"><div class="rec-head"><span class="rec-ticker">${_escapeHTML(ticker)}</span>${action ? `<span class="rec-action" style="background:${c}25;color:${c}">${_escapeHTML(action)}</span>` : ''}</div>${levelsHTML}</div>`;
    }).join('');

    return `<div class="content"><div class="res-title">${title}</div>${cardsHTML}</div>`;
  }

  return {
    templates: {
      hook: mobileHook,
      context: mobileContext,
      data: mobileData,
      impact: mobileImpact,
      resolution: mobileResolution,
    },
    sceneColors: SCENE_COLORS,
  };
}

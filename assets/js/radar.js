/* ============================================================
   رؤى · Radar Logic + Live Feed + System Status
   الرادار محفوظ بالكامل — أضفنا فقط تغذية Live Feed
   ============================================================ */

(function(){
  const targetsEl = document.getElementById('radarTargets');
  const countEl = document.getElementById('rCount');
  const sweepEl = document.getElementById('rSweep');
  const clockEl = document.getElementById('rClock');
  const statusEl = document.getElementById('rStatus');
  if(!targetsEl) return;

  // === Live Feed elements ===
  const feedList = document.getElementById('liveFeedList');
  const feedCount = document.getElementById('feedCount');
  const sysUpdate = document.getElementById('sysUpdate');
  const sysSignals = document.getElementById('sysSignals');
  const sysLatency = document.getElementById('sysLatency');
  const sysSources = document.getElementById('sysSources');
  const pulseSources = document.getElementById('pulseSources');
  const pulseAI = document.getElementById('pulseAI');

  let totalSignals = 0;
  const feedItems = [];
  const MAX_FEED = 7;

  const SWEEP_DUR = 4000;
  let active = [];
  const MAX = 7;
  const rand = (a,b) => a + Math.random()*(b-a);

  function pad(n) { return n.toString().padStart(2,'0'); }
  function nowStr() {
    const d = new Date();
    return pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());
  }

  function addToFeed(label, type) {
    if (!feedList) return;
    totalSignals++;

    // Determine signal
    let signal = '↑', signalClass = 'up';
    if (type === 'hostile') { signal = '↓'; signalClass = 'down'; }
    else if (type === 'neutral') { signal = '◆'; signalClass = 'neutral'; }

    const li = document.createElement('li');
    li.className = 'live-feed-item';
    li.innerHTML = `
      <span class="lf-time">${nowStr()}</span>
      <span class="lf-pair">${label}</span>
      <span class="lf-signal ${signalClass}">${signal}</span>
    `;
    feedList.insertBefore(li, feedList.firstChild);
    feedItems.unshift(li);

    // Mark older items as fading
    feedItems.forEach((item, i) => {
      if (i >= 3) item.classList.add('fading');
      else item.classList.remove('fading');
    });

    // Remove excess
    while (feedItems.length > MAX_FEED) {
      const old = feedItems.pop();
      old.remove();
    }

    // Update counts
    if (feedCount) feedCount.textContent = totalSignals;
    if (sysSignals) sysSignals.textContent = totalSignals;
    if (sysUpdate) sysUpdate.textContent = nowStr();
  }

  function spawn(){
    if(active.length >= MAX) return;
    const r = rand(15, 92);
    const ang = rand(0, Math.PI*2);
    const x = 50 + Math.cos(ang)*r;
    const y = 50 + Math.sin(ang)*r;
    const t = document.createElement('div');

    const labels = [
      {text:'EUR/USD', type:'fx'},
      {text:'GBP/JPY', type:'fx'},
      {text:'USD/JPY', type:'fx'},
      {text:'XAU/USD', type:'commodity'},
      {text:'BTC/USDT', type:'crypto'},
      {text:'ETH/USDT', type:'crypto'},
      {text:'FED RATE 5.50%', type:'rate', hostile:false},
      {text:'US CPI 3.2%', type:'data'},
      {text:'US GDP +1.3%', type:'data'},
      {text:'ECB RATE 3.75%', type:'rate'},
      {text:'NONFARM +272K', type:'data'},
      {text:'OIL WTI $85', type:'commodity'},
      {text:'NASDAQ +0.9%', type:'index'},
      {text:'BOE RATE 5.25%', type:'rate'},
      {text:'US JOBLESS 3.8%', type:'data'},
    ];
    const pick = labels[Math.floor(Math.random()*labels.length)];

    // Add visible label text
    const label = document.createElement('span');
    label.textContent = pick.text;
    t.appendChild(label);

    let targetType = 'target';
    // Hostile = bearish data (high inflation, rate hikes)
    if(pick.text.includes('CPI') && parseFloat(pick.text.match(/[\d.]+/)?.[0] || '0') > 3) {
      t.className = 'target hostile';
      targetType = 'hostile';
    } else if(pick.text.includes('RATE') && parseFloat(pick.text.match(/[\d.]+/)?.[0] || '0') >= 5) {
      t.className = 'target neutral';
      targetType = 'neutral';
    } else {
      t.className = 'target';
    }

    t.style.left = x + '%';
    t.style.top = y + '%';
    targetsEl.appendChild(t);
    active.push({el:t});

    // === أضف إلى Live Feed ===
    addToFeed(pick.text, targetType);

    setTimeout(()=>{ t.remove(); active = active.filter(a=>a.el!==t); }, 4000);
  }

  setInterval(spawn, 650);
  for(let i=0;i<4;i++) setTimeout(spawn, i*150);

  function loop(){
    if(countEl) countEl.textContent = pad(active.length);
    if(clockEl) clockEl.textContent = nowStr();
    if(sweepEl){
      const e = (performance.now() % SWEEP_DUR) / SWEEP_DUR;
      sweepEl.textContent = Math.floor(e*360).toString().padStart(3,'0') + '°';
    }
    requestAnimationFrame(loop);
  }
  loop();

  const statuses = ['نشط','يبحث','يتتبع','مباشر'];
  setInterval(()=>{
    if(statusEl) statusEl.textContent = statuses[Math.floor(Math.random()*statuses.length)];
  }, 3500);

  // === System status updates ===
  // Latency fluctuation
  setInterval(()=>{
    if (sysLatency) {
      const lat = (3.8 + Math.random() * 1.2).toFixed(1);
      sysLatency.textContent = lat + 'ms';
    }
  }, 2000);

  // Active sources fluctuation
  setInterval(()=>{
    if (sysSources) {
      const n = 12 + Math.floor(Math.random() * 6);
      sysSources.textContent = n;
    }
    if (pulseSources) {
      const n = 12 + Math.floor(Math.random() * 6);
      pulseSources.textContent = n + ' نشط الآن';
    }
  }, 4000);

  // AI roles fluctuation
  setInterval(()=>{
    if (pulseAI) {
      const n = 2 + Math.floor(Math.random() * 4);
      pulseAI.textContent = n + ' تحلل الآن';
    }
  }, 5000);
})();

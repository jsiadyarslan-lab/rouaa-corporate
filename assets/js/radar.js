/* ============================================================
   رؤى · Radar Logic (محفوظ بالكامل من index.html الأصلي)
   ============================================================ */

(function(){
  const targetsEl = document.getElementById('radarTargets');
  const countEl = document.getElementById('rCount');
  const sweepEl = document.getElementById('rSweep');
  const clockEl = document.getElementById('rClock');
  const statusEl = document.getElementById('rStatus');
  if(!targetsEl) return;

  const SWEEP_DUR = 4000;
  let active = [];
  const MAX = 7;
  const rand = (a,b) => a + Math.random()*(b-a);

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

    // Hostile = bearish data (high inflation, rate hikes)
    if(pick.text.includes('CPI') && parseFloat(pick.text.match(/[\d.]+/)?.[0] || '0') > 3) {
      t.className = 'target hostile';
    } else if(pick.text.includes('RATE') && parseFloat(pick.text.match(/[\d.]+/)?.[0] || '0') >= 5) {
      t.className = 'target neutral';
    } else {
      t.className = 'target';
    }

    t.style.left = x + '%';
    t.style.top = y + '%';
    targetsEl.appendChild(t);
    active.push({el:t});
    setTimeout(()=>{ t.remove(); active = active.filter(a=>a.el!==t); }, 4000);
  }

  setInterval(spawn, 650);
  for(let i=0;i<4;i++) setTimeout(spawn, i*150);

  const pad = n => n.toString().padStart(2,'0');
  function loop(){
    if(countEl) countEl.textContent = pad(active.length);
    if(clockEl){
      const d = new Date();
      clockEl.textContent = pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());
    }
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
})();

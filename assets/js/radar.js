/* ============================================================
   رؤى · Radar Logic — محفوظ بالكامل
   ============================================================ */

(function(){
  const targetsEl = document.getElementById('radarTargets');
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
      {text:'EUR/USD'}, {text:'GBP/JPY'}, {text:'USD/JPY'}, {text:'XAU/USD'},
      {text:'BTC/USDT'}, {text:'ETH/USDT'}, {text:'US CPI 3.2%', hostile:true},
      {text:'FED RATE 5.50%', neutral:true}, {text:'OIL WTI $85'}, {text:'NASDAQ +0.9%'},
    ];
    const pick = labels[Math.floor(Math.random()*labels.length)];

    if(pick.hostile) t.className = 'target hostile';
    else if(pick.neutral) t.className = 'target neutral';
    else t.className = 'target';

    t.style.left = x + '%';
    t.style.top = y + '%';
    targetsEl.appendChild(t);
    active.push({el:t});
    setTimeout(()=>{ t.remove(); active = active.filter(a=>a.el!==t); }, 4000);
  }

  setInterval(spawn, 800);
  for(let i=0;i<3;i++) setTimeout(spawn, i*200);
})();

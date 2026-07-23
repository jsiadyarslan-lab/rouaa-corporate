/* ============================================================
   رؤى · Main JS — Reveal + Nav scroll (no tilt)
   ============================================================ */

(function(){
  // === Reveal on scroll ===
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, {threshold: 0.1});
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // === Nav scroll state ===
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => {
      if (window.scrollY > 20) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, {passive: true});
    onScroll();
  }
})();

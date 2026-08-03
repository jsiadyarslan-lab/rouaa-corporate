/* ============================================================
   رؤى · Lightbox — فتح الصور بحجم كامل + zoom + pan
   ============================================================ */

(function(){
  'use strict';

  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.innerHTML = `
    <button class="lightbox-close" aria-label="إغلاق">×</button>
    <button class="lightbox-nav prev" aria-label="السابق">‹</button>
    <button class="lightbox-nav next" aria-label="التالي">›</button>
    <div class="lightbox-stage">
      <img class="lightbox-img" alt="">
      <div class="lightbox-caption"></div>
    </div>
    <div class="lightbox-counter"></div>
    <div class="lightbox-hint">انقر للتكبير · اسحب للتحريك · ESC للإغلاق</div>
  `;
  document.body.appendChild(lightbox);

  const stage    = lightbox.querySelector('.lightbox-stage');
  const img      = lightbox.querySelector('.lightbox-img');
  const caption  = lightbox.querySelector('.lightbox-caption');
  const counter  = lightbox.querySelector('.lightbox-counter');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  const prevBtn  = lightbox.querySelector('.lightbox-nav.prev');
  const nextBtn  = lightbox.querySelector('.lightbox-nav.next');

  let items = [];
  let current = 0;
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let isDragging = false;
  let startX = 0, startY = 0;
  let startTX = 0, startTY = 0;

  function open(index) {
    current = index;
    update();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    resetTransform();
  }

  function resetTransform() {
    scale = 1;
    translateX = 0;
    translateY = 0;
    img.style.transform = '';
    img.classList.remove('zoomed');
  }

  function update() {
    const item = items[current];
    if (!item) return;
    resetTransform();
    img.src = item.src;
    img.alt = item.caption || '';
    caption.textContent = item.caption || '';
    counter.textContent = `${current + 1} / ${items.length}`;
  }

  function next() {
    current = (current + 1) % items.length;
    update();
  }

  function prev() {
    current = (current - 1 + items.length) % items.length;
    update();
  }

  // === Collect all zoomable images ===
  function collectImages() {
    items = [];
    document.querySelectorAll('[data-zoom]').forEach(el => {
      const imgEl = el.querySelector('img') || el;
      const src = imgEl.dataset.full || imgEl.src;
      const caption = el.dataset.caption || imgEl.alt || '';
      items.push({ src, caption, el });
    });
  }

  // === Bind clicks on [data-zoom] ===
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-zoom]');
    if (target) {
      collectImages();
      const idx = items.findIndex(it => it.el === target);
      if (idx >= 0) open(idx);
    }
  });

  // === Close handlers ===
  closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target === stage) close();
  });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') prev();   // RTL: right = previous
    if (e.key === 'ArrowLeft') next();    // RTL: left = next
    if (e.key === '+' || e.key === '=') zoomIn();
    if (e.key === '-') zoomOut();
    if (e.key === '0') resetTransform();
  });

  // === Navigation ===
  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); next(); });
  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prev(); });

  // === Zoom on click ===
  img.addEventListener('click', (e) => {
    e.stopPropagation();
    if (scale === 1) zoomIn();
    else resetTransform();
  });

  // === Wheel zoom ===
  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  }, { passive: false });

  function zoomIn() {
    scale = Math.min(scale + 0.5, 4);
    applyTransform();
    if (scale > 1) img.classList.add('zoomed');
  }

  function zoomOut() {
    scale = Math.max(scale - 0.5, 1);
    if (scale === 1) {
      translateX = 0;
      translateY = 0;
      img.classList.remove('zoomed');
    }
    applyTransform();
  }

  function applyTransform() {
    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }

  // === Pan (drag) when zoomed ===
  img.addEventListener('mousedown', (e) => {
    if (scale === 1) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startTX = translateX;
    startTY = translateY;
    img.style.cursor = 'grabbing';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    translateX = startTX + (e.clientX - startX);
    translateY = startTY + (e.clientY - startY);
    applyTransform();
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    img.style.cursor = scale > 1 ? 'grab' : 'zoom-in';
  });

  // === Touch support ===
  let touchStartX = 0, touchStartY = 0;
  img.addEventListener('touchstart', (e) => {
    if (scale === 1) return;
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      startTX = translateX;
      startTY = translateY;
      isDragging = true;
    }
  }, { passive: true });

  img.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    translateX = startTX + (e.touches[0].clientX - touchStartX);
    translateY = startTY + (e.touches[0].clientY - touchStartY);
    applyTransform();
    e.preventDefault();
  }, { passive: false });

  img.addEventListener('touchend', () => { isDragging = false; });

  // Swipe to navigate (when not zoomed)
  let swipeStartX = 0;
  stage.addEventListener('touchstart', (e) => {
    if (scale === 1 && e.touches.length === 1) swipeStartX = e.touches[0].clientX;
  }, { passive: true });

  stage.addEventListener('touchend', (e) => {
    if (scale !== 1) return;
    const dx = e.changedTouches[0].clientX - swipeStartX;
    if (Math.abs(dx) > 50) {
      if (dx > 0) prev();  // swipe right = previous (RTL)
      else next();         // swipe left = next (RTL)
    }
  });

  // Init
  collectImages();
})();

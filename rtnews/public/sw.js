// Service Worker for رؤى PWA v11
// V11: Clear stale 301 redirect cache (stock-analysis → analysis)

const STATIC_CACHE = 'rouaa-static-v11';
const DYNAMIC_CACHE = 'rouaa-dynamic-v11';

const STATIC_ASSETS = [
  '/',
  '/favicon.svg',
  '/logo.svg',
];

// Install - pre-cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy routing
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API calls (except news endpoints for offline support)
  if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/news/')) return;

  // ── Navigation / HTML requests: Network First with cache fallback ──
  // This allows the main routes (/ , /news, /markets, /analysis, etc.) to work offline
  // by falling back to the cached HTML shell when the network is unavailable.
  const acceptHeader = request.headers.get('accept') || '';
  const isHtmlRequest = acceptHeader.includes('text/html');
  const isNavigation = request.mode === 'navigate';
  if (isHtmlRequest || isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the successful response for offline use
          if (response.ok) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            if (cached) return cached;
            // Fallback to root for SPA routing
            return caches.match('/');
          })
        )
    );
    return;
  }

  // Strategy: Cache First for static assets (same-origin only)
  // Skip cross-origin requests to avoid CSP issues
  const isStaticAsset = url.pathname.match(/\.(css|js|woff2?|ttf|svg|png|jpg|jpeg|webp|avif|ico|webmanifest)$/);
  const isCrossOrigin = url.origin !== self.location.origin;

  if (isStaticAsset && !isCrossOrigin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => new Response('', { status: 503, statusText: 'Service Unavailable' }));
      })
    );
    return;
  }

  // For cross-origin static assets (like Google Fonts, Cloudinary images),
  // use network-only strategy. Do NOT cache them — let the browser handle them.
  if (isStaticAsset && isCrossOrigin) {
    return;
  }

  // Strategy: Stale While Revalidate for news API (non-HTML) requests only
  if (url.pathname.startsWith('/api/news/')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request)
            .then((response) => {
              if (response.ok) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => {
              if (cached) return cached;
              return new Response(JSON.stringify({ error: 'Offline' }), {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
              });
            });

          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Strategy: Network First for everything else
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) =>
          cached || new Response('', { status: 503, statusText: 'Service Unavailable' })
        )
      )
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'رؤى — إشعار جديد';
  const options = {
    body: data.body || 'لديك إشعار جديد',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    dir: 'rtl',
    lang: 'ar',
    data: data.url || '/',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data || '/';
  event.waitUntil(clients.openWindow(url));
});

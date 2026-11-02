const CACHE = 'lifequest-shell-v3';
const PRECACHE = [
  '/favicon.svg',
  '/manifest.webmanifest',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data?.text() };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'LifeQuest', {
      body: data.body || 'You still have unfinished work.',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'lifequest-unfinished',
      renotify: true,
      requireInteraction: true,
      vibrate: [220, 80, 220, 80, 420],
      data: { url: data.url || '/dashboard' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windows) {
        if ('focus' in client) {
          await client.focus();
          if ('navigate' in client) await client.navigate(target);
          return;
        }
      }
      if (self.clients.openWindow) await self.clients.openWindow(target);
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'ALARM') return;
  event.waitUntil(
    self.registration.showNotification(event.data.title || 'LifeQuest', {
      body: event.data.body || 'You still have unfinished work.',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'lifequest-unfinished',
      renotify: true,
      requireInteraction: true,
      vibrate: [220, 80, 220, 80, 420],
      data: { url: event.data.url || '/dashboard' },
    }),
  );
});

function isNavigate(request) {
  return request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api')) return;

  // HTML: always prefer network so phones never keep a shell that points at deleted hashed JS.
  if (isNavigate(request)) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request, { cache: 'no-store' });
          if (fresh.ok) {
            const cache = await caches.open(CACHE);
            cache.put('/index.html', fresh.clone());
          }
          return fresh;
        } catch {
          return (await caches.match('/index.html')) || Response.error();
        }
      })(),
    );
    return;
  }

  // Built assets: cache successful responses only. Never invent a fallback HTML document.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        try {
          const fresh = await fetch(request);
          if (fresh.ok) {
            const cache = await caches.open(CACHE);
            cache.put(request, fresh.clone());
          }
          return fresh;
        } catch {
          if (cached) return cached;
          return new Response('Asset unavailable', { status: 503, statusText: 'Service Unavailable' });
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      try {
        const fresh = await fetch(request);
        if (fresh.ok) {
          const cache = await caches.open(CACHE);
          cache.put(request, fresh.clone());
        }
        return fresh;
      } catch {
        if (cached) return cached;
        return Response.error();
      }
    })(),
  );
});

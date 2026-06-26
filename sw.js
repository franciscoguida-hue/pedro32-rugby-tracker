/* Belgrano AC · Rugby Tracker — Service Worker
   Estrategia network-first: siempre busca la versión más nueva cuando hay
   internet, y usa la copia guardada solo si estás sin conexión.
   Subí este archivo al repo junto a index.html (mismo nivel). */

const VERSION = 'v6.1';
const CACHE = 'bac-rugby-' + VERSION;
const CORE = ['./', './index.html'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {})
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const sameOrigin = new URL(req.url).origin === self.location.origin;
  e.respondWith((async () => {
    try {
      const fresh = await fetch(req);
      if (sameOrigin) {
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (err) {
      const cached = await caches.match(req);
      if (cached) return cached;
      if (sameOrigin) return caches.match('./index.html');
      return Response.error();
    }
  })());
});

/* Family Asset Manager - Service Worker
   Bump CACHE when you upload a new version (e.g. fam-v1.14) so phones pick up the update.
   Rule: only successful (200) responses are cached. If the server returns 404/5xx
   (e.g. repository deleted or Pages disabled), the cached app is served instead. */
const CACHE = 'fam-v1.13.2';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

const good = res => res && res.ok && res.type === 'basic';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  // HTML: network-first; use cache when offline OR when the server answers with an error (404 etc.)
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith((async () => {
      const cached = await caches.match('./index.html');
      try {
        // Blocked/firewalled networks may hang instead of failing: give up after 3 s and use the cache
        const res = await Promise.race([
          fetch(req, { cache: 'no-store' }),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), cached ? 3000 : 15000))
        ]);
        if (good(res)) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy));
          return res;
        }
        return cached || res;
      } catch (err) {
        return cached || Response.error();
      }
    })());
    return;
  }

  // Other assets: cache-first, never store error responses
  e.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (good(res)) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    } catch (err) {
      return Response.error();
    }
  })());
});

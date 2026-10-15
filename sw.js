/* Family Asset Manager - Service Worker
   Bump CACHE when you upload a new version (e.g. fam-v1.14) so phones pick up the update.
   Rule: only successful (200) responses are cached. If the server returns 404/5xx
   (e.g. repository deleted or Pages disabled), the cached app is served instead.

   IMPORTANT: every app hosted on oiouoeh.github.io (this one, STEP Viewer, 3D Packing) shares ONE
   Cache Storage. Cleanup must therefore only touch caches that start with this app's own
   prefix ('fam-'); deleting "everything that is not mine" wipes the other apps' offline copies,
   and the other apps' old workers did the same to this one. */
const PREFIX = 'fam-';
const CACHE = PREFIX + 'v1.14';
const REQUIRED = './index.html';                                   // app body: install fails if it can't be stored
const OPTIONAL = ['./manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];
const BASE = new URL('./', self.location).pathname;                // e.g. '/Asset/' or '/'

const good = res => res && res.ok && res.type === 'basic' && !res.redirected;

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE);
      // The body is mandatory. Icons etc. are best effort: one missing icon must not stop the install
      // (cache.addAll() is all-or-nothing, so a single 404 there used to cancel the whole offline save).
      await cache.add(new Request(REQUIRED, { cache: 'reload' }));
      await Promise.all(OPTIONAL.map(u => cache.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    } catch (err) {
      // Tell the open page WHY it failed, so Settings > Offline status can show the reason.
      const msg = (err && err.name ? err.name + ': ' : '') + (err && err.message ? err.message : String(err));
      const cs = await self.clients.matchAll({ includeUncontrolled: true });
      cs.forEach(c => c.postMessage({ type: 'sw-install-error', msg }));
      throw err;
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.indexOf(PREFIX) === 0 && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  // Only this app's own addresses. Other apps on the same site (/step-viewer/, /packing/ ...) are left alone.
  if (url.pathname.indexOf(BASE) !== 0) return;

  // HTML: network-first; use cache when offline OR when the server answers with an error (404 etc.)
  if (req.mode === 'navigate' || req.destination === 'document') {
    if (url.pathname !== BASE && url.pathname !== BASE + 'index.html') return;
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match('./index.html');
      try {
        // Blocked/firewalled networks may hang instead of failing: give up after 3 s and use the cache
        const res = await Promise.race([
          fetch(req, { cache: 'no-store' }),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), cached ? 3000 : 15000))
        ]);
        if (good(res)) {
          const copy = res.clone();
          cache.put('./index.html', copy).catch(() => {});   // also re-fills the cache if something wiped it
          return res;
        }
        return cached || res;
      } catch (err) {
        return cached || Response.error();
      }
    })());
    return;
  }

  // Other assets: cache-first (this app's cache only), never store error responses
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (good(res)) cache.put(req, res.clone()).catch(() => {});
      return res;
    } catch (err) {
      return Response.error();
    }
  })());
});

/* Service worker. Generated into dist/sw.js by build/build.mjs, which fills in VERSION and PRECACHE.
   - Pages: network first, then the saved copy, then the offline page.
   - Everything else on this site: saved copy first, refreshed quietly in the background.
   - A new version waits until the visitor taps "Refresh" in the update message, so nobody is stuck on stale content. */
const VERSION = '__VERSION__';
const CACHE = `asc-${VERSION}`;
const PRECACHE = __PRECACHE__;
const OFFLINE = 'offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('asc-') && k !== CACHE).map((k) => caches.delete(k)));
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = (await event.preloadResponse) || (await fetch(req));
        if (fresh.ok) { const copy = fresh.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return fresh;
      } catch {
        return (await caches.match(req, { ignoreSearch: true })) || (await caches.match(OFFLINE)) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    const refresh = fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    });
    if (cached) { refresh.catch(() => {}); return cached; }
    try { return await refresh; } catch { return Response.error(); }
  })());
});

// Bump this cache name whenever index.html, codec.js, or manifest.json changes.
const CACHE = 'wendlingwx-2026-08-05c';
const FILES = ['./', './index.html', './codec.js', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    Promise.race([
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      }),
      new Promise((_, rej) => setTimeout(rej, 3000))
    ]).catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
  );
});

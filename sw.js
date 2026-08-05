// Caches everything on install so the app opens with no signal at all.
//
// Bump CACHE whenever any app file changes. The version string is the only
// thing that tells an already-installed phone to fetch fresh copies, so a
// deploy without a bump is invisible to anyone who has already used the app.
const CACHE = 'wendlingwx-2026-08-05a';
const FILES = ['./', './index.html', './codec.js', './manifest.json'];

self.addEventListener('install', e => {
  // skipWaiting so a new version takes over on the next launch rather than
  // waiting for every tab to close, which on a home-screen app can be never.
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Network first, falling back to cache. Online you always get the current
// version; offline you get the last good copy, which is the field case.
// The timeout keeps a dying signal from hanging the app.
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

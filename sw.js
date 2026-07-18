/* Service Worker — Julien de Saint Angel (PWA) */
const CACHE = 'jdsa-cache-v1';
const CORE = [
  './',
  './index.html',
  './css/style.css',
  './chat-widget.css',
  './js/main.js?v=2',
  './chat-widget.js',
  './manifest.json',
  './assets/images/julien.png',
  './ico/favicon_io/android-chrome-192x192.png',
  './ico/favicon_io/android-chrome-512x512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(CORE.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  // On ne gère que le GET même-origine ; le reste (API Mia, CDN…) passe au réseau normalement.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    // Réseau d'abord (contenu à jour), cache en secours si hors-ligne.
    e.respondWith(
      fetch(req)
        .then((resp) => { const copy = resp.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return resp; })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // Autres assets : cache d'abord, réseau ensuite (et on met en cache).
  e.respondWith(
    caches.match(req).then((r) => r || fetch(req).then((resp) => {
      const copy = resp.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return resp;
    }).catch(() => r))
  );
});

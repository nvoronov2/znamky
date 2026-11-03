const CACHE = 'znamky-v1';
const SHELL = [
  './', './index.html', './styles.css', './manifest.webmanifest',
  './icon.svg', './icon-192.png', './icon-512.png',
  './main.js', './state.js', './db.js', './api.js', './image.js',
  './i18n.js', './schema.js', './dom.js', './ui-fields.js', './csv.js', './price.js', './ui-home.js', './ui-capture.js', './ui-import.js',
  './ui-result.js', './ui-detail.js', './ui-settings.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Same-origin GET only: API calls are cross-origin and never reach the cache.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).catch(() =>
      req.mode === 'navigate' ? caches.match('./index.html') : Response.error()
    ))
  );
});

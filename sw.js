/* Must Have — офлайн-оболочка. Данные в localStorage, сеть не используется. */
const CACHE = 'must-have-shell-v6';
const SHELL = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './manifest.webmanifest',
  './assets/icon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/backgrounds/bamboo-base.webp',
  './assets/backgrounds/rain-base.webp',
  './assets/backgrounds/waves-base.webp',
  './assets/backgrounds/castle-base.webp',
  './assets/backgrounds/petals-base.webp',
  './assets/backgrounds/hills-base.webp',
  './assets/backgrounds/motion/bamboo.svg',
  './assets/backgrounds/motion/rain.svg',
  './assets/backgrounds/motion/waves.svg',
  './assets/backgrounds/motion/castle.svg',
  './assets/backgrounds/motion/petals.svg',
  './assets/backgrounds/motion/hills.svg',
  './assets/backgrounds/thumbs/bamboo.jpg',
  './assets/backgrounds/thumbs/rain.jpg',
  './assets/backgrounds/thumbs/waves.jpg',
  './assets/backgrounds/thumbs/castle.jpg',
  './assets/backgrounds/thumbs/petals.jpg',
  './assets/backgrounds/thumbs/hills.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

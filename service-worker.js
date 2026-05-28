/* Zehedisode Oto Yikama - Service Worker
 * Strateji:
 *   - HTML/JS/CSS/font: stale-while-revalidate (her zaman önce cache, arkada güncelle).
 *   - Same-origin static assets cache'lenir; harici (fonts.googleapis vb.) sadece runtime cache.
 *   - Yeni sürüm yayınlandığında CACHE_VERSION artırılarak eski cache temizlenir.
 */

const CACHE_VERSION = 'zehedisode-99c8e34a70';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE_URLS = [
    './',
    './index.html',
    './manifest.webmanifest',
    './assets/css/tailwind.css',
    './assets/css/styles.css',
    './assets/js/app.js',
    './assets/vendor/react.production.min.js',
    './assets/vendor/react-dom.production.min.js',
    './assets/icons/icon.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => undefined))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((key) => !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key))
        )).then(() => self.clients.claim())
    );
});

// Sayfa "yeni surumu hemen devral" mesaji gonderirse waiting'den activated'a gec.
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    const isHTML = request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');

    if (isHTML) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Bundle ve service worker'in kendisi: agresif network-first.
    // Boylece yeni deploy edildiginde kullanici eski paketi gormez.
    if (url.origin === self.location.origin && (
        url.pathname.endsWith('/assets/js/app.js') ||
        url.pathname.endsWith('/assets/css/tailwind.css') ||
        url.pathname.endsWith('/service-worker.js')
    )) {
        event.respondWith(networkFirst(request));
        return;
    }

    if (url.origin === self.location.origin) {
        event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
        return;
    }

    // Harici (Google Fonts vs.) için runtime cache
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

async function networkFirst(request) {
    try {
        const fresh = await fetch(request);
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, fresh.clone()).catch(() => undefined);
        return fresh;
    } catch (err) {
        const cached = await caches.match(request);
        if (cached) return cached;
        const fallback = await caches.match('./index.html');
        if (fallback) return fallback;
        throw err;
    }
}

async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    const networkPromise = fetch(request).then((response) => {
        if (response && response.status === 200 && (response.type === 'basic' || response.type === 'cors')) {
            cache.put(request, response.clone()).catch(() => undefined);
        }
        return response;
    }).catch(() => null);
    return cached || networkPromise || fetch(request);
}

// ADH-Do! service worker — offline működés telepített (kezdőképernyős) appként.
//
// Stratégia:
// - Saját fájlok (HTML/JS/CSS/ikonok): előbb a hálózat, hogy a frissítések
//   azonnal megérkezzenek; ha nincs net, a tárolt példány.
// - Külső könyvtárak és betűtípusok (Tailwind, Sortable, Google Fonts):
//   előbb a tároló — ezek verziója rögzített, nem változnak.
// - Hangfájlok: nem nyúlunk hozzájuk (a Safari a hangot darabokban, "Range"
//   kéréssel tölti, amit a tárolt válasz elrontana).
//
// Új kiadásnál a CACHE_VERSION növelésével a régi tároló törlődik.

const CACHE_VERSION = 'adhdo-v3';
const LOCAL_CACHE = CACHE_VERSION + '-local';
const CDN_CACHE = CACHE_VERSION + '-cdn';

const LOCAL_FILES = [
  './',
  'index.html',
  'dashboard.html',
  'project.html',
  'settings.html',
  'statistics.html',
  'css/styles.css',
  'js/app.js',
  'js/dashboard.js',
  'js/project.js',
  'js/settings.js',
  'js/statistics.js',
  'manifest.webmanifest',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

const CDN_FILES = [
  'https://cdn.tailwindcss.com/3.4.17?plugins=forms@0.5.10,container-queries@0.1.1',
  'https://cdn.jsdelivr.net/npm/sortablejs@1.15.6/Sortable.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const local = await caches.open(LOCAL_CACHE);
    await local.addAll(LOCAL_FILES);
    // A külső fájlok egyenként — ha egy nem érhető el, a telepítés ne bukjon el
    const cdn = await caches.open(CDN_CACHE);
    await Promise.all(CDN_FILES.map(url =>
      fetch(url, { mode: 'no-cors' })
        .then(res => cdn.put(url, res))
        .catch(() => {})
    ));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k => k.startsWith('adhdo-') && !k.startsWith(CACHE_VERSION))
      .map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (req.headers.has('range') || req.destination === 'audio') return;

  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(req));
  } else {
    event.respondWith(cacheFirst(req));
  }
});

async function networkFirst(req) {
  const cache = await caches.open(LOCAL_CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(stripQuery(req.url), res.clone());
    return res;
  } catch (err) {
    // pl. project.html?id=… → a tárolt project.html
    const cached = await cache.match(stripQuery(req.url));
    if (cached) return cached;
    if (req.mode === 'navigate') {
      const fallback = await cache.match('dashboard.html');
      if (fallback) return fallback;
    }
    throw err;
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CDN_CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  // A betűtípus-fájlokat (fonts.gstatic.com) és társaikat menet közben tároljuk el
  if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
  return res;
}

function stripQuery(u) {
  const url = new URL(u);
  url.search = '';
  url.hash = '';
  return url.toString();
}

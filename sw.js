/**
 * AFGE RIF Shield — Service Worker
 * @version 5.0
 * @description Caches app assets for offline use. Cache version must be manually
 * bumped on each production deploy to invalidate stale caches on user devices.
 *
 * Version history:
 * rif-shield-v1 — initial cache (deprecated)
 * rif-shield-v3 — cache bump Sprint 7 strategy, offline fallback, proper install wait behavior
 * rif-shield-v4 — cache bump Sprint 8 training gap analysis, gap card UI
  * rif-shield-v5 — cache bump Sprint 9 score history chart, trend indicators, schema v3 migration
 */

/** @constant {string} Current cache version — bump this on every deploy */
const CACHE_VERSION = 'rif-shield-v5';

/**
 * Assets to pre-cache on Service Worker install.
 * All paths are relative to the SW scope root.
 * @type {string[]}
 */
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

/**
 * Offline fallback HTML shell.
 * Uses hardcoded hex values because CSS variables from index.html
 * are unavailable inside SW-generated Response objects.
 * @constant {string}
 */
const OFFLINE_SHELL = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>AFGE RIF Shield — Offline</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{min-height:100vh;background:#0f1c3f;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;padding:24px;}
    .card{background:#1a2d5a;border-radius:16px;padding:32px 24px;max-width:360px;width:100%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.4);}
    .icon{font-size:48px;margin-bottom:16px;}
    h1{color:#c9a227;font-size:20px;font-weight:800;margin-bottom:8px;}
    p{color:#8fa3c8;font-size:14px;line-height:1.6;margin-bottom:20px;}
    .badge{display:inline-block;background:#c9a22720;color:#c9a227;border:1.5px solid #c9a22740;border-radius:8px;padding:4px 12px;font-size:11px;font-weight:700;margin-bottom:20px;}
    button{background:#c9a227;color:#0f1c3f;border:none;border-radius:10px;padding:12px 24px;font-size:14px;font-weight:700;cursor:pointer;width:100%;}
    button:active{opacity:.85;}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📡</div>
    <div class="badge">OFFLINE MODE</div>
    <h1>No Connection</h1>
    <p>Your RIF Shield data is safe. Connect to the internet to sync your latest entries and score updates.</p>
    <button onclick="location.reload()">Try Again</button>
  </div>
</body>
</html>`;

/**
 * Install event — pre-caches all ASSETS.
 * Does NOT force-activate — waits in "waiting" state until all tabs are closed.
 * The new SW waits in "waiting" state until all tabs are closed.
 * @param {ExtendableEvent} event
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(ASSETS))
  );
});

/**
 * Activate event — purges all caches that do not match CACHE_VERSION.
 * Runs after all tabs using the old SW have closed.
 * @param {ExtendableEvent} event
 */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/**
 * Fetch event — serves cached assets with network fallback.
 * For navigation requests (HTML page loads), returns OFFLINE_SHELL
 * if both network and cache fail.
 * @param {FetchEvent} event
 */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const isNavigate = event.request.mode === 'navigate';

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(event.request).catch(() => {
          if (isNavigate) {
            return new Response(OFFLINE_SHELL, {
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
          }
        });
      })
  );
});

// offline verification build: service-worker caching disabled.
//
// The upstream worker precached a critical-asset list on install and then served
// cache-first for the CDN origins and network-first for the local bundle. Under the
// offline verifier the same worker would keep serving a stale script.js / styles.css
// from the previous checkpoint, so this build registers a worker that deliberately
// caches nothing and intercepts no fetch events. Every request falls through to the
// network (the static file server), which is what the checkpoints measure.
const CACHE_NAME = 'markdown-viewer-cache-v3.10.2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.delete(CACHE_NAME)
      .catch(() => {})
      .then(() => self.clients.claim())
  );
});

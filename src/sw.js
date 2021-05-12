var CACHE_STATIC_NAME = 'static-v1a';
var staticCacheAssets = [
  '/',
  'index.html',
  'main.js'
];

function networkElseCache (event) {
  return caches.match(event.request).then(function resolve(match) {
    if (!match) {
      return fetch(event.request);
    }
    return fetch(event.request).then(function resolve(response) {
      caches.open(CACHE_STATIC_NAME).then(function resolve(cache) {
        cache.put(event.request, response.clone());
        return response;
      }) || response;
    });
  });
}

self.addEventListener('install', (event) => {
  if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
    return;
  }
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
      .then(function resolve(cache) {
        console.log('[Service Worker] Precaching App Shell');
        return cache.addAll(staticCacheAssets)
          .then(self.skipWaiting())
          .catch(function(e) {
            console.warn('Error with', e);
          });
  }));
});

// Delete old cache on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(function resolve(keyList) {
        return Promise.all(keyList.map(function mapCb(key) {
          if (key !== CACHE_STATIC_NAME) {
            console.log('[Service Worker] Removing old cache.', key);
            return caches.delete(key);
          }
        }));
      })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
    return;
  }
  if (event.request.method !== 'GET') {
    return;
  }
  if (staticCacheAssets.indexOf(event.request.url) !== -1) {
    event.respondWith(networkElseCache(event));
  }
  event.respondWith(fetch(event.request));
});

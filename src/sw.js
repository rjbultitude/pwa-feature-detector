const DYNAMIC_CACHE_NAME = 'dyn-v1a';
const btnAdd = document.getElementById('add');
let deferredPrompt;

self.isOnlyIfCached = function isOnlyIfCached(event) {
  if (event.request !== undefined) {
    if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
      return true;
    }
  }
};

self.addEventListener('install', (installEvent) => {
  return;
});

self.addEventListener('activate', (activateEvent) => {
  event.waitUntil(
    caches.keys()
      .then(function resolve(keyList) {
        return Promise.all(keyList.map(function mapCb(key) {
          if (key !== DYNAMIC_CACHE_NAME) {
            console.log('[Service Worker] Removing old cache.', key);
            return caches.delete(key);
          }
        }));
      })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    // Try the network
    fetch(event.request)
      .then(function(res) {
        return caches.open(DYNAMIC_CACHE_NAME)
          .then(function(cache) {
            // Put in cache if succeeds
            cache.put(event.request.url, res.clone());
            return res;
          })
      })
      .catch(function (err) {
          // Fallback to cache
          return caches.match(event.request)
            .then(function(res) {
              if (res === undefined) {
              // get and return the offline page
            }
            return res;
        })
      })
  );
});

window.addEventListener('beforeinstallprompt', (e) => {
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    showInstallPromotion();
});

btnAdd.addEventListener('click', (e) => {
    // hide our user interface that shows our A2HS button
    btnAdd.style.display = 'none';
    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice
      .then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        deferredPrompt = null;
      });
  });

  window.addEventListener('appinstalled', (evt) => {
    console.log('a2hs installed');
  });

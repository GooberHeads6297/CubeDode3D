const CACHE_NAME = 'cube-dodge-v1.1'; // Increment version if you make changes to cached files
const urlsToCache = [
  '/', // Caches the root, often resolves to index.html
  'index.html',
  // The Three.js library is loaded from a CDN.
  // The fetch handler below will allow it to be served from network or browser HTTP cache.
  // For full offline of CDN assets, you might need more advanced strategies or to vendor it locally.

  // Add paths to your icons here for precaching
  'icons/icon-72x72.png',
  'icons/icon-96x96.png',
  'icons/icon-128x128.png',
  'icons/icon-144x144.png',
  'icons/icon-152x152.png',
  'icons/icon-192x192.png',
  'icons/icon-384x384.png',
  'icons/icon-512x512.png'
  // If you had other local assets like CSS files or game-specific images, add them here.
];

// Install event: Cache the core assets.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching files:', urlsToCache);
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache files during install:', error);
      })
  );
  self.skipWaiting(); // Force the waiting service worker to become the active service worker.
});

// Fetch event: Serve cached content when offline, or fetch from network.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch from network
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200) {
              // For 'opaque' responses (like from CDNs if not configured for CORS),
              // we can't see the status, so we just return them.
              // We won't cache opaque responses here to be safe.
              return networkResponse;
            }

            // Clone the response. A response is a stream and can only be consumed once.
            let responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // Only cache GET requests.
                if (event.request.method === 'GET') {
                  cache.put(event.request, responseToCache);
                }
              });

            return networkResponse;
          }
        ).catch(error => {
          console.error('Fetching failed:', error);
          // Optionally, you could return a generic offline page here if you have one.
          // For this game, if core assets are cached, it should mostly work.
          // If a specific non-cached asset fails, it might cause issues.
        });
      })
  );
});

// Activate event: Clean up old caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of uncontrolled clients (e.g., open tabs)
  );
});

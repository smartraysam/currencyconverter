const currencyCacheName = 'currency';
const convertCacheName = 'converter';
const cacheName = 'currencyConverter';
const filesToCache = [
    '/',
    '/index.html',
    '/scripts/app.js',
    '/styles/inline.css',
];

self.addEventListener('install', function (e) {
    console.log('[ServiceWorker] Install');
    e.waitUntil(
        caches.open(cacheName).then(function (cache) {
            console.log('[ServiceWorker] Caching app shell');
            return cache.addAll(filesToCache);
        })
    );
});

self.addEventListener('activate', function (e) {
    console.log('[ServiceWorker] Activate');
    e.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(keyList.map(function (key) {
                if (key !== cacheName && key !== currencyCacheName && key !== convertCacheName) {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', function (e) {
    console.log('[Service Worker] Fetch', e.request.url);
    const baseURL = 'https://free.currencyconverterapi.com/api/v5';
    const dataUrlcurrency = '/currencies';
    const dataUrlconverter = '/convert?q=';
    if (e.request.url.indexOf(baseURL) > -1) {
        if (e.request.url.indexOf(dataUrlcurrency) > -1) {
            e.respondWith(
                caches.open(currencyCacheName).then(function (cache) {
                    return fetch(e.request).then(function (response) {
                        cache.put(e.request.url, response.clone());
                        return response;
                    });
                })
            );
            return;
        }
        if (e.request.url.indexOf(dataUrlconverter) > -1) {
            e.respondWith(
                caches.open(convertCacheName).then(function (cache) {
                    return fetch(e.request).then(function (response) {
                        cache.put(e.request.url, response.clone());
                        return response;
                    });
                })
            );
            return;
        }
    }
    e.respondWith(
        caches.match(e.request).then(function (response) {
            return response || fetch(e.request);
        })
    );

});

self.addEventListener('message', function (event) {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});

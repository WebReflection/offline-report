const SITE = location.protocol + '//' + location.host;

const urlsToCache = [
  '/',
  '/sw.js',
  '/favicon.ico',
  '/css/min.css',
  '/css/unsplash.css',
  '/js/min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  const {request} = event;
  const {url} = request;
  if (
    url.indexOf(SITE) !== 0 ||
    /\.(?:jpg|jpeg|png|gif)$/.test(url)
  ) {
    event.respondWith(
      caches
        .open(CACHE_NAME)
        .then(cache => cache.match(request).then(response => {
          if (response)
            return response;
          return fetch(request.clone()).then(
            response => {
              if (199 < response.status && response.status < 400)
                cache.put(request, response.clone());
              else if (navigator.onLine)
                console.error(url);
              return response;
            },
            error => {
              if (navigator.onLine)
                console.error(url, error);
            }
          );
        }))
    );
  }
  else
    event.respondWith(fetch(request));
});

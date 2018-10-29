const SITE = location.protocol + '//' + location.host;

const openedCache = caches.open(CACHE_NAME);

addEventListener('install', e => {
  const {search} = location;
  const page = decodeURIComponent(search.slice(1));
  e.waitUntil(
    openedCache.then(cache => cache.addAll([
      '/',
      '/css/min.css',
      '/css/unsplash.css',
      '/js/min.js',
      '/sw.js' + search
    ].concat(
      page === '/' ? [] : [page]
    )))
  );
});

self.addEventListener('fetch', event => {
  const {request} = event;
  event.respondWith(
    /\.txt$/.test(request.url) ?
      fetch(request) :
      openedCache.then(
        cache => cache.match(request).then(
          response => response || fetch(request.clone()).then(
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
          )
        )
      )
  );
});

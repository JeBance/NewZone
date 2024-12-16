const cacheName = 'NewZone-v0.0.2';

const addResourcesToCache = async (resources) => {
	const cache = await caches.open(cacheName);
	await cache.addAll(resources);
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    addResourcesToCache([
      "/NewZone/",
      "/NewZone/index.html",
      "/NewZone/favicon.ico",
      "/NewZone/assets/css/style.css",
      "/NewZone/assets/img/icon-32.png",
      "/NewZone/assets/img/icon-64.png",
      "/NewZone/assets/img/icon-128.png",
      "/NewZone/assets/img/icon-180.png",
      "/NewZone/assets/img/icon-192.png",
      "/NewZone/assets/img/icon-196.png",
      "/NewZone/assets/img/icon-256.png",
      "/NewZone/assets/img/icon-512.png",
      "/NewZone/assets/js/pwa.js"
    ])
  );
});

self.addEventListener('fetch', (e) => {
	e.respondWith((async () => {
		const r = await caches.match(e.request);
		console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
		if (r) return r;
		const response = await fetch(e.request);
		const cache = await caches.open(cacheName);
		console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
		cache.put(e.request, response.clone());
		return response;
	})());
});


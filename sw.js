const cacheName = 'NewZone-v0.0.9';

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
      "/NewZone/assets/css/buttons.css",
      "/NewZone/assets/css/colors.css",
      "/NewZone/assets/css/loader.css",
      "/NewZone/assets/css/modal.css",
      "/NewZone/assets/css/style.css",
      "/NewZone/assets/fa/css/font-awesome.css",
      "/NewZone/assets/fa/css/font-awesome.min.css",
      "/NewZone/assets/fa/fonts/FontAwesome.otf",
      "/NewZone/assets/fa/fonts/fontawesome-webfont.eot",
      "/NewZone/assets/fa/fonts/fontawesome-webfont.svg",
      "/NewZone/assets/fa/fonts/fontawesome-webfont.ttf",
      "/NewZone/assets/fa/fonts/fontawesome-webfont.woff",
      "/NewZone/assets/fa/fonts/fontawesome-webfont.woff2",
      "/NewZone/assets/fonts/Cyberpunk.otf",
      "/NewZone/assets/fonts/Cyberpunk.ttf",
      "/NewZone/assets/fonts/Cyberpunk.woff",
      "/NewZone/assets/fonts/Neuropol.otf",
      "/NewZone/assets/fonts/Neuropol.ttf",
      "/NewZone/assets/fonts/Neuropol.woff",
      "/NewZone/assets/img/icon-32.png",
      "/NewZone/assets/img/icon-64.png",
      "/NewZone/assets/img/icon-128.png",
      "/NewZone/assets/img/icon-180.png",
      "/NewZone/assets/img/icon-192.png",
      "/NewZone/assets/img/icon-196.png",
      "/NewZone/assets/img/icon-256.png",
      "/NewZone/assets/img/icon-512.png",
      "/NewZone/assets/img/logo.svg",
      "/NewZone/assets/img/poster.svg",
      "/NewZone/assets/js/app.js",
      "/NewZone/assets/js/container.js",
      "/NewZone/assets/js/db.js",
      "/NewZone/assets/js/messages.js",
      "/NewZone/assets/js/nodes.js",
      "/NewZone/assets/js/openpgp.min.js",
      "/NewZone/assets/js/openpgp.min.js.map",
      "/NewZone/assets/js/prototypes.js",
      "/NewZone/assets/js/pwa.js",
      "/NewZone/assets/js/qrcodeGenerator.js",
      "/NewZone/assets/js/qrcodeScanner.js",
      "/NewZone/assets/js/secureStorage.js",
      "/NewZone/assets/js/ui.js"
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


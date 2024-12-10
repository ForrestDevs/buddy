self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("my-cache").then((cache) => {
      return cache.addAll(["/", "/manifest.json", "/og.png", "/favicon.ico"]);
    })
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});


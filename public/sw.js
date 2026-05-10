const CACHE_VERSION = "lift-log-v2";
const APP_CACHE = `${CACHE_VERSION}-app`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.hostname === "raw.githubusercontent.com" || url.pathname.includes("/assets/") || url.pathname.includes("/videos/")) {
    event.respondWith(cacheFirst(req));
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req, "./index.html"));
    return;
  }

  event.respondWith(networkFirst(req));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  const cache = await caches.open(RUNTIME_CACHE);
  cache.put(req, res.clone());
  return res;
}

async function networkFirst(req, fallbackUrl) {
  try {
    const res = await fetch(req);
    const cache = await caches.open(APP_CACHE);
    cache.put(req, res.clone());
    return res;
  } catch {
    return (await caches.match(req)) || (fallbackUrl ? caches.match(fallbackUrl) : Response.error());
  }
}

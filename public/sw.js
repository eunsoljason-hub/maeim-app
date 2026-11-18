/* 마음명상 service worker
 * - App shell + offline page cached at install
 * - Navigations: network first, then cache, then /offline
 * - _next/static, icons: cache first (immutable)
 * - /audio/*: cached on first play so one meditation course keeps working offline
 */
const VERSION = "maeum-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const AUDIO_CACHE = `${VERSION}-audio`;

const PRECACHE = [
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      await Promise.all(
        PRECACHE.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => undefined),
        ),
      );
      await self.skipWaiting();
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function isAudio(url) {
  return url.pathname.startsWith("/audio/");
}

function isStatic(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:css|js|woff2?|png|svg|jpg|jpeg|webp|ico)$/.test(url.pathname)
  );
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type === "basic") {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const shell = await caches.open(SHELL_CACHE);
    const offline = await shell.match("/offline");
    if (offline) return offline;
    return new Response(
      "<!doctype html><meta charset='utf-8'><title>오프라인</title><p>인터넷 연결을 확인해 주세요.</p>",
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 },
    );
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.status === 200) cache.put(request, response.clone());
  return response;
}

async function audioStrategy(request) {
  const cache = await caches.open(AUDIO_CACHE);
  const cached = await cache.match(request.url, { ignoreVary: true });
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 504, statusText: "offline" });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isAudio(url)) {
    event.respondWith(audioStrategy(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (isStatic(url)) {
    event.respondWith(cacheFirst(request));
  }
});

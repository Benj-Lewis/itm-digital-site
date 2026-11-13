/* ITM Digital Communication : application web (PWA)
   Pages : réseau d'abord, copie hors ligne ensuite.
   Styles, scripts, images : cache d'abord (URL versionnées ?v=...).
   Changez VERSION pour forcer la mise à jour chez tous les visiteurs. */
const VERSION = "itm-v1";
const PAGES = [
  "/", "/a-propos/", "/services-presence-en-ligne/", "/tarification-services/",
  "/portfolio-galerie/", "/clients-et-partenaires-agence-de-communication/",
  "/formations/", "/contact/", "/offline.html"
];
const ASSETS = ["/assets/itm-icon.png", "/assets/favicon.png", "/assets/app/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) =>
    Promise.all([...PAGES, ...ASSETS].map((u) => c.add(u).catch(() => {})))
  ).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; /* WhatsApp, actualités, polices : non gérés */

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(url.pathname, copy)); }
        return res;
      }).catch(() => caches.match(url.pathname).then((r) => r || caches.match("/offline.html")))
    );
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      }))
    );
  }
});

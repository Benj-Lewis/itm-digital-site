/* ITM Digital Communication : application web (PWA)
   Pages : réseau d'abord, copie hors ligne ensuite.
   Styles, scripts, images : cache d'abord (URL versionnées ?v=...).
   Changez VERSION pour forcer la mise à jour chez tous les visiteurs. */
const VERSION = "itm-v2";
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

/* ====== Notifications : nouvel article sur Actualités ======
   Le serveur envoie un simple signal ; l'app va chercher le dernier article et l'affiche. */
const WP = "https://actualites.itmdigitalcommunication.com";
const decode = (t) => String(t || "").replace(/<[^>]*>/g, "")
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

self.addEventListener("push", (e) => {
  e.waitUntil((async () => {
    let title = "Nouvel article", body = "Découvrez la dernière publication d'ITM Digital.", url = WP + "/", image, tag = "itm-article";
    try {
      const r = await fetch(WP + "/wp-json/wp/v2/posts?per_page=1&_embed=wp:featuredmedia&nocache=" + Date.now(), { cache: "no-store" });
      const p = (await r.json())[0];
      if (p) {
        title = decode(p.title && p.title.rendered) || title;
        const ex = decode(p.excerpt && p.excerpt.rendered);
        body = ex ? (ex.length > 120 ? ex.slice(0, 117) + "…" : ex) : body;
        url = p.link || url;
        tag = "itm-article-" + p.id;
        const m = p._embedded && p._embedded["wp:featuredmedia"] && p._embedded["wp:featuredmedia"][0];
        const sizes = m && m.media_details && m.media_details.sizes;
        image = (sizes && (sizes.medium_large || sizes.large || sizes.medium) || m || {}).source_url;
      }
    } catch (err) { /* hors ligne : notification générique */ }
    await self.registration.showNotification(title, {
      body, tag, image, lang: "fr",
      icon: "/assets/app/icon-192.png",
      badge: "/assets/app/badge-96.png",
      data: { url },
      actions: [{ action: "lire", title: "Lire l'article" }]
    });
  })());
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) if (c.url === url && "focus" in c) return c.focus();
    return self.clients.openWindow(url);
  }));
});

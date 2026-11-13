/* ====== Réglages ITM : modifiez ici ====== */
const ITM = {
  whatsapp: "243853395757",
  /* Liens de paiement par carte (PayPal) pour la formation.
     Laissez vide tant qu'ils ne sont pas créés : le client est alors guidé vers WhatsApp. */
  paypal: { "15": "", "75": "", "150": "" },
  /* Numéros Mobile Money affichés au client pour le paiement */
  momo: [
    { name: "Orange Money", number: "0853395757", holder: "Benj Mansambu" },
    { name: "M-Pesa", number: "0823976325", holder: "Benj Mansambu" }
  ]
};
/* ========================================= */

const KB_VER = (document.currentScript && document.currentScript.dataset.kb) || new Date().toISOString().slice(0, 10);
const ON_NEWS = location.hostname.startsWith("actualites");
const MAIN = ON_NEWS ? "https://itmdigitalcommunication.com" : "";

/* Page d'origine du client (ajoutée aux références générales) */
const PAGE_CODE = location.hostname.startsWith("actualites") ? "ACTUALITES" : ({
  "": "ACCUEIL", "a-propos": "AGENCE", "services-presence-en-ligne": "SERVICES", "tarification-services": "TARIFS",
  "portfolio-galerie": "REALISATIONS", "clients-et-partenaires-agence-de-communication": "CLIENTS",
  "formations": "FORMATIONS", "contact": "CONTACT"
})[location.pathname.split("/").filter(Boolean)[0] || ""] || "SITE";

/* Référence unique : CODE + numéro à 4 chiffres, ex. FORMATION-INSCRIPTION-4821 */
const newRef = (code) => `${code || "CONTACT-" + PAGE_CODE}-${Math.floor(1000 + Math.random() * 9000)}`;
const slug = (t) => String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
/* Lien officiel wa.me : ouvre WhatsApp ou WhatsApp Business chez le visiteur,
   avec le message et la référence déjà écrits. */
const wa = (msg, code, ref) => `https://wa.me/${ITM.whatsapp}?text=${encodeURIComponent((msg || "Bonjour ITM Digital !") + "\n\nRéf. : " + (ref || newRef(code)))}`;
function openWA(msg, code, ref) {
  const url = wa(msg, code, ref);
  if (isMobile) window.location.href = url;
  else window.open(url, "_blank", "noopener");
}
document.querySelectorAll("[data-wa]").forEach(a => {
  const code = a.dataset.ref && a.dataset.ref !== "CONTACT" ? a.dataset.ref : "CONTACT-" + PAGE_CODE;
  a.href = wa(a.dataset.wa, code);
  a.rel = "noopener";
  if (!isMobile) a.target = "_blank";
  /* nouvelle référence à chaque appui */
  a.addEventListener("click", () => { a.href = wa(a.dataset.wa, code); });
});
document.querySelectorAll(".yr").forEach(n => n.textContent = new Date().getFullYear());

/* Menu mobile */
const burger = document.getElementById("burger"), nav = document.getElementById("nav");
if (burger) {
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", open);
  });
}

/* Pricing jump bar: highlight current group */
const chips = [...document.querySelectorAll(".jump .chip")];
if (chips.length && "IntersectionObserver" in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        chips.forEach(c => c.classList.toggle("on", c.getAttribute("href") === "#" + e.target.id));
      }
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  document.querySelectorAll(".price-group").forEach(g => io.observe(g));
}

/* Devis -> WhatsApp */
const quote = document.getElementById("quote");
if (quote) quote.addEventListener("submit", e => {
  e.preventDefault();
  const f = e.target, name = f.elements.name.value.trim();
  if (!name) { f.elements.name.focus(); f.elements.name.setAttribute("aria-invalid", "true"); return; }
  f.elements.name.removeAttribute("aria-invalid");
  const msg = `Bonjour ITM Digital, je suis ${name}.`
    + (f.elements.phone && f.elements.phone.value.trim() ? `\nWhatsApp : ${f.elements.phone.value.trim()}` : "")
    + `\nService : ${f.elements.service.value}`
    + `\nProjet : ${f.elements.msg.value.trim() || "à discuter"}`;
  openWA(msg, "DEVIS-" + slug(f.elements.service.value));
});

/* Paiement formation */
const pay = document.getElementById("pay");
if (pay) {
  const howto = document.getElementById("pay-howto"), go = document.getElementById("pay-go");
  let product = "", payRef = "";
  const fmt = (n) => n.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4");
  const payCode = () => { const a = sel("amount"); return `PAIEMENT-FORMATION-${slug(a.dataset.label)}-${a.value}USD-${slug(sel("method").value)}`; };
  const sel = (n) => pay.querySelector(`input[name="${n}"]:checked`);
  const refresh = () => {
    const amt = sel("amount").value, m = sel("method").value, link = ITM.paypal[amt];
    payRef = newRef(payCode());
    if (m === "Mobile money") {
      howto.innerHTML = `<strong>Envoyez ${amt} $ sur l'un de ces numéros :</strong>`
        + `<span class="momo">` + ITM.momo.map(o => `<span class="momo-row"><span><b>${o.name}</b><small>${o.holder}</small></span><span class="momo-num">${fmt(o.number)}</span><button type="button" class="momo-copy" data-copy="${o.number}">Copier</button></span>`).join("") + `</span>`
        + `Vérifiez que le nom affiché est bien <strong>${ITM.momo[0].holder}</strong> avant de valider. Ensuite, appuyez sur le bouton ci-dessous et joignez la capture du paiement : votre place est confirmée après vérification.`
        + `<span class="momo-ref">Votre référence : <b>${payRef}</b></span>`;
      go.textContent = "J'ai payé : envoyer la preuve sur WhatsApp";
    } else if (m === "Carte / PayPal" && link) {
      howto.innerHTML = `Vous allez sur une page de paiement sécurisée PayPal pour régler <strong>${amt} $</strong> par carte bancaire ou compte PayPal.`;
      go.textContent = `Payer ${amt} $ par carte`;
    } else {
      const how = m === "Virement"
        ? "Nous vous envoyons sur WhatsApp les coordonnées bancaires. Après le virement, envoyez la preuve : votre place est confirmée."
        : "Le paiement par carte arrive bientôt ici. En attendant, nous vous envoyons un lien de paiement sécurisé sur WhatsApp.";
      howto.innerHTML = `<strong>${amt} $ · ${m}.</strong> ${how}`;
      go.textContent = "Continuer sur WhatsApp";
    }
  };
  document.querySelectorAll("[data-open-pay]").forEach(b => b.addEventListener("click", () => {
    product = b.dataset.openPay;
    document.getElementById("pay-product").textContent = product;
    pay.hidden = false; refresh();
    document.getElementById("pay-close").focus();
  }));
  pay.addEventListener("change", refresh);
  howto.addEventListener("click", e => {
    const b = e.target.closest("[data-copy]"); if (!b) return;
    const done = () => { b.textContent = "Copié"; setTimeout(() => { b.textContent = "Copier"; }, 1800); };
    try { navigator.clipboard.writeText(b.dataset.copy).then(done).catch(() => {}); } catch (err) {}
  });
  const close = () => { pay.hidden = true; };
  document.getElementById("pay-close").addEventListener("click", close);
  pay.addEventListener("click", e => { if (e.target === pay) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !pay.hidden) close(); });
  go.addEventListener("click", () => {
    const amtEl = sel("amount"), amt = amtEl.value, m = sel("method").value,
          name = document.getElementById("p-name").value.trim(), link = ITM.paypal[amt];
    if (m === "Carte / PayPal" && link) { window.open(link, "_blank", "noopener"); return; }
    const who = name ? `\nNom : ${name}` : "";
    const msg = m === "Mobile money"
      ? `Bonjour ITM Digital, j'ai payé par Mobile Money : ${product}\nMontant : ${amtEl.dataset.label} (${amt} $)${who}\nJe joins la capture du paiement.`
      : `Bonjour ITM Digital, je souhaite payer : ${product}\nMontant : ${amtEl.dataset.label} (${amt} $)\nMoyen : ${m}${who}\nMerci de m'envoyer les détails de paiement.`;
    openWA(msg, payCode(), payRef);
  });
}

/* Dernières actualités (WordPress) sur l'accueil */
const newsBox = document.getElementById("dernieres-actualites");
if (newsBox) {
  const esc = (x) => String(x).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const strip = (h) => { const d = document.createElement("div"); d.innerHTML = h; return (d.textContent || "").trim(); };
  fetch((newsBox.dataset.api || "") + "/wp-json/wp/v2/posts?per_page=3&_embed=wp:featuredmedia,wp:term")
    .then(r => r.ok ? r.json() : [])
    .then(posts => {
      if (!Array.isArray(posts) || !posts.length) return;
      document.getElementById("news-list").innerHTML = posts.map(p => {
        const media = p._embedded && p._embedded["wp:featuredmedia"] && p._embedded["wp:featuredmedia"][0];
        const img = media && (media.media_details && media.media_details.sizes && (media.media_details.sizes["itm-card"] || media.media_details.sizes.medium_large) || media)?.source_url;
        const terms = p._embedded && p._embedded["wp:term"] && p._embedded["wp:term"][0];
        const cat = terms && terms[0] ? terms[0].name : "";
        const date = new Date(p.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
        let ex = strip(p.excerpt.rendered); if (ex.length > 150) ex = ex.slice(0, 147) + "…";
        return `<a class="news-card" href="${esc(p.link)}"><div class="thumb">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : `<span class="noimg"><img src="/assets/itm-icon.png" alt=""></span>`}</div><div class="nb"><div class="news-meta">${cat ? `<span class="cat">${esc(cat)}</span>` : ""}<span>${date}</span></div><h3>${strip(p.title.rendered)}</h3><p>${esc(ex)}</p></div></a>`;
      }).join("");
      newsBox.hidden = false;
    })
    .catch(() => {});
}

/* ====== Application installable (PWA) ====== */
if ("serviceWorker" in navigator && !location.hostname.startsWith("actualites")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}
(() => {
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  if (standalone || location.hostname.startsWith("actualites")) return;
  const KEY = "itm-install-later";
  let later = 0;
  try { later = +localStorage.getItem(KEY) || 0; } catch (err) {}
  if (Date.now() - later < 7 * 864e5) return; /* « Plus tard » : on ne redemande pas avant 7 jours */

  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS/i.test(navigator.userAgent);
  let deferred = null;
  const bar = document.createElement("div");
  bar.className = "install";
  bar.setAttribute("role", "dialog");
  bar.setAttribute("aria-label", "Installer l'application ITM Digital");
  const show = (text, action) => {
    bar.innerHTML = `<img src="/assets/app/icon-192.png" alt="" width="44" height="44">`
      + `<div class="install-txt"><b>Application ITM Digital</b><span>${text}</span></div>`
      + (action ? `<button type="button" class="btn btn-grad btn-sm" data-install>${action}</button>` : "")
      + `<button type="button" class="install-x" aria-label="Plus tard">×</button>`;
    document.body.appendChild(bar);
    requestAnimationFrame(() => bar.classList.add("on"));
  };
  const hide = (remember) => {
    bar.classList.remove("on");
    setTimeout(() => bar.remove(), 300);
    if (remember) try { localStorage.setItem(KEY, Date.now()); } catch (err) {}
  };
  bar.addEventListener("click", async (e) => {
    if (e.target.closest(".install-x")) return hide(true);
    if (e.target.closest("[data-install]") && deferred) {
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      deferred = null;
      hide(outcome !== "accepted");
    }
  });
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e;
    setTimeout(() => show("Sur votre écran d'accueil, même hors connexion.", "Installer"), 4000);
  });
  window.addEventListener("appinstalled", () => hide(false));
  if (ios) setTimeout(() => show("Touchez <b>Partager</b> <svg viewBox=\"0 0 24 24\" width=\"15\" height=\"15\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" aria-hidden=\"true\"><path d=\"M12 3v12M8 7l4-4 4 4M5 12v8h14v-8\"/></svg> puis <b>« Sur l'écran d'accueil »</b>."), 6000);
})();


/* ====== Assistant du site (recherche guidée, sans IA) ====== */
(() => {
  const esc = (x) => String(x).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const norm = (t) => String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9$]+/g, " ").trim();
  const STOP = new Set("a au aux avec ce ces cette dans de des du elle en est et il ils je la le les leur ma mes mon ne nos notre nous on ou par pas pour que quel quelle quels quelles qui sa se ses son sur ta tes ton tu un une vos votre vous y d l j c s m n qu est-ce estce avez faites fait faire peux peut veux voudrais aimerais besoin cherche svp merci bonjour bonsoir salut comment".split(" "));
  const stem = (w) => { w = w.replace(/(es|s|x)$/, ""); return w.length > 6 ? w.slice(0, 6) : w; };
  const SYN = [
    ["prix", "tarif", "cout", "coute", "combien", "montant", "devis", "cher", "budget"],
    ["site", "web", "internet", "vitrine", "siteweb"],
    ["boutique", "ecommerce", "commerce", "vente", "vendre"],
    ["musique", "chanson", "single", "album", "ep", "son", "streaming", "distribution", "distribuer", "spotify", "boomplay", "audiomack", "artiste", "label", "morceau", "titre"],
    ["pub", "publicite", "boost", "booster", "sponsor", "sponsoriser", "promotion", "promo", "annonce", "campagne", "ads"],
    ["reseaux", "sociaux", "community", "facebook", "instagram", "tiktok", "page", "gestion"],
    ["photo", "shooting", "photographe", "portrait", "image"],
    ["video", "clip", "tournage", "film", "spot", "montage", "videaste"],
    ["mariage", "anniversaire", "evenement", "ceremonie", "fete", "couverture"],
    ["app", "application", "mobile", "android", "ios"],
    ["formation", "cours", "apprendre", "former", "etudier", "inscription", "inscrire"],
    ["paiement", "payer", "mpesa", "orange", "money", "carte", "virement"],
    ["contact", "contacter", "adresse", "telephone", "numero", "whatsapp", "email", "mail", "joindre", "appeler", "localisation"],
    ["politique", "politicien", "candidat", "elu", "meeting", "campagne"],
    ["logo", "branding", "charte", "identite", "affiche", "visuel"],
    ["equipe", "fondateur", "ceo", "agence", "qui", "histoire"],
    ["actualite", "article", "blog", "news", "journal"],
    ["seo", "google", "referencement", "visibilite"]
  ].map(g => g.map(stem));
  const tokens = (t) => norm(t).split(" ").filter(w => w && !STOP.has(w)).map(stem);

  let KB = null, loading = null;
  const load = () => loading || (loading = fetch(MAIN + "/assets/assistant.json?v=" + KB_VER)
    .then(r => r.json())
    .then(d => { KB = d.map(e => ({ ...e, T: new Set(tokens(e.t)), W: new Set(tokens((e.w || "") + " " + e.k)), X: new Set(tokens(e.x + " " + e.p)) })); })
    .catch(() => { KB = []; }));

  function search(q) {
    const qt = [...new Set(tokens(q))];
    if (!qt.length) return [];
    const wantsPrice = qt.some(t => SYN[0].includes(t));
    const scored = KB.map(e => {
      let s = 0, hits = 0;
      qt.forEach(t => {
        const alts = [t, ...SYN.filter(g => g.includes(t)).flat()];
        let best = 0;
        alts.forEach((a, i) => {
          const w = i === 0 ? 1 : .55;
          if (e.T.has(a)) best = Math.max(best, 4 * w);
          else if (e.W.has(a)) best = Math.max(best, 2.5 * w);
          else if (e.X.has(a)) best = Math.max(best, 1.5 * w);
        });
        if (best) hits++;
        s += best;
      });
      if (wantsPrice && e.p) s += 1.5;
      return { e, s: s * (hits / qt.length + .5), hits };
    }).filter(r => r.hits && r.s >= 2).sort((a, b) => b.s - a.s);
    return scored.slice(0, 4).map(r => r.e);
  }

  /* Interface */
  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.2-4.4A8 8 0 1 1 21 12z"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5M12 16.5v.1"/></svg>';
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "ask-fab"; btn.setAttribute("aria-label", "Ouvrir l'assistant du site");
  btn.innerHTML = ICON;
  const box = document.createElement("div");
  box.className = "ask"; box.hidden = true;
  box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "Assistant du site ITM Digital");
  box.innerHTML = `<div class="ask-head"><span class="ask-ico">${ICON}</span><div><b>Assistant ITM</b><small>Trouvez une offre, un prix, une page</small></div><button type="button" class="ask-x" aria-label="Fermer l'assistant">×</button></div>`
    + `<div class="ask-log" aria-live="polite"></div>`
    + `<form class="ask-form"><input type="text" name="q" autocomplete="off" maxlength="140" placeholder="Votre question…" aria-label="Votre question"><button type="submit" class="btn btn-grad btn-sm">Envoyer</button></form>`;
  document.body.append(btn, box);
  const log = box.querySelector(".ask-log"), form = box.querySelector("form"), input = form.elements.q;
  const CHIPS = ["Prix d'un site web", "Distribuer ma musique", "Booster une publication", "Formations", "Photo et vidéo", "Contacter l'agence"];
  const chipsHtml = () => `<div class="ask-chips">${CHIPS.map(c => `<button type="button" data-q="${esc(c)}">${esc(c)}</button>`).join("")}</div>`;
  const say = (html, who) => {
    const m = document.createElement("div");
    m.className = "ask-msg " + (who || "bot"); m.innerHTML = html; log.appendChild(m);
    (who === "me" ? m : m).scrollIntoView({ block: who === "me" ? "end" : "start", behavior: "smooth" });
    return m;
  };
  const waBtn = (q, label) => `<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="${esc(wa("Bonjour ITM Digital, j'ai une question : " + q, "ASSISTANT"))}">${label}</a>`;

  async function answer(q) {
    const me = document.createElement("div"); me.className = "ask-msg me"; me.textContent = q; log.appendChild(me);
    await load();
    const res = search(q);
    if (!res.length) {
      say(`<p>Je n'ai pas trouvé cette information sur le site. Un conseiller peut vous répondre directement.</p>${waBtn(q, "Poser la question sur WhatsApp")}<p class="ask-sub">Ou essayez :</p>${chipsHtml()}`);
      return;
    }
    say(`<p>Voici ce que j'ai trouvé :</p>` + res.map(e => {
      const ext = /^https?:/.test(e.u);
      const x = e.x.length > 190 ? e.x.slice(0, 187) + "…" : e.x;
      return `<a class="ask-card" href="${esc(ext ? e.u : MAIN + e.u)}"><span class="ask-tag">${esc(e.k)}</span><b>${esc(e.t)}</b>${e.p ? `<em>${esc(e.p)}</em>` : ""}<span>${esc(x)}</span><i>Ouvrir la page ›</i></a>`;
    }).join("") + `<p class="ask-sub">Pas la bonne réponse ?</p>${waBtn(q, "Parler à un conseiller")}`);
  }

  const open = () => {
    box.hidden = false; btn.classList.add("on"); load();
    if (!log.children.length) say(`<p>Bonjour ! Je connais les services, les tarifs et les formations d'ITM Digital. Que cherchez-vous ?</p>${chipsHtml()}`);
    setTimeout(() => input.focus({ preventScroll: true }), 50);
  };
  const close = () => { box.hidden = true; btn.classList.remove("on"); };
  btn.addEventListener("click", () => box.hidden ? open() : close());
  box.querySelector(".ask-x").addEventListener("click", close);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !box.hidden) { close(); btn.focus(); } });
  form.addEventListener("submit", e => { e.preventDefault(); const q = input.value.trim(); if (!q) return; input.value = ""; answer(q); });
  log.addEventListener("click", e => {
    const c = e.target.closest("[data-q]");
    if (c) return answer(c.dataset.q);
    if (e.target.closest(".ask-card")) close();
  });
})();

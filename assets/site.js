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

/* ==========================================================
   modus.js
   
   Modus-router voor de Spellinggenerator.
   
   Drie modi:
   - "werkblad"      → bestaande layout met zijbalk-redesign (categorieën,
                       oefenvormen, bundel) — ongewijzigd
   - "herhaling"     → placeholder voor herhalingsbundel (etappe 2)
   - "weekdictee"    → eigen paneel met simpele 3-stappen UI
   
   Eerste bezoek (geen LS): startscherm met 3 kaarten.
   Herbezoek: directe modus uit LS, met "← Modus wisselen" knop altijd
   zichtbaar in de topbar zodat de leerkracht nooit "vastzit".
   
   Persistentie via localStorage onder key 'spelling-modus-v1'.
   ========================================================== */

window.SpellingModus = (function() {

  const LS_KEY = "spelling-modus-v1";
  const GELDIGE_MODI = new Set(["werkblad", "herhaling", "weekdictee"]);

  /* ---------- State ---------- */
  let huidigeModus = null;  // null = startscherm

  /* ---------- LocalStorage helpers ---------- */
  function laadModus() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw && GELDIGE_MODI.has(raw)) return raw;
    } catch (e) { /* SSR/private mode */ }
    return null;
  }

  function bewaarModus(modus) {
    try {
      if (modus === null) localStorage.removeItem(LS_KEY);
      else localStorage.setItem(LS_KEY, modus);
    } catch (e) {
      console.warn("Kon modus niet bewaren:", e);
    }
  }

  /* ---------- View-switching ----------
     We tonen/verbergen drie hoofdcontainers in de body:
     - #modus-startscherm
     - #modus-werkblad      (= bestaande .layout)
     - #modus-herhaling
     - #modus-weekdictee
     
     De topbar krijgt een modus-badge + "Modus wisselen" knop die alleen
     verschijnen als er een modus actief is. */
  function toonView(modus) {
    const startscherm = document.querySelector("#modus-startscherm");
    const werkblad = document.querySelector("#modus-werkblad");
    const herhaling = document.querySelector("#modus-herhaling");
    const weekdictee = document.querySelector("#modus-weekdictee");
    const modusBadge = document.querySelector("#modus-badge");
    const wisselKnop = document.querySelector("#modus-wisselen");
    const terugNaarMenu = document.querySelector(".topbar .terug");

    // Alles verbergen, dan juiste tonen
    if (startscherm) startscherm.style.display = "none";
    if (werkblad) werkblad.style.display = "none";
    if (herhaling) herhaling.style.display = "none";
    if (weekdictee) weekdictee.style.display = "none";

    if (modus === null) {
      if (startscherm) startscherm.style.display = "";
      if (modusBadge) modusBadge.style.display = "none";
      if (wisselKnop) wisselKnop.style.display = "none";
      if (terugNaarMenu) terugNaarMenu.style.display = "";
      document.body.classList.remove("heeft-modus", "modus-actief-werkblad", "modus-actief-herhaling", "modus-actief-weekdictee");
      return;
    }

    document.body.classList.add("heeft-modus");
    
    // Body-class voor actieve modus (zodat SpellingModusStorage de
    // juiste namespace gebruikt). Eerst alle modus-classes weg.
    document.body.classList.remove("modus-actief-werkblad", "modus-actief-herhaling", "modus-actief-weekdictee");
    if (modus) {
      document.body.classList.add("modus-actief-" + modus);
    }
    
    if (modusBadge) {
      modusBadge.style.display = "";
      modusBadge.textContent = modusLabels[modus] || modus;
    }
    if (wisselKnop) wisselKnop.style.display = "";
    // Binnen een modus: "← Terug naar menu" verbergen om verwarring met
    // "⇄ Modus wisselen" te voorkomen. Eén terug-actie per scherm.
    if (terugNaarMenu) terugNaarMenu.style.display = "none";

    if (modus === "werkblad" && werkblad) {
      werkblad.style.display = "";
    }
    else if (modus === "herhaling" && herhaling) {
      herhaling.style.display = "";
      // Notificeer herhalingsbundel-modus dat hij actief is
      window.dispatchEvent(new Event("spelling:herhaling-actief"));
    }
    else if (modus === "weekdictee" && weekdictee) {
      weekdictee.style.display = "";
      // Notificeer het weekdictee-paneel dat het zichtbaar is geworden,
      // zodat het zijn UI kan initialiseren / updaten.
      window.dispatchEvent(new Event("spelling:weekdictee-actief"));
    }
  }

  const modusLabels = {
    "werkblad": "📋 Werkbladen per categorie",
    "herhaling": "📚 Herhalingsbundel",
    "weekdictee": "📅 Weekdictee"
  };

  /* ---------- Public: kies een modus ---------- */
  function kies(modus) {
    if (!GELDIGE_MODI.has(modus)) {
      console.warn("Onbekende modus:", modus);
      return;
    }
    huidigeModus = modus;
    bewaarModus(modus);
    toonView(modus);
    // Scroll naar boven na modus-wissel — anders zit gebruiker midden in
    // een oude scroll-positie.
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  /* ---------- Public: terug naar startscherm ---------- */
  function terugNaarStartscherm() {
    huidigeModus = null;
    bewaarModus(null);
    toonView(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  /* ---------- Public: huidige modus opvragen ---------- */
  function getModus() {
    return huidigeModus;
  }

  /* ---------- Init ---------- */
  function init() {
    // Bedraad startscherm-kaarten
    document.querySelectorAll(".modus-kaart").forEach(kaart => {
      kaart.addEventListener("click", () => {
        const modus = kaart.dataset.modus;
        if (modus) kies(modus);
      });
      // Toetsenbord-toegankelijkheid (Enter/Space)
      kaart.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const modus = kaart.dataset.modus;
          if (modus) kies(modus);
        }
      });
    });

    // Bedraad "Modus wisselen" knop
    document.querySelector("#modus-wisselen")?.addEventListener("click", () => {
      terugNaarStartscherm();
    });

    // Bepaal startview op basis van LS
    const opgeslagen = laadModus();
    if (opgeslagen) {
      huidigeModus = opgeslagen;
      toonView(opgeslagen);
    } else {
      huidigeModus = null;
      toonView(null);
    }
  }

  return {
    init,
    kies,
    terugNaarStartscherm,
    getModus
  };

})();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => window.SpellingModus.init());
} else {
  window.SpellingModus.init();
}

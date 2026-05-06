/* ==========================================================
   woordenkiezer.js
   Beheert de modal-overlay waarin de leerkracht woorden kiest
   voor het weekdictee.

   Werkwijze:
   - Open modal via SpellingWoordenkiezer.open()
   - Vinkjes worden bewaard in window._weekdictee_gekozenWoorden
     als array van { tekst, lidwoord, categorie, leerjaar }
   - Bevestig-knop sluit modal en triggert preview-update
   ========================================================== */

window.SpellingWoordenkiezer = (function() {

  /* In-memory geheugen van vinkjes. Persistentie via localStorage zodat
     ze ook na refresh terugkomen. */
  let gekozen = [];

  const LS_KEY = "spelling-weekdictee-gekozen-v1";

  /* ----- Init: laad opgeslagen keuzes uit localStorage ----- */
  function laadOpgeslagen() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) gekozen = JSON.parse(raw);
    } catch (e) {
      console.warn("Kon opgeslagen keuzes niet laden:", e);
      gekozen = [];
    }
    window._weekdictee_gekozenWoorden = gekozen;
  }

  function bewaar() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(gekozen));
    } catch (e) {
      console.warn("Kon keuzes niet opslaan:", e);
    }
    window._weekdictee_gekozenWoorden = gekozen;
  }

  /* ----- Helpers: woord-id voor unieke identificatie ----- */
  function woordId(woord, leerjaar, categorie) {
    return `${leerjaar}|${categorie}|${woord.tekst}`;
  }
  function isGekozen(woord, leerjaar, categorie) {
    const id = woordId(woord, leerjaar, categorie);
    return gekozen.some(g => `${g.leerjaar}|${g.categorie}|${g.tekst}` === id);
  }

  /* ----- Render de modal-inhoud ----- */
  function renderCategorieen(leerjaar) {
    const wb = window.SpellingWoordenbibliotheek;
    if (!wb) return "<p>Woordenbibliotheek niet beschikbaar.</p>";

    const groepen = wb.categorieenPerGroep(leerjaar);
    let html = "";

    for (const [groepId, cats] of Object.entries(groepen)) {
      const groepLabel = wb.groepLabels[groepId] || groepId;
      html += `<div class="wk-categorie-blok">
        <div class="wk-groep-titel">${groepLabel}</div>`;

      for (const cat of cats) {
        // Tel hoeveel woorden gekozen in deze categorie
        const aantalGekozenInCat = cat.woorden.filter(w => isGekozen(w, leerjaar, cat.id)).length;

        html += `
          <div class="wk-cat-titel">
            <span>${cat.naam} <small>(${aantalGekozenInCat}/${cat.woorden.length})</small></span>
            <div class="wk-cat-acties">
              <button class="wk-cat-mini-btn" data-actie="alles" data-cat="${cat.id}" type="button">Alles</button>
              <button class="wk-cat-mini-btn" data-actie="geen" data-cat="${cat.id}" type="button">Geen</button>
            </div>
          </div>
          <div class="wk-woordenrooster">`;

        for (const woord of cat.woorden) {
          const checked = isGekozen(woord, leerjaar, cat.id);
          const tonen = wb.toonWoord(woord);
          html += `
            <label class="wk-woord-vinkje${checked ? ' gekozen' : ''}">
              <input type="checkbox"
                ${checked ? 'checked' : ''}
                data-woord-tekst="${woord.tekst}"
                data-woord-lidwoord="${woord.lidwoord || ''}"
                data-cat="${cat.id}">
              <span>${tonen}</span>
            </label>`;
        }
        html += `</div>`;
      }
      html += `</div>`;
    }
    return html;
  }

  function updateTeller() {
    const t = document.querySelector("#wk-aantal-gekozen");
    if (t) t.textContent = gekozen.length;
  }

  function herrender() {
    const leerjaar = parseInt(document.querySelector("#wk-leerjaar")?.value || "1", 10);
    const container = document.querySelector("#wk-categorieen");
    if (container) container.innerHTML = renderCategorieen(leerjaar);
    updateTeller();
  }

  /* ----- Open de modal ----- */
  function open() {
    laadOpgeslagen();
    document.querySelector("#wk-modal").style.display = "flex";
    herrender();
  }

  function sluit() {
    document.querySelector("#wk-modal").style.display = "none";
  }

  /* ----- Reset alle vinkjes ----- */
  function reset() {
    if (!confirm("Alle gekozen woorden wissen?")) return;
    gekozen = [];
    bewaar();
    herrender();
  }

  /* ----- Bedraad alle events bij paginalading ----- */
  function init() {
    laadOpgeslagen();

    // Sluit-knoppen
    document.querySelector("#wk-sluiten")?.addEventListener("click", sluit);
    document.querySelector("#wk-annuleren")?.addEventListener("click", sluit);

    // Reset
    document.querySelector("#wk-reset")?.addEventListener("click", reset);

    // Bevestig: sluit modal én trigger preview-update
    document.querySelector("#wk-bevestigen")?.addEventListener("click", () => {
      sluit();
      // Update info-tekst in sidebar
      updateSidebarInfo();
      // Trigger preview ververs
      if (window.SpellingPreview) window.SpellingPreview.ververs();
    });

    // Klik buiten modal-inhoud → sluiten
    document.querySelector("#wk-modal")?.addEventListener("click", (e) => {
      if (e.target.id === "wk-modal") sluit();
    });

    // Tabs in modal (Standaard / Mijn lijsten)
    document.querySelectorAll(".wk-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".wk-tab").forEach(t => t.classList.remove("actief"));
        tab.classList.add("actief");
        const which = tab.dataset.wkTab;
        document.querySelector("#wk-standaard").style.display = (which === "standaard") ? "" : "none";
        document.querySelector("#wk-mijn").style.display = (which === "mijn") ? "" : "none";
      });
    });

    // Leerjaar-keuze
    document.querySelector("#wk-leerjaar")?.addEventListener("change", herrender);

    // Event-delegatie voor vinkjes en alles/geen-knoppen (categorieën worden dynamisch gerenderd)
    document.querySelector("#wk-categorieen")?.addEventListener("change", (e) => {
      if (e.target.matches('input[type="checkbox"]')) {
        const tekst = e.target.dataset.woordTekst;
        const lidwoord = e.target.dataset.woordLidwoord || null;
        const cat = e.target.dataset.cat;
        const leerjaar = parseInt(document.querySelector("#wk-leerjaar")?.value || "1", 10);
        const id = `${leerjaar}|${cat}|${tekst}`;

        if (e.target.checked) {
          if (!gekozen.some(g => `${g.leerjaar}|${g.categorie}|${g.tekst}` === id)) {
            gekozen.push({ tekst, lidwoord: lidwoord || null, categorie: cat, leerjaar });
          }
        } else {
          gekozen = gekozen.filter(g => `${g.leerjaar}|${g.categorie}|${g.tekst}` !== id);
        }
        bewaar();
        // Update visuele staat zonder volledige re-render
        e.target.closest(".wk-woord-vinkje").classList.toggle("gekozen", e.target.checked);
        // Update teller in categorie-titel
        herrenderCategorieTeller(cat);
        updateTeller();
      }
    });

    document.querySelector("#wk-categorieen")?.addEventListener("click", (e) => {
      if (e.target.matches(".wk-cat-mini-btn")) {
        const actie = e.target.dataset.actie;
        const catId = e.target.dataset.cat;
        const leerjaar = parseInt(document.querySelector("#wk-leerjaar")?.value || "1", 10);
        const wb = window.SpellingWoordenbibliotheek;
        const cat = wb[`graad${leerjaar}`]?.[catId];
        if (!cat) return;

        if (actie === "alles") {
          for (const w of cat.woorden) {
            const id = `${leerjaar}|${catId}|${w.tekst}`;
            if (!gekozen.some(g => `${g.leerjaar}|${g.categorie}|${g.tekst}` === id)) {
              gekozen.push({ tekst: w.tekst, lidwoord: w.lidwoord || null, categorie: catId, leerjaar });
            }
          }
        } else if (actie === "geen") {
          gekozen = gekozen.filter(g => !(g.leerjaar === leerjaar && g.categorie === catId));
        }
        bewaar();
        herrender();
      }
    });
  }

  function herrenderCategorieTeller(catId) {
    // Eenvoudig: re-render de hele lijst (snel genoeg voor 200 woorden)
    herrender();
  }

  /* ----- Update de info-tekst in de sidebar (stap 1) ----- */
  function updateSidebarInfo() {
    const info = document.querySelector("#wd-keuze-info");
    if (!info) return;
    if (gekozen.length === 0) {
      info.textContent = "Nog geen woorden gekozen.";
      info.style.color = "#888";
    } else {
      info.innerHTML = `<strong>${gekozen.length}</strong> woord${gekozen.length === 1 ? '' : 'en'} gekozen ✓`;
      info.style.color = "var(--zisa-blauw)";
    }
  }

  /* ----- Public API ----- */
  return {
    init,
    open,
    sluit,
    updateSidebarInfo,
    getGekozen: () => gekozen
  };

})();

// Init zodra DOM klaar is
document.addEventListener("DOMContentLoaded", () => {
  window.SpellingWoordenkiezer.init();
});

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
     ze ook na refresh terugkomen. Dit is de RUWE lijst (alles wat ooit
     aangevinkt is). De FILTER op aangevinkte zijbalk-categorieën gebeurt
     in syncActieveWoorden() — die zet window._weekdictee_gekozenWoorden. */
  let gekozen = [];

  /* UI-filter: als true, toont de kiezer alleen woorden met afbeelding=true.
     Beïnvloedt NIET de gekozen-lijst (woorden die al aangevinkt waren maar
     geen plaatje hebben blijven aangevinkt; ze zijn alleen verborgen).
     Bewaard in localStorage zodat de toggle persistent is. */
  let filterAfb = false;

  const LS_KEY = "spelling-weekdictee-gekozen-v1";
  const LS_FILTER_KEY = "spelling-wk-filter-afb-v1";

  /* Detecteer welke modus momenteel actief is op basis van zichtbare 
     modus-section. Returnt "weekdictee", "werkblad", "herhaling" of null. */
  function getActieveModus() {
    const wd = document.querySelector("#modus-weekdictee");
    if (wd && wd.style.display !== "none" && wd.offsetParent !== null) {
      return "weekdictee";
    }
    const wb = document.querySelector("#modus-werkblad");
    if (wb && wb.style.display !== "none" && wb.offsetParent !== null) {
      return "werkblad";
    }
    const hb = document.querySelector("#modus-herhaling");
    if (hb && hb.style.display !== "none" && hb.offsetParent !== null) {
      return "herhaling";
    }
    return null;
  }

  /* Bepaal de actief-aangevinkte categorie-IDs.
     De juiste bron hangt af van welke modus actief is:
     - weekdictee-modus → window._zb_aangevinkteCategorieen (gezet door wd-paneel)
     - werkblad/herhaling-modus → SpellingZijbalk.getAangevinkteCategorieIds()
     Eerder gebruikten we alleen SpellingZijbalk, maar dat werkte niet voor 
     weekdictee. Eerder fix gebruikte alleen _zb_aangevinkteCategorieen, maar 
     dat lekte tussen modi heen. Nu kiezen we op basis van actieve modus. */
  function getActieveCategorieIds() {
    const modus = getActieveModus();
    
    if (modus === "weekdictee") {
      // In weekdictee-modus is _zb_aangevinkteCategorieen de bron van waarheid
      if (window._zb_aangevinkteCategorieen instanceof Set) {
        return window._zb_aangevinkteCategorieen;
      }
      return new Set();  // weekdictee actief maar nog niets aangevinkt
    }
    
    // Werkblad of herhalingsbundel: gebruik de zijbalk-API
    const zb = window.SpellingZijbalk;
    if (zb && typeof zb.getAangevinkteCategorieIds === "function") {
      return new Set(zb.getAangevinkteCategorieIds());
    }
    
    // Geen zijbalk én geen weekdictee → geen filter actief
    return null;
  }

  /* Geef enkel woorden uit categorieën die momenteel aangevinkt zijn in
     de zijbalk of het weekdictee-paneel. Als er geen filter actief is,
     alles teruggeven. */
  function getActieveWoorden() {
    const actieveCats = getActieveCategorieIds();
    if (actieveCats === null) return gekozen;  // geen filter beschikbaar
    if (actieveCats.size === 0) return [];     // filter actief maar niets aangevinkt
    return gekozen.filter(w => actieveCats.has(w.categorie));
  }

  /* Hoeveel woorden zitten in de ruwe lijst die NIET actief zijn? */
  function getVerborgenAantal() {
    const actieveCats = getActieveCategorieIds();
    if (actieveCats === null) return 0;
    return gekozen.filter(w => !actieveCats.has(w.categorie)).length;
  }

  /* Sync window._weekdictee_gekozenWoorden met de FILTER actief. Wordt
     aangeroepen na elke wijziging (vinkje, categorie-wissel, etc.) */
  function syncActieveWoorden() {
    window._weekdictee_gekozenWoorden = getActieveWoorden();
  }

  /* RUIM woorden op die in categorieën zitten die NIET MEER aangevinkt zijn.
     Verschilt van syncActieveWoorden: dit past de RUWE LIJST aan zodat
     uitgevinkte woorden permanent weg zijn (anders blijven ze in modal
     verschijnen ook al worden ze gefilterd uit de actieve lijst).
     
     Wordt aangeroepen vanuit zijbalk wanneer een categorie wordt
     uitgevinkt. */
  function ruimUitgevinkteOp() {
    const actieveCats = getActieveCategorieIds();
    if (actieveCats === null) {
      console.log("[ruimUitgevinkteOp] geen filter-bron beschikbaar");
      return;
    }
    
    const voor = gekozen.length;
    const verwijderdeCats = [...new Set(gekozen.filter(w => !actieveCats.has(w.categorie)).map(w => w.categorie))];
    gekozen = gekozen.filter(w => actieveCats.has(w.categorie));
    const na = gekozen.length;
    
    console.log("[ruimUitgevinkteOp] voor=" + voor + " na=" + na 
      + " | actieve cats: " + [...actieveCats].join(",") 
      + " | verwijderd uit: " + verwijderdeCats.join(","));
    
    if (voor !== na) {
      try { 
        (window.SpellingModusStorage || localStorage).setItem(LS_KEY, JSON.stringify(gekozen)); 
      } catch (e) {}
      syncActieveWoorden();
    }
  }

  /* Hulpfunctie: gebruik SpellingModusStorage als die er is, anders localStorage */
  function _storage() {
    return window.SpellingModusStorage || localStorage;
  }

  /* ----- Init: laad opgeslagen keuzes uit localStorage ----- */
  function laadOpgeslagen() {
    try {
      const raw = _storage().getItem(LS_KEY);
      if (raw) gekozen = JSON.parse(raw);
      else gekozen = [];
    } catch (e) {
      console.warn("Kon opgeslagen keuzes niet laden:", e);
      gekozen = [];
    }
    // Filter-state laden (eenvoudige boolean in localStorage)
    try {
      filterAfb = _storage().getItem(LS_FILTER_KEY) === "1";
    } catch (e) {
      filterAfb = false;
    }
    syncActieveWoorden();
  }

  function bewaar() {
    try {
      _storage().setItem(LS_KEY, JSON.stringify(gekozen));
    } catch (e) {
      console.warn("Kon keuzes niet opslaan:", e);
    }
    syncActieveWoorden();
  }

  function bewaarFilter() {
    try {
      _storage().setItem(LS_FILTER_KEY, filterAfb ? "1" : "0");
    } catch (e) { /* SSR/private mode */ }
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

    // Lees zijbalk-filter: alleen aangevinkte categorieën tonen
    const zijbalkFilter = window._zb_aangevinkteCategorieen;
    const heeftFilter = zijbalkFilter && zijbalkFilter.size > 0;
    
    const groepen = wb.categorieenPerGroep(leerjaar);
    let html = "";
    
    // Als zijbalk-filter actief is en geen enkele categorie aangevinkt:
    if (zijbalkFilter && zijbalkFilter.size === 0) {
      return `<div class="wk-leeg-graad">
        <h3>Geen categorieën aangevinkt</h3>
        <p>Sluit deze modal en vink in de zijbalk eerst categorieën aan onder "Wat wil je oefenen?".</p>
      </div>`;
    }

    for (const [groepId, cats] of Object.entries(groepen)) {
      // Filter cats op zijbalk-aangevinkt
      const filteredCats = heeftFilter 
        ? cats.filter(c => zijbalkFilter.has(c.id))
        : cats;
      
      if (filteredCats.length === 0) continue;
      
      const groepLabel = wb.groepLabels[groepId] || groepId;
      
      // Bepaal aan-status van groep: alle zichtbare woorden van alle cats in deze groep
      let totaalWoorden = 0, gekozenWoorden = 0;
      for (const c of filteredCats) {
        const zichtbaar = filterAfb
          ? c.woorden.filter(w => w.afbeelding === true)
          : c.woorden;
        for (const w of zichtbaar) {
          totaalWoorden++;
          if (isGekozen(w, leerjaar, c.id)) gekozenWoorden++;
        }
      }
      // Als de hele groep door de filter leeg is geworden, sla hem over
      if (totaalWoorden === 0) continue;
      const groepAlles = gekozenWoorden === totaalWoorden && totaalWoorden > 0;
      const groepSome = gekozenWoorden > 0 && gekozenWoorden < totaalWoorden;
      
      html += `<div class="wk-categorie-blok">
        <label class="wk-groep-titel">
          <input type="checkbox" class="wk-groep-master" data-groep="${groepId}"
                 ${groepAlles ? 'checked' : ''}
                 ${groepSome ? 'data-indeterminate="true"' : ''}>
          <span>${groepLabel}</span>
          <span class="wk-groep-teller"><small>(${gekozenWoorden}/${totaalWoorden})</small></span>
        </label>`;

      for (const cat of filteredCats) {
        // Filter woorden volgens filterAfb-toggle (UI-filter; gekozen-lijst
        // blijft ongemoeid — een woord dat eerder is aangevinkt blijft 
        // aangevinkt, het is alleen niet meer zichtbaar in de kiezer).
        const zichtbareWoorden = filterAfb
          ? cat.woorden.filter(w => w.afbeelding === true)
          : cat.woorden;
        
        // Als filter aan staat en deze categorie heeft 0 woorden met plaatje,
        // sla hem helemaal over (anders krijgt de leerkracht een lege cat-titel).
        if (zichtbareWoorden.length === 0) continue;
        
        // Tel: zichtbare gekozen / zichtbaar totaal
        const aantalGekozenInCat = zichtbareWoorden.filter(w => isGekozen(w, leerjaar, cat.id)).length;

        html += `
          <div class="wk-cat-titel">
            <span>${cat.naam} <small>(${aantalGekozenInCat}/${zichtbareWoorden.length})</small></span>
            <div class="wk-cat-acties">
              <button class="wk-cat-mini-btn" data-actie="alles" data-cat="${cat.id}" type="button">Alles</button>
              <button class="wk-cat-mini-btn" data-actie="geen" data-cat="${cat.id}" type="button">Geen</button>
            </div>
          </div>
          <div class="wk-woordenrooster">`;

        for (const woord of zichtbareWoorden) {
          const checked = isGekozen(woord, leerjaar, cat.id);
          const tonen = wb.toonWoord(woord);
          const heeftAfb = woord.afbeelding === true;
          const sg = woord.synoniemGroep || "";
          // 🖼️ alleen tonen bij woorden met afbeelding:true
          const afbIcoon = heeftAfb ? `<span class="wk-afb-icoon" title="Heeft een afbeelding">🖼️</span>` : "";
          html += `
            <label class="wk-woord-vinkje${checked ? ' gekozen' : ''}${heeftAfb ? ' wk-heeft-afb' : ' wk-geen-afb'}">
              <input type="checkbox"
                ${checked ? 'checked' : ''}
                data-woord-tekst="${woord.tekst}"
                data-woord-lidwoord="${woord.lidwoord || ''}"
                data-woord-afbeelding="${heeftAfb ? '1' : '0'}"
                data-woord-synoniem="${sg}"
                data-cat="${cat.id}">
              <span>${tonen}${afbIcoon}</span>
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

  /* Bepaal actieve graad: eerst uit sidebar (graad-tab of legacy graad-knop),
     dan uit modal-dropdown, dan default 1 */
  function actieveGraad() {
    // Nieuwe zijbalk gebruikt .graad-tab
    const tab = document.querySelector(".graad-tab.actief");
    if (tab?.dataset?.graad) return parseInt(tab.dataset.graad, 10);
    // Legacy fallback voor oude .graad-knop
    const sidebar = document.querySelector(".graad-knop.actief");
    if (sidebar?.dataset?.graad) return parseInt(sidebar.dataset.graad, 10);
    const modal = document.querySelector("#wk-leerjaar");
    if (modal?.value) return parseInt(modal.value, 10);
    return 1;
  }

  function herrender() {
    const leerjaar = actieveGraad();
    // Sync de modal-dropdown met de huidige graad
    const modal = document.querySelector("#wk-leerjaar");
    if (modal && modal.value !== String(leerjaar)) modal.value = String(leerjaar);

    const container = document.querySelector("#wk-categorieen");
    if (!container) return;

    const wb = window.SpellingWoordenbibliotheek;
    if (!wb || !wb.graadHeeftWoorden(leerjaar)) {
      container.innerHTML = `
        <div class="wk-leeg-graad">
          <h3>Graad ${leerjaar} — binnenkort beschikbaar</h3>
          <p>De woordenset voor graad ${leerjaar} is nog in ontwikkeling.
          Voorlopig kan je alleen woorden kiezen voor graad 1.</p>
        </div>`;
      updateTeller();
      return;
    }

    container.innerHTML = renderCategorieen(leerjaar);
    // Stel indeterminate state in voor groep-master checkboxes
    container.querySelectorAll('.wk-groep-master[data-indeterminate]').forEach(el => {
      el.indeterminate = true;
    });
    updateTeller();
  }

  /* ----- Open de modal ----- */
  function open() {
    laadOpgeslagen();
    // Sync filter-checkbox met de geladen state
    const filterCb = document.querySelector("#wk-filter-afb");
    if (filterCb) filterCb.checked = filterAfb;
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
      // Notificeer zijbalk dat woorden gewijzigd zijn
      window.dispatchEvent(new Event("spelling:woorden-gewijzigd"));
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

    // Filter-toggle: toon enkel woorden met plaatje
    document.querySelector("#wk-filter-afb")?.addEventListener("change", (e) => {
      filterAfb = !!e.target.checked;
      bewaarFilter();
      herrender();
    });

    // Event-delegatie voor vinkjes en alles/geen-knoppen (categorieën worden dynamisch gerenderd)
    document.querySelector("#wk-categorieen")?.addEventListener("change", (e) => {
      // Groep-master vinkje: alle ZICHTBARE woorden van alle cats in groep aan/uit
      // (als filterAfb actief is, raken we woorden zonder plaatje niet aan —
      // anders zou je per ongeluk verborgen woorden afvinken).
      if (e.target.matches(".wk-groep-master")) {
        const groepId = e.target.dataset.groep;
        const aan = e.target.checked;
        const leerjaar = actieveGraad();
        const wb = window.SpellingWoordenbibliotheek;
        const data = wb.categorieenPerHoofdgroep(leerjaar);
        for (const groepen of Object.values(data)) {
          const cats = groepen[groepId];
          if (!cats) continue;
          for (const cat of cats) {
            const woordenInScope = filterAfb
              ? cat.woorden.filter(w => w.afbeelding === true)
              : cat.woorden;
            for (const w of woordenInScope) {
              const id = `${leerjaar}|${cat.id}|${w.tekst}`;
              const al = gekozen.some(g => `${g.leerjaar}|${g.categorie}|${g.tekst}` === id);
              if (aan && !al) {
                gekozen.push({
                  tekst: w.tekst,
                  lidwoord: w.lidwoord || null,
                  afbeelding: w.afbeelding === true,
                  synoniemGroep: w.synoniemGroep || null,
                  categorie: cat.id,
                  leerjaar
                });
              } else if (!aan && al) {
                gekozen = gekozen.filter(g => `${g.leerjaar}|${g.categorie}|${g.tekst}` !== id);
              }
            }
          }
        }
        bewaar();
        herrender();
        return;
      }
      
      if (e.target.matches('input[type="checkbox"]') && e.target.dataset.woordTekst) {
        const tekst = e.target.dataset.woordTekst;
        const lidwoord = e.target.dataset.woordLidwoord || null;
        const heeftAfb = e.target.dataset.woordAfbeelding === "1";
        const synoniemGroep = e.target.dataset.woordSynoniem || null;
        const cat = e.target.dataset.cat;
        const leerjaar = actieveGraad();
        const id = `${leerjaar}|${cat}|${tekst}`;

        if (e.target.checked) {
          if (!gekozen.some(g => `${g.leerjaar}|${g.categorie}|${g.tekst}` === id)) {
            gekozen.push({
              tekst,
              lidwoord: lidwoord || null,
              afbeelding: heeftAfb,
              synoniemGroep: synoniemGroep || null,
              categorie: cat,
              leerjaar
            });
          }
        } else {
          gekozen = gekozen.filter(g => `${g.leerjaar}|${g.categorie}|${g.tekst}` !== id);
        }
        bewaar();
        e.target.closest(".wk-woord-vinkje").classList.toggle("gekozen", e.target.checked);
        herrenderCategorieTeller(cat);
        updateTeller();
      }
    });

    document.querySelector("#wk-categorieen")?.addEventListener("click", (e) => {
      if (e.target.matches(".wk-cat-mini-btn")) {
        const actie = e.target.dataset.actie;
        const catId = e.target.dataset.cat;
        const leerjaar = actieveGraad();
        const wb = window.SpellingWoordenbibliotheek;
        const cat = wb[`graad${leerjaar}`]?.[catId];
        if (!cat) return;

        if (actie === "alles") {
          // Respecteer filter: alleen zichtbare woorden aanvinken.
          const woordenInScope = filterAfb
            ? cat.woorden.filter(w => w.afbeelding === true)
            : cat.woorden;
          for (const w of woordenInScope) {
            const id = `${leerjaar}|${catId}|${w.tekst}`;
            if (!gekozen.some(g => `${g.leerjaar}|${g.categorie}|${g.tekst}` === id)) {
              gekozen.push({
                tekst: w.tekst,
                lidwoord: w.lidwoord || null,
                afbeelding: w.afbeelding === true,
                synoniemGroep: w.synoniemGroep || null,
                categorie: catId,
                leerjaar
              });
            }
          }
        } else if (actie === "geen") {
          // Respecteer filter: alleen zichtbare woorden afvinken.
          if (filterAfb) {
            const zichtbareTeksten = new Set(
              cat.woorden.filter(w => w.afbeelding === true).map(w => w.tekst)
            );
            gekozen = gekozen.filter(g => !(
              g.leerjaar === leerjaar && g.categorie === catId && zichtbareTeksten.has(g.tekst)
            ));
          } else {
            gekozen = gekozen.filter(g => !(g.leerjaar === leerjaar && g.categorie === catId));
          }
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

  /* ----- Update info-tekst in de sidebar (alle modules die het hebben) ----- */
  function updateSidebarInfo() {
    const aantal = gekozen.length;
    // Update voor weekdictee én ov01 als ze in DOM staan
    ["#wd-keuze-info", "#ov01-keuze-info"].forEach(sel => {
      const info = document.querySelector(sel);
      if (!info) return;
      if (aantal === 0) {
        info.textContent = "Nog geen woorden gekozen.";
        info.style.color = "#888";
      } else {
        info.innerHTML = `<strong>${aantal}</strong> woord${aantal === 1 ? '' : 'en'} gekozen ✓`;
        info.style.color = "var(--zisa-blauw)";
      }
    });
  }

  /* Herlaad uit storage — handig na modus-wissel */
  function herlaad() {
    laadOpgeslagen();
  }

  /* Zet de gekozen woorden volledig leeg (memory + storage)
     — voor "Nieuwe bundel starten" */
  function reset() {
    gekozen = [];
    try {
      _storage().setItem(LS_KEY, JSON.stringify([]));
    } catch (e) {}
    syncActieveWoorden();
  }

  /* ----- Public API ----- */
  return {
    init,
    open,
    sluit,
    updateSidebarInfo,
    syncActieveWoorden,             // herbereken filter (te roepen door zijbalk bij categorie-wissel)
    ruimUitgevinkteOp,              // verwijder woorden uit uitgevinkte cats uit ruwe lijst (permanent)
    herlaad,                         // herlaad uit (nieuwe) storage-namespace
    reset,                           // wis alle gekozen woorden
    getGekozen: () => gekozen,       // alle woorden (ruwe lijst, ook verborgen)
    getActieveWoorden,               // alleen woorden uit aangevinkte categorieën
    getVerborgenAantal               // hoeveel woorden zijn er momenteel verborgen
  };

})();

// Init zodra DOM klaar is
document.addEventListener("DOMContentLoaded", () => {
  window.SpellingWoordenkiezer.init();
});
/* ==========================================================
   herhalingsbundel.js
   
   Beheert de "Herhalingsbundel"-modus: een doorlopend werkboek
   waar de leerkracht meerdere oefeningen na elkaar plaatst,
   met vrije keuze van oefenvormen, niveaus en woordensets per
   oefening.
   
   Verschil met werkblad-modus:
     - Elke oefening = compact blok (geen aparte A4-pagina)
     - 1 globale header op pagina 1 (Naam/Datum/Boekje-titel)
     - Oefeningen vloeien door, pagina-break alleen bij volle pagina
     - Voettekst + paginanummer per pagina
   
   API:
     SpellingHerhalingsbundel.voegToe(oefId, niveau)
     SpellingHerhalingsbundel.verwijder(itemId)
     SpellingHerhalingsbundel.verplaats(itemId, richting)  // 'omhoog'/'omlaag'
     SpellingHerhalingsbundel.renderPreview()  // bouwt HTML in #hb-pages
     SpellingHerhalingsbundel.gaNaarPagina(n)
     SpellingHerhalingsbundel.setBoekjeTitel(titel)
     SpellingHerhalingsbundel.wis()
     SpellingHerhalingsbundel.getItems()
   ========================================================== */

window.SpellingHerhalingsbundel = (function() {

  const LS_KEY = "spelling-herhalingsbundel-v1";
  
  /* Geschatte hoogtes voor pagina-flow. Conservatief — liever iets
     vroeger pagina-break dan oefening doorsnijden. */
  /* Geschatte hoogtes voor pagina-flow. Conservatief — liever iets
     vroeger pagina-break dan oefening doorsnijden.
     A4 = 29.7cm = ~1123px op 96 DPI.
     Padding hb-pagina = 1.5cm top + 1.5cm bottom = ~113px.
     Netto inhoud = 1123 - 113 = ~1010px. */
  const HEADER_HOOGTE = 140;     // header op pagina 1 (Naam/Datum/Titel)
  const PAGINA_HOOGTE = 1010;    // A4 netto inhoud
  const VOETTEKST_HOOGTE = 40;
  const NETTO_PAGINA = PAGINA_HOOGTE - VOETTEKST_HOOGTE;
  
  /* Geschatte hoogte per oefening per niveau, in pixels.
     Conservatief geschat — pagina-break gebeurt liever te vroeg
     dan dat een oefening half wordt afgesneden. */
  const OEFENING_HOOGTE = {
    "ov01-basis":     500,
    "ov01-kern":      500,
    "ov01-verdieping":500,
    "ov01-uitbreiding":500,
    "ov02-basis":     900,    // overschrijfoefening, vrij hoog
    "ov03-basis":     500,
    "ov03-kern":      500,
    "ov03-verdieping":550,
    "ov03-uitbreiding":600,
    "ov04-basis":     650,
    "ov04-kern":      650,
    "ov04-verdieping":700,
    "ov04-uitbreiding":750,
    "ov05-basis":     500,
    "ov05-kern":      500,
    "ov05-verdieping":450,
    "ov05-uitbreiding":550,
    "ov06-basis":     400,
    "ov06-kern":      450,
    "ov06-verdieping":500,
    "ov06-uitbreiding":550,
    "ov07-basis":     400,
    "ov07-kern":      500,
    "ov07-verdieping":450,
    "ov07-uitbreiding":600,
    "ov08-basis":     400,
    "ov08-kern":      500,
    "ov08-verdieping":450,
    "ov08-uitbreiding":600,
    "ov09-basis":     450,
    "ov09-kern":      500,
    "ov09-verdieping":500,
    "ov09-uitbreiding":550,
    "ov10-basis":     400,
    "ov10-kern":      450,
    "ov10-verdieping":500,
    "ov10-uitbreiding":550,
  };
  
  function _hoogteVoor(item) {
    return OEFENING_HOOGTE[item.ovId + "-" + item.niveau] || 500;
  }

  /* ----- State ----- */
  let state = {
    titel: "Mijn herhalingsbundel",
    titelGecentreerd: false,
    items: [],
    huidigePagina: 1
  };

  function _storage() {
    return window.SpellingModusStorage || localStorage;
  }

  /* ----- Persist ----- */
  function laad() {
    try {
      const raw = _storage().getItem(LS_KEY);
      if (raw) {
        const obj = JSON.parse(raw);
        state.titel = obj.titel || "Mijn herhalingsbundel";
        state.titelGecentreerd = obj.titelGecentreerd === true;
        state.items = Array.isArray(obj.items) ? obj.items : [];
        state.huidigePagina = obj.huidigePagina || 1;
      } else {
        // Reset state — anders blijft vorige modus zijn data
        state.titel = "Mijn herhalingsbundel";
        state.titelGecentreerd = false;
        state.items = [];
        state.huidigePagina = 1;
      }
    } catch (e) {
      console.warn("Kon herhalingsbundel niet laden:", e);
    }
  }
  function bewaar() {
    try {
      _storage().setItem(LS_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Kon herhalingsbundel niet bewaren:", e);
    }
  }

  /* ----- Pagina-verdeling: deel items op in pagina's
     ----- 
     OUDE schattings-aanpak (fallback): elk item krijgt een vaste 
     hoogte uit OEFENING_HOOGTE.
     
     NIEUWE meet-aanpak: meet werkelijke hoogtes via _meetItems().
     We slaan de gemeten hoogtes op in _gemetenHoogtes (Map: itemId → px).
     Als nog niet gemeten, gebruiken we de schatting tijdelijk. */
  const _gemetenHoogtes = new Map();
  
  function _verdeelPagina(items) {
    const paginas = [[]];
    let beschikbaar = NETTO_PAGINA - HEADER_HOOGTE;
    
    for (const item of items) {
      const h = _gemetenHoogtes.get(item.id) || _hoogteVoor(item);
      if (h > beschikbaar && paginas[paginas.length - 1].length > 0) {
        paginas.push([]);
        beschikbaar = NETTO_PAGINA;
      }
      paginas[paginas.length - 1].push(item);
      beschikbaar -= h;
    }
    return paginas;
  }
  
  /* Render alle items in een verborgen container, teken canvases,
     meet hoogtes en bewaar in _gemetenHoogtes. */
  async function _meetItems() {
    if (state.items.length === 0) return;
    
    // Bouw verborgen meet-container met dezelfde breedte als echte pagina-inhoud
    // .hb-pagina heeft padding 50px 60px → inhoud-breedte = 794 - 120 = 674px
    // Gebruik visibility:hidden ipv left:-99999px (betere layout-berekening).
    const meter = document.createElement("div");
    meter.className = "hb-meet-container";
    meter.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 17cm;
      visibility: hidden;
      z-index: -1;
    `;
    
    let html = "";
    let nr = 1;
    for (const item of state.items) {
      html += _renderItem(item, nr);
      nr++;
    }
    meter.innerHTML = html;
    document.body.appendChild(meter);
    
    // BELANGRIJK: forceer min-height: auto op werkblad-elementen in de meter
    // anders meet elk item 29cm = 1097px door .werkblad's min-height!
    // Gebruik setProperty met 'important' om CSS-specificiteit te overrulen.
    meter.querySelectorAll(".werkblad").forEach(el => {
      el.style.setProperty("min-height", "auto", "important");
      el.style.setProperty("width", "100%", "important");
      el.style.setProperty("padding", "0", "important");
      el.style.setProperty("margin", "0", "important");
      el.style.setProperty("box-shadow", "none", "important");
    });
    
    // Teken schrijflijn-canvases want die beïnvloeden de hoogte
    if (window.SpellingSchrijflijnen?.tekenAlle) {
      window.SpellingSchrijflijnen.tekenAlle(meter);
    }
    
    // Wacht 2 frames zodat layout berekend is na canvas-tekening
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    
    // Meet elke .hb-item
    const itemElems = meter.querySelectorAll(".hb-item");
    itemElems.forEach((el) => {
      const itemId = el.dataset.itemId;
      const h = el.offsetHeight;
      if (itemId && h > 0) {
        // Voeg 18px marge toe (margin-bottom tussen items)
        _gemetenHoogtes.set(itemId, h + 18);
      }
    });
    
    meter.remove();
  }

  /* Markeer opdracht-blok + eerste rij zodat CSS ze samen kan houden.
     - Opdracht krijgt class .hb-opdracht-blok (CSS: page-break-after: avoid)
     - Eerste rij na opdracht krijgt class .hb-eerste-rij-na-opdracht
       (CSS: page-break-before: avoid)
     Combinatie: html2pdf MOET ze samen op één pagina zetten.
     Geen DOM-verplaatsing of klonen — origineel blijft 100% intact. */
  function _wrapOpdrachtMetEersteRij(root) {
    const opdrachten = root.querySelectorAll(
      ".ov01-stappen, .ov02-instructies, .ov03-instructies, " +
      ".ov04-instructies, .ov05-instructies, .ov06-instructies, " +
      ".ov07-instructies, .ov08-instructies, .ov09-instructies, " +
      ".ov10-instructies"
    );
    
    // Selectors voor rij/cel-elementen die als "eerste rij" tellen.
    // We zoeken zowel directe siblings als binnen rooster-wrappers.
    const RIJ_SELECTORS = ".ov01-rooster-rij, .ov02-rij, .ov03-cel, .ov04-rij, .ov05-rij, .ov06-zin-rij, .ov07-rij, .ov08-rij, .ov08-invul-zin, .ov09-basis-cel, .ov10-rij, .ov10-basis-rij";
    
    opdrachten.forEach(opdracht => {
      opdracht.classList.add("hb-opdracht-blok");
      
      // Zoek eerste rij die volgt op de opdracht.
      // Mogelijk in een sibling-rooster of nested verder.
      let eersteRij = null;
      let volgend = opdracht.nextElementSibling;
      
      while (volgend && !eersteRij) {
        // Is dit element zelf een rij?
        if (volgend.matches(RIJ_SELECTORS)) {
          eersteRij = volgend;
          break;
        }
        // Of zit er een rij in?
        const rijIn = volgend.querySelector(RIJ_SELECTORS);
        if (rijIn) {
          eersteRij = rijIn;
          break;
        }
        volgend = volgend.nextElementSibling;
      }
      
      // Markeer de gevonden eerste rij
      if (eersteRij) {
        eersteRij.classList.add("hb-eerste-rij-na-opdracht");
        // Ook de directe rooster-parent markeren als die er is
        // (sommige page-break engines werken alleen op blok-elementen, niet flex-cellen)
        const roosterParent = eersteRij.closest(".ov01-rooster, .ov02-rooster, .ov03-rooster, .ov04-rooster, .ov05-rooster, .ov06-rooster, .ov07-rooster, .ov08-rooster, .ov09-basis-rooster, .ov10-rooster, .ov10-basis-rooster");
        if (roosterParent && roosterParent !== opdracht.parentNode) {
          roosterParent.classList.add("hb-rooster-met-eerste-rij");
        }
      }
    });
  }
  
  /* ----- Render één item (=oefening) compact ----- */
  function _renderItem(item, nummerInBoekje) {
    const mod = window.SpellingModules?.[item.ovId];
    if (!mod || typeof mod.genereerBlad !== "function") {
      return `<div class="hb-item hb-item-fout">
        <span>⚠️ Oefenvorm ${item.ovId} niet gevonden</span>
      </div>`;
    }
    
    // Bepaal welke woorden EXACT in deze oefening moeten staan.
    // Eerste render: pool = snapshot (OV-module kiest random uit deze pool
    //   en we bewaren de gekozen woorden in item.actieveWoorden voor later)
    // Latere renders: pool = actieveWoorden + extraWoorden - verwijderdeWoorden
    //   = EXACT de lijst die getoond moet worden, geen random selectie meer.
    const verwijderd = new Set(item.verwijderdeWoorden || []);
    let pool;
    let bewaarActieve = false;
    
    if (item.actieveWoorden) {
      // Vaste lijst: precies deze woorden + extra - verwijderd
      pool = [
        ...item.actieveWoorden, 
        ...(item.extraWoorden || [])
      ].filter(w => !verwijderd.has(w.tekst));
    } else {
      // Eerste render: gebruik snapshot, bewaar uitkomst
      pool = item.gekozenWoordenSnapshot || [];
      bewaarActieve = true;
    }
    
    const origineel = window._weekdictee_gekozenWoorden;
    window._weekdictee_gekozenWoorden = pool;
    
    let werkbladHTML = "";
    
    // Bepaal effectief aantal woorden voor deze oefening:
    // - Eerste render: item.aantal (door leerkracht gekozen) of module default
    // - Latere renders: pool.length (= exact wat in pool zit, ALLES tonen)
    let effectiefAantal;
    if (item.actieveWoorden) {
      // Vaste pool — toon precies wat erin zit
      effectiefAantal = pool.length;
    } else if (item.aantal) {
      effectiefAantal = item.aantal;
    } else if (mod._maxPerNiveau) {
      effectiefAantal = mod._maxPerNiveau[item.niveau] || 0;
    } else {
      effectiefAantal = undefined;
    }
    // Veiligheidsklep
    if (effectiefAantal !== undefined) {
      effectiefAantal = Math.max(1, Math.min(effectiefAantal, pool.length));
    }
    
    let origMaxPerNiveau = null;
    if (effectiefAantal && mod._maxPerNiveau) {
      origMaxPerNiveau = mod._maxPerNiveau;
      mod._maxPerNiveau = { ...origMaxPerNiveau, [item.niveau]: effectiefAantal };
    }
    
    try {
      // Lees actuele zijbalk-instellingen (per-OV)
      // OV02 plaatje-toggle: leerkracht-toggle uit zijbalk-state
      let ov02MetPlaatje = false;
      if (item.ovId === "ov02") {
        const zb = window.SpellingZijbalk;
        const ov02State = zb?.getOefenvormState ? zb.getOefenvormState("ov02") : null;
        if (ov02State) ov02MetPlaatje = ov02State.metPlaatje === true;
      }
      
      // Roep module's genereerBlad aan met gepaste opties
      const opties = {
        graad: item.graad || 1,
        [item.ovId]: {
          niveaus: [item.niveau],
          lijntype: item.lijntype || "type3",
          lijnhoogte: item.lijnhoogte || "middel",
          ondertitel: "",
          plaatjeKern: false,        // ⭐⭐ kern toont géén plaatje 
                                     // (verschil met ⭐ basis = pedagogische trap)
          plaatjeVerdieping: true,
          // OV02-specifiek: leerkracht-toggle voor plaatjes
          metPlaatje: ov02MetPlaatje,
          // aantalWoorden voor OV01, OV02, OV03 (die geen _maxPerNiveau hebben)
          aantalWoorden: effectiefAantal,
          ...(item.opties || {})
        }
      };
      werkbladHTML = mod.genereerBlad(opties, item.metAntwoorden || false);
    } catch (e) {
      werkbladHTML = `<div class="hb-item-fout">Fout bij renderen: ${e.message}</div>`;
    } finally {
      // Herstel
      window._weekdictee_gekozenWoorden = origineel;
      if (origMaxPerNiveau) mod._maxPerNiveau = origMaxPerNiveau;
    }
    
    // STRIP de pagina-header (Naam/Datum/Titel) en voettekst weg via DOM.
    // Veiliger dan regex: telt geneste divs correct.
    // De opdracht-blok ('Opdracht: ...') blijft BEHOUDEN want die zit
    // BUITEN de header — kinderen weten zo wat ze moeten doen per oefening.
    const tmp = document.createElement("div");
    tmp.innerHTML = werkbladHTML;
    
    // Bewaar de actieve woorden bij eerste render (uit data-woord attributen)
    // Daarna weet de pool exact welke woorden bij deze oefening horen.
    if (bewaarActieve) {
      const woordTeksten = new Set();
      tmp.querySelectorAll("[data-woord]").forEach(el => {
        const t = el.dataset.woord;
        if (t) woordTeksten.add(t);
      });
      // Pak de woord-objecten uit snapshot die overeenkomen
      const snapshotMap = new Map((item.gekozenWoordenSnapshot || []).map(w => [w.tekst, w]));
      const actieve = [];
      for (const tekst of woordTeksten) {
        const w = snapshotMap.get(tekst);
        if (w) actieve.push(JSON.parse(JSON.stringify(w)));
      }
      if (actieve.length > 0) {
        item.actieveWoorden = actieve;
        bewaar();
      }
    }
    
    // Strip alle pagina-headers (Naam/Datum/Titel-blokken per OV)
    tmp.querySelectorAll(
      ".ov01-header, .ov02-header, .ov03-header, .ov04-header, " +
      ".ov05-header, .ov06-header, .ov07-header, .ov08-header, " +
      ".ov09-header, .ov10-header, .weekdictee-header"
    ).forEach(el => el.remove());
    
    // Strip alle voetteksten (www.jufzisa.be — Juf Zisa's spellinggenerator)
    tmp.querySelectorAll(
      ".ov01-voettekst, .ov02-voettekst, .ov03-voettekst, .ov04-voettekst, " +
      ".ov05-voettekst, .ov06-voettekst, .ov07-voettekst, .ov08-voettekst, " +
      ".ov09-voettekst, .ov10-voettekst, .weekdictee-voettekst"
    ).forEach(el => el.remove());
    
    // Strip het "Opdracht:" label uit het opdracht-blok (de stappen zelf
    // blijven staan — kinderen weten zo wat ze moeten doen). De
    // ov01-stappen-label class wordt door alle OV's hergebruikt.
    tmp.querySelectorAll(".ov01-stappen-label").forEach(el => el.remove());
    
    // KRITIEK voor PDF-flow: wrap opdracht-blok + EERSTE rij oefeningen
    // in één container met page-break-inside: avoid. Zo blijven die altijd
    // samen op één pagina. Volgende rijen mogen vrij naar volgende pagina.
    _wrapOpdrachtMetEersteRij(tmp);
    
    werkbladHTML = tmp.innerHTML;
    
    const niveauLabel = { basis:"⭐", kern:"⭐⭐", verdieping:"⭐⭐⭐", uitbreiding:"⭐⭐⭐⭐" }[item.niveau] || "";
    const ovNaam = mod.naam || item.ovId;
    
    return `<div class="hb-item" data-item-id="${item.id}">
      <div class="hb-item-header">
        <span class="hb-item-titel">
          <strong>Oefening ${nummerInBoekje}:</strong> ${ovNaam} <span class="hb-niveau">${niveauLabel}</span>
        </span>
        <div class="hb-item-acties">
          <button class="hb-knop-omhoog" data-item-id="${item.id}" title="Naar boven" type="button">↑</button>
          <button class="hb-knop-omlaag" data-item-id="${item.id}" title="Naar onder" type="button">↓</button>
          <button class="hb-knop-verwijder" data-item-id="${item.id}" title="Verwijderen" type="button">✕</button>
        </div>
      </div>
      <div class="hb-item-inhoud">${werkbladHTML}</div>
      <div class="hb-item-toevoeg-balk">
        <button class="hb-knop-toevoeg-woord" data-item-id="${item.id}" type="button" title="Voeg een woord toe aan deze oefening">
          ➕ Voeg woord toe
        </button>
        <button class="hb-knop-reset-woorden" data-item-id="${item.id}" type="button" title="Reset alle verwijderde woorden">
          🔄 Reset
        </button>
      </div>
    </div>`;
  }

  /* ----- Render één pagina ----- */
  function _renderPagina(items, paginaNr, totaalPaginas, startNummer) {
    const isEerste = paginaNr === 1;
    
    const titelAlignClass = state.titelGecentreerd ? "hb-titel-center" : "";
    const headerHTML = isEerste ? `
      <div class="hb-pagina-header">
        <div class="hb-naam-rij">
          <span>Naam: </span><span class="hb-lijn-vrij"></span>
          <span>Datum: </span><span class="hb-lijn-vrij hb-lijn-vrij-kort"></span>
        </div>
        <h1 class="hb-boekje-titel ${titelAlignClass}">${state.titel}</h1>
      </div>` : "";
    
    let itemsHTML = "";
    let n = startNummer;
    for (const item of items) {
      itemsHTML += _renderItem(item, n);
      n++;
    }
    
    return `<div class="hb-pagina" data-pagina="${paginaNr}">
      ${headerHTML}
      <div class="hb-pagina-inhoud">${itemsHTML}</div>
      <div class="hb-pagina-voet">
        <span>www.jufzisa.be — Juf Zisa's spellinggenerator</span>
        <span class="hb-paginanr">${paginaNr} / ${totaalPaginas}</span>
      </div>
    </div>`;
  }

  /* Idempotente helper: injecteert stijlregels voor de titel-rij + 
     centreer-knop één keer in <head>. Doet niets als ze er al staan. */
  function _zorgVoorTitelStijlen() {
    if (document.getElementById("hb-titel-stijlen")) return;
    const stijl = document.createElement("style");
    stijl.id = "hb-titel-stijlen";
    stijl.textContent = `
      .hb-titel-rij {
        display: flex;
        align-items: center;
        gap: 12px;
        position: relative;
      }
      .hb-titel-rij.hb-titel-center {
        justify-content: center;
      }
      .hb-titel-rij.hb-titel-center .hb-titel-align-knop {
        position: absolute;
        right: 0;
      }
      .hb-boekje-titel.hb-titel-center {
        text-align: center;
      }
      .hb-boekje-titel[contenteditable="true"] {
        cursor: text;
        outline: 1px dashed transparent;
        outline-offset: 4px;
        padding: 2px 6px;
        border-radius: 3px;
        transition: outline-color 0.15s, background 0.15s;
      }
      .hb-boekje-titel[contenteditable="true"]:hover {
        outline-color: #b0b0b0;
        background: rgba(0,0,0,0.02);
      }
      .hb-boekje-titel[contenteditable="true"]:focus {
        outline: 2px solid #5b9bd5;
        outline-offset: 4px;
        background: #fff;
      }
      .hb-titel-align-knop {
        font-size: 12px;
        padding: 4px 10px;
        background: #f0f0f3;
        border: 1px solid #c0c0c8;
        border-radius: 4px;
        cursor: pointer;
        color: #444;
        white-space: nowrap;
      }
      .hb-titel-align-knop:hover {
        background: #e5e5ea;
        border-color: #a0a0a8;
      }
    `;
    document.head.appendChild(stijl);
  }

  /* ----- Render volledige preview ----- 
     Nieuwe aanpak: één lange scroll-container met alle items.
     Items mogen splitsen tussen pagina's. A4-grenzen worden visueel 
     gemarkeerd zodat de leerkracht ziet waar de PDF gaat splitsen. */
  async function renderPreview() {
    const container = document.querySelector("#hb-pages");
    if (!container) return;

    if (state.items.length === 0) {
      container.innerHTML = `
        <div class="hb-leeg">
          <div class="hb-leeg-icoon">📖</div>
          <h3>Je herhalingsbundel is nog leeg</h3>
          <p>Vink in de zijbalk categorieën aan, kies een oefenvorm + niveau,
          en klik op <strong>"➕ Voeg toe aan bundel"</strong> om je eerste oefening toe te voegen.</p>
        </div>`;
      _updateNavigatie(0, 0);
      return;
    }

    // Bouw één lange container:
    //   - 1 globale header op pagina 1
    //   - Alle items na elkaar
    //   - Voettekst onderaan
    let itemsHTML = "";
    let nr = 1;
    for (const item of state.items) {
      itemsHTML += _renderItem(item, nr);
      nr++;
    }
    
    // Zorg dat onze titel-stijlen geïnjecteerd zijn (idempotent)
    _zorgVoorTitelStijlen();
    
    const titelAlignClass = state.titelGecentreerd ? "hb-titel-center" : "";
    const centreerLabel = state.titelGecentreerd ? "← Links uitlijnen" : "Centreren →";
    
    container.innerHTML = `
      <div class="hb-document">
        <div class="hb-doc-header">
          <div class="hb-naam-rij">
            <span>Naam: </span><span class="hb-lijn-vrij"></span>
            <span>Datum: </span><span class="hb-lijn-vrij hb-lijn-vrij-kort"></span>
          </div>
          <div class="hb-titel-rij ${titelAlignClass}">
            <h1 class="hb-boekje-titel" 
                contenteditable="true" 
                id="hb-titel-editable"
                title="Klik om de titel aan te passen">${state.titel}</h1>
            <button class="hb-titel-align-knop" id="hb-titel-align-knop" 
                    type="button" 
                    title="Wissel uitlijning">${centreerLabel}</button>
          </div>
        </div>
        <div class="hb-doc-inhoud">
          ${itemsHTML}
        </div>
      </div>
    `;
    
    // Listeners voor titel-bewerken + centreer-knop
    const titelEl = document.querySelector("#hb-titel-editable");
    if (titelEl) {
      titelEl.addEventListener("blur", () => {
        const nieuwe = titelEl.textContent.trim() || "Mijn herhalingsbundel";
        if (nieuwe !== state.titel) {
          state.titel = nieuwe;
          bewaar();
        }
      });
      // Enter = bevestig (blur)
      titelEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          titelEl.blur();
        }
      });
    }
    const alignKnop = document.querySelector("#hb-titel-align-knop");
    if (alignKnop) {
      alignKnop.addEventListener("click", () => {
        state.titelGecentreerd = !state.titelGecentreerd;
        bewaar();
        renderPreview();
      });
    }
    
    // Plaats A4-grens-markers (visueel zien waar PDF zou splitsen)
    await _plaatsPaginaMarkers(container);
    
    // Teken canvases
    if (window.SpellingSchrijflijnen?.tekenAlle) {
      requestAnimationFrame(() => {
        window.SpellingSchrijflijnen.tekenAlle(container);
        // Re-plaats markers na canvas-tekening want hoogtes kunnen wijzigen
        setTimeout(() => _plaatsPaginaMarkers(container), 50);
      });
    }
  }
  
  /* Plaats horizontale lijnen + paginanummer-labels op de positie waar
     de PDF zou splitsen. Respecteert page-break-avoid regels:
     - Snijdt nooit door een opdracht-blok
     - Snijdt nooit door een individuele rij
     De marker schuift omhoog naar de eerste plek waar splitsing OK is. */
  async function _plaatsPaginaMarkers(container) {
    const doc = container.querySelector(".hb-document");
    if (!doc) return;
    
    // Verwijder oude markers
    container.querySelectorAll(".hb-pagina-marker").forEach(m => m.remove());
    
    // A4 werkbare ruimte ≈ 1097px (29cm op 96dpi)
    const PAGINA_HOOGTE_PX = 1097;
    
    // Selectors voor elementen die NIET gesplitst mogen worden — moet 
    // GELIJK zijn aan PDF avoid-lijst zodat preview-markers overeenkomen
    // met echte PDF-page-breaks.
    const NIET_SPLITSBAAR = [
      // KRITIEK: opdracht-blok + eerste rij samenhouden
      ".hb-opdracht-blok", ".hb-eerste-rij-na-opdracht",
      ".hb-rooster-met-eerste-rij",
      // Uitbreidings-blokken (groene/gele kaders met "kies 1 woord..." enz)
      ".ov01-uitbreiding-container", ".ov01-zin-blok",
      ".ov07-uitbreiding-container", ".ov08-uitbreiding-container",
      ".ov09-uitbreiding-rij", ".ov10-ub-rij",
      ".weekdictee-dag-blok", ".dag-blok",
      // Individuele rijen mogen ook niet midden doorgesneden worden
      ".ov01-cel", ".ov01-rooster-rij", 
      ".ov02-rij", ".ov03-cel", ".ov04-rij", ".ov05-rij", 
      ".ov06-zin-rij", ".ov06-uitbreiding-rij",
      ".ov07-rij", ".ov08-rij", ".ov08-invul-zin",
      ".ov09-basis-cel", ".ov09-verdieping-kolom",
      ".ov10-rij", ".ov10-basis-rij",
      ".hb-item-header"
    ].join(", ");
    
    const docHoogte = doc.offsetHeight;
    const docTop = doc.offsetTop;
    
    let aantalPaginas = 1;
    let huidigePaginaOnder = PAGINA_HOOGTE_PX;
    
    while (huidigePaginaOnder < docHoogte) {
      // Vind de beste positie voor deze marker:
      // start bij huidigePaginaOnder en kijk naar boven naar elementen
      // die de grens kruisen. Schuif marker naar boven de eerste die kruist.
      let breakPositie = huidigePaginaOnder;
      
      // Vind alle niet-splitsbare elementen die de grens kruisen
      const elementen = doc.querySelectorAll(NIET_SPLITSBAAR);
      let kleinsteTopBoven = breakPositie;
      
      elementen.forEach(el => {
        const elTop = el.offsetTop + _getParentTopOffset(el, doc);
        const elBottom = elTop + el.offsetHeight;
        // Element kruist de grens?
        if (elTop < breakPositie && elBottom > breakPositie) {
          // Schuif marker naar BOVEN dit element
          if (elTop < kleinsteTopBoven) {
            kleinsteTopBoven = elTop;
          }
        }
      });
      
      // Veilig stel marker positie in
      const markerY = kleinsteTopBoven - 4;
      
      // Plaats marker
      const marker = document.createElement("div");
      marker.className = "hb-pagina-marker";
      marker.style.top = (docTop + markerY) + "px";
      marker.innerHTML = `
        <div class="hb-pagina-marker-lijn"></div>
        <div class="hb-pagina-marker-label">— Einde pagina ${aantalPaginas} / Begin pagina ${aantalPaginas + 1} —</div>
      `;
      container.appendChild(marker);
      
      aantalPaginas++;
      huidigePaginaOnder = markerY + PAGINA_HOOGTE_PX;
      
      // Veiligheidsklep tegen oneindige lus
      if (aantalPaginas > 50) break;
    }
    
    // Update navigatie-teller
    _updateNavigatie(1, aantalPaginas);
  }
  
  /* Helper: bereken totale top-offset van een element relatief aan een ancestor */
  function _getParentTopOffset(el, ancestor) {
    let offset = 0;
    let cur = el.offsetParent;
    while (cur && cur !== ancestor && cur !== document.body) {
      offset += cur.offsetTop;
      cur = cur.offsetParent;
    }
    return offset;
  }

  function _updateNavigatie(huidig, totaal) {
    const navLabel = document.querySelector("#hb-paginanr");
    const navVorig = document.querySelector("#hb-vorig");
    const navVolgend = document.querySelector("#hb-volgend");
    if (navLabel) navLabel.textContent = totaal === 0 ? "—" : `${totaal} pagina${totaal === 1 ? '' : "'s"}`;
    // Geen vorig/volgend meer — we doen scroll-to-pagina
    if (navVorig) navVorig.style.display = "none";
    if (navVolgend) navVolgend.style.display = "none";
  }

  /* ----- Publieke acties ----- */
  let _alertGetoondInTick = false;  // voorkomt dat dezelfde alert 4× verschijnt 
                                    // als voegToe in één klik meerdere keren faalt
                                    // (bv. één aanroep per aangevinkt niveau)
  
  function voegToe(ovId, niveau, aantal) {
    // Snapshot van huidige gekozen woorden + opties
    const gekozen = window._weekdictee_gekozenWoorden || [];
    if (gekozen.length === 0) {
      if (!_alertGetoondInTick) {
        _alertGetoondInTick = true;
        // Reset bij eerstvolgende microtask, zodat een volgende klik 
        // wél opnieuw een alert kan tonen.
        Promise.resolve().then(() => { _alertGetoondInTick = false; });
        alert("Vink eerst categorieën aan en open de woordenkiezer om woorden te selecteren.");
      }
      return false;
    }
    
    const zb = window.SpellingZijbalk;
    const graad = zb?.getActieveGraad ? zb.getActieveGraad() : 1;
    
    // Als aantal niet meegegeven, probeer uit zijbalk te halen
    if (!aantal && zb?.getAantalVoorNiveau) {
      aantal = zb.getAantalVoorNiveau(ovId, niveau);
    }
    
    const item = {
      id: "hb-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      ovId: ovId,
      niveau: niveau,
      graad: graad,
      aantal: aantal || null,
      gekozenWoordenSnapshot: JSON.parse(JSON.stringify(gekozen)),  // hele pool van toen
      actieveWoorden: null,    // wordt na eerste render gevuld met de daadwerkelijk getoonde woorden
      extraWoorden: [],         // woorden via ➕ toegevoegd
      verwijderdeWoorden: [],   // woorden via ✕ uitgehaald
      lijntype: (window.SpellingModusStorage || localStorage).getItem("spelling-globaal-lijntype-v1") || "type3",
      lijnhoogte: (window.SpellingModusStorage || localStorage).getItem("spelling-globaal-lijnhoogte-v1") || "middel",
      seed: Date.now() & 0xFFFFFFFF
    };
    
    state.items.push(item);
    bewaar();
    renderPreview();
    return true;
  }

  function verwijder(itemId) {
    const voor = state.items.length;
    state.items = state.items.filter(i => i.id !== itemId);
    if (state.items.length !== voor) {
      _gemetenHoogtes.delete(itemId);
      bewaar();
      renderPreview();
    }
  }

  function verplaats(itemId, richting) {
    const idx = state.items.findIndex(i => i.id === itemId);
    if (idx === -1) return;
    const nieuw = richting === "omhoog" ? idx - 1 : idx + 1;
    if (nieuw < 0 || nieuw >= state.items.length) return;
    [state.items[idx], state.items[nieuw]] = [state.items[nieuw], state.items[idx]];
    bewaar();
    renderPreview();
  }
  
  /* Verwijder één specifiek woord uit een item (bewerk-modus in preview).
     Het woord komt in item.verwijderdeWoorden zodat het bij re-render
     niet meer verschijnt. */
  function verwijderWoordVanItem(itemId, woordTekst) {
    const item = state.items.find(i => i.id === itemId);
    if (!item || !woordTekst) return;
    if (!item.verwijderdeWoorden) item.verwijderdeWoorden = [];
    if (!item.verwijderdeWoorden.includes(woordTekst)) {
      item.verwijderdeWoorden.push(woordTekst);
    }
    _gemetenHoogtes.delete(itemId);
    bewaar();
    renderPreview();
  }
  
  /* Reset alle verwijderde woorden voor een item (= toon weer alles). */
  function resetWoordenVanItem(itemId) {
    const item = state.items.find(i => i.id === itemId);
    if (!item) return;
    item.verwijderdeWoorden = [];
    _gemetenHoogtes.delete(itemId);
    bewaar();
    renderPreview();
  }
  
  /* Voeg een woord toe aan een specifiek item.
     - Als woord in verwijderdeWoorden zat → haal uit verwijderdeWoorden
       (= ongedaan maken van een ✕)
     - Anders → toevoegen aan extraWoorden array (nieuw woord) */
  function voegWoordToeAanItem(itemId, woord) {
    const item = state.items.find(i => i.id === itemId);
    if (!item || !woord) return;
    if (!item.extraWoorden) item.extraWoorden = [];
    if (!item.verwijderdeWoorden) item.verwijderdeWoorden = [];
    
    // Was dit woord eerder verwijderd? → ongedaan maken
    const verwijderdIdx = item.verwijderdeWoorden.indexOf(woord.tekst);
    if (verwijderdIdx !== -1) {
      item.verwijderdeWoorden.splice(verwijderdIdx, 1);
    } else {
      // Check of woord niet al actief is
      const inActieve = (item.actieveWoorden || []).some(w => w.tekst === woord.tekst);
      const inExtra = item.extraWoorden.some(w => w.tekst === woord.tekst);
      if (!inActieve && !inExtra) {
        item.extraWoorden.push(JSON.parse(JSON.stringify(woord)));
      }
    }
    _gemetenHoogtes.delete(itemId);
    bewaar();
    renderPreview();
  }
  
  /* Geef lijst van woorden die nu IN het item zitten. */
  function getActieveWoorden(itemId) {
    const item = state.items.find(i => i.id === itemId);
    if (!item) return [];
    const verwijderd = new Set(item.verwijderdeWoorden || []);
    const actieve = item.actieveWoorden || [];
    const extras = item.extraWoorden || [];
    return [...actieve, ...extras].filter(w => !verwijderd.has(w.tekst));
  }
  
  /* Geef lijst van woorden die beschikbaar zijn om toe te voegen.
     = snapshot - actief - extra (= overgebleven woorden uit oorspronkelijke pool)
     + verwijderdeWoorden (zodat je een verwijderd woord kan herstellen). */
  function getBeschikbareWoordenVoorItem(itemId) {
    const item = state.items.find(i => i.id === itemId);
    if (!item) return [];
    
    const snapshot = item.gekozenWoordenSnapshot || [];
    const actieveT = new Set((item.actieveWoorden || []).map(w => w.tekst));
    const extraT = new Set((item.extraWoorden || []).map(w => w.tekst));
    
    // Woorden in snapshot maar niet actief en niet extra
    const beschikbaar = [];
    const gezien = new Set();
    for (const w of snapshot) {
      if (gezien.has(w.tekst)) continue;
      if (actieveT.has(w.tekst)) continue;
      if (extraT.has(w.tekst)) continue;
      gezien.add(w.tekst);
      beschikbaar.push(w);
    }
    return beschikbaar;
  }

  function gaNaarPagina(n) {
    state.huidigePagina = n;
    bewaar();
    renderPreview();
  }

  function vorigePagina() {
    if (state.huidigePagina > 1) gaNaarPagina(state.huidigePagina - 1);
  }
  function volgendePagina() {
    state.huidigePagina++;
    bewaar();
    renderPreview();
  }

  function setBoekjeTitel(titel) {
    state.titel = titel || "Mijn herhalingsbundel";
    bewaar();
  }

  function wis() {
    if (!confirm("Weet je zeker dat je alle oefeningen uit het boekje wil wissen?")) return;
    state.items = [];
    state.huidigePagina = 1;
    _gemetenHoogtes.clear();
    bewaar();
    renderPreview();
  }

  function getItems() {
    return [...state.items];
  }

  /* ----- PDF EXPORT -----
     Bouwt alle pagina's in een verborgen container, tekent canvases,
     en exporteert via html2pdf. */
  function _renderVolledigeBundel(metOplossingen) {
    if (state.items.length === 0) return null;
    
    const paginas = _verdeelPagina(state.items);
    const totaalPaginas = paginas.length;
    
    let html = "";
    let startNummer = 1;
    for (let idx = 0; idx < paginas.length; idx++) {
      const items = paginas[idx];
      // Items renderen met metOplossingen flag
      const origMetAntw = items.map(i => i.metAntwoorden);
      items.forEach(i => { i.metAntwoorden = metOplossingen; });
      
      html += _renderPagina(items, idx + 1, totaalPaginas, startNummer);
      
      // Herstel
      items.forEach((i, j) => { i.metAntwoorden = origMetAntw[j]; });
      
      startNummer += items.length;
    }
    return html;
  }

  /* ----- Render volledige bundel voor PDF (gebruikt hb-document structuur).
     Geen aparte pagina's — html2pdf/browser splitst zelf op page-breaks. */
  function _renderVolledigeBundelDocument(metOplossingen) {
    if (state.items.length === 0) return null;
    
    let itemsHTML = "";
    let nr = 1;
    for (const item of state.items) {
      // Tijdelijk metAntwoorden flag zetten
      const origMetAntw = item.metAntwoorden;
      item.metAntwoorden = metOplossingen;
      itemsHTML += _renderItem(item, nr);
      item.metAntwoorden = origMetAntw;
      nr++;
    }
    
    const titelAlignClass = state.titelGecentreerd ? "hb-titel-center" : "";
    return `
      <div class="hb-document">
        <div class="hb-doc-header">
          <div class="hb-naam-rij">
            <span>Naam: </span><span class="hb-lijn-vrij"></span>
            <span>Datum: </span><span class="hb-lijn-vrij hb-lijn-vrij-kort"></span>
          </div>
          <h1 class="hb-boekje-titel ${titelAlignClass}">${state.titel}</h1>
        </div>
        <div class="hb-doc-inhoud">${itemsHTML}</div>
      </div>
    `;
  }
  
  async function downloadPDF(metOplossingen = false) {
    if (state.items.length === 0) {
      alert("Bundel is leeg — voeg eerst oefeningen toe.");
      return;
    }
    
    if (!window.SpellingHerhalingsbundelPDF) {
      alert("PDF-engine niet geladen. Controleer dat herhalingsbundel-pdf.js is opgenomen in index.html.");
      return;
    }
    
    const knop = document.querySelector(metOplossingen ? "#hb-download-oplossingen" : "#hb-download");
    const oudeTekst = knop ? knop.textContent : "";
    if (knop) {
      knop.textContent = "PDF maken…";
      knop.disabled = true;
    }
    
    const loader = document.createElement("div");
    loader.id = "hb-pdf-loader";
    loader.innerHTML = `
      <div class="hb-pdf-loader-box">
        <div class="hb-pdf-loader-spinner"></div>
        <h3>PDF wordt gemaakt…</h3>
        <p>Even geduld.</p>
      </div>
    `;
    document.body.appendChild(loader);
    
    const bewerkAanWas = document.body.classList.contains("hb-bewerk-aan");
    if (bewerkAanWas) document.body.classList.remove("hb-bewerk-aan");
    
    // Tijdelijk metAntwoorden vlag op alle items zetten, zodat renderPreview
    // de DOM produceert MET oplossingen erin. De PDF-engine leest de DOM,
    // dus moet die DOM ook de antwoorden bevatten.
    const origMetAntw = state.items.map(i => i.metAntwoorden);
    state.items.forEach(i => { i.metAntwoorden = metOplossingen; });
    
    try {
      await renderPreview();
      await new Promise(r => setTimeout(r, 50));
      
      const titel = (state.titel || "herhalingsbundel").replace(/[^a-z0-9 _-]/gi, "_");
      const suffix = metOplossingen ? "_oplossingen" : "";
      const bestand = `${titel}${suffix}.pdf`;
      
      // Mark items voor de PDF-engine met oplossingen-vlag
      const itemsMetOpl = state.items.map(it => ({
        ...it,
        metAntwoorden: metOplossingen
      }));
      
      await window.SpellingHerhalingsbundelPDF.download({
        items: itemsMetOpl,
        titel: state.titel || "Mijn herhalingsbundel",
        titelGecentreerd: state.titelGecentreerd === true,
        metOplossingen: metOplossingen,
        bestandsnaam: bestand
      });
    } catch (e) {
      console.error("PDF-export fout:", e);
      alert("Er ging iets mis bij PDF-export: " + e.message);
    } finally {
      // Herstel de originele metAntwoorden vlaggen en her-render
      // zodat de preview weer het kale werkblad toont.
      state.items.forEach((i, j) => { i.metAntwoorden = origMetAntw[j]; });
      await renderPreview();
      
      loader.remove();
      if (bewerkAanWas) document.body.classList.add("hb-bewerk-aan");
      if (knop) {
        knop.textContent = oudeTekst;
        knop.disabled = false;
      }
    }
  }

  function init() {
    laad();
    renderPreview();
  }

  return {
    init,
    voegToe,
    verwijder,
    verplaats,
    gaNaarPagina,
    vorigePagina,
    volgendePagina,
    setBoekjeTitel,
    wis,
    getItems,
    downloadPDF,
    renderPreview,
    verwijderWoordVanItem,
    resetWoordenVanItem,
    voegWoordToeAanItem,
    getActieveWoorden,
    getBeschikbareWoordenVoorItem
  };

})();
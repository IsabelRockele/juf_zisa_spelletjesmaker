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
        state.items = Array.isArray(obj.items) ? obj.items : [];
        state.huidigePagina = obj.huidigePagina || 1;
      } else {
        // Reset state — anders blijft vorige modus zijn data
        state.titel = "Mijn herhalingsbundel";
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
  
  /* ==========================================================
     _prepareerVoorPDF(root)
     
     De hartader van de PDF-fix. Wordt uitsluitend aangeroepen op
     een KOPIE in een verborgen container — origineel blijft onaangetast.
     
     Doet drie dingen die html2pdf zelf niet correct kan:
     
     1. Opdracht + EERSTE rij oefeningen → samen in één <div class="hb-pdf-keep">
        Wrapper heeft inline style: page-break-inside: avoid, break-inside: avoid,
        display: block. Zo blijven ze GEGARANDEERD samen op één pagina.
     
     2. Kolommen-roosters (OV9 verdieping = 3 kolommen, etc.) → elke kolom
        krijgt page-break-inside: avoid, en het hele kolommen-rooster ook.
        Daarnaast worden de flex/grid containers omgezet naar block-flow
        WAAR DAT VEILIG KAN. Specifiek: bij OV9-verdieping zetten we het 
        grid-template om zodat html2canvas elke kolom als één renderbaar
        verticaal blok ziet — niet als losse rijen die verspreid kunnen worden.
     
     3. Belangrijke flex/grid containers krijgen expliciete CSS-eigenschappen
        die html2pdf wél kan parsen, zodat page-break-avoid op kinderen werkt.
        (html2pdf negeert page-break op flex/grid items in sommige browsers.)
     ========================================================== */
  function _prepareerVoorPDF(root) {
    
    /* ---- STAP 1: Opdracht + eerste rij in één wrapper ---- */
    
    const OPDRACHT_SELECTORS = 
      ".ov01-stappen, .ov02-instructies, .ov03-instructies, " +
      ".ov04-instructies, .ov05-instructies, .ov06-instructies, " +
      ".ov07-instructies, .ov08-instructies, .ov09-instructies, " +
      ".ov10-instructies";
    
    // Rij-selectors: een "rij" is wat als eerste oefenrij telt na de opdracht.
    // Voor kolom-layouts (OV9-verdieping) is de "eerste rij" eigenlijk het 
    // hele kolommen-rooster.
    const RIJ_SELECTORS = 
      ".ov01-rooster-rij, .ov02-rij, .ov03-cel, " +
      ".ov04-rij, .ov04-rooster-rij, " +
      ".ov05-rij, .ov06-zin-rij, " +
      ".ov07-rij, .ov08-rij, .ov08-invul-zin, " +
      ".ov09-basis-cel, .ov09-verdieping-kolommen, " +
      ".ov10-rij, .ov10-basis-rij, .ov10-noteer-rij";
    
    const opdrachten = root.querySelectorAll(OPDRACHT_SELECTORS);
    
    opdrachten.forEach(opdracht => {
      // Skip als al gewrapt (defensief — mag niet 2x gebeuren)
      if (opdracht.parentElement?.classList.contains("hb-pdf-keep")) return;
      
      // Zoek eerste rij die volgt op de opdracht
      let eersteRij = null;
      let volgend = opdracht.nextElementSibling;
      
      while (volgend && !eersteRij) {
        if (volgend.matches(RIJ_SELECTORS)) {
          eersteRij = volgend;
          break;
        }
        const rijIn = volgend.querySelector(RIJ_SELECTORS);
        if (rijIn) {
          eersteRij = rijIn;
          break;
        }
        volgend = volgend.nextElementSibling;
      }
      
      if (!eersteRij) return;  // niets te koppelen
      
      // We willen opdracht + eersteRij samen in een wrapper.
      // Maar eersteRij zit mogelijk diep in een rooster-container.
      // Strategie: we wrappen de OPDRACHT en de directe parent-keten 
      // omhoog totdat we het element vinden dat een sibling is van opdracht.
      
      // Zoek het element dat:
      //  - eersteRij bevat (of IS)
      //  - direct sibling van opdracht is (in dezelfde parent)
      const opdrachtParent = opdracht.parentElement;
      if (!opdrachtParent) return;
      
      let blokNaOpdracht = eersteRij;
      while (blokNaOpdracht.parentElement && blokNaOpdracht.parentElement !== opdrachtParent) {
        blokNaOpdracht = blokNaOpdracht.parentElement;
      }
      
      // blokNaOpdracht is nu een directe sibling van opdracht (of eersteRij zelf)
      if (blokNaOpdracht.parentElement !== opdrachtParent) return;
      
      // BELANGRIJK: we mogen het rooster-blok niet helemaal in de wrapper 
      // stoppen, want dan kan het hele rooster (met 8 rijen) niet meer 
      // splitsen. We willen ALLEEN de eerste rij eruit halen en bij opdracht 
      // plaatsen, de rest van het rooster blijft buiten de wrapper.
      
      // Twee scenario's:
      // A) blokNaOpdracht IS eersteRij (rij is directe sibling) 
      //    → wrap opdracht + eersteRij samen
      // B) blokNaOpdracht is een container met eersteRij erin (en meer rijen)
      //    → wrap opdracht; eerste rij wordt visueel via ghost-anker erin 
      //      gehouden (we klonen de eerste rij naar in de wrapper en 
      //      verstoppen het origineel niet, maar we plaatsen een onsplitsbaar 
      //      duplikaat in de wrapper). Probleem: dan staat de rij 2x.
      //    BETER: we verplaatsen de eersteRij UIT het rooster naar de wrapper,
      //    en herstellen dit na PDF-export. Maar dat is in een KLOON, dus
      //    verplaatsen mag — origineel is veilig.
      
      const wrapper = document.createElement("div");
      wrapper.className = "hb-pdf-keep";
      // Inline styles — geen externe CSS nodig, werkt 100% in html2pdf
      wrapper.style.cssText = 
        "page-break-inside: avoid !important; " +
        "break-inside: avoid !important; " +
        "display: block; " +
        "width: 100%;";
      
      // Plaats wrapper voor de opdracht
      opdrachtParent.insertBefore(wrapper, opdracht);
      // Verplaats opdracht IN wrapper
      wrapper.appendChild(opdracht);
      
      if (blokNaOpdracht === eersteRij) {
        // Scenario A: rij is directe sibling — verplaats hem ook in wrapper
        wrapper.appendChild(eersteRij);
      } else {
        // Scenario B: eersteRij zit in een container met meer rijen.
        // We willen de eerste rij UIT het rooster halen om in de wrapper 
        // te plaatsen. MAAR: als het rooster een CSS grid is met een 
        // grid-template-columns van meerdere kolommen, dan crasht de 
        // grid-layout als we één cel weghalen.
        //
        // Veiligheidsregel: alleen verplaatsen als de container een 
        // simpele verticale lijst is (display: block of flex-column).
        // Bij grids met meerdere kolommen → wrap ALLEEN de opdracht, 
        // laat eersteRij staan in zijn rooster. De rooster-styling 
        // hierboven (page-break-inside: avoid op cellen + rooster) 
        // moet dan de samenhang regelen.
        
        const oudeContainer = eersteRij.parentElement;
        if (!oudeContainer || oudeContainer !== blokNaOpdracht) {
          // Diepere nesting — niet veilig. Wrap alleen opdracht.
          return;
        }
        
        const display = window.getComputedStyle(oudeContainer).display;
        const gridCols = window.getComputedStyle(oudeContainer).gridTemplateColumns;
        const isMeerKolomGrid = display === "grid" && 
          gridCols && gridCols !== "none" && 
          gridCols.includes(" "); // bevat spatie = >1 kolom
        
        if (isMeerKolomGrid) {
          // Grid met meerdere kolommen: NIET verplaatsen.
          // Wrapper bevat alleen opdracht. De grid-cellen blijven samen 
          // door de page-break-inside: avoid op de grid-container zelf 
          // (toegevoegd in stap 2 hieronder).
          return;
        }
        
        // Simpele verticale lijst: verplaats eersteRij in wrapper, 
        // bewaar styling via een mini-container met dezelfde classes.
        const miniContainer = document.createElement("div");
        miniContainer.className = oudeContainer.className;
        miniContainer.style.cssText = "min-height: 0; margin: 0;";
        wrapper.appendChild(miniContainer);
        miniContainer.appendChild(eersteRij);
      }
    });
    
    /* ---- STAP 2: Kolommen-roosters onsplitsbaar maken ---- */
    
    // OV9 verdieping heeft 3 kolommen in een grid. Elk kolom-element is 
    // op zichzelf verticaal en kan door html2pdf doorgesneden worden.
    // We forceren beide eigenschappen:
    //   - hele kolommen-rooster: page-break-inside avoid 
    //     (zodat de drie kolommen samen op één pagina blijven)
    //   - elke kolom: page-break-inside avoid 
    //     (zodat geen kolom in zichzelf gesplitst wordt — backup)
    
    const KOLOMMEN_ROOSTERS = [
      ".ov09-verdieping-kolommen",   // 3 kolommen OV9
      ".ov09-verdieping-rooster",    // wrapper eromheen
      ".ov10-vb-grid",               // OV10 verdieping grid
      ".ov10-afb-grid",              // OV10 afbeeldingen grid
    ];
    
    const KOLOM_CELLEN = [
      ".ov09-verdieping-kolom",      // individuele kolom OV9
      ".ov09-basis-cel",
      ".ov10-vb-cel",
      ".ov10-afb-cel",
    ];
    
    // Hele rooster: niet splitsen
    root.querySelectorAll(KOLOMMEN_ROOSTERS.join(", ")).forEach(el => {
      const huidigeStijl = el.getAttribute("style") || "";
      el.setAttribute("style", huidigeStijl + 
        "; page-break-inside: avoid !important;" +
        " break-inside: avoid !important;");
    });
    
    // Individuele kolommen: ook niet splitsen (dubbele bescherming)
    root.querySelectorAll(KOLOM_CELLEN.join(", ")).forEach(el => {
      const huidigeStijl = el.getAttribute("style") || "";
      el.setAttribute("style", huidigeStijl + 
        "; page-break-inside: avoid !important;" +
        " break-inside: avoid !important;");
    });
    
    /* ---- STAP 3: Page-break regels op echte oefenrijen ---- */
    
    // Elke rij: niet middendoor splitsen
    const RIJ_BLOKKEN = [
      ".ov01-rooster-rij", ".ov01-cel", ".ov01-zin-blok",
      ".ov02-rij",
      ".ov03-cel", ".ov03-rij",
      ".ov04-rij", ".ov04-rooster-rij",
      ".ov05-rij",
      ".ov06-zin-rij", ".ov06-uitbreiding-rij",
      ".ov07-rij", ".ov07-cel", ".ov07-uitbreiding-container",
      ".ov08-rij", ".ov08-invul-zin", ".ov08-eigen-blok", 
      ".ov08-uitbreiding-container",
      ".ov09-uitbreiding-rij",
      ".ov10-rij", ".ov10-noteer-rij", ".ov10-kern-rij", 
      ".ov10-wz-rij", ".ov10-ub-rij",
      ".dag-blok"
    ];
    root.querySelectorAll(RIJ_BLOKKEN.join(", ")).forEach(el => {
      const huidigeStijl = el.getAttribute("style") || "";
      el.setAttribute("style", huidigeStijl + 
        "; page-break-inside: avoid !important;" +
        " break-inside: avoid !important;");
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
      // Roep module's genereerBlad aan met gepaste opties
      const opties = {
        graad: item.graad || 1,
        [item.ovId]: {
          niveaus: [item.niveau],
          lijntype: item.lijntype || "type3",
          lijnhoogte: item.lijnhoogte || "middel",
          ondertitel: "",
          plaatjeKern: true,
          plaatjeVerdieping: true,
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
    
    const headerHTML = isEerste ? `
      <div class="hb-pagina-header">
        <div class="hb-naam-rij">
          <span>Naam: </span><span class="hb-lijn-vrij"></span>
          <span>Datum: </span><span class="hb-lijn-vrij hb-lijn-vrij-kort"></span>
        </div>
        <h1 class="hb-boekje-titel" contenteditable="true" id="hb-titel-editable">${state.titel}</h1>
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
    
    container.innerHTML = `
      <div class="hb-document">
        <div class="hb-doc-header">
          <div class="hb-naam-rij">
            <span>Naam: </span><span class="hb-lijn-vrij"></span>
            <span>Datum: </span><span class="hb-lijn-vrij hb-lijn-vrij-kort"></span>
          </div>
          <h1 class="hb-boekje-titel">${state.titel}</h1>
        </div>
        <div class="hb-doc-inhoud">
          ${itemsHTML}
        </div>
      </div>
    `;
    
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
     de PDF zou splitsen. 
     
     NIEUWE AANPAK: we meten op een verborgen KLOON waar dezelfde 
     _prepareerVoorPDF transform op is uitgevoerd. Zo zijn de hoogtes 
     en blok-structuur identiek aan wat html2pdf gaat zien.
     
     Stap 1: kloon het document, voer _prepareerVoorPDF uit
     Stap 2: meet de positie van elk top-level kind-blok (hb-pdf-keep, 
             losse rijen, etc.) in de kloon
     Stap 3: simuleer pagina-flow: vul pagina tot blok niet meer past, 
             dan nieuwe pagina
     Stap 4: vertaal die posities terug naar het origineel (zelfde 
             y-coördinaten want kloon heeft dezelfde breedte) */
  async function _plaatsPaginaMarkers(container) {
    const doc = container.querySelector(".hb-document");
    if (!doc) return;
    
    // Verwijder oude markers
    container.querySelectorAll(".hb-pagina-marker").forEach(m => m.remove());
    
    // A4 werkbare ruimte ≈ 1097px (29cm op 96dpi)
    // Houd rekening met pdfOpties margins: top 12mm + bottom 18mm = 30mm
    // 30mm ≈ 113px → werkbare hoogte = 1123 - 113 = ~1010px
    const PAGINA_HOOGTE_PX = 1010;
    
    /* ---- Bouw verborgen kloon met dezelfde transform als PDF ---- */
    const meetKloon = doc.cloneNode(true);
    const meetWrapper = document.createElement("div");
    meetWrapper.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: ${doc.offsetWidth}px;
      visibility: hidden;
      pointer-events: none;
      z-index: -1;
    `;
    meetWrapper.appendChild(meetKloon);
    document.body.appendChild(meetWrapper);
    
    // Voer dezelfde transform uit als PDF gaat doen
    _prepareerVoorPDF(meetKloon);
    
    // Wacht 1 frame zodat layout berekend is
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    /* ---- Verzamel alle "blok-elementen" die niet gesplitst mogen 
       worden, in volgorde van top-positie ---- */
    
    // Top-level blokken: hb-pdf-keep wrappers + losse oefenrijen + 
    // hb-doc-header + uitbreidings-blokken
    const BLOK_SELECTORS = [
      ".hb-pdf-keep",
      ".hb-doc-header",
      ".hb-item-header",
      // Losse rijen die NIET in een hb-pdf-keep zitten 
      // (= rijen na de eerste rij van een oefening)
      ".ov01-rooster-rij", ".ov01-cel",
      ".ov02-rij",
      ".ov03-cel",
      ".ov04-rij", ".ov04-rooster-rij",
      ".ov05-rij",
      ".ov06-zin-rij", ".ov06-uitbreiding-rij",
      ".ov07-rij", ".ov07-cel",
      ".ov08-rij", ".ov08-invul-zin",
      ".ov09-basis-cel", ".ov09-verdieping-kolommen",
      ".ov10-rij", ".ov10-noteer-rij",
      // Uitbreidings-blokken
      ".ov01-uitbreiding-container", ".ov01-zin-blok",
      ".ov07-uitbreiding-container", ".ov08-uitbreiding-container",
      ".ov09-uitbreiding-rij", ".ov10-ub-rij",
      ".dag-blok"
    ].join(", ");
    
    const blokken = [];
    meetKloon.querySelectorAll(BLOK_SELECTORS).forEach(el => {
      // Skip blokken die binnen een ander blok zitten 
      // (anders tellen we dubbel — een hb-pdf-keep met rij erin 
      // moet als één blok tellen, niet als wrapper + rij)
      const parent = el.parentElement?.closest(BLOK_SELECTORS);
      if (parent && meetKloon.contains(parent)) return;
      
      const rect = el.getBoundingClientRect();
      const docRect = meetKloon.getBoundingClientRect();
      blokken.push({
        top: rect.top - docRect.top,
        bottom: rect.bottom - docRect.top,
        hoogte: rect.height
      });
    });
    
    // Sorteer op top-positie
    blokken.sort((a, b) => a.top - b.top);
    
    /* ---- Simuleer pagina-flow ---- */
    
    const markerPosities = [];
    let huidigeOnder = 0;       // onderkant van vorige break (= top van huidige pagina)
    let aantalPaginas = 1;
    
    for (let i = 0; i < blokken.length; i++) {
      const blok = blokken[i];
      const onderkantBlok = blok.bottom;
      const blokRelatief = blok.bottom - huidigeOnder;
      
      if (blokRelatief > PAGINA_HOOGTE_PX) {
        // Blok past niet meer op huidige pagina. 
        // Plaats marker net boven dit blok.
        const markerY = blok.top - 4;
        markerPosities.push({ y: markerY, paginaNr: aantalPaginas });
        aantalPaginas++;
        huidigeOnder = blok.top;
      }
      
      // Veiligheidsklep
      if (aantalPaginas > 50) break;
    }
    
    /* ---- Plaats markers op originele document (zelfde coordinaten) ---- */
    
    const docTop = doc.offsetTop;
    markerPosities.forEach(({ y, paginaNr }) => {
      const marker = document.createElement("div");
      marker.className = "hb-pagina-marker";
      marker.style.top = (docTop + y) + "px";
      marker.innerHTML = `
        <div class="hb-pagina-marker-lijn"></div>
        <div class="hb-pagina-marker-label">— Einde pagina ${paginaNr} / Begin pagina ${paginaNr + 1} —</div>
      `;
      container.appendChild(marker);
    });
    
    // Cleanup meet-kloon
    meetWrapper.remove();
    
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
  function voegToe(ovId, niveau, aantal) {
    // Snapshot van huidige gekozen woorden + opties
    const gekozen = window._weekdictee_gekozenWoorden || [];
    if (gekozen.length === 0) {
      alert("Vink eerst categorieën aan en open de woordenkiezer om woorden te selecteren.");
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
    
    return `
      <div class="hb-document">
        <div class="hb-doc-header">
          <div class="hb-naam-rij">
            <span>Naam: </span><span class="hb-lijn-vrij"></span>
            <span>Datum: </span><span class="hb-lijn-vrij hb-lijn-vrij-kort"></span>
          </div>
          <h1 class="hb-boekje-titel">${state.titel}</h1>
        </div>
        <div class="hb-doc-inhoud">${itemsHTML}</div>
      </div>
    `;
  }
  
  async function downloadPDF(metOplossingen = false) {
    if (typeof html2pdf === "undefined") {
      alert("PDF-bibliotheek nog aan het laden. Probeer over een paar seconden opnieuw.");
      return;
    }
    if (state.items.length === 0) {
      alert("Bundel is leeg — voeg eerst oefeningen toe.");
      return;
    }
    
    const knop = document.querySelector(metOplossingen ? "#hb-download-oplossingen" : "#hb-download");
    const oudeTekst = knop ? knop.textContent : "";
    if (knop) {
      knop.textContent = "PDF maken…";
      knop.disabled = true;
    }
    
    // Mooie laadbalk-overlay (gebruiker ziet GEEN flits van werkbladen)
    const loader = document.createElement("div");
    loader.id = "hb-pdf-loader";
    loader.innerHTML = `
      <div class="hb-pdf-loader-box">
        <div class="hb-pdf-loader-spinner"></div>
        <h3>PDF wordt gemaakt…</h3>
        <p>Even geduld, dit kan een paar seconden duren.</p>
      </div>
    `;
    document.body.appendChild(loader);
    
    await _meetItems();
    
    // Container: VOLLEDIG ONZICHTBAAR via dubbele bescherming:
    // (1) Element zelf is opacity: 0
    // (2) BOVENOP ligt de zwarte loader-overlay (z-index 100000)
    // html2canvas kan het element correct capturen omdat het in de
    // DOM staat met layout, alleen de gebruiker ziet niets door de
    // overlay erbovenop.
    const wrapper = document.createElement("div");
    wrapper.id = "hb-pdf-wrapper";
    wrapper.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 21cm;
      background: #ffffff;
      z-index: 1;
      opacity: 0.01;
      pointer-events: none;
    `;
    
    const inner = document.createElement("div");
    inner.id = "hb-pdf-inner";
    inner.style.cssText = `
      width: 21cm;
      background: #ffffff;
    `;
    inner.innerHTML = _renderVolledigeBundelDocument(metOplossingen);
    
    wrapper.appendChild(inner);
    document.body.appendChild(wrapper);
    
    // Forceer werkblad-overrides met !important
    inner.querySelectorAll(".werkblad").forEach(el => {
      el.style.setProperty("min-height", "auto", "important");
      el.style.setProperty("width", "100%", "important");
      el.style.setProperty("padding", "0", "important");
      el.style.setProperty("margin", "0", "important");
      el.style.setProperty("box-shadow", "none", "important");
      el.style.setProperty("background", "transparent", "important");
    });
    
    // Document zelf: alleen horizontale padding (top/bottom doet PDF via margin)
    inner.querySelectorAll(".hb-document").forEach(el => {
      el.style.setProperty("box-shadow", "none", "important");
      el.style.setProperty("margin", "0", "important");
      el.style.setProperty("padding", "0 1.5cm", "important");  // alleen left+right
      el.style.setProperty("width", "100%", "important");
      el.style.setProperty("box-sizing", "border-box", "important");
    });
    
    // Document-header (Naam/Datum/Titel): krappe margin top
    inner.querySelectorAll(".hb-doc-header").forEach(el => {
      el.style.setProperty("margin-top", "0", "important");
    });
    
    inner.querySelectorAll(".hb-item-acties").forEach(el => el.style.display = "none");
    inner.querySelectorAll(".hb-item-header").forEach(el => el.style.display = "none");
    inner.querySelectorAll(".hb-item").forEach(el => {
      el.style.setProperty("border", "none", "important");
      el.style.setProperty("background", "transparent", "important");
      el.style.setProperty("margin-bottom", "12px", "important");
    });
    inner.querySelectorAll(".hb-item-inhoud").forEach(el => {
      el.style.setProperty("background", "transparent", "important");
      el.style.setProperty("padding", "0", "important");
    });
    
    // KRITIEK: forceer alle werkblad-kinderen om binnen de pagina-breedte te passen
    // (anders snijdt rechts af, bv. bij OV9 horizontale layouts)
    inner.querySelectorAll(".hb-item-inhoud *").forEach(el => {
      const computed = window.getComputedStyle(el);
      // Alleen elementen die overflow zouden veroorzaken
      if (el.scrollWidth > el.clientWidth + 5) {
        el.style.setProperty("max-width", "100%", "important");
        el.style.setProperty("overflow", "visible", "important");
      }
    });
    
    // Specifiek: rooster-containers met flex/grid layout — zorg dat ze wrappen
    inner.querySelectorAll(
      ".ov09-basis-rooster, .ov09-verdieping-rooster, " +
      ".ov10-basis-rooster, .ov10-rij, .ov04-rooster"
    ).forEach(el => {
      el.style.setProperty("flex-wrap", "wrap", "important");
      el.style.setProperty("max-width", "100%", "important");
    });
    
    // Wacht op layout
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    
    // Teken canvases
    if (window.SpellingSchrijflijnen?.tekenAlle) {
      window.SpellingSchrijflijnen.tekenAlle(inner);
    }
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    // KRITIEKE FIX: bereid de DOM voor op PDF-export:
    //  (1) wrap opdracht + eerste rij in onsplitsbaar blok
    //  (2) maak kolommen-roosters (OV9 verdieping, OV10) onsplitsbaar
    //  (3) zet page-break-avoid op alle individuele oefenrijen
    // Werkt UITSLUITEND op de verborgen kopie — origineel blijft intact.
    _prepareerVoorPDF(inner);
    
    // Nog één frame wachten zodat browser de DOM-mutaties verwerkt heeft
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    const titel = (state.titel || "herhalingsbundel").replace(/[^a-z0-9_-]/gi, "_");
    const suffix = metOplossingen ? "_oplossingen" : "";
    const bestand = `${titel}${suffix}.pdf`;
    
    const pdfOpties = {
      margin: [12, 0, 18, 0],   // mm: top, right, bottom, left
      filename: bestand,
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true, 
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: {
        mode: ["css", "legacy"],
        avoid: [
          // KRITIEK: nieuwe wrapper voor opdracht + eerste rij (zie _prepareerVoorPDF)
          ".hb-pdf-keep",
          // Legacy: oude classes (mogen blijven als safety net)
          ".hb-opdracht-blok", ".hb-eerste-rij-na-opdracht", 
          ".hb-rooster-met-eerste-rij",
          // Opdracht-blokken (gele/lichtgele kaders)
          ".ov01-stappen", ".ov02-instructies", ".ov03-instructies", 
          ".ov04-instructies", ".ov05-instructies", ".ov06-instructies",
          ".ov07-instructies", ".ov08-instructies", ".ov09-instructies",
          ".ov10-instructies",
          // Uitbreidings-blokken (groene kaders)
          ".ov01-uitbreiding-container", ".ov01-zin-blok",
          ".ov07-uitbreiding-container", ".ov08-uitbreiding-container",
          ".ov09-uitbreiding-rij", ".ov10-ub-rij",
          // Individuele rijen per OV
          ".ov01-rooster-rij", ".ov01-cel",
          ".ov02-rij",
          ".ov03-cel", ".ov03-rij",
          ".ov04-rij", ".ov04-rooster-rij",
          ".ov05-rij",
          ".ov06-zin-rij", ".ov06-uitbreiding-rij",
          ".ov07-rij", ".ov07-cel",
          ".ov08-rij", ".ov08-invul-zin", ".ov08-eigen-blok",
          // OV9: KRITIEK - kolommen-rooster én individuele kolommen
          ".ov09-basis-cel", ".ov09-verdieping-kolom",
          ".ov09-basis-rooster", ".ov09-verdieping-rooster",
          ".ov09-verdieping-kolommen",
          // OV10: alle rijen én verdieping/afbeeldingen-grids
          ".ov10-rij", ".ov10-basis-rij", ".ov10-basis-noteer-rij",
          ".ov10-noteer-rij", ".ov10-kern-rij", ".ov10-wz-rij",
          ".ov10-vb-grid", ".ov10-afb-grid",
          ".ov10-vb-cel", ".ov10-afb-cel",
          // Weekdictee
          ".dag-blok"
        ]
      }
    };
    
    try {
      // Maak PDF en voeg voettekst + paginanummer per pagina toe
      const worker = html2pdf().set(pdfOpties).from(inner).toPdf();
      const pdf = await worker.get("pdf");
      
      const totaalPaginas = pdf.internal.getNumberOfPages();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Voeg voettekst + paginanummer toe op elke pagina
      for (let i = 1; i <= totaalPaginas; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(136, 136, 136);  // grijs
        // Links: website
        pdf.text("www.jufzisa.be — Juf Zisa's spellinggenerator", 15, pageHeight - 8);
        // Rechts: paginanummer
        pdf.text(`${i} / ${totaalPaginas}`, pageWidth - 15, pageHeight - 8, { align: "right" });
      }
      
      pdf.save(bestand);
    } catch (e) {
      console.error("PDF-export fout:", e);
      alert("Er ging iets mis bij PDF-export: " + e.message);
    } finally {
      wrapper.remove();
      loader.remove();
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
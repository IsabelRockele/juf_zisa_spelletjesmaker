/* ==========================================================
   zijbalk.js
   
   Beheert de nieuwe zijbalk-redesign:
   - Graad-tabs bovenaan
   - Sectie 1: hoofdgroep-categorie-selector (uitklapbaar per hoofdgroep)
   - Sectie 2: woordenkiezer-knop (toont alleen aangevinkte categorieën)
   - Sectie 3: oefenvorm-multi-select met per-oefenvorm instellingen
   
   State persistentie via localStorage:
   - actieve graad
   - aangevinkte categorieën (per graad)
   - aangevinkte oefenvormen + hun instellingen
   ========================================================== */

window.SpellingZijbalk = (function() {

  /* ---------- Constanten ---------- */
  const LS_GRAAD = "spelling-zb-graad-v1";
  const LS_CATEGORIEEN = "spelling-zb-categorieen-v1";
  const LS_OEFENVORMEN = "spelling-zb-oefenvormen-v1";

  /* Definitie van oefenvormen: id, label, ondersteunde niveaus, default settings */
  const OEFENVORMEN = [
    {
      id: "ov01", label: "📷 Schrijf bij het plaatje",
      korteUitleg: "Bekijken, herkennen en schrijven",
      niveaus: ["basis", "kern", "verdieping", "uitbreiding"],
      defaultAantal: 9
    },
    {
      id: "ov02", label: "✏️ Woord 3× overschrijven",
      korteUitleg: "Inoefenen door herhaald schrijven",
      niveaus: [],
      defaultAantal: 8
    },
    {
      id: "ov03", label: "🔀 Letters door elkaar",
      korteUitleg: "Letters ordenen tot het juiste woord",
      niveaus: ["basis", "kern", "verdieping", "uitbreiding"],
      defaultAantal: 8
    },
    {
      id: "ov04", label: "🎨 Klanken sorteren",
      korteUitleg: "Woorden vergelijken en in groepen plaatsen",
      niveaus: ["basis", "kern", "verdieping", "uitbreiding"],
      defaultAantal: 12,
      // OV4 heeft eigen runtime-detectie van klank-paren. Alleen zichtbaar
      // als minstens één geldig paar mogelijk is met de huidige selectie.
      // Géén enkelVoor want anders worden klank-groepen "specifiek" en
      // verdwijnen de andere generieke OV's uit de zijbalk.
      vereistGeldigePaar: true
    },
    {
      id: "ov05", label: "⭕ Klank kiezen",
      korteUitleg: "De ontbrekende klank herkennen",
      niveaus: ["basis", "kern", "verdieping", "uitbreiding"],
      defaultAantal: 8,
      // Werkt enkel voor specifieke klank-paren (ei/ij, au/ou, aai/ooi/oei,
      // eeuw/ieuw, verlengen). Module detecteert zelf — alleen tonen als
      // er een geldig paar mogelijk is.
      vereistGeldigePaar: true
    },
    {
      id: "ov06", label: "📝 Gebruik in zinnen",
      korteUitleg: "Woorden begrijpen en toepassen in context",
      niveaus: ["basis", "kern", "verdieping", "uitbreiding"],
      defaultAantal: 6
    },
    {
      id: "ov07", label: "🧸 Verkleinwoorden maken",
      korteUitleg: "Verkleinwoorden stap voor stap toepassen",
      niveaus: ["basis", "kern", "verdieping", "uitbreiding"],
      defaultAantal: 8,
      enkelVoor: ["verkleinwoorden"]  // toon OV alleen als deze categorie-groep aangevinkt is
    },
    {
      id: "ov08", label: "🔢 Oefenvorm enkel voor meervouden",
      korteUitleg: "Meervouden herkennen en schrijven",
      niveaus: ["basis", "kern", "verdieping", "uitbreiding"],
      defaultAantal: 8,
      enkelVoor: ["meervouden"]
    },
    {
      id: "ov09", label: "🦹 Klinkerdief: verdubbelen & verenkelen",
      korteUitleg: "De verdubbel- en verenkelregel toepassen",
      niveaus: ["basis", "kern", "verdieping", "uitbreiding"],
      defaultAantal: 8,
      enkelVoor: ["stukjeswoorden"]
    },
    {
      id: "ov10", label: "🧩 Samenstellingen oefenen",
      korteUitleg: "Twee woorddelen correct samenvoegen",
      niveaus: ["basis", "kern", "verdieping", "uitbreiding"],
      defaultAantal: 6,
      enkelVoor: ["samenstellingen"]
    },
    {
      id: "ov11", label: "🔎 Doffe klank in woorddelen",
      korteUitleg: "Voor- en achtervoegsels herkennen en correct schrijven",
      niveaus: ["basis", "kern", "verdieping", "uitbreiding"],
      defaultAantal: 8,
      enkelVoor: ["doffe-klank-voorvoegsel", "doffe-klank-achtervoegsel"]
    }
    // Weekdictee staat NIET meer in de oefenvormen-lijst van de werkbladen-modus.
    // Hij heeft zijn eigen modus-knop op het startscherm en zijn eigen paneel
    // (weekdictee-paneel.js + #modus-weekdictee in index.html).
  ];

  const NIVEAU_LABELS = {
    basis: "Met veel hulp",
    kern: "Met een beetje hulp",
    verdieping: "Zelfstandig",
    uitbreiding: "Extra uitdaging"
  };

  /* Pedagogische uitleg per (OV, niveau). Wordt onder de pil getoond zodat
     de leerkracht direct ziet wat het kind op dit niveau doet en voor wie
     het geschikt is. Korte zin (10-18 woorden), tone: "wat doet het kind". */
  const NIVEAU_UITLEG = {
    ov01: {
      basis: "Kind ziet plaatje + 3 woorden. Kleurt het juiste woord en schrijft het over. Hulp om het schrijven te leren.",
      kern: "Alleen het plaatje. Kind benoemt het woord zelf en schrijft het op. Standaard-oefening.",
      verdieping: "Plaatje + 1 zin maken met dat woord. Voor wie het schrijven al vlot kan en aan zinsbouw mag oefenen.",
      uitbreiding: "Plaatje + woord + meervoud + verkleinwoord. Voor sterke spellers die woordfamilies aankunnen."
    },
    ov03: {
      basis: "Plaatje + letters door elkaar in hokjes. Kind schikt en schrijft. Plaatje helpt om het woord te vinden.",
      kern: "Geen plaatje, wel eerste letter in blauw als hint. Kind moet het woord echt kennen.",
      verdieping: "Alleen letters door elkaar, geen hint. Voor wie de woorden goed kent en zelfstandig kan zoeken.",
      uitbreiding: "Letters door elkaar + kind bedenkt zelf nog 2 woorden uit de categorie. Creatieve uitbreiding."
    },
    ov04: {
      basis: "Klanken sorteren met visuele steun (kleuren/kolommen). Kind onderscheidt de klanken.",
      kern: "Sorteren zonder kleur-hint. Kind herkent de klank zelf en plaatst het woord juist.",
      verdieping: "Meer woorden, snellere sortering. Werkt aan klankgevoeligheid.",
      uitbreiding: "Sorteren + zelf woorden bedenken bij elke klank. Voor sterke spellers."
    },
    ov05: {
      basis: "Plaatje + hokjes + lijn. Kind kiest welke klank past en schrijft het woord op. Veilige instap.",
      kern: "Geen plaatje. Kind kiest klank op basis van de uitspraak alleen.",
      verdieping: "Plaatje + lijn, kind schrijft zelfstandig met de juiste klank.",
      uitbreiding: "Plaatje + lijn, kind moet helemaal zelfstandig juist schrijven. Volledig zelfstandig niveau."
    },
    ov06: {
      basis: "Per zin een keuze uit 2 woorden. Kind kruist juiste aan en schrijft het op de lijn. Veilige instap.",
      kern: "Woordbank bovenaan, kind kiest welk woord in welke zin past. Werkt aan zinsbegrip.",
      verdieping: "Woordbank met extra woorden die niet passen. Kind moet kritisch lezen en de juiste eruit pikken.",
      uitbreiding: "Geen voorgegeven zinnen. Kind krijgt een woord en schrijft er zelf een zin mee. Voor wie zinsbouw oefent."
    },
    ov07: {
      basis: "Kind kruist juiste uitgang aan (-je, -tje of -pje) en schrijft dan het hele verkleinwoord op de lijn.",
      kern: "Grondwoord staat er, kind schrijft het verkleinwoord ernaast. Kind moet de regel zelf toepassen.",
      verdieping: "Twee richtingen door elkaar: soms grondwoord → verkleinwoord, soms andersom. Werkt het inzicht in beide richtingen.",
      uitbreiding: "Kort verhaal met onderstreepte zelfstandige naamwoorden. Kind schrijft het verhaal over en zet die woorden in verkleinvorm."
    },
    ov08: {
      basis: "Kind kruist juiste uitgang aan en schrijft het meervoud op. Hulp om de regel te leren.",
      kern: "Grondwoord staat er, kind schrijft het meervoud met een telwoord ervoor (twee, drie...).",
      verdieping: "Twee richtingen door elkaar: enkelvoud → meervoud én meervoud → enkelvoud.",
      uitbreiding: "Genummerde invul-zinnen + kind schrijft zelf 3 zinnen met meervouden. Toepassing in context."
    },
    ov09: {
      basis: "Prent of grondwoord + 2 keuzes. Kind kiest welke schrijfwijze juist is.",
      kern: "Prent of grondwoord + lijn. Kind schrijft zelf de juiste vorm.",
      verdieping: "Prenten en woordkaarten + 3 sorteerkolommen. Kind sorteert volgens de regel.",
      uitbreiding: "Kind streept de fout door en schrijft de juiste zin over. Volledige toepassing in context."
    },
    ov10: {
      basis: "Woordzoeker met plaatjes. Kind zoekt elk samengesteld woord en schrijft het onderaan op de lijn.",
      kern: "Twee plaatjes (deel + deel = samenstelling). Kind plakt de woorden aan elkaar zonder spatie en schrijft op.",
      verdieping: "Twee kolommen woorden. Kind trekt lijntjes tussen passende delen en schrijft de samenstellingen op.",
      uitbreiding: "Beschrijving lezen en zelf het samengesteld woord bedenken. Werkt aan woordenschat én spelling tegelijk."
    },
    ov11: {
      basis: "Kind kiest de juiste schrijfwijze uit drie woorden en schrijft het correcte woord over.",
      kern: "Een voor- of achtervoegsel ontbreekt. Kind kiest het juiste woorddeel en schrijft het hele woord.",
      verdieping: "Kind sorteert de gekozen woorden volgens hun voor- of achtervoegsel.",
      uitbreiding: "Kind spoort fout geschreven woorden in zinnen op en schrijft elke zin correct over."
    }
  };

  /* ---------- State ---------- */
  let actieveGraad = 1;
  let aangevinkteCategorieen = {};
  let oefenvormState = [];

  /* ---------- Helpers ---------- */

  function _defaultStateVoor(oef) {
    return {
      id: oef.id,
      aangevinkt: false,
      niveaus: new Set(oef.niveaus.length > 0 ? ["basis"] : []),
      aantal: oef.defaultAantal,
      lijntype: "type3",
      lijnhoogte: "middel",
      metPlaatje: false  // OV02-specifiek: alleen relevant voor "Woord 3x overschrijven"
    };
  }

  /* BUGFIX (kritiek): zorg dat ELKE oefenvorm uit OEFENVORMEN ook een entry
     heeft in oefenvormState. Als een nieuwe oefenvorm wordt toegevoegd
     (bv. OV07) na een release, hebben bestaande gebruikers een oude
     localStorage zonder die entry → vinkjes worden niet bewaard. */
  function _vulOntbrekendeOefenvormenAan() {
    const aanwezig = new Set(oefenvormState.map(s => s.id));
    for (const oef of OEFENVORMEN) {
      if (!aanwezig.has(oef.id)) {
        oefenvormState.push(_defaultStateVoor(oef));
      }
    }
    const geldigeIds = new Set(OEFENVORMEN.map(o => o.id));
    oefenvormState = oefenvormState.filter(s => geldigeIds.has(s.id));
  }

  function _storage() {
    return window.SpellingModusStorage || localStorage;
  }

  function laadState() {
    // Reset in-memory state — anders blijft vorige modus zijn data behouden
    aangevinkteCategorieen = {};
    oefenvormState = [];
    
    try {
      actieveGraad = parseInt(_storage().getItem(LS_GRAAD) || "1", 10);
    } catch (e) { actieveGraad = 1; }
    
    try {
      const raw = _storage().getItem(LS_CATEGORIEEN);
      if (raw) {
        const obj = JSON.parse(raw);
        for (const [graad, lijst] of Object.entries(obj)) {
          aangevinkteCategorieen[graad] = new Set(lijst);
        }
      }
    } catch (e) { /* leeg */ }
    
    try {
      const raw = _storage().getItem(LS_OEFENVORMEN);
      if (raw) {
        const lijst = JSON.parse(raw);
        oefenvormState = lijst.map(x => ({
          ...x,
          niveaus: new Set(x.niveaus || [])
        }));
      }
    } catch (e) { /* leeg */ }
    
    if (oefenvormState.length === 0) {
      oefenvormState = OEFENVORMEN.map(_defaultStateVoor);
    }
    
    _vulOntbrekendeOefenvormenAan();
    bewaarState();
  }

  function bewaarState() {
    try {
      const s = _storage();
      s.setItem(LS_GRAAD, String(actieveGraad));
      
      const catObj = {};
      for (const [g, set] of Object.entries(aangevinkteCategorieen)) {
        catObj[g] = [...set];
      }
      s.setItem(LS_CATEGORIEEN, JSON.stringify(catObj));
      
      const oefenLijst = oefenvormState.map(x => ({
        ...x,
        niveaus: [...x.niveaus]
      }));
      s.setItem(LS_OEFENVORMEN, JSON.stringify(oefenLijst));
    } catch (e) {
      console.warn("Kon zijbalk-state niet bewaren:", e);
    }
  }

  function getAangevinkteCats() {
    if (!aangevinkteCategorieen[actieveGraad]) {
      aangevinkteCategorieen[actieveGraad] = new Set();
    }
    return aangevinkteCategorieen[actieveGraad];
  }

  /* ---------- Render: hoofdgroep-categorie-selector ----------
     BUGFIX: bewaar welke <details>-elementen openstaan vóór re-render,
     en zet ze daarna weer open. */
  function renderHoofdgroepSelector() {
    const container = document.querySelector("#hoofdgroep-selector");
    if (!container) return;
    
    const wasOpen = new Set();
    container.querySelectorAll("details.zb-hoofdgroep[open]").forEach(d => {
      if (d.dataset.hoofdgroep) wasOpen.add(d.dataset.hoofdgroep);
    });
    const wasGroepOpen = new Set();
    container.querySelectorAll("details.zb-groep[open]").forEach(d => {
      const hoofdgroep = d.closest("details.zb-hoofdgroep")?.dataset.hoofdgroep;
      if (hoofdgroep && d.dataset.groep) wasGroepOpen.add(`${hoofdgroep}::${d.dataset.groep}`);
    });
    
    const wb = window.SpellingWoordenbibliotheek;
    if (!wb || !wb.graadHeeftWoorden(actieveGraad)) {
      container.innerHTML = `
        <p class="zb-leeg">
          Graad ${actieveGraad} is nog niet beschikbaar.
        </p>`;
      updateCategorieTeller();
      return;
    }
    
    const data = wb.categorieenPerHoofdgroep(actieveGraad);
    const aangevinkt = getAangevinkteCats();
    
    let html = "";
    for (const [hgId, groepen] of Object.entries(data)) {
      if (Object.keys(groepen).length === 0) continue;
      const hgLabel = wb.hoofdgroepLabels[hgId] || hgId;
      const hgUitleg = wb.hoofdgroepUitleg[hgId] || "";
      
      let totaal = 0, aanCount = 0;
      for (const cats of Object.values(groepen)) {
        for (const cat of cats) {
          totaal++;
          if (aangevinkt.has(cat.id)) aanCount++;
        }
      }
      
      // Zodra de leerkracht zelf een map heeft geopend, bewaren we precies
      // die map. Andere mappen met oudere keuzes mogen niet plots overnemen.
      const isOpen = wasOpen.size > 0 ? wasOpen.has(hgId) : aanCount > 0;
      
      html += `
        <details class="zb-hoofdgroep" data-hoofdgroep="${hgId}" ${isOpen ? 'open' : ''}>
          <summary class="zb-hg-titel">
            <span class="zb-hg-label">${hgLabel}</span>
            <span class="zb-hg-hint">open en kies</span>
            <span class="zb-hg-teller">${aanCount > 0 ? `${aanCount} gekozen` : `${totaal} ${totaal === 1 ? 'keuze' : 'keuzes'}`}</span>
          </summary>
          <div class="zb-hg-uitleg">${hgUitleg}</div>
          <div class="zb-hg-inhoud">`;
      
      let eersteGekozenGroepGeopend = false;
      for (const [groepId, cats] of Object.entries(groepen)) {
        const groepLabel = wb.groepLabels[groepId] || groepId;
        // Bepaal of alle/sommige cats van deze groep aangevinkt zijn
        let groepAan = 0;
        for (const cat of cats) if (aangevinkt.has(cat.id)) groepAan++;
        const groepAlles = groepAan === cats.length && cats.length > 0;
        const groepSome = groepAan > 0 && groepAan < cats.length;
        const groepSleutel = `${hgId}::${groepId}`;
        const groepOpen = wasGroepOpen.has(groepSleutel)
          || (wasGroepOpen.size === 0 && groepAan > 0 && !eersteGekozenGroepGeopend);
        if (groepOpen && groepAan > 0) eersteGekozenGroepGeopend = true;
        
        html += `<details class="zb-groep" data-groep="${groepId}" ${groepOpen ? 'open' : ''}>
          <summary class="zb-groep-titel">
            <span>${groepLabel}</span>
            <span class="zb-groep-teller">${groepAan > 0 ? `${groepAan} gekozen` : `${cats.length} ${cats.length === 1 ? 'keuze' : 'keuzes'}`}</span>
          </summary>
          <div class="zb-groep-keuzes">
            <label class="zb-groep-alles">
              <input type="checkbox" class="zb-groep-master" data-groep="${groepId}"
                     ${groepAlles ? 'checked' : ''}
                     ${groepSome ? 'data-indeterminate="true"' : ''}>
              <span>Hele groep kiezen</span>
            </label>
            <div class="zb-cat-rij">`;
        for (const cat of cats) {
          const checked = aangevinkt.has(cat.id);
          html += `
            <label class="zb-cat-vink ${checked ? 'aan' : ''}">
              <input type="checkbox" class="zb-cat-checkbox" 
                     data-cat="${cat.id}" ${checked ? 'checked' : ''}>
              <span>${cat.naam}</span>
              <span class="zb-cat-aantal">(${cat.woorden.length})</span>
            </label>`;
        }
        html += `</div></div></details>`;
      }
      
      html += `</div></details>`;
    }
    
    container.innerHTML = html;
    
    container.querySelectorAll('.zb-groep-master[data-indeterminate]').forEach(el => {
      el.indeterminate = true;
    });
    
    updateCategorieTeller();
    updateKeuzeSamenvatting();
    updateWoordenkiezerKnop();
  }

  function updateKeuzeSamenvatting() {
    const vak = document.querySelector("#zb-keuze-samenvatting");
    if (!vak) return;
    const gekozenIds = getAangevinkteCats();
    if (gekozenIds.size === 0) {
      vak.className = "zb-keuze-samenvatting leeg";
      vak.innerHTML = `<strong>Nog geen spellingdoel gekozen</strong><span>Open bijvoorbeeld Hoorwoorden en kies daarna een klank.</span>`;
      return;
    }

    const data = window.SpellingWoordenbibliotheek?.[`graad${actieveGraad}`] || {};
    const namen = [...gekozenIds].map(id => data[id]?.naam || id);
    const getoond = namen.slice(0, 6);
    const extra = namen.length - getoond.length;
    const woordAantal = (window._weekdictee_gekozenWoorden || []).length;
    vak.className = "zb-keuze-samenvatting gekozen";
    vak.innerHTML = `
      <div class="zb-keuze-kop"><strong>Jouw spellingdoel${namen.length === 1 ? '' : 'en'}</strong><span>${woordAantal} woorden klaar</span></div>
      <div class="zb-keuze-tags">${getoond.map(n => `<span>${n}</span>`).join("")}${extra > 0 ? `<span>+${extra} meer</span>` : ""}</div>`;
  }

  function updateCategorieTeller() {
    const aangevinkt = getAangevinkteCats();
    const teller = document.querySelector("#zb-cat-teller");
    if (teller) {
      teller.textContent = aangevinkt.size === 0 ? "" : `${aangevinkt.size} aangevinkt`;
    }
  }

  function updateWoordenkiezerKnop() {
    const knop = document.querySelector("#open-woordenkiezer");
    const info = document.querySelector("#zb-woord-info");
    const aangevinkt = getAangevinkteCats();

    // BUGFIX: zorg dat de woordenkiezer-filter wordt bijgewerkt op basis
    // van aangevinkte categorieën in zijbalk. Zo zien modules enkel
    // woorden uit categorieën die nu aan staan.
    //
    // We roepen ruimUitgevinkteOp() — die verwijdert woorden uit
    // uitgevinkte categorieën PERMANENT uit de ruwe lijst. Anders blijven
    // ze ook na uitvinken nog in de modal verschijnen bij heropenen.
    // Fallback: syncActieveWoorden() voor oudere versies.
    if (window.SpellingWoordenkiezer) {
      if (typeof window.SpellingWoordenkiezer.ruimUitgevinkteOp === "function") {
        console.log("[zijbalk] roep ruimUitgevinkteOp aan");
        window.SpellingWoordenkiezer.ruimUitgevinkteOp();
      } else if (typeof window.SpellingWoordenkiezer.syncActieveWoorden === "function") {
        console.log("[zijbalk] WARNING: ruimUitgevinkteOp niet beschikbaar — val terug op syncActieveWoorden (oude code geladen?)");
        window.SpellingWoordenkiezer.syncActieveWoorden();
      }
    }

    const aantalActief = (window._weekdictee_gekozenWoorden || []).length;
    const aantalVerborgen = (window.SpellingWoordenkiezer && typeof window.SpellingWoordenkiezer.getVerborgenAantal === "function")
      ? window.SpellingWoordenkiezer.getVerborgenAantal()
      : 0;
    
    if (knop) {
      knop.disabled = aangevinkt.size === 0;
    }
    if (info) {
      if (aangevinkt.size === 0) {
        info.textContent = "Kies eerst een categorie. Zisa selecteert daarna automatisch passende woorden.";
        info.style.color = "#888";
      } else if (aantalActief === 0 && aantalVerborgen === 0) {
        info.textContent = "Er zijn nog geen woorden gevonden. Open de woordenlijst om je keuze te controleren.";
        info.style.color = "#555";
      } else {
        let html = `<strong>${aantalActief}</strong> woord${aantalActief === 1 ? '' : 'en'} actief ✓`;
        if (aantalVerborgen > 0) {
          html += ` <span class="zb-verborgen-hint">+${aantalVerborgen} verborgen</span>`;
        }
        info.innerHTML = html;
        info.style.color = "var(--zisa-blauw, #2196F3)";
      }
    }
    const wtTeller = document.querySelector("#zb-woord-teller");
    if (wtTeller) {
      if (aantalActief === 0 && aantalVerborgen === 0) {
        wtTeller.textContent = "";
      } else if (aantalVerborgen > 0) {
        wtTeller.textContent = `${aantalActief} actief (+${aantalVerborgen})`;
      } else {
        wtTeller.textContent = `${aantalActief} woorden`;
      }
    }
  }

  /* ---------- Render: oefenvorm-selector ----------
   
     Mode-logica voor zichtbaarheid van oefenvormen:
     - Specifieke OV's (met enkelVoor: ["groep-x"]) verschijnen ALLEEN als
       een categorie met die groep aangevinkt is.
     - Generieke OV's (geen enkelVoor) verschijnen ALLEEN als minstens één
       categorie aangevinkt is die NIET tot een specifieke groep behoort.
     - Weekdictee (uitzondering): altijd zichtbaar als er ÉÉN categorie
       aangevinkt is, ongeacht type.
     
     Voorbeelden:
     - Enkel "verklein-je" aangevinkt → OV07 + weekdictee
     - Enkel "meervoud-zuiver" → OV08 + weekdictee
     - Beide bovenstaande → OV07 + OV08 + weekdictee
     - Enkel "mkm-a" → OV01-OV06 + weekdictee
     - "mkm-a" + "verklein-je" → alles (OV01-OV08 + weekdictee) */
  
  /* Helper: verzamel alle "specifieke groep"-namen uit OEFENVORMEN. */
  function _alleSpecifiekeGroepen() {
    const s = new Set();
    for (const oef of OEFENVORMEN) {
      if (oef.enkelVoor) {
        for (const g of oef.enkelVoor) s.add(g);
      }
    }
    return s;
  }
  
  /* Helper: detecteer welke "soorten" categorieën aangevinkt zijn.
     Returns { specifiekeGroepen: Set<string>, heeftGenerieke: bool } */
  function _detecteerCategorieSoorten() {
    const wb = window.SpellingWoordenbibliotheek;
    const result = { specifiekeGroepen: new Set(), heeftGenerieke: false };
    if (!wb) return result;
    const data = wb[`graad${actieveGraad}`];
    if (!data) return result;
    const aangevinkt = getAangevinkteCats();
    if (aangevinkt.size === 0) return result;
    
    const specifiekeSet = _alleSpecifiekeGroepen();
    
    // Speciale categorie-namen die naar een specifieke groep mappen
    // (omdat de normale `groep` veld te breed is)
    const SPECIALE_MAPPING = {
      "verkleinwoorden": "verkleinwoorden",
      "meervoud-en": "meervouden",
      "meervoud-s": "meervouden",
      "meervoud-verdubbel": "meervouden",
      "meervoud-verenkel": "meervouden",
      "stukjes-verdubbelen": "stukjeswoorden",
      "stukjes-verenkelen": "stukjeswoorden",
      "stukjes-geen-regel": "stukjeswoorden"
    };
    
    for (const catId of aangevinkt) {
      const cat = data[catId];
      if (!cat) continue;
      
      // Check eerst de speciale mapping
      if (SPECIALE_MAPPING[catId] && specifiekeSet.has(SPECIALE_MAPPING[catId])) {
        result.specifiekeGroepen.add(SPECIALE_MAPPING[catId]);
      } else if (specifiekeSet.has(cat.groep)) {
        result.specifiekeGroepen.add(cat.groep);
      } else {
        result.heeftGenerieke = true;
      }
    }
    return result;
  }
  
  /* Helper: bepaal of een oefenvorm zichtbaar mag zijn in de zijbalk. */
  function _isOefenvormZichtbaar(oef) {
    const soorten = _detecteerCategorieSoorten();
    const ietsAangevinkt = soorten.heeftGenerieke || soorten.specifiekeGroepen.size > 0;

    /* Graad 2 wordt doel per doel afgewerkt. Toon hier uitsluitend vormen
       die inhoudelijk klaar zijn; zo kan een bewaarde keuze uit graad 1 of
       een nog onafgewerkte categorie nooit een leeg/verkeerd blad maken. */
    if (actieveGraad === 2) {
      const gekozen = [...getAangevinkteCats()];
      const verlengDoelen = new Set(["verlengen-td-g2", "verlengen-pb-g2"]);

      if (oef.id === "ov09") {
        return soorten.specifiekeGroepen.has("stukjeswoorden");
      }

      if (oef.id === "ov07") {
        return gekozen.length > 0 && gekozen.every(id =>
          window.SpellingWoordenbibliotheek?.graad2?.[id]?.groep === "verkleinwoorden"
        );
      }

      if (oef.id === "ov08") {
        return gekozen.length > 0 && gekozen.every(id =>
          window.SpellingWoordenbibliotheek?.graad2?.[id]?.groep === "meervouden"
        );
      }

      if (oef.id === "ov11") {
        return gekozen.length > 0 && gekozen.every(id => {
          const groep = window.SpellingWoordenbibliotheek?.graad2?.[id]?.groep;
          return groep === "doffe-klank-voorvoegsel" || groep === "doffe-klank-achtervoegsel";
        });
      }

      if (oef.id === "ov04" || oef.id === "ov05") {
        // De verlengingsoefeningen zijn de eerste volledig afgewerkte
        // nieuwe oefenlijn. Andere graad-2-doelen worden later vrijgegeven.
        if (gekozen.length === 0 || !gekozen.every(id => verlengDoelen.has(id))) {
          return false;
        }
        // Ga hieronder nog door de bestaande paar-detectie, zodat de vorm
        // alleen verschijnt als de gekozen woorden werkelijk bruikbaar zijn.
      } else {
        return false;
      }
    }
    
    // Weekdictee: zichtbaar zodra er iets aangevinkt is (anders heeft het geen woorden)
    if (oef.id === "weekdictee") {
      return ietsAangevinkt || true;  // altijd zichtbaar, zonder cats werkt het toch niet
    }
    
    // Specifieke OV (heeft enkelVoor): toon ALLEEN als bijhorende cat aangevinkt
    if (oef.enkelVoor && oef.enkelVoor.length > 0) {
      return oef.enkelVoor.some(g => soorten.specifiekeGroepen.has(g));
    }
    
    // OV met eigen detectie-logica (bv. OV4 — klank-paar-detectie):
    // vraag de module zelf of er geldige paren mogelijk zijn met de
    // huidige aangevinkte categorieën. Dit gebeurt LOSGEKOPPELD van
    // de specifiek/generiek-classificatie, anders breken andere OV's.
    if (oef.vereistGeldigePaar) {
      const module = window.SpellingModules?.[oef.id];
      if (module && typeof module._detecteerParen === "function") {
        // Bouw een fictieve woordenpool op basis van aangevinkte cats
        // (genoeg voor detectie — de echte pool heeft mogelijk meer/minder).
        const aangevinkt = getAangevinkteCats();
        if (aangevinkt.size === 0) return false;
        const wb = window.SpellingWoordenbibliotheek;
        const data = wb?.["graad" + actieveGraad] || {};
        const fictievePool = [];
        for (const catId of aangevinkt) {
          const cat = data[catId];
          if (!cat || !cat.woorden) continue;
          // Neem alle woorden van die categorie (voor d/t/b/p-detectie
          // is het exacte woord belangrijk, niet alleen het bestaan ervan).
          for (const w of cat.woorden) {
            fictievePool.push({ ...w, categorie: catId, leerjaar: actieveGraad });
          }
        }
        const paren = module._detecteerParen(fictievePool, actieveGraad);
        return paren.length > 0;
      }
      // Module heeft geen detectie-functie → val terug op generieke logica
    }
    
    // Generieke OV (geen enkelVoor): toon ALLEEN als er minstens één
    // generieke cat aangevinkt is (anders is er geen woordpool voor OV01-06).
    // Zonder gekozen spellingdoel tonen we nog geen oefeningen.
    if (!ietsAangevinkt) return false;
    return soorten.heeftGenerieke;
  }
  
  function renderOefenvormen() {
    const container = document.querySelector("#oefenvorm-selector");
    if (!container) return;
    
    let html = "";
    for (const oef of OEFENVORMEN) {
      // Skip oefenvormen die niet bij de aangevinkte categorieën horen
      if (!_isOefenvormZichtbaar(oef)) {
        // Vink ook automatisch uit zodat hij niet stiekem aan blijft staan
        const state = oefenvormState.find(s => s.id === oef.id);
        if (state && state.aangevinkt) {
          state.aangevinkt = false;
        }
        continue;
      }
      
      let state = oefenvormState.find(s => s.id === oef.id);
      if (!state) {
        state = _defaultStateVoor(oef);
        oefenvormState.push(state);
      }
      
      const aan = state.aangevinkt || false;
      const beschikbareNiveaus = oef.niveaus;
      
      html += `
        <details class="zb-oefenvorm ${aan ? 'aan' : ''}" data-oef="${oef.id}" ${aan ? 'open' : ''}>
          <summary class="zb-oef-titel">
            <input type="checkbox" class="zb-oef-checkbox" data-oef="${oef.id}" ${aan ? 'checked' : ''}>
            <span class="zb-oef-tekst"><span class="zb-oef-label">${oef.label}</span><span class="zb-oef-kort">${oef.korteUitleg || ''}</span></span>
          </summary>
          <div class="zb-oef-instel">`;
      
      if (beschikbareNiveaus.length > 0) {
        // Check of we in herhalings-modus zijn (dan: aantal-input per niveau,
        // ipv één globale aantal-input voor de hele OV)
        const inHerhalingsModus = document.querySelector("#modus-herhaling")?.style.display !== "none"
          && document.querySelector("#modus-herhaling") !== null;
        
        // Lees max per niveau uit module (voor placeholder-hint)
        const maxPerNiveau = window.SpellingModules?.[oef.id]?._maxPerNiveau || {};
        
        html += `<div class="zb-oef-rij"><label>Niveau(s):</label><div class="zb-oef-niveaus">`;
        for (const niv of beschikbareNiveaus) {
          const ningevinkt = state.niveaus && state.niveaus.has(niv);
          
          // Aantal-input alleen in herhalings-modus + alleen als niveau aangevinkt
          let aantalInputHTML = "";
          if (inHerhalingsModus && ningevinkt) {
            const huidig = state.aantalPerNiveau?.[niv] || "";
            const maxHint = maxPerNiveau[niv] || oef.defaultAantal || 12;
            aantalInputHTML = `
              <input type="number" class="zb-niveau-aantal" 
                     data-oef="${oef.id}" data-niveau="${niv}"
                     min="1" max="30" 
                     value="${huidig}"
                     placeholder="max ${maxHint}"
                     title="Aantal woorden (leeg = max ${maxHint})">`;
          }
          
          html += `
            <div class="zb-niveau-rij">
              <label class="zb-niveau-vink ${ningevinkt ? 'aan' : ''}">
                <input type="checkbox" class="zb-niveau-cb" 
                       data-oef="${oef.id}" data-niveau="${niv}" ${ningevinkt ? 'checked' : ''}>
                <div class="zb-niveau-tekst">
                  <span class="zb-niveau-label">${NIVEAU_LABELS[niv]}</span>
                  ${NIVEAU_UITLEG[oef.id]?.[niv] ? `<span class="zb-niveau-uitleg">${NIVEAU_UITLEG[oef.id][niv]}</span>` : ''}
                </div>
              </label>
              ${aantalInputHTML}
            </div>`;
        }
        html += `</div></div>`;
      }
      
      // Voor herhalings-modus: skip de standaard "Aantal woorden" en "info"-regel
      // (we gebruiken nu per-niveau inputs hierboven)
      const inHerhalingsModusCheck = document.querySelector("#modus-herhaling")?.style.display !== "none"
        && document.querySelector("#modus-herhaling") !== null;
      
      // Toon de "Aantal woorden"-input alleen als de OV geen vaste
      // maxima per niveau heeft. OV10 heeft _maxPerNiveau gedefinieerd
      // → automatisch op max per niveau, geen handmatige keuze nodig.
      // Verwijderen + 1-erbij gebeurt op het werkblad zelf.
      const heeftVastePlafonds = !!window.SpellingModules?.[oef.id]?._maxPerNiveau;
      if (!inHerhalingsModusCheck && oef.id !== "weekdictee" && !heeftVastePlafonds) {
        html += `
          <div class="zb-oef-rij">
            <label>Aantal woorden:</label>
            <input type="number" class="zb-oef-aantal" data-oef="${oef.id}" 
                   min="3" max="20" value="${state.aantal || oef.defaultAantal}">
          </div>`;
      } else if (!inHerhalingsModusCheck && heeftVastePlafonds && oef.id !== "weekdictee") {
        // Korte info-regel voor de leerkracht zodat zij weet dat het
        // aantal automatisch geregeld wordt.
        html += `
          <div class="zb-oef-rij zb-oef-info">
            <small>Aantal woorden: automatisch (verwijder met ✕, voeg toe met ➕ op het werkblad).</small>
          </div>`;
      }
      
      // OV02: plaatje-toggle (alleen relevant voor OV02 — "Woord 3x overschrijven")
      // Default uit; leerkracht kan aanvinken om plaatje bij elk woord te tonen
      if (oef.id === "ov02") {
        const metPlaatje = state.metPlaatje === true;  // default false
        html += `
          <div class="zb-oef-rij zb-oef-plaatje">
            <label class="zb-oef-toggle">
              <input type="checkbox" class="zb-ov02-met-plaatje" 
                     data-oef="${oef.id}" ${metPlaatje ? 'checked' : ''}>
              <span>Plaatje tonen bij elk woord</span>
            </label>
          </div>`;
      }
      
      // OV04: extra kleurpickers voor korte / lange / andere klanken
      // (alleen relevant voor het korte-lange-andere paar; andere paren
      // gebruiken vaste kleuren).
      if (oef.id === "ov04" && window.SpellingModules?.ov04) {
        const k = window.SpellingModules.ov04._leesKleuren();
        html += `
          <div class="zb-oef-rij zb-oef-kleuren">
            <label>Kleuren <small>(korte/lange/andere)</small>:</label>
            <div class="zb-ov04-kleuren">
              <label class="zb-ov04-kleur-cel" title="Korte klank">
                <input type="color" class="zb-ov04-kleur-input" data-sleutel="kort" value="${k.kort}">
                <span>● kort</span>
              </label>
              <label class="zb-ov04-kleur-cel" title="Lange klank">
                <input type="color" class="zb-ov04-kleur-input" data-sleutel="lang" value="${k.lang}">
                <span>▬ lang</span>
              </label>
              <label class="zb-ov04-kleur-cel" title="Andere klank">
                <input type="color" class="zb-ov04-kleur-input" data-sleutel="ander" value="${k.ander}">
                <span>★ ander</span>
              </label>
              <button class="zb-ov04-kleur-reset" type="button" title="Standaard kleuren herstellen">↺</button>
            </div>
          </div>`;
      }
      
      // Schrijflijn-hoogte zit nu globaal in sectie 4, niet meer per OV.
      
      html += `</div></details>`;
    }
    
    if (!html) {
      const heeftDoel = getAangevinkteCats().size > 0;
      html = heeftDoel
        ? `<div class="zb-oef-leeg"><strong>Voor dit spellingdoel is nog geen oefening beschikbaar</strong><span>Zisa toont een oefenvorm pas wanneer die volledig is afgewerkt en getest.</span></div>`
        : `<div class="zb-oef-leeg"><strong>Kies eerst een spellingdoel</strong><span>Daarna toont Zisa alleen de oefeningen die daarbij passen.</span></div>`;
    }
    container.innerHTML = html;
    updateOefenvormTeller();
  }

  function updateOefenvormTeller() {
    const teller = document.querySelector("#zb-oef-teller");
    const aantalAan = oefenvormState.filter(s => s.aangevinkt).length;
    if (teller) {
      teller.textContent = aantalAan === 0 ? "" : `${aantalAan} actief`;
    }
  }

  /* Helper: vind state, maak hem aan als ontbrekend (safety net) */
  function _getOrCreateState(oefId) {
    let state = oefenvormState.find(s => s.id === oefId);
    if (!state) {
      const oef = OEFENVORMEN.find(o => o.id === oefId);
      if (oef) {
        state = _defaultStateVoor(oef);
        oefenvormState.push(state);
      }
    }
    return state;
  }

  /* ---------- Event handlers ---------- */
  function bedraadEvents() {
    document.querySelectorAll(".graad-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        if (tab.disabled) return;
        document.querySelectorAll(".graad-tab").forEach(t => t.classList.remove("actief"));
        tab.classList.add("actief");
        actieveGraad = parseInt(tab.dataset.graad, 10);
        const legacy = document.querySelector(".graad-knop[data-graad='" + actieveGraad + "']");
        if (legacy) {
          document.querySelectorAll(".graad-knop").forEach(b => b.classList.remove("actief"));
          legacy.classList.add("actief");
        }
        bewaarState();
        selecteerWoordenVoorHuidigeKeuze();
        renderHoofdgroepSelector();
        renderOefenvormen();  // OV07 in/uit bij graad-wissel
        window.dispatchEvent(new CustomEvent("spelling:doel-gewijzigd"));
      });
    });
    
    document.querySelector("#hoofdgroep-selector")?.addEventListener("change", (e) => {
      if (e.target.matches(".zb-cat-checkbox")) {
        const catId = e.target.dataset.cat;
        const set = getAangevinkteCats();
        if (e.target.checked) set.add(catId);
        else set.delete(catId);
        window.SpellingWoordenkiezer?.selecteerCategorieenAutomatisch?.(set, actieveGraad);
        bewaarState();
        renderHoofdgroepSelector();
        renderOefenvormen();  // OV07 in/uit op basis van verkleinwoord-cats
        window.dispatchEvent(new CustomEvent("spelling:doel-gewijzigd"));
      }
      else if (e.target.matches(".zb-hg-master")) {
        const hgId = e.target.dataset.hoofdgroep;
        const wb = window.SpellingWoordenbibliotheek;
        const data = wb.categorieenPerHoofdgroep(actieveGraad);
        const set = getAangevinkteCats();
        const groepen = data[hgId] || {};
        for (const cats of Object.values(groepen)) {
          for (const cat of cats) {
            if (e.target.checked) set.add(cat.id);
            else set.delete(cat.id);
          }
        }
        window.SpellingWoordenkiezer?.selecteerCategorieenAutomatisch?.(set, actieveGraad);
        bewaarState();
        renderHoofdgroepSelector();
        renderOefenvormen();
        window.dispatchEvent(new CustomEvent("spelling:doel-gewijzigd"));
      }
      // Nieuwe handler: groep-master vinkje (bv. "Korte klanken", "Tweeklanken")
      // togglet alle categorieën van die groep tegelijk.
      else if (e.target.matches(".zb-groep-master")) {
        const groepId = e.target.dataset.groep;
        const wb = window.SpellingWoordenbibliotheek;
        const data = wb.categorieenPerHoofdgroep(actieveGraad);
        const set = getAangevinkteCats();
        // Zoek alle cats in deze groep (binnen alle hoofdgroepen, voor het geval)
        for (const groepen of Object.values(data)) {
          const cats = groepen[groepId];
          if (!cats) continue;
          for (const cat of cats) {
            if (e.target.checked) set.add(cat.id);
            else set.delete(cat.id);
          }
        }
        window.SpellingWoordenkiezer?.selecteerCategorieenAutomatisch?.(set, actieveGraad);
        bewaarState();
        renderHoofdgroepSelector();
        renderOefenvormen();
        window.dispatchEvent(new CustomEvent("spelling:doel-gewijzigd"));
      }
    });

    // Compacte accordeon: houd per niveau maar één keuzemap open. Zo blijft
    // de zijbalk kort, ook bij de uitgebreide hoorwoordencategorieën.
    document.querySelector("#hoofdgroep-selector")?.addEventListener("toggle", (e) => {
      const geopend = e.target;
      if (!(geopend instanceof HTMLDetailsElement) || !geopend.open) return;
      if (geopend.classList.contains("zb-hoofdgroep")) {
        document.querySelectorAll("#hoofdgroep-selector > details.zb-hoofdgroep[open]").forEach(d => {
          if (d !== geopend) d.open = false;
        });
      } else if (geopend.classList.contains("zb-groep")) {
        geopend.parentElement?.querySelectorAll(":scope > details.zb-groep[open]").forEach(d => {
          if (d !== geopend) d.open = false;
        });
      }
    }, true);
    
    document.querySelector("#open-woordenkiezer")?.addEventListener("click", () => {
      if (window.SpellingWoordenkiezer) {
        window._zb_aangevinkteCategorieen = getAangevinkteCats();
        window.SpellingWoordenkiezer.open();
      }
    });
    
    document.querySelector("#oefenvorm-selector")?.addEventListener("change", (e) => {
      if (e.target.matches(".zb-oef-checkbox")) {
        const oefId = e.target.dataset.oef;
        const state = _getOrCreateState(oefId);
        if (state) {
          // Een volledig werkblad vertrekt vanuit één oefenvorm. Binnen die
          // oefenvorm kan de leerkracht wel meerdere niveaus tegelijk kiezen
          // voor een differentiatiepakket. In een werkboekje blijven meerdere
          // korte oefenvormen tegelijk mogelijk.
          if (e.target.checked && document.body.classList.contains("modus-actief-werkblad")) {
            oefenvormState.forEach(s => {
              if (s.id !== oefId) s.aangevinkt = false;
            });
          }
          state.aangevinkt = e.target.checked;
          bewaarState();
          renderOefenvormen();
          syncLegacyCatKnop();
        }
      }
      else if (e.target.matches(".zb-niveau-cb")) {
        const oefId = e.target.dataset.oef;
        const niv = e.target.dataset.niveau;
        const state = _getOrCreateState(oefId);
        if (state) {
          if (e.target.checked) {
            state.niveaus.add(niv);
            // UX: als jij een niveau aanvinkt, betekent dat dat je deze
            // oefenvorm wilt gebruiken. Vink hem dus automatisch aan.
            if (!state.aangevinkt) {
              state.aangevinkt = true;
              bewaarState();
              renderOefenvormen();  // re-render om het hele blok geopend te tonen
              return;
            }
          } else {
            state.niveaus.delete(niv);
            // Als geen enkel niveau meer aangevinkt is, oefenvorm zelf ook uit.
            if (state.niveaus.size === 0 && state.aangevinkt) {
              state.aangevinkt = false;
              bewaarState();
              renderOefenvormen();
              return;
            }
          }
          bewaarState();
          // In herhalings-modus: re-render zodat aantal-input zichtbaar wordt/verdwijnt
          const inHerhMode = document.querySelector("#modus-herhaling")?.style.display !== "none"
            && document.querySelector("#modus-herhaling") !== null;
          if (inHerhMode) {
            renderOefenvormen();
          } else {
            // Werkblad-modus: alleen visueel de label toggelen
            const lbl = e.target.closest(".zb-niveau-vink");
            if (lbl) lbl.classList.toggle("aan", e.target.checked);
          }
        }
      }
      else if (e.target.matches(".zb-oef-aantal")) {
        const oefId = e.target.dataset.oef;
        const state = _getOrCreateState(oefId);
        if (state) {
          state.aantal = parseInt(e.target.value, 10) || state.aantal;
          bewaarState();
        }
      }
      // Per-niveau aantal-input (alleen in herhalings-modus zichtbaar)
      else if (e.target.matches(".zb-niveau-aantal")) {
        const oefId = e.target.dataset.oef;
        const niveau = e.target.dataset.niveau;
        const state = _getOrCreateState(oefId);
        if (state && niveau) {
          if (!state.aantalPerNiveau) state.aantalPerNiveau = {};
          const v = parseInt(e.target.value, 10);
          if (v && v > 0) {
            state.aantalPerNiveau[niveau] = v;
          } else {
            delete state.aantalPerNiveau[niveau];  // leeg = default
          }
          bewaarState();
        }
      }
      // OV02 plaatje-toggle: bewaar in state zodat herhalingsbundel het kan lezen
      else if (e.target.matches(".zb-ov02-met-plaatje")) {
        const oefId = e.target.dataset.oef;
        const state = _getOrCreateState(oefId);
        if (state) {
          state.metPlaatje = e.target.checked;
          bewaarState();
        }
      }
      // OV04 kleurpicker: schrijf nieuwe kleur naar OV4-module
      else if (e.target.matches(".zb-ov04-kleur-input")) {
        const sleutel = e.target.dataset.sleutel;  // "kort" / "lang" / "ander"
        const kleur = e.target.value;
        if (sleutel && window.SpellingModules?.ov04?.setKleuren) {
          window.SpellingModules.ov04.setKleuren({ [sleutel]: kleur });
        }
      }
    });

    // Bewaar het woordenaantal in een werkboekje onmiddellijk tijdens het
    // typen. Zo gaat een waarde zoals 3 niet verloren wanneer de leerkracht
    // meteen op "Voeg korte oefening toe" klikt.
    document.querySelector("#oefenvorm-selector")?.addEventListener("input", (e) => {
      if (!e.target.matches(".zb-niveau-aantal")) return;
      const oefId = e.target.dataset.oef;
      const niveau = e.target.dataset.niveau;
      const state = _getOrCreateState(oefId);
      if (!state || !niveau) return;
      if (!state.aantalPerNiveau) state.aantalPerNiveau = {};
      const v = parseInt(e.target.value, 10);
      if (v && v > 0) state.aantalPerNiveau[niveau] = v;
      else delete state.aantalPerNiveau[niveau];
      bewaarState();
    });
    
    // Reset-knop voor OV4 kleuren (click ipv change)
    document.querySelector("#oefenvorm-selector")?.addEventListener("click", (e) => {
      if (e.target.matches(".zb-ov04-kleur-reset")) {
        e.preventDefault();
        const ov4 = window.SpellingModules?.ov04;
        if (!ov4) return;
        const def = ov4._DEFAULT_KLEUREN;
        ov4.setKleuren({ ...def });
        // Re-render zodat de kleurpicker-velden ook terug op default staan
        renderOefenvormen();
      }
    });
  }

  /* Sync legacy .cat-knop.actief zodat bestaande code niet breekt. */
  function syncLegacyCatKnop() {
    const eersteAan = oefenvormState.find(s => s.aangevinkt);
    const legacy = document.querySelector("#legacy-knoppen");
    if (!legacy) return;
    const oudeKnop = legacy.querySelector(".cat-knop");
    if (oudeKnop && eersteAan) {
      oudeKnop.dataset.categorie = eersteAan.id;
    }
  }

  /* ---------- Public API ---------- */
  function getActieveGraad() {
    return actieveGraad;
  }
  
  function getAangevinkteOefenvormen() {
    return oefenvormState.filter(s => s.aangevinkt).map(s => ({
      ...s,
      niveaus: [...s.niveaus]
    }));
  }
  
  /* Geef state-object terug voor een specifieke oefenvorm (ook indien niet aangevinkt).
     Returnt null als oefenvorm niet bestaat. */
  function getOefenvormState(oefId) {
    const s = oefenvormState.find(x => x.id === oefId);
    if (!s) return null;
    return {
      ...s,
      niveaus: [...s.niveaus]
    };
  }
  
  /* Helper voor herhalings-modus: lees het gekozen aantal voor een OV+niveau.
     Retourneert null als leerkracht niets heeft ingevuld (= gebruik default). */
  function getAantalVoorNiveau(oefId, niveau) {
    const s = oefenvormState.find(x => x.id === oefId);
    if (!s || !s.aantalPerNiveau) return null;
    return s.aantalPerNiveau[niveau] || null;
  }
  
  function getAangevinkteCategorieIds() {
    return [...getAangevinkteCats()];
  }

  function selecteerWoordenVoorHuidigeKeuze() {
    window.SpellingWoordenkiezer?.selecteerCategorieenAutomatisch?.(getAangevinkteCats(), actieveGraad);
  }

  function init() {
    laadState();
    
    document.querySelectorAll(".graad-tab").forEach(t => t.classList.remove("actief"));
    const tab = document.querySelector(`.graad-tab[data-graad="${actieveGraad}"]`);
    if (tab && !tab.disabled) tab.classList.add("actief");
    else {
      actieveGraad = 1;
      document.querySelector('.graad-tab[data-graad="1"]')?.classList.add("actief");
    }
    
    selecteerWoordenVoorHuidigeKeuze();
    renderHoofdgroepSelector();
    renderOefenvormen();
    bedraadEvents();
    syncLegacyCatKnop();
    
    window.addEventListener("spelling:woorden-gewijzigd", () => {
      updateWoordenkiezerKnop();
    });
  }
  
  /* Herlaad alle state uit storage (na modus-wissel).
     Re-rendert hoofdgroep-selector + oefenvormen. */
  function herlaad() {
    laadState();
    
    // Update graad-tab visueel
    document.querySelectorAll(".graad-tab").forEach(t => t.classList.remove("actief"));
    document.querySelector(`.graad-tab[data-graad="${actieveGraad}"]`)?.classList.add("actief");
    
    selecteerWoordenVoorHuidigeKeuze();
    renderHoofdgroepSelector();
    renderOefenvormen();
    syncLegacyCatKnop();
    updateWoordenkiezerKnop();
  }
  
  /* Reset alle state (voor "Nieuwe bundel starten" in herhalingsbundel).
     Wis cats + OV + niveaus + aantal-per-niveau. Behoudt graad. */
  function reset() {
    aangevinkteCategorieen = {};
    oefenvormState = OEFENVORMEN.map(_defaultStateVoor);
    bewaarState();
    renderHoofdgroepSelector();
    renderOefenvormen();
    syncLegacyCatKnop();
    updateWoordenkiezerKnop();
  }

  /* Een nieuw volledig werkblad start met een bewuste oefenkeuze.
     Categorieën en woorden blijven behouden; alleen oude oefenvormen verdwijnen. */
  function wisOefenkeuze() {
    oefenvormState = OEFENVORMEN.map(_defaultStateVoor);
    oefenvormState.forEach(state => {
      state.aangevinkt = false;
      state.niveaus = new Set();
    });
    bewaarState();
    renderOefenvormen();
    syncLegacyCatKnop();
  }

  return {
    init,
    herlaad,
    reset,
    getActieveGraad,
    getAangevinkteOefenvormen,
    getOefenvormState,
    getAantalVoorNiveau,
    getAangevinkteCategorieIds,
    wisOefenkeuze,
    updateWoordenkiezerKnop
  };

})();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => window.SpellingZijbalk.init());
} else {
  window.SpellingZijbalk.init();
}

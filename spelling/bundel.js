/* ==========================================================
   bundel.js — Nieuwe simpele bundel-flow.
   
   Werkwijze:
   - Eén knop "Voeg toe" → werkblad wordt direct in preview gerenderd
     EN in window._bundel-lijst opgeslagen
   - Werkbladen komen onder elkaar in preview
   - Per werkblad: ✕ knop om te verwijderen (alleen zichtbaar in preview)
   - Download-knoppen filteren op data-niveau attribuut:
     * Alle werkbladen
     * Alleen basis
     * Alleen kern
     * Alleen verdieping
     * Oplossingen alles
   - "Wis bundel" maakt preview leeg
   
   Bundel zit in geheugen, verdwijnt bij refresh.
   ========================================================== */

window.SpellingBundel = {

  items: [],

  /* === Initialisatie === */
  init: function() {
    document.querySelector("#bundel-voeg-toe")?.addEventListener("click", () => this.voegToe());
    document.querySelector("#bundel-wis")?.addEventListener("click", () => {
      if (this.items.length === 0) return;
      if (confirm("Weet je zeker dat je de hele bundel wil wissen?")) {
        this.wis();
      }
    });
    document.querySelector("#download-alles")?.addEventListener("click", () => this.download(null, false));
    document.querySelector("#download-basis")?.addEventListener("click", () => this.download("basis", false));
    document.querySelector("#download-kern")?.addEventListener("click", () => this.download("kern", false));
    document.querySelector("#download-verdieping")?.addEventListener("click", () => this.download("verdieping", false));
    document.querySelector("#download-uitbreiding")?.addEventListener("click", () => this.download("uitbreiding", false));
    document.querySelector("#download-oplossingen-alles")?.addEventListener("click", () => this.download(null, true));

    this._updateUI();
  },

  /* === Voeg huidige werkblad-instellingen toe aan bundel ===
     
     Twee modi:
     1. Multi-mode (zijbalk redesign): SpellingZijbalk heeft één of meerdere
        oefenvormen aangevinkt → maak voor elke combinatie (oefenvorm × niveau)
        een apart werkblad-item.
     2. Legacy-mode: oude flow met één actieve cat-knop. */
  voegToe: function() {
    // Probeer eerst de nieuwe zijbalk-API
    const zb = window.SpellingZijbalk;
    if (zb && typeof zb.getAangevinkteOefenvormen === "function") {
      const aangevinkt = zb.getAangevinkteOefenvormen();
      if (aangevinkt.length > 0) {
        return this._voegToeMulti(aangevinkt);
      }
    }
    // Anders fallback op legacy
    return this._voegToeLegacy();
  },

  /* === Multi-mode: 1 of meer oefenvormen aangevinkt in zijbalk === */
  _voegToeMulti: function(aangevinkteOefenvormen) {
    const huidigeGekozen = window._weekdictee_gekozenWoorden || [];
    if (huidigeGekozen.length === 0) {
      alert("Nog geen woorden gekozen. Klik in de zijbalk op 'Open woordenkiezer' om woorden te selecteren.");
      return;
    }

    // Snapshot dedup via centrale helper (kip/hen + lowercase-tekst).
    // Fallback op oude lowercase-tekst-Set als SpellingDedup nog niet geladen is.
    let ontdubbeld;
    if (window.SpellingDedup) {
      ontdubbeld = window.SpellingDedup.ontdubbel(huidigeGekozen);
    } else {
      const gezien = new Set();
      ontdubbeld = [];
      for (const w of huidigeGekozen) {
        const key = (w && w.tekst) ? w.tekst.toLowerCase() : null;
        if (!key || gezien.has(key)) continue;
        gezien.add(key);
        ontdubbeld.push(w);
      }
    }
    const gekozenWoordenSnapshot = JSON.parse(JSON.stringify(ontdubbeld));
    const uniekBeschikbaar = ontdubbeld.length;

    let aantalToegevoegd = 0;

    for (const oef of aangevinkteOefenvormen) {
      const module = window.SpellingModules?.[oef.id];
      if (!module) {
        console.warn("Module niet gevonden:", oef.id);
        continue;
      }

      // Voor weekdictee: 1 item, geen niveau-loop
      if (oef.id === "weekdictee") {
        alert("Weekdictee kan niet in een gemengde bundel. Maak die apart.");
        continue;
      }

      // Voor oefenvormen ZONDER niveaus (bv ov02): één item
      const niveaus = oef.niveaus.length > 0 ? oef.niveaus : ["basis"];

      // Voor elke aangevinkte niveau: maak een apart item
      for (const niveau of niveaus) {
        const seed = (Date.now() + aantalToegevoegd * 7919) & 0xFFFFFFFF;

        // Bouw opties-object dat de module verwacht
        const opties = this._bouwOptiesVoor(oef, niveau);

        // Tekort-check: hoeveel woorden vraagt dit item, hoeveel zijn er uniek?
        // _bouwOptiesVoor zet aantalWoorden/aantalZinnen in de sub-opties.
        const sub = opties[oef.id] || {};
        const gevraagd = (oef.id === "ov06")
          ? (sub.aantalZinnen || 0)
          : (sub.aantalWoorden || 0);
        if (gevraagd > uniekBeschikbaar && window.SpellingDedup) {
          const naam = (module.naam || oef.id)
            + " " + (niveau.charAt(0).toUpperCase() + niveau.slice(1));
          window.SpellingDedup.toonTekortMelding(gevraagd, uniekBeschikbaar, naam);
        }

        const item = {
          id: "item-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
          categorie: oef.id,
          opties: opties,
          seed: seed,
          gekozenWoordenSnapshot: gekozenWoordenSnapshot,
          niveau: niveau,
          html: ""
        };

        try {
          item.html = this._renderItemHTML(item, false);
          this.items.push(item);
          aantalToegevoegd++;
        } catch (e) {
          console.error("Kon item niet renderen voor", oef.id, niveau, e);
        }
      }
    }

    if (aantalToegevoegd === 0) {
      alert("Geen werkbladen toegevoegd. Vink minstens één niveau aan per oefenvorm.");
      return;
    }

    this._renderPreview();
    this._updateUI();
  },

  /* Bouw een opties-object voor een specifieke oefenvorm + niveau,
     zodat de bestaande modules het kunnen gebruiken zoals ze gewend zijn. */
  _bouwOptiesVoor: function(oef, niveau) {
    const zb = window.SpellingZijbalk;
    const graad = zb ? zb.getActieveGraad() : 1;
    
    // Globale lijntype uit zijbalk-knop
    const lijntypeGlobaal = document.querySelector(".lijn-knop.actief")?.dataset.lijn || "vier";
    
    // Bepaal initieel aantal woorden. Als de module een _maxPerNiveau-object
    // heeft (bv. OV10), gebruik dan dat voor dit specifieke niveau —
    // zo start het werkblad altijd op zijn comfort-max. Anders val terug
    // op de zijbalk-keuze (oef.aantal).
    const moduleVoorMax = window.SpellingModules?.[oef.id];
    const maxVoorNiveau = moduleVoorMax?._maxPerNiveau?.[niveau];
    const initieelAantal = (typeof maxVoorNiveau === "number") ? maxVoorNiveau : oef.aantal;
    
    // Per-oefenvorm sub-object dat module verwacht (oef01, ov06 etc)
    const subOpties = {
      niveaus: [niveau],
      aantalWoorden: initieelAantal,
      aantalZinnen: initieelAantal,    // ov06 gebruikt zinnen
      lijnhoogte: oef.lijnhoogte || "middel",
      lijntype: oef.lijntype || "type3",
      ondertitel: ""
    };
    
    // OV02-specifiek: plaatje-toggle uit zijbalk-state
    if (oef.id === "ov02") {
      subOpties.metPlaatje = oef.metPlaatje === true;
    }
    
    return {
      categorie: oef.id,
      graad: graad,
      niveau: niveau,
      subcat: "kort",
      lijntypeGlobaal: lijntypeGlobaal,
      lijntypePerVorm: {},
      oefenvormen: [oef.id],
      [oef.id]: subOpties
    };
  },

  /* === Legacy-mode (oude flow, voor backwards-compat) === */
  _voegToeLegacy: function() {
    const actieveCat = document.querySelector(".cat-knop.actief")?.dataset.categorie;
    if (!actieveCat) {
      alert("Geen oefenvorm geselecteerd. Vink in de zijbalk minstens één oefenvorm aan.");
      return;
    }

    if (actieveCat === "weekdictee") {
      alert("Weekdictee staat niet in de bundel.");
      return;
    }

    const opties = window.SpellingGenerator?.leesOpties();
    if (!opties) {
      alert("Kan instellingen niet lezen.");
      return;
    }

    const module = window.SpellingModules?.[actieveCat];
    if (!module) {
      alert("Module niet gevonden: " + actieveCat);
      return;
    }
    
    const seed = Date.now() & 0xFFFFFFFF;
    if (window.SpellingGenerator) {
      window.SpellingGenerator._laatsteSeed = seed;
    }
    
    const huidigeGekozen = window._weekdictee_gekozenWoorden || [];
    let ontdubbeld;
    if (window.SpellingDedup) {
      ontdubbeld = window.SpellingDedup.ontdubbel(huidigeGekozen);
    } else {
      const gezien = new Set();
      ontdubbeld = [];
      for (const w of huidigeGekozen) {
        const key = (w && w.tekst) ? w.tekst.toLowerCase() : null;
        if (!key || gezien.has(key)) continue;
        gezien.add(key);
        ontdubbeld.push(w);
      }
    }
    const gekozenWoordenSnapshot = JSON.parse(JSON.stringify(ontdubbeld));

    // Tekort-check voor legacy (oude klankzuiver-flow)
    const gevraagdLegacy = opties.aantalOef || 0;
    if (gevraagdLegacy > ontdubbeld.length && window.SpellingDedup && ontdubbeld.length > 0) {
      const naam = (module.naam || actieveCat);
      window.SpellingDedup.toonTekortMelding(gevraagdLegacy, ontdubbeld.length, naam);
    }

    const item = {
      id: "item-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      categorie: actieveCat,
      opties: JSON.parse(JSON.stringify(opties)),
      seed: seed,
      gekozenWoordenSnapshot: gekozenWoordenSnapshot,
      html: ""
    };
    item.html = this._renderItemHTML(item, false);

    this.items.push(item);
    this._renderPreview();
    this._updateUI();

    // Scroll naar nieuwe werkblad
    setTimeout(() => {
      const preview = document.querySelector("#preview");
      if (preview) {
        preview.scrollTop = preview.scrollHeight;
      }
    }, 100);
  },

  /* === Verwijder één item uit bundel === */
  verwijder: function(itemId) {
    this.items = this.items.filter(i => i.id !== itemId);
    this._renderPreview();
    this._updateUI();
  },

  /* === Wis hele bundel === */
  wis: function() {
    this.items = [];
    this._renderPreview();
    this._updateUI();
  },

  /* === Download bundel-PDF (eventueel gefilterd op niveau, eventueel oplossingen) === */
  download: function(niveauFilter, metAntwoorden) {
    if (this.items.length === 0) {
      alert("Bundel is leeg.");
      return;
    }

    // Verzamel ALLE werkblad-elementen in één lijst
    const alleWerkbladen = [];
    for (const item of this.items) {
      const module = window.SpellingModules?.[item.categorie];
      if (!module) continue;
      // Gebruik _renderItemHTML zodat de gekozenWoordenSnapshot wordt gerespecteerd
      // (d.w.z. verwijderde woorden komen niet alsnog terug in de PDF).
      const itemHTML = metAntwoorden 
        ? this._renderItemHTML(item, true)
        : item.html;
      const tijdelijkDiv = document.createElement("div");
      tijdelijkDiv.innerHTML = itemHTML;
      tijdelijkDiv.querySelectorAll(".werkblad").forEach(wb => {
        // Niveau-filter
        if (niveauFilter) {
          const niv = wb.dataset.niveau;
          if (niv && niv !== niveauFilter) return;  // Skip andere niveaus
          // Geen niveau (OV02) → toelaten
        }
        alleWerkbladen.push(wb);
      });
    }

    if (alleWerkbladen.length === 0) {
      alert(`Geen werkbladen gevonden${niveauFilter ? ` voor niveau '${niveauFilter}'` : ''}.`);
      return;
    }

    // Bouw HTML met CLASS-gebaseerde page-break (zoals oude pdf-engine).
    // Eerste werkblad: geen class. Volgende werkbladen: class "pagina-break-voor".
    let bundelHTML = "";
    alleWerkbladen.forEach((wb, idx) => {
      if (idx > 0) {
        // Voeg class toe die html2pdf herkent via "before" config
        wb.classList.add("pagina-break-voor");
      }
      bundelHTML += wb.outerHTML;
    });

    this._exporteerPDF(bundelHTML, niveauFilter, metAntwoorden);
  },

  /* === Render alle items in preview === */
  _renderPreview: function() {
    const preview = document.querySelector("#preview");
    if (!preview) return;

    if (this.items.length === 0) {
      preview.innerHTML = `
        <div class="preview-leeg">
          <h3>👋 Welkom!</h3>
          <p>Stel een werkblad in en klik op <strong>"➕ Voeg toe aan bundel"</strong> om te beginnen.</p>
        </div>`;
      return;
    }

    let html = "";
    for (const item of this.items) {
      // Wikkel werkblad in een container met ✕ knop en eventueel +1 knop.
      // OV07 ⭐⭐⭐⭐ uitbreiding gebruikt een vast verhaal, geen woordenlijst → geen +1 knop.
      // OV08 ⭐⭐⭐⭐ uitbreiding idem.
      const isOV07Uitbreiding = (item.categorie === "ov07" && item.niveau === "uitbreiding");
      const isOV08Uitbreiding = (item.categorie === "ov08" && item.niveau === "uitbreiding");
      const supportsPlus1 = ["ov01", "ov02", "ov03", "ov05", "ov06", "ov07", "ov08", "ov09", "ov10"].includes(item.categorie)
                            && !isOV07Uitbreiding && !isOV08Uitbreiding;
      
      // Check of het max voor dit niveau al bereikt is. De module kan
      // een _maxPerNiveau-object hebben dat per niveau het comfort-max
      // op 1 A4 vastlegt. Als dat ontbreekt: oneindig (oude gedrag).
      let maxBereikt = false;
      let maxVoorNiveau = null;
      if (supportsPlus1) {
        const module = window.SpellingModules?.[item.categorie];
        const max = module?._maxPerNiveau?.[item.niveau];
        if (typeof max === "number") {
          maxVoorNiveau = max;
          const tellerKey = (item.categorie === "ov06") ? "aantalZinnen" : "aantalWoorden";
          const huidig = item.opties?.[item.categorie]?.[tellerKey] || 0;
          if (huidig >= max) maxBereikt = true;
        }
      }
      
      const plus1Label = item.categorie === "ov06" ? "➕ 1 zin erbij" : "➕ 1 woord erbij";
      const plus1Title = maxBereikt
        ? `Maximum bereikt (${maxVoorNiveau} per blad) — verwijder eerst een woord met ✕`
        : `Voeg 1 ${item.categorie === 'ov06' ? 'zin' : 'woord'} toe`;
      const plusKnop = supportsPlus1
        ? `<button class="bundel-item-plus-knop ${maxBereikt ? 'is-uitgegrijsd' : ''}" data-item-id="${item.id}" title="${plus1Title}" ${maxBereikt ? 'disabled' : ''}>${plus1Label}</button>`
        : "";
      html += `
        <div class="bundel-item-wrap" data-item-id="${item.id}">
          <button class="bundel-item-verwijder-knop" data-item-id="${item.id}" title="Verwijder dit werkblad">✕</button>
          ${plusKnop}
          ${item.html}
        </div>`;
    }
    preview.innerHTML = html;

    // Teken canvases
    if (window.SpellingSchrijflijnen) {
      window.SpellingSchrijflijnen.tekenAlle(preview);
    }

    // Verwijder-knoppen koppelen
    preview.querySelectorAll(".bundel-item-verwijder-knop").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.verwijder(btn.dataset.itemId);
      });
    });
    
    // +1 woord knoppen koppelen
    preview.querySelectorAll(".bundel-item-plus-knop").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.voegEenWoordToe(btn.dataset.itemId);
      });
    });
    
    // ✕ verwijder-knoppen op individuele woorden/zinnen koppelen.
    // We gebruiken event-delegation op de wrap zodat we niet voor elke knop
    // apart een listener moeten registreren — er kunnen er veel zijn.
    preview.querySelectorAll(".bundel-item-wrap").forEach(wrap => {
      const itemId = wrap.dataset.itemId;
      wrap.addEventListener("click", (e) => {
        const knop = e.target.closest(".rij-verwijder-knop");
        if (!knop) return;
        e.stopPropagation();
        const woordTekst = knop.dataset.woord;
        if (woordTekst) {
          this.verwijderWoordVanItem(itemId, woordTekst);
        }
      });
    });
  },

  /* === Voeg 1 woord/zin toe aan een specifiek bundel-item === */
  voegEenWoordToe: function(itemId) {
    const item = this.items.find(i => i.id === itemId);
    if (!item) return;
    
    const cat = item.categorie;
    const modOpties = item.opties[cat];
    if (!modOpties) {
      console.warn("Geen opties gevonden voor item:", itemId);
      return;
    }
    
    // OV06 heeft 'aantalZinnen' i.p.v. 'aantalWoorden'
    const tellerKey = (cat === "ov06") ? "aantalZinnen" : "aantalWoorden";
    if (typeof modOpties[tellerKey] !== "number") {
      console.warn(`Kan ${tellerKey} niet vinden voor item:`, itemId);
      return;
    }
    
    // Check 1: max-per-niveau van de module respecteren (als gedefinieerd)
    const module = window.SpellingModules?.[cat];
    const maxVoorNiveau = module?._maxPerNiveau?.[item.niveau];
    if (typeof maxVoorNiveau === "number" && modOpties[tellerKey] >= maxVoorNiveau) {
      // Hoort niet voor te komen want de knop is disabled, maar
      // defensief checken. Geen alert — gewoon stilletjes negeren.
      return;
    }
    
    // Check 2: zijn er nog woorden beschikbaar in de woordenkiezer?
    const beschikbaar = (window._weekdictee_gekozenWoorden || []).length;
    if (modOpties[tellerKey] >= beschikbaar) {
      const eenheid = (cat === "ov06") ? "zinnen (= woorden)" : "woorden";
      alert(`Geen extra ${eenheid} beschikbaar. Je hebt ${beschikbaar} woorden gekozen, het werkblad gebruikt er al ${modOpties[tellerKey]}. Voeg meer woorden toe in de woordenkiezer.`);
      return;
    }
    
    modOpties[tellerKey] += 1;
    
    // Voeg ook één woord aan de snapshot toe — zodat de module ALTIJD
    // de juiste pool ziet (snapshot + nieuw woord erbij). We kiezen het
    // eerste woord uit de globale pool dat nog niet in de snapshot zit.
    if (item.gekozenWoordenSnapshot && Array.isArray(item.gekozenWoordenSnapshot)) {
      const globalePool = window._weekdictee_gekozenWoorden || [];
      const snapshotTeksten = new Set(item.gekozenWoordenSnapshot.map(w => w.tekst));
      const nieuwWoord = globalePool.find(w => !snapshotTeksten.has(w.tekst));
      if (nieuwWoord) {
        item.gekozenWoordenSnapshot.push(JSON.parse(JSON.stringify(nieuwWoord)));
      }
    }
    
    if (!module) return;
    item.html = this._renderItemHTML(item, false);
    
    this._renderPreview();
  },

  /* === Verwijder één specifiek woord/zin uit een bundel-item === */
  verwijderWoordVanItem: function(itemId, woordTekst) {
    const item = this.items.find(i => i.id === itemId);
    if (!item) return;
    
    const cat = item.categorie;
    const modOpties = item.opties[cat];
    if (!modOpties) return;
    
    // Zorg dat snapshot bestaat (oude items hebben hem misschien niet)
    if (!item.gekozenWoordenSnapshot || !Array.isArray(item.gekozenWoordenSnapshot)) {
      item.gekozenWoordenSnapshot = JSON.parse(JSON.stringify(window._weekdictee_gekozenWoorden || []));
    }
    
    // Filter het woord eruit
    item.gekozenWoordenSnapshot = item.gekozenWoordenSnapshot.filter(
      w => w.tekst !== woordTekst
    );
    
    // Verlaag aantal-teller
    const tellerKey = (cat === "ov06") ? "aantalZinnen" : "aantalWoorden";
    if (typeof modOpties[tellerKey] === "number" && modOpties[tellerKey] > 0) {
      modOpties[tellerKey] -= 1;
    }
    
    // Edge case: als er niets meer overblijft, verwijder het hele item
    if (item.gekozenWoordenSnapshot.length === 0 || modOpties[tellerKey] === 0) {
      if (confirm("Dit was het laatste woord. Werkblad helemaal verwijderen?")) {
        this.verwijder(itemId);
      } else {
        // Ongedaan maken: woord teruglezen niet meer mogelijk vanuit hier,
        // dus we verhogen alleen de teller weer en hopen dat de leerkracht
        // de woordenkiezer opnieuw opent.
        modOpties[tellerKey] += 1;
      }
      return;
    }
    
    item.html = this._renderItemHTML(item, false);
    this._renderPreview();
  },

  /* === Render de HTML voor één bundel-item, met snapshot tijdelijk in plaats
       van de globale woordenpool === */
  _renderItemHTML: function(item, metAntwoorden) {
    const module = window.SpellingModules?.[item.categorie];
    if (!module) return "";
    module._seed = item.seed;
    
    // Gebruik snapshot als die bestaat, anders val terug op globale pool
    const origineel = window._weekdictee_gekozenWoorden;
    if (item.gekozenWoordenSnapshot && Array.isArray(item.gekozenWoordenSnapshot)) {
      window._weekdictee_gekozenWoorden = item.gekozenWoordenSnapshot;
    }
    
    const html = module.genereerBlad(item.opties, metAntwoorden);
    
    // Restore
    window._weekdictee_gekozenWoorden = origineel;
    return html;
  },

  /* === Update download/wis knoppen op basis van bundel-status === */
  _updateUI: function() {
    const heeftItems = this.items.length > 0;
    
    const dlAlles = document.querySelector("#download-alles");
    const dlOpl = document.querySelector("#download-oplossingen-alles");
    const wisKnop = document.querySelector("#bundel-wis");
    
    [dlAlles, dlOpl, wisKnop].forEach(b => {
      if (!b) return;
      b.classList.toggle("verborgen", !heeftItems);
    });

    // Niveau-knoppen: alleen tonen als er werkbladen van dat niveau zijn
    const niveausInBundel = new Set();
    let heeftZonderNiveau = false;
    
    for (const item of this.items) {
      const tijdelijkDiv = document.createElement("div");
      tijdelijkDiv.innerHTML = item.html;
      tijdelijkDiv.querySelectorAll(".werkblad").forEach(wb => {
        if (wb.dataset.niveau) {
          niveausInBundel.add(wb.dataset.niveau);
        } else {
          heeftZonderNiveau = true;
        }
      });
    }

    // Toon niveau-knop alleen als er een werkblad van dat niveau in zit
    // (OV02 zonder niveau telt als 'geldig voor alle niveaus' alleen als er ook niveaus aanwezig zijn)
    ["basis", "kern", "verdieping", "uitbreiding"].forEach(niv => {
      const knop = document.querySelector(`#download-${niv}`);
      if (!knop) return;
      knop.classList.toggle("verborgen", !niveausInBundel.has(niv));
    });
  },

  /* === PDF-export === */
  _exporteerPDF: function(bundelHTML, niveauFilter, metAntwoorden) {
    const preview = document.querySelector("#preview");
    if (!preview) return;
    
    // Knop disablen
    const knoppen = document.querySelectorAll(".download-knop, .download-niveau-knop");
    knoppen.forEach(k => k.disabled = true);

    // Bouw kloon van bundel-HTML (alle werkbladen direct als broers/zussen)
    const kloon = document.createElement("div");
    kloon.innerHTML = bundelHTML;

    const tijdelijk = document.createElement("div");
    tijdelijk.style.position = "absolute";
    tijdelijk.style.top = "0";
    // Zet tijdelijk OFF-SCREEN (links buiten het beeld) ipv hidden,
    // zodat layout correct berekend wordt door browser. visibility:hidden
    // kan html2pdf in de war brengen bij berekening van page-breaks.
    tijdelijk.style.left = "-99999px";
    tijdelijk.style.width = preview.offsetWidth + "px";
    tijdelijk.style.zIndex = "999999";
    tijdelijk.style.background = "#fff";
    tijdelijk.appendChild(kloon);
    document.body.appendChild(tijdelijk);

    if (window.SpellingSchrijflijnen) {
      window.SpellingSchrijflijnen.tekenAlle(kloon);
    }

    // Wacht meerdere frames + 100ms zodat:
    // 1. Browser klaar is met layout van het tijdelijke element
    // 2. Canvas-tekeningen klaar zijn met paint
    // 3. html2pdf de juiste hoogtes/posities ziet voor page-breaks
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
        const datum = new Date().toISOString().slice(0, 10);
        let suffix = "alles";
        if (niveauFilter) suffix = niveauFilter;
        if (metAntwoorden) suffix = "oplossingen";
        const naam = `spelling-bundel-${suffix}-${datum}.pdf`;

        const pdfOpties = {
          margin: 0,
          filename: naam,
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
            mode: "css",
            before: ".pagina-break-voor",
            avoid: [".werkblad", ".ov01-blad", ".ov07-blad", ".ov08-blad", ".ov09-blad", ".ov10-blad", ".weekdictee-blad", ".ov01-header", ".ov01-stappen", ".ov01-rooster-rij", ".ov01-zin-blok", ".dag-blok", ".ov07-rij", ".ov07-cel", ".ov07-uitbreiding-container", ".ov07-verhaal-origineel", ".ov08-rij", ".ov08-cel", ".ov08-uitbreiding-container", ".ov08-verhaal-origineel", ".ov09-basis-rij", ".ov09-kern-rij", ".ov09-verdieping-cel", ".ov09-uitbreiding-rij", ".ov10-header", ".ov10-noteer-rij", ".ov10-wz-rij", ".ov10-kern-rij", ".ov10-ub-rij", ".ov10-afb-grid", ".ov10-vb-grid", ".ov02-rij", ".ov03-cel"]
          }
        };

        html2pdf().set(pdfOpties).from(kloon).save().then(() => {
          tijdelijk.remove();
          knoppen.forEach(k => k.disabled = false);
        }).catch(err => {
          console.error("PDF-export mislukt:", err);
          tijdelijk.remove();
          knoppen.forEach(k => k.disabled = false);
          alert("PDF-export mislukt. Probeer opnieuw.");
        });
        }, 200);
      });
    });
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => window.SpellingBundel.init());
} else {
  window.SpellingBundel.init();
}
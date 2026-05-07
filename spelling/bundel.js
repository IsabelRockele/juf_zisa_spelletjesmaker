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

  /* === Voeg huidige werkblad-instellingen toe aan bundel === */
  voegToe: function() {
    const actieveCat = document.querySelector(".cat-knop.actief")?.dataset.categorie;
    if (!actieveCat) {
      alert("Geen oefenvorm geselecteerd.");
      return;
    }

    if (actieveCat === "weekdictee") {
      // Weekdictee staat niet in de bundel — eigen flow
      alert("Weekdictee kan niet aan een gemengde bundel worden toegevoegd. Het is al een complete reeks. Gebruik 'Download PDF' bij weekdictee zelf.");
      return;
    }

    const opties = window.SpellingGenerator?.leesOpties();
    if (!opties) {
      alert("Kan instellingen niet lezen.");
      return;
    }

    // Genereer werkblad-HTML
    const module = window.SpellingModules?.[actieveCat];
    if (!module) {
      alert("Module niet gevonden: " + actieveCat);
      return;
    }
    
    // Nieuwe seed → andere woorden voor elke "Voeg toe" klik
    const seed = Date.now() & 0xFFFFFFFF;
    if (window.SpellingGenerator) {
      window.SpellingGenerator._laatsteSeed = seed;
    }
    
    // Snapshot maken van de gekozen woorden van dit moment.
    // Bij "✕ verwijder woord" en "+1 woord erbij" werken we op deze snapshot,
    // niet op de globale woordenkiezer-pool. Zo blijft het werkblad voorspelbaar
    // ook al verandert de leerkracht later van woordenkiezer-selectie.
    const huidigeGekozen = window._weekdictee_gekozenWoorden || [];
    const gekozenWoordenSnapshot = JSON.parse(JSON.stringify(huidigeGekozen));

    // Snapshot van opties (voor latere her-render bij oplossingen of niveau-filter)
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
      // Wikkel werkblad in een container met ✕ knop en eventueel +1 knop
      const supportsPlus1 = ["ov01", "ov02", "ov03", "ov05", "ov06"].includes(item.categorie);
      const plus1Label = item.categorie === "ov06" ? "➕ 1 zin erbij" : "➕ 1 woord erbij";
      const plusKnop = supportsPlus1
        ? `<button class="bundel-item-plus-knop" data-item-id="${item.id}" title="Voeg 1 ${item.categorie === 'ov06' ? 'zin' : 'woord'} toe">${plus1Label}</button>`
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
    
    // Check of er nog woorden beschikbaar zijn in de woordenkiezer
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
    
    const module = window.SpellingModules?.[cat];
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
            avoid: [".werkblad", ".ov01-blad", ".weekdictee-blad", ".ov01-header", ".ov01-stappen", ".ov01-rooster-rij", ".ov01-zin-blok", ".dag-blok"]
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

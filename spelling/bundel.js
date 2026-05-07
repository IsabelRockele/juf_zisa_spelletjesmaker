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
    module._seed = seed;
    
    const werkbladHTML = module.genereerBlad(opties, false);

    // Snapshot van opties (voor latere her-render bij oplossingen of niveau-filter)
    const item = {
      id: "item-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      categorie: actieveCat,
      opties: JSON.parse(JSON.stringify(opties)),
      seed: seed,
      html: werkbladHTML
    };

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
      module._seed = item.seed;
      const itemHTML = metAntwoorden 
        ? module.genereerBlad(item.opties, true)
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
      // Wikkel werkblad in een container met ✕ knop
      html += `
        <div class="bundel-item-wrap" data-item-id="${item.id}">
          <button class="bundel-item-verwijder-knop" data-item-id="${item.id}" title="Verwijder dit werkblad">✕</button>
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
    ["basis", "kern", "verdieping"].forEach(niv => {
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

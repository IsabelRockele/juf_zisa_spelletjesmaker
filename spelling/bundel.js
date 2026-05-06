/* ==========================================================
   bundel.js — Verzamelt meerdere werkbladen tot één PDF.
   
   Werkwijze:
   1. Gebruiker stelt instellingen in en klikt "Vernieuw voorbeeld"
   2. Klikt "Voeg toe aan bundel" → snapshot van huidige instellingen
      wordt toegevoegd aan window._bundel
   3. Klikt "Download bundel" → alle werkbladen worden achter elkaar
      gerenderd en als één PDF gedownload
   
   Bundel zit in geheugen (window._bundel), verdwijnt bij refresh.
   ========================================================== */

window.SpellingBundel = {

  // De bundel zelf — array van item-objecten
  items: [],

  /* === Initialisatie: koppel knoppen === */
  init: function() {
    const btnToevoegen = document.querySelector("#bundel-toevoegen");
    const btnDownload  = document.querySelector("#bundel-download");
    const btnDownloadOpl = document.querySelector("#bundel-download-oplossingen");
    const btnWis       = document.querySelector("#bundel-wis");

    if (btnToevoegen) {
      btnToevoegen.addEventListener("click", () => this.voegToe());
    }
    if (btnDownload) {
      btnDownload.addEventListener("click", () => this.downloadBundel(false));
    }
    if (btnDownloadOpl) {
      btnDownloadOpl.addEventListener("click", () => this.downloadBundel(true));
    }
    if (btnWis) {
      btnWis.addEventListener("click", () => {
        if (confirm("Weet je zeker dat je de bundel wil wissen?")) {
          this.wis();
        }
      });
    }

    this._updateUI();
  },

  /* === Voeg huidige werkblad-instellingen toe aan bundel === */
  voegToe: function() {
    // Module-detectie: welke is actief?
    const actieveCat = document.querySelector(".cat-knop.actief")?.dataset.categorie;
    if (!actieveCat) {
      alert("Geen oefenvorm geselecteerd.");
      return;
    }

    // Weekdictee niet ondersteunen in bundel — die heeft eigen flow
    if (actieveCat === "weekdictee") {
      alert("Weekdictee kan niet aan een bundel worden toegevoegd. Het is al een complete reeks.");
      return;
    }

    // Lees de huidige instellingen
    const opties = window.SpellingGenerator?.leesOpties();
    if (!opties) {
      alert("Kan instellingen niet lezen.");
      return;
    }

    // Maak een label voor in de lijst
    const label = this._maakLabel(opties);

    // Voeg toe aan bundel — met deep copy zodat latere wijzigingen geen invloed hebben
    this.items.push({
      categorie: actieveCat,
      opties: JSON.parse(JSON.stringify(opties)),
      label: label,
      tijd: Date.now()
    });

    this._updateUI();
  },

  /* === Verwijder item uit bundel === */
  verwijder: function(index) {
    this.items.splice(index, 1);
    this._updateUI();
  },

  /* === Wis hele bundel === */
  wis: function() {
    this.items = [];
    this._updateUI();
  },

  /* === Download de bundel als PDF === */
  downloadBundel: function(metAntwoorden) {
    if (this.items.length === 0) {
      alert("Bundel is leeg.");
      return;
    }

    // Bouw alle werkbladen als één grote HTML
    let bundelHTML = "";
    for (const item of this.items) {
      const module = window.SpellingModules?.[item.categorie];
      if (!module) continue;

      // Genereer werkblad-HTML met de bewaarde instellingen
      const werkbladHTML = module.genereerBlad(item.opties, metAntwoorden);
      bundelHTML += werkbladHTML;
    }

    // Vervang preview tijdelijk met bundel
    const preview = document.querySelector("#preview");
    if (!preview) return;

    const origineleInhoud = preview.innerHTML;
    preview.innerHTML = bundelHTML;

    // Teken canvases
    if (window.SpellingSchrijflijnen) {
      window.SpellingSchrijflijnen.tekenAlle(preview);
    }

    // Wacht 2 frames zodat browser content gelayoute en geverfd heeft
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const knop = metAntwoorden
          ? document.querySelector("#bundel-download-oplossingen")
          : document.querySelector("#bundel-download");
        const oudeTekst = knop?.textContent || "";
        if (knop) {
          knop.textContent = "PDF wordt gemaakt...";
          knop.disabled = true;
        }

        // Bestandsnaam
        const datum = new Date().toISOString().slice(0, 10);
        const naam = metAntwoorden
          ? `spelling-bundel-oplossingen-${datum}.pdf`
          : `spelling-bundel-${datum}.pdf`;

        // PDF-instellingen — zelfde als pdf-engine
        const pdfOpties = {
          margin: 0,
          filename: naam,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff"
          },
          jsPDF: {
            unit: "mm",
            format: "a4",
            orientation: "portrait"
          },
          pagebreak: {
            mode: "css",
            avoid: [".werkblad", ".ov01-blad", ".weekdictee-blad", ".ov01-header", ".ov01-stappen", ".ov01-rooster-rij", ".ov01-zin-blok", ".dag-blok"]
          }
        };

        // Kloon preview voor PDF-render (zelfde aanpak als pdf-engine)
        const kloon = preview.cloneNode(true);
        kloon.classList.remove("preview-modus");
        kloon.removeAttribute("id");

        const tijdelijk = document.createElement("div");
        tijdelijk.style.position = "absolute";
        tijdelijk.style.top = "0";
        tijdelijk.style.left = "0";
        tijdelijk.style.width = preview.offsetWidth + "px";
        tijdelijk.style.zIndex = "999999";
        tijdelijk.style.background = "#fff";
        tijdelijk.style.visibility = "hidden";
        tijdelijk.appendChild(kloon);
        document.body.appendChild(tijdelijk);

        // Teken canvases opnieuw in kloon
        if (window.SpellingSchrijflijnen) {
          window.SpellingSchrijflijnen.tekenAlle(kloon);
        }

        // Exporteer
        html2pdf().set(pdfOpties).from(kloon).save().then(() => {
          tijdelijk.remove();
          preview.innerHTML = origineleInhoud;
          if (window.SpellingSchrijflijnen) {
            window.SpellingSchrijflijnen.tekenAlle(preview);
          }
          if (knop) {
            knop.textContent = oudeTekst;
            knop.disabled = false;
          }
        }).catch(err => {
          console.error("PDF-export mislukt:", err);
          tijdelijk.remove();
          preview.innerHTML = origineleInhoud;
          if (knop) {
            knop.textContent = oudeTekst;
            knop.disabled = false;
          }
          alert("PDF-export mislukt. Probeer opnieuw.");
        });
      });
    });
  },

  /* === Bouw een leesbaar label voor een bundel-item === */
  _maakLabel: function(opties) {
    // Module-naam op basis van actieve categorie
    const cat = document.querySelector(".cat-knop.actief")?.dataset.categorie || "?";
    const moduleNaam = (cat === "ov01") ? "Schrijf bij plaatje" : cat;

    // Module-specifieke opties zitten genest: opties.ov01.* / opties.weekdictee.*
    const modOpties = opties[cat] || {};

    // Niveaus
    const niveaus = modOpties.niveaus || [];
    const niveauTekst = niveaus.length > 0 ? niveaus.join("+") : "basis";

    // Aantal woorden
    const aantal = modOpties.aantalWoorden || "?";

    // Ondertitel als opgegeven
    const ondertitel = modOpties.ondertitel ? ` — ${modOpties.ondertitel}` : "";

    return `${moduleNaam} (${niveauTekst}, ${aantal} woorden)${ondertitel}`;
  },

  /* === Update zijbalk-UI op basis van bundel === */
  _updateUI: function() {
    const lijst = document.querySelector("#bundel-lijst");
    const btnDownload = document.querySelector("#bundel-download");
    const btnDownloadOpl = document.querySelector("#bundel-download-oplossingen");
    const btnWis = document.querySelector("#bundel-wis");

    if (!lijst) return;

    if (this.items.length === 0) {
      lijst.innerHTML = `<p class="bundel-leeg">Nog geen bladen in je bundel.</p>`;
      btnDownload?.classList.add("verborgen");
      btnDownloadOpl?.classList.add("verborgen");
      btnWis?.classList.add("verborgen");
      return;
    }

    // Items renderen met verwijderknop
    let html = `<ol class="bundel-items">`;
    this.items.forEach((item, idx) => {
      html += `
        <li class="bundel-item">
          <span class="bundel-item-label">${item.label}</span>
          <button class="bundel-item-verwijder" data-idx="${idx}" title="Verwijder">✕</button>
        </li>`;
    });
    html += `</ol>`;
    html += `<p class="bundel-aantal">${this.items.length} blad${this.items.length === 1 ? "" : "en"} in je bundel</p>`;

    lijst.innerHTML = html;

    // Verwijder-knoppen koppelen
    lijst.querySelectorAll(".bundel-item-verwijder").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        this.verwijder(idx);
      });
    });

    btnDownload?.classList.remove("verborgen");
    btnDownloadOpl?.classList.remove("verborgen");
    btnWis?.classList.remove("verborgen");
  }
};

// Auto-init bij DOM-load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => window.SpellingBundel.init());
} else {
  window.SpellingBundel.init();
}

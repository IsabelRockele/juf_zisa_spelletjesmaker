/* ==========================================================
   pdf-engine.js
   Echte PDF-export via html2pdf.js (CDN-geladen).
   - Werkblad-PDF: gebruikt de live preview
   - Oplossingen-PDF: genereert verborgen versie met antwoorden, exporteert die
   ========================================================== */

window.SpellingPDF = {

  /* download(false) → werkblad
     download(true)  → oplossingenbundel */
  download: function(metOplossingen = false) {
    if (typeof html2pdf === "undefined") {
      alert("PDF-bibliotheek nog aan het laden. Probeer over een paar seconden opnieuw.");
      return;
    }
    if (metOplossingen) this._downloadOplossingen();
    else this._downloadWerkblad();
  },

  /* === Werkblad-PDF: gebruik de zichtbare preview === */
  _downloadWerkblad: function() {
    const bewerkAan = document.body.classList.contains("bewerk-aan");
    document.body.classList.remove("bewerk-aan");

    const opties = window.SpellingGenerator.leesOpties();
    const bestandsnaam = this._maakBestandsnaam(opties, false);

    const bron = document.querySelector("#preview");
    if (!bron || bron.children.length === 0) {
      alert("Maak eerst een werkblad aan via 'Vernieuw voorbeeld'.");
      if (bewerkAan) document.body.classList.add("bewerk-aan");
      return;
    }

    // Strategie: kloon de preview, vervang lege canvases door verse canvases
    // met dezelfde data-attributen, dan tekenen we ze opnieuw vóór render.
    const kloon = bron.cloneNode(true);
    kloon.querySelectorAll("[contenteditable]").forEach(el => el.removeAttribute("contenteditable"));
    // Verwijder preview-modus class zodat A4-grens-marker niet in PDF verschijnt
    kloon.classList.remove("preview-modus");
    kloon.removeAttribute("id");

    // Vervang elk gekloonde canvas door een nieuwe lege canvas (wis pixeldata)
    // en plaats hem tijdelijk in een container die we tekenen.
    const tijdelijk = document.createElement("div");
    tijdelijk.style.position = "absolute";
    tijdelijk.style.top = "0";
    tijdelijk.style.left = "0";
    tijdelijk.style.width = bron.offsetWidth + "px";
    tijdelijk.style.zIndex = "999999";
    tijdelijk.style.background = "#fff";
    tijdelijk.style.visibility = "hidden";
    tijdelijk.appendChild(kloon);
    document.body.appendChild(tijdelijk);

    // Teken alle canvases opnieuw in de kloon
    if (window.SpellingSchrijflijnen) {
      window.SpellingSchrijflijnen.tekenAlle(kloon);
    }

    const knop = document.querySelector("#download-pdf");
    this._exporteer(kloon, bestandsnaam, knop, () => {
      tijdelijk.remove();
      if (bewerkAan) document.body.classList.add("bewerk-aan");
    });
  },

  /* === Oplossingen-PDF: gebruik dezelfde strategie als werkblad-PDF.
     We tonen de oplossingen tijdelijk in #preview (zichtbaar in browser),
     klonen die, en exporteren de kloon. Daarna herstellen we de preview. === */
  _downloadOplossingen: function() {
    const opties = window.SpellingGenerator.leesOpties();
    const bestandsnaam = this._maakBestandsnaam(opties, true);

    const preview = document.querySelector("#preview");
    if (!preview) {
      alert("Preview niet gevonden.");
      return;
    }

    // Bewaar huidige inhoud
    const origineleInhoud = preview.innerHTML;
    
    // Vervang preview tijdelijk door oplossingen
    preview.innerHTML = window.SpellingGenerator.genereerBundel(opties, true);
    
    // Teken canvases (als er zijn)
    if (window.SpellingSchrijflijnen) {
      window.SpellingSchrijflijnen.tekenAlle(preview);
    }
    
    // Wacht 2 frames zodat browser content gelayoute en geverfd heeft
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Kloon de oplossingen
        const kloon = preview.cloneNode(true);
        kloon.classList.remove("preview-modus");
        kloon.removeAttribute("id");
        
        // Tijdelijke container voor html2canvas
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

        // Teken canvases opnieuw in de kloon
        if (window.SpellingSchrijflijnen) {
          window.SpellingSchrijflijnen.tekenAlle(kloon);
        }

        const knop = document.querySelector("#download-oplossing");
        this._exporteer(kloon, bestandsnaam, knop, () => {
          tijdelijk.remove();
          // Herstel originele preview-inhoud
          preview.innerHTML = origineleInhoud;
          // Teken originele canvases opnieuw
          if (window.SpellingSchrijflijnen) {
            window.SpellingSchrijflijnen.tekenAlle(preview);
          }
        });
      });
    });
  },

  /* === Centrale exporteer-functie === */
  _exporteer: function(element, bestandsnaam, knop, opruimen) {
    const pdfOpties = {
      // GEEN extra marge — de .werkblad doet zelf de padding (1.5cm)
      margin: 0,
      filename: bestandsnaam,
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        backgroundColor: "#ffffff",
        // Geen scrollY-correctie nodig — element is verborgen op vaste positie
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait"
      },
      // Page-break instellingen: respecteer .ov01-blad als pagina-grens,
      // en vermijd page-break BINNEN belangrijke blokken (header, stappen, rij)
      pagebreak: {
        // Alleen "css" mode — legacy negeert soms de avoid-regels.
        mode: "css",
        before: ".pagina-break-voor",
        // .werkblad mag NOOIT gesplitst worden — anders krijgt elk werkblad
        // een lege restant-pagina. Een werkblad past op exact één A4.
        avoid: [".werkblad", ".ov01-blad", ".ov07-blad", ".ov08-blad", ".weekdictee-blad", ".ov01-header", ".ov01-stappen", ".ov01-rooster-rij", ".ov01-zin-blok", ".dag-blok", ".ov07-rij", ".ov07-cel", ".ov07-uitbreiding-container", ".ov07-verhaal-origineel", ".ov08-rij", ".ov08-cel", ".ov08-uitbreiding-container", ".ov08-verhaal-origineel"]
      }
    };

    const oudeTekst = knop ? knop.textContent : "";
    if (knop) {
      knop.textContent = "PDF maken…";
      knop.disabled = true;
    }

    html2pdf().set(pdfOpties).from(element).save()
      .then(() => {
        if (knop) {
          knop.textContent = oudeTekst;
          knop.disabled = false;
        }
        if (opruimen) opruimen();
      })
      .catch(err => {
        console.error("PDF-fout:", err);
        alert("Er ging iets mis bij het maken van de PDF. Probeer opnieuw.");
        if (knop) {
          knop.textContent = oudeTekst;
          knop.disabled = false;
        }
        if (opruimen) opruimen();
      });
  },

  /* === Bestandsnaam-bouwer === */
  _maakBestandsnaam: function(opties, metOplossingen) {
    let basis = "spelling";
    if (opties.bundelNaam) {
      basis = opties.bundelNaam.replace(/[^a-z0-9 _-]/gi, "").trim() || basis;
    } else if (opties.categorie === "weekdictee") {
      basis = "weekdictee";
    } else if (opties.categorie === "ov01") {
      const niveaus = opties.ov01?.niveaus || ["basis"];
      const niveauTekst = niveaus.length === 1 ? niveaus[0] : "bundel";
      basis = `schrijf-bij-plaatje-${niveauTekst}`;
    } else if (opties.subcat === "kort") {
      basis = `klankzuiver-${opties.structuur}-${opties.niveau}`;
    } else if (opties.subcat === "tweeklank") {
      basis = `tweeklanken-${opties.niveau}`;
    } else if (opties.subcat === "verwar") {
      basis = `verwarletters-${opties.verwarPaar}-${opties.niveau}`;
    }
    const suffix = metOplossingen ? "-OPLOSSINGEN" : "";
    return `${basis}${suffix}.pdf`;
  }
};

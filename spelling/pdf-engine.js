/* ==========================================================
   pdf-engine.js
   Echte PDF-export via html2pdf.js (CDN-geladen).
   - Werkblad-PDF: gebruikt de live preview
   - Oplossingen-PDF: genereert verborgen versie met antwoorden, exporteert die
   ========================================================== */

window.SpellingPDF = {

  bewaarPDF: function(element, opties) {
    // De PDF-marge geldt op iedere pagina, ook na een automatische rijovergang.
    const margeMM = 10;
    const margePx = margeMM * 96 / 25.4;
    element.querySelectorAll(".werkblad").forEach(blad => {
      const stijl = getComputedStyle(blad);
      const hoogte = parseFloat(stijl.minHeight);
      const boven = parseFloat(stijl.paddingTop);
      const onder = parseFloat(stijl.paddingBottom);
      if (hoogte > 0) blad.style.setProperty("min-height", Math.max(0, hoogte - 2 * margePx) + "px", "important");
      blad.style.setProperty("padding-top", Math.max(0, boven - margePx) + "px", "important");
      blad.style.setProperty("padding-bottom", Math.max(0, onder - margePx) + "px", "important");
    });
    const exportOpties = { ...opties, margin: [margeMM, 0, margeMM, 0] };
    let canvas;
    let paginaHoogte;
    return html2pdf().set(exportOpties).from(element).toCanvas()
      .get("canvas", resultaat => { canvas = resultaat; })
      .get("pageSize", pagina => { paginaHoogte = Math.floor(canvas.width * pagina?.inner?.ratio); })
      .toPdf()
      .get("pdf", pdf => {
        if (!(paginaHoogte > 0)) return;
        const ctx = canvas.getContext("2d");
        // Een rasterrest na de laatste bedrukte pagina kan volledig wit zijn.
        for (let nummer = pdf.getNumberOfPages(); nummer > 1; nummer--) {
          const y = (nummer - 1) * paginaHoogte;
          const hoogte = Math.min(paginaHoogte, canvas.height - y);
          if (hoogte > 0) {
            const pixels = ctx.getImageData(0, y, canvas.width, hoogte).data;
            let wit = true;
            for (let i = 0; i < pixels.length; i += 4) {
              if (pixels[i + 3] && (pixels[i] < 255 || pixels[i + 1] < 255 || pixels[i + 2] < 255)) {
                wit = false;
                break;
              }
            }
            if (!wit) break;
          }
          pdf.deletePage(nummer);
        }
      })
      .save();
  },

  // Wacht op echte afbeeldingsmaten voordat html2pdf pagina-einden berekent.
  bereidAfbeeldingenVoor: async function(element) {
    await Promise.all(Array.from(element.querySelectorAll("img"), img => {
      img.loading = "eager";
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      });
    }));
    if (document.fonts) await document.fonts.ready;

    // Een html2pdf-pagebreak-spacer mag geen losse gridcel worden.
    // Groepeer complete rijen binnen de exportkloon in verplaatsbare blokken.
    element.querySelectorAll(".ov03-rooster-2kol, .to-prenten, .to-codewoorden").forEach(grid => {
      const stijl = getComputedStyle(grid);
      if (stijl.display !== "grid") return;
      const kolommen = stijl.gridTemplateColumns;
      const kolomRuimte = stijl.columnGap;
      const rijRuimte = stijl.rowGap;
      const rijen = [];
      Array.from(grid.children).forEach(cel => {
        const top = cel.getBoundingClientRect().top;
        let rij = rijen[rijen.length - 1];
        if (!rij || Math.abs(rij.top - top) > 1) {
          rij = { top, cellen: [] };
          rijen.push(rij);
        }
        rij.cellen.push(cel);
      });
      grid.style.display = "block";
      grid.classList.add("spelling-pdf-rooster");
      rijen.forEach((rij, index) => {
        const wrapper = document.createElement("div");
        wrapper.className = "spelling-pdf-rij";
        Object.assign(wrapper.style, {
          display: "grid", gridTemplateColumns: kolommen, columnGap: kolomRuimte,
          marginBottom: index < rijen.length - 1 ? rijRuimte : "0",
          breakInside: "avoid", pageBreakInside: "avoid"
        });
        rij.cellen.forEach(cel => wrapper.appendChild(cel));
        grid.appendChild(wrapper);
      });
    });
  },

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
        avoid: ["img", ".spelling-pdf-rij", ".to-prentvraag", ".to-zinrij", ".werkblad", ".ov01-blad", ".ov07-blad", ".ov08-blad", ".ov09-blad", ".ov10-blad", ".ov11-blad", ".ov12-blad", ".ov13-blad", ".weekdictee-blad", ".ov01-header", ".ov01-stappen", ".ov01-rooster-rij", ".ov01-zin-blok", ".dag-blok", ".ov07-rij", ".ov07-cel", ".ov07-uitbreiding-container", ".ov07-verhaal-origineel", ".ov08-rij", ".ov08-cel", ".ov08-uitbreiding-container", ".ov08-verhaal-origineel", ".ov09-basis-rij", ".ov09-kern-rij", ".ov09-verdieping-rooster", ".ov09-verdieping-afbeeldingen", ".ov09-verdieping-kolommen", ".ov09-verdieping-cel", ".ov09-uitbreiding-rij", ".ov10-header", ".ov10-noteer-rij", ".ov10-wz-rij", ".ov10-kern-rij", ".ov10-ub-rij", ".ov10-afb-grid", ".ov10-vb-grid", ".ov11-kaart", ".ov11-zin", ".ov11-sorteer section", ".ov12-kaart", ".ov12-uitbreiding-rij", ".ov13-basisrij", ".ov13-zin", ".ov13-tekst", ".ov13-herschrijf", ".ov02-rij", ".ov03-cel"]
      }
    };

    const oudeTekst = knop ? knop.textContent : "";
    if (knop) {
      knop.textContent = "PDF maken…";
      knop.disabled = true;
    }

    this.bereidAfbeeldingenVoor(element)
      .then(() => this.bewaarPDF(element, pdfOpties))
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

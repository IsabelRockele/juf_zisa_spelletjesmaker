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

    const kloon = bron.cloneNode(true);
    kloon.querySelectorAll("[contenteditable]").forEach(el => el.removeAttribute("contenteditable"));

    const knop = document.querySelector("#download-pdf");
    this._exporteer(kloon, bestandsnaam, knop, () => {
      if (bewerkAan) document.body.classList.add("bewerk-aan");
    });
  },

  /* === Oplossingen-PDF: genereer aparte HTML met antwoorden === */
  _downloadOplossingen: function() {
    const opties = window.SpellingGenerator.leesOpties();
    const bestandsnaam = this._maakBestandsnaam(opties, true);

    // Genereer oplossingen-HTML in een verborgen container
    const verborgen = document.createElement("div");
    verborgen.id = "verborgen-oplossingen";
    verborgen.style.position = "absolute";
    verborgen.style.left = "-9999px";
    verborgen.style.top = "0";
    verborgen.style.width = "21cm";
    verborgen.innerHTML = window.SpellingGenerator.genereerBundel(opties, true);
    document.body.appendChild(verborgen);

    // Teken eventuele schrijflijn-canvases binnen de verborgen container
    if (window.SpellingSchrijflijnen) {
      window.SpellingSchrijflijnen.tekenAlle(verborgen);
    }

    const knop = document.querySelector("#download-oplossing");
    this._exporteer(verborgen, bestandsnaam, knop, () => {
      verborgen.remove();
    });
  },

  /* === Centrale exporteer-functie === */
  _exporteer: function(element, bestandsnaam, knop, opruimen) {
    const pdfOpties = {
      margin: [10, 10, 10, 10],
      filename: bestandsnaam,
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        backgroundColor: "#ffffff"
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait"
      },
      pagebreak: { mode: ["css", "legacy"] }
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
      basis = `OV01-plaatje-naar-woord-${opties.ov01?.niveau || "basis"}`;
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

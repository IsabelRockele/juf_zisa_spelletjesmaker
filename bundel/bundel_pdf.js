/* =========================================================
   BUNDEL – PDF ENGINE (ALLEEN SPLITSBENEN)
   ========================================================= */

import { drawSplitsPDF } from '../splitsen/splits.pdf.js';

const { jsPDF } = window.jspdf;

function tekenBundelKop(doc, bundelMeta, layout, isEerstePagina) {
  if (!bundelMeta) return 0;
  if (!bundelMeta.toonTitelOpElkePagina && !isEerstePagina) return 0;

  const paginaBreedte = doc.internal.pageSize.getWidth();

  // Naam-lijn (bovenaan)
  const yNaam = 15;
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text('Naam: ____________________________', layout.marginLeft, yNaam);

  // Titel bepalen (fallback)
  const titel = (bundelMeta.titel && bundelMeta.titel.trim())
    ? bundelMeta.titel.trim()
    : 'Herhalingsbundel bewerkingen';

 // Titelkader – vet omlijnd, GEEN opvulling
const kaderY = yNaam + 6;
const kaderH = 14;

doc.setDrawColor(80, 80, 80);   // donkergrijze rand
doc.setLineWidth(1.2);          // vet kader
doc.rect(
  layout.marginLeft,
  kaderY,
  paginaBreedte - layout.marginLeft * 2,
  kaderH
);
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(titel, paginaBreedte / 2, kaderY + 10, { align: 'center' });

  // Hoeveel extra ruimte we innemen t.o.v. de start
  return 26; // vaste offset is hier prima (naam + kader)
}


/* ---------- helpers ---------- */

function leesBundel() {
  try {
    return JSON.parse(localStorage.getItem('werkbladBundel') || '[]');
  } catch {
    return [];
  }
}

function titelVoor(cfg) {
  if (cfg.opdracht && cfg.opdracht.trim()) return cfg.opdracht.trim();

  if (cfg.hoofdBewerking === 'splitsen') {
    if (cfg.splitsStijl === 'puntoefening') return 'Vul de splitsing aan.';
    if (cfg.splitsStijl === 'bewerkingen4') return 'Splits en maak de 4 bewerkingen.';
    if (cfg.splitsStijl === 'huisje') return 'Vul het splitshuis correct in.';
    return 'Vul de splitsbenen correct in.';
  }

  return 'Oefeningen';
}

/* ---------- layout ---------- */

function basisLayout(doc) {
  return {
    marginLeft: 15,   // iets meer naar links
    marginTop: 30,
    colWidth: 36,     // iets compacter
    lineHeight: 22,
    cols: 4
  };
}


/* ---------- main ---------- */

document.addEventListener('DOMContentLoaded', () => {

  const btn = document.getElementById('downloadPdfBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {

    const bundel = leesBundel();
    const bundelMeta = JSON.parse(localStorage.getItem('bundelMeta') || '{}');
    if (!bundel.length) {
      alert('Geen oefeningen in de bundel.');
      return;
    }

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
   const layout = basisLayout(doc);

let x = layout.marginLeft;
let y = layout.marginTop;
let col = 0;

// Bundelkop op eerste pagina
const extraOffset = tekenBundelKop(doc, bundelMeta, layout, true);
y += extraOffset;



    bundel.forEach((item, index) => {

      const cfg = item.settings;
      if (!cfg) return;
      if (cfg.hoofdBewerking !== 'splitsen') return;
      if (cfg.splitsStijl !== 'benen' && cfg.splitsStijl !== 'huisje' && cfg.splitsStijl !== 'puntoefening') return;
      if (!Array.isArray(cfg._oefeningen)) return;

      // Nieuwe pagina vanaf tweede segment
      if (index > 0) {
  doc.addPage();
  x = layout.marginLeft;
  y = layout.marginTop;
  col = 0;

  const extraOffset = tekenBundelKop(doc, bundelMeta, layout, false);
  y += extraOffset;
}


      // Titel
     // Opdrachtzin in kader (volledige breedte)
const titelTekst = titelVoor(cfg);

const kaderX = layout.marginLeft;
const kaderY = y - 6;
const kaderBreedte = doc.internal.pageSize.getWidth() - layout.marginLeft * 2;
const kaderHoogte = 12;

// lichtgrijs kader
doc.setFillColor(245, 245, 245);
doc.rect(kaderX, kaderY, kaderBreedte, kaderHoogte, 'F');

// opdrachtzin
doc.setFont(undefined, 'bold');
doc.setFontSize(14);
doc.setTextColor(0);
doc.text(titelTekst, kaderX + 4, y);

// ruimte onder het kader
y += kaderHoogte + 6;

// font terug normaal voor oefeningen
doc.setFont(undefined, 'normal');
doc.setFontSize(12);


if (cfg.splitsStijl === 'puntoefening') {
  y += 12;   // genoeg ruimte zodat titel NOOIT in kader loopt
} else {
  y += 10;
}


      doc.setFontSize(12);

const maxCols = (cfg.splitsStijl === 'puntoefening') ? 3 : layout.cols;
// startpositie voor eerste rij (ook verschuiven bij puntoefeningen)
x = layout.marginLeft + (cfg.splitsStijl === 'puntoefening' ? 16 : 0);
col = 0;

      cfg._oefeningen.forEach((oef, i) => {

        drawSplitsPDF(doc, cfg, oef, {
          x,
          y,
          colWidth: layout.colWidth,
          lineHeight: layout.lineHeight
        });

        col++;
        if (col >= maxCols) {
          col = 0;
          x = layout.marginLeft + (cfg.splitsStijl === 'puntoefening' ? 16 : 0);
         y += layout.lineHeight + (cfg.splitsStijl === 'puntoefening' ? 2 : 18);
        } else {
  x += layout.colWidth + (cfg.splitsStijl === 'puntoefening' ? 18 : 10);
}


        // Nieuwe pagina indien nodig
        if (y > (cfg.splitsStijl === 'puntoefening' ? 275 : 260)) {
          doc.addPage();
          x = layout.marginLeft;
          y = layout.marginTop;
          col = 0;
        }
      });

    });

    doc.save('bundel-splitsbenen.pdf');
  });

});

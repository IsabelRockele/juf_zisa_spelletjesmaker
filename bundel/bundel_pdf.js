/* =========================================================
   BUNDEL – PDF ENGINE (ALLEEN SPLITSBENEN)
   ========================================================= */

import {
  drawSplitsPDF,
  drawSplitsPlusVierPDF
} from '../splitsen/splits.pdf.js';


const { jsPDF } = window.jspdf;

// ===== SPLITS + 4 BEWERKINGEN (vaste kaartmaten) =====
// ===== SPLITS + 4 BEWERKINGEN (vaste kaartmaten – 2 per rij) =====
const SPLITS4_KAART_W = 85;   // bredere kaart
const SPLITS4_KAART_H = 84;   // iets hoger voor schrijfruimte
const SPLITS4_GAP_X  = 14;
const SPLITS4_GAP_Y  = 14;



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
  return 12; // vaste offset is hier prima (naam + kader)
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


const isEerstePagina = true;
const extraOffset = tekenBundelKop(doc, bundelMeta, layout, isEerstePagina);

// 🔴 ALS er GEEN titel/naam is: start hoger
y = layout.marginTop + extraOffset + (extraOffset === 0 ? -10 : 0);





    bundel.forEach((item, index) => {

      const cfg = item.settings;
      if (!cfg) return;
      if (cfg.hoofdBewerking !== 'splitsen') return;
     if (!cfg) return;
if (cfg.hoofdBewerking !== 'splitsen') return;
if (cfg.splitsStijl !== 'benen'
 && cfg.splitsStijl !== 'huisje'
 && cfg.splitsStijl !== 'puntoefening'
 && cfg.splitsStijl !== 'bewerkingen4') return;
if (!Array.isArray(cfg._oefeningen)) return;


      // Nieuwe pagina vanaf tweede segment
      if (index > 0) {
  doc.addPage();
x = layout.marginLeft;
col = 0;

const isEerstePagina = false;
const extraOffset = tekenBundelKop(doc, bundelMeta, layout, isEerstePagina);

// 🔴 CRUCIAAL: andere start-Y afhankelijk van titel
y = layout.marginTop + extraOffset + (extraOffset === 0 ? -10 : 0);

}

// 👇 EXPLICIET bijhouden of deze pagina een bundelkop heeft
const isEerstePagina =
  index === 0 || bundelMeta.toonTitelOpElkePagina;


// ================================
// OPDRACHTZIN (correcte verticale flow)
// ================================

const titelTekst = titelVoor(cfg);

const heeftTitelBoven =
  bundelMeta.toonTitelOpElkePagina || isEerstePagina;

// 🔴 HIER zit het verschil:
// als er GEEN grote titel is → y omhoog halen
if (!heeftTitelBoven) {
  y -= 10;
}

const kaderX = layout.marginLeft;
const kaderY = y;
const kaderBreedte =
  doc.internal.pageSize.getWidth() - layout.marginLeft * 2;
const kaderHoogte = 12;

// kader
doc.setFillColor(245, 245, 245);
doc.rect(kaderX, kaderY, kaderBreedte, kaderHoogte, 'F');

// tekst
doc.setFont(undefined, 'bold');
doc.setFontSize(14);
doc.setTextColor(0);
doc.text(titelTekst, kaderX + 4, kaderY + 9);

// 🔴 NU PAS y verhogen → dit stuurt ALLES eronder
y += kaderHoogte + 4;

// iets compacter voor splits
if (cfg.hoofdBewerking === 'splitsen') {
  y += 2;
}


// bij bewerkingen4 géén extra y → eerste rij schuift omhoog



      doc.setFontSize(12);

const maxCols = (cfg.splitsStijl === 'puntoefening') ? 3 : layout.cols;
// startpositie voor eerste rij (ook verschuiven bij puntoefeningen)
x = layout.marginLeft + (cfg.splitsStijl === 'puntoefening' ? 16 : 0);
col = 0;

// ================================
// GROTE SPLITSHUIZEN – eigen layout
// ================================
if (cfg.groteSplitshuizen) {

  const fijn = cfg.splitsFijn || {};
  const getallen = [];

  if (fijn.tot5) getallen.push(5);
  if (fijn.van6) getallen.push(6);
  if (fijn.van7) getallen.push(7);
  if (fijn.van8) getallen.push(8);
  if (fijn.van9) getallen.push(9);
  if (fijn.van10) getallen.push(10);
  if (fijn.van10tot20) getallen.push(20);

  if (!getallen.length) return;

  const perRij = getallen.length >= 5 ? 3 : getallen.length;

  const startX = layout.marginLeft + 12; // perforatiemarge
  let curX = startX;
  let curY = y;
  let col = 0;

  getallen.forEach(max => {

    drawSplitsPDF(doc, cfg, { type: 'splitsen_groot', max }, {
      x: curX,
      y: curY,
      colWidth: 50,
      lineHeight: layout.lineHeight
    });

    col++;

    if (col >= perRij) {
      col = 0;
      curX = startX;
      curY += 128; // volgende rij
    } else {
      curX += 50;  // volgende kolom
    }

  });

  return; // 🔴 ZEER BELANGRIJK
}


      cfg._oefeningen.forEach((oef, i) => {

  // === SPLITS + 4 BEWERKINGEN ===
  if (cfg.splitsStijl === 'bewerkingen4') {

  // pagina-afbreking VOOR de kaart (zoals oude versie)
  if (col === 0 && y + SPLITS4_KAART_H > 260) {
    doc.addPage();
    x = layout.marginLeft;
    y = layout.marginTop;
    col = 0;
  }

  drawSplitsPlusVierPDF(doc, oef, {
    x,
    y,
    w: SPLITS4_KAART_W
  });

  col++;

  if (col >= 2) {
    col = 0;
    x = layout.marginLeft;
    y += SPLITS4_KAART_H + SPLITS4_GAP_Y;
  } else {
    x += SPLITS4_KAART_W + SPLITS4_GAP_X;
  }

  return;
}

  // === ANDERE SPLITS-OEFENINGEN ===
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

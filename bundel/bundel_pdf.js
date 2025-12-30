/* =========================================================
   BUNDEL – PDF ENGINE (ALLEEN SPLITSBENEN)
   ========================================================= */

import {
  drawSplitsPDF,
  drawSplitsPlusVierPDF
} from '../splitsen/splits.pdf.js';

const { jsPDF } = window.jspdf;

// ===== SPLITS + 4 BEWERKINGEN =====
const SPLITS4_KAART_W = 85;
const SPLITS4_KAART_H = 84;
const SPLITS4_GAP_X  = 14;
const SPLITS4_GAP_Y  = 14;

// ===== PAGINA =====
const PAGE_BOTTOM_LIMIT = 285;

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
  if (cfg.splitsStijl === 'huisje') return 'Vul het splitshuis correct in.';
  if (cfg.splitsStijl === 'benen') return 'Vul de splitsbenen correct in.';
  if (cfg.splitsStijl === 'puntoefening') return 'Vul de splitsing aan.';
  if (cfg.splitsStijl === 'bewerkingen4') return 'Splits en maak de 4 bewerkingen.';
  return 'Oefeningen';
}

function basisLayout() {
  return {
    marginLeft: 15,
    marginTop: 30,
    colWidth: 36,
    lineHeight: 22,
    cols: 4
  };
}

/* ---------- bundelkop ---------- */

function tekenBundelKop(doc, bundelMeta, layout, isEerstePagina) {
  if (!bundelMeta) return 0;
  if (!bundelMeta.toonTitelOpElkePagina && !isEerstePagina) return 0;

  const paginaBreedte = doc.internal.pageSize.getWidth();
  const yNaam = 15;

  doc.setFontSize(11);
  doc.text('Naam: ____________________________', layout.marginLeft, yNaam);

  const kaderY = yNaam + 6;
  const kaderH = 14;

  doc.setLineWidth(1.2);
  doc.rect(layout.marginLeft, kaderY, paginaBreedte - layout.marginLeft * 2, kaderH);

  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(
    bundelMeta.titel || 'Herhalingsbundel bewerkingen',
    paginaBreedte / 2,
    kaderY + 10,
    { align: 'center' }
  );

  return 12;
}

/* ---------- paging helpers ---------- */

function pageStartY(layout, headerOffset) {
  // Als er geen grote titel is, starten we hoger (zoals je werkboek-gevoel wil).
  // Dit is bewust beperkt tot pagina’s zonder bundelkop.
  return layout.marginTop + (headerOffset === 0 ? -10 : headerOffset);
}

function newPage(doc, bundelMeta, layout) {
  doc.addPage();
  const headerOffset = tekenBundelKop(doc, bundelMeta, layout, false);
  return pageStartY(layout, headerOffset);
}

function rijHoogteVoor(cfg, layout) {
  if (cfg.splitsStijl === 'bewerkingen4') return SPLITS4_KAART_H + SPLITS4_GAP_Y;
  if (cfg.splitsStijl === 'puntoefening') return layout.lineHeight + 2;
  return layout.lineHeight + 16;
}

/* =========================================================
   MAIN
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  const btn = document.getElementById('downloadPdfBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {

    const bundel = leesBundel();
    const bundelMeta = JSON.parse(localStorage.getItem('bundelMeta') || '{}');
    if (!bundel.length) return alert('Geen oefeningen.');

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const layout = basisLayout();

    let x = layout.marginLeft;
    let y = layout.marginTop;
    let col = 0;

    // eerste pagina
    const headerOffset1 = tekenBundelKop(doc, bundelMeta, layout, true);
    y = pageStartY(layout, headerOffset1);

    bundel.forEach(cfgItem => {

      const cfg = cfgItem.settings;
      if (!cfg) return;

      // Grote splitshuizen hebben geen cfg._oefeningen nodig in jouw systeem
      if (!cfg.groteSplitshuizen && !Array.isArray(cfg._oefeningen)) return;


  /* =====================================================
   OPDRACHT-CHECK (GEEN CHECK VOOR PUNTOEFENINGEN)
   ===================================================== */

if (cfg.splitsStijl !== 'puntoefening') {

  const opdrachtHoogte = 12 + 4;
  const rijHoogteCheck = rijHoogteVoor(cfg, layout);

  const checkHoogte = opdrachtHoogte + rijHoogteCheck;

  if (y + checkHoogte > PAGE_BOTTOM_LIMIT) {
    y = newPage(doc, bundelMeta, layout);
    x = layout.marginLeft;
    col = 0;
  }
}


      /* ================= OPDRACHTZIN ================= */

      const titel = titelVoor(cfg);
      const kaderBreedte = doc.internal.pageSize.getWidth() - layout.marginLeft * 2;

      doc.setFillColor(245, 245, 245);
      doc.rect(layout.marginLeft, y, kaderBreedte, 12, 'F');

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(titel, layout.marginLeft + 4, y + 9);

      y += 16;

      // ✅ puntoefeningen: start rij 1 net onder titelbalk, niet erin
      if (cfg.splitsStijl === 'puntoefening') {
        y += 10;
      }

      /* ================= GROTE SPLITSHUIZEN ================= */

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

        const startX = layout.marginLeft + 12;
        let curX = startX;
        let curY = y;
        let c = 0;

        getallen.forEach(max => {

          // ✅ pagina-afbreking vóór een NIEUWE rij grote splitshuizen
          // (rijhoogte is 128 in jouw bestaande layout)
          if (c === 0 && curY + 128 > PAGE_BOTTOM_LIMIT) {
            curY = newPage(doc, bundelMeta, layout);
            curX = startX;
          }

          drawSplitsPDF(doc, cfg, { type: 'splitsen_groot', max }, {
            x: curX,
            y: curY,
            colWidth: 50,
            lineHeight: layout.lineHeight
          });

          c++;
          if (c >= perRij) {
            c = 0;
            curX = startX;
            curY += 128;
          } else {
            curX += 50;
          }
        });

        // zet y onder de laatste getekende rij
        y = curY + 128 + 10;
        x = layout.marginLeft;
        col = 0;
        return;
      }

      /* ================= OEFENINGEN ================= */

      const maxCols = (cfg.splitsStijl === 'puntoefening') ? 3 : layout.cols;
      x = layout.marginLeft + (cfg.splitsStijl === 'puntoefening' ? 16 : 0);
      col = 0;

      const rijHoogte = rijHoogteVoor(cfg, layout);

      cfg._oefeningen.forEach((oef, i) => {

        // pagina-afbreking bij rijstart
const isLaatsteOefening = (i === cfg._oefeningen.length - 1);
const extraSpeling = isLaatsteOefening ? 14 : 0;

if (
  col === 0 &&
  y + rijHoogte - extraSpeling > PAGE_BOTTOM_LIMIT &&
  !(cfg.splitsStijl === 'puntoefening' && i < maxCols)
) {
  y = newPage(doc, bundelMeta, layout);

// extra topmarge voor puntoefeningen op vervolgpagina
if (cfg.splitsStijl === 'puntoefening') {
  y += 12;
}

  x = layout.marginLeft + (cfg.splitsStijl === 'puntoefening' ? 16 : 0);
  col = 0;
}


        if (cfg.splitsStijl === 'bewerkingen4') {

          drawSplitsPlusVierPDF(doc, oef, { x, y, w: SPLITS4_KAART_W });

          col++;
          if (col >= 2) {
            col = 0;
            x = layout.marginLeft;
            y += rijHoogte;
          } else {
            x += SPLITS4_KAART_W + SPLITS4_GAP_X;
          }

          return;
        }

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
          y += rijHoogte;
        } else {
          x += layout.colWidth + (cfg.splitsStijl === 'puntoefening' ? 18 : 10);
        }
      });

      // ✅ Belangrijk: als de laatste rij onvolledig is, toch de rijhoogte “afsluiten”
      // zodat de volgende opdracht NOOIT in die rij kan overlappen.
      if (col !== 0) {
        y += rijHoogte;
        col = 0;
        x = layout.marginLeft + (cfg.splitsStijl === 'puntoefening' ? 16 : 0);
      }

      y += 10; // ruimte tussen opdrachten
    });

    doc.save('bundel-splitsbenen.pdf');
  });
});

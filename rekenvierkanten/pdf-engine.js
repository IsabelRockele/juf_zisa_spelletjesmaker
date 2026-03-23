/* ═══════════════════════════════════════════════════════════════════════════
   REKENVIERKANT GENERATOR  –  pdf-engine.js
   Verantwoordelijk voor het aanmaken van PDF werkblad en PDF sleutel.
   Gebruikt jsPDF (UMD, geladen via CDN in index.html).
   Leest state.grids en state.roosters uit generator.js.
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

/* ─── PDF CONSTANTEN ─────────────────────────────────────────────────────── */
const PDF_W  = 210;   // A4 breedte mm
const PDF_H  = 297;   // A4 hoogte mm
const PDF_M  = 14;    // marge mm

/* ─── KLEURENSET (RGB) ───────────────────────────────────────────────────── */
const C = {
  zwart:       [42,  42,  42],
  rooster_bg:  [246, 250, 253],
  lijn:        [188, 207, 223],
  rand:        [122, 174, 224],
  opvul_eq:    [232, 240, 248],
  opvul_op:    [238, 244, 248],
  tekst_sym:   [74,  111, 165],
  tekst_getal: [26,  45,  64],
  leeg_bg:     [255, 255, 255],
  ant_bg:      [212, 237, 218],   // groen voor oplossing
  ant_tekst:   [23,  122, 78],
  kader_bg:    [234, 243, 255],
  kader_rand:  [160, 192, 224],
  header_lijn: [11,  79,  153],
  // bewerkModus: handmatig verwijderd = zelfde als normaal leeg
};

/* ─── HELPER ─────────────────────────────────────────────────────────────── */
function huidigeDatum() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function setFill(doc, rgb) { doc.setFillColor(rgb[0], rgb[1], rgb[2]); }
function setDraw(doc, rgb) { doc.setDrawColor(rgb[0], rgb[1], rgb[2]); }
function setTekst(doc, rgb) { doc.setTextColor(rgb[0], rgb[1], rgb[2]); }

/* ─── TEKEN ÉÉN ROOSTER IN PDF ───────────────────────────────────────────── */
/**
 * @param {jsPDF} doc
 * @param {Array} gridData   - wat te tonen (display of full)
 * @param {Array} displayData - altijd g.display (voor lege-hokjes detectie)
 * @param {number} xOff      - x startpositie mm
 * @param {number} yOff      - y startpositie mm
 * @param {number} breedte   - totale breedte van het rooster mm
 * @param {number} cols      - 5 of 7
 * @param {boolean} oplossingModus
 */
function pdfTekenRooster(doc, gridData, displayData, xOff, yOff, breedte, cols, oplossingModus) {
  const rows  = cols;
  const vakB  = breedte / cols;
  const vakH  = vakB;           // vierkante vakjes

  // ── Achtergronden ──────────────────────────────────────────────────────
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x   = xOff + c * vakB;
      const y   = yOff + r * vakH;
      const val = gridData[r][c];
      const wasLeeg = displayData && displayData[r][c] === '___';

      if (val === '') {
        setFill(doc, C.zwart);
      } else if (val === '=') {
        setFill(doc, C.opvul_eq);
      } else if (['+','-','x',':'].includes(val)) {
        setFill(doc, C.opvul_op);
      } else if (wasLeeg && oplossingModus) {
        setFill(doc, C.ant_bg);
      } else {
        setFill(doc, C.leeg_bg);
      }
      doc.rect(x, y, vakB, vakH, 'F');
    }
  }

  // ── Rasterlijnen ───────────────────────────────────────────────────────
  setDraw(doc, C.lijn);
  doc.setLineWidth(0.3);
  for (let i = 0; i <= cols; i++) {
    const x = xOff + i * vakB;
    doc.line(x, yOff, x, yOff + rows * vakH);
  }
  for (let j = 0; j <= rows; j++) {
    const y = yOff + j * vakH;
    doc.line(xOff, y, xOff + cols * vakB, y);
  }

  // ── Buitenrand ─────────────────────────────────────────────────────────
  setDraw(doc, C.rand);
  doc.setLineWidth(0.6);
  doc.rect(xOff, yOff, cols * vakB, rows * vakH, 'S');

  // ── Tekst ──────────────────────────────────────────────────────────────
  const fs = Math.min(vakH * 0.45, 7);   // fontgrootte in mm → punten via jsPDF schaal
  const fsPt = fs * 2.835;               // 1 mm ≈ 2.835 pt

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx  = xOff + c * vakB + vakB / 2;
      const cy  = yOff + r * vakH + vakH / 2;
      const val = gridData[r][c];
      const wasLeeg = displayData && displayData[r][c] === '___';

      if (val === '') continue;
      if (!oplossingModus && wasLeeg) continue;

      doc.setFontSize(fsPt);

      if (val === '=' || ['+','-','x',':'].includes(val)) {
        setTekst(doc, C.tekst_sym);
        doc.setFont('helvetica', 'bold');
        const sym = val === 'x' ? '×' : val === ':' ? '÷' : val;
        doc.text(sym, cx, cy, { align: 'center', baseline: 'middle' });
      } else {
        // Getal
        if (oplossingModus && wasLeeg) {
          setTekst(doc, C.ant_tekst);
          doc.setFont('helvetica', 'bold');
        } else {
          setTekst(doc, C.tekst_getal);
          doc.setFont('helvetica', 'normal');
        }
        doc.text(String(val), cx, cy, { align: 'center', baseline: 'middle' });
      }
    }
  }
}

/* ─── ANTWOORDKADER (7×7 kader-modus) ───────────────────────────────────── */
function pdfTekenAntwoordKader(doc, ontbrekend, xOff, yOff, breedte) {
  const getallen     = [...ontbrekend].sort((a, b) => a - b);
  const aantalPerRij = Math.ceil(getallen.length / 2);
  const vakB         = (breedte - 6) / aantalPerRij;
  const vakH         = 7;
  const kadH         = vakH * 2 + 14;

  // Kader achtergrond
  setFill(doc, C.kader_bg);
  setDraw(doc, C.kader_rand);
  doc.setLineWidth(0.4);
  doc.roundedRect(xOff, yOff, breedte, kadH, 2, 2, 'FD');

  // Label
  setTekst(doc, [26, 51, 82]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Getallen om in te vullen:', xOff + 3, yOff + 4.5);

  // Getallen in vakjes
  getallen.forEach((v, idx) => {
    const kolIdx = idx % aantalPerRij;
    const rijIdx = Math.floor(idx / aantalPerRij);
    const x = xOff + 3 + kolIdx * vakB;
    const y = yOff + 7 + rijIdx * (vakH + 1);

    setFill(doc, [255, 255, 255]);
    setDraw(doc, C.kader_rand);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, vakB - 1, vakH, 1, 1, 'FD');

    setTekst(doc, C.tekst_getal);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(String(v), x + (vakB - 1) / 2, y + vakH / 2, { align: 'center', baseline: 'middle' });
  });

  return kadH + 3; // hoogte inclusief marge
}

/* ─── PAGINAKOP ──────────────────────────────────────────────────────────── */
function pdfTekenKop(doc, isOplossing, paginaNr, aantalPaginas) {
  let y = PDF_M;

  // ── Rij 1: Naam en Datum invullijnen ────────────────────────────────────
  setTekst(doc, [26, 45, 64]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);

  // "Naam:" label + invullijn
  doc.text('Naam:', PDF_M, y + 5);
  const naamLabelB = doc.getTextWidth('Naam:') + 2;
  setDraw(doc, [26, 45, 64]);
  doc.setLineWidth(0.5);
  doc.line(PDF_M + naamLabelB, y + 5.5, PDF_M + 80, y + 5.5);

  // "Datum:" label + invullijn (meer naar rechts)
  const datumX = PDF_M + 90;
  doc.text('Datum:', datumX, y + 5);
  const datumLabelB = doc.getTextWidth('Datum:') + 2;
  doc.line(datumX + datumLabelB, y + 5.5, PDF_W - PDF_M, y + 5.5);

  y += 12; // witmarge

  // ── Rij 2: Titel gecentreerd ─────────────────────────────────────────────
  setTekst(doc, C.header_lijn);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  const titel = isOplossing ? 'Rekenvierkant — Antwoordsleutel' : 'Rekenvierkant';
  doc.text(titel, PDF_W / 2, y + 6, { align: 'center' });

  // Paginanummer klein rechts naast titel als meerdere pagina's
  if (aantalPaginas > 1) {
    setTekst(doc, [95, 122, 143]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`p. ${paginaNr} / ${aantalPaginas}`, PDF_W - PDF_M, y + 6, { align: 'right' });
  }

  y += 10;

  // ── Blauwe lijn onder titel ──────────────────────────────────────────────
  setDraw(doc, C.header_lijn);
  doc.setLineWidth(0.8);
  doc.line(PDF_M, y, PDF_W - PDF_M, y);

  y += 5; // witmarge na lijn

  // ── Opdrachtzin in kader ────────────────────────────────────────────────
  const zin = isOplossing
    ? 'Hieronder vind je alle ingevulde antwoorden.'
    : 'Vul de ontbrekende getallen in. Elke rij en elke kolom moet kloppen.';

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  const zinB  = PDF_W - 2 * PDF_M;
  const kadH  = 10;
  const kadY  = y;

  // Kader achtergrond + rand
  setFill(doc, [234, 243, 255]);
  setDraw(doc, C.header_lijn);
  doc.setLineWidth(0.5);
  doc.roundedRect(PDF_M, kadY, zinB, kadH, 2, 2, 'FD');

  // Tekst verticaal gecentreerd in kader
  setTekst(doc, [26, 45, 64]);
  doc.text(zin, PDF_W / 2, kadY + kadH / 2, { align: 'center', baseline: 'middle' });

  y += kadH + 6; // witmarge na kader

  return y; // yStart voor roosters
}

/* ─── LAYOUT BEREKENEN ───────────────────────────────────────────────────── */
function pdfBerekenLayout(numGrids, cols, metKader) {
  const beschikbaarB = PDF_W - 2 * PDF_M;
  const numKols      = Math.min(numGrids, 2);
  const gap          = 8;  // mm tussen roosters horizontaal
  // Roosters iets kleiner: max 80mm breed bij 2 kolommen, 90mm bij 1 kolom
  const maxRoosterB  = numKols === 1 ? 90 : 80;
  const berekendB    = (beschikbaarB - (numKols - 1) * gap) / numKols;
  const roosterB     = Math.min(berekendB, maxRoosterB);
  const roosterH     = roosterB;
  const kaderH       = metKader ? 22 : 0;
  const rijH         = roosterH + (metKader ? kaderH : 0) + gap;

  // Horizontaal centreren als roosters kleiner zijn dan beschikbaar
  const totaalB  = numKols * roosterB + (numKols - 1) * gap;
  const xStart   = PDF_M + (beschikbaarB - totaalB) / 2;

  const offsets = [];
  for (let i = 0; i < numGrids; i++) {
    const kolIdx = i % 2;
    const rijIdx = Math.floor(i / 2);
    offsets.push({
      x: xStart + kolIdx * (roosterB + gap),
      rijIdx,
    });
  }
  return { roosterB, roosterH, rijH, offsets, kaderH, xStart };
}

/* ─── GENEREER PDF ───────────────────────────────────────────────────────── */
function genereerPDF(oplossingModus) {
  const grids = state.grids.filter(Boolean);
  if (grids.length === 0) {
    alert('Er zijn nog geen roosters gegenereerd.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const cols     = document.getElementById('formaat').value === '5x5' ? 5 : 7;
  const modus    = weergaveModus();
  const metKader = modus === 'kader' && cols === 7 && !oplossingModus;

  // Bepaal aantal pagina's (max 4 roosters per pagina)
  const perPagina   = 4;
  const aantalPages = Math.ceil(grids.length / perPagina);

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const { roosterB, roosterH, rijH, offsets, kaderH } = pdfBerekenLayout(
    Math.min(grids.length, perPagina), cols, metKader
  );

  for (let pagina = 0; pagina < aantalPages; pagina++) {
    if (pagina > 0) doc.addPage();

    const yStart   = pdfTekenKop(doc, oplossingModus, pagina + 1, aantalPages);
    const startIdx = pagina * perPagina;
    const eindIdx  = Math.min(startIdx + perPagina, grids.length);
    const gridsOpPagina = grids.slice(startIdx, eindIdx);

    // Bereken per rij de extra y door antwoordkaders van vorige rijen
    const rijExtraY = {};
    let extraYTotaal = 0;

    for (let i = 0; i < gridsOpPagina.length; i++) {
      const g        = gridsOpPagina[i];
      const kolIdx   = i % 2;
      const rijIdx   = Math.floor(i / 2);
      const xOff     = offsets[i].x;

      // Extra Y door vorige rijen met kader
      if (!(rijIdx in rijExtraY)) {
        rijExtraY[rijIdx] = extraYTotaal;
      }
      const yOff = yStart + rijIdx * rijH + rijExtraY[rijIdx];

      if (metKader) {
        const ontbrekend = [];
        for (let r = 0; r < cols; r += 2) {
          for (let c = 0; c < cols; c += 2) {
            if (g.display[r][c] === '___') ontbrekend.push(g.full[r][c]);
          }
        }
        if (ontbrekend.length > 0) {
          const kadH = pdfTekenAntwoordKader(doc, ontbrekend, xOff, yOff, roosterB);
          if (kolIdx === 0) {
            // Update extra hoogte voor volgende rij
            const nieuweExtraY = yOff + kadH + roosterH + 6 - (yStart + (rijIdx + 1) * rijH);
            extraYTotaal += Math.max(0, nieuweExtraY);
          }
          pdfTekenRooster(doc, oplossingModus ? g.full : g.display, g.display,
            xOff, yOff + kadH, roosterB, cols, oplossingModus);
        } else {
          pdfTekenRooster(doc, oplossingModus ? g.full : g.display, g.display,
            xOff, yOff, roosterB, cols, oplossingModus);
        }
      } else {
        pdfTekenRooster(doc, oplossingModus ? g.full : g.display, g.display,
          xOff, yOff, roosterB, cols, oplossingModus);
      }
    }
  }

  const bestandsnaam = oplossingModus ? 'rekenvierkant-sleutel.pdf' : 'rekenvierkant-werkblad.pdf';
  doc.save(bestandsnaam);
}

/* ─── EVENT LISTENERS ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('downloadPdfBtn').addEventListener('click', () => {
    genereerPDF(false);
  });
  document.getElementById('downloadPdfOplBtn').addEventListener('click', () => {
    genereerPDF(true);
  });
});
/* ═══════════════════════════════════════════════════════════════════════════
   REKENVIERKANT  –  pdf-engine.js
   Ondersteunt tot 8 roosters verdeeld over 2 pagina's (4 per pagina).
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

/* ─── CANVAS VOOR ÉÉN PAGINA ─────────────────────────────────────────────── */
function maakPdfCanvasPagina(oplossingModus, gridIndices) {
  const cols = document.getElementById('formaat').value==='5x5' ? 5 : 7;
  const rows = cols;
  const modus = weergaveModus();
  const metKader = modus === 'kader' && cols === 7 && !oplossingModus;
  const n = gridIndices.length;
  const {cw, ch, enkB, enkH, offsets} = berekenLayout(n, cols);

  const schaal = 2;
  const extraCh = metKader ? Math.ceil(n/2) * 110 : 0;
  const tmpC   = document.createElement('canvas');
  tmpC.width   = cw * schaal;
  tmpC.height  = (ch + extraCh) * schaal;
  const tCtx   = tmpC.getContext('2d');
  tCtx.scale(schaal, schaal);
  tCtx.fillStyle = '#ffffff';
  tCtx.fillRect(0, 0, cw, ch + extraCh);

  const rijOffset = {};
  gridIndices.forEach((gi, idx) => {
    const g = state.grids[gi]; if (!g) return;
    const data = oplossingModus ? g.full : g.display;
    const kolIdx = idx % 2;
    const rijIdx = Math.floor(idx / 2);

    let extraY = 0;
    if (metKader) {
      for (let r=0; r<rijIdx; r++) extraY += (rijOffset[r] || 110);
    }

    const baseX = offsets[idx].x;
    const baseY = offsets[idx].y + extraY;

    if (metKader) {
      const ontbrekend = [];
      for (let r=0; r<rows; r+=2) for (let c=0; c<cols; c+=2) {
        if (g.display[r][c] === '___') ontbrekend.push(g.full[r][c]);
      }
      if (ontbrekend.length > 0) {
        const kH = tekenAntwoordKader(tCtx, ontbrekend, baseX, baseY, enkB);
        if (kolIdx === 0) rijOffset[rijIdx] = kH;
        tekenGrid(tCtx, data, g.display, baseX, baseY + kH, enkB/cols, enkH/rows, cols, rows, false);
      } else {
        tekenGrid(tCtx, data, g.display, baseX, baseY, enkB/cols, enkH/rows, cols, rows, false);
      }
    } else {
      tekenGrid(tCtx, data, g.display, baseX, baseY, enkB/cols, enkH/rows, cols, rows, oplossingModus);
    }
  });
  return tmpC;
}

/* ─── HEADER TEKENEN (naam/datum/titel/opdracht) ─────────────────────────── */
function tekenPdfHeader(doc, oplossingModus, pgW, pgH, MARGE_L, MARGE_R) {
  let curY = 14;

  // Naam & datum
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text('Naam:', MARGE_L, curY);
  doc.line(MARGE_L + 14, curY + 0.5, MARGE_L + 80, curY + 0.5);
  doc.text('Datum:', MARGE_L + 88, curY);
  doc.line(MARGE_L + 104, curY + 0.5, pgW - MARGE_R, curY + 0.5);
  curY += 12;

  // Titel
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(11, 79, 153);
  doc.text('Rekenvierkant', pgW / 2, curY, {align: 'center'});
  curY += 5;
  doc.setDrawColor(11, 79, 153);
  doc.setLineWidth(0.6);
  doc.line(MARGE_L, curY, pgW - MARGE_R, curY);
  curY += 7;

  // Opdrachtzin / sleutel-label
  const kadW = pgW - MARGE_L - MARGE_R;
  const kadH = 9;
  if (!oplossingModus) {
    doc.setFillColor(234, 243, 255);
    doc.setDrawColor(180, 210, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(MARGE_L, curY, kadW, kadH, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(30, 60, 110);
    doc.text('Vul het rekenvierkant aan.', MARGE_L + 4, curY + 6);
  } else {
    doc.setFillColor(255, 249, 235);
    doc.setDrawColor(220, 170, 60);
    doc.setLineWidth(0.4);
    doc.roundedRect(MARGE_L, curY, kadW, kadH, 2, 2, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(130, 80, 0);
    doc.text('✓  Correctiesleutel – niet voor leerlingen', MARGE_L + 4, curY + 6);
  }
  curY += kadH + 6;
  return curY;
}

/* ─── PDF GENEREREN ──────────────────────────────────────────────────────── */
function maakPdf(oplossingModus, bestandsnaam) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('jsPDF is niet geladen. Controleer je internetverbinding en herlaad de pagina.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc      = new jsPDF('p', 'mm', 'a4');
  const pgW      = doc.internal.pageSize.getWidth();
  const pgH      = doc.internal.pageSize.getHeight();
  const MARGE_L  = 15;
  const MARGE_R  = 15;

  // Splits roosters in groepen van max 4 per pagina
  const geldigeIndices = state.grids.map((g,i) => g ? i : null).filter(i => i !== null);
  const paginaGroepen  = [];
  for (let i = 0; i < geldigeIndices.length; i += 4) {
    paginaGroepen.push(geldigeIndices.slice(i, i + 4));
  }
  if (paginaGroepen.length === 0) paginaGroepen.push([]);

  paginaGroepen.forEach((groep, pIdx) => {
    if (pIdx > 0) doc.addPage();

    // Header op elke pagina
    const curY = tekenPdfHeader(doc, oplossingModus, pgW, pgH, MARGE_L, MARGE_R);

    if (groep.length === 0) return;

    // Canvas voor deze pagina
    const tmpC   = maakPdfCanvasPagina(oplossingModus, groep);
    const dataUrl = tmpC.toDataURL('image/png');

    const beschikW = pgW - MARGE_L - MARGE_R;
    const beschikH = pgH - curY - 12;
    const ratio    = tmpC.width / tmpC.height;

    let imgW = beschikW;
    let imgH = imgW / ratio;

    // Bij 1 rooster: beperk de breedte
    if (groep.length === 1) {
      const maxW = beschikW * 0.55;
      if (imgW > maxW) { imgW = maxW; imgH = imgW / ratio; }
    }

    if (imgH > beschikH) { imgH = beschikH; imgW = imgH * ratio; }

    const imgX = (pgW - imgW) / 2;
    doc.addImage(dataUrl, 'PNG', imgX, curY, imgW, imgH);

    // Paginanummer bij meerdere pagina's
    if (paginaGroepen.length > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`${pIdx + 1} / ${paginaGroepen.length}`, pgW / 2, pgH - 8, {align: 'center'});
    }
  });

  doc.save(bestandsnaam);
}

/* ─── EVENT LISTENERS ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('downloadPdfBtn').addEventListener('click', () => {
    maakPdf(false, 'rekenvierkant-werkblad.pdf');
  });
  document.getElementById('downloadPdfOplBtn').addEventListener('click', () => {
    maakPdf(true, 'rekenvierkant-sleutel.pdf');
  });
});
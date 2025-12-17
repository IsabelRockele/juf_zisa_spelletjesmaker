/* =========================================================
   SPLITSEN – PDF
   1-op-1 overgenomen uit bewerkingen_werkblad_versie3.js
   (benen + huisje; puntoefening later)
   ========================================================= */

function drawSplitsHuisPDF(doc, centerX, y, oef) {
  // compacter huisje (origineel)
  const r = 1, breedte = 32, hoogteDak = 10, hoogteKamer = 12;
  const left = centerX - breedte / 2;

  const topText = oef.isSom ? '___' : String(oef.totaal);
  const L = oef.isSom ? String(oef.deel1) : (oef.prefill === 'links'  ? String(oef.deel1) : '___');
  const R = oef.isSom ? String(oef.deel2) : (oef.prefill === 'rechts' ? String(oef.deel2) : '___');

  const dakBaseline   = y + hoogteDak - 2;
  const kamerBaseline = (yy) => yy + hoogteKamer - 2;

  doc.setLineWidth(0.5);
  doc.setDrawColor(51, 51, 51);
  doc.setFillColor(224, 242, 247);
  doc.roundedRect(left, y, breedte, hoogteDak, r, r, 'FD');

  const yKamers = y + hoogteDak;
  doc.setDrawColor(204, 204, 204);
  doc.roundedRect(left, yKamers, breedte, hoogteKamer, r, r, 'D');
  doc.line(centerX, yKamers, centerX, yKamers + hoogteKamer);

  doc.setFont('Helvetica', 'bold'); doc.setFontSize(13);
  doc.text(topText, centerX, dakBaseline, { align: 'center' });

  doc.setFont('Helvetica', 'normal'); doc.setFontSize(13);
  doc.text(L, centerX - breedte / 4, kamerBaseline(yKamers), { align: 'center' });
  doc.text(R, centerX + breedte / 4, kamerBaseline(yKamers), { align: 'center' });
}

function drawSplitsBenenPDF(doc, centerX, y, oef) {
  // compacter benen (origineel)
  const r = 1.2, topW = 12, topH = 9, horiz = 6, boxW = 11, boxH = 10;

  const topText = oef.isSom ? '___' : String(oef.totaal);
  const L = oef.isSom ? String(oef.deel1) : (oef.prefill === 'links'  ? String(oef.deel1) : '___');
  const R = oef.isSom ? String(oef.deel2) : (oef.prefill === 'rechts' ? String(oef.deel2) : '___');

  doc.setFillColor(224, 242, 247);
  doc.setDrawColor(51, 51, 51);
  doc.roundedRect(centerX - topW / 2, y, topW, topH, r, r, 'FD');

  doc.setFont('Helvetica', 'bold'); doc.setFontSize(13);
  doc.text(topText, centerX, y + topH - 2, { align: 'center' });

  const bottomTopY = y + topH + 7;
  doc.line(centerX, y + topH, centerX - horiz, bottomTopY);
  doc.line(centerX, y + topH, centerX + horiz, bottomTopY);

  doc.setDrawColor(204, 204, 204);
  doc.roundedRect(centerX - horiz - boxW / 2, bottomTopY, boxW, boxH, r, r, 'D');
  doc.roundedRect(centerX + horiz - boxW / 2, bottomTopY, boxW, boxH, r, r, 'D');

  doc.setFont('Helvetica', 'normal'); doc.setFontSize(13);
  doc.text(L, centerX - horiz, bottomTopY + boxH - 2, { align: 'center' });
  doc.text(R, centerX + horiz, bottomTopY + boxH - 2, { align: 'center' });
}

function drawPuntKolomPDF(doc, xCenter, y, tekst) {
  const boxW = 45, boxH = 12, r = 3;
  const left = xCenter - boxW/2;
  doc.setDrawColor(200, 225, 245);
  doc.roundedRect(left, y - 9, boxW, boxH, r, r, 'D');
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(14);
  doc.text(tekst, xCenter, y, { align: 'center' });
}

/**
 * Publieke functie die bundel_pdf.js aanroept
 * layout: { x, y, colWidth, lineHeight }
 */
export function drawSplitsPDF(doc, cfg, oef, layout) {
  const { x, y, colWidth } = layout;

  // centerX zoals in de oude PDF-plaatsing
  const centerX = x + (colWidth / 2);

  if (cfg.splitsStijl === 'benen') {
    drawSplitsBenenPDF(doc, centerX, y, oef);
    return;
  }

  if (cfg.splitsStijl === 'huisje') {
    drawSplitsHuisPDF(doc, centerX, y, oef);
    return;
  }

  if (cfg.splitsStijl === 'puntoefening') {
    let pText;
    if (oef.prefill === 'links') {
      pText = `${oef.totaal} = ${oef.deel1} + ___`;
    } else if (oef.prefill === 'rechts') {
      pText = `${oef.totaal} = ___ + ${oef.deel2}`;
    } else {
      pText = `${oef.totaal} = ___ + ___`;
    }
    drawPuntKolomPDF(doc, centerX, y, pText);
    return;
  }

  // bewerkingen4 later
}

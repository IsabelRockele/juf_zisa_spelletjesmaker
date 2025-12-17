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

/* =========================================================
   SPLITS + 4 BEWERKINGEN — PDF (oude stijl + lichtblauw kader per oefening)
   ========================================================= */
export function drawSplitsPlusVierPDF(doc, oef, layout) {
  const { x, y, w } = layout;   // w = kaartbreedte

  const h = 92;                 // kaart-hoogte (compact zoals vroeger)
  const pad = 4;

  // lichtblauwe kader per oefening
  doc.setDrawColor(190, 220, 245);
  doc.setLineWidth(0.6);
  doc.roundedRect(x, y, w, h, 3, 3);

  const midX = x + w / 2;

  // ---- mini "benen"-huisje (oude look: geen felblauw, grijs/zwart) ----
  const topW = 12, topH = 12;
  const boxW = 12, boxH = 12;
  const horiz = 12;

  // bovenste vak (lichtblauw gevuld zoals uw andere splitstypes)
  doc.setFillColor(224, 242, 247);
  doc.setDrawColor(51, 51, 51);
  doc.setLineWidth(0.5);
  doc.roundedRect(midX - topW / 2, y + pad, topW, topH, 2, 2, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(String(oef.totaal), midX, y + pad + topH - 2, { align: 'center' });

  // benen
  const legTopY = y + pad + topH;
  const legBotY = legTopY + 10;
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.6);
  doc.line(midX, legTopY, midX - horiz, legBotY);
  doc.line(midX, legTopY, midX + horiz, legBotY);

  // onderste vakjes (lichtgrijze rand)
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  doc.roundedRect(midX - horiz - boxW / 2, legBotY, boxW, boxH, 2, 2, 'D');
  doc.roundedRect(midX + horiz - boxW / 2, legBotY, boxW, boxH, 2, 2, 'D');

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(12);
  if (oef.prefill === 'links')  doc.text(String(oef.deel1), midX - horiz, legBotY + boxH - 2, { align: 'center' });
  if (oef.prefill === 'rechts') doc.text(String(oef.deel2), midX + horiz, legBotY + boxH - 2, { align: 'center' });

  // ---- 4 bewerkingen (zoals vroeger: lijntjes, geen rare “−” tekens) ----
  // Gebruik gewone '-' i.p.v. '−' om font-problemen te vermijden
  const ops = ['+', '+', '-', '-'];

  // helper: schrijf-lijntje
  function lijn(cx, yy, len) {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(cx - len / 2, yy, cx + len / 2, yy);
  }

  doc.setFontSize(12);
  const startY = y + 48;
  const rowGap = 13;

  for (let i = 0; i < 4; i++) {
    const yy = startY + i * rowGap;

    // __ + __ = __
    lijn(midX - 18, yy, 8);
    doc.text(ops[i], midX - 6, yy + 1, { align: 'center' });
    lijn(midX + 6, yy, 8);
    doc.text('=', midX + 18, yy + 1, { align: 'center' });
    lijn(midX + 28, yy, 8);
  }

  // kaarthoogte teruggeven (voor y-stap in bundel_pdf.js)
  return h;
}


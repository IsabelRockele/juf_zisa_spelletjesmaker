/* =========================================================
   TAFELS INZICHTELIJK – PDF (adapter)
   Delegeert PDF-tekenen naar bestaande TI-engine
   ========================================================= */

export function drawTafelsInzichtPDF(doc, cfg, oef, layout) {

  if (window.TI && typeof window.TI.drawPDF === 'function') {
    // TI tekent zelf de PDF
    window.TI.drawPDF(doc, layout.x, layout.y, oef, layout.index || 0);
  } else {
    doc.text(
      'Tafels inzichtelijk PDF niet beschikbaar.',
      layout.x,
      layout.y + 10
    );
  }

}

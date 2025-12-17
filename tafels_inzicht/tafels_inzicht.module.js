/* =========================================================
   TAFELS INZICHTELIJK – MODULE
   Centrale ingang voor inzichtelijke tafeloefeningen
   ========================================================= */

import { renderTafelsInzichtPreview } from './tafels_inzicht.preview.js';
import { drawTafelsInzichtPDF } from './tafels_inzicht.pdf.js';

export const TafelsInzichtModule = {

  generate(cfg) {
    // Wordt later ingevuld
    return null;
  },

  renderPreview(cfg, grid) {
    renderTafelsInzichtPreview(cfg, grid);
  },

  renderPDF(doc, cfg, oef, layout) {
    drawTafelsInzichtPDF(doc, cfg, oef, layout);
  }

};

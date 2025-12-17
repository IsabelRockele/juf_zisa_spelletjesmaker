/* =========================================================
   SPLITSEN – MODULE
   Centrale ingang voor splits-oefeningen
   ========================================================= */

import { genereerSplitsing } from './splits.generator.js';
import { renderSplitsPreview } from './splits.preview.js';
import { drawSplitsPDF } from './splits.pdf.js';

export const SplitsModule = {

  generate(cfg) {
    return genereerSplitsing(cfg);
  },

  renderPreview(cfg, grid) {
    renderSplitsPreview(cfg, grid);
  },

  renderPDF(doc, cfg, oef, layout) {
    drawSplitsPDF(doc, cfg, oef, layout);
  }

};

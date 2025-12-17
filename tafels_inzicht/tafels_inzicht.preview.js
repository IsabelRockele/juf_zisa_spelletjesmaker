/* =========================================================
   TAFELS INZICHTELIJK – PREVIEW (adapter)
   Delegeert preview naar bestaande TI-engine
   ========================================================= */

export function renderTafelsInzichtPreview(cfg, grid) {

  if (window.TI && typeof window.TI.renderPreview === 'function') {
    // TI beheert zelf hoe de preview getekend wordt
    window.TI.renderPreview(grid, cfg, null, cfg._tiIndex || 0);
  } else {
    const div = document.createElement('div');
    div.textContent = 'Tafels inzichtelijk preview niet beschikbaar.';
    grid.appendChild(div);
  }

}

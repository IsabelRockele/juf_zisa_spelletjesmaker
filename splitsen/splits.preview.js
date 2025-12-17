/* =========================================================
   SPLITSEN – PREVIEW (SPLITSBENEN)
   1-op-1 logica uit bewerkingen_werkblad_versie3.js
   Met lokale delete-helper (geen externe import)
   ========================================================= */

/* ---------- lokale helper: appendWithDelete ---------- */
function appendWithDelete(grid, oefDiv, cfg, oef) {
  const wrap = document.createElement('div');
  wrap.className = 'oef-wrap';
  wrap.style.position = 'relative';
  wrap.style.display = 'inline-block';

const del = document.createElement('button');
del.textContent = '×';
del.className = 'delete-oef';
del.style.position = 'absolute';
del.style.top = '-26px';        // duidelijk boven het kader
del.style.right = '4px';
del.style.border = 'none';
del.style.cursor = 'pointer';
del.style.background = 'transparent';
del.style.color = '#c0392b';
del.style.fontWeight = '700';
del.style.fontSize = '18px';
del.style.lineHeight = '1';




  del.addEventListener('click', () => {
    const idx = cfg._oefeningen.indexOf(oef);
    if (idx >= 0) {
      cfg._oefeningen.splice(idx, 1);
    }
    wrap.remove();
  });

  wrap.appendChild(oefDiv);
  wrap.appendChild(del);
  grid.appendChild(wrap);
}

/* ---------- preview renderer ---------- */
export function renderSplitsBenentraining(cfg, grid) {

  if (!Array.isArray(cfg._oefeningen)) return;

  cfg._oefeningen.forEach(oef => {

    if (oef.type !== 'splitsen') return;

    const isSom = !!oef.isSom;

    const inner = document.createElement('div');
    inner.className = 'splitsbenen';
    inner.style.overflow = 'visible';

    inner.innerHTML = `
      <div class="top">${isSom ? '___' : String(oef.totaal)}</div>

      <div class="benen-container">
        <div class="been links"></div>
        <div class="been rechts"></div>
      </div>

      <div class="bottom">
        <div class="bottom-deel">
          ${isSom
            ? String(oef.deel1)
            : (oef.prefill === 'links' ? String(oef.deel1) : '___')}
        </div>
        <div class="bottom-deel">
          ${isSom
            ? String(oef.deel2)
            : (oef.prefill === 'rechts' ? String(oef.deel2) : '___')}
        </div>
      </div>
    `;

    const oefDiv = document.createElement('div');
    oefDiv.className = 'oefening';
    oefDiv.style.display = 'flex';
    oefDiv.style.justifyContent = 'center';
    oefDiv.style.overflow = 'visible';

    oefDiv.appendChild(inner);

    appendWithDelete(grid, oefDiv, cfg, oef);
  });
}
/* =========================================================
   SPLITSEN – PREVIEW (SPLITSHUIZEN)
   ========================================================= */

export function renderSplitsHuisje(cfg, grid) {

  if (!Array.isArray(cfg._oefeningen)) return;

  cfg._oefeningen.forEach(oef => {

    const huis = document.createElement('div');
    huis.className = 'splitshuis';

    // 1-op-1 look van vroeger (vakjes + dak)
    huis.style.display = 'inline-grid';
    huis.style.gridTemplateColumns = '1fr 1fr';
    huis.style.border = '2px solid #333';
    huis.style.borderRadius = '6px';
    huis.style.overflow = 'hidden';
    huis.style.background = '#fff';
    huis.style.width = '72px';
    huis.style.textAlign = 'center';
    huis.style.fontWeight = '700';
    huis.style.fontSize = '15px';

    const top = document.createElement('div');
    top.style.gridColumn = '1 / span 2';
    top.style.borderBottom = '1px solid #999';
    top.style.padding = '2px 0';
    top.style.background = '#e0f2f7';
    top.textContent = oef.isSom ? '___' : String(oef.totaal);
    huis.appendChild(top);

    const left = document.createElement('div');
    const right = document.createElement('div');

    left.style.padding = '6px 0';
    right.style.padding = '6px 0';
    left.style.borderRight = '1px solid #ddd';

    left.textContent  = oef.isSom ? String(oef.deel1) : (oef.prefill === 'links'  ? String(oef.deel1) : '___');
    right.textContent = oef.isSom ? String(oef.deel2) : (oef.prefill === 'rechts' ? String(oef.deel2) : '___');

    huis.appendChild(left);
    huis.appendChild(right);

    const oefDiv = document.createElement('div');
    oefDiv.className = 'oefening';
    oefDiv.style.display = 'flex';
    oefDiv.style.justifyContent = 'center';
    oefDiv.style.overflow = 'visible';
    oefDiv.appendChild(huis);

    appendWithDelete(grid, oefDiv, cfg, oef);
  });
}

/* ---------- preview renderer: puntoefening ---------- */
export function renderSplitsPuntoefening(cfg, grid) {
  if (!Array.isArray(cfg._oefeningen)) return;

  cfg._oefeningen.forEach(oef => {
    if (oef.type !== 'splitsen') return;

    const div = document.createElement('div');
    div.className = 'oefening';
    div.style.width = '100%';
    div.style.display = 'flex';
    div.style.justifyContent = 'center';
    div.style.overflow = 'visible';

    const inner = document.createElement('div');
    inner.style.fontFamily = "'Courier New', Courier, monospace";
    inner.style.fontSize = '1.2em';
    inner.style.textAlign = 'center';

    let pText;
    if (oef.prefill === 'links')      pText = `${oef.totaal} = ${oef.deel1} + ___`;
    else if (oef.prefill === 'rechts')pText = `${oef.totaal} = ___ + ${oef.deel2}`;
    else                               pText = `${oef.totaal} = ___ + ___`;

    inner.textContent = pText;

    div.appendChild(inner);
    appendWithDelete(grid, div, cfg, oef);
  });
}

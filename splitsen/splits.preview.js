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
  // ❌ Geen kleine splitshuizen tekenen voor grote splitshuizen
if (cfg.groteSplitshuizen) return;


  if (!Array.isArray(cfg._oefeningen)) return;

  cfg._oefeningen.forEach(oef => {
    if (oef.type !== 'splitsen') return;


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

/* ---------- preview renderer: SPLITS + 4 BEWERKINGEN (oud uitzicht) ---------- */
export function renderSplitsPlusVier(cfg, grid) {
  if (!Array.isArray(cfg._oefeningen)) return;

  // 3 per rij zoals in de oude versie
  grid.style.display = 'grid';
  // max 3 grote splitshuizen per rij
grid.style.display = 'grid';
grid.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
grid.style.columnGap = '22px';
grid.style.rowGap = '18px';
grid.style.justifyItems = 'center';


  grid.style.columnGap = '22px';
  grid.style.rowGap = '18px';
  grid.style.justifyItems = 'center';

  cfg._oefeningen.forEach(oef => {
    if (oef.type !== 'splitsen') return;

    const kaart = document.createElement('div');
    kaart.className = 'oefening oefening-bewerkingen4';
    kaart.style.position = 'relative';
    kaart.style.width = '240px';
    kaart.style.background = '#fff';
    kaart.style.padding = '14px 12px 12px 12px';
    kaart.style.boxSizing = 'border-box';
    kaart.style.overflow = 'visible';

    // --- mini-splitshuis bovenaan (zoals oude preview) ---
    const mini = document.createElement('div');
    mini.style.position = 'relative';
    mini.style.width = '160px';
    mini.style.height = '74px';
    mini.style.margin = '0 auto';
    mini.style.overflow = 'visible';

    const top = document.createElement('div');
    top.style.position = 'absolute';
    top.style.left = '50%';
    top.style.transform = 'translateX(-50%)';
    top.style.top = '0';
    top.style.width = '60px';
    top.style.height = '24px';
    top.style.border = '2px solid #333';
    top.style.borderRadius = '8px';
    top.style.background = '#e0f2f7';
    top.style.display = 'flex';
    top.style.alignItems = 'center';
    top.style.justifyContent = 'center';
    top.style.fontWeight = '700';
    top.textContent = (oef.isSom ? '___' : String(oef.totaal));
    mini.appendChild(top);

    const legLeft  = document.createElement('div');
    const legRight = document.createElement('div');
    [legLeft, legRight].forEach(l => {
      l.style.position = 'absolute';
      l.style.width = '4px';
      l.style.background = '#333';
      l.style.height = '34px';
      l.style.top = '24px';
      l.style.borderRadius = '2px';
    });
    legLeft.style.left = 'calc(50% - 18px)';
    legLeft.style.transform = 'skewX(-18deg)';
    legRight.style.left = 'calc(50% + 16px)';
    legRight.style.transform = 'skewX(18deg)';
    mini.appendChild(legLeft);
    mini.appendChild(legRight);

    const boxL = document.createElement('div');
    const boxR = document.createElement('div');
    [boxL, boxR].forEach(b => {
      b.style.position = 'absolute';
      b.style.width = '58px';
      b.style.height = '24px';
      b.style.border = '2px solid #bbb';
      b.style.borderRadius = '8px';
      b.style.bottom = '0';
      b.style.display = 'flex';
      b.style.alignItems = 'center';
      b.style.justifyContent = 'center';
      b.style.fontFamily = 'Arial, Helvetica, sans-serif';
      b.style.fontSize = '18px';
      b.style.background = '#fff';
    });
    boxL.style.left = 'calc(50% - 58px)';
    boxR.style.left = 'calc(50% + 0px)';

    const L = oef.isSom ? String(oef.deel1) : (oef.prefill === 'links'  ? String(oef.deel1) : '___');
    const R = oef.isSom ? String(oef.deel2) : (oef.prefill === 'rechts' ? String(oef.deel2) : '___');
    boxL.textContent = L;
    boxR.textContent = R;

    mini.appendChild(boxL);
    mini.appendChild(boxR);

    kaart.appendChild(mini);

    // --- 4 bewerkingen (2x + en 2x −) ---
    const lijnen = document.createElement('div');
    lijnen.style.marginTop = '16px';
    lijnen.style.display = 'grid';
    lijnen.style.rowGap = '10px';
    lijnen.style.justifyItems = 'center';

    function maakLeeg(w=40) {
      const s = document.createElement('span');
      s.style.display = 'inline-block';
      s.style.width = w + 'px';
      s.style.height = '18px';
      s.style.borderBottom = '2px solid #000';
      s.style.verticalAlign = 'middle';
      return s;
    }
    function maakRij(op) {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '10px';
      row.style.fontSize = '20px';
      row.style.lineHeight = '1';
      row.appendChild(maakLeeg(42));
      const opSpan = document.createElement('span'); opSpan.textContent = op;
      row.appendChild(opSpan);
      row.appendChild(maakLeeg(42));
      const eq = document.createElement('span'); eq.textContent = '=';
      row.appendChild(eq);
      row.appendChild(maakLeeg(46));
      return row;
    }

    lijnen.appendChild(maakRij('+'));
    lijnen.appendChild(maakRij('+'));
    lijnen.appendChild(maakRij('−'));
    lijnen.appendChild(maakRij('−'));

    kaart.appendChild(lijnen);

    // delete per oefening (kleine X, via helper)
    appendWithDelete(grid, kaart, cfg, oef);
  });
}
/* =========================================================
   SPLITSEN – PREVIEW (GROTE SPLITSHUIZEN)
   ========================================================= */
export function renderGroteSplitshuizen(cfg, grid) {
    // altijd eerst leegmaken
  grid.innerHTML = '';

  // 3 kolommen zoals in je oude versie
  grid.style.display = 'grid';

  grid.style.columnGap = '24px';
  grid.style.rowGap = '24px';
  grid.style.justifyItems = 'center';
  grid.style.alignItems = 'start';

      // ===== PREVIEW: grote splitshuizen opbouwen uit UI-keuze =====
  const fijn =
  cfg.splitsFijn ||
  cfg.settings?.splitsFijn ||
  cfg.settings?.settings?.splitsFijn ||
  {};

  const getallen = [];

  if (fijn.tot5) getallen.push(5);
  if (fijn.van6) getallen.push(6);
  if (fijn.van7) getallen.push(7);
  if (fijn.van8) getallen.push(8);
  if (fijn.van9) getallen.push(9);
  if (fijn.van10) getallen.push(10);
  if (fijn.van10tot20) getallen.push(20);
// ===== aantal kolommen bepalen voor preview =====
const aantal = getallen.length;

if (aantal <= 4) {
  // 1 rij (1–4 huizen)
  grid.style.gridTemplateColumns = `repeat(${aantal}, 140px)`;
} else {
  // meerdere rijen, max 3 per rij (bv. 5 → 3 + 2)
  grid.style.gridTemplateColumns = 'repeat(3, 140px)';
}

  getallen.forEach(maxGetal => {


    const kaart = document.createElement('div');
    kaart.style.fontFamily = 'Arial,Helvetica,sans-serif';
    kaart.style.border = '1px solid #e5e5e5';
    kaart.style.borderRadius = '12px';
    kaart.style.overflow = 'hidden';
    kaart.style.width = '140px';
    kaart.style.background = '#fff';
    kaart.style.boxShadow = '0 1px 2px rgba(0,0,0,0.06)';

    const header = document.createElement('div');
    header.textContent = String(maxGetal);
    header.style.background = '#e0f2f7';
    header.style.borderBottom = '1px solid #c7c7c7';
    header.style.textAlign = 'center';
    header.style.fontWeight = '700';
    header.style.height = '36px';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'center';
    header.style.fontSize = '16px';
    kaart.appendChild(header);

    // Afwisselend links/rechts invullen
    let fillLeft = true;
    for (let r = 0; r <= maxGetal; r++) {
      const row = document.createElement('div');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = '1fr 1fr';
      row.style.columnGap = '8px';
      row.style.padding = '0 10px';

      const left = document.createElement('div');
      const right = document.createElement('div');
      [left, right].forEach(cell => {
        cell.style.height = '28px';
        cell.style.display = 'flex';
        cell.style.alignItems = 'center';
        cell.style.justifyContent = 'center';
        cell.style.borderBottom = '1px solid #ededed';
        cell.style.fontWeight = '600';
      });

      const a = r;
      const b = maxGetal - r;

      if (fillLeft) {
        left.textContent = String(a);
        right.textContent = '___';
      } else {
        left.textContent = '___';
        right.textContent = String(b);
      }
      fillLeft = !fillLeft;

      row.appendChild(left);
      row.appendChild(right);
      kaart.appendChild(row);
    }

    const oefDiv = document.createElement('div');
    oefDiv.className = 'oefening';
    oefDiv.style.display = 'flex';
    oefDiv.style.justifyContent = 'center';
    oefDiv.style.overflow = 'visible';
    oefDiv.appendChild(kaart);

    appendWithDelete(grid, oefDiv, cfg, { type: 'splitsen_groot', max: maxGetal });
  });

}
/* =========================================================
   SPLITSEN – PREVIEW DISPATCHER
   ========================================================= */
export function renderSplitsPreview(cfg, grid) {
  if (!cfg || !grid) return;

  // Prioriteit: grote splitshuizen
  if (cfg.groteSplitshuizen) {
    renderGroteSplitshuizen(cfg, grid);
    return;
  }

  // Anders: stijl kiezen
  const stijl = cfg.splitsStijl || 'benen';

  if (stijl === 'huisje') {
    renderSplitsHuisje(cfg, grid);
    return;
  }
  if (stijl === 'puntoefening') {
    renderSplitsPuntoefening(cfg, grid);
    return;
  }
  if (stijl === 'bewerkingen4') {
    renderSplitsPlusVier(cfg, grid);
    return;
  }

  // default
  renderSplitsBenentraining(cfg, grid);
}

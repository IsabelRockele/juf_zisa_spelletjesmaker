/* =========================================================
   HOOFDREKENEN – PREVIEW (EXACTE OVERNAME – GEFIXT)
   ========================================================= */

import {
  genereerRekensom,
  genereerRekensomMetCompenseren,
  somHeeftBrug
} from './hoofdrekenen.generator.js';

/* ================================
   NO-OP paginering (compat)
   ================================ */
function paginatePreview(){}

/* ================================
   TITEL
   ================================ */
function titelVoor(cfg) {
  if (cfg.opdracht && String(cfg.opdracht).trim()) return String(cfg.opdracht).trim();
  if (cfg.hoofdBewerking === 'rekenen') return 'Los de sommen op.';
  return 'Maak de oefeningen.';
}

function voegOefeningToe(cfg) {
  const comp = !!(cfg.rekenHulp && cfg.rekenHulp.stijl === 'compenseren');
  const oef = comp
    ? genereerRekensomMetCompenseren(cfg)
    : genereerRekensom(cfg);

  if (!oef || oef.getal1 == null || oef.getal2 == null) return null;

  cfg._oefeningen.push(oef);

  // ook opslaan in bundel
  let bundel = JSON.parse(localStorage.getItem('werkbladBundel') || '[]');
  bundel = bundel.map(seg => {
    if (seg.settings?.segmentId === cfg.segmentId) {
      seg.settings._oefeningen = cfg._oefeningen;
    }
    return seg;
  });
  localStorage.setItem('werkbladBundel', JSON.stringify(bundel));

  return oef;
}

/* ================================
   HULPMIDDELEN
   ================================ */
function tekenInlineSplitsOnderTerm(wrapper, term) {
  const tens = Math.floor(term / 10) * 10;
  const ones = term % 10;

  const box = document.createElement('div');
  box.style.display = 'grid';
  box.style.gridTemplateColumns = '1fr 1fr';
  box.style.gap = '10px';
  box.style.marginTop = '8px';

  const vak = (t) => {
    const d = document.createElement('div');
    d.textContent = t;
    d.style.border = '1px solid #bbb';
    d.style.borderRadius = '10px';
    d.style.padding = '8px';
    d.style.minWidth = '50px';
    d.style.textAlign = 'center';
    return d;
  };

  box.appendChild(vak(tens));
  box.appendChild(vak(ones));
  wrapper.appendChild(box);
}

/* ================================
   OEFENING RENDER
   ================================ */
function appendWithDelete(grid, cfg, oef, div) {
  const del = document.createElement('button');
  del.textContent = '🗑';
  del.style.marginLeft = '8px';
  del.style.cursor = 'pointer';

  del.onclick = () => {
    const i = cfg._oefeningen.indexOf(oef);
    if (i > -1) cfg._oefeningen.splice(i, 1);

    let bundel = JSON.parse(localStorage.getItem('werkbladBundel') || '[]');
    bundel = bundel.map(seg => {
      if (seg.settings?.segmentId === cfg.segmentId) {
        seg.settings._oefeningen = cfg._oefeningen;
      }
      return seg;
    });
    localStorage.setItem('werkbladBundel', JSON.stringify(bundel));

    div.remove();
  };

  div.appendChild(del);
  grid.appendChild(div);
}

function renderOefening(grid, cfg, oef) {
  const div = document.createElement('div');
  div.style.whiteSpace = 'nowrap';

  const hulp = cfg.rekenHulp?.inschakelen;
  const brug = somHeeftBrug(oef.getal1, oef.getal2, oef.operator);

  if (hulp && brug) {
    div.style.display = 'grid';
    div.style.gridTemplateColumns = 'max-content 1fr';
    div.style.columnGap = '20px';

    const links = document.createElement('div');
    links.textContent = `${oef.getal1} ${oef.operator} ${oef.getal2} =`;

    const rechts = document.createElement('div');
    if (cfg.rekenHulp.stijl === 'splitsbenen') {
      tekenInlineSplitsOnderTerm(rechts, oef.getal2);
    }

    div.appendChild(links);
    div.appendChild(rechts);
  } else {
    div.textContent = `${oef.getal1} ${oef.operator} ${oef.getal2} =`;
  }

  appendWithDelete(grid, cfg, oef, div);
}

/* =========================================================
   SEGMENT RENDER
   ========================================================= */
export function renderHoofdrekenenSegment(container, segment) {
  const cfg = segment?.settings || segment;
  // =====================================
// AUTO-SANERING VAN OUDE / ONGELDIGE SEGMENTEN
// =====================================
if (!cfg.rekenMaxGetal) return;

// Somtypes beperken volgens bereik
const max = cfg.rekenMaxGetal;

if (max <= 10) {
  cfg.somTypes = ['E+E'];
  cfg.rekenBrug = 'zonder';
}

if (max <= 20) {
  cfg.somTypes = (cfg.somTypes || []).filter(t =>
    ['E+E', 'TE+E'].includes(t)
  );
}

// Als alles eruit gefilterd is → veilige fallback
if (!cfg.somTypes || cfg.somTypes.length === 0) {
  cfg.somTypes = ['E+E'];
}

// Oefeningen die niet meer passen → weg
cfg._oefeningen = null;

  if (!cfg || cfg.hoofdBewerking !== 'rekenen') return;

  if (!cfg.segmentId) cfg.segmentId = 'rekenen_' + Date.now();

  const card = document.createElement('div');
  card.style.border = '1px solid #ddd';
  card.style.borderRadius = '14px';
  card.style.padding = '14px';
  card.style.marginBottom = '18px';

  /* titel + delete opdracht */
  const titleRow = document.createElement('div');
  titleRow.style.display = 'flex';
  titleRow.style.alignItems = 'center';
titleRow.style.gap = '10px';
  titleRow.style.marginBottom = '10px';

  const title = document.createElement('input');
title.type = 'text';
title.value = titelVoor(cfg);
title.placeholder = 'Opdrachtzin…';

title.style.fontWeight = '700';
title.style.border = '1px solid #ccc';
title.style.borderRadius = '8px';
title.style.padding = '6px 10px';
title.style.width = '100%';
title.style.maxWidth = '480px';
title.style.marginRight = '10px';

title.addEventListener('input', () => {
  cfg.opdracht = title.value;

  // 🔴 ook opslaan in werkbladBundel
  let bundel = JSON.parse(localStorage.getItem('werkbladBundel') || '[]');
  bundel = bundel.map(seg => {
    if (seg.settings?.segmentId === cfg.segmentId) {
      seg.settings.opdracht = cfg.opdracht;
    }
    return seg;
  });
  localStorage.setItem('werkbladBundel', JSON.stringify(bundel));
});


  const delSeg = document.createElement('button');
  delSeg.textContent = '🗑';
  delSeg.onclick = () => {
    let bundel = JSON.parse(localStorage.getItem('werkbladBundel') || '[]');
    bundel = bundel.filter(s => s.settings?.segmentId !== cfg.segmentId);
    localStorage.setItem('werkbladBundel', JSON.stringify(bundel));
    card.remove();
  };

  titleRow.appendChild(title);
  titleRow.appendChild(delSeg);
  card.appendChild(titleRow);

// ➕ Oefeningen toevoegen (met aantal)
const addWrap = document.createElement('div');
addWrap.style.display = 'flex';
addWrap.style.alignItems = 'center';
addWrap.style.gap = '6px';
addWrap.style.marginBottom = '10px';

// knop
const addBtn = document.createElement('input');
addBtn.type = 'button';
addBtn.value = '+ oefening';
addBtn.style.padding = '6px 8px';
addBtn.style.fontSize = '12px';
addBtn.style.borderRadius = '6px';
addBtn.style.border = '1px solid #bbb';
addBtn.style.background = '#e6e6e6';
addBtn.style.color = '#222';
addBtn.style.cursor = 'pointer';


// invoerveld aantal
const addAantal = document.createElement('input');
addAantal.type = 'number';
addAantal.min = '1';
addAantal.max = '50';
addAantal.value = '1';
addAantal.title = 'Aantal oefeningen toevoegen';
addAantal.style.width = '52px';
addAantal.style.padding = '6px 6px';
addAantal.style.fontSize = '12px';
addAantal.style.borderRadius = '6px';
addAantal.style.border = '1px solid #bbb';
addAantal.style.textAlign = 'center';

// infotekst
const addInfo = document.createElement('span');
addInfo.textContent = 'Typ het aantal oefeningen dat u wil toevoegen.';
addInfo.style.fontSize = '12px';
addInfo.style.color = '#555';
addInfo.style.marginLeft = '6px';

// klikgedrag
addBtn.addEventListener('click', () => {
  const n = Math.max(1, Number(addAantal.value) || 1);

  for (let i = 0; i < n; i++) {
    const oef = voegOefeningToe(cfg);
    if (!oef) break;
    renderOefening(grid, cfg, oef);
  }

  if (typeof paginatePreview === 'function') paginatePreview();
});

// samenstellen
// samenstellen
addWrap.appendChild(addBtn);
addWrap.appendChild(addAantal);
addWrap.appendChild(addInfo);
card.appendChild(addWrap);




  /* grid */
  const grid = document.createElement('div');
  grid.style.display = 'grid';

  const hulp = cfg.rekenHulp?.inschakelen;
  grid.style.gridTemplateColumns = hulp ? 'repeat(2,1fr)' : 'repeat(3,1fr)';
  grid.style.gap = hulp ? '32px' : '20px';

  /* ================================
     OEFENINGEN – 1x GENEREREN
     ================================ */
  let oefeningen;

  const N = Number(cfg.numOefeningen || cfg.aantal || 20);

  if (!Array.isArray(cfg._oefeningen)) {
    oefeningen = [];
    const seen = new Set();
    let guard = 0;

    while (oefeningen.length < N && guard++ < N * 25) {
      const oef = cfg.rekenHulp?.stijl === 'compenseren'
        ? genereerRekensomMetCompenseren(cfg)
        : genereerRekensom(cfg);

      if (!oef || oef.getal1 == null || oef.getal2 == null) continue;

      const key = `${oef.operator}|${oef.getal1},${oef.getal2}`;
      if (!seen.has(key)) {
        seen.add(key);
        oefeningen.push(oef);
      }
    }

    cfg._oefeningen = oefeningen;

    let bundel = JSON.parse(localStorage.getItem('werkbladBundel') || '[]');
    bundel = bundel.map(seg => {
      if (seg.settings?.segmentId === cfg.segmentId) {
        seg.settings._oefeningen = cfg._oefeningen;
      }
      return seg;
    });
    localStorage.setItem('werkbladBundel', JSON.stringify(bundel));
  }

  oefeningen = cfg._oefeningen;

  oefeningen.forEach(oef => renderOefening(grid, cfg, oef));

  card.appendChild(grid);
  container.appendChild(card);
}

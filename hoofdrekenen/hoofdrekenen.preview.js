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
const werkbladContainer =
  document.getElementById('werkblad-container') || document.body;

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
  // 👉 markeer ALLEEN de eerste oefening van deze opdracht/dit segment als voorbeeld
if (
  comp &&
  cfg?.rekenHulp?.voorbeeld === true &&
  Array.isArray(cfg._oefeningen) &&
  cfg._oefeningen.length === 0
) {
  oef._voorbeeld = true;
}


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
function tekenInlineSplitsOnderTerm(exprWrap, oef, rechtsKolom, cfg) {
  const span1 = exprWrap.querySelector('.term1');
  const span2 = exprWrap.querySelector('.term2');
  const ansBox = exprWrap.querySelector('.ansbox');

  let target = span2; // optellen: onder tweede term
  if (oef.operator === '-') {
    const plaats = (cfg.rekenHulp?.splitsPlaatsAftrekken || 'onderAftrektal');
    target = (plaats === 'onderAftrekker') ? span2 : span1;
  }

  const oefDiv = exprWrap.closest('.oefening');
  if (oefDiv) { oefDiv.style.overflow = 'visible'; oefDiv.style.position = 'relative'; }
  exprWrap.style.overflow = 'visible'; exprWrap.style.position = 'relative';
  werkbladContainer.style.overflow = 'visible';

  const wrapRect = exprWrap.getBoundingClientRect();
  const tRect = target.getBoundingClientRect();
  const aRect = ansBox.getBoundingClientRect();

  const anchorX = tRect.left + tRect.width / 2 - wrapRect.left;
  const apexY = tRect.bottom - wrapRect.top + 3;

  const horiz = 14, boxW = 26, boxH = 22, r = 6;
  const bottomTopY = apexY + 12;
  const svgH = Math.ceil(bottomTopY + boxH + 6);
  const baseW = Math.max(exprWrap.clientWidth, exprWrap.scrollWidth);
  const svgW = Math.max(baseW, anchorX + horiz + boxW / 2 + 4);

  if (parseFloat(getComputedStyle(exprWrap).minHeight || '0') < svgH) exprWrap.style.minHeight = `${svgH}px`;
  exprWrap.style.paddingBottom = '2px';

  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', svgW);
  svg.setAttribute('height', svgH);
  svg.style.position = 'absolute';
  svg.style.left = '0';
  svg.style.top = '0';
  svg.style.pointerEvents = 'none';
  svg.style.overflow = 'visible';

  const el = (n, a) => {
    const e = document.createElementNS(NS, n);
    for (const k in a) e.setAttribute(k, a[k]);
    return e;
  };

  svg.appendChild(el('line', { x1: anchorX, y1: apexY, x2: anchorX - horiz, y2: bottomTopY, stroke: '#333', 'stroke-width': 2 }));
  svg.appendChild(el('line', { x1: anchorX, y1: apexY, x2: anchorX + horiz, y2: bottomTopY, stroke: '#333', 'stroke-width': 2 }));
  svg.appendChild(el('rect', { x: anchorX - horiz - boxW / 2, y: bottomTopY, width: boxW, height: boxH, rx: r, ry: r, fill: '#fff', stroke: '#ddd', 'stroke-width': 2 }));
  svg.appendChild(el('rect', { x: anchorX + horiz - boxW / 2, y: bottomTopY, width: boxW, height: boxH, rx: r, ry: r, fill: '#fff', stroke: '#ddd', 'stroke-width': 2 }));

  const t1 = el('text', { x: anchorX - horiz, y: bottomTopY + boxH - 6, 'text-anchor': 'middle', 'font-family': 'Arial,Helvetica,sans-serif', 'font-size': '14' });
  t1.textContent = '___';
  const t2 = el('text', { x: anchorX + horiz, y: bottomTopY + boxH - 6, 'text-anchor': 'middle', 'font-family': 'Arial,Helvetica,sans-serif', 'font-size': '14' });
  t2.textContent = '___';

  svg.appendChild(t1);
  svg.appendChild(t2);

  // oude overlays opruimen (zodat her-renderen niet stapelt)
  const old = exprWrap.querySelector('svg._splitsbenen');
  if (old) old.remove();
  svg.classList.add('_splitsbenen');

  exprWrap.appendChild(svg);
}

function tekenCompenseerOnderTerm(exprWrap, oef, rechtsKolom, cfg) {
  try {
    const span1  = exprWrap.querySelector('.term1');
    const opEl   = exprWrap.querySelector('.op');
    const span2  = exprWrap.querySelector('.term2');
    const ansBox = exprWrap.querySelector('.ansbox');
    if (!span1 || !span2 || !ansBox) return;

    exprWrap.style.whiteSpace = 'nowrap';
    exprWrap.style.position   = 'relative';
    exprWrap.style.overflow   = 'visible';

    const wr = exprWrap.getBoundingClientRect();
    const r2 = span2.getBoundingClientRect();
    const a  = Number(oef.getal1), b = Number(oef.getal2);
    const isMin = (oef.operator === '-');
    const isVoorbeeld = !!(cfg && cfg.rekenHulp && cfg.rekenHulp.voorbeeld && oef && oef._voorbeeld);
    const op = isMin ? '-' : '+';

    // overlay opruimen
    exprWrap.querySelectorAll('svg.comp-overlay, .comp-box').forEach(n => n.remove());

    const NS  = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.classList.add('comp-overlay');
    svg.setAttribute('width',  Math.ceil(wr.width));
    svg.setAttribute('height', Math.ceil(wr.height));
    Object.assign(svg.style, { position:'absolute', left:'0', top:'0', pointerEvents:'none', overflow:'visible' });

    const cx = r2.left - wr.left + r2.width/2;
    const cy = r2.top  - wr.top  + r2.height*0.55;
    const rx = r2.width/2 + 6;
    const ry = r2.height*0.65;

    const ellipse = document.createElementNS(NS,'ellipse');
    ellipse.setAttribute('cx', cx); ellipse.setAttribute('cy', cy);
    ellipse.setAttribute('rx', rx); ellipse.setAttribute('ry', ry);
    ellipse.setAttribute('fill', 'none');
    ellipse.setAttribute('stroke', '#333'); ellipse.setAttribute('stroke-width', '2');
    svg.appendChild(ellipse);

    const tailY = cy + ry + 3;
    const tipY  = tailY + 16;

    const shaft = document.createElementNS(NS,'line');
    shaft.setAttribute('x1', cx); shaft.setAttribute('y1', tailY);
    shaft.setAttribute('x2', cx); shaft.setAttribute('y2', tipY);
    shaft.setAttribute('stroke', '#333'); shaft.setAttribute('stroke-width', '2');
    svg.appendChild(shaft);

    const headL = document.createElementNS(NS,'line');
    headL.setAttribute('x1', cx); headL.setAttribute('y1', tipY);
    headL.setAttribute('x2', cx-6); headL.setAttribute('y2', tipY-6);
    headL.setAttribute('stroke', '#333'); headL.setAttribute('stroke-width', '2');
    svg.appendChild(headL);

    const headR = document.createElementNS(NS,'line');
    headR.setAttribute('x1', cx); headR.setAttribute('y1', tipY);
    headR.setAttribute('x2', cx+6); headR.setAttribute('y2', tipY-6);
    headR.setAttribute('stroke', '#333'); headR.setAttribute('stroke-width', '2');
    svg.appendChild(headR);

    exprWrap.appendChild(svg);

    // compenseerbox
    const box = document.createElement('div');
    box.className = 'comp-box';
    box.style.position = 'absolute';
    box.style.left = `${Math.max(0, cx - 64)}px`;
    box.style.top  = `${tipY + 6}px`;
    box.style.zIndex = '5';
    box.style.width = '128px';
    box.style.height = '32px';
    box.style.border = '2px solid #333';
    box.style.borderRadius = '10px';
    box.style.display = 'grid';
    box.style.gridTemplateColumns = '1fr 1fr';
    box.style.gap = '8px';
    box.style.padding = '6px 8px';
    box.style.background = '#fff';

   const vak = () => {
  const d = document.createElement('div');
  d.style.border = '1px solid #bbb';
  d.style.borderRadius = '8px';
  d.style.display = 'flex';
  d.style.alignItems = 'center';
  d.style.justifyContent = 'center';
  d.style.fontWeight = '700';
  d.style.fontSize = '14px';
  d.style.minWidth = '44px';
  d.style.height = '22px';
  d.textContent = '____';
  return d;
};


    const L = vak();
    const R = vak();
    box.append(L, R);

// standaard: geen tekens, lege vakjes
L.textContent = '_____';
R.textContent = '_____';

// alleen tekens tonen als leerkracht dit koos
if (cfg?.rekenHulp?.tekens) {
  if (oef.operator === '+') {
    L.textContent = '+ ____';
    R.textContent = '− ____';
  } else {
    L.textContent = '− ____';
    R.textContent = '+ ____';
  }
}


    // voorbeeld: vul de compensatie zoals in versie2 (met kleuren + stappen rechts)
    if (isVoorbeeld) {
      function compPair(op, bVal) {
        const absB = Math.abs(bVal);
        if (op === '+') {
          if (absB % 10 === 0) { const up = Math.ceil(absB / 100) * 100; return { first:+up, second: -(up - absB) }; }
          else                 { const up = Math.ceil(absB / 10) * 10;   return { first:+up, second: -(up - absB) }; }
        } else {
          if (absB % 10 === 0) { const up = Math.ceil(absB / 100) * 100; return { first:-up, second:+(up - absB) }; }
          else                 { const up = Math.ceil(absB / 10) * 10;   return { first:-up, second:+(up - absB) }; }
        }
      }
      const pair = compPair(op, b);
      L.innerHTML = `<span style="color:#c00000">${pair.first >= 0 ? '+' : ''}${Math.abs(pair.first)}</span>`;
      R.innerHTML = `<span style="color:#0058c0">${pair.second >= 0 ? '+' : ''}${Math.abs(pair.second)}</span>`;

      const t1 = a + pair.first;
      const t2 = t1 + pair.second;

      if (rechtsKolom) {
        rechtsKolom.innerHTML = '';
        const stap = document.createElement('div');
        stap.style.fontSize = '12px';
        stap.style.lineHeight = '1.25';
        stap.style.marginTop = '4px';
        const s1 = `${a} ${pair.first >= 0 ? '+' : '-'} ${Math.abs(pair.first)} = ${t1}`;
        const s2 = `${t1} ${pair.second >= 0 ? '+' : '-'} ${Math.abs(pair.second)} = ${t2}`;
        stap.innerHTML = `${s1}<br>${s2}`;
        rechtsKolom.appendChild(stap);
      }

      ansBox.textContent = String(t2);
    }

    // hoogte reserveren (zoals versie2)
    const BOX_H = 32;
    const MARGIN_BELOW = 8;
    const neededInside = (tipY + 6) + BOX_H + MARGIN_BELOW;
    const extra = Math.max(0, neededInside - exprWrap.clientHeight);
    exprWrap.style.paddingBottom = extra ? `${extra}px` : exprWrap.style.paddingBottom;

    const oefDiv = exprWrap.closest('.oefening');
if (oefDiv) {
  // zorg dat het oefenkader altijd onder het compenseervak eindigt
  const totalNeeded =
    exprWrap.offsetTop +
    (tipY + 6) +   // pijl
    BOX_H +        // compenseerbox
    12;            // extra ademruimte

  oefDiv.style.minHeight = `${Math.ceil(totalNeeded)}px`;
}

    exprWrap.appendChild(box);

  } catch (e) {
    console.warn('tekenCompenseerOnderTerm (preview) error:', e);
  }
}


/* ================================
   OEFENING RENDER
   ================================ */
function appendWithDelete(grid, cfg, oef, div) {
const del = document.createElement('button');
del.textContent = '🗑';
del.style.position = 'absolute';
del.style.top = '8px';
del.style.right = '8px';
del.style.cursor = 'pointer';
del.style.zIndex = '10';
del.style.background = '#0b4d7a';
del.style.color = '#fff';
del.style.border = '0';
del.style.borderRadius = '8px';
del.style.width = '32px';
del.style.height = '32px';


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
  div.className = 'oefening';
  div.style.whiteSpace = 'nowrap';
  div.style.position = 'relative';
  div.style.overflow = 'visible';
  div.style.border = '1px solid #ddd';
  div.style.borderRadius = '12px';
  div.style.padding = '10px';
  div.style.background = '#fff';

// 🟧 Voorbeeldoefening visueel markeren
if (oef._voorbeeld === true) {
  div.style.border = '2px solid #f59e0b';   // oranje rand
  div.style.background = '#fff7ed';         // licht oranje achtergrond
}

  const hulp = cfg.rekenHulp?.inschakelen;
  const brug = somHeeftBrug(oef.getal1, oef.getal2, oef.operator);

  if (hulp && brug) {
  div.style.display = 'grid';
  div.style.gridTemplateColumns = 'max-content 1fr';
  div.style.columnGap = '20px';

  const links = document.createElement('div');
  links.className = 'exprwrap';
  links.style.display = 'inline-block';
  links.style.overflow = 'visible';
  links.innerHTML = `
    <span class="term1">${oef.getal1}</span>
    <span class="op"> ${oef.operator} </span>
    <span class="term2">${oef.getal2}</span>
    <span> = </span>
    <span class="ansbox" style="display:inline-block;width:46px;height:30px;border:2px solid #333;border-radius:8px;vertical-align:middle;margin-left:6px;"></span>
  `;

  const rechts = document.createElement('div');
  rechts.style.overflow = 'visible';

  // Schrijflijnen rechts (zoals versie2), maar alleen als aangevinkt
  if (cfg.rekenHulp?.schrijflijnen) {
    rechts.innerHTML = `
      <div style="border-bottom:2px solid #333;height:18px;margin:8px 0;width:160px;max-width:100%"></div>
      <div style="border-bottom:2px solid #333;height:18px;margin:8px 0;width:160px;max-width:100%"></div>
    `;
  }

  div.appendChild(links);
  div.appendChild(rechts);

  // teken pas na layout (anders kloppen rects niet)
  requestAnimationFrame(() => {
    const stijl = (cfg.rekenHulp && cfg.rekenHulp.stijl) || 'splitsbenen';
    if (stijl === 'compenseren') {
      tekenCompenseerOnderTerm(links, oef, rechts, cfg);
    } else {
      tekenInlineSplitsOnderTerm(links, oef, rechts, cfg);
    }
  });

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
    ['E+E', 'TE+E', 'T-E', 'T+TE'].includes(t)
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
        // 👉 eerste oefening van deze opdracht = voorbeeldoefening
if (
  cfg?.rekenHulp?.stijl === 'compenseren' &&
  cfg?.rekenHulp?.voorbeeld === true &&
  oefeningen.length === 0
) {
  oef._voorbeeld = true;
}

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

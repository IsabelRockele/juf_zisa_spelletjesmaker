/* =========================================================
   HOOFDREKENEN – PREVIEW (EXACTE OVERNAME – GEFIXT)
   ========================================================= */
import { genereerHoofdrekenenV2 } from '../hoofdrekenen_versie2/hoofdrekenen_v2.generator.js';

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
  if (cfg.opdracht && String(cfg.opdracht).trim()) {
    return String(cfg.opdracht).trim();
  }

  if (cfg?.rekenHulp?.stijl === 'compenseren') {
    switch (cfg.rekenHulp.compenseerModus) {
      case 'begeleid':
        return 'Reken handig door te compenseren. Gebruik het omcirkelde getal en het hulpkader.';
      case 'half':
        return 'Reken handig door te compenseren. Kies zelf welk getal je aanpast en gebruik het hulpkader.';
      case 'zelfstandig':
        return 'Zoek zelf een handig getal om te compenseren. Omcirkel het getal en reken met tussenstappen.';
    }
  }

  return 'Los de sommen op.';
}


function voegOefeningToe(cfg) {
  const comp = !!(cfg.rekenHulp && cfg.rekenHulp.stijl === 'compenseren');
  let oef;

const res = genereerHoofdrekenenV2({
  ...cfg,
  aantalOefeningen: 1,
  _seed: Math.random()
});
oef = Array.isArray(res) ? res[0] : res;

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

  if (cfg?.rekenHulp?.compenseerModus === 'begeleid') {
  exprWrap.appendChild(svg);
}
}

function tekenCompenseerOnderTerm(exprWrap, oef, rechtsKolom, cfg) {
    // ❌ Bij zelfstandig compenseren: geen enkele visuele hulp
  if (cfg?.rekenHulp?.compenseerModus === 'zelfstandig') {
    return;
  }

  try {
    const span1  = exprWrap.querySelector('.term1');
    const span2  = exprWrap.querySelector('.term2');
    const ansBox = exprWrap.querySelector('.ansbox');
    if (!span1 || !span2 || !ansBox) return;

    exprWrap.style.whiteSpace = 'nowrap';
    exprWrap.style.position   = 'relative';
    exprWrap.style.overflow   = 'visible';

    const g1 = Number(oef.getal1);
    const g2 = Number(oef.getal2);

    // --- SLIMME KANDIDAAT KEUZE ---
    const getDist = (val) => {
       const abs = Math.abs(val);
       // Volgend tiental vinden
       let next = Math.ceil(abs/10)*10;
       if (abs % 10 === 0) next += 10; 
       
       // Als we heel dicht bij 100 zitten (bv 98), is dat vaak het doel
       const nextHonderd = Math.ceil(abs/100)*100;
       if (nextHonderd - abs <= 3) next = nextHonderd;

       return { 
         dist: next - abs, 
         nextVal: next, 
         isCandidate: (abs%10 >= 6 || abs%10 === 0 && (abs/10)%10 >= 7) 
       }; 
    };

    const d1 = getDist(g1);
    const d2 = getDist(g2);

    let isTargetG1 = false;

    // Logica: wie is de beste kandidaat?
    if (d1.isCandidate && !d2.isCandidate) {
        isTargetG1 = true;
    } else if (!d1.isCandidate && d2.isCandidate) {
        isTargetG1 = false;
    } else if (d1.isCandidate && d2.isCandidate) {
        if (d1.dist < d2.dist) isTargetG1 = true;
        else isTargetG1 = false;
    } else {
        // Fallback: kleinste afstand
        if (d1.dist < d2.dist) isTargetG1 = true;
    }

    const targetEl = isTargetG1 ? span1 : span2;
    
    // POSITIE BEPALEN
    const wr = exprWrap.getBoundingClientRect();
    const rTarget = targetEl.getBoundingClientRect();
    
    // Oude zooi opruimen
    exprWrap.querySelectorAll('svg.comp-overlay, .comp-box').forEach(n => n.remove());

    const NS  = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.classList.add('comp-overlay');
    // SVG groot genoeg maken
    svg.setAttribute('width',  Math.ceil(wr.width));
    svg.setAttribute('height', Math.ceil(wr.height + 100)); 
    Object.assign(svg.style, { position:'absolute', left:'0', top:'0', pointerEvents:'none', overflow:'visible' });

    // Cirkel positie
    const cx = rTarget.left - wr.left + rTarget.width/2;
    const cy = rTarget.top  - wr.top  + rTarget.height*0.55;
    const rx = rTarget.width/2 + 6;
    const ry = rTarget.height*0.65;

    const tailY = cy + ry + 3;
    const tipY  = tailY + 16;

    // Tekenen
    const ellipse = document.createElementNS(NS,'ellipse');
    ellipse.setAttribute('cx', cx); ellipse.setAttribute('cy', cy);
    ellipse.setAttribute('rx', rx); ellipse.setAttribute('ry', ry);
    ellipse.setAttribute('fill', 'none');
    ellipse.setAttribute('stroke', '#333'); ellipse.setAttribute('stroke-width', '2');
    svg.appendChild(ellipse);

    const shaft = document.createElementNS(NS,'line');
    shaft.setAttribute('x1', cx); shaft.setAttribute('y1', tailY);
    shaft.setAttribute('x2', cx); shaft.setAttribute('y2', tipY);
    shaft.setAttribute('stroke', '#333'); shaft.setAttribute('stroke-width', '2');
    svg.appendChild(shaft);

    const p1 = document.createElementNS(NS,'line');
    p1.setAttribute('x1', cx); p1.setAttribute('y1', tipY);
    p1.setAttribute('x2', cx-6); p1.setAttribute('y2', tipY-6);
    p1.setAttribute('stroke', '#333'); p1.setAttribute('stroke-width', '2');
    svg.appendChild(p1);

    const p2 = document.createElementNS(NS,'line');
    p2.setAttribute('x1', cx); p2.setAttribute('y1', tipY);
    p2.setAttribute('x2', cx+6); p2.setAttribute('y2', tipY-6);
    p2.setAttribute('stroke', '#333'); p2.setAttribute('stroke-width', '2');
    svg.appendChild(p2);

    if (cfg?.rekenHulp?.compenseerModus === 'begeleid') {
  exprWrap.appendChild(svg);
}


    // VAKJES (BOX)
    const box = document.createElement('div');
    box.className = 'comp-box';
    Object.assign(box.style, {
        position: 'absolute',
        left: `${Math.max(0, cx - 64)}px`,
        top:  `${tipY + 6}px`,
        zIndex: '5',
        width: '128px',
        height: '34px', // Iets hoger voor zekerheid
        border: '2px solid #333',
        borderRadius: '10px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        padding: '6px 8px',
        background: '#fff'
    });

    const vak = (txt) => {
      const d = document.createElement('div');
      Object.assign(d.style, {
          border: '1px solid #bbb', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: '700', fontSize: '14px', minWidth: '44px', height: '22px'
      });
      d.textContent = txt || '____';
      return d;
    };

    let L, R;
    if (cfg?.rekenHulp?.tekens) {
      if (oef.operator === '+') {
         L = vak('+ ____'); R = vak('− ____');
      } else {
         L = vak('− ____'); R = vak('+ ____');
      }
    } else {
      L = vak('_____'); R = vak('_____');
    }
    box.append(L, R);

    // EERST TOEVOEGEN aan DOM
    if (cfg?.rekenHulp?.compenseerModus !== 'zelfstandig') {
  exprWrap.appendChild(box);
}


    // --- RUIMTE MAKEN (FIX) ---
    // We berekenen hoe diep de box komt.
    // tipY = punt van de pijl. +6px margin + 34px box hoogte + 12px padding box + marge onder.
    // Laten we zeggen: box stopt op tipY + 60px.
    const bottomOfTool = tipY + 65; 
    
    // We moeten zorgen dat exprWrap deze hoogte 'voelt'. 
    // De tekst zelf is ongeveer 30px hoog.
    const textHeight = 30;
    
    // Voeg padding toe aan de wrapper zodat de parent div (het kader) mee rekt
    if (bottomOfTool > textHeight) {
        exprWrap.style.paddingBottom = `${bottomOfTool - textHeight}px`;
    }

    // Voor de zekerheid ook de parent .oefening expliciet zetten
    const oefDiv = exprWrap.closest('.oefening');
    if (oefDiv) {
        oefDiv.style.minHeight = `${bottomOfTool + 20}px`; // 20px extra buffer onderaan
    }

    // VOORBEELD INVULLEN
    if (oef._voorbeeld) {
        const info = isTargetG1 ? d1 : d2;
        const delta = info.dist;
        
        L.innerHTML = `<span style="color:#c00000">+${delta}</span>`;

        let corrVal = -delta; 
        if (oef.operator === '-') {
            if (!isTargetG1) corrVal = +delta; 
            else corrVal = -delta;
        }
        
        const teken = corrVal >= 0 ? '+' : '−';
        R.innerHTML = `<span style="color:#0058c0">${teken}${Math.abs(corrVal)}</span>`;
        
        if (rechtsKolom) {
             const rounded = info.nextVal;
             let s1, s2, res1, res2;
             
             if (oef.operator === '+') {
                 if (isTargetG1) { 
                     res1 = rounded + g2; s1 = `${rounded} + ${g2} = ${res1}`;
                 } else { 
                     res1 = g1 + rounded; s1 = `${g1} + ${rounded} = ${res1}`;
                 }
                 res2 = res1 - delta; s2 = `${res1} − ${delta} = ${res2}`;
             } else {
                 if (isTargetG1) { 
                     res1 = rounded - g2; s1 = `${rounded} − ${g2} = ${res1}`;
                     res2 = res1 - delta; s2 = `${res1} − ${delta} = ${res2}`;
                 } else { 
                     res1 = g1 - rounded; s1 = `${g1} − ${rounded} = ${res1}`;
                     res2 = res1 + delta; s2 = `${res1} + ${delta} = ${res2}`;
                 }
             }
             
             ansBox.textContent = res2; 
             rechtsKolom.innerHTML = '';
             const stapDiv = document.createElement('div');
             stapDiv.style.marginTop = '10px';
             stapDiv.style.lineHeight = '1.5';
             stapDiv.style.fontSize = '16px';
             stapDiv.innerHTML = `${s1}<br>${s2}`;
             rechtsKolom.appendChild(stapDiv);
        }
    }

  } catch (e) {
    console.warn('tekenCompenseerOnderTerm error:', e);
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
function isGeschiktVoorCompenseren(oef, cfg) {
  const g1 = oef.getal1;
  const g2 = oef.getal2;
  const op = oef.operator;

  const e1 = g1 % 10;
  const e2 = g2 % 10;

  // =====================
  // AFTREKKEN
  // =====================
  if (op === '-') {
    // brug nodig
    if (e1 >= e2) return false;

    // aftrekker moet 6–9 hebben
    if (![6, 7, 8, 9].includes(e2)) return false;

    // tot 100: tientallen aftrekker ≤ aftrektal
    if (cfg.rekenMaxGetal <= 100) {
      const t1 = Math.floor(g1 / 10);
      const t2 = Math.floor(g2 / 10);
      if (t2 > t1) return false;
    }

    return true;
  }

  // =====================
  // OPTELLEN
  // =====================
  if (op === '+') {
    // B1: tweede getal compenseerbaar
    if (
      [6, 7, 8, 9].includes(e2) &&
      e1 + e2 >= 10
    ) {
      return true;
    }

    // B2: eerste getal compenseerbaar
    if ([6, 7, 8, 9].includes(e1)) {
      const rest = 10 - e1;
      if (e2 >= rest) return true;
    }

    return false;
  }


  return false;
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

const hulp = (cfg.rekenHulp?.inschakelen !== false);
const stijl = cfg.rekenHulp?.stijl;
const brug  = somHeeftBrug(oef.getal1, oef.getal2, oef.operator);

const toonHulpmiddel =
  hulp && (
    stijl === 'splitsbenen' ||
    stijl === 'compenseren'
  );

if (toonHulpmiddel) {

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
    <div style="border-bottom:2px solid #333;height:18px;margin:14px 0;width:160px;max-width:100%"></div>
    <div style="border-bottom:2px solid #333;height:18px;margin:14px 0;width:160px;max-width:100%"></div>
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
  
 // 🔒 Clone: preview mag settings niet muteren
const cfg = JSON.parse(JSON.stringify(segment?.settings || segment));
// 🔁 FIX: voorkom vastgelopen lege cache bij aftrekken tot 100
if (cfg.rekenMaxGetal === 100 && cfg.rekenType === 'aftrekken') {
  cfg._oefeningen = null;
  cfg._dirty = true;
}

// 🔁 Zorg dat operator altijd correct gezet is
if (!cfg.operator && cfg.rekenType) {
  if (cfg.rekenType === 'aftrekken') cfg.operator = '-';
  if (cfg.rekenType === 'optellen')  cfg.operator = '+';
}

console.log(
  'PREVIEW START',
  'operator=', cfg.operator,
  'rekenType=', cfg.rekenType,
  'rekenMaxGetal=', cfg.rekenMaxGetal,
  'somTypes=', cfg.somTypes
);


// 🔁 rekenType → operator (nodig voor V2)
if (!cfg.operator && cfg.rekenType) {
  if (cfg.rekenType === 'aftrekken') cfg.operator = '-';
  if (cfg.rekenType === 'optellen')  cfg.operator = '+';
}

// 🔁 somTypes normaliseren voor generator (optellen én aftrekken)
// "TE + TE" → "TE+TE"
if (Array.isArray(cfg.somTypes)) {
  cfg.somTypes = cfg.somTypes.map(t => t.replace(/\s+/g, ''));
}

// 🔁 brugSoort afleiden uit UI-structuur (enkel nodig vanaf tot 1000)
if (
  cfg.rekenBrug === 'met' &&
  cfg.rekenMaxGetal >= 1000 &&
  cfg.brugSoorten &&
  typeof cfg.brugSoorten === 'object'
) {
  const actief = Object.entries(cfg.brugSoorten)
    .filter(([, v]) => v === true)
    .map(([k]) => k);

  // als er exact één brugsoort actief is → doorgeven aan generator
  if (actief.length === 1) {
    cfg.brugSoort = actief[0]; // 'tiental' | 'honderdtal' | 'meervoudig'
  }
}

// ✅ Optellen met brug tot 1000 expliciet toelaten (preview)
// (tot 100 blijft ongewijzigd: daar is brug altijd naar tiental)
if (
  cfg.operator === '+' &&
  cfg.rekenBrug === 'met' &&
  cfg.rekenMaxGetal === 1000
) {
  // niets filteren of herschrijven
  // generator bepaalt geldigheid
}


// Als alles eruit gefilterd is → veilige fallback
if (!cfg.somTypes || cfg.somTypes.length === 0) {
  // alleen fallback bij <= 10
  if (cfg.rekenMaxGetal <= 10) {
    cfg.somTypes = ['E+E'];
  }
}


// Oefeningen die niet meer passen → weg


  if (!cfg) return;


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
  // 🔄 cache resetten bij wijziging instellingen
if (cfg._dirty === true) {
  cfg._oefeningen = null;
  cfg._dirty = false;
}

  if (!Array.isArray(cfg._oefeningen)) {
    oefeningen = [];
    const seen = new Set();
    let guard = 0;

    let telPlus = 0;
let telMin  = 0;
const maxPerSoort = Math.ceil(N / 2);

    while (oefeningen.length < N && guard++ < N * 25) {
      let oef;

if (cfg.rekenMaxGetal === 20) {
  // 🔁 Tot 20: elke keer een nieuwe oefening genereren
  const res = genereerHoofdrekenenV2({
    ...cfg,
    _seed: Math.random()
  });
  oef = Array.isArray(res) ? res[0] : res;

} else if (cfg.rekenMaxGetal === 100) {
  // 🔁 Tot 100: ook V2 gebruiken (anders val je terug op oude generator)
  const res = genereerHoofdrekenenV2({
    ...cfg,
    aantalOefeningen: 1,   // V2-wrapper maakt standaard 6, wij willen 1
    _seed: Math.random()
  });
  oef = Array.isArray(res) ? res[0] : res;

} else if (cfg.rekenMaxGetal === 1000) {
  const res = genereerHoofdrekenenV2({
    ...cfg,
    aantalOefeningen: 1,
    _seed: Math.random()
  });
  oef = Array.isArray(res) ? res[0] : res;
} else {
  oef = cfg.rekenHulp?.stijl === 'compenseren'
    ? genereerRekensomMetCompenseren(cfg)
    : genereerRekensom(cfg);
}



      if (!oef || oef.getal1 == null || oef.getal2 == null) continue;
      // 🔁 Bij "beide": ongeveer evenwicht + / −
if (cfg.rekenType === 'beide') {
  if (oef.operator === '+' && telPlus >= maxPerSoort) continue;
  if (oef.operator === '-' && telMin  >= maxPerSoort) continue;
}


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
if (oef.operator === '+') telPlus++;
if (oef.operator === '-') telMin++;


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
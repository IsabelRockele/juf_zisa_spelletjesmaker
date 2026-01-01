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

    // Bepaal wie we gaan compenseren (g1 of g2?)
    const g1 = Number(oef.getal1);
    const g2 = Number(oef.getal2);
    const absG1 = Math.abs(g1);
    const absG2 = Math.abs(g2);

    // Check of g2 geschikt is (7,8,9)
    const e2 = absG2 % 10;
    const t2 = Math.floor(absG2 / 10) % 10;
    const g2IsCandidate = (e2 === 7 || e2 === 8 || e2 === 9) || (e2 === 0 && (t2 === 7 || t2 === 8 || t2 === 9));

    // Check of g1 geschikt is (6,7,8,9)
    const e1 = absG1 % 10;
    const g1IsCandidate = (e1 === 6 || e1 === 7 || e1 === 8 || e1 === 9);

    // KIES DOEL: 
    // Standaard g2, tenzij die niet kan en g1 wel.
    // (Of als g2 'minder mooi' is? De generator shuffelt, dus 'soms' komt vanzelf)
    let targetEl = span2; 
    let baseVal = g2;
    let isTargetG1 = false;

    if (g2IsCandidate) {
        targetEl = span2;
        baseVal = g2;
        isTargetG1 = false;
    } else if (g1IsCandidate) {
        targetEl = span1;
        baseVal = g1;
        isTargetG1 = true;
    }

    const wr = exprWrap.getBoundingClientRect();
    const rTarget = targetEl.getBoundingClientRect();
    
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

    // Positie cirkel baseren op target (g1 of g2)
    const cx = rTarget.left - wr.left + rTarget.width/2;
    const cy = rTarget.top  - wr.top  + rTarget.height*0.55;
    const rx = rTarget.width/2 + 6;
    const ry = rTarget.height*0.65;

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
    // Box centreren onder de pijl
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

    // standaard: geen tekens
    L.textContent = '_____';
    R.textContent = '_____';

    // Tekens tonen indien gewenst
    if (cfg?.rekenHulp?.tekens) {
      // Logic: als we afronden naar boven (+), moet de correctie min (-) zijn, of andersom.
      // Dit is onafhankelijk van of we g1 of g2 compenseren, het gaat om de balans.
      // Bij optellen: eentje +, ander -.
      // Bij aftrekken: beiden + of beiden - (want -(a+b) = -a-b ?) 
      // Wacht, standaard compenseren bij aftrekken (45 - 29): 29->30 (+1), dus moet er +1 afgetrokken worden? Nee.
      // 45 - 29 = 45 - 30 + 1. 
      // Laten we de standaardtekens simpel houden voor de layout:
      if (oef.operator === '+') {
        L.textContent = '+ ____';
        R.textContent = '− ____';
      } else {
        L.textContent = '− ____';
        R.textContent = '+ ____';
      }
    }

    // VOORBEELD INVULLEN
    if (isVoorbeeld) {
      function compPair(op, val) {
        const absVal = Math.abs(val);
        // Bepaal afronding
        let up;
        if (absVal % 10 === 0) { up = Math.ceil(absVal / 100) * 100; }
        else                   { up = Math.ceil(absVal / 10) * 10; }
        
        // Verschil berekenen
        const diff = up - absVal; 
        
        // Bij optellen (+): als we de term verhogen (+diff), moeten we dat later aftrekken (-diff).
        // Bij aftrekken (-): 
        // Als we aftrekker verhogen (29->30), trekken we teveel af -> resultaat moet +1.
        // Als we aftrektal verhogen? Dat wordt zelden gedaan bij compenseren, maar logica:
        // (49 - 12) -> (50 - 12) - 1.
        
        // We houden het patroon van de preview aan:
        // Links = de aanpassing naar het ronde getal
        // Rechts = de correctie
        
        if (op === '+') {
           return { first: +diff, second: -diff };
        } else {
           // Aftrekken
           // Als we target=g2 (aftrekker) (45 - 29): 29 wordt 30 (+1). We trekken MEER af. Dus correctie is +1.
           // Als we target=g1 (aftrektal) (49 - 12): 49 wordt 50 (+1). We hebben er 1 bijverzonnen. Dus correctie is -1.
           if (isTargetG1) {
              return { first: +diff, second: -diff }; // Aftrektal: zelfde logica als optellen
           } else {
              return { first: -diff, second: +diff }; // Aftrekker: omgekeerd (wordt hierboven vaak als -up weergegeven in oude code, maar visueel 'naar 30' is +1)
              // Correctie: oude code deed het complex. Laten we simpel 'verschil' tonen.
              // Links = wat doen we met het getal? (+1)
              // Rechts = wat doen we met de som? (+1)
              // Oude code: first:-up ?? Nee, laten we gewoon de getallen tonen.
              return { first: -up, second: +(up - absVal) }; // fallback
           }
        }
      }
      
      // Herberekening voor visualisatie
      // We gebruiken een simpelere logica die voor kinderen logisch is:
      // "Ik doe er 2 bij (+2), dus moet ik er straks 2 af doen (-2)"
      
      const valToRound = baseVal;
      // Zoek het volgende tiental/honderdtal
      let nextTen;
      if (valToRound % 10 === 0) nextTen = Math.ceil(valToRound/100)*100;
      else nextTen = Math.ceil(valToRound/10)*10;
      
      const delta = nextTen - valToRound;
      
      // Tekst in vakjes
      L.innerHTML = `<span style="color:#c00000">+${delta}</span>`;
      
      // Correctie rechts hangt af van situatie
      let correctie = -delta; // Standaard (bij optellen)
      if (oef.operator === '-' && !isTargetG1) correctie = +delta; // Bij aftrekken van 2e term: +
      
      const teken = correctie >= 0 ? '+' : '−'; // Let op min-teken
      R.innerHTML = `<span style="color:#0058c0">${teken}${Math.abs(correctie)}</span>`;

      // RECHTS KOLOM: Tussenstap
      // Als g2 target (45 + 28): 45 + 30 = 75 --> 75 - 2 = 73
      // Als g1 target (98 + 45): 100 + 45 = 145 --> 145 - 2 = 143
      
      let step1, step2, res1, res2;
      
      if (oef.operator === '+') {
         if (!isTargetG1) {
             // 45 + 28(30)
             res1 = g1 + nextTen;
             step1 = `${g1} + ${nextTen} = ${res1}`;
         } else {
             // 98(100) + 45
             res1 = nextTen + g2;
             step1 = `${nextTen} + ${g2} = ${res1}`;
         }
         res2 = res1 - delta; // Altijd min de 'teveel' bij optellen
         step2 = `${res1} − ${delta} = ${res2}`;
         
      } else {
         // Aftrekken
         if (!isTargetG1) {
            // 45 - 28(30) -> teveel afgetrokken, dus erbij
            res1 = g1 - nextTen;
            step1 = `${g1} − ${nextTen} = ${res1}`;
            res2 = res1 + delta;
            step2 = `${res1} + ${delta} = ${res2}`;
         } else {
            // 48(50) - 12 -> getal groter gemaakt, dus resultaat is te groot, dus eraf
            res1 = nextTen - g2;
            step1 = `${nextTen} − ${g2} = ${res1}`;
            res2 = res1 - delta;
            step2 = `${res1} − ${delta} = ${res2}`;
         }
      }

      if (rechtsKolom) {
        rechtsKolom.innerHTML = '';
        const stap = document.createElement('div');
        stap.style.fontSize = '16px';
        stap.style.lineHeight = '1.6';
        stap.style.marginTop = '10px';
        stap.innerHTML = `${step1}<br>${step2}`;
        rechtsKolom.appendChild(stap);
      }

      ansBox.textContent = String(res2);
    }

    // hoogte reserveren
    const BOX_H = 32;
    const MARGIN_BELOW = 8;
    const neededInside = (tipY + 6) + BOX_H + MARGIN_BELOW;
    const extra = Math.max(0, neededInside - exprWrap.clientHeight);
    exprWrap.style.paddingBottom = extra ? `${extra}px` : exprWrap.style.paddingBottom;

    const oefDiv = exprWrap.closest('.oefening');
    if (oefDiv) {
      const totalNeeded = exprWrap.offsetTop + (tipY + 6) + BOX_H + 12;
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
  const cfg = segment?.settings || segment;
  // =====================================
// AUTO-SANERING VAN OUDE / ONGELDIGE SEGMENTEN
// =====================================
if (!cfg.rekenMaxGetal) return;

// Somtypes beperken volgens bereik
const max = cfg.rekenMaxGetal;

if (max <= 5) {
  cfg.somTypes = ['E+E'];
  cfg.rekenBrug = 'zonder';
}

if (max > 5 && max <= 10) {
  cfg.somTypes = ['E+E', 'T-E'];
  cfg.rekenBrug = 'zonder';
}


// Als alles eruit gefilterd is → veilige fallback
if (!cfg.somTypes || cfg.somTypes.length === 0) {
  cfg.somTypes = ['E+E'];
}

// Oefeningen die niet meer passen → weg


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

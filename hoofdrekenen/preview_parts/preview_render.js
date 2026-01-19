// preview_render.js
import { somHeeftBrug } from '../hoofdrekenen.generator.js';

// Verantwoordelijk voor: renderen van individuele oefeningen (preview)
export function renderOefening(grid, cfg, oef) {

  const div = document.createElement('div');
  div.className = 'oefening';
  div.style.whiteSpace = 'nowrap';
  div.style.position = 'relative';
  div.style.overflow = 'visible';
  div.style.border = '1px solid #ddd';
  div.style.borderRadius = '12px';
  div.style.padding = '10px';
  div.style.background = '#fff';

  // ================================
  // BRUG HERKENNEN — SPECIALE WEERGAVE
  // ================================
  if (cfg.variant === 'brugHerkennen100') {

    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.alignItems = 'center';
    div.style.gap = '12px';
    div.style.fontSize = '20px';

    // lampje
    const lampVak = document.createElement('div');
    lampVak.style.width = '64px';
    lampVak.style.height = '64px';
    lampVak.style.border = '2px solid #555';
    lampVak.style.borderRadius = '14px';
    lampVak.style.display = 'flex';
    lampVak.style.alignItems = 'center';
    lampVak.style.justifyContent = 'center';

    const img = document.createElement('img');
    img.src = '../afbeeldingen_hoofdrekenen/zisa_lamp.png';
    img.style.width = '52px';
    img.style.marginTop = '8px';
    img.style.marginLeft = '-4px';

    lampVak.appendChild(img);

    const som = document.createElement('div');
    som.textContent = `${oef.getal1} ${oef.operator} ${oef.getal2}`;
    som.style.fontWeight = '700';

    div.appendChild(lampVak);
    div.appendChild(som);

    appendWithDelete(grid, cfg, oef, div);
    return;
  }

  // 🟧 Voorbeeldoefening visueel markeren
  if (oef._voorbeeld === true) {
    div.style.border = '2px solid #f59e0b';
    div.style.background = '#fff7ed';
  }

  const hulp =
  cfg.rekenHulp?.stijl === 'aanvullen'
    ? true
    : (cfg.rekenHulp?.inschakelen !== false);

  const stijl = cfg.rekenHulp?.stijl;

  const isAanvullen =
    hulp &&
    stijl === 'aanvullen' &&
    oef.operator === '-';

  if (isAanvullen) {
    _renderAanvullenInOefening(div, cfg, oef);
    appendWithDelete(grid, cfg, oef, div);
    return;
  }

 const heeftBrug = somHeeftBrug(oef.getal1, oef.getal2, oef.operator);

const toonHulpmiddel =
  hulp && (
    stijl === 'splitsbenen' ||
    (stijl === 'compenseren' && isGeschiktVoorCompenseren(oef, cfg))
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

    if (cfg.rekenHulp?.schrijflijnen) {
      rechts.innerHTML = `
        <div style="border-bottom:2px solid #333;height:18px;margin:14px 0;width:160px;max-width:100%"></div>
        <div style="border-bottom:2px solid #333;height:18px;margin:14px 0;width:160px;max-width:100%"></div>
      `;
    }

    div.appendChild(links);
    div.appendChild(rechts);

  requestAnimationFrame(() => {
  const effectieveStijl =
    (cfg.rekenHulp && cfg.rekenHulp.stijl) || 'splitsbenen';

  if (effectieveStijl === 'compenseren') {
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

const werkbladContainer =
  document.getElementById('werkblad-container') || document.body;

// ================================
// SPLITSBENEN / COMPENSEREN — TEKENHULP (preview)
// ================================
/* ================================
   HULPMIDDELEN
   ================================ */
function tekenInlineSplitsOnderTerm(exprWrap, oef, rechtsKolom, cfg) {
  const span1 = exprWrap.querySelector('.term1');
  const span2 = exprWrap.querySelector('.term2');
  const ansBox = exprWrap.querySelector('.ansbox');

// ==========================================
// SPECIAAL: HTE ± HTE (tot 1000) → 3 splitsbenen
// ==========================================
if (
  cfg?.rekenMaxGetal === 1000 &&
  (
    (oef.operator === '+' && oef.somType === 'HTE+HTE') ||
    (oef.operator === '-' && oef.somType === 'HTE-HTE')
  )
) {
  tekenDrieSplitsOnderTerm(exprWrap, oef, rechtsKolom, cfg);
  return;
}




  let target = span2; // optellen: onder tweede term
  if (oef.operator === '-') {
    const plaats = (cfg.rekenHulp?.splitsPlaatsAftrekken || 'onderAftrektal');
    target = (plaats === 'onderAftrekker') ? span2 : span1;
  }

  const oefDiv = exprWrap.closest('.oefening');
  if (oefDiv) { oefDiv.style.overflow = 'visible'; oefDiv.style.position = 'relative'; }
  exprWrap.style.overflow = 'visible'; exprWrap.style.position = 'relative';

  const wrapRect = exprWrap.getBoundingClientRect();
  const tRect = target.getBoundingClientRect();
  const aRect = ansBox.getBoundingClientRect();

 // STANDAARD SPLITSBENEN (2) — afgestemd op TOT 100
const anchorX = tRect.left + tRect.width / 2 - wrapRect.left;

// compact houden voor kleine kaarten
const apexY = tRect.bottom - wrapRect.top + 2;

const horiz = 14, boxW = 26, boxH = 22, r = 6;
const bottomTopY = apexY + 10;

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

// ✅ SPLITSBENEN: altijd tonen wanneer hulpmiddel actief is
if (
  cfg?.rekenHulp?.inschakelen === true &&
  cfg?.rekenHulp?.stijl !== 'compenseren'
) {
  exprWrap.appendChild(svg);
}
}

function tekenDrieSplitsOnderTerm(exprWrap, oef, rechtsKolom, cfg) {
  const span2 = exprWrap.querySelector('.term2');
  if (!span2) return;

  const wrapRect = exprWrap.getBoundingClientRect();
  const tRect = span2.getBoundingClientRect();

  // HTE + HTE — ALLEEN tot 1000
// optisch iets meer naar rechts centreren onder HTE
const anchorX = tRect.left + tRect.width * 0.8 - wrapRect.left;

// meer lucht onder het getal (tot 1000)
const apexY = tRect.bottom - wrapRect.top + 10;

// bredere, rustigere spreiding
const horiz = 38;
const boxW = 26, boxH = 22, r = 6;

// vakjes iets lager plaatsen
const bottomTopY = apexY + 20;


  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.classList.add('_splitsbenen');

  svg.setAttribute('width', exprWrap.clientWidth);
  svg.setAttribute('height', bottomTopY + boxH + 10);
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

  // 3 lijnen
  [-horiz, 0, horiz].forEach(dx => {
    svg.appendChild(el('line', {
      x1: anchorX, y1: apexY,
      x2: anchorX + dx, y2: bottomTopY,
      stroke: '#333', 'stroke-width': 2
    }));
  });

  // 3 vakjes (H – T – E)
  [-horiz, 0, horiz].forEach(dx => {
    svg.appendChild(el('rect', {
      x: anchorX + dx - boxW / 2,
      y: bottomTopY,
      width: boxW,
      height: boxH,
      rx: r, ry: r,
      fill: '#fff',
      stroke: '#ddd',
      'stroke-width': 2
    }));
  });

  // oude overlays verwijderen
  const old = exprWrap.querySelector('svg._splitsbenen');
  if (old) old.remove();

  exprWrap.appendChild(svg);
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

    // ✅ OVERRIDE (tot 100): bij optellen moet exact één term eindigen op 6/7/8/9
if (
  oef.operator === '+' &&
  cfg?.rekenMaxGetal <= 100 &&
  cfg?.rekenHulp?.stijl === 'compenseren'
) {
  const e1 = g1 % 10;
  const e2 = g2 % 10;
  const c1 = [6, 7, 8, 9].includes(e1);
  const c2 = [6, 7, 8, 9].includes(e2);

  // brug moet er zijn
  const heeftBrug = (e1 + e2 >= 10);

  if (heeftBrug && c1 !== c2) {
    // exact één kandidaat → geen twijfel
    isTargetG1 = c1; // als g1 kandidaat is: true, anders g2
  } else {
    // fallback: je bestaande logica mag het beslissen
    // (laat je oude if/else blok hieronder dus gewoon staan)
  }
}


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

    // ✅ AFTREKKEN: compenseer ALTIJD de aftrekker (2de term)
if (
  oef.operator === '-' &&
  cfg?.rekenMaxGetal === 1000 &&
  cfg?.rekenHulp?.stijl === 'compenseren'
) {
  isTargetG1 = false; // dus target = span2
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
      // ===============================================
// OVERRIDE – AFTREKKEN + COMPENSEREN (TOT 100)
// Werkboekmodel: 72 − 9 → −10 +1
// ===============================================
if (
  oef.operator === '-' &&
  cfg?.rekenMaxGetal <= 100 &&
  cfg?.rekenHulp?.stijl === 'compenseren'
) {
  // afronden aftrekker naar volgend tiental
  const doel = Math.ceil(g2 / 10) * 10;
  const delta = doel - g2;

  // vakjes onder de aftrekker
  L.innerHTML = `<span style="color:#c00000">−${doel}</span>`;
  R.innerHTML = `<span style="color:#0058c0">+${delta}</span>`;

  if (rechtsKolom) {
    const tussen = g1 - doel;
    const eind = tussen + delta;

    ansBox.textContent = eind;

    rechtsKolom.innerHTML = '';
    const stapDiv = document.createElement('div');
    stapDiv.style.marginTop = '10px';
    stapDiv.style.lineHeight = '1.5';
    stapDiv.style.fontSize = '16px';
    stapDiv.innerHTML =
      `${g1} − ${doel} = ${tussen}<br>` +
      `${tussen} + ${delta} = ${eind}`;

    rechtsKolom.appendChild(stapDiv);
  }

  // ⚠️ ZEER BELANGRIJK:
  // stop hier, zodat de oude logica NIET meer loopt
  return;
}

// ===============================================
// OVERRIDE – AFTREKKEN + COMPENSEREN (TOT 1000)
// Werkboekmodel: 320 − 180 → −200 +20
// ===============================================
if (
  oef.operator === '-' &&
  cfg?.rekenMaxGetal === 1000 &&
  cfg?.rekenHulp?.stijl === 'compenseren'
) {
  // afronden aftrekker naar volgend honderdtal
let doel;

// HT-HT & HTE-HT: afronden naar honderdtal (zoals werkboek 320 − 180)
if (
  oef.somType === 'HT-HT' ||
  oef.somType === 'HTE-HT' ||
  oef.somType === 'HTE-HTE'
) {

  doel = Math.ceil(g2 / 100) * 100;
}

// HT-TE: werkboekregel
else if (oef.somType === 'HT-TE') {
  if (g2 >= 96 && g2 <= 99) {
    doel = 100;
  } else {
    doel = Math.ceil(g2 / 10) * 10;
  }
} else {
  // andere types: laat uw bestaande logica verder werken
  return;
}

const delta = doel - g2;


  // vakjes onder de aftrekker
  L.innerHTML = `<span style="color:#c00000">−${doel}</span>`;
  R.innerHTML = `<span style="color:#0058c0">+${delta}</span>`;

  if (rechtsKolom) {
    const tussen = g1 - doel;
    const eind = tussen + delta;

    ansBox.textContent = eind;

    rechtsKolom.innerHTML = '';
    const stapDiv = document.createElement('div');
    stapDiv.style.marginTop = '10px';
    stapDiv.style.lineHeight = '1.5';
    stapDiv.style.fontSize = '16px';
    stapDiv.innerHTML =
      `${g1} − ${doel} = ${tussen}<br>` +
      `${tussen} + ${delta} = ${eind}`;

    rechtsKolom.appendChild(stapDiv);
  }

  // zeer belangrijk: oude logica niet laten doorlopen
  return;
}

        const info = isTargetG1 ? d1 : d2;
        const delta = info.dist;
        
       // ✅ Optellen: toon het afgeronde doelgetal (bv. 9 → 10), niet de afstand (+1)
if (oef.operator === '+') {
  L.innerHTML = `<span style="color:#c00000">+${info.nextVal}</span>`;
} else {
  L.innerHTML = `<span style="color:#c00000">+${delta}</span>`;
}


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
   AANVULLEN – PREVIEW HULP
   ================================ */
  function renderAanvullenSchijfjesAftrekker(container, aftrekker) {
  const h = Math.floor(aftrekker / 100);
  const t = Math.floor((aftrekker % 100) / 10);
  const e = aftrekker % 10;

  const model = document.createElement('div');
  model.style.border = '1px solid #cfcfcf';
  model.style.borderRadius = '12px';
  model.style.marginBottom = '10px';
  model.style.overflow = 'hidden';
  model.style.fontFamily = 'Arial, sans-serif';

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = '1fr 1fr 1fr';

  const maakKolom = (label, aantal, kleur, waarde) => {
    const col = document.createElement('div');
    col.style.padding = '0';
    col.style.textAlign = 'center';
    col.style.borderRight = '1px solid #ddd';

    // titelvak (zoals werkboek)
    const titelVak = document.createElement('div');
    titelVak.textContent = label;
    titelVak.style.background = kleur;
    titelVak.style.color = '#000';
    titelVak.style.fontWeight = '700';
    titelVak.style.padding = '6px 0';
    titelVak.style.borderBottom = '2px solid #333';
    titelVak.style.fontFamily = 'Arial, sans-serif';

    col.appendChild(titelVak);

    const rij = document.createElement('div');
    rij.style.display = 'flex';
    rij.style.flexWrap = 'wrap';
    rij.style.justifyContent = 'center';
    rij.style.gap = '6px';
    rij.style.padding = '8px';

    for (let i = 0; i < aantal; i++) {
      const schijf = document.createElement('div');
      schijf.textContent = waarde;
      schijf.style.width = '30px';
      schijf.style.height = '30px';
      schijf.style.borderRadius = '50%';
      schijf.style.background = kleur;
      schijf.style.color = '#000';
      schijf.style.fontSize = '12px';
      schijf.style.display = 'flex';
      schijf.style.alignItems = 'center';
      schijf.style.justifyContent = 'center';
      schijf.style.fontWeight = '700';
      schijf.style.fontFamily = 'Arial, sans-serif';
      rij.appendChild(schijf);
    }

    col.appendChild(rij);
    return col;
  };

  // H – blauw
  grid.appendChild(maakKolom('H', h, '#93c5fd', '100'));

  // T – groen
  grid.appendChild(maakKolom('T', t, '#86efac', '10'));

  // E – eenheden
// TE-TE → eenheden tonen
// HT-HT → géén eenheden (zoals vroeger)
if (aftrekker < 100) {
  // TE-TE (tot 100)
  grid.appendChild(maakKolom('E', e, '#fde047', '1'));
} else {
  // HT-HT (tot 1000): bewust geen eenheden
  const eKolom = document.createElement('div');
  eKolom.style.textAlign = 'center';
  eKolom.style.borderRight = 'none';

  const eTitel = document.createElement('div');
  eTitel.textContent = 'E';
  eTitel.style.background = '#fde047';
  eTitel.style.color = '#000';
  eTitel.style.fontWeight = '700';
  eTitel.style.padding = '6px 0';
  eTitel.style.borderBottom = '2px solid #333';
  eTitel.style.fontFamily = 'Arial, sans-serif';

  eKolom.appendChild(eTitel);

  const eLeeg = document.createElement('div');
  eLeeg.style.height = '46px';
  eKolom.appendChild(eLeeg);

  grid.appendChild(eKolom);
}

model.appendChild(grid);
container.appendChild(model);
}



function _blankBox(width = 54, height = 22) {
  const b = document.createElement('span');
  b.style.display = 'inline-block';
  b.style.width = width + 'px';
  b.style.height = height + 'px';
  b.style.border = '2px solid #333';
  b.style.borderRadius = '8px';
  b.style.verticalAlign = 'middle';
  b.style.marginLeft = '6px';
  return b;
}

function _renderAanvullenInOefening(div, cfg, oef) {
  const g1 = Number(oef.getal1);
  const g2 = Number(oef.getal2);
  const diff = g1 - g2;

  // fallback: als iets vreemd is, toon gewoon de som
  if (!Number.isFinite(g1) || !Number.isFinite(g2) || diff < 0) {
    div.textContent = `${oef.getal1} ${oef.operator} ${oef.getal2} =`;
    return;
  }

  div.style.whiteSpace = 'normal';

  // buitenkader (zoals voorbeeldkaart)
  const box = document.createElement('div');
  box.style.border = '1px solid #cfcfcf';
  box.style.borderRadius = '14px';
  box.style.padding = '10px';
  box.style.background = '#fff';

  const vorm = (cfg?.rekenHulp?.vormAanvullen || 'schema'); // komt uit de UI/cfg

  if (vorm === 'schema') {
    // schema/balkjes
    const model = document.createElement('div');
    model.style.border = '1px solid #e2e2e2';
    model.style.borderRadius = '10px';
    model.style.overflow = 'hidden';
    model.style.marginBottom = '10px';

    // bovenbalk
    const top = document.createElement('div');
    top.style.height = '34px';
    top.style.display = 'flex';
    top.style.alignItems = 'center';
    top.style.justifyContent = 'center';
    top.style.fontWeight = '700';
    top.style.background = '#dbeafe'; // lichtblauw
    top.textContent = String(g1);

    // onderbalk: groen + geel "?"
    const bottom = document.createElement('div');
    bottom.style.display = 'grid';
    bottom.style.gridTemplateColumns = '1fr auto';

    const left = document.createElement('div');
    left.style.height = '34px';
    left.style.display = 'flex';
    left.style.alignItems = 'center';
    left.style.justifyContent = 'center';
    left.style.fontWeight = '700';
    left.style.background = '#dcfce7'; // lichtgroen
    left.textContent = String(g2);

    const right = document.createElement('div');
    right.style.height = '34px';
    right.style.minWidth = '52px';
    right.style.display = 'flex';
    right.style.alignItems = 'center';
    right.style.justifyContent = 'center';
    right.style.fontWeight = '700';
    right.style.background = '#fef9c3'; // lichtgeel
    right.textContent = '?';

    bottom.appendChild(left);
    bottom.appendChild(right);

    model.appendChild(top);
    model.appendChild(bottom);
    box.appendChild(model);
  }
  
if (vorm === 'schijfjes') {
  renderAanvullenSchijfjesAftrekker(box, g2);
}

  // rekenregels (zoals voorbeeld)
  const regels = document.createElement('div');
  regels.style.fontSize = '18px';
  regels.style.lineHeight = '1.9';

  const r1 = document.createElement('div');
  r1.textContent = `${g1} − ${g2} = `;
  r1.appendChild(_blankBox());

  const r2 = document.createElement('div');
  r2.textContent = `${g2} + `;
  r2.appendChild(_blankBox());
  r2.appendChild(document.createTextNode(` = ${g1}`));

  regels.appendChild(r1);
  regels.appendChild(r2);

  box.appendChild(regels);
  div.appendChild(box);
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
   // ---------------------------------
// AFTREKKEN — BRUGCHECK
// ---------------------------------

// tot 100: klassieke eenhedenbrug
if (cfg.rekenMaxGetal <= 100) {
  if (e1 >= e2) return false;
}

// tot 1000: compenseren = toegestaan via tiental/honderdtal
if (cfg.rekenMaxGetal === 1000) {
  // expliciet OK voor compenseren
  if (cfg.rekenHulp?.stijl === 'compenseren') {
    return true;
  }

  // anders: klassieke check
  if (e1 >= e2) return false;
}


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


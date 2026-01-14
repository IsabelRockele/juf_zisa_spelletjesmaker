/* =========================================================
   HOOFDREKENEN – PREVIEW (EXACTE OVERNAME – GEFIXT)
   ========================================================= */
import { genereerHoofdrekenenV2 } from '../hoofdrekenen_versie2/hoofdrekenen_v2.generator.js';
import {
  genereerTot1000_V2,
  genereerAftrekkenZonderBrugTot1000
} from '../hoofdrekenen_versie2/hoofdrekenen_tot1000.generator.js';

import { normalizePreviewCfg } from './preview_parts/preview_config.js';
import { generateOefeningen } from './preview_parts/preview_generate.js';
import { renderOefening } from './preview_parts/preview_render.js';


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

  // ⭐ Brug herkennen (tot 100): ALTIJD eigen logica
  if (cfg.variant === 'brugHerkennen100') {
    if (cfg.rekenType === 'aftrekken') {
      return 'Kleur het lampje als de aftrekking een brugoefening is.';
    }
    if (cfg.rekenType === 'beide') {
      return 'Kleur het lampje als de oefening een brugoefening is.';
    }
    // optellen (default)
    return 'Kleur het lampje als de optelling een brugoefening is.';
  }

  // 🔹 andere oefenvormen: bewaarde opdrachtzin mag blijven
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

  if (cfg?.rekenHulp?.stijl === 'aanvullen') {
    return 'Los op door aan te vullen.';
  }

  return 'Los de sommen op.';
}


function voegOefeningToe(cfg) {
  // 🔧 zorg dat oefenlijst bestaat
if (!Array.isArray(cfg._oefeningen)) {
  cfg._oefeningen = [];
}


  // ⭐ Brug herkennen: + oefening = 1 extra gegenereerde oefening
if (cfg.variant === 'brugHerkennen100') {

  const type = (cfg.rekenType === 'aftrekken') ? 'min' : 'plus';

  // genereer precies 1 nieuwe oefening
  const [oef] = genereerBrugHerkennenTot100(type, 1);
  if (!oef) return null;

  const nieuw = {
    getal1: oef.a,
    getal2: oef.b,
    operator: oef.op,
    heeftBrug: oef.heeftBrug
  };

  // voorkom duplicaat
  const key = `${nieuw.getal1}${nieuw.operator}${nieuw.getal2}`;
  const bestaatAl = (cfg._oefeningen || []).some(o =>
    `${o.getal1}${o.operator}${o.getal2}` === key
  );
  if (bestaatAl) return null;

  // toevoegen
  cfg._oefeningen.push(nieuw);

  // opslaan in bundel
  let bundel = JSON.parse(localStorage.getItem('werkbladBundel') || '[]');
  bundel = bundel.map(seg => {
    if (seg.settings?.segmentId === cfg.segmentId) {
      seg.settings._oefeningen = cfg._oefeningen;
    }
    return seg;
  });
  localStorage.setItem('werkbladBundel', JSON.stringify(bundel));

  return nieuw;
}

  const comp = !!(cfg.rekenHulp && cfg.rekenHulp.stijl === 'compenseren');
  let oef;

  if (cfg.rekenType === 'beide') {
  cfg.operator = Math.random() < 0.5 ? '+' : '-';
}

// 🔁 brug "beide" vertalen voor generator
const brugVoorDezeOef =
  (cfg.rekenBrug === 'beide')
    ? (Math.random() < 0.5 ? 'zonder' : 'met')
    : cfg.rekenBrug;

const res = genereerHoofdrekenenV2({
  ...cfg,
  rekenBrug: brugVoorDezeOef,
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

function filterSomTypesTot100(cfg) {
  // ⛔ BIJ BRUG = BEIDE → NOOIT FILTEREN
if (cfg.rekenBrug === 'beide') {
  return;
}

  if (cfg.rekenMaxGetal !== 100) return;

  const isOptellen = cfg.rekenType === 'optellen';
  const isAftrekken = cfg.rekenType === 'aftrekken';
  const isCompenseren = cfg?.rekenHulp?.stijl === 'compenseren';

  // ZONDER BRUG — AFTREKKEN
  if (isAftrekken && cfg.rekenBrug === 'zonder') {
    cfg.somTypes = cfg.somTypes.filter(t =>
      !['T-E', 'T-TE'].includes(t)
    );
  }

  // MET BRUG — AFTREKKEN
  if (isAftrekken && cfg.rekenBrug === 'met') {
    cfg.somTypes = cfg.somTypes.filter(t =>
      ['T-E', 'T-TE', 'TE-E', 'TE-TE'].includes(t)
    );
  }

  // MET BRUG — OPTELLEN
  if (isOptellen && cfg.rekenBrug === 'met' && !isCompenseren) {
    cfg.somTypes = cfg.somTypes.filter(t =>
      ['E+E', 'TE+E', 'TE+TE'].includes(t)
    );
  }

  // COMPENSEREN — OPTELLEN
  if (isOptellen && isCompenseren) {
    cfg.somTypes = cfg.somTypes.filter(t =>
      ['TE+E', 'TE+TE'].includes(t)
    );
  }

  // COMPENSEREN — AFTREKKEN
  if (isAftrekken && isCompenseren) {
    cfg.somTypes = cfg.somTypes.filter(t =>
      ['TE-E', 'TE-TE'].includes(t)
    );
  }
}


/* =========================================================
   SEGMENT RENDER
   ========================================================= */
export function renderHoofdrekenenSegment(container, segment) {
  
 // 🔒 Clone: preview mag settings niet muteren
const cfg = normalizePreviewCfg(segment);

// 🔁 FIX: voorkom vastgelopen lege cache bij aftrekken tot 100
if (cfg.rekenMaxGetal === 100 && cfg.rekenType === 'aftrekken') {
  cfg._oefeningen = null;
  cfg._dirty = true;
}

// 🔁 Zorg dat operator correct gezet is
if (!cfg.operator && cfg.rekenType) {
  if (cfg.rekenType === 'aftrekken') cfg.operator = '-';
  else if (cfg.rekenType === 'optellen') cfg.operator = '+';
  else if (cfg.rekenType === 'beide') cfg.operator = null; // belangrijk!
}


console.log(
  'PREVIEW START',
  'operator=', cfg.operator,
  'rekenType=', cfg.rekenType,
  'rekenMaxGetal=', cfg.rekenMaxGetal,
  'somTypes=', cfg.somTypes
);


// ❌ DIT BLOK VERWIJDEREN
// if (!cfg.operator && cfg.rekenType) {
//   if (cfg.rekenType === 'aftrekken') cfg.operator = '-';
//   if (cfg.rekenType === 'optellen')  cfg.operator = '+';
// }


// 🔁 somTypes normaliseren voor generator (optellen én aftrekken)
// "TE + TE" → "TE+TE"
if (Array.isArray(cfg.somTypes)) {
  cfg.somTypes = cfg.somTypes.map(t => t.replace(/\s+/g, ''));
}

// 🎯 UI-filtering somtypes (TOT 100)
filterSomTypesTot100(cfg);

// ✅ BIJ BRUG = BEIDE → NIETS FILTEREN
if (cfg.rekenBrug === 'beide') {
  // laat cfg.somTypes volledig ongemoeid
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

// ⭐ ALLEEN bij brug herkennen: 4 per rij
if (cfg.variant === 'brugHerkennen100') {
  grid.style.gridTemplateColumns = 'repeat(4,1fr)';
} else {
  grid.style.gridTemplateColumns = hulp ? 'repeat(2,1fr)' : 'repeat(3,1fr)';
}

  grid.style.gap = hulp ? '32px' : '20px';

// ✅ Oefeningen genereren + renderen in het grid
generateOefeningen(cfg, grid, renderOefening);


  card.appendChild(grid);
  container.appendChild(card);
}


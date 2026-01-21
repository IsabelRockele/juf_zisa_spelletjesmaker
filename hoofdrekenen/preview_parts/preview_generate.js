// preview_generate.js
// Verantwoordelijk voor: oefeningen genereren (preview)
// ⚠️ Logica is ongewijzigd verplaatst uit hoofdrekenen.preview.js

import { genereerHoofdrekenenV2 } from '../../hoofdrekenen_versie2/hoofdrekenen_v2.generator.js';
import {
  genereerAftrekkenZonderBrugTot1000,
  genereerAftrekkenMetBrugTot1000
} from '../../hoofdrekenen_versie2/hoofdrekenen_tot1000.generator.js';

import { genereerBrugHerkennenTot100 } from '../../hoofdrekenen_versie2/brug_herkennen_tot100.js';
import { genereerAftrekkenAanvullenTot1000_N } 
from '../../hoofdrekenen_versie2/aftrekken_aanvullen_tot1000.generator.js';

export function generateOefeningen(cfg, grid, renderOefening) {

    console.log(
  'GEN START',
  'max=', cfg.rekenMaxGetal,
  'type=', cfg.rekenType,
  'operator=', cfg.operator,
  'brug=', cfg.rekenBrug,
  'somTypes=', cfg.somTypes,
  'variant=', cfg.variant
);

// 🔧 FIX: aanvullen expliciet als variant markeren
if (cfg.rekenHulp?.stijl === 'aanvullen') {
  cfg.variant = 'aanvullen';
}


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

  // ✅ AANVULLEN — AFTREKKEN TOT 1000 (eigen generator, V2-router vermijden)
if (
  cfg.rekenType === 'aftrekken' &&
  cfg.rekenMaxGetal === 1000 &&
  cfg.rekenHulp?.stijl === 'aanvullen' &&
  !Array.isArray(cfg._oefeningen)
) {
  const N = Number(cfg.numOefeningen || cfg.aantal || 20);

  // verwacht exact 1 somtype
  const somType =
    Array.isArray(cfg.somTypes) && cfg.somTypes.length === 1
      ? cfg.somTypes[0]
      : 'HTE-HTE';

  cfg._oefeningen =
    genereerAftrekkenAanvullenTot1000_N(N, somType);

  cfg._oefeningen.forEach(oef =>
    renderOefening(grid, cfg, oef)
  );

  return; // ⛔ STOP: niets mag verder doorlopen
}

  // ✅ Brug herkennen: genereer eigen oefeningen (en voorkom V2-generator)
  if (cfg.variant === 'brugHerkennen100' && !Array.isArray(cfg._oefeningen)) {

    let oefeningen = [];

    if (cfg.rekenType === 'beide') {
      const half = Math.ceil(N / 2);

      const plus = genereerBrugHerkennenTot100('plus', half);
      const min  = genereerBrugHerkennenTot100('min', N - half);

      oefeningen = [...plus, ...min];
    } else {
      const type = (cfg.rekenType === 'aftrekken') ? 'min' : 'plus';
      oefeningen = genereerBrugHerkennenTot100(type, N);
    }

    cfg._oefeningen = oefeningen.map(oef => ({
      getal1: oef.a,
      getal2: oef.b,
      operator: oef.op,
      heeftBrug: oef.heeftBrug
    }));
  }

// ✅ Aanvullen — HT-HT (rechtstreeks, stabiel)
if (
  cfg.variant === 'aanvullen' &&
  cfg.rekenType === 'aftrekken' &&
  cfg.rekenMaxGetal === 1000 &&
  cfg.somTypes?.length === 1 &&
  cfg.somTypes[0] === 'HT-HT' &&
  !Array.isArray(cfg._oefeningen)
) {
  const N = Number(cfg.aantal || cfg.numOefeningen || 20);
  cfg._oefeningen = [];

  for (let i = 0; i < N; i++) {
    const oef = genereerAftrekkenAanvullen_HT_HT_Tot1000(cfg);
    if (oef) cfg._oefeningen.push(oef);
  }
}


// ================================
// BEIDE: meerdere oefeningen per operator
// ================================
if (cfg.rekenType === 'beide' && Array.isArray(cfg.somTypes)) {

  const plusTypes = cfg.somTypes.filter(t => t.includes('+'));
  const minTypes  = cfg.somTypes.filter(t => t.includes('-'));

  let result = [];
  let guard = 0;

  while (result.length < N && guard++ < N * 200) {

    // beurtelings + en -
    const doePlus = result.length % 2 === 0;

    let res = null;

    if (doePlus && plusTypes.length > 0) {
      res = genereerHoofdrekenenV2({
        ...cfg,
        rekenType: 'optellen',
        operator: '+',
        somTypes: plusTypes,
        aantalOefeningen: 1,
        _seed: Math.random()
      });
    }

    if (!doePlus && minTypes.length > 0) {
      res = genereerHoofdrekenenV2({
        ...cfg,
        rekenType: 'aftrekken',
        operator: '-',
        somTypes: minTypes,
        aantalOefeningen: 1,
        _seed: Math.random()
      });
    }

    if (!res) continue;

    const oef = Array.isArray(res) ? res[0] : res;
    if (!oef) continue;

    const key = `${oef.operator}|${oef.getal1},${oef.getal2}`;
    if (result.some(o => `${o.operator}|${o.getal1},${o.getal2}` === key)) continue;

    result.push(oef);
  }

  if (result.length > 0) {
  cfg._oefeningen = result;
}
}


 if (!Array.isArray(cfg._oefeningen) || cfg._oefeningen.length === 0) {
    oefeningen = [];
    const seen = new Set();
    let guard = 0;

    let telPlus = 0;
    let telMin  = 0;
    const maxPerSoort = Math.ceil(N / 2);

    let telBrugMet = 0;
let telBrugZonder = 0;
const maxPerBrug = Math.ceil(N / 2);


    while (oefeningen.length < N && guard++ < N * 200) {

      let oef = null;
      let brugVoorDezeOef = cfg.rekenBrug;

      const exclusiefHTE =
        cfg.rekenType === 'aftrekken' &&
        cfg.rekenBrug === 'zonder' &&
        Array.isArray(cfg.somTypes) &&
        cfg.somTypes.length === 1 &&
        cfg.somTypes[0] === 'HTE-HTE';

      if (exclusiefHTE) {
        oef = genereerAftrekkenZonderBrugTot1000(cfg);
      } else {
       // ✅ Brug = "beide": per oefening kiezen we met/zonder (generator verwacht geen 'beide')

if (cfg.rekenBrug === 'beide') {
  if (telBrugMet >= maxPerBrug) {
    brugVoorDezeOef = 'zonder';
  } else if (telBrugZonder >= maxPerBrug) {
    brugVoorDezeOef = 'met';
  } else {
    // afwisselen
    brugVoorDezeOef = (telBrugMet <= telBrugZonder) ? 'met' : 'zonder';
  }
}

// 🔁 kies bewust één somtype voor eerlijke verdeling
// 🔁 kies bewust één somtype voor eerlijke verdeling
let somTypesVoorDezeOef = cfg.somTypes;

// altijd normaliseren (spaties eruit)
if (Array.isArray(somTypesVoorDezeOef)) {
  somTypesVoorDezeOef = somTypesVoorDezeOef.map(t => t.replace(/\s+/g, ''));
}

// bij meerdere somtypes: rondgaan
if (Array.isArray(somTypesVoorDezeOef) && somTypesVoorDezeOef.length > 1) {
  const index = oefeningen.length % somTypesVoorDezeOef.length;
  somTypesVoorDezeOef = [somTypesVoorDezeOef[index]];
}

// 🎯 AFTREKKEN: brugtype afleiden uit somtype
if (cfg.rekenType === 'aftrekken' && Array.isArray(somTypesVoorDezeOef)) {
  const st = somTypesVoorDezeOef[0];

  // deze somtypes ZIJN altijd met brug
  if (st === 'T-E' || st === 'T-TE') {
    brugVoorDezeOef = 'met';
  }

  // deze laten beide toe → verdeling blijft gelden
  // (TE-E, TE-TE → niets forceren)
}
let res;

if (cfg.rekenType === 'aftrekken' && cfg.rekenMaxGetal === 1000) {
  if (brugVoorDezeOef === 'met') {
    res = genereerAftrekkenMetBrugTot1000({
      ...cfg,
      rekenBrug: 'met',
      somTypes: somTypesVoorDezeOef
    });
  } else {
    res = genereerAftrekkenZonderBrugTot1000({
      ...cfg,
      somTypes: somTypesVoorDezeOef
    });
  }
} else {
  res = genereerHoofdrekenenV2({
    ...cfg,
    rekenBrug: brugVoorDezeOef,
    somTypes: somTypesVoorDezeOef,
    aantalOefeningen: 1,
    _seed: Math.random()
  });
}



        oef = Array.isArray(res) ? res[0] : res;
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

        // 👉 eerste oefening = voorbeeldoefening
        if (
          cfg?.rekenHulp?.stijl === 'compenseren' &&
          cfg?.rekenHulp?.voorbeeld === true &&
          oefeningen.length === 0
        ) {
          oef._voorbeeld = true;
        }

        // ⛔ AANVULLEN: verschil beperken
if (cfg._aanvullenMaxVerschil != null) {
  const diff = Math.abs(oef.getal1 - oef.getal2);
  if (diff > cfg._aanvullenMaxVerschil) continue;
}

        oefeningen.push(oef);
        if (oef.operator === '+') telPlus++;
        if (oef.operator === '-') telMin++;
      }

      if (cfg.rekenBrug === 'beide') {
  if (brugVoorDezeOef === 'met') telBrugMet++;
  if (brugVoorDezeOef === 'zonder') telBrugZonder++;
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
}

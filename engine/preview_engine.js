 /* =========================================================
   PREVIEW ENGINE – MODULE ROUTER (feature-flag)
   ========================================================= */

import { SplitsModule } from '../splitsen/splits.module.js';
// Tafels inzichtelijk activeren we later:
// import { TafelsInzichtModule } from '../tafels_inzicht/tafels_inzicht.module.js';

export function renderViaModuleIfAvailable(cfg, grid) {

  // 🔹 Feature-flag: alleen SPLITSEN
  if (cfg.hoofdBewerking === 'splitsen' && SplitsModule) {
    SplitsModule.renderPreview(cfg, grid);
    return true; // ➜ module heeft gerenderd
  }

  // later:
  // if (cfg.hoofdBewerking === 'tafels-inzicht' && TafelsInzichtModule) {
  //   TafelsInzichtModule.renderPreview(cfg, grid);
  //   return true;
  // }

  return false; // ➜ val terug op oude code
}

/* =========================================================
   PREVIEW ENGINE – START
   Tijdelijke centrale preview-engine.
   Wordt later opgesplitst naar engine/preview_engine.js
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  // Uniek ID per selectie (zorgt dat elk blok z'n eigen titel krijgt)

  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const opnieuwBtn = document.getElementById('opnieuwBtn');
  const werkbladContainer = document.getElementById('werkblad-container');

  // ==== PDF marges ====
  const LEFT_PUNCH_MARGIN = 16; // mm – perforatiemarge links
  const INNER_PAD = 12;
  const PDF_BOTTOM_SAFE = 2;
  const SEGMENT_GAP = 6; // verticale ruimte tussen 2 opdrachten/segmenten

  // vaste breedte voor de kaders van 'rekenen zonder hulp' (mm)
  const BOXED_REKEN_W = 50;

  // ==== specifieke inspringingen per oefeningstype (mm) ====
  const PAD_HUISJE     = 14;
  const PAD_BENEN      = 10;
  const PAD_PUNTOEF    = 10;   // mag wat kleiner zodat ze beter in kolomkaders vallen
  const PAD_BEWERKING4 = 6;    // iets naar rechts, maar niet zo ver als huisjes

  // Voor de preview-paginering (scherm)
  // mm → px (96 dpi ~ 3.78 px/mm)
  const MM2PX = 3.78;
  const PAGE_W_PX = 210 * MM2PX;   // 794 px
  const PAGE_H_PX = 297 * MM2PX;   // 1122 px

  // Zet marges op de pagina in px (houd in de buurt van je PDF marges) – globaal nodig voor paginatePreview()
window.PREVIEW_TOP_PX    = (typeof window.PREVIEW_TOP_PX    === 'number') ? window.PREVIEW_TOP_PX    : 90; // ~24 mm
window.PREVIEW_BOTTOM_PX = (typeof window.PREVIEW_BOTTOM_PX === 'number') ? window.PREVIEW_BOTTOM_PX : 90; // ~24 mm

// standaard ruimte tussen segmenten (mag lokaal blijven)
let PREVIEW_SEG_GAP_PX = 24;

  opnieuwBtn?.addEventListener('click', () => {
    window.location.href = 'bewerkingen_keuze_versie3.html';
  });


  // ====== Lees bundel of single set ======
  let bundel = [];
  try { bundel = JSON.parse(localStorage.getItem('werkbladBundel') || '[]') || []; } catch {}
  let single = {};
  try { single = JSON.parse(localStorage.getItem('werkbladSettings') || '{}') || {}; } catch {}

  if (!bundel.length) {
    if (!single || !single.hoofdBewerking) {
      toonFout("Geen instellingen gevonden. Ga terug en maak eerst je keuzes.");
      return;
    }
    bundel = [{ titel: 'Werkblad', settings: single }];
  }

  // ========= HULPFUNCTIES =========
  const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  function somHeeftBrug(g1, g2, op) {
  const e1 = g1 % 10, e2 = g2 % 10;
  const t1 = Math.floor(g1 / 10) % 10;
  const t2 = Math.floor(g2 / 10) % 10;

  if (op === '+') {
    // Brug bij optellen: als E over 9 gaan, OF (bij E=0) de T over 9 gaan (HT+HT)
    return (e1 + e2 > 9) || (e1 === 0 && e2 === 0 && (t1 + t2 > 9));
  } else {
    // Brug bij aftrekken: als E1 < E2, OF (bij gelijke E=0) T1 < T2 (lenen uit honderdtal)
    return (e1 < e2) || (e1 === e2 && e1 === 0 && t1 < t2);
  }
}


  function checkBrug(g1, g2, op, brugType) {
  if (brugType === 'beide') return true;

  // Splits getallen per plaatswaarde
  function digits(n) {
    return String(n).split('').reverse().map(d => parseInt(d));
  }

  const d1 = digits(g1);
  const d2 = digits(g2);
  const maxLen = Math.max(d1.length, d2.length);

  let heeftBrug = false;

  for (let i = 0; i < maxLen; i++) {
    const a = d1[i] || 0; // cijfer op plaats i
    const b = d2[i] || 0;

    if (op === '+') {
      if (a + b > 9) { heeftBrug = true; break; }
    } else { // aftrekken
      if (a < b) { heeftBrug = true; break; }
    }
  }

  // BrugType verwerken
  return (brugType === 'met' && heeftBrug) ||
         (brugType === 'zonder' && !heeftBrug);
}

  function titelVoor(cfg) {
  // Handmatige opdrachtzin heeft altijd voorrang
  if (cfg.opdracht && cfg.opdracht.trim()) return cfg.opdracht.trim();

  if (cfg.hoofdBewerking === 'splitsen') {
    if (cfg.splitsStijl === 'puntoefening') return 'Vul de splitsing aan.';
    if (cfg.splitsStijl === 'bewerkingen4') return 'Splits en maak de 4 bewerkingen.';
    if (cfg.splitsStijl === 'huisje') return 'Vul het splitshuis correct in.';
    return 'Vul de splitsbenen correct in.';
  }

  if (cfg.hoofdBewerking === 'tafels') return 'Los de tafel-oefeningen op.';

  if (cfg.hoofdBewerking === 'rekenen') {
    const type = cfg.rekenType || 'beide';     // 'optellen' | 'aftrekken' | 'beide'
    const brug = cfg.rekenBrug || 'beide';     // 'met' | 'zonder' | 'beide'
    const brugTxt = brug === 'met' ? ' met brug' : (brug === 'zonder' ? ' zonder brug' : '');
    if (type === 'optellen')  return 'Los de optelsommen op'  + brugTxt + '.';
    if (type === 'aftrekken') return 'Los de aftreksommen op' + brugTxt + '.';
    return 'Los de sommen (optellen en aftrekken) op' + brugTxt + '.';
  }

  return 'Oefeningen';
}

  // ========= GENERATOREN =========
  function genereerSplitsing(settings) {
    const fijn = settings.splitsFijn || {};
    const totalen = new Set();

    // Vinkjes vertalen naar toegestane totalen
    if (fijn.tot5) [1,2,3,4,5].forEach(n => totalen.add(n));
    if (fijn.van6)  totalen.add(6);
    if (fijn.van7)  totalen.add(7);
    if (fijn.van8)  totalen.add(8);
    if (fijn.van9)  totalen.add(9);
    if (fijn.van10) totalen.add(10);
    if (fijn.van10tot20) for (let n = 10; n <= 20; n++) totalen.add(n);

    // Fallback als er niets aangevinkt is: gebruik je oude instelling
    if (totalen.size === 0) {
      const arr = settings.splitsGetallenArray?.length ? settings.splitsGetallenArray : [10];
      const g = arr[Math.floor(Math.random() * arr.length)];
      totalen.add(Math.max(1, Math.floor(Math.random() * g) + 1));
    }

    // Kies totaal
    const lijst = Array.from(totalen);
    const totaal = lijst[Math.floor(Math.random() * lijst.length)];

    // Kies een splitsing (deel1 + deel2 = totaal)
    let d1 = Math.floor(Math.random() * (totaal + 1));
    let d2 = totaal - d1;

    // Brug-filter enkel voor 10..20 wanneer gekozen
    const brugKeuze =
      (fijn.van10tot20 && totaal >= 10 && totaal <= 20) ? (fijn.brug10tot20 || 'beide') : 'beide';
    const metBrug = (x, y) => ((x % 10) + (y % 10)) > 9;

    if ((brugKeuze === 'met' || brugKeuze === 'zonder') && totaal >= 10 && totaal <= 20) {
      const wilMet = brugKeuze === 'met';
      let tries = 0;
      while (tries++ < 60 && (metBrug(d1, d2) !== wilMet)) {
        d1 = Math.floor(Math.random() * (totaal + 1));
        d2 = totaal - d1;
      }
    }

    // 1 been vooraf invullen (de andere blijft ___)
    const prefill = Math.random() < 0.5 ? 'links' : 'rechts';

    // optioneel: som-opgave (als je optie aanstaat)
    const isSom = !!settings.splitsSom && Math.random() < 0.3;

    return { type: 'splitsen', isSom, totaal, deel1: d1, deel2: d2, prefill };
  }

  function genereerRekensom(cfg) {
    const types = cfg.somTypes?.length ? cfg.somTypes : ['E+E'];
    const gekozenType = types[Math.floor(Math.random() * types.length)];
    const maxGetal = cfg.rekenMaxGetal || 100;
    let g1, g2, op, pogingen = 0;
// --- SPECIAL CASE: bereik tot 5 (1e leerjaar) ---
if ((cfg.rekenMaxGetal || 100) <= 5) {
  // === VOLLEDIGE VARIATIE ≤5 met gescheiden pools: PLUS en MIN ===
  const allowZero = true;                        // zet op false als je geen 0 wil
  const inRange = v => allowZero ? (v >= 0 && v <= 5) : (v >= 1 && v <= 5);

  const wantPlus = (cfg.rekenType === 'beide' || cfg.rekenType === 'optellen');
  const wantMin  = (cfg.rekenType === 'beide' || cfg.rekenType === 'aftrekken');

  // Unieke sleutel voor de configuratie van de pools
  const poolKey = JSON.stringify({ allowZero, wantPlus, wantMin });

  // Helper om te schudden (Fisher–Yates)
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Pools bouwen/verniewen wanneer leeg of configuratie gewijzigd
  if (!cfg._pool5Key || cfg._pool5Key !== poolKey || (!cfg._pool5Plus && !cfg._pool5Minus)) {
    cfg._pool5Key   = poolKey;
    cfg._pool5Plus  = [];
    cfg._pool5Minus = [];

    const start = allowZero ? 0 : 1;

    if (wantPlus) {
      // Alle a,b met a+b ≤ 5 (beide orden komen erin → 2+3 én 3+2)
      const plus = [];
      for (let a = start; a <= 5; a++) {
        for (let b = start; b <= 5; b++) {
          const s = a + b;
          if (inRange(s)) plus.push({ getal1:a, getal2:b, operator:'+' });
        }
      }
      cfg._pool5Plus = shuffle(plus);
    }

    if (wantMin) {
      // Alle a,b met a-b in [0..5]
      const minus = [];
      for (let a = start; a <= 5; a++) {
        for (let b = start; b <= 5; b++) {
          const d = a - b;
          if (inRange(d)) minus.push({ getal1:a, getal2:b, operator:'-' });
        }
      }
      cfg._pool5Minus = shuffle(minus);
    }

    // Toggle voor eerlijke afwisseling wanneer beide gevraagd zijn
    cfg._lastOp5 = '-'; // start zodat eerste keuze '+' wordt
  }

  // Functie om één item uit een pool te nemen; als leeg → pool heropbouwen en schudden
  function takeFrom(poolName) {
    let pool = cfg[poolName];
    if (!pool || pool.length === 0) {
      // heropbouwen op basis van huidige key
      const saveKey = cfg._pool5Key;
      cfg._pool5Key = null; // force rebuild
      // Recursief: roep de hele tak nog eens aan om pools te heropbouwen
      // (veilig omdat het meteen hieronder weer returnt met een item)
      return (function regenerate() {
        // herbouw
        const res = (function(){ /* no-op; we laten het ‘boven’ heropbouwen */ })();
        // we forceren rebuild door simpelweg opnieuw deze if-tak te laten uitvoeren
        // maar dat is niet ideaal — beter: rebuild precies die pool:

        const allowZero = JSON.parse(saveKey).allowZero;
        const start = allowZero ? 0 : 1;

        if (poolName === '_pool5Plus') {
          const plus = [];
          for (let a = start; a <= 5; a++) {
            for (let b = start; b <= 5; b++) {
              const s = a + b;
              if ((allowZero ? (s >= 0 && s <= 5) : (s >= 1 && s <= 5))) {
                plus.push({ getal1:a, getal2:b, operator:'+' });
              }
            }
          }
          cfg._pool5Plus = shuffle(plus);
        } else {
          const minus = [];
          for (let a = start; a <= 5; a++) {
            for (let b = start; b <= 5; b++) {
              const d = a - b;
              if ((allowZero ? (d >= 0 && d <= 5) : (d >= 1 && d <= 5))) {
                minus.push({ getal1:a, getal2:b, operator:'-' });
              }
            }
          }
          cfg._pool5Minus = shuffle(minus);
        }
        pool = cfg[poolName];
        return pool.pop();
      })();
    }
    return pool.pop();
  }

  // Kies operator en neem zonder herhaling uit de juiste pool
  let pick;
  if (wantPlus && wantMin) {
    // Afwisselen: +, -, +, -, …
    const nextOp = (cfg._lastOp5 === '+') ? '-' : '+';
    cfg._lastOp5 = nextOp;
    pick = (nextOp === '+') ? takeFrom('_pool5Plus') : takeFrom('_pool5Minus');
  } else if (wantPlus) {
    pick = takeFrom('_pool5Plus');
  } else {
    pick = takeFrom('_pool5Minus');
  }

  return { type:'rekenen', getal1: pick.getal1, getal2: pick.getal2, operator: pick.operator };
}


    do {
      pogingen++;
      if (pogingen > 120) {
        throw new Error(`Kon geen som genereren voor type ${gekozenType} met operator ${op} en brug-keuze "${cfg.rekenBrug}".`);
      }
      switch (gekozenType) {
        case 'E+E': g1 = rnd(1, 9); g2 = rnd(1, 9); break;
        case 'T+E': g1 = rnd(1, 9) * 10; g2 = rnd(1, 9); break;
        case 'T+T': g1 = rnd(1, 9) * 10; g2 = rnd(1, 9) * 10; break;
        case 'TE+E': g1 = rnd(11, 99); g2 = rnd(1, 9); break;
        case 'TE+TE': g1 = rnd(11, 99); g2 = rnd(11, 99); break;
        case 'H+H': g1 = rnd(1, 9) * 100; g2 = rnd(1, 9) * 100; break;
        case 'HT+HT':
    // tientallen genereren zonder brug
    do {
        const t1 = rnd(1, 9);
        const t2 = rnd(1, 9);
        g1 = t1 * 10 * 10; // honderdtallen + tientallen
        g2 = t2 * 10 * 10;
    } while (cfg.rekenBrug === 'zonder' && ( (g1/10)%10 + (g2/10)%10 > 9 ));
    break;

        case 'HTE+HTE': g1 = rnd(100, 999); g2 = rnd(100, 999); break;
      }
      op = cfg.rekenType === 'beide' ? (Math.random() < 0.5 ? '+' : '-') : (cfg.rekenType === 'optellen' ? '+' : '-');
      if (op === '+') {
        while (g1 + g2 > maxGetal) { if (g1 > g2) g1 = Math.floor(g1 / 2); else g2 = Math.floor(g2 / 2); }
      } else {
        if (g1 < g2) [g1, g2] = [g2, g1];
        while (g1 > maxGetal) { g1 = Math.floor(g1 / 2); if (g1 < g2) [g1, g2] = [g2, g1]; }
      }
    } while (!checkBrug(g1, g2, op, cfg.rekenBrug || 'beide'));

    // EXTRA FILTER: Compenseren tot 1000
if (cfg.rekenHulp && cfg.rekenHulp.inschakelen && cfg.rekenHulp.stijl === 'compenseren' && (cfg.rekenBrug || 'beide') !== 'zonder') {
  let ok = false;

  if ((g1 % 10 === 0) && (g2 % 10 === 0)) {
    // HT ± HT: tweede term heeft tiental 7/8/9
    const t2 = Math.floor(g2 / 10) % 10;
    ok = (t2 === 7 || t2 === 8 || t2 === 9);
  } else {
    // TE-gevallen: tweede term heeft eenheden 7/8/9
    const e2 = g2 % 10;
    ok = (e2 === 7 || e2 === 8 || e2 === 9);
  }

  // Resultaat moet binnen ingestelde limiet blijven (tot 1000 mogelijk)
  const max = cfg.rekenMaxGetal || 100;
  if (!ok || g1 > max || g2 > max || (op === '+' && (g1 + g2) > max)) {
    return genereerRekensom(cfg);
  }
}


    return { type: 'rekenen', getal1: g1, getal2: g2, operator: op };
  }

// Helper: maak enkel sommen geschikt voor compenseren (eenheden 7/8/9 in 2e term)
// Helper: compenseren geschikt maken voor TE én HT (7/8/9 op E of T in 2e term)
function genereerRekensomMetCompenseren(cfg){
  let tries = 0;
  const max = cfg.rekenMaxGetal || 1000;
  while (tries++ < 600){
    const oef = genereerRekensom(cfg);
    if (!oef || oef.type !== 'rekenen') continue;

    const g2 = Math.abs(oef.getal2);
    const e2 = g2 % 10;
    const t2 = Math.floor(g2 / 10) % 10;

    const okTE = (e2 === 7 || e2 === 8 || e2 === 9);
    const okHT = (e2 === 0) && (t2 === 7 || t2 === 8 || t2 === 9);

    if ((okTE || okHT) && Math.abs(oef.getal1) <= max && g2 <= max && (oef.operator === '+' ? (oef.getal1 + oef.getal2) <= max : true)) {
      return oef;
    }
  }
  return genereerRekensom(cfg);
}

  function genereerTafelsom(cfg) {
    const lijst = cfg.gekozenTafels?.length ? cfg.gekozenTafels : [1];
    const tafel = lijst[Math.floor(Math.random() * lijst.length)] || 1;
    let op = cfg.tafelType === 'maal' ? 'x' : ':';
    if (cfg.tafelType === 'beide') op = Math.random() < 0.5 ? 'x' : ':';
    const volgorde = cfg.tafelsVolgorde || 'links';
    const metNul = !!cfg.tafelsMetNul;
    const randFactor = () => metNul ? Math.floor(Math.random() * 11) : (Math.floor(Math.random() * 10) + 1);
    if (op === 'x') {
      let orient = (volgorde === 'mix') ? (Math.random() < 0.5 ? 'links' : 'rechts') : volgorde;
      return orient === 'links'
        ? { type: 'tafels', getal1: tafel, getal2: randFactor(), operator: 'x' }
        : { type: 'tafels', getal1: randFactor(), getal2: tafel, operator: 'x' };
    }
    const g2 = tafel;
    const factor = Math.max(1, randFactor());
    const g1 = g2 * factor;
    return { type: 'tafels', getal1: g1, getal2: g2, operator: ':' };
  }

 // grid = container in preview
// oefDiv = het DOM-blokje
// cfg    = settings van dit segment
// oef    = het oefening-object (kan null zijn bij "grote splitshuizen")
function appendWithDelete(grid, oefDiv, cfg, oef) {
  const del = document.createElement('div');
  del.className = 'del';
  del.textContent = '×';
  del.title = 'Verwijder oefening';

  del.addEventListener('click', (ev) => {
    ev.stopPropagation();

    // 1) uit de dataset (voor PDF)
    if (oef && Array.isArray(cfg._oefeningen)) {
      const i = cfg._oefeningen.indexOf(oef);
      if (i > -1) cfg._oefeningen.splice(i, 1);
    }

    // 2) uit de preview
    oefDiv.remove();

    // 3) paginering bijwerken
    if (typeof paginatePreview === 'function') paginatePreview();
  });

  oefDiv.appendChild(del);
  grid.appendChild(oefDiv);
}

  // ========= SCHERM-RENDER =========
  function renderBlokOpScherm(cfg) {
    // 1) Unieke sleutel per segmentsoort (gelijk aan PDF-logica)
    function segmentKey(c){
  return [
    // Uniek per keuze (als het meegegeven wordt vanuit het keuzescherm)
    c.segmentId || '',
    // Hoofdtype
    c.hoofdBewerking || '',
    // Rekenen: type én brug-keuze expliciet onderscheiden
    // - rekenType: 'optellen' | 'aftrekken' | 'beide'
    // - rekenBrug: 'met' | 'zonder' | 'beide'
    (c.isGemengd ? 'MIX' : (c.rekenType || c.operator || '')),
    c.rekenBrug || '',
    c.rekenStijl || '',     // bv. 'eerst10', 'compenseren' (voor later)
    // Splits/Tafels varianten
    c.splitsStijl || '',
    c.tafelType || '',
    // Groot/klein
    (c.groteSplitshuizen ? 'GROOT' : 'NORMAAL')
  ].join('|');
}
const segKey = segmentKey(cfg);

function renderOefeningInGrid(grid, cfg, oef) {
  const div = document.createElement('div');
  div.className = 'oefening';
  div.style.width = '100%';
  div.style.fontFamily = 'Arial,Helvetica,sans-serif';
  div.style.fontSize = '14px';
  div.style.overflow = 'visible';

  // markeer voorbeeld in preview (optioneel voor styling/onderscheiding)
  if (cfg?.rekenHulp?.voorbeeld && oef?._voorbeeld) {
    div.classList.add('voorbeeld');
  }


  if (oef.type === 'rekenen') {
    const hulpActief = !!(cfg.rekenHulp && cfg.rekenHulp.inschakelen);
    const isBrugSom = somHeeftBrug(oef.getal1, oef.getal2, oef.operator);
    if (hulpActief && isBrugSom) {
      div.style.display='grid'; div.style.gridTemplateColumns='max-content 1fr'; div.style.columnGap='24px'; div.style.alignItems='start';
      const links = document.createElement('div'); links.style.whiteSpace = 'nowrap';     // alles op 1 regel houden
links.style.wordBreak  = 'normal';     // geen hard breken binnen woorden/cijfers
links.style.width      = 'max-content';
links.style.position='relative'; links.style.display='inline-block'; links.style.overflow='visible';
      links.innerHTML = `
        <span class="term1">${oef.getal1}</span>
        <span class="op"> ${oef.operator} </span>
        <span class="term2">${oef.getal2}</span>
        <span> = </span>
        <span class="ansbox" style="display:inline-block;width:46px;height:30px;border:2px solid #333;border-radius:8px;vertical-align:middle;margin-left:6px;"></span>
      `;
      const rechts = document.createElement('div'); rechts.className='lijnenrechts'; rechts.style.overflow='visible';
      rechts.innerHTML = `
        <div style="border-bottom:2px solid #333;height:18px;margin:8px 0;width:160px;max-width:100%"></div>
        <div style="border-bottom:2px solid #333;height:18px;margin:8px 0;width:160px;max-width:100%"></div>
      `;
      div.append(links, rechts);
      appendWithDelete(grid, div, cfg, oef);
      requestAnimationFrame(() => { const stijl = (cfg.rekenHulp&&cfg.rekenHulp.stijl)||'splitsbenen'; if (stijl==='compenseren'){tekenCompenseerOnderTerm(links,oef,rechts,cfg);} else {tekenInlineSplitsOnderTerm(links,oef,rechts,cfg);} });
    } else {
      div.textContent = `${oef.getal1} ${oef.operator} ${oef.getal2} = ___`;
      appendWithDelete(grid, div, cfg, oef);
    }
    return;
  }

  if (oef.type === 'splitsen') {
    const isSom = !!oef.isSom;

    if (cfg.splitsStijl === 'puntoefening') {
      div.style.fontFamily = "'Courier New', Courier, monospace";
      div.style.fontSize = '1.2em';
      div.style.textAlign = 'center';
      let pText;
      if (oef.prefill === 'links')      pText = `${oef.totaal} = ${oef.deel1} + ___`;
      else if (oef.prefill === 'rechts')pText = `${oef.totaal} = ___ + ${oef.deel2}`;
      else                               pText = `${oef.totaal} = ___ + ___`;
      div.textContent = pText;
      appendWithDelete(grid, div, cfg, oef);
      return;
    }

    if (cfg.splitsStijl === 'bewerkingen4') {
      const wrap = document.createElement('div');
      wrap.style.display = 'grid';
      wrap.style.gridTemplateColumns = '1fr';
      wrap.style.rowGap = '14px';
      wrap.style.overflow = 'visible';

      const mini = document.createElement('div');
      mini.style.position = 'relative';
      mini.style.width = '160px';
      mini.style.height = '60px';
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
      [legLeft, legRight].forEach(l => { l.style.position='absolute'; l.style.width='2px'; l.style.background='#333'; l.style.height='28px'; l.style.top='24px'; });
      legLeft.style.left = 'calc(50% - 18px)'; legLeft.style.transform = 'skewX(-18deg)';
      legRight.style.left = 'calc(50% + 16px)';legRight.style.transform = 'skewX(18deg)';
      mini.appendChild(legLeft); mini.appendChild(legRight);

      const boxL = document.createElement('div'); const boxR = document.createElement('div');
      [boxL, boxR].forEach(b => { b.style.position='absolute'; b.style.width='44px'; b.style.height='24px'; b.style.border='2px solid #bbb'; b.style.borderRadius='8px'; b.style.bottom='0';
        b.style.display='flex'; b.style.alignItems='center'; b.style.justifyContent='center'; b.style.fontFamily="'Courier New', Courier, monospace"; b.style.fontSize='1.05em'; b.style.background='#fff';});
      boxL.style.left = 'calc(50% - 58px)'; boxR.style.left = 'calc(50% + 14px)';
      const L = oef.isSom ? String(oef.deel1) : (oef.prefill==='links' ? String(oef.deel1) : '___');
      const R = oef.isSom ? String(oef.deel2) : (oef.prefill==='rechts'? String(oef.deel2) : '___');
      boxL.textContent = L; boxR.textContent = R;
      mini.appendChild(boxL); mini.appendChild(boxR);

      wrap.appendChild(mini);

      const eq = document.createElement('div');
      eq.style.fontFamily = "'Courier New', Courier, monospace";
      eq.style.fontSize = '1.08em';
      eq.style.lineHeight = '2.8';
      eq.style.textAlign = 'center';
      eq.innerHTML = `___ + ___ = ___<br>___ + ___ = ___<br>___ - ___ = ___<br>___ - ___ = ___`;
      wrap.appendChild(eq);

      div.appendChild(wrap);
      appendWithDelete(grid, div, cfg, oef);
      return;
    }

    if (cfg.splitsStijl === 'huisje') {
      const huis = document.createElement('div');
      huis.className = 'splitshuis';
      huis.style.display = 'inline-grid';
      huis.style.gridTemplateColumns = '1fr 1fr';
      huis.style.border = '2px solid #333';
      huis.style.borderRadius = '6px';
      huis.style.overflow = 'hidden';
      huis.style.background = '#e0f2f7';
      huis.style.width = '72px';
      huis.style.textAlign = 'center';
      huis.style.fontWeight = '700';
      huis.style.fontSize = '15px';
      const top = document.createElement('div');
      top.style.gridColumn = '1 / span 2';
      top.style.borderBottom = '1px solid #999';
      top.style.padding = '2px 0';
      top.textContent = oef.isSom ? '___' : oef.totaal;
      huis.appendChild(top);
      const left = document.createElement('div');
      const right = document.createElement('div');
      left.textContent  = oef.isSom ? oef.deel1 : (oef.prefill==='links'?oef.deel1:'___');
      right.textContent = oef.isSom ? oef.deel2 : (oef.prefill==='rechts'?oef.deel2:'___');
      [left,right].forEach(c=>{ c.style.padding='4px 0'; c.style.borderTop='1px solid #ccc'; c.style.background='#fff';});
      huis.append(left,right);
      div.style.display='flex'; div.style.justifyContent='center';
      div.appendChild(huis);
      appendWithDelete(grid, div, cfg, oef);
      return;
    }

    // --- standaard: SPLITSBENEN ---
{
  const wrap = document.createElement('div');
  wrap.className = 'splitsbenen';
  wrap.style.overflow = 'visible';
  wrap.innerHTML = `
    <div class="top">${isSom ? '___' : String(oef.totaal)}</div>
    <div class="benen-container"><div class="been links"></div><div class="been rechts"></div></div>
    <div class="bottom">
      <div class="bottom-deel">${isSom ? String(oef.deel1) : (oef.prefill==='links' ? String(oef.deel1) : '___')}</div>
      <div class="bottom-deel">${isSom ? String(oef.deel2) : (oef.prefill==='rechts'? String(oef.deel2) : '___')}</div>
    </div>
  `;
  const div = document.createElement('div');
div.className = 'oefening';                     // ← belangrijk voor ronde X-knop
div.style.display = 'flex';
div.style.justifyContent = 'center';
div.style.overflow = 'visible';
div.appendChild(wrap);
appendWithDelete(grid, div, cfg, oef);
return;
}
  }

  else if (oef.type === 'tafels-inzicht') {
  if (window.TI && typeof TI.renderPreview === 'function') {
    // houd per segment zelf een teller bij
    if (typeof cfg._tiIndex !== 'number') cfg._tiIndex = 0;
    TI.renderPreview(grid, cfg, oef, cfg._tiIndex);
    cfg._tiIndex++;
    return;
  } else {
    div.textContent = `${oef.groepen} groepen van ${oef.grootte}`;
    appendWithDelete(grid, div, cfg, oef);
    return;
  }
}


  // tafels
  div.textContent = `${oef.getal1} ${oef.operator} ${oef.getal2} = ___`;
  appendWithDelete(grid, div, cfg, oef);
}

    // 2) Bestaat dit segment al? -> append aan bestaand grid
    let card = werkbladContainer.querySelector(`section.preview-segment[data-segment-key="${segKey}"]`);
    let grid;

    if (!card) {
      // NIEUW segment
      card = document.createElement('section');
      card.className = 'preview-segment';
      card.dataset.segmentKey = segKey;
      card.style.border = '1px solid #b3e0ff';
      card.style.borderRadius = '12px';
      card.style.background = '#f8fcff';
      card.style.padding = '14px';
      card.style.margin = '12px 0';

      // Titel + tools
      // ── Header + tools altijd zichtbaar ─────────────────────────────
const header = document.createElement('div');
header.className = 'seg-header';
Object.assign(header.style, {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 8px 2px 8px',
  position: 'relative',
  zIndex: '10',
});

const title = document.createElement('h3');
title.textContent = titelVoor(cfg);
Object.assign(title.style, {
  margin: '0',
  fontSize: '18px',
  fontWeight: '700',
  color: '#0b4d7a',
});

// tools rechts van de titel
let tools = card.querySelector('.tools');
if (!tools) {
  tools = document.createElement('div');
  tools.className = 'tools';
  Object.assign(tools.style, {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginLeft: 'auto',
    position: 'relative',
    zIndex: '2000',
  });
  tools.innerHTML = `
    <button data-act="gap-dec">− ruimte</button>
    <button data-act="gap-inc">+ ruimte</button>
    <button data-act="edit">Titel</button>
    <button data-act="add">Voeg toe</button>
    <button data-act="del">Verwijder</button>
  `;
  // basisstijl zodat ze niet “verdwijnen”
  tools.querySelectorAll('button').forEach(b=>{
    Object.assign(b.style, {
      background:'#e0f2f7', border:'1px solid #ccd4da',
      borderRadius:'6px', padding:'4px 8px', fontSize:'13px', cursor:'pointer'
    });
    b.addEventListener('mouseenter',()=> b.style.background='#cfe8f2');
    b.addEventListener('mouseleave',()=> b.style.background='#e0f2f7');
  });
}

// acties
tools.addEventListener('click', (e) => {
  const btn = e.target.closest('button'); if (!btn) return;
  const act = btn.dataset.act;

  if (act === 'edit') {
    const nieuw = prompt('Opdrachtzin aanpassen:', title.textContent || '');
    if (nieuw !== null) { title.textContent = nieuw.trim(); cfg.opdracht = title.textContent; }
    paginatePreview();

  } else if (act === 'add') {
    if (cfg.hoofdBewerking === 'splitsen' && cfg.groteSplitshuizen) {
      alert('Bij grote splitshuizen wordt het aantal kolommen bepaald door je gekozen getallenlijst.');
      return;
    }
    const invoer = prompt('Hoeveel oefeningen wil je toevoegen?', '4');
    const extra = Math.max(1, parseInt(invoer, 10) || 0);
    if (!Array.isArray(cfg._oefeningen)) cfg._oefeningen = [];
    for (let i = 0; i < extra; i++) {
      let oef;
      if (cfg.hoofdBewerking === 'rekenen') oef = genereerRekensom(cfg);
      else if (cfg.hoofdBewerking === 'splitsen') { oef = genereerSplitsing(cfg);
        if (cfg.splitsStijl === 'puntoefening')  oef._p = true;
        if (cfg.splitsStijl === 'bewerkingen4')  oef._b4 = true;
      } else if (cfg.hoofdBewerking === 'tafels') oef = genereerTafelsom(cfg);

   else if (cfg.hoofdBewerking === 'tafels-inzicht') {
  // 1 oefening tafels-inzicht bijmaken
  const lijstje = (window.TI && typeof TI.genereer === 'function')
    ? TI.genereer({ ...cfg, numOefeningen: 1 })
    : [];

  if (Array.isArray(lijstje) && lijstje.length) {
    oef = lijstje[0];   // 👉 laat het algemene stuk hieronder het werk doen
  }
}


      if (oef) { cfg._oefeningen.push(oef); renderOefeningInGrid(grid, cfg, oef); }
    }
    paginatePreview();

  } else if (act === 'del') {
    card.remove(); paginatePreview();

  } else if (act === 'gap-inc') {
    PREVIEW_SEG_GAP_PX = Math.min(PREVIEW_SEG_GAP_PX + 4, 64);
    card.style.marginBottom = PREVIEW_SEG_GAP_PX + 'px'; paginatePreview();

  } else if (act === 'gap-dec') {
    PREVIEW_SEG_GAP_PX = Math.max(PREVIEW_SEG_GAP_PX - 4, 0);
    card.style.marginBottom = PREVIEW_SEG_GAP_PX + 'px'; paginatePreview();
  }
});

card.style.overflow = 'visible';
header.append(title, tools);
card.prepend(header);

      // Grid binnen segment
      grid = document.createElement('div');
grid.className = 'preview-grid';
grid.style.alignItems = 'start';
grid.style.justifyItems = 'center';

const hulpGlobaal = !!(cfg.rekenHulp && cfg.rekenHulp.inschakelen);
let kolommen = 4, colGap = '24px', rowGap = '24px';

// Rekenen met hulp = 2 brede kolommen (ongewijzigd)
if (cfg.hoofdBewerking === 'rekenen' && hulpGlobaal) {
  kolommen = 2; colGap = '48px'; rowGap = '36px';
// Rekenen zonder hulp = 3 per rij (zoals PDF)
} else if (cfg.hoofdBewerking === 'rekenen' && !hulpGlobaal) {
  kolommen = 3; colGap = '32px'; rowGap = '20px';
}

// Splitsen varianten (ongewijzigd)
if (cfg.hoofdBewerking === 'splitsen' && cfg.splitsStijl === 'bewerkingen4') { kolommen = 3; colGap = '40px'; rowGap = '56px'; }
if (cfg.hoofdBewerking === 'splitsen' && cfg.splitsStijl === 'puntoefening') { kolommen = 3; colGap = '30px'; rowGap = '22px'; }

grid.style.gridTemplateColumns = `repeat(${kolommen}, minmax(0, 1fr))`;
grid.style.columnGap = colGap;
grid.style.rowGap = rowGap;
card.appendChild(grid);

      // marge onder segment in UI (komt overeen met SEGMENT_GAP in PDF)
      card.style.marginBottom = PREVIEW_SEG_GAP_PX + 'px';

      werkbladContainer.appendChild(card);
    } else {
      // BESTAAND segment: pak het bestaande grid
      grid = card.querySelector('.preview-grid');
      if (!grid) {
        grid = document.createElement('div');
        grid.className = 'preview-grid';
        card.appendChild(grid);
      }
    }

    // ---- Oefeningen tekenen ----
    // ===== MODULE ROUTER (feature-flag) =====
if (renderViaModuleIfAvailable(cfg, grid)) {
  return;
}

    if (cfg.hoofdBewerking === 'splitsen' && cfg.groteSplitshuizen) {
  const lijst = cfg.splitsGetallenArray?.length ? cfg.splitsGetallenArray : [10];
  cfg._oefeningen = lijst.map(max => ({ type: 'GROOT', max }));
  grid.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';

  lijst.forEach((maxGetal, i) => {
    const oef = cfg._oefeningen[i];   // gebruik het bijbehorende object uit de dataset
    const kaart = document.createElement('div');
    kaart.style.fontFamily = 'Arial,Helvetica,sans-serif';
    kaart.style.border = '1px solid #e5e5e5';
    kaart.style.borderRadius = '12px';
    kaart.style.overflow = 'hidden';
    kaart.style.width = '140px';
    kaart.style.background = '#fff';
    kaart.style.boxShadow = '0 1px 2px rgba(0,0,0,.06)';

    const header = document.createElement('div');
    header.textContent = maxGetal;
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

    // --- Nieuw: afwisselend links/rechts vooraf invullen ---
    let fillLeft = true; // start links, volgende rij rechts, enz.
    for (let r = 0; r <= maxGetal; r++) {
      const row = document.createElement('div');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = '1fr 1fr';
      row.style.columnGap = '8px';
      row.style.padding = '0 10px';

      const left  = document.createElement('div');
      const right = document.createElement('div');
      [left, right].forEach(cell => {
        cell.style.height='28px';
        cell.style.display='flex';
        cell.style.alignItems='flex-end';
        cell.style.justifyContent='center';
        cell.style.paddingBottom='4px';
        cell.style.borderBottom='2px solid #333';
        cell.style.fontSize='16px';
        cell.style.lineHeight='1';
      });

      if (fillLeft) {
        left.textContent = r;
        right.textContent = '';
      } else {
        left.textContent = '';
        right.textContent = r;
      }

      row.appendChild(left);
      row.appendChild(right);
      kaart.appendChild(row);

      fillLeft = !fillLeft; // wissel links/rechts voor volgende rij
    }

    const cell = document.createElement('div');
    cell.className = 'oefening';
    cell.style.overflow = 'visible';
    cell.appendChild(kaart);
    appendWithDelete(grid, cell, cfg, oef);  // geef dezelfde referentie door
  });

  return;
}

    const N = cfg.numOefeningen ?? 20;
    const oefeningen = [];
    for (let i = 0; i < N; i++) {
      if (cfg.hoofdBewerking === 'rekenen') { const comp = !!(cfg.rekenHulp && cfg.rekenHulp.stijl === 'compenseren'); oefeningen.push(comp ? genereerRekensomMetCompenseren(cfg) : genereerRekensom(cfg)); }
      else if (cfg.hoofdBewerking === 'splitsen') {
        if (cfg.splitsStijl === 'puntoefening') { const s = genereerSplitsing(cfg); s._p = true; oefeningen.push(s); }
        else if (cfg.splitsStijl === 'bewerkingen4') { const s = genereerSplitsing(cfg); s._b4 = true; oefeningen.push(s); }
        else oefeningen.push(genereerSplitsing(cfg));
      } else if (cfg.hoofdBewerking === 'tafels') oefeningen.push(genereerTafelsom(cfg));
      else if (cfg.hoofdBewerking === 'tafels-inzicht') {
  // genereer precies 1 “tafels-inzicht”-oefening per iteratie
  const lijstje = (window.TI && typeof TI.genereer === 'function')
    ? TI.genereer({ ...cfg, numOefeningen: 1 })
    : [];
  if (lijstje.length) oefeningen.push(lijstje[0]);
}
    }

    // ✅ voeg deze regel exact hier toe:
cfg._oefeningen = oefeningen;
  if (cfg.rekenHulp && cfg.rekenHulp.voorbeeld && Array.isArray(cfg._oefeningen) && cfg._oefeningen.length) { cfg._oefeningen[0]._voorbeeld = true; }

  // Nieuwe, korte versie
oefeningen.forEach(oef => renderOefeningInGrid(grid, cfg, oef));

  }

 // ===== PREVIEW: BENEN tekenen onder juiste term (optellen/aftrekken) =====
// - Optellen: altijd onder term2
// - Aftrekken: onder aftrektal (term1), behalve als cfg.rekenHulp.splitsPlaatsAftrekken expliciet 'onderAftrekker' is
// - Antwoordvak blijft naast '=' (we positioneren absoluut, dus niet in de inline flow)
// - Werkt ook netjes bij ééncijferige termen (niet meer onder het '='-gedeelte)
// - Blauwe kaartkader pakt de benen mee door minHeight-reservering
// ===== PREVIEW: BENEN onder juiste term met offsetLeft/offsetTop =====
// ===== PREVIEW: BENEN onder juiste term, correct bij 1-cijferige termen =====
// ===== PREVIEW: BENEN onder juiste term (robuust, ook bij 1-cijferige termen) =====
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
    svg.setAttribute('width', svgW); svg.setAttribute('height', svgH);
    svg.style.position='absolute'; svg.style.left='0'; svg.style.top='0'; svg.style.pointerEvents='none'; svg.style.overflow='visible';

    const el = (n,a)=>{const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);return e;};
    svg.appendChild(el('line',{x1:anchorX,y1:apexY,x2:anchorX-horiz,y2:bottomTopY,stroke:'#333','stroke-width':2}));
    svg.appendChild(el('line',{x1:anchorX,y1:apexY,x2:anchorX+horiz,y2:bottomTopY,stroke:'#333','stroke-width':2}));
    svg.appendChild(el('rect',{x:anchorX-horiz-boxW/2,y:bottomTopY,width:boxW,height:boxH,rx:r,ry:r,fill:'#fff',stroke:'#ddd','stroke-width':2}));
    svg.appendChild(el('rect',{x:anchorX+horiz-boxW/2,y:bottomTopY,width:boxW,height:boxH,rx:r,ry:r,fill:'#fff',stroke:'#ddd','stroke-width':2}));
    const t1=el('text',{x:anchorX-horiz,y:bottomTopY+boxH-6,'text-anchor':'middle','font-family':'Arial,Helvetica,sans-serif','font-size':'14'});t1.textContent='___';
    const t2=el('text',{x:anchorX+horiz,y:bottomTopY+boxH-6,'text-anchor':'middle','font-family':'Arial,Helvetica,sans-serif','font-size':'14'});t2.textContent='___';
    svg.appendChild(t1); svg.appendChild(t2);
    exprWrap.appendChild(svg);

    if (rechtsKolom) {
      const rechtsRect = rechtsKolom.getBoundingClientRect();
      const ansCenterX = aRect.left + aRect.width / 2;
      const offset = Math.max(0, ansCenterX - rechtsRect.left + 6);
      rechtsKolom.style.paddingLeft = `${offset}px`;
    }
  }
  /* =========================================================
   PREVIEW ENGINE – END
   Alles hierboven hoort bij:
   - preview renderen
   - preview interactie
   - preview lay-out
   ========================================================= */
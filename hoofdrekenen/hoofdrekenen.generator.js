/* =========================================================
   HOOFDREKENEN – GENERATOR (OPTELLEN & AFTREKKEN)
   Overgenomen uit bewerkingen_werkblad_versie2.js (1-op-1),
   met enkel ES-module exports toegevoegd.
   ========================================================= */

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

function genereerRekensom(cfg) {
    
    // ================================
// FAILSAFE: nooit blokkeren
// ================================
if (!cfg || !cfg.rekenMaxGetal) {
  return null;
}

    // =====================================
// EVENWICHT OPTELLEN / AFTREKKEN
// =====================================
if (cfg.typeBewerking === 'beide') {
  if (!cfg._verdeling) {
    cfg._verdeling = { plus: 0, min: 0 };
  }
}

    // =====================================================
// DIDACTISCHE AFBENING KLEINE BEREIKEN
// Tot 5 en tot 10: alleen E+E / E-E, nooit brug
// =====================================================
if (cfg.rekenMaxGetal <= 10) {
  cfg.somTypes = ['E+E'];
  cfg.rekenBrug = 'zonder';
}

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

    // =====================================
// OPERATORKEUZE (EVENWICHT BIJ "BEIDE")
// =====================================
if (cfg.rekenType === 'optellen') {
  op = '+';
} else if (cfg.rekenType === 'aftrekken') {
  op = '-';
} else {
  // beide → forceer evenwicht
  if (!cfg._verdeling) cfg._verdeling = { plus: 0, min: 0 };

  if (cfg._verdeling.plus <= cfg._verdeling.min) {
    op = '+';
    cfg._verdeling.plus++;
  } else {
    op = '-';
    cfg._verdeling.min++;
  }
}


    if (op === '+') {
      while (g1 + g2 > maxGetal) { if (g1 > g2) g1 = Math.floor(g1 / 2); else g2 = Math.floor(g2 / 2); }
    } else {
      if (g1 < g2) [g1, g2] = [g2, g1];
      while (g1 > maxGetal) { g1 = Math.floor(g1 / 2); if (g1 < g2) [g1, g2] = [g2, g1]; }
    }

    // === NORMALISATIE vóór de while-check ==================================
    // Alleen toepassen bij brugoefeningen.
    // Doel A (OPTELLEN): geen uitkomst die exact een veelvoud van 10 is (…=10,20,30,…)
    // Doel B (AFTREKKEN + benen onder AFTREKKER): aftrektal (g1) mag geen zuiver tiental zijn (10,20,30,…)
    if (somHeeftBrug(g1, g2, op)) {

      // A) Optellen: vermijd uitkomst 10/20/30/…
      if (op === '+' && ((g1 + g2) % 10) === 0) {
        const max = maxGetal;

        // probeer g2 +1 (brug behouden en binnen max)
        if ((g1 + g2 + 1) <= max && ((g1 % 10) + ((g2 + 1) % 10) > 9)) {
          g2 += 1;
        }
        // anders g2 −1
        else if (g2 > 1 && ((g1 % 10) + ((g2 - 1) % 10) > 9)) {
          g2 -= 1;
        }
        // anders g1 +1
        else if ((g1 + 1 + g2) <= max && (((g1 + 1) % 10) + (g2 % 10) > 9)) {
          g1 += 1;
        }
        // anders g1 −1 (als kan)
        else if (g1 > 1 && (((g1 - 1) % 10) + (g2 % 10) > 9)) {
          g1 -= 1;
        }
      }

      // B) Aftrekken + “benen onder aftrekker”: g1 mag geen zuiver tiental zijn
      if (
        op === '-' &&
        cfg?.rekenHulp?.inschakelen &&
        cfg.rekenHulp.splitsPlaatsAftrekken === 'onderAftrekker' &&
        (g1 % 10 === 0)
      ) {
        // Maak van T0 → TE met e1 < e2 zodat de brug visueel klopt
        let e2 = g2 % 10;
        if (e2 <= 1) { g2 += (2 - e2); }   // zorg dat e2 ≥ 2
        g1 += 1;                           // e1 = 1 → g1 geen zuiver tiental meer
      }
    }
    // === EINDE NORMALISATIE ================================================

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

export {
  rnd,
  somHeeftBrug,
  checkBrug,
  genereerRekensom,
  genereerRekensomMetCompenseren
};

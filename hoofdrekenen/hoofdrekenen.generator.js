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
if (cfg.rekenType === 'beide') {
  if (!cfg._verdeling) {
    cfg._verdeling = { plus: 0, min: 0 };
  }
}

    // =====================================================
// DIDACTISCHE AFBENING KLEINE BEREIKEN
// Tot 5 en tot 10: alleen E+E / E-E, nooit brug
// =====================================================
if (cfg.rekenMaxGetal <= 5) {
  cfg.somTypes = ['E+E'];
  cfg.rekenBrug = 'zonder';
}

if (cfg.rekenMaxGetal > 5 && cfg.rekenMaxGetal <= 10) {
  cfg.somTypes = ['E+E', 'T-E'];
  cfg.rekenBrug = 'zonder';
}


  let types = cfg.somTypes?.length ? [...cfg.somTypes] : ['E+E'];
let gekozenType;
let safety = 0;

// =====================================
// EERLIJKE VERDELING VAN SOMTYPES
// =====================================
if (!cfg._typePoolKey || cfg._typePoolKey !== JSON.stringify(types)) {
  cfg._typePoolKey = JSON.stringify(types);
  cfg._typePool = shuffle([...types]);
}

// helper: Fisher–Yates shuffle
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

do {
  if (++safety > 80) {
    return null;
  }

  if (!cfg._typePool || cfg._typePool.length === 0) {
  cfg._typePool = shuffle([...types]);
}
gekozenType = cfg._typePool.shift();


  // ❌ Brug = met → E-E is onmogelijk
  if (cfg.rekenBrug === 'met' && gekozenType === 'E-E') {
    gekozenType = null;
    continue;
  }

  // ❌ Brug = met + AFTREKKEN → E+E is ook onmogelijk
  if (
    cfg.rekenBrug === 'met' &&
    cfg.rekenType === 'aftrekken' &&
    gekozenType === 'E+E'
  ) {
    gekozenType = null;
    continue;
  }


} while (!gekozenType);


  const maxGetal = cfg.rekenMaxGetal || 100;
  let g1, g2, op, pogingen = 0;

  // 🔒 Operator altijd vooraf zetten (voorkomt undefined in errors)
if (cfg.rekenType === 'optellen') {
  op = '+';
} else if (cfg.rekenType === 'aftrekken') {
  op = '-';
} else {
  // bij "beide" voorlopig + als default
  op = '+';
}

// =====================================
// ALIAS: aftrek-types komen soms binnen met "+"-naam
// =====================================
if (op === '-') {
  if (gekozenType === 'T+TE') gekozenType = 'T-TE';
  if (gekozenType === 'T+E')  gekozenType = 'T-E';
  if (gekozenType === 'TE-TE') gekozenType = 'TE+TE'; // ✅ DIT ONTBRAK
}



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
  // ❗ Onmogelijke combinatie → deze oefening overslaan
  return null;
}

    // ❌ Somtypes die nooit mogen bij tot 100
if (cfg.rekenMaxGetal <= 100) {
  if (
    gekozenType === 'H+H' ||
    gekozenType === 'HT+HT' ||
    gekozenType === 'HTE+H' ||
    gekozenType === 'HTE+HT' ||
    gekozenType === 'HTE+HTE'
  ) {
       // Kies onmiddellijk een nieuw type, anders blijf je 120x hangen
    gekozenType = types[Math.floor(Math.random() * types.length)];
    continue;

  }
}

    switch (gekozenType) {
      case 'E+E': g1 = rnd(1, 9); g2 = rnd(1, 9); break;
      case 'T+E': {
  if (cfg.rekenMaxGetal === 20) {
    g1 = 10;               // 👈 alleen 10 bij tot 20
  } else {
    g1 = rnd(1, 9) * 10;   // 👈 10,20,30,…90 bij tot 100/1000
  }

  g2 = rnd(1, 9);
  break;
}

      case 'T-E': {
  if (cfg.rekenMaxGetal === 20) {
    // bij tot 20: enkel 10 of 20
    g1 = rnd(1, 2) * 10;   // 10 of 20
  } else {
    g1 = rnd(1, 9) * 10;  // 10..90
  }

  g2 = rnd(1, 9);
  break;
}

case 'T-TE': {
  // 🔹 speciaal voor tot 20
  if (cfg.rekenMaxGetal === 20) {
    g1 = 20;
    g2 = rnd(11, 19);   // echte TE
    break;
  }

  // 🔹 bestaand gedrag voor grotere bereiken
  const maxT = Math.min(10, Math.floor((cfg.rekenMaxGetal || 100) / 10));
  if (maxT < 2) continue;

  g1 = rnd(2, maxT) * 10;

  const g2max = Math.min(99, g1 - 1);
  if (g2max < 20) continue;

  do {
    g2 = rnd(20, g2max);
  } while (g2 % 10 === 0);

  break;
}



      case 'T+T': {
  const t1 = rnd(1, 9);
  const t2 = rnd(1, 9);

  g1 = t1 * 10;
  g2 = t2 * 10;

  // MET brug: tientallen samen moeten >= 10 zijn
  if (cfg.rekenBrug === 'met' && (t1 + t2 < 10)) continue;

  // ZONDER brug: tientallen samen moeten < 10 zijn
  if (cfg.rekenBrug === 'zonder' && (t1 + t2 >= 10)) continue;

  break;
}

      case 'T+TE':
  g1 = rnd(1, 9) * 10;
  g2 = rnd(11, 99);
  if (g2 % 10 === 0) continue; // TE ≠ zuiver tiental
  break;
     case 'TE+E':
  g1 = rnd(11, 99);
  if (g1 % 10 === 0) continue;   // ❌ geen zuiver tiental
  g2 = rnd(1, 9);
  break;

case 'TE+T':
  g1 = rnd(11, 99);
  g2 = rnd(1, 9) * 10;

  // ❌ bij tot 100: som moet ≤ 100
  if (cfg.rekenMaxGetal <= 100 && (g1 + g2) > 100) continue;

  // ❌ zonder brug: E + 0 mag geen brug geven
  if (cfg.rekenBrug === 'zonder' && (g1 % 10) > 9) continue;

  // ❌ met brug: TE + T geeft nooit brug → dus verbieden
  if (cfg.rekenBrug === 'met') continue;

  break;

case 'TE+TE': {

  // 🔹 bereik beperken voor tot 20
  if (cfg.rekenMaxGetal === 20) {
    g1 = rnd(11, 19);
    g2 = rnd(11, 19);
  } else {
    g1 = rnd(11, 99);
    g2 = rnd(11, 99);
  }

  // ❌ geen zuivere tientallen (moeten echte TE zijn)
  if (g1 % 10 === 0 || g2 % 10 === 0) continue;

  // ❌ TE-TE tot 20 kan NOOIT met brug
  if (cfg.rekenMaxGetal === 20 && cfg.rekenBrug === 'met') continue;

  // ❌ bij tot 100: som mag niet boven 100 uitkomen
  if (cfg.rekenMaxGetal <= 100 && (g1 + g2) > 100) continue;

  // ✅ bij tot 100 + met brug: eenheden moeten samen > 10
  if (
    cfg.rekenMaxGetal <= 100 &&
    cfg.rekenBrug === 'met' &&
    ((g1 % 10) + (g2 % 10) <= 10)
  ) continue;

  break;
}



      case 'H+H': g1 = rnd(1, 9) * 100; g2 = rnd(1, 9) * 100; break;
      case 'HT+T': {
  const h = rnd(1, 9);
  const t1 = rnd(1, 9);
  const t2 = rnd(1, 9);

  g1 = h * 100 + t1 * 10; // HT
  g2 = t2 * 10;          // T

  // MET brug: tientallen samen moeten >= 10 zijn
  if (cfg.rekenBrug === 'met' && (t1 + t2 < 10)) continue;

  // ZONDER brug: tientallen samen moeten < 10 zijn
  if (cfg.rekenBrug === 'zonder' && (t1 + t2 >= 10)) continue;

  break;
}

      case 'HT+HT': {
  const h1 = rnd(1, 9);
  const t1 = rnd(1, 9);
  const h2 = rnd(1, 9);
  const t2 = rnd(1, 9);

  g1 = h1 * 100 + t1 * 10;   // HT
  g2 = h2 * 100 + t2 * 10;   // HT

  // zonder brug: tientallen mogen samen geen brug maken
  if (cfg.rekenBrug === 'zonder' && (t1 + t2 > 9)) continue;

  break;
}
case 'HTE+HT':
  g1 = rnd(100, 999);              // HTE
  g2 = rnd(1, 9) * 100 + rnd(1, 9) * 10; // HT

  // zonder brug: eenheden + 0 mag geen brug geven
  if (cfg.rekenBrug === 'zonder' && (g1 % 10) > 9) continue;

  break;


case 'HTE+H':
  g1 = rnd(100, 999);        // HTE
  g2 = rnd(1, 9) * 100;     // H

  // zonder brug: eenheden + 0 mag nooit > 9
  if (cfg.rekenBrug === 'zonder' && (g1 % 10) > 9) continue;

  break;

      case 'HTE+HTE': g1 = rnd(100, 999); g2 = rnd(100, 999); break;
    }

// =========================================================
// HARDE TYPE-AFBAKENING — gekozen somtypes respecteren
// =========================================================
if (
  cfg.somTypes &&
  cfg.somTypes.includes('TE+TE') &&
  gekozenType === 'T+T'
) {
  continue;
}

    // =========================================================
// TYPE-AFBAKENING — brug naar honderdtal (TOT 1000)
// =========================================================
if (
  op === '+' &&
  cfg.rekenMaxGetal === 1000 &&
  cfg.rekenBrug === 'met' &&
  cfg.brugSoorten?.honderdtal &&
  !cfg.brugSoorten.meervoudig
) {
  // ❌ T + T niet toelaten bij honderdtalbrug
  if (gekozenType === 'T+T') {
    continue;
  }
}


// ✅ AFTREKKEN ZONDER BRUG – expliciet toelaten van T−E
if (
  op === '-' &&
  cfg.rekenBrug === 'zonder' &&
  gekozenType === 'T+E'
) {
  // niets doen → deze combinatie is geldig
}

    // =====================================
// OPERATORKEUZE (EVENWICHT BIJ "BEIDE")
// =====================================
// 🔒 Aftrekken: aftrektal moet groter zijn dan aftrekker
// ❗ behalve bij TE-TE (heeft eigen logica)
if (
  op === '-' &&
  g1 <= g2 &&
  gekozenType !== 'TE+TE'
) {
  continue;
}

// ================================
// AFTREKKEN MET BRUG – TYPE TE − TE
// ================================
if (
  op === '-' &&
  gekozenType === 'TE-TE'
) {
  const e1 = g1 % 10;
  const e2 = g2 % 10;

  if (g1 <= g2) continue;

  // bij tot 20: GEEN brug afdwingen
  if (cfg.rekenMaxGetal === 20) {
    if (e1 === 0 || e2 === 0) continue;
    if (e1 < e2) continue; // zonder brug
  }

  // bij grotere bereiken: bruglogica behouden
  if (cfg.rekenMaxGetal > 20 && cfg.rekenBrug === 'met') {
    if (e1 >= e2) continue;
  }
}


// ================================
// AFTREKKEN MET BRUG – TYPE TE − E
// ================================
if (
  op === '-' &&
  cfg.rekenBrug === 'met' &&
  gekozenType === 'TE+E'
) {
  const e1 = g1 % 10;
  const e2 = g2 % 10;

  // aftrektal moet TE zijn
  if (e1 === 0) continue;

  // aftrekker moet E zijn (1–9)
  if (g2 < 1 || g2 > 9) continue;

  // brug is verplicht
  if (e1 >= e2) continue;
}

// 🔒 FINALE TYPE-GARANTIE: TE − TE met brug
if (
  cfg.rekenMaxGetal !== 20 &&
  op === '-' &&
  cfg.rekenBrug === 'met' &&
  gekozenType === 'TE+TE'
) {

  const e1 = g1 % 10;
  const e2 = g2 % 10;

  // aftrektal moet > 20 en geen tiental zijn
  if (g1 <= 20 || e1 === 0) {
    return null;
  }

  // aftrekker moet ≥ 20 en geen tiental zijn
  if (g2 < 20 || e2 === 0) {
    return null;
  }

  // brug moet verplicht aanwezig zijn
  if (e1 >= e2) {
   return null;
  }
}

// =====================================
// ABSOLUTE GRENS VOOR TOT 20 (NA GENERATIE)
// =====================================
if (cfg.rekenMaxGetal === 20) {
  if (g1 > 20 || g2 > 20) {
    return null;
  }
}



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
// 🔒 Bewerkingskeuze afdwingen
if (cfg.rekenType === 'aftrekken' && op !== '-') continue;
if (cfg.rekenType === 'optellen' && op !== '+') continue;

// 🔒 Optellen met brug: geen T+T met 0+0 (20+80, 30+70, …)
if (
  cfg.rekenBrug === 'met' &&
  op === '+' &&
  g1 % 10 === 0 &&
  g2 % 10 === 0
) {
  continue;
}


  if (op === '+' && (g1 + g2) > maxGetal) {
  continue;
}



// ❌ TE − E met brug: aftrektal mag geen zuiver tiental zijn
if (
  op === '-' &&
  cfg.rekenBrug === 'met' &&
  gekozenType === 'TE+E' &&
  (g1 % 10 === 0)
) {
  continue;
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
  (g1 % 10 === 0) &&
  gekozenType !== 'T-TE'
) {

        // Maak van T0 → TE met e1 < e2 zodat de brug visueel klopt
        let e2 = g2 % 10;
        if (e2 <= 1) { g2 += (2 - e2); }   // zorg dat e2 ≥ 2
        g1 += 1;                           // e1 = 1 → g1 geen zuiver tiental meer
      }
    }

    // =========================================================
// BRUGSOORT – OPTELLEN – ALLEEN TE+TE – ALLEEN TOT 1000
// =========================================================
if (
  op === '+' &&
  cfg.rekenMaxGetal === 1000 &&
  cfg.rekenBrug === 'met' &&
  cfg.brugSoorten &&
  gekozenType === 'TE+TE'
) {
  const e1 = g1 % 10;
  const e2 = g2 % 10;

  const t1 = Math.floor((g1 % 100) / 10);
  const t2 = Math.floor((g2 % 100) / 10);

  const eenhedenBrug   = (e1 + e2) >= 10;
  const tientallenBrug = (t1 + t2) >= 10;

  // 👉 enkel brug naar honderdtal
  if (cfg.brugSoorten.honderdtal && !cfg.brugSoorten.tiental && !cfg.brugSoorten.meervoudig) {
    if (!tientallenBrug) continue;
    if (eenhedenBrug) continue;
  }

  // 👉 enkel brug naar tiental
  if (cfg.brugSoorten.tiental && !cfg.brugSoorten.honderdtal && !cfg.brugSoorten.meervoudig) {
    if (!eenhedenBrug) continue;
    if (tientallenBrug) continue;
  }

  // 👉 meervoudige brug
  if (cfg.brugSoorten.meervoudig) {
    if (!(eenhedenBrug && tientallenBrug)) continue;
  }
}

// 🔒 OPTELLEN MET BRUG
// Bij tot 1000 + brugsoort gekozen: brugsoort-filter is leidend
if (
  op === '+' &&
  cfg.rekenBrug === 'met' &&
  !(
    cfg.rekenMaxGetal === 1000 &&
    cfg.brugSoorten &&
    (cfg.brugSoorten.tiental || cfg.brugSoorten.honderdtal || cfg.brugSoorten.meervoudig)
  ) &&
  !somHeeftBrug(g1, g2, '+')
) {
  continue;
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
      return null;
    }
  }

// 🔒 FINALE VEILIGHEID: bij aftrekken nooit een negatief resultaat
// ❗ Behalve bij T − TE: daar mag nooit geswapt worden
if (
  op === '-' &&
  g1 < g2 &&
  gekozenType !== 'T-TE'
) {
  const tmp = g1;
  g1 = g2;
  g2 = tmp;
}


// 🔒 FINALE TYPE-GARANTIE (NA SWAP): TE − TE met brug
if (
  cfg.rekenMaxGetal !== 20 &&
  op === '-' &&
  cfg.rekenBrug === 'met' &&
  gekozenType === 'TE+TE'
) {

  const e1 = g1 % 10;
  const e2 = g2 % 10;

  // aftrektal moet > 20 en geen tiental zijn
  if (g1 <= 20 || e1 === 0) {
    return null;
  }

  // aftrekker moet ≥ 20 en geen tiental zijn
  if (g2 < 20 || e2 === 0) {
    return null;
  }

  // brug moet verplicht aanwezig zijn
  if (e1 >= e2) {
    return null;
  }
}

// 🔒 FINALE TYPE-GARANTIE: TE − E mag nooit T − E worden
if (
  op === '-' &&
  cfg.rekenBrug === 'met' &&
  gekozenType === 'TE+E'
) {
  // aftrektal moet effectief TE zijn
  if (g1 % 10 === 0) {
    return null;
  }

  // aftrekker moet effectief E zijn
  if (g2 < 1 || g2 > 9) {
    return null;
  }

  // brug moet effectief aanwezig zijn
  if ((g1 % 10) >= (g2 % 10)) {
   return null;
  }
}
// 🔒 ABSOLUTE FINALE GARANTIE: T − TE met brug
  if (
  cfg.rekenMaxGetal !== 20 &&
  op === '-' &&
  cfg.rekenBrug === 'met' &&
  gekozenType === 'T-TE'
) {

  const e1 = g1 % 10;
  const e2 = g2 % 10;

  // aftrektal MOET zuiver tiental zijn
  if (e1 !== 0) {
    return null;
  }

  // aftrektal moet minstens 20 zijn
  if (g1 < 20) {
    return null;
  }

  // aftrekker MOET TE zijn (≥ 20 en geen tiental)
  if (g2 < 20 || e2 === 0) {
    return null;
  }

  // brug is verplicht
  if (e1 >= e2) {
    return null;
  }
}

// 🔒 ABSOLUTE GRENS: optellen mag nooit boven maxGetal uitkomen
if (op === '+' && (g1 + g2) > maxGetal) {
  return null;
}

// 🔒 ABSOLUTE GARANTIE: optellen met brug = echte brug
if (
  op === '+' &&
  cfg.rekenBrug === 'met' &&
  !somHeeftBrug(g1, g2, '+')
) {
 return null;
}

// =========================================================
// FINALE BRUGSOORT-CHECK (NA normalisatie) — ALLEEN TE+TE
// =========================================================
if (
  op === '+' &&
  cfg.rekenMaxGetal === 1000 &&
  cfg.rekenBrug === 'met' &&
  cfg.brugSoorten &&
  gekozenType === 'TE+TE'
) {
  const e1 = g1 % 10;
  const e2 = g2 % 10;
  const t1 = Math.floor((g1 % 100) / 10);
  const t2 = Math.floor((g2 % 100) / 10);

  const eenhedenBrug   = (e1 + e2) >= 10;
  const tientallenBrug = (t1 + t2) >= 10;

  // enkel brug naar honderdtal → GEEN meervoudige brug
  if (cfg.brugSoorten.honderdtal && !cfg.brugSoorten.meervoudig) {
    if (!tientallenBrug || eenhedenBrug) {
     return null;
    }
  }

  // enkel brug naar tiental → GEEN meervoudige brug
  if (cfg.brugSoorten.tiental && !cfg.brugSoorten.meervoudig) {
    if (!eenhedenBrug || tientallenBrug) {
     return null;
    }
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
  return null;

}

export {
  rnd,
  somHeeftBrug,
  checkBrug,
  genereerRekensom,
  genereerRekensomMetCompenseren
};

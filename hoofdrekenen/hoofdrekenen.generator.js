/* =========================================================
   HOOFDREKENEN – GENERATOR (OPTELLEN & AFTREKKEN)
   Overgenomen uit bewerkingen_werkblad_versie2.js (1-op-1),
   met enkel ES-module exports toegevoegd.
   ========================================================= */

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// =====================================================
// AFTREKKEN ZONDER BRUG — TE-TE — TOT 100 (APARTE ROUTE)
// =====================================================
function genereerAftrekkenZonderBrug_TE_TE_tot100(aantal = 20) {
  console.log('>>> APARTE TE-TE ZONDER BRUG WORDT GEBRUIKT');

  const oefeningen = [];
  let safety = 0;

  while (oefeningen.length < aantal && safety < 10000) {
    safety++;

    // twee echte TE-getallen
    const g1 = Math.floor(Math.random() * 89) + 11; // 11..99
    const g2 = Math.floor(Math.random() * 89) + 11;

    // geen zuivere tientallen
    if (g1 % 10 === 0 || g2 % 10 === 0) continue;

    // aftrektal moet groter zijn
    if (g1 <= g2) continue;

    // ZONDER BRUG: geen lenen bij eenheden
    if ((g1 % 10) < (g2 % 10)) continue;

    oefeningen.push({
      getal1: g1,
      getal2: g2,
      operator: '-'
    });
  }

  return oefeningen;
}

// HULPFUNCTIE: Bepaalt of er visueel een 'brug' is.
function somHeeftBrug(g1, g2, op) {
  const e1 = g1 % 10;
  const e2 = g2 % 10;
  const t1 = Math.floor(g1 / 10) % 10;
  const t2 = Math.floor(g2 / 10) % 10;

  if (op === '+') {
    // 1. Eenhedenbrug: 8 + 7 > 9
    if (e1 + e2 >= 10) return true;

    // 2. Tientallenbrug (bij getallen < 100 die samen > 100 gaan)
    // Bv. 51 + 87 -> 50 + 80 = 130 (brug over 100)
    // DIT is de regel die ervoor zorgt dat je vakjes krijgt bij 51+87
    if (g1 < 100 && g2 < 100 && (g1 + g2) >= 100) return true;

    // 3. HT + HT brug (20 + 90)
    if (e1 === 0 && e2 === 0 && (t1 + t2 >= 10)) return true;

    return false;
  } else {
    // AFTREKKEN
    // 1. Eenhedenbrug: 5 - 8
    if (e1 < e2) return true;

    // 2. Tientallenbrug: 130 - 80 (lenen bij honderdtal)
    if (g1 >= 100 && g2 >= 10 && t1 < t2) return true;

    return false;
  }
}

function checkBrug(g1, g2, op, brugType) {
  if (!brugType || brugType === 'beide') return true;
  const heeft = somHeeftBrug(g1, g2, op);
  if (brugType === 'met') return heeft;
  if (brugType === 'zonder') return !heeft;
  return true;
}

function genereerRekensom(cfg) {
// =====================================================
// EARLY EXIT: AFTREKKEN ZONDER BRUG — TE+TE — TOT 100
// =====================================================
if (
  cfg.rekenType === 'aftrekken' &&
  cfg.rekenBrug === 'zonder' &&
  cfg.rekenMaxGetal <= 100 &&
  Array.isArray(cfg.somTypes) &&
  cfg.somTypes.length === 1 &&
  cfg.somTypes[0] === 'TE+TE'
) {
  const aantal = cfg.aantalOefeningen || 20;
  const lijst = genereerAftrekkenZonderBrug_TE_TE_tot100(aantal);
  return lijst[Math.floor(Math.random() * lijst.length)];
}



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

case 'TE+T': {
  // TE: 11–99, geen tientallen
  g1 = rnd(11, 99);
  if (g1 % 10 === 0) continue;

  // T: 10–90
  g2 = rnd(1, 9) * 10;

  // grens tot 1000
  if (g1 + g2 > cfg.rekenMaxGetal) continue;

  // brugcontrole (eenhedenbrug)
  if (cfg.rekenBrug === 'met') {
    if ((g1 % 10) + (g2 % 10) < 10) continue;
  }
  if (cfg.rekenBrug === 'zonder') {
    if ((g1 % 10) + (g2 % 10) >= 10) continue;
  }

  break;
}

case 'TE+TE': {
        // We gebruiken een interne lus om zeker te zijn dat we een geldige combinatie vinden
        // voordat we doorgaan. Dit voorkomt dat de algemene brug-check foute sommen goedkeurt.
        let subSafety = 0;
        let gevonden = false;

        while (subSafety++ < 50) { // Probeer max 50 keer intern
          
          // 1. Genereren
          if (cfg.rekenMaxGetal === 20) {
            g1 = rnd(11, 19);
            g2 = rnd(11, 19);
          } else {
            g1 = rnd(11, 99);
            g2 = rnd(11, 99);
          }

          // 2. Basis checks
          if (g1 % 10 === 0 || g2 % 10 === 0) continue; // Geen tientallen

          // Tot 20 specifiek
          if (cfg.rekenMaxGetal === 20) {
             if (cfg.rekenBrug === 'met') continue; // Kan niet
             // Tot 20 is altijd max 20
             if (g1 + g2 > 20) continue;
          }

          // Tot 100 en hoger
          if (cfg.rekenMaxGetal > 20) {
             // Somgrens checken
             if (g1 + g2 > (cfg.rekenMaxGetal || 100)) continue;
          }

          // 3. Bruglogica checken
          if (cfg.rekenMaxGetal <= 100) {
             // ... (oude logica voor tot 100 blijft hier gelijk) ...
             if (cfg.rekenBrug === 'met' && ((g1 % 10) + (g2 % 10) <= 10)) continue;
             if (cfg.rekenBrug === 'zonder' && ((g1 % 10) + (g2 % 10) >= 10)) continue;
          } 
          else if (cfg.rekenMaxGetal > 100) {
             // === DE NIEUWE LOGICA VOOR TOT 1000 ===
             
             // Zonder brug
             if (cfg.rekenBrug === 'zonder') {
               if ((g1 % 10) + (g2 % 10) >= 10) continue;
             }
             
             // Met brug
             if (cfg.rekenBrug === 'met') {
                const types = [];
                // Kijk welke vinkjes aan staan
                if (cfg.brugSoorten?.tiental) types.push('tiental');
                if (cfg.brugSoorten?.honderdtal) types.push('honderdtal');
                if (cfg.brugSoorten?.meervoudig) types.push('meervoudig');
                
                // Fallback
                if (types.length === 0) types.push('tiental', 'honderdtal');

                // Kies één specifiek doel voor deze poging
                const doel = types[Math.floor(Math.random() * types.length)];

                const e1 = g1 % 10;
                const e2 = g2 % 10;
                const t1 = Math.floor(g1 / 10);
                const t2 = Math.floor(g2 / 10);

                // Check 1: Brug naar TIENTAL (45 + 28)
                // Eis: Eenheden > 9, Tientallen < 10 (geen honderdtal)
                if (doel === 'tiental') {
                   if (e1 + e2 < 10) continue;  
                   if (t1 + t2 >= 10) continue; 
                }

                // Check 2: Brug naar HONDERDTAL (82 + 45)
                // Eis: Eenheden < 10 (GEEN brug), Tientallen >= 10 (WEL brug)
                if (doel === 'honderdtal') {
                   if (e1 + e2 >= 10) continue; // Dit blokkeert nu effectief de meervoudige brug
                   if (t1 + t2 < 10) continue;
                }

                // Check 3: MEERVOUDIGE BRUG (88 + 44)
                if (doel === 'meervoudig') {
                   if (e1 + e2 < 10) continue;
                   if (t1 + t2 < 10) continue;
                }
             }
          }

          // Als we hier komen, is de som geldig!
          gevonden = true;
          break; // Breek uit de interne while-lus
        }

        // Als na 50 pogingen niks gevonden is, reset g1/g2 om de buitenste lus te dwingen opnieuw te proberen
        if (!gevonden) {
           g1 = 0; 
           g2 = 0;
        }
        break; // Breek uit de switch
      }



      case 'H+H': g1 = rnd(1, 9) * 100; g2 = rnd(1, 9) * 100; break;
case 'HT+T': {
  // HT: 110–990, geen tientallen
  g1 = rnd(11, 99) * 10;
  if (g1 % 100 === 0) continue;

  // T: 10–90
  g2 = rnd(1, 9) * 10;

  if (g1 + g2 > cfg.rekenMaxGetal) continue;

  // brugcontrole (tientallenbrug)
  if (cfg.rekenBrug === 'met') {
    if (((g1 % 100) / 10) + ((g2 % 100) / 10) < 10) continue;
  }
  if (cfg.rekenBrug === 'zonder') {
    if (((g1 % 100) / 10) + ((g2 % 100) / 10) >= 10) continue;
  }

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

      case 'HTE+HTE': {
         // === HTE + HTE SPECIFIEK VOOR BRUGSOORTEN (TOT 1000) ===
         let subSafety = 0;
         let gevonden = false;

         while (subSafety++ < 50) {
            // Basisgeneratie: zorg dat som <= 1000 en het HTE zijn (>=100)
            g1 = rnd(100, 899); 
            g2 = rnd(100, 1000 - g1);

            // Moeten HTE blijven (geen 0xx)
            if (g1 < 100 || g2 < 100) continue; 

            const e1 = g1 % 10, e2 = g2 % 10;
            const t1 = Math.floor(g1/10)%10, t2 = Math.floor(g2/10)%10;

            // Situatie 1: ZONDER BRUG
            if (cfg.rekenBrug === 'zonder') {
               if (e1 + e2 >= 10) continue; // geen eenhedenbrug
               if (t1 + t2 >= 10) continue; // geen tientallenbrug
               gevonden = true; break;
            }

            // Situatie 2: MET BRUG
            if (cfg.rekenBrug === 'met') {
               const types = [];
               if (cfg.brugSoorten?.tiental) types.push('tiental');
               if (cfg.brugSoorten?.honderdtal) types.push('honderdtal');
               if (cfg.brugSoorten?.meervoudig) types.push('meervoudig');
               
               // Fallback
               if (types.length === 0) types.push('tiental', 'honderdtal', 'meervoudig');

               const doel = types[Math.floor(Math.random() * types.length)];

               const unitSum = e1 + e2;
               // Bij de tientallen moeten we de eventuele carry meerekenen
               // Als unitSum >= 10, komt er +1 bij de tientallen
               const carryNaarT = (unitSum >= 10) ? 1 : 0;
               const tenSum = t1 + t2 + carryNaarT;

               if (doel === 'tiental') {
                  // Wel E-brug, Geen T-brug
                  if (unitSum >= 10 && tenSum < 10) { gevonden = true; break; }
               } 
               else if (doel === 'honderdtal') {
                  // Geen E-brug, Wel T-brug
                  if (unitSum < 10 && tenSum >= 10) { gevonden = true; break; }
               }
               else if (doel === 'meervoudig') {
                  // Wel E-brug, Wel T-brug
                  if (unitSum >= 10 && tenSum >= 10) { gevonden = true; break; }
               }
            } else {
               // Als brug 'beide' is, gewoon accepteren
               gevonden = true; break;
            }
         }
         // Fallback als het niet lukt: resetten (wordt opgevangen door main loop)
         if (!gevonden) { g1 = 0; g2 = 0; }
         break;
      }
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
  gekozenType !== 'TE-TE'
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
    if (
  somHeeftBrug(g1, g2, op) &&
  !(op === '-' && cfg.rekenBrug === 'zonder')
) {


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
/*
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
*/
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
// 🔒 LAATSTE FILTER — TE+TE tot 1000 met enkel honderdtalbrug
if (
  op === '+' &&
  gekozenType === 'TE+TE' &&
  cfg.rekenMaxGetal === 1000 &&
  cfg.rekenBrug === 'met' &&
  cfg.brugSoorten?.honderdtal &&
  !cfg.brugSoorten?.meervoudig
) {
  const e1 = g1 % 10;
  const e2 = g2 % 10;
  const t1 = Math.floor((g1 % 100) / 10);
  const t2 = Math.floor((g2 % 100) / 10);

  // ❌ meervoudige brug definitief weigeren
  if ((e1 + e2 >= 10) && (t1 + t2 >= 10)) {
    continue; // ⛔ opnieuw genereren
  }
}

// =====================================================
// 🔒 AFTREKKEN ZONDER BRUG — TE-TE (laatste vangnet)
// =====================================================
if (
  op === '-' &&
  cfg.rekenBrug === 'zonder' &&
  gekozenType === 'TE+TE'
) {
  const e1 = g1 % 10;
  const e2 = g2 % 10;

  // geen lenen toegestaan
  if (e1 < e2) {
    continue;
  }
}


  } while (
  !(
    op === '-' &&
    cfg.rekenBrug === 'zonder' &&
    gekozenType === 'TE+TE'
  ) &&
  !checkBrug(g1, g2, op, cfg.rekenBrug || 'beide')
);

  

// EXTRA FILTER: Compenseren (alleen wanneer hulpmiddel = compenseren)
// Belangrijk: dit mag NIET aftrekken blokkeren met optel-criteria.
if (
  cfg.rekenHulp &&
  cfg.rekenHulp.inschakelen &&
  cfg.rekenHulp.stijl === 'compenseren' &&
  (cfg.rekenBrug || 'beide') !== 'zonder'
) {
  const max = cfg.rekenMaxGetal || 100;

  const e1 = g1 % 10;
  const e2 = g2 % 10;

  // ---------------------------
  // OPTELLEN: compenseren mag als:
  // - tweede getal eindigt op 6/7/8/9 én eenhedenbrug,
  //   OF eerste getal eindigt op 6/7/8/9 én tweede getal “maakt het tiental vol”
  // ---------------------------
  if (op === '+') {
    const tweedeIsComp = [6, 7, 8, 9].includes(e2) && (e1 + e2 >= 10);
    const eersteIsComp = [6, 7, 8, 9].includes(e1) && (e2 >= (10 - e1));

    // ❗ exact één compensatiegetal toelaten
if ((tweedeIsComp && eersteIsComp) || (!tweedeIsComp && !eersteIsComp)) {
  return null;
}


    // grens bewaken
    if ((g1 + g2) > max) return null;
  }

  // ---------------------------
  // AFTREKKEN: compenseren mag als:
  // - er is brug (lenen): e1 < e2
  // - aftrekker (g2) eindigt op 6/7/8/9
  // - tot 100: tientallen van aftrekker ≤ tientallen van aftrektal
  // ---------------------------
  if (op === '-') {
    if (!(e1 < e2)) return null;                 // brug verplicht
    if (![6, 7, 8, 9].includes(e2)) return null; // aftrekker-eenheden 6–9

    if (max <= 100) {
      const t1 = Math.floor(g1 / 10);
      const t2 = Math.floor(g2 / 10);
      if (t2 > t1) return null;
    }

    // nooit negatief
    if (g1 <= g2) return null;
    // ❗ DIDACTISCHE AFBENING:
// aftrektal mag zelf GEEN compensatiegetal zijn
// anders is de oefening dubbelzinnig (bv. 98 − 9)
if ([6, 7, 8, 9].includes(e1)) return null;

// ❗ extra zekerheid: vermijd afronden naar 100 (98, 99)
if (max <= 100 && e1 >= 8) return null;

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
// FIX: Bij tot 1000 vertrouwen we op de eerdere logica, want somHeeftBrug
// herkent de 'tientalbrug bij TE+TE' (bv 82+45) niet correct als brug.
const isTot1000 = (cfg.rekenMaxGetal === 1000);

if (
  op === '+' &&
  cfg.rekenBrug === 'met' &&
  !isTot1000 && 
  !somHeeftBrug(g1, g2, '+')
) {
 return null;
}


return { type: 'rekenen', getal1: g1, getal2: g2, operator: op };

}

// Helper: compenseren geschikt maken voor TE én HT
// Nu ook geldig als g1 (het eerste getal) eindigt op 6, 7, 8 of 9
function genereerRekensomMetCompenseren(cfg) {
  let tries = 0;
  // Veel pogingen toestaan voor lastige combinaties
  while (tries++ < 2000) {
    const oef = genereerRekensom(cfg);
    if (!oef) continue;

    const g1 = oef.getal1;
    const g2 = oef.getal2;
    const e1 = Math.abs(g1) % 10;
    const e2 = Math.abs(g2) % 10;
    const t1 = Math.floor(Math.abs(g1)/10)%10;
    const t2 = Math.floor(Math.abs(g2)/10)%10;

    // Is G1 of G2 geschikt? (eindigt op 7,8,9 OF tiental is 7,8,9)
    const g1Ok = (e1 >= 7) || (e1 === 0 && t1 >= 7);
    const g2Ok = (e2 >= 7) || (e2 === 0 && t2 >= 7);

    if (g1Ok || g2Ok) {
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
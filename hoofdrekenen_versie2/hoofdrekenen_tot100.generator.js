function magWisselenBijSomtype(type) {
  return [
    'T+E',
    'TE+E',
    'TE+T',
    'TE+TE'
  ].includes(type);
}

// =====================================================
// OPTELLEN ZONDER BRUG — TOT 100
// =====================================================
export function genereerOptellenZonderBrugTot100(cfg) {
  const max = 100;
  const types = cfg.somTypes || ['E+E'];
  const allowZero = Math.random() < 0.10; // +0 zeldzaam

  let g1, g2;
  let safety = 0;

  while (safety++ < 100) {
    const gekozenType = types[Math.floor(Math.random() * types.length)];

    switch (gekozenType) {

      // -----------------------------
      // E + E
      // -----------------------------
      case 'E+E': {
        const min = allowZero ? 0 : 1;
        g1 = rnd(min, 9);
        g2 = rnd(min, 9);
        if (g1 + g2 >= 10) continue;
        break;
      }

      // -----------------------------
      // T + E  (↔ E + T)
      // -----------------------------
      case 'T+E': {
        g1 = rnd(1, 9) * 10;
        g2 = allowZero ? rnd(0, 9) : rnd(1, 9);
        if ((g2 >= 10) || g1 + g2 > max) continue;
        break;
      }

      // -----------------------------
      // TE + E  (↔ E + TE)
      // -----------------------------
      case 'TE+E': {
        g1 = rnd(11, 99);
        if (g1 % 10 === 0) continue;
        g2 = allowZero ? rnd(0, 9) : rnd(1, 9);
        if ((g1 % 10) + g2 >= 10) continue;
        if (g1 + g2 > max) continue;
        break;
      }

      // -----------------------------
      // T + T
      // -----------------------------
      case 'T+T': {
        g1 = rnd(1, 9) * 10;
        g2 = rnd(1, 9) * 10;
        if ((g1 / 10) + (g2 / 10) >= 10) continue;
        if (g1 + g2 > max) continue;
        break;
      }

      // -----------------------------
      // TE + T  (↔ T + TE)
      // -----------------------------
      case 'TE+T': {
        g1 = rnd(11, 99);
        if (g1 % 10 === 0) continue;
        g2 = rnd(1, 9) * 10;
        if ((g1 % 10) !== 0) {
          // eenheden + 0 → geen brug
        }
        if (g1 + g2 > max) continue;
        break;
      }

      // -----------------------------
      // TE + TE
      // -----------------------------
      case 'TE+TE': {
        g1 = rnd(11, 99);
        g2 = rnd(11, 99);
        if (g1 % 10 === 0 || g2 % 10 === 0) continue;
        if ((g1 % 10) + (g2 % 10) >= 10) continue;
        if (g1 + g2 > max) continue;
        break;
      }

      default:
        continue;
    }

  // 🔁 Gecontroleerde symmetrie bij zonder brug
if (
  magWisselenBijSomtype(gekozenType) &&
  Math.random() < 0.5
) {
  [g1, g2] = [g2, g1];
}


    return {
      type: 'rekenen',
      getal1: g1,
      getal2: g2,
      operator: '+'
    };
  }

  return null;
}


// =====================================================
// OPTELLEN MET BRUG — TOT 100
// =====================================================
export function genereerOptellenMetBrugTot100(cfg) {
  const max = 100;
  const types = cfg.somTypes || ['TE+E', 'TE+TE'];
  const compenserenActief =
    cfg.rekenHulp?.inschakelen === true &&
    cfg.rekenHulp?.stijl === 'compenseren';

  let g1, g2;
  let safety = 0;

  while (safety++ < 120) {
    const gekozenType = types[Math.floor(Math.random() * types.length)];

    switch (gekozenType) {

      // -----------------------------
      // TE + E  (met brug)
      // -----------------------------
      case 'TE+E': {
        g1 = rnd(11, 99);
        if (g1 % 10 === 0) continue;

        g2 = rnd(1, 9);

        // brug verplicht
        if ((g1 % 10) + g2 < 10) continue;

        if (g1 + g2 > max) continue;
        break;
      }

      // -----------------------------
      // TE + TE  (met brug)
      // -----------------------------
      case 'TE+TE': {
        g1 = rnd(11, 99);
        g2 = rnd(11, 99);

        if (g1 % 10 === 0 || g2 % 10 === 0) continue;

        // eenhedenbrug verplicht
        if ((g1 % 10) + (g2 % 10) < 10) continue;

        if (g1 + g2 > max) continue;
        break;
      }

      default:
        continue;
    }

    // ❌ geen aanvulsommen tot 10 / 100 (geen echte brugoefening)
if ((g1 + g2) % 10 === 0) continue;

    // =============================
    // EXTRA FILTER — COMPENSEREN
    // =============================
    if (compenserenActief) {
     const e1 = g1 % 10;
const e2 = g2 % 10;

const k1 = [6, 7, 8, 9].includes(e1);
const k2 = [6, 7, 8, 9].includes(e2);

// exact één compenseerbaar getal
if (k1 === k2) continue;

// andere term mag géén 6/7/8/9 hebben
if (k1 && [6, 7, 8, 9].includes(e2)) continue;
if (k2 && [6, 7, 8, 9].includes(e1)) continue;


    }

    return {
      type: 'rekenen',
      getal1: g1,
      getal2: g2,
      operator: '+'
    };
  }

  return null;
}

// hulpfunctie
function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


// =====================================================
// TIJDELIJKE WRAPPER — V2 COMPATIBILITEIT
// (nu: optellen zonder brug + optellen met brug)
// =====================================================
export function genereerTot100_V2(cfg) {
  const lijst = [];
  const aantal = cfg.aantalOefeningen || 6;

  for (let i = 0; i < aantal; i++) {

    let oef = null;

    if (cfg.rekenType === 'optellen') {
      if (cfg.rekenBrug === 'zonder') {
        oef = genereerOptellenZonderBrugTot100(cfg);
      }

      if (cfg.rekenBrug === 'met') {
        oef = genereerOptellenMetBrugTot100(cfg);
      }
    }

    if (oef) lijst.push(oef);
  }

  return lijst;
}

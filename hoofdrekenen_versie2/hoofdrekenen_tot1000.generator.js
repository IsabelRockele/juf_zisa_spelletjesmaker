console.log('🔥 NIEUWE TOT 1000 GENERATOR WORDT GEBRUIKT 🔥');

// =====================================================
// HOOFDREKENEN — TOT 1000 (V2)
// Optellen — zonder brug
// =====================================================

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// -----------------------------------------------------
// Hoofdingang
// -----------------------------------------------------
export function genereerTot1000_V2(cfg) {
  const lijst = [];
  const aantal = cfg.aantalOefeningen || 6;

  for (let i = 0; i < aantal; i++) {
    let oef = null;

    if (cfg.rekenType === 'optellen') {
      oef = genereerOptellenZonderBrugTot1000(cfg);
    }

    if (oef) lijst.push(oef);
  }

  return lijst;
}

// -----------------------------------------------------
// Optellen zonder brug — tot 1000
// -----------------------------------------------------
function genereerOptellenZonderBrugTot1000(cfg) {

const rawTypes = Array.isArray(cfg.somTypes) ? cfg.somTypes : [];

// normaliseren: "HTE + H" → "HTE+H"
const types = rawTypes
  .map(t => t.replace(/\s+/g, ''))
  .filter(t => t.length > 0);

if (!types.length) {
  console.error('❌ Geen geldige somtypes geselecteerd voor tot 1000');
  return null;
}

  if (!types.length) return null;

  // types waarbij links/rechts mag wisselen
 const symmetrisch = [
  'H+T',
  'T+TE',
  'H+TE',
  'HTE+H',
  'HTE+HT',
  'HT+HT'
];


  let safety = 0;

  while (safety++ < 200) {

    const type = types[rnd(0, types.length - 1)];
 

    let a, b;

    switch (type) {

      // -----------------------------
      // T + T
      // -----------------------------
      case 'T+T':
        a = rnd(1, 9) * 10;
        b = rnd(1, 9) * 10;
        if ((a % 100) + (b % 100) >= 100) continue;
        break;

      // -----------------------------
      // H + H
      // -----------------------------
      case 'H+H':
        a = rnd(1, 9) * 100;
        b = rnd(1, 9) * 100;
        if (a + b > 1000) continue;
        break;

      // -----------------------------
      // H + T
      // -----------------------------
      case 'H+T':
        a = rnd(1, 9) * 100;
        b = rnd(1, 9) * 10;
        break;

        // -----------------------------
// H + TE
// -----------------------------
case 'H+TE':
  a = rnd(1, 9) * 100;
  b = rnd(11, 99);
  if (a + b >= 1000) continue;
  break;

      // -----------------------------
      // T + TE
      // -----------------------------
      case 'T+TE':
        a = rnd(1, 9) * 10;
        b = rnd(11, 99);
        if ((a % 10) + (b % 10) >= 10) continue;
        break;

      // -----------------------------
      // HTE + H
      // -----------------------------
      case 'HTE+H':
        a = rnd(101, 999);
        b = rnd(1, 9) * 100;
        if ((a % 100) >= 100) continue;
        if (a + b > 1000) continue;
        break;

      // -----------------------------
      // HTE + HT
      // -----------------------------
      case 'HTE+HT':
        a = rnd(101, 999);
        b = rnd(1, 9) * 100 + rnd(1, 9) * 10;
        if ((a % 10) + (b % 10) >= 10) continue;
        if (((a % 100) + (b % 100)) >= 100) continue;
        if (a + b > 1000) continue;
        break;

// -----------------------------
// HT + HT
// -----------------------------
case 'HT+HT':
  a = rnd(1, 9) * 100 + rnd(1, 9) * 10;
  b = rnd(1, 9) * 100 + rnd(1, 9) * 10;
  if (a + b >= 1000) continue;
  break;

      // -----------------------------
      // HTE + HTE
      // -----------------------------
      case 'HTE+HTE':
        a = rnd(101, 999);
        b = rnd(101, 999);
        if ((a % 10) + (b % 10) >= 10) continue;
        if (((a % 100) + (b % 100)) >= 100) continue;
        if (a + b > 1000) continue;
        break;

      default:
        continue;
    }

    // -----------------------------
    // Symmetrisch wisselen indien toegestaan
    // -----------------------------
    if (symmetrisch.includes(type) && Math.random() < 0.5) {
      [a, b] = [b, a];
    }

    return {
      type: 'rekenen',
      getal1: a,
      getal2: b,
      operator: '+',
      somType: type
    };
  }

  return null;
}

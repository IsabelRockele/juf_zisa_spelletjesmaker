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
    // 🔒 Bij brug naar honderdtal: slechts één somtype tegelijk
if (
  cfg.rekenBrug === 'met' &&
  cfg.brugSoort === 'honderdtal' &&
  Array.isArray(cfg.somTypes) &&
  cfg.somTypes.length > 1
) {
  // geef voorrang aan HT+T bij brug naar honderdtal
if (cfg.somTypes.includes('HT+T')) {
  cfg.somTypes = ['HT+T'];
} else {
  cfg.somTypes = [cfg.somTypes[0]];
}

}

      // 🔁 normaliseer somTypes: "TE + TE" → "TE+TE"
  if (Array.isArray(cfg.somTypes)) {
    cfg.somTypes = cfg.somTypes.map(t => t.replace(/\s+/g, ''));
  }

  const lijst = [];
  const aantal = cfg.aantalOefeningen || 6;

  for (let i = 0; i < aantal; i++) {
    let oef = null;

   if (cfg.rekenType === 'optellen') {

  if (cfg.rekenBrug === 'zonder') {
    oef = genereerOptellenZonderBrugTot1000(cfg);
  }

if (
  cfg.rekenBrug === 'met' &&
  cfg.brugSoort === 'tiental' &&
  cfg.somTypes?.includes('TE+TE')
) {
  oef = genereerOptellenMetBrugTot1000(cfg);
}

if (
  cfg.rekenBrug === 'met' &&
  cfg.brugSoort === 'tiental' &&
  cfg.somTypes?.includes('HTE+HTE')
) {
  oef = genereerOptellenMetBrugHTE_HTETot1000(cfg);
}

if (
  cfg.rekenBrug === 'met' &&
  cfg.brugSoort === 'honderdtal' &&
  cfg.somTypes?.includes('T+T')
) {
  oef = genereerOptellenMetBrugHonderdtal_T_T(cfg);
}

if (
  cfg.rekenBrug === 'met' &&
  cfg.brugSoort === 'honderdtal' &&
  cfg.somTypes?.includes('TE+T')
) {
  oef = genereerOptellenMetBrugHonderdtal_TE_T(cfg);
}

if (
  cfg.rekenBrug === 'met' &&
  cfg.brugSoort === 'honderdtal' &&
  cfg.somTypes?.includes('HT+T')
) {
  oef = genereerOptellenMetBrugHonderdtal_HT_T(cfg);
}

if (
  cfg.rekenBrug === 'met' &&
  cfg.brugSoort === 'honderdtal' &&
  cfg.somTypes?.includes('TE+TE')
) {
  oef = genereerOptellenMetBrugHonderdtal_TE_TE(cfg);
}

if (
  cfg.rekenBrug === 'met' &&
  cfg.brugSoort === 'honderdtal' &&
  cfg.somTypes?.includes('HTE+HT')
) {
  oef = genereerOptellenMetBrugHonderdtal_HTE_HT(cfg);
}

if (
  cfg.rekenBrug === 'met' &&
  cfg.brugSoort === 'honderdtal' &&
  cfg.somTypes?.includes('HTE+HTE')
) {
  oef = genereerOptellenMetBrugHonderdtal_HTE_HTE(cfg);
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

  console.log(
  '🧪 TOT1000 ZONDER BRUG – ontvangen somTypes:',
  cfg.somTypes,
  '→ genormaliseerd:',
  types
);


if (!types.length) {
  console.error('❌ Geen geldige somtypes geselecteerd voor tot 1000');
  return null;
}

  if (!types.length) return null;

  // types waarbij links/rechts mag wisselen
 const symmetrisch = [
  'H+T',
  'T+TE',
  'TE+T',
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
// HT + T  (zonder brug)
// -----------------------------
case 'HT+T': {
  a = rnd(11, 99) * 10;          // 110..990
  if (a % 100 === 0) continue;  // geen zuiver honderdtal

  b = rnd(1, 9) * 10;           // 10..90

  // 🔒 geen brug naar honderdtal:
  // tientallen van a + tientallen van b < 10
  if (((a % 100) / 10) + (b / 10) >= 10) continue;

  if (a + b >= 1000) continue;

  break;
}

        // -----------------------------
// TE + TE (zonder brug)
// -----------------------------
case 'TE+TE':
  a = rnd(11, 99);
  b = rnd(11, 99);

  // beide moeten echte TE zijn (geen tientallen)
  if (a % 10 === 0 || b % 10 === 0) continue;

  // geen brug bij eenheden
  if ((a % 10) + (b % 10) >= 10) continue;

  // geen brug bij tientallen
  if (((Math.floor(a / 10) * 10) + (Math.floor(b / 10) * 10)) >= 100) continue;

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
// TE + T  (zonder brug)
// -----------------------------
case 'TE+T': {
  a = rnd(11, 99);
  if (a % 10 === 0) continue;   // echte TE

  b = rnd(1, 9) * 10;           // zuiver tiental

  // 🔒 geen brug nodig:
  // eenheden + 0 kan nooit over 10
  // tientallen / honderdtallen mogen wél veranderen

  break;
}


      // -----------------------------
      // HTE + H
      // -----------------------------
      case 'HTE+H':
  a = rnd(101, 999);
  if (a % 10 === 0) continue; // 🔒 echt HTE afdwingen
  b = rnd(1, 9) * 100;
  if (a + b >= 1000) continue;
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
  if (a % 10 === 0) continue; // 🔒 HTE
  b = rnd(101, 999);
  if (b % 10 === 0) continue; // 🔒 HTE
  if ((a % 10) + (b % 10) >= 10) continue;
  if (((a % 100) + (b % 100)) >= 100) continue;
  if (a + b >= 1000) continue;
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

// -----------------------------------------------------
// Optellen met brug — tot 1000
// Brug naar TIENTAL — TE + TE
// -----------------------------------------------------
function genereerOptellenMetBrugTot1000(cfg) {
  console.log('🟢 BINNEN: genereerOptellenMetBrugTot1000');

  let safety = 0;

  while (safety++ < 300) {
    let a = rnd(11, 99);
    let b = rnd(11, 99);

    if (a % 10 === 0 || b % 10 === 0) continue;
    if ((a % 10) + (b % 10) < 10) continue;

    const ta = Math.floor(a / 10) * 10;
    const tb = Math.floor(b / 10) * 10;
    if (ta + tb + 10 >= 100) continue;

    return {
      type: 'rekenen',
      getal1: a,
      getal2: b,
      operator: '+',
      somType: 'TE+TE',
      brugSoort: 'tiental'
    };
  }

  return null;
}

// -----------------------------------------------------
// Optellen met brug — tot 1000
// Brug naar TIENTAL — HTE + HTE
// -----------------------------------------------------
function genereerOptellenMetBrugHTE_HTETot1000(cfg) {

  let safety = 0;

  while (safety++ < 400) {

    let a = rnd(101, 999);
    let b = rnd(101, 999);

    if (a % 10 === 0 || b % 10 === 0) continue;

    const ea = a % 10;
    const eb = b % 10;
    if (ea + eb < 10) continue;

    const ta = Math.floor((a % 100) / 10);
    const tb = Math.floor((b % 100) / 10);
    if (ta + tb + 1 >= 10) continue;

    const ha = Math.floor(a / 100);
    const hb = Math.floor(b / 100);
    if (ha + hb >= 10) continue;

    if (a + b >= 1000) continue;

    return {
      type: 'rekenen',
      getal1: a,
      getal2: b,
      operator: '+',
      somType: 'HTE+HTE',
      brugSoort: 'tiental'
    };
  }

  return null;
}
}
// -----------------------------------------------------
// Optellen met brug — tot 1000
// Brug naar HONDERDTAL — T + T
// Regels:
// - beide getallen zijn zuivere tientallen (10..90)
// - som gaat OVER 100
// - som is GEEN exact honderdtal (dus niet 100)
// -----------------------------------------------------
function genereerOptellenMetBrugHonderdtal_T_T(cfg) {

  let safety = 0;

  while (safety++ < 200) {

    const a = rnd(1, 9) * 10; // 10..90
    const b = rnd(1, 9) * 10; // 10..90
    const s = a + b;

    // ✅ brug naar honderdtal: over 100
    if (s < 100) continue;

    // ❌ geen exact honderdtal als uitkomst
    if (s % 100 === 0) continue; // dus 100 is verboden

    return {
      type: 'rekenen',
      getal1: a,
      getal2: b,
      operator: '+',
      somType: 'T+T',
      brugSoort: 'honderdtal'
    };
  }

  return null;
}
// -----------------------------------------------------
// Optellen met brug — tot 1000
// Brug naar HONDERDTAL — TE + T
// Regels:
// - TE is tweecijferig, geen tiental (<100)
// - T is zuiver tiental (<100)
// - geen HT in invoer
// - GEEN brug bij eenheden
// - WEL brug bij tientallen
// - tientallen samen > 10 (dus niet exact 10)
// - uitkomst > 100
// - uitkomst is GEEN exact honderdtal
// -----------------------------------------------------
function genereerOptellenMetBrugHonderdtal_TE_T(cfg) {

  let safety = 0;

  while (safety++ < 300) {

    const te = rnd(11, 99);
    if (te % 10 === 0) continue; // geen tiental

    const t = rnd(1, 9) * 10; // 10..90

    const e = te % 10;
    const t_te = Math.floor(te / 10);
    const t_t = t / 10;

    // ❌ geen brug bij eenheden
    if (e >= 10) continue; // veiligheid, normaal altijd ok

    // ✔ brug bij tientallen — maar ECHT over 10
    if (t_te + t_t <= 10) continue;

    const som = te + t;

    // ❌ moet over 100
   if (som < 100) continue;

    // ❌ geen exact honderdtal
    if (som % 100 === 0) continue;

    return {
      type: 'rekenen',
      getal1: te,
      getal2: t,
      operator: '+',
      somType: 'TE+T',
      brugSoort: 'honderdtal'
    };
  }

  return null;
}

// -----------------------------------------------------
// Optellen met brug — tot 1000
// Brug naar HONDERDTAL — HT + T
// -----------------------------------------------------
function genereerOptellenMetBrugHonderdtal_HT_T(cfg) {

  let safety = 0;

  while (safety++ < 300) {

    const ht = rnd(11, 99) * 10;   // 110..990
    if (ht % 100 === 0) continue; // geen zuiver honderdtal

    const t = rnd(1, 9) * 10;     // 10..90

    const tientallenHT = (ht % 100) / 10;
    const tientallenT  = t / 10;

    // ❗ echte brug naar honderdtal:
    // tientallen samen MOETEN > 10 zijn
    if (tientallenHT + tientallenT <= 10) continue;

    const som = ht + t;

    if (som >= 1000) continue;
    if (som % 100 === 0) continue; // geen exact honderdtal

    return {
      type: 'rekenen',
      getal1: ht,
      getal2: t,
      operator: '+',
      somType: 'HT+T',
      brugSoort: 'honderdtal'
    };
  }

  return null;
}

// -----------------------------------------------------
// Optellen met brug — tot 1000
// Brug naar HONDERDTAL — TE + TE
// -----------------------------------------------------
function genereerOptellenMetBrugHonderdtal_TE_TE(cfg) {

  let safety = 0;

  while (safety++ < 300) {

    // 1️⃣ tientallen afdwingen (brug naar honderdtal)
    const t1 = rnd(1, 9);
    const t2 = rnd(1, 9);
    if (t1 + t2 <= 10) continue;

    // 2️⃣ eenheden veilig kiezen (GEEN brug naar tiental)
    const e1 = rnd(1, 8);
    const e2 = rnd(1, 9 - e1); // zorgt: e1 + e2 < 10

    const a = t1 * 10 + e1;
    const b = t2 * 10 + e2;

    const som = a + b;

    if (som <= 100) continue;
    if (som % 100 === 0) continue;

    return {
      type: 'rekenen',
      getal1: a,
      getal2: b,
      operator: '+',
      somType: 'TE+TE',
      brugSoort: 'honderdtal'
    };
  }

  return null;
}


// -----------------------------------------------------
// Optellen met brug — tot 1000
// Brug naar HONDERDTAL — HTE + HT
// -----------------------------------------------------
function genereerOptellenMetBrugHonderdtal_HTE_HT(cfg) {

  let safety = 0;

  while (safety++ < 400) {

    const hte = rnd(101, 999);
    if (hte % 10 === 0) continue;

    const ht = rnd(1, 9) * 100 + rnd(1, 9) * 10;

    const tientallenHTE = Math.floor((hte % 100) / 10);
    const tientallenHT  = (ht % 100) / 10;

    if (tientallenHTE + tientallenHT <= 10) continue;

    const som = hte + ht;

    if (som >= 1000) continue;
    if (som % 100 === 0) continue;

    return {
      type: 'rekenen',
      getal1: hte,
      getal2: ht,
      operator: '+',
      somType: 'HTE+HT',
      brugSoort: 'honderdtal'
    };
  }

  return null;
}

// -----------------------------------------------------
// Optellen met brug — tot 1000
// Brug naar HONDERDTAL — HTE + HTE
// -----------------------------------------------------
function genereerOptellenMetBrugHonderdtal_HTE_HTE(cfg) {

  let safety = 0;

  while (safety++ < 400) {

    // 1️⃣ tientallen afdwingen
    const t1 = rnd(1, 9);
    const t2 = rnd(1, 9);
    if (t1 + t2 <= 10) continue;

    // 2️⃣ eenheden veilig (geen brug naar tiental)
    const e1 = rnd(1, 8);
    const e2 = rnd(1, 9 - e1);

    // 3️⃣ honderdtallen vrij kiezen
    const h1 = rnd(1, 9);
    const h2 = rnd(1, 9);

    const a = h1 * 100 + t1 * 10 + e1;
    const b = h2 * 100 + t2 * 10 + e2;

    const som = a + b;

    if (som >= 1000) continue;
    if (som % 100 === 0) continue;

    return {
      type: 'rekenen',
      getal1: a,
      getal2: b,
      operator: '+',
      somType: 'HTE+HTE',
      brugSoort: 'honderdtal'
    };
  }

  return null;
}


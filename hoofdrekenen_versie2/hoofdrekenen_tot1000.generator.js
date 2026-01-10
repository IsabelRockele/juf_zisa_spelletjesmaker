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

  // ========================================
// FIX: 'beide toegestaan' intern splitsen
// ========================================
if (cfg.rekenBrug === 'beide') {
  cfg = {
    ...cfg,
    rekenBrug: Math.random() < 0.5 ? 'zonder' : 'met'
  };
}

    // 🔒 Bij brug naar honderdtal: slechts één somtype tegelijk
if (
  cfg.rekenBrug === 'met' &&
  cfg.brugSoort === 'honderdtal' &&
  cfg.rekenHulp?.stijl !== 'compenseren' &&   // 👈 cruciaal
  Array.isArray(cfg.somTypes) &&
  cfg.somTypes.length > 1
) {
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

  // ================================
// COMPENSEREN — TE+TE — tot 1000
// ================================
if (
  cfg.rekenBrug === 'met' &&
   cfg.brugSoort === 'honderdtal' &&
  cfg.rekenHulp?.stijl === 'compenseren' &&
  cfg.somTypes?.includes('TE+TE')
) {
  const oef = genereerOptellenCompenseren_TE_TE_Tot1000(cfg);
  if (oef) lijst.push(oef);
  continue;   // ⬅️ DIT IS DE SLEUTEL
}

// =====================================================
// COMPENSEREN — HTE+HTE — tot 1000
// Werkboek: afronden naar honderdtal
// =====================================================
if (
  cfg.rekenBrug === 'met' &&
  (cfg.brugSoort === 'tiental' || cfg.brugSoort === 'honderdtal' || cfg.brugSoort === 'meervoudig') &&
  cfg.rekenHulp?.stijl === 'compenseren' &&
  cfg.somTypes?.includes('HTE+HTE')
) {
  const oef = genereerOptellenCompenseren_HTE_HTE_Tot1000({
  ...cfg,
  _isVoorbeeld: i === 0   // 👈 DIT is de sleutel
});

  if (oef) lijst.push(oef);
  continue;
}


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
  cfg.rekenHulp?.stijl === 'compenseren' &&
  cfg.somTypes?.includes('HT+TE')
) {
  oef = genereerOptellenCompenseren_HT_TE_Tot1000(cfg);
}

if (
  cfg.rekenBrug === 'met' &&
  cfg.brugSoort === 'honderdtal' &&
  cfg.somTypes?.includes('HT+TE')
) {
  oef = genereerOptellenMetBrugHonderdtal_HT_TE(cfg);
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

if (oef) {
  lijst.push(oef);
}

  }

// ================================
// AFTREKKEN — TOT 1000
// ================================
if (cfg.rekenType === 'aftrekken') {

  // =====================================================
// TYPE-GARANTIE — AFTREKKEN HTE − HTE MET COMPENSEREN
// =====================================================
if (
  cfg.rekenMaxGetal === 1000 &&
  cfg.rekenHulp?.stijl === 'compenseren' &&
  cfg.somTypes?.includes('HTE-HTE')
) {
  const oef = genereerAftrekkenCompenseren_HTE_HTE_Tot1000(cfg);
  if (oef) lijst.push(oef);
  continue; // 🔒 niets anders mag nog door
}

  
// =====================================================
// DEFINITIEVE TYPE-GARANTIE — AFTREKKEN HTE − HTE
// =====================================================
if (
  cfg.rekenType === 'aftrekken' &&
  cfg.rekenMaxGetal === 1000 &&
  cfg.somTypes?.includes('HTE-HTE')
) {
  const oef = genereerAftrekkenMetBrugHTE_HTE_Tot1000(cfg);
  if (oef) lijst.push(oef);
  continue; // 🔒 voorkomt ELKE andere aftrekvorm
}


  // =====================================================
// AFTREKKEN — HTE − HTE — met brug (intern gemengd)
// =====================================================
if (
  cfg.rekenBrug === 'met' &&
  cfg.rekenMaxGetal === 1000 &&
  cfg.somTypes?.includes('HTE-HTE')
) {
  const oef = genereerAftrekkenMetBrugHTE_HTE_Tot1000(cfg);
  if (oef) lijst.push(oef);
  continue; // 🔒 voorkomt doorvallen naar andere aftrektypes
}


  // 1️⃣ eerst ZONDER brug
  if (cfg.rekenBrug === 'zonder') {
    oef = genereerAftrekkenZonderBrugTot1000(cfg);
  }

  // 2️⃣ AANVULLEN (EXCLUSIEF, nieuw)
  else if (
    cfg.rekenBrug === 'met' &&
    cfg.rekenHulp?.stijl === 'aanvullen'
  ) {
    oef = genereerAftrekkenAanvullenTot1000(cfg);
  }

  // 3️⃣ COMPENSEREN (EXCLUSIEF)
  else if (
    cfg.rekenBrug === 'met' &&
    cfg.rekenHulp?.stijl === 'compenseren'
  ) {
    oef = genereerAftrekkenCompenserenTot1000(cfg);
  }

  // 4️⃣ PAS DAARNA gewone MET BRUG
  else if (cfg.rekenBrug === 'met') {
    oef = genereerAftrekkenMetBrugTot1000(cfg);
  }

  if (oef) lijst.push(oef);
}


}   // ← EINDE for-lus

return lijst;

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

// -----------------------------------------------------
// Optellen zonder brug — tot 1000
// HT + TE
// Regels:
// - HT: 110..990, geen zuiver honderdtal
// - TE: 11..99, geen tiental
// - GEEN brug bij eenheden (0 + E < 10)
// - GEEN brug bij tientallen
// - som < 1000
// -----------------------------------------------------
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
// HT + TE  (zonder brug)
// -----------------------------
case 'HT+TE':
  a = rnd(1, 9) * 100 + rnd(1, 9) * 10; // HT
  b = rnd(11, 99);                      // TE

  // echte TE afdwingen
  if (b % 10 === 0) continue;

  // geen brug bij tientallen
  if (((a % 100) + (b % 100)) >= 100) continue;

  // grens
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
// Brug naar HONDERDTAL — HT + TE
// Regels:
// - HT is 110..990, geen zuiver honderdtal
// - TE is 11..99, geen tiental
// - GEEN brug bij eenheden (0 + E < 10)
// - WEL brug bij tientallen
// - uitkomst < 1000
// - uitkomst is GEEN exact honderdtal
// -----------------------------------------------------
function genereerOptellenMetBrugHonderdtal_HT_TE(cfg) {

  let safety = 0;

  while (safety++ < 300) {

    // HT: honderdtal + tiental
    const ht = rnd(11, 99) * 10;       // 110..990
    if (ht % 100 === 0) continue;      // geen zuiver honderdtal

    // TE: twee cijfers, geen tiental
    const te = rnd(11, 99);
    if (te % 10 === 0) continue;

    // ❌ geen brug bij eenheden
    if (te % 10 !== 0) {
      // eenheden: 0 + E → altijd ok
    }

    // ✔ brug bij tientallen:
    const tientallenHT = (ht % 100) / 10;
    const tientallenTE = Math.floor(te / 10);

    if (tientallenHT + tientallenTE <= 9) continue;

    const som = ht + te;

    // ❌ te groot
    if (som >= 1000) continue;

    // ❌ geen exact honderdtal als resultaat
    if (som % 100 === 0) continue;

    return {
      type: 'rekenen',
      getal1: ht,
      getal2: te,
      operator: '+',
      somType: 'HT+TE',
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
 console.log('CHECK:', {
  rekenBrug: cfg.rekenBrug,
  brugSoort: cfg.brugSoort,
  meervoudigeBrug: cfg.meervoudigeBrug
});


  let safety = 0;

  while (safety++ < 300) {

    // 1️⃣ tientallen afdwingen (brug naar honderdtal)
    const t1 = rnd(1, 9);
    const t2 = rnd(1, 9);
    if (t1 + t2 <= 10) continue;

   let e1, e2;

if (cfg.meervoudigeBrug) {
  // 👉 meervoudige brug: WEL brug naar tiental
  e1 = rnd(1, 9);
  e2 = rnd(1, 9);
  if (e1 + e2 < 10) continue;
} else {
  // 👉 gewone brug: GEEN brug naar tiental
  e1 = rnd(1, 8);
  e2 = rnd(1, 9 - e1); // e1 + e2 < 10
}


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

    // 2️⃣ eenheden kiezen (afhankelijk van meervoudige brug)
let e1, e2;

if (cfg.meervoudigeBrug) {
  // 👉 meervoudige brug: WEL brug naar tiental
  e1 = rnd(0, 9);
  e2 = rnd(0, 9);
  if (e1 + e2 < 10) continue;
} else {
  // 👉 gewone brug: GEEN brug naar tiental
  e1 = rnd(1, 8);
  e2 = rnd(1, 9 - e1); // e1 + e2 < 10
}


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

function genereerOptellenCompenseren_TE_TE_Tot1000(cfg) {

  let safety = 0;

  while (safety++ < 300) {

    // 1️⃣ tientallen kiezen → brug naar honderdtal
    const t1 = rnd(1, 9);
    const t2 = rnd(1, 9);
    if (t1 + t2 <= 10) continue;

    // 2️⃣ eenheden kiezen → EXACT één compenseerbaar (7–8–9)
    const e1 = rnd(1, 9);
    const e2 = rnd(1, 9);

    const comp1 = [7, 8, 9].includes(e1);
    const comp2 = [7, 8, 9].includes(e2);
    if (comp1 === comp2) continue;

    // 3️⃣ bij compenseren: WEL brug naar tiental
    if (e1 + e2 <= 10) continue;

    // 4️⃣ getallen opbouwen
    const a = t1 * 10 + e1;
    const b = t2 * 10 + e2;

    const som = a + b;

    // 5️⃣ veiligheidschecks
    if (som <= 100) continue;
    if (som % 100 === 0) continue;

    return {
      type: 'rekenen',
      getal1: a,
      getal2: b,
      operator: '+',
      somType: 'TE+TE',
      brugSoort: 'honderdtal',
      stijl: 'compenseren'
    };
  }

  return null;
}

// =====================================================
// COMPENSEREN — HTE + HTE — tot 1000
// Werkboekmodel: afronden naar honderdtal
// Voorbeelden: 297 + 165, 682 + 196
// =====================================================
function genereerOptellenCompenseren_HTE_HTE_Tot1000(cfg) {

  let safety = 0;

  while (safety++ < 400) {

    // 🔹 Kies compenseerterm: tiental = 9, eenheden 6–9
    const h1 = rnd(1, 9);
    const t1 = 9;
    // compenseergetal: 6–9 EVENWICHTIG
const e1 = [6, 7, 8, 9][rnd(0, 3)];


    const comp = h1 * 100 + t1 * 10 + e1;

    // 🔹 Andere term: GEEN tiental 9
    const h2 = rnd(1, 9);
    const t2 = rnd(0, 8);          // expliciet geen 9
    // kies e2 zó dat er zeker brug is, maar niet aantrekkelijk om te compenseren
// e2 bewust kiezen zodat er ALTIJD brug is
let e2;
if (e1 === 6) e2 = 4;
else if (e1 === 7) e2 = rnd(3, 4);
else if (e1 === 8) e2 = rnd(2, 4);
else e2 = rnd(1, 4); // e1 === 9


    const other = h2 * 100 + t2 * 10 + e2;

    // 🔒 Grenzen
    if (comp + other >= 1000) continue;

    // 🔒 Meervoudige brug afdwingen
    const eenhedenBrug = (e1 + e2) >= 10;
   if (!eenhedenBrug) continue;


    // 🔁 Afwisselend links / rechts
    const wissel = Math.random() < 0.5;

   return {
  type: 'rekenen',
  getal1: comp,     // ✅ compenseergetal altijd eerst (wordt omcirkeld)
  getal2: other,
  operator: '+',
  somType: 'HTE+HTE',
  brugSoort: 'honderdtal',
  meervoudigeBrug: true
};
  }

  return null;
}


// -----------------------------------------------------
// Optellen met brug + compenseren — tot 1000
// HT + TE  (TE is compenseergetal)
// Voorbeeld: 870 + 67 → +70 − 3
// -----------------------------------------------------
function genereerOptellenCompenseren_HT_TE_Tot1000(cfg) {

  let safety = 0;

  while (safety++ < 300) {

    // HT: honderdtal + tiental
    const ht = rnd(1, 9) * 100 + rnd(1, 9) * 10;

    // TE: compenseerbaar getal
    const e = rnd(6, 9);           // 👈 verplicht compenseerbaar
    const t = rnd(1, 9);
    const te = t * 10 + e;

    // brug naar honderdtal afdwingen
    const tientallenHT = (ht % 100) / 10;
    if (tientallenHT + t < 10) continue;

    const som = ht + te;

    // grenzen
    if (som >= 1000) continue;
    if (som % 100 === 0) continue;

    return {
      type: 'rekenen',
      operator: '+',
      getal1: ht,
      getal2: te,
      somType: 'HT+TE',
      brugSoort: 'honderdtal',
      stijl: 'compenseren',
      compenseerGetal: te
    };
  }

  return null;
}

// =====================================================
// AFTREKKEN ZONDER BRUG — TOT 1000
// Types: T-T, H-H, HT-T
// =====================================================
function genereerAftrekkenZonderBrugTot1000(cfg) {

  const types = Array.isArray(cfg.somTypes)
    ? cfg.somTypes.map(t => t.replace(/\s+/g, ''))
    : [];

  // alleen de types die we ondersteunen
  const toegelaten = types.filter(
    t => t === 'T-T' || t === 'H-H' || t === 'HT-T' || t === 'HT-HT' || t === 'HTE-HT' || t === 'HTE-H' || t === 'HTE-HTE'
  );
  if (toegelaten.length === 0) return null;

  let safety = 0;

  while (safety++ < 300) {

    // kies willekeurig één van de toegelaten types
    const gekozen = toegelaten[rnd(0, toegelaten.length - 1)];

    // -------------------------
    // T - T
    // -------------------------
    if (gekozen === 'T-T') {
      const a = rnd(1, 9) * 10;
      const b = rnd(1, 9) * 10;
      if (b >= a) continue;

      return {
        type: 'rekenen',
        getal1: a,
        getal2: b,
        operator: '-',
        somType: 'T-T'
      };
    }

    // -------------------------
    // H - H
    // -------------------------
    if (gekozen === 'H-H') {
      const a = rnd(1, 9) * 100;
      const b = rnd(1, 9) * 100;
      if (b >= a) continue;

      return {
        type: 'rekenen',
        getal1: a,
        getal2: b,
        operator: '-',
        somType: 'H-H'
      };
    }

    // -------------------------
    // HT - T
    // -------------------------
    if (gekozen === 'HT-T') {
      const a = rnd(11, 99) * 10;   // 110..990
      if (a % 100 === 0) continue;

      const b = rnd(1, 9) * 10;    // 10..90
      if (b >= a) continue;

      return {
        type: 'rekenen',
        getal1: a,
        getal2: b,
        operator: '-',
        somType: 'HT-T'
      };
    }

    // -------------------------
// HT - HT
// -------------------------
if (gekozen === 'HT-HT') {

  const a = rnd(11, 99) * 10;     // 110..990
  if (a % 100 === 0) continue;

  const b = rnd(11, 99) * 10;     // 110..990
  if (b % 100 === 0) continue;

  if (b >= a) continue;

  const ta = (a % 100) / 10;
  const tb = (b % 100) / 10;
  if (tb > ta) continue;

  return {
    type: 'rekenen',
    getal1: a,
    getal2: b,
    operator: '-',
    somType: 'HT-HT'
  };
}


// -------------------------
// HTE - HT
// -------------------------
if (gekozen === 'HTE-HT') {

  // aftrektal: HTE (101..999), geen zuiver tiental
  const a = rnd(101, 999);
  if (a % 10 === 0) continue;   // geen ...0

  // aftrekker: HT (110..990), geen zuiver honderdtal
  const b = rnd(11, 99) * 10;
  if (b % 100 === 0) continue;

  // geen negatieve uitkomst
  if (b >= a) continue;

  // geen lenen bij tientallen
  const ta = Math.floor((a % 100) / 10);
  const tb = (b % 100) / 10;
  if (tb > ta) continue;

  return {
    type: 'rekenen',
    getal1: a,
    getal2: b,
    operator: '-',
    somType: 'HTE-HT'
  };
}

// -------------------------
// HTE - H
// -------------------------
if (gekozen === 'HTE-H') {

  // aftrektal: HTE (101..999), geen zuiver tiental
  const a = rnd(101, 999);
  if (a % 10 === 0) continue;

  // aftrekker: H (100..900)
  const b = rnd(1, 9) * 100;

  // geen negatieve uitkomst
  if (b >= a) continue;

  return {
    type: 'rekenen',
    getal1: a,
    getal2: b,
    operator: '-',
    somType: 'HTE-H'
  };
}

// -------------------------
// HTE - HTE
// -------------------------
if (gekozen === 'HTE-HTE') {

  // aftrektal: HTE
  const a = rnd(101, 999);
  if (a % 10 === 0) continue;

  // aftrekker: HTE
  const b = rnd(101, 999);
  if (b % 10 === 0) continue;

  // geen negatieve uitkomst
  if (b >= a) continue;

  // geen lenen bij eenheden
  const ea = a % 10;
  const eb = b % 10;
  if (eb > ea) continue;

  // geen lenen bij tientallen
  const ta = Math.floor((a % 100) / 10);
  const tb = Math.floor((b % 100) / 10);
  if (tb > ta) continue;

  return {
    type: 'rekenen',
    getal1: a,
    getal2: b,
    operator: '-',
    somType: 'HTE-HTE'
  };
}


  }
  return null;
}

// =====================================================
// AFTREKKEN MET BRUG — TOT 1000
// =====================================================
function genereerAftrekkenMetBrugTot1000(cfg) {
  const types = Array.isArray(cfg.somTypes)
    ? cfg.somTypes.map(t => t.replace(/\s+/g, ''))
    : [];

  // we starten met H-T
 const toegelaten = types.filter(
  t =>
    t === 'H-T'  ||
    t === 'HT-T' ||
    t === 'HT-HT'||
    t === 'HT-TE'   // 👈 DEZE REGEL TOEVOEGEN
);


  if (toegelaten.length === 0) return null;

  let safety = 0;

  while (safety++ < 300) {
    const gekozen = toegelaten[rnd(0, toegelaten.length - 1)];

    // -------------------------
    // H - T  (MET BRUG)
    // -------------------------
    if (gekozen === 'H-T') {

      const a = rnd(1, 9) * 100;   // 100..900
      const b = rnd(1, 9) * 10;    // 10..90

      // H-T met brug: altijd lenen (a % 100 === 0 en b > 0)
      if (b >= a) continue;

      return {
        type: 'rekenen',
        getal1: a,
        getal2: b,
        operator: '-',
        somType: 'H-T'
      };
    }

    // -------------------------
// HT - T  (MET BRUG)
// -------------------------
if (gekozen === 'HT-T') {

  // aftrektal: HT (110..990), geen zuiver honderdtal
  const a = rnd(11, 99) * 10;
  if (a % 100 === 0) continue;

  // aftrekker: T (10..90)
  const b = rnd(1, 9) * 10;

  // positief resultaat
  if (b >= a) continue;

  // MET BRUG: tientallen van b > tientallen van a
  const ta = (a % 100) / 10;
  const tb = b / 10;
  if (tb <= ta) continue;

  return {
    type: 'rekenen',
    getal1: a,
    getal2: b,
    operator: '-',
    somType: 'HT-T'
  };
}

// -------------------------
// HT - TE  (MET BRUG)
// Voorwaarde:
// tiental aftrekker < tiental aftrektal
// -------------------------
if (gekozen === 'HT-TE') {

  // aftrektal: HT (110..990), geen zuiver honderdtal
  const a = rnd(11, 99) * 10;
  if (a % 100 === 0) continue;

  // aftrekker: TE (11..99), geen tiental
  const t2 = rnd(1, 8);   // tiental aftrekker
  const e2 = rnd(1, 9);
  const b = t2 * 10 + e2;

  if (b % 10 === 0) continue;

  // 🔒 brug afdwingen:
  // tiental van aftrekker < tiental van aftrektal
  const ta = (a % 100) / 10;
  if (t2 >= ta) continue;

  // geen negatieve uitkomst
  if (b >= a) continue;

  return {
    type: 'rekenen',
    getal1: a,
    getal2: b,
    operator: '-',
    somType: 'HT-TE'
  };
}

// -------------------------
// HT - HT  (MET BRUG)
// -------------------------
if (gekozen === 'HT-HT') {

  // aftrektal: HT (110..990), geen zuiver honderdtal
  const a = rnd(11, 99) * 10;
  if (a % 100 === 0) continue;

  // aftrekker: HT (110..990), geen zuiver honderdtal
  const b = rnd(11, 99) * 10;
  if (b % 100 === 0) continue;

  // uitkomst positief
  if (b >= a) continue;

  // MET BRUG: tientallen van b > tientallen van a
  const ta = (a % 100) / 10;
  const tb = (b % 100) / 10;
  if (tb <= ta) continue;

  return {
    type: 'rekenen',
    getal1: a,
    getal2: b,
    operator: '-',
    somType: 'HT-HT'
  };
}

  }

  return null;
}

// -----------------------------------------------------
// Aftrekken met brug — tot 1000
// HTE − HTE (mix van brugtypes)
// -----------------------------------------------------
function genereerAftrekkenMetBrugHTE_HTE_Tot1000(cfg) {

  let safety = 0;

  while (safety++ < 400) {

    // 🔀 Kies intern het brugtype
    const type = rnd(1, 3);

    if (type === 1 || cfg._brugSubtype === 'tiental') {

  // 1️⃣ Eenheden: brug nodig
  const e1 = rnd(0, 8);
  const e2 = rnd(e1 + 1, 9);

  // 2️⃣ Tientallen: GEEN brug naar honderdtal
  // na lenen moet T1 - 1 ≥ T2
  const t2 = rnd(0, 8);
  const t1 = rnd(t2 + 1, 9);

  // 3️⃣ Honderdtallen: stabiel
  const h2 = rnd(0, 8);
  const h1 = rnd(h2, 9);

  const a = h1 * 100 + t1 * 10 + e1;
  const b = h2 * 100 + t2 * 10 + e2;

  // 🔒 Veiligheden
  if (a <= b) continue;        // geen negatief
  if (a % 100 === 0) continue; // geen zuiver honderdtal

  return {
    type: 'rekenen',
    getal1: a,
    getal2: b,
    operator: '-',
    somType: 'HTE-HTE',
    brugSoort: 'tiental'
  };
}


    if (type === 2 || cfg._brugSubtype === 'honderdtal') {

  // 1️⃣ Eenheden: GEEN brug
  const e2 = rnd(0, 9);
  const e1 = rnd(e2, 9);

  // 2️⃣ Tientallen: WEL brug naar honderdtal
  // T1 < T2
  const t1 = rnd(0, 8);
  const t2 = rnd(t1 + 1, 9);

  // 3️⃣ Honderdtallen: voldoende groot om te lenen
  const h2 = rnd(0, 8);
  const h1 = rnd(h2 + 1, 9);

  const a = h1 * 100 + t1 * 10 + e1;
  const b = h2 * 100 + t2 * 10 + e2;

  // 🔒 Veiligheden
  if (a <= b) continue;        // geen negatief
  if (a % 100 === 0) continue; // geen zuiver honderdtal

  return {
    type: 'rekenen',
    getal1: a,
    getal2: b,
    operator: '-',
    somType: 'HTE-HTE',
    brugSoort: 'honderdtal'
  };
}

   if (type === 3 || cfg._brugSubtype === 'meervoudig') {

  // 1️⃣ Eenheden: brug nodig
  const e1 = rnd(0, 8);
  const e2 = rnd(e1 + 1, 9);

  // 2️⃣ Tientallen: door lenen ook brug nodig
  // T1 - 1 < T2  → dus T1 ≤ T2
  const t2 = rnd(1, 9);
  const t1 = rnd(0, t2);

  // 3️⃣ Honderdtallen: voldoende groot
  const h2 = rnd(0, 8);
  const h1 = rnd(h2 + 1, 9);

  const a = h1 * 100 + t1 * 10 + e1;
  const b = h2 * 100 + t2 * 10 + e2;

  // 🔒 Veiligheden
  if (a <= b) continue;
  if (a % 100 === 0) continue;

  return {
    type: 'rekenen',
    getal1: a,
    getal2: b,
    operator: '-',
    somType: 'HTE-HTE',
    brugSoort: 'meervoudig'
  };
}

  }

  return null;
}

// =====================================================
// AFTREKKEN MET BRUG — COMPENSEREN — TOT 1000
// Types: HT-T, HT-HT
// =====================================================
function genereerAftrekkenCompenserenTot1000(cfg) {

  const types = Array.isArray(cfg.somTypes)
    ? cfg.somTypes.map(t => t.replace(/\s+/g, ''))
    : [];

 const toegelaten = types.filter(
  t =>
    t === 'HT-HT' ||
    t === 'HTE-HT' ||
    t === 'HT-TE'   // 👈 DEZE TOEVOEGEN
);


  if (toegelaten.length === 0) return null;

  let safety = 0;

  while (safety++ < 300) {

    const gekozen = toegelaten[rnd(0, toegelaten.length - 1)];

    // =========================
    // HT - T  (COMPENSEREN)
    // =========================
    if (gekozen === 'HT-T') {

      const a = rnd(11, 69) * 10;   // tientallen 1..6 (GEEN 7,8,9)
      if (a % 100 === 0) continue;

      const t = rnd(7, 9);          // compenseertiental
      const b = t * 10;             // 70, 80, 90

      if (b >= a) continue;

      return {
        type: 'rekenen',
        getal1: a,
        getal2: b,
        operator: '-',
        somType: 'HT-T',
        strategie: 'compenseren'
      };
    }

    // -------------------------
// HT - TE  (MET BRUG + COMPENSEREN)
// Voorbeelden:
// 420 - 98  → -100 + 2
// 420 - 38  → -40 + 2
// -------------------------
if (gekozen === 'HT-TE') {

  // aftrektal: HT
  const a = rnd(11, 99) * 10;   // 110..990
  if (a % 100 === 0) continue;  // geen zuiver honderdtal

  // aftrekker: TE, compenseerbaar
  const e = rnd(6, 9);          // 👈 verplicht compenseerbaar
  const t = rnd(1, 9);
  const b = t * 10 + e;

  // resultaat moet positief blijven
  if (b >= a) continue;

  return {
    type: 'rekenen',
    getal1: a,
    getal2: b,
    operator: '-',
    somType: 'HT-TE',
    stijl: 'compenseren'
  };
}

    // =========================
    // HT - HT  (COMPENSEREN)
    // =========================
    if (gekozen === 'HT-HT') {

      const a = rnd(11, 69) * 10;   // tientallen 1..6
      if (a % 100 === 0) continue;

      const bT = rnd(7, 9);
      const bH = rnd(1, 9);
      const b = bH * 100 + bT * 10;

      if (b >= a) continue;

      return {
        type: 'rekenen',
        getal1: a,
        getal2: b,
        operator: '-',
        somType: 'HT-HT',
        strategie: 'compenseren'
      };
    }

    // =========================
// HTE - HT  (COMPENSEREN)
// =========================
if (gekozen === 'HTE-HT') {

  // g2 (aftrekker) = HT met tiental 6/7/8/9, geen zuiver honderdtal
  const bH = rnd(1, 9);
  const bT = rnd(6, 9);
  const b  = bH * 100 + bT * 10; // ...60/70/80/90

  // g1 (aftrektal) = HTE, maar tiental NIET 6..9 (om geen twijfel te hebben)
  const aH = rnd(bH, 9);         // zodat a meestal groter is
  const aT = rnd(0, 5);          // tiental 0..5
  const aE = rnd(1, 9);          // eenheden 1..9 (HTE)
  const a  = aH * 100 + aT * 10 + aE;

  // g1 moet groter zijn dan g2
  if (a <= b) continue;

  // brugoefening naar honderdtal: laatste 2 cijfers van a < laatste 2 cijfers van b
  // (b eindigt op 0, maar b%100 is bv 80/90)
  if ((a % 100) >= (b % 100)) continue;

  return {
    type: 'rekenen',
    getal1: a,
    getal2: b,
    operator: '-',
    somType: 'HTE-HT',
    strategie: 'compenseren'
  };
}


  }

  return null;
}

// -----------------------------------------------------
// AFTREKKEN — COMPENSEREN — HTE − HTE (tot 1000)
// -----------------------------------------------------
function genereerAftrekkenCompenseren_HTE_HTE_Tot1000(cfg) {

  let safety = 0;

  while (safety++ < 400) {

    // -------------------------------------------------
    // 1️⃣ Kies compenseergetal (ENKEL aftrekker)
    //    tiental = 9
    //    eenheden = 6–9
    // -------------------------------------------------
    const h2 = rnd(1, 8); // 🔒 nooit 9 → afronden max 900
    const t2 = 9;
    const e2 = rnd(6, 9);

    const aftrekker = h2 * 100 + t2 * 10 + e2;

    // -------------------------------------------------
    // 2️⃣ Afronden naar honderdtal
    //    297 → 300 − 3
    // -------------------------------------------------
    const afgerond = (h2 + 1) * 100;
    const correctie = afgerond - aftrekker; // +3, +4, ...

    // -------------------------------------------------
    // 3️⃣ Kies eerste getal (moet groot genoeg zijn)
    // -------------------------------------------------
    const h1 = rnd(h2 + 1, 9);
    const t1 = rnd(0, 9);
    const e1 = rnd(0, 9);

    const minuend = h1 * 100 + t1 * 10 + e1;

    // -------------------------------------------------
    // 4️⃣ Veiligheden
    // -------------------------------------------------
    if (minuend <= aftrekker) continue;
    if (minuend - aftrekker < 0) continue;
    if (minuend % 100 === 0) continue;

    // -------------------------------------------------
    // 5️⃣ Klaar
    // -------------------------------------------------
    return {
      type: 'rekenen',
      getal1: minuend,
      getal2: aftrekker,
      operator: '-',
      somType: 'HTE-HTE',
      brugSoort: 'compenseren',
      compenseer: {
        afgerondNaar: afgerond,
        correctie: correctie
      }
    };
  }

  return null;
}

// =====================================================
// AFTREKKEN MET BRUG — AANVULLEN — TOT 1000
// TIJDELIJKE BASISIMPLEMENTATIE
// =====================================================
function genereerAftrekkenAanvullenTot1000(cfg) {

  let safety = 0;

  while (safety++ < 300) {

    const oef = genereerAftrekkenMetBrugTot1000(cfg);
    if (!oef) continue;

    const g1 = oef.getal1;
    const g2 = oef.getal2;
    const type = oef.somType;

    // =====================================
    // AANVULLEN – HT-HT
    // - verplicht brug
    // - verschil ≤ 40
    // =====================================
    if (type === 'HT-HT') {

      const verschil = g1 - g2;
      if (verschil > 40) continue;

      // 🔒 brug check zonder somHeeftBrug
      const t1 = (g1 % 100) / 10;
      const t2 = (g2 % 100) / 10;
      if (t2 <= t1) continue; // geen brug → weg
    }

    return oef;
  }

  return null;
}



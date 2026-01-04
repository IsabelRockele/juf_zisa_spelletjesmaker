// =====================================================
// HOOFDREKENEN – GENERATOR VERSIE 2
// SPECIFIEK: TOT 20
// Definitief uitgewerkt volgens didactische afspraken
// =====================================================

const rnd = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

    export function genereerTot20_V2(cfg) {

  // 👇 HIER GAAT UW BESTAANDE CODE VERDER

  let g1, g2, op;
  let safety = 0;

  // -----------------------------
  // TYPE BEWERKING
  // -----------------------------
if (cfg.operator) {
  op = cfg.operator;
} else if (cfg.rekenType === 'optellen') {
  op = '+';
} else if (cfg.rekenType === 'aftrekken') {
  op = '-';
} else {
  op = Math.random() < 0.5 ? '+' : '-';
}


  while (safety++ < 300) {
    // -----------------------------
// BRUG: zonder / met / beide
// -----------------------------
let effectieveBrug = cfg.rekenBrug;

if (cfg.rekenBrug === 'beide') {
  effectieveBrug = Math.random() < 0.5 ? 'zonder' : 'met';
}


    // =================================================
    // OPTELLEN TOT 20
    // =================================================
    if (op === '+') {

      // -----------------------------
      // ZONDER BRUG
      // E+E, T+E, TE+E
      // -----------------------------
      if (effectieveBrug === 'zonder'
) {

       // bepaal toegestane types vanuit UI
let toegestaneTypes = [];

if (cfg.somTypes && cfg.somTypes.length > 0) {
  toegestaneTypes = cfg.somTypes;
} else {
  // fallback: alles mag
  toegestaneTypes = ['E+E', 'T+E', 'TE+E'];
}

const gekozenType =
  toegestaneTypes[rnd(0, toegestaneTypes.length - 1)];

// E + E  (bv. 3 + 4)
if (gekozenType === 'E+E') {
  g1 = rnd(1, 8);
  g2 = rnd(1, 9 - g1);
}

// T + E  (bv. 10 + 6)
if (gekozenType === 'T+E') {
  g1 = 10;
  g2 = rnd(1, 9);
}

// TE + E (bv. 14 + 3)
if (gekozenType === 'TE+E') {
  g1 = rnd(11, 18);
  g2 = rnd(1, 20 - g1);
}

return [{
  type: 'rekenen',
  getal1: g1,
  getal2: g2,
  operator: '+'
}];

      }

      // -----------------------------
      // MET BRUG
      // ENKEL E + E
      // -----------------------------
      if (effectieveBrug === 'met') {

       g1 = rnd(2, 9);
g2 = rnd(10 - g1 + 1, 9); // +1 → vermijdt exact 10

if (g1 + g2 > 10 && g1 + g2 <= 20) {
  return [{
  type: 'rekenen',
  getal1: g1,
  getal2: g2,
  operator: '+'
}];

}
      }

    }

  // =================================================
// AFTREKKEN TOT 20 — DEFINITIEF
// =================================================
if (op === '-') {

  // -----------------------------
  // ZONDER BRUG
  // E−E, TE−E, TE−TE
  // -----------------------------
  if (effectieveBrug === 'zonder') {
    // ✅ PRIORITEIT: TE−TE zonder brug als enige keuze
if (
  cfg.somTypes &&
  cfg.somTypes.length === 1 &&
  cfg.somTypes[0] === 'TE-TE'
) {
  const e1 = rnd(2, 9);
  const e2 = rnd(1, e1 - 1);

  return [{
    type: 'rekenen',
    getal1: 10 + e1,
    getal2: 10 + e2,
    operator: '-'
  }];
}


    // bepaal toegestane types vanuit UI
    let toegestaneTypes = [];

    if (cfg.somTypes && cfg.somTypes.length > 0) {
      toegestaneTypes = cfg.somTypes;
    } else {
      // fallback
      toegestaneTypes = ['E-E', 'TE-E', 'TE-TE'];
    }

    const gekozenType =
      toegestaneTypes[rnd(0, toegestaneTypes.length - 1)];

    // E − E
    if (gekozenType === 'E-E') {
      g1 = rnd(2, 9);
      g2 = rnd(1, g1 - 1);
      return [{
  type: 'rekenen',
  getal1: g1,
  getal2: g2,
  operator: '-'
}];

    }

    // TE − E
    if (gekozenType === 'TE-E') {
      g1 = rnd(11, 19);
      g2 = rnd(1, g1 % 10); // geen lenen
      return [{
  type: 'rekenen',
  getal1: g1,
  getal2: g2,
  operator: '-'
}];

    }

    // TE − TE
  // TE − TE zonder brug (bv. 15 − 13, 16 − 14)
if (gekozenType === 'TE-TE') {
  const e1 = rnd(2, 9);        // eenheden van g1
  const e2 = rnd(1, e1 - 1);   // e2 < e1 → geen lenen

  g1 = 10 + e1;                // bv. 15
  g2 = 10 + e2;                // bv. 13

 return [{
  type: 'rekenen',
  getal1: g1,
  getal2: g2,
  operator: '-'
}];

}
  }

  // -----------------------------
  // MET BRUG
  // ENKEL: T−E, T−TE
  // -----------------------------
 if (effectieveBrug === 'met') {

  // bepaal toegestane types vanuit UI
  let toegestaneTypes = [];

  if (cfg.somTypes && cfg.somTypes.length > 0) {
    toegestaneTypes = cfg.somTypes;
  } else {
    // fallback
    toegestaneTypes = ['T-E', 'T-TE', 'TE-E'];
  }

  // 👉 EERST kiezen
  const gekozenType =
    toegestaneTypes[rnd(0, toegestaneTypes.length - 1)];

  // TE − E met brug (bv. 12 − 6, 13 − 5)
if (gekozenType === 'TE-E') {
  const e1 = rnd(1, 8);          // eenheden van g1 (1–8)
  const e2 = rnd(e1 + 1, 9);     // e2 > e1 → lenen verplicht

  g1 = 10 + e1;                  // 11–18
  g2 = e2;                       // 2–9

 return [{
  type: 'rekenen',
  getal1: g1,
  getal2: g2,
  operator: '-'
}];

}


  // T − E  (20 − 7)
  if (gekozenType === 'T-E') {
    g1 = 20;
    g2 = rnd(1, 9);return [{
  type: 'rekenen',
  getal1: g1,
  getal2: g2,
  operator: '-'
}];
return [{
  type: 'rekenen',
  getal1: g1,
  getal2: g2,
  operator: '-'
}];

  }

  // T − TE (20 − 14)
  if (gekozenType === 'T-TE') {
    g1 = 20;
    g2 = rnd(11, 19);
   return [{
  type: 'rekenen',
  getal1: g1,
  getal2: g2,
  operator: '-'
}];

  }
}
  }
} // ← sluit while

return null;
} // ← sluit functie
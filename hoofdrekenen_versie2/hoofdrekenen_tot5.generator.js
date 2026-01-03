// =====================================================
// HOOFDREKENEN – GENERATOR VERSIE 2
// SPECIFIEK: TOT 5
// =====================================================

const rnd = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export function genereerTot5_V2(cfg) {
  let g1, g2, op;
  let safety = 0;

  // bepaal bewerking
  if (cfg.rekenType === 'optellen') op = '+';
  else if (cfg.rekenType === 'aftrekken') op = '-';
  else op = Math.random() < 0.5 ? '+' : '-';

  while (safety++ < 200) {

 // OPTELLEN TOT 5 — met zeldzame +0
if (op === '+') {

  // 20% kans dat één term 0 is
  if (Math.random() < 0.1) {

    // één van beide is 0
    if (Math.random() < 0.5) {
      g1 = 0;
      g2 = rnd(1, 5);
    } else {
      g1 = rnd(1, 5);
      g2 = 0;
    }

  } else {
    // beide termen minstens 1
    g1 = rnd(1, 4);
    g2 = rnd(1, 5 - g1);
  }

  return {
    type: 'rekenen',
    getal1: g1,
    getal2: g2,
    operator: '+'
  };
}


  // AFTREKKEN TOT 5 — met zeldzame -0
if (op === '-') {
  g1 = rnd(2, 5);

  // 20% kans op -0
  if (Math.random() < 0.1) {
    g2 = 0;
  } else {
    g2 = rnd(1, g1 - 1);
  }

  return {
    type: 'rekenen',
    getal1: g1,
    getal2: g2,
    operator: '-'
  };
}
  }

  return null;
}

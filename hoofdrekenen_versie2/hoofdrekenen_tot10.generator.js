// =====================================================
// HOOFDREKENEN – GENERATOR VERSIE 2
// SPECIFIEK: TOT 10 (ZONDER BRUG)
// +0 en -0 ZELDZAAM
// =====================================================

const rnd = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export function genereerTot10_V2(cfg) {
  let g1, g2, op;
  let safety = 0;

  // bepaal bewerking
  if (cfg.rekenType === 'optellen') op = '+';
  else if (cfg.rekenType === 'aftrekken') op = '-';
  else op = Math.random() < 0.5 ? '+' : '-';

  while (safety++ < 200) {

    // ============================
    // OPTELLEN TOT 10 — +0 zeldzaam
    // ============================
    if (op === '+') {

      // 10% kans op +0
      if (Math.random() < 0.1) {
        if (Math.random() < 0.5) {
          g1 = 0;
          g2 = rnd(1, 10);
        } else {
          g1 = rnd(1, 10);
          g2 = 0;
        }
      } else {
        // normale sommen
        g1 = rnd(1, 9);
        g2 = rnd(1, 10 - g1);
      }

      return {
        type: 'rekenen',
        getal1: g1,
        getal2: g2,
        operator: '+'
      };
    }

    // ============================
    // AFTREKKEN TOT 10 — -0 zeldzaam
    // ============================
    if (op === '-') {

      g1 = rnd(2, 10);

      // 10% kans op -0
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

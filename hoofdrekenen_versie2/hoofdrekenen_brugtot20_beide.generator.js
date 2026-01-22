// ===================================================
// HOOFDREKENEN — BRUG = BEIDE TOEGESTAAN
// ===================================================

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


export function genereerBrugBeide(cfg) {
const oefeningen = [];
const gebruikteSommen = new Set();

  const max = cfg.rekenMaxGetal;
  const somTypes = cfg.somTypes && cfg.somTypes.length
    ? cfg.somTypes
    : [];

  let safety = 0;

  while (oefeningen.length < cfg.numOefeningen && safety < 500) {
    safety++;

    // 1️⃣ kies optellen / aftrekken
    let op;
    if (cfg.rekenType === 'beide') {
      op = Math.random() < 0.5 ? '+' : '-';
    } else {
      op = (cfg.rekenType === 'aftrekken') ? '-' : '+';
    }

    // 2️⃣ kies een somtype uit wat is aangevinkt
    const mogelijkeTypes = somTypes.filter(t =>
      (op === '+' && t.includes('+')) ||
      (op === '-' && t.includes('-'))
    );

    if (mogelijkeTypes.length === 0) continue;

    const type = mogelijkeTypes[rnd(0, mogelijkeTypes.length - 1)];

    let g1, g2;

    // ======================
    // OPTELLEN
    // ======================
    if (op === '+') {

      if (type === 'E+E') {
        g1 = rnd(1, 9);
        g2 = rnd(1, 9);
      }

      if (type === 'T+E') {
        g1 = rnd(1, 9) * 10;
        g2 = rnd(1, 9);
      }

      if (type === 'TE+E') {
        g1 = rnd(11, max - 1);
        g2 = rnd(1, 9);
      }

      if (g1 + g2 > max) continue;
    }

    // ======================
    // AFTREKKEN
    // ======================
    if (op === '-') {

      if (type === 'E-E') {
        g1 = rnd(2, 9);
        g2 = rnd(1, g1 - 1);
      }

      if (type === 'TE-E') {
        g1 = rnd(11, max);
        g2 = rnd(1, 9);
        if (g2 >= g1 % 10) {
          // met brug
        }
      }

      if (type === 'TE-TE') {
        g1 = rnd(11, max);
        g2 = rnd(11, g1 - 1);
      }

      if (type === 'T-E') {
        g1 = Math.floor(max / 10) * 10;
        g2 = rnd(1, 9);
      }

      if (type === 'T-TE') {
        g1 = Math.floor(max / 10) * 10;
        g2 = rnd(11, g1 - 1);
      }

      if (g1 - g2 < 0) continue;
    }

    if (typeof g1 !== 'number' || typeof g2 !== 'number') {
  continue;
}

    // ✔ geldige oefening
const sleutel = `${op}|${g1}|${g2}`;
if (gebruikteSommen.has(sleutel)) continue;

gebruikteSommen.add(sleutel);

oefeningen.push({
  type: 'rekenen',
  getal1: g1,
  getal2: g2,
  operator: op,
  _voorbeeld: false
});

  }

  return { oefeningen };

}

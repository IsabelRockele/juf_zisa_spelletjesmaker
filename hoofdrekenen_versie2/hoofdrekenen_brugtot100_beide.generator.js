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

    // 🔧 somTypes normaliseren (spaties weg)
const normSomTypes = somTypes.map(t => t.replace(/\s+/g, ''));

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
 let mogelijkeTypes = normSomTypes.filter(t =>
  (op === '+' && t.includes('+')) ||
  (op === '-' && t.includes('-'))
);

// 🔒 Als er maar één somtype is gekozen: dwing dat af
if (normSomTypes.length === 1) {
  mogelijkeTypes = [normSomTypes[0]];
}



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

  } else if (type === 'T+E') {
    g1 = rnd(1, 9) * 10;
    g2 = rnd(1, 9);

  } else if (type === 'T+T') {
    g1 = rnd(1, 9) * 10;
    g2 = rnd(1, 9) * 10;

  } else if (type === 'TE+E') {
    g1 = rnd(11, 99);
    g2 = rnd(1, 9);

  } else if (type === 'TE+T') {
    g1 = rnd(11, 99);
    g2 = rnd(1, 9) * 10;

 } else if (type === 'TE+TE') {
  g1 = rnd(11, 99);
  g2 = rnd(11, 99);

  // ❗ beide getallen moeten echt TE zijn (eenheden ≠ 0)
  if (g1 % 10 === 0 || g2 % 10 === 0) continue;
}

if (g1 + g2 > 100) continue;

// 🔑 Brugregel bij optellen
const heeftBrug = (g1 % 10) + (g2 % 10) >= 10;

if (cfg.rekenBrug === 'met' && !heeftBrug) continue;
if (cfg.rekenBrug === 'zonder' && heeftBrug) continue;
// bij 'beide' → niets doen

}

    // ======================
    // AFTREKKEN
    // ======================
   if (op === '-') {

  if (type === 'E-E') {
    g1 = rnd(2, 9);
    g2 = rnd(1, g1 - 1);

  } else if (type === 'T-E') {
    g1 = rnd(2, 9) * 10;
    g2 = rnd(1, 9);

  } else if (type === 'T-T') {
    g1 = rnd(2, 9) * 10;
    g2 = rnd(1, g1 / 10 - 1) * 10;

  } else if (type === 'TE-E') {
    g1 = rnd(11, 99);
    g2 = rnd(1, 9);
    // ❗ g1 moet echt TE zijn (eenheden ≠ 0)
    if (g1 % 10 === 0) continue;

  } else if (type === 'T-TE') {
    g1 = rnd(2, 9) * 10;
    g2 = rnd(11, g1 - 1);
    // ❗ g2 moet echt TE zijn (eenheden ≠ 0)
    if (g2 % 10 === 0) continue;

  } else if (type === 'TE-TE') {
    g1 = rnd(11, 99);
    g2 = rnd(11, g1 - 1);
    // ❗ beide moeten echt TE zijn (eenheden ≠ 0)
    if (g1 % 10 === 0 || g2 % 10 === 0) continue;
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

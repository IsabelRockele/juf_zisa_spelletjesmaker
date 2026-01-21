// hoofdrekenen_versie2/aftrekken_aanvullen_tot1000.generator.js

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isBrugBijAftrekken(a, b) {
  // Brug bij aftrekken: eenheden van aftrekker > eenheden van aftrektal
  return (b % 10) > (a % 10);
}

function nextTen(n) {
  return Math.ceil(n / 10) * 10;
}

function nextHundred(n) {
  return Math.ceil(n / 100) * 100;
}

function pickAanvulDoel(a) {
  // Basiskeuze: als je dicht bij volgend honderdtal zit, gebruik honderdtal; anders tiental.
  // (Eenvoudig en “didactisch logisch”; kan later verfijnd worden.)
  const t = nextTen(a);
  const h = nextHundred(a);
  const dt = t - a;
  const dh = h - a;

  // Als naar het honderdtal “redelijk dichtbij” is, pak honderdtal
  // (drempel kan later aangepast worden)
  return (dh > 0 && dh <= 40) ? h : t;
}

function oefToPreview(a, b) {
  const doel = pickAanvulDoel(a);
  return {
    getal1: a,
    getal2: b,
    operator: '-',
    strategie: 'aanvullen',
    // extra info voor visuals (schema/schijfjes) of uitleg:
    aanvulDoel: doel,
    restNaDoel: (a - b) - (a - doel) // = doel - b, handig in 2-stap aanvullen
  };
}

/**
 * Genereer AFTREKKEN met AANVULLEN tot 1000 (exact aantal)
 * somType: 'HT-HT' of 'HTE-HTE'
 */
export function genereerAftrekkenAanvullenTot1000_N(aantal, somType) {
  const N = Math.max(1, Number(aantal || 20));
  const out = [];
  const seen = new Set();

  // Veiligheidslimiet tegen oneindige loops
  const MAX_TRIES = N * 200;

  let tries = 0;
  while (out.length < N && tries < MAX_TRIES) {
    tries++;

    let a, b;

   if (somType === 'HT-HT') {

  // ================================
  // AANVULLEN — HT-HT (tot 1000)
  // Regels:
  // - uitkomst <= 60
  // - brug (lenen) op tientallen:
  //   tiental(aftrekker) > tiental(aftrektal)
  // Voorbeelden: 720-680, 910-870
  // ================================

  // Kies a als mooi tiental (HT, 110..990)
  a = rnd(11, 99) * 10; // 110..990

  // Kies een kleine uitkomst (20..60, enkel tientallen)
  const sprongen = [20, 30, 40, 50, 60];
  const diff = sprongen[rnd(0, sprongen.length - 1)];

  // b ligt dicht bij a
  b = a - diff;

  // veiligheid
  if (b < 100) continue;

  // 🔒 Brug op tientallen afdwingen:
  // tiental van b > tiental van a (lenen bij tientallen)
  const tientalA = Math.floor((a % 100) / 10);
  const tientalB = Math.floor((b % 100) / 10);
  if (tientalB <= tientalA) continue;

}


else if (somType === 'HTE-HTE') {

  // ================================
  // AANVULLEN — HTE-HTE — tot 1000
  // Uitkomst: max 8
  // Altijd eenheden-bruik (klassiek aanvullen)
  // ================================

  // a = doelgetal (3-cijferig, echte HTE)
  a = rnd(101, 999);
  if (a % 10 === 0) continue;

  // kleine aanvul-uitkomst (1–8)
  const uitkomst = rnd(1, 8);
  b = a - uitkomst;

  // veiligheid
  if (b < 100) continue;

  // echte eenheden-bruik afdwingen
  // aftrekker heeft meer eenheden dan aftrektal
  if ((b % 10) <= (a % 10)) continue;

  // vermijd mooie tientallen
  if (b % 10 === 0) continue;

} else {
  // Onbekend somType → stop veilig
  break;
}


    const key = `${somType}:${a}-${b}`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push(oefToPreview(a, b));
  }

  return out;
}

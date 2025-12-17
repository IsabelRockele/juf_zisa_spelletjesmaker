/* =========================================================
   SPLITSEN – GENERATOR
   1-op-1 overgenomen uit bewerkingen_werkblad_versie3.js
   ========================================================= */

export function genereerSplitsing(settings) {
  const fijn = settings.splitsFijn || {};
  const totalen = new Set();

  // Vinkjes → toegestane totalen
  if (fijn.tot5) [1,2,3,4,5].forEach(n => totalen.add(n));
  if (fijn.van6)  totalen.add(6);
  if (fijn.van7)  totalen.add(7);
  if (fijn.van8)  totalen.add(8);
  if (fijn.van9)  totalen.add(9);
  if (fijn.van10) totalen.add(10);
  if (fijn.van10tot20) for (let n = 10; n <= 20; n++) totalen.add(n);

  // Fallback (exact zoals origineel)
  if (totalen.size === 0) {
    const arr = settings.splitsGetallenArray?.length
      ? settings.splitsGetallenArray
      : [10];
    const g = arr[Math.floor(Math.random() * arr.length)];
    totalen.add(Math.max(1, Math.floor(Math.random() * g) + 1));
  }

  // Kies totaal
  const lijst = Array.from(totalen);
  const totaal = lijst[Math.floor(Math.random() * lijst.length)];

  // Kies splitsing
  let d1, d2;
let pogingen = 0;

do {
  d1 = Math.floor(Math.random() * (totaal + 1));
  d2 = totaal - d1;
  pogingen++;
} while (
  pogingen < 20 &&
  (
    d1 === 0 ||
    d2 === 0 ||
    d1 === totaal ||
    d2 === totaal ||
    d1 === 10 ||
    d2 === 10
  )
);


  // Brugfilter 10–20
  const brugKeuze =
    (fijn.van10tot20 && totaal >= 10 && totaal <= 20)
      ? (fijn.brug10tot20 || 'beide')
      : 'beide';

  const metBrug = (x, y) => ((x % 10) + (y % 10)) > 9;

  if ((brugKeuze === 'met' || brugKeuze === 'zonder') && totaal >= 10 && totaal <= 20) {
    const wilMet = brugKeuze === 'met';
    let tries = 0;
    while (tries++ < 60 && (metBrug(d1, d2) !== wilMet)) {
      d1 = Math.floor(Math.random() * (totaal + 1));
      d2 = totaal - d1;
    }
  }

  // Prefill links/rechts
  const prefill = Math.random() < 0.5 ? 'links' : 'rechts';

  // Soms som-vraag
  const isSom = !!settings.splitsSom && Math.random() < 0.3;

  return {
    type: 'splitsen',
    isSom,
    totaal,
    deel1: d1,
    deel2: d2,
    prefill
  };
}

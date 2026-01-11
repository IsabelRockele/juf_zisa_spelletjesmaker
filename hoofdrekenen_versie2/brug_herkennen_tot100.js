/**
 * Brug herkennen tot 100
 * ----------------------
 * - volledig los van hoofdrekenen
 * - geen somTypes
 * - geen bestaande generators
 * - puur didactisch
 *
 * type: 'plus' | 'min'
 * aantal: aantal oefeningen (bv. 20)
 */

function genereerBrugHerkennenTot100(type = 'plus', aantal = 20) {

 

  const oefeningen = [];
  const seen = new Set();
  let safety = 0;

  while (oefeningen.length < aantal && safety++ < aantal * 20) {

    let a, b, op, heeftBrug = false;

    if (type === 'plus') {
      op = '+';

      // TE + E of TE + TE
      const isTE_TE = Math.random() < 0.5;

      const tientallen1 = rand(1, 9) * 10;
      const eenheden1 = rand(0, 9);
      a = tientallen1 + eenheden1;

      if (isTE_TE) {
        const tientallen2 = rand(1, 9) * 10;
        const eenheden2 = rand(0, 9);
        b = tientallen2 + eenheden2;
      } else {
        b = rand(0, 9);
      }

      // Brugregel optellen
      heeftBrug = (a % 10) + (b % 10) >= 10;

      // max 100 bewaken
      if (a + b > 100) continue;

    } else {
      op = '-';

      // TE - E of TE - TE
      const isTE_TE = Math.random() < 0.5;

      const tientallen1 = rand(1, 9) * 10;
      const eenheden1 = rand(0, 9);
      a = tientallen1 + eenheden1;

      if (isTE_TE) {
        const tientallen2 = rand(1, 9) * 10;
        const eenheden2 = rand(0, 9);
        b = tientallen2 + eenheden2;
      } else {
        b = rand(0, 9);
      }

// ❌ geen negatieve uitkomst
if (b > a) continue;


      // Brugregel aftrekken
      heeftBrug = (b % 10) > (a % 10);
    }

    const key = `${a}${op}${b}`;
if (seen.has(key)) continue;
seen.add(key);

    oefeningen.push({
      a,
      b,
      op,
      heeftBrug
    });
  }

  return oefeningen;
}

// hulpfunctie
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
window.genereerBrugHerkennenTot100 = genereerBrugHerkennenTot100;

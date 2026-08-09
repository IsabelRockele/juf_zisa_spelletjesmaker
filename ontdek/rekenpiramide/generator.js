/* ─── GENERATOR.JS ───────────────────────────────────────────────────────────
   Genereert de cijfers van een rekenpiramide.
   Een piramide heeft H rijen. De onderste rij heeft H vakjes, de top 1 vakje.
   Elk vakje boven = som (of product) van de twee vakjes eronder.

   Output: { rijen: [[..onderste..], ..., [top]], leeg: [[bool,..], ...] }
   Waarbij `leeg[r][i]` = true als dat vakje leeg getoond moet worden.
─────────────────────────────────────────────────────────────────────────── */

const Generator = (() => {

  // ── Hulpfuncties ─────────────────────────────────────────────────────────
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function heeftBrugBijOptellen(a, b) {
    // Tiental-overschrijding: eenheden van a + eenheden van b >= 10
    return ((a % 10) + (b % 10)) >= 10;
  }

  // Bereken volledige piramide vanuit onderste rij
  function bouwOpVanuitOnder(onderste, bewerking) {
    const rijen = [onderste.slice()];
    for (let r = 1; r < onderste.length; r++) {
      const vorige = rijen[r - 1];
      const nieuw = [];
      for (let i = 0; i < vorige.length - 1; i++) {
        if (bewerking === 'optellen') {
          nieuw.push(vorige[i] + vorige[i + 1]);
        } else {
          nieuw.push(vorige[i] * vorige[i + 1]);
        }
      }
      rijen.push(nieuw);
    }
    return rijen;
  }

  // ── Optelpiramide ────────────────────────────────────────────────────────
  function genereerOptelOnderste(hoogte, maxTop, brug) {
    // Probeer max 200 keer een geldige onderste rij
    for (let poging = 0; poging < 200; poging++) {
      const onderste = [];
      // Heuristiek: kies getallen klein genoeg dat top <= maxTop
      // Top wordt benaderend = som van onderste rij * binomiaalcoëfficiënten
      // Voor H rijen: coëfficiënten zijn C(H-1, i)
      // Som van coëfficiënten = 2^(H-1)
      // Dus gemiddelde getal in onderste rij ≈ maxTop / 2^(H-1)
      const gemiddeld = Math.max(1, Math.floor(maxTop / Math.pow(2, hoogte - 1)));
      const maxOnder = Math.max(2, gemiddeld * 2);

      for (let i = 0; i < hoogte; i++) {
        onderste.push(randInt(1, maxOnder));
      }

      const rijen = bouwOpVanuitOnder(onderste, 'optellen');
      const top = rijen[rijen.length - 1][0];

      // Check: top binnen bereik?
      if (top > maxTop) continue;
      if (top < 3) continue; // te kleine piramide

      // Check brug
      if (brug !== 'beide') {
        let heeftBrug = false;
        let heeftGeenBrug = false;
        for (let r = 0; r < rijen.length - 1; r++) {
          for (let i = 0; i < rijen[r].length - 1; i++) {
            if (heeftBrugBijOptellen(rijen[r][i], rijen[r][i + 1])) {
              heeftBrug = true;
            } else {
              heeftGeenBrug = true;
            }
          }
        }
        if (brug === 'zonder' && heeftBrug) continue;
        if (brug === 'met' && !heeftBrug) continue;
      }

      return rijen;
    }

    // Fallback: gewoon iets teruggeven
    const onderste = Array(hoogte).fill(0).map(() => randInt(1, 5));
    return bouwOpVanuitOnder(onderste, 'optellen');
  }

  // ── Vermenigvuldigpiramide ───────────────────────────────────────────────
  function genereerVermenigvuldigOnderste(hoogte, gekozenTafels) {
    // Voor vermenigvuldigen werkt enkel hoogte 2 of 3 redelijk.
    // Onderste rij: getallen uit gekozen tafels of klein (1-10)
    // Bij hoogte 3: producten worden snel groot, dus we kiezen kleine getallen.

    const tafels = gekozenTafels.length > 0 ? gekozenTafels : [2, 3, 4, 5];

    for (let poging = 0; poging < 100; poging++) {
      const onderste = [];
      for (let i = 0; i < hoogte; i++) {
        // Mix van tafels en kleine getallen
        if (Math.random() < 0.6) {
          onderste.push(tafels[randInt(0, tafels.length - 1)]);
        } else {
          onderste.push(randInt(2, 10));
        }
      }

      const rijen = bouwOpVanuitOnder(onderste, 'vermenigvuldigen');
      const top = rijen[rijen.length - 1][0];

      // Beperk topwaarde voor leesbaarheid
      const maxTop = hoogte === 2 ? 100 : 1000;
      if (top > maxTop) continue;
      if (top < 4) continue;

      return rijen;
    }

    // Fallback
    const onderste = Array(hoogte).fill(0).map(() => randInt(2, 5));
    return bouwOpVanuitOnder(onderste, 'vermenigvuldigen');
  }

  // ── Helper: kan piramide opgelost worden vanuit gegeven vakjes? ──────────
  // Een vakje kan opgelost worden als:
  //  - het al gegeven is, OF
  //  - beide vakjes eronder bekend zijn (optellen/vermenigvuldigen omhoog), OF
  //  - het vakje erboven én één buurvakje eronder bekend zijn (terugrekenen).
  // We simuleren iteratief tot er niets meer verandert.
  function isOplosbaar(rijen, gegeven, bewerking) {
    const hoogte = rijen.length;
    const bekend = gegeven.map(rij => rij.slice());
    let veranderd = true;

    while (veranderd) {
      veranderd = false;
      for (let r = 0; r < hoogte; r++) {
        for (let i = 0; i < rijen[r].length; i++) {
          if (bekend[r][i]) continue;

          // Probeer omhoog: dit vakje = som/product van twee vakjes eronder
          if (r > 0) {
            const linksOnder = bekend[r - 1][i];
            const rechtsOnder = bekend[r - 1][i + 1];
            if (linksOnder && rechtsOnder) {
              bekend[r][i] = true;
              veranderd = true;
              continue;
            }
          }

          // Probeer terugrekenen: vakje boven bekend + één buur eronder bekend
          if (r < hoogte - 1) {
            // Vakje boven (r+1, i-1) of (r+1, i) gebruikt dit vakje
            // Geval 1: vakje (r+1, i) bekend + buur (r, i+1) bekend
            if (i + 1 < rijen[r].length && bekend[r + 1][i] && bekend[r][i + 1]) {
              bekend[r][i] = true;
              veranderd = true;
              continue;
            }
            // Geval 2: vakje (r+1, i-1) bekend + buur (r, i-1) bekend
            if (i > 0 && bekend[r + 1][i - 1] && bekend[r][i - 1]) {
              bekend[r][i] = true;
              veranderd = true;
              continue;
            }
          }
        }
      }
    }

    // Alles bekend?
    for (let r = 0; r < hoogte; r++) {
      for (let i = 0; i < rijen[r].length; i++) {
        if (!bekend[r][i]) return false;
      }
    }
    return true;
  }

  // ── Tel totaal aantal vakjes ─────────────────────────────────────────────
  function totaalVakjes(rijen) {
    let n = 0;
    for (const rij of rijen) n += rij.length;
    return n;
  }

  // ── Bepaal welke vakjes leeg zijn ────────────────────────────────────────
  // Strategie: gebruik MINIMAAL aantal hints (= aantal rijen) zodat de
  // piramide nog net oplosbaar is. Verspreid die hints zo veel mogelijk
  // over verschillende rijen voor variatie.
  function bepaalLegeVakjes(rijen, type) {
    const hoogte = rijen.length;

    // Aantal hints per type:
    //  - makkelijk: hoogte + 2  (extra hints bovenop minimum)
    //  - gemengd:   hoogte + 1
    //  - moeilijk:  hoogte      (absolute minimum)
    let aantalHints;
    if (type === 'makkelijk') aantalHints = hoogte + 2;
    else if (type === 'moeilijk') aantalHints = hoogte;
    else aantalHints = hoogte + 1; // gemengd

    // Beperk: niet meer dan totaal aantal vakjes
    const totaal = totaalVakjes(rijen);
    if (aantalHints > totaal) aantalHints = totaal;

    // Probeer max 200 keer een geldige verdeling
    for (let poging = 0; poging < 200; poging++) {
      const gegeven = rijen.map(rij => rij.map(() => false));

      // Verzamel alle posities en shuffle
      const alle = [];
      for (let r = 0; r < hoogte; r++) {
        for (let i = 0; i < rijen[r].length; i++) {
          alle.push([r, i]);
        }
      }
      // Fisher-Yates shuffle
      for (let k = alle.length - 1; k > 0; k--) {
        const j = randInt(0, k);
        [alle[k], alle[j]] = [alle[j], alle[k]];
      }

      // Strategie: kies eerst per rij 1 willekeurige hint (zorgt voor verspreiding),
      // dan vul aan tot het gewenste aantal hints bereikt is.
      // Bij makkelijk: garandeer dat de onderste rij meer hints krijgt.

      if (type === 'makkelijk') {
        // Onderste rij: minstens 2 hints (of hele rij als die kort is)
        const onderIndices = [];
        for (let i = 0; i < rijen[0].length; i++) onderIndices.push(i);
        // shuffle
        for (let k = onderIndices.length - 1; k > 0; k--) {
          const j = randInt(0, k);
          [onderIndices[k], onderIndices[j]] = [onderIndices[j], onderIndices[k]];
        }
        const aantalOnder = Math.min(2, rijen[0].length);
        for (let k = 0; k < aantalOnder; k++) {
          gegeven[0][onderIndices[k]] = true;
        }
      } else {
        // Gemengd/moeilijk: 1 hint per rij om verspreid te zijn
        for (let r = 0; r < hoogte; r++) {
          if (rijen[r].length === 0) continue;
          const i = randInt(0, rijen[r].length - 1);
          gegeven[r][i] = true;
        }
      }

      // Tel huidige
      let huidig = 0;
      for (let r = 0; r < hoogte; r++) for (let i = 0; i < rijen[r].length; i++) if (gegeven[r][i]) huidig++;

      // Aanvullen tot gewenst aantal
      const restanten = alle.filter(([r, i]) => !gegeven[r][i]);
      for (const [r, i] of restanten) {
        if (huidig >= aantalHints) break;
        gegeven[r][i] = true;
        huidig++;
      }

      // Check oplosbaarheid
      if (isOplosbaar(rijen, gegeven, 'optellen')) {
        const leeg = gegeven.map(rij => rij.map(v => !v));
        return leeg;
      }
    }

    // Fallback: onderste rij volledig + top zichtbaar (klassiek, altijd oplosbaar)
    const leeg = rijen.map(rij => rij.map(() => true));
    for (let i = 0; i < rijen[0].length; i++) leeg[0][i] = false;
    return leeg;
  }

  // ── Publieke API ─────────────────────────────────────────────────────────
  function genereerOptelPiramide(settings) {
    const rijen = genereerOptelOnderste(settings.hoogte, settings.maxTop, settings.brug);
    const leeg = bepaalLegeVakjes(rijen, settings.type);
    return { rijen, leeg, bewerking: 'optellen' };
  }

  function genereerVermenigvuldigPiramide(settings) {
    const rijen = genereerVermenigvuldigOnderste(settings.hoogte, settings.tafels);
    const leeg = bepaalLegeVakjes(rijen, settings.type);
    return { rijen, leeg, bewerking: 'vermenigvuldigen' };
  }

  function genereerSet(settings) {
    const piramides = [];
    for (let i = 0; i < settings.aantal; i++) {
      if (settings.bewerking === 'optellen') {
        piramides.push(genereerOptelPiramide(settings));
      } else {
        piramides.push(genereerVermenigvuldigPiramide(settings));
      }
    }
    return piramides;
  }

  return {
    genereerSet,
    genereerOptelPiramide,
    genereerVermenigvuldigPiramide
  };

})();

/* ─── GENERATOR.JS ───────────────────────────────────────────────────────────
   Genereert een rekendriehoek met 3 hoeken (a, b, c) en 3 zijden:
     sumAB = a + b
     sumAC = a + c
     sumBC = b + c
   Type 'mengeling': sommige vakjes leeg, sommige gegeven.
   Net genoeg getallen om volledig oplosbaar te zijn.
─────────────────────────────────────────────────────────────────────────── */

const Generator = (() => {

  const VAKJES = ['a', 'b', 'c', 'sumAB', 'sumAC', 'sumBC'];

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function heeftBrugBijOptellen(a, b) {
    return ((a % 10) + (b % 10)) > 10;
  }
  function heeftBrugBijAftrekken(groot, klein) {
    return (groot % 10) < (klein % 10);
  }

  // ── Genereer onderliggende waarden (a, b, c) ───────────────────────────
  function genereerWaarden(niveau, brug) {
    // De 3 sommen mogen niet groter zijn dan niveau.
    // Dus a+b, a+c, b+c <= niveau → grootste 2 hoeken samen <= niveau.
    // We kiezen elke hoek tussen 1 en (niveau-1)/2, met wat speling.

    for (let poging = 0; poging < 500; poging++) {
      const maxHoek = Math.max(2, Math.floor(niveau * 0.55));
      const a = randInt(1, maxHoek);
      const b = randInt(1, maxHoek);
      const c = randInt(1, maxHoek);

      const sumAB = a + b;
      const sumAC = a + c;
      const sumBC = b + c;

      // Som binnen niveau?
      if (sumAB > niveau || sumAC > niveau || sumBC > niveau) continue;
      // Niet allemaal hetzelfde getal (saai)
      if (a === b && b === c) continue;

      // Brug check — strikt:
      //   'zonder' = geen enkele som mag brug hebben
      //   'met'    = alle sommen moeten brug hebben
      //   'beide'  = geen restrictie
      if (brug !== 'beide') {
        const sommen = [[a, b], [a, c], [b, c]];
        const aantalMetBrug = sommen.filter(([x, y]) => heeftBrugBijOptellen(x, y)).length;
        if (brug === 'zonder' && aantalMetBrug > 0) continue;
        if (brug === 'met' && aantalMetBrug < 3) continue;
      }

      return { a, b, c, sumAB, sumAC, sumBC };
    }

    // Fallback
    const a = randInt(1, 5), b = randInt(1, 5), c = randInt(1, 5);
    return { a, b, c, sumAB: a+b, sumAC: a+c, sumBC: b+c };
  }

  // ── Check oplosbaarheid ────────────────────────────────────────────────
  // Een vakje kan opgelost worden als:
  //  - het al gegeven is, OF
  //  - het is een som en beide hoeken zijn bekend, OF
  //  - het is een hoek en de bijhorende som + andere hoek zijn bekend.
  function isOplosbaar(gegeven) {
    const bekend = { ...gegeven };
    let veranderd = true;

    while (veranderd) {
      veranderd = false;

      // Hoeken kunnen berekend worden uit som - andere hoek
      if (!bekend.a) {
        if (bekend.sumAB && bekend.b) { bekend.a = true; veranderd = true; }
        else if (bekend.sumAC && bekend.c) { bekend.a = true; veranderd = true; }
      }
      if (!bekend.b) {
        if (bekend.sumAB && bekend.a) { bekend.b = true; veranderd = true; }
        else if (bekend.sumBC && bekend.c) { bekend.b = true; veranderd = true; }
      }
      if (!bekend.c) {
        if (bekend.sumAC && bekend.a) { bekend.c = true; veranderd = true; }
        else if (bekend.sumBC && bekend.b) { bekend.c = true; veranderd = true; }
      }

      // Sommen kunnen berekend worden uit twee hoeken
      if (!bekend.sumAB && bekend.a && bekend.b) { bekend.sumAB = true; veranderd = true; }
      if (!bekend.sumAC && bekend.a && bekend.c) { bekend.sumAC = true; veranderd = true; }
      if (!bekend.sumBC && bekend.b && bekend.c) { bekend.sumBC = true; veranderd = true; }
    }

    return VAKJES.every(v => bekend[v]);
  }

  // ── Bepaal welke vakjes gegeven zijn (mengeling, minimum hints) ────────
  // Elke driehoek heeft 6 vakjes en 3 vrijheidsgraden (de hoeken bepalen alles).
  // Dus we hebben minimaal 3 hints nodig — maar niet zomaar 3 willekeurige!
  // Bv. (a, b, sumAB) is redundant. We checken oplosbaarheid expliciet.
  function bepaalGegeven() {
    // Probeer veel verschillende combinaties van 3 vakjes
    for (let poging = 0; poging < 100; poging++) {
      // Shuffle de vakjes en neem de eerste 3
      const geshuffeld = VAKJES.slice();
      for (let i = geshuffeld.length - 1; i > 0; i--) {
        const j = randInt(0, i);
        [geshuffeld[i], geshuffeld[j]] = [geshuffeld[j], geshuffeld[i]];
      }

      const gegeven = {};
      for (let i = 0; i < 3; i++) gegeven[geshuffeld[i]] = true;

      if (isOplosbaar(gegeven)) {
        return gegeven;
      }
    }

    // Fallback: a, b, c (3 hoeken — altijd oplosbaar, "zoek de som")
    return { a: true, b: true, c: true };
  }

  // ── Publieke API: KLASSIEKE driehoek ───────────────────────────────────
  function genereerKlassiek(settings) {
    const waarden = genereerWaarden(settings.niveau, settings.brug);
    const gegeven = bepaalGegeven();
    return { type: 'klassiek', waarden, gegeven };
  }

  // ── Publieke API: MAGISCHE driehoek ────────────────────────────────────
  // 6 cirkels: 3 op hoekpunten (H1, H2, H3), 3 op middens van zijden (M12, M13, M23).
  // Leerling moet de cijfers zo plaatsen dat alle 3 zijden dezelfde som hebben.
  //
  // Constructie-aanpak (wiskundig):
  //   Kies 3 hoeken (H1, H2, H3) + magische som S.
  //   Dan M12 = S - H1 - H2, M13 = S - H1 - H3, M23 = S - H2 - H3.
  //   Voorwaarden: alle 6 cijfers > 0 én onderling verschillend, allemaal <= max.
  function genereerMagisch(settings) {
    const max = settings.magischMax || 20;
    // Een redelijke bovengrens voor de magische som
    const maxSom = Math.min(3 * max, max + 2 * Math.floor(max * 0.7));

    // Probeer max 500 keer een geldige H1, H2, H3 + S te vinden
    for (let poging = 0; poging < 500; poging++) {
      // Kies 3 willekeurige hoeken (verschillend) uit [1, max]
      const H1 = randInt(1, max);
      let H2 = randInt(1, max);
      while (H2 === H1) H2 = randInt(1, max);
      let H3 = randInt(1, max);
      while (H3 === H1 || H3 === H2) H3 = randInt(1, max);

      // Magische som: moet groter zijn dan elke som van 2 hoeken (anders M's negatief)
      // En klein genoeg dat M's <= max blijven.
      const minS = Math.max(H1 + H2, H1 + H3, H2 + H3) + 1;
      const maxS = Math.min(H1 + H2 + max, H1 + H3 + max, H2 + H3 + max, maxSom);

      if (minS > maxS) continue;

      const S = randInt(minS, maxS);
      const M12 = S - H1 - H2;
      const M13 = S - H1 - H3;
      const M23 = S - H2 - H3;

      // Voorwaarden checken
      if (M12 < 1 || M13 < 1 || M23 < 1) continue;
      if (M12 > max || M13 > max || M23 > max) continue;
      // Alle 6 cijfers moeten verschillend zijn
      const set = new Set([H1, H2, H3, M12, M13, M23]);
      if (set.size !== 6) continue;

      const cijferreeks = [H1, H2, H3, M12, M13, M23].sort((a, b) => a - b);
      return {
        type: 'magisch',
        cijferreeks,
        oplossing: { H1, H2, H3, M12, M13, M23, magischeSom: S },
        magischeSom: S
      };
    }

    // Fallback: klassieke 4-9 reeks
    const fallback = [4, 5, 6, 7, 8, 9];
    const oplossingen = vindMagischeOplossingen(fallback);
    const oplossing = oplossingen[randInt(0, oplossingen.length - 1)];
    return {
      type: 'magisch',
      cijferreeks: fallback,
      oplossing,
      magischeSom: oplossing.magischeSom
    };
  }

  // Helper voor fallback: vind magische oplossingen door alle permutaties
  function vindMagischeOplossingen(cijferreeks) {
    function permutaties(arr) {
      if (arr.length <= 1) return [arr];
      const result = [];
      for (let i = 0; i < arr.length; i++) {
        const rest = arr.slice(0, i).concat(arr.slice(i + 1));
        for (const perm of permutaties(rest)) {
          result.push([arr[i], ...perm]);
        }
      }
      return result;
    }
    const oplossingen = [];
    for (const perm of permutaties(cijferreeks)) {
      const [H1, H2, H3, M12, M13, M23] = perm;
      const s1 = H1 + M12 + H2;
      const s2 = H1 + M13 + H3;
      const s3 = H2 + M23 + H3;
      if (s1 === s2 && s2 === s3) {
        oplossingen.push({ H1, H2, H3, M12, M13, M23, magischeSom: s1 });
      }
    }
    return oplossingen;
  }

  // ── Hoofd API ──────────────────────────────────────────────────────────
  function genereerDriehoek(settings) {
    if (settings.type === 'magisch') {
      return genereerMagisch(settings);
    }
    return genereerKlassiek(settings);
  }

  function genereerSet(settings) {
    const driehoeken = [];

    if (settings.type === 'mengeling') {
      // Wissel klassiek en magisch af
      for (let i = 0; i < settings.aantal; i++) {
        if (i % 2 === 0) {
          driehoeken.push(genereerKlassiek(settings));
        } else {
          driehoeken.push(genereerMagisch(settings));
        }
      }
    } else {
      for (let i = 0; i < settings.aantal; i++) {
        driehoeken.push(genereerDriehoek(settings));
      }
    }

    return driehoeken;
  }

  return {
    genereerSet,
    genereerDriehoek,
    genereerKlassiek,
    genereerMagisch
  };

})();

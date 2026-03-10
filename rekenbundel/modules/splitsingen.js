/* ══════════════════════════════════════════════════════════════
   modules/splitsingen.js
   Oefenvormen:
     klein-splitshuis : huisje, dak = totaal, 2 kamers
     splitsbeen       : omgekeerde V, totaal bovenaan, 2 vakjes onderaan
   Niveaus: tot 5, 10, 20, 100 — of specifieke getallen
   ══════════════════════════════════════════════════════════════ */

const Splitsingen = (() => {

  function getTypes() {
    return ['Klein splitshuis', 'Splitsbeen'];
  }

  function _splits(n) {
    const paren = [];
    for (let a = 1; a < n; a++) paren.push([a, n - a]);
    return paren;
  }

  function _getallen(niveau) {
    if (niveau <= 5)  return [3, 4, 5];
    if (niveau <= 10) return [3, 4, 5, 6, 7, 8, 9, 10];
    if (niveau <= 20) return [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    return [10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 100];
  }

  function _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ─────────────────────────────────────────────────────────
     GENEREER
     splitsVariant:
       'afwisselend' → links of rechts leeg (totaal bovenaan gegeven)
       'dak-leeg'    → beide kamers/benen gegeven, totaal leeg
       'gemengd'     → mix van beide
     oefeningstypes: ['Klein splitshuis'] en/of ['Splitsbeen']
  ───────────────────────────────────────────────────────── */
  function genereer({ oefeningstypes, aantalOefeningen, niveau, splitsVariant = 'afwisselend', splitsGetallen = null, splitsModus = 'tot' }) {
    const pool = (splitsModus === 'specifiek' && splitsGetallen?.length > 0)
      ? splitsGetallen
      : _getallen(niveau);

    const wilHuis = (oefeningstypes || []).some(t => t.toLowerCase().includes('huis'));
    const wilBeen = (oefeningstypes || []).some(t => t.toLowerCase().includes('been'));

    const oef      = [];
    const gebruikt = new Set();
    const kandidaten = [];

    for (const n of _shuffle(pool)) {
      const paren = _splits(n);
      for (const [a, b] of _shuffle(paren)) {
        if (wilHuis) {
          if (splitsVariant === 'afwisselend' || splitsVariant === 'gemengd') {
            kandidaten.push({ vorm: 'huis', totaal: n,    links: null, rechts: b,    leeg: 'links'  });
            kandidaten.push({ vorm: 'huis', totaal: n,    links: a,    rechts: null,  leeg: 'rechts' });
          }
          if (splitsVariant === 'dak-leeg' || splitsVariant === 'gemengd') {
            kandidaten.push({ vorm: 'huis', totaal: null, links: a,    rechts: b,    leeg: 'dak'    });
          }
        }
        if (wilBeen) {
          if (splitsVariant === 'afwisselend' || splitsVariant === 'gemengd') {
            kandidaten.push({ vorm: 'been', totaal: n,    links: null, rechts: b,    leeg: 'links'  });
            kandidaten.push({ vorm: 'been', totaal: n,    links: a,    rechts: null,  leeg: 'rechts' });
          }
          if (splitsVariant === 'dak-leeg' || splitsVariant === 'gemengd') {
            kandidaten.push({ vorm: 'been', totaal: null, links: a,    rechts: b,    leeg: 'top'    });
          }
        }
      }
    }

    // Wissel vormen af als beide actief
    const vormen = [];
    if (wilHuis) vormen.push('huis');
    if (wilBeen) vormen.push('been');

    // Splits kandidaten per vorm en wissel af
    const perVorm = {};
    vormen.forEach(v => perVorm[v] = _shuffle(kandidaten.filter(k => k.vorm === v)));
    const gebrPerVorm = {};
    vormen.forEach(v => gebrPerVorm[v] = new Set());

    let idx = 0;
    let pogingen = 0;
    while (oef.length < aantalOefeningen && pogingen < aantalOefeningen * 8) {
      pogingen++;
      const vorm = vormen[idx % vormen.length];
      const pool2 = perVorm[vorm];
      const gebr  = gebrPerVorm[vorm];
      const k = pool2.find(k => !gebr.has(`${k.totaal}-${k.links}-${k.rechts}-${k.leeg}`));
      if (k) {
        const sleutel = `${k.vorm}-${k.totaal}-${k.links}-${k.rechts}-${k.leeg}`;
        if (!gebruikt.has(sleutel)) {
          gebruikt.add(sleutel);
          gebr.add(`${k.totaal}-${k.links}-${k.rechts}-${k.leeg}`);
          oef.push({
            type:   k.vorm === 'huis' ? 'klein-splitshuis' : 'splitsbeen',
            totaal: k.totaal,
            links:  k.links,
            rechts: k.rechts,
            leeg:   k.leeg,
            sleutel,
            vraag:  k.vorm,
          });
        }
      }
      idx++;
    }

    return oef;
  }

  return { genereer, getTypes };
})();

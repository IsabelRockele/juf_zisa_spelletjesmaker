/* ══════════════════════════════════════════════════════════════
   modules/splitsingen.js
   Verantwoordelijkheid: splitsingen genereren

   OEFENVORMEN (fase 1):
     klein-splitshuis : één huisje, dak = totaal, 2 kamers
                        leeg-links   → rechts gegeven, links invullen
                        leeg-rechts  → links gegeven, rechts invullen
                        leeg-dak     → beide gegeven, totaal invullen
   Niveaus: tot 5, 10, 20, 100
   ══════════════════════════════════════════════════════════════ */

const Splitsingen = (() => {

  /* ── Types die in de UI verschijnen ──────────────────────── */
  function getTypes() {
    return ['Klein splitshuis'];
  }

  /* ── Alle splitsingen van n (a >= 1, b >= 1) ──────────────── */
  function _splits(n) {
    const paren = [];
    for (let a = 1; a < n; a++) {
      paren.push([a, n - a]);
    }
    return paren;
  }

  /* ── Beschikbare getallen per niveau ─────────────────────── */
  function _getallen(niveau) {
    if (niveau <= 5)   return [3, 4, 5];
    if (niveau <= 10)  return [3, 4, 5, 6, 7, 8, 9, 10];
    if (niveau <= 20)  return [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
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
       'afwisselend'  → links en rechts afwisselend leeg (dak altijd gegeven)
       'dak-leeg'     → dak soms leeg (beide kamers gegeven, kind vult totaal in)
       'gemengd'      → mix van afwisselend én dak-leeg
  ───────────────────────────────────────────────────────── */
  function genereer({ oefeningstypes, aantalOefeningen, niveau, splitsVariant = 'afwisselend', splitsGetallen = null, splitsModus = 'tot' }) {
    const pool = (splitsModus === 'specifiek' && splitsGetallen?.length > 0)
      ? splitsGetallen
      : _getallen(niveau);
    const oef      = [];
    const gebruikt = new Set();

    // Bouw pool van alle mogelijke oefeningen
    const kandidaten = [];

    for (const n of _shuffle(pool)) {
      const paren = _splits(n);
      for (const [a, b] of _shuffle(paren)) {
        if (splitsVariant === 'afwisselend' || splitsVariant === 'gemengd') {
          kandidaten.push({ totaal: n, links: null, rechts: b, leeg: 'links' });
          kandidaten.push({ totaal: n, links: a, rechts: null, leeg: 'rechts' });
        }
        if (splitsVariant === 'dak-leeg' || splitsVariant === 'gemengd') {
          kandidaten.push({ totaal: null, links: a, rechts: b, leeg: 'dak' });
        }
      }
    }

    const geschud = _shuffle(kandidaten);
    for (const k of geschud) {
      if (oef.length >= aantalOefeningen) break;
      const sleutel = `${k.totaal}-${k.links}-${k.rechts}-${k.leeg}`;
      if (gebruikt.has(sleutel)) continue;
      gebruikt.add(sleutel);

      oef.push({
        type:   'klein-splitshuis',
        totaal: k.totaal,   // null = kind vult in
        links:  k.links,    // null = kind vult in
        rechts: k.rechts,   // null = kind vult in
        leeg:   k.leeg,     // 'links' | 'rechts' | 'dak'
        sleutel,
        vraag:  `splitshuis`,
      });
    }

    return oef;
  }

  return { genereer, getTypes };
})();

/* ══════════════════════════════════════════════════════════════
   modules/tafels-getallenlijn.js
   Verantwoordelijkheid: oefeningen genereren voor getallenlijn
   Varianten:
     'getekend'        → boogjes boven lijn, kind vult tekst + formules in
     'zelf'            → lege getallenlijn, kind tekent zelf + ___ × ___ = ___
     'delen-getekend'  → boogjes onder lijn (rechts→links), deelzinnen
     'delen-zelf'      → lege lijn, kind tekent zelf + aftrekrij + deelsom
   ══════════════════════════════════════════════════════════════ */

const TafelsGetallenlijn = (() => {

  function genereer({ modus = 'per-tafel', tafel = 2, tafels = null, maxUitkomst = 20,
                       tafelMax = 5, aantalOefeningen = 4, variant = 'getekend', positie = 'vooraan' }) {
    const tafelsLijst = tafels ? (Array.isArray(tafels) ? tafels : [tafels]) : [tafel];
    const pool = [];

    if (modus === 'per-tafel') {
  for (const t of tafelsLijst) {
    const maxGroepen = Math.min(tafelMax, 10, Math.floor(maxUitkomst / t));
    for (let m = 1; m <= maxGroepen; m++) {
      pool.push({ groepen: m, stap: t });
    }
  }
} else {
      for (let a = 1; a <= maxUitkomst; a++) {
        for (let b = 2; b <= maxUitkomst; b++) {
          if (a * b <= maxUitkomst && a >= 1 && b >= 2) {
            pool.push({ groepen: a, stap: b });
          }
        }
      }
    }

    if (pool.length === 0) return [];

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool.slice(0, aantalOefeningen).map((p, i) => ({
      groepen:  p.groepen,
      stap:     p.stap,
      uitkomst: p.groepen * p.stap,
      variant,
      positie,
      sleutel:  `gl-${variant}-${p.groepen}-${p.stap}-${i}`,
    }));
  }

  return { genereer };
})();

/* ══════════════════════════════════════════════════════════════
   modules/tafels.js
   Verantwoordelijkheid: tafeloefeningen genereren
   Types:
     'Vermenigvuldigen'   → a × b = ___
     'Gedeeld door'       → a ÷ b = ___
     'Ontbrekende factor' → ___ × b = c  of  a × ___ = c
     'Gemengd'            → mix van alle drie
   ══════════════════════════════════════════════════════════════ */

const Tafels = (() => {

  /* ── Types ───────────────────────────────────────────────── */
  function getTypes() {
    return ['Vermenigvuldigen', 'Gedeeld door', 'Ontbrekende factor', 'Gemengd'];
  }

  /* ── Genereer oefeningen ─────────────────────────────────── */
  function genereer({ tafels = [2], oefeningstypes = ['Vermenigvuldigen'], aantalOefeningen = 12, tafelPositie = 'vooraan', tafelMax = 10 }) {
    if (!tafels || tafels.length === 0) return [];

    // Bouw pool van kandidaten
    const isGemengd = oefeningstypes.includes('Gemengd');
    const wilVerm   = isGemengd || oefeningstypes.includes('Vermenigvuldigen');
    const wilDeel   = isGemengd || oefeningstypes.includes('Gedeeld door');
    const wilFactor = isGemengd || oefeningstypes.includes('Ontbrekende factor');

    const pool = [];

    for (const tafel of tafels) {
      for (let multiplier = 1; multiplier <= tafelMax; multiplier++) {
        const product = tafel * multiplier;

        // Bepaal welke volgorden we genereren
        // tafelPositie: 'vooraan' → tafel × multiplier
        //               'achteraan' → multiplier × tafel
        //               'beide' → beide richtingen
        const voegVooraan  = tafelPositie === 'vooraan'  || tafelPositie === 'beide';
        const voegAchteraan = tafelPositie === 'achteraan' || tafelPositie === 'beide';

        if (wilVerm) {
          if (voegVooraan) {
            pool.push({ type: 'vermenigvuldigen', a: tafel, b: multiplier, antwoord: product,
              sleutel: `v-${tafel}-${multiplier}` });
          }
          if (voegAchteraan && tafel !== multiplier) {
            pool.push({ type: 'vermenigvuldigen', a: multiplier, b: tafel, antwoord: product,
              sleutel: `v-${multiplier}-${tafel}` });
          }
        }
        if (wilDeel && product > 0) {
          // Bij deelsom: tafelPositie bepaalt de deler
          // vooraan: product : tafel = multiplier  (tafel is deler → staat 'op positie 2')
          // achteraan: product : multiplier = tafel (multiplier is deler)
          // beide: allebei
          if (voegVooraan) {
            pool.push({ type: 'gedeeld', a: product, b: tafel, antwoord: multiplier,
              sleutel: `d-${product}-${tafel}` });
          }
          if (voegAchteraan && tafel !== multiplier) {
            pool.push({ type: 'gedeeld', a: product, b: multiplier, antwoord: tafel,
              sleutel: `d-${product}-${multiplier}` });
          }
        }
        if (wilFactor) {
          // ___ × b = product  of  a × ___ = product, afhankelijk van positie
          if (voegVooraan) {
            pool.push({ type: 'ontbrekende-factor', positie: 'links', a: null, b: multiplier, antwoord: tafel,
              product, sleutel: `f-l-${tafel}-${multiplier}` });
          }
          if (voegAchteraan && tafel !== multiplier) {
            pool.push({ type: 'ontbrekende-factor', positie: 'rechts', a: multiplier, b: null, antwoord: tafel,
              product, sleutel: `f-r-${multiplier}-${tafel}` });
          }
        }
      }
    }

    if (pool.length === 0) return [];

    // Meng en kies zonder herhaling
    const gemengd = _shuffle(pool);
    const gekozen = [];
    const gebruikt = new Set();
    for (const oef of gemengd) {
      if (gebruikt.has(oef.sleutel)) continue;
      gebruikt.add(oef.sleutel);
      gekozen.push(oef);
      if (gekozen.length >= aantalOefeningen) break;
    }

    return gekozen;
  }

  function _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  return { genereer, getTypes };
})();

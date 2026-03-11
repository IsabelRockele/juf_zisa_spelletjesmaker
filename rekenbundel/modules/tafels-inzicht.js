/* ══════════════════════════════════════════════════════════════
   modules/tafels-inzicht.js
   Verantwoordelijkheid: inzicht-oefeningen voor vermenigvuldigen
   - Groepjes met emoji's → herhaalde optelling → vermenigvuldiging
   - Modus 'per-tafel': tafel van X, t/m ×10
   - Modus 'tot-uitkomst': alle combinaties met uitkomst ≤ N
   ══════════════════════════════════════════════════════════════ */

const TafelsInzicht = (() => {

  /* ── Emoji-categorieën ───────────────────────────────────── */
  const EMOJI_SETS = {
    'auto':       { emoji: '🚗', label: "auto's" },
    'ster':       { emoji: '⭐', label: 'sterren' },
    'bloem':      { emoji: '🌸', label: 'bloemen' },
    'bal':        { emoji: '🏀', label: 'ballen' },
    'vis':        { emoji: '🐟', label: 'vissen' },
    'hart':       { emoji: '❤️', label: 'hartjes' },
    'appel':      { emoji: '🍎', label: 'appels' },
    'vlinder':    { emoji: '🦋', label: 'vlinders' },
    'ijs':        { emoji: '🍦', label: 'ijsjes' },
    'huis':       { emoji: '🏠', label: 'huizen' },
    'boom':       { emoji: '🌳', label: 'bomen' },
    'maan':       { emoji: '🌙', label: 'maantjes' },
  };

  const EMOJI_KEYS = Object.keys(EMOJI_SETS);

  /* ── Genereer oefeningen ─────────────────────────────────── */
  function genereer({ modus = 'per-tafel', tafel = 2, tafels = null, maxUitkomst = 12, tafelMax = 10, aantalOefeningen = 4, emojiSet = 'afwisselend' }) {
    // tafels (array) heeft voorrang op tafel (enkelvoud)
    const tafelsLijst = tafels ? (Array.isArray(tafels) ? tafels : [tafels]) : [tafel];

    const pool = [];

    if (modus === 'per-tafel') {
      for (const t of tafelsLijst) {
        for (let m = 1; m <= Math.min(tafelMax, 7); m++) {
          pool.push({ groepen: m, groepGrootte: t });
        }
      }
    } else {
      // Alle combinaties a×b waarbij uitkomst ≤ maxUitkomst, a≥2, b≥2, max 7 groepen
      for (let a = 2; a <= Math.min(maxUitkomst, 7); a++) {
        for (let b = 2; b <= maxUitkomst; b++) {
          if (a * b <= maxUitkomst) {
            pool.push({ groepen: a, groepGrootte: b });
          }
        }
      }
    }

    if (pool.length === 0) return [];

    // Shuffle
    const gemengd = _shuffle(pool);
    const gekozen = gemengd.slice(0, aantalOefeningen);

    // Voeg emoji toe
    return gekozen.map((oef, i) => {
      const key = emojiSet === 'afwisselend'
        ? EMOJI_KEYS[i % EMOJI_KEYS.length]
        : (EMOJI_SETS[emojiSet] ? emojiSet : EMOJI_KEYS[0]);
      const set = EMOJI_SETS[key];
      return {
        type: 'groepjes',
        groepen: oef.groepen,
        groepGrootte: oef.groepGrootte,
        uitkomst: oef.groepen * oef.groepGrootte,
        emoji: set.emoji,
        emojiLabel: set.label,
        sleutel: `gi-${oef.groepen}-${oef.groepGrootte}-${key}`,
      };
    });
  }

  function _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function getEmojiSets() {
    return EMOJI_SETS;
  }

  return { genereer, getEmojiSets };
})();

/* ==========================================================
   afleiders.js
   
   Genereert 2 foute spellingvarianten ("afleiders") bij een woord.
   Strategie hangt af van de categorie waar het woord uit komt.
   
   Gebruik:
     SpellingAfleiders.maakAfleiders(woordObj, categorieId) → ["afleider1", "afleider2"]
   
   Bij elk woord in de bibliotheek kan je optioneel handmatig afleiders
   meegeven via { tekst: "kip", afleiders: ["kep", "kib"] }. Als die
   aanwezig zijn, gebruiken we die in plaats van de automatische.
   ========================================================== */

window.SpellingAfleiders = {

  /* === Hoofdfunctie === */
  maakAfleiders: function(woordObj, categorieId) {
    if (woordObj.afleiders && Array.isArray(woordObj.afleiders) && woordObj.afleiders.length >= 2) {
      return [woordObj.afleiders[0], woordObj.afleiders[1]];
    }

    const woord = (typeof woordObj === "string") ? woordObj : woordObj.tekst;
    if (!woord) return ["?", "?"];

    const groep = this._categorieGroep(categorieId);

    let varianten = [];
    if (groep === "korte-klanken") {
      varianten = this._mkmAfleiders(woord);
    } else if (groep === "tweeklanken") {
      varianten = this._tweeklankAfleiders(woord);
    } else if (groep === "lange-klanken") {
      varianten = this._langeKlankAfleiders(woord);
    } else if (groep === "verdubbel-verenkel") {
      varianten = this._verdubbelVerenkelAfleiders(woord);
    } else if (groep === "ng-nk") {
      varianten = this._ngNkAfleiders(woord);
    } else {
      varianten = this._algemeneAfleiders(woord);
    }

    varianten = varianten.filter(v => v && v !== woord);
    const uniek = [...new Set(varianten)];

    while (uniek.length < 2) {
      const extra = this._algemeneAfleiders(woord);
      let toegevoegd = false;
      for (const e of extra) {
        if (e && e !== woord && !uniek.includes(e)) {
          uniek.push(e);
          toegevoegd = true;
          if (uniek.length >= 2) break;
        }
      }
      if (!toegevoegd) break;
    }

    while (uniek.length < 2) uniek.push(woord + "x");
    return uniek.slice(0, 2);
  },

  _categorieGroep: function(categorieId) {
    if (!categorieId) return "algemeen";
    const wb = window.SpellingWoordenbibliotheek;
    if (!wb) return "algemeen";
    for (const graad of [1, 2, 3]) {
      const data = wb[`graad${graad}`];
      if (data && data[categorieId]) {
        return data[categorieId].groep || "algemeen";
      }
    }
    return "algemeen";
  },

  /* MKM-woorden (kip, bal, mat) */
  _mkmAfleiders: function(woord) {
    const klinkers = ['a', 'e', 'i', 'o', 'u'];
    const eindSwaps = {
      'p': 'b', 'b': 'p',
      't': 'd', 'd': 't',
      'k': 'g', 's': 'z', 'z': 's',
      'f': 'v', 'v': 'f'
    };
    const resultaat = [];

    const klinkerIdx = this._vindEnkeleKlinkerIdx(woord);
    if (klinkerIdx >= 0) {
      const huidige = woord[klinkerIdx];
      const anderen = klinkers.filter(k => k !== huidige);
      const random = anderen[Math.floor(Math.random() * anderen.length)];
      resultaat.push(woord.substring(0, klinkerIdx) + random + woord.substring(klinkerIdx + 1));
    }

    const laatste = woord[woord.length - 1];
    if (eindSwaps[laatste]) {
      resultaat.push(woord.substring(0, woord.length - 1) + eindSwaps[laatste]);
    } else if (klinkerIdx >= 0 && resultaat.length < 2) {
      // Tweede klinkerwissel
      const huidige = woord[klinkerIdx];
      const anderen = klinkers.filter(k => k !== huidige && !resultaat.some(r => r.includes(k + woord.substring(klinkerIdx + 1))));
      if (anderen.length > 0) {
        const r2 = anderen[0];
        resultaat.push(woord.substring(0, klinkerIdx) + r2 + woord.substring(klinkerIdx + 1));
      }
    }

    return resultaat;
  },

  /* Tweeklanken (boek, huis, leeuw) */
  _tweeklankAfleiders: function(woord) {
    const verwarringen = {
      'ie': ['ee', 'i'],
      'eu': ['u', 'eo'],
      'ui': ['u', 'ie'],
      'oe': ['o', 'oo'],
      'aai': ['ai', 'aa'],
      'ooi': ['oi', 'oo'],
      'oei': ['oi', 'oe'],
      'eeuw': ['euw', 'eew'],
      'ieuw': ['iuw', 'iew'],
      'au': ['ou', 'a'],
      'ou': ['au', 'o'],
      'ei': ['ij', 'e'],
      'ij': ['ei', 'i']
    };
    const resultaat = [];
    const tweeklanken = ['eeuw', 'ieuw', 'aai', 'ooi', 'oei', 'ie', 'eu', 'ui', 'oe', 'au', 'ou', 'ei', 'ij'];

    let gevonden = null;
    let positie = -1;
    for (const tk of tweeklanken) {
      const idx = woord.indexOf(tk);
      if (idx >= 0) {
        gevonden = tk;
        positie = idx;
        break;
      }
    }

    if (gevonden && verwarringen[gevonden]) {
      for (const optie of verwarringen[gevonden]) {
        const variant = woord.substring(0, positie) + optie + woord.substring(positie + gevonden.length);
        resultaat.push(variant);
        if (resultaat.length >= 2) break;
      }
    }

    return resultaat;
  },

  /* Lange klanken (boom, kaas, vuur) */
  _langeKlankAfleiders: function(woord) {
    const enkelMap = { 'aa': 'a', 'ee': 'e', 'oo': 'o', 'uu': 'u' };
    const anderDubbel = { 'aa': 'oo', 'ee': 'oo', 'oo': 'aa', 'uu': 'oo' };
    const resultaat = [];
    
    for (const dk of ['aa', 'ee', 'oo', 'uu']) {
      const idx = woord.indexOf(dk);
      if (idx >= 0) {
        resultaat.push(woord.substring(0, idx) + enkelMap[dk] + woord.substring(idx + 2));
        resultaat.push(woord.substring(0, idx) + anderDubbel[dk] + woord.substring(idx + 2));
        break;
      }
    }
    return resultaat;
  },

  /* Verdubbelaars + Verenkelaars */
  _verdubbelVerenkelAfleiders: function(woord) {
    const resultaat = [];
    
    const dubbelMed = woord.match(/([bcdfgklmnprstvz])\1/);
    if (dubbelMed) {
      const letter = dubbelMed[1];
      const idx = dubbelMed.index;
      // Strategie 1: één i.p.v. twee (bommen → bomen)
      resultaat.push(woord.substring(0, idx) + letter + woord.substring(idx + 2));
      // Strategie 2: dubbele klinker daarvoor (bommen → boommen)
      if (idx > 0) {
        const klinkerVoor = woord[idx - 1];
        if ('aeiou'.includes(klinkerVoor)) {
          resultaat.push(woord.substring(0, idx) + klinkerVoor + woord.substring(idx));
        }
      }
    }

    if (resultaat.length < 2) {
      // Detecteer dubbele klinker (verenkelaar zoals bomen)
      const dubbelKl = woord.match(/(aa|ee|oo|uu)/);
      if (dubbelKl) {
        const dk = dubbelKl[1];
        const idx = dubbelKl.index;
        const enkelMap = { 'aa': 'a', 'ee': 'e', 'oo': 'o', 'uu': 'u' };
        const naIdx = idx + 2;
        if (naIdx < woord.length) {
          const medErna = woord[naIdx];
          if ('bcdfgklmnprstvz'.includes(medErna)) {
            // Strategie: bomen → bommen (verkeerd verdubbeld)
            resultaat.push(woord.substring(0, idx) + enkelMap[dk] + medErna + medErna + woord.substring(naIdx + 1));
            // Strategie: bomen → boomen (medeklinker erna verdubbeld zonder klinker te enkelen)
            // Dit is een variant met dubbele medeklinker BIJ de dubbele klinker
            if (resultaat.length < 2) {
              resultaat.push(woord.substring(0, naIdx) + medErna + woord.substring(naIdx));
            }
          }
        }
      }
    }

    // Variant voor woorden met "ie" (zoals dieren, bieren) — niet hoofdcategorie maar gebeurt
    if (resultaat.length < 2 && woord.includes('ie')) {
      const idx = woord.indexOf('ie');
      const naIdx = idx + 2;
      if (naIdx < woord.length) {
        const medErna = woord[naIdx];
        if ('bcdfgklmnprstvz'.includes(medErna)) {
          // dieren → diren (zonder e)
          resultaat.push(woord.substring(0, idx) + 'i' + woord.substring(naIdx));
        }
      }
    }

    return resultaat;
  },

  /* ng/nk */
  _ngNkAfleiders: function(woord) {
    const resultaat = [];
    if (woord.includes('ng')) {
      resultaat.push(woord.replace('ng', 'nk'));
      resultaat.push(woord.replace('ng', 'n'));
    } else if (woord.includes('nk')) {
      // Veelvoorkomende graad-1 fout: kinderen schrijven 'ngk' i.p.v. 'nk'
      resultaat.push(woord.replace('nk', 'ngk'));
      // Tweede typische fout: ng i.p.v. nk
      resultaat.push(woord.replace('nk', 'ng'));
    }
    return resultaat;
  },

  /* Algemene fallback */
  _algemeneAfleiders: function(woord) {
    const resultaat = [];
    const klinkers = ['a', 'e', 'i', 'o', 'u'];
    
    const klinkerIdx = this._vindEnkeleKlinkerIdx(woord);
    if (klinkerIdx >= 0) {
      const huidige = woord[klinkerIdx];
      const anderen = klinkers.filter(k => k !== huidige);
      // Twee verschillende klinker-swaps
      if (anderen.length >= 2) {
        resultaat.push(woord.substring(0, klinkerIdx) + anderen[0] + woord.substring(klinkerIdx + 1));
        resultaat.push(woord.substring(0, klinkerIdx) + anderen[1] + woord.substring(klinkerIdx + 1));
      } else {
        resultaat.push(woord.substring(0, klinkerIdx) + anderen[0] + woord.substring(klinkerIdx + 1));
      }
    }

    if (resultaat.length < 2 && woord.length >= 3) {
      resultaat.push(woord + woord[woord.length - 1]);
    }
    return resultaat;
  },

  _vindEnkeleKlinkerIdx: function(woord) {
    const klinkers = ['a', 'e', 'i', 'o', 'u'];
    for (let i = 0; i < woord.length; i++) {
      if (klinkers.includes(woord[i])) {
        const next = woord[i + 1];
        if (next && klinkers.includes(next)) continue;
        return i;
      }
    }
    return -1;
  },

  /* Schik 3 woorden (juist + 2 afleiders) in willekeurige volgorde.
     Optionele random-functie zodat de OV01-module de seed kan controleren. */
  schikWillekeurig: function(juistWoord, afleiders, randomFn) {
    const random = randomFn || Math.random;
    const arr = [juistWoord, afleiders[0], afleiders[1]];
    // Fisher-Yates shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
};
/* ==========================================================
   afleiders.js
   
   Genereert pedagogisch zinvolle FOUTSCHRIJF-VARIANTEN voor woorden
   waarbij kinderen vaak twijfelen over de spelling. Gebruikt door
   OV01 (basis-niveau met tweeklanken) en OV05 (klank kiezen).
   
   Per klank-categorie zijn er courante fout-schrijfwijzen die op
   het juiste woord lijken. Het kind moet uit de set kiezen welke
   de juiste is.
   
   API:
     SpellingAfleiders.voorWoord(woord, categorie, aantal) 
       → [juist, fout1, fout2, ...] in willekeurige volgorde
     
     SpellingAfleiders.heeftAfleiders(categorie)
       → true als deze categorie pedagogisch zinvolle afleiders heeft
   ========================================================== */

window.SpellingAfleiders = (function() {

  /* Per categorie: een functie die uit het juiste woord een lijst van
     courante fout-varianten genereert. */
  const REGELS = {
    /* === KORTE KLANKEN (mkm) ===
       Klassieke fouten:
       - verdubbelen (kat → kaat) — verwarring met lange klank
       - andere korte klinker (kat → kot) */
    "mkm-a": (woord) => [
      woord.replace(/a/i, "aa"),  // verdubbeld
      woord.replace(/a/i, "o")    // andere korte klinker
    ],
    "mkm-e": (woord) => [
      woord.replace(/e/i, "ee"),
      woord.replace(/e/i, "i")
    ],
    "mkm-i": (woord) => [
      woord.replace(/i/i, "ie"),
      woord.replace(/i/i, "o")
    ],
    "mkm-o": (woord) => [
      woord.replace(/o/i, "oo"),
      woord.replace(/o/i, "a")
    ],
    "mkm-u": (woord) => [
      woord.replace(/u/i, "uu"),
      woord.replace(/u/i, "a")
    ],
    /* mk-km is een gemengde groep — neem eerste klinker en pas regel toe */
    "mk-km": (woord) => {
      const klinker = woord.match(/[aeiou]/i)?.[0]?.toLowerCase();
      if (!klinker) return [];
      const verdubbel = woord.replace(new RegExp(klinker, "i"), klinker + klinker);
      const ANDER = { a: "o", e: "i", i: "o", o: "a", u: "a" };
      const ander = woord.replace(new RegExp(klinker, "i"), ANDER[klinker] || klinker);
      return [verdubbel, ander];
    },

    /* === LANGE KLANKEN (lk) ===
       Klassieke fouten:
       - verkorten (maan → man) — verwarring met korte klank
       - andere lange klinker (maan → meen of moon) */
    "lk-aa": (woord) => [
      woord.replace(/aa/i, "a"),    // verkort
      woord.replace(/aa/i, "oo")    // andere lange klinker
    ],
    "lk-ee": (woord) => [
      woord.replace(/ee/i, "e"),
      woord.replace(/ee/i, "ie")
    ],
    "lk-oo": (woord) => [
      woord.replace(/oo/i, "o"),
      woord.replace(/oo/i, "aa")
    ],
    "lk-uu": (woord) => [
      woord.replace(/uu/i, "u"),
      woord.replace(/uu/i, "oe")
    ],

    /* === TWEEKLANKEN === */
    /* eu, ui, oe, ie: klassieke verwarringen onder elkaar */
    "tw-eu": (woord) => [
      woord.replace(/eu/i, "oe"),   // neus → noes
      woord.replace(/eu/i, "ui")    // neus → nuis
    ],
    "tw-ui": (woord) => [
      woord.replace(/ui/i, "eu"),   // huis → heus
      woord.replace(/ui/i, "oe")    // huis → hoes
    ],
    "tw-oe": (woord) => [
      woord.replace(/oe/i, "ui"),   // boek → buik
      woord.replace(/oe/i, "eu")    // boek → beuk
    ],
    "tw-ie": (woord) => [
      woord.replace(/ie/i, "i"),    // fiets → fits
      woord.replace(/ie/i, "ei")    // fiets → feits
    ],
    "tw-ei": (woord) => {
      // ei → ij, ie
      return [
        woord.replace(/ei/i, "ij"),
        woord.replace(/ei/i, "ie")
      ];
    },
    "tw-ij": (woord) => {
      // ij → ei, ie
      return [
        woord.replace(/ij/i, "ei"),
        woord.replace(/ij/i, "ie")
      ];
    },
    "tw-au": (woord) => {
      // au → ou (klassieke verwarring), en au → aw (klanknotering)
      // Maar als woord op 'auw' eindigt: 'paw' is courantere fout dan 'aww'
      const opties = [];
      opties.push(woord.replace(/au/i, "ou"));
      if (/auw/i.test(woord)) {
        // pauw → paw (vereenvoudigd)
        opties.push(woord.replace(/auw/i, "aw"));
      } else {
        // gauw → gow, blauw → blow etc. — gewoon au → ow
        opties.push(woord.replace(/au/i, "ow"));
      }
      return opties;
    },
    "tw-ou": (woord) => {
      // ou → au, en ou → ow (klanknotering)
      const opties = [];
      opties.push(woord.replace(/ou/i, "au"));
      if (/ouw/i.test(woord)) {
        // mouw → mow (vereenvoudigd)
        opties.push(woord.replace(/ouw/i, "ow"));
      } else {
        // hout → haut (al boven), of hout → howt
        opties.push(woord.replace(/ou/i, "ow"));
      }
      return opties;
    },
    "tw-aai": (woord) => {
      // aai → aj, aaj, ai (kies willekeurig 2)
      const opties = [
        woord.replace(/aai/i, "aj"),
        woord.replace(/aai/i, "aaj"),
        woord.replace(/aai/i, "ai")
      ];
      return _kies2(opties);
    },
    "tw-ooi": (woord) => {
      // ooi → oj, ooj, oi
      const opties = [
        woord.replace(/ooi/i, "oj"),
        woord.replace(/ooi/i, "ooj"),
        woord.replace(/ooi/i, "oi")
      ];
      return _kies2(opties);
    },
    "tw-oei": (woord) => {
      // oei → oej, ooi, uj
      const opties = [
        woord.replace(/oei/i, "oej"),
        woord.replace(/oei/i, "ooi"),
        woord.replace(/oei/i, "uj")
      ];
      return _kies2(opties);
    },
    "tw-eeuw": (woord) => {
      // eeuw → euw, eew
      return [
        woord.replace(/eeuw/i, "euw"),
        woord.replace(/eeuw/i, "eew")
      ];
    },
    "tw-ieuw": (woord) => {
      // ieuw → iuw, iew
      return [
        woord.replace(/ieuw/i, "iuw"),
        woord.replace(/ieuw/i, "iew")
      ];
    },
    /* Verlengingsregel: vervang d-eind met t (en omgekeerd), of b met p. 
       Werkt op de KALE eind-letter. */
    "verlengingsregel": (woord) => {
      // Bepaal eindletter (laatste alfabetische letter)
      const match = woord.match(/([a-z])(\W*)$/i);
      if (!match) return [];
      const eindletter = match[1].toLowerCase();
      const FLIP = { d: "t", t: "d", b: "p", p: "b" };
      const flipped = FLIP[eindletter];
      if (!flipped) return [];
      // Vervang alleen de laatste alfabetische letter
      const idx = woord.lastIndexOf(match[1]);
      const fout = woord.slice(0, idx) + flipped + woord.slice(idx + 1);
      return [fout];  // Slechts 1 zinvolle afleider (b↔p of d↔t)
    }
  };

  function _kies2(opties) {
    const k = [...opties];
    // willekeurig 2 selecteren
    if (k.length <= 2) return k;
    k.sort(() => Math.random() - 0.5);
    return k.slice(0, 2);
  }

  /* PUBLIEK */
  return {
    /* Returns: [juist, fout1, fout2, ...] in willekeurige volgorde.
       
       Parameters:
         woord       — string, de juiste schrijfwijze
         categorie   — categorie-id van het woord
         aantal      — gewenst aantal opties totaal (bv. 2 of 3)
                       Standaard 3 voor aai/ooi/oei, 2 voor de rest. */
    voorWoord: function(woord, categorie, aantal) {
      const regel = REGELS[categorie];
      if (!regel) return [woord];  // Geen afleiders voor deze categorie
      
      const fouten = regel(woord).filter(f => f && f !== woord);
      
      // Hoeveel afleiders willen we naast het juiste woord?
      // - tweeklanken (ei, ij, au, ou, aai, ooi, oei, eeuw, ieuw): 2 afleiders → 3 opties
      // - verlengingsregel: 1 afleider → 2 opties (d/t of b/p, geen 3e zinvolle)
      let aantalFouten;
      if (typeof aantal === "number") {
        aantalFouten = aantal - 1;
      } else if (categorie === "verlengingsregel") {
        aantalFouten = 1;
      } else {
        aantalFouten = 2;
      }
      
      const gekozenFouten = fouten.slice(0, aantalFouten);
      
      // Mix juiste + fouten in willekeurige volgorde
      const alle = [woord, ...gekozenFouten];
      alle.sort(() => Math.random() - 0.5);
      return alle;
    },
    
    /* Of een categorie pedagogisch zinvolle afleiders heeft. */
    heeftAfleiders: function(categorie) {
      return !!REGELS[categorie];
    },
    
    /* Lijst van alle ondersteunde categorieën. */
    CATEGORIEEN: Object.keys(REGELS),
    
    /* ============================================================
       LEGACY API — voor backwards compatibility met OV01 (en andere
       modules die de oude afleiders.js gebruikten).
       
       maakAfleiders(woord, categorie) → [fout1, fout2, ...]
         Returns ALLEEN de foute schrijfwijzen (zonder het juiste woord).
       
       schikWillekeurig(juist, afleiders, randomFn) → [opt1, opt2, opt3]
         Mengt juist + afleiders in willekeurige volgorde.
       ============================================================ */
    maakAfleiders: function(woordOfObj, categorie) {
      // Accepteer zowel string als object met .tekst
      const woord = (typeof woordOfObj === "string") ? woordOfObj : woordOfObj.tekst;
      const cat = categorie || (typeof woordOfObj === "object" ? woordOfObj.categorie : null);
      if (!cat) return [];
      
      const regel = REGELS[cat];
      if (!regel) return [];
      
      const fouten = regel(woord).filter(f => f && f !== woord);
      
      // Aantal afleiders:
      // - tweeklanken: 2 (zodat we 3 opties krijgen met het juiste)
      // - verlengingsregel: 1 (2 opties totaal)
      const aantalFouten = (cat === "verlengingsregel") ? 1 : 2;
      return fouten.slice(0, aantalFouten);
    },
    
    schikWillekeurig: function(juist, afleiders, randomFn) {
      const r = randomFn || Math.random;
      const alle = [juist, ...afleiders];
      // Fisher-Yates met meegegeven random
      for (let i = alle.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [alle[i], alle[j]] = [alle[j], alle[i]];
      }
      return alle;
    }
  };
})();
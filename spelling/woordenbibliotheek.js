/* ==========================================================
   woordenbibliotheek.js
   Standaard woordensets per leerjaar.
   
   Structuur:
   - leerjaar: { categorieId: { naam, woorden: [{tekst, lidwoord}] } }
   - tekst = enkel het woord ("meeuw")
   - lidwoord = "de" | "het" | null (geen lidwoord, voor werkwoorden/bijvoeglijke naamwoorden/etc.)
   - Op het werkblad verschijnt: "{lidwoord} {tekst}" (bv. "de meeuw") of enkel "{tekst}" (bv. "fraai")
   ========================================================== */

window.SpellingWoordenbibliotheek = {

  graad1: {

    // ===== TWEEKLANKEN =====
    "tw-ie": {
      naam: "ie",
      groep: "tweeklanken",
      woorden: [
        { tekst: "riet", lidwoord: "het" },
        { tekst: "biet", lidwoord: "de" },
        { tekst: "wiel", lidwoord: "het" },
        { tekst: "fiets", lidwoord: "de" },
        { tekst: "stier", lidwoord: "de" },
        { tekst: "knie", lidwoord: "de" },
        { tekst: "mier", lidwoord: "de" },
        { tekst: "bier", lidwoord: "het" },
        { tekst: "vier", lidwoord: null },     // telwoord
        { tekst: "tien", lidwoord: null },
        { tekst: "lief", lidwoord: null },     // bijv. nw.
        { tekst: "diep", lidwoord: null },
        { tekst: "niet", lidwoord: null },
        { tekst: "zie", lidwoord: null },      // werkwoord (ik zie)
        { tekst: "die", lidwoord: null }
      ]
    },
    "tw-eu": {
      naam: "eu",
      groep: "tweeklanken",
      woorden: [
        { tekst: "neus", lidwoord: "de" },
        { tekst: "deur", lidwoord: "de" },
        { tekst: "kleur", lidwoord: "de" },
        { tekst: "geur", lidwoord: "de" },
        { tekst: "reus", lidwoord: "de" },
        { tekst: "beuk", lidwoord: "de" },
        { tekst: "scheur", lidwoord: "de" },
        { tekst: "leuk", lidwoord: null },
        { tekst: "treur", lidwoord: null },
        { tekst: "kreun", lidwoord: null }
      ]
    },
    "tw-ui": {
      naam: "ui",
      groep: "tweeklanken",
      woorden: [
        { tekst: "huis", lidwoord: "het" },
        { tekst: "muis", lidwoord: "de" },
        { tekst: "tuin", lidwoord: "de" },
        { tekst: "duin", lidwoord: "het" },
        { tekst: "kruis", lidwoord: "het" },
        { tekst: "fluit", lidwoord: "de" },
        { tekst: "buik", lidwoord: "de" },
        { tekst: "duif", lidwoord: "de" },
        { tekst: "ruit", lidwoord: "de" },
        { tekst: "bui", lidwoord: "de" },
        { tekst: "lui", lidwoord: null },
        { tekst: "stuit", lidwoord: null }
      ]
    },
    "tw-oe": {
      naam: "oe",
      groep: "tweeklanken",
      woorden: [
        { tekst: "boek", lidwoord: "het" },
        { tekst: "koek", lidwoord: "de" },
        { tekst: "doek", lidwoord: "de" },
        { tekst: "voet", lidwoord: "de" },
        { tekst: "bloem", lidwoord: "de" },
        { tekst: "stoel", lidwoord: "de" },
        { tekst: "snoep", lidwoord: "het" },
        { tekst: "vloer", lidwoord: "de" },
        { tekst: "schoen", lidwoord: "de" },
        { tekst: "broek", lidwoord: "de" },
        { tekst: "loep", lidwoord: "de" },
        { tekst: "moe", lidwoord: null },
        { tekst: "groen", lidwoord: null }
      ]
    },
    "tw-aai": {
      naam: "aai",
      groep: "tweeklanken",
      woorden: [
        { tekst: "haai", lidwoord: "de" },
        { tekst: "kraai", lidwoord: "de" },
        { tekst: "draai", lidwoord: "de" },
        { tekst: "lawaai", lidwoord: "het" },
        { tekst: "zwaai", lidwoord: "de" },
        { tekst: "saai", lidwoord: null },
        { tekst: "fraai", lidwoord: null },
        { tekst: "naai", lidwoord: null }      // werkwoord
      ]
    },
    "tw-ooi": {
      naam: "ooi",
      groep: "tweeklanken",
      woorden: [
        { tekst: "kooi", lidwoord: "de" },
        { tekst: "tooi", lidwoord: "de" },
        { tekst: "mooi", lidwoord: null },
        { tekst: "rooi", lidwoord: null },
        { tekst: "gooi", lidwoord: null },     // werkwoord
        { tekst: "strooi", lidwoord: null }    // werkwoord
      ]
    },
    "tw-oei": {
      naam: "oei",
      groep: "tweeklanken",
      woorden: [
        { tekst: "boei", lidwoord: "de" },
        { tekst: "groei", lidwoord: "de" },
        { tekst: "bloei", lidwoord: "de" },
        { tekst: "stoei", lidwoord: null },
        { tekst: "loei", lidwoord: null },
        { tekst: "vloei", lidwoord: null }
      ]
    },
    "tw-eeuw": {
      naam: "eeuw",
      groep: "tweeklanken",
      woorden: [
        { tekst: "leeuw", lidwoord: "de" },
        { tekst: "sneeuw", lidwoord: "de" },
        { tekst: "eeuw", lidwoord: "de" },
        { tekst: "spreeuw", lidwoord: "de" },
        { tekst: "meeuw", lidwoord: "de" }
      ]
    },
    "tw-ieuw": {
      naam: "ieuw",
      groep: "tweeklanken",
      woorden: [
        { tekst: "kieuw", lidwoord: "de" },
        { tekst: "nieuw", lidwoord: null },
        { tekst: "opnieuw", lidwoord: null }
      ]
    },

    // ===== ng / nk WOORDEN =====
    "ng-woorden": {
      naam: "-ng woorden",
      groep: "ng-nk",
      woorden: [
        { tekst: "ring", lidwoord: "de" },
        { tekst: "slang", lidwoord: "de" },
        { tekst: "kring", lidwoord: "de" },
        { tekst: "long", lidwoord: "de" },
        { tekst: "tong", lidwoord: "de" },
        { tekst: "wang", lidwoord: "de" },
        { tekst: "ding", lidwoord: "het" },
        { tekst: "sprong", lidwoord: "de" },
        { tekst: "klang", lidwoord: null },
        { tekst: "bang", lidwoord: null },
        { tekst: "zing", lidwoord: null },     // werkwoord
        { tekst: "spring", lidwoord: null },   // werkwoord
        { tekst: "hang", lidwoord: null }      // werkwoord
      ]
    },
    "nk-woorden": {
      naam: "-nk woorden",
      groep: "ng-nk",
      woorden: [
        { tekst: "bank", lidwoord: "de" },
        { tekst: "tank", lidwoord: "de" },
        { tekst: "vink", lidwoord: "de" },
        { tekst: "plank", lidwoord: "de" },
        { tekst: "klank", lidwoord: "de" },
        { tekst: "pink", lidwoord: "de" },
        { tekst: "drink", lidwoord: null },    // werkwoord
        { tekst: "stink", lidwoord: null },    // werkwoord
        { tekst: "schenk", lidwoord: null },   // werkwoord
        { tekst: "denk", lidwoord: null },
        { tekst: "flink", lidwoord: null },
        { tekst: "streng", lidwoord: null }
      ]
    },

    // ===== VERDUBBELAARS =====
    // Klankzuivere woorden waarvan het meervoud verdubbelt: bom → bommen
    "verdubbelaars": {
      naam: "verdubbelaars",
      groep: "verdubbel-verenkel",
      woorden: [
        { tekst: "bommen", lidwoord: "de" },
        { tekst: "kassen", lidwoord: "de" },
        { tekst: "pannen", lidwoord: "de" },
        { tekst: "dassen", lidwoord: "de" },
        { tekst: "ballen", lidwoord: "de" },
        { tekst: "bellen", lidwoord: "de" },
        { tekst: "kippen", lidwoord: "de" },
        { tekst: "rokken", lidwoord: "de" },
        { tekst: "vossen", lidwoord: "de" },
        { tekst: "bussen", lidwoord: "de" },
        { tekst: "muggen", lidwoord: "de" },
        { tekst: "mussen", lidwoord: "de" },
        { tekst: "stippen", lidwoord: "de" },
        { tekst: "petten", lidwoord: "de" }
      ]
    },

    // ===== VERENKELAARS =====
    // Lange klank in meervoud: boom → bomen (één o)
    "verenkelaars": {
      naam: "verenkelaars",
      groep: "verdubbel-verenkel",
      woorden: [
        { tekst: "bomen", lidwoord: "de" },
        { tekst: "kazen", lidwoord: "de" },
        { tekst: "namen", lidwoord: "de" },
        { tekst: "manen", lidwoord: "de" },
        { tekst: "vazen", lidwoord: "de" },
        { tekst: "muren", lidwoord: "de" },
        { tekst: "buren", lidwoord: "de" },
        { tekst: "duren", lidwoord: null },
        { tekst: "uren", lidwoord: "de" },
        { tekst: "huren", lidwoord: null },
        { tekst: "haren", lidwoord: "de" },
        { tekst: "garen", lidwoord: "het" },
        { tekst: "zalen", lidwoord: "de" },
        { tekst: "palen", lidwoord: "de" },
        { tekst: "dieren", lidwoord: "de" },
        { tekst: "schoenen", lidwoord: "de" },
        { tekst: "boeken", lidwoord: "de" }
      ]
    },

    // ===== LANGE KLANKEN =====
    "lk-aa": {
      naam: "aa",
      groep: "lange-klanken",
      woorden: [
        { tekst: "haan", lidwoord: "de" },
        { tekst: "maan", lidwoord: "de" },
        { tekst: "naam", lidwoord: "de" },
        { tekst: "taart", lidwoord: "de" },
        { tekst: "kaas", lidwoord: "de" },
        { tekst: "vaas", lidwoord: "de" },
        { tekst: "paard", lidwoord: "het" },
        { tekst: "baan", lidwoord: "de" },
        { tekst: "schaar", lidwoord: "de" },
        { tekst: "taak", lidwoord: "de" },
        { tekst: "saai", lidwoord: null },
        { tekst: "vaak", lidwoord: null }
      ]
    },
    "lk-ee": {
      naam: "ee",
      groep: "lange-klanken",
      woorden: [
        { tekst: "been", lidwoord: "het" },
        { tekst: "fee", lidwoord: "de" },
        { tekst: "zee", lidwoord: "de" },
        { tekst: "thee", lidwoord: "de" },
        { tekst: "beek", lidwoord: "de" },
        { tekst: "veer", lidwoord: "de" },
        { tekst: "meer", lidwoord: "het" },
        { tekst: "eend", lidwoord: "de" },
        { tekst: "heel", lidwoord: null },
        { tekst: "leeg", lidwoord: null },
        { tekst: "geel", lidwoord: null }
      ]
    },
    "lk-oo": {
      naam: "oo",
      groep: "lange-klanken",
      woorden: [
        { tekst: "boom", lidwoord: "de" },
        { tekst: "doos", lidwoord: "de" },
        { tekst: "boot", lidwoord: "de" },
        { tekst: "kroon", lidwoord: "de" },
        { tekst: "school", lidwoord: "de" },
        { tekst: "zoon", lidwoord: "de" },
        { tekst: "droom", lidwoord: "de" },
        { tekst: "rook", lidwoord: "de" },
        { tekst: "voor", lidwoord: null },
        { tekst: "door", lidwoord: null },
        { tekst: "groot", lidwoord: null },
        { tekst: "rood", lidwoord: null }
      ]
    },
    "lk-uu": {
      naam: "uu",
      groep: "lange-klanken",
      woorden: [
        { tekst: "muur", lidwoord: "de" },
        { tekst: "vuur", lidwoord: "het" },
        { tekst: "uur", lidwoord: "het" },
        { tekst: "buur", lidwoord: "de" },
        { tekst: "duur", lidwoord: null },
        { tekst: "stuur", lidwoord: "het" },
        { tekst: "puur", lidwoord: null },
        { tekst: "duif", lidwoord: "de" },
        { tekst: "huur", lidwoord: "de" }
      ]
    }
  }

  /* graad2 en graad3 komen later */
};

/* Hulpfunctie: geef de volledige tekst voor een woord (lidwoord + tekst) */
window.SpellingWoordenbibliotheek.toonWoord = function(woord) {
  if (!woord) return "";
  if (woord.lidwoord) return `${woord.lidwoord} ${woord.tekst}`;
  return woord.tekst;
};

/* Hulpfunctie: lijst van alle categorieën in een leerjaar, gegroepeerd */
window.SpellingWoordenbibliotheek.categorieenPerGroep = function(leerjaar) {
  const data = this[`graad${leerjaar}`];
  if (!data) return {};
  const groepen = {};
  for (const [id, cat] of Object.entries(data)) {
    if (typeof cat !== "object" || !cat.groep) continue;
    if (!groepen[cat.groep]) groepen[cat.groep] = [];
    groepen[cat.groep].push({ id, ...cat });
  }
  return groepen;
};

/* Labels voor de groepen (voor UI) */
window.SpellingWoordenbibliotheek.groepLabels = {
  "tweeklanken": "Tweeklanken",
  "ng-nk": "ng / nk woorden",
  "verdubbel-verenkel": "Verdubbelaars / Verenkelaars",
  "lange-klanken": "Lange klanken (aa, ee, oo, uu)"
};

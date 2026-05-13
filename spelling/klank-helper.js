/* ==========================================================
   klank-helper.js — Bepaalt welke letters in een woord de "klank" vormen,
   op basis van de woord-categorie. Wordt gebruikt door OV04.
   ========================================================== */

window.SpellingKlank = {

  CATEGORIE_NAAR_KLANK: {
    "mkm-a": { klank: "a", soort: "kort", specifiek: "kort-a" },
    "mkm-i": { klank: "i", soort: "kort", specifiek: "kort-i" },
    "mkm-e": { klank: "e", soort: "kort", specifiek: "kort-e" },
    "mkm-o": { klank: "o", soort: "kort", specifiek: "kort-o" },
    "mkm-u": { klank: "u", soort: "kort", specifiek: "kort-u" },
    "lk-aa": { klank: "aa", soort: "lang", specifiek: "lang-aa" },
    "lk-ee": { klank: "ee", soort: "lang", specifiek: "lang-ee" },
    "lk-oo": { klank: "oo", soort: "lang", specifiek: "lang-oo" },
    "lk-uu": { klank: "uu", soort: "lang", specifiek: "lang-uu" },
    "lk-ie": { klank: "ie", soort: "lang", specifiek: "lang-ie" },
    "ng-woorden": { klank: "ng", soort: "andere", specifiek: "ng" },
    "nk-woorden": { klank: "nk", soort: "andere", specifiek: "nk" },
    "tw-ei": { klank: "ei", soort: "andere", specifiek: "tw-ei" },
    "tw-ij": { klank: "ij", soort: "andere", specifiek: "tw-ij" },
    "tw-ou": { klank: "ou", soort: "andere", specifiek: "tw-ou" },
    "tw-au": { klank: "au", soort: "andere", specifiek: "tw-au" },
    "tw-ui": { klank: "ui", soort: "andere", specifiek: "tw-ui" },
    "tw-eu": { klank: "eu", soort: "andere", specifiek: "tw-eu" },
    "tw-oe": { klank: "oe", soort: "andere", specifiek: "tw-oe" },
    "tw-aai": { klank: "aai", soort: "andere", specifiek: "tw-aai" },
    "tw-ooi": { klank: "ooi", soort: "andere", specifiek: "tw-ooi" },
    "tw-oei": { klank: "oei", soort: "andere", specifiek: "tw-oei" },
    "tw-eeuw": { klank: "eeuw", soort: "andere", specifiek: "tw-eeuw" },
    "tw-ieuw": { klank: "ieuw", soort: "andere", specifiek: "tw-ieuw" },
    "sch-woorden": { klank: "sch", soort: "andere", specifiek: "sch" }
  },

  KOLOM_KLANK_OPTIES: [
    { value: "groep-kort",   label: "Korte klank (a/i/e/o/u)",      groep: "Groepen" },
    { value: "groep-lang",   label: "Lange klank (aa/ee/oo/uu/ie)", groep: "Groepen" },
    { value: "groep-andere", label: "Andere klank (alle tweeklanken)", groep: "Groepen" },
    { value: "kort-a", label: "a-woorden",  groep: "Korte klanken" },
    { value: "kort-i", label: "i-woorden",  groep: "Korte klanken" },
    { value: "kort-e", label: "e-woorden",  groep: "Korte klanken" },
    { value: "kort-o", label: "o-woorden",  groep: "Korte klanken" },
    { value: "kort-u", label: "u-woorden",  groep: "Korte klanken" },
    { value: "lang-aa", label: "aa-woorden", groep: "Lange klanken" },
    { value: "lang-ee", label: "ee-woorden", groep: "Lange klanken" },
    { value: "lang-oo", label: "oo-woorden", groep: "Lange klanken" },
    { value: "lang-uu", label: "uu-woorden", groep: "Lange klanken" },
    { value: "lang-ie", label: "ie-woorden", groep: "Lange klanken" },
    { value: "tw-ei", label: "ei-woorden",  groep: "Tweeklanken" },
    { value: "tw-ij", label: "ij-woorden",  groep: "Tweeklanken" },
    { value: "tw-ou", label: "ou-woorden",  groep: "Tweeklanken" },
    { value: "tw-au", label: "au-woorden",  groep: "Tweeklanken" },
    { value: "tw-oe", label: "oe-woorden",  groep: "Tweeklanken" },
    { value: "tw-eu", label: "eu-woorden",  groep: "Tweeklanken" },
    { value: "tw-ui", label: "ui-woorden",  groep: "Tweeklanken" },
    { value: "tw-aai",  label: "aai-woorden",  groep: "Drieklanken" },
    { value: "tw-ooi",  label: "ooi-woorden",  groep: "Drieklanken" },
    { value: "tw-oei",  label: "oei-woorden",  groep: "Drieklanken" },
    { value: "tw-eeuw", label: "eeuw-woorden", groep: "Drieklanken" },
    { value: "tw-ieuw", label: "ieuw-woorden", groep: "Drieklanken" },
    { value: "ng", label: "ng-woorden", groep: "ng / nk" },
    { value: "nk", label: "nk-woorden", groep: "ng / nk" },
    { value: "sch", label: "sch-woorden", groep: "Andere" },
    { value: "ch-cht", label: "ch / cht-woorden", groep: "Andere" },
    // Regel-categorieën (verdubbel/verenkel/geen-regel) — voor 3-weg sortering
    { value: "regel-verdubbel", label: "Verdubbelen", groep: "Regels" },
    { value: "regel-verenkel",  label: "Verenkelen",  groep: "Regels" },
    { value: "regel-geen",      label: "Schrijf wat je hoort", groep: "Regels" }
  ],

  STANDAARD_TITELS: {
    "groep-kort":   "Korte klank",
    "groep-lang":   "Lange klank",
    "groep-andere": "Andere klank",
    "kort-a": "a-woorden", "kort-i": "i-woorden", "kort-e": "e-woorden",
    "kort-o": "o-woorden", "kort-u": "u-woorden",
    "lang-aa": "aa-woorden", "lang-ee": "ee-woorden", "lang-oo": "oo-woorden",
    "lang-uu": "uu-woorden", "lang-ie": "ie-woorden",
    "tw-ei": "ei-woorden", "tw-ij": "ij-woorden", "tw-ou": "ou-woorden",
    "tw-au": "au-woorden", "tw-oe": "oe-woorden", "tw-eu": "eu-woorden",
    "tw-ui": "ui-woorden",
    "tw-aai": "aai-woorden", "tw-ooi": "ooi-woorden", "tw-oei": "oei-woorden",
    "tw-eeuw": "eeuw-woorden", "tw-ieuw": "ieuw-woorden",
    "ng": "ng-woorden", "nk": "nk-woorden",
    "sch": "sch-woorden",
    "ch-cht": "ch / cht-woorden",
    // Regel-categorieën
    "regel-verdubbel": "Verdubbelen",
    "regel-verenkel":  "Verenkelen",
    "regel-geen":      "Schrijf wat je hoort"
  },

  detecteerKlank: function(woord, categorie) {
    if (!woord || !categorie) return null;
    const info = this.CATEGORIE_NAAR_KLANK[categorie];
    if (!info) return null;
    const lower = woord.toLowerCase();
    const positie = lower.indexOf(info.klank);
    if (positie === -1) return null;
    return {
      klank: info.klank, positie: positie, lengte: info.klank.length,
      soort: info.soort, specifiek: info.specifiek
    };
  },

  woordMetStreepjes: function(woord, categorie) {
    const k = this.detecteerKlank(woord, categorie);
    if (!k) return woord;
    // Eén lijntje (3 underscores breed) ongeacht het aantal letters in de klank.
    // Pedagogisch beter: kind moet zelf horen of het 1 of 2 klanken zijn.
    // Anders zou "h___s" verklikken dat ui = 2 letters.
    const streepje = "___";
    return woord.slice(0, k.positie) + streepje + woord.slice(k.positie + k.lengte);
  },

  woordMetGekleurdeKlank: function(woord, categorie, kleur) {
    const k = this.detecteerKlank(woord, categorie);
    if (!k) return woord;
    const voor = woord.slice(0, k.positie);
    const klank = woord.slice(k.positie, k.positie + k.lengte);
    const na = woord.slice(k.positie + k.lengte);
    return `${voor}<span class="klank-gekleurd" style="background:${kleur}; padding:1px 3px; border-radius:3px;">${klank}</span>${na}`;
  },

  matchKolom: function(woordCategorie, kolomKlank) {
    // Regel-categorieën: koppel op woordCategorie-naam direct
    // Werkt voor 3-weg sortering (verdubbel/verenkel/geen-regel)
    if (kolomKlank === "regel-verdubbel") {
      return woordCategorie === "stukjes-verdubbelen"
          || woordCategorie === "meervoud-verdubbel";
    }
    if (kolomKlank === "regel-verenkel") {
      return woordCategorie === "stukjes-verenkelen"
          || woordCategorie === "meervoud-verenkel";
    }
    if (kolomKlank === "regel-geen") {
      return woordCategorie === "stukjes-geen-regel";
    }
    
    // Standaard klank-matching (bestaand gedrag)
    const info = this.CATEGORIE_NAAR_KLANK[woordCategorie];
    if (!info) return false;
    if (info.specifiek === kolomKlank) return true;
    if (kolomKlank === "groep-kort" && info.soort === "kort") return true;
    if (kolomKlank === "groep-lang" && info.soort === "lang") return true;
    if (kolomKlank === "groep-andere" && info.soort === "andere") return true;
    return false;
  },

  bepaalKolom: function(woordCategorie, kolomKlanken) {
    for (let i = 0; i < kolomKlanken.length; i++) {
      if (this.matchKolom(woordCategorie, kolomKlanken[i])) return i + 1;
    }
    return null;
  }
};
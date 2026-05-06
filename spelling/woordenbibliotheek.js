/* ==========================================================
   woordenbibliotheek.js (HOOFDBESTAND)

   Centrale registratie voor woordensets per graad.
   Aparte bestanden voegen woorden toe via registreerGraad().
   ========================================================== */

window.SpellingWoordenbibliotheek = {

  graad1: null,
  graad2: null,
  graad3: null,

  registreerGraad: function(nummer, data) {
    this[`graad${nummer}`] = data;
  },

  toonWoord: function(woord) {
    if (!woord) return "";
    if (woord.lidwoord) return `${woord.lidwoord} ${woord.tekst}`;
    return woord.tekst;
  },

  categorieenPerGroep: function(leerjaar) {
    const data = this[`graad${leerjaar}`];
    if (!data) return {};
    const groepen = {};
    for (const [id, cat] of Object.entries(data)) {
      if (typeof cat !== "object" || !cat.groep) continue;
      if (!groepen[cat.groep]) groepen[cat.groep] = [];
      groepen[cat.groep].push({ id, ...cat });
    }
    return groepen;
  },

  graadHeeftWoorden: function(leerjaar) {
    const d = this[`graad${leerjaar}`];
    if (!d) return false;
    return Object.keys(d).length > 0;
  },

  groepLabels: {
    "korte-klanken": "Korte klanken (MK/KM/MKM)",
    "tweeklanken": "Tweeklanken",
    "ng-nk": "ng / nk woorden",
    "verdubbel-verenkel": "Verdubbelaars / Verenkelaars",
    "lange-klanken": "Lange klanken (aa, ee, oo, uu)",
    "medeklinker-cluster": "Medeklinkerclusters",
    "sch-woorden": "sch-woorden",
    "verlengen": "Verlengingsregel",
    "verkleinwoorden": "Verkleinwoorden",
    "meervouden": "Meervouden",
    "ei-ij": "ei / ij woorden",
    "au-ou": "au / ou woorden",
    "ch-cht": "ch / cht woorden",
    "doffe-klank": "Doffe klanken",
    "hoofdletters": "Hoofdletters & leestekens"
  }
};

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

  /* ---------- HOOFDGROEPEN: hoorwoord / onthoudwoord / regelwoord ---------- */
  /* Geeft alle categorieën gegroepeerd per hoofdgroep + per groep daarbinnen.
     Structuur: { hoorwoord: { 'korte-klanken': [...categorieën], ...}, onthoudwoord: {...}, regelwoord: {...} }
     Als ?aangevinkt is meegegeven (Set van categorie-IDs), filtert hij die.
     Categorieën zonder hoofdgroep komen in 'overig'. */
  categorieenPerHoofdgroep: function(leerjaar, aangevinkt) {
    const data = this[`graad${leerjaar}`];
    if (!data) return {};
    const result = { hoorwoord: {}, onthoudwoord: {}, regelwoord: {}, samenstelling: {}, overig: {} };
    for (const [id, cat] of Object.entries(data)) {
      if (typeof cat !== "object" || !cat.groep) continue;
      if (aangevinkt && !aangevinkt.has(id)) continue;
      const hoofdgroep = cat.hoofdgroep || "overig";
      if (!result[hoofdgroep][cat.groep]) result[hoofdgroep][cat.groep] = [];
      result[hoofdgroep][cat.groep].push({ id, ...cat });
    }
    return result;
  },

  /* Geef alle categorie-IDs voor een gegeven graad (gebruikt voor 'alle aanvinken'-knop) */
  alleCategorieIds: function(leerjaar) {
    const data = this[`graad${leerjaar}`];
    if (!data) return [];
    return Object.keys(data).filter(k => typeof data[k] === "object" && data[k].groep);
  },

  graadHeeftWoorden: function(leerjaar) {
    const d = this[`graad${leerjaar}`];
    if (!d) return false;
    return Object.keys(d).length > 0;
  },

  /* Labels voor de hoofdgroepen in de UI */
  hoofdgroepLabels: {
    "hoorwoord": "🎵 Hoorwoorden",
    "onthoudwoord": "🧠 Onthoudwoorden",
    "regelwoord": "📋 Regelwoorden",
    "samenstelling": "🧩 Samenstellingen",
    "overig": "📦 Overig"
  },

  /* Beschrijving per hoofdgroep voor tooltip / uitleg */
  hoofdgroepUitleg: {
    "hoorwoord": "Woorden waar je gewoon schrijft wat je hoort.",
    "onthoudwoord": "Woorden waar je de spelling moet onthouden (geen luisterregel).",
    "regelwoord": "Woorden waarbij je een regel moet toepassen (verlengen, verkleinen, meervoud).",
    "samenstelling": "Woorden die uit twee delen bestaan die je aan elkaar plakt (klok + huis = klokhuis).",
    "overig": "Andere categorieën."
  },

  groepLabels: {
    "korte-klanken": "Korte klanken (MK/KM/MKM)",
    "tweeklanken": "Tweeklanken",
    "ng-nk": "ng / nk woorden",
    "verdubbel-verenkel": "Verdubbelaars / Verenkelaars",
    "lange-klanken": "Lange klanken (aa, ee, oo, uu)",
    "medeklinker-cluster": "Medeklinkerclusters",
    "clusters": "Medeklinkerclusters",
    "sch-woorden": "sch-woorden",
    "moeilijke-klanken": "Moeilijke klanken (sch)",
    "ch-cht-klank": "ch / cht woorden",
    "ch-cht-gt": "ch / cht / gt woorden",
    "verlengen": "Verlengingsregel",
    "verkleinwoorden": "Verkleinwoorden",
    "meervouden": "Meervouden",
    "ei-ij": "ei / ij woorden",
    "au-ou": "au / ou woorden",
    "ch-cht": "ch / cht woorden",
    "doffe-klank": "Doffe klanken",
    "hoofdletters": "Hoofdletters & leestekens",
    "samenstellingen": "Samengestelde woorden"
  }
};
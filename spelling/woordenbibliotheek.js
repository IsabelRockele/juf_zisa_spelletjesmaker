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
  /* Pedagogische volgorde van groepen binnen elke hoofdgroep.
     Groepen die hier niet staan komen achteraan in alfabetische orde. */
  GROEP_VOLGORDE: [
    // hoorwoord
    "korte-klanken",
    "lange-klanken",
    "tweeklanken",
    "ei-ij",       // tweeklanken-onderdeel maar onthoudwoord
    "au-ou",
    "aai-ooi-oei-eeuw-ieuw-uw",  // graad 2 — uitgebreide tweeklanken
    "ng-nk",
    "moeilijke-klanken",  // sch
    "sch-woorden",
    "schr-woorden",       // graad 2 — sch- met r-cluster
    "clusters",
    "ch-cht-klank",       // (oude naam voor compatibility)
    "ch-cht-gt",
    "doffe-klank",
    // regelwoord
    "verdubbel-verenkel",
    "verlengen",
    "verlengen-tdpb",     // graad 2 — uitgebreid t/d + p/b
    "verkleinwoorden",
    "meervouden",
    "doffe-klank-voorvoegsel",   // graad 2
    "doffe-klank-achtervoegsel", // graad 2
    // werkwoord (allemaal graad 2)
    "werkwoorden-ott",
    "werkwoorden-vtt",
    "werkwoorden-ovt-zwak",
    "werkwoorden-ovt-sterk",
    "werkwoorden-vvt",
    // samenstelling
    "samenstellingen",
    // onthoudwoord (graad 2)
    "teit-heid",
    "leenwoorden",
    // overig
    "hoofdletters"
  ],

  /* Sorteer groep-keys volgens GROEP_VOLGORDE.
     Onbekende groepen komen alfabetisch achteraan. */
  _sorteerGroepen: function(groepKeys) {
    const volgorde = this.GROEP_VOLGORDE;
    return [...groepKeys].sort((a, b) => {
      const ia = volgorde.indexOf(a);
      const ib = volgorde.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  },

  categorieenPerHoofdgroep: function(leerjaar, aangevinkt) {
    const data = this[`graad${leerjaar}`];
    if (!data) return {};
    const ruw = { hoorwoord: {}, onthoudwoord: {}, regelwoord: {}, werkwoord: {}, samenstelling: {}, overig: {} };
    for (const [id, cat] of Object.entries(data)) {
      if (typeof cat !== "object" || !cat.groep) continue;
      if (aangevinkt && !aangevinkt.has(id)) continue;
      const hoofdgroep = cat.hoofdgroep || "overig";
      if (!ruw[hoofdgroep][cat.groep]) ruw[hoofdgroep][cat.groep] = [];
      ruw[hoofdgroep][cat.groep].push({ id, ...cat });
    }
    // Sorteer groepen binnen elke hoofdgroep volgens pedagogische volgorde
    const result = {};
    for (const [hg, groepen] of Object.entries(ruw)) {
      result[hg] = {};
      const gesorteerd = this._sorteerGroepen(Object.keys(groepen));
      for (const groepKey of gesorteerd) {
        result[hg][groepKey] = groepen[groepKey];
      }
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
    "werkwoord": "✍️ Werkwoorden",
    "samenstelling": "🧩 Samenstellingen",
    "overig": "📦 Overig"
  },

  /* Beschrijving per hoofdgroep voor tooltip / uitleg */
  hoofdgroepUitleg: {
    "hoorwoord": "Woorden waar je gewoon schrijft wat je hoort.",
    "onthoudwoord": "Woorden waar je de spelling moet onthouden (geen luisterregel).",
    "regelwoord": "Woorden waarbij je een regel moet toepassen (verlengen, verkleinen, meervoud).",
    "werkwoord": "Werkwoorden in verschillende tijden (tegenwoordige tijd, verleden tijd, voltooid).",
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
    "schr-woorden": "schr-woorden",
    "moeilijke-klanken": "Moeilijke klanken (sch)",
    "ch-cht-klank": "ch / cht woorden",
    "ch-cht-gt": "ch / cht / gt woorden",
    "verlengen": "Verlengingsregel",
    "verlengen-tdpb": "Verlengingsregel (t/d + p/b)",
    "verkleinwoorden": "Verkleinwoorden",
    "meervouden": "Meervouden",
    "ei-ij": "ei / ij woorden",
    "au-ou": "au / ou woorden",
    "aai-ooi-oei-eeuw-ieuw-uw": "aai / ooi / oei / eeuw / ieuw / uw",
    "ch-cht": "ch / cht woorden",
    "doffe-klank": "Doffe klanken",
    "doffe-klank-voorvoegsel": "Doffe klank in voorvoegsel (ge-, ver-, be-)",
    "doffe-klank-achtervoegsel": "Doffe klank in achtervoegsel (-elen, -eren, -ig, -lijk)",
    "werkwoorden-ott": "Onvoltooid tegenwoordige tijd (OTT)",
    "werkwoorden-vtt": "Voltooid tegenwoordige tijd (VTT)",
    "werkwoorden-ovt-zwak": "Zwakke werkwoorden in OVT",
    "werkwoorden-ovt-sterk": "Sterke werkwoorden in OVT",
    "werkwoorden-vvt": "Voltooid verleden tijd (VVT)",
    "teit-heid": "Woorden op -teit en -heid",
    "leenwoorden": "Leenwoorden",
    "hoofdletters": "Hoofdletters & leestekens",
    "samenstellingen": "Samengestelde woorden"
  }
};
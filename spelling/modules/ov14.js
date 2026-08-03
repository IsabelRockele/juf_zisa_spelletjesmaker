/* OV14 — leestekens voor graad 1 (tweede leerjaar). */
(function () {
  "use strict";
  const EIND = "leestekens-eind-g1";
  const BINNEN = "leestekens-binnen-g1";
  const M = {
    naam: "ov14", graad: 1,
    oefenvormenPerNiveau: ["basis", "kern"],
    _maxPerNiveau: { basis: 8, kern: 6 },
    renderInstellingen() { return ""; },

    genereerBlad(opties, oplossingen) {
      const o = opties?.ov14 || opties || {};
      const niveau = o.niveaus?.[0] || o.niveau || "basis";
      const cfg = { lijntype: o.lijntype || "type3", lijnhoogte: o.lijnhoogte || "middel" };
      const gekozen = this._gekozenSoorten();
      if (!gekozen.eind && !gekozen.binnen) return '<div class="werkblad ov14-blad">Kies eerst welke leestekens je wilt oefenen.</div>';
      const uitleg = niveau === "basis"
        ? ["Lees elke zin.", gekozen.eind ? "Kleur het juiste eindteken: punt, vraagteken of uitroepteken." : "", gekozen.binnen ? "Vul een komma of dubbele punt in het lege vakje in." : "", "Schrijf daarna de volledige zin correct over."].filter(Boolean)
        : ["In het tekstje ontbreken de gekozen leestekens.", "Plaats de leestekens en schrijf daarna het hele tekstje correct over."];
      const inhoud = niveau === "basis" ? this._zinnen(gekozen, oplossingen, cfg) : this._tekst(gekozen, oplossingen, cfg);
      return `<div class="werkblad ov14-blad lijnhoogte-${cfg.lijnhoogte}" data-niveau="${niveau}"><div class="ov01-header"><div class="ov01-naam-rij"><span>Naam:</span><span class="ov01-lijn-naam"></span><span>Datum:</span><span class="ov01-lijn-datum"></span></div>
        <h2 class="ov01-titel">Leestekens <span class="ov01-niveau-badge">${niveau === "basis" ? "⭐" : "⭐⭐"}</span>${oplossingen ? '<span class="oplossingen-badge">OPLOSSINGEN</span>' : ''}</h2></div>
        <div class="ov01-stappen"><div class="ov01-stappen-label">Opdracht:</div>${uitleg.map(x => `<div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>${x}</span></div>`).join("")}</div>
        ${inhoud}<div class="ov01-voettekst">www.jufzisa.be — Juf Zisa's spellinggenerator</div></div>`;
    },

    _zinnen(gekozen, oplossingen, cfg) {
      const eindzinnen = ["De hond slaapt.", "Waar ligt mijn boek?", "Pas op voor de bal!", "Kom je morgen spelen?", "Wat een mooie tekening!"];
      const binnenzinnen = ["In mijn tas zitten een boek, een schrift en een pen.", "Neem dit mee: een jas, een muts en handschoenen.", "Op tafel liggen appels, peren en bananen."];
      const lijst = [...(gekozen.eind ? eindzinnen : []), ...(gekozen.binnen ? binnenzinnen : [])];
      return `<div class="ov14-zinnen">${lijst.map((zin, i) => {
        const juist = zin.slice(-1);
        const keuzes = gekozen.eind && /[.!?]$/.test(zin)
          ? `<span class="ov14-eindkeuzes">${[".", "?", "!"].map(teken => `<i class="${oplossingen && teken === juist ? "juist" : ""}">${teken}</i>`).join("")}</span>` : "";
        return `<div class="ov14-zin"><div class="ov14-zin-boven"><b>${i + 1}.</b><span class="ov14-zintekst">${oplossingen ? zin : this._verwijder(zin, gekozen)}</span>${keuzes}</div>
          ${oplossingen ? `<div class="ov14-oplossing">${zin}</div>` : `${this._langeLijn(cfg)}${this._langeLijn(cfg)}`}</div>`;
      }).join("")}</div>`;
    },

    _tekst(gekozen, oplossingen, cfg) {
      const zinnen = ["Op zaterdag gaat Noor naar de markt.", "Wat wil ze kopen?", "Ze roept: ik heb een lijst!", "Op haar lijst staan appels, peren en brood.", "Waar is haar tas?", "Pas op, Noor: de tas staat achter je!"];
      const tekst = zinnen.map((zin, i) => `<p><b>${i + 1}.</b> ${oplossingen ? zin : this._verwijder(zin, gekozen)}</p>`).join("");
      const correct = zinnen.join(" ");
      const lijnen = Array.from({ length: 9 }, () => this._langeLijn(cfg)).join("");
      return `<div class="ov14-tekst"><h3>Het boodschappenlijstje</h3>${tekst}</div>
        <div class="ov14-herschrijf"><h3>Schrijf het tekstje correct over</h3>${oplossingen ? `<div class="ov14-oplossing">${correct}</div>` : lijnen}</div>`;
    },

    _verwijder(zin, gekozen) {
      let uit = zin;
      if (gekozen.binnen) uit = uit.replace(/[:,]/g, '<span class="ov14-tekenvak">□</span>');
      if (gekozen.eind) uit = uit.replace(/[.!?]$/, "");
      return uit;
    },
    _gekozenSoorten() {
      const ids = Array.isArray(window._spellingCategorieIdsSnapshot)
        ? window._spellingCategorieIdsSnapshot
        : (window._weekdictee_gekozenWoorden || []).map(w => w.categorie);
      const cats = new Set(ids);
      return { eind: cats.has(EIND), binnen: cats.has(BINNEN) };
    },
    _langeLijn(cfg) {
      const canvas = window.SpellingSchrijflijnen?.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, 650) || '<div class="ov07-fallback-lijn"></div>';
      return `<div class="ov14-lange-lijn">${canvas}</div>`;
    }
  };
  window.SpellingModules = window.SpellingModules || {};
  window.SpellingModules.ov14 = M;
})();

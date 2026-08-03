/* OV12 — gemengde verlengingsregel: b, p, d of t (graad 2). */
(function () {
  "use strict";

  const CATS = ["verlengen-td-g2", "verlengen-pb-g2"];
  const LETTERS = ["b", "p", "d", "t"];
  const ZINNEN = {
    hand: "Ik steek mijn hand op.", hoed: "De hoed ligt op de stoel.", tand: "Mijn tand zit los.",
    bed: "Het bed staat bij het raam.", hond: "De hond blaft naar de kat.", wind: "De wind waait hard.",
    land: "Ons land is klein.", mond: "Doe je mond maar open.", rand: "Er staat een glas op de rand.",
    baard: "Opa heeft een grijze baard.", poort: "De poort van de tuin staat open.",
    taart: "De taart staat op tafel.", paard: "Het paard loopt in de wei.",
    vriend: "Mijn vriend komt spelen.", pond: "De vis weegt bijna een pond.",
    soort: "Welke soort bloem is dit?", start: "Iedereen wacht aan de start.",
    post: "De post ligt in de brievenbus.", markt: "We kopen fruit op de markt.",
    gezond: "Een appel is gezond.", stad: "De stad is vandaag erg druk.",
    krab: "De krab kruipt over het zand.", web: "De spin zit in haar web.",
    rib: "Hij kneusde een rib.", trap: "We lopen de trap op.", step: "De step staat in de garage.",
    klap: "Ik hoorde een harde klap.", pop: "De pop ligt in de wieg.", kip: "De kip pikt graan.",
    top: "De vlag staat op de top.", klep: "Sluit de klep van de doos.",
    slip: "De auto raakte in een slip.", kop: "De hond legt zijn kop neer.",
    knop: "Druk op de groene knop.", lap: "Mama naait een lap stof.", slab: "De baby draagt een slab."
  };

  const M = {
    naam: "ov12",
    graad: 2,
    oefenvormenPerNiveau: ["basis", "kern", "verdieping", "uitbreiding"],
    _maxPerNiveau: { basis: 8, kern: 8, verdieping: 8, uitbreiding: 5 },

    renderInstellingen() { return ""; },

    genereerBlad(opties, oplossingen) {
      const o = opties?.ov12 || opties || {};
      const niveau = o.niveaus?.[0] || o.niveau || "basis";
      const cfg = { lijntype: o.lijntype || "type3", lijnhoogte: o.lijnhoogte || "middel" };
      let pool = this._woorden();
      if (niveau === "basis" || niveau === "kern") pool = pool.filter(w => w.afbeelding === true);
      const woorden = this._gebalanceerd(pool, this._maxPerNiveau[niveau]);
      if (!woorden.length) return '<div class="werkblad ov12-blad">Geen woorden beschikbaar.</div>';

      const uitleg = {
        basis: ["Kijk naar de prent.", "Omcirkel b, p, d of t.", "Schrijf het hele woord."],
        kern: ["Kijk naar de prent.", "Maak het woord in je hoofd langer.", "Schrijf het woord zonder letterkeuzes."],
        verdieping: ["Lees elke zin.", "Maak het onvolledige woord in je hoofd langer.", "Vul b, p, d of t in en schrijf het hele woord."],
        uitbreiding: ["In elke zin staat één fout bij b, p, d of t.", "Doorstreep het foute woord en schrijf de zin correct over."]
      }[niveau];
      const sterren = { basis: "⭐", kern: "⭐⭐", verdieping: "⭐⭐⭐", uitbreiding: "⭐⭐⭐⭐" }[niveau];
      const body = niveau === "basis" ? this._prentkaarten(woorden, cfg, oplossingen, true)
        : niveau === "kern" ? this._prentkaarten(woorden, cfg, oplossingen, false)
        : niveau === "verdieping" ? this._zinnenAanvullen(woorden, cfg, oplossingen)
        : this._foutenVerbeteren(woorden, cfg, oplossingen);

      return `<div class="werkblad ov12-blad lijnhoogte-${cfg.lijnhoogte}" data-niveau="${niveau}">
        <div class="ov01-header"><div class="ov01-naam-rij"><span>Naam:</span><span class="ov01-lijn-naam"></span><span>Datum:</span><span class="ov01-lijn-datum"></span></div>
        <h2 class="ov01-titel">Verlengmix: b, p, d of t <span class="ov01-niveau-badge">${sterren}</span>${oplossingen ? '<span class="oplossingen-badge">OPLOSSINGEN</span>' : ''}</h2></div>
        <div class="ov01-stappen"><div class="ov01-stappen-label">Opdracht:</div>${uitleg.map(x => `<div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>${x}</span></div>`).join("")}</div>
        ${body}<div class="ov01-voettekst">www.jufzisa.be — Juf Zisa's spellinggenerator</div></div>`;
    },

    _prentkaarten(woorden, cfg, oplossingen, metKeuzes) {
      return `<div class="ov12-grid ov12-prentgrid">${woorden.map(w => `<div class="ov12-kaart ov12-prentkaart">
        <button class="rij-verwijder-knop" data-woord="${w.tekst}" type="button">✕</button>
        <div class="ov12-prent">${this._plaatje(w)}</div>
        ${metKeuzes ? `<div class="ov12-kort">${this._stam(w)}<span class="ov12-lettergat">${oplossingen ? this._letter(w) : "_"}</span></div>
          <div class="ov12-letterkeuzes">${LETTERS.map(l => `<span class="${oplossingen && l === this._letter(w) ? "juist" : ""}">${l}</span>`).join("")}</div>` : ""}
        ${this._lijn(cfg, oplossingen ? w.tekst : "")}
      </div>`).join("")}</div>`;
    },

    _zinnenAanvullen(woorden, cfg, oplossingen) {
      return `<div class="ov12-contexten">${woorden.map((w, i) => {
        const zin = this._zin(w);
        const onvolledig = zin.replace(new RegExp(`\\b${w.tekst}\\b`, "i"), `${this._stam(w)}__`);
        return `<div class="ov12-context"><button class="rij-verwijder-knop" data-woord="${w.tekst}" type="button">✕</button>
          <div><b>${i + 1}.</b> ${oplossingen ? zin.replace(new RegExp(`\\b${w.tekst}\\b`, "i"), `<strong class="ov12-oplossing">${w.tekst}</strong>`) : onvolledig}</div>
          <div class="ov12-context-antwoord"><span>Woord:</span>${this._lijn(cfg, oplossingen ? w.tekst : "")}</div>
        </div>`;
      }).join("")}</div>`;
    },

    _foutenVerbeteren(woorden, cfg, oplossingen) {
      return `<div class="ov12-foutzinnen">${woorden.map((w, i) => {
        const zin = this._zin(w);
        const fout = this._foutWoord(w);
        const foutzin = zin.replace(new RegExp(`\\b${w.tekst}\\b`, "i"), fout);
        return `<div class="ov12-foutzin"><button class="rij-verwijder-knop" data-woord="${w.tekst}" type="button">✕</button>
          <div class="ov12-foutzin-tekst"><b>${i + 1}.</b> ${foutzin}</div>
          ${oplossingen ? `<div class="ov12-correcte-zin">${zin}</div>` : `${this._langeLijn(cfg)}${this._langeLijn(cfg)}`}
        </div>`;
      }).join("")}</div>`;
    },

    _zin(w) { return ZINNEN[w.tekst] || `Ik schrijf het woord ${w.tekst}.`; },
    _foutWoord(w) {
      const juist = this._letter(w);
      const fout = ({ d: "t", t: "d", b: "p", p: "b" })[juist];
      return this._stam(w) + fout;
    },
    _plaatje(w) { return window.SpellingAfbeeldingen?.htmlVoorWoord(w) || '<span class="woord-emoji">🖼️</span>'; },
    _woorden() {
      const raw = window._weekdictee_gekozenWoorden || [];
      const bib = window.SpellingWoordenbibliotheek?.graad2 || {};
      return raw.filter(w => CATS.includes(w.categorie)).map(w => ({ ...w, ...(bib[w.categorie]?.woorden?.find(x => x.tekst === w.tekst) || {}), categorie: w.categorie, leerjaar: 2 }));
    },
    _letter(w) { return w.tekst.slice(-1).toLowerCase(); },
    _stam(w) { return w.tekst.slice(0, -1); },
    _lijn(cfg, antwoord) {
      const canvas = window.SpellingSchrijflijnen?.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, 260) || '<div class="ov07-fallback-lijn"></div>';
      return `<div class="ov12-lijn">${antwoord ? `<span>${antwoord}</span>` : ""}${canvas}</div>`;
    },
    _langeLijn(cfg) {
      const canvas = window.SpellingSchrijflijnen?.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, 620) || '<div class="ov07-fallback-lijn"></div>';
      return `<div class="ov12-lange-lijn">${canvas}</div>`;
    },
    _gebalanceerd(pool, n) {
      const groepen = LETTERS.map(l => this._schud(pool.filter(w => this._letter(w) === l)));
      const uit = [];
      while (uit.length < n && groepen.some(g => g.length)) for (const g of groepen) if (g.length && uit.length < n) uit.push(g.shift());
      return uit;
    },
    _schud(a) {
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      return a;
    }
  };

  window.SpellingModules = window.SpellingModules || {};
  window.SpellingModules.ov12 = M;
})();

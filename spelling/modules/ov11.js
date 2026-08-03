/* OV11 — doffe klank in voor- en achtervoegsels (graad 2). */
(function () {
  "use strict";

  const CATS = [
    "voorvoegsel-ge-g2", "voorvoegsel-ver-g2", "voorvoegsel-be-g2",
    "achtervoegsel-elen-g2", "achtervoegsel-eren-g2",
    "achtervoegsel-ig-g2", "achtervoegsel-lijk-g2"
  ];
  const VOORVOEGSELS = ["ge", "be", "ver"];
  const ACHTERVOEGSELS = ["elen", "eren", "ig", "lijk"];

  const OV11 = {
    naam: "ov11",
    graad: 2,
    oefenvormenPerNiveau: ["basis", "kern", "verdieping", "uitbreiding"],
    _maxPerNiveau: { basis: 8, kern: 8, verdieping: 8, uitbreiding: 5 },

    renderInstellingen() { return ""; },

    genereerBlad(opties, metAntwoorden) {
      const o = opties?.ov11 || opties || {};
      const niveau = o.niveaus?.[0] || o.niveau || opties?.niveau || "basis";
      const cfg = { lijntype: o.lijntype || "type3", lijnhoogte: o.lijnhoogte || "middel" };
      const max = this._maxPerNiveau[niveau] || 8;
      const alleWoorden = this._woorden();
      const gekozenDelen = [...new Set(alleWoorden.map(w => this._deel(w)))];
      const aantal = Math.min(o.aantalWoorden || max, max);
      const woorden = niveau === "verdieping"
        ? this._kiesGebalanceerd(alleWoorden, aantal)
        : this._kies(alleWoorden, aantal);
      if (!woorden.length) return '<div class="werkblad ov11-blad"><p>Geen passende woorden gekozen.</p></div>';

      const sterren = { basis: "⭐", kern: "⭐⭐", verdieping: "⭐⭐⭐", uitbreiding: "⭐⭐⭐⭐" }[niveau];
      const uitleg = {
        basis: ["Lees de woorden in de woordbank.", "Kleur in elk woord het voor- of achtervoegsel.", "Schrijf elk volledig woord in de juiste kolom."],
        kern: ["Kijk welk woorddeel ontbreekt.", "Kies het juiste voor- of achtervoegsel.", "Schrijf daarna het hele woord."],
        verdieping: ["Vul in elk woord zelf het ontbrekende woorddeel in.", "Schrijf daarna het volledige woord in de juiste kolom.", "Kies één woord en maak er een goede zin mee."],
        uitbreiding: ["Lees de vijf woorden.", "Maak met elk woord een duidelijke zin die bij de betekenis past.", "Denk aan een hoofdletter en een leesteken."]
      }[niveau];
      const body = niveau === "basis" ? this._basis(woorden, cfg, metAntwoorden)
        : niveau === "kern" ? this._kern(woorden, cfg, metAntwoorden)
        : niveau === "verdieping" ? this._verdieping(woorden, cfg, metAntwoorden)
        : this._uitbreiding(woorden, cfg, metAntwoorden);

      return `<div class="werkblad ov11-blad lijnhoogte-${cfg.lijnhoogte}">
        <div class="ov01-header"><div class="ov01-naam-rij"><span>Naam:</span><span class="ov01-lijn-naam"></span><span>Datum:</span><span class="ov01-lijn-datum"></span></div>
        <h2 class="ov01-titel">Doffe klank in woorddelen <span class="ov01-niveau-badge">${sterren}</span>${metAntwoorden ? '<span class="oplossingen-badge">OPLOSSINGEN</span>' : ''}</h2></div>
        <div class="ov01-stappen"><div class="ov01-stappen-label">Opdracht:</div>
          <div class="ov11-gekozen-delen"><b>Je oefent met:</b> ${gekozenDelen.map(deel => alleWoorden.find(w => this._deel(w) === deel)?.voorvoegsel ? deel + '-' : '-' + deel).join(", ")}</div>
          ${uitleg.map(x => `<div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>${x}</span></div>`).join("")}</div>
        ${body}<div class="ov01-voettekst">www.jufzisa.be — Juf Zisa's spellinggenerator</div></div>`;
    },

    _basis(woorden, cfg, oplossingen) {
      const delen = [...new Set(woorden.map(w => this._deel(w)))];
      const woordbank = woorden.map(w => oplossingen ? this._gemarkeerdWoord(w) : w.tekst).join(" · ");
      return `<div class="ov11-woordbank ov11-basis-woordbank">${woordbank}</div>
        <div class="ov11-sorteer ov11-basis-sorteer" style="--kolommen:${Math.min(delen.length, 2)}">${delen.map(deel => {
          const voorbeeld = woorden.find(w => this._deel(w) === deel);
          const woordenInKolom = woorden.filter(w => this._deel(w) === deel);
          const passend = woordenInKolom.map(w => w.tekst).join(", ");
          return `<section><h3>${voorbeeld?.voorvoegsel ? deel + '-' : '-' + deel}</h3><div class="ov11-sorteerlijnen">
            ${oplossingen ? `<b>${passend}</b>` : Array.from({ length: Math.max(3, woordenInKolom.length) }, () => this._lijn(cfg, "")).join("")}
          </div></section>`;
        }).join("")}</div>`;
    },

    _kern(woorden, cfg, oplossingen) {
      return `<div class="ov11-grid">${woorden.map(w => {
        const deel = this._deel(w), rest = this._rest(w, deel);
        return `<div class="ov11-kaart"><button class="rij-verwijder-knop" data-woord="${w.tekst}" type="button">✕</button>
          <div class="ov11-aanvul">${this._onvolledigWoord(w, rest)}</div>
          <div class="ov11-deelkeuzes">${this._deelKeuzes(w).map(x => `<span class="${oplossingen && x === deel ? 'juist' : ''}">${w.voorvoegsel ? x + '-' : '-' + x}</span>`).join("")}</div>
          ${this._lijn(cfg, oplossingen ? w.tekst : "")}</div>`;
      }).join("")}</div>`;
    },

    _verdieping(woorden, cfg, oplossingen) {
      const delen = [...new Set(woorden.map(w => this._deel(w)))];
      const opgaven = woorden.map(w => `<span class="ov11-onvolledig-item">${this._onvolledigWoord(w, this._rest(w, this._deel(w)))}</span>`).join("");
      const zinLijnen = oplossingen ? "" : `${this._langeLijn(cfg)}${this._langeLijn(cfg)}`;
      const groepen = [];
      for (let i = 0; i < delen.length; i += 2) groepen.push(delen.slice(i, i + 2));
      const kolomPaginas = groepen.map((groep, paginaIndex) => {
        const paginaWissel = paginaIndex > 0
          ? `<div class="pagina-break-voor ov11-kolommen-pagina2"><b>Vervolg — vul in en sorteer.</b></div>`
          : "";
        const kolommen = groep.map(deel => {
          const voorbeeld = woorden.find(w => this._deel(w) === deel);
          const woordenInKolom = woorden.filter(w => this._deel(w) === deel);
          const passend = woordenInKolom.map(w => w.tekst).join(", ");
          return `<section><h3>${voorbeeld?.voorvoegsel ? deel + '-' : '-' + deel}</h3><div class="ov11-sorteerlijnen">
            ${oplossingen ? `<b>${passend}</b>` : Array.from({ length: Math.max(3, woordenInKolom.length) }, () => this._lijn(cfg, "")).join("")}
          </div></section>`;
        }).join("");
        return `${paginaWissel}<div class="ov11-sorteer ov11-sorteer-pagina" style="--kolommen:${groep.length}">${kolommen}</div>`;
      }).join("");
      return `<div class="ov11-woordbank ov11-onvolledige-woorden">${opgaven}</div>
        ${kolomPaginas}
        <div class="ov11-zin-extra"><b>Extra:</b> Kies één woord uit de oefening en maak er een goede zin mee.<small>Denk aan een hoofdletter en een leesteken.</small>${zinLijnen}</div>`;
    },

    _uitbreiding(woorden, cfg, oplossingen) {
      const zinnen = woorden.slice(0, 5);
      return `<div class="ov11-zinnen ov11-eigen-zinnen">${zinnen.map((w, i) => `${i === 3 ? '<div class="pagina-break-voor ov11-pagina2-spatie"><b>Vervolg — maak nog twee goede zinnen.</b></div>' : ''}<div class="ov11-zin ov11-eigen-zin">
        <div class="ov11-zin-kop"><b>${i + 1}.</b><span class="ov11-zin-woord">${w.tekst}</span></div>
        ${oplossingen
          ? `<div class="ov11-oplossing">Eigen zin. Controleer: betekenis, hoofdletter, persoonsvorm en leesteken.</div>`
          : `${this._langeLijn(cfg)}${this._langeLijn(cfg)}`}
      </div>`).join("")}</div>`;
    },

    _woorden() {
      const raw = window._weekdictee_gekozenWoorden || [];
      const bib = window.SpellingWoordenbibliotheek?.graad2 || {};
      return raw.filter(w => CATS.includes(w.categorie)).map(w => ({
        ...w, ...(bib[w.categorie]?.woorden?.find(x => x.tekst === w.tekst) || {})
      }));
    },
    _deel(w) { return w.voorvoegsel || w.achtervoegsel || ""; },
    _rest(w, deel) { return w.voorvoegsel ? w.tekst.slice(deel.length) : w.tekst.slice(0, -deel.length); },
    _onvolledigWoord(w, rest) { return w.voorvoegsel ? `<span class="ov11-gat">___</span>${rest}` : `${rest}<span class="ov11-gat">___</span>`; },
    _gemarkeerdWoord(w) {
      const deel = this._deel(w), rest = this._rest(w, deel);
      return w.voorvoegsel ? `<span class="ov11-markering">${deel}</span>${rest}` : `${rest}<span class="ov11-markering">${deel}</span>`;
    },
    _deelKeuzes(w) { return this._schud([...(w.voorvoegsel ? VOORVOEGSELS : ACHTERVOEGSELS)]); },
    _lijn(cfg, antwoord) {
      const canvas = window.SpellingSchrijflijnen?.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, 250) || '<span class="ov08-fallback-lijn-inline"></span>';
      return `<div class="ov11-lijn">${antwoord ? `<span>${antwoord}</span>` : ""}${canvas}</div>`;
    },
    _langeLijn(cfg) {
      const canvas = window.SpellingSchrijflijnen?.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, 650) || '<div class="ov07-fallback-lijn ov08-fallback-lijn"></div>';
      return `<div class="ov11-lijn ov11-lange-lijn">${canvas}</div>`;
    },
    _kies(pool, aantal) { return this._schud([...pool]).slice(0, aantal); },
    _kiesGebalanceerd(pool, aantal) {
      const groepen = new Map();
      this._schud([...pool]).forEach(w => {
        const deel = this._deel(w);
        if (!groepen.has(deel)) groepen.set(deel, []);
        groepen.get(deel).push(w);
      });
      const uit = [], rijen = [...groepen.values()];
      while (uit.length < aantal && rijen.some(rij => rij.length)) {
        for (const rij of rijen) {
          if (rij.length && uit.length < aantal) uit.push(rij.shift());
        }
      }
      return uit;
    },
    _schud(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
  };

  window.SpellingModules = window.SpellingModules || {};
  window.SpellingModules.ov11 = OV11;
})();

/* OV13 — hoofdletters en leestekens (graad 2). */
(function () {
  "use strict";
  const CAT = "hoofdletters-g2";
  const M = {
    naam: "ov13", graad: 2,
    oefenvormenPerNiveau: ["basis", "kern", "verdieping", "uitbreiding"],
    _maxPerNiveau: { basis: 6, kern: 6, verdieping: 6, uitbreiding: 6 },
    renderInstellingen() { return ""; },

    genereerBlad(opties, oplossingen) {
      const o = opties?.ov13 || opties || {};
      const niveau = o.niveaus?.[0] || o.niveau || "basis";
      const cfg = { lijntype: o.lijntype || "type3", lijnhoogte: o.lijnhoogte || "middel" };
      const keuze = this._gekozenOnderdelen();
      const woorden = this._woorden();
      const zinnen = this._oefenzinnen(woorden, keuze);
      const tekenNamen = [
        keuze.eind ? "punt, vraagteken en uitroepteken" : "",
        keuze.binnen ? "komma en dubbele punt" : ""
      ].filter(Boolean).join("; ");
      const uitleg = {
        basis: [
          keuze.hoofdletters ? "De gekleurde woorden beginnen met een hoofdletter." : "Lees elke zin aandachtig.",
          `De gekleurde vakjes tonen deze leestekens: ${tekenNamen}.`,
          "Schrijf elke zin volledig correct over."
        ],
        kern: [
          keuze.hoofdletters ? "Hoofdletters en de gekozen leestekens ontbreken." : "De gekozen leestekens ontbreken.",
          `Plaats zelf: ${tekenNamen}.`,
          "Schrijf elke zin correct over."
        ],
        verdieping: [
          keuze.hoofdletters ? "Zoek de fouten bij hoofdletters en de gekozen leestekens." : "Zoek waar de gekozen leestekens ontbreken.",
          `Let op: je oefent ${tekenNamen}.`,
          "Schrijf elke zin correct over."
        ],
        uitbreiding: [
          "Verbeter het hele tekstje.",
          keuze.hoofdletters ? `Denk aan hoofdletters en aan ${tekenNamen}.` : `Plaats ${tekenNamen} op de juiste plaats.`
        ]
      }[niveau];
      const sterren = { basis: "⭐", kern: "⭐⭐", verdieping: "⭐⭐⭐", uitbreiding: "⭐⭐⭐⭐" }[niveau];
      const titel = keuze.hoofdletters ? "Hoofdletters en leestekens" : "Leestekens";
      const inhoud = niveau === "uitbreiding"
        ? this._tekst(zinnen, cfg, oplossingen, keuze)
        : this._zinnen(zinnen, cfg, oplossingen, niveau, keuze);
      return `<div class="werkblad ov13-blad lijnhoogte-${cfg.lijnhoogte}" data-niveau="${niveau}">
        <div class="ov01-header"><div class="ov01-naam-rij"><span>Naam:</span><span class="ov01-lijn-naam"></span><span>Datum:</span><span class="ov01-lijn-datum"></span></div>
        <h2 class="ov01-titel">${titel} <span class="ov01-niveau-badge">${sterren}</span>${oplossingen ? '<span class="oplossingen-badge">OPLOSSINGEN</span>' : ''}</h2></div>
        <div class="ov01-stappen"><div class="ov01-stappen-label">Opdracht:</div>${uitleg.map(x => `<div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>${x}</span></div>`).join("")}</div>
        ${inhoud}<div class="ov01-voettekst">www.jufzisa.be — Juf Zisa's spellinggenerator</div></div>`;
    },

    _zinnen(zinnen, cfg, oplossingen, niveau, keuze) {
      return `<div class="ov13-zinnen">${zinnen.map((correct, i) => {
        const oefenzin = niveau === "basis" ? this._metHints(correct, keuze)
          : niveau === "kern" ? this._zonderGekozen(correct, keuze)
          : this._metGemengdeFouten(correct, i, keuze);
        return `<div class="ov13-zin"><div class="ov13-foute-zin"><b>${i + 1}.</b> ${oefenzin}</div>
          ${oplossingen ? `<div class="ov13-oplossing">${correct}</div>` : `${this._langeLijn(cfg)}${this._langeLijn(cfg)}`}</div>`;
      }).join("")}</div>`;
    },

    _tekst(zinnen, cfg, oplossingen, keuze) {
      const fout = zinnen.map((zin, i) => this._metGemengdeFouten(zin, i, keuze)).join("<br>");
      const correct = zinnen.join(" ");
      const lijnen = Array.from({ length: 10 }, () => this._langeLijn(cfg)).join("");
      return `<div class="ov13-tekst"><h3>Verbeter dit tekstje</h3><p>${fout}</p></div>
        <div class="ov13-herschrijf"><h3>Schrijf het tekstje correct over</h3>${oplossingen ? `<div class="ov13-oplossing ov13-oplossing-tekst">${correct}</div>` : lijnen}</div>`;
    },

    _oefenzinnen(woorden, keuze) {
      const namen = this._vanType(woorden, "eigennaam", ["Anna", "Liam"]);
      const plaatsen = this._vanType(woorden, "geografisch", ["Brussel", "Gent", "Brugge"]);
      const taal = this._vanType(woorden, "taal", ["Nederlands"])[0];
      const feest = this._vanType(woorden, "feestdag", ["Kerstmis"])[0];
      const richting = this._richting(this._vanType(woorden, "windstreek", ["Oost"])[0]);
      if (keuze.binnen && !keuze.eind) return [
        `${namen[0]}, kom je meteen naar binnen?`,
        "Neem dit mee: een boek, een schrift en een pen.",
        "In mijn tas zitten een boek, een schrift en een pen.",
        `${namen[1]} zegt: morgen spreek ik ${taal}.`,
        "Op tafel liggen appels, peren en bananen.",
        `${feest} versieren we met dit materiaal: slingers, sterren en lichtjes.`
      ];
      if (keuze.eind && !keuze.binnen) return [
        `${namen[0]} woont in ${plaatsen[0]}.`,
        `Spreekt ${namen[1]} ook ${taal}?`,
        `Wat leuk dat we ${feest} vieren!`,
        `Kom je morgen naar ${plaatsen[1]}?`,
        "Pas op voor die grote bal!",
        `De wind komt vandaag uit het ${richting}.`
      ];
      return [
        `${namen[0]} woont in ${plaatsen[0]}.`,
        `Spreekt ${namen[1]} ook ${taal}?`,
        `Wat leuk, morgen vieren we ${feest}!`,
        `${namen[0]}, kom je meteen naar binnen?`,
        "Neem dit mee: een boek, een schrift en een pen.",
        `De wind komt vandaag uit het ${richting}.`
      ];
    },

    _metHints(correct, keuze) {
      let html = keuze.hoofdletters ? correct.toLowerCase() : correct;
      const hoofdletters = correct.match(/(?:^|\s|,\s|:\s)([A-ZÀ-ÖØ-Þ][\p{L}'’-]*)/gu) || [];
      for (const deel of (keuze.hoofdletters ? hoofdletters : [])) {
        const woord = deel.trim().replace(/^[:,]\s*/, "");
        html = html.replace(new RegExp(this._escape(woord.toLowerCase()), "u"), `<span class="ov13-hulpwoord">${woord.toLowerCase()}</span>`);
      }
      return this._vervangGekozenTekens(html, keuze, teken => `<span class="ov13-tekenhint" data-teken="${teken}">□</span>`);
    },
    _zonderGekozen(correct, keuze) {
      const basis = keuze.hoofdletters ? correct.toLowerCase() : correct;
      return this._vervangGekozenTekens(basis, keuze, () => "");
    },
    _metGemengdeFouten(correct, index, keuze) {
      let zin = this._zonderGekozen(correct, keuze);
      if (keuze.hoofdletters && index % 2 === 0) zin = zin.replace(/\b(boek|schrift|pen|binnen)\b/, w => w.charAt(0).toUpperCase() + w.slice(1));
      if (keuze.hoofdletters && index % 3 === 1) zin = zin.charAt(0).toUpperCase() + zin.slice(1);
      return zin;
    },
    _vervangGekozenTekens(zin, keuze, vervanger) {
      const tekens = `${keuze.binnen ? ",:" : ""}${keuze.eind ? ".!?" : ""}`;
      if (!tekens) return zin;
      return zin.replace(new RegExp(`[${this._escape(tekens)}]`, "g"), vervanger);
    },
    _gekozenOnderdelen() {
      const ids = Array.isArray(window._spellingCategorieIdsSnapshot)
        ? window._spellingCategorieIdsSnapshot
        : (window._weekdictee_gekozenWoorden || []).map(w => w.categorie);
      const cats = new Set(ids);
      const hoofdletters = cats.has(CAT);
      let eind = cats.has("leestekens-eind-g2");
      let binnen = cats.has("leestekens-binnen-g2");
      if (hoofdletters && !eind && !binnen) { eind = true; binnen = true; }
      return { hoofdletters, eind, binnen };
    },
    _richting(woord) {
      return ({ noord: "noorden", zuid: "zuiden", oost: "oosten", west: "westen" })[String(woord).toLowerCase()] || String(woord).toLowerCase();
    },
    _vanType(woorden, type, fallback) {
      const lijst = woorden.filter(w => w.type_hl === type).map(w => w.tekst);
      return Array.from({ length: fallback.length }, (_, i) => lijst[i] || fallback[i]);
    },
    _escape(tekst) { return tekst.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); },
    _woorden() {
      const raw = window._weekdictee_gekozenWoorden || [];
      const bib = window.SpellingWoordenbibliotheek?.graad2?.[CAT]?.woorden || [];
      const gekozen = raw.filter(w => w.categorie === CAT).map(w => ({ ...w, ...(bib.find(x => x.tekst === w.tekst) || {}), categorie: CAT, leerjaar: 2 }));
      return gekozen.length ? gekozen : bib.map(w => ({ ...w, categorie: CAT, leerjaar: 2 }));
    },
    _langeLijn(cfg) {
      const canvas = window.SpellingSchrijflijnen?.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, 650) || '<div class="ov07-fallback-lijn"></div>';
      return `<div class="ov13-lange-lijn">${canvas}</div>`;
    }
  };
  window.SpellingModules = window.SpellingModules || {};
  window.SpellingModules.ov13 = M;
})();

/* OV15 — gedifferentieerd oefenen met onthoudwoorden (graad 2). */
(function () {
  "use strict";

  const KLANK = { "ei-g2": "ei", "ij-g2": "ij", "au-g2": "au", "ou-g2": "ou" };
  const LEEN_FOCUS = ["eau", "ette", "oir", "age", "tion", "gn", "ai", "au", "ou", "ch", "ck", "ey", "y", "zz", "gh", "ao", "io", "oe", "ee"];

  const M = {
    naam: "Onthoudwoorden oefenen",
    graad: 2,
    oefenvormenPerNiveau: ["basis", "kern", "verdieping", "uitbreiding"],
    _maxPerNiveau: { basis: 12, kern: 8, verdieping: 6, uitbreiding: 8 },
    renderInstellingen() { return ""; },

    genereerBlad(opties, oplossingen) {
      const o = opties?.ov15 || opties || {};
      const niveau = o.niveaus?.[0] || o.niveau || "basis";
      const cfg = { lijntype: o.lijntype || "type3", lijnhoogte: o.lijnhoogte || "middel" };
      const cats = this._cats();
      const woorden = this._woorden(cats);
      if (!woorden.length) return '<div class="werkblad ov15-blad">Geen passende onthoudwoorden beschikbaar.</div>';

      const uitleg = {
        basis: ["Lees de volledige woorden.", "Kleur in elk woord het moeilijke woordstuk.", "Sorteer of schrijf de woorden zoals aangegeven."],
        kern: ["Lees het onvolledige woord.", "Kleur de juiste schrijfwijze.", "Schrijf daarna het volledige woord correct over."],
        verdieping: ["Lees de zin en vul het ontbrekende woordstuk in.", "Schrijf daarna het volledige woord correct op."],
        uitbreiding: ["Zoek de fout geschreven onthoudwoorden in het tekstje.", "Schrijf het hele tekstje correct over."]
      }[niveau];
      const sterren = { basis: "⭐", kern: "⭐⭐", verdieping: "⭐⭐⭐", uitbreiding: "⭐⭐⭐⭐" }[niveau];
      const ws = woorden.slice(0, this._maxPerNiveau[niveau]);
      const inhoud = niveau === "basis" ? this._herkennen(ws, cats, cfg, oplossingen)
        : niveau === "kern" ? this._kiezen(ws, cats, cfg, oplossingen)
        : niveau === "verdieping" ? this._zinnen(ws, cfg, oplossingen)
        : this._tekst(cats, cfg, oplossingen);

      return `<div class="werkblad ov15-blad lijnhoogte-${cfg.lijnhoogte}" data-niveau="${niveau}">
        <div class="ov01-header"><div class="ov01-naam-rij"><span>Naam:</span><span class="ov01-lijn-naam"></span><span>Datum:</span><span class="ov01-lijn-datum"></span></div>
        <h2 class="ov01-titel">Onthoudwoorden <span class="ov01-niveau-badge">${sterren}</span>${oplossingen ? '<span class="oplossingen-badge">OPLOSSINGEN</span>' : ""}</h2></div>
        <div class="ov01-stappen"><div class="ov01-stappen-label">Opdracht:</div>${uitleg.map(x => `<div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>${x}</span></div>`).join("")}</div>
        ${inhoud}<div class="ov01-voettekst">www.jufzisa.be — Juf Zisa's spellinggenerator</div></div>`;
    },

    _herkennen(ws, cats, cfg, opl) {
      const enkelKlanken = cats.every(c => KLANK[c]);
      if (enkelKlanken) {
        const delen = [...new Set(cats.map(c => KLANK[c]))];
        return `<div class="ov15-woordbank">${ws.map(w => this._markeer(w, opl)).join(" · ")}</div>
          <div class="ov15-kolommen" style="--kolommen:${delen.length}">${delen.map(k => `<section><h3>${k}</h3>${opl
            ? `<div class="ov15-sorteeroplossing">${ws.filter(w => this._focus(w) === k).map(w => w.tekst).join("<br>")}</div>`
            : Array.from({ length: Math.max(3, Math.ceil(ws.length / delen.length)) }, () => this._lijn(cfg)).join("")}</section>`).join("")}</div>`;
      }
      const groepen = cats.length === 1 && cats.includes("teit-heid-g2") ? ["-teit", "-heid"] : [];
      if (groepen.length) {
        return `<div class="ov15-woordbank">${ws.map(w => this._markeer(w, opl)).join(" · ")}</div>
          <div class="ov15-kolommen" style="--kolommen:2">${groepen.map(g => `<section><h3>${g}</h3>${opl
            ? `<div class="ov15-sorteeroplossing">${ws.filter(w => w.tekst.endsWith(g.slice(1))).map(w => w.tekst).join("<br>")}</div>`
            : Array.from({ length: Math.max(4, Math.ceil(ws.length / 2)) }, () => this._lijn(cfg)).join("")}</section>`).join("")}</div>`;
      }
      return `<div class="ov15-grid ov15-leen-herkennen">${ws.map(w => `<div class="ov15-kaart"><b>${this._markeer(w, opl)}</b><div class="ov15-hint">Kleur het moeilijke stuk.</div>${opl ? "" : this._lijn(cfg)}</div>`).join("")}</div>`;
    },

    _kiezen(ws, cats, cfg, opl) {
      return `<div class="ov15-grid">${ws.map(w => {
        const juist = this._focus(w);
        const keuzes = this._keuzes(w, cats);
        const gat = this._vervangEerste(w.tekst, juist, "___");
        return `<div class="ov15-kaart"><b>${gat}</b><div class="ov15-keuzes">${keuzes.map(x => `<span class="${opl && x === juist ? "juist" : ""}">${x}</span>`).join("")}</div>${opl ? `<div class="ov15-oplossing">${w.tekst}</div>` : this._lijn(cfg)}</div>`;
      }).join("")}</div>`;
    },

    _zinnen(ws, cfg, opl) {
      return `<div class="ov15-zinnen">${ws.map((w, i) => {
        const focus = this._focus(w);
        const zin = this._context(w.tekst).replace(`{${w.tekst}}`, this._vervangEerste(w.tekst, focus, "___"));
        return `<div class="ov15-zin"><b>${i + 1}.</b> ${zin}${opl ? `<div class="ov15-oplossing">${w.tekst}</div>` : this._lijn(cfg)}</div>`;
      }).join("")}</div>`;
    },

    _tekst(cats, cfg, opl) {
      let correct;
      if (cats.includes("leenwoorden-g2")) {
        correct = "In het weekend gaat Noor met haar team naar het station. Op het perron zet ze haar bagage naast een fauteuil. Haar manager stuurt een e-mail met de route. Na de reis eten ze pizza en een dessert. Noor maakt met haar laptop een kort verslag.";
      } else if (cats.includes("teit-heid-g2")) {
        correct = "Tijdens de activiteit onderzoekt Noor de kwaliteit van het water. Voor haar veiligheid draagt ze handschoenen. Ze meet de snelheid van de stroom en noteert iedere mogelijkheid. De klas bespreekt daarna het belang van gezondheid en vrijheid.";
      } else {
        const ei = cats.some(c => c === "ei-g2" || c === "ij-g2");
        const au = cats.some(c => c === "au-g2" || c === "ou-g2");
        correct = ei && au
          ? "Op vrijdag maakt Noor een reis met de trein. Op het plein ziet ze een pauw met een blauwe staart. Tijdens de pauze eet ze rijst met saus. Ze houdt haar tas stevig vast en schrijft aan het einde alles op een lijn."
          : ei
            ? "Op vrijdag maakt Noor een reis met de trein. Ze kijkt naar de weide en ziet vijf geiten. Op het plein koopt ze een klein ijsje. Aan het einde schrijft ze alles netjes op een lijn."
            : "Een pauw zit op een oude houten schutting. Zijn blauwe staart hangt naast een touw. Een vrouw zet een kom saus op tafel. De pauw miauwt luid en krijgt applaus.";
      }
      const fout = this._maakTekstFout(correct, cats);
      return `<div class="ov15-tekst"><h3>Zoek de fouten</h3><p>${opl ? correct : fout}</p></div>
        <div class="ov15-herschrijf"><h3>Schrijf het tekstje correct over</h3>${opl ? `<div class="ov15-oplossing">${correct}</div>` : Array.from({ length: 10 }, () => this._lijn(cfg)).join("")}</div>`;
    },

    _focus(w) {
      if (KLANK[w.categorie]) return KLANK[w.categorie];
      if (w.categorie === "teit-heid-g2") return w.tekst.endsWith("teit") ? "teit" : "heid";
      const lower = w.tekst.toLowerCase();
      return LEEN_FOCUS.find(x => lower.includes(x)) || lower.slice(Math.max(0, lower.length - 2));
    },
    _keuzes(w, cats) {
      const juist = this._focus(w);
      let bron;
      if (KLANK[w.categorie]) bron = [...new Set(cats.map(c => KLANK[c]).filter(Boolean))];
      else if (w.categorie === "teit-heid-g2") bron = ["teit", "heid"];
      else {
        const wissels = { eau: ["oo", "o"], ette: ["et", "ete"], oir: ["oor", "or"], age: ["aazje", "asje"], tion: ["sion", "sjon"], gn: ["nj", "n"], ai: ["ei", "ij"], au: ["ou", "auw"], ou: ["au", "ouw"], ch: ["sj", "s"], ck: ["k", "kk"], ey: ["ij", "ie"], y: ["ie", "i"], zz: ["z", "s"], gh: ["g", "ch"], ao: ["au", "o"], io: ["ijo", "ieo"], oe: ["u", "ou"], ee: ["ie", "e"] };
        bron = [juist, ...(wissels[juist] || [juist.slice(0, 1), juist + juist.slice(-1)])];
      }
      return [...new Set([juist, ...bron])].slice(0, 3).sort(() => Math.random() - 0.5);
    },
    _markeer(w, toon) {
      const f = this._focus(w);
      return toon ? this._vervangEerste(w.tekst, f, `<span class="ov15-focus">${f}</span>`) : w.tekst;
    },
    _maakTekstFout(tekst, cats) {
      const wissels = [
        ["teit", "tijd", "teit-heid-g2"], ["heid", "hijd", "teit-heid-g2"],
        ["station", "stasjon", "leenwoorden-g2"], ["weekend", "wiekend", "leenwoorden-g2"],
        ["team", "tiem", "leenwoorden-g2"], ["bagage", "bagaazje", "leenwoorden-g2"],
        ["fauteuil", "fotuil", "leenwoorden-g2"], ["e-mail", "iemeel", "leenwoorden-g2"],
        ["route", "roete", "leenwoorden-g2"], ["pizza", "piza", "leenwoorden-g2"],
        ["dessert", "desert", "leenwoorden-g2"], ["laptop", "leptop", "leenwoorden-g2"],
        ["ei", "ij", "ei-g2"], ["ij", "ei", "ij-g2"],
        ["au", "ou", "au-g2"], ["ou", "au", "ou-g2"]
      ];
      let resultaat = tekst;
      wissels.forEach(([goed, fout, categorie]) => {
        if (cats.includes(categorie)) resultaat = resultaat.replace(new RegExp(goed, "i"), fout);
      });
      return resultaat;
    },
    _vervangEerste(tekst, zoek, vervang) { const i = tekst.toLowerCase().indexOf(zoek.toLowerCase()); return i < 0 ? tekst : tekst.slice(0, i) + vervang + tekst.slice(i + zoek.length); },
    _context(w) {
      const d = { kwaliteit: "De {kwaliteit} van deze stevige jas is uitstekend.", identiteit: "Op haar kaart staat haar {identiteit} vermeld.", universiteit: "Mijn zus studeert aan de {universiteit}.", activiteit: "Vandaag doen we een leuke {activiteit} met de klas.", specialiteit: "Verse soep is de {specialiteit} van deze kok.", snelheid: "De politie controleert de {snelheid} van de auto.", veiligheid: "Voor onze {veiligheid} dragen we een helm.", gezondheid: "Bewegen is goed voor je {gezondheid}.", vrijheid: "In {vrijheid} mogen leven is belangrijk.", mogelijkheid: "Er is nog één {mogelijkheid} om te winnen.", aubergine: "De kok snijdt een paarse {aubergine} in stukken.", mayonaise: "Noor doet een beetje {mayonaise} op haar frieten.", croissant: "Bij het ontbijt eet ik een warme {croissant}.", parfum: "De {parfum} ruikt naar bloemen.", fauteuil: "Opa leest zijn boek in de zachte {fauteuil}.", bureau: "Mijn schrift ligt op het {bureau}.", garage: "Papa zet de auto in de {garage}.", bagage: "Onze {bagage} staat klaar voor de reis.", station: "De trein wacht in het {station}.", laptop: "Ik maak mijn taak op de {laptop}.", hockey: "Mijn broer speelt {hockey} op zaterdag.", weekend: "In het {weekend} bezoeken we oma.", pizza: "We verdelen de warme {pizza} in stukken.", spaghetti: "Vanavond eten we {spaghetti} met saus.", cacao: "Mama doet {cacao} in de chocolademelk.", koala: "De {koala} zit hoog in de boom.", kiwi: "Ik snijd de {kiwi} doormidden.", sushi: "In het restaurant proeft Noor {sushi}." };
      return d[w] || `Schrijf het onthoudwoord {${w}} volledig en correct.`;
    },
    _cats() { const ids = Array.isArray(window._spellingCategorieIdsSnapshot) ? window._spellingCategorieIdsSnapshot : (window.SpellingZijbalk?.getAangevinkteCategorieIds?.() || []); return ids.filter(id => window.SpellingWoordenbibliotheek?.graad2?.[id]?.hoofdgroep === "onthoudwoord"); },
    _woorden(cats) { return (window._weekdictee_gekozenWoorden || []).filter(w => cats.includes(w.categorie)); },
    _lijn(cfg) { const c = window.SpellingSchrijflijnen?.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, 650) || '<div class="ov07-fallback-lijn"></div>'; return `<div class="ov15-lijn">${c}</div>`; }
  };
  window.SpellingModules = window.SpellingModules || {};
  window.SpellingModules.ov15 = M;
})();

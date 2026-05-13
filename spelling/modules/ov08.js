/* ============================================================
   OV08 — MEERVOUDEN ZUIVER
   
   4 niveaus:
   ⭐    Oefenen      : grondwoord + 2 keuzes (-en/-s) + schrijflijn
   ⭐⭐   Toepassen   : "1 huis → veel ___" (telwoord wisselt)
   ⭐⭐⭐  Verdiepen   : 2 kolommen, om beurten kolom leeg
   ⭐⭐⭐⭐ Uitbreiden  : verhaal met enkelvouden, kind schrijft meervouden
   
   Architectuur identiek aan ov07.js — split files, schrijflijnen,
   bundel-API, etc.
   ============================================================ */

(function () {
  "use strict";

  const OV08 = {
    naam: "ov08",
    graad: 1,
    oefenvormenPerNiveau: ["basis", "kern", "verdieping", "uitbreiding"],

    /* Telwoorden + bepalers die we wisselend gebruiken bij ⭐⭐ Toepassen */
    TELWOORDEN: [
      "veel", "twee", "drie", "vier", "vijf", "zes", "zeven",
      "enkele", "sommige", "alle", "vele"
    ],

    /* Categorieën waaruit OV08 zijn woorden mag halen.
       Alle 4 meervoud-categorieën — leerkracht kiest zelf welke. */
    CAT_TOEGESTAAN: ["meervoud-en", "meervoud-s", "meervoud-verdubbel", "meervoud-verenkel"],

    /* Voorbeeldverhaaltjes voor ⭐⭐⭐⭐ Uitbreiden.
       Elk verhaal: 5 zinnen waarin gemarkeerde zn's (tussen *sterretjes*)
       in enkelvoud staan. Kind herschrijft in meervoud, rest blijft gelijk.
       
       PEDAGOGISCH PRINCIPE (graad 1):
       Enkel het gemarkeerde woord mag veranderen — rest van de zin NIET.
       Dat betekent:
       - Geen "de/het" vóór gemarkeerde woorden (lidwoord moet wisselen)
       - Geen bijvoeglijke nw vóór gemarkeerde woorden (buigen)
       - Veilige contexten: "een ...", "mijn/haar/zijn ...", als opsomming,
         na "twee/drie/veel/enkele" (telwoord blijft staan).
       
       WOORDEN STRIKT UIT meervoud-zuiver. */
    VERHALEN: [
      {
        titel: "Lien in de tuin",
        zinnen: [
          "Lien ziet drie *bloem* in de tuin.",
          "Naast haar groeit ook een *struik*.",
          "Op de takken zitten kleine *bij*.",
          "Boven haar hoofd vliegen twee *meeuw*.",
          "Lien plukt vier *plant* voor mama."
        ]
      },
      {
        titel: "Tom op straat",
        zinnen: [
          "Tom ziet veel *huis* in zijn dorp.",
          "Voor elk *huis* staat een *bloem*.",
          "Naast hem rijden twee *trein*.",
          "In de lucht zweven witte *wolk*.",
          "Tom zwaait naar drie *jongen*."
        ]
      },
      {
        titel: "Sara bij oma",
        zinnen: [
          "Bij oma staan vele *kast*.",
          "In de kast liggen oude *boek*.",
          "Op tafel ligt een rij *lepel*.",
          "Sara ziet drie *appel* in een schaal.",
          "Buiten loeien twee *koe* in de wei."
        ]
      },
      {
        titel: "Sam in het bos",
        zinnen: [
          "Sam wandelt langs hoge *berg*.",
          "In het bos vliegen vrolijke *vlinder*.",
          "Achter een *struik* sprong een *kikker*.",
          "Boven de bomen zweven traag *meeuw*.",
          "Sam telt vijf *bloem* op zijn pad."
        ]
      },
      {
        titel: "Pim in de winkel",
        zinnen: [
          "Pim ziet veel *appel* in de winkel.",
          "Naast hem staan drie *emmer*.",
          "Aan de muur hangen lange *ladder*.",
          "Op de balie liggen twee *sleutel*.",
          "Achter de toonbank staan twee *dokter*."
        ]
      }
    ],

    /* ---------- INSTELLINGEN PANEEL ---------- */
    renderInstellingen: function () {
      // Geen apart instelpaneel — alles via zijbalk-niveaus.
      // (Gebruikt als placeholder voor generator.js, mag leeg blijven.)
      return "";
    },

    /* ---------- HOOFD-GENERATOR ---------- */
    genereerBlad: function (opties, metAntwoorden) {
      // Gebruik this._seed als die door bundel al gezet is, anders uit opties,
      // anders een random fallback. NIET altijd overschrijven, want dan zou
      // bij +1 woord een nieuwe shuffle ontstaan.
      const basisSeed = (typeof this._seed === "number" && this._seed !== null)
        ? this._seed
        : ((opties && typeof opties.seed === "number") ? opties.seed : Math.floor(Math.random() * 1e9));

      // Lees uit opties.ov08 sub-object (zoals bundel het bouwt),
      // val terug op opties direct voor backwards-compat.
      const o = (opties && opties.ov08) || opties || {};
      const niveaus = (o.niveaus && o.niveaus.length > 0) ? o.niveaus : [o.niveau || (opties && opties.niveau) || "basis"];
      const niveau = niveaus[0];
      const aantal = o.aantalWoorden || o.aantal || 8;
      const cfg = {
        lijntype: o.lijntype || "type3",
        lijnhoogte: o.lijnhoogte || "middel",
        verhaalIdx: o.verhaalIdx || 0
      };

      // Niveau-specifieke seed-offset zodat dezelfde woorden niet altijd
      // dezelfde volgorde krijgen tussen niveaus.
      this._seed = (basisSeed + ({ basis: 0, kern: 1117, verdieping: 2003, uitbreiding: 31 }[niveau] || 0)) & 0xFFFFFFFF;

      // Haal woorden op
      let beschikbaar = this._haalActieveWoorden();
      if (beschikbaar.length === 0) {
        beschikbaar = this._haalAlleMeervoudswoorden();
      }
      if (beschikbaar.length === 0) {
        return `
          <div class="werkblad ov07-blad ov08-blad">
            <div class="ov07-lege-tekst ov08-lege-tekst">
              Geen meervoudswoorden beschikbaar.<br>
              Vink een meervoud-categorie aan in de zijbalk.
            </div>
          </div>`;
      }

      const werkWoorden = this._kiesWoorden(beschikbaar, aantal);

      // Niveau-badge label (zelfde stijl als OV07: sterren)
      const niveauLabel = {
        basis: "⭐",
        kern: "⭐⭐",
        verdieping: "⭐⭐⭐",
        uitbreiding: "⭐⭐⭐⭐"
      }[niveau] || "";

      const oplBadge = metAntwoorden
        ? `<span class="oplossingen-badge">OPLOSSINGEN</span>`
        : "";

      // Header in OV01-stijl (identiek aan OV07): Naam:/Datum: + zwarte titel-balk
      const headerHTML = `
        <div class="ov01-header">
          <div class="ov01-naam-rij">
            <span data-bewerk-id="naamlabel-ov08-${niveau}">Naam:</span>
            <span class="ov01-lijn-naam"></span>
            <span data-bewerk-id="datumlabel-ov08-${niveau}">Datum:</span>
            <span class="ov01-lijn-datum"></span>
          </div>
          <h2 class="ov01-titel" data-bewerk-id="titel-ov08-${niveau}">
            Meervouden
            <span class="ov01-niveau-badge ov01-niveau-${niveau}">${niveauLabel}</span>
            ${oplBadge}
          </h2>
        </div>

        <div class="ov01-stappen">
          <div class="ov01-stappen-label">Opdracht:</div>
          ${this._renderOpdrachtTekst(niveau)}
        </div>`;

      let inhoudHTML = "";
      if (niveau === "basis") {
        inhoudHTML = this._renderBasis(werkWoorden, cfg, metAntwoorden);
      } else if (niveau === "kern") {
        inhoudHTML = this._renderKern(werkWoorden, cfg, metAntwoorden);
      } else if (niveau === "verdieping") {
        inhoudHTML = this._renderVerdieping(werkWoorden, cfg, metAntwoorden);
      } else if (niveau === "uitbreiding") {
        inhoudHTML = this._renderUitbreiding(cfg, metAntwoorden);
      }

      return `
        <div class="werkblad ov07-blad ov08-blad lijnhoogte-${cfg.lijnhoogte}" data-lijntype="${cfg.lijntype}" data-lijnhoogte="${cfg.lijnhoogte}" data-niveau="${niveau}">
          ${headerHTML}
          ${inhoudHTML}
          <div class="ov01-voettekst">www.jufzisa.be — Juf Zisa's spellinggenerator</div>
        </div>`;
    },

    _niveauUitleg: function (niveau) {
      return {
        basis:       "⭐ Oefenen — kies -en of -s, schrijf het meervoud",
        kern:        "⭐⭐ Toepassen — schrijf het meervoud achter de pijl",
        verdieping:  "⭐⭐⭐ Verdiepen — vul het ontbrekende woord in",
        uitbreiding: "⭐⭐⭐⭐ Uitbreiden — schrijf het verhaaltje in meervoud"
      }[niveau] || "";
    },

    _renderOpdrachtTekst: function (niveau) {
      const stappen = {
        basis: [
          "Lees het grondwoord.",
          "Kies of er -en of -s achter komt.",
          "Schrijf het meervoud op de lijn."
        ],
        kern: [
          "Lees het woord voor de pijl.",
          "Schrijf het meervoud achter de pijl.",
          "Let op of er -en of -s achter moet."
        ],
        verdieping: [
          "Kijk goed: welk vakje is leeg?",
          "Soms moet je het meervoud schrijven, soms het enkelvoud.",
          "Schrijf het in het lege vakje."
        ],
        uitbreiding: [
          "Lees elke zin goed.",
          "Vul het meervoud in op de lijn.",
          "Schrijf onderaan zelf 3 zinnen met een meervoud."
        ]
      }[niveau] || [];

      return stappen.map(s => `
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>${s}</span></div>`).join("");
    },

    /* ⭐ OEFENEN — verticale cel-layout (woord boven, keuzes onder, lijn onder),
       2 cellen naast elkaar in een grid → compacter blad. */
    _renderBasis: function (woorden, cfg, metAntwoorden) {
      const sl = window.SpellingSchrijflijnen;

      let rijenHTML = "";
      for (const w of woorden) {
        const juiste = this._uitgangVan(w);
        const keuzes = ["en", "s"].map(uit => {
          const isJuist = (uit === juiste);
          const klasse = (metAntwoorden && isJuist)
            ? "ov07-uitgang-keuze ov08-uitgang-keuze ov07-uitgang-juist ov08-uitgang-juist"
            : "ov07-uitgang-keuze ov08-uitgang-keuze";
          return `<span class="${klasse}">-${uit}</span>`;
        }).join("");

        const meervoud = w.meervoud || (w.tekst + juiste);

        const antwoord = metAntwoorden
          ? `<span class="ov07-lijn-antwoord ov08-lijn-antwoord">${meervoud}</span>`
          : "";

        const canvas = sl
          ? sl.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, 220)
          : `<div class="ov07-fallback-lijn ov08-fallback-lijn"></div>`;

        rijenHTML += `
          <div class="ov07-cel ov08-cel ov07-cel-basis ov08-cel-basis" data-woord="${w.tekst}">
            <button class="rij-verwijder-knop" data-woord="${w.tekst}" title="Verwijder dit woord" type="button">✕</button>
            <div class="ov07-grondwoord ov08-grondwoord">${w.tekst}</div>
            <div class="ov07-uitgang-keuzes ov08-uitgang-keuzes">${keuzes}</div>
            <div class="ov07-lijn-cel ov08-lijn-cel">${antwoord}${canvas}</div>
          </div>`;
      }

      return `<div class="ov07-rooster ov08-rooster ov07-rooster-basis ov08-rooster-basis ov07-tweekoloms-cellen ov08-tweekoloms-cellen">${rijenHTML}</div>`;
    },

    /* ⭐⭐ TOEPASSEN — wisselende telwoorden, 2 kolommen */
    _renderKern: function (woorden, cfg, metAntwoorden) {
      const sl = window.SpellingSchrijflijnen;

      let rijenHTML = "";
      woorden.forEach((w, idx) => {
        const juiste = this._uitgangVan(w);
        const meervoud = w.meervoud || (w.tekst + juiste);

        // Wisselend telwoord per rij (deterministisch via seed)
        const telwoord = this.TELWOORDEN[this._intRandom(this.TELWOORDEN.length, idx)];

        const antwoord = metAntwoorden
          ? `<span class="ov07-lijn-antwoord ov08-lijn-antwoord">${meervoud}</span>`
          : "";

        const canvas = sl
          ? sl.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, 200)
          : `<div class="ov07-fallback-lijn ov08-fallback-lijn"></div>`;

        rijenHTML += `
          <div class="ov07-rij ov08-rij ov07-rij-kern ov08-rij-kern" data-woord="${w.tekst}">
            <button class="rij-verwijder-knop" data-woord="${w.tekst}" title="Verwijder dit woord" type="button">✕</button>
            <div class="ov07-grondwoord ov08-grondwoord ov07-kol-woord ov08-kol-woord">1 ${w.tekst}</div>
            <div class="ov07-pijl ov08-pijl">→</div>
            <div class="ov07-telwoord ov08-telwoord">${telwoord}</div>
            <div class="ov07-lijn-cel ov08-lijn-cel ov07-kol-meervoud ov08-kol-meervoud">${antwoord}${canvas}</div>
          </div>`;
      });

      return `
        <div class="ov07-rooster ov08-rooster ov07-rooster-kern ov08-rooster-kern ov07-tweekoloms ov08-tweekoloms">
          ${rijenHTML}
        </div>`;
    },

    /* ⭐⭐⭐ VERDIEPEN — 2 kolommen, om beurten kolom 1 of kolom 2 leeg.
       50/50 verdeling. */
    _renderVerdieping: function (woorden, cfg, metAntwoorden) {
      const sl = window.SpellingSchrijflijnen;

      const helft = Math.ceil(woorden.length / 2);
      const richtingen = woorden.map((_, i) => i < helft ? "vul-meervoud" : "vul-woord");
      this._schud(richtingen);

      let rijenHTML = "";
      woorden.forEach((w, idx) => {
        const juiste = this._uitgangVan(w);
        const meervoud = w.meervoud || (w.tekst + juiste);
        const richting = richtingen[idx];

        let kol1HTML, kol2HTML;
        const canvas = (breedte) => sl
          ? sl.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, breedte)
          : `<div class="ov07-fallback-lijn ov08-fallback-lijn"></div>`;

        if (richting === "vul-meervoud") {
          // Enkelvoud staat klaar in kol1 (gegeven bubble),
          // kind vult meervoud in op de lijn in kol2.
          // Oplossing-tekst hoort op de LIJN in kol2 (meervoud-kant).
          kol1HTML = `<div class="ov07-kol-woord ov08-kol-woord ov07-gegeven ov08-gegeven">${w.tekst}</div>`;
          const antw = metAntwoorden ? `<span class="ov07-lijn-antwoord ov08-lijn-antwoord">${meervoud}</span>` : "";
          kol2HTML = `<div class="ov07-kol-verklein ov08-kol-meervoud">${antw}${canvas(220)}</div>`;
        } else {
          // Meervoud staat klaar in kol2 (gegeven bubble),
          // kind vult enkelvoud in op de lijn in kol1.
          // Oplossing-tekst hoort op de LIJN in kol1 (enkelvoud-kant).
          const antw = metAntwoorden ? `<span class="ov07-lijn-antwoord ov08-lijn-antwoord">${w.tekst}</span>` : "";
          kol1HTML = `<div class="ov07-kol-woord ov08-kol-woord">${antw}${canvas(220)}</div>`;
          kol2HTML = `<div class="ov07-kol-verklein ov08-kol-meervoud ov07-gegeven ov08-gegeven">${meervoud}</div>`;
        }

        rijenHTML += `
          <div class="ov07-rij ov08-rij ov07-rij-verdieping ov08-rij-verdieping" data-woord="${w.tekst}" data-richting="${richting}">
            <button class="rij-verwijder-knop" data-woord="${w.tekst}" title="Verwijder dit woord" type="button">✕</button>
            ${kol1HTML}
            <div class="ov07-pijl ov08-pijl">↔</div>
            ${kol2HTML}
          </div>`;
      });

      return `
        <div class="ov07-rooster ov08-rooster ov07-rooster-verdieping ov08-rooster-verdieping">
          <div class="ov07-kol-koppen ov08-kol-koppen">
            <div class="ov07-kol-kop ov08-kol-kop">enkelvoud</div>
            <div class="ov07-pijl-kop ov08-pijl-kop"></div>
            <div class="ov07-kol-kop ov08-kol-kop">meervoud</div>
          </div>
          ${rijenHTML}
        </div>`;
    },

    /* ⭐⭐⭐⭐ UITBREIDEN — invul-zinnen met (grondwoord) + lijn ernaast,
       + onderaan opdracht "Schrijf zelf 3 zinnen met meervoud". */
    _renderUitbreiding: function (cfg, metAntwoorden) {
      const sl = window.SpellingSchrijflijnen;
      const zb = window.SpellingMeervoudZinnen;
      const self = this;
      
      // Haal 5 random woorden + zinnen op
      const pool = this._haalActieveWoorden();
      const woorden = pool.length > 0 ? pool : this._haalAlleMeervoudswoorden();
      const aantalZinnen = 5;
      
      let zinSet = [];
      if (zb && typeof zb.willekeurigeSet === "function") {
        zinSet = zb.willekeurigeSet(woorden, aantalZinnen, () => this._random());
      }
      
      if (zinSet.length === 0) {
        return `
          <div class="ov08-lege-tekst">
            Geen meervoud-zinnen beschikbaar voor de gekozen woorden.
          </div>`;
      }
      
      // ===== Deel 1: Invul-zinnen =====
      let invulHTML = `<div class="ov08-invul-blok">`;
      invulHTML += `<ol class="ov08-invul-lijst">`;
      
      zinSet.forEach((item, idx) => {
        // Vervang het ____  in de zin met een schrijflijn-canvas
        const grondwoordEsc = self._escapeRe(item.grondwoord);
        const re = new RegExp(`\\(${grondwoordEsc}\\)\\s+_+`, "i");
        
        const lijnBreedte = 180;
        const canvas = sl 
          ? sl.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, lijnBreedte)
          : `<span class="ov08-fallback-lijn-inline"></span>`;
        
        const antwoord = metAntwoorden
          ? `<span class="ov08-invul-antwoord">${item.meervoud}</span>`
          : "";
        
        const lijnHTML = `<span class="ov08-invul-lijn">${antwoord}${canvas}</span>`;
        
        // Behoud de (grondwoord) tekst, vervang alleen de ____ door de lijn
        let zinUI = item.zin.replace(re, `(${item.grondwoord}) ${lijnHTML}`);
        
        invulHTML += `<li class="ov08-invul-zin">${zinUI}</li>`;
      });
      
      invulHTML += `</ol>`;
      invulHTML += `</div>`;
      
      // ===== Deel 2: Eigen 3 zinnen schrijven =====
      let eigenHTML = `<div class="ov08-eigen-blok">`;
      eigenHTML += `<div class="ov08-eigen-titel">Schrijf nu zelf 3 zinnen waarin woorden in het meervoud staan.</div>`;
      
      const eigenLijnen = 3;
      for (let i = 0; i < eigenLijnen; i++) {
        const canvas = sl
          ? sl.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, 580)
          : `<div class="ov07-fallback-lijn ov08-fallback-lijn"></div>`;
        eigenHTML += `<div class="ov07-verhaal-lijn ov08-verhaal-lijn ov08-eigen-lijn">${canvas}</div>`;
      }
      eigenHTML += `</div>`;
      
      return `
        <div class="ov07-uitbreiding-container ov08-uitbreiding-container">
          ${invulHTML}
          ${eigenHTML}
        </div>`;
    },
    
    _escapeRe: function(str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    },

    /* ---------- HELPERS ---------- */

    _uitgangVan: function (w) {
      // Bepaal of het meervoud -en of -s krijgt (gebaseerd op meervoud-veld).
      if (!w.meervoud) return "en";
      if (w.meervoud.endsWith("en")) return "en";
      if (w.meervoud.endsWith("s")) return "s";
      return "en";
    },

    _zoekMeervoud: function (grondwoord) {
      const wb = window.SpellingWoordenbibliotheek;
      const lower = grondwoord.toLowerCase();
      if (wb && wb.graad1) {
        for (const [catId, cat] of Object.entries(wb.graad1)) {
          if (!cat.woorden) continue;
          for (const w of cat.woorden) {
            if (w.tekst === lower && w.meervoud) return w.meervoud;
          }
        }
      }
      // Fallback: heuristiek
      return lower + "en";
    },

    _haalActieveWoorden: function () {
      const wb = window.SpellingWoordenbibliotheek;
      const meervoudCats = this.CAT_TOEGESTAAN;
      // Lees uit de globale woordpool (die door de bundel wordt aangepast via 
      // gekozenWoordenSnapshot). Dit is essentieel zodat rij-verwijderen werkt.
      const pool = window._weekdictee_gekozenWoorden || [];
      
      // Filter op meervoud-cats en verrijk met meervoud-veld uit woordenbib
      return pool
        .filter(w => w.categorie && meervoudCats.includes(w.categorie))
        .map(w => {
          if (w.meervoud) return w;
          // Zoek het meervoud op in de woordenbibliotheek
          if (wb && wb.graad1 && wb.graad1[w.categorie]) {
            const cat = wb.graad1[w.categorie];
            const match = (cat.woorden || []).find(x => x.tekst === w.tekst);
            if (match && match.meervoud) {
              return { ...w, meervoud: match.meervoud };
            }
          }
          return w;
        });
    },

    _haalAlleMeervoudswoorden: function () {
      const wb = window.SpellingWoordenbibliotheek;
      if (!wb || !wb.graad1) return [];
      const uit = [];
      for (const catId of this.CAT_TOEGESTAAN) {
        const cat = wb.graad1[catId];
        if (!cat || !cat.woorden) continue;
        for (const w of cat.woorden) {
          uit.push({ ...w, categorie: catId, leerjaar: 1 });
        }
      }
      return uit;
    },

    _kiesWoorden: function (pool, aantal) {
      // Zelfde aanpak als OV07: één voor één willekeurig element pakken.
      // Bij dezelfde seed levert dit dezelfde reeks op tot grootte N,
      // zodat bij +1 woord de eerste N gelijk blijven.
      const kopie = [...pool];
      const uit = [];
      for (let i = 0; i < aantal && kopie.length > 0; i++) {
        const idx = Math.floor(this._random() * kopie.length);
        uit.push(kopie.splice(idx, 1)[0]);
      }
      return uit;
    },

    _schud: function (arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(this._random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    },

    _intRandom: function (max, salt) {
      // Deterministisch index op basis van seed + salt (voor consistente telwoorden)
      let n = (this._seed || 0) + (salt || 0) * 1009;
      n = ((n * 9301 + 49297) % 233280);
      return Math.abs(n) % max;
    },

    _seed: null,
    _random: function () {
      if (this._seed === null) return Math.random();
      let t = (this._seed += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
  };

  window.SpellingModules = window.SpellingModules || {};
  window.SpellingModules.ov08 = OV08;
})();
/* ============================================================
   OV09 — KLINKERDIEF (Verdubbelen & Verenkelen)
   
   4 niveaus:
   ⭐    Oefenen      : woord + 2 schrijfwijzen (katen / katten) → kruis aan
   ⭐⭐   Toepassen   : "kat → ___" (kind schrijft het juiste stukjeswoord)
   ⭐⭐⭐  Verdiepen   : 9 afbeeldingen → 3-koloms sorteer (verdubbel/verenkel/hoort)
   ⭐⭐⭐⭐ Uitbreiden  : foute zinnen — kind streept door + schrijft goed
   
   Architectuur identiek aan ov07.js / ov08.js — split files, schrijflijnen,
   bundel-API.
   
   PEDAGOGIE:
   - Werkt op de 3 stukjes-categorieën samen
   - "Regel" wordt afgeleid uit de categorie:
     * stukjes-verdubbelen → korte klank in 1e stuk + 1 medeklinker → VERDUBBEL
     * stukjes-verenkelen → lange klank in 1e stuk + 1 medeklinker → VERENKEL
     * stukjes-geen-regel → 2 medeklinkers na klinker → SCHRIJF WAT JE HOORT
   ============================================================ */

(function () {
  "use strict";

  const OV09 = {
    naam: "ov09",
    graad: 1,
    oefenvormenPerNiveau: ["basis", "kern", "verdieping", "uitbreiding"],

    /* Maximum aantal woorden per niveau dat comfortabel op 1 A4 past.
       ⭐ basis = 6 (afbeelding + 2 keuzes naast elkaar + schrijflijn per rij)
       ⭐⭐ kern = 9 (compactere rijen, afbeelding + schrijflijn)
       ⭐⭐⭐ verdieping = 6 (2 kolommen, om beurten kolom leeg)
       ⭐⭐⭐⭐ uitbreiding = 5 (vast 5 zinnen uit zinnenbib) */
    _maxPerNiveau: {
      basis: 6,
      kern: 9,
      verdieping: 6,
      uitbreiding: 5
    },

    /* Categorieën waaruit OV09 zijn woorden mag halen. */
    CAT_TOEGESTAAN: ["stukjes-verdubbelen", "stukjes-verenkelen", "stukjes-geen-regel"],

    /* Mapping categorie → regel-naam + kleur */
    REGEL_INFO: {
      "stukjes-verdubbelen": { naam: "verdubbel", label: "Verdubbelen", kleur: "#E53935", emoji: "🔴" },
      "stukjes-verenkelen":  { naam: "verenkel",  label: "Verenkelen",  kleur: "#FB8C00", emoji: "🟠" },
      "stukjes-geen-regel":  { naam: "hoort",     label: "Schrijf wat je hoort", kleur: "#43A047", emoji: "🟢" }
    },

    /* ----- PUBLIC ----- */
    _seed: null,

    /* HOOFD-GENERATOR (wordt door bundel + preview aangeroepen) */
    genereerBlad: function (opties, metAntwoorden) {
      // Gebruik this._seed als die door bundel al gezet is, anders uit opties,
      // anders een random fallback. NIET altijd overschrijven, want dan zou
      // bij +1 woord een nieuwe shuffle ontstaan.
      const basisSeed = (typeof this._seed === "number" && this._seed !== null)
        ? this._seed
        : ((opties && typeof opties.seed === "number") ? opties.seed : Math.floor(Math.random() * 1e9));

      const o = (opties && opties.ov09) || opties || {};
      const niveaus = (o.niveaus && o.niveaus.length > 0) ? o.niveaus : [o.niveau || (opties && opties.niveau) || "basis"];
      const niveau = niveaus[0];
      
      // Aantal uit _maxPerNiveau. Respecteer lagere expliciete waarde
      // (na ✕'en in bundel). Voor uitbreiding: dit wordt later sowieso
      // geclampt door Math.min(5, woorden.length) in _renderUitbreiding,
      // maar we leveren al de juiste pool aan.
      const maxVoorNiveau = this._maxPerNiveau[niveau] || 8;
      const explicietAantal = o.aantalWoorden || o.aantal;
      const aantal = (typeof explicietAantal === "number" && explicietAantal > 0 && explicietAantal <= maxVoorNiveau)
        ? explicietAantal
        : maxVoorNiveau;
      
      const cfg = {
        lijntype: o.lijntype || "type3",
        lijnhoogte: o.lijnhoogte || "middel",
      };

      // Niveau-specifieke seed-offset
      this._seed = (basisSeed + ({ basis: 0, kern: 1117, verdieping: 2003, uitbreiding: 31 }[niveau] || 0)) & 0xFFFFFFFF;

      // Haal woorden op
      let beschikbaar = this._haalActieveWoorden();
      if (beschikbaar.length === 0) {
        beschikbaar = this._haalAlleStukjesWoorden();
      }
      if (beschikbaar.length === 0) {
        return this._lege();
      }

      const titel = this._titel(niveau);
      const opdrachtStappen = this._opdracht(niveau);
      const niveauLabels = { basis: "⭐ Oefenen", kern: "⭐⭐ Toepassen", verdieping: "⭐⭐⭐ Verdiepen", uitbreiding: "⭐⭐⭐⭐ Uitbreiden" };
      const niveauLabel = niveauLabels[niveau] || "";
      const oplBadge = metAntwoorden ? '<span class="ov01-oplossingen-badge">OPLOSSINGEN</span>' : "";

      // Header in OV01-stijl (identiek aan OV07/OV08): Naam:/Datum: + zwarte titel-balk
      let html = `
        <div class="werkblad ov01-blad ov07-blad ov09-blad lijnhoogte-${cfg.lijnhoogte}" 
             data-lijntype="${cfg.lijntype}" data-lijnhoogte="${cfg.lijnhoogte}" data-niveau="${niveau}">
          <div class="ov01-header">
            <div class="ov01-naam-rij">
              <span data-bewerk-id="naamlabel-ov09-${niveau}">Naam:</span>
              <span class="ov01-lijn-naam"></span>
              <span data-bewerk-id="datumlabel-ov09-${niveau}">Datum:</span>
              <span class="ov01-lijn-datum"></span>
            </div>
            <h2 class="ov01-titel" data-bewerk-id="titel-ov09-${niveau}">
              ${titel}
              <span class="ov01-niveau-badge ov01-niveau-${niveau}">${niveauLabel}</span>
              ${oplBadge}
            </h2>
          </div>

          <div class="ov01-stappen">
            <div class="ov01-stappen-label">Opdracht:</div>
            ${opdrachtStappen.map(stap => `<div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>${stap}</span></div>`).join("")}
          </div>
      `;

      // Niveau-specifieke inhoud
      if (niveau === "basis") {
        const werkWoorden = this._kiesWoorden(beschikbaar, aantal);
        html += this._renderBasis(werkWoorden, cfg, metAntwoorden);
      } else if (niveau === "kern") {
        const werkWoorden = this._kiesWoorden(beschikbaar, aantal);
        html += this._renderKern(werkWoorden, cfg, metAntwoorden);
      } else if (niveau === "verdieping") {
        // 9 woorden, idealiter met afbeelding, gemixt uit 3 cats
        const werkWoorden = this._kiesVerdiepingsWoorden(beschikbaar, 9);
        html += this._renderVerdieping(werkWoorden, cfg, metAntwoorden);
      } else if (niveau === "uitbreiding") {
        const werkWoorden = this._kiesWoorden(beschikbaar, aantal);
        html += this._renderUitbreiding(werkWoorden, cfg, metAntwoorden);
      }

      html += `</div>`;
      return html;
    },

    /* ---------- ⭐ OEFENEN — Afbeelding + 2 schrijfwijzen + lijn ---------- */
    /* Per woord: toon afbeelding, daaronder 2 schrijfwijzen (juist + fout)
       om aan te kruisen, daaronder een schrijflijn waarop kind het juiste
       woord noteert. */
    _renderBasis: function (woorden, cfg, metAntwoorden) {
      const helper = window.SpellingAfbHelper;
      const sl = window.SpellingSchrijflijnen;
      let rijenHTML = "";
      for (const w of woorden) {
        const juiste = this._geefMeervoud(w);
        const fout = this._geefFouteSchrijfwijze(w);
        // Random volgorde van juist/fout
        const omdraaien = (this._random() < 0.5);
        const optie1 = omdraaien ? fout : juiste;
        const optie2 = omdraaien ? juiste : fout;
        const juisteIsOptie1 = !omdraaien;

        const markeer1 = (metAntwoorden && juisteIsOptie1) ? "ov09-keuze-juist" : "";
        const markeer2 = (metAntwoorden && !juisteIsOptie1) ? "ov09-keuze-juist" : "";

        const afbHTML = helper
          ? helper.html(w, { grootte: 90, klas: "ov09-afb" })
          : `<span class="ov09-afb-fallback">${w.tekst}</span>`;

        const canvas = sl
          ? sl.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, 220)
          : `<div class="ov07-fallback-lijn ov09-fallback-lijn"></div>`;
        const antw = metAntwoorden
          ? `<span class="ov07-lijn-antwoord ov09-lijn-antwoord">${juiste}</span>`
          : "";

        rijenHTML += `
          <div class="ov09-basis-cel" data-woord="${w.tekst}">
            <button class="rij-verwijder-knop" data-woord="${w.tekst}" title="Verwijder dit woord" type="button">✕</button>
            <div class="ov09-basis-afb">${afbHTML}</div>
            <div class="ov09-basis-keuzes">
              <span class="ov09-basis-keuze ${markeer1}">
                <span class="ov09-bolletje"></span>${optie1}
              </span>
              <span class="ov09-basis-keuze ${markeer2}">
                <span class="ov09-bolletje"></span>${optie2}
              </span>
            </div>
            <div class="ov09-basis-lijn">${antw}${canvas}</div>
          </div>`;
      }
      return `<div class="ov09-basis-rooster">${rijenHTML}</div>`;
    },

    /* ---------- ⭐⭐ TOEPASSEN — Afbeelding + schrijflijn ---------- */
    /* Per woord: afbeelding bovenaan, daaronder een schrijflijn waar het
       kind zelf het juiste stukjeswoord schrijft. */
    _renderKern: function (woorden, cfg, metAntwoorden) {
      const helper = window.SpellingAfbHelper;
      const sl = window.SpellingSchrijflijnen;
      let rijenHTML = "";
      woorden.forEach((w, idx) => {
        const meervoud = this._geefMeervoud(w);
        const afbHTML = helper
          ? helper.html(w, { grootte: 90, klas: "ov09-afb" })
          : `<span class="ov09-afb-fallback">${w.tekst}</span>`;
        const canvas = sl
          ? sl.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, 220)
          : `<div class="ov07-fallback-lijn ov09-fallback-lijn"></div>`;
        const antw = metAntwoorden
          ? `<span class="ov07-lijn-antwoord ov09-lijn-antwoord">${meervoud}</span>`
          : "";

        rijenHTML += `
          <div class="ov09-kern-cel" data-woord="${w.tekst}">
            <button class="rij-verwijder-knop" data-woord="${w.tekst}" title="Verwijder dit woord" type="button">✕</button>
            <div class="ov09-kern-afb">${afbHTML}</div>
            <div class="ov09-kern-lijn">${antw}${canvas}</div>
          </div>`;
      });
      return `<div class="ov09-kern-rooster">${rijenHTML}</div>`;
    },

    /* ---------- ⭐⭐⭐ VERDIEPEN — afbeeldingen-sorteer ---------- */
    /* 9 afbeeldingen, 3 per regel-type. Drie lege kolommen onderaan met
       schrijflijnen waar kind het woord in de juiste kolom schrijft.
       Vereist: voldoende woorden met afbeelding=true per cat. */
    _renderVerdieping: function (woorden, cfg, metAntwoorden) {
      const helper = window.SpellingAfbHelper;
      const sl = window.SpellingSchrijflijnen;
      
      // Render 9 afbeeldingen in 3x3 grid
      let afbHTML = "";
      const dezesWoorden = this._schud([...woorden]);
      for (const w of dezesWoorden) {
        const afbHTML2 = helper 
          ? helper.html(w, { grootte: 100, klas: "ov09-afb" })
          : `<span class="ov09-afb-fallback">${w.tekst}</span>`;
        afbHTML += `
          <div class="ov09-verdieping-cel" data-woord="${w.tekst}">
            <button class="rij-verwijder-knop" data-woord="${w.tekst}" title="Verwijder dit woord" type="button">✕</button>
            ${afbHTML2}
          </div>`;
      }

      // Render 3 kolommen onderaan
      const regelTypes = ["stukjes-verdubbelen", "stukjes-verenkelen", "stukjes-geen-regel"];
      let kolomHTML = "";
      
      // Tel hoeveel woorden per cat in deze 9
      const perCat = {};
      for (const w of dezesWoorden) {
        perCat[w.categorie] = (perCat[w.categorie] || 0) + 1;
      }
      // Max aantal regels per kolom = max van de 3 counts (voor visueel evenwicht)
      const maxRegels = Math.max(...Object.values(perCat), 3);

      for (const regelType of regelTypes) {
        const info = this.REGEL_INFO[regelType];
        // Verzamel woorden die in deze kolom horen
        const woordenInKol = dezesWoorden.filter(w => w.categorie === regelType);
        
        let lijnenHTML = "";
        for (let i = 0; i < maxRegels; i++) {
          const w = woordenInKol[i];
          const canvas = sl
            ? sl.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, 180)
            : `<div class="ov07-fallback-lijn ov09-fallback-lijn"></div>`;
          const antw = (metAntwoorden && w)
            ? `<span class="ov07-lijn-antwoord ov09-lijn-antwoord">${this._geefMeervoud(w)}</span>`
            : "";
          lijnenHTML += `<div class="ov09-verdieping-kolom-lijn">${antw}${canvas}</div>`;
        }

        kolomHTML += `
          <div class="ov09-verdieping-kolom" data-regel="${regelType}">
            <div class="ov09-verdieping-kolom-kop" style="background:${info.kleur};">
              ${info.emoji} ${info.label}
            </div>
            <div class="ov09-verdieping-kolom-lijnen">${lijnenHTML}</div>
          </div>`;
      }

      return `
        <div class="ov09-verdieping-rooster">
          <div class="ov09-verdieping-afbeeldingen">${afbHTML}</div>
          <div class="ov09-verdieping-kolommen">${kolomHTML}</div>
        </div>`;
    },

    /* ---------- ⭐⭐⭐⭐ UITBREIDEN — foute zinnen met context ---------- */
    /* Zinnen uit de zinnen-bibliotheek waarin de stukjesvorm vervangen is
       door een foute schrijfwijze. Kind streept fout door + schrijft goede
       vorm op de schrijflijn ernaast. */
    _renderUitbreiding: function (woorden, cfg, metAntwoorden) {
      const sl = window.SpellingSchrijflijnen;
      const zb = window.SpellingKlinkerdiefZinnen;
      const self = this;
      const aantalZinnen = Math.min(5, woorden.length);

      // Haal natuurlijke zinnen uit de bib
      let zinSet = [];
      if (zb && typeof zb.willekeurigeSet === "function") {
        zinSet = zb.willekeurigeSet(woorden, aantalZinnen, () => this._random());
      }

      // Fallback als bib geen zinnen heeft voor deze woorden
      if (zinSet.length === 0) {
        return `<div class="ov09-lege-tekst">
          Geen zinnen beschikbaar voor de gekozen stukjeswoorden.
        </div>`;
      }

      let zinnenHTML = "";
      zinSet.forEach((item, idx) => {
        const juist = item.stukjeswoord;
        // Maak de foute schrijfwijze door tijdelijk een woord-object op te bouwen
        const woordObj = { tekst: item.grondwoord, meervoud: juist, categorie: item.categorie };
        const fout = self._geefFouteSchrijfwijze(woordObj);

        // Vervang het juiste stukjeswoord in de zin door de foute vorm
        // Pas case-insensitive matching toe maar behoud hoofdletter aan begin
        const regex = new RegExp(`\\b${juist}\\b`, "gi");
        const zinMetFout = item.zin.replace(regex, fout);

        // 2 schrijflijnen onder de zin: kind schrijft de hele juiste zin over.
        const canvas1 = sl
          ? sl.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, 580)
          : `<div class="ov07-fallback-lijn ov09-fallback-lijn"></div>`;
        const canvas2 = sl
          ? sl.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, 580)
          : `<div class="ov07-fallback-lijn ov09-fallback-lijn"></div>`;
        
        // Antwoord = de hele JUISTE zin (de originele item.zin), niet alleen het woord
        const antw = metAntwoorden
          ? `<span class="ov07-lijn-antwoord ov09-lijn-antwoord">${item.zin}</span>`
          : "";

        // Maak de foute vorm visueel doorstreepbaar in oplossingen-modus
        const zinHTML = metAntwoorden
          ? zinMetFout.replace(fout, `<span class="ov09-uitbreiding-fout">${fout}</span>`)
          : zinMetFout;

        zinnenHTML += `
          <div class="ov09-uitbreiding-rij" data-woord="${item.grondwoord}">
            <button class="rij-verwijder-knop" data-woord="${item.grondwoord}" title="Verwijder dit woord" type="button">✕</button>
            <div class="ov09-uitbreiding-nr">${idx + 1}.</div>
            <div class="ov09-uitbreiding-zin">${zinHTML}</div>
            <div class="ov09-uitbreiding-correctie">
              <div class="ov09-uitbreiding-lijn">${antw}${canvas1}</div>
              <div class="ov09-uitbreiding-lijn">${canvas2}</div>
            </div>
          </div>`;
      });

      return `<div class="ov09-uitbreiding-rooster">${zinnenHTML}</div>`;
    },

    /* ---------- HELPERS ---------- */

    _haalActieveWoorden: function () {
      const wb = window.SpellingWoordenbibliotheek;
      const cats = this.CAT_TOEGESTAAN;
      const _ruwePool = window._weekdictee_gekozenWoorden || [];
      // Vangnet-laag: ontdubbel pool (kip/hen + tekst-dups)
      const pool = window.SpellingDedup
        ? window.SpellingDedup.ontdubbel(_ruwePool)
        : _ruwePool;
      return pool
        .filter(w => w.categorie && cats.includes(w.categorie))
        .map(w => this._verrijk(w, wb));
    },

    _haalAlleStukjesWoorden: function () {
      const wb = window.SpellingWoordenbibliotheek;
      if (!wb || !wb.graad1) return [];
      const uit = [];
      for (const catId of this.CAT_TOEGESTAAN) {
        const cat = wb.graad1[catId];
        if (!cat || !cat.woorden) continue;
        for (const w of cat.woorden) {
          uit.push({ ...w, categorie: catId });
        }
      }
      return uit;
    },

    /* Verrijk een woord uit de pool met categorie-data uit de bibliotheek */
    _verrijk: function (w, wb) {
      if (!wb || !wb.graad1 || !wb.graad1[w.categorie]) return w;
      const cat = wb.graad1[w.categorie];
      const match = (cat.woorden || []).find(x => x.tekst === w.tekst);
      if (!match) return w;
      return { ...match, ...w, categorie: w.categorie };
    },

    /* Geef de meervoud-vorm (of stukjesvorm bij werkwoorden).
       Bij werkwoorden zoals "lopen" is dat al de stukjesvorm zelf. */
    _geefMeervoud: function (w) {
      if (w.meervoud) return w.meervoud;
      // Werkwoorden in stukjes-cats: tekst is al de stukjesvorm
      if (this._isWerkwoord(w)) return w.tekst;
      // Fallback: probeer regel toe te passen
      return this._pasRegelToe(w);
    },

    /* Geeft een typische FOUTE schrijfwijze (= de regel niet toepassen). */
    _geefFouteSchrijfwijze: function (w) {
      const juist = this._geefMeervoud(w);
      const cat = w.categorie;
      if (cat === "stukjes-verdubbelen") {
        // Fout: niet verdubbelen (1 medeklinker ipv 2)
        return this._maakNietVerdubbeld(juist);
      } else if (cat === "stukjes-verenkelen") {
        // Fout: niet verenkelen (klinker dubbel laten staan)
        return this._maakNietVerenkeld(w.tekst, juist);
      } else if (cat === "stukjes-geen-regel") {
        // Fout: onnodig verdubbelen
        return this._maakOnnodigVerdubbeld(juist);
      }
      return juist + "?";
    },

    /* Voorbeeld: katten → katen (1 t weghalen) */
    _maakNietVerdubbeld: function (woord) {
      return woord.replace(/(.)\1/, "$1");
    },

    /* Voorbeeld: muren ← muur ; fout = muuren */
    _maakNietVerenkeld: function (enkelvoud, meervoud) {
      // Vind de klinker in enkelvoud (dubbele) en houd die dubbel in meervoud
      const m = enkelvoud.match(/(.*?)([aeiou])\2(.+)/);
      if (m) {
        const v = m[2];
        // Vervang in meervoud de enkele klinker terug naar dubbel
        // muren → muuren
        return meervoud.replace(v + meervoud.match(new RegExp(v + "([^" + v + "])"))[1], v + v + meervoud.match(new RegExp(v + "([^" + v + "])"))[1]);
      }
      // Fallback simpele methode
      return enkelvoud + meervoud.slice(-2);
    },

    /* Voorbeeld: handen → hannden (extra n erbij) */
    _maakOnnodigVerdubbeld: function (woord) {
      // Verdubbel de eerste medeklinker na de eerste klinker
      const m = woord.match(/^([bcdfghjklmnpqrstvwxz]*[aeiou]+)([bcdfghjklmnpqrstvwxz])/i);
      if (m) {
        return m[1] + m[2] + woord.slice(m[1].length);
      }
      return woord + "?";
    },

    /* Heuristisch: is dit een werkwoord-infinitief? */
    _isWerkwoord: function (w) {
      const werkw = ["rennen", "zwemmen", "vallen", "zitten", "tikken", "stoppen", "bakken", "lopen", "slapen", "eten"];
      return werkw.includes(w.tekst);
    },

    /* Past de regel toe op enkelvoud → meervoud (fallback voor _geefMeervoud) */
    _pasRegelToe: function (w) {
      const cat = w.categorie;
      const tekst = w.tekst;
      if (cat === "stukjes-verdubbelen") {
        // Korte klank + 1 medeklinker → verdubbel medeklinker + en
        return tekst + tekst.slice(-1) + "en";
      } else if (cat === "stukjes-verenkelen") {
        // Lange klank → verenkel + en
        return tekst.replace(/([aeiou])\1/, "$1") + "en";
      } else if (cat === "stukjes-geen-regel") {
        return tekst + "en";
      }
      return tekst + "en";
    },

    /* Maak een korte foute zin */
    _maakFouteZin: function (w, fouteVorm) {
      const cat = w.categorie;
      const templates = {
        "stukjes-verdubbelen": [
          `De ${fouteVorm} lopen in de tuin.`,
          `Ik zie veel ${fouteVorm}.`,
          `Twee ${fouteVorm} spelen samen.`
        ],
        "stukjes-verenkelen": [
          `Er staan drie ${fouteVorm} in de tuin.`,
          `De ${fouteVorm} zijn hoog.`,
          `Sam telt vijf ${fouteVorm}.`
        ],
        "stukjes-geen-regel": [
          `Op tafel liggen ${fouteVorm}.`,
          `Ik zie veel ${fouteVorm}.`,
          `Drie ${fouteVorm} zijn weg.`
        ]
      };
      const t = templates[cat] || templates["stukjes-verdubbelen"];
      const idx = this._intRandom(t.length, 0);
      return t[idx];
    },

    /* Kies woorden uit pool — één voor één, stabiel bij +1 */
    _kiesWoorden: function (pool, aantal) {
      const kopie = [...pool];
      const uit = [];
      for (let i = 0; i < aantal && kopie.length > 0; i++) {
        const idx = Math.floor(this._random() * kopie.length);
        uit.push(kopie.splice(idx, 1)[0]);
      }
      return uit;
    },

    /* Voor ⭐⭐⭐: probeer 3 per cat te halen + bij voorkeur met afbeelding */
    _kiesVerdiepingsWoorden: function (pool, aantalTotaal) {
      const perCat = Math.floor(aantalTotaal / 3);  // 3 per cat
      const uit = [];
      for (const catId of this.CAT_TOEGESTAAN) {
        const catPool = pool.filter(w => w.categorie === catId);
        // Prefereer woorden met afbeelding=true
        const metAfb = catPool.filter(w => w.afbeelding);
        const zonderAfb = catPool.filter(w => !w.afbeelding);
        const gesorteerd = [...this._schud([...metAfb]), ...this._schud([...zonderAfb])];
        for (let i = 0; i < perCat && i < gesorteerd.length; i++) {
          uit.push(gesorteerd[i]);
        }
      }
      // Schud finaal
      return this._schud(uit);
    },

    _schud: function (arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(this._random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },

    _intRandom: function (max, salt) {
      const t = Math.imul((this._seed || 1) + (salt || 0), 0x6D2B79F5);
      const u = Math.imul(t ^ (t >>> 15), t | 1);
      return Math.abs(u ^ (u >>> 14)) % max;
    },

    _random: function () {
      if (this._seed === null) return Math.random();
      let t = (this._seed += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },

    /* ---------- TEKSTEN PER NIVEAU ---------- */
    _titel: function (niveau) {
      return "Klinkerdief";
    },

    _opdracht: function (niveau) {
      const map = {
        basis: [
          "Kijk naar de afbeelding.",
          "Welke schrijfwijze is juist?",
          "Kruis het juiste antwoord aan en schrijf het woord op de lijn."
        ],
        kern: [
          "Kijk naar de afbeelding.",
          "Klap het woord.",
          "Schrijf het juist op de lijn."
        ],
        verdieping: [
          "Kijk naar elke prent.",
          "Klap het woord.",
          "Schrijf het woord in de juiste kolom."
        ],
        uitbreiding: [
          "Lees elke zin goed.",
          "De Klinkerdief heeft een woord verkeerd geschreven.",
          "Streep het foute woord door en schrijf de juiste zin op de lijnen."
        ]
      };
      return map[niveau] || map.basis;
    },

    _lege: function () {
      return `
        <div class="werkblad ov07-blad ov09-blad">
          <div class="ov07-lege-tekst ov09-lege-tekst">
            Geen stukjeswoorden beschikbaar.<br>
            Vink een van de stukjes-categorieën aan in de zijbalk:
            <em>stukjes-verdubbelen, stukjes-verenkelen, stukjes-geen-regel</em>.
          </div>
        </div>`;
    },

    /* Voor instellingen-paneel — voorlopig leeg */
    renderInstellingen: function () {
      return "";
    }
  };

  window.SpellingModules = window.SpellingModules || {};
  window.SpellingModules.ov09 = OV09;
})();
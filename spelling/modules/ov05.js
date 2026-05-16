/* ==========================================================
   Module: OV05 — Klank kiezen (hele-woord keuze)
   
   Werkt alleen voor paren waarbij het kind kan kiezen uit
   meerdere hele woord-varianten (juiste + foute schrijfwijzen):
     - ei vs ij        (3 opties: reis/rijs/ries)
     - au vs ou        (3 opties: hout/haut/howt)
     - aai/ooi/oei     (3 opties)
     - eeuw vs ieuw    (3 opties)
     - verlengen d/t   (2 opties: hand/hant)
     - verlengen b/p   (2 opties: krab/krap)
   
   Auto-detecteert het paar uit de aangevinkte woorden — zoals OV4.
   
   4 niveaus:
     ⭐ basis        — plaatje + keuze tussen 2/3 hele woorden (omcirkelen)
     ⭐⭐ kern         — keuze tussen 2/3 hele woorden + schrijflijn (plaatje optioneel)
     ⭐⭐⭐ verdieping — plaatje alleen, kind schrijft hele woord op lijn
     ⭐⭐⭐⭐ uitbreiding — woorden schrijven + zin maken onderaan
   ========================================================== */

window.SpellingModules = window.SpellingModules || {};

window.SpellingModules.ov05 = {

  naam: "Klank kiezen",
  graad: 1,

  /* Maximum aantal woorden per paar per niveau dat comfortabel op 1 A4 past. */
  _maxPerNiveau: {
    basis: 12,
    kern: 12,
    verdieping: 12,
    uitbreiding: 9
  },

  /* Maximum letterlengte voor woorden in OV5.
     Bij werkwoorden met prefix ('hij ligt', 'ik heb') tellen we
     alleen het werkwoord-deel (laatste woord na spatie).
     Lange woorden (> 6 letters) vallen weg omdat 3 keuze-hokjes
     niet naast elkaar passen op het werkblad.
     Minimum 4 woorden moet overblijven per paar, anders sla werkblad over. */
  _maxLengte: 6,
  _minAantal: 4,

  /* Geeft het te tellen kerndeel van een woord terug.
     'hij ligt' → 'ligt', 'ik heb' → 'heb', 'goud' → 'goud' */
  _kernDeel: function(tekst) {
    const delen = tekst.trim().split(/\s+/);
    return delen[delen.length - 1];
  },

  /* Geeft eventuele prefix (alles vóór laatste woord) of "" */
  _prefix: function(tekst) {
    const delen = tekst.trim().split(/\s+/);
    if (delen.length <= 1) return "";
    return delen.slice(0, -1).join(" ");
  },

  /* =====================================================
     KLANK-PAAR DETECTIE
     Subset van OV4 — alleen paren waarvoor we pedagogisch
     zinvolle hele-woord afleiders kunnen genereren.
     ===================================================== */
  KLANK_PAREN: [
    {
      id: "ei-ij",
      titel: "ei vs ij",
      trigger: (aangevinkteCats) => {
        if (!(aangevinkteCats.includes("tw-ei") && aangevinkteCats.includes("tw-ij"))) return null;
        return {
          kolommen: [
            { titel: "ei", kleur: "#E53935", filter: w => w.categorie === "tw-ei" },
            { titel: "ij", kleur: "#1E88E5", filter: w => w.categorie === "tw-ij" }
          ]
        };
      }
    },
    {
      id: "au-ou",
      titel: "au vs ou",
      trigger: (aangevinkteCats) => {
        if (!(aangevinkteCats.includes("tw-au") && aangevinkteCats.includes("tw-ou"))) return null;
        return {
          kolommen: [
            { titel: "au", kleur: "#FB8C00", filter: w => w.categorie === "tw-au" },
            { titel: "ou", kleur: "#8E24AA", filter: w => w.categorie === "tw-ou" }
          ]
        };
      }
    },
    {
      id: "aai-ooi-oei",
      titel: "aai / ooi / oei",
      trigger: (aangevinkteCats) => {
        const k = [];
        if (aangevinkteCats.includes("tw-aai")) k.push({ titel: "aai", kleur: "#E53935", filter: w => w.categorie === "tw-aai" });
        if (aangevinkteCats.includes("tw-ooi")) k.push({ titel: "ooi", kleur: "#4CAF50", filter: w => w.categorie === "tw-ooi" });
        if (aangevinkteCats.includes("tw-oei")) k.push({ titel: "oei", kleur: "#1E88E5", filter: w => w.categorie === "tw-oei" });
        if (k.length < 2) return null;
        return { kolommen: k };
      }
    },
    {
      id: "eeuw-ieuw",
      titel: "eeuw / ieuw",
      trigger: (aangevinkteCats) => {
        if (!(aangevinkteCats.includes("tw-eeuw") && aangevinkteCats.includes("tw-ieuw"))) return null;
        return {
          kolommen: [
            { titel: "eeuw", kleur: "#E53935", filter: w => w.categorie === "tw-eeuw" },
            { titel: "ieuw", kleur: "#1E88E5", filter: w => w.categorie === "tw-ieuw" }
          ]
        };
      }
    },
    {
      id: "ng-nk",
      titel: "ng vs nk",
      trigger: (aangevinkteCats) => {
        if (!(aangevinkteCats.includes("ng-woorden") && aangevinkteCats.includes("nk-woorden"))) return null;
        return {
          kolommen: [
            { titel: "ng", kleur: "#9C27B0", filter: w => w.categorie === "ng-woorden" },
            { titel: "nk", kleur: "#00897B", filter: w => w.categorie === "nk-woorden" }
          ]
        };
      }
    },
    {
      id: "verlengen-dt",
      titel: "Eindigt op -d of -t",
      trigger: (aangevinkteCats) => {
        if (!aangevinkteCats.includes("verlengingsregel")) return null;
        const eindigtOpD = w => w.categorie === "verlengingsregel" && w.tekst.replace(/[^a-z]/gi, '').toLowerCase().endsWith("d");
        const eindigtOpT = w => w.categorie === "verlengingsregel" && w.tekst.replace(/[^a-z]/gi, '').toLowerCase().endsWith("t");
        return {
          kolommen: [
            { titel: "-d", kleur: "#E53935", filter: eindigtOpD },
            { titel: "-t", kleur: "#43A047", filter: eindigtOpT }
          ],
          minimumPerKolom: true
        };
      }
    },
    {
      id: "verlengen-bp",
      titel: "Eindigt op -b of -p",
      trigger: (aangevinkteCats) => {
        if (!aangevinkteCats.includes("verlengingsregel")) return null;
        const eindigtOpB = w => w.categorie === "verlengingsregel" && w.tekst.replace(/[^a-z]/gi, '').toLowerCase().endsWith("b");
        const eindigtOpP = w => w.categorie === "verlengingsregel" && w.tekst.replace(/[^a-z]/gi, '').toLowerCase().endsWith("p");
        return {
          kolommen: [
            { titel: "-b", kleur: "#1E88E5", filter: eindigtOpB },
            { titel: "-p", kleur: "#FB8C00", filter: eindigtOpP }
          ],
          minimumPerKolom: true
        };
      }
    }
  ],

  /* Detecteer welke klank-paren mogelijk zijn met de huidige woorden. */
  _detecteerParen: function(gekozenWoorden) {
    const aangevinkteCats = [...new Set(gekozenWoorden.map(w => w.categorie).filter(Boolean))];
    const resultaat = [];
    for (const paar of this.KLANK_PAREN) {
      const detectie = paar.trigger(aangevinkteCats);
      if (!detectie) continue;
      if (detectie.minimumPerKolom) {
        const ok = detectie.kolommen.every(kol => gekozenWoorden.some(w => kol.filter(w)));
        if (!ok) continue;
      }
      resultaat.push({
        id: paar.id,
        titel: paar.titel,
        kolommen: detectie.kolommen
      });
    }
    return resultaat;
  },

  /* ---------- INSTELLINGEN UI (zijbalk) ---------- */
  renderInstellingen: function() {
    return `
      <h2>Instellingen</h2>

      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">1</span> Kies je woorden
        </label>
        <button class="wd-kiezer-knop" id="ov05-open-kiezer" type="button">
          📋 Open woordenkiezer
        </button>
        <p class="wd-stap-info" style="margin-top:6px;">
          De oefenvorm detecteert zelf welk klank-paar past bij de aangevinkte categorieën:
          ei/ij, au/ou, aai/ooi/oei, eeuw/ieuw, of verlengingsregel (-d/-t, -b/-p).
        </p>
      </div>

      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">2</span> Plaatje
        </label>
        <p class="wd-stap-info" style="margin-bottom:6px;">
          Bij <strong>⭐ basis</strong> staat het plaatje altijd. Voor andere niveaus kies je hier.
        </p>
        <label style="display:flex; align-items:center; gap:8px; margin-top:6px;">
          <input type="checkbox" id="ov05-plaatje-kern" checked>
          <span>Plaatje tonen bij <strong>⭐⭐ kern</strong></span>
        </label>
        <label style="display:flex; align-items:center; gap:8px; margin-top:6px;">
          <input type="checkbox" id="ov05-plaatje-verdieping" checked>
          <span>Plaatje tonen bij <strong>⭐⭐⭐ verdieping</strong> en <strong>⭐⭐⭐⭐ uitbreiding</strong></span>
        </label>
      </div>

      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">3</span> Ondertitel (vrij)
        </label>
        <input type="text" id="ov05-ondertitel" placeholder="bv. Week 12 — klank kiezen">
      </div>
    `;
  },

  oefenvormenPerNiveau: { basis: [], kern: [], verdieping: [] },

  /* ---------- WERKBLAD GENEREREN ---------- */
  genereerBlad: function(opties, metAntwoorden = false) {
    const o = opties.ov05 || {};
    const niveaus = o.niveaus && o.niveaus.length > 0 ? o.niveaus : ["basis"];
    const lijntype = o.lijntype || "type3";
    const lijnhoogte = o.lijnhoogte || "middel";
    const ondertitel = o.ondertitel || "";
    const plaatjeKern = o.plaatjeKern !== false;
    const plaatjeVerdieping = o.plaatjeVerdieping !== false;

    const gekozenWoorden = window._weekdictee_gekozenWoorden || [];

    if (gekozenWoorden.length === 0) {
      return `<div class="werkblad ov05-blad">
        <div class="weekdictee-empty">
          <h3>📋 Nog geen woorden gekozen</h3>
          <p>Klik op <strong>"Open woordenkiezer"</strong> in de zijbalk om woorden te selecteren.</p>
        </div>
      </div>`;
    }

    const paren = this._detecteerParen(gekozenWoorden);

    if (paren.length === 0) {
      return `<div class="werkblad ov05-blad">
        <div class="weekdictee-empty">
          <h3>⭕ Klank kiezen niet mogelijk</h3>
          <p>Deze oefenvorm werkt alleen voor:</p>
          <ul style="text-align:left; max-width:500px; margin: 12px auto;">
            <li>ei + ij woorden</li>
            <li>au + ou woorden</li>
            <li>aai/ooi/oei woorden</li>
            <li>eeuw + ieuw woorden</li>
            <li>ng + nk woorden</li>
            <li>Verlengingsregel (zowel -d én -t, of -b én -p woorden)</li>
          </ul>
        </div>
      </div>`;
    }

    // Voor elk paar × elk niveau één werkblad — maar SKIP als
    // er na lengte-filter te weinig woorden overblijven voor dat paar.
    let html = "";
    let aantalGeskipt = 0;
    const geskipt = [];
    for (const paar of paren) {
      const passend = this._filterWoordenVoorPaar(gekozenWoorden, paar);
      if (passend.length < this._minAantal) {
        aantalGeskipt++;
        geskipt.push(paar.titel);
        continue;
      }
      for (const niveau of niveaus) {
        const woorden = this._kiesWoorden(passend, this._maxPerNiveau[niveau] || 12);
        const metPlaatje = (niveau === "basis")
          || (niveau === "kern" && plaatjeKern)
          || ((niveau === "verdieping" || niveau === "uitbreiding") && plaatjeVerdieping);
        html += this._renderEenBlad(niveau, woorden, paar, metPlaatje, lijntype, lijnhoogte, ondertitel, metAntwoorden);
      }
    }
    
    if (html === "" && aantalGeskipt > 0) {
      return `<div class="werkblad ov05-blad">
        <div class="weekdictee-empty">
          <h3>⭕ Geen geschikte woorden</h3>
          <p>De gekozen woorden zijn te lang (meer dan ${this._maxLengte} letters).
          Bij klank kiezen passen 3 keuze-hokjes niet naast elkaar voor lange woorden.</p>
          <p>Kies kortere woorden voor de paren: <em>${geskipt.join(", ")}</em>.</p>
        </div>
      </div>`;
    }
    return html;
  },

  /* Filter woorden voor dit paar: alleen die in een kolom passen
     ÉN waarvan de kern-lengte ≤ _maxLengte is. */
  _filterWoordenVoorPaar: function(allWoorden, paar) {
    return allWoorden.filter(w => 
      paar.kolommen.some(k => k.filter(w))
      && this._kernDeel(w.tekst).length <= this._maxLengte
    );
  },

  _renderEenBlad: function(niveau, woorden, paar, metPlaatje, lijntype, lijnhoogte, ondertitel, metAntwoorden) {
    const sl = window.SpellingSchrijflijnen;
    const af = window.SpellingAfleiders;

    let rijenHTML = "";
    for (const w of woorden) {
      const woordVol = w.tekst;
      const kern = this._kernDeel(woordVol);     // bv. "ligt" of "heb"
      const prefix = this._prefix(woordVol);     // bv. "hij" of "ik" of ""
      
      const plaatjeHtml = metPlaatje ? this._plaatjeHtml(w) : "";
      const plaatjeCel = metPlaatje
        ? `<div class="ov05-plaatje">${plaatjeHtml}</div>`
        : `<div class="ov05-plaatje-leeg"></div>`;

      // Bouw keuze-hokjes voor basis en kern via afleiders (hele-woord keuze)
      // Voor woorden met prefix ('hij ligt', 'ik heb'): toon alleen kern in hokjes
      let middenHTML = "";
      if ((niveau === "basis" || niveau === "kern") && af) {
        // Maak afleiders op basis van het KERN-deel zodat we niet 'hij ligd' krijgen
        // maar 'ligd' — schoner in de keuze-hokjes.
        const kernObj = { ...w, tekst: kern };
        const afleiders = af.maakAfleiders(kernObj, w.categorie);
        const opties = af.schikWillekeurig(kern, afleiders, () => this._random());
        const hokjes = opties.map(opt => {
          const isJuist = (opt === kern);
          const juistClass = (metAntwoorden && isJuist) ? " ov05-keuze-juist" : "";
          return `<div class="ov05-keuze-hokje${juistClass}">${opt}</div>`;
        }).join("");
        middenHTML = `<div class="ov05-keuzes">${hokjes}</div>`;
      }

      // Schrijflijn voor alle niveaus.
      // Bij prefix: toon prefix als hint vóór de schrijflijn ("ik ___")
      const antwoordSpan = metAntwoorden
        ? `<span class="ov05-lijn-antwoord">${woordVol}</span>`
        : "";
      const prefixSpan = prefix
        ? `<span class="ov05-lijn-prefix">${prefix}</span>`
        : "";
      const canvas = sl
        ? sl.htmlCanvas(lijntype, lijnhoogte, 280)
        : `<div class="ov05-fallback-lijn"></div>`;
      const lijnHTML = `<div class="ov05-lijn-cel">${prefixSpan}${antwoordSpan}${canvas}</div>`;

      rijenHTML += `
        <div class="ov05-rij ov05-rij-${niveau}" data-woord="${w.tekst}">
          <button class="rij-verwijder-knop" data-woord="${w.tekst}" title="Verwijder dit woord van het werkblad" type="button">✕</button>
          ${plaatjeCel}
          ${middenHTML ? `<div class="ov05-midden">${middenHTML}</div>` : ""}
          ${lijnHTML}
        </div>`;
    }

    const niveauLabel = {
      basis: "⭐", kern: "⭐⭐", verdieping: "⭐⭐⭐", uitbreiding: "⭐⭐⭐⭐"
    }[niveau];

    const oplBadge = metAntwoorden
      ? `<span class="oplossingen-badge">OPLOSSINGEN</span>`
      : "";

    // Opdracht-tekst per niveau
    let opdrachtTekst = "";
    if (niveau === "basis") {
      opdrachtTekst = `
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Kijk naar het plaatje.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Omcirkel het juiste woord.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Schrijf het op de lijn.</span></div>`;
    } else if (niveau === "kern") {
      opdrachtTekst = `
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Kies het juiste woord.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Schrijf het op de lijn.</span></div>`;
    } else if (niveau === "verdieping") {
      opdrachtTekst = `
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Kijk naar het plaatje.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Schrijf zelf het juiste woord op de lijn.</span></div>`;
    } else if (niveau === "uitbreiding") {
      opdrachtTekst = `
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Schrijf de woorden op de lijn.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Maak onderaan een zin met één van de woorden.</span></div>`;
    }

    return `
      <div class="werkblad ov05-blad lijnhoogte-${lijnhoogte}" data-lijntype="${lijntype}" data-lijnhoogte="${lijnhoogte}" data-niveau="${niveau}">
        <div class="ov01-header">
          <div class="ov01-naam-rij">
            <span data-bewerk-id="naamlabel-${niveau}-${paar.id}">Naam:</span>
            <span class="ov01-lijn-naam"></span>
            <span data-bewerk-id="datumlabel-${niveau}-${paar.id}">Datum:</span>
            <span class="ov01-lijn-datum"></span>
          </div>
          <h2 class="ov01-titel" data-bewerk-id="titel-${niveau}-${paar.id}">
            Klank kiezen: ${paar.titel}
            <span class="ov01-niveau-badge ov01-niveau-${niveau}">${niveauLabel}</span>
            ${oplBadge}
          </h2>
          ${ondertitel ? `<p class="ov01-ondertitel" data-bewerk-id="ondertitel-${niveau}-${paar.id}">${ondertitel}</p>` : ""}
        </div>

        <div class="ov01-stappen">
          <div class="ov01-stappen-label">Opdracht:</div>
          ${opdrachtTekst}
        </div>

        <div class="ov05-rooster">
          ${rijenHTML}
        </div>

        ${niveau === "uitbreiding" ? this._renderUitbreidingBlok(lijntype, lijnhoogte, metAntwoorden) : ""}

        <div class="ov01-voettekst">www.jufzisa.be — Juf Zisa's spellinggenerator</div>
      </div>
    `;
  },

  _renderUitbreidingBlok: function(lijntype, lijnhoogte, metAntwoorden) {
    const sl = window.SpellingSchrijflijnen;
    const lijn = () => sl
      ? `<div class="ov01-zin-canvas-wrap">${sl.htmlCanvas(lijntype, lijnhoogte, 580)}</div>`
      : `<div class="ov01-zin-lijn"></div>`;

    const opl = metAntwoorden
      ? `<p class="ov01-zin-richtlijn">Verwacht: een correcte zin met hoofdletter en leesteken, met een woord uit de oefening.</p>`
      : "";

    return `
      <div class="ov01-zin-blok ov01-uitbreiding-blok">
        <div class="ov01-stappen-label">⭐⭐⭐⭐ Extra opdracht:</div>
        <p class="ov01-zin-vraag">Kies 1 woord van hierboven en maak er een goede zin mee.</p>
        ${lijn()}
        ${opl}
      </div>
    `;
  },

  _zoekEmoji: function(tekst) {
    if (window.SpellingAfbeeldingen && window.SpellingAfbeeldingen.emojiVoor) {
      return window.SpellingAfbeeldingen.emojiVoor(tekst);
    }
    return "🖼️";
  },

  _plaatjeHtml: function(woord) {
    if (window.SpellingAfbeeldingen && window.SpellingAfbeeldingen.htmlVoorWoord) {
      return window.SpellingAfbeeldingen.htmlVoorWoord(woord);
    }
    return `<span class="woord-emoji">🖼️</span>`;
  },

  _seed: null,
  _random: function() {
    if (this._seed === null) return Math.random();
    let t = (this._seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  },

  _kiesWoorden: function(woorden, n) {
    const kopie = [...woorden];
    const uit = [];
    for (let i = 0; i < n && kopie.length > 0; i++) {
      const idx = Math.floor(this._random() * kopie.length);
      uit.push(kopie.splice(idx, 1)[0]);
    }
    return uit;
  }
};
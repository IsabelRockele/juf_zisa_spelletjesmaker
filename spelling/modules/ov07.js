/* ==========================================================
   Module: OV07 — Verkleinwoorden
   
   Vier niveaus volgens leerlijn Juf Zisa:
   
   ⭐ Oefenen:    grondwoord gegeven, kind kiest -je/-tje/-pje aan
                  ÉN schrijft daarna het volledige verkleinwoord nog eens
   
   ⭐⭐ Toepassen: grondwoord gegeven, kind schrijft het verkleinwoord
                  ernaast (2 kolommen).
   
   ⭐⭐⭐ Verdiepen: 2 kolommen, om beurten kolom 1 of kolom 2 leeg.
                   Vaste 50/50 verdeling.
   
   ⭐⭐⭐⭐ Uitbreiden: kort verhaaltje (5 zinnen). Kind schrijft het over
                     en zet alle gemarkeerde zelfstandige naamwoorden
                     in verkleinvorm.
   
   PEDAGOGISCHE REGEL (graad 1):
   Alleen pure -je / -tje / -pje. Geen diminutive doubling, geen klinker-
   wijziging, geen -etje of -kje. Die uitzonderingen horen in graad 2.
   ========================================================== */

window.SpellingModules = window.SpellingModules || {};

window.SpellingModules.ov07 = {

  naam: "Verkleinwoorden",
  graad: 1,

  /* Maximum aantal woorden per niveau dat comfortabel op 1 A4 past.
     ⭐ basis = 8 (kind kruist uitgang aan + schrijft volledig verkleinwoord)
     ⭐⭐ kern = 16 (2 kolommen, kind schrijft enkel verkleinwoord)
     ⭐⭐⭐ verdieping = 7 (2 kolommen, om beurten kolom 1 of kolom 2 leeg)
     ⭐⭐⭐⭐ uitbreiding = vast verhaaltje (5 zinnen, geen woordenlijst)
        — _maxPerNiveau hier puur formeel, wordt niet gebruikt voor +1/✕. */
  _maxPerNiveau: {
    basis: 8,
    kern: 16,
    verdieping: 7,
    uitbreiding: 1
  },

  CAT_NAAR_UITGANG: {
    "verklein-je":  "je",
    "verklein-tje": "tje",
    "verklein-pje": "pje"
  },

  /* Voorbeeldverhaaltjes voor ⭐⭐⭐⭐ Uitbreiden.
     Elk verhaal: 5 zinnen, leeftijdsgepast graad 1.
     Gemarkeerde zn's (tussen *sterretjes*) moet het kind verkleinen.
     
     PEDAGOGISCH PRINCIPE (graad 1):
     Enkel het gemarkeerde woord mag veranderen — verder NIETS in de zin.
     Dat betekent:
     - Geen "de/het" vóór gemarkeerde woorden (lidwoord kan wisselen)
     - Geen bijvoeglijke naamwoorden vóór gemarkeerde woorden (die buigen)
     - Veilige contexten: "een ...", "mijn/haar/zijn ...", als onderwerp,
       na voegwoord, in opsommingen, na voorzetsels die geen lidwoord nodig
       hebben.
     
     WOORDEN ZIJN STRIKT BEPERKT TOT DE VERKLEIN-CATEGORIEËN IN graad1.js:
     -je:  boek, huis, muis, neus, voet, fiets, hoofd, vest, hand, dorp,
           buik, plant
     -tje: stoel, deur, schoen, trein, kraan, tuin, muur, broer, vader,
           moeder, boer
     -pje: boom, duim, arm, raam, bloem, droom, riem */
  VERHALEN: [
    {
      titel: "Lien in haar kamer",
      zinnen: [
        "Lien heeft een *boek*.",
        "Op haar *stoel* ligt een *vest*.",
        "Voor haar *raam* staat een *plant*.",
        "Lien zwaait met haar *hand*.",
        "Dan zwaait ze ook met haar *voet*."
      ]
    },
    {
      titel: "Tom ziet een muis",
      zinnen: [
        "Tom ziet een *muis*.",
        "Een *muis* zit achter een *deur*.",
        "Tom doet zijn *schoen* uit.",
        "Hij sluipt op zijn *voet* heel stil.",
        "Een *muis* schrikt en loopt weg."
      ]
    },
    {
      titel: "Sara fietst",
      zinnen: [
        "Sara stapt op haar *fiets*.",
        "Ze fietst voorbij een *huis* en een *boom*.",
        "Een *boer* zwaait naar haar.",
        "Sara ruikt aan een *bloem*.",
        "Ze zwaait met haar *hand* naar haar *broer*."
      ]
    },
    {
      titel: "Sam wordt wakker",
      zinnen: [
        "Sam wrijft in zijn *neus*.",
        "Hij rekt zijn *arm* uit.",
        "Sam denkt nog aan zijn *droom*.",
        "Hij trekt zijn *vest* aan.",
        "Beneden roept zijn *moeder*."
      ]
    },
    {
      titel: "Pim in zijn dorp",
      zinnen: [
        "Pim woont in een *dorp*.",
        "Naast zijn *huis* staat een *muur*.",
        "Daarachter rijdt een *trein* voorbij.",
        "Pim hoort ook een *kraan* op de werf.",
        "Hij houdt zijn *duim* in de lucht."
      ]
    }
  ],

  /* ---------- INSTELLINGEN UI (zijbalk legacy-modus) ---------- */
  renderInstellingen: function() {
    return `
      <h2>Instellingen</h2>

      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">1</span> Kies je woorden
        </label>
        <button class="wd-kiezer-knop" id="ov07-open-kiezer" type="button">
          📋 Open woordenkiezer
        </button>
        <p class="wd-stap-info" id="ov07-keuze-info">
          Nog geen woorden gekozen.
        </p>
        <p class="wd-stap-info" style="margin-top:6px;">
          💡 Tip: vink in de zijbalk de categorieën <strong>Verkleinwoord op -je</strong>,
          <strong>-tje</strong> en/of <strong>-pje</strong> aan onder regelwoorden.
        </p>
      </div>

      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">2</span> Niveau(s)
        </label>
        <div id="ov07-niveaus">
          <label class="ov-niveau-vink actief">
            <input type="checkbox" data-niveau="basis" checked>
            <div class="ov-niveau-vink-tekst">
              <strong>⭐ Oefenen</strong>
              <small>uitgang aanvullen + woord opschrijven</small>
            </div>
          </label>
          <label class="ov-niveau-vink">
            <input type="checkbox" data-niveau="kern">
            <div class="ov-niveau-vink-tekst">
              <strong>⭐⭐ Toepassen</strong>
              <small>verkleinwoord schrijven naast grondwoord</small>
            </div>
          </label>
          <label class="ov-niveau-vink">
            <input type="checkbox" data-niveau="verdieping">
            <div class="ov-niveau-vink-tekst">
              <strong>⭐⭐⭐ Verdiepen</strong>
              <small>2 kolommen, beide richtingen gemixt</small>
            </div>
          </label>
          <label class="ov-niveau-vink">
            <input type="checkbox" data-niveau="uitbreiding">
            <div class="ov-niveau-vink-tekst">
              <strong>⭐⭐⭐⭐ Uitbreiden</strong>
              <small>kort verhaal overschrijven + verkleinen</small>
            </div>
          </label>
        </div>
      </div>

      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">3</span> Uitgangen op ⭐ Oefenen
        </label>
        <div id="ov07-uitgangen">
          <label class="ov-niveau-vink actief">
            <input type="checkbox" data-uitgang="je" checked>
            <div class="ov-niveau-vink-tekst">
              <strong>-je</strong>
              <small>boek → boekje</small>
            </div>
          </label>
          <label class="ov-niveau-vink actief">
            <input type="checkbox" data-uitgang="tje" checked>
            <div class="ov-niveau-vink-tekst">
              <strong>-tje</strong>
              <small>stoel → stoeltje</small>
            </div>
          </label>
          <label class="ov-niveau-vink actief">
            <input type="checkbox" data-uitgang="pje" checked>
            <div class="ov-niveau-vink-tekst">
              <strong>-pje</strong>
              <small>boom → boompje</small>
            </div>
          </label>
        </div>
      </div>

      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">4</span> Aantal woorden per blad
        </label>
        <input type="number" id="ov07-aantal-woorden" min="4" max="16" value="8">
      </div>

      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">5</span> Verhaal voor ⭐⭐⭐⭐ Uitbreiden
        </label>
        <select id="ov07-verhaal-keuze">
          <option value="0">In de tuin</option>
          <option value="1">Op de stoel</option>
          <option value="2">Naar school</option>
          <option value="3">Een nieuwe trui</option>
          <option value="4">Het feestje</option>
        </select>
      </div>

      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">6</span> Schrijflijnen
        </label>
        <div class="lijntype-keuze" id="ov07-lijntype">
          <label class="lijntype-radio">
            <input type="radio" name="ov07-lt" value="type3" checked>
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type3" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 3<br><small>kleurgecodeerd</small></span>
            </span>
          </label>
        </div>
        <div class="subtype-knoppen" id="ov07-lijnhoogte">
          <button class="actief" data-hoogte="middel" type="button">Middel</button>
          <button data-hoogte="klein" type="button">Klein</button>
        </div>
      </div>

      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">7</span> Ondertitel (vrij)
        </label>
        <input type="text" id="ov07-ondertitel" placeholder="bv. Week 14 — Verkleinwoorden">
      </div>
    `;
  },

  oefenvormenPerNiveau: { basis: [], kern: [], verdieping: [] },

  /* ---------- WERKBLAD GENEREREN ----------
     Per niveau wordt de seed gemuteerd zodat elk niveau andere woorden
     krijgt (anders zou je voor alle 4 niveaus dezelfde shuffle krijgen). */
  genereerBlad: function(opties, metAntwoorden = false) {
    const o = opties.ov07 || {};
    const niveaus = (o.niveaus && o.niveaus.length > 0) ? o.niveaus : ["basis"];
    const uitgangen = (o.uitgangen && o.uitgangen.length > 0) ? o.uitgangen : ["je", "tje", "pje"];
    const verhaalIdx = parseInt(o.verhaalIdx || 0, 10);
    const lijntype = o.lijntype || "type3";
    const lijnhoogte = o.lijnhoogte || "middel";
    const ondertitel = o.ondertitel || "";

    const gekozen = window._weekdictee_gekozenWoorden || [];
    let beschikbaar = this._filterVerkleinwoorden(gekozen);
    
    if (beschikbaar.length === 0) {
      beschikbaar = this._haalAlleVerkleinwoorden();
    }

    if (beschikbaar.length === 0) {
      return `<div class="werkblad ov07-blad">
        <div class="weekdictee-empty">
          <h3>📋 Geen verkleinwoorden beschikbaar</h3>
          <p>Open de woordenkiezer en vink woorden aan uit de categorieën
          <strong>Verkleinwoord op -je / -tje / -pje</strong>.</p>
        </div>
      </div>`;
    }

    // Aantal woorden komt uit _maxPerNiveau. Respecteer een expliciet
    // lagere waarde uit opties.aantalWoorden (na ✕'en in bundel).
    const aantalVoor = (niveau) => {
      const max = this._maxPerNiveau[niveau] || 8;
      const expliciet = o.aantalWoorden;
      if (typeof expliciet === "number" && expliciet > 0 && expliciet <= max) {
        return expliciet;
      }
      return max;
    };

    const basisSeed = this._seed || Date.now();
    const SEED_OFFSET = {
      basis:       0,
      kern:        1000003,
      verdieping:  2000017,
      uitbreiding: 3000023
    };

    return niveaus.map(niveau => {
      this._seed = (basisSeed + (SEED_OFFSET[niveau] || 0)) & 0xFFFFFFFF;
      return this._renderEenBlad(niveau, beschikbaar, {
        uitgangen, aantalWoorden: aantalVoor(niveau), verhaalIdx, lijntype, lijnhoogte, ondertitel
      }, metAntwoorden);
    }).join("");
  },

  _renderEenBlad: function(niveau, alleWoorden, cfg, metAntwoorden) {
    let werkWoorden;
    if (niveau === "basis") {
      const gefilterd = alleWoorden.filter(w => cfg.uitgangen.includes(this._uitgangVan(w)));
      werkWoorden = this._kiesWoorden(
        gefilterd.length > 0 ? gefilterd : alleWoorden,
        cfg.aantalWoorden
      );
    } else if (niveau === "uitbreiding") {
      werkWoorden = [];
    } else {
      werkWoorden = this._kiesWoorden(alleWoorden, cfg.aantalWoorden);
    }

    let inhoudHTML = "";
    let opdrachtTekst = "";

    if (niveau === "basis") {
      inhoudHTML = this._renderBasis(werkWoorden, cfg, metAntwoorden);
      opdrachtTekst = `
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Lees het woord.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Omcirkel de juiste uitgang: -je, -tje of -pje.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Schrijf het hele verkleinwoord op de lijn.</span></div>`;
    } else if (niveau === "kern") {
      inhoudHTML = this._renderKern(werkWoorden, cfg, metAntwoorden);
      opdrachtTekst = `
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Lees het grondwoord.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Maak er een verkleinwoord van.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Schrijf het op de lijn ernaast.</span></div>`;
    } else if (niveau === "verdieping") {
      inhoudHTML = this._renderVerdieping(werkWoorden, cfg, metAntwoorden);
      opdrachtTekst = `
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Kijk goed: welk vakje is leeg?</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Soms moet je het verkleinwoord schrijven, soms het grondwoord.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Schrijf het in het lege vakje.</span></div>`;
    } else if (niveau === "uitbreiding") {
      inhoudHTML = this._renderUitbreiding(cfg, metAntwoorden);
      opdrachtTekst = `
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Lees het verhaaltje.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Schrijf het over op de lijntjes.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Maak van élk <strong>vetgedrukt</strong> woord een verkleinwoord.</span></div>`;
    }

    const niveauLabel = {
      basis: "⭐", kern: "⭐⭐", verdieping: "⭐⭐⭐", uitbreiding: "⭐⭐⭐⭐"
    }[niveau];

    const oplBadge = metAntwoorden
      ? `<span class="oplossingen-badge">OPLOSSINGEN</span>`
      : "";

    return `
      <div class="werkblad ov07-blad lijnhoogte-${cfg.lijnhoogte}" data-lijntype="${cfg.lijntype}" data-lijnhoogte="${cfg.lijnhoogte}" data-niveau="${niveau}">
        <div class="ov01-header">
          <div class="ov01-naam-rij">
            <span data-bewerk-id="naamlabel-${niveau}">Naam:</span>
            <span class="ov01-lijn-naam"></span>
            <span data-bewerk-id="datumlabel-${niveau}">Datum:</span>
            <span class="ov01-lijn-datum"></span>
          </div>
          <h2 class="ov01-titel" data-bewerk-id="titel-${niveau}">
            Verkleinwoorden
            <span class="ov01-niveau-badge ov01-niveau-${niveau}">${niveauLabel}</span>
            ${oplBadge}
          </h2>
          ${cfg.ondertitel ? `<p class="ov01-ondertitel" data-bewerk-id="ondertitel-${niveau}">${cfg.ondertitel}</p>` : ""}
        </div>

        <div class="ov01-stappen">
          <div class="ov01-stappen-label">Opdracht:</div>
          ${opdrachtTekst}
        </div>

        ${inhoudHTML}

        <div class="ov01-voettekst">www.jufzisa.be — Juf Zisa's spellinggenerator</div>
      </div>
    `;
  },

  /* ⭐ OEFENEN — verticale cel-layout (woord boven, keuzes onder, lijn onder),
     2 cellen naast elkaar in een grid → compacter blad. */
  _renderBasis: function(woorden, cfg, metAntwoorden) {
    const sl = window.SpellingSchrijflijnen;

    let rijenHTML = "";
    for (const w of woorden) {
      const juiste = this._uitgangVan(w);
      const keuzes = ["je", "tje", "pje"].map(uit => {
        const isJuist = (uit === juiste);
        const klasse = (metAntwoorden && isJuist)
          ? "ov07-uitgang-keuze ov07-uitgang-juist"
          : "ov07-uitgang-keuze";
        return `<span class="${klasse}">-${uit}</span>`;
      }).join("");

      const verkleinwoord = w.verklein || (w.tekst + juiste);

      const antwoord = metAntwoorden
        ? `<span class="ov07-lijn-antwoord">${verkleinwoord}</span>`
        : "";

      // Smaller canvas voor 2-koloms layout
      const canvas = sl
        ? sl.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, 220)
        : `<div class="ov07-fallback-lijn"></div>`;

      rijenHTML += `
        <div class="ov07-cel ov07-cel-basis" data-woord="${w.tekst}">
          <button class="rij-verwijder-knop" data-woord="${w.tekst}" title="Verwijder dit woord" type="button">✕</button>
          <div class="ov07-grondwoord">${w.tekst}</div>
          <div class="ov07-uitgang-keuzes">${keuzes}</div>
          <div class="ov07-lijn-cel">${antwoord}${canvas}</div>
        </div>`;
    }

    return `<div class="ov07-rooster ov07-rooster-basis ov07-tweekoloms-cellen">${rijenHTML}</div>`;
  },

  /* ⭐⭐ TOEPASSEN — 2 kolommen naast elkaar (compact) */
  _renderKern: function(woorden, cfg, metAntwoorden) {
    const sl = window.SpellingSchrijflijnen;

    let rijenHTML = "";
    for (const w of woorden) {
      const juiste = this._uitgangVan(w);
      const verkleinwoord = w.verklein || (w.tekst + juiste);

      const antwoord = metAntwoorden
        ? `<span class="ov07-lijn-antwoord">${verkleinwoord}</span>`
        : "";

      // Smaller canvas voor 2-koloms layout
      const canvas = sl
        ? sl.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, 200)
        : `<div class="ov07-fallback-lijn"></div>`;

      rijenHTML += `
        <div class="ov07-rij ov07-rij-kern" data-woord="${w.tekst}">
          <button class="rij-verwijder-knop" data-woord="${w.tekst}" title="Verwijder dit woord" type="button">✕</button>
          <div class="ov07-grondwoord ov07-kol-woord">${w.tekst}</div>
          <div class="ov07-pijl">→</div>
          <div class="ov07-lijn-cel ov07-kol-verklein">${antwoord}${canvas}</div>
        </div>`;
    }

    return `
      <div class="ov07-rooster ov07-rooster-kern ov07-tweekoloms">
        ${rijenHTML}
      </div>`;
  },

  /* ⭐⭐⭐ VERDIEPEN — 2 kolommen, om beurten kolom 1 of kolom 2 leeg
     50/50 verdeling (vaste verhouding, afgerond op heel woord) */
  _renderVerdieping: function(woorden, cfg, metAntwoorden) {
    const sl = window.SpellingSchrijflijnen;

    const helft = Math.ceil(woorden.length / 2);
    const richtingen = woorden.map((_, i) => i < helft ? "vul-verklein" : "vul-woord");
    this._schud(richtingen);

    let rijenHTML = "";
    woorden.forEach((w, idx) => {
      const juiste = this._uitgangVan(w);
      const verkleinwoord = w.verklein || (w.tekst + juiste);
      const richting = richtingen[idx];

      let kol1HTML, kol2HTML;
      // Compactere schrijflijn (220 i.p.v. 260)
      const canvas = (breedte) => sl
        ? sl.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, breedte)
        : `<div class="ov07-fallback-lijn"></div>`;

      if (richting === "vul-verklein") {
        kol1HTML = `<div class="ov07-kol-woord ov07-gegeven">${w.tekst}</div>`;
        const antw = metAntwoorden ? `<span class="ov07-lijn-antwoord">${verkleinwoord}</span>` : "";
        kol2HTML = `<div class="ov07-kol-verklein">${antw}${canvas(220)}</div>`;
      } else {
        const antw = metAntwoorden ? `<span class="ov07-lijn-antwoord">${w.tekst}</span>` : "";
        kol1HTML = `<div class="ov07-kol-woord">${antw}${canvas(220)}</div>`;
        kol2HTML = `<div class="ov07-kol-verklein ov07-gegeven">${verkleinwoord}</div>`;
      }

      rijenHTML += `
        <div class="ov07-rij ov07-rij-verdieping" data-woord="${w.tekst}" data-richting="${richting}">
          <button class="rij-verwijder-knop" data-woord="${w.tekst}" title="Verwijder dit woord" type="button">✕</button>
          ${kol1HTML}
          <div class="ov07-pijl">↔</div>
          ${kol2HTML}
        </div>`;
    });

    return `
      <div class="ov07-rooster ov07-rooster-verdieping">
        <div class="ov07-kol-koppen">
          <div class="ov07-kol-kop">woord</div>
          <div class="ov07-pijl-kop"></div>
          <div class="ov07-kol-kop">verkleinwoord</div>
        </div>
        ${rijenHTML}
      </div>`;
  },

  /* ⭐⭐⭐⭐ UITBREIDEN */
  _renderUitbreiding: function(cfg, metAntwoorden) {
    const sl = window.SpellingSchrijflijnen;
    const verhaal = this.VERHALEN[cfg.verhaalIdx] || this.VERHALEN[0];

    let origineelHTML = `<div class="ov07-verhaal-origineel">`;
    origineelHTML += `<div class="ov07-verhaal-titel">${verhaal.titel}</div>`;
    origineelHTML += `<div class="ov07-verhaal-zinnen">`;
    for (const zin of verhaal.zinnen) {
      const zinHTML = zin.replace(/\*([^*]+)\*/g, '<strong class="ov07-zn-marker">$1</strong>');
      origineelHTML += `<p class="ov07-verhaal-zin">${zinHTML}</p>`;
    }
    origineelHTML += `</div></div>`;

    let schrijfHTML = `<div class="ov07-verhaal-schrijf">`;

    if (metAntwoorden) {
      schrijfHTML += `<div class="ov07-verhaal-zinnen ov07-verhaal-zinnen-oplossing">`;
      for (const zin of verhaal.zinnen) {
        const zinHTML = zin.replace(/\*([^*]+)\*/g, (_, woord) => {
          const verklein = this._zoekVerkleinwoord(woord);
          return `<strong class="ov07-zn-marker ov07-zn-opl">${verklein}</strong>`;
        });
        schrijfHTML += `<p class="ov07-verhaal-zin">${zinHTML}</p>`;
      }
      schrijfHTML += `</div>`;
    } else {
      // 7 schrijflijnen volstaan voor een verhaaltje van 5 zinnen.
      // (Voorheen 5*2=10, maar dat duwde de inhoud over de A4-grens.)
      const lijnen = 7;
      for (let i = 0; i < lijnen; i++) {
        const canvas = sl
          ? sl.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, 580)
          : `<div class="ov07-fallback-lijn"></div>`;
        schrijfHTML += `<div class="ov07-verhaal-lijn">${canvas}</div>`;
      }
    }

    schrijfHTML += `</div>`;

    return `
      <div class="ov07-uitbreiding-container">
        ${origineelHTML}
        ${schrijfHTML}
      </div>`;
  },

  /* ---------- HELPERS ---------- */

  _uitgangVan: function(w) {
    if (w.categorie && this.CAT_NAAR_UITGANG[w.categorie]) {
      return this.CAT_NAAR_UITGANG[w.categorie];
    }
    if (w.verklein && w.tekst) {
      const verschil = w.verklein.slice(w.tekst.length);
      if (verschil === "je" || verschil === "tje" || verschil === "pje") {
        return verschil;
      }
    }
    const lastChar = (w.tekst || "").slice(-1);
    if ("mn".includes(lastChar)) return "pje";
    if ("lnr".includes(lastChar)) return "tje";
    return "je";
  },

  _zoekVerkleinwoord: function(grondwoord) {
    const wb = window.SpellingWoordenbibliotheek;
    const lower = grondwoord.toLowerCase();
    if (wb && wb.graad1) {
      for (const [catId, cat] of Object.entries(wb.graad1)) {
        if (!cat.woorden) continue;
        for (const w of cat.woorden) {
          if (w.tekst === lower && w.verklein) return w.verklein;
        }
      }
    }
    const uit = this._uitgangVan({ tekst: lower });
    return lower + uit;
  },

  _filterVerkleinwoorden: function(woorden) {
    return woorden.filter(w => w.categorie && this.CAT_NAAR_UITGANG[w.categorie]);
  },

  _haalAlleVerkleinwoorden: function() {
    const wb = window.SpellingWoordenbibliotheek;
    if (!wb || !wb.graad1) return [];
    const uit = [];
    for (const catId of Object.keys(this.CAT_NAAR_UITGANG)) {
      const cat = wb.graad1[catId];
      if (!cat || !cat.woorden) continue;
      for (const w of cat.woorden) {
        uit.push({ ...w, categorie: catId, leerjaar: 1 });
      }
    }
    return uit;
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
  },

  _schud: function(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this._random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
};
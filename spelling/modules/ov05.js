/* ==========================================================
   Module: OV05 — Klank kiezen + inkleuren
   
   Drie niveaus:
   - BASIS:      plaatje + woord met 2 cirkel-opties (kind omcirkelt juiste)
   - KERN:       plaatje + woord met streepje (kind schrijft klank in)
   - VERDIEPING: alleen plaatje, kind schrijft hele woord op schrijflijn
   
   Leerkracht kiest klank-paar in zijbalk:
   ei vs ij, ng vs nk, ou vs au, f vs v, s vs z, ch vs g, b vs p, d vs t
   
   Tool kiest woorden uit beide categorieën van het paar
   en weet welke keuze juist is per woord.
   ========================================================== */

window.SpellingModules = window.SpellingModules || {};

window.SpellingModules.ov05 = {

  naam: "Klank kiezen",
  graad: 1,

  /* Klank-paren met info over hoe ze in woorden voorkomen.
     - klanken: array van 2 strings (de twee klanken om te kiezen)
     - categorieen: array van 2 categorie-id's uit de woordenbieb
     - zoekIn: "begin" / "midden" / "eind" — waar in het woord staat de klank
     - alleenEen: voor klanken die in 1 categorie zitten (bv. au-ou)
  */
  KLANK_PAREN: {
    "ei-ij":  { klanken: ["ei", "ij"], categorieen: ["tw-ei", "tw-ij"], zoekIn: "midden" },
    "ng-nk":  { klanken: ["ng", "nk"], categorieen: ["ng-woorden", "nk-woorden"], zoekIn: "midden" },
    "ou-au":  { klanken: ["ou", "au"], categorieen: ["tw-ou", "tw-au"], zoekIn: "midden" },
    "f-v":    { klanken: ["f", "v"], categorieen: [], zoekIn: "vrij" },
    "s-z":    { klanken: ["s", "z"], categorieen: [], zoekIn: "vrij" },
    "ch-g":   { klanken: ["ch", "g"], categorieen: [], zoekIn: "vrij" },
    "b-p":    { klanken: ["b", "p"], categorieen: [], zoekIn: "eind" },
    "d-t":    { klanken: ["d", "t"], categorieen: [], zoekIn: "eind" }
  },

  /* ---------- INSTELLINGEN UI ---------- */
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
        <p class="wd-stap-info" id="ov05-keuze-info">
          Nog geen woorden gekozen.
        </p>
        <p class="wd-stap-info" style="margin-top:6px;">
          Tip: kies woorden die het klank-paar bevatten (bv. ei + ij woorden voor 'ei vs ij').
        </p>
      </div>

      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">2</span> Klank-paar
        </label>
        <select id="ov05-klankpaar" style="width:100%; padding:6px;">
          <option value="ei-ij" selected>ei vs ij</option>
          <option value="ng-nk">ng vs nk</option>
          <option value="ou-au">ou vs au</option>
          <option value="f-v">f vs v</option>
          <option value="s-z">s vs z</option>
          <option value="ch-g">ch vs g</option>
          <option value="b-p">b vs p (eind)</option>
          <option value="d-t">d vs t (eind)</option>
        </select>
      </div>

      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">3</span> Niveau(s)
        </label>
        <div id="ov05-niveaus">
          <label class="ov-niveau-vink actief">
            <input type="checkbox" data-niveau="basis" checked>
            <div class="ov-niveau-vink-tekst">
              <strong>Basis</strong>
              <small>plaatje + 2 cirkel-opties (omcirkelen)</small>
            </div>
          </label>
          <label class="ov-niveau-vink">
            <input type="checkbox" data-niveau="kern">
            <div class="ov-niveau-vink-tekst">
              <strong>Kern</strong>
              <small>plaatje + streepje (klank invullen)</small>
            </div>
          </label>
          <label class="ov-niveau-vink">
            <input type="checkbox" data-niveau="verdieping">
            <div class="ov-niveau-vink-tekst">
              <strong>Verdieping</strong>
              <small>alleen plaatje (hele woord schrijven)</small>
            </div>
          </label>
        </div>
      </div>

      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">4</span> Plaatje
        </label>
        <p class="wd-stap-info" style="margin-bottom:6px;">
          Bij <strong>Basis</strong> staat het plaatje altijd. Bij Kern en Verdieping kan je kiezen.
        </p>
        <label style="display:flex; align-items:center; gap:8px; margin-top:6px;">
          <input type="checkbox" id="ov05-plaatje-kern" checked>
          <span>Plaatje tonen bij <strong>Kern</strong></span>
        </label>
        <label style="display:flex; align-items:center; gap:8px; margin-top:6px;">
          <input type="checkbox" id="ov05-plaatje-verdieping" checked>
          <span>Plaatje tonen bij <strong>Verdieping</strong></span>
        </label>
      </div>

      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">5</span> Aantal woorden
        </label>
        <input type="number" id="ov05-aantal-woorden" min="3" max="20" value="8">
      </div>

      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">6</span> Schrijflijnen
        </label>
        <label style="margin-top:6px">Type schrijflijn</label>
        <div class="lijntype-keuze" id="ov05-lijntype">
          <label class="lijntype-radio">
            <input type="radio" name="ov05-lt" value="type1">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type1" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 1<br><small>klassiek hulp</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov05-lt" value="type2">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type2" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 2<br><small>standaard</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov05-lt" value="type3" checked>
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type3" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 3<br><small>kleurgecodeerd</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov05-lt" value="type4">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type4" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 4<br><small>grijs-blauw</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov05-lt" value="type5">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type5" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 5<br><small>intens kleur</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov05-lt" value="type6">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type6" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 6<br><small>enkele lijn</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov05-lt" value="type7">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type7" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 7<br><small>twee lijnen</small></span>
            </span>
          </label>
        </div>
        <label style="margin-top:10px">Hoogte</label>
        <div class="subtype-knoppen" id="ov05-lijnhoogte">
          <button class="actief" data-hoogte="middel" type="button">Middel</button>
          <button data-hoogte="klein" type="button">Klein</button>
        </div>
      </div>

      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">7</span> Ondertitel (vrij)
        </label>
        <input type="text" id="ov05-ondertitel" placeholder="bv. Week 12 — ei en ij">
      </div>
    `;
  },

  oefenvormenPerNiveau: { basis: [], kern: [], verdieping: [] },

  /* ---------- WERKBLAD GENEREREN ---------- */
  genereerBlad: function(opties, metAntwoorden = false) {
    const o = opties.ov05 || {};
    const niveaus = o.niveaus && o.niveaus.length > 0 ? o.niveaus : ["basis"];
    const klankPaarKey = o.klankpaar || "ei-ij";
    const aantalWoorden = o.aantalWoorden || 8;
    const lijntype = o.lijntype || "type3";
    const lijnhoogte = o.lijnhoogte || "middel";
    const ondertitel = o.ondertitel || "";
    const plaatjeKern = o.plaatjeKern !== false;
    const plaatjeVerdieping = o.plaatjeVerdieping !== false;

    const klankPaar = this.KLANK_PAREN[klankPaarKey];
    if (!klankPaar) {
      return `<div class="werkblad ov05-blad">
        <p>Onbekend klank-paar.</p>
      </div>`;
    }

    const gekozenWoorden = window._weekdictee_gekozenWoorden || [];

    if (gekozenWoorden.length === 0) {
      return `<div class="werkblad ov05-blad">
        <div class="weekdictee-empty">
          <h3>📋 Nog geen woorden gekozen</h3>
          <p>Klik op <strong>"Open woordenkiezer"</strong> in de zijbalk om woorden te selecteren.</p>
        </div>
      </div>`;
    }

    return niveaus.map(niveau => {
      const woorden = this._kiesWoorden(gekozenWoorden, aantalWoorden);
      const metPlaatje = (niveau === "basis") || 
                        (niveau === "kern" && plaatjeKern) || 
                        (niveau === "verdieping" && plaatjeVerdieping);
      return this._renderEenBlad(niveau, woorden, klankPaar, klankPaarKey, metPlaatje, lijntype, lijnhoogte, ondertitel, metAntwoorden);
    }).join("");
  },

  /* Vind de positie van een klank uit het paar in een woord.
     Retourneert {klank, positie, lengte} of null. */
  _vindKlankInWoord: function(woord, klankPaar) {
    const lower = woord.toLowerCase();
    for (const klank of klankPaar.klanken) {
      const positie = lower.indexOf(klank);
      if (positie !== -1) {
        // Voor "eind" zoekIn-mode: alleen tellen als de klank aan het eind staat
        if (klankPaar.zoekIn === "eind" && positie + klank.length !== woord.length) {
          continue;
        }
        return { klank: klank, positie: positie, lengte: klank.length };
      }
    }
    return null;
  },

  _renderEenBlad: function(niveau, woorden, klankPaar, klankPaarKey, metPlaatje, lijntype, lijnhoogte, ondertitel, metAntwoorden) {
    const sl = window.SpellingSchrijflijnen;

    let rijenHTML = "";
    for (const w of woorden) {
      const woord = w.tekst;
      const emoji = metPlaatje ? this._zoekEmoji(w.tekst) : "";
      const plaatjeCel = metPlaatje
        ? `<div class="ov05-plaatje">${emoji}</div>`
        : `<div class="ov05-plaatje-leeg"></div>`;

      // Vind welke klank uit het paar in dit woord zit
      const klankInfo = this._vindKlankInWoord(woord, klankPaar);
      
      // Middelste deel: keuze (basis) / streepje (kern) / niets (verdieping)
      let middenHTML = "";

      if (niveau === "basis" && klankInfo) {
        // Toon woord met 2 cirkel-opties op de positie van de klank
        const voor = woord.slice(0, klankInfo.positie);
        const na = woord.slice(klankInfo.positie + klankInfo.lengte);
        const opties = klankPaar.klanken.map(k => {
          const isJuist = (k === klankInfo.klank);
          const cirkelClass = (metAntwoorden && isJuist) 
            ? "ov05-cirkel ov05-cirkel-juist" 
            : "ov05-cirkel";
          return `<span class="${cirkelClass}">${k}</span>`;
        }).join("");
        middenHTML = `
          <div class="ov05-woord-met-keuze">
            <span class="ov05-woord-deel">${voor}</span>
            ${opties}
            <span class="ov05-woord-deel">${na}</span>
          </div>`;
      } else if (niveau === "kern" && klankInfo) {
        // Toon woord met streepje waar de klank moet komen
        const voor = woord.slice(0, klankInfo.positie);
        const na = woord.slice(klankInfo.positie + klankInfo.lengte);
        const antwoord = metAntwoorden 
          ? `<span class="ov05-streepje-antwoord">${klankInfo.klank}</span>`
          : `<span class="ov05-streepje">___</span>`;
        middenHTML = `
          <div class="ov05-woord-met-streepje">
            <span class="ov05-woord-deel">${voor}</span>
            ${antwoord}
            <span class="ov05-woord-deel">${na}</span>
          </div>`;
      } else if (klankInfo === null && niveau !== "verdieping") {
        middenHTML = `<div class="ov05-niet-passend">⚠️ ${woord} past niet bij dit klank-paar</div>`;
      }

      // Schrijflijn — voor ALLE niveaus (basis+kern+verdieping)
      const antwoordSpan = metAntwoorden
        ? `<span class="ov05-lijn-antwoord">${woord}</span>`
        : "";
      const canvas = sl
        ? sl.htmlCanvas(lijntype, lijnhoogte, 280)
        : `<div class="ov05-fallback-lijn"></div>`;
      const lijnHTML = `<div class="ov05-lijn-cel">${antwoordSpan}${canvas}</div>`;

      // Layout: plaatje bovenaan, midden, schrijflijn onder (verticaal)
      const rijClass = `ov05-rij ov05-rij-${niveau}`;
      rijenHTML += `
        <div class="${rijClass}">
          ${plaatjeCel}
          ${middenHTML ? `<div class="ov05-midden">${middenHTML}</div>` : ""}
          ${lijnHTML}
        </div>`;
    }

    const niveauLabel = {
      basis: "Basis", kern: "Kern", verdieping: "Verdieping"
    }[niveau];

    const oplBadge = metAntwoorden
      ? `<span class="oplossingen-badge">OPLOSSINGEN</span>`
      : "";

    // Opdracht-tekst per niveau
    const klankenLabel = klankPaar.klanken.join(" of ");
    let opdrachtTekst = "";
    if (niveau === "basis") {
      opdrachtTekst = `
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Kijk naar het plaatje.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Omcirkel de juiste klank: <strong>${klankenLabel}</strong>.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Schrijf het hele woord op de lijn.</span></div>`;
    } else if (niveau === "kern") {
      opdrachtTekst = `
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Kijk naar het plaatje.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Vul de juiste klank in: <strong>${klankenLabel}</strong>.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Schrijf het hele woord op de lijn.</span></div>`;
    } else {
      opdrachtTekst = `
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Kijk naar het plaatje.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Schrijf het juiste woord op de lijn (let op: <strong>${klankenLabel}</strong>).</span></div>`;
    }

    return `
      <div class="werkblad ov05-blad lijnhoogte-${lijnhoogte}" data-lijntype="${lijntype}" data-lijnhoogte="${lijnhoogte}" data-niveau="${niveau}">
        <div class="ov01-header">
          <div class="ov01-naam-rij">
            <span data-bewerk-id="naamlabel-${niveau}">Naam:</span>
            <span class="ov01-lijn-naam"></span>
            <span data-bewerk-id="datumlabel-${niveau}">Datum:</span>
            <span class="ov01-lijn-datum"></span>
          </div>
          <h2 class="ov01-titel" data-bewerk-id="titel-${niveau}">
            Klank kiezen: ${klankenLabel}
            <span class="ov01-niveau-badge ov01-niveau-${niveau}">${niveauLabel}</span>
            ${oplBadge}
          </h2>
          ${ondertitel ? `<p class="ov01-ondertitel" data-bewerk-id="ondertitel-${niveau}">${ondertitel}</p>` : ""}
        </div>

        <div class="ov01-stappen">
          <div class="ov01-stappen-label">Opdracht:</div>
          ${opdrachtTekst}
        </div>

        <div class="ov05-rooster">
          ${rijenHTML}
        </div>

        <div class="ov01-voettekst">www.jufzisa.be — Juf Zisa's spellinggenerator</div>
      </div>
    `;
  },

  _zoekEmoji: function(tekst) {
    if (window.SpellingAfbeeldingen && window.SpellingAfbeeldingen.emojiVoor) {
      return window.SpellingAfbeeldingen.emojiVoor(tekst);
    }
    return "🖼️";
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
/* ==========================================================
   Module: OV06 — Zinnen invullen
   
   Vier niveaus:
   - ⭐ Oefenen:   per zin keuze uit 2 woorden, kind schrijft juiste in zin
   - ⭐⭐ Toepassen: woordbank + zinnen met streep, kind vult juist woord in
   - ⭐⭐⭐ Verdiepen: woordbank met afleiders + zinnen met streep
   - ⭐⭐⭐⭐ Uitbreiden: kind schrijft eigen zinnen met 3-6 woorden
   ========================================================== */

window.SpellingModules = window.SpellingModules || {};

window.SpellingModules.ov06 = {

  naam: "Zinnen invullen",
  graad: 1,

  /* Zin-sjablonen — werken met elk substantief.
     Elk sjabloon krijgt {lidwoord} en {woord} als placeholders. */
  ZIN_SJABLONEN: [
    "Ik zie {lidwoord} {woord}.",
    "Ik vind {lidwoord} {woord} mooi.",
    "Mama ziet {lidwoord} {woord}.",
    "Papa kijkt naar {lidwoord} {woord}.",
    "Wij kijken naar {lidwoord} {woord}.",
    "Tom kijkt naar {lidwoord} {woord}.",
    "Hij heeft een {woord}.",
    "Zij heeft een {woord}.",
    "Ik heb een nieuwe {woord}.",
    "Ik krijg een {woord}.",
    "Jij krijgt een {woord}.",
    "Sara heeft een {woord}.",
    "{Lidwoord} {woord} is mooi.",
    "{Lidwoord} {woord} is groot.",
    "{Lidwoord} {woord} is klein.",
    "{Lidwoord} {woord} is leuk.",
    "{Lidwoord} {woord} is nieuw.",
    "Mijn {woord} ligt hier.",
    "Mijn {woord} is mooi.",
    "Jouw {woord} ligt daar.",
    "Lien speelt met {lidwoord} {woord}.",
    "Ik wil {lidwoord} {woord}.",
    "Sam pakt {lidwoord} {woord}.",
    "Pak {lidwoord} {woord} eens vast.",
    "{Lidwoord} {woord} staat in de tuin.",
    "{Lidwoord} {woord} ligt op tafel.",
    "Daar is {lidwoord} {woord}.",
    "Hier ligt {lidwoord} {woord}."
  ],

  /* ---------- INSTELLINGEN UI ---------- */
  renderInstellingen: function() {
    return `
      <h2>Instellingen</h2>

      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">1</span> Kies je woorden
        </label>
        <button class="wd-kiezer-knop" id="ov06-open-kiezer" type="button">
          📋 Open woordenkiezer
        </button>
        <p class="wd-stap-info" id="ov06-keuze-info">
          Nog geen woorden gekozen.
        </p>
      </div>

      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">2</span> Niveau(s)
        </label>
        <div id="ov06-niveaus">
          <label class="ov-niveau-vink actief">
            <input type="checkbox" data-niveau="basis" checked>
            <div class="ov-niveau-vink-tekst">
              <strong>⭐ Oefenen</strong>
              <small>per zin keuze uit 2 woorden</small>
            </div>
          </label>
          <label class="ov-niveau-vink">
            <input type="checkbox" data-niveau="kern">
            <div class="ov-niveau-vink-tekst">
              <strong>⭐⭐ Toepassen</strong>
              <small>woordbank + invullen op streep</small>
            </div>
          </label>
          <label class="ov-niveau-vink">
            <input type="checkbox" data-niveau="verdieping">
            <div class="ov-niveau-vink-tekst">
              <strong>⭐⭐⭐ Verdiepen</strong>
              <small>woordbank met afleiders</small>
            </div>
          </label>
          <label class="ov-niveau-vink">
            <input type="checkbox" data-niveau="uitbreiding">
            <div class="ov-niveau-vink-tekst">
              <strong>⭐⭐⭐⭐ Uitbreiden</strong>
              <small>kind schrijft eigen zinnen</small>
            </div>
          </label>
        </div>
      </div>

      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">3</span> Aantallen
        </label>
        <label style="margin-top:6px">Aantal zinnen (Oefenen / Toepassen / Verdiepen)</label>
        <input type="number" id="ov06-aantal-zinnen" min="3" max="12" value="6">
        
        <label style="margin-top:10px">Aantal afleiders bij Verdiepen</label>
        <input type="number" id="ov06-aantal-afleiders" min="1" max="5" value="3">
        
        <label style="margin-top:10px">Aantal woorden bij Uitbreiden</label>
        <input type="number" id="ov06-aantal-uitbreiding" min="3" max="6" value="4">
      </div>

      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">4</span> Zelf zinnen invullen?
        </label>
        <p class="wd-stap-info" style="margin-bottom:8px;">
          Standaard maakt de tool zinnen automatisch. Wil je zelf zinnen typen? Vul ze hieronder in.
          Eén zin per regel. Gebruik <code>___</code> waar het woord moet komen.
        </p>
        <textarea id="ov06-eigen-zinnen" rows="6" placeholder="Voorbeeld:&#10;De ___ legt een ei.&#10;Lien gooit met de ___.&#10;..." style="width:100%; font-family:inherit; font-size:0.85rem; padding:6px;"></textarea>
        <p class="wd-stap-info" style="margin-top:6px;">
          Laat leeg om automatische zinnen te gebruiken.
        </p>
      </div>

      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">5</span> Schrijflijnen
        </label>
        <label style="margin-top:6px">Type schrijflijn</label>
        <div class="lijntype-keuze" id="ov06-lijntype">
          <label class="lijntype-radio">
            <input type="radio" name="ov06-lt" value="type1">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type1" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 1<br><small>klassiek hulp</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov06-lt" value="type2">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type2" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 2<br><small>standaard</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov06-lt" value="type3" checked>
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type3" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 3<br><small>kleurgecodeerd</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov06-lt" value="type4">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type4" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 4<br><small>grijs-blauw</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov06-lt" value="type5">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type5" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 5<br><small>intens kleur</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov06-lt" value="type6">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type6" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 6<br><small>enkele lijn</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov06-lt" value="type7">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type7" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 7<br><small>twee lijnen</small></span>
            </span>
          </label>
        </div>
        <label style="margin-top:10px">Hoogte</label>
        <div class="subtype-knoppen" id="ov06-lijnhoogte">
          <button class="actief" data-hoogte="middel" type="button">Middel</button>
          <button data-hoogte="klein" type="button">Klein</button>
        </div>
      </div>

      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">6</span> Ondertitel (vrij)
        </label>
        <input type="text" id="ov06-ondertitel" placeholder="bv. Week 12 — Zinnen oefenen">
      </div>
    `;
  },

  oefenvormenPerNiveau: { basis: [], kern: [], verdieping: [] },

  /* ---------- WERKBLAD GENEREREN ---------- */
  genereerBlad: function(opties, metAntwoorden = false) {
    const o = opties.ov06 || {};
    const niveaus = o.niveaus && o.niveaus.length > 0 ? o.niveaus : ["basis"];
    const aantalZinnen = o.aantalZinnen || 6;
    const aantalAfleiders = o.aantalAfleiders || 3;
    const aantalUitbreiding = o.aantalUitbreiding || 4;
    const lijntype = o.lijntype || "type3";
    const lijnhoogte = o.lijnhoogte || "middel";
    const ondertitel = o.ondertitel || "";
    const eigenZinnen = (o.eigenZinnen || "").trim();

    const gekozenWoorden = window._weekdictee_gekozenWoorden || [];

    if (gekozenWoorden.length === 0) {
      return `<div class="werkblad ov06-blad">
        <div class="weekdictee-empty">
          <h3>📋 Nog geen woorden gekozen</h3>
          <p>Klik op <strong>"Open woordenkiezer"</strong> in de zijbalk om woorden te selecteren.</p>
        </div>
      </div>`;
    }

    return niveaus.map(niveau => {
      return this._renderEenBlad(niveau, gekozenWoorden, {
        aantalZinnen, aantalAfleiders, aantalUitbreiding,
        lijntype, lijnhoogte, ondertitel, eigenZinnen
      }, metAntwoorden);
    }).join("");
  },

  _renderEenBlad: function(niveau, alleWoorden, cfg, metAntwoorden) {
    // Aantal benodigde woorden hangt af van niveau
    let nWoorden;
    if (niveau === "uitbreiding") {
      nWoorden = cfg.aantalUitbreiding;
    } else {
      nWoorden = cfg.aantalZinnen;
    }
    
    const woorden = this._kiesWoorden(alleWoorden, nWoorden);
    
    // Voor verdieping: extra afleider-woorden uit dezelfde categorie(ën)
    let bankWoorden = [...woorden];
    if (niveau === "verdieping") {
      const afleiders = this._kiesAfleidersUitCategorie(woorden, cfg.aantalAfleiders);
      bankWoorden = bankWoorden.concat(afleiders);
      // Schud de bank zodat juiste en afleiders door elkaar staan
      bankWoorden = this._schud([...bankWoorden]);
    }

    // Genereer/parse zinnen
    const eigenZinnenLijst = cfg.eigenZinnen 
      ? cfg.eigenZinnen.split("\n").map(z => z.trim()).filter(z => z.length > 0)
      : [];
    
    let zinnen = [];
    if (niveau !== "uitbreiding") {
      for (let i = 0; i < woorden.length; i++) {
        const w = woorden[i];
        if (eigenZinnenLijst[i]) {
          // Eigen zin van leerkracht — vervang ___ door {woord-marker}
          zinnen.push({ woord: w, zin: eigenZinnenLijst[i] });
        } else {
          // Auto-zin uit sjabloon
          zinnen.push({ woord: w, zin: this._maakZin(w) });
        }
      }
    }

    // Render afhankelijk van niveau
    let inhoudHTML = "";
    if (niveau === "basis") {
      inhoudHTML = this._renderBasis(zinnen, alleWoorden, cfg, metAntwoorden);
    } else if (niveau === "kern") {
      inhoudHTML = this._renderKern(zinnen, bankWoorden, cfg, metAntwoorden);
    } else if (niveau === "verdieping") {
      inhoudHTML = this._renderKern(zinnen, bankWoorden, cfg, metAntwoorden);
    } else if (niveau === "uitbreiding") {
      inhoudHTML = this._renderUitbreiding(woorden, cfg, metAntwoorden);
    }

    const niveauLabel = {
      basis: "⭐", kern: "⭐⭐", verdieping: "⭐⭐⭐", uitbreiding: "⭐⭐⭐⭐"
    }[niveau];

    const oplBadge = metAntwoorden
      ? `<span class="oplossingen-badge">OPLOSSINGEN</span>`
      : "";

    let opdrachtTekst = "";
    if (niveau === "basis") {
      opdrachtTekst = `
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Lees de zin.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Kies het juiste woord uit de twee.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Schrijf het op de streep.</span></div>`;
    } else if (niveau === "kern") {
      opdrachtTekst = `
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Lees elke zin.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Kies een woord uit de woordbank dat past.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Schrijf het op de streep.</span></div>`;
    } else if (niveau === "verdieping") {
      opdrachtTekst = `
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Lees elke zin goed.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Kies uit de woordbank: pas op, niet alle woorden zijn nodig!</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Schrijf het juiste woord op de streep.</span></div>`;
    } else {
      opdrachtTekst = `
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Schrijf bij elk woord een goede zin.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Begin met een hoofdletter en eindig met een leesteken.</span></div>`;
    }

    return `
      <div class="werkblad ov06-blad lijnhoogte-${cfg.lijnhoogte}" data-lijntype="${cfg.lijntype}" data-lijnhoogte="${cfg.lijnhoogte}" data-niveau="${niveau}">
        <div class="ov01-header">
          <div class="ov01-naam-rij">
            <span data-bewerk-id="naamlabel-${niveau}">Naam:</span>
            <span class="ov01-lijn-naam"></span>
            <span data-bewerk-id="datumlabel-${niveau}">Datum:</span>
            <span class="ov01-lijn-datum"></span>
          </div>
          <h2 class="ov01-titel" data-bewerk-id="titel-${niveau}">
            Zinnen invullen
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

  /* ⭐ Oefenen — per zin keuze uit 2 woorden */
  _renderBasis: function(zinnen, alleWoorden, cfg, metAntwoorden) {
    const sl = window.SpellingSchrijflijnen;
    
    let html = `<div class="ov06-zinnen-lijst">`;
    zinnen.forEach((z, idx) => {
      // Kies een afleider-woord (een ander woord uit de woordenkiezer)
      const andere = alleWoorden.filter(w => w.tekst !== z.woord.tekst);
      const afleider = andere.length > 0 
        ? andere[Math.floor(this._random() * andere.length)] 
        : z.woord;
      
      // Schud zodat juiste niet altijd eerst staat
      const opties = this._random() < 0.5 
        ? [z.woord, afleider] 
        : [afleider, z.woord];
      
      const optiesHTML = opties.map(o => {
        const isJuist = (o.tekst === z.woord.tekst);
        const klasse = (metAntwoorden && isJuist) 
          ? "ov06-keuze-woord ov06-keuze-juist" 
          : "ov06-keuze-woord";
        return `<span class="${klasse}">${o.tekst}</span>`;
      }).join(" / ");
      
      // Zin met streep — gebruik canvas-schrijflijn
      const canvas = sl
        ? sl.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, 320)
        : `<span class="ov06-streep-fallback">______________</span>`;
      
      const zinHTML = this._zinMetStreepCanvas(z.zin, z.woord, canvas, metAntwoorden);
      
      html += `
        <div class="ov06-zin-rij ov06-zin-rij-basis">
          <span class="ov06-nr">${idx + 1}.</span>
          <div class="ov06-keuze-rij">${optiesHTML}</div>
          <div class="ov06-zin-tekst">${zinHTML}</div>
        </div>`;
    });
    html += `</div>`;
    return html;
  },

  /* ⭐⭐ Toepassen + ⭐⭐⭐ Verdiepen — woordbank + zinnen */
  _renderKern: function(zinnen, bankWoorden, cfg, metAntwoorden) {
    const sl = window.SpellingSchrijflijnen;
    
    // Woordbank bovenaan
    const bankHTML = `
      <div class="ov06-woordbank">
        <div class="ov06-bank-titel">Woordbank:</div>
        <div class="ov06-bank-woorden">
          ${bankWoorden.map(w => `<span class="ov06-bank-woord">${w.tekst}</span>`).join("")}
        </div>
      </div>`;
    
    // Zinnen met streepjes
    let html = `<div class="ov06-zinnen-lijst">`;
    zinnen.forEach((z, idx) => {
      const canvas = sl
        ? sl.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, 360)
        : `<span class="ov06-streep-fallback">______________</span>`;
      
      const zinHTML = this._zinMetStreepCanvas(z.zin, z.woord, canvas, metAntwoorden);
      
      html += `
        <div class="ov06-zin-rij">
          <span class="ov06-nr">${idx + 1}.</span>
          <div class="ov06-zin-tekst">${zinHTML}</div>
        </div>`;
    });
    html += `</div>`;
    
    return bankHTML + html;
  },

  /* ⭐⭐⭐⭐ Uitbreiden — kind schrijft eigen zinnen */
  _renderUitbreiding: function(woorden, cfg, metAntwoorden) {
    const sl = window.SpellingSchrijflijnen;
    
    let html = `<div class="ov06-zinnen-lijst">`;
    woorden.forEach((w, idx) => {
      const canvas = sl
        ? sl.htmlCanvas(cfg.lijntype, cfg.lijnhoogte, 480)
        : `<div class="ov06-streep-fallback"></div>`;
      
      const opl = metAntwoorden 
        ? `<p class="ov01-zin-richtlijn" style="margin:2px 0 0 0;">Verwacht: een correcte zin met '${w.tekst}', hoofdletter en leesteken.</p>`
        : "";
      
      html += `
        <div class="ov06-uitbreiding-rij">
          <div class="ov06-uitbreiding-woord">${w.tekst}:</div>
          <div class="ov06-uitbreiding-lijn">${canvas}</div>
          ${opl}
        </div>`;
    });
    html += `</div>`;
    return html;
  },

  /* Vervang het juiste woord in de zin door een schrijflijn-canvas (of antwoord) */
  _zinMetStreepCanvas: function(zin, woord, canvas, metAntwoorden) {
    const tekst = woord.tekst;
    const lidwoord = woord.lidwoord;
    
    // Bouw zin op uit sjabloon-met-placeholders
    // Dat doen we als de zin een placeholder ___ heeft (eigen zin)
    if (zin.includes("___")) {
      const antwoord = metAntwoorden
        ? `<span class="ov06-antwoord-inline">${tekst}</span>`
        : `<span class="ov06-streep-inline">${canvas}</span>`;
      return zin.replace("___", antwoord);
    }
    
    // Auto-zin: zoek het woord (eventueel met lidwoord) en vervang door streep
    // Kijk of het woord met lidwoord in de zin staat
    let teVervangen = tekst;
    let zoekRegex = new RegExp("\\b" + this._escapeRegex(tekst) + "\\b", "i");
    
    const match = zin.match(zoekRegex);
    if (!match) {
      // Niet gevonden → toon zin als-is met streep eronder
      const antwoord = metAntwoorden
        ? `<span class="ov06-antwoord-inline">${tekst}</span>`
        : `<span class="ov06-streep-inline">${canvas}</span>`;
      return zin + " " + antwoord;
    }
    
    const idx = match.index;
    const voor = zin.slice(0, idx);
    const na = zin.slice(idx + match[0].length);
    
    const antwoord = metAntwoorden
      ? `<span class="ov06-antwoord-inline">${match[0]}</span>`
      : `<span class="ov06-streep-inline">${canvas}</span>`;
    
    return voor + antwoord + na;
  },

  _escapeRegex: function(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  /* Maak zin uit bibliotheek (handgeschreven) of fallback op sjabloon.
     
     Voorrang:
     1. Zoek 3 handgeschreven zinnen in window.SpellingZinnen.graad{N}
        Kies één willekeurige (via seed).
     2. Geen handgeschreven zinnen → fallback op sjabloon zoals voorheen. */
  _maakZin: function(woordObj) {
    const woord = woordObj.tekst;
    const lidwoord = woordObj.lidwoord || "de";
    const Lidwoord = lidwoord.charAt(0).toUpperCase() + lidwoord.slice(1);
    
    // 1. Probeer eerst de zinnen-bibliotheek
    if (window.SpellingZinnen && typeof window.SpellingZinnen.zoekZinnenVoor === "function") {
      const graad = woordObj.graad || this.graad || 1;
      const zinnen = window.SpellingZinnen.zoekZinnenVoor(woord, graad);
      if (zinnen && zinnen.length > 0) {
        // Kies één van de 3 via seed (reproduceerbaar)
        const idx = Math.floor(this._random() * zinnen.length);
        return zinnen[idx];
      }
    }
    
    // 2. Fallback: sjabloon zoals voorheen
    const sjabloon = this.ZIN_SJABLONEN[Math.floor(this._random() * this.ZIN_SJABLONEN.length)];
    return sjabloon
      .replace(/\{woord\}/g, woord)
      .replace(/\{lidwoord\}/g, lidwoord)
      .replace(/\{Lidwoord\}/g, Lidwoord);
  },

  /* Kies afleider-woorden uit dezelfde categorie(ën) als de doelwoorden.
     
     Werkt zo:
     1. Voor elk doelwoord: zoek welke categorie het toebehoort
     2. Verzamel alle woorden uit die categorieën
     3. Filter doelwoorden eruit (geen overlap)
     4. Kies n willekeurige als afleiders
     
     Fallback: als de categorie van een doelwoord niet gevonden wordt
     (bv. eigen woord van leerkracht), worden er gewoon minder afleiders
     toegevoegd. Geen crash. */
  _kiesAfleidersUitCategorie: function(doelwoorden, aantal) {
    const wb = window.SpellingWoordenbibliotheek;
    if (!wb) return [];
    
    const graad = this.graad || 1;
    const data = wb[`graad${graad}`];
    if (!data) return [];
    
    // Stap 1: zoek voor elk doelwoord de categorie waarin het zit
    const gebruikteCategorieen = new Set();
    const doelTeksten = new Set(doelwoorden.map(w => w.tekst));
    
    for (const doelwoord of doelwoorden) {
      // Als woord zelf een categorie-veld heeft, gebruik dat (snelste pad)
      if (doelwoord.categorie && data[doelwoord.categorie]) {
        gebruikteCategorieen.add(doelwoord.categorie);
        continue;
      }
      // Anders: zoek in alle categorieën
      for (const [catId, catData] of Object.entries(data)) {
        if (catData.woorden && catData.woorden.some(w => w.tekst === doelwoord.tekst)) {
          gebruikteCategorieen.add(catId);
          break;
        }
      }
    }
    
    // Stap 2: verzamel alle woorden uit die categorieën, behalve doelwoorden
    const pool = [];
    for (const catId of gebruikteCategorieen) {
      const catData = data[catId];
      if (!catData || !catData.woorden) continue;
      for (const w of catData.woorden) {
        if (!doelTeksten.has(w.tekst)) {
          pool.push(w);
        }
      }
    }
    
    // Stap 3: kies n willekeurige (via seed)
    return this._kiesWoorden(pool, aantal);
  },


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
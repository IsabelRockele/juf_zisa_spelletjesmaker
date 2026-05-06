/* ==========================================================
   Module: OV01 — Plaatje → woord schrijven
   
   Pedagogische opbouw:
   - Basis: plaatje + woord eronder, kind kopieert
   - Kern: alleen plaatje, kind roept woord op
   - Verdieping: alleen plaatje + opdracht "kies 1 woord en maak een zin"
   
   Werkblad:
   - Naam + datum bovenaan
   - Titel "Mijn spellingavontuur" (bewerkbaar)
   - Ondertitel (bewerkbaar)
   - 3 stappen-instructie met aanvinkrechthoekjes
   - 3 plaatjes per rij × variabel aantal rijen (3-15 woorden)
   - Schrijflijn(en) onder elk plaatje (1, 2 of 3, leerkracht kiest)
   - Bij verdieping: extra zin-opdracht onderaan
   ========================================================== */

window.SpellingModules = window.SpellingModules || {};

window.SpellingModules.ov01 = {

  naam: "Plaatje → woord schrijven",
  graad: 1,

  /* ---------- INSTELLINGEN UI ---------- */
  renderInstellingen: function() {
    return `
      <h2>Instellingen</h2>

      <!-- STAP 1: Woorden kiezen -->
      <div class="wd-stap">
        <div class="wd-stap-kop">
          <span class="wd-stap-nr">1</span>
          <span class="wd-stap-titel">Kies je woorden</span>
        </div>
        <button class="wd-kiezer-knop" id="ov01-open-kiezer" type="button">
          📋 Open woordenkiezer
        </button>
        <p class="wd-stap-info" id="ov01-keuze-info">
          Nog geen woorden gekozen.
        </p>
      </div>

      <!-- STAP 2: Niveau -->
      <div class="wd-stap">
        <div class="wd-stap-kop">
          <span class="wd-stap-nr">2</span>
          <span class="wd-stap-titel">Niveau</span>
        </div>
        <div class="ov-niveau-knoppen" id="ov01-niveau">
          <button class="actief" data-niveau="basis" type="button">Basis</button>
          <button data-niveau="kern" type="button">Kern</button>
          <button data-niveau="verdieping" type="button">Verdieping</button>
        </div>
        <p class="wd-stap-info" id="ov01-niveau-uitleg">
          <strong>Basis:</strong> plaatje + woord eronder, kind kopieert.
        </p>
      </div>

      <!-- STAP 3: Aantallen -->
      <div class="wd-stap">
        <div class="wd-stap-kop">
          <span class="wd-stap-nr">3</span>
          <span class="wd-stap-titel">Aantallen</span>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <label>Aantal woorden
            <input type="number" id="ov01-aantal-woorden" min="3" max="15" value="9">
          </label>
          <label>Schrijflijnen per plaatje
            <input type="number" id="ov01-aantal-lijnen" min="1" max="3" value="2">
          </label>
        </div>
      </div>

      <!-- STAP 4: Schrijflijntype + hoogte -->
      <div class="wd-stap">
        <div class="wd-stap-kop">
          <span class="wd-stap-nr">4</span>
          <span class="wd-stap-titel">Schrijflijnen</span>
        </div>
        <label>Type schrijflijn</label>
        <div class="lijntype-keuze" id="ov01-lijntype">
          <label class="lijntype-radio">
            <input type="radio" name="ov01-lt" value="type1">
            <span class="lijntype-naam">Type 1<br><small>klassiek hulp</small></span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov01-lt" value="type2">
            <span class="lijntype-naam">Type 2<br><small>standaard</small></span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov01-lt" value="type3" checked>
            <span class="lijntype-naam">Type 3<br><small>kleurgecodeerd</small></span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov01-lt" value="type4">
            <span class="lijntype-naam">Type 4<br><small>grijs-blauw</small></span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov01-lt" value="type5">
            <span class="lijntype-naam">Type 5<br><small>intens kleur</small></span>
          </label>
        </div>

        <label style="margin-top:10px">Hoogte</label>
        <div class="subtype-knoppen" id="ov01-lijnhoogte">
          <button class="actief" data-hoogte="middel" type="button">Middel</button>
          <button data-hoogte="klein" type="button">Klein</button>
        </div>

        <label style="margin-top:10px">Ondertitel (vrij)
          <input type="text" id="ov01-ondertitel" placeholder="bv. Tweeklanken — week 4" value="">
        </label>
      </div>
    `;
  },

  /* Geen oefenvormen-tabs (zoals weekdictee). */
  oefenvormenPerNiveau: { basis: [], kern: [], verdieping: [] },

  /* ---------- WERKBLAD GENEREREN ---------- */
  genereerBlad: function(opties, metAntwoorden = false) {
    const o = opties.ov01 || {};
    const niveau         = o.niveau || "basis";
    const aantalWoorden  = o.aantalWoorden || 9;
    const aantalLijnen   = o.aantalLijnen || 2;
    const lijnhoogte     = o.lijnhoogte || "middel";
    const lijntype       = o.lijntype || "type3";
    const ondertitel     = o.ondertitel || "";

    // Gekozen woorden uit de kiezer
    const gekozenWoorden = window._weekdictee_gekozenWoorden || [];

    if (gekozenWoorden.length === 0) {
      return `<div class="werkblad">
        <div class="weekdictee-empty">
          <h3>📋 Nog geen woorden gekozen</h3>
          <p>Klik op <strong>"Open woordenkiezer"</strong> in de zijbalk om woorden te selecteren.</p>
        </div>
      </div>`;
    }

    // Kies woorden voor dit blad
    this._seed = this._seed || Date.now();
    const gekozen = this._kiesWoorden(gekozenWoorden, aantalWoorden);

    // OPLOSSINGENPAGINA
    if (metAntwoorden) {
      return this._renderOplossingen(gekozen, niveau, ondertitel);
    }

    // Stap-instructies per niveau
    const stappenHTML = this._renderStappen(niveau);

    // Plaatjes-rooster met canvas-schrijflijnen
    const plaatjesHTML = this._renderPlaatjesRooster(gekozen, niveau, aantalLijnen, lijnhoogte, lijntype);

    // Verdieping: extra zin-opdracht
    let verdiepingHTML = "";
    if (niveau === "verdieping") {
      verdiepingHTML = this._renderZinOpdracht(lijnhoogte, lijntype);
    }

    return `
      <div class="werkblad ov01-blad lijnhoogte-${lijnhoogte}" data-lijntype="${lijntype}" data-lijnhoogte="${lijnhoogte}">
        <div class="ov01-header">
          <div class="ov01-naam-rij">
            <span data-bewerk-id="naamlabel">Naam:</span>
            <span class="ov01-lijn-naam"></span>
            <span data-bewerk-id="datumlabel">Datum:</span>
            <span class="ov01-lijn-datum"></span>
          </div>
          <h2 class="ov01-titel" data-bewerk-id="titel">Mijn spellingavontuur</h2>
          ${ondertitel ? `<p class="ov01-ondertitel" data-bewerk-id="ondertitel">${ondertitel}</p>` : ""}
        </div>

        ${stappenHTML}
        ${plaatjesHTML}
        ${verdiepingHTML}
      </div>
    `;
  },

  /* ----- 3 stappen per niveau, met aanvinkrechthoekjes ----- */
  _renderStappen: function(niveau) {
    let stappen, opdrachtLabel;
    if (niveau === "basis") {
      opdrachtLabel = "Opdracht:";
      stappen = [
        "Lees het woord.",
        "Schrijf het woord op.",
        "Kijk het woord nog eens na."
      ];
    } else if (niveau === "kern") {
      opdrachtLabel = "Opdracht:";
      stappen = [
        "Bekijk de prent.",
        "Schrijf het woord op.",
        "Kijk het woord nog eens goed na."
      ];
    } else {
      opdrachtLabel = "Opdracht 1 (plaatjes):";
      stappen = [
        "Bekijk de prent.",
        "Schrijf het woord op.",
        "Kijk het woord nog eens goed na."
      ];
    }
    
    return `
      <div class="ov01-stappen">
        <div class="ov01-stappen-label" data-bewerk-id="opdracht1-label">${opdrachtLabel}</div>
        ${stappen.map((s, i) => `
          <div class="ov01-stap-rij">
            <span class="ov01-vakje"></span>
            <span data-bewerk-id="stap-${niveau}-${i}">${s}</span>
          </div>
        `).join("")}
      </div>
    `;
  },

  /* ----- Plaatjes-rooster: 3 kolommen × n rijen ----- */
  _renderPlaatjesRooster: function(woorden, niveau, aantalLijnen, lijnhoogte, lijntype) {
    const rijen = [];
    for (let i = 0; i < woorden.length; i += 3) {
      rijen.push(woorden.slice(i, i + 3));
    }

    const sl = window.SpellingSchrijflijnen;

    let html = `<div class="ov01-rooster">`;
    for (const rij of rijen) {
      html += `<div class="ov01-rooster-rij">`;
      for (const w of rij) {
        const tonen = this._toonWoord(w);
        const emoji = this._zoekEmoji(w.tekst);
        const woordOnder = (niveau === "basis")
          ? `<div class="ov01-cel-woord">${tonen}</div>`
          : `<div class="ov01-cel-woord-leeg"></div>`;
        // Schrijflijnen via canvas
        let lijnen = "";
        for (let i = 0; i < aantalLijnen; i++) {
          if (sl) {
            lijnen += `<div class="ov01-canvas-wrap">${sl.htmlCanvas(lijntype, lijnhoogte, 200)}</div>`;
          } else {
            lijnen += `<div class="ov01-schrijflijn"></div>`;
          }
        }
        html += `
          <div class="ov01-cel">
            <div class="ov01-cel-plaatje">${emoji}</div>
            ${woordOnder}
            <div class="ov01-cel-lijnen">${lijnen}</div>
          </div>`;
      }
      html += `</div>`;
    }
    html += `</div>`;
    return html;
  },

  /* ----- Verdieping: zin-opdracht onderaan ----- */
  _renderZinOpdracht: function(lijnhoogte, lijntype) {
    const sl = window.SpellingSchrijflijnen;
    const zinLijn = sl
      ? `<div class="ov01-zin-canvas-wrap">${sl.htmlCanvas(lijntype, lijnhoogte, 600)}</div>`
      : `<div class="ov01-zin-lijn"></div>`;
    return `
      <div class="ov01-zin-blok">
        <div class="ov01-stappen-label" data-bewerk-id="opdracht2-label">Opdracht 2 (zin):</div>
        <p class="ov01-zin-vraag" data-bewerk-id="zin-opdracht">
          Kies 1 woord van de vorige oefening en maak een goede zin met dit woord.
        </p>
        ${zinLijn}
      </div>
    `;
  },

  /* ----- Oplossingenpagina ----- */
  _renderOplossingen: function(woorden, niveau, ondertitel) {
    const lijst = woorden.map(w => {
      const tonen = this._toonWoord(w);
      const emoji = this._zoekEmoji(w.tekst);
      return `<li class="ov01-opl-item">
        <span class="ov01-opl-emoji">${emoji}</span>
        <span class="ov01-opl-woord">${tonen}</span>
      </li>`;
    }).join("");

    return `
      <div class="werkblad ov01-blad ov01-oplossing">
        <div class="ov01-header">
          <h2 class="ov01-titel">
            Mijn spellingavontuur
            <span class="oplossingen-badge">OPLOSSINGEN</span>
          </h2>
          ${ondertitel ? `<p class="ov01-ondertitel">${ondertitel}</p>` : ""}
        </div>
        <p class="ov01-opl-uitleg">Verwachte woorden bij elke prent:</p>
        <ol class="ov01-opl-lijst">${lijst}</ol>
        ${niveau === "verdieping" ? `
          <div class="ov01-opl-zin">
            <strong>Voor de zin-opdracht:</strong> verwacht een correcte zin
            met hoofdletter, leesteken op het einde, en een woord uit de lijst.
          </div>
        ` : ""}
      </div>
    `;
  },

  /* ----- Helpers ----- */
  _toonWoord: function(w) {
    if (typeof w === "string") return w;
    if (w.lidwoord) return `${w.lidwoord} ${w.tekst}`;
    return w.tekst;
  },

  _zoekEmoji: function(tekst) {
    // Hergebruik bestaande emoji-bibliotheek als beschikbaar
    if (window.SpellingAfbeeldingen && window.SpellingAfbeeldingen.emojiVoor) {
      return window.SpellingAfbeeldingen.emojiVoor(tekst);
    }
    // Fallback: een algemene plaatje-placeholder
    return "🖼️";
  },

  /* ----- Pseudo-random met seed ----- */
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

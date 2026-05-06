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

      <!-- STAP 2: Niveau(s) -->
      <div class="wd-stap">
        <div class="wd-stap-kop">
          <span class="wd-stap-nr">2</span>
          <span class="wd-stap-titel">Niveau(s)</span>
        </div>
        <p class="wd-stap-info">
          Vink één of meer niveaus aan. Voor elk niveau wordt een werkblad gemaakt — handig voor differentiatie.
        </p>
        <div class="ov-niveau-vinkjes" id="ov01-niveaus">
          <label class="ov-niveau-vink actief">
            <input type="checkbox" data-niveau="basis" checked>
            <span class="ov-niveau-naam">
              <strong>Basis</strong>
              <small>kleur juiste woord uit 3 keuzes</small>
            </span>
          </label>
          <label class="ov-niveau-vink">
            <input type="checkbox" data-niveau="kern">
            <span class="ov-niveau-naam">
              <strong>Kern</strong>
              <small>alleen plaatje, kind roept woord op</small>
            </span>
          </label>
          <label class="ov-niveau-vink">
            <input type="checkbox" data-niveau="verdieping">
            <span class="ov-niveau-naam">
              <strong>Verdieping</strong>
              <small>plaatje + zin maken</small>
            </span>
          </label>
        </div>

        <label style="margin-top:10px; display:flex; align-items:center; gap:6px; font-size:0.85rem;">
          <input type="checkbox" id="ov01-zelfde-woorden" checked>
          Zelfde woorden voor alle niveaus
        </label>
        <p class="wd-stap-info" style="margin-top:2px">
          <em>Aan</em>: alle niveaus krijgen dezelfde plaatjes (handig voor differentiatie binnen één klas).<br>
          <em>Uit</em>: elk niveau krijgt eigen woordkeuze.
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
            <input type="number" id="ov01-aantal-lijnen" min="1" max="3" value="1">
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
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type1" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 1<br><small>klassiek hulp</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov01-lt" value="type2">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type2" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 2<br><small>standaard</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov01-lt" value="type3" checked>
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type3" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 3<br><small>kleurgecodeerd</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov01-lt" value="type4">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type4" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 4<br><small>grijs-blauw</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov01-lt" value="type5">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type5" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 5<br><small>intens kleur</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov01-lt" value="type6">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type6" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 6<br><small>enkele lijn</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov01-lt" value="type7">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type7" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 7<br><small>twee lijnen</small></span>
            </span>
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
    const niveaus        = o.niveaus || ["basis"];
    const zelfdeWoorden  = o.zelfdeWoorden !== false;
    const aantalWoorden  = o.aantalWoorden || 9;
    const aantalLijnen   = o.aantalLijnen || 2;
    const lijnhoogte     = o.lijnhoogte || "middel";
    const lijntype       = o.lijntype || "type3";
    const ondertitel     = o.ondertitel || "";

    const gekozenWoorden = window._weekdictee_gekozenWoorden || [];

    if (gekozenWoorden.length === 0) {
      return `<div class="werkblad">
        <div class="weekdictee-empty">
          <h3>📋 Nog geen woorden gekozen</h3>
          <p>Klik op <strong>"Open woordenkiezer"</strong> in de zijbalk om woorden te selecteren.</p>
        </div>
      </div>`;
    }

    if (niveaus.length === 0) {
      return `<div class="werkblad">
        <div class="weekdictee-empty">
          <h3>📋 Geen niveau aangevinkt</h3>
          <p>Vink minstens één niveau aan in de zijbalk (basis / kern / verdieping).</p>
        </div>
      </div>`;
    }

    this._seed = this._seed || Date.now();

    // Voor zelfde-woorden modus: kies één keer en gebruik voor alle niveaus
    let gedeeldeKeuze = null;
    if (zelfdeWoorden) {
      const gemeenschappelijkeSeed = this._seed;
      this._seed = gemeenschappelijkeSeed;
      gedeeldeKeuze = this._kiesWoorden(gekozenWoorden, aantalWoorden);
    }

    // ÉÉN werkblad-template voor zowel werkblad als oplossingen.
    // metAntwoorden=true triggert: antwoord-spans op schrijflijnen,
    // groen hokje bij basis, OPLOSSINGEN-badge in titel.

    // WERKBLADEN: één per niveau (eventueel met antwoorden)
    return niveaus.map((niveau, idx) => {
      const woorden = zelfdeWoorden
        ? gedeeldeKeuze
        : this._kiesWoorden(gekozenWoorden, aantalWoorden);

      const stappenHTML = this._renderStappen(niveau);
      const plaatjesHTML = this._renderPlaatjesRooster(woorden, niveau, aantalLijnen, lijnhoogte, lijntype, metAntwoorden);
      let verdiepingHTML = "";
      if (niveau === "verdieping") {
        verdiepingHTML = this._renderZinOpdracht(lijnhoogte, lijntype, metAntwoorden);
      }

      const niveauLabel = {
        basis: "Basis",
        kern: "Kern",
        verdieping: "Verdieping"
      }[niveau];

      // Bij oplossingen: extra badge naast titel + extra class
      const oplBadge = metAntwoorden
        ? `<span class="oplossingen-badge">OPLOSSINGEN</span>`
        : "";
      const oplClass = metAntwoorden ? " ov01-oplossing-blad" : "";

      return `
        <div class="werkblad ov01-blad lijnhoogte-${lijnhoogte}${oplClass}" data-lijntype="${lijntype}" data-lijnhoogte="${lijnhoogte}" data-niveau="${niveau}">
          <div class="ov01-header">
            <div class="ov01-naam-rij">
              <span data-bewerk-id="naamlabel-${niveau}">Naam:</span>
              <span class="ov01-lijn-naam"></span>
              <span data-bewerk-id="datumlabel-${niveau}">Datum:</span>
              <span class="ov01-lijn-datum"></span>
            </div>
            <h2 class="ov01-titel" data-bewerk-id="titel-${niveau}">
              Mijn spellingavontuur
              <span class="ov01-niveau-badge ov01-niveau-${niveau}">${niveauLabel}</span>
              ${oplBadge}
            </h2>
            ${ondertitel ? `<p class="ov01-ondertitel" data-bewerk-id="ondertitel-${niveau}">${ondertitel}</p>` : ""}
          </div>

          ${stappenHTML}
          ${plaatjesHTML}
          ${verdiepingHTML}

          <div class="ov01-voettekst">www.jufzisa.be — Juf Zisa's spellinggenerator</div>
        </div>
      `;
    }).join("");
  },

  /* ----- 3 stappen per niveau, met aanvinkrechthoekjes ----- */
  _renderStappen: function(niveau) {
    let stappen, opdrachtLabel;
    if (niveau === "basis") {
      opdrachtLabel = "Opdracht:";
      stappen = [
        "Kleur het juiste woord.",
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
  _renderPlaatjesRooster: function(woorden, niveau, aantalLijnen, lijnhoogte, lijntype, metAntwoorden) {
    const rijen = [];
    for (let i = 0; i < woorden.length; i += 3) {
      rijen.push(woorden.slice(i, i + 3));
    }

    const sl = window.SpellingSchrijflijnen;
    const af = window.SpellingAfleiders;

    let html = `<div class="ov01-rooster">`;
    for (const rij of rijen) {
      html += `<div class="ov01-rooster-rij">`;
      for (const w of rij) {
        const tonen = this._toonWoord(w);
        const emoji = this._zoekEmoji(w.tekst);

        // Inhoud onder plaatje hangt af van niveau
        let onderHtml = "";
        if (niveau === "basis" && af) {
          // BASIS: 3 keuze-hokjes met afleiders
          const afleiders = af.maakAfleiders(w, w.categorie);
          const opties = af.schikWillekeurig(w.tekst, afleiders, () => this._random());
          onderHtml = `
            <div class="ov01-cel-keuze">
              ${opties.map(opt => {
                // Bij oplossingen: juiste hokje krijgt class "juist" (groene achtergrond)
                const juistClass = (metAntwoorden && opt === w.tekst) ? " juist" : "";
                return `<div class="ov01-keuze-hokje${juistClass}">${opt}</div>`;
              }).join("")}
            </div>`;
        } else if (niveau === "kern" || niveau === "verdieping") {
          // KERN/VERDIEPING: alleen plaatje, geen woord
          onderHtml = `<div class="ov01-cel-woord-leeg"></div>`;
        }

        // Schrijflijnen via canvas — bij oplossingen: woord erop
        let lijnen = "";
        for (let i = 0; i < aantalLijnen; i++) {
          // Antwoord alleen op de EERSTE schrijflijn (i === 0)
          const antwoordSpan = (metAntwoorden && i === 0)
            ? `<span class="ov01-lijn-antwoord">${tonen}</span>`
            : "";
          if (sl) {
            lijnen += `<div class="ov01-canvas-wrap">${antwoordSpan}${sl.htmlCanvas(lijntype, lijnhoogte, 200)}</div>`;
          } else {
            lijnen += `<div class="ov01-schrijflijn">${antwoordSpan}</div>`;
          }
        }
        html += `
          <div class="ov01-cel">
            <div class="ov01-cel-plaatje">${emoji}</div>
            ${onderHtml}
            <div class="ov01-cel-lijnen">${lijnen}</div>
          </div>`;
      }
      html += `</div>`;
    }
    html += `</div>`;
    return html;
  },

  /* ----- Verdieping: zin-opdracht onderaan ----- */
  _renderZinOpdracht: function(lijnhoogte, lijntype, metAntwoorden) {
    const sl = window.SpellingSchrijflijnen;
    const zinLijn = sl
      ? `<div class="ov01-zin-canvas-wrap">${sl.htmlCanvas(lijntype, lijnhoogte, 600)}</div>`
      : `<div class="ov01-zin-lijn"></div>`;
    
    // Bij oplossingen: tekst onder zin-vak met richtlijn voor de juf
    const oplTekst = metAntwoorden
      ? `<p class="ov01-zin-richtlijn">Verwacht: een correcte zin met hoofdletter, leesteken op het einde, en een woord uit de oefening.</p>`
      : "";
    
    return `
      <div class="ov01-zin-blok">
        <div class="ov01-stappen-label" data-bewerk-id="opdracht2-label">Opdracht 2 (zin):</div>
        <p class="ov01-zin-vraag" data-bewerk-id="zin-opdracht">
          Kies 1 woord van de vorige oefening en maak een goede zin met dit woord.
        </p>
        ${zinLijn}
        ${oplTekst}
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
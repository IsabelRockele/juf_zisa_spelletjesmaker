/* ==========================================================
   Module: OV02 — Woord 3x overschrijven
   
   Werkblad-structuur per woord:
   [plaatje?] [woord]  ___________  ___________  ___________
   
   - Plaatje optioneel (toggle in zijbalk)
   - Vast 3 schrijflijnen per woord
   - Geen niveau-keuze (één versie)
   ========================================================== */

window.SpellingModules = window.SpellingModules || {};

window.SpellingModules.ov02 = {

  naam: "Woord 3x overschrijven",
  graad: 1,

  /* ---------- INSTELLINGEN UI (zijbalk) ---------- */
  renderInstellingen: function() {
    return `
      <h2>Instellingen</h2>

      <!-- STAP 1: Woordenkiezer -->
      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">1</span> Kies je woorden
        </label>
        <button class="wd-kiezer-knop" id="ov02-open-kiezer" type="button">
          📋 Open woordenkiezer
        </button>
        <p class="wd-stap-info" id="ov02-keuze-info">
          Nog geen woorden gekozen.
        </p>
      </div>

      <!-- STAP 2: Plaatje toggle -->
      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">2</span> Plaatje
        </label>
        <label style="display:flex; align-items:center; gap:8px; margin-top:6px;">
          <input type="checkbox" id="ov02-met-plaatje">
          <span>Plaatje tonen bij elk woord</span>
        </label>
        <p class="wd-stap-info" style="margin-top:6px;">
          Met plaatje (lj 1): kind herkent het woord visueel. Zonder plaatje (lj 2-3): puur schrijfoefening, meer woorden per blad.
        </p>
      </div>

      <!-- STAP 3: Aantallen -->
      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">3</span> Aantal woorden
        </label>
        <input type="number" id="ov02-aantal-woorden" min="3" max="20" value="8">
      </div>

      <!-- STAP 4: Schrijflijnen -->
      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">4</span> Schrijflijnen
        </label>
        <label style="margin-top:6px">Type schrijflijn</label>
        <div class="lijntype-keuze" id="ov02-lijntype">
          <label class="lijntype-radio">
            <input type="radio" name="ov02-lt" value="type1">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type1" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 1<br><small>klassiek hulp</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov02-lt" value="type2">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type2" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 2<br><small>standaard</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov02-lt" value="type3" checked>
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type3" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 3<br><small>kleurgecodeerd</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov02-lt" value="type4">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type4" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 4<br><small>grijs-blauw</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov02-lt" value="type5">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type5" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 5<br><small>intens kleur</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov02-lt" value="type6">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type6" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 6<br><small>enkele lijn</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov02-lt" value="type7">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type7" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 7<br><small>twee lijnen</small></span>
            </span>
          </label>
        </div>

        <label style="margin-top:10px">Hoogte</label>
        <div class="subtype-knoppen" id="ov02-lijnhoogte">
          <button class="actief" data-hoogte="middel" type="button">Middel</button>
          <button data-hoogte="klein" type="button">Klein</button>
        </div>
      </div>

      <!-- STAP 5: Ondertitel -->
      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">5</span> Ondertitel (vrij)
        </label>
        <input type="text" id="ov02-ondertitel" placeholder="bv. Week 12 — MKM-woorden">
      </div>
    `;
  },

  /* Geen oefenvormen-tabs */
  oefenvormenPerNiveau: { basis: [], kern: [], verdieping: [] },

  /* ---------- WERKBLAD GENEREREN ---------- */
  genereerBlad: function(opties, metAntwoorden = false) {
    const o = opties.ov02 || {};
    
    // metPlaatje: leerkracht-toggle. Bij voorkeur uit opties (gezet door 
    // bundel/herhalingsbundel), anders fallback op live DOM-checkbox (werkblad-modus preview).
    let metPlaatje;
    if (typeof o.metPlaatje === "boolean") {
      metPlaatje = o.metPlaatje;
    } else {
      // Fallback: lees uit live zijbalk-checkbox
      const cb = document.querySelector("#ov02-met-plaatje");
      metPlaatje = cb ? cb.checked : false;
    }
    
    const aantalWoorden = o.aantalWoorden || 8;
    const lijntype    = o.lijntype || "type3";
    const lijnhoogte  = o.lijnhoogte || "middel";
    const ondertitel  = o.ondertitel || "";

    // Gekozen woorden uit woordenkiezer
    const gekozenWoorden = window._weekdictee_gekozenWoorden || [];

    if (gekozenWoorden.length === 0) {
      return `<div class="werkblad ov02-blad">
        <div class="weekdictee-empty">
          <h3>📋 Nog geen woorden gekozen</h3>
          <p>Klik op <strong>"Open woordenkiezer"</strong> in de zijbalk om woorden te selecteren.</p>
        </div>
      </div>`;
    }

    // Kies woorden
    const woorden = this._kiesWoorden(gekozenWoorden, aantalWoorden);

    // Genereer rijen.
    // Maximum 8 woorden per pagina. Bij meer woorden: rij 9 krijgt
    // .pagina-break-voor (forceert page-break in PDF), en daarna alle
    // rijen op pagina 2 krijgen .ov02-rij-pagina2 voor een visuele
    // bovenmarge (anders staan ze tegen de bladrand omdat header/opdracht
    // niet herhaald worden).
    const WOORDEN_PER_PAGINA = 8;
    const sl = window.SpellingSchrijflijnen;
    let rijenHTML = "";
    for (let idx = 0; idx < woorden.length; idx++) {
      const w = woorden[idx];
      const tonen = this._toonWoord(w);
      const plaatjeHtml = metPlaatje ? this._plaatjeHtml(w) : "";
      const plaatjeCel = metPlaatje
        ? `<div class="ov02-plaatje">${plaatjeHtml}</div>`
        : "";

      // 3 schrijflijnen, eventueel met antwoord op elke (bij oplossing)
      let lijnenHTML = "";
      for (let i = 0; i < 3; i++) {
        const antwoordSpan = metAntwoorden
          ? `<span class="ov02-lijn-antwoord">${tonen}</span>`
          : "";
        const canvas = sl
          ? sl.htmlCanvas(lijntype, lijnhoogte, 180)
          : `<div class="ov02-fallback-lijn"></div>`;
        lijnenHTML += `<div class="ov02-lijn-cel">${antwoordSpan}${canvas}</div>`;
      }

      // Bepaal extra classes voor deze rij op basis van index
      const extraClasses = [];
      // Rij 9 (index 8) start een nieuwe pagina
      if (idx === WOORDEN_PER_PAGINA) extraClasses.push("pagina-break-voor");
      // Rijen op pagina 2+: extra marge bovenaan zodat ze niet tegen de rand staan.
      // Alleen de EERSTE rij van pagina 2 krijgt deze marge (anders dubbele
      // ruimte tussen rij 9 en 10).
      if (idx === WOORDEN_PER_PAGINA) extraClasses.push("ov02-rij-pagina2-start");

      const klasseStr = ["ov02-rij", ...extraClasses].join(" ");
      rijenHTML += `
        <div class="${klasseStr}" data-woord="${w.tekst}">
          <button class="rij-verwijder-knop" data-woord="${w.tekst}" title="Verwijder dit woord van het werkblad" type="button">✕</button>
          ${plaatjeCel}
          <div class="ov02-woord">${tonen}</div>
          <div class="ov02-lijnen-blok">${lijnenHTML}</div>
        </div>`;
    }

    // OPLOSSINGEN-badge
    const oplBadge = metAntwoorden
      ? `<span class="oplossingen-badge">OPLOSSINGEN</span>`
      : "";

    return `
      <div class="werkblad ov02-blad lijnhoogte-${lijnhoogte}" data-lijntype="${lijntype}" data-lijnhoogte="${lijnhoogte}">
        <div class="ov01-header">
          <div class="ov01-naam-rij">
            <span data-bewerk-id="naamlabel">Naam:</span>
            <span class="ov01-lijn-naam"></span>
            <span data-bewerk-id="datumlabel">Datum:</span>
            <span class="ov01-lijn-datum"></span>
          </div>
          <h2 class="ov01-titel" data-bewerk-id="titel">
            Woord 3× overschrijven
            ${oplBadge}
          </h2>
          ${ondertitel ? `<p class="ov01-ondertitel" data-bewerk-id="ondertitel">${ondertitel}</p>` : ""}
        </div>

        <div class="ov01-stappen">
          <div class="ov01-stappen-label">Opdracht:</div>
          <div class="ov01-stap-rij">
            <span class="ov01-vakje"></span>
            <span>Lees het woord goed en dek dan af.</span>
          </div>
          <div class="ov01-stap-rij">
            <span class="ov01-vakje"></span>
            <span>Schrijf het woord 3 keer op de lijntjes.</span>
          </div>
          <div class="ov01-stap-rij">
            <span class="ov01-vakje"></span>
            <span>Kijk de woorden goed na.</span>
          </div>
        </div>

        <div class="ov02-rooster">
          ${rijenHTML}
        </div>

        <div class="ov01-voettekst">www.jufzisa.be — Juf Zisa's spellinggenerator</div>
      </div>
    `;
  },

  /* ---------- HELPERS ---------- */
  _toonWoord: function(w) {
    if (typeof w === "string") return w;
    // OV02: nooit lidwoord erbij — bij overschrijven oefent het kind 
    // het pure woord, en de schrijflijntjes krijgen meer ruimte.
    return w.tekst;
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
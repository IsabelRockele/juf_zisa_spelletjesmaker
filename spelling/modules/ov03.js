/* ==========================================================
   Module: OV03 — Letters door elkaar
   
   Drie niveaus met oplopende moeilijkheid:
   - BASIS:      plaatje + letters in hokjes + schrijflijn
   - KERN:       geen plaatje + letters in hokjes (1e letter blauw) + schrijflijn
   - VERDIEPING: geen plaatje + letters in hokjes (geen kleur) + schrijflijn
   
   Letters worden geschud zodat ze NIET in juiste volgorde staan.
   Lidwoorden worden weggelaten — kale woorden geven betere oefening.
   ========================================================== */

window.SpellingModules = window.SpellingModules || {};

window.SpellingModules.ov03 = {

  naam: "Letters door elkaar",
  graad: 1,

  /* Maximum aantal woorden per niveau dat comfortabel op 1 A4 past.
     Layout is 2 kolommen, dus altijd een even getal.
     ⭐ basis = 8 (4×2, met afbeelding — extra hoogte door emoji)
     ⭐⭐ kern = 10 (5×2, zonder afbeelding, eerste letter blauw)
     ⭐⭐⭐ verdieping = 10 (5×2, zonder afbeelding, lidwoord erbij op de lijn)
     ⭐⭐⭐⭐ uitbreiding = 8 (4×2) — minder woorden omdat er onderaan
        nog een zin-opdracht met 2 extra schrijflijnen komt. */
  _maxPerNiveau: {
    basis: 8,
    kern: 10,
    verdieping: 10,
    uitbreiding: 8
  },

  /* ---------- INSTELLINGEN UI (zijbalk) ---------- */
  renderInstellingen: function() {
    return `
      <h2>Instellingen</h2>

      <!-- STAP 1: Woordenkiezer -->
      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">1</span> Kies je woorden
        </label>
        <button class="wd-kiezer-knop" id="ov03-open-kiezer" type="button">
          📋 Open woordenkiezer
        </button>
        <p class="wd-stap-info" id="ov03-keuze-info">
          Nog geen woorden gekozen.
        </p>
      </div>

      <!-- STAP 2: Niveau(s) met vinkjes -->
      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">2</span> Niveau(s)
        </label>
        <p class="wd-stap-info" style="margin-bottom:10px;">
          Vink één of meer niveaus aan. Voor elk niveau wordt een werkblad gemaakt.
        </p>
        <div id="ov03-niveaus">
          <label class="ov-niveau-vink actief">
            <input type="checkbox" data-niveau="basis" checked>
            <div class="ov-niveau-vink-tekst">
              <strong>⭐ Oefenen</strong>
              <small>Plaatje + letters door elkaar in hokjes. Kind schikt en schrijft. Plaatje helpt om het woord te vinden.</small>
            </div>
          </label>
          <label class="ov-niveau-vink">
            <input type="checkbox" data-niveau="kern">
            <div class="ov-niveau-vink-tekst">
              <strong>⭐⭐ Toepassen</strong>
              <small>Geen plaatje, wel eerste letter in blauw als hint. Kind moet het woord echt kennen.</small>
            </div>
          </label>
          <label class="ov-niveau-vink">
            <input type="checkbox" data-niveau="verdieping">
            <div class="ov-niveau-vink-tekst">
              <strong>⭐⭐⭐ Verdiepen</strong>
              <small>Alleen letters door elkaar, geen hint. Voor wie de woorden goed kent en zelfstandig kan zoeken.</small>
            </div>
          </label>
          <label class="ov-niveau-vink">
            <input type="checkbox" data-niveau="uitbreiding">
            <div class="ov-niveau-vink-tekst">
              <strong>⭐⭐⭐⭐ Uitbreiden</strong>
              <small>Letters door elkaar + kind bedenkt zelf nog 2 woorden uit de categorie. Creatieve uitbreiding.</small>
            </div>
          </label>
        </div>
      </div>

      <!-- STAP 3: Aantal woorden -->
      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">3</span> Aantal woorden
        </label>
        <input type="number" id="ov03-aantal-woorden" min="3" max="20" value="8">
      </div>

      <!-- STAP 4: Schrijflijnen -->
      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">4</span> Schrijflijnen
        </label>
        <label style="margin-top:6px">Type schrijflijn</label>
        <div class="lijntype-keuze" id="ov03-lijntype">
          <label class="lijntype-radio">
            <input type="radio" name="ov03-lt" value="type1">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type1" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 1<br><small>klassiek hulp</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov03-lt" value="type2">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type2" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 2<br><small>standaard</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov03-lt" value="type3" checked>
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type3" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 3<br><small>kleurgecodeerd</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov03-lt" value="type4">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type4" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 4<br><small>grijs-blauw</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov03-lt" value="type5">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type5" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 5<br><small>intens kleur</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov03-lt" value="type6">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type6" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 6<br><small>enkele lijn</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov03-lt" value="type7">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type7" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 7<br><small>twee lijnen</small></span>
            </span>
          </label>
        </div>

        <label style="margin-top:10px">Hoogte</label>
        <div class="subtype-knoppen" id="ov03-lijnhoogte">
          <button class="actief" data-hoogte="middel" type="button">Middel</button>
          <button data-hoogte="klein" type="button">Klein</button>
        </div>
      </div>

      <!-- STAP 5: Ondertitel -->
      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">5</span> Ondertitel (vrij)
        </label>
        <input type="text" id="ov03-ondertitel" placeholder="bv. Week 12 — MKM-woorden">
      </div>
    `;
  },

  /* Geen oefenvormen-tabs */
  oefenvormenPerNiveau: { basis: [], kern: [], verdieping: [] },

  /* ---------- WERKBLAD GENEREREN ---------- */
  genereerBlad: function(opties, metAntwoorden = false) {
    const o = opties.ov03 || {};
    const niveaus = o.niveaus && o.niveaus.length > 0 ? o.niveaus : ["basis"];
    const lijntype    = o.lijntype || "type3";
    const lijnhoogte  = o.lijnhoogte || "middel";
    const ondertitel  = o.ondertitel || "";

    const _ruwePool = window._weekdictee_gekozenWoorden || [];
    // Vangnet-laag: ontdubbel pool zodat geen synoniem-paren
    // (kip/hen) of tekst-dups twee keer op hetzelfde blad komen.
    const gekozenWoorden = window.SpellingDedup
      ? window.SpellingDedup.ontdubbel(_ruwePool)
      : _ruwePool;

    if (gekozenWoorden.length === 0) {
      return `<div class="werkblad ov03-blad">
        <div class="weekdictee-empty">
          <h3>📋 Nog geen woorden gekozen</h3>
          <p>Klik op <strong>"Open woordenkiezer"</strong> in de zijbalk om woorden te selecteren.</p>
        </div>
      </div>`;
    }

    // Aantal woorden komt nu uit _maxPerNiveau. Als opties.aantalWoorden
    // expliciet gezet is en kleiner dan max (na ✕'en in bundel), respecteer
    // dat. Anders standaard naar max.
    const aantalVoor = (niveau) => {
      const max = this._maxPerNiveau[niveau] || 12;
      const expliciet = o.aantalWoorden;
      if (typeof expliciet === "number" && expliciet > 0 && expliciet <= max) {
        return expliciet;
      }
      return max;
    };

    // Voor elk gekozen niveau: één werkblad.
    // BASIS toont plaatjes — daarvoor filteren we op woorden met afbeelding=true.
    // Kern/verdieping/uitbreiding tonen geen plaatjes — daar mag alles in.
    return niveaus.map(niveau => {
      let poolDitNiveau = gekozenWoorden;
      if (niveau === "basis" && window.SpellingDedup) {
        const metAfb = window.SpellingDedup.filterMetAfbeelding(gekozenWoorden);
        if (metAfb.length === 0) {
          window.SpellingDedup.toonGeenPlaatjesMelding("Letters door elkaar — Basis");
          return `<div class="werkblad ov03-blad">
            <div class="weekdictee-empty">
              <h3>🖼️ Geen woorden met plaatje voor Basis</h3>
              <p>Het basis-niveau van deze oefenvorm toont plaatjes. Kies woorden met 🖼️ in de woordenkiezer.</p>
            </div>
          </div>`;
        }
        poolDitNiveau = metAfb;
      }
      const woorden = this._kiesWoorden(poolDitNiveau, aantalVoor(niveau));
      return this._renderEenBlad(niveau, woorden, lijntype, lijnhoogte, ondertitel, metAntwoorden);
    }).join("");
  },

  _renderEenBlad: function(niveau, woorden, lijntype, lijnhoogte, ondertitel, metAntwoorden) {
    const sl = window.SpellingSchrijflijnen;
    
    // Niveau-specifieke instellingen
    const metPlaatje = (niveau === "basis");
    const eersteLetterGekleurd = (niveau === "kern");
    // Bij verdieping en uitbreiding schrijft het kind het lidwoord erbij.
    // Dat is een extra pedagogische stap (de/het-keuze) bovenop het puzzel-deel.
    const metLidwoord = (niveau === "verdieping" || niveau === "uitbreiding");

    // Genereer cellen — 2 kolommen × n rijen via CSS grid (ov03-rooster-2kol).
    // Elke cel bevat verticaal: [afbeelding?] [letters in hokjes] [schrijflijn]
    let cellenHTML = "";
    for (const w of woorden) {
      // Kale woord-tekst (zonder lidwoord) voor het puzzel-deel
      const woord = w.tekst;
      const plaatjeHtml = metPlaatje ? this._plaatjeHtml(w) : "";
      
      // Letters schudden — niet in juiste volgorde
      const geschudte = this._schudLetters(woord);
      
      // Render hokjes; bij kern krijgt eerste letter van het juiste woord
      // blauwe kleur — slechts één hokje (de eerste voorkomende match)
      let hokjesHTML;
      if (eersteLetterGekleurd) {
        let alGekleurd = false;
        hokjesHTML = geschudte.map(letter => {
          let kleurClass = "";
          if (!alGekleurd && letter === woord[0]) {
            kleurClass = " ov03-hokje-blauw";
            alGekleurd = true;
          }
          return `<span class="ov03-hokje${kleurClass}">${letter}</span>`;
        }).join("");
      } else {
        hokjesHTML = geschudte.map(letter => 
          `<span class="ov03-hokje">${letter}</span>`
        ).join("");
      }

      // Afbeelding-blok (alleen bij basis)
      const plaatjeBlok = metPlaatje
        ? `<div class="ov03-cel-plaatje">${plaatjeHtml}</div>`
        : "";

      // Schrijflijn — bij verdieping en uitbreiding moet er ook een
      // lidwoord op de lijn komen. Bij oplossingen tonen we het volledige
      // antwoord (lidwoord + woord), of alleen het woord als er geen
      // lidwoord is (bv. werkwoord-infinitief).
      let antwoordTekst = woord;
      if (metLidwoord && w.lidwoord) {
        antwoordTekst = `${w.lidwoord} ${woord}`;
      }
      const antwoordSpan = metAntwoorden
        ? `<span class="ov03-lijn-antwoord">${this._maakAntwoord(antwoordTekst, eersteLetterGekleurd)}</span>`
        : "";
      // Iets smallere canvas-breedte want 2 kolommen ipv 1 brede rij
      const canvas = sl
        ? sl.htmlCanvas(lijntype, lijnhoogte, 240)
        : `<div class="ov03-fallback-lijn"></div>`;

      // Niveau-specifieke class voor styling (basis heeft plaatje-styling enz.)
      const celClass = `ov03-cel ov03-cel-${niveau}`;

      cellenHTML += `
        <div class="${celClass}" data-woord="${w.tekst}">
          <button class="rij-verwijder-knop" data-woord="${w.tekst}" title="Verwijder dit woord van het werkblad" type="button">✕</button>
          ${plaatjeBlok}
          <div class="ov03-cel-letters">${hokjesHTML}</div>
          <div class="ov03-cel-lijn">${antwoordSpan}${canvas}</div>
        </div>`;
    }

    const niveauLabel = {
      basis: "⭐",
      kern: "⭐⭐",
      verdieping: "⭐⭐⭐",
      uitbreiding: "⭐⭐⭐⭐"
    }[niveau];

    const oplBadge = metAntwoorden
      ? `<span class="oplossingen-badge">OPLOSSINGEN</span>`
      : "";

    return `
      <div class="werkblad ov03-blad lijnhoogte-${lijnhoogte}" data-lijntype="${lijntype}" data-lijnhoogte="${lijnhoogte}" data-niveau="${niveau}">
        <div class="ov01-header">
          <div class="ov01-naam-rij">
            <span data-bewerk-id="naamlabel-${niveau}">Naam:</span>
            <span class="ov01-lijn-naam"></span>
            <span data-bewerk-id="datumlabel-${niveau}">Datum:</span>
            <span class="ov01-lijn-datum"></span>
          </div>
          <h2 class="ov01-titel" data-bewerk-id="titel-${niveau}">
            Letters door elkaar
            <span class="ov01-niveau-badge ov01-niveau-${niveau}">${niveauLabel}</span>
            ${oplBadge}
          </h2>
          ${ondertitel ? `<p class="ov01-ondertitel" data-bewerk-id="ondertitel-${niveau}">${ondertitel}</p>` : ""}
        </div>

        <div class="ov01-stappen">
          <div class="ov01-stappen-label">Opdracht:</div>
          <div class="ov01-stap-rij">
            <span class="ov01-vakje"></span>
            <span>Kijk goed naar de letters.</span>
          </div>
          <div class="ov01-stap-rij">
            <span class="ov01-vakje"></span>
            <span>${metLidwoord
              ? "Schrijf <strong>het lidwoord (de / het)</strong> én het juiste woord op de lijn."
              : "Schrijf het juiste woord op de lijn."}</span>
          </div>
          <div class="ov01-stap-rij">
            <span class="ov01-vakje"></span>
            <span>Lees het woord en kijk goed na.</span>
          </div>
        </div>

        <div class="ov03-rooster ov03-rooster-2kol">
          ${cellenHTML}
        </div>

        ${niveau === "uitbreiding" ? this._renderUitbreidingBlok(lijntype, lijnhoogte, metAntwoorden) : ""}

        <div class="ov01-voettekst">www.jufzisa.be — Juf Zisa's spellinggenerator</div>
      </div>
    `;
  },

  /* ----- Uitbreiding-blok onderaan ov03 ----- */
  _renderUitbreidingBlok: function(lijntype, lijnhoogte, metAntwoorden) {
    const sl = window.SpellingSchrijflijnen;
    // Smallere canvases want 2 lijnen naast elkaar (was 580 voor 1 brede lijn)
    const lijn = () => sl
      ? `<div class="ov01-zin-canvas-wrap">${sl.htmlCanvas(lijntype, lijnhoogte, 270)}</div>`
      : `<div class="ov01-zin-lijn"></div>`;
    
    const opl = metAntwoorden
      ? `<p class="ov01-zin-richtlijn">Verwacht: het kind bedenkt 2 eigen woorden van dezelfde soort, met lidwoord ervoor (de/het).</p>`
      : "";
    
    return `
      <div class="ov01-zin-blok ov01-uitbreiding-blok">
        <div class="ov01-stappen-label">⭐⭐⭐⭐ Extra opdracht (uitbreiden):</div>
        <p class="ov01-zin-vraag">Bedenk zelf nog 2 woorden en schrijf het lidwoord (de of het) erbij.</p>
        <div class="ov03-uitbr-lijnen">
          ${lijn()}
          ${lijn()}
        </div>
        ${opl}
      </div>
    `;
  },

  /* Bouw antwoord-tekst voor de oplossingenpagina.
     Bij kern-niveau krijgt de eerste letter blauwe styling. */
  _maakAntwoord: function(woord, eersteLetterGekleurd) {
    if (!eersteLetterGekleurd || !woord) return woord;
    return `<span style="color:#2196F3;">${woord[0]}</span>${woord.slice(1)}`;
  },

  /* Schud letters — zorg dat ze NIET in juiste volgorde staan.
     Bij woorden van 1-2 letters: kunnen niet anders dan zelfde, maar
     dat zal in praktijk bijna nooit voorkomen. */
  _schudLetters: function(woord) {
    if (woord.length <= 1) return [...woord];
    
    const origineel = woord;
    let geschud;
    let pogingen = 0;
    do {
      geschud = [...woord];
      // Fisher-Yates shuffle met seed
      for (let i = geschud.length - 1; i > 0; i--) {
        const j = Math.floor(this._random() * (i + 1));
        [geschud[i], geschud[j]] = [geschud[j], geschud[i]];
      }
      pogingen++;
    } while (geschud.join("") === origineel && pogingen < 10);
    
    return geschud;
  },

  /* ---------- HELPERS ---------- */
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
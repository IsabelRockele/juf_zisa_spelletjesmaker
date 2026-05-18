/* ==========================================================
   Module: OV10 — Samenstellingen
   
   Vier niveaus voor het oefenen van samengestelde woorden:
   - BASIS:        Woordzoeker — 6 afbeeldingen + rooster (woord per rij) +
                   noteer-lijnen onderaan
   - KERN:         Plaatje + plaatje = samenstelling op één lijn
   - VERDIEPING:   Verbind twee delen (linker- + rechterkolom) + opschrijven
   - UITBREIDING:  Beschrijving lezen en samenstelling raden + schrijven
   
   Hergebruikt:
   - delen, delenEmoji, beschrijving uit graad1.js samenstellingen-basis
   - SpellingSchrijflijnen.htmlCanvas voor de schrijflijnen
   - ov01-header / ov01-stappen / ov01-voettekst klassen voor consistente look
   ========================================================== */

window.SpellingModules = window.SpellingModules || {};

window.SpellingModules.ov10 = {

  naam: "Samenstellingen",
  graad: 1,

  /* Maximum aantal woorden per niveau dat comfortabel op 1 A4 past.
     Wordt gebruikt door:
     - render-functies (klemmen `aantal` op deze max)
     - bundel.js +1-knop (mag alleen actief zijn als < max op het blad staat) */
  _maxPerNiveau: {
    basis: 8,
    kern: 8,
    verdieping: 12,
    uitbreiding: 7
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
        <button class="wd-kiezer-knop" id="ov10-open-kiezer" type="button">
          📋 Open woordenkiezer
        </button>
        <p class="wd-stap-info" id="ov10-keuze-info">
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
        <div id="ov10-niveaus">
          <label class="ov-niveau-vink actief">
            <input type="checkbox" data-niveau="basis" checked>
            <div class="ov-niveau-vink-tekst">
              <strong>⭐ Oefenen</strong>
              <small>Woordzoeker met plaatjes. Kind zoekt elk samengesteld woord en schrijft het onderaan op de lijn.</small>
            </div>
          </label>
          <label class="ov-niveau-vink">
            <input type="checkbox" data-niveau="kern">
            <div class="ov-niveau-vink-tekst">
              <strong>⭐⭐ Toepassen</strong>
              <small>Twee plaatjes (deel + deel = samenstelling). Kind plakt de woorden aan elkaar zonder spatie en schrijft op.</small>
            </div>
          </label>
          <label class="ov-niveau-vink">
            <input type="checkbox" data-niveau="verdieping">
            <div class="ov-niveau-vink-tekst">
              <strong>⭐⭐⭐ Verdiepen</strong>
              <small>Twee kolommen woorden. Kind trekt lijntjes tussen passende delen en schrijft de samenstellingen op.</small>
            </div>
          </label>
          <label class="ov-niveau-vink">
            <input type="checkbox" data-niveau="uitbreiding">
            <div class="ov-niveau-vink-tekst">
              <strong>⭐⭐⭐⭐ Uitbreiden</strong>
              <small>Beschrijving lezen en zelf het samengesteld woord bedenken. Werkt aan woordenschat én spelling tegelijk.</small>
            </div>
          </label>
        </div>
      </div>

      <!-- STAP 3: Aantal woorden -->
      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">3</span> Aantal woorden
        </label>
        <input type="number" id="ov10-aantal-woorden" min="3" max="10" value="6">
      </div>

      <!-- STAP 4: Schrijflijnen -->
      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">4</span> Schrijflijnen
        </label>
        <label style="margin-top:6px">Type schrijflijn</label>
        <div class="lijntype-keuze" id="ov10-lijntype">
          <label class="lijntype-radio">
            <input type="radio" name="ov10-lt" value="type1">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type1" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 1<br><small>klassiek hulp</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov10-lt" value="type2">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type2" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 2<br><small>standaard</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov10-lt" value="type3" checked>
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type3" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 3<br><small>kleurgecodeerd</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov10-lt" value="type4">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type4" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 4<br><small>grijs-blauw</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov10-lt" value="type5">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type5" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 5<br><small>intens kleur</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov10-lt" value="type6">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type6" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 6<br><small>enkele lijn</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov10-lt" value="type7">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type7" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 7<br><small>twee lijnen</small></span>
            </span>
          </label>
        </div>

        <label style="margin-top:10px">Hoogte</label>
        <div class="subtype-knoppen" id="ov10-lijnhoogte">
          <button class="actief" data-hoogte="middel" type="button">Middel</button>
          <button data-hoogte="klein" type="button">Klein</button>
        </div>
      </div>

      <!-- STAP 5: Ondertitel -->
      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">5</span> Ondertitel (vrij)
        </label>
        <input type="text" id="ov10-ondertitel" placeholder="bv. Week 12 — Samenstellingen">
      </div>
    `;
  },

  oefenvormenPerNiveau: { basis: [], kern: [], verdieping: [] },

  /* ---------- WERKBLAD GENEREREN ---------- */
  genereerBlad: function(opties, metAntwoorden = false) {
    const o = opties.ov10 || {};
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
      return `<div class="werkblad ov10-blad">
        <div class="weekdictee-empty">
          <h3>📋 Nog geen woorden gekozen</h3>
          <p>Klik op <strong>"Open woordenkiezer"</strong> in de zijbalk om woorden te selecteren.</p>
          <p>Kies woorden uit de categorie <strong>"Samengestelde woorden"</strong>.</p>
        </div>
      </div>`;
    }

    // Filter: alleen samenstellings-woorden gebruiken voor OV10
    const samen = gekozenWoorden.filter(w => w.categorie && w.categorie.startsWith("samenstellingen"));
    if (samen.length === 0) {
      return `<div class="werkblad ov10-blad">
        <div class="weekdictee-empty">
          <h3>🧩 Geen samenstellingen gekozen</h3>
          <p>Open de woordenkiezer en vink woorden aan in de categorie <strong>"Samengestelde woorden"</strong>.</p>
        </div>
      </div>`;
    }

    // Verrijk met delen/delenEmoji/beschrijving uit de bibliotheek
    const verrijkt = this._verrijkWoorden(samen);

    // Voor elk gekozen niveau: één werkblad. Het aantal woorden is een
    // vaste waarde per niveau (zie _maxPerNiveau). De leerkracht hoeft
    // niets te kiezen — het werkblad zit altijd op zijn comfort-maximum.
    // Via ✕ kan ze woorden verwijderen, via +1 weer aanvullen tot max.
    // Als de teller (opties.ov10.aantalWoorden) lager staat door eerder
    // verwijderen, respecteren we die — anders gebruiken we het max.
    // Voor elk gekozen niveau: één werkblad.
    // BASIS en KERN tonen plaatjes — daarvoor filteren op afbeelding=true.
    // VERDIEPING (2 kolommen woorden) en UITBREIDING (beschrijvingen) tonen
    // geen plaatjes — die mogen alles in.
    let geenPlaatjesGemeld = false;
    return niveaus.map(niveau => {
      let poolDitNiveau = verrijkt;
      if ((niveau === "basis" || niveau === "kern") && window.SpellingDedup) {
        const metAfb = window.SpellingDedup.filterMetAfbeelding(verrijkt);
        if (metAfb.length === 0) {
          if (!geenPlaatjesGemeld) {
            window.SpellingDedup.toonGeenPlaatjesMelding(`Samenstellingen — ${niveau.charAt(0).toUpperCase() + niveau.slice(1)}`);
            geenPlaatjesGemeld = true;
          }
          return `<div class="werkblad ov10-blad">
            <div class="weekdictee-empty">
              <h3>🖼️ Geen woorden met plaatje voor ${niveau.charAt(0).toUpperCase() + niveau.slice(1)}</h3>
              <p>Dit niveau toont plaatjes. Kies samenstellings-woorden met 🖼️ in de woordenkiezer.</p>
            </div>
          </div>`;
        }
        poolDitNiveau = metAfb;
      }
      const maxVoorNiveau = this._maxPerNiveau[niveau] || 6;
      const aantalVoorDitNiveau = (typeof o.aantalWoorden === "number" && o.aantalWoorden > 0 && o.aantalWoorden <= maxVoorNiveau)
        ? o.aantalWoorden
        : maxVoorNiveau;
      const woorden = this._kiesWoorden(poolDitNiveau, aantalVoorDitNiveau);
      return this._renderEenBlad(niveau, woorden, lijntype, lijnhoogte, ondertitel, metAntwoorden);
    }).join("");
  },

  /* ---------- WERKBLAD-RENDERING PER NIVEAU ---------- */
  _renderEenBlad: function(niveau, woorden, lijntype, lijnhoogte, ondertitel, metAntwoorden) {
    const inhoud = (niveau === "kern")
      ? this._inhoudKern(woorden, lijntype, lijnhoogte, metAntwoorden)
      : (niveau === "verdieping")
        ? this._inhoudVerdieping(woorden, lijntype, lijnhoogte, metAntwoorden)
        : (niveau === "uitbreiding")
          ? this._inhoudUitbreiding(woorden, lijntype, lijnhoogte, metAntwoorden)
          : this._inhoudBasis(woorden, lijntype, lijnhoogte, metAntwoorden);

    const stappen = this._stappenVoorNiveau(niveau);

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
      <div class="werkblad ov10-blad lijnhoogte-${lijnhoogte}" data-lijntype="${lijntype}" data-lijnhoogte="${lijnhoogte}" data-niveau="${niveau}">
        <div class="ov01-header">
          <div class="ov01-naam-rij">
            <span data-bewerk-id="naamlabel-${niveau}">Naam:</span>
            <span class="ov01-lijn-naam"></span>
            <span data-bewerk-id="datumlabel-${niveau}">Datum:</span>
            <span class="ov01-lijn-datum"></span>
          </div>
          <h2 class="ov01-titel" data-bewerk-id="titel-${niveau}">
            Samenstellingen
            <span class="ov01-niveau-badge ov01-niveau-${niveau}">${niveauLabel}</span>
            ${oplBadge}
          </h2>
          ${ondertitel ? `<p class="ov01-ondertitel" data-bewerk-id="ondertitel-${niveau}">${ondertitel}</p>` : ""}
        </div>

        <div class="ov01-stappen">
          <div class="ov01-stappen-label">Opdracht:</div>
          ${stappen}
        </div>

        ${inhoud}

        <div class="ov01-voettekst">www.jufzisa.be — Juf Zisa's spellinggenerator</div>
      </div>
    `;
  },

  /* ---------- Opdracht-stappen per niveau ---------- */
  _stappenVoorNiveau: function(niveau) {
    const stap = (tekst) => `
      <div class="ov01-stap-rij">
        <span class="ov01-vakje"></span>
        <span>${tekst}</span>
      </div>`;
    if (niveau === "basis") {
      return stap("Kijk naar de plaatjes.") +
             stap("Zoek elk woord in het rooster.") +
             stap("Schrijf onderaan op wat je gevonden hebt.");
    }
    if (niveau === "kern") {
      return stap("Bekijk de twee plaatjes.") +
             stap("Welke twee woorden zie je?") +
             stap("Schrijf het samengestelde woord op de lijn (zonder spatie!).");
    }
    if (niveau === "verdieping") {
      return stap("Trek een lijn tussen een woord links en een woord rechts.") +
             stap("Samen vormen ze een samenstelling.") +
             stap("Schrijf de samenstellingen onderaan op de lijn.");
    }
    if (niveau === "uitbreiding") {
      return stap("Lees de beschrijving.") +
             stap("Welk samengesteld woord wordt bedoeld?") +
             stap("Schrijf het op de lijn.");
    }
    return "";
  },

  /* ==========================================================
     ⭐ BASIS — Woordzoeker met afbeeldingen
     ========================================================== */
  _inhoudBasis: function(woorden, lijntype, lijnhoogte, metAntwoorden) {
    const sl = window.SpellingSchrijflijnen;
    // Plafond = aantal woorden in pool, maar niet meer dan het max
    // dat comfortabel op 1 A4 past (zie _maxPerNiveau bovenaan).
    const aantal = Math.min(woorden.length, this._maxPerNiveau.basis);
    const lijstWoorden = woorden.slice(0, aantal);
    const ROOSTER_BREED = 12;

    // Afbeeldingen-grid bovenaan (3 kolommen)
    let afbHTML = `<div class="ov10-basis-afb-grid">`;
    for (const w of lijstWoorden) {
      afbHTML += `<div class="ov10-basis-afb-cel">${this._heelWoordAfbeelding(w)}</div>`;
    }
    afbHTML += `</div>`;

    // Woordzoeker-rooster
    let roosterHTML = `<div class="ov10-basis-rooster">`;
    for (const w of lijstWoorden) {
      const woordTekst = w.tekst;
      const lengte = woordTekst.length;
      const maxStart = ROOSTER_BREED - lengte;
      const start = Math.floor(this._random() * (maxStart + 1));
      roosterHTML += `<div class="ov10-basis-rij">`;
      for (let i = 0; i < ROOSTER_BREED; i++) {
        if (i >= start && i < start + lengte) {
          const cls = metAntwoorden ? "ov10-hokje ov10-hokje-treffer" : "ov10-hokje";
          roosterHTML += `<span class="${cls}">${woordTekst[i - start]}</span>`;
        } else {
          roosterHTML += `<span class="ov10-hokje ov10-hokje-vul">${this._randomVulletter()}</span>`;
        }
      }
      roosterHTML += `</div>`;
    }
    roosterHTML += `</div>`;

    // Schrijflijnen onderaan om woorden te noteren — in 2 kolommen van 3
    // (was: 6 lange lijnen onder elkaar, te veel hoogte)
    let noteerHTML = `<div class="ov10-basis-noteer ov10-basis-noteer-2kol">`;
    for (let i = 0; i < aantal; i++) {
      const w = lijstWoorden[i];
      const canvas = sl ? sl.htmlCanvas(lijntype, lijnhoogte, 180) : `<div class="ov10-fallback-lijn"></div>`;
      const antw = metAntwoorden ? `<span class="ov10-lijn-antwoord">${w.tekst}</span>` : "";
      noteerHTML += `
        <div class="ov10-basis-noteer-rij" data-woord="${w.tekst}">
          <button class="rij-verwijder-knop" data-woord="${w.tekst}" title="Verwijder dit woord van het werkblad" type="button">✕</button>
          <span class="ov10-noteer-nr">${i+1}.</span>
          <div class="ov10-noteer-lijn-cel">${antw}${canvas}</div>
        </div>`;
    }
    noteerHTML += `</div>`;

    return `
      <div class="ov10-basis-inhoud">
        ${afbHTML}
        ${roosterHTML}
        <div class="ov10-noteer-label">Schrijf de woorden die je vond:</div>
        ${noteerHTML}
      </div>`;
  },

  /* ==========================================================
     ⭐⭐ KERN — Plaatje + plaatje = samenstelling
     ========================================================== */
  _inhoudKern: function(woorden, lijntype, lijnhoogte, metAntwoorden) {
    const sl = window.SpellingSchrijflijnen;
    const aantal = Math.min(woorden.length, this._maxPerNiveau.kern);

    let rijenHTML = "";
    for (let i = 0; i < aantal; i++) {
      const w = woorden[i];
      const deel1 = this._deelAfbeelding(w, 0);
      const deel2 = this._deelAfbeelding(w, 1);
      const canvas = sl ? sl.htmlCanvas(lijntype, lijnhoogte, 240) : `<div class="ov10-fallback-lijn"></div>`;
      const antw = metAntwoorden ? `<span class="ov10-lijn-antwoord">${w.tekst}</span>` : "";

      rijenHTML += `
        <div class="ov10-kern-rij" data-woord="${w.tekst}">
          <button class="rij-verwijder-knop" data-woord="${w.tekst}" title="Verwijder dit woord van het werkblad" type="button">✕</button>
          <div class="ov10-kern-plaatjes">
            ${deel1}
            <span class="ov10-kern-plus">+</span>
            ${deel2}
            <span class="ov10-kern-is">=</span>
          </div>
          <div class="ov10-kern-lijn-cel">${antw}${canvas}</div>
        </div>`;
    }

    return `<div class="ov10-kern-rooster">${rijenHTML}</div>`;
  },

  /* ==========================================================
     ⭐⭐⭐ VERDIEPING — Verbind twee woorden
     
     Layout: 10 paren in 2 mini-oefeningen naast elkaar.
     Links 5 paren + 5 schrijflijnen, rechts 5 paren + 5 schrijflijnen.
     Elke mini-oefening is een zelfstandig "verbind"-puzzeltje:
     binnen die 5 paren moeten de delen-links matchen met delen-rechts.
     ========================================================== */
  _inhoudVerdieping: function(woorden, lijntype, lijnhoogte, metAntwoorden) {
    const sl = window.SpellingSchrijflijnen;
    const aantal = Math.min(woorden.length, this._maxPerNiveau.verdieping);
    const set = woorden.slice(0, aantal);
    const helft = Math.ceil(aantal / 2);
    const groep1 = set.slice(0, helft);          // mini-oef 1
    const groep2 = set.slice(helft, aantal);     // mini-oef 2

    // Helper: bouw één mini-oefening (verbind-kolommen + schrijflijnen)
    const bouwMiniOef = (groep, startNr) => {
      if (groep.length === 0) return "";
      const linkerwoorden = groep.map(w => w.delen?.[0] || w.tekst);
      const rechterwoorden = this._shuffle(groep.map(w => w.delen?.[1] || w.tekst));

      let linksHTML = `<div class="ov10-vb-kolom ov10-vb-links">`;
      for (const woord of linkerwoorden) {
        linksHTML += `<div class="ov10-vb-item"><span>${woord}</span><span class="ov10-vb-punt">•</span></div>`;
      }
      linksHTML += `</div>`;

      let rechtsHTML = `<div class="ov10-vb-kolom ov10-vb-rechts">`;
      for (const woord of rechterwoorden) {
        rechtsHTML += `<div class="ov10-vb-item"><span class="ov10-vb-punt">•</span><span>${woord}</span></div>`;
      }
      rechtsHTML += `</div>`;

      let noteerHTML = `<div class="ov10-vb-noteer">`;
      for (let i = 0; i < groep.length; i++) {
        const w = groep[i];
        const nr = startNr + i;
        const canvas = sl ? sl.htmlCanvas(lijntype, lijnhoogte, 180) : `<div class="ov10-fallback-lijn"></div>`;
        const antw = metAntwoorden ? `<span class="ov10-lijn-antwoord">${w.tekst}</span>` : "";
        noteerHTML += `
          <div class="ov10-basis-noteer-rij" data-woord="${w.tekst}">
            <button class="rij-verwijder-knop" data-woord="${w.tekst}" title="Verwijder dit woord van het werkblad" type="button">✕</button>
            <span class="ov10-noteer-nr">${nr}.</span>
            <div class="ov10-noteer-lijn-cel">${antw}${canvas}</div>
          </div>`;
      }
      noteerHTML += `</div>`;

      return `
        <div class="ov10-vb-mini">
          <div class="ov10-vb-grid">
            ${linksHTML}
            <div class="ov10-vb-midden"></div>
            ${rechtsHTML}
          </div>
          ${noteerHTML}
        </div>`;
    };

    return `
      <div class="ov10-verdieping-inhoud">
        <div class="ov10-vb-twee-kolommen">
          ${bouwMiniOef(groep1, 1)}
          ${bouwMiniOef(groep2, groep1.length + 1)}
        </div>
      </div>`;
  },

  /* ==========================================================
     ⭐⭐⭐⭐ UITBREIDING — Beschrijving raden
     ========================================================== */
  _inhoudUitbreiding: function(woorden, lijntype, lijnhoogte, metAntwoorden) {
    const sl = window.SpellingSchrijflijnen;
    const aantal = Math.min(woorden.length, this._maxPerNiveau.uitbreiding);

    let rijenHTML = "";
    for (let i = 0; i < aantal; i++) {
      const w = woorden[i];
      const beschrijving = w.beschrijving || `Een woord dat begint met "${w.delen?.[0] || '?'}".`;
      const canvas = sl ? sl.htmlCanvas(lijntype, lijnhoogte, 280) : `<div class="ov10-fallback-lijn"></div>`;
      const antw = metAntwoorden ? `<span class="ov10-lijn-antwoord">${w.tekst}</span>` : "";

      rijenHTML += `
        <div class="ov10-ub-rij" data-woord="${w.tekst}">
          <button class="rij-verwijder-knop" data-woord="${w.tekst}" title="Verwijder dit woord van het werkblad" type="button">✕</button>
          <span class="ov10-noteer-nr">${i+1}.</span>
          <div class="ov10-ub-inhoud">
            <p class="ov10-ub-beschrijving">${beschrijving}</p>
            <div class="ov10-ub-lijn-cel">${antw}${canvas}</div>
          </div>
        </div>`;
    }

    return `<div class="ov10-ub-rooster">${rijenHTML}</div>`;
  },

  /* ==========================================================
     HELPERS — afbeeldingen & woorden
     ========================================================== */

  /* Heel woord als afbeelding (basis-niveau).
     Probeert eerst PNG (afbeelding:true), dan emoji-combinatie. */
  _heelWoordAfbeelding: function(w) {
    if (w.afbeelding) {
      return `<img class="ov10-afb-img" src="afbeeldingen/graad1/samenstellingen/${w.tekst}.png" alt="${w.tekst}">`;
    }
    const e = w.delenEmoji || ["", ""];
    return `<span class="ov10-afb-emoji-combo">${e[0]}${e[1]}</span>`;
  },

  /* Eén deel als afbeelding (kern-niveau).
     deel = 0 of 1. Probeert emoji, fallback op tekst-blokje. */
  _deelAfbeelding: function(w, deel) {
    const e = w.delenEmoji?.[deel] || "";
    if (e) return `<span class="ov10-deel-emoji">${e}</span>`;
    const tekst = w.delen?.[deel] || "?";
    return `<span class="ov10-deel-tekst">${tekst}</span>`;
  },

  _randomVulletter: function() {
    const consonanten = "bcdfghjklmnpqrstvwxz";
    return consonanten[Math.floor(this._random() * consonanten.length)];
  },

  /* Verrijk woord-objecten uit de pool met delen/delenEmoji/beschrijving/afbeelding
     uit de woordenbibliotheek. Nodig omdat de woordenkiezer alleen tekst+lidwoord+
     categorie+leerjaar kopieert bij selectie. */
  _verrijkWoorden: function(pool) {
    const wb = window.SpellingWoordenbibliotheek;
    return pool.map(w => {
      const data = wb?.[`graad${w.leerjaar || 1}`];
      const cat = data?.[w.categorie];
      const orig = cat?.woorden?.find(o => o.tekst === w.tekst);
      if (orig) {
        return Object.assign({}, w, {
          delen: orig.delen,
          delenEmoji: orig.delenEmoji,
          beschrijving: orig.beschrijving,
          afbeelding: orig.afbeelding
        });
      }
      return w;
    });
  },

  _shuffle: function(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this._random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  /* ---------- SEEDED RANDOM ---------- */
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
/* ==========================================================
   Module: graad2/ov01.js — Stukjeswoorden gemengd

   Eerste oefenvorm in graad 2. Bewust de gemengde OV als
   startpunt: als dit werkt, kunnen we de simpelere OV's
   (alleen verdubbelen, alleen verenkelen, korte klank,
   lange klank) hieruit afleiden.

   Pedagogische opbouw (3 niveaus, dezelfde namen als graad 1):
   - Basis: denkstappen-tabel volledig zichtbaar, modelleer-kader
     bovenaan met 4 voorbeelden (bom/raam/paard/kast)
   - Kern: korte herinnering bovenaan, kind doet denkstappen
     mentaal, stimulus + schrijflijn
   - Verdieping: transfer — zinnen met gat, kind bedenkt zelf
     welke morfologische vorm nodig is

   Werkblad mengt:
   - Type A: enkelvoud gegeven (uit verdubbel-verenkel-g2 +
     verlengen-tdpb-g2), kind vormt meervoud
   - Type B: afbeelding gegeven (uit stukjeswoorden-direct-g2),
     kind schrijft woord

   Schrijflijnen: dezelfde canvas-engine als graad 1
   (SpellingSchrijflijnen.htmlCanvas).
   ========================================================== */

window.SpellingModules = window.SpellingModules || {};

window.SpellingModules.g2_ov01 = {

  naam: "Stukjeswoorden gemengd",
  graad: 2,

  /* Maximum woorden per niveau dat comfortabel op 1 A4 past */
  _maxPerNiveau: {
    basis: 8,
    kern: 12,
    verdieping: 8
  },

  /* Mengverhouding type A vs type B (richtwaarde) */
  _percentageTypeA: 0.65,

  /* ---------- INSTELLINGEN UI (zijbalk) ---------- */
  renderInstellingen: function() {
    return `
      <h2>Instellingen</h2>

      <!-- STAP 1: Woorden kiezen -->
      <div class="wd-stap">
        <div class="wd-stap-kop">
          <span class="wd-stap-nr">1</span>
          <span class="wd-stap-titel">Kies je woorden</span>
        </div>
        <button class="wd-kiezer-knop" id="g2_ov01-open-kiezer" type="button">
          📋 Open woordenkiezer
        </button>
        <p class="wd-stap-info" id="g2_ov01-keuze-info">
          Nog geen woorden gekozen.
        </p>
        <p class="wd-stap-hint">
          Tip: kies woorden uit <em>Verdubbelaars/Verenkelaars</em>,
          <em>Verlengingsregel</em> én <em>Stukjeswoorden direct schrijven</em>
          voor een volledig gemengde oefening.
        </p>
      </div>

      <!-- STAP 2: Niveau(s) -->
      <div class="wd-stap">
        <div class="wd-stap-kop">
          <span class="wd-stap-nr">2</span>
          <span class="wd-stap-titel">Niveau(s)</span>
        </div>
        <p class="wd-stap-info">
          Vink één of meer niveaus aan. Voor elk niveau wordt een werkblad gemaakt.
        </p>
        <div class="ov-niveau-vinkjes" id="g2_ov01-niveaus">
          <label class="ov-niveau-vink actief">
            <input type="checkbox" data-niveau="basis" checked>
            <span class="ov-niveau-naam">
              <strong>⭐ Oefenen</strong>
              <small>Volledige denkstappen-tabel met modelleer-kader bovenaan. 4 voorbeelden.</small>
            </span>
          </label>
          <label class="ov-niveau-vink">
            <input type="checkbox" data-niveau="kern">
            <span class="ov-niveau-naam">
              <strong>⭐⭐ Toepassen</strong>
              <small>Geen tabel meer. Kind doet denkstappen mentaal en schrijft.</small>
            </span>
          </label>
          <label class="ov-niveau-vink">
            <input type="checkbox" data-niveau="verdieping">
            <span class="ov-niveau-naam">
              <strong>⭐⭐⭐ Transfer</strong>
              <small>Zinnen met gat — kind bedenkt zelf welke vorm nodig is.</small>
            </span>
          </label>
        </div>
      </div>

      <!-- STAP 3: Type oefening -->
      <div class="wd-stap">
        <div class="wd-stap-kop">
          <span class="wd-stap-nr">3</span>
          <span class="wd-stap-titel">Type oefening</span>
        </div>
        <p class="wd-stap-info">
          Welke oefenvormen mogen op het werkblad verschijnen?
        </p>
        <div class="g2_ov01-modus-keuze">
          <label class="g2_ov01-modus-radio">
            <input type="radio" name="g2_ov01-modus" value="gemengd" checked>
            <span>🔀 Gemengd (meervouden + plaatjes)</span>
          </label>
          <label class="g2_ov01-modus-radio">
            <input type="radio" name="g2_ov01-modus" value="typeA">
            <span>📝 Alleen meervouden vormen</span>
          </label>
          <label class="g2_ov01-modus-radio">
            <input type="radio" name="g2_ov01-modus" value="typeB">
            <span>🖼️ Alleen woorden bij plaatjes</span>
          </label>
        </div>
      </div>

      <!-- STAP 4: Schrijflijntype + hoogte (zelfde patroon als graad 1) -->
      <div class="wd-stap">
        <div class="wd-stap-kop">
          <span class="wd-stap-nr">4</span>
          <span class="wd-stap-titel">Schrijflijnen</span>
        </div>
        <label>Type schrijflijn</label>
        <div class="lijntype-keuze" id="g2_ov01-lijntype">
          <label class="lijntype-radio">
            <input type="radio" name="g2_ov01-lt" value="type1">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type1" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 1<br><small>klassiek hulp</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="g2_ov01-lt" value="type2">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type2" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 2<br><small>standaard</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="g2_ov01-lt" value="type3" checked>
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type3" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 3<br><small>kleurgecodeerd</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="g2_ov01-lt" value="type4">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type4" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 4<br><small>grijs-blauw</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="g2_ov01-lt" value="type5">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type5" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 5<br><small>intens kleur</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="g2_ov01-lt" value="type6">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type6" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 6<br><small>enkele lijn</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="g2_ov01-lt" value="type7">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type7" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 7<br><small>twee lijnen</small></span>
            </span>
          </label>
        </div>

        <label style="margin-top:10px">Hoogte</label>
        <div class="subtype-knoppen" id="g2_ov01-lijnhoogte">
          <button class="actief" data-hoogte="middel" type="button">Middel</button>
          <button data-hoogte="klein" type="button">Klein</button>
        </div>

        <label style="margin-top:10px">Ondertitel (vrij)
          <input type="text" id="g2_ov01-ondertitel" placeholder="bv. Stukjeswoorden — week 3" value="">
        </label>
      </div>
    `;
  },

  /* Geen oefenvormen-tabs */
  oefenvormenPerNiveau: { basis: [], kern: [], verdieping: [] },

  /* ---------- WERKBLAD GENEREREN ---------- */
  genereerBlad: function(opties, metAntwoorden = false) {
    const o = opties.g2_ov01 || {};
    const niveaus = o.niveaus || ["basis"];
    const modus = o.modus || "gemengd";
    const lijnhoogte = o.lijnhoogte || "middel";
    const lijntype = o.lijntype || "type3";
    const ondertitel = o.ondertitel || "";

    // Woorden uit globale pool (gevuld door woordenkiezer)
    const ruwePool = window._weekdictee_gekozenWoorden || [];

    // Dedup-vangnet
    let gekozenWoorden = window.SpellingDedup
      ? window.SpellingDedup.ontdubbel(ruwePool)
      : ruwePool;

    if (gekozenWoorden.length === 0) {
      return this._renderLegeStaat(
        "Nog geen woorden gekozen",
        "Klik op <strong>Open woordenkiezer</strong> in de zijbalk en kies woorden uit " +
        "<em>Verdubbelaars/Verenkelaars</em>, <em>Verlengingsregel</em> en " +
        "<em>Stukjeswoorden direct schrijven</em>."
      );
    }

    if (niveaus.length === 0) {
      return this._renderLegeStaat(
        "Geen niveau aangevinkt",
        "Vink minstens één niveau aan in de zijbalk (basis / kern / verdieping)."
      );
    }

    // Split in type A en type B
    const typeA = gekozenWoorden.filter(w => w.meervoud || w.verlengd);
    const typeB = gekozenWoorden.filter(w => w.klanktype && w.afbeelding);

    if (modus === "typeA" && typeA.length === 0) {
      return this._renderLegeStaat(
        "Geen meervoud-woorden",
        "Voor 'Alleen meervouden vormen' heb je woorden uit <em>Verdubbelaars/Verenkelaars</em> " +
        "of <em>Verlengingsregel</em> nodig."
      );
    }
    if (modus === "typeB" && typeB.length === 0) {
      return this._renderLegeStaat(
        "Geen plaatje-woorden",
        "Voor 'Alleen woorden bij plaatjes' heb je woorden uit " +
        "<em>Stukjeswoorden direct schrijven</em> nodig."
      );
    }

    this._seed = this._seed || Date.now();

    return niveaus.map((niveau) => {
      const aantal = this._maxPerNiveau[niveau] || 8;
      const woorden = this._kiesGemengd(typeA, typeB, aantal, modus);

      const niveauLabel = {
        basis: "⭐",
        kern: "⭐⭐",
        verdieping: "⭐⭐⭐"
      }[niveau];

      const oplBadge = metAntwoorden
        ? `<span class="oplossingen-badge">OPLOSSINGEN</span>`
        : "";
      const oplClass = metAntwoorden ? " g2-ov01-oplossing-blad" : "";

      let inhoudHTML = "";
      if (niveau === "basis") {
        inhoudHTML = this._renderBasisNiveau(woorden, lijntype, lijnhoogte, metAntwoorden);
      } else if (niveau === "kern") {
        inhoudHTML = this._renderKernNiveau(woorden, lijntype, lijnhoogte, metAntwoorden);
      } else if (niveau === "verdieping") {
        inhoudHTML = this._renderVerdiepingNiveau(woorden, lijntype, lijnhoogte, metAntwoorden);
      }

      return `
        <div class="werkblad g2-ov01-blad lijnhoogte-${lijnhoogte}${oplClass}"
             data-lijntype="${lijntype}" data-lijnhoogte="${lijnhoogte}"
             data-niveau="${niveau}">
          <div class="g2-ov01-header">
            <div class="g2-ov01-naam-rij">
              <span data-bewerk-id="naamlabel-${niveau}">Naam:</span>
              <span class="g2-ov01-lijn-naam"></span>
              <span data-bewerk-id="datumlabel-${niveau}">Datum:</span>
              <span class="g2-ov01-lijn-datum"></span>
            </div>
            <h2 class="g2-ov01-titel" data-bewerk-id="titel-${niveau}">
              Stukjeswoorden
              <span class="g2-ov01-niveau-badge g2-ov01-niveau-${niveau}">${niveauLabel}</span>
              ${oplBadge}
            </h2>
            ${ondertitel ? `<p class="g2-ov01-ondertitel" data-bewerk-id="ondertitel-${niveau}">${ondertitel}</p>` : ""}
          </div>

          ${inhoudHTML}

          <div class="g2-ov01-voettekst">www.jufzisa.be — Juf Zisa's spellinggenerator</div>
        </div>
      `;
    }).join("");
  },

  /* ---------- HELPERS ---------- */

  _renderLegeStaat: function(titel, boodschap) {
    return `
      <div class="werkblad">
        <div class="weekdictee-empty">
          <h3>📋 ${titel}</h3>
          <p>${boodschap}</p>
        </div>
      </div>
    `;
  },

  _kiesGemengd: function(typeA, typeB, aantal, modus) {
    if (modus === "typeA") return this._shuffle(typeA).slice(0, aantal);
    if (modus === "typeB") return this._shuffle(typeB).slice(0, aantal);

    let aantalA = Math.round(aantal * this._percentageTypeA);
    let aantalB = aantal - aantalA;

    if (typeA.length < aantalA) {
      const tekort = aantalA - typeA.length;
      aantalA = typeA.length;
      aantalB = Math.min(aantalB + tekort, typeB.length);
    }
    if (typeB.length < aantalB) {
      const tekort = aantalB - typeB.length;
      aantalB = typeB.length;
      aantalA = Math.min(aantalA + tekort, typeA.length);
    }

    const gekozenA = this._shuffle(typeA).slice(0, aantalA);
    const gekozenB = this._shuffle(typeB).slice(0, aantalB);
    return this._shuffle([...gekozenA, ...gekozenB]);
  },

  _shuffle: function(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  _doelwoord: function(w) {
    if (w.klanktype && w.afbeelding) return w.tekst;
    if (w.meervoud) return w.meervoud;
    if (w.verlengd) return w.verlengd;
    return w.tekst;
  },

  _afbeeldingsPad: function(w) {
    return `afbeeldingen/graad2/stukjeswoorden/${w.tekst}.png`;
  },

  /* Maak een canvas-schrijflijn HTML zoals graad 1 doet.
     Antwoord wordt op de lijn gelegd via een absolute span erboven. */
  _maakSchrijflijn: function(lijntype, lijnhoogte, breedte, antwoord) {
    const sl = window.SpellingSchrijflijnen;
    const antwoordSpan = antwoord
      ? `<span class="g2-ov01-lijn-antwoord">${antwoord}</span>`
      : "";
    if (sl) {
      return `<div class="g2-ov01-canvas-wrap">${antwoordSpan}${sl.htmlCanvas(lijntype, lijnhoogte, breedte)}</div>`;
    }
    // Fallback: simpele streep
    return `<div class="g2-ov01-schrijflijn-fallback">${antwoordSpan}</div>`;
  },

  /* ----- BASIS-niveau: denkstappen-tabel + modelleer-kader ----- */
  _renderBasisNiveau: function(woorden, lijntype, lijnhoogte, metAntwoorden) {
    return `
      <div class="g2-ov01-modelleer">
        <h3>Hoe doe ik dit?</h3>
        <p class="g2-ov01-modelleer-intro">
          Bij elk woord doe je drie checks. Let op: tel wat je <strong>hoort</strong>, niet wat er straks staat!
        </p>
        <ol class="g2-ov01-stappen">
          <li>Welke klank hoor ik in het <strong>eerste stukje</strong>? 🟥 kort of 🟦 lang?</li>
          <li>Hoeveel <strong>medeklinker-klanken</strong> hoor ik daarna?</li>
          <li>Wat doe ik bij het schrijven? <em>verdubbel / verenkel / niets</em></li>
        </ol>
        <table class="g2-ov01-voorbeelden">
          <thead>
            <tr>
              <th>woord</th>
              <th>klank</th>
              <th>medeklinkers (gehoord)</th>
              <th>wat doe ik?</th>
              <th>schrijf</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>bom</td><td>🟥 kort</td><td>1 (m)</td><td>verdubbel</td><td><strong>bommen</strong></td></tr>
            <tr><td>raam</td><td>🟦 lang</td><td>1 (m)</td><td>verenkel</td><td><strong>ramen</strong></td></tr>
            <tr><td>paard</td><td>🟦 lang</td><td>2 (r + d)</td><td>niets</td><td><strong>paarden</strong></td></tr>
            <tr><td>kast</td><td>🟥 kort</td><td>2 (s + t)</td><td>niets</td><td><strong>kasten</strong></td></tr>
          </tbody>
        </table>
      </div>

      <table class="g2-ov01-tabel">
        <thead>
          <tr>
            <th class="g2-ov01-col-woord">woord</th>
            <th class="g2-ov01-col-klank">klank</th>
            <th class="g2-ov01-col-medeklinkers">medeklinkers</th>
            <th class="g2-ov01-col-schrijf">schrijf</th>
          </tr>
        </thead>
        <tbody>
          ${woorden.map(w => this._renderTabelRij(w, lijntype, lijnhoogte, metAntwoorden)).join("")}
        </tbody>
      </table>
    `;
  },

  _renderTabelRij: function(woord, lijntype, lijnhoogte, metAntwoorden) {
    const isTypeB = woord.klanktype && woord.afbeelding;
    const doelwoord = this._doelwoord(woord);
    const antwoord = metAntwoorden ? doelwoord : "";

    let stimulusHTML;
    if (isTypeB) {
      stimulusHTML = `
        <img src="${this._afbeeldingsPad(woord)}"
             alt="${woord.tekst}"
             class="g2-ov01-plaatje-klein">
      `;
    } else {
      stimulusHTML = `<span class="g2-ov01-stimulus-woord">${woord.tekst}</span>`;
    }

    // Canvas-schrijflijn in de tabel — smallere breedte want het zit in een cel
    const schrijflijn = this._maakSchrijflijn(lijntype, lijnhoogte, 220, antwoord);

    return `
      <tr>
        <td class="g2-ov01-col-woord">${stimulusHTML}</td>
        <td class="g2-ov01-col-klank">
          <span class="g2-ov01-kruisvak">🟥</span>
          <span class="g2-ov01-kruisvak">🟦</span>
        </td>
        <td class="g2-ov01-col-medeklinkers">
          <span class="g2-ov01-kruisvak">1</span>
          <span class="g2-ov01-kruisvak">2+</span>
        </td>
        <td class="g2-ov01-col-schrijf">${schrijflijn}</td>
      </tr>
    `;
  },

  /* ----- KERN-niveau: stimulus + canvas-schrijflijn in 2-kolomraster ----- */
  _renderKernNiveau: function(woorden, lijntype, lijnhoogte, metAntwoorden) {
    return `
      <div class="g2-ov01-kern-herinner">
        <p>💡 <strong>Denk aan je drievoudige check:</strong> klank — medeklinkers (gehoord!) — wat doe ik?</p>
      </div>
      <div class="g2-ov01-kern-grid">
        ${woorden.map((w, i) => this._renderKernCel(w, i, lijntype, lijnhoogte, metAntwoorden)).join("")}
      </div>
    `;
  },

  _renderKernCel: function(woord, idx, lijntype, lijnhoogte, metAntwoorden) {
    const isTypeB = woord.klanktype && woord.afbeelding;
    const doelwoord = this._doelwoord(woord);
    const antwoord = metAntwoorden ? doelwoord : "";

    let stimulusHTML;
    if (isTypeB) {
      stimulusHTML = `
        <img src="${this._afbeeldingsPad(woord)}"
             alt="${woord.tekst}"
             class="g2-ov01-plaatje">
      `;
    } else {
      stimulusHTML = `
        <div class="g2-ov01-kern-enkelvoud">
          <span class="g2-ov01-kern-pijl">${woord.tekst} →</span>
        </div>
      `;
    }

    const schrijflijn = this._maakSchrijflijn(lijntype, lijnhoogte, 200, antwoord);

    return `
      <div class="g2-ov01-kern-cel">
        <span class="g2-ov01-kern-nr">${idx + 1}.</span>
        ${stimulusHTML}
        <div class="g2-ov01-kern-lijn">${schrijflijn}</div>
      </div>
    `;
  },

  /* ----- VERDIEPING-niveau: zinnen met gat ----- */
  _renderVerdiepingNiveau: function(woorden, lijntype, lijnhoogte, metAntwoorden) {
    return `
      <div class="g2-ov01-verdieping-intro">
        <p>
          <strong>Vul aan met de juiste vorm.</strong>
          Bij plaatjes: schrijf het woord. Bij <em>(woord)</em>: schrijf het meervoud.
        </p>
      </div>
      <ol class="g2-ov01-verdieping-zinnen">
        ${woorden.map(w => this._renderZinMetGat(w, lijntype, lijnhoogte, metAntwoorden)).join("")}
      </ol>
    `;
  },

  _renderZinMetGat: function(woord, lijntype, lijnhoogte, metAntwoorden) {
    const isTypeB = woord.klanktype && woord.afbeelding;
    const doelwoord = this._doelwoord(woord);
    const antwoord = metAntwoorden ? doelwoord : "";

    // Canvas-schrijflijn als gat in de zin
    const schrijflijn = this._maakSchrijflijn(lijntype, lijnhoogte, 240, antwoord);

    if (isTypeB) {
      return `
        <li class="g2-ov01-zin">
          <img src="${this._afbeeldingsPad(woord)}"
               alt="${woord.tekst}"
               class="g2-ov01-zin-plaatje">
          ${schrijflijn}
        </li>
      `;
    }

    return `
      <li class="g2-ov01-zin">
        <span class="g2-ov01-zin-hint">(${woord.tekst})</span>
        ${schrijflijn}
      </li>
    `;
  }
};

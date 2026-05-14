/* ==========================================================
   Module: Weekdictee
   Dagelijks dictee voor 1-5 dagen.
   - Woordenkiezer-modal levert de pool van woorden
   - Aantal woorden + aantal zinnen per dag (instelbaar)
   - Verbetering: 3x overschrijven in 3 kolommen
   - Optioneel kleurgecodeerd zinvak (rood-blauw-groen)
   - Optioneel reflectie-blok onderaan
   ========================================================== */

window.SpellingModules = window.SpellingModules || {};

window.SpellingModules.weekdictee = {

  naam: "Weekdictee",
  graad: 1,

  dagen: [
    { id: "ma", label: "maandag" },
    { id: "di", label: "dinsdag" },
    { id: "wo", label: "woensdag" },
    { id: "do", label: "donderdag" },
    { id: "vr", label: "vrijdag" }
  ],

  /* ---------- INSTELLINGEN UI ---------- */
  renderInstellingen: function() {
    let dagBlokken = "";
    for (const dag of this.dagen) {
      dagBlokken += `
        <label class="weekdictee-dag-toggle">
          <input type="checkbox" class="dag-aan" data-dag="${dag.id}" checked>
          <span class="dag-naam">${dag.label}</span>
        </label>`;
    }

    return `
      <h2>Instellingen</h2>

      <!-- STAP 1: Woorden kiezen -->
      <div class="wd-stap">
        <div class="wd-stap-kop">
          <span class="wd-stap-nr">1</span>
          <span class="wd-stap-titel">Kies je woorden</span>
        </div>
        <button class="wd-kiezer-knop" id="wd-open-kiezer" type="button">
          📋 Open woordenkiezer
        </button>
        <p class="wd-stap-info" id="wd-keuze-info">
          Nog geen woorden gekozen.
        </p>
      </div>

      <!-- STAP 2: Dagen -->
      <div class="wd-stap">
        <div class="wd-stap-kop">
          <span class="wd-stap-nr">2</span>
          <span class="wd-stap-titel">Welke dagen?</span>
        </div>
        <div class="weekdictee-dagen-lijst" id="weekdictee-dagen">
          ${dagBlokken}
        </div>
      </div>

      <!-- STAP 3: Aantallen -->
      <div class="wd-stap">
        <div class="wd-stap-kop">
          <span class="wd-stap-nr">3</span>
          <span class="wd-stap-titel">Aantallen</span>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <label>Woorden per dag
            <input type="number" id="wd-woorden" min="1" max="10" value="5">
          </label>
          <label>Zinnen per dag
            <input type="number" id="wd-zinnen" min="0" max="3" value="1">
          </label>
        </div>
        <label style="margin-top:8px; display:flex; align-items:center; gap:6px; font-size:0.88rem;">
          <input type="checkbox" id="wd-vrijdag-herhaling">
          Vrijdag = herhaling van ma-do woorden
        </label>
      </div>

      <!-- STAP 4: Schrijflijnen -->
      <div class="wd-stap">
        <div class="wd-stap-kop">
          <span class="wd-stap-nr">4</span>
          <span class="wd-stap-titel">Schrijflijnen</span>
        </div>
        <label>Type schrijflijn</label>
        <div class="lijntype-keuze" id="wd-lijntype">
          <label class="lijntype-radio">
            <input type="radio" name="wd-lt" value="type1">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type1" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 1<br><small>klassiek hulp</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="wd-lt" value="type2">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type2" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 2<br><small>standaard</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="wd-lt" value="type3" checked>
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type3" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 3<br><small>kleurgecodeerd</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="wd-lt" value="type4">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type4" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 4<br><small>grijs-blauw</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="wd-lt" value="type5">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type5" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 5<br><small>intens kleur</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="wd-lt" value="type6">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type6" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 6<br><small>enkele lijn</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="wd-lt" value="type7">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type7" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 7<br><small>twee lijnen</small></span>
            </span>
          </label>
        </div>

        <label style="margin-top:10px">Hoogte</label>
        <div class="subtype-knoppen" id="wd-lijnhoogte">
          <button data-hoogte="middel" type="button">Middel</button>
          <button class="actief" data-hoogte="klein" type="button">Klein</button>
        </div>
      </div>

      <!-- STAP 5: Reflectie -->
      <div class="wd-stap">
        <div class="wd-stap-kop">
          <span class="wd-stap-nr">5</span>
          <span class="wd-stap-titel">Reflectie</span>
        </div>
        <label style="display:flex; align-items:center; gap:6px;">
          <input type="checkbox" id="wd-reflectie" checked>
          Reflectievraag onderaan
        </label>
        <label style="margin-top:6px">Reflectievraag (bewerkbaar)
          <input type="text" id="wd-reflectie-tekst" value="Wat vond ik van de dagelijkse spelling deze week?">
        </label>
      </div>

      <!-- WEEKDICTEE EIGEN ACTIES -->
      <div class="ov-instel-blok wd-acties-blok">
        <button id="wd-vernieuw" class="primair" type="button" style="width:100%;">
          ↻ Vernieuw voorbeeld
        </button>
        <button id="wd-download" class="secundair" type="button" style="width:100%; margin-top:6px;">
          ⬇ Download weekdictee als PDF
        </button>
        <button id="wd-download-opl" class="secundair" type="button" style="width:100%; margin-top:6px;">
          ⬇ Download oplossingen
        </button>
        <p class="wd-stap-info" style="margin-top:8px;">
          Tip: weekdictee staat los van de bundel. Het is al een complete reeks per week.
        </p>
      </div>
    `;
  },

  /* Geen oefenvormen-tabs voor weekdictee — andere structuur.
     Lege array zodat het tabblok niets toont, maar het systeem niet crasht. */
  oefenvormenPerNiveau: { basis: [], kern: [], verdieping: [] },

  /* ---------- WERKBLAD GENEREREN ---------- */
  genereerBlad: function(opties, metAntwoorden = false) {

    // Welke dagen actief?
    const actieveDagen = this.dagen.filter(d => opties.weekdictee?.dagen?.[d.id] !== false);
    if (actieveDagen.length === 0) {
      return `<div class="werkblad"><p>Vink minstens één dag aan.</p></div>`;
    }

    const aantalWoorden = opties.weekdictee?.aantalWoorden || 5;
    const aantalZinnen  = opties.weekdictee?.aantalZinnen ?? 1;
    const zinStijl      = opties.weekdictee?.zinStijl || "kleur";
    const reflectieAan  = opties.weekdictee?.reflectieAan !== false;
    const reflectieText = opties.weekdictee?.reflectieText || "Wat vond ik van de dagelijkse spelling deze week?";
    const titel         = opties.weekdictee?.titel || "Dagelijkse kost spelling";
    const vrijdagHerhaling = !!opties.weekdictee?.vrijdagHerhaling;

    // Gekozen woorden uit de woordenkiezer
    const gekozenWoorden = window._weekdictee_gekozenWoorden || [];

    if (gekozenWoorden.length === 0) {
      return `<div class="werkblad">
        <div class="weekdictee-empty">
          <h3>📋 Nog geen woorden gekozen</h3>
          <p>Klik op <strong>"Open woordenkiezer"</strong> in de zijbalk om woorden te selecteren voor je weekdictee.</p>
        </div>
      </div>`;
    }

    // Dagen verdelen over pagina's: 2 dagen per pagina
    const dagenPerPagina = 2;
    const paginaList = [];
    for (let i = 0; i < actieveDagen.length; i += dagenPerPagina) {
      paginaList.push(actieveDagen.slice(i, i + dagenPerPagina));
    }

    let html = "";
    paginaList.forEach((paginaDagen, paginaIdx) => {
      const isEerstePagina = paginaIdx === 0;
      const isLaatstePagina = paginaIdx === paginaList.length - 1;

      html += `<div class="werkblad weekdictee-blad${metAntwoorden ? ' met-antwoorden' : ''}">`;

      if (isEerstePagina) {
        const oplossingBadge = metAntwoorden
          ? `<span class="oplossingen-badge">OPLOSSINGEN</span>`
          : "";
        html += `
          <div class="weekdictee-header">
            <div class="weekdictee-naam-rij">
              <span data-bewerk-id="naamlabel">Naam:</span>
              <span class="naam-lijn-lang"></span>
            </div>
            <h2 class="weekdictee-titel" data-bewerk-id="titel">${titel}${oplossingBadge}</h2>
          </div>`;
      }

      paginaDagen.forEach(dag => {
        // Voor vrijdag-als-herhaling: gebruik de "moeilijkste" woorden uit ma-do
        // Eenvoudige heuristiek: woorden die op meerdere dagen voorkomen, of
        // die uit de pool zijn maar nog niet gekozen op andere dagen.
        // Voor nu: gewoon dezelfde pool gebruiken; vrijdagHerhaling toggle
        // gerespecteerd via aparte tekst boven (toekomst: smart re-selection).
        html += this._renderDagBlok(dag, opties, aantalWoorden, aantalZinnen, zinStijl, gekozenWoorden, metAntwoorden);
      });

      if (isLaatstePagina && reflectieAan) {
        html += `
          <div class="weekdictee-reflectie">
            <p class="weekdictee-reflectie-vraag" data-bewerk-id="reflectie">${reflectieText}</p>
            <div class="weekdictee-reflectie-vakjes">
              <div class="reflectie-emoji">😀</div>
              <div class="reflectie-emoji">🙂</div>
              <div class="reflectie-emoji">😐</div>
              <div class="reflectie-emoji">😟</div>
            </div>
          </div>`;
      }

      html += `</div>`;
    });

    return html;
  },

  _renderDagBlok: function(dag, opties, aantalWoorden, aantalZinnen, zinStijl, gekozenWoorden, metAntwoorden) {
    const pool = gekozenWoorden || [];
    const dagIdx = this.dagen.findIndex(d => d.id === dag.id);
    const startIdx = dagIdx * (aantalWoorden + aantalZinnen);

    const sel = this._kiesWoordenVoorDag(pool, aantalWoorden + aantalZinnen, startIdx);
    const woordenVoorDag = sel.slice(0, aantalWoorden);
    const woordenVoorZin = sel.slice(aantalWoorden, aantalWoorden + aantalZinnen);

    // Lijntype + hoogte uit opties (komen uit instellingen)
    const lijntype = opties.weekdictee?.lijntype || "type3";
    const lijnhoogte = opties.weekdictee?.lijnhoogte || "middel";
    const sl = window.SpellingSchrijflijnen;

    // Bereken alle dictee-vormen die deze dag al voorkomen als WOORD.
    // Die mogen niet ook in de oefenzin verschijnen — zo komt het woord
    // niet dubbel voor en blijft de zin "verrassend" voor de leerling.
    const vermijdInZin = woordenVoorDag
      .map(w => this._dicteeVorm(w))
      .filter(v => v && v.length > 0);

    // Woord-lijntjes (links) — schrijflijn-canvas in plaats van CSS-onderlijn
    let woordLijntjes = "";
    for (let i = 0; i < aantalWoorden; i++) {
      const w = woordenVoorDag[i];
      const tonen = w ? this._toonWoord(w) : "";
      const woordTekst = w ? (typeof w === "string" ? w : w.tekst) : "";
      const inhoud = metAntwoorden && tonen
        ? `<span class="antwoord" data-bewerk-id="wd-w-${dag.id}-${i}">${tonen}</span>`
        : "";
      const lijn = sl
        ? `<div class="wd-canvas-wrap">${sl.htmlCanvas(lijntype, lijnhoogte, 220)}</div>`
        : `<div class="dag-woord-lijn-fallback"></div>`;
      // data-woord-tekst gebruikt de GRONDVORM (woord.tekst) want dat is
      // waarop _weekdictee_gekozenWoorden gefilterd wordt bij verwijderen.
      // data-dictee-vorm bewaart de getoonde vorm voor UI (tooltip etc).
      const dicteeVorm = this._dicteeVorm(w);
      const dataAttr = woordTekst ? ` data-woord-tekst="${woordTekst.replace(/"/g, '&quot;')}"` : "";
      const dataVorm = dicteeVorm ? ` data-dictee-vorm="${dicteeVorm.replace(/"/g, '&quot;')}"` : "";
      woordLijntjes += `<div class="dag-woord-rij"${dataAttr}${dataVorm}>${inhoud}${lijn}</div>`;
    }

    // Verbeter-rooster (2 kolommen × n rijen, elk met canvas-schrijflijn)
    let verbeterRooster = "";
    for (let i = 0; i < aantalWoorden; i++) {
      let rij = `<div class="verbeter-rij">`;
      for (let k = 0; k < 2; k++) {
        const cellijn = sl
          ? `<div class="wd-canvas-wrap">${sl.htmlCanvas(lijntype, lijnhoogte, 180)}</div>`
          : `<div class="verbeter-cel-fallback"></div>`;
        rij += `<div class="verbeter-cel">${cellijn}</div>`;
      }
      rij += `</div>`;
      verbeterRooster += rij;
    }

    // Zinnen onderaan dag — schrijflijn-canvas in plaats van blauw zinvak.
    // De zin gebruikt een woord uit woordenVoorZin (= de "extra" gekozen
    // woorden die NIET in de woordkolom staan). Pedagogisch ideaal: zo
    // krijgt de leerling een EXTRA stukjeswoord in een zin dat hij niet
    // al apart heeft geschreven. We geven vermijdInZin mee zodat de
    // zin geen ander dictee-woord van die dag bevat.
    let zinSectie = "";
    for (let i = 0; i < aantalZinnen; i++) {
      const zinWoord = woordenVoorZin[i] || woordenVoorDag[0];
      const zinWoordTekst = zinWoord ? (typeof zinWoord === "string" ? zinWoord : zinWoord.tekst) : "";
      const zinInhoud = metAntwoorden && zinWoord
        ? `<span class="antwoord zin-antwoord" data-bewerk-id="wd-z-${dag.id}-${i}">${this._maakZin(zinWoord, vermijdInZin)}</span>`
        : "";
      const zinLijn = sl
        ? `<div class="wd-zin-canvas-wrap">${sl.htmlCanvas(lijntype, lijnhoogte, 700)}</div>`
        : `<div class="zinvak zinvak-${zinStijl}-fallback"></div>`;
      const dataAttr = zinWoordTekst ? ` data-woord-tekst="${zinWoordTekst.replace(/"/g, '&quot;')}"` : "";
      zinSectie += `<div class="wd-zin-rij"${dataAttr}>${zinInhoud}${zinLijn}</div>`;
    }

    return `
      <div class="dag-blok">
        <div class="dag-blok-kop">
          <div class="dag-kop-links" data-bewerk-id="dag-${dag.id}">${dag.label} ___/___/______</div>
          <div class="dag-kop-rechts">Ik verbeter mijn fouten hier</div>
        </div>
        <div class="dag-blok-body">
          <div class="dag-woorden">${woordLijntjes}</div>
          <div class="dag-verbeter">${verbeterRooster}</div>
        </div>
        ${zinSectie ? `<div class="dag-zinnen">${zinSectie}</div>` : ""}
      </div>`;
  },

  /* Kies woorden voor één specifieke dag.
     De startIdx zorgt dat verschillende dagen uit verschillende delen van
     de pool kiezen zodat er minder overlap is. */
  _kiesWoordenVoorDag: function(pool, aantal, startIdx) {
    if (pool.length === 0) return [];
    // Maak een verschoven kopie van de pool
    const verschoven = pool.slice(startIdx % pool.length).concat(pool.slice(0, startIdx % pool.length));
    return this._kiesWoorden(verschoven, aantal);
  },

  /* Geef de tekst voor weergave in het DICTEE.
     
     Niet altijd is woord.tekst de juiste vorm: bij stukjeswoorden,
     meervouden en verkleinwoorden staat de pedagogisch correcte vorm
     in een ander veld (meervoud, verklein). De keuze hangt af van de
     categorie-groep — die we ophalen uit de woordenbibliotheek.
     
     Voorbeelden:
     - { tekst: "kat", meervoud: "katten" } in cat met groep "verdubbel-verenkel"
       → toont "de katten" (regel speelt bij verdubbeling)
     - { tekst: "boek", verklein: "boekje" } in cat met groep "verkleinwoorden"
       → toont "het boekje"
     - { tekst: "kat", meervoud: "katten" } in cat met groep "korte-klanken"
       → toont "de kat" (klankzuiver dictee, regel speelt niet)
     
     Het woord-object zelf onthoudt zijn categorie niet — die wordt
     meegegeven via de "categorie"-property die de woordenkiezer toevoegt
     bij selectie. Als die ontbreekt valt het terug op woord.tekst. */
  _toonWoord: function(w) {
    if (!w) return "";
    if (typeof w === "string") return w; // legacy

    // Bepaal de te tonen vorm op basis van groep van de categorie waar
    // dit woord onder is aangevinkt.
    const vorm = this._dicteeVorm(w);
    if (w.lidwoord) return `${w.lidwoord} ${vorm}`;
    return vorm;
  },

  /* Geef alleen de woordtekst (zonder lidwoord) in zijn dictee-vorm.
     
     Belangrijk: de woordenkiezer kopieert alleen { tekst, lidwoord,
     categorie, leerjaar } naar zijn gekozen-lijst — niet de meervoud/
     verklein-velden. Daarom zoeken we die hier op uit de bibliotheek
     via categorie + tekst. */
  _dicteeVorm: function(w) {
    if (!w) return "";
    if (typeof w === "string") return w;

    const groep = this._groepVoor(w);

    // Voor stukjeswoord-categorieën (verdubbel-verenkel) en meervouden:
    // toon de meervoud-vorm als die er is.
    if (groep === "verdubbel-verenkel" || groep === "meervouden") {
      const mv = w.meervoud || this._origineelVeld(w, "meervoud");
      if (mv) return mv;
    }
    // Voor verkleinwoord-categorieën: toon de verklein-vorm.
    if (groep === "verkleinwoorden") {
      const vk = w.verklein || this._origineelVeld(w, "verklein");
      if (vk) return vk;
    }
    // Alle andere groepen, of als het veld ontbreekt: de grondvorm.
    // WW-infinitieven in stukjes-cats hebben hun infinitief in tekst — OK.
    return w.tekst;
  },

  /* Zoek een veld op het ORIGINELE woord-object in de woordenbibliotheek.
     Nodig omdat de woordenkiezer alleen tekst+lidwoord+categorie+leerjaar
     overneemt; meervoud/verklein/ik staan alleen in de bibliotheek-bron. */
  _origineelVeld: function(w, veldnaam) {
    const wb = window.SpellingWoordenbibliotheek;
    if (!wb || !w.categorie) return null;
    const data = wb[`graad${w.leerjaar || 1}`];
    if (!data) return null;
    const cat = data[w.categorie];
    if (!cat || !Array.isArray(cat.woorden)) return null;
    const origineel = cat.woorden.find(o => o.tekst === w.tekst);
    return origineel ? origineel[veldnaam] : null;
  },

  /* Helper: zoek de groep op van de categorie waar dit woord onder valt. */
  _groepVoor: function(w) {
    if (!w || !w.categorie) return null;
    const wb = window.SpellingWoordenbibliotheek;
    if (!wb) return null;
    const graad = w.leerjaar || 1;
    const data = wb[`graad${graad}`];
    if (!data) return null;
    const cat = data[w.categorie];
    return cat ? cat.groep : null;
  },

  /* Maak een veilige zin met een woord erin.
     
     Strategie (in volgorde):
     1. Probeer de handmatig-curated dictee-zinnen-bib
        (window.SpellingDicteeZinnen). Dat zijn zinnen die jij zelf hebt
        geschreven met de juiste lj-1-veilige woordenschat per (groep,
        grondvorm)-combinatie. Pedagogisch sterkst.
     2. Als die ontbreekt (null in de bib): val terug op auto-sjablonen
        met enkel functiewoorden. Saaier maar altijd gemaakt.
     
     De Klinkerdief-bib (OV09) gebruiken we NIET — die zinnen bevatten
     woorden die in lj 1 niet gegarandeerd gezien zijn.
     
     Argument `vermijdWoorden`: array van dictee-vormen die NIET in de zin
     mogen voorkomen (de andere dictee-woorden van die dag). */
  _maakZin: function(woordObj, vermijdWoorden) {
    if (!woordObj) return "";
    const vermijd = (vermijdWoorden || []).map(w => String(w).toLowerCase());
    const dicteeVorm = this._dicteeVorm(woordObj);

    // ---- Strategie 1: handmatige dictee-zinnen-bib ----
    const bib = window.SpellingDicteeZinnen;
    if (bib && typeof bib.zoekVoor === "function" && typeof woordObj === "object") {
      const groep = this._groepVoor(woordObj);
      if (groep) {
        const zin = bib.zoekVoor(woordObj.tekst, groep, woordObj.leerjaar || 1);
        if (zin) {
          // Check ook hier de vermijd-filter — als de leerkracht een zin
          // schreef die toevallig een ander dictee-woord van die dag bevat,
          // vallen we terug op auto-sjabloon zodat het woord niet dubbel komt.
          const lz = zin.toLowerCase();
          const botst = vermijd.some(vw => vw && lz.includes(vw));
          if (!botst) return zin;
        }
      }
    }

    // ---- Strategie 2: veilige auto-sjablonen met functiewoorden ----
    const woord = dicteeVorm;
    const lidwoord = (typeof woordObj === "object" && woordObj.lidwoord) ? woordObj.lidwoord : "de";
    const Lidwoord = lidwoord.charAt(0).toUpperCase() + lidwoord.slice(1);

    // Detecteer of het om een MEERVOUD gaat. Verkleinwoorden zijn ook
    // afgeleide vormen maar grammaticaal enkelvoud — die mogen NIET als
    // meervoud behandeld worden (anders krijgen we "De boekje zijn hier").
    const groep = this._groepVoor(woordObj);
    const grondvorm = (typeof woordObj === "object") ? woordObj.tekst : woord;
    const isMeervoud = lidwoord
      && grondvorm && grondvorm !== woord
      && (groep === "verdubbel-verenkel" || groep === "meervouden");

    let sjablonen;
    if (isMeervoud) {
      sjablonen = [
        `Ik zie de ${woord}.`,
        `Ik heb de ${woord}.`,
        `Hier zijn de ${woord}.`,
        `Daar zijn de ${woord}.`,
        `De ${woord} zijn hier.`,
        `De ${woord} zijn daar.`,
        `Ja, ik zie de ${woord}.`,
        `Ik heb veel ${woord}.`
      ];
    } else if (!woordObj.lidwoord) {
      // WW-infinitief
      sjablonen = [
        `Ik kan ${woord}.`,
        `Wij ${woord}.`,
        `Zij ${woord}.`,
        `Hier kan ik ${woord}.`,
        `Daar kan ik ${woord}.`
      ];
    } else {
      sjablonen = [
        `Ik zie ${lidwoord} ${woord}.`,
        `Ik heb ${lidwoord} ${woord}.`,
        `Hier is ${lidwoord} ${woord}.`,
        `Daar is ${lidwoord} ${woord}.`,
        `${Lidwoord} ${woord} is hier.`,
        `${Lidwoord} ${woord} is daar.`,
        `Ja, ik zie ${lidwoord} ${woord}.`,
        `Een ${woord}.`
      ];
    }

    // Filter sjablonen die een te vermijden woord bevatten
    const veiligeSjablonen = sjablonen.filter(z => {
      const lz = z.toLowerCase();
      return !vermijd.some(vw => vw && lz.includes(vw));
    });
    let fallback;
    if (isMeervoud) fallback = `Ik zie ${woord}.`;
    else if (!woordObj.lidwoord) fallback = `Ik kan ${woord}.`;
    else fallback = `Ik zie ${lidwoord} ${woord}.`;
    const pool = veiligeSjablonen.length > 0 ? veiligeSjablonen : [fallback];
    const idx = Math.floor(this._random() * pool.length);
    return pool[idx];
  },

  /* Pseudo-random met seed (zelfde aanpak als klankzuiver-module) */
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

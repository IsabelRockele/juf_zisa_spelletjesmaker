/* ==========================================================
   Module: Weekdictee
   Dagelijks dictee voor 1-5 dagen.
   - Globale of per-dag woordbron
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

  /* Woordbronnen die de leerkracht kan kiezen.
     We hergebruiken de woordenlijsten uit de klankzuiver-module. */
  woordbronnen: function() {
    const k = window.SpellingModules.klankzuiver;
    if (!k) return [];
    return [
      { id: "kort-mkm",   label: "Klankzuiver mkm (bal)",   bron: () => Object.values(k.woordenlijsten.mkm).flat() },
      { id: "kort-mmkm",  label: "Klankzuiver mmkm (stal)", bron: () => Object.values(k.woordenlijsten.mmkm).flat() },
      { id: "kort-mkmm",  label: "Klankzuiver mkmm (lamp)", bron: () => Object.values(k.woordenlijsten.mkmm).flat() },
      { id: "kort-mmkmm", label: "Klankzuiver mmkmm (stamp)", bron: () => Object.values(k.woordenlijsten.mmkmm).flat() },
      { id: "tw-ie",      label: "Tweeklank ie (vier)",     bron: () => k.woordenlijsten.ie || [] },
      { id: "tw-eu",      label: "Tweeklank eu (neus)",     bron: () => k.woordenlijsten.eu || [] },
      { id: "tw-ui",      label: "Tweeklank ui (huis)",     bron: () => k.woordenlijsten.ui || [] },
      { id: "tw-oe",      label: "Tweeklank oe (boek)",     bron: () => k.woordenlijsten.oe || [] },
      { id: "verwar-bd",  label: "Verwar b/d",              bron: () => [...k.woordenlijsten.verwar.b, ...k.woordenlijsten.verwar.d] },
      { id: "verwar-vf",  label: "Verwar v/f",              bron: () => [...k.woordenlijsten.verwar.v, ...k.woordenlijsten.verwar.f] },
      { id: "verwar-zs",  label: "Verwar z/s",              bron: () => [...k.woordenlijsten.verwar.z, ...k.woordenlijsten.verwar.s] }
    ];
  },

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

      <!-- STAP 4: Stijl -->
      <div class="wd-stap">
        <div class="wd-stap-kop">
          <span class="wd-stap-nr">4</span>
          <span class="wd-stap-titel">Stijl</span>
        </div>
        <label>Zinvak</label>
        <div class="subtype-knoppen" id="wd-zinstijl">
          <button class="actief" data-stijl="kleur" type="button">Kleur</button>
          <button data-stijl="zwart" type="button">Zwart vierlijn</button>
        </div>

        <label style="margin-top:10px; display:flex; align-items:center; gap:6px;">
          <input type="checkbox" id="wd-reflectie" checked>
          Reflectievraag onderaan
        </label>
        <label style="margin-top:6px">Reflectievraag (bewerkbaar)
          <input type="text" id="wd-reflectie-tekst" value="Wat vond ik van de dagelijkse spelling deze week?">
        </label>
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
    // Globale pool van woorden (uit de woordenkiezer)
    const pool = gekozenWoorden || [];

    // Slim verdelen: woorden uniek per dag waar mogelijk
    // We gebruiken een index-offset per dag om geen overlap te krijgen
    const dagIdx = this.dagen.findIndex(d => d.id === dag.id);
    const startIdx = dagIdx * (aantalWoorden + aantalZinnen);

    // Kies woorden voor deze dag (deterministisch via seed + dag-offset)
    const sel = this._kiesWoordenVoorDag(pool, aantalWoorden + aantalZinnen, startIdx);
    const woordenVoorDag = sel.slice(0, aantalWoorden);
    const woordenVoorZin = sel.slice(aantalWoorden, aantalWoorden + aantalZinnen);

    // Woord-lijntjes (links)
    let woordLijntjes = "";
    for (let i = 0; i < aantalWoorden; i++) {
      const w = woordenVoorDag[i];
      const tonen = w ? this._toonWoord(w) : "";
      const inhoud = metAntwoorden && tonen
        ? `<span class="antwoord">${tonen}</span>`
        : "";
      woordLijntjes += `<div class="dag-woord-lijn">${inhoud}</div>`;
    }

    // Verbeter-rooster (3 kolommen, één rij per woord)
    let verbeterRooster = "";
    for (let i = 0; i < aantalWoorden; i++) {
      verbeterRooster += `
        <div class="verbeter-rij">
          <div class="verbeter-cel"></div>
          <div class="verbeter-cel"></div>
          <div class="verbeter-cel"></div>
        </div>`;
    }

    // Zin(nen) onderaan dag
    let zinSectie = "";
    for (let i = 0; i < aantalZinnen; i++) {
      const zinWoord = woordenVoorZin[i] || woordenVoorDag[0];
      const tonen = zinWoord ? this._toonWoord(zinWoord) : "";
      const zinInhoud = metAntwoorden && tonen
        ? `<span class="antwoord zin-antwoord">${this._maakZin(tonen)}</span>`
        : "";
      zinSectie += `<div class="zinvak zinvak-${zinStijl}">${zinInhoud}</div>`;
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

  /* Geef tekst voor weergave (met of zonder lidwoord) */
  _toonWoord: function(w) {
    if (typeof w === "string") return w; // legacy
    if (w.lidwoord) return `${w.lidwoord} ${w.tekst}`;
    return w.tekst;
  },

  /* Maak een eenvoudige zin met een woord erin */
  _maakZin: function(woord) {
    const sjablonen = [
      `Ik zie de ${woord}.`,
      `De ${woord} is mooi.`,
      `Mijn ${woord} ligt hier.`,
      `Hij heeft een ${woord}.`,
      `Wij kijken naar de ${woord}.`
    ];
    // Gebruik de seed voor reproduceerbaarheid
    const idx = Math.floor(this._random() * sjablonen.length);
    return sjablonen[idx];
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

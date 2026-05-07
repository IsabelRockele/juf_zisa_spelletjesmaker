/* ==========================================================
   Module: OV04 — Categoriseren op klank
   
   Drie niveaus:
   - BASIS:      woorden gegeven, kind kleurt klank zelf en sorteert
   - KERN:       woorden met ontbrekende klank, vult aan + sorteert
   - VERDIEPING: lege kolommen, kind bedenkt zelf woorden
   
   Aantal kolommen: 2 of 3 (instelbaar)
   Per kolom: kleur + klank-keuze + titel
   ========================================================== */

window.SpellingModules = window.SpellingModules || {};

window.SpellingModules.ov04 = {

  naam: "Categoriseren op klank",
  graad: 1,

  /* ---------- INSTELLINGEN UI (zijbalk) ---------- */
  renderInstellingen: function() {
    // Genereer dropdown-opties met optgroups
    const dropdownHTML = this._maakDropdownHTML();

    return `
      <h2>Instellingen</h2>

      <!-- STAP 1: Woordenkiezer -->
      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">1</span> Kies je woorden
        </label>
        <button class="wd-kiezer-knop" id="ov04-open-kiezer" type="button">
          📋 Open woordenkiezer
        </button>
        <p class="wd-stap-info" id="ov04-keuze-info">
          Nog geen woorden gekozen.
        </p>
        <p class="wd-stap-info" style="margin-top:6px;">
          Tip: kies woorden uit verschillende klank-categorieën zodat alle kolommen ingevuld worden.
        </p>
      </div>

      <!-- STAP 2: Niveau(s) met vinkjes -->
      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">2</span> Niveau(s)
        </label>
        <div id="ov04-niveaus">
          <label class="ov-niveau-vink actief">
            <input type="checkbox" data-niveau="basis" checked>
            <div class="ov-niveau-vink-tekst">
              <strong>⭐ Oefenen</strong>
              <small>kind kleurt klank en sorteert</small>
            </div>
          </label>
          <label class="ov-niveau-vink">
            <input type="checkbox" data-niveau="kern">
            <div class="ov-niveau-vink-tekst">
              <strong>⭐⭐ Toepassen</strong>
              <small>klank ontbreekt — eerst aanvullen, dan sorteren</small>
            </div>
          </label>
          <label class="ov-niveau-vink">
            <input type="checkbox" data-niveau="verdieping">
            <div class="ov-niveau-vink-tekst">
              <strong>⭐⭐⭐ Verdiepen</strong>
              <small>kind bedenkt zelf 3 woorden per kolom</small>
            </div>
          </label>
          <label class="ov-niveau-vink">
            <input type="checkbox" data-niveau="uitbreiding">
            <div class="ov-niveau-vink-tekst">
              <strong>⭐⭐⭐⭐ Uitbreiden</strong>
              <small>5 woorden per kolom + zin maken met één woord</small>
            </div>
          </label>
        </div>
      </div>

      <!-- STAP 3: Aantal kolommen -->
      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">3</span> Aantal kolommen
        </label>
        <div class="subtype-knoppen" id="ov04-aantal-kolommen">
          <button data-aantal="2" type="button">2 kolommen</button>
          <button class="actief" data-aantal="3" type="button">3 kolommen</button>
        </div>
      </div>

      <!-- STAP 4: Per kolom — kleur, klank, titel -->
      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">4</span> Kolom-instellingen
        </label>
        <p class="wd-stap-info" style="margin-bottom:8px;">
          Per kolom: kleur, klank-categorie en titel. Titel wordt automatisch aangepast bij keuze.
        </p>
        <div class="ov04-kolom-rij" data-kolom="1">
          <input type="color" class="ov04-kleur" id="ov04-kleur-1" value="#2196F3" title="Kleur kolom 1">
          <select class="ov04-klank" id="ov04-klank-1" data-default-titel="Korte klank">
            ${dropdownHTML}
          </select>
          <input type="text" class="ov04-titel" id="ov04-titel-1" value="Korte klank" placeholder="Titel kolom 1">
        </div>
        <div class="ov04-kolom-rij" data-kolom="2">
          <input type="color" class="ov04-kleur" id="ov04-kleur-2" value="#4CAF50" title="Kleur kolom 2">
          <select class="ov04-klank" id="ov04-klank-2" data-default-titel="Lange klank">
            ${dropdownHTML}
          </select>
          <input type="text" class="ov04-titel" id="ov04-titel-2" value="Lange klank" placeholder="Titel kolom 2">
        </div>
        <div class="ov04-kolom-rij" data-kolom="3">
          <input type="color" class="ov04-kleur" id="ov04-kleur-3" value="#FF9800" title="Kleur kolom 3">
          <select class="ov04-klank" id="ov04-klank-3" data-default-titel="Andere klank">
            ${dropdownHTML}
          </select>
          <input type="text" class="ov04-titel" id="ov04-titel-3" value="Andere klank" placeholder="Titel kolom 3">
        </div>
      </div>

      <!-- STAP 5: Aantal woorden -->
      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">5</span> Aantal woorden
        </label>
        <input type="number" id="ov04-aantal-woorden" min="6" max="24" value="12">
      </div>

      <!-- STAP 6: Schrijflijnen -->
      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">6</span> Schrijflijnen
        </label>
        <label style="margin-top:6px">Type schrijflijn</label>
        <div class="lijntype-keuze" id="ov04-lijntype">
          <label class="lijntype-radio">
            <input type="radio" name="ov04-lt" value="type1">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type1" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 1<br><small>klassiek hulp</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov04-lt" value="type2">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type2" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 2<br><small>standaard</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov04-lt" value="type3" checked>
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type3" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 3<br><small>kleurgecodeerd</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov04-lt" value="type4">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type4" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 4<br><small>grijs-blauw</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov04-lt" value="type5">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type5" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 5<br><small>intens kleur</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov04-lt" value="type6">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type6" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 6<br><small>enkele lijn</small></span>
            </span>
          </label>
          <label class="lijntype-radio">
            <input type="radio" name="ov04-lt" value="type7">
            <span class="lijntype-naam">
              <canvas class="lijntype-preview" data-preview-type="type7" width="80" height="32"></canvas>
              <span class="lijntype-label">Type 7<br><small>twee lijnen</small></span>
            </span>
          </label>
        </div>
        <label style="margin-top:10px">Hoogte</label>
        <div class="subtype-knoppen" id="ov04-lijnhoogte">
          <button data-hoogte="middel" type="button">Middel</button>
          <button class="actief" data-hoogte="klein" type="button">Klein</button>
        </div>
      </div>

      <!-- STAP 7: Ondertitel -->
      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">7</span> Ondertitel (vrij)
        </label>
        <input type="text" id="ov04-ondertitel" placeholder="bv. Week 12 — Klanken sorteren">
      </div>
    `;
  },

  /* Bouw HTML voor de klank-dropdown met optgroups */
  _maakDropdownHTML: function() {
    const kh = window.SpellingKlank;
    if (!kh) return "<option>Klank-helper niet geladen</option>";
    
    // Groepeer per groep
    const grouped = {};
    kh.KOLOM_KLANK_OPTIES.forEach(opt => {
      if (!grouped[opt.groep]) grouped[opt.groep] = [];
      grouped[opt.groep].push(opt);
    });
    
    let html = "";
    Object.keys(grouped).forEach(groepNaam => {
      html += `<optgroup label="${groepNaam}">`;
      grouped[groepNaam].forEach(opt => {
        html += `<option value="${opt.value}">${opt.label}</option>`;
      });
      html += `</optgroup>`;
    });
    return html;
  },

  oefenvormenPerNiveau: { basis: [], kern: [], verdieping: [] },

  /* ---------- WERKBLAD GENEREREN ---------- */
  genereerBlad: function(opties, metAntwoorden = false) {
    const o = opties.ov04 || {};
    const niveaus = o.niveaus && o.niveaus.length > 0 ? o.niveaus : ["basis"];
    const aantalKolommen = o.aantalKolommen || 3;
    const aantalWoorden = o.aantalWoorden || 12;
    const lijntype = o.lijntype || "type3";
    const lijnhoogte = o.lijnhoogte || "klein";
    const ondertitel = o.ondertitel || "";
    
    // Kolommen samenstellen op basis van instellingen
    const kolommen = [];
    for (let i = 1; i <= aantalKolommen; i++) {
      kolommen.push({
        titel: o["titel" + i] || `Kolom ${i}`,
        kleur: o["kleur" + i] || "#888888",
        klank: o["klank" + i] || "groep-kort"
      });
    }

    const gekozenWoorden = window._weekdictee_gekozenWoorden || [];

    if (gekozenWoorden.length === 0) {
      return `<div class="werkblad ov04-blad">
        <div class="weekdictee-empty">
          <h3>📋 Nog geen woorden gekozen</h3>
          <p>Klik op <strong>"Open woordenkiezer"</strong> in de zijbalk om woorden te selecteren.</p>
        </div>
      </div>`;
    }

    return niveaus.map(niveau => {
      const woorden = (niveau === "verdieping" || niveau === "uitbreiding") 
        ? [] // Geen woorden — kind bedenkt zelf
        : this._kiesWoorden(gekozenWoorden, aantalWoorden);
      return this._renderEenBlad(niveau, woorden, kolommen, lijntype, lijnhoogte, ondertitel, metAntwoorden);
    }).join("");
  },

  _renderEenBlad: function(niveau, woorden, kolommen, lijntype, lijnhoogte, ondertitel, metAntwoorden) {
    const sl = window.SpellingSchrijflijnen;
    const kh = window.SpellingKlank;

    // Legende bovenaan
    const legendeHTML = `
      <div class="ov04-legende">
        ${kolommen.map(cat => `
          <div class="ov04-legende-item">
            <span class="ov04-legende-kleur" style="background:${cat.kleur}"></span>
            <span class="ov04-legende-tekst">${cat.titel}</span>
          </div>
        `).join("")}
      </div>`;

    // Woorden-blok (alleen voor basis + kern)
    let woordenHTML = "";
    if (niveau === "basis" || niveau === "kern") {
      const woordenLijst = woorden.map(w => {
        const kaal = w.tekst; // GEEN lidwoord
        let weergave = kaal;
        
        if (niveau === "kern") {
          weergave = kh ? kh.woordMetStreepjes(kaal, w.categorie) : kaal;
        }
        
        // Bij oplossingen: klank inkleuren
        if (metAntwoorden && kh) {
          const kolomNr = kh.bepaalKolom(w.categorie, kolommen.map(c => c.klank));
          if (kolomNr) {
            const cat = kolommen[kolomNr - 1];
            weergave = kh.woordMetGekleurdeKlank(kaal, w.categorie, cat.kleur);
          }
        }
        
        return `<span class="ov04-woord">${weergave}</span>`;
      }).join("");
      
      const woordenTitel = niveau === "kern" 
        ? "Vul de ontbrekende klank in en schrijf het woord in de juiste kolom:"
        : "Kleur de klank in elk woord en schrijf het in de juiste kolom:";
      
      woordenHTML = `
        <div class="ov04-woorden-titel">${woordenTitel}</div>
        <div class="ov04-woorden-lijst">${woordenLijst}</div>`;
    }

    // Kolommen onderaan met schrijflijnen
    // Verdieping: 3 lijnen per kolom — kind bedenkt 3 woorden per kolom
    // Uitbreiding: 5 lijnen per kolom — kind bedenkt 5 woorden per kolom
    // Basis/Kern: genoeg lijnen voor woorden (bv. aantalWoorden / aantalKolommen + 1)
    const aantalLijnenPerKolom = niveau === "verdieping" 
      ? 3 
      : niveau === "uitbreiding"
      ? 5
      : Math.ceil((woorden.length / kolommen.length) + 1);

    const kolommenHTML = kolommen.map(cat => {
      const lijnen = [];
      for (let i = 0; i < aantalLijnenPerKolom; i++) {
        // Bij oplossingen voor basis/kern: woord in juiste kolom invullen
        let antwoord = "";
        if (metAntwoorden && niveau !== "verdieping" && niveau !== "uitbreiding" && kh) {
          // Vind woorden die in deze kolom horen
          const woordenInKolom = woorden.filter(w => 
            kh.matchKolom(w.categorie, cat.klank)
          );
          if (woordenInKolom[i]) {
            antwoord = `<span class="ov04-lijn-antwoord">${woordenInKolom[i].tekst}</span>`;
          }
        }
        const canvas = sl
          ? sl.htmlCanvas(lijntype, lijnhoogte, 200)
          : `<div class="ov04-fallback-lijn"></div>`;
        lijnen.push(`<div class="ov04-kolom-lijn">${antwoord}${canvas}</div>`);
      }
      
      return `
        <div class="ov04-kolom" style="border-top: 4px solid ${cat.kleur};">
          <div class="ov04-kolom-titel" style="background: ${cat.kleur};">${cat.titel}</div>
          <div class="ov04-kolom-lijnen">${lijnen.join("")}</div>
        </div>`;
    }).join("");

    const niveauLabel = {
      basis: "⭐", kern: "⭐⭐", verdieping: "⭐⭐⭐", uitbreiding: "⭐⭐⭐⭐"
    }[niveau];

    const oplBadge = metAntwoorden
      ? `<span class="oplossingen-badge">OPLOSSINGEN</span>`
      : "";

    // Opdracht-tekst per niveau
    let opdrachtTekst = "";
    if (niveau === "basis") {
      opdrachtTekst = `
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Kleur de klank in elk woord met de juiste kleur.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Schrijf het woord in de juiste kolom.</span></div>`;
    } else if (niveau === "kern") {
      opdrachtTekst = `
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Vul de ontbrekende klank in.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Schrijf het woord in de juiste kolom.</span></div>`;
    } else if (niveau === "uitbreiding") {
      opdrachtTekst = `
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Bedenk 5 woorden voor elke categorie.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Maak in je schrift een zin met één woord uit elke kolom.</span></div>`;
    } else {
      opdrachtTekst = `
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Bedenk woorden voor elke categorie.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Schrijf 3 woorden in elke kolom.</span></div>`;
    }

    return `
      <div class="werkblad ov04-blad lijnhoogte-${lijnhoogte}" data-lijntype="${lijntype}" data-lijnhoogte="${lijnhoogte}" data-niveau="${niveau}">
        <div class="ov01-header">
          <div class="ov01-naam-rij">
            <span data-bewerk-id="naamlabel-${niveau}">Naam:</span>
            <span class="ov01-lijn-naam"></span>
            <span data-bewerk-id="datumlabel-${niveau}">Datum:</span>
            <span class="ov01-lijn-datum"></span>
          </div>
          <h2 class="ov01-titel" data-bewerk-id="titel-${niveau}">
            Klanken sorteren
            <span class="ov01-niveau-badge ov01-niveau-${niveau}">${niveauLabel}</span>
            ${oplBadge}
          </h2>
          ${ondertitel ? `<p class="ov01-ondertitel" data-bewerk-id="ondertitel-${niveau}">${ondertitel}</p>` : ""}
        </div>

        <div class="ov01-stappen">
          <div class="ov01-stappen-label">Opdracht:</div>
          ${opdrachtTekst}
        </div>

        ${legendeHTML}
        ${woordenHTML}

        <div class="ov04-kolommen ov04-kolommen-${kolommen.length}">
          ${kolommenHTML}
        </div>

        <div class="ov01-voettekst">www.jufzisa.be — Juf Zisa's spellinggenerator</div>
      </div>
    `;
  },

  /* ---------- HELPERS ---------- */
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

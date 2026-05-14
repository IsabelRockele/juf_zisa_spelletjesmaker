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

  /* Maximum aantal woorden per paar per niveau dat comfortabel op 1 A4 past.
     - basis/kern: 12 woorden voor sorteren
     - verdieping: 9 woorden voor sorteren + 6 lijntjes per kolom voor eigen woorden
     - uitbreiding: lege kolommen + 3 zin-schrijflijnen onderaan */
  _maxPerNiveau: {
    basis: 12,
    kern: 12,
    verdieping: 9,
    uitbreiding: 0
  },

  /* =====================================================
     KLANK-PAAR DETECTIE
     
     Bekijkt welke categorieën aangevinkt zijn en bepaalt welke
     sorteer-werkbladen mogelijk zijn. Elk gevonden paar krijgt
     één werkblad per niveau.
     
     Een "paar" is altijd minimum 2 kolommen die elk minstens 1
     woord uit de aangevinkte selectie kunnen leveren. Anders is
     sorteren niet zinvol.
     
     Per paar bewaren we:
     - id          : unieke string (voor seed-variatie)
     - titel       : werkblad-titel
     - kolommen    : [{titel, kleur, classifier}]
                     classifier(woord) → kolomnaam | null
     ===================================================== */
  /* ============================================================
     KLEUR-VOORKEUREN voor het korte-lange-andere paar.
     De leerkracht kan in de zijbalk eigen kleuren kiezen voor:
       - korte klanken (default blauw)
       - lange klanken (default groen)
       - andere klanken (default oranje)
     Opgeslagen in localStorage. Bij elke render leest OV4 deze
     waardes voor het korte-lange paar. ============================*/
  _DEFAULT_KLEUREN: {
    kort: "#2196F3",
    lang: "#4CAF50",
    ander: "#FF9800"
  },
  _LS_KLEUREN: "spelling-ov04-kleuren-v1",
  
  _leesKleuren: function() {
    try {
      const storage = window.SpellingModusStorage || localStorage;
      const raw = storage.getItem(this._LS_KLEUREN);
      if (!raw) return { ...this._DEFAULT_KLEUREN };
      const obj = JSON.parse(raw);
      return {
        kort: obj.kort || this._DEFAULT_KLEUREN.kort,
        lang: obj.lang || this._DEFAULT_KLEUREN.lang,
        ander: obj.ander || this._DEFAULT_KLEUREN.ander
      };
    } catch (e) {
      return { ...this._DEFAULT_KLEUREN };
    }
  },
  
  /* PUBLIEK: bewaar nieuwe kleuren en trigger preview-vernieuwing */
  setKleuren: function(kleuren) {
    try {
      const huidig = this._leesKleuren();
      const nieuw = { ...huidig, ...kleuren };
      const storage = window.SpellingModusStorage || localStorage;
      storage.setItem(this._LS_KLEUREN, JSON.stringify(nieuw));
      // Trigger preview-vernieuwing als die er is
      if (window.SpellingPreview && typeof window.SpellingPreview.ververs === "function") {
        window.SpellingPreview.ververs();
      }
      // Ook herhalingsbundel-preview verversen
      if (window.SpellingHerhalingsbundel?.renderPreview) {
        window.SpellingHerhalingsbundel.renderPreview();
      }
    } catch (e) { /* localStorage niet beschikbaar */ }
  },

  KLANK_PAREN: [
    {
      id: "korte-lange",
      titel: "Korte vs lange klanken",
      // Eenvoudigste paar: bij ⭐ basis worden de woorden VOLUIT getoond
      // (kind kleurt en sorteert). Symbool-hint pas vanaf ⭐⭐ kern.
      basisVoluit: true,
      // Trigger: zowel korte- als lange-klanken aangevinkt
      trigger: function(aangevinkteCats, cats) {
        const mod = window.SpellingModules.ov04;
        const kleuren = mod ? mod._leesKleuren() : mod._DEFAULT_KLEUREN;
        
        const heeftKort = aangevinkteCats.some(id => cats[id]?.groep === "korte-klanken");
        const heeftLang = aangevinkteCats.some(id => cats[id]?.groep === "lange-klanken");
        if (!(heeftKort && heeftLang)) return null;
        const heeftTwee = aangevinkteCats.some(id => 
          cats[id]?.groep === "tweeklanken" 
          || cats[id]?.groep === "ei-ij"
          || cats[id]?.groep === "au-ou"
        );
        const kolommen = [
          { 
            titel: "Korte klank", kleur: kleuren.kort, symbool: "●",
            filter: w => cats[w.categorie]?.groep === "korte-klanken",
            klankRegex: /[aeiouy]+/i
          },
          { 
            titel: "Lange klank", kleur: kleuren.lang, symbool: "▬",
            filter: w => cats[w.categorie]?.groep === "lange-klanken",
            klankRegex: /aa|ee|oo|uu|ie/i
          }
        ];
        if (heeftTwee) {
          kolommen.push({
            titel: "Andere klank", kleur: kleuren.ander, symbool: "★",
            filter: w => ["tweeklanken", "ei-ij", "au-ou"].includes(cats[w.categorie]?.groep),
            klankRegex: /aai|ooi|oei|eeuw|ieuw|ei|ij|au|ou|eu|ui|oe|ie/i
          });
        }
        return { kolommen };
      }
    },
    {
      id: "ei-ij",
      titel: "ei vs ij",
      trigger: (aangevinkteCats, cats) => {
        const heeftEi = aangevinkteCats.includes("tw-ei");
        const heeftIj = aangevinkteCats.includes("tw-ij");
        if (!(heeftEi && heeftIj)) return null;
        return {
          kolommen: [
            { titel: "ei", kleur: "#E53935", symbool: "▲", filter: w => w.categorie === "tw-ei", klankRegex: /ei/i },
            { titel: "ij", kleur: "#1E88E5", symbool: "◆", filter: w => w.categorie === "tw-ij", klankRegex: /ij/i }
          ]
        };
      }
    },
    {
      id: "au-ou",
      titel: "au vs ou",
      trigger: (aangevinkteCats, cats) => {
        const heeftAu = aangevinkteCats.includes("tw-au");
        const heeftOu = aangevinkteCats.includes("tw-ou");
        if (!(heeftAu && heeftOu)) return null;
        return {
          kolommen: [
            { titel: "au", kleur: "#FB8C00", symbool: "▲", filter: w => w.categorie === "tw-au", klankRegex: /au/i },
            { titel: "ou", kleur: "#8E24AA", symbool: "◆", filter: w => w.categorie === "tw-ou", klankRegex: /ou/i }
          ]
        };
      }
    },
    {
      id: "aai-ooi-oei",
      titel: "aai / ooi / oei",
      trigger: (aangevinkteCats, cats) => {
        const kolommen = [];
        if (aangevinkteCats.includes("tw-aai")) {
          kolommen.push({ titel: "aai", kleur: "#E53935", symbool: "▲", filter: w => w.categorie === "tw-aai", klankRegex: /aai/i });
        }
        if (aangevinkteCats.includes("tw-ooi")) {
          kolommen.push({ titel: "ooi", kleur: "#4CAF50", symbool: "◆", filter: w => w.categorie === "tw-ooi", klankRegex: /ooi/i });
        }
        if (aangevinkteCats.includes("tw-oei")) {
          kolommen.push({ titel: "oei", kleur: "#1E88E5", symbool: "●", filter: w => w.categorie === "tw-oei", klankRegex: /oei/i });
        }
        if (kolommen.length < 2) return null;
        return { kolommen };
      }
    },
    {
      id: "eeuw-ieuw",
      titel: "eeuw / ieuw",
      trigger: (aangevinkteCats, cats) => {
        const heeftEeuw = aangevinkteCats.includes("tw-eeuw");
        const heeftIeuw = aangevinkteCats.includes("tw-ieuw");
        if (!(heeftEeuw && heeftIeuw)) return null;
        return {
          kolommen: [
            { titel: "eeuw", kleur: "#E53935", symbool: "▲", filter: w => w.categorie === "tw-eeuw", klankRegex: /eeuw/i },
            { titel: "ieuw", kleur: "#1E88E5", symbool: "◆", filter: w => w.categorie === "tw-ieuw", klankRegex: /ieuw/i }
          ]
        };
      }
    },
    {
      id: "ng-nk",
      titel: "ng vs nk",
      trigger: (aangevinkteCats, cats) => {
        if (!(aangevinkteCats.includes("ng-woorden") && aangevinkteCats.includes("nk-woorden"))) return null;
        return {
          kolommen: [
            { titel: "ng", kleur: "#9C27B0", symbool: "▲", filter: w => w.categorie === "ng-woorden", klankRegex: /ng/i },
            { titel: "nk", kleur: "#00897B", symbool: "◆", filter: w => w.categorie === "nk-woorden", klankRegex: /nk/i }
          ]
        };
      }
    },
    {
      id: "cht-gt",
      titel: "cht vs gt",
      trigger: (aangevinkteCats, cats) => {
        const heeftCht = aangevinkteCats.includes("cht-woorden");
        const heeftGt = aangevinkteCats.includes("gt-woorden");
        if (!(heeftCht && heeftGt)) return null;
        return {
          kolommen: [
            { titel: "cht", kleur: "#E53935", symbool: "▲", filter: w => w.categorie === "cht-woorden", klankRegex: /cht/i },
            { titel: "gt", kleur: "#43A047", symbool: "◆", filter: w => w.categorie === "gt-woorden", klankRegex: /gt/i }
          ]
        };
      }
    },
    {
      id: "ch-cht",
      titel: "ch vs cht",
      trigger: (aangevinkteCats, cats) => {
        const heeftCh = aangevinkteCats.includes("ch-woorden");
        const heeftCht = aangevinkteCats.includes("cht-woorden");
        if (!(heeftCh && heeftCht)) return null;
        return {
          kolommen: [
            { titel: "ch", kleur: "#9C27B0", symbool: "▲", filter: w => w.categorie === "ch-woorden", klankRegex: /ch(?!t)/i },
            { titel: "cht", kleur: "#E53935", symbool: "◆", filter: w => w.categorie === "cht-woorden", klankRegex: /cht/i }
          ]
        };
      }
    },
    {
      id: "verlengen-dt",
      titel: "Eindigt op -d of -t (verlengingsregel)",
      trigger: (aangevinkteCats, cats) => {
        if (!aangevinkteCats.includes("verlengingsregel")) return null;
        const eindigtOpD = w => w.categorie === "verlengingsregel" && w.tekst.replace(/[^a-z]/gi, '').toLowerCase().endsWith("d");
        const eindigtOpT = w => w.categorie === "verlengingsregel" && w.tekst.replace(/[^a-z]/gi, '').toLowerCase().endsWith("t");
        return {
          kolommen: [
            { titel: "eindigt op -d", kleur: "#E53935", symbool: "▲", filter: eindigtOpD, klankRegex: /d$/i },
            { titel: "eindigt op -t", kleur: "#43A047", symbool: "◆", filter: eindigtOpT, klankRegex: /t$/i }
          ],
          minimumPerKolom: true
        };
      }
    },
    {
      id: "verlengen-bp",
      titel: "Eindigt op -b of -p (verlengingsregel)",
      trigger: (aangevinkteCats, cats) => {
        if (!aangevinkteCats.includes("verlengingsregel")) return null;
        const eindigtOpB = w => w.categorie === "verlengingsregel" && w.tekst.replace(/[^a-z]/gi, '').toLowerCase().endsWith("b");
        const eindigtOpP = w => w.categorie === "verlengingsregel" && w.tekst.replace(/[^a-z]/gi, '').toLowerCase().endsWith("p");
        return {
          kolommen: [
            { titel: "eindigt op -b", kleur: "#1E88E5", symbool: "▲", filter: eindigtOpB, klankRegex: /b$/i },
            { titel: "eindigt op -p", kleur: "#FB8C00", symbool: "◆", filter: eindigtOpP, klankRegex: /p$/i }
          ],
          minimumPerKolom: true
        };
      }
    }
  ],

  /* Detecteert welke klank-paren mogelijk zijn op basis van de
     aangevinkte categorieën EN de daadwerkelijk gekozen woorden.
     Returns: [{id, titel, kolommen}, ...]
     
     Voor paren met `minimumPerKolom: true` checken we dat elke
     kolom minstens 1 woord heeft in de woordenpool — anders
     valt het paar weg (anders zou je een lege kolom krijgen). */
  _detecteerParen: function(gekozenWoorden, leerjaar) {
    const wb = window.SpellingWoordenbibliotheek;
    if (!wb) return [];
    const cats = wb["graad" + (leerjaar || 1)] || {};

    // Bepaal welke categorieën aangevinkt zijn (op basis van woorden in pool)
    const aangevinkteCats = [...new Set(gekozenWoorden.map(w => w.categorie).filter(Boolean))];

    const resultaat = [];
    for (const paar of this.KLANK_PAREN) {
      const detectie = paar.trigger(aangevinkteCats, cats);
      if (!detectie) continue;
      
      // Voor paren met minimumPerKolom-flag: check dat élke kolom
      // minstens 1 woord heeft in de daadwerkelijke pool.
      if (detectie.minimumPerKolom) {
        const allKolommenOK = detectie.kolommen.every(kol => 
          gekozenWoorden.some(w => kol.filter(w))
        );
        if (!allKolommenOK) continue;
      }
      
      resultaat.push({
        id: paar.id,
        titel: paar.titel,
        kolommen: detectie.kolommen,
        basisVoluit: !!paar.basisVoluit
      });
    }
    return resultaat;
  },

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

      <!-- STAP 3: Kleuren voor korte / lange / andere klanken -->
      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">3</span> Kleuren (korte / lange / andere klank)
        </label>
        <p class="wd-stap-info" style="margin-bottom:8px;">
          Pas de kleuren aan zodat ze overeenkomen met de kleuren in jouw taalmethode.
          Geldt voor alle werkbladen die korte/lange/andere klank gebruiken.
        </p>
        <div class="ov04-kleuren-rij">
          <label class="ov04-kleur-cel">
            <input type="color" class="ov04-kleur-input" id="ov04-kleur-kort" value="${this._leesKleuren().kort}">
            <span>● Korte klank</span>
          </label>
          <label class="ov04-kleur-cel">
            <input type="color" class="ov04-kleur-input" id="ov04-kleur-lang" value="${this._leesKleuren().lang}">
            <span>▬ Lange klank</span>
          </label>
          <label class="ov04-kleur-cel">
            <input type="color" class="ov04-kleur-input" id="ov04-kleur-ander" value="${this._leesKleuren().ander}">
            <span>★ Andere klank</span>
          </label>
        </div>
        <button class="ov04-kleur-reset" id="ov04-kleur-reset" type="button" 
                style="margin-top:8px; font-size:0.85rem; padding:4px 8px; cursor:pointer;">
          Standaardkleuren herstellen
        </button>
      </div>

      <!-- STAP 4: Aantal woorden -->
      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">4</span> Aantal woorden
        </label>
        <input type="number" id="ov04-aantal-woorden" min="6" max="24" value="12">
      </div>

      <!-- STAP 5: Schrijflijnen -->
      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">5</span> Schrijflijnen
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

      <!-- STAP 6: Ondertitel -->
      <div class="ov-instel-blok">
        <label class="ov-instel-titel">
          <span class="ov-instel-nr">6</span> Ondertitel (vrij)
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
    const lijntype = o.lijntype || "type3";
    const lijnhoogte = o.lijnhoogte || "klein";
    const ondertitel = o.ondertitel || "";
    const leerjaar = opties.graad || 1;

    const gekozenWoorden = window._weekdictee_gekozenWoorden || [];

    if (gekozenWoorden.length === 0) {
      return `<div class="werkblad ov04-blad">
        <div class="weekdictee-empty">
          <h3>📋 Nog geen woorden gekozen</h3>
          <p>Klik op <strong>"Open woordenkiezer"</strong> in de zijbalk om woorden te selecteren.</p>
        </div>
      </div>`;
    }

    // Detecteer welke klank-paren mogelijk zijn
    const paren = this._detecteerParen(gekozenWoorden, leerjaar);

    if (paren.length === 0) {
      return `<div class="werkblad ov04-blad">
        <div class="weekdictee-empty">
          <h3>🎨 Klanken sorteren niet mogelijk</h3>
          <p>Vink categorieën aan die een klank-tegenstelling vormen, bijvoorbeeld:</p>
          <ul style="text-align:left; max-width:500px; margin: 12px auto;">
            <li>Korte klanken + Lange klanken</li>
            <li>ei + ij</li>
            <li>au + ou</li>
            <li>ng + nk</li>
            <li>cht + gt</li>
            <li>Verlengingsregel (minstens woorden op -d én -t, of -b én -p)</li>
          </ul>
        </div>
      </div>`;
    }

    // Voor elk paar × elk niveau één werkblad
    let html = "";
    for (const paar of paren) {
      for (const niveau of niveaus) {
        // Uitbreiding heeft geen sorteer-woorden (lege kolommen).
        // Basis/kern/verdieping krijgen woorden volgens _maxPerNiveau.
        const woorden = (niveau === "uitbreiding")
          ? []
          : this._kiesWoordenVoorParen(gekozenWoorden, paar, niveau);
        html += this._renderEenBlad(niveau, woorden, paar, lijntype, lijnhoogte, ondertitel, metAntwoorden);
      }
    }
    return html;
  },

  /* Kies woorden voor één paar:
     - alleen woorden die in een van de kolommen passen
     - clamp op _maxPerNiveau (12 voor basis/kern)
     - gebalanceerd over kolommen voor zover mogelijk */
  _kiesWoordenVoorParen: function(allWoorden, paar, niveau) {
    const max = this._maxPerNiveau[niveau] || 12;
    // Filter: alleen woorden die in een kolom horen
    const passend = allWoorden.filter(w => 
      paar.kolommen.some(k => k.filter(w))
    );
    // Shuffle deterministisch, neem max
    return this._kiesWoorden(passend, max);
  },

  /* Helper: maak van woord-tekst de hint-weergave voor een niveau.
     - basis: vervang klank-match met symbool van kolom (in kolomkleur)
       UITZONDERING: paren met basisVoluit=true tonen woord voluit op basis
     - kern: vervang klank-match met onderstreepjes
       UITZONDERING: paren met basisVoluit=true tonen symbool op kern (één niveau "verlaat")
     - verdieping: onderstreepjes
     - antwoorden-mode: heel woord, klank in kolomkleur */
  _woordMetHint: function(woord, passendeKolom, niveau, metAntwoorden, paar) {
    const kaal = woord.tekst;
    if (!passendeKolom) return kaal;

    // Antwoorden-mode: hele woord, klank in kolomkleur
    if (metAntwoorden) {
      if (passendeKolom.klankRegex) {
        return kaal.replace(passendeKolom.klankRegex, (m) => 
          `<span style="color:${passendeKolom.kleur}; font-weight:700">${m}</span>`
        );
      }
      return kaal;
    }

    // Voor 'basisVoluit'-paren (korte/lange/andere klanken):
    //   - basis = voluit, geen hint
    //   - kern = symbool-hint
    //   - verdieping = streepjes
    // Voor andere paren:
    //   - basis = symbool-hint
    //   - kern = streepjes
    //   - verdieping = streepjes
    const isVoluit = paar && paar.basisVoluit;
    let effectiefNiveau = niveau;
    if (isVoluit) {
      if (niveau === "basis") effectiefNiveau = "voluit";
      else if (niveau === "kern") effectiefNiveau = "symbool";
      // verdieping blijft verdieping (= streepjes)
    } else {
      if (niveau === "basis") effectiefNiveau = "symbool";
      // kern + verdieping = streepjes
    }

    // Voluit: hele woord tonen
    if (effectiefNiveau === "voluit") {
      return kaal;
    }

    // Symbool op klank-plek (één teken in kolomkleur)
    if (effectiefNiveau === "symbool") {
      if (passendeKolom.klankRegex && passendeKolom.symbool) {
        return kaal.replace(passendeKolom.klankRegex, () =>
          `<span class="ov04-symbool" style="color:${passendeKolom.kleur}">${passendeKolom.symbool}</span>`
        );
      }
      return kaal;
    }

    // Streepjes (kern + verdieping voor andere paren, of verdieping voor voluit-paren)
    if (passendeKolom.klankRegex) {
      return kaal.replace(passendeKolom.klankRegex, (m) => {
        const aantal = Math.max(m.length, 2);
        return `<span class="ov04-streepjes">${"_".repeat(aantal)}</span>`;
      });
    }
    return kaal;
  },

  _renderEenBlad: function(niveau, woorden, paar, lijntype, lijnhoogte, ondertitel, metAntwoorden) {
    const sl = window.SpellingSchrijflijnen;
    const kolommen = paar.kolommen;

    // Legende bovenaan: toon kolomkleur, symbool, en titel
    const legendeHTML = `
      <div class="ov04-legende">
        ${kolommen.map(cat => `
          <div class="ov04-legende-item">
            <span class="ov04-legende-kleur" style="background:${cat.kleur}">${cat.symbool || ""}</span>
            <span class="ov04-legende-tekst">${cat.titel}</span>
          </div>
        `).join("")}
      </div>`;

    // Woorden-blok: voor basis, kern EN verdieping
    let woordenHTML = "";
    if (niveau === "basis" || niveau === "kern" || niveau === "verdieping") {
      const woordenLijst = woorden.map(w => {
        const passendeKolom = kolommen.find(k => k.filter(w));
        const weergave = this._woordMetHint(w, passendeKolom, niveau, metAntwoorden, paar);
        return `<span class="ov04-woord">${weergave}</span>`;
      }).join("");
      
      let woordenTitel;
      const isVoluit = paar.basisVoluit;
      if (niveau === "basis") {
        woordenTitel = isVoluit
          ? "Kleur de klank in elk woord en schrijf het in de juiste kolom:"
          : "Schrijf elk woord volledig in de juiste kolom:";
      } else if (niveau === "kern") {
        woordenTitel = "Vul de ontbrekende klank in en schrijf het woord in de juiste kolom:";
      } else {
        // verdieping
        woordenTitel = "Vul aan en sorteer. Bedenk daarna zelf 3 woorden per kolom.";
      }
      
      woordenHTML = `
        <div class="ov04-woorden-titel">${woordenTitel}</div>
        <div class="ov04-woorden-lijst">${woordenLijst}</div>`;
    }

    // Bepaal aantal schrijflijnen per kolom
    // Basis/Kern: net genoeg lijnen voor de gegeven woorden
    // Verdieping: 6 lijnen per kolom (3 voor sorteer-woorden + 3 voor eigen woorden)
    // Uitbreiding: 5 lijnen per kolom (kind bedenkt 5 woorden per kolom)
    let aantalLijnenPerKolom;
    if (niveau === "verdieping") {
      aantalLijnenPerKolom = 6;
    } else if (niveau === "uitbreiding") {
      aantalLijnenPerKolom = 5;
    } else {
      // basis/kern: 1 lijn per woord (gemiddeld) + 1 buffer
      aantalLijnenPerKolom = Math.ceil((woorden.length / kolommen.length) + 1);
    }

    const kolommenHTML = kolommen.map(cat => {
      // Voor oplossingen: vind de woorden die in deze kolom horen
      // (geldt voor basis, kern EN verdieping — alle drie hebben woorden)
      const woordenInKolom = (metAntwoorden && niveau !== "uitbreiding")
        ? woorden.filter(w => cat.filter(w))
        : [];
      
      const lijnen = [];
      for (let i = 0; i < aantalLijnenPerKolom; i++) {
        let antwoord = "";
        if (woordenInKolom[i]) {
          antwoord = `<span class="ov04-lijn-antwoord">${woordenInKolom[i].tekst}</span>`;
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

    // Bij uitbreiding: 3 zin-schrijflijnen onderaan (was vroeger "schrijf in schrift")
    let uitbreidingsZinnen = "";
    if (niveau === "uitbreiding") {
      const zinLijnen = [1, 2, 3].map(() => 
        sl ? sl.htmlCanvas(lijntype, lijnhoogte, 580) : `<div class="ov04-fallback-lijn"></div>`
      ).join("");
      const oplTekst = metAntwoorden
        ? `<p class="ov01-zin-richtlijn">Verwacht: 3 zinnen, elk met minstens één woord uit een andere kolom.</p>`
        : "";
      uitbreidingsZinnen = `
        <div class="ov04-zinnen-blok">
          <div class="ov04-zinnen-titel">Maak nu 3 zinnen met telkens één woord uit een andere kolom:</div>
          ${zinLijnen}
          ${oplTekst}
        </div>`;
    }

    const niveauLabel = {
      basis: "⭐", kern: "⭐⭐", verdieping: "⭐⭐⭐", uitbreiding: "⭐⭐⭐⭐"
    }[niveau];

    const oplBadge = metAntwoorden
      ? `<span class="oplossingen-badge">OPLOSSINGEN</span>`
      : "";

    // Opdracht-tekst per niveau
    let opdrachtTekst = "";
    const isVoluit = paar.basisVoluit;
    if (niveau === "basis") {
      opdrachtTekst = isVoluit
        ? `
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Kleur de klank in elk woord met de juiste kleur.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Schrijf het woord in de juiste kolom.</span></div>`
        : `
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Het symbool toont welke soort klank ontbreekt.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Schrijf het juiste woord in de juiste kolom.</span></div>`;
    } else if (niveau === "kern") {
      opdrachtTekst = isVoluit
        ? `
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Het symbool toont welke soort klank ontbreekt.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Vul de klank in en schrijf het woord in de juiste kolom.</span></div>`
        : `
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Vul de ontbrekende klank in.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Schrijf het woord in de juiste kolom.</span></div>`;
    } else if (niveau === "verdieping") {
      opdrachtTekst = `
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Vul de klanken in en schrijf elk woord in de juiste kolom.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Bedenk daarna zelf nog 3 woorden per kolom.</span></div>`;
    } else if (niveau === "uitbreiding") {
      opdrachtTekst = `
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Bedenk 5 woorden voor elke kolom.</span></div>
        <div class="ov01-stap-rij"><span class="ov01-vakje"></span><span>Maak onderaan 3 zinnen, telkens met een woord uit een andere kolom.</span></div>`;
    }

    // Werkblad-titel: gebruik paar.titel zodat leerkracht/kind ziet welk paar
    const werkbladTitel = paar.titel || "Klanken sorteren";

    return `
      <div class="werkblad ov04-blad lijnhoogte-${lijnhoogte}" data-lijntype="${lijntype}" data-lijnhoogte="${lijnhoogte}" data-niveau="${niveau}">
        <div class="ov01-header">
          <div class="ov01-naam-rij">
            <span data-bewerk-id="naamlabel-${niveau}-${paar.id}">Naam:</span>
            <span class="ov01-lijn-naam"></span>
            <span data-bewerk-id="datumlabel-${niveau}-${paar.id}">Datum:</span>
            <span class="ov01-lijn-datum"></span>
          </div>
          <h2 class="ov01-titel" data-bewerk-id="titel-${niveau}-${paar.id}">
            ${werkbladTitel}
            <span class="ov01-niveau-badge ov01-niveau-${niveau}">${niveauLabel}</span>
            ${oplBadge}
          </h2>
          ${ondertitel ? `<p class="ov01-ondertitel" data-bewerk-id="ondertitel-${niveau}-${paar.id}">${ondertitel}</p>` : ""}
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

        ${uitbreidingsZinnen}

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

/* ==========================================================
   Module: Klankzuivere woorden (graad 1)
   Structuren: mkm, mmkm, mkmm, mmkmm
   Per structuur gegroepeerd per klinker (a, e, i, o, u)
   ========================================================== */

window.SpellingModules = window.SpellingModules || {};

window.SpellingModules.klankzuiver = {

  naam: "Klankzuivere woorden",
  graad: 1,

  /* ---------- WOORDENLIJSTEN ---------- */
  /* Alle woorden zijn klankzuiver: schrijf wat je hoort.
     Geen woorden op -d of -b (verlengingsregel: bad→baden, krab→krabben).
     -g blijft (vlag, rug — standaard graad 1).
     Geen woorden op -nd (hand→handen). */
  woordenlijsten: {

    // ===== STRUCTUUR-GEBASEERDE LIJSTEN (korte klank) =====

    // mkm = medeklinker + klinker + medeklinker (3 letters)
    mkm: {
      a: ["bal", "kat", "tas", "man", "pan", "kar", "dak", "lam", "zak", "vak", "gas", "rat", "sap", "mat", "vat", "tak"],
      e: ["bel", "pet", "ben", "bek", "hek", "pen", "gek", "les", "mes", "tel", "wel", "ren", "vel", "nek", "vet", "zes"],
      i: ["bil", "kip", "pin", "vis", "wit", "lip", "tik", "zin", "mik", "fit", "dik", "hip", "vin"],
      o: ["bom", "pop", "rok", "vos", "kom", "lof", "mop", "pot", "tol", "zon", "bos", "dop", "kop", "hok", "tof", "tor"],
      u: ["bus", "dun", "hut", "kus", "mus", "nul", "put", "pup", "vul", "zus", "rug", "duf", "ruk", "lus", "mug"]
    },

    // mmkm = 2 medeklinkers + klinker + medeklinker (4 letters)
    mmkm: {
      a: ["stal", "klap", "snap", "vlag", "klas", "plas", "smal", "slak", "trap", "graf", "spat", "stap"],
      e: ["stem", "klem", "knel", "vlek", "trek", "spek", "fles", "pret", "spel", "stel", "snel", "smet"],
      i: ["stip", "klim", "knik", "snip", "spin", "trip", "blik", "slim", "krik", "spit"],
      o: ["stop", "klop", "knot", "vlot", "snor", "trom", "krom", "slot", "blok", "plof", "spot"],
      u: ["stug", "klus", "knul", "vlug", "smul", "snuf", "trut", "krul", "spul", "prut", "drup"]
    },

    // mkmm = medeklinker + klinker + 2 medeklinkers (4 letters)
    // Geen -nd, -mb (verlenging).
    mkmm: {
      a: ["lamp", "kant", "park", "harp", "bank", "kast", "rank", "tank", "vast", "rasp", "tast", "wals"],
      e: ["lens", "tent", "wens", "verf", "berg", "kerk", "werk", "helm", "hels", "vest", "lest", "merk"],
      i: ["vink", "ring", "ding", "kist", "list", "rits", "hint", "tilt", "vilt", "tipt", "wikt"],
      o: ["pomp", "vork", "kort", "wolk", "zorg", "long", "lont", "korf", "wolf"],
      u: ["punt", "bult", "hulp", "kurk", "munt", "lust", "rust", "burg"]
    },

    // mmkmm = 2 medeklinkers + klinker + 2 medeklinkers (5 letters)
    mmkmm: {
      a: ["stamp", "klant", "krant", "plant", "spant", "blank", "kramp", "klamp"],
      e: ["klemt", "stelt", "spelt", "smelt", "trekt", "stelp", "knelt"],
      i: ["spint", "klimt", "krimp", "drink", "stink", "knipt", "klikt"],
      o: ["stomp", "klomp", "knort", "stort", "kromp", "trots"],
      u: ["stulp", "klust", "krult", "drukt", "spurt", "stunt"]
    },

    // ===== KLANK-GEBASEERDE LIJSTEN =====
    // Voor sub-categorie "tweeklanken & combinaties"
    ie:   ["riet", "biet", "vier", "wiel", "niet", "lief", "diep", "kies", "fiets", "tien", "stier", "knie", "die", "zie"],
    eu:   ["neus", "deur", "kleur", "geur", "kreun", "reus", "keus", "leuk", "beuk", "scheur", "treur"],
    ui:   ["huis", "muis", "tuin", "duin", "kruis", "lui", "fluit", "buik", "duif", "ruit", "bui", "stuit"],
    oe:   ["boek", "koek", "doek", "voet", "bloem", "stoel", "moe", "snoep", "groen", "vloer", "schoen", "broek", "loep"],
    aai:  ["haai", "kraai", "draai", "saai", "lawaai", "fraai", "zwaai", "naai"],
    ooi:  ["mooi", "kooi", "strooi", "gooi", "rooi", "tooi"],
    oei:  ["groei", "bloei", "boei", "stoei", "loei", "vloei"],
    eeuw: ["leeuw", "sneeuw", "eeuw", "spreeuw", "meeuw"],
    ieuw: ["nieuw", "kieuw", "opnieuw"],

    // ===== VERWARLETTER-LIJSTEN (beginletter) =====
    // Alle klankzuiver, allemaal beginnend met DE LOSSE letter (geen clusters).
    // Geen st-, sp-, sch-, vl-, fl-, zw-, dr- enz.
    // Geen woorden op -d, -b of -nd (verlengingsregel).
    verwar: {
      b: ["bal", "bel", "bek", "bom", "bos", "bus", "ben", "bok", "bot",
          "boer", "boek", "buik", "boot", "boom", "bij", "bil", "buur", "baan", "bui"],
      d: ["dak", "dop", "dun", "duf", "dik", "dol", "dat", "dier", "deur",
          "doek", "duin", "dom", "doos", "doof", "doe", "door", "dans"],
      v: ["vis", "vos", "vat", "vel", "vin", "ven", "vol", "val", "vet", "vak",
          "voet", "vier", "veer", "voor", "vies", "vuur", "voer", "vaak"],
      f: ["fit", "fel", "fop", "fee", "feest", "fiets", "film", "fout",
          "feit", "fuif", "foef", "foei"],
      z: ["zak", "zon", "zus", "zin", "zes", "zit", "zee", "zou", "zoek",
          "zoen", "zoet", "zorg", "zien", "zaal", "ziek", "zoom"],
      s: ["sap", "sok", "sip", "som", "sas", "sus", "set", "saai", "soep",
          "sik", "sukkel", "sof"]
    }
  },

  /* Welke "klankgroepen" zijn beschikbaar in sub-categorie tweeklanken? */
  klankgroepen: ["ie", "eu", "ui", "oe", "aai", "ooi", "oei", "eeuw", "ieuw"],

  /* Verwarletter-paren */
  verwarParen: [
    { id: "bd", letters: ["b", "d"], label: "b / d" },
    { id: "vf", letters: ["v", "f"], label: "v / f" },
    { id: "zs", letters: ["z", "s"], label: "z / s" }
  ],

  /* ---------- INSTELLINGEN UI ---------- */
  renderInstellingen: function() {
    return `
      <h2>Instellingen</h2>

      <label>Soort woorden</label>
      <div class="subtype-knoppen subcat-3kol" id="subcat-knoppen">
        <button class="actief" data-subcat="kort">Korte klanken</button>
        <button data-subcat="tweeklank">Tweeklanken</button>
        <button data-subcat="verwar">Verwarletters</button>
      </div>

      <!-- Voor 'kort': structuur-knoppen + klinker-keuze -->
      <div id="kort-blok" style="margin-top:12px">
        <label>Woordstructuur</label>
        <div class="subtype-knoppen" id="structuur-knoppen">
          <button class="actief" data-structuur="mkm">mkm <small>(bal)</small></button>
          <button data-structuur="mmkm">mmkm <small>(stal)</small></button>
          <button data-structuur="mkmm">mkmm <small>(lamp)</small></button>
          <button data-structuur="mmkmm">mmkmm <small>(stamp)</small></button>
        </div>

        <label style="margin-top:12px">Klinkers</label>
        <div class="oefenvorm-lijst" id="klinker-keuze">
          <label><input type="checkbox" value="a" checked> a</label>
          <label><input type="checkbox" value="e" checked> e</label>
          <label><input type="checkbox" value="i" checked> i</label>
          <label><input type="checkbox" value="o" checked> o</label>
          <label><input type="checkbox" value="u" checked> u</label>
        </div>
      </div>

      <!-- Voor 'tweeklank': klankgroep-keuze -->
      <div id="tweeklank-blok" style="margin-top:12px; display:none">
        <label>Klankgroepen</label>
        <div class="klankgroep-keuze" id="klankgroep-keuze">
          <label><input type="checkbox" value="ie" checked> ie</label>
          <label><input type="checkbox" value="eu" checked> eu</label>
          <label><input type="checkbox" value="ui" checked> ui</label>
          <label><input type="checkbox" value="oe" checked> oe</label>
          <label><input type="checkbox" value="aai"> aai</label>
          <label><input type="checkbox" value="ooi"> ooi</label>
          <label><input type="checkbox" value="oei"> oei</label>
          <label><input type="checkbox" value="eeuw"> eeuw</label>
          <label><input type="checkbox" value="ieuw"> ieuw</label>
        </div>
        <p style="font-size:0.75rem; color:#666; margin:6px 0 0 0">
          ie, eu, ui, oe staan standaard aan. aai/ooi/oei/eeuw/ieuw zijn moeilijker.
        </p>
      </div>

      <!-- Voor 'verwar': verwarpaar-keuze -->
      <div id="verwar-blok" style="margin-top:12px; display:none">
        <label>Verwarpaar</label>
        <div class="subtype-knoppen subcat-3kol" id="verwar-knoppen">
          <button class="actief" data-paar="bd">b / d</button>
          <button data-paar="vf">v / f</button>
          <button data-paar="zs">z / s</button>
        </div>
        <p style="font-size:0.75rem; color:#666; margin:6px 0 0 0">
          Woorden beginnen met de losse letter (geen clusters).
          Voor "Schrijf de ontbrekende letter" wordt de beginletter weggelaten.
        </p>
      </div>

      <label style="margin-top:12px; display: flex; justify-content: space-between; align-items: center;">
        <span>Oefenvormen</span>
        <button type="button" id="oef-reset-btn" class="mini-btn" title="Zet vinkjes terug naar standaard">↻ reset</button>
      </label>

      <!-- Tabs per niveau (Basis / Kern / Verdieping) -->
      <div class="oef-tabs" id="oef-tabs">
        <button type="button" class="oef-tab actief" data-niveau-tab="basis">Basis</button>
        <button type="button" class="oef-tab" data-niveau-tab="kern">Kern</button>
        <button type="button" class="oef-tab" data-niveau-tab="verdieping">Verdieping</button>
      </div>

      <!-- Inhoud van de actieve tab wordt hier gerenderd -->
      <div class="oef-tab-inhoud" id="oefenvorm-keuze">
        <!-- wordt dynamisch gevuld -->
      </div>

      <p style="font-size:0.75rem; color:#666; margin:6px 0 0 0">
        💡 Vinkjes blijven behouden bij wisselen van tab. Klik op ↻ reset om opnieuw te starten met de standaardkeuzes.
      </p>

      <label>Aantal oefeningen per blad
        <input type="number" id="aantal-oef" min="1" max="6" value="3">
      </label>
    `;
  },

  /* Welke oefenvormen zijn beschikbaar per niveau?
     Elke oefenvorm heeft:
     - id: techn. naam
     - label: korte naam in UI
     - icoon: emoji-icoon naast het label
     - uitleg: zin die toont wat de oefening doet (in tooltip + onder de keuze)
     - default: standaard aangevinkt?
     - alleenVoor: optioneel — beperken tot bepaalde subcat */
  oefenvormenPerNiveau: {
    basis: [
      { id: "woordplaatje", icoon: "🖼️", label: "Woord-bij-plaatje",
        uitleg: "Het kind ziet een afbeelding mét het woord eronder en schrijft het twee keer over.",
        default: true },
      { id: "invul-keuze", icoon: "📝", label: "Invullen met keuzewoorden",
        uitleg: "Een rij keuzewoorden bovenaan, daaronder lijntjes om elk woord op te schrijven.",
        default: true },
      { id: "ontbrekende-letter", icoon: "⬜", label: "Schrijf de ontbrekende letter",
        uitleg: "Woorden zonder beginletter. Het kind kiest tussen de twee verwarletters (b/d, v/f, z/s).",
        default: false, alleenVoor: "verwar" },
      { id: "sorteer-2", icoon: "📊", label: "Sorteren (2 kolommen)",
        uitleg: "Een tabel met 2 kolommen. Het kind sorteert woorden op klinker of klankgroep.",
        default: false }
    ],
    kern: [
      { id: "invul-zonder", icoon: "✍️", label: "Invullen zonder keuzewoorden",
        uitleg: "Lege lijntjes. De juf zegt het woord en het kind schrijft het zelfstandig.",
        default: true },
      { id: "ontbrekende-letter", icoon: "⬜", label: "Schrijf de ontbrekende letter",
        uitleg: "Woorden zonder beginletter. Het kind kiest tussen de twee verwarletters.",
        default: true, alleenVoor: "verwar" },
      { id: "sorteer-3", icoon: "📊", label: "Sorteren (3+ kolommen)",
        uitleg: "Tabel met 3 of meer kolommen voor verfijnder sorteren.",
        default: true },
      { id: "dictee-vast", icoon: "👂", label: "Dictee-zinnen",
        uitleg: "De juf leest zinnen voor (zichtbaar in oplossingen). Het kind schrijft de zin.",
        default: false },
      { id: "fouten-woord", icoon: "❌", label: "Fouten verbeteren in losse woorden",
        uitleg: "Het woord is fout geschreven (typische kinderfout). Het kind verbetert.",
        default: false }
    ],
    verdieping: [
      { id: "fouten-zin", icoon: "❌", label: "Fouten verbeteren in zinnen",
        uitleg: "Zinnen met een fout woord erin. Het kind schrijft de zin correct over.",
        default: true },
      { id: "dictee-vast", icoon: "👂", label: "Dictee-zinnen (uitgebreid)",
        uitleg: "Volledige zinnen met meerdere woorden uit de leerstof.",
        default: true },
      { id: "ontbrekende-letter-zin", icoon: "⬜", label: "Ontbrekende letter in zin",
        uitleg: "Zinnen waar in elk woord een letter ontbreekt. Het kind vult de juiste letter in.",
        default: false, alleenVoor: "verwar" },
      { id: "sorteer-3", icoon: "📊", label: "Sorteren in alle kolommen",
        uitleg: "Tabel met alle kolommen voor uitgebreide sorteeroefening.",
        default: false }
    ]
  },

  /* ---------- WERKBLADEN GENEREREN ---------- */
  /* metAntwoorden = true → toont antwoorden in rood (oplossingenbundel) */
  genereerBlad: function(opties, metAntwoorden = false) {
    const woorden = this._verzamelWoorden(opties);
    if (woorden.length === 0) {
      return `<div class="werkblad"><p>Geen woorden gevonden voor deze instellingen.</p></div>`;
    }

    // Bewaar verwar-letters voor de oefenvormen die ze nodig hebben
    if (opties.subcat === "verwar") {
      const paar = this.verwarParen.find(p => p.id === opties.verwarPaar);
      this._huidigeVerwarLetters = paar ? paar.letters : null;
    } else {
      this._huidigeVerwarLetters = null;
    }

    const globaalLijn = opties.lijntypeGlobaal || "vier";
    const oplossingClass = metAntwoorden ? " met-antwoorden" : "";
    const oplossingBadge = metAntwoorden
      ? `<span class="oplossingen-badge">OPLOSSINGEN</span>`
      : "";

    let html = `<div class="werkblad lijn-${globaalLijn}${oplossingClass}">
      <div class="werkblad-header">
        <h2 class="werkblad-titel" data-bewerk-id="titel">Spelling – ${this._titel(opties)}${oplossingBadge}</h2>
        <div class="werkblad-naam"><span data-bewerk-id="naamlabel">Naam:</span><span class="naam-lijn"></span></div>
      </div>`;

    let nr = 1;
    for (const vorm of opties.oefenvormen.slice(0, opties.aantalOef)) {
      const override = opties.lijntypePerVorm?.[vorm];
      let oefHTML = this._renderOefening(vorm, woorden, nr, metAntwoorden);
      oefHTML = oefHTML.replace(
        /<div class="opdracht-instructie">/g,
        `<div class="opdracht-instructie" data-bewerk-id="instr-${nr}">`
      );
      if (override) {
        html += `<div class="lijn-${override}">${oefHTML}</div>`;
      } else {
        html += oefHTML;
      }
      nr++;
    }

    html += `</div>`;
    return html;
  },

  _verzamelWoorden: function(opties) {
    if (opties.subcat === "tweeklank") {
      let alle = [];
      for (const k of opties.klankgroepen || []) {
        if (this.woordenlijsten[k]) alle = alle.concat(this.woordenlijsten[k]);
      }
      return alle.filter(w => w && typeof w === "string");
    }
    if (opties.subcat === "verwar") {
      const paar = this.verwarParen.find(p => p.id === opties.verwarPaar);
      if (!paar) return [];
      let alle = [];
      for (const letter of paar.letters) {
        if (this.woordenlijsten.verwar[letter]) {
          alle = alle.concat(this.woordenlijsten.verwar[letter]);
        }
      }
      return alle.filter(w => w && typeof w === "string");
    }
    // Standaard: korte klank op structuur
    const lijst = this.woordenlijsten[opties.structuur];
    if (!lijst) return [];
    let alle = [];
    for (const k of opties.klinkers || []) {
      if (lijst[k]) alle = alle.concat(lijst[k]);
    }
    return alle.filter(w => w && typeof w === "string");
  },

  _titel: function(opties) {
    const niv = { basis: "Basis", kern: "Kern", verdieping: "Verdieping" };
    if (opties.subcat === "tweeklank") {
      const groepen = (opties.klankgroepen || []).join(" / ");
      return `tweeklanken (${groepen}) – ${niv[opties.niveau]}`;
    }
    if (opties.subcat === "verwar") {
      const paar = this.verwarParen.find(p => p.id === opties.verwarPaar);
      return `verwarletters ${paar ? paar.label : ""} – ${niv[opties.niveau]}`;
    }
    return `klankzuiver ${opties.structuur} – ${niv[opties.niveau]}`;
  },

  _kies: function(woorden, n) {
    const kopie = [...woorden];
    const uit = [];
    for (let i = 0; i < n && kopie.length > 0; i++) {
      const idx = Math.floor(this._random() * kopie.length);
      uit.push(kopie.splice(idx, 1)[0]);
    }
    return uit;
  },

  /* Pseudo-random met seed. Zet _seed vóór genereerBlad om reproduceerbaarheid
     te krijgen (gebruikt voor matching werkblad ↔ oplossingen). */
  _seed: null,
  _random: function() {
    if (this._seed === null) return Math.random();
    // Mulberry32 — eenvoudig en deterministisch
    let t = (this._seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  },

  _renderOefening: function(vorm, woorden, nr, metAntwoorden = false) {
    switch (vorm) {

      case "woordplaatje": {
        const sel = this._kies(woorden, 6);
        let cellen = "";
        for (const w of sel) {
          const afbeelding = window.SpellingAfbeeldingen
            ? window.SpellingAfbeeldingen.htmlVoorWoord(w)
            : `<span class="woord-emoji">📷</span>`;
          // Bij oplossingen: woord op de twee schrijflijnen in rood
          const lijn1 = metAntwoorden
            ? `<div class="schrijflijn"><span class="antwoord">${w}</span></div>`
            : `<div class="schrijflijn"></div>`;
          const lijn2 = metAntwoorden
            ? `<div class="schrijflijn"><span class="antwoord">${w}</span></div>`
            : `<div class="schrijflijn"></div>`;
          cellen += `<div class="woord-plaatje-cel">
            <div class="plaatje">${afbeelding}</div>
            <div class="woord-label">${w}</div>
            ${lijn1}
            ${lijn2}
          </div>`;
        }
        return `<div class="opdracht">
          <div class="opdracht-instructie">${nr}. Schrijf het woord twee keer over.</div>
          <div class="woord-plaatje-rooster">${cellen}</div>
        </div>`;
      }

      case "invul-keuze": {
        const sel = this._kies(woorden, 5);
        const balk = sel.join(" • ");
        let zinnen = "";
        sel.forEach((w, i) => {
          const inhoud = metAntwoorden ? `<span class="antwoord">${w}</span>` : "";
          zinnen += `<div class="dictee-zin">
            <span class="dictee-nr">${i+1}.</span>
            <span class="dictee-lijn">${inhoud}</span>
          </div>`;
        });
        return `<div class="opdracht">
          <div class="opdracht-instructie">${nr}. Schrijf elk woord op een lijn.</div>
          <div class="keuzewoord-balk">${balk}</div>
          ${zinnen}
        </div>`;
      }

      case "invul-zonder": {
        // Voor invul-zonder is er geen vooraf bepaalde lijst zichtbaar.
        // Voor de oplossingen kiezen we 6 woorden uit de pool.
        const sel = this._kies(woorden, 6);
        let zinnen = "";
        sel.forEach((w, i) => {
          const inhoud = metAntwoorden ? `<span class="antwoord">${w}</span>` : "";
          zinnen += `<div class="dictee-zin">
            <span class="dictee-nr">${i+1}.</span>
            <span class="dictee-lijn">${inhoud}</span>
          </div>`;
        });
        return `<div class="opdracht">
          <div class="opdracht-instructie">${nr}. Luister goed en schrijf het woord.</div>
          ${zinnen}
        </div>`;
      }

      case "sorteer-2":
      case "sorteer-3": {
        const sel = this._kies(woorden, 10);
        const isTweeklank = woorden.some(w => this._herkenKlankgroep(w));
        let kolomLabels;
        if (isTweeklank) {
          kolomLabels = [...new Set(sel.map(w => this._herkenKlankgroep(w)))].filter(Boolean);
        } else if (this._huidigeVerwarLetters) {
          kolomLabels = [...this._huidigeVerwarLetters];
        } else {
          kolomLabels = [...new Set(sel.map(w => this._haalKlinkerUit(w)))];
        }
        kolomLabels = kolomLabels.slice(0, vorm === "sorteer-2" ? 2 : 5);

        let kolommen = kolomLabels.map(k => `<th>${k}</th>`).join("");

        // Bouw rijen. Bij oplossingen vullen we de juiste cellen in.
        let rijen = "";
        if (metAntwoorden) {
          // Groepeer woorden per kolom
          const perKolom = {};
          kolomLabels.forEach(k => perKolom[k] = []);
          sel.forEach(w => {
            let kolom;
            if (isTweeklank) kolom = this._herkenKlankgroep(w);
            else if (this._huidigeVerwarLetters) kolom = w[0];
            else kolom = this._haalKlinkerUit(w);
            if (perKolom[kolom]) perKolom[kolom].push(w);
          });
          const maxRijen = Math.max(6, ...Object.values(perKolom).map(a => a.length));
          for (let r = 0; r < maxRijen; r++) {
            rijen += "<tr>" + kolomLabels.map(k => {
              const woord = perKolom[k][r];
              return woord ? `<td><span class="antwoord">${woord}</span></td>` : "<td></td>";
            }).join("") + "</tr>";
          }
        } else {
          for (let r = 0; r < 6; r++) {
            rijen += "<tr>" + kolomLabels.map(() => "<td></td>").join("") + "</tr>";
          }
        }

        return `<div class="opdracht">
          <div class="opdracht-instructie">${nr}. Sorteer de woorden in de juiste kolom.</div>
          <div class="keuzewoord-balk">${sel.join(" • ")}</div>
          <table class="sorteer-tabel">
            <thead><tr>${kolommen}</tr></thead>
            <tbody>${rijen}</tbody>
          </table>
        </div>`;
      }

      case "dictee-vast": {
        const sel = this._kies(woorden, 6);
        // Genereer per woord een eenvoudige zin (zelfde sjabloon-aanpak)
        const sjablonen = [
          w => `De ${w} is mooi.`,
          w => `Ik zie een ${w}.`,
          w => `Mijn ${w} is groot.`,
          w => `De ${w} ligt hier.`,
          w => `Hij heeft een ${w}.`,
          w => `Wij kijken naar de ${w}.`
        ];
        let zinnen = "";
        sel.forEach((w, i) => {
          const zin = sjablonen[i % sjablonen.length](w);
          if (metAntwoorden) {
            zinnen += `<div class="dictee-zin">
              <span class="dictee-nr">${i+1}.</span>
              <span class="dictee-lijn"><span class="antwoord">${zin}</span></span>
            </div>`;
          } else {
            zinnen += `<div class="dictee-zin">
              <span class="dictee-nr">${i+1}.</span>
              <span class="dictee-lijn"></span>
            </div>`;
          }
        });
        // Bij gewone werkblad tonen we GEEN zinnen op het blad zelf —
        // die spreekt de juf voor. Maar bij oplossingen zien we wat de juf zei.
        const instr = metAntwoorden
          ? `${nr}. Dictee — voor de juf:`
          : `${nr}. Dictee. Luister naar de juf en schrijf de zin.`;
        return `<div class="opdracht">
          <div class="opdracht-instructie">${instr}</div>
          ${zinnen}
        </div>`;
      }

      case "fouten-woord": {
        const sel = this._kies(woorden, 6);
        let lijst = "";
        sel.forEach((w, i) => {
          const fout = this._maakFout(w);
          const correctie = metAntwoorden
            ? `<span class="fouten-correctie"><span class="antwoord">${w}</span></span>`
            : `<span class="fouten-correctie"></span>`;
          lijst += `<div class="fouten-zin">${i+1}. <strong>${fout}</strong> →${correctie}</div>`;
        });
        return `<div class="opdracht">
          <div class="opdracht-instructie">${nr}. Verbeter het foute woord.</div>
          ${lijst}
        </div>`;
      }

      case "fouten-zin": {
        const sel = this._kies(woorden, 4);
        const sjablonen = [
          w => ({ fout: `De ${this._maakFout(w)} ligt op de mat.`, goed: `De ${w} ligt op de mat.` }),
          w => ({ fout: `Ik wil een ${this._maakFout(w)} kopen.`, goed: `Ik wil een ${w} kopen.` }),
          w => ({ fout: `Mijn zus heeft een ${this._maakFout(w)}.`, goed: `Mijn zus heeft een ${w}.` }),
          w => ({ fout: `De ${this._maakFout(w)} is heel mooi.`, goed: `De ${w} is heel mooi.` })
        ];
        let lijst = "";
        sel.forEach((w, i) => {
          const z = sjablonen[i % sjablonen.length](w);
          const correctie = metAntwoorden
            ? `<div class="dictee-lijn" style="margin-bottom:14px"><span class="antwoord">${z.goed}</span></div>`
            : `<div class="dictee-lijn" style="margin-bottom:14px"></div>`;
          lijst += `<div class="fouten-zin">${i+1}. ${z.fout}</div>${correctie}`;
        });
        return `<div class="opdracht">
          <div class="opdracht-instructie">${nr}. Schrijf de zin correct over. Verbeter de fout.</div>
          ${lijst}
        </div>`;
      }

      case "ontbrekende-letter": {
        const sel = this._kies(woorden, 8);
        const letters = this._huidigeVerwarLetters || ["b", "d"];
        let cellen = "";
        sel.forEach((w, i) => {
          const rest = w.substring(1);
          const eerste = w[0];
          const vakje = metAntwoorden
            ? `<span class="ontbreekt-vakje"><span class="antwoord">${eerste}</span></span>`
            : `<span class="ontbreekt-vakje"></span>`;
          cellen += `<div class="ontbreekt-cel">
            <span class="ontbreekt-nr">${i+1}.</span>
            ${vakje}
            <span class="ontbreekt-rest">${rest}</span>
          </div>`;
        });
        return `<div class="opdracht">
          <div class="opdracht-instructie">${nr}. Schrijf de juiste letter: <strong>${letters.join(" of ")}</strong>?</div>
          <div class="ontbreekt-rooster">${cellen}</div>
        </div>`;
      }

      case "ontbrekende-letter-zin": {
        const sel = this._kies(woorden, 4);
        const letters = this._huidigeVerwarLetters || ["b", "d"];
        const sjablonen = [
          w => `Ik zie een __${w.substring(1)}.`,
          w => `Mijn __${w.substring(1)} is mooi.`,
          w => `De __${w.substring(1)} ligt op tafel.`,
          w => `Wij hebben een __${w.substring(1)}.`
        ];
        let lijst = "";
        sel.forEach((w, i) => {
          const eerste = w[0];
          const vakjeHTML = metAntwoorden
            ? `<span class="ontbreekt-vakje-inline"><span class="antwoord">${eerste}</span></span>`
            : `<span class="ontbreekt-vakje-inline"></span>`;
          const zin = sjablonen[i % sjablonen.length](w).replace("__", vakjeHTML);
          lijst += `<div class="fouten-zin">${i+1}. ${zin}</div>`;
        });
        return `<div class="opdracht">
          <div class="opdracht-instructie">${nr}. Schrijf in elk vakje de juiste letter: <strong>${letters.join(" of ")}</strong>?</div>
          ${lijst}
        </div>`;
      }

      default:
        return `<div class="opdracht">[Oefenvorm ${vorm} nog te bouwen]</div>`;
    }
  },

  /* Hulp: haal de klinker uit een eenvoudig klankzuiver woord */
  _haalKlinkerUit: function(woord) {
    const m = woord.match(/[aeiou]/);
    return m ? m[0] : "?";
  },

  /* Hulp: herken klankgroep (ie/eu/ui/oe/aai/ooi/oei/eeuw/ieuw) in een woord.
     Volgorde van controle is belangrijk: langere combinaties eerst! */
  _herkenKlankgroep: function(woord) {
    const volgorde = ["ieuw", "eeuw", "aai", "ooi", "oei", "ie", "eu", "ui", "oe"];
    for (const k of volgorde) {
      if (woord.includes(k)) return k;
    }
    return null;
  },

  /* Hulp: maak een typische spellingfout in een woord.
     Voor klankzuiver: verdubbel laatste medeklinker.
     Voor tweeklank: vervang door verkeerde variant (typische kinderfout). */
  _maakFout: function(woord) {
    const klankgroep = this._herkenKlankgroep(woord);
    if (klankgroep) {
      const verwarringen = {
        ie: "i",      // vier → vir
        eu: "u",      // neus → nus
        ui: "u",      // huis → hus
        oe: "o",      // boek → bok
        aai: "ai",    // haai → hai
        ooi: "oi",    // mooi → moi
        oei: "oi",    // groei → groi
        eeuw: "euw",  // leeuw → leuw
        ieuw: "iuw"   // nieuw → niuw
      };
      const fout = verwarringen[klankgroep];
      if (fout) return woord.replace(klankgroep, fout);
    }
    // Standaard: verdubbel laatste medeklinker (typische kinderfout)
    if (woord.length >= 3) {
      const laatste = woord[woord.length - 1];
      if (!"aeiou".includes(laatste)) {
        return woord + laatste;
      }
    }
    return woord;
  }
};

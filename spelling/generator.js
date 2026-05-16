/* ==========================================================
   generator.js
   Verzamelt alle gekozen instellingen en levert HTML voor
   één werkblad of een hele bundel.
   ========================================================== */

window.SpellingGenerator = {

  /* Verzamelt huidige UI-status in een opties-object */
  leesOpties: function() {
    const cat = document.querySelector(".cat-knop.actief")?.dataset.categorie || "klankzuiver";
    const graad = parseInt(document.querySelector(".graad-knop.actief")?.dataset.graad || "1", 10);
    const niveau = document.querySelector(".niveau-knop.actief")?.dataset.niveau || "basis";

    // === GLOBALE SCHRIJFLIJN-INSTELLINGEN (sectie 4 van zijbalk) ===
    // Eén centrale keuze voor alle werkbladen, weekdictee en bundels.
    // Vroeger had elke OV zijn eigen lijntype/lijnhoogte — dat zit
    // nu allemaal globaal. De oude per-OV DOM-elementen
    // (#ov0X-lijntype, #ov0X-lijnhoogte) bestaan niet meer in de UI.
    const globaalLijntype = document.querySelector("#zb-lt-grid .zb-lt-knop.actief")?.dataset.lt || "type3";
    const globaalLijnhoogte = document.querySelector("#zb-globale-hoogte .zb-hoogte-btn.actief")?.dataset.hoogte || "middel";

    // === Weekdictee-specifieke opties ===
    let weekdictee = null;
    if (cat === "weekdictee") {
      const dagenAan = {};
      document.querySelectorAll("#weekdictee-dagen .dag-aan").forEach(cb => {
        dagenAan[cb.dataset.dag] = cb.checked;
      });
      weekdictee = {
        dagen: dagenAan,
        aantalWoorden: parseInt(document.querySelector("#wd-woorden")?.value || "5", 10),
        aantalZinnen: parseInt(document.querySelector("#wd-zinnen")?.value || "1", 10),
        vrijdagHerhaling: document.querySelector("#wd-vrijdag-herhaling")?.checked || false,
        reflectieAan: document.querySelector("#wd-reflectie")?.checked !== false,
        reflectieText: document.querySelector("#wd-reflectie-tekst")?.value || "Wat vond ik van de dagelijkse spelling deze week?",
        lijntype: globaalLijntype,
        lijnhoogte: globaalLijnhoogte,
        titel: "Dagelijkse kost spelling"
      };
    }

    // === OV01-specifieke opties ===
    let ov01 = null;
    if (cat === "ov01") {
      const niveaus = [];
      document.querySelectorAll("#ov01-niveaus input[type='checkbox'][data-niveau]").forEach(cb => {
        if (cb.checked) niveaus.push(cb.dataset.niveau);
      });
      ov01 = {
        niveaus: niveaus.length > 0 ? niveaus : ["basis"],
        zelfdeWoorden: document.querySelector("#ov01-zelfde-woorden")?.checked !== false,
        aantalWoorden: parseInt(document.querySelector("#ov01-aantal-woorden")?.value || "9", 10),
        aantalLijnen: parseInt(document.querySelector("#ov01-aantal-lijnen")?.value || "1", 10),
        lijnhoogte: globaalLijnhoogte,
        lijntype: globaalLijntype,
        ondertitel: document.querySelector("#ov01-ondertitel")?.value || ""
      };
    }

    // === OV06-specifieke opties (Zinnen invullen) ===
    let ov06 = null;
    if (cat === "ov06") {
      const niveaus = [];
      document.querySelectorAll("#ov06-niveaus input[type='checkbox'][data-niveau]").forEach(cb => {
        if (cb.checked) niveaus.push(cb.dataset.niveau);
      });
      ov06 = {
        niveaus: niveaus.length > 0 ? niveaus : ["basis"],
        aantalZinnen: parseInt(document.querySelector("#ov06-aantal-zinnen")?.value || "6", 10),
        aantalAfleiders: parseInt(document.querySelector("#ov06-aantal-afleiders")?.value || "3", 10),
        aantalUitbreiding: parseInt(document.querySelector("#ov06-aantal-uitbreiding")?.value || "4", 10),
        lijnhoogte: globaalLijnhoogte,
        lijntype: globaalLijntype,
        ondertitel: document.querySelector("#ov06-ondertitel")?.value || "",
        eigenZinnen: document.querySelector("#ov06-eigen-zinnen")?.value || ""
      };
    }

    // === OV07-specifieke opties (Verkleinwoorden) ===
    let ov07 = null;
    if (cat === "ov07") {
      const niveaus = [];
      document.querySelectorAll("#ov07-niveaus input[type='checkbox'][data-niveau]").forEach(cb => {
        if (cb.checked) niveaus.push(cb.dataset.niveau);
      });
      const uitgangen = [];
      document.querySelectorAll("#ov07-uitgangen input[type='checkbox'][data-uitgang]").forEach(cb => {
        if (cb.checked) uitgangen.push(cb.dataset.uitgang);
      });
      ov07 = {
        niveaus: niveaus.length > 0 ? niveaus : ["basis"],
        uitgangen: uitgangen.length > 0 ? uitgangen : ["je", "tje", "pje"],
        aantalWoorden: parseInt(document.querySelector("#ov07-aantal-woorden")?.value || "8", 10),
        verhaalIdx: parseInt(document.querySelector("#ov07-verhaal-keuze")?.value || "0", 10),
        lijnhoogte: globaalLijnhoogte,
        lijntype: globaalLijntype,
        ondertitel: document.querySelector("#ov07-ondertitel")?.value || ""
      };
    }

    // === OV05-specifieke opties (Klank kiezen) ===
    let ov05 = null;
    if (cat === "ov05") {
      const niveaus = [];
      document.querySelectorAll("#ov05-niveaus input[type='checkbox'][data-niveau]").forEach(cb => {
        if (cb.checked) niveaus.push(cb.dataset.niveau);
      });
      ov05 = {
        niveaus: niveaus.length > 0 ? niveaus : ["basis"],
        klankpaar: document.querySelector("#ov05-klankpaar")?.value || "ei-ij",
        plaatjeKern: document.querySelector("#ov05-plaatje-kern")?.checked === true,
        plaatjeVerdieping: document.querySelector("#ov05-plaatje-verdieping")?.checked !== false,
        aantalWoorden: parseInt(document.querySelector("#ov05-aantal-woorden")?.value || "8", 10),
        lijnhoogte: globaalLijnhoogte,
        lijntype: globaalLijntype,
        ondertitel: document.querySelector("#ov05-ondertitel")?.value || ""
      };
    }

    // === OV04-specifieke opties (Categoriseren op klank) ===
    let ov04 = null;
    if (cat === "ov04") {
      const niveaus = [];
      document.querySelectorAll("#ov04-niveaus input[type='checkbox'][data-niveau]").forEach(cb => {
        if (cb.checked) niveaus.push(cb.dataset.niveau);
      });
      ov04 = {
        niveaus: niveaus.length > 0 ? niveaus : ["basis"],
        aantalKolommen: parseInt(document.querySelector("#ov04-aantal-kolommen button.actief")?.dataset.aantal || "3", 10),
        aantalWoorden: parseInt(document.querySelector("#ov04-aantal-woorden")?.value || "12", 10),
        lijnhoogte: globaalLijnhoogte,
        lijntype: globaalLijntype,
        ondertitel: document.querySelector("#ov04-ondertitel")?.value || "",
        // Per kolom
        kleur1: document.querySelector("#ov04-kleur-1")?.value || "#2196F3",
        kleur2: document.querySelector("#ov04-kleur-2")?.value || "#4CAF50",
        kleur3: document.querySelector("#ov04-kleur-3")?.value || "#FF9800",
        klank1: document.querySelector("#ov04-klank-1")?.value || "groep-kort",
        klank2: document.querySelector("#ov04-klank-2")?.value || "groep-lang",
        klank3: document.querySelector("#ov04-klank-3")?.value || "groep-andere",
        titel1: document.querySelector("#ov04-titel-1")?.value || "Korte klank",
        titel2: document.querySelector("#ov04-titel-2")?.value || "Lange klank",
        titel3: document.querySelector("#ov04-titel-3")?.value || "Andere klank"
      };
    }

    // === OV03-specifieke opties (Letters door elkaar) ===
    let ov03 = null;
    if (cat === "ov03") {
      const niveaus = [];
      document.querySelectorAll("#ov03-niveaus input[type='checkbox'][data-niveau]").forEach(cb => {
        if (cb.checked) niveaus.push(cb.dataset.niveau);
      });
      ov03 = {
        niveaus: niveaus.length > 0 ? niveaus : ["basis"],
        aantalWoorden: parseInt(document.querySelector("#ov03-aantal-woorden")?.value || "8", 10),
        lijnhoogte: globaalLijnhoogte,
        lijntype: globaalLijntype,
        ondertitel: document.querySelector("#ov03-ondertitel")?.value || ""
      };
    }

    // === OV02-specifieke opties (Woord 3x overschrijven) ===
    let ov02 = null;
    if (cat === "ov02") {
      ov02 = {
        metPlaatje: document.querySelector("#ov02-met-plaatje")?.checked !== false,
        aantalWoorden: parseInt(document.querySelector("#ov02-aantal-woorden")?.value || "8", 10),
        lijnhoogte: globaalLijnhoogte,
        lijntype: globaalLijntype,
        ondertitel: document.querySelector("#ov02-ondertitel")?.value || ""
      };
    }

    // === OV10-specifieke opties (Samenstellingen) ===
    let ov10 = null;
    if (cat === "ov10") {
      const niveaus = [];
      document.querySelectorAll("#ov10-niveaus input[type='checkbox'][data-niveau]").forEach(cb => {
        if (cb.checked) niveaus.push(cb.dataset.niveau);
      });
      ov10 = {
        niveaus: niveaus.length > 0 ? niveaus : ["basis"],
        aantalWoorden: parseInt(document.querySelector("#ov10-aantal-woorden")?.value || "6", 10),
        lijnhoogte: globaalLijnhoogte,
        lijntype: globaalLijntype,
        ondertitel: document.querySelector("#ov10-ondertitel")?.value || ""
      };
    }

    // Sub-categorie binnen klankzuiver: 'kort', 'tweeklank' of 'verwar'
    const subcat = document.querySelector("#subcat-knoppen button.actief")?.dataset.subcat || "kort";

    const structuur = document.querySelector("#structuur-knoppen button.actief")?.dataset.structuur || "mkm";

    const klinkers = [...document.querySelectorAll("#klinker-keuze input:checked")]
      .map(i => i.value);

    const klankgroepen = [...document.querySelectorAll("#klankgroep-keuze input:checked")]
      .map(i => i.value);

    const verwarPaar = document.querySelector("#verwar-knoppen button.actief")?.dataset.paar || "bd";

    // Oefenvormen + lijntype-overrides uit het centrale geheugen lezen
    // (vinkjes blijven behouden over alle tabs heen)
    const keuzes = (typeof window._SpellingOefKeuzes === "function") ? window._SpellingOefKeuzes() : {};
    const oefenvormen = [];
    const lijntypePerVorm = {};
    Object.entries(keuzes).forEach(([id, k]) => {
      if (k.aangevinkt) oefenvormen.push(id);
      if (k.lijntype) lijntypePerVorm[id] = k.lijntype;
    });

    // lijntypeGlobaal = de globale keuze (type1-type7) uit sectie 4.
    const lijntypeGlobaal = globaalLijntype;

    const aantalOef = parseInt(document.querySelector("#aantal-oef")?.value || "3", 10);
    const aantalBladen = parseInt(document.querySelector("#aantal-bladen")?.value || "2", 10);
    const bundelNaam = document.querySelector("#bundel-naam")?.value || "";

    return {
      categorie: cat,
      graad,
      niveau,
      subcat,
      structuur,
      klinkers,
      klankgroepen,
      verwarPaar,
      oefenvormen,
      lijntypeGlobaal,
      lijntypePerVorm,
      lijnhoogteGlobaal: globaalLijnhoogte,
      aantalOef,
      aantalBladen,
      bundelNaam,
      weekdictee,
      ov01,
      ov02,
      ov03,
      ov04,
      ov05,
      ov06,
      ov07,
      ov10
    };
  },

  /* Genereer alle bladen als één HTML string.
     Seed-mechanisme: het werkblad krijgt een random seed (gebaseerd op tijd).
     Die seed wordt bewaard in window.SpellingGenerator._laatsteSeed.
     Als metAntwoorden=true, hergebruiken we die seed → exact dezelfde woorden. */
  genereerBundel: function(opties, metAntwoorden = false) {
    const module = window.SpellingModules[opties.categorie];
    if (!module) return `<p>Module ${opties.categorie} nog niet beschikbaar.</p>`;

    if (!metAntwoorden) {
      this._laatsteSeed = Date.now() & 0xFFFFFFFF;
    }

    // Weekdictee + OV01-04: 1 keer aanroepen, module verzorgt
    // intern het maken van meerdere werkbladen (bv. één per niveau).
    if (opties.categorie === "weekdictee" || opties.categorie === "ov01" 
        || opties.categorie === "ov02" || opties.categorie === "ov03"
        || opties.categorie === "ov04" || opties.categorie === "ov05"
        || opties.categorie === "ov06" || opties.categorie === "ov07"
        || opties.categorie === "ov08" || opties.categorie === "ov09"
        || opties.categorie === "ov10") {
      module._seed = this._laatsteSeed;
      return module.genereerBlad(opties, metAntwoorden);
    }

    // Standaard werkbladen (oude klankzuiver): aantalBladen losse werkbladen
    let html = "";
    for (let i = 0; i < opties.aantalBladen; i++) {
      module._seed = (this._laatsteSeed + i * 1000003) & 0xFFFFFFFF;
      html += module.genereerBlad(opties, metAntwoorden);
    }
    return html;
  },

  _laatsteSeed: null
};
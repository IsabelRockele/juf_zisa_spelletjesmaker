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
        lijntype: document.querySelector('input[name="wd-lt"]:checked')?.value || "type3",
        lijnhoogte: document.querySelector("#wd-lijnhoogte button.actief")?.dataset.hoogte || "klein",
        titel: "Dagelijkse kost spelling"
      };
    }

    // === OV01-specifieke opties ===
    let ov01 = null;
    if (cat === "ov01") {
      // Verzamel actieve niveau-vinkjes
      const niveaus = [];
      document.querySelectorAll("#ov01-niveaus input[type='checkbox'][data-niveau]").forEach(cb => {
        if (cb.checked) niveaus.push(cb.dataset.niveau);
      });
      ov01 = {
        niveaus: niveaus.length > 0 ? niveaus : ["basis"],
        zelfdeWoorden: document.querySelector("#ov01-zelfde-woorden")?.checked !== false,
        aantalWoorden: parseInt(document.querySelector("#ov01-aantal-woorden")?.value || "9", 10),
        aantalLijnen: parseInt(document.querySelector("#ov01-aantal-lijnen")?.value || "1", 10),
        lijnhoogte: document.querySelector("#ov01-lijnhoogte button.actief")?.dataset.hoogte || "middel",
        lijntype: document.querySelector("#ov01-lijntype input[name='ov01-lt']:checked")?.value || "type3",
        ondertitel: document.querySelector("#ov01-ondertitel")?.value || ""
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
        plaatjeKern: document.querySelector("#ov05-plaatje-kern")?.checked !== false,
        plaatjeVerdieping: document.querySelector("#ov05-plaatje-verdieping")?.checked !== false,
        aantalWoorden: parseInt(document.querySelector("#ov05-aantal-woorden")?.value || "8", 10),
        lijnhoogte: document.querySelector("#ov05-lijnhoogte button.actief")?.dataset.hoogte || "middel",
        lijntype: document.querySelector("#ov05-lijntype input[name='ov05-lt']:checked")?.value || "type3",
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
        lijnhoogte: document.querySelector("#ov04-lijnhoogte button.actief")?.dataset.hoogte || "klein",
        lijntype: document.querySelector("#ov04-lijntype input[name='ov04-lt']:checked")?.value || "type3",
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
        lijnhoogte: document.querySelector("#ov03-lijnhoogte button.actief")?.dataset.hoogte || "middel",
        lijntype: document.querySelector("#ov03-lijntype input[name='ov03-lt']:checked")?.value || "type3",
        ondertitel: document.querySelector("#ov03-ondertitel")?.value || ""
      };
    }

    // === OV02-specifieke opties (Woord 3x overschrijven) ===
    let ov02 = null;
    if (cat === "ov02") {
      ov02 = {
        metPlaatje: document.querySelector("#ov02-met-plaatje")?.checked !== false,
        aantalWoorden: parseInt(document.querySelector("#ov02-aantal-woorden")?.value || "8", 10),
        lijnhoogte: document.querySelector("#ov02-lijnhoogte button.actief")?.dataset.hoogte || "middel",
        lijntype: document.querySelector("#ov02-lijntype input[name='ov02-lt']:checked")?.value || "type3",
        ondertitel: document.querySelector("#ov02-ondertitel")?.value || ""
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

    // Globale lijntype
    const lijntypeGlobaal = document.querySelector(".lijn-knop.actief")?.dataset.lijn || "vier";

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
      aantalOef,
      aantalBladen,
      bundelNaam,
      weekdictee,
      ov01,
      ov02,
      ov03,
      ov04,
      ov05
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
        || opties.categorie === "ov04" || opties.categorie === "ov05") {
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

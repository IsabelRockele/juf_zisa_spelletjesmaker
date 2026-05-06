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
        zinStijl: document.querySelector("#wd-zinstijl button.actief")?.dataset.stijl || "kleur",
        vrijdagHerhaling: document.querySelector("#wd-vrijdag-herhaling")?.checked || false,
        reflectieAan: document.querySelector("#wd-reflectie")?.checked !== false,
        reflectieText: document.querySelector("#wd-reflectie-tekst")?.value || "Wat vond ik van de dagelijkse spelling deze week?",
        titel: "Dagelijkse kost spelling"
      };
    }

    // === OV01-specifieke opties ===
    let ov01 = null;
    if (cat === "ov01") {
      ov01 = {
        niveau: document.querySelector("#ov01-niveau button.actief")?.dataset.niveau || "basis",
        aantalWoorden: parseInt(document.querySelector("#ov01-aantal-woorden")?.value || "9", 10),
        aantalLijnen: parseInt(document.querySelector("#ov01-aantal-lijnen")?.value || "2", 10),
        lijnhoogte: document.querySelector("#ov01-lijnhoogte button.actief")?.dataset.hoogte || "middel",
        lijntype: document.querySelector("#ov01-lijntype input[name='ov01-lt']:checked")?.value || "type3",
        ondertitel: document.querySelector("#ov01-ondertitel")?.value || ""
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
      ov01
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

    // Weekdictee + OV01: 1 blad per generatie (intern al meerdere pagina's mogelijk)
    if (opties.categorie === "weekdictee" || opties.categorie === "ov01") {
      module._seed = this._laatsteSeed;
      return module.genereerBlad(opties, metAntwoorden);
    }

    // Standaard werkbladen: aantalBladen losse werkbladen genereren
    let html = "";
    for (let i = 0; i < opties.aantalBladen; i++) {
      module._seed = (this._laatsteSeed + i * 1000003) & 0xFFFFFFFF;
      html += module.genereerBlad(opties, metAntwoorden);
    }
    return html;
  },

  _laatsteSeed: null
};

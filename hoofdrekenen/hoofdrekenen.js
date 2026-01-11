import { genereerHoofdrekenenV2 } from '../hoofdrekenen_versie2/hoofdrekenen_v2.generator.js';

/* =========================================================
   HOOFDREKENEN – KEUZE → PREVIEW → BUNDEL
   Afgeleid uit bewerkingen_keuze_versie2.js
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  const btnMaak = document.getElementById('maakRekenBtn');
  const btnToevoegen = document.getElementById('voegRekenToeBtn');
  const melding = document.getElementById('rekenMelding');
  const previewFrame = document.getElementById('previewFrame');

  if (!btnMaak || !btnToevoegen) {
    console.error('Knoppen voor hoofdrekenen niet gevonden');
    return;
  }
  // ================================
  // Compenseren – begeleiding tonen/verbergen
  // ================================
  const compenseerModusWrap = document.getElementById('compenseerModusWrap');

  function updateCompenseerModusZichtbaarheid() {
    if (!compenseerModusWrap) return;

    const stijl =
      document.querySelector('input[name="rekenHulpStijl"]:checked')?.value;

    if (stijl === 'compenseren') {
      compenseerModusWrap.style.display = 'block';
    } else {
      compenseerModusWrap.style.display = 'none';
    }
  }

  // ================================
// Aanvullen – vormkeuze tonen/verbergen
// ================================
const aanvulVormKeuze = document.getElementById('aanvulVormKeuze');

function updateAanvulVormZichtbaarheid() {
  if (!aanvulVormKeuze) return;

  const stijl =
    document.querySelector('input[name="rekenHulpStijl"]:checked')?.value;

  if (stijl === 'aanvullen') {
    aanvulVormKeuze.style.display = 'block';
  } else {
    aanvulVormKeuze.style.display = 'none';
  }
}

  // reageren op wisselen van hulmiddel-stijl
document
  .querySelectorAll('input[name="rekenHulpStijl"]')
  .forEach(radio => {
    radio.addEventListener('change', updateCompenseerModusZichtbaarheid);
    radio.addEventListener('change', updateAanvulVormZichtbaarheid);
  });

// initieel correct zetten bij laden
updateCompenseerModusZichtbaarheid();
updateAanvulVormZichtbaarheid();

  // ================================
// Somtypes tonen/verbergen volgens bewerking
// ================================
function updateSomtypesZichtbaarheid() {
  const rekenType =
    document.querySelector('input[name="rekenType"]:checked')?.value;

  const optellen = document.querySelectorAll('.somtypes-optellen');
const aftrekken = document.querySelectorAll('.somtypes-aftrekken');

if (rekenType === 'optellen') {
  optellen.forEach(el => el.style.display = 'block');
  aftrekken.forEach(el => el.style.display = 'none');
} else if (rekenType === 'aftrekken') {
  optellen.forEach(el => el.style.display = 'none');
  aftrekken.forEach(el => el.style.display = 'block');
} else {
  // beide
  optellen.forEach(el => el.style.display = 'block');
  aftrekken.forEach(el => el.style.display = 'block');
}
}

// reageren op wisselen van bewerking
document
  .querySelectorAll('input[name="rekenType"]')
  .forEach(radio => {
    radio.addEventListener('change', updateSomtypesZichtbaarheid);
  });

// initieel correct zetten bij laden
updateSomtypesZichtbaarheid();

// =====================================
// Soort brug: alleen bij optellen tot 1000
// =====================================
function updateBrugSoortZichtbaarheid() {
  const rekenType =
    document.querySelector('input[name="rekenType"]:checked')?.value;

  const rekenBrug =
    document.getElementById('rekenBrug')?.value;

  const max =
    parseInt(document.getElementById('rekenMaxGetal')?.value, 10);

  const wrap = document.getElementById('brugSoortWrap');
  if (!wrap) return;

  const tonen =
    rekenType === 'optellen' &&
    max === 1000 &&
    rekenBrug !== 'zonder';

  wrap.style.display = tonen ? 'block' : 'none';
}
// reageren op wijzigingen
document
  .querySelectorAll('input[name="rekenType"]')
  .forEach(r =>
    r.addEventListener('change', updateBrugSoortZichtbaarheid)
  );

document
  .getElementById('rekenBrug')
  ?.addEventListener('change', updateBrugSoortZichtbaarheid);

document
  .getElementById('rekenMaxGetal')
  ?.addEventListener('change', updateBrugSoortZichtbaarheid);

// initieel correct zetten
updateBrugSoortZichtbaarheid();

// ================================
// Somtypes filter live updaten
// ================================
document.getElementById('rekenMaxGetal')
  ?.addEventListener('change', updateSomtypesFilter);

document.getElementById('rekenBrug')
  ?.addEventListener('change', updateSomtypesFilter);

document.getElementById('rekenHulpCheckbox')
  ?.addEventListener('change', updateSomtypesFilter);

document.querySelectorAll('input[name="rekenType"]').forEach(radio => {
  radio.addEventListener('change', updateSomtypesFilter);
});

document.querySelectorAll('input[name="rekenHulpStijl"]').forEach(radio => {
  radio.addEventListener('change', updateSomtypesFilter);
});

// ook meteen toepassen bij laden
updateSomtypesFilter();

// ================================
// Oefenvorm (alleen zichtbaar bij tot 100)
// ================================
const oefenvormWrap = document.getElementById('oefenvormWrap');

function updateOefenvormZichtbaarheid() {
  if (!oefenvormWrap) return;
  const max = parseInt(document.getElementById('rekenMaxGetal')?.value || '20', 10);
  oefenvormWrap.style.display = (max === 100) ? 'block' : 'none';

  // als je wegschakelt van 100: terug naar klassiek zetten
  if (max !== 100) {
    const klassiek = document.querySelector('input[name="rekenOefenvorm"][value="klassiek"]');
    if (klassiek) klassiek.checked = true;
  }

  // ================================
// Brug herkennen → somtypes verbergen
// ================================
const brugUitleg = document.getElementById('brugHerkennenUitleg');
const somtypesBlok = document.querySelector('details'); // dit is het hele "Somtypes"-blok

const gekozenVorm =
  document.querySelector('input[name="rekenOefenvorm"]:checked')?.value;

const isBrugHerkennen = (max === 100 && gekozenVorm === 'brugHerkennen100');

if (somtypesBlok) {
  somtypesBlok.style.display = isBrugHerkennen ? 'none' : 'block';
}

if (brugUitleg) {
  brugUitleg.style.display = isBrugHerkennen ? 'block' : 'none';
}

}

document.getElementById('rekenMaxGetal')?.addEventListener('change', updateOefenvormZichtbaarheid);
document
  .querySelectorAll('input[name="rekenOefenvorm"]')
  .forEach(radio => {
    radio.addEventListener('change', updateOefenvormZichtbaarheid);
  });

updateOefenvormZichtbaarheid();

// ================================
// Somtypes filteren (UI) — tot 1000
// ================================
function setSomtypeVisibilityForGroup(max, rekenType, rekenBrug, hulpAan, hulpStijl) {
  const groep = document.querySelector(`[data-somgroep="${max}"]`);
  if (!groep) return;

  const optelWrap = groep.querySelector('.somtypes-optellen');
  if (!optelWrap) return;

  // Alleen optellen filteren (nu). Aftrekken volgt later.
  // Alleen relevant bij tot 1000
if (max !== 1000) return;

// ================================
// OPTELLEN (bestond al)
// ================================
if (rekenType === 'optellen') {

  if (rekenBrug !== 'met') return;

  let allowed = [
  'T+T',
  'TE+TE',
  'HT+T',
  'HT+TE',   // ✅ HIER hoort hij
  'TE+T',
  'HTE+HTE',
  'HTE+HT'
];


  if (hulpAan && hulpStijl === 'compenseren') {
    allowed = ['TE+TE', 'HT+T', 'HT+TE', 'TE+T', 'HTE+HT', 'HTE+HTE'];
  }

  optelWrap.querySelectorAll('input[name="somType"]').forEach(cb => {
    const label = cb.closest('label');
    if (!label) return;

    const ok = allowed.includes(cb.value);
    label.style.display = ok ? '' : 'none';
    if (!ok) cb.checked = false;
  });

  return;
}

// ================================
// AFTREKKEN — NIEUW
// ================================
if (rekenType === 'aftrekken') {

  const aftrekWrap = groep.querySelector('.somtypes-aftrekken');
  if (!aftrekWrap) return;

  let allowed = [];

  // 🔹 ZONDER brug
  if (rekenBrug === 'zonder') {
    allowed = [
      'T-T',
      'H-H',
      'HT-T',
      'HT-HT',
      'HTE-H',
      'HTE-HT',
      'HTE-HTE'
    ];
  }

  // 🔹 AFTREKKEN — MET brug OF compenseren
if (rekenBrug === 'met' || (hulpAan && hulpStijl === 'compenseren')) {

  allowed = [
    'HT-T',
    'HT-HT',
    'HT-TE',
    'HTE-HT',
    'HTE-HTE',
    'T-TE',
    'H-T',
    'H-TE'
  ];

  // 🔹 COMpenseren (beperkte set)
  if (hulpAan && hulpStijl === 'compenseren') {
    allowed = [
      'HT-HT',
      'HT-TE',
      'HTE-HT',
      'HTE-HTE'
    ];
  }
  }
  
// 🔹 AFTREKKEN — AANVULLEN (beperkte set)
if (hulpAan && hulpStijl === 'aanvullen') {
  allowed = [
    'HT-HT',
    'HT-TE',
    'HTE-HTE'
  ];
}

  aftrekWrap.querySelectorAll('input[name="somType"]').forEach(cb => {
    const label = cb.closest('label');
    if (!label) return;

    const ok = allowed.includes(cb.value);
    label.style.display = ok ? '' : 'none';
    if (!ok) cb.checked = false;
  });
}


  // Alleen relevant bij tot 1000 én wanneer er “met brug” gekozen is.
  // (Bij 'beide' laten we voorlopig alles staan, anders wordt het verwarrend.)
  if (max !== 1000) return;
  if (rekenBrug !== 'met') return;


  // Optellen met brug + compenseren → beperk lijst
  if (hulpAan && hulpStijl === 'compenseren') {
    allowed = ['TE+TE', 'HT+T', 'TE+T', 'HTE+HT', 'HTE+HTE'];
  }

  // Toon/verberg labels per checkbox + vink verborgen types uit
  optelWrap.querySelectorAll('input[name="somType"]').forEach(cb => {
    const label = cb.closest('label');
    if (!label) return;

    const ok = allowed.includes(cb.value);

    label.style.display = ok ? '' : 'none';
    if (!ok) cb.checked = false;
  });
}

function updateSomtypesFilter() {
  const max = parseInt(document.getElementById('rekenMaxGetal')?.value || '20', 10);
  const rekenType = document.querySelector('input[name="rekenType"]:checked')?.value || 'optellen';
  const rekenBrug = document.getElementById('rekenBrug')?.value || 'beide';

  const hulpAan = !!document.getElementById('rekenHulpCheckbox')?.checked;
  const hulpStijl = document.querySelector('input[name="rekenHulpStijl"]:checked')?.value || 'splitsbenen';

  setSomtypeVisibilityForGroup(max, rekenType, rekenBrug, hulpAan, hulpStijl);
}


 function verzamelConfiguratie() {

  // ✅ 1. Eerst: actieve somtypes bepalen
  const max = parseInt(document.getElementById('rekenMaxGetal').value, 10);
  const rekenType =
  document.querySelector('input[name="rekenType"]:checked')?.value || 'optellen';

    // ================================
  // NIEUW — Oefenvorm bepalen
  // ================================
  const oefenvorm =
    document.querySelector('input[name="rekenOefenvorm"]:checked')?.value
    || 'klassiek';

  // ================================
  // Brug herkennen (tot 100) — VROEGE EXIT
  // ================================
  if (max === 100 && oefenvorm === 'brugHerkennen100') {

    const cfg = {
      segmentId: 'rekenen_' + Date.now(),
      hoofdBewerking: 'rekenen',

      variant: 'brugHerkennen100',   // 🔑 belangrijk
      rekenMaxGetal: 100,
      rekenType,

      numOefeningen:
        parseInt(document.getElementById('numOefeningen_reken').value, 10) || 20,

      opdracht:
        document.getElementById('opdracht_reken').value
        || 'Kleur het lampje als de som een brugoefening is.'
    };

    // 🔒 GEEN somTypes
    // 🔒 GEEN rekenBrug
    // 🔒 GEEN hulpmiddelen
    // 🔒 GEEN bestaande generatoren

      cfg._oefeningen = null;

    return cfg;
  }


  const groep = document.querySelector(`[data-somgroep="${max}"]`);

  const somTypes = groep
    ? [...groep.querySelectorAll('input[name="somType"]:checked')].map(cb => cb.value)
    : [];

    // 🔁 AFTREKKEN: UI-type TE-TE omzetten naar generator-type TE+TE
const rekenBrug = document.getElementById('rekenBrug').value;

// 🔁 somTypes alleen herschrijven bij OPTELLEN
let somTypesGen = somTypes;

if (rekenType === 'optellen') {
  somTypesGen = somTypes.map(t => {
    if (t === 'TE-TE') return 'TE+TE';
    if (t === 'TE-T')  return 'TE+T';
    if (t === 'HT-T')  return 'HT+T';
    return t;
  });
}



// ✅ AFTREKKEN: somTypes exact doorgeven (geen omzetting)
let somTypesGefilterd = somTypes;


  // ✅ 2. Daarna pas: cfg-object opbouwen
  const cfg = {
    segmentId: 'rekenen_' + Date.now(),
    hoofdBewerking: 'rekenen',

    numOefeningen: parseInt(document.getElementById('numOefeningen_reken').value, 10) || 20,
    rekenMaxGetal: max,

   rekenType,
    rekenBrug: document.getElementById('rekenBrug').value,

    // ✅ DIT is wat eerder ontbrak
  somTypes: (rekenType === 'optellen')
  ? somTypesGen
  : somTypesGefilterd,



    opdracht: document.getElementById('opdracht_reken').value || ''
  };

  // === Brugsoorten (alleen relevant bij tot 1000)
if (cfg.rekenMaxGetal === 1000 && cfg.rekenBrug === 'met') {
  cfg.brugSoorten = {
    tiental: document.getElementById('brugTiental')?.checked || false,
    honderdtal: document.getElementById('brugHonderdtal')?.checked || false,
    meervoudig: document.getElementById('brugMeervoudig')?.checked || false
  };
}

// 🔒 Meervoudige brug kan alleen met honderdtal
if (cfg.brugSoorten?.meervoudig && !cfg.brugSoorten?.honderdtal) {
  cfg.brugSoorten.honderdtal = true;
}

// 🔒 Meervoudige brug impliceert altijd: met brug
if (cfg.brugSoorten?.meervoudig) {
  cfg.rekenBrug = 'met';
}

// 👉 extra flag voor generatoren
cfg.meervoudigeBrug = cfg.brugSoorten?.meervoudig || false;


// ✅ BrugSoort bepalen (enkelvoud) op basis van keuzes
if (cfg.rekenMaxGetal === 1000 && cfg.rekenBrug === 'met') {
  if (cfg.brugSoorten?.honderdtal) {
    cfg.brugSoort = 'honderdtal';
  } else if (cfg.brugSoorten?.tiental) {
    cfg.brugSoort = 'tiental';
  }
}

  // ✅ 3. Hulpmiddelen (ongewijzigd)
  const hulpAan = document.getElementById('rekenHulpCheckbox').checked;

if (hulpAan) {
  cfg.rekenHulp = {
    inschakelen: true,

    // STRATEGIE
    stijl: document.querySelector('input[name="rekenHulpStijl"]:checked')?.value || 'splitsbenen',

    // 👇 NIEUW — ALLEEN DOORGEVEN
    vormAanvullen:
      document.querySelector('input[name="aanvulVorm"]:checked')?.value
      || 'schema',

    schrijflijnen: document.getElementById('rekenHulpSchrijflijnen').checked,

    splitsPlaatsAftrekken:
      document.querySelector('input[name="splitsPlaatsAftrekken"]:checked')?.value
      || 'onderAftrektal',

    // bestaande (laat staan)
    actief: document.querySelector('input[name="rekenHulpStijl"]:checked')?.value === 'compenseren',
    voorbeeld: document.getElementById('rekenHulpVoorbeeld')?.checked || false,
    tekens: document.getElementById('rekenHulpTekens')?.checked || false,
    compenseerModus:
      document.querySelector('input[name="compenseerModus"]:checked')?.value || 'begeleid',
  };
}


  return cfg;
}


  function renderPreview(append = false) {
    const cfg = verzamelConfiguratie();



    let bundel = JSON.parse(localStorage.getItem('werkbladBundel') || '[]');

    if (!append) {
      // preview vervangen
      bundel = bundel.filter(seg => seg.settings?.hoofdBewerking !== 'rekenen');
    }

    bundel.push({ settings: cfg });

    localStorage.setItem('werkbladBundel', JSON.stringify(bundel));

    if (previewFrame) {
      previewFrame.src = previewFrame.src;
    }

    melding.textContent = '';
  }

  // 👁️ Maak preview (vervangt vorige hoofdreken-opdrachten)
  btnMaak.addEventListener('click', () => {
  renderPreview(true);
});


  // ➕ Voeg toe aan bundel (blijft staan, meerdere opdrachten mogelijk)
  btnToevoegen.addEventListener('click', () => {
    renderPreview(true);
  });

});

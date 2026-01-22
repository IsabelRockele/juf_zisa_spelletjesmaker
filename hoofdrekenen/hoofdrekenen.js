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

// ==================================================
// Brugsoort HTE-HTE (aftrekken tot 1000) — zichtbaarheid
// ==================================================
function updateBrugSoortHTEZichtbaarheid() {
  // max-getal
  const max = parseInt(
    document.getElementById('rekenMaxGetal')?.value || '0',
    10
  );

  // bewerking
  const rekenType =
    document.querySelector('input[name="rekenType"]:checked')?.value;

  // brug aan/uit
  const rekenBrug =
    document.getElementById('rekenBrug')?.value;

  // is HTE-HTE aangevinkt?
  const hteChecked =
    document.querySelector(
      '[data-somgroep="1000"] input[name="somType"][value="HTE-HTE"]'
    )?.checked;

  // ons HTML-blok
  const wrap = document.getElementById('brugSoortHTEWrap');
  if (!wrap) return;

  // voorwaarden
  const tonen =
    max === 1000 &&
    rekenType === 'aftrekken' &&
    rekenBrug === 'met' &&
    hteChecked === true;

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

// --------------------------------------------------
// Brugsoort HTE-HTE — events
// --------------------------------------------------
document
  .getElementById('rekenMaxGetal')
  ?.addEventListener('change', updateBrugSoortHTEZichtbaarheid);

document
  .getElementById('rekenBrug')
  ?.addEventListener('change', updateBrugSoortHTEZichtbaarheid);

document
  .querySelectorAll('input[name="rekenType"]')
  .forEach(r =>
    r.addEventListener('change', updateBrugSoortHTEZichtbaarheid)
  );

document
  .querySelectorAll('[data-somgroep="1000"] input[name="somType"]')
  .forEach(cb =>
    cb.addEventListener('change', updateBrugSoortHTEZichtbaarheid)
  );

// initieel bij laden
updateBrugSoortHTEZichtbaarheid();

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

  // ================================
// TOT 100 — SOMTYPES FILTEREN (UI)
// ================================
if (max === 100) {

  const groep = document.querySelector('[data-somgroep="100"]');
  if (!groep) return;

  const optelWrap = groep.querySelector('.somtypes-optellen');
  const aftrekWrap = groep.querySelector('.somtypes-aftrekken');

  // --- OPTELLEN ---
  if (rekenType === 'optellen' || rekenType === 'beide') {
    optelWrap.style.display = 'block';

    let allowed = [];

    if (rekenBrug === 'zonder') {
      allowed = ['E+E', 'T+T', 'T+E', 'TE+T', 'TE+TE'];
    }

    if (rekenBrug === 'met') {
      allowed = ['E+E', 'TE+E', 'TE+TE'];
    }

    if (rekenBrug === 'beide') {
      allowed = ['E+E', 'T+T', 'T+E', 'TE+T', 'TE+E', 'TE+TE'];
    }

    optelWrap.querySelectorAll('input[name="somType"]').forEach(cb => {
      const label = cb.closest('label');
      const ok = allowed.includes(cb.value);
      label.style.display = ok ? '' : 'none';
      if (!ok) cb.checked = false;
    });
  } else {
    optelWrap.style.display = 'none';
  }

  // --- AFTREKKEN ---
  if (rekenType === 'aftrekken' || rekenType === 'beide') {
    aftrekWrap.style.display = 'block';

    let allowed = [];

    if (rekenBrug === 'zonder') {
      allowed = ['E-E', 'T-T', 'TE-E', 'TE-TE'];
    }

    if (rekenBrug === 'met') {
      allowed = ['T-E', 'T-TE', 'TE-E', 'TE-TE'];
    }

    if (rekenBrug === 'beide') {
      allowed = ['E-E', 'T-T', 'T-E', 'T-TE', 'TE-E', 'TE-TE'];
    }

    aftrekWrap.querySelectorAll('input[name="somType"]').forEach(cb => {
      const label = cb.closest('label');
      const ok = allowed.includes(cb.value);
      label.style.display = ok ? '' : 'none';
      if (!ok) cb.checked = false;
    });
  } else {
    aftrekWrap.style.display = 'none';
  }

  return;
}

  // Alleen optellen filteren (nu). Aftrekken volgt later.
  // Alleen relevant bij tot 1000
if (max !== 1000) return;

// ================================
// OPTELLEN (bestond al)
// ================================
if (rekenType === 'optellen') {

  if (rekenBrug !== 'met' && rekenBrug !== 'beide') return;


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

    // 🔹 BEIDE toegestaan (mix van zonder + met brug)
  if (rekenBrug === 'beide') {
    allowed = [
      // zonder brug
      'T-T',
      'H-H',
      'HT-T',
      'HT-HT',
      'HTE-H',
      'HTE-HT',
      'HTE-HTE',

      // met brug (en varianten die jij toelaat)
      'HT-TE',
      'T-TE',
      'H-T',
      'H-TE'
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
// if (hulpAan && hulpStijl === 'aanvullen') {
//   allowed = [
//     'HT-HT',
//     'HT-TE',
//     'HTE-HTE'
//   ];
// }


  aftrekWrap.querySelectorAll('input[name="somType"]').forEach(cb => {
    const label = cb.closest('label');
    if (!label) return;

    const ok = allowed.includes(cb.value);
    label.style.display = ok ? '' : 'none';
    if (!ok) cb.checked = false;
  });
}



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

  // -----------------------------------------------
// Brugsoort specifiek voor HTE-HTE (aftrekken)
// -----------------------------------------------
if (
  cfg.rekenType === 'aftrekken' &&
  cfg.rekenMaxGetal === 1000 &&
  cfg.rekenBrug === 'met' &&
  Array.isArray(cfg.somTypes) &&
  cfg.somTypes.includes('HTE-HTE')
) {
  cfg.brugSoortHTE =
    document.querySelector('input[name="brugSoortHTE"]:checked')?.value
    || 'eenheden';
} else {
  delete cfg.brugSoortHTE;
}

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

  // 👁️ Maak preview (brug herkennen krijgt eigen flow)
btnMaak.addEventListener('click', () => {

  const max =
    parseInt(document.getElementById('rekenMaxGetal')?.value || '0', 10);

  const oefenvorm =
    document.querySelector('input[name="rekenOefenvorm"]:checked')?.value;

  // 🔑 OPTIE B — Brug herkennen (eigen preview)
  if (max === 100 && oefenvorm === 'brugHerkennen100') {

    const cfg = verzamelBrugHerkennenConfiguratie();
    // 👉 OEFENINGEN GENEREREN (nieuw)
if (cfg.rekenType === 'beide') {
  const half = Math.ceil(cfg.numOefeningen / 2);

  const plus = genereerBrugHerkennenTot100('plus', half);
  const min  = genereerBrugHerkennenTot100('min', cfg.numOefeningen - half);

  cfg._oefeningen = [...plus, ...min].map(oef => ({
    getal1: oef.a,
    getal2: oef.b,
    operator: oef.op,
    heeftBrug: oef.heeftBrug
  }));
} else {
  const type = (cfg.rekenType === 'aftrekken') ? 'min' : 'plus';

  cfg._oefeningen = genereerBrugHerkennenTot100(type, cfg.numOefeningen)
    .map(oef => ({
      getal1: oef.a,
      getal2: oef.b,
      operator: oef.op,
      heeftBrug: oef.heeftBrug
    }));
}


    let bundel = JSON.parse(localStorage.getItem('werkbladBundel') || '[]');


    bundel.push({ settings: cfg });

    localStorage.setItem('werkbladBundel', JSON.stringify(bundel));

    if (previewFrame) {
      previewFrame.src = previewFrame.src;
    }

    melding.textContent = '';
    return;
  }

  // ✅ ALLES ANDERS: bestaand gedrag
  renderPreview(true);
});



  // ➕ Voeg toe aan bundel
btnToevoegen.addEventListener('click', () => {

  let bundel = JSON.parse(localStorage.getItem('werkbladBundel') || '[]');
  if (!bundel.length) return;

  const laatste = bundel[bundel.length - 1];
  const cfg = laatste.settings;

  // ==============================
  // OPTIE B — Brug herkennen
  // ==============================
  if (cfg?.variant === 'brugHerkennen100') {

    const extra =
      parseInt(document.getElementById('numOefeningen_reken')?.value, 10) || 0;

    if (extra <= 0) return;

    let nieuw = [];

    if (cfg.rekenType === 'beide') {
      const half = Math.ceil(extra / 2);
      const plus = genereerBrugHerkennenTot100('plus', half);
      const min  = genereerBrugHerkennenTot100('min', extra - half);
      nieuw = [...plus, ...min];
    } else {
      const type = (cfg.rekenType === 'aftrekken') ? 'min' : 'plus';
      nieuw = genereerBrugHerkennenTot100(type, extra);
    }

    cfg._oefeningen = [
      ...(cfg._oefeningen || []),
      ...nieuw.map(oef => ({
        getal1: oef.a,
        getal2: oef.b,
        operator: oef.op,
        heeftBrug: oef.heeftBrug
      }))
    ];

    // bundel opslaan
    bundel[bundel.length - 1].settings = cfg;
    localStorage.setItem('werkbladBundel', JSON.stringify(bundel));

    // preview herladen (ZONDER renderPreview)
    if (previewFrame) {
      previewFrame.src = previewFrame.src;
    }

    return;
  }

  // ==============================
  // ALLES ANDERS: bestaand gedrag
  // ==============================
  renderPreview(true);
});



  // ===================================================
// OPTIE B — Brug herkennen: eigen configuratie
// ===================================================
function verzamelBrugHerkennenConfiguratie() {

  const rekenType =
    document.querySelector('input[name="rekenType"]:checked')?.value
    || 'optellen';

  const aantal =
    parseInt(document.getElementById('numOefeningen_reken')?.value, 10)
    || 20;

  return {
    segmentId: 'brugherkennen_' + Date.now(),
    hoofdBewerking: 'rekenen',

    variant: 'brugHerkennen100',

    rekenMaxGetal: 100,
    rekenType,

    numOefeningen: aantal,

    opdracht:
      document.getElementById('opdracht_reken')?.value
      || 'Kleur het lampje als de som een brugoefening is.',

    _oefeningen: []
  };
}

// ===================================================
// Brug herkennen — oefeninggenerator (lokale kopie)
// ===================================================
function genereerBrugHerkennenTot100(type, aantal) {

  const oefeningen = [];

  while (oefeningen.length < aantal) {

    let a, b, heeftBrug;

    if (type === 'plus') {
      a = Math.floor(Math.random() * 90) + 10;
      b = Math.floor(Math.random() * 90) + 1;
      heeftBrug = ((a % 10) + (b % 10)) >= 10;
    } else {
      a = Math.floor(Math.random() * 90) + 10;
      b = Math.floor(Math.random() * (a % 10));
      heeftBrug = (b % 10) > (a % 10);
    }

    oefeningen.push({
      a,
      b,
      op: type === 'plus' ? '+' : '-',
      heeftBrug
    });
  }

  return oefeningen;
}

});
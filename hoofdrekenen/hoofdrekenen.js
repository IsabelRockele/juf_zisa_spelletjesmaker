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

  // reageren op wisselen van hulmiddel-stijl
  document
    .querySelectorAll('input[name="rekenHulpStijl"]')
    .forEach(radio => {
      radio.addEventListener('change', updateCompenseerModusZichtbaarheid);
    });

  // initieel correct zetten bij laden
  updateCompenseerModusZichtbaarheid();
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


 function verzamelConfiguratie() {

  // ✅ 1. Eerst: actieve somtypes bepalen
  const max = parseInt(document.getElementById('rekenMaxGetal').value, 10);
  const rekenType =
  document.querySelector('input[name="rekenType"]:checked')?.value || 'optellen';

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

  // ✅ 3. Hulpmiddelen (ongewijzigd)
  const hulpAan = document.getElementById('rekenHulpCheckbox').checked;

 if (hulpAan) {
  cfg.rekenHulp = {
    inschakelen: true,
    stijl: document.querySelector('input[name="rekenHulpStijl"]:checked')?.value || 'splitsbenen',
    schrijflijnen: document.getElementById('rekenHulpSchrijflijnen').checked,
    splitsPlaatsAftrekken:
      document.querySelector('input[name="splitsPlaatsAftrekken"]:checked')?.value
      || 'onderAftrektal',

    // 👇 TOEVOEGEN (DIT IS DE BELANGRIJKE REGEL)
    actief: document.querySelector('input[name="rekenHulpStijl"]:checked')?.value === 'compenseren',

    // bestaande opties
    voorbeeld: document.getElementById('rekenHulpVoorbeeld')?.checked || false,
    tekens: document.getElementById('rekenHulpTekens')?.checked || false,
    compenseerModus: document.querySelector('input[name="compenseerModus"]:checked')?.value || 'begeleid',
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

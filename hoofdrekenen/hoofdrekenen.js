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

 function verzamelConfiguratie() {

  // ✅ 1. Eerst: actieve somtypes bepalen
  const max = parseInt(document.getElementById('rekenMaxGetal').value, 10);
  const groep = document.querySelector(`[data-somgroep="${max}"]`);

  const somTypes = groep
    ? [...groep.querySelectorAll('input[name="somType"]:checked')].map(cb => cb.value)
    : [];

// ✅ Aftrekken zonder brug: T−E en T−TE zijn onmogelijk (altijd brug)
const rekenType = document.querySelector('input[name="rekenType"]:checked')?.value || 'optellen';
const rekenBrug = document.getElementById('rekenBrug').value;

let somTypesGefilterd = somTypes;

if (rekenType === 'aftrekken' && rekenBrug === 'zonder') {
  somTypesGefilterd = somTypes.filter(t => t !== 'T+E' && t !== 'T+TE');
}

  // ✅ 2. Daarna pas: cfg-object opbouwen
  const cfg = {
    segmentId: 'rekenen_' + Date.now(),
    hoofdBewerking: 'rekenen',

    numOefeningen: parseInt(document.getElementById('numOefeningen_reken').value, 10) || 20,
    rekenMaxGetal: max,

    rekenType: document.querySelector('input[name="rekenType"]:checked')?.value || 'optellen',
    rekenBrug: document.getElementById('rekenBrug').value,

    // ✅ DIT is wat eerder ontbrak
    somTypes: somTypesGefilterd,


    opdracht: document.getElementById('opdracht_reken').value || ''
  };

  // ✅ 3. Hulpmiddelen (ongewijzigd)
  const hulpAan = document.getElementById('rekenHulpCheckbox').checked;

  if (hulpAan) {
    cfg.rekenHulp = {
      inschakelen: true,
      stijl: document.querySelector('input[name="rekenHulpStijl"]:checked')?.value || 'splitsbenen',
      schrijflijnen: document.getElementById('rekenHulpSchrijflijnen').checked,
      splitsPlaatsAftrekken:
        document.querySelector('input[name="splitsPlaatsAftrekken"]:checked')?.value
        || 'onderAftrektal'
    };
  }

  return cfg;
}


  function renderPreview(append = false) {
    const cfg = verzamelConfiguratie();

    if (!cfg.somTypes.length) {
      melding.textContent = 'Kies minstens één somtype.';
      return;
    }

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
    renderPreview(false);
  });

  // ➕ Voeg toe aan bundel (blijft staan, meerdere opdrachten mogelijk)
  btnToevoegen.addEventListener('click', () => {
    renderPreview(true);
  });

});

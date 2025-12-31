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
    const cfg = {
      segmentId: 'rekenen_' + Date.now(),
      hoofdBewerking: 'rekenen',

      numOefeningen: parseInt(document.getElementById('numOefeningen_reken').value, 10) || 20,
      rekenMaxGetal: parseInt(document.getElementById('rekenMaxGetal').value, 10),

      rekenType: document.querySelector('input[name="rekenType"]:checked')?.value || 'optellen',
      rekenBrug: document.getElementById('rekenBrug').value,

      somTypes: [...document.querySelectorAll('input[name="somType"]:checked')]
        .map(cb => cb.value),

      opdracht: document.getElementById('opdracht_reken').value || ''
    };

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

// rekenen.js – keuze voor bewerkingen (optellen / aftrekken)

document.addEventListener('DOMContentLoaded', () => {
  // ====== HULPFUNCTIES VOOR BUNDEL (zoals in splitsen.js) ======
  function getBundel() {
    try {
      return JSON.parse(localStorage.getItem('werkbladBundel') || '[]') || [];
    } catch (e) {
      console.error('Fout bij lezen bundel:', e);
      return [];
    }
  }

  function bundelPush(entry) {
    const bundel = getBundel();
    bundel.push(entry);
    localStorage.setItem('werkbladBundel', JSON.stringify(bundel));
    alert('Toegevoegd aan bundel!');
  }

  // Uniek segment-id (zoals in bewerkingen_keuze_versie3.js)
  function nieuwSegmentId() {
    return 'seg_' + Math.random().toString(36).slice(2, 10);
  }

  // ====== BEWERKINGEN ======
  const maakRekenBtn    = document.getElementById('maakRekenBtn');
  const voegRekenToeBtn = document.getElementById('voegRekenToeBtn');
  const rekenMelding    = document.getElementById('rekenMelding');
  const rekenBrugSelect = document.getElementById('rekenBrug');

  // hulp-detail tonen
  const rekenHulpCheckbox = document.getElementById('rekenHulpCheckbox');
  const rekenHulpDetail   = document.getElementById('rekenHulpDetail');
  const aftrekkenHint     = document.getElementById('aftrekkenHint');
  const optellenHint      = document.getElementById('optellenHint');

  function updateHulpWeergave() {
    if (!rekenBrugSelect || !rekenHulpCheckbox || !rekenHulpDetail) return;

    const type = (document.querySelector('input[name="rekenType"]:checked') || {}).value || 'optellen';
    const brug = rekenBrugSelect.value;
    const hulpMogelijk = brug !== 'zonder' && rekenHulpCheckbox.checked;
    rekenHulpDetail.style.display = hulpMogelijk ? '' : 'none';

    const hulpStijl = (document.querySelector('input[name="hulpStijl"]:checked') || {}).value || 'splitsbenen';
    const compBox   = document.getElementById('compenseerOpties');
    if (compBox) {
      compBox.style.display = (hulpMogelijk && hulpStijl === 'compenseren') ? '' : 'none';
    }

    if (hulpMogelijk) {
      if (type === 'aftrekken') {
        if (aftrekkenHint) aftrekkenHint.style.display = '';
        if (optellenHint)  optellenHint.style.display  = 'none';
      } else if (type === 'optellen') {
        if (aftrekkenHint) aftrekkenHint.style.display = 'none';
        if (optellenHint)  optellenHint.style.display  = '';
      } else {
        if (aftrekkenHint) aftrekkenHint.style.display = '';
        if (optellenHint)  optellenHint.style.display  = '';
      }
    }
  }

  if (rekenHulpCheckbox) rekenHulpCheckbox.addEventListener('change', updateHulpWeergave);
  if (rekenBrugSelect)   rekenBrugSelect.addEventListener('change', updateHulpWeergave);
  document.querySelectorAll('input[name="rekenType"]').forEach(r =>
    r.addEventListener('change', updateHulpWeergave)
  );
  document.querySelectorAll('input[name="hulpStijl"]').forEach(r =>
    r.addEventListener('change', updateHulpWeergave)
  );
  updateHulpWeergave();

  // Toon het juiste opdrachtveld volgens gekozen bewerking
  function updateOpdrachtVeld() {
    const type  = (document.querySelector('input[name="rekenType"]:checked') || {}).value;
    const opt   = document.getElementById('opdracht_optellen');
    const aft   = document.getElementById('opdracht_aftrekken');
    const beide = document.getElementById('opdracht_beide');
    if (!opt || !aft || !beide) return;

    opt.style.display   = (type === 'optellen') ? 'block' : 'none';
    aft.style.display   = (type === 'aftrekken') ? 'block' : 'none';
    beide.style.display = (type === 'beide') ? 'block' : 'none';
  }

  document.querySelectorAll('input[name="rekenType"]').forEach(r =>
    r.addEventListener('change', updateOpdrachtVeld)
  );
  updateOpdrachtVeld();

  // Bouw settings voor bewerkingen (rechtstreeks uit uw oude code)
  function bouwRekenSettings(somTypes) {
    const hulpStijl = (document.querySelector('input[name="hulpStijl"]:checked') || {}).value || 'splitsbenen';

    const rekenHulp = {
      inschakelen: !!(
        rekenHulpCheckbox &&
        rekenHulpCheckbox.checked &&
        rekenBrugSelect &&
        rekenBrugSelect.value !== 'zonder'
      ),
      schrijflijnen: !!(
        document.getElementById('rekenHulpSchrijflijnen') &&
        document.getElementById('rekenHulpSchrijflijnen').checked
      ),
      splitsPlaatsAftrekken: (
        document.querySelector('input[name="splitsPlaatsAftrekken"]:checked')
          ? document.querySelector('input[name="splitsPlaatsAftrekken"]:checked').value
          : 'onderAftrektal'
      ),
      stijl: hulpStijl,
      compSigns: !!(
        document.getElementById('compSigns') &&
        document.getElementById('compSigns').checked
      ),
      voorbeeld: !!(
        document.getElementById('rekenVoorbeeld') &&
        document.getElementById('rekenVoorbeeld').checked
      )
    };

    return {
      segmentId: nieuwSegmentId(),
      hoofdBewerking: 'rekenen',
      numOefeningen: Math.max(
        1,
        parseInt((document.getElementById('numOefeningen_reken') || { value: 20 }).value, 10) || 20
      ),
      rekenMaxGetal: parseInt(
        (document.getElementById('rekenMaxGetal') || { value: 100 }).value,
        10
      ),
      rekenType: (document.querySelector('input[name="rekenType"]:checked') || { value: 'optellen' }).value,
      somTypes,
      rekenBrug: rekenBrugSelect ? rekenBrugSelect.value : 'beide',
      rekenHulp,
      opdracht: (() => {
        const type = (document.querySelector('input[name="rekenType"]:checked') || {}).value;
        const veldId =
          (type === 'aftrekken') ? 'opdracht_aftrekken'
          : (type === 'beide')   ? 'opdracht_beide'
          : 'opdracht_optellen';
        const vrij = (document.getElementById(veldId) || {}).value?.trim();

        if (vrij) return vrij;
        if (rekenBrugSelect?.value === 'met')    return 'Los de sommen op met brug.';
        if (rekenBrugSelect?.value === 'zonder') return 'Los de sommen op zonder brug.';
        return 'Los de sommen op.';
      })()
    };
  }

  // “Maak werkblad”
  if (maakRekenBtn) {
    maakRekenBtn.addEventListener('click', () => {
      if (rekenMelding) rekenMelding.textContent = '';

      const somTypes = Array.from(
        document.querySelectorAll('input[name="somType"]:checked')
      ).map(cb => cb.value);

      if (!somTypes.length) {
        if (rekenMelding) rekenMelding.textContent = 'Kies minstens één type som!';
        return;
      }

      const settings = bouwRekenSettings(somTypes);
      localStorage.setItem('werkbladSettings', JSON.stringify(settings));

      // Nieuw: naar het algemene werkblad
      window.location.href = "../werkblad.html";
    });
  }

  // “Voeg toe aan bundel”
  if (voegRekenToeBtn) {
    voegRekenToeBtn.addEventListener('click', () => {
      if (rekenMelding) rekenMelding.textContent = '';

      const somTypes = Array.from(
        document.querySelectorAll('input[name="somType"]:checked')
      ).map(cb => cb.value);

      if (!somTypes.length) {
        if (rekenMelding) rekenMelding.textContent = 'Kies minstens één type som!';
        return;
      }

      const settings = bouwRekenSettings(somTypes);
      bundelPush({
        titel: 'Bewerkingen',
        subtitle:
          `${settings.rekenType} • tot ${settings.rekenMaxGetal} ` +
          `• types: ${somTypes.join(', ')} • aant.: ${settings.numOefeningen}`,
        settings
      });
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // ===== Tafels opties opbouwen =====
  const selectAllTafelsCheckbox = document.getElementById('selectAllTafels');
  const tafelKeuzeDiv           = document.getElementById('tafelKeuze');
  if (tafelKeuzeDiv) {
    for (let i = 1; i <= 12; i++) {
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'tafelNummer';
      checkbox.value = i;
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(` ${i}`));
      tafelKeuzeDiv.appendChild(label);
    }
  }
  if (selectAllTafelsCheckbox) {
    selectAllTafelsCheckbox.checked = false;
    const tafelCheckboxes = () => document.querySelectorAll('input[name="tafelNummer"]');
    selectAllTafelsCheckbox.addEventListener('change', (e) => {
      tafelCheckboxes().forEach(cb => cb.checked = e.target.checked);
    });
  }

  // ====== SPLITSEN ======
  const maakSplitsBtn             = document.getElementById('maakSplitsBtn');
  const voegSplitsToeBtn          = document.getElementById('voegSplitsToeBtn');
  const groteSplitshuizenCheckbox = document.getElementById('groteSplitshuizenCheckbox');
  const splitsMelding             = document.getElementById('splitsMelding');

  if (maakSplitsBtn) {
  maakSplitsBtn.addEventListener('click', () => {
    if (splitsMelding) splitsMelding.textContent = '';

    // gebruik nieuwe fijnmazige leesfunctie
    const fijn = leesSplitsFijnVanUI();
    if (!fijn || !(fijn.tot5 || fijn.van6 || fijn.van7 || fijn.van8 || fijn.van9 || fijn.van10 || fijn.van10tot20)) {
      if (splitsMelding) splitsMelding.textContent = "Vink minstens één splits-optie aan.";
      return;
    }

    // geef [] door want gekozenGetallen gebruiken we niet meer
    let settings = bouwSplitsSettings([]);
    localStorage.setItem('werkbladSettings', JSON.stringify(settings));
    window.location.href = 'bewerkingen_werkblad.html';
  });
}


 if (voegSplitsToeBtn) {
  voegSplitsToeBtn.addEventListener('click', () => {
    if (splitsMelding) splitsMelding.textContent = '';

    // 1) fijnmazige selectie verplicht (maakt niet uit welke stijl je kiest)
    const fijn = (typeof leesSplitsFijnVanUI === 'function') ? leesSplitsFijnVanUI() : null;
    const ietsAangevinkt = fijn && (fijn.tot5 || fijn.van6 || fijn.van7 || fijn.van8 || fijn.van9 || fijn.van10 || fijn.van10tot20);
    if (!ietsAangevinkt) {
      if (splitsMelding) splitsMelding.textContent = "Vink minstens één splits-optie aan.";
      return;
    }

    // 2) bouw settings — stijl komt uit je select/radio, fijnkeuze wordt toegevoegd
    let settings = bouwSplitsSettings([]);               // jouw bestaande functie
    settings = verrijkSplitsSettingsMetFijn(settings);   // zorgt voor settings.splitsFijn

    // 3) nette ondertitel voor de bundellijst
    const f = settings.splitsFijn || {};
    const stukjes = [];
    if (f.tot5) stukjes.push('≤5');
    ['6','7','8','9','10'].forEach(n => { if (f['van'+n]) stukjes.push(n); });
    if (f.van10tot20) stukjes.push(`10–20 (${f.brug10tot20||'beide'})`);
    const sub = `${settings.splitsStijl} • aant.: ${settings.numOefeningen}` + (stukjes.length ? ` • tot.: ${stukjes.join(', ')}` : '');

    // 4) BELANGRIJK: bundelPush opslaan + direct hertekenen
    bundelPush({
      titel: 'Splitsen',
      subtitle: sub,
      settings
    });
  });
}

  function bouwSplitsSettings(gekozenGetallen){
  const fijn = (typeof leesSplitsFijnVanUI === 'function') ? leesSplitsFijnVanUI() : null;

  // 1) start van wat er al stond…
  const grote = !!(typeof groteSplitshuizenCheckbox !== 'undefined' && groteSplitshuizenCheckbox && groteSplitshuizenCheckbox.checked);

  // 2) bepaal de lijst totalen
  let splitsGetallenArray = Array.isArray(gekozenGetallen) ? gekozenGetallen.slice() : [];

  // Als er niets expliciet werd doorgegeven én het om grote splitshuizen gaat:
  if (splitsGetallenArray.length === 0 && grote && fijn) {
    // Bouw de lijst vanuit de fijnkeuze
    if (fijn.van6)  splitsGetallenArray.push(6);
    if (fijn.van7)  splitsGetallenArray.push(7);
    if (fijn.van8)  splitsGetallenArray.push(8);
    if (fijn.van9)  splitsGetallenArray.push(9);
    if (fijn.van10) splitsGetallenArray.push(10);
    if (fijn.van10tot20) {
      for (let n = 10; n <= 20; n++) if (!splitsGetallenArray.includes(n)) splitsGetallenArray.push(n);
    }
    // Fallback (niets aangevinkt): blijf compatibel met oude gedrag
    if (splitsGetallenArray.length === 0) splitsGetallenArray = [10];
  }

  return {
    hoofdBewerking: 'splitsen',
    numOefeningen: Math.max(1, parseInt((document.getElementById('numOefeningen_splits') || { value: 20 }).value)),
    splitsStijl: (document.querySelector('input[name="splitsStijl"]:checked') || { value: 'huisje' }).value,
    groteSplitshuizen: grote,
    splitsGetallenArray,  // ← gebruik de zojuist berekende lijst
    splitsWissel: !!(document.getElementById('splitsWisselCheckbox') && document.getElementById('splitsWisselCheckbox').checked),
    splitsSom:   !!(document.getElementById('splitsSomCheckbox')   && document.getElementById('splitsSomCheckbox').checked),
    ...(fijn ? { splitsFijn: fijn } : {}),
    opdracht: (() => {
      const vrij = (document.getElementById('opdracht_splits') || {}).value?.trim();
      if (vrij) return vrij;
      const s = (document.querySelector('input[name="splitsStijl"]:checked')||{}).value || 'benen';
      if (s === 'puntoefening') return 'Vul de splitsing aan.';
      if (s === 'bewerkingen4') return 'Splits en maak de 4 bewerkingen.';
      if (s === 'huisje')       return 'Vul het splitshuis correct in.';
      return 'Vul de splitsbenen correct in.';
    })()
  };
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
  document.querySelectorAll('input[name="rekenType"]').forEach(r => r.addEventListener('change', updateHulpWeergave));
  updateHulpWeergave();

  if (maakRekenBtn) {
    maakRekenBtn.addEventListener('click', () => {
      if (rekenMelding) rekenMelding.textContent = '';
      const somTypes = Array.from(document.querySelectorAll('input[name="somType"]:checked')).map(cb => cb.value);
      if (!somTypes.length) { if (rekenMelding) rekenMelding.textContent = 'Kies minstens één type som!'; return; }
      const settings = bouwRekenSettings(somTypes);
      localStorage.setItem('werkbladSettings', JSON.stringify(settings));
      window.location.href = 'bewerkingen_werkblad.html';
    });
  }
  if (voegRekenToeBtn) {
    voegRekenToeBtn.addEventListener('click', () => {
      if (rekenMelding) rekenMelding.textContent = '';
      const somTypes = Array.from(document.querySelectorAll('input[name="somType"]:checked')).map(cb => cb.value);
      if (!somTypes.length) { if (rekenMelding) rekenMelding.textContent = 'Kies minstens één type som!'; return; }
      const settings = bouwRekenSettings(somTypes);
      bundelPush({
        titel: 'Bewerkingen',
        subtitle: `${settings.rekenType} • tot ${settings.rekenMaxGetal} • types: ${somTypes.join(', ')} • aant.: ${settings.numOefeningen}`,
        settings
      });
    });
  }
  // toon het juiste opdrachtveld volgens gekozen bewerking
function updateOpdrachtVeld() {
  const type = (document.querySelector('input[name="rekenType"]:checked') || {}).value;
  const opt = document.getElementById('opdracht_optellen');
  const aft = document.getElementById('opdracht_aftrekken');
  if (!opt || !aft) return;
  if (type === 'aftrekken') {
    opt.style.display = 'none';
    aft.style.display = 'block';
  } else {
    opt.style.display = 'block';
    aft.style.display = 'none';
  }
}
document.querySelectorAll('input[name="rekenType"]').forEach(r => r.addEventListener('change', updateOpdrachtVeld));
updateOpdrachtVeld();

  function bouwRekenSettings(somTypes){
    const rekenHulp = {
      inschakelen: !!(rekenHulpCheckbox && rekenHulpCheckbox.checked && rekenBrugSelect && rekenBrugSelect.value !== 'zonder'),
      schrijflijnen: !!(document.getElementById('rekenHulpSchrijflijnen') && document.getElementById('rekenHulpSchrijflijnen').checked),
      splitsPlaatsAftrekken: (document.querySelector('input[name="splitsPlaatsAftrekken"]:checked') ? document.querySelector('input[name="splitsPlaatsAftrekken"]:checked').value : 'onderAftrektal')
    };
    return {
      hoofdBewerking: 'rekenen',
      numOefeningen: Math.max(1, parseInt((document.getElementById('numOefeningen_reken') || { value: 20 }).value)),
      rekenMaxGetal: parseInt((document.getElementById('rekenMaxGetal') || { value: 100 }).value),
      rekenType: (document.querySelector('input[name="rekenType"]:checked') || { value: 'optellen' }).value,
      somTypes,
      rekenBrug: rekenBrugSelect ? rekenBrugSelect.value : 'beide',
      rekenHulp,
      opdracht: (() => {
        const type = (document.querySelector('input[name="rekenType"]:checked') || {}).value;
const veldId = (type === 'aftrekken') ? 'opdracht_aftrekken' : 'opdracht_optellen';
const vrij = (document.getElementById(veldId) || {}).value?.trim();

        if (vrij) return vrij;
        if (rekenBrugSelect?.value === 'met')    return 'Los de sommen op met brug.';
        if (rekenBrugSelect?.value === 'zonder') return 'Los de sommen op zonder brug.';
        return 'Los de sommen op.';
      })()
    };
  }

  // ====== TAFELS ======
  const maakTafelBtn    = document.getElementById('maakTafelBtn');
  const voegTafelToeBtn = document.getElementById('voegTafelToeBtn');
  const tafelMelding    = document.getElementById('tafelMelding');

  if (maakTafelBtn) {
    maakTafelBtn.addEventListener('click', () => {
      if (tafelMelding) tafelMelding.textContent = '';
      const gekozenTafels = Array.from(document.querySelectorAll('input[name="tafelNummer"]:checked')).map(cb => parseInt(cb.value));
      if (!gekozenTafels.length) { if (tafelMelding) tafelMelding.textContent = 'Kies minstens één tafel!'; return; }
      const settings = bouwTafelSettings(gekozenTafels);
      localStorage.setItem('werkbladSettings', JSON.stringify(settings));
      window.location.href = 'bewerkingen_werkblad.html';
    });
  }
  if (voegTafelToeBtn) {
    voegTafelToeBtn.addEventListener('click', () => {
      if (tafelMelding) tafelMelding.textContent = '';
      const gekozenTafels = Array.from(document.querySelectorAll('input[name="tafelNummer"]:checked')).map(cb => parseInt(cb.value));
      if (!gekozenTafels.length) { if (tafelMelding) tafelMelding.textContent = 'Kies minstens één tafel!'; return; }
      const settings = bouwTafelSettings(gekozenTafels);
      bundelPush({
        titel: 'Maal- en deeltafels',
        subtitle: `${settings.tafelType} • tafels: ${settings.gekozenTafels.join(', ')} • aant.: ${settings.numOefeningen}`,
        settings
      });
    });
  }
  function bouwTafelSettings(gekozenTafels){
    return {
      hoofdBewerking: 'tafels',
      numOefeningen: Math.max(1, parseInt((document.getElementById('numOefeningen_tafel') || { value: 20 }).value)),
      tafelType: (document.querySelector('input[name="tafelType"]:checked') || { value: 'maal' }).value,
      gekozenTafels,
      tafelsVolgorde: (document.querySelector('input[name="tafelsVolgorde"]:checked') || { value: 'links' }).value,
      tafelsMetNul: !!(document.getElementById('tafelsMetNul') && document.getElementById('tafelsMetNul').checked),
      opdracht: (() => {
        const vrij = (document.getElementById('opdracht_tafel') || {}).value?.trim();
        return vrij || 'Los de tafel-oefeningen op.';
      })()
    };
  }

  // ====== BUNDEL-STATE & RENDER ======
  let bundel = JSON.parse(localStorage.getItem('werkbladBundel') || '[]');

  function bundelOpslaan() {
    localStorage.setItem('werkbladBundel', JSON.stringify(bundel));
    bundelRender();
  }
  function bundelPush(item) { bundel.push(item); bundelOpslaan(); }

  function moveItem(oldIndex, newIndex){
    if (newIndex < 0 || newIndex >= bundel.length) return;
    const [it] = bundel.splice(oldIndex,1);
    bundel.splice(newIndex,0,it);
    bundelOpslaan();
  }

  function bundelRender() {
    const box = document.getElementById('bundelOverzicht');
    if (!box) return;
    box.innerHTML = '';
    if (!bundel.length) {
      box.innerHTML = '<em>Je bundel is nog leeg. Voeg sets toe via de knoppen “Voeg toe aan bundel”.</em>';
      return;
    }
    bundel.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'bundel-row';

      const left = document.createElement('div');
      left.className = 'bundel-left';
      const t = document.createElement('span');
      t.className = 'bundel-title'; t.textContent = item.titel;
      const s = document.createElement('span');
      s.className = 'bundel-sub'; s.textContent = item.subtitle || '';
      left.appendChild(t); left.appendChild(s);

      const actions = document.createElement('div');
      actions.className = 'bundel-actions';

      const upBtn = document.createElement('button');
      upBtn.className = 'btn'; upBtn.textContent = '▲';
      upBtn.title = 'Omhoog';
      upBtn.onclick = () => moveItem(idx, idx-1);

      const downBtn = document.createElement('button');
      downBtn.className = 'btn'; downBtn.textContent = '▼';
      downBtn.title = 'Omlaag';
      downBtn.onclick = () => moveItem(idx, idx+1);

      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn--danger'; delBtn.textContent = 'Verwijder';
      delBtn.onclick = () => { bundel.splice(idx,1); bundelOpslaan(); };

      actions.appendChild(upBtn);
      actions.appendChild(downBtn);
      actions.appendChild(delBtn);

      row.append(left, actions);
      box.appendChild(row);
    });
  }
  bundelRender();

  // Bundelknoppen onderaan
  const maakBundelBtn = document.getElementById('maakBundelBtn');
  const leegBundelBtn = document.getElementById('leegBundelBtn');
  if (maakBundelBtn) {
    maakBundelBtn.addEventListener('click', () => {
      if (!bundel.length) { alert('Je bundel is leeg. Voeg eerst sets toe.'); return; }
      bundelOpslaan();
      window.location.href = 'bewerkingen_werkblad.html';
    });
  }
  if (leegBundelBtn) leegBundelBtn.addEventListener('click', () => {
    if (confirm('Bundel leegmaken?')) { bundel = []; bundelOpslaan(); }
  });
});
// === Nieuw: fijnmazige splits-keuzes uitlezen en aan settings hangen ===
function leesSplitsFijnVanUI() {
  const g = id => document.getElementById(id);
  if (!g('sp_tot5')) return null; // blok bestaat (HTML-patch) ?
  return {
    tot5:   !!g('sp_tot5').checked,
    van6:   !!g('sp_van6').checked,
    van7:   !!g('sp_van7').checked,
    van8:   !!g('sp_van8').checked,
    van9:   !!g('sp_van9').checked,
    van10:  !!g('sp_van10').checked,
    van10tot20: !!g('sp_10_20').checked,
    brug10tot20: (g('sp_10_20_brug')?.value || 'beide')
  };
}

function verrijkSplitsSettingsMetFijn(settings) {
  const fijn = leesSplitsFijnVanUI();
  if (fijn) settings.splitsFijn = fijn;
  return settings;
}

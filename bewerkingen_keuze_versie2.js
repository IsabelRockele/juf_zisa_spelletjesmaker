document.addEventListener('DOMContentLoaded', () => {
  // ===== Helpers =====
  function nieuwSegmentId(){
    return 'seg_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,6);
  }
  function saveSingle(settings){
    localStorage.setItem('werkbladSettings', JSON.stringify(settings||{}));
  }
  function readBundel(){
    try{ return JSON.parse(localStorage.getItem('werkbladBundel')||'[]') || []; }catch{return []}
  }
  function saveBundel(arr){
    localStorage.setItem('werkbladBundel', JSON.stringify(arr||[]));
    tekenBundel();
  }
  function bundelPush(item){
    const arr = readBundel();
    arr.push(item);
    saveBundel(arr);
  }

  // ===== Tafels: dynamische checkboxen 1..12 + "alles" =====
  const selectAllTafelsCheckbox = document.getElementById('selectAllTafels');
  const tafelKeuzeDiv           = document.getElementById('tafelKeuze');
  if (tafelKeuzeDiv) {
    for (let i = 1; i <= 12; i++) {
      const label = document.createElement('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.name = 'tafelNummer'; cb.value = i;
      label.appendChild(cb);
      label.appendChild(document.createTextNode(' '+i));
      tafelKeuzeDiv.appendChild(label);
    }
  }
  if (selectAllTafelsCheckbox) {
    const all = () => document.querySelectorAll('input[name="tafelNummer"]');
    selectAllTafelsCheckbox.addEventListener('change', e => {
      all().forEach(cb => cb.checked = e.target.checked);
    });
  }

  // ====== SPLITSEN ======
  const maakSplitsBtn             = document.getElementById('maakSplitsBtn');
  const voegSplitsToeBtn          = document.getElementById('voegSplitsToeBtn');
  const splitsMelding             = document.getElementById('splitsMelding');
  const groteSplitshuizenCheckbox = document.getElementById('groteSplitshuizenCheckbox');

  function leesSplitsFijnVanUI(){
    const f = {
      tot5:   !!document.getElementById('sp_tot5')?.checked,
      van6:   !!document.getElementById('sp_van6')?.checked,
      van7:   !!document.getElementById('sp_van7')?.checked,
      van8:   !!document.getElementById('sp_van8')?.checked,
      van9:   !!document.getElementById('sp_van9')?.checked,
      van10:  !!document.getElementById('sp_van10')?.checked,
      van10tot20: !!document.getElementById('sp_10_20')?.checked,
      brug10tot20: (document.getElementById('sp_10_20_brug')||{}).value || 'beide'
    };
    return f;
  }

  function verrijkSplitsSettingsMetFijn(settings){
    const f = leesSplitsFijnVanUI();
    settings.splitsFijn = f;
    return settings;
  }

  function bouwSplitsSettings(gekozenGetallen){
    const fijn = leesSplitsFijnVanUI();
    const grote = !!(groteSplitshuizenCheckbox && groteSplitshuizenCheckbox.checked);

    let splitsGetallenArray = Array.isArray(gekozenGetallen) ? gekozenGetallen.slice() : [];

    // Bij grote splitshuizen: bouw de lijst vanuit fijnkeuze
    if (splitsGetallenArray.length === 0 && grote && fijn) {
      if (fijn.van6)  splitsGetallenArray.push(6);
      if (fijn.van7)  splitsGetallenArray.push(7);
      if (fijn.van8)  splitsGetallenArray.push(8);
      if (fijn.van9)  splitsGetallenArray.push(9);
      if (fijn.van10) splitsGetallenArray.push(10);
      if (fijn.van10tot20){ for (let n=10;n<=20;n++) if(!splitsGetallenArray.includes(n)) splitsGetallenArray.push(n); }
      if (!splitsGetallenArray.length) splitsGetallenArray = [10]; // fallback
    }

    return {
      segmentId: nieuwSegmentId(),
      hoofdBewerking: 'splitsen',
      numOefeningen: Math.max(1, parseInt((document.getElementById('numOefeningen_splits')||{value:20}).value, 10)),
      splitsStijl: (document.querySelector('input[name="splitsStijl"]:checked')||{value:'huisje'}).value,
      groteSplitshuizen: grote,
      splitsGetallenArray,
      splitsWissel: !!document.getElementById('splitsWisselCheckbox')?.checked,
      splitsSom:   !!document.getElementById('splitsSomCheckbox')?.checked,
      splitsFijn: fijn,
      opdracht: (() => {
        const vrij = (document.getElementById('opdracht_splits')||{}).value?.trim();
        if (vrij) return vrij;
        const s = (document.querySelector('input[name="splitsStijl"]:checked')||{}).value || 'benen';
        if (s === 'puntoefening') return 'Vul de splitsing aan.';
        if (s === 'bewerkingen4') return 'Splits en maak de 4 bewerkingen.';
        if (s === 'huisje')       return 'Vul het splitshuis correct in.';
        return 'Vul de splitsbenen correct in.';
      })()
    };
  }

  if (maakSplitsBtn){
    maakSplitsBtn.addEventListener('click', () => {
      splitsMelding.textContent = '';
      const fijn = leesSplitsFijnVanUI();
      const iets = (fijn.tot5||fijn.van6||fijn.van7||fijn.van8||fijn.van9||fijn.van10||fijn.van10tot20);
      if (!iets){ splitsMelding.textContent = 'Vink minstens één splits-optie aan.'; return; }
      const settings = bouwSplitsSettings([]);
      saveSingle(settings);
      window.location.href = 'bewerkingen_werkblad.html';
    });
  }
  if (voegSplitsToeBtn){
    voegSplitsToeBtn.addEventListener('click', () => {
      splitsMelding.textContent = '';
      const fijn = leesSplitsFijnVanUI();
      const iets = (fijn.tot5||fijn.van6||fijn.van7||fijn.van8||fijn.van9||fijn.van10||fijn.van10tot20);
      if (!iets){ splitsMelding.textContent = 'Vink minstens één splits-optie aan.'; return; }
      let settings = bouwSplitsSettings([]);
      settings = verrijkSplitsSettingsMetFijn(settings);
      const f = settings.splitsFijn || {};
      const stukjes = [];
      if (f.tot5) stukjes.push('≤5');
      ['6','7','8','9','10'].forEach(n => { if (f['van'+n]) stukjes.push(n); });
      if (f.van10tot20) stukjes.push(`10–20 (${f.brug10tot20||'beide'})`);
      const sub = `${settings.splitsStijl} • aant.: ${settings.numOefeningen}` + (stukjes.length ? ` • tot.: ${stukjes.join(', ')}` : '');
      bundelPush({ titel:'Splitsen', subtitle: sub, settings });
    });
  }

  // ====== BEWERKINGEN ======
  const rekenMelding      = document.getElementById('rekenMelding');
  const rekenBrugSelect   = document.getElementById('rekenBrug');
  const rekenHulpCheckbox = document.getElementById('rekenHulpCheckbox');
  const rekenHulpDetail   = document.getElementById('rekenHulpDetail');
  const optellenHint      = document.getElementById('optellenHint');
  const aftrekkenHint     = document.getElementById('aftrekkenHint');

  const rekenMaxGetalSelect = document.getElementById('rekenMaxGetal');
  const drieTermenPaneel    = document.getElementById('drieTermenPaneel');
  const drieTermenCheckbox  = document.getElementById('drieTermenEerst10');

  const maakRekenBtn    = document.getElementById('maakRekenBtn');
  const voegRekenToeBtn = document.getElementById('voegRekenToeBtn');

  function huidigRekenType(){
    return (document.querySelector('input[name="rekenType"]:checked')||{}).value || 'optellen';
  }

  function updateHulpWeergave(){
    const type = huidigRekenType();
    const brug = rekenBrugSelect?.value || 'beide';
    const hulpMogelijk = (brug !== 'zonder') && !!rekenHulpCheckbox?.checked;
    if (rekenHulpDetail) rekenHulpDetail.style.display = hulpMogelijk ? '' : 'none';
    if (hulpMogelijk){
      if (type === 'aftrekken'){
        if (aftrekkenHint) aftrekkenHint.style.display = '';
        if (optellenHint)  optellenHint.style.display  = 'none';
      } else if (type === 'optellen'){
        if (aftrekkenHint) aftrekkenHint.style.display = 'none';
        if (optellenHint)  optellenHint.style.display  = '';
      } else {
        if (aftrekkenHint) aftrekkenHint.style.display = '';
        if (optellenHint)  optellenHint.style.display  = '';
      }
    }
  }

  function updateOpdrachtVeld(){
    const type = huidigRekenType();
    const opt = document.getElementById('opdracht_optellen');
    const aft = document.getElementById('opdracht_aftrekken');
    if (!opt || !aft) return;
    if (type === 'aftrekken'){ opt.style.display='none'; aft.style.display='block'; }
    else { opt.style.display='block'; aft.style.display='none'; }
  }

  function updateDrieTermenUI(){
    const max  = parseInt(rekenMaxGetalSelect?.value || '100', 10);
    const type = huidigRekenType();
    const zichtbaar = (max === 20) && (type !== 'aftrekken'); // tonen bij optellen/beide tot 20
    if (drieTermenPaneel) drieTermenPaneel.style.display = zichtbaar ? '' : 'none';
    if (!zichtbaar && drieTermenCheckbox) drieTermenCheckbox.checked = false;
  }

  rekenHulpCheckbox?.addEventListener('change', updateHulpWeergave);
  rekenBrugSelect?.addEventListener('change', updateHulpWeergave);
  document.querySelectorAll('input[name="rekenType"]').forEach(r=>{
    r.addEventListener('change', () => { updateHulpWeergave(); updateOpdrachtVeld(); updateDrieTermenUI(); });
  });
  rekenMaxGetalSelect?.addEventListener('change', updateDrieTermenUI);
  updateHulpWeergave(); updateOpdrachtVeld(); updateDrieTermenUI();

  function bouwRekenSettings(somTypes){
    const rekenHulp = {
      inschakelen: !!(rekenHulpCheckbox && rekenHulpCheckbox.checked && rekenBrugSelect && rekenBrugSelect.value !== 'zonder'),
      schrijflijnen: !!document.getElementById('rekenHulpSchrijflijnen')?.checked,
      splitsPlaatsAftrekken: (document.querySelector('input[name="splitsPlaatsAftrekken"]:checked')||{}).value || 'onderAftrektal'
    };
    const type = huidigRekenType();
    const max  = parseInt((rekenMaxGetalSelect||{value:100}).value, 10);

    return {
      segmentId: nieuwSegmentId(),
      hoofdBewerking: 'rekenen',
      numOefeningen: Math.max(1, parseInt((document.getElementById('numOefeningen_reken')||{value:20}).value, 10)),
      rekenMaxGetal: max,
      rekenType: type,
      somTypes,
      rekenBrug: rekenBrugSelect ? rekenBrugSelect.value : 'beide',
      rekenHulp,
      // NIEUW: 3 termen (eerst 10) alleen logische true als het zinvol is:
      drieTermenEerst10: !!(drieTermenCheckbox?.checked) && max === 20 && type !== 'aftrekken',
      opdracht: (() => {
        const veldId = (type === 'aftrekken') ? 'opdracht_aftrekken' : 'opdracht_optellen';
        const vrij = (document.getElementById(veldId)||{}).value?.trim();
        if (vrij) return vrij;
        if (rekenBrugSelect?.value === 'met')    return 'Los de sommen op met brug.';
        if (rekenBrugSelect?.value === 'zonder') return 'Los de sommen op zonder brug.';
        return 'Los de sommen op.';
      })()
    };
  }

  if (maakRekenBtn){
    maakRekenBtn.addEventListener('click', () => {
      rekenMelding.textContent = '';
      const somTypes = Array.from(document.querySelectorAll('input[name="somType"]:checked')).map(cb=>cb.value);
      if (!somTypes.length){ rekenMelding.textContent = 'Kies minstens één type som!'; return; }
      const settings = bouwRekenSettings(somTypes);
      saveSingle(settings);
      window.location.href = 'bewerkingen_werkblad.html';
    });
  }
  if (voegRekenToeBtn){
    voegRekenToeBtn.addEventListener('click', () => {
      rekenMelding.textContent = '';
      const somTypes = Array.from(document.querySelectorAll('input[name="somType"]:checked')).map(cb=>cb.value);
      if (!somTypes.length){ rekenMelding.textContent = 'Kies minstens één type som!'; return; }
      const settings = bouwRekenSettings(somTypes);
      const sub = `${settings.rekenType} • tot ${settings.rekenMaxGetal} • ${settings.drieTermenEerst10 ? '3 termen (eerst 10) • ' : ''}types: ${somTypes.join(', ')} • aant.: ${settings.numOefeningen}`;
      bundelPush({ titel:'Bewerkingen', subtitle: sub, settings });
    });
  }

  // ====== TAFELS ======
  const maakTafelBtn    = document.getElementById('maakTafelBtn');
  const voegTafelToeBtn = document.getElementById('voegTafelToeBtn');
  const tafelMelding    = document.getElementById('tafelMelding');

  function bouwTafelSettings(){
    const lijst = Array.from(document.querySelectorAll('input[name="tafelNummer"]:checked')).map(cb=>parseInt(cb.value,10));
    if (!lijst.length) lijst.push(1);
    return {
      segmentId: nieuwSegmentId(),
      hoofdBewerking: 'tafels',
      numOefeningen: Math.max(1, parseInt((document.getElementById('numOefeningen_tafel')||{value:20}).value, 10)),
      tafelType: (document.querySelector('input[name="tafelType"]:checked')||{value:'maal'}).value,
      gekozenTafels: lijst,
      tafelsVolgorde: (document.querySelector('input[name="tafelsVolgorde"]:checked')||{value:'links'}).value,
      tafelsMetNul: !!document.getElementById('tafelsMetNul')?.checked,
      opdracht: (document.getElementById('opdracht_tafel')||{}).value?.trim() || 'Los de tafel-oefeningen op.'
    };
  }

  if (maakTafelBtn){
    maakTafelBtn.addEventListener('click', ()=>{
      tafelMelding.textContent = '';
      const settings = bouwTafelSettings();
      saveSingle(settings);
      window.location.href = 'bewerkingen_werkblad.html';
    });
  }
  if (voegTafelToeBtn){
    voegTafelToeBtn.addEventListener('click', ()=>{
      tafelMelding.textContent = '';
      const settings = bouwTafelSettings();
      const sub = `${settings.tafelType} • tafels: ${settings.gekozenTafels.join(', ')} • aant.: ${settings.numOefeningen}`;
      bundelPush({ titel:'Tafels', subtitle: sub, settings });
    });
  }

  // ===== Bundel UI =====
  const bundelOverzicht = document.getElementById('bundelOverzicht');
  const maakBundelBtn   = document.getElementById('maakBundelBtn');
  const leegBundelBtn   = document.getElementById('leegBundelBtn');

  function tekenBundel(){
    const arr = readBundel();
    if (!bundelOverzicht) return;
    bundelOverzicht.innerHTML = '';
    if (!arr.length){
      bundelOverzicht.textContent = 'Nog geen onderdelen toegevoegd.';
      return;
    }
    arr.forEach((it, idx) => {
      const row = document.createElement('div');
      row.className = 'bundel-row';
      const left = document.createElement('div');
      left.className = 'bundel-left';
      const t = document.createElement('div'); t.className = 'bundel-title'; t.textContent = it.titel || 'Onderdeel';
      const s = document.createElement('div'); s.className = 'bundel-sub'; s.textContent = it.subtitle || '';
      left.append(t,s);

      const actions = document.createElement('div');
      actions.className = 'bundel-actions';
      const del = document.createElement('button'); del.className='btn'; del.textContent='Verwijder';
      del.addEventListener('click', ()=>{
        const arr2 = readBundel(); arr2.splice(idx,1); saveBundel(arr2);
      });
      actions.appendChild(del);

      row.append(left, actions);
      bundelOverzicht.appendChild(row);
    });
  }
  tekenBundel();

  maakBundelBtn?.addEventListener('click', () => {
    const arr = readBundel();
    if (!arr.length){ alert('Bundel is leeg. Voeg eerst onderdelen toe.'); return; }
    // Single is onbelangrijk als bundel bestaat; werkblad leest bundel zelf.
    window.location.href = 'bewerkingen_werkblad.html';
  });

  leegBundelBtn?.addEventListener('click', () => {
    if (!confirm('Bundel leegmaken?')) return;
    saveBundel([]);
  });
});

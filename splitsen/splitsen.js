import { genereerSplitsing } from './splits.generator.js';
import {
  renderSplitsBenentraining,
  renderSplitsHuisje
} from './splits.preview.js';


document.addEventListener("DOMContentLoaded", () => {

  function nieuwSegmentId() {
    return 'seg_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }

  function leesSplitsFijnVanUI() {
    return {
      tot5: document.getElementById('sp_tot5')?.checked,
      van6: document.getElementById('sp_van6')?.checked,
      van7: document.getElementById('sp_van7')?.checked,
      van8: document.getElementById('sp_van8')?.checked,
      van9: document.getElementById('sp_van9')?.checked,
      van10: document.getElementById('sp_van10')?.checked,
      van10tot20: document.getElementById('sp_10_20')?.checked,
      brug10tot20: document.getElementById('sp_10_20_brug')?.value || 'beide'
    };
  }

  function bouwSplitsSettings() {
    return {
      segmentId: nieuwSegmentId(),
      hoofdBewerking: 'splitsen',
      numOefeningen: parseInt(document.getElementById('numOefeningen_splits').value, 10),
      splitsStijl: document.querySelector('input[name="splitsStijl"]:checked').value,
      groteSplitshuizen: document.getElementById('groteSplitshuizenCheckbox').checked,
      splitsWissel: document.getElementById('splitsWisselCheckbox').checked,
      splitsSom: document.getElementById('splitsSomCheckbox').checked,
      splitsFijn: leesSplitsFijnVanUI(),
      splitsGetallenArray: [],
      opdracht: document.getElementById('opdracht_splits').value
    };
  }

  document.getElementById('voegSplitsToeBtn').addEventListener('click', () => {

    const fijn = leesSplitsFijnVanUI();
    if (!Object.values(fijn).some(v => v === true)) {
      document.getElementById('splitsMelding').textContent =
        'Kies minstens één splitsoptie.';
      return;
    }
const cfg = bouwSplitsSettings();
// ❌ Grote splitshuizen + splits + 4 bewerkingen mag niet
if (cfg.groteSplitshuizen && cfg.splitsStijl === 'bewerkingen4') {
  document.getElementById('splitsMelding').textContent =
    'Grote splitshuizen kunnen niet gecombineerd worden met splits + 4 bewerkingen.';
  return;
}


 // ===============================
// Oefeningen opbouwen
// ===============================
cfg._oefeningen = [];

// 👉 GROTE SPLITSHUIZEN: exact 1 per gekozen getal
if (cfg.groteSplitshuizen && cfg.splitsStijl === 'benen') {


  const arr = [];

  if (fijn.van6) arr.push(6);
  if (fijn.van7) arr.push(7);
  if (fijn.van8) arr.push(8);
  if (fijn.van9) arr.push(9);
  if (fijn.van10) arr.push(10);
  if (fijn.van10tot20) arr.push(20);

  arr.forEach(getal => {
    cfg._oefeningen.push({
      type: 'splitsen_groot',
      max: getal
    });
  });

} else {

  // 👉 NORMALE SPLITS-OEFENINGEN
  const n = parseInt(cfg.numOefeningen, 10) || 0;
  for (let i = 0; i < n; i++) {
    cfg._oefeningen.push(genereerSplitsing(cfg));
  }

}

    bundelPush({
      titel: 'Splitsen',
      subtitle: cfg.splitsStijl,
      settings: cfg
    });

    window.location.href = '../dashboard/dashboard.html';
  });

});

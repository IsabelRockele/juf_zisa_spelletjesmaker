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

    // 🔑 HIER ZAT HET PROBLEEM → oefeningen ontbraken
    cfg._oefeningen = [];
    for (let i = 0; i < cfg.numOefeningen; i++) {
      cfg._oefeningen.push(genereerSplitsing(cfg));
    }

    bundelPush({
      titel: 'Splitsen',
      subtitle: cfg.splitsStijl,
      settings: cfg
    });

    window.location.href = '../dashboard/dashboard.html';
  });

});

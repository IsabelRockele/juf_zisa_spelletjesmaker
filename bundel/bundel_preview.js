/* =========================================================
   BUNDEL – PREVIEW ENGINE (ALLEEN SPLITSBENEN)
   ========================================================= */

import {
  renderSplitsBenentraining,
  renderSplitsHuisje,
  renderSplitsPuntoefening,
  renderSplitsPlusVier,
  renderGroteSplitshuizen
} from '../splitsen/splits.preview.js';



import { genereerSplitsing } from '../splitsen/splits.generator.js';


/* ---------- helpers ---------- */

function leesBundel() {
  try {
    return JSON.parse(localStorage.getItem('werkbladBundel') || '[]');
  } catch {
    return [];
  }
}

function titelVoor(cfg) {
  if (cfg.opdracht && cfg.opdracht.trim()) return cfg.opdracht.trim();

    if (cfg.hoofdBewerking === 'splitsen') {
    if (cfg.splitsStijl === 'puntoefening') return 'Vul de splitsing aan.';
    if (cfg.splitsStijl === 'bewerkingen4') return 'Splits en maak de 4 bewerkingen.';
    if (cfg.splitsStijl === 'huisje') return 'Vul het splitshuis correct in.';
    return 'Vul de splitsbenen correct in.';
  }

  return 'Oefeningen';
}


/* ---------- main ---------- */

document.addEventListener('DOMContentLoaded', () => {

  const container = document.getElementById('werkblad-container');
  if (!container) return;
// ================================
// BUNDELINSTELLINGEN (PDF)
// ================================

let bundelMeta = {};
try {
  bundelMeta = JSON.parse(localStorage.getItem('bundelMeta') || '{}');
} catch {
  bundelMeta = {};
}

const metaBox = document.createElement('div');
metaBox.style.marginBottom = '20px';
metaBox.style.padding = '14px';
metaBox.style.border = '2px solid #0b4d7a';
metaBox.style.borderRadius = '12px';
metaBox.style.background = '#f7fbff';

const metaTitel = document.createElement('div');
metaTitel.textContent = 'Bundelinstellingen (PDF)';
metaTitel.style.fontWeight = '700';
metaTitel.style.fontSize = '16px';
metaTitel.style.marginBottom = '10px';
metaTitel.style.color = '#0b4d7a';

const titelLabel = document.createElement('label');
titelLabel.textContent = 'Grote titel van de bundel:';
titelLabel.style.display = 'block';
titelLabel.style.fontWeight = '600';
titelLabel.style.marginBottom = '6px';

const titelInput = document.createElement('input');
titelInput.type = 'text';
titelInput.placeholder = 'Herhalingsbundel bewerkingen';
titelInput.value = bundelMeta.titel || '';
titelInput.style.width = '100%';
titelInput.style.padding = '8px';
titelInput.style.border = '1px solid #cfd8dc';
titelInput.style.borderRadius = '8px';
titelInput.style.marginBottom = '10px';

titelInput.addEventListener('input', () => {
  bundelMeta.titel = titelInput.value;
  localStorage.setItem('bundelMeta', JSON.stringify(bundelMeta));
});

const checkboxLabel = document.createElement('label');
checkboxLabel.style.display = 'flex';
checkboxLabel.style.alignItems = 'center';
checkboxLabel.style.gap = '8px';
checkboxLabel.style.fontWeight = '600';
checkboxLabel.style.color = '#0b4d7a';

const checkbox = document.createElement('input');
checkbox.type = 'checkbox';
checkbox.checked = !!bundelMeta.toonTitelOpElkePagina;

checkbox.addEventListener('change', () => {
  bundelMeta.toonTitelOpElkePagina = checkbox.checked;
  localStorage.setItem('bundelMeta', JSON.stringify(bundelMeta));
});

checkboxLabel.appendChild(checkbox);
checkboxLabel.appendChild(
  document.createTextNode(
    'Toon grote titel + naam op elke pagina (uit = enkel eerste pagina)'
  )
);

metaBox.appendChild(metaTitel);
metaBox.appendChild(titelLabel);
metaBox.appendChild(titelInput);
metaBox.appendChild(checkboxLabel);

container.appendChild(metaBox);

  const bundel = leesBundel();

  if (!bundel.length) {
    container.innerHTML = '<p>Geen oefeningen in de bundel.</p>';
    return;
  }

  bundel.forEach(item => {
    const cfg = item.settings;
   if (!cfg || cfg.hoofdBewerking !== 'splitsen') return;

    // --- segment ---
    const segment = document.createElement('section');
    segment.className = 'preview-segment';
    segment.style.border = '1px solid #b3e0ff';
    segment.style.borderRadius = '12px';
    segment.style.background = '#f8fcff';
    segment.style.padding = '14px';
    segment.style.margin = '12px 0';

    // ===== VERWIJDER VOLLEDIGE OPDRACHT (SEGMENT) =====
segment.style.position = 'relative';

const delSegment = document.createElement('button');
delSegment.textContent = '🗑';
delSegment.title = 'Verwijder deze opdracht';
delSegment.style.position = 'absolute';
delSegment.style.top = '8px';
delSegment.style.right = '10px';
delSegment.style.border = 'none';
delSegment.style.background = 'transparent';
delSegment.style.color = '#666';
delSegment.style.fontSize = '18px';
delSegment.style.cursor = 'pointer';


delSegment.addEventListener('click', () => {
  if (!confirm('Deze opdracht verwijderen?')) return;

  const bundelNu = JSON.parse(localStorage.getItem('werkbladBundel') || '[]');

  const nieuweBundel = bundelNu.filter(b =>
    b.settings?.segmentId !== cfg.segmentId
  );

  localStorage.setItem('werkbladBundel', JSON.stringify(nieuweBundel));

  location.reload();
});

segment.appendChild(delSegment);

    // --- titel ---
    const titel = document.createElement('h3');
    titel.textContent = titelVoor(cfg, 'Vul de splitsbenen correct in.');
    titel.style.margin = '0 0 12px 0';
    titel.style.fontSize = '18px';
    titel.style.fontWeight = '700';
    titel.style.color = '#0b4d7a';

// visuele hint dat titel bewerkbaar is
titel.style.cursor = 'pointer';
titel.title = 'Klik om de opdrachtzin te wijzigen';

// kleine subtiele hinttekst
const wijzigHint = document.createElement('span');
wijzigHint.textContent = '  (klik om te wijzigen)';
wijzigHint.style.fontSize = '12px';
wijzigHint.style.fontWeight = '400';
wijzigHint.style.color = '#6c757d';

titel.appendChild(wijzigHint);

// klik = opdrachtzin aanpassen
titel.addEventListener('click', () => {
  const huidigeTekst =
    cfg.opdracht && cfg.opdracht.trim()
      ? cfg.opdracht.trim()
      : titelVoor(cfg);

  const nieuweTekst = prompt('Opdrachtzin aanpassen:', huidigeTekst);
  if (nieuweTekst === null) return;

  const schoon = nieuweTekst.trim();
  if (!schoon) return;

  // 1. pas cfg aan
  cfg.opdracht = schoon;

  // 2. schrijf terug naar bundel in localStorage
  const bundelNu = JSON.parse(localStorage.getItem('werkbladBundel') || '[]');
  const itemNu = bundelNu.find(b => b.settings?.segmentId === cfg.segmentId);
  if (itemNu && itemNu.settings) {
    itemNu.settings.opdracht = schoon;
  }

  localStorage.setItem('werkbladBundel', JSON.stringify(bundelNu));
  location.reload();
});

    // --- grid ---
    const grid = document.createElement('div');
    grid.className = 'preview-grid';
    grid.style.display = 'grid';
    if (cfg.splitsStijl === 'puntoefening') {
  grid.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
} else {
  grid.style.gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
}

    grid.style.columnGap = '24px';
    grid.style.rowGap = '24px';
    grid.style.justifyItems = 'center';
    grid.style.alignItems = 'start';

    segment.appendChild(titel);
    const addWrap = document.createElement('div');
addWrap.style.display = 'flex';
addWrap.style.justifyContent = 'flex-start';
addWrap.style.margin = '6px 0 12px 0';

const addBtn = document.createElement('button');
addBtn.textContent = '➕ oefeningen toevoegen';
addBtn.title = 'Oefeningen toevoegen aan deze opdracht';

addBtn.style.border = '1px solid #cfd8dc';
addBtn.style.background = '#f7f7f7';
addBtn.style.borderRadius = '8px';
addBtn.style.padding = '6px 12px';
addBtn.style.cursor = 'pointer';
addBtn.style.fontSize = '13px';
addBtn.style.color = '#0b4d7a';
addBtn.style.fontWeight = '600';

addBtn.addEventListener('click', () => {
  const raw = prompt('Hoeveel oefeningen toevoegen?', '3');
  if (raw === null) return;

  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return;

  if (!Array.isArray(cfg._oefeningen)) cfg._oefeningen = [];

  // voeg placeholders toe (volgende stap koppelen we dit aan echte generator)
for (let i = 0; i < n; i++) {
  const nieuweOef = genereerSplitsing(cfg);

  // 👇 vlaggen exact zoals in de oude versie
    // 👇 vlaggen (compatibel met oude én nieuwe opslag)
  nieuweOef._p = (cfg.splitsStijl === 'puntoefening');
  nieuweOef._h = (cfg.splitsStijl === 'huisje');

  // SPLITS + 4 BEWERKINGEN:
  // 1) als stijl nog zo heet: splitsStijl === 'bewerkingen4'
  // 2) of als dit segment expliciet als "4 bewerkingen" is aangeduid
  // 3) of als opdrachtzin overeenkomt (fallback, zodat dit nooit terug stuk gaat)
  const isPlusVier =
    (cfg.splitsStijl === 'bewerkingen4') ||
    (cfg.splitsPlusVier === true) ||
    (typeof cfg.opdracht === 'string' &&
      cfg.opdracht.toLowerCase().includes('4 bewerkingen'));

  nieuweOef._b4 = isPlusVier;


  cfg._oefeningen.push(nieuweOef);
}



  const bundelNu = JSON.parse(localStorage.getItem('werkbladBundel') || '[]');
  const itemNu = bundelNu.find(b => b.settings?.segmentId === cfg.segmentId);
  if (itemNu && itemNu.settings) {
    itemNu.settings._oefeningen = cfg._oefeningen;
  }

  localStorage.setItem('werkbladBundel', JSON.stringify(bundelNu));
  location.reload();
});

addWrap.appendChild(addBtn);
segment.appendChild(addWrap);

    segment.appendChild(grid);
    container.appendChild(segment);

   // --- render splitsen ---
  // --- render splitsen (exact één pad per segment) ---

if (cfg.groteSplitshuizen) {
  renderGroteSplitshuizen(cfg, grid);
  return;
}

if (cfg.splitsStijl === 'bewerkingen4') {
  console.log('▶ PREVIEW: bwerkingen4 segment gevonden', cfg.segmentId);
  console.log('▶ _oefeningen:', cfg._oefeningen);
  renderSplitsPlusVier(cfg, grid);
  return;
}



if (cfg.splitsStijl === 'huisje') {
  renderSplitsHuisje(cfg, grid);
  return;
}

if (cfg.splitsStijl === 'puntoefening') {
  renderSplitsPuntoefening(cfg, grid);
  return;
}

// default
renderSplitsBenentraining(cfg, grid);


}); // <-- sluit bundel.forEach af
}); // <-- sluit DOMContentLoaded af

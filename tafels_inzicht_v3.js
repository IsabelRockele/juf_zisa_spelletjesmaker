// tafels_inzicht_v3.js
// open zinnen + bereik (tot 12 / volledige tafel) + afwisselende afbeeldingen

window.TI = (function () {

  // 1) hulpfunctie: hoeveel keer mag ik deze tafel nemen?
  function maxFactorVoor(tafel, cfg) {
    const bereik = cfg.bereik || '12';   // '12' of 'volledig'
    if (bereik === 'volledig') {
      return 10;                        // 1 t.e.m. 10
    }
    // bereik === '12'
    const mf = Math.floor(12 / tafel);   // bv. 12 / 5 = 2 → 5×1 en 5×2
    return Math.max(1, Math.min(10, mf));
  }

  // 2) maak één oefening
  function maakOefening(cfg) {
    const tafels = (cfg.gekozenTafels && cfg.gekozenTafels.length)
      ? cfg.gekozenTafels
      : [1];

    const tafel = tafels[Math.floor(Math.random() * tafels.length)];
    const typeKeuze = cfg.tafelType || 'maal';   // 'maal' | 'delen' | 'beide'

    let op = typeKeuze;
    if (typeKeuze === 'beide') {
      op = Math.random() < 0.5 ? 'maal' : 'delen';
    }

    if (op === 'maal') {
      const mf = maxFactorVoor(tafel, cfg);
      const factor = Math.floor(Math.random() * mf) + 1; // 1..mf
     return {
  type: 'tafels-inzicht',
  op: 'maal',
  tafel: tafel,          // dit is de gekozen tafel (bv. 2)
  factor: factor,        // dit is het aantal groepen (1..mf)
  groepen: factor,       // ← AANTAL GROEPEN: 3 groepen van 2, 4 groepen van 2, ...
  grootte: tafel,        // ← IN ELKE GROEP: 2
  uitkomst: tafel * factor
};

    } else {
      // delen → we vertalen dat naar "ik heb X, ik deel in Y groepjes"
      const mf = maxFactorVoor(tafel, cfg);
      const factor = Math.floor(Math.random() * mf) + 1;
      const product = tafel * factor;
      return {
        type: 'tafels-inzicht',
        op: 'delen',
        totaal: product,     // totaal aantal voorwerpen
        groepen: factor,     // aantal groepen
        grootte: tafel       // in elke groep / per groep
      };
    }
  }

  // 3) lijst met oefeningen
  function genereer(cfg) {
    const n = cfg.numOefeningen || 8;
    const lijst = [];
    for (let i = 0; i < n; i++) {
      lijst.push(maakOefening(cfg));
    }
    return lijst;
  }

 // 4) PREVIEW – één kaartje tekenen
function renderPreview(grid, cfg, oef, oefIndex = 0) {
  // container
  if (grid) {
    grid.classList.add('tafels-preview-container');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(2, minmax(280px, 1fr))';
    grid.style.gap = '22px 30px'; // meer ruimte tussen kaartjes
  }

  // oefening ophalen
  if (!oef) {
    const lijst = genereer({ ...cfg, numOefeningen: 1 });
    oef = lijst[0];
  }

  // soortje kiezen (opgeslagen in oef of via index)
  const iconSets = [
  { icons: ['🚗', '🚙'], woord: "auto's" },
  { icons: ['⚽', '🏐', '🔵'], woord: "ballen" },
  { icons: ['🚲'], woord: "fietsen" },
  { icons: ['🌸'], woord: 'bloemen' },
  { icons: ['📦'], woord: "dozen" },
  { icons: ['🍎'], woord: "appels" }
];

  const idx = (typeof oef.soortIndex === 'number')
    ? oef.soortIndex
    : (oefIndex % iconSets.length);
  const gekozen = iconSets[idx];
  const icoon = gekozen.icons[0];
  const woord = gekozen.woord;

  // --- KAART ---
  const card = document.createElement('div');
  card.style.border = '1px solid #d9e9ff';
  card.style.borderRadius = '12px';
  card.style.background = '#fff';
  card.style.padding = '12px 14px 10px 14px';
  card.style.position = 'relative';
  card.style.minHeight = '250px';
  card.style.boxSizing = 'border-box';

  // --- GROEPEN BOVENAAN ---
  const plaat = document.createElement('div');
  plaat.style.display = 'flex';
  plaat.style.flexWrap = 'wrap';
  plaat.style.gap = '8px';
  plaat.style.marginBottom = '10px';

  const groepen = oef.groepen || oef.tafel || 1;
  const grootte = oef.grootte || oef.factor || 1;

  for (let g = 0; g < groepen; g++) {
    const groep = document.createElement('div');
    groep.style.display = 'grid';
    groep.style.placeItems = 'center';
    groep.style.gap = '4px';
    groep.style.padding = '6px';
    groep.style.minWidth = '76px';
    groep.style.border = '2px solid #b6cfff';
    groep.style.borderRadius = '10px';
    groep.style.background = '#f8fbff';

    // kolommen bepalen zoals u vroeg
    let cols = 1;
    if (grootte === 4) cols = 2;         // 2x2
    else if (grootte === 5) cols = 3;    // 3 + 2
    else if (grootte === 6) cols = 3;    // 2 rijen van 3
    else if (grootte >= 7) cols = 4;

    groep.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    for (let b = 0; b < grootte; b++) {
      const item = document.createElement('div');
      item.textContent = icoon;
      item.style.fontSize = '28px';
      item.style.width = '32px';
      item.style.height = '32px';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.justifyContent = 'center';
      groep.appendChild(item);
    }

    plaat.appendChild(groep);
  }

  card.appendChild(plaat);

  // --- ZINNEN MET MEER WITRUIMTE ---
  // --- ZINNEN MET MEER WITRUIMTE ---
const tekstContainer = document.createElement('div');
tekstContainer.style.display = 'flex';
tekstContainer.style.flexDirection = 'column';
tekstContainer.style.gap = '4px';

// 1. groep/groepen
const z1 = document.createElement('p');
z1.style.margin = '0';
z1.textContent = `Ik zie _____ ${groepen === 1 ? 'groep' : 'groepen'}.`;
tekstContainer.appendChild(z1);

// 2. in elke groep ...
const z2 = document.createElement('p');
z2.style.margin = '0';
z2.textContent = `In elke groep zie ik _____ ${woord}.`;
tekstContainer.appendChild(z2);

// 3. plus-lijn: aantal-afhankelijk
if (groepen <= 4) {
  const stukjes = Array.from({ length: groepen }, () => '_____');
  const z3 = document.createElement('p');
  z3.style.margin = '0';
  z3.textContent = 'Dat is ' + stukjes.join(' + ') + ' .';
  tekstContainer.appendChild(z3);
} else {
  const eerste = Array.from({ length: 4 }, () => '_____').join(' + ');
  const z3 = document.createElement('p');
  z3.style.margin = '0';
  z3.textContent = 'Dat is ' + eerste + ' +';
  tekstContainer.appendChild(z3);

  const rest = Array.from({ length: groepen - 4 }, () => '_____').join(' + ');
  const z4 = document.createElement('p');
  z4.style.margin = '0';
  z4.textContent = rest + ' .';
  tekstContainer.appendChild(z4);
}

// 4. keer- en maal-lijn met echte groepsgrootte
const zKeer = document.createElement('p');
zKeer.style.margin = '0';
zKeer.textContent = `Dat is _____ keer ${grootte} .`;
tekstContainer.appendChild(zKeer);

const zMaal = document.createElement('p');
zMaal.style.margin = '0';
zMaal.textContent = `Dat is _____ × ${grootte} .`;
tekstContainer.appendChild(zMaal);

  card.appendChild(tekstContainer);

  // kaart effectief tonen in het preview-grid
  const cell = document.createElement('div');
  cell.className = 'oefening';
  cell.style.overflow = 'visible';
  cell.appendChild(card);

  // gebruik – als die bestaat – dezelfde delete-logica als de andere oefeningen
  if (typeof appendWithDelete === 'function') {
    appendWithDelete(grid, cell, cfg, oef);
  } else {
    grid.appendChild(cell);
  }
}



  // 5) PDF – zelfde zinnen, geen emoji
  function tekenPdf(doc, x, y, oef) {
    const h = 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Ik zie ______ groepen.', x, y);
    doc.text('In elke groep zie ik ______ voorwerpen.', x, y + h);
    doc.text('Dat is ______ + ______ + ______ .', x, y + 2 * h);
    doc.text('Dat is ______ keer ______ .', x, y + 3 * h);
    doc.text('Dat is ______ × ______ .', x, y + 4 * h);
  }

  return {
    genereer,
    renderPreview,
    tekenPdf
  };
})();

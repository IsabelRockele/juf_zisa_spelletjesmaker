// tafels_inzicht_v3.js
// open zinnen + bereik (tot 12 / volledige tafel) + afwisselende afbeeldingen

window.TI = (function () {

  // 1) hulpfunctie: hoeveel keer mag ik deze tafel nemen?
 function maxFactorVoor(tafel, cfg) {
  const bereik = cfg.bereik || '12';   // '12' of 'volledig'

  // volledig = alle tafels t.e.m. 10
  if (bereik === 'volledig') {
    return 10;
  }

  // NIEUW: bij "tot 12" zorgen we dat er max. 12 voorwerpen in totaal zijn
  const maxVoorwerpen = 12;
  const mf = Math.floor(maxVoorwerpen / tafel); // bv. 12 / 5 = 2 → 5×1 en 5×2
  return Math.max(1, Math.min(10, mf));
}


  // 2) maak één oefening
  function maakOefening(cfg) {
    const tafels = (cfg.gekozenTafels && cfg.gekozenTafels.length)
      ? cfg.gekozenTafels
      : [1];

const tafel = tafels[Math.floor(Math.random() * tafels.length)];

// 1) ruwe waarde uit UI of uit localStorage
const rawType = (cfg.tafelType || 'maal').trim();

// 2) ALLE mogelijke schrijfwijzen naar onze 4 bekende types mappen
let typeKeuze;
switch (rawType) {
  case 'maal':
    typeKeuze = 'maal';
    break;

  // gewone delen (we bouwen later)
  case 'delen':
  case 'delen-gewoon':
    typeKeuze = 'delen';
    break;

  // jouw nieuwe keuzes uit de HTML
  case 'delen-ijsberg':
  case 'delen ijsbergversie':
  case 'delen-ijsberg-versie':
    typeKeuze = 'delen';
    break;

  case 'delen-ijsberg-rest':
  case 'delen met rest (ijsberg)':
    typeKeuze = 'delen';
    break;

  // oude werkbladen
  case 'beide':
    typeKeuze = 'beide';
    break;

  default:
    // veiligheid: als we iets geks krijgen, doe dan maar maal
    typeKeuze = 'maal';
    break;
}

// 3) “beide” blijft werken voor oude bestanden
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
  let tries = 0;
  const maxTries = n * 5; // veiligheidsrem

  while (lijst.length < n && tries < maxTries) {
    const oef = maakOefening(cfg);
    tries++;

    // check op dubbels
    const bestaatAl = lijst.some((bestaande) => isZelfdeOefening(bestaande, oef));
    if (!bestaatAl) {
      lijst.push(oef);
    }
    // anders: gewoon nog eens proberen
  }

  return lijst;
}

// vergelijkt 2 tafels-inzicht-oefeningen op inhoud
function isZelfdeOefening(a, b) {
  if (!a || !b) return false;

  // verschillend type → nooit hetzelfde
  if (a.op !== b.op) return false;

  // maal: zelfde tafel & zelfde aantal groepen = zelfde oefening
  if (a.op === 'maal') {
    return a.tafel === b.tafel && a.groepen === b.groepen;
  }

  // delen (ijsberg): zelfde totaal en zelfde groepsgrootte = zelfde oefening
  if (a.op === 'delen') {
    return a.totaal === b.totaal && a.grootte === b.grootte;
  }

  return false;
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

  // --- GROEPEN / TEKENING BOVENAAN ---
const plaat = document.createElement('div');
plaat.style.marginBottom = '10px';

if (oef.op === 'maal') {
  // bij maal tonen we de voorwerpen
  plaat.style.display = 'flex';
  plaat.style.flexWrap = 'wrap';
  plaat.style.gap = '8px';
  for (let g = 0; g < oef.groepen; g++) {
    const groep = document.createElement('div');
    groep.style.border = '2px solid #b6cfff';
    groep.style.borderRadius = '10px';
    groep.style.padding = '6px';
    groep.style.display = 'grid';
    groep.style.placeItems = 'center';
    for (let b = 0; b < oef.grootte; b++) {
      const item = document.createElement('div');
      item.textContent = icoon;
      item.style.fontSize = '28px';
      groep.appendChild(item);
    }
    plaat.appendChild(groep);
  }
} else {
  // IJSBERG-VERSIE DELEN: toon alle voorwerpen los
  const totaal = oef.totaal || (oef.groepen * oef.grootte);
  const max = Math.min(12, totaal);

  plaat.style.display = 'flex';
  plaat.style.flexWrap = 'wrap';
  plaat.style.gap = '6px';
  plaat.style.marginBottom = '10px';

  for (let i = 0; i < max; i++) {
    const item = document.createElement('div');
    item.textContent = icoon;
    item.style.fontSize = '30px';
    item.style.width = '32px';
    item.style.height = '32px';
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.justifyContent = 'center';
    plaat.appendChild(item);
  }
}


card.appendChild(plaat);

// HIER TOEVOEGEN  ⬇️
const groepen = oef.groepen || oef.tafel || 1;
const grootte = oef.grootte || oef.factor || 1;

// --- ZINNEN MET MEER WITRUIMTE ---
const tekstContainer = document.createElement('div');
if (oef.op === 'delen') {
  const totaal  = oef.totaal  || (oef.groepen * oef.grootte);
  const perGroep = oef.grootte || 1;
  const groepen = oef.groepen || 1;

  // maak “8 - ___ - ___ = 0”
  const aftrekStukken = Array.from({ length: groepen }, () => '__').join(' - ');
  const aftrekLijn = `${totaal} - ${aftrekStukken} = 0`;

  tekstContainer.innerHTML = `
    <p>Er zijn ____ ${woord}.</p>
    <p>Ik verdeel in groepen van ${perGroep}.</p>
    <p>${aftrekLijn}</p>
    <p>Ik kan ____ groepen van ${perGroep} maken.</p>
    <p>${totaal} : ${perGroep} = ____</p>
  `;

  card.appendChild(tekstContainer);
  // kaart tonen
  const cell = document.createElement('div');
  cell.className = 'oefening';
  cell.style.overflow = 'visible';
  cell.appendChild(card);

const delFn =
  (window && typeof window.appendWithDelete === 'function')
    ? window.appendWithDelete
    : (typeof appendWithDelete === 'function' ? appendWithDelete : null);

if (delFn) {
  // gebruik de standaard delete uit bewerkingen_werkblad_versie3.js
  delFn(grid, cell, cfg, oef);
} else {
  // ❗ fallback: zelf een kruisje maken
  const btn = document.createElement('button');
  btn.textContent = '×';
  btn.className = 'ti-del-btn';
  btn.style.position = 'absolute';
  btn.style.top = '4px';
  btn.style.right = '4px';
  btn.style.border = 'none';
  btn.style.background = 'transparent';
  btn.style.fontSize = '16px';
  btn.style.cursor = 'pointer';

  btn.addEventListener('click', () => {
    // uit de dataset halen
    if (Array.isArray(cfg._oefeningen)) {
      const ix = cfg._oefeningen.indexOf(oef);
      if (ix > -1) cfg._oefeningen.splice(ix, 1);
    }
    cell.remove();
    if (typeof window.paginatePreview === 'function') {
      window.paginatePreview();
    }
  });

  cell.style.position = 'relative';
  cell.appendChild(btn);
  grid.appendChild(cell);
}

  return; // heel belangrijk: MAAL-zinnen niet meer tekenen
}

if (oef.op === 'delen') {
  // aangepaste invulzinnen voor DEEL-oefeningen
  tekstContainer.innerHTML = `
    <p>Ik heb ____ ${woord}.</p>
    <p>Ik deel ze in ___ groepjes.</p>
    <p>In elk groepje komen ___ ${woord}.</p>
  `;
  card.appendChild(tekstContainer);
  grid.appendChild(card);
  return;
}


tekstContainer.style.display = 'flex';
tekstContainer.style.flexDirection = 'column';
tekstContainer.style.gap = '4px';

// 1. groep/groepen
const z1 = document.createElement('p');
z1.style.margin = '0';
z1.textContent = `Ik zie ____ ${groepen === 1 ? 'groep' : 'groepen'}.`;
tekstContainer.appendChild(z1);

// 2. in elke groep ...
const z2 = document.createElement('p');
z2.style.margin = '0';
z2.textContent = `In elke groep zie ik ____ ${woord}.`;
tekstContainer.appendChild(z2);

// 3. plus-lijn: aantal-afhankelijk
if (groepen <= 4) {
  const stukjes = Array.from({ length: groepen }, () => '___');
  const z3 = document.createElement('p');
  z3.style.margin = '0';
  z3.textContent = 'Dat is ' + stukjes.join(' + ') + ' .';
  tekstContainer.appendChild(z3);
} else {
  const eerste = Array.from({ length: 4 }, () => '___').join(' + ');
  const z3 = document.createElement('p');
  z3.style.margin = '0';
  z3.textContent = 'Dat is ' + eerste + ' +';
  tekstContainer.appendChild(z3);

  const rest = Array.from({ length: groepen - 4 }, () => '___').join(' + ');
  const z4 = document.createElement('p');
  z4.style.margin = '0';
  z4.textContent = rest + ' .';
  tekstContainer.appendChild(z4);
}

// 4. keer- en maal-lijn met echte groepsgrootte
const zKeer = document.createElement('p');
zKeer.style.margin = '0';
zKeer.textContent = `Dat is ____ keer ${grootte} .`;
tekstContainer.appendChild(zKeer);

const zMaal = document.createElement('p');
zMaal.style.margin = '0';
zMaal.textContent = `Dat is ____ × ${grootte} .`;
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

  if (oef.op === 'delen') {
    const totaal   = oef.totaal  || (oef.groepen * oef.grootte);
    const perGroep = oef.grootte || 1;
    const groepen  = oef.groepen || 1;

    // lijn “8 - ____ - ____ = 0”
    let lijn = `${totaal}`;
    for (let i = 0; i < groepen; i++) {
      lijn += ' - ______';
    }
    lijn += ' = 0';

    doc.text('Er zijn ______ voorwerpen.', x, y);
    doc.text(`Ik verdeel in groepen van ${perGroep}.`, x, y + h);
    doc.text(lijn, x, y + 2 * h);
    doc.text(`Ik kan ______ groepen van ${perGroep} maken.`, x, y + 3 * h);
    doc.text(`${totaal} : ${perGroep} = ______`, x, y + 4 * h);
    return;
  }

  // MAAL (blijft zoals het was)
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

// ============================================
// Tempotoetsen - Oefeningen generator
// ============================================

// --- Hulpfuncties ---
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================
// MAALTAFELS
// ============================================
// config: { tafels: [2,3,...,10], richting: 'ax' | 'xa' | 'beide' }
function genereerMaaltafel(config) {
  const tafel = pickFrom(config.tafels);
  const factor = randInt(1, 10);

  let a, b;
  if (config.richting === 'ax') {
    a = tafel; b = factor; // bv. 5 × 2
  } else if (config.richting === 'xa') {
    a = factor; b = tafel; // bv. 2 × 5
  } else {
    // beide: random
    if (Math.random() < 0.5) { a = tafel; b = factor; }
    else { a = factor; b = tafel; }
  }

  return {
    vraag: `${a} × ${b}`,
    antwoord: a * b
  };
}

// ============================================
// DEELTAFELS
// ============================================
// config: { tafels: [2,3,...,10] }
function genereerDeeltafel(config) {
  const tafel = pickFrom(config.tafels);
  const factor = randInt(1, 10);
  const deeltal = tafel * factor;

  return {
    vraag: `${deeltal} : ${tafel}`,
    antwoord: factor
  };
}

// ============================================
// GEMENGD × en :
// ============================================
// config: { tafelsKeer: [...], tafelsDeel: [...], richting: 'ax'|'xa'|'beide' }
function genereerGemengdMaalDeel(config) {
  if (Math.random() < 0.5) {
    return genereerMaaltafel({ tafels: config.tafelsKeer, richting: config.richting });
  } else {
    return genereerDeeltafel({ tafels: config.tafelsDeel });
  }
}

// ============================================
// GETALBEELDEN
// ============================================
// config: { max: 20|100, type: 'mab'|'honderdveld'|'notatie'|'rekenrek'|'mix' }
function genereerGetalbeeld(config) {
  const max = config.max || 100;

  let weergave = config.type || 'mab';
  if (weergave === 'mix') {
    const opties = max <= 20
      ? ['mab', 'honderdveld', 'notatie', 'rekenrek']
      : ['mab', 'honderdveld', 'notatie'];
    weergave = opties[randInt(0, opties.length - 1)];
  }

  // Rekenrek is beperkt tot 20
  if (weergave === 'rekenrek' && max > 20) {
    weergave = 'mab';
  }

  let getal;
  if (weergave === 'notatie') {
    // Voor notatie: vermijd ronde getallen (10, 20, 30...) en getallen <10,
    // want die hebben geen T+E combo en dus geen omdraai-uitdaging.
    // Kies een getal met zowel een tiental als een eenheid.
    if (max <= 20) {
      // 11-19
      getal = randInt(11, 19);
    } else {
      // 11-99, geen veelvouden van 10
      do {
        getal = randInt(11, 99);
      } while (getal % 10 === 0);
    }
  } else {
    getal = randInt(1, max);
  }

  return {
    vraag: { type: 'getalbeeld', weergave, getal },
    antwoord: getal
  };
}

// ============================================
// OPTELLEN / AFTREKKEN TOT 10
// ============================================
// config: { bewerking: 'plus' | 'min' | 'gemengd' }
// patroon: 'plus' of 'min' (voor gemengd, vanuit genereerToets)
function genereerOptelAftrek10(config, patroon) {
  const bewerking = patroon
    || (config.bewerking === 'gemengd'
      ? (Math.random() < 0.5 ? 'plus' : 'min')
      : config.bewerking);

  if (bewerking === 'plus') {
    const a = randInt(0, 10);
    const b = randInt(0, 10 - a);
    return { vraag: `${a} + ${b}`, antwoord: a + b };
  } else {
    const a = randInt(0, 10);
    const b = randInt(0, a);
    return { vraag: `${a} - ${b}`, antwoord: a - b };
  }
}

// ============================================
// OPTELLEN / AFTREKKEN TOT 20
// ============================================
// config: { bewerking: 'plus'|'min'|'gemengd', brug: 'zonder'|'met'|'gemengd' }
function genereerOptelAftrek20(config, patroon) {
  const bewerking = patroon
    || (config.bewerking === 'gemengd'
      ? (Math.random() < 0.5 ? 'plus' : 'min')
      : config.bewerking);

  const brug = config.brug === 'gemengd'
    ? (Math.random() < 0.5 ? 'zonder' : 'met')
    : config.brug;

  if (bewerking === 'plus') {
    return genereerPlusTot20(brug);
  } else {
    return genereerMinTot20(brug);
  }
}

function genereerPlusTot20(brug) {
  // Brug = je gaat over de tien (eenheden a + eenheden b > 10)
  let a, b;
  let pogingen = 0;
  while (pogingen < 50) {
    a = randInt(1, 19);
    b = randInt(1, 20 - a);
    const eenhA = a % 10;
    const eenhB = b % 10;
    const heeftBrug = (eenhA + eenhB > 10) && (eenhA !== 0) && (eenhB !== 0);
    if (brug === 'met' && heeftBrug) break;
    if (brug === 'zonder' && !heeftBrug) break;
    pogingen++;
  }
  return { vraag: `${a} + ${b}`, antwoord: a + b };
}

function genereerMinTot20(brug) {
  // Brug bij aftrekken: eenheden aftrekker > eenheden aftrektal
  let a, b;
  let pogingen = 0;
  while (pogingen < 50) {
    a = randInt(1, 20);
    b = randInt(1, a);
    const eenhA = a % 10;
    const eenhB = b % 10;
    const heeftBrug = (eenhB > eenhA) && (a > 10) && (b <= 10);
    if (brug === 'met' && heeftBrug) break;
    if (brug === 'zonder' && !heeftBrug) break;
    pogingen++;
  }
  return { vraag: `${a} - ${b}`, antwoord: a - b };
}

// ============================================
// OPTELLEN / AFTREKKEN TOT 100
// ============================================
// config: { bewerking: 'plus'|'min'|'gemengd', brug: 'zonder'|'met'|'gemengd' }
function genereerOptelAftrek100(config, patroon) {
  const bewerking = patroon
    || (config.bewerking === 'gemengd'
      ? (Math.random() < 0.5 ? 'plus' : 'min')
      : config.bewerking);

  const brug = config.brug === 'gemengd'
    ? (Math.random() < 0.5 ? 'zonder' : 'met')
    : config.brug;

  if (bewerking === 'plus') {
    return genereerPlusTot100(brug);
  } else {
    return genereerMinTot100(brug);
  }
}

function genereerPlusTot100(brug) {
  let a, b;
  let pogingen = 0;
  while (pogingen < 50) {
    a = randInt(11, 89);
    b = randInt(2, 100 - a);
    const eenhA = a % 10;
    const eenhB = b % 10;
    const heeftBrug = (eenhA + eenhB > 10) && (eenhA !== 0) && (eenhB !== 0);
    if (brug === 'met' && heeftBrug) break;
    if (brug === 'zonder' && !heeftBrug) break;
    pogingen++;
  }
  return { vraag: `${a} + ${b}`, antwoord: a + b };
}

function genereerMinTot100(brug) {
  let a, b;
  let pogingen = 0;
  while (pogingen < 50) {
    a = randInt(11, 99);
    b = randInt(2, a - 1);
    const eenhA = a % 10;
    const eenhB = b % 10;
    const heeftBrug = (eenhB > eenhA);
    if (brug === 'met' && heeftBrug) break;
    if (brug === 'zonder' && !heeftBrug) break;
    pogingen++;
  }
  return { vraag: `${a} - ${b}`, antwoord: a - b };
}

// ============================================
// SPLITSINGEN
// ============================================
// config: {
//   totaal: 5|6|7|8|9|10,  - alle splitsingen tot EN MET dit getal
//   variant: 'top'|'kind'|'mix' - wat ontbreekt
// }
function genereerSplitsing(config) {
  const maxTotaal = config.totaal || 10;
  // Kies random totaal tussen 2 en maxTotaal
  const totaal = randInt(2, maxTotaal);
  // Kies random linker deel tussen 0 en totaal
  const linker = randInt(0, totaal);
  const rechter = totaal - linker;

  // Bepaal welke variant
  let variant = config.variant;
  if (variant === 'mix') {
    const keuzes = ['top', 'links', 'rechts'];
    variant = keuzes[randInt(0, 2)];
  } else if (variant === 'kind') {
    variant = Math.random() < 0.5 ? 'links' : 'rechts';
  }
  // 'top' blijft zoals het is

  let getoond, gevraagd, antwoord;
  if (variant === 'top') {
    getoond = { top: null, links: linker, rechts: rechter };
    gevraagd = 'top';
    antwoord = totaal;
  } else if (variant === 'links') {
    getoond = { top: totaal, links: null, rechts: rechter };
    gevraagd = 'links';
    antwoord = linker;
  } else { // rechts
    getoond = { top: totaal, links: linker, rechts: null };
    gevraagd = 'rechts';
    antwoord = rechter;
  }

  return {
    vraag: { type: 'splitsing', ...getoond, gevraagd },
    antwoord
  };
}
function genereerToets(type, config, aantal = 10) {
  const oefeningen = [];
  const gezien = new Set();
  let veiligheid = 0;

  // Voor gemengd-modi: maak vooraf een balans-patroon (50/50)
  // Patroon bepaalt per oefening welke subtype die moet zijn
  let patroon = null;

  if (type === 'gemengd-maal-deel') {
    // 5 maal, 5 deel, geshuffeld
    patroon = shuffle([
      ...Array(Math.floor(aantal / 2)).fill('maal'),
      ...Array(Math.ceil(aantal / 2)).fill('deel')
    ]);
  } else if (config && config.bewerking === 'gemengd') {
    // 5 plus, 5 min
    patroon = shuffle([
      ...Array(Math.floor(aantal / 2)).fill('plus'),
      ...Array(Math.ceil(aantal / 2)).fill('min')
    ]);
  }

  while (oefeningen.length < aantal && veiligheid < aantal * 15) {
    let oef;
    const idx = oefeningen.length;

    switch (type) {
      case 'maaltafels':
        oef = genereerMaaltafel(config); break;
      case 'deeltafels':
        oef = genereerDeeltafel(config); break;
      case 'gemengd-maal-deel':
        // Gebruik patroon
        if (patroon[idx] === 'maal') {
          oef = genereerMaaltafel({ tafels: config.tafelsKeer, richting: config.richting });
        } else {
          oef = genereerDeeltafel({ tafels: config.tafelsDeel });
        }
        break;
      case 'getalbeelden':
        oef = genereerGetalbeeld(config); break;
      case 'optel-aftrek-10':
        oef = genereerOptelAftrek10(config, patroon ? patroon[idx] : null); break;
      case 'optel-aftrek-20':
        oef = genereerOptelAftrek20(config, patroon ? patroon[idx] : null); break;
      case 'optel-aftrek-100':
        oef = genereerOptelAftrek100(config, patroon ? patroon[idx] : null); break;
      case 'splitsingen':
        oef = genereerSplitsing(config); break;
      default:
        oef = { vraag: '?', antwoord: 0 };
    }

    const sleutel = typeof oef.vraag === 'string'
      ? oef.vraag
      : JSON.stringify(oef.vraag);

    if (!gezien.has(sleutel)) {
      gezien.add(sleutel);
      oefeningen.push(oef);
    }
    veiligheid++;
  }

  // Veiligheidsnet: als we nog geen 10 hebben (te strenge filters), vul aan met duplicaten
  while (oefeningen.length < aantal && oefeningen.length > 0) {
    oefeningen.push(oefeningen[oefeningen.length % Math.max(1, oefeningen.length)]);
  }

  return oefeningen;
}

// Exporteer voor gebruik in het browser-script (window-scope)
window.TempotoetsenGen = {
  genereerToets,
  randInt,
  shuffle
};
// ============================================
// Tempotoetsen - Main script
// ============================================

const isPRO = window.ISPRO === true;

// State
const state = {
  type: 'maaltafels', // actief tabblad
  config: {
    maaltafels: { tafels: [2, 10], richting: 'beide' },
    deeltafels: { tafels: [2, 10] },
    'gemengd-maal-deel': { tafelsKeer: [2, 10], tafelsDeel: [2, 10], richting: 'beide' },
    getalbeelden: { max: 100, type: 'mix' },
    'optel-aftrek-10': { bewerking: 'gemengd' },
    'optel-aftrek-20': { bewerking: 'gemengd', brug: 'gemengd' },
    'optel-aftrek-100': { bewerking: 'gemengd', brug: 'gemengd' },
    splitsingen: { totaal: 10, variant: 'mix' }
  },
  huidigeOefeningen: []
};

// Alle tabbladen zijn beschikbaar in beide versies
function isTypePro(type) {
  return false;
}

// ============================================
// Tabbladen
// ============================================
const tabConfig = [
  { id: 'maaltafels', label: 'Maaltafels' },
  { id: 'deeltafels', label: 'Deeltafels' },
  { id: 'gemengd-maal-deel', label: 'Gemengd × en :' },
  { id: 'splitsingen', label: 'Splitsingen' },
  { id: 'getalbeelden', label: 'Getalbeelden' },
  { id: 'optel-aftrek-10', label: '+ en − tot 10' },
  { id: 'optel-aftrek-20', label: '+ en − tot 20' },
  { id: 'optel-aftrek-100', label: '+ en − tot 100' }
];

function renderTabs() {
  const c = document.getElementById('tabs');
  c.innerHTML = '';
  tabConfig.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (state.type === t.id ? ' actief' : '');
    btn.textContent = t.label;
    if (!isPRO && isTypePro(t.id)) {
      const slot = document.createElement('span');
      slot.className = 'pro-slot';
      slot.textContent = 'PRO';
      btn.appendChild(slot);
    }
    btn.addEventListener('click', () => {
      if (!isPRO && isTypePro(t.id)) {
        toonProInfo();
        return;
      }
      state.type = t.id;
      renderTabs();
      renderConfig();
      updatePreview();
    });
    c.appendChild(btn);
  });
}

function toonProInfo() {
  alert('Dit onderdeel zit in de PRO-versie.\n\nBezoek jufzisa.be voor meer info.');
}

// ============================================
// Configuratie-paneel per type
// ============================================
function renderConfig() {
  const c = document.getElementById('config-paneel');
  const type = state.type;
  const conf = state.config[type];

  let html = `<h2>Instellingen</h2>`;

  if (type === 'maaltafels') {
    html += tafelsChips('Welke maaltafels?', 'maal-tafels', conf.tafels);
    html += radioGroep('Volgorde van de cijfers', 'maal-richting', conf.richting, [
      { v: 'ax', l: 'Tafel × factor (bv. 5 × 2)' },
      { v: 'xa', l: 'Factor × tafel (bv. 2 × 5)' },
      { v: 'beide', l: 'Beide door elkaar' }
    ]);
  }

  else if (type === 'deeltafels') {
    html += tafelsChips('Welke deeltafels?', 'deel-tafels', conf.tafels);
  }

  else if (type === 'gemengd-maal-deel') {
    html += tafelsChips('Welke maaltafels?', 'mix-maal-tafels', conf.tafelsKeer);
    html += tafelsChips('Welke deeltafels?', 'mix-deel-tafels', conf.tafelsDeel);
    html += radioGroep('Volgorde bij × ', 'mix-richting', conf.richting, [
      { v: 'ax', l: 'Tafel × factor' },
      { v: 'xa', l: 'Factor × tafel' },
      { v: 'beide', l: 'Beide' }
    ]);
  }

  else if (type === 'getalbeelden') {
    html += radioGroep('Soort getalbeeld', 'gb-type', conf.type, [
      { v: 'mab', l: 'MAB-materiaal' },
      { v: 'honderdveld', l: '100-veld' },
      { v: 'notatie', l: 'Notatie (4E 7T)' },
      { v: 'rekenrek', l: 'Rekenrek' },
      { v: 'mix', l: 'Alle door elkaar' }
    ]);
    // Rekenrek enkel tot 20
    if (conf.type === 'rekenrek') {
      html += `<div class="config-groep">
        <label>Getalbereik</label>
        <div class="radio-groep">
          <label class="radio-knop">
            <input type="radio" name="gb-max" value="20" checked>
            <span>tot 20</span>
          </label>
        </div>
        <p style="font-size:0.85em;color:var(--grijs);margin-top:6px;">
          Het rekenrek (2 rijen van 10 kralen) werkt tot 20.
        </p>
      </div>`;
      if (conf.max > 20) conf.max = 20;
    } else {
      html += radioGroep('Getalbereik', 'gb-max', String(conf.max), [
        { v: '20', l: 'tot 20' },
        { v: '100', l: 'tot 100' }
      ]);
    }
    html += `<div class="info-strook">
      <strong>💡 Getalbeelden werken enkel in flits-modus en als invulblad</strong>,
      niet als papier-modus (te grafisch voor op papier).
    </div>`;
  }

  else if (type === 'splitsingen') {
    html += radioGroep('Splitsingen tot en met', 'spl-totaal', String(conf.totaal), [
      { v: '5', l: 'tot 5' },
      { v: '6', l: 'tot 6' },
      { v: '7', l: 'tot 7' },
      { v: '8', l: 'tot 8' },
      { v: '9', l: 'tot 9' },
      { v: '10', l: 'tot 10' }
    ]);
    html += radioGroep('Wat ontbreekt?', 'spl-variant', conf.variant, [
      { v: 'top', l: 'Totaal bovenaan (bv. ? = 3+5)' },
      { v: 'kind', l: 'Één getal onderaan' },
      { v: 'mix', l: 'Door elkaar' }
    ]);
    html += `<div class="info-strook">
      💡 <strong>Tot 7</strong> betekent: splitsingen van 2, 3, 4, 5, 6 en 7.
    </div>`;
  }

  else if (type === 'optel-aftrek-10') {
    html += radioGroep('Bewerking', 'opt10-bew', conf.bewerking, [
      { v: 'plus', l: 'Alleen +' },
      { v: 'min', l: 'Alleen −' },
      { v: 'gemengd', l: 'Gemengd' }
    ]);
  }

  else if (type === 'optel-aftrek-20') {
    html += radioGroep('Bewerking', 'opt20-bew', conf.bewerking, [
      { v: 'plus', l: 'Alleen +' },
      { v: 'min', l: 'Alleen −' },
      { v: 'gemengd', l: 'Gemengd' }
    ]);
    html += radioGroep('Brug over het tiental', 'opt20-brug', conf.brug, [
      { v: 'zonder', l: 'Zonder brug' },
      { v: 'met', l: 'Met brug' },
      { v: 'gemengd', l: 'Gemengd' }
    ]);
  }

  else if (type === 'optel-aftrek-100') {
    html += radioGroep('Bewerking', 'opt100-bew', conf.bewerking, [
      { v: 'plus', l: 'Alleen +' },
      { v: 'min', l: 'Alleen −' },
      { v: 'gemengd', l: 'Gemengd' }
    ]);
    html += radioGroep('Brug over het tiental', 'opt100-brug', conf.brug, [
      { v: 'zonder', l: 'Zonder brug' },
      { v: 'met', l: 'Met brug' },
      { v: 'gemengd', l: 'Gemengd' }
    ]);
  }

  c.innerHTML = html;

  // Koppel events
  koppelConfigEvents();
}

function tafelsChips(label, naam, actieve) {
  const opties = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  let html = `<div class="config-groep">
    <label>${label}</label>
    <div class="snelkeuze">
      <button type="button" data-snel="alle" data-groep="${naam}">Alle</button>
      <button type="button" data-snel="geen" data-groep="${naam}">Geen</button>
      <button type="button" data-snel="makkelijk" data-groep="${naam}">2-5-10</button>
    </div>
    <div class="chip-groep" data-groep="${naam}">`;
  opties.forEach(n => {
    const gekozen = actieve.includes(n);
    html += `<label class="chip">
      <input type="checkbox" value="${n}" ${gekozen ? 'checked' : ''} data-naam="${naam}">
      <span>${n}</span>
    </label>`;
  });
  html += `</div></div>`;
  return html;
}

function radioGroep(label, naam, actief, opties) {
  let html = `<div class="config-groep">
    <label>${label}</label>
    <div class="radio-groep">`;
  opties.forEach(o => {
    html += `<label class="radio-knop">
      <input type="radio" name="${naam}" value="${o.v}" ${actief === o.v ? 'checked' : ''}>
      <span>${o.l}</span>
    </label>`;
  });
  html += `</div></div>`;
  return html;
}

function koppelConfigEvents() {
  // Checkboxes (tafels)
  document.querySelectorAll('.chip input[type="checkbox"]').forEach(inp => {
    inp.addEventListener('change', () => {
      const naam = inp.dataset.naam;
      const waarde = parseInt(inp.value, 10);
      updateTafelKeuze(naam, waarde, inp.checked);
      updatePreview();
    });
  });

  // Snelkeuze-knoppen
  document.querySelectorAll('[data-snel]').forEach(btn => {
    btn.addEventListener('click', () => {
      const groep = btn.dataset.groep;
      const kind = btn.dataset.snel;
      const alle = [2, 3, 4, 5, 6, 7, 8, 9, 10];
      let nieuwe;
      if (kind === 'alle') nieuwe = alle;
      else if (kind === 'geen') nieuwe = [];
      else if (kind === 'makkelijk') nieuwe = [2, 5, 10];
      zetTafelKeuze(groep, nieuwe);
      renderConfig();
      updatePreview();
    });
  });

  // Radio
  document.querySelectorAll('.radio-knop input[type="radio"]').forEach(inp => {
    inp.addEventListener('change', () => {
      updateRadio(inp.name, inp.value);
      updatePreview();
    });
  });
}

function updateTafelKeuze(naam, waarde, erbij) {
  const type = state.type;
  const mapping = {
    'maal-tafels': ['maaltafels', 'tafels'],
    'deel-tafels': ['deeltafels', 'tafels'],
    'mix-maal-tafels': ['gemengd-maal-deel', 'tafelsKeer'],
    'mix-deel-tafels': ['gemengd-maal-deel', 'tafelsDeel']
  };
  const [k1, k2] = mapping[naam];
  let lijst = state.config[k1][k2];
  if (erbij) {
    if (!lijst.includes(waarde)) lijst.push(waarde);
  } else {
    lijst = lijst.filter(x => x !== waarde);
  }
  state.config[k1][k2] = lijst.sort((a, b) => a - b);
}

function zetTafelKeuze(naam, nieuwe) {
  const mapping = {
    'maal-tafels': ['maaltafels', 'tafels'],
    'deel-tafels': ['deeltafels', 'tafels'],
    'mix-maal-tafels': ['gemengd-maal-deel', 'tafelsKeer'],
    'mix-deel-tafels': ['gemengd-maal-deel', 'tafelsDeel']
  };
  const [k1, k2] = mapping[naam];
  state.config[k1][k2] = nieuwe;
}

function updateRadio(naam, waarde) {
  const mapping = {
    'maal-richting': ['maaltafels', 'richting', waarde],
    'mix-richting': ['gemengd-maal-deel', 'richting', waarde],
    'gb-type': ['getalbeelden', 'type', waarde],
    'gb-max': ['getalbeelden', 'max', parseInt(waarde, 10)],
    'opt10-bew': ['optel-aftrek-10', 'bewerking', waarde],
    'opt20-bew': ['optel-aftrek-20', 'bewerking', waarde],
    'opt20-brug': ['optel-aftrek-20', 'brug', waarde],
    'opt100-bew': ['optel-aftrek-100', 'bewerking', waarde],
    'opt100-brug': ['optel-aftrek-100', 'brug', waarde],
    'spl-totaal': ['splitsingen', 'totaal', parseInt(waarde, 10)],
    'spl-variant': ['splitsingen', 'variant', waarde]
  };
  const m = mapping[naam];
  if (m) state.config[m[0]][m[1]] = m[2];

  // Als rekenrek gekozen is: forceer max op 20 en re-render config
  if (naam === 'gb-type') {
    if (waarde === 'rekenrek') {
      state.config.getalbeelden.max = 20;
    }
    renderConfig();
  }
}

// ============================================
// Huidige config ophalen
// ============================================
function huidigeConfig() {
  return state.config[state.type];
}

function configGeldig() {
  const type = state.type;
  const conf = huidigeConfig();
  if (type === 'maaltafels' || type === 'deeltafels') {
    return conf.tafels.length > 0;
  }
  if (type === 'gemengd-maal-deel') {
    return conf.tafelsKeer.length > 0 && conf.tafelsDeel.length > 0;
  }
  return true;
}

// ============================================
// Preview
// ============================================
function updatePreview() {
  if (!configGeldig()) {
    document.getElementById('preview').innerHTML =
      '<p style="color:var(--roze);font-weight:700;">Kies minstens één tafel om verder te gaan.</p>';
    return;
  }

  const oefeningen = window.TempotoetsenGen.genereerToets(state.type, huidigeConfig(), 10);
  state.huidigeOefeningen = oefeningen;

  let html = `<h3>Voorbeeld van 10 oefeningen</h3><div class="preview-lijst">`;
  oefeningen.forEach((o, i) => {
    let vraag;
    if (typeof o.vraag === 'string') {
      vraag = o.vraag;
    } else if (o.vraag.type === 'splitsing') {
      const t = o.vraag.top === null ? '?' : o.vraag.top;
      const l = o.vraag.links === null ? '?' : o.vraag.links;
      const r = o.vraag.rechts === null ? '?' : o.vraag.rechts;
      vraag = `${t} = ${l}+${r}`;
    } else if (o.vraag.type === 'getalbeeld') {
      vraag = `getalbeeld (${o.antwoord})`;
    } else {
      vraag = '?';
    }
    html += `<div class="preview-item">
      <span><span class="nr">${i + 1}.</span> ${vraag}</span>
      <span class="ant">= ${o.antwoord}</span>
    </div>`;
  });
  html += `</div>
    <div class="knop-rij">
      <button class="knop knop-secundair" onclick="updatePreview()">🔄 Nieuwe voorbeelden</button>
    </div>`;
  document.getElementById('preview').innerHTML = html;
}

// ============================================
// FLITS-MODUS
// ============================================
function startFlitsModus() {
  if (!configGeldig()) { alert('Kies eerst je instellingen.'); return; }

  const oefeningen = window.TempotoetsenGen.genereerToets(state.type, huidigeConfig(), 10);

  const overlay = document.createElement('div');
  overlay.className = 'flits-overlay';
  overlay.innerHTML = `
    <button class="flits-sluit" aria-label="Sluiten">×</button>
    <div class="flits-start">
      <h2>Klaar om te flitsen?</h2>
      <p>Elke oefening blijft <span id="flits-duur-toon">6</span> seconden in beeld.</p>
      <div class="knop-rij" style="justify-content:center;">
        <label style="display:flex;align-items:center;gap:8px;font-weight:700;">
          Tijd per oefening:
          <select id="flits-duur-kies" style="padding:8px;border-radius:8px;border:2px solid var(--grijs-licht);font-family:inherit;font-weight:700;">
            <option value="3">3 sec</option>
            <option value="4">4 sec</option>
            <option value="5">5 sec</option>
            <option value="6" selected>6 sec</option>
            <option value="8">8 sec</option>
            <option value="10">10 sec</option>
          </select>
        </label>
      </div>
      <div class="knop-rij" style="justify-content:center;margin-top:20px;">
        <button class="knop knop-primair" id="flits-go">▶ Start!</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('.flits-sluit').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#flits-duur-kies').addEventListener('change', e => {
    overlay.querySelector('#flits-duur-toon').textContent = e.target.value;
  });
  overlay.querySelector('#flits-go').addEventListener('click', () => {
    const duur = parseInt(overlay.querySelector('#flits-duur-kies').value, 10);
    flitsLoop(overlay, oefeningen, duur);
  });
}

function flitsLoop(overlay, oefeningen, duurSec) {
  let idx = 0;
  let gepauzeerd = false;
  let balkInt, volgendeTO;
  let startTijdstip;
  let verstreken = 0; // ms verstreken voor huidige vraag

  overlay.innerHTML = `
    <button class="flits-sluit" aria-label="Sluiten">×</button>
    <div class="flits-topbalk">
      <div class="flits-teller"><span id="teller-huidig">1</span> / ${oefeningen.length}</div>
    </div>
    <div id="flits-inhoud"></div>
    <div class="flits-bediening">
      <button class="flits-bedien-knop" id="flits-vorige" title="Vorige">◀</button>
      <button class="flits-bedien-knop flits-pauze" id="flits-pauze" title="Pauze">⏸</button>
      <button class="flits-bedien-knop" id="flits-volgende" title="Volgende">▶</button>
    </div>
    <div class="flits-voortgang"><div class="flits-voortgang-balk" id="balk"></div></div>
  `;

  const inhoud = overlay.querySelector('#flits-inhoud');
  const teller = overlay.querySelector('#teller-huidig');
  const balk = overlay.querySelector('#balk');
  const pauzeKnop = overlay.querySelector('#flits-pauze');

  function stopTimers() {
    clearInterval(balkInt);
    clearTimeout(volgendeTO);
  }

  overlay.querySelector('.flits-sluit').addEventListener('click', () => {
    stopTimers();
    overlay.remove();
  });

  overlay.querySelector('#flits-vorige').addEventListener('click', () => {
    if (idx > 0) { idx--; toon(idx); }
  });

  overlay.querySelector('#flits-volgende').addEventListener('click', () => {
    if (idx < oefeningen.length) { idx++; toon(idx); }
  });

  pauzeKnop.addEventListener('click', () => {
    if (gepauzeerd) {
      // Hervatten
      gepauzeerd = false;
      pauzeKnop.textContent = '⏸';
      pauzeKnop.title = 'Pauze';
      hervatTimer();
    } else {
      // Pauzeren
      gepauzeerd = true;
      pauzeKnop.textContent = '▶';
      pauzeKnop.title = 'Hervatten';
      verstreken += Date.now() - startTijdstip;
      stopTimers();
    }
  });

  function hervatTimer() {
    startTijdstip = Date.now();
    const resterendMs = duurSec * 1000 - verstreken;
    balkInt = setInterval(() => {
      const totaalVerstreken = verstreken + (Date.now() - startTijdstip);
      const pct = Math.min(100, (totaalVerstreken / (duurSec * 1000)) * 100);
      balk.style.width = pct + '%';
      if (pct >= 100) clearInterval(balkInt);
    }, 50);
    volgendeTO = setTimeout(() => {
      idx++;
      toon(idx);
    }, Math.max(0, resterendMs));
  }

  function toon(i) {
    stopTimers();
    verstreken = 0;

    if (i >= oefeningen.length) {
      inhoud.innerHTML = `
        <div class="flits-klaar">
          <div class="icoon">🎉</div>
          <h2>Klaar!</h2>
          <p style="font-size:1.1rem;color:var(--grijs);margin-bottom:24px;">
            Vergelijk de antwoorden en verbeter samen.
          </p>
          <div class="knop-rij" style="justify-content:center;">
            <button class="knop knop-secundair" id="toon-antw">Antwoorden tonen</button>
            <button class="knop knop-primair" id="opnieuw">Opnieuw</button>
          </div>
        </div>`;
      overlay.querySelector('.flits-voortgang').style.display = 'none';
      overlay.querySelector('.flits-topbalk').style.display = 'none';
      overlay.querySelector('.flits-bediening').style.display = 'none';

      overlay.querySelector('#opnieuw').addEventListener('click', () => {
        overlay.remove();
        startFlitsModus();
      });
      overlay.querySelector('#toon-antw').addEventListener('click', () => {
        toonAntwoordenlijst(overlay, oefeningen);
      });
      return;
    }

    const oef = oefeningen[i];
    teller.textContent = i + 1;

    if (typeof oef.vraag === 'string') {
      inhoud.innerHTML = `<div class="flits-vraag">${oef.vraag}</div>`;
    } else if (oef.vraag.type === 'getalbeeld') {
      inhoud.innerHTML = renderGetalbeeldHTML(oef.vraag);
    } else if (oef.vraag.type === 'splitsing') {
      inhoud.innerHTML = renderSplitsingHTML(oef.vraag);
    }

    balk.style.width = '0%';

    if (!gepauzeerd) {
      hervatTimer();
    }
  }

  toon(0);
}

function toonAntwoordenlijst(overlay, oefeningen) {
  const inhoud = overlay.querySelector('#flits-inhoud');
  let html = `<div style="background:white;padding:28px;border-radius:22px;max-width:500px;max-height:70vh;overflow:auto;box-shadow:var(--shadow-lg);">
    <h2 style="color:var(--paars);margin-bottom:16px;">Antwoorden</h2>
    <ol style="list-style:decimal;padding-left:24px;font-size:1.1rem;line-height:1.8;">`;
  oefeningen.forEach(o => {
    const v = typeof o.vraag === 'string' ? o.vraag : `getalbeeld`;
    html += `<li><strong>${v}</strong> = <span style="color:var(--groen);font-weight:700;">${o.antwoord}</span></li>`;
  });
  html += `</ol>
    <div class="knop-rij" style="justify-content:flex-end;margin-top:16px;">
      <button class="knop knop-primair" onclick="this.closest('.flits-overlay').remove()">Sluiten</button>
    </div>
  </div>`;
  inhoud.innerHTML = html;
}

function renderGetalbeeldHTML(vraag) {
  const getal = vraag.getal;
  if (vraag.weergave === 'rekenrek') {
    return renderRekenrekHTML(getal);
  }
  if (vraag.weergave === 'honderdveld') {
    return renderHonderdveldHTML(getal);
  }
  if (vraag.weergave === 'notatie') {
    return renderNotatieHTML(getal);
  }
  return renderMABHTML(getal);
}

function renderMABHTML(getal) {
  const tientallen = Math.floor(getal / 10);
  const eenheden = getal % 10;
  let html = `<div class="getalbeeld-wrap"><div class="getalbeeld-mab">`;
  for (let i = 0; i < tientallen; i++) {
    html += `<div class="mab-tiental"></div>`;
  }
  if (eenheden > 0) {
    html += `<div class="mab-eenheden">`;
    for (let i = 0; i < eenheden; i++) {
      html += `<div class="mab-eenheid"></div>`;
    }
    html += `</div>`;
  }
  html += `</div></div>`;
  return html;
}

function renderHonderdveldHTML(getal) {
  // Als getal ≤ 20: 20-veld (2 rijen × 10) — compacter en duidelijker voor kleine getallen
  // Anders: 100-veld (10×10)
  const isTwintigVeld = getal <= 20;
  const totaalRijen = isTwintigVeld ? 2 : 10;

  const tientallen = Math.floor(getal / 10);
  const eenheden = getal % 10;

  let html = `<div class="getalbeeld-wrap"><div class="honderdveld ${isTwintigVeld ? 'twintigveld' : ''}">`;

  // Rij 0 bovenaan, totaalRijen-1 onderaan
  // Eenheden staan op onderste rij, tientallen op rijen daarboven
  for (let rij = 0; rij < totaalRijen; rij++) {
    const vanafOnder = (totaalRijen - 1) - rij;

    html += `<div class="honderdveld-rij">`;
    for (let k = 0; k < 10; k++) {
      let kleur = 'leeg';
      if (vanafOnder === 0) {
        // Onderste rij
        if (eenheden > 0) {
          // Er zijn eenheden: toon ze geel
          if (k < eenheden) kleur = 'geel';
        } else if (tientallen > totaalRijen - 1) {
          // Geen eenheden maar wel "te veel" tientallen voor de bovenste rijen
          // → onderste rij vormt een extra tiental
          kleur = 'groen';
        }
      } else {
        // Hogere rijen: vol groen als binnen tientallen-bereik
        if (vanafOnder <= tientallen) kleur = 'groen';
      }
      html += `<div class="honderdveld-vak ${kleur}"></div>`;
    }
    html += `</div>`;
  }
  html += `</div></div>`;
  return html;
}

function renderNotatieHTML(getal) {
  const tientallen = Math.floor(getal / 10);
  const eenheden = getal % 10;

  // Twee weergaven: "4E 7T" of "7T 4E" - randomize welke eerst komt
  const eenhEerst = Math.random() < 0.5;

  let parts = [];
  if (eenhEerst) {
    if (eenheden > 0) parts.push(`<span class="notatie-eenh">${eenheden}E</span>`);
    if (tientallen > 0) parts.push(`<span class="notatie-tient">${tientallen}T</span>`);
  } else {
    if (tientallen > 0) parts.push(`<span class="notatie-tient">${tientallen}T</span>`);
    if (eenheden > 0) parts.push(`<span class="notatie-eenh">${eenheden}E</span>`);
  }

  // Als getal onder 10: alleen eenheden, anders zelfs 0T verbergen
  if (tientallen === 0) {
    parts = [`<span class="notatie-eenh">${eenheden}E</span>`];
  }
  if (eenheden === 0) {
    parts = [`<span class="notatie-tient">${tientallen}T</span>`];
  }

  return `<div class="getalbeeld-wrap"><div class="notatie">${parts.join(' ')}</div></div>`;
}

function renderSplitsingHTML(vraag) {
  const t = vraag.top === null ? '?' : vraag.top;
  const l = vraag.links === null ? '?' : vraag.links;
  const r = vraag.rechts === null ? '?' : vraag.rechts;

  return `
    <div class="splitsing-wrap">
      <div class="splitsing-top ${vraag.top === null ? 'leeg' : ''}">${t}</div>
      <svg class="splitsing-v" viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
        <line x1="100" y1="0" x2="25" y2="80" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <line x1="100" y1="0" x2="175" y2="80" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      </svg>
      <div class="splitsing-kinderen">
        <div class="splitsing-kind ${vraag.links === null ? 'leeg' : ''}">${l}</div>
        <div class="splitsing-kind ${vraag.rechts === null ? 'leeg' : ''}">${r}</div>
      </div>
    </div>
  `;
}

function renderRekenrekHTML(getal) {
  // Rekenrek tot 20 = 2 rijen van 10 kralen (5 rood + 5 wit per rij)
  const totaalRijen = 2;
  let overGetal = getal;
  let html = `<div class="getalbeeld-wrap"><div class="rekenrek">`;
  for (let r = 0; r < totaalRijen; r++) {
    const opDezeRij = Math.min(10, overGetal);
    overGetal -= opDezeRij;
    html += `<div class="rekenrek-rij">`;
    for (let k = 0; k < 10; k++) {
      const kleur = k < 5 ? 'rood' : 'wit';
      const actief = k < opDezeRij;
      const opacity = actief ? 1 : 0.18;
      html += `<div class="kraal ${kleur}" style="opacity:${opacity};"></div>`;
    }
    html += `</div>`;
  }
  html += `</div></div>`;
  return html;
}

// Tekent een splitsing in de PDF op positie (centerX, centerY) met max breedte en hoogte
// Tekent een splitsing in de PDF op positie (centerX, centerY) met max breedte en hoogte
// Gebruikt voor het dagblad (grote boompjes, 2×5)
function tekenSplitsingOpPdf(doc, vraag, centerX, centerY, maxBreedte, maxHoogte, nummer, modus) {
  // Voor dagblad: A4 portrait, 2×5 raster
  // Beschikbare ruimte per splitsing: ~90mm × 45mm
  // We willen grote duidelijke boompjes

  // Cirkel: groot genoeg zodat ze goed leesbaar zijn op papier
  // 3 cirkels moeten passen in de breedte: kindLeft + vSpan + kindRight + marge
  // Met vSpan = 3.5*cirkelR en 3 cirkels van diameter 2*cirkelR past het in 7.5*cirkelR
  // Dus cirkelR ≤ maxBreedte/7.5 als we losstaande cirkels willen
  // Maar we willen ook grote cirkels, dus we gaan voor ~12mm maar tolereren minder afstand
  const cirkelR = Math.min(maxBreedte / 5.5, maxHoogte / 4, 13);
  const vSpan = cirkelR * 3.2;   // afstand tussen kinderen
  const vHeight = cirkelR * 3.6; // verticale afstand top-kind

  const topY = centerY - vHeight / 2 + cirkelR * 0.2;
  const kindY = centerY + vHeight / 2 + cirkelR * 0.2;
  const kindLinksX = centerX - vSpan / 2;
  const kindRechtsX = centerX + vSpan / 2;

  // Nummer linksboven, buiten de splitsing
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(140, 140, 140);
  doc.text(`${nummer}.`, centerX - maxBreedte / 2 + 2, topY - cirkelR - 1);

  tekenSplitsingElementen(doc, { top: topY, kindY, left: kindLinksX, right: kindRechtsX, cx: centerX }, vraag, cirkelR, 'cirkel');
}

// Tekent een mini-boompje in smalle kolom (voor weekblad)
// Het ontbrekende getal wordt getoond als een leeg VIERKANT vakje waar kinderen kunnen invullen
function tekenMiniSplitsing(doc, vraag, centerX, centerY, maxBreedte, maxHoogte) {
  // Zeer compact voor smalle weekblad-kolom
  const cirkelR = Math.min(maxBreedte * 0.14, maxHoogte * 0.17, 5.5);
  const vSpan = cirkelR * 4;
  const vHeight = cirkelR * 3;

  const topY = centerY - vHeight / 2;
  const kindY = centerY + vHeight / 2;
  const kindLinksX = centerX - vSpan / 2;
  const kindRechtsX = centerX + vSpan / 2;

  tekenSplitsingElementen(doc, { top: topY, kindY, left: kindLinksX, right: kindRechtsX, cx: centerX }, vraag, cirkelR, 'vakje');
}

// Gedeelde teken-logica - variant 'cirkel' (dagblad) of 'vakje' (weekblad)
function tekenSplitsingElementen(doc, pos, vraag, cirkelR, vorm) {
  const { top: topY, kindY, left: kindLinksX, right: kindRechtsX, cx: centerX } = pos;

  // V-lijnen
  doc.setDrawColor(107, 76, 155);
  doc.setLineWidth(vorm === 'cirkel' ? 1.1 : 0.7);
  doc.line(centerX, topY + cirkelR, kindLinksX, kindY - cirkelR);
  doc.line(centerX, topY + cirkelR, kindRechtsX, kindY - cirkelR);

  // Teken 3 elementen
  function tekenElement(x, y, waarde, ontbrekend) {
    if (ontbrekend) {
      // Leeg vakje (rechthoekig, waar kind in schrijft) - duidelijker dan gestippelde cirkel
      doc.setDrawColor(107, 76, 155);
      doc.setLineWidth(vorm === 'cirkel' ? 0.8 : 0.5);
      doc.setFillColor(255, 255, 255);
      const vakBreedte = cirkelR * 2;
      const vakHoogte = cirkelR * 2;
      doc.roundedRect(x - vakBreedte/2, y - vakHoogte/2, vakBreedte, vakHoogte, 1, 1, 'FD');
    } else {
      // Gevulde cirkel met waarde
      doc.setDrawColor(107, 76, 155);
      doc.setLineWidth(vorm === 'cirkel' ? 1.1 : 0.7);
      doc.setFillColor(255, 255, 255);
      doc.circle(x, y, cirkelR, 'FD');

      // Groter font, perfect gecentreerd met baseline:'middle'
      const fontSize = cirkelR * (vorm === 'cirkel' ? 2.6 : 2.3);
      doc.setTextColor(107, 76, 155);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fontSize);
      doc.text(String(waarde), x, y, { align: 'center', baseline: 'middle' });
    }
  }

  tekenElement(centerX, topY, vraag.top, vraag.top === null);
  tekenElement(kindLinksX, kindY, vraag.links, vraag.links === null);
  tekenElement(kindRechtsX, kindY, vraag.rechts, vraag.rechts === null);
}

// ============================================
// PDF-EXPORT (papier-modus en antwoordblad-modus)
// ============================================
function maakPdfPapier() {
  if (!configGeldig()) { alert('Kies eerst je instellingen.'); return; }
  const oefeningen = window.TempotoetsenGen.genereerToets(state.type, huidigeConfig(), 10);

  // Voor getalbeelden: alleen als Flits/smartbord werkbaar is — val terug op invulblad
  if (state.type === 'getalbeelden') {
    alert('Getalbeelden kunnen enkel in flits-modus of op het smartbord getoond worden.\nVoor papier krijg je een antwoordblad om samen op te lossen.');
    maakPdfAntwoordblad(true);
    return;
  }

  genereerPdf({
    titel: toetsTitel(),
    oefeningen,
    modus: 'papier'
  });
}

function maakPdfAntwoordblad(forceerGetalbeeld = false) {
  genereerPdf({
    titel: toetsTitel(),
    oefeningen: forceerGetalbeeld
      ? Array(10).fill({ vraag: '', antwoord: '' })
      : (state.huidigeOefeningen.length ? state.huidigeOefeningen : window.TempotoetsenGen.genereerToets(state.type, huidigeConfig(), 10)),
    modus: 'antwoordblad'
  });
}

function toetsTitel() {
  const labels = {
    'maaltafels': 'Tempotoets — Maaltafels',
    'deeltafels': 'Tempotoets — Deeltafels',
    'gemengd-maal-deel': 'Tempotoets — × en :',
    'getalbeelden': 'Tempotoets — Getalbeelden',
    'optel-aftrek-10': 'Tempotoets — + en − tot 10',
    'optel-aftrek-20': 'Tempotoets — + en − tot 20',
    'optel-aftrek-100': 'Tempotoets — + en − tot 100',
    'splitsingen': 'Tempotoets — Splitsingen'
  };
  return labels[state.type] || 'Tempotoets';
}

function genereerPdf({ titel, oefeningen, modus }) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const breedte = 210;
  const hoogte = 297;
  const marge = 18;

  // --- Header ---
  doc.setFillColor(245, 159, 59); // oranje
  doc.rect(0, 0, breedte, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(titel, marge, 18);

  // Naam + datum lijn
  doc.setTextColor(45, 42, 38);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Naam:', marge, 42);
  doc.line(marge + 14, 42, 100, 42);
  doc.text('Datum:', 115, 42);
  doc.line(115 + 16, 42, breedte - marge, 42);

  // --- Instructie in een kader ---
  const instructie = modus === 'papier'
    ? 'Je hebt 1 minuut. Klaar? Start!'
    : 'Schrijf hieronder het antwoord van elke oefening op.';

  const instrY = 56;
  const instrHoogte = 12;
  // Zacht oranje/crème achtergrond
  doc.setFillColor(253, 236, 212); // oranje-licht
  doc.setDrawColor(245, 159, 59); // oranje
  doc.setLineWidth(0.5);
  doc.roundedRect(marge, instrY, breedte - marge * 2, instrHoogte, 3, 3, 'FD');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(197, 122, 28); // oranje-diep
  doc.text(instructie, marge + 6, instrY + 7.8);

  // --- Oefeningen grid ---
  const isSplitsingen = oefeningen.length > 0
    && typeof oefeningen[0].vraag === 'object'
    && oefeningen[0].vraag.type === 'splitsing';

  if (isSplitsingen) {
    // Splitsingen: 2 rijen × 5 kolommen
    const startY = 68;
    const kolomBreedte = (breedte - marge * 2) / 5;
    const rijHoogte = (hoogte - startY - 20) / 2;

    oefeningen.forEach((o, i) => {
      const kolom = i % 5;
      const rij = Math.floor(i / 5);
      const centerX = marge + kolom * kolomBreedte + kolomBreedte / 2;
      const centerY = startY + rij * rijHoogte + rijHoogte / 2;
      tekenSplitsingOpPdf(doc, o.vraag, centerX, centerY, kolomBreedte * 0.85, rijHoogte * 0.75, i + 1, modus);
    });
  } else {
    const startY = 82;
    const regelHoogte = 20;
    const kolomBreedte = (breedte - marge * 2) / 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(45, 42, 38);

    oefeningen.forEach((o, i) => {
      const kolom = i < 5 ? 0 : 1;
      const rij = i % 5;
      const x = marge + kolom * kolomBreedte;
      const y = startY + rij * regelHoogte;

      // Nummer
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(160, 160, 160);
      doc.text(`${i + 1}.`, x, y);

      // Vraag
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(45, 42, 38);

      const vraagText = typeof o.vraag === 'string' ? o.vraag : '___';

      if (modus === 'papier') {
        doc.text(vraagText + '  =', x + 8, y);
        // Invulvak
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.4);
        const vakX = x + 50;
        doc.line(vakX, y + 1, vakX + 22, y + 1);
    } else {
      // antwoordblad: alleen nummer + lijntje
      doc.text('_________________', x + 8, y);
    }
  });
  } // end else (niet-splitsingen)

  // --- Footer ---
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text('juf Zisa · jufzisa.be', marge, hoogte - 10);

  // Antwoorden-pagina (optioneel)
  if (modus === 'papier' || modus === 'antwoordblad') {
    doc.addPage();
    doc.setFillColor(107, 76, 155); // paars
    doc.rect(0, 0, breedte, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Antwoordenblad — ' + titel, marge, 16);

    doc.setTextColor(45, 42, 38);
    doc.setFontSize(12);

    const antKolomBreedte = (breedte - marge * 2) / 2;
    const antRegelHoogte = 20;
    let antY = 40;

    oefeningen.forEach((o, i) => {
      const kolom = i < 5 ? 0 : 1;
      const rij = i % 5;
      const x = marge + kolom * antKolomBreedte;
      const y = antY + rij * antRegelHoogte;

      // Bouw vraagstring (ook voor splitsingen / getalbeelden)
      let vraagText;
      if (typeof o.vraag === 'string') {
        vraagText = o.vraag;
      } else if (o.vraag.type === 'splitsing') {
        const t = o.vraag.top === null ? '?' : o.vraag.top;
        const l = o.vraag.links === null ? '?' : o.vraag.links;
        const r = o.vraag.rechts === null ? '?' : o.vraag.rechts;
        vraagText = `${t} = ${l}+${r}`;
      } else if (o.vraag.type === 'getalbeeld') {
        vraagText = `getalbeeld (${o.antwoord})`;
      } else {
        vraagText = '?';
      }

      // Vraag deel
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(45, 42, 38);
      const vraagStr = `${i + 1}.  ${vraagText}  =  `;
      doc.text(vraagStr, x, y);

      // Antwoord direct achter "=" (gebruik text-width)
      const breedteVraag = doc.getTextWidth(vraagStr);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(122, 182, 72);
      doc.text(String(o.antwoord), x + breedteVraag, y);
      doc.setTextColor(45, 42, 38);
    });
  }

  doc.save(`${titel.replace(/—/g, '-')}.pdf`);
}

// ============================================
// WEEKBLAD
// ============================================
const weekdagen = [
  { id: 'ma', label: 'Maandag' },
  { id: 'di', label: 'Dinsdag' },
  { id: 'wo', label: 'Woensdag' },
  { id: 'do', label: 'Donderdag' },
  { id: 'vr', label: 'Vrijdag' }
];

// State voor weekblad: per dag { actief, type, configOverschrijven, config }
const weekState = {
  ma: { actief: true, type: 'maaltafels', overschrijf: false, config: null },
  di: { actief: true, type: 'maaltafels', overschrijf: false, config: null },
  wo: { actief: true, type: 'maaltafels', overschrijf: false, config: null },
  do: { actief: true, type: 'maaltafels', overschrijf: false, config: null },
  vr: { actief: true, type: 'maaltafels', overschrijf: false, config: null }
};

function openWeekbladDialoog() {
  // Initialiseer: standaard gebruikt het actieve tab-type
  weekdagen.forEach(d => {
    if (!weekState[d.id].type) weekState[d.id].type = state.type;
  });

  const overlay = document.createElement('div');
  overlay.className = 'week-overlay';
  overlay.innerHTML = `
    <div class="week-dialoog">
      <button class="week-sluit" aria-label="Sluiten">×</button>
      <h2>📅 Weekblad samenstellen</h2>
      <p class="week-intro">Kies welke dagen op het blad komen en welk oefeningtype per dag.</p>

      <div class="config-groep">
        <label for="week-van-input" style="font-weight:700;display:block;margin-bottom:6px;">Week van <span style="font-weight:400;color:var(--grijs);font-size:0.9em;">(optioneel — laat leeg voor invullijn)</span></label>
        <input type="text" id="week-van-input" class="week-van-input" placeholder="bv. 5 mei 2026" value="${weekState.weekVan || ''}">
      </div>

      <div class="config-groep">
        <label style="font-weight:700;display:block;margin-bottom:6px;">Soort blad</label>
        <div class="radio-groep" id="week-modus-groep">
          <label class="radio-knop">
            <input type="radio" name="week-modus" value="oefeningen" ${(weekState.modus || 'oefeningen') === 'oefeningen' ? 'checked' : ''}>
            <span>📄 Met oefeningen (op papier)</span>
          </label>
          <label class="radio-knop">
            <input type="radio" name="week-modus" value="invulblad" ${weekState.modus === 'invulblad' ? 'checked' : ''}>
            <span>📝 Invulblad (leeg, bij flitsen op smartbord)</span>
          </label>
        </div>
      </div>

      <h3 style="color:var(--paars);margin-top:18px;margin-bottom:10px;font-size:1.05rem;">Dagen</h3>
      <div class="week-dagen-lijst" id="week-dagen-lijst"></div>

      <div class="week-knop-rij">
        <button class="knop knop-secundair" id="week-annuleer">Annuleren</button>
        <button class="knop knop-primair" id="week-genereer">📄 Weekblad maken</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  renderWeekDagen();

  // Input events
  overlay.querySelector('#week-van-input').addEventListener('input', (e) => {
    weekState.weekVan = e.target.value;
  });
  overlay.querySelectorAll('input[name="week-modus"]').forEach(r => {
    r.addEventListener('change', (e) => {
      weekState.modus = e.target.value;
      // Update knop-tekst
      const btn = overlay.querySelector('#week-genereer');
      btn.textContent = e.target.value === 'invulblad'
        ? '📝 Invulblad maken'
        : '📄 Weekblad maken';
    });
  });

  overlay.querySelector('.week-sluit').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#week-annuleer').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#week-genereer').addEventListener('click', () => {
    if (maakWeekbladPdf()) overlay.remove();
  });

  // Sluit bij klik buiten de dialoog
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

function renderWeekDagen() {
  const c = document.getElementById('week-dagen-lijst');
  let html = '';

  weekdagen.forEach(d => {
    const st = weekState[d.id];
    const typeLabels = {
      'maaltafels': 'Maaltafels',
      'deeltafels': 'Deeltafels',
      'gemengd-maal-deel': 'Gemengd × en :',
      'splitsingen': 'Splitsingen',
      'getalbeelden': 'Getalbeelden',
      'optel-aftrek-10': '+ en − tot 10',
      'optel-aftrek-20': '+ en − tot 20',
      'optel-aftrek-100': '+ en − tot 100'
    };

    html += `<div class="week-dag ${st.actief ? 'actief' : 'inactief'}" data-dag="${d.id}">
      <label class="week-dag-hoofd">
        <input type="checkbox" ${st.actief ? 'checked' : ''} data-dag-actief="${d.id}">
        <span class="week-dag-label">${d.label}</span>
      </label>
      <div class="week-dag-instellingen" ${st.actief ? '' : 'style="display:none;"'}>
        <label class="week-dag-type-label">Oefeningtype:</label>
        <select class="week-dag-type" data-dag-type="${d.id}">
          ${Object.entries(typeLabels).map(([v, l]) =>
            `<option value="${v}" ${st.type === v ? 'selected' : ''}>${l}</option>`
          ).join('')}
        </select>
      </div>
    </div>`;
  });

  html += `<p class="week-hint">
    💡 Tip: de oefeningen voor elke dag gebruiken de <strong>huidige instellingen</strong> van dat oefeningtype
    (welke tafels, met/zonder brug, ...). Pas die eerst aan in het hoofdscherm als je dat wil wijzigen.
  </p>`;

  c.innerHTML = html;

  // Events
  c.querySelectorAll('[data-dag-actief]').forEach(cb => {
    cb.addEventListener('change', () => {
      const dag = cb.dataset.dagActief;
      weekState[dag].actief = cb.checked;
      renderWeekDagen();
    });
  });
  c.querySelectorAll('[data-dag-type]').forEach(sel => {
    sel.addEventListener('change', () => {
      const dag = sel.dataset.dagType;
      weekState[dag].type = sel.value;
    });
  });
}

function maakWeekbladPdf() {
  // Verzamel actieve dagen
  const actieveDagen = weekdagen.filter(d => weekState[d.id].actief);
  if (actieveDagen.length === 0) {
    alert('Kies minstens één dag.');
    return false;
  }

  const modus = weekState.modus || 'oefeningen';

  // Bij oefeningen-modus: check configs (zoals voorheen)
  // Bij invulblad-modus: geen check nodig - er staan enkel nummers op
  if (modus === 'oefeningen') {
    for (const d of actieveDagen) {
      const type = weekState[d.id].type;
      const conf = state.config[type];
      if ((type === 'maaltafels' || type === 'deeltafels') && conf.tafels.length === 0) {
        alert(`Voor ${d.label} (${type}): kies eerst minstens één tafel in het hoofdscherm.`);
        return false;
      }
      if (type === 'gemengd-maal-deel' && (conf.tafelsKeer.length === 0 || conf.tafelsDeel.length === 0)) {
        alert(`Voor ${d.label} (gemengd × en :): kies eerst minstens één maal- en deeltafel.`);
        return false;
      }
      if (type === 'getalbeelden') {
        alert(`Getalbeelden werken niet op papier — gebruik 'Invulblad (bij flitsen)' voor ${d.label} of kies een ander oefeningtype.`);
        return false;
      }
    }
  }

  // Genereer oefeningen per dag (alleen nodig voor oefeningen-modus)
  const dagenMetOef = actieveDagen.map(d => {
    const type = weekState[d.id].type;
    return {
      ...d,
      type,
      oefeningen: modus === 'invulblad'
        ? null  // geen oefeningen bij invulblad
        : window.TempotoetsenGen.genereerToets(type, state.config[type], 10)
    };
  });

  genereerWeekbladPdf(dagenMetOef, modus, weekState.weekVan || '');
  return true;
}

function genereerWeekbladPdf(dagenMetOef, modus, weekVan) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const breedte = 297;
  const hoogte = 210;
  const marge = 10;

  const isInvulblad = modus === 'invulblad';

  // --- Header ---
  doc.setFillColor(245, 159, 59); // oranje
  doc.rect(0, 0, breedte, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(isInvulblad ? 'Tempotoets — Weekblad (invulblad)' : 'Tempotoets — Weekblad', marge, 15);

  // Naam + datum
  doc.setTextColor(45, 42, 38);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Naam:', marge, 32);
  doc.line(marge + 12, 32, marge + 75, 32);

  doc.text('Week van:', marge + 85, 32);
  if (weekVan && weekVan.trim()) {
    // Vooraf ingevuld: geen lijn, gewoon tekst
    doc.setFont('helvetica', 'bold');
    doc.text(weekVan, marge + 103, 32);
    doc.setFont('helvetica', 'normal');
  } else {
    // Invullijn
    doc.line(marge + 103, 32, marge + 160, 32);
  }

  // Instructie
  doc.setFillColor(253, 236, 212);
  doc.setDrawColor(245, 159, 59);
  doc.setLineWidth(0.4);
  doc.roundedRect(marge, 37, breedte - marge * 2, 9, 2.5, 2.5, 'FD');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(197, 122, 28);
  doc.text('Elke dag krijg je 1 minuut om zoveel mogelijk oefeningen op te lossen. Klaar? Start!',
    marge + 4, 43);

  // --- Kolommen per dag ---
  const startY = 52;
  const beschikbareHoogte = hoogte - startY - marge;
  const kolomMarge = 3;
  const kolomBreedte = (breedte - marge * 2 - kolomMarge * (dagenMetOef.length - 1)) / dagenMetOef.length;

  const oefStartY = startY + 14;
  const oefHoogte = (beschikbareHoogte - 14) / 10;

  dagenMetOef.forEach((d, dIdx) => {
    const x = marge + dIdx * (kolomBreedte + kolomMarge);

    // Dag-header: paarse balk met dagnaam links, wit score-vakje rechts
    doc.setFillColor(107, 76, 155); // paars
    doc.roundedRect(x, startY, kolomBreedte, 10, 2, 2, 'F');

    // Dagnaam links van midden
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(d.label, x + 4, startY + 6.7);

    // Score-vakje rechts: wit rechthoekje met "___/10"
    const scoreBreedte = 14;
    const scoreHoogte = 6;
    const scoreX = x + kolomBreedte - scoreBreedte - 3;
    const scoreY = startY + 2;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(255, 255, 255);
    doc.roundedRect(scoreX, scoreY, scoreBreedte, scoreHoogte, 1.5, 1.5, 'F');
    doc.setTextColor(107, 76, 155);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('___/10', scoreX + scoreBreedte / 2, scoreY + 4.2, { align: 'center' });

    // Oefeningen (geen type-strook meer — oefStartY begint direct onder de paarse balk)
    doc.setTextColor(45, 42, 38);

    if (isInvulblad) {
      // Invulblad: alleen nummer + lange invullijn
      for (let i = 0; i < 10; i++) {
        const y = oefStartY + i * oefHoogte + 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(140, 140, 140);
        doc.text(`${i + 1}.`, x + 3, y);

        // Lange invullijn over bijna de hele kolombreedte
        doc.setDrawColor(190, 190, 190);
        doc.setLineWidth(0.3);
        doc.line(x + 10, y + 1, x + kolomBreedte - 3, y + 1);
      }
    } else {
      // Check of dit splitsingen zijn → dan mini-boompjes in 2×5 grid
      const isSplitsingenDag = d.oefeningen.length > 0
        && typeof d.oefeningen[0].vraag === 'object'
        && d.oefeningen[0].vraag.type === 'splitsing';

      if (isSplitsingenDag) {
        // 2 boompjes naast elkaar × 5 rijen = 10 oefeningen
        const subKolomBreedte = kolomBreedte / 2;
        const rijHoogte = (hoogte - oefStartY - marge - 4) / 5;

        d.oefeningen.forEach((o, i) => {
          const subKolom = i % 2;      // 0 = links, 1 = rechts
          const rij = Math.floor(i / 2); // 0 t.e.m. 4

          const centerX = x + subKolom * subKolomBreedte + subKolomBreedte / 2;
          const centerY = oefStartY + rij * rijHoogte + rijHoogte / 2;

          // Nummer linksboven het boompje
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(160, 160, 160);
          doc.text(`${i + 1}.`, x + subKolom * subKolomBreedte + 1.5, centerY - rijHoogte / 2 + 3);

          tekenMiniSplitsing(doc, o.vraag, centerX, centerY, subKolomBreedte * 0.9, rijHoogte * 0.85);
        });
      } else {
        // Gewone tekstuele weergave voor andere oefeningtypes
        d.oefeningen.forEach((o, i) => {
          const y = oefStartY + i * oefHoogte + 6;

          // Nummer
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(160, 160, 160);
          doc.text(`${i + 1}.`, x + 2, y);

          // Vraag
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(45, 42, 38);

          const vraagText = typeof o.vraag === 'string' ? o.vraag : '___';
          doc.text(`${vraagText}  =`, x + 7, y);

          // Invullijntje rechts
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.3);
          const lijnX = x + kolomBreedte - 18;
          doc.line(lijnX, y + 1, lijnX + 15, y + 1);
        });
      }
    }

    // Lichte scheiding tussen kolommen
    if (dIdx < dagenMetOef.length - 1) {
      doc.setDrawColor(230, 225, 215);
      doc.setLineWidth(0.2);
      const scheidingX = x + kolomBreedte + kolomMarge / 2;
      doc.line(scheidingX, startY + 12, scheidingX, hoogte - marge - 4);
    }
  });

  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text('juf Zisa · jufzisa.be', marge, hoogte - 4);

  // --- Antwoordenblad op pagina 2 (alleen bij oefeningen-modus, niet bij invulblad) ---
  if (!isInvulblad) {
    doc.addPage('a4', 'landscape');
    doc.setFillColor(107, 76, 155);
    doc.rect(0, 0, breedte, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Antwoordenblad — Weekblad', marge, 12);

    const antStartY = 26;
    const antOefHoogte = (hoogte - antStartY - marge) / 10;

    dagenMetOef.forEach((d, dIdx) => {
      const x = marge + dIdx * (kolomBreedte + kolomMarge);

      doc.setFillColor(253, 236, 212);
      doc.roundedRect(x, antStartY, kolomBreedte, 8, 2, 2, 'F');
      doc.setTextColor(197, 122, 28);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(d.label, x + kolomBreedte / 2, antStartY + 5.5, { align: 'center' });

      d.oefeningen.forEach((o, i) => {
        const y = antStartY + 14 + i * antOefHoogte + 4;
        let vraagText;
        if (typeof o.vraag === 'string') {
          vraagText = o.vraag;
        } else if (o.vraag.type === 'splitsing') {
          const t = o.vraag.top === null ? '?' : o.vraag.top;
          const l = o.vraag.links === null ? '?' : o.vraag.links;
          const r = o.vraag.rechts === null ? '?' : o.vraag.rechts;
          vraagText = `${t}=${l}+${r}`;
        } else {
          vraagText = '';
        }

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        if (o.vraag && o.vraag.type === 'splitsing') {
          // Geen aparte = nodig, de vraag bevat al een =
          doc.text(`${i + 1}. ${vraagText}`, x + 2, y);
        } else {
          doc.text(`${i + 1}. ${vraagText} =`, x + 2, y);
        }

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(122, 182, 72);
        doc.text(String(o.antwoord), x + kolomBreedte - 14, y);
      });
    });
  }

  doc.save(isInvulblad ? 'Tempotoets-Weekblad-invulblad.pdf' : 'Tempotoets-Weekblad.pdf');
}

// ============================================
// Modus-kaarten
// ============================================
function renderModi() {
  const c = document.getElementById('modi');
  c.innerHTML = `
    <div class="modus-kaart" id="modus-flits">
      <div class="icoon">⚡</div>
      <h3>Flits-modus</h3>
      <p>Oefeningen één voor één op het scherm of smartbord</p>
    </div>
    <div class="modus-kaart" id="modus-antwblad">
      <div class="icoon">📝</div>
      <h3>Invulblad</h3>
      <p>PDF met alleen nummers om antwoorden op te noteren (bij flits)</p>
    </div>
    <div class="modus-kaart" id="modus-papier">
      <div class="icoon">📄</div>
      <h3>Dagblad</h3>
      <p>PDF met de 10 oefeningen van vandaag, de juf timet 1 minuut</p>
    </div>
    <div class="modus-kaart modus-kaart-uitgelicht" id="modus-week">
      <div class="icoon">📅</div>
      <h3>Weekblad</h3>
      <p>Liggend A4 met 5 dagen op 1 blad — kies welke dagen en wat per dag</p>
    </div>
  `;
  document.getElementById('modus-flits').addEventListener('click', startFlitsModus);
  document.getElementById('modus-papier').addEventListener('click', maakPdfPapier);
  document.getElementById('modus-antwblad').addEventListener('click', () => maakPdfAntwoordblad(false));
  document.getElementById('modus-week').addEventListener('click', openWeekbladDialoog);
}

// ============================================
// Init
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c⚡ Tempotoetsen v5 — weekblad met Week van + Invulblad-modus', 'color:#6b4c9b;font-weight:700;font-size:1.1em;');
  renderTabs();
  renderConfig();
  renderModi();
  updatePreview();
});
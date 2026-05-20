// === VAKKEN ===
// Logica voor het maken van vak-elementen.
// Elk vak is een <div class="vak"> dat absolute gepositioneerd is op het canvas.

// Standaard-afmetingen per vak-type
const STANDAARD_GROOTTE = {
  vrij:        { breedte: 280, hoogte: 200 },
  checklist:   { breedte: 320, hoogte: 260 },
};

// Standaard-titels per vak-type (leeg = leerkracht vult zelf in via placeholder)
const STANDAARD_TITEL = {
  vrij:      '',
  checklist: '',
};

// === TEKSTGROOTTE-NIVEAUS ===
// Per vak slaan we een niveau op (0-6). Default is 3 (medium).
// Elk niveau heeft een schaalfactor die in CSS wordt toegepast.
const TEKSTGROOTTE_NIVEAUS = [0.7, 0.85, 1.0, 1.15, 1.35, 1.6, 1.9];
const TEKSTGROOTTE_DEFAULT = 2; // index in array → 1.0 = standaard

// Unieke ID-teller voor vakken
let _vakTeller = 0;
function _nieuwId() {
  _vakTeller++;
  return 'vak-' + Date.now() + '-' + _vakTeller;
}

// === VAK TOEVOEGEN ===
function voegVakToe(vaktype) {
  const canvas = document.getElementById('bord-canvas');
  const grootte = STANDAARD_GROOTTE[vaktype] || { breedte: 240, hoogte: 180 };
  const kleur = STANDAARD_KLEUR[vaktype] || 'paars';

  // Plaats in midden van canvas, met kleine offset zodat opeenvolgende vakken niet exact overlappen
  const offset = (_vakTeller % 5) * 20;
  const x = canvas.clientWidth / 2 - grootte.breedte / 2 + offset;
  const y = canvas.clientHeight / 2 - grootte.hoogte / 2 + offset;

  const vak = document.createElement('div');
  vak.className = `vak kleur-${kleur}`;
  vak.id = _nieuwId();
  vak.dataset.vaktype = vaktype;
  vak.dataset.kleur = kleur;
  vak.dataset.tekstgrootte = TEKSTGROOTTE_DEFAULT;
  vak.style.left = x + 'px';
  vak.style.top = y + 'px';
  vak.style.width = grootte.breedte + 'px';
  vak.style.height = grootte.hoogte + 'px';

  // Inhoud per vaktype
  if (vaktype === 'vrij') {
    vak.innerHTML = _maakVrijVakHTML();
  } else if (vaktype === 'checklist') {
    vak.innerHTML = _maakChecklistVakHTML();
  }

  // Tekstgrootte toepassen
  _pasTekstgrootteToe(vak);

  canvas.appendChild(vak);
  _koppelVakInteractie(vak);
  selecteerVak(vak);

  return vak;
}

// === HTML PER VAK-TYPE ===
function _maakVrijVakHTML(titel = '', inhoud = '') {
  return `
    <div class="vak-titel" contenteditable="true" data-placeholder="Titel...">${_escape(titel)}</div>
    <div class="vak-inhoud" contenteditable="true" data-placeholder="Typ hier je tekst, of sleep een afbeelding uit de bibliotheek...">${_escape(inhoud)}</div>
  `;
}

function _maakChecklistVakHTML(titel = STANDAARD_TITEL.checklist, items = null) {
  // Standaard: één leeg item zodat de leerkracht ziet hoe een item eruitziet
  const standaardItems = items || [
    { type: 'item', afbeelding: '', tekst: '' },
  ];

  const itemsHTML = standaardItems.map(_maakChecklistRegelHTML).join('');

  return `
    <div class="vak-titel" contenteditable="true" data-placeholder="Titel...">${_escape(titel)}</div>
    <div class="checklist-items">
      ${itemsHTML}
    </div>
    <div class="checklist-knoppen">
      <button class="checklist-toevoegen" type="button" data-actie="item">+ Item</button>
      <button class="checklist-toevoegen" type="button" data-actie="witregel">+ Witregel</button>
    </div>
  `;
}

function _maakChecklistRegelHTML(regel) {
  if (regel.type === 'witregel') {
    return `<div class="checklist-witregel" data-type="witregel"></div>`;
  }
  return _maakChecklistItemHTML(regel.afbeelding || '', regel.tekst || '');
}

function _maakChecklistItemHTML(afbeelding, tekst) {
  const afbHTML = afbeelding
    ? `<img class="item-afbeelding" src="afbeeldingen/${_escape(afbeelding)}" alt="" onerror="this.style.display='none';" />`
    : '';
  return `
    <div class="checklist-item" data-type="item" data-afbeelding="${_escape(afbeelding)}">
      <span class="item-vinkje" aria-hidden="true"></span>
      ${afbHTML}
      <span class="item-tekst" contenteditable="true" data-placeholder="Typ hier...">${_escape(tekst)}</span>
      <button class="item-verwijder" type="button" aria-label="Verwijder regel">×</button>
    </div>
  `;
}

// === VAK INTERACTIE KOPPELEN ===
function _koppelVakInteractie(vak) {
  // Slepen via mousedown op het vak zelf (niet op editable inhoud)
  vak.addEventListener('mousedown', (e) => {
    if (e.target.isContentEditable) return;
    if (e.target.closest('.greep')) return;
    if (e.target.closest('.vak-acties')) return;
    if (e.target.closest('.checklist-toevoegen')) return;
    if (e.target.closest('.item-verwijder')) return;
    if (e.target.closest('.item-afbeelding')) return;

    selecteerVak(vak);
    _startSlepen(vak, e);
  });

  vak.addEventListener('click', (e) => {
    e.stopPropagation();
    selecteerVak(vak);
  });

  // Checklist-specifieke interactie
  if (vak.dataset.vaktype === 'checklist') {
    _koppelChecklistInteractie(vak);
  }
}

function _koppelChecklistInteractie(vak) {
  // "+ Item" en "+ Witregel" knoppen
  vak.querySelectorAll('.checklist-toevoegen').forEach((knop) => {
    knop.addEventListener('click', (e) => {
      e.stopPropagation();
      const lijst = vak.querySelector('.checklist-items');
      const actie = knop.dataset.actie;

      const div = document.createElement('div');
      if (actie === 'witregel') {
        div.innerHTML = _maakChecklistRegelHTML({ type: 'witregel' });
      } else {
        div.innerHTML = _maakChecklistRegelHTML({ type: 'item', afbeelding: '', tekst: '' });
      }
      const regel = div.firstElementChild;
      lijst.appendChild(regel);
      _koppelChecklistRegelInteractie(regel);

      // Focus op tekstveld bij nieuw item
      if (actie === 'item') {
        regel.querySelector('.item-tekst').focus();
      }
    });
  });

  // Bestaande regels
  vak.querySelectorAll('.checklist-item, .checklist-witregel').forEach(_koppelChecklistRegelInteractie);
}

function _koppelChecklistRegelInteractie(regel) {
  // Verwijder-knop
  const verwijderKnop = regel.querySelector('.item-verwijder');
  if (verwijderKnop) {
    verwijderKnop.addEventListener('click', (e) => {
      e.stopPropagation();
      regel.remove();
    });
  }

  // Afbeelding-binnen-item: klik verwijdert hem
  const itemAfb = regel.querySelector('.item-afbeelding');
  if (itemAfb) {
    itemAfb.addEventListener('click', (e) => {
      e.stopPropagation();
      itemAfb.remove();
      regel.dataset.afbeelding = '';
    });
    itemAfb.title = 'Klik om afbeelding te verwijderen';
  }

  // Witregel ook verwijderbaar (klik om te verwijderen — heeft geen knop want is leeg)
  if (regel.classList.contains('checklist-witregel')) {
    regel.title = 'Klik om witregel te verwijderen';
    regel.addEventListener('click', (e) => {
      e.stopPropagation();
      regel.remove();
    });
  }

  // Drop-target voor afbeeldingen uit bibliotheek
  if (regel.classList.contains('checklist-item')) {
    _maakDropTarget(regel);
  }
}

// === DROP-TARGET (afbeelding uit bibliotheek slepen naar item) ===
function _maakDropTarget(item) {
  item.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    item.classList.add('drop-actief');
  });
  item.addEventListener('dragleave', (e) => {
    // Enkel weghalen als we het item écht verlaten (niet bij verplaatsen naar kind-element)
    if (!item.contains(e.relatedTarget)) {
      item.classList.remove('drop-actief');
    }
  });
  item.addEventListener('drop', (e) => {
    e.preventDefault();
    item.classList.remove('drop-actief');
    const bestand = e.dataTransfer.getData('text/plain');
    if (!bestand) return;

    // Bestaande afbeelding vervangen
    const bestaand = item.querySelector('.item-afbeelding');
    if (bestaand) bestaand.remove();

    // Nieuwe afbeelding tussen vinkje en tekst plaatsen
    const img = document.createElement('img');
    img.className = 'item-afbeelding';
    img.src = 'afbeeldingen/' + bestand;
    img.alt = '';
    img.onerror = () => { img.style.display = 'none'; };
    img.title = 'Klik om afbeelding te verwijderen';
    img.addEventListener('click', (ev) => {
      ev.stopPropagation();
      img.remove();
      item.dataset.afbeelding = '';
    });

    // Invoegen na het vinkje
    const vinkje = item.querySelector('.item-vinkje');
    vinkje.insertAdjacentElement('afterend', img);
    item.dataset.afbeelding = bestand;
  });
}

// === LOSSE AFBEELDING TOEVOEGEN ===
function voegAfbeeldingToe(bestand, naam) {
  const canvas = document.getElementById('bord-canvas');
  const standaardGrootte = 100;

  const x = canvas.clientWidth / 2 - standaardGrootte / 2;
  const y = canvas.clientHeight / 2 - standaardGrootte / 2;

  const afb = document.createElement('div');
  afb.className = 'canvas-afbeelding';
  afb.id = _nieuwId();
  afb.dataset.type = 'afbeelding';
  afb.dataset.bestand = bestand;
  afb.style.left = x + 'px';
  afb.style.top = y + 'px';
  afb.style.width = standaardGrootte + 'px';
  afb.style.height = standaardGrootte + 'px';
  afb.innerHTML = `<img src="afbeeldingen/${_escape(bestand)}" alt="${_escape(naam)}" onerror="this.parentElement.style.background='#e5e2d8'; this.parentElement.innerHTML='<span style=&quot;display:flex;align-items:center;justify-content:center;height:100%;font-size:24px;&quot;>🖼️</span>';" />`;

  canvas.appendChild(afb);
  _koppelAfbeeldingInteractie(afb);
  selecteerVak(afb);
}

function _koppelAfbeeldingInteractie(afb) {
  afb.addEventListener('mousedown', (e) => {
    if (e.target.closest('.greep')) return;
    if (e.target.closest('.vak-acties')) return;
    selecteerVak(afb);
    _startSlepen(afb, e);
  });
  afb.addEventListener('click', (e) => {
    e.stopPropagation();
    selecteerVak(afb);
  });
}

// === TEKSTGROOTTE ===
// Twee niveaus: vak-globaal (op .vak via --tekstgrootte-factor) en per-element
// (via inline style op .vak-titel, .vak-inhoud, .checklist-items).
// Per-element overschrijft het globale.

function _pasTekstgrootteToe(vak) {
  const niveau = parseInt(vak.dataset.tekstgrootte, 10);
  const factor = TEKSTGROOTTE_NIVEAUS[niveau] || 1.0;
  vak.style.setProperty('--tekstgrootte-factor', factor);
}

// Bewaar welk tekst-element binnen een vak het laatst aangeklikt werd
// Wordt gezet door interactie.js wanneer de gebruiker op een editable klikt.
let _laatstActieveTekst = null; // verwijzing naar HTML-element

function _zetActieveTekst(element) {
  _laatstActieveTekst = element;
}

function _huidigActieveTekst(vak) {
  if (_laatstActieveTekst && vak.contains(_laatstActieveTekst)) {
    return _laatstActieveTekst;
  }
  return null;
}

// Helper: krijg of zet de per-element schaal-factor via data-attribuut
function _getElementNiveau(el, fallbackVak) {
  if (el.dataset.tekstniveau != null) {
    return parseInt(el.dataset.tekstniveau, 10);
  }
  // Geen eigen niveau → val terug op het globale vak-niveau
  return parseInt(fallbackVak.dataset.tekstgrootte, 10) || TEKSTGROOTTE_DEFAULT;
}

function _zetElementNiveau(el, niveau) {
  el.dataset.tekstniveau = niveau;
  const factor = TEKSTGROOTTE_NIVEAUS[niveau] || 1.0;
  // Bepaal basis-grootte op basis van element-type
  let basis = 15; // standaard inhoud
  if (el.classList.contains('vak-titel')) basis = 13;
  else if (el.classList.contains('checklist-items')) basis = 14;
  el.style.fontSize = (basis * factor) + 'px';
}

// Bepaal welk doel-element de leerkracht wil resizen
function _bepaalSchaalDoel(vak) {
  const actief = _huidigActieveTekst(vak);
  if (!actief) return { type: 'vak', el: vak };

  // Klik in checklist-item-tekst → resize de hele items-lijst (anders rommelig)
  if (actief.classList.contains('item-tekst')) {
    const lijst = vak.querySelector('.checklist-items');
    if (lijst) return { type: 'element', el: lijst };
  }
  // Titel of inhoud → resize dat ene element
  if (actief.classList.contains('vak-titel') || actief.classList.contains('vak-inhoud')) {
    return { type: 'element', el: actief };
  }
  return { type: 'vak', el: vak };
}

function wijzigTekstgrootte(vak, richting) {
  const doel = _bepaalSchaalDoel(vak);

  if (doel.type === 'vak') {
    // Vak-globaal: pas dataset.tekstgrootte aan
    let niveau = parseInt(vak.dataset.tekstgrootte, 10);
    if (richting === 'groter' && niveau < TEKSTGROOTTE_NIVEAUS.length - 1) {
      niveau++;
    } else if (richting === 'kleiner' && niveau > 0) {
      niveau--;
    }
    vak.dataset.tekstgrootte = niveau;
    _pasTekstgrootteToe(vak);
  } else {
    // Per-element: lees huidig niveau, pas aan, zet inline font-size
    let niveau = _getElementNiveau(doel.el, vak);
    if (richting === 'groter' && niveau < TEKSTGROOTTE_NIVEAUS.length - 1) {
      niveau++;
    } else if (richting === 'kleiner' && niveau > 0) {
      niveau--;
    }
    _zetElementNiveau(doel.el, niveau);
  }
}

// === HULPFUNCTIES ===
function _escape(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
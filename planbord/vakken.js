// === VAKKEN ===
// Logica voor het maken van vak-elementen.
// Elk vak is een <div class="vak"> dat absolute gepositioneerd is op het canvas.

// Standaard-afmetingen per vak-type
const STANDAARD_GROOTTE = {
  vrij:        { breedte: 280, hoogte: 200 },
  checklist:   { breedte: 320, hoogte: 260 },
  timer:       { breedte: 280, hoogte: 240 },
  weer:        { breedte: 200, hoogte: 160 },
  werkstijl:   { breedte: 240, hoogte: 260 },
};

// Standaard-titels per vak-type (leeg = leerkracht vult zelf in via placeholder)
const STANDAARD_TITEL = {
  vrij:      '',
  checklist: '',
  timer:     '',
  weer:      '',
  werkstijl: '',
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
  } else if (vaktype === 'timer') {
    vak.dataset.minuten = 5;
    vak.dataset.seconden = 0;
    vak.dataset.geluidsmodus = 'normaal';
    vak.innerHTML = _maakTimerVakHTML({ minuten: 5, seconden: 0, timerStijl: 'cijfers' });
  } else if (vaktype === 'weer') {
    vak.innerHTML = _maakWeerVakHTML();
  } else if (vaktype === 'werkstijl') {
    vak.dataset.werkstijl = 'stilte';
    vak.innerHTML = _maakWerkstijlVakHTML({ werkstijl: 'stilte' });
  }

  canvas.appendChild(vak);
  _koppelVakInteractie(vak);

  // Init opsommingsstijl (alleen voor checklist)
  if (vaktype === 'checklist') {
    _initChecklistStijl(vak);
  }

  // Init timer (alleen voor timer)
  if (vaktype === 'timer') {
    _initTimer(vak);
  }

  // Init weer (alleen voor weer)
  if (vaktype === 'weer') {
    _initWeer(vak);
  }

  // Init werkstijl
  if (vaktype === 'werkstijl') {
    _initWerkstijl(vak);
  }

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
    if (e.target.closest('.timer-knop')) return;
    if (e.target.closest('.timer-geluidsicoon')) return;
    if (e.target.closest('.werkstijl-knop')) return;

    selecteerVak(vak);
    _startSlepen(vak, e);
  });

  vak.addEventListener('click', (e) => {
    e.stopPropagation();
    // Alleen selecteren als nog niet geselecteerd
    // (anders verliest een editable de focus bij elke klik)
    if (!vak.classList.contains('geselecteerd')) {
      selecteerVak(vak);
    }
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
      _hernummerChecklist(vak);

      // Nieuw item: erf het opgeslagen niveau van het vak (zodat alle items consistent blijven)
      if (actie === 'item' && vak.dataset.itemNiveau != null) {
        const niveau = parseInt(vak.dataset.itemNiveau, 10);
        const itemTekst = regel.querySelector('.item-tekst');
        if (itemTekst) _zetNiveau(itemTekst, niveau);
      }

      // Witregel: flash-animatie zodat de leerkracht ziet dat hij toegevoegd is
      if (actie === 'witregel') {
        regel.classList.add('net-toegevoegd');
        setTimeout(() => regel.classList.remove('net-toegevoegd'), 1500);
      }

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
      const vakOuder = regel.closest('.vak');
      regel.remove();
      if (vakOuder) _hernummerChecklist(vakOuder);
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
// Per-element tekstgrootte. Werkt op het element waar de cursor staat.
// Default niveau = 2 (factor 1.0).
//
// Basisgroottes per element-type:
//   .vak-titel: 13px
//   .vak-inhoud: 15px
//   .item-tekst: 14px
//
// Wanneer A+/A- geklikt wordt:
//   - Cursor in .vak-titel  → enkel titel
//   - Cursor in .vak-inhoud → enkel inhoud
//   - Cursor in .item-tekst → alle item-teksten in dat vak (anders rommelige lijst)
//   - Geen cursor in tekst  → alle bewerkbare tekst in het vak tegelijk

const TEKSTGROOTTE_BASIS = {
  'vak-titel':  13,
  'vak-inhoud': 15,
  'item-tekst': 14,
};

// Onthou waar de cursor het laatst stond
let _laatstActieveTekst = null;

function _zetActieveTekst(element) {
  _laatstActieveTekst = element;
}

// Krijg het huidige niveau van een tekst-element (default 2 = 1.0×)
function _getNiveau(el) {
  if (el.dataset.tekstniveau != null) {
    return parseInt(el.dataset.tekstniveau, 10);
  }
  return TEKSTGROOTTE_DEFAULT;
}

// Zet de tekstgrootte van één element op een bepaald niveau
function _zetNiveau(el, niveau) {
  el.dataset.tekstniveau = niveau;
  const factor = TEKSTGROOTTE_NIVEAUS[niveau] || 1.0;
  let basis = 14;
  for (const klasse in TEKSTGROOTTE_BASIS) {
    if (el.classList.contains(klasse)) {
      basis = TEKSTGROOTTE_BASIS[klasse];
      break;
    }
  }
  el.style.fontSize = (basis * factor) + 'px';
}

// Bepaal welke elementen samen aangepast moeten worden (kan 1 of meerdere zijn)
function _bepaalSchaalDoelen(vak) {
  // Eerst: kijk waar de cursor staat
  const actief = document.activeElement;
  const fallback = _laatstActieveTekst;

  // Geef voorrang aan actieve element als het binnen het vak ligt
  let bron = null;
  if (actief && vak.contains(actief) && actief.isContentEditable) {
    bron = actief;
  } else if (fallback && vak.contains(fallback) && fallback.isContentEditable) {
    bron = fallback;
  }

  if (bron) {
    if (bron.classList.contains('vak-titel')) {
      return [bron];
    }
    if (bron.classList.contains('vak-inhoud')) {
      return [bron];
    }
    if (bron.classList.contains('item-tekst')) {
      // Alle item-teksten in dit vak samen
      return Array.from(vak.querySelectorAll('.item-tekst'));
    }
  }

  // Niets specifieks geselecteerd → alle bewerkbare tekst in het vak
  const alle = [];
  vak.querySelectorAll('.vak-titel, .vak-inhoud, .item-tekst').forEach((el) => alle.push(el));
  return alle;
}

function wijzigTekstgrootte(vak, richting) {
  const doelen = _bepaalSchaalDoelen(vak);
  if (doelen.length === 0) return;

  // Gebruik het niveau van het eerste element als referentie
  // (zodat groepjes samen veranderen ook als ze nu niet allemaal hetzelfde niveau hebben)
  let huidigNiveau = _getNiveau(doelen[0]);

  let nieuwNiveau = huidigNiveau;
  if (richting === 'groter' && huidigNiveau < TEKSTGROOTTE_NIVEAUS.length - 1) {
    nieuwNiveau = huidigNiveau + 1;
  } else if (richting === 'kleiner' && huidigNiveau > 0) {
    nieuwNiveau = huidigNiveau - 1;
  } else {
    return; // geen verandering mogelijk
  }

  doelen.forEach((el) => _zetNiveau(el, nieuwNiveau));

  // Als we item-teksten hebben aangepast, bewaar het niveau ook op het vak
  // zodat nieuwe items hetzelfde niveau krijgen
  if (doelen[0] && doelen[0].classList.contains('item-tekst')) {
    vak.dataset.itemNiveau = nieuwNiveau;
  }
}

// === OPSOMMINGSSTIJL CHECKLIST ===
// Stijlen: 'hokje' (□), 'cijfer' (1, 2, 3), 'bolletje' (•), 'geen'
const OPSOMMINGSSTIJLEN = ['hokje', 'cijfer', 'bolletje', 'geen'];

function _initChecklistStijl(vak) {
  if (!vak.dataset.opsommingsstijl) {
    vak.dataset.opsommingsstijl = 'hokje';
  }
  _pasOpsommingsstijlToe(vak);
}

function zetOpsommingsstijl(vak, stijl) {
  vak.dataset.opsommingsstijl = stijl;
  _pasOpsommingsstijlToe(vak);
}

function _pasOpsommingsstijlToe(vak) {
  const stijl = vak.dataset.opsommingsstijl || 'hokje';
  // Klassen op vak voor CSS-styling
  OPSOMMINGSSTIJLEN.forEach((s) => vak.classList.remove('stijl-' + s));
  vak.classList.add('stijl-' + stijl);

  // Cijfer-stijl: vul de cijfers in de DOM in (1, 2, 3, ...)
  if (stijl === 'cijfer') {
    let nummer = 1;
    vak.querySelectorAll('.checklist-items > *').forEach((kind) => {
      const vinkje = kind.querySelector('.item-vinkje');
      if (vinkje && kind.classList.contains('checklist-item')) {
        vinkje.textContent = nummer + '.';
        nummer++;
      } else if (vinkje) {
        vinkje.textContent = '';
      }
    });
  } else {
    // Voor andere stijlen: maak vinkjes leeg, CSS doet het werk
    vak.querySelectorAll('.item-vinkje').forEach((v) => { v.textContent = ''; });
  }
}

// Roep dit aan na elke wijziging in checklist-items (toevoegen/verwijderen)
function _hernummerChecklist(vak) {
  if (vak.dataset.opsommingsstijl === 'cijfer') {
    _pasOpsommingsstijlToe(vak);
  }
}

// === CHECKLIST OPSOMMINGSSTIJL ===
const CHECKLIST_STIJLEN = ['hokjes', 'nummers', 'bolletjes'];

function wijzigChecklistStijl(vak, nieuweStijl) {
  if (!CHECKLIST_STIJLEN.includes(nieuweStijl)) return;
  vak.dataset.stijl = nieuweStijl;
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

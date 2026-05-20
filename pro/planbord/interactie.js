// === INTERACTIE ===
// Selectie, slepen, schalen, en actie-knoppen op een vak

let _geselecteerd = null;
let _sleepStatus = null;
let _schaalStatus = null;

// === SELECTIE ===
function selecteerVak(element) {
  deselecteer();
  _geselecteerd = element;
  element.classList.add('geselecteerd');
  _voegHoekgrepenToe(element);

  if (element.classList.contains('vak')) {
    _voegActiesToe(element);
  } else if (element.classList.contains('canvas-afbeelding')) {
    _voegAfbeeldingActiesToe(element);
    _voegRotatieGreepToe(element);
  }
}

function deselecteer() {
  if (_geselecteerd) {
    _geselecteerd.classList.remove('geselecteerd');
    _verwijderHoekgrepen(_geselecteerd);
    _verwijderActies(_geselecteerd);
    _geselecteerd = null;
  }
  _laatstActieveTekst = null;
  _sluitKleurkiezer();
}

function verwijderGeselecteerd() {
  if (_geselecteerd) {
    // Als het een timer is, stop het interval
    if (_geselecteerd.dataset && _geselecteerd.dataset.vaktype === 'timer' && typeof _stopTimer === 'function') {
      _stopTimer(_geselecteerd.id);
    }
    _geselecteerd.remove();
    _geselecteerd = null;
    _laatstActieveTekst = null;
    _sluitKleurkiezer();
  }
}

// === GREPEN (om te schalen) ===
// 4 hoeken: vrij schalen in beide richtingen
// 4 zijden: enkel in één richting (n/s = hoogte, e/w = breedte)
function _voegHoekgrepenToe(element) {
  const grepen = ['tl', 'tr', 'bl', 'br', 'n', 's', 'e', 'w'];
  grepen.forEach((positie) => {
    const greep = document.createElement('div');
    greep.className = `greep greep-${positie}`;
    greep.dataset.positie = positie;
    greep.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      _startSchalen(element, positie, e);
    });
    element.appendChild(greep);
  });
}

function _verwijderHoekgrepen(element) {
  element.querySelectorAll('.greep, .rotatie-greep').forEach((g) => g.remove());
}

// === ACTIE-KNOPPEN (kleur, tekstgrootte, verwijderen) ===
function _voegActiesToe(element) {
  const acties = document.createElement('div');
  acties.className = 'vak-acties';

  // Helper: alle vak-acties moeten focus behouden op editable element
  const houVast = (e) => { e.stopPropagation(); e.preventDefault(); };

  // Kleur-knop
  const kleurKnop = document.createElement('button');
  kleurKnop.className = 'vak-actie';
  kleurKnop.tabIndex = -1;
  kleurKnop.setAttribute('aria-label', 'Kies kleur');
  kleurKnop.innerHTML = `<span class="kleur-puntje" style="background:${_kleurPreview(element.dataset.kleur)};"></span>`;
  kleurKnop.addEventListener('mousedown', houVast);
  kleurKnop.addEventListener('click', (e) => {
    e.stopPropagation();
    _toonKleurkiezer(element, kleurKnop);
  });
  acties.appendChild(kleurKnop);

  // Tekstgrootte kleiner
  const kleinerKnop = document.createElement('button');
  kleinerKnop.className = 'vak-actie';
  kleinerKnop.tabIndex = -1;
  kleinerKnop.setAttribute('aria-label', 'Tekst kleiner');
  kleinerKnop.title = 'Tekst kleiner';
  kleinerKnop.innerHTML = '<span style="font-size:11px; font-weight:700;">A−</span>';
  kleinerKnop.addEventListener('mousedown', houVast);
  kleinerKnop.addEventListener('click', (e) => {
    e.stopPropagation();
    wijzigTekstgrootte(element, 'kleiner');
  });
  acties.appendChild(kleinerKnop);

  // Tekstgrootte groter
  const groterKnop = document.createElement('button');
  groterKnop.className = 'vak-actie';
  groterKnop.tabIndex = -1;
  groterKnop.setAttribute('aria-label', 'Tekst groter');
  groterKnop.title = 'Tekst groter';
  groterKnop.innerHTML = '<span style="font-size:14px; font-weight:700;">A+</span>';
  groterKnop.addEventListener('mousedown', houVast);
  groterKnop.addEventListener('click', (e) => {
    e.stopPropagation();
    wijzigTekstgrootte(element, 'groter');
  });
  acties.appendChild(groterKnop);

  // Opsommingsstijl-knoppen (alleen voor checklist-vakken)
  if (element.dataset.vaktype === 'checklist') {
    const stijlen = [
      { stijl: 'hokje',    icoon: '☐', label: 'Hokjes' },
      { stijl: 'cijfer',   icoon: '1.', label: 'Cijfers' },
      { stijl: 'bolletje', icoon: '•', label: 'Bolletjes' },
      { stijl: 'geen',     icoon: '–', label: 'Geen' },
    ];

    // Scheidingslijn
    const scheid = document.createElement('div');
    scheid.style.cssText = 'width:1px; background:#e5e2d8; margin:2px 4px;';
    acties.appendChild(scheid);

    stijlen.forEach((s) => {
      const knop = document.createElement('button');
      knop.className = 'vak-actie vak-actie-stijl';
      knop.tabIndex = -1;
      knop.setAttribute('aria-label', s.label);
      knop.title = s.label;
      knop.innerHTML = `<span style="font-size:13px; font-weight:600;">${s.icoon}</span>`;
      if (element.dataset.opsommingsstijl === s.stijl) {
        knop.classList.add('actief');
      }
      knop.addEventListener('mousedown', houVast);
      knop.addEventListener('click', (e) => {
        e.stopPropagation();
        zetOpsommingsstijl(element, s.stijl);
        // Update visuele "actief" markering
        acties.querySelectorAll('.vak-actie-stijl').forEach((k) => k.classList.remove('actief'));
        knop.classList.add('actief');
      });
      acties.appendChild(knop);
    });
  }

  // Verwijder-knop
  const verwKnop = document.createElement('button');
  verwKnop.className = 'vak-actie';
  verwKnop.tabIndex = -1;
  verwKnop.setAttribute('aria-label', 'Verwijder vak');
  verwKnop.innerHTML = '🗑';
  verwKnop.addEventListener('mousedown', houVast);
  verwKnop.addEventListener('click', (e) => {
    e.stopPropagation();
    verwijderGeselecteerd();
  });
  acties.appendChild(verwKnop);

  element.appendChild(acties);
}

function _verwijderActies(element) {
  const acties = element.querySelector('.vak-acties');
  if (acties) acties.remove();
}

// === ACTIE-BALK VOOR LOSSE AFBEELDING ===
function _voegAfbeeldingActiesToe(afb) {
  const acties = document.createElement('div');
  acties.className = 'vak-acties';

  const houVast = (e) => { e.stopPropagation(); e.preventDefault(); };

  // Rotatie resetten naar 0
  const resetKnop = document.createElement('button');
  resetKnop.className = 'vak-actie';
  resetKnop.tabIndex = -1;
  resetKnop.title = 'Rotatie resetten';
  resetKnop.setAttribute('aria-label', 'Rotatie resetten');
  resetKnop.innerHTML = '<span style="font-size:14px;">↺</span>';
  resetKnop.addEventListener('mousedown', houVast);
  resetKnop.addEventListener('click', (e) => {
    e.stopPropagation();
    _zetRotatie(afb, 0);
  });
  acties.appendChild(resetKnop);

  // Verwijder
  const verwKnop = document.createElement('button');
  verwKnop.className = 'vak-actie';
  verwKnop.tabIndex = -1;
  verwKnop.setAttribute('aria-label', 'Verwijder');
  verwKnop.innerHTML = '🗑';
  verwKnop.addEventListener('mousedown', houVast);
  verwKnop.addEventListener('click', (e) => {
    e.stopPropagation();
    verwijderGeselecteerd();
  });
  acties.appendChild(verwKnop);

  afb.appendChild(acties);
}

// === ROTATIE-GREEP ===
// Een aparte handle boven het element, sleepbaar om vrij te roteren
function _voegRotatieGreepToe(element) {
  const greep = document.createElement('div');
  greep.className = 'rotatie-greep';
  greep.title = 'Sleep om te draaien';
  greep.innerHTML = '↻';
  greep.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    e.preventDefault();
    _startRoteren(element, e);
  });
  element.appendChild(greep);
}

function _zetRotatie(element, graden) {
  element.dataset.rotatie = graden;
  // Behoud bestaande transforms en pas alleen rotate toe
  element.style.transform = `rotate(${graden}deg)`;
}

let _rotatieStatus = null;

function _startRoteren(element, e) {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const huidigeRotatie = parseFloat(element.dataset.rotatie) || 0;
  // Hoek van muis tot centrum (in graden, 0° = rechts, 90° = onder)
  const startHoek = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;

  _rotatieStatus = {
    element,
    centerX,
    centerY,
    startHoek,
    beginRotatie: huidigeRotatie,
  };

  document.addEventListener('mousemove', _tijdensRoteren);
  document.addEventListener('mouseup', _stopRoteren);
}

function _tijdensRoteren(e) {
  if (!_rotatieStatus) return;
  const { element, centerX, centerY, startHoek, beginRotatie } = _rotatieStatus;
  const huidigeHoek = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
  let nieuweRotatie = beginRotatie + (huidigeHoek - startHoek);
  // Houd binnen 0-360
  nieuweRotatie = ((nieuweRotatie % 360) + 360) % 360;
  // Snap-to-15° als Shift ingedrukt
  if (e.shiftKey) {
    nieuweRotatie = Math.round(nieuweRotatie / 15) * 15;
  }
  _zetRotatie(element, Math.round(nieuweRotatie));
}

function _stopRoteren() {
  document.removeEventListener('mousemove', _tijdensRoteren);
  document.removeEventListener('mouseup', _stopRoteren);
  _rotatieStatus = null;
}

function _kleurPreview(kleur) {
  const tinten = {
    paars: '#7F77DD', roze: '#ED93B1', groen: '#97C459', teal: '#5DCAA5',
    blauw: '#85B7EB', geel: '#EF9F27', oranje: '#F0997B', grijs: '#B4B2A9',
  };
  return tinten[kleur] || '#888';
}

// === KLEURKIEZER ===
function _toonKleurkiezer(vak, ankerKnop) {
  const kiezer = document.getElementById('kleurkiezer');
  kiezer.classList.remove('verborgen');

  // Positioneer onder de actie-knop
  const rect = ankerKnop.getBoundingClientRect();
  kiezer.style.left = rect.left + 'px';
  kiezer.style.top = (rect.bottom + 4) + 'px';

  // Koppel kleurknoppen
  kiezer.querySelectorAll('.kleur-knop').forEach((knop) => {
    knop.onclick = (e) => {
      e.stopPropagation();
      const nieuweKleur = knop.dataset.kleur;
      _wijzigKleur(vak, nieuweKleur);
      // Update actie-knop puntje
      const puntje = ankerKnop.querySelector('.kleur-puntje');
      if (puntje) puntje.style.background = _kleurPreview(nieuweKleur);
      _sluitKleurkiezer();
    };
  });
}

function _sluitKleurkiezer() {
  document.getElementById('kleurkiezer').classList.add('verborgen');
}

function _wijzigKleur(vak, nieuweKleur) {
  KLEUREN.forEach((k) => vak.classList.remove('kleur-' + k));
  vak.classList.add('kleur-' + nieuweKleur);
  vak.dataset.kleur = nieuweKleur;
}

// === SLEPEN ===
// Belangrijk: het bord is geschaald (transform: scale), dus muis-coördinaten
// moeten we delen door de schaal om de juiste interne verplaatsing te krijgen.
function _huidigeBordSchaal() {
  const bord = document.getElementById('bord');
  if (!bord) return 1;
  // offsetWidth = ongeschaalde breedte (1600); getBoundingClientRect = geschaalde breedte
  const echtBreedte = bord.getBoundingClientRect().width;
  const internBreedte = bord.offsetWidth;
  return internBreedte > 0 ? echtBreedte / internBreedte : 1;
}

function _startSlepen(element, e) {
  // Lees positie uit de inline style (intern formaat), niet uit getBoundingClientRect
  const beginLeft = parseFloat(element.style.left) || 0;
  const beginTop = parseFloat(element.style.top) || 0;

  const canvas = document.getElementById('bord-canvas');

  _sleepStatus = {
    element,
    startX: e.clientX,
    startY: e.clientY,
    beginLeft,
    beginTop,
    canvasBreedte: canvas.offsetWidth,  // intern formaat
    canvasHoogte: canvas.offsetHeight,
    elementBreedte: element.offsetWidth,
    elementHoogte: element.offsetHeight,
    schaal: _huidigeBordSchaal(),
  };

  document.addEventListener('mousemove', _tijdensSlepen);
  document.addEventListener('mouseup', _stopSlepen);
  e.preventDefault();
}

function _tijdensSlepen(e) {
  if (!_sleepStatus) return;
  // Schermverplaatsing omrekenen naar interne verplaatsing
  const dx = (e.clientX - _sleepStatus.startX) / _sleepStatus.schaal;
  const dy = (e.clientY - _sleepStatus.startY) / _sleepStatus.schaal;
  let nieuwLeft = _sleepStatus.beginLeft + dx;
  let nieuwTop = _sleepStatus.beginTop + dy;

  // Begrens binnen canvas
  nieuwLeft = Math.max(0, Math.min(nieuwLeft, _sleepStatus.canvasBreedte - _sleepStatus.elementBreedte));
  nieuwTop = Math.max(0, Math.min(nieuwTop, _sleepStatus.canvasHoogte - _sleepStatus.elementHoogte));

  _sleepStatus.element.style.left = nieuwLeft + 'px';
  _sleepStatus.element.style.top = nieuwTop + 'px';
}

function _stopSlepen() {
  document.removeEventListener('mousemove', _tijdensSlepen);
  document.removeEventListener('mouseup', _stopSlepen);
  _sleepStatus = null;
}

// === SCHALEN ===
function _startSchalen(element, positie, e) {
  const canvas = document.getElementById('bord-canvas');

  // Afbeeldingen mogen kleiner worden dan vakken
  const isAfbeelding = element.classList.contains('canvas-afbeelding');
  const minBreedte = isAfbeelding ? 30 : 100;
  const minHoogte = isAfbeelding ? 30 : 80;

  _schaalStatus = {
    element,
    positie,
    startX: e.clientX,
    startY: e.clientY,
    beginLeft: parseFloat(element.style.left) || 0,
    beginTop: parseFloat(element.style.top) || 0,
    beginBreedte: element.offsetWidth,
    beginHoogte: element.offsetHeight,
    canvasBreedte: canvas.offsetWidth,   // intern
    canvasHoogte: canvas.offsetHeight,
    minBreedte,
    minHoogte,
    schaal: _huidigeBordSchaal(),
  };

  document.addEventListener('mousemove', _tijdensSchalen);
  document.addEventListener('mouseup', _stopSchalen);
  e.preventDefault();
}

function _tijdensSchalen(e) {
  if (!_schaalStatus) return;
  const {
    positie, beginLeft, beginTop, beginBreedte, beginHoogte,
    canvasBreedte, canvasHoogte, minBreedte, minHoogte, schaal,
  } = _schaalStatus;
  // Schermverplaatsing omrekenen naar interne verplaatsing
  const dx = (e.clientX - _schaalStatus.startX) / schaal;
  const dy = (e.clientY - _schaalStatus.startY) / schaal;

  let nieuwLeft = beginLeft;
  let nieuwTop = beginTop;
  let nieuwBreedte = beginBreedte;
  let nieuwHoogte = beginHoogte;

  // Bepaal welke randen meebewegen op basis van greep-positie
  // Hoeken: 'tl', 'tr', 'bl', 'br' → 2 randen tegelijk
  // Zijden: 'n', 's', 'e', 'w' → 1 rand
  const raaktRechts = positie === 'tr' || positie === 'br' || positie === 'e';
  const raaktLinks  = positie === 'tl' || positie === 'bl' || positie === 'w';
  const raaktOnder  = positie === 'bl' || positie === 'br' || positie === 's';
  const raaktBoven  = positie === 'tl' || positie === 'tr' || positie === 'n';

  if (raaktRechts) {
    nieuwBreedte = Math.max(minBreedte, beginBreedte + dx);
  }
  if (raaktLinks) {
    nieuwBreedte = Math.max(minBreedte, beginBreedte - dx);
    nieuwLeft = beginLeft + (beginBreedte - nieuwBreedte);
  }
  if (raaktOnder) {
    nieuwHoogte = Math.max(minHoogte, beginHoogte + dy);
  }
  if (raaktBoven) {
    nieuwHoogte = Math.max(minHoogte, beginHoogte - dy);
    nieuwTop = beginTop + (beginHoogte - nieuwHoogte);
  }

  // Begrens binnen canvas
  if (nieuwLeft < 0) {
    nieuwBreedte += nieuwLeft;
    nieuwLeft = 0;
  }
  if (nieuwTop < 0) {
    nieuwHoogte += nieuwTop;
    nieuwTop = 0;
  }
  if (nieuwLeft + nieuwBreedte > canvasBreedte) {
    nieuwBreedte = canvasBreedte - nieuwLeft;
  }
  if (nieuwTop + nieuwHoogte > canvasHoogte) {
    nieuwHoogte = canvasHoogte - nieuwTop;
  }

  _schaalStatus.element.style.left = nieuwLeft + 'px';
  _schaalStatus.element.style.top = nieuwTop + 'px';
  _schaalStatus.element.style.width = nieuwBreedte + 'px';
  _schaalStatus.element.style.height = nieuwHoogte + 'px';
}

function _stopSchalen() {
  document.removeEventListener('mousemove', _tijdensSchalen);
  document.removeEventListener('mouseup', _stopSchalen);
  _schaalStatus = null;
}

// === KLIK BUITEN VAK = DESELECTEREN ===
function _initBuitenklik() {
  document.getElementById('bord-canvas').addEventListener('click', (e) => {
    // Alleen deselecteren als er op het canvas zelf wordt geklikt (niet op een vak)
    if (e.target.id === 'bord-canvas') {
      deselecteer();
    }
  });

  // Klik op kleurkiezer-knop niet sluiten, klik daarbuiten wel
  document.addEventListener('click', (e) => {
    const kiezer = document.getElementById('kleurkiezer');
    if (kiezer.classList.contains('verborgen')) return;
    if (kiezer.contains(e.target)) return;
    if (e.target.closest('.vak-actie')) return;
    _sluitKleurkiezer();
  });

  // Onthou welke editable tekst het laatst werd aangeklikt
  // (zodat A+/A− knoppen weten wat ze moeten resizen)
  document.addEventListener('focusin', (e) => {
    if (e.target.isContentEditable) {
      _zetActieveTekst(e.target);
    }
  });
}
// === APP INIT ===

document.addEventListener('DOMContentLoaded', () => {
  _initHeader();
  _toonBibliotheek();
  _initTabs();
  _initVakKnoppen();
  _initTopbarKnoppen();
  _initToetsen();
  _initBuitenklik();
  _initPresentatie();
  _initTimerModal();
});

// === TABS IN ZIJPANEEL ===
function _initTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('actief'));
      tab.classList.add('actief');

      document.querySelectorAll('.tab-inhoud').forEach((inh) => inh.classList.add('verborgen'));
      document.getElementById('tab-' + tab.dataset.tab).classList.remove('verborgen');
    });
  });
}

// === VAK-KNOPPEN ===
function _initVakKnoppen() {
  document.querySelectorAll('.vak-knop').forEach((knop) => {
    knop.addEventListener('click', () => {
      const vaktype = knop.dataset.vaktype;
      voegVakToe(vaktype);
    });
  });
}

// === TOPBAR KNOPPEN ===
function _initTopbarKnoppen() {
  document.getElementById('btn-verwijder').addEventListener('click', () => {
    verwijderGeselecteerd();
  });

  document.getElementById('btn-export').addEventListener('click', () => {
    downloadJson();
  });

  document.getElementById('btn-import').addEventListener('click', () => {
    document.getElementById('file-import').click();
  });

  document.getElementById('file-import').addEventListener('change', (e) => {
    const bestand = e.target.files[0];
    if (bestand) uploadJson(bestand);
    e.target.value = '';
  });

  document.getElementById('btn-presentatie').addEventListener('click', () => {
    toonPresentatie();
  });

  document.getElementById('btn-sluit-presentatie').addEventListener('click', () => {
    sluitPresentatie();
  });
}

// === TOETSEN ===
function _initToetsen() {
  document.addEventListener('keydown', (e) => {
    // Niet reageren als gebruiker in een editable veld typt
    if (e.target.isContentEditable) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'Delete') {
      verwijderGeselecteerd();
    }

    if (e.key === 'Escape') {
      const pres = document.getElementById('presentatie');
      if (!pres.classList.contains('verborgen')) {
        sluitPresentatie();
      }
      deselecteer();
    }
  });
}

// === PRESENTATIE-MODUS ===
function _initPresentatie() {
  // Klik buiten canvas in presentatie sluit niet meteen (per ongeluk kan)
  // Sluiten enkel via × of Escape
}

function toonPresentatie() {
  deselecteer();
  const overlay = document.getElementById('presentatie');
  const inhoud = document.getElementById('presentatie-inhoud');

  // Lees de oorspronkelijke afmetingen VOORDAT we klonen
  const bord = document.getElementById('bord');
  const origBreedte = bord.offsetWidth;
  const origHoogte = bord.offsetHeight;

  // Kloon het bord op zijn oorspronkelijke afmetingen
  const kloon = bord.cloneNode(true);
  kloon.id = 'bord-pres';
  kloon.style.maxWidth = 'none';
  kloon.style.width = origBreedte + 'px';
  kloon.style.height = origHoogte + 'px';
  kloon.style.aspectRatio = '';

  // Verwijder bewerk-affordances
  kloon.querySelectorAll('[contenteditable]').forEach((el) => el.removeAttribute('contenteditable'));
  kloon.querySelectorAll('.greep, .vak-acties, .checklist-knoppen, .checklist-toevoegen, .item-verwijder, .rotatie-greep').forEach((el) => el.remove());
  kloon.querySelectorAll('.geselecteerd').forEach((el) => el.classList.remove('geselecteerd'));

  inhoud.innerHTML = '';
  inhoud.appendChild(kloon);
  overlay.classList.remove('verborgen');

  // Bereken schaalfactor zodat het bord het scherm vult met behoud van verhoudingen
  _schaalPresentatie(kloon, origBreedte, origHoogte);

  // Bij venster-resize ook opnieuw schalen
  window._presentatieResize = () => _schaalPresentatie(kloon, origBreedte, origHoogte);
  window.addEventListener('resize', window._presentatieResize);
}

function _schaalPresentatie(kloon, origBreedte, origHoogte) {
  const inhoud = document.getElementById('presentatie-inhoud');
  const beschBreedte = inhoud.clientWidth;
  const beschHoogte = inhoud.clientHeight;
  const schaal = Math.min(beschBreedte / origBreedte, beschHoogte / origHoogte);
  kloon.style.transform = `scale(${schaal})`;
  kloon.style.transformOrigin = 'center center';
}

function sluitPresentatie() {
  const overlay = document.getElementById('presentatie');
  overlay.classList.add('verborgen');
  document.getElementById('presentatie-inhoud').innerHTML = '';
  if (window._presentatieResize) {
    window.removeEventListener('resize', window._presentatieResize);
    delete window._presentatieResize;
  }
}
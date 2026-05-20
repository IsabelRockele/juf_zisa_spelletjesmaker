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

  // Kloon het bord
  const bord = document.getElementById('bord');
  const kloon = bord.cloneNode(true);
  kloon.id = 'bord-pres';
  kloon.style.maxWidth = 'none';
  kloon.style.width = '100%';
  kloon.style.height = '100%';
  kloon.style.aspectRatio = '';

  // Verwijder bewerk-affordances
  kloon.querySelectorAll('[contenteditable]').forEach((el) => el.removeAttribute('contenteditable'));
  kloon.querySelectorAll('.greep, .vak-acties, .checklist-toevoegen, .item-verwijder').forEach((el) => el.remove());
  kloon.querySelectorAll('.geselecteerd').forEach((el) => el.classList.remove('geselecteerd'));

  inhoud.innerHTML = '';
  inhoud.appendChild(kloon);

  overlay.classList.remove('verborgen');
}

function sluitPresentatie() {
  const overlay = document.getElementById('presentatie');
  overlay.classList.add('verborgen');
  document.getElementById('presentatie-inhoud').innerHTML = '';
}

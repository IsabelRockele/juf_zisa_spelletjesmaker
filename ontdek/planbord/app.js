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
  _initUitleg();
});

// === UITLEG-MODAL ===
function _initUitleg() {
  const knop = document.getElementById('btn-uitleg');
  const modal = document.getElementById('uitleg-modal');
  const sluitKnop = document.getElementById('uitleg-sluit');
  if (!knop || !modal) return;

  knop.addEventListener('click', () => modal.classList.remove('verborgen'));
  if (sluitKnop) sluitKnop.addEventListener('click', () => modal.classList.add('verborgen'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('verborgen');
  });

  // Voorbeeldbord laden
  const voorbeeldKnop = document.getElementById('btn-voorbeeld');
  if (voorbeeldKnop) {
    voorbeeldKnop.addEventListener('click', async () => {
      // Vraag bevestiging als er al iets op het bord staat
      const canvas = document.getElementById('bord-canvas');
      const heeftInhoud = canvas && canvas.querySelector('.vak, .canvas-afbeelding');
      if (heeftInhoud) {
        const bevestigd = confirm('Dit vervangt je huidige bord. Doorgaan?');
        if (!bevestigd) return;
      }
      try {
        voorbeeldKnop.disabled = true;
        voorbeeldKnop.textContent = '⏳ Aan het laden...';
        const respons = await fetch('voorbeeld.json');
        if (!respons.ok) throw new Error('Bestand niet gevonden');
        const data = await respons.json();
        importeerBord(data);
        modal.classList.add('verborgen');
      } catch (err) {
        console.warn('Kon voorbeeldbord niet laden:', err);
        alert('Kon het voorbeeldbord niet laden.\nPlaats het bestand "voorbeeld.json" naast index.html in de planbord-map.');
      } finally {
        voorbeeldKnop.disabled = false;
        voorbeeldKnop.textContent = '📋 Voorbeeldbord laden';
      }
    });
  }
}

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
  document.body.classList.add('in-presentatie');
  const overlay = document.getElementById('presentatie');
  overlay.classList.remove('verborgen');
  schaalBord();
}

function sluitPresentatie() {
  document.body.classList.remove('in-presentatie');
  const overlay = document.getElementById('presentatie');
  overlay.classList.add('verborgen');
  schaalBord();
}

// === BORD SCHALEN ===
// Schaalt het 1600x900 bord zodat het past in zijn beschikbare ruimte.
// Werkt voor zowel bewerk-modus als presentatie-modus.
function schaalBord() {
  const bord = document.getElementById('bord');
  if (!bord) return;

  // Beschikbare ruimte = de parent (canvas-zone) zijn afmetingen
  const zone = bord.parentElement;
  if (!zone) return;

  const beschBreedte = zone.clientWidth;
  const beschHoogte = zone.clientHeight;
  if (beschBreedte === 0 || beschHoogte === 0) return;

  const origBreedte = 1600;
  const origHoogte = 900;

  // Evenredig schalen met behoud van aspect-ratio
  const schaal = Math.min(beschBreedte / origBreedte, beschHoogte / origHoogte);
  bord.style.transform = `scale(${schaal})`;
  bord.style.transformOrigin = 'center center';
}

// Schaal opnieuw bij venster-resize
window.addEventListener('resize', () => {
  if (typeof schaalBord === 'function') schaalBord();
});

// Schaal initieel na DOM-load
document.addEventListener('DOMContentLoaded', () => {
  // Wacht even tot CSS toegepast is
  requestAnimationFrame(() => schaalBord());
});
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
  document.body.classList.add('in-presentatie');
  const overlay = document.getElementById('presentatie');
  overlay.classList.remove('verborgen');
  _pasPresentatieSchaalToe();
  // Bij venster-resize ook opnieuw schalen
  window._presentatieResize = _pasPresentatieSchaalToe;
  window.addEventListener('resize', window._presentatieResize);
}

function _pasPresentatieSchaalToe() {
  const bord = document.getElementById('bord');
  if (!bord || !document.body.classList.contains('in-presentatie')) return;

  // Bepaal de originele afmetingen van het bord (zonder transform)
  // We resetten eerst de schaal om te meten
  bord.style.transform = '';
  const origBreedte = bord.offsetWidth;
  const origHoogte = bord.offsetHeight;

  // Beschikbare ruimte = volledig venster
  const beschBreedte = window.innerWidth;
  const beschHoogte = window.innerHeight;

  if (origBreedte === 0 || origHoogte === 0) return;

  // Evenredig schalen met behoud van aspect-ratio (geen vervorming)
  // De crème achtergrond op body.in-presentatie zorgt dat eventuele randen
  // visueel doorlopen ipv als zwarte balken te tonen.
  const schaal = Math.min(beschBreedte / origBreedte, beschHoogte / origHoogte);
  const geschaaldeBreedte = origBreedte * schaal;
  const geschaaldeHoogte = origHoogte * schaal;
  const offsetX = (beschBreedte - geschaaldeBreedte) / 2;
  const offsetY = (beschHoogte - geschaaldeHoogte) / 2;
  bord.style.transform = `scale(${schaal})`;
  bord.style.transformOrigin = 'top left';
  bord.style.position = 'fixed';
  bord.style.left = offsetX + 'px';
  bord.style.top = offsetY + 'px';
  bord.style.zIndex = '1050';
}

function sluitPresentatie() {
  document.body.classList.remove('in-presentatie');
  const overlay = document.getElementById('presentatie');
  overlay.classList.add('verborgen');
  // Reset inline styles op het bord
  const bord = document.getElementById('bord');
  if (bord) {
    bord.style.transform = '';
    bord.style.transformOrigin = '';
    bord.style.position = '';
    bord.style.left = '';
    bord.style.top = '';
    bord.style.zIndex = '';
  }
  if (window._presentatieResize) {
    window.removeEventListener('resize', window._presentatieResize);
    delete window._presentatieResize;
  }
}
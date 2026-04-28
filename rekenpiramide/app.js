/* ─── APP.JS ────────────────────────────────────────────────────────────────
   Verbindt UI met Generator, Preview en PdfEngine.
─────────────────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {

  // ── State ──────────────────────────────────────────────────────────────
  let huidigePiramides = [];
  let huidigeBewerking = 'optellen'; // 'optellen' | 'vermenigvuldigen'
  let toonOplossing = false;

  // ── DOM refs ───────────────────────────────────────────────────────────
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const meldingContainer = document.getElementById('meldingContainer');

  const genereerBtn = document.getElementById('genereerBtn');
  const toonOplossingBtn = document.getElementById('toonOplossing');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const downloadPdfOplBtn = document.getElementById('downloadPdfOplBtn');

  const infoBtn = document.getElementById('infoBtn');
  const infoModal = document.getElementById('infoModal');
  const infoModalClose = document.getElementById('infoModalClose');
  const infoModalClose2 = document.getElementById('infoModalClose2');

  // ── Tafels chips bouwen ────────────────────────────────────────────────
  const tafelContainer = document.getElementById('ver-tafels');
  for (let i = 1; i <= 10; i++) {
    const span = document.createElement('span');
    span.className = 'radio-chip';
    span.innerHTML = `
      <input type="checkbox" name="ver-tafel" id="ver-tafel-${i}" value="${i}" ${i >= 2 && i <= 5 ? 'checked' : ''}>
      <label for="ver-tafel-${i}">${i}</label>
    `;
    tafelContainer.appendChild(span);
  }

  document.getElementById('ver-tafels-alles').addEventListener('click', () => {
    document.querySelectorAll('input[name="ver-tafel"]').forEach(cb => cb.checked = true);
    genereerEnToon();
  });
  document.getElementById('ver-tafels-niets').addEventListener('click', () => {
    document.querySelectorAll('input[name="ver-tafel"]').forEach(cb => cb.checked = false);
  });

  // ── Tabs ────────────────────────────────────────────────────────────────
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
      tabContents.forEach(c => c.classList.toggle('active', c.id === `tab-${tab}`));
      huidigeBewerking = tab;
      genereerEnToon();
    });
  });

  // ── Settings uitlezen ──────────────────────────────────────────────────
  function leesSettings() {
    if (huidigeBewerking === 'optellen') {
      return {
        bewerking: 'optellen',
        aantal: parseInt(document.getElementById('opt-aantal').value),
        hoogte: parseInt(document.getElementById('opt-hoogte').value),
        maxTop: parseInt(document.getElementById('opt-max').value),
        brug: document.querySelector('input[name="opt-brug"]:checked').value,
        type: document.querySelector('input[name="opt-type"]:checked').value
      };
    } else {
      const tafels = Array.from(document.querySelectorAll('input[name="ver-tafel"]:checked'))
        .map(cb => parseInt(cb.value));
      return {
        bewerking: 'vermenigvuldigen',
        aantal: parseInt(document.getElementById('ver-aantal').value),
        hoogte: parseInt(document.getElementById('ver-hoogte').value),
        tafels,
        type: document.querySelector('input[name="ver-type"]:checked').value
      };
    }
  }

  function toonMelding(tekst) {
    if (!tekst) {
      meldingContainer.classList.remove('visible');
      meldingContainer.textContent = '';
      return;
    }
    meldingContainer.textContent = tekst;
    meldingContainer.classList.add('visible');
  }

  // ── Genereren + tonen ──────────────────────────────────────────────────
  function genereerEnToon() {
    toonMelding('');
    const settings = leesSettings();

    if (settings.bewerking === 'vermenigvuldigen' && settings.tafels.length === 0) {
      toonMelding('⚠️ Kies minstens 1 tafel om te kunnen genereren.');
      huidigePiramides = [];
      Preview.render([], false);
      return;
    }

    huidigePiramides = Generator.genereerSet(settings);
    Preview.render(huidigePiramides, toonOplossing);
  }

  // ── Event listeners voor live updates ──────────────────────────────────
  function bindLiveUpdates() {
    // Selects en radio's
    document.querySelectorAll('.cfg-select, input[type="radio"]').forEach(el => {
      el.addEventListener('change', genereerEnToon);
    });
    // Tafel checkboxes
    document.querySelectorAll('input[name="ver-tafel"]').forEach(cb => {
      cb.addEventListener('change', genereerEnToon);
    });
  }
  bindLiveUpdates();

  // ── Knoppen ────────────────────────────────────────────────────────────
  genereerBtn.addEventListener('click', () => {
    toonOplossing = false;
    toonOplossingBtn.classList.remove('active');
    toonOplossingBtn.textContent = '👁 Toon oplossing';
    genereerEnToon();
  });

  toonOplossingBtn.addEventListener('click', () => {
    toonOplossing = !toonOplossing;
    toonOplossingBtn.classList.toggle('active', toonOplossing);
    toonOplossingBtn.textContent = toonOplossing ? '👁 Verberg oplossing' : '👁 Toon oplossing';
    Preview.render(huidigePiramides, toonOplossing);
  });

  function pdfOpties(metOplossing) {
    const settings = leesSettings();
    const isOpt = settings.bewerking === 'optellen';
    return {
      titel: isOpt ? 'Optelpiramides' : 'Vermenigvuldigpiramides',
      opdracht: isOpt
        ? 'Vul de lege vakjes in. Elk vakje is de som van de twee vakjes eronder.'
        : 'Vul de lege vakjes in. Elk vakje is het product van de twee vakjes eronder.',
      toonOplossing: metOplossing
    };
  }

  downloadPdfBtn.addEventListener('click', () => {
    if (huidigePiramides.length === 0) {
      toonMelding('Eerst piramides genereren.');
      return;
    }
    PdfEngine.genereer(huidigePiramides, pdfOpties(false));
  });

  downloadPdfOplBtn.addEventListener('click', () => {
    if (huidigePiramides.length === 0) {
      toonMelding('Eerst piramides genereren.');
      return;
    }
    PdfEngine.genereer(huidigePiramides, pdfOpties(true));
  });

  // ── Modal ──────────────────────────────────────────────────────────────
  function openModal() { infoModal.style.display = 'flex'; }
  function closeModal() { infoModal.style.display = 'none'; }
  infoBtn.addEventListener('click', openModal);
  infoModalClose.addEventListener('click', closeModal);
  infoModalClose2.addEventListener('click', closeModal);
  infoModal.addEventListener('click', (e) => {
    if (e.target === infoModal) closeModal();
  });

  // ── Initieel genereren ─────────────────────────────────────────────────
  genereerEnToon();

});

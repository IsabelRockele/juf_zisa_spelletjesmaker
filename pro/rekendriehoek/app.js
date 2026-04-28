/* ─── APP.JS ────────────────────────────────────────────────────────────────
   Verbindt UI met Generator, Preview en PdfEngine.
─────────────────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {

  // ── State ──────────────────────────────────────────────────────────────
  let huidigeDriehoeken = [];
  let toonOplossing = false;

  // ── DOM refs ───────────────────────────────────────────────────────────
  const meldingContainer = document.getElementById('meldingContainer');
  const genereerBtn = document.getElementById('genereerBtn');
  const toonOplossingBtn = document.getElementById('toonOplossing');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const downloadPdfOplBtn = document.getElementById('downloadPdfOplBtn');

  const infoBtn = document.getElementById('infoBtn');
  const infoModal = document.getElementById('infoModal');
  const infoModalClose = document.getElementById('infoModalClose');
  const infoModalClose2 = document.getElementById('infoModalClose2');

  // ── Settings uitlezen ──────────────────────────────────────────────────
  function leesSettings() {
    const type = document.querySelector('input[name="type"]:checked').value;
    return {
      type,
      aantal: parseInt(document.getElementById('aantal').value),
      niveau: parseInt(document.getElementById('niveau').value),
      brug: document.querySelector('input[name="brug"]:checked').value,
      magischMax: parseInt(document.getElementById('magisch-niveau').value)
    };
  }

  // ── Toon/verberg settings op basis van type ─────────────────────────────
  function updateSettingsZichtbaarheid() {
    const type = document.querySelector('input[name="type"]:checked').value;
    const klassiek = document.getElementById('klassiek-settings');
    const magisch = document.getElementById('magisch-settings');
    const werkwijze = document.getElementById('werkwijze-tekst');

    if (type === 'klassiek') {
      klassiek.style.display = '';
      magisch.style.display = 'none';
      werkwijze.innerHTML = 'De driehoek is opgedeeld in <strong>3 binnenvakken</strong>. Tel de getallen in de driehoek bij elkaar op en schrijf de uitkomst in het vakje <strong>buiten de driehoek</strong>.';
    } else if (type === 'magisch') {
      klassiek.style.display = 'none';
      magisch.style.display = '';
      werkwijze.innerHTML = 'Plaats de cijfers op de cirkels zodat <strong>elke zijde dezelfde som</strong> heeft. Een zijde-som is de 3 cirkels op die zijde samen.';
    } else { // mengeling
      klassiek.style.display = '';
      magisch.style.display = '';
      werkwijze.innerHTML = '<strong>Mengeling:</strong> klassieke en magische driehoeken door elkaar op één werkblad.';
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
    updateSettingsZichtbaarheid();
    const settings = leesSettings();
    huidigeDriehoeken = Generator.genereerSet(settings);
    Preview.render(huidigeDriehoeken, toonOplossing);
  }

  // ── Live updates bij wijzigen instellingen ─────────────────────────────
  document.querySelectorAll('.cfg-select, input[type="radio"]').forEach(el => {
    el.addEventListener('change', genereerEnToon);
  });

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
    Preview.render(huidigeDriehoeken, toonOplossing);
  });

  function pdfOpties(metOplossing) {
    const settings = leesSettings();
    let titel = 'Rekendriehoeken';
    let opdracht;

    if (settings.type === 'klassiek') {
      opdracht = 'Tel de getallen in de driehoek bij elkaar op. Schrijf de uitkomst in het vakje buiten de driehoek.';
    } else if (settings.type === 'magisch') {
      titel = 'Magische driehoeken';
      opdracht = 'Plaats de cijfers op de cirkels zodat elke zijde dezelfde som heeft.';
    } else {
      opdracht = 'Lees per driehoek hoe je hem moet oplossen.';
    }

    return { titel, opdracht, toonOplossing: metOplossing };
  }

  downloadPdfBtn.addEventListener('click', () => {
    if (huidigeDriehoeken.length === 0) {
      toonMelding('Eerst driehoeken genereren.');
      return;
    }
    PdfEngine.genereer(huidigeDriehoeken, pdfOpties(false));
  });

  downloadPdfOplBtn.addEventListener('click', () => {
    if (huidigeDriehoeken.length === 0) {
      toonMelding('Eerst driehoeken genereren.');
      return;
    }
    PdfEngine.genereer(huidigeDriehoeken, pdfOpties(true));
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

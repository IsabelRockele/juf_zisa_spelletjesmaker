/* ══════════════════════════════════════════════════════════════
   gi-pdf.js  —  Getalinzicht PDF via html2canvas screenshot
   Correct, betrouwbaar, toont exact wat je in de preview ziet.
   ══════════════════════════════════════════════════════════════ */
window.GI_Pdf = (() => {

  /* ── Overlay ───────────────────────────────────────────────── */
  function _toonOverlay() {
    const ov = document.createElement('div');
    ov.id = 'gi-pdf-overlay';
    ov.style.cssText = [
      'position:fixed','inset:0','z-index:9999',
      'background:rgba(255,255,255,.92)',
      'display:flex','flex-direction:column',
      'align-items:center','justify-content:center',
      'gap:12px','font-family:Arial,sans-serif',
    ].join(';');
    ov.innerHTML = '<div style="font-size:18px;font-weight:700;color:#1A3A5C">PDF wordt aangemaakt…</div>'
                 + '<div style="font-size:13px;color:#666">even geduld a.u.b.</div>';
    document.body.appendChild(ov);
    return ov;
  }

  /* ── Tijdelijk verberg UI-elementen die niet in PDF mogen ─── */
  function _prepExport(sheet) {
    // Bewaar originele stijlen
    const origSheetW   = sheet.style.width;
    const origSheetPos = sheet.style.position;

    // Reset bevroren breedtes van exercise-blokken en SVG's
    const bevroren = Array.from(sheet.querySelectorAll('.exercise, .exercise svg'));
    bevroren.forEach(el => {
      el._origW       = el.style.width;
      el._origMaxW    = el.style.maxWidth;
      el.style.width    = '';
      el.style.maxWidth = '';
    });

    // Sheet tijdelijk op vaste breedte zetten in de huidige container
    sheet.style.width    = '794px';
    sheet.style.position = 'relative';

    // Verberg knoppen
    const knoppen = Array.from(document.querySelectorAll(
      '.title-add-btn, .title-delete-btn, .delete-btn, .row-delete-btn, ' +
      '.block-delete-btn, .ruler-warning'
    ));
    knoppen.forEach(b => { b._savedDisplay = b.style.display; b.style.display = 'none'; });

    // Verberg overlay-inputs boven getallenlijn
    const overlays = Array.from(document.querySelectorAll('.print-overlay-input'));
    overlays.forEach(i => { i._savedVis = i.style.visibility; i.style.visibility = 'hidden'; });

    // Markeer als exporting (CSS kan hierop reageren)
    document.documentElement.classList.add('exporting');

    return () => {
      // Herstel alles
      sheet.style.width    = origSheetW;
      sheet.style.position = origSheetPos;
      // Zet bevroren breedtes terug
      bevroren.forEach(el => {
        el.style.width    = el._origW    || '';
        el.style.maxWidth = el._origMaxW || '';
      });
      knoppen.forEach(b  => { b.style.display     = b._savedDisplay || ''; });
      overlays.forEach(i => { i.style.visibility  = i._savedVis     || ''; });
      document.documentElement.classList.remove('exporting');
    };
  }

  /* ── Pagineer het canvas in A4-plakjes ────────────────────── */
  function _snijInPaginas(canvas, sheetRect, domBlokken, pxPerMm, pageH_mm) {
    const factor    = canvas.width / sheetRect.width;
    const pageH_px  = (pageH_mm - 14 - 14) * pxPerMm;   // MT=MB=14mm

    // Veilige snijpunten: onderkant van elk DOM-blok
    const grenzen = new Set([0, canvas.height]);
    domBlokken.forEach(blok => {
      const bottom = (blok.getBoundingClientRect().bottom - sheetRect.top) * factor;
      if (bottom > 0 && bottom < canvas.height) grenzen.add(Math.round(bottom));
    });
    const gesorteerd = Array.from(grenzen).sort((a, b) => a - b);

    const plakjes = [];
    let startY = 0;
    while (startY < canvas.height) {
      const maxY = startY + pageH_px;
      let snij = startY;
      for (const g of gesorteerd) {
        if (g > startY && g <= maxY) snij = g;
      }
      if (snij === startY) snij = Math.min(maxY, canvas.height);
      plakjes.push({ y: startY, h: snij - startY });
      startY = snij;
    }
    return plakjes;
  }

  /* ── Koptekst in jsPDF (naam + datum + lijn) ──────────────── */
  function _koptekst(pdf, paginaNr, totaalPaginas) {
    const PW = 210, ML = 12, MR = 12;
    if (paginaNr === 1) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      pdf.text('Naam: _______________________________', ML, 15);
      pdf.text('Datum: ________________', PW - MR - 52, 15);
    }
    // Voettekst op elke pagina
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8);
    pdf.setTextColor(160, 160, 160);
    pdf.text("juf Zisa's werkbladgenerator — www.jufzisa.be", PW / 2, 292, { align: 'center' });
    if (totaalPaginas > 1) {
      pdf.text(`${paginaNr} / ${totaalPaginas}`, PW - MR, 292, { align: 'right' });
    }
    pdf.setTextColor(0, 0, 0);
  }

  /* ── Selectoren voor pagina-grenzen ───────────────────────── */
  const GRENS_SEL = [
    '.exercise', '.jump-row', '.seq-row',
    '.mixed-first', '.honderdveld-row', '.honderdveld-exercise-block',
    '.fillnext-row', '.fillnext-first',
    '.hvicons-card', '.hvicons-first',
    '.hvp-first', '.hvp-card',
    '.mab-first', '.mab-grid-layout .mab-tellen-container:nth-child(2n)',
    '.pv-first', '.pv-grid .pv-item:nth-child(2n)',
    '.pv3-grid .pv3-item',
    '.keep-together',
    '.gb1000-first', '.gb1000-grid .gb1000-card:nth-child(2n)',
    '.mixed-grid.hte-2col .mix-item:nth-child(2n)',
    '.mixed-grid:not(.hte-2col) .mix-item:nth-child(3n)',
  ].join(', ');

  /* ── Hoofdfunctie ─────────────────────────────────────────── */
  async function maakPdf() {
    const jsPDF = window.jspdf?.jsPDF;
    if (!jsPDF)         { alert('jsPDF niet geladen.');         return; }
    if (!window.html2canvas) { alert('html2canvas niet geladen.'); return; }

    const sheet = document.getElementById('sheet');
    if (!sheet || sheet.children.length <= 1) {
      alert('Het werkblad is leeg — voeg eerst oefeningen toe.'); return;
    }

    const overlay = _toonOverlay();
    const herstel = _prepExport(sheet);

    try {
      // Geef browser tijd om layout te herberekenen
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

      const sheetRect = sheet.getBoundingClientRect();

      const canvas = await html2canvas(sheet, {
        scale:           2.5,          // hoge resolutie → scherpe PDF
        backgroundColor: '#ffffff',
        useCORS:         true,
        ignoreElements:  node => {
          if (!node) return false;
          if (node.id === 'gi-pdf-overlay') return true;
          const cl = node.classList;
          return cl && (
            cl.contains('title-add-btn')    ||
            cl.contains('title-delete-btn') ||
            cl.contains('delete-btn')       ||
            cl.contains('row-delete-btn')   ||
            cl.contains('ruler-warning')
          );
        },
      });

      // A4-afmetingen
      const PW = 210, PH = 297;
      const ML = 12, MR = 12, MT = 16, MB = 14;
      const usableW  = PW - ML - MR;          // 186 mm
      const pxPerMm  = canvas.width / usableW;

      const domBlokken = Array.from(sheet.querySelectorAll(GRENS_SEL));
      const plakjes    = _snijInPaginas(canvas, sheetRect, domBlokken, pxPerMm, PH);

      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

      plakjes.forEach((sl, i) => {
        if (i > 0) pdf.addPage();
        _koptekst(pdf, i + 1, plakjes.length);

        // Knip dit plakje uit het canvas
        const c   = document.createElement('canvas');
        c.width   = canvas.width;
        c.height  = sl.h;
        c.getContext('2d').drawImage(canvas, 0, sl.y, canvas.width, sl.h, 0, 0, canvas.width, sl.h);

        const imgH = sl.h / pxPerMm;
        pdf.addImage(c.toDataURL('image/jpeg', 0.93), 'JPEG', ML, MT, usableW, imgH);
      });

      pdf.save('werkblad-getalinzicht.pdf');

    } catch (err) {
      console.error('[GI-PDF] Fout:', err);
      alert('Er ging iets mis bij het aanmaken van de PDF:\n' + err.message);
    } finally {
      herstel();
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
  }

  /* ── Init ──────────────────────────────────────────────────── */
  function init() {
    const btn = document.getElementById('btnDownloadPdf');
    if (!btn) return;
    let bezig = false;
    btn.addEventListener('click', async () => {
      if (bezig) return;
      bezig = true; btn.disabled = true;
      try   { await maakPdf(); }
      finally { bezig = false; btn.disabled = false; }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
  return { init, maakPdf };
})();
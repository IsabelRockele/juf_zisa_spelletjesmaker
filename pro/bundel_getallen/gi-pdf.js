/* ══════════════════════════════════════════════════════════════
   gi-pdf.js  —  Getalinzicht PDF via html2canvas screenshot
   Correct, betrouwbaar, toont exact wat je in de preview ziet.
   ══════════════════════════════════════════════════════════════ */
window.GI_Pdf = (() => {
  const PDF_MARGIN_LEFT = 15;
  const PDF_MARGIN_RIGHT = 4;
  const PDF_MARGIN_TOP = 16;
  const PDF_MARGIN_BOTTOM = 14;

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
    const pageH_px  = (pageH_mm - 13 - 11) * pxPerMm;   // veilige A4-hoogte met iets meer bruikbare ruimte

    const yTop = el => (el.getBoundingClientRect().top - sheetRect.top) * factor;
    const yBottom = el => (el.getBoundingClientRect().bottom - sheetRect.top) * factor;

    function addGrens(set, y) {
      if (y > 0 && y < canvas.height) set.add(Math.round(y));
    }

    const grenzen = new Set([0, canvas.height]);
    const voorkeursGrenzen = new Set();
    const verboden = [];
    const kaartStarts = [];
    const startPakketten = [];

    function addVoorkeursGrens(y) {
      if (y <= 0 || y >= canvas.height) return;
      const rounded = Math.round(y);
      grenzen.add(rounded);
      voorkeursGrenzen.add(rounded);
    }

    function verbodenInterval(start, end) {
      const a = Math.round(start);
      const b = Math.round(end);
      return b > a ? { start: a, end: b } : null;
    }

    function registreerKaartStart(el, padding = 12) {
      const top = Math.round(yTop(el));
      const before = Math.round(Math.max(0, top - padding * factor));
      if (before <= 0 || before >= canvas.height || top <= 0) return;
      addVoorkeursGrens(before);
      kaartStarts.push({ before, top });
    }

    function registreerAlleKaders() {
      document.querySelectorAll('#sheet *').forEach(el => {
        if (el.classList?.contains('gi4-block') || el.classList?.contains('title-row')) return;
        if (el.querySelector?.(':scope > .row-delete-wrap')) return;
        const rect = el.getBoundingClientRect();
        if (rect.width < 120 || rect.height < 34) return;
        const style = getComputedStyle(el);
        const borderTop = parseFloat(style.borderTopWidth || '0');
        const radius = parseFloat(style.borderTopLeftRadius || '0') || parseFloat(style.borderRadius || '0');
        if (borderTop <= 0 || radius <= 0 || style.borderTopStyle === 'none') return;
        const className = typeof el.className === 'string' ? el.className : '';
        const isOefenkaart = el.classList?.contains('row-delete-wrap') ||
          el.closest?.('.row-delete-wrap') === el ||
          /(^|\s)(exercise|jump-row|seq-row|mix-item)(\s|$)/.test(className);
        if (!isOefenkaart) return;
        registreerKaartStart(el, 18);
      });
    }

    const EERSTE_ITEM_SEL = [
      '.gi4-value-card', '.gi4-connect-row', '.gi4-axis-row', '.gi4-jump-row',
      '.gi4-compare-row', '.gi4-complete-card', '.gi4-neighbor-table',
      '.gi4-fraction-card', '.gi4-fraction-color-card', '.gi4-fraction-line-row',
      '.gi4-fraction-whole-card', '.gi4-fraction-equiv-card', '.gi4-fraction-equiv-bars',
      '.gi4-fraction-equiv-axis', '.gi4-fraction-compare-card', '.gi4-fraction-compare-order',
      '.gi4-fraction-estimate-card',
      '.gi4-mixed-order-card', '.gi4-mixed-order-explain', '.gi4-mixed-sequence-card', '.gi4-mixed-before-after-card',
      '.row-delete-wrap', '.exercise', '.jump-row', '.seq-row', '.mix-item'
    ].join(', ');

    function eersteOefenItemNaTitel(titleRow) {
      const titleEl = titleRow.querySelector('.exercise-title[data-title-key]');
      const key = titleEl?.dataset.titleKey;
      if (!key) return null;
      let el = titleRow.nextElementSibling;
      while (el && el.classList.contains('title-row')) el = el.nextElementSibling;
      if (!el || el.dataset.titleKey !== key) return null;
      return el.querySelector(EERSTE_ITEM_SEL) || el;
    }

    function eersteOefenRijNaTitel(titleRow) {
      const titleEl = titleRow.querySelector('.exercise-title[data-title-key]');
      const key = titleEl?.dataset.titleKey;
      if (!key) return [];
      let blok = titleRow.nextElementSibling;
      while (blok && blok.classList.contains('title-row')) blok = blok.nextElementSibling;
      if (!blok || blok.dataset.titleKey !== key) return [];

      const items = Array.from(blok.querySelectorAll(EERSTE_ITEM_SEL));
      if (!items.length) return [blok];
      const eersteTop = Math.min(...items.map(yTop));
      const marge = 10 * factor;
      return items.filter(item => Math.abs(yTop(item) - eersteTop) <= marge);
    }

    function titelVoorEersteBlok(el) {
      const blok = el.closest?.('.gi4-block') || el;
      const key = blok?.dataset?.titleKey;
      if (!key) return null;
      const vorige = blok.previousElementSibling;
      if (!vorige?.classList?.contains('title-row')) return null;
      const titel = vorige.querySelector('.exercise-title[data-title-key]');
      if (titel?.dataset?.titleKey !== key) return null;
      if (blok !== el) {
        const items = Array.from(blok.querySelectorAll(EERSTE_ITEM_SEL));
        if (items.length) {
          const eersteTop = Math.min(...items.map(yTop));
          if (yTop(el) > eersteTop + 4 * factor) return null;
        }
      }
      return vorige;
    }

    function startMetTitelAlsEersteBlok(el, start) {
      const titel = titelVoorEersteBlok(el);
      return titel ? Math.max(0, yTop(titel) - 10 * factor) : start;
    }

    // Veilige snijpunten: boven- en onderkant van losse DOM-blokken.
    // Daarnaast zijn er verboden intervallen waar niet middenin geknipt mag worden:
    // - titel + eerste oefenrij
    // - volledige verbind/oefeningblokken die als geheel samen moeten blijven
    domBlokken.forEach(blok => {
      addGrens(grenzen, yTop(blok));
      addGrens(grenzen, yBottom(blok));
    });

    function beschermHeleElementen(selector, padding = 8) {
      document.querySelectorAll(selector).forEach(el => {
        const start = Math.max(0, yTop(el) - padding * factor);
        const end = yBottom(el) + padding * factor;
        addGrens(grenzen, start);
        addGrens(grenzen, end);
        addVoorkeursGrens(end);
        if (end - start > pageH_px - 18 * factor) return;
        const iv = verbodenInterval(start, end);
        if (iv) verboden.push(iv);
      });
    }

    function registreerZachteElementen(selector, padding = 6) {
      document.querySelectorAll(selector).forEach(el => {
        const start = Math.max(0, yTop(el) - padding * factor);
        const end = yBottom(el) + padding * factor;
        addGrens(grenzen, start);
        addGrens(grenzen, end);
        addVoorkeursGrens(end);
      });
    }

    document.querySelectorAll('#sheet .row-delete-wrap').forEach(card => {
      registreerKaartStart(card, 14);
      const top = yTop(card);
      const guard = verbodenInterval(Math.max(0, top - 6 * factor), top + 12 * factor);
      if (guard) verboden.push(guard);
    });
    registreerAlleKaders();

    registreerZachteElementen([
      '#sheet .row-delete-wrap',
      '#sheet .gi4-value-card',
      '#sheet .gi4-complete-card',
      '#sheet .gi4-neighbor-table',
      '#sheet .gi4-axis-row',
      '#sheet .gi4-axis-connect-row',
      '#sheet .gi4-jump-row',
      '#sheet .gi4-compare-row',
      '#sheet .gi4-order-row',
      '#sheet .gi4-connect-row',
      '#sheet .gi4-fraction-card',
      '#sheet .gi4-fraction-color-card',
      '#sheet .gi4-fraction-line-row',
      '#sheet .gi4-fraction-whole-card',
      '#sheet .gi4-fraction-equiv-card',
      '#sheet .gi4-fraction-equiv-bars',
      '#sheet .gi4-fraction-equiv-axis',
      '#sheet .gi4-fraction-common-explain',
      '#sheet .gi4-fraction-common-table',
      '#sheet .gi4-fraction-common-card',
      '#sheet .gi4-fraction-common-arrow',
      '#sheet .gi4-fraction-common-two',
      '#sheet .gi4-fraction-common-three',
      '#sheet .gi4-fraction-compare-card',
      '#sheet .gi4-fraction-compare-order',
      '#sheet .gi4-fraction-estimate-card',
      '#sheet .gi4-mixed-order-card',
      '#sheet .gi4-mixed-order-explain',
      '#sheet .gi4-mixed-sequence-card',
      '#sheet .gi4-mixed-before-after-card'
    ].join(', '), 6);

    document.querySelectorAll('#sheet .title-row').forEach(titleRow => {
      const firstRow = eersteOefenRijNaTitel(titleRow);
      const firstItem = eersteOefenItemNaTitel(titleRow);
      if (!firstItem && !firstRow.length) return;
      const titleTop = yTop(titleRow);
      const firstBottom = firstRow.length
        ? Math.max(...firstRow.map(yBottom))
        : yBottom(firstItem);
      const safeEnd = Math.min(canvas.height, firstBottom + 2 * factor);
      const safeTop = Math.max(0, titleTop - 3 * factor);
      addGrens(grenzen, safeTop);
      addGrens(grenzen, titleTop);
      addGrens(grenzen, yBottom(titleRow));
      addVoorkeursGrens(safeEnd);
      startPakketten.push({ start: Math.round(safeTop), end: Math.round(safeEnd) });
      const protectedHeight = safeEnd - safeTop;
      if (protectedHeight <= pageH_px - 18 * factor) {
        const iv = verbodenInterval(safeTop, safeEnd);
        if (iv) verboden.push(iv);
      }
    });

    document.querySelectorAll('#sheet .gi4-compare-grid').forEach(grid => {
      const rows = Array.from(grid.querySelectorAll(':scope > .gi4-compare-row'));
      const visualRows = new Map();
      rows.forEach(row => {
        const top = Math.round(row.getBoundingClientRect().top / 4) * 4;
        if (!visualRows.has(top)) visualRows.set(top, []);
        visualRows.get(top).push(row);
      });
      visualRows.forEach(rowGroup => {
        const start = Math.max(0, Math.min(...rowGroup.map(yTop)) - 4 * factor);
        const end = Math.max(...rowGroup.map(yBottom)) + 4 * factor;
        addGrens(grenzen, start);
        addGrens(grenzen, end);
        addVoorkeursGrens(end);
        const iv = verbodenInterval(start, end);
        if (iv) verboden.push(iv);
      });
    });

    document.querySelectorAll('#sheet .gi4-fraction-compare-grid').forEach(grid => {
      const cards = Array.from(grid.querySelectorAll(':scope > .gi4-fraction-compare-card, :scope > .gi4-fraction-compare-order'));
      const rows = new Map();
      cards.forEach(card => {
        const cardStart = startMetTitelAlsEersteBlok(card, Math.max(0, yTop(card) - 4 * factor));
        const cardEnd = yBottom(card) + 4 * factor;
        addGrens(grenzen, cardStart);
        addGrens(grenzen, cardEnd);
        addVoorkeursGrens(cardEnd);

        const top = Math.round(card.getBoundingClientRect().top);
        if (!rows.has(top)) rows.set(top, []);
        rows.get(top).push(card);
      });
      rows.forEach(rowCards => {
        const start = Math.max(0, Math.min(...rowCards.map(yTop)) - 5 * factor);
        const end = Math.max(...rowCards.map(yBottom)) + 5 * factor;
        addGrens(grenzen, start);
        addGrens(grenzen, end);
        addVoorkeursGrens(end);
      });
    });

    document.querySelectorAll('#sheet .gi4-fraction-estimate-card').forEach(card => {
      const start = startMetTitelAlsEersteBlok(card, Math.max(0, yTop(card) - 5 * factor));
      const end = yBottom(card) + 5 * factor;
      addGrens(grenzen, start);
      addGrens(grenzen, end);
      addVoorkeursGrens(end);
    });

    document.querySelectorAll('#sheet .gi4-mixed-order-card, #sheet .gi4-mixed-order-explain, #sheet .gi4-mixed-sequence-card, #sheet .gi4-mixed-before-after-card').forEach(card => {
      const start = startMetTitelAlsEersteBlok(card, Math.max(0, yTop(card) - 6 * factor));
      const end = yBottom(card) + 6 * factor;
      addGrens(grenzen, start);
      addGrens(grenzen, end);
      addVoorkeursGrens(end);
    });

    document.querySelectorAll('#sheet .gi4-block[data-title-key="gi4_connect"], #sheet .keep-together').forEach(blok => {
      const titleRow = blok.previousElementSibling?.classList?.contains('title-row')
        ? blok.previousElementSibling
        : null;
      const start = titleRow ? Math.max(0, yTop(titleRow) - 10 * factor) : yTop(blok);
      const end = yBottom(blok);
      addGrens(grenzen, start);
      addGrens(grenzen, end);
      addVoorkeursGrens(end);
      const iv = verbodenInterval(start, end);
      if (iv) verboden.push(iv);
    });

    const gesorteerd = Array.from(grenzen).sort((a, b) => a - b);
    const voorkeuren = Array.from(voorkeursGrenzen).sort((a, b) => a - b);
    const alleKandidaten = Array.from(new Set([
      ...gesorteerd,
      ...voorkeuren,
      ...verboden.flatMap(iv => [iv.start, iv.end])
    ])).sort((a, b) => a - b);
    const isVerbodenSnede = y => verboden.some(iv => y > iv.start && y < iv.end);
    const intervalRond = y => verboden.find(iv => y > iv.start && y < iv.end);
    const isKaartRand = y => kaartStarts.some(k => y >= k.top - 8 * factor && y <= k.top + 14 * factor);

    const plakjes = [];
    let startY = 0;
    while (startY < canvas.height) {
      const maxY = startY + pageH_px;
      let snij = startY;
      for (const g of gesorteerd) {
        if (g > startY && g <= maxY && !isVerbodenSnede(g) && !isKaartRand(g)) snij = g;
      }
      for (const g of voorkeuren) {
        if (g > snij && g <= maxY && !isVerbodenSnede(g) && !isKaartRand(g)) snij = g;
      }

      const startVanBlokDatNietPast = verboden
        .filter(iv => iv.start > startY + 1 && iv.start < maxY && iv.end > maxY)
        .sort((a, b) => a.start - b.start)[0]?.start;
      if (startVanBlokDatNietPast && snij > startVanBlokDatNietPast) {
        snij = startVanBlokDatNietPast;
      }

      const snedeOpKaartRand = kaartStarts
        .filter(k =>
          k.before > startY + 24 &&
          k.before < maxY &&
          snij >= k.top - 4 * factor &&
          snij <= k.top + 48 * factor
        )
        .sort((a, b) => b.before - a.before)[0];
      if (snedeOpKaartRand) {
        snij = snedeOpKaartRand.before;
      }

      const volgendeStarter = startPakketten
        .filter(p =>
          p.start > startY + 24 &&
          p.end <= maxY - 2 * factor &&
          p.end > snij + 8 * factor &&
          !isKaartRand(p.end)
        )
        .sort((a, b) => b.end - a.end)[0];
      if (volgendeStarter && maxY - snij > pageH_px * 0.18) {
        snij = volgendeStarter.end;
      }

      if (snij === startY) {
        const blokker = intervalRond(maxY);
        if (blokker && blokker.start > startY + 24) {
          snij = blokker.start;
        } else {
          snij = Math.min(maxY, canvas.height);
        }
      }

      const isBijnaLegePagina = snij - startY < pageH_px * (startY === 0 ? 0.66 : 0.52);
      const isNietLaatstePagina = canvas.height - startY > pageH_px * 0.65;
      if (isBijnaLegePagina && isNietLaatstePagina) {
        const minimumY = startY + pageH_px * (startY === 0 ? 0.66 : 0.52);
        const latereSnede = alleKandidaten
          .filter(g => g > minimumY && g <= maxY && !isVerbodenSnede(g) && !isKaartRand(g))
          .sort((a, b) => b - a)[0];
        if (latereSnede) {
          snij = latereSnede;
        } else if (snij - startY < pageH_px * (startY === 0 ? 0.25 : 0.18)) {
          snij = Math.min(maxY, canvas.height);
        }
      }

      if (snij <= startY) snij = Math.min(maxY, canvas.height);
      plakjes.push({ y: startY, h: snij - startY });
      startY = snij;
    }
    return plakjes;
  }

  /* ── Koptekst in jsPDF (naam + datum + lijn) ──────────────── */
  function _koptekst(pdf, paginaNr, totaalPaginas) {
    const PW = 210, ML = PDF_MARGIN_LEFT, MR = PDF_MARGIN_RIGHT;
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
    '.title-row',
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
    '.row-delete-wrap',
    '.gi4-value-card', '.gi4-complete-card', '.gi4-neighbor-table',
    '.gi4-axis-row', '.gi4-axis-connect-row', '.gi4-jump-row',
    '.gi4-compare-row', '.gi4-order-row', '.gi4-connect-row',
    '.gi4-fraction-card', '.gi4-fraction-color-card',
    '.gi4-fraction-line-row', '.gi4-fraction-whole-card',
    '.gi4-fraction-equiv-card', '.gi4-fraction-equiv-bars', '.gi4-fraction-equiv-axis',
    '.gi4-fraction-common-explain', '.gi4-fraction-common-table', '.gi4-fraction-common-card',
    '.gi4-fraction-common-arrow', '.gi4-fraction-common-two', '.gi4-fraction-common-three',
    '.gi4-fraction-compare-card', '.gi4-fraction-compare-order',
    '.gi4-fraction-estimate-card',
    '.gi4-mixed-order-card', '.gi4-mixed-order-explain',
    '.gi4-mixed-sequence-card', '.gi4-mixed-before-after-card',
  ].join(', ');

  /* ── Hoofdfunctie ─────────────────────────────────────────── */
  async function maakPdf(bestandsnaam = 'werkblad-getalinzicht.pdf', opties = {}) {
    const jsPDF = window.jspdf?.jsPDF;
    if (!jsPDF)         { alert('jsPDF niet geladen.');         return; }
    if (!window.html2canvas) { alert('html2canvas niet geladen.'); return; }

    const sheet = document.getElementById('sheet');
    if (!sheet || sheet.children.length <= 1) {
      alert('Het werkblad is leeg — voeg eerst oefeningen toe.'); return;
    }

    const hadOplossingen = !!sheet.classList.contains('solutions-mode');
    const forceSolutions = typeof opties.solutions === 'boolean';
    if (forceSolutions && hadOplossingen !== opties.solutions) {
      window.GI4SetSolutionsMode?.(opties.solutions);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    }

    const overlay = _toonOverlay();
    const herstel = _prepExport(sheet);

    try {
      // Geef browser tijd om layout te herberekenen
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      window.GI4DrawSolutionLines?.();
      await new Promise(r => requestAnimationFrame(r));

      const sheetRect = sheet.getBoundingClientRect();

      const canvas = await html2canvas(sheet, {
        scale:           2.5,          // hoge resolutie → scherpe PDF
        backgroundColor: '#ffffff',
        useCORS:         true,
        ignoreElements:  node => {
          if (!node) return false;
          if (node.id === 'gi-pdf-overlay') return true;
          const cl = node.classList;
          if (!cl) return false;
          if (node.id === 'gi-score-in') return true;   // score-invulvak niet in PDF
          if (cl.contains('edit-hint-btn')) return true;     // potloodje niet in PDF
          return (
            cl.contains('title-add-btn')    ||
            cl.contains('title-delete-btn') ||
            cl.contains('delete-btn')       ||
            cl.contains('row-delete-btn')   ||
            cl.contains('sheet-title-hint') ||
            cl.contains('ruler-warning')
          );
        },
      });

      // A4-afmetingen
      const PW = 210, PH = 297;
      const ML = PDF_MARGIN_LEFT, MR = PDF_MARGIN_RIGHT, MT = PDF_MARGIN_TOP, MB = PDF_MARGIN_BOTTOM;
      const usableW  = PW - ML - MR;
      const pxPerMm  = canvas.width / usableW;

      const domBlokken = Array.from(sheet.querySelectorAll(GRENS_SEL));
      const plakjes    = _snijInPaginas(canvas, sheetRect, domBlokken, pxPerMm, PH);

      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

      plakjes.forEach((sl, i) => {
        if (i > 0) pdf.addPage();
        _koptekst(pdf, i + 1, plakjes.length);

        // Knip dit plakje uit het canvas. Bij html2canvas kan een afgeronde
        // snede soms nog 1-2 randpixels van het volgende kaartje meenemen.
        // Daarom tonen we onderaan niet-laatste pagina's een minieme marge minder.
        // Vervolgpagina's nemen tegelijk een klein stukje boven de snede mee,
        // zodat de bovenrand van een oefenkader op de nieuwe pagina behouden blijft.
        const onderTrimPx = i < plakjes.length - 1
          ? Math.min(Math.round(pxPerMm * 3), Math.max(0, sl.h - 1))
          : 0;
        const bovenHerstelPx = i > 0
          ? Math.min(Math.round(pxPerMm * 3.5), sl.y)
          : 0;
        const bronY = Math.max(0, sl.y - bovenHerstelPx);
        const renderH = Math.max(
          1,
          Math.min(canvas.height - bronY, sl.h + bovenHerstelPx - onderTrimPx)
        );
        const c   = document.createElement('canvas');
        c.width   = canvas.width;
        c.height  = renderH;
        c.getContext('2d').drawImage(canvas, 0, bronY, canvas.width, renderH, 0, 0, canvas.width, renderH);

        const imgH = renderH / pxPerMm;
        pdf.addImage(c.toDataURL('image/jpeg', 0.93), 'JPEG', ML, MT, usableW, imgH);
      });

      pdf.save(bestandsnaam);

    } catch (err) {
      console.error('[GI-PDF] Fout:', err);
      alert('Er ging iets mis bij het aanmaken van de PDF:\n' + err.message);
    } finally {
      herstel();
      if (forceSolutions && hadOplossingen !== opties.solutions) {
        window.GI4SetSolutionsMode?.(hadOplossingen);
      }
      window.GI4DrawSolutionLines?.();
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
      const sheet = document.getElementById('sheet');
      const hadOplossingen = !!sheet?.classList.contains('solutions-mode');
      try {
        if (hadOplossingen) {
          window.GI4SetSolutionsMode?.(false);
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        }
        await maakPdf('werkblad-getalinzicht.pdf', { solutions: false });
      } finally {
        if (hadOplossingen) window.GI4SetSolutionsMode?.(true);
        bezig = false;
        btn.disabled = false;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
  return { init, maakPdf };
})();

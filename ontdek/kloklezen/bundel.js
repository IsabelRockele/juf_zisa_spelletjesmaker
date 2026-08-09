/* ══════════════════════════════════════════════════════════════
   bundel.js — Bundelbeheer
   Verantwoordelijkheid: oefeningen bijhouden, preview tonen,
                         PDF samenvoegen.
   Vereist: modules/klok-lezen.js (en later andere modules)
   ══════════════════════════════════════════════════════════════ */

const Bundel = (() => {

  // ── State ────────────────────────────────────────────────────
  let oefeningen = [];   // [{ id, type, opdrachtzin, instellingen }, ...]
  let volgendeId = 1;

  // ── Hulpcanvas voor PDF-rendering ─────────────────────────────
  const hulpCanvas = document.createElement('canvas');

  // ── Standaard opdrachtzinnen per type ─────────────────────────
  const STANDAARD_OPDRACHTZIN = {
    kloklezen_digitaal: "Schrijf de tijd op zoals op een digitale klok.",
    kloklezen_analoog:  "Schrijf de tijd op als een zin.",
  };

  function getOpdrachtzin(instellingen) {
    if (instellingen.type === 'kloklezen') {
      return instellingen.invulmethode === 'analoog'
        ? STANDAARD_OPDRACHTZIN.kloklezen_analoog
        : STANDAARD_OPDRACHTZIN.kloklezen_digitaal;
    }
    return "Maak de oefening.";
  }

  // ── Oefening toevoegen ────────────────────────────────────────
  function voegToe(instellingen, opdrachtzinOverride) {
    if (!instellingen) return;
    const id = volgendeId++;
    const opdrachtzin = opdrachtzinOverride || getOpdrachtzin(instellingen);
    oefeningen.push({ id, type: instellingen.type, opdrachtzin, instellingen });
    renderLijst();
    toonMelding(`✓ Oefening toegevoegd aan bundel (${oefeningen.length} totaal)`);
  }

  // ── Oefening verwijderen ──────────────────────────────────────
  function verwijder(id) {
    oefeningen = oefeningen.filter(o => o.id !== id);
    renderLijst();
  }

  // ── Preview-lijst renderen ────────────────────────────────────
  function renderLijst() {
    const lijst = document.getElementById('bundelLijst');
    const leeg  = document.getElementById('bundelLeeg');
    const teller = document.getElementById('bundelTeller');

    if (!lijst) return;

    lijst.innerHTML = '';
    leeg.style.display = oefeningen.length === 0 ? 'block' : 'none';
    teller.textContent = oefeningen.length > 0 ? `(${oefeningen.length})` : '';

    oefeningen.forEach((oef, index) => {
      const item = document.createElement('div');
      item.className = 'bundel-item';
      item.innerHTML = `
        <div class="bundel-item-nr">${index + 1}</div>
        <div class="bundel-item-info">
          <div class="bundel-item-type">${typeLabel(oef.type, oef.instellingen)}</div>
          <div class="bundel-item-opdracht">${oef.opdrachtzin}</div>
        </div>
        <button class="bundel-item-verwijder" title="Verwijder" onclick="Bundel.verwijder(${oef.id})">🗑</button>
      `;
      lijst.appendChild(item);
    });
  }

  function typeLabel(type, inst) {
    if (type === 'kloklezen') {
      const notatie = inst.tijdnotatie === '24uur' ? '24u' : '12u';
      const methode = inst.invulmethode === 'analoog' ? 'zin' : 'wekker';
      return `🕐 Kloklezen — ${inst.numClocks} klokken, ${notatie}, ${methode}`;
    }
    return type;
  }

  // ── Melding tonen ─────────────────────────────────────────────
  function toonMelding(tekst) {
    const el = document.getElementById('bundelMelding');
    if (!el) return;
    el.textContent = tekst;
    el.style.opacity = '1';
    clearTimeout(el._timer);
    el._timer = setTimeout(() => { el.style.opacity = '0'; }, 3000);
  }

  // ── PDF genereren ─────────────────────────────────────────────
  function downloadPdf() {
    if (oefeningen.length === 0) {
      toonMelding('Voeg eerst oefeningen toe aan de bundel.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW  = doc.internal.pageSize.getWidth();
    const pageH  = doc.internal.pageSize.getHeight();
    const margin = 10;

    // ── Paginaheader tekenen ──────────────────────────────────
    function tekenHeader(doc, paginaNr, totaalPaginas) {
      const naamY  = 16;
      const titelY = 26;
      const lijnY  = 30;

      doc.setFontSize(12); doc.setFont(undefined, 'normal');
      doc.text("Naam: _______________________", margin, naamY, { align: 'left' });
      doc.text("Datum: _______________", pageW - margin, naamY, { align: 'right' });

      const paginaTekst = totaalPaginas > 1 ? ` (${paginaNr}/${totaalPaginas})` : '';
      doc.setFontSize(14); doc.setFont(undefined, 'bold');
      doc.text(`Oefenen op kloklezen${paginaTekst}`, pageW / 2, titelY, { align: 'center' });
      doc.setFont(undefined, 'normal');

      doc.setDrawColor(100, 100, 100); doc.setLineWidth(0.4);
      doc.line(margin, lijnY, pageW - margin, lijnY);

      return 36; // yStart na header
    }

    // Eerst tellen hoeveel pagina's we krijgen (simpele schatting: 1 per oefening)
    // We tekenen meteen — jsPDF bouwt pagina's dynamisch op
    let eerstePagina = true;
    let paginaNr = 1;

    oefeningen.forEach((oef, index) => {
      if (!eerstePagina) {
        doc.addPage();
        paginaNr++;
      }
      eerstePagina = false;

      const yStart = tekenHeader(doc, paginaNr, '?');

      // Opdrachtzin
      const opdY = yStart + 6;
      doc.setFontSize(11); doc.setFont(undefined, 'italic');
      doc.text(oef.opdrachtzin, margin, opdY);
      doc.setFont(undefined, 'normal');

      const yNaOpdracht = opdY + 8;

      // Oefening tekenen
      if (oef.type === 'kloklezen') {
        KlokLezen.tekenInPdf(doc, oef.instellingen, hulpCanvas, yNaOpdracht, margin);
      }
      // Hier later andere types toevoegen:
      // else if (oef.type === 'verbinden') KlokVerbinden.tekenInPdf(...)
      // else if (oef.type === 'ordenen')   KlokOrdenen.tekenInPdf(...)
    });

    doc.save('kloklezen_bundel.pdf');
  }

  // ── Publieke API ──────────────────────────────────────────────
  return {
    voegToe,
    verwijder,
    downloadPdf,
  };

})();

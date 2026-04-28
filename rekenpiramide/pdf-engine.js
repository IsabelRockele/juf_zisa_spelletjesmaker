/* ─── PDF-ENGINE.JS ──────────────────────────────────────────────────────────
   Genereert PDF werkblad of sleutel met invullijnen, titel en opdrachtkader.
─────────────────────────────────────────────────────────────────────────── */

const PdfEngine = (() => {

  // ── Layout constanten (mm) ───────────────────────────────────────────────
  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN_X = 15;
  const MARGIN_TOP = 15;
  const MARGIN_BOTTOM = 15;

  // Vakje afmetingen
  const VAK_W = 12;
  const VAK_H = 10;

  // ── Helpers ──────────────────────────────────────────────────────────────
  function tekenHeader(doc, titel, opdracht) {
    let y = MARGIN_TOP;

    // Naam + datum lijnen
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);

    doc.text('Naam:', MARGIN_X, y + 4);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_X + 14, y + 4.5, MARGIN_X + 90, y + 4.5);

    doc.text('Datum:', PAGE_W - MARGIN_X - 60, y + 4);
    doc.line(PAGE_W - MARGIN_X - 44, y + 4.5, PAGE_W - MARGIN_X, y + 4.5);

    y += 12;

    // Titel gecentreerd
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(11, 79, 153);
    doc.text(titel, PAGE_W / 2, y + 4, { align: 'center' });

    y += 10;

    // Opdrachtkader
    doc.setDrawColor(245, 201, 122);
    doc.setFillColor(255, 244, 230);
    doc.setLineWidth(0.5);
    doc.roundedRect(MARGIN_X, y, PAGE_W - 2 * MARGIN_X, 10, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(122, 69, 0);
    doc.text(opdracht, MARGIN_X + 4, y + 6.5);

    y += 22;

    return y;
  }

  function tekenPiramide(doc, piramide, x, y, toonOplossing, nr) {
    const hoogte = piramide.rijen.length;
    const breedte = hoogte * VAK_W;

    // Nummer label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(95, 122, 143);
    doc.text(`Piramide ${nr}`, x + breedte / 2, y, { align: 'center' });

    const piramideStartY = y + 2.5;

    // Teken van boven naar onder (top eerst)
    for (let r = hoogte - 1; r >= 0; r--) {
      const rijLengte = piramide.rijen[r].length;
      const rijBreedte = rijLengte * VAK_W;
      const rijStartX = x + (breedte - rijBreedte) / 2;
      const rijY = piramideStartY + (hoogte - 1 - r) * VAK_H;

      for (let i = 0; i < rijLengte; i++) {
        const vakX = rijStartX + i * VAK_W;
        const isLeeg = piramide.leeg[r][i];

        // Vakje tekenen
        doc.setLineWidth(0.4);
        doc.setDrawColor(43, 74, 101);

        if (isLeeg && toonOplossing) {
          // Sleutel: lichtgroene achtergrond
          doc.setFillColor(237, 250, 243);
          doc.rect(vakX, rijY, VAK_W, VAK_H, 'FD');
        } else {
          doc.setFillColor(255, 255, 255);
          doc.rect(vakX, rijY, VAK_W, VAK_H, 'FD');
        }

        // Tekst
        if (!isLeeg) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(22, 45, 68);
          doc.text(
            String(piramide.rijen[r][i]),
            vakX + VAK_W / 2,
            rijY + VAK_H / 2 + 1.5,
            { align: 'center' }
          );
        } else if (toonOplossing) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(23, 122, 78);
          doc.text(
            String(piramide.rijen[r][i]),
            vakX + VAK_W / 2,
            rijY + VAK_H / 2 + 1.5,
            { align: 'center' }
          );
        }
      }
    }

    return piramideStartY + hoogte * VAK_H;
  }

  // ── Layout: piramides verdelen over pagina ───────────────────────────────
  function berekenLayout(piramides, hoogte) {
    // Beschikbare breedte
    const beschikbBreedte = PAGE_W - 2 * MARGIN_X;
    // Breedte van 1 piramide
    const piramideBreedte = hoogte * VAK_W;
    // Aantal kolommen dat past (met wat tussenruimte)
    const minSpacing = 8;
    const aantalKolommen = Math.max(1, Math.floor((beschikbBreedte + minSpacing) / (piramideBreedte + minSpacing)));
    // Werkelijke spacing
    const spacing = (beschikbBreedte - aantalKolommen * piramideBreedte) / Math.max(1, aantalKolommen - 1);

    // Hoogte van 1 piramide-blok (incl. label boven + ruimte onder voor witregel)
    const piramideHoogte = 3 + hoogte * VAK_H + 14; // label (3) + piramide + extra witregel (14)

    return { aantalKolommen, spacing, piramideBreedte, piramideHoogte };
  }

  // ── Hoofdfunctie ─────────────────────────────────────────────────────────
  function genereer(piramides, opties) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const titel = opties.titel || 'Rekenpiramides';
    const opdracht = opties.opdracht || 'Vul de lege vakjes in.';
    const toonOplossing = opties.toonOplossing || false;

    const hoogte = piramides[0].rijen.length;
    const layout = berekenLayout(piramides, hoogte);

    let y = tekenHeader(doc, toonOplossing ? `${titel} — Sleutel` : titel, opdracht);
    let kolomIdx = 0;

    for (let p = 0; p < piramides.length; p++) {
      // Nieuwe rij?
      if (kolomIdx === 0 && p > 0) {
        y += layout.piramideHoogte;
      }

      // Nieuwe pagina?
      if (y + layout.piramideHoogte > PAGE_H - MARGIN_BOTTOM) {
        doc.addPage();
        y = tekenHeader(doc, toonOplossing ? `${titel} — Sleutel` : titel, opdracht);
        kolomIdx = 0;
      }

      const x = MARGIN_X + kolomIdx * (layout.piramideBreedte + layout.spacing);
      tekenPiramide(doc, piramides[p], x, y, toonOplossing, p + 1);

      kolomIdx++;
      if (kolomIdx >= layout.aantalKolommen) {
        kolomIdx = 0;
      }
    }

    const bestandsnaam = toonOplossing
      ? 'rekenpiramides-sleutel.pdf'
      : 'rekenpiramides-werkblad.pdf';
    doc.save(bestandsnaam);
  }

  return { genereer };

})();
/* ─── PDF-ENGINE.JS ──────────────────────────────────────────────────────────
   Genereert PDF werkblad of sleutel voor rekendriehoeken.

   STRUCTUUR (zoals in echte rekendriehoeken):
     - Driehoek opgedeeld in 3 binnenvakken door 3 lijnen die LOPEN
       VAN HET ZWAARTEPUNT NAAR DE MIDDENS VAN ELKE ZIJDE (Y-vorm).
     - 3 binnenvakken: a (top), b (links onder), c (rechts onder)
     - 3 sommen op de zijden, BUITEN de driehoek
─────────────────────────────────────────────────────────────────────────── */

const PdfEngine = (() => {

  // ── Layout constanten (mm) ───────────────────────────────────────────────
  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN_X = 15;
  const MARGIN_TOP = 15;
  const MARGIN_BOTTOM = 15;

  // ── Header tekenen ───────────────────────────────────────────────────────
  function tekenHeader(doc, titel, opdracht) {
    let y = MARGIN_TOP;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);

    doc.text('Naam:', MARGIN_X, y + 4);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_X + 14, y + 4.5, MARGIN_X + 90, y + 4.5);

    doc.text('Datum:', PAGE_W - MARGIN_X - 60, y + 4);
    doc.line(PAGE_W - MARGIN_X - 44, y + 4.5, PAGE_W - MARGIN_X, y + 4.5);

    y += 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(11, 79, 153);
    doc.text(titel, PAGE_W / 2, y + 4, { align: 'center' });

    y += 10;

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

  // ── KLASSIEKE driehoek tekenen ───────────────────────────────────────────
  function tekenKlassiek(doc, driehoek, x, y, size, toonOplossing, nr) {
    const w = driehoek.waarden;
    const g = driehoek.gegeven;

    // Nummer label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(95, 122, 143);
    doc.text(`Driehoek ${nr}`, x + size / 2, y, { align: 'center' });

    const startY = y + 3;

    // Driehoek hoekpunten (gelijkzijdig)
    const padX = size * 0.10;
    const padTop = size * 0.05;
    const padBottom = size * 0.20; // ruimte onder voor sumBC

    const TOP   = { x: x + size / 2,        y: startY + padTop };
    const LEFT  = { x: x + padX,            y: startY + size - padBottom };
    const RIGHT = { x: x + size - padX,     y: startY + size - padBottom };

    const CENTROID = {
      x: (TOP.x + LEFT.x + RIGHT.x) / 3,
      y: (TOP.y + LEFT.y + RIGHT.y) / 3
    };

    // Middens van de 3 zijden (Y-vorm: vanuit CENTROID naar deze 3 punten)
    function mid(p1, p2) { return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }; }
    const MID_LEFT_SIDE   = mid(TOP, LEFT);
    const MID_RIGHT_SIDE  = mid(TOP, RIGHT);
    const MID_BOTTOM_SIDE = mid(LEFT, RIGHT);

    // Centra van de 3 binnenvakken (waar de getallen komen)
    // Iets hoger geplaatst dan zwaartepunt zodat ze niet te laag staan
    const VAK_CENTRA = {
      a: {
        x: TOP.x,
        y: TOP.y + (CENTROID.y - TOP.y) * 0.45
      },
      b: {
        x: LEFT.x + (CENTROID.x - LEFT.x) * 0.55,
        y: LEFT.y - (LEFT.y - CENTROID.y) * 0.55
      },
      c: {
        x: RIGHT.x + (CENTROID.x - RIGHT.x) * 0.55,
        y: RIGHT.y - (RIGHT.y - CENTROID.y) * 0.55
      }
    };

    // Posities sommen (buiten de driehoek)
    function out(m, c, off) {
      const dx = m.x - c.x, dy = m.y - c.y;
      const len = Math.sqrt(dx*dx + dy*dy) || 1;
      return { x: m.x + dx/len*off, y: m.y + dy/len*off };
    }

    const offset = size * 0.10;
    const SOM = {
      sumAB: out(MID_LEFT_SIDE,   CENTROID, offset),
      sumAC: out(MID_RIGHT_SIDE,  CENTROID, offset),
      sumBC: out(MID_BOTTOM_SIDE, CENTROID, offset + 0.5)
    };

    // Buitendriehoek
    doc.setLineWidth(0.6);
    doc.setDrawColor(43, 74, 101);
    doc.line(TOP.x, TOP.y, LEFT.x, LEFT.y);
    doc.line(LEFT.x, LEFT.y, RIGHT.x, RIGHT.y);
    doc.line(RIGHT.x, RIGHT.y, TOP.x, TOP.y);

    // Y-vorm: vanuit zwaartepunt naar middens van zijden
    doc.setLineWidth(0.4);
    doc.line(CENTROID.x, CENTROID.y, MID_LEFT_SIDE.x,   MID_LEFT_SIDE.y);
    doc.line(CENTROID.x, CENTROID.y, MID_RIGHT_SIDE.x,  MID_RIGHT_SIDE.y);
    doc.line(CENTROID.x, CENTROID.y, MID_BOTTOM_SIDE.x, MID_BOTTOM_SIDE.y);

    // Binnenvak tekenen
    function tekenBinnenvak(key) {
      const p = VAK_CENTRA[key];
      const isGegeven = !!g[key];
      const waarde = w[key];
      // Vakgrootte schaalt met driehoekgrootte (~17% van size voor breedte)
      const vakBreedte = size * 0.18;
      const vakHoogte = size * 0.12;
      const fontSize = Math.max(9, Math.min(13, size * 0.18));

      if (isGegeven) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fontSize);
        doc.setTextColor(11, 79, 153);
        doc.text(String(waarde), p.x, p.y + fontSize * 0.13, { align: 'center' });
      } else if (toonOplossing) {
        doc.setLineWidth(0.3);
        doc.setDrawColor(150, 200, 175);
        doc.setFillColor(237, 250, 243);
        doc.roundedRect(p.x - vakBreedte/2, p.y - vakHoogte/2, vakBreedte, vakHoogte, 1, 1, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fontSize);
        doc.setTextColor(23, 122, 78);
        doc.text(String(waarde), p.x, p.y + fontSize * 0.13, { align: 'center' });
      } else {
        // Leeg invulkader (binnen driehoek)
        doc.setLineWidth(0.35);
        doc.setDrawColor(154, 174, 184);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(p.x - vakBreedte/2, p.y - vakHoogte/2, vakBreedte, vakHoogte, 1, 1, 'FD');
      }
    }

    // Som-vak tekenen (buiten driehoek)
    function tekenSomVak(key) {
      const p = SOM[key];
      const isGegeven = !!g[key];
      const waarde = w[key];
      const vakBreedte = size * 0.20;
      const vakHoogte = size * 0.135;
      const fontSize = Math.max(9, Math.min(13, size * 0.18));

      if (isGegeven) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fontSize);
        doc.setTextColor(11, 79, 153);
        doc.text(String(waarde), p.x, p.y + fontSize * 0.13, { align: 'center' });
      } else if (toonOplossing) {
        doc.setLineWidth(0.3);
        doc.setDrawColor(150, 200, 175);
        doc.setFillColor(237, 250, 243);
        doc.roundedRect(p.x - vakBreedte/2, p.y - vakHoogte/2, vakBreedte, vakHoogte, 1.2, 1.2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fontSize);
        doc.setTextColor(23, 122, 78);
        doc.text(String(waarde), p.x, p.y + fontSize * 0.13, { align: 'center' });
      } else {
        // Leeg kader (groter)
        doc.setLineWidth(0.4);
        doc.setDrawColor(154, 174, 184);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(p.x - vakBreedte/2, p.y - vakHoogte/2, vakBreedte, vakHoogte, 1.2, 1.2, 'FD');
      }
    }

    tekenBinnenvak('a');
    tekenBinnenvak('b');
    tekenBinnenvak('c');
    tekenSomVak('sumAB');
    tekenSomVak('sumAC');
    tekenSomVak('sumBC');
  }

  // ── MAGISCHE driehoek tekenen (cirkels) ──────────────────────────────────
  function tekenMagisch(doc, driehoek, x, y, size, toonOplossing, nr) {
    const opl = driehoek.oplossing;
    const cijfers = driehoek.cijferreeks;

    // Bepaal hoeveel karakters het grootste cijfer telt — bepaalt cirkelgrootte
    const grootsteCijfer = Math.max(...cijfers);
    const aantalDigits = String(grootsteCijfer).length;

    // Nummer label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(95, 122, 143);
    doc.text(`Driehoek ${nr} • magisch`, x + size / 2, y, { align: 'center' });

    const startY = y + 3;

    // Cirkelgrootte schaalt met aantal digits
    // 1-digit: 0.075, 2-digit: 0.10, 3-digit: 0.13, 4-digit: 0.15
    const cirkelFactor = aantalDigits === 1 ? 0.080
                       : aantalDigits === 2 ? 0.105
                       : aantalDigits === 3 ? 0.130
                       : 0.150;
    const cirkelR = size * cirkelFactor;

    // Driehoek hoekpunten — extra padding voor grotere cirkels
    const extraPad = (cirkelR - size * 0.075) * 0.6; // bij grotere cirkel meer ruimte rondom
    const padX = size * 0.10 + extraPad;
    const padTop = size * 0.10 + extraPad;
    const padBottom = size * 0.22 + extraPad; // ruimte onder voor cijfertekst (vergroot)

    const TOP   = { x: x + size / 2,    y: startY + padTop };
    const LEFT  = { x: x + padX,        y: startY + size - padBottom };
    const RIGHT = { x: x + size - padX, y: startY + size - padBottom };

    function mid(p1, p2) { return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }; }
    const POS = {
      H1:  TOP,
      H2:  LEFT,
      H3:  RIGHT,
      M12: mid(TOP, LEFT),
      M13: mid(TOP, RIGHT),
      M23: mid(LEFT, RIGHT)
    };

    // Lettergrootte in cirkels schaalt met cirkelgrootte
    const fontSize = Math.max(8, Math.min(13, cirkelR * 1.5));

    // Buitendriehoek
    doc.setLineWidth(0.6);
    doc.setDrawColor(43, 74, 101);
    doc.line(TOP.x, TOP.y, LEFT.x, LEFT.y);
    doc.line(LEFT.x, LEFT.y, RIGHT.x, RIGHT.y);
    doc.line(RIGHT.x, RIGHT.y, TOP.x, TOP.y);

    // Cirkels tekenen
    function tekenCirkel(key) {
      const p = POS[key];
      const waarde = opl ? opl[key] : null;

      if (toonOplossing && waarde !== null) {
        doc.setLineWidth(0.4);
        doc.setDrawColor(150, 200, 175);
        doc.setFillColor(237, 250, 243);
        doc.circle(p.x, p.y, cirkelR, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fontSize);
        doc.setTextColor(23, 122, 78);
        doc.text(String(waarde), p.x, p.y + fontSize * 0.13, { align: 'center' });
      } else {
        doc.setLineWidth(0.5);
        doc.setDrawColor(43, 74, 101);
        doc.setFillColor(255, 255, 255);
        doc.circle(p.x, p.y, cirkelR, 'FD');
      }
    }

    tekenCirkel('H1');
    tekenCirkel('H2');
    tekenCirkel('H3');
    tekenCirkel('M12');
    tekenCirkel('M13');
    tekenCirkel('M23');

    // Cijferreeks tekst onder — altijd font 14 zoals gevraagd
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(11, 79, 153);
    const cijferTekst = `Vul in: ${cijfers.join(', ')}`;
    doc.text(cijferTekst, x + size / 2, startY + size - 1, { align: 'center' });
  }

  // ── DISPATCHER ─────────────────────────────────────────────────────────────
  function tekenDriehoek(doc, driehoek, x, y, size, toonOplossing, nr) {
    if (driehoek.type === 'magisch') {
      tekenMagisch(doc, driehoek, x, y, size, toonOplossing, nr);
    } else {
      tekenKlassiek(doc, driehoek, x, y, size, toonOplossing, nr);
    }
  }

  // ── Layout: hoeveel driehoeken per pagina/rij ────────────────────────────
  // Bij klassieke driehoeken steken de som-vakken uit aan zij/onderkant van de
  // driehoek-zone (size). Het kader moet die uitstekende vakken omvatten.
  // We maken de horizontale "kader-padding" daarom evenredig met size.
  const KADER_PAD_TOP = 5;
  const KADER_PAD_BOT = 5;
  const MIN_GAP = 5;

  function berekenLayout(aantal, heeftMagisch) {
    let kolommen, voorkeurSize;

    if (heeftMagisch) {
      if (aantal === 1) { kolommen = 1; voorkeurSize = 120; }
      else if (aantal === 2) { kolommen = 2; voorkeurSize = 85; }
      else if (aantal === 4) { kolommen = 2; voorkeurSize = 85; }
      else if (aantal === 6) { kolommen = 2; voorkeurSize = 80; }
      else { kolommen = 2; voorkeurSize = 70; }
    } else {
      if (aantal === 1) { kolommen = 1; voorkeurSize = 130; }
      else if (aantal === 2) { kolommen = 2; voorkeurSize = 88; }
      else if (aantal === 4) { kolommen = 2; voorkeurSize = 80; }
      else if (aantal === 6) { kolommen = 3; voorkeurSize = 50; }
      else { kolommen = 3; voorkeurSize = 46; }
    }

    const beschikbBreedte = PAGE_W - 2 * MARGIN_X;

    function berekenPadHor(s, isMagisch) {
      // Klassieke: somvakken steken iets uit aan zijkanten (~5% van size).
      // Magisch: cirkels schalen ook met cijfers, dus iets meer marge.
      return isMagisch ? 5 : Math.max(5, s * 0.06);
    }

    let size = voorkeurSize;
    for (let i = 0; i < 5; i++) {
      const padHor = berekenPadHor(size, heeftMagisch);
      const kaderBreedte = size + 2 * padHor;
      const totaalNodig = kolommen * kaderBreedte + (kolommen - 1) * MIN_GAP;
      if (totaalNodig <= beschikbBreedte) break;
      // Verklein size proportioneel
      size = size * (beschikbBreedte - (kolommen - 1) * MIN_GAP) / (kolommen * kaderBreedte);
    }

    const padHor = berekenPadHor(size, heeftMagisch);
    const kaderBreedte = size + 2 * padHor;
    const gap = kolommen > 1
      ? (beschikbBreedte - kolommen * kaderBreedte) / (kolommen - 1)
      : 0;

    return { kolommen, size, kaderBreedte, gap, padHor };
  }

  // ── Hoofdfunctie ─────────────────────────────────────────────────────────
  function genereer(driehoeken, opties) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const titel = opties.titel || 'Rekendriehoeken';
    const opdracht = opties.opdracht || 'Tel de getallen in de driehoek bij elkaar op. Schrijf de uitkomst in het vakje buiten de driehoek.';
    const toonOplossing = opties.toonOplossing || false;

    // Heeft set magische driehoeken? → andere layout
    const heeftMagisch = driehoeken.some(d => d.type === 'magisch');
    const layout = berekenLayout(driehoeken.length, heeftMagisch);
    // Extra ruimte: zowel klassiek als magisch krijgen ademruimte tussen rijen
    const extraRuimte = heeftMagisch ? 26 : 22;
    const driehoekHoogte = layout.size + extraRuimte;

    let y = tekenHeader(doc, toonOplossing ? `${titel} — Sleutel` : titel, opdracht);
    let kolomIdx = 0;

    for (let p = 0; p < driehoeken.length; p++) {
      if (kolomIdx === 0 && p > 0) {
        y += driehoekHoogte;
      }

      if (y + driehoekHoogte > PAGE_H - MARGIN_BOTTOM) {
        doc.addPage();
        y = tekenHeader(doc, toonOplossing ? `${titel} — Sleutel` : titel, opdracht);
        kolomIdx = 0;
      }

      // Kader-positie en driehoek-positie
      const kaderX = MARGIN_X + kolomIdx * (layout.kaderBreedte + layout.gap);
      const x = kaderX + layout.padHor;

      // Subtiel kader rondom elke driehoek (klassiek én magisch)
      doc.setLineWidth(0.3);
      doc.setDrawColor(220, 230, 240);
      doc.setFillColor(252, 254, 255);
      doc.roundedRect(
        kaderX,
        y - KADER_PAD_TOP,
        layout.kaderBreedte,
        driehoekHoogte - 8,
        3, 3, 'FD'
      );

      tekenDriehoek(doc, driehoeken[p], x, y, layout.size, toonOplossing, p + 1);

      kolomIdx++;
      if (kolomIdx >= layout.kolommen) {
        kolomIdx = 0;
      }
    }

    const bestandsnaam = toonOplossing
      ? 'rekendriehoeken-sleutel.pdf'
      : 'rekendriehoeken-werkblad.pdf';
    doc.save(bestandsnaam);
  }

  return { genereer };

})();
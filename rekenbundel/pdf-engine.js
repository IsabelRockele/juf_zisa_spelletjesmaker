/* ══════════════════════════════════════════════════════════════
   pdf-engine.js — Verantwoordelijkheid: PDF tekenen vanuit bundelData
   ══════════════════════════════════════════════════════════════ */

const PdfEngine = (() => {

  const PW = 210, PH = 297;
  const ML = 14, MR = 14, MT = 15, MB = 15;
  const CW = PW - ML - MR;

  const KOLOMMEN   = 4;
  const RIJHOOGTE  = 18;
  const ZINRUIMTE  = 9;
  const RIJ_GAP    = 3;
  const NABLOK     = 10;
  const MIN_RUIMTE = ZINRUIMTE + RIJHOOGTE + RIJ_GAP;

  // Herken-brug: één groot kader per oefening
  // bovenzijde = Zisa, onderzijde = som + invulvakje
  const HRK_IMG_H  = 20;   // hoogte Zisa-zone in kader (mm)
  const HRK_SOM_H  = 12;   // hoogte som-zone in kader (mm)
  const HRK_KAD_H  = HRK_IMG_H + HRK_SOM_H + 4; // totale kaderhoogte
  const HRK_RIJ_H  = HRK_KAD_H + 8;  // rij hoogte incl. ruimte eronder
  const HRK_MIN    = ZINRUIMTE + HRK_RIJ_H;

  let doc, y, _lampBase64Cache;

  /* ── Hulpfuncties ────────────────────────────────────────── */
  function nieuweBladzijde() { doc.addPage(); y = MT; }
  function checkRuimte(nodig) { if (y + nodig > PH - MB) nieuweBladzijde(); }
  function lijn(x1, y1, x2, y2, rgb, dikte) {
    doc.setDrawColor(...rgb); doc.setLineWidth(dikte);
    doc.line(x1, y1, x2, y2);
  }

  /* ── Koptekst ────────────────────────────────────────────── */
  function _tekenKoptekst(titel) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text('Naam: _______________________________', ML, y);
    doc.text('Datum: ________________', ML + CW - 58, y);
    y += 7;
    lijn(ML, y, ML + CW, y, [200,200,200], 0.4);
    y += 9;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(26, 58, 92);
    doc.text(titel, PW / 2, y, { align: 'center' });
    y += 9;
    lijn(ML, y, ML + CW, y, [74,144,217], 1.0);
    y += 11;
  }

  /* ── Gewone oefeningen rij ───────────────────────────────── */
  function _tekenRij(oefeningen, aantalKolommen = KOLOMMEN) {
    const kolB = CW / aantalKolommen;
    const kadW = kolB - 4;
    const kadH = RIJHOOGTE - 1;

    oefeningen.forEach((oef, kol) => {
      const ox = ML + kol * kolB + 2;
      const oy = y;

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(180, 200, 225);
      doc.setLineWidth(0.6);
      doc.roundedRect(ox, oy, kadW, kadH, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(44, 62, 80);
      doc.text(oef.vraag, ox + 3, oy + kadH / 2 + 2);

      const vakW = 16, vakH = kadH - 5;
      const tekstB = doc.getTextWidth(oef.vraag);
      const vakX = ox + 3 + tekstB + 2;
      const vakY = oy + (kadH - vakH) / 2;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(26, 58, 92);
      doc.setLineWidth(0.6);
      doc.roundedRect(vakX, vakY, vakW, vakH, 2, 2, 'FD');
    });

    y += RIJHOOGTE + RIJ_GAP;
  }

  /* ── Hulpmiddelen rij (2 per rij) ────────────────────────── */
  const HULP_SPLITS_H = 24;  // hoogte splitsbeen-zone (been + vakjes)
  const HULP_LIJN_W   = 24;  // breedte schrijflijnen
  const HULP_KAD_H    = RIJHOOGTE + HULP_SPLITS_H + 6;  // basis (2 lijnen)
  const HULP_RIJ_H    = HULP_KAD_H + 6;

  function _hulpKadH(schrijflijnenAantal) {
    // Elke extra lijn (boven 2) voegt 8mm toe
    return HULP_KAD_H + Math.max(0, schrijflijnenAantal - 2) * 8;
  }

  function _tekenHulpRij(oefeningen, heeftSplits, heeftLijnen, bewerking, splitspositie, schrijflijnenAantal = 2) {
    const kolB   = CW / 2;
    const kadW   = kolB - 6;
    const marge  = 3;
    const beenSpan = 6;
    const vakjW = 9, vakjH = 7;
    const kadH   = _hulpKadH(schrijflijnenAantal);
    const rijH   = kadH + 6;

    oefeningen.forEach((oef, kol) => {
      const oy     = y;
      const ox     = ML + kol * kolB + 3;   // kader altijd op vaste positie
      const kadEindX = ox + kadW;

      // Bereken centreX voor splitsbeen — moet vóór somMarge want doelGetal nodig
      const delen   = oef.vraag.replace(' =', '').trim().split(' ');
      const doelIdx = (bewerking === 'optellen') ? 2 : (splitspositie === 'aftrekker' ? 2 : 0);
      const doelGetal = parseInt(delen[doelIdx]) || 0;
      const isHTE = doelGetal >= 100 && doelGetal % 100 !== 0 && doelGetal % 10 !== 0;
      const aantalTakken = isHTE ? 3 : 2;
      const beenSpanW = aantalTakken === 3 ? 10 : beenSpan;

      // Bij aftrektal: som naar rechts zodat linkervakje splitsbeen in kader valt
      // Bij 3 takken is de boom breder → meer marge nodig
      const isAftrektal = heeftSplits && bewerking === 'aftrekken' && splitspositie === 'aftrektal';
      const extraMarge = isAftrektal ? (aantalTakken === 3 ? 13 : 6) : 0;
      const somMarge = marge + extraMarge;
      const somStartX = ox + somMarge;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      let xOff = somStartX;
      for (let i = 0; i < doelIdx; i++) xOff += doc.getTextWidth(delen[i] + ' ');
      const getalB  = doc.getTextWidth(delen[doelIdx] || '');
      const centreX = xOff + getalB / 2;

      // Buitenkader — altijd op vaste positie, nooit uitbreiden
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(180, 200, 225);
      doc.setLineWidth(0.6);
      doc.roundedRect(ox, oy, kadW, kadH, 2, 2, 'FD');

      // Somtekst
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(44, 62, 80);
      const somY = oy + 7;
      doc.text(oef.vraag, somStartX, somY);

      // Invulvakje — kleiner zodat er ruimte overblijft
      const vakY = oy + 2;
      const vakW = 10, vakH = 9;
      const somBreedte = doc.getTextWidth(oef.vraag);
      const vakX = somStartX + somBreedte + 2;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(26, 58, 92);
      doc.setLineWidth(0.5);
      doc.roundedRect(vakX, vakY, vakW, vakH, 1.5, 1.5, 'FD');

      // Schrijflijnen — onder splitsbenen of antwoordvak
      if (heeftLijnen) {
        const lX1 = ox + marge;
        const lX2 = ox + kadW - marge - 2;
        // beenZone: top(somY+3) + beenH(6) + gap(1) + vakjH(7) = 17mm na somY
        const lY1 = heeftSplits
          ? somY + 3 + 6 + 1 + 7 + 10   // onder splitsbeen-vakjes + 10mm spatie
          : vakY + vakH + 7;              // onder antwoordvak + 7mm
        const lijnGap = 8;
        if (lX2 > lX1 + 5) {
          doc.setDrawColor(160, 185, 210);
          doc.setLineWidth(0.4);
          for (let li = 0; li < schrijflijnenAantal; li++) {
            doc.line(lX1, lY1 + li * lijnGap, lX2, lY1 + li * lijnGap);
          }
        }
      }

      // Splitsbeen: 2 of 3 takken (doelGetal/isHTE/aantalTakken/beenSpanW al berekend bovenaan)
      if (heeftSplits) {
        const beenTop = somY + 3;
        const beenH   = 6;
        doc.setDrawColor(26, 58, 92);
        doc.setLineWidth(0.6);

        if (aantalTakken === 3) {
          doc.line(centreX, beenTop, centreX - beenSpanW, beenTop + beenH);
          doc.line(centreX, beenTop, centreX,              beenTop + beenH);
          doc.line(centreX, beenTop, centreX + beenSpanW, beenTop + beenH);
        } else {
          doc.line(centreX, beenTop, centreX - beenSpan, beenTop + beenH);
          doc.line(centreX, beenTop, centreX + beenSpan, beenTop + beenH);
        }

        const vakjY = beenTop + beenH + 1;
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(26, 58, 92);
        doc.setLineWidth(0.5);
        if (aantalTakken === 3) {
          doc.roundedRect(centreX - beenSpanW - vakjW / 2, vakjY, vakjW, vakjH, 1, 1, 'FD');
          doc.roundedRect(centreX - vakjW / 2,              vakjY, vakjW, vakjH, 1, 1, 'FD');
          doc.roundedRect(centreX + beenSpanW - vakjW / 2, vakjY, vakjW, vakjH, 1, 1, 'FD');
        } else {
          doc.roundedRect(centreX - beenSpan - vakjW / 2, vakjY, vakjW, vakjH, 1, 1, 'FD');
          doc.roundedRect(centreX + beenSpan - vakjW / 2, vakjY, vakjW, vakjH, 1, 1, 'FD');
        }
      }
    });

    y += rijH;
  }

  /* ── Aanvullen constanten ────────────────────────────────── */
  const AANV_KAD_H_ZONDER  = 32;
  const AANV_KAD_H_SCHEMA  = 50;
  const AANV_KAD_H_SCHIJF  = 62;
  const AANV_KOLOMMEN      = 3;   // zonder-schema en met-schema: 3 per rij
  const AANV_KOLOMMEN_SCHIJF = 2; // met-schijfjes: 2 per rij (meer ruimte nodig)

  function _aanvulKadH(variant) {
    if (variant === 'met-schema')   return AANV_KAD_H_SCHEMA;
    if (variant === 'met-schijfjes') return AANV_KAD_H_SCHIJF;
    return AANV_KAD_H_ZONDER;
  }

  function _tekenAanvullenRij(oefeningen, variant) {
    const aantalKol = variant === 'met-schijfjes' ? AANV_KOLOMMEN_SCHIJF : AANV_KOLOMMEN;
    const kolB  = CW / aantalKol;
    const kadW  = kolB - 6;
    const marge = 3;
    const kadH  = _aanvulKadH(variant);

    oefeningen.forEach((oef, kol) => {
      const ox = ML + kol * kolB + 3;
      const oy = y;

      // Kader
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(180, 200, 225);
      doc.setLineWidth(0.6);
      doc.roundedRect(ox, oy, kadW, kadH, 2, 2, 'FD');

      const delen = oef.vraag.replace(' =', '').split(' ');
      const groot = parseInt(delen[0]);
      const klein = parseInt(delen[2]);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(44, 62, 80);

      // Sommen wat lager zodat tekst niet boven kader uitsteekt
      const somY1 = oy + 10;
      const somY2 = somY1 + 12;
      const hW = 12, hH = 10;

      const som1  = `${groot} - ${klein} =`;
      const som2  = `${klein} +`;
      const som2b = `= ${groot}`;

      doc.text(som1, ox + marge, somY1);
      doc.text(som2, ox + marge, somY2);
      doc.text(som2b, ox + marge + doc.getTextWidth(som2) + hW + 3, somY2);

      // Invulhokjes verticaal gecentreerd op de tekstregels
      const hY1 = somY1 - hH + 2;
      const hY2 = somY2 - hH + 2;
      _tekenInvulhokje(ox + marge + doc.getTextWidth(som1) + 1.5, hY1, hW, hH);
      _tekenInvulhokje(ox + marge + doc.getTextWidth(som2) + 1.5, hY2, hW, hH);

      // Extra inhoud per variant
      if (variant === 'met-schema') {
        _tekenAanvulSchema(ox, oy, kadW, marge, somY2, groot, klein);
      } else if (variant === 'met-schijfjes') {
        _tekenAanvulSchijfjes(ox, oy, kadW, marge, somY2, groot, klein);
      }
    });

    y += kadH + 5;
  }

  function _tekenInvulhokje(x, y, w, h) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(26, 58, 92);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, w, h, 1.5, 1.5, 'FD');
  }

  function _tekenAanvulSchema(ox, oy, kadW, marge, somY2, groot, klein) {
    const tabX  = ox + marge;
    const tabY  = somY2 + 5;
    const tabW  = kadW - marge * 2;
    const tabH1 = 8;   // bovenrij (groot getal)
    const tabH2 = 8;   // onderrij
    const vraagW = tabW * 0.25; // vraagtekenvak = 1/4

    // Buitenkader tabel
    doc.setDrawColor(26, 58, 92);
    doc.setLineWidth(0.5);
    doc.setFillColor(214, 234, 248); // lichtblauw
    doc.roundedRect(tabX, tabY, tabW, tabH1, 1, 1, 'FD');
    doc.setFillColor(213, 245, 227); // lichtgroen
    doc.rect(tabX, tabY + tabH1, tabW - vraagW, tabH2, 'FD');
    doc.setFillColor(253, 254, 254); // wit
    doc.rect(tabX + tabW - vraagW, tabY + tabH1, vraagW, tabH2, 'FD');
    doc.setDrawColor(26, 58, 92);
    doc.setLineWidth(0.5);
    doc.rect(tabX, tabY, tabW, tabH1 + tabH2); // omlijning
    doc.line(tabX, tabY + tabH1, tabX + tabW, tabY + tabH1); // horizontale lijn
    doc.line(tabX + tabW - vraagW, tabY + tabH1, tabX + tabW - vraagW, tabY + tabH1 + tabH2); // verticale lijn

    // Tekst
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(44, 62, 80);
    doc.text(`${groot}`, tabX + tabW / 2, tabY + tabH1 - 1.5, { align: 'center' });
    doc.text(`${klein}`, tabX + (tabW - vraagW) / 2, tabY + tabH1 + tabH2 - 1.5, { align: 'center' });
    doc.setTextColor(180, 180, 180);
    doc.text('?', tabX + tabW - vraagW / 2, tabY + tabH1 + tabH2 - 1.5, { align: 'center' });
  }

  function _tekenAanvulSchijfjes(ox, oy, kadW, marge, somY2, groot, klein) {
    const hKlein = Math.floor(klein / 100);
    const tKlein = Math.floor((klein % 100) / 10);
    const eKlein = klein % 10;
    const hGroot = Math.floor(groot / 100);
    const metH   = hGroot > 0;  // H-kolom enkel bij tot 1000
    const TOTAAL  = 10;
    const schY    = somY2 + 9;
    const aantalKol = metH ? 3 : 2;
    const kolW    = (kadW - marge * 2) / aantalKol;
    const kopH    = 5;
    const schijfD = aantalKol === 3 ? 4.2 : 5.2;  // kleiner bij 3 kolommen
    const gap     = 0.9;
    const rijH    = schijfD + gap;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setDrawColor(170, 170, 170);
    doc.setLineWidth(0.4);

    // H header — blauw (enkel bij tot 1000)
    if (metH) {
      doc.setFillColor(214, 234, 248);
      doc.rect(ox + marge, schY, kolW, kopH, 'FD');
      doc.setTextColor(26, 82, 118);
      doc.text('H', ox + marge + kolW / 2, schY + kopH - 1, { align: 'center' });
    }

    // T header — groen
    const tKolX = ox + marge + (metH ? kolW : 0);
    doc.setFillColor(171, 235, 198);
    doc.rect(tKolX, schY, kolW, kopH, 'FD');
    doc.setTextColor(30, 132, 73);
    doc.text('T', tKolX + kolW / 2, schY + kopH - 1, { align: 'center' });

    // E header — geel
    const eKolX = tKolX + kolW;
    doc.setFillColor(254, 249, 231);
    doc.rect(eKolX, schY, kolW, kopH, 'FD');
    doc.setTextColor(154, 125, 10);
    doc.text('E', eKolX + kolW / 2, schY + kopH - 1, { align: 'center' });

    // Kader rondom alle kolommen
    const totW = kolW * aantalKol;
    doc.setDrawColor(170, 170, 170);
    doc.setLineWidth(0.4);
    doc.rect(ox + marge, schY, totW, kopH + rijH * 2 + gap);
    if (metH) doc.line(ox + marge + kolW, schY, ox + marge + kolW, schY + kopH + rijH * 2 + gap);
    doc.line(tKolX + kolW, schY, tKolX + kolW, schY + kopH + rijH * 2 + gap);

    const rij1Y = schY + kopH + gap;
    const rij2Y = rij1Y + rijH;

    function tekenRij(rijY, startIdx, eindIdx, kolX, aantalVoor, kleur, tekst, tekstKleur) {
      for (let i = startIdx; i < eindIdx; i++) {
        const sx = kolX + gap + (i - startIdx) * (schijfD + gap) + schijfD / 2;
        const sy = rijY + schijfD / 2;
        if (i < aantalVoor) {
          doc.setFillColor(...kleur);
          doc.setDrawColor(kleur[0]-40, kleur[1]-40, kleur[2]-40);
        } else {
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(180, 180, 180);
        }
        doc.setLineWidth(0.3);
        doc.circle(sx, sy, schijfD / 2, 'FD');
        if (i < aantalVoor) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(5);
          doc.setTextColor(...tekstKleur);
          doc.text(tekst, sx, sy + 1, { align: 'center' });
        }
      }
    }

    // H kolom: blauw
    if (metH) {
      tekenRij(rij1Y, 0, 5, ox + marge, hKlein, [100, 160, 210], '100', [10, 50, 100]);
      tekenRij(rij2Y, 5, 10, ox + marge, hKlein, [100, 160, 210], '100', [10, 50, 100]);
    }
    // T kolom: groen
    tekenRij(rij1Y, 0, 5, tKolX, tKlein, [80, 190, 130], '10', [10, 80, 40]);
    tekenRij(rij2Y, 5, 10, tKolX, tKlein, [80, 190, 130], '10', [10, 80, 40]);
    // E kolom: geel
    tekenRij(rij1Y, 0, 5, eKolX, eKlein, [245, 210, 100], '1', [100, 75, 0]);
    tekenRij(rij2Y, 5, 10, eKolX, eKlein, [245, 210, 100], '1', [100, 75, 0]);
  }


  /* ── Compenseren blok ───────────────────────────────────────── */
  function _tekenCompenserenBlok(blok) {
    const variant     = blok.compenserenVariant || 'met-tekens';
    const metVoorbeeld = blok.metVoorbeeld !== false;

    // Afmetingen kader: 2 per rij
    const COMP_KAD_H  = 38;   // hoog genoeg voor som + pijl + blokje
    const COMP_RIJ_H  = COMP_KAD_H + 6;
    const kolB        = CW / 2;
    const kadW        = kolB - 6;
    const marge       = 3;

    const aantalRijen = Math.ceil(blok.oefeningen.length / 2);
    checkRuimte(ZINRUIMTE + COMP_RIJ_H);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(26, 58, 92);
    doc.text(blok.opdrachtzin, ML, y);
    y += ZINRUIMTE;

    for (let rij = 0; rij < aantalRijen; rij++) {
      if (rij > 0) checkRuimte(COMP_RIJ_H);
      const rijOef = blok.oefeningen.slice(rij * 2, (rij + 1) * 2);

      rijOef.forEach((oef, kol) => {
        const isVoorbeeld = metVoorbeeld && (rij === 0) && (kol === 0);
        const oy = y;
        const ox = ML + kol * kolB + 3;

        // Kader
        doc.setFillColor(isVoorbeeld ? 255 : 255, isVoorbeeld ? 243 : 255, isVoorbeeld ? 205 : 255);
        doc.setDrawColor(180, 200, 225);
        doc.setLineWidth(0.6);
        doc.roundedRect(ox, oy, kadW, COMP_KAD_H, 2, 2, 'FD');

        const zelfKringen = (variant === 'zelf-kringen') && !isVoorbeeld;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(44, 62, 80);

        // Bereken positie kring (compenseerGetal)
        const compGetal   = oef.compenseerGetal;
        const andereGetal = oef.andereGetal;
        const compIsLinks = oef.vraag.replace(' =','').trim().startsWith(String(compGetal));

        const somX    = ox + marge;
        const somY    = oy + 8;

        const isAftrekken = oef.vraag.includes(' - ');
        const teken = isAftrekken ? '  -  ' : '  +  ';

        const prefix  = compIsLinks ? '' : `${andereGetal}${teken}`;
        const suffix  = compIsLinks ? `${teken}${andereGetal}  =` : `  =`;
        const kringTxt = String(compGetal);

        const prefixB = doc.getTextWidth(prefix);
        const kringB  = doc.getTextWidth(kringTxt);

        // Prefix
        if (prefix) doc.text(prefix, somX, somY);

        // Kring: cirkel of gewone tekst afhankelijk van variant
        const kringPad  = zelfKringen ? 0 : 1.5;
        const kringTxtX = somX + prefixB + kringPad;
        const kringMidX = somX + prefixB + kringPad + kringB / 2;
        const kringMidY = somY - 1.5;
        const kringRx   = Math.max(kringB / 2 + kringPad + 1.5, 6);  // horizontale straal
        const kringRy   = Math.max(kringRx * 0.55, 3.5);              // ovaal: platter

        if (!zelfKringen) {
          doc.setDrawColor(44, 62, 80);
          doc.setLineWidth(0.6);
          doc.ellipse(kringMidX, kringMidY, kringRx, kringRy, 'S');
        }
        doc.text(kringTxt, kringTxtX, somY);

        // Suffix
        const suffixX = somX + prefixB + kringPad + kringB + kringPad;
        doc.text(suffix, suffixX, somY);

        // Antwoordvak
        const somTotaalB = prefixB + kringPad + kringB + kringPad + doc.getTextWidth(suffix);
        const avX = somX + somTotaalB + 2;
        const avW = 10, avH = 9;
        const avY = oy + 2;
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(26, 58, 92);
        doc.setLineWidth(0.5);
        doc.roundedRect(avX, avY, avW, avH, 1.5, 1.5, 'FD');

        // Pijl: alleen tekenen als niet zelf-kringen
        const pijlTopY = kringMidY + kringRy;  // onderkant ovaal
        const pijlBotY = pijlTopY + 4;
        if (!zelfKringen) {
          doc.setDrawColor(44, 62, 80);
          doc.setLineWidth(0.5);
          doc.line(kringMidX, pijlTopY, kringMidX, pijlBotY);
          doc.setFillColor(44, 62, 80);
          const ph = 1.2;
          doc.triangle(kringMidX, pijlBotY, kringMidX - ph, pijlBotY - ph * 2, kringMidX + ph, pijlBotY - ph * 2, 'F');
        }

        // Compenseervak: [ + ] [ hokje ] [ - ] [ hokje ]
        // Bij zelf-kringen: geen pijl getekend, blokY start iets hoger
        const blokY  = (zelfKringen ? pijlTopY : pijlBotY) + 2;
        const hokH   = 8;
        const tekenW = 5;    // breedte van + of - teken
        const getalW = 11;   // breedte invulhokje getal
        const padW   = 2;    // padding links/rechts in blokje
        const gapW   = 3;    // ruimte tussen de twee teken+hokje paren
        const blokTotW = padW + tekenW + 1 + getalW + gapW + tekenW + 1 + getalW + padW;
        const hokX   = ox + marge;

        // Achtergrond blokje
        doc.setFillColor(234, 244, 251);
        doc.setDrawColor(26, 58, 92);
        doc.setLineWidth(0.5);
        doc.roundedRect(hokX, blokY, blokTotW, hokH + 2, 2, 2, 'FD');

        doc.setFontSize(9);
        doc.setTextColor(26, 58, 92);

        // X-posities van de 4 elementen
        const teken1X = hokX + padW;                          // '+' teken
        const hokje1X = teken1X + tekenW + 1;                 // 1e invulhokje
        const teken2X = hokje1X + getalW + gapW;              // '-' teken
        const hokje2X = teken2X + tekenW + 1;                 // 2e invulhokje

        // Teken1 en teken2 afhankelijk van bewerking
        const teken1 = isAftrekken ? '-' : '+';
        const teken2 = isAftrekken ? '+' : '-';

        if (isVoorbeeld) {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(hokje1X, blokY + 1, getalW, hokH, 1, 1, 'FD');
          doc.roundedRect(hokje2X, blokY + 1, getalW, hokH, 1, 1, 'FD');
          doc.setTextColor(26, 58, 92);
          doc.text(teken1, teken1X, blokY + 6);
          doc.text(String(oef.tiental), hokje1X + 1, blokY + 6);
          doc.text(teken2, teken2X, blokY + 6);
          doc.text(String(oef.compenseerDelta), hokje2X + 1, blokY + 6);
          doc.setTextColor(44, 62, 80);
        } else if (variant === 'met-tekens') {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(hokje1X, blokY + 1, getalW, hokH, 1, 1, 'FD');
          doc.roundedRect(hokje2X, blokY + 1, getalW, hokH, 1, 1, 'FD');
          doc.setTextColor(26, 58, 92);
          doc.text(teken1, teken1X, blokY + 6);
          doc.text(teken2, teken2X, blokY + 6);
        } else {
          // Alles zelf: 2 lege hokjes breed genoeg voor teken+getal
          const breedHokW = tekenW + 1 + getalW;
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(teken1X, blokY + 1, breedHokW, hokH, 1, 1, 'FD');
          doc.roundedRect(teken2X, blokY + 1, breedHokW, hokH, 1, 1, 'FD');
        }

        // Schrijflijnen rechts van het compenseervak
        const lijnStartX = hokX + blokTotW + 3;
        const lijnEindX  = ox + kadW - marge - 3;
        if (lijnEindX > lijnStartX + 5) {
          doc.setDrawColor(160, 185, 210);
          doc.setLineWidth(0.4);
          const lY1 = blokY + 3;
          const lY2 = blokY + hokH + 4;
          doc.line(lijnStartX, lY1, lijnEindX, lY1);
          doc.line(lijnStartX, lY2, lijnEindX, lY2);
          // Bij voorbeeld: tussenstappen schrijven op de lijnen
          if (isVoorbeeld) {
            doc.setFontSize(10);
            doc.setTextColor(80, 80, 80);
            doc.text(oef.schrijflijn1, lijnStartX, lY1 - 1);
            doc.text(oef.schrijflijn2, lijnStartX, lY2 - 1);
          }
        }
      });

      y += COMP_RIJ_H;
    }
    y += NABLOK;
    lijn(ML, y - 4, ML + CW, y - 4, [210, 220, 230], 0.4);
  }

  function _tekenBlok(blok) {
    if (blok.bewerking === 'herken-brug') { _tekenHerkenBlok(blok); return; }
    if (blok.hulpmiddelen?.includes('aanvullen')) { _tekenAanvullenBlok(blok); return; }
    if (blok.hulpmiddelen?.includes('compenseren')) { _tekenCompenserenBlok(blok); return; }

    const isTot1000    = blok.niveau >= 1000;
    const _kolommen    = isTot1000 ? 3 : KOLOMMEN;
    const _rijGr       = (blok.hulpmiddelen?.includes('splitsbeen') || blok.hulpmiddelen?.includes('schrijflijnen')) ? 2 : _kolommen;
    const aantalRijen  = Math.ceil(blok.oefeningen.length / _rijGr);
    checkRuimte(MIN_RUIMTE);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(26, 58, 92);
    doc.text(blok.opdrachtzin, ML, y);
    y += ZINRUIMTE;

    const heeftSplits  = blok.hulpmiddelen?.includes('splitsbeen');
    const heeftLijnen  = blok.hulpmiddelen?.includes('schrijflijnen');
    const schrijflijnenAantal = blok.schrijflijnenAantal || 2;
    const heeftHulp    = heeftSplits || heeftLijnen;
    const rijGrootte   = heeftHulp ? 2 : _kolommen;
    const rijH         = heeftHulp ? (_hulpKadH(schrijflijnenAantal) + 6) : (RIJHOOGTE + RIJ_GAP);

    for (let rij = 0; rij < aantalRijen; rij++) {
      if (rij > 0) checkRuimte(rijH);
      const rijOef = blok.oefeningen.slice(rij * rijGrootte, (rij + 1) * rijGrootte);
      if (heeftHulp) {
        _tekenHulpRij(rijOef, heeftSplits, heeftLijnen, blok.bewerking, blok.splitspositie || 'aftrekker', blok.schrijflijnenAantal || 2);
      } else {
        _tekenRij(rijOef, _kolommen);
      }
    }
    y += NABLOK;
    lijn(ML, y - 4, ML + CW, y - 4, [210,220,230], 0.4);
  }

  function _tekenAanvullenBlok(blok) {
    const variant     = blok.aanvullenVariant || 'zonder-schema';
    const aantalKol   = variant === 'met-schijfjes' ? AANV_KOLOMMEN_SCHIJF : AANV_KOLOMMEN;
    const kadH        = _aanvulKadH(variant);
    const rijH        = kadH + 5;
    const aantalRijen = Math.ceil(blok.oefeningen.length / aantalKol);
    checkRuimte(ZINRUIMTE + rijH);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(26, 58, 92);
    doc.text(blok.opdrachtzin, ML, y);
    y += ZINRUIMTE;

    for (let rij = 0; rij < aantalRijen; rij++) {
      if (rij > 0) checkRuimte(rijH);
      const rijOef = blok.oefeningen.slice(rij * aantalKol, (rij + 1) * aantalKol);
      _tekenAanvullenRij(rijOef, variant);
    }
    y += NABLOK;
    lijn(ML, y - 4, ML + CW, y - 4, [210,220,230], 0.4);
  }

  /* ── Lampje base64 ophalen ───────────────────────────────── */
  function _getLamp() {
    if (_lampBase64Cache) return _lampBase64Cache;
    const img = document.querySelector('.zisa-lamp');
    if (!img || !img.complete || img.naturalWidth === 0) return null;
    try {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      _lampBase64Cache = c.toDataURL('image/png');
      return _lampBase64Cache;
    } catch(e) { return null; }
  }

  /* ── Herken-brug blok ────────────────────────────────────── */
  function _tekenHerkenBlok(blok) {
    const aantalRijen = Math.ceil(blok.oefeningen.length / KOLOMMEN);
    const lamp = _getLamp();
    checkRuimte(HRK_MIN);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(26, 58, 92);
    doc.text(blok.opdrachtzin, ML, y);
    y += ZINRUIMTE;

    for (let rij = 0; rij < aantalRijen; rij++) {
      if (rij > 0) checkRuimte(HRK_RIJ_H);
      _tekenHerkenRij(blok.oefeningen.slice(rij * KOLOMMEN, (rij + 1) * KOLOMMEN), lamp);
    }
    y += NABLOK;
    lijn(ML, y - 4, ML + CW, y - 4, [210,220,230], 0.4);
  }

  function _tekenHerkenRij(oefeningen, lamp) {
    const kolB = CW / KOLOMMEN;
    const kadW = kolB - 6;   // iets smaller voor meer lucht
    const marge = 2.5;

    oefeningen.forEach((oef, kol) => {
      const ox = ML + kol * kolB + 3;
      const oy = y;

      // ── Buitenkader (één geheel per oefening) ────────────
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(26, 58, 92);
      doc.setLineWidth(0.7);
      doc.roundedRect(ox, oy, kadW, HRK_KAD_H, 3, 3, 'FD');

      // ── Zisa afbeelding (bovenzone, correcte verhouding) ──
      const imgZoneW = kadW - marge * 2;
      const imgZoneH = HRK_IMG_H;
      if (lamp) {
        const imgEl = document.querySelector('.zisa-lamp');
        const ratio = imgEl ? imgEl.naturalWidth / imgEl.naturalHeight : 0.85;
        let dW = imgZoneH * ratio;
        let dH = imgZoneH;
        if (dW > imgZoneW) { dW = imgZoneW; dH = dW / ratio; }
        const imgX = ox + marge + (imgZoneW - dW) / 2;
        const imgY = oy + marge + (imgZoneH - dH) / 2;
        doc.addImage(lamp, 'PNG', imgX, imgY, dW, dH);
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 160);
        doc.text('ZISA', ox + kadW / 2, oy + marge + HRK_IMG_H / 2 + 1, { align: 'center' });
      }

      // ── Scheidingslijn ────────────────────────────────────
      const schY = oy + marge + HRK_IMG_H + 1.5;
      lijn(ox + marge, schY, ox + kadW - marge, schY, [200, 215, 230], 0.4);

      // ── Somtekst ──────────────────────────────────────────
      const somY = schY + 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(44, 62, 80);
      doc.text(oef.vraag, ox + marge + 1, somY);

      // ── Invulvakje (rechts van som) ───────────────────────
      const vakW = 14, vakH = 8;
      const vakX = ox + kadW - vakW - marge;
      const vakY = somY - 6;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(26, 58, 92);
      doc.setLineWidth(0.5);
      doc.roundedRect(vakX, vakY, vakW, vakH, 1.5, 1.5, 'FD');
    });

    y += HRK_RIJ_H;
  }

  /* ── Publieke API ────────────────────────────────────────── */
  function genereer(bundelData, titel) {
    const { jsPDF } = window.jspdf;
    doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    _lampBase64Cache = null; // reset cache bij nieuwe PDF
    y = MT;

    _tekenKoptekst(titel || 'Rekenbundel');
    bundelData.forEach(blok => _tekenBlok(blok));

    doc.save(`${(titel || 'rekenbundel').replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }

  return { genereer };
})();

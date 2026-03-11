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
  const MIN_RUIMTE = ZINRUIMTE + RIJHOOGTE + RIJ_GAP + 4;

  // Herken-brug: één groot kader per oefening
  // bovenzijde = Zisa, onderzijde = som + invulvakje
  const HRK_IMG_H  = 20;   // hoogte Zisa-zone in kader (mm)
  const HRK_SOM_H  = 12;   // hoogte som-zone in kader (mm)
  const HRK_KAD_H  = HRK_IMG_H + HRK_SOM_H + 4; // totale kaderhoogte
  const HRK_RIJ_H  = HRK_KAD_H + 8;  // rij hoogte incl. ruimte eronder
 const HRK_MIN    = ZINRUIMTE + HRK_RIJ_H + 4;

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
    checkRuimte(ZINRUIMTE + COMP_RIJ_H + 4);

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

        const somX    = ox + marge + 1;
        const somY    = oy + 8;

const isAftrekken = oef.vraag.includes(' - ');
const teken = isAftrekken ? ' - ' : ' + ';

const prefix   = compIsLinks ? '' : `${andereGetal}${teken}`;
const suffix   = compIsLinks ? `${teken}${andereGetal} =` : ` =`;
const kringTxt = String(compGetal);

const prefixB = doc.getTextWidth(prefix);
const kringB  = doc.getTextWidth(kringTxt);

// Prefix eerst tekenen
if (prefix) doc.text(prefix, somX, somY);

// Alleen het getal in de kring
const kringPadL = zelfKringen ? 0 : 0.8;
const kringPadR = zelfKringen ? 0 : 0.8;
const kringBinnenW = kringB + kringPadL + kringPadR;

// Smallere ovaal, enkel rond het getal
const kringRx = zelfKringen ? 0 : Math.max(kringBinnenW / 2, 4.6);
const kringRy = zelfKringen ? 0 : 3.2;

// Middelpunt en tekstpositie van alleen het kringgetal
const kringMidX = somX + prefixB + kringRx;
const kringMidY = somY - 1.5;
const kringTxtX = kringMidX - (kringB / 2);

// Kring tekenen
if (!zelfKringen) {
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.35);
  doc.ellipse(kringMidX, kringMidY, kringRx, kringRy, 'S');
}

// Getal in de kring
doc.text(kringTxt, kringTxtX, somY);

// Suffix pas NA de volledige ovaal
const suffixGap = zelfKringen ? 0 : (compIsLinks ? 0.8 : 2.2);
const suffixX = somX + prefixB + (kringRx * 2) + suffixGap;
doc.text(suffix, suffixX, somY);

// Antwoordvak nog iets verder
const somTotaalB = prefixB + (kringRx * 2) + suffixGap + doc.getTextWidth(suffix);
const avX = somX + somTotaalB + 4.5;
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
    if (blok.bewerking === 'herken-brug')     { _tekenHerkenBlok(blok); return; }
    if (blok.bewerking === 'splitsingen')     { _tekenSplitsingenBlok(blok); return; }
    if (blok.bewerking === 'tafels')          { _tekenTafelsBlok(blok); return; }
    if (blok.bewerking === 'tafels-inzicht')  { _tekenInzichtBlok(blok); return; }
    if (blok.bewerking === 'tafels-getallenlijn') { _tekenGetallenlijnBlok(blok); return; }
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
   checkRuimte(ZINRUIMTE + rijH + 4);

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

  /* ══════════════════════════════════════════════════════════
     SPLITSINGEN PDF — Klein splitshuis
     4 huisjes per rij, elk ~42mm breed
  ══════════════════════════════════════════════════════════ */

  const SPL_PER_RIJ  = 4;
  const SPL_ZINR     = 9;
  const SPL_NABLOK   = 10;
  const SH_BREEDTE   = 26;
  const SH_DAK_H     = 14;
  const SH_MUUR_H    = 14;
  const SH_TOT_H     = SH_DAK_H + SH_MUUR_H;
  const SH_RIJ_H     = SH_TOT_H + 20;
  const GS_BREEDTE   = 34;   // groot splitshuis iets breder
  const GS_RIJ_H     = 10;   // hoogte per verdiep in groot huis

  function _tekenSplitsOefening(oef, ox, oy) {
    if (oef.type === 'klein-splitshuis')       _tekenKleinSplitshuis(oef, ox, oy);
    if (oef.type === 'splitsbeen')             _tekenSplitsbeen(oef, ox, oy);
    if (oef.type === 'groot-splitshuis')       _tekenGrootSplitshuis(oef, ox, oy);
    if (oef.type === 'splitsbeen-bewerkingen') _tekenSplitsbeenBewerkingen(oef, ox, oy);
    if (oef.type === 'puntoefening')           _tekenPuntoefening(oef, ox, oy);
  }

  // Hoogte van één groot splitshuis (mm)
  function _grootHuisHoogte(oef) {
    const aantalRijen = oef.rijen?.length || 1;
    return SH_DAK_H + aantalRijen * GS_RIJ_H + 2;
  }

  // Constanten voor splitsbeen-bewerkingen
  const SBW_PER_RIJ  = 3;
  const SBW_BREEDTE  = 52;
  const SBW_BEEN_H   = 36;
  const SBW_BEW_H    = 10;
  const SBW_TOT_H    = SBW_BEEN_H + 4 * SBW_BEW_H + 16;
  const PUNT_PER_RIJ = 3;
  const PUNT_KADER_H = 20;
  const PUNT_RIJ_H   = PUNT_KADER_H + 7;

  function _tekenSplitsingenBlok(blok) {
    const type0         = blok.oefeningen[0]?.type;
    const isBewerkingen = type0 === 'splitsbeen-bewerkingen';
    const isPunt        = type0 === 'puntoefening';
    const perRij        = isBewerkingen ? SBW_PER_RIJ : isPunt ? PUNT_PER_RIJ : SPL_PER_RIJ;
    const aantalRijen   = Math.ceil(blok.oefeningen.length / perRij);
    const kolBreedte    = CW / perRij;
    const rijH          = isBewerkingen ? SBW_TOT_H + 8 : isPunt ? PUNT_RIJ_H : SH_RIJ_H;

    checkRuimte(SPL_ZINR + rijH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(26, 58, 92);
    doc.text(blok.opdrachtzin, ML, y);
    y += SPL_ZINR;

    for (let rij = 0; rij < aantalRijen; rij++) {
      let maxH = rijH;
      for (let kol = 0; kol < perRij; kol++) {
        const oef = blok.oefeningen[rij * perRij + kol];
        if (oef?.type === 'groot-splitshuis') {
          maxH = Math.max(maxH, _grootHuisHoogte(oef) + 12);
        }
      }
      if (rij > 0) checkRuimte(maxH);
      for (let kol = 0; kol < perRij; kol++) {
        const oef = blok.oefeningen[rij * perRij + kol];
        if (!oef) continue;
        const isGroot = oef.type === 'groot-splitshuis';
        const isBew   = oef.type === 'splitsbeen-bewerkingen';
        // Puntoefening: vul volledige kolombreedte - kleine marge
        const ox = isPunt
          ? ML + kol * kolBreedte
          : ML + kol * kolBreedte + (kolBreedte - (isGroot ? GS_BREEDTE : isBew ? SBW_BREEDTE : SH_BREEDTE)) / 2;
        _tekenSplitsOefening(oef, ox, y);
      }
      y += maxH;
    }

    y += SPL_NABLOK;
    lijn(ML, y - 4, ML + CW, y - 4, [210,220,230], 0.4);
  }

  /* ── Klein splitshuis tekenen ────────────────────────────────
     ox, oy = linksboven van het huisje
     Dak = driehoek via 3 lijnen
     Muur = rechthoek met verticale scheidingswand midden
  ─────────────────────────────────────────────────────────── */
  function _tekenKleinSplitshuis(oef, ox, oy) {
    const B  = SH_BREEDTE;
    const midX = ox + B / 2;

    const BLAUW  = [74, 144, 217];
    const LIJN   = 0.6;   // dunne buitenrand dak + muur
    const SCHW   = 0.4;   // scheidingswand nog dunner
    const VAKL   = 0.4;   // invulvakje in dak

    // ── DAK: lijnwerk, witte vulling ──────────────────────────
    const dakTop   = oy;
    const dakBodem = oy + SH_DAK_H;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...BLAUW);
    doc.setLineWidth(LIJN);
    doc.triangle(midX, dakTop, ox, dakBodem, ox + B, dakBodem, 'FD');

    // Inhoud dak: getal of leeg (driehoek zelf is het invulvak)
    const dakMidY = dakTop + SH_DAK_H * 0.64;
    if (oef.totaal !== null) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(26, 58, 92);
      doc.text(String(oef.totaal), midX, dakMidY + 2, { align: 'center' });
    }
    // leeg → niets tekenen

    // ── MUUR: witte rechthoek met blauwe rand ─────────────────
    const muurY = dakBodem;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...BLAUW);
    doc.setLineWidth(LIJN);
    doc.roundedRect(ox, muurY, B, SH_MUUR_H, 1, 1, 'FD');

    // Scheidingswand midden
    doc.setDrawColor(...BLAUW);
    doc.setLineWidth(SCHW);
    doc.line(midX, muurY + 1, midX, muurY + SH_MUUR_H - 1);

    // Kamers: getal of leeg (lege kamer = de kamer zelf is het hokje, geen extra rect)
    const kamMidY    = muurY + SH_MUUR_H / 2 + 1.5;
    const kamLinksX  = ox + B / 4;
    const kamRechtsX = ox + 3 * B / 4;

    if (oef.links !== null) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(26, 58, 92);
      doc.text(String(oef.links), kamLinksX, kamMidY, { align: 'center' });
    }
    // leeg → niets tekenen, de kamer is zelf het invulvak

    if (oef.rechts !== null) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(26, 58, 92);
      doc.text(String(oef.rechts), kamRechtsX, kamMidY, { align: 'center' });
    }
    // leeg → niets tekenen
  }

  /* ── Splitsbeen tekenen ──────────────────────────────────────
     Omgekeerde V:  totaal bovenaan, twee benen naar links/rechts vakje
     ox, oy = linksboven van de beschikbare cel
  ─────────────────────────────────────────────────────────── */
  function _tekenSplitsbeen(oef, ox, oy) {
    const BLAUW   = [74, 144, 217];
    const vakW    = 12, vakH = 9;
    const midX    = ox + SH_BREEDTE / 2;
    const spreiding = 9;   // mm van midden naar links/rechts vakjemidden
    const linksX  = midX - spreiding;
    const rechtsX = midX + spreiding;

    const topY   = oy + 1;
    const beenY1 = topY + vakH + 1;
    const beenY2 = beenY1 + 10;
    const vakY   = beenY2 + 1;

    function hokje(cx, cy, waarde) {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(26, 58, 92);
      doc.setLineWidth(0.5);
      doc.roundedRect(cx - vakW / 2, cy, vakW, vakH, 1.5, 1.5, 'FD');
      if (waarde !== null) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(26, 58, 92);
        // Verticaal centreren: baseline = cy + vakH/2 + ~1/3 van capheight (≈ fontSize*0.35/2.83)
        doc.text(String(waarde), cx, cy + vakH / 2 + 2.3, { align: 'center' });
      }
    }

    hokje(midX, topY, oef.totaal);
    doc.setDrawColor(...BLAUW);
    doc.setLineWidth(0.6);
    doc.line(midX, beenY1, linksX,  beenY2);
    doc.line(midX, beenY1, rechtsX, beenY2);
    hokje(linksX,  vakY, oef.links);
    hokje(rechtsX, vakY, oef.rechts);
  }

  /* ── Groot splitshuis ────────────────────────────────────────
     Één huis, dak = totaal, alle splitsingen als verdiepen.
     Afwisselend links/rechts leeg. Dak altijd ingevuld.
  ─────────────────────────────────────────────────────────── */
  function _tekenGrootSplitshuis(oef, ox, oy) {
    const B      = GS_BREEDTE;
    const midX   = ox + B / 2;
    const BLAUW  = [74, 144, 217];
    const rijen  = oef.rijen || [];
    const muurH  = rijen.length * GS_RIJ_H;

    // ── Dak ───────────────────────────────────────────────────
    const dakTop   = oy;
    const dakBodem = oy + SH_DAK_H;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...BLAUW);
    doc.setLineWidth(0.6);
    doc.triangle(midX, dakTop, ox, dakBodem, ox + B, dakBodem, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(26, 58, 92);
    doc.text(String(oef.totaal), midX, dakTop + SH_DAK_H * 0.64 + 2, { align: 'center' });

    // ── Muur ──────────────────────────────────────────────────
    const muurY = dakBodem;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...BLAUW);
    doc.setLineWidth(0.6);
    doc.roundedRect(ox, muurY, B, muurH, 1, 1, 'FD');

    // Scheidingswand midden
    doc.setLineWidth(0.4);
    doc.line(midX, muurY, midX, muurY + muurH);

    // Verdiepen: horizontale lijnen + getallen of lege kamers
    const kamLinksX  = ox + B / 4;
    const kamRechtsX = ox + 3 * B / 4;
    const vW = B / 2 - 2, vH = GS_RIJ_H - 2;

    rijen.forEach((rij, i) => {
      const rijY    = muurY + i * GS_RIJ_H;
      const rijMidY = rijY + GS_RIJ_H / 2 + 2;

      // Horizontale scheidingslijn tussen verdiepen (niet na laatste)
      if (i > 0) {
        doc.setDrawColor(...BLAUW);
        doc.setLineWidth(0.3);
        doc.line(ox + 0.5, rijY, ox + B - 0.5, rijY);
      }

      // Links
      if (rij.links !== null) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(26, 58, 92);
        doc.text(String(rij.links), kamLinksX, rijMidY, { align: 'center' });
      }
      // Rechts
      if (rij.rechts !== null) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(26, 58, 92);
        doc.text(String(rij.rechts), kamRechtsX, rijMidY, { align: 'center' });
      }
    });
  }

  /* ── Splitsbeen + 4 bewerkingen ─────────────────────────────
     Kader met splitsbeen bovenaan + 4 lege bewerkingen eronder.
     Kind schrijft zelf: ___ + ___ = ___ (4x)
  ─────────────────────────────────────────────────────────── */
  function _tekenSplitsbeenBewerkingen(oef, ox, oy) {
    const B      = SBW_BREEDTE;
    const BLAUW  = [74, 144, 217];
    const DONKER = [26, 58, 92];
    const PAD    = 4;   // padding binnen kader

    // ── Kader ─────────────────────────────────────────────────
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...BLAUW);
    doc.setLineWidth(0.7);
    doc.roundedRect(ox, oy, B, SBW_TOT_H, 2, 2, 'FD');

    // ── Splitsbeen ────────────────────────────────────────────
    const vakW   = 12, vakH = 9;
    const midX   = ox + B / 2;
    const spreiding = 11;
    const linksX  = midX - spreiding;
    const rechtsX = midX + spreiding;

    const topY   = oy + PAD + 1;
    const beenY1 = topY + vakH + 1;
    const beenY2 = beenY1 + 9;
    const vakY   = beenY2 + 1;

    function hokje(cx, cy, waarde) {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...DONKER);
      doc.setLineWidth(0.5);
      doc.roundedRect(cx - vakW / 2, cy, vakW, vakH, 1.5, 1.5, 'FD');
      if (waarde !== null) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...DONKER);
        doc.text(String(waarde), cx, cy + vakH / 2 + 2.3, { align: 'center' });
      }
    }

    hokje(midX, topY, oef.totaal);
    doc.setDrawColor(...BLAUW);
    doc.setLineWidth(0.6);
    doc.line(midX, beenY1, linksX, beenY2);
    doc.line(midX, beenY1, rechtsX, beenY2);
    hokje(linksX,  vakY, oef.links);
    hokje(rechtsX, vakY, oef.rechts);

    // ── Scheidingslijn tussen been en bewerkingen ─────────────
    const scheidY = oy + SBW_BEEN_H + 2;
    doc.setDrawColor(200, 220, 240);
    doc.setLineWidth(0.4);
    doc.line(ox + 3, scheidY, ox + B - 3, scheidY);

    const bewStartY = scheidY + 5;
    const vakB      = 10;
    const ops       = ['+', '+', '-', '-'];
    const rijB   = 3 * vakB + 11;
    const startX = ox + (B - rijB) / 2;

    for (let i = 0; i < 4; i++) {
      const baseY = bewStartY + i * (SBW_BEW_H + 3) + SBW_BEW_H - 3;
      let x = startX;

      doc.setDrawColor(...DONKER);
      doc.setLineWidth(0.5);
      doc.line(x, baseY, x + vakB, baseY);
      x += vakB + 1;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...DONKER);
      doc.text(ops[i], x + 2, baseY, { align: 'center' });
      x += 5;

      doc.setDrawColor(...DONKER);
      doc.setLineWidth(0.5);
      doc.line(x, baseY, x + vakB, baseY);
      x += vakB + 1;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...DONKER);
      doc.text('=', x + 2, baseY, { align: 'center' });
      x += 5;

      doc.setDrawColor(...DONKER);
      doc.setLineWidth(0.5);
      doc.line(x, baseY, x + vakB, baseY);
    }
  }

  /* ── Puntoefening ────────────────────────────────────────────
     Kader per oefening, invulhokje voor null, 3 per rij.
     tekst = [getal|null, '+'/'-', getal|null, '=', getal|null]
  ─────────────────────────────────────────────────────────── */
  function _tekenPuntoefening(oef, ox, oy) {
    const DONKER  = [26, 58, 92];
    const GAP     = 2;    // marge tussen kaders (2mm aan elke kant = 4mm tussenruimte)
    const MARGE   = 5;   // min. marge links/rechts binnen kader
    const B       = CW / PUNT_PER_RIJ - GAP * 2;
    const H       = PUNT_KADER_H;
    const kx      = ox + GAP;
    const ky      = oy;

    // Kader
    doc.setDrawColor(...DONKER);
    doc.setLineWidth(0.5);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(kx, ky, B, H, 2, 2, 'FD');

    // Afmetingen elementen
    const midY   = ky + H / 2;
    const hokjeH = 9;
    const hokjeB = 12;
    const opW    = 5;
    const getalW = 8;
    // tekstbaseline: operator-tekst verticaal centreren naast hokje
    const tekstY = midY + hokjeH / 2 - 1;

    const totW = (oef.tekst || []).reduce((acc, d) => {
      if (d === null)            return acc + hokjeB + 3;
      if (typeof d === 'string') return acc + opW + 3;
      return acc + getalW + 3;
    }, 0);

    // Centreren, maar minimum MARGE vanaf kaderbegrenzing
    let x = kx + Math.max(MARGE, (B - totW) / 2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...DONKER);

    (oef.tekst || []).forEach(d => {
      if (d === null) {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(...DONKER);
        doc.setLineWidth(0.5);
        doc.roundedRect(x, midY - hokjeH / 2, hokjeB, hokjeH, 1, 1, 'FD');
        x += hokjeB + 3;
      } else if (typeof d === 'string') {
        doc.text(d, x + opW / 2, tekstY, { align: 'center' });
        x += opW + 3;
      } else {
        const str = String(d);
        doc.text(str, x + getalW / 2, tekstY, { align: 'center' });
        x += getalW + 3;
      }
    });
  }

  /* ── Getallenlijn blok ───────────────────────────────────── */
  function _tekenGetallenlijnBlok(blok) {
    const ZINR    = ZINRUIMTE;
    const OEF_GAP = 6;

    // Bereken hoogte van één oefening
    function oefHoogte(oef) {
      // getallenlijn: bogen (14mm) + lijn (6mm) + formules
      const boogH    = oef.variant === 'getekend' ? 14 : 0;
      const lijnH    = 7;
      const formsH   = oef.variant === 'getekend' ? 22 : 12; // 2 rijen vs 1 rij
      return boogH + lijnH + formsH + 10; // + padding
    }

    checkRuimte(ZINR + oefHoogte(blok.oefeningen[0]) + OEF_GAP);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(26, 58, 92);
    doc.text(blok.opdrachtzin, ML, y + 5);
    y += ZINR;

    blok.oefeningen.forEach((oef, oefIdx) => {
      const oh = oefHoogte(oef);
      if (oefIdx > 0) checkRuimte(oh + OEF_GAP);
      _tekenGetallenlijnOef(oef, oh);
      y += oh + OEF_GAP;
    });

    y += NABLOK;
    lijn(ML, y - 4, ML + CW, y - 4, [210, 220, 230], 0.4);
  }

  function _tekenGetallenlijnOef(oef, oh) {
    const { groepen, stap, uitkomst, variant } = oef;
    const max    = uitkomst;
    const ox     = ML + 2;
    const oy     = y;
    const oefW   = CW - 4;

    // Kader
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.roundedRect(ox, oy, oefW, oh, 3, 3, 'FD');

    const PAD    = 5;
    const BLAUW  = [74, 144, 217];
    const ORANJE = [230, 74, 25];
    const DONKER = [26, 58, 92];

    // Getallenlijn posities
    const lijnY    = oy + PAD + (variant === 'getekend' ? 16 : 4);
    const lijnX1   = ox + PAD;
    const lijnX2   = ox + oefW - PAD - 6;  // -6 voor pijl
    const vakjeW   = Math.min(8, (lijnX2 - lijnX1) / (max + 1));
    const vakjeH   = 6;

    // Boogjes tekenen (alleen bij 'getekend')
    if (variant === 'getekend') {
      const boogTop = oy + PAD;
      const boogH   = 12;

      for (let g = 0; g < groepen; g++) {
        const xVan  = lijnX1 + g * stap * vakjeW;
        const xNaar = lijnX1 + (g + 1) * stap * vakjeW;
        const midX  = (xVan + xNaar) / 2;
        const boogBodem = boogTop + boogH;

        // Boog als kwartellips (via bezier-achtige benadering)
        doc.setDrawColor(...ORANJE);
        doc.setLineWidth(0.6);
        // Teken boog: curve van xVan naar xNaar
        doc.lines(
          [
            [(xNaar - xVan) * 0.3, -boogH * 0.9],
            [(xNaar - xVan) * 0.4, 0],
            [(xNaar - xVan) * 0.3, boogH * 0.9],
          ],
          xVan, boogBodem, [1, 1], 'S', false
        );

        // Getal erboven
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...ORANJE);
        doc.text(String(stap), midX, boogTop + 1, { align: 'center' });

        // Kleine streepjes aan begin en einde
        doc.setDrawColor(...ORANJE);
        doc.setLineWidth(0.4);
        doc.line(xVan,  boogBodem - 2, xVan,  boogBodem + 2);
        doc.line(xNaar, boogBodem - 2, xNaar, boogBodem + 2);
      }
    }

    // Vakjes tekenen (0 t/m max)
    doc.setDrawColor(...BLAUW);
    doc.setLineWidth(0.4);
    doc.setFillColor(255, 255, 255);
    for (let n = 0; n <= max; n++) {
      const vx = lijnX1 + n * vakjeW;
      doc.rect(vx, lijnY, vakjeW, vakjeH, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(Math.max(5, Math.min(7, vakjeW - 1)));
      doc.setTextColor(...DONKER);
      doc.text(String(n), vx + vakjeW / 2, lijnY + vakjeH - 1, { align: 'center' });
    }

    // Pijl rechts van getallenlijn
    const pijlX = lijnX1 + (max + 1) * vakjeW + 1;
    const pijlY = lijnY + vakjeH / 2;
    doc.setDrawColor(...BLAUW);
    doc.setLineWidth(0.5);
    doc.line(lijnX1 + (max + 1) * vakjeW, pijlY, pijlX + 3, pijlY);
    doc.setFillColor(...BLAUW);
    doc.triangle(pijlX + 4, pijlY, pijlX + 1, pijlY - 1.2, pijlX + 1, pijlY + 1.2, 'F');

    // Formules
    const formY  = lijnY + vakjeH + 5;
    const fxBase = ox + PAD;
    const LS     = 20;  // lijn-lengte
    const LB     = 25;  // uitkomst-lijn breed
    const LH     = 10;  // rij-hoogte
    const BL     = LH - 2;

    function lijnS(fx, fy) {
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.25);
      doc.line(fx, fy + BL, fx + LS, fy + BL);
    }
    function sym(fx, fy, t, kleur) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...kleur);
      doc.text(t, fx, fy + BL);
    }
    function lijnB(fx, fy) {
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.25);
      doc.line(fx, fy + BL, fx + LB, fy + BL);
    }

    if (variant === 'getekend') {
      // Rij 1: ___ + ___ + ... = ___
      let fx = fxBase;
      for (let g = 0; g < groepen; g++) {
        lijnS(fx, formY); fx += LS + 1;
        if (g < groepen - 1) { sym(fx, formY, '+', ORANJE); doc.setFontSize(10); fx += doc.getTextWidth('+') + 2; }
      }
      sym(fx, formY, '=', [50, 50, 50]); doc.setFontSize(10); fx += doc.getTextWidth('=') + 2;
      lijnB(fx, formY);

      // Rij 2: ___ × ___ = ___
      let fx2 = fxBase;
      lijnS(fx2, formY + LH); fx2 += LS + 1;
      sym(fx2, formY + LH, '×', ORANJE); doc.setFontSize(10); fx2 += doc.getTextWidth('×') + 2;
      lijnS(fx2, formY + LH); fx2 += LS + 1;
      sym(fx2, formY + LH, '=', [50, 50, 50]); doc.setFontSize(10); fx2 += doc.getTextWidth('=') + 2;
      lijnB(fx2, formY + LH);

    } else {
      // Variant 'zelf': enkel ___ × ___ = ___
      let fx = fxBase;
      lijnS(fx, formY); fx += LS + 1;
      sym(fx, formY, '×', ORANJE); doc.setFontSize(10); fx += doc.getTextWidth('×') + 2;
      lijnS(fx, formY); fx += LS + 1;
      sym(fx, formY, '=', [50, 50, 50]); doc.setFontSize(10); fx += doc.getTextWidth('=') + 2;
      lijnB(fx, formY);
    }
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

  /* ── Tafels blok tekenen ─────────────────────────────────── */
  function _tekenTafelsBlok(blok) {
    const KOLS     = 3;
    const RH       = 20;    // rij-hoogte per oefening
    const GAP      = 4;
    const ZINR     = ZINRUIMTE;
    const HOK_W    = 14;    // breedte invulhokje (mm)
    const HOK_H    = 11;    // hoogte invulhokje (mm) — iets groter
    const rijCount = Math.ceil(blok.oefeningen.length / KOLS);
    const nodig    = ZINR + rijCount * (RH + GAP);
    checkRuimte(nodig);

    // Opdrachtzin
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(26, 58, 92);
    doc.text(blok.opdrachtzin, ML, y + 5);
    y += ZINR;

    const colW = CW / KOLS;

    blok.oefeningen.forEach((oef, i) => {
      const col = i % KOLS;
      const row = Math.floor(i / KOLS);
      const x   = ML + col * colW;
      const ry  = y + row * (RH + GAP);

      // Buitenste kader (wit, lichte rand)
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.4);
      doc.roundedRect(x + 1, ry, colW - 2, RH, 2, 2, 'FD');

      // Som opbouwen als losse onderdelen zodat we het hokje exact kunnen plaatsen
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(26, 58, 92);

      // Bepaal de som-onderdelen: [tekst|hokje, tekst|hokje, ...]
      // Elke oefening heeft 1 invulhokje
      let delen = [];
      if (oef.type === 'vermenigvuldigen') {
        delen = [`${oef.a}`, ' × ', `${oef.b}`, ' = ', 'HOK'];
      } else if (oef.type === 'gedeeld') {
        delen = [`${oef.a}`, ' : ', `${oef.b}`, ' = ', 'HOK'];
      } else if (oef.type === 'ontbrekende-factor') {
        if (oef.positie === 'links') {
          delen = ['HOK', ' × ', `${oef.b}`, ' = ', `${oef.product}`];
        } else {
          delen = [`${oef.a}`, ' × ', 'HOK', ' = ', `${oef.product}`];
        }
      }

      // Meet totale breedte om te centreren
      let totaalB = 0;
      delen.forEach(d => {
        totaalB += d === 'HOK' ? HOK_W : doc.getTextWidth(d);
      });

      const cy   = ry + RH / 2;          // verticaal midden van kader
      const textY = cy + 2.5;            // basislijn tekst (iets onder midden)
      let curX = x + (colW - totaalB) / 2;

      delen.forEach(d => {
        if (d === 'HOK') {
          // Teken invulhokje: wit met donkere rand
          const hokY = cy - HOK_H / 2;
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(26, 58, 92);
          doc.setLineWidth(0.6);
          doc.roundedRect(curX, hokY, HOK_W, HOK_H, 2, 2, 'FD');
          curX += HOK_W;
        } else {
          doc.setTextColor(26, 58, 92);
          doc.text(d, curX, textY);
          curX += doc.getTextWidth(d);
        }
      });
    });

    y += rijCount * (RH + GAP) + NABLOK;
  }

  /* ── Tafels inzicht blok tekenen ────────────────────────── */
  /* ── Canvas-helper: emoji → PNG data-URL (gecached) ──────── */
  const _emojiCache = {};
  function _emojiPng(emoji, px = 32) {
    const key = emoji + px;
    if (_emojiCache[key]) return _emojiCache[key];
    const canvas = document.createElement('canvas');
    canvas.width  = px;
    canvas.height = px;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, px, px);
    ctx.font = `${Math.round(px * 0.75)}px serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, px / 2, px / 2);
    const url = canvas.toDataURL('image/png');
    _emojiCache[key] = url;
    return url;
  }

  function _tekenInzichtBlok(blok) {
    const MAX_GPER_RIJ = 3;    // max 3 groepjes naast elkaar → linkerkolom smaller → meer ruimte rechts
    const VAKJE_GAP    = 3;
    const OEF_PAD_V    = 6;
    const OEF_PAD_H    = 5;
    const OEF_GAP      = 8;
    const LINKS_FRAC   = 0.38; // 38% links zodat rechts meer ademruimte heeft
    const LIJN_DIKTE   = 0.25;
    const LIJN_BREED   = 12;
    const PLUS_GAP     = 3.2;
    const EQ_GAP       = 4.0;
    const RIJ_H        = 10;
    const FS           = 11;

    const oefW    = CW - 4;
    const linksW  = oefW * LINKS_FRAC;
    const rechtsW = oefW - linksW - 8;

    // Vaste lijnbreedte: altijd kort, ongeacht het aantal groepen
    function lijnBreedte(groepen) {
      return 7;
    }

    function emoKols(n) { return Math.min(5, Math.ceil(Math.sqrt(n))); }

    function vakjeAfm(groepGrootte, vakjeB) {
      const cols  = emoKols(groepGrootte);
      const rows  = Math.ceil(groepGrootte / cols);
      const emoMm = Math.min((vakjeB - 3) / cols, 5.5);
      return { cols, rows, emoMm, h: Math.max(10, 2.5 + rows * emoMm + (rows - 1) * 1 + 2.5) };
    }

    function _oefHoogte(oef) {
      const maxInRij = Math.min(oef.groepen, MAX_GPER_RIJ);
      const vakjeB   = Math.min(20, (linksW - OEF_PAD_H * 2 - (maxInRij - 1) * VAKJE_GAP) / maxInRij);
      const { h: vH } = vakjeAfm(oef.groepGrootte, vakjeB);
      const gRijen   = Math.ceil(oef.groepen / MAX_GPER_RIJ);
      const linksH   = gRijen * vH + (gRijen - 1) * VAKJE_GAP;
      const rechtsH  = RIJ_H * 3 + 10;
      return OEF_PAD_V * 2 + Math.max(linksH, rechtsH);
    }

    checkRuimte(ZINRUIMTE + _oefHoogte(blok.oefeningen[0]) + OEF_GAP);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(26, 58, 92);
    doc.text(blok.opdrachtzin, ML, y + 5);
    y += ZINRUIMTE;

    const rechtsX = ML + 2 + linksW + 6;

    blok.oefeningen.forEach((oef, oefIdx) => {
      const oh = _oefHoogte(oef);
      if (oefIdx > 0) checkRuimte(oh + OEF_GAP);

      const ox = ML + 2, oy = y;

      // Kader
      doc.setFillColor(255,255,255);
      doc.setDrawColor(200,200,200);
      doc.setLineWidth(0.3);
      doc.roundedRect(ox, oy, oefW, oh, 3, 3, 'FD');

      // Scheidingslijn
      doc.setDrawColor(225,225,225);
      doc.setLineWidth(0.2);
      doc.line(ox + linksW + 2, oy + OEF_PAD_V, ox + linksW + 2, oy + oh - OEF_PAD_V);

      // ── LINKS: groepjes ──────────────────────────────────
      const maxInRij = Math.min(oef.groepen, MAX_GPER_RIJ);
      const vakjeB   = Math.min(20, (linksW - OEF_PAD_H * 2 - (maxInRij - 1) * VAKJE_GAP) / maxInRij);
      const { cols: emoKolsN, rows: emoRijenN, emoMm, h: vH } = vakjeAfm(oef.groepGrootte, vakjeB);
      const gRijen       = Math.ceil(oef.groepen / MAX_GPER_RIJ);
      const emojiDataUrl = _emojiPng(oef.emoji, 120);
      const linksH       = gRijen * vH + (gRijen - 1) * VAKJE_GAP;
      const linksOY      = oy + (oh - linksH) / 2;

      for (let gr = 0; gr < gRijen; gr++) {
        const groepInRij = Math.min(MAX_GPER_RIJ, oef.groepen - gr * MAX_GPER_RIJ);
        const totB = groepInRij * vakjeB + (groepInRij - 1) * VAKJE_GAP;
        let vx     = ox + OEF_PAD_H + (linksW - OEF_PAD_H - totB) / 2;
        const vy   = linksOY + gr * (vH + VAKJE_GAP);

        for (let g = 0; g < groepInRij; g++) {
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(230,74,25);
          doc.setLineWidth(0.5);
          doc.roundedRect(vx, vy, vakjeB, vH, 1.5, 1.5, 'FD');
          const colW_e = (vakjeB - 2.5) / emoKolsN;
          const rowH_e = (vH - 2.5) / emoRijenN;
          for (let b = 0; b < oef.groepGrootte; b++) {
            const ec = b % emoKolsN, er = Math.floor(b / emoKolsN);
            const ex = vx + 1.25 + ec * colW_e + (colW_e - emoMm) / 2;
            const ey = vy + 1.25 + er * rowH_e + (rowH_e - emoMm) / 2;
            doc.addImage(emojiDataUrl, 'PNG', ex, ey, emoMm, emoMm);
          }
          vx += vakjeB + VAKJE_GAP;
        }
      }

      // ── RECHTS: invullijntjes ─────────────────────────────
      const lijnW   = lijnBreedte(oef.groepen);  // dynamisch, altijd passend
      const rechtsH = RIJ_H * 3 + 10;
      let fy = oy + (oh - rechtsH) / 2;
      const BL = RIJ_H - 2;

      function lijn(lx, ly, w) {
        doc.setDrawColor(100,100,100);
        doc.setLineWidth(LIJN_DIKTE);
        doc.line(lx, ly + BL, lx + w, ly + BL);
      }
      function bold(tx, ty, t, oranje) {
        doc.setFont('helvetica','bold'); doc.setFontSize(FS);
        doc.setTextColor(...(oranje ? [230,74,25] : [50,50,50]));
        doc.text(t, tx, ty + BL);
      }
      function italic(tx, ty, t) {
        doc.setFont('helvetica','italic'); doc.setFontSize(FS);
        doc.setTextColor(70,70,70);
        doc.text(t, tx, ty + BL - 0.5);
      }

      // Rij 1: lijn + lijn + ... = lijn(breed)  — altijd 1 rij
      let lx = rechtsX;
      for (let g = 0; g < oef.groepen; g++) {
        lijn(lx, fy, lijnW); lx += lijnW;
        if (g < oef.groepen - 1) {
          bold(lx + 0.5, fy, '+', true);
          doc.setFont('helvetica','bold'); doc.setFontSize(FS);
          lx += doc.getTextWidth('+') + PLUS_GAP;
        }
      }
      bold(lx + 0.5, fy, '=', false);
      doc.setFont('helvetica','bold'); doc.setFontSize(FS);
      lx += doc.getTextWidth('=') + 1.5;
      lijn(lx, fy, LIJN_BREED);
      fy += RIJ_H + 1;

      // Rij 2: lijn groepen van lijn = lijn
      let lx2 = rechtsX;
      lijn(lx2, fy, lijnW); lx2 += lijnW + 1;
      italic(lx2, fy, 'groepen van'); 
      doc.setFont('helvetica','italic'); doc.setFontSize(FS);
      lx2 += doc.getTextWidth('groepen van') + 1;
      lijn(lx2, fy, lijnW); lx2 += lijnW + 1;
      bold(lx2, fy, '=', false);
      doc.setFont('helvetica','bold'); doc.setFontSize(FS);
      lx2 += doc.getTextWidth('=') + 1.5;
      lijn(lx2, fy, lijnW);
      fy += RIJ_H + 1;

      // Rij 3: lijn × lijn = lijn
      let lx3 = rechtsX;
      lijn(lx3, fy, lijnW); lx3 += lijnW + 1;
      bold(lx3, fy, '×', true);
      doc.setFont('helvetica','bold'); doc.setFontSize(FS);
      lx3 += doc.getTextWidth('×') + 1;
      lijn(lx3, fy, lijnW); lx3 += lijnW + 1;
      bold(lx3, fy, '=', false);
      doc.setFont('helvetica','bold'); doc.setFontSize(FS);
      lx3 += doc.getTextWidth('=') + 1.5;
      lijn(lx3, fy, lijnW);

      y += oh + OEF_GAP;
    });
    y += NABLOK;
  }

  return { genereer };
})();

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
  function _tekenRij(oefeningen) {
    const kolB = CW / KOLOMMEN;
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
      const vakX = ox + kadW - vakW - 3;
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
  const HULP_KAD_H    = RIJHOOGTE + HULP_SPLITS_H + 6;
  const HULP_RIJ_H    = HULP_KAD_H + 6;

  function _tekenHulpRij(oefeningen, heeftSplits, heeftLijnen, bewerking, splitspositie) {
    const kolB   = CW / 2;
    const kadW   = kolB - 6;
    const marge  = 3;
    const beenSpan = 6;
    const vakjW = 9, vakjH = 7;

    oefeningen.forEach((oef, kol) => {
      const oy     = y;
      const ox     = ML + kol * kolB + 3;   // kader altijd op vaste positie
      const kadEindX = ox + kadW;

      // Bij aftrektal: som iets naar rechts zodat linkervakje splitsbeen in kader valt
      // Extra ruimte = beenSpan + vakjW/2 + marge - (breedte 1e getal / 2)
      // Eenvoudiger: vaste extra marge van 7mm bij aftrektal
      const somMarge = (heeftSplits && bewerking === 'aftrekken' && splitspositie === 'aftrektal')
        ? marge + 6
        : marge;
      const somStartX = ox + somMarge;

      // Bereken centreX voor splitsbeen
      const delen   = oef.vraag.replace(' =', '').trim().split(' ');
      const doelIdx = (bewerking === 'optellen') ? 2 : (splitspositie === 'aftrekker' ? 2 : 0);
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
      doc.roundedRect(ox, oy, kadW, HULP_KAD_H, 2, 2, 'FD');

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

      // Schrijflijnen — korter, eindigen vroeger
      if (heeftLijnen) {
        const lX1 = vakX + vakW + 2;
        const lX2 = ox + kadW - marge - 4;   // 4mm voor kaderrand stoppen
        const lY1 = vakY + vakH + 5;
        const lY2 = lY1 + 9;
        if (lX2 > lX1 + 5) {
          doc.setDrawColor(160, 185, 210);
          doc.setLineWidth(0.4);
          doc.line(lX1, lY1, lX2, lY1);
          doc.line(lX1, lY2, lX2, lY2);
        }
      }

      // Splitsbeen — centreX is al berekend bovenaan
      if (heeftSplits) {
        const beenTop = somY + 3;
        const beenH   = 6;
        doc.setDrawColor(26, 58, 92);
        doc.setLineWidth(0.6);
        doc.line(centreX, beenTop, centreX - beenSpan, beenTop + beenH);
        doc.line(centreX, beenTop, centreX + beenSpan, beenTop + beenH);

        const vakjY = beenTop + beenH + 1;
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(26, 58, 92);
        doc.setLineWidth(0.5);
        doc.roundedRect(centreX - beenSpan - vakjW / 2, vakjY, vakjW, vakjH, 1, 1, 'FD');
        doc.roundedRect(centreX + beenSpan - vakjW / 2, vakjY, vakjW, vakjH, 1, 1, 'FD');
      }
    });

    y += HULP_RIJ_H;
  }

  /* ── Gewoon blok ─────────────────────────────────────────── */
  function _tekenBlok(blok) {
    if (blok.bewerking === 'herken-brug') { _tekenHerkenBlok(blok); return; }

    const _rijGr      = (blok.hulpmiddelen?.includes('splitsbeen') || blok.hulpmiddelen?.includes('schrijflijnen')) ? 2 : KOLOMMEN;
    const aantalRijen = Math.ceil(blok.oefeningen.length / _rijGr);
    checkRuimte(MIN_RUIMTE);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(26, 58, 92);
    doc.text(blok.opdrachtzin, ML, y);
    y += ZINRUIMTE;

    const heeftSplits  = blok.hulpmiddelen?.includes('splitsbeen');
    const heeftLijnen  = blok.hulpmiddelen?.includes('schrijflijnen');
    const heeftHulp    = heeftSplits || heeftLijnen;
    const rijGrootte   = heeftHulp ? 2 : KOLOMMEN;
    const rijH         = heeftHulp ? HULP_RIJ_H : (RIJHOOGTE + RIJ_GAP);

    for (let rij = 0; rij < aantalRijen; rij++) {
      if (rij > 0) checkRuimte(rijH);
      const rijOef = blok.oefeningen.slice(rij * rijGrootte, (rij + 1) * rijGrootte);
      if (heeftHulp) {
        _tekenHulpRij(rijOef, heeftSplits, heeftLijnen, blok.bewerking, blok.splitspositie || 'aftrekker');
      } else {
        _tekenRij(rijOef);
      }
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

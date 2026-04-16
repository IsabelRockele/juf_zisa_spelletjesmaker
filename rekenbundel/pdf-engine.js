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
  const VOOR_ZIN   = 3;  // extra ruimte boven opdrachtzin (na scheidingslijn)
  const MIN_RUIMTE = ZINRUIMTE + RIJHOOGTE + RIJ_GAP + 4;

  // Herken-brug: één groot kader per oefening
  // bovenzijde = Zisa, onderzijde = som + invulvakje
  const HRK_IMG_H  = 20;   // hoogte Zisa-zone in kader (mm)
  const HRK_SOM_H  = 12;   // hoogte som-zone in kader (mm)
  const HRK_KAD_H  = HRK_IMG_H + HRK_SOM_H + 4; // totale kaderhoogte
  const HRK_RIJ_H  = HRK_KAD_H + 8;  // rij hoogte incl. ruimte eronder
 const HRK_MIN    = ZINRUIMTE + HRK_RIJ_H + 4;

  let doc, y, _lampBase64Cache, _metAntwoorden = false;

  /* ── Hulpfuncties ────────────────────────────────────────── */
  function nieuweBladzijde() { 
    doc.addPage(); 
    y = MT; 
    _tekenVoettekst(); // Voeg deze regel toe
  }
  function checkRuimte(nodig) { if (y + nodig > PH - MB) nieuweBladzijde(); }
  function lijn(x1, y1, x2, y2, rgb, dikte) {
    doc.setDrawColor(...rgb); doc.setLineWidth(dikte);
    doc.line(x1, y1, x2, y2);
  }

  /* ── Antwoordvakje: leeg of ingevuld ────────────────────── */
  function _antwoordVak(x, y, w, h, antwoord) {
    if (_metAntwoorden && antwoord !== undefined && antwoord !== null && String(antwoord) !== '') {
      // Groen ingevuld vakje
      doc.setFillColor(198, 239, 206);
      doc.setDrawColor(0, 150, 50);
      doc.setLineWidth(0.6);
      doc.roundedRect(x, y, w, h, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(0, 100, 0);
      doc.text(String(antwoord), x + w / 2, y + h / 2 + 2, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    } else {
      // Leeg wit vakje
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(26, 58, 92);
      doc.setLineWidth(0.6);
      doc.roundedRect(x, y, w, h, 2, 2, 'FD');
    }
  }

function _tekenVoettekst() {
    const footerText = "juf Zisa's spelgenerator - www.jufzisa.be";
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160); // Subtiel grijs
    
    const tw = doc.getTextWidth(footerText);
    const x = (PW - tw) / 2; // PW is de constante voor Page Width (210mm)
    
    // We plaatsen hem op 8mm van de onderkant. 
    // MB (Margin Bottom) is 15mm, dus er is 7mm witruimte boven de tekst.
    doc.text(footerText, x, PH - 8); 
    
    doc.setTextColor(0, 0, 0); // Reset naar zwart
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
y += 7;
lijn(ML, y, ML + CW, y, [74,144,217], 1.0);
y += 5;
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

      const tekstB = doc.getTextWidth(oef.vraag);
      const vakW   = Math.max(16, Math.min(22, ox + kadW - 4 - (ox + 3 + tekstB + 2)));
      const vakH   = kadH - 5;
      const vakX   = ox + 3 + tekstB + 2;
      const vakY   = oy + (kadH - vakH) / 2;
      _antwoordVak(vakX, vakY, vakW, vakH, oef.antwoord);
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

  /* ── Bereken splits-waarden vanuit vraag ─────────────────── */
  function _splitsVanVraag(oef, bewerking, splitspositie, strategie, aantalLijnen) {
    if (oef.splitsDeel1 !== undefined && oef.splitsDeel1 !== null &&
        oef.splitsDeel2 !== undefined && oef.splitsDeel2 !== null) {
      return { d1: oef.splitsDeel1, d2: oef.splitsDeel2,
               sl1: oef.schrijflijn1 ?? '', sl2: oef.schrijflijn2 ?? '' };
    }
    try {
      const delen = (oef.vraag || '').replace(' =','').trim().split(' ');
      if (delen.length < 3) return { d1:'', d2:'', sl1:'', sl2:'' };
      const g1 = parseInt(delen[0]) || 0;
      const g2 = parseInt(delen[2]) || 0;
      // Bij gemengd: bepaal bewerking uit de vraag
      const effectieveBewerking = (oef.vraag && oef.vraag.includes(' - ')) ? 'aftrekken' : 'optellen';
      const antwoord = oef.antwoord ?? (effectieveBewerking === 'optellen' ? g1+g2 : g1-g2);
      let d1, d2, d3 = '', sl1 = '', sl2 = '', sl3 = '';
      const nLijnenPdf = aantalLijnen || 2;
      if (effectieveBewerking === 'optellen') {
        const g2H = Math.floor(g2 / 100) * 100;
        const g2T = Math.floor((g2 % 100) / 10) * 10;
        const g2E = g2 % 10;
        const isHTE = g2H > 0;
        const isTE  = !isHTE && g2T > 0;

        // HT+HT of brug naar D
        const isHTplusHT = (g1 % 100 !== 0) && g2H > 0;
        const g1RestTotD = 1000 - (g1 % 1000);
        const isBrugD = (g1 % 100 === 0) && (g1 % 1000 !== 0) && g2 >= g1RestTotD
                        && Math.floor(g1 / 1000) !== Math.floor((g1 + g2) / 1000);

        if (isHTplusHT) {
          d1 = g2H; d2 = g2T; d3 = g2E;
          const ts1Ht = g1 + g2H;
          if (g2E > 0) {
            const ts2Ht = ts1Ht + g2T;
            sl1 = `${g1} + ${g2H} = ${ts1Ht}`;
            sl2 = `${ts1Ht} + ${g2T} = ${ts2Ht}`;
            sl3 = `${ts2Ht} + ${g2E} = ${antwoord}`;
          } else {
            sl1 = `${g1} + ${g2H} = ${ts1Ht}`;
            sl2 = `${ts1Ht} + ${g2T} = ${antwoord}`;
          }
        } else if (isBrugD) {
          d1 = g1RestTotD; d2 = g2 - d1;
          const ts1Bd = g1 + d1;
          sl1 = `${g1} + ${d1} = ${ts1Bd}`;
          sl2 = `${ts1Bd} + ${d2} = ${antwoord}`;
        } else if (isHTE) {
          // HTE: splits in H + T + E
          d1 = g2H; d2 = g2T;
          const ts1 = g1 + g2H;
          const ts2 = ts1 + g2T;
          sl1 = `${g1} + ${g2H} = ${ts1}`;
          sl2 = `${ts1} + ${g2T} = ${ts2}`;
          sl3 = `${ts2} + ${g2E} = ${antwoord}`;
        } else if (isTE) {
          // TE+TE: splits in T en E
          d1 = g2T; d2 = g2E;
          const ts1 = g1 + g2T;
          if (nLijnenPdf >= 3 && g2E > 0) {
            const e1 = ts1 % 10;
            const d2a = e1 === 0 ? g2E : Math.min(g2E, 10 - e1);
            const d2b = g2E - d2a;
            const ts2 = ts1 + d2a;
            sl1 = `${g1} + ${g2T} = ${ts1}`;
            sl2 = `${ts1} + ${d2a} = ${ts2}`;
            sl3 = `${ts2} + ${d2b} = ${antwoord}`;
          } else {
            sl1 = `${g1} + ${g2T} = ${ts1}`;
            sl2 = `${ts1} + ${g2E} = ${antwoord}`;
          }
        } else {
          const e1 = g1 % 10;
          d1 = e1 === 0 ? 10 : (10 - e1);
          d2 = g2 - d1;
          const ts1 = g1 + d1;
          sl1 = `${g1} + ${d1} = ${ts1}`;
          sl2 = `${ts1} + ${d2} = ${antwoord}`;
        }
      } else if (splitspositie === 'aftrektal') {
        const g1H_at = Math.floor(g1 / 100) * 100;
        const g1T_at = Math.floor((g1 % 100) / 10) * 10;
        const g1E_at = g1 % 10;
        const g1D_at = Math.floor(g1 / 1000) * 1000;

        if (g1D_at > 0 && g1H_at > 0 && g1T_at === 0 && g1E_at === 0) {
          // DH-H: 3600-900 -> 3000+600 -> 3000-900=2100, 2100+600=2700
          d1 = g1D_at; d2 = g1H_at;
          const ts1DhH_at = d1 - g2;
          sl1 = `${d1} - ${g2} = ${ts1DhH_at}`;
          sl2 = `${ts1DhH_at} + ${d2} = ${antwoord}`;
        } else if (g1H_at > 0 && g1E_at === 0 && g1T_at > 0) {
          // HT-TE: 420-16 -> T=20,H=400 -> 20-16=4, 400+4=404
          d1 = g1T_at; d2 = g1H_at;
          const ts1Ht = d1 - g2;
          sl1 = `${d1} - ${g2} = ${ts1Ht}`;
          sl2 = `${d2} + ${ts1Ht} = ${antwoord}`;
        } else if (g1H_at > 0) {
          // HTE: 572-413 -> 500+70+2
          d1 = g1H_at; d2 = g1T_at; d3 = g1E_at;
          const ts1At3 = d1 - g2;
          const ts2At3 = ts1At3 + d2;
          sl1 = `${d1} - ${g2} = ${ts1At3}`;
          sl2 = `${ts1At3} + ${d2} = ${ts2At3}`;
          sl3 = `${ts2At3} + ${d3} = ${antwoord}`;
        } else {
          d1 = g1T_at; d2 = g1E_at;
          const ts1At = d1 - g2;
          sl1 = `${d1} - ${g2} = ${ts1At}`;
          sl2 = `${ts1At} + ${d2} = ${antwoord}`;
        }
      } else {
        // Aftrekker splitsen
        const g2D_a = Math.floor(g2 / 1000) * 1000;
        const g2H_a = Math.floor((g2 % 1000) / 100) * 100;
        const g2T_a = Math.floor((g2 % 100) / 10) * 10;
        const g2E_a = g2 % 10;

        if (g2D_a > 0 && g2H_a > 0) {
          // DH-DH: 3200-1500 -> 1000+500
          d1 = g2D_a; d2 = g2H_a;
          const ts1DhDh = g1 - g2D_a;
          sl1 = `${g1} - ${g2D_a} = ${ts1DhDh}`;
          sl2 = `${ts1DhDh} - ${g2H_a} = ${antwoord}`;
        } else if (g2D_a === 0 && g2H_a > 0 && g2T_a === 0 && g2E_a === 0) {
          // DH-H: 4200-800 -> 200+600
          const aanvullingD = g1 % 1000;
          const restH = g2 - aanvullingD;
          d1 = aanvullingD; d2 = restH;
          const ts1DhH = g1 - aanvullingD;
          sl1 = `${g1} - ${aanvullingD} = ${ts1DhH}`;
          sl2 = `${ts1DhH} - ${restH} = ${antwoord}`;
        } else if (g2H_a > 0) {
          // HTE: splits in H + T + E
          d1 = g2H_a; d2 = g2T_a; d3 = g2E_a;
          const ts1HteA = g1 - g2H_a;
          const ts2HteA = ts1HteA - g2T_a;
          sl1 = `${g1} - ${g2H_a} = ${ts1HteA}`;
          sl2 = `${ts1HteA} - ${g2T_a} = ${ts2HteA}`;
          sl3 = `${ts2HteA} - ${g2E_a} = ${antwoord}`;
        } else {
          const d1T = g2T_a; const d2E = g2E_a;
          if (d1T === 0) {
            d1 = g1 % 10; d2 = g2 - d1;
            const ts1E = g1 - d1;
            sl1 = `${g1} - ${d1} = ${ts1E}`;
            sl2 = `${ts1E} - ${d2} = ${antwoord}`;
          } else {
            d1 = d1T; d2 = d2E;
            const ts1TE = g1 - d1;
            sl1 = `${g1} - ${d1} = ${ts1TE}`;
            sl2 = `${ts1TE} - ${d2} = ${antwoord}`;
          }
        }
      }
      return { d1, d2, d3, sl1, sl2, sl3 };
    } catch(e) { return { d1:'', d2:'', sl1:'', sl2:'' }; }
  }

  function _tekenHulpRij(oefeningen, heeftSplits, heeftLijnen, bewerking, splitspositie, schrijflijnenAantal = 2, blokBrug = 'zonder', blokNiveau = 100) {
    const kolB   = CW / 2;
    const kadW   = kolB - 6;
    const marge  = 3;
    const beenSpan = 5;
    const kadH   = _hulpKadH(schrijflijnenAantal);
    const rijH   = kadH + 6;

    oefeningen.forEach((oef, kol) => {
      const oy     = y;
      const ox     = ML + kol * kolB + 3;   // kader altijd op vaste positie
      const kadEindX = ox + kadW;

      // Bereken centreX voor splitsbeen — moet vóór somMarge want doelGetal nodig
     const delen   = oef.vraag.replace(' =', '').trim().split(' ');
// Bij gemengd blok: detecteer bewerking per oefening via het teken
const oefBewerking = (bewerking === 'gemengd')
  ? (oef.vraag.includes('−') || oef.vraag.includes('-') ? 'aftrekken' : 'optellen')
  : bewerking;
const doelIdx = (oefBewerking === 'optellen') ? 2 : (splitspositie === 'aftrekker' ? 2 : 0);
const doelGetal = parseInt(delen[doelIdx]) || 0;

// Alleen bij brugoefeningen: meer ruimte in de som
const isBrugLayout = blokBrug !== 'zonder';
const spatieVoorSplits = isBrugLayout ? '   ' : ' ';
const somTekst = (delen.length >= 3)
  ? `${delen[0]}${spatieVoorSplits}${delen[1]}${spatieVoorSplits}${delen[2]}${spatieVoorSplits}=`
  : oef.vraag;
      const isHTE = doelGetal >= 100 && doelGetal % 100 !== 0 && doelGetal % 10 !== 0;
      const aantalTakken = isHTE ? 3 : 2;
      // Bredere vakjes bij niveau tot 10.000
      const splGroot  = blokNiveau >= 10000;
      const vakjW     = splGroot ? 16 : 9;
      const vakjH     = splGroot ? 8  : 7;
      const beenSpanW = aantalTakken === 3 ? (splGroot ? 20 : 8) : (splGroot ? 14 : beenSpan);

      // Bij aftrektal: som naar rechts zodat linkervakje splitsbeen in kader valt
      const isAftrektal = heeftSplits && oefBewerking === 'aftrekken' && splitspositie === 'aftrektal';
      const extraMarge = isAftrektal
        ? (splGroot
            ? (aantalTakken === 3 ? 22 : 14)   // 4-cijferig: bredere vakjes
            : (aantalTakken === 3 ? 13 : 6))    // 3-cijferig: origineel
        : 0;
      const somMarge = marge + extraMarge;
      const somStartX = ox + somMarge;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      let xOff = somStartX;
     for (let i = 0; i < doelIdx; i++) {
  xOff += doc.getTextWidth(delen[i] + spatieVoorSplits);
}
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
      doc.text(somTekst, somStartX, somY);

      // Invulvakje — direct na = teken, breed genoeg voor 4-cijferig antwoord
      const somBreedte = doc.getTextWidth(somTekst);
      const vakY  = oy + 2;
      const vakW  = 16;
      const vakH  = 9;
      const vakX  = somStartX + somBreedte + 2;
      _antwoordVak(vakX, vakY, vakW, vakH, oef.antwoord);

      // Schrijflijnen — rechts van het meest rechtse splitsvakje
      if (heeftLijnen) {
        const span2   = vakjW / 2 + 2;
        const span3   = vakjW + 4;
        const rechtsteVak = aantalTakken === 3
          ? centreX + span3 + vakjW / 2
          : centreX + span2 + vakjW / 2;
        const lX1    = rechtsteVak + 3;
        const lX2    = ox + kadW - 6;
        const lY1    = vakY + vakH + 10;
        const lijnGap = 12;
        if (lX2 > lX1 + 5) {
          // Bereken antwoorden voor schrijflijnen
          const _spLijn = _metAntwoorden ? _splitsVanVraag(oef, oefBewerking, splitspositie, null, schrijflijnenAantal) : null;
          const lijnAntw = _spLijn ? [_spLijn.sl1, _spLijn.sl2] : [];

          doc.setDrawColor(160, 185, 210);
          doc.setLineWidth(0.4);
          const lijnAntw3 = _spLijn ? [_spLijn.sl1, _spLijn.sl2, _spLijn.sl3] : [];
          for (let li = 0; li < schrijflijnenAantal; li++) {
            const lY = lY1 + li * lijnGap;
            doc.line(lX1, lY, lX2, lY);
            if (_metAntwoorden && lijnAntw3[li] && lijnAntw3[li] !== '') {
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(10);
              doc.setTextColor(0, 100, 0);
              doc.text(String(lijnAntw3[li]), lX1 + 2, lY - 2);
              doc.setTextColor(30, 30, 30);
            }
          }
        }
      }

      // Splitsbeen: 2 of 3 takken
      if (heeftSplits) {
        const beenTop  = somY + 3;
        const beenH    = 6;
        // Span = halve vakjbreedte + kleine marge zodat takken netjes in midden van vakje eindigen
        const span2    = vakjW / 2 + 2;
        doc.setDrawColor(26, 58, 92);
        doc.setLineWidth(0.6);

        if (aantalTakken === 3) {
          const span3 = vakjW + 4;
          doc.line(centreX, beenTop, centreX - span3, beenTop + beenH);
          doc.line(centreX, beenTop, centreX,          beenTop + beenH);
          doc.line(centreX, beenTop, centreX + span3,  beenTop + beenH);
          const vakjY = beenTop + beenH + 1;
          const _sp3 = _metAntwoorden ? _splitsVanVraag(oef, oefBewerking, splitspositie, null, schrijflijnenAantal) : null;
          const sp3Vals = [_sp3?.d1, _sp3?.d2, _sp3?.d3];
          const sp3Pos = [centreX - span3 - vakjW/2, centreX - vakjW/2, centreX + span3 - vakjW/2];
          const sp3Cx  = [centreX - span3, centreX, centreX + span3];
          [0,1,2].forEach(i => {
            const val = sp3Vals[i];
            if (_metAntwoorden && val !== undefined && val !== '') {
              doc.setFillColor(198, 239, 206); doc.setDrawColor(0,150,50);
            } else {
              doc.setFillColor(255, 255, 255); doc.setDrawColor(26, 58, 92);
            }
            doc.setLineWidth(0.5);
            doc.roundedRect(sp3Pos[i], vakjY, vakjW, vakjH, 1, 1, 'FD');
            if (_metAntwoorden && val !== undefined && val !== '') {
              doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(0,100,0);
              doc.text(String(val), sp3Cx[i], vakjY + vakjH - 1.5, {align:'center'});
              doc.setTextColor(30,30,30);
            }
          });
        } else {
          doc.line(centreX, beenTop, centreX - span2, beenTop + beenH);
          doc.line(centreX, beenTop, centreX + span2,  beenTop + beenH);
          const vakjY = beenTop + beenH + 1;
          const _sp2 = _metAntwoorden ? _splitsVanVraag(oef, oefBewerking, splitspositie, null, schrijflijnenAantal) : null;
          // Linkervakje
          if (_metAntwoorden && _sp2 && _sp2.d1 !== '') {
            doc.setFillColor(198, 239, 206); doc.setDrawColor(0,150,50);
          } else {
            doc.setFillColor(255, 255, 255); doc.setDrawColor(26, 58, 92);
          }
          doc.setLineWidth(0.5);
          doc.roundedRect(centreX - span2 - vakjW / 2, vakjY, vakjW, vakjH, 1, 1, 'FD');
          if (_metAntwoorden && _sp2 && _sp2.d1 !== '') {
            doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(0,100,0);
            doc.text(String(_sp2.d1), centreX - span2, vakjY + vakjH - 1.5, {align:'center'});
            doc.setTextColor(30,30,30);
          }
          // Rechtervakje
          if (_metAntwoorden && _sp2 && _sp2.d2 !== '') {
            doc.setFillColor(198, 239, 206); doc.setDrawColor(0,150,50);
          } else {
            doc.setFillColor(255, 255, 255); doc.setDrawColor(26, 58, 92);
          }
          doc.roundedRect(centreX + span2 - vakjW / 2, vakjY, vakjW, vakjH, 1, 1, 'FD');
          if (_metAntwoorden && _sp2 && _sp2.d2 !== '') {
            doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(0,100,0);
            doc.text(String(_sp2.d2), centreX + span2, vakjY + vakjH - 1.5, {align:'center'});
            doc.setTextColor(30,30,30);
          }
        }
      }

    });

    y += rijH;
  }

  /* ── Aanvullen constanten ────────────────────────────────── */
  const AANV_KAD_H_ZONDER  = 32;
  const AANV_KAD_H_SCHEMA  = 50;
  const AANV_KAD_H_SCHIJF  = 62;   // tot 1000: 2 rijen schijfjes
  const AANV_KAD_H_SCHIJF_D = 78;  // tot 10000: 3 rijen schijfjes (4-4-2)
  const AANV_KOLOMMEN      = 3;
  const AANV_KOLOMMEN_SCHIJF = 2;

  function _aanvulKadH(variant, niveau) {
    if (variant === 'met-schema')    return AANV_KAD_H_SCHEMA;
    if (variant === 'met-schijfjes') return (niveau >= 10000) ? AANV_KAD_H_SCHIJF_D : AANV_KAD_H_SCHIJF;
    return AANV_KAD_H_ZONDER;
  }

  function _tekenAanvullenRij(oefeningen, variant, niveau = 100) {
    const aantalKol = variant === 'met-schijfjes' ? AANV_KOLOMMEN_SCHIJF : AANV_KOLOMMEN;
    const kolB  = CW / aantalKol;
    const kadW  = kolB - 6;
    const marge = 3;
    const kadH  = _aanvulKadH(variant, niveau);

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

      const hY1 = somY1 - hH + 2;
      const hY2 = somY2 - hH + 2;
      // Antwoorden: groot - klein = ? en klein + ? = groot
      const ant1 = groot - klein;  // aanvullen: groot - klein = ant1
      const ant2 = groot - klein;  // klein + ant2 = groot
      if (_metAntwoorden) {
        _antwoordVak(ox + marge + doc.getTextWidth(som1) + 1.5, hY1, hW, hH, ant1);
        _antwoordVak(ox + marge + doc.getTextWidth(som2) + 1.5, hY2, hW, hH, ant2);
      } else {
        _tekenInvulhokje(ox + marge + doc.getTextWidth(som1) + 1.5, hY1, hW, hH);
        _tekenInvulhokje(ox + marge + doc.getTextWidth(som2) + 1.5, hY2, hW, hH);
      }

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
    const dKlein = Math.floor(klein / 1000);
    const hKlein = Math.floor((klein % 1000) / 100);
    const tKlein = Math.floor((klein % 100) / 10);
    const eKlein = klein % 10;
    const dGroot = Math.floor(groot / 1000);
    const hGroot = Math.floor((groot % 1000) / 100);
    const metD   = dGroot > 0;
    const metH   = hGroot > 0 || dGroot > 0;

    const TOTAAL   = 10;
    const LEGE_RIJ = 5;  // extra lege schijfjes voor aanvullen inkleuren
    const schY     = somY2 + 9;
    const aantalKol = (metD ? 1 : 0) + (metH ? 1 : 0) + 2;  // D? + H? + T + E
    const kolW     = (kadW - marge * 2) / aantalKol;
    const kopH     = 5;
    // 4-4-2 bij D-kolom, 5-5 anders
    const rijGrootte = metD ? 4 : 5;
    const schijfD  = metD ? 3.8 : (metH ? 4.2 : 5.2);
    const gap      = 0.8;
    const rijH     = schijfD + gap;
    // Extra rij voor E (altijd), T (bij tot1000+), H (bij tot10000)
    const metLegeRijE = true;
    const metLegeRijT = metH;
    const metLegeRijH = metD;
    const aantalRijen = Math.ceil(TOTAAL / rijGrootte) + 1;  // +1 voor lege aanvulrij

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    // Kolom X posities
    let kx = ox + marge;
    const kolommen = [];
    if (metD) { kolommen.push({ label:'D', kleur:[220,80,60], txtKleur:[255,255,255], aantalVoor:dKlein, tekst:'1000' }); }
    if (metH) { kolommen.push({ label:'H', kleur:[100,160,210], txtKleur:[10,50,100], aantalVoor:hKlein, tekst:'100' }); }
    kolommen.push({ label:'T', kleur:[80,190,130], txtKleur:[10,80,40], aantalVoor:tKlein, tekst:'10' });
    kolommen.push({ label:'E', kleur:[245,210,100], txtKleur:[100,75,0], aantalVoor:eKlein, tekst:'1' });

    const headerKleuren = {
      'D': [[220,60,40],[255,255,255]],
      'H': [[214,234,248],[26,82,118]],
      'T': [[171,235,198],[30,132,73]],
      'E': [[254,249,231],[154,125,10]],
    };

    // Teken headers en kaders
    kolommen.forEach((kol, i) => {
      const x = ox + marge + i * kolW;
      const [bg, fg] = headerKleuren[kol.label];
      doc.setFillColor(...bg);
      doc.setDrawColor(170, 170, 170);
      doc.setLineWidth(0.4);
      doc.rect(x, schY, kolW, kopH, 'FD');
      doc.setTextColor(...fg);
      doc.text(kol.label, x + kolW / 2, schY + kopH - 1, { align: 'center' });
    });

    // Kader rondom alles
    const totW = kolW * kolommen.length;
    const totH = kopH + aantalRijen * rijH + gap + gap;  // extra ruimte voor aanvulrij
    doc.setDrawColor(170, 170, 170);
    doc.setLineWidth(0.4);
    doc.rect(ox + marge, schY, totW, totH);
    // Verticale scheidingslijnen
    for (let i = 1; i < kolommen.length; i++) {
      doc.line(ox + marge + i * kolW, schY, ox + marge + i * kolW, schY + totH);
    }

    // Teken schijfjes per kolom
    kolommen.forEach((kol, ki) => {
      const kolX = ox + marge + ki * kolW;
      // Bepaal of deze kolom een lege aanvulrij krijgt
      const heeftLegeRij = (kol.label === 'E' && metLegeRijE) ||
                           (kol.label === 'T' && metLegeRijT) ||
                           (kol.label === 'H' && metLegeRijH);

      // Teken de 10 gewone schijfjes
      for (let i = 0; i < TOTAAL; i++) {
        const rijNr = Math.floor(i / rijGrootte);
        const posInRij = i % rijGrootte;
        const sx = kolX + gap + posInRij * (schijfD + gap) + schijfD / 2;
        const sy = schY + kopH + gap + rijNr * rijH + schijfD / 2;
        const isVoor = i < kol.aantalVoor;
        if (isVoor) {
          doc.setFillColor(...kol.kleur);
          doc.setDrawColor(kol.kleur[0]-40, kol.kleur[1]-40, kol.kleur[2]-40);
        } else {
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(180, 180, 180);
        }
        doc.setLineWidth(0.3);
        doc.circle(sx, sy, schijfD / 2, 'FD');
        if (isVoor) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(4.5);
          doc.setTextColor(...kol.txtKleur);
          doc.text(kol.tekst, sx, sy + 1.2, { align: 'center' });
        }
      }

      // Teken extra lege rij voor aanvullen inkleuren
      if (heeftLegeRij) {
        const legeRijNr = Math.ceil(TOTAAL / rijGrootte);
        for (let i = 0; i < LEGE_RIJ; i++) {
          const sx = kolX + gap + i * (schijfD + gap) + schijfD / 2;
          const sy = schY + kopH + gap + legeRijNr * rijH + schijfD / 2;
          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(200, 210, 220);
          doc.setLineWidth(0.25);
          doc.circle(sx, sy, schijfD / 2, 'FD');
        }
      }
    });
  }


  /* ── Compenseren blok ───────────────────────────────────────── */
  function _tekenCompenserenBlok(blok) {
    const variant     = blok.compenserenVariant || 'met-tekens';
    const metVoorbeeld = blok.metVoorbeeld !== false;

    // zonder-hulp: aparte renderer — simpele som + lange schrijflijn
    if (variant === 'zonder-hulp') {
      const KAAL_H   = 14;
      const KAAL_RIJ = KAAL_H + 5;
      const kolB     = CW / 2;
      const kadW     = kolB - 6;
      const marge    = 3;
      const aantalRijen = Math.ceil(blok.oefeningen.length / 2);
      checkRuimte(ZINRUIMTE + KAAL_RIJ + 4);
      y += VOOR_ZIN;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(26, 58, 92);
      doc.text(blok.opdrachtzin, ML, y);
      y += ZINRUIMTE;
      for (let rij = 0; rij < aantalRijen; rij++) {
        if (rij > 0) checkRuimte(KAAL_RIJ);
        blok.oefeningen.slice(rij * 2, (rij + 1) * 2).forEach((oef, kol) => {
          const isVb = metVoorbeeld && rij === 0 && kol === 0;
          const oy = y, ox = ML + kol * kolB + 3;
          doc.setFillColor(isVb ? 255 : 255, isVb ? 248 : 255, isVb ? 220 : 255);
          doc.setDrawColor(isVb ? 240 : 180, isVb ? 192 : 200, isVb ? 80 : 225);
          doc.setLineWidth(isVb ? 1 : 0.5);
          doc.roundedRect(ox, oy, kadW, KAAL_H, 2, 2, 'FD');
          const somY = oy + 9;
          if (isVb) {
            // Voorbeeld: som = ander + tiental − delta = antwoord
            const isAftrekken = oef.vraag.includes(' - ');
            const teken = isAftrekken ? '-' : '+';
            const tussenTeken = isAftrekken ? '+' : '-';
            const s1 = `${oef.vraag.replace(' =','')} = ${oef.andereGetal} ${teken} ${oef.tiental} `;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
            doc.setTextColor(26, 58, 92);
            doc.text(s1, ox + marge, somY);
            const x2 = ox + marge + doc.getTextWidth(s1);
            doc.setTextColor(192, 0, 0);
            const s2 = `${tussenTeken} ${oef.compenseerDelta} = ${oef.antwoord}`;
            doc.text(s2, x2, somY);
          } else {
            doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
            doc.setTextColor(44, 62, 80);
            const somStr = oef.vraag;
            doc.text(somStr, ox + marge, somY);
            const xL = ox + marge + doc.getTextWidth(somStr) + 2;
            doc.setDrawColor(180, 195, 210); doc.setLineWidth(0.4);
            doc.line(xL, somY, ox + kadW - marge, somY);
          }
        });
        y += KAAL_RIJ;
      }
      y += NABLOK + 4;
      lijn(ML, y - 4, ML + CW, y - 4, [210, 220, 230], 0.4);
      return;
    }

    // Afmetingen kader: 2 per rij
    const COMP_KAD_H  = 38;   // hoog genoeg voor som + pijl + blokje
    const COMP_RIJ_H  = COMP_KAD_H + 6;
    const kolB        = CW / 2;
    const kadW        = kolB - 6;
    const marge       = 3;

    const aantalRijen = Math.ceil(blok.oefeningen.length / 2);
    checkRuimte(ZINRUIMTE + COMP_RIJ_H + 4);

    y += VOOR_ZIN;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
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
        if (_metAntwoorden) {
          doc.setFillColor(198, 239, 206); doc.setDrawColor(0, 150, 50);
        } else {
          doc.setFillColor(255, 255, 255); doc.setDrawColor(26, 58, 92);
        }
        doc.setLineWidth(0.5);
        doc.roundedRect(avX, avY, avW, avH, 1.5, 1.5, 'FD');
        if (_metAntwoorden) {
          doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(0, 100, 0);
          doc.text(String(oef.antwoord), avX + avW/2, avY + avH - 2, {align:'center'});
          doc.setTextColor(44, 62, 80);
        }

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

        if (isVoorbeeld || _metAntwoorden) {
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(hokje1X, blokY + 1, getalW, hokH, 1, 1, 'FD');
  doc.roundedRect(hokje2X, blokY + 1, getalW, hokH, 1, 1, 'FD');

  doc.setTextColor(26, 58, 92);

  doc.setFontSize(12);
  doc.text(teken1, teken1X, blokY + 6);

  doc.setFontSize(13);
  const txt1 = String(oef.tiental);
  const txt1W = doc.getTextWidth(txt1);
  const txt1X = hokje1X + (getalW - txt1W) / 2;
  doc.text(txt1, txt1X, blokY + 6);

  doc.setFontSize(12);
  doc.text(teken2, teken2X, blokY + 6);

  doc.setFontSize(13);
  const txt2 = String(oef.compenseerDelta);
  const txt2W = doc.getTextWidth(txt2);
  const txt2X = hokje2X + (getalW - txt2W) / 2;
  doc.text(txt2, txt2X, blokY + 6);

  doc.setFontSize(12);
  doc.setTextColor(44, 62, 80);
} else if (variant === 'met-tekens') {
  if (_metAntwoorden) {
    doc.setFillColor(198, 239, 206); doc.setDrawColor(0, 150, 50);
  } else {
    doc.setFillColor(255, 255, 255); doc.setDrawColor(26, 58, 92);
  }
  doc.roundedRect(hokje1X, blokY + 1, getalW, hokH, 1, 1, 'FD');
  if (_metAntwoorden) {
    doc.setFillColor(198, 239, 206); doc.setDrawColor(0, 150, 50);
  } else {
    doc.setFillColor(255, 255, 255); doc.setDrawColor(26, 58, 92);
  }
  doc.roundedRect(hokje2X, blokY + 1, getalW, hokH, 1, 1, 'FD');
  doc.setTextColor(26, 58, 92);
  doc.text(teken1, teken1X, blokY + 6);
  doc.text(teken2, teken2X, blokY + 6);
  if (_metAntwoorden) {
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(0, 100, 0);
    const antTxt1 = String(oef.tiental);
    doc.text(antTxt1, hokje1X + (getalW - doc.getTextWidth(antTxt1))/2, blokY + 6);
    const antTxt2 = String(oef.compenseerDelta);
    doc.text(antTxt2, hokje2X + (getalW - doc.getTextWidth(antTxt2))/2, blokY + 6);
    doc.setTextColor(44, 62, 80);
  }
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
          // Bij voorbeeld OF oplossingssleutel: schrijflijnen invullen
          if (isVoorbeeld || _metAntwoorden) {
            doc.setFontSize(10);
            doc.setTextColor(80, 80, 80);
            doc.text(oef.schrijflijn1, lijnStartX, lY1 - 1);
            doc.text(oef.schrijflijn2, lijnStartX, lY2 - 1);
          } else if (_metAntwoorden) {
            doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(0, 100, 0);
            if (oef.schrijflijn1) doc.text(String(oef.schrijflijn1), lijnStartX, lY1 - 1);
            if (oef.schrijflijn2) doc.text(String(oef.schrijflijn2), lijnStartX, lY2 - 1);
            doc.setTextColor(44, 62, 80);
          }
        }
      });

      y += COMP_RIJ_H;
    }
    y += NABLOK + 4;  // extra marge na compenseer-blok
    lijn(ML, y - 4, ML + CW, y - 4, [210, 220, 230], 0.4);
  }

  /* ══════════════════════════════════════════════════════════════
     CIJFEREN — PDF functies
     ══════════════════════════════════════════════════════════════ */
  const CIJ_CEL        = 10;    // breedte/hoogte van 1 cel in mm
  const CIJ_VRAAG_H    = 10;   // hoogte vraag-zone boven schatting/schema
  const CIJ_PIJL_H     = 8;    // extra lucht tussen schatting/vraag en schema (pijl)
  const CIJ_SCHEMA_H   = 5 * CIJ_CEL; // 5 rijen: header+onthoud+g1+g2+oplossing
  const CIJ_SCHAT_H    = 16;   // hoogte schatting-vak (groter = meer schrijfruimte)
  const CIJ_KAD_BASIS  = CIJ_VRAAG_H + CIJ_PIJL_H + CIJ_SCHEMA_H + 8;

  function _tekenCijferenBlok(blok) {
    const cfg      = blok.config || {};
    const ingevuld = cfg.invulling === 'ingevuld';
    const metPijl  = cfg.startpijl !== false;
    const metSchat = cfg.schatting === true;
    const bereik   = cfg.bereik || 100;

    const aantalKol = (bereik >= 1000 || metSchat) ? 3 : 4;
    const extraH    = metSchat ? CIJ_SCHAT_H : 0;
    const kadH      = CIJ_KAD_BASIS + extraH;
    const kolB      = CW / aantalKol;
    const aantalRijen = Math.ceil(blok.oefeningen.length / aantalKol);
    const rijH      = kadH + 6;

    const CIJ_NA_ZIN   = 5;  // ruimte tussen opdrachtzin en eerste kaart
    checkRuimte(VOOR_ZIN + CIJ_NA_ZIN + rijH + 4);
    y += VOOR_ZIN;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
doc.setTextColor(30, 30, 30);
    doc.text(blok.opdrachtzin, ML, y);
    y += CIJ_NA_ZIN;

    for (let rij = 0; rij < aantalRijen; rij++) {
      checkRuimte(rijH);
      const rijOef = blok.oefeningen.slice(rij * aantalKol, (rij + 1) * aantalKol);
      for (let k = 0; k < rijOef.length; k++) {
        const oef  = rijOef[k];
        const ox   = ML + k * kolB + 2;
        const oy   = y;
        const kadW = kolB - 4;
        _tekenCijferKaart(oef, ox, oy, kadW, kadH, ingevuld, metPijl, metSchat);
      }
      y += rijH;
    }
    lijn(ML, y - 4, ML + CW, y - 4, [210, 220, 230], 0.4);
  }

  function _tekenCijferKaart(oef, ox, oy, kadW, kadH, ingevuld, metPijl, metSchat) {
    const showD   = oef.showD;
    const showH   = oef.showH || showD;
    const op      = oef.operator;
    const opTekst = op === '\u2212' ? '-' : op;

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.4);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(ox, oy, kadW, kadH, 2, 2, 'FD');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(`${oef.g1} ${opTekst} ${oef.g2} = ?`, ox + kadW / 2, oy + 6.5, { align: 'center' });

    let schemaY = oy + CIJ_VRAAG_H;

    if (metSchat) {
      const vakX = ox + 3, vakY = schemaY + 1;
      const vakW = kadW - 6, vakH = CIJ_SCHAT_H - 2;
      doc.setFillColor(245, 245, 245); doc.setDrawColor(210, 210, 210); doc.setLineWidth(0.3);
      doc.roundedRect(vakX, vakY, vakW, vakH, 1.5, 1.5, 'FD');
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60);
      doc.text('Ik schat:', vakX + 2, vakY + vakH / 2 + 1.5);
      doc.setDrawColor(160, 160, 160); doc.setLineWidth(0.4);
      doc.line(vakX + 18, vakY + vakH - 3, vakX + vakW - 3, vakY + vakH - 3);
      schemaY += CIJ_SCHAT_H;
    }

    schemaY += CIJ_PIJL_H;

    const aantalCols = showD ? 4 : showH ? 3 : 2;
    const schemaW    = aantalCols * CIJ_CEL;
    const schemaX    = ox + (kadW - schemaW) / 2 + 4;
    const opX        = schemaX - 5;
    const c          = CIJ_CEL;

    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
    doc.text(opTekst, opX, schemaY + 3 * c + c / 2 + 3, { align: 'right' });

    _tekenCijferSchema(oef, schemaX, schemaY, showD, showH, ingevuld, metPijl);
  }

  function _tekenCijferSchema(oef, sx, sy, showD, showH, ingevuld, metPijl) {
    const c    = CIJ_CEL;
    const cols = showD ? ['D','H','T','E'] : showH ? ['H','T','E'] : ['T','E'];

    const kleur = {
      D: { bg: [231,76,60],  fg: [255,255,255], licht: [241,148,138] },
      H: { bg: [41,128,185], fg: [255,255,255], licht: [169,204,227] },
      T: { bg: [39,174,96],  fg: [255,255,255], licht: [163,228,215] },
      E: { bg: [241,196,15], fg: [50,50,50],    licht: [249,231,159] },
    };

    for (let ri = 0; ri < 5; ri++) {
      for (let ci = 0; ci < cols.length; ci++) {
        const col = cols[ci];
        const cx  = sx + ci * c;
        const cy  = sy + ri * c;
        const k   = kleur[col];

        doc.setLineWidth(0.5);
        doc.setDrawColor(120, 120, 120);

        if (ri === 0) {
          doc.setFillColor(...k.bg);
          doc.rect(cx, cy, c, c, 'FD');
          doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...k.fg);
          doc.text(col, cx + c / 2, cy + 6.5, { align: 'center' });
          if (metPijl && col === 'E') {
            const px = cx + c / 2, breedte = 3.5, hoogte = 4, staart = 2;
            const puntBot = cy, puntTop = puntBot - hoogte;
            doc.setFillColor(241, 196, 15); doc.setDrawColor(241, 196, 15);
            doc.rect(px - 1.2, puntTop - staart, 2.4, staart, 'F');
            doc.triangle(px - breedte, puntTop, px + breedte, puntTop, px, puntBot, 'F');
          }
        } else if (ri === 1) {
          doc.setFillColor(...k.licht);
          doc.rect(cx, cy, c, c, 'FD');
        } else if (ri === 4) {
          // Oplossingsrij: bij antwoorden ingevuld
          if (_metAntwoorden && oef && oef.antwoord !== undefined) {
            doc.setFillColor(198, 239, 206);
            doc.setDrawColor(0, 150, 50);
            doc.setLineWidth(1.2);
            doc.rect(cx, cy, c, c, 'FD');
            doc.setLineWidth(1.2); doc.setDrawColor(30, 30, 30);
            doc.line(cx, cy, cx + c, cy);
            // Antwoordcijfer centraal
            const antStr = col==='D'?(oef.antD||''):col==='H'?(oef.antH||''):col==='T'?(oef.antT||''):(oef.antE||'');
            if (antStr) {
              doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(0,100,0);
              doc.text(antStr, cx + c/2, cy + c - 2, { align: 'center' });
            }
          } else {
            doc.setFillColor(255, 255, 255);
            doc.rect(cx, cy, c, c, 'FD');
            doc.setLineWidth(1.2); doc.setDrawColor(30, 30, 30);
            doc.line(cx, cy, cx + c, cy);
            doc.setLineWidth(0.5); doc.setDrawColor(120, 120, 120);
            doc.line(cx, cy, cx, cy + c);
            doc.line(cx + c, cy, cx + c, cy + c);
            doc.line(cx, cy + c, cx + c, cy + c);
          }
        } else {
          doc.setFillColor(253, 253, 253);
          doc.rect(cx, cy, c, c, 'FD');
          if (ingevuld) {
            let txt = '';
            if (ri === 2) txt = col==='D'?(oef.D1||''):col==='H'?(oef.H1||''):col==='T'?(oef.T1||''):(oef.E1||'');
            else          txt = col==='D'?(oef.D2||''):col==='H'?(oef.H2||''):col==='T'?(oef.T2||''):(oef.E2||'');
            if (txt) {
              doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
              doc.text(txt, cx + c / 2, cy + c - 2, { align: 'center' });
            }
          }
        }
      }
    }
  }

  function _tekenKommaBlok(blok) {
    const cfg      = blok.config || {};
    const ingevuld = cfg.invulling === 'ingevuld';
    const startpijl = cfg.startpijl !== false;
    const aantalKol = (cfg.schatting) ? 3 : 4;
    const kolB      = CW / aantalKol;

    // Kaarthoogte: zelfde als normaal cijferschema (4 rijen: onthoud+g1+g2+oplossing+res)
    const c = CIJ_CEL;
    const kadH = CIJ_KAD_BASIS + (cfg.schatting ? CIJ_SCHAT_H : 0);
    const rijH  = kadH + 6;
    const aantalRijen = Math.ceil(blok.oefeningen.length / aantalKol);

    checkRuimte(VOOR_ZIN + rijH + 4);
    y += VOOR_ZIN;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text(blok.opdrachtzin, ML, y);
    y += 6;

    for (let rij = 0; rij < aantalRijen; rij++) {
      checkRuimte(rijH);
      const rijOef = blok.oefeningen.slice(rij * aantalKol, (rij + 1) * aantalKol);
      for (let k = 0; k < rijOef.length; k++) {
        const ox = ML + k * kolB + 2;
        _tekenKommaKaart(rijOef[k], ox, y, kolB - 4, kadH, ingevuld, startpijl);
      }
      y += rijH;
    }
    lijn(ML, y - 4, ML + CW, y - 4, [210, 220, 230], 0.4);
  }

  function _tekenKommaKaart(oef, ox, oy, kadW, kadH, ingevuld, startpijl) {
    const c = CIJ_CEL;
    // Kolombreedte: T=c, E=c, komma=4, t=c
    const kW = 4;  // kommakolom breedte in mm
    const schemaB = 3 * c + kW;

    // Kader
    doc.setDrawColor(180,180,180); doc.setLineWidth(0.4);
    doc.setFillColor(255,255,255);
    doc.roundedRect(ox, oy, kadW, kadH, 2, 2, 'FD');

    // Vraag
    doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(30,30,30);
    doc.text(oef.g1Str + ' ' + oef.operator + ' ' + oef.g2Str + ' =', ox+4, oy+6.5);

    // Startpijl
    const schemaX = ox + kadW/2 - schemaB/2;  // gecentreerd
    const sy = oy + CIJ_VRAAG_H + (startpijl ? CIJ_PIJL_H : 2);

    if (startpijl) {
      // Pijl boven t-kolom
      const pijlX = schemaX + 2*c + kW + c/2;
      doc.setFillColor(255,165,0);
      doc.setDrawColor(255,165,0);
      // Staaltje
      doc.rect(pijlX-1, oy+CIJ_VRAAG_H+1, 2, 4, 'F');
      // Driehoek
      doc.triangle(pijlX-3.5, oy+CIJ_VRAAG_H+5, pijlX+3.5, oy+CIJ_VRAAG_H+5, pijlX, oy+CIJ_VRAAG_H+9, 'F');
    }

    // Operator links van g2-rij
    // Operator links van de onderste dikke lijn
doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.setTextColor(30,30,30);
doc.text(oef.operator === '−' ? '-' : '+', schemaX - 4, sy + (4 * c) - 2);

    // Helperfuncties cellen
    const klT = [34, 139, 34];   // groen (T)
    const klE = [240, 200, 0];   // geel (E)
    const klK = [180, 180, 180]; // grijs (komma)
    const klt = [220, 165, 0];   // donkerder geel (t)

    function hdr(x, y2, tekst, bg, fg) {
      doc.setFillColor(...bg); doc.setDrawColor(...bg); doc.setLineWidth(0.3);
      doc.rect(x, y2, x===schemaX+2*c ? kW : c, c, 'FD');
      doc.setFontSize(9); doc.setFont('helvetica','bold');
      doc.setTextColor(...(fg||[255,255,255]));
      const breedte = (x === schemaX+2*c) ? kW : c;
      doc.text(tekst, x+breedte/2, y2+c-2.5, {align:'center'});
    }

    function cel(x, y2, tekst, breedte, dikBoven) {
      const b = breedte || c;
      doc.setFillColor(255,255,255); doc.setDrawColor(180,180,180); doc.setLineWidth(0.35);
      doc.rect(x, y2, b, c, 'FD');
      if (dikBoven) { doc.setDrawColor(30,30,30); doc.setLineWidth(0.9); doc.line(x, y2, x+b, y2); }
      if (tekst !== null && tekst !== undefined && String(tekst) !== '') {
        doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(30,30,30);
        doc.text(String(tekst), x+b/2, y2+c-2.5, {align:'center'});
      }
    }

    function kommacel(x, y2, bg) {
      doc.setFillColor(...(bg||[220,220,220]));
      doc.setDrawColor(180,180,180); doc.setLineWidth(0.35);
      doc.rect(x, y2, kW, c, 'FD');
      doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(80,80,80);
      doc.text(',', x+kW/2, y2+c-2.5, {align:'center'});
    }
function kommavakLeeg(x, y2, bg) {
  doc.setFillColor(...(bg || [220,220,220]));
  doc.setDrawColor(180,180,180);
  doc.setLineWidth(0.35);
  doc.rect(x, y2, kW, c, 'FD');
}
    // Header rij
    hdr(schemaX,          sy, 'T', klT);
    hdr(schemaX+c,        sy, 'E', klE, [50,50,50]);
    hdr(schemaX+2*c,      sy, ',', klK, [100,100,100]);
    hdr(schemaX+2*c+kW,   sy, 't', klt, [50,50,50]);

  // Onthoud-rij: even hoog als de gewone cellen
const onthoudH = c;
    function onthoudCel(x, breedte) {
      doc.setFillColor(230,230,230); doc.setDrawColor(200,200,200); doc.setLineWidth(0.3);
      doc.rect(x, sy+c, breedte||c, onthoudH, 'FD');
    }
    onthoudCel(schemaX,        c);
    onthoudCel(schemaX+c,      c);
    onthoudCel(schemaX+2*c,    kW);
    onthoudCel(schemaX+2*c+kW, c);

    // g1 rij (start na onthoud-rij)
    const r1y = sy + c + onthoudH;
    cel(schemaX,          r1y, ingevuld ? (oef.g1E >= 10 ? String(Math.floor(oef.g1E/10)) : '') : null);
  cel(schemaX+c, r1y, ingevuld ? oef.g1E % 10 : null);

if (ingevuld) {
  kommacel(schemaX+2*c, r1y);
} else {
  kommavakLeeg(schemaX+2*c, r1y, [220,220,220]);
}

cel(schemaX+2*c+kW, r1y, ingevuld ? oef.g1t_ : null);

    // g2 rij
    const r2y = r1y + c;
    cel(schemaX,          r2y, ingevuld ? (oef.g2E >= 10 ? String(Math.floor(oef.g2E/10)) : '') : null);
    cel(schemaX+c, r2y, ingevuld ? oef.g2E % 10 : null);

if (ingevuld) {
  kommacel(schemaX+2*c, r2y);
} else {
  kommavakLeeg(schemaX+2*c, r2y, [220,220,220]);
}

cel(schemaX+2*c+kW, r2y, ingevuld ? oef.g2t_ : null);

    // Oplossingsrij: dikke bovenlijn, 1 lege rij
    const r3y = r2y + c;
    cel(schemaX,          r3y, null, c, true);
    cel(schemaX+c,        r3y, null, c, true);
   if (ingevuld) {
  kommacel(schemaX+2*c, r3y, [200,200,200]);
} else {
  kommavakLeeg(schemaX+2*c, r3y, [200,200,200]);
}
    cel(schemaX+2*c+kW,   r3y, null, c, true);
  }


  /* ══════════════════════════════════════════════════════════════
     STAARTDELING — PDF functies
     ══════════════════════════════════════════════════════════════ */
  const DEEL_CEL   = 10;   // celbreedte/-hoogte in mm
  const DEEL_NRIJ  = 8;    // 8 rijen: header + 7 data
  const DEEL_KAD_H = DEEL_NRIJ * DEEL_CEL + 14;  // hoogte kaart (schema + vraag)
  const DEEL_KAD_W_BASIS = 3 * DEEL_CEL + 20;    // 2 TE-kolommen + deler-tekst + quotiënt-TE

  function _tekenDeelBlok(blok) {
    const cfg      = blok.config || {};
    const ingevuld = cfg.invulling === 'ingevuld';
    const aantalKol = 3;
    const kolB      = CW / aantalKol;
    const kadW      = kolB - 4;
    const kadH      = DEEL_KAD_H;
    const rijH      = kadH + 6;
    const aantalRijen = Math.ceil(blok.oefeningen.length / aantalKol);

    checkRuimte(VOOR_ZIN + aantalKol + rijH + 4);
    y += VOOR_ZIN;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text(blok.opdrachtzin, ML, y);
    y += 6;

    for (let rij = 0; rij < aantalRijen; rij++) {
      checkRuimte(rijH);
      const rijOef = blok.oefeningen.slice(rij * aantalKol, (rij + 1) * aantalKol);
      for (let k = 0; k < rijOef.length; k++) {
        const ox  = ML + k * kolB + 2;
        _tekenDeelKaart(rijOef[k], ox, y, kadW, kadH, ingevuld);
      }
      y += rijH;
    }
    lijn(ML, y - 4, ML + CW, y - 4, [210, 220, 230], 0.4);
  }

  function _tekenDeelKaart(oef, ox, oy, kadW, kadH, ingevuld) {
    const c = DEEL_CEL;

    // Kader
    doc.setDrawColor(180,180,180); doc.setLineWidth(0.4);
    doc.setFillColor(255,255,255);
    doc.roundedRect(ox, oy, kadW, kadH, 2, 2, 'FD');

    // Vraag: deeltal : deler = ___ (R ___)
    doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(30,30,30);
    let lx = ox + 4;
    const vraagTxt = oef.deeltal + ' : ' + oef.deler + ' =';
    doc.text(vraagTxt, lx, oy + 6.5);
    lx += doc.getTextWidth(vraagTxt) + 2;
    doc.setDrawColor(50,50,50); doc.setLineWidth(0.5);
    doc.line(lx, oy+6.7, lx+12, oy+6.7);
    if (oef.restE > 0) {
      lx += 14;
      doc.text('R', lx, oy+6.5);
      lx += doc.getTextWidth('R') + 2;
      doc.line(lx, oy+6.7, lx+10, oy+6.7);
    }

    const sy = oy + 11;   // schema start Y
    const sx = ox + 9;    // ruimte voor minteken links
    const klT = [39,174,96], klE = [241,196,15];

    function cel(x, y2, tekst, bg, fg, dikBoven) {
      doc.setFillColor(...(bg||[255,255,255]));
      doc.setDrawColor(180,180,180); doc.setLineWidth(0.4);
      doc.rect(x, y2, c, c, 'FD');
      if (dikBoven) {
        doc.setDrawColor(30,30,30); doc.setLineWidth(1.4);
        doc.line(x, y2, x+c, y2);
      }
      if (tekst !== null && tekst !== undefined && String(tekst) !== '') {
        doc.setFontSize(10); doc.setFont('helvetica','bold');
        doc.setTextColor(...(fg||[30,30,30]));
        doc.text(String(tekst), x+c/2, y2+c-2.5, {align:'center'});
      }
    }

    // Minteken: net BOVEN de dikke lijn (= onderkant vorige rij)
    function minteken(x, y2) {
      doc.setFontSize(11); doc.setFont('helvetica','bold');
      doc.setTextColor(30,30,30);
      // y2 is TOP van de aftrekrij, minteken staat net erboven
      doc.text('-', x-5.5, y2 - 1);
    }

    // Rij 0: header T|E
    cel(sx,   sy,     'T', klT, [255,255,255]);
    cel(sx+c, sy,     'E', klE, [50,50,50]);

    // Rij 1: deeltal (ingevuld indien iv)
    cel(sx,   sy+1*c, ingevuld ? oef.T : null);
    cel(sx+c, sy+1*c, ingevuld ? oef.E : null);

    // Rij 2: leeg
    cel(sx,   sy+2*c, null);
    cel(sx+c, sy+2*c, null);

    // Rij 3: dikke lijn + MIN boven die lijn
    minteken(sx, sy+3*c);
    cel(sx,   sy+3*c, null, null, null, true);
    cel(sx+c, sy+3*c, null, null, null, true);

    // Rij 4: leeg
    cel(sx,   sy+4*c, null);
    cel(sx+c, sy+4*c, null);

    // Rij 5: leeg
    cel(sx,   sy+5*c, null);
    cel(sx+c, sy+5*c, null);

    // Rij 6: dikke lijn + MIN boven die lijn
    minteken(sx, sy+6*c);
    cel(sx,   sy+6*c, null, null, null, true);
    cel(sx+c, sy+6*c, null, null, null, true);

    // Rij 7: eindrest
    cel(sx,   sy+7*c, null);
    cel(sx+c, sy+7*c, null);

    // Verticale dikke lijn rechts van linkerschema (van header t.e.m. rij 7)
    const vlx = sx + 2*c + 1.5;
    doc.setDrawColor(30,30,30); doc.setLineWidth(1.4);
    doc.line(vlx, sy, vlx, sy+8*c);

    // Rechterschema: schrijflijn op hoogte rij 1 (= deeltal), TE-header op rij 2
    const qx = vlx + 2;
    const slY = sy + 1*c;  // hoogte van deeltal-rij = schrijflijn-rij
    const qy  = sy + 2*c;  // TE-header van rechterschema (1 rij onder schrijflijn)

    // Schrijflijn onderaan rij 1 (deler op zelfde hoogte als deeltal)
    doc.setDrawColor(160,160,160); doc.setLineWidth(0.5);
    doc.line(qx, slY + c - 1, qx + 2*c, slY + c - 1);

    // Deler op schrijflijn indien ingevuld
    if (ingevuld) {
      doc.setFontSize(10); doc.setFont('helvetica','bold');
      doc.setTextColor(30,30,30);
      doc.text(String(oef.deler), qx + c, slY + c - 3, { align: 'center' });
    }

    // Dikke bovenlijn van rechterschema + header T|E
    doc.setDrawColor(30,30,30); doc.setLineWidth(1.4);
    doc.line(qx, qy, qx+2*c, qy);
    cel(qx,   qy,   'T', klT, [255,255,255]);
    cel(qx+c, qy,   'E', klE, [50,50,50]);

    // 1 datarij leeg
    cel(qx,   qy+c, null);
    cel(qx+c, qy+c, null);
  }

 async function _tekenBlok(blok) {
  if (blok.bewerking === 'schatten')                                          { _tekenSchattenBlok(blok); return; }
  if (blok.bewerking === 'vraagstukken')                              { _tekenVraagstukBlok(blok); return; }
  if (blok.bewerking === 'rekentaal')                                  { _tekenRekentaalBlok(blok); return; }
  if (blok.bewerking === 'cijferen' && blok.config?.bewerking === 'komma')  { _tekenKommaBlok(blok); return; }
  if (blok.bewerking === 'cijferen' && blok.config?.bewerking === 'delen')  { _tekenDeelBlok(blok); return; }
  if (blok.bewerking === 'cijferen') { _tekenCijferenBlok(blok); return; }
  if (blok.bewerking === 'herken-brug')     { await _tekenHerkenBlok(blok); return; }
  if (blok.bewerking === 'splitsingen')     { _tekenSplitsingenBlok(blok); return; }
  if (blok.bewerking === 'tafels')          { _tekenTafelsBlok(blok); return; }
  if (blok.bewerking === 'tafels-inzicht')  { _tekenInzichtBlok(blok); return; }
  if (blok.bewerking === 'tafels-getallenlijn') { _tekenGetallenlijnBlok(blok); return; }
  if (blok.hulpmiddelen?.includes('aanvullen')) { _tekenAanvullenBlok(blok); return; }
  if (blok.hulpmiddelen?.includes('compenseren')) { _tekenCompenserenBlok(blok); return; }
  if (blok.hulpmiddelen?.includes('transformeren')) { _tekenTransformerenBlok(blok); return; }

  // Maak eerst 10: blok bevat drieTermen-oefeningen
  if (blok.oefeningen.length > 0 && blok.oefeningen[0].drieTermen) {
    _tekenEerst10Blok(blok);
    return;
  }

  const isTot1000 = blok.niveau >= 1000;
  const _kolommen = isTot1000 ? 3 : KOLOMMEN;

  const heeftSplits = blok.hulpmiddelen?.includes('splitsbeen');
  const heeftLijnen = blok.hulpmiddelen?.includes('schrijflijnen');
  const schrijflijnenAantal = blok.schrijflijnenAantal || 2;
  const heeftHulp = heeftSplits || heeftLijnen;

  const rijGrootte = heeftHulp ? 2 : _kolommen;
  const aantalRijen = Math.ceil(blok.oefeningen.length / rijGrootte);
  const rijH = heeftHulp ? (_hulpKadH(schrijflijnenAantal) + 6) : (RIJHOOGTE + RIJ_GAP);

  checkRuimte(VOOR_ZIN + ZINRUIMTE + rijH + 4);

  y += VOOR_ZIN;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(26, 58, 92);
  doc.text(blok.opdrachtzin, ML, y);
  y += ZINRUIMTE;

  for (let rij = 0; rij < aantalRijen; rij++) {
    if (rij > 0) checkRuimte(rijH);
    const rijOef = blok.oefeningen.slice(rij * rijGrootte, (rij + 1) * rijGrootte);
    if (heeftHulp) {
      _tekenHulpRij(
  rijOef,
  heeftSplits,
  heeftLijnen,
  blok.bewerking,
  blok.splitspositie || 'aftrekker',
  schrijflijnenAantal,
  blok.brug || 'zonder',
  blok.niveau || 100
);
    } else {
      _tekenRij(rijOef, _kolommen);
    }
  }

  y += NABLOK;
  lijn(ML, y - 4, ML + CW, y - 4, [210,220,230], 0.4);
}

  /* ── Maak eerst 10: 3-termen optellen/aftrekken ─────────── */
  // 3 kolommen (tekst is breder), optioneel geel voorbeeldkader
  const EERST10_KOLOMMEN = 3;

  function _tekenEerst10Blok(blok) {
    const metVoorbeeld = blok.metVoorbeeld || false;
    const aantalKol    = EERST10_KOLOMMEN;
    const rijH         = RIJHOOGTE + RIJ_GAP;
    const aantalRijen  = Math.ceil(blok.oefeningen.length / aantalKol);

    checkRuimte(VOOR_ZIN + ZINRUIMTE + rijH + 4);

    y += VOOR_ZIN;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(26, 58, 92);
    doc.text(blok.opdrachtzin, ML, y);
    y += ZINRUIMTE;

    for (let rij = 0; rij < aantalRijen; rij++) {
      if (rij > 0) checkRuimte(rijH);
      const rijOef = blok.oefeningen.slice(rij * aantalKol, (rij + 1) * aantalKol);
      _tekenEerst10Rij(rijOef, aantalKol, metVoorbeeld, rij);
    }

    y += NABLOK;
    lijn(ML, y - 4, ML + CW, y - 4, [210, 220, 230], 0.4);
  }

  function _tekenEerst10Rij(oefeningen, aantalKolommen, metVoorbeeld, rijNr) {
    const kolB = CW / aantalKolommen;
    const kadW = kolB - 4;
    const kadH = RIJHOOGTE - 1;

    oefeningen.forEach((oef, kol) => {
      const globaleIdx = rijNr * aantalKolommen + kol;
      const isVoorbeeld = metVoorbeeld && globaleIdx === 0;

      const ox = ML + kol * kolB + 2;
      const oy = y;

      // Kader: geel bij voorbeeld, wit anders
      if (isVoorbeeld || _metAntwoorden) {
        doc.setFillColor(255, 243, 205);   // #FFF3CD
        doc.setDrawColor(240, 165, 0);     // #F0A500
      } else {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(180, 200, 225);
      }
      doc.setLineWidth(isVoorbeeld ? 0.8 : 0.6);
      doc.roundedRect(ox, oy, kadW, kadH, 1.5, 1.5, 'FD');

      // Tekst van de som
      doc.setFont('helvetica', isVoorbeeld ? 'bold' : 'normal');
      doc.setFontSize(12);
      doc.setTextColor(44, 62, 80);
      doc.text(oef.vraag, ox + 3, oy + kadH / 2 + 2);

      // Antwoordvak
      const vakW = 16, vakH = kadH - 5;
      const tekstB = doc.getTextWidth(oef.vraag);
      const vakX = ox + 3 + tekstB + 2;
      const vakY = oy + (kadH - vakH) / 2;

      if (isVoorbeeld || _metAntwoorden) {
        // Antwoordvak geel ingevuld met antwoord (voorbeeld)
        doc.setFillColor(255, 224, 130);
        doc.setDrawColor(240, 165, 0);
        doc.setLineWidth(0.8);
        doc.roundedRect(vakX, vakY, vakW, vakH, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(93, 58, 0);
        doc.text(String(oef.antwoord), vakX + vakW / 2, vakY + vakH / 2 + 1.5, { align: 'center' });
      } else {
        _antwoordVak(vakX, vakY, vakW, vakH, oef.antwoord);
      }
    });

    y += RIJHOOGTE + RIJ_GAP;
  }

  /* ── Transformeren (optellingswip) PDF-renderer ──────────── */
  function _tekenTransformerenBlok(blok) {
    const variant      = blok.transformerenVariant || 'schema';
    const metVb        = blok.metVoorbeeld !== false;

    // Kader hoogte per variant
    const SCHEMA_H = 62;
    const PIJL_H   = 44;
    const KAAL_H   = 16;
    const KADH     = variant === 'kaal' ? KAAL_H : variant === 'schema' ? SCHEMA_H : PIJL_H;
    const RIJ_H    = KADH + 8;
    const kolB     = CW / 2;
    const kadW     = kolB - 6;
    const mg       = 4;

    const aantalRijen = Math.ceil(blok.oefeningen.length / 2);
    checkRuimte(ZINRUIMTE + RIJ_H + 4);

    y += VOOR_ZIN;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(26, 58, 92);
    doc.text(blok.opdrachtzin, ML, y);
    y += ZINRUIMTE;

    for (let rij = 0; rij < aantalRijen; rij++) {
      if (rij > 0) checkRuimte(RIJ_H);
      const rijOef = blok.oefeningen.slice(rij * 2, (rij + 1) * 2);

      rijOef.forEach((oef, kol) => {
        const isVbStijl = metVb && rij === 0 && kol === 0;  // voor gele achtergrond
        const isVb     = isVbStijl || _metAntwoorden;  // voor data tonen
        const oy       = y;
        const ox       = ML + kol * kolB + 3;
        const isAftrek = blok.bewerking === 'aftrekken';
        const tg       = oef.transformeerGetal;
        const ag       = oef.andereGetal;
        const d        = oef.transformeerDelta;
        const tgT      = tg + d;
        const agT      = isAftrek ? ag + d : ag - d;
        const som      = oef.antwoord;
        const bTeken   = isAftrek ? '-' : '+';
        // Volg de volgorde van de vraag
        // Bij aftrekken: grootste getal altijd links (= aftrektal)
        const grootsteLinks = isAftrek ? Math.max(tg, ag) === tg : oef.vraag.trim().startsWith(String(tg));
        const links    = grootsteLinks ? tg  : ag;
        const rechts   = grootsteLinks ? ag  : tg;
        const linksT   = grootsteLinks ? tgT : agT;
        const rechtsT  = grootsteLinks ? agT : tgT;

        // Kader
        doc.setFillColor(isVbStijl ? 255 : 255, isVbStijl ? 248 : 255, isVbStijl ? 220 : 255);
        doc.setDrawColor(isVbStijl ? 240 : 180, isVbStijl ? 192 : 200, isVbStijl ? 80 : 225);
        doc.setLineWidth(isVbStijl ? 1 : 0.5);
        doc.roundedRect(ox, oy, kadW, KADH, 2, 2, 'FD');

        // ── KAAL ─────────────────────────────────────────────
        if (variant === 'kaal') {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(12);
          doc.setTextColor(44, 62, 80);
          const somY = oy + 10;
          if (isVb) {
            const s1 = `${links}  ${bTeken}  ${rechts}  =  `;
            doc.text(s1, ox + mg, somY);
            const x2 = ox + mg + doc.getTextWidth(s1);
            doc.setTextColor(42, 100, 180);
            const s2 = `${linksT} ${bTeken} ${rechtsT}`;
            doc.text(s2, x2, somY);
            doc.setTextColor(44, 62, 80);
            doc.text(`  =  ${som}`, x2 + doc.getTextWidth(s2), somY);
          } else {
            const somStr = `${links}  ${bTeken}  ${rechts}  =`;
            doc.setFontSize(12);
            doc.text(somStr, ox + mg, somY);
            const xL = ox + mg + doc.getTextWidth(somStr) + 2;
            doc.setDrawColor(180, 195, 210);
            doc.setLineWidth(0.4);
            doc.line(xL, somY, ox + kadW - mg, somY);
          }
          return;
        }

        // ── SCHEMA + PIJLTJES: gemeenschappelijke layout ─────
        // Y-startpositie voor de som-rij
        let curY = oy + mg;

        // Schema-balkjes (enkel bij 'schema')
        if (variant === 'schema') {
          const balkH    = 7;
          const gap1     = 1;
          const beschikB = kadW - mg * 2 - 2;

          if (isAftrek) {
            // Aftrekken: klein geel (absD) links + groot blauw (aftrektal) rechts
            const absD   = Math.abs(d);
            const geelW  = 18;
            const blauwW = beschikB - geelW - 2;
            const afBreed = Math.min(blauwW * 0.5, 30);
            const grBreed = blauwW - afBreed - 1;

            // Balk 1: geel(leeg/ingevuld) | blauw(aftrektal)
            doc.setFillColor(253, 230, 138);
            doc.roundedRect(ox + mg, curY, geelW, balkH, 1, 1, 'F');
            doc.setFillColor(181, 212, 244);
            doc.roundedRect(ox + mg + geelW + 2, curY, blauwW, balkH, 1, 1, 'F');
            doc.setFontSize(9); doc.setFont('helvetica', 'bold');
            if (isVb) { doc.setTextColor(120, 53, 15); doc.text(String(absD), ox+mg+geelW/2-doc.getTextWidth(String(absD))/2, curY+5.5); }
            doc.setTextColor(30, 58, 138);
            doc.text(String(links), ox+mg+geelW+2+blauwW/2-doc.getTextWidth(String(links))/2, curY+5.5);
            doc.setFont('helvetica', 'normal');
            curY += balkH + gap1;

            // Balk 2: geel(leeg/ingevuld) | blauw(aftrekker) | grijs(vraagteken)
            doc.setFillColor(253, 230, 138);
            doc.roundedRect(ox + mg, curY, geelW, balkH, 1, 1, 'F');
            doc.setFillColor(181, 212, 244);
            doc.roundedRect(ox + mg + geelW + 2, curY, afBreed, balkH, 1, 1, 'F');
            doc.setFillColor(220, 220, 220);
            doc.roundedRect(ox + mg + geelW + 2 + afBreed + 1, curY, grBreed, balkH, 1, 1, 'F');
            doc.setFontSize(9); doc.setFont('helvetica', 'bold');
            if (isVb) {
              doc.setTextColor(120, 53, 15);
              doc.text(String(absD), ox+mg+geelW/2-doc.getTextWidth(String(absD))/2, curY+5.5);
              doc.setTextColor(30, 58, 138);
              doc.text(String(rechts), ox+mg+geelW+2+afBreed/2-doc.getTextWidth(String(rechts))/2, curY+5.5);
              doc.setTextColor(30, 58, 138);
              doc.text(String(som), ox+mg+geelW+2+afBreed+1+grBreed/2-doc.getTextWidth(String(som))/2, curY+5.5);
            } else {
              doc.setTextColor(30, 58, 138);
              doc.text(String(rechts), ox+mg+geelW+2+afBreed/2-doc.getTextWidth(String(rechts))/2, curY+5.5);
              doc.setTextColor(150, 150, 150);
              doc.text('?', ox+mg+geelW+2+afBreed+1+grBreed/2-doc.getTextWidth('?')/2, curY+5.5);
            }
            doc.setFont('helvetica', 'normal');

          } else {
            // Optellen: balkjes volgen volgorde van de som (a links, b rechts)
            const aIsTg   = oef.vraag.trim().startsWith(String(tg));
            const valA1   = aIsTg ? tg  : ag;
            const valB1   = aIsTg ? ag  : tg;
            const valA2   = aIsTg ? tgT : agT;
            const valB2   = aIsTg ? agT : tgT;
            const klrA    = aIsTg ? [181,212,244] : [253,230,138];
            const klrB    = aIsTg ? [253,230,138] : [181,212,244];
            const txtKlrA = aIsTg ? [30,58,138]   : [120,53,15];
            const txtKlrB = aIsTg ? [120,53,15]   : [30,58,138];
            const scrKlrA = aIsTg ? [160,180,210] : [200,170,120];
            const scrKlrB = aIsTg ? [200,170,120] : [160,180,210];

            const pA1  = Math.min(0.80, Math.max(0.20, valA1 / (tg + ag)));
            const pA2  = Math.min(0.85, Math.max(0.15, valA2 / (tg + ag)));
            const bA1 = beschikB * pA1, bB1 = beschikB * (1 - pA1);
            doc.setFillColor(...klrA); doc.roundedRect(ox+mg, curY, bA1, balkH, 1, 1, 'F');
            doc.setFillColor(...klrB); doc.roundedRect(ox+mg+bA1+2, curY, bB1, balkH, 1, 1, 'F');
            doc.setFontSize(9); doc.setFont('helvetica', 'bold');
            doc.setTextColor(...txtKlrA);
            doc.text(String(valA1), ox+mg+bA1/2-doc.getTextWidth(String(valA1))/2, curY+5.5);
            doc.setTextColor(...txtKlrB);
            doc.text(String(valB1), ox+mg+bA1+2+bB1/2-doc.getTextWidth(String(valB1))/2, curY+5.5);
            doc.setFont('helvetica', 'normal');
            curY += balkH + gap1;

            const bA2 = beschikB * pA2, bB2 = beschikB * (1 - pA2);
            doc.setFillColor(...klrA); doc.roundedRect(ox+mg, curY, bA2, balkH, 1, 1, 'F');
            doc.setFillColor(...klrB); doc.roundedRect(ox+mg+bA2+2, curY, bB2, balkH, 1, 1, 'F');
            if (isVb) {
              doc.setFontSize(9); doc.setFont('helvetica', 'bold');
              doc.setTextColor(...txtKlrA);
              doc.text(String(valA2), ox+mg+bA2/2-doc.getTextWidth(String(valA2))/2, curY+5.5);
              doc.setTextColor(...txtKlrB);
              doc.text(String(valB2), ox+mg+bA2+2+bB2/2-doc.getTextWidth(String(valB2))/2, curY+5.5);
              doc.setFont('helvetica', 'normal');
            } else {
              doc.setDrawColor(...scrKlrA); doc.setLineWidth(0.4);
              doc.line(ox+mg+4, curY+balkH-2, ox+mg+bA2-4, curY+balkH-2);
              doc.setDrawColor(...scrKlrB);
              doc.line(ox+mg+bA2+5, curY+balkH-2, ox+mg+bA2+2+bB2-4, curY+balkH-2);
              // Oplossingssleutel: toon getransformeerde waarden
              if (_metAntwoorden) {
                doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(0,100,0);
                doc.text(String(valA2), ox+mg+bA2/2-doc.getTextWidth(String(valA2))/2, curY+balkH-3.5);
                doc.text(String(valB2), ox+mg+bA2+2+bB2/2-doc.getTextWidth(String(valB2))/2, curY+balkH-3.5);
                doc.setTextColor(44, 62, 80);
              }
            }
          }
          curY += balkH + 5;
        } else {
          curY += 4;
        }

        // Rij 1: som  tg + ag = ___  (compact, meting-gebaseerde posities)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(44, 62, 80);
        const somY = curY + 8;

        const tgStr  = String(links);
        const agStr  = String(rechts);
        const tgB    = doc.getTextWidth(tgStr);
        const agB    = doc.getTextWidth(agStr);
        const bTekenB = doc.getTextWidth(bTeken);
        const eqB    = doc.getTextWidth('=');
        const spB    = 3;

        const x_tg  = ox + mg + 6;
        const x_pl  = x_tg + tgB + spB;
        const x_ag  = x_pl + bTekenB + spB;
        const x_eq  = x_ag + agB + spB;
        const x_an  = x_eq + eqB + spB;

        doc.text(tgStr, x_tg, somY);
        doc.setFont('helvetica', 'normal');
        doc.text(bTeken, x_pl, somY);
        doc.setFont('helvetica', 'bold');
        doc.text(agStr, x_ag, somY);
        doc.setFont('helvetica', 'normal');
        doc.text('=', x_eq, somY);

        if (isVb) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(26, 58, 92);
          doc.text(String(som), x_an, somY);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(44, 62, 80);
        } else {
          doc.setDrawColor(180, 195, 210);
          doc.setLineWidth(0.4);
          doc.line(x_an, somY, Math.min(x_an + 18, ox + kadW - mg), somY);
        }

        // Rij 2: pijlen — beide teken zelfde dTxt
        const dTxtTg  = (d > 0 ? '+' : '') + d;
        const dTxtAg  = isAftrek ? dTxtTg : (d > 0 ? '-' : '+') + Math.abs(d);
        const dTxt     = dTxtTg;  // voor aftrekken
        const pijlTopY = somY + 2;
        const pijlBotY = pijlTopY + 7;
        const x_tgMid  = x_tg + tgB / 2;
        const x_agMid  = x_ag + agB / 2;
        const slLen    = 10;
        const pijlMidY = pijlTopY + (pijlBotY - pijlTopY) / 2;

        // Pijl tg — schrijflijn LINKS
        doc.setDrawColor(44, 62, 80);
        doc.setLineWidth(0.5);
        doc.line(x_tgMid, pijlTopY, x_tgMid, pijlBotY);
        doc.setFillColor(44, 62, 80);
        doc.triangle(x_tgMid, pijlBotY + 0.5, x_tgMid - 1, pijlBotY - 1, x_tgMid + 1, pijlBotY - 1, 'F');
        if (isVb) {
          doc.setFontSize(8);
          doc.setTextColor(42, 100, 180);
          doc.text(dTxt, x_tgMid - doc.getTextWidth(dTxt) - 2, pijlMidY + 1);
          doc.setTextColor(44, 62, 80);
        } else {
          doc.setDrawColor(180, 195, 210);
          doc.setLineWidth(0.4);
          doc.line(x_tgMid - 2 - slLen, pijlMidY, x_tgMid - 2, pijlMidY);
        }

        // Pijl ag — schrijflijn RECHTS
        doc.setDrawColor(44, 62, 80);
        doc.setLineWidth(0.5);
        doc.line(x_agMid, pijlTopY, x_agMid, pijlBotY);
        doc.setFillColor(44, 62, 80);
        doc.triangle(x_agMid, pijlBotY + 0.5, x_agMid - 1, pijlBotY - 1, x_agMid + 1, pijlBotY - 1, 'F');
        if (isVb) {
          doc.setFontSize(8);
          doc.setTextColor(42, 100, 180);
          doc.text(dTxtAg, x_agMid + 2, pijlMidY + 1);
          doc.setTextColor(44, 62, 80);
        } else {
          doc.setDrawColor(180, 195, 210);
          doc.setLineWidth(0.4);
          doc.line(x_agMid + 2, pijlMidY, x_agMid + 2 + slLen, pijlMidY);
        }

        // Rij 3: getransformeerde som
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        const rij3Y = pijlBotY + 7;

        doc.text(bTeken, x_pl, rij3Y);
        doc.text('=', x_eq, rij3Y);

        if (isVb) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(44, 62, 80);
          doc.text(String(tgT), x_tg, rij3Y);
          doc.text(String(agT), x_ag, rij3Y);
          doc.text(String(som),  x_an, rij3Y);
          doc.setFont('helvetica', 'normal');
        } else {
          doc.setDrawColor(180, 195, 210);
          doc.setLineWidth(0.4);
          // Schrijflijn 1: eindigt net voor het - teken
          doc.line(x_tg - 2, rij3Y, x_pl - 2, rij3Y);
          // Schrijflijn 2: start net na het - teken, eindigt net voor het =
          doc.line(x_ag - 2, rij3Y, x_eq - 2, rij3Y);
          // Schrijflijn 3: start na het =
          doc.line(x_an, rij3Y, Math.min(x_an + 18, ox + kadW - mg), rij3Y);
        }
        doc.setTextColor(44, 62, 80);
      });

      y += RIJ_H;
    }
  }


  function _tekenAanvullenBlok(blok) {
    const variant     = blok.aanvullenVariant || 'zonder-schema';
    const aantalKol   = variant === 'met-schijfjes' ? AANV_KOLOMMEN_SCHIJF : AANV_KOLOMMEN;
    const kadH        = _aanvulKadH(variant, blok?.niveau || 100);
    const rijH        = kadH + 5;
    const aantalRijen = Math.ceil(blok.oefeningen.length / aantalKol);
   checkRuimte(ZINRUIMTE + rijH + 4);

    y += VOOR_ZIN;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
doc.setTextColor(26, 58, 92);
    doc.text(blok.opdrachtzin, ML, y);
    y += ZINRUIMTE;

    for (let rij = 0; rij < aantalRijen; rij++) {
      if (rij > 0) checkRuimte(rijH);
      const rijOef = blok.oefeningen.slice(rij * aantalKol, (rij + 1) * aantalKol);
      _tekenAanvullenRij(rijOef, variant, blok.niveau || 100);
    }
    y += NABLOK;
    lijn(ML, y - 4, ML + CW, y - 4, [210,220,230], 0.4);
  }

  function _wachtOpLamp(timeout = 1500) {
  return new Promise(resolve => {
    const kandidaten = Array.from(document.querySelectorAll('.zisa-lamp'));
    const img = kandidaten.find(el => el.complete && el.naturalWidth > 0) || kandidaten[0] || null;

    if (!img) {
      resolve(null);
      return;
    }

    if (img.complete && img.naturalWidth > 0) {
      resolve(img);
      return;
    }

    let klaar = false;

    const done = () => {
      if (klaar) return;
      klaar = true;
      resolve(img.complete && img.naturalWidth > 0 ? img : null);
    };

    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', () => resolve(null), { once: true });

    setTimeout(done, timeout);
  });
}
  /* ── Lampje base64 ophalen ───────────────────────────────── */
 async function _getLamp() {
  if (_lampBase64Cache) return _lampBase64Cache;

  const img = await _wachtOpLamp();
  if (!img) return null;

  try {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;

    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);

    _lampBase64Cache = c.toDataURL('image/png');
    return _lampBase64Cache;
  } catch (e) {
    return null;
  }
}

  /* ── Herken-brug blok ────────────────────────────────────── */
  async function _tekenHerkenBlok(blok) {
    const aantalRijen = Math.ceil(blok.oefeningen.length / KOLOMMEN);
   const lamp = await _getLamp();
    checkRuimte(HRK_MIN);

    y += VOOR_ZIN;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
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

      // ── Detecteer brug ───────────────────────────────────
      const _hDelen = oef.vraag.replace(' =','').split(' ');
      const _hg1 = parseInt(_hDelen[0]), _hop = _hDelen[1], _hg2 = parseInt(_hDelen[2]);
      const _heeftBrug = _hop === '+' ? ((_hg1%10+_hg2%10)>=10 && (_hg1+_hg2)%10!==0) : (_hg1%10!==0 && _hg1%10<_hg2%10 && (_hg1-_hg2)%10!==0);

      // ── Buitenkader (één geheel per oefening) ────────────
      if (_metAntwoorden && _heeftBrug) {
        doc.setFillColor(198, 239, 206);
        doc.setDrawColor(0, 150, 50);
      } else {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(26, 58, 92);
      }
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

      // ── Antwoord in invulvakje bij oplossingssleutel ──────
      if (_metAntwoorden && oef.antwoord !== undefined) {
        doc.setFillColor(198, 239, 206);
        doc.roundedRect(vakX, vakY, vakW, vakH, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(0, 100, 0);
        const antStr = String(oef.antwoord);
        doc.text(antStr, vakX + vakW/2 - doc.getTextWidth(antStr)/2, vakY + 5.5);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
      }
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
    y += VOOR_ZIN;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
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
    if (oef.totaal !== null || _metAntwoorden) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
      if (_metAntwoorden && oef.totaal === null) {
        doc.setTextColor(0, 100, 0);
      } else {
        doc.setTextColor(26, 58, 92);
      }
      if (oef.totaal !== null) doc.text(String(oef.totaal), midX, dakMidY + 2, { align: 'center' });
    }
    // leeg → niets tekenen (tenzij antwoorden-modus)

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

    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    if (oef.links !== null) {
      doc.setTextColor(26, 58, 92);
      doc.text(String(oef.links), kamLinksX, kamMidY, { align: 'center' });
    } else if (_metAntwoorden && oef.totaal !== null) {
      doc.setTextColor(0, 100, 0);
      doc.text(String(oef.totaal - (oef.rechts || 0)), kamLinksX, kamMidY, { align: 'center' });
    }
    if (oef.rechts !== null) {
      doc.setTextColor(26, 58, 92);
      doc.text(String(oef.rechts), kamRechtsX, kamMidY, { align: 'center' });
    } else if (_metAntwoorden && oef.totaal !== null) {
      doc.setTextColor(0, 100, 0);
      doc.text(String(oef.totaal - (oef.links || 0)), kamRechtsX, kamMidY, { align: 'center' });
    }
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

    function hokje(cx, cy, waarde, antw) {
      const toonAntw = _metAntwoorden && waarde === null && antw !== undefined && antw !== null;
      doc.setFillColor(toonAntw ? 198 : 255, toonAntw ? 239 : 255, toonAntw ? 206 : 255);
      doc.setDrawColor(toonAntw ? 0 : 26, toonAntw ? 150 : 58, toonAntw ? 50 : 92);
      doc.setLineWidth(0.5);
      doc.roundedRect(cx - vakW / 2, cy, vakW, vakH, 1.5, 1.5, 'FD');
      const toonWaarde = waarde !== null ? waarde : (toonAntw ? antw : null);
      if (toonWaarde !== null) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(toonAntw ? 0 : 26, toonAntw ? 100 : 58, toonAntw ? 0 : 92);
        doc.text(String(toonWaarde), cx, cy + vakH / 2 + 2.3, { align: 'center' });
        doc.setTextColor(26, 58, 92);
      }
    }

    // Bereken ontbrekende waarden voor oplossingssleutel
    const _totaalAntw  = oef.totaal  !== null ? oef.totaal  : (oef.links !== null && oef.rechts !== null ? oef.links + oef.rechts : null);
    const _linksAntw   = oef.links   !== null ? oef.links   : (oef.totaal !== null && oef.rechts !== null ? oef.totaal - oef.rechts : null);
    const _rechtsAntw  = oef.rechts  !== null ? oef.rechts  : (oef.totaal !== null && oef.links  !== null ? oef.totaal - oef.links  : null);

    hokje(midX,   topY, oef.totaal, _totaalAntw);
    doc.setDrawColor(...BLAUW);
    doc.setLineWidth(0.6);
    doc.line(midX, beenY1, linksX,  beenY2);
    doc.line(midX, beenY1, rechtsX, beenY2);
    hokje(linksX,  vakY, oef.links,  _linksAntw);
    hokje(rechtsX, vakY, oef.rechts, _rechtsAntw);
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
      const _gsLinksAntw = rij.links !== null ? rij.links : (_metAntwoorden && oef.totaal !== null && rij.rechts !== null ? oef.totaal - rij.rechts : null);
      if (_gsLinksAntw !== null) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(rij.links !== null ? 26 : 0, rij.links !== null ? 58 : 100, rij.links !== null ? 92 : 0);
        doc.text(String(_gsLinksAntw), kamLinksX, rijMidY, { align: 'center' });
      }
      // Rechts
      const _gsRechtsAntw = rij.rechts !== null ? rij.rechts : (_metAntwoorden && oef.totaal !== null && rij.links !== null ? oef.totaal - rij.links : null);
      if (_gsRechtsAntw !== null) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(rij.rechts !== null ? 26 : 0, rij.rechts !== null ? 58 : 100, rij.rechts !== null ? 92 : 0);
        doc.text(String(_gsRechtsAntw), kamRechtsX, rijMidY, { align: 'center' });
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
    // Bereken ontbrekende waarden
    const _sbL = oef.links  !== null ? oef.links  : (oef.totaal !== null && oef.rechts !== null ? oef.totaal - oef.rechts : null);
    const _sbR = oef.rechts !== null ? oef.rechts : (oef.totaal !== null && oef.links  !== null ? oef.totaal - oef.links  : null);
    const _sbT = oef.totaal !== null ? oef.totaal : (_sbL !== null && _sbR !== null ? _sbL + _sbR : null);
    // Antwoorden per rij: [vak1, vak2, uitkomst]
    const _sbwAntw = [
      [_sbL, _sbR, _sbT],   // links + rechts = totaal
      [_sbR, _sbL, _sbT],   // rechts + links = totaal
      [_sbT, _sbL, _sbR],   // totaal - links = rechts
      [_sbT, _sbR, _sbL],   // totaal - rechts = links
    ];
    const rijB   = 3 * vakB + 11;
    const startX = ox + (B - rijB) / 2;

    for (let i = 0; i < 4; i++) {
      const baseY = bewStartY + i * (SBW_BEW_H + 3) + SBW_BEW_H - 3;
      let x = startX;

      function _sbwLijn(xPos, antw) {
        if (_metAntwoorden && antw !== null && antw !== undefined) {
          doc.setDrawColor(0, 130, 50);
        } else {
          doc.setDrawColor(...DONKER);
        }
        doc.setLineWidth(0.5);
        doc.line(xPos, baseY, xPos + vakB, baseY);
        if (_metAntwoorden && antw !== null && antw !== undefined) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(0, 100, 0);
          doc.text(String(antw), xPos + vakB/2, baseY - 1, { align: 'center' });
          doc.setTextColor(...DONKER);
        }
      }

      _sbwLijn(x, _sbwAntw[i][0]);
      x += vakB + 1;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...DONKER);
      doc.text(ops[i], x + 2, baseY, { align: 'center' });
      x += 5;

      _sbwLijn(x, _sbwAntw[i][1]);
      x += vakB + 1;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...DONKER);
      doc.text('=', x + 2, baseY, { align: 'center' });
      x += 5;

      _sbwLijn(x, _sbwAntw[i][2]);
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
    const GAP_EL = 3;  // spatie tussen elementen

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...DONKER);

    const tekstY = midY + 2;

    // Meet echte breedtes via getTextWidth
    const totW = (oef.tekst || []).reduce((acc, d) => {
      if (d === null) return acc + doc.getTextWidth('00') + 4 + GAP_EL;
      return acc + doc.getTextWidth(String(d)) + GAP_EL;
    }, 0);

    // Centreren, maar minimum MARGE vanaf kaderbegrenzing
    let x = kx + Math.max(MARGE, (B - totW) / 2);

    // Bereken antwoord uit tekst
    const _pTekst = oef.tekst || [];
    const _pOp    = _pTekst.find(x => typeof x === 'string' && ['+','-','×','÷','*','/'].includes(x));
    const _pEqIdx = _pTekst.indexOf('=');
    function _pBerekenAntw(nullPos) {
      if (_pEqIdx === -1 || !_pOp) return null;
      const a = _pTekst[0], b = _pTekst[2], c = _pTekst[_pEqIdx + 1];
      if (nullPos > _pEqIdx) {
        if (_pOp === '+') return (a||0) + (b||0);
        if (_pOp === '-') return (a||0) - (b||0);
        if (_pOp === '×' || _pOp === '*') return (a||0) * (b||0);
        if (_pOp === '÷' || _pOp === '/') return (a||0) / (b||0);
      } else if (nullPos === 0) {
        if (_pOp === '+') return (c||0) - (b||0);
        if (_pOp === '-') return (c||0) + (b||0);
        if (_pOp === '×' || _pOp === '*') return (c||0) / (b||0);
        if (_pOp === '÷' || _pOp === '/') return (c||0) * (b||0);
      } else {
        if (_pOp === '+') return (c||0) - (a||0);
        if (_pOp === '-') return (a||0) - (c||0);
        if (_pOp === '×' || _pOp === '*') return (c||0) / (a||0);
        if (_pOp === '÷' || _pOp === '/') return (a||0) * (c||0);
      }
      return null;
    }
    let _pNulIdx = 0;
    _pTekst.forEach((d, _pi) => {
      if (d === null) {
        const _pAntw = _metAntwoorden ? _pBerekenAntw(_pi) : null;
        _pNulIdx++;
        const _pToon = _pAntw !== undefined && _pAntw !== null;
        doc.setFillColor(_pToon ? 198 : 255, _pToon ? 239 : 255, _pToon ? 206 : 255);
        doc.setDrawColor(...DONKER);
        doc.setLineWidth(0.5);
        const _hokB = doc.getTextWidth('00') + 4;
        doc.roundedRect(x, midY - hokjeH / 2, _hokB, hokjeH, 1, 1, 'FD');
        if (_pToon) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.setTextColor(0, 100, 0);
          const _pStr = String(_pAntw);
          doc.text(_pStr, x + _hokB/2 - doc.getTextWidth(_pStr)/2, tekstY);
          doc.setTextColor(...DONKER);
        }
        x += _hokB + GAP_EL;
      } else if (typeof d === 'string') {
        const _dW = doc.getTextWidth(d);
        doc.text(d, x, tekstY);
        x += _dW + GAP_EL;
      } else {
        const str = String(d);
        const _gW = doc.getTextWidth(str);
        doc.text(str, x, tekstY);
        x += _gW + GAP_EL;
      }
    });
  }

  /* ── Getallenlijn blok ───────────────────────────────────── */
  function _tekenGetallenlijnBlok(blok) {
    const ZINR    = ZINRUIMTE;
    const OEF_GAP = 6;

    // Bereken hoogte van één oefening
 function oefHoogte(oef) {
 if (oef.variant === 'getekend') return 72;
 if (oef.variant === 'delen-getekend') return 96;
 if (oef.variant === 'delen-rest-getekend') return 90;
 if (oef.variant === 'delen-zelf') return 64;
 if (oef.variant === 'delen-rest-zelf') return 72;
 return 36;
}

    checkRuimte(ZINR + oefHoogte(blok.oefeningen[0]) + OEF_GAP);

    y += VOOR_ZIN;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
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
  const { groepen, stap, uitkomst, variant, positie } = oef;
  const max = Math.max(uitkomst, 20);

  const ox   = ML + 2;
  const oy   = y;
  const oefW = CW - 4;

  // buitenkader
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.roundedRect(ox, oy, oefW, oh, 3, 3, 'FD');

  const PAD          = 5;
  const KADERBLAUW   = [133, 176, 198];
  const TEKSTDONKER  = [40, 40, 40];
  const LIJNGRIJS    = [70, 70, 70];
  const INVULGRIJS   = [110, 110, 110];

  const lijnX1 = ox + PAD;
  const lijnX2 = ox + oefW - PAD - 10;   // extra ruimte voor pijl
  const vakjeW = (lijnX2 - lijnX1) / (max + 1);
  const vakjeH = 6.8;
  const vakjeY = oy + 12;
  const asY    = vakjeY + vakjeH + 2.2;

  function middenVanGetal(n) {
  return lijnX1 + n * vakjeW + vakjeBinnenW / 2;
}

  function tekenBoog(x1, x2, yBasis, hoogte, omlaag = false) {
    const stappen = 32;
    let prevX = x1;
    let prevY = yBasis;

    doc.setDrawColor(...LIJNGRIJS);
    doc.setLineWidth(0.45);

    for (let i = 1; i <= stappen; i++) {
      const t = i / stappen;
      const x = x1 + (x2 - x1) * t;
      const y = omlaag
        ? yBasis + Math.sin(Math.PI * t) * hoogte
        : yBasis - Math.sin(Math.PI * t) * hoogte;
      doc.line(prevX, prevY, x, y);
      prevX = x;
      prevY = y;
    }
  }

  // ── Getallenlijn zoals werkboekopbouw ───────────────────
  const vakjeGap = 1.2;              // kleine opening tussen de vakjes
const vakjeBinnenW = vakjeW - vakjeGap;

for (let n = 0; n <= max; n++) {
  const vx = lijnX1 + n * vakjeW;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...KADERBLAUW);
  doc.setLineWidth(0.35);
  doc.roundedRect(vx, vakjeY, vakjeBinnenW, vakjeH, 0.8, 0.8, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(max >= 20 ? 7 : 8);
  doc.setTextColor(...TEKSTDONKER);
  doc.text(String(n), vx + vakjeBinnenW / 2, vakjeY + 4.8, { align: 'center' });

  // klein verticaal verbindingsstreepje naar de getallenlijn
  const middenX = vx + vakjeBinnenW / 2;
  doc.setDrawColor(...KADERBLAUW);
  doc.setLineWidth(0.35);
  doc.line(middenX, vakjeY + vakjeH, middenX, asY);
}

  // onderlijn + duidelijke pijl
 doc.setDrawColor(...KADERBLAUW);
doc.setLineWidth(0.45);

const lijnStartX = lijnX1 + (vakjeW - vakjeGap) / 2;
const lijnEindeX = lijnX1 + max * vakjeW + (vakjeW - vakjeGap) / 2 + 4;

doc.line(lijnStartX, asY, lijnEindeX, asY);

doc.setFillColor(...KADERBLAUW);
doc.triangle(
  lijnEindeX + 2.2, asY,
  lijnEindeX - 0.8, asY - 1.7,
  lijnEindeX - 0.8, asY + 1.7,
  'F'
);

  // ── Variant met al getekende sprongen (vermenigvuldigen) ─
  if (variant === 'getekend') {
    const boogBasisY = vakjeY - 0.6;
    const boogH      = 4.6;

    for (let g = 0; g < groepen; g++) {
      const startGetal = g * stap;
      const eindGetal  = (g + 1) * stap;

      const xVan  = middenVanGetal(startGetal);
      const xNaar = middenVanGetal(eindGetal);
      const midX  = (xVan + xNaar) / 2;

      tekenBoog(xVan, xNaar, boogBasisY, boogH);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...TEKSTDONKER);
      doc.text(String(stap), midX, boogBasisY - boogH - 1.1, { align: 'center' });
    }

    // zin: Ik zie ___ sprongen van ___.
    const zinY = asY + 14;
    let zx = lijnX1;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(...TEKSTDONKER);
    doc.text('Ik zie', zx, zinY);
    zx += doc.getTextWidth('Ik zie') + 2.2;

    doc.setDrawColor(...INVULGRIJS);
    doc.setLineWidth(0.25);
    doc.line(zx, zinY + 0.6, zx + 12, zinY + 0.6);
    zx += 14;

    doc.text('sprongen van', zx, zinY);
    zx += doc.getTextWidth('sprongen van') + 2.2;

    doc.line(zx, zinY + 0.6, zx + 12, zinY + 0.6);
    zx += 13.5;

    doc.text('.', zx, zinY);

    // formules
    const LS = 12;
const LB = 14;
const LH = 14;
const BL = LH - 2;
const formY = zinY + 4;
    const fxBase = lijnX1;

    function lijnS(fx, fy) {
      doc.setDrawColor(...INVULGRIJS);
      doc.setLineWidth(0.25);
      doc.line(fx, fy + BL, fx + LS, fy + BL);
    }

    function lijnB(fx, fy) {
      doc.setDrawColor(...INVULGRIJS);
      doc.setLineWidth(0.25);
      doc.line(fx, fy + BL, fx + LB, fy + BL);
    }

    function sym(fx, fy, t) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...TEKSTDONKER);
      doc.text(t, fx, fy + BL);
    }

    // rij 1: ___ + ___ + ___ = ___
    let fx = fxBase;
    for (let g = 0; g < groepen; g++) {
      lijnS(fx, formY);
      fx += LS + 1.5;

      if (g < groepen - 1) {
        sym(fx, formY, '+');
        fx += doc.getTextWidth('+') + 2.2;
      }
    }
    sym(fx, formY, '=');
    fx += doc.getTextWidth('=') + 2.2;
    lijnB(fx, formY);

    // rij 2: ___ × ___ = ___
const tweedeRijY = formY + 12;

let fx2 = fxBase;
lijnS(fx2, tweedeRijY);
fx2 += LS + 1.5;

sym(fx2, tweedeRijY, '×');
fx2 += doc.getTextWidth('×') + 2.2;

lijnS(fx2, tweedeRijY);
fx2 += LS + 1.5;

sym(fx2, tweedeRijY, '=');
fx2 += doc.getTextWidth('=') + 2.2;

lijnB(fx2, tweedeRijY);

    return;
  }

  // ── Variant delen-getekend: bogen ONDER lijn, rechts→links ──
  if (variant === 'delen-getekend') {
    const boogBasisY = asY + 1.2;
    const boogH      = 5.5;

    for (let g = 0; g < groepen; g++) {
      const vanGetal  = uitkomst - g * stap;
      const naarGetal = uitkomst - (g + 1) * stap;
      const xVan  = middenVanGetal(vanGetal);
      const xNaar = middenVanGetal(naarGetal);
      const midX  = (xVan + xNaar) / 2;

      doc.setDrawColor(21, 101, 192); // blauw
      doc.setLineWidth(0.45);
      tekenBoog(xVan, xNaar, boogBasisY, boogH, true); // omlaag = true

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(21, 101, 192);
      doc.text(String(stap), midX, boogBasisY + boogH + 3.5, { align: 'center' });
    }

    const zinStartY = boogBasisY + boogH + 10;
    const LS = 12; const LH = 14; const BL2 = LH - 2;
    const fxBase = lijnX1;

    function lijnS2(fx, fy) {
      doc.setDrawColor(...INVULGRIJS); doc.setLineWidth(0.25);
      doc.line(fx, fy + BL2, fx + LS, fy + BL2);
    }
    function sym2(fx, fy, t, blauw) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
      doc.setTextColor(...(blauw ? [21,101,192] : TEKSTDONKER));
      doc.text(t, fx, fy + BL2);
    }
    function ital2(fx, fy, t) {
      doc.setFont('helvetica', 'italic'); doc.setFontSize(14);
      doc.setTextColor(...TEKSTDONKER);
      doc.text(t, fx, fy + BL2 - 0.5);
    }

    // Rij 1: uitkomst - ___ - ___ - ... = ___
    let fx3 = fxBase;
    sym2(fx3, zinStartY, String(uitkomst), false); doc.setFont('helvetica','bold'); doc.setFontSize(14);
    fx3 += doc.getTextWidth(String(uitkomst)) + 1;
    for (let g = 0; g < groepen; g++) {
      sym2(fx3, zinStartY, '-', true); doc.setFont('helvetica','bold'); doc.setFontSize(14);
      fx3 += doc.getTextWidth('-') + 1.5;
      lijnS2(fx3, zinStartY); fx3 += LS + 1.5;
    }
    sym2(fx3, zinStartY, '=', false); doc.setFont('helvetica','bold'); doc.setFontSize(14);
    fx3 += doc.getTextWidth('=') + 1.5;
    lijnS2(fx3, zinStartY);

    // Rij 2: "Ik kan ___ sprongen maken."
    const rij2Y = zinStartY + 12;
    let fx4 = fxBase;
    ital2(fx4, rij2Y, 'Ik kan'); doc.setFont('helvetica','italic'); doc.setFontSize(14);
    fx4 += doc.getTextWidth('Ik kan') + 2;
    lijnS2(fx4, rij2Y); fx4 += LS + 2;
    ital2(fx4, rij2Y, 'sprongen maken.');

    // Rij 3: "[stap] gaat ___ keer in [uitkomst]."
    const rij3Y = rij2Y + 12;
    let fx5 = fxBase;
    sym2(fx5, rij3Y, String(stap), false); doc.setFont('helvetica','bold'); doc.setFontSize(14);
    fx5 += doc.getTextWidth(String(stap)) + 2;
    ital2(fx5, rij3Y, 'gaat'); doc.setFont('helvetica','italic'); doc.setFontSize(14);
    fx5 += doc.getTextWidth('gaat') + 2;
    lijnS2(fx5, rij3Y); fx5 += LS + 2;
    ital2(fx5, rij3Y, 'keer in'); doc.setFont('helvetica','italic'); doc.setFontSize(14);
    fx5 += doc.getTextWidth('keer in') + 2;
    sym2(fx5, rij3Y, String(uitkomst) + '.', false);

    // Rij 4: ___ : ___ = ___
    const rij4Y = rij3Y + 12;
    let fx6 = fxBase;
    lijnS2(fx6, rij4Y); fx6 += LS + 1.5;
    sym2(fx6, rij4Y, ':', true); doc.setFont('helvetica','bold'); doc.setFontSize(14);
    fx6 += doc.getTextWidth(':') + 1.5;
    lijnS2(fx6, rij4Y); fx6 += LS + 1.5;
    sym2(fx6, rij4Y, '=', false); doc.setFont('helvetica','bold'); doc.setFontSize(14);
    fx6 += doc.getTextWidth('=') + 1.5;
    lijnS2(fx6, rij4Y);

    return;
  }

  // ── Variant delen-rest-getekend: bogen + rest-zinnen ──
  if (variant === 'delen-rest-getekend') {
    const boogBasisY = asY + 1.2;
    const boogH2     = 5.5;

    for (let g = 0; g < groepen; g++) {
      const vanGetal  = uitkomst - g * stap;
      const naarGetal = uitkomst - (g + 1) * stap;
      const xVan  = middenVanGetal(vanGetal);
      const xNaar = middenVanGetal(naarGetal);
      const midX  = (xVan + xNaar) / 2;

      doc.setDrawColor(21, 101, 192);
      doc.setLineWidth(0.45);
      tekenBoog(xVan, xNaar, boogBasisY, boogH2, true);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(21, 101, 192);
      doc.text(String(stap), midX, boogBasisY + boogH2 + 3.5, { align: 'center' });
    }

    const zinStartY  = boogBasisY + boogH2 + 10;
    const LS = 12; const LH = 14; const BL2 = LH - 2;
    const fxBase = lijnX1;

    function lijnS4(fx, fy) {
      doc.setDrawColor(...INVULGRIJS); doc.setLineWidth(0.25);
      doc.line(fx, fy + BL2, fx + LS, fy + BL2);
    }
    function sym4(fx, fy, t, oranje) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
      doc.setTextColor(...(oranje ? [230,74,25] : TEKSTDONKER));
      doc.text(t, fx, fy + BL2);
    }
    function blauw4(fx, fy, t) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
      doc.setTextColor(21, 101, 192);
      doc.text(t, fx, fy + BL2);
    }
    function ital4(fx, fy, t) {
      doc.setFont('helvetica', 'italic'); doc.setFontSize(14);
      doc.setTextColor(...TEKSTDONKER);
      doc.text(t, fx, fy + BL2 - 0.5);
    }

    // Rij 1: uitkomst - ___ - ___ - ... = ___
    let fx = fxBase;
    sym4(fx, zinStartY, String(uitkomst), false); doc.setFont('helvetica','bold'); doc.setFontSize(14);
    fx += doc.getTextWidth(String(uitkomst)) + 1;
    for (let g = 0; g < groepen; g++) {
      sym4(fx, zinStartY, '-', true); doc.setFont('helvetica','bold'); doc.setFontSize(14);
      fx += doc.getTextWidth('-') + 1.5;
      lijnS4(fx, zinStartY); fx += LS + 1.5;
    }
    sym4(fx, zinStartY, '=', false); doc.setFont('helvetica','bold'); doc.setFontSize(14);
    fx += doc.getTextWidth('=') + 1.5;
    lijnS4(fx, zinStartY);

    // Rij 2: "Ik kan ___ sprongen van [stap] maken. Dan heb ik nog ___ over."
    const rij2Y = zinStartY + 12;
    let fx2 = fxBase;
    ital4(fx2, rij2Y, 'Ik kan'); doc.setFont('helvetica','italic'); doc.setFontSize(14);
    fx2 += doc.getTextWidth('Ik kan') + 2;
    lijnS4(fx2, rij2Y); fx2 += LS + 2;
    ital4(fx2, rij2Y, 'sprongen van'); doc.setFont('helvetica','italic'); doc.setFontSize(14);
    fx2 += doc.getTextWidth('sprongen van') + 2;
    blauw4(fx2, rij2Y, String(stap)); doc.setFont('helvetica','bold'); doc.setFontSize(14);
    fx2 += doc.getTextWidth(String(stap)) + 2;
    ital4(fx2, rij2Y, 'maken. Dan heb ik nog'); doc.setFont('helvetica','italic'); doc.setFontSize(14);
    fx2 += doc.getTextWidth('maken. Dan heb ik nog') + 2;
    lijnS4(fx2, rij2Y); fx2 += LS + 2;
    ital4(fx2, rij2Y, 'over.');

    // Rij 3: ___ : ___ = ___ R ___
    const rij3Y = rij2Y + 12;
    let fx3 = fxBase;
    lijnS4(fx3, rij3Y); fx3 += LS + 1.5;
    sym4(fx3, rij3Y, ':', true); doc.setFont('helvetica','bold'); doc.setFontSize(14);
    fx3 += doc.getTextWidth(':') + 1.5;
    lijnS4(fx3, rij3Y); fx3 += LS + 1.5;
    sym4(fx3, rij3Y, '=', false); doc.setFont('helvetica','bold'); doc.setFontSize(14);
    fx3 += doc.getTextWidth('=') + 1.5;
    lijnS4(fx3, rij3Y); fx3 += LS + 1.5;
    sym4(fx3, rij3Y, 'R', false); doc.setFont('helvetica','bold'); doc.setFontSize(14);
    fx3 += doc.getTextWidth('R') + 1;
    lijnS4(fx3, rij3Y);

    return;
  }

  // ── Variant delen-zelf: aftrekrij met stap ingevuld, deelsom leeg ──
  if (variant === 'delen-zelf') {
    const formY = asY + 10;
    const LS = 12; const BL3 = 10;

    function lijnS3(fx, fy) {
      doc.setDrawColor(...INVULGRIJS); doc.setLineWidth(0.25);
      doc.line(fx, fy + BL3, fx + LS, fy + BL3);
    }
    function sym3(fx, fy, t, oranje) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
      doc.setTextColor(...(oranje ? [230,74,25] : TEKSTDONKER));
      doc.text(t, fx, fy + BL3);
    }
    function blauw3(fx, fy, t) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
      doc.setTextColor(21, 101, 192);
      doc.text(t, fx, fy + BL3);
    }

    // Rij 1: uitkomst - stap - stap - ... = ___
    let fx = lijnX1;
    sym3(fx, formY, String(uitkomst), false); doc.setFont('helvetica','bold'); doc.setFontSize(14);
    fx += doc.getTextWidth(String(uitkomst)) + 1;
    for (let g = 0; g < groepen; g++) {
      sym3(fx, formY, '-', true); doc.setFont('helvetica','bold'); doc.setFontSize(14);
      fx += doc.getTextWidth('-') + 1.5;
      blauw3(fx, formY, String(stap)); doc.setFont('helvetica','bold'); doc.setFontSize(14);
      fx += doc.getTextWidth(String(stap)) + 1.5;
    }
    sym3(fx, formY, '=', false); doc.setFont('helvetica','bold'); doc.setFontSize(14);
    fx += doc.getTextWidth('=') + 1.5;
    lijnS3(fx, formY);

    // Rij 2: ___ : ___ = ___  (volledig leeg)
    const rij2Y = formY + 12;
    let fx2 = lijnX1;
    lijnS3(fx2, rij2Y); fx2 += LS + 1.5;
    sym3(fx2, rij2Y, ':', true); doc.setFont('helvetica','bold'); doc.setFontSize(14);
    fx2 += doc.getTextWidth(':') + 1.5;
    lijnS3(fx2, rij2Y); fx2 += LS + 1.5;
    sym3(fx2, rij2Y, '=', false); doc.setFont('helvetica','bold'); doc.setFontSize(14);
    fx2 += doc.getTextWidth('=') + 1.5;
    lijnS3(fx2, rij2Y);

    return;
  }

  // ── Variant delen-rest-zelf: stap ingevuld, rest-zinnen ──
  if (variant === 'delen-rest-zelf') {
    const formY = asY + 10;
    const LS = 12; const BL5 = 10;

    function lijnS5(fx, fy) {
      doc.setDrawColor(...INVULGRIJS); doc.setLineWidth(0.25);
      doc.line(fx, fy + BL5, fx + LS, fy + BL5);
    }
    function sym5(fx, fy, t, oranje) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
      doc.setTextColor(...(oranje ? [230,74,25] : TEKSTDONKER));
      doc.text(t, fx, fy + BL5);
    }
    function blauw5(fx, fy, t) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
      doc.setTextColor(21, 101, 192);
      doc.text(t, fx, fy + BL5);
    }
    function ital5(fx, fy, t) {
      doc.setFont('helvetica', 'italic'); doc.setFontSize(14);
      doc.setTextColor(...TEKSTDONKER);
      doc.text(t, fx, fy + BL5 - 0.5);
    }

    // Rij 1: uitkomst - stap - stap - ... = ___
    let fx = lijnX1;
    sym5(fx, formY, String(uitkomst), false); doc.setFont('helvetica','bold'); doc.setFontSize(14);
    fx += doc.getTextWidth(String(uitkomst)) + 1;
    for (let g = 0; g < groepen; g++) {
      sym5(fx, formY, '-', true); doc.setFont('helvetica','bold'); doc.setFontSize(14);
      fx += doc.getTextWidth('-') + 1.5;
      blauw5(fx, formY, String(stap)); doc.setFont('helvetica','bold'); doc.setFontSize(14);
      fx += doc.getTextWidth(String(stap)) + 1.5;
    }
    sym5(fx, formY, '=', false); doc.setFont('helvetica','bold'); doc.setFontSize(14);
    fx += doc.getTextWidth('=') + 1.5;
    lijnS5(fx, formY);

    // Rij 2: "Ik kan ___ sprongen van [stap] maken. Dan heb ik nog ___ over."
    const rij2Y = formY + 12;
    let fx2 = lijnX1;
    ital5(fx2, rij2Y, 'Ik kan'); doc.setFont('helvetica','italic'); doc.setFontSize(14);
    fx2 += doc.getTextWidth('Ik kan') + 2;
    lijnS5(fx2, rij2Y); fx2 += LS + 2;
    ital5(fx2, rij2Y, 'sprongen van'); doc.setFont('helvetica','italic'); doc.setFontSize(14);
    fx2 += doc.getTextWidth('sprongen van') + 2;
    blauw5(fx2, rij2Y, String(stap)); doc.setFont('helvetica','bold'); doc.setFontSize(14);
    fx2 += doc.getTextWidth(String(stap)) + 2;
    ital5(fx2, rij2Y, 'maken. Dan heb ik nog'); doc.setFont('helvetica','italic'); doc.setFontSize(14);
    fx2 += doc.getTextWidth('maken. Dan heb ik nog') + 2;
    lijnS5(fx2, rij2Y); fx2 += LS + 2;
    ital5(fx2, rij2Y, 'over.');

    // Rij 3: ___ : ___ = ___ R ___
    const rij3Y = rij2Y + 12;
    let fx3 = lijnX1;
    lijnS5(fx3, rij3Y); fx3 += LS + 1.5;
    sym5(fx3, rij3Y, ':', true); doc.setFont('helvetica','bold'); doc.setFontSize(14);
    fx3 += doc.getTextWidth(':') + 1.5;
    lijnS5(fx3, rij3Y); fx3 += LS + 1.5;
    sym5(fx3, rij3Y, '=', false); doc.setFont('helvetica','bold'); doc.setFontSize(14);
    fx3 += doc.getTextWidth('=') + 1.5;
    lijnS5(fx3, rij3Y); fx3 += LS + 1.5;
    sym5(fx3, rij3Y, 'R', false); doc.setFont('helvetica','bold'); doc.setFontSize(14);
    fx3 += doc.getTextWidth('R') + 1;
    lijnS5(fx3, rij3Y);

    return;
  }

 // ── Variant "zelf tekenen" (vermenigvuldigen) ─────────────
// Volledig ingevulde maalsom + lange lijn voor herhaalde optelling + korte lijn voor resultaat

const formY = asY + 4;
const BL = 10;

// lange lijn laten meegroeien:
// tot 5 termen = basislengte
// vanaf meer dan 5 termen = extra lengte
const plusSlots = Math.max(groepen, 5);
const langeLijn = Math.min(72, 28 + plusSlots * 5.5);
const korteLijn = 14;

function lijnKort(fx, fy) {
  doc.setDrawColor(...INVULGRIJS);
  doc.setLineWidth(0.25);
  doc.line(fx, fy + BL, fx + korteLijn, fy + BL);
}

function lijnLang(fx, fy) {
  doc.setDrawColor(...INVULGRIJS);
  doc.setLineWidth(0.25);
  doc.line(fx, fy + BL, fx + langeLijn, fy + BL);
}

function sym(fx, fy, t) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...TEKSTDONKER);
  doc.text(t, fx, fy + BL);
}

let fx = lijnX1;

doc.setFont('helvetica', 'bold');
doc.setFontSize(14);
doc.setTextColor(...TEKSTDONKER);

// factoren volledig invullen
const factor1 = positie === 'achteraan' ? groepen : stap;
const factor2 = positie === 'achteraan' ? stap : groepen;

// Altijd volledig ingevulde maalsom:
// bv. 2 × 8 = ______ = ___
// of 8 × 2 = ______ = ___

doc.text(String(factor1), fx, formY + BL);
fx += doc.getTextWidth(String(factor1)) + 2.5;

sym(fx, formY, '×');
fx += doc.getTextWidth('×') + 2.5;

doc.text(String(factor2), fx, formY + BL);
fx += doc.getTextWidth(String(factor2)) + 3;

sym(fx, formY, '=');
fx += doc.getTextWidth('=') + 3;

lijnLang(fx, formY);
fx += langeLijn + 3;

sym(fx, formY, '=');
fx += doc.getTextWidth('=') + 3;

lijnKort(fx, formY);
}

  /* ── Publieke API ────────────────────────────────────────── */
  async function genereer(bundelData, titel, metAntw = false) {
    const { jsPDF } = window.jspdf;
    doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    _lampBase64Cache = null;
    _metAntwoorden = metAntw;
    y = MT;
    _tekenVoettekst();

    // Oplossingssleutel: andere koptekst
    if (metAntw) {
      _tekenKoptekstSleutel(titel || 'Rekenbundel');
    } else {
      _tekenKoptekst(titel || 'Rekenbundel');
    }

    for (const blok of bundelData) {
      await _tekenBlok(blok);
    }

    const bestandsnaam = (titel || 'rekenbundel').replace(/\s+/g, '-').toLowerCase();
    const suffix = metAntw ? '-oplossingssleutel' : '';
    doc.save(`${bestandsnaam}${suffix}.pdf`);
  }

  function _tekenKoptekstSleutel(titel) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text('Oplossingssleutel', ML, y);
    y += 7;
    lijn(ML, y, ML + CW, y, [200,200,200], 0.4);
    y += 9;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(0, 100, 0);
    doc.text(titel, PW / 2, y, { align: 'center' });
    y += 7;
    lijn(ML, y, ML + CW, y, [0,150,50], 1.0);
    y += 7;
    // Opmerking over tussenstappen
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    const opmTekst = '* De tussenstappen bij splitsoefeningen kunnen afwijken van de gebruikte methode in de klas.';
    const opmRegels = doc.splitTextToSize(opmTekst, CW);
    doc.text(opmRegels, ML, y);
    y += opmRegels.length * 5 + 3;
  }

  /* ── Tafels blok tekenen ─────────────────────────────────── */
  function _tekenTafelsBlok(blok) {
    const eersteType = blok.oefeningen[0]?.type;
    const isBreed    = eersteType === 'redeneren' || eersteType === 'koppel';
    const KOLS   = isBreed ? 2 : 3;
    const RH     = 20;    // rij-hoogte per oefening
    const GAP    = 4;
    const HOK_W  = isBreed ? 9 : 14;  // smal hokje voor redeneren/koppel
    const HOK_H  = 11;    // hoogte invulhokje (mm)
    const colW   = CW / KOLS;
    const rijH   = RH + GAP;

    const aantalRijen = Math.ceil(blok.oefeningen.length / KOLS);

    // Zorg dat opdrachtzin + eerste rij samen op dezelfde pagina starten
    checkRuimte(VOOR_ZIN + ZINRUIMTE + rijH + 4);

    // Opdrachtzin
    y += VOOR_ZIN;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(26, 58, 92);
    doc.text(blok.opdrachtzin, ML, y + 5);
    y += ZINRUIMTE;

    // Teken rij per rij — vanaf rij 1 mag er een paginawissel zijn
    for (let rij = 0; rij < aantalRijen; rij++) {
      if (rij > 0) checkRuimte(rijH);

      const rijOef = blok.oefeningen.slice(rij * KOLS, (rij + 1) * KOLS);

      rijOef.forEach((oef, k) => {
        const x  = ML + k * colW;
        const ry = y;

        // Kader
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.4);
        doc.roundedRect(x + 1, ry, colW - 2, RH, 2, 2, 'FD');

        // Bouw de som-onderdelen op
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(26, 58, 92);

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
        } else if (oef.type === 'redeneren') {
          // deeltal : deler = HOK , want HOK × deler = HOK  (kind vult alles in)
          delen = [`${oef.deeltal}`, ' : ', `${oef.deler}`, ' = ', 'HOK', '  , want ', 'HOK', ' × ', `${oef.deler}`, ' = ', 'HOK'];
        } else if (oef.type === 'koppel') {
          // factor1 × factor2 = HOK , dus HOK : factor2 = HOK
          delen = [`${oef.factor1}`, ' × ', `${oef.factor2}`, ' = ', 'HOK', '  , dus ', 'HOK', ' : ', `${oef.factor2}`, ' = ', 'HOK'];
        }

        // Meet totale breedte om te centreren
        let totaalB = 0;
        delen.forEach(d => { totaalB += d === 'HOK' ? HOK_W : doc.getTextWidth(d); });

        const cy    = ry + RH / 2;
        const textY = cy + 2.5;
        let curX    = x + (colW - totaalB) / 2;

        let _hokIdx = 0;
        delen.forEach(d => {
          if (d === 'HOK') {
            const hokY = cy - HOK_H / 2;
            // Bepaal antwoord voor dit hokje op basis van positie in de reeks
            let hokAntwoord;
            if (_metAntwoorden) {
              if (oef.type === 'vermenigvuldigen') hokAntwoord = oef.a * oef.b;
              else if (oef.type === 'gedeeld') hokAntwoord = oef.a / oef.b;
              else if (oef.type === 'ontbrekende-factor') hokAntwoord = oef.positie === 'links' ? oef.product / oef.b : oef.product / oef.a;
              else if (oef.type === 'redeneren') {
                // HOK0=quotient, HOK1=quotient, HOK2=deeltal
                const _rdQ = oef.deeltal / oef.deler;
                hokAntwoord = [_rdQ, _rdQ, oef.deeltal][_hokIdx] ?? _rdQ;
              }
              else if (oef.type === 'koppel') {
                // HOK0=product, HOK1=product, HOK2=factor1
                const _kpP = oef.factor1 * oef.factor2;
                hokAntwoord = [_kpP, _kpP, oef.factor1][_hokIdx] ?? _kpP;
              }
            }
            _hokIdx++;
            _antwoordVak(curX, hokY, HOK_W, HOK_H, hokAntwoord);
            curX += HOK_W;
          } else {
            doc.setTextColor(26, 58, 92);
            doc.text(d, curX, textY);
            curX += doc.getTextWidth(d);
          }
        });
      });

      y += rijH;
    }

    y += NABLOK;
  }

  /* ── Tafels inzicht blok tekenen ────────────────────────── */
  /* ── Canvas-helper: emoji → PNG data-URL (gecached) ──────── */
  const _emojiCache = {};
  function _emojiPng(emoji, px = 48) {
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
    // ── Eerlijk verdelen: eigen blok-renderer ────────────────
    const eersteType = blok.oefeningen[0]?.type || '';
    if (eersteType === 'verdelen-emoji' || eersteType === 'verdelen-splitshuis' || eersteType === 'verdelen-100veld') {
      _tekenVerdelenBlok(blok);
      return;
    }

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
  const cols   = emoKols(groepGrootte);
  const rows   = Math.ceil(groepGrootte / cols);
  const emoGap = 1;
  const emoMm  = Math.min((vakjeB - 3 - (cols - 1) * emoGap) / cols, 7.2);
  return {
    cols,
    rows,
    emoMm,
    h: Math.max(10, 2.5 + rows * emoMm + (rows - 1) * emoGap + 2.5)
  };
}

    function _oefHoogte(oef) {
      if (oef.type === 'delen-aftrekking') {
        const cols   = emoKols(oef.uitkomst);
        const rows   = Math.ceil(oef.uitkomst / cols);
        const emoMm  = Math.min(7, (linksW - OEF_PAD_H * 2) / cols);
        const linksH = rows * emoMm + (rows - 1) * 1.5;
        const rechtsH = RIJ_H * 5 + 8;
        return OEF_PAD_V * 2 + Math.max(linksH, rechtsH);
      }
      if (oef.type === 'delen-rest') {
        const cols   = emoKols(oef.uitkomst);
        const rows   = Math.ceil(oef.uitkomst / cols);
        const emoMm  = Math.min(7, (linksW - OEF_PAD_H * 2) / cols);
        const linksH = rows * emoMm + (rows - 1) * 1.5;
        const rechtsH = RIJ_H * 7 + 8; // 7 zinnen
        return OEF_PAD_V * 2 + Math.max(linksH, rechtsH);
      }
      const maxInRij = Math.min(oef.groepen, MAX_GPER_RIJ);
      const vakjeB = Math.min(24, (linksW - OEF_PAD_H * 2 - (maxInRij - 1) * VAKJE_GAP) / maxInRij);
      const { h: vH } = vakjeAfm(oef.groepGrootte, vakjeB);
      const gRijen   = Math.ceil(oef.groepen / MAX_GPER_RIJ);
      const linksH   = gRijen * vH + (gRijen - 1) * VAKJE_GAP;
      const rechtsH  = RIJ_H * 3 + 10;
      return OEF_PAD_V * 2 + Math.max(linksH, rechtsH);
    }

    checkRuimte(ZINRUIMTE + _oefHoogte(blok.oefeningen[0]) + OEF_GAP);
    y += VOOR_ZIN;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
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

      const emojiDataUrl = _emojiPng(oef.emoji, 120);

      // ── LINKS: emoji's ───────────────────────────────────
      if (oef.type === 'delen-aftrekking' || oef.type === 'delen-rest') {
        // Alle emoji's samen, geen kader, bovenaan
        const cols   = emoKols(oef.uitkomst);
        const emoMm  = Math.min(7, (linksW - OEF_PAD_H * 2) / cols);
        const startX = ox + OEF_PAD_H;
        const startY = oy + OEF_PAD_V;
        for (let i = 0; i < oef.uitkomst; i++) {
          const ec = i % cols, er = Math.floor(i / cols);
          doc.addImage(emojiDataUrl, 'PNG',
            startX + ec * (emoMm + 1.5),
            startY + er * (emoMm + 1.5),
            emoMm, emoMm);
        }
      } else {
        const maxInRij = Math.min(oef.groepen, MAX_GPER_RIJ);
        const vakjeB   = Math.min(20, (linksW - OEF_PAD_H * 2 - (maxInRij - 1) * VAKJE_GAP) / maxInRij);
        const { cols: emoKolsN, rows: emoRijenN, emoMm, h: vH } = vakjeAfm(oef.groepGrootte, vakjeB);
        const gRijen   = Math.ceil(oef.groepen / MAX_GPER_RIJ);
        const linksH   = gRijen * vH + (gRijen - 1) * VAKJE_GAP;
        const linksOY  = oy + (oh - linksH) / 2;

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
      }

      // ── RECHTS: invullijntjes ─────────────────────────────
      const lijnW = lijnBreedte(oef.groepen || oef.quotient || 3);
      const BL    = RIJ_H - 2;
      let fy      = oy + OEF_PAD_V;

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
      function blauw(tx, ty, t) {
        doc.setFont('helvetica','bold'); doc.setFontSize(FS);
        doc.setTextColor(21,101,192);
        doc.text(t, tx, ty + BL);
      }

      // ── Delen met rest ────────────────────────────────────
      if (oef.type === 'delen-rest') {
        // Zin 1: "Er zijn ___ [label]."
        let lx = rechtsX;
        italic(lx, fy, 'Er zijn'); doc.setFont('helvetica','italic'); doc.setFontSize(FS);
        lx += doc.getTextWidth('Er zijn') + 1.5;
        lijn(lx, fy, lijnW); lx += lijnW + 1.5;
        italic(lx, fy, oef.emojiLabel + '.');
        fy += RIJ_H + 1;

        // Zin 2: "Ik verdeel in groepen van [deler]."
        let lx2 = rechtsX;
        italic(lx2, fy, 'Ik verdeel in groepen van'); doc.setFont('helvetica','italic'); doc.setFontSize(FS);
        lx2 += doc.getTextWidth('Ik verdeel in groepen van') + 1.5;
        blauw(lx2, fy, String(oef.deler)); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
        lx2 += doc.getTextWidth(String(oef.deler)) + 1;
        italic(lx2, fy, '.');
        fy += RIJ_H + 1;

        // Zin 3: "[deeltal] - ___ - ___ - ... = ___"
        let lx3 = rechtsX;
        bold(lx3, fy, String(oef.deeltal), false); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
        lx3 += doc.getTextWidth(String(oef.deeltal)) + 1;
        for (let g = 0; g < oef.quotient; g++) {
          bold(lx3, fy, '-', true); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
          lx3 += doc.getTextWidth('-') + 1.5;
          lijn(lx3, fy, lijnW); lx3 += lijnW + 1.5;
        }
        bold(lx3, fy, '=', false); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
        lx3 += doc.getTextWidth('=') + 1.5;
        lijn(lx3, fy, lijnW);
        fy += RIJ_H + 1;

        // Zin 4: "Ik kan ___ groepen maken."
        let lx4 = rechtsX;
        italic(lx4, fy, 'Ik kan'); doc.setFont('helvetica','italic'); doc.setFontSize(FS);
        lx4 += doc.getTextWidth('Ik kan') + 1.5;
        lijn(lx4, fy, lijnW); lx4 += lijnW + 1.5;
        italic(lx4, fy, 'groepen maken.');
        fy += RIJ_H + 1;

        // Zin 5: "Dan heb ik nog ___ [label] over."
        let lx5 = rechtsX;
        italic(lx5, fy, 'Dan heb ik nog'); doc.setFont('helvetica','italic'); doc.setFontSize(FS);
        lx5 += doc.getTextWidth('Dan heb ik nog') + 1.5;
        lijn(lx5, fy, lijnW); lx5 += lijnW + 1.5;
        italic(lx5, fy, oef.emojiLabel + ' over.');
        fy += RIJ_H + 1;

        // Zin 6: "Dat is de rest (R)."
        italic(rechtsX, fy, 'Dat is de rest (R).');
        fy += RIJ_H + 1;

        // Zin 7: "___ : ___ = ___ R ___"
        let lx7 = rechtsX;
        lijn(lx7, fy, lijnW); lx7 += lijnW + 1;
        bold(lx7, fy, ':', true); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
        lx7 += doc.getTextWidth(':') + 1;
        lijn(lx7, fy, lijnW); lx7 += lijnW + 1;
        bold(lx7, fy, '=', false); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
        lx7 += doc.getTextWidth('=') + 1.5;
        lijn(lx7, fy, lijnW); lx7 += lijnW + 1.5;
        bold(lx7, fy, 'R', false); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
        lx7 += doc.getTextWidth('R') + 1;
        lijn(lx7, fy, lijnW);

      // ── Delen als herhaalde aftrekking ────────────────────
      } else if (oef.type === 'delen-aftrekking') {
        // Zin 1: "Er zijn ___ [label]."
        let lx1 = rechtsX;
        italic(lx1, fy, 'Er zijn'); doc.setFont('helvetica','italic'); doc.setFontSize(FS);
        lx1 += doc.getTextWidth('Er zijn') + 1.5;
        lijn(lx1, fy, lijnW); lx1 += lijnW + 1.5;
        italic(lx1, fy, oef.emojiLabel + '.');
        fy += RIJ_H + 1;

        // Zin 2: "Ik maak groepen van [groepGrootte]."
        let lx2 = rechtsX;
        italic(lx2, fy, 'Ik maak groepen van'); doc.setFont('helvetica','italic'); doc.setFontSize(FS);
        lx2 += doc.getTextWidth('Ik maak groepen van') + 1.5;
        blauw(lx2, fy, String(oef.groepGrootte)); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
        lx2 += doc.getTextWidth(String(oef.groepGrootte)) + 1;
        italic(lx2, fy, '.');
        fy += RIJ_H + 1;

        // Aftrekrij
        const minTxt = '-';
        doc.setFont('helvetica','bold'); doc.setFontSize(FS);
        const minW  = doc.getTextWidth(minTxt) + 2;
        const nulW  = doc.getTextWidth('= 0');
        const uitW  = doc.getTextWidth(String(oef.uitkomst));
        const totaalB = uitW + 1 + oef.groepen * (minW + lijnW + 1) + nulW + 2;
        const perRij = Math.max(1, Math.floor((rechtsW - uitW - 1) / (minW + lijnW + 1)));
        let g = 0, firstRij = true;
        while (g < oef.groepen) {
          let lx3 = rechtsX;
          if (firstRij) {
            bold(lx3, fy, String(oef.uitkomst), false); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
            lx3 += uitW + 1; firstRij = false;
          }
          const eindeRij = Math.min(g + perRij, oef.groepen);
          for (; g < eindeRij; g++) {
            bold(lx3, fy, minTxt, true); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
            lx3 += minW; lijn(lx3, fy, lijnW); lx3 += lijnW + 1;
          }
          if (g >= oef.groepen) {
            bold(lx3, fy, '=', false); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
            lx3 += doc.getTextWidth('=') + 1.5;
            lijn(lx3, fy, lijnW);
          }
          fy += RIJ_H + 1;
        }

        // Zin 3: "Ik kan ___ groepen maken."
        let lx4 = rechtsX;
        italic(lx4, fy, 'Ik kan'); doc.setFont('helvetica','italic'); doc.setFontSize(FS);
        lx4 += doc.getTextWidth('Ik kan') + 1.5;
        lijn(lx4, fy, lijnW); lx4 += lijnW + 1.5;
        italic(lx4, fy, 'groepen maken.');
        fy += RIJ_H + 1;

        // Deelsom
        let lx5 = rechtsX;
        lijn(lx5, fy, lijnW); lx5 += lijnW + 1;
        bold(lx5, fy, ':', true); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
        lx5 += doc.getTextWidth(':') + 1;
        blauw(lx5, fy, String(oef.groepGrootte)); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
        lx5 += doc.getTextWidth(String(oef.groepGrootte)) + 1;
        bold(lx5, fy, '=', false); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
        lx5 += doc.getTextWidth('=') + 1.5;
        lijn(lx5, fy, lijnW);

      // ── Vermenigvuldigen: 3 rijen gecentreerd ────────────
      } else {
        const rechtsH = RIJ_H * 3 + 10;
        fy = oy + (oh - rechtsH) / 2;

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

        let lx3 = rechtsX;
        lijn(lx3, fy, lijnW); lx3 += lijnW + 1;
        bold(lx3, fy, 'x', true);
        doc.setFont('helvetica','bold'); doc.setFontSize(FS);
        lx3 += doc.getTextWidth('x') + 1;
        lijn(lx3, fy, lijnW); lx3 += lijnW + 1;
        bold(lx3, fy, '=', false);
        doc.setFont('helvetica','bold'); doc.setFontSize(FS);
        lx3 += doc.getTextWidth('=') + 1.5;
        lijn(lx3, fy, lijnW);
      }

      y += oh + OEF_GAP;
    });
    y += NABLOK;
  }

  /* ── Eerlijk verdelen: dispatch vanuit _tekenInzichtBlok ─── */
  function _tekenVerdelenBlok(blok) {
    checkRuimte(ZINRUIMTE + 40);
    y += VOOR_ZIN;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(26, 58, 92);
    doc.text(blok.opdrachtzin, ML, y + 5);
    y += ZINRUIMTE;

    blok.oefeningen.forEach((oef, i) => {
      if (i > 0) { y += 6; }
      if (oef.type === 'verdelen-emoji')      _tekenVerdelenEmoji(oef);
      else if (oef.type === 'verdelen-splitshuis') _tekenVerdelenSplitshuis(oef);
      else if (oef.type === 'verdelen-100veld')    _tekenVerdelen100Veld(oef);
    });
    y += NABLOK;
  }

  /* ── Verdelen: emoji-variant ─────────────────────────────── */
  function _tekenVerdelenEmoji(oef) {
    const OEF_PAD_V  = 6;
    const OEF_PAD_H  = 5;
    const LIJN_DIKTE = 0.25;
    const LIJN_W     = 12;
    const RIJ_H      = 10;
    const FS         = 11;
    const BL         = RIJ_H - 2;
    const LINKS_FRAC = 0.38;
    const oefW       = CW - 4;
    const linksW     = oefW * LINKS_FRAC;
    const rechtsW    = oefW - linksW - 8;
    const rechtsX    = ML + 2 + linksW + 6;

    function emoKols(n) { return Math.min(5, Math.ceil(Math.sqrt(n))); }
    const cols   = emoKols(oef.totaal);
    const emoMm  = Math.min(7, (linksW - OEF_PAD_H * 2) / cols);
    const rows   = Math.ceil(oef.totaal / cols);
    const linksH = rows * emoMm + (rows - 1) * 1.5;
    const rechtsH = RIJ_H * 4 + 10;
    const oh = OEF_PAD_V * 2 + Math.max(linksH, rechtsH);

    checkRuimte(oh + 6);
    const ox = ML + 2, oy = y;
    doc.setFillColor(255,255,255);
    doc.setDrawColor(200,200,200);
    doc.setLineWidth(0.3);
    doc.roundedRect(ox, oy, oefW, oh, 3, 3, 'FD');
    doc.setDrawColor(225,225,225);
    doc.setLineWidth(0.2);
    doc.line(ox + linksW + 2, oy + OEF_PAD_V, ox + linksW + 2, oy + oh - OEF_PAD_V);

    // LINKS: alle emoji's
    const emojiDataUrl = _emojiPng(oef.emoji, 120);
    const startX = ox + OEF_PAD_H;
    const startY = oy + OEF_PAD_V;
    for (let i = 0; i < oef.totaal; i++) {
      const ec = i % cols, er = Math.floor(i / cols);
      doc.addImage(emojiDataUrl, 'PNG', startX + ec * (emoMm + 1.5), startY + er * (emoMm + 1.5), emoMm, emoMm);
    }

    // RECHTS: 4 zinnen
    function lijn(lx, ly, w) {
      doc.setDrawColor(100,100,100); doc.setLineWidth(LIJN_DIKTE);
      doc.line(lx, ly + BL, lx + w, ly + BL);
    }
    function bold(tx, ty, t, blauw) {
      doc.setFont('helvetica','bold'); doc.setFontSize(FS);
      doc.setTextColor(...(blauw ? [21,101,192] : [50,50,50]));
      doc.text(t, tx, ty + BL);
    }
    function italic(tx, ty, t) {
      doc.setFont('helvetica','italic'); doc.setFontSize(FS);
      doc.setTextColor(70,70,70);
      doc.text(t, tx, ty + BL - 0.5);
    }

    let fy = oy + OEF_PAD_V;

    // Zin 1: [totaal] eerlijk verdelen in [aantalGroepen] is ___.
    let lx = rechtsX;
    bold(lx, fy, String(oef.totaal), true); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
    lx += doc.getTextWidth(String(oef.totaal)) + 1.5;
    italic(lx, fy, 'eerlijk verdelen in'); doc.setFont('helvetica','italic'); doc.setFontSize(FS);
    lx += doc.getTextWidth('eerlijk verdelen in') + 1.5;
    bold(lx, fy, String(oef.aantalGroepen), true); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
    lx += doc.getTextWidth(String(oef.aantalGroepen)) + 1.5;
    italic(lx, fy, 'is'); doc.setFont('helvetica','italic'); doc.setFontSize(FS);
    lx += doc.getTextWidth('is') + 1.5;
    lijn(lx, fy, LIJN_W); lx += LIJN_W + 1;
    italic(lx, fy, '.');
    fy += RIJ_H + 1;

    // Zin 2: ___ verdeeld in ___ gelijke groepen is ___.
    lx = rechtsX;
    lijn(lx, fy, LIJN_W); lx += LIJN_W + 1.5;
    italic(lx, fy, 'verdeeld in'); doc.setFont('helvetica','italic'); doc.setFontSize(FS);
    lx += doc.getTextWidth('verdeeld in') + 1.5;
    lijn(lx, fy, LIJN_W); lx += LIJN_W + 1.5;
    italic(lx, fy, 'gelijke groepen is'); doc.setFont('helvetica','italic'); doc.setFontSize(FS);
    lx += doc.getTextWidth('gelijke groepen is') + 1.5;
    lijn(lx, fy, LIJN_W); lx += LIJN_W + 1;
    italic(lx, fy, '.');
    fy += RIJ_H + 1;

    // Zin 3: ___ gedeeld door ___ is ___.
    lx = rechtsX;
    lijn(lx, fy, LIJN_W); lx += LIJN_W + 1.5;
    italic(lx, fy, 'gedeeld door'); doc.setFont('helvetica','italic'); doc.setFontSize(FS);
    lx += doc.getTextWidth('gedeeld door') + 1.5;
    lijn(lx, fy, LIJN_W); lx += LIJN_W + 1.5;
    italic(lx, fy, 'is'); doc.setFont('helvetica','italic'); doc.setFontSize(FS);
    lx += doc.getTextWidth('is') + 1.5;
    lijn(lx, fy, LIJN_W); lx += LIJN_W + 1;
    italic(lx, fy, '.');
    fy += RIJ_H + 1;

    // Zin 4: ___ : ___ = ___
    lx = rechtsX;
    lijn(lx, fy, LIJN_W); lx += LIJN_W + 1;
    bold(lx, fy, ':', false); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
    lx += doc.getTextWidth(':') + 1;
    lijn(lx, fy, LIJN_W); lx += LIJN_W + 1;
    bold(lx, fy, '=', false); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
    lx += doc.getTextWidth('=') + 1.5;
    lijn(lx, fy, LIJN_W);

    y += oh;
  }

  /* ── Verdelen: splitshuis-variant ───────────────────────── */
  function _tekenVerdelenSplitshuis(oef) {
    const n          = oef.aantalGroepen;
    const DOOS_H     = 10;   // hoogte van elk vakje
    const DOOS_GAP   = 2;
    const FS         = 11;
    const BL         = 8;
    const LIJN_W     = 12;
    const LIJN_DIKTE = 0.25;
    const PAD_V      = 8;
    const PAD_H      = 6;
    const TOTAAL_B   = 18;  // breedte bovenste vakje
    const TOTAAL_H   = 10;
    const LYN_H      = 10;  // hoogte van de verbindende lijnen
    const DOOS_B     = Math.min(18, (CW - 4 - PAD_H * 2 - (n - 1) * DOOS_GAP) / n);
    const totaalB    = n * DOOS_B + (n - 1) * DOOS_GAP;
    const huisH      = TOTAAL_H + LYN_H + DOOS_H;
    const zinH       = 10 * 2 + 4; // 2 zinnen
    const oh         = PAD_V * 2 + huisH + zinH;

    checkRuimte(oh + 6);
    const ox = ML + 2, oy = y;
    doc.setFillColor(255,255,255);
    doc.setDrawColor(200,200,200);
    doc.setLineWidth(0.3);
    doc.roundedRect(ox, oy, CW - 4, oh, 3, 3, 'FD');

    // Splitshuis tekenen
    const midX   = ox + (CW - 4) / 2;
    const topX   = midX - TOTAAL_B / 2;
    const topY   = oy + PAD_V;
    const vakY   = topY + TOTAAL_H + LYN_H;

    // Bovenste vakje (groen)
    doc.setFillColor(198, 239, 206);
    doc.setDrawColor(0, 150, 50);
    doc.setLineWidth(0.5);
    doc.roundedRect(topX, topY, TOTAAL_B, TOTAAL_H, 1.5, 1.5, 'FD');
    doc.setFont('helvetica','bold'); doc.setFontSize(FS);
    doc.setTextColor(30, 100, 30);
    doc.text(String(oef.totaal), midX, topY + BL - 1, { align: 'center' });

    // Verbindingslijnen van midden naar elk vakje
    const startVakX = midX - totaalB / 2 + DOOS_B / 2;
    for (let i = 0; i < n; i++) {
      const vakMidX = startVakX + i * (DOOS_B + DOOS_GAP);
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.3);
      doc.line(midX, topY + TOTAAL_H, vakMidX, vakY);
    }

    // Onderste vakjes (leeg, blauw kader)
    const startVakXL = midX - totaalB / 2;
    for (let i = 0; i < n; i++) {
      const vx = startVakXL + i * (DOOS_B + DOOS_GAP);
      doc.setFillColor(255,255,255);
      doc.setDrawColor(21, 101, 192);
      doc.setLineWidth(0.5);
      doc.roundedRect(vx, vakY, DOOS_B, DOOS_H, 1.5, 1.5, 'FD');
    }

    // Zinnen onder het huis
    function lijn(lx, ly, w) {
      doc.setDrawColor(100,100,100); doc.setLineWidth(LIJN_DIKTE);
      doc.line(lx, ly + BL, lx + w, ly + BL);
    }
    function bold(tx, ty, t, blauw) {
      doc.setFont('helvetica','bold'); doc.setFontSize(FS);
      doc.setTextColor(...(blauw ? [21,101,192] : [50,50,50]));
      doc.text(t, tx, ty + BL);
    }
    function italic(tx, ty, t) {
      doc.setFont('helvetica','italic'); doc.setFontSize(FS);
      doc.setTextColor(70,70,70);
      doc.text(t, tx, ty + BL - 0.5);
    }

    let fy = vakY + DOOS_H + 5;
    // Zin 1: [totaal] verdeeld in [n] gelijke delen is ___.
    let lx = ox + PAD_H;
    bold(lx, fy, String(oef.totaal), true); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
    lx += doc.getTextWidth(String(oef.totaal)) + 1.5;
    italic(lx, fy, 'verdeeld in'); doc.setFont('helvetica','italic'); doc.setFontSize(FS);
    lx += doc.getTextWidth('verdeeld in') + 1.5;
    bold(lx, fy, String(n), true); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
    lx += doc.getTextWidth(String(n)) + 1.5;
    italic(lx, fy, 'gelijke delen is'); doc.setFont('helvetica','italic'); doc.setFontSize(FS);
    lx += doc.getTextWidth('gelijke delen is') + 1.5;
    lijn(lx, fy, LIJN_W); lx += LIJN_W + 1;
    italic(lx, fy, '.');
    fy += 11;

    // Zin 2: [totaal] : [n] = ___
    lx = ox + PAD_H;
    bold(lx, fy, String(oef.totaal), true); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
    lx += doc.getTextWidth(String(oef.totaal)) + 1.5;
    bold(lx, fy, ':', false); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
    lx += doc.getTextWidth(':') + 1.5;
    bold(lx, fy, String(n), true); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
    lx += doc.getTextWidth(String(n)) + 1.5;
    bold(lx, fy, '=', false); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
    lx += doc.getTextWidth('=') + 1.5;
    lijn(lx, fy, LIJN_W);

    y += oh;
  }

  /* ── Verdelen: 100-veld-variant ─────────────────────────── */
  function _tekenVerdelen100Veld(oef) {
    const KLEUREN = [
      [231, 76, 60], [93, 173, 226], [46, 204, 113],
      [243, 156, 18], [155, 89, 182], [26, 188, 156],
      [230, 126, 34], [236, 64, 122], [0, 188, 212], [139, 195, 74],
    ];
    const n      = oef.aantalGroepen;
    const p      = oef.perGroep;
    const CEL    = 5;        // mm per cel
    const GRID_B = CEL * 10; // 50mm
    const GRID_H = CEL * 10; // 50mm
    const PAD_V  = 6;
    const PAD_H  = 6;
    const LIJN_W  = 12;
    const LIJN_DIKTE = 0.25;
    const FS     = 11;
    const BL     = 8;
    const ZIN_H  = 10;
    const oh     = PAD_V * 2 + GRID_H;

    checkRuimte(oh + 6);
    const ox = ML + 2, oy = y;
    doc.setFillColor(255,255,255);
    doc.setDrawColor(200,200,200);
    doc.setLineWidth(0.3);
    doc.roundedRect(ox, oy, CW - 4, oh, 3, 3, 'FD');

    // 100-veld grid
    const gridX = ox + PAD_H;
    const gridY = oy + PAD_V;

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const celNr = r * 10 + c;
        const cx = gridX + c * CEL;
        const cy = gridY + r * CEL;
        if (celNr < n * p) {
          const strook = Math.floor(celNr / n);
          const kleur = KLEUREN[strook % KLEUREN.length];
          doc.setFillColor(...kleur);
          doc.setDrawColor(...kleur);
          doc.setLineWidth(0.1);
          doc.rect(cx, cy, CEL, CEL, 'FD');
        } else {
          doc.setFillColor(255,255,255);
          doc.setDrawColor(180,180,180);
          doc.setLineWidth(0.1);
          doc.rect(cx, cy, CEL, CEL, 'FD');
        }
      }
    }
    // Paars grid-raster over alles (5×5 blokken)
    doc.setDrawColor(130, 60, 160);
    doc.setLineWidth(0.4);
    for (let i = 0; i <= 10; i += 5) {
      doc.line(gridX + i * CEL, gridY, gridX + i * CEL, gridY + GRID_H);
      doc.line(gridX, gridY + i * CEL, gridX + GRID_B, gridY + i * CEL);
    }
    // Extra dunne lijnen voor elke cel
    doc.setDrawColor(180,180,180);
    doc.setLineWidth(0.1);
    for (let i = 0; i <= 10; i++) {
      doc.line(gridX + i * CEL, gridY, gridX + i * CEL, gridY + GRID_H);
      doc.line(gridX, gridY + i * CEL, gridX + GRID_B, gridY + i * CEL);
    }

    // Zinnen rechts van het 100-veld
    const zinX = gridX + GRID_B + 6;
    function lijn(lx, ly, w) {
      doc.setDrawColor(100,100,100); doc.setLineWidth(LIJN_DIKTE);
      doc.line(lx, ly + BL, lx + w, ly + BL);
    }
    function bold(tx, ty, t, blauw) {
      doc.setFont('helvetica','bold'); doc.setFontSize(FS);
      doc.setTextColor(...(blauw ? [21,101,192] : [50,50,50]));
      doc.text(t, tx, ty + BL);
    }
    function italic(tx, ty, t) {
      doc.setFont('helvetica','italic'); doc.setFontSize(FS);
      doc.setTextColor(70,70,70);
      doc.text(t, tx, ty + BL - 0.5);
    }

    let fy = gridY + 4;

    // Zin 1: Hoeveel gekleurde hokjes zijn er? ___  (lijn inline)
    let lx1 = zinX;
    italic(lx1, fy, 'Hoeveel gekleurde hokjes zijn er?'); doc.setFont('helvetica','italic'); doc.setFontSize(FS);
    lx1 += doc.getTextWidth('Hoeveel gekleurde hokjes zijn er?') + 2;
    lijn(lx1, fy, LIJN_W);
    fy += ZIN_H + 3;

    // Zin 2: Met hoeveel stroken van [n] kun je die bedekken? ___  (lijn inline)
    let lx2 = zinX;
    italic(lx2, fy, 'Met hoeveel stroken van'); doc.setFont('helvetica','italic'); doc.setFontSize(FS);
    lx2 += doc.getTextWidth('Met hoeveel stroken van') + 1.5;
    bold(lx2, fy, String(n), true); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
    lx2 += doc.getTextWidth(String(n)) + 1.5;
    italic(lx2, fy, 'kun je die bedekken?'); doc.setFont('helvetica','italic'); doc.setFontSize(FS);
    lx2 += doc.getTextWidth('kun je die bedekken?') + 2;
    lijn(lx2, fy, LIJN_W);
    fy += ZIN_H + 3;

    // Zin 3: Hoe dikwijls gaat [n] in [totaal]? ___ keer.  (lijn inline)
    let lx3 = zinX;
    italic(lx3, fy, 'Hoe dikwijls gaat'); doc.setFont('helvetica','italic'); doc.setFontSize(FS);
    lx3 += doc.getTextWidth('Hoe dikwijls gaat') + 1.5;
    bold(lx3, fy, String(n), true); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
    lx3 += doc.getTextWidth(String(n)) + 1.5;
    italic(lx3, fy, 'in'); doc.setFont('helvetica','italic'); doc.setFontSize(FS);
    lx3 += doc.getTextWidth('in') + 1.5;
    bold(lx3, fy, String(oef.totaal), true); doc.setFont('helvetica','bold'); doc.setFontSize(FS);
    lx3 += doc.getTextWidth(String(oef.totaal)) + 1;
    italic(lx3, fy, '?'); doc.setFont('helvetica','italic'); doc.setFontSize(FS);
    lx3 += doc.getTextWidth('?') + 2;
    lijn(lx3, fy, LIJN_W); lx3 += LIJN_W + 1.5;
    italic(lx3, fy, 'keer.');

    y += oh;
  }

  /* ══════════════════════════════════════════════════════════════
     _tekenVraagstukBlok — tekent 1 vraagstuk-blok in de PDF
     Layout: vraagstuk-tekst (volle breedte) → schema zone → antwoordzin
     ══════════════════════════════════════════════════════════════ */
  function _tekenVraagstukBlok(blok) {
    const inst = blok.inst || blok.config || {};
    const metRooster   = inst.schema?.includes('rooster');
    const metCijfer    = inst.schema?.includes('cijfer');
    const drieGetallen = inst.aantalGetallen === '3' || inst.aantalGetallen === 'gemengd';

    // Bepaal schema-type op basis van bewerking en bereik
    const vermBereik = inst.vermBereik || 'exe';
    const vermTweeCijferFactor2 = ['txte','texte','htexte'].includes(vermBereik);
    const isVermTweeFactoren = vermTweeCijferFactor2;
    const isDelen = inst.bewerking === 'delen';
    const deelBereik = inst.deelBereik || 'tee';
    const aantalDataRijen = vermTweeCijferFactor2 ? 6 : 4;

    // Deelschema: kolommen links (werkzone) en rechts (1 antwoordrij)
    function deelKolommen() {
      switch(deelBereik) {
        case 'tee':   return { links:['T','E'],         rechts:['E'],         rijenLinks:4, deler:'E'  };
        case 'htee':  return { links:['H','T','E'],     rechts:['T','E'],     rijenLinks:5, deler:'E'  };
        case 'dhtee': return { links:['D','H','T','E'], rechts:['H','T','E'], rijenLinks:6, deler:'E'  };
        case 'tete':  return { links:['T','E'],         rechts:['E'],         rijenLinks:4, deler:'TE' };
        case 'htete': return { links:['H','T','E'],     rechts:['T','E'],     rijenLinks:5, deler:'TE' };
        default:      return { links:['T','E'],         rechts:['E'],         rijenLinks:4, deler:'E'  };
      }
    }

    // ── Constanten ────────────────────────────────────────────
    const KADER_PAD   = 5;     // interne padding kader
    const TEKST_FS    = 12;    // fontgrootte vraagstuk (gelijk aan andere blokken)
    const TEKST_RH    = 6;     // regelafstand
    const LABEL_FS    = 11;    // fontgrootte labels (Bewerking, Ik cijfer, Antwoordzin)
    const ROOSTER_CEL = 6;     // celgrootte rooster — groter zodat kind erin kan schrijven
    const ROOSTER_R   = 8;     // rijen rooster
    const ROOSTER_K   = 12;    // kolommen rooster
    const ROOSTER_W   = ROOSTER_K * ROOSTER_CEL;  // 72mm
    const ROOSTER_H   = ROOSTER_R * ROOSTER_CEL;  // 48mm
    const CEL_H       = 8;     // hoogte cijferschema-cel
    const CEL_W_NORM  = 10;    // breedte normale cel
    const CEL_W_KOMMA = 5;     // breedte kommacel
    const BEW_LIJN_H  = 12;    // hoogte per schrijflijn (ruim genoeg)
    const GAP         = 4;     // ruimte tussen elementen
    const SCHEMA_GAP  = 8;     // ruimte tussen rooster en rechterzone
    const ANT_H       = 10;    // hoogte antwoordzin-zone

    // ── Kolommen bepalen ──────────────────────────────────────
    function kolomsVoorNiveau() {
      const n = inst.niveau;
      // Bij vermenigvuldigen: kolommen bepalen op basis van het niveau (= max uitkomst)
      // Want de leerkracht kiest niveau als bovengrens van de uitkomst
      if (inst.bewerking === 'vermenigvuldigen') {
        const vb = inst.vermBereik || 'exe';
        // E×E en T×E: geen niveau nodig, uitkomst bepaald door tafels
        if (vb === 'exe') return ['T','E'];       // max 9×9=81
        if (vb === 'txe') return ['H','T','E'];   // max 90×9=810
        // Grotere bereiken: kolommen volgen het gekozen niveau
        if (n === 'tot100')    return ['T','E'];
        if (n === 'tot1000')   return ['H','T','E'];
        if (n === 'tot10000')  return ['D','H','T','E'];
        if (n === 'tot100000') return ['TD','D','H','T','E'];
        // Geen niveau gekozen: baseer op bereik-type
        if (['texe','txte'].includes(vb))          return ['H','T','E'];
        if (['texte','htexe','htexte'].includes(vb)) return ['D','H','T','E'];
        return ['H','T','E'];
      }
      if (n === 'kommagetallen') {
        const prefix = inst.kommaPrefix || 'E';
        const dec    = inst.kommaDecimalen || 't';
        const pk = { 'E':[], 'TE':['T'], 'HTE':['H','T'] };
        const dk = { 't':['t'], 'th':['t','h'], 'thd':['t','h','d'] };
        return [...(pk[prefix]||[]), 'E', ',', ...(dk[dec]||['t'])];
      }
      if (n === 'tot100000') return ['TD','D','H','T','E'];
      if (n === 'tot10000')  return ['D','H','T','E'];
      if (n === 'tot1000')   return ['H','T','E'];
      if (n === 'tot100')    return ['T','E'];
      return ['E'];
    }

    // ── Hoogteschattingen ─────────────────────────────────────
    doc.setFontSize(TEKST_FS);
    const tekstRegels = doc.splitTextToSize(blok.vraagstuk || '', CW - KADER_PAD * 2);
    const tekstH = tekstRegels.length * TEKST_RH + 2;

    // Bewerking hoogte
    const bewLabelH = 7;
    const bewH = (metRooster || metCijfer)
      ? bewLabelH + (drieGetallen ? BEW_LIJN_H * 2 + 8 : BEW_LIJN_H * 3)
      : 0;

    // Cijferschema hoogte
    const kolommen = kolomsVoorNiveau();
    const schemaRijH = CEL_H * (1 + aantalDataRijen); // header + datarijen
    const cijferLabelH = 8;
    const cijferSchemaH = metCijfer
      ? cijferLabelH + GAP + (isDelen
          ? (() => { const dk = deelKolommen(); return CEL_H * (1 + dk.rijenLinks); })() // header + werkrijen links
          : (drieGetallen ? schemaRijH * 2 + GAP + 4 : schemaRijH))
      : 0;

    // Rechterkant totaal
    const rechtsH = bewH + (metCijfer ? GAP * 2 + cijferSchemaH : 0);
    // Linkerkant (rooster) hoogte incl. label
    const linksH = metRooster ? ROOSTER_H + 6 : 0;
    const schemaZoneH = metRooster || metCijfer ? Math.max(linksH, rechtsH) + GAP : 0;

    // Antwoordzin hoogte
    doc.setFontSize(LABEL_FS);
    const antTekst = (blok.antwoordzin || '').trim();
    const antRegels = antTekst ? doc.splitTextToSize('Antwoordzin:  ' + antTekst, CW - KADER_PAD * 2) : [];
    const antH = Math.max(ANT_H, antRegels.length * 6 + 4);

    // Totale kaderhoogte
    const totaalH = KADER_PAD + tekstH + GAP + schemaZoneH + antH + KADER_PAD;

    // ── Pagina-check (zoals alle andere blokken) ──────────────
    checkRuimte(VOOR_ZIN + ZINRUIMTE + totaalH + NABLOK);

    // ── Opdrachtzin boven het kader (zoals andere blokken) ────
    // Vraagstukken hebben geen aparte opdrachtzin — sla over
    y += VOOR_ZIN;

    // ── Buitenkader ───────────────────────────────────────────
    const kadX = ML;
    const kadY = y;
    const kadW = CW;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(180, 210, 240);
    doc.setLineWidth(0.7);
    doc.roundedRect(kadX, kadY, kadW, totaalH, 2, 2, 'FD');

    // ── Vraagstuk tekst (volle breedte, bovenaan) ─────────────
    let iy = kadY + KADER_PAD;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(TEKST_FS);
    doc.setTextColor(30, 30, 50);
    doc.text(tekstRegels, kadX + KADER_PAD, iy);
    iy += tekstH + GAP;

    // ── Schema zone ───────────────────────────────────────────
    if (metRooster || metCijfer) {

      // LINKS: Rooster
      if (metRooster) {
        const rx = kadX + KADER_PAD;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(LABEL_FS);
        doc.setTextColor(80, 80, 80);
        doc.text('Schema:', rx, iy + 4);
        const roosY = iy + 7;
        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.35);
        for (let r = 0; r <= ROOSTER_R; r++) {
          doc.line(rx, roosY + r * ROOSTER_CEL,
                   rx + ROOSTER_W, roosY + r * ROOSTER_CEL);
        }
        for (let k = 0; k <= ROOSTER_K; k++) {
          doc.line(rx + k * ROOSTER_CEL, roosY,
                   rx + k * ROOSTER_CEL, roosY + ROOSTER_H);
        }
      }

      // RECHTS: Bewerking + cijferschema
      const rechtsX = metRooster
        ? kadX + KADER_PAD + ROOSTER_W + SCHEMA_GAP
        : kadX + KADER_PAD;
      const rechtsMaxW = kadW - (rechtsX - kadX) - KADER_PAD;
      const lijnLengte = rechtsMaxW - 2;
      let ry = iy;

      // Label "Bewerking:"
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(LABEL_FS);
      doc.setTextColor(80, 80, 80);
      doc.text('Bewerking:', rechtsX, ry + 4);
      ry += bewLabelH;

      // Schrijflijnen
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.5);
      if (drieGetallen) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(50,50,50);
        doc.text('STAP 1', rechtsX, ry + 4);
        ry += 5;
        doc.line(rechtsX, ry + BEW_LIJN_H - 2, rechtsX + lijnLengte, ry + BEW_LIJN_H - 2);
        ry += BEW_LIJN_H;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(50,50,50);
        doc.text('STAP 2', rechtsX, ry + 4);
        ry += 5;
        doc.line(rechtsX, ry + BEW_LIJN_H - 2, rechtsX + lijnLengte, ry + BEW_LIJN_H - 2);
        ry += BEW_LIJN_H;
      } else {
        for (let li = 0; li < 3; li++) {
          doc.line(rechtsX, ry + BEW_LIJN_H - 2, rechtsX + lijnLengte, ry + BEW_LIJN_H - 2);
          ry += BEW_LIJN_H;
        }
      }

      // Cijferschema
      if (metCijfer) {
        ry += GAP;
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(LABEL_FS);
        doc.setTextColor(60, 60, 60);
        doc.text('Ik cijfer.', rechtsX, ry + 4);
        ry += cijferLabelH;

        const KLEUREN = {
          'TD':[200,230,201],'D':[255,205,210],'H':[187,222,251],
          'T':[129,199,132],'E':[255,193,7],
          ',':[180,180,180],'t':[255,249,196],'h':[255,249,196],'d':[255,249,196]
        };
        const TEKST_RGB = {
          'TD':[27,94,32],'D':[183,28,28],'H':[13,71,161],
          'T':[27,94,32],'E':[230,81,0],          ',':[255,255,255],'t':[245,127,23],'h':[245,127,23],'d':[245,127,23]
        };

        function tekenSchema(startY, stapLabel) {
          let sx = rechtsX;
          if (stapLabel) {
            doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(50,50,50);
            doc.text(stapLabel, sx, startY + 3); startY += 5;
          }
          // Header rij
          kolommen.forEach(k => {
            const cw = k === ',' ? CEL_W_KOMMA : CEL_W_NORM;
            doc.setFillColor(...(KLEUREN[k] || [220,220,220]));
            doc.setDrawColor(150,150,150); doc.setLineWidth(0.3);
            doc.rect(sx, startY, cw, CEL_H, 'FD');
            doc.setTextColor(...(TEKST_RGB[k] || [50,50,50]));
            doc.setFont('helvetica','bold'); doc.setFontSize(8);
            const tw = doc.getTextWidth(k);
            doc.text(k, sx + (cw - tw) / 2, startY + CEL_H - 2);
            sx += cw;
          });

          // Datarijen — bij verm 2 factoren: 5 rijen met dik na rij 2 en rij 4
          // Standaard: 4 rijen met dik na rij 2
          const rijDefs = isVermTweeFactoren
            ? [
                { bg:[216,216,216], dik: false },  // grijs   (factor 1)
                { bg:[255,255,255], dik: false },  // wit 1   (factor 2)
                { bg:[255,255,255], dik: true  },  // wit 2 + VETTE LIJN
                { bg:[255,255,255], dik: false },  // wit 3   (tussenresultaat 1)
                { bg:[255,255,255], dik: true  },  // wit 4 + VETTE LIJN
                { bg:[255,255,255], dik: false },  // wit 5   (einduitkomst)
              ]
            : [
                { bg:[216,216,216], dik: false },  // grijs
                { bg:[255,255,255], dik: false },  // wit
                { bg:[255,255,255], dik: true  },  // wit + dik
                { bg:[255,255,255], dik: false },  // wit
              ];

          rijDefs.forEach(({ bg, dik }) => {
            startY += CEL_H;
            let rx2 = rechtsX;
            kolommen.forEach(k => {
              const cw = k === ',' ? CEL_W_KOMMA : CEL_W_NORM;
              doc.setFillColor(...(k === ',' ? [232,232,232] : bg));
              doc.setDrawColor(180,180,180); doc.setLineWidth(0.25);
              doc.rect(rx2, startY, cw, CEL_H, 'FD');
              if (dik) {
                doc.setDrawColor(80,80,80); doc.setLineWidth(0.8);
                doc.line(rx2, startY + CEL_H, rx2 + cw, startY + CEL_H);
              }
              rx2 += cw;
            });
          });
          return startY + CEL_H;
        }

        // Delen: split-schema (werkzone links | antwoord rechts)
        if (isDelen && metCijfer) {
          const dk = deelKolommen();
          const CEL_W = CEL_W_NORM;
          const linksW = dk.links.length * CEL_W;
          const scheidLijnX = rechtsX + linksW + 2;
          const startRy = ry;

          // ── LINKS: header + werkrijen ────────────────────────
          let sx = rechtsX;
          dk.links.forEach(k => {
            doc.setFillColor(...(KLEUREN[k]||[220,220,220]));
            doc.setDrawColor(150,150,150); doc.setLineWidth(0.3);
            doc.rect(sx, ry, CEL_W, CEL_H, 'FD');
            doc.setTextColor(...(TEKST_RGB[k]||[50,50,50]));
            doc.setFont('helvetica','bold'); doc.setFontSize(8);
            const tw = doc.getTextWidth(k);
            doc.text(k, sx + (CEL_W - tw)/2, ry + CEL_H - 2);
            sx += CEL_W;
          });
          ry += CEL_H;

          for (let r = 0; r < dk.rijenLinks; r++) {
            sx = rechtsX;
            dk.links.forEach(() => {
              doc.setFillColor(255,255,255); doc.setDrawColor(180,180,180); doc.setLineWidth(0.25);
              doc.rect(sx, ry, CEL_W, CEL_H, 'FD');
              sx += CEL_W;
            });
            ry += CEL_H;
          }

          // ── Verticale scheidingslijn ─────────────────────────
          const totaalLijnH = CEL_H * (1 + dk.rijenLinks); // header + werkrijen
          doc.setDrawColor(60,60,60); doc.setLineWidth(0.7);
          doc.line(scheidLijnX, startRy, scheidLijnX, startRy + totaalLijnH);

          // ── RECHTS: header quotiënt (ter hoogte van 2e werkrij) ──
          let ryR = startRy + CEL_H * 2;
          sx = scheidLijnX + 3;
          dk.rechts.forEach(k => {
            doc.setFillColor(...(KLEUREN[k]||[220,220,220]));
            doc.setDrawColor(150,150,150); doc.setLineWidth(0.3);
            doc.rect(sx, ryR, CEL_W, CEL_H, 'FD');
            doc.setTextColor(...(TEKST_RGB[k]||[50,50,50]));
            doc.setFont('helvetica','bold'); doc.setFontSize(8);
            const tw = doc.getTextWidth(k);
            doc.text(k, sx + (CEL_W - tw)/2, ryR + CEL_H - 2);
            sx += CEL_W;
          });
          ryR += CEL_H;

          // 1 antwoordrij rechts
          sx = scheidLijnX + 3;
          dk.rechts.forEach(() => {
            doc.setFillColor(255,255,255); doc.setDrawColor(180,180,180); doc.setLineWidth(0.25);
            doc.rect(sx, ryR, CEL_W, CEL_H, 'FD');
            sx += CEL_W;
          });

          // R= schrijflijn (enkel bij met rest)
          if (inst.deelRest === 'ja') {
            const restY = ryR + CEL_H + 3;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(50, 50, 50);
            doc.text('R =', scheidLijnX + 3, restY + 4);
            const rLabelW = doc.getTextWidth('R = ');
            doc.setDrawColor(80, 80, 80); doc.setLineWidth(0.5);
            doc.line(scheidLijnX + 3 + rLabelW + 2, restY + 5,
                     scheidLijnX + 3 + rLabelW + 24, restY + 5);
          }

          ry += GAP;

        } else if (metCijfer) {
          if (drieGetallen) {
            ry = tekenSchema(ry, 'STAP 1') + GAP;
            ry = tekenSchema(ry, 'STAP 2') + GAP;
          } else {
            ry = tekenSchema(ry, '') + GAP;
          }
        }
      }
    }

    // ── Antwoordzin (onderaan, volle breedte) ─────────────────
    const antY = kadY + totaalH - KADER_PAD - antH + 2;

    // Scheidingslijn boven antwoordzin
    doc.setDrawColor(200, 215, 235);
    doc.setLineWidth(0.4);
    doc.line(kadX + KADER_PAD, antY - 2, kadX + kadW - KADER_PAD, antY - 2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(LABEL_FS);
    doc.setTextColor(50, 50, 50);
    doc.text('Antwoordzin:', kadX + KADER_PAD, antY + 5);

    if (antTekst) {
      // Deels ingevuld: tekst naast het label
      const labB = doc.getTextWidth('Antwoordzin:  ');
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 50);
      const antX = kadX + KADER_PAD + labB;
      const antW = kadW - KADER_PAD * 2 - labB;
      const antR = doc.splitTextToSize(antTekst, antW);
      doc.text(antR[0], antX, antY + 5);
    } else {
      // Lege lijn: volle breedte onder het label
      doc.setDrawColor(80, 80, 80);
      doc.setLineWidth(0.5);
      doc.line(kadX + KADER_PAD, antY + 9,
               kadX + kadW - KADER_PAD, antY + 9);
    }

    y += totaalH + NABLOK;
    lijn(ML, y - 4, ML + CW, y - 4, [210,220,230], 0.4);
  }

  /* ══════════════════════════════════════════════════════════════
     SCHATTEN — PDF renderers
     ══════════════════════════════════════════════════════════════ */

  function _tekenSchattenBlok(blok) {
    const sub = blok.subtype;
    if (sub === 'afronden')          { _tekenAfrondenBlok(blok); return; }
    if (sub === 'schatting-tabel')   { _tekenSchattingTabelBlok(blok); return; }
    if (sub === 'schatting-compact') { _tekenSchattingCompactBlok(blok); return; }
    if (sub === 'mogelijk')          { _tekenMogelijkBlok(blok); return; }
  }

  function _tekenAfrondenBlok(blok) {
    const oef = blok.oefeningen;
    const KAD_H    = 12;
    const HEADER_H = 10;
    const KOL0_W   = 46;
    const KOL1_W   = (CW - KOL0_W) / 2;
    const KOL2_W   = (CW - KOL0_W) / 2;
    const totaalH  = HEADER_H + oef.length * KAD_H + 4;

    checkRuimte(VOOR_ZIN + ZINRUIMTE + totaalH + NABLOK);
    y += VOOR_ZIN;
    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(26,58,92);
    doc.text(blok.opdrachtzin, ML, y);
    y += ZINRUIMTE;

    const tx = ML;
    doc.setFillColor(220,200,240); doc.setDrawColor(150,120,180); doc.setLineWidth(0.5);
    doc.rect(tx, y, KOL0_W, HEADER_H, 'FD');
    doc.rect(tx+KOL0_W, y, KOL1_W, HEADER_H, 'FD');
    doc.rect(tx+KOL0_W+KOL1_W, y, KOL2_W, HEADER_H, 'FD');

    // Labels afhankelijk van eerste oefening (niveau bepaalt T/H of H/D)
    const eersteOef = oef[0] || {};
    const lbl1 = eersteOef.label1 || 'H';
    const lbl2 = eersteOef.label2 || 'D';
    const klr1 = lbl1 === 'T' ? [39,174,96] : lbl1 === 'H' ? [41,128,185] : [231,76,60];
    const klr2 = lbl2 === 'H' ? [41,128,185] : [231,76,60];
    const naam1 = lbl1 === 'T' ? '... dichtstbij gelegen T' : lbl1 === 'H' ? '... dichtstbij gelegen H' : '... dichtstbij gelegen D';
    const naam2 = lbl2 === 'H' ? '... dichtstbij gelegen H' : '... dichtstbij gelegen D';

    doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(30,30,30);
    doc.text('Het getal ...', tx+3, y+HEADER_H-3);
    doc.setTextColor(...klr1);
    doc.text(naam1, tx+KOL0_W+3, y+HEADER_H-3);
    doc.setTextColor(...klr2);
    doc.text(naam2, tx+KOL0_W+KOL1_W+3, y+HEADER_H-3);
    doc.setTextColor(30,30,30);
    y += HEADER_H;

    oef.forEach((o, i) => {
      const ry = y + i * KAD_H;
      const bg = i%2===0 ? [255,255,255] : [252,248,255];
      doc.setFillColor(...bg); doc.setDrawColor(190,170,220); doc.setLineWidth(0.35);
      doc.rect(tx, ry, KOL0_W, KAD_H, 'FD');
      doc.rect(tx+KOL0_W, ry, KOL1_W, KAD_H, 'FD');
      doc.rect(tx+KOL0_W+KOL1_W, ry, KOL2_W, KAD_H, 'FD');
      doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(30,30,30);
      doc.text(o.getal.toLocaleString('nl-BE'), tx+KOL0_W/2, ry+KAD_H-3.5, {align:'center'});
      if (_metAntwoorden) {
        doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(0,100,0);
        doc.text(String(o.dichtstbij1), tx+KOL0_W+KOL1_W/2, ry+KAD_H-3.5, {align:'center'});
        doc.text(String(o.dichtstbij2), tx+KOL0_W+KOL1_W+KOL2_W/2, ry+KAD_H-3.5, {align:'center'});
        doc.setTextColor(30,30,30);
      } else {
        doc.setDrawColor(160,160,160); doc.setLineWidth(0.4);
        doc.line(tx+KOL0_W+6, ry+KAD_H-4, tx+KOL0_W+KOL1_W-6, ry+KAD_H-4);
        doc.line(tx+KOL0_W+KOL1_W+6, ry+KAD_H-4, tx+KOL0_W+KOL1_W+KOL2_W-6, ry+KAD_H-4);
      }
    });

    y += oef.length * KAD_H + NABLOK;
    lijn(ML, y-4, ML+CW, y-4, [210,220,230], 0.4);
  }

  function _tekenSchattingTabelBlok(blok) {
    const oef = blok.oefeningen;
    const HEADER_H = 16;
    const RIJ_H    = 12;
    const K0 = 38; const K1 = 44; const K2 = 56; const K3 = CW-K0-K1-K2;

    const totaalH = HEADER_H + oef.length * RIJ_H + 4;
    checkRuimte(VOOR_ZIN + ZINRUIMTE + totaalH + NABLOK);
    y += VOOR_ZIN;
    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(26,58,92);
    doc.text(blok.opdrachtzin, ML, y);
    y += ZINRUIMTE;

    const tx = ML;
    doc.setFillColor(180,204,230); doc.setDrawColor(120,150,190); doc.setLineWidth(0.5);
    [K0,K1,K2,K3].reduce((x,w) => { doc.rect(x,y,w,HEADER_H,'FD'); return x+w; }, tx);
    doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(30,30,30);
    const somLabelPdf = oef[0]?.bewerking==='aftrekken' ? 'Het verschil tussen ...' : 'De som van ...';
    doc.text(somLabelPdf, tx+2, y+HEADER_H/2+1);
    const afLabel = oef[0]?.afrondenNaar==='H' ? 'H' : 'D';
    const afKleur = oef[0]?.afrondenNaar==='H' ? [41,128,185] : [231,76,60];
    doc.text('Rond af naar', tx+K0+K1/2, y+HEADER_H/2-1.5, {align:'center'});
    doc.setTextColor(...afKleur); doc.setFontSize(10);
    doc.text(afLabel, tx+K0+K1/2, y+HEADER_H/2+4, {align:'center'});
    doc.setTextColor(30,30,30); doc.setFontSize(8.5);
    const bewLabel = oef[0]?.bewerking==='optellen' ? 'Tel de ronde getallen op.' : 'Trek de ronde getallen af.';
    doc.text(bewLabel, tx+K0+K1+2, y+HEADER_H/2+1, {maxWidth:K2-4});
    doc.text('Schatting:', tx+K0+K1+K2+2, y+HEADER_H/2+1);
    y += HEADER_H;

    oef.forEach((o,i) => {
      const ry = y + i*RIJ_H;
      const isVb = i===0;
      const bg = isVb ? [255,248,225] : (i%2===0 ? [255,255,255] : [245,250,255]);
      doc.setFillColor(...bg); doc.setDrawColor(170,185,210); doc.setLineWidth(0.35);
      [K0,K1,K2,K3].reduce((x,w) => { doc.rect(x,ry,w,RIJ_H,'FD'); return x+w; }, tx);
      const tekenTxt = o.bewerking==='optellen' ? '+' : '-';
      const cy = ry+RIJ_H-3.5;
      doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(30,30,30);
      doc.text(`${o.a.toLocaleString('nl-BE')} ${tekenTxt} ${o.b.toLocaleString('nl-BE')}`, tx+2, cy);
      if (isVb) {
        doc.setTextColor(41,128,185); doc.setFontSize(9.5);
        doc.text(`${o.afA.toLocaleString('nl-BE')} ${tekenTxt} ${o.afB.toLocaleString('nl-BE')}`, tx+K0+2, cy);
        doc.text(`${o.afA.toLocaleString('nl-BE')} ${tekenTxt} ${o.afB.toLocaleString('nl-BE')} = ${o.schatting.toLocaleString('nl-BE')}`, tx+K0+K1+2, cy);
        doc.setTextColor(231,116,0);
        doc.text(o.schatting.toLocaleString('nl-BE'), tx+K0+K1+K2+K3/2, cy, {align:'center'});
        doc.setTextColor(30,30,30);
      } else {
        if (_metAntwoorden) {
          doc.setTextColor(0,100,0); doc.setFontSize(9.5); doc.setFont('helvetica','bold');
          doc.text(`${o.afA.toLocaleString('nl-BE')} ${tekenTxt} ${o.afB.toLocaleString('nl-BE')}`, tx+K0+2, cy);
          doc.text(`${o.afA.toLocaleString('nl-BE')} ${tekenTxt} ${o.afB.toLocaleString('nl-BE')} = ${o.schatting.toLocaleString('nl-BE')}`, tx+K0+K1+2, cy);
          doc.setTextColor(200,80,0);
          doc.text(o.schatting.toLocaleString('nl-BE'), tx+K0+K1+K2+K3/2, cy, {align:'center'});
          doc.setTextColor(30,30,30);
        } else {
          doc.setDrawColor(160,160,160); doc.setLineWidth(0.4);
          const mx = tx+K0+K1/2;
          doc.line(tx+K0+4, cy, mx-6, cy);
          doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(231,116,0);
          doc.text(tekenTxt, mx, cy, {align:'center'});
          doc.setTextColor(30,30,30); doc.setDrawColor(160,160,160);
          doc.line(mx+5, cy, tx+K0+K1-4, cy);
          doc.line(tx+K0+K1+4, cy, tx+K0+K1+K2-4, cy);
          doc.line(tx+K0+K1+K2+4, cy, tx+CW-4, cy);
        }
      }
    });
    y += oef.length*RIJ_H + NABLOK;
    lijn(ML,y-4,ML+CW,y-4,[210,220,230],0.4);
  }

  // Hulpfunctie: teken een nette pijl → op positie (x, midY)
  // Geeft breedte van de getekende pijl terug
  function _tekenPijl(x, midY, kleur) {
    const stLen  = 5;    // lengte van het staafje
    const tipLen = 3;    // lengte van de punt
    const tipH   = 1.8;  // halve hoogte van de driehoek
    const rgb = kleur || [80, 80, 80];

    doc.setDrawColor(...rgb);
    doc.setLineWidth(0.55);
    // Horizontaal staafje
    doc.line(x, midY, x + stLen, midY);
    // Driehoekige punt
    doc.setFillColor(...rgb);
    doc.triangle(
      x + stLen,          midY - tipH,
      x + stLen,          midY + tipH,
      x + stLen + tipLen, midY,
      'F'
    );
    return stLen + tipLen + 2;  // totale breedte incl. kleine marge
  }

  function _tekenSchattingCompactBlok(blok) {
    const oef = blok.oefeningen;
    const HEADER_H = 11;
    const RIJ_H    = 12;  // iets hoger voor leesbaarheid
    const bewLabel = oef[0]?.bewerking==='aftrekken' ? 'Het verschil tussen ...  is ongeveer ...' : 'De som van ...  is ongeveer ...';
    const totaalH  = HEADER_H + oef.length * RIJ_H + 6;

    checkRuimte(VOOR_ZIN + ZINRUIMTE + totaalH + NABLOK);
    y += VOOR_ZIN;
    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(26,58,92);
    doc.text(blok.opdrachtzin, ML, y);
    y += ZINRUIMTE;

    const tx = ML;

    // Header balk — pijl getekend in het midden van de tekst
    doc.setFillColor(200,230,200); doc.setDrawColor(100,160,100); doc.setLineWidth(0.5);
    doc.rect(tx, y, CW, HEADER_H, 'FD');
    doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(30,30,30);

    // Splits header tekst in deel voor en na pijl
    const hdrDeel1 = oef[0]?.bewerking==='aftrekken' ? 'Het verschil tussen ...' : 'De som van ...';
    const hdrDeel2 = 'is ongeveer ...';
    const hdrMidY  = y + HEADER_H/2 + 0.5;
    const hdrCentX = tx + CW/2;
    const deel1B   = doc.getTextWidth(hdrDeel1);
    const deel2B   = doc.getTextWidth(hdrDeel2);
    const pijlW    = 12;  // ruimte voor pijl in header
    const totB     = deel1B + pijlW + deel2B;
    let hx         = hdrCentX - totB/2;

    doc.text(hdrDeel1, hx, hdrMidY);
    hx += deel1B + 3;
    _tekenPijl(hx, hdrMidY - 1, [60,120,60]);
    hx += pijlW;
    doc.text(hdrDeel2, hx, hdrMidY);
    y += HEADER_H;

    oef.forEach((o, i) => {
      const ry    = y + i * RIJ_H;
      const isVb  = i === 0;
      const bg    = isVb ? [255,248,225] : (i%2===0 ? [255,255,255] : [245,252,245]);
      doc.setFillColor(...bg); doc.setDrawColor(160,195,160); doc.setLineWidth(0.3);
      doc.rect(tx, ry, CW, RIJ_H, 'FD');

      const tekenTxt = o.bewerking==='optellen' ? '+' : '-';
      const midY     = ry + RIJ_H/2 + 1;  // verticaal midden van de rij

      // Som tekst
      const somTxt = `${o.a.toLocaleString('nl-BE')} ${tekenTxt} ${o.b.toLocaleString('nl-BE')}`;
      doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(30,30,30);
      doc.text(somTxt, tx+4, midY);
      let rx = tx + 4 + doc.getTextWidth(somTxt) + 4;

      // Getekende pijl
      const pijlBreedte = _tekenPijl(rx, midY - 1, [80,80,80]);
      rx += pijlBreedte + 2;

      if (isVb) {
        // Voorbeeld in blauw
        doc.setTextColor(41,128,185);
        doc.text(
          `${o.afA.toLocaleString('nl-BE')} ${tekenTxt} ${o.afB.toLocaleString('nl-BE')} = ${o.schatting.toLocaleString('nl-BE')}`,
          rx, midY
        );
        doc.setTextColor(30,30,30);
      } else if (_metAntwoorden) {
        doc.setTextColor(0,100,0); doc.setFont('helvetica','bold'); doc.setFontSize(10);
        doc.text(`${o.afA.toLocaleString('nl-BE')} ${tekenTxt} ${o.afB.toLocaleString('nl-BE')} = ${o.schatting.toLocaleString('nl-BE')}`, rx, midY);
        doc.setTextColor(30,30,30);
      } else {
        // Schrijflijn
        doc.setDrawColor(130,130,130); doc.setLineWidth(0.4);
        doc.line(rx, midY, tx + CW - 6, midY);
      }
    });
    y += oef.length*RIJ_H + NABLOK;
    lijn(ML,y-4,ML+CW,y-4,[210,220,230],0.4);
  }

  function _tekenMogelijkBlok(blok) {
    const oef = blok.oefeningen;

    // Kader groter: genoeg ruimte voor 2-regelige vraagtext + ik schat + checkboxen
    const KAD_H   = 72;          // was 52 — veel meer ruimte
    const KAD_W   = (CW - 8) / 2;
    const KAD_GAP = 8;
    const RIJ_H   = KAD_H + 10;
    const aantalRijen = Math.ceil(oef.length / 2);

    checkRuimte(VOOR_ZIN + ZINRUIMTE + RIJ_H + NABLOK);
    y += VOOR_ZIN;
    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(26,58,92);
    doc.text(blok.opdrachtzin, ML, y);
    y += ZINRUIMTE;

    for (let rij = 0; rij < aantalRijen; rij++) {
      if (rij > 0) checkRuimte(RIJ_H);
      const rijOef = oef.slice(rij * 2, (rij + 1) * 2);

      rijOef.forEach((o, k) => {
        const ox  = ML + k * (KAD_W + KAD_GAP);
        const oy  = y;
        const tekenTxt = o.bewerking === 'optellen' ? '+' : '-';

        // Buitenkader oranje
        doc.setFillColor(255,255,255); doc.setDrawColor(200,140,50); doc.setLineWidth(0.8);
        doc.roundedRect(ox, oy, KAD_W, KAD_H, 3, 3, 'FD');

        // Geel vraagkadertje — hoogte dynamisch op basis van vraagtekst
        const vraagTxt = `Is ${o.label.toLowerCase()} van ${o.a.toLocaleString('nl-BE')} ${tekenTxt} ${o.b.toLocaleString('nl-BE')} gelijk aan ${o.beweerdAntwoord.toLocaleString('nl-BE')}?`;
        doc.setFontSize(11);
        const regels = doc.splitTextToSize(vraagTxt, KAD_W - 16);
        const gKadH  = regels.length * 6 + 10;  // 6mm per regel + padding

        doc.setFillColor(255,248,225); doc.setDrawColor(230,160,50); doc.setLineWidth(0.5);
        doc.roundedRect(ox + 4, oy + 4, KAD_W - 8, gKadH, 2, 2, 'FD');

        doc.setFont('helvetica','normal'); doc.setFontSize(11); doc.setTextColor(40,40,40);
        doc.text(regels, ox + KAD_W/2, oy + 10, {align:'center', lineHeightFactor: 1.4});

        // "Ik schat:" — ruim onder het gele kadertje
        const ikSchatY = oy + 4 + gKadH + 8;
        doc.setFont('helvetica','italic'); doc.setFontSize(10); doc.setTextColor(80,80,80);
        doc.text('Ik schat:', ox + 5, ikSchatY);

        const sx  = ox + 5 + doc.getTextWidth('Ik schat:') + 3;
        const lw  = (KAD_W - (sx - ox) - 8) / 4;
        const ly  = ikSchatY + 0.5;

        doc.setDrawColor(100,100,100); doc.setLineWidth(0.5);
        doc.line(sx, ly, sx + lw, ly);

        doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(200,100,0);
        doc.text(tekenTxt, sx + lw + 2, ikSchatY);

        doc.setDrawColor(100,100,100);
        doc.line(sx + lw + 6, ly, sx + lw*2 + 6, ly);

        doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(60,60,60);
        doc.text('=', sx + lw*2 + 8, ikSchatY);

        doc.setDrawColor(100,100,100);
        doc.line(sx + lw*2 + 14, ly, sx + lw*3 + 14, ly);

        // Checkboxen
        const checkY = ikSchatY + 10;
        doc.setFont('helvetica','normal'); doc.setFontSize(11); doc.setTextColor(40,40,40);
        // Mogelijk checkbox — groen aangevinkt in oplossingssleutel
        if (_metAntwoorden && o.isMogelijk) {
          doc.setFillColor(198,239,206); doc.setDrawColor(0,150,50); doc.setLineWidth(0.5);
          doc.rect(ox+5, checkY, 5, 5, 'FD');
          doc.setTextColor(0,100,0); doc.setFont('helvetica','bold');
          doc.text('X', ox+6.2, checkY+4);
          doc.setTextColor(40,40,40); doc.setFont('helvetica','normal');
        } else {
          doc.rect(ox+5, checkY, 5, 5);
        }
        doc.text(`${o.label} is mogelijk.`, ox + 13, checkY + 4);
        // Niet mogelijk checkbox
        if (_metAntwoorden && !o.isMogelijk) {
          doc.setFillColor(198,239,206); doc.setDrawColor(0,150,50); doc.setLineWidth(0.5);
          doc.rect(ox+5, checkY+9, 5, 5, 'FD');
          doc.setTextColor(0,100,0); doc.setFont('helvetica','bold');
          doc.text('X', ox+6.2, checkY+13);
          doc.setTextColor(40,40,40); doc.setFont('helvetica','normal');
        } else {
          doc.rect(ox+5, checkY+9, 5, 5);
        }
        doc.text(`${o.label} is niet mogelijk.`, ox + 13, checkY + 13);
      });

      y += RIJ_H;
    }

    y += NABLOK;
    lijn(ML, y - 4, ML + CW, y - 4, [210,220,230], 0.4);
  }

  /* ── Rekentaal blok ─────────────────────────────────────────── */
  function _tekenRekentaalBlok(blok) {
    const layout = {
      ML, CW, PH, MB,
      VOOR_ZIN, ZINRUIMTE, NABLOK,
      tekenVoettekst: _tekenVoettekst,
      metAntwoorden: _metAntwoorden,
    };
    y = RekentaalPdfRenderer.tekenBlok(doc, blok, y, layout);
  }

  return { genereer };
})();
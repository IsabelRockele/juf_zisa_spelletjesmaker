/* ══════════════════════════════════════════════════════════════
   modules/klok-lezen.js
   Verantwoordelijkheid: klokken tekenen + tijden genereren
   Exporteert: KlokLezen (globaal object)
   ══════════════════════════════════════════════════════════════ */

const KlokLezen = (() => {

  // ── Afbeelding laden ──────────────────────────────────────────
  const wekkerImg = new Image();
  wekkerImg.src = 'klok_afbeeldingen/wekker.png';

  // ── Hulpfuncties tijd genereren ───────────────────────────────

  function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buildMinuteSets(moeilijkheden) {
    const set = new Set(moeilijkheden);
    if (set.has('minuut')) {
      return { mode: 'single', minutes: Array.from({ length: 60 }, (_, i) => i) };
    }
    if (set.has('5minuten')) {
      const mins = [];
      for (let m = 0; m < 60; m += 5) mins.push(m);
      return { mode: 'single', minutes: mins };
    }
    const cats = [];
    if (set.has('uur'))      cats.push({ label: 'uur',      minutes: [0] });
    if (set.has('halfuur'))  cats.push({ label: 'halfuur',  minutes: [30] });
    if (set.has('kwartier')) cats.push({ label: 'kwartier', minutes: [15, 45] });
    return { mode: 'multi', cats };
  }

  function genereerTijdenUniek(minutes, aantal) {
    const pool = [];
    for (let uur = 1; uur <= 12; uur++) {
      for (const minuut of minutes) pool.push({ uur, minuut });
    }
    if (pool.length === 0) return [];
    shuffleInPlace(pool);
    if (aantal <= pool.length) return pool.slice(0, aantal);
    const result = [...pool];
    let i = 0;
    while (result.length < aantal) {
      if (i % pool.length === 0) shuffleInPlace(pool);
      result.push(pool[i % pool.length]);
      i++;
    }
    return result;
  }

  function genereerTijdenSlim(moeilijkheden, aantal) {
    const spec = buildMinuteSets(moeilijkheden);
    if (spec.mode === 'single') return genereerTijdenUniek(spec.minutes, aantal);

    const cats = spec.cats;
    if (cats.length === 0) return Array.from({ length: aantal }, () => ({ uur: Math.floor(Math.random() * 12) + 1, minuut: 0 }));

    const k = cats.length;
    const basis = Math.floor(aantal / k);
    let rest = aantal % k;
    const perCatSelected = [];

    for (let idx = 0; idx < k; idx++) {
      const need = basis + (rest > 0 ? 1 : 0);
      if (rest > 0) rest--;
      const minutes = cats[idx].minutes;
      const pool = [];
      for (let uur = 1; uur <= 12; uur++) {
        for (const minuut of minutes) pool.push({ uur, minuut });
      }
      shuffleInPlace(pool);
      if (need <= pool.length) {
        perCatSelected.push(...pool.slice(0, need));
      } else {
        perCatSelected.push(...pool);
        let i = 0;
        while (perCatSelected.length < basis * (idx + 1) + Math.min(idx + 1, aantal % k)) {
          if (i % pool.length === 0) shuffleInPlace(pool);
          perCatSelected.push(pool[i % pool.length]);
          i++;
        }
      }
    }
    return shuffleInPlace(perCatSelected);
  }

  // ── Klok tekenen ──────────────────────────────────────────────

  function tekenKlokBasis(ctx, centerX, centerY, radius, toonHulpminuten, toon24Uur, voorOverHulpType) {
    const klokRadius = radius * 0.9;

    // Buitenring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "#A9D8E8";
    ctx.fill();

    // Wijzerplaat
    ctx.beginPath();
    ctx.arc(centerX, centerY, klokRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "white";
    ctx.fill();

    // Voor/over hulpkleur
    if (voorOverHulpType === 'hulp1') {
      ctx.beginPath(); ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, klokRadius, -0.5 * Math.PI, 0.5 * Math.PI);
      ctx.closePath(); ctx.fillStyle = 'rgba(144,238,144,0.2)'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, klokRadius, 0.5 * Math.PI, 1.5 * Math.PI);
      ctx.closePath(); ctx.fillStyle = 'rgba(255,182,193,0.2)'; ctx.fill();

      ctx.font = `italic bold ${klokRadius * 0.12}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const textY = centerY - radius - 10;
      const textXOffset = radius * 0.80;
      ctx.fillStyle = 'darkred';
      ctx.fillText("voor", centerX - textXOffset, textY);
      ctx.fillStyle = 'darkgreen';
      ctx.fillText("over", centerX + textXOffset, textY);

    } else if (voorOverHulpType === 'hulp2') {
      const cG = 'rgba(144,238,144,0.3)'; const cO = 'rgba(255,165,0,0.3)';
      const dq = (s, e, c) => {
        ctx.beginPath(); ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, klokRadius, s, e);
        ctx.closePath(); ctx.fillStyle = c; ctx.fill();
      };
      dq(-0.5 * Math.PI, 0, cG); dq(0, 0.5 * Math.PI, cO);
      dq(0.5 * Math.PI, Math.PI, cG); dq(Math.PI, 1.5 * Math.PI, cO);

      ctx.font = `bold ${radius * 0.1}px Arial`;
      ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
      const textRadius = radius * 1.15;
      const textLineHeight = radius * 0.12;
      ctx.fillStyle = 'darkgreen';
      ctx.fillText("over", centerX + textRadius * Math.cos(-Math.PI / 4), centerY + textRadius * Math.sin(-Math.PI / 4));
      ctx.fillStyle = 'darkorange';
      ctx.fillText("voor", centerX + textRadius * Math.cos(Math.PI / 4), centerY + textRadius * Math.sin(Math.PI / 4));
      ctx.fillStyle = 'darkgreen';
      let tx = centerX + textRadius * Math.cos(3 * Math.PI / 4);
      let ty = centerY + textRadius * Math.sin(3 * Math.PI / 4);
      ctx.fillText("over", tx, ty - textLineHeight / 2); ctx.fillText("half", tx, ty + textLineHeight / 2);
      ctx.fillStyle = 'darkorange';
      tx = centerX + textRadius * Math.cos(-3 * Math.PI / 4);
      ty = centerY + textRadius * Math.sin(-3 * Math.PI / 4);
      ctx.fillText("voor", tx, ty - textLineHeight / 2); ctx.fillText("half", tx, ty + textLineHeight / 2);
    }

    // 24-uurscijfers
    if (toon24Uur) {
      ctx.font = `bold ${radius * 0.12}px Arial`;
      ctx.fillStyle = "red"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (let u = 1; u <= 12; u++) {
        const hoek = (u - 3) * (Math.PI / 6);
        ctx.fillText((u + 12).toString(),
          centerX + radius * 1.10 * Math.cos(hoek),
          centerY + radius * 1.10 * Math.sin(hoek));
      }
    }

    // Uurcijfers
    ctx.font = `bold ${klokRadius * 0.15}px Arial`; ctx.fillStyle = "#448866";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (let u = 1; u <= 12; u++) {
      const hoek = (u - 3) * (Math.PI / 6);
      ctx.fillText(u.toString(),
        centerX + klokRadius * 0.75 * Math.cos(hoek),
        centerY + klokRadius * 0.75 * Math.sin(hoek));
    }

    // Streepjes
    for (let i = 0; i < 60; i++) {
      const hoek = i * (Math.PI / 30);
      const buiten = klokRadius;
      const binnen = i % 5 === 0 ? klokRadius * 0.92 : klokRadius * 0.95;
      ctx.beginPath();
      ctx.moveTo(centerX + buiten * Math.cos(hoek), centerY + buiten * Math.sin(hoek));
      ctx.lineTo(centerX + binnen * Math.cos(hoek), centerY + binnen * Math.sin(hoek));
      ctx.strokeStyle = "#444"; ctx.lineWidth = i % 5 === 0 ? 1.5 : 1; ctx.stroke();
    }

    // Hulpminuten
    if (toonHulpminuten) {
      ctx.font = `${klokRadius * 0.1}px Arial`; ctx.fillStyle = "#448866";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (let i = 1; i <= 12; i++) {
        const minuten = (i * 5) % 60;
        const label = minuten === 0 ? "00" : minuten.toString();
        const hoek = (i - 3) * (Math.PI / 6);
        ctx.fillText(label,
          centerX + klokRadius * 0.55 * Math.cos(hoek),
          centerY + klokRadius * 0.55 * Math.sin(hoek));
      }
    }
  }

  function tekenWijzer(ctx, cx, cy, hoek, lengte, dikte, kleur) {
    ctx.beginPath(); ctx.lineWidth = dikte; ctx.lineCap = "round"; ctx.strokeStyle = kleur;
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + lengte * Math.cos(hoek), cy + lengte * Math.sin(hoek));
    ctx.stroke();
  }

  function tekenWijzers(ctx, centerX, centerY, radius, uur, minuut) {
    const klokRadius = radius * 0.9;
    const uurHoek = ((uur % 12) + minuut / 60 - 3) * (Math.PI / 6);
    tekenWijzer(ctx, centerX, centerY, uurHoek, klokRadius * 0.6, 2.5, "#333");
    const minuutHoek = (minuut - 15) * (Math.PI / 30);
    tekenWijzer(ctx, centerX, centerY, minuutHoek, klokRadius * 0.85, 2, "#333");
  }

  // ── Canvas opbouwen ───────────────────────────────────────────

  /**
   * Teken een volledige set klokken op een canvas.
   * @param {HTMLCanvasElement} canvas
   * @param {object} instellingen  - alle keuzes van de gebruiker
   * @param {'compact'|'pdf'} layoutType
   */
  function tekenOpCanvas(canvas, instellingen, layoutType, containerBreedte) {
    const ctx = canvas.getContext('2d');
    const { numClocks, toonHulpminuten, toon24Uur, toonHulpAnaloog,
            voorOverHulpType, tijdnotatie, invulmethode, tijden } = instellingen;

    const clockVerticalOffset = 20;
    let actualClockDiameter, paddingBetweenClocks, wekkerDisplayWidth;

    if (layoutType === 'pdf') {
      actualClockDiameter  = tijdnotatie === '24uur' ? 240 : 180;
      paddingBetweenClocks = 30;
      wekkerDisplayWidth   = tijdnotatie === '24uur' ? 160 : 140;
    } else if (layoutType === 'preview') {
      actualClockDiameter  = 140;
      paddingBetweenClocks = 12;
      wekkerDisplayWidth   = 110;
    } else {
      actualClockDiameter  = 150;
      paddingBetweenClocks = 20;
      wekkerDisplayWidth   = 130;
    }

    const wekkerRatio = wekkerImg.height > 0 ? wekkerImg.width / wekkerImg.height : 1;
    let answerBlockHeight, minRequiredWidth;

    if (invulmethode === 'analoog') {
      answerBlockHeight = 60;
      minRequiredWidth  = actualClockDiameter;
    } else if (tijdnotatie === '24uur') {
      const labelH = 12, spacing = 15;
      answerBlockHeight = (labelH * 2) + wekkerDisplayWidth / wekkerRatio + spacing;
      minRequiredWidth  = wekkerDisplayWidth * 2 + spacing;
    } else {
      answerBlockHeight = wekkerDisplayWidth / wekkerRatio;
      minRequiredWidth  = wekkerDisplayWidth;
    }

    const extraBreedte = (layoutType === 'pdf' && tijdnotatie === 'standaard') ? 60 : 20;
    const singleCellW = Math.max(actualClockDiameter + extraBreedte, minRequiredWidth + 20);
    const spaceBelowClock = (voorOverHulpType !== 'geen' || tijdnotatie === '24uur' || toon24Uur) ? 45 : 20;
    const singleCellH = clockVerticalOffset + actualClockDiameter + spaceBelowClock + answerBlockHeight;

    const numCols = 3;
    const numRows = Math.ceil(numClocks / numCols);

    canvas.width  = singleCellW * numCols + paddingBetweenClocks * (numCols + 1);
    canvas.height = singleCellH * numRows + paddingBetweenClocks * (numRows + 1);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < numClocks; i++) {
      const row = Math.floor(i / numCols);
      const col = i % numCols;
      const xBox = paddingBetweenClocks + col * (singleCellW + paddingBetweenClocks);
      const yBox = paddingBetweenClocks + row * (singleCellH + paddingBetweenClocks);

      ctx.strokeStyle = '#dddddd'; ctx.lineWidth = 1;
      ctx.strokeRect(xBox, yBox, singleCellW, singleCellH);

      const clockX  = xBox + (singleCellW - actualClockDiameter) / 2;
      const clockY  = yBox + clockVerticalOffset;
      const radius  = actualClockDiameter / 2;
      const centerX = clockX + radius;
      const centerY = clockY + radius;
      const { uur, minuut } = tijden[i];

      tekenKlokBasis(ctx, centerX, centerY, radius, toonHulpminuten, toon24Uur, voorOverHulpType);
      tekenWijzers(ctx, centerX, centerY, radius, uur, minuut);

      // Antwoordzone
      const spaceBelowKlok = (voorOverHulpType !== 'geen' || tijdnotatie === '24uur' || toon24Uur) ? 45 : 20;
      const yAntwoord = clockY + actualClockDiameter + spaceBelowKlok;

      if (invulmethode === 'analoog') {
        const lineH = actualClockDiameter * 0.25;
        ctx.font = `${actualClockDiameter * 0.11}px Arial`;
        ctx.fillStyle = '#333'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const textX = xBox + singleCellW / 2;

        if (toonHulpAnaloog) {
          let zin1 = '', zin2 = '';
          if (minuut === 0)       { zin1 = "Het is ___ uur"; }
          else if (minuut === 30) { zin1 = "Het is half ___"; }
          else if (minuut === 15 || minuut === 45) { zin1 = "Het is kwart"; zin2 = "voor / over ___"; }
          else { zin1 = "Het is ___ min."; zin2 = "voor / over ___"; }

          if (zin2) {
            ctx.fillText(zin1, textX, yAntwoord);
            ctx.fillText(zin2, textX, yAntwoord + lineH);
          } else {
            ctx.fillText(zin1, textX, yAntwoord + lineH / 2);
          }
        } else {
          ctx.fillText("Het is ___________", textX, yAntwoord + lineH / 2);
        }

      } else {
        // Digitale wekker(s)
        if (tijdnotatie === '24uur') {
          const labelH = 12, spacing = 15;
          const totalW = wekkerDisplayWidth * 2 + spacing;
          const startX = xBox + (singleCellW - totalW) / 2;
          const wekkerH = wekkerDisplayWidth / wekkerRatio;
          ctx.font = `italic ${labelH - 3}px Arial`;
          ctx.fillStyle = '#555'; ctx.textAlign = 'center';
          ctx.fillText("ochtend/voormiddag", startX + wekkerDisplayWidth / 2, yAntwoord);
          ctx.drawImage(wekkerImg, startX, yAntwoord + labelH, wekkerDisplayWidth, wekkerH);
          const x2 = startX + wekkerDisplayWidth + spacing;
          ctx.fillText("namiddag/avond", x2 + wekkerDisplayWidth / 2, yAntwoord);
          ctx.drawImage(wekkerImg, x2, yAntwoord + labelH, wekkerDisplayWidth, wekkerH);
        } else {
          const wekkerH = wekkerDisplayWidth / wekkerRatio;
          const wekkerX = xBox + (singleCellW - wekkerDisplayWidth) / 2;
          ctx.drawImage(wekkerImg, wekkerX, yAntwoord, wekkerDisplayWidth, wekkerH);
        }
      }
    }
  }

  // ── Publieke API ──────────────────────────────────────────────

  return {
    /**
     * Lees de huidige UI-instellingen uit en genereer tijden.
     * Geeft null terug bij fout (en toont melding).
     */
    leesInstellingen() {
      const moeilijkheden = Array.from(
        document.querySelectorAll('input[name="moeilijkheid"]:checked')
      ).map(cb => cb.value);

      if (moeilijkheden.length === 0) {
        document.getElementById('meldingContainer').textContent =
          "Kies minstens één moeilijkheidsgraad!";
        return null;
      }
      document.getElementById('meldingContainer').textContent = '';

      const numClocks = parseInt(document.getElementById('numClocks').value);
      return {
        type:           'kloklezen',
        numClocks,
        toonHulpminuten: document.getElementById('hulpminuten').checked,
        toon24Uur:       document.getElementById('hulp24uur').checked,
        toonHulpAnaloog: document.getElementById('hulpAnaloog').checked,
        voorOverHulpType: document.getElementById('voorOverHulp').value,
        moeilijkheden,
        tijdnotatie:  document.querySelector('input[name="tijdnotatie"]:checked').value,
        invulmethode: document.querySelector('input[name="invulmethode"]:checked').value,
        tijden:       genereerTijdenSlim(moeilijkheden, numClocks),
      };
    },

    /** Teken preview met vaste kleine maat */
    tekenPreviewMetBreedte(canvas, instellingen, breedte) {
      if (!instellingen) return;
      const teken = () => tekenOpCanvas(canvas, instellingen, 'preview', breedte);
      if (!wekkerImg.complete || wekkerImg.naturalWidth === 0) {
        wekkerImg.onload = teken;
      } else {
        teken();
      }
    },

    /** Teken preview op het scherm-canvas */
    tekenPreview(canvas, instellingen) {
      if (!instellingen) return;
      const breedte = canvas.parentElement ? canvas.parentElement.clientWidth : 600;
      const teken = () => tekenOpCanvas(canvas, instellingen, 'preview', breedte);
      if (!wekkerImg.complete || wekkerImg.naturalWidth === 0) {
        wekkerImg.onload = teken;
      } else {
        teken();
      }
    },

    /**
     * Teken oefening in een jsPDF-document.
     * @param {jsPDF}  doc
     * @param {object} instellingen
     * @param {HTMLCanvasElement} hulpCanvas  - tijdelijk canvas om op te tekenen
     * @param {number} yStart   - mm van de bovenkant waar de oefening begint
     * @param {number} margin
     * @returns {number}  hoogte die gebruikt werd in mm
     */
    tekenInPdf(doc, instellingen, hulpCanvas, yStart, margin) {
      const KLOKKEN_PER_PAGINA = 9;
      const pageWidth  = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const usableW = pageWidth - 2 * margin;
      const usableH = pageHeight - yStart - margin;

      // Splits over meerdere stukken van 9 klokken
      const tijden     = instellingen.tijden;
      const totaal     = tijden.length;
      const aantalDelen = Math.ceil(totaal / KLOKKEN_PER_PAGINA);
      let gebruikteHoogte = 0;

      for (let deel = 0; deel < aantalDelen; deel++) {
        if (deel > 0) {
          doc.addPage();
          yStart = margin;
        }
        const pageTijden = tijden.slice(deel * KLOKKEN_PER_PAGINA, (deel + 1) * KLOKKEN_PER_PAGINA);
        const pageInst = { ...instellingen, numClocks: pageTijden.length, tijden: pageTijden };

        tekenOpCanvas(hulpCanvas, pageInst, 'pdf');
        const dataURL = hulpCanvas.toDataURL('image/png');
        const ratio   = hulpCanvas.width / hulpCanvas.height;

        let imgW = usableW;
        let imgH = imgW / ratio;
        if (imgH > usableH) { imgH = usableH; imgW = imgH * ratio; }

        const xPos = (pageWidth - imgW) / 2;
        doc.addImage(dataURL, 'PNG', xPos, yStart, imgW, imgH);
        gebruikteHoogte = imgH;
      }

      return gebruikteHoogte;
    },

    /** Genereer één enkele tijd op basis van moeilijkheden */
    genereerEenTijd(moeilijkheden) {
      return genereerTijdenSlim(moeilijkheden, 1)[0];
    },

    /** Wacht tot de wekker-afbeelding geladen is */
    wachtOpAfbeelding(callback) {
      if (wekkerImg.complete && wekkerImg.naturalWidth > 0) {
        callback();
      } else {
        wekkerImg.onload  = callback;
        wekkerImg.onerror = () => {
          document.getElementById('meldingContainer').textContent =
            "Fout: kon 'wekker.png' niet laden.";
        };
      }
    },
  };
})();
/* ══════════════════════════════════════════════════════════════
   Maateenheden — module
   Verantwoordelijkheid: oefeningen genereren + PDF tekenen
   Exporteert: Maateenheden (globaal object)
   ══════════════════════════════════════════════════════════════ */

const Maateenheden = (() => {

  // ── Alle beschikbare zinnen (leerkracht kiest welke) ──────────
  // id: unieke sleutel voor aanklikken; zin: tekst met {_}; antwoord: correcte invulling
  const ALLE_ZINNEN = [
    { id: 'u_min',    zin: "1 uur = {_} minuten",        antwoord: "60"  },
    { id: 'hu_min',   zin: "1 halfuur = {_} minuten",    antwoord: "30"  },
    { id: 'kw_min',   zin: "1 kwartier = {_} minuten",   antwoord: "15"  },
    { id: '2kw_min',  zin: "2 kwartier = {_} minuten",   antwoord: "30"  },
    { id: '3kw_min',  zin: "3 kwartier = {_} minuten",   antwoord: "45"  },
    { id: 'u_hu',     zin: "1 uur = {_} halfuren",       antwoord: "2"   },
    { id: 'u_kw',     zin: "1 uur = {_} kwartieren",     antwoord: "4"   },
    { id: 'd_u',      zin: "1 dag = {_} uren",           antwoord: "24"  },
    { id: 'min_sec',  zin: "1 minuut = {_} seconden",    antwoord: "60"  },
  ];

  // ── PDF tekenen ───────────────────────────────────────────────
  function tekenInPdf(doc, instellingen, yStart, margin) {
    const vragen     = instellingen.vragen;
    const metSleutel = instellingen.metSleutel;
    const pageW      = doc.internal.pageSize.getWidth();
    const kolommen   = instellingen.kolommen || 2;
    const kolBreedte = (pageW - 2 * margin) / kolommen;
    const regelH     = 12;

    doc.setFontSize(13);
    doc.setFont(undefined, 'normal');

    vragen.forEach((vraag, i) => {
      const kolom  = i % kolommen;
      const rij    = Math.floor(i / kolommen);
      const x      = margin + kolom * kolBreedte;
      const yVraag = yStart + rij * regelH;

      doc.text('•', x, yVraag);

      const delen = vraag.zin.split('{_}');
      let curX = x + 5;
      delen.forEach((deel, di) => {
        doc.text(deel, curX, yVraag);
        curX += doc.getTextWidth(deel);
        if (di < delen.length - 1) {
          const vakB = Math.max(12, doc.getTextWidth('000') + 4);
          if (metSleutel) {
            doc.setFont(undefined, 'bold');
            doc.setTextColor(180, 0, 0);
            doc.text(vraag.antwoord, curX + vakB / 2, yVraag, { align: 'center' });
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
          } else {
            doc.setDrawColor(120, 120, 120);
            doc.setLineWidth(0.4);
            doc.line(curX, yVraag + 1.5, curX + vakB, yVraag + 1.5);
          }
          curX += vakB;
        }
      });
    });

    return Math.ceil(vragen.length / kolommen) * regelH;
  }

  // ── HTML-preview (inline in sidebar of content) ───────────────
  function tekenPreviewHtml(container, instellingen) {
    if (!instellingen || !container) return;
    const { vragen, metSleutel, kolommen } = instellingen;
    container.innerHTML = '';

    const grid = document.createElement('div');
    grid.style.cssText = `display:grid;grid-template-columns:repeat(${kolommen},1fr);gap:6px 16px;`;

    vragen.forEach((vraag, i) => {
      const cel = document.createElement('div');
      cel.style.cssText = 'display:flex;align-items:baseline;gap:4px;padding:5px 0;border-bottom:1px solid #f0f0f0;font-size:13px;';

      const delen = vraag.zin.split('{_}');
      delen.forEach((deel, di) => {
        cel.appendChild(document.createTextNode(deel));
        if (di < delen.length - 1) {
          if (metSleutel) {
            const ans = document.createElement('strong');
            ans.textContent = vraag.antwoord;
            ans.style.color = '#c00';
            cel.appendChild(ans);
          } else {
            const lijn = document.createElement('span');
            lijn.style.cssText = 'display:inline-block;min-width:28px;border-bottom:2px solid #333;margin:0 3px;';
            cel.appendChild(lijn);
          }
        }
      });
      grid.appendChild(cel);
    });
    container.appendChild(grid);
  }

  // ── Publieke API ──────────────────────────────────────────────
  return {
    ALLE_ZINNEN,

    leesInstellingen() {
      const geselecteerd = Array.from(
        document.querySelectorAll('input[name="maatzin"]:checked')
      ).map(cb => cb.value);

      if (geselecteerd.length === 0) {
        document.getElementById('meldingMaateenheden').textContent =
          "Kies minstens één zin!";
        return null;
      }
      document.getElementById('meldingMaateenheden').textContent = '';

      const kolommen   = parseInt(document.getElementById('maatKolommen').value) || 2;
      const metSleutel = document.getElementById('maatMetSleutel').checked;

      // Vragen = geselecteerde zinnen in volgorde van ALLE_ZINNEN
      const vragen = ALLE_ZINNEN.filter(z => geselecteerd.includes(z.id));

      return { type: 'maateenheden', vragen, kolommen, metSleutel };
    },

    tekenPreviewHtml,
    tekenInPdf,
  };

})();

/* ══════════════════════════════════════════════════════════════
   KlokVerbinden — module
   Verantwoordelijkheid: verbindoefeningen genereren + PDF tekenen
   Lay-out: 4 klokken per rij, verbindpunten onder/boven, tijden eronder
   ══════════════════════════════════════════════════════════════ */

const KlokVerbinden = (() => {

  // ── Tijdnotatie omzetten naar leesbare string ─────────────────

  function tijdNaarDigitaal12(uur, minuut) {
    const u = uur % 12 || 12;
    const m = minuut.toString().padStart(2, '0');
    return `${u}:${m}`;
  }

  function tijdNaarDigitaal24(uur, minuut) {
    // Geef namiddag/avonduren: voeg willekeurig 12 toe voor uren 1-11
    const u24 = uur + 12;
    const m = minuut.toString().padStart(2, '0');
    return `${u24}:${m}`;
  }

  function tijdNaarZinA(uur, minuut) {
    // Systeem A: t.o.v. dichtstbijzijnd heel of half uur
    if (minuut === 0)  return `${uur} uur`;
    if (minuut === 30) return `half ${(uur % 12) + 1}`;
    if (minuut === 15) return `kwart over ${uur}`;
    if (minuut === 45) return `kwart voor ${(uur % 12) + 1}`;
    if (minuut < 30) {
      return `${minuut} over ${uur}`;
    } else {
      const volgend = (uur % 12) + 1;
      if (minuut < 30) return `${minuut} over ${uur}`;
      // minuut 31-59
      const minVoorHalf = 30 - (minuut - 30); // bijv. 35 → 5 voor half
      const minNaHalf   = minuut - 30;         // bijv. 35 → 5 over half
      if (minuut < 30) return '';
      if (minuut <= 35 && minuut > 30) return `${minNaHalf} over half ${volgend}`;
      if (minuut < 30) return '';
      return `${60 - minuut} voor ${volgend}`;
    }
  }

  // Herbouwde, correcte versie systeem A
  function tijdNaarZinSysteemA(uur, minuut) {
    const volgendUur = (uur % 12) + 1;
    const volgendHalf = (uur % 12) + 1;
    if (minuut === 0)  return `${uur} uur`;
    if (minuut === 15) return `kwart over ${uur}`;
    if (minuut === 30) return `half ${volgendHalf}`;
    if (minuut === 45) return `kwart voor ${volgendUur}`;
    if (minuut < 30)   return `${minuut} over ${uur}`;
    if (minuut > 30)   {
      const naHalf = minuut - 30;
      const voorHalf = 30 - naHalf; // spiegeling
      if (naHalf <= 14) return `${naHalf} over half ${volgendHalf}`;
      return `${60 - minuut} voor ${volgendUur}`;
    }
    return `${minuut} over ${uur}`;
  }

  function tijdNaarZinSysteemB(uur, minuut) {
    const volgend = (uur % 12) + 1;
    if (minuut === 0)  return `${uur} uur`;
    if (minuut === 15) return `kwart over ${uur}`;
    if (minuut === 30) return `half ${volgend}`;
    if (minuut === 45) return `kwart voor ${volgend}`;
    if (minuut < 30)   return `${minuut} over ${uur}`;
    return `${60 - minuut} voor ${volgend}`;
  }

  function tijdNaarSpreektaal(uur, minuut) {
    // "5 uur 30" of "5 uur" — geen uur 0
    const u = uur % 12 || 12;
    if (minuut === 0) return `${u} uur`;
    return `${u} uur ${minuut.toString().padStart(2,'0')}`;
  }

  function formateerTijd(uur, minuut, notatie) {
    switch (notatie) {
      case 'digitaal12':  return tijdNaarDigitaal12(uur, minuut);
      case 'digitaal24':  return tijdNaarDigitaal24(uur, minuut);
      case 'spreektaal':  return tijdNaarSpreektaal(uur, minuut);
      case 'zinA':        return tijdNaarZinSysteemA(uur, minuut);
      case 'zinB':        return tijdNaarZinSysteemB(uur, minuut);
      default:            return tijdNaarDigitaal12(uur, minuut);
    }
  }

  // ── Tijden genereren ─────────────────────────────────────────
  function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function genereerRij(moeilijkheden) {
    const minuutPool = new Set();
    if (moeilijkheden.includes('uur'))      minuutPool.add(0);
    if (moeilijkheden.includes('halfuur'))  minuutPool.add(30);
    if (moeilijkheden.includes('kwartier')) { minuutPool.add(15); minuutPool.add(45); }
    if (moeilijkheden.includes('5minuten')) {
      for (let m = 0; m < 60; m += 5) minuutPool.add(m);
    }
    const minuten = Array.from(minuutPool);
    const tijden = [];
    const gebruikte = new Set();
    while (tijden.length < 4) {
      const uur    = Math.floor(Math.random() * 12) + 1;
      const minuut = minuten[Math.floor(Math.random() * minuten.length)];
      const sleutel = `${uur}:${minuut}`;
      if (!gebruikte.has(sleutel)) {
        gebruikte.add(sleutel);
        tijden.push({ uur, minuut });
      }
    }
    return tijden;
  }

  // ── PDF tekenen ───────────────────────────────────────────────
  const RIJ_H      = 72;  // mm per rij inclusief kader en 4mm tussenruimte
  const KLOK_D_PDF = 36;  // mm klokdiameter op PDF
  const PUNT_R     = 1.0; // mm straal verbindpunt (klein)

  function tekenKlokPdf(doc, cx, cy, r, uur, minuut, toonHulpminuten) {
    // Buitenring
    doc.setFillColor(169, 216, 232);
    doc.circle(cx, cy, r, 'F');
    // Wijzerplaat
    const ri = r * 0.88;
    doc.setFillColor(255, 255, 255);
    doc.circle(cx, cy, ri, 'F');

    // Uurstreepjes
    doc.setDrawColor(80, 80, 80);
    for (let i = 0; i < 60; i++) {
      const hoek = (i - 15) * Math.PI / 30;
      const buit = ri;
      const binn = i % 5 === 0 ? ri * 0.88 : ri * 0.93;
      doc.setLineWidth(i % 5 === 0 ? 0.4 : 0.2);
      doc.line(cx + buit * Math.cos(hoek), cy + buit * Math.sin(hoek),
               cx + binn * Math.cos(hoek), cy + binn * Math.sin(hoek));
    }

    // Uurcijfers — vaste kleine fontgrootte, niet schaalbaar met r
    doc.setFontSize(6.5);
    doc.setTextColor(60, 140, 100);
    doc.setFont(undefined, 'bold');
    for (let u = 1; u <= 12; u++) {
      const hoek = (u - 3) * Math.PI / 6;
      const rx = cx + ri * 0.72 * Math.cos(hoek);
      const ry = cy + ri * 0.72 * Math.sin(hoek) + 0.8;
      doc.text(u.toString(), rx, ry, { align: 'center' });
    }

    // Hulpminuten
    if (toonHulpminuten) {
      doc.setFontSize(4.5);
      doc.setTextColor(60, 140, 100);
      doc.setFont(undefined, 'normal');
      for (let i = 1; i <= 12; i++) {
        const min = (i * 5) % 60;
        const lbl = min === 0 ? '00' : min.toString();
        const hoek = (i - 3) * Math.PI / 6;
        const rx = cx + ri * 0.52 * Math.cos(hoek);
        const ry = cy + ri * 0.52 * Math.sin(hoek) + 0.5;
        doc.text(lbl, rx, ry, { align: 'center' });
      }
    }

    // Wijzers
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    const uurPos = (uur % 12) + minuut / 60;
    const uurH = (uurPos - 3) * Math.PI / 6;
    const minH = (minuut - 15) * Math.PI / 30;
    doc.setDrawColor(50, 50, 50);
    doc.setLineWidth(0.8);
    doc.line(cx, cy, cx + ri * 0.55 * Math.cos(uurH), cy + ri * 0.55 * Math.sin(uurH));
    doc.setLineWidth(0.5);
    doc.line(cx, cy, cx + ri * 0.80 * Math.cos(minH), cy + ri * 0.80 * Math.sin(minH));

    // Middenpunt
    doc.setFillColor(50, 50, 50);
    doc.circle(cx, cy, 0.5, 'F');
  }

  function tekenRijPdf(doc, rijTijden, volgorde, notatie, toonHulpminuten, x0, y, breedte, rijNr) {
    const n       = 4;
    const colW    = breedte / n;
    const klokR   = KLOK_D_PDF / 2;

    // Verticale lay-out met meer ruimte
    const klokCY      = y + 4 + klokR;
    const puntY_onder = klokCY + klokR + 6;   // 6mm onder klok naar punt
    const puntY_boven = puntY_onder + 24;      // 24mm tussen de twee punten
    const labelY      = puntY_boven + 6;       // 6mm boven label
    const kaderH      = labelY + 6 - y;        // kader sluit 6mm onder label

    // Kader rondom de rij
    doc.setFillColor(250, 252, 255);
    doc.setDrawColor(180, 200, 230);
    doc.setLineWidth(0.4);
    doc.roundedRect(x0, y, breedte, kaderH, 2, 2, 'FD');

    // Klokken + verbindpunten onder
    rijTijden.forEach((t, i) => {
      const cx = x0 + colW * i + colW / 2;
      tekenKlokPdf(doc, cx, klokCY, klokR, t.uur, t.minuut, toonHulpminuten);
      doc.setFillColor(60, 60, 60);
      doc.circle(cx, puntY_onder, PUNT_R, 'F');
    });

    // Tijdlabels + verbindpunten erboven
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 30, 30);
    volgorde.forEach((idx, i) => {
      const t  = rijTijden[idx];
      const cx = x0 + colW * i + colW / 2;
      const label = formateerTijd(t.uur, t.minuut, notatie);
      doc.setFillColor(60, 60, 60);
      doc.circle(cx, puntY_boven, PUNT_R, 'F');
      doc.setTextColor(30, 30, 30);
      doc.text(label, cx, labelY, { align: 'center' });
    });

    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);

    return kaderH;
  }

  // ── HTML preview ─────────────────────────────────────────────
  function tekenPreviewHtml(container, instellingen) {
    if (!container || !instellingen) return;
    container.innerHTML = '';
    const { rijen, notatie } = instellingen;

    rijen.forEach((rij, ri) => {
      const rijDiv = document.createElement('div');
      rijDiv.style.cssText = 'display:flex;flex-direction:column;gap:4px;margin-bottom:12px;border:1px solid #e8eef8;border-radius:6px;padding:8px;background:#fafcff;';

      // Klok-rij (placeholder cirkels)
      const klokRij = document.createElement('div');
      klokRij.style.cssText = 'display:flex;gap:8px;justify-content:center;';
      rij.tijden.forEach(t => {
        const cel = document.createElement('div');
        cel.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;flex:1;';
        cel.innerHTML = `
          <div style="width:52px;height:52px;border-radius:50%;border:3px solid #A9D8E8;background:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;color:#448866;font-weight:bold;">
            ${t.uur}:${t.minuut.toString().padStart(2,'0')}
          </div>
          <div style="width:6px;height:6px;border-radius:50%;background:#444;margin-top:2px;"></div>`;
        klokRij.appendChild(cel);
      });
      rijDiv.appendChild(klokRij);

      // Label-rij
      const labelRij = document.createElement('div');
      labelRij.style.cssText = 'display:flex;gap:8px;justify-content:center;margin-top:4px;';
      rij.volgorde.forEach(idx => {
        const t = rij.tijden[idx];
        const cel = document.createElement('div');
        cel.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;';
        cel.innerHTML = `
          <div style="width:6px;height:6px;border-radius:50%;background:#444;"></div>
          <div style="font-size:12px;font-weight:bold;color:#1A3A5C;text-align:center;">${formateerTijd(t.uur, t.minuut, notatie)}</div>`;
        labelRij.appendChild(cel);
      });
      rijDiv.appendChild(labelRij);
      container.appendChild(rijDiv);
    });
  }

  // ── Publieke API ──────────────────────────────────────────────
  return {
    RIJ_H,
    formateerTijd,

    leesInstellingen() {
      const moeilijkheden = Array.from(
        document.querySelectorAll('input[name="verbMoeilijkheid"]:checked')
      ).map(cb => cb.value);

      if (moeilijkheden.length === 0) {
        document.getElementById('meldingVerbinden').textContent = 'Kies minstens één moeilijkheidsgraad!';
        return null;
      }
      document.getElementById('meldingVerbinden').textContent = '';

      const aantalRijen  = parseInt(document.getElementById('verbAantalRijen').value) || 2;
      const notatie      = document.querySelector('input[name="verbNotatie"]:checked')?.value || 'digitaal12';
      const toonHulp     = document.getElementById('verbHulpminuten')?.checked || false;

      const rijen = [];
      for (let r = 0; r < aantalRijen; r++) {
        const tijden   = genereerRij(moeilijkheden);
        const volgorde = shuffleInPlace([0, 1, 2, 3]);
        rijen.push({ tijden, volgorde });
      }

      return { type: 'verbinden', moeilijkheden, notatie, toonHulpminuten: toonHulp, aantalRijen, rijen };
    },

    tekenPreviewHtml,

    // ── 24u↔12u verbinden ────────────────────────────────────────
    leesInstellingen24u() {
      const aantalParen = parseInt(document.getElementById('verb24aantalParen')?.value) || 6;
      document.getElementById('meldingVerbinden').textContent = '';

      // Genereer namiddaguren (13-23) en hun 12u-equivalent
      const naMiddag = [];
      for (let u = 13; u <= 23; u++) naMiddag.push(u);
      shuffleInPlace(naMiddag);
      const gekozen = naMiddag.slice(0, aantalParen);

      const paren = gekozen.map(u24 => ({
        u24,
        u12: u24 - 12,
        label24: `${u24}:00`,
        label12: `${u24 - 12}:00`,
      }));

      // Schud de rechterkant
      const volgordeRechts = shuffleInPlace([...Array(aantalParen).keys()]);

      return { type: 'verbinden24u', aantalParen, paren, volgordeRechts };
    },

    tekenPreview24uHtml(container, inst) {
      if (!container || !inst) return;
      container.innerHTML = '';
      const { paren, volgordeRechts } = inst;

      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;gap:16px;';

      // Links: 24u
      const links = document.createElement('div');
      links.style.cssText = 'flex:1;display:flex;flex-direction:column;gap:6px;';
      paren.forEach(p => {
        const item = document.createElement('div');
        item.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:13px;font-weight:bold;color:#1a3a6c;';
        item.innerHTML = `<span style="background:#e8f0fe;border:1.5px solid #4A90D9;border-radius:6px;padding:3px 10px;">${p.label24}</span>
          <span style="width:8px;height:8px;border-radius:50%;background:#444;display:inline-block;"></span>`;
        links.appendChild(item);
      });

      // Rechts: 12u geschud
      const rechts = document.createElement('div');
      rechts.style.cssText = 'flex:1;display:flex;flex-direction:column;gap:6px;align-items:flex-end;';
      volgordeRechts.forEach(idx => {
        const p = paren[idx];
        const item = document.createElement('div');
        item.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:13px;font-weight:bold;color:#1a3a6c;';
        item.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;background:#444;display:inline-block;"></span>
          <span style="background:#e8f5e9;border:1.5px solid #27AE60;border-radius:6px;padding:3px 10px;">${p.label12}</span>`;
        rechts.appendChild(item);
      });

      wrap.appendChild(links);
      wrap.appendChild(rechts);
      container.appendChild(wrap);
    },

    tekenInPdf24u(doc, inst, yStart, margin) {
      const { paren, volgordeRechts } = inst;
      const pageW   = doc.internal.pageSize.getWidth();
      const breedte = pageW - 2 * margin;
      // Smallere vakjes = meer ruimte in het midden tussen de punten
      const kolW    = breedte * 0.28;      // 28% van breedte per kolom
      const middenW = breedte - 2 * kolW;  // resterende ruimte in midden
      const regelH  = 13;                  // meer verticale ruimte per rij
      const punt    = 1.0;
      const xR      = margin + kolW + middenW; // startpunt rechterkolom

      doc.setFontSize(13);
      doc.setFont(undefined, 'bold');

      paren.forEach((p, i) => {
        const y = yStart + i * regelH;

        // Links: 24u vakje
        doc.setFillColor(232, 240, 254);
        doc.setDrawColor(74, 144, 217);
        doc.setLineWidth(0.4);
        doc.roundedRect(margin, y, kolW, regelH - 2, 1, 1, 'FD');
        doc.setTextColor(20, 50, 120);
        doc.text(p.label24, margin + kolW / 2, y + (regelH - 2) * 0.65, { align: 'center' });

        // Verbindpunt rechts van links-vakje
        doc.setFillColor(60, 60, 60);
        doc.circle(margin + kolW + middenW * 0.2, y + (regelH - 2) / 2, punt, 'F');
      });

      // Rechts: 12u vakjes geschud
      volgordeRechts.forEach((idx, i) => {
        const p = paren[idx];
        const y = yStart + i * regelH;

        // Verbindpunt links van rechts-vakje
        doc.setFillColor(60, 60, 60);
        doc.circle(xR - middenW * 0.2, y + (regelH - 2) / 2, punt, 'F');

        // Rechts: 12u vakje
        doc.setFillColor(232, 245, 233);
        doc.setDrawColor(39, 174, 96);
        doc.setLineWidth(0.4);
        doc.roundedRect(xR, y, kolW, regelH - 2, 1, 1, 'FD');
        doc.setTextColor(20, 100, 50);
        doc.text(p.label12, xR + kolW / 2, y + (regelH - 2) * 0.65, { align: 'center' });
      });

      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);

      return yStart + paren.length * regelH + 6;
    },

    leesInstellingen(subtype) {
      if (subtype === '24u') return this.leesInstellingen24u();

      const moeilijkheden = Array.from(
        document.querySelectorAll('input[name="verbMoeilijkheid"]:checked')
      ).map(cb => cb.value);

      if (moeilijkheden.length === 0) {
        document.getElementById('meldingVerbinden').textContent = 'Kies minstens één moeilijkheidsgraad!';
        return null;
      }
      document.getElementById('meldingVerbinden').textContent = '';

      const aantalRijen  = parseInt(document.getElementById('verbAantalRijen').value) || 2;
      const notatie      = document.querySelector('input[name="verbNotatie"]:checked')?.value || 'digitaal12';
      const toonHulp     = document.getElementById('verbHulpminuten')?.checked || false;

      const rijen = [];
      for (let r = 0; r < aantalRijen; r++) {
        const tijden   = genereerRij(moeilijkheden);
        const volgorde = shuffleInPlace([0, 1, 2, 3]);
        rijen.push({ tijden, volgorde });
      }

      return { type: 'verbinden', moeilijkheden, notatie, toonHulpminuten: toonHulp, aantalRijen, rijen };
    },

    tekenInPdf(doc, instellingen, yStart, margin, nieuweOpdrachtzinPagina) {
      const pageW  = doc.internal.pageSize.getWidth();
      const pageH  = doc.internal.pageSize.getHeight();
      const breedte = pageW - 2 * margin;
      let y = yStart;

      instellingen.rijen.forEach((rij, ri) => {
        // Check: past deze rij nog op de pagina?
        const passtNog = y + RIJ_H + margin <= pageH;
        if (!passtNog) {
          doc.addPage();
          y = nieuweOpdrachtzinPagina(doc);
        }
        const kaderH = tekenRijPdf(doc, rij.tijden, rij.volgorde, instellingen.notatie,
                    instellingen.toonHulpminuten, margin, y, breedte, ri);
        y += kaderH + 4; // 4mm witruimte tussen rijen
      });

      return y;
    },
  };

})();

/* ══════════════════════════════════════════════════════════════
   KlokTijdverschil — module
   Leerplandoel: tijdsverschil berekenen tot op 5 min, binnen 1 uur,
                 zonder overschrijding van het uur
   Lay-out: 2 analoge klokken naast elkaar + invulvak voor verschil
   ══════════════════════════════════════════════════════════════ */

const KlokTijdverschil = (() => {

  // ── Oefening genereren ────────────────────────────────────────
  function genereerOefening(moeilijkheden, metHulplijn) {
    const per5 = moeilijkheden.includes('5minuten');
    const stap = per5 ? 5 : 1;

    // Kies willekeurig beginuur (1-12) en beginminuut
    const uur = Math.floor(Math.random() * 12) + 1;
    const maxBegin = 55 - stap; // zodat eindtijd altijd < 60 min
    const beginMinStappen = Math.floor(Math.random() * (maxBegin / stap));
    const beginMin = beginMinStappen * stap;

    // Kies verschil: minstens 5 min, hoogstens de rest van het uur
    const restStappen = Math.floor((60 - beginMin - stap) / stap);
    const verschilStappen = Math.floor(Math.random() * restStappen) + 1;
    const verschil = verschilStappen * stap;
    const eindMin = beginMin + verschil;

    return { uur, beginMin, eindMin, verschil, metHulplijn };
  }

  // ── Hulpgetallenlijn tekenen ──────────────────────────────────
  function tekenHulplijnPdf(doc, x, y, breedte, beginMin, eindMin, uur) {
    const lijnH = 8;
    const pijlY = y + lijnH / 2;

    // Horizontale lijn
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.5);
    doc.line(x, pijlY, x + breedte, pijlY);

    // Pijlpunten
    doc.line(x + breedte - 2, pijlY - 1.5, x + breedte, pijlY);
    doc.line(x + breedte - 2, pijlY + 1.5, x + breedte, pijlY);

    // Beginpunt
    doc.setFillColor(60, 60, 60);
    doc.circle(x + 5, pijlY, 1, 'F');
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text(`${uur}:${beginMin.toString().padStart(2,'0')}`, x + 5, pijlY + 4, { align: 'center' });

    // Eindpunt
    doc.circle(x + breedte - 8, pijlY, 1, 'F');
    doc.text(`${uur}:${eindMin.toString().padStart(2,'0')}`, x + breedte - 8, pijlY + 4, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    return lijnH + 6;
  }

  // ── Canvas klok tekenen (hergebruikt van KlokLezen canvas) ────
  // We tekenen de klok als klein canvas-element in de preview
  function tekenKlokCanvas(canvas, uur, minuut) {
    const ctx = canvas.getContext('2d');
    const r   = canvas.width / 2 - 2;
    const cx  = canvas.width / 2;
    const cy  = canvas.height / 2;

    // Buitenring
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fillStyle = '#A9D8E8'; ctx.fill();

    // Wijzerplaat
    const ri = r * 0.88;
    ctx.beginPath(); ctx.arc(cx, cy, ri, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff'; ctx.fill();

    // Alle 60 minuutstreepjes
    for (let i = 0; i < 60; i++) {
      const hoek = (i - 15) * Math.PI / 30;
      const buit = ri;
      const binn = i % 5 === 0 ? ri * 0.87 : ri * 0.93;
      ctx.lineWidth = i % 5 === 0 ? 1.5 : 0.8;
      ctx.strokeStyle = '#444';
      ctx.beginPath();
      ctx.moveTo(cx + buit * Math.cos(hoek), cy + buit * Math.sin(hoek));
      ctx.lineTo(cx + binn * Math.cos(hoek), cy + binn * Math.sin(hoek));
      ctx.stroke();
    }
    ctx.font = `bold ${Math.round(ri * 0.22)}px Arial`;
    ctx.fillStyle = '#448866'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let u = 1; u <= 12; u++) {
      const hoek = (u - 3) * Math.PI / 6;
      ctx.fillText(u.toString(), cx + ri * 0.75 * Math.cos(hoek), cy + ri * 0.75 * Math.sin(hoek));
    }

    // Wijzers
    ctx.lineCap = 'round';
    const uurH = ((uur % 12) + minuut / 60 - 3) * Math.PI / 6;
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.lineTo(cx + ri * 0.55 * Math.cos(uurH), cy + ri * 0.55 * Math.sin(uurH)); ctx.stroke();

    const minH = (minuut - 15) * Math.PI / 30;
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.lineTo(cx + ri * 0.82 * Math.cos(minH), cy + ri * 0.82 * Math.sin(minH)); ctx.stroke();

    // Middenpunt
    ctx.beginPath(); ctx.arc(cx, cy, 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#333'; ctx.fill();
  }

  // ── HTML preview ──────────────────────────────────────────────
  function tekenPreviewHtml(container, instellingen) {
    if (!container || !instellingen) return;
    container.innerHTML = '';
    const { oefeningen, metNotatie } = instellingen;

    // Grid van 2 kolommen
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;';

    oefeningen.forEach((oef, i) => {
      const cel = document.createElement('div');
      cel.style.cssText = 'border:1px solid #dde8f5;border-radius:8px;padding:8px;background:#fafcff;';

      // Klokken rij
      const klokRij = document.createElement('div');
      klokRij.style.cssText = 'display:flex;align-items:center;gap:6px;justify-content:center;';

      // Klok 1 met notatie eronder
      const klok1Wrap = document.createElement('div');
      klok1Wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;';
      const cvs1 = document.createElement('canvas');
      cvs1.width = cvs1.height = 90;
      cvs1.className = 'klok-vast';
      cvs1.style.cssText = 'flex-shrink:0;';
      klok1Wrap.appendChild(cvs1);
      if (metNotatie) {
        const n1 = document.createElement('div');
        n1.style.cssText = 'font-size:12px;color:#666;letter-spacing:2px;';
        n1.textContent = '__ : __';
        klok1Wrap.appendChild(n1);
      }

      const pijl = document.createElement('div');
      pijl.style.cssText = 'color:#4A90D9;font-size:14px;flex-shrink:0;align-self:center;';
      pijl.textContent = '▶';

      // Klok 2 met notatie eronder
      const klok2Wrap = document.createElement('div');
      klok2Wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;';
      const cvs2 = document.createElement('canvas');
      cvs2.width = cvs2.height = 90;
      cvs2.className = 'klok-vast';
      cvs2.style.cssText = 'flex-shrink:0;';
      klok2Wrap.appendChild(cvs2);
      if (metNotatie) {
        const n2 = document.createElement('div');
        n2.style.cssText = 'font-size:12px;color:#666;letter-spacing:2px;';
        n2.textContent = '__ : __';
        klok2Wrap.appendChild(n2);
      }

      klokRij.appendChild(klok1Wrap);
      klokRij.appendChild(pijl);
      klokRij.appendChild(klok2Wrap);
      cel.appendChild(klokRij);

      // Invulvak
      const invul = document.createElement('div');
      invul.style.cssText = 'text-align:center;margin-top:6px;font-size:12px;color:#555;';
      invul.innerHTML = `Verschil: <span style="border-bottom:2px solid #333;display:inline-block;width:40px;"></span> min.`;
      cel.appendChild(invul);
      grid.appendChild(cel);

      // Teken klokken na insert met vaste grootte
      setTimeout(() => {
        tekenKlokCanvas(cvs1, oef.uur, oef.beginMin);
        tekenKlokCanvas(cvs2, oef.uur, oef.eindMin);
      }, 10);
    });

    container.appendChild(grid);
  }

  // ── PDF tekenen ───────────────────────────────────────────────
  function tekenInPdf(doc, instellingen, yStart, margin, hulpCanvas) {
    const { oefeningen, metNotatie } = instellingen;
    const pageW   = doc.internal.pageSize.getWidth();
    const pageH   = doc.internal.pageSize.getHeight();
    const breedte = pageW - 2 * margin;
    const cols    = 2;
    const colW    = (breedte - 8) / cols;
    const klokD   = 34;
    const notatieH = metNotatie ? 10 : 0; // ruimte voor tijdnotatie onder klok
    const oefH    = klokD + 20 + notatieH; // klok + invulvak + optioneel notatie
    let y = yStart;

    for (let i = 0; i < oefeningen.length; i += cols) {
      const benodigdH = oefH + (oefeningen[i]?.metHulplijn ? 18 : 0);
      if (y + benodigdH + margin > pageH) break;

      for (let k = 0; k < cols; k++) {
        const oef = oefeningen[i + k];
        if (!oef) break;

        const x0    = margin + k * (colW + 8);
        const klokR = klokD / 2;
        const klokY = y + klokR + 4;

        // Kader
        doc.setFillColor(250, 252, 255);
        doc.setDrawColor(180, 200, 230);
        doc.setLineWidth(0.3);
        doc.roundedRect(x0, y, colW, oefH, 2, 2, 'FD');

        // Begin klok
        const klok1X = x0 + colW * 0.22;
        tekenKlokPdfIntern(doc, klok1X, klokY, klokR, oef.uur, oef.beginMin);

        // Pijl — start net na klok1, eindigt net voor klok2
        const pijlMid = klokY;
        const pijlX1  = klok1X + klokR + 2;   // net na rechterkant klok1
        const pijlX2  = x0 + colW * 0.78 - klokR - 2; // net voor linkerkant klok2
        doc.setDrawColor(74, 144, 217);
        doc.setLineWidth(0.7);
        doc.line(pijlX1, pijlMid, pijlX2, pijlMid);
        doc.line(pijlX2 - 1.5, pijlMid - 1.2, pijlX2, pijlMid);
        doc.line(pijlX2 - 1.5, pijlMid + 1.2, pijlX2, pijlMid);

        // Eind klok
        const klok2X = x0 + colW * 0.78;
        tekenKlokPdfIntern(doc, klok2X, klokY, klokR, oef.uur, oef.eindMin);

        // Tijdnotatie onder klokken
        if (metNotatie) {
          const notY = klokY + klokR + 6;
          doc.setFontSize(8);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(80, 80, 80);
          doc.setDrawColor(80, 80, 80);
          doc.setLineWidth(0.5);
          // Links: __  :  __
          doc.line(klok1X - 10, notY + 1.5, klok1X - 3, notY + 1.5);
          doc.text(':', klok1X, notY + 0.5, { align: 'center' });
          doc.line(klok1X + 3, notY + 1.5, klok1X + 10, notY + 1.5);
          // Rechts: __  :  __
          doc.line(klok2X - 10, notY + 1.5, klok2X - 3, notY + 1.5);
          doc.text(':', klok2X, notY + 0.5, { align: 'center' });
          doc.line(klok2X + 3, notY + 1.5, klok2X + 10, notY + 1.5);
          doc.setTextColor(0, 0, 0);
        }

        // Invulvak verschil
        const invulY = y + oefH - 7;
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text('Verschil:', x0 + colW * 0.32, invulY, { align: 'right' });
        doc.setDrawColor(80, 80, 80);
        doc.setLineWidth(0.5);
        doc.line(x0 + colW * 0.34, invulY + 0.5, x0 + colW * 0.66, invulY + 0.5);
        doc.text('min.', x0 + colW * 0.68, invulY);
        doc.setTextColor(0, 0, 0);
      }

      y += oefH + 6;

      // Hulpgetallenlijn
      if (oefeningen[i]?.metHulplijn) {
        for (let k = 0; k < cols; k++) {
          const oef = oefeningen[i + k];
          if (!oef) break;
          const x0 = margin + k * (colW + 8);
          tekenHulplijnPdf(doc, x0, y, colW, oef.beginMin, oef.eindMin, oef.uur);
        }
        y += 18;
      }
    }

    return y;
  }

  function tekenKlokPdfIntern(doc, cx, cy, r, uur, minuut) {
    const ri = r * 0.88;

    doc.setFillColor(169, 216, 232);
    doc.circle(cx, cy, r, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(cx, cy, ri, 'F');

    // Alle 60 minuutstreepjes
    doc.setDrawColor(80, 80, 80);
    for (let i = 0; i < 60; i++) {
      const hoek = (i - 15) * Math.PI / 30;
      const buit = ri;
      const binn = i % 5 === 0 ? ri * 0.87 : ri * 0.93;
      doc.setLineWidth(i % 5 === 0 ? 0.4 : 0.15);
      doc.line(cx + buit * Math.cos(hoek), cy + buit * Math.sin(hoek),
               cx + binn * Math.cos(hoek), cy + binn * Math.sin(hoek));
    }

    // Cijfers
    doc.setFontSize(5);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(60, 140, 100);
    for (let u = 1; u <= 12; u++) {
      const hoek = (u - 3) * Math.PI / 6;
      doc.text(u.toString(), cx + ri * 0.72 * Math.cos(hoek),
               cy + ri * 0.72 * Math.sin(hoek) + 0.6, { align: 'center' });
    }

    // Wijzers
    doc.setTextColor(0, 0, 0);
    const uurH = ((uur % 12) + minuut / 60 - 3) * Math.PI / 6;
    doc.setDrawColor(50, 50, 50); doc.setLineWidth(0.7);
    doc.line(cx, cy, cx + ri * 0.55 * Math.cos(uurH), cy + ri * 0.55 * Math.sin(uurH));
    const minH = (minuut - 15) * Math.PI / 30;
    doc.setLineWidth(0.45);
    doc.line(cx, cy, cx + ri * 0.80 * Math.cos(minH), cy + ri * 0.80 * Math.sin(minH));
    doc.setFillColor(50, 50, 50); doc.circle(cx, cy, 0.5, 'F');
    doc.setFont(undefined, 'normal');
  }

  // ── Publieke API ──────────────────────────────────────────────
  return {

    leesInstellingen() {
      const moeilijkheden = Array.from(
        document.querySelectorAll('input[name="tvMoeilijkheid"]:checked')
      ).map(cb => cb.value);

      if (moeilijkheden.length === 0) {
        document.getElementById('meldingTijdverschil').textContent = 'Kies minstens één optie!';
        return null;
      }
      document.getElementById('meldingTijdverschil').textContent = '';

      const aantalOef  = parseInt(document.getElementById('tvAantalOef').value) || 6;
      const metHulp    = document.getElementById('tvHulplijn')?.checked || false;
      const metNotatie = document.getElementById('tvNotatie')?.checked || false;

      const oefeningen = [];
      for (let i = 0; i < aantalOef; i++) {
        oefeningen.push(genereerOefening(moeilijkheden, metHulp));
      }

      return { type: 'tijdverschil', moeilijkheden, aantalOef, metHulplijn: metHulp, metNotatie, oefeningen };
    },

    tekenPreviewHtml,
    tekenInPdf,
  };

})();

/* ══════════════════════════════════════════════════════════════
   KlokOrdenen — module
   Verantwoordelijkheid: dagdelen-inkleuroefening genereren
   Lay-out: legenda bovenaan, wekkers in raster met kleine rotatie
   ══════════════════════════════════════════════════════════════ */

const KlokOrdenen = (() => {

  // ── Dagdeel-definitie ─────────────────────────────────────────
  // Grenzen in minuten vanaf middernacht (0 = 0:00, 360 = 6:00, ...)
  const DAGDELEN = [
    { id: 'ochtend',    label: 'Ochtend',    van: 360,  tot: 540,  kleur: [255, 220,  50] }, // geel
    { id: 'voormiddag', label: 'Voormiddag', van: 540,  tot: 720,  kleur: [255, 150,  40] }, // oranje
    { id: 'middaguur',  label: 'Middaguur',  van: 720,  tot: 780,  kleur: [220,  60,  60] }, // rood
    { id: 'namiddag',   label: 'Namiddag',   van: 780,  tot: 1080, kleur: [ 60, 180,  80] }, // groen
    { id: 'avond',      label: 'Avond',      van: 1080, tot: 1320, kleur: [ 60, 120, 210] }, // blauw
    { id: 'nacht',      label: 'Nacht',      van: 1320, tot: 1800, kleur: [ 90,  60, 160] }, // paars (1320=22u, 1800=30u=6u volgende dag)
  ];

  function minNaarDagdeel(grenzen, totaalMinuten) {
    // totaalMinuten: 0-1439 (0=0:00, 360=6:00, ...)
    // Nacht: 22u-6u = 1320-1440 of 0-360
    const dd = grenzen.find(g => {
      if (g.id === 'nacht') return totaalMinuten >= 1320 || totaalMinuten < 360;
      return totaalMinuten >= g.van && totaalMinuten < g.tot;
    });
    return dd || grenzen[0];
  }

  function uurMinNaarMin(uur24, minuut) {
    return uur24 * 60 + minuut;
  }

  // ── Tijden genereren voor alle dagdelen ───────────────────────
  function genereerWekkers(grenzen, aantalWekkers, per5min) {
    const wekkers = [];
    const minPerDagdeel = Math.floor(aantalWekkers / grenzen.length);
    const rest = aantalWekkers % grenzen.length;
    const gekozenDagdelen = [...grenzen];

    gekozenDagdelen.forEach((dd, idx) => {
      const n = minPerDagdeel + (idx < rest ? 1 : 0);
      const gebruikte = new Set();

      for (let i = 0; i < n; i++) {
        let uur24, minuut, key;
        let pogingen = 0;
        do {
          // Genereer een tijd binnen dit dagdeel
          let vanMin = dd.id === 'nacht' ? 1320 : dd.van;
          let totMin = dd.id === 'nacht' ? 1440 : dd.tot;
          const bereik = totMin - vanMin;
          const stap = per5min ? 5 : 60;
          const aantalStappen = Math.floor(bereik / stap);
          const gekozenStap = Math.floor(Math.random() * aantalStappen);
          const totaalMin = (vanMin + gekozenStap * stap) % 1440;
          uur24 = Math.floor(totaalMin / 60);
          minuut = totaalMin % 60;
          key = `${uur24}:${minuut}`;
          pogingen++;
        } while (gebruikte.has(key) && pogingen < 50);

        gebruikte.add(key);
        wekkers.push({ uur24, minuut, dagdeel: dd });
      }
    });

    // Schud door elkaar
    for (let i = wekkers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [wekkers[i], wekkers[j]] = [wekkers[j], wekkers[i]];
    }
    return wekkers;
  }

  // ── PDF tekenen ───────────────────────────────────────────────

  // Teken wekker-silhouet op PDF (vereenvoudigd zonder afbeelding)
  function tekenWekkerPdf(doc, x, y, breedte, hoogte, uur24, minuut, rotatie) {
    doc.saveGraphicsState();

    const cx = x + breedte / 2;

    // Wekker-body — WIT van binnen zodat kinderen kunnen inkleuren
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(100, 160, 200);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, breedte, hoogte * 0.75, 2, 2, 'FD');

    // Scherm (display) — ook wit
    const schermX = x + breedte * 0.1;
    const schermY = y + hoogte * 0.12;
    const schermW = breedte * 0.8;
    const schermH = hoogte * 0.38;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(120, 160, 200);
    doc.setLineWidth(0.4);
    doc.roundedRect(schermX, schermY, schermW, schermH, 1, 1, 'FD');

    // Tijd op het scherm — font 14pt
    const tijdTekst = `${uur24.toString().padStart(2,'0')}:${minuut.toString().padStart(2,'0')}`;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 60, 120);
    doc.text(tijdTekst, schermX + schermW / 2, schermY + schermH * 0.72, { align: 'center' });
    doc.setFont(undefined, 'normal');

    // Pootjes
    doc.setFillColor(100, 140, 180);
    doc.setDrawColor(100, 140, 180);
    const pootW = breedte * 0.12;
    const pootH = hoogte * 0.15;
    const pootY = y + hoogte * 0.75 - 0.5;
    doc.roundedRect(x + breedte * 0.12, pootY, pootW, pootH, 1, 1, 'F');
    doc.roundedRect(x + breedte * 0.76, pootY, pootW, pootH, 1, 1, 'F');

    // Belletje + knopje bovenop
    doc.setFillColor(100, 140, 180);
    doc.circle(cx, y - 1.5, 2, 'F');
    doc.setFillColor(150, 180, 210);
    doc.circle(cx, y - 1.5, 0.8, 'F');

    doc.restoreGraphicsState();
  }

  // Legenda tekenen
  function tekenLegendaPdf(doc, grenzen, toonGrenzen, margin, y, pageW) {
    const breedte = pageW - 2 * margin;
    const vakW = breedte / grenzen.length;
    const vakH = toonGrenzen ? 11 : 9;

    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');

    grenzen.forEach((dd, i) => {
      const x = margin + i * vakW;
      const [r, g, b] = dd.kleur;

      doc.setFillColor(r, g, b);
      doc.setDrawColor(r * 0.7, g * 0.7, b * 0.7);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, vakW - 1, vakH, 1, 1, 'FD');

      const licht = (r * 0.299 + g * 0.587 + b * 0.114) > 150;
      doc.setTextColor(licht ? 40 : 255, licht ? 40 : 255, licht ? 40 : 255);

      const vanUur = dd.id === 'nacht' ? 22 : Math.floor(dd.van / 60);
      const totUur = dd.id === 'nacht' ? 6 : Math.floor(dd.tot / 60);

      if (toonGrenzen) {
        doc.text(dd.label, x + (vakW - 1) / 2, y + vakH * 0.42, { align: 'center' });
        doc.setFontSize(7.5); doc.setFont(undefined, 'normal');
        doc.text(`${vanUur}u-${totUur}u`, x + (vakW - 1) / 2, y + vakH * 0.82, { align: 'center' });
        doc.setFontSize(9); doc.setFont(undefined, 'bold');
      } else {
        doc.text(dd.label, x + (vakW - 1) / 2, y + vakH * 0.62, { align: 'center' });
      }
    });

    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    return y + vakH + 10;
  }

  // ── HTML preview ─────────────────────────────────────────────
  function tekenPreviewHtml(container, instellingen) {
    if (!container || !instellingen) return;
    container.innerHTML = '';

    const { wekkers, grenzen } = instellingen;

    // Legenda
    const legenda = document.createElement('div');
    legenda.style.cssText = 'display:flex;gap:4px;margin-bottom:10px;flex-wrap:wrap;';
    grenzen.forEach(dd => {
      const [r, g, b] = dd.kleur;
      const licht = (r * 0.299 + g * 0.587 + b * 0.114) > 150;
      const item = document.createElement('div');
      item.style.cssText = `background:rgb(${r},${g},${b});color:${licht?'#222':'#fff'};padding:3px 8px;border-radius:12px;font-size:11px;font-weight:700;`;
      const vanUur = dd.id === 'nacht' ? 22 : Math.floor(dd.van / 60);
      const totUur = dd.id === 'nacht' ? 6 : Math.floor(dd.tot / 60);
      item.textContent = instellingen.toonGrenzen
        ? `${dd.label} (${vanUur}u-${totUur}u)`
        : dd.label;
      legenda.appendChild(item);
    });
    container.appendChild(legenda);

    // Wekkers in raster
    const raster = document.createElement('div');
    raster.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:8px;';

    wekkers.forEach(w => {
      const cel = document.createElement('div');
      const rot = (Math.random() * 10 - 5).toFixed(1);
      cel.style.cssText = `background:#fff;border:2px solid #90bce0;border-radius:8px;padding:6px 6px 4px;
        text-align:center;transform:rotate(${rot}deg);box-shadow:1px 2px 4px rgba(0,0,0,0.1);`;

      // Display scherm (wit, zoals PDF)
      const display = document.createElement('div');
      display.style.cssText = `background:#fff;border:1.5px solid #90bce0;border-radius:4px;
        font-size:15px;font-weight:bold;color:#1a3a6c;padding:5px 6px;margin-bottom:4px;`;
      display.textContent = `${w.uur24.toString().padStart(2,'0')}:${w.minuut.toString().padStart(2,'0')}`;

      // Pootjes (decoratief)
      const pootjes = document.createElement('div');
      pootjes.style.cssText = 'display:flex;justify-content:space-between;padding:0 6px;';
      pootjes.innerHTML = `<div style="width:10px;height:6px;background:#90bce0;border-radius:0 0 3px 3px;"></div>
                           <div style="width:10px;height:6px;background:#90bce0;border-radius:0 0 3px 3px;"></div>`;

      cel.appendChild(display);
      cel.appendChild(pootjes);
      raster.appendChild(cel);
    });
    container.appendChild(raster);
  }

  // ── Publieke API ──────────────────────────────────────────────
  return {

    DAGDELEN,

    leesInstellingen() {
      const aantalWekkers = parseInt(document.getElementById('ordAantalWekkers').value) || 12;
      const per5min       = document.getElementById('ordPer5min')?.checked || false;
      const toonGrenzen   = document.getElementById('ordToonGrenzen')?.checked ?? true;

      // Lees instelbare dagdeelgrenzen
      const grenzen = DAGDELEN.map(dd => {
        const vanEl = document.getElementById(`ord_van_${dd.id}`);
        const totEl = document.getElementById(`ord_tot_${dd.id}`);
        const van = vanEl ? parseInt(vanEl.value) * 60 : dd.van;
        const tot = totEl ? parseInt(totEl.value) * 60 : dd.tot;
        return { ...dd, van, tot };
      });

      const wekkers = genereerWekkers(grenzen, aantalWekkers, per5min);

      document.getElementById('meldingOrdenen').textContent = '';
      return { type: 'ordenen', aantalWekkers, per5min, toonGrenzen, grenzen, wekkers };
    },

    tekenPreviewHtml,

    tekenInPdf(doc, instellingen, yStart, margin) {
      const { wekkers, grenzen } = instellingen;
      const pageW   = doc.internal.pageSize.getWidth();
      const pageH   = doc.internal.pageSize.getHeight();
      const breedte = pageW - 2 * margin;

      let y = tekenLegendaPdf(doc, grenzen, instellingen.toonGrenzen ?? true, margin, yStart, pageW);

      // Wekkers in 4×n raster
      const cols    = 4;
      const wekkerW = (breedte - (cols - 1) * 3) / cols;
      const wekkerH = wekkerW * 0.65;
      const rasterPadding = 3;

      wekkers.forEach((w, i) => {
        const col = i % cols;
        const rij = Math.floor(i / cols);

        // Nieuwe pagina nodig?
        if (i > 0 && col === 0) {
          const rijY = y + rij * (wekkerH + rasterPadding);
          if (rijY + wekkerH + margin > pageH) {
            doc.addPage();
            y = yStart;
          }
        }

        const wx = margin + col * (wekkerW + rasterPadding);
        const wy = y + Math.floor(i / cols) * (wekkerH + rasterPadding);

        // Kleine willekeurige rotatie (beperkt — jsPDF heeft geen echte shape-rotatie)
        const rotaties = [-4, -2, 0, 2, 4, -3, 3, -1, 1];
        const rot = rotaties[i % rotaties.length];

        tekenWekkerPdf(doc, wx, wy, wekkerW, wekkerH, w.uur24, w.minuut, rot);

        // Kleurstrookje onderaan wekker (invulzone)
        const [r, g, b] = w.dagdeel.kleur;
        // Toon enkel een lege strook — kinderen kleuren de wekker zelf in
        // (in de PDF tonen we GEEN kleur, enkel een lege wekker)
      });

      const aantalRijen = Math.ceil(wekkers.length / cols);
      return y + aantalRijen * (wekkerH + rasterPadding);
    },
  };

})();

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
  // Voor kloklezen: elke klok wordt een apart item in de bundel,
  // maar gegroepeerd onder dezelfde groep-id (voor opdrachtzin + PDF-blok)
  function voegToe(instellingen, opdrachtzinOverride) {
    if (!instellingen) return;
    const opdrachtzin = opdrachtzinOverride || getOpdrachtzin(instellingen);
    const groepId = volgendeId++;

    if (instellingen.type === 'kloklezen') {
      // Elke klok = apart item, zelfde instellingen maar met 1 tijd
      instellingen.tijden.forEach(tijd => {
        const klokInst = { ...instellingen, numClocks: 1, tijden: [tijd] };
        oefeningen.push({ id: volgendeId++, groepId, type: 'kloklezen', opdrachtzin, instellingen: klokInst, basisInstellingen: instellingen });
      });
    } else {
      // Maateenheden, verbinden en andere types: als één blok opslaan
      oefeningen.push({ id: groepId, groepId, type: instellingen.type, opdrachtzin, instellingen });
    }

    renderAlles();
    const aantalKlokken = instellingen.type === 'kloklezen' ? instellingen.tijden.length : '';
    toonMelding(`✓ ${aantalKlokken ? aantalKlokken + ' klokken' : 'Oefening'} toegevoegd`);
  }

  // ── Eén klok toevoegen aan een bestaande groep ───────────────
  function voegKlokToe(groepId) {
    // Zoek de groep en haar basisinstellingen
    const eerstVanGroep = oefeningen.find(o => o.groepId === groepId && o.type === 'kloklezen');
    if (!eerstVanGroep) return;
    const inst = eerstVanGroep.basisInstellingen;
    // Genereer 1 nieuwe tijd
    const nieuweTijd = KlokLezen.genereerEenTijd(inst.moeilijkheden);
    const klokInst   = { ...inst, numClocks: 1, tijden: [nieuweTijd] };
    // Voeg in na de laatste van deze groep
    const laatste = [...oefeningen].reverse().findIndex(o => o.groepId === groepId);
    const invoegIndex = oefeningen.length - laatste;
    oefeningen.splice(invoegIndex, 0, {
      id: volgendeId++, groepId, type: 'kloklezen',
      opdrachtzin: eerstVanGroep.opdrachtzin,
      instellingen: klokInst,
      basisInstellingen: inst,
    });
    renderAlles();
    toonMelding('✓ Extra klok toegevoegd');
  }

  // ── Oefening/klok verwijderen ─────────────────────────────────
  function verwijder(id) {
    oefeningen = oefeningen.filter(o => o.id !== id);
    renderAlles();
  }

  // ── Hele groep verwijderen ────────────────────────────────────
  function verwijderGroep(groepId) {
    oefeningen = oefeningen.filter(o => o.groepId !== groepId);
    renderAlles();
  }

  // ── Alles renderen ────────────────────────────────────────────
  function renderAlles() {
    renderZijpaneel();
    renderVisuelePreview();
  }

  // ── Zijpaneel rechts: niet meer aanwezig, enkel melding bijwerken ─
  function renderZijpaneel() {
    // Teller in toolbar tonen
    const melding = document.getElementById('bundelMelding');
    if (melding && oefeningen.length > 0) {
      const groepen = new Set(oefeningen.map(o => o.groepId)).size;
      melding.textContent = `${groepen} oefening${groepen !== 1 ? 'en' : ''} · ${oefeningen.length} klokken`;
    } else if (melding) {
      melding.textContent = '';
    }
  }

  // ── Visuele preview midden ────────────────────────────────────
  function renderVisuelePreview() {
    const container = document.getElementById('bundelPreview');
    if (!container) return;
    container.innerHTML = '';

    if (oefeningen.length === 0) {
      container.innerHTML = `
        <div class="preview-leeg">
          <div style="font-size:48px;margin-bottom:12px;">📋</div>
          <p>Je bundel is nog leeg.<br>Stel een oefening in links en klik <strong>➕ Voeg toe</strong>.</p>
        </div>`;
      return;
    }

    // Groepeer oefeningen per groepId
    const groepen = [];
    const gezien  = new Set();
    oefeningen.forEach(oef => {
      if (!gezien.has(oef.groepId)) {
        gezien.add(oef.groepId);
        groepen.push({ groepId: oef.groepId, type: oef.type, opdrachtzin: oef.opdrachtzin, items: [] });
      }
      groepen.find(g => g.groepId === oef.groepId).items.push(oef);
    });

    groepen.forEach((groep, gi) => {
      const blok = document.createElement('div');
      blok.className = 'preview-blok';

      // Header
      const aantalLabel = groep.type === 'kloklezen' ? ` — ${groep.items.length} klokken` : '';
      blok.innerHTML = `
        <div class="preview-blok-header">
          <span class="preview-blok-nr">Oefening ${gi + 1}${aantalLabel}</span>
          <span class="preview-blok-type">${typeLabel(groep.type, groep.items[0].instellingen, groep.items.length)}</span>
          <button class="preview-blok-verwijder" onclick="Bundel.verwijderGroep(${groep.groepId})">🗑 Verwijder oefening</button>
        </div>
        <div class="preview-opdracht">${groep.opdrachtzin}</div>
      `;

      if (groep.type === 'kloklezen') {
        const alleTijden    = groep.items.map(item => item.instellingen.tijden[0]);
        const basisInst     = groep.items[0].basisInstellingen || groep.items[0].instellingen;
        const groepeerdInst = { ...basisInst, numClocks: alleTijden.length, tijden: alleTijden };

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'position:relative;padding:8px;display:flex;justify-content:center;';

        const cvs = document.createElement('canvas');
        cvs.style.cssText = 'display:block;';  // Geen width:100% — eigen pixel-breedte
        wrapper.appendChild(cvs);

        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:absolute;top:8px;pointer-events:none;';
        wrapper.appendChild(overlay);

        blok.appendChild(wrapper);

        const toevoegRij = document.createElement('div');
        toevoegRij.style.cssText = 'padding:6px 12px;border-top:1px solid var(--border);text-align:center;';
        toevoegRij.innerHTML = `<button onclick="Bundel.voegKlokToe(${groep.groepId})" style="background:none;border:1.5px dashed #4A90D9;color:#4A90D9;border-radius:6px;padding:4px 12px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;margin:0;">＋ Klok toevoegen</button>`;
        blok.appendChild(toevoegRij);
        container.appendChild(blok);

        setTimeout(() => {
          const breedte = wrapper.clientWidth - 16;
          KlokLezen.tekenPreviewMetBreedte(cvs, groepeerdInst, breedte);

          // Overlay positioneren op de canvas (die gecentreerd staat)
          const canvasLeft = cvs.offsetLeft;
          overlay.style.left   = canvasLeft + 'px';
          overlay.style.width  = cvs.offsetWidth  + 'px';
          overlay.style.height = cvs.offsetHeight + 'px';

          // Vuilbakjes in rechterbovenhoek van elke cel
          overlay.innerHTML = '';
          const cols    = 3;
          const numRows = Math.ceil(alleTijden.length / cols);
          groep.items.forEach((item, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const btn = document.createElement('button');
            btn.textContent = '🗑';
            btn.title = 'Verwijder deze klok';
            btn.style.cssText = `
              position:absolute;
              right:${(cols - col - 1) / cols * 100 + 1}%;
              top:${row / numRows * 100 + 1}%;
              pointer-events:all;
              background:rgba(255,255,255,0.92);
              border:1px solid #fcc;color:#c00;
              border-radius:50%;width:20px;height:20px;
              cursor:pointer;font-size:10px;line-height:1;
              padding:0;margin:0;
              opacity:0;transition:opacity .15s;`;
            btn.onclick = () => Bundel.verwijder(item.id);
            blok.addEventListener('mouseenter', () => { btn.style.opacity = '1'; });
            blok.addEventListener('mouseleave', () => { btn.style.opacity = '0'; });
            overlay.appendChild(btn);
          });
        }, 50);

      } else if (groep.type === 'maateenheden') {
        const inhoud = document.createElement('div');
        inhoud.className = 'preview-inhoud';
        Maateenheden.tekenPreviewHtml(inhoud, groep.items[0].instellingen);
        const verwijderBtn = document.createElement('button');
        verwijderBtn.className = 'preview-blok-verwijder';
        verwijderBtn.textContent = '🗑 Verwijder oefening';
        verwijderBtn.onclick = () => Bundel.verwijderGroep(groep.items[0].groepId);
        inhoud.appendChild(verwijderBtn);
        blok.appendChild(inhoud);

      } else if (groep.type === 'verbinden24u') {
        const inhoud = document.createElement('div');
        inhoud.className = 'preview-inhoud';
        KlokVerbinden.tekenPreview24uHtml(inhoud, groep.items[0].instellingen);
        blok.appendChild(inhoud);

      } else if (groep.type === 'verbinden') {
        const inhoud = document.createElement('div');
        inhoud.className = 'preview-inhoud';
        // Teken elke rij apart met eigen verwijderknop
        groep.items[0].instellingen.rijen.forEach((rij, ri) => {
          const rijWrap = document.createElement('div');
          rijWrap.style.cssText = 'position:relative;border:1px solid #dde8f5;border-radius:6px;padding:8px;margin-bottom:8px;background:#fafcff;';

          // Mini-preview van de rij
          const rijPreview = document.createElement('div');
          rijPreview.style.cssText = 'display:flex;gap:6px;';
          rij.tijden.forEach(t => {
            const cel = document.createElement('div');
            cel.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px;';
            cel.innerHTML = `
              <div style="width:40px;height:40px;border-radius:50%;border:2.5px solid #A9D8E8;background:#fff;display:flex;align-items:center;justify-content:center;font-size:9px;color:#448866;font-weight:bold;">${t.uur}:${t.minuut.toString().padStart(2,'0')}</div>
              <div style="width:5px;height:5px;border-radius:50%;background:#555;"></div>`;
            rijPreview.appendChild(cel);
          });

          // Labels geschud
          const labelRij = document.createElement('div');
          labelRij.style.cssText = 'display:flex;gap:6px;margin-top:4px;';
          rij.volgorde.forEach(idx => {
            const t = rij.tijden[idx];
            const cel = document.createElement('div');
            cel.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;';
            cel.innerHTML = `
              <div style="width:5px;height:5px;border-radius:50%;background:#555;"></div>
              <div style="font-size:11px;font-weight:bold;color:#1A3A5C;text-align:center;">${KlokVerbinden.formateerTijd(t.uur, t.minuut, groep.items[0].instellingen.notatie)}</div>`;
            labelRij.appendChild(cel);
          });

          // Verwijderknop voor deze rij
          const verwijderBtn = document.createElement('button');
          verwijderBtn.title = 'Verwijder deze rij';
          verwijderBtn.style.cssText = 'position:absolute;top:4px;right:4px;background:rgba(255,255,255,0.9);border:1px solid #fcc;color:#c00;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:10px;line-height:1;padding:0;margin:0;opacity:0;transition:opacity .15s;';
          verwijderBtn.textContent = '🗑';
          verwijderBtn.onclick = () => {
            // Verwijder deze rij uit de instellingen
            groep.items[0].instellingen.rijen.splice(ri, 1);
            if (groep.items[0].instellingen.rijen.length === 0) {
              Bundel.verwijderGroep(groep.groepId);
            } else {
              groep.items[0].instellingen.aantalRijen--;
              renderVisuelePreview();
            }
          };
          rijWrap.addEventListener('mouseenter', () => { verwijderBtn.style.opacity = '1'; });
          rijWrap.addEventListener('mouseleave', () => { verwijderBtn.style.opacity = '0'; });

          rijWrap.appendChild(rijPreview);
          rijWrap.appendChild(labelRij);
          rijWrap.appendChild(verwijderBtn);
          inhoud.appendChild(rijWrap);
        });
        blok.appendChild(inhoud);

      } else if (groep.type === 'tijdverschil') {
        const inhoud = document.createElement('div');
        inhoud.className = 'preview-inhoud';
        KlokTijdverschil.tekenPreviewHtml(inhoud, groep.items[0].instellingen);
        blok.appendChild(inhoud);

      } else if (groep.type === 'ordenen') {
        const inhoud = document.createElement('div');
        inhoud.className = 'preview-inhoud';
        KlokOrdenen.tekenPreviewHtml(inhoud, groep.items[0].instellingen);
        blok.appendChild(inhoud);
      }

      container.appendChild(blok);
    });
  }

  function typeLabel(type, inst, aantal) {
    if (type === 'kloklezen') {
      const notatie = inst.tijdnotatie === '24uur' ? '24u' : '12u';
      const methode = inst.invulmethode === 'analoog' ? 'zin' : 'wekker';
      return `🕐 Kloklezen — ${notatie}, ${methode}`;
    }
    if (type === 'maateenheden') {
      return `📏 Maateenheden — ${(inst.vragen||[]).length} vragen`;
    }
    if (type === 'tijdverschil') {
      return `⏱️ Tijdverschil — ${(inst.oefeningen||[]).length} oefeningen`;
    }
    if (type === 'ordenen') {
      return `📅 Dagdelen — ${(inst.wekkers||[]).length} wekkers`;
    }
    if (type === 'verbinden24u') {
      return `🔁 24u↔12u — ${inst.aantalParen} paren`;
    }
    if (type === 'verbinden') {
      const notatieLabel = { digitaal12:'12u', digitaal24:'24u', spreektaal:'spreektaal', zinA:'zin A', zinB:'zin B' }[inst.notatie] || inst.notatie;
      return `🔗 Verbinden — ${inst.aantalRijen} rijen, ${notatieLabel}`;
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

    // Keuze: titel op elke pagina of enkel pagina 1
    const titelElkePagina = document.getElementById('titelElkePagina')?.checked ?? true;

    // ── Volledige header (naam, datum, titel, lijn) ───────────
    function tekenVolleHeader() {
      const naamY = 16, titelY = 26, lijnY = 30;
      doc.setFontSize(12); doc.setFont(undefined, 'normal');
      doc.text("Naam: _______________________", margin, naamY, { align: 'left' });
      doc.text("Datum: _______________", pageW - margin, naamY, { align: 'right' });
      doc.setFontSize(14); doc.setFont(undefined, 'bold');
      doc.text("Oefenen op kloklezen", pageW / 2, titelY, { align: 'center' });
      doc.setFont(undefined, 'normal');
      doc.setDrawColor(100, 100, 100); doc.setLineWidth(0.4);
      doc.line(margin, lijnY, pageW - margin, lijnY);
      return 36; // y na header
    }

    // ── Kleine header (enkel naam+datum, geen grote titel) ────
    function tekenKleineHeader() {
      const naamY = 14;
      doc.setFontSize(11); doc.setFont(undefined, 'normal');
      doc.text("Naam: _______________________", margin, naamY, { align: 'left' });
      doc.text("Datum: _______________", pageW - margin, naamY, { align: 'right' });
      doc.setDrawColor(180, 200, 230); doc.setLineWidth(0.3);
      doc.line(margin, naamY + 4, pageW - margin, naamY + 4);
      return 22; // y na kleine header
    }

    function tekenHeader(isEerstePagina) {
      return (isEerstePagina || titelElkePagina)
        ? tekenVolleHeader()
        : tekenKleineHeader();
    }

    // ── Opdrachtzin in kader ──────────────────────────────────
    function tekenOpdrachtzin(doc, y, tekst) {
      const h = 10;
      doc.setFillColor(245, 248, 255);
      doc.setDrawColor(180, 200, 230);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin, y - 5, pageW - 2 * margin, h, 2, 2, 'FD');
      doc.setFontSize(14); doc.setFont(undefined, 'italic');
      doc.text(tekst, margin + 4, y + 1);
      doc.setFont(undefined, 'normal');
      return y + h; // y na kader
    }

    // ── Groepeer oefeningen ───────────────────────────────────
    const groepen = [];
    const gezien  = new Set();
    oefeningen.forEach(oef => {
      if (!gezien.has(oef.groepId)) {
        gezien.add(oef.groepId);
        groepen.push({ groepId: oef.groepId, type: oef.type, opdrachtzin: oef.opdrachtzin, items: [] });
      }
      groepen.find(g => g.groepId === oef.groepId).items.push(oef);
    });

    let isEerstePagina = true;
    let y = tekenHeader(true); // Start altijd met volle header

    groepen.forEach(groep => {

      // ── Callback voor nieuwe pagina binnen een groep ────────
      function nieuweVervolgpagina() {
        doc.addPage();
        isEerstePagina = false;
        const ny = tekenHeader(false);
        return tekenOpdrachtzin(doc, ny + 2, groep.opdrachtzin) + 2;
      }

      // ── Bereken hoeveel ruimte opdrachtzin + eerste blok nodig heeft ──
      const opdrachtzinH = 14; // kader + marge
      let eersteBlokH = 0;
      if (groep.type === 'kloklezen')    eersteBlokH = 60;
      if (groep.type === 'maateenheden') eersteBlokH = 30;
      if (groep.type === 'verbinden')    eersteBlokH = KlokVerbinden.RIJ_H;
      if (groep.type === 'tijdverschil') eersteBlokH = 50;
      if (groep.type === 'ordenen')      eersteBlokH = 50;

      const benodigdVoorStart = opdrachtzinH + eersteBlokH;

      // Pas op nieuwe pagina als opdrachtzin + eerste blok er niet meer bij passen,
      // OF als dit niet de eerste groep is
      const passtNogOpHuidigePagina = y + benodigdVoorStart + margin <= pageH;

      if (!isEerstePagina && !passtNogOpHuidigePagina) {
        doc.addPage();
        y = tekenHeader(false);
      } else if (!isEerstePagina) {
        y += 12; // witruimte tussen oefeningen op dezelfde pagina
      }

      isEerstePagina = false;

      // Opdrachtzin
      y = tekenOpdrachtzin(doc, y + 2, groep.opdrachtzin) + 2;

      if (groep.type === 'kloklezen') {
        const alleTijden = groep.items.map(item => item.instellingen.tijden[0]);
        const basisInst  = groep.items[0].basisInstellingen || groep.items[0].instellingen;
        const PER_PAGINA = 9;

        for (let start = 0; start < alleTijden.length; start += PER_PAGINA) {
          if (start > 0) {
            doc.addPage();
            y = tekenHeader(false);
            y = tekenOpdrachtzin(doc, y + 2, groep.opdrachtzin) + 2;
          }
          const pageTijden = alleTijden.slice(start, start + PER_PAGINA);
          const pageInst   = { ...basisInst, numClocks: pageTijden.length, tijden: pageTijden };
          KlokLezen.tekenInPdf(doc, pageInst, hulpCanvas, y, margin);
          y = pageH - margin; // bijna onderaan — volgende groep start op nieuwe pagina
        }

      } else if (groep.type === 'maateenheden') {
        Maateenheden.tekenInPdf(doc, groep.items[0].instellingen, y + 4, margin);
        y += 4 + Math.ceil(groep.items[0].instellingen.vragen.length / (groep.items[0].instellingen.kolommen || 2)) * 12;

      } else if (groep.type === 'tijdverschil') {
        y = KlokTijdverschil.tekenInPdf(doc, groep.items[0].instellingen, y, margin, hulpCanvas);

      } else if (groep.type === 'ordenen') {
        y = KlokOrdenen.tekenInPdf(doc, groep.items[0].instellingen, y, margin);

      } else if (groep.type === 'verbinden24u') {
        y = KlokVerbinden.tekenInPdf24u(doc, groep.items[0].instellingen, y, margin);

      } else if (groep.type === 'verbinden') {
        y = KlokVerbinden.tekenInPdf(doc, groep.items[0].instellingen, y, margin,
          () => {
            doc.addPage();
            const ny = tekenHeader(false);
            return tekenOpdrachtzin(doc, ny + 2, groep.opdrachtzin) + 2;
          }
        );
      }
    });

    doc.save('kloklezen_bundel.pdf');
  }

  // Helper: teken klokken-canvas op PDF op positie y
  function tekenOpCanvasPdf(instellingen, yStart, margin, doc, pageW, pageH) {
    // Gebruik KlokLezen.tekenInPdf maar met de hulpcanvas
    KlokLezen.tekenInPdf(doc, instellingen, hulpCanvas, yStart, margin);
  }

  // ── Publieke API ──────────────────────────────────────────────
  return {
    voegToe,
    verwijder,
    verwijderGroep,
    voegKlokToe,
    downloadPdf,
    renderVisuelePreview,
  };

})();

/* ══════════════════════════════════════════════════════════════
   UI — verbindt HTML met KlokLezen en Bundel
   ══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  const canvas = document.getElementById('mainCanvas');

  // ── Maateenheden: zin-chips dynamisch opbouwen ────────────────
  const maatzinGroep = document.getElementById('maatzinGroep');
  if (maatzinGroep) {
    Maateenheden.ALLE_ZINNEN.forEach(zin => {
      const chip = document.createElement('div');
      chip.className = 'checkbox-chip geselecteerd';
      chip.dataset.zinId = zin.id;
      const zinZonder = zin.zin.replace('{_}', '___');
      chip.innerHTML = `<input type="checkbox" name="maatzin" value="${zin.id}" checked/> ${zinZonder}`;
      maatzinGroep.appendChild(chip);
    });
    // Initiële preview
    genereerMaatPreview();
  }

  // ── Opdrachtzin aanpassen bij invulmethode-wijziging ─────────
  function updateOpdrachtzin() {
    const methode = document.querySelector('input[name="invulmethode"]:checked')?.value;
    const ta = document.getElementById('opdrachtzin');
    if (!ta) return;
    ta.value = methode === 'analoog'
      ? "Schrijf de tijd op als een zin."
      : "Schrijf de tijd op zoals op een digitale klok.";
  }

  // ── Voeg kloklezen toe aan bundel ─────────────────────────────
  document.getElementById('voegToeBtn')?.addEventListener('click', () => {
    const inst = KlokLezen.leesInstellingen();
    if (!inst) return;
    const opdrachtzin = document.getElementById('opdrachtzin').value.trim() || "Schrijf de tijd op.";
    Bundel.voegToe(inst, opdrachtzin);
  });

  document.getElementById('genereerBtn')?.addEventListener('click', () => {
    // Herlaad de instellingen (nieuwe tijden) maar toon geen apart canvas meer
    KlokLezen.leesInstellingen(); // valideert
  });

  document.getElementById('downloadPdfBtn').addEventListener('click', () => Bundel.downloadPdf());

  // ── Auto-update opdrachtzin ───────────────────────────────────
  document.querySelectorAll('input[name="invulmethode"]').forEach(el => {
    el.addEventListener('change', updateOpdrachtzin);
  });

  // ── Tabs ──────────────────────────────────────────────────────
  window.toonTab = function(naam, tabEl) {
    document.querySelectorAll('.sidebar-content').forEach(el => el.classList.remove('actief'));
    document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + naam).classList.add('actief');
    tabEl.classList.add('active');
    const tabs = document.getElementById('sidebarTabs');
    tabs.scrollTo({ left: Math.max(0, tabEl.offsetLeft - tabs.offsetWidth / 2 + tabEl.offsetWidth / 2), behavior: 'smooth' });
  };
  window.scrollTabsLeft  = () => document.getElementById('sidebarTabs').scrollBy({ left: -120, behavior: 'smooth' });
  window.scrollTabsRight = () => document.getElementById('sidebarTabs').scrollBy({ left:  120, behavior: 'smooth' });

  // ── Chips ─────────────────────────────────────────────────────
  function syncChips() {
    document.querySelectorAll('.checkbox-chip').forEach(chip => {
      const cb = chip.querySelector('input[type="checkbox"]');
      if (cb) chip.classList.toggle('geselecteerd', cb.checked);
    });
    document.querySelectorAll('.radio-chip').forEach(chip => {
      const rb = chip.querySelector('input[type="radio"]');
      if (rb) chip.classList.toggle('geselecteerd', rb.checked);
    });
  }

  function updateAllesChip() {
    const alle = Array.from(document.querySelectorAll('input[name="moeilijkheid"]'));
    const alleAan = alle.every(cb => cb.checked);
    const allesInput = document.getElementById('selecteerAlles');
    if (allesInput) {
      allesInput.checked = alleAan;
      allesInput.closest('.checkbox-chip')?.classList.toggle('geselecteerd', alleAan);
    }
  }

  document.querySelectorAll('.checkbox-chip, .radio-chip').forEach(chip => {
    chip.addEventListener('click', e => {
      if (e.target.tagName === 'INPUT') return;
      const input = chip.querySelector('input');
      if (!input) return;
      if (input.type === 'radio') {
        document.querySelectorAll(`input[name="${input.name}"]`).forEach(r => {
          r.checked = false;
          r.closest('.radio-chip')?.classList.remove('geselecteerd');
        });
        input.checked = true;
        chip.classList.add('geselecteerd');
        input.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        input.checked = !input.checked;
        chip.classList.toggle('geselecteerd', input.checked);
        if (input.id === 'selecteerAlles') {
          const aan = input.checked;
          document.querySelectorAll('input[name="moeilijkheid"]').forEach(cb => {
            cb.checked = aan;
            cb.closest('.checkbox-chip')?.classList.toggle('geselecteerd', aan);
          });
          document.querySelector('input[name="moeilijkheid"]')
            ?.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          updateAllesChip();
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });
  });

  // ── Maateenheden tab ──────────────────────────────────────────
  function genereerMaatPreview() {
    const inst = Maateenheden.leesInstellingen();
    if (!inst) return;
    Maateenheden.tekenPreviewHtml(document.getElementById('maatPreview'), inst);
  }

  document.getElementById('voegMaatToeBtn')?.addEventListener('click', () => {
    const inst = Maateenheden.leesInstellingen();
    if (!inst) return;
    const opdrachtzin = document.getElementById('opdrachtzinMaat').value.trim() || "Vul in.";
    Bundel.voegToe(inst, opdrachtzin);
  });

  document.querySelectorAll('#maatKolommen, #maatMetSleutel')
    .forEach(el => el.addEventListener('change', genereerMaatPreview));

  // ── Tijdverschil tab ──────────────────────────────────────────
  document.querySelectorAll('input[name="tvAantal"]').forEach(r => {
    r.addEventListener('change', () => {
      document.getElementById('tvAantalOef').value = r.value;
      genereerTvPreview();
    });
  });

  function genereerTvPreview() {
    const inst = KlokTijdverschil.leesInstellingen();
    if (!inst) return;
    KlokTijdverschil.tekenPreviewHtml(document.getElementById('tvPreview'), inst);
  }

  document.getElementById('voegTvToeBtn')?.addEventListener('click', () => {
    const inst = KlokTijdverschil.leesInstellingen();
    if (!inst) return;
    const opdrachtzin = document.getElementById('opdrachtzinTijdverschil').value.trim()
      || "Hoeveel minuten liggen er tussen de twee klokken?";
    Bundel.voegToe(inst, opdrachtzin);
    genereerTvPreview();
  });

  document.querySelectorAll('input[name="tvMoeilijkheid"], #tvHulplijn, #tvNotatie')
    .forEach(el => el.addEventListener('change', genereerTvPreview));

  genereerTvPreview();
  function genereerVerbPreview() {
    const inst = KlokVerbinden.leesInstellingen();
    if (!inst) return;
    KlokVerbinden.tekenPreviewHtml(document.getElementById('verbPreview'), inst);
  }

  function genereerVerb24Preview() {
    const inst = KlokVerbinden.leesInstellingen24u();
    if (!inst) return;
    KlokVerbinden.tekenPreview24uHtml(document.getElementById('verb24Preview'), inst);
  }

  document.getElementById('voegVerbToeBtn')?.addEventListener('click', () => {
    const inst = KlokVerbinden.leesInstellingen();
    if (!inst) return;
    const opdrachtzin = document.getElementById('opdrachtzinVerbinden').value.trim()
      || "Trek een lijn van de klok naar de juiste tijd.";
    Bundel.voegToe(inst, opdrachtzin);
    genereerVerbPreview();
  });

  document.querySelectorAll('input[name="verbMoeilijkheid"], input[name="verbNotatie"], #verbAantalRijen, #verbHulpminuten')
    .forEach(el => el.addEventListener('change', genereerVerbPreview));

  // Chip voor verbinden hulpminuten
  document.getElementById('chip-verbHulp')?.addEventListener('click', e => {
    if (e.target.tagName === 'INPUT') return;
    const cb = document.getElementById('verbHulpminuten');
    cb.checked = !cb.checked;
    e.currentTarget.classList.toggle('geselecteerd', cb.checked);
    cb.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // 24u verbinden
  document.getElementById('voegVerb24ToeBtn')?.addEventListener('click', () => {
    const inst = KlokVerbinden.leesInstellingen24u();
    if (!inst) return;
    const opdrachtzin = document.getElementById('opdrachtzinVerbinden24u').value.trim()
      || "Verbind de 24-uurs tijd met de juiste daguren.";
    Bundel.voegToe(inst, opdrachtzin);
    genereerVerb24Preview();
  });
  document.getElementById('verb24aantalParen')?.addEventListener('change', genereerVerb24Preview);
  genereerVerbPreview();
  genereerVerb24Preview();

  // ── Ordenen tab ───────────────────────────────────────────────

  // Bouw dagdeel-grenzenvelden dynamisch op
  const grenzenContainer = document.getElementById('ordGrenzenContainer');
  if (grenzenContainer) {
    KlokOrdenen.DAGDELEN.forEach(dd => {
      const [r, g, b] = dd.kleur;
      const vanUur = Math.floor(dd.van / 60);
      const totUur = dd.id === 'nacht' ? 6 : Math.floor(dd.tot / 60);
      const rij = document.createElement('div');
      rij.style.cssText = 'display:flex;align-items:center;gap:6px;';
      rij.innerHTML = `
        <div style="width:12px;height:12px;border-radius:3px;background:rgb(${r},${g},${b});flex-shrink:0;"></div>
        <span style="flex:1;font-weight:600;color:var(--blauw);">${dd.label}</span>
        <input type="number" id="ord_van_${dd.id}" value="${vanUur}" min="0" max="23"
          style="width:44px;border:1px solid var(--border);border-radius:5px;padding:3px 5px;font-size:12px;text-align:center;"/>
        <span style="color:var(--muted);">u →</span>
        <input type="number" id="ord_tot_${dd.id}" value="${totUur}" min="0" max="23"
          style="width:44px;border:1px solid var(--border);border-radius:5px;padding:3px 5px;font-size:12px;text-align:center;"/>
        <span style="color:var(--muted);">u</span>`;
      grenzenContainer.appendChild(rij);
    });
  }

  // Aantal wekkers radio koppelen aan hidden input
  document.querySelectorAll('input[name="ordAantal"]').forEach(r => {
    r.addEventListener('change', () => {
      document.getElementById('ordAantalWekkers').value = r.value;
      genereerOrdPreview();
    });
  });

  function genereerOrdPreview() {
    const inst = KlokOrdenen.leesInstellingen();
    if (!inst) return;
    KlokOrdenen.tekenPreviewHtml(document.getElementById('ordPreview'), inst);
  }

  document.getElementById('voegOrdToeBtn')?.addEventListener('click', () => {
    const inst = KlokOrdenen.leesInstellingen();
    if (!inst) return;
    const opdrachtzin = document.getElementById('opdrachtzinOrdenen').value.trim()
      || "Kleur elke wekker in de kleur van het juiste dagdeel.";
    Bundel.voegToe(inst, opdrachtzin);
    genereerOrdPreview();
  });

  // Ordenen chips reageren via de algemene chip-handler + change events
  document.getElementById('ordPer5min')?.addEventListener('change', genereerOrdPreview);
  document.getElementById('ordToonGrenzen')?.addEventListener('change', genereerOrdPreview);

  document.querySelectorAll('[id^="ord_van_"], [id^="ord_tot_"]')
    .forEach(el => el.addEventListener('change', genereerOrdPreview));

  genereerOrdPreview();
  syncChips();
  KlokLezen.wachtOpAfbeelding(() => {}); // laad wekker alvast

});
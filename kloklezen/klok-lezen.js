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
  function tekenOpCanvas(canvas, instellingen, layoutType) {
    const ctx = canvas.getContext('2d');
    const { numClocks, toonHulpminuten, toon24Uur, toonHulpAnaloog,
            voorOverHulpType, tijdnotatie, invulmethode, tijden } = instellingen;

    const clockVerticalOffset = 20;
    let actualClockDiameter, paddingBetweenClocks, wekkerDisplayWidth;

    if (layoutType === 'pdf') {
      actualClockDiameter  = tijdnotatie === '24uur' ? 240 : 180;
      paddingBetweenClocks = 30;
      wekkerDisplayWidth   = tijdnotatie === '24uur' ? 160 : 140;
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

    /** Teken preview op het scherm-canvas */
    tekenPreview(canvas, instellingen) {
      if (!instellingen) return;
      if (!wekkerImg.complete || wekkerImg.naturalWidth === 0) {
        wekkerImg.onload = () => tekenOpCanvas(canvas, instellingen, 'compact');
      } else {
        tekenOpCanvas(canvas, instellingen, 'compact');
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

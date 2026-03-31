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

  // Genereer stopwatch-tijden: HH:MM:SS objecten
  function genereerStopwatchTijden(moeilijkheden, aantal) {
    const tijden = [];
    const gebruikt = new Set();
    let pogingen = 0;
    while (tijden.length < aantal && pogingen < 300) {
      pogingen++;
      const uur = Math.floor(Math.random() * 12) + 1;
      const min = Math.floor(Math.random() * 60);
      const sec = Math.floor(Math.random() * 60);
      const key = `${uur}:${min}:${sec}`;
      if (!gebruikt.has(key)) {
        gebruikt.add(key);
        tijden.push({ isStopwatch: true, uur, min, sec });
      }
    }
    return tijden;
  }

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

    const clockVerticalOffset = layoutType === 'pdf' ? 8 : 20;
    let actualClockDiameter, paddingBetweenClocks, wekkerDisplayWidth;

    if (layoutType === 'pdf') {
      actualClockDiameter  = tijdnotatie === '24uur' ? 200 : 150;
      paddingBetweenClocks = 8;
      wekkerDisplayWidth   = tijdnotatie === '24uur' ? 140 : 120;
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
    const spaceBelowClock = layoutType === 'pdf'
      ? (voorOverHulpType !== 'geen' || tijdnotatie === '24uur' || toon24Uur) ? 30 : 10
      : (voorOverHulpType !== 'geen' || tijdnotatie === '24uur' || toon24Uur) ? 45 : 20;
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

      const numRijen   = Math.max(1, parseInt(document.getElementById('numRijen')?.value) || 3);
      const numClocks  = numRijen * 3;
      const klokType   = document.querySelector('input[name="klokType"]:checked')?.value || 'analoog';
      const leerjaar   = document.querySelector('input[name="klokLeerjaar"]:checked')?.value || '2';
      const isDigitaal = klokType === 'digitaal';
      const digitaalNotatie = isDigitaal
        ? (document.querySelector('input[name="digitaalNotatie"]:checked')?.value || '12u')
        : null;

      // Bij stopwatch: genereer mm:ss,hh tijden
      const isStopwatch = isDigitaal && digitaalNotatie === 'stopwatch';
      const tijden = isStopwatch
        ? genereerStopwatchTijden(moeilijkheden, numClocks)
        : isDigitaal && digitaalNotatie === '24u'
          ? genereerTijdenSlim(moeilijkheden, numClocks).map(t => ({ ...t, uur: t.uur >= 12 ? t.uur : t.uur + 12 }))
          : genereerTijdenSlim(moeilijkheden, numClocks);

      return {
        type:           'kloklezen',
        klokType,
        leerjaar,
        numClocks,
        toonHulpminuten: isDigitaal ? false : document.getElementById('hulpminuten').checked,
        toon24Uur:       isDigitaal ? false : document.getElementById('hulp24uur').checked,
        toonHulpAnaloog: isDigitaal ? false : document.getElementById('hulpAnaloog').checked,
        voorOverHulpType: isDigitaal ? 'geen' : document.getElementById('voorOverHulp').value,
        moeilijkheden,
        tijdnotatie:  document.querySelector('input[name="tijdnotatie"]:checked').value,
        invulmethode: isDigitaal ? 'digitaalWekker' : document.querySelector('input[name="invulmethode"]:checked').value,
        digitaalNotatie,
        tijden,
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
      const pageWidth  = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const usableW    = pageWidth - 2 * margin;

      const tijden   = instellingen.tijden;
      const numCols  = 3;
      let y = yStart;

      // Teken rij per rij
      for (let start = 0; start < tijden.length; start += numCols) {
        const rijTijden = tijden.slice(start, start + numCols);
        const rijInst   = { ...instellingen, numClocks: rijTijden.length, tijden: rijTijden };

        // Teken op hulpcanvas om hoogte te weten
        tekenOpCanvas(hulpCanvas, rijInst, 'pdf');
        const ratio  = hulpCanvas.width / hulpCanvas.height;
        let imgW = usableW;
        let imgH = imgW / ratio;

        // Pas beschikbare hoogte op deze pagina
        const beschikbaar = pageHeight - y - margin;

        if (imgH > beschikbaar) {
          // Rij past niet meer — nieuwe pagina
          doc.addPage();
          y = margin;
        }

        const dataURL = hulpCanvas.toDataURL('image/png');
        const xPos    = (pageWidth - imgW) / 2;
        doc.addImage(dataURL, 'PNG', xPos, y, imgW, imgH);
        y += imgH; // geen extra tussenruimte — canvas heeft al ingebouwde padding
      }

      return y;
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
    // 2de leerjaar
    { id: 'u_min',    zin: "1 uur = {_} minuten",              antwoord: "60"   },
    { id: 'hu_min',   zin: "1 halfuur = {_} minuten",          antwoord: "30"   },
    { id: 'kw_min',   zin: "1 kwartier = {_} minuten",         antwoord: "15"   },
    { id: '2kw_min',  zin: "2 kwartieren = {_} minuten",       antwoord: "30"   },
    { id: '3kw_min',  zin: "3 kwartieren = {_} minuten",       antwoord: "45"   },
    { id: 'u_hu',     zin: "1 uur = {_} halfuren",             antwoord: "2"    },
    { id: 'u_kw',     zin: "1 uur = {_} kwartieren",           antwoord: "4"    },
    { id: 'd_u',      zin: "1 dag = {_} uren",                 antwoord: "24"   },
    { id: 'min_sec',  zin: "1 minuut = {_} seconden",          antwoord: "60"   },
    // 3de leerjaar
    { id: 'kw_hu',    zin: "1 kwartier = de helft van {_}",    antwoord: "een halfuur" },
    { id: 'hu_kw',    zin: "1 halfuur = {_} kwartieren",       antwoord: "2"    },
    { id: '4hu_kw',   zin: "4 halfuren = {_} kwartieren",      antwoord: "8"    },
    { id: 'kw_u',     zin: "1 kwartier = ¼ van {_}",          antwoord: "een uur" },
    { id: 'hu_u',     zin: "1 halfuur = de helft van {_}",     antwoord: "een uur" },
    // 4de leerjaar
    { id: 'u_sec',    zin: "1 uur = {_} seconden",             antwoord: "3600" },
    { id: 'hu_sec',   zin: "1 halfuur = {_} seconden",         antwoord: "1800" },
    { id: 'kw_sec',   zin: "1 kwartier = {_} seconden",        antwoord: "900"  },
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
      const metDagdeel  = document.getElementById('verb24Dagdeel')?.checked || false;
      document.getElementById('meldingVerbinden').textContent = '';

      const DAGDEEL_LABELS = [
        { van: 6,  tot: 9,  label: "'s ochtends" },
        { van: 9,  tot: 12, label: 'in de voormiddag' },
        { van: 12, tot: 13, label: 'in de middag' },
        { van: 13, tot: 18, label: 'in de namiddag' },
        { van: 18, tot: 24, label: "'s avonds" },
      ];
      const dagdeelLabel = u24 => DAGDEEL_LABELS.find(d => u24 >= d.van && u24 < d.tot)?.label || '';

      const naMiddag = [];
      for (let u = 13; u <= 23; u++) naMiddag.push(u);
      shuffleInPlace(naMiddag);
      const gekozen = naMiddag.slice(0, aantalParen);

      const paren = gekozen.map(u24 => {
        const u12 = u24 - 12;
        const dd = dagdeelLabel(u24);
        return {
          u24, u12,
          label24: `${u24}:00`,
          label12: metDagdeel ? `${u12}u ${dd}` : `${u12}:00`,
        };
      });

      const volgordeRechts = shuffleInPlace([...Array(aantalParen).keys()]);
      return { type: 'verbinden24u', aantalParen, metDagdeel, paren, volgordeRechts };
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
  function genereerOefening(moeilijkheden, metHulplijn, metOverschrijding, metStopwatch, type23, klokType, metOverschrijdingMin) {
    const per5   = moeilijkheden.includes('5minuten');
    const perMin = moeilijkheden.includes('minuut');
    const stap   = per5 ? 5 : perMin ? 1 : 5;

    if (metStopwatch) {
      const uur = Math.floor(Math.random() * 12) + 1;
      const minBegin = Math.floor(Math.random() * 55);
      const secBegin = Math.floor(Math.random() * 55);
      if (!metOverschrijdingMin) {
        const sv = Math.max(1, Math.floor(Math.random() * (58 - secBegin)));
        return { type: 'stopwatch', uur, minBegin, secBegin, uurEind: uur, minEind: minBegin, secEind: secBegin + sv, metHulplijn };
      }
      const verschilSec = Math.floor(Math.random() * 55) + 5;
      const totaalSec = secBegin + verschilSec;
      const extraMin = Math.floor(totaalSec / 60);
      const secEind = totaalSec % 60;
      let totaalMin = minBegin + extraMin;
      const extraUur = metOverschrijding ? Math.floor(totaalMin / 60) : 0;
      if (!metOverschrijding) totaalMin = Math.min(totaalMin, 59);
      return { type: 'stopwatch', uur, minBegin, secBegin, uurEind: uur + extraUur, minEind: totaalMin % 60, secEind, metHulplijn };
    }

    if (type23 === 'uren') {
      const minPool = [];
      if (moeilijkheden.includes('uur'))      minPool.push(0);
      if (moeilijkheden.includes('halfuur'))  minPool.push(30);
      if (moeilijkheden.includes('kwartier')){ minPool.push(15); minPool.push(45); }
      if (moeilijkheden.includes('5minuten')) for (let m=0;m<60;m+=5) minPool.push(m);
      const minuten = minPool.length > 0 ? minPool : [0];
      const uur1 = Math.floor(Math.random() * 10) + 1;
      const min1 = minuten[Math.floor(Math.random() * minuten.length)];
      return { type: 'uren', klokType: klokType || 'analoog', uur1, min1, uur2: uur1 + Math.floor(Math.random() * 6) + 1, min2: min1, metHulplijn };
    }

    const uur = Math.floor(Math.random() * 12) + 1;

    if (metOverschrijding) {
      const beginMin = 30 + Math.floor(Math.random() * Math.floor(25 / stap)) * stap;
      const minVerschil = 60 - beginMin + stap;
      const maxVerschil = Math.min(119 - beginMin, 59);
      const verschil = minVerschil + Math.floor(Math.random() * Math.max(1, Math.floor((maxVerschil - minVerschil) / stap))) * stap;
      const eindTotaal = beginMin + verschil;
      return { uur, beginMin, eindMin: eindTotaal % 60, eindUur: uur + Math.floor(eindTotaal / 60), verschil, metHulplijn, metOverschrijding: true, klokType: klokType || 'analoog' };
    }

    const maxBegin = 60 - stap * 2;
    const beginMin = Math.floor(Math.random() * Math.max(1, Math.floor(maxBegin / stap))) * stap;
    const restStappen = Math.max(1, Math.floor((60 - beginMin - stap) / stap));
    const verschilStappen = Math.floor(Math.random() * restStappen) + 1;
    return { uur, beginMin, eindMin: beginMin + verschilStappen * stap, eindUur: uur, verschil: verschilStappen * stap, metHulplijn, metOverschrijding: false, klokType: klokType || 'analoog' };
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

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;';

    oefeningen.forEach((oef, i) => {
      const cel = document.createElement('div');
      cel.style.cssText = 'border:1px solid #dde8f5;border-radius:8px;padding:8px;background:#fafcff;';

      const klokRij = document.createElement('div');
      klokRij.style.cssText = 'display:flex;align-items:center;gap:6px;justify-content:center;';

      if (oef.type === 'stopwatch') {
        // Digitale stopwatch-displays
        const fmt = (u, m, s) =>
          `${u.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;

        const d1 = document.createElement('div');
        d1.style.cssText = 'background:#d8e8fe;border:1.5px solid #4A90D9;border-radius:6px;padding:6px 10px;font-size:13px;font-weight:bold;color:#1a3a8c;';
        d1.textContent = fmt(oef.uur, oef.minBegin, oef.secBegin);

        const pijl = document.createElement('div');
        pijl.style.cssText = 'color:#4A90D9;font-size:14px;';
        pijl.textContent = '▶';

        const d2 = document.createElement('div');
        d2.style.cssText = 'background:#d8e8fe;border:1.5px solid #4A90D9;border-radius:6px;padding:6px 10px;font-size:13px;font-weight:bold;color:#1a3a8c;';
        d2.textContent = fmt(oef.uurEind, oef.minEind, oef.secEind);

        klokRij.appendChild(d1);
        klokRij.appendChild(pijl);
        klokRij.appendChild(d2);
        cel.appendChild(klokRij);

        const invul = document.createElement('div');
        invul.style.cssText = 'text-align:center;margin-top:6px;font-size:11px;color:#555;';
        invul.innerHTML = `Verschil: <span style="border-bottom:1px solid #333;display:inline-block;width:22px;"></span> u <span style="border-bottom:1px solid #333;display:inline-block;width:22px;"></span> min <span style="border-bottom:1px solid #333;display:inline-block;width:22px;"></span> sec`;
        cel.appendChild(invul);

      } else if (oef.type === 'uren') {
        // Verschil in uren: twee klokken of wekkers
        const maakDisplay = (uur, min) => {
          const el = document.createElement('div');
          if (oef.klokType === 'digitaal') {
            el.style.cssText = 'background:#d8e8fe;border:1.5px solid #4A90D9;border-radius:6px;padding:8px 12px;font-size:15px;font-weight:bold;color:#1a3a8c;';
            el.textContent = `${uur.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}`;
          } else {
            const cvs = document.createElement('canvas');
            cvs.width = cvs.height = 70;
            setTimeout(() => tekenKlokCanvas(cvs, uur, min), 10);
            el.appendChild(cvs);
          }
          return el;
        };
        klokRij.appendChild(maakDisplay(oef.uur1, oef.min1));
        const pijl = document.createElement('div');
        pijl.style.cssText = 'color:#4A90D9;font-size:14px;align-self:center;';
        pijl.textContent = '▶';
        klokRij.appendChild(pijl);
        klokRij.appendChild(maakDisplay(oef.uur2, oef.min2));
        cel.appendChild(klokRij);
        const invul = document.createElement('div');
        invul.style.cssText = 'text-align:center;margin-top:6px;font-size:11px;color:#555;';
        invul.innerHTML = `Verschil: <span style="border-bottom:1px solid #333;display:inline-block;width:40px;"></span> uur`;
        cel.appendChild(invul);

      } else {
        // Minuten- of uren-verschil: analoog of digitaal
        const isDigitaal = oef.klokType === 'digitaal';

        const maakKlokEl = (uur, min) => {
          if (isDigitaal) {
            const d = document.createElement('div');
            d.style.cssText = 'background:#d8e8fe;border:1.5px solid #4A90D9;border-radius:6px;padding:8px 12px;font-size:15px;font-weight:bold;color:#1a3a8c;white-space:nowrap;';
            d.textContent = `${uur.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}`;
            return d;
          } else {
            const wrap = document.createElement('div');
            wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;';
            const cvs = document.createElement('canvas');
            cvs.width = cvs.height = 90; cvs.className = 'klok-vast';
            wrap.appendChild(cvs);
            if (metNotatie) {
              const n = document.createElement('div');
              n.style.cssText = 'font-size:12px;color:#666;letter-spacing:2px;';
              n.textContent = '__ : __';
              wrap.appendChild(n);
            }
            setTimeout(() => tekenKlokCanvas(cvs, uur, min), 10);
            return wrap;
          }
        };

        const el1 = maakKlokEl(oef.type === 'uren' ? oef.uur1 : oef.uur, oef.type === 'uren' ? oef.min1 : oef.beginMin);
        const pijl = document.createElement('div');
        pijl.style.cssText = 'color:#4A90D9;font-size:14px;flex-shrink:0;align-self:center;';
        pijl.textContent = '▶';
        const el2 = maakKlokEl(oef.type === 'uren' ? oef.uur2 : (oef.eindUur || oef.uur), oef.type === 'uren' ? oef.min2 : oef.eindMin);

        klokRij.appendChild(el1);
        klokRij.appendChild(pijl);
        klokRij.appendChild(el2);
        cel.appendChild(klokRij);

        const invul = document.createElement('div');
        invul.style.cssText = 'text-align:center;margin-top:6px;font-size:12px;color:#555;';
        invul.innerHTML = oef.type === 'uren'
          ? `Verschil: <span style="border-bottom:2px solid #333;display:inline-block;width:40px;"></span> uur`
          : `Verschil: <span style="border-bottom:2px solid #333;display:inline-block;width:40px;"></span> min.`;
        cel.appendChild(invul);
      }

      grid.appendChild(cel);
    });

    container.appendChild(grid);
  }

  // ── PDF tekenen ───────────────────────────────────────────────
  function tekenInPdf(doc, instellingen, yStart, margin, hulpCanvas) {
    const { oefeningen, metNotatie, metStopwatch } = instellingen;
    const pageW   = doc.internal.pageSize.getWidth();
    const pageH   = doc.internal.pageSize.getHeight();
    const breedte = pageW - 2 * margin;
    const cols    = 2;
    const colW    = (breedte - 8) / cols;
    const klokD   = 34;
    const notatieH = metNotatie ? 10 : 0;
    const oefH    = instellingen.metStopwatch
      ? 42 + notatieH   // stopwatch: meer ruimte voor displays + invulvak
      : klokD + 20 + notatieH;
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

        if (oef.type === 'stopwatch') {
          // Stopwatch: twee wekkers met HH:MM:SS
          const fmt = (u, m, s) =>
            `${u.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;

          const sw1X = x0 + colW * 0.25;
          const sw2X = x0 + colW * 0.75;
          const swY  = y + 5;
          const swW  = colW * 0.42;
          const swH  = 14;

          // Display 1 — beginwekker
          doc.setFillColor(220, 235, 250);
          doc.setDrawColor(80, 130, 200); doc.setLineWidth(0.4);
          doc.roundedRect(sw1X - swW/2, swY, swW, swH, 2, 2, 'FD');
          doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.setTextColor(20, 50, 140);
          doc.text(fmt(oef.uur, oef.minBegin, oef.secBegin), sw1X, swY + 9.5, { align: 'center' });

          // Pijl
          const pijlMid = swY + swH / 2;
          doc.setDrawColor(74, 144, 217); doc.setLineWidth(0.7);
          doc.line(sw1X + swW/2 + 1, pijlMid, sw2X - swW/2 - 1, pijlMid);
          doc.line(sw2X - swW/2 - 3, pijlMid - 1.2, sw2X - swW/2 - 1, pijlMid);
          doc.line(sw2X - swW/2 - 3, pijlMid + 1.2, sw2X - swW/2 - 1, pijlMid);

          // Display 2 — eindwekker
          doc.setFillColor(220, 235, 250);
          doc.setDrawColor(80, 130, 200);
          doc.roundedRect(sw2X - swW/2, swY, swW, swH, 2, 2, 'FD');
          doc.setTextColor(20, 50, 140);
          doc.text(fmt(oef.uurEind, oef.minEind, oef.secEind), sw2X, swY + 9.5, { align: 'center' });
          doc.setFont(undefined, 'normal'); doc.setTextColor(0, 0, 0);

        } else if (oef.type === 'uren') {
          // Verschil in uren — analoog of digitaal
          const klok1X = x0 + colW * 0.22;
          const klok2X = x0 + colW * 0.78;
          if (oef.klokType === 'digitaal') {
            const swW = colW * 0.38; const swH = 12; const swY = y + 6;
            doc.setFillColor(220, 235, 250); doc.setDrawColor(80, 130, 200); doc.setLineWidth(0.4);
            doc.roundedRect(klok1X - swW/2, swY, swW, swH, 2, 2, 'FD');
            doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.setTextColor(20, 50, 140);
            doc.text(`${oef.uur1.toString().padStart(2,'0')}:${oef.min1.toString().padStart(2,'0')}`, klok1X, swY + 8.5, { align: 'center' });
            const pijlM = swY + swH/2;
            doc.setDrawColor(74, 144, 217); doc.setLineWidth(0.7);
            doc.line(klok1X + swW/2 + 1, pijlM, klok2X - swW/2 - 1, pijlM);
            doc.line(klok2X - swW/2 - 3, pijlM - 1.2, klok2X - swW/2 - 1, pijlM);
            doc.line(klok2X - swW/2 - 3, pijlM + 1.2, klok2X - swW/2 - 1, pijlM);
            doc.setFillColor(220, 235, 250); doc.setDrawColor(80, 130, 200);
            doc.roundedRect(klok2X - swW/2, swY, swW, swH, 2, 2, 'FD');
            doc.text(`${oef.uur2.toString().padStart(2,'0')}:${oef.min2.toString().padStart(2,'0')}`, klok2X, swY + 8.5, { align: 'center' });
            doc.setFont(undefined, 'normal'); doc.setTextColor(0, 0, 0);
          } else {
            tekenKlokPdfIntern(doc, klok1X, klokY, klokR, oef.uur1, oef.min1);
            const pijlMid = klokY;
            doc.setDrawColor(74, 144, 217); doc.setLineWidth(0.7);
            doc.line(klok1X + klokR + 2, pijlMid, klok2X - klokR - 2, pijlMid);
            doc.line(klok2X - klokR - 4, pijlMid - 1.2, klok2X - klokR - 2, pijlMid);
            doc.line(klok2X - klokR - 4, pijlMid + 1.2, klok2X - klokR - 2, pijlMid);
            tekenKlokPdfIntern(doc, klok2X, klokY, klokR, oef.uur2, oef.min2);
          }

        } else {
          // Minuten-verschil — analoog of digitaal
          const klok1X = x0 + colW * 0.22;
          const klok2X = x0 + colW * 0.78;

          if (oef.klokType === 'digitaal') {
            const swW = colW * 0.38; const swH = 12; const swY = y + (oefH - swH) / 2 - 6;
            const fmt2 = (u, m) => `${u.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
            doc.setFillColor(220, 235, 250); doc.setDrawColor(80, 130, 200); doc.setLineWidth(0.4);
            doc.roundedRect(klok1X - swW/2, swY, swW, swH, 2, 2, 'FD');
            doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.setTextColor(20, 50, 140);
            doc.text(fmt2(oef.uur, oef.beginMin), klok1X, swY + 8.5, { align: 'center' });
            const pijlM = swY + swH/2;
            doc.setDrawColor(74, 144, 217); doc.setLineWidth(0.7);
            doc.line(klok1X + swW/2 + 1, pijlM, klok2X - swW/2 - 1, pijlM);
            doc.line(klok2X - swW/2 - 3, pijlM - 1.2, klok2X - swW/2 - 1, pijlM);
            doc.line(klok2X - swW/2 - 3, pijlM + 1.2, klok2X - swW/2 - 1, pijlM);
            doc.setFillColor(220, 235, 250); doc.setDrawColor(80, 130, 200);
            doc.roundedRect(klok2X - swW/2, swY, swW, swH, 2, 2, 'FD');
            doc.text(fmt2(oef.eindUur || oef.uur, oef.eindMin), klok2X, swY + 8.5, { align: 'center' });
            doc.setFont(undefined, 'normal'); doc.setTextColor(0, 0, 0);
          } else {
            tekenKlokPdfIntern(doc, klok1X, klokY, klokR, oef.uur, oef.beginMin);

            // Pijl
            const pijlMid = klokY;
            const pijlX1  = klok1X + klokR + 2;
            const pijlX2  = klok2X - klokR - 2;
            doc.setDrawColor(74, 144, 217); doc.setLineWidth(0.7);
            doc.line(pijlX1, pijlMid, pijlX2, pijlMid);
            doc.line(pijlX2 - 1.5, pijlMid - 1.2, pijlX2, pijlMid);
            doc.line(pijlX2 - 1.5, pijlMid + 1.2, pijlX2, pijlMid);

            // Eind klok
            const eindUur = oef.eindUur || oef.uur;
            tekenKlokPdfIntern(doc, klok2X, klokY, klokR, eindUur, oef.eindMin);

            // Bij overschrijding: uuraanduiding boven klokken
            if (oef.metOverschrijding) {
              doc.setFontSize(8); doc.setFont(undefined, 'normal'); doc.setTextColor(100, 100, 100);
              doc.text(`${oef.uur}u`, klok1X, y + 3, { align: 'center' });
              doc.text(`${eindUur}u`, klok2X, y + 3, { align: 'center' });
              doc.setTextColor(0, 0, 0);
            }

            // Tijdnotatie
            if (metNotatie) {
              const notY = klokY + klokR + 6;
              doc.setFontSize(8); doc.setFont(undefined, 'normal'); doc.setTextColor(80, 80, 80);
              doc.setDrawColor(80, 80, 80); doc.setLineWidth(0.5);
              doc.line(klok1X - 10, notY + 1.5, klok1X - 3, notY + 1.5);
              doc.text(':', klok1X, notY + 0.5, { align: 'center' });
              doc.line(klok1X + 3, notY + 1.5, klok1X + 10, notY + 1.5);
              doc.line(klok2X - 10, notY + 1.5, klok2X - 3, notY + 1.5);
              doc.text(':', klok2X, notY + 0.5, { align: 'center' });
              doc.line(klok2X + 3, notY + 1.5, klok2X + 10, notY + 1.5);
              doc.setTextColor(0, 0, 0);
            }
          }
        }

        const invulY = y + oefH - 7;
        doc.setFontSize(11); doc.setFont(undefined, 'normal'); doc.setTextColor(60, 60, 60);
        if (oef.type === 'stopwatch') {
          doc.text('Verschil:', x0 + 2, invulY);
          doc.setDrawColor(80, 80, 80); doc.setLineWidth(0.5);
          const lijnL = 14; let xv = x0 + 22;
          doc.line(xv, invulY + 0.5, xv + lijnL, invulY + 0.5); xv += lijnL + 1;
          doc.text('u', xv, invulY); xv += 5;
          doc.line(xv, invulY + 0.5, xv + lijnL, invulY + 0.5); xv += lijnL + 1;
          doc.text('min', xv, invulY); xv += 8;
          doc.line(xv, invulY + 0.5, xv + lijnL, invulY + 0.5); xv += lijnL + 1;
          doc.text('sec', xv, invulY);
        } else if (oef.type === 'uren') {
          doc.text('Verschil:', x0 + colW * 0.32, invulY, { align: 'right' });
          doc.setDrawColor(80, 80, 80); doc.setLineWidth(0.5);
          doc.line(x0 + colW * 0.34, invulY + 0.5, x0 + colW * 0.66, invulY + 0.5);
          doc.text('uur', x0 + colW * 0.68, invulY);
        } else {
          doc.text('Verschil:', x0 + colW * 0.32, invulY, { align: 'right' });
          doc.setDrawColor(80, 80, 80); doc.setLineWidth(0.5);
          doc.line(x0 + colW * 0.34, invulY + 0.5, x0 + colW * 0.66, invulY + 0.5);
          doc.text('min.', x0 + colW * 0.68, invulY);
        }
        doc.setTextColor(0, 0, 0);
      }

      y += oefH + 6;

      // Hulpgetallenlijn
      if (oefeningen[i]?.metHulplijn) {
        for (let k = 0; k < cols; k++) {
          const oef = oefeningen[i + k];
          if (!oef || oef.type === 'stopwatch') break;
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
      const leerjaar = document.querySelector('input[name="tvLeerjaar"]:checked')?.value || '23';
      const aantalOef = Math.max(1, parseInt(document.getElementById('tvAantalRijen')?.value) || 3) * 2;
      const metHulp   = document.getElementById('tvHulplijn')?.checked || false;
      const metNotatie = document.getElementById('tvNotatie')?.checked || false;

      const oefeningen = [];

      if (leerjaar === '23') {
        // 2de/3de: minuten of uren verschil, analoog of digitaal
        const type23     = document.querySelector('input[name="tvType23"]:checked')?.value || 'minuten';
        const klokType   = document.querySelector('input[name="tvKlokType"]:checked')?.value || 'analoog';
        const moeilijkheden = Array.from(
          document.querySelectorAll('input[name="tvMoeilijkheid"]:checked')
        ).map(cb => cb.value);
        if (moeilijkheden.length === 0) {
          document.getElementById('meldingTijdverschil').textContent = 'Kies minstens één moeilijkheidsgraad!';
          return null;
        }
        document.getElementById('meldingTijdverschil').textContent = '';
        for (let i = 0; i < aantalOef; i++) {
          oefeningen.push(genereerOefening(moeilijkheden, metHulp, false, false, type23, klokType));
        }
        return { type: 'tijdverschil', leerjaar, type23, klokType, moeilijkheden, aantalOef, metHulplijn: metHulp, metNotatie, oefeningen };

      } else if (leerjaar === '4') {
        const moeilijkheden = Array.from(
          document.querySelectorAll('input[name="tvMoeilijkheid4"]:checked')
        ).map(cb => cb.value);
        if (moeilijkheden.length === 0) {
          document.getElementById('meldingTijdverschil').textContent = 'Kies minstens één nauwkeurigheid!';
          return null;
        }
        const metOverschrijding = document.querySelector('input[name="tvOverschrijding4"]:checked')?.value === 'met';
        document.getElementById('meldingTijdverschil').textContent = '';
        for (let i = 0; i < aantalOef; i++) {
          oefeningen.push(genereerOefening(moeilijkheden, metHulp, metOverschrijding, false, 'minuten', 'analoog'));
        }
        return { type: 'tijdverschil', leerjaar, moeilijkheden, metOverschrijding, aantalOef, metHulplijn: metHulp, metNotatie, oefeningen };

      } else {
        // 5de/6de: altijd HH:MM:SS
        const metOverschrijdingMin = document.querySelector('input[name="tvOverschrijdingMin"]:checked')?.value === 'met';
        const metOverschrijdingUur = document.querySelector('input[name="tvOverschrijdingUur"]:checked')?.value === 'met';
        document.getElementById('meldingTijdverschil').textContent = '';
        for (let i = 0; i < aantalOef; i++) {
          oefeningen.push(genereerOefening([], metHulp, metOverschrijdingUur, true, 'seconden', 'digitaal', metOverschrijdingMin));
        }
        return { type: 'tijdverschil', leerjaar, metOverschrijdingMin, metOverschrijdingUur, metStopwatch: true, aantalOef, metHulplijn: metHulp, metNotatie, oefeningen };
      }
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

/* ══════════════════════════════════════════════════════════════
   KlokBegrippen — module
   3de leerjaar: tekstkaartjes inkleuren die bij een begrip horen
   Centraal begrip: kwartier / halfuur / uur
   ══════════════════════════════════════════════════════════════ */

const KlokBegrippen = (() => {

  // Kaartjes per begrip: juiste en foute antwoorden
  const KAARTJES = {
    kwartier: {
      juist:        ['15 minuten', 'de helft van een halfuur', '¼ van een uur', '1/4 uur', '3 × 5 minuten'],
      juistSeconden:['900 seconden', '60 × 15 seconden'],
      fout:         ['30 minuten', 'de helft van een uur', '20 minuten', '½ uur', '2 kwartieren', '45 minuten'],
      foutSeconden: ['1800 seconden', '3600 seconden', '60 seconden'],
    },
    halfuur: {
      juist:        ['30 minuten', 'de helft van een uur', '2 kwartieren', '½ uur', '6 × 5 minuten'],
      juistSeconden:['1800 seconden', '60 × 30 seconden'],
      fout:         ['15 minuten', '¼ van een uur', '45 minuten', '3 kwartieren', '20 minuten', '1 uur'],
      foutSeconden: ['900 seconden', '3600 seconden', '600 seconden'],
    },
    uur: {
      juist:        ['60 minuten', '4 kwartieren', '2 halfuren', '12 × 5 minuten'],
      juistSeconden:['3600 seconden', '60 × 60 seconden'],
      fout:         ['30 minuten', '3 kwartieren', '45 minuten', '1800 seconden', '24 uur', '100 minuten'],
      foutSeconden: ['900 seconden', '7200 seconden', '600 seconden'],
    },
  };

  const KLEUREN = {
    geel:   { fill: [255, 220, 50],  text: [60, 50, 10] },
    blauw:  { fill: [60, 120, 210],  text: [255, 255, 255] },
    groen:  { fill: [60, 180, 80],   text: [255, 255, 255] },
    oranje: { fill: [255, 140, 40],  text: [80, 30, 0] },
  };

  function shuffleArr(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function genereerKaartjes(begrip, metSeconden) {
    const data = KAARTJES[begrip];
    const juistPool = metSeconden
      ? [...data.juist, ...data.juistSeconden]
      : data.juist;
    const foutPool = metSeconden
      ? [...data.fout, ...data.foutSeconden]
      : data.fout;
    const juist = shuffleArr(juistPool).slice(0, 4);
    const fout  = shuffleArr(foutPool).slice(0, 4);
    const alle = [
      ...juist.map(t => ({ tekst: t, juist: true })),
      ...fout.map(t => ({ tekst: t, juist: false })),
    ];
    return shuffleArr(alle);
  }

  // ── HTML Preview ──────────────────────────────────────────────
  function tekenPreviewHtml(container, instellingen) {
    if (!container || !instellingen) return;
    container.innerHTML = '';
    const { begrip, kleur, kaartjes } = instellingen;
    const k = KLEUREN[kleur] || KLEUREN.geel;
    const [r, g, b] = k.fill;

    // Centraal begrip label
    const centraal = document.createElement('div');
    centraal.style.cssText = `background:rgb(${r},${g},${b});color:rgb(${k.text[0]},${k.text[1]},${k.text[2]});
      border-radius:20px;padding:6px 16px;font-size:13px;font-weight:800;text-align:center;margin-bottom:10px;display:inline-block;`;
    centraal.textContent = `Kleur wat hoort bij: ${begrip}`;
    container.appendChild(centraal);

    // Kaartjes raster
    const raster = document.createElement('div');
    raster.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;';

    kaartjes.forEach(k => {
      const card = document.createElement('div');
      card.style.cssText = `border:2px solid #c8d8f0;border-radius:8px;padding:8px 10px;
        font-size:12px;font-weight:600;color:#1a3a6c;background:#f8fbff;text-align:center;
        min-height:36px;display:flex;align-items:center;justify-content:center;`;
      card.textContent = k.tekst;
      raster.appendChild(card);
    });
    container.appendChild(raster);
  }

  // ── PDF tekenen ───────────────────────────────────────────────
  function tekenInPdf(doc, instellingen, yStart, margin) {
    const { begrip, kleur, kaartjes } = instellingen;
    const pageW   = doc.internal.pageSize.getWidth();
    const breedte = pageW - 2 * margin;
    const k = KLEUREN[kleur] || KLEUREN.geel;
    const [r, g, b] = k.fill;
    let y = yStart;

    // Centraal begrip kader
    doc.setFillColor(r, g, b);
    doc.setDrawColor(r * 0.7, g * 0.7, b * 0.7);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, breedte, 10, 2, 2, 'FD');
    doc.setFontSize(12); doc.setFont(undefined, 'bold');
    doc.setTextColor(k.text[0], k.text[1], k.text[2]);
    doc.text(`Kleur wat hoort bij: ${begrip}`, pageW / 2, y + 7, { align: 'center' });
    doc.setTextColor(0, 0, 0); doc.setFont(undefined, 'normal');
    y += 14;

    // Kaartjes in 4×2 raster
    const cols = 4;
    const colW = (breedte - (cols - 1) * 4) / cols;
    const kaartH = 18;

    kaartjes.forEach((krt, i) => {
      const col = i % cols;
      const rij = Math.floor(i / cols);
      const x = margin + col * (colW + 4);
      const ky = y + rij * (kaartH + 4);

      // Leeg kader (leerling kleurt zelf in)
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(150, 180, 220);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, ky, colW, kaartH, 2, 2, 'FD');

      // Tekst
      doc.setFontSize(14); doc.setFont(undefined, 'bold');
      doc.setTextColor(30, 50, 100);
      doc.text(krt.tekst, x + colW / 2, ky + kaartH / 2 + 1, {
        align: 'center', maxWidth: colW - 4,
      });
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
    });

    const aantalRijen = Math.ceil(kaartjes.length / cols);
    return y + aantalRijen * (kaartH + 4) + 4;
  }

  // ── Publieke API ──────────────────────────────────────────────
  return {
    leesInstellingen() {
      const begrip      = document.querySelector('input[name="begrip"]:checked')?.value || 'kwartier';
      const kleur       = document.querySelector('input[name="begripKleur"]:checked')?.value || 'geel';
      const metSeconden = document.getElementById('begripMetSeconden')?.checked || false;
      const kaartjes    = genereerKaartjes(begrip, metSeconden);
      return { type: 'begrippen', begrip, kleur, metSeconden, kaartjes };
    },
    tekenPreviewHtml,
    tekenInPdf,
  };

})();

const KlokOrdenen = (() => {

  // ── Dagdeel-definitie ─────────────────────────────────────────
  // Grenzen in minuten vanaf middernacht (0 = 0:00, 360 = 6:00, ...)
  const DAGDELEN = [
    { id: 'ochtend',    label: 'Ochtend',    van: 360,  tot: 540,  kleur: [255, 220,  50] }, // geel
    { id: 'voormiddag', label: 'Voormiddag', van: 540,  tot: 720,  kleur: [255, 150,  40] }, // oranje
    { id: 'middaguur',  label: 'Middaguur',  van: 720,  tot: 780,  kleur: [220,  60,  60] }, // rood
    { id: 'namiddag',   label: 'Namiddag',   van: 780,  tot: 1080, kleur: [ 60, 180,  80] }, // groen
    { id: 'avond',      label: 'Avond',      van: 1080, tot: 1440, kleur: [ 60, 120, 210] }, // blauw (18u-24u)
    { id: 'nacht',      label: 'Nacht',      van: 1440, tot: 1800, kleur: [ 90,  60, 160] }, // paars (0u-6u = 1440-1800 over middernacht)
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

      const vanUur = dd.id === 'nacht' ? 0 : Math.floor(dd.van / 60);
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
      const vanUur = dd.id === 'nacht' ? 0 : Math.floor(dd.van / 60);
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

      // Legenda alleen op eerste pagina
      let y = tekenLegendaPdf(doc, grenzen, instellingen.toonGrenzen ?? true, margin, yStart, pageW);

      const cols          = 4;
      const wekkerW       = (breedte - (cols - 1) * 3) / cols;
      const wekkerH       = wekkerW * 0.65;
      const rasterPadding = 4;
      const belExtra      = 4;   // belletje steekt boven y uit
      const rijH          = wekkerH + rasterPadding + belExtra;

      let rijOpPagina = 0;
      let eersteRijOpPagina = true;

      wekkers.forEach((w, i) => {
        const col = i % cols;

        if (col === 0 && i > 0) {
          // Checkt of volgende rij inclusief belletje en marge past
          if (y + (rijOpPagina + 1) * rijH + wekkerH + margin > pageH) {
            doc.addPage();
            y = margin + belExtra; // voldoende marge bovenaan
            rijOpPagina = 0;
          } else {
            rijOpPagina++;
          }
        }

        const wx = margin + col * (wekkerW + rasterPadding);
        const wy = y + rijOpPagina * rijH;

        const rotaties = [-4, -2, 0, 2, 4, -3, 3, -1, 1];
        const rot = rotaties[i % rotaties.length];
        tekenWekkerPdf(doc, wx, wy, wekkerW, wekkerH, w.uur24, w.minuut, rot);
      });

      return y + (rijOpPagina + 1) * rijH + 2;
    },
  };

})();

/* ══════════════════════════════════════════════════════════════
   bundel.js — Bundelbeheer
   Verantwoordelijkheid: oefeningen bijhouden, preview tonen,
                         PDF samenvoegen.
   Vereist: modules/klok-lezen.js (en later andere modules)
   ══════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════
   KlokSchrijven — module
   2de leerjaar: 8:15 = 8 uur 15 minuten = 8u15
   3de leerjaar: 17:30 = 17u30 = half 6 's avonds
   ══════════════════════════════════════════════════════════════ */

const KlokSchrijven = (() => {

  const DAGDEEL_SPREEKTAAL = [
    { van: 6,  tot: 9,  label: "'s ochtends" },
    { van: 9,  tot: 12, label: 'in de voormiddag' },
    { van: 12, tot: 13, label: 'in de middag' },
    { van: 13, tot: 18, label: 'in de namiddag' },
    { van: 18, tot: 24, label: "'s avonds" },
    { van: 22, tot: 24, label: "'s nachts" },
    { van: 0,  tot: 6,  label: "'s nachts" },
  ];

  function dagdeelVanUur(uur24) {
    return DAGDEEL_SPREEKTAAL.find(d => uur24 >= d.van && uur24 < d.tot)?.label || '';
  }

  // Spreektaal: 17:30 → "half 6 's avonds"
  function naar12uSpreektaal(uur24, minuut) {
    const dagdeel = dagdeelVanUur(uur24);
    const uur12 = uur24 % 12 || 12;
    const volgend = (uur12 % 12) + 1;
    let tijdDeel;
    if (minuut === 0)  tijdDeel = `${uur12} uur`;
    else if (minuut === 15) tijdDeel = `kwart over ${uur12}`;
    else if (minuut === 30) tijdDeel = `half ${volgend}`;
    else if (minuut === 45) tijdDeel = `kwart voor ${volgend}`;
    else if (minuut < 30)   tijdDeel = `${minuut} over ${uur12}`;
    else { const na = minuut - 30; tijdDeel = na <= 14 ? `${na} over half ${volgend}` : `${60 - minuut} voor ${volgend}`; }
    return `${tijdDeel} ${dagdeel}`;
  }

  // Genereer tijden voor 2de leerjaar
  function genereer2de(moeilijkheden, aantal) {
    const pool = new Set();
    if (moeilijkheden.includes('uur'))      pool.add(0);
    if (moeilijkheden.includes('halfuur'))  pool.add(30);
    if (moeilijkheden.includes('kwartier')){ pool.add(15); pool.add(45); }
    if (moeilijkheden.includes('5minuten')) for (let m = 0; m < 60; m += 5) pool.add(m);
    const minuten = Array.from(pool);
    const tijden = []; const gebruikt = new Set();
    while (tijden.length < aantal) {
      const uur = Math.floor(Math.random() * 12) + 1;
      const min = minuten[Math.floor(Math.random() * minuten.length)];
      const key = `${uur}:${min}`;
      if (!gebruikt.has(key)) { gebruikt.add(key); tijden.push({ uur12: uur, uur24: uur, minuut: min }); }
    }
    return tijden;
  }

  // Genereer tijden voor 3de leerjaar
  function genereer3de(dagdelen, aantal) {
    const RANGES = {
      ochtend:    { van: 6,  tot: 9  },
      voormiddag: { van: 9,  tot: 12 },
      namiddag:   { van: 13, tot: 18 },
      avond:      { van: 18, tot: 24 },
    };
    const gekozen = dagdelen.filter(d => RANGES[d]);
    if (gekozen.length === 0) return [];

    const tijden = [];
    const gebruikt = new Set();
    const minOpties = [0, 15, 30, 45];

    // Zorg dat elk gekozen dagdeel minstens 1 tijd krijgt
    const gegarandeerd = [...gekozen];
    while (gegarandeerd.length < aantal) gegarandeerd.push(gekozen[gegarandeerd.length % gekozen.length]);

    // Schud de dagdelen door elkaar
    for (let i = gegarandeerd.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gegarandeerd[i], gegarandeerd[j]] = [gegarandeerd[j], gegarandeerd[i]];
    }

    for (let poging = 0; poging < 300 && tijden.length < aantal; poging++) {
      const dd = gegarandeerd[tijden.length % gegarandeerd.length];
      const range = RANGES[dd];
      const uur24 = range.van + Math.floor(Math.random() * (range.tot - range.van));
      const minuut = minOpties[Math.floor(Math.random() * minOpties.length)];
      const key = `${uur24}:${minuut}`;
      if (!gebruikt.has(key)) {
        gebruikt.add(key);
        tijden.push({ uur24, minuut });
      }
    }
    return tijden;
  }

  // ── HTML Preview ───────────────────────────────────────────────
  function tekenPreviewHtml(container, instellingen) {
    if (!container || !instellingen) return;
    container.innerHTML = '';
    const { leerjaar, tijden } = instellingen;

    // Voorbeeldrij
    const vb = document.createElement('div');
    vb.style.cssText = 'background:#f0f8ff;border:1px solid #c8d8f0;border-radius:6px;padding:6px 10px;margin-bottom:8px;font-size:12px;color:#1a3a6c;';
    if (leerjaar === '2') {
      vb.innerHTML = '<strong>Voorbeeld:</strong> 8:15 = 8 uur 15 minuten = 8u15';
    } else {
      vb.innerHTML = '<strong>Voorbeeld:</strong> 17:30 = 17u30 = half 6 \'s avonds';
    }
    container.appendChild(vb);

    tijden.forEach((t, i) => {
      const rij = document.createElement('div');
      rij.style.cssText = 'display:flex;align-items:baseline;gap:6px;padding:5px 0;border-bottom:1px solid #f0f0f0;font-size:12px;';

      const nr = document.createElement('span');
      nr.style.cssText = 'color:#aaa;min-width:16px;font-size:11px;';
      nr.textContent = `${i + 1}.`;

      const tijd = document.createElement('span');
      tijd.style.cssText = 'font-weight:bold;color:#1a3a6c;min-width:40px;';
      if (leerjaar === '2') {
        tijd.textContent = `${t.uur12}:${t.minuut.toString().padStart(2,'0')}`;
      } else {
        tijd.textContent = `${t.uur24.toString().padStart(2,'0')}:${t.minuut.toString().padStart(2,'0')}`;
      }

      const is = document.createElement('span');
      is.style.color = '#888';
      is.textContent = '=';

      const lijn1 = document.createElement('span');
      lijn1.style.cssText = 'border-bottom:1px solid #333;flex:1;min-width:60px;display:inline-block;';

      const is2 = document.createElement('span');
      is2.style.color = '#888';
      is2.textContent = '=';

      const lijn2 = document.createElement('span');
      lijn2.style.cssText = 'border-bottom:1px solid #333;flex:1;min-width:60px;display:inline-block;';

      rij.appendChild(nr); rij.appendChild(tijd);
      rij.appendChild(is); rij.appendChild(lijn1);
      rij.appendChild(is2); rij.appendChild(lijn2);
      container.appendChild(rij);
    });
  }

  // ── PDF tekenen ───────────────────────────────────────────────
  function tekenInPdf(doc, instellingen, yStart, margin) {
    const { leerjaar, tijden } = instellingen;
    const pageW   = doc.internal.pageSize.getWidth();
    const breedte = pageW - 2 * margin;
    let y = yStart;

    // Voorbeeldrij
    doc.setFillColor(240, 248, 255);
    doc.setDrawColor(180, 200, 230);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, breedte, 9, 1, 1, 'FD');
    doc.setFontSize(10); doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 60, 120);
    doc.text('Voorbeeld:', margin + 3, y + 6);
    doc.setFont(undefined, 'normal');
    const vbTekst = leerjaar === '2'
      ? '8:15   =   8 uur 15 minuten   =   8u15'
      : "17:30   =   17u30   =   half 6 's avonds";
    doc.text(vbTekst, margin + 28, y + 6);
    doc.setTextColor(0, 0, 0);
    y += 13;

    // Oefeningen
    const regelH = leerjaar === '2' ? 12 : 12;

    tijden.forEach((t, i) => {
      doc.setFontSize(11); doc.setFont(undefined, 'normal');

      // Nummer
      doc.setTextColor(150, 150, 150);
      doc.text(`${i + 1}.`, margin + 2, y + 8);

      // Digitale tijd
      doc.setFont(undefined, 'bold');
      doc.setTextColor(20, 50, 120);
      const tijdStr = leerjaar === '2'
        ? `${t.uur12}:${t.minuut.toString().padStart(2,'0')}`
        : `${t.uur24.toString().padStart(2,'0')}:${t.minuut.toString().padStart(2,'0')}`;
      doc.text(tijdStr, margin + 8, y + 8);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);

      if (leerjaar === '2') {
        const beschikbaar = pageW - 2 * margin - 22; // ruimte na de digitale tijd
        const lijn1 = Math.round(beschikbaar * 0.62); // ~62% voor "8 uur 15 minuten"
        const lijn2 = Math.round(beschikbaar * 0.28); // ~28% voor "8u15"
        const x1 = margin + 22;
        doc.text('=', x1, y + 8);
        doc.setDrawColor(80, 80, 80); doc.setLineWidth(0.4);
        doc.line(x1 + 5, y + 9, x1 + 5 + lijn1, y + 9);
        const x2 = x1 + 5 + lijn1 + 5;
        doc.text('=', x2, y + 8);
        doc.line(x2 + 5, y + 9, x2 + 5 + lijn2, y + 9);
      } else {
        // ________ = ________
        const x1 = margin + 24;
        doc.text('=', x1, y + 8);
        doc.setDrawColor(80, 80, 80); doc.setLineWidth(0.4);
        doc.line(x1 + 5, y + 9, x1 + 35, y + 9);
        const x2 = x1 + 42;
        doc.text('=', x2, y + 8);
        doc.line(x2 + 5, y + 9, pageW - margin - 2, y + 9);
      }

      doc.setTextColor(0, 0, 0);
      y += regelH + 2;
    });

    return y + 4;
  }

  // ── Publieke API ──────────────────────────────────────────────
  return {
    leesInstellingen() {
      const leerjaar = document.querySelector('input[name="schrijfLeerjaar"]:checked')?.value || '2';

      if (leerjaar === '2') {
        const moeilijkheden = Array.from(
          document.querySelectorAll('input[name="schrijfMoeilijkheid"]:checked')
        ).map(cb => cb.value);
        if (moeilijkheden.length === 0) {
          document.getElementById('meldingSchrijven').textContent = 'Kies minstens één moeilijkheidsgraad!';
          return null;
        }
        const aantal = parseInt(document.getElementById('schrijfAantalWaarde').value) || 6;
        const tijden = genereer2de(moeilijkheden, aantal);
        document.getElementById('meldingSchrijven').textContent = '';
        return { type: 'schrijven', leerjaar, moeilijkheden, tijden };
      } else {
        const dagdelen = Array.from(
          document.querySelectorAll('input[name="schrijfDagdeel"]:checked')
        ).map(cb => cb.value);
        if (dagdelen.length === 0) {
          document.getElementById('meldingSchrijven').textContent = 'Kies minstens één dagdeel!';
          return null;
        }
        const aantal = parseInt(document.getElementById('schrijfAantalWaarde3').value) || 6;
        const tijden = genereer3de(dagdelen, aantal);
        document.getElementById('meldingSchrijven').textContent = '';
        return { type: 'schrijven', leerjaar, dagdelen, tijden };
      }
    },
    tekenPreviewHtml,
    tekenInPdf,
    naar12uSpreektaal,
  };

})();

/* ══════════════════════════════════════════════════════════════
   KlokRangschikken — module
   3 klokken per rij, rangschikken van vroeg naar laat
   ══════════════════════════════════════════════════════════════ */

const KlokRangschikken = (() => {

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Stap in minuten per nauwkeurigheid
  const STAP = { uur: 60, halfuur: 30, kwartier: 15, '5min': 5, '1min': 1 };

  // Genereer één groepje van 3 tijden
  function genereerGroepje(niveau, nauwkeurigheid) {
    const stap = STAP[nauwkeurigheid] || 60;

    // Genereer een willekeurige tijd binnen de nauwkeurigheid
    function willekeurigeTijd(uur) {
      const aantalStappen = 60 / stap;
      const minuut = Math.floor(Math.random() * aantalStappen) * stap;
      return { uur, min: minuut };
    }

    let tijden = [];

    if (niveau === '1') {
      // Ver uit elkaar: 3 verschillende uren, minuten willekeurig binnen nauwkeurigheid
      const uren = shuffle([1,2,3,4,5,6,7,8,9,10,11,12]).slice(0, 3).sort((a,b) => a-b);
      tijden = uren.map(u => willekeurigeTijd(u));

    } else if (niveau === '2') {
      // Dicht bij elkaar: zelfde uur, 3 opeenvolgende stappen
      const uur = Math.floor(Math.random() * 11) + 1;
      const maxStapIndex = Math.max(0, Math.floor(60 / stap) - 3);
      const startStap = Math.floor(Math.random() * (maxStapIndex + 1));
      tijden = [
        { uur, min: startStap * stap },
        { uur, min: (startStap + 1) * stap },
        { uur, min: (startStap + 2) * stap },
      ];

    } else {
      // Over de uurgrens
      const uur = Math.floor(Math.random() * 10) + 1;
      if (stap >= 60) {
        tijden = [
          { uur: uur,     min: 0 },
          { uur: uur + 1, min: 0 },
          { uur: uur + 2, min: 0 },
        ];
      } else {
        tijden = [
          { uur,      min: 60 - stap },
          { uur: uur + 1, min: 0 },
          { uur: uur + 1, min: stap },
        ];
      }
    }

    // Sorteer, schud, rangorde toewijzen
    const gesorteerd = [...tijden].sort((a, b) => a.uur * 60 + a.min - (b.uur * 60 + b.min));
    const schud = shuffle([...gesorteerd]);
    return schud.map(t => ({
      ...t,
      rang: gesorteerd.findIndex(g => g.uur === t.uur && g.min === t.min) + 1,
    }));
  }

  // ── HTML preview ──────────────────────────────────────────────
  function tekenPreviewHtml(container, instellingen) {
    if (!container || !instellingen) return;
    container.innerHTML = '';
    const { groepjes, weergave } = instellingen;

    groepjes.forEach(groep => {
      // Kader per rij
      const rij = document.createElement('div');
      rij.style.cssText = 'display:flex;gap:10px;margin-bottom:10px;border:2px solid #c0d8ee;border-radius:10px;padding:10px;background:#fff;';

      groep.forEach((t, gi) => {
        const cel = document.createElement('div');
        cel.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;';

        const toonType = weergave === 'gemengd'
          ? (gi % 2 === 0 ? 'analoog' : 'digitaal')
          : weergave;

        if (toonType === 'digitaal') {
          const wekkerWrap = document.createElement('div');
          wekkerWrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;';

          // Knopje
          const knopje = document.createElement('div');
          knopje.style.cssText = 'width:28px;height:9px;background:#5bbfba;border-radius:3px 3px 0 0;margin-bottom:-1px;z-index:1;';
          wekkerWrap.appendChild(knopje);

          // Body
          const body = document.createElement('div');
          body.style.cssText = 'background:#82d2d2;border:2px solid #5aafaa;border-radius:8px;padding:3px;width:80px;box-sizing:border-box;';

          // Grijs frame
          const frame = document.createElement('div');
          frame.style.cssText = 'background:#a0afb4;border-radius:5px;padding:3px;';

          // Wit scherm met tijd
          const scherm = document.createElement('div');
          scherm.style.cssText = 'background:#fff;border-radius:3px;padding:5px 6px;font-size:15px;font-weight:bold;color:#3c5060;text-align:center;letter-spacing:1px;';
          scherm.textContent = `${t.uur.toString().padStart(2,'0')}:${t.min.toString().padStart(2,'0')}`;

          frame.appendChild(scherm);
          body.appendChild(frame);
          wekkerWrap.appendChild(body);

          // Pootjes
          const pootjes = document.createElement('div');
          pootjes.style.cssText = 'display:flex;justify-content:space-between;width:64px;margin-top:-1px;';
          pootjes.innerHTML = '<div style="width:10px;height:6px;background:#646e73;border-radius:0 0 3px 3px;"></div><div style="width:10px;height:6px;background:#646e73;border-radius:0 0 3px 3px;"></div>';
          wekkerWrap.appendChild(pootjes);

          cel.appendChild(wekkerWrap);
        } else {
          // Analoge klok — volledig met cijfers en streepjes
          const cvs = document.createElement('canvas');
          const sz = 100;
          cvs.width = cvs.height = sz;
          cvs.style.cssText = 'width:66px;height:66px;';
          setTimeout(() => {
            const ctx = cvs.getContext('2d');
            const cx = sz/2, cy = sz/2, r = sz/2 - 3;
            // Buitenring
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2*Math.PI);
            ctx.fillStyle = '#A9D8E8'; ctx.fill();
            // Wijzerplaat
            ctx.beginPath(); ctx.arc(cx, cy, r*0.88, 0, 2*Math.PI);
            ctx.fillStyle = '#fff'; ctx.fill();
            // 60 streepjes
            for (let i = 0; i < 60; i++) {
              const hoek = (i - 15) * Math.PI / 30;
              const buit = r * 0.88;
              const binn = i % 5 === 0 ? buit * 0.83 : buit * 0.92;
              ctx.beginPath();
              ctx.moveTo(cx + buit*Math.cos(hoek), cy + buit*Math.sin(hoek));
              ctx.lineTo(cx + binn*Math.cos(hoek), cy + binn*Math.sin(hoek));
              ctx.strokeStyle = '#555'; ctx.lineWidth = i % 5 === 0 ? 1.5 : 0.8;
              ctx.stroke();
            }
            // Cijfers
            ctx.font = `bold ${Math.round(r * 0.22)}px Arial`;
            ctx.fillStyle = '#448866';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            for (let u = 1; u <= 12; u++) {
              const hoek = (u - 3) * Math.PI / 6;
              ctx.fillText(u, cx + r*0.68*Math.cos(hoek), cy + r*0.68*Math.sin(hoek));
            }
            // Uurwijzer
            const uurH = ((t.uur % 12) + t.min/60 - 3) * Math.PI/6;
            ctx.strokeStyle = '#333'; ctx.lineWidth = r * 0.07; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(cx, cy);
            ctx.lineTo(cx + r*0.52*Math.cos(uurH), cy + r*0.52*Math.sin(uurH)); ctx.stroke();
            // Minuutwijzer
            const minH = (t.min - 15) * Math.PI/30;
            ctx.lineWidth = r * 0.05;
            ctx.beginPath(); ctx.moveTo(cx, cy);
            ctx.lineTo(cx + r*0.78*Math.cos(minH), cy + r*0.78*Math.sin(minH)); ctx.stroke();
            // Middelpunt
            ctx.beginPath(); ctx.arc(cx, cy, r*0.06, 0, 2*Math.PI);
            ctx.fillStyle = '#333'; ctx.fill();
          }, 10);
          cel.appendChild(cvs);
        }

        const hokje = document.createElement('div');
        hokje.style.cssText = 'width:28px;height:24px;border:2px solid #4A90D9;border-radius:5px;background:#fff;margin-top:3px;';
        cel.appendChild(hokje);
        rij.appendChild(cel);
      });

      container.appendChild(rij);
    });
  }

  // ── PDF tekenen ───────────────────────────────────────────────
  function tekenInPdf(doc, instellingen, yStart, margin, hulpCanvas) {
    const { groepjes, weergave } = instellingen;
    const pageW   = doc.internal.pageSize.getWidth();
    const pageH   = doc.internal.pageSize.getHeight();
    const breedte = pageW - 2 * margin;
    const cols    = 3;
    const colW    = (breedte - (cols - 1) * 6) / cols;
    const klokD   = 30;
    const klokR   = klokD / 2;
    const hokjeH  = 10;
    const hokjeW  = 14;
    const kaderPad = 3;
    const rijH    = klokD + hokjeH + 8;
    let y = yStart;

    groepjes.forEach((groep, gi) => {
      // Check pagina — maar nooit voor de eerste rij (die hoort bij de opdrachtzin)
      if (gi > 0 && y + rijH + kaderPad * 2 + margin > pageH) {
        doc.addPage();
        y = margin;
      }

      // Kader rond de rij
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(160, 200, 230);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, y, breedte, rijH + kaderPad * 2, 3, 3, 'FD');

      groep.forEach((t, ti) => {
        const x  = margin + ti * (colW + 6);
        const cx = x + colW / 2;
        const cy = y + kaderPad + klokR + 2;

        const toonType = weergave === 'gemengd'
          ? (ti % 2 === 0 ? 'analoog' : 'digitaal')
          : weergave;

        if (toonType === 'digitaal') {
          const wW = colW * 0.75;
          const wH = wW * 0.52;
          const wX = cx - wW / 2;
          const wY = y + kaderPad + 2;
          const tijdStr = `${t.uur.toString().padStart(2,'0')}:${t.min.toString().padStart(2,'0')}`;
          tekenWekkerSilhouet(doc, wX, wY, wW, wH, tijdStr);
        } else {
          tekenKlokMiniPdf(doc, cx, cy, klokR, t.uur, t.min);
        }

        // Invulhokje: digitaal dichter, analoog meer ruimte, gemengd op analoog-niveau
        const isDigitaalCel = toonType === 'digitaal';
        const isMixed = weergave === 'gemengd';
        const hokjeOffsetY = (isDigitaalCel && !isMixed) ? 1 : 4;
        const hokjeX = cx - hokjeW / 2;
        const hokjeY = y + kaderPad + klokD + hokjeOffsetY;
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(74, 144, 217);
        doc.setLineWidth(0.6);
        doc.roundedRect(hokjeX, hokjeY, hokjeW, hokjeH, 2, 2, 'FD');
      });

      y += rijH + kaderPad * 2 + 1;
    });

    return y;
  }

  // Teken een wekker die lijkt op wekker.png: knopje boven, afgeronde body, wit scherm, pootjes
  function tekenWekkerSilhouet(doc, x, y, breedte, hoogte, tijdStr) {
    const cx = x + breedte / 2;
    const bodyH = hoogte * 0.72;
    const bodyY = y + hoogte * 0.14; // ruimte voor knopje

    // Knopje bovenop (afgerond rechthoekje)
    doc.setFillColor(80, 185, 180);
    doc.setDrawColor(60, 160, 155);
    doc.setLineWidth(0.3);
    doc.roundedRect(cx - breedte * 0.18, y, breedte * 0.36, hoogte * 0.18, 2, 2, 'FD');

    // Buitenste body — lichtblauw/teal
    doc.setFillColor(130, 210, 210);
    doc.setDrawColor(80, 170, 165);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, bodyY, breedte, bodyH, 4, 4, 'FD');

    // Binnenkader — grijs
    const kader1Pad = breedte * 0.05;
    doc.setFillColor(160, 175, 180);
    doc.roundedRect(x + kader1Pad, bodyY + kader1Pad * 0.6, breedte - kader1Pad * 2, bodyH - kader1Pad * 1.2, 3, 3, 'FD');

    // Wit scherm
    const schermPad = breedte * 0.09;
    const schermX = x + schermPad;
    const schermY = bodyY + schermPad * 0.7;
    const schermW = breedte - schermPad * 2;
    const schermH = bodyH - schermPad * 1.4;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(200, 215, 218);
    doc.setLineWidth(0.2);
    doc.roundedRect(schermX, schermY, schermW, schermH, 2, 2, 'FD');

    // Tijd in het scherm
    doc.setFontSize(breedte * 0.28);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(60, 80, 90);
    doc.text(tijdStr, cx, schermY + schermH * 0.68, { align: 'center' });
    doc.setFont(undefined, 'normal');

    // Pootjes
    const pootW = breedte * 0.1;
    const pootH = hoogte * 0.1;
    const pootY = bodyY + bodyH - 0.5;
    doc.setFillColor(100, 110, 115);
    doc.setDrawColor(80, 90, 95);
    doc.setLineWidth(0.2);
    doc.roundedRect(x + breedte * 0.15, pootY, pootW, pootH, 1, 1, 'FD');
    doc.roundedRect(x + breedte * 0.75, pootY, pootW, pootH, 1, 1, 'FD');

    doc.setTextColor(0, 0, 0);
  }

  // Mini analoge klok in PDF
  function tekenKlokMiniPdf(doc, cx, cy, r, uur, min) {
    doc.setFillColor(169, 216, 232);
    doc.circle(cx, cy, r, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(cx, cy, r * 0.88, 'F');
    doc.setDrawColor(80, 80, 80);
    for (let i = 0; i < 60; i++) {
      const hoek = (i - 15) * Math.PI / 30;
      const buit = r * 0.88;
      const binn = i % 5 === 0 ? r * 0.74 : r * 0.82;
      doc.setLineWidth(i % 5 === 0 ? 0.5 : 0.2);
      doc.line(cx + buit*Math.cos(hoek), cy + buit*Math.sin(hoek),
               cx + binn*Math.cos(hoek), cy + binn*Math.sin(hoek));
    }
    doc.setFontSize(r * 0.55);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(68, 136, 102);
    for (let u = 1; u <= 12; u++) {
      const hoek = (u - 3) * Math.PI / 6;
      doc.text(u.toString(), cx + r*0.62*Math.cos(hoek), cy + r*0.62*Math.sin(hoek) + 0.8, { align: 'center' });
    }
    doc.setFont(undefined, 'normal');
    const uurH = ((uur % 12) + min/60 - 3) * Math.PI/6;
    doc.setDrawColor(50, 50, 50); doc.setLineWidth(1.2);
    doc.line(cx, cy, cx + r*0.50*Math.cos(uurH), cy + r*0.50*Math.sin(uurH));
    const minH = (min - 15) * Math.PI/30;
    doc.setLineWidth(0.8);
    doc.line(cx, cy, cx + r*0.74*Math.cos(minH), cy + r*0.74*Math.sin(minH));
    doc.setFillColor(50, 50, 50);
    doc.circle(cx, cy, 0.8, 'F');
    doc.setTextColor(0, 0, 0);
  }

  return {
    leesInstellingen() {
      const niveau        = document.querySelector('input[name="rangNiveau"]:checked')?.value || '1';
      const nauwkeurigheid = document.querySelector('input[name="rangNauwkeurigheid"]:checked')?.value || 'uur';
      const weergave      = document.querySelector('input[name="rangWeergave"]:checked')?.value || 'analoog';
      const aantalRijen   = Math.max(1, parseInt(document.getElementById('rangAantalRijen')?.value) || 3);

      const groepjes = [];
      for (let i = 0; i < aantalRijen; i++) {
        groepjes.push(genereerGroepje(niveau, nauwkeurigheid));
      }

      return { type: 'rangschikken', niveau, nauwkeurigheid, weergave, aantalRijen, groepjes };
    },

    tekenPreviewHtml,
    tekenInPdf,
  };

})();

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
      // Opdrachtzin verbergen bij herhaalde rangschikken-oefeningen
      const vorigeRangOpdracht = gi > 0 && groepen[gi-1].type === 'rangschikken'
        ? groepen[gi-1].opdrachtzin : null;
      const verbergOpdracht = groep.type === 'rangschikken' &&
        groep.opdrachtzin === vorigeRangOpdracht;

      blok.innerHTML = `
        <div class="preview-blok-header">
          <span class="preview-blok-nr">Oefening ${gi + 1}${aantalLabel}</span>
          <span class="preview-blok-type">${typeLabel(groep.type, groep.items[0].instellingen, groep.items.length)}</span>
          <button class="preview-blok-verwijder" onclick="Bundel.verwijderGroep(${groep.groepId})">🗑 Verwijder oefening</button>
        </div>
        ${verbergOpdracht ? '' : `<div class="preview-opdracht">${groep.opdrachtzin}</div>`}
      `;

      if (groep.type === 'kloklezen') {
        const alleTijden    = groep.items.map(item => item.instellingen.tijden[0]);
        const basisInst     = groep.items[0].basisInstellingen || groep.items[0].instellingen;
        const groepeerdInst = { ...basisInst, numClocks: alleTijden.length, tijden: alleTijden };

        if (basisInst.klokType === 'digitaal') {
          const isStopwatch = basisInst.digitaalNotatie === 'stopwatch';
          const inhoud = document.createElement('div');
          inhoud.className = 'preview-inhoud';
          inhoud.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:10px;';

          alleTijden.forEach(t => {
            if (!t) return;
            const cel = document.createElement('div');
            cel.style.cssText = 'border:2px solid #90bce0;border-radius:8px;overflow:hidden;background:#f0f8ff;';

            // Digitale display — HH:MM:SS bij stopwatch, HH:MM anders
            const display = document.createElement('div');
            display.style.cssText = `background:#e8f0fe;padding:10px;text-align:center;font-size:${isStopwatch ? 15 : 20}px;font-weight:bold;color:#1a3a8c;letter-spacing:1px;border-bottom:1px solid #90bce0;`;
            if (isStopwatch) {
              display.textContent = `${(t.uur||0).toString().padStart(2,'0')}:${(t.min||0).toString().padStart(2,'0')}:${(t.sec||0).toString().padStart(2,'0')}`;
            } else {
              display.textContent = `${(t.uur||0).toString().padStart(2,'0')}:${(t.minuut||0).toString().padStart(2,'0')}`;
            }

            // Schrijflijn
            const lijn = document.createElement('div');
            lijn.style.cssText = 'padding:6px 8px 4px;font-size:14px;color:#444;';
            lijn.innerHTML = isStopwatch
              ? `Het is<br><span style="display:block;border-bottom:1px solid #555;margin:6px 0 8px;"></span><span style="display:block;border-bottom:1px solid #555;margin-top:2px;"></span>`
              : `Het is <span style="display:block;border-bottom:1px solid #555;margin-top:4px;"></span>`;

            cel.appendChild(display);
            cel.appendChild(lijn);
            inhoud.appendChild(cel);
          });

          blok.appendChild(inhoud);
          container.appendChild(blok);

        } else {
          // Analoge klokken (bestaande route)
          const wrapper = document.createElement('div');
          wrapper.style.cssText = 'position:relative;padding:8px;display:flex;justify-content:center;';

          const cvs = document.createElement('canvas');
          cvs.style.cssText = 'display:block;';
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

            const canvasLeft = cvs.offsetLeft;
            overlay.style.left   = canvasLeft + 'px';
            overlay.style.width  = cvs.offsetWidth  + 'px';
            overlay.style.height = cvs.offsetHeight + 'px';

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
        }

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

      } else if (groep.type === 'schrijven') {
        const inhoud = document.createElement('div');
        inhoud.className = 'preview-inhoud';
        KlokSchrijven.tekenPreviewHtml(inhoud, groep.items[0].instellingen);
        blok.appendChild(inhoud);

      } else if (groep.type === 'begrippen') {
        const inhoud = document.createElement('div');
        inhoud.className = 'preview-inhoud';
        KlokBegrippen.tekenPreviewHtml(inhoud, groep.items[0].instellingen);
        blok.appendChild(inhoud);

      } else if (groep.type === 'rangschikken') {
        const inhoud = document.createElement('div');
        inhoud.className = 'preview-inhoud';
        KlokRangschikken.tekenPreviewHtml(inhoud, groep.items[0].instellingen);
        const verwijderBtn = document.createElement('button');
        verwijderBtn.className = 'preview-blok-verwijder';
        verwijderBtn.textContent = '🗑 Verwijder oefening';
        verwijderBtn.onclick = () => Bundel.verwijderGroep(groep.items[0].groepId);
        inhoud.appendChild(verwijderBtn);
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
    if (type === 'begrippen') {
      return `🧠 Begrippen — ${inst.begrip}`;
    }
    if (type === 'schrijven') {
      return `✏️ Schrijven — ${inst.leerjaar}de lj, ${(inst.tijden||[]).length} oefeningen`;
    }
    if (type === 'tijdverschil') {
      return `⏱️ Tijdverschil — ${(inst.oefeningen||[]).length} oefeningen`;
    }
    if (type === 'ordenen') {
      return `📅 Dagdelen — ${(inst.wekkers||[]).length} wekkers`;
    }
    if (type === 'rangschikken') {
      const niv = inst.niveau === '1' ? 'makkelijk' : inst.niveau === '2' ? 'middel' : 'moeilijk';
      return `🔢 Rangschikken — ${inst.weergave}, niveau ${niv}`;
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

  // ── Digitale wekkers tekenen in PDF ──────────────────────────
  function tekenDigitaleWekkersPdf(doc, tijden, inst, yStart, margin, pageW, pageH) {
    const breedte  = pageW - 2 * margin;
    const cols     = 3;
    const colW     = (breedte - (cols - 1) * 8) / cols;
    const wekkerW  = colW * 0.70;   // wekker smaller dan kolom
    const wekkerH  = 20;
    const belR     = 2.5;
    const pootH    = 3;
    const lijnOff  = 8;
    const celH     = belR * 2 + wekkerH + pootH + 7 + 6 + lijnOff + (inst?.digitaalNotatie === 'stopwatch' ? 16 : 8);
    let y = yStart;

    tijden.forEach((t, i) => {
      if (!t) return;
      const col = i % cols;
      if (col === 0 && i > 0) y += celH + 8;
      if (y + celH + margin > pageH) { doc.addPage(); y = yStart; }

      const x    = margin + col * (colW + 8);
      const cx   = x + colW / 2;
      const wx   = cx - wekkerW / 2;

      // Lichtgrijs kader rond de hele oefening
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(200, 210, 225);
      doc.setLineWidth(0.3);
      doc.roundedRect(x - 2, y - 1, colW + 4, celH + 1, 2, 2, 'FD');

      // Belletje bovenop (gecentreerd op wekker)
      const belY = y;
      doc.setFillColor(100, 140, 200);
      doc.circle(cx, belY + belR, belR, 'F');
      doc.setFillColor(140, 170, 220);
      doc.circle(cx, belY + belR, belR * 0.5, 'F');

      // Wekker-body (smaller, gecentreerd)
      const bodyY = belY + belR * 1.5;
      doc.setFillColor(235, 244, 255);
      doc.setDrawColor(80, 130, 200);
      doc.setLineWidth(0.6);
      doc.roundedRect(wx, bodyY, wekkerW, wekkerH, 3, 3, 'FD');

      // Scherm
      const schermPad = 3;
      const schermX = wx + schermPad;
      const schermY = bodyY + schermPad;
      const schermW = wekkerW - schermPad * 2;
      const schermH = wekkerH - schermPad * 2;
      doc.setFillColor(210, 228, 255);
      doc.setDrawColor(100, 150, 210);
      doc.setLineWidth(0.3);
      doc.roundedRect(schermX, schermY, schermW, schermH, 2, 2, 'FD');

      // Tijd — stopwatch of gewone tijd
      const isStopwatch = t.isStopwatch;
      const tijdStr = isStopwatch
        ? `${(t.uur||0).toString().padStart(2,'0')}:${(t.min||0).toString().padStart(2,'0')}:${(t.sec||0).toString().padStart(2,'0')}`
        : `${(t.uur||0).toString().padStart(2,'0')}:${(t.minuut||0).toString().padStart(2,'0')}`;
      doc.setFontSize(isStopwatch ? 13 : 12); doc.setFont(undefined, 'bold');
      doc.setTextColor(15, 40, 130);
      doc.text(tijdStr, cx, schermY + schermH * 0.68, { align: 'center' });
      doc.setFont(undefined, 'normal');

      // Pootjes
      const pootY = bodyY + wekkerH;
      const pootW = wekkerW * 0.14;
      doc.setFillColor(80, 130, 200);
      doc.roundedRect(wx + wekkerW * 0.13, pootY, pootW, pootH, 1, 1, 'F');
      doc.roundedRect(wx + wekkerW * 0.73, pootY, pootW, pootH, 1, 1, 'F');

      // Schrijflijn(en) — stopwatch krijgt 2 lijnen
      if (isStopwatch) {
        const hetIsY = pootY + pootH + 7;
        doc.setFontSize(14); doc.setFont(undefined, 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text('Het is', x, hetIsY);
        doc.setDrawColor(80, 80, 80); doc.setLineWidth(0.5);
        doc.line(x, hetIsY + lijnOff, x + colW, hetIsY + lijnOff);
        // Tweede schrijflijn
        doc.line(x, hetIsY + lijnOff + 9, x + colW, hetIsY + lijnOff + 9);
        doc.setTextColor(0, 0, 0);
      } else {
        const hetIsY = pootY + pootH + 7;
        doc.setFontSize(14); doc.setFont(undefined, 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text('Het is', x, hetIsY);
        doc.setDrawColor(80, 80, 80); doc.setLineWidth(0.5);
        doc.line(x, hetIsY + lijnOff, x + colW, hetIsY + lijnOff);
        doc.setTextColor(0, 0, 0);
      }
    });

    const aantalRijen = Math.ceil(tijden.length / cols);
    return yStart + aantalRijen * (celH + 8);
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
    let y = tekenHeader(true);
    let eersteRangschikkenOpdracht = null; // bijhouden welke opdrachtzin al getoond werd

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
      if (groep.type === 'kloklezen')    eersteBlokH = 80;  // één rij klokken
      if (groep.type === 'maateenheden') eersteBlokH = 30;
      if (groep.type === 'verbinden')    eersteBlokH = KlokVerbinden.RIJ_H;
      if (groep.type === 'schrijven')     eersteBlokH = 40;
      if (groep.type === 'begrippen')     eersteBlokH = 50;
      if (groep.type === 'rangschikken')  eersteBlokH = 65;  // klokD(30) + hokje(10) + padding(12) + kader(8) + marge
      if (groep.type === 'tijdverschil') eersteBlokH = 50;
      if (groep.type === 'ordenen')      eersteBlokH = 90;  // legenda + eerste rij wekkers

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

      // Opdrachtzin — bij rangschikken enkel de eerste keer tonen
      const toonOpdrachtzin = groep.type !== 'rangschikken' ||
        groep.opdrachtzin !== eersteRangschikkenOpdracht;
      if (groep.type === 'rangschikken') eersteRangschikkenOpdracht = groep.opdrachtzin;

      if (toonOpdrachtzin) {
        y = tekenOpdrachtzin(doc, y + 2, groep.opdrachtzin) + 2;
      } else {
        y += 4; // kleine witruimte tussen opeenvolgende rangschikken-rijen
      }

      if (groep.type === 'kloklezen') {
        const alleTijden = groep.items.map(item => item.instellingen.tijden[0]);
        const basisInst  = groep.items[0].basisInstellingen || groep.items[0].instellingen;

        if (basisInst.klokType === 'digitaal') {
          // Digitale wekkers: raster met wekker-display + schrijflijn
          y = tekenDigitaleWekkersPdf(doc, alleTijden, basisInst, y, margin, pageW, pageH);

        } else {
          // Analoge klokken (bestaande route)
          const PER_PAGINA = 9;
          for (let start = 0; start < alleTijden.length; start += PER_PAGINA) {
            if (start > 0) {
              doc.addPage();
              y = tekenHeader(false);
              y = tekenOpdrachtzin(doc, y + 2, groep.opdrachtzin) + 2;
            }
            const pageTijden = alleTijden.slice(start, start + PER_PAGINA);
            const pageInst   = { ...basisInst, numClocks: pageTijden.length, tijden: pageTijden };
            y = KlokLezen.tekenInPdf(doc, pageInst, hulpCanvas, y, margin);
          }
        }

      } else if (groep.type === 'maateenheden') {
        Maateenheden.tekenInPdf(doc, groep.items[0].instellingen, y + 4, margin);
        y += 4 + Math.ceil(groep.items[0].instellingen.vragen.length / (groep.items[0].instellingen.kolommen || 2)) * 12;

      } else if (groep.type === 'schrijven') {
        y = KlokSchrijven.tekenInPdf(doc, groep.items[0].instellingen, y, margin);

      } else if (groep.type === 'begrippen') {
        y = KlokBegrippen.tekenInPdf(doc, groep.items[0].instellingen, y, margin);

      } else if (groep.type === 'rangschikken') {
        y = KlokRangschikken.tekenInPdf(doc, groep.items[0].instellingen, y, margin, hulpCanvas);

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

    // ── Voettekst op elke pagina ──────────────────────────────
    const aantalPaginas = doc.internal.getNumberOfPages();
    for (let p = 1; p <= aantalPaginas; p++) {
      doc.setPage(p);
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(160, 160, 160);
      doc.text("Juf Zisa's kloklezen generator  —  www.jufzisa.be", pageW / 2, pageH - margin + 3, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    }

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

  // ── Maateenheden: preview initialiseren ──────────────────────
  genereerMaatPreview();

  // ── KlokType toggle: analoog / digitale wekker ───────────────
  function updateKlokType() {
    const type = document.querySelector('input[name="klokType"]:checked')?.value || 'analoog';
    const isDigitaal  = type === 'digitaal';
    const notatie     = document.querySelector('input[name="digitaalNotatie"]:checked')?.value || '12u';
    const isStopwatch = isDigitaal && notatie === 'stopwatch';

    document.getElementById('kaart-invulmethode').style.display   = isDigitaal ? 'none' : '';
    document.getElementById('kaart-hulpmiddelen').style.display    = isDigitaal ? 'none' : '';
    document.getElementById('kaart-tijdnotatie').style.display     = isDigitaal ? 'none' : '';
    document.getElementById('kaart-digitaalNotatie').style.display = isDigitaal ? '' : 'none';

    // Bij stopwatch: moeilijkheidsgraad niet relevant
    const kaartMoeilijk = document.querySelector('.config-kaart:has(input[name="moeilijkheid"])');
    if (kaartMoeilijk) kaartMoeilijk.style.display = isStopwatch ? 'none' : '';

    const ta = document.getElementById('opdrachtzin');
    if (ta) {
      if (isStopwatch) ta.value = 'Schrijf de tijd op. Bijvoorbeeld: Het is 9 uur, 21 minuten en 35 seconden.';
      else if (isDigitaal) ta.value = 'Schrijf hoe laat het is. Bijvoorbeeld: Het is 5 voor 12.';
      else updateOpdrachtzin();
    }
  }

  document.querySelectorAll('input[name="klokType"], input[name="digitaalNotatie"]').forEach(r => {
    r.addEventListener('change', updateKlokType);
  });

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

  // ── Begrippen tab ─────────────────────────────────────────────
  function genereerBegripPreview() {
    const inst = KlokBegrippen.leesInstellingen();
    if (!inst) return;
    KlokBegrippen.tekenPreviewHtml(document.getElementById('begrippenPreview'), inst);
  }

  document.querySelectorAll('input[name="begrip"], input[name="begripKleur"], #begripMetSeconden')
    .forEach(el => el.addEventListener('change', genereerBegripPreview));

  document.getElementById('voegBegripToeBtn')?.addEventListener('click', () => {
    const inst = KlokBegrippen.leesInstellingen();
    if (!inst) return;
    const opdrachtzin = document.getElementById('opdrachtzinBegrippen').value.trim()
      || 'Kleur de kaartjes die kloppen in de juiste kleur.';
    Bundel.voegToe(inst, opdrachtzin);
    genereerBegripPreview();
  });

  genereerBegripPreview();

  // ── Rangschikken ──────────────────────────────────────────────
  function genereerRangPreview() {
    const inst = KlokRangschikken.leesInstellingen();
    if (!inst) return;
    KlokRangschikken.tekenPreviewHtml(document.getElementById('rangPreview'), inst);
  }

  document.querySelectorAll('input[name="rangNiveau"], input[name="rangNauwkeurigheid"], input[name="rangWeergave"]')
    .forEach(el => el.addEventListener('change', genereerRangPreview));
  document.getElementById('rangAantalRijen')?.addEventListener('input', genereerRangPreview);

  document.getElementById('voegRangToeBtn')?.addEventListener('click', () => {
    const inst = KlokRangschikken.leesInstellingen();
    if (!inst) return;
    const opdrachtzin = document.getElementById('opdrachtzinRangschikken').value.trim()
      || 'Schrijf 1, 2 of 3 onder elke klok van vroeg naar laat.';
    Bundel.voegToe(inst, opdrachtzin);
    genereerRangPreview();
  });

  genereerRangPreview();

  function genereerSchrijfPreview() {
    const inst = KlokSchrijven.leesInstellingen();
    if (!inst) return;
    KlokSchrijven.tekenPreviewHtml(document.getElementById('schrijfPreview'), inst);
  }

  // Leerjaar toggle
  document.querySelectorAll('input[name="schrijfLeerjaar"]').forEach(r => {
    r.addEventListener('change', () => {
      const is3de = r.value === '3';
      document.getElementById('schrijf2deOpties').style.display = is3de ? 'none' : '';
      document.getElementById('schrijf3deOpties').style.display = is3de ? '' : 'none';
      // Zorg dat alle dagdelen aangevinkt zijn als we naar 3de wisselen
      if (is3de) {
        document.querySelectorAll('input[name="schrijfDagdeel"]').forEach(cb => {
          cb.checked = true;
          cb.closest('.checkbox-chip')?.classList.add('geselecteerd');
        });
      }
      genereerSchrijfPreview();
    });
  });

  // Aantal radio's koppelen
  document.querySelectorAll('input[name="schrijfAantal"]').forEach(r => {
    r.addEventListener('change', () => {
      document.getElementById('schrijfAantalWaarde').value = r.value;
      genereerSchrijfPreview();
    });
  });
  document.querySelectorAll('input[name="schrijfAantal3"]').forEach(r => {
    r.addEventListener('change', () => {
      document.getElementById('schrijfAantalWaarde3').value = r.value;
      genereerSchrijfPreview();
    });
  });

  document.querySelectorAll('input[name="schrijfMoeilijkheid"], input[name="schrijfDagdeel"]')
    .forEach(el => el.addEventListener('change', genereerSchrijfPreview));

  document.getElementById('voegSchrijfToeBtn')?.addEventListener('click', () => {
    const inst = KlokSchrijven.leesInstellingen();
    if (!inst) return;
    const opdrachtzin = document.getElementById('opdrachtzinSchrijven').value.trim()
      || 'Schrijf de tijd op twee manieren.';
    Bundel.voegToe(inst, opdrachtzin);
    genereerSchrijfPreview();
  });

  genereerSchrijfPreview();
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
    // Opdrachtzin aanpassen
    const ta = document.getElementById('opdrachtzinTijdverschil');
    if (ta && !ta._aangepast) {
      ta.value = inst.metStopwatch
        ? 'Hoeveel uur, minuten en seconden liggen er tussen de twee tijden?'
        : 'Hoeveel minuten liggen er tussen de twee klokken?';
    }
  }

  document.querySelectorAll('input[name="tvMoeilijkheid"], input[name="tvMoeilijkheid4"], input[name="tvOverschrijding4"], input[name="tvOverschrijdingMin"], input[name="tvOverschrijdingUur"], input[name="tvKlokType"], #tvHulplijn, #tvNotatie')
    .forEach(el => el.addEventListener('change', genereerTvPreview));

  document.getElementById('opdrachtzinTijdverschil')?.addEventListener('input', function() {
    this._aangepast = true;
  });

  document.getElementById('voegTvToeBtn')?.addEventListener('click', () => {
    const inst = KlokTijdverschil.leesInstellingen();
    if (!inst) return;
    const opdrachtzin = document.getElementById('opdrachtzinTijdverschil').value.trim()
      || (inst.metStopwatch
        ? 'Hoeveel uur, minuten en seconden liggen er tussen de twee tijden?'
        : 'Hoeveel minuten liggen er tussen de twee klokken?');
    Bundel.voegToe(inst, opdrachtzin);
    genereerTvPreview();
  });

  // ── Verbinden sub-tabs ────────────────────────────────────────
  window.toonVerbSubTab = function(nr) {
    document.getElementById('verbSectie1').style.display = nr === 1 ? '' : 'none';
    document.getElementById('verbSectie2').style.display = nr === 2 ? '' : 'none';
    const btn1 = document.getElementById('verbSubTab1');
    const btn2 = document.getElementById('verbSubTab2');
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#4A90D9';
    btn1.style.background = nr === 1 ? 'var(--accent)' : '#fff';
    btn1.style.color       = nr === 1 ? '#fff' : 'var(--accent)';
    btn1.style.borderColor = 'var(--accent)';
    btn2.style.background  = nr === 2 ? 'var(--accent)' : '#fff';
    btn2.style.color        = nr === 2 ? '#fff' : 'var(--accent)';
    btn2.style.borderColor  = 'var(--accent)';
  };
  function updateTvLeerjaar() {
    const lj = document.querySelector('input[name="tvLeerjaar"]:checked')?.value || '23';
    document.getElementById('tvOpties23').style.display = lj === '23' ? '' : 'none';
    document.getElementById('tvOpties4').style.display  = lj === '4'  ? '' : 'none';
    document.getElementById('tvOpties56').style.display = lj === '56' ? '' : 'none';
    // Hulpmiddelen verbergen bij 5de/6de (stopwatch)
    document.getElementById('kaart-tvHulp').style.display = lj === '56' ? 'none' : '';
    // Opdrachtzin aanpassen
    const ta = document.getElementById('opdrachtzinTijdverschil');
    if (ta && !ta._aangepast) {
      if (lj === '56') ta.value = 'Hoeveel uur, minuten en seconden liggen er tussen de twee tijden?';
      else if (document.querySelector('input[name="tvType23"]:checked')?.value === 'uren') ta.value = 'Hoeveel uur verschil zit er tussen de twee klokken?';
      else ta.value = 'Hoeveel minuten liggen er tussen de twee klokken?';
    }
    genereerTvPreview();
  }

  document.querySelectorAll('input[name="tvLeerjaar"]').forEach(r => r.addEventListener('change', updateTvLeerjaar));
  document.querySelectorAll('input[name="tvType23"]').forEach(r => r.addEventListener('change', () => {
    const ta = document.getElementById('opdrachtzinTijdverschil');
    if (ta && !ta._aangepast) {
      ta.value = r.value === 'uren'
        ? 'Hoeveel uur verschil zit er tussen de twee klokken?'
        : 'Hoeveel minuten liggen er tussen de twee klokken?';
    }
    genereerTvPreview();
  }));

  updateTvLeerjaar(); // initieel

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
  document.getElementById('verb24Dagdeel')?.addEventListener('change', genereerVerb24Preview);
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
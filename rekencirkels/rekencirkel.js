document.addEventListener("DOMContentLoaded", function() {
  var NUM_SEGMENTS = 6;

  // STATE
  var circleConfigs = [];
  var generatedData = [];

  // HELPERS
  function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function setMessage(text) {
    var el = document.getElementById("meldingContainer");
    if (!el) return;
    el.textContent = text || "";
    el.style.display = text ? "" : "none";
  }

  // GENERATORS
  function checkBridging(n1, n2, brugType) {
    if (brugType === "beide") return true;
    var hasBrug = (n1 % 10) + (n2 % 10) >= 10;
    return brugType === "met" ? hasBrug : !hasBrug;
  }

  function generateMaaltafel(tafel) {
    var pool = shuffle([0,1,2,3,4,5,6,7,8,9,10]).slice(0, NUM_SEGMENTS);
    var solutionPairs = pool.map(function(g) { return { inner: g, outer: g * tafel }; });
    var displayPairs = solutionPairs.map(function(pair) {
      return Math.random() > 0.5
        ? { inner: "?", outer: pair.outer }
        : { inner: pair.inner, outer: "?" };
    });
    return {
      display:  { center: "x" + tafel, pairs: displayPairs },
      solution: { center: "x" + tafel, pairs: solutionPairs }
    };
  }

  function generateAddition(type, niveau, brug) {
    for (var attempt = 0; attempt < 400; attempt++) {
      var minCenter = niveau <= 10 ? 2 : 10;
      var centerNumber = rnd(minCenter, niveau);
      var pairs = [];
      var ok = true;
      for (var i = 0; i < NUM_SEGMENTS; i++) {
        var t1 = rnd(1, centerNumber - 1);
        var t2 = centerNumber - t1;
        if (!checkBridging(t1, t2, brug)) { ok = false; break; }
        pairs.push({ inner: t1, outer: t2 });
      }
      if (!ok) continue;

      if (type === "zoekSom") {
        var allIdx = [0,1,2,3,4,5];
        var fullIdx = shuffle(allIdx).slice(0, 2);
        var displayPairs = pairs.map(function(p, i) {
          if (fullIdx.indexOf(i) >= 0) return { inner: p.inner, outer: p.outer };
          return Math.random() > 0.5
            ? { inner: "?", outer: p.outer }
            : { inner: p.inner, outer: "?" };
        });
        return {
          display:  { center: "?", pairs: displayPairs },
          solution: { center: centerNumber, pairs: pairs }
        };
      } else {
        var displayPairs2 = pairs.map(function(p) {
          return Math.random() > 0.5
            ? { inner: "?", outer: p.outer }
            : { inner: p.inner, outer: "?" };
        });
        return {
          display:  { center: centerNumber, pairs: displayPairs2 },
          solution: { center: centerNumber, pairs: pairs }
        };
      }
    }
    setMessage("Kon geen oefening genereren met deze instellingen.");
    return null;
  }

  function generateCircle(cfg) {
    if (!cfg) return null;
    if (cfg.type === "maaltafel") return generateMaaltafel(cfg.tafel != null ? cfg.tafel : 2);
    return generateAddition(cfg.type, cfg.niveau != null ? cfg.niveau : 100, cfg.brug || "beide");
  }

  // CANVAS HELPERS
  function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawField(ctx, value, x, y, cellSize) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    var w = cellSize * 2.0;
    var h = cellSize * 1.55;
    var r = h * 0.35;
    if (value === "?") {
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#888888";
      ctx.lineWidth = 1.8;
      drawRoundedRect(ctx, x - w / 2, y - h / 2, w, h, r);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = "#111111";
      ctx.font = "bold " + cellSize + "px 'Segoe UI', Arial, sans-serif";
      ctx.fillText(String(value), x, y + 1);
    }
    ctx.restore();
  }

  function drawSingleCircle(ctx, data, cx, cy, radius) {
    if (!data) return;
    var centerRadius = radius * 0.22;
    var innerRing    = radius * 0.58;
    var outerRing    = radius * 0.97;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, outerRing, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#222222";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, innerRing, 0, 2 * Math.PI);
    ctx.strokeStyle = "#222222";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, centerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "#f0f0f0";
    ctx.fill();
    ctx.strokeStyle = "#222222";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    for (var i = 0; i < NUM_SEGMENTS; i++) {
      var angle = (i / NUM_SEGMENTS) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * centerRadius, cy + Math.sin(angle) * centerRadius);
      ctx.lineTo(cx + Math.cos(angle) * outerRing,    cy + Math.sin(angle) * outerRing);
      ctx.strokeStyle = "#222222";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    var cellSize = radius * 0.14;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold " + (cellSize * 1.15) + "px 'Segoe UI', Arial, sans-serif";
    ctx.fillStyle = "#111111";
    ctx.fillText(String(data.center), cx, cy + 1);
    ctx.restore();

    var innerR = (centerRadius + innerRing) / 2;
    var outerR = (innerRing + outerRing) / 2;
    for (var j = 0; j < NUM_SEGMENTS; j++) {
      var ang = (j / NUM_SEGMENTS) * 2 * Math.PI + (Math.PI / NUM_SEGMENTS);
      drawField(ctx, data.pairs[j].inner,
        cx + Math.cos(ang) * innerR, cy + Math.sin(ang) * innerR, cellSize);
      drawField(ctx, data.pairs[j].outer,
        cx + Math.cos(ang) * outerR, cy + Math.sin(ang) * outerR, cellSize);
    }
    ctx.restore();
  }

  // GROUP LOGIC
  function buildGroups() {
    var groups = [];
    for (var i = 0; i < generatedData.length; i++) {
      if (!generatedData[i]) continue;
      var cfg    = circleConfigs[i];
      var isMaal = cfg.type === "maaltafel";
      var label  = isMaal ? "Vermenigvuldigen: Vul aan." : "Optellen: Vul aan.";
      var last   = groups[groups.length - 1];
      if (last && last.isMaal === isMaal) {
        last.indices.push(i);
      } else {
        groups.push({ label: label, isMaal: isMaal, indices: [i] });
      }
    }
    return groups;
  }

  // CANVAS WORKSHEET (preview + PNG)
  function buildWorksheetCanvas(scale) {
    scale = scale || 1;
    var validCount = 0;
    for (var vi = 0; vi < generatedData.length; vi++) { if (generatedData[vi]) validCount++; }
    if (validCount === 0) return null;

    var groups = buildGroups();
    var cols   = validCount === 1 ? 1 : 2;

    var BASE_CELL   = 250;
    var BASE_PAD    = 28;
    var BASE_HEADER = 80;
    var BASE_LABEL  = 40;
    var BASE_BOT    = 38;

    var cell    = BASE_CELL   * scale;
    var pad     = BASE_PAD    * scale;
    var headerH = BASE_HEADER * scale;
    var labelH  = BASE_LABEL  * scale;
    var botH    = BASE_BOT    * scale;

    var totalH = headerH + botH;
    for (var gi = 0; gi < groups.length; gi++) {
      var gr = Math.ceil(groups[gi].indices.length / cols);
      totalH += labelH + pad + gr * (cell + pad);
    }
    var W = cols * cell + (cols + 1) * pad;

    var offCanvas = document.createElement("canvas");
    offCanvas.width  = W;
    offCanvas.height = totalH;
    var c = offCanvas.getContext("2d");

    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, W, totalH);

    // Header: naam / datum
    var hfs   = 13 * scale;
    var lineY = 18 * scale;
    c.save();
    c.font = hfs + "px 'Segoe UI', Arial, sans-serif";
    c.fillStyle = "#333333";
    c.textBaseline = "middle";
    c.fillText("Naam:", pad, lineY);
    c.strokeStyle = "#999999";
    c.lineWidth = 1 * scale;
    c.beginPath();
    c.moveTo(pad + 38 * scale, lineY + 2 * scale);
    c.lineTo(pad + 38 * scale + 160 * scale, lineY + 2 * scale);
    c.stroke();
    var datumX = pad + 38 * scale + 160 * scale + 20 * scale;
    c.fillText("Datum:", datumX, lineY);
    c.beginPath();
    c.moveTo(datumX + 44 * scale, lineY + 2 * scale);
    c.lineTo(datumX + 44 * scale + 100 * scale, lineY + 2 * scale);
    c.stroke();
    c.restore();

    // Titel
    c.save();
    c.font = "bold " + (22 * scale) + "px 'Segoe UI', Arial, sans-serif";
    c.fillStyle = "#111111";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("Rekencirkels", W / 2, 55 * scale);
    c.restore();

    // Groepen
    var cursorY = headerH;
    var radius  = (cell / 2) * 0.86;

    for (var gi2 = 0; gi2 < groups.length; gi2++) {
      var g = groups[gi2];
      var kaderX = pad;
      var kaderW = W - pad * 2;
      var kaderH = labelH - 6 * scale;

      c.save();
      c.fillStyle = "#f0f0f0";
      c.strokeStyle = "#888888";
      c.lineWidth = 1.2 * scale;
      drawRoundedRect(c, kaderX, cursorY, kaderW, kaderH, 7 * scale);
      c.fill();
      c.stroke();
      c.font = "bold " + (13 * scale) + "px 'Segoe UI', Arial, sans-serif";
      c.fillStyle = "#111111";
      c.textAlign = "left";
      c.textBaseline = "middle";
      c.fillText(g.label, kaderX + 12 * scale, cursorY + kaderH / 2);
      c.restore();

      cursorY += labelH + 2 * scale;

      var groupRows = Math.ceil(g.indices.length / cols);
      for (var r = 0; r < groupRows; r++) {
        for (var col = 0; col < cols; col++) {
          var idx = g.indices[r * cols + col];
          if (idx === undefined || !generatedData[idx]) continue;
          var cx = pad + col * (cell + pad) + cell / 2;
          var cy = cursorY + pad + cell / 2;
          drawSingleCircle(c, generatedData[idx].display, cx, cy, radius);
        }
        cursorY += cell + pad;
      }
    }

    // Footer
    c.save();
    c.font = (10 * scale) + "px 'Segoe UI', Arial, sans-serif";
    c.fillStyle = "#aaaaaa";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("Juf Zisa's Spelgenerator \u2013 www.jufzisa.be", W / 2, totalH - 16 * scale);
    c.restore();

    return offCanvas;
  }

  function renderPreviewCanvas() {
    var previewCanvas = document.getElementById("mainCanvas");
    if (!previewCanvas) return;
    var ctx = previewCanvas.getContext("2d");
    var off = buildWorksheetCanvas(1);
    if (!off) {
      previewCanvas.width  = 520;
      previewCanvas.height = 400;
      ctx.fillStyle = "#f4f8fb";
      ctx.fillRect(0, 0, 520, 400);
      ctx.fillStyle = "#7a9bb5";
      ctx.font = "16px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Voeg cirkels toe om een voorbeeld te zien.", 260, 200);
      return;
    }
    previewCanvas.width  = off.width;
    previewCanvas.height = off.height;
    ctx.drawImage(off, 0, 0);
  }

  // NATIVE PDF RENDERING
  function drawFieldPDF(doc, value, xMM, yMM, fontSize, radiusMM) {
    if (value === "?") {
      // Invulhokje: breedte/hoogte gebaseerd op de beschikbare ruimte in de ring
      var boxW = radiusMM * 0.28;
      var boxH = radiusMM * 0.22;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.3);
      doc.roundedRect(xMM - boxW / 2, yMM - boxH / 2, boxW, boxH, 1.0, 1.0, "FD");
    } else {
      // fontSize is in pt; vertical baseline correction: pt naar mm = /2.835
      var baselineCorr = (fontSize / 2.835) * 0.35;
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 20, 20);
      doc.text(String(value), xMM, yMM + baselineCorr, { align: "center" });
    }
  }

  function drawCirclePDF(doc, data, cxMM, cyMM, radiusMM) {
    if (!data) return;
    var cr  = radiusMM * 0.22;
    var ir  = radiusMM * 0.58;
    var or_ = radiusMM * 0.97;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(0.5);
    doc.circle(cxMM, cyMM, or_, "FD");

    doc.setLineWidth(0.4);
    doc.circle(cxMM, cyMM, ir, "S");

    doc.setFillColor(240, 240, 240);
    doc.setLineWidth(0.4);
    doc.circle(cxMM, cyMM, cr, "FD");

    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(0.35);
    for (var i = 0; i < NUM_SEGMENTS; i++) {
      var angle = (i / NUM_SEGMENTS) * 2 * Math.PI;
      doc.line(
        cxMM + Math.cos(angle) * cr,  cyMM + Math.sin(angle) * cr,
        cxMM + Math.cos(angle) * or_, cyMM + Math.sin(angle) * or_
      );
    }

    // Centrum: hokje als "?", anders getal
    var centerFS = Math.min(radiusMM * 0.36 * 2.835, 13);
    if (data.center === "?") {
      var cBoxW = cr * 1.5;
      var cBoxH = cr * 1.1;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.4);
      doc.roundedRect(cxMM - cBoxW / 2, cyMM - cBoxH / 2, cBoxW, cBoxH, 1.2, 1.2, "FD");
    } else {
      doc.setFontSize(centerFS);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 20, 20);
      var centerBaseCorr = (centerFS / 2.835) * 0.35;
      doc.text(String(data.center), cxMM, cyMM + centerBaseCorr, { align: "center" });
    }

    var innerR = (cr + ir) / 2;
    var outerR = (ir + or_) / 2;
    var pairFS = Math.min(radiusMM * 0.32 * 2.835, 12);

    for (var j = 0; j < NUM_SEGMENTS; j++) {
      var ang = (j / NUM_SEGMENTS) * 2 * Math.PI + (Math.PI / NUM_SEGMENTS);
      drawFieldPDF(doc, data.pairs[j].inner,
        cxMM + Math.cos(ang) * innerR, cyMM + Math.sin(ang) * innerR, pairFS, radiusMM);
      drawFieldPDF(doc, data.pairs[j].outer,
        cxMM + Math.cos(ang) * outerR, cyMM + Math.sin(ang) * outerR, pairFS, radiusMM);
    }
  }

  function drawFooter(doc, pageW, pageH) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(170, 170, 170);
    doc.text(
      "Juf Zisa\u2019s Spelgenerator \u2013 www.jufzisa.be",
      pageW / 2, pageH - 5, { align: "center" }
    );
  }

  function drawPageHeader(doc, pageW, margin) {
    // Naam / Datum lijn
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text("Naam:", margin, margin + 4);
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    // Naam-lijn eindigt op 85mm, dan ruime spatie, Datum start op 100mm
    doc.line(margin + 11, margin + 4, margin + 85, margin + 4);
    doc.text("Datum:", margin + 100, margin + 4);
    doc.line(margin + 113, margin + 4, margin + 155, margin + 4);
    // Titel
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    doc.text("Rekencirkels", pageW / 2, margin + 15, { align: "center" });
    // Lijn onder titel
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.5);
    doc.line(margin, margin + 19, pageW - margin, margin + 19);
  }

  function downloadPDF() {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    var pageW  = doc.internal.pageSize.getWidth();
    var pageH  = doc.internal.pageSize.getHeight();
    var margin = 14;
    var footerH = 12; // ruimte onderaan voor footer
    var headerH = 26; // naam + datum + titel
    var labelH  = 11;
    var labelGap = 3;
    var rowGap   = 4;

    var validCount = 0;
    for (var vi = 0; vi < generatedData.length; vi++) { if (generatedData[vi]) validCount++; }
    if (validCount === 0) return;

    var groups = buildGroups();
    var cols   = validCount === 1 ? 1 : 2;

    var usableW  = pageW - margin * 2;
    var cellMM   = cols === 1 ? usableW * 0.7 : (usableW - 6) / 2;
    var gapMM    = 6;
    var radiusMM = (cellMM / 2) * 0.86;

    // Maximale y per pagina (ruimte voor footer)
    var maxY = pageH - margin - footerH;

    // Teken eerste pagina header
    drawPageHeader(doc, pageW, margin);
    var y = margin + headerH;
    var isFirstPage = true;

    for (var gi = 0; gi < groups.length; gi++) {
      var g = groups[gi];
      var groupRows = Math.ceil(g.indices.length / cols);

      // Bereken hoeveel rijen op huidige pagina passen
      // Opdrachtzin + minstens 1 rij moeten samen passen, anders nieuwe pagina
      var spaceNeeded = labelH + labelGap + cellMM + rowGap;
      if (!isFirstPage || y + spaceNeeded > maxY) {
        // Nieuwe pagina nodig voor deze groep
        drawFooter(doc, pageW, pageH);
        doc.addPage();
        drawPageHeader(doc, pageW, margin);
        y = margin + headerH;
        isFirstPage = false;
      }

      // Opdrachtzin kader
      doc.setFillColor(240, 240, 240);
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin, y, usableW, labelH, 2, 2, "FD");
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 20, 20);
      doc.text(g.label, margin + 4, y + labelH * 0.72);
      y += labelH + labelGap;

      // Rijen tekenen, met pagina-overgang per rij
      for (var r = 0; r < groupRows; r++) {
        var rowH = cellMM + rowGap;

        // Past deze rij nog op de pagina?
        if (y + rowH > maxY) {
          drawFooter(doc, pageW, pageH);
          doc.addPage();
          drawPageHeader(doc, pageW, margin);
          y = margin + headerH;
          isFirstPage = false;

          // Opdrachtzin herhalen bovenaan nieuwe pagina (vervolg)
          doc.setFillColor(240, 240, 240);
          doc.setDrawColor(120, 120, 120);
          doc.setLineWidth(0.4);
          doc.roundedRect(margin, y, usableW, labelH, 2, 2, "FD");
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(20, 20, 20);
          doc.text(g.label + " (vervolg)", margin + 4, y + labelH * 0.72);
          y += labelH + labelGap;
        }

        for (var col = 0; col < cols; col++) {
          var idx = g.indices[r * cols + col];
          if (idx === undefined || !generatedData[idx]) continue;
          var startX = cols === 1 ? (pageW - cellMM) / 2 : margin;
          var cx = startX + col * (cellMM + gapMM) + cellMM / 2;
          var cy = y + cellMM / 2;
          drawCirclePDF(doc, generatedData[idx].display, cx, cy, radiusMM);
        }
        y += rowH;
      }
      y += 3; // extra spatie tussen groepen
    }

    // Footer op laatste pagina
    drawFooter(doc, pageW, pageH);

    doc.save("rekencirkels-werkblad.pdf");
  }

  function downloadPNG() {
    var off = buildWorksheetCanvas(2);
    if (!off) return;
    var a = document.createElement("a");
    a.href = off.toDataURL("image/png");
    a.download = "rekencirkels.png";
    a.click();
  }

  // CIRCLE MENU
  function cfgSummary(cfg) {
    if (cfg.type === "maaltafel") return "Maaltafel x" + (cfg.tafel != null ? cfg.tafel : 2);
    var tl = cfg.type === "zoekSom" ? "Zoek de som" : "Zoek een term";
    return tl + " \u2013 tot " + (cfg.niveau || 100);
  }

  function renderCircleMenu() {
    var container = document.getElementById("circleList");
    if (!container) return;
    container.innerHTML = "";

    circleConfigs.forEach(function(cfg, idx) {
      if (cfg._collapsed === undefined) cfg._collapsed = true;

      var card = document.createElement("div");
      card.className = "circle-config-card";

      var header = document.createElement("div");
      header.className = "circle-config-header";
      header.style.cursor = "pointer";

      var headerLeft = document.createElement("div");
      headerLeft.className = "circle-header-left";

      var title = document.createElement("span");
      title.className = "circle-config-title";
      title.textContent = "Cirkel " + (idx + 1);

      var summary = document.createElement("span");
      summary.className = "circle-config-summary";
      summary.textContent = cfgSummary(cfg);

      headerLeft.appendChild(title);
      headerLeft.appendChild(summary);

      var btnRow = document.createElement("div");
      btnRow.className = "circle-header-btns";

      var chevron = document.createElement("span");
      chevron.className = "chevron-icon" + (cfg._collapsed ? "" : " open");
      chevron.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

      var regenBtn = document.createElement("button");
      regenBtn.type = "button";
      regenBtn.className = "icon-btn regen-btn";
      regenBtn.title = "Hergeneer";
      regenBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>';
      regenBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        generatedData[idx] = generateCircle(circleConfigs[idx]);
        renderPreviewCanvas();
      });

      var removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "icon-btn remove-btn";
      removeBtn.title = "Verwijder";
      removeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>';
      removeBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        circleConfigs.splice(idx, 1);
        generatedData.splice(idx, 1);
        renderCircleMenu();
        renderPreviewCanvas();
        updateNumGridDisplay();
      });

      btnRow.appendChild(chevron);
      btnRow.appendChild(regenBtn);
      btnRow.appendChild(removeBtn);
      header.appendChild(headerLeft);
      header.appendChild(btnRow);
      card.appendChild(header);

      var body = document.createElement("div");
      body.className = "circle-config-body";
      body.style.display = cfg._collapsed ? "none" : "";

      header.addEventListener("click", function() {
        cfg._collapsed = !cfg._collapsed;
        body.style.display = cfg._collapsed ? "none" : "";
        chevron.classList.toggle("open", !cfg._collapsed);
      });

      // Type
      var typeRow = makeFormRow("Type cirkel");
      var typeSelect = document.createElement("select");
      typeSelect.className = "cfg-select";
      [
        { value: "zoekSom",   label: "Optellen \u2013 zoek de som" },
        { value: "zoekTerm",  label: "Optellen \u2013 zoek een term" },
        { value: "maaltafel", label: "Maaltafel" }
      ].forEach(function(opt) {
        var o = document.createElement("option");
        o.value = opt.value; o.textContent = opt.label;
        if (cfg.type === opt.value) o.selected = true;
        typeSelect.appendChild(o);
      });
      typeSelect.addEventListener("change", function() {
        cfg.type = typeSelect.value;
        renderCircleMenu();
        generatedData[idx] = generateCircle(circleConfigs[idx]);
        renderPreviewCanvas();
      });
      typeRow.appendChild(typeSelect);
      body.appendChild(typeRow);

      if (cfg.type !== "maaltafel") {
        var niveauRow = makeFormRow("Niveau");
        var niveauSelect = document.createElement("select");
        niveauSelect.className = "cfg-select";
        [10, 20, 100, 1000].forEach(function(v) {
          var o = document.createElement("option");
          o.value = v; o.textContent = "Tot " + v;
          if (cfg.niveau === v) o.selected = true;
          niveauSelect.appendChild(o);
        });
        niveauSelect.addEventListener("change", function() {
          cfg.niveau = parseInt(niveauSelect.value);
          summary.textContent = cfgSummary(cfg);
          generatedData[idx] = generateCircle(circleConfigs[idx]);
          renderPreviewCanvas();
        });
        niveauRow.appendChild(niveauSelect);
        body.appendChild(niveauRow);

        var brugRow = makeFormRow("Brug");
        var brugSelect = document.createElement("select");
        brugSelect.className = "cfg-select";
        [
          { value: "beide",  label: "Beide" },
          { value: "zonder", label: "Zonder brug" },
          { value: "met",    label: "Met brug" }
        ].forEach(function(opt) {
          var o = document.createElement("option");
          o.value = opt.value; o.textContent = opt.label;
          if (cfg.brug === opt.value) o.selected = true;
          brugSelect.appendChild(o);
        });
        brugSelect.addEventListener("change", function() {
          cfg.brug = brugSelect.value;
          generatedData[idx] = generateCircle(circleConfigs[idx]);
          renderPreviewCanvas();
        });
        brugRow.appendChild(brugSelect);
        body.appendChild(brugRow);
      } else {
        var tafelRow = makeFormRow("Maaltafel");
        var tafelSelect = document.createElement("select");
        tafelSelect.className = "cfg-select";
        for (var t = 0; t <= 10; t++) {
          var o2 = document.createElement("option");
          o2.value = t; o2.textContent = "Tafel van " + t;
          if (cfg.tafel === t) o2.selected = true;
          tafelSelect.appendChild(o2);
        }
        tafelSelect.addEventListener("change", function() {
          cfg.tafel = parseInt(tafelSelect.value);
          summary.textContent = cfgSummary(cfg);
          generatedData[idx] = generateCircle(circleConfigs[idx]);
          renderPreviewCanvas();
        });
        tafelRow.appendChild(tafelSelect);
        body.appendChild(tafelRow);
      }

      card.appendChild(body);
      container.appendChild(card);
    });

    updateAddBtn();
  }

  function makeFormRow(labelText) {
    var row = document.createElement("div");
    row.className = "cfg-form-row";
    var label = document.createElement("label");
    label.className = "cfg-label";
    label.textContent = labelText;
    row.appendChild(label);
    return row;
  }

  function updateAddBtn() {
    var btn = document.getElementById("addCircleBtn");
    if (!btn) return;
    btn.disabled = circleConfigs.length >= 8;
    btn.textContent = circleConfigs.length >= 8 ? "Maximum bereikt (8)" : "+ Cirkel toevoegen";
  }

  function updateNumGridDisplay() {
    var el = document.getElementById("circleCount");
    if (el) el.textContent = circleConfigs.length;
  }

  function addCircle() {
    if (circleConfigs.length >= 8) return;
    var cfg = { type: "zoekSom", niveau: 100, brug: "beide" };
    circleConfigs.push(cfg);
    generatedData.push(generateCircle(cfg));
    renderCircleMenu();
    renderPreviewCanvas();
    updateNumGridDisplay();
  }

  function regenerateAll() {
    setMessage("");
    generatedData = circleConfigs.map(function(cfg) { return generateCircle(cfg); });
    renderPreviewCanvas();
  }

  // INIT
  function init() {
    var defaultCfg = { type: "zoekSom", niveau: 100, brug: "beide" };
    circleConfigs = [{ type: "zoekSom", niveau: 100, brug: "beide" }];
    generatedData = [generateCircle(defaultCfg)];

    document.getElementById("addCircleBtn").addEventListener("click", addCircle);
    document.getElementById("genereerBtn").addEventListener("click", regenerateAll);
    document.getElementById("downloadPngBtn").addEventListener("click", downloadPNG);
    document.getElementById("downloadPdfBtn").addEventListener("click", downloadPDF);
    document.getElementById("infoBtn").addEventListener("click", function() {
      document.getElementById("infoModal").style.display = "flex";
    });
    document.getElementById("infoModalClose").addEventListener("click", function() {
      document.getElementById("infoModal").style.display = "none";
    });
    document.getElementById("infoModal").addEventListener("click", function(e) {
      if (e.target === this) this.style.display = "none";
    });

    renderCircleMenu();
    renderPreviewCanvas();
    updateNumGridDisplay();
  }

  init();
});

// pdf-engine.js

const pdfEngine = (() => {
  const { jsPDF } = window.jspdf;

  const PAGE_W = 210;
  const PAGE_H = 297;

  const MARGIN_LEFT = 15;
  const MARGIN_RIGHT = 15;
  const MARGIN_TOP = 15;
  const MARGIN_BOTTOM = 15;

  const CONTENT_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT;

  let doc;
  let y;
  let imageCache = new Map();

  function mmScaleFromWerkblad(werkbladEl) {
    const pxWidth = werkbladEl.getBoundingClientRect().width || 1;
    return CONTENT_W / pxWidth;
  }

  function newDoc() {
    doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });
    y = MARGIN_TOP;
  }

  function addPage() {
    doc.addPage();
    y = MARGIN_TOP;
  }

  function ensureSpace(heightNeeded) {
    if (y + heightNeeded > PAGE_H - MARGIN_BOTTOM) {
      addPage();
    }
  }

  function textWidth(text, fontSize = 12, fontStyle = "normal") {
    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);
    return doc.getTextWidth(text || "");
  }

  function readText(el, fallback = "") {
    if (!el) return fallback;
    return (el.innerText || el.textContent || fallback).trim();
  }

  function inferImageFormat(dataUrl) {
    if (dataUrl.startsWith("data:image/png")) return "PNG";
    if (dataUrl.startsWith("data:image/webp")) return "WEBP";
    return "JPEG";
  }

  async function toDataUrl(src) {
    if (!src) return null;
    if (imageCache.has(src)) return imageCache.get(src);

    const promise = fetch(src)
      .then(r => r.blob())
      .then(blob => new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onloadend = () => resolve(fr.result);
        fr.onerror = reject;
        fr.readAsDataURL(blob);
      }))
      .catch(() => null);

    imageCache.set(src, promise);
    return promise;
  }

  async function drawImageFromElement(imgEl, x, yPos, w, h) {
    const src = imgEl?.currentSrc || imgEl?.src;
    const dataUrl = await toDataUrl(src);
    if (!dataUrl) return;
    const fmt = inferImageFormat(dataUrl);
    try {
      doc.addImage(dataUrl, fmt, x, yPos, w, h);
    } catch (e) {
      // afbeelding overslaan als die niet kan laden
    }
  }

  function rect(el) {
    return el.getBoundingClientRect();
  }

  function relRect(childEl, parentEl, scale, parentX, parentY) {
    const c = rect(childEl);
    const p = rect(parentEl);
    return {
      x: parentX + (c.left - p.left) * scale,
      y: parentY + (c.top - p.top) * scale,
      w: c.width * scale,
      h: c.height * scale
    };
  }

  function drawRoundedRect(x, yPos, w, h, r = 3, style = "S") {
    doc.roundedRect(x, yPos, w, h, r, r, style);
  }

  function drawLine(x1, y1, x2, y2, width = 0.3) {
    doc.setLineWidth(width);
    doc.line(x1, y1, x2, y2);
  }

  function drawDashedRect(x, yPos, w, h) {
    doc.setLineDashPattern([1.2, 1.2], 0);
    doc.roundedRect(x, yPos, w, h, 2, 2);
    doc.setLineDashPattern([], 0);
  }

const WORKBOOK = {
  titleToFirstLine: 8,
  lineGap: 11,
  textToNextLine: 6,
  underlineOffset: 1.2
};

function drawWorkbookLines(x, startY, width, count = 2, gap = WORKBOOK.lineGap, lineWidth = 0.4) {
  for (let i = 0; i < count; i++) {
    const yy = startY + i * gap;
    drawLine(x, yy, x + width, yy, lineWidth);
  }
}

function drawWorkbookLabelAndLine(label, x, yText, lineStartX, lineEndX, fontSize = 11, style = "normal") {
  doc.setFont("helvetica", style);
  doc.setFontSize(fontSize);
  doc.setTextColor(50, 50, 50);
  doc.text(label, x, yText);
  drawLine(lineStartX, yText + WORKBOOK.underlineOffset, lineEndX, yText + WORKBOOK.underlineOffset, 0.45);
}

  function splitText(text, maxWidth, fontSize = 11, fontStyle = "normal") {
    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(text, maxWidth);
  }

  function drawStudentHeader(werkbladEl, scale) {
    const header = werkbladEl.querySelector(".student-header");
    if (!header) return;

    const boxes = [...header.querySelectorAll(".header-box")];
    const headerH = rect(header).height * scale;

    ensureSpace(headerH + 4);

    const gap = 6;
    const totalGap = gap * (boxes.length - 1);
    const boxW = (CONTENT_W - totalGap) / Math.max(boxes.length, 1);
    const boxH = Math.max(10, headerH);

    let x = MARGIN_LEFT;
    boxes.forEach(box => {
      drawRoundedRect(x, y, boxW, boxH, 2.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(readText(box), x + 3, y + 6.5);
      x += boxW + gap;
    });

    y += boxH + 8;
  }

  function drawMainTitle(werkbladEl) {
    const titleEl = werkbladEl.querySelector(".werkblad-titel");
    if (!titleEl) return;

    const title = readText(titleEl, "REKENEN MET GELD");
    const boxH = 16;

    ensureSpace(boxH + 8);

    doc.setLineWidth(0.4);
    drawRoundedRect(MARGIN_LEFT, y, CONTENT_W, boxH, 0.8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);

    const tw = doc.getTextWidth(title);
    doc.text(title, MARGIN_LEFT + (CONTENT_W - tw) / 2, y + 10.5);

    y += boxH + 4;
  }

  function sectionLeadHeightMm(sectionEl, scale) {
    const titleEl = sectionEl.querySelector(":scope > .sectie-titel");
    const posterEl = sectionEl.querySelector(":scope > .winkel-poster");
    const firstKader = sectionEl.querySelector(":scope > .kaders-grid > .oefening-kader");

    let total = 0;

    if (titleEl) total += rect(titleEl).height * scale + 2;
    if (posterEl) total += rect(posterEl).height * scale + 6;
    if (firstKader) total += rect(firstKader).height * scale + 6;

    return total || 20;
  }

  function drawSectionTitle(titleEl) {
    const title = readText(titleEl);
    const fs = 10; // kleiner lettertype
    const lines = splitText(title, CONTENT_W - 8, fs, "bold");
    const lineH = 4.8;
    const bandH = lines.length * lineH + 4; // compacte hoogte

    // Meer witruimte BOVEN de titel (scheidt van vorige oefening)
    y += 7;
    ensureSpace(bandH + 4);

    // Lichtgrijze achtergrondband
    doc.setFillColor(235, 235, 240);
    doc.setDrawColor(195, 195, 210);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN_LEFT, y, CONTENT_W, bandH, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(fs);
    doc.setTextColor(70, 65, 100);
    lines.forEach((line, i) => {
      doc.text(line, MARGIN_LEFT + 4, y + 4.5 + i * lineH);
    });

    doc.setTextColor(0, 0, 0);
    // Weinig witruimte ONDER de titel (dicht tegen de oefening)
    y += bandH + 3;
  }

  async function drawWinkelPoster(posterEl, scale) {
    const posterH = rect(posterEl).height * scale;
    ensureSpace(posterH + 6);

    const x = MARGIN_LEFT;
    const y0 = y;
    const w = CONTENT_W;
    const h = posterH;

    doc.setDrawColor(142, 197, 182);
    doc.setLineWidth(0.8);
    drawRoundedRect(x, y0, w, h, 3);

    const rows = [...posterEl.querySelectorAll(".plank-rij")];

    for (const row of rows) {
      const rr = relRect(row, posterEl, scale, x, y0);

      const shelfSrc = "assets/producten/winkel.png";
const shelfDataUrl = await toDataUrl(shelfSrc);

if (shelfDataUrl) {
  try {
    doc.addImage(shelfDataUrl, "PNG", rr.x, rr.y, rr.w, rr.h);
  } catch (e) {
    const shelfY = rr.y + rr.h * 0.78;
    doc.setDrawColor(170, 170, 170);
    doc.setLineWidth(0.6);
    doc.line(rr.x + 2, shelfY, rr.x + rr.w - 2, shelfY);
  }
} else {
  const shelfY = rr.y + rr.h * 0.78;
  doc.setDrawColor(170, 170, 170);
  doc.setLineWidth(0.6);
  doc.line(rr.x + 2, shelfY, rr.x + rr.w - 2, shelfY);
}

      const items = [...row.querySelectorAll(".poster-item")];
      for (const item of items) {
        const img = item.querySelector("img");
        if (img) {
          const ir = relRect(img, posterEl, scale, x, y0);
          await drawImageFromElement(img, ir.x, ir.y, ir.w, ir.h);
        }

        const prijsEl = item.querySelector(".prijskaartje");
        if (prijsEl) {
          const pr = relRect(prijsEl, posterEl, scale, x, y0);
          doc.setFillColor(255, 235, 59);
          doc.setDrawColor(60, 60, 60);
          doc.setLineWidth(0.2);
          doc.roundedRect(pr.x, pr.y, pr.w, pr.h, 0.8, 0.8, "FD");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          const txt = readText(prijsEl);
          doc.text(txt, pr.x + 1.5, pr.y + pr.h * 0.68);
        }

        // Nummer-badge linksboven
        const nummerEl = item.querySelector(".poster-nummer");
        if (nummerEl) {
          const nr = relRect(item, posterEl, scale, x, y0);
          const badgeSize = 5;
          const bx = nr.x + 1, by = nr.y + 1;
          doc.setFillColor(61, 171, 146);
          doc.circle(bx + badgeSize / 2, by + badgeSize / 2, badgeSize / 2, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(6.5);
          doc.setTextColor(255, 255, 255);
          const numTxt = readText(nummerEl);
          const ntw = doc.getTextWidth(numTxt);
          doc.text(numTxt, bx + (badgeSize - ntw) / 2, by + badgeSize * 0.72);
          doc.setTextColor(0, 0, 0);
        }
      }
    }

    y += h + 6;
  }

  async function drawMoneyVak(vakEl, parentEl, parentX, parentY, scale) {
    const vr = relRect(vakEl, parentEl, scale, parentX, parentY);
    doc.setDrawColor(170, 170, 170); doc.setLineWidth(0.35);
    drawDashedRect(vr.x, vr.y, vr.w, vr.h);
    await drawMoneyImgsInBox(vakEl, vr.x, vr.y, vr.w, vr.h, scale);
  }

  // Variant voor 2-kolom layout
  async function drawMoneyVakAt(vakEl, parentEl, parentX, parentY, scale, maxW) {
    const vr = relRect(vakEl, parentEl, scale, parentX, parentY);
    const vakX = parentX + 4, vakW = maxW - 8;
    doc.setDrawColor(170, 170, 170); doc.setLineWidth(0.35);
    drawDashedRect(vakX, vr.y, vakW, vr.h, scale);
    await drawMoneyImgsInBox(vakEl, vakX, vr.y, vakW, vr.h, scale);
  }

  // Teken geldafbeeldingen in een vak — groepeert gelijke muntjes/biljetten bij elkaar
  async function drawMoneyImgsInBox(vakEl, bx, by, bw, bh, scale) {
    const allImgs = [...vakEl.querySelectorAll("img")];
    if (!allImgs.length) return 0;

    const sectionType = vakEl.closest('.oefening-sectie')?.dataset?.type || '';
    const isCompactSkill = sectionType === 'tellen' || sectionType === 'weinig_mogelijk';
    const isTwoWays = sectionType === 'twee_manieren';
    const isKiezenVak = vakEl.classList.contains('kiezen-geld-vak');
    const isWinkelVak = !!vakEl.closest('.winkel-totaal-layout');

    const PAD = isCompactSkill ? 1.4 : (isTwoWays || isWinkelVak || isKiezenVak ? 1.6 : 1.7);
    const ITEM_GAP = isCompactSkill ? 1.4 : (isTwoWays || isWinkelVak || isKiezenVak ? 1.3 : 1.2);
    const GROUP_GAP = isCompactSkill ? 3.2 : (isTwoWays || isWinkelVak || isKiezenVak ? 3.0 : 2.8);
    const ROW_GAP = isCompactSkill ? 2.4 : 2.8;
    const MIN_SCALE_FACTOR = isCompactSkill ? 0.86 : (isTwoWays || isWinkelVak || isKiezenVak ? 0.80 : 0.72);

    const groupEls = vakEl.querySelectorAll('.money-group').length
      ? [...vakEl.querySelectorAll('.money-group')]
      : [vakEl];

    const buildGroups = (sizeFactor = 1) => groupEls.map(groupEl => {
      const imgs = groupEl === vakEl ? [...allImgs] : [...groupEl.querySelectorAll('img')];
      const items = imgs.map(img => {
        const cssScale = parseFloat(img.style.getPropertyValue('--scale') ||
          img.style.transform?.match(/scale\(([\d.]+)\)/)?.[1] || '1');
        const nat = img.naturalWidth || 60;
        const natH = img.naturalHeight || 40;
        const ratio = nat / natH;
        let baseH;
        if (isCompactSkill) {
          baseH = ratio > 1.5 ? 18.8 : 14.0;
        } else if (isTwoWays || isWinkelVak || isKiezenVak) {
          baseH = ratio > 1.5 ? 16.8 : 12.4;
        } else {
          baseH = ratio > 1.5 ? 14.8 : 10.8;
        }
        const h = baseH * Math.min(cssScale, 1.18) * sizeFactor;
        const w = h * ratio;
        return { img, w, h };
      });
      const width = items.reduce((sum, item, index) => sum + item.w + (index ? ITEM_GAP : 0), 0);
      const height = items.reduce((max, item) => Math.max(max, item.h), 0);
      return { items, width, height };
    });

    const layoutGroups = (groups) => {
      const maxW = Math.max(10, bw - PAD * 2);
      const rows = [];
      let currentRow = [];
      let currentWidth = 0;

      for (const group of groups) {
        const extra = currentRow.length ? GROUP_GAP : 0;
        if (currentRow.length && currentWidth + extra + group.width > maxW) {
          rows.push(currentRow);
          currentRow = [group];
          currentWidth = group.width;
        } else {
          currentRow.push(group);
          currentWidth += extra + group.width;
        }
      }
      if (currentRow.length) rows.push(currentRow);

      const rowMeta = rows.map(row => {
        const width = row.reduce((sum, group, index) => sum + group.width + (index ? GROUP_GAP : 0), 0);
        const height = row.reduce((max, group) => Math.max(max, group.height), 0);
        return { groups: row, width, height };
      });

      const totalH = rowMeta.reduce((sum, row, index) => sum + row.height + (index ? ROW_GAP : 0), 0);
      return { rows: rowMeta, totalH };
    };

    let sizeFactor = 1;
    let groups = buildGroups(sizeFactor);
    let layout = layoutGroups(groups);
    const maxContentH = Math.max(8, bh - PAD * 2);

    while ((layout.totalH > maxContentH || layout.rows.some(row => row.width > bw - PAD * 2)) && sizeFactor > MIN_SCALE_FACTOR) {
      sizeFactor = Math.max(MIN_SCALE_FACTOR, sizeFactor * 0.92);
      groups = buildGroups(sizeFactor);
      layout = layoutGroups(groups);
      if (sizeFactor === MIN_SCALE_FACTOR) break;
    }

    let curY = by + PAD;
    for (const row of layout.rows) {
      let curX = bx + PAD;
      for (const group of row.groups) {
        for (let i = 0; i < group.items.length; i++) {
          const item = group.items[i];
          const iy = curY + (row.height - item.h) / 2;
          await drawImageFromElement(item.img, curX, iy, item.w, item.h);
          curX += item.w;
          if (i < group.items.length - 1) curX += ITEM_GAP;
        }
        curX += GROUP_GAP;
      }
      curY += row.height + ROW_GAP;
    }

    return layout.totalH + PAD * 2;
  }

 async function drawTerugKader(kaderEl, scale) {
  const headerH = 18, bodyH = 56, padTop = 7, padBot = 6;
  const FIXED_H = padTop + headerH + bodyH + padBot;

  ensureSpace(FIXED_H + 5);
  const x = MARGIN_LEFT, y0 = y, tW = CONTENT_W - 4;
  doc.setDrawColor(183, 183, 201); doc.setLineWidth(0.6);
  drawRoundedRect(x, y0, CONTENT_W, FIXED_H, 3);

  const tabel = kaderEl.querySelector(".terug-tabel");
  if (!tabel) { y += FIXED_H + 5; return; }

  const cW = [tW * 0.16, tW * 0.35, tW * 0.13, tW * 0.36];
  const tx = x + 2, ty = y0 + padTop;
  const cX = [tx, tx + cW[0], tx + cW[0] + cW[1], tx + cW[0] + cW[1] + cW[2]];
  const bodyY = ty + headerH;

  doc.setFillColor(245, 232, 240);
  doc.setDrawColor(212, 184, 200);
  doc.setLineWidth(0.4);
  doc.rect(tx, ty, tW, headerH, "FD");

  const hdrs = ["Ik koop …", "Hoeveel kost het samen?", "Ik betaal met …", "Ik krijg … € terug."];
  doc.setTextColor(90, 58, 74);
  hdrs.forEach((hTxt, i) => {
    const cx2 = cX[i] + cW[i] / 2, fs = 9;
    doc.setFont("helvetica", "bold"); doc.setFontSize(fs);
    const lines = splitText(hTxt, cW[i] - 3, fs, "bold");
    const lh = fs * 0.46, th = lines.length * lh;
    lines.forEach((line, li) => {
      const tw2 = doc.getTextWidth(line);
      doc.text(line, cx2 - tw2 / 2, ty + (headerH - th) / 2 + fs * 0.38 + li * lh);
    });
  });

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(212, 184, 200);
  doc.setLineWidth(0.4);
  doc.rect(tx, bodyY, tW, bodyH, "FD");
  for (let i = 1; i < 4; i++) doc.line(cX[i], ty, cX[i], ty + headerH + bodyH);
  doc.rect(tx, ty, tW, headerH + bodyH);
  doc.line(tx, bodyY, tx + tW, bodyY);

  {
    const mandjeItems = [...kaderEl.querySelectorAll(".mandje-item-terug")];
    const itemH = bodyH / Math.max(mandjeItems.length, 1);
    const col1CenterX = cX[0] + cW[0] / 2;

    for (let idx = 0; idx < mandjeItems.length; idx++) {
      const item = mandjeItems[idx];
      const itemTopY = bodyY + idx * itemH;

      const img = item.querySelector("img");
      if (img) {
        const imgH = Math.min(itemH * 0.58, 15);
        const imgDrawW = imgH * 1.2;
        const imgX = col1CenterX - imgDrawW / 2;
        const imgY = itemTopY + 2;
        await drawImageFromElement(img, imgX, imgY, imgDrawW, imgH);
      }

      const tag = item.querySelector(".mandje-prijs-tag");
      if (tag) {
        const tagTxt = readText(tag);
        doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(51, 51, 51);
        const tagW = doc.getTextWidth(tagTxt) + 4;
        const tagH = 5;
        const tagX = col1CenterX - tagW / 2;
        const tagY = itemTopY + itemH * 0.68;
        doc.setFillColor(255, 248, 225); doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.25);
        doc.roundedRect(tagX, tagY, tagW, tagH, 1, 1, "FD");
        doc.text(tagTxt, tagX + 2, tagY + tagH * 0.75);
      }
    }
  }

 {
  const lx = cX[1] + cW[1] * 0.07;
  const lw = cW[1] * 0.86;
  doc.setDrawColor(30, 30, 30);

  const firstLineY = bodyY + 9;
  drawWorkbookLines(lx, firstLineY, lw, 2, 13, 0.45);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text("Het kost samen", cX[1] + 4, firstLineY + 27);

  const euroTextY = firstLineY + 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("€", cX[1] + 4, euroTextY);
  drawLine(cX[1] + 11, euroTextY + 0.8, cX[1] + 11 + cW[1] * 0.55, euroTextY + 0.8, 0.45);
}

  const betaalImg = kaderEl.querySelector(".betaal-biljet-img");
  if (betaalImg) {
    const maxH = 16, ratio = betaalImg.naturalWidth / (betaalImg.naturalHeight || 2);
    const dW = maxH * (ratio || 2);
    await drawImageFromElement(betaalImg, cX[2] + (cW[2] - dW) / 2, bodyY + (bodyH - maxH) / 2, dW, maxH);
  }

  {
  const lx = cX[3] + cW[3] * 0.07;
  const lw = cW[3] * 0.86;
  const sX = cX[3] + 4;
  doc.setDrawColor(30, 30, 30);

  const firstLineY = bodyY + 9;
  drawWorkbookLines(lx, firstLineY, lw, 2, 13, 0.45);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);

  const textY = firstLineY + 27;
  doc.text("Ik krijg €", sX, textY);
  const ikW = doc.getTextWidth("Ik krijg € ");
  drawLine(sX + ikW, textY + 0.8, sX + ikW + 22, textY + 0.8, 0.45);

  doc.text("terug.", sX, textY + 12);
}

  doc.setTextColor(0, 0, 0);
  y += FIXED_H + 5;
}

  async function drawWinkelKader(kaderEl, scale) {
    const PAD = 5;
    const ITEM_W = 28;  // breedte per mandje-item (afb + tag)
    const ITEM_H = 22;  // hoogte per mandje-item
    const COLS = 2;     // max 2 producten naast elkaar

    // Tel items
    const mandjeItems = [...kaderEl.querySelectorAll(".mandje-item-wrap")];
    const aantalRijen = Math.ceil(mandjeItems.length / COLS);
    const mandjeW = ITEM_W * COLS + 10;
    const mandjeH = aantalRijen * ITEM_H + 8; // +8 voor label

    // Bewerking hoogte
    const heeftSchatting = !!kaderEl.querySelector(".dubbel-invul-rij");
    const bewH = heeftSchatting ? 26 : 20;
    const topH = Math.max(mandjeH, bewH + 18); // genoeg ruimte voor bewerking + totaal

    // Geldvak hoogte — neem minstens de previewhoogte over zodat grotere munten ook in PDF ruimte krijgen
    const geldVak = kaderEl.querySelector(".geld-vak");
    const previewVakH = geldVak ? Math.max(26, rect(geldVak).height * scale) : 26;
    const geldH = previewVakH;

    const FIXED_H = PAD + topH + 4 + geldH + PAD;
    ensureSpace(FIXED_H + 5);

    const x = MARGIN_LEFT, y0 = y;
    doc.setDrawColor(183, 183, 201); doc.setLineWidth(0.6);
    drawRoundedRect(x, y0, CONTENT_W, FIXED_H, 3);

    const topY = y0 + PAD;
    const bewX = x + mandjeW + 8;
    const bewW = CONTENT_W - mandjeW - 12;

    // ── Mandje label ──
    doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(0,0,0);
    doc.text("Mijn mandje:", x + 4, topY + 4);

    // ── Mandje items (2 per rij) ──
    for (let i = 0; i < mandjeItems.length; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const ix = x + 4 + col * ITEM_W;
      const iy = topY + 7 + row * ITEM_H;
      const wrap = mandjeItems[i];
      const img = wrap.querySelector("img");
      const tag = wrap.querySelector(".mandje-prijs-tag");
      if (img) {
        const iH = 12, iW = iH * 1.1;
        await drawImageFromElement(img, ix, iy, iW, iH);
      }
      if (tag) {
        const txt = readText(tag);
        doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(51,51,51);
        const tw = doc.getTextWidth(txt) + 3;
        doc.setFillColor(255,248,225); doc.setDrawColor(180,180,180); doc.setLineWidth(0.2);
        doc.roundedRect(ix, iy + 13, tw, 5, 1, 1, "FD");
        doc.text(txt, ix + 1.5, iy + 16.5);
      }
    }

    // ── Verticale scheidingslijn ──
    doc.setLineDashPattern([1.2,1.2], 0);
    doc.setDrawColor(180,180,180); doc.setLineWidth(0.4);
    doc.line(x + mandjeW + 3, topY, x + mandjeW + 3, topY + topH);
    doc.setLineDashPattern([], 0);

    // ── Bewerking rechts ──
    doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(0,0,0);
    if (heeftSchatting) {
  const vakW = (bewW - 6) / 2;
  ["Ik schat:", "Bewerking:"].forEach((lbl, vi) => {
    const vx = bewX + vi * (vakW + 4);
    doc.text(lbl, vx, topY + 5);
    drawWorkbookLines(vx, topY + 5 + WORKBOOK.titleToFirstLine, vakW, 2);
  });
} else {
  doc.text("Bewerking:", bewX, topY + 5);
  drawWorkbookLines(bewX, topY + 5 + WORKBOOK.titleToFirstLine, bewW, 2);
}

doc.setFont("helvetica", "bold");
doc.setFontSize(11);
doc.setTextColor(0, 0, 0);
const totaalY = topY + topH - 4;
doc.text("Totaal te betalen: €", bewX, totaalY);
const totaalLabelW = doc.getTextWidth("Totaal te betalen: € ");
drawLine(bewX + totaalLabelW, totaalY + WORKBOOK.underlineOffset, bewX + bewW - 4, totaalY + WORKBOOK.underlineOffset, 0.45);

    // ── Horizontale stippellijn boven geldvak ──
    const geldY = y0 + PAD + topH + 4;
    doc.setLineDashPattern([1.2,1.2], 0);
    doc.setDrawColor(180,180,180); doc.setLineWidth(0.4);
    doc.line(x + 4, geldY - 2, x + CONTENT_W - 4, geldY - 2);
    doc.setLineDashPattern([], 0);

    // ── Geldvak — volle breedte ──
    if (geldVak) {
      doc.setDrawColor(170,170,170); doc.setLineWidth(0.35);
      drawDashedRect(x + 4, geldY, CONTENT_W - 8, geldH);
      await drawMoneyImgsInBox(geldVak, x + 6, geldY + 2, CONTENT_W - 12, geldH - 4, scale);
    }

    doc.setTextColor(0,0,0);
    y += FIXED_H + 5;
  }

  async function drawStandaardKader(kaderEl, scale) {
    const kH = rect(kaderEl).height * scale;
    ensureSpace(kH + 5);
    await drawStandaardKaderAt(kaderEl, scale, MARGIN_LEFT, y, CONTENT_W);
    y += kH + 5;
  }

  async function drawStandaardKaderAt(kaderEl, scale, x, y0, w) {
    const h = rect(kaderEl).height * scale;

    doc.setDrawColor(183, 183, 201);
    doc.setLineWidth(0.6);
    drawRoundedRect(x, y0, w, h, 3);

    const strong = kaderEl.querySelector("strong");
    if (strong) {
      const strongRect = relRect(strong, kaderEl, scale, x, y0);
      const beforeText = "Bedrag:";
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(beforeText, x + 4, strongRect.y + 4);
      doc.setFont("helvetica", "bold");
      doc.text(readText(strong), x + 4 + textWidth(beforeText + " ", 11, "normal"), strongRect.y + 4);
    }

    const geldVakken = [...kaderEl.querySelectorAll(":scope .geld-vak")];
    for (const vak of geldVakken) {
      await drawMoneyVakAt(vak, kaderEl, x, y0, scale, w);
    }

    const antwoordBox = kaderEl.querySelector(".antwoord-box");
if (antwoordBox) {
  const ar = relRect(antwoordBox, kaderEl, scale, x, y0);
  const arW = w - 8;
  const arX = x + 4;
  doc.setDrawColor(183, 183, 201);
  drawRoundedRect(arX, ar.y, arW, ar.h, 2.2);

  const txt = "Totaal: €";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);

  const textY = ar.y + 6.5;
  doc.text(txt, arX + 3, textY);

  const lijn = antwoordBox.querySelector(".lijn-invul");
  if (lijn) {
    const txtW = textWidth(txt + " ", 11, "bold");
    drawLine(arX + txtW + 3, textY + WORKBOOK.titleToFirstLine - 1.5, arX + arW - 3, textY + WORKBOOK.titleToFirstLine - 1.5, 0.4);
  }
}
  }

  function drawWinkelTabel(kaderEl, tabelEl, scale, x, y0, colWidthsPct, headerColor, headerTextColor, borderColor) {
    const tabelR = relRect(tabelEl, kaderEl, scale, x, y0);
    const nCols = colWidthsPct.length;
    const colWidths = colWidthsPct.map(p => tabelR.w * p);
    const colX = [];
    let cx = tabelR.x;
    for (const w of colWidths) { colX.push(cx); cx += w; }
    const headerH = 14;
    const bodyH = tabelR.h - headerH;
    const tx = tabelR.x, ty = tabelR.y;

    // Header
    doc.setFillColor(...headerColor);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.4);
    doc.rect(tx, ty, tabelR.w, headerH, "FD");

    // Header teksten
    const headers = [...tabelEl.querySelectorAll("thead th")].map(th => readText(th));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...headerTextColor);
    headers.forEach((hTxt, i) => {
      const cw = colWidths[i];
      const center = colX[i] + cw / 2;
      const lines = splitText(hTxt, cw - 4, 9, "bold");
      const totalH = lines.length * 4.5;
      lines.forEach((line, li) => {
        const tw2 = doc.getTextWidth(line);
        doc.text(line, center - tw2 / 2, ty + (headerH - totalH) / 2 + 4 + li * 4.5);
      });
    });

    // Body
    doc.setFillColor(255, 255, 255);
    doc.rect(tx, ty + headerH, tabelR.w, bodyH, "FD");
    for (let i = 1; i < nCols; i++) {
      doc.line(colX[i], ty, colX[i], ty + tabelR.h);
    }
    doc.rect(tx, ty, tabelR.w, tabelR.h);
    doc.line(tx, ty + headerH, tx + tabelR.w, ty + headerH);
    doc.setTextColor(0, 0, 0);

    return { colX, colWidths, headerH, bodyH, bodyY: ty + headerH, tx, ty, tabelR };
  }

 async function drawKiezenKader(kaderEl, scale) {
  const kH = rect(kaderEl).height * scale;
  ensureSpace(kH + 5);
  const x = MARGIN_LEFT, y0 = y, w = CONTENT_W, h = kH;
  doc.setDrawColor(183, 183, 201);
  doc.setLineWidth(0.6);
  drawRoundedRect(x, y0, w, h, 3);

  const tabelEl = kaderEl.querySelector(".kiezen-tabel");
  if (!tabelEl) { 
    y += h + 5; 
    return; 
  }

const tabelR = relRect(tabelEl, kaderEl, scale, x, y0);

// Alleen voor deze oefening: tabel breder maken in het kader
const tx = x + 2;
const ty = tabelR.y;
const tw = w - 4;
const th = tabelR.h;

const colRatios = [0.30, 0.13, 0.33, 0.24];
const colWidths = colRatios.map(p => tw * p);

const colX = [];
let cx = tx;
for (const cw of colWidths) {
  colX.push(cx);
  cx += cw;
}

const headerH = 14;
const bodyH = th - headerH;
const bodyY = ty + headerH;

// Header
doc.setFillColor(232, 247, 244);
doc.setDrawColor(168, 216, 206);
doc.setLineWidth(0.4);
doc.rect(tx, ty, tw, headerH, "FD");

// Header teksten
const headers = [...tabelEl.querySelectorAll("thead th")].map(th => readText(th));
doc.setFont("helvetica", "bold");
doc.setFontSize(9);
doc.setTextColor(45, 107, 94);

headers.forEach((hTxt, i) => {
  const cw = colWidths[i];
  const center = colX[i] + cw / 2;
  const lines = splitText(hTxt, cw - 4, 9, "bold");
  const totalH = lines.length * 4.5;
  lines.forEach((line, li) => {
    const tw2 = doc.getTextWidth(line);
    doc.text(line, center - tw2 / 2, ty + (headerH - totalH) / 2 + 4 + li * 4.5);
  });
});

// Body
doc.setFillColor(255, 255, 255);
doc.rect(tx, ty + headerH, tw, bodyH, "FD");
for (let i = 1; i < colWidths.length; i++) {
  doc.line(colX[i], ty, colX[i], ty + th);
}
doc.rect(tx, ty, tw, th);
doc.line(tx, ty + headerH, tx + tw, ty + headerH);
doc.setTextColor(0, 0, 0);

  // Kolom 1: geld + "Ik tel: € ___"
  const geldVak = kaderEl.querySelector(".kiezen-geld-vak");
  if (geldVak) {
    const vakX = colX[0] + 3;
    const vakW = colWidths[0] - 6;
    const vakH = bodyH - 14;
    await drawMoneyImgsInBox(geldVak, vakX, bodyY + 3, vakW, vakH, scale);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(45, 107, 94);
  const ikTelTekst = "Ik tel: €";
  const ikTelY = bodyY + bodyH - 6;
  doc.text(ikTelTekst, colX[0] + 4, ikTelY);
  const ikTelW = doc.getTextWidth(ikTelTekst);
  doc.setDrawColor(30, 30, 30);
  drawLine(colX[0] + 4 + ikTelW + 2, ikTelY - 0.5, colX[0] + colWidths[0] - 4, ikTelY - 0.5, 0.4);

// Kolom 2 en 3: schrijflijnen
doc.setTextColor(0, 0, 0);
[1, 2].forEach(ci => {
  const inset = ci === 2 ? 2 : 5;
  const lx = colX[ci] + inset;
  const lw = colWidths[ci] - inset * 2;
  doc.setDrawColor(30, 30, 30);
  drawWorkbookLines(lx, bodyY + 10, lw, 3, 12, 0.4);
});

  // Kolom 4: één nette antwoordzin
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);

 const col4X = colX[3];
const col4W = colWidths[3];

doc.setFont("helvetica", "normal");
doc.setFontSize(10);
doc.setTextColor(50, 50, 50);

// Hoger in de kolom plaatsen
const textX = col4X + 8;
const row1Y = bodyY + 18;
const row2Y = row1Y + 11;

// Regel 1
doc.text("Ik houd €", textX, row1Y);

// Alleen invullijn, niet over de hele kolom
const labelW = doc.getTextWidth("Ik houd € ");
const lineStartX = textX + labelW + 1.5;
const lineEndX = col4X + col4W - 8;

drawLine(lineStartX, row1Y - 0.6, lineEndX, row1Y - 0.6, 0.4);

// Regel 2
doc.text("over.", textX, row2Y);

  doc.setTextColor(0, 0, 0);
  y += h + 5;
}

  async function drawExactKader(kaderEl, scale) {
    const tabelEl = kaderEl.querySelector(".exact-tabel");
    if (!tabelEl) { y += 5; return; }

    // Vaste hoogte: header(14) + body(25) + padding(10) = 49mm
    const hdrH2 = 14, bH2 = 25, tW2 = CONTENT_W - 4;
    const kH = hdrH2 + bH2 + 10;
    ensureSpace(kH + 5);
    const x = MARGIN_LEFT, y0 = y, w = CONTENT_W, h = kH;
    doc.setDrawColor(183, 183, 201); doc.setLineWidth(0.6);
    drawRoundedRect(x, y0, w, h, 3);

    const colWs2 = [tW2 * 0.24, tW2 * 0.38, tW2 * 0.38];
    const tX2 = x + 2, tY2 = y0 + 5;
    const cXs2 = [tX2, tX2 + colWs2[0], tX2 + colWs2[0] + colWs2[1]];

    // Header
    doc.setFillColor(232, 247, 244);
    doc.setDrawColor(168, 216, 206);
    doc.setLineWidth(0.4);
    doc.rect(tX2, tY2, tW2, hdrH2, "FD");

    const hdrs2 = ["Ik wil juist … uitgeven.", "Ik koop (noteer nummers)", "Bewerking"];
    doc.setTextColor(45, 107, 94);
    hdrs2.forEach((hTxt, i) => {
      const cw = colWs2[i], cx = cXs2[i] + cw / 2;
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      const lines = splitText(hTxt, cw - 4, 9, "bold");
      const lh = 4.5, th = lines.length * lh;
      lines.forEach((line, li) => {
        const tw2 = doc.getTextWidth(line);
        doc.text(line, cx - tw2 / 2, tY2 + (hdrH2 - th) / 2 + 3.5 + li * lh);
      });
    });

    // Body
    const bY2 = tY2 + hdrH2;
    doc.setFillColor(255, 255, 255);
    doc.rect(tX2, bY2, tW2, bH2, "FD");
    for (let i = 1; i < 3; i++) doc.line(cXs2[i], tY2, cXs2[i], tY2 + hdrH2 + bH2);
    doc.rect(tX2, tY2, tW2, hdrH2 + bH2);
    doc.line(tX2, bY2, tX2 + tW2, bY2);

    // Kolom 1: bedrag groot gecentreerd
    const bedragEl = kaderEl.querySelector(".exact-bedrag-groot");
    if (bedragEl) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor(45, 107, 94);
      const txt = readText(bedragEl);
      const tw2 = doc.getTextWidth(txt);
      doc.text(txt, cXs2[0] + (colWs2[0] - tw2) / 2, bY2 + bH2 / 2 + 3);
    }

    // Kolom 2 & 3: 2 invullijnen met ruime tussenruimte
    doc.setTextColor(0, 0, 0);
   [1, 2].forEach(ci => {
  const lx = cXs2[ci] + 5, lw = colWs2[ci] - 10;
  doc.setDrawColor(30, 30, 30);
  drawWorkbookLines(lx, bY2 + WORKBOOK.titleToFirstLine - 1, lw, 2, 12, 0.4);
});

    doc.setTextColor(0, 0, 0);
    y += h + 5;
  }

  async function drawVergelijkKader(kaderEl, scale) {
    // Vaste maten: header=18, body=32, padding=5 → kader=60mm
    const hdrH = 18, bH = 32, pad = 5;
    const FIXED_H = pad + hdrH + bH + pad;
    ensureSpace(FIXED_H + 5);
    const x = MARGIN_LEFT, y0 = y, tW = CONTENT_W - 4;
    doc.setDrawColor(183, 183, 201); doc.setLineWidth(0.6);
    drawRoundedRect(x, y0, CONTENT_W, FIXED_H, 3);

    // 6 kolommen: product / supermarkt A / supermarkt B / goedkoopst? / bewerking / verschil
    const cPct = [0.14, 0.13, 0.13, 0.22, 0.24, 0.14];
    const cW = cPct.map(p => tW * p);
    const tx = x + 2, ty = y0 + pad;
    const cX = [tx];
    for (let i = 0; i < cW.length - 1; i++) cX.push(cX[i] + cW[i]);
    const bY = ty + hdrH;

    // Header
    doc.setFillColor(255, 243, 205); doc.setDrawColor(224, 192, 96); doc.setLineWidth(0.4);
    doc.rect(tx, ty, tW, hdrH, "FD");
    const hdrs = [...kaderEl.querySelectorAll("thead th")].map(th => readText(th));
    doc.setTextColor(122, 92, 0); doc.setFont("helvetica", "bold");
    hdrs.forEach((hTxt, i) => {
      const cx2 = cX[i] + cW[i] / 2;
      const fs = i === 4 ? 7.5 : 8.5;
      doc.setFontSize(fs);
      const lines = splitText(hTxt, cW[i] - 3, fs, "bold");
      const lh = fs * 0.46, th2 = lines.length * lh;
      lines.forEach((line, li) => {
        const tw2 = doc.getTextWidth(line);
        doc.text(line, cx2 - tw2/2, ty + (hdrH - th2)/2 + fs*0.38 + li*lh);
      });
    });

    // Body
    doc.setFillColor(255,255,255); doc.setDrawColor(224,192,96); doc.setLineWidth(0.4);
    doc.rect(tx, bY, tW, bH, "FD");
    for (let i = 1; i < 6; i++) doc.line(cX[i], ty, cX[i], ty+hdrH+bH);
    doc.rect(tx, ty, tW, hdrH+bH);
    doc.line(tx, bY, tx+tW, bY);

    // Kolom 1: product afbeelding + naam
    const prodImg = kaderEl.querySelector(".vergelijk-img");
    if (prodImg) {
      const imgH = 16, imgW = imgH * 1.1;
      await drawImageFromElement(prodImg, cX[0]+(cW[0]-imgW)/2, bY+2, imgW, imgH);
    }
    const naamEl = kaderEl.querySelector(".vergelijk-productnaam");
    if (naamEl) {
      doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(85,85,85);
      const nm = readText(naamEl);
      doc.text(nm, cX[0]+cW[0]/2 - doc.getTextWidth(nm)/2, bY+22);
    }

    // Kolom 2 en 3: Supermarkt A (blauw) en B (oranje)
    const winkelTds = [...kaderEl.querySelectorAll(".vergelijk-td-winkel")];
    const winkelKleuren = [[59,130,246], [249,115,22]];
    winkelTds.forEach((td, wi) => {
      const ci = wi + 1;
      const cx2 = cX[ci] + cW[ci]/2;
      doc.setFillColor(...winkelKleuren[wi]);
      doc.circle(cx2, bY+7, 4, "F");
      doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(255,255,255);
      const letter = wi === 0 ? "A" : "B";
      doc.text(letter, cx2 - doc.getTextWidth(letter)/2, bY+9.2);
      const prijsEl = td.querySelector(".vergelijk-prijs");
      if (prijsEl) {
        doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(61,58,82);
        const pTxt = readText(prijsEl);
        doc.text(pTxt, cx2 - doc.getTextWidth(pTxt)/2, bY+22);
      }
    });

    // Kolom 4: keuzerondjes
    const keuzes = [...kaderEl.querySelectorAll(".vergelijk-keuze")];
    doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(68,68,68);
    keuzes.forEach((k, ki) => {
      const ky = bY + 5 + ki * 9;
      doc.setDrawColor(170,170,170); doc.setLineWidth(0.3);
      doc.circle(cX[3]+5, ky+1.5, 2.2);
      doc.text(readText(k).trim(), cX[3]+10, ky+2.8);
    });

    // Kolom 5: 2 bewerkingslijnen
    [0,1].forEach(li => {
      doc.setDrawColor(30,30,30);
      drawLine(cX[4]+4, bY+8+li*13, cX[4]+cW[4]-4, bY+8+li*13, 0.4);
    });

    // Kolom 6: verschil
    doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(0,0,0);
    doc.text("\u20ac", cX[5]+4, bY+bH/2+2);
    drawLine(cX[5]+11, bY+bH/2+1.5, cX[5]+cW[5]-3, bY+bH/2+1.5, 0.4);
    doc.setFont("helvetica","italic"); doc.setFontSize(7.5); doc.setTextColor(136,136,136);
    doc.text("verschil", cX[5]+4, bY+bH/2+8);

    doc.setTextColor(0,0,0);
    y += FIXED_H + 5;
  }

  async function drawKortingKader(kaderEl, scale) {
    // Check of er een schatting-rij is → kader iets hoger
    const heeftSchatting = !!kaderEl.querySelector(".korting-schatting-rij");
    const schattingH = heeftSchatting ? 10 : 0;
    const hdrH = 14, bH = 28, pad = 5;
    const FIXED_H = pad + schattingH + hdrH + bH + pad;
    ensureSpace(FIXED_H + 5);
    const x = MARGIN_LEFT, y0 = y, tW = CONTENT_W - 4;
    doc.setDrawColor(183, 183, 201); doc.setLineWidth(0.6);
    drawRoundedRect(x, y0, CONTENT_W, FIXED_H, 3);

    // Schatting-rij bovenaan
    if (heeftSchatting) {
      const sY = y0 + pad + 6;
      doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(85, 85, 85);
      doc.text("Ik schat:", x + 4, sY);
      doc.setDrawColor(85, 85, 85); doc.setLineWidth(0.4);
      drawLine(x + 26, sY - 0.5, x + CONTENT_W - 4, sY - 0.5, 0.4);
    }

    const tabelEl = kaderEl.querySelector(".korting-tabel");
    if (!tabelEl) { y += FIXED_H + 5; return; }

    // Kolombreedtes: 20/18/18/28/16
    const cPct = [0.20, 0.18, 0.18, 0.28, 0.16];
    const cW = cPct.map(p => tW * p);
    const tx = x + 2, ty = y0 + pad + schattingH;  // schuif tabel omlaag als er schatting is
    const cX = [tx]; for (let i = 0; i < cW.length-1; i++) cX.push(cX[i] + cW[i]);
    const bY = ty + hdrH;

    // Header
    doc.setFillColor(252, 228, 236); doc.setDrawColor(224, 128, 144); doc.setLineWidth(0.4);
    doc.rect(tx, ty, tW, hdrH, "FD");
    const hdrs = [...tabelEl.querySelectorAll("thead th")].map(th => readText(th));    doc.setTextColor(139, 26, 42); doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
    hdrs.forEach((h2, i) => {
      const cx2 = cX[i] + cW[i] / 2;
      const lines = splitText(h2, cW[i] - 3, 8.5, "bold");
      const lh = 4, th2 = lines.length * lh;
      lines.forEach((line, li) => {
        doc.text(line, cx2 - doc.getTextWidth(line)/2, ty + (hdrH-th2)/2 + 3.5 + li*lh);
      });
    });

    // Body
    doc.setFillColor(255,255,255); doc.setDrawColor(224,128,144); doc.setLineWidth(0.4);
    doc.rect(tx, bY, tW, bH, "FD");
    for (let i = 1; i < 5; i++) doc.line(cX[i], ty, cX[i], ty+hdrH+bH);
    doc.rect(tx, ty, tW, hdrH+bH);
    doc.line(tx, bY, tx+tW, bY);

    // Kolom 1: product afbeelding + korting-tag + naam
    const prodImg = kaderEl.querySelector(".korting-product-img");
    if (prodImg) {
      const imgH = 14, imgW = imgH * 1.1;
      await drawImageFromElement(prodImg, cX[0]+(cW[0]-imgW)/2, bY+3, imgW, imgH);
    }
    const kortingTag = kaderEl.querySelector(".korting-tag");
    if (kortingTag) {
      const txt = readText(kortingTag);
      doc.setFillColor(229, 57, 53); doc.setDrawColor(229,57,53); doc.setLineWidth(0.2);
      doc.setFont("helvetica","bold"); doc.setFontSize(7.5); doc.setTextColor(255,255,255);
      const tw2 = doc.getTextWidth(txt) + 3;
      doc.roundedRect(cX[0]+cW[0]-tw2-2, bY+2, tw2, 5, 1, 1, "FD");
      doc.text(txt, cX[0]+cW[0]-tw2-0.5, bY+5.8);
    }
    const naamEl = kaderEl.querySelector(".korting-naam");
    if (naamEl) {
      doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(85,85,85);
      const nm = readText(naamEl);
      doc.text(nm, cX[0]+cW[0]/2 - doc.getTextWidth(nm)/2, bY+22);
    }

    // Kolommen 2, 3 of 5: prijzen/percent
    const origEl = kaderEl.querySelector(".korting-orig-prijs");
    const nieuwEl = kaderEl.querySelector(".korting-nieuw-prijs");
    const pctEl  = kaderEl.querySelector(".korting-percent-badge");

    // Teken elke td-prijs en td-percent op de juiste kolom
    const tds = [...kaderEl.querySelectorAll(".korting-tabel tbody td")];
    for (let ci = 1; ci <= 2; ci++) {
      const td = tds[ci];
      if (!td) continue;
      const centerY = bY + bH/2;
      const cx2 = cX[ci] + cW[ci]/2;
      const orig2   = td.querySelector(".korting-orig-prijs");
      const gewone2 = td.querySelector(".korting-gewone-prijs");
      const nieuw2  = td.querySelector(".korting-nieuw-prijs");
      const pct2    = td.querySelector(".korting-percent-badge");
      if (orig2) {
  // Originele prijs zonder doorstreep
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(51, 51, 51);
  const t = readText(orig2);
  doc.text(t, cx2 - doc.getTextWidth(t) / 2, centerY + 2);
}
      if (gewone2) {
        // Gewone originele prijs (niet doorstreept, bij korting_hoeveel)
        doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(51,51,51);
        const t = readText(gewone2); doc.text(t, cx2 - doc.getTextWidth(t)/2, centerY+2);
      }
      if (nieuw2) {
        doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(229,57,53);
        const t = readText(nieuw2); doc.text(t, cx2 - doc.getTextWidth(t)/2, centerY+2);
      }
      if (pct2) {
        doc.setFillColor(229,57,53); doc.setDrawColor(229,57,53);
        doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(255,255,255);
        const t = readText(pct2), tw3 = doc.getTextWidth(t)+6;
        doc.roundedRect(cx2-tw3/2, centerY-5, tw3, 8, 2, 2, "FD");
        doc.text(t, cx2-doc.getTextWidth(t)/2, centerY+1.5);
      }
    }

    // Kolom 4: 2 bewerkingslijnen
    doc.setTextColor(0,0,0); doc.setDrawColor(30,30,30);
    [0,1].forEach(li => drawLine(cX[3]+4, bY+7+li*12, cX[3]+cW[3]-4, bY+7+li*12, 0.4));

    // Kolom 5: antwoord — "€ ___" of "___ %" afhankelijk van subtype
    doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(0,0,0);
    const antwoordEl = kaderEl.querySelector(".korting-antwoord");
    const isPercent = antwoordEl && readText(antwoordEl).includes('%');
    if (isPercent) {
      drawLine(cX[4]+4, bY+bH/2+1.5, cX[4]+cW[4]-14, bY+bH/2+1.5, 0.4);
      doc.text("%", cX[4]+cW[4]-12, bY+bH/2+2);
    } else {
      doc.text("€", cX[4]+4, bY+bH/2+2);
      drawLine(cX[4]+11, bY+bH/2+1.5, cX[4]+cW[4]-3, bY+bH/2+1.5, 0.4);
    }

    doc.setTextColor(0,0,0);
    y += FIXED_H + 5;
  }

  async function drawKader(kaderEl, scale) {
    if (kaderEl.querySelector(".terug-tabel")) {
      await drawTerugKader(kaderEl, scale);
    } else if (kaderEl.querySelector(".kiezen-tabel")) {
      await drawKiezenKader(kaderEl, scale);
    } else if (kaderEl.querySelector(".exact-tabel")) {
      await drawExactKader(kaderEl, scale);
    } else if (kaderEl.querySelector(".vergelijk-tabel")) {
      await drawVergelijkKader(kaderEl, scale);
    } else if (kaderEl.querySelector(".korting-tabel")) {
      await drawKortingKader(kaderEl, scale);
    } else if (kaderEl.querySelector(".winkel-container") || kaderEl.querySelector(".winkel-totaal-layout")) {
      await drawWinkelKader(kaderEl, scale);
    } else {
      await drawStandaardKader(kaderEl, scale);
    }
  }

  async function drawSection(sectionEl, scale) {
    const titleEl = sectionEl.querySelector(":scope > .sectie-titel");
    const posterEl = sectionEl.querySelector(":scope > .winkel-poster");
    const kaders = [...sectionEl.querySelectorAll(":scope > .kaders-grid > .oefening-kader")];
    const isTwoColSkill = ['tellen', 'weinig_mogelijk'].includes(sectionEl.dataset.type);

    // Zorg dat titel + eventuele poster + eerste oefening(srij) altijd samen op dezelfde pagina blijven
const leadNeeded = sectionLeadHeightMm(sectionEl, scale);
ensureSpace(leadNeeded + 8);

    // Titel tekenen (bevat zelf de 7mm witruimte)
    if (titleEl) drawSectionTitle(titleEl);
    if (posterEl) await drawWinkelPoster(posterEl, scale);

    // Kaders tekenen — eerste kader staat al op de pagina door ensureSpace hierboven
    // Volgende kaders mogen gewoon doorstromen (ensureSpace per kader)
    if (isTwoColSkill && kaders.length > 1) {
      const colW = (CONTENT_W - 6) / 2;
      for (let i = 0; i < kaders.length; i += 2) {
        const k1 = kaders[i], k2 = kaders[i + 1];
        const h1 = rect(k1).height * scale;
        const h2 = k2 ? rect(k2).height * scale : 0;
        const rowH = Math.max(h1, h2);
        if (i > 0) ensureSpace(rowH + 5); // eerste rij al gegarandeerd
        const rowY = y;
        await drawStandaardKaderAt(k1, scale, MARGIN_LEFT, rowY, colW);
        if (k2) await drawStandaardKaderAt(k2, scale, MARGIN_LEFT + colW + 6, rowY, colW);
        y = rowY + rowH + 5;
      }
    } else {
      for (let i = 0; i < kaders.length; i++) {
        if (i > 0) ensureSpace(rect(kaders[i]).height * scale + 5);
        await drawKader(kaders[i], scale);
      }
    }

    y += 3;
  }

  async function generate() {
    const werkblad = document.getElementById("werkblad");
    if (!werkblad) {
      alert("Werkblad niet gevonden.");
      return;
    }

    newDoc();

    const scale = mmScaleFromWerkblad(werkblad);

    drawStudentHeader(werkblad, scale);
    drawMainTitle(werkblad);

    const sections = [...werkblad.querySelectorAll(":scope > #secties-container > .oefening-sectie")];
    for (const section of sections) {
      await drawSection(section, scale);
    }

    await doc.save("rekenen-met-geld.pdf", { returnPromise: true });
  }

  return { generate };
})();
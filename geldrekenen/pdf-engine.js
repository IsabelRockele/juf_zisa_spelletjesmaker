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

  // Teken geldafbeeldingen in een vak — flow-based, geen DOM-posities
  async function drawMoneyImgsInBox(vakEl, bx, by, bw, bh, scale) {
    const imgs = [...vakEl.querySelectorAll("img")];
    if (!imgs.length) return;

    const PAD = 2, GAP = 1.5;
    const maxRowH = bh - PAD * 2;

    // Meet elke afbeelding op (gebruik natuurlijke ratio + scale CSS var)
    const items = imgs.map(img => {
      const cssScale = parseFloat(img.style.getPropertyValue('--scale') || img.style.transform?.match(/scale\(([\d.]+)\)/)?.[1] || '1');
      const nat = img.naturalWidth || 60;
      const natH = img.naturalHeight || 40;
      const ratio = nat / natH;
      // Hoogte gebaseerd op natuurlijke hoogte, begrensd op vakhoogte
      const h = Math.min(maxRowH * 0.55, 18) * Math.min(cssScale, 1.3);
      const w = h * ratio;
      return { img, w, h };
    });

    // Verdeel in rijen op basis van beschikbare breedte
    const maxW = bw - PAD * 2;
    const rows = [];
    let curRow = [], curW = 0;
    for (const item of items) {
      if (curW + item.w + GAP > maxW && curRow.length > 0) {
        rows.push(curRow);
        curRow = [item];
        curW = item.w;
      } else {
        curRow.push(item);
        curW += item.w + GAP;
      }
    }
    if (curRow.length) rows.push(curRow);

    // Teken rijen — verticaal gelijkmatig verdeeld
    const rowH = (bh - PAD * 2) / Math.max(rows.length, 1);
    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri];
      const rowCenterY = by + PAD + ri * rowH + rowH / 2;
      let curX = bx + PAD;
      for (const item of row) {
        const iy = rowCenterY - item.h / 2;
        await drawImageFromElement(item.img, curX, iy, item.w, item.h);
        curX += item.w + GAP;
      }
    }
  }

  async function drawTerugKader(kaderEl, scale) {
    // Vaste maten — alles in mm, niks van DOM afhankelijk
    // bodyH=50 zodat 2 lijnen(8+19) + tekst(31) + antwoord(41) allemaal < 50 passen
    const headerH = 18, bodyH = 50, padTop = 7, padBot = 6;
    const FIXED_H = padTop + headerH + bodyH + padBot; // 81mm

    ensureSpace(FIXED_H + 5);
    const x = MARGIN_LEFT, y0 = y, tW = CONTENT_W - 4;
    doc.setDrawColor(183, 183, 201); doc.setLineWidth(0.6);
    drawRoundedRect(x, y0, CONTENT_W, FIXED_H, 3);

    const tabel = kaderEl.querySelector(".terug-tabel");
    if (!tabel) { y += FIXED_H + 5; return; }

    // Kolombreedtes en x-posities
    const cW = [tW*0.16, tW*0.35, tW*0.13, tW*0.36];
    const tx = x + 2, ty = y0 + padTop;
    const cX = [tx, tx+cW[0], tx+cW[0]+cW[1], tx+cW[0]+cW[1]+cW[2]];
    const bodyY = ty + headerH;

    // ── Header ──
    doc.setFillColor(245,232,240); doc.setDrawColor(212,184,200); doc.setLineWidth(0.4);
    doc.rect(tx, ty, tW, headerH, "FD");
    const hdrs = ["Ik koop …","Hoeveel kost het samen?","Ik betaal met …","Ik krijg … € terug."];
    doc.setTextColor(90,58,74);
    hdrs.forEach((hTxt,i) => {
      const cx2 = cX[i]+cW[i]/2, fs = 9;
      doc.setFont("helvetica","bold"); doc.setFontSize(fs);
      const lines = splitText(hTxt, cW[i]-3, fs, "bold");
      const lh = fs*0.46, th = lines.length*lh;
      lines.forEach((line,li) => {
        const tw2 = doc.getTextWidth(line);
        doc.text(line, cx2-tw2/2, ty+(headerH-th)/2+fs*0.38+li*lh);
      });
    });

    // ── Body ──
    doc.setFillColor(255,255,255); doc.setDrawColor(212,184,200); doc.setLineWidth(0.4);
    doc.rect(tx, bodyY, tW, bodyH, "FD");
    for (let i=1;i<4;i++) doc.line(cX[i], ty, cX[i], ty+headerH+bodyH);
    doc.rect(tx, ty, tW, headerH+bodyH);
    doc.line(tx, bodyY, tx+tW, bodyY);

    // ── Kolom 1: producten + prijskaartjes — direct gepositioneerd in bodyY ──
    {
      const mandjeItems = [...kaderEl.querySelectorAll(".mandje-item-terug")];
      const itemH = bodyH / Math.max(mandjeItems.length, 1);
      const imgW = cW[0] * 0.55;  // breedte per afbeelding
      const col1CenterX = cX[0] + cW[0] / 2;

      for (let idx = 0; idx < mandjeItems.length; idx++) {
        const item = mandjeItems[idx];
        const itemTopY = bodyY + idx * itemH;

        // Afbeelding
        const img = item.querySelector("img");
        if (img) {
          const imgH = Math.min(itemH * 0.62, 16);
          const imgDrawW = imgH * 1.2;
          const imgX = col1CenterX - imgDrawW / 2;
          const imgY = itemTopY + 2;
          await drawImageFromElement(img, imgX, imgY, imgDrawW, imgH);
        }

        // Prijskaartje
        const tag = item.querySelector(".mandje-prijs-tag");
        if (tag) {
          const tagTxt = readText(tag);
          doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(51,51,51);
          const tagW = doc.getTextWidth(tagTxt) + 4;
          const tagH = 5;
          const tagX = col1CenterX - tagW / 2;
          const tagY = itemTopY + itemH * 0.68;
          doc.setFillColor(255,248,225); doc.setDrawColor(180,180,180); doc.setLineWidth(0.25);
          doc.roundedRect(tagX, tagY, tagW, tagH, 1, 1, "FD");
          doc.text(tagTxt, tagX + 2, tagY + tagH * 0.75);
        }
      }
    }

    // ── Kolom 2: lijn1(+7) lijn2(+16) tekst(+26) €-lijn(+35) — alles < 50 ──
    { const lx=cX[1]+cW[1]*0.07, lw=cW[1]*0.86;
      doc.setDrawColor(30,30,30);
      drawLine(lx, bodyY+7,  lx+lw, bodyY+7,  0.45);
      drawLine(lx, bodyY+16, lx+lw, bodyY+16, 0.45);
      doc.setFont("helvetica","normal"); doc.setFontSize(11); doc.setTextColor(50,50,50);
      doc.text("Het kost samen", cX[1]+4, bodyY+26);
      doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(0,0,0);
      doc.text("\u20ac", cX[1]+4, bodyY+36);
      drawLine(cX[1]+11, bodyY+35.5, cX[1]+11+cW[1]*0.55, bodyY+35.5, 0.45);
    }

    // ── Kolom 3: biljet gecentreerd ──
    const betaalImg = kaderEl.querySelector(".betaal-biljet-img");
    if (betaalImg) {
      const maxH=16, ratio=betaalImg.naturalWidth/(betaalImg.naturalHeight||2);
      const dW=maxH*(ratio||2);
      await drawImageFromElement(betaalImg, cX[2]+(cW[2]-dW)/2, bodyY+(bodyH-maxH)/2, dW, maxH);
    }

    // ── Kolom 4: lijn1(+7) lijn2(+16) tekst(+26) terug(+36) — alles < 50 ──
    { const lx=cX[3]+cW[3]*0.07, lw=cW[3]*0.86, sX=cX[3]+4;
      doc.setDrawColor(30,30,30);
      drawLine(lx, bodyY+7,  lx+lw, bodyY+7,  0.45);
      drawLine(lx, bodyY+16, lx+lw, bodyY+16, 0.45);
      doc.setFont("helvetica","normal"); doc.setFontSize(11); doc.setTextColor(50,50,50);
      doc.text("Ik krijg \u20ac", sX, bodyY+26);
      const ikW = doc.getTextWidth("Ik krijg \u20ac ");
      drawLine(sX+ikW, bodyY+25.5, sX+ikW+20, bodyY+25.5, 0.45);
      doc.text("terug.", sX, bodyY+36);
    }

    doc.setTextColor(0,0,0);
    y += FIXED_H + 5;
  }

  async function drawWinkelKader(kaderEl, scale) {
    const kH = rect(kaderEl).height * scale;
    ensureSpace(kH + 5);

    const x = MARGIN_LEFT;
    const y0 = y;
    const w = CONTENT_W;
    const h = kH;

    doc.setDrawColor(183, 183, 201);
    doc.setLineWidth(0.6);
    drawRoundedRect(x, y0, w, h, 3);

    const container = kaderEl.querySelector(".winkel-container");
    if (!container) { y += h + 5; return; }

    // Dashed scheidingslijn
    const listEl = container.querySelector(".winkel-lijstje");
    if (listEl) {
      const sepX = relRect(listEl, kaderEl, scale, x, y0).x + relRect(listEl, kaderEl, scale, x, y0).w + 5;
      doc.setLineDashPattern([1.2, 1.2], 0);
      doc.line(sepX, y0 + 4, sepX, y0 + h - 4);
      doc.setLineDashPattern([], 0);
    }

    // Productafbeeldingen
    const mandjeImgs = [...kaderEl.querySelectorAll(".product-img-mandje")];
    for (const img of mandjeImgs) {
      const ir = relRect(img, kaderEl, scale, x, y0);
      await drawImageFromElement(img, ir.x, ir.y, ir.w, ir.h);
    }

    // Label-groep teksten
    const labelEls = [...kaderEl.querySelectorAll(".label-groep")];
    for (const label of labelEls) {
      const lr = relRect(label, kaderEl, scale, x, y0);
      const txt = readText(label);
      const lines = splitText(txt, lr.w, 11, "bold");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      lines.forEach((line, i) => {
        doc.text(line, lr.x, lr.y + 4 + i * 5);
      });
    }

    // Lange invullijn (zonder schatting)
    const lineEl = kaderEl.querySelector(".lange-invul-lijn");
    if (lineEl) {
      const rr = relRect(lineEl, kaderEl, scale, x, y0);
      drawLine(rr.x, rr.y + rr.h - 1.5, rr.x + rr.w, rr.y + rr.h - 1.5, 0.4);
    }

    // Korte invullijnen (met schatting: 2 vakjes naast elkaar elk met 2 lijnen)
    const korteLinies = [...kaderEl.querySelectorAll(".korte-invul-lijn")];
    for (const lijn of korteLinies) {
      const rr = relRect(lijn, kaderEl, scale, x, y0);
      doc.setDrawColor(30, 30, 30);
      drawLine(rr.x, rr.y + rr.h - 1.5, rr.x + rr.w, rr.y + rr.h - 1.5, 0.4);
    }

    // Geld-vak
    const geldVak = kaderEl.querySelector(".geld-vak");
    if (geldVak) {
      await drawMoneyVak(geldVak, kaderEl, x, y0, scale);
    }

    y += h + 5;
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
      // Herbereken breedte relatief aan nieuwe kolombreedte
      const arW = w - 8;
      const arX = x + 4;
      doc.setDrawColor(183, 183, 201);
      drawRoundedRect(arX, ar.y, arW, ar.h, 2.2);
      const txt = "Totaal: €";
      doc.setFont("helvetica", "bold"); doc.setFontSize(11);
      doc.text(txt, arX + 3, ar.y + ar.h * 0.62);
      const lijn = antwoordBox.querySelector(".lijn-invul");
      if (lijn) {
        const txtW = textWidth(txt + " ", 11, "bold");
        drawLine(arX + txtW + 2, ar.y + ar.h - 2, arX + arW - 3, ar.y + ar.h - 2, 0.35);
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
    doc.setDrawColor(183, 183, 201); doc.setLineWidth(0.6);
    drawRoundedRect(x, y0, w, h, 3);

    const tabelEl = kaderEl.querySelector(".kiezen-tabel");
    if (!tabelEl) { y += h + 5; return; }

    const { colX, colWidths, headerH, bodyH, bodyY, tx, ty } =
      drawWinkelTabel(kaderEl, tabelEl, scale, x, y0,
        [0.38, 0.14, 0.30, 0.18],
        [232, 247, 244], [45, 107, 94], [168, 216, 206]);

    // Kolom 1: geldafbeeldingen via flow-based rendering + "Ik tel: € ___"
    const geldVak = kaderEl.querySelector(".kiezen-geld-vak");
    if (geldVak) {
      const vakX = colX[0] + 3;
      const vakW = colWidths[0] - 6;
      const vakH = bodyH - 14; // ruimte laten voor "Ik tel"
      await drawMoneyImgsInBox(geldVak, vakX, bodyY + 3, vakW, vakH, scale);
    }
    // "Ik tel: €" + invullijn onderaan kolom 1
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(45, 107, 94);
    const ikTelTekst = "Ik tel: €";
    const ikTelY = bodyY + bodyH - 6;
    doc.text(ikTelTekst, colX[0] + 4, ikTelY);
    const ikTelW = doc.getTextWidth(ikTelTekst);
    doc.setDrawColor(30, 30, 30);
    drawLine(colX[0] + 4 + ikTelW + 2, ikTelY - 0.5, colX[0] + colWidths[0] - 4, ikTelY - 0.5, 0.4);

    // Kolom 2 & 3: invullijnen
    doc.setTextColor(0, 0, 0);
    [1, 2].forEach(ci => {
      const lx = colX[ci] + 5, lw = colWidths[ci] - 10;
      for (let li = 0; li < 3; li++) {
        const ly = bodyY + 10 + li * 14;
        doc.setDrawColor(30, 30, 30);
        drawLine(lx, ly, lx + lw, ly, 0.4);
      }
    });

    // Kolom 4: "Ik houd € ___ over."
    const overY = bodyY + bodyH / 2;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(50, 50, 50);
    doc.text("Ik houd", colX[3] + 4, overY - 6);
    doc.text("€", colX[3] + 4, overY + 2);
    drawLine(colX[3] + 11, overY + 1.5, colX[3] + colWidths[3] - 5, overY + 1.5, 0.4);
    doc.text("over.", colX[3] + 4, overY + 9);

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
      for (let li = 0; li < 2; li++) {
        doc.setDrawColor(30, 30, 30);
        drawLine(lx, bY2 + 6 + li * 12, lx + lw, bY2 + 6 + li * 12, 0.4);
      }
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
        // Doorgestreepte originele prijs (grijs)
        doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(170,170,170);
        const t = readText(orig2); doc.text(t, cx2 - doc.getTextWidth(t)/2, centerY+2);
        const tw3 = doc.getTextWidth(t);
        doc.setDrawColor(150,150,150); doc.setLineWidth(0.4);
        doc.line(cx2-tw3/2, centerY-0.5, cx2+tw3/2, centerY-0.5);
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
    } else if (kaderEl.querySelector(".winkel-container")) {
      await drawWinkelKader(kaderEl, scale);
    } else {
      await drawStandaardKader(kaderEl, scale);
    }
  }

  async function drawSection(sectionEl, scale) {
    const titleEl = sectionEl.querySelector(":scope > .sectie-titel");
    const posterEl = sectionEl.querySelector(":scope > .winkel-poster");
    const kaders = [...sectionEl.querySelectorAll(":scope > .kaders-grid > .oefening-kader")];
    const isTellen = sectionEl.dataset.type === 'tellen';

    // Bereken hoeveel ruimte titel + poster + eerste kader (of eerste rij) nodig heeft
    // zodat die samen op de pagina passen
    let leadH = 7; // witruimte boven titel
    const titleBandH = titleEl ? 10 : 0; // geschatte titelbalk hoogte
    const posterH = posterEl ? rect(posterEl).height * scale + 6 : 0;
    let firstKaderH = 0;
    if (isTellen && kaders.length > 0) {
      const k1 = kaders[0], k2 = kaders[1];
      firstKaderH = Math.max(rect(k1).height * scale, k2 ? rect(k2).height * scale : 0) + 5;
    } else if (kaders.length > 0) {
      firstKaderH = rect(kaders[0]).height * scale + 5;
    }
    ensureSpace(leadH + titleBandH + 3 + posterH + firstKaderH);

    // Titel tekenen (bevat zelf de 7mm witruimte)
    if (titleEl) drawSectionTitle(titleEl);
    if (posterEl) await drawWinkelPoster(posterEl, scale);

    // Kaders tekenen — eerste kader staat al op de pagina door ensureSpace hierboven
    // Volgende kaders mogen gewoon doorstromen (ensureSpace per kader)
    if (isTellen && kaders.length > 1) {
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
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

    y += boxH + 10;
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
    const lines = splitText(title, CONTENT_W, 13, "bold");
    const lineH = 6;

    ensureSpace(lines.length * lineH + 4);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);

    let startY = y;
    lines.forEach((line, i) => {
      doc.text(line, MARGIN_LEFT, y + i * lineH);
    });

    const underlineY = startY + lines.length * lineH - 1.5;
    drawLine(MARGIN_LEFT, underlineY, MARGIN_LEFT + Math.min(CONTENT_W, textWidth(lines[0], 13, "bold")), underlineY, 0.35);

    y += lines.length * lineH + 4;
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

    doc.setDrawColor(170, 170, 170);
    doc.setLineWidth(0.35);
    drawDashedRect(vr.x, vr.y, vr.w, vr.h);

    const imgs = [...vakEl.querySelectorAll("img")];
    for (const img of imgs) {
      const ir = relRect(img, parentEl, scale, parentX, parentY);
      await drawImageFromElement(img, ir.x, ir.y, ir.w, ir.h);
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

    // Invullijn
    const lineEl = kaderEl.querySelector(".lange-invul-lijn");
    if (lineEl) {
      const rr = relRect(lineEl, kaderEl, scale, x, y0);
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

    const x = MARGIN_LEFT;
    const y0 = y;
    const w = CONTENT_W;
    const h = kH;

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
      await drawMoneyVak(vak, kaderEl, x, y0, scale);
    }

    const antwoordBox = kaderEl.querySelector(".antwoord-box");
    if (antwoordBox) {
      const ar = relRect(antwoordBox, kaderEl, scale, x, y0);
      doc.setDrawColor(183, 183, 201);
      drawRoundedRect(ar.x, ar.y, ar.w, ar.h, 2.2);

      const lijn = antwoordBox.querySelector(".lijn-invul");
      const txt = "Totaal: €";
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(txt, ar.x + 3, ar.y + ar.h * 0.62);

      if (lijn) {
        const lr = relRect(lijn, kaderEl, scale, x, y0);
        drawLine(lr.x, lr.y + lr.h - 0.8, lr.x + lr.w, lr.y + lr.h - 0.8, 0.35);
      }
    }

    y += h + 5;
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
        [0.26, 0.22, 0.30, 0.22],
        [232, 247, 244], [45, 107, 94], [168, 216, 206]);

    // Kolom 1: geldafbeeldingen + "Ik tel: € ___"
    const geldImgs = [...kaderEl.querySelectorAll(".kiezen-geld-vak img")];
    for (const img of geldImgs) {
      const ir = relRect(img, kaderEl, scale, x, y0);
      await drawImageFromElement(img, ir.x, ir.y, ir.w, ir.h);
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
    // Vaste maten: header=14, body=30, padding=10 → kader=54mm
    const hdrH = 18, bH = 30, pad = 5;
    const FIXED_H = pad + hdrH + bH + pad;
    ensureSpace(FIXED_H + 5);
    const x = MARGIN_LEFT, y0 = y, tW = CONTENT_W - 4;
    doc.setDrawColor(183, 183, 201); doc.setLineWidth(0.6);
    drawRoundedRect(x, y0, CONTENT_W, FIXED_H, 3);

    const cPct = [0.16, 0.16, 0.24, 0.26, 0.18];
    const cW = cPct.map(p => tW * p);
    const tx = x + 2, ty = y0 + pad;
    const cX = [tx];
    for (let i = 0; i < cW.length - 1; i++) cX.push(cX[i] + cW[i]);
    const bY = ty + hdrH;

    // Header
    doc.setFillColor(255, 243, 205); doc.setDrawColor(224, 192, 96); doc.setLineWidth(0.4);
    doc.rect(tx, ty, tW, hdrH, "FD");
    const hdrs = ["Product A", "Product B", "Welk is duurder?", "Bewerking", "Verschil"];
    doc.setTextColor(122, 92, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
    hdrs.forEach((h2, i) => {
      const cx2 = cX[i] + cW[i] / 2;
      const tw2 = doc.getTextWidth(h2);
      doc.text(h2, cx2 - tw2 / 2, ty + hdrH * 0.45);
      // Kleine cursieve ondertitel voor bewerkingskolom
      if (i === 3) {
        doc.setFont("helvetica", "italic"); doc.setFontSize(7);
        const subLines = splitText("Reken het verschil uit tussen de prijzen.", cW[3] - 4, 7, "italic");
        subLines.forEach((line, li) => {
          const stw = doc.getTextWidth(line);
          doc.text(line, cx2 - stw / 2, ty + hdrH * 0.45 + 4.5 + li * 3.5);
        });
        doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
      }
    });

    // Body
    doc.setFillColor(255, 255, 255); doc.setDrawColor(224, 192, 96); doc.setLineWidth(0.4);
    doc.rect(tx, bY, tW, bH, "FD");
    for (let i = 1; i < 5; i++) doc.line(cX[i], ty, cX[i], ty + hdrH + bH);
    doc.rect(tx, ty, tW, hdrH + bH);
    doc.line(tx, bY, tx + tW, bY);

    // Producten (kolom 1 en 2)
    const productCols = [...kaderEl.querySelectorAll(".vergelijk-td-product")];
    for (let ci = 0; ci < Math.min(productCols.length, 2); ci++) {
      const col = productCols[ci];
      const centerX = cX[ci] + cW[ci] / 2;

      // Nummer-badge
      const nrEl = col.querySelector(".vergelijk-nummer");
      if (nrEl) {
        doc.setFillColor(61, 171, 146);
        doc.circle(cX[ci] + 4, bY + 4, 2.5, "F");
        doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(255, 255, 255);
        const nTxt = readText(nrEl);
        doc.text(nTxt, cX[ci] + 4 - doc.getTextWidth(nTxt) / 2, bY + 5.2);
      }

      // Afbeelding
      const img = col.querySelector(".vergelijk-img");
      if (img) {
        const imgH = 14, imgW = imgH * 1.1;
        await drawImageFromElement(img, centerX - imgW / 2, bY + 4, imgW, imgH);
      }

      // Prijs
      const prijsEl = col.querySelector(".vergelijk-prijs");
      if (prijsEl) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(61, 58, 82);
        const pTxt = readText(prijsEl);
        const pW = doc.getTextWidth(pTxt);
        doc.text(pTxt, centerX - pW / 2, bY + 24);
      }
    }

    // Kolom 3: keuzerondjes
    const keuzes = [...kaderEl.querySelectorAll(".vergelijk-keuze")];
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(68, 68, 68);
    keuzes.forEach((k, ki) => {
      const ky = bY + 6 + ki * 9;
      doc.setDrawColor(170, 170, 170); doc.setLineWidth(0.3);
      doc.circle(cX[2] + 5, ky + 1.2, 2.2);
      doc.text(readText(k).replace(/^\s*/, ''), cX[2] + 10, ky + 2.5);
    });

    // Kolom 4: 2 bewerkingslijnen
    [0, 1].forEach(li => {
      const ly = bY + 8 + li * 13;
      doc.setDrawColor(30, 30, 30);
      drawLine(cX[3] + 4, ly, cX[3] + cW[3] - 4, ly, 0.4);
    });

    // Kolom 5: "€ ___ verschil"
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(0, 0, 0);
    doc.text("€", cX[4] + 4, bY + 14);
    doc.setDrawColor(30, 30, 30);
    drawLine(cX[4] + 11, bY + 13.5, cX[4] + cW[4] - 4, bY + 13.5, 0.4);
    doc.setFont("helvetica", "italic"); doc.setFontSize(8.5); doc.setTextColor(136, 136, 136);
    doc.text("verschil", cX[4] + 4, bY + 21);

    doc.setTextColor(0, 0, 0);
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

    ensureSpace(sectionLeadHeightMm(sectionEl, scale));

    if (titleEl) {
      drawSectionTitle(titleEl);
    }

    if (posterEl) {
      await drawWinkelPoster(posterEl, scale);
    }

    for (const kader of kaders) {
      await drawKader(kader, scale);
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
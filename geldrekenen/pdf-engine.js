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
    if (!container) {
      y += h + 5;
      return;
    }

    const listEl = container.querySelector(".winkel-lijstje");
    const opdrachtEl = container.querySelector(".winkel-opdracht");

    if (listEl && opdrachtEl) {
      const sepX = relRect(listEl, kaderEl, scale, x, y0).x + relRect(listEl, kaderEl, scale, x, y0).w + 5;
      doc.setLineDashPattern([1.2, 1.2], 0);
      doc.line(sepX, y0 + 4, sepX, y0 + h - 4);
      doc.setLineDashPattern([], 0);
    }

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

    const lineEl = kaderEl.querySelector(".lange-invul-lijn");
    if (lineEl) {
      const rr = relRect(lineEl, kaderEl, scale, x, y0);
      drawLine(rr.x, rr.y + rr.h - 1.5, rr.x + rr.w, rr.y + rr.h - 1.5, 0.4);
    }

    const mandjeImgs = [...kaderEl.querySelectorAll(".product-img-mandje")];
    for (const img of mandjeImgs) {
      const ir = relRect(img, kaderEl, scale, x, y0);
      await drawImageFromElement(img, ir.x, ir.y, ir.w, ir.h);
    }

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

  async function drawKader(kaderEl, scale) {
    if (kaderEl.querySelector(".winkel-container")) {
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
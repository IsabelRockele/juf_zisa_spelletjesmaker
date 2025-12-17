/* =========================================================
   PDF ENGINE – STAP 2
   Bundel + segmentstructuur (zonder oefeningen)
   ========================================================= */

export function downloadPDF(bundel) {
      // ⬇️ Zorg dat bundel ALTIJD een array is
  // === ENIGE BRON VOOR PDF (zoals versie3) ===
let bundelItem = null;
let cfg = null;

try {
  const bundel = JSON.parse(localStorage.getItem('werkbladBundel'));

  if (Array.isArray(bundel) && bundel.length) {
    bundelItem = bundel[0];        // VOLLEDIG item
    cfg = bundelItem.settings;    // enkel instellingen
  }
} catch {}

if (!bundelItem || !cfg || !cfg.hoofdBewerking) {
  alert("Geen geldige instellingen gevonden voor PDF.");
  return;
}

window.__bundelItem = bundelItem;
console.log("PDF bundelItem:", bundelItem);
console.log("PDF cfg:", cfg);
console.log("PDF oefeningen in item:", bundelItem._oefeningen);
console.log("PDF oefeningen in cfg:", cfg._oefeningen);

    
  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // ===== Pagina-instellingen =====
  const PAGE_W = 210;
  const PAGE_H = 297;

  const LEFT_MARGIN   = 16;   // perforatiemarge
  const RIGHT_MARGIN  = 16;
  const TOP_MARGIN    = 20;
  const BOTTOM_MARGIN = 18;

  const CONTENT_W = PAGE_W - LEFT_MARGIN - RIGHT_MARGIN;

  let cursorY = TOP_MARGIN;

  // ===== Naamregel =====
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Naam:", LEFT_MARGIN, cursorY);
  doc.line(LEFT_MARGIN + 14, cursorY + 1, LEFT_MARGIN + 80, cursorY + 1);

  cursorY += 10;

  // ===== Grote bundeltitel =====
  const bundelTitel = bepaalBundelTitel(bundel);

  if (bundelTitel) {
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(20);
    doc.text(bundelTitel, PAGE_W / 2, cursorY, { align: "center" });
    cursorY += 16;
  }

// ===== ENKEL WERKBLAD (zoals versie3) =====

// segmenttitel (opdrachtzin)
const titel = bepaalSegmentTitel(cfg);

cursorY = zorgVoorPaginaEinde(doc, cursorY, 16, TOP_MARGIN, PAGE_H, BOTTOM_MARGIN);

doc.setFont("Helvetica", "bold");
doc.setFontSize(14);
doc.text(titel, LEFT_MARGIN, cursorY);

cursorY += 8;

// oefeningen tekenen
const layout = { LEFT_MARGIN, CONTENT_W, PAGE_H, TOP_MARGIN, BOTTOM_MARGIN };

// DEBUG (tijdelijk)
doc.setFont("Helvetica", "bold");
doc.setFontSize(12);
doc.text(
  "DEBUG hoofd=" + cfg.hoofdBewerking + " stijl=" + cfg.splitsStijl,
  LEFT_MARGIN,
  cursorY
);
cursorY += 10;

// altijd renderen om te testen
if (cfg.splitsStijl === "benen") {
  cursorY = renderSplitsBenenSegment(doc, cfg, cursorY, layout);
  cursorY += 6;
}

if (cfg.splitsStijl === "huisje") {
  cursorY = renderSplitsHuisjesSegment(doc, cfg, cursorY, layout);
  cursorY += 6;
}


  doc.save("bundel.pdf");
}

/* =========================================================
   HULPFUNCTIES
   ========================================================= */

function bepaalBundelTitel(bundelArray) {
  // 1. Later: handmatige titel (nog niet actief)
  if (window.__customBundelTitel && window.__customBundelTitel.trim()) {
    return window.__customBundelTitel.trim();
  }

  // 2. Titel uit bundel
  if (Array.isArray(bundelArray) && bundelArray[0]?.titel) {
    return bundelArray[0].titel;
  }

  // 3. Standaard fallback
  return "Herhaling bewerkingen";
}


function bepaalSegmentTitel(cfg) {
  if (cfg.opdracht && cfg.opdracht.trim()) {
    return cfg.opdracht.trim();
  }

  return "Oefeningen";
}

function zorgVoorPaginaEinde(doc, cursorY, nodig, TOP_MARGIN, PAGE_H, BOTTOM_MARGIN) {
  const maxY = PAGE_H - BOTTOM_MARGIN;

  if (cursorY + nodig > maxY) {
    doc.addPage();
    return TOP_MARGIN;
  }

  return cursorY;
}
function drawSplitsBenenPDF(doc, centerX, y, oef) {
  // compacter benen (zelfde als jouw versie3)
  const r = 1.2, topW = 12, topH = 9, horiz = 6, boxW = 11, boxH = 10;

  const topText = oef.isSom ? '___' : String(oef.totaal);
  const L = oef.isSom ? String(oef.deel1) : (oef.prefill === 'links'  ? String(oef.deel1) : '___');
  const R = oef.isSom ? String(oef.deel2) : (oef.prefill === 'rechts' ? String(oef.deel2) : '___');

  doc.setFillColor(224, 242, 247);
  doc.setDrawColor(51, 51, 51);
  doc.roundedRect(centerX - topW / 2, y, topW, topH, r, r, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(topText, centerX, y + topH - 2, { align: 'center' });

  const bottomTopY = y + topH + 7;
  doc.line(centerX, y + topH, centerX - horiz, bottomTopY);
  doc.line(centerX, y + topH, centerX + horiz, bottomTopY);

  doc.setDrawColor(204, 204, 204);
  doc.roundedRect(centerX - horiz - boxW / 2, bottomTopY, boxW, boxH, r, r, 'D');
  doc.roundedRect(centerX + horiz - boxW / 2, bottomTopY, boxW, boxH, r, r, 'D');

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(13);
  doc.text(L, centerX - horiz, bottomTopY + boxH - 2, { align: 'center' });
  doc.text(R, centerX + horiz, bottomTopY + boxH - 2, { align: 'center' });
}
function renderSplitsBenenSegment(doc, cfg, cursorY, layout) {
  const {
    LEFT_MARGIN, CONTENT_W, PAGE_H, TOP_MARGIN, BOTTOM_MARGIN
  } = layout;

  // Oefeningen ophalen
let oefeningen = Array.isArray(cfg._oefeningen)
  ? cfg._oefeningen
  : Array.isArray(window.__bundelItem?._oefeningen)
    ? window.__bundelItem._oefeningen
    : [];


if (!oefeningen.length) {
  try {
    const bundel = JSON.parse(localStorage.getItem('werkbladBundel'));
    const eerste = bundel?.[0]?.settings;
    if (Array.isArray(eerste?._oefeningen)) {
      oefeningen = eerste._oefeningen;
      cfg._oefeningen = oefeningen;
    }
  } catch {}
}


// ⚠️ Zoals in versie3: genereer pas hier indien nodig
if (!oefeningen.length && window.SplitsenModule?.genereerSplitsenOefeningen) {
  try {
    oefeningen = window.SplitsenModule.genereerSplitsenOefeningen(cfg) || [];
    cfg._oefeningen = oefeningen; // opslaan voor consistentie
  } catch (e) {
    console.error('Splitsbenen genereren mislukt', e);
  }
}


  // Fallback (alleen als nodig): probeer te genereren via SplitsenModule
  if (!oefeningen.length && window.SplitsenModule?.genereerSplitsenOefeningen) {
    try { oefeningen = window.SplitsenModule.genereerSplitsenOefeningen(cfg) || []; } catch {}
  }

  if (!oefeningen.length) return cursorY;

  // Layout: 5 kolommen werkt netjes binnen 178mm content
  const cols = 5;
  const colW = CONTENT_W / cols;

  const itemH = 30;   // hoogte van 1 splitsbenen-tekening + ademruimte
  const rowGap = 4;
  const rowH = itemH + rowGap;

  for (let i = 0; i < oefeningen.length; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;

    // Pagina-einde check per rij (zodat een rij niet “half” breekt)
    if (col === 0) {
      cursorY = zorgVoorPaginaEinde(doc, cursorY, rowH, TOP_MARGIN, PAGE_H, BOTTOM_MARGIN);
    }

    const centerX = LEFT_MARGIN + col * colW + colW / 2;
    const y = cursorY + row * rowH;

    drawSplitsBenenPDF(doc, centerX, y, oefeningen[i]);
  }

  // cursorY naar onder na laatste rij
  const rows = Math.ceil(oefeningen.length / cols);
  cursorY += rows * rowH;

  return cursorY;
}
function drawSplitsHuisPDF(doc, centerX, y, oef) {
  const r = 1, breedte = 32, hoogteDak = 10, hoogteKamer = 12;
  const left = centerX - breedte / 2;

  const topText = oef.isSom ? '___' : String(oef.totaal);
  const L = oef.isSom ? String(oef.deel1) : (oef.prefill === 'links'  ? String(oef.deel1) : '___');
  const R = oef.isSom ? String(oef.deel2) : (oef.prefill === 'rechts' ? String(oef.deel2) : '___');

  const dakBaseline   = y + hoogteDak - 2;
  const kamerBaseline = (yy) => yy + hoogteKamer - 2;

  doc.setLineWidth(0.5);
  doc.setDrawColor(51, 51, 51);
  doc.setFillColor(224, 242, 247);
  doc.roundedRect(left, y, breedte, hoogteDak, r, r, 'FD');

  const yKamers = y + hoogteDak;
  doc.setDrawColor(204, 204, 204);
  doc.roundedRect(left, yKamers, breedte, hoogteKamer, r, r, 'D');
  doc.line(centerX, yKamers, centerX, yKamers + hoogteKamer);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(topText, centerX, dakBaseline, { align: 'center' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(13);
  doc.text(L, centerX - breedte / 4, kamerBaseline(yKamers), { align: 'center' });
  doc.text(R, centerX + breedte / 4, kamerBaseline(yKamers), { align: 'center' });
}
function renderSplitsHuisjesSegment(doc, cfg, cursorY, layout) {
  const {
    LEFT_MARGIN, CONTENT_W, PAGE_H, TOP_MARGIN, BOTTOM_MARGIN
  } = layout;

  let oefeningen = Array.isArray(cfg._oefeningen)
  ? cfg._oefeningen
  : Array.isArray(window.__bundelItem?._oefeningen)
    ? window.__bundelItem._oefeningen
    : [];


if (!oefeningen.length) {
  try {
    const bundel = JSON.parse(localStorage.getItem('werkbladBundel'));
    const eerste = bundel?.[0]?.settings;
    if (Array.isArray(eerste?._oefeningen)) {
      oefeningen = eerste._oefeningen;
      cfg._oefeningen = oefeningen;
    }
  } catch {}
}


  // zoals in versie3: pas hier genereren
  if (!oefeningen.length && window.SplitsenModule?.genereerSplitsenOefeningen) {
    try {
      oefeningen = window.SplitsenModule.genereerSplitsenOefeningen(cfg) || [];
      cfg._oefeningen = oefeningen;
    } catch (e) {
      console.error('Splits-huisjes genereren mislukt', e);
    }
  }

  if (!oefeningen.length) return cursorY;

  const cols = 4;
  const colW = CONTENT_W / cols;
  const rowH = 32;

  oefeningen.forEach((oef, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);

    if (col === 0) {
      cursorY = zorgVoorPaginaEinde(
        doc, cursorY, rowH,
        TOP_MARGIN, PAGE_H, BOTTOM_MARGIN
      );
    }

    const centerX = LEFT_MARGIN + col * colW + colW / 2;
    const y = cursorY + row * rowH;

    drawSplitsHuisPDF(doc, centerX, y, oef);
  });

  cursorY += Math.ceil(oefeningen.length / cols) * rowH;
  return cursorY;
}

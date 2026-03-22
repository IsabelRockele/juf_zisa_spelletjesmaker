// pdf-engine.js — Blokken Maker PDF generator
// Gebruikt canvas.toDataURL() om de al-getekende canvassen naar PDF te exporteren

const pdfEngine = (() => {
    const { jsPDF } = window.jspdf;

    const PAGE_W = 210;
    const PAGE_H = 297;
    const MARGIN_LEFT   = 15;
    const MARGIN_RIGHT  = 15;
    const MARGIN_TOP    = 15;
    const MARGIN_BOTTOM = 18;
    const CONTENT_W     = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT;

    let doc;
    let y;

    // ─── DOCUMENT SETUP ──────────────────────────────
    function newDoc() {
        doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        y = MARGIN_TOP;
        drawFooter();
    }

    function addPage() {
        doc.addPage();
        y = MARGIN_TOP;
        drawFooter();
    }

    function drawFooter() {
        const txt = "juf Zisa's spelgenerator - www.jufzisa.be";
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 160);
        const tw = doc.getTextWidth(txt);
        doc.text(txt, (PAGE_W - tw) / 2, PAGE_H - 8);
        doc.setTextColor(0, 0, 0);
    }

    function ensureSpace(h) {
        if (y + h > PAGE_H - MARGIN_BOTTOM) addPage();
    }

    // ─── HELPERS ─────────────────────────────────────
    function drawRoundedRect(x, yy, w, h, r = 3, style = 'S') {
        doc.roundedRect(x, yy, w, h, r, r, style);
    }

    function drawLine(x1, y1, x2, y2, lw = 0.3) {
        doc.setLineWidth(lw);
        doc.line(x1, y1, x2, y2);
    }

    function readText(el, fallback = '') {
        if (!el) return fallback;
        return (el.innerText || el.textContent || fallback).trim();
    }

    // Canvas → dataURL → PDF image
    function canvasToPdf(canvas, x, yy, maxW, maxH) {
        if (!canvas || canvas.width === 0 || canvas.height === 0) return 0;
        const dataUrl = canvas.toDataURL('image/png');
        const aspect = canvas.width / canvas.height;
        let w = maxW;
        let h = w / aspect;
        if (h > maxH) { h = maxH; w = h * aspect; }
        try {
            doc.addImage(dataUrl, 'PNG', x, yy, w, h);
        } catch(e) { /* skip */ }
        return h;
    }

    // ─── HEADER & TITEL ──────────────────────────────
    function drawStudentHeader(werkbladEl) {
        const boxes = [...werkbladEl.querySelectorAll('.header-box')];
        const boxH = 10;
        ensureSpace(boxH + 6);
        const gap = 6;
        const boxW = (CONTENT_W - gap * (boxes.length - 1)) / boxes.length;
        let x = MARGIN_LEFT;
        boxes.forEach(box => {
            doc.setLineWidth(0.4); doc.setDrawColor(180, 180, 200);
            drawRoundedRect(x, y, boxW, boxH, 2.5);
            doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(50, 50, 50);
            doc.text(readText(box), x + 3, y + 6.5);
            x += boxW + gap;
        });
        y += boxH + 8;
    }

    function drawMainTitle(werkbladEl) {
        const titleEl = werkbladEl.querySelector('.werkblad-titel');
        const title = readText(titleEl, 'BLOKKENBOUWSELS');
        const boxH = 16;
        ensureSpace(boxH + 8);
        doc.setLineWidth(0.4); doc.setDrawColor(180, 180, 200);
        drawRoundedRect(MARGIN_LEFT, y, CONTENT_W, boxH, 0.8);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(0, 0, 0);
        const tw = doc.getTextWidth(title);
        doc.text(title, MARGIN_LEFT + (CONTENT_W - tw) / 2, y + 10.5);
        y += boxH + 6;
    }

    // ─── SECTIE TITEL ────────────────────────────────
    function drawSectionTitle(titleEl) {
        const title = readText(titleEl);
        if (!title) return;
        ensureSpace(14);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(0, 0, 0);
        doc.text(title, MARGIN_LEFT, y + 8);
        doc.setLineWidth(0.5); doc.setDrawColor(0, 0, 0);
        drawLine(MARGIN_LEFT, y + 9.5, MARGIN_LEFT + doc.getTextWidth(title), y + 9.5, 0.5);
        y += 14;
    }

    // ─── OEFENING KADER ──────────────────────────────
    async function drawKader(kaderEl) {
        const type = kaderEl.dataset.type;
        if (type === 'pijlenpad')         await drawPijlenpadKader(kaderEl);
        else if (type === 'tellen')       await drawTelKader(kaderEl);
        else if (type === 'grondplan_invul')    await drawGrondplanInvulKader(kaderEl);
        else if (type === 'grondplan_koppel')   await drawGrondplanKoppelKader(kaderEl);
        else if (type === 'aanzichten')   await drawAanzichtenKader(kaderEl);
    }

    // Teken kader-border en stel y in
    function startKader(benodigdeHoogte) {
        ensureSpace(benodigdeHoogte);
        const kY = y;
        return kY;
    }

    function eindKader(kY, hoogte) {
        doc.setLineWidth(0.5); doc.setDrawColor(200, 195, 215);
        drawRoundedRect(MARGIN_LEFT, kY, CONTENT_W, hoogte, 3);
        y = kY + hoogte + 8;
    }

    // ─── TYPE 1: TELLEN ──────────────────────────────
    async function drawTelKader(kaderEl) {
        const canvas  = kaderEl.querySelector('.bouwsel-canvas');
        if (!canvas) return;

        const vraagTxt = readText(kaderEl.querySelector('.oefening-vraag'), 'Hoeveel blokken?');
        const maxBouwselH = 55; // mm
        const bouwselW = 60;
        const padV = 6, padH = 8;
        const kH = padV + 10 + 4 + maxBouwselH + 4 + 8 + padV;

        const kY = startKader(kH);

        // Vraag
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(50, 50, 50);
        const vraagLines = doc.splitTextToSize(vraagTxt, CONTENT_W - padH * 2);
        vraagLines.forEach((line, i) => {
            doc.text(line, MARGIN_LEFT + padH, kY + padV + 5 + i * 5);
        });

        const vraagH = vraagLines.length * 5 + 2;

        // Bouwsel canvas
        const bouwselY = kY + padV + vraagH + 2;
        const getekendeH = canvasToPdf(canvas, MARGIN_LEFT + padH, bouwselY, bouwselW, maxBouwselH);

        // Antwoord-lijn
        const antY = bouwselY + getekendeH + 6;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(0, 0, 0);
        doc.text('Aantal blokken:', MARGIN_LEFT + padH, antY);
        const labelW = doc.getTextWidth('Aantal blokken:') + 4;
        drawLine(MARGIN_LEFT + padH + labelW, antY, MARGIN_LEFT + padH + labelW + 50, antY, 0.5);

        const gebruikteH = antY - kY + 8;
        eindKader(kY, Math.max(kH, gebruikteH));
    }

    // ─── TYPE 2: GRONDPLAN INVULLEN (fallback enkel kader) ─
    async function drawGrondplanInvulKader(kaderEl) {
        // Wordt normaal niet meer aangeroepen — drawGrondplanInvulRijen doet dit
        // Maar als fallback: teken 1 kader
        const canvas   = kaderEl.querySelector('.bouwsel-canvas');
        const planEl   = kaderEl.querySelector('.grondplan-tabel');
        if (!canvas || !planEl) return;

        const padV = 6, padH = 8;
        const celMm = 8;
        const rijen    = planEl.querySelectorAll('tr').length;
        const kolommen = planEl.querySelector('tr')?.querySelectorAll('td').length || 0;
        const planH    = rijen * celMm;
        const canvasW  = 60;
        const maxCanH  = Math.max(50, planH);
        const kH = padV * 2 + maxCanH + 4;
        const kY = startKader(kH);

        // Bouwsel — verticaal gecentreerd
        const cH = canvasToPdf(canvas, MARGIN_LEFT + padH, kY + padV, canvasW, maxCanH);
        const midY = kY + padV + Math.max(cH, planH) / 2;

        // Pijl als lijn
        const pijlX = MARGIN_LEFT + padH + canvasW + 4;
        doc.setDrawColor(61, 171, 146); doc.setLineWidth(1.5);
        drawLine(pijlX, midY, pijlX + 8, midY, 1.5);
        doc.setLineWidth(1);
        drawLine(pijlX + 5, midY - 2, pijlX + 9, midY, 1);
        drawLine(pijlX + 5, midY + 2, pijlX + 9, midY, 1);

        // Grondplan — verticaal gecentreerd tov bouwsel
        const planX = pijlX + 12;
        const planTop = kY + padV + (maxCanH - planH) / 2;
        tekenGrondplanPdf(planEl, planX, planTop, celMm, true);

        eindKader(kY, kH);
    }

    // Teken grondplan tabel in PDF
    function tekenGrondplanPdf(planEl, x, yy, celMm, leeg) {
        const rijen = [...planEl.querySelectorAll('tr')];
        rijen.forEach((tr, ri) => {
            const cellen = [...tr.querySelectorAll('td')];
            cellen.forEach((td, ci) => {
                const cx = x + ci * celMm;
                const cy = yy + ri * celMm;
                // Gevulde vs lege cel
                const gevuld = td.classList.contains('gp-gevuld');
                if (gevuld) {
                    doc.setFillColor(255, 253, 231);
                } else {
                    doc.setFillColor(248, 248, 248);
                }
                doc.setDrawColor(120, 120, 120); doc.setLineWidth(0.5);
                doc.rect(cx, cy, celMm, celMm, 'FD');

                // Getal (alleen als niet leeg én gevuld)
                if (!leeg && gevuld) {
                    const getalEl = td.querySelector('.gp-getal');
                    if (getalEl) {
                        const getal = readText(getalEl);
                        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(0, 0, 0);
                        const tw = doc.getTextWidth(getal);
                        doc.text(getal, cx + (celMm - tw) / 2, cy + celMm / 2 + 2.5);
                    }
                }
            });
        });
    }

    // ─── TYPE 3: GRONDPLAN KOPPELEN ──────────────────
    async function drawGrondplanKoppelKader(kaderEl) {
        const planEl = kaderEl.querySelector('.koppel-grondplan .grondplan-tabel');
        const opties = [...kaderEl.querySelectorAll('.koppel-optie')];
        if (!planEl || opties.length === 0) return;

        const vraagTxt = readText(kaderEl.querySelector('.oefening-vraag'), 'Verbind het grondplan met het juiste bouwsel.');
        const padV = 6, padH = 8;

        // Grondplan
        const kolommen = planEl.querySelector('tr')?.querySelectorAll('td').length || 0;
        const rijen    = planEl.querySelectorAll('tr').length;
        const celMm    = 8;
        const planW    = kolommen * celMm;
        const planH    = rijen    * celMm;

        // Bouwsels: 4 opties in 2×2 grid
        const optieW   = 40; // mm per optie
        const optieH   = 35;
        const optiePad = 4;
        const bouwselsW = optieW * 2 + optiePad;
        const bouwselsH = optieH * 2 + optiePad;

        const kH = padV + 10 + 4 + Math.max(planH + 20, bouwselsH) + padV + 4;
        const kY = startKader(kH);

        // Vraag
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(50, 50, 50);
        const vLines = doc.splitTextToSize(vraagTxt, CONTENT_W - padH * 2);
        vLines.forEach((l, i) => doc.text(l, MARGIN_LEFT + padH, kY + padV + 5 + i * 5));
        const vH = vLines.length * 5 + 4;

        const contentY = kY + padV + vH;

        // Links: grondplan met label
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(120, 120, 120);
        doc.text('GRONDPLAN', MARGIN_LEFT + padH, contentY + 4);
        tekenGrondplanPdf(planEl, MARGIN_LEFT + padH, contentY + 6, celMm, false);

        // Antwoord lijn
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(0, 0, 0);
        doc.text('Antwoord:', MARGIN_LEFT + padH, contentY + 6 + planH + 8);
        drawLine(MARGIN_LEFT + padH + doc.getTextWidth('Antwoord:') + 3,
                 contentY + 6 + planH + 7,
                 MARGIN_LEFT + padH + 55,
                 contentY + 6 + planH + 7, 0.5);

        // Rechts: 4 bouwsels in 2×2
        const rechtsX = MARGIN_LEFT + padH + planW + 16;
        const letters = ['A', 'B', 'C', 'D'];

        for (let i = 0; i < Math.min(opties.length, 4); i++) {
            const canvas = opties[i].querySelector('.bouwsel-canvas');
            const col = i % 2;
            const row = Math.floor(i / 2);
            const ox = rechtsX + col * (optieW + optiePad);
            const oy = contentY + row * (optieH + optiePad);

            // Letter badge
            doc.setFillColor(61, 171, 146); doc.setDrawColor(61, 171, 146);
            doc.circle(ox + 4.5, oy + 4.5, 4.5, 'F');
            doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
            const lw = doc.getTextWidth(letters[i]);
            doc.text(letters[i], ox + 4.5 - lw / 2, oy + 6.5);

            // Canvas
            if (canvas) {
                canvasToPdf(canvas, ox + 2, oy + 4, optieW - 4, optieH - 8);
            }

            // Kader
            doc.setLineWidth(0.4); doc.setDrawColor(200, 195, 215); doc.setFillColor(250, 250, 250);
            drawRoundedRect(ox, oy, optieW, optieH, 2, 'S');
        }

        eindKader(kY, Math.max(kH, contentY - kY + Math.max(planH + 30, bouwselsH) + padV));
    }

    // ─── TYPE 4: AANZICHTEN ──────────────────────────
    async function drawAanzichtenKader(kaderEl) {
        const bouwselCanvas = kaderEl.querySelector('.aanzicht-bouwsel-wrap .bouwsel-canvas');
        const opties = [...kaderEl.querySelectorAll('.aanzicht-optie')];
        if (!bouwselCanvas || opties.length === 0) return;

        const vraagEl = kaderEl.querySelector('.oefening-vraag');
        const vraagTxt = vraagEl ? vraagEl.innerText || vraagEl.textContent || '' : 'Duid het juiste aanzicht aan.';

        const padV = 6, padH = 8;
        const maxBouwselH = 50;
        const bouwselW    = 55;
        const aanzichtCelMm = 7; // mm per cel in aanzicht

        const kH = padV + 12 + 4 + maxBouwselH + padV + 8;
        const kY = startKader(kH);

        // Vraag
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(50, 50, 50);
        const vLines = doc.splitTextToSize(vraagTxt.trim(), CONTENT_W - padH * 2);
        vLines.forEach((l, i) => doc.text(l, MARGIN_LEFT + padH, kY + padV + 5 + i * 5));
        const vH = vLines.length * 5 + 4;

        const contentY = kY + padV + vH;

        // Bouwsel
        const bH = canvasToPdf(bouwselCanvas, MARGIN_LEFT + padH, contentY, bouwselW, maxBouwselH);

        // Aanzichten naast het bouwsel
        const aanzW  = 30; // mm per aanzicht-blok
        const aanzStartX = MARGIN_LEFT + padH + bouwselW + 10;
        const namen = { voor: 'voorkant', links: 'linkerkant', rechts: 'rechterkant' };

        opties.forEach((optie, i) => {
            const aCanvas = optie.querySelector('.aanzicht-canvas');
            const richting = optie.dataset.richting || '';
            const ox = aanzStartX + i * (aanzW + 6);
            const oy = contentY;

            // Checkbox
            doc.setLineWidth(0.5); doc.setDrawColor(80, 80, 80); doc.setFillColor(255, 255, 255);
            doc.rect(ox, oy, 5, 5, 'FD');

            // Aanzicht canvas
            if (aCanvas) {
                canvasToPdf(aCanvas, ox, oy + 7, aanzW, 28);
            }

            // Label
            doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(80, 80, 80);
            const lbl = namen[richting] || richting;
            const lw = doc.getTextWidth(lbl);
            doc.text(lbl, ox + (aanzW - lw) / 2, oy + 40);
        });

        eindKader(kY, Math.max(kH, contentY - kY + maxBouwselH + 14 + padV));
    }

    // ─── SECTIE ──────────────────────────────────────
    async function drawSection(sectionEl) {
        const titleEl    = sectionEl.querySelector(':scope > .sectie-titel');
        const opdrachtEl = sectionEl.querySelector(':scope > .opdrachtkader .opdracht-zin');
        const kaders     = [...sectionEl.querySelectorAll(':scope > .kaders-grid > .oefening-kader')];
        const type       = sectionEl.dataset.type;

        if (titleEl)    drawSectionTitle(titleEl);
        if (opdrachtEl) drawOpdrachtkader(opdrachtEl);

        // Tellen: 3 kaders per rij naast elkaar
        if (type === 'tellen' && kaders.length > 0) {
            await drawTellenRijen(kaders, opdrachtEl);
            y += 4;
            return;
        }

        for (const kader of kaders) {
            await drawKader(kader);
        }
        y += 4;
    }


    // ─── PIJLENPAD ───────────────────────────────────
  async function drawPijlenpadKader(kaderEl) {
    const instructieEl = kaderEl.querySelector('.pijlenpad-instructie');
    const leegCanvas   = kaderEl.querySelector('.pijlenpad-leeg');
    const pijlenEl     = kaderEl.querySelector('.pijlenpad-pijlen');
    const oplCanvas    = kaderEl.querySelector('.pijlenpad-oplossing-canvas');
    if (!leegCanvas || !pijlenEl) return;

    const padV = 5, padH = 8;
    const canvasH = (leegCanvas.height / leegCanvas.width) * 55;
    const instrH  = instructieEl ? 14 : 0;
    const kH = padV + instrH + 4 + Math.max(55, canvasH) + padV + 4;
    ensureSpace(kH + 8);
    const kY = y;

    // Kader
    doc.setLineWidth(0.5); doc.setDrawColor(200, 195, 215);
    drawRoundedRect(MARGIN_LEFT, kY, CONTENT_W, kH, 3);

    let curY = kY + padV;

    // Instructie
    if (instructieEl) {
      const lines = instructieEl.innerText ? instructieEl.innerText.split('\n') : ['Teken de figuur.'];
      doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(60,60,60);
      lines.forEach(line => {
        if (line.trim()) { doc.text('[ ] ' + line.replace(/^[☐\[\]]+\s*/,'').trim(), MARGIN_LEFT + padH, curY + 4); curY += 5; }
      });
      curY += 2;
    }

    // Leeg ruitjespapier
    const dataUrl = leegCanvas.toDataURL('image/png');
    const w = 55, h = (leegCanvas.height / leegCanvas.width) * w;
    doc.addImage(dataUrl, 'PNG', MARGIN_LEFT + padH, curY, w, h);

    // Pijlenreeks rechts van het ruitjespapier
    // Teken pijlen als canvas-afbeeldingen (Unicode pijlen werken niet in jsPDF)
    const pijlX = MARGIN_LEFT + padH + w + 6;
    const pijlW = CONTENT_W - padH - w - 10;
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(40,40,40);
    doc.text('Pijlenreeks:', pijlX, curY + 5);

    const stapEls = [...pijlenEl.querySelectorAll('.pijl-stap')];
    // Teken elke pijl als kleine canvas → PNG → in PDF
    const PIJL_MM = 9;   // breedte per pijl-stap in mm
    const RIJ_H  = 13;   // hoogte per rij in mm
    const MAX_PER_RIJ = Math.floor(pijlW / PIJL_MM);
    let px = pijlX, py = curY + 8;

    function tekenPijlCanvas(symTekst) {
      const c = document.createElement('canvas');
      c.width = 32; c.height = 32;
      const ctx = c.getContext('2d');
      ctx.clearRect(0,0,32,32);
      // Pijl tekenen op basis van richting
      const richtingMap = {
        '→': [0,0], '←': [Math.PI,0], '↑': [-Math.PI/2,0], '↓': [Math.PI/2,0],
        '↗': [-Math.PI/4,0], '↘': [Math.PI/4,0], '↖': [-3*Math.PI/4,0], '↙': [3*Math.PI/4,0]
      };
      const hoek = (richtingMap[symTekst] || [0,0])[0];
      ctx.save();
      ctx.translate(16,16);
      ctx.rotate(hoek);
      ctx.strokeStyle = '#111'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      // Steel
      ctx.beginPath(); ctx.moveTo(-10,0); ctx.lineTo(8,0); ctx.stroke();
      // Pijlpunt
      ctx.beginPath(); ctx.moveTo(8,0); ctx.lineTo(2,-5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(8,0); ctx.lineTo(2,5); ctx.stroke();
      ctx.restore();
      return c.toDataURL('image/png');
    }

    stapEls.forEach((stap, i) => {
      const sym   = stap.querySelector('.pijl-symbool');
      const getal = stap.querySelector('.pijl-getal');
      if (!sym || !getal) return;
      if (i > 0 && i % MAX_PER_RIJ === 0) { px = pijlX; py += RIJ_H; }
      // Pijl als canvas-afbeelding
      const pijlPng = tekenPijlCanvas(sym.textContent.trim());
      doc.addImage(pijlPng, 'PNG', px, py - 1, PIJL_MM * 0.7, PIJL_MM * 0.7);
      // Getal eronder
      doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(0,0,0);
      const getalTxt = getal.textContent.trim();
      const getalW = doc.getTextWidth(getalTxt);
      doc.text(getalTxt, px + (PIJL_MM * 0.7 - getalW) / 2, py + 7);
      px += PIJL_MM;
    });

    // Oplossing (alleen als zichtbaar)
    if (oplCanvas && oplCanvas.offsetParent !== null) {
      const oplUrl = oplCanvas.toDataURL('image/png');
      const ow = 40, oh = (oplCanvas.height / oplCanvas.width) * ow;
      ensureSpace(oh + 12);
      doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(22,101,52);
      doc.text('Oplossing:', MARGIN_LEFT + padH, y + 5);
      doc.addImage(oplUrl, 'PNG', MARGIN_LEFT + padH + 30, y + 2, ow, oh);
      y += oh + 8;
    }

    y = kY + kH + 8;
  }

    // ─── OPDRACHTKADER ───────────────────────────────
    function drawOpdrachtkader(zinEl) {
        const zin = readText(zinEl);
        if (!zin) return;
        const padH = 8, padV = 6;
        const fs = 11; // groter lettertype
        const regelH = 6;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(fs);
        const regels = doc.splitTextToSize(zin, CONTENT_W - padH * 2);
        const boxH = regels.length * regelH + padV * 2;
        ensureSpace(boxH + 6);
        doc.setLineWidth(0.7); doc.setDrawColor(60, 58, 80);
        doc.setFillColor(250, 250, 252);
        drawRoundedRect(MARGIN_LEFT, y, CONTENT_W, boxH, 3, 'FD');
        doc.setTextColor(20, 20, 20);
        regels.forEach((line, i) => {
            doc.text(line, MARGIN_LEFT + padH, y + padV + 4.5 + i * regelH);
        });
        y += boxH + 6;
    }

    // ─── TELLEN: 3 bouwsels per rij ──────────────────
    async function drawTellenRijen(kaders) {
        const COLS      = 3;
        const gap       = 5;
        const colW      = (CONTENT_W - gap * (COLS - 1)) / COLS;
        const maxCanvasH = 42;
        const hokjeH    = 12;
        const rijH      = maxCanvasH + hokjeH + 10;

        for (let i = 0; i < kaders.length; i += COLS) {
            const rij = kaders.slice(i, i + COLS);
            ensureSpace(rijH + 6);
            const rijY = y;

            for (let k = 0; k < rij.length; k++) {
                const kader = rij[k];
                const canvas = kader.querySelector('.tel-canvas') || kader.querySelector('.bouwsel-canvas');
                const x = MARGIN_LEFT + k * (colW + gap);

                // Kader border
                doc.setLineWidth(0.4); doc.setDrawColor(200, 195, 215); doc.setFillColor(255,255,255);
                drawRoundedRect(x, rijY, colW, rijH, 2, 'FD');

                // Bouwsel
                if (canvas) {
                    canvasToPdf(canvas, x + 2, rijY + 3, colW - 4, maxCanvasH);
                }

                // Antwoordhokje afgerond + "blokken"
                const hokY = rijY + maxCanvasH + 7;
                const hokB = 16, hokH = 8;
                const hokX = x + (colW - hokB - 26) / 2;
                doc.setLineWidth(0.5); doc.setDrawColor(40, 40, 40); doc.setFillColor(255,255,255);
                doc.roundedRect(hokX, hokY, hokB, hokH, 2, 2, 'FD');
                doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(30, 30, 30);
                doc.text('blokken', hokX + hokB + 3, hokY + 5.8);

                // Oplossing
                const oplEl = kader.querySelector('.opl-tellen');
                if (oplEl && document.getElementById('werkblad').classList.contains('toon-oplossingen')) {
                    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(22, 101, 52);
                    doc.text(readText(oplEl), hokX, hokY + 14);
                }
            }
            y = rijY + rijH + 6;
        }
    }

    // ─── GRONDPLAN INVULLEN: 2 per rij ──────────────
    async function drawGrondplanInvulRijen(kaders) {
        const COLS   = 2;
        const gap    = 8;
        const colW   = (CONTENT_W - gap) / COLS;
        const bouwW  = colW * 0.46;
        const planCelMm = 7;

        for (let i = 0; i < kaders.length; i += COLS) {
            const rij = kaders.slice(i, i + COLS);
            const canvas0  = rij[0].querySelector('.bouwsel-canvas');
            const plan0    = rij[0].querySelector('.grondplan-tabel');
            const planRijen = plan0 ? plan0.querySelectorAll('tr').length : 3;
            const planH    = planRijen * planCelMm;
            const canvasH  = canvas0 ? (canvas0.height / canvas0.width) * bouwW : 40;
            const rijH     = Math.max(canvasH, planH) + 14;

            ensureSpace(rijH + 6);
            const rijY = y;

            for (let k = 0; k < rij.length; k++) {
                const kader  = rij[k];
                const canvas = kader.querySelector('.bouwsel-canvas');
                const planEl = kader.querySelector('.grondplan-tabel');
                const x = MARGIN_LEFT + k * (colW + gap);

                doc.setLineWidth(0.4); doc.setDrawColor(200, 195, 215); doc.setFillColor(255,255,255);
                drawRoundedRect(x, rijY, colW, rijH, 2, 'FD');

                const binnenY = rijY + 5;

                // Bouwsel
                if (canvas) canvasToPdf(canvas, x + 3, binnenY, bouwW, rijH - 10);

                // Pijl
                const pijlX   = x + bouwW + 5;
                const pijlMid = rijY + rijH / 2;
                doc.setDrawColor(61, 171, 146); doc.setLineWidth(1.5);
                drawLine(pijlX, pijlMid, pijlX + 8, pijlMid, 1.5);
                doc.setLineWidth(1);
                drawLine(pijlX + 5, pijlMid - 2, pijlX + 9, pijlMid, 1);
                drawLine(pijlX + 5, pijlMid + 2, pijlX + 9, pijlMid, 1);

                // Grondplan
                if (planEl) {
                    const planX  = pijlX + 12;
                    const planKs = planEl.querySelector('tr')?.querySelectorAll('td').length || 3;
                    const planRs = planEl.querySelectorAll('tr').length;
                    const celW   = Math.min(planCelMm, (x + colW - planX - 3) / planKs);
                    const planTop = rijY + (rijH - planRs * celW) / 2;
                    tekenGrondplanPdf(planEl, planX, planTop, celW, true);
                }

                // Oplossing
                const oplEl = kader.querySelector('.opl-grondplan');
                if (oplEl && document.getElementById('werkblad').classList.contains('toon-oplossingen')) {
                    const oplPl = oplEl.querySelector('.grondplan-tabel');
                    if (oplPl) {
                        const planX = pijlX + 12;
                        const planRs = oplPl.querySelectorAll('tr').length;
                        tekenGrondplanPdf(oplPl, planX, rijY + (rijH - planRs * (planCelMm-1)) / 2, planCelMm - 1, false);
                    }
                }
            }
            y = rijY + rijH + 6;
        }
    }

  // ─── GENERATE ────────────────────────────────────
    async function generate(metOplossingen) {
        const werkblad = document.getElementById('werkblad');
        if (!werkblad) { alert('Werkblad niet gevonden.'); return; }

        newDoc();
        drawStudentHeader(werkblad);
        drawMainTitle(werkblad);

        const secties = [...werkblad.querySelectorAll(':scope > #secties-container > .oefening-sectie')];
        for (const sectie of secties) {
            await drawSection(sectie);
        }

        const bestandsnaam = metOplossingen ? 'blokkenbouwsels-oplossingen.pdf' : 'blokkenbouwsels.pdf';
    await doc.save(bestandsnaam, { returnPromise: true });
    }

    return { generate };
})();

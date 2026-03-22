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

    // Canvas → PDF scherp: herrender op grote canvas voor hoge kwaliteit
    function canvasToPdfScherp(canvas, x, yy, maxW, maxH) {
        if (!canvas || canvas.width === 0 || canvas.height === 0) return 0;

        // Probeer het bouwsel opnieuw te renderen op grotere canvas
        const BR = window.BlokkenRenderer;
        const bouwselData = canvas.dataset && canvas.dataset.bouwsel;
        let dataUrl;

        if (bouwselData && BR && BR.renderBouwsel) {
            // Herrender op grote canvas (blokSize 36 ipv 24)
            const grootCanvas = document.createElement('canvas');
            try {
                const hmap = JSON.parse(bouwselData);
                // Bepaal het kleurschema van de originele canvas
                const schema = canvas.dataset.schema ? JSON.parse(canvas.dataset.schema) : null;
                BR.renderBouwsel(grootCanvas, hmap, { blokSize: 36, kleuren: schema });
                dataUrl = grootCanvas.toDataURL('image/png');
            } catch(e) {
                dataUrl = canvas.toDataURL('image/png');
            }
        } else {
            dataUrl = canvas.toDataURL('image/png');
        }

        const aspect = canvas.width / canvas.height;
        let w = maxW, h = w / aspect;
        if (h > maxH) { h = maxH; w = h * aspect; }
        try { doc.addImage(dataUrl, 'PNG', x, yy, w, h); } catch(e) {}
        return h;
    }


    // ─── HEADER & TITEL ──────────────────────────────
    function drawStudentHeader(werkbladEl) {
        const boxes = [...werkbladEl.querySelectorAll('.header-box')];
        const gap = 10;
        const boxW = (CONTENT_W - gap * (boxes.length - 1)) / Math.max(boxes.length, 1);
        ensureSpace(14);
        let x = MARGIN_LEFT;
        boxes.forEach(box => {
            const label = readText(box); // "Naam:" of "Datum:"
            doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(60, 60, 60);
            doc.text(label, x, y + 5);
            const labelB = doc.getTextWidth(label) + 3;
            // Schrijflijn na het label
            doc.setLineWidth(0.5); doc.setDrawColor(40, 40, 40);
            drawLine(x + labelB, y + 5.5, x + boxW, y + 5.5, 0.5);
            x += boxW + gap;
        });
        y += 12;
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
        const getekendeH = canvasToPdfScherp(canvas, MARGIN_LEFT + padH, bouwselY, bouwselW, maxBouwselH);

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
                doc.setFillColor(255, 255, 255);
                doc.setDrawColor(100, 100, 100); doc.setLineWidth(0.5);
                doc.rect(cx, cy, celMm, celMm, 'FD');

                // Getal tonen als niet-leeg modus (gp-cijfervak met .gp-getal)
                if (!leeg) {
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

        const padV = 6, padH = 7;
        const celMm    = 11;
        const kolommen = planEl.querySelector('tr')?.querySelectorAll('td').length || 3;
        const rijen    = planEl.querySelectorAll('tr').length;
        const planW    = kolommen * celMm;
        const planH    = rijen * celMm;

        // 4 bouwsels in 2×2 rechts — meer ruimte tussen grondplan en bouwsels
        const optieW   = 44;
        const optieH   = 40;
        const optiePad = 5;
        const bouwselsH = optieH * 2 + optiePad;

        // Afstand tussen grondplan-kolom en bouwsel-kolom
        const tussenRuimte = 18;

        const kH = padV * 2 + Math.max(planH + 18, bouwselsH);
        const kY = startKader(kH + 4);
        const contentY = kY + padV;

        // Links: grondplan label + grondplan met cijfers
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(100, 100, 120);
        doc.text('GRONDPLAN', MARGIN_LEFT + padH, contentY + 4);
        tekenGrondplanKoppelPdf(planEl, MARGIN_LEFT + padH, contentY + 7, celMm);

        // Antwoord — invulhokje, bij oplossingen: correcte letter erin
        const antY = contentY + 7 + planH + 10;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(0, 0, 0);
        doc.text('Antwoord:', MARGIN_LEFT + padH, antY);
        const antLW = doc.getTextWidth('Antwoord:');
        doc.setLineWidth(0.5); doc.setDrawColor(40, 40, 40);
        doc.setFillColor(window._pdfMetOplossingen ? 230 : 255, 255, window._pdfMetOplossingen ? 230 : 255);
        doc.roundedRect(MARGIN_LEFT + padH + antLW + 3, antY - 6, 14, 9, 2, 2, 'FD');
        if (window._pdfMetOplossingen) {
            const oplEl3 = kaderEl.querySelector('.opl-koppel strong');
            if (oplEl3) {
                const letter = readText(oplEl3).trim();
                if (letter) {
                    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(0, 120, 0);
                    const lw3 = doc.getTextWidth(letter);
                    doc.text(letter, MARGIN_LEFT + padH + antLW + 3 + (14 - lw3) / 2, antY - 0.5);
                }
            }
        }

        // Rechts: 4 bouwsels — extra tussenruimte tov grondplan
        const rechtsX = MARGIN_LEFT + padH + planW + tussenRuimte;
        const letters = ['A', 'B', 'C', 'D'];

        for (let i = 0; i < Math.min(opties.length, 4); i++) {
            const canvas = opties[i].querySelector('.bouwsel-canvas');
            const col = i % 2;
            const row = Math.floor(i / 2);
            const ox = rechtsX + col * (optieW + optiePad);
            const oy = contentY + row * (optieH + optiePad);

            // Kader
            doc.setLineWidth(0.4); doc.setDrawColor(200, 195, 215); doc.setFillColor(250, 250, 250);
            drawRoundedRect(ox, oy, optieW, optieH, 2, 'FD');

            // Canvas op hogere resolutie voor scherpere afbeelding
            if (canvas) {
                canvasToPdfScherp(canvas, ox + 2, oy + 5, optieW - 4, optieH - 8);
            }

            // Letter badge — groter en verticaal gecentreerd
            const r = 5.5; // straal rondje
            const cx2 = ox + r, cy2 = oy + r;
            doc.setFillColor(61, 171, 146); doc.setDrawColor(61, 171, 146);
            doc.circle(cx2, cy2, r, 'F');
            doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(255, 255, 255);
            const lw = doc.getTextWidth(letters[i]);
            // Verticaal centreren: baseline ≈ cy + fontSize*0.35/2.835
            doc.text(letters[i], cx2 - lw / 2, cy2 + 1.8);
        }

        eindKader(kY, kH + 4);
    }

    // Teken grondplan met cijfers voor koppel-oefening
    function tekenGrondplanKoppelPdf(planEl, x, yy, celMm) {
        const rijen = [...planEl.querySelectorAll('tr')];
        rijen.forEach((tr, ri) => {
            const cellen = [...tr.querySelectorAll('td')];
            cellen.forEach((td, ci) => {
                const cx = x + ci * celMm;
                const cy = yy + ri * celMm;
                doc.setFillColor(255, 255, 255);
                doc.setDrawColor(60, 60, 60);
                doc.setLineWidth(0.6);
                doc.rect(cx, cy, celMm, celMm, 'FD');
                const getalEl = td.querySelector('.gp-getal');
                if (getalEl) {
                    const getal = readText(getalEl);
                    if (getal && getal !== '0') {
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(12);
                        doc.setTextColor(0, 0, 0);
                        const tw = doc.getTextWidth(getal);
                        doc.text(getal, cx + (celMm - tw) / 2, cy + celMm * 0.65);
                    }
                }
            });
        });
    }

    // ─── TYPE 4: AANZICHTEN ──────────────────────────
    async function drawAanzichtenKader(kaderEl) {
        const bouwselCanvas = kaderEl.querySelector('.aanzicht-bouwsel-wrap .bouwsel-canvas');
        const opties = [...kaderEl.querySelectorAll('.aanzicht-optie')];
        if (!bouwselCanvas || opties.length === 0) return;

        const padV = 5, padH = 5;
        const maxBouwselH = 40;
        const bouwselW    = 50;  // smaller zodat aanzichten meer ruimte krijgen
        const aanzW       = 32;  // mm per aanzicht
        const aanzGap     = 5;
        const hokjeB      = 10;
        const hokjeH      = 10;

        // Lees de vraag (bevat "van de rechterkant" etc.)
        const vraagEl = kaderEl.querySelector('.oefening-vraag');
        const vraagTxt = vraagEl ? (vraagEl.innerText || vraagEl.textContent || '').trim() : '';
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
        const vraagRegels = vraagTxt ? doc.splitTextToSize(vraagTxt, CONTENT_W - 16) : [];
        const vraagH = vraagRegels.length > 0 ? vraagRegels.length * 6 + 4 : 0;

        const kH = padV * 2 + vraagH + maxBouwselH + hokjeH + 2;
        const kY = startKader(kH + 4);
        let contentY = kY + padV;

        // Vraag tekenen
        if (vraagRegels.length > 0) {
            doc.setTextColor(30, 30, 30);
            vraagRegels.forEach((line, i) => {
                doc.text(line, MARGIN_LEFT + 8, contentY + 5 + i * 6);
            });
            contentY += vraagH;
        }

        // Kader rond bouwsel + bouwsel links
        doc.setLineWidth(0.4); doc.setDrawColor(200, 195, 215); doc.setFillColor(255,255,255);
        drawRoundedRect(MARGIN_LEFT + padH - 2, contentY - 1, bouwselW + 4, maxBouwselH + 2, 2, 'FD');
        canvasToPdfScherp(bouwselCanvas, MARGIN_LEFT + padH - 1, contentY, bouwselW, maxBouwselH);

        // 3 aanzichten — dichter bij bouwsel
        const aanzStartX = MARGIN_LEFT + padH + bouwselW + 5;

        opties.forEach((optie, i) => {
            const aCanvas = optie.querySelector('.aanzicht-canvas');
            const ox = aanzStartX + i * (aanzW + aanzGap);
            const oy = contentY;

            // Aanzicht DIRECT in PDF tekenen — altijd scherp
            if (aCanvas) {
                const bouwselData = aCanvas.dataset.bouwsel;
                const richting    = aCanvas.dataset.richting;
                const kleurData   = aCanvas.dataset.kleur;

                if (bouwselData && richting && window.BlokkenRenderer) {
                    const BR    = window.BlokkenRenderer;
                    const hmap  = JSON.parse(bouwselData);
                    const kleur = kleurData ? JSON.parse(kleurData) : null;
                    const vulHex = kleur ? kleur.voor : '#f9d03f';
                    const randHex = kleur ? kleur.rand : '#7a5200';

                    // Bereken silhouet
                    const silhouet = BR.berekenAanzicht(hmap, richting);
                    const nLagen   = silhouet.length;
                    const nKols    = silhouet[0] ? silhouet[0].length : 0;
                    if (nLagen > 0 && nKols > 0) {
                        const celMmA = Math.min(7, aanzW / nKols);
                        const totB   = nKols * celMmA;
                        const totH   = nLagen * celMmA;
                        const startX2 = ox + (aanzW - totB) / 2;
                        const startY2 = oy + (maxBouwselH - totH) / 2;

                        // Kleur omzetten van hex naar RGB
                        function hexRgb(hex) {
                            const r = parseInt(hex.slice(1,3),16);
                            const g = parseInt(hex.slice(3,5),16);
                            const b = parseInt(hex.slice(5,7),16);
                            return [r,g,b];
                        }
                        const [vr,vg,vb] = hexRgb(vulHex);
                        const [rr,rg,rb] = hexRgb(randHex);

                        // Teken eerst lege cellen (lichtgrijs, geen rand)
                        for (let z = 0; z < nLagen; z++) {
                            for (let k = 0; k < nKols; k++) {
                                if (!silhouet[z][k]) {
                                    const cx = startX2 + k * celMmA;
                                    const cy = startY2 + (nLagen - 1 - z) * celMmA;
                                    doc.setFillColor(248, 248, 248);
                                    doc.setLineWidth(0);
                                    doc.rect(cx, cy, celMmA, celMmA, 'F');
                                }
                            }
                        }
                        // Dan gevulde cellen bovenop (met rand)
                        for (let z = 0; z < nLagen; z++) {
                            for (let k = 0; k < nKols; k++) {
                                if (silhouet[z][k]) {
                                    const cx = startX2 + k * celMmA;
                                    const cy = startY2 + (nLagen - 1 - z) * celMmA;
                                    doc.setFillColor(vr, vg, vb);
                                    doc.setDrawColor(rr, rg, rb);
                                    doc.setLineWidth(0.5);
                                    doc.rect(cx, cy, celMmA, celMmA, 'FD');
                                }
                            }
                        }
                    }
                }
            }

            // Hokje gecentreerd ONDER het aanzicht
            const hokX = ox + (aanzW - hokjeB) / 2;
            // Bereken werkelijke aanzicht hoogte voor correct hokje-placement
            const aRichting = aCanvas ? aCanvas.dataset.richting : '';
            let werkelijkeAanzH = maxBouwselH;
            if (aCanvas && aCanvas.dataset.bouwsel && aRichting && window.BlokkenRenderer) {
                try {
                    const hmapTmp = JSON.parse(aCanvas.dataset.bouwsel);
                    const sil = window.BlokkenRenderer.berekenAanzicht(hmapTmp, aRichting);
                    const nL = sil.length;
                    const nK = sil[0] ? sil[0].length : 0;
                    if (nL > 0 && nK > 0) {
                        const celTmp = Math.min(7, aanzW / nK);
                        werkelijkeAanzH = nL * celTmp;
                    }
                } catch(e) {}
            }
            // Hokje staat altijd onder maxBouwselH (aanzicht is verticaal gecentreerd daarin)
            const hokY = oy + maxBouwselH - 6;
            const isCorrect = window._pdfMetOplossingen && (() => {
                if (!aRichting) return false;
                // Probeer via .opl-aanzicht tekst
                const oplEl4 = kaderEl.querySelector('.opl-aanzicht');
                if (oplEl4) {
                    const oplTxt = readText(oplEl4).toLowerCase();
                    // aRichting = 'voor'|'links'|'rechts', opl bevat 'voorkant'|'linkerkant'|'rechterkant'
                    if (oplTxt.includes(aRichting)) return true;
                }
                // Fallback: via data-correct attribuut op optie
                const optieDiv = aCanvas ? aCanvas.closest('.aanzicht-optie') : null;
                if (optieDiv && optieDiv.dataset.correct === '1') return true;
                return false;
            })();
            doc.setLineWidth(0.6); doc.setDrawColor(40, 40, 40);
            doc.setFillColor(isCorrect ? 230 : 255, 255, isCorrect ? 230 : 255);
            doc.roundedRect(hokX, hokY, hokjeB, hokjeH, 2, 2, 'FD');
            if (isCorrect) {
                doc.setDrawColor(0, 140, 0); doc.setLineWidth(0.8);
                doc.line(hokX + 1.5, hokY + 1.5, hokX + hokjeB - 1.5, hokY + hokjeH - 1.5);
                doc.line(hokX + hokjeB - 1.5, hokY + 1.5, hokX + 1.5, hokY + hokjeH - 1.5);
            }
        });

        eindKader(kY, kH + 4);
    }

    // ─── SECTIE ──────────────────────────────────────
    async function drawSection(sectionEl) {
        const titleEl    = sectionEl.querySelector(':scope > .sectie-titel');
        // Zoek opdracht-zin OF eerste opdracht-zin-deel (voor pijlenpad)
        const opdrachtEl = sectionEl.querySelector(':scope > .opdrachtkader .opdracht-zin')
                        || sectionEl.querySelector(':scope > .opdrachtkader .opdracht-zin-deel')
                        || sectionEl.querySelector(':scope > .opdrachtkader');
        const kaders     = [...sectionEl.querySelectorAll(':scope > .kaders-grid > .oefening-kader')];
        const type       = sectionEl.dataset.type;

        if (titleEl) drawSectionTitle(titleEl);

        // Bereken hoeveel ruimte opdrachtkader + eerste rij oefeningen nodig heeft
        // zodat ze ALTIJD samen op dezelfde pagina staan
        if (opdrachtEl) {
            // Bereken hoogte: tel het aantal regels in het opdrachtkader
            const kaderEl3 = opdrachtEl.closest
                ? opdrachtEl.closest('.opdrachtkader') || opdrachtEl
                : opdrachtEl;
            const aantalRegels = Math.max(1,
                kaderEl3.querySelectorAll('.opdracht-zin-deel').length ||
                kaderEl3.querySelectorAll('.opdracht-zin').length || 1);
            const opdrachtH = aantalRegels * 6.5 + 10 + 5;
            const eersteRijH = type === 'tellen'           ? 65
                             : type === 'grondplan_invul'  ? 55
                             : type === 'grondplan_koppel' ? 95
                             : type === 'aanzichten'       ? 88
                             : type === 'pijlenpad'        ? 80
                             : 70;
            ensureSpace(opdrachtH + eersteRijH);
            drawOpdrachtkader(opdrachtEl);
        }

        // Tellen: 3 kaders per rij naast elkaar
        if (type === 'tellen' && kaders.length > 0) {
            await drawTellenRijen(kaders);
            y += 4;
            return;
        }

        // Grondplan invullen: 2 per rij
        if (type === 'grondplan_invul' && kaders.length > 0) {
            await drawGrondplanInvulRijen(kaders);
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
    // Bereken ruitjespapier afmetingen eerst (h nodig voor kH)
    const CEL_PDF_CALC = 5;
    const gridS_CALC = leegCanvas ? Math.round((leegCanvas.width - 8) / 18) : 12;
    const w_CALC = gridS_CALC * CEL_PDF_CALC;
    const h_CALC = gridS_CALC * CEL_PDF_CALC;
    const canvasH = h_CALC;
    const instrH  = 0;  // instructie staat in opdrachtkader
    const aantalStappen = pijlenEl.querySelectorAll('.pijl-stap').length;
    const pijlW2 = CONTENT_W - padH - w_CALC - 14;
    const maxPerRij2 = Math.max(4, Math.floor(pijlW2 / 10));
    const aantalRijen = Math.ceil(aantalStappen / maxPerRij2);
    const pijlSectieH = 10 + aantalRijen * 14;
    const kH = padV + instrH + 4 + Math.max(h_CALC, pijlSectieH) + padV + 4;
    ensureSpace(kH + 8);
    const kY = y;

    // Kader
    doc.setLineWidth(0.5); doc.setDrawColor(200, 195, 215);
    drawRoundedRect(MARGIN_LEFT, kY, CONTENT_W, kH, 3);

    let curY = kY + padV;

    // Instructie staat in opdrachtkader — niet herhalen in oefenvak


    // Leeg ruitjespapier DIRECT in PDF tekenen
    const CEL_PDF = CEL_PDF_CALC;
    const gridS = gridS_CALC;
    const w = w_CALC;
    const h = h_CALC;
    // Ruitjes tekenen
    doc.setDrawColor(100, 140, 180); doc.setLineWidth(0.3);
    for (let i = 0; i <= gridS; i++) {
        const lx = MARGIN_LEFT + padH + i * CEL_PDF;
        const ly = curY + i * CEL_PDF;
        doc.line(lx, curY, lx, curY + h);      // verticale lijn
        doc.line(MARGIN_LEFT + padH, ly, MARGIN_LEFT + padH + w, ly);  // horizontale lijn
    }
    // Startpunt stip — haal positie op uit canvas dataset
    doc.setFillColor(50, 50, 50);
    if (leegCanvas && leegCanvas.dataset.startx !== undefined) {
        const sx = parseFloat(leegCanvas.dataset.startx);
        const sy = parseFloat(leegCanvas.dataset.starty);
        // In canvas: y omhoog, gridSize bekend
        const stipX = MARGIN_LEFT + padH + sx * CEL_PDF;
        const stipY = curY + (gridS - sy) * CEL_PDF;
        doc.circle(stipX, stipY, 0.9, 'F');
    } else {
        // Fallback: stip links onderaan
        doc.circle(MARGIN_LEFT + padH + CEL_PDF * 2, curY + h - CEL_PDF * 2, 0.9, 'F');
    }


    // Bij oplossingen: teken het pad direct op het ruitjespapier
    if (window._pdfMetOplossingen && oplCanvas && oplCanvas.dataset.paden) {
        try {
            const paden = JSON.parse(oplCanvas.dataset.paden);
            doc.setDrawColor(26, 86, 219); doc.setLineWidth(1.2);
            paden.forEach(pad => {
                if (pad.length < 2) return;
                for (let p = 0; p < pad.length - 1; p++) {
                    const x1 = MARGIN_LEFT + padH + pad[p][0]   * CEL_PDF;
                    const y1 = curY         + (gridS - pad[p][1])   * CEL_PDF;
                    const x2 = MARGIN_LEFT + padH + pad[p+1][0] * CEL_PDF;
                    const y2 = curY         + (gridS - pad[p+1][1]) * CEL_PDF;
                    doc.line(x1, y1, x2, y2);
                }
            });
        } catch(e) {}
    }

    // Pijlenreeks rechts van het ruitjespapier
    // Teken pijlen als canvas-afbeeldingen (Unicode pijlen werken niet in jsPDF)
    const pijlX = MARGIN_LEFT + padH + w + 6;
    const pijlW = CONTENT_W - padH - w - 10;
    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(40,40,40);
    doc.text('Pijlenreeks:', pijlX, curY + 5);

    const stapEls = [...pijlenEl.querySelectorAll('.pijl-stap')];
    const PIJL_MM = 10;  // breedte per pijl-stap in mm
    const RIJ_H  = 14;   // hoogte per rij in mm
    const MAX_PER_RIJ = Math.max(4, Math.floor(pijlW / PIJL_MM));
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
      doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(0,0,0);
      const getalTxt = getal.textContent.trim();
      const getalW = doc.getTextWidth(getalTxt);
      doc.text(getalTxt, px + (PIJL_MM * 0.7 - getalW) / 2, py + 9);
      px += PIJL_MM;
    });

    // Oplossing wordt direct op ruitjespapier getekend (zie hierboven)

    y = kY + kH + 8;
  }

    // ─── OPDRACHTKADER ───────────────────────────────
    function drawOpdrachtkader(zinEl) {
        const padH = 8, padV = 5;
        const fs = 11;
        const regelH = 6.5;
        const hokjeB = 3.5;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(fs);

        // Pijlenpad: .opdracht-zin-deel spans met hokjes
        const kaderEl2 = zinEl.closest ? zinEl.closest('.opdrachtkader') : null;
        const instrSpans = kaderEl2
            ? [...kaderEl2.querySelectorAll('.opdracht-zin-deel')]
            : [];
        let regelsArr = [];
        let heeftHokjes = false;

        if (instrSpans.length > 0) {
            regelsArr = instrSpans.map(el => readText(el).trim()).filter(Boolean);
            heeftHokjes = true;
        } else {
            const zin = readText(zinEl);
            if (!zin) return;
            regelsArr = zin.split('|').map(r => r.trim()).filter(Boolean);
        }

        const boxH = regelsArr.length * regelH + padV * 2;
        doc.setLineWidth(0.7); doc.setDrawColor(60, 58, 80);
        doc.setFillColor(250, 250, 252);
        drawRoundedRect(MARGIN_LEFT, y, CONTENT_W, boxH, 3, 'FD');
        doc.setTextColor(20, 20, 20);

        // Verticaal centreren: totale teksthoogte = regelsArr.length * regelH
        const totaalTekstH = regelsArr.length * regelH;
        const startTekstY = y + (boxH - totaalTekstH) / 2 + regelH * 0.75;

        regelsArr.forEach((regel, i) => {
            const regelY = startTekstY + i * regelH;
            if (heeftHokjes) {
                doc.setLineWidth(0.4); doc.setDrawColor(40,40,40); doc.setFillColor(255,255,255);
                doc.roundedRect(MARGIN_LEFT + padH, regelY - hokjeB + 0.5, hokjeB, hokjeB, 0.5, 0.5, 'FD');
                doc.setTextColor(20, 20, 20);
                doc.text(regel, MARGIN_LEFT + padH + hokjeB + 2, regelY);
            } else {
                doc.text(regel, MARGIN_LEFT + padH, regelY);
            }
        });
        y += boxH + 5;
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
                    canvasToPdfScherp(canvas, x + 2, rijY + 3, colW - 4, maxCanvasH);
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
                if (oplEl && window._pdfMetOplossingen) {
                    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(22, 101, 52);
                    doc.text(readText(oplEl), hokX, hokY + 14);
                }
            }
            y = rijY + rijH + 6;
        }
    }

    // ─── GRONDPLAN INVULLEN: 2 per rij ──────────────
    async function drawGrondplanInvulRijen(kaders) {
        const COLS      = 2;
        const gap       = 6;
        const colW      = (CONTENT_W - gap) / COLS;
        const padKader  = 1;
        const pijlB     = 7;
        const pijlGap   = 2;
        const celMm     = 7;

        // Gebruik de GROOTSTE grondplan (3 of 4 kols) om bouwW op te baseren
        // zodat ook het 4x4 grondplan altijd binnen het kader past
        const maxNKols = Math.max(...kaders.map(k => {
            const p = k.querySelector('.grondplan-tabel');
            return p?.querySelector('tr')?.querySelectorAll('td').length || 3;
        }));
        const nKols   = maxNKols;
        const plan0   = kaders[0]?.querySelector('.grondplan-tabel');
        const nRijen  = plan0?.querySelectorAll('tr').length || 3;
        const planW   = nKols * celMm;
        const planH   = nRijen * celMm;
        // Bouwsel = wat overblijft, maar nooit meer dan 36mm
        const bouwWBerekend = colW - padKader * 2 - pijlGap * 2 - pijlB - planW;
        const bouwW   = Math.min(bouwWBerekend, 36);
        const canvasH = (() => {
            const c = kaders[0]?.querySelector('.bouwsel-canvas');
            return c ? (c.height / c.width) * bouwW : 36;
        })();
        const rijH = Math.max(canvasH, planH) + padKader * 2 + 4;


        for (let i = 0; i < kaders.length; i += COLS) {
            const rij = kaders.slice(i, i + COLS);
            ensureSpace(rijH + 6);
            const rijY = y;

            for (let k = 0; k < rij.length; k++) {
                const kader  = rij[k];
                const canvas = kader.querySelector('.bouwsel-canvas');
                const planEl = kader.querySelector('.grondplan-tabel');
                const x = MARGIN_LEFT + k * (colW + gap);

                // Kader border
                doc.setLineWidth(0.4); doc.setDrawColor(200, 195, 215); doc.setFillColor(255,255,255);
                drawRoundedRect(x, rijY, colW, rijH, 2, 'FD');

                const midY = rijY + rijH / 2;

                // Bouwsel — verticaal gecentreerd
                if (canvas) {
                    const cH = Math.min(canvasH, rijH - padKader * 2);
                    const cY = rijY + (rijH - cH) / 2;
                    canvasToPdf(canvas, x + padKader, cY, bouwW, cH);
                }

                // Pijl — compact, verticaal gecentreerd
                const pijlX = x + padKader + bouwW + pijlGap;
                doc.setDrawColor(61, 171, 146); doc.setLineWidth(1.5);
                drawLine(pijlX, midY, pijlX + pijlB, midY, 1.5);
                doc.setLineWidth(1);
                drawLine(pijlX + pijlB - 3, midY - 2, pijlX + pijlB, midY, 1);
                drawLine(pijlX + pijlB - 3, midY + 2, pijlX + pijlB, midY, 1);

                // Grondplan — verticaal gecentreerd
                // Grondplan — leeg of ingevuld afhankelijk van metOplossingen
                const planX   = pijlX + pijlB + pijlGap;
                const planTop = rijY + (rijH - planH) / 2;
                const beschikbaarB = x + colW - planX - padKader;
                const werkCel = Math.min(celMm, beschikbaarB / nKols);


                if (window._pdfMetOplossingen) {
                    // Tweede grondplan-tabel in kader = oplossing (eerste = leeg)
                    const alleTabellen = [...kader.querySelectorAll('.grondplan-tabel')];
                    const oplTabel = alleTabellen.length > 1 ? alleTabellen[1] : null;
                    if (oplTabel) {
                        tekenGrondplanPdf(oplTabel, planX, planTop, werkCel, false);
                    } else if (planEl) {
                        tekenGrondplanPdf(planEl, planX, planTop, werkCel, true);
                    }
                } else if (planEl) {
                    tekenGrondplanPdf(planEl, planX, planTop, werkCel, true);
                }
            }
            y = rijY + rijH + 6;
        }
    }

  // ─── GENERATE ────────────────────────────────────
    async function generate(metOplossingen) {
        const werkblad = document.getElementById('werkblad');
        if (!werkblad) { alert('Werkblad niet gevonden.'); return; }

        // Sla metOplossingen op als module-variabele zodat alle draw-functies het kunnen lezen
        window._pdfMetOplossingen = !!metOplossingen;

        newDoc();
        drawStudentHeader(werkblad);
        drawMainTitle(werkblad);

        const secties = [...werkblad.querySelectorAll(':scope > #secties-container > .oefening-sectie')];
        for (const sectie of secties) {
            await drawSection(sectie);
        }

        window._pdfMetOplossingen = false;
        const bestandsnaam = metOplossingen ? 'blokkenbouwsels-oplossingen.pdf' : 'blokkenbouwsels.pdf';
        await doc.save(bestandsnaam, { returnPromise: true });
    }

    return { generate };
})();

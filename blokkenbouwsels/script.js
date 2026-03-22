// script.js — Blokken Maker generator logica

// ─────────────────────────────────────────────
// BANNER BIJ INSTELLINGEN-WIJZIGING
// ─────────────────────────────────────────────
function checkInstellingenWijziging() {
    const heeftSecties = document.getElementById('secties-container')?.children.length > 0;
    if (heeftSecties) {
        const banner = document.getElementById('instellingen-banner');
        if (banner) banner.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    ['niveau', 'type-oefening', 'aantalOefeningen'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', checkInstellingenWijziging);
    });
});

// ─────────────────────────────────────────────
// SECTIE TOEVOEGEN
// ─────────────────────────────────────────────
let sectieCounter = 0;

function addSectie() {
    const type    = document.getElementById('type-oefening').value;
    const niveau  = document.getElementById('niveau').value;
    const aantal  = parseInt(document.getElementById('aantalOefeningen').value) || 2;

    sectieCounter++;
    const sectieId = `sectie-${sectieCounter}`;

    const container = document.getElementById('secties-container');
    const sectieDiv = document.createElement('div');
    sectieDiv.className = 'oefening-sectie';
    sectieDiv.dataset.type   = type;
    sectieDiv.dataset.niveau = niveau;
    sectieDiv.id = sectieId;

    const titels = {
        tellen:          'Hoeveel blokken?',
        grondplan_invul: 'Vul het grondplan in',
        grondplan_koppel:'Welk bouwsel hoort bij het grondplan?',
        aanzichten:      'Duid het juiste aanzicht aan',
        pijlenpad:       'Teken de figuur',
    };

    const opdrachtzinnen = {
        tellen:          'Met hoeveel blokken is elk bouwsel gemaakt? Er staan geen blokken verstopt achter het bouwsel.',
        grondplan_invul: 'Vul het grondplan in. Schrijf in elk vakje hoeveel blokjes er op die plek op elkaar staan.',
        grondplan_koppel:'Verbind elk grondplan met het juiste bouwsel.',
        aanzichten:      'Bekijk het bouwsel goed. Kruis het juiste aanzicht aan.',
        pijlenpad:       'Teken de figuur op het ruitjespapier. Volg de pijlenreeks. Begin bij de stip.',
    };
    const opdracht = opdrachtzinnen[type] || titels[type] || '';

    sectieDiv.innerHTML = `
        <div class="sectie-header no-print">
            <button class="sectie-verwijder-btn" onclick="verwijderSectie('${sectieId}')" title="Sectie verwijderen">✕ Sectie verwijderen</button>
        </div>
        <div class="opdrachtkader">
            <span class="opdracht-zin" contenteditable="true">${opdracht}</span>
        </div>
        <div class="kaders-grid${type === 'tellen' ? ' kaders-grid-tellen' : type === 'grondplan_invul' ? ' kaders-grid-2kol' : ''}" id="${sectieId}-grid"></div>
        <div class="no-print sectie-voeg-toe">
            <button class="voeg-oefening-btn" onclick="voegOefeningToe('${sectieId}', '${type}', '${niveau}')">＋ Oefening</button>
        </div>
    `;

    container.appendChild(sectieDiv);

    // Voeg oefeningen toe
    const grid = document.getElementById(`${sectieId}-grid`);
    for (let i = 0; i < aantal; i++) {
        voegOefeningToe(sectieId, type, niveau, grid);
    }
}

function verwijderSectie(sectieId) {
    const el = document.getElementById(sectieId);
    if (el) el.remove();
}

// ─────────────────────────────────────────────
// OEFENING AANMAKEN PER TYPE
// ─────────────────────────────────────────────
let oefeningCounter = 0;

function voegOefeningToe(sectieId, type, niveau, gridEl) {
    if (!gridEl) gridEl = document.getElementById(`${sectieId}-grid`);
    if (!gridEl) return;

    oefeningCounter++;
    const oefId = `oef-${oefeningCounter}`;
    const kader = document.createElement('div');
    kader.className = 'oefening-kader';
    kader.id = oefId;
    kader.dataset.type   = type;
    kader.dataset.niveau = niveau;

    // Verwijderknop
    const verwijderBtn = document.createElement('button');
    verwijderBtn.className = 'oefening-verwijder-btn no-print';
    verwijderBtn.title = 'Oefening verwijderen';
    verwijderBtn.innerHTML = '✕';
    verwijderBtn.onclick = () => kader.remove();
    kader.appendChild(verwijderBtn);

    const BR = window.BlokkenRenderer;
    const bouwsel = BR.genereerBouwsel(niveau);
    const schema  = BR.volgendSchema(); // elk bouwsel een ander kleur

    if (type === 'tellen') {
        renderTelOefening(kader, bouwsel, niveau, schema);
    } else if (type === 'grondplan_invul') {
        renderGrondplanInvulOefening(kader, bouwsel, niveau, schema);
    } else if (type === 'grondplan_koppel') {
        renderGrondplanKoppelOefening(kader, bouwsel, niveau, schema);
    } else if (type === 'aanzichten') {
        renderAanzichtenOefening(kader, bouwsel, niveau, schema);
    } else if (type === 'pijlenpad') {
        renderPijlenpadOefening(kader, niveau);
        gridEl.appendChild(kader);
        return;
    }

    gridEl.appendChild(kader);
}

// ─────────────────────────────────────────────
// TYPE 1: TELLEN
// ─────────────────────────────────────────────
function renderTelOefening(kader, bouwsel, niveau, schema) {
    const BR = window.BlokkenRenderer;
    const totaal = BR.telBlokken(bouwsel);

    // Bouwsel canvas
    const canvas = document.createElement('canvas');
    canvas.className = 'bouwsel-canvas tel-canvas';
    canvas.dataset.totaal = totaal;
    kader.appendChild(canvas);

    // Antwoordvak: hokje + "blokken"
    const antwoord = document.createElement('div');
    antwoord.className = 'tel-antwoord';
    antwoord.innerHTML = '<div class="tel-hokje"></div><span class="tel-label">blokken</span>';
    kader.appendChild(antwoord);

    // Oplossing
    const opl = document.createElement('div');
    opl.className = 'opl-antwoord opl-tellen';
    opl.innerHTML = '<strong>' + totaal + '</strong> blokken';
    kader.appendChild(opl);

    requestAnimationFrame(() => {
        BR.renderBouwsel(canvas, bouwsel, { kleuren: schema });
    });
}

// ─────────────────────────────────────────────
// TYPE 2: GRONDPLAN INVULLEN
// ─────────────────────────────────────────────
function renderGrondplanInvulOefening(kader, bouwsel, niveau, schema) {
    const BR = window.BlokkenRenderer;

    // Bouwsel canvas
    const canvas = document.createElement('canvas');
    canvas.className = 'bouwsel-canvas gp-bouwsel-canvas';

    // Pijl als SVG
    const pijl = document.createElement('div');
    pijl.className = 'grondplan-pijl';
    pijl.innerHTML = `<svg width="28" height="16" viewBox="0 0 28 16">
        <line x1="2" y1="8" x2="22" y2="8" stroke="#3dab92" stroke-width="2.5" stroke-linecap="round"/>
        <polyline points="16,3 23,8 16,13" fill="none" stroke="#3dab92" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>`;

    // Leeg grondplan
    const planWrap = document.createElement('div');
    planWrap.className = 'grondplan-wrap';
    planWrap.innerHTML = BR.renderGrondplanHTML(bouwsel, { leeg: true });

    // Inhoud: bouwsel → pijl → grondplan
    const inhoud = document.createElement('div');
    inhoud.className = 'grondplan-invul-inhoud';
    inhoud.appendChild(canvas);
    inhoud.appendChild(pijl);
    inhoud.appendChild(planWrap);
    kader.appendChild(inhoud);

    // Oplossing
    const opl = document.createElement('div');
    opl.className = 'opl-antwoord opl-grondplan';
    opl.innerHTML = 'Oplossing:<br>' + BR.renderGrondplanHTML(bouwsel, { toonCijfers: true, leeg: false });
    kader.appendChild(opl);

    requestAnimationFrame(() => {
        BR.renderBouwsel(canvas, bouwsel, { kleuren: schema });
    });
}

// ─────────────────────────────────────────────
// TYPE 3: GRONDPLAN KOPPELEN AAN BOUWSEL (4 opties)
// ─────────────────────────────────────────────
function renderGrondplanKoppelOefening(kader, bouwsel, niveau, schema) {
    const BR = window.BlokkenRenderer;

    // Genereer 4 bouwsels: 1 correct + 3 fouten
    const opties = [bouwsel];
    while (opties.length < 4) {
        const fout = BR.genereerAndereGrid(bouwsel, niveau);
        // Zorg dat ze allemaal anders zijn
        if (!opties.some(o => JSON.stringify(o) === JSON.stringify(fout))) {
            opties.push(fout);
        }
    }
    BR.shuffle(opties);
    const correctIndex = opties.indexOf(bouwsel);

    const wrapper = document.createElement('div');
    wrapper.className = 'koppel-oefening';

    const vraag = document.createElement('p');
    vraag.className = 'oefening-vraag';
    vraag.textContent = 'Verbind het grondplan met het juiste bouwsel. Schrijf de letter van het juiste bouwsel op.';
    wrapper.appendChild(vraag);

    const inhoud = document.createElement('div');
    inhoud.className = 'koppel-inhoud';

    // Links: grondplan (met cijfers)
    const planKant = document.createElement('div');
    planKant.className = 'koppel-links';
    const planLabel = document.createElement('div');
    planLabel.className = 'koppel-label';
    planLabel.textContent = 'Grondplan';
    planKant.appendChild(planLabel);
    const planWrap = document.createElement('div');
    planWrap.className = 'grondplan-wrap koppel-grondplan';
    planWrap.innerHTML = BR.renderGrondplanHTML(bouwsel, { toonCijfers: true });
    planKant.appendChild(planWrap);

    // Antwoordvak
    const antw = document.createElement('div');
    antw.className = 'koppel-antwoord-vak';
    antw.innerHTML = '<span class="koppel-antw-label">Antwoord:</span><div class="koppel-antw-lijn"></div>';
    planKant.appendChild(antw);
    inhoud.appendChild(planKant);

    // Rechts: 4 bouwsels met letters A-D
    const bouwselsKant = document.createElement('div');
    bouwselsKant.className = 'koppel-rechts';
    const letters = ['A', 'B', 'C', 'D'];

    opties.forEach((opt, i) => {
        const item = document.createElement('div');
        item.className = 'koppel-optie';
        item.dataset.correct = (i === correctIndex) ? 'ja' : 'nee';

        const letter = document.createElement('div');
        letter.className = 'koppel-letter';
        letter.textContent = letters[i];
        item.appendChild(letter);

        const canvas = document.createElement('canvas');
        canvas.className = 'bouwsel-canvas bouwsel-canvas-klein';
        canvas.dataset.bouwsel = JSON.stringify(opt);
        item.appendChild(canvas);

        bouwselsKant.appendChild(item);

        requestAnimationFrame(() => {
            BR.renderBouwsel(canvas, opt, { blokSize: 12, kleuren: BR.volgendSchema() });
        });
    });

    inhoud.appendChild(bouwselsKant);
    wrapper.appendChild(inhoud);

    // Oplossing: toon de correcte letter
    const correctLetter = letters[correctIndex];
    const oplKoppel = document.createElement('div');
    oplKoppel.className = 'opl-antwoord opl-koppel';
    oplKoppel.innerHTML = '✓ Het juiste bouwsel is: <strong>' + correctLetter + '</strong>';
    wrapper.appendChild(oplKoppel);

    kader.appendChild(wrapper);
}

// ─────────────────────────────────────────────
// TYPE 4: AANZICHTEN AANDUIDEN
// ─────────────────────────────────────────────
function renderAanzichtenOefening(kader, bouwsel, niveau, schema) {
    const BR = window.BlokkenRenderer;

    const richtingen = ['voor', 'links', 'rechts'];
    const gevraagd = richtingen[Math.floor(Math.random() * richtingen.length)];
    const namen = { voor: 'voorkant', links: 'linkerkant', rechts: 'rechterkant' };

    // 1 vaste kleur voor bouwsel + aanzichten (per oefening anders)
    const EENKLEUREN = [
        { voor:'#f9c523', boven:'#fde97a', rechts:'#d4970a', rand:'#7a5200' },
        { voor:'#3ec6f0', boven:'#8de4f8', rechts:'#1090c8', rand:'#004870' },
        { voor:'#4dd96a', boven:'#96edaa', rechts:'#1aaa40', rand:'#085820' },
        { voor:'#f05a5a', boven:'#f8a0a0', rechts:'#c01818', rand:'#580000' },
        { voor:'#c060e8', boven:'#e0a0f8', rechts:'#8820c0', rand:'#420060' },
        { voor:'#f07828', boven:'#f8b878', rechts:'#c04808', rand:'#602000' },
    ];
    const eenKleur = EENKLEUREN[BR.telBlokken(bouwsel) % EENKLEUREN.length];
    const eenKleurSchema = { patroon: '_een', ...eenKleur };

    const wrapper = document.createElement('div');
    wrapper.className = 'aanzicht-oefening';

    const vraag = document.createElement('p');
    vraag.className = 'oefening-vraag';
    vraag.innerHTML = `Bekijk het bouwsel van de <strong>${namen[gevraagd]}</strong>. Welk aanzicht zie je? Kruis aan.`;
    wrapper.appendChild(vraag);

    const inhoud = document.createElement('div');
    inhoud.className = 'aanzicht-inhoud';

    // Bouwsel in 1 kleur
    const bouwselWrap = document.createElement('div');
    bouwselWrap.className = 'aanzicht-bouwsel-wrap';
    const canvas = document.createElement('canvas');
    canvas.className = 'bouwsel-canvas';
    bouwselWrap.appendChild(canvas);
    inhoud.appendChild(bouwselWrap);

    // 3 aanzichten in dezelfde kleur, volgorde geschud
    const aanzichtenWrap = document.createElement('div');
    aanzichtenWrap.className = 'aanzichten-opties';
    const geschuddeRichtingen = richtingen.slice();
    BR.shuffle(geschuddeRichtingen);

    geschuddeRichtingen.forEach(richting => {
        const optieDiv = document.createElement('div');
        optieDiv.className = 'aanzicht-optie';
        optieDiv.dataset.richting = richting;
        optieDiv.dataset.correct = (richting === gevraagd) ? 'ja' : 'nee';

        const checkbox = document.createElement('div');
        checkbox.className = 'aanzicht-checkbox';
        optieDiv.appendChild(checkbox);

        const aCanvas = document.createElement('canvas');
        aCanvas.className = 'aanzicht-canvas';
        optieDiv.appendChild(aCanvas);

        aanzichtenWrap.appendChild(optieDiv);

        requestAnimationFrame(() => {
            BR.renderBouwsel(canvas, bouwsel, { kleuren: eenKleurSchema });
            renderAanzichtGekleurd(aCanvas, bouwsel, richting, eenKleur);
        });
    });

    inhoud.appendChild(aanzichtenWrap);
    wrapper.appendChild(inhoud);

    // Oplossing: toon welk aanzicht correct is
    const oplAanzicht = document.createElement('div');
    oplAanzicht.className = 'opl-antwoord opl-aanzicht';
    oplAanzicht.innerHTML = '✓ Het juiste aanzicht is het <strong>' + namen[gevraagd] + '</strong>-aanzicht';
    wrapper.appendChild(oplAanzicht);

    kader.appendChild(wrapper);
}

// ─────────────────────────────────────────────
// AANZICHT RENDEREN — 1 vaste kleur per bouwsel
// ─────────────────────────────────────────────
function renderAanzichtGekleurd(canvas, hmap, richting, eenKleur) {
    // eenKleur = { voor, boven, rand } — 1 kleur voor heel het bouwsel
    const BR = window.BlokkenRenderer;
    const silhouet = BR.berekenAanzicht(hmap, richting);
    const maxH    = silhouet.length;
    const breedte = silhouet[0] ? silhouet[0].length : 0;
    if (!maxH || !breedte) return;

    const CEL = 20;
    const TOP = Math.round(CEL * 0.25);
    const pad = 4;
    canvas.width  = breedte * CEL + pad * 2;
    canvas.height = maxH * CEL + TOP + pad * 2;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let k = 0; k < breedte; k++) {
        // Zoek de hoogte van deze kolom: hoogste z waar silhouet[z][k] true is
        let hoogte = 0;
        for (let z = 0; z < maxH; z++) if (silhouet[z][k]) hoogte = z + 1;

        for (let z = 0; z < hoogte; z++) {
            const cx = pad + k * CEL;
            const cy = canvas.height - pad - (z + 1) * CEL - TOP;

            // Voorvlak
            ctx.fillStyle   = eenKleur.voor;
            ctx.strokeStyle = eenKleur.rand;
            ctx.lineWidth   = 0.9;
            ctx.fillRect(cx, cy + TOP, CEL, CEL);
            ctx.strokeRect(cx, cy + TOP, CEL, CEL);

            // Bovenstukje
            ctx.fillStyle   = eenKleur.boven;
            ctx.strokeStyle = eenKleur.rand;
            ctx.beginPath();
            ctx.moveTo(cx,       cy + TOP);
            ctx.lineTo(cx + CEL, cy + TOP);
            ctx.lineTo(cx + CEL, cy);
            ctx.lineTo(cx,       cy);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }
}


// ─────────────────────────────────────────────
// TYPE 5: PIJLENPAD
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// FIGUREN BIBLIOTHEEK — door Juf Zisa getekend
// pts: coördinaten [x,y] met y omhoog, null = pen omhoog
// ─────────────────────────────────────────────
const PIJLENPAD_FIGUREN = [
    { naam:'Boot',        niveau:'middel',   pts:[[6,8],[9,8],[9,10],[6,10],[6,5],[12,5],[9,2],[3,2],[0,5],[6,5]] },
    { naam:'Hart',        niveau:'middel',   pts:[[6,9],[7,10],[9,10],[10,9],[10,6],[9,5],[6,2],[2,6],[2,9],[3,10],[5,10],[6,9]] },
    { naam:'Huis',        niveau:'middel',   pts:[[5,4],[5,1],[1,1],[1,7],[6,12],[11,7],[11,1],[7,1],[7,4],[5,4]] },
    { naam:'Kerstboom',   niveau:'moeilijk', pts:[[4,1],[4,3],[0,3],[2,5],[1,5],[3,7],[2,7],[4,9],[3,9],[4,10],[5,11],[7,9],[6,9],[8,7],[7,7],[9,5],[8,5],[10,3],[6,3],[6,1],[4,1]] },
    { naam:'Kruis',       niveau:'makkelijk',pts:[[4,11],[6,11],[6,9],[8,9],[8,7],[6,7],[6,5],[4,5],[4,7],[2,7],[2,9],[4,9],[4,11]] },
    { naam:'Pijl',        niveau:'makkelijk',pts:[[9,10],[12,7],[9,4],[9,6],[2,6],[2,8],[9,8],[9,10]] },
    { naam:'Raket',       niveau:'middel',   pts:[[4,2],[4,3],[2,3],[4,5],[4,9],[5,10],[6,9],[6,5],[8,3],[6,3],[6,2],[5,3],[4,2]] },
    { naam:'Sleutel',     niveau:'moeilijk', pts:[[6,10],[9,10],[9,11],[6,11],[6,12],[5,12],[5,5],[3,5],[3,2],[7,2],[8,2],[8,5],[6,5],[6,7],[8,7],[8,8],[6,8],[6,10]] },
    { naam:'Bovenlichaam',niveau:'moeilijk', pts:[[3,9],[5,11],[7,9],[6,9],[6,7],[5,7],[5,5],[7,5],[7,4],[9,4],[9,3],[7,3],[7,1],[3,1],[3,3],[1,3],[1,4],[3,4],[3,5],[5,5],[5,7],[4,7],[4,9],[3,9]] },
    { naam:'Vrije vorm',  niveau:'middel',   pts:[[4,8],[3,7],[2,6],[3,5],[4,4],[5,4],[6,4],[6,6],[8,6],[8,4],[10,4],[12,6],[10,8],[8,8],[8,10],[6,10],[6,8],[4,8]] },
];

// Zet pts om naar pijlstappen (voor weergave als pijlreeks)
// Richting-symbolen
const PIJL_SYMS = {
    '1,0':'→', '-1,0':'←', '0,1':'↑', '0,-1':'↓',
    '1,1':'↗', '1,-1':'↘', '-1,1':'↖', '-1,-1':'↙',
};

function ptsNaarStappen(pts) {
    const stappen = [];
    const echte = pts.filter(p => p !== null);
    for (let i = 1; i < echte.length; i++) {
        const dx = echte[i][0] - echte[i-1][0];
        const dy = echte[i][1] - echte[i-1][1];
        if (dx === 0 && dy === 0) continue;
        const len = Math.max(Math.abs(dx), Math.abs(dy));
        const rx = dx/len, ry = dy/len;
        const sym = PIJL_SYMS[rx+','+ry] || '?';
        if (stappen.length > 0 && stappen[stappen.length-1].sym === sym) {
            stappen[stappen.length-1].n += len;
        } else {
            stappen.push({ sym, n: len });
        }
    }
    return stappen;
}

function centreerPts(pts) {
    // Filter nulls voor berekening
    const echte = pts.filter(p => p !== null);
    const xs = echte.map(p => p[0]), ys = echte.map(p => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const breedte = maxX - minX, hoogte = maxY - minY;
    const gridSize = Math.max(breedte, hoogte) + 4;
    const offX = Math.floor((gridSize - breedte) / 2) - minX;
    const offY = Math.floor((gridSize - hoogte)  / 2) - minY;
    return {
        pts: pts.map(p => p === null ? null : [p[0] + offX, p[1] + offY]),
        gridSize,
        startX: echte[0][0] + offX,
        startY: echte[0][1] + offY,
    };
}

function genereerPijlenpad(niveau) {
    // Kies een willekeurige figuur van het juiste niveau
    // Als geen exact niveau: gebruik alle figuren
    let opties = PIJLENPAD_FIGUREN.filter(f => f.niveau === niveau);
    if (opties.length === 0) opties = PIJLENPAD_FIGUREN;

    const figuur = opties[Math.floor(Math.random() * opties.length)];
    const { pts, gridSize, startX, startY } = centreerPts(figuur.pts);
    const stappen = ptsNaarStappen(pts);

    return { naam: figuur.naam, stappen, pts, gridSize, startX, startY };
}

function renderPijlenpadOefening(kader, niveau) {
    const figuur = genereerPijlenpad(niveau);

    const wrapper = document.createElement('div');
    wrapper.className = 'pijlenpad-oef';

    // Instructie
    const instr = document.createElement('div');
    instr.className = 'pijlenpad-instructie';
    instr.innerHTML = '☐ Teken de figuur op het ruitjespapier.<br>☐ Volg de pijlenreeks.<br>☐ Begin bij de stip.';
    wrapper.appendChild(instr);

    const inhoud = document.createElement('div');
    inhoud.className = 'pijlenpad-wrap';

    // Leeg ruitjespapier
    const leegCanvas = document.createElement('canvas');
    leegCanvas.className = 'pijlenpad-leeg';
    tekenRuitjesPapier(leegCanvas, figuur.gridSize, null, figuur.startX, figuur.startY);
    inhoud.appendChild(leegCanvas);

    // Pijlenreeks
    const pijlenWrap = document.createElement('div');
    pijlenWrap.className = 'pijlenpad-pijlen';
    figuur.stappen.forEach(stap => {
        const div = document.createElement('div');
        div.className = 'pijl-stap';
        const sym = document.createElement('div');
        sym.className = 'pijl-symbool';
        sym.textContent = stap.sym;
        const getal = document.createElement('div');
        getal.className = 'pijl-getal';
        getal.textContent = stap.n;
        div.appendChild(sym);
        div.appendChild(getal);
        pijlenWrap.appendChild(div);
    });
    inhoud.appendChild(pijlenWrap);
    wrapper.appendChild(inhoud);

    // Oplossing (verborgen)
    const oplWrap = document.createElement('div');
    oplWrap.className = 'opl-antwoord';
    oplWrap.style.cssText = 'margin-top:8px;padding:6px 10px;background:#f0fdf4;border:1.5px solid #86efac;border-radius:7px;';
    const oplLabel = document.createElement('div');
    oplLabel.style.cssText = 'font-size:0.82rem;font-weight:700;color:#166534;font-family:Arial;margin-bottom:4px;';
    oplLabel.textContent = '✓ Oplossing — ' + figuur.naam + ':';
    oplWrap.appendChild(oplLabel);
    const oplCanvas = document.createElement('canvas');
    tekenRuitjesPapier(oplCanvas, figuur.gridSize, figuur.pts, figuur.startX, figuur.startY);
    oplWrap.appendChild(oplCanvas);
    wrapper.appendChild(oplWrap);

    kader.appendChild(wrapper);
}

function tekenRuitjesPapier(canvas, gridSize, pts, startX, startY) {
    const CEL = 14;
    const pad = 4;
    canvas.width  = gridSize * CEL + pad * 2;
    canvas.height = gridSize * CEL + pad * 2;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ruitjes — y-as omhoog in logica, omgekeerd in canvas
    ctx.strokeStyle = '#b8d4e8'; ctx.lineWidth = 0.5;
    for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath(); ctx.moveTo(pad + i*CEL, pad); ctx.lineTo(pad + i*CEL, pad + gridSize*CEL); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pad, pad + i*CEL); ctx.lineTo(pad + gridSize*CEL, pad + i*CEL); ctx.stroke();
    }

    // y omhoog: canvasY = pad + (gridSize - y) * CEL
    const cx = x => pad + x * CEL;
    const cy = y => pad + (gridSize - y) * CEL;

    // Startpunt
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(cx(startX), cy(startY), 3, 0, Math.PI*2); ctx.fill();

    // Figuur tekenen (pts = array van [x,y] of null)
    if (pts && pts.length > 1) {
        ctx.strokeStyle = '#1a56db'; ctx.lineWidth = 1.8;
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        ctx.beginPath();
        let penNeer = false;
        pts.forEach(p => {
            if (p === null) { penNeer = false; return; }
            if (!penNeer) { ctx.moveTo(cx(p[0]), cy(p[1])); penNeer = true; }
            else          { ctx.lineTo(cx(p[0]), cy(p[1])); }
        });
        ctx.stroke();
    }
}

// ─────────────────────────────────────────────
// OPLOSSINGEN TONEN / VERBERGEN
// ─────────────────────────────────────────────
let oplossingen_zichtbaar = false;

function toggleOplossingen() {
    oplossingen_zichtbaar = !oplossingen_zichtbaar;
    const werkblad = document.getElementById('werkblad');
    const btn = document.getElementById('oplossingen-btn');
    const downloadBtn = document.getElementById('download-opl-btn');

    if (oplossingen_zichtbaar) {
        werkblad.classList.add('toon-oplossingen');
        btn.textContent = '🙈 Verberg oplossingen';
        btn.classList.add('actief');
        downloadBtn.classList.remove('hidden');
    } else {
        werkblad.classList.remove('toon-oplossingen');
        btn.textContent = '👁 Toon oplossingen';
        btn.classList.remove('actief');
        downloadBtn.classList.add('hidden');
    }
}

// ─────────────────────────────────────────────
// PDF EXPORT
// ─────────────────────────────────────────────
function toonPdfLoading() {
    const el = document.getElementById('pdf-loading');
    if (el) el.classList.remove('hidden');
}

function verbergPdfLoading() {
    const el = document.getElementById('pdf-loading');
    if (el) el.classList.add('hidden');
}

async function downloadAlsPdf(metOplossingen) {
    try {
        toonPdfLoading();
        // Zorg dat oplossingen zichtbaar zijn als gewenst
        const werkblad = document.getElementById('werkblad');
        const hadOplossingen = werkblad.classList.contains('toon-oplossingen');
        if (metOplossingen) werkblad.classList.add('toon-oplossingen');
        await pdfEngine.generate(metOplossingen);
        // Herstel de staat
        if (metOplossingen && !hadOplossingen) werkblad.classList.remove('toon-oplossingen');
    } catch (error) {
        console.error('Fout bij PDF-generatie:', error);
        alert('Er liep iets mis bij het maken van de PDF.');
    } finally {
        verbergPdfLoading();
    }
}

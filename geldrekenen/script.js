function toggleKortingOpties() {
    const type = document.getElementById('type-winkel').value;
    document.getElementById('korting-opties').style.display = type === 'winkel_korting' ? 'block' : 'none';
}

let activeTab = 'vaardigheden';

// Toon melding als instellingen veranderen na generatie
function checkInstellingenWijziging() {
    const heeftSecties = document.getElementById('secties-container')?.children.length > 0;
    if (heeftSecties) {
        const banner = document.getElementById('instellingen-banner');
        if (banner) {
            banner.style.display = 'block';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    ['checkCenten', 'checkKleineCenten', 'maxBedrag'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', checkInstellingenWijziging);
    });
});
const moneyConfig = [
    { value: 500, img: '500euro.png', scale: 1.5 }, { value: 200, img: '200euro.png', scale: 1.45 },
    { value: 100, img: '100euro.png', scale: 1.4 }, { value: 50, img: '50euro.png', scale: 1.3 },
    { value: 20, img: '20euro.png', scale: 1.2 }, { value: 10, img: '10euro.png', scale: 1.1 },
    { value: 5, img: '5euro.png', scale: 1.0 }, { value: 2, img: '2euro.png', scale: 0.65 },
    { value: 1, img: '1euro.png', scale: 0.6 }, { value: 0.50, img: '50cent.png', scale: 0.58 },
    { value: 0.20, img: '20cent.png', scale: 0.52 }, { value: 0.10, img: '10cent.png', scale: 0.48 },
    { value: 0.05, img: '5cent.png', scale: 0.45 }, { value: 0.02, img: '2cent.png', scale: 0.42 },
    { value: 0.01, img: '1cent.png', scale: 0.38 }
];

const winkelData = {
    supermarkt: [
        { naam: "Zak appelen",  basisPrijs: 2.50, img: "appelen.png",     scale: 1.2,  submap: "supermarkt" }, 
        { naam: "Eieren",       basisPrijs: 3.20, img: "eieren.png",       scale: 1.3,  submap: "supermarkt", moveY: 8 },
        { naam: "Melk",         basisPrijs: 1.45, img: "melk.png",         scale: 1.1,  submap: "supermarkt" }, 
        { naam: "Pasta",        basisPrijs: 0.95, img: "pasta.png",        scale: 1.0,  submap: "supermarkt" }, 
        { naam: "Pot saus",     basisPrijs: 1.80, img: "potsaus.png",      scale: 0.9,  submap: "supermarkt" }, 
        { naam: "Bananen",      basisPrijs: 1.10, img: "trosbananen.png",  scale: 0.9,  submap: "supermarkt" }, 
        { naam: "Keukenrol",    basisPrijs: 3.00, img: "keukenrol.png",    scale: 1.2,  submap: "supermarkt" },
        { naam: "Afwasmiddel",  basisPrijs: 2.00, img: "afwasmiddel.png",  scale: 1.2,  submap: "supermarkt" },
        { naam: "Choco",        basisPrijs: 2.80, img: "choco.png",        scale: 1.2,  submap: "supermarkt" },
        { naam: "Koekjes",      basisPrijs: 1.50, img: "koekjes.png",      scale: 0.9,  submap: "supermarkt" },
        { naam: "Sap",          basisPrijs: 2.10, img: "sap.png",          scale: 1.0,  submap: "supermarkt" },
        { naam: "Kaas",         basisPrijs: 4.20, img: "kaas.png",         scale: 1.1,  submap: "supermarkt" }
    ],
    bakker: [
        { naam: "Aardbeientaart", basisPrijs: 8.50, img: "aardbeientaart.png", scale: 1.1, submap: "bakker", moveY: 0 },
        { naam: "Bruinbrood",     basisPrijs: 2.80, img: "bruinbrood.png",      scale: 1.1, submap: "bakker", moveY: 0 },
        { naam: "Chocoladetaart", basisPrijs: 9.00, img: "chocoladetaart.png",  scale: 1.1, submap: "bakker", moveY: 0 },
        { naam: "Croissant",      basisPrijs: 1.20, img: "croissant.png",       scale: 1.0, submap: "bakker", moveY: 0 },
        { naam: "Donut",          basisPrijs: 1.50, img: "donut.png",           scale: 0.9, submap: "bakker", moveY: 0 },
        { naam: "Koekjes",        basisPrijs: 2.50, img: "koekjes.png",         scale: 0.9, submap: "bakker", moveY: 0 },
        { naam: "Koffiekoek",     basisPrijs: 1.30, img: "koffiekoek.png",      scale: 0.9, submap: "bakker", moveY: 0 },
        { naam: "Pistolet",       basisPrijs: 0.60, img: "pistolet.png",        scale: 0.9, submap: "bakker", moveY: 0 },
        { naam: "Pralines",       basisPrijs: 6.00, img: "pralines.png",        scale: 1.0, submap: "bakker", moveY: 0 },
        { naam: "Soes",           basisPrijs: 1.80, img: "soes.png",            scale: 0.9, submap: "bakker", moveY: 0 },
        { naam: "Stokbrood",      basisPrijs: 1.50, img: "stokbrood.png",       scale: 1.2, submap: "bakker", moveY: 0 },
        { naam: "Witbrood",       basisPrijs: 2.60, img: "witbrood.png",        scale: 1.1, submap: "bakker", moveY: 0 }
    ],
    speelgoed: [
        { naam: "Camera",         basisPrijs: 8.00,  img: "camera.png",         scale: 1.0, moveY: 0, submap: "speelgoed" },
        { naam: "Gezelschapsspel", basisPrijs: 9.50,  img: "gezelschapsspel.png", scale: 1.1, moveY: 0, submap: "speelgoed" },
        { naam: "K'nex",          basisPrijs: 10.00, img: "knex.png",            scale: 1.1, moveY: 0, submap: "speelgoed" },
        { naam: "Knuffel",        basisPrijs: 6.50,  img: "knuffel.png",         scale: 1.0, moveY: 0, submap: "speelgoed" },
        { naam: "Lego",           basisPrijs: 12.00, img: "lego.png",            scale: 1.1, moveY: 0, submap: "speelgoed" },
        { naam: "Pop",            basisPrijs: 7.00,  img: "pop.png",             scale: 1.0, moveY: 0, submap: "speelgoed" },
        { naam: "Robot",          basisPrijs: 11.00, img: "robot.png",           scale: 1.0, moveY: 0, submap: "speelgoed" },
        { naam: "Skates",         basisPrijs: 14.00, img: "skates.png",          scale: 1.1, moveY: 0, submap: "speelgoed" },
        { naam: "Springtouw",     basisPrijs: 3.50,  img: "springtouw.png",      scale: 1.0, moveY: 0, submap: "speelgoed" },
        { naam: "Step",           basisPrijs: 13.00, img: "step.png",            scale: 1.1, moveY: 0, submap: "speelgoed" },
        { naam: "Strip",          basisPrijs: 4.50,  img: "strip.png",           scale: 1.0, moveY: 0, submap: "speelgoed" },
        { naam: "Voetbal",        basisPrijs: 8.50,  img: "voetbal.png",         scale: 1.0, moveY: 0, submap: "speelgoed" }
    ],
    snoepwinkel: [],
    elektronica: [
        { naam: "Gsm",           basisPrijs: 250, img: "gsm.png",           scale: 1.0, moveY: 0, submap: "elektronica" },
        { naam: "Tablet",        basisPrijs: 200, img: "tablet.png",        scale: 1.1, moveY: 0, submap: "elektronica" },
        { naam: "Laptop",        basisPrijs: 400, img: "laptop.png",        scale: 1.1, moveY: 0, submap: "elektronica" },
        { naam: "Koptelefoon",   basisPrijs: 60,  img: "koptelefoon.png",   scale: 1.0, moveY: 0, submap: "elektronica" },
        { naam: "Oortjes",       basisPrijs: 50,  img: "oortjes.png",       scale: 0.9, moveY: 0, submap: "elektronica" },
        { naam: "Spelconsole",   basisPrijs: 300, img: "spelconsole.png",   scale: 1.1, moveY: 0, submap: "elektronica" },
        { naam: "Controller",    basisPrijs: 55,  img: "controller.png",    scale: 1.0, moveY: 0, submap: "elektronica" },
        { naam: "Camera",        basisPrijs: 150, img: "camera.png",        scale: 1.0, moveY: 0, submap: "elektronica" },
        { naam: "Smartwatch",    basisPrijs: 120, img: "smartwatch.png",    scale: 0.9, moveY: 0, submap: "elektronica" },
        { naam: "Luidspreker",   basisPrijs: 80,  img: "luidspreker.png",   scale: 1.0, moveY: 0, submap: "elektronica" },
        { naam: "Televisie",     basisPrijs: 350, img: "televisie.png",     scale: 1.2, moveY: 0, submap: "elektronica" },
        { naam: "Toetsenbord",   basisPrijs: 45,  img: "toetsenbord.png",   scale: 1.0, moveY: 0, submap: "elektronica" }
    ],
    schoolwinkel: [
        { naam: "Potlood",       basisPrijs: 0.50, img: "potlood.png",       scale: 0.9, moveY: 0, submap: "schoolwinkel" },
        { naam: "Gum",           basisPrijs: 0.75, img: "gum.png",           scale: 0.9, moveY: 0, submap: "schoolwinkel" },
        { naam: "Schaar",        basisPrijs: 2.50, img: "schaar.png",        scale: 1.0, moveY: 0, submap: "schoolwinkel" },
        { naam: "Liniaal",       basisPrijs: 1.00, img: "liniaal.png",       scale: 1.0, moveY: 0, submap: "schoolwinkel" },
        { naam: "Passer",        basisPrijs: 3.50, img: "passer.png",        scale: 1.0, moveY: 0, submap: "schoolwinkel" },
        { naam: "Kleurpotloden", basisPrijs: 4.50, img: "kleurpotloden.png", scale: 1.1, moveY: 0, submap: "schoolwinkel" },
        { naam: "Schilderset",   basisPrijs: 5.50, img: "schilderset.png",   scale: 1.1, moveY: 0, submap: "schoolwinkel" },
        { naam: "Schrift",       basisPrijs: 2.00, img: "schrift.png",       scale: 1.0, moveY: 0, submap: "schoolwinkel" },
        { naam: "Map",           basisPrijs: 1.50, img: "map.png",           scale: 1.0, moveY: 0, submap: "schoolwinkel" },
        { naam: "Etui",          basisPrijs: 6.00, img: "etui.png",          scale: 1.0, moveY: 0, submap: "schoolwinkel" },
        { naam: "Stiften",       basisPrijs: 3.00, img: "stiften.png",       scale: 1.0, moveY: 0, submap: "schoolwinkel" },
        { naam: "Plakband",      basisPrijs: 1.25, img: "plakband.png",      scale: 0.9, moveY: 0, submap: "schoolwinkel" }
    ],
    kledingwinkel: [
        { naam: "T-shirt",       basisPrijs: 12,  img: "tshirt.png",        scale: 1.0, moveY: 0, submap: "kledingwinkel" },
        { naam: "Broek",         basisPrijs: 25,  img: "broek.png",         scale: 1.0, moveY: 0, submap: "kledingwinkel" },
        { naam: "Trui",          basisPrijs: 30,  img: "trui.png",          scale: 1.0, moveY: 0, submap: "kledingwinkel" },
        { naam: "Jas",           basisPrijs: 60,  img: "jas.png",           scale: 1.1, moveY: 0, submap: "kledingwinkel" },
        { naam: "Schoenen",      basisPrijs: 45,  img: "schoenen.png",      scale: 1.0, moveY: 0, submap: "kledingwinkel" },
        { naam: "Pet",           basisPrijs: 15,  img: "pet.png",           scale: 0.9, moveY: 0, submap: "kledingwinkel" },
        { naam: "Sjaal",         basisPrijs: 10,  img: "sjaal.png",         scale: 0.9, moveY: 0, submap: "kledingwinkel" },
        { naam: "Handschoenen",  basisPrijs: 12,  img: "handschoenen.png",  scale: 1.0, moveY: 0, submap: "kledingwinkel" },
        { naam: "Rok",           basisPrijs: 20,  img: "rok.png",           scale: 1.0, moveY: 0, submap: "kledingwinkel" },
        { naam: "Zwembroek",     basisPrijs: 14,  img: "zwembroek.png",     scale: 0.9, moveY: 0, submap: "kledingwinkel" },
        { naam: "Laarzen",       basisPrijs: 50,  img: "laarzen.png",       scale: 1.1, moveY: 0, submap: "kledingwinkel" },
        { naam: "Pyjama",        basisPrijs: 18,  img: "pyjama.png",        scale: 1.0, moveY: 0, submap: "kledingwinkel" }
    ]
};

// Schaalt prijzen zodat elk individueel product strikt < max is,
// én de 2 goedkoopste producten samen altijd ≤ max zijn.
function getGeschaaldePrijzen(winkelLijst, max, centen) {
    if (!winkelLijst || winkelLijst.length === 0) return [];

    const basisPrijzen = winkelLijst.map(i => i.basisPrijs);
    const basisMax = Math.max(...basisPrijzen);
    const basisMin = Math.min(...basisPrijzen);
    const basisMin2 = [...basisPrijzen].sort((a,b) => a-b)[1] || basisMin; // op-één-na-goedkoopste

    // Duurste product mag maximaal 60% van max kosten,
    // zodat er altijd ruimte is voor minstens één ander product.
    const doelMax = max * 0.60;
    // De 2 goedkoopste moeten samen ≤ max zijn:
    // factor × (basisMin + basisMin2) ≤ max → factor ≤ max / (basisMin + basisMin2)
    const maxFactorCombi = basisMin + basisMin2 > 0 ? max / (basisMin + basisMin2) : Infinity;
    // Kies de kleinste van beide beperkingen
    const factor = Math.min(
        basisMax > 0 ? doelMax / basisMax : 1,
        maxFactorCombi
    );

    const doelMin = Math.max(max * 0.06, centen ? 0.20 : 1);

    return winkelLijst.map(item => {
        let prijs = Math.max(item.basisPrijs * factor, doelMin);
        // Afronden
        if (!centen) prijs = Math.max(1, Math.round(prijs));
        else prijs = Math.max(0.20, Math.round(prijs * 20) / 20);
        // Harde cap: nooit ≥ max (zodat er altijd iets bij kan)
        prijs = Math.min(prijs, max - (centen ? 0.20 : 1));
        return { ...item, prijs };
    });
}

// Geeft een bedrag terug dat minstens 2 producten van de winkel kan dekken, altijd ≤ max
function getKiezenBedrag(winkelLijst, max, centen, klein) {
    const geschaald = getGeschaaldePrijzen(winkelLijst, max, centen);
    // Houd alleen producten die goedkoper zijn dan max
    const betaalbaar = geschaald.filter(p => p.prijs < max);
    if (betaalbaar.length < 2) {
        // Fallback: gewoon max
        return max;
    }
    const gesorteerd = [...betaalbaar].sort((a, b) => a.prijs - b.prijs);
    const ondergrens = gesorteerd[0].prijs + gesorteerd[1].prijs;
    // Bovengrens: som van 4 goedkoopste, maar nooit meer dan max
    const bovengrens = Math.min(max, gesorteerd.slice(0, 4).reduce((s, p) => s + p.prijs, 0));
    // Als de 2 goedkoopste al meer kosten dan max, gebruik gewoon max
    if (ondergrens >= max) return max;
    let bedrag = ondergrens + Math.random() * (bovengrens - ondergrens);
    if (!centen) bedrag = Math.round(bedrag);
    else if (!klein) bedrag = Math.round(bedrag * 20) / 20;
    else bedrag = Math.round(bedrag * 100) / 100;
    // Altijd strikt ≤ max
    return Math.min(bedrag, max);
}

let gebruikteBedragen = new Set();

function switchTab(tabId) {
    activeTab = tabId;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.querySelector(`.tab-btn[onclick="switchTab('${tabId}')"]`).classList.add('active');
    document.getElementById(`tab-${tabId}`).classList.add('active');
}

document.getElementById('addSectieBtn').addEventListener('click', () => {
    const container = document.getElementById('secties-container');
    const type = activeTab === 'vaardigheden' ? document.getElementById('type-vaardigheden').value : document.getElementById('type-winkel').value;
    const aantal = parseInt(document.getElementById('aantalOefeningen').value);
    const centen = document.getElementById('checkCenten').checked;
    const winkelType = document.getElementById('winkelSelect').value;
    const max = parseFloat(document.getElementById('maxBedrag').value);
    const kortingSubtype = document.getElementById('kortingSubtype')?.value || 'korting_nieuw';
    const kortingPercentages = [...document.querySelectorAll('.kortingPercentCheck:checked')].map(el => parseInt(el.value));
    const kortingPercent = kortingPercentages.length ? kortingPercentages[0] : 10; // voor de titel
    
    let titel = "Oefening: Tel het geld.";
    if(type === 'twee_manieren') titel = "Oefening: Leg het bedrag op 2 verschillende manieren.";
    if(type === 'weinig_mogelijk') titel = "Oefening: Betaal met zo weinig mogelijk munten en briefjes.";
    if(type === 'gepast_betalen') titel = "Oefening: Leg het juiste bedrag klaar.";
    if(type.startsWith('winkel')) {
        const winkelNaam = document.getElementById('winkelSelect').options[document.getElementById('winkelSelect').selectedIndex].text;
        titel = `Winkeltje: ${winkelNaam}`;
        if(type === 'winkel_korting') {
            const pctTekst = kortingPercentages.length > 1 ? kortingPercentages.join('/') + '%' : kortingPercent + '%';
            titel = `Solden: ${pctTekst} korting — ${winkelNaam}`;
        }
    }

    const sectie = document.createElement('div');
    sectie.className = "oefening-sectie";
    sectie.dataset.type = type;
    sectie.dataset.winkel = winkelType;
    sectie.dataset.kortingSubtype = kortingSubtype;
    sectie.dataset.kortingPercent = kortingPercent;
    sectie.dataset.kortingPercentages = JSON.stringify(kortingPercentages.length ? kortingPercentages : [10]);

    let html = `<span contenteditable="true" class="sectie-titel">${titel}</span>`;
    
    if (activeTab === 'winkel') {
        const geenPoster = (type === 'winkel_terug' || type === 'winkel_vergelijk' || type === 'winkel_korting');
        if (!geenPoster) {
            const producten = getGeschaaldePrijzen(winkelData[winkelType], max, centen);
            const rij1 = producten.slice(0, 6);
            const rij2 = producten.slice(6, 12);
            const metNummers = (type === 'winkel_kiezen' || type === 'winkel_exact');

            html += `<div class="winkel-poster ${winkelType}-stijl">
                <div class="plank-rij">
                    ${rij1.map((i, idx) => genereerPosterItemHtml(i, centen, metNummers ? idx + 1 : null)).join('')}
                </div>
                <div class="plank-rij">
                    ${rij2.map((i, idx) => genereerPosterItemHtml(i, centen, metNummers ? idx + 7 : null)).join('')}
                </div>
            </div>`;
        }
    }

    html += `<div class="kaders-grid"></div>
         <div class="sectie-controls no-print">
            <button class="btn-plus" onclick="voegKadersToeManual(this.parentElement.parentElement, 1)">+ Oefening</button>
            <button class="btn-del-sectie" onclick="verwijderSectie(this)">🗑 Verwijder hele oefening</button>
         </div>`;
    
    sectie.innerHTML = html;
    container.appendChild(sectie);
    for(let i=0; i<aantal; i++) voegKaderToe(sectie);
});

/* moveY wordt hier toegepast via translateY */
function genereerPosterItemHtml(item, centen, nummer) {
    const scale = item.scale || 1.0;
    const moveY = item.moveY || 0;
    const nummerHtml = nummer ? `<div class="poster-nummer">${nummer}</div>` : '';
    return `
        <div class="poster-item" onclick="toonAanpasPanel(this)" title="Klik om grootte/positie aan te passen">
            ${nummerHtml}
            <img src="assets/producten/${item.submap || 'supermarkt'}/${item.img}" 
                 class="poster-img" 
                 data-scale="${scale}"
                 data-movey="${moveY}"
                 style="transform: scale(${scale}) translateY(${moveY}px); transform-origin: bottom center;"
                 onerror="this.src='assets/producten/${item.img}'">
            <div class="prijskaartje">€ ${item.prijs.toFixed(centen ? 2 : 0).replace('.',',')}</div>
        </div>`;
}

function toonAanpasPanel(posterItem) {
    // Verwijder bestaand paneel
    document.querySelectorAll('.aanpas-panel').forEach(p => p.remove());
    const img = posterItem.querySelector('.poster-img');
    if (!img) return;

    let scale = parseFloat(img.dataset.scale) || 1.0;
    let moveY = parseFloat(img.dataset.movey) || 0;

    const panel = document.createElement('div');
    panel.className = 'aanpas-panel no-print';
    panel.innerHTML = `
        <div class="aanpas-rij">
            <span>🔍</span>
            <input type="range" min="0.4" max="2.0" step="0.05" value="${scale}" 
                   oninput="pasAan(this, 'scale')">
            <span class="aanpas-waarde">${scale.toFixed(2)}</span>
        </div>
        <div class="aanpas-rij">
            <span>↕️</span>
            <input type="range" min="-30" max="30" step="1" value="${moveY}"
                   oninput="pasAan(this, 'movey')">
            <span class="aanpas-waarde">${moveY}px</span>
        </div>
        <button onclick="this.closest('.aanpas-panel').remove()" class="aanpas-sluit">✕</button>
    `;
    panel._img = img;
    posterItem.appendChild(panel);

    // Sluit paneel bij klik buiten
    setTimeout(() => {
        document.addEventListener('click', function sluit(e) {
            if (!panel.contains(e.target) && e.target !== posterItem && !posterItem.contains(e.target)) {
                panel.remove();
                document.removeEventListener('click', sluit);
            }
        });
    }, 100);
}

function pasAan(slider, type) {
    const panel = slider.closest('.aanpas-panel');
    const img = panel._img;
    const waarde = parseFloat(slider.value);
    slider.nextElementSibling.textContent = type === 'scale' ? waarde.toFixed(2) : waarde + 'px';
    if (type === 'scale') img.dataset.scale = waarde;
    else img.dataset.movey = waarde;
    const s = parseFloat(img.dataset.scale) || 1.0;
    const m = parseFloat(img.dataset.movey) || 0;
    img.style.transform = `scale(${s}) translateY(${m}px)`;
}

function voegKadersToeManual(node, n) { for(let i=0; i<n; i++) voegKaderToe(node); }

function verwijderSectie(knop) {
    const sectie = knop.closest('.oefening-sectie');
    if (sectie) sectie.remove();
}

function getUniekBedrag(max, centen, klein) {
    let bedrag;
    let pogingen = 0;
    do {
        bedrag = (centen && max <= 1) ? (Math.random() * (max - 0.05) + 0.05) : (Math.random() * (max - 1) + 1);
        if (!centen) bedrag = Math.floor(bedrag);
        else if (!klein) bedrag = Math.round(bedrag * 20) / 20;
        else bedrag = Math.round(bedrag * 100) / 100;
        pogingen++;
    } while (gebruikteBedragen.has(bedrag) && pogingen < 100);
    gebruikteBedragen.add(bedrag);
    return bedrag;
}

function voegKaderToe(sectieNode) {
    const grid = sectieNode.querySelector('.kaders-grid');
    const type = sectieNode.dataset.type;
    const winkelType = sectieNode.dataset.winkel || 'supermarkt';
    const winkelLijst = winkelData[winkelType] && winkelData[winkelType].length ? winkelData[winkelType] : winkelData.supermarkt;
    const kortingSubtype = sectieNode.dataset.kortingSubtype || 'korting_nieuw';
    const kortingPercentages = JSON.parse(sectieNode.dataset.kortingPercentages || '[10]');
    const kortingPercent = kortingPercentages[Math.floor(Math.random() * kortingPercentages.length)];
    const max = parseFloat(document.getElementById('maxBedrag').value);
    const centen = document.getElementById('checkCenten').checked;
    const klein = document.getElementById('checkKleineCenten').checked;
    const nItems = parseInt(document.getElementById('aantalItems').value);
    const metSchatten = document.getElementById('checkSchatten').checked;

    // Bijhouden welke producten al gebruikt zijn binnen deze sectie
    if (!sectieNode._gebruikteProducten) sectieNode._gebruikteProducten = new Set();
    const gebruikteProducten = sectieNode._gebruikteProducten;

    const kader = document.createElement('div');
    kader.className = "oefening-kader";
    let html = `<button class="btn-x-kader no-print" onclick="this.parentElement.remove()">X</button>`;

    // Schatting-rij voor tabel-gebaseerde oefeningen
    const schattingRijTabel = metSchatten
        ? `<div class="korting-schatting-rij">Ik schat: <span class="korting-schatting-lijn"></span></div>`
        : '';

    if (type === 'winkel_terug') {
        // Zoek betaalbiljet (≤ max, ≥ 2) en producten waarvan totaal < biljet
        const kandidaten = moneyConfig.filter(u =>
            u.value <= max && u.value >= 2 &&
            (centen || u.value >= 1) && (klein || u.value >= 0.05)
        );
        let items, totaal, betaalMunt, gevonden = false;
        for (let poging = 0; poging < 40 && !gevonden; poging++) {
            const biljetPool = kandidaten.filter(u => u.value >= 2);
            if (!biljetPool.length) break;
            betaalMunt = biljetPool[Math.floor(Math.random() * biljetPool.length)];
            const geschaald = getGeschaaldePrijzen(winkelLijst, max, centen);
            // Kies items waarvan som < betaalbiljet én ≤ max
            const geshuffled = [...geschaald].sort(() => 0.5 - Math.random());
            let kandidaatItems = [];
            for (const p of geshuffled) {
                const nieuwTotaal = Math.round((kandidaatItems.reduce((a,b) => a+b.prijs,0) + p.prijs) * 100) / 100;
                if (nieuwTotaal < betaalMunt.value && nieuwTotaal <= max) {
                    kandidaatItems.push(p);
                    if (kandidaatItems.length >= nItems) break;
                }
            }
            const kTotaal = Math.round(kandidaatItems.reduce((a, b) => a + b.prijs, 0) * 100) / 100;
            if (kandidaatItems.length > 0 && kTotaal < betaalMunt.value && kTotaal > 0) {
                items = kandidaatItems; totaal = kTotaal; gevonden = true;
            }
        }
        if (!gevonden) {
            betaalMunt = kandidaten[kandidaten.length - 1] || moneyConfig.find(u => u.value === 10) || moneyConfig[6];
            const geschaald = getGeschaaldePrijzen(winkelLijst, max, centen);
            const geshuffled = [...geschaald].sort(() => 0.5 - Math.random());
            items = [];
            for (const p of geshuffled) {
                const nieuwTotaal = Math.round((items.reduce((a,b) => a+b.prijs,0) + p.prijs) * 100) / 100;
                if (nieuwTotaal <= max) { items.push(p); if (items.length >= nItems) break; }
            }
            if (items.length === 0) items = [geshuffled[0]];
            totaal = Math.min(Math.round(items.reduce((a, b) => a + b.prijs, 0) * 100) / 100, max);
        }
        const wisselgeld = Math.round((betaalMunt.value - totaal) * 100) / 100;
        const prijsStr = (p) => `€ ${p.toFixed(centen ? 2 : 0).replace('.', ',')}`;

        html += `${schattingRijTabel}<div class="oefening-kader-terug">
                    <table class="terug-tabel">
                        <thead>
                            <tr>
                                <th>Ik koop …</th>
                                <th>Hoeveel kost het samen?</th>
                                <th>Ik betaal met …</th>
                                <th>Ik krijg … € terug.</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="terug-td-mandje">
                                    <div class="mandje-grid">
                                        ${items.map(i => {
                                            const s = i.scale || 1.0, my = i.moveY || 0;
                                            return `<div class="mandje-item-terug">
                                                <img src="assets/producten/${i.submap || 'supermarkt'}/${i.img}" class="product-img-mandje" style="transform: scale(${s}) translateY(${my}px);" onerror="this.src='assets/producten/' + (this.dataset.submap||'supermarkt') + '/${i.img}'">
                                                <span class="mandje-prijs-tag">${prijsStr(i.prijs)}</span>
                                            </div>`;
                                        }).join('')}
                                    </div>
                                </td>
                                <td class="terug-td-samen">
                                    <div class="terug-tabel-bew-lijn"></div>
                                    <div class="terug-tabel-bew-lijn terug-tabel-bew-lijn2"></div>
                                    <div class="terug-samen-tekst">Het kost samen</div>
                                    <div class="terug-invul-rij">€ <div class="terug-invul-lijn"></div></div>
                                </td>
                                <td class="terug-td-betaal">
                                    <img src="assets/${betaalMunt.img}" class="betaal-biljet-img" style="--scale: ${betaalMunt.scale}">
                                </td>
                                <td class="terug-td-terug">
                                    <div class="terug-tabel-terug-lijn"></div>
                                    <div class="terug-tabel-terug-lijn terug-tabel-terug-lijn2"></div>
                                    <div class="terug-antwoord-rij">
                                        <span>Ik krijg €</span>
                                        <div class="terug-invul-lijn kort"></div>
                                        <span>terug.</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                 </div>`;

    } else if (type === 'winkel_kiezen') {
        // Opdracht 3: gegeven geldbedrag dat minstens 2 producten dekt
        const bedrag = getKiezenBedrag(winkelLijst, max, centen, klein);
        const bedragStr = `€ ${bedrag.toFixed(centen ? 2 : 0).replace('.', ',')}`;
        html += `${schattingRijTabel}<table class="kiezen-tabel">
                    <thead>
                        <tr>
                            <th>Ik heb …</th>
                            <th>Ik koop (noteer nummers)</th>
                            <th>Bewerking</th>
                            <th>Ik houd over: € …</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="kiezen-td-geld">
                                <div class="geld-vak kiezen-geld-vak">${genereerGeldSimpel(bedrag, centen, klein)}</div>
                                <div class="kiezen-ik-tel-rij">Ik tel: € <div class="kiezen-invul-lijn breed"></div></div>
                            </td>
                            <td class="kiezen-td-nummers">
                                <div class="kiezen-nummers-vak">
                                    <div class="kiezen-invul-lijn"></div>
                                    <div class="kiezen-invul-lijn"></div>
                                    <div class="kiezen-invul-lijn"></div>
                                </div>
                            </td>
                            <td class="kiezen-td-bew">
                                <div class="kiezen-invul-lijn"></div>
                                <div class="kiezen-invul-lijn"></div>
                                <div class="kiezen-invul-lijn"></div>
                            </td>
                            <td class="kiezen-td-over">
                                <div class="kiezen-over-tekst">Ik houd</div>
                                <div class="kiezen-over-rij">€ <div class="kiezen-invul-lijn breed"></div></div>
                                <div class="kiezen-over-tekst">over.</div>
                            </td>
                        </tr>
                    </tbody>
                 </table>`;

    } else if (type === 'winkel_exact') {
        const geschaald = getGeschaaldePrijzen(winkelLijst, max, centen);

        // Varieer prijzen licht (±10-20%) zodat elk kader andere bedragen toont
        function varieerPrijs(prijs, centen) {
            const delta = centen
                ? Math.round((Math.random() * 0.3 - 0.15) * prijs * 20) / 20
                : Math.round((Math.random() * 0.3 - 0.15) * prijs);
            let nieuw = prijs + delta;
            if (!centen) nieuw = Math.max(1, Math.round(nieuw));
            else nieuw = Math.max(0.20, Math.round(nieuw * 20) / 20);
            return nieuw;
        }

        // Probeer max 20 keer een uniek totaalbedrag te genereren
        let gekozen = [], exactBedrag;
        let pogingen = 0;
        do {
            // Varieer de prijzen licht voor elk poging
            const gevarieerd = geschaald.map(p => ({
                ...p,
                prijs: varieerPrijs(p.prijs, centen)
            }));
            const betaalbaar = gevarieerd.filter(p => p.prijs <= max);
            const geshuffled = [...betaalbaar].sort(() => 0.5 - Math.random());

            let kandidaat = [];
            for (const p of geshuffled) {
                const huidigTotaal = kandidaat.reduce((a, b) => a + b.prijs, 0);
                const nieuwTotaal = Math.round((huidigTotaal + p.prijs) * 100) / 100;
                if (nieuwTotaal <= max) {
                    kandidaat.push(p);
                    if (kandidaat.length >= 3) break;
                }
            }
            if (kandidaat.length === 0) {
                const goedkoopste = [...betaalbaar].sort((a, b) => a.prijs - b.prijs);
                kandidaat = goedkoopste.length ? [goedkoopste[0]] : [gevarieerd[0]];
            }

            exactBedrag = Math.min(
                Math.round(kandidaat.reduce((a, b) => a + b.prijs, 0) * 100) / 100,
                max
            );
            // Accepteer als bedrag nog niet gebruikt is
            if (!gebruikteBedragen.has(exactBedrag)) {
                gekozen = kandidaat;
                gebruikteBedragen.add(exactBedrag);
                break;
            }
            pogingen++;
        } while (pogingen < 20);

        // Fallback als na 20 pogingen nog geen uniek bedrag
        if (gekozen.length === 0) {
            const betaalbaar = geschaald.filter(p => p.prijs <= max);
            const geshuffled = [...betaalbaar].sort(() => 0.5 - Math.random());
            for (const p of geshuffled) {
                const huidigTotaal = gekozen.reduce((a, b) => a + b.prijs, 0);
                if (Math.round((huidigTotaal + p.prijs) * 100) / 100 <= max) {
                    gekozen.push(p);
                    if (gekozen.length >= 2) break;
                }
            }
            exactBedrag = Math.min(
                Math.round(gekozen.reduce((a, b) => a + b.prijs, 0) * 100) / 100,
                max
            );
        }
        const exactStr = `€ ${exactBedrag.toFixed(centen ? 2 : 0).replace('.', ',')}`;
        const uid = 'exact_' + Math.random().toString(36).slice(2, 7);
        html += `${schattingRijTabel}<div class="exact-hint no-print">✏️ Klik op het bedrag om het aan te passen</div>
                 <table class="exact-tabel">
                    <thead>
                        <tr>
                            <th>Ik wil juist …<br><span class="exact-bedrag-header" id="${uid}_header">${exactStr}</span><br>uitgeven.</th>
                            <th>Ik koop (noteer nummers)</th>
                            <th>Bewerking</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="exact-td-bedrag">
                                <div class="exact-bedrag-groot" contenteditable="true" spellcheck="false"
                                     oninput="document.getElementById('${uid}_header').textContent = this.textContent">${exactStr}</div>
                            </td>
                            <td class="exact-td-nummers">
                                <div class="kiezen-nummers-vak">
                                    <div class="kiezen-invul-lijn"></div>
                                    <div class="kiezen-invul-lijn"></div>
                                </div>
                            </td>
                            <td class="exact-td-bew">
                                <div class="kiezen-invul-lijn"></div>
                                <div class="kiezen-invul-lijn"></div>
                            </td>
                        </tr>
                    </tbody>
                 </table>`;

    } else if (type === 'winkel_korting') {
        const geschaald = getGeschaaldePrijzen(winkelLijst, max, centen);

        // Pas prijzen aan zodat kortingsbedrag altijd netjes uitkomt voor dit percentage
        // Rond de prijs op naar het dichtstbijzijnde veelvoud van (100/kortingPercent)
        const veelvoud = 100 / kortingPercent; // bij 10% → veelvoud van 10
        const aangepast = geschaald.map(p => {
            let prijs;
            if (centen) {
                const stap = veelvoud * 0.05;
                prijs = Math.max(stap, Math.ceil(p.prijs / stap) * stap);
            } else {
                prijs = Math.max(veelvoud, Math.ceil(p.prijs / veelvoud) * veelvoud);
            }
            return { ...p, prijs: Math.round(prijs * 100) / 100 };
        });

        // Shuffle en kies producten die nog niet gebruikt zijn
        const geshuffled = [...aangepast].sort(() => 0.5 - Math.random());
        let product;
        // Probeer eerst ongebruikte producten
        product = geshuffled.find(p => !gebruikteProducten.has(p.img));
        // Als alles gebruikt is, begin opnieuw
        if (!product) {
            gebruikteProducten.clear();
            product = geshuffled[0];
        }
        gebruikteProducten.add(product.img);

        const origPrijs = product.prijs;
        const kortingBedrag = Math.round(origPrijs * kortingPercent) / 100;
        const nieuwPrijs = Math.round((origPrijs - kortingBedrag) * 100) / 100;

        const fmt = (p) => `€ ${p.toFixed(centen ? 2 : 0).replace('.', ',')}`;
        const s = product.scale || 1.0, my = product.moveY || 0;
        const submap = product.submap || 'supermarkt';
        const imgHtml = `<img src="assets/producten/${submap}/${product.img}" class="korting-product-img" style="transform:scale(${s}) translateY(${my}px);" onerror="this.style.display='none'">`;
        const kortingTag = kortingSubtype !== 'korting_hoeveel'
            ? `<div class="korting-tag">-${kortingPercent}%</div>`
            : '';

        // Schatting-rij bovenaan (alleen als schatten aangevinkt)
        const schattingRij = metSchatten
            ? `<div class="korting-schatting-rij no-print-hide">Ik schat: <span class="korting-schatting-lijn"></span></div>`
            : '';

        if (kortingSubtype === 'korting_nieuw') {
            html += `${schattingRij}<table class="korting-tabel">
                <thead><tr>
                    <th>Product</th>
                    <th>Originele prijs</th>
                    <th>Korting (${kortingPercent}%)</th>
                    <th>Bereken hoeveel je nog<br>moet betalen.</th>
                    <th>Antwoord</th>
                </tr></thead>
                <tbody><tr>
                    <td class="korting-td-product">${kortingTag}${imgHtml}<div class="korting-naam">${product.naam}</div></td>
                    <td class="korting-td-prijs"><div class="korting-orig-prijs">${fmt(origPrijs)}</div></td>
                    <td class="korting-td-percent"><div class="korting-percent-badge">${kortingPercent}%</div><div class="korting-pijl">↓</div></td>
                    <td class="korting-td-bew"><div class="korting-invul-lijn"></div><div class="korting-invul-lijn"></div></td>
                    <td class="korting-td-nieuw"><div class="korting-antwoord">€ <div class="korting-invul-lijn kort"></div></div></td>
                </tr></tbody>
            </table>`;
        } else if (kortingSubtype === 'korting_hoeveel') {
            html += `${schattingRij}<table class="korting-tabel">
                <thead><tr>
                    <th>Product</th>
                    <th>Originele prijs</th>
                    <th>Nieuwe prijs</th>
                    <th>Bereken hoeveel procent<br>korting je kreeg.</th>
                    <th>Antwoord</th>
                </tr></thead>
                <tbody><tr>
                    <td class="korting-td-product">${kortingTag}${imgHtml}<div class="korting-naam">${product.naam}</div></td>
                    <td class="korting-td-prijs"><div class="korting-gewone-prijs">${fmt(origPrijs)}</div></td>
                    <td class="korting-td-prijs"><div class="korting-nieuw-prijs">${fmt(nieuwPrijs)}</div></td>
                    <td class="korting-td-bew"><div class="korting-invul-lijn"></div><div class="korting-invul-lijn"></div></td>
                    <td class="korting-td-nieuw"><div class="korting-antwoord"><div class="korting-invul-lijn kort"></div> %</div></td>
                </tr></tbody>
            </table>`;
        } else {
            html += `${schattingRij}<table class="korting-tabel">
                <thead><tr>
                    <th>Product</th>
                    <th>Korting</th>
                    <th>Nieuwe prijs</th>
                    <th>Bereken de prijs<br>zonder de korting.</th>
                    <th>Antwoord</th>
                </tr></thead>
                <tbody><tr>
                    <td class="korting-td-product">${kortingTag}${imgHtml}<div class="korting-naam">${product.naam}</div></td>
                    <td class="korting-td-percent"><div class="korting-percent-badge">${kortingPercent}%</div></td>
                    <td class="korting-td-prijs"><div class="korting-nieuw-prijs">${fmt(nieuwPrijs)}</div></td>
                    <td class="korting-td-bew"><div class="korting-invul-lijn"></div><div class="korting-invul-lijn"></div></td>
                    <td class="korting-td-nieuw"><div class="korting-antwoord">€ <div class="korting-invul-lijn kort"></div></div></td>
                </tr></tbody>
            </table>`;
        }

    } else if (type === 'winkel_vergelijk') {
        // Opdracht 5: hetzelfde product in Supermarkt A en Supermarkt B
        const geschaald = getGeschaaldePrijzen(winkelLijst, max, centen);
        // Kies 1 product
        const product = geschaald[Math.floor(Math.random() * geschaald.length)];
        const basisPrijs = product.prijs;

        // Genereer 2 verschillende prijzen rond de basisprijs (±10-40%), altijd ≤ max
        let prijsA, prijsB, verschil;
        let gevonden = false;
        for (let poging = 0; poging < 40 && !gevonden; poging++) {
            const delta = centen
                ? (Math.round((Math.random() * 0.3 + 0.05) * basisPrijs * 20) / 20)
                : Math.max(1, Math.round((Math.random() * 0.3 + 0.05) * basisPrijs));
            let pA = Math.round((basisPrijs + (Math.random() < 0.5 ? delta : 0)) * 100) / 100;
            let pB = Math.round((basisPrijs + (pA === basisPrijs ? delta : 0)) * 100) / 100;
            // Altijd ≤ max
            pA = Math.min(pA, max); pB = Math.min(pB, max);
            verschil = Math.abs(Math.round((pA - pB) * 100)) / 100;
            if (verschil > 0 && (centen ? (verschil * 100) % 5 === 0 : Number.isInteger(verschil))) {
                prijsA = pA; prijsB = pB; gevonden = true;
            }
        }
        if (!gevonden) {
            prijsA = Math.min(basisPrijs, max);
            prijsB = Math.min(centen ? Math.round((basisPrijs + 0.50) * 100) / 100 : basisPrijs + 1, max);
            // Als ze gelijk zijn na clamping, maak B iets lager
            if (prijsA === prijsB) prijsB = Math.max(prijsA - (centen ? 0.5 : 1), 1);
            verschil = Math.abs(Math.round((prijsA - prijsB) * 100)) / 100;
        }

        const prijsStr = (p) => `€ ${p.toFixed(centen ? 2 : 0).replace('.', ',')}`;
        const submap = product.submap || 'supermarkt';
        const s = product.scale || 1.0, my = product.moveY || 0;
        const imgHtml = `<img src="assets/producten/${submap}/${product.img}" class="vergelijk-img" onerror="this.style.display='none'" style="transform:scale(${s}) translateY(${my}px);">`;

        // Winkelnaam voor headers — afgeleid van winkelType
        const winkelNamen = { supermarkt: 'Supermarkt', bakker: 'Bakker', speelgoed: 'Speelgoedwinkel', snoepwinkel: 'Snoepwinkel', elektronica: 'Elektronicawinkel', schoolwinkel: 'Schoolwinkel', kledingwinkel: 'Kledingwinkel' };
        const winkelNaam2 = winkelNamen[winkelType] || 'Supermarkt';
        const naamA = `${winkelNaam2} A`, naamB = `${winkelNaam2} B`;

        html += `<table class="vergelijk-tabel">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>${naamA}</th>
                            <th>${naamB}</th>
                            <th>Waar koop je het<br>het goedkoopst?</th>
                            <th>Bewerking:<br><span class="vergelijk-header-instructie">Reken het verschil uit tussen de prijzen.</span></th>
                            <th>Verschil</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="vergelijk-td-product vergelijk-td-enkel">
                                ${imgHtml}
                                <div class="vergelijk-productnaam">${product.naam}</div>
                            </td>
                            <td class="vergelijk-td-winkel">
                                <div class="vergelijk-winkel-logo vergelijk-winkel-a">A</div>
                                <div class="vergelijk-prijs">${prijsStr(prijsA)}</div>
                            </td>
                            <td class="vergelijk-td-winkel">
                                <div class="vergelijk-winkel-logo vergelijk-winkel-b">B</div>
                                <div class="vergelijk-prijs">${prijsStr(prijsB)}</div>
                            </td>
                            <td class="vergelijk-td-duurder">
                                <div class="vergelijk-keuze-rij">
                                    <label class="vergelijk-keuze"><span class="vergelijk-cirkel"></span> ${naamA}</label>
                                    <label class="vergelijk-keuze"><span class="vergelijk-cirkel"></span> ${naamB}</label>
                                    <label class="vergelijk-keuze"><span class="vergelijk-cirkel"></span> even duur</label>
                                </div>
                            </td>
                            <td class="vergelijk-td-bew">
                                <div class="vergelijk-invul-lijn"></div>
                                <div class="vergelijk-invul-lijn"></div>
                            </td>
                            <td class="vergelijk-td-verschil">
                                <div class="vergelijk-verschil-rij">€ <div class="vergelijk-invul-lijn kort"></div></div>
                                <div class="vergelijk-verschil-label">verschil</div>
                            </td>
                        </tr>
                    </tbody>
                 </table>`;

    } else if (type.startsWith('winkel')) {
        // winkel_totaal — kies items waarvan som ≤ max
        const geschaald = getGeschaaldePrijzen(winkelLijst, max, centen);
        const geshuffled = [...geschaald].sort(() => 0.5 - Math.random());
        let items = [];
        for (const p of geshuffled) {
            const nieuwTotaal = Math.round((items.reduce((a,b) => a+b.prijs, 0) + p.prijs) * 100) / 100;
            if (nieuwTotaal <= max) {
                items.push(p);
                if (items.length >= nItems) break;
            }
        }
        if (items.length === 0) items = [geshuffled[0]];
        const totaal = Math.min(Math.round(items.reduce((a, b) => a + b.prijs, 0) * 100) / 100, max);

        const schattingBlok = metSchatten
            ? `<div class="dubbel-invul-rij">
                    <div class="invul-vak">
                        <div class="label-groep">Ik schat:</div>
                        <div class="korte-invul-lijn"></div>
                        <div class="korte-invul-lijn"></div>
                    </div>
                    <div class="invul-vak">
                        <div class="label-groep">Bewerking:</div>
                        <div class="korte-invul-lijn"></div>
                        <div class="korte-invul-lijn"></div>
                    </div>
               </div>`
            : `<div class="opdracht-blok">
                    <div class="label-groep">Bewerking:</div>
                    <div class="korte-invul-lijn"></div>
                    <div class="korte-invul-lijn"></div>
               </div>`;

        html += `<div class="winkel-container">
                    <div class="winkel-lijstje">
                        <div class="label-groep">Mijn mandje:</div>
                        <div class="mandje-grid">
                            ${items.map(i => {
                                const scale = i.scale || 1.0;
                                const moveY = i.moveY || 0;
                                return `<img src="assets/producten/${i.submap || 'supermarkt'}/${i.img}" 
                                             class="product-img-mandje" 
                                             style="transform: scale(${scale}) translateY(${moveY}px);"
                                             onerror="this.src='assets/producten/' + (this.dataset.submap||'supermarkt') + '/${i.img}'">`;
                            }).join('')}
                        </div>
                    </div>
                    <div class="winkel-opdracht">
                        ${schattingBlok}
                        <div class="opdracht-blok">
                            <div class="label-groep">Totaal te betalen: € ________</div>
                        </div>
                        <div class="geld-vak">${genereerMix(totaal, max, centen, klein)}</div>
                    </div>
                 </div>`;
    } else {
        let bedrag = getUniekBedrag(max, centen, klein);
        if (type === 'twee_manieren') {
            html += `Bedrag: <strong>€${bedrag.toFixed(centen ? 2 : 0).replace('.',',')}</strong>
                     <div class="manieren-grid">
                        <div class="geld-vak">${genereerMix(bedrag, max, centen, klein)}</div>
                        <div class="geld-vak">${genereerMix(bedrag, max, centen, klein)}</div>
                     </div>`;
        } else if (type === 'tellen') {
            html += `<div class="tellen-inhoud">
                        <div class="geld-vak">${genereerGeldSimpel(bedrag, centen, klein)}</div>
                        <div class="antwoord-box">Totaal: € <div class="lijn-invul" style="flex-grow:1; border-bottom:1px solid #333; height:18px;"></div></div>
                     </div>`;
        } else {
            html += `Bedrag: <strong>€${bedrag.toFixed(centen ? 2 : 0).replace('.',',')}</strong>
                     <div class="geld-vak">${genereerMix(bedrag, max, centen, klein)}</div>`;
        }
    }
    kader.innerHTML = html;
    grid.appendChild(kader);
}

function genereerGeldSimpel(totaal, centen, klein) {
    let rest = Math.round(totaal * 100) / 100;
    let html = '';
    moneyConfig.forEach(u => {
        if (u.value < 1 && !centen) return;
        if (u.value < 0.05 && !klein) return;
        while (rest >= u.value - 0.001) {
            html += `<img src="assets/${u.img}" class="money-img" style="--scale: ${u.scale}">`;
            rest = Math.round((rest - u.value) * 100) / 100;
        }
    });
    return html;
}

function genereerMix(doel, max, centen, klein) {
    let verz = [];
    moneyConfig.forEach(u => {
        if (u.value > max || (u.value < 1 && !centen) || (u.value < 0.05 && !klein)) return;
        let n = (u.value === max) ? 1 : (u.value >= 5 ? 3 : 4);
        for(let i=0; i<n; i++) verz.push(u);
    });
    verz.sort((a,b) => b.value - a.value);
    return verz.map(u => `<img src="assets/${u.img}" class="money-img" style="--scale: ${u.scale}">`).join('');
}

// Genereert een mix voor de omcirkel-rij bij terugkrijgen:
// het exacte wisselgeld zit ertussen + willekeurige afleiders
function genereerWisselgeldMix(wisselgeld, max, centen, klein) {
    // Stap 1: bouw de exacte wisselgeld-munten op
    const exacteMunten = [];
    let rest = Math.round(wisselgeld * 100) / 100;
    moneyConfig.forEach(u => {
        if (u.value < 1 && !centen) return;
        if (u.value < 0.05 && !klein) return;
        while (rest >= u.value - 0.001) {
            exacteMunten.push(u);
            rest = Math.round((rest - u.value) * 100) / 100;
        }
    });

    // Stap 2: genereer 4-6 afleiders (andere munten/biljetten, niet gelijk aan wisselgeld-combinatie)
    const afleiderPool = moneyConfig.filter(u =>
        u.value <= max && u.value >= (centen ? 0.05 : 1) && (klein || u.value >= 0.05)
    );
    const afleiders = [];
    const aantalAfleiders = 4 + Math.floor(Math.random() * 3); // 4, 5 of 6 afleiders
    for (let i = 0; i < aantalAfleiders; i++) {
        afleiders.push(afleiderPool[Math.floor(Math.random() * afleiderPool.length)]);
    }

    // Stap 3: markeer exacte munten met data-attribuut, meng alles door elkaar
    const alleItems = [
        ...exacteMunten.map(u => ({ u, correct: true })),
        ...afleiders.map(u => ({ u, correct: false }))
    ].sort(() => 0.5 - Math.random());

    return alleItems.map(({ u, correct }) =>
        `<img src="assets/${u.img}" class="money-img omcirkel-item${correct ? ' correct-wisselgeld' : ''}" style="--scale: ${u.scale}" title="${correct ? 'wisselgeld' : ''}">`
    ).join('');
}

function toonPdfLoading() {
    const el = document.getElementById('pdf-loading');
    if (el) el.classList.remove('hidden');
}

function verbergPdfLoading() {
    const el = document.getElementById('pdf-loading');
    if (el) el.classList.add('hidden');
}

async function downloadAlsPdf() {
    try {
        toonPdfLoading();
        await pdfEngine.generate();
    } catch (error) {
        console.error('Fout bij PDF-generatie:', error);
        alert('Er liep iets mis bij het maken van de PDF.');
    } finally {
        verbergPdfLoading();
    }
}

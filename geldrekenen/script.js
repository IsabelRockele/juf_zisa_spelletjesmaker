let activeTab = 'vaardigheden';
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
        { naam: "Appel", prijs: 0.40, img: "appel.png" }, { naam: "Banaan", prijs: 0.60, img: "banaan.png" },
        { naam: "Melk", prijs: 1.20, img: "melk.png" }, { naam: "Brood", prijs: 2.30, img: "brood.png" },
        { naam: "Kaas", prijs: 4.50, img: "kaas.png" }, { naam: "Eieren", prijs: 3.10, img: "eieren.png" },
        { naam: "Pasta", prijs: 1.15, img: "pasta.png" }, { naam: "Saus", prijs: 1.95, img: "saus.png" }
    ],
    speelgoed: [
        { naam: "Bal", prijs: 4.00, img: "bal.png" }, { naam: "Auto", prijs: 2.50, img: "auto.png" },
        { naam: "Pop", prijs: 15.00, img: "pop.png" }, { naam: "Puzzel", prijs: 8.00, img: "puzzel.png" },
        { naam: "Beer", prijs: 12.00, img: "beer.png" }, { naam: "Blokken", prijs: 19.95, img: "blokken.png" }
    ],
    bakker: [
        { naam: "Croissant", prijs: 1.10, img: "croissant.png" }, { naam: "Taartje", prijs: 3.50, img: "taart.png" },
        { naam: "Pistolet", prijs: 0.45, img: "pistolet.png" }, { naam: "Eclair", prijs: 2.20, img: "eclair.png" },
        { naam: "Stokbrood", prijs: 1.80, img: "stokbrood.png" }, { naam: "Donut", prijs: 1.25, img: "donut.png" }
    ]
};

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
    
    let titel = "Oefening: Tel het geld.";
    if(type === 'twee_manieren') titel = "Oefening: Omkring het bedrag op 2 manieren.";
    if(type === 'weinig_mogelijk') titel = "Oefening: Betaal met zo weinig mogelijk munten/briefjes.";
    if(type.startsWith('winkel')) titel = "Winkeltje: " + document.getElementById('winkelSelect').options[document.getElementById('winkelSelect').selectedIndex].text;

    const sectie = document.createElement('div');
    sectie.className = "oefening-sectie";
    sectie.dataset.type = type;

    let html = `<span contenteditable="true" class="sectie-titel">${titel}</span>`;
    
    if (activeTab === 'winkel') {
        const winkel = document.getElementById('winkelSelect').value;
        html += `<div class="winkel-poster">${winkelData[winkel].map(i => `<div class="poster-item"><img src="assets/producten/${i.img}" class="poster-img"><br><span class="poster-prijs">€${i.prijs.toFixed(2).replace('.',',')}</span></div>`).join('')}</div>`;
    }

    html += `<div class="kaders-grid"></div>
             <div class="sectie-controls no-print"><button class="btn-plus" onclick="voegKadersToeManual(this.parentElement.parentElement, 1)">+ Oefening</button></div>`;
    
    sectie.innerHTML = html;
    container.appendChild(sectie);
    for(let i=0; i<aantal; i++) voegKaderToe(sectie);
});

function voegKadersToeManual(node, n) { for(let i=0; i<n; i++) voegKaderToe(node); }

function getUniekBedrag(max, centen, klein) {
    let bedrag;
    let pogingen = 0;
    do {
        bedrag = (centen && max <= 1) ? (Math.random() * (max - 0.05) + 0.05) : (Math.random() * (max - 1) + 1);
        if (!centen) bedrag = Math.floor(bedrag);
        else if (!klein) bedrag = Math.round(bedrag * 20) / 20;
        else bedrag = Math.round(bedrag * 100) / 100;
        pogingen++;
        if (bedrag <= 0) bedrag = centen ? 0.05 : 1;
    } while (gebruikteBedragen.has(bedrag) && pogingen < 100);
    gebruikteBedragen.add(bedrag);
    return bedrag;
}

function voegKaderToe(sectieNode) {
    const grid = sectieNode.querySelector('.kaders-grid');
    const type = sectieNode.dataset.type;
    const max = parseFloat(document.getElementById('maxBedrag').value);
    const centen = document.getElementById('checkCenten').checked;
    const klein = document.getElementById('checkKleineCenten').checked;
    const schatten = document.getElementById('checkSchatten').checked;
    const winkel = document.getElementById('winkelSelect').value;

    const kader = document.createElement('div');
    kader.className = "oefening-kader";
    let html = `<button class="btn-x-kader no-print" onclick="this.parentElement.remove()">X</button>`;

    if (type.startsWith('winkel')) {
        const nItems = parseInt(document.getElementById('aantalItems').value);
        let alleItems = [...winkelData[winkel]];
        if (!centen) alleItems = alleItems.filter(i => i.prijs % 1 === 0);
        
        let items = alleItems.sort(() => 0.5 - Math.random()).slice(0, nItems);
        const totaal = items.reduce((a, b) => a + b.prijs, 0);

        html += `<div class="winkel-container"><div class="winkel-lijstje"><strong>Lijstje:</strong><br>`;
        items.forEach(i => html += `• ${i.naam}<br>`);
        html += `</div><div class="winkel-opdracht">`;
        if (schatten) html += `<div class="invul-lijn">Ik schat: € ________</div>`;
        
        if (type === 'winkel_totaal') {
            html += `<div class="invul-lijn">Totaal: € ________</div><div class="geld-vak">${genereerMix(totaal, max, centen, klein)}</div>`;
        } else if (type === 'winkel_terug') {
            const betaald = [5, 10, 20, 50].find(v => v >= totaal) || 50;
            html += `Betaald met: <img src="assets/${betaald}euro.png" style="height:25px; vertical-align:middle;">`;
            html += `<div class="invul-lijn">Terug: € ________</div><div class="geld-vak">${genereerMix(betaald - totaal, betaald, centen, klein)}</div>`;
        } else if (type === 'winkel_kiezen' || type === 'winkel_exact') {
            const budget = getUniekBedrag(max, centen, klein);
            html = `<button class="btn-x-kader no-print" onclick="this.parentElement.remove()">X</button>`;
            html += `Mijn budget: <strong>€${budget.toFixed(2).replace('.',',')}</strong><br><br>`;
            html += `<div class="winkel-keuze-grid">${alleItems.slice(0,6).map(i => `<div class="keuze-item"><img src="assets/producten/${i.img}" style="height:30px;"><br>€${i.prijs.toFixed(2).replace('.',',')}</div>`).join('')}</div>`;
            html += `<div class="invul-lijn" style="margin-top:10px;">Ik koop: ___________________________</div>`;
        }
        html += `</div></div>`;
    } 
    else if (type === 'twee_manieren') {
        let bedrag = getUniekBedrag(max, centen, klein);
        if (!centen && bedrag < 5) bedrag = 5;
        html += `Bedrag: <strong>€${bedrag.toFixed(2).replace('.',',')}</strong>`;
        html += `<div class="manieren-grid">
                    <div class="geld-vak">${genereerMix(bedrag, max, centen, klein)}</div>
                    <div class="geld-vak">${genereerMix(bedrag, max, centen, klein)}</div>
                 </div>`;
    }
    else {
        let bedrag = getUniekBedrag(max, centen, klein);
        if (type === 'tellen') {
            html += `<div class="geld-vak">${genereerGeldSimpel(bedrag, centen, klein)}</div>
                     <div class="antwoord-box">Totaal: € <div style="flex-grow:1; border-bottom:1px solid #ccc; height:15px;"></div></div>`;
        } else {
            // Dit is 'weinig_mogelijk'
            html += `Bedrag: <strong>€${bedrag.toFixed(2).replace('.',',')}</strong>
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
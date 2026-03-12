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
        /* Pas hier de 'scale' aan voor grootte en 'moveY' om te laten zakken (positief getal is omlaag) */
        { naam: "Zak appelen", prijs: 2.50, img: "appelen.png", scale: 1.2 }, 
        { naam: "Eieren", prijs: 3.20, img: "eieren.png", scale: 1.3, moveY: 8 }, // moveY toegevoegd om te laten zakken
        { naam: "Melk", prijs: 1.45, img: "melk.png", scale: 1.1 }, 
        { naam: "Pasta", prijs: 0.95, img: "pasta.png", scale: 1.0 }, 
        { naam: "Pot saus", prijs: 1.80, img: "potsaus.png", scale: 0.9 }, 
        { naam: "Bananen", prijs: 1.10, img: "trosbananen.png", scale: 0.9 }, 
        { naam: "Keukenrol", prijs: 3.00, img: "keukenrol.png", scale: 1.2 },
        { naam: "Afwasmiddel", prijs: 2.00, img: "afwasmiddel.png", scale: 1.2 },
        { naam: "Choco", prijs: 2.80, img: "choco.png", scale: 1.2 },
        { naam: "Koekjes", prijs: 1.50, img: "koekjes.png", scale: 0.9 },
        { naam: "Sap", prijs: 2.10, img: "sap.png", scale: 1.0 },
        { naam: "Kaas", prijs: 4.20, img: "kaas.png", scale: 1.1 }
    ],
    bakker: [],
    speelgoed: []
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
    const centen = document.getElementById('checkCenten').checked;
    const winkelType = document.getElementById('winkelSelect').value;
    
    let titel = "Oefening: Tel het geld.";
    if(type === 'twee_manieren') titel = "Oefening: Leg het bedrag op 2 verschillende manieren.";
    if(type === 'weinig_mogelijk') titel = "Oefening: Betaal met zo weinig mogelijk munten en briefjes.";
    if(type === 'gepast_betalen') titel = "Oefening: Leg het juiste bedrag klaar.";
    if(type.startsWith('winkel')) {
        const winkelNaam = document.getElementById('winkelSelect').options[document.getElementById('winkelSelect').selectedIndex].text;
        titel = `Winkeltje: ${winkelNaam}`;
    }

    const sectie = document.createElement('div');
    sectie.className = "oefening-sectie";
    sectie.dataset.type = type;

    let html = `<span contenteditable="true" class="sectie-titel">${titel}</span>`;
    
    if (activeTab === 'winkel') {
        const producten = winkelData[winkelType];
        const rij1 = producten.slice(0, 6);
        const rij2 = producten.slice(6, 12);

        html += `<div class="winkel-poster ${winkelType}-stijl">
            <div class="plank-rij">
                ${rij1.map(i => genereerPosterItemHtml(i, centen)).join('')}
            </div>
            <div class="plank-rij">
                ${rij2.map(i => genereerPosterItemHtml(i, centen)).join('')}
            </div>
        </div>`;
    }

    html += `<div class="kaders-grid"></div>
             <div class="sectie-controls no-print">
                <button class="btn-plus" onclick="voegKadersToeManual(this.parentElement.parentElement, 1)">+ Oefening</button>
             </div>`;
    
    sectie.innerHTML = html;
    container.appendChild(sectie);
    for(let i=0; i<aantal; i++) voegKaderToe(sectie);
});

/* moveY wordt hier toegepast via translateY */
function genereerPosterItemHtml(item, centen) {
    const toonPrijs = centen ? item.prijs : Math.ceil(item.prijs);
    const scale = item.scale || 1.0;
    const moveY = item.moveY || 0; // Standaard 0 als moveY niet bestaat
    return `
        <div class="poster-item">
            <img src="assets/producten/supermarkt/${item.img}" 
                 class="poster-img" 
                 style="transform: scale(${scale}) translateY(${moveY}px); transform-origin: bottom center;"
                 onerror="this.src='assets/producten/${item.img}'">
            <div class="prijskaartje">€ ${toonPrijs.toFixed(centen ? 2 : 0).replace('.',',')}</div>
        </div>`;
}

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
    const nItems = parseInt(document.getElementById('aantalItems').value);

    const kader = document.createElement('div');
    kader.className = "oefening-kader";
    let html = `<button class="btn-x-kader no-print" onclick="this.parentElement.remove()">X</button>`;

    if (type.startsWith('winkel')) {
        let items = [...winkelData.supermarkt].sort(() => 0.5 - Math.random()).slice(0, nItems);
        items = items.map(i => ({...i, prijs: centen ? i.prijs : Math.ceil(i.prijs)}));
        const totaal = items.reduce((a, b) => a + b.prijs, 0);

        html += `<div class="winkel-container">
                    <div class="winkel-lijstje">
                        <div class="label-groep">Mijn mandje:</div>
                        <div class="mandje-grid">
                            ${items.map(i => {
                                const scale = i.scale || 1.0;
                                const moveY = i.moveY || 0;
                                return `<img src="assets/producten/supermarkt/${i.img}" 
                                             class="product-img-mandje" 
                                             style="transform: scale(${scale}) translateY(${moveY}px);"
                                             onerror="this.src='assets/producten/${i.img}'">`;
                            }).join('')}
                        </div>
                    </div>
                    <div class="winkel-opdracht">
                        <div class="opdracht-blok">
                            <div class="label-groep">Bewerking:</div>
                            <div class="lange-invul-lijn"></div>
                        </div>
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
            html += `<div class="geld-vak">${genereerGeldSimpel(bedrag, centen, klein)}</div>
                     <div class="antwoord-box">Totaal: € <div class="lijn-invul" style="flex-grow:1; border-bottom:1px solid #333; height:18px;"></div></div>`;
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
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
        { naam: "Zak appelen",  basisPrijs: 2.50, img: "appelen.png",     scale: 1.2 }, 
        { naam: "Eieren",       basisPrijs: 3.20, img: "eieren.png",       scale: 1.3, moveY: 8 },
        { naam: "Melk",         basisPrijs: 1.45, img: "melk.png",         scale: 1.1 }, 
        { naam: "Pasta",        basisPrijs: 0.95, img: "pasta.png",        scale: 1.0 }, 
        { naam: "Pot saus",     basisPrijs: 1.80, img: "potsaus.png",      scale: 0.9 }, 
        { naam: "Bananen",      basisPrijs: 1.10, img: "trosbananen.png",  scale: 0.9 }, 
        { naam: "Keukenrol",    basisPrijs: 3.00, img: "keukenrol.png",    scale: 1.2 },
        { naam: "Afwasmiddel",  basisPrijs: 2.00, img: "afwasmiddel.png",  scale: 1.2 },
        { naam: "Choco",        basisPrijs: 2.80, img: "choco.png",        scale: 1.2 },
        { naam: "Koekjes",      basisPrijs: 1.50, img: "koekjes.png",      scale: 0.9 },
        { naam: "Sap",          basisPrijs: 2.10, img: "sap.png",          scale: 1.0 },
        { naam: "Kaas",         basisPrijs: 4.20, img: "kaas.png",         scale: 1.1 }
    ],
    bakker: [],
    speelgoed: []
};

// Schaal basisprijzen op basis van het ingestelde max bedrag
// max ≤ 10  → factor 1x   (€1–€5)
// max ≤ 20  → factor 2x   (€2–€10)
// max ≤ 50  → factor 5x   (€5–€25)
// max ≤ 100 → factor 10x  (€10–€50)
// max > 100 → factor 20x
function getPrijsFactor(max) {
    if (max <= 5)   return 1;
    if (max <= 10)  return 2;
    if (max <= 20)  return 4;
    if (max <= 50)  return 8;
    if (max <= 100) return 15;
    return 25;
}

function getGeschaaldePrijzen(winkelLijst, max, centen) {
    const factor = getPrijsFactor(max);
    return winkelLijst.map(item => {
        let prijs = item.basisPrijs * factor;
        if (!centen) prijs = Math.round(prijs); // naar dichtstbijzijnde euro
        else prijs = Math.round(prijs * 20) / 20; // naar 5 cent
        return { ...item, prijs };
    });
}

// Geeft een bedrag terug dat minstens 2 producten van de poster kan dekken
function getKiezenBedrag(max, centen, klein) {
    const geschaald = getGeschaaldePrijzen(winkelData.supermarkt, max, centen);
    const gesorteerd = [...geschaald].sort((a, b) => a.prijs - b.prijs);
    // Neem som van de 2 goedkoopste als ondergrens, max als bovengrens
    const ondergrens = gesorteerd[0].prijs + gesorteerd[1].prijs;
    const bovengrens = Math.min(max, gesorteerd.slice(0, 4).reduce((a, b) => a + b.prijs, 0));
    // Genereer bedrag tussen onder- en bovengrens
    let bedrag = ondergrens + Math.random() * (bovengrens - ondergrens);
    if (!centen) bedrag = Math.round(bedrag);
    else if (!klein) bedrag = Math.round(bedrag * 20) / 20;
    else bedrag = Math.round(bedrag * 100) / 100;
    return Math.max(ondergrens, Math.min(bedrag, max));
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
        const geenPoster = (type === 'winkel_terug' || type === 'winkel_vergelijk');
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
    const toonPrijs = centen ? item.prijs : item.prijs; // prijs al geschaald
    const scale = item.scale || 1.0;
    const moveY = item.moveY || 0;
    const nummerHtml = nummer ? `<div class="poster-nummer">${nummer}</div>` : '';
    return `
        <div class="poster-item">
            ${nummerHtml}
            <img src="assets/producten/supermarkt/${item.img}" 
                 class="poster-img" 
                 style="transform: scale(${scale}) translateY(${moveY}px); transform-origin: bottom center;"
                 onerror="this.src='assets/producten/${item.img}'">
            <div class="prijskaartje">€ ${toonPrijs.toFixed(centen ? 2 : 0).replace('.',',')}</div>
        </div>`;
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
    const max = parseFloat(document.getElementById('maxBedrag').value);
    const centen = document.getElementById('checkCenten').checked;
    const klein = document.getElementById('checkKleineCenten').checked;
    const nItems = parseInt(document.getElementById('aantalItems').value);

    const kader = document.createElement('div');
    kader.className = "oefening-kader";
    let html = `<button class="btn-x-kader no-print" onclick="this.parentElement.remove()">X</button>`;

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
            const geschaald = getGeschaaldePrijzen(winkelData.supermarkt, max, centen);
            let kandidaatItems = [...geschaald].sort(() => 0.5 - Math.random()).slice(0, nItems);
            const kTotaal = Math.round(kandidaatItems.reduce((a, b) => a + b.prijs, 0) * 100) / 100;
            if (kTotaal < betaalMunt.value && kTotaal > 0) {
                items = kandidaatItems; totaal = kTotaal; gevonden = true;
            }
        }
        if (!gevonden) {
            betaalMunt = kandidaten[kandidaten.length - 1] || moneyConfig.find(u => u.value === 10) || moneyConfig[6];
            const geschaald = getGeschaaldePrijzen(winkelData.supermarkt, max, centen);
            items = [...geschaald].sort(() => 0.5 - Math.random()).slice(0, nItems);
            totaal = Math.round(items.reduce((a, b) => a + b.prijs, 0) * 100) / 100;
        }
        const wisselgeld = Math.round((betaalMunt.value - totaal) * 100) / 100;
        const prijsStr = (p) => `€ ${p.toFixed(centen ? 2 : 0).replace('.', ',')}`;
        html += `<div class="oefening-kader-terug">
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
                                                <img src="assets/producten/supermarkt/${i.img}" class="product-img-mandje" style="transform: scale(${s}) translateY(${my}px);" onerror="this.src='assets/producten/${i.img}'">
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
        const bedrag = getKiezenBedrag(max, centen, klein);
        const bedragStr = `€ ${bedrag.toFixed(centen ? 2 : 0).replace('.', ',')}`;
        html += `<table class="kiezen-tabel">
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
        const geschaald = getGeschaaldePrijzen(winkelData.supermarkt, max, centen);
        const nKoop = 2 + Math.floor(Math.random() * 2);
        const gekozen = [...geschaald].sort(() => 0.5 - Math.random()).slice(0, nKoop);
        const exactBedrag = Math.round(gekozen.reduce((a, b) => a + b.prijs, 0) * 100) / 100;
        const exactStr = `€ ${exactBedrag.toFixed(centen ? 2 : 0).replace('.', ',')}`;
        const uid = 'exact_' + Math.random().toString(36).slice(2, 7);
        html += `<div class="exact-hint no-print">✏️ Klik op het bedrag om het aan te passen</div>
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

    } else if (type === 'winkel_vergelijk') {
        // Opdracht 5: vergelijk 2 producten van de poster
        const geschaald = getGeschaaldePrijzen(winkelData.supermarkt, max, centen);
        // Kies 2 producten met verschillende prijs
        let paar = [];
        for (let poging = 0; poging < 30; poging++) {
            const kandidaten = [...geschaald].sort(() => 0.5 - Math.random()).slice(0, 2);
            if (Math.round(kandidaten[0].prijs * 100) !== Math.round(kandidaten[1].prijs * 100)) {
                paar = kandidaten; break;
            }
        }
        if (paar.length < 2) paar = geschaald.slice(0, 2); // fallback

        // Vaste nummers 1 en 2 (geen poster, dus eigen nummering)
        const nrs = [1, 2];
        const prijsStr = (p) => `€ ${p.toFixed(centen ? 2 : 0).replace('.', ',')}`;
        const verschil = Math.abs(Math.round((paar[0].prijs - paar[1].prijs) * 100)) / 100;

        html += `<table class="vergelijk-tabel">
                    <thead>
                        <tr>
                            <th>Product A</th>
                            <th>Product B</th>
                            <th>Welk is duurder?</th>
                            <th>Bewerking:<br><span class="vergelijk-header-instructie">Reken het verschil uit tussen de prijzen.</span></th>
                            <th>Verschil</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="vergelijk-td-product">
                                <div class="vergelijk-nummer">${nrs[0]}</div>
                                <img src="assets/producten/supermarkt/${paar[0].img}" class="vergelijk-img" onerror="this.src='assets/producten/${paar[0].img}'">
                                <div class="vergelijk-prijs">${prijsStr(paar[0].prijs)}</div>
                            </td>
                            <td class="vergelijk-td-product">
                                <div class="vergelijk-nummer">${nrs[1]}</div>
                                <img src="assets/producten/supermarkt/${paar[1].img}" class="vergelijk-img" onerror="this.src='assets/producten/${paar[1].img}'">
                                <div class="vergelijk-prijs">${prijsStr(paar[1].prijs)}</div>
                            </td>
                            <td class="vergelijk-td-duurder">
                                <div class="vergelijk-keuze-rij">
                                    <label class="vergelijk-keuze"><span class="vergelijk-cirkel"></span> product ${nrs[0]}</label>
                                    <label class="vergelijk-keuze"><span class="vergelijk-cirkel"></span> product ${nrs[1]}</label>
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
        // winkel_totaal
        const geschaald = getGeschaaldePrijzen(winkelData.supermarkt, max, centen);
        let items = [...geschaald].sort(() => 0.5 - Math.random()).slice(0, nItems);
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

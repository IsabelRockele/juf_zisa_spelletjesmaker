document.addEventListener('DOMContentLoaded', () => {

    const woordenLijsten = {
        "AVI-START": ["auto", "saus", "goud", "hout", "boek", "zoek", "deur", "kleur", "brief", "ziek", "trein", "klein", "dijk", "kijk", "huis", "duim", "boom", "rook", "zee", "thee", "maan", "vaas", "vuur", "muur", "sneeuw", "nieuw", "haai", "zaai", "kooi", "vlooi", "foei", "groei", "lang", "bang", "drink", "plank", "school", "schat", "schrijf", "schrik", "ik", "kim", "vis", "pen", "een", "aap", "noot", "mies"],
        "AVI-M3": ["de", "maan", "roos", "vis", "ik", "en", "een", "is", "in", "pen", "an", "doos", "doek", "buik", "ik", "hij", "zij", "wij", "nee", "ja", "sok", "boom", "boot", "vuur", "koek", "zeep", "wei", "ui", "huis", "duif", "kous", "hout", "jas", "jet", "dag", "weg", "lach", "zeg", "jij", "bij", "heuvel", "nieuw", "schip", "ring", "bank", "vang", "klink", "plank", "zon", "zee", "zus"],
        "AVI-E3": ["school", "vriend", "fiets", "groen", "lacht", "naar", "straat", "plant", "groeit", "vogel", "fluit", "schat", "zoekt", "onder", "steen", "vindt", "niks", "draak", "sprookje", "woont", "kasteel", "prinses", "redt", "hem", "eerst", "dan", "later", "eind", "goed", "al", "sneeuw", "wit", "koud", "winter", "schaatsen", "ijs", "pret", "warm", "chocolademelk", "koekje", "erbij", "blij", "schijnt", "lucht", "blauw", "wolk", "drijft", "zacht", "wind"],
        "AVI-M4": ["zwaaien", "leeuw", "meeuw", "duw", "sneeuw", "kieuw", "nieuw", "sluw", "ruw", "uw", "geeuw", "schreeuw", "ooi", "kooi", "haai", "vlaai", "prooi", "draai", "kraai", "strooi", "mooi", "gloei", "foei", "boei", "groei", "bloei", "vloei", "ai", "ui", "ei", "eeuw", "ieuw", "oei", "aai", "spring", "breng", "kring", "zing", "ding", "bang", "stang", "wang", "streng", "jong", "tong", "zong", "lang", "hang", "plank", "slank", "vonk", "dronk", "stank", "bank"],
        "AVI-E4": ["bezoek", "gevaar", "verkeer", "verhaal", "gebak", "bestek", "geluk", "getal", "gezin", "begin", "beton", "beroep", "geheim", "geduld", "verstand", "verkoop", "ontbijt", "ontdek", "ontwerp", "ontvang", "ontmoet", "herhaal", "herken", "herfst", "achtig", "plechtig", "krachtig", "zestig", "zinnig", "koppig", "lastig", "smelt", "helpt", "werkt", "fietst", "lacht", "drinkt", "zwaait", "geloof", "gebeurt", "betaal", "vergeet", "verlies", "geniet", "gevoel", "gebruik", "verrassing", "beleef", "vertrouw", "verdien", "ontsnap"],
        "AVI-M5": ["vrolijk", "moeilijk", "eerlijk", "gevaarlijk", "heerlijk", "dagelijks", "eindelijk", "vriendelijk", "lelijk", "afschuwelijk", "persoonlijk", "landelijk", "tijdelijk", "ordelijk", "duidelijk", "eigenlijk", "schadelijk", "mogelijk", "onmogelijk", "waarschijnlijk", "thee", "koffie", "taxi", "menu", "baby", "hobby", "pony", "jury", "bureau", "cadeau", "plateau", "niveau", "station", "actie", "politie", "vakantie", "informatie", "traditie", "positie", "conditie", "chauffeur", "douche", "machine", "chef", "journaal", "restaurant", "trottoir", "horloge", "garage", "bagage"],
        "AVI-E5": ["bibliotheek", "interessant", "temperatuur", "onmiddellijk", "belangrijk", "elektrisch", "verschillende", "eigenlijk", "omgeving", "gebeurtenis", "ervaring", "industrie", "internationaal", "communicatie", "organisatie", "president", "discussie", "officieel", "traditioneel", "automatisch", "fotograaf", "enthousiast", "atmosfeer", "categorie", "laboratorium", "journalist", "architect", "kampioenschap", "psycholoog", "helikopter", "paraplu", "professor", "abonnement", "encyclopedie", "ceremonie", "chocolade", "concert", "dinosaurus", "expeditie", "fantasie", "generatie", "instrument", "kritiek", "literatuur", "medicijn", "museum", "operatie", "populair", "respect", "signaal"]
    };
    const klanken = "abcdefghijklmnopqrstuvwxyz".split('').concat(["au", "ou", "oe", "eu", "ie", "ei", "ij", "ui", "oo", "ee", "aa", "uu", "eeuw", "ieuw", "aai", "ooi", "oei", "ng", "nk", "sch", "schr"]);
    
    let huidigeSpelItems = [];
    let kaartItemsLijst = [];
    let teTrekkenItems = [];
    let isGetallenSpel = false;
    let isOefenSpel = false;
    let oefeningenLijst = {};
    let ballenItems = [];

    const spelWrapper = document.getElementById('spel-wrapper');
    const titel = document.getElementById('huidig-niveau-titel');
    const itemsOverzichtDiv = document.getElementById('items-overzicht');
    const ballenBandDiv = document.getElementById('ballen-band');
    const startKnop = document.getElementById('start-schuiven-knop');
    const machineDiv = document.getElementById('schuif-machine');
    const kaartenKnop = document.getElementById('maak-kaarten-knop');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitel = document.getElementById('modal-titel');
    const modalTekst = document.getElementById('modal-tekst');
    const modalOpties = document.getElementById('modal-opties');
    const modalAnnulerenKnop = document.getElementById('modal-annuleren-knop');
    const kiesAviKnop = document.getElementById('kies-avi-knop');
    const aviSelectieDiv = document.getElementById('avi-selectie');
    const aviStartSubkeuzeDiv = document.getElementById('avi-start-subkeuze');
    const aviStartKlankkeuzeDiv = document.getElementById('avi-start-klankkeuze');
    const klankKiezerDiv = document.getElementById('klank-kiezer');
    const kiesGetalKnop = document.getElementById('kies-getal-knop');
    const getalSelectieDiv = document.getElementById('getal-selectie');
    const kiesTafelKnop = document.getElementById('kies-tafel-knop');
    const tafelSelectieDiv = document.getElementById('tafel-selectie');
    const tafelKiezerDiv = document.getElementById('tafel-kiezer');
    const startTafelSpelKnop = document.getElementById('start-tafel-spel-knop');
    const kiesRekenKnop = document.getElementById('kies-reken-knop');
    const rekenSelectieDiv = document.getElementById('reken-selectie');
    const startRekenSpelKnop = document.getElementById('start-reken-spel-knop');

    function combinations(n, k) {
        if (k < 0 || k > n) return 0;
        if (k === 0 || k === n) return 1;
        if (k > n / 2) k = n - k;
        let res = 1;
        for (let i = 1; i <= k; i++) {
            res = res * (n - i + 1) / i;
        }
        return Math.round(res);
    }

    function genereerPrintbarePagina(kaartGrootte = 5, vulAanMetDubbels = false) {
        const aantalVakjes = kaartGrootte * kaartGrootte;
        const actieKnoppenHTML = `
            <div class="actie-balk">
                <button onclick="window.print()">🖨️ Afdrukken</button>
                <button id="download-pdf-knop">📄 Download als PDF</button>
                <button onclick="window.close()">❌ Sluiten</button>
            </div>
        `;

        const printStyles = `
            <style>
                body { margin: 0; font-family: sans-serif; background: #eee; }
                .actie-balk { padding: 10px; text-align: center; background: #333; }
                .actie-balk button { font-size: 16px; padding: 10px 20px; margin: 0 10px; cursor: pointer; border-radius: 5px; border: none; color: white; }
                .actie-balk button[onclick*="print"] { background-color: #27ae60; }
                .actie-balk button#download-pdf-knop { background-color: #2980b9; }
                .actie-balk button[onclick*="close"] { background-color: #c0392b; }
                .actie-balk button:disabled { background-color: #95a5a6; cursor: not-allowed; }
                #kaarten-wrapper { text-align: center; padding: 20px; background: white; }
                .bingokaart { 
                    display: inline-block; 
                    width: 48%; 
                    margin: 1%; 
                    box-sizing: border-box; 
                    border: 2px solid black; 
                    page-break-inside: avoid; 
                    vertical-align: top; 
                }
                .bingokaart h3 { text-align: center; font-family: Arial, sans-serif; font-size: 18pt; background-color: #ddd; margin: 0; padding: 5px; }
                .bingo-grid { display: grid; grid-template-columns: repeat(${kaartGrootte}, 1fr); }
                .bingo-vakje { height: ${kaartGrootte === 5 ? '80px' : '90px'}; border: 1px solid #ccc; display: flex; justify-content: center; align-items: center; font-family: Arial, sans-serif; font-size: 14pt; font-weight: bold; padding: 2px; box-sizing: border-box; overflow: hidden; text-align: center; }
                @media print {
                    body { background: white; }
                    .actie-balk { display: none; }
                    #kaarten-wrapper { padding: 0; }
                    @page { size: landscape; } /* Forceer printen naar liggend formaat */
                    .bingokaart { width: 45%; height: 45vh; margin: 2%; }
                }
            </style>`;
            
        const pdfScript = `
            <script>
                document.getElementById('download-pdf-knop').addEventListener('click', async () => {
                    const downloadBtn = document.getElementById('download-pdf-knop');
                    downloadBtn.disabled = true;
                    downloadBtn.textContent = 'Bezig met genereren...';

                    const { jsPDF } = window.jspdf;
                    const bingoKaarten = document.querySelectorAll('.bingokaart');
                    
                    try {
                        // --- DEFINITIEVE COMPROMIS: 4 KAARTEN OP LIGGEND BLAD ---
                        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
                        const pageW = pdf.internal.pageSize.getWidth();
                        const pageH = pdf.internal.pageSize.getHeight();
                        const margin = 10;

                        if (bingoKaarten.length === 0) {
                            alert("Geen kaarten om te genereren.");
                            return;
                        }
                        
                        // Bepaal de maximale afmetingen voor 4 kaarten (2x2) op een liggende pagina
                        const cardWidth = (pageW - 3 * margin) / 2;
                        const cardHeight = (pageH - 3 * margin) / 2;

                        for (let i = 0; i < bingoKaarten.length; i++) {
                            const kaart = bingoKaarten[i];
                            const kaartPositieOpPagina = i % 4;

                            if (i > 0 && kaartPositieOpPagina === 0) {
                                pdf.addPage();
                            }

                            let cursorX, cursorY;

                            if (kaartPositieOpPagina === 0) { // Links-boven
                                cursorX = margin;
                                cursorY = margin;
                            } else if (kaartPositieOpPagina === 1) { // Rechts-boven
                                cursorX = margin * 2 + cardWidth;
                                cursorY = margin;
                            } else if (kaartPositieOpPagina === 2) { // Links-onder
                                cursorX = margin;
                                cursorY = margin * 2 + cardHeight;
                            } else { // Rechts-onder
                                cursorX = margin * 2 + cardWidth;
                                cursorY = margin * 2 + cardHeight;
                            }
                            
                            const canvas = await html2canvas(kaart, { scale: 2 });
                            // Forceer de afbeelding in de berekende afmetingen, ook als dit vervorming geeft
                            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', cursorX, cursorY, cardWidth, cardHeight);
                        }
                        // --- EINDE AANPASSING ---

                        pdf.save('bingokaarten.pdf');

                    } catch (error) {
                        console.error('Fout bij het genereren van de PDF:', error);
                        alert('Er is een fout opgetreden bij het maken van de PDF.');
                    } finally {
                        downloadBtn.disabled = false;
                        downloadBtn.textContent = '📄 Download als PDF';
                    }
                });
            </script>
        `;

        let kaartenHTML = '';
        for (let i = 0; i < 25; i++) {
            let kaartItems;
            if (vulAanMetDubbels) {
                let aangevuldeLijst = [];
                while (aangevuldeLijst.length < aantalVakjes) { aangevuldeLijst.push(...kaartItemsLijst); }
                kaartItems = aangevuldeLijst.slice(0, aantalVakjes).sort(() => Math.random() - 0.5);
            } else {
                const geschuddeItems = [...kaartItemsLijst].sort(() => Math.random() - 0.5);
                kaartItems = geschuddeItems.slice(0, aantalVakjes);
            }
            kaartenHTML += `<div class="bingokaart"><h3>Bingokaart ${i + 1}</h3><div class="bingo-grid">`;
            kaartItems.forEach(item => { kaartenHTML += `<div class="bingo-vakje">${item}</div>`; });
            kaartenHTML += `</div></div>`;
        }
        
        return `<html>
                    <head>
                        <title>Bingokaarten</title>
                        ${printStyles}
                        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" integrity="sha512-BNaRQnYJYiPSqHHDb58B0yaPfCu+Wgds8Gp/gU33kqBtgNS4tSPHuGibyoeqMV/TJlSKda6FXzoEyYGjTe+vXA==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
                        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" integrity="sha512-qZvrmS2ekKPF2mSznTQsxqPgnpkI4DNTlrdUmTzrDgektczlKNRRhy5X5AAOnx5S09ydFYWWNSfcEqDTTHgtNA==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
                    </head>
                    <body>
                        ${actieKnoppenHTML}
                        <div id="kaarten-wrapper">${kaartenHTML}</div>
                        ${pdfScript}
                    </body>
                </html>`;
    }

    function toonKeuzeModal(actieFunctie) {
        const aantalItems = kaartItemsLijst.length;
        modalTitel.textContent = 'Te weinig antwoorden!';
        modalTekst.textContent = `Er zijn ${aantalItems} unieke antwoorden. Dit is te weinig voor standaard 5x5 bingokaarten. Kies een oplossing:`;
        modalOpties.innerHTML = '';
        if (aantalItems >= 16) {
            const btn = document.createElement('button');
            btn.className = 'modal-optie-knop';
            btn.innerHTML = `Maak 4x4 kaarten (Aanbevolen)<small>Genereer 25 kaarten van 4x4 vakjes.</small>`;
            btn.onclick = () => { actieFunctie(4, false); modalOverlay.classList.add('verborgen'); };
            modalOpties.appendChild(btn);
        }
        if (aantalItems >= 9) {
            const btn = document.createElement('button');
            btn.className = 'modal-optie-knop';
            btn.innerHTML = `Maak 3x3 kaarten<small>Genereer 25 kaarten van 3x3 vakjes.</small>`;
            btn.onclick = () => { actieFuncien(3, false); modalOverlay.classList.add('verborgen'); };
            modalOpties.appendChild(btn);
        }
        const btnForceer = document.createElement('button');
        btnForceer.className = 'modal-optie-knop';
        btnForceer.innerHTML = `Maak 5x5 kaarten (met dubbels)<small>Vakjes worden aangevuld met dubbele antwoorden.</small>`;
        btnForceer.onclick = () => { actieFunctie(5, true); modalOverlay.classList.add('verborgen'); };
        modalOpties.appendChild(btnForceer);
        modalOverlay.classList.remove('verborgen');
    }

    modalAnnulerenKnop.onclick = () => { modalOverlay.classList.add('verborgen'); };

    function startKaartCreatieProces() {
        if (kaartItemsLijst.length === 0) { alert('Kies eerst een spelmodus en niveau.'); return; }
        const actieFunctie = (kaartGrootte, vulAan) => {
            const html = genereerPrintbarePagina(kaartGrootte, vulAan);
            if (html) {
                const printWindow = window.open('', '_blank');
                printWindow.document.write(html);
                printWindow.document.close();
            }
        };
        if (kaartItemsLijst.length < 25) { toonKeuzeModal(actieFunctie); } 
        else { actieFunctie(5, false); }
    }

    function ontleedGetal(n) {
        if (n >= 1000) return n;
        let h = Math.floor(n / 100);
        let t = Math.floor((n % 100) / 10);
        let e = n % 10;
        let parts = [];
        if (h > 0) parts.push(`${h}H`);
        if (t > 0) parts.push(`${t}T`);
        if (e > 0 || n === 0) parts.push(`${e}E`);
        return parts.join(' ');
    }

    function activeerSpel(levelNaam, itemsVoorKaart, isGetal = false, isOefening = false, oefeningen = {}) {
        isGetallenSpel = isGetal;
        isOefenSpel = isOefening;
        spelWrapper.classList.remove('verborgen');
        titel.textContent = levelNaam;

        kaartItemsLijst = [...itemsVoorKaart]; 

        if (isOefening) {
            oefeningenLijst = { ...oefeningen };
            teTrekkenItems = Object.keys(oefeningenLijst);
            huidigeSpelItems = [...teTrekkenItems];
        } else {
            oefeningenLijst = {};
            teTrekkenItems = [...itemsVoorKaart];
            huidigeSpelItems = [...itemsVoorKaart];
        }
        initSpelbord();
    }

    function initSpelbord() {
        itemsOverzichtDiv.innerHTML = '';
        ballenBandDiv.innerHTML = '';
        startKnop.disabled = huidigeSpelItems.length === 0;

        if (huidigeSpelItems.length === 0) {
            itemsOverzichtDiv.innerHTML = '<span>Geen items gevonden voor deze selectie.</span>';
            return;
        }

        const sortedItems = [...huidigeSpelItems].sort((a, b) => String(a).localeCompare(String(b), undefined, {numeric: true}));
        sortedItems.forEach(item => {
            const itemSpan = document.createElement('span');
            itemSpan.textContent = String(item).replace(/\*/g, '×').replace(/\//g, '÷');
            itemSpan.id = `item-${item}`;
            itemsOverzichtDiv.appendChild(itemSpan);
        });

        const kleuren = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
        ballenItems = [...huidigeSpelItems];
        const geschuddeItems = [...ballenItems].sort(() => Math.random() - 0.5);
        const ballenLijst = [...geschuddeItems, ...geschuddeItems, ...geschuddeItems];
        ballenBandDiv.innerHTML = '';
        ballenLijst.forEach((item, index) => {
            const balDiv = document.createElement('div');
            balDiv.className = 'bal';
            balDiv.textContent = isOefenSpel ? String(item).replace(/\*/g, '×').replace(/\//g, '÷') : (isGetallenSpel ? ontleedGetal(item) : item);
            balDiv.style.backgroundColor = kleuren[index % kleuren.length];
            balDiv.dataset.item = item;
            ballenBandDiv.appendChild(balDiv);
        });

        ballenBandDiv.style.transition = 'none';
        ballenBandDiv.style.transform = 'translateX(0px)';
        void ballenBandDiv.offsetWidth;
        ballenBandDiv.style.transition = 'transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)';
    }

    function verbergAlleMenus() {
        aviSelectieDiv.classList.add('verborgen');
        aviStartSubkeuzeDiv.classList.add('verborgen');
        aviStartKlankkeuzeDiv.classList.add('verborgen');
        getalSelectieDiv.classList.add('verborgen');
        tafelSelectieDiv.classList.add('verborgen');
        rekenSelectieDiv.classList.add('verborgen');
    }

    kiesAviKnop.addEventListener('click', () => { verbergAlleMenus(); aviSelectieDiv.classList.toggle('verborgen'); });
    kiesGetalKnop.addEventListener('click', () => { verbergAlleMenus(); getalSelectieDiv.classList.toggle('verborgen'); });
    kiesTafelKnop.addEventListener('click', () => { verbergAlleMenus(); tafelSelectieDiv.classList.toggle('verborgen'); });
    kiesRekenKnop.addEventListener('click', () => { verbergAlleMenus(); rekenSelectieDiv.classList.toggle('verborgen'); });

    document.querySelectorAll('.avi-knop').forEach(knop => {
        knop.addEventListener('click', (e) => {
            document.querySelectorAll('.avi-knop').forEach(k => k.classList.remove('active'));
            e.target.classList.add('active');
            aviStartSubkeuzeDiv.classList.add('verborgen');
            aviStartKlankkeuzeDiv.classList.add('verborgen');
            const level = e.target.dataset.level;
            if (level === 'AVI-START') {
                aviStartSubkeuzeDiv.classList.remove('verborgen');
                spelWrapper.classList.add('verborgen');
            } else { activeerSpel(level, woordenLijsten[level]); }
        });
    });

    function toonKlankKiezer(modus) {
        klankKiezerDiv.dataset.mode = modus;
        klankKiezerDiv.innerHTML = '';
        klanken.forEach(klank => {
            const btn = document.createElement('button');
            btn.className = 'klank-knop';
            btn.textContent = klank;
            btn.dataset.klank = klank;
            btn.addEventListener('click', () => btn.classList.toggle('selected'));
            klankKiezerDiv.appendChild(btn);
        });
        aviStartKlankkeuzeDiv.classList.remove('verborgen');
    }

    document.getElementById('start-met-letters').addEventListener('click', () => { toonKlankKiezer("letters"); });
    document.getElementById('start-met-woorden').addEventListener('click', () => { toonKlankKiezer("woorden"); });
    document.getElementById('start-met-klanken-knop').addEventListener('click', () => {
        const geselecteerde = [...document.querySelectorAll('#klank-kiezer .klank-knop.selected')].map(k => k.dataset.klank);
        if (geselecteerde.length === 0) { alert('Selecteer eerst letters of klanken.'); return; }
        if (klankKiezerDiv.dataset.mode === "letters") {
            activeerSpel("AVI Start (Klanken)", geselecteerde);
        } else {
            const gefilterdeWoorden = woordenLijsten["AVI-START"].filter(woord => {
                let tempWoord = woord;
                for (const klank of geselecteerde.sort((a, b) => b.length - a.length)) { tempWoord = tempWoord.split(klank).join(''); }
                return tempWoord.length === 0;
            });
            activeerSpel("AVI Start (Woorden)", gefilterdeWoorden);
        }
        aviStartKlankkeuzeDiv.classList.add('verborgen');
    });

    document.querySelectorAll('.getal-knop').forEach(knop => {
        knop.addEventListener('click', (e) => {
            const max = parseInt(e.target.dataset.max);
            activeerSpel(`Getallen tot ${max}`, Array.from({ length: max }, (_, i) => i + 1), true);
        });
    });

    function initTafelKiezer() {
        tafelKiezerDiv.innerHTML = '';
        for (let i = 1; i <= 12; i++) {
            const btn = document.createElement('button');
            btn.className = 'tafel-knop-select';
            btn.textContent = i;
            btn.dataset.tafel = i;
            btn.addEventListener('click', () => btn.classList.toggle('selected'));
            tafelKiezerDiv.appendChild(btn);
        }
    }
    initTafelKiezer();

    startTafelSpelKnop.addEventListener('click', () => {
        const geselecteerdeTafels = [...document.querySelectorAll('#tafel-kiezer .selected')].map(k => parseInt(k.dataset.tafel));
        const type = document.querySelector('input[name="tafel-type"]:checked').value;
        if (geselecteerdeTafels.length === 0) { alert('Selecteer eerst één of meerdere tafels.'); return; }
        const nieuweOefeningen = {};
        const antwoorden = [];
        geselecteerdeTafels.forEach(tafel => {
            if (type === 'maal' || type === 'mix') {
                for (let i = 1; i <= 10; i++) {
                    nieuweOefeningen[`${tafel} x ${i}`] = tafel * i;
                    antwoorden.push(tafel * i);
                }
            }
            if (type === 'deel' || type === 'mix') {
                for (let i = 1; i <= 10; i++) {
                    nieuweOefeningen[`${tafel * i} / ${tafel}`] = i;
                    antwoorden.push(i);
                }
            }
        });
        activeerSpel("Tafelbingo", [...new Set(antwoorden)], false, true, nieuweOefeningen);
    });

    startRekenSpelKnop.addEventListener('click', () => {
        const max = parseInt(document.querySelector('input[name="reken-bereik"]:checked').value);
        const brug = document.querySelector('input[name="reken-brug"]:checked').value;
        const bewerking = document.querySelector('input[name="reken-bewerking"]:checked').value;
        const nieuweOefeningen = {};
        let pogingen = 0;
        
        const checkOptelBrug = (a, b) => (a % 10) + (b % 10) >= 10;
        const checkAftrekBrug = (a, b) => (a % 10) < (b % 10);

        while (Object.keys(nieuweOefeningen).length < 50 && pogingen < 2000) {
            pogingen++;
            const gekozenBewerking = (bewerking === 'mix') ? (Math.random() < 0.5 ? 'optellen' : 'aftrekken') : bewerking;

            if (gekozenBewerking === 'optellen') {
                const a = Math.floor(Math.random() * (max + 1));
                const b = Math.floor(Math.random() * (max - a + 1));
                const heeftBrug = checkOptelBrug(a, b);
                if (brug === 'gemengd' || (brug === 'met' && heeftBrug) || (brug === 'zonder' && !heeftBrug)) {
                    nieuweOefeningen[`${a} + ${b}`] = a + b;
                }
            } else {
                const a = Math.floor(Math.random() * (max + 1));
                const b = Math.floor(Math.random() * (a + 1));
                const heeftBrug = checkAftrekBrug(a, b);
                if (brug === 'gemengd' || (brug === 'met' && heeftBrug) || (brug === 'zonder' && !heeftBrug)) {
                    nieuweOefeningen[`${a} - ${b}`] = a - b;
                }
            }
        }
        
        const uniekeAntwoorden = [...new Set(Object.values(nieuweOefeningen))];
        if (uniekeAntwoorden.length === 0) {
            alert('Kon geen oefeningen vinden voor deze selectie. Probeer een andere combinatie (bv. "gemengd").');
            return;
        }
        activeerSpel(`Rekenbingo tot ${max}`, uniekeAntwoorden, false, true, nieuweOefeningen);
    });

    kaartenKnop.addEventListener('click', startKaartCreatieProces);
    
    startKnop.addEventListener('click', () => {
        if (teTrekkenItems.length === 0) { alert("Alle items zijn geweest!"); startKnop.disabled = true; return; }
        startKnop.disabled = true;

        const randomIndex = Math.floor(Math.random() * teTrekkenItems.length);
        const gekozenItem = teTrekkenItems.splice(randomIndex, 1)[0];
        
        const itemSpan = document.getElementById(`item-${gekozenItem}`);

        const alleBallen = document.querySelectorAll('.bal');
        let doelBal = null;
        for (let i = Math.floor(ballenItems.length * 1.5); i < alleBallen.length; i++) {
            if (alleBallen[i]?.dataset.item === gekozenItem) { doelBal = alleBallen[i]; break; }
        }
        if (!doelBal) {
            for (let i = 0; i < alleBallen.length; i++) {
                if (alleBallen[i]?.dataset.item === gekozenItem) { doelBal = alleBallen[i]; break; }
            }
        }
        
        if (doelBal) {
            const machineBreedte = machineDiv.offsetWidth;
            const doelPositie = doelBal.offsetLeft + (doelBal.offsetWidth / 2);
            const schuifAfstand = (machineBreedte / 2) - doelPositie;
            ballenBandDiv.style.transform = `translateX(${schuifAfstand}px)`;
        }

        setTimeout(() => {
            if (itemSpan) itemSpan.classList.add('is-geweest');
            if (teTrekkenItems.length > 0) { 
                startKnop.disabled = false; 
            } else { 
                alert("Alle items van dit niveau zijn geweest!"); 
            }
        }, 4000);
    });
});
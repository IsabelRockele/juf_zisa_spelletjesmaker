document.addEventListener('DOMContentLoaded', () => {

    // --- WOORDEN & KLANKEN ---
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
    
    // Globale staat
    let huidigeSpelItems = [];
    let teTrekkenItems = [];
    let isGetallenSpel = false;

    // DOM-elementen
    const spelWrapper = document.getElementById('spel-wrapper');
    const titel = document.getElementById('huidig-niveau-titel');
    const itemsOverzichtDiv = document.getElementById('items-overzicht');
    const ballenBandDiv = document.getElementById('ballen-band');
    const startKnop = document.getElementById('start-schuiven-knop');
    const machineDiv = document.getElementById('schuif-machine');
    const pdfKnop = document.getElementById('maak-pdf-knop');
    const drukKnop = document.getElementById('druk-kaarten-knop');
    const kiesAviKnop = document.getElementById('kies-avi-knop');
    const aviSelectieDiv = document.getElementById('avi-selectie');
    const kiesGetalKnop = document.getElementById('kies-getal-knop');
    const getalSelectieDiv = document.getElementById('getal-selectie');
    const aviStartSubkeuzeDiv = document.getElementById('avi-start-subkeuze');
    const aviStartKlankkeuzeDiv = document.getElementById('avi-start-klankkeuze');
    const klankKiezerDiv = document.getElementById('klank-kiezer');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitel = document.getElementById('modal-titel');
    const modalTekst = document.getElementById('modal-tekst');
    const modalOpties = document.getElementById('modal-opties');
    const modalAnnulerenKnop = document.getElementById('modal-annuleren-knop');

    // --- FUNCTIES ---
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

        const printStyles = `
            <style>
                body { margin: 20px; font-family: sans-serif; }
                .bingokaart { display: inline-block; width: 48%; margin: 1%; box-sizing: border-box; border: 2px solid black; page-break-inside: avoid; vertical-align: top; }
                .bingokaart h3 { text-align: center; font-family: Arial, sans-serif; font-size: 18pt; background-color: #ddd; margin: 0; padding: 5px; }
                .bingo-grid { display: grid; grid-template-columns: repeat(${kaartGrootte}, 1fr); }
                .bingo-vakje { height: ${kaartGrootte === 5 ? '80px' : '90px'}; border: 1px solid #ccc; display: flex; justify-content: center; align-items: center; font-family: Arial, sans-serif; font-size: 14pt; font-weight: bold; padding: 2px; box-sizing: border-box; overflow: hidden; text-align: center; }
            </style>
        `;

        let kaartenHTML = '';
        for (let i = 0; i < 25; i++) {
            let kaartItems;
            if (vulAanMetDubbels) {
                let aangevuldeLijst = [];
                while (aangevuldeLijst.length < aantalVakjes) {
                    aangevuldeLijst.push(...huidigeSpelItems);
                }
                kaartItems = aangevuldeLijst.slice(0, aantalVakjes).sort(() => Math.random() - 0.5);
            } else {
                const geschuddeItems = [...huidigeSpelItems].sort(() => Math.random() - 0.5);
                kaartItems = geschuddeItems.slice(0, aantalVakjes);
            }
            
            kaartenHTML += `<div class="bingokaart"><h3>Bingokaart ${i + 1}</h3><div class="bingo-grid">`;
            kaartItems.forEach(item => {
                kaartenHTML += `<div class="bingo-vakje">${item}</div>`;
            });
            kaartenHTML += `</div></div>`;
        }

        return `<html><head><title>Bingokaarten</title>${printStyles}</head><body>${kaartenHTML}</body></html>`;
    }

    function toonKeuzeModal(aantalItems, actieFunctie) {
        modalTitel.textContent = 'Te weinig items geselecteerd!';
        modalTekst.textContent = `U heeft ${aantalItems} items gekozen. Dit is te weinig voor standaard 5x5 bingokaarten. Kies een oplossing:`;
        modalOpties.innerHTML = '';

        if (aantalItems >= 16) {
            const combos = combinations(aantalItems, 16).toLocaleString('nl-BE');
            const btn = document.createElement('button');
            btn.className = 'modal-optie-knop';
            btn.innerHTML = `Maak 4x4 kaarten (Aanbevolen)<small>Genereer 25 kaarten van 4x4 vakjes. Er zijn <strong>${combos}</strong>+ unieke kaarten mogelijk.</small>`;
            btn.onclick = () => { actieFunctie(4, false); modalOverlay.classList.add('verborgen'); };
            modalOpties.appendChild(btn);
        }
        
        if (aantalItems >= 9) {
            const combos = combinations(aantalItems, 9).toLocaleString('nl-BE');
            const btn = document.createElement('button');
            btn.className = 'modal-optie-knop';
            btn.innerHTML = `Maak 3x3 kaarten<small>Genereer 25 kaarten van 3x3 vakjes. Er zijn <strong>${combos}</strong>+ unieke kaarten mogelijk.</small>`;
            btn.onclick = () => { actieFunctie(3, false); modalOverlay.classList.add('verborgen'); };
            modalOpties.appendChild(btn);
        }

        const btnForceer = document.createElement('button');
        btnForceer.className = 'modal-optie-knop';
        btnForceer.innerHTML = `Maak 5x5 kaarten (met dubbels)<small>Vakjes worden aangevuld met dubbele items. Er zullen waarschijnlijk meerdere winnaars zijn.</small>`;
        btnForceer.onclick = () => { actieFunctie(5, true); modalOverlay.classList.add('verborgen'); };
        modalOpties.appendChild(btnForceer);
        
        modalOverlay.classList.remove('verborgen');
    }

    modalAnnulerenKnop.onclick = () => { modalOverlay.classList.add('verborgen'); };

    function handleKaartCreatie(printDirect) {
        if (huidigeSpelItems.length === 0) {
            alert('Kies eerst een spelmodus en niveau.'); return;
        }
        if (huidigeSpelItems.length < 25) {
            toonKeuzeModal(huidigeSpelItems.length, (kaartGrootte, vulAan) => {
                const html = genereerPrintbarePagina(kaartGrootte, vulAan);
                if (html) openPrintVenster(html, printDirect);
            });
        } else {
            const html = genereerPrintbarePagina(5, false);
            if (html) openPrintVenster(html, printDirect);
        }
    }

    function openPrintVenster(paginaHTML, printDirect) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(paginaHTML);
        printWindow.document.close();
        if (printDirect) {
            printWindow.focus();
            setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
        }
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

    function activeerSpel(levelNaam, items, isGetal = false) {
        huidigeSpelItems = [...items];
        isGetallenSpel = isGetal;
        spelWrapper.classList.remove('verborgen');
        titel.textContent = levelNaam;
        initSpelbord();
    }

    function initSpelbord() {
        teTrekkenItems = [...huidigeSpelItems];
        itemsOverzichtDiv.innerHTML = '';
        ballenBandDiv.innerHTML = '';
        startKnop.disabled = huidigeSpelItems.length === 0;
        if (huidigeSpelItems.length === 0) {
            itemsOverzichtDiv.innerHTML = '<span>Geen items gevonden voor deze selectie.</span>';
            return;
        }
        huidigeSpelItems.forEach(item => {
            const itemSpan = document.createElement('span');
            itemSpan.textContent = item;
            itemSpan.id = `item-${item}`;
            itemsOverzichtDiv.appendChild(itemSpan);
        });
        const kleuren = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c'];
        const geschuddeItems = [...huidigeSpelItems].sort(() => Math.random() - 0.5);
        const ballenLijst = [...geschuddeItems, ...geschuddeItems, ...geschuddeItems];
        ballenBandDiv.innerHTML = '';
        ballenLijst.forEach((item, index) => {
            const balDiv = document.createElement('div');
            balDiv.className = 'bal';
            balDiv.textContent = isGetallenSpel ? ontleedGetal(item) : item;
            balDiv.style.backgroundColor = kleuren[index % kleuren.length];
            balDiv.dataset.item = item;
            ballenBandDiv.appendChild(balDiv);
        });
        ballenBandDiv.style.transition = 'none';
        ballenBandDiv.style.transform = 'translateX(0px)';
        void ballenBandDiv.offsetWidth; 
        ballenBandDiv.style.transition = 'transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)';
    }
    
    // --- EVENT LISTENERS ---
    kiesAviKnop.addEventListener('click', () => {
        aviSelectieDiv.classList.toggle('verborgen');
        getalSelectieDiv.classList.add('verborgen');
        aviStartSubkeuzeDiv.classList.add('verborgen');
        aviStartKlankkeuzeDiv.classList.add('verborgen');
    });

    kiesGetalKnop.addEventListener('click', () => {
        getalSelectieDiv.classList.toggle('verborgen');
        aviSelectieDiv.classList.add('verborgen');
        aviStartSubkeuzeDiv.classList.add('verborgen');
        aviStartKlankkeuzeDiv.classList.add('verborgen');
    });

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
            } else {
                activeerSpel(level, woordenLijsten[level]);
            }
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
        if(klankKiezerDiv.dataset.mode === "letters") {
             activeerSpel("AVI Start (Klanken)", geselecteerde);
        } else {
            const gefilterdeWoorden = woordenLijsten["AVI-START"].filter(woord => {
                let tempWoord = woord;
                for (const klank of geselecteerde.sort((a,b) => b.length - a.length)) {
                    tempWoord = tempWoord.split(klank).join('');
                }
                return tempWoord.length === 0;
            });
            activeerSpel("AVI Start (Woorden)", gefilterdeWoorden);
        }
        aviStartKlankkeuzeDiv.classList.add('verborgen');
    });

    document.querySelectorAll('.getal-knop').forEach(knop => {
        knop.addEventListener('click', (e) => {
            const max = parseInt(e.target.dataset.max);
            const getallenLijst = Array.from({length: max}, (_, i) => i + 1);
            activeerSpel(`Getallen tot ${max}`, getallenLijst, true);
        });
    });
    
    pdfKnop.addEventListener('click', () => handleKaartCreatie(false));
    drukKnop.addEventListener('click', () => handleKaartCreatie(true));
    
    startKnop.addEventListener('click', () => {
        if (teTrekkenItems.length === 0) { alert("Alle items zijn geweest!"); startKnop.disabled = true; return; }
        startKnop.disabled = true;
        const randomIndex = Math.floor(Math.random() * teTrekkenItems.length);
        const gekozenItem = teTrekkenItems.splice(randomIndex, 1)[0];
        const alleBallen = document.querySelectorAll('.bal');
        let doelBal = null;
        for (let i = huidigeSpelItems.length; i < huidigeSpelItems.length * 2; i++) {
            if (alleBallen[i]?.dataset.item == gekozenItem) { doelBal = alleBallen[i]; break; }
        }
        if (!doelBal) { doelBal = document.querySelector(`.bal[data-item="${gekozenItem}"]`); }
        if (doelBal) {
            const machineBreedte = machineDiv.offsetWidth;
            const doelPositie = doelBal.offsetLeft + (doelBal.offsetWidth / 2);
            const schuifAfstand = (machineBreedte / 2) - doelPositie;
            ballenBandDiv.style.transform = `translateX(${schuifAfstand}px)`;
        }
        setTimeout(() => {
            const itemSpan = document.getElementById(`item-${gekozenItem}`);
            if(itemSpan) itemSpan.classList.add('is-geweest');
            if (teTrekkenItems.length > 0) { startKnop.disabled = false; }
            else { alert("Alle items van dit niveau zijn geweest!"); }
        }, 4000);
    });
});
document.addEventListener('DOMContentLoaded', () => {

    const woordCategorieen = {
        "AVI-M3": {
            "Vrije Woorden": ["maan", "roos", "vis", "pen", "sok", "boom", "boot", "vuur", "koek", "zeep", "huis", "duif", "kous", "hout", "jas", "dag", "weg", "lach", "ring", "bank", "vang", "plank", "zon", "zee", "zus", "de", "ik", "en", "een", "is", "in", "an", "doos", "doek", "buik", "hij", "zij", "wij", "nee", "ja", "jet", "zeg", "jij", "bij", "heuvel", "nieuw", "schip", "klink", "boos", "tuin", "pijn", "fijn"],
            "ei-ij": ["pijn", "fijn", "klein", "trein", "reis", "ijs", "bij", "tijd", "krijg", "blijf", "lijn", "mijn", "zijn", "wij", "zij", "geit", "zeil", "plein", "kei", "mei", "wei", "dweil"],
            "au-ou": ["goud", "zout", "touw", "koud", "oud", "blauw", "pauw", "saus", "touw", "vrouw", "bouw", "nou", "jou", "zou", "hout", "stout", "fout", "zout", "bout", "gauw", "klauw", "flauw", "benauwd"]
        },
        "AVI-E3": {
            "Vrije Woorden": ["school", "vriend", "fiets", "groen", "lacht", "naar", "straat", "plant", "groeit", "vogel", "fluit", "schat", "zoekt", "onder", "steen", "vindt", "niks", "draak", "sprookje", "woont", "kasteel", "prinses", "redt", "hem", "eerst", "dan", "later", "eind", "goed", "al", "sneeuw", "wit", "koud", "winter", "schaatsen", "ijs", "pret", "warm", "chocolademelk", "koekje", "erbij", "blij", "schijnt", "lucht", "blauw", "wolk", "drijft", "zacht", "wind"],
            "sch-schr": ["school", "schat", "schip", "schaap", "schuur", "schort", "schrik", "schrijf", "schram", "schrap", "schroef", "scherm", "scherf", "scherp", "schets", "scheur", "schijn", "schik", "schil", "schim", "schok", "schol", "schop", "schor", "schot", "schouw", "schub", "schud", "schuin", "schuit", "schuim", "schreeuw", "schrift"],
            "2-medeklinkers-vooraan": ["groen", "straat", "plant", "vriend", "fluit", "draak", "prinses", "sneeuw", "zwaan", "broek", "brief", "klok", "kleur", "sport", "steen", "stoel", "trein", "trots", "zwart", "zweet", "klimt", "groeit", "drijft", "vliegt", "krab", "gras", "stap", "snel", "trap", "blauw", "brand", "drink", "fruit", "glans", "knop", "plank", "snoep", "spook", "stoep", "vlecht", "zwaai"],
            "2-medeklinkers-achteraan": ["vriend", "plant", "lacht", "vindt", "eerst", "koud", "winter", "warm", "lucht", "zacht", "hond", "mand", "mond", "wind", "paard", "woord", "brood", "hand", "land", "strand", "kunst", "herfst", "post", "feest", "helpt", "werkt", "fietst", "leest", "hoest", "dorst", "worst", "hart", "kort", "sterk", "markt", "berg", "zorgt", "verft", "werpt", "durft", "erwt", "golf", "wolf"]
        },
        "AVI-M4": {
            "Vrije Woorden": ["zwaaien", "leeuw", "meeuw", "sneeuw", "nieuw", "geeuw", "schreeuw", "kooi", "haai", "vlaai", "prooi", "draai", "kraai", "strooi", "mooi", "groei", "bloei", "vloei", "spring", "breng", "kring", "zing", "ding", "bang", "stang", "wang", "streng", "jong", "tong", "zong", "lang", "hang", "plank", "slank", "vonk", "dronk", "stank", "bank", "duw", "sluw", "ruw", "uw", "gloei", "foei", "boei", "ai", "ui", "ei", "eeuw", "ieuw"],
            "samenstellingen": ["leesboek", "voetbal", "zeester", "ijsbeer", "boomhut", "tuinhuis", "eetkamer", "speelgoed", "handtas", "zakdoek", "postzegel", "huisdeur", "keukenraam", "fietspad", "treinreis"],
            "eeuw-ieuw": ["sneeuw", "meeuw", "leeuw", "geeuw", "schreeuw", "nieuw", "kieuw", "eeuwenlang", "meeuwennest", "nieuwtje", "kieuwspleet", "sneeuwwit", "leeuwenkop", "schreeuwlelijk", "spiksplinternieuw", "eeuwig", "benieuwd", "hernieuwd", "sneeuwen", "geeuwen", "schreeuwen", "vernieuwen"],
            "ng-nk": ["bang", "bank", "tang", "tank", "lang", "slank", "zang", "zink", "ring", "rink", "ding", "pink", "zing", "zink", "jong", "dronk", "stang", "stank", "breng", "denk", "spring", "plank", "wang", "vonk", "zong", "klonk", "hang", "hink", "kring", "wenk", "streng", "schonk", "zwenk", "drang", "dank", "flank", "jengel", "stinken", "slang", "vonken", "wrongel", "flink"],
            "3-medeklinkers-vooraan": ["straat", "stroop", "sprookje", "spring", "stroom", "schrijf", "schrik", "schram", "schrap", "schroef", "schroot", "schril", "schrob", "schrok", "schrompel", "schreeuw", "schrift", "schrijver", "spruit", "spreuk", "splinter", "strik", "streng", "strak", "strop", "spriet", "spraak", "spreken", "springen", "sproeien", "sprak", "straf", "strand", "streek", "streep", "stroef", "strook", "struik", "struis", "stropdas"],
            "verkleinwoorden-je": ["visje", "aapje", "zusje", "briefje", "koekje", "huisje", "muisje", "plantje", "kaartje", "staartje", "dingetje", "koninkje", "mannetje", "karretje", "pennetje", "zonnetje", "sterretje", "wagentje", "bloemetje", "ringetje", "kettinkje", "brilletje", "plankje", "mandje", "hondje", "paardje", "schaapje", "boekje"],
            "verkleinwoorden-tje": ["stoeltje", "steentje", "treintje", "plantje", "staartje", "tafeltje", "fietsje", "bootje", "hartje", "feestje", "kunstje", "krantje", "draakje", "schooltje", "snoepje", "kroontje", "dorpje", "armpje", "wormpje", "tuintje", "beentje", "bloemetje", "oortje", "deurtje", "raampje", "boompje"],
            "verkleinwoorden-pje": ["boompje", "raampje", "bloempje", "duimpje", "lampje", "armpje", "wormpje", "filmpje", "riempje", "kraampje", "stoompje", "zwempje", "klimpje", "schuimpje", "crempje", "drempeltje", "stempeltje", "schimmeltje", "rimpeltje", "trommeltje", "schommeltje", "boompje", "raampje", "bloempje", "duimpje", "lampje", "armpje", "wormpje", "filmpje", "riempje", "kraampje", "stoompje", "zwempje", "klimpje", "schuimpje"]
        },
        "AVI-E4": {
            "Vrije Woorden": ["bezoek", "gevaar", "verkeer", "verhaal", "gebak", "bestek", "geluk", "getal", "gezin", "begin", "beton", "beroep", "geheim", "geduld", "verstand", "verkoop", "ontbijt", "ontdek", "ontwerp", "ontvang", "ontmoet", "herhaal", "herken", "herfst", "achtig", "plechtig", "krachtig", "zestig", "zinnig", "koppig", "lastig", "smelt", "helpt", "werkt", "fietst", "lacht", "drinkt", "zwaait", "geloof", "gebeurt", "betaal", "vergeet", "verlies", "geniet", "gevoel", "gebruik", "verrassing", "beleef", "vertrouw", "verdien", "ontsnap"],
            "samenstellingen": ["rugzak", "speeltuin", "broekzak", "schatkist", "regenboog", "verkeerslicht", "boekenwurm", "kinderstoel", "waterfiets", "slaapkamer", "vliegtuig", "voordeur", "tafelpoot"],
            "3-medeklinkers-achteraan": ["herfst", "scherpst", "ergst", "korst", "barst", "dorst", "vorst", "ernst", "kunst", "angst", "hengst", "last", "list", "meest", "mist", "nest", "pest", "post", "rust", "test", "vest", "west", "worst", "geest", "haast", "hoest", "juist", "kerst", "kist", "kust", "kwast", "kwist", "leest", "lijst", "lust", "meest", "mest", "mist", "nest", "pest", "post", "rust", "test", "vest", "west", "worst"]
        },
        "AVI-M5": { "Vrije Woorden": ["vrolijk", "moeilijk", "eerlijk", "gevaarlijk", "heerlijk", "dagelijks", "eindelijk", "vriendelijk", "lelijk", "afschuwelijk", "persoonlijk", "landelijk", "tijdelijk", "ordelijk", "duidelijk", "eigenlijk", "schadelijk", "mogelijk", "onmogelijk", "waarschijnlijk", "thee", "koffie", "taxi", "menu", "baby", "hobby", "pony", "jury", "bureau", "cadeau", "plateau", "niveau", "station", "actie", "politie", "vakantie", "informatie", "traditie", "positie", "conditie", "chauffeur", "douche", "machine", "chef", "journaal", "restaurant", "trottoir", "horloge", "garage", "bagage"] },
        "AVI-E5": { "Vrije Woorden": ["bibliotheek", "interessant", "temperatuur", "onmiddellijk", "belangrijk", "elektrisch", "verschillende", "eigenlijk", "omgeving", "gebeurtenis", "ervaring", "industrie", "internationaal", "communicatie", "organisatie", "president", "discussie", "officieel", "traditioneel", "automatisch", "fotograaf", "enthousiast", "atmosfeer", "categorie", "laboratorium", "journalist", "architect", "kampioenschap", "psycholoog", "helikopter", "paraplu", "professor", "abonnement", "encyclopedie", "ceremonie", "chocolade", "concert", "dinosaurus", "expeditie", "fantasie", "generatie", "instrument", "kritiek", "literatuur", "medicijn", "museum", "operatie", "populair", "respect", "signaal"] }
    };
    const alleMoeilijkheden = { "Vrije Woorden": "Alle woorden van het gekozen niveau", "ei-ij": "Woorden met ei en ij", "au-ou": "Woorden met au en ou", "eeuw-ieuw": "Woorden met eeuw en ieuw", "ng-nk": "Woorden met ng en nk", "sch-schr": "Woorden met sch en schr", "2-medeklinkers-vooraan": "2 medeklinkers vooraan", "2-medeklinkers-achteraan": "2 medeklinkers achteraan", "3-medeklinkers-vooraan": "3 medeklinkers vooraan", "3-medeklinkers-achteraan": "3 medeklinkers achteraan", "samenstellingen": "Samenstellingen", "verkleinwoorden-je": "Verkleinwoorden op -je", "verkleinwoorden-tje": "Verkleinwoorden op -tje", "verkleinwoorden-pje": "Verkleinwoorden op -pje" };
    const aviOrder = ["AVI-M3", "AVI-E3", "AVI-M4", "AVI-E4", "AVI-M5", "AVI-E5"];
    
    let gekozenSpeltype = null;
    let geselecteerdeGetallenLijst = [];

    const kiesWoordenKnop = document.getElementById('kies-woorden-knop');
    const kiesGetallenKnop = document.getElementById('kies-getallen-knop');
    const woordenOptiesDiv = document.getElementById('woorden-opties');
    const getallenOptiesDiv = document.getElementById('getallen-opties');
    const aviNiveauSelect = document.getElementById('avi-niveau');
    const moeilijkheidCheckboxesDiv = document.getElementById('moeilijkheid-checkboxes');
    const genereerBordKnop = document.getElementById('genereer-bord-knop');

    function formatteerGetal(getal) {
        if (getal === 0) return '0E';

        const h = Math.floor(getal / 100);
        const t = Math.floor((getal % 100) / 10);
        const e = getal % 10;

        const parts = [];
        if (h > 0) parts.push(`${h}H`);
        if (t > 0) parts.push(`${t}T`);
        if (e > 0 || getal === 0) parts.push(`${e}E`);

        if (parts.length === 0) {
             if (h > 0) return `${h}H`;
             if (t > 0) return `${t}T`;
        }

        return parts.join(' ');
    }

    function genereerPrintbarePagina(bordHTML) {
        const printStyles = `
            <style>
                @page { size: A4 landscape; margin: 1cm; }
                html, body { height: 100%; margin: 0; padding: 0; font-family: sans-serif; background-color: #eee; }
                @media screen {
                    .actie-balk { display: block; position: fixed; top: 0; left: 0; width: 100%; padding: 10px; text-align: center; background: #333; z-index: 10; box-shadow: 0 2px 5px rgba(0,0,0,0.3); }
                    .actie-balk button { font-size:16px; padding:10px 20px; border-radius: 5px; border: none; background: #3498db; color: white; cursor: pointer; margin: 0 5px; }
                    .actie-balk button#download-pdf-knop { background: #2ecc71; }
                    .actie-balk button:last-child { background: #95a5a6; }
                    body { display: flex; justify-content: center; align-items: center; box-sizing: border-box; padding-top: 60px; }
                }
                @media print {
                    .actie-balk { display: none; }
                    body { background-color: transparent; }
                    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
                .bord-container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
                .vier-op-rij-bord { display: grid; grid-template-columns: repeat(7, 1fr); grid-template-rows: repeat(6, 1fr); gap: 8px; aspect-ratio: 7 / 6; max-width: 100%; max-height: 100%; background-color: #005f73; padding: 10px; border-radius: 15px; border: 5px solid #0a9396; box-sizing: border-box; }
                .spel-vakje { position: relative; width: 100%; height: 100%; background-color: #e9d8a6; border-radius: 50%; display: flex; justify-content: center; align-items: center; }
                .spel-vakje .tekst { color: #333; font-weight: bold; font-size: clamp(8pt, 2.5vmin, 14pt); text-align: center; word-break: break-word; padding: 4px; box-sizing: border-box; }
            </style>
        `;

        const actieKnoppenHTML = `
            <div class="actie-balk">
                <button onclick="window.print()">🖨️ Afdrukken</button>
                <button id="download-pdf-knop">📄 Download als PDF</button>
                <button onclick="window.close()">❌ Sluiten</button>
            </div>`;
        
        const containerHTML = `<div class="bord-container">${bordHTML}</div>`;

        const pdfScript = `
            <script>
                window.onload = () => {
                    const downloadKnop = document.getElementById('download-pdf-knop');
                    const bordElement = document.querySelector('.vier-op-rij-bord');

                    downloadKnop.addEventListener('click', () => {
                        downloadKnop.textContent = 'Bezig met genereren...';
                        downloadKnop.disabled = true;

                        html2canvas(bordElement, { scale: 3, useCORS: true })
                            .then(canvas => {
                                const imgData = canvas.toDataURL('image/png');
                                const { jsPDF } = window.jspdf;
                                const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

                                const margin = 10;
                                const pdfWidth = pdf.internal.pageSize.getWidth();
                                const pdfHeight = pdf.internal.pageSize.getHeight();
                                const availableWidth = pdfWidth - (margin * 2);
                                const availableHeight = pdfHeight - (margin * 2);
                                
                                const aspectRatio = 7 / 6;
                                let imgWidth = availableWidth;
                                let imgHeight = imgWidth / aspectRatio;

                                if (imgHeight > availableHeight) {
                                    imgHeight = availableHeight;
                                    imgWidth = imgHeight * aspectRatio;
                                }

                                const x = margin + (availableWidth - imgWidth) / 2;
                                const y = margin + (availableHeight - imgHeight) / 2;
                                
                                pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
                                pdf.save('4-op-een-rij-spelbord.pdf');
                            })
                            .catch(error => {
                                console.error('Fout bij het genereren van de PDF:', error);
                                alert('Er is een fout opgetreden bij het genereren van de PDF. Controleer de console voor details.');
                            })
                            .finally(() => {
                                downloadKnop.textContent = '📄 Download als PDF';
                                downloadKnop.disabled = false;
                            });
                    });
                };
            </script>
        `;

        return `
            <html>
                <head>
                    <title>4-op-een-Rij Spelbord</title>
                    ${printStyles}
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"><\/script>
                </head>
                <body>
                    ${actieKnoppenHTML}
                    ${containerHTML}
                    ${pdfScript}
                </body>
            </html>`;
    }

    function genereerSpelbord() {
        let itemList = [];
        if (gekozenSpeltype === 'woorden') {
            const avi = aviNiveauSelect.value;
            const geselecteerdeCheckboxes = document.querySelectorAll('#moeilijkheid-checkboxes input:checked');
            if (!avi || geselecteerdeCheckboxes.length === 0) {
                alert('Kies a.u.b. een AVI-niveau en minstens één moeilijkheid.');
                return;
            }
            const uniekeWoorden = new Set();
            const geselecteerdeIndex = aviOrder.indexOf(avi);
            const relevanteNiveaus = aviOrder.slice(0, geselecteerdeIndex + 1);
            geselecteerdeCheckboxes.forEach(checkbox => {
                const moeilijkheid = checkbox.value;
                relevanteNiveaus.forEach(niveau => {
                    if (woordCategorieen[niveau] && woordCategorieen[niveau][moeilijkheid]) {
                        woordCategorieen[niveau][moeilijkheid].forEach(woord => uniekeWoorden.add(woord));
                    }
                });
            });
            itemList = [...uniekeWoorden];
        } else if (gekozenSpeltype === 'getallen') {
            itemList = geselecteerdeGetallenLijst;
        }

        // --- AANGEPAST: Controleer alleen of de lijst leeg is, niet of er 42 unieke items zijn. ---
        if (!itemList || itemList.length === 0) {
            alert(`Er zijn geen items geselecteerd. Kies een categorie of een getallenreeks.`);
            return;
        }

        // --- AANGEPAST: Nieuwe logica om het bord te vullen, met herhalingen indien nodig. ---
        let teVullenItems = [];
        // Blijf de bronlijst toevoegen totdat we zeker 42 items hebben
        while (teVullenItems.length < 42) {
            teVullenItems.push(...itemList);
        }

        // Schud de volledige lijst en neem de eerste 42 items
        const geschuddeItems = teVullenItems.sort(() => Math.random() - 0.5);
        const bordItems = geschuddeItems.slice(0, 42);
        
        let bordHTML = '<div class="vier-op-rij-bord">';
        for (const item of bordItems) {
            bordHTML += `<div class="spel-vakje"><div class="tekst">${item}</div></div>`;
        }
        bordHTML += '</div>';

        const printPagina = genereerPrintbarePagina(bordHTML);
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printPagina);
        printWindow.document.close();
    }

    function vulAviNiveaus() {
        aviNiveauSelect.innerHTML = '<option value="">-- Kies een niveau --</option>';
        for (const niveau of aviOrder) {
            aviNiveauSelect.innerHTML += `<option value="${niveau}">${niveau}</option>`;
        }
    }

    function vulMoeilijkheidCheckboxes() {
        const geselecteerdNiveau = aviNiveauSelect.value;
        moeilijkheidCheckboxesDiv.innerHTML = '';
        if (!geselecteerdNiveau) return;
        const geselecteerdeIndex = aviOrder.indexOf(geselecteerdNiveau);
        const relevanteNiveaus = aviOrder.slice(0, geselecteerdeIndex + 1);
        for (const moeilijkheid in alleMoeilijkheden) {
            const leesbareNaam = alleMoeilijkheden[moeilijkheid].split('(')[0].trim();
            let isBeschikbaar = false;
            for (const niveau of relevanteNiveaus) {
                if (woordCategorieen[niveau] && woordCategorieen[niveau][moeilijkheid]) {
                    isBeschikbaar = true;
                    break;
                }
            }
            const checkboxHTML = `
                <div class="checkbox-container ${!isBeschikbaar ? 'disabled' : ''}">
                    <input type="checkbox" id="check-${moeilijkheid}" name="moeilijkheid" value="${moeilijkheid}" ${!isBeschikbaar ? 'disabled' : ''}>
                    <label for="check-${moeilijkheid}" title="${alleMoeilijkheden[moeilijkheid]}">${leesbareNaam}</label>
                </div>`;
            moeilijkheidCheckboxesDiv.innerHTML += checkboxHTML;
        }
    }

    kiesWoordenKnop.addEventListener('click', () => {
        gekozenSpeltype = 'woorden';
        kiesWoordenKnop.classList.add('active');
        kiesGetallenKnop.classList.remove('active');
        woordenOptiesDiv.classList.remove('verborgen');
        getallenOptiesDiv.classList.add('verborgen');
        genereerBordKnop.classList.remove('verborgen');
    });

    kiesGetallenKnop.addEventListener('click', () => {
        gekozenSpeltype = 'getallen';
        kiesGetallenKnop.classList.add('active');
        kiesWoordenKnop.classList.remove('active');
        getallenOptiesDiv.classList.remove('verborgen');
        woordenOptiesDiv.classList.add('verborgen');
        genereerBordKnop.classList.add('verborgen'); 
    });
    
    document.querySelectorAll('.getal-knop').forEach(knop => {
        knop.addEventListener('click', (e) => {
            document.querySelectorAll('.getal-knop').forEach(k => k.classList.remove('active'));
            e.target.classList.add('active');
            const max = parseInt(e.target.dataset.max);
            
            geselecteerdeGetallenLijst = Array.from({length: max}, (_, i) => formatteerGetal(i + 1));

            genereerBordKnop.classList.remove('verborgen');
        });
    });

    aviNiveauSelect.addEventListener('change', vulMoeilijkheidCheckboxes);
    genereerBordKnop.addEventListener('click', genereerSpelbord);

    vulAviNiveaus();
});
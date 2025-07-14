document.addEventListener('DOMContentLoaded', () => {
    // --- Algemene Variabelen en Elementen ---
    const ALFABET = 'ABCDEFGHIJKLMNOPRSTUVWZ';
    const AANTAL_LETTERS = 23;
    const sleutel = new Map();

    const setupScherm = document.getElementById('setup-scherm');
    const generatorScherm = document.getElementById('generator-scherm');
    const uploadGrid = document.getElementById('upload-grid');
    const naarGeneratorKnop = document.getElementById('naar-generator-knop');
    const terugNaarSetupKnop = document.getElementById('terug-naar-setup-knop');
    const genereerKnop = document.getElementById('genereer-knop');
    const opnieuwBeginnenKnop = document.getElementById('opnieuw-beginnen-knop');
    const boodschapInput = document.getElementById('boodschap-input');
    const outputContainer = document.getElementById('output-container');
    const sleutelOverzicht = document.getElementById('sleutel-overzicht');
    const downloadSectie = document.getElementById('download-sectie');
    const downloadPngKnop = document.getElementById('download-png-knop');
    const downloadPdfKnop = document.getElementById('download-pdf-knop');

    // Nieuwe elementen voor themakeuze
    const zelfUploadenKnop = document.getElementById('zelf-uploaden-knop');
    const themaKiezenKnop = document.getElementById('thema-kiezen-knop');
    const keuzeOptiesDiv = document.querySelector('.keuze-opties'); // Selecteer de container van de keuze knoppen
    const uploadSectie = document.getElementById('upload-sectie');
    const themaSectie = document.getElementById('thema-sectie');
    const themaKnoppen = document.querySelectorAll('.thema-knop');
    const themaNaarGeneratorKnop = document.getElementById('thema-naar-generator-knop');
    const terugNaarUploadKnop = document.getElementById('terug-naar-upload-knop');
    const terugNaarThemasKnop = document.getElementById('terug-naar-themas-knop'); // NIEUW: Terug naar thema's knop hier toevoegen

    // --- INITIALISATIEFUNCTIE ---
    // Deze functie zorgt ervoor dat bij start of reset de juiste elementen zichtbaar zijn
    function resetSetupScherm() {
        setupScherm.classList.remove('verborgen');
        generatorScherm.classList.add('verborgen');
        downloadSectie.classList.add('verborgen');

        keuzeOptiesDiv.classList.remove('verborgen'); // Toon de initiële keuze-knoppen
        uploadSectie.classList.add('verborgen');     // Verberg de upload sectie
        themaSectie.classList.add('verborgen');      // Verberg de thema keuze sectie
        terugNaarThemasKnop.classList.add('verborgen'); // NIEUW: Verberg deze knop bij reset

        // Reset sleutel en previews
        sleutel.clear();
        document.querySelectorAll('.image-preview').forEach(img => img.src = '');
        document.querySelectorAll('.image-upload').forEach(input => input.value = ''); // Maak file inputs leeg
        naarGeneratorKnop.disabled = true;
        themaNaarGeneratorKnop.disabled = true;
    }

    // Roep de initialisatiefunctie aan bij DOMContentLoaded
    resetSetupScherm();

    // --- SETUP SCHERM LOGICA ---

    // Event listeners voor keuze-knoppen
    zelfUploadenKnop.addEventListener('click', () => {
        uploadSectie.classList.remove('verborgen'); // Toon de upload sectie
        themaSectie.classList.add('verborgen');
        keuzeOptiesDiv.classList.add('verborgen'); // Verberg de keuze-knoppen container
        terugNaarThemasKnop.classList.add('verborgen'); // NIEUW: Zorg dat deze verborgen blijft als je zelf uploadt
    });

    themaKiezenKnop.addEventListener('click', () => {
        themaSectie.classList.remove('verborgen'); // Toon de thema keuze sectie
        uploadSectie.classList.add('verborgen'); // Verberg de upload sectie (wordt later getoond)
        keuzeOptiesDiv.classList.add('verborgen'); // Verberg de keuze-knoppen container
        terugNaarThemasKnop.classList.add('verborgen'); // NIEUW: Zorg dat deze verborgen is wanneer thema's gekozen worden
    });

    terugNaarUploadKnop.addEventListener('click', () => {
        themaSectie.classList.add('verborgen');
        uploadSectie.classList.add('verborgen'); // Verberg upload sectie bij teruggaan
        keuzeOptiesDiv.classList.remove('verborgen'); // Toon de keuze-knoppen weer
        terugNaarThemasKnop.classList.add('verborgen'); // NIEUW: Verberg deze knop bij terug naar start

        // Reset de sleutel en previews
        sleutel.clear();
        document.querySelectorAll('.image-preview').forEach(img => img.src = '');
        document.querySelectorAll('.image-upload').forEach(input => input.value = ''); // Maak file inputs leeg
        naarGeneratorKnop.disabled = true;
        themaNaarGeneratorKnop.disabled = true;
    });

    // NIEUW: Event listener voor 'Terug naar thema's' knop hier toevoegen
    terugNaarThemasKnop.addEventListener('click', () => {
        // Reset de sleutel en previews (optioneel, afhankelijk van gewenste user experience)
        sleutel.clear();
        document.querySelectorAll('.image-preview').forEach(img => img.src = '');
        document.querySelectorAll('.image-upload').forEach(input => input.value = ''); // Maak file inputs leeg
        naarGeneratorKnop.disabled = true; // Zorg dat de "Maak geheime boodschap" knop uitgeschakeld is

        uploadSectie.classList.add('verborgen');     // Verberg de upload sectie
        themaSectie.classList.remove('verborgen');   // Toon de thema selectie sectie
        terugNaarThemasKnop.classList.add('verborgen'); // Verberg deze knop weer
    });

    // 1. Maak de 23 upload-zones
    ALFABET.split('').forEach(letter => {
        const zone = document.createElement('div');
        zone.className = 'upload-zone';
        zone.innerHTML = `
            <span class="letter">${letter}</span>
            <img id="preview-${letter}" class="image-preview" src="">
            <input type="file" id="upload-${letter}" class="image-upload" data-letter="${letter}" accept="image/*">
        `;
        uploadGrid.appendChild(zone);
    });

    // 2. Voeg event listener toe aan alle upload-knoppen
    document.querySelectorAll('.image-upload').forEach(input => {
        input.addEventListener('change', (event) => {
            const file = event.target.files[0];
            const letter = event.target.dataset.letter;
            if (file && letter) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const dataURL = e.target.result;
                    document.getElementById(`preview-${letter}`).src = dataURL;
                    sleutel.set(letter, dataURL);
                    if (sleutel.size === AANTAL_LETTERS) {
                        naarGeneratorKnop.disabled = false;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    });

    // Logica voor themakeuze
    themaKnoppen.forEach(button => {
        button.addEventListener('click', (event) => {
            const thema = event.target.dataset.thema;
            laadThemaAfbeeldingen(thema);
            // Na het kiezen van een thema, toon de upload-sectie om de geladen afbeeldingen te tonen
            uploadSectie.classList.remove('verborgen');
            themaSectie.classList.add('verborgen'); // Verberg de thema-keuze knoppen
            terugNaarThemasKnop.classList.remove('verborgen'); // NIEUW: Toon 'Terug naar thema's' knop hier toevoegen
        });
    });

    function laadThemaAfbeeldingen(thema) {
        // Leeg de huidige sleutel
        sleutel.clear();
        // Reset alle previews naar leeg
        document.querySelectorAll('.image-preview').forEach(img => img.src = '');
        // Leeg ook de file inputs, zodat deze niet "bezet" lijken
        document.querySelectorAll('.image-upload').forEach(input => input.value = '');


        // Hier definieer je de paden naar je thema-afbeeldingen.
        // Zorg ervoor dat de paden correct zijn en verwijzen naar de afbeeldingen op je server.
        const themaAfbeeldingen = {
            Sinterklaas: {
                A: 'thema_afbeeldingen/Sinterklaas/A.png',
                B: 'thema_afbeeldingen/Sinterklaas/B.png',
                C: 'thema_afbeeldingen/Sinterklaas/C.png',
                D: 'thema_afbeeldingen/Sinterklaas/D.png',
                E: 'thema_afbeeldingen/Sinterklaas/E.png',
                F: 'thema_afbeeldingen/Sinterklaas/F.png',
                G: 'thema_afbeeldingen/Sinterklaas/G.png',
                H: 'thema_afbeeldingen/Sinterklaas/H.png',
                I: 'thema_afbeeldingen/Sinterklaas/I.png',
                J: 'thema_afbeeldingen/Sinterklaas/J.png',
                K: 'thema_afbeeldingen/Sinterklaas/K.png',
                L: 'thema_afbeeldingen/Sinterklaas/L.png',
                M: 'thema_afbeeldingen/Sinterklaas/M.png',
                N: 'thema_afbeeldingen/Sinterklaas/N.png',
                O: 'thema_afbeeldingen/Sinterklaas/O.png',
                P: 'thema_afbeeldingen/Sinterklaas/P.png',
                R: 'thema_afbeeldingen/Sinterklaas/R.png',
                S: 'thema_afbeeldingen/Sinterklaas/S.png',
                T: 'thema_afbeeldingen/Sinterklaas/T.png',
                U: 'thema_afbeeldingen/Sinterklaas/U.png',
                V: 'thema_afbeeldingen/Sinterklaas/V.png',
                W: 'thema_afbeeldingen/Sinterklaas/W.png',
                Z: 'thema_afbeeldingen/Sinterklaas/Z.png'
            },
            herfst: {
                A: 'thema_afbeeldingen/herfst/A.png',
                B: 'thema_afbeeldingen/herfst/B.png',
                C: 'thema_afbeeldingen/herfst/C.png',
                D: 'thema_afbeeldingen/herfst/D.png',
                E: 'thema_afbeeldingen/herfst/E.png',
                F: 'thema_afbeeldingen/herfst/F.png',
                G: 'thema_afbeeldingen/herfst/G.png',
                H: 'thema_afbeeldingen/herfst/H.png',
                I: 'thema_afbeeldingen/herfst/I.png',
                J: 'thema_afbeeldingen/herfst/J.png',
                K: 'thema_afbeeldingen/herfst/K.png',
                L: 'thema_afbeeldingen/herfst/L.png',
                M: 'thema_afbeeldingen/herfst/M.png',
                N: 'thema_afbeeldingen/herfst/N.png',
                O: 'thema_afbeeldingen/herfst/O.png',
                P: 'thema_afbeeldingen/herfst/P.png',
                R: 'thema_afbeeldingen/herfst/R.png',
                S: 'thema_afbeeldingen/herfst/S.png',
                T: 'thema_afbeeldingen/herfst/T.png',
                U: 'thema_afbeeldingen/herfst/U.png',
                V: 'thema_afbeeldingen/herfst/V.png',
                W: 'thema_afbeeldingen/herfst/W.png',
                Z: 'thema_afbeeldingen/herfst/Z.png'
            },
            Halloween: {
                A: 'thema_afbeeldingen/Halloween/A.png',
                B: 'thema_afbeeldingen/Halloween/B.png',
                C: 'thema_afbeeldingen/Halloween/C.png',
                D: 'thema_afbeeldingen/Halloween/D.png',
                E: 'thema_afbeeldingen/Halloween/E.png',
                F: 'thema_afbeeldingen/Halloween/F.png',
                G: 'thema_afbeeldingen/Halloween/G.png',
                H: 'thema_afbeeldingen/Halloween/H.png',
                I: 'thema_afbeeldingen/Halloween/I.png',
                J: 'thema_afbeeldingen/Halloween/J.png',
                K: 'thema_afbeeldingen/Halloween/K.png',
                L: 'thema_afbeeldingen/Halloween/L.png',
                M: 'thema_afbeeldingen/Halloween/M.png',
                N: 'thema_afbeeldingen/Halloween/N.png',
                O: 'thema_afbeeldingen/Halloween/O.png',
                P: 'thema_afbeeldingen/Halloween/P.png',
                R: 'thema_afbeeldingen/Halloween/R.png',
                S: 'thema_afbeeldingen/Halloween/S.png',
                T: 'thema_afbeeldingen/Halloween/T.png',
                U: 'thema_afbeeldingen/Halloween/U.png',
                V: 'thema_afbeeldingen/Halloween/V.png',
                W: 'thema_afbeeldingen/Halloween/W.png',
                Z: 'thema_afbeeldingen/Halloween/Z.png'
            },
            Pasen: {
                A: 'thema_afbeeldingen/Pasen/A.png',
                B: 'thema_afbeeldingen/Pasen/B.png',
                C: 'thema_afbeeldingen/Pasen/C.png',
                D: 'thema_afbeeldingen/Pasen/D.png',
                E: 'thema_afbeeldingen/Pasen/E.png',
                F: 'thema_afbeeldingen/Pasen/F.png',
                G: 'thema_afbeeldingen/Pasen/G.png',
                H: 'thema_afbeeldingen/Pasen/H.png',
                I: 'thema_afbeeldingen/Pasen/I.png',
                J: 'thema_afbeeldingen/Pasen/J.png',
                K: 'thema_afbeeldingen/Pasen/K.png',
                L: 'thema_afbeeldingen/Pasen/L.png',
                M: 'thema_afbeeldingen/Pasen/M.png',
                N: 'thema_afbeeldingen/Pasen/N.png',
                O: 'thema_afbeeldingen/Pasen/O.png',
                P: 'thema_afbeeldingen/Pasen/P.png',
                R: 'thema_afbeeldingen/Pasen/R.png',
                S: 'thema_afbeeldingen/Pasen/S.png',
                T: 'thema_afbeeldingen/Pasen/T.png',
                U: 'thema_afbeeldingen/Pasen/U.png',
                V: 'thema_afbeeldingen/Pasen/V.png',
                W: 'thema_afbeeldingen/Pasen/W.png',
                Z: 'thema_afbeeldingen/Pasen/Z.png'
            },
            lente: {
                A: 'thema_afbeeldingen/lente/A.png',
                B: 'thema_afbeeldingen/lente/B.png',
                C: 'thema_afbeeldingen/lente/C.png',
                D: 'thema_afbeeldingen/lente/D.png',
                E: 'thema_afbeeldingen/lente/E.png',
                F: 'thema_afbeeldingen/lente/F.png',
                G: 'thema_afbeeldingen/lente/G.png',
                H: 'thema_afbeeldingen/lente/H.png',
                I: 'thema_afbeeldingen/lente/I.png',
                J: 'thema_afbeeldingen/lente/J.png',
                K: 'thema_afbeeldingen/lente/K.png',
                L: 'thema_afbeeldingen/lente/L.png',
                M: 'thema_afbeeldingen/lente/M.png',
                N: 'thema_afbeeldingen/lente/N.png',
                O: 'thema_afbeeldingen/lente/O.png',
                P: 'thema_afbeeldingen/lente/P.png',
                R: 'thema_afbeeldingen/lente/R.png',
                S: 'thema_afbeeldingen/lente/S.png',
                T: 'thema_afbeeldingen/lente/T.png',
                U: 'thema_afbeeldingen/lente/U.png',
                V: 'thema_afbeeldingen/lente/V.png',
                W: 'thema_afbeeldingen/lente/W.png',
                Z: 'thema_afbeeldingen/lente/Z.png'
            },
            Carnaval: {
                A: 'thema_afbeeldingen/Carnaval/A.png',
                B: 'thema_afbeeldingen/Carnaval/B.png',
                C: 'thema_afbeeldingen/Carnaval/C.png',
                D: 'thema_afbeeldingen/Carnaval/D.png',
                E: 'thema_afbeeldingen/Carnaval/E.png',
                F: 'thema_afbeeldingen/Carnaval/F.png',
                G: 'thema_afbeeldingen/Carnaval/G.png',
                H: 'thema_afbeeldingen/Carnaval/H.png',
                I: 'thema_afbeeldingen/Carnaval/I.png',
                J: 'thema_afbeeldingen/Carnaval/J.png',
                K: 'thema_afbeeldingen/Carnaval/K.png',
                L: 'thema_afbeeldingen/Carnaval/L.png',
                M: 'thema_afbeeldingen/Carnaval/M.png',
                N: 'thema_afbeeldingen/Carnaval/N.png',
                O: 'thema_afbeeldingen/Carnaval/O.png',
                P: 'thema_afbeeldingen/Carnaval/P.png',
                R: 'thema_afbeeldingen/Carnaval/R.png',
                S: 'thema_afbeeldingen/Carnaval/S.png',
                T: 'thema_afbeeldingen/Carnaval/T.png',
                U: 'thema_afbeeldingen/Carnaval/U.png',
                V: 'thema_afbeeldingen/Carnaval/V.png',
                W: 'thema_afbeeldingen/Carnaval/W.png',
                Z: 'thema_afbeeldingen/Carnaval/Z.png'
            },
            terug_naar_school: {
                A: 'thema_afbeeldingen/terug_naar_school/A.png',
                B: 'thema_afbeeldingen/terug_naar_school/B.png',
                C: 'thema_afbeeldingen/terug_naar_school/C.png',
                D: 'thema_afbeeldingen/terug_naar_school/D.png',
                E: 'thema_afbeeldingen/terug_naar_school/E.png',
                F: 'thema_afbeeldingen/terug_naar_school/F.png',
                G: 'thema_afbeeldingen/terug_naar_school/G.png',
                H: 'thema_afbeeldingen/terug_naar_school/H.png',
                I: 'thema_afbeeldingen/terug_naar_school/I.png',
                J: 'thema_afbeeldingen/terug_naar_school/J.png',
                K: 'thema_afbeeldingen/terug_naar_school/K.png',
                L: 'thema_afbeeldingen/terug_naar_school/L.png',
                M: 'thema_afbeeldingen/terug_naar_school/M.png',
                N: 'thema_afbeeldingen/terug_naar_school/N.png',
                O: 'thema_afbeeldingen/terug_naar_school/O.png',
                P: 'thema_afbeeldingen/terug_naar_school/P.png',
                R: 'thema_afbeeldingen/terug_naar_school/R.png',
                S: 'thema_afbeeldingen/terug_naar_school/S.png',
                T: 'thema_afbeeldingen/terug_naar_school/T.png',
                U: 'thema_afbeeldingen/terug_naar_school/U.png',
                V: 'thema_afbeeldingen/terug_naar_school/V.png',
                W: 'thema_afbeeldingen/terug_naar_school/W.png',
                Z: 'thema_afbeeldingen/terug_naar_school/Z.png'
            },
            Kerst: {
                A: 'thema_afbeeldingen/Kerst/A.png',
                B: 'thema_afbeeldingen/Kerst/B.png',
                C: 'thema_afbeeldingen/Kerst/C.png',
                D: 'thema_afbeeldingen/Kerst/D.png',
                E: 'thema_afbeeldingen/Kerst/E.png',
                F: 'thema_afbeeldingen/Kerst/F.png',
                G: 'thema_afbeeldingen/Kerst/G.png',
                H: 'thema_afbeeldingen/Kerst/H.png',
                I: 'thema_afbeeldingen/Kerst/I.png',
                J: 'thema_afbeeldingen/Kerst/J.png',
                K: 'thema_afbeeldingen/Kerst/K.png',
                L: 'thema_afbeeldingen/Kerst/L.png',
                M: 'thema_afbeeldingen/Kerst/M.png',
                N: 'thema_afbeeldingen/Kerst/N.png',
                O: 'thema_afbeeldingen/Kerst/O.png',
                P: 'thema_afbeeldingen/Kerst/P.png',
                R: 'thema_afbeeldingen/Kerst/R.png',
                S: 'thema_afbeeldingen/Kerst/S.png',
                T: 'thema_afbeeldingen/Kerst/T.png',
                U: 'thema_afbeeldingen/Kerst/U.png',
                V: 'thema_afbeeldingen/Kerst/V.png',
                W: 'thema_afbeeldingen/Kerst/W.png',
                Z: 'thema_afbeeldingen/Kerst/Z.png'
            },
            winter: {
                A: 'thema_afbeeldingen/winter/A.png',
                B: 'thema_afbeeldingen/winter/B.png',
                C: 'thema_afbeeldingen/winter/C.png',
                D: 'thema_afbeeldingen/winter/D.png',
                E: 'thema_afbeeldingen/winter/E.png',
                F: 'thema_afbeeldingen/winter/F.png',
                G: 'thema_afbeeldingen/winter/G.png',
                H: 'thema_afbeeldingen/winter/H.png',
                I: 'thema_afbeeldingen/winter/I.png',
                J: 'thema_afbeeldingen/winter/J.png',
                K: 'thema_afbeeldingen/winter/K.png',
                L: 'thema_afbeeldingen/winter/L.png',
                M: 'thema_afbeeldingen/winter/M.png',
                N: 'thema_afbeeldingen/winter/N.png',
                O: 'thema_afbeeldingen/winter/O.png',
                P: 'thema_afbeeldingen/winter/P.png',
                R: 'thema_afbeeldingen/winter/R.png',
                S: 'thema_afbeeldingen/winter/S.png',
                T: 'thema_afbeeldingen/winter/T.png',
                U: 'thema_afbeeldingen/winter/U.png',
                V: 'thema_afbeeldingen/winter/V.png',
                W: 'thema_afbeeldingen/winter/W.png',
                Z: 'thema_afbeeldingen/winter/Z.png'
            }
        };

        const geselecteerdeThema = themaAfbeeldingen[thema];
        let loadedImageCount = 0; // Tellen hoeveel afbeeldingen succesvol geladen zijn

        if (geselecteerdeThema) {
            // Maak een array van promises voor elke afbeelding
            const imageLoadPromises = ALFABET.split('').map(letter => {
                return new Promise((resolve, reject) => {
                    const imageUrl = geselecteerdeThema[letter];
                    if (imageUrl) {
                        const img = new Image();
                        img.onload = () => {
                            sleutel.set(letter, imageUrl);
                            // Update de preview in de upload-sectie
                            const previewImg = document.getElementById(`preview-${letter}`);
                            if (previewImg) {
                                previewImg.src = imageUrl;
                            }
                            loadedImageCount++;
                            resolve();
                        };
                        img.onerror = () => {
                            console.error(`Afbeelding voor letter ${letter} (thema: ${thema}) niet gevonden: ${imageUrl}`);
                            resolve(); // Resolven zodat Promise.all verdergaat
                        };
                        img.src = imageUrl;
                    } else {
                        console.warn(`Geen afbeelding gevonden voor letter ${letter} in thema ${thema}`);
                        resolve(); // Resolven zodat Promise.all verdergaat
                    }
                });
            });

            // Wacht tot alle afbeeldingen (of pogingen om te laden) klaar zijn
            Promise.all(imageLoadPromises).then(() => {
                if (loadedImageCount === AANTAL_LETTERS) {
                    naarGeneratorKnop.disabled = false;
                    themaNaarGeneratorKnop.disabled = false; // Zorgt dat de knop in thema-sectie werkt
                } else {
                    naarGeneratorKnop.disabled = true;
                    themaNaarGeneratorKnop.disabled = true;
                    alert('Niet alle afbeeldingen voor dit thema konden worden geladen. Controleer de console voor fouten en zorg dat alle afbeeldingen aanwezig zijn.');
                }
            });
        }
    }

    // 3. Knop om naar de generator te gaan (voor zelf uploaden)
    naarGeneratorKnop.addEventListener('click', () => {
        setupScherm.classList.add('verborgen');
        generatorScherm.classList.remove('verborgen');
        toonSleutelOverzicht();
    });

    // Knop om naar de generator te gaan (voor themakeuze)
    themaNaarGeneratorKnop.addEventListener('click', () => {
        setupScherm.classList.add('verborgen');
        generatorScherm.classList.remove('verborgen');
        toonSleutelOverzicht();
    });

    // --- GENERATOR SCHERM LOGICA ---

    function toonSleutelOverzicht() {
        sleutelOverzicht.innerHTML = '';
        const gesorteerdeSleutel = new Map([...sleutel.entries()].sort());
        for (const [letter, dataURL] of gesorteerdeSleutel.entries()) {
            const item = document.createElement('div');
            item.className = 'sleutel-item';
            item.innerHTML = `<b>${letter}</b><br><img src="${dataURL}" alt="${letter}">`;
            sleutelOverzicht.appendChild(item);
        }
    }

    // 4. Knop om de puzzel te genereren
    genereerKnop.addEventListener('click', () => {
        const boodschap = boodschapInput.value.toUpperCase();
        outputContainer.innerHTML = '';
        if (boodschap.trim() === '') return;
        const woorden = boodschap.split(/(\s+)/); // Splitten op spaties, maar behoud spaties
        woorden.forEach(woord => {
            if (woord.trim() === '') {
                const spatie = document.createElement('div');
                spatie.style.width = '30px'; // Breedte voor een spatie
                spatie.style.height = '1px'; // Zodat het niet te veel ruimte inneemt verticaal
                outputContainer.appendChild(spatie);
                return;
            }
            const woordWrapper = document.createElement('div');
            woordWrapper.className = 'woord-wrapper';
            for (const char of woord) {
                if (sleutel.has(char)) {
                    const letterWrapper = document.createElement('div');
                    letterWrapper.className = 'letter-wrapper';
                    letterWrapper.innerHTML = `
                        <div class="hokje afbeelding-hokje"><img src="${sleutel.get(char)}" alt="${char}"></div>
                        <div class="hokje leeg-hokje"></div>`;
                    woordWrapper.appendChild(letterWrapper);
                } else {
                    const leestekenWrapper = document.createElement('div');
                    leestekenWrapper.className = 'leesteken';
                    leestekenWrapper.textContent = char;
                    woordWrapper.appendChild(leestekenWrapper);
                }
            }
            outputContainer.appendChild(woordWrapper);
        });
        downloadSectie.classList.remove('verborgen');
    });

    // 5. Knop om nieuwe zin te beginnen
    opnieuwBeginnenKnop.addEventListener('click', () => {
        boodschapInput.value = '';
        outputContainer.innerHTML = '';
        downloadSectie.classList.add('verborgen');
    });

    // 6. Knop om terug te gaan naar setup
    terugNaarSetupKnop.addEventListener('click', () => {
        if (confirm('Weet je zeker dat je nieuwe afbeeldingen wilt kiezen? De huidige selectie gaat verloren.')) {
            resetSetupScherm(); // Gebruik de nieuwe reset functie
        }
    });

    // --- DOWNLOAD LOGICA ---

    function voorbereidDownload(actie) {
        if (outputContainer.innerHTML.trim() === '') {
            alert('Genereer eerst een puzzel om te downloaden.');
            return;
        }

        const downloadContainer = document.createElement('div');
        downloadContainer.style.position = 'absolute';
        downloadContainer.style.left = '-9999px';
        downloadContainer.style.padding = '20px';
        downloadContainer.style.backgroundColor = '#ffffff';
        // --- AANPASSING 1: Container breder gemaakt ---
        downloadContainer.style.width = '900px';

        const titel = document.createElement('h1');
        titel.innerText = 'Geheime Boodschap Puzzel';
        titel.style.textAlign = 'center';
        titel.style.color = '#005a9c';
        downloadContainer.appendChild(titel);

        const sleutelTitel = document.createElement('h2');
        sleutelTitel.innerText = 'Geheime Sleutel';
        sleutelTitel.style.textAlign = 'center';
        sleutelTitel.style.color = '#005a9c';
        downloadContainer.appendChild(sleutelTitel);

        const sleutelKopie = sleutelOverzicht.cloneNode(true);
        sleutelKopie.style.maxWidth = '700px';
        sleutelKopie.style.margin = '0 auto 20px auto';
        downloadContainer.appendChild(sleutelKopie);

        const puzzelTitel = document.createElement('h2');
        puzzelTitel.innerText = 'De Boodschap';
        puzzelTitel.style.textAlign = 'center';
        puzzelTitel.style.color = '#005a9c';
        downloadContainer.appendChild(puzzelTitel);

        const puzzelKopie = outputContainer.cloneNode(true);
        downloadContainer.appendChild(puzzelKopie);

        // --- AANPASSING 2: Maak de hokjes in de kopie kleiner ---
        puzzelKopie.querySelectorAll('.hokje').forEach(hokje => {
            hokje.style.width = '50px';
            hokje.style.height = '50px';
        });
        puzzelKopie.querySelectorAll('.leesteken').forEach(teken => {
            teken.style.fontSize = '32px';
        });


        document.body.appendChild(downloadContainer);

        html2canvas(downloadContainer, { scale: 2 }).then(canvas => {
            actie(canvas);
            document.body.removeChild(downloadContainer);
        });
    }

    // Download als PNG knop
    downloadPngKnop.addEventListener('click', () => {
        voorbereidDownload(canvas => {
            const link = document.createElement('a');
            link.download = 'geheime_boodschap.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    });

    // Download als PDF knop
    downloadPdfKnop.addEventListener('click', () => {
        voorbereidDownload(canvas => {
            const { jsPDF } = window.jspdf;
            const imgData = canvas.toDataURL('image/png');
            const imgProps = { width: canvas.width, height: canvas.height };
            const orientation = imgProps.width > imgProps.height ? 'l' : 'p';
            const pdf = new jsPDF(orientation, 'px', [imgProps.width, imgProps.height]);
            pdf.addImage(imgData, 'PNG', 0, 0, imgProps.width, imgProps.height);
            pdf.save('geheime_boodschap.pdf');
        });
    });
});
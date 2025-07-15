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
    const sleutelOverzicht = document.getElementById('sleutel-overzicht');

    // Thema elementen
    const zelfUploadenKnop = document.getElementById('zelf-uploaden-knop');
    const themaKiezenKnop = document.getElementById('thema-kiezen-knop');
    const keuzeOptiesDiv = document.querySelector('.keuze-opties');
    const uploadSectie = document.getElementById('upload-sectie');
    const themaSectie = document.getElementById('thema-sectie');
    const themaKnoppen = document.querySelectorAll('.thema-knop');
    const terugNaarUploadKnop = document.getElementById('terug-naar-upload-knop');
    const terugNaarKeuzeKnopUitUpload = document.getElementById('terug-naar-keuze-knop-uit-upload');
    const instructieUploadKnop = document.getElementById('instructieUploadKnop');

    // Elementen voor Zin/Woorden modus
    const zinSectie = document.getElementById('zin-sectie');
    const woordenSectie = document.getElementById('woorden-sectie');
    const woordenGrid = document.getElementById('woorden-grid');
    const generatorTypeKeuze = document.querySelectorAll('input[name="puzzeltype"]');

    // --- DYNAMISCH CREËREN VAN WOORDEN-GRID (NU 8 WOORDEN) ---
    for (let i = 1; i <= 8; i++) {
        const woordGroep = document.createElement('div');
        woordGroep.className = 'woord-input-groep';
        woordGroep.innerHTML = `
            <input type="text" class="woord-input" data-index="${i}" placeholder="Woord ${i}...">
        `;
        woordenGrid.appendChild(woordGroep);
    }
    const woordInputs = document.querySelectorAll('.woord-input');

    // --- INITIALISATIEFUNCTIE ---
    function resetSetupScherm() {
        setupScherm.classList.remove('verborgen');
        generatorScherm.classList.add('verborgen');
        keuzeOptiesDiv.classList.remove('verborgen');
        uploadSectie.classList.add('verborgen');
        themaSectie.classList.add('verborgen');
        document.querySelectorAll('.image-upload').forEach(input => input.classList.remove('verborgen'));
        instructieUploadKnop.classList.remove('verborgen');
        sleutel.clear();
        document.querySelectorAll('.image-preview').forEach(img => img.src = '');
        document.querySelectorAll('.image-upload').forEach(input => input.value = '');
        naarGeneratorKnop.disabled = true;
    }

    resetSetupScherm();

    // --- SETUP SCHERM LOGICA ---
    zelfUploadenKnop.addEventListener('click', () => {
        uploadSectie.classList.remove('verborgen');
        themaSectie.classList.add('verborgen');
        keuzeOptiesDiv.classList.add('verborgen');
    });
    themaKiezenKnop.addEventListener('click', () => {
        themaSectie.classList.remove('verborgen');
        uploadSectie.classList.add('verborgen');
        keuzeOptiesDiv.classList.add('verborgen');
    });
    terugNaarUploadKnop.addEventListener('click', resetSetupScherm);
    terugNaarKeuzeKnopUitUpload.addEventListener('click', () => {
        if (confirm('Weet je zeker dat je terug wilt? De huidige selectie gaat verloren.')) {
            resetSetupScherm();
        }
    });

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

    themaKnoppen.forEach(button => {
        button.addEventListener('click', (event) => {
            const thema = event.target.dataset.thema;
            laadThemaAfbeeldingen(thema);
            uploadSectie.classList.remove('verborgen');
            themaSectie.classList.add('verborgen');
            document.querySelectorAll('.image-upload').forEach(input => input.classList.add('verborgen'));
            instructieUploadKnop.classList.add('verborgen');
        });
    });

    function laadThemaAfbeeldingen(thema) {
        // Haal de UI-elementen op voor feedback
        const themaLaadStatus = document.getElementById('thema-laad-status');
        const themaKnoppenContainer = document.getElementById('thema-knoppen');

        // --- START LAADPROCES ---
        // 1. Toon een laadbericht en zorg dat de "maak..." knop uit staat
        themaLaadStatus.textContent = `Thema "${thema}" wordt geladen...`;
        themaLaadStatus.classList.remove('verborgen');
        naarGeneratorKnop.disabled = true;

        // 2. Voorkom dat de gebruiker een ander thema kiest tijdens het laden
        themaKnoppenContainer.style.pointerEvents = 'none';
        themaKnoppenContainer.style.opacity = '0.5';
        
        sleutel.clear();
        const basisPad = `thema_afbeeldingen/${thema}/`;
        const imageLoadPromises = ALFABET.split('').map(letter => {
            return new Promise((resolve) => {
                const imageUrl = `${basisPad}${letter}.png`;
                const img = new Image();
                img.onload = () => {
                    sleutel.set(letter, imageUrl);
                    document.getElementById(`preview-${letter}`).src = imageUrl;
                    resolve(true); // Succesvol geladen
                };
                img.onerror = () => { 
                    console.error(`Afbeelding niet gevonden: ${imageUrl}`); 
                    resolve(false); // Fout bij laden
                };
                img.src = imageUrl;
            });
        });

        // Wacht tot ALLE afbeeldingen geprobeerd zijn te laden
        Promise.all(imageLoadPromises).then(results => {
            // --- EINDE LAADPROCES ---
            // 1. Verberg het laadbericht
            themaLaadStatus.classList.add('verborgen');

            // 2. Maak de themaknoppen weer klikbaar
            themaKnoppenContainer.style.pointerEvents = 'auto';
            themaKnoppenContainer.style.opacity = '1';

            // 3. Controleer of alle afbeeldingen daadwerkelijk zijn geladen
            const allesGeladen = results.every(res => res === true);
            naarGeneratorKnop.disabled = !allesGeladen;

            if (!allesGeladen) {
                // Geef een duidelijkere foutmelding als er iets misgaat
                const nietGevondenCount = results.filter(res => !res).length;
                alert(`Kon niet alle afbeeldingen voor het thema '${thema}' laden. ${nietGevondenCount} afbeelding(en) ontbreken of er is een fout opgetreden.`);
            }
        });
    }

    naarGeneratorKnop.addEventListener('click', () => {
        setupScherm.classList.add('verborgen');
        generatorScherm.classList.remove('verborgen');
        document.querySelector('input[name="puzzeltype"][value="zin"]').checked = true;
        zinSectie.classList.remove('verborgen');
        woordenSectie.classList.add('verborgen');
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

    generatorTypeKeuze.forEach(radio => {
        radio.addEventListener('change', (event) => {
            const isZinModus = event.target.value === 'zin';
            zinSectie.classList.toggle('verborgen', !isZinModus);
            woordenSectie.classList.toggle('verborgen', isZinModus);
            opnieuwBeginnenKnop.click();
        });
    });

    // --- HERBRUIKBARE FUNCTIE OM HTML VOOR PUZZEL TE MAKEN ---
    function maakPuzzelHTML(tekst) {
        let html = '';
        const woorden = tekst.split(/(\s+)/);
        woorden.forEach(woord => {
            if (woord.trim() === '') {
                html += '<div style="width: 20px;"></div>';
                return;
            }
            html += '<div class="woord-wrapper">';
            for (const char of woord) {
                const upperChar = char.toUpperCase();
                if (sleutel.has(upperChar)) {
                    html += `
                        <div class="letter-wrapper">
                            <div class="hokje afbeelding-hokje"><img src="${sleutel.get(upperChar)}" alt="${upperChar}"></div>
                            <div class="hokje leeg-hokje"></div>
                        </div>`;
                } else {
                    html += `<div class="leesteken">${char}</div>`;
                }
            }
            html += '</div>';
        });
        return html;
    }

    // --- KNOP OM PUZZEL TE GENEREREN EN IN NIEUW VENSTER TE OPENEN ---
    genereerKnop.addEventListener('click', () => {
        const puzzelType = document.querySelector('input[name="puzzeltype"]:checked').value;
        let puzzelContentHTML = '';
        let hasContent = false;

        if (puzzelType === 'zin') {
            const boodschap = boodschapInput.value; // Niet direct naar hoofdletters om leestekens te behouden
            if (boodschap.trim() !== '') {
                puzzelContentHTML = `<div class="zin-output">${maakPuzzelHTML(boodschap)}</div>`;
                hasContent = true;
            }
        } else {
            puzzelContentHTML = '<div class="woorden-output-grid">';
            let woordenGevonden = 0;
            woordInputs.forEach(input => {
                const woord = input.value;
                puzzelContentHTML += '<div class="woord-input-groep-preview">';
                if (woord.trim() !== '') {
                    woordenGevonden++;
                    puzzelContentHTML += maakPuzzelHTML(woord);
                    puzzelContentHTML += `
                        <div class="schrijflijn-container">
                            <i class="fas fa-pencil-alt"></i>
                            <div class="schrijflijn"></div>
                        </div>
                    `;
                }
                puzzelContentHTML += '</div>';
            });
            puzzelContentHTML += '</div>';
            if (woordenGevonden > 0) {
                hasContent = true;
            }
        }
        
        if (!hasContent) {
            alert('Typ eerst een zin of een of meerdere woorden.');
            return;
        }

        // Sla data op voor het nieuwe venster en open het
        localStorage.setItem('puzzelSleutelHTML', sleutelOverzicht.innerHTML);
        localStorage.setItem('puzzelContentHTML', puzzelContentHTML);
        window.open('puzzel_preview.html', '_blank');
    });
    
    opnieuwBeginnenKnop.addEventListener('click', () => {
        boodschapInput.value = '';
        woordInputs.forEach(input => {
            input.value = '';
        });
    });

    terugNaarSetupKnop.addEventListener('click', () => {
        if (confirm('Weet je zeker dat je nieuwe afbeeldingen wilt kiezen? De huidige selectie gaat verloren.')) {
            resetSetupScherm();
        }
    });
});
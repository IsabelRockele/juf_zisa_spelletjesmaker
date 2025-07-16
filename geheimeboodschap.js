document.addEventListener('DOMContentLoaded', () => {
    // --- CONSTANTEN ---
    const ALFABET = 'ABCDEFGHIJKLMNOPRSTUVWZ';

    // --- STATE ---
    const sleutel = new Map();

    // --- DOM ELEMENTEN ---
    const setupScherm = document.getElementById('setup-scherm');
    const generatorScherm = document.getElementById('generator-scherm');
    const puzzelPreviewScherm = document.getElementById('puzzel-preview-scherm');

    // Keuzemenu
    const keuzeOptiesDiv = document.querySelector('.keuze-opties');
    const zelfUploadenKnop = document.getElementById('zelf-uploaden-knop');
    const themaKiezenKnop = document.getElementById('thema-kiezen-knop');

    // Upload sectie
    const uploadSectie = document.getElementById('upload-sectie');
    const uploadGrid = document.getElementById('upload-grid');
    const naarGeneratorKnopUpload = document.getElementById('naar-generator-knop-upload');
    const terugNaarKeuzeKnopUitUpload = document.getElementById('terug-naar-keuze-knop-uit-upload');
    
    // Thema sectie
    const themaSectie = document.getElementById('thema-sectie');
    const themaKnoppen = document.querySelectorAll('.thema-knop');
    const themaLaadStatus = document.getElementById('thema-laad-status');
    const themaAfbeeldingenPreview = document.getElementById('thema-afbeeldingen-preview');
    const themaUploadGrid = document.getElementById('thema-upload-grid');
    const naarGeneratorKnopThema = document.getElementById('naar-generator-knop-thema');
    const terugNaarKeuzeKnopUitThema = document.getElementById('terug-naar-keuze-knop-uit-thema');

    // Generator
    const sleutelOverzicht = document.getElementById('sleutel-overzicht');
    const terugNaarSetupKnop = document.getElementById('terug-naar-setup-knop');
    const generatorTypeKeuze = document.querySelectorAll('input[name="puzzeltype"]');
    const zinSectie = document.getElementById('zin-sectie');
    const boodschapInput = document.getElementById('boodschap-input');
    const woordenSectie = document.getElementById('woorden-sectie');
    const woordenGrid = document.getElementById('woorden-grid');
    const genereerKnop = document.getElementById('genereer-knop');
    const opnieuwBeginnenKnop = document.getElementById('opnieuw-beginnen-knop');

    // Preview
    const puzzelContentContainer = document.getElementById('puzzel-content-container');
    const puzzelSleutelContainer = document.getElementById('puzzel-sleutel-container');
    const printKnop = document.getElementById('print-knop');
    const downloadPdfKnop = document.getElementById('download-pdf-knop');
    const sluitPreviewKnop = document.getElementById('sluit-preview-knop');

    // --- FUNCTIES ---
    const showScreen = (screen) => {
        [setupScherm, generatorScherm, puzzelPreviewScherm].forEach(s => s.classList.add('verborgen'));
        if(screen) screen.classList.remove('verborgen');
    };
    
    const resetKeuze = () => {
        keuzeOptiesDiv.classList.remove('verborgen');
        uploadSectie.classList.add('verborgen');
        themaSectie.classList.add('verborgen');
        sleutel.clear();
    };

    const createLetterInput = (letter, container) => {
        const zone = document.createElement('div');
        zone.className = 'upload-zone';
        zone.innerHTML = `<span class="letter">${letter}</span><img id="preview-${container.id}-${letter}" class="image-preview" src="">`;
        if (container.id === 'upload-grid') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.addEventListener('change', (event) => handleFileUpload(event, letter));
            zone.appendChild(input);
        }
        container.appendChild(zone);
    };

    const handleFileUpload = (event, letter) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataURL = e.target.result;
            document.getElementById(`preview-upload-grid-${letter}`).src = dataURL;
            sleutel.set(letter, dataURL);
            naarGeneratorKnopUpload.disabled = false;
        };
        reader.readAsDataURL(file);
    };

    const laadThemaAfbeeldingen = async (thema) => {
        sleutel.clear();
        themaUploadGrid.innerHTML = '';
        ALFABET.split('').forEach(letter => createLetterInput(letter, themaUploadGrid));
        
        themaLaadStatus.textContent = `Thema "${thema}" wordt geladen...`;
        themaLaadStatus.style.color = 'black';
        themaLaadStatus.classList.remove('verborgen');
        naarGeneratorKnopThema.disabled = true;
        
        const imageLoadPromises = ALFABET.split('').map(letter => {
            return new Promise((resolve) => {
                const imageUrl = `thema_afbeeldingen/${thema}/${letter}.png`;
                const img = new Image();
                img.onload = () => {
                    document.getElementById(`preview-thema-upload-grid-${letter}`).src = imageUrl;
                    sleutel.set(letter, imageUrl);
                    resolve(true);
                };
                img.onerror = () => resolve(false);
                img.src = imageUrl;
            });
        });

        const results = await Promise.all(imageLoadPromises);
        const success = results.some(res => res === true);

        if (success) {
            themaLaadStatus.textContent = `Thema '${thema}' succesvol geladen!`;
            themaLaadStatus.style.color = 'green';
            naarGeneratorKnopThema.disabled = false;
        } else {
            themaLaadStatus.textContent = `Fout: Kon geen enkele afbeelding voor thema '${thema}' vinden.`;
            themaLaadStatus.style.color = 'red';
            naarGeneratorKnopThema.disabled = true;
        }
    };
    
    const populateSleutelOverzicht = (container) => {
        container.innerHTML = '';
        const gesorteerdeSleutel = new Map([...sleutel.entries()].sort());
        for (const [letter, dataURL] of gesorteerdeSleutel.entries()) {
            const item = document.createElement('div');
            item.className = 'sleutel-item';
            item.innerHTML = `<b>${letter}</b><br><img src="${dataURL}" alt="${letter}">`;
            container.appendChild(item);
        }
    };

    const gaNaarGenerator = () => {
        if (sleutel.size === 0) {
            alert("Er zijn geen afbeeldingen voor de sleutel gevonden.");
            return;
        }
        populateSleutelOverzicht(sleutelOverzicht);
        showScreen(generatorScherm);
    };

    const maakPuzzelHTML = (tekst) => {
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
                    html += `<div class="letter-wrapper"><div class="hokje afbeelding-hokje"><img src="${sleutel.get(upperChar)}" alt="${upperChar}"></div><div class="hokje leeg-hokje"></div></div>`;
                } else if (char.match(/[a-zA-Z]/)) {
                     html += `<div class="letter-wrapper"><div class="hokje leeg-hokje" style="border-top:1px solid #333; font-size:1.5em; font-weight:bold;">${char}</div></div>`;
                } else {
                    html += `<div class="leesteken">${char}</div>`;
                }
            }
            html += '</div>';
        });
        return html;
    };

    // --- EVENT LISTENERS ---
    zelfUploadenKnop.addEventListener('click', () => {
        resetKeuze();
        keuzeOptiesDiv.classList.add('verborgen');
        uploadSectie.classList.remove('verborgen');
        uploadGrid.innerHTML = '';
        ALFABET.split('').forEach(letter => createLetterInput(letter, uploadGrid));
    });

    themaKiezenKnop.addEventListener('click', () => {
        resetKeuze();
        keuzeOptiesDiv.classList.add('verborgen');
        themaSectie.classList.remove('verborgen');
    });

    [terugNaarKeuzeKnopUitUpload, terugNaarKeuzeKnopUitThema].forEach(btn => {
        btn.addEventListener('click', resetKeuze);
    });

    themaKnoppen.forEach(button => {
        button.addEventListener('click', (event) => {
            themaAfbeeldingenPreview.classList.remove('verborgen');
            laadThemaAfbeeldingen(event.target.dataset.thema);
        });
    });

    naarGeneratorKnopUpload.addEventListener('click', gaNaarGenerator);
    naarGeneratorKnopThema.addEventListener('click', gaNaarGenerator);
    
    terugNaarSetupKnop.addEventListener('click', () => {
        if(confirm("Weet u zeker dat u terug wilt? De puzzel gaat verloren.")) {
            showScreen(setupScherm);
            resetKeuze();
        }
    });

    generatorTypeKeuze.forEach(radio => {
        radio.addEventListener('change', (event) => {
            zinSectie.classList.toggle('verborgen', event.target.value !== 'zin');
            woordenSectie.classList.toggle('verborgen', event.target.value !== 'woorden');
        });
    });

    genereerKnop.addEventListener('click', () => {
        const puzzelType = document.querySelector('input[name="puzzeltype"]:checked').value;
        let puzzelContentHTML = '';
        let hasContent = false;
        if (puzzelType === 'zin') {
            const boodschap = boodschapInput.value;
            if (boodschap.trim() !== '') {
                puzzelContentHTML = `<div class="zin-output">${maakPuzzelHTML(boodschap)}</div>`;
                hasContent = true;
            }
        } else {
            puzzelContentHTML = '<div class="woorden-output-grid">';
            let woordenGevonden = 0;
            document.querySelectorAll('.woord-input').forEach(input => {
                if (input.value.trim() !== '') {
                    woordenGevonden++;
                    puzzelContentHTML += `<div class="woord-input-groep-preview">${maakPuzzelHTML(input.value)}<div class="schrijflijn-container"><i class="fas fa-pencil-alt"></i><div class="schrijflijn"></div></div></div>`;
                }
            });
            puzzelContentHTML += '</div>';
            if (woordenGevonden > 0) hasContent = true;
        }
        
        if (!hasContent) {
            alert('Typ eerst een zin of een of meerdere woorden.');
            return;
        }
        populateSleutelOverzicht(puzzelSleutelContainer);
        puzzelContentContainer.innerHTML = puzzelContentHTML;
        showScreen(puzzelPreviewScherm);
    });

    opnieuwBeginnenKnop.addEventListener('click', () => {
        boodschapInput.value = '';
        document.querySelectorAll('.woord-input').forEach(input => input.value = '');
    });

    printKnop.addEventListener('click', () => window.print());
    sluitPreviewKnop.addEventListener('click', () => showScreen(generatorScherm));
    
    downloadPdfKnop.addEventListener('click', () => {
        const printContainer = document.getElementById('print-container');
        const actionButtons = document.querySelector('.preview-acties');
        
        actionButtons.style.display = 'none';

        html2canvas(printContainer, { scale: 2 }).then(canvas => {
            const { jsPDF } = window.jspdf;
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasRatio = canvas.width / canvas.height;
            let imgHeight = pdfWidth / canvasRatio;
            let imgWidth = pdfWidth;
            if (imgHeight > pdfHeight) {
                imgHeight = pdfHeight;
                imgWidth = imgHeight * canvasRatio;
            }
            const xOffset = (pdfWidth - imgWidth) / 2;
            const yOffset = (pdfHeight - imgHeight) / 2;

            pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
            pdf.save('geheime_boodschap.pdf');
            
            actionButtons.style.display = 'flex';
        });
    });

    // --- INITIALISATIE ---
    for (let i = 1; i <= 8; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'woord-input';
        input.placeholder = `Woord ${i}...`
        woordenGrid.appendChild(input);
    }
    showScreen(setupScherm);
    resetKeuze();
});
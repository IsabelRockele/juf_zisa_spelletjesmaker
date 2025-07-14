document.addEventListener("DOMContentLoaded", () => {
    // --- Globale variabelen en initialisatie ---
    const canvas = document.getElementById("mainCanvas");
    const ctx = canvas.getContext("2d");
    const size = 4; // 4x4 Sudoku

    let userImages = []; // Voor geüploade afbeeldingen (wanneer GEEN thema is gekozen)
    let uploadedImageData = new Set(); // Voor detectie van duplicaten bij uploads
    let currentPuzzle = [];

    // NIEUW: Voor themaselectie
    let selectedTheme = null; // Houdt bij welk thema is geselecteerd (bijv. "herfst")
    let allLoadedThemeImages = []; // Array met ALLE 20 geladen Image objecten van het geselecteerde thema
    // AANPASSING: selectedThemeImagesForSudoku kan nu > 4 afbeeldingen bevatten
    let selectedThemeImagesForSudoku = []; // Array met de daadwerkelijk door de gebruiker gekozen thema Image objecten voor de Sudoku

    // --- DOM-elementen ophalen ---
    const typeRadios = document.querySelectorAll('input[name="sudokuType"]');
    const themeSelectionGroup = document.getElementById('themeSelectionGroup');
    const themeSelect = document.getElementById('themeSelect');
    const themeImageSelection = document.getElementById('themeImageSelection');
    const selectableThemeImagePreviews = document.getElementById('selectableThemeImagePreviews');
    const confirmThemeImagesBtn = document.getElementById('confirmThemeImagesBtn');
    const themeImageSelectionLabel = document.getElementById('themeImageSelectionLabel');
    const imageControls = document.getElementById('image-controls');
    const userUploadControls = document.getElementById('userUploadControls');
    const imageInput = document.getElementById('imageInput');
    const imageInputLabel = document.getElementById('imageInputLabel');
    const imagePreviews = document.getElementById('image-previews');
    const clearImagesBtn = document.getElementById('clearImagesBtn');
    const imageVarietyControls = document.getElementById('image-variety-controls');
    const imageVarietyRadios = document.querySelectorAll('input[name="imageVariety"]');
    const difficultySelect = document.getElementById('difficulty');
    const aantalSelect = document.getElementById('aantalSudokus');
    const aantalMelding = document.getElementById('aantalMelding');
    const generateBtn = document.getElementById('genereerBtn');
    const downloadPngBtn = document.getElementById('downloadPngBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const meldingContainer = document.getElementById('meldingContainer');

    // --- Thema Afbeeldingen Configuratie ---
    const themeImagePaths = {
        "terug_naar_school": [], "herfst": [], "halloween": [], "sinterklaas": [],
        "winter": [], "kerst": [], "lente": [], "pasen": [], "carnaval": [], "zomer": []
    };

    // Functie om de afbeeldingspaden voor elk thema te vullen
    function populateThemeImagePaths() {
        for (const theme in themeImagePaths) {
            for (let i = 1; i <= 20; i++) { // Verwacht 20 afbeeldingen per thema (01 t/m 20)
                const paddedIndex = i.toString().padStart(2, '0');
                themeImagePaths[theme].push(`sudoku_afbeeldingen/${theme}/${paddedIndex}.png`);
            }
        }
    }
    populateThemeImagePaths(); // Roep direct aan bij initialisatie

    // --- Sudoku Generatie Logica ---
    const shuffle = (array) => {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }
        return array;
    };

    function generateSolvedGrid() {
        const base = shuffle([1, 2, 3, 4]);
        let grid = Array(size).fill(null).map(() => Array(size));
        grid[0] = base;
        for (let r = 1; r < size; r++) {
            for (let c = 0; c < size; c++) {
                grid[r][c] = grid[r - 1][(c + ((r % 2 === 0) ? 1 : 2)) % size];
            }
        }
        // Extra shuffles voor meer variatie
        for (let i = 0; i < 5; i++) {
            shuffleRows(grid);
            shuffleCols(grid);
            shuffleBlockRows(grid);
            shuffleBlockCols(grid);
        }
        return grid;
    }

    function shuffleRows(grid) {
        const rowBlocks = [[0,1], [2,3]];
        for (const block of rowBlocks) {
            shuffle(block);
            const [r1, r2] = block;
            [grid[r1], grid[r2]] = [grid[r2], grid[r1]];
        }
    }

    function shuffleCols(grid) {
        const colBlocks = [[0,1], [2,3]];
        for (const block of colBlocks) {
            shuffle(block);
            const [c1, c2] = block;
            for (let r = 0; r < size; r++) {
                [grid[r][c1], grid[r][c2]] = [grid[r][c2], grid[r][c1]];
            }
        }
    }

    function shuffleBlockRows(grid) {
        const blocks = [0, 1]; // Block 0: rows 0,1; Block 1: rows 2,3
        shuffle(blocks);
        const newGrid = Array(size).fill(null).map(() => Array(size));
        for (let r = 0; r < size; r++) {
            const originalBlockIndex = Math.floor(r / 2);
            const newBlockIndex = blocks.indexOf(originalBlockIndex);
            const newRowIndex = (newBlockIndex * 2) + (r % 2);
            newGrid[newRowIndex] = grid[r];
        }
        for(let r = 0; r < size; r++) grid[r] = newGrid[r];
    }

    function shuffleBlockCols(grid) {
        const blocks = [0, 1]; // Block 0: cols 0,1; Block 1: cols 2,3
        shuffle(blocks);
        const newGrid = Array(size).fill(null).map(() => Array(size));
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const originalBlockIndex = Math.floor(c / 2);
                const newBlockIndex = blocks.indexOf(originalBlockIndex);
                const newColIndex = (newBlockIndex * 2) + (c % 2);
                newGrid[r][newColIndex] = grid[r][c];
            }
        }
        for(let r = 0; r < size; r++) grid[r] = newGrid[r];
    }

    function createPuzzle(grid, difficulty) {
        let puzzle = JSON.parse(JSON.stringify(grid));
        const difficulties = { easy: 6, medium: 8, hard: 10 };
        let cells = [];
        for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) cells.push({ r, c });
        shuffle(cells);
        
        const cellsToRemove = Math.min(difficulties[difficulty] || 8, size * size);
        cells.slice(0, cellsToRemove).forEach(cell => puzzle[cell.r][cell.c] = 0);
        return puzzle;
    }

    // --- Canvas Teken Logica ---
    function drawGrid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const cellSize = canvas.width / size;
        for (let i = 0; i <= size; i++) {
            ctx.lineWidth = (i % 2 === 0) ? 4 : 1.5;
            ctx.strokeStyle = '#004080';
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0); ctx.lineTo(i * cellSize, canvas.height); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * cellSize); ctx.lineTo(canvas.width, i * cellSize); ctx.stroke();
        }
    }

    function drawPuzzle(puzzle, type, imagesToUse) {
        drawGrid();
        const cellSize = canvas.width / size;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const value = puzzle[r][c];
                if (value === 0) continue;
                const x = c * cellSize + cellSize / 2;
                const y = r * cellSize + cellSize / 2;
                if (type === 'getallen') {
                    ctx.fillStyle = '#000';
                    ctx.font = `${cellSize * 0.6}px Arial`;
                    ctx.fillText(value, x, y);
                } else {
                    const imgIndex = value - 1; // Waarden 1-4, array indices 0-3
                    if (imagesToUse[imgIndex] && imagesToUse[imgIndex].complete) {
                        const margin = cellSize * 0.1;
                        ctx.drawImage(imagesToUse[imgIndex], c * cellSize + margin, r * cellSize + margin, cellSize - 2 * margin, cellSize - 2 * margin);
                    } else if (imagesToUse[imgIndex]) {
                        ctx.fillStyle = '#999';
                        ctx.font = `${cellSize * 0.4}px Arial`;
                        ctx.fillText(`Laden ${value}`, x, y);
                    }
                }
            }
        }
    }

    // --- UI Update & Validatie Functies ---
    function getNeededImagesCount() {
        const type = document.querySelector('input[name="sudokuType"]:checked').value;
        if (type !== 'afbeeldingen') return 0;

        const aantal = parseInt(aantalSelect.value);
        const variety = document.querySelector('input[name="imageVariety"]:checked').value;
        
        // 'needed' is nu het totaal aantal UNIEKE afbeeldingen dat nodig is voor het werkblad
        return (variety === 'different' && aantal > 1) ? size * aantal : size;
    }
    
    function updateUiForImageOptions() {
        const aantal = parseInt(aantalSelect.value);
        const type = document.querySelector('input[name="sudokuType"]:checked').value;
        const needed = getNeededImagesCount(); // Haal hier de "needed" op
        
        // Algemene afbeeldingsopties: Thema selectie en de upload/variety opties
        themeSelectionGroup.style.display = (type === 'afbeeldingen') ? 'block' : 'none';
        imageControls.style.display = (type === 'afbeeldingen') ? 'block' : 'none';

        // AANPASSING: Verberg themeImageSelection expliciet als er geen thema geselecteerd is
        // of als de bevestiging al is gedaan (wat leidt tot selectedThemeImagesForSudoku.length === needed)
        const isThemeConfirmed = (selectedTheme && selectedThemeImagesForSudoku.length === needed);
        themeImageSelection.style.display = (type === 'afbeeldingen' && selectedTheme && !isThemeConfirmed) ? 'block' : 'none';


        // Toon/verberg user upload controls: Alleen als 'afbeeldingen' geselecteerd is EN GEEN thema
        userUploadControls.style.display = (type === 'afbeeldingen' && !selectedTheme) ? 'block' : 'none';
        
        // Toon/verberg "verschillende afbeeldingen" optie: Alleen als 'afbeeldingen' geselecteerd is,
        // EN meerdere sudoku's (aantal > 1)
        imageVarietyControls.style.display = (type === 'afbeeldingen' && aantal > 1) ? 'block' : 'none';

        if (aantal > 1) {
            aantalMelding.textContent = `Het werkblad zal ${aantal} verschillende sudoku's bevatten.`;
        } else {
            aantalMelding.textContent = '';
        }
        
        updateImageUploadLabel(); // Zorgt ervoor dat de labels worden bijgewerkt
        renderImagePreviews();
    }

    function updateImageUploadLabel() {
        const type = document.querySelector('input[name="sudokuType"]:checked').value;
        const aantal = parseInt(aantalSelect.value);
        const variety = document.querySelector('input[name="imageVariety"]:checked').value;
        const needed = getNeededImagesCount(); // Dynamisch benodigd aantal

        if (type === 'getallen') {
            meldingContainer.textContent = '';
            return;
        }

        if (selectedTheme) {
            // Label voor thema selectie is nu dynamisch en verwijst naar 'needed'
            themeImageSelectionLabel.textContent = `Kies ${needed} afbeelding(en) uit het thema:`;
            
            const currentSelectedCount = selectedThemeImagesForSudoku.length;
            let statusText = '';
            if (currentSelectedCount < needed) {
                statusText = `Selecteer nog ${needed - currentSelectedCount} afbeelding(en) uit het thema.`;
                meldingContainer.style.color = '#d9534f';
                confirmThemeImagesBtn.disabled = true;
            } else if (currentSelectedCount > needed) {
                statusText = `Je hebt teveel afbeeldingen geselecteerd (${currentSelectedCount} van ${needed}). Verwijder er ${currentSelectedCount - needed}.`;
                meldingContainer.style.color = '#d9534f';
                confirmThemeImagesBtn.disabled = true;
            }
            else { // currentSelectedCount === needed
                statusText = `Je hebt ${currentSelectedCount} afbeelding(en) geselecteerd. Klik op 'Bevestig selectie'.`;
                meldingContainer.style.color = 'green';
                confirmThemeImagesBtn.disabled = false;
            }
            meldingContainer.textContent = statusText;
            
            // imageInputLabel is verborgen bij themaselectie, maar we houden de tekst toch correct.
            imageInputLabel.textContent = `Kies ${needed} afbeeldingen:`;
            return;
        }

        // Logica voor gebruikersuploads (wanneer geen thema is gekozen)
        const currentUploadedCount = userImages.length;
        imageInputLabel.textContent = `Kies ${needed} afbeeldingen:`;
        let statusText = `${currentUploadedCount}/${needed} geselecteerd.`;
        
        if (needed > 0 && currentUploadedCount < needed) {
            statusText += ` Nog ${needed - currentUploadedCount} nodig.`;
            meldingContainer.style.color = '#d9534f';
        } else if (currentUploadedCount >= needed && needed > 0) {
            meldingContainer.style.color = 'green';
            statusText = `Perfect! Je hebt ${currentUploadedCount} unieke afbeeldingen geselecteerd.`;
        } else {
            statusText = ''; // Geen melding als geen afbeeldingen nodig zijn
        }

        meldingContainer.textContent = statusText;
    }

    function renderImagePreviews() {
        imagePreviews.innerHTML = ''; // Leeg user uploads preview
        selectableThemeImagePreviews.innerHTML = ''; // Leeg themapreview

        // Check welke set afbeeldingen getoond moet worden voor previews
        const imagesToRenderInPreviews = selectedTheme ? allLoadedThemeImages : userImages;
        const previewContainer = selectedTheme ? selectableThemeImagePreviews : imagePreviews;

        imagesToRenderInPreviews.forEach(img => {
            const imgWrapper = document.createElement('div');
            imgWrapper.classList.add('theme-image-wrapper'); // Gebruik dezelfde klasse voor beide types previews
            
            const previewImg = document.createElement('img');
            previewImg.src = img.src;
            previewImg.dataset.src = img.src; // Sla src op om te matchen

            // Voeg 'selected' klasse toe als deze afbeelding is geselecteerd (voor thema's)
            if (selectedTheme && selectedThemeImagesForSudoku.some(selectedImg => selectedImg.src === img.src)) {
                imgWrapper.classList.add('selected');
            }

            imgWrapper.appendChild(previewImg);
            previewContainer.appendChild(imgWrapper);

            // Alleen toevoegen click listener als het thema-afbeeldingen zijn
            if (selectedTheme) {
                imgWrapper.addEventListener('click', () => {
                    const src = previewImg.dataset.src;
                    const index = selectedThemeImagesForSudoku.findIndex(selectedImg => selectedImg.src === src);
                    const needed = getNeededImagesCount(); // Haal dynamisch needed op

                    if (index > -1) {
                        // Deselecteren
                        selectedThemeImagesForSudoku.splice(index, 1);
                        imgWrapper.classList.remove('selected');
                    } else if (selectedThemeImagesForSudoku.length < needed) { // AANPASSING: check tegen 'needed'
                        // Selecteren (maximaal benodigde hoeveelheid)
                        selectedThemeImagesForSudoku.push(img);
                        imgWrapper.classList.add('selected');
                    }
                    updateImageUploadLabel(); // Update melding en knop status
                });
            }
        });
    }

    // --- Afbeelding laad helper functie ---
    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Afbeelding niet geladen: ${src}`));
        });
    }

    // --- Event Handlers ---
    async function generateAndDraw() {
        const type = document.querySelector('input[name="sudokuType"]:checked').value;
        let imagesToUseInCanvas = [];

        if (type === 'afbeeldingen') {
            const needed = getNeededImagesCount(); // Haal de benodigde afbeeldingen op
            if (selectedTheme) {
                if (selectedThemeImagesForSudoku.length !== needed) {
                    drawGrid(); // Geen afbeeldingen om te tekenen als niet correct aantal geselecteerd
                    return;
                }
                // Voor de weergave van één sudoku, pak de eerste 'size' (4) geselecteerde afbeeldingen
                imagesToUseInCanvas = selectedThemeImagesForSudoku.slice(0, size);
            } else {
                // Als geen thema gekozen, gebruik de geüploade afbeeldingen
                if (userImages.length < needed) {
                    drawGrid();
                    return;
                }
                imagesToUseInCanvas = userImages.slice(0, size); // Gebruik de eerste 4 van de geüploade
            }
        }
        
        meldingContainer.textContent = ''; // Wis melding als alles klaar is
        currentPuzzle = createPuzzle(generateSolvedGrid(), difficultySelect.value);
        drawPuzzle(currentPuzzle, type, imagesToUseInCanvas); // Geef de juiste set afbeeldingen mee
    }
    
    // Luister naar wijzigingen in type, aantal en imageVariety
    [...typeRadios, ...imageVarietyRadios, aantalSelect].forEach(el => {
        el.addEventListener('change', () => {
            clearSelectionAndResetUI();
        });
    });

    // NIEUW: Event listener voor thema selectie
    themeSelect.addEventListener('change', async (event) => {
        const theme = event.target.value;
        clearSelectionAndResetUI(false); // Reset alles behalve de themeSelect zelf
        selectedTheme = theme; // Update de globale variabele

        if (theme === "") {
            // Geen thema geselecteerd, schakel terug naar user uploads
            userImages = [];
            uploadedImageData.clear();
        } else {
            // Thema geselecteerd, laad ALLE thema-afbeeldingen
            userImages = []; // Leeg de user upload images
            uploadedImageData.clear();
            selectedThemeImagesForSudoku = []; // Reset selectie voor thema

            meldingContainer.textContent = `Thema ${themeSelect.options[themeSelect.selectedIndex].text} laden...`;
            try {
                allLoadedThemeImages = await Promise.all(themeImagePaths[theme].map(path => loadImage(path)));
                meldingContainer.textContent = ''; // Wis laadmelding
            } catch (error) {
                console.error("Fout bij laden alle thema-afbeeldingen:", error);
                meldingContainer.textContent = "Fout bij laden thema-afbeeldingen. Controleer de afbeeldingspaden.";
                allLoadedThemeImages = [];
                selectedTheme = null; // Reset thema als er een fout is
                themeSelect.value = "";
            }
        }
        updateUiForImageOptions();
        generateAndDraw();
    });

    // NIEUW: Event listener voor "Bevestig selectie" knop
    confirmThemeImagesBtn.addEventListener('click', async () => {
        const needed = getNeededImagesCount(); // Haal benodigde op het moment van bevestiging
        if (selectedThemeImagesForSudoku.length === needed) {
            // Wacht tot alle geselecteerde afbeeldingen volledig zijn geladen
            await Promise.all(selectedThemeImagesForSudoku.map(img => new Promise(resolve => {
                if (img.complete) resolve();
                else img.onload = resolve;
            })));
            
            // AANPASSING: Verberg de themaselectie-UI na bevestiging
            // Dit wordt nu afgehandeld door updateUiForImageOptions() op een meer consistente manier.
            // themeImageSelection.style.display = 'none';

            updateUiForImageOptions(); // Deze zal nu themeImageSelection verbergen
            generateAndDraw(); // Genereer Sudoku nu de afbeeldingen klaar zijn
        } else {
            meldingContainer.textContent = `Selecteer precies ${needed} afbeeldingen om te bevestigen. Je hebt er ${selectedThemeImagesForSudoku.length} geselecteerd.`;
            meldingContainer.style.color = '#d9534f';
        }
    });


    imageInput.addEventListener('change', async (event) => {
        const files = event.target.files;
        const needed = getNeededImagesCount();
        let duplicates = [];
        let newImagesLoaded = [];

        // Als er een thema geselecteerd is, negeer dan file input
        if (selectedTheme) {
            imageInput.value = null;
            return;
        }

        userImages = [];
        uploadedImageData.clear();

        if (files.length === 0) {
            renderImagePreviews();
            updateImageUploadLabel();
            generateAndDraw();
            return;
        }

        const readers = Array.from(files).map(file => {
            return new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = (e) => resolve({ dataURL: e.target.result, file: file });
                reader.readAsDataURL(file);
            });
        });

        const results = await Promise.all(readers);

        for (const { dataURL, file } of results) {
            if (uploadedImageData.has(dataURL)) {
                duplicates.push(file.name);
            } else if (newImagesLoaded.length < needed) {
                uploadedImageData.add(dataURL);
                const img = new Image();
                img.src = dataURL;
                newImagesLoaded.push(img);
            }
        }
        userImages = newImagesLoaded;

        renderImagePreviews();
        updateImageUploadLabel();
        generateAndDraw();
        if(duplicates.length > 0) {
            meldingContainer.textContent = `Waarschuwing: De volgende afbeeldingen zijn dubbel en niet toegevoegd: ${duplicates.join(', ')}`;
            meldingContainer.style.color = '#ffc107';
            setTimeout(() => updateImageUploadLabel(), 5000);
        }
        imageInput.value = null;
    });

    // NIEUW: Helper functie voor het resetten van de selecties en UI
    function clearSelectionAndResetUI(resetThemeDropdown = true) {
        userImages = [];
        uploadedImageData.clear();
        allLoadedThemeImages = [];
        selectedThemeImagesForSudoku = [];
        selectedTheme = null;
        if (resetThemeDropdown) {
            themeSelect.value = ""; // Reset thema dropdown
        }
        imageInput.value = null; // Wis de file input
        updateUiForImageOptions(); // Update UI om user uploads weer te tonen of thema selectie
        drawGrid(); // Teken een leeg raster
    }

    clearImagesBtn.addEventListener('click', () => clearSelectionAndResetUI(true));

    generateBtn.addEventListener('click', generateAndDraw);
    difficultySelect.addEventListener('change', generateAndDraw);

    // --- Download Functies ---
    async function generateWorksheet(outputType) {
        const aantal = parseInt(aantalSelect.value);
        const type = document.querySelector('input[name="sudokuType"]:checked').value;
        const difficulty = difficultySelect.value;
        const variety = document.querySelector('input[name="imageVariety"]:checked').value;
        
        // Bepaal of we voor elke Sudoku een unieke set afbeeldingen nodig hebben
        const useDifferentImagesPerSudoku = (type === 'afbeeldingen' && aantal > 1 && variety === 'different');

        let imagesForWorksheetGeneration = []; // Dit zal de totale set unieke afbeeldingen zijn

        if (type === 'afbeeldingen') {
            const needed = getNeededImagesCount();
            if (selectedTheme) {
                if (selectedThemeImagesForSudoku.length !== needed) {
                    meldingContainer.textContent = `Selecteer eerst ${needed} afbeeldingen uit het thema!`;
                    return;
                }
                imagesForWorksheetGeneration = selectedThemeImagesForSudoku; // Gebruik de geselecteerde set
            } else {
                if (userImages.length < needed) {
                    meldingContainer.textContent = `Upload eerst ${needed} afbeeldingen!`;
                    return;
                }
                imagesForWorksheetGeneration = userImages;
            }
        } else {
            imagesForWorksheetGeneration = [];
        }

        meldingContainer.textContent = 'Bezig met het genereren van het werkblad...';
        
        let puzzles = [];
        for (let i = 0; i < aantal; i++) {
            puzzles.push(createPuzzle(generateSolvedGrid(), difficulty));
        }

        let cols = (aantal === 4) ? 2 : (aantal === 2 ? 2 : (aantal === 3 ? 1 : 1));
        let rows = (aantal === 4) ? 2 : (aantal === 2 ? 1 : (aantal === 3 ? 3 : 1));
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width * cols;
        tempCanvas.height = canvas.height * rows;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        for (let i = 0; i < puzzles.length; i++) {
            let imagesForCurrentSudoku = [];
            if (type === 'afbeeldingen') {
                if (useDifferentImagesPerSudoku) {
                    // Pak de specifieke set van 4 unieke afbeeldingen voor deze sudoku
                    imagesForCurrentSudoku = imagesForWorksheetGeneration.slice(i * size, (i + 1) * size);
                    shuffle(imagesForCurrentSudoku); // Schud ze voor variatie
                } else {
                    // Gebruik dezelfde 4 basisafbeeldingen en schud die
                    imagesForCurrentSudoku = shuffle([...imagesForWorksheetGeneration.slice(0, size)]);
                }
                // Controleer of de set 4 afbeeldingen bevat voor schudden
                if (imagesForCurrentSudoku.length !== size) {
                    console.warn(`Onvoldoende afbeeldingen voor Sudoku ${i + 1}. Verwacht ${size}, maar kreeg ${imagesForCurrentSudoku.length}.`);
                }
            }

            drawPuzzle(puzzles[i], type, imagesForCurrentSudoku);
            const col = (aantal === 2 || aantal === 4) ? (i % 2) : 0;
            const row = (aantal === 3) ? i : (aantal === 4 ? Math.floor(i / 2) : 0);
            tempCtx.drawImage(canvas, col * canvas.width, row * canvas.height);
        }

        const dataURL = tempCanvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataURL;
        a.download = `sudoku-werkblad-${aantal}.png`;
        a.click();

        // Teken de laatst gegenereerde Sudoku terug op de canvas met de originele afbeeldingen
        // Pak weer de eerste 4 voor de preview op de pagina
        drawPuzzle(currentPuzzle, type, imagesForWorksheetGeneration.slice(0, size));
        meldingContainer.textContent = '';
        updateImageUploadLabel();
    }

    downloadPngBtn.addEventListener('click', () => generateWorksheet('png'));
    
    downloadPdfBtn.addEventListener('click', async () => {
        const aantal = parseInt(aantalSelect.value);
        const type = document.querySelector('input[name="sudokuType"]:checked').value;
        const difficulty = difficultySelect.value;
        const variety = document.querySelector('input[name="imageVariety"]:checked').value;
        
        const useDifferentImagesPerSudoku = (type === 'afbeeldingen' && aantal > 1 && variety === 'different');

        let imagesForWorksheetGeneration = [];
        if (type === 'afbeeldingen') {
            const needed = getNeededImagesCount();
            if (selectedTheme) {
                if (selectedThemeImagesForSudoku.length !== needed) {
                    meldingContainer.textContent = `Selecteer eerst ${needed} afbeeldingen uit het thema!`;
                    return;
                }
                imagesForWorksheetGeneration = selectedThemeImagesForSudoku;
            } else {
                if (userImages.length < needed) {
                    meldingContainer.textContent = `Upload eerst ${needed} afbeeldingen!`;
                    return;
                }
                imagesForWorksheetGeneration = userImages;
            }
        }

        meldingContainer.textContent = 'Bezig met het genereren van de PDF...';
        
        let puzzles = [];
        let allMissingDataForCutout = []; // Verzamel alle benodigde data voor het knipblad

        for (let i = 0; i < aantal; i++) {
            const solvedGrid = generateSolvedGrid();
            const puzzle = createPuzzle(solvedGrid, difficulty);
            puzzles.push(puzzle);

            if (type === 'afbeeldingen') {
                let imagesForCurrentSudoku = [];
                if (useDifferentImagesPerSudoku) {
                    imagesForCurrentSudoku = imagesForWorksheetGeneration.slice(i * size, (i + 1) * size);
                    shuffle(imagesForCurrentSudoku);
                } else {
                    imagesForCurrentSudoku = shuffle([...imagesForWorksheetGeneration.slice(0, size)]);
                }
                // Controleer of de set 4 afbeeldingen bevat voor schudden
                if (imagesForCurrentSudoku.length !== size) {
                    console.warn(`Onvoldoende afbeeldingen voor Sudoku ${i + 1} knipblad. Verwacht ${size}, maar kreeg ${imagesForCurrentSudoku.length}.`);
                }

                // Verzamel de benodigde afbeeldingen voor het knipblad
                for (let r = 0; r < size; r++) {
                    for (let c = 0; c < size; c++) {
                        if (puzzle[r][c] === 0) { // Als het een leeg vakje is
                            const originalValue = solvedGrid[r][c];
                            // Vind de bijbehorende afbeelding uit de 'imagesForCurrentSudoku' set
                            allMissingDataForCutout.push(imagesForCurrentSudoku[originalValue - 1]);
                        }
                    }
                }
            }
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        const titleHeight = 15; // Deze wordt nu niet gebruikt om de titel te plaatsen

        let knipbladHoogte = 0;
        let finalCellSize = 0;
        let cutImageSize = 0;
        let cutImagesPerRow = 0;

        if (type === 'afbeeldingen' && allMissingDataForCutout.length > 0) {
            // Bereken optimale grootte voor knipafbeeldingen
            // Maximaal aantal kolommen voor knipafbeeldingen (bv. 10 afbeeldingen naast elkaar)
            const maxCutImagesCols = 10; 
            cutImagesPerRow = Math.min(maxCutImagesCols, allMissingDataForCutout.length);
            if (cutImagesPerRow === 0) cutImagesPerRow = 1; // Voorkom delen door nul

            // Bepaal de grootte van een individuele knipafbeelding.
            // Dit is afhankelijk van de breedte van de pagina en het aantal afbeeldingen per rij.
            cutImageSize = (pageWidth - 2 * margin - (cutImagesPerRow - 1) * 2) / cutImagesPerRow; // 2mm spacing tussen afbeeldingen
            // Zorg ervoor dat de afbeeldingen niet te klein worden
            cutImageSize = Math.max(cutImageSize, 15); // Minimum grootte van 15mm

            const numRows = Math.ceil(allMissingDataForCutout.length / cutImagesPerRow);
            knipbladHoogte = numRows * (cutImageSize + 2) + margin; // 2mm spacing onder elke rij
        }

        // AANPASSING: Gebruik 0 voor topSpace in calculateLayouts als de titel weggelaten wordt
        const finalLayouts = calculateLayouts(aantal, pageWidth, pageHeight, margin, knipbladHoogte, 0); 
        if (finalLayouts.length > 0) {
            finalCellSize = finalLayouts[0].size / size; // Dit is de celgrootte van de Sudoku zelf
        }

        // AANPASSING: Verwijder de regel die de titel tekent
        // doc.setFontSize(18);
        // doc.text("Sudoku Werkblad", pageWidth / 2, margin + 5, { align: 'center' });

        // Teken elke sudoku op de PDF
        for (let i = 0; i < puzzles.length; i++) {
            let imagesForCurrentSudoku = [];
            if (type === 'afbeeldingen') {
                 if (useDifferentImagesPerSudoku) {
                    imagesForCurrentSudoku = imagesForWorksheetGeneration.slice(i * size, (i + 1) * size);
                    shuffle(imagesForCurrentSudoku);
                } else {
                    imagesForCurrentSudoku = shuffle([...imagesForWorksheetGeneration.slice(0, size)]);
                }
                // Controleer of de set 4 afbeeldingen bevat voor schudden
                if (imagesForCurrentSudoku.length !== size) {
                    console.warn(`Onvoldoende afbeeldingen voor Sudoku ${i + 1}. Verwacht ${size}, maar kreeg ${imagesForCurrentSudoku.length}.`);
                }
            }

            // Zorg dat alle afbeeldingen voor deze Sudoku geladen zijn voor ze getekend worden
            await Promise.all(imagesForCurrentSudoku.map(img => new Promise(resolve => {
                if (img.complete) resolve();
                else img.onload = resolve;
            })));

            drawPuzzle(puzzles[i], type, imagesForCurrentSudoku);
            const layout = finalLayouts[i];
            doc.addImage(canvas.toDataURL('image/png'), 'PNG', layout.x, layout.y, layout.size, layout.size);
        }

        // Teken het knipblad onderaan als het een afbeeldingen Sudoku is
        if (type === 'afbeeldingen' && allMissingDataForCutout.length > 0) {
            const imgBoxSpacing = 2; // Spacing tussen de afbeeldingen
            const imgPadding = 1; // Padding binnen het kader

            // AANGEPASTE LOGICA VOOR CENTREREN VAN KNIPBLAD
            const blockWidth = cutImagesPerRow * cutImageSize + Math.max(0, cutImagesPerRow - 1) * imgBoxSpacing;
            const startX = (pageWidth - blockWidth) / 2;
            const startY = pageHeight - knipbladHoogte + margin / 2; // Start net boven de onderkant, met wat marge

            doc.setFontSize(14);
            doc.text("Knip de afbeeldingen uit en plak ze op de juiste plaats:", pageWidth / 2, startY - margin / 2, { align: 'center' });

            for(let i = 0; i < allMissingDataForCutout.length; i++){
                const img = allMissingDataForCutout[i];
                const col = i % cutImagesPerRow;
                const row = Math.floor(i / cutImagesPerRow);
                const boxX = startX + col * (cutImageSize + imgBoxSpacing);
                const boxY = startY + row * (cutImageSize + imgBoxSpacing);

                doc.setDrawColor('#004080');
                doc.setLineDashPattern([2, 1.5], 0);
                doc.rect(boxX, boxY, cutImageSize, cutImageSize);
                doc.setLineDashPattern([], 0);

                if (img && img.complete) {
                    doc.addImage(img.src, 'PNG', boxX + imgPadding, boxY + imgPadding, cutImageSize - 2 * imgPadding, cutImageSize - 2 * imgPadding);
                } else if (img) {
                    await new Promise(resolve => { img.onload = resolve; });
                    doc.addImage(img.src, 'PNG', boxX + imgPadding, boxY + imgPadding, cutImageSize - 2 * imgPadding, cutImageSize - 2 * imgPadding);
                }
            }
        }
        
        doc.save(`sudoku-werkblad-${aantal}.pdf`);
        // Teken de laatst gegenereerde Sudoku terug op de canvas met de originele afbeeldingen
        drawPuzzle(currentPuzzle, type, imagesForWorksheetGeneration.slice(0, size));
        meldingContainer.textContent = '';
        updateImageUploadLabel();
    });
    
    // AANPASSING: calculateLayouts functie verbeterd voor betere schaling
    function calculateLayouts(aantal, pageWidth, pageHeight, margin, bottomSpace, topSpace) {
        const layouts = [];
        const verticalPaddingBetweenSudokus = 10; // Extra padding tussen verticaal gestapelde Sudoku's
        const horizontalPaddingBetweenSudokus = 10; // Extra padding tussen horizontaal geplaatste Sudoku's
        const contentStartY = topSpace; // Titel is al in topSpace meegerekend (nu 0)
        
        let availableHeight = pageHeight - topSpace - bottomSpace - margin; // Beschikbare hoogte voor Sudoku's
        let availableWidth = pageWidth - 2 * margin; // Beschikbare breedte
        
        let sudokuSize;

        if (aantal === 1) {
            sudokuSize = Math.min(availableWidth, availableHeight);
            // Centreer de enkele Sudoku
            layouts.push({ 
                x: margin + (availableWidth - sudokuSize) / 2, 
                y: contentStartY + (availableHeight - sudokuSize) / 2, 
                size: sudokuSize 
            });
        } else if (aantal === 2) {
            // Twee naast elkaar
            sudokuSize = Math.min(
                (availableWidth - horizontalPaddingBetweenSudokus) / 2, 
                availableHeight
            );
            let totalContentWidth = 2 * sudokuSize + horizontalPaddingBetweenSudokus;
            let startX = margin + (availableWidth - totalContentWidth) / 2;
            let startY = contentStartY + (availableHeight - sudokuSize) / 2;

            layouts.push({ x: startX, y: startY, size: sudokuSize });
            layouts.push({ x: startX + sudokuSize + horizontalPaddingBetweenSudokus, y: startY, size: sudokuSize });
        } else if (aantal === 3) {
            // Drie onder elkaar
            sudokuSize = Math.min(
                availableWidth, 
                (availableHeight - 2 * verticalPaddingBetweenSudokus) / 3
            );
            let startX = margin + (availableWidth - sudokuSize) / 2;
            let startY = contentStartY + (availableHeight - (3 * sudokuSize + 2 * verticalPaddingBetweenSudokus)) / 2;

            layouts.push({ x: startX, y: startY, size: sudokuSize });
            layouts.push({ x: startX, y: startY + sudokuSize + verticalPaddingBetweenSudokus, size: sudokuSize });
            layouts.push({ x: startX, y: startY + 2 * (sudokuSize + verticalPaddingBetweenSudokus), size: sudokuSize });
        } else if (aantal === 4) {
            // Vier in een 2x2 raster
            sudokuSize = Math.min(
                (availableWidth - horizontalPaddingBetweenSudokus) / 2, 
                (availableHeight - verticalPaddingBetweenSudokus) / 2
            );
            let totalContentWidth = 2 * sudokuSize + horizontalPaddingBetweenSudokus;
            let totalContentHeight = 2 * sudokuSize + verticalPaddingBetweenSudokus;
            let startX = margin + (availableWidth - totalContentWidth) / 2;
            let startY = contentStartY + (availableHeight - totalContentHeight) / 2;

            layouts.push({ x: startX, y: startY, size: sudokuSize });
            layouts.push({ x: startX + sudokuSize + horizontalPaddingBetweenSudokus, y: startY, size: sudokuSize });
            layouts.push({ x: startX, y: startY + sudokuSize + verticalPaddingBetweenSudokus, size: sudokuSize });
            layouts.push({ x: startX + sudokuSize + horizontalPaddingBetweenSudokus, y: startY + sudokuSize + verticalPaddingBetweenSudokus, size: sudokuSize });
        }
        return layouts;
    }

    // --- Initiele UI en Puzzel ---
    updateUiForImageOptions();
    generateAndDraw();
});
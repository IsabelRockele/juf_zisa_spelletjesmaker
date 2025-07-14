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
    let selectedThemeImagesForSudoku = []; // Array met de 4 daadwerkelijk door de gebruiker gekozen thema Image objecten voor de Sudoku

    // --- DOM-elementen ophalen ---
    const typeRadios = document.querySelectorAll('input[name="sudokuType"]');
    const themeSelectionGroup = document.getElementById('themeSelectionGroup');
    const themeSelect = document.getElementById('themeSelect');
    const themeImageSelection = document.getElementById('themeImageSelection');
    const selectableThemeImagePreviews = document.getElementById('selectableThemeImagePreviews');
    const confirmThemeImagesBtn = document.getElementById('confirmThemeImagesBtn');
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
                // AANPASSING HIER: Verwacht nu 01.png, 02.png in submappen
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

        // Altijd 4 afbeeldingen nodig die de gebruiker selecteert/bevestigt voor thema's
        if (selectedTheme) return size; 

        const aantal = parseInt(aantalSelect.value);
        const variety = document.querySelector('input[name="imageVariety"]:checked').value;
        return (variety === 'different' && aantal > 1) ? size * aantal : size;
    }
    
    function updateUiForImageOptions() {
        const aantal = parseInt(aantalSelect.value);
        const type = document.querySelector('input[name="sudokuType"]:checked').value;
        
        // Algemene afbeeldingsopties: Thema selectie en de upload/variety opties
        themeSelectionGroup.style.display = (type === 'afbeeldingen') ? 'block' : 'none';
        imageControls.style.display = (type === 'afbeeldingen') ? 'block' : 'none';

        // Toon/verberg user upload controls: Alleen als 'afbeeldingen' geselecteerd is EN GEEN thema
        userUploadControls.style.display = (type === 'afbeeldingen' && !selectedTheme) ? 'block' : 'none';
        
        // Toon/verberg thema afbeelding selectie grid: Alleen als 'afbeeldingen' geselecteerd is EN een thema
        themeImageSelection.style.display = (type === 'afbeeldingen' && selectedTheme) ? 'block' : 'none';

        // Toon/verberg "verschillende afbeeldingen" optie: Alleen als 'afbeeldingen' geselecteerd is,
        // EN meerdere sudoku's EN GEEN thema (want thema heeft eigen logica)
        imageVarietyControls.style.display = (type === 'afbeeldingen' && aantal > 1 && !selectedTheme) ? 'block' : 'none';

        if (aantal > 1) {
            aantalMelding.textContent = `Het werkblad zal ${aantal} verschillende sudoku's bevatten.`;
        } else {
            aantalMelding.textContent = '';
        }
        
        updateImageUploadLabel();
        renderImagePreviews();
    }

    function updateImageUploadLabel() {
        const type = document.querySelector('input[name="sudokuType"]:checked').value;
        const needed = getNeededImagesCount();
        
        if (type === 'getallen') {
            meldingContainer.textContent = '';
            return;
        }

        if (selectedTheme) {
            // Als een thema geselecteerd is, tonen we de status van de thema-afbeeldingsselectie
            const currentSelectedCount = selectedThemeImagesForSudoku.length;
            if (currentSelectedCount < size) {
                meldingContainer.textContent = `Selecteer ${size - currentSelectedCount} afbeeldingen uit het thema.`;
                meldingContainer.style.color = '#d9534f';
                confirmThemeImagesBtn.disabled = true;
            } else {
                meldingContainer.textContent = `Je hebt 4 afbeeldingen geselecteerd. Klik op 'Bevestig selectie'.`;
                meldingContainer.style.color = 'green';
                confirmThemeImagesBtn.disabled = false;
            }
            // Label voor user uploads blijft consistent, ook al is het verborgen
            imageInputLabel.textContent = `Kies ${size} afbeeldingen:`; 
            return;
        }

        // Logica voor gebruikersuploads
        const currentUploadedCount = userImages.length;
        // AANPASSING HIER: Label voor user uploads is nu dynamisch
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

        if (selectedTheme) {
            // Toon de selecteerbare afbeeldingen van het thema
            allLoadedThemeImages.forEach(img => {
                const imgWrapper = document.createElement('div');
                imgWrapper.classList.add('theme-image-wrapper');
                
                const previewImg = document.createElement('img');
                previewImg.src = img.src;
                previewImg.dataset.src = img.src; // Sla src op om te matchen

                // Voeg 'selected' klasse toe als deze afbeelding is geselecteerd
                if (selectedThemeImagesForSudoku.some(selectedImg => selectedImg.src === img.src)) {
                    imgWrapper.classList.add('selected');
                }

                imgWrapper.appendChild(previewImg);
                selectableThemeImagePreviews.appendChild(imgWrapper);

                imgWrapper.addEventListener('click', () => {
                    const src = previewImg.dataset.src;
                    const index = selectedThemeImagesForSudoku.findIndex(selectedImg => selectedImg.src === src);

                    if (index > -1) {
                        // Deselecteren
                        selectedThemeImagesForSudoku.splice(index, 1);
                        imgWrapper.classList.remove('selected');
                    } else if (selectedThemeImagesForSudoku.length < size) {
                        // Selecteren (max 4)
                        selectedThemeImagesForSudoku.push(img);
                        imgWrapper.classList.add('selected');
                    }
                    updateImageUploadLabel(); // Update melding en knop status
                });
            });
        } else {
            // Toon de standaard user uploads previews
            userImages.forEach(img => {
                const previewImg = document.createElement('img');
                previewImg.src = img.src;
                imagePreviews.appendChild(previewImg);
            });
        }
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
            if (selectedTheme) {
                // Als thema gekozen, gebruik de 4 geselecteerde thema-afbeeldingen
                if (selectedThemeImagesForSudoku.length !== size) {
                    drawGrid(); // Geen afbeeldingen om te tekenen als niet 4 geselecteerd
                    return;
                }
                imagesToUseInCanvas = selectedThemeImagesForSudoku;
            } else {
                // Als geen thema gekozen, gebruik de geüploade afbeeldingen
                const needed = getNeededImagesCount();
                if (userImages.length < needed) {
                    drawGrid();
                    return;
                }
                imagesToUseInCanvas = userImages;
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
        generateAndDraw(); // Teken raster of nieuwe Sudoku
    });

    // NIEUW: Event listener voor "Bevestig selectie" knop
    confirmThemeImagesBtn.addEventListener('click', () => {
        if (selectedThemeImagesForSudoku.length === size) {
            // Hier hoeft niets meer gedaan te worden dan de UI updaten
            // selectedThemeImagesForSudoku is al gevuld
            updateUiForImageOptions();
            generateAndDraw();
        } else {
            meldingContainer.textContent = `Selecteer precies ${size} afbeeldingen om te bevestigen.`;
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

        userImages = []; // Wis bestaande geüploade afbeeldingen als er nieuwe worden toegevoegd
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
            // AANPASSING HIER: Gebruik meldingContainer ipv alert
            meldingContainer.textContent = `Waarschuwing: De volgende afbeeldingen zijn dubbel en niet toegevoegd: ${duplicates.join(', ')}`;
            meldingContainer.style.color = '#ffc107'; // Gele kleur voor waarschuwing
            setTimeout(() => updateImageUploadLabel(), 5000); // Reset melding na 5 seconden
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
        // Dit gebeurt als 'different' geselecteerd is EN GEEN thema,
        // OF als een thema is geselecteerd EN 'different' variety.
        const useDifferentImagesPerSudoku = (type === 'afbeeldingen' && aantal > 1 && variety === 'different');

        let baseImagesForSudoku = []; // De set afbeeldingen die gebruikt zal worden voor de eerste Sudoku (of als 'same' is gekozen)

        if (type === 'afbeeldingen') {
            if (selectedTheme) {
                if (selectedThemeImagesForSudoku.length !== size) {
                    meldingContainer.textContent = `Selecteer eerst ${size} afbeeldingen uit het thema!`;
                    return;
                }
                baseImagesForSudoku = selectedThemeImagesForSudoku;
            } else {
                const needed = getNeededImagesCount();
                if (userImages.length < needed) {
                    meldingContainer.textContent = `Upload eerst ${needed} afbeeldingen!`;
                    return;
                }
                baseImagesForSudoku = userImages;
            }
        } else {
            // Voor 'getallen' Sudoku is geen controle nodig
            baseImagesForSudoku = [];
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
            if (type === 'afbeeldingen' && useDifferentImagesPerSudoku) {
                if (selectedTheme) {
                    imagesForCurrentSudoku = shuffle([...baseImagesForSudoku]);
                } else {
                    imagesForCurrentSudoku = userImages.slice(i * size, (i + 1) * size);
                }
            } else {
                imagesForCurrentSudoku = baseImagesForSudoku;
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
        drawPuzzle(currentPuzzle, type, (selectedTheme ? selectedThemeImagesForSudoku : userImages));
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

        let baseImagesForSudoku = [];
        if (type === 'afbeeldingen') {
            if (selectedTheme) {
                if (selectedThemeImagesForSudoku.length !== size) {
                    meldingContainer.textContent = `Selecteer eerst ${size} afbeeldingen uit het thema!`;
                    return;
                }
                baseImagesForSudoku = selectedThemeImagesForSudoku;
            } else {
                const needed = getNeededImagesCount();
                if (userImages.length < needed) {
                    meldingContainer.textContent = `Upload eerst ${needed} afbeeldingen!`;
                    return;
                }
                baseImagesForSudoku = userImages;
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
                    if (selectedTheme) {
                        imagesForCurrentSudoku = shuffle([...baseImagesForSudoku]);
                    } else {
                        imagesForCurrentSudoku = userImages.slice(i * size, (i + 1) * size);
                    }
                } else {
                    imagesForCurrentSudoku = baseImagesForSudoku;
                }

                // Verzamel de benodigde afbeeldingen voor het knipblad
                for (let r = 0; r < size; r++) {
                    for (let c = 0; c < size; c++) {
                        if (puzzle[r][c] === 0) { // Als het een leeg vakje is
                            const originalValue = solvedGrid[r][c]; // De originele oplossing
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
        const titleHeight = 15;

        let knipbladHoogte = 0;
        let finalCellSize = 0;

        if (type === 'afbeeldingen' && allMissingDataForCutout.length > 0) {
            const tempSudokuSize = Math.min(pageWidth - 2 * margin, pageHeight / 2 - titleHeight);
            const tempSudokuCellSize = tempSudokuSize / size;
            const imgBoxSize = tempSudokuCellSize;
            const imgBoxSpacing = 2;
            const imagesPerRow = Math.floor((pageWidth - 2 * margin) / (imgBoxSize + imgBoxSpacing));
            const numRows = imagesPerRow > 0 ? Math.ceil(allMissingDataForCutout.length / imagesPerRow) : allMissingDataForCutout.length;
            knipbladHoogte = numRows * (imgBoxSize + imgBoxSpacing) + margin;
        }

        const finalLayouts = calculateLayouts(aantal, pageWidth, pageHeight, margin, knipbladHoogte, titleHeight);
        if (finalLayouts.length > 0) {
            finalCellSize = finalLayouts[0].size / size;
        }

        doc.setFontSize(18);
        doc.text("Sudoku Werkblad", pageWidth / 2, margin + 5, { align: 'center' });

        // Teken elke sudoku op de PDF
        for (let i = 0; i < puzzles.length; i++) {
            let imagesForCurrentSudoku = [];
            if (type === 'afbeeldingen' && useDifferentImagesPerSudoku) {
                if (selectedTheme) {
                    imagesForCurrentSudoku = shuffle([...baseImagesForSudoku]);
                } else {
                    imagesForCurrentSudoku = userImages.slice(i * size, (i + 1) * size);
                }
            } else {
                imagesForCurrentSudoku = baseImagesForSudoku;
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
            const imgBoxSize = finalCellSize;
            const imgBoxSpacing = 2;
            const imgPadding = 1;
            const imagesPerRow = Math.floor((pageWidth - 2 * margin) / (imgBoxSize + imgBoxSpacing));
            
            const blockWidth = imagesPerRow * imgBoxSize + Math.max(0, imagesPerRow - 1) * imgBoxSpacing;
            const startX = (pageWidth - blockWidth) / 2;
            const startY = pageHeight - knipbladHoogte + margin / 2;

            doc.setFontSize(14);
            doc.text("Knip de afbeeldingen uit en plak ze op de juiste plaats:", pageWidth / 2, startY - margin / 2, { align: 'center' });

            for(let i = 0; i < allMissingDataForCutout.length; i++){
                const img = allMissingDataForCutout[i];
                const col = i % imagesPerRow;
                const row = Math.floor(i / imagesPerRow);
                const boxX = startX + col * (imgBoxSize + imgBoxSpacing);
                const boxY = startY + row * (imgBoxSize + imgBoxSpacing);

                doc.setDrawColor('#004080');
                doc.setLineDashPattern([2, 1.5], 0);
                doc.rect(boxX, boxY, imgBoxSize, imgBoxSize);
                doc.setLineDashPattern([], 0);

                if (img && img.complete) {
                    doc.addImage(img.src, 'PNG', boxX + imgPadding, boxY + imgPadding, imgBoxSize - 2 * imgPadding, imgBoxSize - 2 * imgPadding);
                } else if (img) {
                    // Wacht tot afbeelding geladen is indien niet voltooid
                    await new Promise(resolve => { img.onload = resolve; });
                    doc.addImage(img.src, 'PNG', boxX + imgPadding, boxY + imgPadding, imgBoxSize - 2 * imgPadding, imgBoxSize - 2 * imgPadding);
                }
            }
        }
        
        doc.save(`sudoku-werkblad-${aantal}.pdf`);
        // Teken de laatst gegenereerde Sudoku terug op de canvas met de originele afbeeldingen
        drawPuzzle(currentPuzzle, type, (selectedTheme ? selectedThemeImagesForSudoku : userImages));
        meldingContainer.textContent = '';
        updateImageUploadLabel();
    });
    
    function calculateLayouts(aantal, pageWidth, pageHeight, margin, bottomSpace, topSpace) {
        const layouts = [];
        const verticalPadding = 5;
        const availableHeight = pageHeight - bottomSpace - topSpace - verticalPadding;
        const contentStartY = topSpace + verticalPadding;

        if (aantal === 1) {
            let size = Math.min(pageWidth - 2 * margin, availableHeight);
            layouts.push({ x: (pageWidth - size) / 2, y: contentStartY + (availableHeight - size) / 2, size });
        } else if (aantal === 2) {
            let size = Math.min((pageWidth - 3 * margin) / 2, availableHeight);
            let totalContentWidth = 2 * size + margin;
            let startX = (pageWidth - totalContentWidth) / 2;
            let y = contentStartY + (availableHeight - size) / 2;
            layouts.push({ x: startX, y: y, size });
            layouts.push({ x: startX + size + margin, y: y, size });
        } else if (aantal === 3) {
            let size = Math.min(pageWidth - 2 * margin, (availableHeight - 2 * margin) / 3);
            let x = (pageWidth - size) / 2;
            let y1 = contentStartY;
            layouts.push({ x: x, y: y1, size });
            layouts.push({ x: x, y: y1 + size + margin, size });
            layouts.push({ x: x, y: y1 + 2 * (size + margin), size });
        } else if (aantal === 4) {
            let size = Math.min((pageWidth - 3 * margin) / 2, (availableHeight - margin) / 2);
            let totalContentWidth = 2 * size + margin;
            let startX = (pageWidth - totalContentWidth) / 2;
            let y1 = contentStartY;
            let y2 = y1 + size + margin;
            layouts.push({ x: startX, y: y1, size });
            layouts.push({ x: startX + size + margin, y: y1, size });
            layouts.push({ x: startX, y: y2, size });
            layouts.push({ x: startX + size + margin, y: y2, size });
        }
        return layouts;
    }

    // --- Initiele UI en Puzzel ---
    updateUiForImageOptions();
    generateAndDraw();
});
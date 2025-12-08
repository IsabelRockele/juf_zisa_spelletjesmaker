// sudoku_versie2.js – uitgebreid met loader + paginering 6×6/9×9

document.addEventListener("DOMContentLoaded", () => {
    // --- Config voor formaten ---
    const GRID_SPECS = {
        4: { blockRows: 2, blockCols: 2 },
        6: { blockRows: 2, blockCols: 3 },
        9: { blockRows: 3, blockCols: 3 }
    };

    let currentSize = 4; // standaard 4×4

    // --- Canvas ---
    const canvas = document.getElementById("mainCanvas");
    const ctx = canvas.getContext("2d");

    // --- Loader ---
    const loadingOverlay = document.getElementById("loadingOverlay");
    function showLoading(on) {
        if (!loadingOverlay) return;
        loadingOverlay.style.display = on ? "flex" : "none";
    }

    // --- Afbeeldingsbeheer ---
    let userImages = [];
    let uploadedImageData = new Set();

    let selectedTheme = null;
    let allLoadedThemeImages = [];
    let selectedThemeImagesForSudoku = [];

    // --- Worksheet state (gedeeld door canvas + PDF) ---
    let worksheetSudokus = [];
    let worksheetSolutions = [];
    let worksheetImageSets = [];
    // Per sudoku: eigen knipafbeeldingen
    let worksheetMissingImagesPerSudoku = [];
    // Geaggregeerd (handig voor 4×4)
    let worksheetMissingImages = [];

    // --- DOM-elementen ---
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
    const gridSizeSelect = document.getElementById('gridSizeSelect');
    const aantalMelding = document.getElementById('aantalMelding');
    const generateBtn = document.getElementById('genereerBtn');
    const downloadPngBtn = document.getElementById('downloadPngBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const meldingContainer = document.getElementById('meldingContainer');

    // --- Thema-afbeeldingen configuratie ---
    const themeImagePaths = {
        "terug_naar_school": [], "herfst": [], "Halloween": [], "Sinterklaas": [],
        "winter": [], "Kerst": [], "lente": [], "Pasen": [], "Carnaval": [], "zomer": []
    };

    function populateThemeImagePaths() {
        for (const theme in themeImagePaths) {
            for (let i = 1; i <= 20; i++) {
                const paddedIndex = i.toString().padStart(2, '0');
                themeImagePaths[theme].push(`sudoku_afbeeldingen/${theme}/${paddedIndex}.png`);
            }
        }
    }
    populateThemeImagePaths();

    // --- Hulpfuncties: algemene utils ---
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

    function deepCopyGrid(grid) {
        return grid.map(row => row.slice());
    }

    // --- Sudoku solved grid generator (algemeen voor 4×4, 6×6, 9×9) ---
    function generateSolvedGrid(size) {
        const spec = GRID_SPECS[size];
        if (!spec) throw new Error("Onbekend formaat: " + size);

        const { blockRows, blockCols } = spec;
        const grid = Array(size).fill(null).map(() => Array(size).fill(0));

        // Basispatroon
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                grid[r][c] = ((r * blockCols + Math.floor(r / blockRows) + c) % size) + 1;
            }
        }

        // Rijen binnen banden shufflen
        const bandCount = size / blockRows;
        for (let band = 0; band < bandCount; band++) {
            const rowIndices = [];
            for (let i = 0; i < blockRows; i++) {
                rowIndices.push(band * blockRows + i);
            }
            const shuffledRows = shuffle(rowIndices.slice());
            const tempRows = shuffledRows.map(idx => grid[idx]);
            for (let i = 0; i < blockRows; i++) {
                grid[band * blockRows + i] = tempRows[i];
            }
        }

        // Kolommen binnen stacks shufflen
        const stackCount = size / blockCols;
        for (let stack = 0; stack < stackCount; stack++) {
            const colIndices = [];
            for (let i = 0; i < blockCols; i++) {
                colIndices.push(stack * blockCols + i);
            }
            const shuffledCols = shuffle(colIndices.slice());
            for (let r = 0; r < size; r++) {
                const tempCols = shuffledCols.map(idx => grid[r][idx]);
                for (let i = 0; i < blockCols; i++) {
                    grid[r][stack * blockCols + i] = tempCols[i];
                }
            }
        }

        // Banden shufflen
        {
            const bands = [];
            for (let b = 0; b < bandCount; b++) bands.push(b);
            const bandOrder = shuffle(bands);
            const newGrid = Array(size).fill(null).map(() => Array(size).fill(0));
            for (let newBand = 0; newBand < bandCount; newBand++) {
                const oldBand = bandOrder[newBand];
                for (let i = 0; i < blockRows; i++) {
                    const oldRow = oldBand * blockRows + i;
                    const newRow = newBand * blockRows + i;
                    newGrid[newRow] = grid[oldRow];
                }
            }
            for (let r = 0; r < size; r++) grid[r] = newGrid[r];
        }

        // Stacks shufflen
        {
            const stacks = [];
            for (let s = 0; s < stackCount; s++) stacks.push(s);
            const stackOrder = shuffle(stacks);
            const newGrid = Array(size).fill(null).map(() => Array(size).fill(0));
            for (let r = 0; r < size; r++) {
                for (let newStack = 0; newStack < stackCount; newStack++) {
                    const oldStack = stackOrder[newStack];
                    for (let i = 0; i < blockCols; i++) {
                        const oldCol = oldStack * blockCols + i;
                        const newCol = newStack * blockCols + i;
                        newGrid[r][newCol] = grid[r][oldCol];
                    }
                }
            }
            for (let r = 0; r < size; r++) grid[r] = newGrid[r];
        }

        // Cijfer-permutatie
        const perm = shuffle(Array.from({ length: size }, (_, i) => i + 1));
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                grid[r][c] = perm[grid[r][c] - 1];
            }
        }

        return grid;
    }

    // --- Validator & oplosser voor unieke oplossing ---
    function isSafe(grid, row, col, num, size, blockRows, blockCols) {
        for (let i = 0; i < size; i++) {
            if (grid[row][i] === num) return false;
            if (grid[i][col] === num) return false;
        }
        const startRow = row - (row % blockRows);
        const startCol = col - (col % blockCols);
        for (let r = 0; r < blockRows; r++) {
            for (let c = 0; c < blockCols; c++) {
                if (grid[startRow + r][startCol + c] === num) return false;
            }
        }
        return true;
    }

    function countSolutions(grid, size, blockRows, blockCols, limit = 2) {
        let solutionCount = 0;

        function backtrack() {
            if (solutionCount >= limit) return;

            let row = -1, col = -1;
            outer:
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (grid[r][c] === 0) {
                        row = r;
                        col = c;
                        break outer;
                    }
                }
            }

            if (row === -1) {
                solutionCount++;
                return;
            }

            for (let num = 1; num <= size; num++) {
                if (isSafe(grid, row, col, num, size, blockRows, blockCols)) {
                    grid[row][col] = num;
                    backtrack();
                    grid[row][col] = 0;
                    if (solutionCount >= limit) return;
                }
            }
        }

        backtrack();
        return solutionCount;
    }

    function hasUniqueSolution(puzzle, size) {
        const spec = GRID_SPECS[size];
        const copy = deepCopyGrid(puzzle);
        const numSolutions = countSolutions(copy, size, spec.blockRows, spec.blockCols, 2);
        return numSolutions === 1;
    }

    function getTargetRemovals(size, difficulty) {
        if (size === 4) {
            switch (difficulty) {
                case 'easy': return 6;
                case 'medium': return 8;
                case 'hard': return 10;
                case 'expert': return 12;
                default: return 8;
            }
        } else if (size === 6) {
            switch (difficulty) {
                case 'easy': return 14;
                case 'medium': return 18;
                case 'hard': return 22;
                case 'expert': return 26;
                default: return 18;
            }
        } else if (size === 9) {
            switch (difficulty) {
                case 'easy': return 40;
                case 'medium': return 50;
                case 'hard': return 55;
                case 'expert': return 60;
                default: return 50;
            }
        }
        return Math.floor((size * size) / 2);
    }

    function createSudokuWithDifficulty(size, difficulty) {
        const spec = GRID_SPECS[size];
        const targetRemovals = getTargetRemovals(size, difficulty);
        const solution = generateSolvedGrid(size);
        const puzzle = deepCopyGrid(solution);

        let cells = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                cells.push({ r, c });
            }
        }
        shuffle(cells);

        let removed = 0;
        for (const cell of cells) {
            if (removed >= targetRemovals) break;
            const { r, c } = cell;
            if (puzzle[r][c] === 0) continue;

            const backup = puzzle[r][c];
            puzzle[r][c] = 0;

            if (hasUniqueSolution(puzzle, size)) {
                removed++;
            } else {
                puzzle[r][c] = backup;
            }
        }

        return { solution, puzzle };
    }

    // --- Canvas tekenlogica ---
    function drawGrid(ctx, x, y, gridSizePx, size) {
        const cellSize = gridSizePx / size;
        ctx.save();
        ctx.translate(x, y);

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, gridSizePx, gridSizePx);

        ctx.strokeStyle = '#004080';
        for (let i = 0; i <= size; i++) {
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, gridSizePx);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(gridSizePx, i * cellSize);
            ctx.stroke();
        }

        // Dikkere lijnen rond blokken
        const spec = GRID_SPECS[size];
        const br = spec.blockRows;
        const bc = spec.blockCols;
        ctx.lineWidth = 2.5;
        for (let r = 0; r <= size; r += br) {
            ctx.beginPath();
            ctx.moveTo(0, r * cellSize);
            ctx.lineTo(gridSizePx, r * cellSize);
            ctx.stroke();
        }
        for (let c = 0; c <= size; c += bc) {
            ctx.beginPath();
            ctx.moveTo(c * cellSize, 0);
            ctx.lineTo(c * cellSize, gridSizePx);
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawPuzzle(ctx, puzzle, type, imagesToUse, x, y, gridSizePx, size) {
        drawGrid(ctx, x, y, gridSizePx, size);
        const cellSize = gridSizePx / size;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const value = puzzle[r][c];
                if (value === 0) continue;

                const centerX = x + c * cellSize + cellSize / 2;
                const centerY = y + r * cellSize + cellSize / 2;

                if (type === 'getallen') {
                    ctx.fillStyle = '#000';
                    ctx.font = `${cellSize * 0.6}px Arial`;
                    ctx.fillText(value, centerX, centerY);
                } else {
                    const imgIndex = value - 1;
                    if (imagesToUse &&
                        imagesToUse[imgIndex] &&
                        imagesToUse[imgIndex].complete) {

                        const img = imagesToUse[imgIndex];
                        const margin = cellSize * 0.1;
                        const availableSpace = cellSize - 2 * margin;

                        const aspectRatio = img.naturalWidth / img.naturalHeight;
                        let newWidth, newHeight;
                        if (aspectRatio > 1) {
                            newWidth = availableSpace;
                            newHeight = availableSpace / aspectRatio;
                        } else {
                            newHeight = availableSpace;
                            newWidth = availableSpace * aspectRatio;
                        }

                        const drawX = x + c * cellSize + (cellSize - newWidth) / 2;
                        const drawY = y + r * cellSize + (cellSize - newHeight) / 2;
                        ctx.drawImage(img, drawX, drawY, newWidth, newHeight);
                    }
                }
            }
        }
    }

    // --- UI / validatie ---
    function getNeededImagesCount() {
        const type = document.querySelector('input[name="sudokuType"]:checked').value;
        if (type !== 'afbeeldingen') return 0;

        const aantal = parseInt(aantalSelect.value, 10);
        const variety = document.querySelector('input[name="imageVariety"]:checked').value;

        return (variety === 'different' && aantal > 1) ? currentSize * aantal : currentSize;
    }

    function updateUiForImageOptions() {
        const aantal = parseInt(aantalSelect.value, 10);
        const type = document.querySelector('input[name="sudokuType"]:checked').value;

        themeSelectionGroup.style.display = (type === 'afbeeldingen') ? 'block' : 'none';
        imageControls.style.display = (type === 'afbeeldingen') ? 'block' : 'none';

        const needed = getNeededImagesCount();
        const isThemeConfirmed =
            (selectedTheme && selectedThemeImagesForSudoku.length === needed);

        themeImageSelection.style.display =
            (type === 'afbeeldingen' && selectedTheme && !isThemeConfirmed) ? 'block' : 'none';

        userUploadControls.style.display =
            (type === 'afbeeldingen' && !selectedTheme) ? 'block' : 'none';

        imageVarietyControls.style.display =
            (type === 'afbeeldingen' && aantal > 1) ? 'block' : 'none';

        aantalMelding.textContent =
            (aantal > 1) ? `Het werkblad zal ${aantal} verschillende sudoku's bevatten.` : '';

        updateImageUploadLabel();
        renderImagePreviews();
    }

    function updateImageUploadLabel() {
        const type = document.querySelector('input[name="sudokuType"]:checked').value;
        if (type === 'getallen') {
            meldingContainer.textContent = '';
            return;
        }

        const needed = getNeededImagesCount();

        if (selectedTheme) {
            themeImageSelectionLabel.textContent = `Kies ${needed} afbeelding(en) uit het thema:`;
            const currentSelectedCount = selectedThemeImagesForSudoku.length;
            if (currentSelectedCount < needed) {
                meldingContainer.textContent =
                    `Selecteer nog ${needed - currentSelectedCount} afbeelding(en).`;
                meldingContainer.style.color = '#d9534f';
                confirmThemeImagesBtn.disabled = true;
            } else if (currentSelectedCount > needed) {
                meldingContainer.textContent =
                    `Je hebt er ${currentSelectedCount - needed} te veel geselecteerd.`;
                meldingContainer.style.color = '#d9534f';
                confirmThemeImagesBtn.disabled = true;
            } else {
                meldingContainer.textContent = `Perfect! Klik op 'Bevestig selectie'.`;
                meldingContainer.style.color = 'green';
                confirmThemeImagesBtn.disabled = false;
            }
            return;
        }

        const currentUploadedCount = userImages.length;
        imageInputLabel.textContent = `Kies ${needed} afbeeldingen:`;
        if (needed > 0 && currentUploadedCount < needed) {
            meldingContainer.textContent =
                `${currentUploadedCount}/${needed} geselecteerd. Nog ${needed - currentUploadedCount} nodig.`;
            meldingContainer.style.color = '#d9534f';
        } else if (currentUploadedCount >= needed && needed > 0) {
            meldingContainer.textContent =
                `Perfect! Je hebt ${currentUploadedCount} unieke afbeeldingen.`;
            meldingContainer.style.color = 'green';
        } else {
            meldingContainer.textContent = '';
        }
    }

    function renderImagePreviews() {
        imagePreviews.innerHTML = '';
        selectableThemeImagePreviews.innerHTML = '';

        const imagesToRender = selectedTheme ? allLoadedThemeImages : userImages;
        const previewContainer = selectedTheme ? selectableThemeImagePreviews : imagePreviews;

        imagesToRender.forEach(img => {
            const imgWrapper = document.createElement('div');
            imgWrapper.classList.add('theme-image-wrapper');

            const previewImg = document.createElement('img');
            previewImg.src = img.src;
            imgWrapper.appendChild(previewImg);
            previewContainer.appendChild(imgWrapper);

            if (selectedTheme) {
                if (selectedThemeImagesForSudoku.some(sImg => sImg.src === img.src)) {
                    imgWrapper.classList.add('selected');
                }
                imgWrapper.addEventListener('click', () => {
                    const index =
                        selectedThemeImagesForSudoku.findIndex(sImg => sImg.src === img.src);
                    const needed = getNeededImagesCount();
                    if (index > -1) {
                        selectedThemeImagesForSudoku.splice(index, 1);
                        imgWrapper.classList.remove('selected');
                    } else if (selectedThemeImagesForSudoku.length < needed) {
                        selectedThemeImagesForSudoku.push(img);
                        imgWrapper.classList.add('selected');
                    }
                    updateImageUploadLabel();
                });
            }
        });
    }

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Afbeelding niet geladen: ${src}`));
        });
    }

    // --- State opbouw + canvastekening ---
    function buildWorksheetState() {
        const type = document.querySelector('input[name="sudokuType"]:checked').value;
        const aantal = parseInt(aantalSelect.value, 10);
        const difficulty = difficultySelect.value;
        const variety = document.querySelector('input[name="imageVariety"]:checked').value;
        const useDifferentImagesPerSudoku =
            (type === 'afbeeldingen' && aantal > 1 && variety === 'different');

        if (!GRID_SPECS[currentSize]) {
            meldingContainer.textContent = "Onbekend formaat.";
            return { valid: false };
        }

        let imagesForWorksheet = [];
        if (type === 'afbeeldingen') {
            const needed = getNeededImagesCount();
            const sourceImages = selectedTheme ? selectedThemeImagesForSudoku : userImages;
            if (sourceImages.length < needed) {
                worksheetSudokus = [];
                worksheetSolutions = [];
                worksheetImageSets = [];
                worksheetMissingImagesPerSudoku = [];
                worksheetMissingImages = [];
                updateImageUploadLabel();
                return { valid: false };
            }
            imagesForWorksheet = sourceImages;
        }

        worksheetSudokus = [];
        worksheetSolutions = [];
        worksheetImageSets = [];
        worksheetMissingImagesPerSudoku = [];
        worksheetMissingImages = [];

        for (let i = 0; i < aantal; i++) {
            const { solution, puzzle } =
                createSudokuWithDifficulty(currentSize, difficulty);

            worksheetSolutions.push(solution);
            worksheetSudokus.push(puzzle);

            let imageSet = [];
            if (type === 'afbeeldingen') {
                const baseImages = useDifferentImagesPerSudoku
                    ? imagesForWorksheet.slice(i * currentSize, (i + 1) * currentSize)
                    : imagesForWorksheet.slice(0, currentSize);
                imageSet = shuffle([...baseImages]);
            }
            worksheetImageSets.push(imageSet);

            const missingForThis = [];
            if (type === 'afbeeldingen') {
                for (let r = 0; r < currentSize; r++) {
                    for (let c = 0; c < currentSize; c++) {
                        if (puzzle[r][c] === 0) {
                            const value = solution[r][c];
                            const img = imageSet[value - 1];
                            if (img) {
                                missingForThis.push(img);
                                worksheetMissingImages.push(img); // totaal (4×4)
                            }
                        }
                    }
                }
            }
            worksheetMissingImagesPerSudoku.push(missingForThis);
        }

        return { valid: true, type, aantal };
    }

  function drawWorksheetOnCanvas(type, aantal) {
    if (worksheetSudokus.length === 0) {
        canvas.width = 700;
        canvas.height = 500;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
    }

    const isLarge = (currentSize === 6 || currentSize === 9);
    const aantalToDraw = isLarge ? 1 : aantal;

    canvas.width = 700;

    // Hoeveel sudoku's naast/boven elkaar op CANVAS?
    const cols = (!isLarge && (aantalToDraw === 2 || aantalToDraw === 4)) ? 2 : 1;
    const rows = (!isLarge && aantalToDraw === 3) ? 3 :
                 (!isLarge && aantalToDraw === 4) ? 2 : 1;

    const padding = 20;
    const topTextHeight = (isLarge && aantal > 1) ? 25 : 0;

    const availableWidth = canvas.width - (cols + 1) * padding;

    // ⭐ Rooster bewust iets kleiner maken
    const sudokuSize = (availableWidth / cols) * 0.8;

    const sudokuAreaHeight =
        topTextHeight + rows * sudokuSize + (rows + 1) * padding;

    // Welke knipafbeeldingen tonen op canvas?
    let knipImages;
    if (!isLarge) {
        knipImages = worksheetMissingImages;
    } else {
        knipImages = worksheetMissingImagesPerSudoku[0] || [];
    }

    // ===== Hoogte voor het knipblad berekenen =====
    let knipHeight = 0;
    let cutCfg = null;

    if (type === 'afbeeldingen' && knipImages.length > 0) {
        const marginX = 20;
        const cutSpacing = 12;
        const targetCutSize = 95; // ⭐ groter knipvakje

        const cutImagesPerRow = Math.max(
            1,
            Math.floor(
                (canvas.width - 2 * marginX + cutSpacing) /
                (targetCutSize + cutSpacing)
            )
        );

        const numRows = Math.ceil(knipImages.length / cutImagesPerRow);

        // Titel + ruimte + rijen knipvakjes + marge onderaan
        knipHeight = 35 + 25 + numRows * (targetCutSize + cutSpacing) + 20;

        cutCfg = {
            marginX,
            cutSpacing,
            targetCutSize,
            cutImagesPerRow,
            numRows
        };
    }

    const totalHeight =
        sudokuAreaHeight + (knipHeight > 0 ? knipHeight : padding * 2);

    canvas.height = totalHeight;

    // Achtergrond
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Eventuele melding bovenaan bij grote formaten
    if (isLarge && aantal > 1) {
        ctx.fillStyle = '#004080';
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(
            `Voorbeeld van pagina 1 – PDF zal ${aantal} pagina's bevatten.`,
            canvas.width / 2,
            5
        );
    }

    // ===== Sudoku's tekenen =====
    for (let i = 0; i < aantalToDraw; i++) {
        const puzzle = worksheetSudokus[i];
        const imageSet = worksheetImageSets[i];

        const col = (cols === 1) ? 0 : (i % cols);
        const row = (cols === 1) ? i : Math.floor(i / cols);

        const x = padding + col * (sudokuSize + padding);
        const y = topTextHeight + padding + row * (sudokuSize + padding);

        drawPuzzle(ctx, puzzle, type, imageSet, x, y, sudokuSize, currentSize);
    }

    // ===== Knipblad tekenen (groot) =====
    if (type === 'afbeeldingen' && cutCfg && knipImages.length > 0) {
        const {
            marginX,
            cutSpacing,
            targetCutSize,
            cutImagesPerRow,
            numRows
        } = cutCfg;

        const titleY = sudokuAreaHeight + 20;

        ctx.fillStyle = '#000';
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
            "Knip de afbeeldingen uit en plak ze op de juiste plaats:",
            canvas.width / 2,
            titleY
        );

        let index = 0;
        const firstBoxY = titleY + 25;

        for (let r = 0; r < numRows; r++) {
            for (let c = 0; c < cutImagesPerRow && index < knipImages.length; c++) {

                const boxX = marginX + c * (targetCutSize + cutSpacing);
                const boxY = firstBoxY + r * (targetCutSize + cutSpacing);

                // Gestreept knipkader
                ctx.save();
                ctx.strokeStyle = '#004080';
                ctx.setLineDash([5, 4]);
                ctx.lineWidth = 1.7;
                ctx.strokeRect(boxX, boxY, targetCutSize, targetCutSize);
                ctx.restore();

                const img = knipImages[index];
                if (img && img.complete) {
                    const marginInside = 8;
                    const available = targetCutSize - 2 * marginInside;
                    const ratio = img.naturalWidth / img.naturalHeight;
                    let w, h;

                    if (ratio > 1) {
                        w = available;
                        h = available / ratio;
                    } else {
                        h = available;
                        w = available * ratio;
                    }

                    const drawX = boxX + (targetCutSize - w) / 2;
                    const drawY = boxY + (targetCutSize - h) / 2;
                    ctx.drawImage(img, drawX, drawY, w, h);
                }

                index++;
            }
        }
    }
}

    async function generateAndDraw() {
        showLoading(true);
        try {
            const stateInfo = buildWorksheetState();
            if (!stateInfo.valid) {
                canvas.width = 700;
                canvas.height = 500;
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                return;
            }
            const { type, aantal } = stateInfo;
            drawWorksheetOnCanvas(type, aantal);
        } finally {
            showLoading(false);
        }
    }

    // --- Event handlers ---
   [...typeRadios, ...imageVarietyRadios, aantalSelect, difficultySelect].forEach(el => {
    el.addEventListener('change', () => {

        const selectedType = document.querySelector('input[name="sudokuType"]:checked').value;
        const previousType = (worksheetImageSets.length > 0 || userImages.length > 0 || selectedThemeImagesForSudoku.length > 0)
            ? "afbeeldingen"
            : "getallen";

        // Alleen wissen wanneer het type écht verandert
        if (selectedType !== previousType) {
            clearSelectionAndResetUI(false);
            updateUiForImageOptions();   // <— BELANGRIJK: UI opnieuw opbouwen
            return;
        }

        // In alle andere gevallen: niets wissen, enkel UI bijwerken en opnieuw tekenen
        updateUiForImageOptions();
        generateAndDraw();
    });
});


    gridSizeSelect.addEventListener('change', () => {
        currentSize = parseInt(gridSizeSelect.value, 10) || 4;
        clearSelectionAndResetUI(false);
    });

    themeSelect.addEventListener('change', async (event) => {
        const theme = event.target.value;
        clearSelectionAndResetUI(false);
        selectedTheme = theme;

        if (theme) {
            meldingContainer.textContent =
                `Thema ${themeSelect.options[themeSelect.selectedIndex].text} laden...`;
            try {
                allLoadedThemeImages =
                    await Promise.all(themeImagePaths[theme].map(path => loadImage(path)));
                meldingContainer.textContent = '';
            } catch (error) {
                meldingContainer.textContent = "Fout bij laden thema-afbeeldingen.";
                allLoadedThemeImages = [];
                selectedTheme = null;
                themeSelect.value = "";
            }
        }
        updateUiForImageOptions();
        generateAndDraw();
    });

    confirmThemeImagesBtn.addEventListener('click', async () => {
        const needed = getNeededImagesCount();
        if (selectedThemeImagesForSudoku.length === needed) {
            await Promise.all(
                selectedThemeImagesForSudoku.map(img =>
                    img.complete ? Promise.resolve()
                        : new Promise(resolve => { img.onload = resolve; })
                )
            );
            updateUiForImageOptions();
            generateAndDraw();
        }
    });

    imageInput.addEventListener('change', async (event) => {
        const files = Array.from(event.target.files);
        if (selectedTheme || files.length === 0) {
            imageInput.value = null;
            return;
        }

        const needed = getNeededImagesCount();
        userImages = [];
        uploadedImageData.clear();

        const readers = files.map(file => new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = (e) => resolve({ dataURL: e.target.result });
            reader.readAsDataURL(file);
        }));

        const results = await Promise.all(readers);
        let newImagesLoaded = [];
        for (const { dataURL } of results) {
            if (!uploadedImageData.has(dataURL) && newImagesLoaded.length < needed) {
                uploadedImageData.add(dataURL);
                const img = new Image();
                img.src = dataURL;
                newImagesLoaded.push(img);
            }
        }
        userImages = newImagesLoaded;

        updateUiForImageOptions();
        generateAndDraw();
        imageInput.value = null;
    });

    function clearSelectionAndResetUI(resetThemeDropdown = true) {
        userImages = [];
        uploadedImageData.clear();
        allLoadedThemeImages = [];
        selectedThemeImagesForSudoku = [];
        worksheetSudokus = [];
        worksheetSolutions = [];
        worksheetImageSets = [];
        worksheetMissingImagesPerSudoku = [];
        worksheetMissingImages = [];

        if (resetThemeDropdown) {
            selectedTheme = null;
            themeSelect.value = "";
        }
        imageInput.value = null;
        updateUiForImageOptions();
        generateAndDraw();
    }

    clearImagesBtn.addEventListener('click', () => clearSelectionAndResetUI(true));
    generateBtn.addEventListener('click', generateAndDraw);

    // --- Hulpfunctie: wacht tot alle afbeeldingen geladen zijn ---
    async function ensureAllImagesLoaded(arr) {
        const promises = arr.map(img =>
            img && !img.complete
                ? new Promise(resolve => { img.onload = resolve; img.onerror = resolve; })
                : Promise.resolve()
        );
        await Promise.all(promises);
    }
// =========================
//   KNIPBLAD OP APARTE PAGINA – VASTE MAAT (20 mm)
// =========================
function renderKnipbladOnNewPage(doc, missingForThis, pageWidth, pageHeight, margin) {

    if (!missingForThis || missingForThis.length === 0) return;

    doc.addPage();

    const cutSize = 20;      // ⭐ vaste knipmaat
    const spacing = 4;       // ruimte tussen vakjes
    const maxPerRow = 5;     // ⭐ altijd 5 per rij

    const count = missingForThis.length;
    const rows = Math.ceil(count / maxPerRow);

    // Titel
    doc.setFontSize(16);
    doc.text(
        "Knip de afbeeldingen uit en plak ze op de juiste plaats:",
        pageWidth / 2,
        margin,
        { align: 'center' }
    );

    let index = 0;
    let y = margin + 10;

    for (let r = 0; r < rows; r++) {
        let x = margin;

        for (let c = 0; c < maxPerRow && index < count; c++) {

            const img = missingForThis[index];

            doc.setLineWidth(0.3);
            doc.setDrawColor(0, 64, 128);
            doc.setLineDash([2, 2], 0);
            doc.rect(x, y, cutSize, cutSize);

            if (img && img.complete) {
                const inner = cutSize - 4;
                const ratio = img.naturalWidth / img.naturalHeight;
                let w, h;
                if (ratio > 1) { w = inner; h = inner / ratio; }
                else { h = inner; w = inner * ratio; }

                const dx = x + (cutSize - w) / 2;
                const dy = y + (cutSize - h) / 2;

                doc.addImage(img, "PNG", dx, dy, w, h);
            }

            x += cutSize + spacing;
            index++;
        }

        y += cutSize + spacing;
    }
}

    // --- Downloadfuncties ---
    downloadPngBtn.addEventListener('click', () => {
        const aantal = parseInt(aantalSelect.value, 10);
        const dataURL = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataURL;
        a.download = `sudoku-werkblad-${aantal}.png`;
        a.click();
    });

    downloadPdfBtn.addEventListener('click', async () => {
        showLoading(true);
        try {
            const type = document.querySelector('input[name="sudokuType"]:checked').value;
            const aantal = parseInt(aantalSelect.value, 10);

            if (worksheetSudokus.length === 0) {
                await generateAndDraw();
            }

            // Zorg dat alle afbeeldingen volledig zijn geladen
            await ensureAllImagesLoaded(worksheetMissingImages);
            for (let imgSet of worksheetImageSets) {
                await ensureAllImagesLoaded(imgSet);
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 10;

            const isLarge = (currentSize === 6 || currentSize === 9);

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 512;
            tempCanvas.height = 512;
            const tempCtx = tempCanvas.getContext('2d');

            if (!isLarge) {
                // --- 4×4: alles op 1 pagina ---
                let knipbladHoogte = 0;
                if (type === 'afbeeldingen' && worksheetMissingImages.length > 0) {
                    const cutImagesPerRow = Math.min(6, worksheetMissingImages.length);
                    const imgBoxSpacing = 2;
                    const cutImageSize =
                        (pageWidth - 2 * margin - (cutImagesPerRow - 1) * imgBoxSpacing) /
                        cutImagesPerRow;
                    const numRows =
                        Math.ceil(worksheetMissingImages.length / cutImagesPerRow);
                    knipbladHoogte =
                        numRows * (cutImageSize + imgBoxSpacing) + margin + 10;
                }

                const layouts = calculateLayouts(aantal, pageWidth, pageHeight,
                    margin, knipbladHoogte, 0);

                for (let i = 0; i < aantal && i < worksheetSudokus.length; i++) {
                    tempCtx.fillStyle = "white";
                    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

                    const puzzle = worksheetSudokus[i];
                    const imageSet = worksheetImageSets[i];

                    drawPuzzle(tempCtx, puzzle, type, imageSet,
                        0, 0, tempCanvas.width, currentSize);

                    const layout = layouts[i];
                    doc.addImage(
                        tempCanvas.toDataURL('image/png'),
                        'PNG',
                        layout.x,
                        layout.y,
                        layout.size,
                        layout.size
                    );
                }

                // Knipblad onderaan
                if (type === 'afbeeldingen' && worksheetMissingImages.length > 0) {
                    const cutImagesPerRow = Math.min(10, worksheetMissingImages.length);
                    const imgBoxSpacing = 2;
                    const cutImageSize =
                        (pageWidth - 2 * margin - (cutImagesPerRow - 1) * imgBoxSpacing) /
                        cutImagesPerRow;

                    const startY = pageHeight - knipbladHoogte + margin;

                    doc.setFontSize(14);
                    doc.text(
                        "Knip de afbeeldingen uit en plak ze op de juiste plaats:",
                        pageWidth / 2,
                        startY - 5,
                        { align: 'center' }
                    );

                    let index = 0;
                    const imgStartY = startY + 2;

                    for (let r = 0; index < worksheetMissingImages.length; r++) {
                        for (let c = 0;
                             c < cutImagesPerRow && index < worksheetMissingImages.length;
                             c++) {

                            const boxX = margin + c * (cutImageSize + imgBoxSpacing);
                            const boxY = imgStartY + r * (cutImageSize + imgBoxSpacing);

                            doc.setDrawColor('#004080');
                            doc.setLineDashPattern([2, 1.5], 0);
                            doc.rect(boxX, boxY, cutImageSize, cutImageSize);
                            doc.setLineDashPattern([], 0);

                            const img = worksheetMissingImages[index];
                            if (img && img.complete) {
                                const marginInBox = 1;
                                const availableSpace = cutImageSize - 2 * marginInBox;
                                const aspectRatio = img.naturalWidth / img.naturalHeight;
                                let newWidth, newHeight;
                                if (aspectRatio > 1) {
                                    newWidth = availableSpace;
                                    newHeight = availableSpace / aspectRatio;
                                } else {
                                    newHeight = availableSpace;
                                    newWidth = availableSpace * aspectRatio;
                                }
                                const drawX = boxX + (cutImageSize - newWidth) / 2;
                                const drawY = boxY + (cutImageSize - newHeight) / 2;
                                doc.addImage(img.src, 'PNG', drawX, drawY, newWidth, newHeight);
                            }

                            index++;
                        }
                    }
                }

            } else {
                // --- 6×6 of 9×9: 1 sudoku per pagina ---
                for (let i = 0; i < aantal && i < worksheetSudokus.length; i++) {
                    if (i > 0) doc.addPage();

                    const missingForThis = worksheetMissingImagesPerSudoku[i] || [];

                    let knipbladHoogte = 0;
                    if (type === 'afbeeldingen' && missingForThis.length > 0) {
                        const cutImagesPerRow = Math.min(6, missingForThis.length);
                        const imgBoxSpacing = 2;
                        const cutImageSize =
                            (pageWidth - 2 * margin - (cutImagesPerRow - 1) * imgBoxSpacing) /
                            cutImagesPerRow;
                        const numRows =
                            Math.ceil(missingForThis.length / cutImagesPerRow);
                        knipbladHoogte =
                            numRows * (cutImageSize + imgBoxSpacing) + margin + 10;
                    }

                    const layouts = calculateLayouts(1, pageWidth, pageHeight,
                        margin, knipbladHoogte, 0);

                    tempCtx.fillStyle = "white";
                    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

                    const puzzle = worksheetSudokus[i];
                    const imageSet = worksheetImageSets[i];

                    drawPuzzle(tempCtx, puzzle, type, imageSet,
                        0, 0, tempCanvas.width, currentSize);

                    const layout = layouts[0];
                    doc.addImage(
                        tempCanvas.toDataURL('image/png'),
                        'PNG',
                        layout.x,
                        layout.y,
                        layout.size,
                        layout.size
                    );

                    if (type === 'afbeeldingen' && missingForThis.length > 0) {
                       const targetCutSize = 30; // grotere vakjes
const imgBoxSpacing = 4;

const cutImagesPerRow = Math.max(
    1,
    Math.floor(
        (pageWidth - 2 * margin + imgBoxSpacing) /
        (targetCutSize + imgBoxSpacing)
    )
);

const cutImageSize = targetCutSize;


                        const startY = pageHeight - knipbladHoogte + margin;

                        doc.setFontSize(14);
                        doc.text(
                            "Knip de afbeeldingen uit en plak ze op de juiste plaats:",
                            pageWidth / 2,
                            startY - 5,
                            { align: 'center' }
                        );

                        let index = 0;
                        const imgStartY = startY + 2;

                        for (let r = 0; index < missingForThis.length; r++) {
                            for (let c = 0;
                                 c < cutImagesPerRow && index < missingForThis.length;
                                 c++) {

                                const boxX = margin + c * (cutImageSize + imgBoxSpacing);
                                const boxY = imgStartY + r * (cutImageSize + imgBoxSpacing);

                                doc.setDrawColor('#004080');
                                doc.setLineDashPattern([2, 1.5], 0);
                                doc.rect(boxX, boxY, cutImageSize, cutImageSize);
                                doc.setLineDashPattern([], 0);

                                const img = missingForThis[index];
                                if (img && img.complete) {
                                    const marginInBox = 1;
                                    const availableSpace = cutImageSize - 2 * marginInBox;
                                    const aspectRatio = img.naturalWidth / img.naturalHeight;
                                    let newWidth, newHeight;
                                    if (aspectRatio > 1) {
                                        newWidth = availableSpace;
                                        newHeight = availableSpace / aspectRatio;
                                    } else {
                                        newHeight = availableSpace;
                                        newWidth = availableSpace * aspectRatio;
                                    }
                                    const drawX = boxX + (cutImageSize - newWidth) / 2;
                                    const drawY = boxY + (cutImageSize - newHeight) / 2;
                                    doc.addImage(img.src, 'PNG', drawX, drawY, newWidth, newHeight);
                                }

                                index++;
                            }
                        }
                    }
                }
            }

            doc.save(`sudoku-werkblad-${aantal}.pdf`);
            meldingContainer.textContent = '';
        } finally {
            showLoading(false);
        }
    });

    // Zelfde layoutfunctie als in je vorige versie
    function calculateLayouts(aantal, pageWidth, pageHeight, margin, bottomSpace, topSpace) {
        const layouts = [];
        const vPadding = 10;
        const hPadding = 10;
        const contentStartY = topSpace + margin;

        let availableHeight = pageHeight - topSpace - bottomSpace - 2 * margin;
        let availableWidth = pageWidth - 2 * margin;

        let sudokuSize, startX, startY, totalContentWidth, totalContentHeight;

        if (aantal === 1) {
            sudokuSize = Math.min(availableWidth, availableHeight);
            layouts.push({
                x: margin + (availableWidth - sudokuSize) / 2,
                y: contentStartY + (availableHeight - sudokuSize) / 2,
                size: sudokuSize
            });
        } else if (aantal === 2) {
            sudokuSize = Math.min((availableWidth - hPadding) / 2, availableHeight);
            totalContentWidth = 2 * sudokuSize + hPadding;
            startX = margin + (availableWidth - totalContentWidth) / 2;
            startY = contentStartY + (availableHeight - sudokuSize) / 2;
            layouts.push({ x: startX, y: startY, size: sudokuSize });
            layouts.push({ x: startX + sudokuSize + hPadding, y: startY, size: sudokuSize });
        } else if (aantal === 3) {
            sudokuSize = Math.min(availableWidth, (availableHeight - 2 * vPadding) / 3);
            totalContentHeight = 3 * sudokuSize + 2 * vPadding;
            startX = margin + (availableWidth - sudokuSize) / 2;
            startY = contentStartY + (availableHeight - totalContentHeight) / 2;
            layouts.push({ x: startX, y: startY, size: sudokuSize });
            layouts.push({ x: startX, y: startY + sudokuSize + vPadding, size: sudokuSize });
            layouts.push({
                x: startX,
                y: startY + 2 * (sudokuSize + vPadding),
                size: sudokuSize
            });
        } else if (aantal === 4) {
            sudokuSize = Math.min(
                (availableWidth - hPadding) / 2,
                (availableHeight - vPadding) / 2
            );
            totalContentWidth = 2 * sudokuSize + hPadding;
            totalContentHeight = 2 * sudokuSize + vPadding;
            startX = margin + (availableWidth - totalContentWidth) / 2;
            startY = contentStartY + (availableHeight - totalContentHeight) / 2;
            layouts.push({ x: startX, y: startY, size: sudokuSize });
            layouts.push({ x: startX + sudokuSize + hPadding, y: startY, size: sudokuSize });
            layouts.push({
                x: startX,
                y: startY + sudokuSize + vPadding,
                size: sudokuSize
            });
            layouts.push({
                x: startX + sudokuSize + hPadding,
                y: startY + sudokuSize + vPadding,
                size: sudokuSize
            });
        }
        return layouts;
    }

    // --- Initieel ---
    updateUiForImageOptions();
    generateAndDraw();
});

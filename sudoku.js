document.addEventListener("DOMContentLoaded", () => {
    // --- Globale variabelen en initialisatie ---
    const canvas = document.getElementById("mainCanvas");
    const ctx = canvas.getContext("2d");
    const size = 4; // 4x4 Sudoku

    let userImages = [];
    let uploadedImageData = new Set(); // Voor detectie van duplicaten
    let currentPuzzle = [];

    // --- DOM-elementen ophalen ---
    const typeRadios = document.querySelectorAll('input[name="sudokuType"]');
    const imageControls = document.getElementById('image-controls');
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

    // --- Sudoku Generatie Logica ---
    const shuffle = (array) => array.sort(() => Math.random() - 0.5);

    function generateSolvedGrid() {
        const base = shuffle([1, 2, 3, 4]);
        let grid = Array(size).fill(null).map(() => Array(size));
        grid[0] = base;
        for (let r = 1; r < size; r++) {
            for (let c = 0; c < size; c++) {
                grid[r][c] = grid[r - 1][(c + ((r % 2 === 0) ? 1 : 2)) % size];
            }
        }
        return grid;
    }

    function createPuzzle(grid, difficulty) {
        let puzzle = JSON.parse(JSON.stringify(grid));
        const difficulties = { easy: 6, medium: 8, hard: 10 };
        let cells = [];
        for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) cells.push({ r, c });
        shuffle(cells).slice(0, difficulties[difficulty] || 8).forEach(cell => puzzle[cell.r][cell.c] = 0);
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

    function drawPuzzle(puzzle, type, imageOffset = 0) {
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
                    const imgIndex = value - 1 + imageOffset;
                    if (userImages[imgIndex] && userImages[imgIndex].complete) {
                        const margin = cellSize * 0.1;
                        ctx.drawImage(userImages[imgIndex], c * cellSize + margin, r * cellSize + margin, cellSize - 2 * margin, cellSize - 2 * margin);
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
        return (variety === 'different' && aantal > 1) ? size * aantal : size;
    }
    
    function updateUiForImageOptions() {
        const aantal = parseInt(aantalSelect.value);
        const type = document.querySelector('input[name="sudokuType"]:checked').value;
        
        imageControls.style.display = (type === 'afbeeldingen') ? 'block' : 'none';
        imageVarietyControls.style.display = (type === 'afbeeldingen' && aantal > 1) ? 'block' : 'none';

        if (aantal > 1) {
            aantalMelding.textContent = `Het werkblad zal ${aantal} verschillende sudoku's bevatten.`;
        } else {
            aantalMelding.textContent = '';
        }
        
        updateImageUploadLabel();
    }

    function updateImageUploadLabel() {
        const needed = getNeededImagesCount();
        const current = userImages.length;
        const remaining = needed - current;
        
        let labelText = `Kies ${needed} afbeeldingen:`;
        let statusText = `${current}/${needed} geselecteerd.`;
        if (remaining > 0) {
            statusText += ` Nog ${remaining} nodig.`;
        }
        imageInputLabel.textContent = labelText;
        meldingContainer.textContent = (needed > 0) ? statusText : '';
        if (current >= needed && needed > 0) {
            meldingContainer.style.color = 'green';
            meldingContainer.textContent = `Perfect! Je hebt ${current} unieke afbeeldingen geselecteerd.`;
        } else {
            meldingContainer.style.color = '#d9534f'; // Default error color
        }
    }

    function renderImagePreviews() {
        imagePreviews.innerHTML = '';
        userImages.forEach(img => {
            const previewImg = document.createElement('img');
            previewImg.src = img.src;
            imagePreviews.appendChild(previewImg);
        });
    }

    // --- Event Handlers ---
    function generateAndDraw() {
        const needed = getNeededImagesCount();
        const type = document.querySelector('input[name="sudokuType"]:checked').value;
        if (type === 'afbeeldingen' && userImages.length < needed) {
            drawGrid();
            return;
        }
        currentPuzzle = createPuzzle(generateSolvedGrid(), difficultySelect.value);
        drawPuzzle(currentPuzzle, type);
    }
    
    [...typeRadios, ...imageVarietyRadios, aantalSelect].forEach(el => {
        el.addEventListener('change', () => {
            clearImagesBtn.click();
            updateUiForImageOptions();
        });
    });

    imageInput.addEventListener('change', (event) => {
        const files = event.target.files;
        const needed = getNeededImagesCount();
        let duplicates = [];
        let processingCount = files.length;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const dataURL = e.target.result;
                if (uploadedImageData.has(dataURL)) {
                    duplicates.push(file.name);
                } else if (userImages.length < needed) {
                    uploadedImageData.add(dataURL);
                    const img = new Image();
                    img.src = dataURL;
                    userImages.push(img);
                }

                processingCount--;
                if (processingCount === 0) {
                    renderImagePreviews();
                    updateImageUploadLabel();
                    generateAndDraw();
                    if(duplicates.length > 0) {
                        alert(`De volgende afbeeldingen zijn dubbel en niet toegevoegd:\n${duplicates.join('\n')}`);
                    }
                }
            };
            reader.readAsDataURL(file);
        }
        imageInput.value = null;
    });

    clearImagesBtn.addEventListener('click', () => {
        userImages = [];
        uploadedImageData.clear();
        renderImagePreviews();
        updateImageUploadLabel();
        drawGrid();
    });

    generateBtn.addEventListener('click', generateAndDraw);
    difficultySelect.addEventListener('change', generateAndDraw);

    // --- Download Functies ---
    async function generateWorksheet(outputType) {
        const aantal = parseInt(aantalSelect.value);
        const type = document.querySelector('input[name="sudokuType"]:checked').value;
        const difficulty = difficultySelect.value;
        const variety = document.querySelector('input[name="imageVariety"]:checked').value;
        const useDifferentImages = (type === 'afbeeldingen' && variety === 'different' && aantal > 1);
        const neededImages = useDifferentImages ? size * aantal : size;

        if (type === 'afbeeldingen' && userImages.length < neededImages) {
            meldingContainer.textContent = `Upload eerst ${neededImages} afbeeldingen!`;
            return;
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
            const imageOffset = useDifferentImages ? i * size : 0;
            drawPuzzle(puzzles[i], type, imageOffset);
            const col = (aantal === 2 || aantal === 4) ? (i % 2) : 0;
            const row = (aantal === 3) ? i : (aantal === 4 ? Math.floor(i / 2) : 0);
            tempCtx.drawImage(canvas, col * canvas.width, row * canvas.height);
        }

        const dataURL = tempCanvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataURL;
        a.download = `sudoku-werkblad-${aantal}.png`;
        a.click();

        drawPuzzle(currentPuzzle, type);
        meldingContainer.textContent = '';
    }

    downloadPngBtn.addEventListener('click', () => generateWorksheet('png'));
    
    downloadPdfBtn.addEventListener('click', async () => {
        const aantal = parseInt(aantalSelect.value);
        const type = document.querySelector('input[name="sudokuType"]:checked').value;
        const difficulty = difficultySelect.value;
        const variety = document.querySelector('input[name="imageVariety"]:checked').value;
        const useDifferentImages = (type === 'afbeeldingen' && variety === 'different' && aantal > 1);
        const neededImages = useDifferentImages ? size * aantal : size;

        if (type === 'afbeeldingen' && userImages.length < neededImages) {
            meldingContainer.textContent = `Upload eerst ${neededImages} afbeeldingen!`;
            return;
        }
        meldingContainer.textContent = 'Bezig met het genereren van de PDF...';
        
        let puzzles = [];
        let allMissingData = [];
        for (let i = 0; i < aantal; i++) {
            const solvedGrid = generateSolvedGrid();
            const puzzle = createPuzzle(solvedGrid, difficulty);
            puzzles.push(puzzle);
            if (type === 'afbeeldingen') {
                const imageOffset = useDifferentImages ? i * size : 0;
                for (let r = 0; r < size; r++) {
                    for (let c = 0; c < size; c++) {
                        if (puzzle[r][c] === 0) {
                            allMissingData.push({ number: solvedGrid[r][c], offset: imageOffset });
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

        const tempLayouts = calculateLayouts(aantal, pageWidth, pageHeight, margin, 80, titleHeight);
        const sudokuCellSize = tempLayouts.length > 0 ? (tempLayouts[0].size / size) : 0;

        let knipbladHoogte = 0;
        if (type === 'afbeeldingen' && allMissingData.length > 0) {
            const imgBoxSize = sudokuCellSize;
            const imgBoxSpacing = 2;
            const imagesPerRow = Math.floor((pageWidth - 2 * margin) / (imgBoxSize + imgBoxSpacing));
            const numRows = imagesPerRow > 0 ? Math.ceil(allMissingData.length / imagesPerRow) : allMissingData.length;
            knipbladHoogte = numRows * (imgBoxSize + imgBoxSpacing) + margin;
        }

        const finalLayouts = calculateLayouts(aantal, pageWidth, pageHeight, margin, knipbladHoogte, titleHeight);
        const finalCellSize = finalLayouts.length > 0 ? (finalLayouts[0].size / size) : 0;

        doc.setFontSize(18);
        doc.text("Sudoku Werkblad", pageWidth / 2, margin + 5, { align: 'center' });

        finalLayouts.forEach((layout, i) => {
            const imageOffset = useDifferentImages ? i * size : 0;
            drawPuzzle(puzzles[i], type, imageOffset);
            doc.addImage(canvas.toDataURL('image/png'), 'PNG', layout.x, layout.y, layout.size, layout.size);
        });

        if (type === 'afbeeldingen' && allMissingData.length > 0) {
            const imgBoxSize = finalCellSize;
            const imgBoxSpacing = 2;
            const imgPadding = 1;
            const imagesPerRow = Math.floor((pageWidth - 2 * margin) / (imgBoxSize + imgBoxSpacing));
            
            // --- AANGEPASTE LOGICA VOOR CENTREREN ---
            const blockWidth = imagesPerRow * imgBoxSize + Math.max(0, imagesPerRow - 1) * imgBoxSpacing;
            const startX = (pageWidth - blockWidth) / 2;
            const startY = pageHeight - knipbladHoogte + margin / 2;

            for(let i = 0; i < allMissingData.length; i++){
                const { number, offset } = allMissingData[i];
                const imgData = userImages[number - 1 + offset].src;
                const col = i % imagesPerRow;
                const row = Math.floor(i / imagesPerRow);
                const boxX = startX + col * (imgBoxSize + imgBoxSpacing);
                const boxY = startY + row * (imgBoxSize + imgBoxSpacing);

                doc.setLineDashPattern([2, 1.5], 0);
                doc.rect(boxX, boxY, imgBoxSize, imgBoxSize);
                doc.setLineDashPattern([], 0);
                doc.addImage(imgData, 'PNG', boxX + imgPadding, boxY + imgPadding, imgBoxSize - 2 * imgPadding, imgBoxSize - 2 * imgPadding);
            }
        }
        
        doc.save(`sudoku-werkblad-${aantal}.pdf`);
        drawPuzzle(currentPuzzle, type, 0);
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
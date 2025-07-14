document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("mainCanvas");
    const ctx = canvas.getContext("2d");
    const generateBtn = document.getElementById("genereerBtn");
    const downloadPngBtn = document.getElementById("downloadPngBtn");
    const downloadPdfBtn = document.getElementById("downloadPdfBtn");
    const woordenInput = document.getElementById("woordenInput");
    const meldingContainer = document.getElementById("meldingContainer");

    const INTERNAL_GRID_SIZE = 40; // Groter intern raster voor meer flexibiliteit
    let grid = [];
    let placedWordsInfo = [];

    function cleanGrid() {
        grid = Array(INTERNAL_GRID_SIZE).fill(null).map(() => Array(INTERNAL_GRID_SIZE).fill(null));
        placedWordsInfo = [];
    }

    function drawGrid(puzzleData) {
        const { puzzleGrid } = puzzleData;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!puzzleGrid || puzzleGrid.length === 0) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const gridSize = puzzleGrid.length;
        const cellSize = canvas.width / gridSize;
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const cell = puzzleGrid[r][c];
                if (cell) {
                    ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
                    if (cell.number) {
                        ctx.fillStyle = "#004080";
                        ctx.font = `bold ${cellSize * 0.3}px Arial`;
                        ctx.textAlign = "left";
                        ctx.textBaseline = "top";
                        ctx.fillText(cell.number, c * cellSize + 3, r * cellSize + 2);
                    }
                }
            }
        }
    }

    function canPlaceWord(word, r, c, direction) {
        let intersections = 0;
        if (direction === 'horizontal') {
            if (c < 0 || r < 0 || c + word.length > INTERNAL_GRID_SIZE || r >= INTERNAL_GRID_SIZE) return false;
            if (c > 0 && grid[r][c - 1] !== null) return false;
            if (c + word.length < INTERNAL_GRID_SIZE && grid[r][c + word.length] !== null) return false;
            for (let i = 0; i < word.length; i++) {
                const curR = r;
                const curC = c + i;
                if (grid[curR][curC] !== null && grid[curR][curC] !== word[i]) return false;
                if (grid[curR][curC] !== null && grid[curR][curC] === word[i]) {
                    intersections++;
                } else {
                    if (curR > 0 && grid[curR - 1][curC] !== null) return false;
                    if (curR < INTERNAL_GRID_SIZE - 1 && grid[curR + 1][curC] !== null) return false;
                }
            }
        } else { // Vertical
            if (r < 0 || c < 0 || r + word.length > INTERNAL_GRID_SIZE || c >= INTERNAL_GRID_SIZE) return false;
            if (r > 0 && grid[r - 1][c] !== null) return false;
            if (r + word.length < INTERNAL_GRID_SIZE && grid[r + word.length][c] !== null) return false;
            for (let i = 0; i < word.length; i++) {
                const curR = r + i;
                const curC = c;
                if (grid[curR][curC] !== null && grid[curR][curC] !== word[i]) return false;
                if (grid[curR][curC] !== null && grid[curR][curC] === word[i]) {
                    intersections++;
                } else {
                    if (curC > 0 && grid[curR][curC - 1] !== null) return false;
                    if (curC < INTERNAL_GRID_SIZE - 1 && grid[curR][curC + 1] !== null) return false;
                }
            }
        }
        return intersections > 0;
    }

    function placeSingleWord(wordObj, r, c, direction) {
        for (let i = 0; i < wordObj.word.length; i++) {
            if (direction === 'horizontal') {
                grid[r][c + i] = wordObj.word[i];
            } else {
                grid[r + i][c] = wordObj.word[i];
            }
        }
        placedWordsInfo.push({ ...wordObj, row: r, col: c, direction });
    }

    function placeWords(words) {
        const firstWord = words.shift();
        if (!firstWord) return;
        const startRow = Math.floor(INTERNAL_GRID_SIZE / 2);
        const startCol = Math.floor((INTERNAL_GRID_SIZE - firstWord.word.length) / 2);
        placeSingleWord(firstWord, startRow, startCol, 'horizontal');
        let unplacedWords = [...words];
        let placedThisRound = true;
        while (unplacedWords.length > 0 && placedThisRound) {
            placedThisRound = false;
            const wordsToTry = [...unplacedWords];
            unplacedWords = [];
            for (const wordObj of wordsToTry) {
                let bestPlacement = null;
                for (const pWord of placedWordsInfo) {
                    for (let i = 0; i < wordObj.word.length; i++) {
                        for (let j = 0; j < pWord.word.length; j++) {
                            if (wordObj.word[i] === pWord.word[j]) {
                                const direction = pWord.direction === 'horizontal' ? 'vertical' : 'horizontal';
                                let r, c;
                                if (direction === 'vertical') {
                                    r = pWord.row - i;
                                    c = pWord.col + j;
                                } else {
                                    r = pWord.row + j;
                                    c = pWord.col - i;
                                }
                                if (canPlaceWord(wordObj.word, r, c, direction)) {
                                    bestPlacement = { r, c, direction };
                                    break;
                                }
                            }
                        }
                        if (bestPlacement) break;
                    }
                    if (bestPlacement) break;
                }
                if (bestPlacement) {
                    placeSingleWord(wordObj, bestPlacement.r, bestPlacement.c, bestPlacement.direction);
                    placedThisRound = true;
                } else {
                    unplacedWords.push(wordObj);
                }
            }
        }
        if (unplacedWords.length > 0) {
            const unplacedList = unplacedWords.map(w => w.word).join(', ');
            meldingContainer.textContent = `De volgende woorden konden niet worden geplaatst: ${unplacedList}.`;
            meldingContainer.style.color = '#d9534f';
        }
    }
    
    function finalizeGrid() {
        if (placedWordsInfo.length === 0) return { puzzleGrid: [], wordData: [] };
        let minR = INTERNAL_GRID_SIZE, minC = INTERNAL_GRID_SIZE, maxR = 0, maxC = 0;
        placedWordsInfo.forEach(w => {
            minR = Math.min(minR, w.row);
            maxR = Math.max(maxR, w.direction === 'horizontal' ? w.row : w.row + w.word.length - 1);
            minC = Math.min(minC, w.col);
            maxC = Math.max(maxC, w.direction === 'horizontal' ? w.col + w.word.length - 1 : w.col);
        });
        const height = maxR - minR + 1;
        const width = maxC - minC + 1;
        const puzzleGridSize = Math.max(height, width) + 2;
        let puzzleGrid = Array(puzzleGridSize).fill(null).map(() => Array(puzzleGridSize).fill(null));
        let number = 1;
        placedWordsInfo.sort((a,b) => (a.row * INTERNAL_GRID_SIZE + a.col) - (b.row * INTERNAL_GRID_SIZE + b.col));
        const numberedPositions = {};
        const wordData = [];
        for (const word of placedWordsInfo) {
            const r = word.row - minR + 1;
            const c = word.col - minC + 1;
            const posKey = `${r},${c}`;
            let currentNumber = numberedPositions[posKey];
            if (!currentNumber) {
                currentNumber = number;
                numberedPositions[posKey] = number;
                number++;
            }
            wordData.push({...word, number: currentNumber });
            for (let i = 0; i < word.word.length; i++) {
                const curR = word.direction === 'vertical' ? r + i : r;
                const curC = word.direction === 'horizontal' ? c + i : c;
                if (!puzzleGrid[curR][curC]) {
                     puzzleGrid[curR][curC] = {};
                }
                puzzleGrid[curR][curC].letter = word.word[i];
            }
            puzzleGrid[r][c].number = currentNumber;
        }
        return { puzzleGrid, wordData };
    }

    function displayClues(wordData) {
        const hList = document.getElementById("horizontal-clues-list");
        const vList = document.getElementById("vertical-clues-list");
        hList.innerHTML = "";
        vList.innerHTML = "";
        wordData.sort((a, b) => a.number - b.number);
        const handled = new Set();
        wordData.forEach(word => {
            const key = `${word.number}-${word.direction}`;
            if(handled.has(key)) return;
            const listItem = document.createElement('li');
            listItem.textContent = `${word.number}. ${word.clue}`;
            if (word.direction === 'horizontal') {
                hList.appendChild(listItem);
            } else {
                vList.appendChild(listItem);
            }
            handled.add(key);
        });
    }

    function generateCrossword() {
        cleanGrid();
        meldingContainer.textContent = "";
        const rawInput = woordenInput.value.trim().split('\n');
        const words = rawInput
            .map(line => {
                const parts = line.split(';');
                const word = parts[0].trim().toUpperCase().replace(/[^A-Z]/g, '');
                const clue = (parts[1] || '').trim();
                return { word, clue: clue || word };
            })
            .filter(item => item.word.length > 1)
            .sort((a, b) => b.word.length - a.word.length);
        if (words.length < 1 && rawInput.join("").trim() !== "") {
            meldingContainer.textContent = "Voer geldige woorden in (minstens 2 letters).";
            drawGrid({});
            displayClues([]);
            return;
        }
        placeWords(words);
        const puzzleData = finalizeGrid();
        drawGrid(puzzleData);
        displayClues(puzzleData.wordData);
    }
    
    // --- Functies voor PDF export ---

    function wrapTextAndCalcHeight(context, text, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let lineCount = 0;
        if (words.length > 0) {
            lineCount = 1;
        }
        for (const word of words) {
            const testLine = line ? line + ' ' + word : word;
            if (context.measureText(testLine).width > maxWidth && line) {
                lineCount++;
                line = word;
            } else {
                line = testLine;
            }
        }
        return lineCount * lineHeight;
    }

    function drawWrappedText(context, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        for (const word of words) {
            const testLine = line ? line + ' ' + word : word;
            if (context.measureText(testLine).width > maxWidth && line) {
                context.fillText(line, x, currentY);
                currentY += lineHeight;
                line = word;
            } else {
                line = testLine;
            }
        }
        context.fillText(line, x, currentY);
        return currentY - y + lineHeight;
    }

    function downloadAs(type) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        const { puzzleGrid, wordData } = finalizeGrid();
        if (!puzzleGrid || puzzleGrid.length === 0) {
            alert("Genereer eerst een puzzel voordat je deze downloadt.");
            return;
        }
        const uniqueClues = new Map();
        wordData.forEach(w => {
            const key = `${w.number}-${w.direction}`;
            if (!uniqueClues.has(key)) { uniqueClues.set(key, w); }
        });
        const sortedClues = Array.from(uniqueClues.values()).sort((a, b) => a.number - b.number);
        const hClues = sortedClues.filter(w => w.direction === 'horizontal');
        const vClues = sortedClues.filter(w => w.direction === 'vertical');

        const puzzleSize = 800;
        const padding = 50;
        const titleFontSize = 40;
        const clueTitleFontSize = 30;
        const clueFontSize = 24;
        const lineHeight = 30;
        const clueGap = 15;
        const columnWidth = (puzzleSize / 2) - (padding / 2);

        tempCtx.font = `${clueFontSize}px Arial`;
        let hCluesHeight = 0;
        hClues.forEach(clue => { hCluesHeight += wrapTextAndCalcHeight(tempCtx, `${clue.number}. ${clue.clue}`, columnWidth, lineHeight) + clueGap; });
        let vCluesHeight = 0;
        vClues.forEach(clue => { vCluesHeight += wrapTextAndCalcHeight(tempCtx, `${clue.number}. ${clue.clue}`, columnWidth, lineHeight) + clueGap; });

        const totalClueHeight = Math.max(hCluesHeight, vCluesHeight) + clueTitleFontSize + padding;
        const totalHeight = puzzleSize + titleFontSize + padding * 2 + totalClueHeight;
        
        tempCanvas.width = puzzleSize + padding * 2;
        tempCanvas.height = totalHeight;
        tempCtx.fillStyle = "#FFF";
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        tempCtx.fillStyle = "#004080";
        tempCtx.font = `bold ${titleFontSize}px Arial`;
        tempCtx.textAlign = "center";
        tempCtx.fillText("Kruiswoordpuzzel", tempCanvas.width / 2, padding);
        
        const gridSize = puzzleGrid.length;
        const cellSize = puzzleSize / gridSize;
        const gridX = padding;
        const gridY = padding + titleFontSize + 20;
        tempCtx.lineWidth = 2;
        tempCtx.strokeStyle = "#000";
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (puzzleGrid[r][c]) {
                    tempCtx.strokeRect(gridX + c * cellSize, gridY + r * cellSize, cellSize, cellSize);
                    if (puzzleGrid[r][c].number) {
                        tempCtx.fillStyle = "#004080";
                        tempCtx.font = `bold ${cellSize * 0.3}px Arial`;
                        tempCtx.textAlign = "left";
                        tempCtx.textBaseline = "top";
                        tempCtx.fillText(puzzleGrid[r][c].number, gridX + c * cellSize + 4, gridY + r * cellSize + 4);
                    }
                }
            }
        }
        
        let clueY = gridY + puzzleSize + 40;
        const hClueX = padding;
        const vClueX = tempCanvas.width / 2 + padding / 2;
        tempCtx.fillStyle = "#004080";
        tempCtx.font = `bold ${clueTitleFontSize}px Arial`;
        tempCtx.textAlign = "left";
        tempCtx.textBaseline = "top";
        tempCtx.fillText("Horizontaal", hClueX, clueY);
        tempCtx.fillText("Verticaal", vClueX, clueY);
        
        clueY += clueTitleFontSize + 10;
        tempCtx.fillStyle = "#000";
        tempCtx.font = `${clueFontSize}px Arial`;
        
        let currentHClueY = clueY;
        hClues.forEach(word => {
            const clueText = `${word.number}. ${word.clue}`;
            const textBlockHeight = drawWrappedText(tempCtx, clueText, hClueX, currentHClueY, columnWidth, lineHeight);
            currentHClueY += textBlockHeight + clueGap;
        });

        let currentVClueY = clueY;
        vClues.forEach(word => {
            const clueText = `${word.number}. ${word.clue}`;
            const textBlockHeight = drawWrappedText(tempCtx, clueText, vClueX, currentVClueY, columnWidth, lineHeight);
            currentVClueY += textBlockHeight + clueGap;
        });

        if (type === 'png') {
            const dataURL = tempCanvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = dataURL;
            a.download = "kruiswoordpuzzel.png";
            a.click();
        } else if (type === 'pdf') {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'px', format: [tempCanvas.width, tempCanvas.height] });
            doc.addImage(tempCanvas.toDataURL("image/png"), 'PNG', 0, 0, tempCanvas.width, tempCanvas.height);
            doc.save("kruiswoordpuzzel.pdf");
        }
    }

    // Event listeners
    generateBtn.addEventListener("click", generateCrossword);
    woordenInput.addEventListener("input", () => {
        const lineCount = woordenInput.value.split('\n').filter(line => line.trim() !== '').length;
        document.getElementById("woordAantalMelding").textContent = `Aantal woorden: ${lineCount}`;
    });
    downloadPngBtn.addEventListener("click", () => downloadAs('png'));
    downloadPdfBtn.addEventListener("click", () => downloadAs('pdf'));

    // Genereer een lege puzzel bij het laden van de pagina
    generateCrossword();
});
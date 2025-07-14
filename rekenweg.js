// Globale variabelen
const CELL_SIZE = 40; // Grootte van een cel in pixels
const GRID_COLS = 20; // Aantal kolommen
const GRID_ROWS = 15; // Aantal rijen

let canvas; // Canvas element
let ctx; // 2D rendering context
let isDrawing = false; // Vlag om te controleren of de muis ingedrukt is tijdens tekenen
let currentDrawnPath = []; // Array om getekende cellen bij te houden [{row, col, branchLetter}, ...]
let lastDrawnCell = null; // Voor het optimaliseren van tekenen (geen dubbele cellen bij slepen)
let currentViewMode = 'drawing'; // 'drawing', 'template-canvas'
let currentTemplateGrid = null; // Opslag voor het gevulde grid (met lege vakjes)
let currentTemplateData = []; // Opslag voor de tekstuele lijst van slots per tak (nog steeds gevuld, maar niet getoond)

// Regels voor het automatisch wisselen van takletters
const branchRules = {
    'A': { count: 5, next: 'B' }, 'B': { count: 4, next: 'C' }, 'C': { count: 4, next: 'D' },
    'D': { count: 4, next: 'E' }, 'E': { count: 4, next: 'F' }, 'F': { count: 4, next: 'G' },
    'G': { count: 4, next: 'H' }, 'H': { count: 4, next: 'I' }, 'I': { count: 4, next: 'J' },
    'J': { count: 4, next: 'K' }, 'K': { count: 4, next: 'L' }, 'L': { count: 4, next: 'M' },
    'M': { count: 4, next: 'N' }, 'N': { count: 4, next: 'O' }, 'O': { count: 4, next: 'P' },
    'P': { count: 4, next: 'Q' }, 'Q': { count: 4, next: 'R' }, 'R': { count: 4, next: 'S' },
    'S': { count: 4, next: 'T' }, 'T': { count: 4, next: 'U' }, 'U': { count: 4, next: 'V' },
    'V': { count: 4, next: 'W' }, 'W': { count: 4, next: 'X' }, 'X': { count: 4, next: 'Y' },
    'Y': { count: 4, next: 'Z' }, 'Z': { count: 4, next: null }
};

const branchLettersOrder = Object.keys(branchRules);
let activeBranchIndex = 0;
let activeBranchLetter = branchLettersOrder[activeBranchIndex];
let editedCell = null;

// --- HELPER FUNCTIES ---
function getBranchColor(letter) {
    const colors = { 'A': '#FF6347', 'B': '#4682B4', 'C': '#32CD32', 'D': '#FFD700', 'E': '#9370DB', 'F': '#FFA500', 'G': '#FF69B4', 'H': '#8A2BE2', 'I': '#00CED1', 'J': '#A0522D', 'K': '#48D1CC', 'L': '#7FFF00', 'M': '#DA70D6', 'N': '#FF4500', 'O': '#20B2AA', 'P': '#B22222', 'Q': '#DDA0DD', 'R': '#4169E1', 'S': '#BDB76B', 'T': '#008080', 'U': '#CD5C5C', 'V': '#F08080', 'W': '#40E0D0', 'X': '#9ACD32', 'Y': '#8B008B', 'Z': '#8FBC8F' };
    return colors[letter] || '#808080';
}

function orderBranchCells(cellsInBranch) {
    if (cellsInBranch.length === 0) return [];
    if (cellsInBranch.length === 1) return [cellsInBranch[0]];
    const cellSet = new Set(cellsInBranch.map(c => `${c.row},${c.col}`));
    const coordToCellMap = new Map(cellsInBranch.map(c => [`${c.row},${c.col}`, c]));
    let potentialStartPoints = [];
    for (const cell of cellsInBranch) {
        let neighborCount = 0;
        const neighbors = [
            {r: cell.row - 1, c: cell.col}, {r: cell.row + 1, c: cell.col},
            {r: cell.row, c: cell.col - 1}, {r: cell.row, c: cell.col + 1}
        ];
        for (const neighbor of neighbors) {
            if (cellSet.has(`${neighbor.r},${neighbor.c}`)) {
                neighborCount++;
            }
        }
        if (neighborCount <= 1) { 
            potentialStartPoints.push(cell);
        }
    }
    if (potentialStartPoints.length === 0 && cellsInBranch.length > 1) {
        potentialStartPoints.push(cellsInBranch.sort((a,b) => a.row - b.row || a.col - b.col)[0]);
    } else if (potentialStartPoints.length > 2) {
        return null; 
    }
    let orderedBranch = [];
    let visited = new Set();
    let current = potentialStartPoints[0]; 
    while (current && !visited.has(`${current.row},${current.col}`)) {
        orderedBranch.push(current);
        visited.add(`${current.row},${current.col}`);
        let next = null;
        const neighbors = [
            {r: current.row - 1, c: current.col}, {r: current.row + 1, c: current.col},
            {r: current.row, c: current.col - 1}, {r: current.row, c: current.col + 1}
        ];
        for (const neighbor of neighbors) {
            if (cellSet.has(`${neighbor.r},${neighbor.c}`)) {
                if (!visited.has(`${neighbor.r},${neighbor.c}`)) {
                    next = coordToCellMap.get(`${neighbor.r},${neighbor.c}`);
                    break;
                }
            }
        }
        current = next;
    }
    if (orderedBranch.length !== cellsInBranch.length) {
        return null;
    }
    return orderedBranch;
}

function createPathTemplateGrid(pathsByBranch) {
    let templateGrid = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(null));
    currentTemplateData = [];
    const branchLetters = Object.keys(pathsByBranch).sort((a, b) => branchLettersOrder.indexOf(a) - branchLettersOrder.indexOf(b));
    let slotCounter = 0;
    for (const branchLetter of branchLetters) {
        const branchPath = pathsByBranch[branchLetter];
        if (branchPath.length < 1) { continue; }
        currentTemplateData.push({ type: 'header', branchLetter: branchLetter, count: branchPath.length });
        for (let i = 0; i < branchPath.length; i++) {
            const cellCoord = branchPath[i];
            if (templateGrid[cellCoord.row][cellCoord.col] !== null) { continue; }
            slotCounter++;
            templateGrid[cellCoord.row][cellCoord.col] = { type: 'empty_slot', value: '', row: cellCoord.row, col: cellCoord.col, branchLetter: branchLetter, slotNumber: slotCounter };
            currentTemplateData.push(templateGrid[cellCoord.row][cellCoord.col]);
        }
    }
    if (slotCounter === 0) { return null; }
    return templateGrid;
}

// --- CANVAS TEKEN FUNCTIES ---
function drawGrid() { ctx.strokeStyle = "#DDD"; ctx.lineWidth = 1; for (let i = 0; i <= GRID_COLS; i++) { ctx.beginPath(); ctx.moveTo(i * CELL_SIZE, 0); ctx.lineTo(i * CELL_SIZE, canvas.height); ctx.stroke(); } for (let i = 0; i <= GRID_ROWS; i++) { ctx.beginPath(); ctx.moveTo(0, i * CELL_SIZE); ctx.lineTo(canvas.width, i * CELL_SIZE); ctx.stroke(); } }
function drawDrawnPath() { ctx.clearRect(0, 0, canvas.width, canvas.height); drawGrid(); currentDrawnPath.forEach(cell => { const color = getBranchColor(cell.branchLetter); ctx.fillStyle = color; ctx.fillRect(cell.col * CELL_SIZE, cell.row * CELL_SIZE, CELL_SIZE, CELL_SIZE); ctx.strokeStyle = "#000000"; ctx.lineWidth = 1; ctx.strokeRect(cell.col * CELL_SIZE, cell.row * CELL_SIZE, CELL_SIZE, CELL_SIZE); ctx.fillStyle = "#FFFFFF"; ctx.font = `bold ${CELL_SIZE * 0.6}px Arial`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(cell.branchLetter, cell.col * CELL_SIZE + CELL_SIZE / 2, cell.row * CELL_SIZE + CELL_SIZE / 2); }); }
function drawPathTemplateOnCanvas(templateGrid) { if (!ctx || !templateGrid) return; ctx.clearRect(0, 0, canvas.width, canvas.height); for (let r = 0; r < GRID_ROWS; r++) { for (let c = 0; c < GRID_COLS; c++) { const cell = templateGrid[r][c]; if (cell !== null) { const drawX = cell.col * CELL_SIZE; const drawY = cell.row * CELL_SIZE; ctx.fillStyle = "#FFFFFF"; ctx.fillRect(drawX, drawY, CELL_SIZE, CELL_SIZE); ctx.strokeStyle = "#000"; ctx.lineWidth = 1; ctx.strokeRect(drawX, drawY, CELL_SIZE, CELL_SIZE); if (cell.value) { ctx.fillStyle = "#000"; ctx.font = `bold ${CELL_SIZE * 0.5}px Arial`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(cell.value, drawX + CELL_SIZE / 2, drawY + CELL_SIZE / 2); } } } } }
function saveCellValue(cellData, value) { if (cellData) { if (currentTemplateGrid[cellData.row][cellData.col]) { currentTemplateGrid[cellData.row][cellData.col].value = value; } const dataItem = currentTemplateData.find(item => item.type === 'empty_slot' && item.row === cellData.row && item.col === cellData.col); if (dataItem) { dataItem.value = value; } drawPathTemplateOnCanvas(currentTemplateGrid); } }
function removeCurrentInput() { if (editedCell && editedCell.inputElement) { document.body.removeChild(editedCell.inputElement); editedCell = null; } }
function createInputForCell(cellData) { removeCurrentInput(); const input = document.createElement('input'); input.type = 'text'; input.value = cellData.value || ''; const canvasRect = canvas.getBoundingClientRect(); input.style.position = 'absolute'; input.style.left = (canvasRect.left + cellData.col * CELL_SIZE) + 'px'; input.style.top = (canvasRect.top + cellData.row * CELL_SIZE) + 'px'; input.style.width = CELL_SIZE + 'px'; input.style.height = CELL_SIZE + 'px'; input.style.border = '1px solid blue'; input.style.textAlign = 'center'; input.style.font = `bold ${CELL_SIZE * 0.5}px Arial`; input.style.boxSizing = 'border-box'; input.style.padding = '2px'; input.style.margin = '0'; document.body.appendChild(input); input.focus(); editedCell = { cellData: cellData, inputElement: input }; input.addEventListener('blur', () => { saveCellValue(cellData, input.value); removeCurrentInput(); }); input.addEventListener('keypress', (e) => { if (e.key === 'Enter') { saveCellValue(cellData, input.value); removeCurrentInput(); } }); }


// --- MAIN FLOW FUNCTIES ---

function startDrawingMode() {
    // Verwijder de centrering-klasse
    document.body.classList.remove('template-view-active');

    currentViewMode = 'drawing';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawDrawnPath();
    removeCurrentInput();

    // UI elementen voor tekenmodus tonen
    document.getElementById("left-panel").style.display = 'flex';
    document.getElementById("showMyPathBtn").style.display = 'block';
    
    // UI elementen voor template-modus verbergen
    document.getElementById("drawNewPathBtn").style.display = 'none';
    document.getElementById("downloadPngBtn").style.display = 'none';
    document.getElementById("downloadPdfBtn").style.display = 'none';
    document.getElementById("edit-instructions").style.display = 'none';

    // Afbeeldingen wisselen
    document.getElementById('drawing-example-img').style.display = 'block';
    document.getElementById('template-example-img').style.display = 'none';
    
    // Reset tak-selectie
    activeBranchIndex = 0;
    activeBranchLetter = branchLettersOrder[activeBranchIndex];
    document.getElementById("branchLetter").value = activeBranchLetter;
}

function showMyPathTemplate() {
    const meldingContainer = document.getElementById("meldingContainer");
    meldingContainer.innerHTML = '';
    if (currentDrawnPath.length < 1) {
        meldingContainer.innerHTML = '<p style="color: red;">Teken minimaal één vakje voor de template.</p>';
        return;
    }

    const cellsByBranch = {};
    currentDrawnPath.forEach(cell => {
        if (!cellsByBranch[cell.branchLetter]) { cellsByBranch[cell.branchLetter] = []; }
        cellsByBranch[cell.branchLetter].push(cell);
    });

    const orderedPathsByBranch = {};
    let hasInvalidBranch = false;
    Object.keys(cellsByBranch).forEach(letter => {
        const orderedBranch = orderBranchCells(cellsByBranch[letter]);
        if (!orderedBranch) {
            hasInvalidBranch = true;
            meldingContainer.innerHTML += `<p style="color: red;">Tak '${letter}' is niet aaneengesloten. Probeer opnieuw.</p>`;
        }
        orderedPathsByBranch[letter] = orderedBranch;
    });

    if (hasInvalidBranch) { return; }

    const createdTemplateGrid = createPathTemplateGrid(orderedPathsByBranch);
    if (createdTemplateGrid) {
        // Voeg de centrering-klasse toe
        document.body.classList.add('template-view-active');

        currentTemplateGrid = createdTemplateGrid;
        currentViewMode = 'template-canvas';
        
        // UI elementen voor tekenmodus verbergen
        document.getElementById("left-panel").style.display = 'none';
        
        // UI elementen voor template-modus tonen
        document.getElementById("drawNewPathBtn").style.display = 'block';
        document.getElementById("downloadPngBtn").style.display = 'block';
        document.getElementById("downloadPdfBtn").style.display = 'block';
        document.getElementById("edit-instructions").style.display = 'block';

        // Afbeeldingen wisselen
        document.getElementById('drawing-example-img').style.display = 'none';
        document.getElementById('template-example-img').style.display = 'block';

        drawPathTemplateOnCanvas(currentTemplateGrid);
    } else {
        meldingContainer.innerHTML = '<p style="color: red;">Kon geen template aanmaken.</p>';
    }
}


// --- INITIALISATIE EN EVENT LISTENERS ---
document.addEventListener("DOMContentLoaded", () => {
    canvas = document.getElementById("mainCanvas");
    ctx = canvas.getContext("2d");
    canvas.width = GRID_COLS * CELL_SIZE;
    canvas.height = GRID_ROWS * CELL_SIZE;
    startDrawingMode();

    canvas.addEventListener('mousedown', (e) => { if (currentViewMode !== 'drawing') return; isDrawing = true; const rect = canvas.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top; const col = Math.floor(x / CELL_SIZE); const row = Math.floor(y / CELL_SIZE); addCellToPath(row, col, activeBranchLetter); });
    canvas.addEventListener('mousemove', (e) => { if (!isDrawing || currentViewMode !== 'drawing') return; const rect = canvas.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top; const col = Math.floor(x / CELL_SIZE); const row = Math.floor(y / CELL_SIZE); addCellToPath(row, col, activeBranchLetter); });
    canvas.addEventListener('mouseup', () => { isDrawing = false; lastDrawnCell = null; });
    canvas.addEventListener('mouseleave', () => { isDrawing = false; lastDrawnCell = null; });
    canvas.addEventListener('click', (e) => { if (currentViewMode === 'template-canvas') { const rect = canvas.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top; const col = Math.floor(x / CELL_SIZE); const row = Math.floor(y / CELL_SIZE); if (currentTemplateGrid && currentTemplateGrid[row] && currentTemplateGrid[row][col]) { const cellData = currentTemplateGrid[row][col]; createInputForCell(cellData); } else { removeCurrentInput(); } } });

    function addCellToPath(row, col, branchLetter) {
        if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return;
        const newCell = { row, col, branchLetter };
        const existingCellIndex = currentDrawnPath.findIndex(c => c.row === row && c.col === col);
        if (existingCellIndex > -1) { return; }
        if (currentDrawnPath.length > 0 && lastDrawnCell) { const prevCell = lastDrawnCell; const rowDiff = Math.abs(newCell.row - prevCell.row); const colDiff = Math.abs(newCell.col - prevCell.col); if (rowDiff > 1 || colDiff > 1 || (rowDiff > 0 && colDiff > 0)) { return; } }
        
        currentDrawnPath.push(newCell);
        drawDrawnPath();
        lastDrawnCell = newCell;
        
        const cellsInCurrentBranch = currentDrawnPath.filter(c => c.branchLetter === activeBranchLetter).length;
        const rule = branchRules[activeBranchLetter];
        if (rule && cellsInCurrentBranch >= rule.count) {
            if (rule.next) {
                activeBranchIndex = branchLettersOrder.indexOf(rule.next);
                activeBranchLetter = branchLettersOrder[activeBranchIndex];
                document.getElementById("branchLetter").value = activeBranchLetter;
            } else {
                isDrawing = false;
            }
        }
    }

    document.getElementById("clearPathBtn").addEventListener("click", () => {
        currentDrawnPath = [];
        currentTemplateGrid = null;
        currentTemplateData = [];
        startDrawingMode();
    });

    document.getElementById("undoLastCellBtn").addEventListener("click", () => {
        if (currentDrawnPath.length > 0) {
            const removedCell = currentDrawnPath.pop();
            drawDrawnPath();
            lastDrawnCell = currentDrawnPath.length > 0 ? currentDrawnPath[currentDrawnPath.length - 1] : null;
            const cellsInRemovedBranch = currentDrawnPath.filter(c => c.branchLetter === removedCell.branchLetter).length;
            const ruleForRemovedBranch = branchRules[removedCell.branchLetter];
            if (ruleForRemovedBranch && cellsInRemovedBranch < ruleForRemovedBranch.count) {
                activeBranchLetter = removedCell.branchLetter;
                activeBranchIndex = branchLettersOrder.indexOf(activeBranchLetter);
                document.getElementById("branchLetter").value = activeBranchLetter;
            }
            if (currentDrawnPath.length < 1) {
                startDrawingMode();
            }
        }
    });

    document.getElementById("showMyPathBtn").addEventListener("click", showMyPathTemplate);
    document.getElementById("drawNewPathBtn").addEventListener("click", startDrawingMode);

    document.getElementById("downloadPngBtn").addEventListener("click", () => { if (currentViewMode !== 'template-canvas' || !currentTemplateGrid) { alert("Er is geen template om te downloaden."); return; } removeCurrentInput(); drawPathTemplateOnCanvas(currentTemplateGrid); const dataURL = canvas.toDataURL("image/png"); const a = document.createElement("a"); a.href = dataURL; a.download = "rekenweg_template.png"; document.body.appendChild(a); a.click(); document.body.removeChild(a); });
    document.getElementById("downloadPdfBtn").addEventListener("click", async () => { if (currentViewMode !== 'template-canvas' || !currentTemplateGrid) { alert("Er is geen template om te downloaden."); return; } removeCurrentInput(); drawPathTemplateOnCanvas(currentTemplateGrid); const dataURL = canvas.toDataURL("image/png"); const { jsPDF } = window.jspdf; const doc = new jsPDF('p', 'mm', 'a4'); const pageWidth = doc.internal.pageSize.getWidth(); const pageHeight = doc.internal.pageSize.getHeight(); const imgWidth = canvas.width; const imgHeight = canvas.height; const ratio = imgWidth / imgHeight; let pdfImgWidth = pageWidth - 20; let pdfImgHeight = pdfImgWidth / ratio; if (pdfImgHeight > pageHeight - 40) { pdfImgHeight = pageHeight - 40; pdfImgWidth = pdfImgHeight * ratio; } const xPos = (pageWidth - pdfImgWidth) / 2; const yPos = (pageHeight - pdfImgHeight) / 2; doc.addImage(dataURL, 'PNG', xPos, yPos, pdfImgWidth, pdfImgHeight); doc.setFontSize(18); doc.text("Rekenweg Template", pageWidth / 2, 20, { align: 'center' }); doc.save("rekenweg_template.pdf"); });
});
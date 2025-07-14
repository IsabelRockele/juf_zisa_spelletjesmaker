// Globale variabelen
let canvas;
let ctx;
const CELL_SIZE = 40; // Grootte van een cel in pixels
const GRID_ROWS = 15; // Vast raster voor tekenen, 15x20 is 600x800px canvas
const GRID_COLS = 20; // Vast raster voor tekenen
let currentDrawnPath = []; // Array om getekende cellen bij te houden [{row, col, branchLetter}, ...]
let isDrawing = false; // Vlag om te controleren of de muis ingedrukt is tijdens tekenen
let lastDrawnCell = null; // Voor het optimaliseren van tekenen (geen dubbele cellen bij slepen)

let currentTemplateGrid = null; // Opslag voor het gevulde grid (met lege vakjes)
let currentTemplateData = []; // Opslag voor de tekstuele lijst van slots per tak
let currentViewMode = 'drawing'; // 'drawing', 'template-text', of 'template-canvas'

// --- HELPER FUNCTIES ---
window.getRandomInt = function(min, max) { // Nodig voor shuffle bij verbergen.
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Functie om cellen van één tak te ordenen in een logische, aaneengesloten volgorde.
 * Dit is belangrijk voor de tekstuele output en als visuele hint.
 * @param {Array<object>} cellsInBranch - Cellen van één specifieke tak ({row, col, branchLetter}).
 * @returns {Array<object>|null} Geordend pad of null als het pad ongeldig is (bijv. vertakkingen, gaten).
 */
function orderBranchCells(cellsInBranch) {
    if (cellsInBranch.length === 0) return [];
    if (cellsInBranch.length === 1) return [cellsInBranch[0]];

    const cellSet = new Set(cellsInBranch.map(c => `${c.row},${c.col}`));
    const coordToCellMap = new Map(cellsInBranch.map(c => [`${c.row},${c.col}`, c]));

    let potentialStartPoints = [];
    for (const cell of cellsInBranch) {
        let neighborCount = 0;
        const neighbors = [
            {r: cell.row - 1, c: cell.col}, {r: cell.row + 1, c: cell.col}, // Verticaal
            {r: cell.row, c: cell.col - 1}, {r: cell.row, c: cell.col + 1}  // Horizontaal
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


/**
 * Creëert een grid met lege slots op basis van het getekende pad.
 * @param {object} pathsByBranch - Object met geordende paden per takletter. { A: [{r,c,letter},...], B: [{r,c,letter},...] }
 * @returns {Array<Array<object>>|null} - Het gevulde grid met lege slots.
 */
function createPathTemplateGrid(pathsByBranch) {
    let templateGrid = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(null));
    let templateSlotsData = [];

    const branchLetters = Object.keys(pathsByBranch).sort();

    let slotCounter = 0;

    for (const branchLetter of branchLetters) {
        const branchPath = pathsByBranch[branchLetter];

        if (branchPath.length < 1) {
            console.warn(`Tak ${branchLetter} is te kort.`);
            continue;
        }
        
        templateSlotsData.push({ type: 'header', branchLetter: branchLetter, count: branchPath.length });

        for (let i = 0; i < branchPath.length; i++) {
            const cellCoord = branchPath[i];
            
            if (templateGrid[cellCoord.row][cellCoord.col] !== null) {
                console.warn(`Vakje (${cellCoord.row},${cellCoord.col}) behoort al tot een eerdere tak. Overslaan.`);
                continue;
            }

            slotCounter++;
            templateGrid[cellCoord.row][cellCoord.col] = {
                type: 'empty_slot',
                value: '___', // Visuele weergave
                row: cellCoord.row,
                col: cellCoord.col,
                branchLetter: branchLetter,
                slotNumber: slotCounter // Nummer voor de tekstuele lijst
            };
            templateSlotsData.push(templateGrid[cellCoord.row][cellCoord.col]);
        }
    }

    if (slotCounter === 0) {
        return null;
    }

    currentTemplateData = templateSlotsData;
    return templateGrid;
}


// --- CANVAS TEKEN FUNCTIES ---

function getBranchColor(letter) {
    const colors = {
        'A': '#FF6347', 'B': '#4682B4', 'C': '#32CD32', 'D': '#FFD700', 'E': '#9370DB', 'F': '#FFA500',
        'G': '#FF69B4', 'H': '#8A2BE2', 'I': '#00CED1', 'J': '#A0522D', 'K': '#48D1CC', 'L': '#7FFF00',
        'M': '#DA70D6', 'N': '#FF4500', 'O': '#20B2AA', 'P': '#B22222', 'Q': '#DDA0DD', 'R': '#4169E1',
        'S': '#BDB76B', 'T': '#008080', 'U': '#CD5C5C', 'V': '#F08080', 'W': '#40E0D0', 'X': '#9ACD32',
        'Y': '#8B008B', 'Z': '#8FBC8F'
    };
    return colors[letter] || '#808080';
}

// drawGrid tekent alleen het raster, en wist niet het canvas.
// Dit is de enige functie die de rasterlijnen tekent.
function drawGrid() {
    ctx.strokeStyle = "#DDD";
    ctx.lineWidth = 1;

    for (let i = 0; i <= GRID_COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i <= GRID_ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
    }
}

// drawDrawnPath tekent het pad dat de gebruiker tekent (met letters en kleuren)
// Dit omvat nu ook het tekenen van het raster voor de tekenmodus
function drawDrawnPath() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // WIS ALLES
    drawGrid(); // Teken het raster als achtergrond voor de TEKENMODUS
    
    currentDrawnPath.forEach(cell => {
        const color = getBranchColor(cell.branchLetter);
        ctx.fillStyle = color;
        ctx.fillRect(cell.col * CELL_SIZE, cell.row * CELL_SIZE, CELL_SIZE, CELL_SIZE);

        ctx.strokeStyle = "#000000"; // Zwarte rand om elke cel
        ctx.lineWidth = 1;
        ctx.strokeRect(cell.col * CELL_SIZE, cell.row * CELL_SIZE, CELL_SIZE, CELL_SIZE);

        ctx.fillStyle = "#FFFFFF"; // Witte tekst voor letter
        ctx.font = `bold ${CELL_SIZE * 0.6}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(cell.branchLetter, cell.col * CELL_SIZE + CELL_SIZE / 2, cell.row * CELL_SIZE + CELL_SIZE / 2);
    });
}

/**
 * Tekent het pad met lege slots op het canvas. Dit is de afdrukbare template weergave.
 * @param {Array<Array<object>>} templateGrid - Het grid met lege slots.
 */
function drawPathTemplateOnCanvas(templateGrid) {
    if (!ctx || !templateGrid) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height); // WIS ALLES - Dit is de belangrijkste stap om eerdere tekeningen te verwijderen
    // BELANGRIJK: GEEN AANROEP NAAR drawGrid() HIER! Alleen de vakjes zelf worden getekend.

    ctx.strokeStyle = "#000"; // Standaard zwarte rand voor vakjes
    ctx.lineWidth = 1; // Dunne rand voor vakjes
    ctx.font = `25px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            const cell = templateGrid[r][c];

            if (cell !== null) {
                const drawX = cell.col * CELL_SIZE;
                const drawY = cell.row * CELL_SIZE;

                ctx.fillStyle = "#FFFFFF"; // ACHTERGROND VAKJE IS WIT
                ctx.fillRect(drawX, drawY, CELL_SIZE, CELL_SIZE);

                // Rand om het vakje (zwart, dun)
                ctx.strokeStyle = "#000";
                ctx.lineWidth = 1;
                ctx.strokeRect(drawX, drawY, CELL_SIZE, CELL_SIZE);
                
                // DEZE REGEL IS VERWIJDERD OM DE "___" TEKST TE VERWIJDEREN VAN DE CANVAS TEMPLATE
                // ctx.fillStyle = "#000"; // Zwarte tekst
                // ctx.fillText("___", drawX + CELL_SIZE / 2, drawY + CELL_SIZE / 2); 
                // Als je hier iets anders wilt tonen dan '___' (bijv. een ander symbool of niets), pas het hier aan.
            }
        }
    }
}

/**
 * Render de tekstuele output van de getekende slots.
 * @param {Array<object>} templateSlotsData - De lijst van getekende slots per tak.
 */
function renderTextualOutput(templateSlotsData) {
    const textualOutputDiv = document.getElementById("textualOutput");
    textualOutputDiv.innerHTML = '';

    if (templateSlotsData.length === 0) {
        textualOutputDiv.innerHTML = '<p>Geen slots getekend. Teken eerst een pad.</p>';
        return;
    }

    let currentBranchHeader = null;
    templateSlotsData.forEach(item => {
        if (item.type === 'header') {
            if (currentBranchHeader) {
                textualOutputDiv.appendChild(document.createElement('hr'));
            }
            const branchHeader = document.createElement('h3');
            branchHeader.textContent = `Tak ${item.branchLetter} (aantal vakjes: ${item.count})`;
            branchHeader.style.color = getBranchColor(item.branchLetter);
            textualOutputDiv.appendChild(branchHeader);
            currentBranchHeader = branchHeader;
        } else {
            const lineDiv = document.createElement('div');
            lineDiv.classList.add('exercise-line');
            // Hier blijft de hidden-number class voor de onderstreping in de TEKSTUELE uitvoer.
            lineDiv.innerHTML = `<span>Vakje ${item.slotNumber}</span>: <span class="hidden-number">${item.value}</span>`;
            textualOutputDiv.appendChild(lineDiv);
        }
    });
    if (currentBranchHeader) {
        textualOutputDiv.appendChild(document.createElement('hr'));
    }
}


// --- MAIN FLOW FUNCTIES ---

// Initialiseert de tekenmodus
function startDrawingMode() {
    currentViewMode = 'drawing';
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Eerst canvas volledig wissen
    drawGrid(); // Daarna het raster tekenen voor de tekenmodus
    drawDrawnPath(); // En dan het getekende pad eroverheen

    document.getElementById("drawingCanvasContainer").style.display = 'block';
    document.getElementById("textualOutput").style.display = 'none';
    document.getElementById("toggleViewBtn").style.display = 'none';
    document.getElementById("newPathBtn").style.display = 'none';
    document.getElementById("downloadPngBtn").style.display = 'none';
    document.getElementById("downloadPdfBtn").style.display = 'none';
    document.getElementById("savePathBtn").style.display = 'block';
    document.getElementById("clearPathBtn").style.display = 'block';
    document.getElementById("undoLastCellBtn").style.display = 'block';
    document.getElementById("branchLetter").style.display = 'block';
    document.querySelector('label[for="branchLetter"]').style.display = 'block';
    document.getElementById("left-panel").style.display = 'flex';
    document.getElementById("meldingContainer").innerHTML = '<p>Teken een pad door over de vakjes te slepen. Kies een letter voor de tak.</p>';
}

/**
 * Verwerkt het opslaan van het getekende pad en creëert de template.
 */
function savePathAndCreateTemplate() {
    const meldingContainer = document.getElementById("meldingContainer");
    meldingContainer.innerHTML = '';

    if (currentDrawnPath.length < 1) {
        meldingContainer.innerHTML = '<p style="color: red;">Teken minimaal één vakje voor de template.</p>';
        return;
    }

    const cellsByBranch = {};
    currentDrawnPath.forEach(cell => {
        if (!cellsByBranch[cell.branchLetter]) {
            cellsByBranch[cell.branchLetter] = [];
        }
        cellsByBranch[cell.branchLetter].push(cell);
    });

    const orderedPathsByBranch = {};
    let hasInvalidBranch = false;
    Object.keys(cellsByBranch).forEach(letter => {
        const orderedBranch = orderBranchCells(cellsByBranch[letter]);
        if (!orderedBranch) {
            hasInvalidBranch = true;
            meldingContainer.innerHTML += `<p style="color: red;">Tak '${letter}' is niet aaneengesloten of bevat vertakkingen BINNEN DE TAK. Wis het pad en probeer een enkelvoudige tak te tekenen.</p>`;
        }
        orderedPathsByBranch[letter] = orderedBranch;
    });

    if (hasInvalidBranch) {
        currentTemplateGrid = null;
        currentTemplateData = [];
        startDrawingMode();
        return;
    }

    meldingContainer.innerHTML = '<p style="color: #004080; text-align: center;">Template wordt aangemaakt...</p>';
    
    const createdTemplateGrid = createPathTemplateGrid(orderedPathsByBranch);
    currentTemplateGrid = createdTemplateGrid;

    if (currentTemplateGrid && currentTemplateData.length > 0) {
        console.log("Template succesvol aangemaakt. Totaal:", currentTemplateData.filter(item => item.type !== 'header').length, "slots.");
        meldingContainer.innerHTML = '';
        renderTextualOutput(currentTemplateData);
        
        currentViewMode = 'template-text';
        document.getElementById("drawingCanvasContainer").style.display = 'none';
        document.getElementById("textualOutput").style.display = 'block';
        document.getElementById("toggleViewBtn").style.display = 'block';
        document.getElementById("newPathBtn").style.display = 'block';
        document.getElementById("downloadPngBtn").style.display = 'block';
        document.getElementById("downloadPdfBtn").style.display = 'block';
        document.getElementById("savePathBtn").style.display = 'none';
        document.getElementById("clearPathBtn").style.display = 'none';
        document.getElementById("undoLastCellBtn").style.display = 'none';
        document.getElementById("branchLetter").style.display = 'none';
        document.querySelector('label[for="branchLetter"]').style.display = 'none';
        document.getElementById("left-panel").style.display = 'none';
        document.getElementById("toggleViewBtn").textContent = "Toon pad";
    } else {
        console.warn("Kon geen template aanmaken op het getekende pad.");
        meldingContainer.innerHTML = '<p style="color: red; text-align: center;">Kon geen template aanmaken op het getekende pad.<br>Zorg voor minimaal één vakje.</p>';
        currentTemplateGrid = null;
        currentTemplateData = [];
        startDrawingMode();
    }
}

// Schakelt tussen de tekstuele lijst en de canvasweergave
function toggleView() {
    if (currentViewMode === 'drawing') return;

    const textualOutputDiv = document.getElementById("textualOutput");
    const canvasContainer = document.getElementById("drawingCanvasContainer");
    const toggleViewBtn = document.getElementById("toggleViewBtn");

    if (currentViewMode === 'template-text') {
        currentViewMode = 'template-canvas';
        textualOutputDiv.style.display = 'none';
        canvasContainer.style.display = 'block';
        toggleViewBtn.textContent = "Toon tabel";

        if (currentTemplateGrid) {
            drawPathTemplateOnCanvas(currentTemplateGrid);
        } else {
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "red";
                ctx.font = `24px Arial`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("Geen template om weer te geven.", canvas.width / 2, canvas.height / 2);
            }
        }
    } else { // currentViewMode === 'template-canvas'
        currentViewMode = 'template-text';
        textualOutputDiv.style.display = 'block';
        canvasContainer.style.display = 'none';
        toggleViewBtn.textContent = "Toon pad";
        
        if (textualOutputDiv.innerHTML === '' && currentTemplateData.length > 0) {
            renderTextualOutput(currentTemplateData);
        }
    }
}

// --- INITIALISATIE EN EVENT LISTENERS ---
document.addEventListener("DOMContentLoaded", () => {
    canvas = document.getElementById("mainCanvas");
    ctx = canvas.getContext("2d");

    canvas.width = GRID_COLS * CELL_SIZE; // 20 * 40 = 800
    canvas.height = GRID_ROWS * CELL_SIZE; // 15 * 40 = 600

    startDrawingMode();

    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const col = Math.floor(x / CELL_SIZE);
        const row = Math.floor(y / CELL_SIZE);
        const selectedBranchLetter = document.getElementById("branchLetter").value;
        addCellToPath(row, col, selectedBranchLetter);
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const col = Math.floor(x / CELL_SIZE); 
        const row = Math.floor(y / CELL_SIZE); 
        const selectedBranchLetter = document.getElementById("branchLetter").value;
        addCellToPath(row, col, selectedBranchLetter);
    });

    canvas.addEventListener('mouseup', () => {
        isDrawing = false;
        lastDrawnCell = null;
    });

    canvas.addEventListener('mouseleave', () => {
        isDrawing = false;
        lastDrawnCell = null;
    });

    function addCellToPath(row, col, branchLetter) {
        if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return;

        const newCell = { row, col, branchLetter };

        const existingCellIndex = currentDrawnPath.findIndex(c => c.row === row && c.col === col);

        if (existingCellIndex > -1) {
            const existingCell = currentDrawnPath[existingCellIndex];
            if (existingCell.branchLetter !== branchLetter) {
                document.getElementById("meldingContainer").innerHTML = `<p style="color: red;">Vakje (${row},${col}) behoort al tot tak '${existingCell.branchLetter}'. Kan niet overschrijven worden met tak '${branchLetter}'.</p>`;
                return;
            } else {
                lastDrawnCell = existingCell;
                return;
            }
        }

        if (currentDrawnPath.length > 0 && lastDrawnCell) {
            const prevCell = lastDrawnCell;
            const rowDiff = Math.abs(newCell.row - prevCell.row);
            const colDiff = Math.abs(newCell.col - prevCell.col);

            if (rowDiff > 1 || colDiff > 1) {
                document.getElementById("meldingContainer").innerHTML = '<p style="color: red;">Pad moet aaneengesloten zijn. Te grote sprong.</p>';
                return;
            }
            if (rowDiff > 0 && colDiff > 0) {
                 document.getElementById("meldingContainer").innerHTML = '<p style="color: red;">Alleen rechte paden (horizontaal/verticaal) zijn toegestaan.</p>';
                 return;
            }
        }
        document.getElementById("meldingContainer").innerHTML = '<p>Teken een pad door over de vakjes te slepen. Kies een letter voor de tak.</p>';
        currentDrawnPath.push(newCell);
        drawDrawnPath();
        lastDrawnCell = newCell;
    }


    document.getElementById("clearPathBtn").addEventListener("click", () => {
        currentDrawnPath = [];
        drawDrawnPath();
        document.getElementById("meldingContainer").innerHTML = '<p>Teken een pad door over de vakjes te slepen. Kies een letter voor de tak.</p>';
        currentTemplateGrid = null;
        currentTemplateData = [];
        document.getElementById("textualOutput").innerHTML = '<p>Geen slots getekend. Teken eerst een pad.</p>';
        document.getElementById("toggleViewBtn").style.display = 'none';
        document.getElementById("newPathBtn").style.display = 'none';
        document.getElementById("downloadPngBtn").style.display = 'none';
        document.getElementById("downloadPdfBtn").style.display = 'none';
        document.getElementById("savePathBtn").style.display = 'block';
        document.getElementById("clearPathBtn").style.display = 'block';
        document.getElementById("undoLastCellBtn").style.display = 'block';
        document.getElementById("branchLetter").style.display = 'block';
        document.querySelector('label[for="branchLetter"]').style.display = 'block';
        document.getElementById("left-panel").style.display = 'flex';
    });

    document.getElementById("undoLastCellBtn").addEventListener("click", () => {
        if (currentDrawnPath.length > 0) {
            currentDrawnPath.pop();
            drawDrawnPath();
            lastDrawnCell = currentDrawnPath.length > 0 ? currentDrawnPath[currentDrawnPath.length - 1] : null;
            document.getElementById("meldingContainer").innerHTML = '<p>Laatste vakje verwijderd.</p>';
            if (currentDrawnPath.length < 1 && currentTemplateGrid) {
                currentTemplateGrid = null;
                currentTemplateData = [];
                document.getElementById("textualOutput").innerHTML = '<p>Pad te kort voor template. Teken verder.</p>';
                document.getElementById("toggleViewBtn").style.display = 'none';
                document.getElementById("newPathBtn").style.display = 'none';
                document.getElementById("downloadPngBtn").style.display = 'none';
                document.getElementById("downloadPdfBtn").style.display = 'none';
            }
        } else {
            document.getElementById("meldingContainer").innerHTML = '<p style="color: gray;">Pad is leeg, niets om te verwijderen.</p>';
        }
    });

    document.getElementById("savePathBtn").addEventListener("click", savePathAndCreateTemplate);

    document.getElementById("toggleViewBtn").addEventListener("click", toggleView);
    document.getElementById("newPathBtn").addEventListener("click", startDrawingMode);

    document.getElementById("downloadPngBtn").addEventListener("click", () => {
        let elementToDownload;
        if (currentViewMode === 'template-canvas' && currentTemplateGrid) {
            drawPathTemplateOnCanvas(currentTemplateGrid); // Zorg dat het correct getekend is voor download
            elementToDownload = canvas;
        } else if (currentViewMode === 'template-text' && currentTemplateGrid) {
            drawPathTemplateOnCanvas(currentTemplateGrid); // Teken op canvas, zelfs als tekst actief is
            elementToDownload = canvas;
        } else {
            alert("Er is geen template gegenereerd om te downloaden.");
            return;
        }
        const dataURL = elementToDownload.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataURL;
        a.download = "rekenweg_template.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        if (currentViewMode === 'template-text' && currentTemplateGrid) {
            // NIET MEER TERUGSCHAKELEN als we in tekstmodus waren, download is voltooid
            // document.getElementById("drawingCanvasContainer").style.display = 'none';
            // document.getElementById("textualOutput").style.display = 'block';
        }
    });

    document.getElementById("downloadPdfBtn").addEventListener("click", async () => {
        let elementToDownload;
        if (currentViewMode === 'template-canvas' && currentTemplateGrid) {
            drawPathTemplateOnCanvas(currentTemplateGrid); // Zorg dat het correct getekend is voor download
            elementToDownload = canvas;
        } else if (currentViewMode === 'template-text' && currentTemplateGrid) {
            drawPathTemplateOnCanvas(currentTemplateGrid); // Teken op canvas, zelfs als tekst actief is
            elementToDownload = canvas;
        } else {
            alert("Er is geen template gegenereerd om te downloaden.");
            return;
        }
        
        const dataURL = elementToDownload.toDataURL("image/png");
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgWidth / imgHeight;

        let pdfImgWidth = pageWidth - 20;
        let pdfImgHeight = pdfImgWidth / ratio;

        if (pdfImgHeight > pageHeight - 40) {
            pdfImgHeight = pageHeight - 40;
            pdfImgWidth = pdfImgHeight * ratio;
        }

        const xPos = (pageWidth - pdfImgWidth) / 2;
        const yPos = (pageHeight - pdfImgHeight) / 2;

        doc.addImage(dataURL, 'PNG', xPos, yPos, pdfImgWidth, pdfImgHeight);
        doc.setFontSize(18);
        doc.text("Rekenweg Template", pageWidth / 2, 20, { align: 'center' });
        doc.save("rekenweg_template.pdf");

        if (currentViewMode === 'template-text' && currentTemplateGrid) {
            // NIET MEER TERUGSCHAKELEN als we in tekstmodus waren, download is voltooid
            // document.getElementById("drawingCanvasContainer").style.display = 'none';
            // document.getElementById("textualOutput").style.display = 'block';
        }
    });
});
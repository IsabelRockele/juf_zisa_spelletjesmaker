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

// NIEUW: Regels voor het automatisch wisselen van takletters
// Definieert hoeveel vakjes per letter en de volgende letter in de reeks
const branchRules = {
    'A': { count: 5, next: 'B' },
    'B': { count: 4, next: 'C' },
    'C': { count: 4, next: 'D' },
    'D': { count: 4, next: 'E' },
    'E': { count: 4, next: 'F' },
    'F': { count: 4, next: 'G' },
    'G': { count: 4, next: 'H' },
    'H': { count: 4, next: 'I' },
    'I': { count: 4, next: 'J' },
    'J': { count: 4, next: 'K' },
    'K': { count: 4, next: 'L' },
    'L': { count: 4, next: 'M' },
    'M': { count: 4, next: 'N' },
    'N': { count: 4, next: 'O' },
    'O': { count: 4, next: 'P' },
    'P': { count: 4, next: 'Q' },
    'Q': { count: 4, next: 'R' },
    'R': { count: 4, next: 'S' },
    'S': { count: 4, next: 'T' },
    'T': { count: 4, next: 'U' },
    'U': { count: 4, next: 'V' },
    'V': { count: 4, next: 'W' },
    'W': { count: 4, next: 'X' },
    'X': { count: 4, next: 'Y' },
    'Y': { count: 4, next: 'Z' },
    'Z': { count: 4, next: null } // Na Z is er geen volgende tak
};

const branchLettersOrder = Object.keys(branchRules); // Array van de letters in volgorde
let activeBranchIndex = 0; // Index van de huidige actieve takletter
let activeBranchLetter = branchLettersOrder[activeBranchIndex]; // De daadwerkelijke letter

// --- HELPER FUNCTIES ---

/**
 * Haalt de kleur op voor een specifieke takletter.
 * @param {string} letter - De letter van de tak.
 * @returns {string} De kleurcode voor de tak.
 */
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
        // Fallback: Als er geen duidelijke eindpunten zijn, sorteer en kies de eerste als startpunt.
        potentialStartPoints.push(cellsInBranch.sort((a,b) => a.row - b.row || a.col - b.col)[0]);
    } else if (potentialStartPoints.length > 2) {
        // Meer dan twee 'eindpunten' betekent een vertakking of een lus die niet simpel is.
        return null; 
    }

    let orderedBranch = [];
    let visited = new Set();
    let current = potentialStartPoints[0]; // Start vanaf het eerste gevonden potentiële startpunt

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
    
    // Als het aantal geordende cellen niet overeenkomt met het originele aantal, is er een gat of een onbehandelde vertakking.
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
    currentTemplateData = []; // Opslag voor de tekstuele lijst van slots per tak

    const branchLetters = Object.keys(pathsByBranch).sort((a, b) => branchLettersOrder.indexOf(a) - branchLettersOrder.indexOf(b)); // Sorteer takken op basis van de gedefinieerde volgorde

    let slotCounter = 0;

    for (const branchLetter of branchLetters) {
        const branchPath = pathsByBranch[branchLetter];

        if (branchPath.length < 1) {
            console.warn(`Tak ${branchLetter} is te kort.`);
            continue;
        }
        
        // De header voor de tekstuele data, ook al wordt deze niet getoond.
        currentTemplateData.push({ type: 'header', branchLetter: branchLetter, count: branchPath.length });

        for (let i = 0; i < branchPath.length; i++) {
            const cellCoord = branchPath[i];
            
            if (templateGrid[cellCoord.row][cellCoord.col] !== null) {
                console.warn(`Vakje (${cellCoord.row},${cellCoord.col}) behoort al tot een eerdere tak. Overslaan.`);
                continue;
            }

            slotCounter++;
            templateGrid[cellCoord.row][cellCoord.col] = {
                type: 'empty_slot',
                value: '___', // Visuele weergave (nu niet getoond, maar data blijft)
                row: cellCoord.row,
                col: cellCoord.col,
                branchLetter: branchLetter,
                slotNumber: slotCounter // Nummer voor de tekstuele lijst
            };
            currentTemplateData.push(templateGrid[cellCoord.row][cellCoord.col]);
        }
    }

    if (slotCounter === 0) {
        return null;
    }

    return templateGrid;
}


// --- CANVAS TEKEN FUNCTIES ---

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
    // ctx.font en ctx.textAlign/textBaseline zijn niet nodig, want we tekenen geen tekst.

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
                
                // GEEN TEKST OF NUMMERS MEER IN DE VAKJES HIER.
            }
        }
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
    
    document.getElementById("drawNewPathBtn").style.display = 'none'; // "Teken opnieuw" verbergen
    document.getElementById("downloadPngBtn").style.display = 'none';
    document.getElementById("downloadPdfBtn").style.display = 'none';
    
    document.getElementById("showMyPathBtn").style.display = 'block'; // "Toon mijn pad" tonen
    document.getElementById("clearPathBtn").style.display = 'block';
    document.getElementById("undoLastCellBtn").style.display = 'block';
    document.getElementById("branchLetter").style.display = 'block';
    document.querySelector('label[for="branchLetter"]').style.display = 'block';
    document.getElementById("left-panel").style.display = 'flex';
    document.getElementById("meldingContainer").innerHTML = '<p>Teken een pad door over de vakjes te slepen. Kies een letter voor de tak.</p>';

    // Initialiseer de actieve takletter en de dropdown
    activeBranchIndex = 0;
    activeBranchLetter = branchLettersOrder[activeBranchIndex];
    document.getElementById("branchLetter").value = activeBranchLetter;
}

/**
 * Toont de gemaakte template van het pad.
 * Deze functie wordt aangeroepen door de "Toon mijn pad" knop.
 */
function showMyPathTemplate() {
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
        // Blijf in de tekenmodus en toon de foutmelding
        return;
    }

    meldingContainer.innerHTML = '<p style="color: #004080; text-align: center;">Template wordt aangemaakt...</p>';
    
    const createdTemplateGrid = createPathTemplateGrid(orderedPathsByBranch);
    currentTemplateGrid = createdTemplateGrid;

    if (currentTemplateGrid) {
        console.log("Template succesvol aangemaakt. Totaal:", currentTemplateData.filter(item => item.type !== 'header').length, "slots.");
        meldingContainer.innerHTML = '';
        
        currentViewMode = 'template-canvas'; // Zet direct naar de canvas template weergave
        document.getElementById("drawingCanvasContainer").style.display = 'block';
        
        document.getElementById("drawNewPathBtn").style.display = 'block'; // Toon de "Teken opnieuw" knop
        document.getElementById("downloadPngBtn").style.display = 'block';
        document.getElementById("downloadPdfBtn").style.display = 'block';
        
        // Verberg de tekenmodus knoppen
        document.getElementById("showMyPathBtn").style.display = 'none'; // "Toon mijn pad" verbergen
        document.getElementById("clearPathBtn").style.display = 'none';
        document.getElementById("undoLastCellBtn").style.display = 'none';
        document.getElementById("branchLetter").style.display = 'none';
        document.querySelector('label[for="branchLetter"]').style.display = 'none';
        document.getElementById("left-panel").style.display = 'none'; // Linkerpaneel verbergen na opslaan

        // Teken de template op het canvas
        drawPathTemplateOnCanvas(currentTemplateGrid);
        
    } else {
        console.warn("Kon geen template aanmaken op het getekende pad.");
        meldingContainer.innerHTML = '<p style="color: red; text-align: center;">Kon geen template aanmaken op het getekende pad.<br>Zorg voor minimaal één vakje en aaneengesloten takken.</p>';
        // Blijf in tekenmodus en toon de foutmelding
    }
}


// --- INITIALISATIE EN EVENT LISTENERS ---
document.addEventListener("DOMContentLoaded", () => {
    canvas = document.getElementById("mainCanvas");
    ctx = canvas.getContext("2d");

    canvas.width = GRID_COLS * CELL_SIZE; // 20 * 40 = 800
    canvas.height = GRID_ROWS * CELL_SIZE; // 15 * 40 = 600

    startDrawingMode(); // Start altijd in tekenmodus

    canvas.addEventListener('mousedown', (e) => {
        if (currentViewMode !== 'drawing') return; // Alleen tekenen in tekenmodus
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const col = Math.floor(x / CELL_SIZE);
        const row = Math.floor(y / CELL_SIZE);
        // De branchLetter wordt nu automatisch beheerd, we halen deze niet meer uit de dropdown hier
        // const selectedBranchLetter = document.getElementById("branchLetter").value;
        addCellToPath(row, col, activeBranchLetter); // Gebruik activeBranchLetter
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing || currentViewMode !== 'drawing') return; // Alleen tekenen in tekenmodus
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const col = Math.floor(x / CELL_SIZE); 
        const row = Math.floor(y / CELL_SIZE); 
        // const selectedBranchLetter = document.getElementById("branchLetter").value;
        addCellToPath(row, col, activeBranchLetter); // Gebruik activeBranchLetter
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

        // Controleer of de getekende cel al bestaat
        const existingCellIndex = currentDrawnPath.findIndex(c => c.row === row && c.col === col);

        if (existingCellIndex > -1) {
            const existingCell = currentDrawnPath[existingCellIndex];
            // Als de cel al bestaat en behoort tot een *andere* takletter, sta overschrijven niet toe.
            if (existingCell.branchLetter !== branchLetter) {
                document.getElementById("meldingContainer").innerHTML = `<p style="color: red;">Vakje (${row},${col}) behoort al tot tak '${existingCell.branchLetter}'. Kan niet overschrijven met tak '${branchLetter}'.</p>`;
                return;
            } else {
                // Als de cel al bestaat en van dezelfde tak is, negeer (om dubbele toevoeging bij slepen te voorkomen)
                lastDrawnCell = existingCell;
                return;
            }
        }
        
        // NIEUWE CONTROLE: Zorg dat de getekende cel overeenkomt met de actieve takletter
        if (branchLetter !== activeBranchLetter) {
            document.getElementById("meldingContainer").innerHTML = `<p style="color: red;">Teken vakjes voor tak '${activeBranchLetter}'.</p>`;
            return;
        }

        if (currentDrawnPath.length > 0 && lastDrawnCell) {
            const prevCell = lastDrawnCell;
            const rowDiff = Math.abs(newCell.row - prevCell.row);
            const colDiff = Math.abs(newCell.col - prevCell.col);

            // Controleer op aaneengeslotenheid (alleen horizontaal of verticaal, geen diagonalen of sprongen)
            if (rowDiff > 1 || colDiff > 1 || (rowDiff > 0 && colDiff > 0)) {
                 document.getElementById("meldingContainer").innerHTML = '<p style="color: red;">Alleen rechte, aaneengesloten paden (horizontaal/verticaal) zijn toegestaan.</p>';
                 return;
            }
        }
        
        document.getElementById("meldingContainer").innerHTML = '<p>Teken een pad door over de vakjes te slepen. Kies een letter voor de tak.</p>';
        currentDrawnPath.push(newCell);
        drawDrawnPath();
        lastDrawnCell = newCell;

        // NIEUWE LOGICA: Controleer en wissel van takletter indien nodig
        const cellsInCurrentBranch = currentDrawnPath.filter(c => c.branchLetter === activeBranchLetter).length;
        const rule = branchRules[activeBranchLetter];

        if (rule && cellsInCurrentBranch >= rule.count) {
            if (rule.next) {
                activeBranchIndex = branchLettersOrder.indexOf(rule.next);
                activeBranchLetter = branchLettersOrder[activeBranchIndex];
                document.getElementById("branchLetter").value = activeBranchLetter;
                document.getElementById("meldingContainer").innerHTML = `<p>Tak '${activeBranchLetter}' is voltooid. Ga verder met tak '${activeBranchLetter}'.</p>`;
            } else {
                document.getElementById("meldingContainer").innerHTML = `<p>Alle takken zijn voltooid. Klik op 'Toon mijn pad' om de template te zien.</p>`;
                isDrawing = false; // Stop tekenen
            }
        }
    }


    document.getElementById("clearPathBtn").addEventListener("click", () => {
        currentDrawnPath = [];
        drawDrawnPath(); // Update canvas direct
        document.getElementById("meldingContainer").innerHTML = '<p>Teken een pad door over de vakjes te slepen. Kies een letter voor de tak.</p>';
        currentTemplateGrid = null;
        currentTemplateData = []; // Leeg de template data ook
        
        // Reset actieve takletter en dropdown
        activeBranchIndex = 0;
        activeBranchLetter = branchLettersOrder[activeBranchIndex];
        document.getElementById("branchLetter").value = activeBranchLetter;

        // Zorg ervoor dat de juiste knoppen zichtbaar zijn voor tekenmodus
        document.getElementById("drawNewPathBtn").style.display = 'none';
        document.getElementById("downloadPngBtn").style.display = 'none';
        document.getElementById("downloadPdfBtn").style.display = 'none';
        
        document.getElementById("showMyPathBtn").style.display = 'block';
        document.getElementById("clearPathBtn").style.display = 'block';
        document.getElementById("undoLastCellBtn").style.display = 'block';
        document.getElementById("branchLetter").style.display = 'block';
        document.querySelector('label[for="branchLetter"]').style.display = 'block';
        document.getElementById("left-panel").style.display = 'flex';
        currentViewMode = 'drawing'; // Zorg dat de modus terug op 'drawing' staat
    });

    document.getElementById("undoLastCellBtn").addEventListener("click", () => {
        if (currentDrawnPath.length > 0) {
            // Verwijder de laatst getekende cel
            const removedCell = currentDrawnPath.pop();
            drawDrawnPath(); // Update canvas direct
            lastDrawnCell = currentDrawnPath.length > 0 ? currentDrawnPath[currentDrawnPath.length - 1] : null;
            document.getElementById("meldingContainer").innerHTML = '<p>Laatste vakje verwijderd.</p>';
            
            // Controleer of de verwijderde cel de takwisseling ongedaan maakt
            const cellsInRemovedBranch = currentDrawnPath.filter(c => c.branchLetter === removedCell.branchLetter).length;
            const ruleForRemovedBranch = branchRules[removedCell.branchLetter];

            if (ruleForRemovedBranch && cellsInRemovedBranch < ruleForRemovedBranch.count) {
                // Als we een cel verwijderen en het aantal valt onder de drempel van de *volgende* tak,
                // dan moeten we terugschakelen naar de vorige tak.
                // Dit is de complexere logica: we gaan terug naar de tak van de verwijderde cel.
                activeBranchLetter = removedCell.branchLetter;
                activeBranchIndex = branchLettersOrder.indexOf(activeBranchLetter);
                document.getElementById("branchLetter").value = activeBranchLetter;
                document.getElementById("meldingContainer").innerHTML = `<p>Terug naar tak '${activeBranchLetter}'.</p>`;
            }

            // Als het pad leeg is, verberg downloadknoppen
            if (currentDrawnPath.length < 1) {
                currentTemplateGrid = null;
                currentTemplateData = [];
                document.getElementById("drawNewPathBtn").style.display = 'none';
                document.getElementById("downloadPngBtn").style.display = 'none';
                document.getElementById("downloadPdfBtn").style.display = 'none';
                // Toon "Toon mijn pad" als het leeg is
                document.getElementById("showMyPathBtn").style.display = 'block'; 

                // Reset actieve takletter als pad leeg is
                activeBranchIndex = 0;
                activeBranchLetter = branchLettersOrder[activeBranchIndex];
                document.getElementById("branchLetter").value = activeBranchLetter;
            }
        } else {
            document.getElementById("meldingContainer").innerHTML = '<p style="color: gray;">Pad is leeg, niets om te verwijderen.</p>';
        }
    });

    document.getElementById("showMyPathBtn").addEventListener("click", showMyPathTemplate);

    document.getElementById("drawNewPathBtn").addEventListener("click", startDrawingMode);

    document.getElementById("downloadPngBtn").addEventListener("click", () => {
        if (currentViewMode !== 'template-canvas' || !currentTemplateGrid) {
            alert("Er is geen template om te downloaden. Teken eerst een pad en toon het.");
            return;
        }
        drawPathTemplateOnCanvas(currentTemplateGrid); // Zorg dat het correct getekend is voor download
        const dataURL = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataURL;
        a.download = "rekenweg_template.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    document.getElementById("downloadPdfBtn").addEventListener("click", async () => {
        if (currentViewMode !== 'template-canvas' || !currentTemplateGrid) {
            alert("Er is geen template om te downloaden. Teken eerst een pad en toon het.");
            return;
        }
        drawPathTemplateOnCanvas(currentTemplateGrid); // Zorg dat het correct getekend is voor download
        
        const dataURL = canvas.toDataURL("image/png");
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
    });
});
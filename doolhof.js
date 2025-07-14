// Klassiek doolhof met DFS en gekleurde vakjes voor oplossing, dynamische grootte

// Grootte van de cellen in pixels (dynamisch aanpasbaar)
let CELL_SIZE = 40;
let gridWidth = 10;  // Standaard breedte
let gridHeight = 10;  // Standaard hoogte
const mazeGrid = [];  // Het doolhof raster
let startPoint = { row: 0, col: 0 };  // Dynamisch startpunt
let endPoint = { row: 0, col: 0 };    // Dynamisch eindpunt
let solutionPath = [];  // Oplossing (pad) van het doolhof

// Functie om een willekeurig punt aan de rand van het doolhof te kiezen
function getRandomBorderPoint(excludePoint = null) {
    const borderPoints = [];

    // Bovenste rij
    for (let c = 0; c < gridWidth; c++) {
        borderPoints.push({ row: 0, col: c });
    }
    // Onderste rij
    for (let c = 0; c < gridWidth; c++) {
        borderPoints.push({ row: gridHeight - 1, col: c });
    }
    // Linker kolom (zonder hoeken dubbel te tellen)
    for (let r = 1; r < gridHeight - 1; r++) {
        borderPoints.push({ row: r, col: 0 });
    }
    // Rechter kolom (zonder hoeken dubbel te tellen)
    for (let r = 1; r < gridHeight - 1; r++) {
        borderPoints.push({ row: r, col: gridWidth - 1 });
    }

    let chosenPoint;
    do {
        chosenPoint = borderPoints[Math.floor(Math.random() * borderPoints.length)];
    } while (excludePoint && chosenPoint.row === excludePoint.row && chosenPoint.col === excludePoint.col);

    return chosenPoint;
}

// Functie om de gridgrootte dynamisch aan te passen
function setGridSize(width, height) {
    gridWidth = width;
    gridHeight = height;

    // Kies nieuwe willekeurige start- en eindpunten
    startPoint = getRandomBorderPoint();
    endPoint = getRandomBorderPoint(startPoint); // Zorg ervoor dat eindpunt niet hetzelfde is als startpunt

    // Pas de canvasgrootte aan
    const canvas = document.getElementById("mainCanvas");
    canvas.width = gridWidth * CELL_SIZE;
    canvas.height = gridHeight * CELL_SIZE;
}

// Helper functie om het doolhof raster te initialiseren
function initializeMazeGrid() {
    mazeGrid.length = 0;  // Reset het grid
    for (let r = 0; r < gridHeight; r++) {
        mazeGrid[r] = [];
        for (let c = 0; c < gridWidth; c++) {
            mazeGrid[r][c] = {
                visited: false,
                walls: { top: true, bottom: true, left: true, right: true }
            };
        }
    }
}

// Diepte-eerst zoeken (DFS) om het doolhof te genereren
function generateMazeDFS(startR, startC) {
    const stack = [];
    stack.push({ r: startR, c: startC });
    mazeGrid[startR][startC].visited = true;

    const getNeighbors = (r, c) => {
        const neighbors = [
            { r: r - 1, c: c, wallToBreak: 'top' },
            { r: r + 1, c: c, wallToBreak: 'bottom' },
            { r: r, c: c - 1, wallToBreak: 'left' },
            { r: r, c: c + 1, wallToBreak: 'right' }
        ];
        return neighbors.filter(neighbor =>
            neighbor.r >= 0 && neighbor.r < gridHeight &&
            neighbor.c >= 0 && neighbor.c < gridWidth &&
            !mazeGrid[neighbor.r][neighbor.c].visited
        );
    };

    while (stack.length > 0) {
        const { r, c } = stack[stack.length - 1];
        const neighbors = getNeighbors(r, c);

        if (neighbors.length > 0) {
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];

            if (mazeGrid[r][c].walls[next.wallToBreak]) {
                mazeGrid[r][c].walls[next.wallToBreak] = false;
                mazeGrid[next.r][next.c].walls[next.wallToBreak === 'top' ? 'bottom' : next.wallToBreak === 'bottom' ? 'top' : next.wallToBreak === 'left' ? 'right' : 'left'] = false;
            }

            mazeGrid[next.r][next.c].visited = true;
            stack.push(next);
        } else {
            stack.pop();
        }
    }
}

// Breadth-First Search (BFS) voor het oplossen van het doolhof
function solveMazeBFS() {
    // Reset visited state for all cells before solving
    for (let r = 0; r < gridHeight; r++) {
        for (let c = 0; c < gridWidth; c++) {
            mazeGrid[r][c].visited = false;
        }
    }

    const queue = [];
    const parent = {};  // Opslaan van de oudercellen om het pad te reconstrueren
    const directions = [
        { r: -1, c: 0, wall: 'top' },
        { r: 1, c: 0, wall: 'bottom' },
        { r: 0, c: -1, wall: 'left' },
        { r: 0, c: 1, wall: 'right' }
    ];

    queue.push({ row: startPoint.row, col: startPoint.col });
    mazeGrid[startPoint.row][startPoint.col].visited = true;

    while (queue.length > 0) {
        const current = queue.shift();
        const { row, col } = current;

        // Check of we het eindpunt hebben bereikt
        if (row === endPoint.row && col === endPoint.col) {
            let path = [];
            let cell = current;
            while (cell) {
                path.unshift(cell);
                cell = parent[`${cell.row},${cell.col}`];
            }
            solutionPath = path;
            return;
        }

        for (let dir of directions) {
            const newRow = row + dir.r;
            const newCol = col + dir.c;

            if (newRow >= 0 && newRow < gridHeight && newCol >= 0 && newCol < gridWidth &&
                !mazeGrid[newRow][newCol].visited) {

                // Controleer of de muur tussen de huidige cel en de nieuwe cel open is
                let wallOpen = false;
                // Voor de start- en eindpunten, behandelen we de "buitenmuur" als open
                if ((row === startPoint.row && col === startPoint.col && dir.wall === getEntryPointWall(startPoint)) ||
                    (row === endPoint.row && col === endPoint.col && dir.wall === getEntryPointWall(endPoint))) {
                    wallOpen = true; // Dit is de "muur" naar buiten
                } else if (!mazeGrid[row][col].walls[dir.wall]) {
                    wallOpen = true;
                }

                if (wallOpen) {
                    queue.push({ row: newRow, col: newCol });
                    mazeGrid[newRow][newCol].visited = true;
                    parent[`${newRow},${newCol}`] = { row, col };
                }
            }
        }
    }
    solutionPath = []; // Geen oplossing gevonden
}

// Helper functie om te bepalen welke muur bij een randpunt de "ingang" is
function getEntryPointWall(point) {
    if (point.row === 0) return 'top'; // Bovenste rij
    if (point.row === gridHeight - 1) return 'bottom'; // Onderste rij
    if (point.col === 0) return 'left'; // Linker kolom
    if (point.col === gridWidth - 1) return 'right'; // Rechter kolom
    return null; // Zou niet moeten gebeuren voor randpunten
}

// Tekent het doolhof
// Parameter 'drawPoints' bepaalt of de start- en eindbolletjes getekend moeten worden
function drawMaze(ctx, drawPoints = true) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);  // Wis het canvas

    ctx.strokeStyle = "#000000";  // Kleur van de muren
    ctx.lineWidth = 2;

    // Teken de muren
    for (let r = 0; r < gridHeight; r++) {
        for (let c = 0; c < gridWidth; c++) {
            const x = c * CELL_SIZE;
            const y = r * CELL_SIZE;
            const cell = mazeGrid[r][c];

            ctx.beginPath();
            // Teken bovenmuur, tenzij het de bovenkant van de start- of eindcel is
            if (cell.walls.top && !(r === startPoint.row && c === startPoint.col && getEntryPointWall(startPoint) === 'top') &&
                                 !(r === endPoint.row && c === endPoint.col && getEntryPointWall(endPoint) === 'top')) {
                ctx.moveTo(x, y);
                ctx.lineTo(x + CELL_SIZE, y);
            }
            // Teken ondermuur, tenzij het de onderkant van de start- of eindcel is
            if (cell.walls.bottom && !(r === startPoint.row && c === startPoint.col && getEntryPointWall(startPoint) === 'bottom') &&
                                    !(r === endPoint.row && c === endPoint.col && getEntryPointWall(endPoint) === 'bottom')) {
                ctx.moveTo(x, y + CELL_SIZE);
                ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE);
            }
            // Teken linkermuur, tenzij het de linkerkant van de start- of eindcel is
            if (cell.walls.left && !(r === startPoint.row && c === startPoint.col && getEntryPointWall(startPoint) === 'left') &&
                                  !(r === endPoint.row && c === endPoint.col && getEntryPointWall(endPoint) === 'left')) {
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + CELL_SIZE);
            }
            // Teken rechtermuur, tenzij het de rechterkant van de start- of eindcel is
            if (cell.walls.right && !(r === startPoint.row && c === startPoint.col && getEntryPointWall(startPoint) === 'right') &&
                                   !(r === endPoint.row && c === endPoint.col && getEntryPointWall(endPoint) === 'right')) {
                ctx.moveTo(x + CELL_SIZE, y);
                ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE);
            }
            ctx.stroke();
        }
    }

    // Teken de oplossing (als een lijn)
    if (solutionPath.length > 0) {
        ctx.strokeStyle = "green";  // Kleur van de oplossing
        ctx.lineWidth = 4;          // Dikte van de lijn
        ctx.lineCap = "round";      // Afgeronde lijneinden

        ctx.beginPath();
        // Start bij het midden van de eerste cel in het pad
        ctx.moveTo(solutionPath[0].col * CELL_SIZE + CELL_SIZE / 2,
                   solutionPath[0].row * CELL_SIZE + CELL_SIZE / 2);

        // Loop door de rest van het pad en teken lijnen
        for (let i = 1; i < solutionPath.length; i++) {
            ctx.lineTo(solutionPath[i].col * CELL_SIZE + CELL_SIZE / 2,
                       solutionPath[i].row * CELL_SIZE + CELL_SIZE / 2);
        }
        ctx.stroke();
    }

    // Teken start- en eindbolletjes alleen als drawPoints true is
    if (drawPoints) {
        // Teken een groen bolletje bij de startpositie
        ctx.beginPath();
        ctx.arc(startPoint.col * CELL_SIZE + CELL_SIZE / 2, startPoint.row * CELL_SIZE + CELL_SIZE / 2, 6, 0, Math.PI * 2);
        ctx.fillStyle = "green";
        ctx.fill();

        // Teken een rood bolletje bij de eindpositie
        ctx.beginPath();
        ctx.arc(endPoint.col * CELL_SIZE + CELL_SIZE / 2, endPoint.row * CELL_SIZE + CELL_SIZE / 2, 6, 0, Math.PI * 2);
        ctx.fillStyle = "red";
        ctx.fill();
    }
}

// Functie voor het genereren en tekenen van het doolhof (zonder oplossing)
function generateOnlyMaze(ctx) {
    initializeMazeGrid();  // Initialiseer het doolhof
    // Start de DFS vanuit het willekeurig gekozen startpunt
    generateMazeDFS(startPoint.row, startPoint.col);
    solutionPath = []; // Wis de oplossing wanneer een nieuw doolhof wordt gegenereerd
    drawMaze(ctx);  // Teken alleen het doolhof
}

// Voeg de event listener toe voor het genereren van het doolhof
document.getElementById("generateMazeBtn").addEventListener("click", function() {
    const canvas = document.getElementById("mainCanvas");
    const ctx = canvas.getContext("2d");
    const width = parseInt(document.getElementById("gridWidth").value);
    const height = parseInt(document.getElementById("gridHeight").value);

    // setGridSize kiest nu ook de start- en eindpunten willekeurig
    setGridSize(width, height);
    generateOnlyMaze(ctx);  // Genereer en teken het doolhof zonder oplossing
    showMelding('Nieuw doolhof gegenereerd met willekeurige ingang/uitgang.', 'info');
});

// Voeg de event listener toe voor het oplossen van het doolhof
document.getElementById("solveMazeBtn").addEventListener("click", function() {
    const canvas = document.getElementById("mainCanvas");
    const ctx = canvas.getContext("2d");
    // Alleen oplossen en tekenen, niet opnieuw genereren
    solveMazeBFS();
    drawMaze(ctx); // Teken het doolhof inclusief de oplossing
    if (solutionPath.length > 0) {
        showMelding('Doolhof oplossing getoond.', 'info');
    } else {
        showMelding('Geen oplossing gevonden voor dit doolhof.', 'warning');
    }
});

// Functie voor het tonen van meldingen (bijvoorbeeld voor het genereren of oplossen van het doolhof)
function showMelding(message, type = 'info') {
    const meldingContainer = document.getElementById("meldingContainer");
    let color = '#004080'; // Default info
    if (type === 'warning') color = 'orange';
    if (type === 'error') color = 'red';
    meldingContainer.innerHTML = `<p style="color: ${color};">${message}</p>`;
}

// Download de doolhof als PNG
document.getElementById("downloadPngBtn").addEventListener("click", function() {
    const canvas = document.getElementById("mainCanvas");
    const ctx = canvas.getContext("2d");

    // Teken het doolhof zonder start- en eindbolletjes voor de download
    drawMaze(ctx, false); // false = teken geen bolletjes

    const dataURL = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = "doolhof.png";
    a.click();

    // Teken het doolhof direct daarna weer met start- en eindbolletjes voor de weergave op het scherm
    drawMaze(ctx, true); // true = teken wel bolletjes
    showMelding('Doolhof gedownload als PNG.', 'info');
});

// Download de doolhof als PDF
document.getElementById("downloadPdfBtn").addEventListener("click", function() {
    const canvas = document.getElementById("mainCanvas");
    const ctx = canvas.getContext("2d");

    // Teken het doolhof zonder start- en eindbolletjes voor de download
    drawMaze(ctx, false); // false = teken geen bolletjes

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
    doc.text("Doolhof", pageWidth / 2, 20, { align: 'center' });
    doc.save("doolhof.pdf");

    // Teken het doolhof direct daarna weer met start- en eindbolletjes voor de weergave op het scherm
    drawMaze(ctx, true); // true = teken wel bolletjes
    showMelding('Doolhof gedownload als PDF.', 'info');
});
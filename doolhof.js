document.addEventListener('DOMContentLoaded', () => {

    const CANVAS_SIZE = 500;
    const WALL_THICKNESS = 2;
    const MAZE_COLOR = "#333";
    const SOLUTION_COLOR = "#007bff";

    const canvas = document.getElementById('mazeCanvas'); // Zorg dat dit overeenkomt met de ID in HTML
    const ctx = canvas.getContext('2d');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    
    const instructieText = document.getElementById('instructieText');
    const solveBtn = document.getElementById('solveMazeBtn');
    const hideBtn = document.getElementById('hideSolutionBtn');

    let currentGrid = []; // Kan een 2D array zijn voor grid-based, of een object voor polar
    let activeCells = []; // Alleen gebruikt voor masked/worksheet mazes
    let startCell, endCell;
    let solutionPath = [];
    let currentShape = 'worksheet'; // Standaard starten met worksheet
    
    const shapes = [
        { id: 'worksheet', name: 'Uitsparing', file: 'uitsparing.png' },
        { id: 'rectangle', name: 'Rechthoek', file: 'rechthoek.png' },
        { id: 'masked_circle', name: 'Vorm', file: 'vorm.png' },
        { id: 'polar_circle', name: 'Cirkel', file: 'cirkel.png' } // Nieuwe ID
    ];

    function initialize() {
        setupShapePicker();
        addEventListeners();
        generateAndDrawMaze(); // Genereer het initiële doolhof bij het laden
    }

    function setupShapePicker() {
        const pickerDiv = document.getElementById('vorm-kiezer');
        shapes.forEach(shape => {
            const img = document.createElement('img');
            img.src = `start_afbeeldingen/${shape.file}`;
            img.alt = shape.name;
            img.dataset.shape = shape.id;
            if (shape.id === currentShape) img.classList.add('selected');
            pickerDiv.appendChild(img);
        });
    }

    function addEventListeners() {
        document.getElementById('vorm-kiezer').addEventListener('click', (e) => {
            if (e.target.tagName === 'IMG') {
                document.querySelectorAll('#vorm-kiezer img').forEach(img => img.classList.remove('selected'));
                e.target.classList.add('selected');
                currentShape = e.target.dataset.shape;
                generateAndDrawMaze();
            }
        });
        document.querySelectorAll('input[name="difficulty"]').forEach(radio => radio.addEventListener('change', generateAndDrawMaze));
        document.getElementById('generateButton').addEventListener('click', generateAndDrawMaze);
        document.getElementById('downloadPdfBtn').addEventListener('click', downloadPDF);
        document.getElementById('downloadPngBtn').addEventListener('click', downloadPNG);
        
        // De eraser is alleen voor 'worksheet' doolhof
        canvas.addEventListener('click', handleEraser); 
        
        solveBtn.addEventListener('click', solveAndShowSolution);
        hideBtn.addEventListener('click', hideSolution);
    }
    
    function generateAndDrawMaze() {
        const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
        solutionPath = []; 
        hideSolution(); 
        activeCells = []; // Reset activeCells voor elke generatie

        // Reset instructietekst en knoppen
        instructieText.textContent = "Kies een vorm en moeilijkheid.";
        solveBtn.disabled = false;
        canvas.style.cursor = 'default';

        if (currentShape === 'worksheet') {
            generateWorksheetMaze(difficulty);
            canvas.style.cursor = 'crosshair';
            instructieText.textContent = "Klik op een muur om deze te verwijderen. De in- en uitgang zijn al open.";
        } else if (currentShape === 'rectangle') {
            generateRectangularMaze(difficulty);
        } else if (currentShape === 'masked_circle') {
            generateMaskedMaze(difficulty);
        } else if (currentShape === 'polar_circle') {
            generatePolarMaze(difficulty);
        }
        // drawAll() wordt aangeroepen vanuit de specifieke generate functies.
    }
    
    function drawAll() {
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        
        if (currentShape === 'worksheet') { drawWorksheetMaze(); }
        else if (currentShape === 'rectangle') { drawRectangularMaze(); }
        else if (currentShape === 'masked_circle') { drawMaskedMaze(); }
        else if (currentShape === 'polar_circle') { drawPolarMaze(); } // Nieuwe draw functie
        
        if (solutionPath.length > 0) {
            drawSolution();
        }
    }

    // --- DOOLHOF LOGICA (Ongewijzigd van je bestaande doolhof.js) ---

    function generateWorksheetMaze(difficulty) {
        const DIFFICULTY_LEVELS = { easy: 10, medium: 15, hard: 25 };
        const gridSize = DIFFICULTY_LEVELS[difficulty];
        let grid = [];
        const cutoutSize = Math.floor(gridSize * 0.25);

        for (let y = 0; y < gridSize; y++) {
            grid[y] = [];
            for (let x = 0; x < gridSize; x++) {
                const cell = { x, y, walls: { top: true, right: true, bottom: true, left: true }, visited: false };
                grid[y][x] = cell;
                const inTopLeft = x < cutoutSize && y < cutoutSize;
                const inBottomRight = x >= gridSize - cutoutSize && y >= gridSize - cutoutSize;
                if (!inTopLeft && !inBottomRight) activeCells.push(cell);
            }
        }
        
        if(activeCells.length === 0) return;
        
        let stack = [activeCells[0]];
        activeCells[0].visited = true;

        while (stack.length > 0) {
            let current = stack.pop();
            const getNeighbors = (cell) => [ grid[cell.y-1]?.[cell.x], grid[cell.y]?.[cell.x+1], grid[cell.y+1]?.[cell.x], grid[cell.y]?.[cell.x-1] ].filter(p => p && !p.visited && activeCells.includes(p));
            const neighbors = getNeighbors(current);
            
            if (neighbors.length > 0) {
                stack.push(current);
                let chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
                if (current.x - chosen.x === 1) { current.walls.left = false; chosen.walls.right = false; }
                else if (current.x - chosen.x === -1) { current.walls.right = false; chosen.walls.left = false; }
                if (current.y - chosen.y === 1) { current.walls.top = false; chosen.walls.bottom = false; }
                else if (current.y - chosen.y === -1) { current.walls.bottom = false; chosen.walls.top = false; }
                chosen.visited = true;
                stack.push(chosen);
            }
        }
        currentGrid = grid;
        
        startCell = grid[Math.floor(cutoutSize/2)][cutoutSize];
        endCell = grid[gridSize - Math.floor(cutoutSize/2) -1][gridSize - cutoutSize -1];
        startCell.walls.left = false;
        endCell.walls.right = false;

        drawAll();
    }

    function drawWorksheetMaze() {
        if (!currentGrid.length) return;
        const gridSize = currentGrid.length;
        const cellSize = CANVAS_SIZE / gridSize;
        ctx.strokeStyle = MAZE_COLOR;
        ctx.lineWidth = WALL_THICKNESS;
        ctx.lineCap = "round";
        for (const cell of activeCells) {
            const gx = cell.x * cellSize, gy = cell.y * cellSize;
            ctx.beginPath();
            if (cell.walls.top) { ctx.moveTo(gx, gy); ctx.lineTo(gx + cellSize, gy); }
            if (cell.walls.right) { ctx.moveTo(gx + cellSize, gy); ctx.lineTo(gx + cellSize, gy + cellSize); }
            if (cell.walls.bottom) { ctx.moveTo(gx, gy + cellSize); ctx.lineTo(gx + cellSize, gy + cellSize); }
            if (cell.walls.left) { ctx.moveTo(gx, gy + cellSize); ctx.lineTo(gx, gy); }
            ctx.stroke();
        }
    }

    function generateRectangularMaze(difficulty) {
        const DIFFICULTY_LEVELS = { easy: 10, medium: 15, hard: 25 };
        const gridSize = DIFFICULTY_LEVELS[difficulty];
        let grid = [];
        for (let y = 0; y < gridSize; y++) {
            grid[y] = [];
            for (let x = 0; x < gridSize; x++) {
                 grid[y][x] = { x, y, walls: { top: true, right: true, bottom: true, left: true }, visited: false };
            }
        }
        let stack = [grid[0][0]];
        grid[0][0].visited = true;
        while (stack.length > 0) {
            let current = stack.pop();
            const neighbors = [grid[current.y-1]?.[current.x], grid[current.y]?.[current.x+1], grid[current.y+1]?.[current.x], grid[current.y]?.[current.x-1]].filter(n => n && !n.visited);
            if (neighbors.length > 0) {
                stack.push(current);
                let chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
                if (current.x - chosen.x === 1) { current.walls.left = false; chosen.walls.right = false; }
                else if (current.x - chosen.x === -1) { current.walls.right = false; chosen.walls.left = false; }
                if (current.y - chosen.y === 1) { current.walls.top = false; chosen.walls.bottom = false; }
                else if (current.y - chosen.y === -1) { current.walls.bottom = false; chosen.walls.top = false; }
                chosen.visited = true;
                stack.push(chosen);
            }
        }
        startCell = grid[0][0];
        endCell = grid[gridSize-1][gridSize-1];
        startCell.walls.top = false;
        endCell.walls.bottom = false;
        currentGrid = grid;
        drawAll();
    }

    function drawRectangularMaze() {
        if (!currentGrid.length) return;
        const gridSize = currentGrid.length;
        const cellSize = CANVAS_SIZE / gridSize;
        ctx.strokeStyle = MAZE_COLOR;
        ctx.lineWidth = WALL_THICKNESS;
        ctx.lineCap = "round";
        for (const row of currentGrid) {
            for (const cell of row) {
                const gx = cell.x * cellSize, gy = cell.y * cellSize;
                ctx.beginPath();
                if (cell.walls.top) { ctx.moveTo(gx, gy); ctx.lineTo(gx + cellSize, gy); }
                if (cell.walls.right) { ctx.moveTo(gx + cellSize, gy); ctx.lineTo(gx + cellSize, gy + cellSize); }
                if (cell.walls.bottom) { ctx.moveTo(gx, gy + cellSize); ctx.lineTo(gx + cellSize, gy + cellSize); }
                if (cell.walls.left) { ctx.moveTo(gx, gy + cellSize); ctx.lineTo(gx, gy); }
                ctx.stroke();
            }
        }
    }

    function generateMaskedMaze(difficulty) {
        const DIFFICULTY_LEVELS = { easy: 10, medium: 15, hard: 25 };
        const gridSize = DIFFICULTY_LEVELS[difficulty];
        let grid = [];
        activeCells = [];
        const radius = gridSize / 2;
        for (let y = 0; y < gridSize; y++) {
            grid[y] = [];
            for (let x = 0; x < gridSize; x++) {
                const cell = { x, y, walls: { top: true, right: true, bottom: true, left: true }, visited: false };
                grid[y][x] = cell;
                const dx = x - radius + 0.5;
                const dy = y - radius + 0.5;
                if (dx * dx + dy * dy < radius * radius) activeCells.push(cell);
            }
        }
        if(activeCells.length === 0) return;
        
        let stack = [activeCells[0]];
        activeCells[0].visited = true;
        while (stack.length > 0) {
            let current = stack.pop();
            const getNeighbors = (cell) => [ grid[cell.y-1]?.[cell.x], grid[cell.y]?.[cell.x+1], grid[cell.y+1]?.[cell.x], grid[cell.y]?.[cell.x-1] ].filter(p => p && !p.visited && activeCells.includes(p));
            const neighbors = getNeighbors(current);
            if (neighbors.length > 0) {
                stack.push(current);
                let chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
                if (current.x - chosen.x === 1) { current.walls.left = false; chosen.walls.right = false; }
                else if (current.x - chosen.x === -1) { current.walls.right = false; chosen.walls.left = false; }
                if (current.y - chosen.y === 1) { current.walls.top = false; chosen.walls.bottom = false; }
                else if (current.y - chosen.y === -1) { current.walls.bottom = false; chosen.walls.top = false; }
                chosen.visited = true;
                stack.push(chosen);
            }
        }

        const edgeCells = activeCells.filter(c => [ grid[c.y-1]?.[c.x], grid[c.y]?.[c.x+1], grid[c.y+1]?.[c.x], grid[c.y]?.[c.x-1] ].some(n => !n || !activeCells.includes(n)));
        if (edgeCells.length >= 2) {
            startCell = edgeCells[Math.floor(Math.random() * edgeCells.length)];
            // Vind de cel die het verst verwijderd is van de startcel
            endCell = edgeCells.reduce((a, b) => (Math.hypot(startCell.x - a.x, startCell.y - a.y) > Math.hypot(startCell.x - b.x, startCell.y - b.y) ? a : b));

            // Maak een opening bij de startcel
            // Zoek welke muur grenst aan een niet-actieve cel (buiten de cirkel)
            if (!activeCells.includes(grid[startCell.y-1]?.[startCell.x])) startCell.walls.top = false;
            else if (!activeCells.includes(grid[startCell.y]?.[startCell.x+1])) startCell.walls.right = false;
            else if (!activeCells.includes(grid[startCell.y+1]?.[startCell.x])) startCell.walls.bottom = false;
            else startCell.walls.left = false;
            
            // Maak een opening bij de eindcel
            if (!activeCells.includes(grid[endCell.y-1]?.[endCell.x])) endCell.walls.top = false;
            else if (!activeCells.includes(grid[endCell.y]?.[endCell.x+1])) endCell.walls.right = false;
            else if (!activeCells.includes(grid[endCell.y+1]?.[endCell.x])) endCell.walls.bottom = false;
            else endCell.walls.left = false;
        } else {
             solveBtn.disabled = true; // Kan niet opgelost worden als er geen start/eind is
        }

        currentGrid = grid;
        drawAll();
    }

    function drawMaskedMaze() {
        if (!currentGrid.length) return;
        const gridSize = currentGrid.length;
        const cellSize = CANVAS_SIZE / gridSize;
        ctx.strokeStyle = MAZE_COLOR;
        ctx.lineWidth = WALL_THICKNESS;
        ctx.lineCap = "round";
        for (const cell of activeCells) {
            const gx = cell.x * cellSize, gy = cell.y * cellSize;
            ctx.beginPath();
            if (cell.walls.top) { ctx.moveTo(gx, gy); ctx.lineTo(gx + cellSize, gy); }
            if (cell.walls.right) { ctx.moveTo(gx + cellSize, gy); ctx.lineTo(gx + cellSize, gy + cellSize); }
            if (cell.walls.bottom) { ctx.moveTo(gx, gy + cellSize); ctx.lineTo(gx + cellSize, gy + cellSize); }
            if (cell.walls.left) { ctx.moveTo(gx, gy + cellSize); ctx.lineTo(gx, gy); }
            ctx.stroke();
        }
    }

    // --- CIRKEL LOGICA (Van proefversie.html, aangepast) ---
    // difficultySettings is nu lokaal in deze functie gedefinieerd om flexibel te zijn.
    // De waardes zijn nu:
    // Easy (oud: very-easy): 6 levels, 18 cells, 25 levelHeight
    // Medium (oud: easy): 8 levels, 24 cells, 20 levelHeight
    // Hard (oud: medium): 12 levels, 32 cells, 15 levelHeight

    function generatePolarMaze(difficulty) {
        // Gebruik dezelfde difficulty levels als de andere mazes, maar aangepast voor polaire mazes
        const DIFFICULTY_LEVELS = {
            easy: { levels: 6, cellsPerLevel: 18, levelHeight: 25, donutHoleRings: 0 }, // Geen gat, makkelijker
            medium: { levels: 8, cellsPerLevel: 24, levelHeight: 20, donutHoleRings: 1 }, // Klein gat
            hard: { levels: 12, cellsPerLevel: 32, levelHeight: 15, donutHoleRings: 2 } // Groter gat, meer ringen
        };

        const settings = DIFFICULTY_LEVELS[difficulty];
        const numLevels = settings.levels;
        const cellsPerOuterRing = settings.cellsPerLevel; // Dit is voor de buitenste ring
        const levelHeight = settings.levelHeight;
        const donutHoleRings = settings.donutHoleRings; // Aantal ringen die als 'gat' dienen
        
        let grid = []; // Dit wordt een array van ringen
        
        // Bereken dynamisch cellsPerRing voor elke ring, zodat ze niet te dun/dik worden
        // De 'cellsPerLevel' in settings is nu de base voor de buitenste ring
        const maxRadius = (donutHoleRings + numLevels) * levelHeight;
        const baseAngleStep = 2 * Math.PI / cellsPerOuterRing; // De hoekstap van de buitenste ring

        for (let i = 0; i < numLevels; i++) {
            const currentRingIndex = i + donutHoleRings; // De echte ring index, beginnend bij 0 voor het doolhof
            const radiusForCells = (currentRingIndex + 0.5) * levelHeight; // Radius om cellen te berekenen
            const circumference = 2 * Math.PI * radiusForCells;
            // Pas het aantal cellen aan zodat de breedte ongeveer consistent blijft.
            // Dit is een heuristiek; fijnafstemming kan nodig zijn.
            const cellsInThisRing = Math.max(1, Math.round(circumference / (levelHeight * 1.5))); // Minimaal 1 cel per ring

            const ring = [];
            for (let j = 0; j < cellsInThisRing; j++) {
                // `row` en `col` zijn abstracte indices binnen de logische grid
                ring.push({ row: i, col: j, walls: { top: true, right: true }, visited: false });
            }
            grid.push(ring);
        }

        if (grid.length === 0 || grid[0].length === 0) {
            solveBtn.disabled = true;
            return;
        }

        // Startcel: Willekeurige cel in de buitenste ring (laatste index van grid)
        startCell = grid[grid.length - 1][Math.floor(Math.random() * grid[grid.length - 1].length)];
        
        let stack = [startCell];
        startCell.visited = true;

        while (stack.length > 0) {
            let current = stack[stack.length - 1]; // Pop() gebeurt later, zodat we current kunnen behouden
            const neighbors = getPolarNeighborsForGeneration(current, grid, donutHoleRings);
            
            if (neighbors.length > 0) {
                const [nLevel, nCellObj] = neighbors[Math.floor(Math.random() * neighbors.length)];
                removePolarWall(current, nCellObj, grid); // Pas de muur aan in de grid
                grid[nLevel][nCellObj.col].visited = true; // Markeer de buur als bezocht
                stack.push(grid[nLevel][nCellObj.col]); // Voeg de bezochte buur toe aan de stack
            } else {
                stack.pop(); // Geen onbezochte buren, ga terug
            }
        }

        // Garandeer een uitgang naar het midden vanuit de binnenste ring (grid[0])
        const exitCellIndex = Math.floor(Math.random() * grid[0].length);
        grid[0][exitCellIndex].walls.top = false; // Verwijder de "top" muur van de cel in de binnenste ring
        endCell = grid[0][exitCellIndex]; // Dit is de cel die naar het midden leidt
        
        // Verwijder de muur aan de buitenkant van de startcel
        // De 'top' muur van de buitenste ring is de muur die het dichtst bij het centrum is van die cel.
        // We moeten de 'outward' muur van de startcel openen (d.w.z. de 'bottom' muur in polaire zin).
        // In proefversie was dit een muur die naar buiten leidde, dus `startCell.walls.outward = false`
        // De 'top' muur in onze `walls` object betekent de muur die de cel aan de binnenkant afsluit (lagere radius).
        // De 'right' muur is de radiale muur met de klok mee.
        // Als startCell in de buitenste ring is (grid.length - 1), dan heeft hij geen 'bottom' (outward) muur.
        // Dus we openen de 'top' muur van de startcel (die naar de binnenring leidt)
        // Of, we moeten de `drawMaze` functie aanpassen om een opening in de buitenste cirkel te tekenen.
        // Laten we de `drawMaze` aanpassen voor de ingang, en `endCell.walls.top = false` voor de uitgang.

        currentGrid = {type: 'polar', rings: grid, donutHoleRings: donutHoleRings, numLevels: numLevels, levelHeight: levelHeight};
        drawAll();
    }
    
    // NIEUWE HULPFUNCTIE VOOR POLAIRE BUREN (voor doolhofgeneratie)
    function getPolarNeighborsForGeneration(cell, grid, donutHoleRings) {
        const neighbors = [];
        const { row, col } = cell;
        const currentRing = grid[row]; // grid[row] is de ring zelf
        const numRings = grid.length;

        // Buur tegen de klok in (previous column)
        const ccwCellCol = (col - 1 + currentRing.length) % currentRing.length;
        if (!currentRing[ccwCellCol].visited) {
            neighbors.push([row, currentRing[ccwCellCol]]);
        }

        // Buur met de klok mee (next column)
        const cwCellCol = (col + 1) % currentRing.length;
        if (!currentRing[cwCellCol].visited) {
            neighbors.push([row, currentRing[cwCellCol]]);
        }

        // Buur naar binnen (vorige ring)
        if (row > 0) { // Als het niet de binnenste doolhofring is
            const prevRing = grid[row - 1];
            // Schat de corresponderende kolom in de vorige ring
            const inwardCol = Math.floor(col * (prevRing.length / currentRing.length));
            if (inwardCol >= 0 && inwardCol < prevRing.length && !prevRing[inwardCol].visited) {
                neighbors.push([row - 1, prevRing[inwardCol]]);
            }
        }

        // Buur naar buiten (volgende ring)
        if (row < numRings - 1) { // Als het niet de buitenste doolhofring is
            const nextRing = grid[row + 1];
            // Schat de corresponderende kolom in de volgende ring
            const outwardCol = Math.floor(col * (nextRing.length / currentRing.length));
            if (outwardCol >= 0 && outwardCol < nextRing.length && !nextRing[outwardCol].visited) {
                neighbors.push([row + 1, nextRing[outwardCol]]);
            }
        }
        return neighbors;
    }
    
    // NIEUWE HULPFUNCTIE VOOR MUURVERWIJDERING (voor polair doolhof)
    function removePolarWall(cell1, cell2Obj, grid) {
        const cell2 = cell2Obj; // cell2Obj is de volledige cel object
        
        // Radial movement (between rings)
        if (cell1.row !== cell2.row) {
            // Determine which cell is "outward" (higher row index)
            const outerCell = cell1.row > cell2.row ? cell1 : cell2;
            // The wall that connects to the inner ring is the 'top' wall in our convention
            outerCell.walls.top = false; 
        } 
        // Tangential movement (within same ring)
        else {
            // Determine which cell is "clockwise" relative to the other
            const ringLength = grid[cell1.row].length;
            if ((cell1.col + 1) % ringLength === cell2.col) { // cell2 is clockwise of cell1
                cell1.walls.right = false;
            } else { // cell1 is clockwise of cell2 (or wrap around other way)
                cell2.walls.right = false;
            }
        }
    }


    // ** AANGEPASTE TEKENFUNCTIE VOOR CIRKEL (van proefversie.html, verfijnd) **
    function drawPolarMaze() {
        if(!currentGrid.rings || currentGrid.rings.length === 0) return;
        const {rings, donutHoleRings, numLevels, levelHeight} = currentGrid;
        const centerX = CANVAS_SIZE / 2, centerY = CANVAS_SIZE / 2;

        ctx.strokeStyle = MAZE_COLOR;
        ctx.lineWidth = WALL_THICKNESS;
        ctx.lineCap = "round";
        
        // Teken de binnenste "donut hole" cirkel als die bestaat
        if (donutHoleRings > 0) {
            const donutRadius = donutHoleRings * levelHeight;
            ctx.beginPath();
            ctx.arc(centerX, centerY, donutRadius, 0, 2 * Math.PI);
            ctx.stroke();
        }

        // Teken de muren van de doolhof cellen
        for (let i = 0; i < rings.length; i++) {
            const ring = rings[i];
            const currentLogicalRing = i; // 0-indexed logische ring
            
            // De fysieke radius in de canvas, inclusief het donut gat
            const innerRadius = (currentLogicalRing + donutHoleRings) * levelHeight; 
            const outerRadius = (currentLogicalRing + 1 + donutHoleRings) * levelHeight;

            for (let j = 0; j < ring.length; j++) {
                const cell = ring[j];
                const anglePerCell = 2 * Math.PI / ring.length;
                const angleStart = j * anglePerCell;
                const angleEnd = (j + 1) * anglePerCell;

                // Teken circulaire muren (top walls in onze conventie)
                // Dit zijn de muren aan de 'binnenkant' van de cel, dichter bij het centrum
                if (cell.walls.top) {
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, innerRadius, angleStart, angleEnd);
                    ctx.stroke();
                }
                
                // Teken radiale muren (right walls in onze conventie)
                // Dit zijn de muren die de cellen in de ring van elkaar scheiden
                if (cell.walls.right) {
                    ctx.beginPath();
                    ctx.moveTo(centerX + innerRadius * Math.cos(angleEnd), centerY + innerRadius * Math.sin(angleEnd));
                    ctx.lineTo(centerX + outerRadius * Math.cos(angleEnd), centerY + outerRadius * Math.sin(angleEnd));
                    ctx.stroke();
                }
            }
        }

        // Teken de buitenste rand van het doolhof, maar creëer een opening bij de startcel
        const outermostRadius = (numLevels + donutHoleRings) * levelHeight;
        
        // Zoek de daadwerkelijke startcel in de structuur voor tekening
        // Omdat startCell direct een referentie is, moeten we de row en col gebruiken
        const startRingActual = rings[startCell.row]; // De ring waar startCell zich bevindt
        const anglePerCellStart = 2 * Math.PI / startRingActual.length;
        const entranceAngleStart = startCell.col * anglePerCellStart;
        const entranceAngleEnd = (startCell.col + 1) * anglePerCellStart;

        ctx.beginPath();
        // Teken het deel van de buitenste cirkel VÓÓR de ingang
        ctx.arc(centerX, centerY, outermostRadius, entranceAngleEnd, 2 * Math.PI);
        ctx.stroke();

        ctx.beginPath();
        // Teken het deel van de buitenste cirkel NÁ de ingang
        ctx.arc(centerX, centerY, outermostRadius, 0, entranceAngleStart);
        ctx.stroke();
    }
    
    // --- OPLOSSING LOGICA ---
    // Deze functies zijn grotendeels intact, maar getPolarNeighbors is aangepast voor de oplossing.

    function solveAndShowSolution() {
        solveMaze();
        drawSolution();
        solveBtn.classList.add('hidden');
        hideBtn.classList.remove('hidden');
    }

    function hideSolution() {
        solutionPath = [];
        drawAll();
        hideBtn.classList.add('hidden');
        solveBtn.classList.remove('hidden');
    }

    function solveMaze() {
        let queue = [{ cell: startCell, path: [startCell] }];
        let visited = new Set();
        // Voeg de startcel toe aan visited, afhankelijk van hoe de cellen vergeleken worden (objectreferentie of unieke ID)
        if (currentGrid.type === 'polar') {
             visited.add(`${startCell.row}-${startCell.col}`);
        } else {
            visited.add(startCell);
        }
       

        while (queue.length > 0) {
            let { cell, path } = queue.shift();

            if (cell === endCell) { // Check voor de eindcel zelf
                solutionPath = path;
                return;
            }
            
            let neighbors;
            if(currentGrid.type === 'polar') {
                neighbors = getPolarNeighborsForSolution(cell, currentGrid.rings, currentGrid.donutHoleRings);
            } else {
                neighbors = getGridNeighbors(cell, currentGrid);
            }

            for (let neighbor of neighbors) {
                // Gebruik een string representatie voor polar cellen in de visited set
                const neighborId = currentGrid.type === 'polar' ? `${neighbor.row}-${neighbor.col}` : neighbor;

                if (!visited.has(neighborId)) {
                    visited.add(neighborId);
                    let newPath = [...path, neighbor];
                    queue.push({ cell: neighbor, path: newPath });
                }
            }
        }
    }

    // Bestaande functie voor grid-gebaseerde doolhoven
    function getGridNeighbors(cell, grid) {
        const neighbors = [];
        const {x, y} = cell;
        // Check of de muur open is EN de buurcel bestaat
        if (!cell.walls.top && y > 0 && grid[y - 1] && grid[y - 1][x]) neighbors.push(grid[y - 1][x]);
        if (!cell.walls.right && x < grid[0].length - 1 && grid[y] && grid[y][x + 1]) neighbors.push(grid[y][x + 1]);
        if (!cell.walls.bottom && y < grid.length - 1 && grid[y + 1] && grid[y + 1][x]) neighbors.push(grid[y + 1][x]);
        if (!cell.walls.left && x > 0 && grid[y] && grid[y][x - 1]) neighbors.push(grid[y][x - 1]);
        return neighbors;
    }
    
    // NIEUWE HULPFUNCTIE VOOR POLAIRE BUREN (voor oplossing zoeken)
    function getPolarNeighborsForSolution(cell, rings, donutHoleRings) {
        const neighbors = [];
        const { row, col } = cell;
        const currentRingLogicalIndex = row; // Dit is de 0-gebaseerde index in de 'rings' array
        const currentRing = rings[currentRingLogicalIndex];
        if (!currentRing) return [];

        // Buur tegen de klok in (previous column)
        const ccwCellCol = (col - 1 + currentRing.length) % currentRing.length;
        if (!rings[currentRingLogicalIndex][ccwCellCol].walls.right) { // Als de muur RECHTS van de buurcel open is
            neighbors.push(rings[currentRingLogicalIndex][ccwCellCol]);
        }

        // Buur met de klok mee (next column)
        // Check de 'right' muur van de huidige cel
        if (!cell.walls.right) {
            const cwCellCol = (col + 1) % currentRing.length;
            neighbors.push(rings[currentRingLogicalIndex][cwCellCol]);
        }

        // Buur naar binnen (vorige ring)
        if (currentRingLogicalIndex > 0) { // Als het niet de binnenste doolhofring is
            const prevRingLogicalIndex = currentRingLogicalIndex - 1;
            const prevRing = rings[prevRingLogicalIndex];
            if (prevRing) {
                // Schat de corresponderende kolom in de vorige ring
                const inwardCol = Math.floor(col * (prevRing.length / currentRing.length));
                // Controleer of de 'top' muur van de HUIDIGE cel open is
                if (!cell.walls.top) {
                    neighbors.push(prevRing[inwardCol]);
                }
            }
        } else { // Special case: als het de binnenste ring is en de 'top' muur open is
            if (!cell.walls.top) {
                // Dit betekent dat deze cel toegang heeft tot het midden van de donut.
                // We behandelen dit als de eindcel in de solveMaze functie.
                // Er is hier geen daadwerkelijke "buurcel", maar het pad is open.
            }
        }


        // Buur naar buiten (volgende ring)
        if (currentRingLogicalIndex < rings.length - 1) { // Als het niet de buitenste doolhofring is
            const nextRingLogicalIndex = currentRingLogicalIndex + 1;
            const nextRing = rings[nextRingLogicalIndex];
            if (nextRing) {
                // Schat de corresponderende kolom in de volgende ring
                const outwardCol = Math.floor(col * (nextRing.length / currentRing.length));
                // Controleer of de 'top' muur van de BUURCEL open is
                if (nextRing[outwardCol] && !nextRing[outwardCol].walls.top) {
                    neighbors.push(nextRing[outwardCol]);
                }
            }
        } else { // Special case: als het de buitenste ring is, en de buitenste muur is de startcel
            // Hier hoeven we niets te doen, want de startcel is al gedefinieerd en de "muur" is de ingang.
        }

        return neighbors;
    }

    function drawSolution() {
        if (solutionPath.length < 2) return;

        ctx.strokeStyle = SOLUTION_COLOR;
        ctx.lineWidth = WALL_THICKNESS * 2;
        ctx.lineCap = "round";
        ctx.beginPath();
        
        if(currentGrid.type === 'polar') {
            const { rings, donutHoleRings, numLevels, levelHeight } = currentGrid;
            const centerX = CANVAS_SIZE / 2, centerY = CANVAS_SIZE / 2;

            for(let i=0; i<solutionPath.length; i++) {
                const cell = solutionPath[i];
                if(!cell || cell.row === undefined) continue;

                const ringData = rings[cell.row]; // Gebruik de logische rij-index
                if (!ringData) continue;

                const anglePerCell = 2 * Math.PI / ringData.length;
                // Gebruik de centrale radius van de cel voor de oplossinglijn
                const radius = (cell.row + donutHoleRings + 0.5) * levelHeight; // Fysieke radius
                const angle = (cell.col + 0.5) * anglePerCell; // Hoek in het midden van de cel
                
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x,y);
            }

            // Speciale lijn van de laatste cel naar het absolute midden als het de uitgangscel is
            if (endCell.walls.top === false && solutionPath[solutionPath.length - 1] === endCell) {
                const lastCell = solutionPath[solutionPath.length - 1];
                const lastRingData = rings[lastCell.row];
                const anglePerCellLast = 2 * Math.PI / lastRingData.length;
                const radiusLast = (lastCell.row + donutHoleRings + 0.5) * levelHeight;
                const angleLast = (lastCell.col + 0.5) * anglePerCellLast;
                
                // Midden van de laatste cel
                const xLast = centerX + radiusLast * Math.cos(angleLast);
                const yLast = centerY + radiusLast * Math.sin(angleLast);

                ctx.moveTo(xLast, yLast);
                ctx.lineTo(centerX, centerY); // Lijn naar het absolute midden
            }


        } else { // Voor grid-gebaseerde doolhoven
            const gridSize = currentGrid.length;
            const cellSize = CANVAS_SIZE / gridSize;
            const getCenter = (cell) => ({ x: (cell.x + 0.5) * cellSize, y: (cell.y + 0.5) * cellSize });

            let firstPoint = getCenter(solutionPath[0]);
            ctx.moveTo(firstPoint.x, firstPoint.y);

            for (let i = 1; i < solutionPath.length; i++) {
                let nextPoint = getCenter(solutionPath[i]);
                ctx.lineTo(nextPoint.x, nextPoint.y);
            }
        }
        ctx.stroke();
    }


    // --- HELPERS & INTERACTIVITEIT ---
    
    function handleEraser(event) {
        // Eraser werkt alleen voor 'worksheet' doolhof
        if (currentShape !== 'worksheet' || !currentGrid.length || !Array.isArray(currentGrid)) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const gridSize = currentGrid.length;
        const cellSize = CANVAS_SIZE / gridSize;
        const x = Math.floor(mouseX / cellSize);
        const y = Math.floor(mouseY / cellSize);
        if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;
        
        // Voorkom het verwijderen van de start- en eindopeningen in worksheet maze
        if(currentGrid[y][x] === startCell && x === startCell.x && y === startCell.y) return;
        if(currentGrid[y][x] === endCell && x === endCell.x && y === endCell.y) return;

        const dx = mouseX - x * cellSize, dy = mouseY - y * cellSize;
        const tolerance = WALL_THICKNESS * 3; // Vergroot tolerantie voor klikgebied
        const cell = currentGrid[y][x];
        const dists = { 
            top: dy, 
            right: cellSize - dx, 
            bottom: cellSize - dy, 
            left: dx 
        };
        const closestWall = Object.keys(dists).reduce((a, b) => dists[a] < dists[b] ? a : b);
        
        if (dists[closestWall] > tolerance) return; // Klik te ver van een muur

        // Verwijder de muur aan beide kanten
        if (closestWall === 'top' && y > 0) { cell.walls.top = false; currentGrid[y - 1][x].walls.bottom = false; }
        else if (closestWall === 'right' && x < gridSize - 1) { cell.walls.right = false; currentGrid[y][x + 1].walls.left = false; }
        else if (closestWall === 'bottom' && y < gridSize - 1) { cell.walls.bottom = false; currentGrid[y + 1][x].walls.top = false; }
        else if (closestWall === 'left' && x > 0) { cell.walls.left = false; currentGrid[y][x - 1].walls.right = false; }
        
        drawAll(); // Teken opnieuw na muurverwijdering
    }

    function downloadPDF() {
        const currentSolution = [...solutionPath]; // Sla huidige oplossing op
        solutionPath = []; // Verberg oplossing voor PDF generatie
        drawAll(); // Teken doolhof zonder oplossing

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        doc.setFontSize(22);
        doc.text('Mijn Doolhof Werkblad', 105, 20, { align: 'center' });
        const imageData = canvas.toDataURL('image/png');
        const imgWidth = 180;
        const xPos = (210 - imgWidth) / 2;
        doc.addImage(imageData, 'PNG', xPos, 35, imgWidth, imgWidth);
        doc.save('doolhof-werkblad.pdf');
        
        solutionPath = currentSolution; // Herstel oplossing
        drawAll(); // Teken doolhof met oplossing (indien eerder getoond)
    }
    
    function downloadPNG() {
        const link = document.createElement('a');
        link.download = 'doolhof.png';
        link.href = canvas.toDataURL("image/png");
        link.click();
    }

    initialize();
});
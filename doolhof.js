document.addEventListener('DOMContentLoaded', () => {

    const CANVAS_SIZE = 500;
    let wallThickness = 2; // WIJZIGING: Veranderd van const naar let
    const MAZE_COLOR = "#333";
    const SOLUTION_COLOR = "#007bff";
    const MAZE_PADDING = 20;

    const canvas = document.getElementById('mazeCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    
    const instructieText = document.getElementById('instructieText');
    const solveBtn = document.getElementById('solveMazeBtn');
    const hideBtn = document.getElementById('hideSolutionBtn');
    
    // WIJZIGING: Nieuwe elementen ophalen
    const thicknessSlider = document.getElementById('thicknessSlider');
    const thicknessValue = document.getElementById('thicknessValue');

    let currentGrid = [];
    let activeCells = [];
    let startCell, endCell;
    let solutionPath = [];
    let currentShape = 'worksheet';
    
    const shapes = [
        { id: 'worksheet', name: 'Uitsparing', file: 'uitsparing.png' },
        { id: 'rectangle', name: 'Rechthoek', file: 'rechthoek.png' },
        { id: 'masked_circle', name: 'Vorm', file: 'vorm.png' },
        { id: 'polar_circle', name: 'Cirkel', file: 'cirkel.png' }
    ];

    function initialize() {
        setupShapePicker();
        addEventListeners();
        
        // WIJZIGING: Initialiseer slider waarde
        thicknessSlider.value = wallThickness;
        thicknessValue.textContent = wallThickness;
        
        generateAndDrawMaze();
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
        
        canvas.addEventListener('click', handleEraser);
        
        solveBtn.addEventListener('click', solveAndShowSolution);
        hideBtn.addEventListener('click', hideSolution);

        // WIJZIGING: Event listener voor de slider toevoegen
        thicknessSlider.addEventListener('input', () => {
            wallThickness = parseInt(thicknessSlider.value, 10);
            thicknessValue.textContent = wallThickness;
            drawAll(); // Herteken het doolhof met de nieuwe dikte
        });
    }
    
    function generateAndDrawMaze() {
        const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
        solutionPath = []; 
        hideSolution(); 
        activeCells = [];

        instructieText.textContent = "Kies een vorm en moeilijkheid.";
        solveBtn.disabled = false;
        canvas.style.cursor = 'default';

        if (currentShape === 'worksheet') {
            generateWorksheetMaze(difficulty);
            canvas.style.cursor = 'crosshair';
        ;
        } else if (currentShape === 'rectangle') {
            generateRectangularMaze(difficulty);
        } else if (currentShape === 'masked_circle') {
            generateMaskedMaze(difficulty);
        } else if (currentShape === 'polar_circle') {
            generatePolarMaze(difficulty);
        }
    }
    
    function drawAll() {
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        
        if (currentShape === 'worksheet') { drawWorksheetMaze(); }
        else if (currentShape === 'rectangle') { drawRectangularMaze(); }
        else if (currentShape === 'masked_circle') { drawMaskedMaze(); }
        else if (currentShape === 'polar_circle') { drawPolarMaze(); }
        
        if (solutionPath.length > 0) {
            drawSolution();
        }
    }

    // --- DOOLHOF LOGICA ---

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
        const availableSize = CANVAS_SIZE - 2 * MAZE_PADDING;
        const cellSize = availableSize / gridSize;
        
        ctx.strokeStyle = MAZE_COLOR;
        ctx.lineWidth = wallThickness; // WIJZIGING
        ctx.lineCap = "round";
        for (const cell of activeCells) {
            const gx = MAZE_PADDING + cell.x * cellSize;
            const gy = MAZE_PADDING + cell.y * cellSize;
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
        const availableSize = CANVAS_SIZE - 2 * MAZE_PADDING;
        const cellSize = availableSize / gridSize;
        
        ctx.strokeStyle = MAZE_COLOR;
        ctx.lineWidth = wallThickness; // WIJZIGING
        ctx.lineCap = "round";
        for (const row of currentGrid) {
            for (const cell of row) {
                const gx = MAZE_PADDING + cell.x * cellSize;
                const gy = MAZE_PADDING + cell.y * cellSize;
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
            endCell = edgeCells.reduce((a, b) => (Math.hypot(startCell.x - a.x, startCell.y - a.y) > Math.hypot(startCell.x - b.x, startCell.y - b.y) ? a : b));

            if (!activeCells.includes(grid[startCell.y-1]?.[startCell.x])) startCell.walls.top = false;
            else if (!activeCells.includes(grid[startCell.y]?.[startCell.x+1])) startCell.walls.right = false;
            else if (!activeCells.includes(grid[startCell.y+1]?.[startCell.x])) startCell.walls.bottom = false;
            else startCell.walls.left = false;
            
            if (!activeCells.includes(grid[endCell.y-1]?.[endCell.x])) endCell.walls.top = false;
            else if (!activeCells.includes(grid[endCell.y]?.[endCell.x+1])) endCell.walls.right = false;
            else if (!activeCells.includes(grid[endCell.y+1]?.[endCell.x])) endCell.walls.bottom = false;
            else endCell.walls.left = false;
        } else {
             solveBtn.disabled = true;
        }

        currentGrid = grid;
        drawAll();
    }

    function drawMaskedMaze() {
        if (!currentGrid.length) return;
        const gridSize = currentGrid.length;
        const availableSize = CANVAS_SIZE - 2 * MAZE_PADDING;
        const cellSize = availableSize / gridSize;
        
        ctx.strokeStyle = MAZE_COLOR;
        ctx.lineWidth = wallThickness; // WIJZIGING
        ctx.lineCap = "round";
        for (const cell of activeCells) {
            const gx = MAZE_PADDING + cell.x * cellSize;
            const gy = MAZE_PADDING + cell.y * cellSize;
            ctx.beginPath();
            if (cell.walls.top) { ctx.moveTo(gx, gy); ctx.lineTo(gx + cellSize, gy); }
            if (cell.walls.right) { ctx.moveTo(gx + cellSize, gy); ctx.lineTo(gx + cellSize, gy + cellSize); }
            if (cell.walls.bottom) { ctx.moveTo(gx, gy + cellSize); ctx.lineTo(gx + cellSize, gy + cellSize); }
            if (cell.walls.left) { ctx.moveTo(gx, gy + cellSize); ctx.lineTo(gx, gy); }
            ctx.stroke();
        }
    }

    // --- CIRKEL LOGICA ---
    function generatePolarMaze(difficulty) {
        const DIFFICULTY_LEVELS = {
            easy: { levels: 6, cellsPerLevel: 18, levelHeight: 25, donutHoleRings: 0 },
            medium: { levels: 8, cellsPerLevel: 24, levelHeight: 20, donutHoleRings: 1 },
            hard: { levels: 12, cellsPerLevel: 32, levelHeight: 15, donutHoleRings: 2 }
        };

        const settings = DIFFICULTY_LEVELS[difficulty];
        const numLevels = settings.levels;
        const cellsPerOuterRing = settings.cellsPerLevel;
        const levelHeight = settings.levelHeight;
        const donutHoleRings = settings.donutHoleRings;
        
        let grid = [];
        
        const maxRadius = (donutHoleRings + numLevels) * levelHeight;
        const baseAngleStep = 2 * Math.PI / cellsPerOuterRing;

        for (let i = 0; i < numLevels; i++) {
            const currentRingIndex = i + donutHoleRings;
            const radiusForCells = (currentRingIndex + 0.5) * levelHeight;
            const circumference = 2 * Math.PI * radiusForCells;
            const cellsInThisRing = Math.max(1, Math.round(circumference / (levelHeight * 1.5)));

            const ring = [];
            for (let j = 0; j < cellsInThisRing; j++) {
                ring.push({ row: i, col: j, walls: { top: true, right: true }, visited: false });
            }
            grid.push(ring);
        }

        if (grid.length === 0 || grid[0].length === 0) {
            solveBtn.disabled = true;
            return;
        }

        startCell = grid[grid.length - 1][Math.floor(Math.random() * grid[grid.length - 1].length)];
        
        let stack = [startCell];
        startCell.visited = true;

        while (stack.length > 0) {
            let current = stack[stack.length - 1];
            const neighbors = getPolarNeighborsForGeneration(current, grid, donutHoleRings);
            
            if (neighbors.length > 0) {
                const [nLevel, nCellObj] = neighbors[Math.floor(Math.random() * neighbors.length)];
                removePolarWall(current, nCellObj, grid);
                grid[nLevel][nCellObj.col].visited = true;
                stack.push(grid[nLevel][nCellObj.col]);
            } else {
                stack.pop();
            }
        }

        const exitCellIndex = Math.floor(Math.random() * grid[0].length);
        grid[0][exitCellIndex].walls.top = false;
        endCell = grid[0][exitCellIndex];
        
        currentGrid = {type: 'polar', rings: grid, donutHoleRings: donutHoleRings, numLevels: numLevels, levelHeight: levelHeight};
        drawAll();
    }
    
    function drawPolarMaze() {
        if(!currentGrid.rings || currentGrid.rings.length === 0) return;
        const {rings, donutHoleRings, numLevels, levelHeight} = currentGrid;
        
        const currentCanvasSize = CANVAS_SIZE; 
        const effectiveCenter = currentCanvasSize / 2;
        const scaleFactor = (currentCanvasSize - 2 * MAZE_PADDING) / currentCanvasSize;
        
        ctx.strokeStyle = MAZE_COLOR;
        ctx.lineWidth = wallThickness; // WIJZIGING
        ctx.lineCap = "round";
        
        if (donutHoleRings > 0) {
            const donutRadius = donutHoleRings * levelHeight * scaleFactor;
            ctx.beginPath();
            ctx.arc(effectiveCenter, effectiveCenter, donutRadius, 0, 2 * Math.PI);
            ctx.stroke();
        }

        for (let i = 0; i < rings.length; i++) {
            const ring = rings[i];
            const currentLogicalRing = i; 
            
            const innerRadius = (currentLogicalRing + donutHoleRings) * levelHeight * scaleFactor;
            const outerRadius = (currentLogicalRing + 1 + donutHoleRings) * levelHeight * scaleFactor;

            for (let j = 0; j < ring.length; j++) {
                const cell = ring[j];
                const anglePerCell = 2 * Math.PI / ring.length;
                const angleStart = j * anglePerCell;
                const angleEnd = (j + 1) * anglePerCell;

                if (cell.walls.top) {
                    ctx.beginPath();
                    ctx.arc(effectiveCenter, effectiveCenter, innerRadius, angleStart, angleEnd);
                    ctx.stroke();
                }
                
                if (cell.walls.right) {
                    ctx.beginPath();
                    ctx.moveTo(effectiveCenter + innerRadius * Math.cos(angleEnd), effectiveCenter + innerRadius * Math.sin(angleEnd));
                    ctx.lineTo(effectiveCenter + outerRadius * Math.cos(angleEnd), effectiveCenter + outerRadius * Math.sin(angleEnd));
                    ctx.stroke();
                }
            }
        }

        const outermostRadius = (numLevels + donutHoleRings) * levelHeight * scaleFactor;
        
        const startRingActual = rings[startCell.row];
        const anglePerCellStart = 2 * Math.PI / startRingActual.length;
        const entranceAngleStart = startCell.col * anglePerCellStart;
        const entranceAngleEnd = (startCell.col + 1) * anglePerCellStart;

        ctx.beginPath();
        ctx.arc(effectiveCenter, effectiveCenter, outermostRadius, entranceAngleEnd, 2 * Math.PI);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(effectiveCenter, effectiveCenter, outermostRadius, 0, entranceAngleStart);
        ctx.stroke();
    }

    function getPolarNeighborsForGeneration(cell, grid, donutHoleRings) {
        const neighbors = [];
        const { row, col } = cell;
        const currentRing = grid[row];
        const numRings = grid.length;

        const ccwCellCol = (col - 1 + currentRing.length) % currentRing.length;
        if (!currentRing[ccwCellCol].visited) {
            neighbors.push([row, currentRing[ccwCellCol]]);
        }

        const cwCellCol = (col + 1) % currentRing.length;
        if (!currentRing[cwCellCol].visited) {
            neighbors.push([row, currentRing[cwCellCol]]);
        }

        if (row > 0) {
            const prevRing = grid[row - 1];
            const inwardCol = Math.floor(col * (prevRing.length / currentRing.length));
            if (inwardCol >= 0 && inwardCol < prevRing.length && !prevRing[inwardCol].visited) {
                neighbors.push([row - 1, prevRing[inwardCol]]);
            }
        }

        if (row < numRings - 1) {
            const nextRing = grid[row + 1];
            const outwardCol = Math.floor(col * (nextRing.length / currentRing.length));
            if (outwardCol >= 0 && outwardCol < nextRing.length && !nextRing[outwardCol].visited) {
                neighbors.push([row + 1, nextRing[outwardCol]]);
            }
        }
        return neighbors;
    }
    
    function removePolarWall(cell1, cell2Obj, grid) {
        const cell2 = cell2Obj;
        
        if (cell1.row !== cell2.row) {
            const outerCell = cell1.row > cell2.row ? cell1 : cell2;
            outerCell.walls.top = false; 
        } 
        else {
            const ringLength = grid[cell1.row].length;
            if ((cell1.col + 1) % ringLength === cell2.col) {
                cell1.walls.right = false;
            } else {
                cell2.walls.right = false;
            }
        }
    }

    // --- OPLOSSING LOGICA ---

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
        
        if (currentGrid.type === 'polar') {
             visited.add(`${startCell.row}-${startCell.col}`);
        } else {
            visited.add(startCell);
        }
       
        while (queue.length > 0) {
            let { cell, path } = queue.shift();

            if (cell === endCell) {
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
                const neighborId = currentGrid.type === 'polar' ? `${neighbor.row}-${neighbor.col}` : neighbor;

                if (!visited.has(neighborId)) {
                    visited.add(neighborId);
                    let newPath = [...path, neighbor];
                    queue.push({ cell: neighbor, path: newPath });
                }
            }
        }
    }

    function getGridNeighbors(cell, grid) {
        const neighbors = [];
        const {x, y} = cell;
        if (!cell.walls.top && y > 0 && grid[y - 1] && grid[y - 1][x]) neighbors.push(grid[y - 1][x]);
        if (!cell.walls.right && x < grid[0].length - 1 && grid[y] && grid[y][x + 1]) neighbors.push(grid[y][x + 1]);
        if (!cell.walls.bottom && y < grid.length - 1 && grid[y + 1] && grid[y + 1][x]) neighbors.push(grid[y + 1][x]);
        if (!cell.walls.left && x > 0 && grid[y] && grid[y][x - 1]) neighbors.push(grid[y][x - 1]);
        return neighbors;
    }
    
    function getPolarNeighborsForSolution(cell, rings, donutHoleRings) {
        const neighbors = [];
        const { row, col } = cell;
        const currentRingLogicalIndex = row;
        const currentRing = rings[currentRingLogicalIndex];
        if (!currentRing) return [];

        const ccwCellCol = (col - 1 + currentRing.length) % currentRing.length;
        if (!rings[currentRingLogicalIndex][ccwCellCol].walls.right) {
            neighbors.push(rings[currentRingLogicalIndex][ccwCellCol]);
        }

        if (!cell.walls.right) {
            const cwCellCol = (col + 1) % currentRing.length;
            neighbors.push(rings[currentRingLogicalIndex][cwCellCol]);
        }

        if (currentRingLogicalIndex > 0) {
            const prevRingLogicalIndex = currentRingLogicalIndex - 1;
            const prevRing = rings[prevRingLogicalIndex];
            if (prevRing) {
                const inwardCol = Math.floor(col * (prevRing.length / currentRing.length));
                if (!cell.walls.top) {
                    neighbors.push(prevRing[inwardCol]);
                }
            }
        }

        if (currentRingLogicalIndex < rings.length - 1) {
            const nextRingLogicalIndex = currentRingLogicalIndex + 1;
            const nextRing = rings[nextRingLogicalIndex];
            if (nextRing) {
                const outwardCol = Math.floor(col * (nextRing.length / currentRing.length));
                if (nextRing[outwardCol] && !nextRing[outwardCol].walls.top) {
                    neighbors.push(nextRing[outwardCol]);
                }
            }
        }
        return neighbors;
    }

    function drawSolution() {
        if (solutionPath.length < 2) return;

        ctx.strokeStyle = SOLUTION_COLOR;
        ctx.lineWidth = wallThickness * 2; // WIJZIGING: Ook de oplossing schaalt mee
        ctx.lineCap = "round";
        ctx.beginPath();
        
        if(currentGrid.type === 'polar') {
            const { rings, donutHoleRings, numLevels, levelHeight } = currentGrid;
            const effectiveCenter = CANVAS_SIZE / 2;
            const scaleFactor = (CANVAS_SIZE - 2 * MAZE_PADDING) / CANVAS_SIZE;

            for(let i=0; i<solutionPath.length; i++) {
                const cell = solutionPath[i];
                if(!cell || cell.row === undefined) continue;

                const ringData = rings[cell.row];
                if (!ringData) continue;

                const anglePerCell = 2 * Math.PI / ringData.length;
                const radius = (cell.row + donutHoleRings + 0.5) * levelHeight * scaleFactor;
                const angle = (cell.col + 0.5) * anglePerCell;
                
                const x = effectiveCenter + radius * Math.cos(angle);
                const y = effectiveCenter + radius * Math.sin(angle);
                
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x,y);
            }

            if (endCell.walls.top === false && solutionPath[solutionPath.length - 1] === endCell) {
                const lastCell = solutionPath[solutionPath.length - 1];
                const lastRingData = rings[lastCell.row];
                const anglePerCellLast = 2 * Math.PI / lastRingData.length;
                const radiusLast = (lastCell.row + donutHoleRings + 0.5) * levelHeight * scaleFactor;
                const angleLast = (lastCell.col + 0.5) * anglePerCellLast;
                
                const xLast = effectiveCenter + radiusLast * Math.cos(angleLast);
                const yLast = effectiveCenter + radiusLast * Math.sin(angleLast);

                ctx.moveTo(xLast, yLast);
                ctx.lineTo(effectiveCenter, effectiveCenter);
            }

        } else {
            const gridSize = currentGrid.length;
            const availableSize = CANVAS_SIZE - 2 * MAZE_PADDING;
            const cellSize = availableSize / gridSize;
            const getCenter = (cell) => ({ 
                x: MAZE_PADDING + (cell.x + 0.5) * cellSize, 
                y: MAZE_PADDING + (cell.y + 0.5) * cellSize 
            });

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
        if (currentShape !== 'worksheet' || !currentGrid.length || !Array.isArray(currentGrid)) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left - MAZE_PADDING;
        const mouseY = event.clientY - rect.top - MAZE_PADDING;

        const gridSize = currentGrid.length;
        const availableSize = CANVAS_SIZE - 2 * MAZE_PADDING;
        const cellSize = availableSize / gridSize;
        
        const x = Math.floor(mouseX / cellSize);
        const y = Math.floor(mouseY / cellSize);

        if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;
        
        if(currentGrid[y][x] === startCell && x === startCell.x && y === startCell.y) return;
        if(currentGrid[y][x] === endCell && x === endCell.x && y === endCell.y) return;

        const dx = mouseX - x * cellSize;
        const dy = mouseY - y * cellSize;
        const tolerance = wallThickness * 3; // WIJZIGING: Tolerantie schaalt mee
        const cell = currentGrid[y][x];
        const dists = { 
            top: dy, 
            right: cellSize - dx, 
            bottom: cellSize - dy, 
            left: dx 
        };
        const closestWall = Object.keys(dists).reduce((a, b) => dists[a] < dists[b] ? a : b);
        
        if (dists[closestWall] > tolerance) return;

        if (closestWall === 'top' && y > 0) { cell.walls.top = false; currentGrid[y - 1][x].walls.bottom = false; }
        else if (closestWall === 'right' && x < gridSize - 1) { cell.walls.right = false; currentGrid[y][x + 1].walls.left = false; }
        else if (closestWall === 'bottom' && y < gridSize - 1) { cell.walls.bottom = false; currentGrid[y + 1][x].walls.top = false; }
        else if (closestWall === 'left' && x > 0) { cell.walls.left = false; currentGrid[y][x - 1].walls.right = false; }
        
        drawAll();
    }

    function downloadPDF() {
        const currentSolution = [...solutionPath];
        solutionPath = [];
        drawAll();

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        doc.setFontSize(22);
        doc.text('Mijn Doolhof Werkblad', 105, 20, { align: 'center' });
        const imageData = canvas.toDataURL('image/png');
        const imgWidth = 180;
        const xPos = (210 - imgWidth) / 2;
        doc.addImage(imageData, 'PNG', xPos, 35, imgWidth, imgWidth);
        doc.save('doolhof-werkblad.pdf');
        
        solutionPath = currentSolution;
        drawAll();
    }
    
    function downloadPNG() {
        const link = document.createElement('a');
        link.download = 'doolhof.png';
        link.href = canvas.toDataURL("image/png");
        link.click();
    }

    initialize();
});
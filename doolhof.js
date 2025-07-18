document.addEventListener('DOMContentLoaded', () => {

    const CANVAS_SIZE = 500;
    const WALL_THICKNESS = 2;
    const MAZE_COLOR = "#333";
    const SOLUTION_COLOR = "#007bff"; // Kleur voor de oplossing

    const canvas = document.getElementById('mazeCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    
    const instructieText = document.getElementById('instructieText');
    const solveBtn = document.getElementById('solveMazeBtn');
    const hideBtn = document.getElementById('hideSolutionBtn');

    let currentGrid = [];
    let activeCells = [];
    let startCell, endCell; // Houdt start- en eindcellen bij
    let solutionPath = []; // Slaat het pad van de oplossing op
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
        
        // Event listeners voor oplossing knoppen
        solveBtn.addEventListener('click', solveAndShowSolution);
        hideBtn.addEventListener('click', hideSolution);
    }
    
    function generateAndDrawMaze() {
        const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
        solutionPath = []; // Reset de oplossing
        hideSolution(); // Verberg de oplossing en de knop
        activeCells = [];
        
        canvas.style.cursor = 'default';
        instructieText.textContent = "Kies een vorm en moeilijkheid.";
        solveBtn.disabled = false;

        if (currentShape === 'worksheet') {
            generateWorksheetMaze(difficulty);
            canvas.style.cursor = 'crosshair';
            instructieText.textContent = "Klik op een muur om deze te verwijderen. De in- en uitgang zijn al open.";
        } else {
            if (currentShape === 'rectangle') generateRectangularMaze(difficulty);
            else if (currentShape === 'masked_circle') generateMaskedMaze(difficulty);
            else if (currentShape === 'polar_circle') generatePolarMaze(difficulty);
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

    // 1. WERKBLAD-STIJL
    function generateWorksheetMaze(difficulty) {
        const DIFFICULTY_LEVELS = { easy: 15, medium: 25, hard: 35 };
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
        
        // Definieer start/eind en maak muren open voor de solver
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

    // 2. RECHTHOEK
    function generateRectangularMaze(difficulty) {
        const DIFFICULTY_LEVELS = { easy: 15, medium: 25, hard: 35 };
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

    // 3. GEVORMD (MASKED CIRCLE)
    function generateMaskedMaze(difficulty) {
        const DIFFICULTY_LEVELS = { easy: 15, medium: 25, hard: 35 };
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
             solveBtn.disabled = true; // Geen duidelijke in/uitgang
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

    // 4. CIRKEL (POLAR MAZE)
    function generatePolarMaze(difficulty) {
        const DIFFICULTY_LEVELS = { easy: 8, medium: 12, hard: 18 };
        const DONUT_HOLE_RINGS = { easy: 2, medium: 4, hard: 6 };
        const rings = [], numRings = DIFFICULTY_LEVELS[difficulty], startRing = DONUT_HOLE_RINGS[difficulty];
        for (let i = startRing; i < numRings; i++) {
            const rowHeight = CANVAS_SIZE / 2 / numRings;
            const radius = (i + 1) * rowHeight;
            const circumference = 2 * Math.PI * radius;
            const cellsInRing = Math.round(circumference / (rowHeight * 1.5));
            const ring = [];
            for (let j = 0; j < cellsInRing; j++) {
                ring.push({ row: i, col: j, walls: { outward: true, clockwise: true }, visited: false });
            }
            rings.push(ring);
        }
        if (rings.length === 0 || rings[0].length === 0) {
            solveBtn.disabled = true;
            return;
        }

        const firstRing = rings[0], lastRing = rings[rings.length - 1];
        startCell = lastRing[Math.floor(Math.random() * lastRing.length)];
        let stack = [startCell];
        startCell.visited = true;

        while (stack.length > 0) {
            let current = stack.pop();
            const neighbors = getPolarNeighbors(current, rings, startRing, numRings, true);
            if (neighbors.length > 0) {
                stack.push(current);
                let chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
                
                if (chosen.row === current.row) { // Clockwise/counter-clockwise
                    if ((chosen.col > current.col) || (chosen.col === 0 && current.col === rings[current.row - startRing].length - 1)) {
                        current.walls.clockwise = false;
                    } else {
                        chosen.walls.clockwise = false;
                    }
                } else if (chosen.row > current.row) { // Outward
                    current.walls.outward = false;
                } else { // Inward
                    chosen.walls.outward = false;
                }
                chosen.visited = true;
                stack.push(chosen);
            }
        }
        startCell.walls.outward = false;
        endCell = firstRing[Math.floor(Math.random() * firstRing.length)];
        endCell.isExit = true; // Speciale markering voor binnenste muur
        
        currentGrid = {type: 'polar', rings: rings, startRing: startRing, numRings: numRings};
        drawAll();
    }
    
    function drawPolarMaze() {
        if(!currentGrid.rings) return;
        const {rings, startRing, numRings} = currentGrid;
        const rowHeight = CANVAS_SIZE / 2 / numRings;
        ctx.strokeStyle = MAZE_COLOR;
        ctx.lineWidth = WALL_THICKNESS;
        ctx.lineCap = "round";
        const centerX = CANVAS_SIZE / 2, centerY = CANVAS_SIZE / 2;
        for (const ring of rings) {
            for (const cell of ring) {
                const cellsInThisRing = ring.length;
                const anglePerCell = 2 * Math.PI / cellsInThisRing;
                const innerRadius = cell.row * rowHeight;
                const outerRadius = (cell.row + 1) * rowHeight;
                const angleStart = cell.col * anglePerCell;
                const angleEnd = (cell.col + 1) * anglePerCell;
                ctx.beginPath();

                if (cell.row === startRing && !cell.isExit) {
                     ctx.moveTo(centerX + innerRadius * Math.cos(angleStart), centerY + innerRadius * Math.sin(angleStart));
                     ctx.arc(centerX, centerY, innerRadius, angleStart, angleEnd);
                }
               
                if(cell.walls.outward) {
                    ctx.moveTo(centerX + outerRadius * Math.cos(angleStart), centerY + outerRadius * Math.sin(angleStart));
                    ctx.arc(centerX, centerY, outerRadius, angleStart, angleEnd);
                }
                if(cell.walls.clockwise) {
                    const x1 = centerX + outerRadius * Math.cos(angleEnd), y1 = centerY + outerRadius * Math.sin(angleEnd);
                    const x2 = centerX + innerRadius * Math.cos(angleEnd), y2 = centerY + innerRadius * Math.sin(angleEnd);
                    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
                }
                ctx.stroke();
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
        drawAll(); // Herteken zonder oplossing
        hideBtn.classList.add('hidden');
        solveBtn.classList.remove('hidden');
    }

    function solveMaze() {
        let queue = [{ cell: startCell, path: [startCell] }];
        let visited = new Set([startCell]);

        while (queue.length > 0) {
            let { cell, path } = queue.shift();

            if (cell === endCell) {
                solutionPath = path;
                return;
            }
            
            let neighbors;
            if(currentGrid.type === 'polar') {
                neighbors = getPolarNeighbors(cell, currentGrid.rings, currentGrid.startRing, currentGrid.numRings, false);
            } else {
                neighbors = getGridNeighbors(cell, currentGrid);
            }

            for (let neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    let newPath = [...path, neighbor];
                    queue.push({ cell: neighbor, path: newPath });
                }
            }
        }
    }

    function getGridNeighbors(cell, grid) {
        const neighbors = [];
        const {x, y} = cell;
        // Top
        if (!cell.walls.top && y > 0 && grid[y - 1][x]) neighbors.push(grid[y - 1][x]);
        // Right
        if (!cell.walls.right && x < grid[0].length - 1 && grid[y][x + 1]) neighbors.push(grid[y][x + 1]);
        // Bottom
        if (!cell.walls.bottom && y < grid.length - 1 && grid[y + 1][x]) neighbors.push(grid[y + 1][x]);
        // Left
        if (!cell.walls.left && x > 0 && grid[y][x - 1]) neighbors.push(grid[y][x - 1]);
        return neighbors;
    }
    
    function getPolarNeighbors(cell, rings, startRing, numRings, forGeneration) {
        const neighbors = [];
        const {row, col} = cell;
        const ring = rings[row - startRing];
        
        // Clockwise
        const cwNeighbor = ring[(col + 1) % ring.length];
        if ((forGeneration && !cwNeighbor.visited) || (!forGeneration && !cell.walls.clockwise)) {
            neighbors.push(cwNeighbor);
        }
        
        // Counter-clockwise
        const ccwNeighbor = ring[(col - 1 + ring.length) % ring.length];
        if ((forGeneration && !ccwNeighbor.visited) || (!forGeneration && !ccwNeighbor.walls.clockwise)) {
            neighbors.push(ccwNeighbor);
        }

        // Outward (naar een grotere ring)
        if (!cell.walls.outward && row < numRings - 1) {
             const nextRing = rings[row - startRing + 1];
             if(nextRing) {
                const ratio = nextRing.length / ring.length;
                const neighbor = nextRing[Math.floor(col * ratio)];
                if (forGeneration ? !neighbor.visited : true) neighbors.push(neighbor);
             }
        }

        // Inward (naar een kleinere ring)
        if(row > startRing) {
            const prevRing = rings[row - startRing - 1];
            const ratio = ring.length / prevRing.length;
            const neighbor = prevRing[Math.floor(col/ratio)];
            if((forGeneration && !neighbor.visited) || (!forGeneration && !neighbor.walls.outward)) {
                neighbors.push(neighbor);
            }
        } else { // Van de eerste ring naar het 'einde'
             if(cell.isExit) neighbors.push(endCell);
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
            const { numRings } = currentGrid;
            const rowHeight = CANVAS_SIZE / 2 / numRings;
            const centerX = CANVAS_SIZE / 2, centerY = CANVAS_SIZE / 2;

            for(let i=0; i<solutionPath.length; i++) {
                const cell = solutionPath[i];
                const anglePerCell = 2 * Math.PI / currentGrid.rings[cell.row - currentGrid.startRing].length;
                const radius = (cell.row + 0.5) * rowHeight;
                const angle = (cell.col + 0.5) * anglePerCell;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x,y);
            }

        } else {
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
        if (currentShape !== 'worksheet' || !currentGrid.length || !Array.isArray(currentGrid)) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const gridSize = currentGrid.length;
        const cellSize = CANVAS_SIZE / gridSize;
        const x = Math.floor(mouseX / cellSize);
        const y = Math.floor(mouseY / cellSize);
        if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;
        
        // Prevent erasing entrance/exit walls
        if(currentGrid[y][x] === startCell && x === startCell.x && y === startCell.y) return;
        if(currentGrid[y][x] === endCell && x === endCell.x && y === endCell.y) return;

        const dx = mouseX - x * cellSize, dy = mouseY - y * cellSize;
        const tolerance = WALL_THICKNESS * 3;
        const cell = currentGrid[y][x];
        const dists = { top: dy, right: cellSize - dx, bottom: cellSize - dy, left: dx };
        const closestWall = Object.keys(dists).reduce((a, b) => dists[a] < dists[b] ? a : b);
        
        if (dists[closestWall] > tolerance) return;
        
        if (closestWall === 'top' && y > 0) { cell.walls.top = false; currentGrid[y - 1][x].walls.bottom = false; }
        else if (closestWall === 'right' && x < gridSize - 1) { cell.walls.right = false; currentGrid[y][x + 1].walls.left = false; }
        else if (closestWall === 'bottom' && y < gridSize - 1) { cell.walls.bottom = false; currentGrid[y + 1][x].walls.top = false; }
        else if (closestWall === 'left' && x > 0) { cell.walls.left = false; currentGrid[y][x - 1].walls.right = false; }
        
        drawAll();
    }

    function downloadPDF() {
        // Redraw without solution for PDF
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
        
        // Restore solution if it was visible
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
document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTEN SELECTEREN ---
    const rowsInput = document.getElementById('rowsInput');
    const colsInput = document.getElementById('colsInput');
    const resizeGridBtn = document.getElementById('resizeGridBtn');
    const clearGridBtn = document.getElementById('clearGridBtn');
    const gridContainer = document.getElementById('grid-container');
    const pieceLibrary = document.getElementById('piece-library');
    const generateWorksheetBtn = document.getElementById('generateWorksheetBtn');
    const worksheetOutput = document.getElementById('worksheet-output');
    const downloadPngBtn = document.getElementById('downloadPngBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');

    let draggedPiece = null;

    // --- PUZZELSTUKKEN DEFINIËREN ---
    const pieces = [
        { name: 'I-4', color: '#A2D2FF', shape: [[1, 1, 1, 1]] },
        { name: 'O-2x2', color: '#BDE0FE', shape: [[1, 1], [1, 1]] },
        { name: 'L-3', color: '#FFC8DD', shape: [[1, 0], [1, 0], [1, 1]] },
        { name: 'J-3', color: '#FFAFCC', shape: [[0, 1], [0, 1], [1, 1]] },
        { name: 'T-3', color: '#CDB4DB', shape: [[1, 1, 1], [0, 1, 0]] },
        { name: 'S-3', color: '#B9FBC0', shape: [[0, 1, 1], [1, 1, 0]] },
        { name: 'Z-3', color: '#98F5E1', shape: [[1, 1, 0], [0, 1, 1]] },
    ];

    // --- FUNCTIES ---

    function initializePieceLibrary() {
        pieceLibrary.innerHTML = '';
        pieces.forEach(pieceData => {
            const pieceElement = createPieceElement(pieceData);
            pieceLibrary.appendChild(pieceElement);
        });
    }

    function createPieceElement(pieceData) {
        const piece = document.createElement('div');
        piece.classList.add('piece');
        piece.style.backgroundColor = 'transparent';
        piece.style.display = 'grid';
        piece.style.gridTemplateRows = `repeat(${pieceData.shape.length}, 10px)`;
        piece.style.gridTemplateColumns = `repeat(${pieceData.shape[0].length}, 10px)`;
        piece.dataset.pieceName = pieceData.name;
        piece.dataset.rotation = 0;
        
        pieceData.shape.flat().forEach(cell => {
            const cellDiv = document.createElement('div');
            if (cell) cellDiv.style.backgroundColor = pieceData.color;
            piece.appendChild(cellDiv);
        });

        piece.draggable = true;
        piece.addEventListener('click', () => rotatePiece(piece));
        piece.addEventListener('dragstart', (e) => {
            draggedPiece = {
                element: piece, name: pieceData.name,
                shape: getCurrentShape(piece), color: pieceData.color
            };
            e.dataTransfer.effectAllowed = 'move';
        });
        return piece;
    }

    function rotatePiece(pieceElement) {
        let currentRotation = parseInt(pieceElement.dataset.rotation, 10);
        currentRotation = (currentRotation + 90) % 360;
        pieceElement.dataset.rotation = currentRotation;
        pieceElement.style.transform = `rotate(${currentRotation}deg)`;
    }
    
    function getCurrentShape(pieceElement) {
        const pieceData = pieces.find(p => p.name === pieceElement.dataset.pieceName);
        let shape = pieceData.shape.map(row => [...row]);
        const rotation = parseInt(pieceElement.dataset.rotation, 10);
        let rotatedShape = shape;
        for (let r = 0; r < rotation / 90; r++) {
            rotatedShape = rotatedShape[0].map((_, colIndex) => rotatedShape.map(row => row[colIndex]).reverse());
        }
        return rotatedShape;
    }
    
    function createOrResizeGrid() {
        const oldCellsData = new Map();
        gridContainer.querySelectorAll('.grid-cell').forEach(cell => {
            const key = `${cell.dataset.row}-${cell.dataset.col}`;
            oldCellsData.set(key, {
                text: cell.textContent,
                bgColor: cell.style.backgroundColor,
                pieceGroup: cell.dataset.pieceGroup
            });
        });

        gridContainer.innerHTML = '';
        const rows = parseInt(rowsInput.value, 10);
        const cols = parseInt(colsInput.value, 10);
        gridContainer.style.gridTemplateColumns = `repeat(${cols}, 35px)`;

        for (let i = 0; i < rows * cols; i++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            const row = Math.floor(i / cols);
            const col = i % cols;
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.contentEditable = true;

            const key = `${row}-${col}`;
            if (oldCellsData.has(key)) {
                const data = oldCellsData.get(key);
                cell.textContent = data.text;
                cell.style.backgroundColor = data.bgColor;
                if (data.pieceGroup) cell.dataset.pieceGroup = data.pieceGroup;
            }
            addCellEventListeners(cell);
            gridContainer.appendChild(cell);
        }
    }
    
    function addCellEventListeners(cell) {
        cell.addEventListener('keydown', handleKeyDown);
        cell.addEventListener('input', handleInput);
        cell.addEventListener('dragover', handleDragOver);
        cell.addEventListener('dragleave', clearGhostPiece);
        cell.addEventListener('drop', handleDrop);
        cell.addEventListener('contextmenu', handleRightClick); // Voor verwijderen
    }

    // --- NIEUWE FUNCTIES VOOR SLEPEN & PREVIEW ---

    function handleDragOver(e) {
        e.preventDefault();
        if (!draggedPiece) return;
        updateGhostPiece(e.target);
    }

    function updateGhostPiece(targetCell) {
        clearGhostPiece(); // Verwijder eerst de oude preview
        const shape = draggedPiece.shape;
        const startRow = parseInt(targetCell.dataset.row, 10);
        const startCol = parseInt(targetCell.dataset.col, 10);

        shape.forEach((row, rIdx) => {
            row.forEach((cellValue, cIdx) => {
                if (cellValue) {
                    const ghostCell = document.querySelector(`.grid-cell[data-row='${startRow + rIdx}'][data-col='${startCol + cIdx}']`);
                    if (ghostCell) {
                        ghostCell.classList.add('ghost-preview');
                        ghostCell.style.backgroundColor = draggedPiece.color;
                    }
                }
            });
        });
    }

    function clearGhostPiece() {
        gridContainer.querySelectorAll('.ghost-preview').forEach(cell => {
            cell.classList.remove('ghost-preview');
            // Reset kleur alleen als de cel niet al deel uitmaakt van een geplaatst stuk
            if (!cell.dataset.pieceGroup) {
                cell.style.backgroundColor = '';
            }
        });
    }

    function handleDrop(e) {
        e.preventDefault();
        if (!draggedPiece) return;

        const targetCell = e.target.closest('.grid-cell');
        const startRow = parseInt(targetCell.dataset.row, 10);
        const startCol = parseInt(targetCell.dataset.col, 10);
        const shape = draggedPiece.shape;
        const pieceGroup = draggedPiece.name + '-' + Date.now();

        // Plaats het stuk op basis van de ghost-preview positie
        shape.forEach((row, rIdx) => {
            row.forEach((cellValue, cIdx) => {
                if (cellValue) {
                    const gridCell = document.querySelector(`.grid-cell[data-row='${startRow + rIdx}'][data-col='${startCol + cIdx}']`);
                    if (gridCell) {
                        gridCell.style.backgroundColor = draggedPiece.color;
                        gridCell.dataset.pieceGroup = pieceGroup;
                    }
                }
            });
        });
        
        clearGhostPiece();
        draggedPiece = null;
    }
    
    // --- NIEUWE FUNCTIE VOOR VERWIJDEREN ---
    
    function handleRightClick(e) {
        e.preventDefault(); // Voorkom dat het standaard contextmenu opent
        const clickedCell = e.target.closest('.grid-cell');
        if (!clickedCell || !clickedCell.dataset.pieceGroup) return;

        const groupToRemove = clickedCell.dataset.pieceGroup;
        gridContainer.querySelectorAll(`[data-piece-group='${groupToRemove}']`).forEach(cell => {
            cell.style.backgroundColor = '';
            delete cell.dataset.pieceGroup;
        });
    }

    function handleKeyDown(e) {
        if (e.key === ' ') {
            e.preventDefault();
            focusNextCell(e.target);
        }
    }

    function handleInput(e) {
        const cell = e.target;
        if (cell.textContent.length > 1) cell.textContent = cell.textContent.slice(-1);
        if (cell.textContent.length === 1) focusNextCell(cell);
    }
    
    function focusNextCell(currentCell) {
        const allCells = Array.from(gridContainer.querySelectorAll('.grid-cell'));
        const currentIndex = allCells.indexOf(currentCell);
        if (currentIndex < allCells.length - 1) allCells[currentIndex + 1].focus();
    }
    
    function clearGrid() {
        gridContainer.querySelectorAll('.grid-cell').forEach(cell => {
            cell.textContent = '';
            cell.style.backgroundColor = '';
            delete cell.dataset.pieceGroup;
        });
        worksheetOutput.innerHTML = '';
        downloadPngBtn.disabled = true;
        downloadPdfBtn.disabled = true;
    }

    function generateWorksheet() {
        worksheetOutput.innerHTML = '';
        const rows = parseInt(rowsInput.value, 10);
        const cols = parseInt(colsInput.value, 10);
        const worksheetGrid = document.createElement('div');
        worksheetGrid.className = 'worksheet-grid';
        worksheetGrid.style.gridTemplateColumns = `repeat(${cols}, 35px)`;
        const pieceGroups = {};

        gridContainer.querySelectorAll('.grid-cell').forEach(canvasCell => {
            const worksheetCell = document.createElement('div');
            worksheetCell.className = 'worksheet-cell';
            
            if (canvasCell.dataset.pieceGroup) {
                const groupName = canvasCell.dataset.pieceGroup;
                if (!pieceGroups[groupName]) {
                    pieceGroups[groupName] = { color: canvasCell.style.backgroundColor, cells: [] };
                }
                pieceGroups[groupName].cells.push({
                    row: parseInt(canvasCell.dataset.row, 10),
                    col: parseInt(canvasCell.dataset.col, 10),
                    letter: canvasCell.textContent
                });
                worksheetCell.style.backgroundColor = '#fff';
            } else {
                worksheetCell.textContent = canvasCell.textContent;
            }
            worksheetGrid.appendChild(worksheetCell);
        });
        worksheetOutput.appendChild(worksheetGrid);

        const piecesContainer = document.createElement('div');
        piecesContainer.className = 'worksheet-pieces-container';
        for (const groupName in pieceGroups) {
            const data = pieceGroups[groupName];
            const minRow = Math.min(...data.cells.map(c => c.row));
            const minCol = Math.min(...data.cells.map(c => c.col));
            const maxRow = Math.max(...data.cells.map(c => c.row));
            const maxCol = Math.max(...data.cells.map(c => c.col));

            const pieceGrid = document.createElement('div');
            pieceGrid.style.display = 'grid';
            pieceGrid.style.gridTemplateRows = `repeat(${maxRow - minRow + 1}, 35px)`;
            pieceGrid.style.gridTemplateColumns = `repeat(${maxCol - minCol + 1}, 35px)`;
            pieceGrid.style.gap = '1px';
            const pieceCells = Array((maxRow - minRow + 1) * (maxCol - minCol + 1)).fill(null);

            data.cells.forEach(cell => {
                const index = (cell.row - minRow) * (maxCol - minCol + 1) + (cell.col - minCol);
                pieceCells[index] = cell.letter;
            });
            
            pieceCells.forEach(letter => {
                const cellDiv = document.createElement('div');
                cellDiv.className = 'worksheet-cell';
                if (letter !== null) {
                    cellDiv.textContent = letter;
                    cellDiv.style.backgroundColor = data.color;
                } else {
                    cellDiv.style.visibility = 'hidden';
                }
                pieceGrid.appendChild(cellDiv);
            });
            piecesContainer.appendChild(pieceGrid);
        }
        worksheetOutput.appendChild(piecesContainer);

        downloadPngBtn.disabled = false;
        downloadPdfBtn.disabled = false;
    }
    
    function downloadAs(type) {
        const originalBg = worksheetOutput.style.backgroundColor;
        worksheetOutput.style.backgroundColor = '#ffffff';
        worksheetOutput.style.padding = '10px';
        html2canvas(worksheetOutput, { scale: 2 }).then(canvas => {
            worksheetOutput.style.backgroundColor = originalBg;
            worksheetOutput.style.padding = '0';
            const link = document.createElement('a');
            const fileName = `lettertetris-puzzel.${type}`;
            if (type === 'pdf') {
                const { jsPDF } = window.jspdf;
                const imgData = canvas.toDataURL('image/png');
                const doc = new jsPDF('p', 'mm', 'a4');
                const imgProps = doc.getImageProperties(imgData);
                const pdfWidth = doc.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                doc.save(fileName);
            } else {
                link.download = fileName;
                link.href = canvas.toDataURL('image/png');
                link.click();
            }
        });
    }

    // --- EVENT LISTENERS ---
    resizeGridBtn.addEventListener('click', createOrResizeGrid);
    clearGridBtn.addEventListener('click', clearGrid);
    generateWorksheetBtn.addEventListener('click', generateWorksheet);
    downloadPngBtn.addEventListener('click', () => downloadAs('png'));
    downloadPdfBtn.addEventListener('click', () => downloadAs('pdf'));

    // --- INITIALISATIE ---
    createOrResizeGrid();
    initializePieceLibrary();
});
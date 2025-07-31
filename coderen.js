document.addEventListener("DOMContentLoaded", () => {
    // --- Canvas en contexten ---
    const drawingCanvas = document.getElementById("drawingCanvas");
    const drawCtx = drawingCanvas.getContext("2d");
    const worksheetCanvas = document.getElementById("worksheetCanvas");
    const worksheetCtx = worksheetCanvas.getContext("2d");

    // --- DOM-elementen ---
    const gridWidthInput = document.getElementById("gridWidth");
    const gridHeightInput = document.getElementById("gridHeight");
    const resetGridBtn = document.getElementById('resetGridBtn');
    const generateBtn = document.getElementById("generateBtn");
    const clearBtn = document.getElementById("clearBtn");
    const downloadPdfBtn = document.getElementById("downloadPdfBtn");
    const meldingContainer = document.getElementById("meldingContainer");
    const instructionsOutput = document.getElementById("instructions-output");
    const toolBtns = document.querySelectorAll(".tool-btn");
    const saveDrawingBtn = document.getElementById('saveDrawingBtn');
    const loadDrawingBtn = document.getElementById('loadDrawingBtn');
    const loadDrawingInput = document.getElementById('loadDrawingInput');
    const catalogBtn = document.getElementById('catalogBtn');
    const catalogModal = document.getElementById('catalogModal');
    const closeModalBtn = document.querySelector('.close-button');
    const backToThemesBtn = document.getElementById('backToThemesBtn');
    const themesContainer = document.getElementById('catalog-themes');
    const choicesContainer = document.getElementById('catalog-choices');
    const modalTitle = document.getElementById('modal-title');
    const addColLeftBtn = document.getElementById('addColLeftBtn');
    const removeColLeftBtn = document.getElementById('removeColLeftBtn');
    const addColRightBtn = document.getElementById('addColRightBtn');
    const removeColRightBtn = document.getElementById('removeColRightBtn');
    const addRowTopBtn = document.getElementById('addRowTopBtn');
    const removeRowTopBtn = document.getElementById('removeRowTopBtn');
    const addRowBottomBtn = document.getElementById('addRowBottomBtn');
    const removeRowBottomBtn = document.getElementById('removeRowBottomBtn');

    // --- Status variabelen ---
    let gridWidth, gridHeight, cellSize;
    let features = [];
    let codedPath = [];
    let freehandLines = [];
    let startPoint = null;
    let isDrawing = false;
    let currentTool = 'start';
    let selectedFeature = null;
    let action = null;
    let previewLine = null;
    let catalogData = {};
    let dragStartPos = null;

    function initializeGrid() {
        gridWidth = parseInt(gridWidthInput.value);
        gridHeight = parseInt(gridHeightInput.value);
        resetDrawing();
        updateCanvasAndRedraw();
    }

    function resetDrawing() {
        features = [];
        codedPath = [];
        freehandLines = [];
        startPoint = null;
        selectedFeature = null;
        clearOutput();
        redrawAll();
    }

    function updateCanvasAndRedraw() {
        const container = drawingCanvas.parentElement;
        const containerWidth = container.clientWidth - 20;
        const containerHeight = container.clientHeight - 20;
        cellSize = Math.min(containerWidth / gridWidth, containerHeight / gridHeight);

        drawingCanvas.width = gridWidth * cellSize;
        drawingCanvas.height = gridHeight * cellSize;

        redrawAll();
    }

    function clearOutput() {
        instructionsOutput.innerHTML = '';
        worksheetCtx.clearRect(0, 0, worksheetCanvas.width, worksheetCanvas.height);
        downloadPdfBtn.disabled = true;
        meldingContainer.textContent = '';
    }

    function redrawAll() {
        drawCtx.clearRect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height);
        drawGridLines(drawCtx);

        if (codedPath.length > 1) {
            drawCtx.strokeStyle = '#333';
            drawCtx.lineWidth = Math.max(1.5, cellSize / 10);
            drawCtx.lineCap = 'round';
            drawCtx.lineJoin = 'round';
            drawCtx.beginPath();
            drawCtx.moveTo(codedPath[0].vx * cellSize, codedPath[0].vy * cellSize);
            for (let i = 1; i < codedPath.length; i++) {
                drawCtx.lineTo(codedPath[i].vx * cellSize, codedPath[i].vy * cellSize);
            }
            drawCtx.stroke();
        }

        if (previewLine) {
            drawCtx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
            drawCtx.lineWidth = 1;
            drawCtx.setLineDash([2, 3]);
            drawCtx.beginPath();
            drawCtx.moveTo(previewLine.start.vx * cellSize, previewLine.start.vy * cellSize);
            drawCtx.lineTo(previewLine.end.vx * cellSize, previewLine.end.vy * cellSize);
            drawCtx.stroke();
            drawCtx.setLineDash([]);
        }

        features.forEach(f => drawFeature(drawCtx, f));

        if (selectedFeature) {
            drawSelectionBox(drawCtx, selectedFeature);
        }

        freehandLines.forEach(path => {
            drawCtx.strokeStyle = '#000';
            drawCtx.lineWidth = Math.max(1, cellSize / 10);
            drawCtx.beginPath();
            if (path.length > 0) {
                drawCtx.moveTo(path[0].x, path[0].y);
                for (let i = 1; i < path.length; i++) {
                    drawCtx.lineTo(path[i].x, path[i].y);
                }
            }
            drawCtx.stroke();
        });

        if (startPoint) {
            drawCtx.fillStyle = '#ff0000';
            drawCtx.beginPath();
            drawCtx.arc(startPoint.vx * cellSize, startPoint.vy * cellSize, cellSize / 3.5, 0, Math.PI * 2);
            drawCtx.fill();
        }
    }

    function drawGridLines(ctx) {
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        for (let i = 0; i <= gridWidth; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, gridHeight * cellSize);
            ctx.stroke();
        }
        for (let i = 0; i <= gridHeight; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(gridWidth * cellSize, i * cellSize);
            ctx.stroke();
        }
    }

    function drawFeature(ctx, feature) {
        ctx.save();
        ctx.translate(feature.x, feature.y);
        ctx.rotate(feature.rotation || 0);

        switch (feature.type) {
            case 'eye':
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(0, 0, feature.radius, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'nose':
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(0, 0, feature.radius, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'mouth':
                ctx.strokeStyle = '#000';
                ctx.lineWidth = Math.max(1.5, cellSize / 12);
                ctx.beginPath();
                ctx.arc(0, 0, feature.width / 2, 0.2 * Math.PI, 0.8 * Math.PI);
                ctx.stroke();
                break;
        }
        ctx.restore();
    }

    function drawSelectionBox(ctx, feature) {
        const bounds = getFeatureBounds(feature);
        ctx.save();
        ctx.translate(feature.x, feature.y);
        ctx.rotate(feature.rotation || 0);

        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(-bounds.w / 2, -bounds.h / 2, bounds.w, bounds.h);
        ctx.setLineDash([]);

        if (feature.type === 'mouth') {
            const handleSize = 8;
            ctx.fillStyle = '#00aaff';
            ctx.fillRect(bounds.w / 2 - handleSize / 2, -handleSize / 2, handleSize, handleSize);
            ctx.fillRect(-bounds.w / 2 - handleSize / 2, -handleSize / 2, handleSize, handleSize);

            ctx.fillStyle = '#ff8c00';
            ctx.beginPath();
            ctx.arc(0, -bounds.h / 2 - 20, handleSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(0, -bounds.h / 2);
            ctx.lineTo(0, -bounds.h / 2 - 20);
            ctx.stroke();
        }
        ctx.restore();
    }

    function getFeatureBounds(feature) {
        let size = feature.radius ? feature.radius * 2 : (feature.width || cellSize);
        if (feature.type === 'mouth') {
            return { w: feature.width, h: feature.width * 0.8 };
        }
        return { w: size, h: size };
    }

    function getMousePos(event) {
        const rect = drawingCanvas.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function handleMouseDown(event) {
        isDrawing = true;
        const pos = getMousePos(event);
        dragStartPos = pos;
        action = null;

        if (currentTool === 'move') {
            const clickedHandle = getClickedHandle(pos, selectedFeature);
            if (clickedHandle) {
                action = clickedHandle;
            } else {
                selectedFeature = getFeatureAtPos(pos);
                if (selectedFeature) {
                    action = 'move';
                }
            }
        } else if (currentTool === 'line') {
            const startVertex = codedPath.length > 0 ? codedPath[codedPath.length - 1] : startPoint;
            if (startVertex) {
                previewLine = { start: startVertex, end: startVertex };
            } else {
                isDrawing = false;
            }
        } else if (currentTool === 'freehand') {
            freehandLines.push([{ x: pos.x, y: pos.y }]);
        } else {
            selectedFeature = null;
        }
        redrawAll();
    }

    function handleMouseMove(event) {
        if (!isDrawing) return;
        const pos = getMousePos(event);

        if (currentTool === 'move' && selectedFeature && action) {
            const dx = pos.x - dragStartPos.x;
            const dy = pos.y - dragStartPos.y;

            switch (action) {
                case 'move':
                    selectedFeature.x += dx;
                    selectedFeature.y += dy;
                    break;
                case 'resize':
                    const initialWidth = getFeatureBounds(selectedFeature).w;
                    selectedFeature.width = Math.max(10, initialWidth + dx * 2);
                    break;
                case 'rotate':
                    const angle = Math.atan2(pos.y - selectedFeature.y, pos.x - selectedFeature.x);
                    selectedFeature.rotation = angle - Math.PI / 2;
                    break;
            }
            dragStartPos = pos;
        } else if (currentTool === 'line' && previewLine) {
            previewLine.end = { vx: Math.round(pos.x / cellSize), vy: Math.round(pos.y / cellSize) };
        } else if (currentTool === 'freehand' && freehandLines.length > 0) {
            freehandLines[freehandLines.length - 1].push({ x: pos.x, y: pos.y });
        } else if (currentTool === 'eraser') {
            features = features.filter(f => Math.hypot(f.x - pos.x, f.y - pos.y) > (f.radius || f.width / 2));
            codedPath = codedPath.filter(p => Math.hypot(p.vx * cellSize - pos.x, p.vy * cellSize - pos.y) > cellSize / 2);
            freehandLines = freehandLines.filter(path => !path.some(p => Math.hypot(p.x - pos.x, p.y - pos.y) < cellSize / 2));
        }
        redrawAll();
    }

    function handleMouseUp(event) {
        if (!isDrawing) return;
        isDrawing = false;
        action = null;

        if (currentTool === 'line' && previewLine) {
            const endVertex = previewLine.end;
            let lastVertex = previewLine.start;
            while (lastVertex.vx !== endVertex.vx || lastVertex.vy !== endVertex.vy) {
                const dx = Math.sign(endVertex.vx - lastVertex.vx);
                const dy = Math.sign(endVertex.vy - lastVertex.vy);
                const nextVertex = { vx: lastVertex.vx + dx, vy: lastVertex.vy + dy };
                codedPath.push(nextVertex);
                lastVertex = nextVertex;
            }
            previewLine = null;
        }
        redrawAll();
    }

    function handleClick(event) {
        if (isDrawing) return;
        const pos = getMousePos(event);

        switch (currentTool) {
            case 'start':
                startPoint = { vx: Math.round(pos.x / cellSize), vy: Math.round(pos.y / cellSize) };
                codedPath = [startPoint];
                break;
            case 'eye':
                features.push({ type: 'eye', x: pos.x, y: pos.y, radius: cellSize / 2, rotation: 0 });
                break;
            case 'nose':
                features.push({ type: 'nose', x: pos.x, y: pos.y, radius: cellSize / 1.5, rotation: 0 });
                break;
            case 'mouth':
                features.push({ type: 'mouth', x: pos.x, y: pos.y, width: cellSize * 1.5, rotation: 0 });
                break;
            case 'move':
                selectedFeature = getFeatureAtPos(pos);
                break;
            case 'eraser':
                features = features.filter(f => Math.hypot(f.x - pos.x, f.y - pos.y) > (f.radius || f.width / 2));
                break;
        }
        redrawAll();
    }

    function getFeatureAtPos(pos) {
        for (let i = features.length - 1; i >= 0; i--) {
            const f = features[i];
            const bounds = getFeatureBounds(f);
            if (pos.x > f.x - bounds.w / 2 && pos.x < f.x + bounds.w / 2 && pos.y > f.y - bounds.h / 2 && pos.y < f.y + bounds.h / 2) {
                return f;
            }
        }
        return null;
    }

    function getClickedHandle(pos, feature) {
        if (!feature || feature.type !== 'mouth') return null;
        const bounds = getFeatureBounds(feature);
        const handleSize = 10;

        const worldCoord = (localX, localY) => ({
            x: feature.x + localX * Math.cos(feature.rotation) - localY * Math.sin(feature.rotation),
            y: feature.y + localX * Math.sin(feature.rotation) + localY * Math.cos(feature.rotation)
        });

        const resizeHandlePos = worldCoord(bounds.w / 2, 0);
        const rotateHandlePos = worldCoord(0, -bounds.h / 2 - 20);

        if (Math.hypot(pos.x - resizeHandlePos.x, pos.y - resizeHandlePos.y) < handleSize) return 'resize';
        if (Math.hypot(pos.x - rotateHandlePos.x, pos.y - rotateHandlePos.y) < handleSize) return 'rotate';

        return null;
    }

    function addColumn(atLeft) {
        const oldCellSize = cellSize;
        gridWidthInput.value = ++gridWidth;
        if (atLeft) {
            if (startPoint) startPoint.vx++;
            codedPath.forEach(p => p.vx++);
            features.forEach(f => f.x += oldCellSize);
            freehandLines.forEach(path => path.forEach(p => p.x += oldCellSize));
        }
        updateCanvasAndRedraw();
    }

    function removeColumn(atLeft) {
        if (gridWidth <= 5) return;
        const oldCellSize = cellSize;
        gridWidthInput.value = --gridWidth;
        if (atLeft) {
            if (startPoint) startPoint.vx--;
            codedPath.forEach(p => p.vx--);
            features.forEach(f => f.x -= oldCellSize);
            freehandLines.forEach(path => path.forEach(p => p.x -= oldCellSize));
        }
        updateCanvasAndRedraw();
    }

    function addRow(atTop) {
        const oldCellSize = cellSize;
        gridHeightInput.value = ++gridHeight;
        if (atTop) {
            if (startPoint) startPoint.vy++;
            codedPath.forEach(p => p.vy++);
            features.forEach(f => f.y += oldCellSize);
            freehandLines.forEach(path => path.forEach(p => p.y += oldCellSize));
        }
        updateCanvasAndRedraw();
    }

    function removeRow(atTop) {
        if (gridHeight <= 5) return;
        const oldCellSize = cellSize;
        gridHeightInput.value = --gridHeight;
        if (atTop) {
            if (startPoint) startPoint.vy--;
            codedPath.forEach(p => p.vy--);
            features.forEach(f => f.y -= oldCellSize);
            freehandLines.forEach(path => path.forEach(p => p.y -= oldCellSize));
        }
        updateCanvasAndRedraw();
    }

    function generateCode() {
        if (!startPoint || codedPath.length <= 1) {
            meldingContainer.textContent = 'Teken eerst een volledige lijn vanaf het startpunt!';
            return;
        }
        const instructions = convertPathToInstructions(codedPath);
        displayOutput(instructions);
        downloadPdfBtn.disabled = false;
    }

    function convertPathToInstructions(path) {
        const directions = [];
        for (let i = 0; i < path.length - 1; i++) {
            directions.push(getDirectionArrow(path[i + 1].vy - path[i].vy, path[i + 1].vx - path[i].vx));
        }
        if (directions.length === 0) return [];
        const instructions = [];
        let count = 1,
            currentDir = directions[0];
        for (let i = 1; i < directions.length; i++) {
            if (directions[i] === currentDir) {
                count++;
            } else {
                instructions.push({ dir: currentDir, count: count });
                currentDir = directions[i];
                count = 1;
            }
        }
        instructions.push({ dir: currentDir, count: count });
        return instructions;
    }

    function getDirectionArrow(dr, dc) {
        if (dr === -1 && dc === 0) return '⬆️';
        if (dr === 1 && dc === 0) return '⬇️';
        if (dr === 0 && dc === -1) return '⬅️';
        if (dr === 0 && dc === 1) return '➡️';
        if (dr === -1 && dc === 1) return '↗️';
        if (dr === -1 && dc === -1) return '↖️';
        if (dr === 1 && dc === 1) return '↘️';
        if (dr === 1 && dc === -1) return '↙️';
        return '?';
    }

    function displayOutput(instructions) {
        instructionsOutput.innerHTML = instructions.map(instr => `<span>${instr.count} ${instr.dir}</span>`).join('');
        worksheetCanvas.width = drawingCanvas.width;
        worksheetCanvas.height = drawingCanvas.height;
        const wsCtx = worksheetCanvas.getContext('2d');
        wsCtx.clearRect(0, 0, worksheetCanvas.width, worksheetCanvas.height);
        drawGridLines(wsCtx);
        features.forEach(f => drawFeature(wsCtx, f));
        freehandLines.forEach(path => {
            wsCtx.strokeStyle = '#000';
            wsCtx.lineWidth = Math.max(1, cellSize / 10);
            wsCtx.beginPath();
            if (path.length > 0) {
                wsCtx.moveTo(path[0].x, path[0].y);
                for (let i = 1; i < path.length; i++) wsCtx.lineTo(path[i].x, path[i].y)
            }
            wsCtx.stroke()
        });
        if (startPoint) {
            wsCtx.fillStyle = '#ff0000';
            wsCtx.beginPath();
            wsCtx.arc(startPoint.vx * cellSize, startPoint.vy * cellSize, cellSize / 3.5, 0, Math.PI * 2);
            wsCtx.fill()
        }
    }

    function downloadPdf() {
        // Functie voor PDF downloaden (kan complex zijn, hier basis opzet)
        alert("PDF download functionaliteit is niet volledig geïmplementeerd in dit voorbeeld.");
    }

    function saveDrawing() {
        const drawingData = { gridWidth, gridHeight, startPoint, codedPath, features, freehandLines };
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([JSON.stringify(drawingData)], { type: 'application/json' }));
        a.download = 'tekening.json';
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function loadDrawing(data) {
        gridWidthInput.value = data.gridWidth;
        gridHeightInput.value = data.gridHeight;

        gridWidth = parseInt(data.gridWidth);
        gridHeight = parseInt(data.gridHeight);

        updateCanvasAndRedraw(); // Zet grid grootte eerst

        startPoint = data.startPoint;
        codedPath = data.codedPath || [];
        features = data.features || [];
        freehandLines = data.freehandLines || [];
        redrawAll();
    }

    function handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const data = JSON.parse(e.target.result);
                loadDrawing(data)
            } catch (err) {
                meldingContainer.textContent = "Fout bij laden: " + err.message
            }
        };
        reader.readAsText(file)
    }

    // --- Catalogus Functies ---
    async function openCatalog() {
        if (Object.keys(catalogData).length === 0) {
            try {
                const response = await fetch('coderen_afbeeldingen/catalog.json');
                if (!response.ok) throw new Error('catalog.json niet gevonden!');
                catalogData = await response.json();
            } catch (error) {
                meldingContainer.textContent = error.message;
                return;
            }
        }
        showThemes();
        catalogModal.style.display = 'block';
    }

    function closeCatalog() {
        catalogModal.style.display = 'none';
    }

    function showThemes() {
        themesContainer.innerHTML = '';
        choicesContainer.style.display = 'none';
        themesContainer.style.display = 'grid';
        backToThemesBtn.style.display = 'none';
        modalTitle.textContent = 'Catalogus';

        for (const theme in catalogData) {
            const themeBtn = document.createElement('button');
            themeBtn.className = 'catalog-choice-button';
            themeBtn.innerHTML = `<span>${theme}</span>`;
            themeBtn.onclick = () => displayChoices(theme);
            themesContainer.appendChild(themeBtn);
        }
    }

    function displayChoices(theme) {
        choicesContainer.innerHTML = '';
        themesContainer.style.display = 'none';
        choicesContainer.style.display = 'grid';
        backToThemesBtn.style.display = 'block';
        modalTitle.textContent = theme;

        const choices = catalogData[theme];
        choices.forEach(choice => {
            const choiceBtn = document.createElement('button');
            choiceBtn.className = 'catalog-choice-button';
            choiceBtn.innerHTML = `
                <img src="${choice.image}" alt="${choice.name}">
                <span>${choice.name}</span>
            `;
            choiceBtn.onclick = () => loadChoice(choice.json);
            choicesContainer.appendChild(choiceBtn);
        });
    }

    async function loadChoice(jsonPath) {
        try {
            const response = await fetch(jsonPath);
            if (!response.ok) throw new Error(`Bestand ${jsonPath} niet gevonden!`);
            const data = await response.json();
            loadDrawing(data);
            closeCatalog();
        } catch (error) {
            meldingContainer.textContent = error.message;
        }
    }


    // --- Event Listeners ---
    resetGridBtn.addEventListener('click', initializeGrid);
    clearBtn.addEventListener('click', () => {
        resetDrawing();
        initializeGrid();
    });
    addColLeftBtn.addEventListener('click', () => addColumn(true));
    addColRightBtn.addEventListener('click', () => addColumn(false));
    removeColLeftBtn.addEventListener('click', () => removeColumn(true));
    removeColRightBtn.addEventListener('click', () => removeColumn(false));
    addRowTopBtn.addEventListener('click', () => addRow(true));
    addRowBottomBtn.addEventListener('click', () => addRow(false));
    removeRowTopBtn.addEventListener('click', () => removeRow(true));
    removeRowBottomBtn.addEventListener('click', () => removeRow(false));
    generateBtn.addEventListener('click', generateCode);
    downloadPdfBtn.addEventListener('click', downloadPdf);
    toolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toolBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            currentTool = btn.dataset.tool;
            drawingCanvas.classList.toggle('eraser-cursor', currentTool === 'eraser');
            drawingCanvas.classList.toggle('move-cursor', currentTool === 'move');
            selectedFeature = null;
            redrawAll();
        });
    });
    drawingCanvas.addEventListener('mousedown', handleMouseDown);
    drawingCanvas.addEventListener('mousemove', handleMouseMove);
    drawingCanvas.addEventListener('mouseup', handleMouseUp);
    drawingCanvas.addEventListener('click', handleClick);
    saveDrawingBtn.addEventListener('click', saveDrawing);
    loadDrawingBtn.addEventListener('click', () => loadDrawingInput.click());
    loadDrawingInput.addEventListener('change', handleFileLoad);

    catalogBtn.addEventListener('click', openCatalog);
    closeModalBtn.addEventListener('click', closeCatalog);
    backToThemesBtn.addEventListener('click', showThemes);
    window.addEventListener('click', (e) => {
        if (e.target == catalogModal) closeCatalog();
    });

    // Initialisatie
    initializeGrid();
});
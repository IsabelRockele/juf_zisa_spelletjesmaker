document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("roosterCanvas");
    const ctx = canvas.getContext("2d");

    const genereerBtn = document.getElementById("genereerBtn");
    const oplossingBtn = document.getElementById("oplossingBtn");
    const downloadPngBtn = document.getElementById("downloadPngBtn");
    const downloadPdfBtn = document.getElementById("downloadPdfBtn");
    const bewerkingCheckboxes = document.querySelectorAll('#bewerking-keuze input[type="checkbox"]');
    const puzzelTypeSelect = document.getElementById("puzzelType");
    const gridSizeSelect = document.getElementById("gridSize");
    const numberRangeSelect = document.getElementById("numberRange");
    const getalbereikGroup = document.getElementById("getalbereik-group");
    const tafelsGroup = document.getElementById("tafels-group");
    const tafelKeuzeDiv = document.getElementById("tafelKeuze");
    const tafelHintSpan = document.getElementById("tafelHint");
    const aantalTabellenRadios = document.querySelectorAll('input[name="aantalTabellen"]');
    const legeVakkenSlider = document.getElementById("legeVakken");
    const legeVakkenLabel = document.getElementById("legeVakkenLabel");

    let puzzles = [];

    for (let i = 1; i <= 10; i++) {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = i;
        const span = document.createElement('span');
        span.textContent = i;
        label.appendChild(checkbox);
        label.appendChild(span);
        tafelKeuzeDiv.appendChild(label);
    }
    const tafelCheckboxes = document.querySelectorAll('#tafelKeuze input[type="checkbox"]');

    function updateTafelHint() {
        const gridSize = parseInt(gridSizeSelect.value);
        const vereistAantal = gridSize - 1;
        tafelHintSpan.textContent = `(kies er minstens ${vereistAantal})`;
    }

    function generateWorksheet() {
        const aantal = parseInt(document.querySelector('input[name="aantalTabellen"]:checked').value);
        let bewerkingen = Array.from(bewerkingCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        
        if (bewerkingen.length === 0) {
            puzzles = [];
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        // VALIDATIE TOEGEVOEGD
        if (bewerkingen.includes('x')) {
            const gridSize = parseInt(gridSizeSelect.value);
            const geselecteerdeTafels = Array.from(tafelCheckboxes).filter(cb => cb.checked);
            const vereistAantal = gridSize - 1;

            if (geselecteerdeTafels.length < vereistAantal) {
                alert(`Voor een ${gridSize}x${gridSize} rooster met vermenigvuldigen, moet je minstens ${vereistAantal} verschillende tafels selecteren.`);
                puzzles = [];
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                return;
            }
        }

        puzzles = [];
        for (let i = 0; i < aantal; i++) {
            const bewerking = bewerkingen[i % bewerkingen.length];
            const puzzle = generateSinglePuzzle(bewerking);
            if (puzzle) {
                puzzles.push(puzzle);
            }
        }
        drawWorksheet();
    }

    function generateSinglePuzzle(bewerking) {
        const gridSize = parseInt(gridSizeSelect.value);
        const numberRange = parseInt(numberRangeSelect.value);
        const aantalLegeVakken = parseInt(legeVakkenSlider.value);
        const geselecteerdeTafels = Array.from(tafelCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => parseInt(cb.value));

        if (bewerking === 'x' && geselecteerdeTafels.length === 0) {
            geselecteerdeTafels.push(2, 5, 10);
        }

        const solutionGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
        solutionGrid[0][0] = bewerking;

        const kolomkoppen = [];
        let kAttempts = 0;
        while (kolomkoppen.length < gridSize - 1 && kAttempts < 100) {
            kAttempts++;
            let getal;
            
            const maxStartGetal = (bewerking === '+') ? numberRange - 1 : numberRange;
            
            if (bewerking === 'x') {
                getal = geselecteerdeTafels[Math.floor(Math.random() * geselecteerdeTafels.length)];
            } else {
                getal = Math.floor(Math.random() * maxStartGetal) + 1;
                if (getal > maxStartGetal) getal = maxStartGetal;
            }
            if (!kolomkoppen.includes(getal)) {
                kolomkoppen.push(getal);
            }
        }
        if (kolomkoppen.length < gridSize - 1) {
             console.error("Kon geen unieke kolomkoppen genereren.");
             return null;
        }

        for (let c = 1; c < gridSize; c++) {
            solutionGrid[0][c] = kolomkoppen[c - 1];
        }

        const rijkoppen = new Set();
        for (let r = 1; r < gridSize; r++) {
            let rijkop, rijwaarden;
            let isValid = false;
            let rowAttempts = 0;
            while (!isValid && rowAttempts < 100) {
                rowAttempts++;
                if (bewerking === '+') {
                    const maxKolomkop = Math.max(...kolomkoppen);
                    const maxRijkop = numberRange - maxKolomkop;
                    if (maxRijkop < 1) { break; } 
                    
                    rijkop = Math.floor(Math.random() * maxRijkop) + 1;
                    if (rijkoppen.has(rijkop)) continue;
                    
                    rijwaarden = kolomkoppen.map(k => rijkop + k);
                    isValid = true;
                } else if (bewerking === '-') {
                    const maxKolomkop = Math.max(...kolomkoppen);
                    if (numberRange <= maxKolomkop) { break; } 
                    rijkop = Math.floor(Math.random() * (numberRange - maxKolomkop)) + maxKolomkop + 1;
                    if (rijkoppen.has(rijkop)) continue;
                    rijwaarden = kolomkoppen.map(k => rijkop - k);
                    if (rijwaarden.some(res => res <= 0)) continue;
                    isValid = true;
                } else if (bewerking === 'x') {
                    rijkop = geselecteerdeTafels[Math.floor(Math.random() * geselecteerdeTafels.length)];
                    if (rijkoppen.has(rijkop)) continue;
                    rijwaarden = kolomkoppen.map(k => rijkop * k);
                    isValid = true;
                }
            }

            if (isValid) {
                rijkoppen.add(rijkop);
                solutionGrid[r][0] = rijkop;
                for (let c = 1; c < gridSize; c++) {
                    solutionGrid[r][c] = rijwaarden[c - 1];
                }
            } else {
                console.error(`Kon geen geldige rij genereren voor bewerking: ${bewerking}`);
                return null;
            }
        }

        const displayGrid = JSON.parse(JSON.stringify(solutionGrid));
        const mogelijkeVakken = [];
        for (let r = 1; r < gridSize; r++) {
            for (let c = 1; c < gridSize; c++) {
                mogelijkeVakken.push({ r, c });
            }
        }
        shuffleArray(mogelijkeVakken);
        for (let i = 0; i < Math.min(aantalLegeVakken, mogelijkeVakken.length); i++) {
            const { r, c } = mogelijkeVakken[i];
            displayGrid[r][c] = '';
        }
        return { solutionGrid, displayGrid };
    }
    
    function drawWorksheet() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const aantal = puzzles.length;
        if (aantal === 0) {
             const bewerkingen = Array.from(bewerkingCheckboxes).filter(cb => cb.checked);
             if (bewerkingen.length > 0) {
                ctx.font = "16px Arial";
                ctx.textAlign = 'center';
                ctx.fillStyle = 'black';
                ctx.fillText("Kon geen rooster genereren. Controleer de instellingen.", canvas.width / 2, canvas.height / 2);
             }
            return;
        }

        const layout = { 1: { x: 1, y: 1 }, 2: { x: 2, y: 1 }, 4: { x: 2, y: 2 } }[aantal];
        const padding = 20;
        const totalWidth = canvas.width - padding * (layout.x + 1);
        const totalHeight = canvas.height - padding * (layout.y + 1);
        const singleGridWidth = totalWidth / layout.x;
        const singleGridHeight = totalHeight / layout.y;

        puzzles.forEach((puzzle, index) => {
            const gridX = (index % layout.x) * (singleGridWidth + padding) + padding;
            const gridY = Math.floor(index / layout.x) * (singleGridHeight + padding) + padding;
            drawSingleGrid(puzzle.displayGrid, gridX, gridY, singleGridWidth, singleGridHeight);
        });
    }

    function drawSolutions() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const aantal = puzzles.length;
        if (aantal === 0) return;

        const layout = { 1: { x: 1, y: 1 }, 2: { x: 2, y: 1 }, 4: { x: 2, y: 2 } }[aantal];
        const padding = 20;
        const totalWidth = canvas.width - padding * (layout.x + 1);
        const totalHeight = canvas.height - padding * (layout.y + 1);
        const singleGridWidth = totalWidth / layout.x;
        const singleGridHeight = totalHeight / layout.y;

        puzzles.forEach((puzzle, index) => {
            const gridX = (index % layout.x) * (singleGridWidth + padding) + padding;
            const gridY = Math.floor(index / layout.x) * (singleGridHeight + padding) + padding;
            drawSingleGrid(puzzle.solutionGrid, gridX, gridY, singleGridWidth, singleGridHeight, true);
        });
    }

    function drawSingleGrid(gridData, x, y, width, height, isSolution = false) {
        const gridSize = gridData.length;
        const cellSize = width / gridSize;
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1;
        ctx.font = `${cellSize * 0.4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const cellX = x + c * cellSize;
                const cellY = y + r * cellSize;
                
                if (r === 0 || c === 0) {
                    ctx.fillStyle = '#f0faff';
                    ctx.fillRect(cellX, cellY, cellSize, cellSize);
                }
                
                ctx.strokeRect(cellX, cellY, cellSize, cellSize);
                
                if (gridData[r][c] !== null && gridData[r][c] !== '') {
                    const isAnswerCell = isSolution && puzzles.some(p => p.displayGrid[r]?.[c] === '');
                    ctx.fillStyle = isAnswerCell ? '#008000' : (r === 0 || c === 0) ? '#004080' : 'black';
                    ctx.fillText(gridData[r][c], cellX + cellSize / 2, cellY + cellSize / 2);
                }
            }
        }
    }
    
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function updateControlsVisibility() {
        const bewerkingen = Array.from(bewerkingCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        const showTafels = bewerkingen.includes('x');
        const showRange = bewerkingen.includes('+') || bewerkingen.includes('-');
        tafelsGroup.style.display = showTafels ? 'block' : 'none';
        getalbereikGroup.style.display = showRange ? 'block' : 'none';
    }

    genereerBtn.addEventListener("click", generateWorksheet);
    oplossingBtn.addEventListener("click", drawSolutions);

    const controlsToListen = [puzzelTypeSelect, numberRangeSelect];
    controlsToListen.forEach(control => control.addEventListener('change', generateWorksheet));
    
    gridSizeSelect.addEventListener('change', () => {
        updateTafelHint();
        generateWorksheet();
    });

    bewerkingCheckboxes.forEach(cb => cb.addEventListener("change", () => {
        updateControlsVisibility();
        generateWorksheet();
    }));

    tafelCheckboxes.forEach(cb => cb.addEventListener("change", generateWorksheet));
    aantalTabellenRadios.forEach(r => r.addEventListener("change", generateWorksheet));
    
    legeVakkenSlider.addEventListener("input", () => {
        legeVakkenLabel.textContent = legeVakkenSlider.value;
    });
    legeVakkenSlider.addEventListener("change", generateWorksheet);

    downloadPngBtn.addEventListener("click", () => {
        const link = document.createElement('a');
        link.download = 'rekentabellen.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    downloadPdfBtn.addEventListener("click", async () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const dataURL = canvas.toDataURL("image/png");
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgWidth / imgHeight;
        let pdfImgWidth = pageWidth - 2 * margin;
        let pdfImgHeight = pdfImgWidth / ratio;
        if (pdfImgHeight > pageHeight - 2 * margin) {
            pdfImgHeight = pageHeight - 2 * margin;
            pdfImgWidth = pdfImgHeight * ratio;
        }
        const xPos = (pageWidth - pdfImgWidth) / 2;
        const yPos = (pageHeight - pdfImgHeight) / 2;
        doc.addImage(dataURL, 'PNG', xPos, yPos, pdfImgWidth, pdfImgHeight);
        doc.save("rekentabellen.pdf");
    });

    legeVakkenLabel.textContent = legeVakkenSlider.value;
    if (Array.from(bewerkingCheckboxes).filter(cb => cb.checked).length === 0) {
        document.querySelector('#bewerking-keuze input[value="+"]').checked = true;
    }
    updateControlsVisibility();
    updateTafelHint();
    generateWorksheet();
});
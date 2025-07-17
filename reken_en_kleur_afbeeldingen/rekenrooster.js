document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("roosterCanvas");
    const ctx = canvas.getContext("2d");
    
    // DOM-elementen
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
    const aantalTabellenRadios = document.querySelectorAll('input[name="aantalTabellen"]');
    const legeVakkenSlider = document.getElementById("legeVakken");
    const legeVakkenLabel = document.getElementById("legeVakkenLabel");

    let puzzles = [];

    // --- Dynamisch de tafel-checkboxes genereren ---
    for (let i = 1; i <= 10; i++) {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = i;
        if ([2, 3, 5, 10].includes(i)) checkbox.checked = true;
        
        const span = document.createElement('span');
        span.textContent = i;
        
        label.appendChild(checkbox);
        label.appendChild(span);
        tafelKeuzeDiv.appendChild(label);
    }
    const tafelCheckboxes = document.querySelectorAll('#tafelKeuze input[type="checkbox"]');

    
    // --- Hoofdfunctie die het hele werkblad genereert ---
    function generateWorksheet() {
        const aantal = parseInt(document.querySelector('input[name="aantalTabellen"]:checked').value);
        let bewerkingen = Array.from(bewerkingCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        if (bewerkingen.length === 0) {
            bewerkingen.push('+');
            document.querySelector('#bewerking-keuze input[value="+"]').checked = true;
        }

        puzzles = [];
        for (let i = 0; i < aantal; i++) {
            const bewerking = bewerkingen[i % bewerkingen.length];
            puzzles.push(generateSinglePuzzle(bewerking));
        }
        drawWorksheet();
    }

    // --- Genereert één puzzel ---
    function generateSinglePuzzle(bewerking) {
        const gridSize = parseInt(gridSizeSelect.value);
        const numberRange = parseInt(numberRangeSelect.value);
        const puzzleType = puzzelTypeSelect.value;
        const legeVakken = parseInt(legeVakkenSlider.value);
        
        const solutionGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
        solutionGrid[0][0] = bewerking;

        let headers = { row: [], col: [] };
        if (bewerking === '+' || bewerking === '-') {
            headers.row = Array.from({ length: gridSize - 1 }, () => Math.floor(Math.random() * numberRange) + 1);
            headers.col = Array.from({ length: gridSize - 1 }, () => Math.floor(Math.random() * numberRange) + 1);
        } else { // 'x' en ':'
            const geselecteerdeTafels = Array.from(tafelCheckboxes).filter(cb => cb.checked).map(cb => parseInt(cb.value));
            if (geselecteerdeTafels.length === 0) geselecteerdeTafels.push(2, 5, 10);
            headers.row = Array.from({ length: gridSize - 1 }, () => geselecteerdeTafels[Math.floor(Math.random() * geselecteerdeTafels.length)]);
            headers.col = Array.from({ length: gridSize - 1 }, () => Math.floor(Math.random() * 10) + 1);
        }

        for (let i = 1; i < gridSize; i++) {
            solutionGrid[0][i] = headers.col[i-1];
            solutionGrid[i][0] = headers.row[i-1];
        }

        for (let r = 1; r < gridSize; r++) {
            for (let c = 1; c < gridSize; c++) {
                const num1 = solutionGrid[r][0];
                const num2 = solutionGrid[0][c];
                switch(bewerking) {
                    case '+': solutionGrid[r][c] = num1 + num2; break;
                    case '-': solutionGrid[r][0] = num1 + num2; solutionGrid[r][c] = num1; break;
                    case 'x': solutionGrid[r][c] = num1 * num2; break;
                    case ':': solutionGrid[r][0] = num1 * num2; solutionGrid[r][c] = num1; break;
                }
            }
        }
        
        let displayGrid = JSON.parse(JSON.stringify(solutionGrid));

        if (puzzleType === 'klassiek') {
            let coords = [];
            for (let r = 1; r < gridSize; r++) for (let c = 1; c < gridSize; c++) coords.push({r, c});
            shuffleArray(coords);
            for(let i = 0; i < Math.min(legeVakken, coords.length); i++) displayGrid[coords[i].r][coords[i].c] = '';
        
        } else { // --- AANGEPAST: Verbeterde 'omgekeerd' logica ---
            // 1. Maak alle uitkomsten leeg
            for (let r = 1; r < gridSize; r++) {
                for (let c = 1; c < gridSize; c++) {
                    displayGrid[r][c] = '';
                }
            }

            // 2. Bepaal welke startgetallen (headers) te verwijderen
            let allHeaders = [];
            for (let i = 1; i < gridSize; i++) {
                allHeaders.push({r: i, c: 0}); // Headers in de eerste kolom
                allHeaders.push({r: 0, c: i}); // Headers in de eerste rij
            }
            shuffleArray(allHeaders);
            const headersToRemove = allHeaders.slice(0, Math.min(legeVakken, allHeaders.length));
            const removedSet = new Set(headersToRemove.map(h => `${h.r},${h.c}`));

            // 3. Verwijder de geselecteerde headers en plaats een hint voor elke
            headersToRemove.forEach(header => {
                displayGrid[header.r][header.c] = ''; // Maak de header leeg

                // Zoek een partner-header die NIET verwijderd is om een hint te kunnen plaatsen
                if (header.r === 0) { // Een header in de bovenste rij is verwijderd
                    for (let r_clue = 1; r_clue < gridSize; r_clue++) {
                        if (!removedSet.has(`${r_clue},0`)) {
                            displayGrid[r_clue][header.c] = solutionGrid[r_clue][header.c];
                            break; // Eén hint is genoeg
                        }
                    }
                } else { // Een header in de linker kolom is verwijderd
                    for (let c_clue = 1; c_clue < gridSize; c_clue++) {
                        if (!removedSet.has(`0,${c_clue}`)) {
                             displayGrid[header.r][c_clue] = solutionGrid[header.r][c_clue];
                             break; // Eén hint is genoeg
                        }
                    }
                }
            });
        }
        return { solutionGrid, displayGrid };
    }

    // --- Functies om de roosters te tekenen ---
    function drawWorksheet() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const aantal = puzzles.length;
        if (aantal === 0) return;

        const layout = { 1: {x:1, y:1}, 2: {x:2, y:1}, 4: {x:2, y:2}}[aantal];
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
        drawWorksheet(); 
        const aantal = puzzles.length;
        if (aantal === 0) return;

        const layout = { 1: {x:1, y:1}, 2: {x:2, y:1}, 4: {x:2, y:2}}[aantal];
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
                    const originalValue = puzzles[0].solutionGrid[r][c]; // Pak de waarde uit de oplossing
                    const displayValue = gridData[r][c];
                    // Als het de oplossing is en de waarde was leeg in de puzzel, maak het groen
                    const wasEmpty = puzzles.find(p => p.solutionGrid === gridData)?.displayGrid[r][c] === '' || gridData[r][c] !== displayValue;
                    ctx.fillStyle = (isSolution && wasEmpty) ? '#008000' : (r === 0 || c === 0) ? '#004080' : 'black';
                    ctx.fillText(displayValue, cellX + cellSize / 2, cellY + cellSize / 2);
                }
            }
        }
    }

    // --- Helper Functies & Event Listeners ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function updateControlsVisibility() {
        const bewerkingen = Array.from(bewerkingCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        const showTafels = bewerkingen.includes('x') || bewerkingen.includes(':');
        const showRange = bewerkingen.includes('+') || bewerkingen.includes('-');
        
        tafelsGroup.style.display = showTafels ? 'block' : 'none';
        getalbereikGroup.style.display = showRange ? 'block' : 'none';
    }

    genereerBtn.addEventListener("click", generateWorksheet);
    oplossingBtn.addEventListener("click", drawSolutions);
    
    [puzzelTypeSelect, gridSizeSelect, numberRangeSelect].forEach(el => el.addEventListener("change", generateWorksheet));
    bewerkingCheckboxes.forEach(cb => cb.addEventListener("change", () => { updateControlsVisibility(); generateWorksheet(); }));
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

    // --- Initialisatie ---
    legeVakkenLabel.textContent = legeVakkenSlider.value;
    updateControlsVisibility();
    generateWorksheet();
});
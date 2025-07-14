const canvas = document.getElementById("mainCanvas");
const ctx = canvas.getContext("2d");

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Helper function to get random integer
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to get a random letter
function getRandomLetter() {
    return ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
}

/**
 * Places a word into the grid at a given starting position and direction.
 * @param {Array<Array<string>>} grid The puzzle grid.
 * @param {string} word The word to place.
 * @param {number} row The starting row.
 * @param {number} col The starting column.
 * @param {number} dr The row increment (-1, 0, or 1).
 * @param {number} dc The column increment (-1, 0, or 1).
 * @returns {boolean} True if the word was successfully placed, false otherwise.
 */
function placeWord(grid, word, row, col, dr, dc) {
    const wordLength = word.length;
    const gridSize = grid.length;

    // Check if word fits within grid boundaries
    for (let i = 0; i < wordLength; i++) {
        const r = row + i * dr;
        const c = col + i * dc;
        if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) {
            return false;
        }
        // Check for conflicts with existing letters (only if it's not the same letter)
        if (grid[r][c] !== "" && grid[r][c] !== word[i]) {
            return false;
        }
    }

    // Place the word
    for (let i = 0; i < wordLength; i++) {
        const r = row + i * dr;
        const c = col + i * dc;
        grid[r][c] = word[i];
    }
    return true;
}

/**
 * Generates a word search puzzle grid.
 * @param {Array<string>} words The list of words to include.
 * @param {number} gridSize The size of the square grid (e.g., 10 for 10x10).
 * @param {Object} directions An object indicating allowed directions (horizontaal, verticaal, diagonaal).
 * @returns {Array<Array<string>>} The generated puzzle grid.
 */
function generateWordSearch(words, gridSize, directions) {
    let grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(""));
    const possibleDirections = [];

    if (directions.horizontaal) {
        possibleDirections.push({ dr: 0, dc: 1 }); // Horizontal (forward)
        possibleDirections.push({ dr: 0, dc: -1 }); // Horizontal (backward)
    }
    if (directions.verticaal) {
        possibleDirections.push({ dr: 1, dc: 0 }); // Vertical (down)
        possibleDirections.push({ dr: -1, dc: 0 }); // Vertical (up)
    }
    if (directions.diagonaal) {
        possibleDirections.push({ dr: 1, dc: 1 }); // Diagonal (down-right)
        possibleDirections.push({ dr: 1, dc: -1 }); // Diagonal (down-left)
        possibleDirections.push({ dr: -1, dc: 1 }); // Diagonal (up-right)
        possibleDirections.push({ dr: -1, dc: -1 }); // Diagonal (up-left)
    }

    // Sort words by length descending to place longer words first
    words.sort((a, b) => b.length - a.length);

    let placedWords = [];
    const MAX_PLACEMENT_ATTEMPTS = 500; // Attempts per word

    for (const word of words) {
        let wordPlaced = false;
        let attempts = 0;

        while (!wordPlaced && attempts < MAX_PLACEMENT_ATTEMPTS) {
            attempts++;
            const startRow = getRandomInt(0, gridSize - 1);
            const startCol = getRandomInt(0, gridSize - 1);
            const { dr, dc } = possibleDirections[getRandomInt(0, possibleDirections.length - 1)];

            // Create a temporary grid to test placement without modifying the main grid yet
            let tempGrid = JSON.parse(JSON.stringify(grid));
            if (placeWord(tempGrid, word, startRow, startCol, dr, dc)) {
                grid = tempGrid; // If successful, commit changes to the main grid
                placedWords.push(word);
                wordPlaced = true;
            }
        }
        if (!wordPlaced) {
            console.warn(`Could not place word: ${word}`);
        }
    }

    // Fill remaining empty cells with random letters
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (grid[r][c] === "") {
                grid[r][c] = getRandomLetter();
            }
        }
    }

    return grid;
}

// Function to draw the grid
function tekenRaster(cols, rows, vakBreedte, vakHoogte) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;

    for (let i = 0; i <= cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * vakBreedte, 0);
        ctx.lineTo(i * vakBreedte, canvas.height);
        ctx.stroke();
    }

    for (let j = 0; j <= rows; j++) {
        ctx.beginPath();
        ctx.moveTo(0, j * vakHoogte);
        ctx.lineTo(canvas.width, j * vakHoogte);
        ctx.stroke();
    }
}

// Function to update word count message
function updateWordCountMessage(currentWordCount) {
    const woordAantalMelding = document.getElementById("woordAantalMelding");
    const MIN_WORDS = 8;
    const MAX_WORDS = 20;

    if (currentWordCount < MIN_WORDS) {
        const remaining = MIN_WORDS - currentWordCount;
        woordAantalMelding.textContent = `Je moet nog ${remaining} woord(en) toevoegen.`;
        woordAantalMelding.style.color = "red";
    } else if (currentWordCount > MAX_WORDS) {
        const excess = currentWordCount - MAX_WORDS;
        woordAantalMelding.textContent = `Te veel woorden: ${excess} woord(en) worden genegeerd.`;
        woordAantalMelding.style.color = "orange";
    } else {
        woordAantalMelding.textContent = `Aantal woorden: ${currentWordCount} (OK)`;
        woordAantalMelding.style.color = "#004080";
    }
}


// Main function to generate and display the word search
function genereerWoordzoeker() {
    const woordenInput = document.getElementById("woordenInput").value;
    let woorden = woordenInput.split('\n')
                              .map(word => word.trim().toUpperCase())
                              .filter(word => word.length > 0 && /^[A-Z]+$/.test(word));

    updateWordCountMessage(woorden.length);

    const rasterFormaat = document.getElementById("rasterFormaat").value;
    let gridSize;

    const MIN_WORDS = 8;
    const MAX_WORDS = 20;
    const MAX_WORD_LENGTH = 12;
    const MIN_GRID_SIZE_AUTO = 10;

    const meldingContainer = document.getElementById("meldingContainer");
    meldingContainer.innerHTML = "";
    meldingContainer.style.color = "#004080";

    if (woorden.length < MIN_WORDS) {
        meldingContainer.style.color = "red";
        meldingContainer.innerHTML = `Voer minimaal ${MIN_WORDS} geldige woorden in om een puzzel te genereren.`;
        tekenRaster(1,1,canvas.width,canvas.height);
        document.getElementById("woordenLijst").innerHTML = "";
        return;
    }

    if (woorden.length > MAX_WORDS) {
        woorden = woorden.slice(0, MAX_WORDS);
    }

    let wordsLongerThanTen = false;
    for (const word of woorden) {
        if (word.length > 10) {
            wordsLongerThanTen = true;
            break;
        }
    }

    let needsTruncationWarning = false;
    woorden = woorden.map(word => {
        if (word.length > MAX_WORD_LENGTH) {
            needsTruncationWarning = true;
            return word.substring(0, MAX_WORD_LENGTH);
        }
        return word;
    });

    if (needsTruncationWarning) {
        if (meldingContainer.innerHTML !== "") meldingContainer.innerHTML += "<br>";
        meldingContainer.style.color = "orange";
        meldingContainer.innerHTML += `Sommige woorden zijn te lang en zijn afgekapt tot ${MAX_WORD_LENGTH} letters.`;
    }

    if (rasterFormaat === "10x10" && wordsLongerThanTen) {
        if (meldingContainer.innerHTML !== "") meldingContainer.innerHTML += "<br>";
        meldingContainer.style.color = "orange";
        meldingContainer.innerHTML += `Let op: Je hebt een 10x10 raster geselecteerd, maar er zijn woorden langer dan 10 letters. Deze zullen afgekapt worden of mogelijk moeilijker te plaatsen zijn.`;
    }

    if (rasterFormaat === "auto") {
        let maxWordLength = 0;
        if (woorden.length > 0) {
            maxWordLength = Math.max(...woorden.map(w => w.length));
        }
        gridSize = Math.max(maxWordLength + 5, Math.ceil(Math.sqrt(woorden.length) * 4) + 5);
        gridSize = Math.min(gridSize, 25);
        gridSize = Math.max(gridSize, MIN_GRID_SIZE_AUTO);
    } else {
        gridSize = parseInt(rasterFormaat.split('x')[0]);
    }

    const allowedDirections = {
        horizontaal: document.querySelector('input[name="richting"][value="horizontaal"]').checked,
        verticaal: document.querySelector('input[name="richting"][value="verticaal"]').checked,
        diagonaal: document.querySelector('input[name="richting"][value="diagonaal"]').checked
    };

    if (!allowedDirections.horizontaal && !allowedDirections.verticaal && !allowedDirections.diagonaal) {
        meldingContainer.style.color = "red";
        if (meldingContainer.innerHTML !== "") meldingContainer.innerHTML += "<br>";
        meldingContainer.innerHTML += "Selecteer minstens één zoekrichting.";
        tekenRaster(1,1,canvas.width,canvas.height);
        document.getElementById("woordenLijst").innerHTML = "";
        return;
    }

    const vakBreedte = canvas.width / gridSize;
    const vakHoogte = canvas.height / gridSize;

    tekenRaster(gridSize, gridSize, vakBreedte, vakHoogte);

    const puzzleGrid = generateWordSearch(woorden, gridSize, allowedDirections);

    ctx.font = `${Math.min(vakHoogte * 0.6, 30)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000";

    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            ctx.fillText(puzzleGrid[r][c], c * vakBreedte + vakBreedte / 2, r * vakHoogte + vakHoogte / 2);
        }
    }

    const woordenLijstDiv = document.getElementById("woordenLijst");
    woordenLijstDiv.innerHTML = "";

    woorden.sort();

    const ul = document.createElement("ul");
    ul.className = "kolommen";
    woorden.forEach(word => {
        const li = document.createElement("li");
        li.textContent = word;
        ul.appendChild(li);
    });
    woordenLijstDiv.appendChild(ul);
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    genereerWoordzoeker();

    document.getElementById("genereerBtn").addEventListener("click", genereerWoordzoeker);
    document.getElementById("woordenInput").addEventListener("input", genereerWoordzoeker);
    document.getElementById("rasterFormaat").addEventListener("change", genereerWoordzoeker);
    document.querySelectorAll('input[name="richting"]').forEach(checkbox => {
        checkbox.addEventListener("change", genereerWoordzoeker);
    });
});

// Download functions
document.getElementById("downloadPngBtn").addEventListener("click", () => {
    const dataURL = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = "woordzoeker.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

document.getElementById("downloadPdfBtn").addEventListener("click", async () => {
    const dataURL = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add title for the whole document (Woordzoeker)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(0, 64, 128); // #004080
    doc.text("Woordzoeker", pageWidth / 2, 20, { align: 'center' });

    // Add puzzle image
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;

    let pdfImgWidth = pageWidth * 0.8;
    let pdfImgHeight = pdfImgWidth / ratio;

    // Verklein de max hoogte van de afbeelding nog iets om meer ruimte onder te laten
    if (pdfImgHeight > pageHeight * 0.55) {
        pdfImgHeight = pageHeight * 0.55;
        pdfImgWidth = pdfImgHeight * ratio;
    }

    const xPosImg = (pageWidth - pdfImgWidth) / 2;
    const yPosImg = 30;

    doc.addImage(dataURL, 'PNG', xPosImg, yPosImg, pdfImgWidth, pdfImgHeight);

    // Get words to display
    const woorden = Array.from(document.querySelectorAll('#woordenLijst li')).map(li => li.textContent);

    // Calculate layout for word list (3 columns)
    const listTitleFontSize = 16;
    const wordFontSize = 12;
    const lineHeight = 7;
    const bulletRadius = 2.5; // Radius van het bolletje in mm (ca. 5mm diameter)
    const bulletTextGap = 2; // Ruimte tussen bolletje en tekst in mm
    const columnPadding = 5; // Padding binnen elke kolom voor tekst
    const listMarginTop = 10; // Marge tussen puzzel en woordenlijst

    let listStartY = yPosImg + pdfImgHeight + listMarginTop;

    // Check of er een nieuwe pagina nodig is voor de woordenlijst.
    // De drempel is de hoogte die nodig is voor de titel + de hoogste kolom + marge.
    // Dit is een schatting en kan fijnafstemming vereisen.
    const estimatedListHeight = listTitleFontSize / doc.internal.scaleFactor + (Math.ceil(woorden.length / 3) * lineHeight) + 10; // 10 is voor extra marge onderaan de lijst
    
    if (listStartY + estimatedListHeight > pageHeight) {
        doc.addPage();
        listStartY = 20; // Reset Y voor nieuwe pagina
    }

    // Add "Woorden om te vinden:" title above the first column
    doc.setFontSize(listTitleFontSize);
    doc.setTextColor(0, 64, 128);
    const firstColumnStartX = 20;
    doc.text("Woorden om te vinden:", firstColumnStartX, listStartY);

    listStartY += listTitleFontSize / 2 + 5; // Verplaats naar beneden na titel voor woorden

    doc.setFontSize(wordFontSize);
    doc.setTextColor(0, 0, 0);

    const outerMargin = 20;
    const columnGap = 20;
    const totalContentWidth = pageWidth - (2 * outerMargin); // Totale beschikbare breedte voor kolommen en gaten
    const singleColumnWidth = (totalContentWidth - (2 * columnGap)) / 3;

    const itemsPerColumn = Math.ceil(woorden.length / 3);
    if (itemsPerColumn === 0) itemsPerColumn = 1;

    for (let i = 0; i < woorden.length; i++) {
        const word = woorden[i];
        const currentColumnIndex = Math.floor(i / itemsPerColumn);
        let currentWordY = listStartY + (i % itemsPerColumn) * lineHeight;

        let currentColumnX = outerMargin + currentColumnIndex * (singleColumnWidth + columnGap);
        
        // Teken het bolletje (cirkel)
        doc.circle(currentColumnX + bulletRadius + columnPadding, currentWordY - lineHeight / 2 + (wordFontSize / doc.internal.scaleFactor / 2), bulletRadius, 'D');
        
        // Teken het woord
        doc.text(word, currentColumnX + bulletRadius * 2 + bulletTextGap + columnPadding, currentWordY);
    }

    doc.save("woordzoeker.pdf");
});
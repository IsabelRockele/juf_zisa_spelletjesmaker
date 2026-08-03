document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("mainCanvas");
    const ctx = canvas.getContext("2d");
    
    // Variabelen om de staat van de huidige puzzel op te slaan
    let generatedPaths = [];
    let currentExercises = [];
    let currentShuffledAnswers = [];
    let isSolutionVisible = false;

    // --- Helper Functies ---
    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };
    
    function isTooCloseToOtherPaths(point, allPaths, minDistance) {
        for (const path of allPaths) {
            for (const existingPoint of path) {
                const distance = Math.sqrt(Math.pow(point.x - existingPoint.x, 2) + Math.pow(point.y - existingPoint.y, 2));
                if (distance < minDistance) return true;
            }
        }
        return false;
    }

    // --- Hoofdfunctie ---
    function generateAndDrawMaze() {
        // Reset alles voor een compleet nieuwe puzzel
        isSolutionVisible = false;
        document.getElementById('toggleSolutionBtn').textContent = 'Toon oplossing';
        document.getElementById('genereerBtn').textContent = 'Maak een nieuw doolhof';

        const werkbladType = document.querySelector('input[name="werkbladType"]:checked').value;
        currentExercises = (werkbladType === 'rekenen') ? generateMathExercises() : getWordsFromUI();
        
        // Controleer of er oefeningen zijn gegenereerd
        if (!currentExercises || currentExercises.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "red";
            ctx.font = "20px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Geen opgaven gevonden. Controleer de instellingen.", canvas.width / 2, canvas.height / 2);
            return;
        }
        
        const answers = currentExercises.map(e => e.answer);
        currentShuffledAnswers = shuffleArray([...answers]);

        const allGeneratedWaypoints = [];
        generatedPaths = []; // Maak de paden leeg voor de nieuwe generatie

        // Tijdelijke font instelling voor meten
        ctx.font = "20px Arial";
        ctx.textAlign = "center";

        currentExercises.forEach((exercise, i) => {
            const startIndex = i;
            const endIndex = currentShuffledAnswers.findIndex(ans => ans === exercise.answer);
            
            const numExercises = currentExercises.length;
            const startY = 210;
            const verticalSpacing = numExercises > 1 ? (canvas.height - startY - 90) / (numExercises - 1) : 0;
            const problemX = 100;
        	const answerX = canvas.width - 100;

            const textWidthProblem = ctx.measureText(exercise.problem).width;
            const textWidthAnswer = ctx.measureText(currentShuffledAnswers[endIndex]).width;

            const pathStartX = problemX + (textWidthProblem / 2) + 15;
            const pathEndX = answerX - (textWidthAnswer / 2) - 15;

            const startPoint = { x: pathStartX, y: startY + startIndex * verticalSpacing };
            const endPoint = { x: pathEndX, y: startY + endIndex * verticalSpacing };

            const waypoints = generatePathWaypoints(startPoint, endPoint, allGeneratedWaypoints, i, numExercises);
            allGeneratedWaypoints.push(waypoints);
            generatedPaths.push(waypoints);
        });

        redrawPuzzle(); // Teken de zojuist gegenereerde puzzel
    }

    // --- Functie om de puzzel (opnieuw) te tekenen ZONDER oplossing ---
    function redrawPuzzle() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawWorksheetHeader();

        if (generatedPaths.length === 0) return;

        generatedPaths.forEach(waypoints => {
            drawPuzzlePath(waypoints); 
        });

        // Teken de tekst
        const numExercises = currentExercises.length;
        const startY = 210;
	        const verticalSpacing = numExercises > 1 ? (canvas.height - startY - 90) / (numExercises - 1) : 0;
        const problemX = 100;
        const answerX = canvas.width - 100;
        
        ctx.fillStyle = "black";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        currentExercises.forEach((exercise, i) => {
            const yPos = startY + i * verticalSpacing;
            ctx.fillText(exercise.problem, problemX, yPos);
        });
        currentShuffledAnswers.forEach((answer, i) => {
            const yPos = startY + i * verticalSpacing;
            ctx.fillText(String(answer), answerX, yPos); // Zorg ervoor dat antwoord als string wordt behandeld
        });
    }

    function drawWorksheetHeader() {
        ctx.save();
        ctx.fillStyle = "#253449"; ctx.font = "700 31px Arial"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
        ctx.fillText("Slangendoolhof", 54, 52);
        ctx.fillStyle = "#66758a"; ctx.font = "15px Arial";
        ctx.fillText("Volg elk kronkelpad en verbind de oefening met het juiste antwoord.", 54, 82);
        ctx.strokeStyle = "#aebdca"; ctx.lineWidth = 1.5; ctx.beginPath();
        ctx.moveTo(508, 52); ctx.lineTo(620, 52); ctx.moveTo(665, 52); ctx.lineTo(746, 52); ctx.stroke();
        ctx.fillStyle = "#66758a"; ctx.font = "13px Arial"; ctx.fillText("Naam", 508, 34); ctx.fillText("Datum", 665, 34);
        ctx.fillStyle = "#eaf4fb"; ctx.beginPath(); roundRect(ctx, 48, 122, 150, 42, 12); roundRect(ctx, 602, 122, 150, 42, 12); ctx.fill();
        ctx.fillStyle = "#3478b8"; ctx.font = "700 13px Arial"; ctx.textAlign = "center";
        ctx.fillText("OEFENINGEN", 123, 143); ctx.fillText("ANTWOORDEN", 677, 143);
        ctx.strokeStyle = "#d4e0e9"; ctx.setLineDash([5, 7]); ctx.beginPath(); ctx.moveTo(48, 181); ctx.lineTo(752, 181); ctx.stroke();
        ctx.restore();
    }

    function roundRect(context, x, y, width, height, radius) {
        context.roundRect(x, y, width, height, radius);
    }
    
    // --- Data Generatie Functies ---
    function getWordsFromUI() {
        const pairs = [];
        document.querySelectorAll('.word-pair').forEach(pairEl => {
            const problem = pairEl.querySelector('.problem-word').value.trim();
            const answer = pairEl.querySelector('.answer-word').value.trim();
            if (problem && answer) {
                pairs.push({ problem, answer });
            }
        });
        return pairs;
    }

    function generateMathExercises() {
        let exercises = [];
        const usedAnswers = new Set();
        let numExercises;
        let attempts = 0;
        const maxAttempts = 3000;
        const soort = document.querySelector('input[name="soort"]:checked').value;

        if (soort === "plusmin") {
            const type = document.getElementById("typeOpgave").value;
            const niveau = parseInt(document.getElementById("niveau").value);
            numExercises = parseInt(document.getElementById('aantalPaden').value, 10);
            while (exercises.length < numExercises && attempts < maxAttempts) {
                attempts++;
                let a = getRandomInt(1, niveau);
                let b = getRandomInt(1, niveau);
                let op = type === 'gemengd' ? (Math.random() > 0.5 ? '+' : '-') : (type === 'optellen' ? '+' : '-');
                if (op === '-' && a < b) [a, b] = [b, a];
                if (op === '+' && a + b > niveau) continue;
                const answer = op === '+' ? a + b : a - b;
                if (answer < 0 || usedAnswers.has(answer)) continue;
                usedAnswers.add(answer);
                exercises.push({ problem: `${a} ${op} ${b} =`, answer });
            }
        } else {
            numExercises = parseInt(document.getElementById('aantalPaden').value, 10);
            const type = document.getElementById("typeTafeloefening").value;
            let selectedTables = Array.from(document.querySelectorAll('#tafelKeuze input:checked')).filter(cb => cb.id !== 'selecteerAlles').map(cb => parseInt(cb.value));
            if (selectedTables.length === 0) selectedTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            while (exercises.length < numExercises && attempts < maxAttempts) {
                attempts++;
                let problem, answer;
                const table = selectedTables[getRandomInt(0, selectedTables.length - 1)];
                const factor = getRandomInt(1, 10);
                let op = type === 'gemengd' ? (Math.random() > 0.5 ? 'x' : ':') : (type === 'maal' ? 'x' : ':');
                if (op === 'x') {
                    answer = factor * table;
                    problem = `${factor} x ${table} =`;
                } else {
                    const product = table * factor;
                    if (product === 0 || product % table !== 0) continue;
                    answer = factor;
                    problem = `${product} : ${table} =`;
                }
                if (usedAnswers.has(answer)) continue;
                usedAnswers.add(answer);
                exercises.push({ problem, answer });
            }
        }
        if (exercises.length < numExercises) {
            console.warn(`Kon na ${maxAttempts} pogingen geen ${numExercises} unieke oefeningen vinden.`);
        }
        return exercises;
    }

    function generatePathWaypoints(startPoint, endPoint, allOtherPaths, pathIndex, pathCount) {
        const pageTop = 202, pageBottom = canvas.height - 72;
        const width = endPoint.x - startPoint.x;
        const distributedCenters = [.18, .68, .36, .84, .52, .26, .76, .44, .90, .60];
        const loopCenter = distributedCenters[pathIndex % distributedCenters.length]
            + (Math.random() - .5) * .018;
        const loopBaseY = startPoint.y + (endPoint.y - startPoint.y) * loopCenter;
        const loopDirection = loopBaseY < 420 ? 1 : (loopBaseY > 710 ? -1 : (pathIndex % 2 ? -1 : 1));
        const loop = {
            start: loopCenter - .16, width: .32, direction: loopDirection,
            horizontalRadius: 66 + Math.random() * 18, verticalRadius: 56 + Math.random() * 18
        };
        const phase = pathIndex * 1.45 + Math.random() * .35;
        const bendAmplitude = 88 + Math.random() * 28;
        const bendCount = 1.35 + (pathIndex % 3) * .18 + Math.random() * .12;
        const crossingCenters = [.82, .14, .66, .30, .90, .48, .22, .74, .38, .58];
        const crossingCenter = crossingCenters[pathIndex % crossingCenters.length]
            + (Math.random() - .5) * .025;
        const transitionSteepness = 8 + Math.random() * 1.8;
        const transitionStart = logisticTransition(0, crossingCenter, transitionSteepness);
        const transitionEnd = logisticTransition(1, crossingCenter, transitionSteepness);
        const waypoints = [];
        for (let sample = 0; sample <= 68; sample++) {
            const t = sample / 68;
            const baseX = startPoint.x + width * t;
            const rawTransition = logisticTransition(t, crossingCenter, transitionSteepness);
            const routeProgress = (rawTransition - transitionStart) / (transitionEnd - transitionStart);
            const baseY = startPoint.y + (endPoint.y - startPoint.y) * routeProgress;
            const routeEnvelope = Math.pow(Math.sin(Math.PI * t), 1.18);
            const gentleBend = Math.sin(t * Math.PI * 2 * bendCount + phase)
                * bendAmplitude * routeEnvelope;
            let x = baseX, yOffset = gentleBend;
            const loopProgress = (t - loop.start) / loop.width;
            if (loopProgress >= 0 && loopProgress <= 1) {
                const angle = loopProgress * Math.PI * 2;
                x += Math.sin(angle) * loop.horizontalRadius;
                yOffset += (1 - Math.cos(angle)) * loop.verticalRadius * loop.direction;
            }
            const y = softenVerticalMovement(baseY, yOffset, pageTop + 8, pageBottom - 8);
            waypoints.push({ x, y });
        }
        waypoints[0] = startPoint;
        waypoints[waypoints.length - 1] = endPoint;
        return waypoints;
    }


    function logisticTransition(value, center, steepness) {
        return 1 / (1 + Math.exp(-steepness * (value - center)));
    }


    function softenVerticalMovement(baseY, offset, minimum, maximum) {
        if (Math.abs(offset) < .001) return baseY;
        const direction = Math.sign(offset);
        const available = direction < 0 ? baseY - minimum : maximum - baseY;
        if (available <= 0) return baseY;
        const usable = available * .92;
        return baseY + direction * usable * Math.tanh(Math.abs(offset) / usable);
    }

    // --- Tekenfuncties ---
    function drawPath(waypoints, strokeStyle, lineWidth) {
        if (!waypoints || waypoints.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(waypoints[0].x, waypoints[0].y);
        for (let i = 0; i < waypoints.length - 1; i++) {
            const p0 = waypoints[Math.max(0, i - 1)];
            const p1 = waypoints[i], p2 = waypoints[i + 1];
            const p3 = waypoints[Math.min(waypoints.length - 1, i + 2)];
            ctx.bezierCurveTo(
                p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6,
                p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6,
                p2.x, p2.y
            );
        }
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
    }
    function drawPuzzlePath(waypoints) {
        drawPath(waypoints, "#26323c", 16);
        drawPath(waypoints, "white", 10);
    }
    function drawSolutionPath(waypoints, color) {
        drawPath(waypoints, color, 9);
    }
    
    // --- UI Interactie & Event Listeners ---
    function showSolution() {
        if (generatedPaths.length === 0) return;
        generatedPaths.forEach((waypoints, index) => {
            const color = `hsl(${(index * (360 / generatedPaths.length))}, 90%, 60%)`;
            drawSolutionPath(waypoints, color); 
        });
    }

    function toggleSolution() {
        const btn = document.getElementById('toggleSolutionBtn');
        if (isSolutionVisible) {
            redrawPuzzle();
            btn.textContent = 'Toon oplossing';
        } else {
            showSolution();
            btn.textContent = 'Verberg oplossing';
        }
        isSolutionVisible = !isSolutionVisible;
    }

    function addWordPairRow(problem = '', answer = '') {
        const container = document.getElementById('word-pairs-container');
        const newPairDiv = document.createElement('div');
        newPairDiv.className = 'word-pair';
        newPairDiv.innerHTML = `<input type="text" class="problem-word" placeholder="Woord links" value="${problem}"><input type="text" class="answer-word" placeholder="Woord rechts" value="${answer}"><button class="remove-pair-btn" title="Verwijder dit paar">-</button>`;
        container.appendChild(newPairDiv);
    }

    document.getElementById('add-pair-btn').addEventListener('click', () => {
        addWordPairRow();
        generateAndDrawMaze();
    });
    document.getElementById('word-pairs-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-pair-btn')) {
            e.target.parentElement.remove();
            generateAndDrawMaze();
        }
    });
    document.getElementById('word-pairs-container').addEventListener('input', generateAndDrawMaze);

    const allControls = document.querySelectorAll("#reken-controls select, #reken-controls input");
    allControls.forEach(control => control.addEventListener("change", generateAndDrawMaze));
    
    document.getElementById("genereerBtn").addEventListener("click", generateAndDrawMaze);
    document.getElementById("toggleSolutionBtn").addEventListener("click", toggleSolution);

    document.getElementById("downloadPngBtn").addEventListener("click", () => {
        const dataURL = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataURL; a.download = "doolhof.png"; a.click();
    });
    document.getElementById("downloadPdfBtn").addEventListener("click", async () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const dataURL = canvas.toDataURL("image/png");
        const pageWidth = doc.internal.pageSize.getWidth(), pageHeight = doc.internal.pageSize.getHeight();
        const ratio = canvas.width / canvas.height;
        let imgWidth = pageWidth - 20, imgHeight = imgWidth / ratio;
        if (imgHeight > pageHeight - 20) {
            imgHeight = pageHeight - 20;
            imgWidth = imgHeight * ratio;
        }
        const x = (pageWidth - imgWidth) / 2, y = 10;
        doc.addImage(dataURL, 'PNG', x, y, imgWidth, imgHeight);
        doc.save("doolhof.pdf");
    });
    
    function toggleWerkbladControls() {
        const isRekenen = document.querySelector('input[name="werkbladType"]:checked').value === "rekenen";
        document.getElementById('reken-controls').style.display = isRekenen ? 'block' : 'none';
        document.getElementById('taal-controls').style.display = isRekenen ? 'none' : 'block';
        generateAndDrawMaze();
    }
    document.querySelectorAll('input[name="werkbladType"]').forEach(radio => radio.addEventListener('change', toggleWerkbladControls));

    function toggleRekenenControls() {
        const isPlusMin = document.querySelector('input[name="soort"]:checked').value === "plusmin";
        document.getElementById('keuze-plusmin').style.display = isPlusMin ? 'block' : 'none';
        document.getElementById('keuze-maaldeel').style.display = isPlusMin ? 'none' : 'block';
    }
    document.querySelectorAll('input[name="soort"]').forEach(radio => radio.addEventListener('change', () => {
        toggleRekenenControls();
        generateAndDrawMaze();
    }));
    
    document.getElementById('selecteerAlles').addEventListener('change', (e) => {
        document.querySelectorAll('#tafelKeuze input[type="checkbox"]').forEach(cb => cb.checked = e.target.checked);
    });

    // Initiele setup
    for (let i = 0; i < 6; i++) addWordPairRow();
    toggleWerkbladControls();
    toggleRekenenControls();
});

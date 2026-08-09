document.addEventListener('DOMContentLoaded', () => {
    // --- Referenties naar elementen ---
    const setupScreen = document.getElementById('setup-screen');
    const gameContainer = document.getElementById('game-container');
    const startButton = document.getElementById('start-btn');
    const stopButton = document.getElementById('stop-btn');
    const werkbladButton = document.getElementById('werkblad-btn');
    const previewModal = document.getElementById('preview-modal');
    const previewBody = document.getElementById('preview-body');
    const closePreviewBtn = document.getElementById('close-preview-btn');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const getTargetTotal = () => parseInt(document.querySelector('input[name="targetTotal"]:checked').value,10);
    
    // --- Spel logica ---
    let currentNumber, correctAnswer, mistakes, isLocked = false;
    const targetZone = document.getElementById('target-zone');
    const optionsZone = document.getElementById('options-zone');
    const feedbackEl = document.getElementById('feedback');
    startButton.addEventListener('click', () => { setupScreen.style.display = 'none'; gameContainer.style.display = 'block'; newExercise(); });
    stopButton.addEventListener('click', () => { gameContainer.style.display = 'none'; setupScreen.style.display = 'block'; });
    
    function newExercise() { 
        isLocked = false; 
        mistakes = 0; 
        targetZone.innerHTML = ''; 
        optionsZone.innerHTML = ''; 
        feedbackEl.textContent = ''; 
        targetZone.classList.remove('drag-over'); 
        targetZone.style.border = '3px dashed #f8bbd0'; 
        const targetTotal=getTargetTotal(),step=targetTotal===100?10:1;
        currentNumber = (Math.floor(Math.random() * 9) + 1)*step;
        correctAnswer = targetTotal - currentNumber;
        const targetHeart = createHeartHalf(currentNumber, 'left-half'); 
        targetZone.appendChild(targetHeart); 
        let options = [correctAnswer]; 
        while (options.length < 3) { 
            const wrongAnswer = (Math.floor(Math.random() * 9) + 1)*step;
            if (!options.includes(wrongAnswer) && wrongAnswer + currentNumber !== targetTotal) {
                options.push(wrongAnswer); 
            } 
        } 
        options.sort(() => Math.random() - 0.5); 
        options.forEach(num => { 
            const optionHeart = createHeartHalf(num, 'right-half'); 
            optionHeart.draggable = true; 
            optionHeart.addEventListener('dragstart', handleDragStart); 
            optionHeart.addEventListener('dragend', handleDragEnd);
            // TOEGEVOEGD: Event listener voor klikken/tikken
            optionHeart.addEventListener('click', handleHeartClick);
            optionsZone.appendChild(optionHeart); 
        }); 
    }

    function createHeartHalf(number, sideClass) { 
        const heartDiv = document.createElement('div'); 
        heartDiv.className = `heart-half ${sideClass}`; 
        heartDiv.dataset.number = number; 
        const img = document.createElement('img'); 
        img.src = (sideClass === 'left-half') ? '../harten_afbeeldingen/hart01.png' : '../harten_afbeeldingen/hart02.png';
        img.alt = `Helft van een hart met het getal ${number}`; 
        const numberSpan = document.createElement('span'); 
        numberSpan.textContent = number; 
        heartDiv.appendChild(img); 
        heartDiv.appendChild(numberSpan); 
        return heartDiv; 
    }

    // --- Event Handlers voor slepen en klikken ---
    function handleDragStart(e) { 
        if (isLocked) return; 
        e.dataTransfer.setData('text/plain', e.target.dataset.number); 
        setTimeout(() => e.target.classList.add('dragging'), 0); 
    }

    function handleDragEnd(e) { 
        e.target.classList.remove('dragging'); 
    }

    targetZone.addEventListener('dragover', (e) => { 
        e.preventDefault(); 
        if (!isLocked) targetZone.classList.add('drag-over'); 
    });

    targetZone.addEventListener('dragleave', () => { 
        targetZone.classList.remove('drag-over'); 
    });

    targetZone.addEventListener('drop', (e) => { 
        e.preventDefault(); 
        if (isLocked) return; 
        targetZone.classList.remove('drag-over'); 
        const droppedNumber = parseInt(e.dataTransfer.getData('text/plain'), 10);
        const draggedElement = document.querySelector(`.options-container .heart-half[data-number='${droppedNumber}']`);
        checkAnswer(droppedNumber, draggedElement);
    });

    // TOEGEVOEGD: Handler voor de klik-actie
    function handleHeartClick(e) {
        if (isLocked) return;
        const clickedNumber = parseInt(e.currentTarget.dataset.number, 10);
        checkAnswer(clickedNumber, e.currentTarget);
    }
    
    // AANGEPAST: Gecentraliseerde functie om het antwoord te controleren
    function checkAnswer(number, element) {
        if (number === correctAnswer) {
            handleCorrectAnswer();
        } else {
            handleIncorrectAnswer(element);
        }
    }

    function handleCorrectAnswer() { 
        isLocked = true; 
        feedbackEl.textContent = 'Super! ❤️'; 
        feedbackEl.style.color = '#4CAF50'; 
        optionsZone.innerHTML = ''; 
        targetZone.innerHTML = ''; 
        targetZone.style.border = 'none'; 
        const fullHeartContainer = document.createElement('div'); 
        fullHeartContainer.className = 'full-heart-container'; 
        const numberTen = document.createElement('span'); 
        numberTen.textContent = getTargetTotal();
        fullHeartContainer.appendChild(numberTen); 
        targetZone.appendChild(fullHeartContainer); 
        setTimeout(() => { newExercise(); }, 2000); 
    }

    function handleIncorrectAnswer(element) { // AANGEPAST: Ontvangt nu het element
        mistakes++; 
        if (mistakes < 2) { 
            feedbackEl.textContent = 'Oei, probeer het nog een keer!'; 
            feedbackEl.style.color = '#f44336'; 
        } else { 
            isLocked = true; 
            feedbackEl.textContent = 'Jammer! Het juiste hartje was...'; 
            feedbackEl.style.color = '#f44336'; 
            setTimeout(() => { 
                const correctHeart = optionsZone.querySelector(`[data-number='${correctAnswer}']`); 
                if (correctHeart) { // Extra controle
                    correctHeart.classList.add('show-correct-animation');
                }
                setTimeout(newExercise, 2500); 
            }, 500); 
        } 
    }

    // --- Logica voor het werkblad met preview (ongewijzigd) ---
    werkbladButton.addEventListener('click', generateWorksheetPreview);
    closePreviewBtn.addEventListener('click', () => { previewModal.style.display = 'none'; previewBody.innerHTML = ''; });
    downloadPdfBtn.addEventListener('click', async () => {
        const pages = [...previewBody.querySelectorAll('.werkblad-pagina')];
        if (!pages.length) return;
        downloadPdfBtn.textContent = 'Bezig met downloaden...';
        downloadPdfBtn.disabled = true;
        try {
            if (window.OntdekTrial?.authorizeDownload) await window.OntdekTrial.authorizeDownload(pages.length);
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            for (let index = 0; index < pages.length; index++) {
                const canvas = await html2canvas(pages[index], { scale: 3, backgroundColor: '#ffffff' });
                if (index > 0) pdf.addPage();
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
            }
            pdf.save(pages.length > 1 ? 'bundel-verliefde-harten.pdf' : 'werkblad-verliefde-harten.pdf');
            previewModal.style.display = 'none';
            previewBody.innerHTML = '';
        } finally {
            downloadPdfBtn.textContent = 'Download als PDF';
            downloadPdfBtn.disabled = false;
        }
    });

    function generateWorksheetPreview() {
        previewBody.innerHTML = '';
        const selectedTypes = [...document.querySelectorAll('input[name="heartWorksheetType"]:checked')].map(input => input.value);
        if (!selectedTypes.length) {
            alert('Kies minstens één oefenvorm voor je werkblad.');
            return;
        }
        const targetTotal = getTargetTotal();
        selectedTypes.forEach(type => previewBody.appendChild(createWorksheetPage(type, targetTotal)));
        previewModal.style.display = 'flex';
    }

    function getWorksheetPairs(targetTotal) {
        return targetTotal === 100
            ? [[0,100],[10,90],[20,80],[30,70],[40,60],[50,50]]
            : [[1,9],[2,8],[3,7],[4,6],[5,5],[0,10]];
    }

    function createWorksheetPage(type, targetTotal) {
        const page = document.createElement('div');
        page.className = `werkblad-pagina werkblad-${type}`;
        const identity = document.createElement('div');
        identity.className = 'werkblad-identiteit';
        identity.innerHTML = '<span>Naam: <i></i></span><span>Datum: <i></i></span>';
        const title = document.createElement('h2');
        title.textContent = 'Verliefde Harten';
        const instruction = document.createElement('p');
        instruction.className = 'opdracht';
        const instructions = {
            zoeken: `Kleur de twee helften die samen ${targetTotal} vormen in dezelfde kleur.`,
            verbinden: `Verbind elke linkerhelft met de rechterhelft die samen ${targetTotal} vormt.`,
            invullen: `Vul het ontbrekende getal in. Samen vormen de twee helften ${targetTotal}.`,
            knippen: `Knip de helften uit. Zoek de paren die samen ${targetTotal} vormen en plak ze bij elkaar.`
        };
        instruction.textContent = instructions[type];
        const content = document.createElement('div');
        content.className = 'werkblad-inhoud';
        page.appendChild(identity);
        page.appendChild(title);
        page.appendChild(instruction);
        page.appendChild(content);
        const pairs = getWorksheetPairs(targetTotal);

        if (type === 'zoeken' || type === 'knippen') {
            addScatteredHearts(content, pairs, type === 'knippen');
        } else if (type === 'verbinden') {
            addConnectingExercise(content, pairs);
        } else if (type === 'invullen') {
            addFillExercise(content, pairs, targetTotal);
        }
        return page;
    }

    function addScatteredHearts(content, pairs, cutVersion) {
        const heartElements = [];
        pairs.forEach(pair => {
            const rotation = Math.random() * 50 - 25;
            const leftHalf = createWorksheetHeart(pair[0], 'left-half', rotation);
            const rightHalf = createWorksheetHeart(pair[1], 'right-half', rotation);
            if (cutVersion) {
                [leftHalf, rightHalf].forEach(heart => {
                    const cutBox = document.createElement('div');
                    cutBox.className = 'knip-vak';
                    cutBox.appendChild(heart);
                    heartElements.push(cutBox);
                });
            } else {
                heartElements.push(leftHalf, rightHalf);
            }
        });
        heartElements.sort(() => Math.random() - 0.5);
        heartElements.forEach(heartEl => content.appendChild(heartEl));
    }

    function addConnectingExercise(content, pairs) {
        const leftColumn = document.createElement('div');
        const rightColumn = document.createElement('div');
        leftColumn.className = 'verbind-kolom';
        rightColumn.className = 'verbind-kolom';
        const leftHearts = pairs.map(pair => createWorksheetHeart(pair[0], 'left-half', 0)).sort(() => Math.random() - 0.5);
        const rightHearts = pairs.map(pair => createWorksheetHeart(pair[1], 'right-half', 0)).sort(() => Math.random() - 0.5);
        leftHearts.forEach(heart => leftColumn.appendChild(heart));
        rightHearts.forEach(heart => rightColumn.appendChild(heart));
        content.append(leftColumn, rightColumn);
    }

    function addFillExercise(content, pairs, targetTotal) {
        const exercises = [...pairs].sort(() => Math.random() - 0.5);
        exercises.forEach((pair, index) => {
            const missingLeft = index % 2 === 0;
            const card = document.createElement('div');
            card.className = 'invul-opgave';
            const hearts = document.createElement('div');
            hearts.className = 'invul-harten';
            hearts.append(
                createWorksheetHeart(missingLeft ? '' : pair[0], 'left-half', 0),
                createWorksheetHeart(missingLeft ? pair[1] : '', 'right-half', 0)
            );
            const equation = document.createElement('div');
            equation.className = 'invul-som';
            equation.textContent = `${missingLeft ? '____' : pair[0]} + ${missingLeft ? pair[1] : '____'} = ${targetTotal}`;
            card.append(hearts, equation);
            content.appendChild(card);
        });
    }

    function createWorksheetHeart(number, side, rotation) {
        const heartEl = document.createElement('div');
        heartEl.className = `werkblad-hart ${side}`;
        heartEl.style.transform = `rotate(${rotation}deg) scale(0.9)`;
        const img = document.createElement('img');
        img.src = (side === 'left-half') ? '../harten_afbeeldingen/hart01_wit.png' : '../harten_afbeeldingen/hart02_wit.png';
        const span = document.createElement('span');
        span.textContent = number;
        heartEl.appendChild(img);
        heartEl.appendChild(span);
        return heartEl;
    }
});

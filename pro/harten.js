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
        currentNumber = Math.floor(Math.random() * 9) + 1; 
        correctAnswer = 10 - currentNumber; 
        const targetHeart = createHeartHalf(currentNumber, 'left-half'); 
        targetZone.appendChild(targetHeart); 
        let options = [correctAnswer]; 
        while (options.length < 3) { 
            const wrongAnswer = Math.floor(Math.random() * 9) + 1; 
            if (!options.includes(wrongAnswer) && wrongAnswer + currentNumber !== 10) { 
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
        img.src = (sideClass === 'left-half') ? 'harten_afbeeldingen/hart01.png' : 'harten_afbeeldingen/hart02.png'; 
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
        numberTen.textContent = '10'; 
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
    downloadPdfBtn.addEventListener('click', () => {
        const pageToDownload = previewBody.querySelector('.werkblad-pagina');
        if (pageToDownload) {
            downloadPdfBtn.textContent = 'Bezig met downloaden...';
            downloadPdfBtn.disabled = true;
            const { jsPDF } = window.jspdf;
            html2canvas(pageToDownload, { scale: 3 }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
                pdf.save('werkblad-verliefde-harten.pdf');
                downloadPdfBtn.textContent = 'Download als PDF';
                downloadPdfBtn.disabled = false;
                previewModal.style.display = 'none';
                previewBody.innerHTML = '';
            });
        }
    });

    function generateWorksheetPreview() {
        previewBody.innerHTML = '';
        const page = document.createElement('div');
        page.className = 'werkblad-pagina';
        const title = document.createElement('h2');
        title.textContent = 'Verliefde Harten';
        const instruction = document.createElement('p');
        instruction.className = 'opdracht';
        instruction.textContent = 'Kleur de twee helften die samen 10 vormen in dezelfde kleur.';
        page.appendChild(title);
        page.appendChild(instruction);
        const pairs = [[1, 9], [2, 8], [3, 7], [4, 6], [5, 5], [0, 10]];
        const heartElements = [];
        pairs.forEach(pair => {
            const rotation = Math.random() * 50 - 25;
            const leftHalf = createWorksheetHeart(pair[0], 'left-half', rotation);
            heartElements.push(leftHalf);
            const rightHalf = createWorksheetHeart(pair[1], 'right-half', rotation);
            heartElements.push(rightHalf);
        });
        heartElements.sort(() => Math.random() - 0.5);
        heartElements.forEach(heartEl => { page.appendChild(heartEl); });
        previewBody.appendChild(page);
        previewModal.style.display = 'flex';
    }

    function createWorksheetHeart(number, side, rotation) {
        const heartEl = document.createElement('div');
        heartEl.className = `werkblad-hart ${side}`;
        heartEl.style.transform = `rotate(${rotation}deg) scale(0.9)`;
        const img = document.createElement('img');
        img.src = (side === 'left-half') ? 'harten_afbeeldingen/hart01_wit.png' : 'harten_afbeeldingen/hart02_wit.png';
        const span = document.createElement('span');
        span.textContent = number;
        heartEl.appendChild(img);
        heartEl.appendChild(span);
        return heartEl;
    }
});
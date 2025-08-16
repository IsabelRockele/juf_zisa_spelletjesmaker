document.addEventListener('DOMContentLoaded', () => {
    const setupScreen = document.getElementById('setup-screen');
    const gameContainer = document.getElementById('game-container');
    const startButton = document.getElementById('start-btn');
    const stopButton = document.getElementById('stop-btn');
    const targetZone = document.getElementById('target-zone');
    const optionsZone = document.getElementById('options-zone');
    const feedbackEl = document.getElementById('feedback');

    let currentNumber, correctAnswer, mistakes, isLocked = false;

    startButton.addEventListener('click', () => {
        setupScreen.style.display = 'none';
        gameContainer.style.display = 'block';
        newExercise();
    });

    stopButton.addEventListener('click', () => {
        gameContainer.style.display = 'none';
        setupScreen.style.display = 'block';
    });
    
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

    function handleDragStart(e) { if (isLocked) return; e.dataTransfer.setData('text/plain', e.target.dataset.number); setTimeout(() => e.target.classList.add('dragging'), 0); }
    function handleDragEnd(e) { e.target.classList.remove('dragging'); }
    targetZone.addEventListener('dragover', (e) => { e.preventDefault(); if (!isLocked) targetZone.classList.add('drag-over'); });
    targetZone.addEventListener('dragleave', () => { targetZone.classList.remove('drag-over'); });
    
    targetZone.addEventListener('drop', (e) => {
        e.preventDefault();
        if (isLocked) return;
        targetZone.classList.remove('drag-over');
        const droppedNumber = parseInt(e.dataTransfer.getData('text/plain'), 10);
        // We verwijderen het gesleepte element niet, enkel voor de logica
        if (droppedNumber === correctAnswer) {
            handleCorrectAnswer();
        } else {
            const draggedElement = document.querySelector(`.options-container .heart-half[data-number='${droppedNumber}']`);
            handleIncorrectAnswer(draggedElement);
        }
    });

// AANGEPAST: Toont nu een volledig hart met het getal 10 erin
function handleCorrectAnswer() {
    isLocked = true;
    feedbackEl.textContent = 'Super! ❤️';
    feedbackEl.style.color = '#4CAF50';
    optionsZone.innerHTML = '';
    targetZone.innerHTML = ''; // Maak de dropzone leeg
    targetZone.style.border = 'none';

    // 1. Maak een container voor de animatie en de achtergrondafbeelding
    const fullHeartContainer = document.createElement('div');
    fullHeartContainer.className = 'full-heart-container';

    // 2. Maak een <span> element voor het getal 10
    const numberTen = document.createElement('span');
    numberTen.textContent = '10';

    // 3. Plaats het getal in de container
    fullHeartContainer.appendChild(numberTen);

    // 4. Plaats de container in de dropzone. De achtergrond en animatie worden via CSS geregeld.
    targetZone.appendChild(fullHeartContainer);

    // 5. Wacht en start dan een nieuwe oefening
    setTimeout(() => {
        newExercise();
    }, 2000);
}
    function handleIncorrectAnswer(draggedElement) { mistakes++; if (mistakes < 2) { feedbackEl.textContent = 'Oei, probeer het nog een keer!'; feedbackEl.style.color = '#f44336'; } else { isLocked = true; feedbackEl.textContent = 'Jammer! Het juiste hartje was...'; feedbackEl.style.color = '#f44336'; setTimeout(() => { const correctHeart = optionsZone.querySelector(`[data-number='${correctAnswer}']`); correctHeart.classList.add('show-correct-animation'); setTimeout(newExercise, 2500); }, 500); } }
});
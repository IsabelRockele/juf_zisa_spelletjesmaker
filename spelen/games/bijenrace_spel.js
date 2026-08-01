document.addEventListener('DOMContentLoaded', () => {
    const restartButton = document.getElementById('restartButton');
    const backButton = document.getElementById('backButton');
    const redBee = document.getElementById('redBee');
    const blueBee = document.getElementById('blueBee');
    const redFlowersContainer = document.getElementById('redFlowers');
    const blueFlowersContainer = document.getElementById('blueFlowers');
    const questionContainer = document.getElementById('questionContainer');
    const questionText = document.getElementById('questionText');
    const numpad = document.getElementById('numpad');
    const feedbackText = document.getElementById('feedbackText');
    const winnerScreen = document.getElementById('winnerScreen');
    const winnerImage = document.getElementById('winnerImage');
    const winnerRestartButton = document.getElementById('winnerRestartButton');
    const turnIndicatorScreen = document.getElementById('turnIndicatorScreen');
    const turnIndicatorText = document.getElementById('turnIndicatorText');
    const turnIndicatorImage = document.getElementById('turnIndicatorImage');

    const TOTAL_FLOWERS = 15;
    const TURN_INDICATOR_DURATION = 1500;
    const FEEDBACK_DURATION = 1500;

    let redBeePosition = 0;
    let blueBeePosition = 0;
    let currentPlayer = 'red';
    let currentAnswer = '';
    let isComputerOpponent = false;

    let gameLevel = 10;
    let gameOperation = 'plus';

    // --- NIEUWE, VERBETERDE HANDMATIGE POSITIES VOOR SCHUIN ZIGZAG PAD ---
    // Dit zijn beginwaarden. Je MOET deze finetunen met F12.
    // Ze zijn ontworpen om minder te overlappen en schuiner te lopen naar het midden,
    // en onder de finish uit te komen.
    const redFlowerPositions = [
        { left: '5%', bottom: '10%' },    // 1. Start links onder
        { left: '15%', bottom: '15%' },   // 2. Stap naar rechtsboven
        { left: '8%', bottom: '20%' },    // 3. Stap naar linksboven
        { left: '18%', bottom: '25%' },   // 4.
        { left: '11%', bottom: '30%' },   // 5.
        { left: '21%', bottom: '35%' },   // 6.
        { left: '14%', bottom: '40%' },   // 7.
        { left: '24%', bottom: '45%' },   // 8.
        { left: '17%', bottom: '50%' },   // 9.
        { left: '27%', bottom: '55%' },   // 10.
        { left: '20%', bottom: '60%' },   // 11.
        { left: '30%', bottom: '65%' },   // 12.
        { left: '23%', bottom: '70%' },   // 13.
        { left: '33%', bottom: '75%' },   // 14.
        { left: '26%', bottom: '80%' }    // 15. Einde, net voor de finish
    ];

    const blueFlowerPositions = [
        { right: '5%', bottom: '10%' },   // 1. Start rechts onder
        { right: '15%', bottom: '15%' },  // 2. Stap naar linksboven
        { right: '8%', bottom: '20%' },   // 3. Stap naar rechtsboven
        { right: '18%', bottom: '25%' },  // 4.
        { right: '11%', bottom: '30%' },  // 5.
        { right: '21%', bottom: '35%' },  // 6.
        { right: '14%', bottom: '40%' },  // 7.
        { right: '24%', bottom: '45%' },  // 8.
        { right: '17%', bottom: '50%' },  // 9.
        { right: '27%', bottom: '55%' },  // 10.
        { right: '20%', bottom: '60%' },  // 11.
        { right: '30%', bottom: '65%' },  // 12.
        { right: '23%', bottom: '70%' },  // 13.
        { right: '33%', bottom: '75%' },  // 14.
        { right: '26%', bottom: '80%' }   // 15. Einde, net voor de finish
    ];


    // Functie om de bloemen te genereren en te plaatsen
    function generateFlowers() {
        redFlowersContainer.innerHTML = '';
        blueFlowersContainer.innerHTML = '';

        redFlowerPositions.forEach((pos, index) => {
            const flower = document.createElement('img');
            flower.src = 'leerjaar1_afbeeldingen/bloemenpad.png';
            flower.classList.add('flower');
            flower.id = `red-flower-${index}`;
            flower.style.left = pos.left;
            flower.style.bottom = pos.bottom;
            redFlowersContainer.appendChild(flower);
        });

        blueFlowerPositions.forEach((pos, index) => {
            const flower = document.createElement('img');
            flower.src = 'leerjaar1_afbeeldingen/bloemenpad.png';
            flower.classList.add('flower');
            flower.id = `blue-flower-${index}`;
            flower.style.right = pos.right;
            flower.style.bottom = pos.bottom;
            blueFlowersContainer.appendChild(flower);
        });
    }

    // Haal de keuze van bijenrace_keuze.html op
    function getGameMode() {
        const urlParams = new URLSearchParams(window.location.search);
        isComputerOpponent = (urlParams.get('players') === '1');
        gameLevel = parseInt(urlParams.get('level')) || 10;
        gameOperation = urlParams.get('operation') || 'plus';

        console.log(`Spelmodus: ${isComputerOpponent ? 'Speler vs Computer' : 'Speler vs Speler'}`);
        console.log(`Gekozen niveau: ${gameLevel}, Gekozen bewerking: ${gameOperation}`);
    }

    // Functie om willekeurige oefeningen te genereren op basis van de keuze
    function generateExercise() {
        let question, answer;
        let num1, num2;
        let maxNum = gameLevel;

        const generateAddProblem = (max) => {
            if (max === 10) {
                num1 = Math.floor(Math.random() * (max + 1));
                num2 = Math.floor(Math.random() * (max + 1 - num1));
                return { question: `${num1} + ${num2} = ?`, answer: (num1 + num2).toString() };
            } else if (max === 20) { // Optellen tot 20 zonder brug
                do {
                    num1 = Math.floor(Math.random() * (max + 1));
                    num2 = Math.floor(Math.random() * (max + 1 - num1));
                } while (((num1 % 10) + (num2 % 10)) >= 10); // Ensure no bridging
                return { question: `${num1} + ${num2} = ?`, answer: (num1 + num2).toString() };
            }
        };

        const generateSubtractProblem = (max) => {
            if (max === 10) {
                // Ensure num1 >= num2 for positive results up to 10
                num1 = Math.floor(Math.random() * (max + 1));
                num2 = Math.floor(Math.random() * (num1 + 1)); // Result >= 0
                return { question: `${num1} - ${num2} = ?`, answer: (num1 - num2).toString() };
            } else if (max === 20) { // Aftrekken tot 20 zonder brug
                do {
                    // Ensure num1 >= num2 for positive results up to 20
                    num1 = Math.floor(Math.random() * (max + 1));
                    num2 = Math.floor(Math.random() * (num1 + 1));
                } while ((num1 % 10) < (num2 % 10)); // Ensure no bridging
                return { question: `${num1} - ${num2} = ?`, answer: (num1 - num2).toString() };
            }
        };

        switch (gameOperation) {
            case 'plus':
                return generateAddProblem(maxNum);
            case 'min':
                return generateSubtractProblem(maxNum);
            case 'both':
                if (Math.random() < 0.5) {
                    return generateAddProblem(maxNum);
                } else {
                    return generateSubtractProblem(maxNum);
                }
            default:
                return generateAddProblem(10);
        }
    }


    // Functie om de bij te verplaatsen
    function moveBee(beeElement, positionIndex, isRedBee) {
        let targetPosition;
        if (positionIndex < 0) positionIndex = 0;
        if (positionIndex >= TOTAL_FLOWERS) positionIndex = TOTAL_FLOWERS - 1;

        if (isRedBee) {
            targetPosition = redFlowerPositions[positionIndex];
            beeElement.style.left = targetPosition.left;
            beeElement.style.bottom = targetPosition.bottom;
            beeElement.style.right = 'auto';
        } else {
            targetPosition = blueFlowerPositions[positionIndex];
            beeElement.style.right = targetPosition.right;
            beeElement.style.bottom = targetPosition.bottom;
            beeElement.style.left = 'auto';
        }
    }

    // Initialiseer bijposities bij start
    function resetBeePositions() {
        redBeePosition = 0;
        blueBeePosition = 0;
        moveBee(redBee, 0, true);
        moveBee(blueBee, 0, false);
    }

    // Functie om het spel te starten of te herstarten
    function startGame() {
        questionContainer.style.display = 'none';
        winnerScreen.style.display = 'none';
        turnIndicatorScreen.style.display = 'none';
        feedbackText.style.display = 'none';
        currentAnswer = '';
        generateFlowers();
        resetBeePositions();
        currentPlayer = 'red';
        getGameMode();
        startPlayerTurn();
    }

    // Start de beurt van een speler met de indicator
    function startPlayerTurn() {
        questionContainer.style.display = 'none';
        feedbackText.style.display = 'none';

        if (currentPlayer === 'red') {
            turnIndicatorText.textContent = 'Rood is aan de beurt!';
            turnIndicatorImage.src = 'leerjaar1_afbeeldingen/bijenrace_rood.png';
        } else {
            if (isComputerOpponent) {
                turnIndicatorText.textContent = 'Blauw (Computer) is aan de beurt!';
            } else {
                turnIndicatorText.textContent = 'Blauw is aan de beurt!';
            }
            turnIndicatorImage.src = 'leerjaar1_afbeeldingen/bijenrace_blauw.png';
        }
        turnIndicatorScreen.style.display = 'flex';

        setTimeout(() => {
            turnIndicatorScreen.style.display = 'none';
            showQuestion();
        }, TURN_INDICATOR_DURATION);
    }


    // Toon de vraag aan de huidige speler
    function showQuestion() {
        const { question, answer } = generateExercise();
        questionText.textContent = question; // Vraagtekst altijd zichtbaar
        questionText.dataset.correctAnswer = answer;

        questionContainer.classList.remove('red-turn', 'blue-turn');
        if (currentPlayer === 'red') {
            questionContainer.classList.add('red-turn');
            numpad.style.display = 'grid'; // Toon numpad voor menselijke speler
        } else {
            questionContainer.classList.add('blue-turn');
            if (isComputerOpponent) {
                numpad.style.display = 'none'; // Verberg numpad voor computer
                // De vraagtekst blijft zichtbaar, zoals gevraagd
            } else {
                numpad.style.display = 'grid'; // Toon numpad voor menselijke speler
            }
        }

        questionContainer.style.display = 'block';
        currentAnswer = '';

        if (currentPlayer === 'blue' && isComputerOpponent) {
            handleComputerTurn();
        }
    }

    function handleComputerTurn() {
        const correctAnswer = questionText.dataset.correctAnswer;
        const isCorrect = Math.random() < 0.7; // Computer heeft 70% kans op goed antwoord
        let computerAnswer;

        // Genereer een (potentieel fout) antwoord voor de computer
        if (isCorrect) {
            computerAnswer = correctAnswer;
        } else {
            // Genereer een fout antwoord, zorg ervoor dat het niet negatief wordt, zelfs voor aftrekken
            let correctNum = parseInt(correctAnswer);
            let wrongNum = correctNum + (Math.random() > 0.5 ? 1 : -1);
            
            // Zorg dat het foute antwoord niet negatief wordt, vooral bij aftrekken
            if (wrongNum < 0) {
                wrongNum = 0; // Of een andere kleine positieve waarde
            }
            computerAnswer = wrongNum.toString();
        }
        
        const baseQuestion = questionText.textContent.split('=')[0];
        questionText.textContent = `${baseQuestion}= ${computerAnswer}`; // Toon het antwoord van de computer

        console.log(`Computer antwoord: ${computerAnswer}, Correct: ${correctAnswer}, IsCorrect: ${isCorrect}`);

        // Vertraging voordat het antwoord gecontroleerd wordt en feedback komt
        setTimeout(() => {
            if (isCorrect) {
                handleCorrectAnswer();
                feedbackText.textContent = 'Proficiat, de computer vliegt 1 plaats vooruit!'; // Specifieke feedback voor computer
                feedbackText.classList.remove('feedback-error');
                feedbackText.style.display = 'block';
            } else {
                handleIncorrectAnswer();
                feedbackText.textContent = 'Helaas, de computer vliegt 1 plaats terug!'; // Specifieke feedback voor computer
                feedbackText.classList.add('feedback-error');
                feedbackText.style.display = 'block';
            }
            
            // Verberg feedback en de vragencontainer na de feedbackduur
            setTimeout(() => {
                feedbackText.style.display = 'none';
                questionContainer.style.display = 'none';
                if(isCorrect) {
                    checkWinCondition();
                } else {
                    switchPlayer();
                }
            }, FEEDBACK_DURATION);

        }, 1500); // De computer 'denkt' en toont antwoord voor 1.5 seconde
    }

    // Verwerk numerieke invoer
    // Verwerk numerieke invoer — iPad-proof (pointer events)
numpad.addEventListener('pointerup', (event) => {
    if (!(event.target instanceof HTMLElement)) return;
    if (!event.target.classList.contains('num-button')) return;
    event.preventDefault(); // voorkomt synthetic click/ dubbele invoer op iOS

    const value = event.target.dataset.value;

    if (value === 'C') {
        currentAnswer = '';
    } else if (value === 'Enter') {
        checkAnswer();
        return;
    } else {
        currentAnswer += value; // 0–9
    }

    const baseQuestion = questionText.textContent.split('=')[0];
    questionText.textContent = `${baseQuestion}= ${currentAnswer}`;
}, { passive: false });


    function checkAnswer() {
        const correctAnswer = questionText.dataset.correctAnswer;
        if (currentAnswer === correctAnswer) {
            handleCorrectAnswer();
        } else {
            handleIncorrectAnswer();
        }
    }

    function handleCorrectAnswer() {
        // Deze logica wordt nu ook gebruikt door handleComputerTurn, maar de feedbacktekst
        // wordt daar al specifiek gezet voor de computer.
        if (! (currentPlayer === 'blue' && isComputerOpponent)) {
            feedbackText.textContent = 'Proficiat, je vliegt 1 plaats vooruit!';
            feedbackText.classList.remove('feedback-error');
            feedbackText.style.display = 'block';
        }

        if (currentPlayer === 'red') {
            if (redBeePosition < TOTAL_FLOWERS - 1) {
                redBeePosition++;
            }
            moveBee(redBee, redBeePosition, true);
        } else { // Dit is de menselijke blauwe speler (of computer, maar die is al afgehandeld in handleComputerTurn)
            if (blueBeePosition < TOTAL_FLOWERS - 1) {
                blueBeePosition++;
            }
            moveBee(blueBee, blueBeePosition, false);
        }

        // De timer en het verbergen van de container wordt nu afgehandeld in handleComputerTurn voor de computer,
        // en hier voor de menselijke spelers.
        if (! (currentPlayer === 'blue' && isComputerOpponent)) {
            setTimeout(() => {
                feedbackText.style.display = 'none';
                questionContainer.style.display = 'none';
                checkWinCondition();
            }, FEEDBACK_DURATION);
        }
    }

    function handleIncorrectAnswer() {
        let feedbackMessage;
        let beeMovedBack = false;

        // Deze logica wordt nu ook gebruikt door handleComputerTurn, maar de feedbacktekst
        // wordt daar al specifiek gezet voor de computer.
        if (! (currentPlayer === 'blue' && isComputerOpponent)) {
            if (currentPlayer === 'red') {
                if (redBeePosition > 0) {
                    redBeePosition--;
                    moveBee(redBee, redBeePosition, true);
                    beeMovedBack = true;
                }
            } else { // Dit is de menselijke blauwe speler
                if (blueBeePosition > 0) {
                    blueBeePosition--;
                    moveBee(blueBee, blueBeePosition, false);
                    beeMovedBack = true;
                }
            }

            if (beeMovedBack) {
                feedbackMessage = 'Helaas, je vliegt 1 plaats terug!';
            } else {
                feedbackMessage = 'Helaas!'; // Bij blijft op startpositie
            }

            feedbackText.textContent = feedbackMessage;
            feedbackText.classList.add('feedback-error');
            feedbackText.style.display = 'block';
        }


        // De timer en het verbergen van de container wordt nu afgehandeld in handleComputerTurn voor de computer,
        // en hier voor de menselijke spelers.
        if (! (currentPlayer === 'blue' && isComputerOpponent)) {
            setTimeout(() => {
                feedbackText.style.display = 'none';
                questionContainer.style.display = 'none';
                switchPlayer();
            }, FEEDBACK_DURATION);
        }
    }

    function checkWinCondition() {
        let winner = null;
        if (redBeePosition === TOTAL_FLOWERS - 1) {
            winner = 'red';
        } else if (blueBeePosition === TOTAL_FLOWERS - 1) {
            winner = 'blue';
        }

        if (winner) {
            feedbackText.style.display = 'none';
            questionContainer.style.display = 'none';
            showWinnerScreen(winner);
        } else {
            feedbackText.style.display = 'none';
            switchPlayer();
        }
    }

    function switchPlayer() {
        currentPlayer = currentPlayer === 'red' ? 'blue' : 'red';
        startPlayerTurn();
    }

    function showWinnerScreen(winner) {
        if (winner === 'red') {
            winnerImage.src = 'leerjaar1_afbeeldingen/bijenrace_rood_wint.png';
        } else {
            winnerImage.src = 'leerjaar1_afbeeldingen/bijenrace_blauw_wint.png';
        }
        winnerScreen.style.display = 'flex';
    }

    // Event listeners voor knoppen
    restartButton.addEventListener('click', startGame);
    winnerRestartButton.addEventListener('click', startGame);
    backButton.addEventListener('click', () => {
        window.location.href = 'bijenrace_keuze.html';
    });

    // Start het spel wanneer de pagina geladen is
    startGame();
});
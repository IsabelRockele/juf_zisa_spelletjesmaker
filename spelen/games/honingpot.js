document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elementen ---
    const selectionScreen = document.getElementById('selection-screen');
    const gameContainer = document.getElementById('game-container-spel');
    const levelButtons = document.querySelectorAll('#level-options .keuze');
    const startSpelKnop = document.getElementById('start-spel-knop');
    const gameArea = document.getElementById('game-area');
    const playerContainer = document.getElementById('player-container');
    const player = document.getElementById('player');
    const speechBubble = document.getElementById('speech-bubble');
    const scoreJuistEl = document.getElementById('scoreJuist');
    const scoreFoutEl = document.getElementById('scoreFout');
    const splitsingContainer = document.getElementById('splitsing-container');
    const btnOpnieuw = document.getElementById('btn-opnieuw');
    const btnTerug = document.getElementById('btn-terug');
    const btnLinks = document.getElementById('btn-links');
    const btnRechts = document.getElementById('btn-rechts');
    const eindFeedback = document.getElementById('eind-feedback');
    const feedbackAfbeelding = document.getElementById('feedback-afbeelding');
    const feedbackTekst = document.getElementById('feedback-tekst');
    const eindOpnieuwBtn = document.getElementById('eind-opnieuw');
    const eindTerugBtn = document.getElementById('eind-terug');

    // --- Spel Variabelen ---
    let targetNumber = null;
    let scoreJuist = 0;
    let scoreFout = 0;
    let oefeningTeller = 0;
    const TOTAAL_OEFENINGEN = 25;
    let currentSplitsing = {}; 
    let gameActive = false;
    const playerSpeed = 15;
    const keys = { ArrowLeft: false, ArrowRight: false };

    let currentExerciseHandled = false; 
    let waveTimeoutId = null; 

    let potsRemainingInWave = 0;
    let waveStartedForCurrentExercise = false;

    let processingCollision = false; 

    const CATCH_TOLERANCE_FACTOR = 0.7; 
    
    // --- Keuzemenu Logica ---
    levelButtons.forEach(knop => {
        knop.addEventListener('click', () => {
            levelButtons.forEach(k => k.classList.remove('active'));
            knop.classList.add('active');
            targetNumber = parseInt(knop.dataset.level);
            startSpelKnop.disabled = false;
            startSpelKnop.textContent = "Start het Spel!";
        });
    });

    startSpelKnop.addEventListener('click', () => {
        if (targetNumber) {
            selectionScreen.classList.add('hidden');
            gameContainer.classList.remove('hidden');
            generateNewSplitsing(); 
            setTimeout(startGame, 0); 
        }
    });

    // --- Spel Actie Knoppen ---
    btnOpnieuw.addEventListener('click', startGame);
    btnTerug.addEventListener('click', goBackToMenu);
    eindOpnieuwBtn.addEventListener('click', startGame);
    eindTerugBtn.addEventListener('click', goBackToMenu);

    function goBackToMenu() {
        endGame();
        gameContainer.classList.add('hidden');
        eindFeedback.classList.add('hidden');
        selectionScreen.classList.remove('hidden');
        
        targetNumber = null;
        levelButtons.forEach(k => k.classList.remove('active'));
        startSpelKnop.disabled = true;
        startSpelKnop.textContent = 'Kies eerst een splitsing';
    }

    // --- Spel Functies ---
    function startGame() {
        endGame(); 
        eindFeedback.classList.add('hidden');
        gameContainer.classList.remove('hidden');

        scoreJuist = 0;
        scoreFout = 0;
        oefeningTeller = 0;
        updateScore();
        
        resetPlayerPosition(); // Zet speler terug naar midden bij start van het spel
        gameActive = true;
        startNewWave(); 
        requestAnimationFrame(gameLoop);
    }

    function endGame() {
        gameActive = false;
        document.querySelectorAll('.falling-object').forEach(obj => obj.remove());
        clearTimeout(waveTimeoutId); 
        potsRemainingInWave = 0; 
        waveStartedForCurrentExercise = false;
        keys.ArrowLeft = false; 
        keys.ArrowRight = false;
    }

    function generateNewSplitsing() {
        const getal = Math.floor(Math.random() * (targetNumber - 1)) + 2;
        const deel1 = Math.floor(Math.random() * (getal + 1));
        const deel2 = getal - deel1;
        const vraagLinks = Math.random() < 0.5;

        currentSplitsing = {
            totaal: getal,
            deel1: vraagLinks ? "?" : deel1,
            deel2: vraagLinks ? deel2 : "?",
            onbekend: vraagLinks ? deel1 : deel2,
        };

        updateSplitsingDisplay(); 
    }

    function updateSplitsingDisplay() {
        splitsingContainer.innerHTML = `
            <div class="bovengetal">${currentSplitsing.totaal}</div>
            <div class="lijnen"><div class="lijn lijn-links"></div><div class="lijn lijn-rechts"></div></div>
            <div class="benen">
                <div class="been">${currentSplitsing.deel1}</div>
                <div class="been">${currentSplitsing.deel2}</div>
            </div>`;
    }

    function startNewWave() {
        if (!gameActive) return;
        currentExerciseHandled = false; 
        waveStartedForCurrentExercise = false; 

        document.querySelectorAll('.falling-object').forEach(obj => obj.remove()); 
        clearTimeout(waveTimeoutId); 
        resetPlayerPosition(); // Zet speler terug naar midden bij start van een nieuwe golf/oefening
        waveTimeoutId = setTimeout(createPotWave, 2000);
    }

    function createPotWave() {
        if (!gameActive) return;

        const pottenInGolf = 5;
        potsRemainingInWave = pottenInGolf; 
        waveStartedForCurrentExercise = true;

        const antwoorden = new Set([currentSplitsing.onbekend]);
        while (antwoorden.size < pottenInGolf) {
            let foutAntwoord = Math.floor(Math.random() * (targetNumber + 1));
            if(foutAntwoord !== currentSplitsing.onbekend && !antwoorden.has(foutAntwoord)) {
                antwoorden.add(foutAntwoord);
            }
        }

        const shuffeledAntwoorden = Array.from(antwoorden).sort(() => Math.random() - 0.5);

        for (let i = 0; i < pottenInGolf; i++) {
            createFallingObject(shuffeledAntwoorden[i], i, pottenInGolf);
        }
    }

    function createFallingObject(nummer, index, totalInWave) {
        const object = document.createElement('div');
        object.className = 'falling-object';
        object.dataset.number = nummer;
        object.innerHTML = `<img src="leerjaar1_afbeeldingen/honingpot.png" alt="honingpot"><span class="getal">${nummer}</span>`;

        const speelBreedte = gameArea.clientWidth * 0.95;
        const margeLinks = (gameArea.clientWidth - speelBreedte) / 2;
        
        const laneWidth = speelBreedte / totalInWave;
        const offset = (laneWidth - 80) / 2; 
        object.style.left = `${margeLinks + (index * laneWidth) + offset}px`;
        object.style.top = '-100px';
        
        gameArea.appendChild(object);
        
        setTimeout(() => {
            if (document.body.contains(object)) {
                 const fallDuration = (Math.random() * 5) + 15;
                 object.style.animation = `fall ${fallDuration}s linear forwards`;
            }
        }, 10);
    }

    // Functie om de spelerpositie te resetten naar het midden
    function resetPlayerPosition() {
        playerContainer.style.left = '50%';
        playerContainer.style.transform = 'translateX(-50%)';
    }

    // --- Besturing ---
    window.addEventListener('keydown', (e) => { 
        if (keys[e.key] !== undefined) {
            keys[e.key] = true; 
        }
    });

    window.addEventListener('keyup', (e) => { 
        if (keys[e.key] !== undefined) {
            keys[e.key] = false;
        }
    });
    
    btnLinks.addEventListener('touchstart', (e) => { 
        e.preventDefault(); 
        keys.ArrowLeft = true; 
    }, {passive: false}); 
    btnLinks.addEventListener('touchend', (e) => { 
        e.preventDefault(); 
        keys.ArrowLeft = false; 
    });
    btnLinks.addEventListener('mousedown', () => { keys.ArrowLeft = true; });
    btnLinks.addEventListener('mouseup', () => { keys.ArrowLeft = false; });


    btnRechts.addEventListener('touchstart', (e) => { 
        e.preventDefault(); 
        keys.ArrowRight = true; 
    }, {passive: false});
    btnRechts.addEventListener('touchend', (e) => { 
        e.preventDefault(); 
        keys.ArrowRight = false; 
    });
    btnRechts.addEventListener('mousedown', () => { keys.ArrowRight = true; });
    btnRechts.addEventListener('mouseup', () => { keys.ArrowRight = false; });


    function movePlayer() {
        const currentLeft = playerContainer.offsetLeft;
        const containerWidth = gameArea.clientWidth;
        const playerWidth = playerContainer.offsetWidth;

        if (keys.ArrowLeft && currentLeft > 0) {
            playerContainer.style.left = `${Math.max(0, currentLeft - playerSpeed)}px`;
        }
        if (keys.ArrowRight && currentLeft < (containerWidth - playerWidth)) {
            playerContainer.style.left = `${Math.min(containerWidth - playerWidth, currentLeft + playerSpeed)}px`;
        }
    }

    // --- Score & Feedback ---
    function updateScore() {
        scoreJuistEl.textContent = scoreJuist;
        scoreFoutEl.textContent = scoreFout;
    }

    function handleCorrectAnswer() { 
        if (!gameActive || currentExerciseHandled || processingCollision) return; 
        processingCollision = true; 

        currentExerciseHandled = true; 

        speechBubble.classList.remove('hidden');
        setTimeout(() => {
            speechBubble.classList.add('hidden');
        }, 1500);
        
        scoreJuist++;
        oefeningTeller++; 
        updateScore();
        
        document.querySelectorAll('.falling-object').forEach(obj => obj.remove());
        potsRemainingInWave = 0; 
        waveStartedForCurrentExercise = false;
        
        setTimeout(() => { processingCollision = false; }, 100); 

        if (oefeningTeller >= TOTAAL_OEFENINGEN) {
            toonEindFeedback();
        } else {
            generateNewSplitsing(); 
            startNewWave(); 
        }
    }

    // AANGEPAST: Zorg ervoor dat processingCollision correct wordt gereset
    function handleWrongAnswerCaught() { 
        if (!gameActive || processingCollision) return; 
        processingCollision = true; // Stel deze direct in om verdere hits te blokkeren
        
        scoreFout++;
        updateScore();
        player.classList.add('fout', 'shake');
        setTimeout(() => {
            player.classList.remove('fout', 'shake');
            // Reset processingCollision pas als de animatie klaar is
            processingCollision = false; 
            // Na de animatie, start de nieuwe golf
            document.querySelectorAll('.falling-object').forEach(obj => obj.remove()); 
            potsRemainingInWave = 0; 
            waveStartedForCurrentExercise = false; 
            startNewWave(); 
        }, 400); // Duur van de shake animatie (0.4s)
        
        // Let op: GEEN startNewWave() hier direct, wacht tot animatie voorbij is
    }
    
    function handleMissedCorrectAnswer() { 
        if (!gameActive || currentExerciseHandled || processingCollision) return; 
        processingCollision = true; 

        currentExerciseHandled = true; 

        // GEEN scoreFout++; 
        // GEEN updateScore(); 
        // GEEN visuele feedback (bibberen)

        document.querySelectorAll('.falling-object').forEach(obj => obj.remove());
        potsRemainingInWave = 0;
        waveStartedForCurrentExercise = false; 
        
        setTimeout(() => { processingCollision = false; }, 100); 

        // GEEN oefeningTeller++; 
        updateSplitsingDisplay(); 
        startNewWave(); 
    }

    function handleNoPotCaughtInWave() { 
        if (!gameActive || currentExerciseHandled || processingCollision) return; 
        processingCollision = true; 

        currentExerciseHandled = true; 

        // GEEN scoreFout++;
        // GEEN visuele feedback (bibberen)
        // GEEN score-update.

        document.querySelectorAll('.falling-object').forEach(obj => obj.remove());
        potsRemainingInWave = 0;
        waveStartedForCurrentExercise = false; 
        
        setTimeout(() => { processingCollision = false; }, 100); 

        // GEEN oefeningTeller++;
        updateSplitsingDisplay(); 
        startNewWave(); 
    }

    function toonEindFeedback() {
        endGame();
        gameContainer.classList.add('hidden');
        eindFeedback.classList.remove('hidden');

        if (scoreFout === 0) {
            feedbackAfbeelding.src = 'leerjaar1_afbeeldingen/juichende_bibi.png';
            feedbackTekst.textContent = 'Dikke proficiat!';
        } else {
            feedbackAfbeelding.src = 'leerjaar1_afbeeldingen/juf_bibi.png';
            feedbackTekst.textContent = 'Goed geoefend. Probeer het volgende keer zonder fouten.';
        }
    }

    // --- Game Loop voor botsingdetectie ---
    function gameLoop() {
        if (!gameActive) return;
        movePlayer();
        
        const playerRect = player.getBoundingClientRect();
        const playerCenterX = playerRect.left + (playerRect.width / 2);
        const catchZoneWidth = playerRect.width * CATCH_TOLERANCE_FACTOR;
        const catchZoneLeft = playerCenterX - (catchZoneWidth / 2);
        const catchZoneRight = playerCenterX + (catchZoneWidth / 2);


        const fallingObjects = Array.from(document.querySelectorAll('.falling-object')); 

        let correctPotHandledInThisFrame = false; 

        for (let i = fallingObjects.length - 1; i >= 0; i--) { 
            const obj = fallingObjects[i];
            if (!obj.parentNode) continue; 

            const objRect = obj.getBoundingClientRect();
            const potNumber = parseInt(obj.dataset.number);

            const potCenterX = objRect.left + (objRect.width / 2);
            
            // Controleer verticale overlap
            if (objRect.bottom >= playerRect.top && objRect.top <= playerRect.bottom) { 
                // Horizontale check: midden van de pot moet binnen Bibi's vangzone vallen
                if (potCenterX >= catchZoneLeft && potCenterX <= catchZoneRight) {
                    // POT IS GEVANGEN BINNEN DE VANGZONE
                    if (processingCollision) {
                        obj.remove(); 
                        potsRemainingInWave--;
                        continue; 
                    }

                    obj.remove(); 
                    potsRemainingInWave--;

                    if (potNumber === currentSplitsing.onbekend) {
                        correctPotHandledInThisFrame = true; 
                        handleCorrectAnswer();
                    } else {
                        // Dit is een foute pot gevangen
                        handleWrongAnswerCaught(); 
                    }
                    break; // Afhandeling voor deze frame is gedaan
                }
            }
            // Detectie van 'val door' (object bereikt onderkant scherm)
            // Dit gebeurt alleen als de pot NIET gevangen is door bovenstaande logica.
            else if (objRect.top > gameArea.clientHeight) {
                obj.remove();
                potsRemainingInWave--;

                // Als dit de juiste pot was die van het scherm viel EN nog niet afgehandeld
                if (potNumber === currentSplitsing.onbekend && !currentExerciseHandled) {
                    correctPotHandledInThisFrame = true; 
                    handleMissedCorrectAnswer(); 
                    break; // Afhandeling voor deze frame is gedaan
                }
            }
        } 

        // Controleer of een nieuwe golf nodig is voor het 'niets gevangen' scenario.
        if (waveStartedForCurrentExercise && 
            potsRemainingInWave === 0 && 
            !currentExerciseHandled && 
            !correctPotHandledInThisFrame && 
            gameActive && 
            oefeningTeller < TOTAAL_OEFENINGEN) {
             handleNoPotCaughtInWave();
        }
        
        requestAnimationFrame(gameLoop);
    }
});
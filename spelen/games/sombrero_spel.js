document.addEventListener('DOMContentLoaded', () => {
    const hoedenContainer = document.getElementById('hoedenContainer');
    const cactussenContainer = document.getElementById('cactussenContainer');
    const feedbackContainer = document.getElementById('feedbackContainer');
    const feedbackImage = document.getElementById('feedbackImage');
    const feedbackText = document.getElementById('feedbackText');
    const speelOpnieuwFeedbackKnop = document.getElementById('speelOpnieuwFeedback');
    const kiesNieuweTafelsKnop = document.getElementById('kiesOpnieuwFeedback');
    const timerDisplay = document.getElementById('timer');
    const scoreJuistDisplay = document.getElementById('scoreJuist');
    const scoreFoutDisplay = document.getElementById('scoreFout');

    let geselecteerdeTafels = [];
    let geselecteerdeSoort = '';
    let tijdOver = 120; // 2 minuten
    let scoreJuist = 0;
    let scoreFout = 0;
    let timerInterval;
    let hoedenOpScherm = []; // Stores { element: hoedDiv, originalPosition: {x, y}, placed: false }
    let cactussenOpScherm = []; // Stores { element: cactusDiv, bezet: false }
    let sleepObject = null; // The hat element being dragged
    let sleepOffsetX, sleepOffsetY; // Offset for dragging
    let correctAnswersOnCactuses = 0; // Counts how many cactuses have a correctly placed hat
    let gebruikteOefeningen = new Set(); // Houdt unieke oefeningen bij

    // Fetch saved choices from localStorage
    try {
        const tafelsString = localStorage.getItem('sombrero_tafels');
        const soortString = localStorage.getItem('sombrero_soort');

        if (tafelsString) {
            geselecteerdeTafels = JSON.parse(tafelsString);
            if (geselecteerdeTafels.includes('alle')) {
                geselecteerdeTafels = Array.from({ length: 11 }, (_, i) => i);
            }
        }
        if (soortString) {
            geselecteerdeSoort = soortString;
        }

        if (geselecteerdeTafels.length === 0 || !geselecteerdeSoort) {
            alert('Maak eerst je keuzes in het keuzescherm.');
            window.location.href = 'sombrero_keuze.html';
            return;
        }
    } catch (e) {
        console.error("Fout bij het ophalen van keuzes uit localStorage:", e);
        alert('Er is een probleem opgetreden met je keuzes. Gelieve opnieuw te kiezen.');
        window.location.href = 'sombrero_keuze.html';
        return;
    }

    // Event listeners for buttons
    document.getElementById('knopOpnieuw').addEventListener('click', startSpel);
    document.getElementById('knopKiezen').addEventListener('click', () => {
        clearInterval(timerInterval);
        if (window.visueelTimerIntervalId) {
            clearInterval(window.visueelTimerIntervalId);
        }
        window.location.href = 'sombrero_keuze.html';
    });
    speelOpnieuwFeedbackKnop.addEventListener('click', startSpel);
    kiesNieuweTafelsKnop.addEventListener('click', () => {
        window.location.href = 'sombrero_keuze.html';
    });


    // Timer functionality (adapted from tafels.js)
    function startTimer() {
        startVisueleTimer();
        tijdOver = 120;
        timerDisplay.textContent = `02:00`;

        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            tijdOver--;
            const min = String(Math.floor(tijdOver / 60)).padStart(2, '0');
            const sec = String(tijdOver % 60).padStart(2, '0');
            timerDisplay.textContent = `${min}:${sec}`;

            if (tijdOver <= 0) {
                clearInterval(timerInterval);
                eindeSpel();
            }
        }, 1000);
    }

    function startVisueleTimer() {
        const canvas = document.getElementById('timer-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const totaleTijd = 120;
        let tijdVisueel = totaleTijd;

        function resizeCanvas() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }
        resizeCanvas();

        function tekenTaart(percentage) {
            const w = canvas.width;
            const h = canvas.height;
            const cx = w / 2;
            const cy = h / 2 + 16.5; // Pas deze aan voor verticale centrering indien nodig

            let radiusSubtraction;
            // Pas de aftrekwaarde aan op basis van de breedte van de canvas (die overeenkomt met de containergrootte)
            if (w >= 0) { // Voor desktop/grote schermen (container >= 160px)
                radiusSubtraction = 25; // Kleinere aftrek om de cirkel groter te maken t.o.v. de container
            } else if (w >= 120) { // Voor grotere tablets (container >= 120px)
                radiusSubtraction = 35; // Dit was de "ideale" waarde die je eerder noemde
            } else if (w >= 100) { // Voor kleinere tablets/telefoons (container >= 100px)
                radiusSubtraction = 30; // Een beetje minder aftrekken dan bij 120px om relatief even groot te lijken
            } else { // Voor zeer kleine schermen (container < 100px, bijv. 80px of 60px)
                radiusSubtraction = 20; // Zorg dat de radius positief blijft voor kleine containers
            }

            let radius = Math.min(w, h) / 2 - radiusSubtraction;

            // Veiligheidscheck: zorg ervoor dat de radius nooit negatief is of te klein wordt
            if (radius < 5) { // Minimaal 5px radius om tekenfouten te voorkomen
                console.warn("Berekende radius is te klein of negatief (" + radius + "). Aangepast naar 5.");
                radius = 5;
            }

            ctx.clearRect(0, 0, w, h);

            let kleur = '#2e7d32';
            if (percentage < 0.2) kleur = '#b71c1c';
            else if (percentage < 0.5) kleur = '#ff8f00';

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.fillStyle = kleur;
            const startAngle = -Math.PI / 2;
            const endAngle = startAngle + 2 * Math.PI * (1 - percentage);
            ctx.arc(cx, cy, radius, startAngle, endAngle, false);
            ctx.lineTo(cx, cy);
            ctx.fill();
        }

        tekenTaart(1);

        if (window.visueelTimerIntervalId) {
            clearInterval(window.visueelTimerIntervalId);
        }

        window.visueelTimerIntervalId = setInterval(() => {
            tijdVisueel--;
            const percentage = tijdVisueel / totaleTijd;
            tekenTaart(percentage);
            if (tijdVisueel <= 0) {
                clearInterval(window.visueelTimerIntervalId);
                window.visueelTimerIntervalId = null;
            }
        }, 1000);
    }

    // Game Logic
    function genereerOefening() {
        let pogingen = 0;
        const maxPogingen = 50; // Voorkom oneindige loops
        
        while (pogingen < maxPogingen) {
            const tafel = geselecteerdeTafels[Math.floor(Math.random() * geselecteerdeTafels.length)];
            const getal2 = Math.floor(Math.random() * 11);

            let vraag, correctAntwoord;
            const soort = geselecteerdeSoort === 'beide' ? (Math.random() < 0.5 ? 'maal' : 'delen') : geselecteerdeSoort;

            if (soort === 'maal') {
                vraag = `${tafel} × ${getal2}`;
                correctAntwoord = tafel * getal2;
            } else {
                if (tafel === 0) {
                    pogingen++;
                    continue; // Kan niet delen door 0
                }
                const product = tafel * getal2;
                vraag = `${product} ÷ ${tafel}`;
                correctAntwoord = getal2;
            }

            // Controleer op uniekheid van de oefening
            const oefeningString = `${vraag}=${correctAntwoord}`;
            if (!gebruikteOefeningen.has(oefeningString)) {
                gebruikteOefeningen.add(oefeningString);
                return { vraag, correctAntwoord };
            }
            pogingen++;
        }
        // Fallback als te veel pogingen zijn gedaan (bijvoorbeeld bij zeer beperkte tafelkeuzes)
        console.warn("Kon geen unieke oefening genereren na meerdere pogingen.");
        // Genereer desnoods een herhaalde oefening als het echt niet anders kan
        const tafel = geselecteerdeTafels[Math.floor(Math.random() * geselecteerdeTafels.length)];
        const getal2 = Math.floor(Math.random() * 11);
        const soort = geselecteerdeSoort === 'beide' ? (Math.random() < 0.5 ? 'maal' : 'delen') : geselecteerdeSoort;
        if (soort === 'maal') {
            return { vraag: `${tafel} × ${getal2}`, correctAntwoord: tafel * getal2 };
        } else {
            return { vraag: `${tafel * getal2} ÷ ${tafel}`, correctAntwoord: getal2 };
        }
    }

    // Aangepaste functie om antwoorden te genereren voor cactussen
    function genereerCactusAntwoorden(hoedenCorrecteAntwoorden) {
        let antwoordenVoorCactussen = new Set();
        let potentiëleAntwoorden = [...hoedenCorrecteAntwoorden]; // Maak een kopie

        // Zorg ervoor dat ten minste 4 correcte antwoorden van de hoeden worden gebruikt
        // of zoveel als er unieke correcte antwoorden zijn (max 6)
        // en vul aan met willekeurige antwoorden als er minder dan 4 unieke hoedenantwoorden zijn
        
        // Voeg de correcte antwoorden van de hoeden toe, uniek en tot maximaal 4
        potentiëleAntwoorden.sort(() => Math.random() - 0.5); // Schud de correcte antwoorden
        for(let i = 0; i < potentiëleAntwoorden.length && antwoordenVoorCactussen.size < 4; i++) {
            antwoordenVoorCactussen.add(potentiëleAntwoorden[i]);
        }

        // Vul aan met willekeurige (foute) antwoorden als er minder dan 4 correcte/unieke hoedenantwoorden waren
        while (antwoordenVoorCactussen.size < 4) {
            // Neem een antwoord dat al op een cactus staat (of een van de hoedantwoorden)
            // om een afwijkend (fout) antwoord te genereren.
            let basisAntwoord = Array.from(antwoordenVoorCactussen)[Math.floor(Math.random() * antwoordenVoorCactussen.size)];
            if (basisAntwoord === undefined && hoedenCorrecteAntwoorden.length > 0) {
                 basisAntwoord = hoedenCorrecteAntwoorden[Math.floor(Math.random() * hoedenCorrecteAntwoorden.length)];
            } else if (basisAntwoord === undefined) {
                 basisAntwoord = Math.floor(Math.random() * 10) * Math.floor(Math.random() * 10); // Volledig willekeurig als er geen basis is
            }

            let foutAntwoord = basisAntwoord + Math.floor(Math.random() * 21) - 10; // Tussen -10 en +10 van een correct antwoord
            if (foutAntwoord < 0) foutAntwoord = 0;
            if (!antwoordenVoorCactussen.has(foutAntwoord)) {
                antwoordenVoorCactussen.add(foutAntwoord);
            }
        }

        return Array.from(antwoordenVoorCactussen).sort(() => Math.random() - 0.5); // Schud de finale antwoorden
    }


    function genereerNieuweRonde() {
        hoedenContainer.innerHTML = '';
        cactussenContainer.innerHTML = '';
        hoedenOpScherm = [];
        cactussenOpScherm = [];
        correctAnswersOnCactuses = 0;
        gebruikteOefeningen.clear(); // Reset gebruikte oefeningen voor de nieuwe ronde

        const hoeden = [];
        const hoedenCorrecteAntwoorden = [];
        for (let i = 0; i < 6; i++) { // 6 hoeden
            const oefening = genereerOefening();
            hoeden.push(oefening);
            hoedenCorrecteAntwoorden.push(oefening.correctAntwoord);
        }
        
        // Genereer de antwoorden voor de cactussen met de nieuwe functie
        const finalCactusAnswers = genereerCactusAntwoorden(hoedenCorrecteAntwoorden);


        // Fixed positions for 2 rows of 3 hoeden, relative to #hoedenContainer
        const hoedFixedPositions = [
            { top: 20, left: 50 }, { top: 20, left: 250 }, { top: 20, left: 450 },
            { top: 150, left: 50 }, { top: 150, left: 250 }, { top: 150, left: 450 }
        ];

        hoeden.forEach((oefeningData, index) => {
            const hoedDiv = document.createElement('div');
            hoedDiv.className = 'hoed';
            hoedDiv.dataset.correctAnswer = oefeningData.correctAntwoord;
            hoedDiv.dataset.originalIndex = index;
            hoedDiv.innerHTML = `<span class="hoed-vraag">${oefeningData.vraag}</span>`;
            hoedenContainer.appendChild(hoedDiv);

            // Set initial absolute position
            hoedDiv.style.left = `${hoedFixedPositions[index].left}px`;
            hoedDiv.style.top = `${hoedFixedPositions[index].top}px`;
            
            hoedenOpScherm.push({ element: hoedDiv, originalPosition: { ...hoedFixedPositions[index] }, placed: false });
        });

        finalCactusAnswers.forEach(antwoord => {
            const cactusDiv = document.createElement('div');
            cactusDiv.className = 'cactus';
            cactusDiv.dataset.antwoord = antwoord;
            cactusDiv.innerHTML = `<div class="cactus-antwoord-vak">${antwoord}</div>`;
            cactussenContainer.appendChild(cactusDiv);
            cactussenOpScherm.push({ element: cactusDiv, bezet: false });
        });

        voegSleepFunctionaliteitToe();
    }

    function voegSleepFunctionaliteitToe() {
        document.querySelectorAll('.hoed').forEach(hoed => {
            hoed.addEventListener('pointerdown', (e) => {
                if (e.button === 2) return;
                
                const hoedData = hoedenOpScherm.find(h => h.element === hoed);
                if (hoedData && hoedData.placed) {
                    return;
                }

                e.preventDefault();
                sleepObject = hoed;
                sleepObject.classList.add('dragging');
                sleepObject.style.transition = 'none'; // Disable transition during drag

                const hoedenContainerRect = hoedenContainer.getBoundingClientRect();
                const rect = sleepObject.getBoundingClientRect();
                sleepOffsetX = e.clientX - rect.left;
                sleepOffsetY = e.clientY - rect.top;

                sleepObject.setPointerCapture(e.pointerId);

                document.addEventListener('pointermove', onMouseMove);
                document.addEventListener('pointerup', onMouseUp);
            });
        });
    }

    function onMouseMove(e) {
        if (!sleepObject) return;
        
        const hoedenContainerRect = hoedenContainer.getBoundingClientRect();
        let newX = e.clientX - sleepOffsetX - hoedenContainerRect.left;
        let newY = e.clientY - sleepOffsetY - hoedenContainerRect.top;

        sleepObject.style.left = `${newX}px`;
        sleepObject.style.top = `${newY}px`;
    }

    function onMouseUp(e) {
        if (!sleepObject) return;
        
        sleepObject.classList.remove('dragging');
        sleepObject.releasePointerCapture(e.pointerId);

        const hoedRect = sleepObject.getBoundingClientRect();
        let droppedOnCactus = false;

        cactussenOpScherm.forEach(cactusData => {
            const cactusRect = cactusData.element.getBoundingClientRect();

            if (
                !cactusData.bezet &&
                hoedRect.right > cactusRect.left &&
                hoedRect.left < cactusRect.right &&
                hoedRect.bottom > cactusRect.top &&
                hoedRect.top < cactusRect.bottom
            ) {
                const hoedAntwoord = parseInt(sleepObject.dataset.correctAnswer);
                const cactusAntwoord = parseInt(cactusData.element.dataset.antwoord);

                if (hoedAntwoord === cactusAntwoord) {
                    const hoedenContainerRect = hoedenContainer.getBoundingClientRect();
                    // Adjusted targetY to position the hat on the cactus's head
                    const cactusHeadOffset = 60; // This value might need fine-tuning based on the actual image.
                    const targetX = (cactusRect.left + cactusRect.width / 2 - hoedRect.width / 2) - hoedenContainerRect.left;
                    const targetY = (cactusRect.top - hoedRect.height + cactusHeadOffset) - hoedenContainerRect.top;

                    sleepObject.style.left = `${targetX}px`;
                    sleepObject.style.top = `${targetY}px`;
                    
                    cactusData.bezet = true;
                    sleepObject.style.pointerEvents = 'none';
                    
                    const hoedData = hoedenOpScherm.find(h => h.element === sleepObject);
                    if (hoedData) {
                        hoedData.placed = true;
                    }

                    scoreJuist++;
                    scoreJuistDisplay.textContent = scoreJuist;
                    correctAnswersOnCactuses++;

                    droppedOnCactus = true;
                } else {
                    scoreFout++;
                    scoreFoutDisplay.textContent = scoreFout;
                }
            }
        });

        if (!droppedOnCactus) {
            const originalHoedData = hoedenOpScherm.find(h => h.element === sleepObject);
            if (originalHoedData && originalHoedData.originalPosition) {
                sleepObject.style.transition = 'all 0.3s ease-out';
                sleepObject.style.left = `${originalHoedData.originalPosition.left}px`;
                sleepObject.style.top = `${originalHoedData.originalPosition.top}px`;
                setTimeout(() => {
                    sleepObject.style.transition = 'none';
                }, 300);
            }
        }

        sleepObject = null;
        document.removeEventListener('pointermove', onMouseMove);
        document.removeEventListener('pointerup', onMouseUp);
        
        // Check if all 4 cactuses are occupied
        const allCactusesOccupied = cactussenOpScherm.every(cactus => cactus.bezet);
        if (allCactusesOccupied) {
            setTimeout(genereerNieuweRonde, 800);
        }
    }


    function eindeSpel() {
        clearInterval(timerInterval);
        if (window.visueelTimerIntervalId) {
            clearInterval(window.visueelTimerIntervalId);
            window.visueelTimerIntervalId = null;
        }

        hoedenContainer.innerHTML = '';
        cactussenContainer.innerHTML = '';

        feedbackContainer.style.display = 'flex';
        
        let feedbackBericht = '';
        if (scoreJuist >= 25 && scoreFout === 0) {
            feedbackBericht = `Fantastisch gedaan! Je hebt ${scoreJuist} vragen correct beantwoord en geen fouten gemaakt!`;
            feedbackImage.src = 'leerjaar3_afbeeldingen/sombrero_feest.png';
        } else {
            feedbackBericht = `Goed geprobeerd! Je had ${scoreJuist} correcte antwoorden en ${scoreFout} foute. Blijf oefenen, dan lukt het de volgende keer vast beter!`;
            feedbackImage.src = 'leerjaar3_afbeeldingen/karl_normaal.png';
        }
        feedbackText.textContent = feedbackBericht;
    }

    function startSpel() {
        feedbackContainer.style.display = 'none';
        scoreJuist = 0;
        scoreFout = 0;
        scoreJuistDisplay.textContent = scoreJuist;
        scoreFoutDisplay.textContent = scoreFout;
        startTimer();
        genereerNieuweRonde();
    }

    // Start the game when the page is loaded
    startSpel();
});
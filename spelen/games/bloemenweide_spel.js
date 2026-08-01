// bloemenweide_spel.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elementen ---
    const oefeningDisplay = document.getElementById('oefening-display');
    const bloemenContainer = document.getElementById('bloemen-container');
    const bibiVliegt = document.getElementById('bibi-vliegt');
    const scoreJuistEl = document.getElementById('scoreJuist');
    const scoreFoutEl = document.getElementById('scoreFout');
    const timerDisplay = document.getElementById('tijdOver');
    const timerCanvas = document.getElementById('timer-canvas');
    const eindFeedback = document.getElementById('eind-feedback');
    const feedbackAfbeelding = document.getElementById('feedback-afbeelding');
    const feedbackTekst = document.getElementById('feedback-tekst');
    const btnOpnieuw = document.getElementById('btn-opnieuw');
    const eindOpnieuwBtn = document.getElementById('eind-opnieuw');
    const eindTerugBtn = document.getElementById('eind-terug');
    const gameContainerSpel = document.querySelector('.container'); // De hoofdcontainer van het spel

    // --- Spel Variabelen ---
    let maxGetal = 10;
    let operatieType = 'both';
    let scoreJuist = 0;
    let scoreFout = 0;
    let oefeningenGemaakt = 0;
    const MIN_OEFENINGEN_VOOR_SUCCES = 20;
    const SPEL_DUUR_SECONDEN = 120;
    let tijdResterend = SPEL_DUUR_SECONDEN;
    let timerInterval;
    let visueelTimerIntervalId;
    let huidigCorrectAntwoord = null;
    let spelActief = false;
    let bibiIsAanHetVliegen = false;
    let huidigeOefening = {};

    // Vaste posities voor de 5 bloemen (percentage van bloemenContainer)
    const bloemPosities = [
        { left: '15%', bottom: '10%' },
        { left: '35%', bottom: '40%' },
        { left: '50%', bottom: '15%' },
        { left: '65%', bottom: '45%' },
        { left: '85%', bottom: '10%' }
    ];

    // --- Initialisatie van Spelparameters uit URL ---
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('level')) {
        maxGetal = parseInt(urlParams.get('level'));
    }
    if (urlParams.has('operation')) {
        operatieType = urlParams.get('operation');
    }

    // --- Event Listeners ---
    btnOpnieuw.addEventListener('click', startSpel);
    eindOpnieuwBtn.addEventListener('click', startSpel);
    eindTerugBtn.addEventListener('click', () => {
        window.location.href = 'bloemenweide_keuze.html';
    });

    // --- Spel Functies ---
    function startSpel() {
        eindFeedback.classList.add('hidden'); // Zorg dat feedback verborgen is bij start
        gameContainerSpel.classList.remove('hidden'); // Zorg dat spelcontainer zichtbaar is
        
        resetSpel();
        genereerNieuweOefening();
        startTimers();
        spelActief = true;
    }

    function resetSpel() {
        scoreJuist = 0;
        scoreFout = 0;
        oefeningenGemaakt = 0;
        tijdResterend = SPEL_DUUR_SECONDEN;
        updateScore();
        updateTimerDisplay();
        stopTimers();
        bloemenContainer.innerHTML = '';
        resetBibiPositie();
        bibiIsAanHetVliegen = false;
        bibiVliegt.style.opacity = '1';
    }

    function updateScore() {
        scoreJuistEl.textContent = scoreJuist;
        scoreFoutEl.textContent = scoreFout;
    }

    function updateTimerDisplay() {
        const minuten = Math.floor(tijdResterend / 60);
        const seconden = tijdResterend % 60;
        timerDisplay.textContent = `${String(minuten).padStart(2, '0')}:${String(seconden).padStart(2, '0')}`;
    }

    function startTimers() {
        stopTimers();

        timerInterval = setInterval(() => {
            tijdResterend--;
            updateTimerDisplay();
            if (tijdResterend <= 0) {
                clearInterval(timerInterval);
                eindSpel();
            }
        }, 1000);

        const canvas = timerCanvas;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const totaleTijdVisueel = SPEL_DUUR_SECONDEN;

        function resizeCanvasForTimer() {
            const container = document.getElementById('visueleTimerContainer');
            const size = container.offsetWidth;
            canvas.width = size;
            canvas.height = size;
        }
        window.addEventListener('resize', resizeCanvasForTimer);
        resizeCanvasForTimer();

        function tekenTaart(percentage) {
            const w = canvas.width;
            const h = canvas.height;
            const cx = w / 2 - 1;
            const cy = h / 2 + 17;
            const radius = Math.min(w, h) / 2 * 0.54;

            ctx.clearRect(0, 0, w, h);

            let kleur = '#2e7d32'; // Groen
            if (percentage < 0.2) kleur = '#b71c1c'; // Rood
            else if (percentage < 0.5) kleur = '#ff8f00'; // Oranje

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

        visueelTimerIntervalId = setInterval(() => {
            const percentage = tijdResterend / totaleTijdVisueel;
            tekenTaart(percentage);
            if (tijdResterend <= 0) clearInterval(visueelTimerIntervalId);
        }, 1000);
    }

    function stopTimers() {
        clearInterval(timerInterval);
        if (visueelTimerIntervalId) {
            clearInterval(visueelTimerIntervalId);
        }
    }

    function genereerNieuweOefening() {
        let getal1, getal2, antwoord, vraag, operatie;

        const beschikbareOperaties = [];
        if (operatieType === 'plus' || operatieType === 'both') {
            beschikbareOperaties.push('+');
        }
        if (operatieType === 'min' || operatieType === 'both') {
            beschikbareOperaties.push('-');
        }

        if (beschikbareOperaties.length === 0) {
            oefeningDisplay.textContent = "Geen operatie geselecteerd.";
            return;
        }

        let isBrugoefeningGevonden;
        do {
            isBrugoefeningGevonden = false;

            operatie = beschikbareOperaties[Math.floor(Math.random() * beschikbareOperaties.length)];

            if (operatie === '+') {
                getal1 = Math.floor(Math.random() * (maxGetal + 1));
                getal2 = Math.floor(Math.random() * (maxGetal + 1 - getal1));
                antwoord = getal1 + getal2;
                vraag = `${getal1} + ${getal2} = ?`;

                if (maxGetal === 20 && ((getal1 % 10) + (getal2 % 10) > 9)) {
                    isBrugoefeningGevonden = true;
                }

            } else { // operatie === '-'
                getal1 = Math.floor(Math.random() * (maxGetal + 1));
                getal2 = Math.floor(Math.random() * (getal1 + 1));
                antwoord = getal1 - getal2;
                vraag = `${getal1} - ${getal2} = ?`;

                if (maxGetal === 20 && ((getal1 % 10) < (getal2 % 10))) {
                    isBrugoefeningGevonden = true;
                }
            }
        } while (isBrugoefeningGevonden);

        huidigeOefening = { vraag, antwoord };
        oefeningDisplay.textContent = vraag;
        plaatsBloemenMetAntwoorden(antwoord);
    }

    function plaatsBloemenMetAntwoorden(correctAntwoord) {
        bloemenContainer.innerHTML = '';

        const antwoorden = new Set();
        antwoorden.add(correctAntwoord);

        while (antwoorden.size < 5) {
            let foutAntwoord;
            let offset = Math.floor(Math.random() * 7) + 1;
            if (Math.random() < 0.5) {
                foutAntwoord = correctAntwoord + offset;
            } else {
                foutAntwoord = correctAntwoord - offset;
            }
            foutAntwoord = Math.max(0, Math.min(foutAntwoord, maxGetal + 10));
            if (!antwoorden.has(foutAntwoord)) {
                antwoorden.add(foutAntwoord);
            }
        }

        const geschuddeAntwoorden = Array.from(antwoorden).sort(() => Math.random() - 0.5);
        const geschuddePosities = [...bloemPosities].sort(() => Math.random() - 0.5);

        geschuddeAntwoorden.forEach((antwoord, index) => {
            const bloemDiv = document.createElement('div');
            bloemDiv.classList.add('bloem-container');
            bloemDiv.dataset.antwoord = antwoord;

            const pos = geschuddePosities[index];
            bloemDiv.style.left = pos.left;
            bloemDiv.style.bottom = pos.bottom;
            bloemDiv.style.transform = 'translate(-50%, 0)';

            bloemDiv.innerHTML = `
                <img src="leerjaar1_afbeeldingen/bloem.png" class="bloem-afbeelding" alt="Bloem">
                <span class="bloem-getal">${antwoord}</span>
            `;
            bloemDiv.addEventListener('click', handleBloemKlik);
            bloemenContainer.appendChild(bloemDiv);
        });
    }

    function handleBloemKlik(event) {
        if (bibiIsAanHetVliegen || !spelActief) return;

        const geklikteBloem = event.currentTarget;
        const gekozenAntwoord = parseInt(geklikteBloem.dataset.antwoord);

        bibiIsAanHetVliegen = true;

        const targetRect = geklikteBloem.getBoundingClientRect();
        const gameAreaRect = document.getElementById('game-area').getBoundingClientRect();

        const targetX = targetRect.left + (targetRect.width / 2) - gameAreaRect.left;
        const targetY = targetRect.top + (targetRect.height * 0.3) - gameAreaRect.top;

        const bibiCurrentTop = bibiVliegt.offsetTop;
        const bibiCurrentLeft = bibiVliegt.offsetLeft;

        bibiVliegt.style.transition = 'transform 0.8s ease-in-out, left 0.8s ease-in-out, top 0.8s ease-in-out';
        bibiVliegt.style.position = 'absolute';
        bibiVliegt.style.left = `${bibiCurrentLeft}px`;
        bibiVliegt.style.top = `${bibiCurrentTop}px`;
        bibiVliegt.style.bottom = 'auto';
        bibiVliegt.style.transform = 'none';

        requestAnimationFrame(() => {
            bibiVliegt.style.left = `${targetX - (bibiVliegt.offsetWidth / 2)}px`;
            bibiVliegt.style.top = `${targetY - (bibiVliegt.offsetHeight / 2)}px`;
        });

        setTimeout(() => {
            if (gekozenAntwoord === huidigeOefening.antwoord) {
                handleJuistAntwoord(geklikteBloem);
            } else {
                handleFoutAntwoord(geklikteBloem);
            }
        }, 800);
    }

    function handleJuistAntwoord(bloemElement) {
        scoreJuist++;
        oefeningenGemaakt++;
        updateScore();
        
        const feedbackBibi = document.createElement('img');
        feedbackBibi.src = 'leerjaar1_afbeeldingen/bibi_blij.png';
        feedbackBibi.classList.add('feedback-bibi-juist');
        
        const bibiRect = bibiVliegt.getBoundingClientRect();
        const gameAreaRect = document.getElementById('game-area').getBoundingClientRect();
        feedbackBibi.style.position = 'absolute';
        feedbackBibi.style.width = '80px';
        feedbackBibi.style.left = `${bibiRect.left - gameAreaRect.left}px`;
        feedbackBibi.style.top = `${bibiRect.top - gameAreaRect.top}px`;
        feedbackBibi.style.zIndex = '60';
        
        document.getElementById('game-area').appendChild(feedbackBibi);

        feedbackBibi.style.opacity = '0';
        setTimeout(() => {
            feedbackBibi.style.transition = 'opacity 1s ease-out, transform 1s ease-out';
            feedbackBibi.style.opacity = '1';
            feedbackBibi.style.transform = 'translateY(-30px)';
        }, 100);

        setTimeout(() => {
            feedbackBibi.style.opacity = '0';
            feedbackBibi.style.transform = 'translateY(-60px)';
        }, 1500);

        setTimeout(() => {
            feedbackBibi.remove();
            bloemElement.remove();
            resetBibiPositie();
            if (spelActief) genereerNieuweOefening();
            bibiIsAanHetVliegen = false;
        }, 2000);
    }

    function handleFoutAntwoord(bloemElement) {
        scoreFout++;
        updateScore();
        
        const feedbackBibi = document.createElement('img');
        feedbackBibi.src = 'leerjaar1_afbeeldingen/bibi_droevig.png';
        feedbackBibi.classList.add('feedback-bibi-fout');

        const bibiRect = bibiVliegt.getBoundingClientRect();
        const gameAreaRect = document.getElementById('game-area').getBoundingClientRect();
        feedbackBibi.style.position = 'absolute';
        feedbackBibi.style.width = '80px';
        feedbackBibi.style.left = `${bibiRect.left - gameAreaRect.left}px`;
        feedbackBibi.style.top = `${bibiRect.top - gameAreaRect.top}px`;
        feedbackBibi.style.zIndex = '60';

        document.getElementById('game-area').appendChild(feedbackBibi);

        feedbackBibi.style.opacity = '0';
        setTimeout(() => {
            feedbackBibi.style.transition = 'opacity 1s ease-out, transform 1s ease-out';
            feedbackBibi.style.opacity = '1';
            feedbackBibi.style.transform = 'translateY(-30px)';
        }, 100);

        setTimeout(() => {
            feedbackBibi.style.opacity = '0';
            feedbackBibi.style.transform = 'translateY(-60px)';
        }, 1500);

        setTimeout(() => {
            feedbackBibi.remove();

            const origineleBloemAfbeelding = bloemElement.querySelector('.bloem-afbeelding');
            origineleBloemAfbeelding.src = 'leerjaar1_afbeeldingen/bloem_zonder_blaadjes.png';
            
            for (let i = 0; i < 4; i++) {
                const blaadje = document.createElement('img');
                blaadje.src = 'leerjaar1_afbeeldingen/bloemblaadje.png';
                blaadje.classList.add('bloemblaadje');
                blaadje.style.left = `${Math.random() * bloemElement.offsetWidth * 0.6 + bloemElement.offsetWidth * 0.2}px`;
                blaadje.style.top = `${Math.random() * bloemElement.offsetHeight * 0.3}px`;
                bloemElement.appendChild(blaadje);
            }
            
            bloemElement.removeEventListener('click', handleBloemKlik);
            bloemElement.style.cursor = 'default';

            resetBibiPositie();
            bibiIsAanHetVliegen = false;
        }, 2000);
    }

    function resetBibiPositie() {
        bibiVliegt.style.transition = 'transform 0.8s ease-out, top 0.8s ease-out, left 0.8s ease-out';
        bibiVliegt.style.position = 'absolute';
        bibiVliegt.style.top = '200px'; 
        bibiVliegt.style.left = '50%';
        bibiVliegt.style.transform = 'translateX(-50%)';
        bibiVliegt.style.bottom = 'auto';
    }

    function eindSpel() {
        spelActief = false;
        stopTimers();
        
        console.log("eindSpel functie aangeroepen!");
        
        // Controleer of de elementen wel bestaan voordat je ze probeert te manipuleren
        if (gameContainerSpel) {
            console.log("gameContainerSpel gevonden. Hiding.");
            gameContainerSpel.classList.add('hidden');
        } else {
            console.error("gameContainerSpel niet gevonden!");
        }

        if (eindFeedback) {
            console.log("eindFeedback gevonden. Showing.");
            eindFeedback.classList.remove('hidden');
        } else {
            console.error("eindFeedback niet gevonden!");
        }

        console.log("gameContainerSpel hidden after attempt:", gameContainerSpel ? gameContainerSpel.classList.contains('hidden') : 'N/A');
        console.log("eindFeedback hidden after attempt:", eindFeedback ? eindFeedback.classList.contains('hidden') : 'N/A');

        // Logica voor eindfeedback afbeelding en tekst
        if (scoreJuist >= MIN_OEFENINGEN_VOOR_SUCCES && scoreFout === 0) {
            feedbackAfbeelding.src = 'leerjaar1_afbeeldingen/bibi_met_bloemen.png';
            feedbackTekst.textContent = 'GEWELDIG! Je hebt alle oefeningen perfect opgelost! Jij bent een echte bloemenweide-expert!';
        } else { // In alle andere gevallen (minder dan 20 juist, en/of fouten)
            feedbackAfbeelding.src = 'leerjaar1_afbeeldingen/juf_bibi.png';
            feedbackTekst.textContent = `Blijven oefenen, je kunt het! Je hebt ${scoreJuist} oefeningen correct en ${scoreFout} fout. Probeer het nog een keer!`;
        }
    }

    // Start het spel wanneer de pagina geladen is
    // De setTimeout kan soms nodig zijn om ervoor te zorgen dat alle DOM-elementen volledig geladen zijn.
    // Laten we de setTimeout behouden, aangezien dit in veel situaties de stabiliteit verhoogt.
    setTimeout(startSpel, 100); 
});
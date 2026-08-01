document.addEventListener('DOMContentLoaded', () => {
    const vraagContainer = document.getElementById('vraagContainer');
    const cactussenContainer = document.getElementById('cactussenContainer');
    const timerDisplay = document.getElementById('timer');
    const scoreJuistDisplay = document.getElementById('scoreJuist');
    const scoreFoutDisplay = document.getElementById('scoreFout');
    const knopOpnieuw = document.getElementById('knopOpnieuw');
    const knopTerugKeuze = document.getElementById('knopTerugKeuze');
    const feedbackContainer = document.getElementById('feedbackContainer');
    const feedbackImage = document.getElementById('feedbackImage');
    const feedbackText = document.getElementById('feedbackText');
    const feedbackOpnieuwKnop = document.getElementById('feedbackOpnieuwKnop');
    const feedbackTerugKnop = document.getElementById('feedbackTerugKnop'); // FOUT GECORRIGEERD

    let geselecteerdeTafels = [];
    let geselecteerdeSoort = '';
    let tijdOver = 120; // 2 minuten
    let scoreJuist = 0;
    let scoreFout = 0;
    let timerInterval;
    let huidigCorrectAntwoord = null;
    let isBeantwoord = false;
    let beantwoorddeOefeningen = 0;

    // Haal keuzes op uit localStorage
    function laadKeuzes() {
        const tafelsString = localStorage.getItem('woestijnjacht_tafels');
        const soort = localStorage.getItem('woestijnjacht_soort');

        if (tafelsString) {
            geselecteerdeTafels = JSON.parse(tafelsString);
            // Als 'alle' tafels is geselecteerd, genereer dan alle tafels van 0 t/m 10
            if (geselecteerdeTafels.includes('alle')) {
                geselecteerdeTafels = Array.from({ length: 11 }, (_, i) => i);
            }
        } else {
            // Fallback als er geen keuzes zijn, bv. 2, 5, 10
            geselecteerdeTafels = [2, 3, 4, 5, 6, 7, 8, 9, 10];
        }

        geselecteerdeSoort = soort || 'maal'; // Standaard op 'maal'
    }

    function genereerOefening() {
        // Zorg ervoor dat 0 niet als deler wordt gebruikt
        const tafelsVoorDelen = geselecteerdeTafels.filter(t => t !== 0);

        const soort = geselecteerdeSoort === 'beide' ? (Math.random() < 0.5 ? 'maal' : 'delen') : geselecteerdeSoort;
        let getal1, getal2, vraag, correct;

        if (soort === 'maal') {
            getal1 = geselecteerdeTafels[Math.floor(Math.random() * geselecteerdeTafels.length)];
            getal2 = Math.floor(Math.random() * 11); // Keer tot 10
            vraag = `${getal1} × ${getal2}`; // Correcte vraag voor vermenigvuldigen
            correct = getal1 * getal2;
        } else { // delen
            if (tafelsVoorDelen.length === 0) {
                // Als alleen tafel van 0 is gekozen voor delen, genereer een maal oefening
                // Dit is een fallback en zal hopelijk zelden voorkomen met goede keuzes
                return genereerOefeningForcedMaal();
            }
            getal1 = tafelsVoorDelen[Math.floor(Math.random() * tafelsVoorDelen.length)];
            getal2 = Math.floor(Math.random() * 11);
            vraag = `${getal1 * getal2} ÷ ${getal1}`; // Correctie: getalaantal was fout, moet getal1 zijn
            correct = getal2;
        }
        return { vraag, correct };
    }

    function genereerOefeningForcedMaal() {
        // Genereert een maal-oefening als delen niet mogelijk is door gekozen tafels
        const getal1 = Math.floor(Math.random() * 11);
        const getal2 = Math.floor(Math.random() * 11);
        return { vraag: `${getal1} × ${getal2}`, correct: getal1 * getal2 };
    }

    function genereerAntwoorden(correctAntwoord) {
        let antwoorden = new Set();
        antwoorden.add(correctAntwoord); // Zorg ervoor dat het correcte antwoord erin zit

        // Genereer foute antwoorden
        while (antwoorden.size < 5) { // Er moeten altijd 5 cactussen zijn
            let foutAntwoord;
            let offset = Math.floor(Math.random() * 21) - 10; // Getal tussen -10 en +10
            foutAntwoord = correctAntwoord + offset;

            // Voorkom dat antwoorden negatief worden
            if (foutAntwoord < 0) {
                foutAntwoord = Math.floor(Math.random() * 11); // Genereer een nieuw willekeurig getal tussen 0-10
            }

            // Voorkom dat foute antwoorden gelijk zijn aan het correcte antwoord of al in de set zitten
            if (!antwoorden.has(foutAntwoord)) {
                antwoorden.add(foutAntwoord);
            }
        }
        return Array.from(antwoorden).sort(() => 0.5 - Math.random()); // Schud de antwoorden
    }

    function toonCactussen(antwoorden, correctAntwoord) {
        cactussenContainer.innerHTML = '';
        isBeantwoord = false; // Reset de status voor de nieuwe vraag

        // Je kunt deze waarden nog steeds finetunen.
        const positions = [
            { top: '60%', left: '25%' },
            { top: '40%', left: '40%' },
            { top: '70%', left: '55%' },
            { top: '30%', left: '70%' },
            { top: '55%', left: '85%' }
        ];

        // Shuffle positions to make cactus placement more random for each question
        positions.sort(() => 0.5 - Math.random());

        antwoorden.forEach((antwoord, index) => {
            const cactusDiv = document.createElement('div');
            cactusDiv.className = 'cactus-optie';
            cactusDiv.innerHTML = `<span class="cactus-getal">${antwoord}</span>`;

            // Apply randomized position
            const pos = positions[index % positions.length]; // Use modulo for safety if more answers than positions
            cactusDiv.style.top = pos.top;
            cactusDiv.style.left = pos.left;
            // AANGEPAST: Initial rotation opslaan als CSS variabele
            const initialRotate = Math.random() * 20 - 10;
            cactusDiv.style.transform = `translate(-50%, -50%) rotate(${initialRotate}deg)`;
            cactusDiv.style.setProperty('--initial-rotate', `${initialRotate}deg`); 

            cactusDiv.addEventListener('click', () => {
                if (isBeantwoord) return; // Voorkom meerdere antwoorden per vraag
                isBeantwoord = true;

                if (parseInt(antwoord) === correctAntwoord) {
                    scoreJuist++;
                    scoreJuistDisplay.textContent = scoreJuist;
                    cactusDiv.classList.add('correct');
                    setTimeout(nieuweVraag, 600); // Kortere delay voor correct antwoord
                } else {
                    scoreFout++;
                    scoreFoutDisplay.textContent = scoreFout;
                    cactusDiv.classList.add('fout');
                    setTimeout(() => {
                        nieuweVraag();
                    }, 1000); // Langer voor foute feedback
                }
                beantwoorddeOefeningen++; // Tel elke beantwoorde oefening
            });
            cactussenContainer.appendChild(cactusDiv);
        });
    }

    function nieuweVraag() {
        const oef = genereerOefening();
        vraagContainer.textContent = oef.vraag;
        huidigCorrectAntwoord = oef.correct;
        const antwoorden = genereerAntwoorden(huidigCorrectAntwoord);
        toonCactussen(antwoorden, huidigCorrectAntwoord);
    }

    function startTimer() {
        tijdOver = 120; // Reset voor elke start
        timerDisplay.textContent = '02:00';
        startVisueleTimer();

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

    function eindeSpel() {
        clearInterval(timerInterval);
        if (window.visueelTimerIntervalId) { // Zorg ervoor dat de visuele timer ook stopt
            clearInterval(window.visueelTimerIntervalId);
        }
        cactussenContainer.innerHTML = ''; // Verwijder alle cactussen
        vraagContainer.style.display = 'none'; // Verberg de vraag
        feedbackContainer.classList.remove('hidden'); // Toon feedback

        let feedbackBericht = '';
        let feedbackImgSrc = '';

        if (scoreFout === 0 && scoreJuist >= 25) {
            feedbackBericht = `GEWELDIG! Je hebt ${scoreJuist} oefeningen perfect gemaakt zonder één fout! Jij bent een echte woestijnheld!`;
            feedbackImgSrc = 'leerjaar3_afbeeldingen/trofee.png'; // Een speciale afbeelding voor succes
        } else if (scoreFout === 0 && scoreJuist < 25) {
            feedbackBericht = `Bijna! Je had ${scoreJuist} juiste antwoorden zonder fouten, maar je kunt er nog meer binnen de tijd. Probeer het opnieuw!`;
            feedbackImgSrc = 'leerjaar3_afbeeldingen/karl_normaal.png';
        }
        else if (scoreFout > 0 && scoreJuist >= 25) {
            feedbackBericht = `Knap gedaan! Je hebt ${scoreJuist} oefeningen gemaakt, maar probeer de volgende keer geen fouten te maken! Concentreer je extra goed.`;
            feedbackImgSrc = 'leerjaar3_afbeeldingen/karl_normaal.png';
        }
        else {
            feedbackBericht = `Blijven oefenen, woestijnrover! Je had ${scoreJuist} juiste antwoorden en ${scoreFout} foute. De woestijn is pittig, maar jij kan het! Probeer het nog een keer!`;
            feedbackImgSrc = 'tafels_afbeeldingen/droevig.png';
        }

        feedbackText.textContent = feedbackBericht;
        feedbackImage.src = feedbackImgSrc;
    }

    // Visuele timer (overgenomen van tafels.js, met aanpassing voor 2 minuten)
    function startVisueleTimer() {
        const canvas = document.getElementById('timer-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const totaleTijd = 120; // 2 minuten
        let tijdVisueel = totaleTijd;

        if (window.visueelTimerIntervalId) {
            clearInterval(window.visueelTimerIntervalId);
        }

        function resizeCanvas() {
            // Zorg ervoor dat het canvas een perfect vierkant is, gebaseerd op de breedte van de parent
            const size = canvas.offsetWidth; // Gebruik offsetWidth van de parent div
            canvas.width = size;
            canvas.height = size; // Zorg dat de hoogte ook gelijk is aan de breedte
        }
        resizeCanvas();

        function tekenTaart(percentage) {
            const w = canvas.width;
            const h = canvas.height;
            const cx = w / 2 -1 ;
            // AANGEPAST: cy en radius voor taartvorm finetunen
            // cy: Pas deze waarde aan om de taartvorm verticaal te verplaatsen.
            // Een positieve waarde (+ getal) laat de taart zakken. Negatieve waarde (- getal) laat hem stijgen.
            const cy = h / 2 + 17; // Bijvoorbeeld: 10 pixels laten zakken vanaf het midden

            // radius: Pas deze waarde aan om de grootte van de taartvorm te bepalen.
            // Een kleinere vermenigvuldiger (bijv. * 0.6) maakt de taart kleiner. Een grotere (* 0.8) maakt hem groter.
            const radius = Math.min(w, h) / 2 * 0.54; // Bijvoorbeeld: 70% van de beschikbare ruimte

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

        tekenTaart(1); // Start met volle cirkel

        window.visueelTimerIntervalId = setInterval(() => {
            tijdVisueel--;
            const percentage = tijdVisueel / totaleTijd;
            tekenTaart(percentage);
            if (tijdVisueel <= 0) clearInterval(window.visueelTimerIntervalId);
        }, 1000);
    }

    // Event Listeners
    knopOpnieuw.addEventListener('click', () => {
        scoreJuist = 0;
        scoreFout = 0;
        beantwoorddeOefeningen = 0;
        scoreJuistDisplay.textContent = '0';
        scoreFoutDisplay.textContent = '0';
        feedbackContainer.classList.add('hidden');
        vraagContainer.style.display = 'block';
        cactussenContainer.innerHTML = '';
        clearInterval(timerInterval);
        if (window.visueelTimerIntervalId) clearInterval(window.visueelTimerIntervalId);
        nieuweVraag();
        startTimer();
    });

    knopTerugKeuze.addEventListener('click', () => {
        clearInterval(timerInterval);
        if (window.visueelTimerIntervalId) clearInterval(window.visueelTimerIntervalId);
        window.location.href = 'woestijnjacht_keuze.html';
    });

    feedbackOpnieuwKnop.addEventListener('click', () => {
        knopOpnieuw.click();
    });

    feedbackTerugKnop.addEventListener('click', () => {
        knopTerugKeuze.click();
    });

    laadKeuzes();
    nieuweVraag();
    startTimer();
});
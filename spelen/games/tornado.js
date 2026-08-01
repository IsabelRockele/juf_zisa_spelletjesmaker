const cactusContainer = document.getElementById("cactus-container");
const karlImage = document.getElementById("karl-afbeelding");
const oefeningTekst = document.getElementById("oefening-tekst");
const speechBubble = document.getElementById("speech-bubble");
const scoreJuistEl = document.getElementById('scoreJuist');
const scoreFoutEl = document.getElementById('scoreFout');
const btnOpnieuw = document.getElementById('btn-opnieuw');
const btnTerug = document = document.getElementById('btn-terug'); // Corrected typo here
const eindFeedback = document.getElementById('eind-feedback');
const feedbackAfbeelding = document.getElementById('feedback-afbeelding');
const feedbackTekst = document.getElementById('feedback-tekst');
const eindOpnieuwBtn = document.getElementById('eind-opnieuw');
const eindTerugBtn = document.getElementById('eind-terug');

const aantalCactussen = 8;
const straal = 180; // Afstand van het midden van de cirkel tot het midden van de cactus
let hoek = 0;
let animatieSnelheid = 0;

// NIEUWE SNELHEIDSFASEN
const SPEED_LEVEL_1 = 0.005; // AANGEPAST: Begint nu met de snelheid van SPEED_LEVEL_2
const SPEED_LEVEL_2 = 0.005;   // Deze blijft hetzelfde
const SPEED_LEVEL_3 = 0.02;    // Deze blijft hetzelfde
const SPEED_LEVEL_4 = 0.08;    // Deze blijft hetzelfde

let geselecteerdeTafels = [];
let geselecteerdeSoort = 'maal';
let huidigeOefening = {};
let gameActive = false;
let timer;
const OEFENING_TIJD_SECS = 15;
let timeLeftForSpeed = OEFENING_TIJD_SECS; // Resterende tijd voor snelheidsberekening
let scoreJuist = 0;
let scoreFout = 0;
let oefeningTeller = 0;
const TOTAAL_OEFENINGEN = 25;

const BlijeTeksten = [
    "Super!", "Geweldig!", "Goed gedaan!", "Fantastisch!", "Juist!", "Top!"
];
const MinderBlijeTeksten = [
    "Oeps! Fout.", "Jammer!", "Niet helemaal.", "Helaas, probeer opnieuw.", "Mis!"
];

let cactusElements = []; // Array om cactus DOM-elementen te bewaren voor hergebruik

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function laadKeuzes() {
    const tafelsString = localStorage.getItem('tornado_tafels');
    const soortString = localStorage.getItem('tornado_soort');

    if (tafelsString) {
        geselecteerdeTafels = JSON.parse(tafelsString);
    } else {
        geselecteerdeTafels = [2, 3, 4, 5, 6, 7, 8, 9, 10];
    }

    if (soortString) {
        geselecteerdeSoort = soortString;
    }
}

function genereerOefening() {
    let tafel;
    if (geselecteerdeTafels.includes('alle')) {
        tafel = Math.floor(Math.random() * 9) + 2;
    } else {
        tafel = getRandomItem(geselecteerdeTafels);
    }

    let getal1, getal2, antwoord, vraagTekst;
    let isMaal = false;

    if (geselecteerdeSoort === 'maal' || (geselecteerdeSoort === 'beide' && Math.random() < 0.5)) {
        isMaal = true;
        getal1 = tafel;
        getal2 = Math.floor(Math.random() * 10) + 1;
        antwoord = getal1 * getal2;
        vraagTekst = `${getal1} × ${getal2} = ?`;
    } else {
        isMaal = false;
        let product;
        do {
            getal1 = tafel;
            getal2 = Math.floor(Math.random() * 10) + 1;
            product = getal1 * getal2;
        } while (product === 0);

        antwoord = getal2;
        vraagTekst = `${product} : ${getal1} = ?`;
    }

    huidigeOefening = {
        getal1: getal1,
        getal2: getal2,
        antwoord: antwoord,
        vraagTekst: vraagTekst,
        isMaal: isMaal
    };

    oefeningTekst.textContent = vraagTekst;

    updateCactussenMetAntwoorden(antwoord);

    startTimer();
}

function initialisatieCactussen() {
    if (!cactusContainer.contains(karlImage)) {
        cactusContainer.appendChild(karlImage);
    }

    for (let i = 0; i < aantalCactussen; i++) {
        const cactus = document.createElement("div");
        cactus.classList.add("cactus");
        cactus.addEventListener('click', handleCactusClick);
        cactusContainer.appendChild(cactus);
        cactusElements.push(cactus);
    }
}

function updateCactussenMetAntwoorden(juistAntwoord) {
    const antwoorden = new Set();
    antwoorden.add(juistAntwoord);

    while (antwoorden.size < aantalCactussen) {
        let foutAntwoord;
        if (huidigeOefening.isMaal) {
            foutAntwoord = Math.floor(Math.random() * 101);
        } else {
            const minVal = Math.max(1, juistAntwoord - 5);
            const maxVal = juistAntwoord + 5;
            foutAntwoord = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;

            if (Math.random() < 0.3) {
                foutAntwoord = Math.floor(Math.random() * 11);
            }
        }

        if (foutAntwoord !== juistAntwoord && !antwoorden.has(foutAntwoord)) {
            antwoorden.add(foutAntwoord);
        }
    }

    const shuffeledAntwoorden = Array.from(antwoorden).sort(() => Math.random() - 0.5);

    cactusElements.forEach((cactus, index) => {
        cactus.textContent = shuffeledAntwoorden[index];
        cactus.dataset.antwoord = shuffeledAntwoorden[index];
        cactus.classList.remove('shake');
        cactus.style.display = ''; // Zorg dat ze zichtbaar zijn
    });

    hoek = 0;
    karlImage.style.animation = 'none';
    karlImage.style.transform = 'translate(-50%, -50%)';
    karlImage.style.opacity = '1';
}

function roteerCactussenLoop() {
    if (!gameActive) return;

    // NIEUWE SNELHEIDSBEREKENING OP BASIS VAN FASEN
    if (timeLeftForSpeed > 11) { // 15s tot 12s over (0-3s verstreken)
        animatieSnelheid = SPEED_LEVEL_1;
    } else if (timeLeftForSpeed > 7) { // 11s tot 8s over (4-7s verstreken)
        animatieSnelheid = SPEED_LEVEL_2;
    } else if (timeLeftForSpeed > 3) { // 7s tot 4s over (8-11s verstreken)
        animatieSnelheid = SPEED_LEVEL_3;
    } else { // 3s tot 0s over (12-15s verstreken)
        animatieSnelheid = SPEED_LEVEL_4;
    }

    cactusElements.forEach((cactus, index) => {
        const offset = (2 * Math.PI * index) / aantalCactussen + hoek;
        const x = straal * Math.cos(offset);
        const y = straal * Math.sin(offset);

        const schaal = 0.6 + 0.4 * (1 + Math.sin(offset));

        cactus.style.left = `${Math.round(200 + x)}px`;
        cactus.style.top = `${Math.round(200 + y)}px`;

        // De scale transformatie wordt nog steeds toegepast
        cactus.style.transform = `scale(${schaal})`;

        const KARL_Z_INDEX = 100;
        const normalizedY = (y + straal) / (2 * straal);
        cactus.style.zIndex = Math.floor(KARL_Z_INDEX - 10 + (normalizedY * 20));
    });

    hoek += animatieSnelheid;
    requestAnimationFrame(roteerCactussenLoop);
}

function startTimer() {
    clearTimeout(timer);
    timeLeftForSpeed = OEFENING_TIJD_SECS;
    oefeningTekst.textContent = huidigeOefening.vraagTekst + ` (${timeLeftForSpeed}s)`;

    timer = setInterval(() => {
        timeLeftForSpeed--;
        oefeningTekst.textContent = huidigeOefening.vraagTekst + ` (${timeLeftForSpeed}s)`;

        if (timeLeftForSpeed <= 0) {
            clearInterval(timer);
            handleFoutAntwoord("Tijd om!");
        }
    }, 1000);
}

function handleCactusClick(event) {
    if (!gameActive) return;

    clearInterval(timer);
    const gekozenAntwoord = parseInt(event.target.dataset.antwoord);

    if (gekozenAntwoord === huidigeOefening.antwoord) {
        handleJuistAntwoord();
    } else {
        event.target.classList.add('shake');
        setTimeout(() => {
            event.target.classList.remove('shake');
            handleFoutAntwoord(`Fout antwoord: ${gekozenAntwoord}`);
        }, 600);
    }
}

function handleJuistAntwoord() {
    scoreJuist++;
    oefeningTeller++;
    updateScore();
    toonKarlFeedback(true);
    resetEnVolgendeOefening();
}

function handleFoutAntwoord(reden) {
    scoreFout++;
    oefeningTeller++;
    updateScore();
    toonKarlFeedback(false, reden);
    vliegKarlWeg();
}

function updateScore() {
    scoreJuistEl.textContent = scoreJuist;
    scoreFoutEl.textContent = scoreFout;
}

function toonKarlFeedback(isCorrect, reden = "") {
    speechBubble.classList.remove('hidden');
    if (isCorrect) {
        speechBubble.textContent = getRandomItem(BlijeTeksten);
    } else {
        speechBubble.textContent = reden || getRandomItem(MinderBlijeTeksten);
    }

    const karlRect = karlImage.getBoundingClientRect();
    const marginVertical = 50; // Extra marge van de bovenkant/onderkant
    const marginHorizontal = 10; // Extra marge van de zijkanten

    // Bereken de gewenste top positie
    let desiredTop = karlRect.top - speechBubble.offsetHeight - 15; // Originele berekening

    // Pas aan als het te hoog is
    if (desiredTop < marginVertical) {
        desiredTop = marginVertical; // Plaats het op de minimale marge vanaf de top
    } else if (desiredTop + speechBubble.offsetHeight > window.innerHeight - marginVertical) {
        desiredTop = window.innerHeight - speechBubble.offsetHeight - marginVertical;
    }

    speechBubble.style.top = `${desiredTop}px`;
    speechBubble.style.left = `${karlRect.left + (karlRect.width / 2) - (speechBubble.offsetWidth / 2)}px`;

    // Pas aan als het buiten de horizontale marges valt
    if (parseFloat(speechBubble.style.left) < marginHorizontal) {
        speechBubble.style.left = `${marginHorizontal}px`;
    }
    if (parseFloat(speechBubble.style.left) + speechBubble.offsetWidth > window.innerWidth - marginHorizontal) {
        speechBubble.style.left = `${window.innerWidth - speechBubble.offsetWidth - marginHorizontal}px`;
    }

    setTimeout(() => {
        speechBubble.classList.add('hidden');
    }, 1500);
}

function vliegKarlWeg() {
    karlImage.style.animation = 'fly-away-karl 1s forwards';
    setTimeout(() => {
        karlImage.style.opacity = '0';
        karlImage.style.animation = 'none';
        karlImage.style.transform = 'translate(-50%, -50%)';
        karlImage.style.opacity = '1';
        resetEnVolgendeOefening();
    }, 1000);
}

function resetEnVolgendeOefening() {
    if (oefeningTeller >= TOTAAL_OEFENINGEN) {
        toonEindFeedback();
    } else {
        genereerOefening();
        timeLeftForSpeed = OEFENING_TIJD_SECS;
        hoek = 0;
    }
}

function startGame() {
    laadKeuzes();
    eindFeedback.classList.add('hidden');
    document.querySelector('.spel-container').classList.remove('hidden');

    scoreJuist = 0;
    scoreFout = 0;
    oefeningTeller = 0;
    updateScore();
    gameActive = true;
    timeLeftForSpeed = OEFENING_TIJD_SECS;
    hoek = 0;

    if (cactusElements.length === 0) {
        initialisatieCactussen();
    } else {
        cactusElements.forEach(c => c.style.display = '');
        karlImage.style.display = '';
        karlImage.style.animation = 'none';
        karlImage.style.transform = 'translate(-50%, -50%)';
        karlImage.style.opacity = '1';
    }

    genereerOefening();
    roteerCactussenLoop();
}

function goBackToMenu() {
    gameActive = false;
    clearInterval(timer);

    cactusElements.forEach(c => c.style.display = 'none');
    karlImage.style.display = 'none';

    eindFeedback.classList.add('hidden');
    karlImage.style.animation = 'none';
    karlImage.style.transform = 'translate(-50%, -50%)';
    karlImage.style.opacity = '1';
    window.location.href = 'tornado_keuze.html';
}

function toonEindFeedback() {
    gameActive = false;
    clearInterval(timer);

    cactusElements.forEach(c => c.style.display = 'none');
    karlImage.style.display = 'none';

    document.querySelector('.spel-container').classList.add('hidden');
    eindFeedback.classList.remove('hidden');

    // AANGEPAST: Om de feedbackcontainer lager te plaatsen, kun je de 'top' van 'eind-feedback' aanpassen
    // Dit kan via CSS of hier via JS als je het dynamisch wilt doen.
    // Laten we de CSS aanpassen voor een algemene positionering van de feedback.
    
    if (scoreFout === 0) {
        feedbackAfbeelding.src = 'leerjaar3_afbeeldingen/karl_juichend.png';
        feedbackTekst.textContent = 'Dikke proficiat! Geen enkele fout!';
    } else if (scoreFout < TOTAAL_OEFENINGEN / 4) {
        feedbackAfbeelding.src = 'leerjaar3_afbeeldingen/karl_normaal.png';
        feedbackTekst.textContent = `Goed gedaan! Je had ${scoreJuist} juiste antwoorden en ${scoreFout} foute.`;
    } else {
        feedbackAfbeelding.src = 'leerjaar3_afbeeldingen/karl_normaal.png';
        feedbackTekst.textContent = `Blijf oefenen! Je had ${scoreJuist} juiste antwoorden en ${scoreFout} foute.`;
    }
}

// Event Listeners voor de knoppen
btnOpnieuw.addEventListener('click', startGame);
btnTerug.addEventListener('click', goBackToMenu);
eindOpnieuwBtn.addEventListener('click', () => {
    cactusElements.forEach(c => c.style.display = '');
    karlImage.style.display = '';
    startGame();
});
eindTerugBtn.addEventListener('click', goBackToMenu);

// Start het spel wanneer de pagina volledig geladen is
window.onload = () => {
    startGame();
};
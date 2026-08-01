// honingpot_vullen_spel.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elementen ---
    const oefeningDiv = document.getElementById('oefening');
    const antwoordInput = document.getElementById('antwoord-input');
    const toetsenbord = document.querySelector('.toetsenbord');
    const legePotImg = document.getElementById('lege-pot-overlay-img');
    const vollePotImg = document.getElementById('volle-pot-img');
    const honingdruppelContainer = document.getElementById('honingdruppel-container');
    const honingpotContainer = document.querySelector('.honingpot-container');
    
    // Het Grote Feedbackscherm (alleen voor einde spel)
    const feedbackScreen = document.getElementById('feedback-screen');
    const feedbackMessage = document.getElementById('feedback-message');
    const feedbackImage = document.getElementById('feedback-image');
    const feedbackRestartButton = document.getElementById('feedback-restart-button');
    const feedbackMenuButton = document.getElementById('feedback-menu-button');
    
    // De kleine feedback pop-ups
    const foutSpreekballon = document.getElementById('fout-spreekballon');
    const jufBibiPopup = document.getElementById('juf-bibi-popup');
    const jufBibiPopupMessage = jufBibiPopup.querySelector('p');

    const opnieuwKnop = document.getElementById('opnieuw-knop');
    
    // Event listeners voor hoofdnavigatie en einde-spel knoppen
    feedbackRestartButton.addEventListener('click', handleFeedbackRestartClick); // Deze blijft voor einde spel
    feedbackMenuButton.addEventListener('click', () => {
        window.location.href = 'honingpot_vullen_keuze.html';
    });

    if (opnieuwKnop) {
        opnieuwKnop.addEventListener('click', (e) => {
            e.preventDefault();
            startSpel(); 
        });
    }

    // --- Spel Variabelen ---
    let level, operation;
    let juisteAntwoordenTeller = 0;
    let foutenTeller = 0;
    const MAX_JUISTE_ANTWOORDEN = 20;
    let huidigCorrectAntwoord = null;
    let spelActief = false;

    let huidigeOefeningFoutTeller = 0; 
    let huidigeOefeningTekst = ''; 

    const INITIAL_CLIP_OFFSET = 10; 
    const MAX_CLIP_PERCENTAGE = 85; 

    const WORKABLE_CLIP_RANGE = MAX_CLIP_PERCENTAGE - INITIAL_CLIP_OFFSET;
    const CLIP_INCREASE_PER_ANSWER_PERCENTAGE = Math.max(0, WORKABLE_CLIP_RANGE / MAX_JUISTE_ANTWOORDEN);
    const CLIP_DECREASE_PER_MISTAKE_PERCENTAGE = 5;

    let currentClipPercentageBottom = INITIAL_CLIP_OFFSET;


    const urlParams = new URLSearchParams(window.location.search);
    level = parseInt(urlParams.get('level')) || 10;
    operation = urlParams.get('operation') || 'both';

    // --- Spel Functies ---

    function startSpel() {
        console.log("startSpel aangeroepen. Spel initialiseren...");
        resetSpel(); 
        genereerNieuweOefening(); 
        // Zorg dat algemeen feedbackscherm verborgen is bij start
        feedbackScreen.classList.add('hidden'); 
        document.getElementById('game-screen').classList.remove('hidden');
        spelActief = true;
        console.log("Spel is nu actief: " + spelActief);
    }

    function resetSpel() {
        juisteAntwoordenTeller = 0;
        foutenTeller = 0;
        huidigeOefeningFoutTeller = 0; 
        currentClipPercentageBottom = INITIAL_CLIP_OFFSET; 
        updatePotVulling(); 
        antwoordInput.value = '';
        verbergAllePopupsDirect(); // Zorg dat alle pop-ups verborgen zijn bij reset
        console.log("Spel gereset.");
    }

    function updatePotVulling() {
        if (legePotImg) {
            legePotImg.style.clipPath = `inset(0% 0% ${currentClipPercentageBottom}% 0%)`;
            console.log(`Potvulling geüpdatet: clip-path inset(0% 0% ${currentClipPercentageBottom}% 0%)`);
        } else {
            console.error("Fout: legePotImg element niet gevonden bij updatePotVulling.");
        }
    }

    function laatHoningdruppelVallen() {
        console.log("laatHoningdruppelVallen aangeroepen.");
        const druppel = document.createElement('img');
        druppel.src = 'leerjaar1_afbeeldingen/honingdruppel.png';
        druppel.classList.add('honingdruppel');

        if (!honingpotContainer || !legePotImg) {
            console.error("Fout: Honingpot container of lege pot overlay niet gevonden voor druppel.");
            return;
        }

        const potContainerRect = honingpotContainer.getBoundingClientRect();
        const legePotRect = legePotImg.getBoundingClientRect();

        const druppelStartX = potContainerRect.left + (potContainerRect.width * 0.5) - (druppel.offsetWidth / 2);
        
        druppel.style.left = `${druppelStartX}px`;

        const styleSheet = document.styleSheets[0];
        if (!styleSheet) {
            console.error("Geen stylesheet gevonden om dynamische animatie toe te voegen voor druppel.");
            honingdruppelContainer.appendChild(druppel);
            setTimeout(() => druppel.remove(), 2000);
            return;
        }

        const animationName = `druppel-val-dynamic-${Date.now()}`;

        const keyframesRule = `
            @keyframes ${animationName} {
                0% {
                    opacity: 0;
                    transform: translateY(-100px) scale(0.5);
                }
                20% {
                    opacity: 1;
                    transform: translateY(${potContainerRect.top - druppel.offsetHeight}px) scale(1);
                }
                80% {
                    opacity: 1;
                    transform: translateY(${potContainerRect.top + legePotRect.height - (legePotRect.height * (currentClipPercentageBottom / 100)) - (druppel.offsetHeight / 2)}px) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translateY(${potContainerRect.top + legePotRect.height - (legePotRect.height * (currentClipPercentageBottom / 100)) - (druppel.offsetHeight / 2) + 20}px) scale(0.5);
                }
            }
        `;
        
        try {
            styleSheet.insertRule(keyframesRule, styleSheet.cssRules.length);
            druppel.style.animationName = animationName;
            druppel.style.animationDuration = '1.5s';
            druppel.style.animationTimingFunction = 'ease-in';
            druppel.style.animationFillMode = 'forwards';

            honingdruppelContainer.appendChild(druppel);

            druppel.addEventListener('animationend', () => {
                druppel.remove();
                for (let i = 0; i < styleSheet.cssRules.length; i++) {
                    if (styleSheet.cssRules[i].name === animationName) {
                        styleSheet.deleteRule(i);
                        break;
                    }
                }
            });
        } catch (e) {
            console.error("Fout bij het invoegen of toepassen van CSS keyframe rule:", e);
            honingdruppelContainer.appendChild(druppel);
            setTimeout(() => druppel.remove(), 2000);
        }
    }

    function genereerNieuweOefening() {
        huidigeOefeningFoutTeller = 0; // Reset de foutteller voor de nieuwe oefening

        let num1, num2;
        let operator;

        const beschikbareOperaties = [];
        if (operation === 'plus' || operation === 'both') {
            beschikbareOperaties.push('+');
        }
        if (operation === 'min' || operation === 'both') {
            beschikbareOperaties.push('-');
        }

        if (beschikbareOperaties.length === 0) {
            oefeningDiv.textContent = "Geen operatie geselecteerd.";
            console.error("Geen operatietype (plus/min/both) geselecteerd uit URL parameters.");
            return;
        }

        operatie = beschikbareOperaties[Math.floor(Math.random() * beschikbareOperaties.length)];

        const currentLevel = level && !isNaN(level) ? level : 10; 

        if (operatie === '+') {
            if (currentLevel === 10) {
                num1 = Math.floor(Math.random() * 11);
                num2 = Math.floor(Math.random() * (11 - num1));
            } else { // currentLevel === 20 (geen brug bij optellen tot 20)
                let attempts = 0;
                do {
                    num1 = Math.floor(Math.random() * 21); 
                    num2 = Math.floor(Math.random() * (21 - num1)); 
                    attempts++;
                } while (attempts < 100 && ((num1 % 10) + (num2 % 10) >= 10)); 
                
                if (attempts === 100) {
                    console.warn("Geen niet-brugoefening voor optellen tot 20 gevonden na 100 pogingen. Mogelijk een brugoefening gegenereerd.");
                }
            }
            huidigCorrectAntwoord = num1 + num2;
            huidigeOefeningTekst = `${num1} + ${num2} =`; 
        } else { // operatie === '-'
            if (currentLevel === 10) {
                num1 = Math.floor(Math.random() * 11); 
                num2 = Math.floor(Math.random() * (num1 + 1)); 
            } else { // currentLevel === 20 (geen brug bij aftrekken tot 20)
                let attempts = 0;
                do {
                    num1 = Math.floor(Math.random() * 21); 
                    num2 = Math.floor(Math.random() * (num1 + 1)); 
                    attempts++;
                } while (attempts < 100 && ((num1 % 10) < (num2 % 10))); 
                
                if (attempts === 100) {
                    console.warn("Geen niet-brugoefening voor aftrekken tot 20 gevonden na 100 pogingen. Mogelijk een brugoefening gegenereerd.");
                }
            }
            huidigCorrectAntwoord = num1 - num2;
            huidigeOefeningTekst = `${num1} - ${num2} =`; 
        }

        oefeningDiv.textContent = huidigeOefeningTekst; 
        antwoordInput.value = '';
        antwoordInput.focus();
        console.log(`Nieuwe oefening gegenereerd: ${oefeningDiv.textContent} Antwoord: ${huidigCorrectAntwoord}`);
    }

    function handleToetsenbordKlik(event) {
        event.preventDefault(); // voorkomt “synthetic click”/dubbel op iOS
        if (!spelActief) {
            console.warn("Toetsenbordklik genegeerd: spel niet actief.");
            return;
        }

        const clickedButton = event.target.closest('button');
        if (!clickedButton) return;

        const value = clickedButton.dataset.value;

        if (value === 'enter') {
            controleerAntwoord();
        } else if (value === 'delete') {
            antwoordInput.value = antwoordInput.value.slice(0, -1);
        } else {
            if (antwoordInput.value.length < 3) {
                antwoordInput.value += value;
            }
        }
    }

    function handleFysiekToetsenbord(event) {
    if (!spelActief) return;

    if (event.key === 'Enter') {
        // OK/controle
        event.preventDefault();
        controleerAntwoord();
        return;
    }

    // Pijlen, Backspace, Delete, Tab: gewoon toelaten
    if (event.key === 'Backspace' || event.key === 'Delete' || event.key === 'Tab' ||
        event.key.startsWith('Arrow')) {
        return;
    }

    // Cijfers NIET zelf toevoegen — laat de browser/iPad het doen (voorkomt dubbel)
    if (/^\d$/.test(event.key)) {
        return;
    }

    // Alles anders blokkeren (letters, symbolen, ...)
    event.preventDefault();
}


    // NIEUWE FUNCTIES VOOR POP-UPS:
    function toonFoutSpreekballon() {
        foutSpreekballon.querySelector('p').textContent = "Oeps, foutje. Probeer nog eens.";
        foutSpreekballon.classList.remove('hidden');
        foutSpreekballon.classList.add('visible');
        setTimeout(() => {
            foutSpreekballon.classList.remove('visible');
            setTimeout(() => foutSpreekballon.classList.add('hidden'), 300); // Wacht op fade-out animatie
        }, 3000); // Spreekballon blijft 3 seconden zichtbaar
    }

    function toonJufBibiPopup() {
        jufBibiPopupMessage.innerHTML = `De oefening ${huidigeOefeningTekst} is ${huidigCorrectAntwoord}.`;
        jufBibiPopup.classList.remove('hidden');
        jufBibiPopup.classList.add('visible');
        setTimeout(() => {
            jufBibiPopup.classList.remove('visible');
            setTimeout(() => jufBibiPopup.classList.add('hidden'), 300); // Wacht op fade-out animatie
        }, 4000); // Juf Bibi pop-up blijft 4 seconden zichtbaar
    }

    function verbergAllePopupsDirect() { // Nieuwe naam
        foutSpreekballon.classList.remove('visible');
        jufBibiPopup.classList.remove('visible');
        // Direct toevoegen van 'hidden' zonder extra setTimeout, want dit is voor 'direct' verbergen
        foutSpreekballon.classList.add('hidden');
        jufBibiPopup.classList.add('hidden');
    }


    function controleerAntwoord() {
        const ingevoerdAntwoord = parseInt(antwoordInput.value);

        // Verwijder de aanroep van verbergAllePopupsDirect() hier, deze wordt nu alleen bij correct antwoord of reset aangeroepen.
        // OUDE REGEL: verbergPopups(); 

        if (!spelActief || antwoordInput.value === '') { 
            console.warn("Geen geldig antwoord ingevoerd of spel niet actief.");
            return;
        }

        if (ingevoerdAntwoord === huidigCorrectAntwoord) {
            console.log("Antwoord JUIST! Pot vult, druppel valt.");
            juisteAntwoordenTeller++;
            huidigeOefeningFoutTeller = 0; 

            currentClipPercentageBottom = Math.min(MAX_CLIP_PERCENTAGE, currentClipPercentageBottom + CLIP_INCREASE_PER_ANSWER_PERCENTAGE);
            updatePotVulling();
            laatHoningdruppelVallen();

            if (juisteAntwoordenTeller === MAX_JUISTE_ANTWOORDEN || currentClipPercentageBottom >= MAX_CLIP_PERCENTAGE) {
                setTimeout(eindSpel, 900);
            } else {
                // Voeg hier de oproep toe:
                verbergAllePopupsDirect(); // Verberg pop-ups na een correct antwoord voordat nieuwe oefening komt
                genereerNieuweOefening();
            }
        } else {
            console.log("Antwoord FOUT!");
            foutenTeller++;
            
            currentClipPercentageBottom = Math.max(INITIAL_CLIP_OFFSET, currentClipPercentageBottom - CLIP_DECREASE_PER_MISTAKE_PERCENTAGE);
            updatePotVulling();
            antwoordInput.value = ''; 

            huidigeOefeningFoutTeller++; 

            if (huidigeOefeningFoutTeller === 1) {
                // Eerste keer fout: Toon spreekballon
                console.log("Eerste fout, dezelfde oefening opnieuw.");
                toonFoutSpreekballon();
                antwoordInput.focus();
                
            } else if (huidigeOefeningFoutTeller >= 2) {
                // Tweede keer fout: Toon Juf Bibi popup en ga daarna naar een nieuwe oefening
                console.log("Tweede fout, toon correct antwoord met Juf Bibi.");
                toonJufBibiPopup();
                // De oefening verandert na een korte delay, zodat de Juf Bibi popup zichtbaar is
                setTimeout(() => {
                    genereerNieuweOefening();
                    // verbergAllePopupsDirect() wordt ook aangeroepen aan het begin van controleerAntwoord() wanneer de nieuwe oefening wordt gegenereerd
                    // en het nieuwe antwoord wordt ingevoerd, wat de pop-up dan zal verbergen.
                    // Het is niet nodig om verbergAllePopupsDirect hier expliciet aan te roepen, omdat genereerNieuweOefening
                    // niet direct de popups verbergt, maar de volgende correcte invoer dat zal doen.
                    // Echter, voor consistentie en zekerheid bij een lange pop-up duur, kunnen we dit hier toevoegen.
                    // Optioneel: verbergAllePopupsDirect(); // Voeg dit toe als je zeker wilt zijn dat de popup direct na de delay verdwijnt.
                }, 4000); // Wacht 4 seconden (duur van Juf Bibi popup)
            }
        }
    }

    // handleFeedbackRestartClick blijft alleen voor het EINDE-SPEL scherm
    function handleFeedbackRestartClick() {
        feedbackScreen.classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        antwoordInput.focus(); 
        startSpel(); 
        
        feedbackRestartButton.textContent = "Nog eens proberen!"; 
        feedbackRestartButton.dataset.action = 'reset_game'; 
    }


    function eindSpel() {
        spelActief = false;
        verbergAllePopupsDirect(); // Verberg eventuele kleine pop-ups voordat het grote scherm komt
        document.getElementById('game-screen').classList.add('hidden');
        feedbackScreen.classList.remove('hidden');

        if (foutenTeller === 0 && juisteAntwoordenTeller === MAX_JUISTE_ANTWOORDEN) {
            feedbackMessage.textContent = "Fantastisch! Je bent een echte rekenkanjer, alles in één keer juist en de pot is vol!";
            feedbackImage.src = "leerjaar1_afbeeldingen/bibi_eet_honing.png";
            feedbackRestartButton.textContent = "Speel nog eens!";
        } else {
            feedbackMessage.textContent = `Goed gedaan! Je hebt ${juisteAntwoordenTeller} oefeningen correct en ${foutenTeller} fouten gemaakt. Probeer het nog eens en vul de pot zonder fouten!`;
            feedbackImage.src = "leerjaar1_afbeeldingen/juf_bibi.png";
            feedbackRestartButton.textContent = "Nog eens proberen!";
        }
        feedbackRestartButton.dataset.action = 'reset_game';
        console.log("Einde spel. Feedback getoond.");
    }

    // --- Initialisatie Logica ---
    let imagesLoadedCount = 0;
    const totalImagesToLoad = 2; 

    function checkAllImagesLoaded() {
        imagesLoadedCount++;
        if (imagesLoadedCount === totalImagesToLoad) {
            console.log("Alle benodigde potafbeeldingen voor initialisatie geladen.");
            if (!legePotImg || !vollePotImg || !honingpotContainer) {
                console.error("Essentiële DOM-elementen voor pot of container niet gevonden na laden afbeeldingen. Initialisatie gestopt.");
                return;
            }
            updatePotVulling(); 
            startSpel(); 
        }
    }
    
    if (!vollePotImg) {
        console.error("vollePotImg element niet gevonden! Initialisatie van de potvulling is mogelijk incorrect.");
    } else {
        if (vollePotImg.complete) {
            console.log("volle_honingpot.png (basis img) is al geladen.");
            checkAllImagesLoaded();
        } else {
            vollePotImg.onload = () => { console.log("volle_honingpot.png (basis img) geladen."); checkAllImagesLoaded(); };
            vollePotImg.onerror = () => { 
                console.error("Fout bij laden volle_honingpot.png (basis img). Ga door met initialisatie."); 
                checkAllImagesLoaded(); 
            };
        }
    }

    if (legePotImg) {
        if (legePotImg.complete) {
            console.log("lege_honingpot.png (overlay img) is al geladen.");
            checkAllImagesLoaded();
        } else {
            legePotImg.onload = () => { console.log("lege_honingpot.png (overlay img) geladen."); checkAllImagesLoaded(); };
            legePotImg.onerror = () => { 
                console.error("Fout bij laden lege_honingpot.png (overlay img). Ga door met initialisatie."); 
                checkAllImagesLoaded(); 
            };
        }
    } else {
        console.error("legePotImg element niet gevonden! Initialisatie van de potvulling is mogelijk incorrect.");
    }

    if (toetsenbord) {
        console.log("Toetsenbord element gevonden. Event listener wordt gekoppeld.");
        toetsenbord.addEventListener('pointerup', handleToetsenbordKlik, { passive: false });
    } else {
        console.error("Toetsenbord element niet gevonden! Kan event listener niet koppelen.");
    }

    if (antwoordInput) {
    console.log("Antwoord input element gevonden. Keydown listener wordt gekoppeld.");
    antwoordInput.addEventListener('keydown', handleFysiekToetsenbord);
    antwoordInput.addEventListener('input', () => {
        antwoordInput.value = antwoordInput.value.replace(/\D/g, '').slice(0, 3);
    });
} else {
    console.error("Antwoord input element niet gevonden! Kan keydown listener niet koppelen.");
}
});
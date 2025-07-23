document.addEventListener('DOMContentLoaded', () => {
    // Schermen
    const themeSelectionScreen = document.getElementById('themeSelectionScreen');
    const timerScreen = document.getElementById('timerScreen');
    
    // Keuze knoppen
    const themeButtons = document.querySelectorAll('.theme-buttons button');
    const timeButtonsContainer = document.querySelector('.time-buttons');
    const timeButtons = document.querySelectorAll('.time-buttons button');
    const timeChoiceHeader = document.getElementById('timeChoiceHeader');

    // Timer display elementen
    const currentThemeDisplay = document.getElementById('currentThemeDisplay');
    const countdownDisplay = document.getElementById('countdown');
    const timerMessage = document.getElementById('timerMessage');

    // Visuele containers
    const rainbowContainer = document.getElementById('rainbowContainer');
    const starContainer = document.getElementById('starContainer');
    const fallingStarsContainer = document.getElementById('fallingStarsContainer');
    const aquariumContainer = document.getElementById('aquariumContainer');
    
    // Regenboog elementen
    const rainbowPaths = Array.from(document.querySelectorAll('.rainbow-path')).reverse();
    const goldImage = document.getElementById('goldImage');
    let pathLengths = [];

    // Ster element
    const timerStar = document.getElementById('timerStar');

    // Aquarium elementen
    const treasureChestClosed = document.getElementById('treasureChestClosed');
    const treasureChestOpen = document.getElementById('treasureChestOpen');
    const goldCoinContainer = document.getElementById('goldCoinContainer');
    let fishElements = [];

    // Knoppen
    const startButton = document.getElementById('startButton');
    const pauseButton = document.getElementById('pauseButton');
    const newTimerButton = document.getElementById('newTimerButton');

    // Timer state
    let countdownInterval;
    let totalSeconds;
    let initialTotalSeconds = 0;
    let isPaused = false;
    let currentThemeChosen = '';

    // Geluid
    const timeUpSound = new Audio('sounds/chime.mp3');

    function showScreen(screenToShow) {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        screenToShow.classList.add('active');
    }

    function showVisual(theme) {
        [rainbowContainer, starContainer, aquariumContainer].forEach(c => c.classList.remove('active'));
        if (theme === 'rainbow') rainbowContainer.classList.add('active');
        if (theme === 'star') starContainer.classList.add('active');
        if (theme === 'aquarium') {
            aquariumContainer.classList.add('active');
            initializeAquarium();
        }
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    // --- Regenboog Specifiek ---
    function updateRainbow() {
        if (!initialTotalSeconds) return;
        const elapsedPercentage = (initialTotalSeconds - totalSeconds) / initialTotalSeconds;
        const animationPhase = elapsedPercentage * rainbowPaths.length;
        rainbowPaths.forEach((path, index) => {
            const fillPercentage = Math.max(0, Math.min(1, animationPhase - index));
            path.style.strokeDashoffset = pathLengths[index] * (1 - fillPercentage);
        });
    }

    // --- Ster Specifiek ---
    function startStarAnimation() {
        timerStar.classList.add('animate');
        timerStar.style.animationDuration = `${initialTotalSeconds}s`;
        timerStar.style.animationPlayState = 'running';
    }

    function pauseStarAnimation() {
        timerStar.style.animationPlayState = 'paused';
    }

    function createFallingStars() {
        fallingStarsContainer.innerHTML = '';
        fallingStarsContainer.style.display = 'block';
        for (let i = 0; i < 20; i++) {
            const star = document.createElement('div');
            star.className = 'falling-star';

            const size = Math.random() * 20 + 10;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.animationDuration = `${Math.random() * 2 + 3}s`;
            star.style.animationDelay = `${Math.random() * 4}s`;

            fallingStarsContainer.appendChild(star);
        }
    }

    // --- Aquarium Specifiek ---
    function initializeAquarium() {
        aquariumContainer.querySelectorAll('.fish').forEach(fish => fish.remove());
        fishElements = [];
        for (let i = 0; i < 60; i++) {
            const fish = document.createElement('img');
            fish.src = `klok_afbeeldingen/vis${(i % 10) + 1}.png`;
            fish.className = 'fish';
            fish.id = `fish-${i}`;
            
            // Logica voor diepte en grootte
            const scale = Math.random() * 0.7 + 0.5;
            const direction = Math.random() > 0.5 ? 1 : -1;
            
            fish.style.transform = `scale(${scale}) scaleX(${direction})`;
            fish.style.zIndex = Math.round(scale * 10);

            // Positionering (met ruimte voor de schatkist)
            fish.style.top = `${Math.random() * 70}%`; // Max 70% van boven, zodat de onderste 30% vrij blijft
            fish.style.left = `${Math.random() * 90}%`;
            
            aquariumContainer.appendChild(fish);
            fishElements.push(fish);
        }
    }

    function updateAquarium() {
        if (!initialTotalSeconds) return;
        if ((totalSeconds + 1) % 60 === 0 && totalSeconds + 1 !== initialTotalSeconds) {
            fishElements.forEach(fish => fish.style.opacity = '1');
        }
        const secondsInMinute = totalSeconds % 60;
        const fishToHide = document.getElementById(`fish-${secondsInMinute}`);
        if (fishToHide) {
            fishToHide.style.opacity = '0';
        }
    }

    function startGoldCoinAnimation() {
        goldCoinContainer.innerHTML = '';
        for (let i = 0; i < 10; i++) {
            const coin = document.createElement('div');
            coin.className = 'gold-coin';
            coin.style.left = `${Math.random() * 90}px`;
            coin.style.animationDelay = `${Math.random() * 1.5}s`;
            goldCoinContainer.appendChild(coin);
        }
    }

    // --- Hoofd Timer Functies ---
    function startCountdown() {
        if (isPaused) {
            isPaused = false;
        } 
        
        if (currentThemeChosen === 'star') {
            if (isPaused) {
                timerStar.style.animationPlayState = 'running';
            } else {
                startStarAnimation();
            }
        }

        startButton.style.display = 'none';
        pauseButton.style.display = 'inline-block';
        
        countdownInterval = setInterval(() => {
            if (totalSeconds <= 0) {
                clearInterval(countdownInterval);
                countdownDisplay.textContent = "00:00";
                timerMessage.textContent = "Tijd is om!";
                timeUpSound.play();
                
                if (currentThemeChosen === 'rainbow') goldImage.classList.add('visible');
                if (currentThemeChosen === 'star') createFallingStars();
                if (currentThemeChosen === 'aquarium') {
                    treasureChestClosed.style.opacity = '0';
                    treasureChestOpen.style.opacity = '1';
                    startGoldCoinAnimation();
                }
                
                startButton.textContent = "Opnieuw";
                startButton.style.display = 'inline-block';
                pauseButton.style.display = 'none';
                return;
            }

            totalSeconds--;
            countdownDisplay.textContent = formatTime(totalSeconds);
            if (currentThemeChosen === 'rainbow') updateRainbow();
            if (currentThemeChosen === 'aquarium') updateAquarium();

        }, 1000);
    }

    function pauseCountdown() {
        clearInterval(countdownInterval);
        isPaused = true;
        if (currentThemeChosen === 'star') pauseStarAnimation();
        
        startButton.textContent = "Hervat";
        startButton.style.display = 'inline-block';
        pauseButton.style.display = 'none';
    }

    function resetTimer() {
        clearInterval(countdownInterval);
        isPaused = false;
        totalSeconds = initialTotalSeconds;
        countdownDisplay.textContent = formatTime(totalSeconds);
        timerMessage.textContent = '';
        
        if (currentThemeChosen === 'rainbow') {
            updateRainbow();
            goldImage.classList.remove('visible');
        }
        if (currentThemeChosen === 'star') {
            timerStar.classList.remove('animate');
            fallingStarsContainer.style.display = 'none';
            fallingStarsContainer.innerHTML = '';
        }
        if (currentThemeChosen === 'aquarium') {
            fishElements.forEach(fish => fish.style.opacity = '1');
            treasureChestClosed.style.opacity = '1';
            treasureChestOpen.style.opacity = '0';
            goldCoinContainer.innerHTML = '';
        }

        startButton.textContent = "Start";
        startButton.style.display = 'inline-block';
        pauseButton.style.display = 'none';
    }

    // --- Event Listeners ---
    themeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            currentThemeChosen = event.target.dataset.theme;
            const themeName = event.target.textContent;
            timeChoiceHeader.textContent = `Kies tijd voor de ${themeName}:`;
            timeButtonsContainer.style.display = 'block';
        });
    });

    timeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const minutes = parseInt(event.target.dataset.minutes);
            initialTotalSeconds = minutes * 60;
            
            showVisual(currentThemeChosen);
            document.body.className = `theme-${currentThemeChosen}`;
            
            if(currentThemeChosen === 'rainbow') currentThemeDisplay.textContent = 'Regenboog Timer';
            if(currentThemeChosen === 'star') currentThemeDisplay.textContent = 'Groeiende Ster';
            if(currentThemeChosen === 'aquarium') currentThemeDisplay.textContent = 'Aquarium Timer';
            
            resetTimer();
            showScreen(timerScreen);
        });
    });

    startButton.addEventListener('click', () => {
        if (totalSeconds <= 0) {
             resetTimer();
        }
        startCountdown();
    });

    pauseButton.addEventListener('click', pauseCountdown);

    newTimerButton.addEventListener('click', () => {
        clearInterval(countdownInterval);
        initialTotalSeconds = 0;
        document.body.className = '';
        timeButtonsContainer.style.display = 'none';
        themeSelectionScreen.querySelector('h1').textContent = "Kies een thema & tijd:";
        showScreen(themeSelectionScreen);
    });

    // --- Initialisatie ---
    function initialize() {
        showScreen(themeSelectionScreen);
        rainbowPaths.forEach(path => {
            const length = path.getTotalLength();
            pathLengths.push(length);
            path.style.strokeDasharray = `${length} ${length}`;
            path.style.strokeDashoffset = length;
        });
    }

    initialize();
});
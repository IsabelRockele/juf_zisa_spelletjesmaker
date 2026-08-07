document.addEventListener('DOMContentLoaded', () => {
    const selectionScreen = document.getElementById('themeSelectionScreen');
    const timerScreen = document.getElementById('timerScreen');
    const timerContainer = document.getElementById('timerContainer');
    const themeButtons = [...document.querySelectorAll('.theme-buttons button')];
    const timeButtons = [...document.querySelectorAll('.time-buttons button')];
    const timePanel = document.getElementById('timeChoicePanel');
    const timeHeader = document.getElementById('timeChoiceHeader');
    const customMinutes = document.getElementById('customMinutes');
    const openTimerButton = document.getElementById('startSelectedTimer');
    const themeDisplay = document.getElementById('currentThemeDisplay');
    const countdown = document.getElementById('countdown');
    const timerMessage = document.getElementById('timerMessage');
    const timerState = document.getElementById('timerState');
    const startButton = document.getElementById('startButton');
    const pauseButton = document.getElementById('pauseButton');
    const addMinuteButton = document.getElementById('addMinuteButton');
    const restartButton = document.getElementById('restartButton');
    const soundButton = document.getElementById('soundButton');
    const fullscreenButton = document.getElementById('fullscreenButton');
    const newTimerButton = document.getElementById('newTimerButton');
    const rainbowContainer = document.getElementById('rainbowContainer');
    const starContainer = document.getElementById('starContainer');
    const aquariumContainer = document.getElementById('aquariumContainer');
    const balloonContainer = document.getElementById('balloonContainer');
    const gardenContainer = document.getElementById('gardenContainer');
    const hotAirBalloon = document.getElementById('hotAirBalloon');
    const flowerField = document.getElementById('flowerField');
    const gardenSun = document.getElementById('gardenSun');
    const spaceContainer = document.getElementById('spaceContainer');
    const spaceStarsFar = document.getElementById('spaceStarsFar');
    const spaceStarsNear = document.getElementById('spaceStarsNear');
    const spaceRocket = document.getElementById('spaceRocket');
    const spaceMoon = document.getElementById('spaceMoon');
    const arrivalGlow = document.getElementById('arrivalGlow');
    const spacePlanets = [...document.querySelectorAll('.space-planet')];
    const rainbowPaths = [...document.querySelectorAll('.rainbow-path')].reverse();
    const goldImage = document.getElementById('goldImage');
    const finalStar = document.getElementById('finalStar');
    const treasureClosed = document.getElementById('treasureChestClosed');
    const treasureOpen = document.getElementById('treasureChestOpen');
    const bigGoldCoin = document.getElementById('bigGoldCoin');
    const timeUpSound = new Audio('sounds/chime.mp3');
    const themeNames = { rainbow: 'Regenboog', star: 'Groeiende ster', aquarium: 'Aquarium', balloon: 'Luchtballon', garden: 'Bloementuin', space: 'Ruimtereis' };

    let selectedTheme = '';
    let selectedMinutes = 10;
    let initialTotalSeconds = 0;
    let totalSeconds = 0;
    let endTimestamp = 0;
    let intervalId = null;
    let running = false;
    let finished = false;
    let soundEnabled = true;
    let pathLengths = [];
    let fishElements = [];
    let growingStars = [];

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    }

    function selectTheme(theme) {
        selectedTheme = theme;
        themeButtons.forEach(button => {
            const selected = button.dataset.theme === theme;
            button.classList.toggle('selected', selected);
            button.setAttribute('aria-pressed', String(selected));
        });
        timePanel.hidden = false;
        timeHeader.textContent = `Hoelang wil je de ${themeNames[theme].toLowerCase()} gebruiken?`;
        timePanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function selectMinutes(minutes) {
        selectedMinutes = minutes;
        customMinutes.value = minutes;
        timeButtons.forEach(button => button.classList.toggle('selected', Number(button.dataset.minutes) === minutes));
    }

    function showScreen(screen) {
        [selectionScreen, timerScreen].forEach(item => item.classList.remove('active'));
        screen.classList.add('active');
    }

    function showTheme(theme) {
        document.body.className = `theme-${theme}`;
        [rainbowContainer, starContainer, aquariumContainer, balloonContainer, gardenContainer, spaceContainer].forEach(item => item.classList.remove('active'));
        ({ rainbow: rainbowContainer, star: starContainer, aquarium: aquariumContainer, balloon: balloonContainer, garden: gardenContainer, space: spaceContainer })[theme].classList.add('active');
        if (theme === 'aquarium') initializeAquarium();
        if (theme === 'garden') initializeGarden();
    }

    function initializeAquarium() {
        aquariumContainer.querySelectorAll('.fish').forEach(fish => fish.remove());
        fishElements = [];
        const slots = Array.from({ length: 60 }, (_, index) => index).sort(() => Math.random() - .5);
        for (let index = 0; index < 60; index++) {
            const fish = document.createElement('img');
            fish.src = `klok_afbeeldingen/vis${(index % 10) + 1}.png`;
            fish.alt = '';
            fish.className = 'fish';
            const slot = slots[index];
            const col = slot % 10;
            const row = Math.floor(slot / 10);
            const scale = .55 + Math.random() * .55;
            fish.style.left = `${3 + col * 9.4 + Math.random() * 2}%`;
            fish.style.top = `${4 + row * 12 + Math.random() * 3}%`;
            fish.style.transform = `scale(${scale}) scaleX(${Math.random() > .5 ? 1 : -1})`;
            fish.style.zIndex = String(Math.round(scale * 10));
            aquariumContainer.appendChild(fish);
            fishElements.push(fish);
        }
    }

    function updateRainbow() {
        const progress = initialTotalSeconds ? 1 - totalSeconds / initialTotalSeconds : 0;
        const phase = progress * rainbowPaths.length;
        rainbowPaths.forEach((path, index) => {
            path.style.strokeDashoffset = pathLengths[index] * (1 - Math.max(0, Math.min(1, phase - index)));
        });
    }

    function createStar() {
        const star = document.createElement('img');
        star.src = 'afbeeldingen klok/ster.png';
        star.alt = '';
        star.className = 'growing-star';
        starContainer.appendChild(star);
        growingStars.push(star);
        return star;
    }

    function updateStars() {
        const progress = initialTotalSeconds ? 1 - totalSeconds / initialTotalSeconds : 0;
        const star = growingStars[0] || createStar();
        star.style.transform = `translate(-50%, -50%) scale(${.32 + .68 * progress})`;
        star.style.opacity = String(.58 + .42 * progress);
        star.style.filter = `drop-shadow(0 0 ${18 + 42 * progress}px rgba(255,226,110,${.35 + .5 * progress}))`;
    }

    function initializeGarden() {
        if (flowerField.children.length) return;
        const colors = ['#ef9fb5','#9fc9ef','#c2a7df','#f2b27e','#ef8d9d','#86cdb6','#d9a6d1','#f3c66e','#8ebde7','#e9a28a'];
        const positions = [5,14,24,34,44,54,64,74,84,92];
        positions.forEach((left, index) => {
            const flower = document.createElement('div');
            flower.className = 'timer-flower';
            flower.style.left = `${left}%`;
            flower.style.height = `${165 + (index % 4) * 22}px`;
            flower.style.setProperty('--petal', colors[index]);
            flower.innerHTML = `<div class="flower-stem"></div><i class="flower-leaf leaf-${index % 2 ? 'right' : 'left'}"></i>${index % 3 === 0 ? `<i class="flower-leaf leaf-${index % 2 ? 'left' : 'right'} leaf-high"></i>` : ''}<div class="flower-head"><i class="flower-petal"></i><i class="flower-petal"></i><i class="flower-petal"></i><i class="flower-petal"></i><i class="flower-petal"></i><i class="flower-center"></i></div>`;
            flowerField.appendChild(flower);
        });
    }

    function updateBalloon() {
        const progress = initialTotalSeconds ? 1 - totalSeconds / initialTotalSeconds : 0;
        hotAirBalloon.style.bottom = `${8 + progress * 52}%`;
        hotAirBalloon.style.left = `${35 + progress * 30}%`;
        hotAirBalloon.style.transform = `translate(-50%, ${10 - progress * 10}%) scale(${.78 + progress * .18})`;
    }

    function updateGarden() {
        initializeGarden();
        const progress = initialTotalSeconds ? 1 - totalSeconds / initialTotalSeconds : 0;
        [...flowerField.children].forEach((flower, index, flowers) => {
            const local = Math.max(0, Math.min(1, progress * flowers.length - index));
            flower.style.transform = `scaleY(${.18 + .82 * local})`;
            const head = flower.querySelector('.flower-head');
            head.style.transform = `scale(${.75 + .25 * Math.max(0, (local - .4) / .6)}) rotate(${(1-local)*-8}deg)`;
        });
        gardenSun.style.opacity = String(.4 + .6 * progress);
    }

    function updateSpace() {
        const progress = initialTotalSeconds ? 1 - totalSeconds / initialTotalSeconds : 0;
        spaceStarsFar.style.transform = `translateY(${progress * 18}%)`;
        spaceStarsNear.style.transform = `translateY(${progress * 34}%)`;

        // Een lange verticale reis: de raket klimt en passeert telkens een nieuw tussenpunt.
        const route = [
            [50, 78],
            [25, 70],
            [75, 62],
            [35, 54],
            [65, 46],
            [80, 37]
        ];
        const routePosition = progress * (route.length - 1);
        const routeIndex = Math.min(route.length - 2, Math.floor(routePosition));
        const part = routePosition - routeIndex;
        const easedPart = part * part * (3 - 2 * part);
        const from = route[routeIndex];
        const to = route[routeIndex + 1];
        const left = from[0] + (to[0] - from[0]) * easedPart;
        const top = from[1] + (to[1] - from[1]) * easedPart;
        const direction = Math.atan2(to[1] - from[1], to[0] - from[0]) * 180 / Math.PI + 90;

        spaceRocket.style.left = `${left}%`;
        spaceRocket.style.top = `${top}%`;
        spaceRocket.style.transform = `translate(-50%,-50%) rotate(${direction}deg) scale(${.88 + progress * .12})`;

        const planetStops = [.08, .30, .52, .72];
        spacePlanets.forEach((planet, index) => {
            const top = 32 + (progress - planetStops[index]) * 170;
            const visible = top > -28 && top < 118;
            const distanceFromRocket = Math.abs(top - (78 - progress * 41));
            const near = Math.max(0, 1 - distanceFromRocket / 24);
            planet.style.top = `${top}%`;
            planet.style.opacity = visible ? String(.72 + near * .28) : '0';
            planet.style.transform = `translateY(-50%) scale(${.9 + near * .12})`;
        });

        const approach = Math.max(0, Math.min(1, (progress - .82) / .18));
        spaceMoon.style.top = `${-34 + approach * 40}%`;
        spaceMoon.style.opacity = String(approach);
        spaceMoon.style.transform = `scale(${.82 + approach * .18})`;
    }

    function updateAquarium() {
        const visible = totalSeconds <= 0 ? 0 : (totalSeconds % 60 || 60);
        fishElements.forEach((fish, index) => fish.style.opacity = index < visible ? '1' : '0');
    }

    function updateVisual() {
        if (selectedTheme === 'rainbow') updateRainbow();
        if (selectedTheme === 'star') updateStars();
        if (selectedTheme === 'aquarium') updateAquarium();
        if (selectedTheme === 'balloon') updateBalloon();
        if (selectedTheme === 'garden') updateGarden();
        if (selectedTheme === 'space') updateSpace();
    }

    function resetEndVisuals() {
        goldImage.classList.remove('visible');
        finalStar.classList.remove('visible', 'animate');
        bigGoldCoin.classList.remove('visible', 'animate');
        treasureClosed.style.opacity = '1';
        treasureOpen.style.opacity = '0';
        hotAirBalloon.classList.remove('finished');
        spaceRocket.classList.remove('arrived');
        arrivalGlow.classList.remove('visible');
    }

    function renderTime() {
        countdown.textContent = formatTime(totalSeconds);
        updateVisual();
    }

    function stopInterval() {
        if (intervalId !== null) clearInterval(intervalId);
        intervalId = null;
    }

    function finishTimer() {
        stopInterval();
        running = false;
        finished = true;
        totalSeconds = 0;
        renderTime();
        timerContainer.classList.remove('paused');
        timerContainer.classList.add('finished');
        timerMessage.textContent = 'Tijd is om!';
        timerState.textContent = 'Klaar';
        startButton.textContent = 'Nog een keer';
        startButton.hidden = false;
        pauseButton.hidden = true;
        if (soundEnabled) timeUpSound.play().catch(() => {});
        if (selectedTheme === 'rainbow') goldImage.classList.add('visible');
        if (selectedTheme === 'star') finalStar.classList.add('visible', 'animate');
        if (selectedTheme === 'aquarium') {
            treasureClosed.style.opacity = '0';
            treasureOpen.style.opacity = '1';
            bigGoldCoin.classList.add('visible', 'animate');
        }
        if (selectedTheme === 'balloon') hotAirBalloon.classList.add('finished');
        if (selectedTheme === 'space') {
            spaceRocket.classList.add('arrived');
            arrivalGlow.classList.add('visible');
        }
    }

    function tick() {
        const remaining = Math.max(0, Math.ceil((endTimestamp - Date.now()) / 1000));
        if (remaining !== totalSeconds) {
            totalSeconds = remaining;
            renderTime();
        }
        if (remaining <= 0) finishTimer();
    }

    function startCountdown() {
        if (finished || totalSeconds <= 0) resetCurrentTimer();
        running = true;
        finished = false;
        timerContainer.classList.remove('paused', 'finished');
        timerMessage.textContent = '';
        timerState.textContent = 'Timer loopt';
        startButton.hidden = true;
        pauseButton.hidden = false;
        endTimestamp = Date.now() + totalSeconds * 1000;
        stopInterval();
        intervalId = setInterval(tick, 250);
        tick();
    }

    function pauseCountdown() {
        if (!running) return;
        totalSeconds = Math.max(0, Math.ceil((endTimestamp - Date.now()) / 1000));
        stopInterval();
        running = false;
        renderTime();
        timerContainer.classList.add('paused');
        timerState.textContent = 'GEPAUZEERD';
        startButton.textContent = 'Hervat';
        startButton.hidden = false;
        pauseButton.hidden = true;
    }

    function resetCurrentTimer() {
        stopInterval();
        running = false;
        finished = false;
        totalSeconds = initialTotalSeconds;
        timerContainer.classList.remove('paused', 'finished');
        timerMessage.textContent = '';
        timerState.textContent = 'Klaar om te starten';
        startButton.textContent = 'Start';
        startButton.hidden = false;
        pauseButton.hidden = true;
        resetEndVisuals();
        growingStars.forEach(star => star.remove());
        growingStars = [];
        renderTime();
    }

    function addMinute() {
        initialTotalSeconds += 60;
        totalSeconds += 60;
        if (running) endTimestamp += 60000;
        renderTime();
        timerState.textContent = running ? '1 minuut toegevoegd' : '1 minuut toegevoegd — klaar om te starten';
    }

    function openSelectedTimer() {
        if (!selectedTheme) return;
        const minutes = Math.max(1, Math.min(180, Number(customMinutes.value) || selectedMinutes || 1));
        selectedMinutes = minutes;
        initialTotalSeconds = minutes * 60;
        totalSeconds = initialTotalSeconds;
        themeDisplay.textContent = `${themeNames[selectedTheme]}timer`;
        showScreen(timerScreen);
        showTheme(selectedTheme);
        resetCurrentTimer();
    }

    function returnToChoices() {
        if (running && !window.confirm('De timer loopt nog. Wil je hem stoppen en een andere timer kiezen?')) return;
        stopInterval();
        running = false;
        document.body.className = '';
        showScreen(selectionScreen);
    }

    themeButtons.forEach(button => button.addEventListener('click', () => selectTheme(button.dataset.theme)));
    timeButtons.forEach(button => button.addEventListener('click', () => selectMinutes(Number(button.dataset.minutes))));
    customMinutes.addEventListener('input', () => timeButtons.forEach(button => button.classList.remove('selected')));
    openTimerButton.addEventListener('click', openSelectedTimer);
    startButton.addEventListener('click', startCountdown);
    pauseButton.addEventListener('click', pauseCountdown);
    restartButton.addEventListener('click', resetCurrentTimer);
    addMinuteButton.addEventListener('click', addMinute);
    newTimerButton.addEventListener('click', returnToChoices);
    soundButton.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundButton.setAttribute('aria-pressed', String(soundEnabled));
        soundButton.textContent = soundEnabled ? '🔊 Geluid aan' : '🔇 Geluid uit';
    });
    fullscreenButton.addEventListener('click', async () => {
        try {
            if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
            else await document.exitFullscreen();
        } catch (_) {}
    });
    document.addEventListener('fullscreenchange', () => fullscreenButton.textContent = document.fullscreenElement ? '⛶ Sluit volledig scherm' : '⛶ Volledig scherm');
    document.addEventListener('keydown', event => {
        if (!timerScreen.classList.contains('active') || ['INPUT','BUTTON'].includes(document.activeElement.tagName)) return;
        if (event.code === 'Space') {
            event.preventDefault();
            running ? pauseCountdown() : startCountdown();
        }
    });

    rainbowPaths.forEach(path => {
        const length = path.getTotalLength();
        pathLengths.push(length);
        path.style.strokeDasharray = `${length} ${length}`;
        path.style.strokeDashoffset = length;
    });
    selectMinutes(10);
    showScreen(selectionScreen);
});

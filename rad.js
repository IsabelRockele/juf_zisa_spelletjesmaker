document.addEventListener('DOMContentLoaded', () => {
    // DOM Elementen
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const spinBtn = document.getElementById('spinBtn');
    const itemInput = document.getElementById('itemInput');
    const fileUpload = document.getElementById('fileUpload');
    const imageUpload = document.getElementById('imageUpload');
    const resultModal = document.getElementById('resultModal');
    const resultOutput = document.getElementById('resultOutput');
    const timerBarContainer = document.getElementById('timer-bar-container');
    const timerBar = document.getElementById('timer-bar');
    const closeBtn = document.querySelector('.close-btn');
    const mathPresetBtns = document.querySelectorAll('.math-btn');
    const generateTablesBtn = document.getElementById('generateTablesBtn');
    const maalCheckboxesContainer = document.getElementById('maal-checkboxes');
    const generateEfBtn = document.getElementById('generateEfBtn');
    const generateMovementBtn = document.getElementById('generateMovementBtn');
    const generateTaalBtn = document.getElementById('generateTaalBtn');

    // Knoppen voor weergave-wissel
    const showWheelBtn = document.getElementById('showWheelBtn');
    const newOptionsBtn = document.getElementById('newOptionsBtn');
    const restartBtn = document.getElementById('restartBtn');
    const downloadListBtn = document.getElementById('downloadListBtn');

    // Variabelen
    let items = ['Typ hier', 'je opties', 'of gebruik', 'de knoppen', 'om een lijst', 'te genereren'];
    let usedItems = [];
    let spinHistory = []; // Houdt de geschiedenis van gedraaide rekensommen bij
    let colors = ['#3498db', '#e74c3c', '#f1c40f', '#2ecc71', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
    let currentRotation = 0;
    let isSpinning = false;
    let activeTimer = null;

    // --- LOGICA VOOR WEERGAVE-WISSEL ---
    const showOptionsView = () => {
        document.body.classList.remove('wheel-view');
        document.body.classList.add('options-view');
    };

    const showWheelView = () => {
        if (items.length <= 1 && !(items[0] instanceof Image)) {
            alert("Voeg eerst minstens 2 opties toe aan het rad.");
            return;
        }
        document.body.classList.remove('options-view');
        document.body.classList.add('wheel-view');
    };

    showWheelBtn.addEventListener('click', showWheelView);
    
    const resetSession = () => {
        spinHistory = [];
        downloadListBtn.style.display = 'none';
    };

    newOptionsBtn.addEventListener('click', () => {
        items = ['Typ hier', 'je opties', 'of gebruik', 'de knoppen', 'om een lijst', 'te genereren'];
        itemInput.value = '';
        document.getElementById('removeAfterSpin').checked = true;
        document.querySelectorAll('input[name="tafel"]').forEach(cb => cb.checked = false);
        document.querySelector('input[name="table_type"][value="maal"]').checked = true;
        document.querySelector('input[name="brug_option"][value="zonder"]').checked = true;
        document.querySelector('input[name="brug_option"][value="met"]').checked = true;
        document.querySelectorAll('input[name="ef_category"]').forEach(cb => cb.checked = false);
        document.getElementById('imageModeCheckbox').checked = false;
        document.querySelectorAll('input[name="taal_category"]').forEach(cb => cb.checked = true);
        
        resetWheel();
        resetSession(); // Reset ook de downloadlijst
        showOptionsView();
    });

    restartBtn.addEventListener('click', () => {
        resetWheel();
        resetSession(); // Reset ook de downloadlijst
        alert("Het rad is gereset. Je kunt opnieuw met alle opties spelen.");
    });
    
    const efTasks = {
        werkgeheugen: [
            { text: "Herhaal achterstevoren", gameType: "timed_hide", duration: 7, category: "Werkgeheugen", supportsImageMode: true }, 
            { text: "Onthoud deze woorden", gameType: "timed_hide", duration: 10, category: "Werkgeheugen", supportsImageMode: true },
            { text: "Geheugenspel: Wat is er weg?", gameType: "whats_missing", duration: 10, category: "Werkgeheugen", supportsImageMode: true },
            { text: "Geheugenspel: Spelleider doet 3 acties voor. De speler moet de volgorde exact nadoen.", category: "Werkgeheugen", requiresLeader: true }, 
            { text: "Tel hardop van 20 terug naar 1", category: "Werkgeheugen" }
        ],
        inhibitie: [
            { text: "Spelregel: Klap enkel als je een dier hoort. Spelleider zegt willekeurige woorden.", category: "Inhibitie (Stop & Denk)", requiresLeader: true },
            { text: "Zeg de KLEUR, niet het woord:", gameType: "stroop_game", category: "Inhibitie (Stop & Denk)" },
            { text: "Muziekspel: De spelleider start en stopt muziek. Spelers dansen als de muziek speelt en bevriezen als hij stopt.", category: "Inhibitie (Stop & Denk)", requiresLeader: true },
            { text: "Blijf 10 seconden zo stil als een standbeeld.", gameType: "timer_only", duration: 10, category: "Inhibitie (Stop & Denk)" },
        ],
        flexibiliteit: [
            { text: "Noem 3 dingen die je kan doen met een lepel (behalve eten).", category: "Flexibiliteit", requiresLeader: true },
            { text: "Verzin een ander einde voor het sprookje van Roodkapje.", category: "Flexibiliteit", requiresLeader: true },
            { type: "dynamic", template: "Noem 5 dingen die {kleur} zijn.", category: "Flexibiliteit", requiresLeader: true }
        ],
        planning: [
            { text: "Wat zijn de stappen om een boterham met choco te maken?", category: "Planning", requiresLeader: true },
            { text: "Je gaat zwemmen. Wat moet er allemaal in je zwemtas?", category: "Planning", requiresLeader: true },
            { text: "Hoe zou je je kamer opruimen? Waar begin je en wat is de volgende stap?", category: "Planning", requiresLeader: true }
        ]
    };

    const movementTasks = [
        { text: "Doe 20 seconden jumping jacks.", gameType: "timer_only", duration: 20, category: "Beweging" },
        { text: "Loop 30 seconden ter plaatse.", gameType: "timer_only", duration: 30, category: "Beweging" },
        { text: "Doe 10 keer knieheffen (elke kant).", category: "Beweging" },
        { text: "Raak 10 keer je tenen aan.", category: "Beweging" },
        { text: "Balanceer 15 seconden op je rechterbeen.", gameType: "timer_only", duration: 15, category: "Beweging" },
        { text: "Balanceer 15 seconden op je linkerbeen.", gameType: "timer_only", duration: 15, category: "Beweging" },
        { text: "Doe 20 seconden de 'plank' houding.", gameType: "timer_only", duration: 20, category: "Beweging" },
        { text: "Doe 10 ster-sprongen (star jumps).", category: "Beweging" },
        { text: "Beeld uit dat je 20 seconden een ladder beklimt.", gameType: "timer_only", duration: 20, category: "Beweging" },
        { text: "Maak jezelf zo groot als een reus en dan zo klein als een muis. Herhaal 5 keer.", category: "Beweging" },
        { text: "Doe 10 'windmolens' (raak met je rechterhand je linkervoet aan en wissel af).", category: "Beweging" },
        { text: "Draai 15 seconden rondjes met je armen naar voren.", gameType: "timer_only", duration: 15, category: "Beweging" },
        { text: "Doe 10 squats (door je knieën buigen alsof je op een stoel gaat zitten).", category: "Beweging" },
        { text: "Boks 20 seconden in de lucht (links, rechts, links, rechts...).", gameType: "timer_only", duration: 20, category: "Beweging" },
        { text: "Loop 5 stappen als een ooievaar (trek je knieën zo hoog mogelijk op).", category: "Beweging" }
    ];

    const taalTasks = {
        rijmen: [
            { type: 'rijmen', word: 'huis' }, { type: 'rijmen', word: 'kat' },
            { type: 'rijmen', word: 'maan' }, { type: 'rijmen', word: 'school' },
            { type: 'rijmen', word: 'boek' }, { type: 'rijmen', word: 'stoel' },
        ],
        zinmaken: [
            { type: 'zinmaken', word: 'fiets' }, { type: 'zinmaken', word: 'lachen' },
            { type: 'zinmaken', word: 'vrienden' }, { type: 'zinmaken', word: 'zon' },
            { type: 'zinmaken', word: 'eten' }, { type: 'zinmaken', word: 'slapen' },
        ],
        noem3: [
            { type: 'noem3', category: 'soorten fruit' }, { type: 'noem3', category: 'kleuren' },
            { type: 'noem3', category: 'dieren op de boerderij' }, { type: 'noem3', category: 'dingen in een klaslokaal' },
            { type: 'noem3', category: 'sporten' }, { type: 'noem3', category: 'vervoersmiddelen' },
        ],
        grammatica: [
            { type: 'meervoud', word: 'boek', answer: 'boeken' }, { type: 'meervoud', word: 'kind', answer: 'kinderen' },
            { type: 'meervoud', word: 'stad', answer: 'steden' }, { type: 'meervoud', word: 'ei', answer: 'eieren' },
            { type: 'verkleinwoord', word: 'boom', answer: 'boompje' }, { type: 'verkleinwoord', word: 'bloem', answer: 'bloemetje' },
            { type: 'verkleinwoord', word: 'ring', answer: 'ringetje' }, { type: 'verkleinwoord', word: 'koning', answer: 'koninkje' },
        ],
        tegengestelden: [
            { type: 'tegengestelden', word: 'warm', answer: 'koud' }, { type: 'tegengestelden', word: 'groot', answer: 'klein' },
            { type: 'tegengestelden', word: 'snel', answer: 'traag' }, { type: 'tegengestelden', word: 'hoog', answer: 'laag' },
            { type: 'tegengestelden', word: 'dag', answer: 'nacht' }, { type: 'tegengestelden', word: 'blij', answer: 'boos' },
        ]
    };

    const dynamicData = {
        colorMap: { "ROOD": "#e74c3c", "GROEN": "#2ecc71", "BLAUW": "#3498db", "GEEL": "#f1c40f", "PAARS": "#9b59b6" },
        woorden: ["appel", "stoel", "auto", "fiets", "wolk", "banaan", "olifant", "paraplu", "boek", "schoen"],
        emojiMap: {
            "appel": "🍎", "stoel": "🪑", "auto": "🚗", "fiets": "🚲", 
            "wolk": "☁️", "banaan": "🍌", "olifant": "🐘", "paraplu": "☂️", 
            "boek": "📖", "schoen": "👟"
        },
        getColorNames: () => Object.keys(dynamicData.colorMap),
        generateReeks: (count) => {
            const reeks = [];
            for (let i = 0; i < count; i++) {
                reeks.push(Math.floor(Math.random() * 6) + 1);
            }
            return reeks;
        },
        generateWordSequence: (count) => {
            const shuffled = shuffleArray([...dynamicData.woorden]);
            return shuffled.slice(0, count);
        },
        generateMissingGameSequence: (count) => {
            const fullSequence = shuffleArray([...dynamicData.woorden]).slice(0, count);
            const missingIndex = Math.floor(Math.random() * count);
            const missingItem = fullSequence[missingIndex];
            const partialSequence = [...fullSequence];
            partialSequence[missingIndex] = '___';
            return { fullSequence, partialSequence, missingItem };
        }
    };
    
    // --- HULPFUNCTIES ---
    const calculateAnswer = (exercise) => {
        if (typeof exercise !== 'string') return null;
        try {
            const sanitizedExercise = exercise.replace('×', '*').replace('÷', '/');
            return new Function('return ' + sanitizedExercise)();
        } catch (error) {
            console.error("Kon de som niet berekenen:", exercise, error);
            return null;
        }
    };

    const createDiceSvg = (number) => {
        const dotPositions = {
            1: [[50, 50]], 2: [[25, 25], [75, 75]], 3: [[25, 25], [50, 50], [75, 75]],
            4: [[25, 25], [25, 75], [75, 25], [75, 75]], 5: [[25, 25], [25, 75], [50, 50], [75, 25], [75, 75]],
            6: [[25, 25], [25, 50], [25, 75], [75, 25], [75, 50], [75, 75]]
        };
        let dots = '';
        if (dotPositions[number]) {
            dotPositions[number].forEach(pos => {
                dots += `<circle cx="${pos[0]}" cy="${pos[1]}" r="8" fill="black" />`;
            });
        }
        return `<svg width="80" height="80" viewBox="0 0 100 100" style="margin: 0 5px;">
                    <rect width="100" height="100" rx="15" ry="15" fill="white" stroke="black" stroke-width="4" />
                    ${dots}
                </svg>`;
    };

    const createCheckboxes = () => {
        for (let i = 1; i <= 10; i++) {
            maalCheckboxesContainer.innerHTML += `<label><input type="checkbox" name="tafel" value="${i}">${i}</label>`;
        }
    };
    
    const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
        const words = text.split(' ');
        let line = '', lineCount = 0;
        for(let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            if (context.measureText(testLine).width > maxWidth && n > 0) { lineCount++; line = words[n] + ' '; } else { line = testLine; }
        }
        lineCount++;
        let startY = y - (lineHeight * (lineCount - 1)) / 2;
        line = '';
        for(let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            if (context.measureText(testLine).width > maxWidth && n > 0) {
                context.fillText(line, x, startY);
                line = words[n] + ' ';
                startY += lineHeight;
            } else { line = testLine; }
        }
        context.fillText(line, x, startY);
    };

    const drawWheel = () => {
        const numItems = items.length;
        if (numItems === 0) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
        const anglePerItem = (2 * Math.PI) / numItems, centerX = canvas.width / 2, centerY = canvas.height / 2, radius = canvas.width / 2 - 10;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        items.forEach((item, i) => {
            const startAngle = i * anglePerItem;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + anglePerItem);
            ctx.closePath();
            ctx.fillStyle = usedItems.includes(i) ? '#bbbbbb' : colors[i % colors.length];
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + anglePerItem / 2);
            const itemText = (typeof item === 'object' && item.label) ? item.label : item;
            if (item instanceof Image) {
                const img = item, maxW = radius * 0.8, maxH = radius * 0.4, imgRatio = img.width / img.height;
                let w = maxW, h = maxH;
                if (imgRatio > (maxW/maxH)) { h = w / imgRatio; } else { w = h * imgRatio; }
                ctx.drawImage(img, radius * 0.5, -w / 2, h, w);
            } else {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 16px Poppins, sans-serif';
                ctx.textAlign = 'right';
                const maxWidth = radius * 0.75, lineHeight = 18, x = radius - 15, y = 5;
                wrapText(ctx, String(itemText), x, y, maxWidth, lineHeight);
            }
            ctx.restore();
        });
    };

    const resetWheel = () => {
        usedItems = [];
        drawWheel();
    };

    const shuffleArray = (array) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };
    
    const loadNewItems = (newItems) => {
        items = newItems;
        itemInput.value = (typeof newItems[0] === 'string') ? newItems.join('\n') : '';
        resetWheel();
    };

    // --- GENERATOR FUNCTIES ---
    const processDynamicTask = (task) => {
        if (task.type !== 'dynamic') return task;
        let text = task.template;
        if (text.includes("{kleur}")) {
            const randomColor = dynamicData.getColorNames()[Math.floor(Math.random() * dynamicData.getColorNames().length)];
            text = text.replace('{kleur}', randomColor.toLowerCase());
        }
        return { ...task, text: text };
    };
    
    const generateEfTasks = () => {
        const selectedCategories = Array.from(document.querySelectorAll('input[name="ef_category"]:checked')).map(cb => cb.value);
        if (selectedCategories.length === 0) { alert("Kies minstens één categorie."); return; }
        let allSelectedTasks = [];
        selectedCategories.forEach(category => { allSelectedTasks = allSelectedTasks.concat(efTasks[category]); });
        
        const shuffledTasks = shuffleArray(allSelectedTasks).slice(0, 20);
        const finalWheelItems = shuffledTasks.map((task, index) => ({
            label: `Opdracht ${index + 1}`,
            fullTask: task
        }));
        loadNewItems(finalWheelItems);
    };

    const generateMovementTasks = () => {
        const shuffledTasks = shuffleArray(movementTasks).slice(0, 20);
        const finalWheelItems = shuffledTasks.map((task, index) => ({
            label: `Opdracht ${index + 1}`,
            fullTask: task 
        }));
        loadNewItems(finalWheelItems);
    };

    const generateTaalTasks = () => {
        const selectedCategories = Array.from(document.querySelectorAll('input[name="taal_category"]:checked')).map(cb => cb.value);
        if (selectedCategories.length === 0) { alert("Kies minstens één taalcategorie."); return; }
        
        let allSelectedTasks = [];
        selectedCategories.forEach(category => {
            if (taalTasks[category]) {
                allSelectedTasks = allSelectedTasks.concat(taalTasks[category]);
            }
        });

        const shuffledTasks = shuffleArray(allSelectedTasks).slice(0, 20);
        const finalWheelItems = shuffledTasks.map((task, index) => ({
            label: `Opdracht ${index + 1}`,
            fullTask: task 
        }));
        loadNewItems(finalWheelItems);
    };

    const generateSelectedTables = () => {
        const tableType = document.querySelector('input[name="table_type"]:checked').value;
        const selectedTables = Array.from(document.querySelectorAll('input[name="tafel"]:checked')).map(cb => parseInt(cb.value));
        if (selectedTables.length === 0) {
            alert("Selecteer minstens één tafel!");
            return;
        }
        let problems = [];
        if (tableType === 'maal' || tableType === 'beide') {
            selectedTables.forEach(table => {
                for (let i = 1; i <= 10; i++) {
                    problems.push(`${i} × ${table}`);
                }
            });
        }
        if (tableType === 'deel' || tableType === 'beide') {
            selectedTables.forEach(table => {
                for (let i = 1; i <= 10; i++) {
                    problems.push(`${i * table} ÷ ${table}`);
                }
            });
        }
        loadNewItems(shuffleArray(problems).slice(0, 25));
    };

    const generateSums = (limit, allowWithBridge, allowWithoutBridge) => {
        let sums = new Set();
        const maxAttempts = 200;
        let attempts = 0;

        while (sums.size < 25 && attempts < maxAttempts) {
            attempts++;
            const a = Math.floor(Math.random() * limit) + 1;
            const b = Math.floor(Math.random() * limit) + 1;
            const operation = Math.random() > 0.5 ? '+' : '-';

            if (operation === '+') {
                if (a + b > limit) continue;
                const withBridge = (a % 10) + (b % 10) >= 10;
                if ((withBridge && allowWithBridge) || (!withBridge && allowWithoutBridge)) {
                    sums.add(`${a} + ${b}`);
                }
            } else { // Subtraction
                if (a - b < 0) continue;
                const withBridge = (a % 10) < (b % 10);
                if ((withBridge && allowWithBridge) || (!withBridge && allowWithoutBridge)) {
                    sums.add(`${a} - ${b}`);
                }
            }
        }
        if(sums.size === 0) {
            alert("Kon geen sommen genereren met de gekozen opties. Probeer een andere combinatie (bv. met én zonder brug).");
            return;
        }
        loadNewItems(shuffleArray(Array.from(sums)));
    };


    // --- RAD LOGICA ---
    const spin = () => {
        if (isSpinning) return;
        let winningIndex;
        const removeItems = document.getElementById('removeAfterSpin').checked;
        if (removeItems) {
            const availableIndexes = items.map((_, i) => i).filter(i => !usedItems.includes(i));
            if (availableIndexes.length === 0) { alert("Alle opties zijn gebruikt! Klik op 'Nog eens met dit rad' om opnieuw te beginnen."); return; }
            const winnerFromArray = Math.floor(Math.random() * availableIndexes.length);
            winningIndex = availableIndexes[winnerFromArray];
        } else {
            if (items.length === 0) return;
            winningIndex = Math.floor(Math.random() * items.length);
        }
        isSpinning = true;
        spinBtn.disabled = true;
        const anglePerItem = 360 / items.length;
        const targetAngle = (winningIndex * anglePerItem) + (anglePerItem / 2);
        const requiredRotation = 360 - targetAngle + 270;
        const totalRotation = currentRotation - (currentRotation % 360) + (360 * 10) + requiredRotation;
        currentRotation = totalRotation;
        canvas.style.transition = 'transform 8s cubic-bezier(0.2, 0.8, 0.2, 1)';
        canvas.style.transform = `rotate(${currentRotation}deg)`;
        setTimeout(() => {
            if (removeItems) {
                usedItems.push(winningIndex);
                drawWheel();
            }

            const exercise = items[winningIndex];
            const answer = calculateAnswer(exercise);
            if (answer !== null) { 
                spinHistory.push({ exercise, answer });
                downloadListBtn.style.display = 'inline-block';
            }

            showResult(items[winningIndex]);
            isSpinning = false;
            spinBtn.disabled = false;
        }, 8000);
    };
    
    const runTimer = (duration, onEnd) => {
        timerBar.style.transition = 'none';
        timerBar.style.width = '100%';
        timerBarContainer.style.display = 'block';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                timerBar.style.transition = `width ${duration}s linear`;
                timerBar.style.width = '0%';
            });
        });
        activeTimer = setTimeout(() => {
            onEnd();
            timerBarContainer.style.display = 'none';
        }, duration * 1000);
    };

    const showResult = (result) => {
        if (activeTimer) clearTimeout(activeTimer);
        timerBarContainer.style.display = 'none';
        resultOutput.innerHTML = '';
        const taskForModal = (typeof result === 'object' && result.fullTask) ? result.fullTask : result;
        const processedTask = processDynamicTask(taskForModal);
        
        let resultText;
        if (typeof processedTask === 'string') {
            resultText = processedTask;
        } else if (processedTask.type === 'rijmen') {
            resultText = `Verzin een woord dat rijmt op: <strong>${processedTask.word}</strong>`;
        } else if (processedTask.type === 'zinmaken') {
            resultText = `Maak een mooie zin met het woord: <strong>${processedTask.word}</strong>`;
        } else if (processedTask.type === 'noem3') {
            resultText = `Noem 3 soorten <strong>${processedTask.category}</strong>`;
        } else if (processedTask.type === 'meervoud' || processedTask.type === 'verkleinwoord') {
            const question = processedTask.type === 'meervoud' ? 'Wat is het meervoud van' : 'Wat is het verkleinwoord van';
            resultText = `${question}: <strong>${processedTask.word}</strong>?`;
        } else if (processedTask.type === 'tegengestelden') {
            resultText = `Wat is het tegengestelde van: <strong>${processedTask.word}</strong>?`;
        } else {
             resultText = processedTask.text || String(taskForModal);
        }

        const DURATION = processedTask.duration || 10;
        const gameType = processedTask.gameType;
        const isImageMode = document.getElementById('imageModeCheckbox').checked;
        
        switch (gameType) {
            case 'whats_missing':
                const difficultyLevelsMissing = [5, 6, 7, 8, 9, 10];
                let selectedCountMissing = 0;
                resultOutput.innerHTML = `<p>${resultText}</p><h4>Kies een moeilijkheidsgraad:</h4>`;
                const difficultyContainerMissing = document.createElement('div');
                difficultyContainerMissing.style.display = 'flex'; difficultyContainerMissing.style.gap = '10px';
                difficultyContainerMissing.style.flexWrap = 'wrap'; difficultyContainerMissing.style.justifyContent = 'center';
                const startGameBtnMissing = document.createElement('button');
                startGameBtnMissing.textContent = 'Start Spel'; startGameBtnMissing.className = 'generate-btn';
                startGameBtnMissing.disabled = true; startGameBtnMissing.style.marginTop = '20px';
                difficultyLevelsMissing.forEach(level => {
                    const btn = document.createElement('button');
                    btn.textContent = level; btn.className = 'preset-btn'; btn.style.width = '60px';
                    btn.onclick = () => {
                        selectedCountMissing = level;
                        startGameBtnMissing.disabled = false;
                        difficultyContainerMissing.querySelectorAll('button').forEach(b => b.style.border = '2px solid transparent');
                        btn.style.border = '2px solid var(--action-color)';
                    };
                    difficultyContainerMissing.appendChild(btn);
                });
                resultOutput.appendChild(difficultyContainerMissing);
                resultOutput.appendChild(startGameBtnMissing);
                startGameBtnMissing.onclick = () => {
                    if (selectedCountMissing === 0) return;
                    const gameData = dynamicData.generateMissingGameSequence(selectedCountMissing);
                    const displaySequence = (sequence) => {
                        const container = document.createElement('div');
                        container.style.display = 'flex'; container.style.justifyContent = 'center';
                        container.style.alignItems = 'center'; container.style.gap = '10px'; container.style.minHeight = '80px';
                        if (isImageMode) {
                            container.innerHTML = sequence.map(item => {
                                if (item === '___') return '<span style="font-size: 4rem;">___</span>';
                                const emoji = dynamicData.emojiMap[item];
                                return emoji ? `<span style="font-size: 5rem;">${emoji}</span>` : '';
                            }).join('');
                        } else { container.innerHTML = `<p style="font-size: 2rem;">${sequence.join(' &nbsp; ')}</p>`; }
                        resultOutput.innerHTML = '';
                        resultOutput.appendChild(container);
                    };
                    displaySequence(gameData.fullSequence);
                    runTimer(DURATION, () => {
                        resultOutput.innerHTML = `<p>Welk item is verdwenen?</p>`;
                        displaySequence(gameData.partialSequence);
                        const showAnswerBtn = document.createElement('button');
                        showAnswerBtn.id = 'show-answer-btn'; showAnswerBtn.className = 'preset-btn';
                        showAnswerBtn.textContent = 'Toon Antwoord'; resultOutput.appendChild(showAnswerBtn);
                        showAnswerBtn.onclick = () => {
                            const finalSequenceHtml = gameData.fullSequence.map(item => {
                                const isMissing = item === gameData.missingItem;
                                if (isImageMode) {
                                    const emoji = dynamicData.emojiMap[item];
                                    return isMissing ? `<span style="font-size: 5rem; padding: 5px; border-radius: 10px; background-color: #2ecc7130;">${emoji}</span>` : `<span style="font-size: 5rem;">${emoji}</span>`;
                                } else { return isMissing ? `<span style="color: #2ecc71; font-weight: bold;">${item}</span>` : item; }
                            }).join(isImageMode ? '' : ' &nbsp; ');
                            const answerContainer = resultOutput.querySelector('div');
                            if (answerContainer) { answerContainer.innerHTML = finalSequenceHtml; }
                            showAnswerBtn.disabled = true;
                        };
                    });
                };
                break;

            case 'timed_hide':
                const instructionText = resultText + ":";
                const difficultyLevels = [3, 5, 6, 7, 8, 9, 10];
                let selectedCount = 0;
                let contentItems = [];
                resultOutput.innerHTML = `<p>${instructionText}</p><h4>Kies een moeilijkheidsgraad:</h4>`;
                const difficultyContainer = document.createElement('div');
                difficultyContainer.style.display = 'flex'; difficultyContainer.style.gap = '10px';
                difficultyContainer.style.flexWrap = 'wrap'; difficultyContainer.style.justifyContent = 'center';
                const startGameBtn = document.createElement('button');
                startGameBtn.textContent = 'Start Spel'; startGameBtn.className = 'generate-btn';
                startGameBtn.disabled = true; startGameBtn.style.marginTop = '20px';
                difficultyLevels.forEach(level => {
                    const btn = document.createElement('button');
                    btn.textContent = level; btn.className = 'preset-btn'; btn.style.width = '60px';
                    btn.onclick = () => {
                        selectedCount = level;
                        startGameBtn.disabled = false;
                        difficultyContainer.querySelectorAll('button').forEach(b => b.style.border = '2px solid transparent');
                        btn.style.border = '2px solid var(--action-color)';
                    };
                    difficultyContainer.appendChild(btn);
                });
                resultOutput.appendChild(difficultyContainer);
                resultOutput.appendChild(startGameBtn);
                startGameBtn.onclick = () => {
                    if (selectedCount === 0) return;
                    const isBackwardsTask = instructionText.includes("achterstevoren");
                    contentItems = isBackwardsTask ? dynamicData.generateReeks(selectedCount) : dynamicData.generateWordSequence(selectedCount);
                    const displayContent = (isAnswerScreen = false) => {
                        const createDisplayContainer = (sequence) => {
                            const container = document.createElement('div');
                            container.style.display = 'flex'; container.style.gap = '10px'; container.style.flexWrap = 'wrap';
                            container.style.justifyContent = 'center'; container.style.alignItems = 'center'; container.style.marginTop = '15px';
                            if (isImageMode && processedTask.supportsImageMode) {
                                sequence.forEach(item => {
                                    if (isBackwardsTask) {
                                        container.innerHTML += createDiceSvg(item);
                                    } else {
                                        const emoji = dynamicData.emojiMap[item];
                                        if (emoji) {
                                            const emojiSpan = document.createElement('span'); emojiSpan.textContent = emoji;
                                            emojiSpan.style.fontSize = '5rem'; container.appendChild(emojiSpan);
                                        }
                                    }
                                });
                            } else {
                                const contentElement = document.createElement('p');
                                contentElement.textContent = sequence.join(isBackwardsTask ? ' - ' : ', ');
                                contentElement.style.color = '#2c3e50'; contentElement.style.fontSize = '3.5rem';
                                container.appendChild(contentElement);
                            }
                            return container;
                        };
                        resultOutput.innerHTML = '';
                        const currentInstruction = (isAnswerScreen && isBackwardsTask) ? "Oorspronkelijke reeks:" : instructionText;
                        resultOutput.appendChild(document.createElement('p')).textContent = currentInstruction;
                        resultOutput.appendChild(createDisplayContainer(contentItems));
                        if (isAnswerScreen && isBackwardsTask) {
                            const answerLabel = document.createElement('p');
                            answerLabel.textContent = "Juiste antwoord (om te zeggen):";
                            answerLabel.style.fontSize = '1.2rem'; answerLabel.style.marginTop = '20px'; answerLabel.style.fontWeight = 'bold';
                            resultOutput.appendChild(answerLabel);
                            resultOutput.appendChild(createDisplayContainer([...contentItems].reverse()));
                        }
                    };
                    displayContent();
                    runTimer(DURATION, () => {
                        resultOutput.innerHTML = `<p style="font-style: italic;">Herhaal!</p><button id="show-answer-btn" class="preset-btn">Toon Antwoord</button>`;
                        document.getElementById('show-answer-btn').onclick = () => {
                            displayContent(true);
                        };
                    });
                };
                break;

            case 'timer_only':
                resultOutput.innerHTML = `<p>${resultText}</p><button id="start-timer-btn" class="generate-btn">▶️ Start</button>`;
                document.getElementById('start-timer-btn').onclick = () => {
                    resultOutput.innerHTML = `<p>${resultText}</p>`;
                    runTimer(DURATION, () => {
                        resultOutput.innerHTML = `<p style="font-style: italic;">Klaar!</p>`;
                    });
                };
                break;
            
            case 'stroop_game':
                resultOutput.innerHTML = `<p>${resultText}</p>`;
                const gameContainer = document.createElement('div');
                gameContainer.style.display='flex'; gameContainer.style.flexWrap='wrap'; gameContainer.style.justifyContent='center'; gameContainer.style.gap='15px'; gameContainer.style.marginTop='20px';
                const colorNames = dynamicData.getColorNames();
                for (let i = 0; i < 10; i++) {
                    const colorWord = colorNames[Math.floor(Math.random() * colorNames.length)];
                    let colorValueKey;
                    do { colorValueKey = colorNames[Math.floor(Math.random() * colorNames.length)]; } while (colorValueKey === colorWord);
                    const colorHex = dynamicData.colorMap[colorValueKey];
                    const wordSpan = document.createElement('span');
                    wordSpan.textContent=colorWord; wordSpan.style.color=colorHex; wordSpan.style.padding='5px 10px'; wordSpan.style.fontSize='2.5rem'; wordSpan.style.fontWeight='bold';
                    gameContainer.appendChild(wordSpan);
                }
                resultOutput.appendChild(gameContainer);
                break;

            default:
                if (taskForModal instanceof Image) {
                    resultOutput.appendChild(taskForModal.cloneNode());
                } else {
                    resultOutput.innerHTML = `<p>${resultText}</p>`;
                }

                if (processedTask.type === 'meervoud' || processedTask.type === 'verkleinwoord' || processedTask.type === 'tegengestelden') {
                    const showAnswerBtn = document.createElement('button');
                    showAnswerBtn.className = 'preset-btn';
                    showAnswerBtn.textContent = 'Toon Antwoord';
                    showAnswerBtn.style.marginTop = '15px';
                    resultOutput.appendChild(showAnswerBtn);
                    showAnswerBtn.onclick = () => {
                        resultOutput.innerHTML = `<p>${resultText}</p><p style="color: var(--action-color); font-weight: bold; margin-top: 10px;">${processedTask.answer}</p>`;
                        showAnswerBtn.disabled = true;
                    };
                }

                if (processedTask.requiresLeader) {
                    const tipElement = document.createElement('p');
                    tipElement.className = 'manual-tip';
                    tipElement.textContent = 'Tip: zie de handleiding (PDF) voor voorbeelden en variaties.';
                    resultOutput.appendChild(tipElement);
                }
                break;
        }
        
        resultModal.style.display = 'flex';
    };

    const closeModal = () => { if (activeTimer) clearTimeout(activeTimer); resultModal.style.display = 'none'; };
    
    // --- EVENT LISTENERS ---
    downloadListBtn.addEventListener('click', () => {
        if (spinHistory.length === 0) {
            alert("Er zijn nog geen oefeningen gedraaid om te downloaden.");
            return;
        }

        let fileContent = "Overzicht van de oefeningen:\n\n";
        spinHistory.forEach((item, index) => {
            fileContent += `Oefening ${index + 1}: ${item.exercise} = ${item.answer}\n`;
        });

        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'oefeningen_antwoorden.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });

    const handleImageUpload = (event) => { const f=event.target.files;if(f.length===0)return;const p=Array.from(f).map(f=>new Promise((r,j)=>{const d=new FileReader;d.onload=e=>{const i=new Image;i.onload=()=>r(i),i.onerror=j,i.src=e.target.result},d.onerror=j,d.readAsDataURL(f)}));Promise.all(p).then(loadNewItems).catch(e=>console.error("Fout bij laden afbeeldingen:",e)) };
    const updateItemsFromTextarea = () => { const n=itemInput.value.split('\n').filter(i=>i.trim()!=="");loadNewItems(n.length>0?n:[]) };
    const handleFileUpload = (event) => { const f=event.target.files[0];if(!f)return;const r=new FileReader;r.onload=e=>{itemInput.value=e.target.result,updateItemsFromTextarea()},r.readAsText(f) };
    
    itemInput.addEventListener('input', updateItemsFromTextarea);
    fileUpload.addEventListener('change', handleFileUpload);
    imageUpload.addEventListener('change', handleImageUpload);
    spinBtn.addEventListener('click', spin);
    generateTablesBtn.addEventListener('click', generateSelectedTables);
    generateEfBtn.addEventListener('click', generateEfTasks);
    generateMovementBtn.addEventListener('click', generateMovementTasks);
    generateTaalBtn.addEventListener('click', generateTaalTasks);
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target == resultModal) closeModal(); });

    mathPresetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const options = Array.from(document.querySelectorAll('input[name="brug_option"]:checked')).map(cb => cb.value);
            const allowWithBridge = options.includes('met');
            const allowWithoutBridge = options.includes('zonder');

            if (!allowWithBridge && !allowWithoutBridge) {
                alert("Kies minstens één optie (met of zonder brug).");
                return;
            }

            let limit = 0;
            if (type === 'plusmin10') limit = 10;
            else if (type === 'plusmin20') limit = 20;
            else if (type === 'plusmin100') limit = 100;
            else if (type === 'plusmin1000') limit = 1000;

            generateSums(limit, allowWithBridge, allowWithoutBridge);
        });
    });

    // Initialisatie
    createCheckboxes();
    drawWheel();
    showOptionsView();
});
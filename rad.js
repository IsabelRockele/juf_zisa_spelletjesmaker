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
    const closeBtn = document.querySelector('.close-btn');
    const presetBtns = document.querySelectorAll('.preset-btn');
    const generateTablesBtn = document.getElementById('generateTablesBtn');
    const maalCheckboxesContainer = document.getElementById('maal-checkboxes');
    const resetBtn = document.getElementById('resetBtn');
    const removeAfterSpinCheckbox = document.getElementById('removeAfterSpin');
    
    // Variabelen
    let items = ['Kies', 'een', 'optie', 'of', 'upload', 'afbeeldingen!'];
    let usedItems = [];
    let colors = ['#3498db', '#e74c3c', '#f1c40f', '#2ecc71', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
    let currentRotation = 0;
    let isSpinning = false;
    
    const createCheckboxes = () => {
        for (let i = 1; i <= 10; i++) {
            maalCheckboxesContainer.innerHTML += `<label><input type="checkbox" name="tafel" value="${i}">${i}</label>`;
        }
    };

    const drawWheel = () => {
        const numItems = items.length;
        if (numItems === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        
        const anglePerItem = (2 * Math.PI) / numItems;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = canvas.width / 2 - 10;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        items.forEach((item, i) => {
            const startAngle = i * anglePerItem;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + anglePerItem);
            ctx.closePath();
            
            // --- VERNIEUWDE LOGICA HIER ---
            // Bepaal de kleur: lichtgrijs als gebruikt, anders de normale kleur.
            if (usedItems.includes(i)) {
                ctx.fillStyle = '#bbbbbb'; // Een duidelijke, lichtgrijze kleur
            } else {
                ctx.fillStyle = colors[i % colors.length];
            }
            ctx.fill();

            // De rand blijft altijd wit
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Teken de tekst of afbeelding
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + anglePerItem / 2);
            
            if (item instanceof Image) {
                const img = item;
                const maxW = radius * 0.8;
                const maxH = radius * 0.4;
                const imgRatio = img.width / img.height;
                const maxRatio = maxW / maxH;
                let w = maxW, h = maxH;
                if (imgRatio > maxRatio) { h = w / imgRatio; } else { w = h * imgRatio; }
                ctx.drawImage(img, radius * 0.5, -w / 2, h, w);
            } else {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 16px Poppins, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(item, radius - 15, 10);
            }
            ctx.restore();
        });
    };

    const resetWheel = () => {
        usedItems = [];
        drawWheel();
    };

    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };
    
    const loadNewItems = (newItems) => {
        items = newItems;
        itemInput.value = (typeof items[0] === 'string') ? items.join('\n') : `${items.length} afbeeldingen geladen.`;
        resetWheel();
    };

    const generateSelectedTables = () => {
        let problems = [];
        const tableType = document.querySelector('input[name="table_type"]:checked').value;
        const selectedTables = Array.from(document.querySelectorAll('input[name="tafel"]:checked')).map(cb => parseInt(cb.value));
        if (selectedTables.length === 0) { alert("Selecteer minstens één tafel!"); return; }

        if (tableType === 'maal' || tableType === 'beide') {
            selectedTables.forEach(table => {
                for (let i = 1; i <= 10; i++) problems.push(`${i} × ${table}`);
            });
        }
        if (tableType === 'deel' || tableType === 'beide') {
            selectedTables.forEach(table => {
                for (let i = 1; i <= 10; i++) problems.push(`${i * table} ÷ ${table}`);
            });
        }
        loadNewItems(shuffleArray(problems).slice(0, 25));
    };
    
    const generateMathProblems = (type) => {
        const problems = new Set();
        const brugOptions = Array.from(document.querySelectorAll('input[name="brug_option"]:checked')).map(cb => cb.value);
        const maxNum = parseInt(type.replace('plusmin', ''));

        if (brugOptions.length === 0) { alert("Selecteer 'Met brug' en/of 'Zonder brug'."); return; }
        
        let attempts = 0;
        while (problems.size < 25 && attempts < 1000) {
            const op = Math.random() < 0.5 ? '+' : '-';
            let n1 = Math.floor(Math.random() * (maxNum + 1));
            let n2 = Math.floor(Math.random() * (maxNum + 1));

            if (maxNum === 10) {
                if (op === '+' && n1 + n2 > 10) continue;
                if (op === '-' && n1 < n2) [n1, n2] = [n2, n1];
                problems.add(`${n1} ${op} ${n2}`);
                continue;
            }

            let metBrug;
            if (op === '+') {
                if (n1 + n2 > maxNum) continue;
                metBrug = (n1 % 10) + (n2 % 10) >= 10 || (maxNum >= 100 && (n1 % 100) + (n2 % 100) >= 100);
            } else {
                if (n1 < n2) [n1, n2] = [n2, n1];
                metBrug = (n1 % 10) < (n2 % 10) || (maxNum >= 100 && (n1 % 100) < (n2 % 100));
            }

            if ((metBrug && brugOptions.includes('met')) || (!metBrug && brugOptions.includes('zonder'))) {
                problems.add(`${n1} ${op} ${n2}`);
            }
            attempts++;
        }
        loadNewItems(Array.from(problems));
    };

    const spin = () => {
        if (isSpinning) return;
        
        let winningIndex;
        const removeItems = removeAfterSpinCheckbox.checked;

        if (removeItems) {
            const availableIndexes = items.map((_, i) => i).filter(i => !usedItems.includes(i));
            if (availableIndexes.length === 0) {
                alert("Alle opties zijn gebruikt! Druk op 'Reset Rad' om opnieuw te beginnen.");
                return;
            }
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
            showResult(items[winningIndex]);
            isSpinning = false;
            spinBtn.disabled = false;
        }, 8000);
    };
    
    const handleImageUpload = (event) => {
        const files = event.target.files;
        if (files.length === 0) return;
        const promises = Array.from(files).map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = e.target.result;
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });
        Promise.all(promises).then(loadedImages => {
            loadNewItems(loadedImages);
        }).catch(err => console.error("Fout bij laden afbeeldingen:", err));
    };
    
    const updateItemsFromTextarea = () => {
        const newItems = itemInput.value.split('\n').filter(item => item.trim() !== '');
        loadNewItems(newItems.length > 0 ? newItems : []);
    };
    
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            itemInput.value = e.target.result;
            updateItemsFromTextarea();
        };
        reader.readAsText(file);
    };
    
    const showResult = (result) => {
        resultOutput.innerHTML = '';
        if (result instanceof Image) {
            resultOutput.appendChild(result.cloneNode());
        } else {
            const p = document.createElement('p');
            p.textContent = result;
            resultOutput.appendChild(p);
        }
        resultModal.style.display = 'flex';
    };
    const closeModal = () => { resultModal.style.display = 'none'; };

    // Event listeners
    itemInput.addEventListener('input', updateItemsFromTextarea);
    fileUpload.addEventListener('change', handleFileUpload);
    imageUpload.addEventListener('change', handleImageUpload);
    resetBtn.addEventListener('click', resetWheel);
    spinBtn.addEventListener('click', spin);
    generateTablesBtn.addEventListener('click', generateSelectedTables);
    presetBtns.forEach(btn => btn.addEventListener('click', () => generateMathProblems(btn.dataset.type)));
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target == resultModal) closeModal(); });

    // Initialisatie
    createCheckboxes();
    drawWheel();
});
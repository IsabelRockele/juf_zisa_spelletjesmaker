document.addEventListener('DOMContentLoaded', () => {

    const CANVAS_SIZE = 500;
    let wallThickness = 2;
    const MAZE_COLOR = "#333";
    const SOLUTION_COLOR = "#007bff";
    const MAZE_PADDING = 20;

    const canvas = document.getElementById('mazeCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    
    const instructieText = document.getElementById('instructieText');
    const solveBtn = document.getElementById('solveMazeBtn');
    const hideBtn = document.getElementById('hideSolutionBtn');
    
    const thicknessSlider = document.getElementById('thicknessSlider');
    const thicknessValue = document.getElementById('thicknessValue');
    const ASSET_BASE = window.location.pathname.includes('/pro/') ? '../' : '';
    const themeImages = {};
    const themeConfig = {
        none: { instruction: 'Vind de weg van de ingang naar de uitgang.' },
        schoolbus: {
            instruction: 'Help het kind de weg naar de schoolbus te vinden.',
            start: 'kind', end: 'schoolbus',
            startNudge: { x: 0, y: -0.055 },
            endNudge: { x: 0, y: 0.06 }
        },
        school: { instruction: 'Help het kind de weg naar school te vinden.', start: 'kind', end: 'school' },
        ruimte: { instruction: 'Help de astronaut de weg naar de raket te vinden.', start: 'astronaut', end: 'raket' },
        boerderij: { instruction: 'Help de boer de weg naar de boerderij te vinden.', start: 'boer', end: 'boerderij' },
        zee: { instruction: 'Help de duiker de weg naar de schatkist te vinden.', start: 'duiker', end: 'schatkist' },
        sinterklaas: { instruction: 'Help Sinterklaas de weg naar de stoomboot te vinden.', start: 'sinterklaas', end: 'stoomboot' },
        pasen: { instruction: 'Help de paashaas de weg naar de paasmand te vinden.', start: 'paashaas', end: 'paasmand' },
        halloween: { instruction: 'Help het spookje de weg naar de pompoen te vinden.', start: 'spook', end: 'pompoen' },
        carnaval: { instruction: 'Help de clown de weg naar het carnavalsmasker te vinden.', start: 'clown', end: 'carnavalsmasker' },
        lente: { instruction: 'Help de bij de weg naar de lentebloemen te vinden.', start: 'bij', end: 'lentebloemen' },
        herfst: { instruction: 'Help de eekhoorn de weg naar de herfstbladeren te vinden.', start: 'eekhoorn', end: 'herfstbladeren' },
        winter: { instruction: 'Help de pinguïn de weg naar de sneeuwman te vinden.', start: 'pinguin', end: 'sneeuwman' },
        zomer: { instruction: 'Help het kind de weg naar de strandspullen te vinden.', start: 'zomerkind', end: 'strandemmer' },
        kerstmis: { instruction: 'Help de kerstelf de weg naar de kerstboom te vinden.', start: 'kerstelf', end: 'kerstboom' },
        valentijn: { instruction: 'Help de teddybeer de weg naar het hart te vinden.', start: 'teddy', end: 'valentijnshart' }
    };

    let currentGrid = [];
    let activeCells = [];
    let startCell, endCell;
    let solutionPath = [];
    let currentShape = 'worksheet';
    let customShapeImage = null;
    let customShapeDataUrl = '';
    let customOutlinePoints = [];
    let draggedOutlinePoint = -1;
    let customWorkflowStep = 'outline';
    let worksheetPreviewTimer = 0;
    let activeMazeSlot = 0;
    let mazeSlotConfigs = [createMazeSlotConfig()];
    let mazeSlotSnapshots = [null];
    let loadingMazeSlot = false;
    
    const shapes = [
        { id: 'worksheet', name: 'Uitsparing', file: 'uitsparing.png' },
        { id: 'rectangle', name: 'Rechthoek', file: 'rechthoek.png' },
        { id: 'masked_circle', name: 'Rond', file: 'vorm.png' },
        { id: 'house', name: 'Huis', file: 'huis.png' },
        { id: 'heart', name: 'Hart', symbol: '♥' },
        { id: 'star', name: 'Ster', symbol: '★' },
        { id: 'polar_circle', name: 'Ringen', file: 'cirkel.png' },
        { id: 'polar_large_hole', name: 'Ringen open', file: 'cirkel_groot_gat.png' }
    ];

    function createMazeSlotConfig() {
        return { shape: 'worksheet', difficulty: 'easy', theme: 'none', customImage: null, customData: '', customPoints: [], opacity: '25', configured: false };
    }

    function renderMazeSlotTabs() {
        const holder = document.getElementById('mazeSlotTabs');
        if (!holder) return;
        holder.innerHTML = '';
        mazeSlotConfigs.forEach((config, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `maze-slot-tab${index === activeMazeSlot ? ' active' : ''}${mazeSlotSnapshots[index] ? ' ready' : ''}`;
            button.textContent = `Doolhof ${index + 1}`;
            button.addEventListener('click', () => switchMazeSlot(index));
            holder.appendChild(button);
        });
    }

    function saveActiveMazeSlot(configured = true) {
        if (loadingMazeSlot || !mazeSlotConfigs[activeMazeSlot]) return;
        const config = mazeSlotConfigs[activeMazeSlot];
        config.shape = currentShape;
        config.difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || 'easy';
        config.theme = document.getElementById('themeSelect')?.value || 'none';
        config.opacity = document.getElementById('imageOpacity')?.value || '25';
        if (currentShape === 'custom' && customShapeImage) {
            config.customImage = customShapeImage;
            config.customData = customShapeDataUrl;
            config.customPoints = customOutlinePoints.map(point => ({ ...point }));
        }
        if (configured) config.configured = true;
    }

    function switchMazeSlot(index) {
        if (index === activeMazeSlot || !mazeSlotConfigs[index]) return;
        saveActiveMazeSlot(false);
        activeMazeSlot = index;
        const config = mazeSlotConfigs[index];
        loadingMazeSlot = true;
        currentShape = config.shape;
        document.querySelectorAll('input[name="difficulty"]').forEach(radio => { radio.checked = radio.value === config.difficulty; });
        document.getElementById('themeSelect').value = config.theme;
        document.getElementById('imageOpacity').value = config.opacity;
        document.getElementById('imageOpacityValue').textContent = `${config.opacity}%`;
        if (config.shape === 'custom' && config.customImage) {
            customShapeImage = config.customImage;
            customShapeDataUrl = config.customData;
            customOutlinePoints = config.customPoints.map(point => ({ ...point }));
            ensureCustomShapeOption(config.customData);
            document.getElementById('customImageControls').classList.remove('hidden');
            customWorkflowStep = 'maze';
        } else {
            customShapeImage = null;
            customShapeDataUrl = '';
            customOutlinePoints = [];
            document.getElementById('customImageControls').classList.add('hidden');
        }
        selectShape(config.shape);
        loadingMazeSlot = false;
        renderMazeSlotTabs();
        if (config.configured) generateAndDrawMaze();
        else {
            currentGrid = []; activeCells = []; startCell = null; endCell = null; solutionPath = [];
            drawAll(); scheduleWorksheetPreview();
            instructieText.textContent = `Stel doolhof ${index + 1} in.`;
        }
    }

    function handleMazeCountChange() {
        saveActiveMazeSlot(false);
        const count = Number(document.getElementById('mazesPerPage').value || 1);
        while (mazeSlotConfigs.length < count) { mazeSlotConfigs.push(createMazeSlotConfig()); mazeSlotSnapshots.push(null); }
        mazeSlotConfigs = mazeSlotConfigs.slice(0, count);
        mazeSlotSnapshots = mazeSlotSnapshots.slice(0, count);
        if (activeMazeSlot >= count) activeMazeSlot = 0;
        renderMazeSlotTabs();
        updateWorksheetPreview();
    }

    function initialize() {
        preloadThemeImages();
        setupShapePicker();
        renderMazeSlotTabs();
        addEventListeners();
        
        thicknessSlider.value = wallThickness;
        thicknessValue.textContent = wallThickness;
        
        currentGrid = [];
        activeCells = [];
        startCell = null;
        endCell = null;
        solveBtn.disabled = true;
        document.getElementById('downloadPngBtn').disabled = true;
        document.getElementById('downloadPdfBtn').disabled = true;
        instructieText.textContent = 'Kies eerst een vorm om een doolhof te maken.';
        drawAll();
        scheduleWorksheetPreview();
        restoreCustomWork();
    }

    function preloadThemeImages() {
        ['kind', 'schoolbus', 'school', 'astronaut', 'raket', 'boer', 'boerderij', 'duiker', 'schatkist', 'sinterklaas', 'stoomboot', 'paashaas', 'paasmand', 'spook', 'pompoen', 'clown', 'carnavalsmasker', 'bij', 'lentebloemen', 'eekhoorn', 'herfstbladeren', 'pinguin', 'sneeuwman', 'zomerkind', 'strandemmer', 'kerstelf', 'kerstboom', 'teddy', 'valentijnshart'].forEach(name => {
            const image = new Image();
            image.src = `${ASSET_BASE}themas/doolhof/${name}.png`;
            themeImages[name] = image;
        });
    }

    function waitForThemeImage(image) {
        if (!image || image.complete) return Promise.resolve();
        return new Promise(resolve => {
            image.addEventListener('load', resolve, { once: true });
            image.addEventListener('error', resolve, { once: true });
        });
    }

    function setupShapePicker() {
        const pickerDiv = document.getElementById('vorm-kiezer');
        shapes.forEach(shape => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'shape-option';
            button.dataset.shape = shape.id;
            button.setAttribute('aria-label', shape.name);
            if (shape.id === currentShape) button.classList.add('selected');

            if (shape.file) {
                const img = document.createElement('img');
                img.src = `start_afbeeldingen/${shape.file}`;
                img.alt = '';
                button.appendChild(img);
            } else {
                const symbol = document.createElement('span');
                symbol.className = 'shape-symbol';
                symbol.textContent = shape.symbol;
                button.appendChild(symbol);
            }
            const name = document.createElement('span');
            name.className = 'shape-name';
            name.textContent = shape.name;
            button.appendChild(name);
            pickerDiv.appendChild(button);
        });
    }

    function selectShape(shapeId) {
        document.querySelectorAll('.shape-option').forEach(option => option.classList.toggle('selected', option.dataset.shape === shapeId));
        currentShape = shapeId;
        const isCustom = shapeId === 'custom' && customShapeImage;
        if (isCustom) setCustomWorkflowStep(customWorkflowStep);
        else {
            document.getElementById('sourcePreview').classList.add('hidden');
            document.getElementById('mazePreviewColumn').classList.remove('hidden');
            document.getElementById('mazePreviewLabel').classList.add('hidden');
            document.getElementById('comparisonWorkspace').classList.remove('custom-comparison', 'outline-step');
        }
    }

    function addEventListeners() {
        document.getElementById('vorm-kiezer').addEventListener('click', (e) => {
            const option = e.target.closest('.shape-option');
            if (option) {
                selectShape(option.dataset.shape);
                saveActiveMazeSlot(true);
                if (option.dataset.shape !== 'custom' || customWorkflowStep === 'maze') generateAndDrawMaze();
            }
        });
        document.getElementById('shapeUpload').addEventListener('change', handleShapeUpload);
        document.getElementById('simplifyOutlineButton').addEventListener('click', simplifyOutline);
        document.getElementById('clearCustomImageButton').addEventListener('click', clearCustomWork);
        document.getElementById('applyOutlineButton').addEventListener('click', () => {
            if (!customShapeImage || customOutlinePoints.length < 3) return;
            selectShape('custom');
            generateAndDrawMaze();
            setCustomWorkflowStep('maze');
            document.getElementById('uploadStatus').textContent = 'De aangepaste omtrek is gebruikt voor het doolhof.';
            saveActiveMazeSlot(true);
            saveCustomWork();
        });
        document.getElementById('editOutlineButton').addEventListener('click', () => setCustomWorkflowStep('outline'));
        const opacitySlider = document.getElementById('imageOpacity');
        opacitySlider.addEventListener('input', () => {
            document.getElementById('imageOpacityValue').textContent = `${opacitySlider.value}%`;
            drawAll();
            if (mazeSlotSnapshots[activeMazeSlot] && startCell && endCell) {
                mazeSlotSnapshots[activeMazeSlot].image = canvas.toDataURL('image/png');
            }
            saveActiveMazeSlot(false);
            scheduleWorksheetPreview();
            saveCustomWork();
        });
        setupOutlineEditor();
        document.querySelectorAll('input[name="difficulty"]').forEach(radio => radio.addEventListener('change', () => { saveActiveMazeSlot(true); generateAndDrawMaze(); }));
        document.getElementById('themeSelect').addEventListener('change', () => {
            const selectedTheme = document.getElementById('themeSelect').value;
            instructieText.textContent = selectedTheme === 'none'
                ? 'Kies eventueel een thema voor het PDF-werkblad.'
                : themeConfig[selectedTheme].instruction;
            saveActiveMazeSlot(true);
            if (mazeSlotSnapshots[activeMazeSlot]) mazeSlotSnapshots[activeMazeSlot].theme = selectedTheme;
            updateWorksheetPreview();
        });
        document.getElementById('mazesPerPage').addEventListener('change', handleMazeCountChange);
        document.getElementById('generateButton').addEventListener('click', generateAndDrawMaze);
        document.getElementById('downloadPdfBtn').addEventListener('click', downloadPDF);
        document.getElementById('downloadPngBtn').addEventListener('click', downloadPNG);
        
        canvas.addEventListener('click', handleEraser);
        
        solveBtn.addEventListener('click', solveAndShowSolution);
        hideBtn.addEventListener('click', hideSolution);

        thicknessSlider.addEventListener('input', () => {
            wallThickness = parseInt(thicknessSlider.value, 10);
            thicknessValue.textContent = wallThickness;
            drawAll();
            scheduleWorksheetPreview();
        });
    }

    function handleShapeUpload(event) {
        const file = event.target.files?.[0];
        const status = document.getElementById('uploadStatus');
        if (!file) return;
        const supportedExtension = /\.(png|jpe?g|webp)$/i.test(file.name);
        if (!(file.type.startsWith('image/') || supportedExtension)) {
            status.textContent = 'Kies een PNG-, JPG- of WebP-afbeelding.';
            return;
        }
        status.textContent = `${file.name} wordt geladen...`;
        const reader = new FileReader();
        reader.onload = () => {
            const image = new Image();
            image.onload = () => {
                customShapeImage = image;
                customShapeDataUrl = reader.result;
                customOutlinePoints = createAutoOutline(image);
                drawOutlineEditor();
                document.getElementById('customImageControls').classList.remove('hidden');
                ensureCustomShapeOption(reader.result);
                customWorkflowStep = 'outline';
                selectShape('custom');
                status.textContent = `${file.name} is geladen. Verbeter links eventueel de blauwe omtrek en klik daarna op 'Volgende stap'.`;
                saveActiveMazeSlot(false);
                saveCustomWork();
            };
            image.onerror = () => { status.textContent = 'Deze afbeelding kon niet worden gelezen.'; };
            image.src = reader.result;
        };
        reader.onerror = () => { status.textContent = 'Deze afbeelding kon niet worden geladen. Probeer een PNG-, JPG- of WebP-bestand.'; };
        reader.readAsDataURL(file);
    }

    function setCustomWorkflowStep(step) {
        customWorkflowStep = step;
        const editing = step === 'outline';
        document.getElementById('sourcePreview').classList.toggle('hidden', !editing);
        document.getElementById('mazePreviewColumn').classList.toggle('hidden', editing);
        document.getElementById('mazePreviewLabel').classList.toggle('hidden', editing);
        document.getElementById('applyOutlineButton').classList.toggle('hidden', !editing);
        document.getElementById('simplifyOutlineButton').classList.toggle('hidden', !editing);
        document.getElementById('editOutlineButton').classList.toggle('hidden', editing);
        const workspace = document.getElementById('comparisonWorkspace');
        workspace.classList.toggle('outline-step', editing);
        workspace.classList.toggle('custom-comparison', false);
        if (editing) drawOutlineEditor();
        saveCustomWork();
    }

    function saveCustomWork() {
        if (!customShapeDataUrl || customOutlinePoints.length < 3) return;
        try {
            sessionStorage.setItem('zisa-doolhof-custom-work-v1', JSON.stringify({
                image: customShapeDataUrl,
                points: customOutlinePoints,
                step: customWorkflowStep,
                opacity: document.getElementById('imageOpacity')?.value || '25'
            }));
        } catch (_) {
            // Een uitzonderlijk groot bestand mag de gewone werking niet blokkeren.
        }
    }

    function restoreCustomWork() {
        let saved;
        try { saved = JSON.parse(sessionStorage.getItem('zisa-doolhof-custom-work-v1') || 'null'); }
        catch (_) { return; }
        if (!saved?.image || !Array.isArray(saved.points) || saved.points.length < 3) return;
        const image = new Image();
        image.onload = () => {
            customShapeImage = image;
            customShapeDataUrl = saved.image;
            customOutlinePoints = saved.points;
            customWorkflowStep = saved.step === 'maze' ? 'maze' : 'outline';
            const opacity = document.getElementById('imageOpacity');
            opacity.value = saved.opacity || '25';
            document.getElementById('imageOpacityValue').textContent = `${opacity.value}%`;
            document.getElementById('customImageControls').classList.remove('hidden');
            ensureCustomShapeOption(saved.image);
            selectShape('custom');
            saveActiveMazeSlot(false);
            if (customWorkflowStep === 'maze') generateAndDrawMaze();
            document.getElementById('uploadStatus').textContent = customWorkflowStep === 'outline'
                ? 'Je afbeelding en aangepaste omtrek zijn automatisch teruggezet.'
                : 'Je eigen vorm is automatisch teruggezet.';
        };
        image.src = saved.image;
    }

    function clearCustomWork() {
        try { sessionStorage.removeItem('zisa-doolhof-custom-work-v1'); } catch (_) {}
        customShapeImage = null;
        customShapeDataUrl = '';
        customOutlinePoints = [];
        customWorkflowStep = 'outline';
        draggedOutlinePoint = -1;
        currentGrid = [];
        activeCells = [];
        startCell = null;
        endCell = null;
        solutionPath = [];
        mazeSlotConfigs[activeMazeSlot] = createMazeSlotConfig();
        mazeSlotSnapshots[activeMazeSlot] = null;
        document.getElementById('shapeUpload').value = '';
        document.getElementById('customImageControls').classList.add('hidden');
        document.querySelector('.shape-option[data-shape="custom"]')?.remove();
        selectShape('worksheet');
        solveBtn.disabled = true;
        solveBtn.classList.remove('hidden');
        hideBtn.classList.add('hidden');
        document.getElementById('downloadPngBtn').disabled = true;
        document.getElementById('downloadPdfBtn').disabled = true;
        document.getElementById('uploadStatus').textContent = 'Gebruik liefst een duidelijk silhouet op een rustige achtergrond.';
        instructieText.textContent = 'Kies eerst een vorm om een doolhof te maken.';
        drawAll();
        scheduleWorksheetPreview();
        renderMazeSlotTabs();
    }

    function ensureCustomShapeOption(source) {
        let option = document.querySelector('.shape-option[data-shape="custom"]');
        if (!option) {
            option = document.createElement('button');
            option.type = 'button';
            option.className = 'shape-option';
            option.dataset.shape = 'custom';
            option.setAttribute('aria-label', 'Eigen afbeelding');
            option.innerHTML = '<img alt=""><span class="shape-name">Eigen</span>';
            document.getElementById('vorm-kiezer').appendChild(option);
        }
        option.querySelector('img').src = source;
    }

    function simplifyOutline() {
        if (customOutlinePoints.length < 8) return;
        const simplified = [];
        customOutlinePoints.forEach(point => {
            const previous = simplified[simplified.length - 1];
            if (!previous || Math.hypot(point.x - previous.x, point.y - previous.y) >= .032) simplified.push(point);
        });
        if (simplified.length > 6 && Math.hypot(simplified[0].x - simplified.at(-1).x, simplified[0].y - simplified.at(-1).y) < .032) simplified.pop();
        customOutlinePoints = simplified.length >= 6 ? simplified : customOutlinePoints;
        drawOutlineEditor();
        saveCustomWork();
        document.getElementById('uploadStatus').textContent = `De omtrek is vereenvoudigd tot ${customOutlinePoints.length} duidelijke punten.`;
    }

    function drawImageContained(targetCtx, image, size, paddingRatio = .05) {
        const padding = size * paddingRatio;
        const scale = Math.min((size - 2 * padding) / image.width, (size - 2 * padding) / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        targetCtx.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
    }

    function createAutoOutline(image) {
        const size = 180;
        const helper = document.createElement('canvas');
        helper.width = size;
        helper.height = size;
        const helperCtx = helper.getContext('2d', { willReadFrequently: true });
        helperCtx.clearRect(0, 0, size, size);
        drawImageContained(helperCtx, image, size);
        const data = helperCtx.getImageData(0, 0, size, size).data;
        const scale = Math.min(size * .9 / image.width, size * .9 / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        const left = (size - width) / 2;
        const top = (size - height) / 2;
        const inset = Math.max(1, Math.floor(Math.min(width, height) * .01));
        const samples = [[left + inset, top + inset], [left + width - inset - 1, top + inset], [left + inset, top + height - inset - 1], [left + width - inset - 1, top + height - inset - 1]];
        const background = samples.map(([x, y]) => {
            const i = (Math.floor(y) * size + Math.floor(x)) * 4;
            return [data[i], data[i + 1], data[i + 2], data[i + 3]];
        }).reduce((sum, color) => sum.map((value, i) => value + color[i]), [0, 0, 0, 0]).map(value => value / 4);
        const transparent = background[3] < 80;
        const rawForeground = (x, y) => {
            if (x < 0 || y < 0 || x >= size || y >= size) return false;
            const i = (Math.floor(y) * size + Math.floor(x)) * 4;
            const alpha = data[i + 3];
            const distance = Math.hypot(data[i] - background[0], data[i + 1] - background[1], data[i + 2] - background[2]);
            return alpha > 45 && (transparent || distance > 42);
        };

        let outlineMask = new Uint8Array(size * size);
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (rawForeground(x, y)) outlineMask[y * size + x] = 1;
            }
        }
        // Maak dunne kleurplaatlijnen dikker zodat de automatische stralen
        // de buitenrand niet missen en terugvallen op een rechthoek.
        for (let pass = 0; pass < 3; pass++) {
            const expanded = outlineMask.slice();
            for (let y = 1; y < size - 1; y++) {
                for (let x = 1; x < size - 1; x++) {
                    const i = y * size + x;
                    if (!outlineMask[i] && (outlineMask[i - 1] || outlineMask[i + 1] || outlineMask[i - size] || outlineMask[i + size])) expanded[i] = 1;
                }
            }
            outlineMask = expanded;
        }
        const foreground = (x, y) => {
            const px = Math.floor(x);
            const py = Math.floor(y);
            return px >= 0 && py >= 0 && px < size && py < size && outlineMask[py * size + px] === 1;
        };

        let totalX = 0, totalY = 0, count = 0;
        for (let y = 0; y < size; y += 2) {
            for (let x = 0; x < size; x += 2) {
                if (foreground(x, y)) { totalX += x; totalY += y; count++; }
            }
        }
        if (!count) return [{x:.1,y:.1},{x:.9,y:.1},{x:.9,y:.9},{x:.1,y:.9}];
        const centerX = totalX / count;
        const centerY = totalY / count;
        const points = [];
        for (let step = 0; step < 36; step++) {
            const angle = -Math.PI / 2 + step * Math.PI * 2 / 36;
            let found = null;
            for (let radius = size * .72; radius >= 1; radius -= 1) {
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                if (foreground(x, y)) { found = { x: x / size, y: y / size }; break; }
            }
            if (found) points.push(found);
        }
        return points.length >= 8 ? points : [{x:.1,y:.1},{x:.9,y:.1},{x:.9,y:.9},{x:.1,y:.9}];
    }

    function drawOutlineEditor() {
        const editor = document.getElementById('outlineEditor');
        if (!editor || !customShapeImage) return;
        const editorCtx = editor.getContext('2d');
        editorCtx.clearRect(0, 0, editor.width, editor.height);
        editorCtx.fillStyle = '#fff';
        editorCtx.fillRect(0, 0, editor.width, editor.height);
        drawImageContained(editorCtx, customShapeImage, editor.width);
        if (customOutlinePoints.length < 2) return;
        editorCtx.strokeStyle = '#2388d8';
        editorCtx.lineWidth = 3;
        editorCtx.lineJoin = 'round';
        editorCtx.beginPath();
        customOutlinePoints.forEach((point, index) => {
            const x = point.x * editor.width;
            const y = point.y * editor.height;
            if (index === 0) editorCtx.moveTo(x, y); else editorCtx.lineTo(x, y);
        });
        editorCtx.closePath();
        editorCtx.stroke();
        customOutlinePoints.forEach((point, index) => {
            editorCtx.fillStyle = index === draggedOutlinePoint ? '#ff6b57' : '#fff';
            editorCtx.strokeStyle = '#28689f';
            editorCtx.lineWidth = 2;
            editorCtx.beginPath();
            editorCtx.arc(point.x * editor.width, point.y * editor.height, 6, 0, Math.PI * 2);
            editorCtx.fill();
            editorCtx.stroke();
        });
    }

    function setupOutlineEditor() {
        const editor = document.getElementById('outlineEditor');
        const pointerPosition = event => {
            const rect = editor.getBoundingClientRect();
            return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
        };
        const closestPoint = position => customOutlinePoints.reduce((best, point, index) => {
            const distance = Math.hypot(point.x - position.x, point.y - position.y);
            return distance < best.distance ? { index, distance } : best;
        }, { index: -1, distance: Infinity });

        editor.addEventListener('pointerdown', event => {
            if (!customShapeImage) return;
            const position = pointerPosition(event);
            const nearest = closestPoint(position);
            if (nearest.distance < .024) {
                draggedOutlinePoint = nearest.index;
            } else {
                let bestSegment = { index: -1, distance: Infinity };
                customOutlinePoints.forEach((point, index) => {
                    const next = customOutlinePoints[(index + 1) % customOutlinePoints.length];
                    const projected = closestPointOnSegment(position, point, next);
                    const distance = Math.hypot(position.x - projected.x, position.y - projected.y);
                    if (distance < bestSegment.distance) bestSegment = { index, distance, point: projected };
                });
                if (bestSegment.distance < .026) {
                    customOutlinePoints.splice(bestSegment.index + 1, 0, bestSegment.point);
                    saveCustomWork();
                    document.getElementById('uploadStatus').textContent = 'Nieuw omtrekpunt toegevoegd. Neem het vast om het te verslepen.';
                }
            }
            if (draggedOutlinePoint >= 0) editor.setPointerCapture(event.pointerId);
            drawOutlineEditor();
        });
        editor.addEventListener('pointermove', event => {
            if (draggedOutlinePoint < 0) return;
            const position = pointerPosition(event);
            customOutlinePoints[draggedOutlinePoint] = { x: Math.max(0, Math.min(1, position.x)), y: Math.max(0, Math.min(1, position.y)) };
            drawOutlineEditor();
        });
        const endDrag = () => { draggedOutlinePoint = -1; drawOutlineEditor(); saveCustomWork(); };
        editor.addEventListener('pointerup', endDrag);
        editor.addEventListener('pointercancel', endDrag);
        editor.addEventListener('dblclick', event => {
            if (customOutlinePoints.length <= 6) return;
            const nearest = closestPoint(pointerPosition(event));
            if (nearest.distance < .05) {
                customOutlinePoints.splice(nearest.index, 1);
                drawOutlineEditor();
                saveCustomWork();
            }
        });
    }

    function distanceToSegment(point, start, end) {
        const closest = closestPointOnSegment(point, start, end);
        return Math.hypot(point.x - closest.x, point.y - closest.y);
    }

    function closestPointOnSegment(point, start, end) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const lengthSquared = dx * dx + dy * dy;
        if (!lengthSquared) return { x: start.x, y: start.y };
        const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
        return { x: start.x + t * dx, y: start.y + t * dy };
    }
    
    function generateAndDrawMaze() {
        const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
        solutionPath = [];
        hideBtn.classList.add('hidden');
        solveBtn.classList.remove('hidden');
        activeCells = [];

        const selectedTheme = document.getElementById('themeSelect')?.value || 'none';
        instructieText.textContent = selectedTheme !== 'none'
            ? themeConfig[selectedTheme].instruction
            : currentShape === 'worksheet'
                ? 'Tip: klik op een binnenmuur om die weg te gummen.'
                : 'Maak opnieuw voor een andere route in dezelfde vorm.';
        solveBtn.disabled = false;
        document.getElementById('downloadPngBtn').disabled = false;
        document.getElementById('downloadPdfBtn').disabled = false;
        canvas.style.cursor = 'default';

        if (currentShape === 'worksheet') {
            generateWorksheetMaze(difficulty);
            canvas.style.cursor = 'crosshair';
        } else if (currentShape === 'rectangle') {
            generateRectangularMaze(difficulty);
        } else if (currentShape === 'masked_circle') {
            generateMaskedMaze(difficulty, 'circle');
        } else if (['house', 'heart', 'star', 'custom'].includes(currentShape)) {
            if (currentShape === 'custom' && !customShapeImage) return;
            generateMaskedMaze(difficulty, currentShape);
        } else if (currentShape === 'polar_circle' || currentShape === 'polar_large_hole') {
            const isLarge = currentShape === 'polar_large_hole';
            generatePolarMaze(difficulty, { largeHole: isLarge });
        }
        saveActiveMazeSlot(true);
        if (startCell && endCell) {
            mazeSlotSnapshots[activeMazeSlot] = {
                image: canvas.toDataURL('image/png'),
                markers: getMarkerPositions(),
                theme: document.getElementById('themeSelect')?.value || 'none',
                shape: currentShape
            };
            renderMazeSlotTabs();
        }
        scheduleWorksheetPreview();
    }
    
    function drawAll() {
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        if (currentShape === 'custom' && customShapeImage) {
            const opacity = Number(document.getElementById('imageOpacity')?.value || 0) / 100;
            if (opacity > 0) {
                ctx.save();
                ctx.globalAlpha = opacity;
                drawImageContained(ctx, customShapeImage, CANVAS_SIZE);
                ctx.restore();
            }
        }
        
        if (currentShape === 'worksheet') { drawWorksheetMaze(); }
        else if (currentShape === 'rectangle') { drawRectangularMaze(); }
        else if (['masked_circle', 'house', 'heart', 'star', 'custom'].includes(currentShape)) { drawMaskedMaze(); }
        else if (currentShape === 'polar_circle' || currentShape === 'polar_large_hole') { drawPolarMaze(); }
        
        if (solutionPath.length > 0) {
            drawSolution();
        }
    }

    function scheduleWorksheetPreview() {
        clearTimeout(worksheetPreviewTimer);
        worksheetPreviewTimer = setTimeout(updateWorksheetPreview, 80);
    }

    function updateWorksheetPreview() {
        const grid = document.getElementById('worksheetMazeGrid');
        if (!grid || !canvas.width) return;
        const count = Number(document.getElementById('mazesPerPage')?.value || 1);
        const usedThemes = mazeSlotConfigs.slice(0, count).filter((_, index) => mazeSlotSnapshots[index]).map(config => config.theme);
        const oneTheme = usedThemes.length && usedThemes.every(theme => theme === usedThemes[0]);
        document.getElementById('worksheetInstruction').textContent = oneTheme
            ? themeConfig[usedThemes[0]].instruction
            : 'Vind bij elk doolhof de weg van de ingang naar de uitgang.';
        const customSolo = count === 1 && mazeSlotSnapshots[0]?.shape === 'custom' && mazeSlotSnapshots[0]?.theme === 'none';
        grid.className = `worksheet-maze-grid count-${count}${customSolo ? ' custom-solo' : ''}`;
        grid.querySelectorAll('.worksheet-maze-copy-item').forEach(item => item.remove());
        const firstItem = document.getElementById('drawingCanvasContainer');
        firstItem.querySelectorAll('.slot-snapshot,.slot-placeholder,.theme-marker').forEach(element => element.remove());
        for (let index = 0; index < count; index++) {
            const item = index === 0 ? firstItem : document.createElement('div');
            if (index > 0) {
                item.className = 'worksheet-maze-item worksheet-maze-copy-item';
                grid.appendChild(item);
            }
            const snapshot = mazeSlotSnapshots[index];
            if (!snapshot) {
                const placeholder = document.createElement('span');
                placeholder.className = 'slot-placeholder';
                placeholder.textContent = `Stel doolhof ${index + 1} in`;
                item.appendChild(placeholder);
                continue;
            }
            const image = document.createElement('img');
            image.className = 'slot-snapshot';
            image.src = snapshot.image;
            image.alt = '';
            item.appendChild(image);
            const theme = themeConfig[snapshot.theme];
            if (theme.start && theme.end && snapshot.markers) {
                addHtmlThemeMarker(item, theme.start, nudgeMarker(snapshot.markers.start, theme.startNudge));
                const centerExit = snapshot.shape === 'polar_circle';
                addHtmlThemeMarker(
                    item,
                    theme.end,
                    centerExit ? { x: .5, y: .5, dx: 0, dy: 0 } : nudgeMarker(snapshot.markers.end, theme.endNudge),
                    centerExit ? 'polar-center-marker' : ''
                );
            }
        }
    }

    function addHtmlThemeMarker(container, imageName, point, extraClass = '') {
        const marker = document.createElement('img');
        marker.className = `theme-marker${extraClass ? ` ${extraClass}` : ''}`;
        marker.src = `${ASSET_BASE}themas/doolhof/${imageName}.png`;
        marker.alt = '';
        const compact = container.closest('.worksheet-maze-grid')?.classList.contains('count-1') === false;
        const markerFraction = compact ? .30 : .24;
        const clearance = markerFraction / 2 + .035;
        marker.style.left = `${(point.x + (point.dx || 0) * clearance) * 100}%`;
        marker.style.top = `${(point.y + (point.dy || 0) * clearance) * 100}%`;
        container.appendChild(marker);
    }

    function nudgeMarker(point, nudge = {}) {
        return {
            x: point.x + (nudge.x || 0),
            y: point.y + (nudge.y || 0),
            dx: point.dx || 0,
            dy: point.dy || 0
        };
    }

    // --- RECTANGULAR/MASKED MAZE LOGIC (ORIGINAL, WORKING CODE) ---

    function generateWorksheetMaze(difficulty) {
        const DIFFICULTY_LEVELS = { easy: 10, medium: 15, hard: 25 };
        const gridSize = DIFFICULTY_LEVELS[difficulty];
        let grid = [];
        const cutoutSize = Math.floor(gridSize * 0.25);

        for (let y = 0; y < gridSize; y++) {
            grid[y] = [];
            for (let x = 0; x < gridSize; x++) {
                const cell = { x, y, walls: { top: true, right: true, bottom: true, left: true }, visited: false };
                grid[y][x] = cell;
                const inTopLeft = x < cutoutSize && y < cutoutSize;
                const inBottomRight = x >= gridSize - cutoutSize && y >= gridSize - cutoutSize;
                if (!inTopLeft && !inBottomRight) activeCells.push(cell);
            }
        }
        
        if(activeCells.length === 0) return;
        
        let stack = [activeCells[0]];
        activeCells[0].visited = true;

        while (stack.length > 0) {
            let current = stack.pop();
            const getNeighbors = (cell) => [ grid[cell.y-1]?.[cell.x], grid[cell.y]?.[cell.x+1], grid[cell.y+1]?.[cell.x], grid[cell.y]?.[cell.x-1] ].filter(p => p && !p.visited && activeCells.includes(p));
            const neighbors = getNeighbors(current);
            
            if (neighbors.length > 0) {
                stack.push(current);
                let chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
                if (current.x - chosen.x === 1) { current.walls.left = false; chosen.walls.right = false; }
                else if (current.x - chosen.x === -1) { current.walls.right = false; chosen.walls.left = false; }
                if (current.y - chosen.y === 1) { current.walls.top = false; chosen.walls.bottom = false; }
                else if (current.y - chosen.y === -1) { current.walls.bottom = false; chosen.walls.top = false; }
                chosen.visited = true;
                stack.push(chosen);
            }
        }
        currentGrid = grid;
        
        startCell = grid[Math.floor(cutoutSize/2)][cutoutSize];
        endCell = grid[gridSize - Math.floor(cutoutSize/2) -1][gridSize - cutoutSize -1];
        startCell.walls.left = false;
        endCell.walls.right = false;

        drawAll();
    }

    function drawWorksheetMaze() {
        if (!currentGrid.length) return;
        const gridSize = currentGrid.length;
        const availableSize = CANVAS_SIZE - 2 * MAZE_PADDING;
        const cellSize = availableSize / gridSize;
        
        ctx.strokeStyle = MAZE_COLOR;
        ctx.lineWidth = wallThickness;
        ctx.lineCap = "square";
        
        ctx.beginPath();
        for (const cell of activeCells) {
            const gx = MAZE_PADDING + cell.x * cellSize;
            const gy = MAZE_PADDING + cell.y * cellSize;
            if (cell.walls.top) { ctx.moveTo(gx, gy); ctx.lineTo(gx + cellSize, gy); }
            if (cell.walls.right) { ctx.moveTo(gx + cellSize, gy); ctx.lineTo(gx + cellSize, gy + cellSize); }
            if (cell.walls.bottom) { ctx.moveTo(gx, gy + cellSize); ctx.lineTo(gx + cellSize, gy + cellSize); }
            if (cell.walls.left) { ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + cellSize); }
        }
        ctx.stroke();
    }

    function generateRectangularMaze(difficulty) {
        const DIFFICULTY_LEVELS = { easy: 10, medium: 15, hard: 25 };
        const gridSize = DIFFICULTY_LEVELS[difficulty];
        let grid = [];
        for (let y = 0; y < gridSize; y++) {
            grid[y] = [];
            for (let x = 0; x < gridSize; x++) {
                 grid[y][x] = { x, y, walls: { top: true, right: true, bottom: true, left: true }, visited: false };
            }
        }
        let stack = [grid[0][0]];
        grid[0][0].visited = true;
        while (stack.length > 0) {
            let current = stack.pop();
            const neighbors = [grid[current.y-1]?.[current.x], grid[current.y]?.[current.x+1], grid[current.y+1]?.[current.x], grid[current.y]?.[current.x-1]].filter(n => n && !n.visited);
            if (neighbors.length > 0) {
                stack.push(current);
                let chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
                if (current.x - chosen.x === 1) { current.walls.left = false; chosen.walls.right = false; }
                else if (current.x - chosen.x === -1) { current.walls.right = false; chosen.walls.left = false; }
                if (current.y - chosen.y === 1) { current.walls.top = false; chosen.walls.bottom = false; }
                else if (current.y - chosen.y === -1) { current.walls.bottom = false; chosen.walls.top = false; }
                chosen.visited = true;
                stack.push(chosen);
            }
        }
        startCell = grid[0][0];
        endCell = grid[gridSize-1][gridSize-1];
        startCell.walls.left = false;
        endCell.walls.right = false;
        currentGrid = grid;
        drawAll();
    }

    function drawRectangularMaze() {
        if (!currentGrid.length) return;
        const gridSize = currentGrid.length;
        const availableSize = CANVAS_SIZE - 2 * MAZE_PADDING;
        const cellSize = availableSize / gridSize;
        
        ctx.strokeStyle = MAZE_COLOR;
        ctx.lineWidth = wallThickness;
        ctx.lineCap = "square";
        
        ctx.beginPath();
        for (const row of currentGrid) {
            for (const cell of row) {
                const gx = MAZE_PADDING + cell.x * cellSize;
                const gy = MAZE_PADDING + cell.y * cellSize;
                if (cell.walls.top) { ctx.moveTo(gx, gy); ctx.lineTo(gx + cellSize, gy); }
                if (cell.walls.right) { ctx.moveTo(gx + cellSize, gy); ctx.lineTo(gx + cellSize, gy + cellSize); }
                if (cell.walls.bottom) { ctx.moveTo(gx, gy + cellSize); ctx.lineTo(gx + cellSize, gy + cellSize); }
                if (cell.walls.left) { ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + cellSize); }
            }
        }
        ctx.stroke();
    }
    
    function generateMaskedMaze(difficulty, maskType) {
        const DIFFICULTY_LEVELS = { easy: 10, medium: 15, hard: 25 };
        const gridSize = DIFFICULTY_LEVELS[difficulty];
        let grid = [];
        activeCells = [];
        const customMask = maskType === 'custom' ? buildCustomMask(gridSize) : null;
        const smoothShapePath = ['circle', 'heart', 'star'].includes(maskType) ? createSmoothShapePath(maskType) : null;
        const cellSize = (CANVAS_SIZE - 2 * MAZE_PADDING) / gridSize;

        for (let y = 0; y < gridSize; y++) {
            grid[y] = [];
            for (let x = 0; x < gridSize; x++) {
                const cell = { x, y, walls: { top: true, right: true, bottom: true, left: true }, visited: false };
                grid[y][x] = cell;

                let isActive = false;
                if (maskType === 'circle') {
                    isActive = ctx.isPointInPath(smoothShapePath, MAZE_PADDING + (x + .5) * cellSize, MAZE_PADDING + (y + .5) * cellSize);
                } else if (maskType === 'house') {
                    const baseTopY = Math.floor(gridSize / 2);
                    if (y >= baseTopY) {
                        isActive = true;
                    } else {
                        const roofHeight = baseTopY;
                        const center = (gridSize - 1) / 2;
                        const yInRoof = y;
                        const allowedDist = (yInRoof / (roofHeight - 1)) * center;
                        if (Math.abs(x - center) <= allowedDist) {
                            isActive = true;
                        }
                    }
                } else if (maskType === 'heart' || maskType === 'star') {
                    isActive = ctx.isPointInPath(smoothShapePath, MAZE_PADDING + (x + .5) * cellSize, MAZE_PADDING + (y + .5) * cellSize);
                } else if (maskType === 'custom') {
                    isActive = customMask?.[y]?.[x] === true;
                }

                if (isActive) {
                    activeCells.push(cell);
                }
            }
        }

        activeCells = largestConnectedGroup(activeCells, grid);
        if (activeCells.length < Math.max(18, gridSize * 2)) {
            instructieText.textContent = 'De vorm is te klein of te onderbroken. Probeer een duidelijker silhouet.';
            if (maskType === 'custom') document.getElementById('uploadStatus').textContent = 'De omtrek werd niet goed herkend. Probeer een afbeelding met een duidelijke, gesloten buitenlijn.';
            solveBtn.disabled = true;
            return;
        }

        if (maskType === 'custom') {
            document.getElementById('uploadStatus').textContent = 'Gelukt: de grootste gesloten vorm is omgezet naar een oplosbaar doolhof.';
        }

        const activeSet = new Set(activeCells);

        
        let stack = [activeCells[0]];
        activeCells[0].visited = true;
        while (stack.length > 0) {
            let current = stack.pop();
            const getNeighbors = (cell) => [ grid[cell.y-1]?.[cell.x], grid[cell.y]?.[cell.x+1], grid[cell.y+1]?.[cell.x], grid[cell.y]?.[cell.x-1] ].filter(p => p && !p.visited && activeSet.has(p));
            const neighbors = getNeighbors(current);
            if (neighbors.length > 0) {
                stack.push(current);
                let chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
                if (current.x - chosen.x === 1) { current.walls.left = false; chosen.walls.right = false; }
                else if (current.x - chosen.x === -1) { current.walls.right = false; chosen.walls.left = false; }
                if (current.y - chosen.y === 1) { current.walls.top = false; chosen.walls.bottom = false; }
                else if (current.y - chosen.y === -1) { current.walls.bottom = false; chosen.walls.top = false; }
                chosen.visited = true;
                stack.push(chosen);
            }
        }

        const edgeCells = activeCells.filter(c => [ grid[c.y-1]?.[c.x], grid[c.y]?.[c.x+1], grid[c.y+1]?.[c.x], grid[c.y]?.[c.x-1] ].some(n => !n || !activeSet.has(n)));
        if (edgeCells.length >= 2) {
            startCell = edgeCells.reduce((a, b) => a.x < b.x ? a : b);
            endCell = edgeCells.reduce((a, b) => Math.hypot(startCell.x - a.x, startCell.y - a.y) > Math.hypot(startCell.x - b.x, startCell.y - b.y) ? a : b);

            if (!activeSet.has(grid[startCell.y-1]?.[startCell.x])) startCell.walls.top = false;
            else if (!activeSet.has(grid[startCell.y]?.[startCell.x+1])) startCell.walls.right = false;
            else if (!activeSet.has(grid[startCell.y+1]?.[startCell.x])) startCell.walls.bottom = false;
            else startCell.walls.left = false;
            
            if (!activeSet.has(grid[endCell.y-1]?.[endCell.x])) endCell.walls.top = false;
            else if (!activeSet.has(grid[endCell.y]?.[endCell.x+1])) endCell.walls.right = false;
            else if (!activeSet.has(grid[endCell.y+1]?.[endCell.x])) endCell.walls.bottom = false;
            else endCell.walls.left = false;
        } else {
             solveBtn.disabled = true;
        }

        currentGrid = grid;
        drawAll();
    }

    function largestConnectedGroup(cells, grid) {
        const available = new Set(cells);
        const seen = new Set();
        let largest = [];
        for (const first of cells) {
            if (seen.has(first)) continue;
            const group = [];
            const queue = [first];
            seen.add(first);
            while (queue.length) {
                const cell = queue.shift();
                group.push(cell);
                [grid[cell.y - 1]?.[cell.x], grid[cell.y]?.[cell.x + 1], grid[cell.y + 1]?.[cell.x], grid[cell.y]?.[cell.x - 1]].forEach(next => {
                    if (next && available.has(next) && !seen.has(next)) {
                        seen.add(next);
                        queue.push(next);
                    }
                });
            }
            if (group.length > largest.length) largest = group;
        }
        return largest;
    }

    function buildCustomMask(gridSize) {
        if (customOutlinePoints.length >= 3) {
            const availableSize = CANVAS_SIZE - 2 * MAZE_PADDING;
            return Array.from({ length: gridSize }, (_, y) => Array.from({ length: gridSize }, (_, x) => {
                const point = {
                    x: (MAZE_PADDING + (x + .5) * availableSize / gridSize) / CANVAS_SIZE,
                    y: (MAZE_PADDING + (y + .5) * availableSize / gridSize) / CANVAS_SIZE
                };
                return pointInPolygon(point, customOutlinePoints);
            }));
        }
        const sampleSize = Math.max(120, gridSize * 8);
        const source = document.createElement('canvas');
        source.width = sampleSize;
        source.height = sampleSize;
        const sourceCtx = source.getContext('2d', { willReadFrequently: true });
        sourceCtx.clearRect(0, 0, sampleSize, sampleSize);

        const padding = sampleSize * 0.07;
        const scale = Math.min((sampleSize - 2 * padding) / customShapeImage.width, (sampleSize - 2 * padding) / customShapeImage.height);
        const width = customShapeImage.width * scale;
        const height = customShapeImage.height * scale;
        const drawX = (sampleSize - width) / 2;
        const drawY = (sampleSize - height) / 2;
        sourceCtx.drawImage(customShapeImage, drawX, drawY, width, height);

        const pixels = sourceCtx.getImageData(0, 0, sampleSize, sampleSize).data;
        // Meet de achtergrond in de hoeken van de afbeelding zelf, niet in de
        // transparante marge van ons hulpcanvas. Anders wordt een witte JPG/PNG
        // onterecht als één grote rechthoek gezien.
        const inset = Math.max(1, Math.floor(Math.min(width, height) * .01));
        const corners = [
            [Math.floor(drawX + inset), Math.floor(drawY + inset)],
            [Math.floor(drawX + width - inset - 1), Math.floor(drawY + inset)],
            [Math.floor(drawX + inset), Math.floor(drawY + height - inset - 1)],
            [Math.floor(drawX + width - inset - 1), Math.floor(drawY + height - inset - 1)]
        ];
        const background = corners.map(([x, y]) => {
            const i = (y * sampleSize + x) * 4;
            return [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
        }).reduce((sum, color) => sum.map((value, i) => value + color[i]), [0, 0, 0, 0]).map(value => value / 4);
        const transparentBackground = background[3] < 80;
        let highMask = new Uint8Array(sampleSize * sampleSize);

        for (let y = 0; y < sampleSize; y++) {
            for (let x = 0; x < sampleSize; x++) {
                const i = (y * sampleSize + x) * 4;
                const alpha = pixels[i + 3];
                const distance = Math.hypot(pixels[i] - background[0], pixels[i + 1] - background[1], pixels[i + 2] - background[2]);
                if (alpha > 45 && (transparentBackground || distance > 42)) highMask[y * sampleSize + x] = 1;
            }
        }

        // Maak dunne of licht onderbroken kleurplaatlijnen dicht vóór we de binnenkant vullen.
        for (let pass = 0; pass < 2; pass++) {
            const expanded = highMask.slice();
            for (let y = 1; y < sampleSize - 1; y++) {
                for (let x = 1; x < sampleSize - 1; x++) {
                    const index = y * sampleSize + x;
                    if (!highMask[index] && (
                        highMask[index - 1] || highMask[index + 1] ||
                        highMask[index - sampleSize] || highMask[index + sampleSize]
                    )) expanded[index] = 1;
                }
            }
            highMask = expanded;
        }

        const highOutside = new Uint8Array(sampleSize * sampleSize);
        const highQueue = [];
        for (let i = 0; i < sampleSize; i++) {
            [i, (sampleSize - 1) * sampleSize + i, i * sampleSize, i * sampleSize + sampleSize - 1].forEach(index => {
                if (!highMask[index] && !highOutside[index]) { highOutside[index] = 1; highQueue.push(index); }
            });
        }
        for (let cursor = 0; cursor < highQueue.length; cursor++) {
            const index = highQueue[cursor];
            const x = index % sampleSize;
            const y = Math.floor(index / sampleSize);
            const neighbors = [];
            if (x > 0) neighbors.push(index - 1);
            if (x < sampleSize - 1) neighbors.push(index + 1);
            if (y > 0) neighbors.push(index - sampleSize);
            if (y < sampleSize - 1) neighbors.push(index + sampleSize);
            neighbors.forEach(next => {
                if (!highMask[next] && !highOutside[next]) { highOutside[next] = 1; highQueue.push(next); }
            });
        }

        const raw = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));
        const block = sampleSize / gridSize;

        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                let shapePixels = 0;
                let samples = 0;
                const startX = Math.floor(x * block);
                const endX = Math.ceil((x + 1) * block);
                const startY = Math.floor(y * block);
                const endY = Math.ceil((y + 1) * block);
                for (let py = startY; py < endY; py += 2) {
                    for (let px = startX; px < endX; px += 2) {
                        const index = Math.min(sampleSize - 1, py) * sampleSize + Math.min(sampleSize - 1, px);
                        if (highMask[index] || !highOutside[index]) shapePixels++;
                        samples++;
                    }
                }
                raw[y][x] = shapePixels / samples >= 0.24;
            }
        }

        // Sluit kleine gaatjes in lijntekeningen, zodat de binnenkant als vorm wordt gebruikt.
        const outside = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));
        const queue = [];
        for (let i = 0; i < gridSize; i++) {
            [[i, 0], [i, gridSize - 1], [0, i], [gridSize - 1, i]].forEach(([x, y]) => {
                if (!raw[y][x] && !outside[y][x]) { outside[y][x] = true; queue.push([x, y]); }
            });
        }
        while (queue.length) {
            const [x, y] = queue.shift();
            [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]].forEach(([nx, ny]) => {
                if (nx >= 0 && ny >= 0 && nx < gridSize && ny < gridSize && !raw[ny][nx] && !outside[ny][nx]) {
                    outside[ny][nx] = true;
                    queue.push([nx, ny]);
                }
            });
        }
        return raw.map((row, y) => row.map((active, x) => active || !outside[y][x]));
    }

    function pointInPolygon(point, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const a = polygon[i];
            const b = polygon[j];
            if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / ((b.y - a.y) || .000001) + a.x) inside = !inside;
        }
        return inside;
    }

    function createSmoothShapePath(shapeType) {
        const path = new Path2D();
        const left = MAZE_PADDING;
        const top = MAZE_PADDING;
        const size = CANVAS_SIZE - 2 * MAZE_PADDING;
        const cx = CANVAS_SIZE / 2;
        const cy = CANVAS_SIZE / 2;

        if (shapeType === 'circle') {
            path.arc(cx, cy, size / 2, 0, Math.PI * 2);
        } else if (shapeType === 'heart') {
            path.moveTo(cx, top + size * .91);
            path.bezierCurveTo(left + size * .12, top + size * .67, left + size * .03, top + size * .33, left + size * .25, top + size * .18);
            path.bezierCurveTo(left + size * .40, top + size * .07, cx, top + size * .18, cx, top + size * .30);
            path.bezierCurveTo(cx, top + size * .18, left + size * .60, top + size * .07, left + size * .75, top + size * .18);
            path.bezierCurveTo(left + size * .97, top + size * .33, left + size * .88, top + size * .67, cx, top + size * .91);
            path.closePath();
        } else if (shapeType === 'star') {
            const outer = size * .48;
            const inner = size * .23;
            for (let i = 0; i < 10; i++) {
                const angle = -Math.PI / 2 + i * Math.PI / 5;
                const radius = i % 2 === 0 ? outer : inner;
                const x = cx + Math.cos(angle) * radius;
                const y = cy + Math.sin(angle) * radius;
                if (i === 0) path.moveTo(x, y); else path.lineTo(x, y);
            }
            path.closePath();
        } else if (shapeType === 'custom' && customOutlinePoints.length >= 3) {
            customOutlinePoints.forEach((point, index) => {
                const x = point.x * CANVAS_SIZE;
                const y = point.y * CANVAS_SIZE;
                if (index === 0) path.moveTo(x, y); else path.lineTo(x, y);
            });
            path.closePath();
        }
        return path;
    }

    function drawMaskedMaze() {
        if (!currentGrid.length) return;
        const gridSize = currentGrid.length;
        const availableSize = CANVAS_SIZE - 2 * MAZE_PADDING;
        const cellSize = availableSize / gridSize;
        const smoothType = currentShape === 'masked_circle' ? 'circle' : (['heart', 'star', 'custom'].includes(currentShape) ? currentShape : null);
        const smoothPath = smoothType ? createSmoothShapePath(smoothType) : null;
        
        ctx.strokeStyle = MAZE_COLOR;
        ctx.lineWidth = wallThickness;
        ctx.lineCap = "square";

        if (smoothPath) {
            ctx.save();
            ctx.clip(smoothPath);
        }

        ctx.beginPath();
        for (const cell of activeCells) {
            const gx = MAZE_PADDING + cell.x * cellSize;
            const gy = MAZE_PADDING + cell.y * cellSize;
            if (cell.walls.top) { ctx.moveTo(gx, gy); ctx.lineTo(gx + cellSize, gy); }
            if (cell.walls.right) { ctx.moveTo(gx + cellSize, gy); ctx.lineTo(gx + cellSize, gy + cellSize); }
            if (cell.walls.bottom) { ctx.moveTo(gx, gy + cellSize); ctx.lineTo(gx + cellSize, gy + cellSize); }
            if (cell.walls.left) { ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + cellSize); }
        }
        ctx.stroke();

        if (smoothPath) {
            ctx.restore();
            ctx.strokeStyle = MAZE_COLOR;
            ctx.lineWidth = wallThickness;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.stroke(smoothPath);

            [startCell, endCell].forEach(cell => {
                if (!cell) return;
                const centerX = CANVAS_SIZE / 2;
                const centerY = CANVAS_SIZE / 2;
                const targetX = MAZE_PADDING + (cell.x + .5) * cellSize;
                const targetY = MAZE_PADDING + (cell.y + .5) * cellSize;
                const dx = targetX - centerX;
                const dy = targetY - centerY;
                let lastInside = { x: targetX, y: targetY };
                for (let distance = 0; distance <= availableSize; distance += 1.5) {
                    const length = Math.hypot(dx, dy) || 1;
                    const x = targetX + dx / length * distance;
                    const y = targetY + dy / length * distance;
                    if (!ctx.isPointInPath(smoothPath, x, y)) break;
                    lastInside = { x, y };
                }
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(lastInside.x, lastInside.y, Math.max(4, cellSize * .34), 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }

    // --- POLAR MAZE LOGIC (REWRITTEN BASED ON PROEFVERSIE) ---

    function generatePolarMaze(difficulty, options = {}) {
        const { largeHole = false } = options;

        const DIFFICULTY_LEVELS = {
            easy:   { levels: 6,  cellsPerLevel: 24, centerRings: largeHole ? 3 : 1 },
            medium: { levels: 9,  cellsPerLevel: 32, centerRings: largeHole ? 4 : 2 },
            hard:   { levels: 12, cellsPerLevel: 40, centerRings: largeHole ? 5 : 3 }
        };

        const settings = DIFFICULTY_LEVELS[difficulty];
        const numLevels = settings.levels;
        const cellsPerLevel = settings.cellsPerLevel;
        const centerRings = settings.centerRings;

        let grid = [];
        for (let i = 0; i < numLevels; i++) {
            grid.push(Array(cellsPerLevel).fill(null).map(() => ({
                visited: false,
                walls: { top: true, right: true }
            })));
        }
        currentGrid = { type: 'polar', grid, numLevels, cellsPerLevel, centerRings };

        const stack = [];
        const startLevel = numLevels - 1;
        const startCellIdx = Math.floor(Math.random() * cellsPerLevel);
        
        startCell = {level: startLevel, cell: startCellIdx};
        stack.push(startCell);
        grid[startLevel][startCellIdx].visited = true;

        const getNeighbors = (level, cell) => {
            const neighbors = [];
            if (level > 0 && !grid[level - 1][cell].visited) neighbors.push({level: level - 1, cell});
            if (level < numLevels - 1 && !grid[level + 1][cell].visited) neighbors.push({level: level + 1, cell});
            const cwCell = (cell + 1) % cellsPerLevel;
            if (!grid[level][cwCell].visited) neighbors.push({level, cell: cwCell});
            const ccwCell = (cell - 1 + cellsPerLevel) % cellsPerLevel;
            if (!grid[level][ccwCell].visited) neighbors.push({level, cell: ccwCell});
            return neighbors;
        };
        
        const removeWall = (c1, c2) => {
            if (c1.level === c2.level) {
                if ((c1.cell < c2.cell && !(c1.cell === 0 && c2.cell === cellsPerLevel - 1)) || (c1.cell === cellsPerLevel - 1 && c2.cell === 0)) {
                    grid[c1.level][c1.cell].walls.right = false;
                } else {
                    grid[c2.level][c2.cell].walls.right = false;
                }
            } else {
                const outerLevelCell = c1.level > c2.level ? c1 : c2;
                grid[outerLevelCell.level][outerLevelCell.cell].walls.top = false;
            }
        };

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = getNeighbors(current.level, current.cell);

            if (neighbors.length > 0) {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                removeWall(current, next);
                grid[next.level][next.cell].visited = true;
                stack.push(next);
            } else {
                stack.pop();
            }
        }
        
        const exitCellIndex = Math.floor(Math.random() * cellsPerLevel);
        grid[0][exitCellIndex].walls.top = false;
        endCell = {level: 0, cell: exitCellIndex};
        
        drawAll();
    }

    function drawPolarMaze() {
        if (!currentGrid.grid) return;
        const { grid, numLevels, cellsPerLevel, centerRings } = currentGrid;
        
        const levelHeight = (CANVAS_SIZE/2 - MAZE_PADDING) / (numLevels + centerRings);
        const centerRadius = centerRings * levelHeight;

        ctx.strokeStyle = MAZE_COLOR;
        ctx.lineWidth = wallThickness;
        ctx.lineCap = 'round';

        for (let i = 0; i < numLevels; i++) {
            const innerRadius = centerRadius + i * levelHeight;
            const outerRadius = centerRadius + (i + 1) * levelHeight;
            const angleStep = 2 * Math.PI / cellsPerLevel;

            for (let j = 0; j < cellsPerLevel; j++) {
                if (grid[i][j].walls.top) {
                    ctx.beginPath();
                    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, innerRadius, j * angleStep, (j + 1) * angleStep);
                    ctx.stroke();
                }
                if (grid[i][j].walls.right) {
                    const angle = (j + 1) * angleStep;
                    ctx.beginPath();
                    ctx.moveTo(CANVAS_SIZE / 2 + innerRadius * Math.cos(angle), CANVAS_SIZE / 2 + innerRadius * Math.sin(angle));
                    ctx.lineTo(CANVAS_SIZE / 2 + outerRadius * Math.cos(angle), CANVAS_SIZE / 2 + outerRadius * Math.sin(angle));
                    ctx.stroke();
                }
            }
        }

        const outermostRadius = centerRadius + numLevels * levelHeight;
        const entranceAngleStart = startCell.cell * (2 * Math.PI / cellsPerLevel);
        const entranceAngleEnd = (startCell.cell + 1) * (2 * Math.PI / cellsPerLevel);
        
        ctx.beginPath();
        ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, outermostRadius, entranceAngleEnd, entranceAngleStart + 2 * Math.PI);
        ctx.stroke();
    }


    // --- SOLUTION LOGIC & HELPERS ---
    
    function solveAndShowSolution() {
        solveMaze();
        drawSolution();
        scheduleWorksheetPreview();
        solveBtn.classList.add('hidden');
        hideBtn.classList.remove('hidden');
    }

    function hideSolution() {
        solutionPath = [];
        drawAll();
        scheduleWorksheetPreview();
        hideBtn.classList.add('hidden');
        solveBtn.classList.remove('hidden');
    }

    function solveMaze() {
        if (!startCell || !endCell) return;
        
        let queue;
        let visited;
        
        // Setup initial state based on maze type
        if (currentGrid.type === 'polar') {
            queue = [{ cell: startCell, path: [startCell] }];
            visited = new Set([`${startCell.level}-${startCell.cell}`]);
        } else {
            queue = [{ cell: startCell, path: [startCell] }];
            visited = new Set([startCell]);
        }
       
        while (queue.length > 0) {
            let { cell, path } = queue.shift();

            // Check for goal based on maze type
            let isAtEnd = false;
            if (currentGrid.type === 'polar') {
                if (cell.level === endCell.level && cell.cell === endCell.cell) isAtEnd = true;
            } else {
                if (cell === endCell) isAtEnd = true;
            }

            if (isAtEnd) {
                solutionPath = path;
                return;
            }
            
            // Get neighbors based on maze type
            let neighbors = [];
            if (currentGrid.type === 'polar') {
                const grid = currentGrid.grid;
                // Clockwise
                const cwCellIdx = (cell.cell + 1) % currentGrid.cellsPerLevel;
                if (!grid[cell.level][cell.cell].walls.right) neighbors.push({level: cell.level, cell: cwCellIdx});
                // Counter-clockwise
                const ccwCellIdx = (cell.cell - 1 + currentGrid.cellsPerLevel) % currentGrid.cellsPerLevel;
                if (!grid[cell.level][ccwCellIdx].walls.right) neighbors.push({level: cell.level, cell: ccwCellIdx});
                // Outward
                if (cell.level < currentGrid.numLevels - 1 && !grid[cell.level + 1][cell.cell].walls.top) neighbors.push({level: cell.level + 1, cell: cell.cell});
                // Inward
                if (cell.level > 0 && !grid[cell.level][cell.cell].walls.top) neighbors.push({level: cell.level - 1, cell: cell.cell});
            } else {
                const {x, y} = cell;
                if (!cell.walls.top && y > 0 && currentGrid[y - 1]?.[x]) neighbors.push(currentGrid[y - 1][x]);
                if (!cell.walls.right && x < currentGrid[0].length - 1 && currentGrid[y]?.[x + 1]) neighbors.push(currentGrid[y][x + 1]);
                if (!cell.walls.bottom && y < currentGrid.length - 1 && currentGrid[y + 1]?.[x]) neighbors.push(currentGrid[y + 1][x]);
                if (!cell.walls.left && x > 0 && currentGrid[y]?.[x - 1]) neighbors.push(currentGrid[y][x - 1]);
            }

            for (let neighbor of neighbors) {
                const neighborId = currentGrid.type === 'polar' ? `${neighbor.level}-${neighbor.cell}` : neighbor;

                if (!visited.has(neighborId)) {
                    visited.add(neighborId);
                    let newPath = [...path, neighbor];
                    queue.push({ cell: neighbor, path: newPath });
                }
            }
        }
    }

    function drawSolution() {
        if (solutionPath.length < 2) return;

        ctx.strokeStyle = SOLUTION_COLOR;
        ctx.lineWidth = wallThickness * 1.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        
        if(currentGrid.type === 'polar') {
            const { numLevels, cellsPerLevel, centerRings } = currentGrid;
            const levelHeight = (CANVAS_SIZE/2 - MAZE_PADDING) / (numLevels + centerRings);
            const centerRadius = centerRings * levelHeight;

            solutionPath.forEach((cell, i) => {
                const angleStep = 2 * Math.PI / cellsPerLevel;
                const radius = centerRadius + (cell.level + 0.5) * levelHeight;
                const angle = (cell.cell + 0.5) * angleStep;
                const x = CANVAS_SIZE / 2 + radius * Math.cos(angle);
                const y = CANVAS_SIZE / 2 + radius * Math.sin(angle);
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
    
            // Extend line to the center for the exit
            if (solutionPath[solutionPath.length - 1].level === 0) {
                 ctx.lineTo(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
            }

        } else {
            const gridSize = currentGrid.length;
            const availableSize = CANVAS_SIZE - 2 * MAZE_PADDING;
            const cellSize = availableSize / gridSize;
            const getCenter = (cell) => ({ 
                x: MAZE_PADDING + (cell.x + 0.5) * cellSize, 
                y: MAZE_PADDING + (cell.y + 0.5) * cellSize 
            });

            let firstPoint = getCenter(solutionPath[0]);
            ctx.moveTo(firstPoint.x, firstPoint.y);

            for (let i = 1; i < solutionPath.length; i++) {
                let nextPoint = getCenter(solutionPath[i]);
                ctx.lineTo(nextPoint.x, nextPoint.y);
            }
        }
        ctx.stroke();
    }
    
    function handleEraser(event) {
        if (currentShape !== 'worksheet' || !currentGrid.length || !Array.isArray(currentGrid)) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left - MAZE_PADDING;
        const mouseY = event.clientY - rect.top - MAZE_PADDING;

        const gridSize = currentGrid.length;
        const availableSize = CANVAS_SIZE - 2 * MAZE_PADDING;
        const cellSize = availableSize / gridSize;
        
        const x = Math.floor(mouseX / cellSize);
        const y = Math.floor(mouseY / cellSize);

        if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;
        
        if(currentGrid[y][x] === startCell && x === startCell.x && y === startCell.y) return;
        if(currentGrid[y][x] === endCell && x === endCell.x && y === endCell.y) return;

        const dx = mouseX - x * cellSize;
        const dy = mouseY - y * cellSize;
        const tolerance = wallThickness * 3;
        const cell = currentGrid[y][x];
        const dists = { 
            top: dy, 
            right: cellSize - dx, 
            bottom: cellSize - dy, 
            left: dx 
        };
        const closestWall = Object.keys(dists).reduce((a, b) => dists[a] < dists[b] ? a : b);
        
        if (dists[closestWall] > tolerance) return;

        if (closestWall === 'top' && y > 0) { cell.walls.top = false; currentGrid[y - 1][x].walls.bottom = false; }
        else if (closestWall === 'right' && x < gridSize - 1) { cell.walls.right = false; currentGrid[y][x + 1].walls.left = false; }
        else if (closestWall === 'bottom' && y < gridSize - 1) { cell.walls.bottom = false; currentGrid[y + 1][x].walls.top = false; }
        else if (closestWall === 'left' && x > 0) { cell.walls.left = false; currentGrid[y][x - 1].walls.right = false; }
        
        drawAll();
        scheduleWorksheetPreview();
    }

    async function downloadPDF() {
        const count = Number(document.getElementById('mazesPerPage').value || 1);
        const mazes = mazeSlotSnapshots.slice(0, count);
        if (mazes.some(snapshot => !snapshot)) {
            instructieText.textContent = 'Stel eerst elk gekozen doolhof in.';
            return;
        }
        const themes = mazes.map(maze => themeConfig[maze.theme]);
        await Promise.all(themes.flatMap(theme => theme.start && theme.end
            ? [waitForThemeImage(themeImages[theme.start]), waitForThemeImage(themeImages[theme.end])]
            : []));

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        doc.text('Naam: _______________________________', 15, 15);
        doc.text('Datum: ________________', 137, 15);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.4);
        doc.line(15, 22, 195, 22);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(26, 58, 92);
        doc.text('Doolhof', 105, 32, { align: 'center' });
        doc.setDrawColor(74, 144, 217);
        doc.setLineWidth(1);
        doc.line(15, 39, 195, 39);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(102, 121, 141);
        const sameTheme = mazes.every(maze => maze.theme === mazes[0].theme);
        doc.text(sameTheme ? themes[0].instruction : 'Vind bij elk doolhof de weg van de ingang naar de uitgang.', 105, 45, { align: 'center' });
        const customSolo = count === 1 && mazes[0].shape === 'custom' && mazes[0].theme === 'none';
        const layouts = count === 1
            ? [customSolo ? { x: 20, y: 48, size: 170 } : { x: 30, y: 49, size: 150 }]
            : count === 2
                ? [{ x: 20, y: 58, size: 72 }, { x: 118, y: 58, size: 72 }]
                : [
                    { x: 20, y: 50, size: 68 }, { x: 122, y: 50, size: 68 },
                    { x: 20, y: 160, size: 68 }, { x: 122, y: 160, size: 68 }
                ];

        mazes.forEach((maze, index) => {
            const layout = layouts[index];
            doc.addImage(maze.image, 'PNG', layout.x, layout.y, layout.size, layout.size);
            const theme = themes[index];
            if (theme.start && theme.end) {
                addThemeMarker(doc, themeImages[theme.start], nudgeMarker(maze.markers.start, theme.startNudge), layout, count === 1 ? 28 : 17);
                const centerExit = maze.shape === 'polar_circle';
                addThemeMarker(
                    doc,
                    themeImages[theme.end],
                    centerExit ? { x: .5, y: .5, dx: 0, dy: 0 } : nudgeMarker(maze.markers.end, theme.endNudge),
                    layout,
                    centerExit ? (count === 1 ? 8 : 4.5) : (count === 1 ? 30 : 18)
                );
            }
        });
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 160);
        doc.text("juf Zisa's werkbladgenerator — www.jufzisa.be", 105, 292, { align: 'center' });
        doc.save('doolhof-werkblad.pdf');
    }

    function getMarkerPositions() {
        if (currentGrid.type === 'polar') {
            const { numLevels, cellsPerLevel, centerRings } = currentGrid;
            const levelHeight = (CANVAS_SIZE / 2 - MAZE_PADDING) / (numLevels + centerRings);
            const point = (cell, isStart) => {
                const outerRadius = centerRings * levelHeight + numLevels * levelHeight;
                const radius = isStart ? outerRadius : centerRings * levelHeight;
                const angle = (cell.cell + .5) * (Math.PI * 2 / cellsPerLevel);
                const direction = isStart ? 1 : -1;
                return {
                    x: (CANVAS_SIZE / 2 + radius * Math.cos(angle)) / CANVAS_SIZE,
                    y: (CANVAS_SIZE / 2 + radius * Math.sin(angle)) / CANVAS_SIZE,
                    dx: Math.cos(angle) * direction,
                    dy: Math.sin(angle) * direction
                };
            };
            return { start: point(startCell, true), end: point(endCell, false) };
        }
        const smoothType = currentShape === 'masked_circle'
            ? 'circle'
            : (['heart', 'star', 'custom'].includes(currentShape) ? currentShape : null);
        if (smoothType) {
            const smoothPath = createSmoothShapePath(smoothType);
            return {
                start: getSmoothBoundaryOpening(startCell, smoothPath),
                end: getSmoothBoundaryOpening(endCell, smoothPath)
            };
        }
        const gridSize = currentGrid.length;
        const availableSize = CANVAS_SIZE - 2 * MAZE_PADDING;
        const cellSize = availableSize / gridSize;
        const activeSet = new Set(activeCells.length ? activeCells : currentGrid.flat());
        const point = cell => {
            const sides = [
                { wall: 'top', neighbor: currentGrid[cell.y - 1]?.[cell.x], x: cell.x + .5, y: cell.y, dx: 0, dy: -1 },
                { wall: 'right', neighbor: currentGrid[cell.y]?.[cell.x + 1], x: cell.x + 1, y: cell.y + .5, dx: 1, dy: 0 },
                { wall: 'bottom', neighbor: currentGrid[cell.y + 1]?.[cell.x], x: cell.x + .5, y: cell.y + 1, dx: 0, dy: 1 },
                { wall: 'left', neighbor: currentGrid[cell.y]?.[cell.x - 1], x: cell.x, y: cell.y + .5, dx: -1, dy: 0 }
            ];
            const opening = sides.find(side => !cell.walls[side.wall] && !activeSet.has(side.neighbor))
                || sides.find(side => !activeSet.has(side.neighbor))
                || sides[0];
            return {
                x: (MAZE_PADDING + opening.x * cellSize) / CANVAS_SIZE,
                y: (MAZE_PADDING + opening.y * cellSize) / CANVAS_SIZE,
                dx: opening.dx,
                dy: opening.dy
            };
        };
        return { start: point(startCell), end: point(endCell) };
    }

    function getSmoothBoundaryOpening(cell, smoothPath) {
        const gridSize = currentGrid.length;
        const availableSize = CANVAS_SIZE - 2 * MAZE_PADDING;
        const cellSize = availableSize / gridSize;
        const centerX = CANVAS_SIZE / 2;
        const centerY = CANVAS_SIZE / 2;
        const targetX = MAZE_PADDING + (cell.x + .5) * cellSize;
        const targetY = MAZE_PADDING + (cell.y + .5) * cellSize;
        const vectorX = targetX - centerX;
        const vectorY = targetY - centerY;
        const length = Math.hypot(vectorX, vectorY) || 1;
        const dx = vectorX / length;
        const dy = vectorY / length;
        let lastInside = { x: targetX, y: targetY };
        for (let distance = 0; distance <= availableSize; distance += 1.5) {
            const x = targetX + dx * distance;
            const y = targetY + dy * distance;
            if (!ctx.isPointInPath(smoothPath, x, y)) break;
            lastInside = { x, y };
        }
        return { x: lastInside.x / CANVAS_SIZE, y: lastInside.y / CANVAS_SIZE, dx, dy };
    }

    function addThemeMarker(doc, image, point, layout, markerSize) {
        if (!image?.complete || !image.naturalWidth) return;
        const ratio = image.naturalWidth / image.naturalHeight;
        const width = ratio >= 1 ? markerSize : markerSize * ratio;
        const height = ratio >= 1 ? markerSize / ratio : markerSize;
        const gap = 3;
        const centerX = layout.x + point.x * layout.size + (point.dx || 0) * (width / 2 + gap);
        const centerY = layout.y + point.y * layout.size + (point.dy || 0) * (height / 2 + gap);
        doc.addImage(image, 'PNG', centerX - width / 2, centerY - height / 2, width, height);
    }
    
    function downloadPNG() {
        const link = document.createElement('a');
        link.download = 'doolhof.png';
        link.href = canvas.toDataURL("image/png");
        link.click();
    }

    initialize();
});

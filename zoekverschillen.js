document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTEN KOPPELEN ---
    const uploadBtn = document.getElementById('uploadImageBtn');
    const fileInput = document.getElementById('fileInput');
    const downloadPngBtn = document.getElementById('downloadPngBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const undoBtn = document.getElementById('undoBtn');
    const opnieuwBtn = document.getElementById('opnieuwBtn');
    const worksheetTitle = document.getElementById('worksheetTitle');
    const worksheetInstruction = document.getElementById('worksheetInstruction');
    const openCatalogBtn = document.getElementById('openCatalogBtn');
    const catalogOverlay = document.getElementById('catalog-modal-overlay');
    const closeCatalogBtn = document.getElementById('closeCatalogBtn');
    const catalogThemes = document.getElementById('catalogThemes');
    const catalogImages = document.getElementById('catalogImages');
    const openHelpBtn = document.getElementById('openHelpBtn');
    const helpOverlay = document.getElementById('help-modal-overlay');
    const closeHelpBtn = document.getElementById('closeHelpBtn');
    const helpDoneBtn = document.getElementById('helpDoneBtn');
    const toolExplanation = document.getElementById('toolExplanation');
    const differenceCount = document.getElementById('differenceCount');
    const textSettings = document.getElementById('text-settings');
    const textOriginal = document.getElementById('textOriginal');
    const textDifferent = document.getElementById('textDifferent');
    const textSize = document.getElementById('textSize');
    const autoDifferencesPanel = document.getElementById('autoDifferencesPanel');
    const makeAutoDifferencesBtn = document.getElementById('makeAutoDifferencesBtn');
    const differenceSummary = document.getElementById('differenceSummary');
    const differenceSummaryList = document.getElementById('differenceSummaryList');
    const solutionActions = document.getElementById('solutionActions');
    const toggleSolutionBtn = document.getElementById('toggleSolutionBtn');
    const downloadSolutionPdfBtn = document.getElementById('downloadSolutionPdfBtn');

    const canvasOrigineel = document.getElementById('canvasOrigineel');
    const ctxOrigineel = canvasOrigineel.getContext('2d', { willReadFrequently: true });
    const canvasVerschillen = document.getElementById('canvasVerschillen');
    const ctxVerschillen = canvasVerschillen.getContext('2d', { willReadFrequently: true });
    const solutionOverlayCanvas = document.getElementById('solutionOverlayCanvas');
    const solutionOverlayCtx = solutionOverlayCanvas.getContext('2d');

    const statusText = document.getElementById('status-text');

    // Tools
    const toolButtons = document.querySelectorAll('.tool-btn');
    const toolIcons = {
        potlood:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.2-1 11-11a2.1 2.1 0 0 0-3-3l-11 11L4 20Z"/><path d="m14.8 6.4 3 3M5.2 16l2.8 2.8"/></svg>',
        gum:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4.5 15.5 8.8-10a2 2 0 0 1 2.9-.1l2.4 2.2a2 2 0 0 1 .1 2.9L10.4 20H6.8l-2.3-2.1a1.7 1.7 0 0 1 0-2.4Z"/><path d="m10 9.2 6.4 5.7M10.4 20H20"/></svg>',
        select:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="13" height="13" rx="1" stroke-dasharray="2.5 2.5"/><path d="m13 12 7.5 3-3.2 1.4-1.4 3.2L13 12Z"/></svg>',
        lijn:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="5" r="2"/></svg>',
        cirkel:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/></svg>',
        rechthoek:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="1.5"/></svg>',
        pipet:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5.5 4 4M8 16l8.8-8.8a2.1 2.1 0 1 0-3-3L4.7 13.3 4 18l4.7-.7Z"/><path d="M4 20h6"/></svg>',
        opvulemmer:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 7-7 7 7-7 7-7-7Z"/><path d="m8.5 8.5 7 7M19.5 15.5s2 2.3 2 3.5a2 2 0 0 1-4 0c0-1.2 2-3.5 2-3.5Z"/></svg>',
        tekst:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14M12 5v14M8.5 19h7"/></svg>'
    };
    const selectionToolsDiv = document.getElementById('selection-tools');
    const dikteInput = document.getElementById('dikte');
    const gumvormSelect = document.getElementById('gumvorm');
    const gumSettingsDiv = document.getElementById('gum-settings');
    const colorDisplay = document.getElementById('color-display');

    // Modal
    const editModalOverlay = document.getElementById('edit-modal-overlay');
    const editCanvas = document.getElementById('editCanvas');
    const ctxEdit = editCanvas.getContext('2d', { willReadFrequently: true });
    const saveEditBtn = document.getElementById('saveEditBtn');
    const editFlipHorizontalBtn = document.getElementById('editFlipHorizontalBtn');
    const editFlipVerticalBtn = document.getElementById('editFlipVerticalBtn');
    const editUndoBtn = document.getElementById('editUndoBtn');
    const transparentBgCheckbox = document.getElementById('transparentBgCheckbox');

    // Clipboard
    const clipboardPreviewContainer = document.getElementById('clipboard-preview-container');
    const clipboardCanvas = document.getElementById('clipboardCanvas');
    const ctxClipboard = clipboardCanvas.getContext('2d');
    // NIEUW: Koppel de plakken knop
    const plakkenBtn = document.getElementById('plakkenBtn');


    // --- STATE VARIABELEN ---
    let originalImage = null;
    let currentTool = 'potlood';
    let isDrawing = false;
    let startX, startY;
    let currentColor = '#000000';

    let selectionRect = null;
    let undoStack = [];
    let editUndoStack = [];
    const MAX_UNDO_STATES = 20;

    let transformableObject = null;
    // NIEUW: Apart object voor het klembord
    let clipboardObject = null; 
    let isPlacingNewObject = false;
    let currentCatalogSelection = null;
    let currentAutoDifferenceCount = 0;
    
    let transformAction = 'none'; 
    let dragStart = { x: 0, y: 0 };


    // --- INIT ---
    updateColorDisplay();


    // --- EVENT LISTENERS ---
    uploadBtn.addEventListener('click', () => fileInput.click());
    opnieuwBtn.addEventListener('click', resetApplication);
    fileInput.addEventListener('change', handleImageUpload);
    openCatalogBtn.addEventListener('click', () => catalogOverlay.classList.remove('hidden'));
    closeCatalogBtn.addEventListener('click', () => catalogOverlay.classList.add('hidden'));
    openHelpBtn.addEventListener('click', () => helpOverlay.classList.remove('hidden'));
    [closeHelpBtn, helpDoneBtn].forEach(btn => btn.addEventListener('click', () => helpOverlay.classList.add('hidden')));
    [catalogOverlay, helpOverlay].forEach(overlay => overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.add('hidden'); }));
    differenceCount.addEventListener('change', () => {
        worksheetInstruction.value = `Zoek de ${differenceCount.value} verschillen.`;
        makeAutoDifferencesBtn.textContent = `Maak automatisch ${differenceCount.value} verschillen`;
        differenceSummary.hidden = true;
        solutionActions.classList.add('hidden'); hideSolution();
    });
    makeAutoDifferencesBtn.addEventListener('click', applyAutomaticDifferences);
    toggleSolutionBtn.addEventListener('click', toggleSolution);
    downloadSolutionPdfBtn.addEventListener('click', () => downloadPuzzel('pdf', true));
    downloadPngBtn.addEventListener('click', () => downloadPuzzel('png'));
    downloadPdfBtn.addEventListener('click', () => downloadPuzzel('pdf'));
    undoBtn.addEventListener('click', doUndo);

    toolButtons.forEach(btn => {
        btn.setAttribute('aria-label', btn.title || btn.dataset.tool);
        btn.innerHTML = toolIcons[btn.dataset.tool] || btn.innerHTML;
        btn.dataset.label = ({potlood:'Potlood',gum:'Gum',select:'Selecteren',lijn:'Lijn',cirkel:'Cirkel',rechthoek:'Rechthoek',pipet:'Kleur',opvulemmer:'Opvullen',tekst:'Tekst'})[btn.dataset.tool] || btn.title;
        btn.addEventListener('click', () => {
            stampTransformableObject();
            document.querySelector('.tool-btn.active')?.classList.remove('active');
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
            showToolExplanation(currentTool);
            gumSettingsDiv.style.display = (currentTool === 'gum') ? 'flex' : 'none';
            textSettings.style.display = (currentTool === 'tekst') ? 'grid' : 'none';
            canvasVerschillen.style.cursor = getCursorForTool(currentTool);
        });
    });

    // AANGEPAST: De 'save' knop in de modal slaat nu op naar het klembord.
    saveEditBtn.addEventListener('click', saveSelectionToClipboard);
    editUndoBtn.addEventListener('click', doEditUndo);
    editFlipHorizontalBtn.addEventListener('click', () => { transformEditCanvas(-1, 1); saveEditState(); });
    editFlipVerticalBtn.addEventListener('click', () => { transformEditCanvas(1, -1); saveEditState(); });

    editCanvas.addEventListener('mousedown', () => isDrawing = true);
    editCanvas.addEventListener('mouseup', () => { if(isDrawing) { saveEditState(); isDrawing = false; } });
    editCanvas.addEventListener('mouseleave', () => { if(isDrawing) { saveEditState(); isDrawing = false; } });
    editCanvas.addEventListener('mousemove', (e) => { if (e.buttons === 1) eraseOnEditCanvas(e); });

    canvasVerschillen.addEventListener('mousedown', startAction);
    canvasVerschillen.addEventListener('mousemove', moveAction);
    canvasVerschillen.addEventListener('mouseup', endAction);
    canvasVerschillen.addEventListener('mouseleave', (e) => {
        if (isDrawing || transformAction !== 'none' || isPlacingNewObject) {
            endAction(e);
        }
    });

    canvasVerschillen.addEventListener('mousemove', handleCursorUpdate);
    
    // NIEUW: Event listener voor de plakken knop
    plakkenBtn.addEventListener('click', pasteFromClipboard);


    // --- FUNCTIES ---

    const catalog = [
        ['naar-school','Naar school',['klas-met-kinderen','speelplaats']], ['herfst','Herfst',['boswandeling','dieren-in-het-bos']],
        ['sinterklaas','Sinterklaas',['pakjesavond','stoomboot']], ['kerst','Kerst',['kerstkamer','wintermarkt']],
        ['pasen','Pasen',['paaseieren-zoeken','paastuin']], ['lente','Lente',['lentetuin','boerderij-in-de-lente']],
        ['carnaval','Carnaval',['carnavalsstoet','verkleedfeest']], ['winter','Winter',['sneeuwpret','winterdorp']],
        ['zomer','Zomer',['stranddag','kamperen']], ['valentijn','Valentijn',['vriendschapsfeest','hartjestuin']],
        ['dieren','Dieren',['dierenpark','boerderijdieren']], ['voertuigen','Voertuigen',['drukke-straat','bouwwerf']],
        ['prehistorie','Prehistorie',['prehistorisch-kamp','grotschilderingen']], ['oudheid','Oudheid',['romeinse-markt','egyptische-nijl']],
        ['middeleeuwen','Middeleeuwen',['kasteelleven','middeleeuwse-markt']], ['vroegmoderne-tijd','Vroegmoderne tijd',['ontdekkingsreis','drukkerij']],
        ['moderne-tijd','Moderne tijd',['stoomtreinstation','oude-fabriek']], ['hedendaagse-tijd','Hedendaagse tijd',['moderne-stad','duurzame-buurt']],
        ['ruimte','Ruimte',['ruimtestation','maanverkenning']]
    ];
    const toolInfo = {
        potlood:{name:'Potlood',text:'Teken vrij op de rechterafbeelding.'}, gum:{name:'Gum',text:'Wis een deel van de rechterafbeelding.'},
        select:{name:'Selecteren',text:'Sleep een kader rond een onderdeel dat je wilt kopiëren of verplaatsen.'}, lijn:{name:'Lijn',text:'Trek een rechte lijn in de rechterafbeelding.'},
        cirkel:{name:'Cirkel',text:'Sleep om een cirkel of ovaal te tekenen.'}, rechthoek:{name:'Rechthoek',text:'Sleep om een rechthoek te tekenen.'},
        pipet:{name:'Kleur kiezen',text:'Klik in de afbeelding om exact die kleur over te nemen.'}, opvulemmer:{name:'Opvullen',text:'Klik in een vlak om het met de gekozen kleur te vullen.'},
        tekst:{name:'Tekst',text:'Vul tekst voor links en rechts in en klik daarna op de gewenste plaats.'}
    };

    function initialiseGuidance() {
        renderCatalog(catalog[0][0]);
        showToolExplanation(currentTool);
    }

    function showToolExplanation(tool) {
        const info = toolInfo[tool];
        if (info) toolExplanation.innerHTML = `<strong>${info.name}</strong><span>${info.text}</span>`;
    }

    const automaticThemes = new Set(['naar-school','herfst']);
    function renderCatalog(activeSlug) {
        catalogThemes.innerHTML = catalog.map(([slug,label]) => `<button class="catalog-theme ${slug===activeSlug?'active':''}" data-theme="${slug}">${label}</button>`).join('');
        const [,label,images] = catalog.find(item => item[0] === activeSlug);
        const automaticAvailable = automaticThemes.has(activeSlug);
        const automaticStatus = automaticAvailable ? '<em class="catalog-status available">Automatisch beschikbaar</em>' : '<em class="catalog-status pending">Zelf bewerken · automatisch binnenkort</em>';
        catalogImages.innerHTML = images.map((name,index) => `<button class="catalog-image" data-theme="${activeSlug}" data-name="${name}" data-src="zoekverschillen_catalogus/${activeSlug}/${name}.png"><img src="zoekverschillen_catalogus/${activeSlug}/${name}.png" alt="Voorbeeld ${index+1}: ${label}" loading="lazy"><span>${label} – kleurplaat ${index+1}</span>${automaticStatus}</button>`).join('');
        catalogThemes.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => renderCatalog(btn.dataset.theme)));
        catalogImages.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
            currentCatalogSelection = { theme:btn.dataset.theme, name:btn.dataset.name, src:btn.dataset.src };
            loadImageSource(btn.dataset.src, 'Kleurplaat geladen. Maak nu verschillen in de rechterafbeelding.');
            autoDifferencesPanel.classList.toggle('hidden', !automaticThemes.has(btn.dataset.theme));
            solutionActions.classList.add('hidden'); hideSolution();
            differenceSummary.hidden = true;
            catalogOverlay.classList.add('hidden');
        }));
    }
    initialiseGuidance();

    const automaticDifferenceDescriptions = {
        'klas-met-kinderen':['Op het bord staat ABC.','De klok wijst een ander uur aan.','De juf draagt een bril.','Op de wereldbol ontbreekt een werelddeel.','In de potloodbeker zit nog maar één potlood.','De plant op de tafel heeft minder bladeren.','De linker boekentas heeft een ster.','De rechter boekentas heeft een ronde knop.','Uit het boek steekt een boekenlegger.','De wolk aan het raam is een zon geworden.'],
        'speelplaats':['De bal heeft minder strepen.','De ruit op de linker boekentas is een cirkel geworden.','De ster op de rechter boekentas is een hart geworden.','In het ronde schoolraam ontbreekt een lijn.','De bank heeft minder poten.','In het hinkelspel staat het getal 5.','De bloem linksonder heeft minder bloemblaadjes.','Onder een wolk hangt een regendruppel.','Eén deurknop van de school is verdwenen.','Het meisje met het springtouw draagt een strik.'],
        'dieren-in-het-bos':['Het konijn heeft één slap oor.','De eekhoorn houdt twee eikels vast.','De uil knipoogt.','Het hert heeft minder vlekken.','De vos heeft een streep op zijn staart.','Een paddenstoel is verdwenen.','Er ligt een dennenappel bij de boomstam.','De boomstam heeft een extra knoest.','De egel draagt een appel.','Het boomhol heeft een andere vorm.'],
        'boswandeling':['De eekhoorn houdt twee eikels vast.','De kleinste paddenstoel is verdwenen.','De egel draagt een appel.','De pompon van de muts heeft een andere vorm.','In de mand liggen minder kastanjes.','De laars heeft een extra streep.','Een kastanjebolster is verdwenen.','De grote paddenstoel heeft minder stippen.','Er zit een vogel in de boom.','Een dwarrelend blad is een dennenappel geworden.']
    };
    const automaticDifferencePoints = {
        'klas-met-kinderen':[[.54,.22,.11],[.277,.16,.06],[.797,.235,.06],[.925,.282,.06],[.425,.675,.05],[.33,.47,.05],[.126,.90,.045],[.758,.92,.045],[.412,.525,.04],[.132,.188,.055]],
        'speelplaats':[[.203,.515,.055],[.785,.75,.05],[.886,.79,.05],[.506,.188,.045],[.69,.48,.07],[.596,.763,.055],[.073,.895,.04],[.328,.14,.035],[.50,.335,.04],[.804,.285,.04]],
        'dieren-in-het-bos':[[.58,.73,.075],[.78,.62,.07],[.76,.15,.065],[.58,.42,.09],[.10,.52,.08],[.39,.59,.06],[.70,.91,.06],[.72,.865,.055],[.12,.82,.065],[.12,.20,.075]],
        'boswandeling':[[.14,.48,.065],[.16,.87,.06],[.84,.80,.065],[.30,.30,.06],[.75,.59,.08],[.70,.70,.055],[.50,.87,.06],[.87,.63,.065],[.53,.18,.06],[.40,.18,.055]]
    };

    function applyAutomaticDifferences() {
        if (!currentCatalogSelection || !automaticThemes.has(currentCatalogSelection.theme)) return;
        const count = Number(differenceCount.value);
        currentAutoDifferenceCount = count;
        const variantSrc = currentCatalogSelection.src.replace('.png', `-verschillen-${count}.png`);
        loadImagePair(currentCatalogSelection.src, variantSrc, `${count} automatische verschillen geladen.`);
        differenceSummaryList.innerHTML = automaticDifferenceDescriptions[currentCatalogSelection.name].slice(0,count).map(text => `<li>${text}</li>`).join('');
        differenceSummary.hidden = false;
        differenceSummary.open = false;
        solutionActions.classList.remove('hidden'); hideSolution();
    }
    function drawSolutionCircles(ctx) { const points=automaticDifferencePoints[currentCatalogSelection?.name]||[]; ctx.save(); ctx.strokeStyle='#d62828'; ctx.lineWidth=Math.max(3,canvasVerschillen.width*.009); ctx.setLineDash([9,5]); points.slice(0,currentAutoDifferenceCount).forEach(([x,y,r])=>{ctx.beginPath();ctx.arc(x*canvasVerschillen.width,y*canvasVerschillen.height,r*canvasVerschillen.width,0,Math.PI*2);ctx.stroke();}); ctx.restore(); }
    function hideSolution(){solutionOverlayCanvas.classList.remove('visible');toggleSolutionBtn.classList.remove('solution-visible');toggleSolutionBtn.textContent='Bekijk oplossing';}
    function toggleSolution(){if(solutionOverlayCanvas.classList.contains('visible')){hideSolution();return;}solutionOverlayCanvas.width=canvasVerschillen.width;solutionOverlayCanvas.height=canvasVerschillen.height;solutionOverlayCtx.clearRect(0,0,solutionOverlayCanvas.width,solutionOverlayCanvas.height);drawSolutionCircles(solutionOverlayCtx);solutionOverlayCanvas.classList.add('visible');toggleSolutionBtn.classList.add('solution-visible');toggleSolutionBtn.textContent='Verberg oplossing';}
    function createSolutionCanvas(){const canvas=document.createElement('canvas');canvas.width=canvasVerschillen.width;canvas.height=canvasVerschillen.height;const ctx=canvas.getContext('2d');ctx.drawImage(canvasVerschillen,0,0);drawSolutionCircles(ctx);return canvas;}

    function updateColorDisplay() {
        colorDisplay.style.backgroundColor = currentColor;
    }
    
    function componentToHex(c) {
        const hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    function resetApplication() {
        ctxOrigineel.clearRect(0, 0, canvasOrigineel.width, canvasOrigineel.height);
        ctxVerschillen.clearRect(0, 0, canvasVerschillen.width, canvasVerschillen.height);
        originalImage = null; undoStack = []; selectionRect = null;
        isDrawing = false; transformableObject = null; clipboardObject = null;
        isPlacingNewObject = false; transformAction = 'none';
        currentColor = '#000000'; updateColorDisplay();
        statusText.textContent = 'Upload een afbeelding om te beginnen.';
        undoBtn.disabled = true; downloadPngBtn.disabled = true; downloadPdfBtn.disabled = true;
        selectionToolsDiv.style.display = 'none';
        plakkenBtn.disabled = true;
        clipboardPreviewContainer.classList.add('hidden');
        fileInput.value = '';
        currentCatalogSelection = null;
        autoDifferencesPanel.classList.add('hidden');
        solutionActions.classList.add('hidden'); hideSolution();
    }

    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        currentCatalogSelection = null;
        autoDifferencesPanel.classList.add('hidden');
        solutionActions.classList.add('hidden'); hideSolution();
        const reader = new FileReader();
        reader.onload = (e) => loadImageSource(e.target.result, 'Afbeelding geladen. Kies een gereedschap om te beginnen.');
        reader.readAsDataURL(file);
    }

    function loadImageSource(source, message) {
            originalImage = new Image();
            originalImage.onload = () => {
                const aspectRatio = originalImage.width / originalImage.height;
                const canvasWidth = 400;
                const canvasHeight = canvasWidth / aspectRatio;
                canvasOrigineel.width = canvasVerschillen.width = canvasWidth;
                canvasOrigineel.height = canvasVerschillen.height = canvasHeight;
                ctxOrigineel.drawImage(originalImage, 0, 0, canvasWidth, canvasHeight);
                ctxVerschillen.drawImage(originalImage, 0, 0, canvasWidth, canvasHeight);
                resetApplicationStateAfterUpload();
                statusText.textContent = message;
            };
            originalImage.onerror = () => { statusText.textContent = 'Deze kleurplaat kon niet worden geladen. Probeer een andere.'; };
            originalImage.src = source;
    }

    function loadImagePair(originalSource, differentSource, message) {
        const left = new Image(), right = new Image();
        Promise.all([new Promise((resolve,reject)=>{left.onload=resolve;left.onerror=reject;left.src=originalSource;}),new Promise((resolve,reject)=>{right.onload=resolve;right.onerror=reject;right.src=differentSource;})]).then(()=>{
            originalImage = left;
            const width = 400, height = width / (left.width / left.height);
            canvasOrigineel.width = canvasVerschillen.width = width; canvasOrigineel.height = canvasVerschillen.height = height;
            ctxOrigineel.drawImage(left,0,0,width,height); ctxVerschillen.drawImage(right,0,0,width,height);
            resetApplicationStateAfterUpload(); statusText.textContent = message;
        }).catch(()=>{statusText.textContent='De automatische verschillen konden niet worden geladen.';});
    }

    function resetApplicationStateAfterUpload() {
        undoStack = []; saveState();
        undoBtn.disabled = true;
        downloadPngBtn.disabled = false;
        downloadPdfBtn.disabled = false;
        transformableObject = null; clipboardObject = null; transformAction = 'none';
        selectionToolsDiv.style.display = 'none';
        plakkenBtn.disabled = true;
        clipboardPreviewContainer.classList.add('hidden');
    }

    function getCursorForTool(tool) {
        switch (tool) {
            case 'potlood': return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpath fill='black' stroke='white' stroke-width='1.5' d='M26.75 5.25L22.75 1.25C22.5 1 22.25 1 22 1.25L19 4.25L23.75 9L26.75 6C27 5.75 27 5.5 26.75 5.25Z'/%3E%3Cpath fill='black' stroke='white' stroke-width='1' d='M18.25 5L3.25 20C3 20.25 3 20.5 3.25 20.75L7.25 24.75C7.5 25 7.75 25 8 24.75L23 9.75L18.25 5Z'/%3E%3Cpath fill='rgba(0,0,0,0.5)' d='M3.25 20L8 24.75L7.25 21.5L3.25 20Z'/%3E%3C/svg%3E") 4 24, auto`;
            case 'cirkel': case 'rechthoek': case 'lijn': return 'crosshair';
            case 'gum': return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 18 18'%3E%3Ccircle cx='9' cy='9' r='7' fill='none' stroke='black' stroke-width='1.5'/%3E%3C/svg%3E") 9 9, auto`;
            case 'pipet': case 'opvulemmer': return 'crosshair';
            default: return 'default';
        }
    }
    
    function getMousePos(canvas, evt) {
        const rect = canvas.getBoundingClientRect();
        return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    }
    
    function getTransformHandles(obj) {
        const w = obj.width * obj.scale;
        const h = obj.height * obj.scale;
        const halfW = w / 2;
        const halfH = h / 2;
        const corners = [
            { x: -halfW, y: -halfH }, { x: halfW, y: -halfH },
            { x: halfW, y: halfH }, { x: -halfW, y: halfH }
        ].map(p => {
            const rotatedX = p.x * Math.cos(obj.rotation) - p.y * Math.sin(obj.rotation);
            const rotatedY = p.x * Math.sin(obj.rotation) + p.y * Math.cos(obj.rotation);
            return { x: rotatedX + obj.x, y: rotatedY + obj.y };
        });
        const rotationHandle = {
            x: -Math.sin(obj.rotation) * (halfH + 20) + obj.x,
            y: Math.cos(obj.rotation) * (halfH + 20) + obj.y,
        };
        return { corners, rotationHandle };
    }

    function drawTransformableObject() {
        if (!transformableObject || transformableObject.x < 0) return;
        const { type, x, y, scale, rotation, width, height, imageData, color, thickness } = transformableObject;
        
        ctxVerschillen.save();
        ctxVerschillen.translate(x, y);
        ctxVerschillen.rotate(rotation);
        ctxVerschillen.scale(scale, scale);

        setDrawingStyle();
        ctxVerschillen.strokeStyle = color || currentColor;
        ctxVerschillen.lineWidth = thickness || dikteInput.value;

        switch (type) {
            case 'imageData':
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = width;
                tempCanvas.height = height;
                tempCanvas.getContext('2d').putImageData(imageData, 0, 0);
                ctxVerschillen.drawImage(tempCanvas, -width / 2, -height / 2, width, height);
                break;
            case 'rechthoek':
                ctxVerschillen.strokeRect(-width / 2, -height / 2, width, height);
                break;
            case 'cirkel':
                ctxVerschillen.beginPath();
                ctxVerschillen.arc(0, 0, width / 2, 0, 2 * Math.PI);
                ctxVerschillen.stroke();
                break;
            case 'lijn':
                 ctxVerschillen.beginPath();
                 ctxVerschillen.moveTo(-width / 2, 0);
                 ctxVerschillen.lineTo(width / 2, 0);
                 ctxVerschillen.stroke();
                break;
        }
        ctxVerschillen.restore();
    }


    function drawTransformHandles() {
        if (!transformableObject || transformableObject.x < 0) return;
        const handles = getTransformHandles(transformableObject);
        ctxVerschillen.save();
        ctxVerschillen.strokeStyle = '#007bff';
        ctxVerschillen.fillStyle = 'white';
        ctxVerschillen.lineWidth = 1;
        ctxVerschillen.beginPath();
        ctxVerschillen.moveTo(handles.corners[0].x, handles.corners[0].y);
        for (let i = 1; i < handles.corners.length; i++) {
            ctxVerschillen.lineTo(handles.corners[i].x, handles.corners[i].y);
        }
        ctxVerschillen.closePath();
        ctxVerschillen.stroke();
        ctxVerschillen.beginPath();
        const topMidX = (handles.corners[0].x + handles.corners[1].x) / 2;
        const topMidY = (handles.corners[0].y + handles.corners[1].y) / 2;
        ctxVerschillen.moveTo(topMidX, topMidY);
        ctxVerschillen.lineTo(handles.rotationHandle.x, handles.rotationHandle.y);
        ctxVerschillen.stroke();
        handles.corners.forEach(p => {
            ctxVerschillen.fillRect(p.x - 4, p.y - 4, 8, 8);
            ctxVerschillen.strokeRect(p.x - 4, p.y - 4, 8, 8);
        });
        ctxVerschillen.beginPath();
        ctxVerschillen.arc(handles.rotationHandle.x, handles.rotationHandle.y, 5, 0, 2 * Math.PI);
        ctxVerschillen.fill();
        ctxVerschillen.stroke();
        ctxVerschillen.restore();
    }

    function getActionForPoint(pos) {
        if (!transformableObject || transformableObject.x < 0) return 'none';
        const handles = getTransformHandles(transformableObject);
        if (Math.hypot(pos.x - handles.rotationHandle.x, pos.y - handles.rotationHandle.y) < 10) return 'rotate';
        for(let i=0; i<handles.corners.length; i++) {
            if (Math.hypot(pos.x - handles.corners[i].x, pos.y - handles.corners[i].y) < 10) return 'scale';
        }
        let inside = false;
        for (let i = 0, j = handles.corners.length - 1; i < handles.corners.length; j = i++) {
            const xi = handles.corners[i].x, yi = handles.corners[i].y;
            const xj = handles.corners[j].x, yj = handles.corners[j].y;
            const intersect = ((yi > pos.y) !== (yj > pos.y)) && (pos.x < (xj - xi) * (pos.y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        if (inside) return 'move';
        return 'none';
    }
    
    function handleCursorUpdate(e) {
        if (transformAction !== 'none' || isDrawing || isPlacingNewObject) return;
        const pos = getMousePos(canvasVerschillen, e);
        const action = getActionForPoint(pos);
        switch(action) {
            case 'move': canvasVerschillen.style.cursor = 'move'; break;
            case 'scale': canvasVerschillen.style.cursor = 'nwse-resize'; break;
            case 'rotate': canvasVerschillen.style.cursor = `url('data:image/svg+xml;charset=utf8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Cpath d="M24.73,12.24a1,1,0,0,0-1.41,0l-2,2a1,1,0,0,0,1.41,1.41l2-2A1,1,0,0,0,24.73,12.24Z" fill="%23000000"/%3E%3Cpath d="M16.5,2A10.5,10.5,0,0,0,6.23,19.34l-1.35-1.35a1,1,0,0,0-1.41,1.41l3.09,3.09a1,1,0,0,0,.7.29h.1a1,1,0,0,0,.71-.29l3.09-3.09a1,1,0,0,0-1.41-1.41L8.23,19.1A8.5,8.5,0,1,1,16.5,28.5a1,1,0,0,0,0,2,10.5,10.5,0,0,0,0-21Z" fill="%23000000"/%3E%3C/svg%3E') 16 16, auto`; break;
            default: canvasVerschillen.style.cursor = getCursorForTool(currentTool);
        }
    }
    
    function redrawCanvasWithTransformableObject() {
        if (!transformableObject) return;
        restoreState(undoStack[undoStack.length - 1]);
        drawTransformableObject();
        if (transformableObject.x > -1) {
            drawTransformHandles();
        }
    }

    function stampTransformableObject() {
        if (!transformableObject || transformableObject.x < 0) return;
        restoreState(undoStack[undoStack.length - 1]);
        drawTransformableObject();
        transformableObject = null;
        transformAction = 'none';
        saveState();
        statusText.textContent = 'Object vastgezet.';
        canvasVerschillen.style.cursor = 'default';
    }

    function startAction(e) {
        const pos = getMousePos(canvasVerschillen, e);
        transformAction = getActionForPoint(pos);
        if (transformAction !== 'none') {
            dragStart = pos; return;
        }
        
        stampTransformableObject();
        if (!originalImage) return;

        if (currentTool === 'pipet') {
            const p = ctxVerschillen.getImageData(pos.x, pos.y, 1, 1).data;
            currentColor = rgbToHex(p[0], p[1], p[2]);
            updateColorDisplay();
            document.querySelector('.tool-btn[data-tool="potlood"]').click();
            return;
        }
        
        if (currentTool === 'opvulemmer') {
            floodFill(pos.x, pos.y);
            saveState();
            return;
        }

        if (currentTool === 'tekst') {
            const leftText = textOriginal.value.trim();
            const rightText = textDifferent.value.trim();
            if (!leftText && !rightText) { statusText.textContent = 'Vul eerst tekst voor links of rechts in.'; textDifferent.focus(); return; }
            const size = Math.max(10, Math.min(60, Number(textSize.value) || 24));
            [ctxOrigineel, ctxVerschillen].forEach(ctx => { ctx.save(); ctx.font = `bold ${size}px Arial`; ctx.fillStyle = currentColor; ctx.textBaseline = 'top'; });
            if (leftText) ctxOrigineel.fillText(leftText, pos.x, pos.y);
            if (rightText) ctxVerschillen.fillText(rightText, pos.x, pos.y);
            ctxOrigineel.restore(); ctxVerschillen.restore(); saveState();
            statusText.textContent = 'Tekst toegevoegd. Klik opnieuw om dezelfde tekst nogmaals te plaatsen.';
            return;
        }

        isDrawing = true;
        startX = pos.x;
        startY = pos.y;
        
        if (['potlood', 'gum'].includes(currentTool)) {
            saveState();
        }
    }

    function moveAction(e) {
        if (isPlacingNewObject && transformableObject) {
            const pos = getMousePos(canvasVerschillen, e);
            transformableObject.x = pos.x;
            transformableObject.y = pos.y;
            redrawCanvasWithTransformableObject();
            return;
        }
        if (transformAction !== 'none' && transformableObject) {
            const pos = getMousePos(canvasVerschillen, e);
            if (transformAction === 'move') {
                transformableObject.x += pos.x - dragStart.x;
                transformableObject.y += pos.y - dragStart.y;
            } else if (transformAction === 'rotate') {
                const angle = Math.atan2(pos.y - transformableObject.y, pos.x - transformableObject.x);
                const startAngle = Math.atan2(dragStart.y - transformableObject.y, dragStart.x - transformableObject.x);
                transformableObject.rotation += angle - startAngle;
            } else if (transformAction === 'scale') {
                const dist = Math.hypot(pos.x - transformableObject.x, pos.y - transformableObject.y);
                const startDist = Math.hypot(dragStart.x - transformableObject.x, dragStart.y - transformableObject.y);
                if (startDist > 0) transformableObject.scale *= dist / startDist;
            }
            dragStart = pos;
            redrawCanvasWithTransformableObject();
            return;
        }

        if (!isDrawing) return;
        const pos = getMousePos(canvasVerschillen, e);
        
        if (['lijn', 'rechthoek', 'cirkel', 'select'].includes(currentTool)) {
            restoreState(undoStack[undoStack.length - 1]);
        }

        setDrawingStyle();
        switch (currentTool) {
            case 'potlood': draw(pos.x, pos.y); startX = pos.x; startY = pos.y; break;
            case 'gum': erase(pos.x, pos.y); break;
            case 'select': drawSelectionRectangle(pos.x, pos.y); break;
            case 'lijn': drawLine(pos.x, pos.y); break;
            case 'rechthoek': drawRectangle(pos.x, pos.y); break;
            case 'cirkel': drawCircle(pos.x, pos.y); break;
        }
    }

    function endAction(e) {
        if (isPlacingNewObject && transformableObject) {
            isPlacingNewObject = false;
            statusText.textContent = 'Object geplaatst. Verplaats, roteer of schaal het. Klik ernaast om vast te zetten.';
            handleCursorUpdate(e);
            return;
        }
        if (transformAction !== 'none') {
            transformAction = 'none';
            return;
        }
        if (!isDrawing) return;
        isDrawing = false;
        
        const pos = getMousePos(canvasVerschillen, e);
        
        if (['potlood', 'gum'].includes(currentTool)) {
            undoStack.pop();
            saveState();
        } else if (['lijn', 'rechthoek', 'cirkel'].includes(currentTool)) {
            restoreState(undoStack[undoStack.length - 1]);
            const endX = pos.x, endY = pos.y;
            const centerX = (startX + endX) / 2;
            const centerY = (startY + endY) / 2;
            let width = Math.abs(startX - endX);
            let height = Math.abs(startY - endY);

            transformableObject = {
                type: currentTool,
                x: centerX,
                y: centerY,
                scale: 1,
                color: currentColor,
                thickness: dikteInput.value,
            };

            if (currentTool === 'lijn') {
                transformableObject.width = Math.hypot(endX - startX, endY - startY);
                transformableObject.height = parseFloat(dikteInput.value);
                transformableObject.rotation = Math.atan2(endY - startY, endX - startX);
            } else if (currentTool === 'rechthoek') {
                transformableObject.width = width;
                transformableObject.height = height;
                transformableObject.rotation = 0;
            } else if (currentTool === 'cirkel') {
                const radius = Math.hypot(endX - startX, endY - startY) / 2;
                transformableObject.x = startX + (endX - startX) / 2;
                transformableObject.y = startY + (endY - startY) / 2;
                transformableObject.width = radius * 2;
                transformableObject.height = radius * 2;
                transformableObject.rotation = 0;
            }
            
            saveState();
            redrawCanvasWithTransformableObject();
            statusText.textContent = 'Vorm geplaatst. Verplaats, roteer of schaal. Klik ernaast om vast te zetten.';

        } else if (currentTool === 'select') {
             restoreState(undoStack[undoStack.length - 1]);
            if (selectionRect && selectionRect.width > 1 && selectionRect.height > 1) {
                openEditModalWithSelection();
            }
            selectionRect = null;
        }
    }

    function setDrawingStyle() {
        ctxVerschillen.strokeStyle = currentColor;
        ctxVerschillen.fillStyle = currentColor;
        ctxVerschillen.lineWidth = dikteInput.value;
        ctxVerschillen.lineCap = 'round';
        ctxVerschillen.lineJoin = 'round';
    }
    
    function draw(x, y) { ctxVerschillen.beginPath(); ctxVerschillen.moveTo(startX, startY); ctxVerschillen.lineTo(x, y); ctxVerschillen.stroke(); }

    function erase(x, y) {
        const size = parseFloat(dikteInput.value);
        const halfSize = size / 2;
        const shape = gumvormSelect.value;
        ctxVerschillen.save();
        ctxVerschillen.fillStyle = 'white';
        ctxVerschillen.beginPath();
        if (shape === 'rond') {
            ctxVerschillen.arc(x, y, halfSize, 0, Math.PI * 2);
        } else {
            ctxVerschillen.rect(x - halfSize, y - halfSize, size, size);
        }
        ctxVerschillen.fill();
        ctxVerschillen.restore();
    }
    
    function drawLine(endX, endY) { ctxVerschillen.beginPath(); ctxVerschillen.moveTo(startX, startY); ctxVerschillen.lineTo(endX, endY); ctxVerschillen.stroke(); }
    function drawRectangle(endX, endY) { ctxVerschillen.strokeRect(startX, startY, endX - startX, endY - startY); }
    function drawCircle(endX, endY) { const radius = Math.hypot(endX - startX, endY - startY) / 2; ctxVerschillen.beginPath(); ctxVerschillen.arc(startX + (endX - startX) / 2, startY + (endY - startY) / 2, radius, 0, 2 * Math.PI); ctxVerschillen.stroke(); }
    function drawSelectionRectangle(endX, endY) { selectionRect = { x: Math.min(startX, endX), y: Math.min(startY, endY), width: Math.abs(startX - endX), height: Math.abs(startY - endY) }; ctxVerschillen.save(); ctxVerschillen.strokeStyle = '#555'; ctxVerschillen.lineWidth = 1; ctxVerschillen.setLineDash([5, 5]); ctxVerschillen.strokeRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height); ctxVerschillen.restore(); }

    function floodFill(startX, startY) {
        const w = canvasVerschillen.width;
        const h = canvasVerschillen.height;
        const imageData = ctxVerschillen.getImageData(0, 0, w, h);
        const data = imageData.data;
        const stack = [[Math.floor(startX), Math.floor(startY)]];
        const startPos = (Math.floor(startY) * w + Math.floor(startX)) * 4;
        const startR = data[startPos];
        const startG = data[startPos + 1];
        const startB = data[startPos + 2];
        const fillR = parseInt(currentColor.slice(1, 3), 16);
        const fillG = parseInt(currentColor.slice(3, 5), 16);
        const fillB = parseInt(currentColor.slice(5, 7), 16);
        const tolerance = 45;

        if (Math.abs(startR - fillR) < 5 && Math.abs(startG - fillG) < 5 && Math.abs(startB - fillB) < 5) {
            return;
        }

        const visited = new Uint8Array(w * h);
        while (stack.length > 0) {
            const [x, y] = stack.pop();
            const index = y * w + x;
            if (visited[index]) {
                continue;
            }
            const currentPos = index * 4;
            if (Math.abs(data[currentPos] - startR) <= tolerance &&
                Math.abs(data[currentPos + 1] - startG) <= tolerance &&
                Math.abs(data[currentPos + 2] - startB) <= tolerance) {
                data[currentPos] = fillR;
                data[currentPos + 1] = fillG;
                data[currentPos + 2] = fillB;
                data[currentPos + 3] = 255;
                visited[index] = 1;
                if (x > 0) stack.push([x - 1, y]);
                if (x < w - 1) stack.push([x + 1, y]);
                if (y > 0) stack.push([x, y - 1]);
                if (y < h - 1) stack.push([x, y + 1]);
            }
        }
        ctxVerschillen.putImageData(imageData, 0, 0);
    }

    function openEditModalWithSelection() {
        if (selectionRect && selectionRect.width > 0 && selectionRect.height > 0) {
            let imageData = ctxVerschillen.getImageData(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height);
            editCanvas.width = selectionRect.width; editCanvas.height = selectionRect.height;
            ctxEdit.putImageData(imageData, 0, 0);
            editUndoStack = []; saveEditState();
            editModalOverlay.classList.remove('hidden');
            statusText.textContent = 'Bewerk de selectie in de pop-up.';
        }
    }

    function eraseOnEditCanvas(e) {
        const rect = editCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctxEdit.clearRect(x - 5, y - 5, 10, 10);
    }

    // AANGEPAST: Deze functie slaat nu op naar een apart klembord-object.
    function saveSelectionToClipboard() {
        let editedImageData = ctxEdit.getImageData(0, 0, editCanvas.width, editCanvas.height);
        if (transparentBgCheckbox.checked) {
            const data = editedImageData.data;
            const bgR = data[0], bgG = data[1], bgB = data[2];
            const tolerance = 10;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i+1], b = data[i+2];
                if (Math.abs(r - bgR) < tolerance && Math.abs(g - bgG) < tolerance && Math.abs(b - bgB) < tolerance) {
                    data[i + 3] = 0;
                }
            }
        }
        transparentBgCheckbox.checked = false;
        editModalOverlay.classList.add('hidden');
        clipboardCanvas.width = editedImageData.width; clipboardCanvas.height = editedImageData.height;
        ctxClipboard.putImageData(editedImageData, 0, 0);
        
        selectionToolsDiv.style.display = 'flex';
        clipboardPreviewContainer.classList.remove('hidden');
        plakkenBtn.disabled = false;
        
        clipboardObject = { 
            type: 'imageData',
            imageData: editedImageData, 
            width: editedImageData.width, 
            height: editedImageData.height
        };
        statusText.textContent = 'Selectie opgeslagen op klembord. Klik op "Plakken" om het in de afbeelding te plaatsen.';
    }

    // NIEUW: Functie om het object van het klembord op de canvas te plakken.
    function pasteFromClipboard() {
        if (!clipboardObject) return;

        // Zet een eventueel al actief object eerst vast.
        stampTransformableObject();

        transformableObject = {
            ...clipboardObject, // Kopieer data van klembord
            x: canvasVerschillen.width / 2, // Start in het midden
            y: canvasVerschillen.height / 2,
            scale: 1,
            rotation: 0
        };

        saveState(); // Sla staat op voor de 'plak' actie
        redrawCanvasWithTransformableObject();
        statusText.textContent = 'Object geplakt. Verplaats, roteer of schaal het. Klik ernaast om vast te zetten.';
    }

    function transformEditCanvas(scaleX, scaleY) {
        const imageData = ctxEdit.getImageData(0, 0, editCanvas.width, editCanvas.height);
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = editCanvas.width; tempCanvas.height = editCanvas.height;
        tempCanvas.getContext('2d').putImageData(imageData, 0, 0);
        ctxEdit.clearRect(0, 0, editCanvas.width, editCanvas.height);
        ctxEdit.save();
        ctxEdit.translate(scaleX === -1 ? editCanvas.width : 0, scaleY === -1 ? editCanvas.height : 0);
        ctxEdit.scale(scaleX, scaleY);
        ctxEdit.drawImage(tempCanvas, 0, 0);
        ctxEdit.restore();
    }

    function saveState() {
        if (undoStack.length >= MAX_UNDO_STATES) { undoStack.shift(); }
        undoStack.push({
            original: ctxOrigineel.getImageData(0, 0, canvasOrigineel.width, canvasOrigineel.height),
            different: ctxVerschillen.getImageData(0, 0, canvasVerschillen.width, canvasVerschillen.height)
        });
        undoBtn.disabled = undoStack.length <= 1;
    }

    function restoreState(state) {
        if (!state) return;
        if (state.original && state.different) { ctxOrigineel.putImageData(state.original, 0, 0); ctxVerschillen.putImageData(state.different, 0, 0); }
        else { ctxVerschillen.putImageData(state, 0, 0); }
    }

    function doUndo() {
        transformableObject = null; transformAction = 'none';
        if (undoStack.length > 1) {
            undoStack.pop();
            const prevState = undoStack[undoStack.length - 1];
            restoreState(prevState);
            undoBtn.disabled = undoStack.length <= 1;
            statusText.textContent = 'Laatste actie ongedaan gemaakt.';
        }
    }

    function saveEditState() {
        if (editUndoStack.length >= MAX_UNDO_STATES) { editUndoStack.shift(); }
        editUndoStack.push(ctxEdit.getImageData(0, 0, editCanvas.width, editCanvas.height));
        editUndoBtn.disabled = editUndoStack.length <= 1;
    }

    function restoreEditState(imageData) {
        if (imageData) {
            ctxEdit.putImageData(imageData, 0, 0);
        }
    }

    function doEditUndo() {
        if (editUndoStack.length > 1) {
            editUndoStack.pop();
            restoreEditState(editUndoStack[editUndoStack.length - 1]);
            editUndoBtn.disabled = editUndoStack.length <= 1;
        }
    }

    function downloadPuzzel(format, solutionMode = false) {
        stampTransformableObject();
        if (format === 'pdf') {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageWidth = 210, pageHeight = 297, margin = 16;
            const titleBase = worksheetTitle?.value.trim() || 'Zoek de verschillen';
            const title = solutionMode ? `Oplossing - ${titleBase}` : titleBase;
            const instruction = solutionMode ? 'De verschillen zijn omcirkeld in de tweede afbeelding.' : (worksheetInstruction?.value.trim() || `Zoek de ${differenceCount?.value || 7} verschillen.`);
            const exportDifferenceCanvas = solutionMode ? createSolutionCanvas() : canvasVerschillen;

            doc.setTextColor(55, 55, 65);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10.5);
            doc.text('Naam: __________________________________', margin, 15);
            doc.text('Datum: __________________', pageWidth - margin, 15, { align: 'right' });
            doc.setDrawColor(185, 190, 202);
            doc.line(margin, 20, pageWidth - margin, 20);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(20);
            doc.setTextColor(35, 74, 128);
            const titleLines = doc.splitTextToSize(title, pageWidth - (margin * 2));
            doc.text(titleLines, pageWidth / 2, 31, { align: 'center' });
            const instructionY = 31 + (titleLines.length * 7) + 2;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(50, 50, 58);
            const instructionLines = doc.splitTextToSize(instruction, pageWidth - (margin * 2));
            doc.text(instructionLines, margin, instructionY);

            const imageTop = instructionY + (instructionLines.length * 5.2) + 7;
            const imageGap = 9;
            const availableWidth = pageWidth - (margin * 2);
            const contentHeight = pageHeight - imageTop - 17;
            const ratio = canvasOrigineel.width / canvasOrigineel.height;
            const placeUnderEachOther = ratio >= 1;
            const maxImageWidth = placeUnderEachOther ? availableWidth : (availableWidth - imageGap) / 2;
            const maxImageHeight = placeUnderEachOther ? (contentHeight - imageGap) / 2 : contentHeight;
            const scale = Math.min(maxImageWidth / canvasOrigineel.width, maxImageHeight / canvasOrigineel.height);
            const imageWidth = canvasOrigineel.width * scale;
            const imageHeight = canvasOrigineel.height * scale;
            const firstX = placeUnderEachOther ? (pageWidth - imageWidth) / 2 : margin + ((maxImageWidth - imageWidth) / 2);
            const firstY = imageTop + (placeUnderEachOther ? 0 : (contentHeight - imageHeight) / 2);
            const secondX = placeUnderEachOther ? firstX : margin + maxImageWidth + imageGap + ((maxImageWidth - imageWidth) / 2);
            const secondY = placeUnderEachOther ? firstY + imageHeight + imageGap : firstY;
            doc.setDrawColor(55, 92, 132);
            doc.setLineWidth(.45);
            doc.addImage(canvasOrigineel.toDataURL('image/png'), 'PNG', firstX, firstY, imageWidth, imageHeight);
            doc.rect(firstX, firstY, imageWidth, imageHeight);
            doc.addImage(exportDifferenceCanvas.toDataURL('image/png'), 'PNG', secondX, secondY, imageWidth, imageHeight);
            doc.rect(secondX, secondY, imageWidth, imageHeight);

            doc.setFontSize(8);
            doc.setTextColor(145, 145, 150);
            doc.text("juf Zisa's werkbladgenerator - www.jufzisa.be", pageWidth / 2, 291, { align: 'center' });
            doc.save(solutionMode ? 'oplossing-zoek-de-verschillen.pdf' : 'zoek-de-verschillen-puzzel.pdf');
        } else {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            const gap = 20;
            tempCanvas.width = canvasOrigineel.width * 2 + gap; tempCanvas.height = canvasOrigineel.height;
            tempCtx.fillStyle = 'white';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.drawImage(canvasOrigineel, 0, 0);
            tempCtx.drawImage(canvasVerschillen, canvasOrigineel.width + gap, 0);
            const a = document.createElement('a');
            a.href = tempCanvas.toDataURL('image/png');
            a.download = 'zoek-de-verschillen-puzzel.png';
            a.click();
        }
    }
});
